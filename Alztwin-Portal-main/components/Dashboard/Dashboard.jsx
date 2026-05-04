import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../ThemeContext";
import axios from "axios";
import JSZip from "jszip";
import {
  Search,
  Bell,
  Settings,
  LogOut,
  Users,
  Activity,
  Brain,
  Calendar,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Eye,
  UserPlus,
  CheckCircle,
  XCircle,
  X,
  Thermometer,
  Heart,
  Smartphone,
  ImageIcon,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  MessageSquare,
  Clock,
  FileText,
  Save,
  Clipboard,
  Pill,
  Stethoscope,
  AlertTriangle,
  ChevronRight,
  Play,
  BarChart3,
  Zap,
  Shield,
  Star,
  MapPin,
  Mail,
  CalendarPlus,
  Send,
  Download,
  Upload,
  Waves,
  Radio,
  Target,
  Layers,
  Box,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Maximize2,
  RefreshCw,
  Wifi,
  BellRing,
  AlertCircle,
  Info,
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  Footprints,
  Droplets,
  Wind,
  Moon,
  Sun,
  Battery,
  Gauge,
  LineChart,
  PieChart,
  FileDown,
  Share2,
  Link2,
  ExternalLink,
  History,
  Archive,
  Bookmark,
  Tag,
} from "lucide-react";
// --- FIREBASE IMPORTS ---
import { db } from "../../firebase";
import {
  collection,
  getDoc,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  where,
} from "firebase/firestore";
import {
  getClinicianPendingRequests,
  getClinicianAllRequests,
  acceptPatientRequest,
  rejectPatientRequest,
  getClinicianConsultations,
  createConsultationSession,
  updateConsultationStatus,
  sendSignalingData,
  subscribeToSignalingData,
  getPatientCognitiveTestsByType,
} from "../../services/userService";
import {
  formatDate,
  base64ToBlob,
  API_STAGE_URL,
  API_PROGRESSION_URL,
  API_3D_MODEL_URL,
  STAGE_LEVEL_MAP,
  deriveRiskFromStage,
  mapStageToTrajectory,
} from "./config";
import {
  RAFAY_PATIENT_ID,
  RAFAY_PATIENT_NAME,
  RAFAY_SENSOR_MOCK_READINGS,
  SENSOR_DISPLAY_FIELDS,
  SENSOR_HISTORY_DAYS,
  SENSOR_SEED_VERSION,
} from "../../data/wearableDeviceDataMock";
import MriComparisonCharts from "./MriComparisonCharts";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopBar from "./DashboardTopBar";
import RequestsSection from "./sections/RequestsSection";
import DigitalTwinSection from "./sections/DigitalTwinSection";
import TeleconsultationSection from "./sections/TeleconsultationSection";
import PatientsSection from "./sections/PatientsSection";
import CognitiveTestsSection from "./sections/CognitiveTestsSection";

const QUOTA_ERROR_PATTERN =
  /quota|rate[- ]?limit|resource exhausted|generate_content_free_tier|429|billing/i;

const pickReadableText = (...values) => {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (!text || text === "[object Object]" || QUOTA_ERROR_PATTERN.test(text)) {
      continue;
    }
    return text;
  }
  return null;
};

const getStageInferenceText = (payload = {}) =>
  pickReadableText(
    payload.explanation,
    payload.inference,
    payload.ai_inference,
    payload.message,
    payload.details
  );

const getTrajectoryInferenceText = (payload = {}) =>
  pickReadableText(
    payload.explanation,
    payload.inference,
    payload.ai_inference,
    payload.message,
    payload.details
  );

const getApiErrorText = (error) => {
  const data = error?.response?.data;
  return pickReadableText(data?.error, data?.message, error?.message);
};

const isRafayPatient = (patientId, data = {}) => {
  const haystack = [patientId, data.patientId, data.name, data.email]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    patientId === RAFAY_PATIENT_ID ||
    data.patientId === RAFAY_PATIENT_ID ||
    haystack.includes(RAFAY_PATIENT_NAME.toLowerCase())
  );
};

const wearableTimeToMs = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (value.seconds) return value.seconds * 1000;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatSensorDateKey = (date) => date.toISOString().slice(0, 10);

const formatPatientLogTimestamp = (timestampMs) => {
  const date = new Date(timestampMs);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const formatPatientLogDocId = (timestampMs) =>
  formatPatientLogTimestamp(timestampMs).replace(" ", "_").replaceAll(":", "-");

const getSensorDateKeys = (days = SENSOR_HISTORY_DAYS) => {
  const keys = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    keys.push(formatSensorDateKey(date));
  }
  return keys;
};

const normalizeSensorReading = (record = {}) => {
  const timestampMs = Number(
    record.timestampMs ||
      wearableTimeToMs(record.timestamp) ||
      wearableTimeToMs(record.createdAt)
  );
  const outOfBound = record.outOfBound === 1 || record.outOfBound === true ? 1 : 0;
  return SENSOR_DISPLAY_FIELDS.reduce(
    (acc, field) => {
      acc[field] = record[field] ?? (field === "bpm" ? 0 : false);
      return acc;
    },
    {
      timestampMs,
      dateKey:
        record.dateKey ||
        (timestampMs ? formatSensorDateKey(new Date(timestampMs)) : null),
      outOfBound,
    }
  );
};

const isRafayLogRecord = (record = {}) => {
  const keys = [
    record.patientDocId,
    record.patientId,
    record.patientName,
    record.name,
    record.email,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return !keys || keys.includes(RAFAY_PATIENT_NAME.toLowerCase()) || keys.includes(RAFAY_PATIENT_ID);
};

const normalizeSensorDataMap = (records = []) =>
  [...records]
    .map(normalizeSensorReading)
    .sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0))
    .reduce((acc, record, index) => {
      const key = String(record.timestampMs || index + 1);
      acc[key] = record;
      return acc;
    }, {});

const getOutOfBoundSummary = (records = []) => {
  const now = Date.now();
  const countForDays = (days) => {
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return records.reduce((sum, record) => {
      const ts = Number(record.timestampMs || 0);
      const inWindow = ts === 0 || ts >= cutoff;
      return sum + (inWindow && record.outOfBound ? 1 : 0);
    }, 0);
  };

  return {
    sevenDayCount: countForDays(7),
    fourteenDayCount: countForDays(14),
    totalReadings: records.length,
  };
};

const getLatestSensorRecord = (deviceData = {}) => {
  if (!deviceData || typeof deviceData !== "object") return null;
  const keys = Object.keys(deviceData);
  if (keys.length === 0) return null;
  const sorted = [...keys].sort((a, b) => {
    const na = parseInt(a.replace(/^\D+/g, ""), 10) || 0;
    const nb = parseInt(b.replace(/^\D+/g, ""), 10) || 0;
    return na - nb;
  });
  const latest = deviceData[sorted[sorted.length - 1]];
  return latest && typeof latest === "object" && !Array.isArray(latest)
    ? latest
    : deviceData;
};

const formatSensorTimestamp = (record) => {
  if (!record) return "No sync yet";
  const ms = Number(record.timestampMs || wearableTimeToMs(record.updatedAt));
  if (!ms) return "No sync yet";
  return new Date(ms).toLocaleString();
};

const sensorValue = (value, fallback = "—") =>
  value === null || value === undefined || value === "" ? fallback : value;

const toPatientLogRecord = (reading, patientDocId, patientData = {}) => ({
  bpm: reading.bpm,
  fall: reading.fall,
  latitude: reading.latitude,
  longitude: reading.longitude,
  outOfZone: reading.outOfZone,
  outOfBound: reading.outOfBound,
  pitch: reading.pitch,
  roll: reading.roll,
  sleeping: reading.sleeping,
  timestamp: formatPatientLogTimestamp(reading.timestampMs),
  timestampMs: reading.timestampMs,
  dateKey: reading.dateKey,
  patientDocId,
  patientId: patientData.patientId || patientDocId,
  patientName: patientData.name || RAFAY_PATIENT_NAME,
  isMockData: true,
  seedVersion: SENSOR_SEED_VERSION,
  updatedAt: serverTimestamp(),
});

const ensureRafayPatientLogSeed = async (patientDocId, patientData = {}) => {
  if (!isRafayPatient(patientDocId, patientData)) return false;

  const latestSeedRef = doc(
    db,
    "patient_logs",
    formatPatientLogDocId(RAFAY_SENSOR_MOCK_READINGS[0].timestampMs)
  );
  const latestSeedSnap = await getDoc(latestSeedRef);
  if (latestSeedSnap.exists() && latestSeedSnap.data()?.seedVersion === SENSOR_SEED_VERSION) {
    return false;
  }

  await Promise.all(
    RAFAY_SENSOR_MOCK_READINGS.map((reading) =>
      setDoc(
        doc(db, "patient_logs", formatPatientLogDocId(reading.timestampMs)),
        toPatientLogRecord(reading, patientDocId, patientData),
        { merge: true }
      )
    )
  );

  return true;
};

const loadRafayPatientLogs = async (patientDocId, patientData = {}) => {
  if (!isRafayPatient(patientDocId, patientData)) return [];

  const logSnap = await getDocs(
    query(collection(db, "patient_logs"), orderBy("timestamp", "desc"))
  );

  return logSnap.docs
    .map((logDoc) => ({ id: logDoc.id, ...logDoc.data() }))
    .filter(isRafayLogRecord);
};

const ensureRafaySensorSeed = async (patientDocId, patientData = {}) => {
  if (!isRafayPatient(patientDocId, patientData)) return false;

  return ensureRafayPatientLogSeed(patientDocId, patientData);
};

const Dashboard = ({ user, onLogout }) => {
  const { isLight } = useTheme();
  const fileInputRef = useRef(null); // Reference for hidden input
  const [uploading, setUploading] = useState(false); // Loading state for upload
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [activeSection, setActiveSection] = useState("patients"); // 'patients', 'requests', 'digitalTwin', 'teleconsultation'
  const [selectedPatientForDT, setSelectedPatientForDT] = useState(null); // For Digital Twin view
  
  // Data State
  const [patients, setPatients] = useState([]); // Stores Real DB Data
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]); // All requests including accepted/rejected
  const [requestsFilter, setRequestsFilter] = useState("all"); // 'all', 'pending', 'accepted', 'rejected'
  
  // Modal/Detail State
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);

  // AI Analysis History State
  const [aiHistory, setAiHistory] = useState([]); // All past runs, newest first
  const [compareWithId, setCompareWithId] = useState(null); // Selected prior run to compare against
  
  // Loading States
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);   // AI diagnostics only
  const [generating3D, setGenerating3D] = useState(false); // 3D mesh generation only

  // Digital Twin AI analysis history (separate from patient-modal history)
  const [dtAiHistory, setDtAiHistory] = useState([]);

  // Cognitive tests fetched for the Digital Twin patient
  const [dtCognitiveTests, setDtCognitiveTests] = useState({});

  // Video Consultation State
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [callStatus, setCallStatus] = useState("idle"); // idle, connecting, connected, ended
  const [callDuration, setCallDuration] = useState(0);
  const [peerConnState, setPeerConnState] = useState("new"); // WebRTC connection state for UI
  const [callNotes, setCallNotes] = useState("");
  const [showPatientPanel, setShowPatientPanel] = useState(true);
  const [copiedSessionId, setCopiedSessionId] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const callTimerRef = useRef(null);
  // WebRTC refs
  const pcRef = useRef(null);
  const sessionIdRef = useRef(null);
  const roomIdRef = useRef(null);
  const unsubSignalsRef = useRef(null);
  const seenSignalsRef = useRef(new Set());
  const pendingCandidatesRef = useRef([]);

  // Treatment Notes State
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [recommendationPlan, setRecommendationPlan] = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [showCaregiverReportPreview, setShowCaregiverReportPreview] =
    useState(false);
  const [caregiverReportPreview, setCaregiverReportPreview] = useState(null);
  const [sendingCaregiverReport, setSendingCaregiverReport] = useState(false);

  // Teleconsultation Data State
  const [consultations, setConsultations] = useState([]);

  // Teleconsultation Scheduling State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [selectedPatientForSchedule, setSelectedPatientForSchedule] = useState(null);

  // Clinician Search State
  const [searchClinicianQuery, setSearchClinicianQuery] = useState("");
  const [clinicianSpecialty, setClinicianSpecialty] = useState("all");

  // Digital Twin Tab State
  const [digitalTwinTab, setDigitalTwinTab] = useState("overview"); // overview, brain3d, progression, sensors, cognitive, treatment
  const [brainViewMode, setBrainViewMode] = useState("3d"); // 3d, axial, sagittal, coronal
  const [brainZoom, setBrainZoom] = useState(100);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("stl");
  
  // 3D Brain Rotation State
  const [brainRotation, setBrainRotation] = useState({ x: -20, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(false);
  const [selectedBrainRegion, setSelectedBrainRegion] = useState(null);
  const [showRegionInfo, setShowRegionInfo] = useState(false);
  const [sensorDataInterval, setSensorDataInterval] = useState("realtime"); // realtime, hourly, daily
  const [selectedSensorType, setSelectedSensorType] = useState("all");

  // Notifications State
  const [notifications, setNotifications] = useState([
    { id: 1, type: "alert", title: "Fall Detection Alert", message: "Patient John Doe - Potential fall detected", time: "2 min ago", read: false, priority: "high" },
    { id: 2, type: "request", title: "New Consultation Request", message: "Caregiver Sarah requested access", time: "15 min ago", read: false, priority: "medium" },
    { id: 3, type: "update", title: "Cognitive Test Complete", message: "MMSE results available for review", time: "1 hour ago", read: true, priority: "low" },
    { id: 4, type: "alert", title: "Medication Reminder", message: "Patient missed scheduled medication", time: "2 hours ago", read: true, priority: "medium" },
  ]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  // --- 1. FETCH DATA (Requests + Real Patients Collection) ---
  useEffect(() => {
    if (user?.uid) {
      fetchData();
    }
  }, [user?.uid]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // A. Fetch Pending Requests
      const requests = await getClinicianPendingRequests(user.uid);
      setPendingRequests(requests);
      
      // A2. Fetch ALL Requests (including accepted/rejected)
      const allReqs = await getClinicianAllRequests(user.uid);
      setAllRequests(allReqs);
      console.log("All requests fetched:", allReqs); // Debug log

      // B. Fetch Real Patients from Firestore Collection
      const querySnapshot = await getDocs(collection(db, "patients"));
      const realPatients = await Promise.all(
        querySnapshot.docs.map(async (patientDoc) => {
          const data = patientDoc.data();
          const firstScan =
            data.mriScans && data.mriScans.length > 0 ? data.mriScans[0] : null;

          let resolvedUserId = data.userId || data.uid || null;
          if (!resolvedUserId && data.email) {
            try {
              const userQuery = query(
                collection(db, "users"),
                where("email", "==", data.email)
              );
              const userSnap = await getDocs(userQuery);
              if (!userSnap.empty) {
                resolvedUserId = userSnap.docs[0].id;
              }
            } catch (err) {
              console.warn("Could not resolve userId from users by email:", err);
            }
          }

          try {
            await ensureRafaySensorSeed(patientDoc.id, data);
          } catch (err) {
            console.warn("Could not seed Rafay patient_logs data:", err);
          }

          let sensorRecords = [];
          let currentSensorReading = null;
          try {
            const currentSnap = await getDoc(
              doc(db, "patients", patientDoc.id, "current", "latest")
            );
            if (currentSnap.exists()) {
              currentSensorReading = {
                id: currentSnap.id,
                ...currentSnap.data(),
              };
            }

            const patientLogRecords = await loadRafayPatientLogs(patientDoc.id, data);
            if (patientLogRecords.length > 0) {
              sensorRecords = patientLogRecords;
              currentSensorReading = patientLogRecords[0];
            } else {
              const dailySnapshots = await Promise.all(
                getSensorDateKeys().map((dateKey) =>
                  getDocs(
                    collection(
                      db,
                      "patients",
                      patientDoc.id,
                      "sensorData",
                      dateKey,
                      "readings"
                    )
                  ).then((snap) =>
                    snap.docs.map((readingDoc) => ({
                      id: readingDoc.id,
                      dateKey,
                      timestampMs: Number(readingDoc.id),
                      ...readingDoc.data(),
                    }))
                  )
                )
              );
              sensorRecords = dailySnapshots.flat();
            }
          } catch (err) {
            console.warn("Could not load timestamped sensor data:", err);
          }

          if (sensorRecords.length === 0 && isRafayPatient(patientDoc.id, data)) {
            sensorRecords = RAFAY_SENSOR_MOCK_READINGS.map((reading) => ({
              ...reading,
              patientId: patientDoc.id,
              patientName: data.name || RAFAY_PATIENT_NAME,
              isMockData: true,
            }));
          }
          const normalizedSensorRecords = sensorRecords.map(normalizeSensorReading);
          const sensorDeviceData = normalizeSensorDataMap(
            normalizedSensorRecords.length > 0
              ? normalizedSensorRecords
              : currentSensorReading
              ? [currentSensorReading]
              : []
          );
          const sensorSummary = getOutOfBoundSummary(normalizedSensorRecords);

          return {
            id: patientDoc.id,
            patientId: data.patientId || null,
            userId: resolvedUserId,
            caregiverId: data.caregiverId || null,
            createdBy: data.createdBy || null,
            email: data.email || null,
            name: data.name || "Unknown",
            age: data.age || "N/A",
            gender: data.gender || "N/A",

            // 2. Use formatDate helper for the list view
            lastScan: firstScan ? formatDate(firstScan.uploadedAt) : "No Scans",

            riskLevel: data.riskLevel || "unknown",
            riskScore: data.riskScore || 0,
            diagnosis: data.diagnosis || "Pending Analysis",
            trend: data.trend || "stable",
            avatar: (data.name || "U").charAt(0).toUpperCase(),

            deviceData:
              Object.keys(sensorDeviceData).length > 0
                ? sensorDeviceData
                : data.deviceData || {},
            sensorData: normalizedSensorRecords,
            sensorCurrent: currentSensorReading,
            sensorOutOfBoundSummary: sensorSummary,

            // Digital Twin clinical fields (all optional — render empty states when absent)
            stage: data.stage || data.diagnosis || null,
            stageLevel:
              typeof data.stageLevel === "number" ? data.stageLevel : null,
            progression: Array.isArray(data.progression) ? data.progression : [],
            regions: Array.isArray(data.regions) ? data.regions : [],
            cognitiveTests: Array.isArray(data.cognitiveTests)
              ? data.cognitiveTests
              : [],
            treatmentPlan: Array.isArray(data.treatmentPlan)
              ? data.treatmentPlan
              : [],
            recommendations: Array.isArray(data.recommendations)
              ? data.recommendations
              : [],
            predictedDecline: data.predictedDecline || null,
            trajectoryMonths: data.trajectoryMonths || null,
            stageEstimated: Boolean(data.stageEstimated),
            progressionEstimated: Boolean(data.progressionEstimated),
            aiConfidence: data.aiConfidence ?? null,
            lastAnalysisAt: data.lastAnalysisAt
              ? formatDate(data.lastAnalysisAt)
              : null,

            // Last AI run results — persisted so they survive page reload
            currentStage: data.currentStage || data.diagnosis || null,
            inferenceText: pickReadableText(data.inferenceText) || null,
            trajInference: pickReadableText(data.trajInference) || null,

            // 3. Pass the full array. We will process base64Data in handleViewPatient
            mriScans: data.mriScans || [],

            // Inference text persisted in Firestore; mesh URL restored from sessionStorage
            meshInference: data.meshInference || null,
          };
        })
      );

      

      setPatients(realPatients);

      // C. Fetch Consultations for this clinician
      const clinicianConsultations = await getClinicianConsultations(user.uid);
      setConsultations(clinicianConsultations);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
    setLoading(false);
  };

  const normalizeNoteList = (value) =>
    String(value || "")
      .split("\n")
      .map((line) => line.replace(/^[\s\u2022-]+/, "").trim())
      .filter(Boolean);

  const normalizeExistingList = (items) =>
    Array.isArray(items)
      ? items
          .map((item) =>
            typeof item === "string" ? item : item?.text || ""
          )
          .map((entry) => String(entry || "").trim())
          .filter(Boolean)
      : [];

  const getCognitiveMaxScore = (testType) =>
    testType === "MMSE" ? 30 : testType === "ADAS" ? 70 : 30;

  const toFiniteNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const getMaxScoreFromEntry = (entry) => {
    if (!entry) return null;
    const raw =
      entry.maxScore ?? entry.max ?? entry.totalMax ?? entry.scoreMax ?? null;
    return toFiniteNumber(raw);
  };

  const getMaxScoreFromHistory = (history = []) => {
    const sorted = [...history].sort(
      (a, b) => (b.completedAtMs || 0) - (a.completedAtMs || 0)
    );
    for (const item of sorted) {
      const max = getMaxScoreFromEntry(item);
      if (max != null) return max;
    }
    return null;
  };

  const buildPreviewCognitiveScores = (groupedTests = dtCognitiveTests) => {
    if (!selectedPatientForDT) return [];

    const byTestType = new Map();
    const patientTests = Array.isArray(selectedPatientForDT.cognitiveTests)
      ? selectedPatientForDT.cognitiveTests
      : [];

    patientTests.forEach((entry, idx) => {
      const testType =
        String(entry?.test || entry?.testType || `Test ${idx + 1}`).trim() ||
        `Test ${idx + 1}`;
      const scores = Array.isArray(entry?.scores)
        ? entry.scores.map(toFiniteNumber).filter((v) => v != null)
        : [];
      const current =
        toFiniteNumber(entry?.current) != null
          ? toFiniteNumber(entry?.current)
          : scores.length > 0
          ? scores[scores.length - 1]
          : null;
      const explicitMax = getMaxScoreFromEntry(entry);
      const maxScore = explicitMax != null ? explicitMax : getCognitiveMaxScore(testType);

      byTestType.set(testType, {
        testType,
        latestScore: current,
        maxScore,
        scorePercent:
          current != null ? Math.round((current / maxScore) * 100) : null,
        pastScores: scores,
        recordsCount: scores.length,
      });
    });

    Object.entries(groupedTests || {}).forEach(([testType, group]) => {
      const pastScores = Array.isArray(group?.pastScores)
        ? group.pastScores.map(toFiniteNumber).filter((v) => v != null)
        : [];
      const latestScore =
        pastScores.length > 0 ? pastScores[pastScores.length - 1] : null;
      const historyMax = getMaxScoreFromHistory(group?.history || []);
      const maxScore = historyMax != null ? historyMax : getCognitiveMaxScore(testType);
      const existing = byTestType.get(testType);

      if (!existing) {
        byTestType.set(testType, {
          testType,
          latestScore,
          maxScore,
          scorePercent:
            latestScore != null
              ? Math.round((latestScore / maxScore) * 100)
              : null,
          pastScores,
          recordsCount: Array.isArray(group?.history) ? group.history.length : pastScores.length,
        });
        return;
      }

      if (existing.latestScore == null && latestScore != null) {
        byTestType.set(testType, {
          ...existing,
          latestScore,
          scorePercent: Math.round((latestScore / existing.maxScore) * 100),
        });
      }
    });

    return Array.from(byTestType.values()).sort((a, b) =>
      a.testType.localeCompare(b.testType)
    );
  };

  const buildCaregiverReportPreview = (groupedTests = dtCognitiveTests) => {
    if (!selectedPatientForDT) return null;

    const cognitiveScores = buildPreviewCognitiveScores(groupedTests);

    const clinicalNoteLines = normalizeNoteList(treatmentNotes);
    const recommendationLines = normalizeNoteList(recommendationPlan);
    const fallbackClinical = normalizeExistingList(selectedPatientForDT.treatmentPlan);
    const fallbackRecommendations = normalizeExistingList(
      selectedPatientForDT.recommendations
    );

    const caregiverIds = [
      selectedPatientForDT.caregiverId,
      selectedPatientForDT.createdBy,
    ]
      .filter(Boolean)
      .map((value) => String(value));

    const uniqueCaregiverIds = [...new Set(caregiverIds)];

    return {
      reportName: "caregiver_report",
      caregiverReportName: "caregiver_report",
      reportType: "digital_twin_summary",
      previewGeneratedAt: new Date().toISOString(),
      clinician: {
        id: user?.uid || null,
        name: user?.displayName || null,
        email: user?.email || null,
      },
      patient: {
        id: selectedPatientForDT.id,
        userId: selectedPatientForDT.userId || null,
        name: selectedPatientForDT.name || "Unknown Patient",
        age: selectedPatientForDT.age || null,
        gender: selectedPatientForDT.gender || null,
        diagnosis: selectedPatientForDT.diagnosis || null,
      },
      primaryCaregiverId: uniqueCaregiverIds[0] || null,
      caregiverIds: uniqueCaregiverIds,
      currentStageResult: {
        stage:
          selectedPatientForDT.currentStage ||
          selectedPatientForDT.stage ||
          "Unknown",
        stageLevel:
          typeof selectedPatientForDT.stageLevel === "number"
            ? selectedPatientForDT.stageLevel
            : null,
        confidence: selectedPatientForDT.aiConfidence ?? null,
        inferenceText: selectedPatientForDT.inferenceText || null,
      },
      trajectory: {
        predictedDecline: selectedPatientForDT.predictedDecline || "Stable",
        trajectoryMonths: selectedPatientForDT.trajectoryMonths || "12 (Est.)",
        insight: selectedPatientForDT.trajInference || null,
        progression: Array.isArray(selectedPatientForDT.progression)
          ? selectedPatientForDT.progression
          : [],
      },
      brainModel3d: {
        hasModel: Boolean(selectedPatientForDT.meshUrl),
        inferenceText: selectedPatientForDT.meshInference || null,
      },
      inferenceDetails: {
        currentStage: selectedPatientForDT.inferenceText || null,
        trajectory: selectedPatientForDT.trajInference || null,
        brainModel3d: selectedPatientForDT.meshInference || null,
      },
      cognitiveScores,
      clinicianNotes: {
        clinicalNotes:
          clinicalNoteLines.length > 0
            ? clinicalNoteLines.join("\n")
            : fallbackClinical.join("\n"),
        recommendationPlan:
          recommendationLines.length > 0
            ? recommendationLines.join("\n")
            : fallbackRecommendations.join("\n"),
      },
      latestAnalysis: {
        runCount: dtAiHistory.length,
        lastAnalysisAt: selectedPatientForDT.lastAnalysisAt || null,
        lastAnalysisId: dtAiHistory[0]?.id || null,
      },
      sourcePatientDocPath: `patients/${selectedPatientForDT.id}`,
    };
  };

  const openTreatmentNotesModal = () => {
    if (!selectedPatientForDT) {
      alert("Please select a patient first.");
      return;
    }

    if (!treatmentNotes.trim()) {
      const seededClinical = normalizeExistingList(selectedPatientForDT.treatmentPlan);
      if (seededClinical.length > 0) {
        setTreatmentNotes(seededClinical.join("\n"));
      }
    }

    if (!recommendationPlan.trim()) {
      const seededRecommendations = normalizeExistingList(
        selectedPatientForDT.recommendations
      );
      if (seededRecommendations.length > 0) {
        setRecommendationPlan(seededRecommendations.join("\n"));
      }
    }

    setShowNotesModal(true);
  };

  const handleSaveTreatmentNotes = async () => {
    if (!selectedPatientForDT?.id) {
      alert("Please select a patient first.");
      return;
    }

    setSavingNotes(true);
    try {
      const clinicalItems = normalizeNoteList(treatmentNotes);
      const recommendationItems = normalizeNoteList(recommendationPlan);

      await updateDoc(doc(db, "patients", selectedPatientForDT.id), {
        treatmentPlan: clinicalItems,
        recommendations: recommendationItems,
        treatmentNotesUpdatedAt: serverTimestamp(),
        treatmentNotesUpdatedBy: user?.uid || null,
      });

      setSelectedPatientForDT((prev) =>
        prev
          ? {
              ...prev,
              treatmentPlan: clinicalItems,
              recommendations: recommendationItems,
            }
          : prev
      );

      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === selectedPatientForDT.id
            ? {
                ...patient,
                treatmentPlan: clinicalItems,
                recommendations: recommendationItems,
              }
            : patient
        )
      );

      setShowNotesModal(false);
      alert("Notes saved successfully!");
    } catch (error) {
      console.error("Failed to save treatment notes:", error);
      alert("Failed to save notes. Please try again.");
    } finally {
      setSavingNotes(false);
    }
  };

  const openCaregiverReportPreview = async () => {
    if (!selectedPatientForDT) {
      alert("Please select a patient first.");
      return;
    }

    if (
      !selectedPatientForDT.currentStage ||
      selectedPatientForDT.currentStage === "Pending Analysis"
    ) {
      alert("Run AI Diagnostics first to generate report-ready results.");
      return;
    }

    let cognitiveSnapshot = dtCognitiveTests;
    const hasGroupedTests = Object.keys(cognitiveSnapshot || {}).length > 0;
    const hasPatientCognitiveTests =
      Array.isArray(selectedPatientForDT.cognitiveTests) &&
      selectedPatientForDT.cognitiveTests.length > 0;

    if (!hasGroupedTests && !hasPatientCognitiveTests) {
      try {
        const grouped = await getPatientCognitiveTestsByType(selectedPatientForDT);
        cognitiveSnapshot = grouped || {};
        setDtCognitiveTests(grouped || {});
      } catch (error) {
        console.warn("Could not load cognitive tests for report preview:", error);
      }
    }

    const preview = buildCaregiverReportPreview(cognitiveSnapshot || {});
    if (!preview) return;
    setCaregiverReportPreview(preview);
    setShowCaregiverReportPreview(true);
  };

  const handleSendCaregiverReport = async () => {
    if (!caregiverReportPreview || !selectedPatientForDT?.id) return;

    setSendingCaregiverReport(true);
    try {
      const reportDoc = {
        ...caregiverReportPreview,
        patientId: caregiverReportPreview.patient.id,
        status: "sent",
        sentAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        source: "clinician_dashboard_digital_twin",
      };

      const docRef = await addDoc(collection(db, "caregiverReports"), reportDoc);

      try {
        await updateDoc(doc(db, "patients", selectedPatientForDT.id), {
          lastCaregiverReportId: docRef.id,
          lastCaregiverReportAt: serverTimestamp(),
        });
      } catch (syncError) {
        console.warn(
          "Failed to sync patient with caregiver report reference:",
          syncError
        );
      }

      setShowCaregiverReportPreview(false);
      alert(`Caregiver report sent successfully! Report ID: ${docRef.id}`);
    } catch (error) {
      console.error("Failed to send caregiver report:", error);
      alert("Failed to send report. Please try again.");
    } finally {
      setSendingCaregiverReport(false);
    }
  };

  const extractBase64FromImageLike = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;

    const candidates = [
      value.base64Data,
      value.imageBase64,
      value.base64,
      value.imageData,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate;
      }
    }

    return null;
  };

  const getCandidatesFromBatchData = (batchData = {}, fallbackName = "scan.dcm") => {
    if (Array.isArray(batchData.images) && batchData.images.length > 0) {
      return batchData.images
        .map((img, idx) => ({
          base64Data: extractBase64FromImageLike(img),
          fileName: img?.fileName || batchData.fileName || `${fallbackName}_${idx}.dcm`,
          fileType: img?.fileType || batchData.fileType || null,
        }))
        .filter((entry) => !!entry.base64Data);
    }

    const single = extractBase64FromImageLike(batchData);
    if (!single) return [];

    return [
      {
        base64Data: single,
        fileName: batchData.fileName || fallbackName,
        fileType: batchData.fileType || null,
      },
    ];
  };

  const getDiagnosticCandidatePriority = (candidate = {}) => {
    const fileName = String(candidate.fileName || "").toLowerCase();
    const fileType = String(candidate.fileType || "").toLowerCase();

    if (
      fileType.includes("dicom") ||
      fileName.endsWith(".dcm") ||
      fileName.endsWith(".dicom")
    ) {
      return 0;
    }

    if (fileName.endsWith(".nii") || fileName.endsWith(".nii.gz")) {
      return 1;
    }

    return 2;
  };

  const resolveDiagnosticScanForPatient = async (patient) => {
    if (!patient?.id) return null;
    const scans = Array.isArray(patient.mriScans) ? patient.mriScans : [];
    const collectedCandidates = [];

    // A) Direct scan payload on patient doc (clinician format).
    for (const scan of scans) {
      const direct = extractBase64FromImageLike(scan);
      if (direct) {
        collectedCandidates.push({
          base64Data: direct,
          fileName: scan.fileName || "scan.dcm",
          fileType: scan.fileType || scan.type || null,
        });
      }
    }

    const patientMriCollection = collection(db, "patients", patient.id, "mriScans");

    // B) Caregiver format via mriId references.
    const mriIds = [...new Set(scans.map((s) => s?.mriId).filter(Boolean))];
    for (const mriId of mriIds) {
      const batchQuery = query(patientMriCollection, where("mriId", "==", mriId));
      const batchSnap = await getDocs(batchQuery);
      const sorted = [...batchSnap.docs].sort(
        (a, b) => (a.data().batchNumber ?? 0) - (b.data().batchNumber ?? 0)
      );

      for (const batchDoc of sorted) {
        const candidates = getCandidatesFromBatchData(
          batchDoc.data(),
          `${mriId}.dcm`
        );
        if (candidates.length > 0) {
          collectedCandidates.push(...candidates);
        }
      }
    }

    // C) Final fallback: scan all subcollection docs in case mriId summaries are absent.
    if (collectedCandidates.length === 0) {
      const allSnap = await getDocs(patientMriCollection);
      const sortedAll = [...allSnap.docs].sort((a, b) => {
        const aBatch = a.data().batchNumber;
        const bBatch = b.data().batchNumber;
        if (Number.isFinite(aBatch) && Number.isFinite(bBatch)) return aBatch - bBatch;
        if (Number.isFinite(aBatch)) return -1;
        if (Number.isFinite(bBatch)) return 1;
        return 0;
      });

      for (const batchDoc of sortedAll) {
        const candidates = getCandidatesFromBatchData(batchDoc.data());
        if (candidates.length > 0) {
          collectedCandidates.push(...candidates);
        }
      }
    }

    if (collectedCandidates.length === 0) return null;

    const seen = new Set();
    const deduped = collectedCandidates.filter((candidate) => {
      const payloadKey = String(candidate.base64Data || "").slice(0, 64);
      const key = `${candidate.fileName || "scan"}:${payloadKey}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    deduped.sort(
      (a, b) => getDiagnosticCandidatePriority(a) - getDiagnosticCandidatePriority(b)
    );

    return deduped[0] || null;
  };

  // === 3D FOLDER UPLOAD LOGIC ===
  const handleFolderUpload = async (e) => {
    if (!selectedPatientForDT) {
      alert("Please select a patient first.");
      return;
    }
    setGenerating3D(true);

    const zip = new JSZip();
    let fileCount = 0;
    
    // Add files to zip
    for (const file of e.target.files) {
      if (file.name !== ".DS_Store") {
        zip.file(file.webkitRelativePath || file.name, file);
        fileCount++;
      }
    }

    if (fileCount === 0) {
      alert("No valid files found in folder.");
      setAnalyzing(false);
      return;
    }
    
    try {
      const blob = await zip.generateAsync({ type: "blob" });
      const fd = new FormData();
      fd.append("dicom_zip", blob, "dicom.zip");

      console.log("Sending to 3D API...");
      
      // 1. Generate Mesh
      // Make sure API_3D_MODEL_URL is defined at the top of your file
      // ... inside handleFolderUpload ...
const res = await fetch(`${API_3D_MODEL_URL}/generate_ply`, { 
  method: "POST", 
  body: fd 
});

if (!res.ok) throw new Error("3D Generation failed");

const blobResponse = await res.blob();
const inferenceText = res.headers.get("X-Gemini-Inference") || "Analysis complete.";

// Cache PLY blob URL in sessionStorage (free, browser-local)
const meshUrl = URL.createObjectURL(blobResponse);
sessionStorage.setItem(`mesh_${selectedPatientForDT.id}`, meshUrl);

// Save only inference text to Firestore (no Storage needed)
await updateDoc(doc(db, "patients", selectedPatientForDT.id), {
  meshInference: inferenceText,
  meshGeneratedAt: new Date().toISOString(),
});

setSelectedPatientForDT(prev => ({
  ...prev,
  meshUrl,
  meshInference: inferenceText,
  detectedRegions: ["Hippocampus", "Ventricles", "Cortex"],
}));
      alert("Digital Twin Model Generated Successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating3D(false);
    }
  };

  // === AUTO DIGITAL TWIN GENERATION FROM STORED MRI SCANS ===
  useEffect(() => {
    if (!selectedPatientForDT?.id) return;

    // Restore cached mesh URL from sessionStorage (avoids regenerating in same session)
    const cached = sessionStorage.getItem(`mesh_${selectedPatientForDT.id}`);
    if (cached) {
      setSelectedPatientForDT((prev) => ({ ...prev, meshUrl: cached }));
      return;
    }

    const hasMriData = selectedPatientForDT.mriScans?.some(
      (s) => s.base64Data || s.mriId
    );
    if (!hasMriData) return;
    autoGenerateDigitalTwin(selectedPatientForDT);
  }, [selectedPatientForDT?.id]); // only fires when the selected patient changes

  const autoGenerateDigitalTwin = async (patient) => {
    setGenerating3D(true);
    try {
      const zip = new JSZip();
      let fileCount = 0;
      const scans = patient.mriScans || [];

      // Path A: Clinician-style — base64Data stored directly in the array item
      const directScans = scans.filter((s) => s.base64Data);
      if (directScans.length > 0) {
        for (const scan of directScans) {
          const raw = scan.base64Data.includes(",")
            ? scan.base64Data.split(",")[1]
            : scan.base64Data;
          const binaryStr = atob(raw);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
          zip.file(scan.fileName || `scan_${fileCount}.dcm`, bytes.buffer);
          fileCount++;
        }
      } else {
        // Path B: Caregiver mobile-style — reference summaries pointing to subcollection batches
        const mriIds = [...new Set(scans.map((s) => s.mriId).filter(Boolean))];
        for (const mriId of mriIds) {
          const batchQuery = query(
            collection(db, "patients", patient.id, "mriScans"),
            where("mriId", "==", mriId)
          );
          const batchSnap = await getDocs(batchQuery);
          const sortedBatchDocs = [...batchSnap.docs].sort(
            (a, b) => (a.data().batchNumber ?? 0) - (b.data().batchNumber ?? 0)
          );
          for (const batchDoc of sortedBatchDocs) {
            const batchData = batchDoc.data();
            // Each batch doc may have an `images` array (caregiver format) or a single base64Data
            const items = batchData.images?.length
              ? batchData.images
              : batchData.base64Data
              ? [{ base64Data: batchData.base64Data, fileName: batchData.fileName }]
              : [];
            for (const img of items) {
              const raw = img.base64Data?.includes(",")
                ? img.base64Data.split(",")[1]
                : img.base64Data;
              if (!raw) continue;
              const binaryStr = atob(raw);
              const bytes = new Uint8Array(binaryStr.length);
              for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
              zip.file(img.fileName || `scan_${fileCount}.dcm`, bytes.buffer);
              fileCount++;
            }
          }
        }
      }

      if (fileCount === 0) return;

      const blob = await zip.generateAsync({ type: "blob" });
      const fd = new FormData();
      fd.append("dicom_zip", blob, "dicom.zip");

      const res = await fetch(`${API_3D_MODEL_URL}/generate_ply`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("3D Generation failed");

      const blobResponse = await res.blob();
      const inferenceText =
        res.headers.get("X-Gemini-Inference") || "Analysis complete.";

      // Cache PLY blob URL in sessionStorage (free, browser-local)
      const meshUrl = URL.createObjectURL(blobResponse);
      sessionStorage.setItem(`mesh_${patient.id}`, meshUrl);

      // Save only inference text to Firestore (small text, no Storage needed)
      await updateDoc(doc(db, "patients", patient.id), {
        meshInference: inferenceText,
        meshGeneratedAt: new Date().toISOString(),
      });

      setSelectedPatientForDT((prev) => ({
        ...prev,
        meshUrl,
        meshInference: inferenceText,
        detectedRegions: ["Hippocampus", "Ventricles", "Cortex"],
      }));
    } catch (err) {
      console.error("Auto 3D generation failed:", err);
    } finally {
      setGenerating3D(false);
    }
  };

  // --- VIDEO CONSULTATION (Clinician = INITIATOR) ---
  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  // Clinician joins an EXISTING waiting session created by the caregiver (answerer role)
  const startVideoCall = async () => {
    if (!selectedPatientDetails?.id) {
      alert("Select a patient before starting a consultation.");
      return;
    }
    try {
      setCallStatus("connecting");
      setShowVideoCall(true);
      seenSignalsRef.current = new Set();
      pendingCandidatesRef.current = [];

      // 1. Find the most recent "waiting" session for this patient initiated by caregiver
      const q = query(
        collection(db, "consultation_sessions"),
        where("clinicianId", "==", user.uid),
        where("patientId", "==", selectedPatientDetails.id),
        where("status", "==", "waiting")
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        alert(
          "No incoming call from this patient. Ask the caregiver to start the call from the mobile app first — their app creates the session, you join it."
        );
        setCallStatus("idle");
        setShowVideoCall(false);
        return;
      }
      // Pick the newest (in case there are stale ones)
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      const session = docs[0];
      sessionIdRef.current = session.id;
      roomIdRef.current = session.roomId || null;
      setCurrentRoomId(session.roomId || null);
      console.log(
        "Joining existing waiting session:",
        session.id,
        "room:",
        session.roomId
      );

      // 2. Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 3. Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setCallStatus("connected");
        if (!callTimerRef.current) {
          callTimerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        }
        if (sessionIdRef.current) {
          updateConsultationStatus(sessionIdRef.current, "active").catch(
            (e) => console.warn("Could not mark session active:", e)
          );
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && sessionIdRef.current) {
          sendSignalingData(
            sessionIdRef.current,
            "ice-candidate",
            event.candidate.toJSON(),
            user.uid
          ).catch((e) => console.warn("Failed to send ICE:", e));
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("PC state:", pc.connectionState);
        setPeerConnState(pc.connectionState);
      };

      // 4. Subscribe to signals from the caregiver (offer + ICE)
      // onSnapshot delivers any already-written docs as initial "added" events,
      // so if caregiver has already sent offer + ICE they will arrive immediately.
      unsubSignalsRef.current = subscribeToSignalingData(
        session.id,
        user.uid,
        async (signal) => {
          if (seenSignalsRef.current.has(signal.id)) return;
          seenSignalsRef.current.add(signal.id);

          try {
            if (signal.type === "offer") {
              if (pc.signalingState !== "stable" && pc.signalingState !== "have-remote-offer") {
                console.warn("Unexpected signaling state for offer:", pc.signalingState);
              }
              await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await sendSignalingData(
                session.id,
                "answer",
                { type: answer.type, sdp: answer.sdp },
                user.uid
              );
              // Drain queued ICE candidates that arrived before the offer
              for (const c of pendingCandidatesRef.current) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(c));
                } catch (e) {
                  console.warn("Pending ICE add failed:", e);
                }
              }
              pendingCandidatesRef.current = [];
              console.log("Answer sent to caregiver.");
            } else if (signal.type === "ice-candidate") {
              if (pc.remoteDescription) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(signal.data));
                } catch (e) {
                  console.warn("addIceCandidate failed:", e);
                }
              } else {
                pendingCandidatesRef.current.push(signal.data);
              }
            }
          } catch (e) {
            console.error("Signal handling error:", e);
          }
        }
      );

      console.log("Listening for caregiver offer on session", session.id);
    } catch (error) {
      console.error("Error joining video call:", error);
      setCallStatus("idle");
      alert(
        error.name === "NotAllowedError"
          ? "Camera/microphone access denied. Please allow access and try again."
          : "Could not join call: " + (error.message || "Unknown error")
      );
      await endVideoCall();
    }
  };

  const endVideoCall = async () => {
    // Unsubscribe from signals
    if (unsubSignalsRef.current) {
      try { unsubSignalsRef.current(); } catch {}
      unsubSignalsRef.current = null;
    }
    // Close peer connection
    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    // Mark the session ended in Firestore (with notes + duration)
    if (sessionIdRef.current) {
      try {
        await updateConsultationStatus(sessionIdRef.current, "ended");
        if (callNotes.trim() || callDuration > 0) {
          await updateDoc(doc(db, "consultation_sessions", sessionIdRef.current), {
            notes: callNotes.trim() || null,
            endedAt: serverTimestamp(),
            durationSeconds: callDuration,
          });
        }
      } catch (e) {
        console.warn("Failed to finalize session:", e);
      }
      sessionIdRef.current = null;
    }
    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    seenSignalsRef.current = new Set();
    pendingCandidatesRef.current = [];
    roomIdRef.current = null;
    setCurrentRoomId(null);

    setShowVideoCall(false);
    setCallStatus("idle");
    setCallDuration(0);
    setPeerConnState("new");
    setCallNotes("");
    setIsVideoOn(true);
    setIsAudioOn(true);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, []);

  // --- 2. REQUEST HANDLING ---
  const handleAcceptRequest = async (request) => {
    setActionLoading(request.id);
    try {
      await acceptPatientRequest(request.id, request.patientId, user.uid);
      await fetchData(); // Refresh list
    } catch (error) {
      console.error("Error accepting request:", error);
    }
    setActionLoading(null);
  };

  const handleRejectRequest = async (request) => {
    setActionLoading(request.id);
    try {
      await rejectPatientRequest(request.id);
      setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
    setActionLoading(null);
  };

  // --- 3. VIEW PATIENT DETAILS (Prepare Data) ---
const handleViewPatient = async (patientRef) => {
    const lookupId =
      typeof patientRef === "object" && patientRef !== null
        ? patientRef.id || patientRef.patientId || patientRef.userId
        : patientRef;
    let fallbackPatient =
      typeof patientRef === "object" && patientRef !== null ? patientRef : null;

    try {
      let patientData =
        fallbackPatient ||
        patients.find(
          (p) => p.id === lookupId || p.patientId === lookupId || p.userId === lookupId
        );
      if (!patientData) {
        console.warn("Could not find patient for detail view:", lookupId);
        return;
      }
      const patientDocId = patientData.id;

      setSelectedPatientDetails({
        ...patientData,
        mriScans: Array.isArray(patientData.mriScans) ? patientData.mriScans : [],
        medications: patientData.medications || ["Donepezil 10mg", "Memantine 20mg"],
      });
      setShowPatientModal(true);

      try {
        const seeded = await ensureRafaySensorSeed(patientDocId, patientData);
        if (seeded) {
          const refreshedDoc = await getDoc(doc(db, "patients", patientDocId));
          if (refreshedDoc.exists()) {
            patientData = { ...patientData, ...refreshedDoc.data(), id: patientDocId };
          }
        }
      } catch (err) {
        console.warn("Could not ensure Rafay patient_logs seed data:", err);
      }

      // Fetch AI analysis history for this patient (newest first)
      let history = [];
      try {
        const historySnap = await getDocs(
          query(
            collection(db, "patients", patientDocId, "aiAnalyses"),
            orderBy("createdAt", "desc")
          )
        );
        historySnap.forEach((d) => history.push({ id: d.id, ...d.data() }));
      } catch (e) {
        console.warn("Could not load AI history:", e);
      }
      setAiHistory(history);
      setCompareWithId(null);
      const latestAnalysis = history[0] || null;
      let latestSensor = getLatestSensorRecord(patientData.deviceData);
      try {
        const patientLogRecords = await loadRafayPatientLogs(patientDocId, patientData);
        if (patientLogRecords.length > 0) {
          latestSensor = patientLogRecords[0];
        } else {
          const currentSnap = await getDoc(
            doc(db, "patients", patientDocId, "current", "latest")
          );
          if (currentSnap.exists()) {
          latestSensor = { id: currentSnap.id, ...currentSnap.data() };
          }
        }
      } catch (err) {
        console.warn("Could not load latest sensor reading:", err);
      }
      const sensorDetails = {
        bpm: sensorValue(latestSensor?.bpm, 0),
        fall: Boolean(latestSensor?.fall),
        latitude: sensorValue(latestSensor?.latitude, 0),
        longitude: sensorValue(latestSensor?.longitude, 0),
        outOfZone: Boolean(latestSensor?.outOfZone),
        pitch: sensorValue(latestSensor?.pitch, 0),
        roll: sensorValue(latestSensor?.roll, 0),
        sleeping: Boolean(latestSensor?.sleeping),
        heartRate: sensorValue(latestSensor?.bpm, 0),
        lastUpdate: formatSensorTimestamp(latestSensor),
      };

      // A. Extract Latest Vitals (with dummy fallback values)
      // Dummy values for demo purposes when no real device data exists
      const dummyVitals = {
        heartRate: Math.floor(65 + Math.random() * 20), // 65-85 bpm
        temperature: (36.2 + Math.random() * 1.2).toFixed(1), // 36.2-37.4 °C
        lastUpdate: new Date().toLocaleString()
      };
      
      let latestVitals = dummyVitals; // Default to dummy values
      
      if (patientData.deviceData && Object.keys(patientData.deviceData).length > 0) {
        const keys = Object.keys(patientData.deviceData).sort((a, b) => {
           const numA = parseInt(a.replace(/^\D+/g, '')) || 0;
           const numB = parseInt(b.replace(/^\D+/g, '')) || 0;
           return numA - numB;
        });
        const lastKey = keys[keys.length - 1];
        const latestData = patientData.deviceData[lastKey];
        if (latestData && latestData.heartRate && latestData.temperature) {
          latestVitals = {
            heartRate: latestData.heartRate,
            temperature: latestData.temperature,
            lastUpdate: lastKey
          };
        }
      }

      // B. Process MRI Scans (THE CRITICAL FIX)
      const processedScans = (patientData.mriScans || []).map((scan, index) => {
        let imgSource = "/api/placeholder/400/320";
        
        // --- CORRECT FIELD IS 'base64Data' ---
        if (scan.base64Data) {
            // Check if it already has the data prefix, if not add it
            imgSource = scan.base64Data.startsWith('data:') 
                ? scan.base64Data 
                : `data:image/png;base64,${scan.base64Data}`;
        }

        return {
            id: index,
            // Use helper to prevent "Object invalid child" error
            date: formatDate(scan.uploadedAt), 
            type: scan.fileType || "MRI Scan",
            url: imgSource, 
            
            // Store the RAW data for the API
            base64Data: scan.base64Data 
        };
      });

      // Dummy clinical data for demo purposes
      const stages = ["Normal", "MCI", "Mild AD", "Moderate AD"];
      const randomStageIdx = Math.floor(Math.random() * 3); // 0-2 for demo
      const dummyClinicalData = {
        currentStage: patientData.diagnosis || stages[randomStageIdx] || "MCI",
        stageLevel: patientData.stageLevel ?? randomStageIdx,
        predictedDecline: patientData.predictedDecline || `${(2 + Math.random() * 4).toFixed(1)}%/year`,
        trajectoryMonths: patientData.trajectoryMonths || Math.floor(12 + Math.random() * 24),
        bloodPressure: patientData.bloodPressure || `${Math.floor(115 + Math.random() * 20)}/${Math.floor(70 + Math.random() * 15)}`,
        oxygenSaturation: patientData.oxygenSaturation || `${Math.floor(95 + Math.random() * 4)}%`,
        sleepQuality: patientData.sleepQuality || `${(5 + Math.random() * 3).toFixed(1)} hrs`,
        activityLevel: patientData.activityLevel || `${Math.floor(3000 + Math.random() * 5000)} steps`
      };

      // C. Set State — prefer stored AI analysis values over dummy placeholders
      const aiSeed = latestAnalysis
        ? {
            currentStage: latestAnalysis.currentStage,
            stageLevel: latestAnalysis.stageLevel,
            predictedDecline: latestAnalysis.predictedDecline,
            trajectoryMonths: latestAnalysis.trajectoryMonths,
            inferenceText: pickReadableText(latestAnalysis.inferenceText),
            trajInference: pickReadableText(latestAnalysis.trajInference),
            stageEstimated: Boolean(latestAnalysis.stageEstimated),
            progressionEstimated: Boolean(latestAnalysis.progressionEstimated),
          }
        : {};

      setSelectedPatientDetails({
        ...patientData,
        ...dummyClinicalData,
        ...sensorDetails,
        ...aiSeed,
        mriScans: processedScans,
        medications: patientData.medications || ["Donepezil 10mg", "Memantine 20mg"]
      });

      setShowPatientModal(true);
    } catch (error) {
      console.error("Error opening details:", error);
      if (fallbackPatient) {
        setSelectedPatientDetails({
          ...fallbackPatient,
          mriScans: Array.isArray(fallbackPatient.mriScans) ? fallbackPatient.mriScans : [],
          medications: fallbackPatient.medications || ["Donepezil 10mg", "Memantine 20mg"],
        });
        setShowPatientModal(true);
      }
    }
  };
  // --- 4. AI ANALYSIS (SEND DICOM TO BOTH APIS) ---
// --- 4. AI ANALYSIS (SEND DICOM TO BOTH APIS) ---
  const analyzePatientData = async () => {
    if (!selectedPatientDetails) return;
    setAnalyzing(true);

    try {
      // 1. PREPARE MRI DATA — resolve from inline array OR patients/{id}/mriScans subcollection
      const resolvedScan = await resolveDiagnosticScanForPatient(selectedPatientDetails);
      let mriFile = null;
      if (resolvedScan?.base64Data) {
        const blob = base64ToBlob(resolvedScan.base64Data);
        if (blob && blob.size > 0) {
          const rawName = resolvedScan.fileName || "patient_scan.dcm";
          const fileName = /\.(dcm|dicom)$/i.test(rawName) ? rawName : "patient_scan.dcm";
          mriFile = new File([blob], fileName, { type: "application/dicom" });
        }
      }

      if (!mriFile) {
        alert("No MRI data found. Cannot run diagnostics.");
        setAnalyzing(false);
        return;
      }

      const makeBaseFormData = () => {
        const fd = new FormData();
        fd.append("file", mriFile);
        return fd;
      };

      // 2. CALL STAGE MODEL FIRST, THEN PROGRESSION MODEL WITH MAPPED HISTORY
      console.log("Sending DICOM to Stage Model...");

      const stageRes = await axios.post(API_STAGE_URL, makeBaseFormData(), {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const stageData = stageRes.data || {};

      console.log("Stage API Result:", stageData);

      // 3. PROCESS RESULTS
      
      // A. Extract Current Stage from Stage API
      // Assuming Stage API returns: { "stage": "MCI", "confidence": 0.95 }
      const currentStage = stageData.stage || stageData.current_stage || "Unknown";
      const inferenceText = getStageInferenceText(stageData);

      // Build mapped past stage sequence for trajectory model.
      // Use prior visits (if any) + current predicted stage.
      const historicalStages = [...(aiHistory || [])]
        .sort((a, b) => {
          const as = a?.createdAt?.seconds || 0;
          const bs = b?.createdAt?.seconds || 0;
          return as - bs;
        })
        .map((entry) => entry?.currentStage || entry?.stageApi?.stage)
        .filter(Boolean)
        .map((label) => mapStageToTrajectory(label));

      const mappedCurrentStage = mapStageToTrajectory(currentStage);
      const pastStagesSequence = [...historicalStages, mappedCurrentStage];

      const pastStagesString = pastStagesSequence.join(", ");

      console.log("Sending DICOM + mapped stage history to Trajectory Model...", {
        rawCurrentStage: currentStage,
        mappedCurrentStage,
        pastStagesSequence,
        pastStagesString,
      });

      const progressionFormData = makeBaseFormData();
      progressionFormData.append("past_stages", pastStagesString);
      progressionFormData.append("current_stage", mappedCurrentStage);
      const progRes = await axios.post(API_PROGRESSION_URL, progressionFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const progressionApiPayload = progRes.data || {};
      const trajInference = getTrajectoryInferenceText(progressionApiPayload);
      // Python returns: { "next_stage_prediction": ["AD"] }
      const nextStagesList = progressionApiPayload.next_stage_prediction || [];
      const predictedDecline = nextStagesList.length > 0
          ? nextStagesList.join(" -> ")
          : "Stable";

      // C. Calculate Stage Level + derive Risk from stage + confidence
      const stageLevelIndex =
        STAGE_LEVEL_MAP[currentStage] !== undefined ? STAGE_LEVEL_MAP[currentStage] : 0;
      const confidence = stageData.confidence ?? 1;
      const { riskLevel, riskScore } = deriveRiskFromStage(currentStage, confidence);

      // 4. UPDATE UI (modal + registry row)
      setSelectedPatientDetails(prev => ({
        ...prev,
        currentStage,
        stageLevel: stageLevelIndex,
        predictedDecline,
        inferenceText,
        trajInference,
        riskLevel,
        riskScore,
        diagnosis: currentStage,
        aiConfidence: confidence,
        lastAnalysisAt: new Date().toLocaleString(),
        trajectoryMonths: "12 (Est.)",
        trajectoryDebug: {
          rawCurrentStage: currentStage,
          mappedCurrentStage,
          pastStagesSent: pastStagesSequence,
          pastStagesString,
        },
      }));

      // Also refresh the registry row so "Pending Analysis" → new stage, risk updates etc.
      setPatients(prev => prev.map(p =>
        p.id === selectedPatientDetails.id
          ? {
              ...p,
              diagnosis: currentStage,
              riskLevel,
              riskScore,
              stageLevel: stageLevelIndex,
              aiConfidence: confidence,
              lastAnalysisAt: new Date().toLocaleString(),
            }
          : p
      ));

      // 5. PERSIST RESULT TO FIRESTORE (patients/{id}/aiAnalyses/{autoId})
      try {
        const record = {
          createdAt: serverTimestamp(),
          clinicianId: user?.uid || null,
          currentStage,
          stageLevel: stageLevelIndex,
          predictedDecline,
          trajectoryMonths: "12 (Est.)",
          inferenceText: inferenceText || null,
          trajInference: trajInference || null,
          trajectoryDebug: {
            rawCurrentStage: currentStage,
            mappedCurrentStage,
            pastStagesSent: pastStagesSequence,
            pastStagesString,
          },
          stageApi: {
            stage: stageData.stage || null,
            confidence: stageData.confidence ?? null,
            details: stageData.details || null,
            explanation: inferenceText || null,
            raw: stageData || null,
          },
          progressionApi: {
            past_stages_sent: pastStagesSequence,
            past_stages_string: pastStagesString,
            mapped_current_stage: mappedCurrentStage,
            next_stage_prediction: nextStagesList,
            explanation: trajInference || null,
            raw: progressionApiPayload,
          },
          scanRef: {
            type: resolvedScan?.fileType || null,
            fileName: resolvedScan?.fileName || null,
          },
        };
        const docRef = await addDoc(
          collection(db, "patients", selectedPatientDetails.id, "aiAnalyses"),
          record
        );
        // Prepend to in-memory history (createdAt will fill in after refresh, use local Date for display)
        setAiHistory(prev => [
          { id: docRef.id, ...record, createdAt: { seconds: Math.floor(Date.now() / 1000) } },
          ...prev,
        ]);

        // Update the patient document so the registry persists across reloads
        await updateDoc(doc(db, "patients", selectedPatientDetails.id), {
          diagnosis: currentStage,
          currentStage,
          riskLevel,
          riskScore,
          stageLevel: stageLevelIndex,
          predictedDecline,
          trajectoryMonths: "12 (Est.)",
          aiConfidence: confidence,
          inferenceText: inferenceText || null,
          trajInference: trajInference || null,
          lastAnalysisAt: serverTimestamp(),
        });
      } catch (saveErr) {
        console.error("Failed to save AI analysis to Firestore:", saveErr);
      }

    } catch (error) {
      console.error("API FAILED:", error?.response?.data || error?.message);
      const msg = getApiErrorText(error);
      alert(`AI Analysis Failed: ${msg || "Unknown error"}`);
    }
    setAnalyzing(false);

  };

  // --- 4b. LOAD AI HISTORY WHEN DIGITAL TWIN PATIENT CHANGES ---
  useEffect(() => {
    if (!selectedPatientForDT?.id) { setDtAiHistory([]); setDtCognitiveTests({}); return; }
    getDocs(
      query(collection(db, "patients", selectedPatientForDT.id, "aiAnalyses"), orderBy("createdAt", "desc"))
    )
      .then((snap) => {
        const h = [];
        snap.forEach((d) => h.push({ id: d.id, ...d.data() }));
        setDtAiHistory(h);
      })
      .catch(() => setDtAiHistory([]));

    getPatientCognitiveTestsByType(selectedPatientForDT)
      .then((grouped) => {
        setDtCognitiveTests(grouped || {});
      })
      .catch(() => {
        setDtCognitiveTests({});
      });
  }, [selectedPatientForDT?.id]);

  useEffect(() => {
    setTreatmentNotes("");
    setRecommendationPlan("");
  }, [selectedPatientForDT?.id]);

  // --- 4c. AI DIAGNOSTICS FOR DIGITAL TWIN ---
  const analyzePatientForDT = async () => {
    if (!selectedPatientForDT) return;
    setAnalyzing(true);
    try {
      // 1. Resolve MRI source using the same stored patient scan data used for 3D generation.
      const resolvedScan = await resolveDiagnosticScanForPatient(selectedPatientForDT);
      let mriFile = null;
      if (resolvedScan?.base64Data) {
        const blob = base64ToBlob(resolvedScan.base64Data);
        if (!blob || blob.size === 0) {
          throw new Error("Resolved MRI payload is empty after base64 decoding.");
        }
        const rawName = resolvedScan.fileName || "patient_scan.dcm";
        const fileName = /\.(dcm|dicom)$/i.test(rawName)
          ? rawName
          : "patient_scan.dcm";
        mriFile = new File([blob], fileName, { type: "application/dicom" });
        console.log("DT diagnostics scan selected:", {
          fileName,
          fileType: resolvedScan.fileType || "unknown",
          size: blob.size,
        });
      }

      if (!mriFile) {
        alert(
          "No MRI scan payload could be resolved for diagnostics. Please re-upload scans if this patient only has a cached 3D model."
        );
        setAnalyzing(false);
        return;
      }

      const makeForm = () => { const fd = new FormData(); fd.append("file", mriFile); return fd; };

      // 2. Stage API
      const stageRes = await axios.post(API_STAGE_URL, makeForm(), { headers: { "Content-Type": "multipart/form-data" } });
      const stageData = stageRes.data || {};

      const currentStage = stageData.stage || stageData.current_stage || "Unknown";
      const inferenceText = getStageInferenceText(stageData);

      // 3. Build past stages from DT history
      const historicalStages = [...(dtAiHistory || [])]
        .sort((a, b) => (a?.createdAt?.seconds || 0) - (b?.createdAt?.seconds || 0))
        .map((e) => e?.currentStage || e?.stageApi?.stage)
        .filter(Boolean)
        .map((l) => mapStageToTrajectory(l));
      const mappedCurrentStage = mapStageToTrajectory(currentStage);
      const pastStagesSequence = [...historicalStages, mappedCurrentStage];
      const pastStagesString = pastStagesSequence.join(", ");

      const progFd = makeForm();
      progFd.append("past_stages", pastStagesString);
      progFd.append("current_stage", mappedCurrentStage);
      const progRes = await axios.post(API_PROGRESSION_URL, progFd, { headers: { "Content-Type": "multipart/form-data" } });
      const progressionApiPayload = progRes.data || {};
      const trajInference = getTrajectoryInferenceText(progressionApiPayload);
      const nextStagesList = progressionApiPayload.next_stage_prediction || [];
      const predictedDecline = nextStagesList.length ? nextStagesList.join(" -> ") : "Stable";

      const stageLevelIndex = STAGE_LEVEL_MAP[currentStage] !== undefined ? STAGE_LEVEL_MAP[currentStage] : 0;
      const confidence = stageData.confidence ?? 1;
      const { riskLevel, riskScore } = deriveRiskFromStage(currentStage, confidence);

      // 4. Update Digital Twin patient state
      setSelectedPatientForDT((prev) => ({
        ...prev,
        currentStage,
        stageLevel: stageLevelIndex,
        predictedDecline,
        inferenceText,
        trajInference,
        riskLevel,
        riskScore,
        diagnosis: currentStage,
        aiConfidence: confidence,
        lastAnalysisAt: new Date().toLocaleString(),
        trajectoryMonths: "12 (Est.)",
      }));

      // Also refresh registry row
      setPatients((prev) =>
        prev.map((p) =>
          p.id === selectedPatientForDT.id
            ? { ...p, diagnosis: currentStage, riskLevel, riskScore, stageLevel: stageLevelIndex, aiConfidence: confidence }
            : p
        )
      );

      // 5. Persist to Firestore
      try {
        const record = {
          createdAt: serverTimestamp(),
          clinicianId: user?.uid || null,
          currentStage,
          stageLevel: stageLevelIndex,
          predictedDecline,
          trajectoryMonths: "12 (Est.)",
          inferenceText: inferenceText || null,
          trajInference: trajInference || null,
          stageApi: {
            stage: stageData.stage || null,
            confidence: stageData.confidence ?? null,
            explanation: inferenceText || null,
            raw: stageData || null,
          },
          progressionApi: {
            next_stage_prediction: nextStagesList,
            explanation: trajInference || null,
            raw: progressionApiPayload,
          },
        };
        const docRef = await addDoc(collection(db, "patients", selectedPatientForDT.id, "aiAnalyses"), record);
        setDtAiHistory((prev) => [{ id: docRef.id, ...record, createdAt: { seconds: Math.floor(Date.now() / 1000) } }, ...prev]);
        await updateDoc(doc(db, "patients", selectedPatientForDT.id), {
          diagnosis: currentStage,
          currentStage,
          riskLevel,
          riskScore,
          stageLevel: stageLevelIndex,
          predictedDecline,
          trajectoryMonths: "12 (Est.)",
          aiConfidence: confidence,
          inferenceText: inferenceText || null,
          trajInference: trajInference || null,
          lastAnalysisAt: serverTimestamp(),
        });
      } catch (saveErr) {
        console.error("Failed to save DT AI analysis:", saveErr);
      }
    // Fetch cognitive tests after diagnostics run
    try {
      const cogTests = await getPatientCognitiveTestsByType({ id: selectedPatientForDT.id });
      setDtCognitiveTests(cogTests);
    } catch (e) {
      console.warn("Could not load cognitive tests:", e);
    }

    } catch (err) {
      console.error("API FAILED:", err?.response?.data || err?.message);
      const status = err?.response?.status;
      const endpoint = err?.config?.url;
      const msg = getApiErrorText(err);
      alert(
        `AI Analysis Failed${status ? ` (${status})` : ""}${endpoint ? ` at ${endpoint}` : ""}: ${msg || "Unknown error"}`
      );
    }
    setAnalyzing(false);
  };

  // --- 5. RENDER HELPERS ---
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" || patient.riskLevel === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalPatients: patients.length,
    highRisk: patients.filter((p) => p.riskLevel === "high").length,
    scansThisWeek: patients.filter(p => p.lastScan !== "No Scans").length, // Simple mock logic
    avgRiskScore: patients.length > 0 
        ? Math.round(patients.reduce((acc, p) => acc + (p.riskScore || 0), 0) / patients.length)
        : 0,
    pendingRequests: pendingRequests.length,
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    // 1. Read File as Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      try {
        const base64String = reader.result; // Contains "data:image/png;base64,..."

        // 2. Build the record to persist (matches mobile app schema)
        const uploadedAt = new Date().toISOString();
        const scanRecord = {
          fileName: file.name,
          fileType: file.name.toLowerCase().endsWith(".dcm") ? "DICOM" : "IMAGE",
          base64Data: base64String,
          uploadedAt,
          uploadedBy: user?.uid || "clinician",
          uploadSource: "clinician_portal",
        };

        // 3. Persist to Firestore: append to patient doc mriScans[] and also write to subcollection
        await updateDoc(doc(db, "patients", selectedPatientDetails.id), {
          mriScans: arrayUnion(scanRecord),
        });
        try {
          await addDoc(
            collection(db, "patients", selectedPatientDetails.id, "mriScans"),
            { ...scanRecord, createdAt: serverTimestamp() }
          );
        } catch (e) {
          console.warn("Subcollection write failed (non-blocking):", e);
        }

        // 4. Update UI immediately (local mriScans gets processed shape)
        const newScan = {
          date: new Date().toLocaleDateString(),
          url: base64String,
          type: scanRecord.fileType,
          base64Data: base64String,
          uploadedAt,
        };

        setSelectedPatientDetails(prev => ({
          ...prev,
          mriScans: [newScan, ...(prev.mriScans || [])]
        }));
        // Also refresh the registry-list patient row
        setPatients(prev => prev.map(p =>
          p.id === selectedPatientDetails.id
            ? { ...p, mriScans: [scanRecord, ...(p.mriScans || [])], lastScan: formatDate(uploadedAt) }
            : p
        ));

        alert("MRI Scan saved to Firestore successfully!");

      } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to upload file.");
      } finally {
        setUploading(false);
        // Reset input so you can select the same file again if needed
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      setUploading(false);
    };
  };

  return (
    <div className={`min-h-screen flex font-sans ${isLight ? "bg-[linear-gradient(180deg,#e8f6f3_0%,#e5f4f7_52%,#e8f0fb_100%)]" : "bg-slate-950"}`}>
      <DashboardSidebar
        user={user}
        onLogout={onLogout}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        pendingRequestsCount={pendingRequests.length}
      />

      <div className="ml-64 flex-1">
        <DashboardTopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          pendingRequestsCount={pendingRequests.length}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`mb-8 ${isLight ? "rounded-[28px] px-6 py-6 bg-[#eaf7f4]/86 border border-slate-200 shadow-[0_18px_45px_rgba(15,23,42,0.05)]" : ""}`}>
            <h1 className={`text-2xl font-bold mb-2 ${isLight ? "text-slate-950" : "text-white"}`}>
              {activeSection === "digitalTwin" ? "Digital Twin Analysis 🧠" :
               activeSection === "cognitiveTests" ? "Cognitive Tests and Forecasts 📊" :
               activeSection === "teleconsultation" ? "Teleconsultation Hub 📹" :
               "Welcome back! 👋"}
            </h1>
            <p className={isLight ? "text-slate-600" : "text-slate-400"}>
              {activeSection === "patients" ? "Monitor your patients from the Firestore Registry." : 
               activeSection === "requests" ? "Review access requests from caregivers." :
               activeSection === "cognitiveTests" ? "Fetch patient-specific test history and run AI predictions by test type." :
               activeSection === "digitalTwin" ? "Explore AI-powered brain visualization and cognitive analysis." :
               activeSection === "teleconsultation" ? "Connect with patients through secure video consultations." :
               "Review access requests."}
            </p>
          </div>

          {activeSection === "cognitiveTests" && (
            <CognitiveTestsSection patients={patients} />
          )}

          {activeSection === "requests" && (
            <RequestsSection
              user={user}
              loading={loading}
              allRequests={allRequests}
              requestsFilter={requestsFilter}
              setRequestsFilter={setRequestsFilter}
              onViewPatient={handleViewPatient}
              onAcceptRequest={handleAcceptRequest}
              onRejectRequest={handleRejectRequest}
            />
          )}

          {activeSection === "digitalTwin" && (
            <DigitalTwinSection
              patients={patients}
              selectedPatientForDT={selectedPatientForDT}
              setSelectedPatientForDT={setSelectedPatientForDT}
              analyzing={analyzing}
              generating3D={generating3D}
              onFolderUpload={handleFolderUpload}
              onShowNotesModal={openTreatmentNotesModal}
              onRunDiagnostics={analyzePatientForDT}
              onOpenCaregiverPreview={openCaregiverReportPreview}
              dtAiHistory={dtAiHistory}
              dtCognitiveTests={dtCognitiveTests}
            />
          )}

          {activeSection === "teleconsultation" && (
            <TeleconsultationSection
              patients={patients}
              consultations={consultations}
              onOpenScheduleModal={() => setShowScheduleModal(true)}
              onSchedulePatient={setSelectedPatientForSchedule}
              onViewDigitalTwin={(patient) => {
                setSelectedPatientForDT(patient);
                setActiveSection("digitalTwin");
              }}
              onStartCall={(patient) => {
                setSelectedPatientDetails(patient);
                startVideoCall();
              }}
            />
          )}

          {activeSection === "patients" && (
            <PatientsSection
              stats={stats}
              filteredPatients={filteredPatients}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              onViewPatient={handleViewPatient}
            />
          )}

          {/* === PATIENT DETAILS MODAL + AI === */}
          {showPatientModal && selectedPatientDetails && (
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isLight ? "bg-slate-950/35 backdrop-blur-md" : "bg-black/80 backdrop-blur-sm"}`}>
              <div className={`rounded-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col shadow-2xl ${isLight ? "bg-[#eaf7f4] border border-slate-200 shadow-[0_35px_90px_rgba(15,23,42,0.18)]" : "bg-slate-900 border border-slate-800"}`}>
                
                {/* Header */}
                <div className={`p-6 flex justify-between items-center ${isLight ? "border-b border-slate-200 bg-[linear-gradient(180deg,#eaf7f4_0%,#e1f2ee_100%)]" : "border-b border-slate-800 bg-slate-900"}`}>
                   <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${isLight ? "bg-[linear-gradient(135deg,#0f766e,#155e75)]" : "bg-gradient-to-br from-blue-600 to-purple-600"}`}>
                        {selectedPatientDetails.avatar}
                      </div>
                      <div>
                        <h2 className={`text-xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>{selectedPatientDetails.name}</h2>
                        <p className="text-slate-400 text-sm">ID: {selectedPatientDetails.id} • Age: {selectedPatientDetails.age}</p>
                      </div>
                   </div>
                   <div className="flex items-center space-x-3">
                      <button 
                        onClick={startVideoCall}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold transition-all"
                      >
                         <Video size={18}/>
                         <span>Start Consultation</span>
                      </button>
                      <button 
                        onClick={analyzePatientData}
                        disabled={analyzing}
                        className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-50"
                      >
                         {analyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Activity size={18}/>}
                         <span>Run AI Diagnostics</span>
                      </button>
                      <button onClick={() => setShowPatientModal(false)} className={`p-2 rounded-lg ${isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700" : "bg-slate-800 hover:bg-slate-700 text-white"}`}>
                        <X size={20}/>
                      </button>
                   </div>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEFT: Clinical Data */}
                    <div className="lg:col-span-2 space-y-6">
                       
                       {/* Vitals */}
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         {[
                           { label: "BPM", value: Number(selectedPatientDetails.bpm || 0).toFixed(2), icon: Heart, color: "text-red-400" },
                           { label: "Fall", value: String(Boolean(selectedPatientDetails.fall)), icon: AlertCircle, color: "text-amber-400" },
                           { label: "Latitude", value: Number(selectedPatientDetails.latitude || 0).toFixed(6), icon: MapPin, color: "text-green-400" },
                           { label: "Longitude", value: Number(selectedPatientDetails.longitude || 0).toFixed(6), icon: MapPin, color: "text-cyan-400" },
                           { label: "Out of Zone", value: String(Boolean(selectedPatientDetails.outOfZone)), icon: Shield, color: "text-yellow-400" },
                           { label: "Pitch", value: Number(selectedPatientDetails.pitch || 0).toFixed(2), icon: Activity, color: "text-purple-400" },
                           { label: "Roll", value: Number(selectedPatientDetails.roll || 0).toFixed(2), icon: RotateCcw, color: "text-blue-400" },
                           { label: "Sleeping", value: String(Boolean(selectedPatientDetails.sleeping)), icon: Moon, color: "text-indigo-400" },
                         ].map((item) => {
                           const Icon = item.icon;
                           return (
                             <div key={item.label} className={`${isLight ? "bg-[#edf8f5] border border-slate-200" : "bg-slate-800/50 border border-slate-700"} p-4 rounded-xl flex justify-between items-center`}>
                               <div className="min-w-0">
                                 <p className={`${isLight ? "text-slate-600" : "text-slate-400"} text-xs uppercase`}>{item.label}</p>
                                 <p className={`text-xl font-bold truncate ${isLight ? "text-slate-950" : "text-white"}`}>{item.value}</p>
                               </div>
                               <Icon className={item.color} size={22} />
                             </div>
                           );
                         })}
                       </div>
                       <div className="hidden grid-cols-2 md:grid-cols-4 gap-4">
                          <div className={`${isLight ? "bg-[#edf8f5] border border-slate-200" : "bg-slate-800/50 border border-slate-700"} p-4 rounded-xl flex justify-between items-center`}>
                             <div>
                                <p className={`${isLight ? "text-slate-600" : "text-slate-400"} text-xs uppercase`}>Heart Rate</p>
                                <p className={`text-2xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>{selectedPatientDetails.heartRate || 72} <span className="text-sm font-normal text-slate-500">bpm</span></p>
                             </div>
                             <Heart className="text-red-400" size={24} />
                          </div>
                          <div className={`${isLight ? "bg-[#edf8f5] border border-slate-200" : "bg-slate-800/50 border border-slate-700"} p-4 rounded-xl flex justify-between items-center`}>
                             <div>
                                <p className="text-slate-400 text-xs uppercase">Temperature</p>
                                <p className="text-2xl font-bold text-white">{selectedPatientDetails.temperature || 36.8} <span className="text-sm font-normal text-slate-500">°C</span></p>
                             </div>
                             <Thermometer className="text-blue-400" size={24} />
                          </div>
                          <div className={`${isLight ? "bg-[#edf8f5] border border-slate-200" : "bg-slate-800/50 border border-slate-700"} p-4 rounded-xl flex justify-between items-center`}>
                             <div>
                                <p className={`${isLight ? "text-slate-600" : "text-slate-400"} text-xs uppercase`}>Blood Pressure</p>
                                <p className={`text-2xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>{selectedPatientDetails.bloodPressure || "128/82"}</p>
                             </div>
                             <Activity className="text-green-400" size={24} />
                          </div>
                          <div className={`${isLight ? "bg-[#edf8f5] border border-slate-200" : "bg-slate-800/50 border border-slate-700"} p-4 rounded-xl flex justify-between items-center`}>
                             <div>
                                <p className={`${isLight ? "text-slate-600" : "text-slate-400"} text-xs uppercase`}>SpO2</p>
                                <p className={`text-2xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>{selectedPatientDetails.spo2 || 98} <span className="text-sm font-normal text-slate-500">%</span></p>
                             </div>
                             <Wind className="text-cyan-400" size={24} />
                          </div>
                       </div>

                       {/* Additional Vitals Row */}
                       <div className="hidden grid-cols-2 md:grid-cols-4 gap-4">
                          <div className={`${isLight ? "bg-[#edf8f5] border border-slate-200" : "bg-slate-800/50 border border-slate-700"} p-4 rounded-xl`}>
                             <div className="flex items-center justify-between mb-2">
                                <p className={`${isLight ? "text-slate-600" : "text-slate-400"} text-xs uppercase`}>Sleep Quality</p>
                                <Moon className="text-purple-400" size={18} />
                             </div>
                             <p className={`text-xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>{selectedPatientDetails.sleepHours || 6.5} <span className="text-sm font-normal text-slate-500">hrs</span></p>
                             <p className="text-xs text-yellow-400 mt-1">Below optimal</p>
                          </div>
                          <div className={`${isLight ? "bg-[#edf8f5] border border-slate-200" : "bg-slate-800/50 border border-slate-700"} p-4 rounded-xl`}>
                             <div className="flex items-center justify-between mb-2">
                                <p className={`${isLight ? "text-slate-600" : "text-slate-400"} text-xs uppercase`}>Steps Today</p>
                                <Footprints className="text-orange-400" size={18} />
                             </div>
                             <p className={`text-xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>{selectedPatientDetails.steps || "4,250"}</p>
                             <p className="text-xs text-green-400 mt-1">+12% from yesterday</p>
                          </div>
                          <div className={`${isLight ? "bg-[#edf8f5] border border-slate-200" : "bg-slate-800/50 border border-slate-700"} p-4 rounded-xl`}>
                             <div className="flex items-center justify-between mb-2">
                                <p className={`${isLight ? "text-slate-600" : "text-slate-400"} text-xs uppercase`}>Glucose</p>
                                <Droplets className="text-pink-400" size={18} />
                             </div>
                             <p className={`text-xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>{selectedPatientDetails.glucose || 105} <span className="text-sm font-normal text-slate-500">mg/dL</span></p>
                             <p className="text-xs text-green-400 mt-1">Normal range</p>
                          </div>
                          <div className={`${isLight ? "bg-[#edf8f5] border border-slate-200" : "bg-slate-800/50 border border-slate-700"} p-4 rounded-xl`}>
                             <div className="flex items-center justify-between mb-2">
                                <p className={`${isLight ? "text-slate-600" : "text-slate-400"} text-xs uppercase`}>Weight</p>
                                <Gauge className="text-blue-400" size={18} />
                             </div>
                             <p className={`text-xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>{selectedPatientDetails.weight || 68} <span className="text-sm font-normal text-slate-500">kg</span></p>
                             <p className={`text-xs mt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>Stable</p>
                          </div>
                       </div>

                       {/* AI Stage Result */}
                     <div className={`${isLight ? "bg-[#edf8f5] border border-slate-200" : "bg-slate-800/30 border border-slate-700"} rounded-xl p-6`}>
  <h3 className={`${isLight ? "text-slate-950" : "text-white"} font-semibold flex items-center mb-4`}>
    <Brain className="mr-2 text-blue-400" size={20}/> 
    Disease Stage Assessment
  </h3>
  
  {/* Progress Bar */}
  <div className={`h-2 rounded-full flex mb-2 ${isLight ? "bg-slate-200" : "bg-slate-700"}`}>
    {[0, 1, 2, 3].map(step => (
      <div 
        key={step} 
        className={`flex-1 h-full border-r border-slate-900 last:border-0 ${step <= (selectedPatientDetails.stageLevel || 0) ? 'bg-blue-500' : 'bg-transparent'}`}
      />
    ))}
  </div>
  
  <div className="flex justify-between text-xs text-slate-500 uppercase font-medium mb-4">
    <span>Normal</span><span>MCI</span><span>Mild</span><span>Severe</span>
  </div>

  {/* Top Row: Stage Info & Status Badge */}
  <div className={`p-4 rounded-t-xl border-x border-t flex justify-between items-center ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800 border-slate-700"}`}>
    <div>
      <p className={`text-xs uppercase ${isLight ? "text-slate-600" : "text-slate-400"}`}>Current Stage</p>
      <p className={`text-xl font-bold leading-tight ${isLight ? "text-slate-950" : "text-white"}`}>
        {selectedPatientDetails.currentStage || "Mild Cognitive Impairment"}
      </p>
    </div>
    
    {(selectedPatientDetails.currentStage === "Pending Analysis" || !selectedPatientDetails.currentStage) ? 
      <span className="text-yellow-400 text-xs font-bold border border-yellow-400/30 px-2 py-1 rounded whitespace-nowrap">AI Required</span> :
      <span className="text-green-400 text-xs font-bold border border-green-400/30 px-2 py-1 rounded whitespace-nowrap">AI Analyzed</span>
    }
  </div>

  {/* Bottom Row: AI Insight (Full Width) */}
  {selectedPatientDetails.inferenceText && (
    <div className={`p-4 border rounded-b-xl border-t-0 ${isLight ? "bg-slate-50/80 border-slate-200" : "bg-slate-800/50 border-slate-700"}`}>
      <div className="p-3 bg-blue-500/10 border-l-2 border-blue-500 rounded">
        <p className="text-xs text-blue-400 font-bold uppercase mb-1 flex items-center">
          <Info size={12} className="mr-1"/> AI Clinical Insight
        </p>
        <p className={`text-sm italic leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
          "{selectedPatientDetails.inferenceText}"
        </p>
      </div>
    </div>
  )}
</div>

{/* AI Trajectory Result */}
<div className={`${isLight ? "bg-[#edf8f5] border border-slate-200" : "bg-slate-800/30 border border-slate-700"} rounded-xl p-6`}>
  <h3 className={`${isLight ? "text-slate-950" : "text-white"} font-semibold flex items-center mb-4`}>
    <TrendingDown className="mr-2 text-purple-400" size={20}/> 
    Progression Trajectory
  </h3>

  {/* Grid for small data points */}
  <div className="grid grid-cols-2 gap-4 mb-4">
    <div className={`p-4 rounded-xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800 border-slate-700"}`}>
      <p className={`text-xs uppercase mb-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>Decline Rate</p>
      <p className={`text-xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
        {selectedPatientDetails.predictedDecline || "2.3% / month"}
      </p>
    </div>

    <div className={`p-4 rounded-xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800 border-slate-700"}`}>
      <p className={`text-xs uppercase mb-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>Time to Next Stage</p>
      <p className={`text-xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
        {selectedPatientDetails.trajectoryMonths > 0 
          ? `${selectedPatientDetails.trajectoryMonths} Months` 
          : "~18 Months"}
      </p>
    </div>
  </div>

  {/* Full-width Inference Block */}
  {/* {selectedPatientDetails.inferenceText && (
    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
      <div className="flex items-center space-x-2 mb-2">
        <div className="p-1 bg-blue-500/20 rounded">
          <Info size={14} className="text-blue-400" />
        </div>
        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
          AI Clinical Insight
        </h4>
      </div>
      <p className={`text-sm italic leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
        "{selectedPatientDetails.inferenceText}"
      </p>
    </div>
  )} */}

  {selectedPatientDetails.trajInference && (
    <div className="mt-4 bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
      <div className="flex items-center space-x-2 mb-2">
        <div className="p-1 bg-purple-500/20 rounded">
          <TrendingDown size={14} className="text-purple-400" />
        </div>
        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
          Trajectory Insight
        </h4>
      </div>
      <p className="text-sm text-slate-300 italic leading-relaxed">
        "{selectedPatientDetails.trajInference}"
      </p>
    </div>
  )}

  {selectedPatientDetails.trajectoryDebug?.pastStagesSent?.length > 0 && (
    <div className={`mt-4 rounded-xl p-4 border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/70 border-slate-700"}`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
        Past Stages Sent to Trajectory API
      </p>
      <div className="flex flex-wrap gap-2">
        {selectedPatientDetails.trajectoryDebug.pastStagesSent.map((stage, index) => (
          <span
            key={`${stage}-${index}`}
            className="px-3 py-1 rounded-full text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-200"
          >
            {stage}
          </span>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-3 break-words">
        Request string: {selectedPatientDetails.trajectoryDebug.pastStagesString}
      </p>
    </div>
  )}


                       </div>

{/* MRI Scan Comparison Charts */}
<MriComparisonCharts aiHistory={aiHistory} />

{/* AI Analysis History & Comparison */}
<div className={`${isLight ? "bg-[#edf8f5] border border-slate-200" : "bg-slate-800/30 border border-slate-700"} rounded-xl p-6`}>
  <div className="flex items-center justify-between mb-4">
    <h3 className={`${isLight ? "text-slate-950" : "text-white"} font-semibold flex items-center`}>
      <History className="mr-2 text-cyan-400" size={20}/>
      Analysis History
      <span className="ml-2 text-xs text-slate-400 font-normal">
        ({aiHistory.length} {aiHistory.length === 1 ? "run" : "runs"})
      </span>
    </h3>
    {aiHistory.length > 1 && (
      <select
        value={compareWithId || ""}
        onChange={(e) => setCompareWithId(e.target.value || null)}
        className={`${isLight ? "bg-[#edf8f5] border border-slate-300 text-slate-700" : "bg-slate-800 border border-slate-700 text-slate-200"} text-xs rounded px-2 py-1`}
      >
        <option value="">Compare with…</option>
        {aiHistory.slice(1).map((h) => (
          <option key={h.id} value={h.id}>
            {formatDate(h.createdAt)} — {h.currentStage}
          </option>
        ))}
      </select>
    )}
  </div>

  {aiHistory.length === 0 ? (
    <p className="text-sm text-slate-500 italic">
      No previous AI analyses. Run a diagnostic to create the first record.
    </p>
  ) : (
    <>
      {/* History list */}
      <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
        {aiHistory.map((h, idx) => (
          <div
            key={h.id}
            className={`p-3 rounded-lg border text-sm flex justify-between items-center ${
              idx === 0
                ? "bg-blue-500/10 border-blue-500/30"
                : compareWithId === h.id
                ? "bg-purple-500/10 border-purple-500/30"
                : "bg-slate-800/50 border-slate-700"
            }`}
          >
            <div>
              <p className={`${isLight ? "text-slate-950" : "text-white"} font-medium`}>
                {h.currentStage}
                {idx === 0 && (
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-blue-400 font-bold">
                    Latest
                  </span>
                )}
              </p>
              <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                {formatDate(h.createdAt)} · Decline:{" "}
                {h.predictedDecline || "—"} · Conf:{" "}
                {h.stageApi?.confidence != null
                  ? `${(h.stageApi.confidence * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
            {idx !== 0 && (
              <button
                onClick={() =>
                  setCompareWithId(compareWithId === h.id ? null : h.id)
                }
                className="text-xs px-2 py-1 rounded border border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
              >
                {compareWithId === h.id ? "Clear" : "Compare"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Side-by-side comparison */}
      {compareWithId && aiHistory[0] && (() => {
        const prev = aiHistory.find((h) => h.id === compareWithId);
        const curr = aiHistory[0];
        if (!prev) return null;
        const Row = ({ label, a, b }) => (
          <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-700/50 text-sm">
            <span className="text-slate-400">{label}</span>
            <span className="text-slate-300">{a ?? "—"}</span>
            <span className="text-white font-medium">{b ?? "—"}</span>
          </div>
        );
        const stageChanged = prev.currentStage !== curr.currentStage;
        return (
          <div className={`${isLight ? "bg-slate-50 border border-slate-200" : "bg-slate-900/60 border border-slate-700"} rounded-lg p-4`}>
            <div className={`grid grid-cols-3 gap-2 pb-2 border-b text-xs uppercase tracking-wider ${isLight ? "border-slate-200" : "border-slate-700"}`}>
              <span className="text-slate-500">Metric</span>
              <span className="text-purple-400">
                Previous ({formatDate(prev.createdAt)})
              </span>
              <span className="text-blue-400">
                Latest ({formatDate(curr.createdAt)})
              </span>
            </div>
            <Row label="Stage" a={prev.currentStage} b={curr.currentStage} />
            <Row
              label="Stage Level"
              a={prev.stageLevel}
              b={curr.stageLevel}
            />
            <Row
              label="Confidence"
              a={
                prev.stageApi?.confidence != null
                  ? `${(prev.stageApi.confidence * 100).toFixed(1)}%`
                  : null
              }
              b={
                curr.stageApi?.confidence != null
                  ? `${(curr.stageApi.confidence * 100).toFixed(1)}%`
                  : null
              }
            />
            <Row
              label="Decline Rate"
              a={prev.predictedDecline}
              b={curr.predictedDecline}
            />
            <Row
              label="Time to Next"
              a={prev.trajectoryMonths}
              b={curr.trajectoryMonths}
            />
            {stageChanged && (
              <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-300">
                Stage changed from <b>{prev.currentStage}</b> to{" "}
                <b>{curr.currentStage}</b> between these runs.
              </div>
            )}
          </div>
        );
      })()}
    </>
  )}
</div>

                    </div>

                    {/* RIGHT: MRI & Device */}
                    <div className="space-y-6">
                        
                        {/* IoT Info */}
                        <div className={`${isLight ? "bg-[#edf8f5] border border-slate-200" : "bg-slate-800/30 border border-slate-700"} rounded-xl p-6`}>
                           <h3 className={`${isLight ? "text-slate-950" : "text-white"} font-semibold flex items-center mb-4`}><Smartphone className="mr-2 text-green-400" size={20}/> Device Status</h3>
                           <div className="space-y-3 text-sm">
                              <div className={`flex justify-between pb-2 border-b ${isLight ? "border-slate-200" : "border-slate-700"}`}>
                                 <span className={`${isLight ? "text-slate-600" : "text-slate-400"}`}>ID</span>
                                 <span className={`${isLight ? "text-slate-950" : "text-white"} font-mono`}>{selectedPatientDetails.id.substring(0,8)}...</span>
                              </div>
                              <div className={`flex justify-between pb-2 border-b ${isLight ? "border-slate-200" : "border-slate-700"}`}>
                                 <span className={`${isLight ? "text-slate-600" : "text-slate-400"}`}>Sync</span>
                                 <span className={`${isLight ? "text-slate-950" : "text-white"}`}>{selectedPatientDetails.lastUpdate}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className={`${isLight ? "text-slate-600" : "text-slate-400"}`}>Connection</span>
                                 <span className="text-green-400">● Active</span>
                              </div>
                           </div>
                       

                       

                           {/* 2. UPDATED BUTTON */}
                           {/* <button 
                              onClick={() => fileInputRef.current.click()}
                              disabled={uploading}
                              className="w-full mt-4 py-2 border border-slate-600 text-slate-300 rounded hover:bg-slate-700 transition-colors text-sm flex justify-center items-center"
                           >
                              {uploading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin mr-2"></div>
                                  Uploading...
                                </>
                              ) : (
                                "Upload DICOM"
                              )}
                           </button> */}
                        </div>

                    </div>
                </div>
              </div>
            </div>
          )}

          {/* === VIDEO CONSULTATION MODAL === */}
          {showVideoCall && (() => {
            const p = selectedPatientDetails || {};
            const statePill =
              callStatus === "connected"
                ? { dot: "bg-green-400", label: `Live · ${formatCallDuration(callDuration)}` }
                : callStatus === "connecting"
                ? { dot: "bg-yellow-400 animate-pulse", label: peerConnState === "connecting" ? "Establishing peer…" : "Ringing patient…" }
                : { dot: "bg-red-400", label: "Disconnected" };
            const netQuality =
              peerConnState === "connected"
                ? { label: "Good", color: "text-green-400" }
                : peerConnState === "connecting" || peerConnState === "new"
                ? { label: "Negotiating", color: "text-yellow-400" }
                : { label: "Unstable", color: "text-red-400" };
            const riskColor =
              p.riskLevel === "high"
                ? isLight ? "text-red-600" : "text-red-400"
                : p.riskLevel === "medium"
                ? isLight ? "text-amber-600" : "text-yellow-400"
                : p.riskLevel === "low"
                ? isLight ? "text-emerald-600" : "text-green-400"
                : isLight ? "text-slate-600" : "text-slate-400";
            const callShell = isLight
              ? "bg-[linear-gradient(180deg,#e8f6f3_0%,#e5f4f7_52%,#e8f0fb_100%)] text-slate-950"
              : "bg-slate-950";
            const callHeader = isLight
              ? "bg-[#eaf7f4]/95 backdrop-blur-sm border-b border-slate-200 shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
              : "bg-slate-900/95 backdrop-blur-sm border-b border-slate-800";
            const callStage = isLight
              ? "bg-[linear-gradient(135deg,#e8f6f3_0%,#e5f4f7_52%,#e8f0fb_100%)]"
              : "bg-slate-900";
            const stageOverlay = isLight ? "bg-[#eaf7f4]/82" : "bg-slate-900/80";
            const panelSurface = isLight
              ? "bg-[#eaf7f4]/95 backdrop-blur-sm border-l border-slate-200 shadow-[-18px_0_42px_rgba(15,23,42,0.06)]"
              : "bg-slate-900/95 backdrop-blur-sm border-l border-slate-800";
            const panelBorder = isLight ? "border-slate-200" : "border-slate-800";
            const callHeading = isLight ? "text-slate-950" : "text-white";
            const callMuted = isLight ? "text-slate-600" : "text-slate-400";
            const callSubtle = isLight ? "text-slate-500" : "text-slate-500";
            const iconButton = isLight
              ? "p-2 text-slate-500 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors"
              : "p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors";
            const liveControl = isLight
              ? "bg-[#eaf7f4]/95 backdrop-blur-sm border border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.14)]"
              : "bg-slate-900/95 backdrop-blur-sm border border-slate-700 shadow-2xl";
            const enabledControl = isLight
              ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
              : "bg-slate-700 hover:bg-slate-600 text-white";
            const notesInput = isLight
              ? "w-full flex-1 min-h-[120px] bg-[#f0faf7] border border-slate-300 rounded-lg p-2.5 text-slate-950 text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 resize-none"
              : "w-full flex-1 min-h-[120px] bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none";
            const copySessionId = () => {
              if (!sessionIdRef.current) return;
              navigator.clipboard?.writeText(sessionIdRef.current).catch(() => {});
              setCopiedSessionId(true);
              setTimeout(() => setCopiedSessionId(false), 1500);
            };
            return (
              <div className={`fixed inset-0 z-[60] flex flex-col ${callShell}`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-3 px-5 ${callHeader}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {p.avatar || "P"}
                    </div>
                    <div>
                      <h3 className={`${callHeading} font-semibold leading-tight`}>
                        {p.name || "Patient"}
                        <span className={`${callSubtle} font-normal ml-2 text-sm`}>
                          · {p.age || "—"}y · {p.diagnosis || "Unknown"}
                        </span>
                      </h3>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${statePill.dot}`} />
                        <span className={`text-xs ${callMuted}`}>{statePill.label}</span>
                        <span className="text-slate-700">•</span>
                        <span className={`text-xs ${netQuality.color}`}>
                          {netQuality.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentRoomId && (
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(currentRoomId).catch(() => {});
                          setCopiedSessionId(true);
                          setTimeout(() => setCopiedSessionId(false), 1500);
                        }}
                        title={`Room: ${currentRoomId} — click to copy`}
                        className={`group flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                          isLight
                            ? "bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="uppercase tracking-wider text-[10px] opacity-70">
                          Room
                        </span>
                        <span className="font-mono font-semibold">
                          {copiedSessionId ? "Copied ✓" : currentRoomId}
                        </span>
                        <Clipboard
                          size={11}
                          className="opacity-0 group-hover:opacity-70 transition-opacity"
                        />
                      </button>
                    )}
                    <button
                      onClick={() => setShowPatientPanel((v) => !v)}
                      title="Toggle patient panel"
                      className={iconButton}
                    >
                      <FileText size={18} />
                    </button>
                    <button
                      onClick={endVideoCall}
                      className={iconButton}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Video stage */}
                  <div className={`flex-1 relative overflow-hidden ${callStage}`}>
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {callStatus !== "connected" && (
                      <div className={`absolute inset-0 flex items-center justify-center ${stageOverlay}`}>
                        <div className="text-center max-w-md px-6">
                          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-5 shadow-2xl">
                            <span className="text-4xl font-bold text-white">
                              {p.avatar || "P"}
                            </span>
                          </div>
                          <h3 className={`text-2xl ${callHeading} font-semibold mb-1`}>
                            {p.name || "Patient"}
                          </h3>
                          <p className={`${callMuted} text-sm mb-5`}>
                            {callStatus === "connecting"
                              ? sessionIdRef.current
                                ? "Joined — waiting for caregiver's stream to arrive…"
                                : "Looking for incoming call…"
                              : "Disconnected"}
                          </p>
                          {callStatus === "connecting" && (
                            <div className="flex items-center justify-center space-x-1.5">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Local PiP */}
                    <div className={`absolute bottom-24 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 shadow-2xl ${
                      isLight ? "border-white bg-slate-100" : "border-slate-700 bg-slate-800"
                    }`}>
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {!isVideoOn && (
                        <div className={`absolute inset-0 flex items-center justify-center ${isLight ? "bg-slate-100" : "bg-slate-800"}`}>
                          <VideoOff size={28} className="text-slate-500" />
                        </div>
                      )}
                      <div className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${
                        isLight ? "bg-[#edf8f5]/90 text-slate-800 shadow-sm" : "bg-slate-900/90 text-white"
                      }`}>
                        You
                      </div>
                    </div>

                    {/* Controls */}
                    <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-3 rounded-full px-5 py-2.5 ${liveControl}`}>
                      <button
                        onClick={toggleAudio}
                        className={`p-3 rounded-full transition-colors ${isAudioOn ? enabledControl : "bg-red-500 hover:bg-red-600 text-white"}`}
                        title={isAudioOn ? "Mute" : "Unmute"}
                      >
                        {isAudioOn ? <Mic size={18} /> : <MicOff size={18} />}
                      </button>
                      <button
                        onClick={toggleVideo}
                        className={`p-3 rounded-full transition-colors ${isVideoOn ? enabledControl : "bg-red-500 hover:bg-red-600 text-white"}`}
                        title={isVideoOn ? "Turn off camera" : "Turn on camera"}
                      >
                        {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
                      </button>
                      <div className={`w-px h-6 mx-1 ${isLight ? "bg-slate-200" : "bg-slate-700"}`} />
                      <button
                        onClick={endVideoCall}
                        className="flex items-center space-x-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors font-medium text-sm"
                        title="End call"
                      >
                        <PhoneOff size={16} />
                        <span>End</span>
                      </button>
                    </div>
                  </div>

                  {/* Clinical side panel */}
                  {showPatientPanel && (
                    <aside className={`w-80 overflow-y-auto flex flex-col ${panelSurface} ${
                      isLight ? "[&_.text-white]:text-slate-950 [&_.text-slate-300]:text-slate-600 [&_.text-slate-400]:text-slate-600" : ""
                    }`}>
                      <div className={`p-4 border-b ${panelBorder}`}>
                        <h4 className={`${callHeading} font-semibold text-sm flex items-center`}>
                          <Stethoscope size={15} className="mr-2 text-emerald-400" />
                          Clinical Summary
                        </h4>
                      </div>

                      {/* Vitals */}
                      <div className={`p-4 border-b ${panelBorder} space-y-2 text-sm`}>
                        <div className="flex justify-between">
                          <span className={callSubtle}>Age</span>
                          <span className="text-white">{p.age || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={callSubtle}>Gender</span>
                          <span className={`${callHeading} capitalize`}>
                            {p.gender || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={callSubtle}>Risk level</span>
                          <span className={`${riskColor} font-medium capitalize`}>
                            {p.riskLevel || "unknown"}
                            {typeof p.riskScore === "number" && p.riskScore > 0
                              ? ` · ${p.riskScore}%`
                              : ""}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={callSubtle}>BP</span>
                          <span className={callHeading}>
                            {p.bloodPressure || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={callSubtle}>HR</span>
                          <span className={callHeading}>
                            {p.heartRate ? `${p.heartRate} bpm` : "—"}
                          </span>
                        </div>
                      </div>

                      {/* AI context */}
                      <div className={`p-4 border-b ${panelBorder}`}>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                          Latest AI Analysis
                        </p>
                        {p.currentStage ? (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`${callHeading} font-medium text-sm`}>
                                {p.currentStage}
                              </span>
                              {p.aiConfidence != null && (
                                <span className={`text-[11px] ${isLight ? "text-blue-700" : "text-blue-300"} font-mono`}>
                                  {(p.aiConfidence * 100).toFixed(1)}%
                                </span>
                              )}
                            </div>
                            <div className={`h-1.5 rounded-full flex overflow-hidden mb-2 ${isLight ? "bg-slate-100" : "bg-slate-800"}`}>
                              {[0, 1, 2, 3].map((step) => (
                                <div
                                  key={step}
                                  className={`flex-1 border-r last:border-0 ${isLight ? "border-white" : "border-slate-900"} ${
                                    step <= (p.stageLevel ?? 0)
                                      ? step >= 3
                                        ? "bg-red-500"
                                        : step >= 2
                                        ? "bg-orange-400"
                                        : step >= 1
                                        ? "bg-yellow-400"
                                        : "bg-green-400"
                                      : ""
                                  }`}
                                />
                              ))}
                            </div>
                            {p.predictedDecline && (
                              <p className={`text-[11px] ${callMuted}`}>
                                Forecast: <span className={callHeading}>{p.predictedDecline}</span>
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            No AI analysis yet.
                          </p>
                        )}
                      </div>

                      {/* Medications */}
                      {Array.isArray(p.medications) && p.medications.length > 0 && (
                        <div className={`p-4 border-b ${panelBorder}`}>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 flex items-center">
                            <Pill size={11} className="mr-1" />
                            Current Medications
                          </p>
                          <ul className="space-y-1">
                            {p.medications.slice(0, 5).map((m, i) => (
                              <li key={i} className={`text-xs ${callMuted}`}>
                                • {m}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Notes - auto-saves on end */}
                      <div className="p-4 flex-1 flex flex-col">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 flex items-center">
                          <FileText size={11} className="mr-1" />
                          Call Notes
                          <span className={`ml-auto ${isLight ? "text-slate-400" : "text-slate-600"} normal-case tracking-normal font-normal`}>
                            saved on end
                          </span>
                        </p>
                        <textarea
                          value={callNotes}
                          onChange={(e) => setCallNotes(e.target.value)}
                          placeholder="Symptoms observed, plan adjustments, follow-ups…"
                          className={notesInput}
                        />
                        <p className="text-[10px] text-slate-600 mt-2">
                          Notes are written to the consultation_sessions doc when you end the call.
                        </p>
                      </div>
                    </aside>
                  )}
                </div>
              </div>
            );
          })()}

          {/* === TREATMENT NOTES MODAL === */}
          {showNotesModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-blue-900/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <FileText size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Treatment Notes</h3>
                      <p className="text-slate-400 text-sm">Patient: {selectedPatientForDT?.name || "Selected Patient"}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowNotesModal(false)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                  {/* Treatment Notes */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      <Clipboard size={16} className="inline mr-2 text-purple-400" />
                      Clinical Notes
                    </label>
                    <textarea
                      value={treatmentNotes}
                      onChange={(e) => setTreatmentNotes(e.target.value)}
                      placeholder="Enter treatment notes, observations, and clinical findings..."
                      className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  {/* Recommendation Plan */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      <Stethoscope size={16} className="inline mr-2 text-cyan-400" />
                      Recommendation Plan
                    </label>
                    <textarea
                      value={recommendationPlan}
                      onChange={(e) => setRecommendationPlan(e.target.value)}
                      placeholder="Enter treatment recommendations, medication changes, follow-up plans..."
                      className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  {/* Quick Templates */}
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Quick Templates:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Medication review needed",
                        "Cognitive therapy recommended",
                        "Follow-up in 2 weeks",
                        "Caregiver education required",
                        "MRI follow-up scheduled",
                      ].map((template, idx) => (
                        <button
                          key={idx}
                          onClick={() => setRecommendationPlan(prev => prev + (prev ? "\n• " : "• ") + template)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors"
                        >
                          + {template}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex items-center justify-end space-x-3 bg-slate-900/50">
                  <button
                    onClick={() => setShowNotesModal(false)}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTreatmentNotes}
                    disabled={savingNotes}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                  >
                    {savingNotes ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    <span>Save Notes</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === CAREGIVER REPORT PREVIEW MODAL === */}
          {showCaregiverReportPreview && caregiverReportPreview && (
            <div className={`fixed inset-0 backdrop-blur-sm z-[75] flex items-center justify-center p-4 ${
              isLight ? "bg-slate-950/35" : "bg-black/80"
            }`}>
              <div className={`border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col ${
                isLight
                  ? "bg-[#d8eee9] border-teal-900/10 shadow-[0_35px_90px_rgba(15,23,42,0.20)]"
                  : "bg-slate-900 border-slate-700"
              }`}>
                <div className={`p-6 border-b flex items-center justify-between ${
                  isLight
                    ? "border-teal-900/10 bg-[linear-gradient(135deg,#d8eee9,#cfe7e2)]"
                    : "border-slate-800 bg-gradient-to-r from-slate-900 to-emerald-900/20"
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isLight ? "bg-teal-700/12 text-teal-800" : "bg-emerald-500/20 text-emerald-300"
                    }`}>
                      <Eye size={20} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${isLight ? "text-[#102a37]" : "text-white"}`}>
                        Caregiver Report Preview
                      </h3>
                      <p className={`text-sm ${isLight ? "text-[#365565]" : "text-slate-400"}`}>
                        Patient: {caregiverReportPreview.patient.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCaregiverReportPreview(false)}
                    className={`p-2 rounded-lg transition-all ${
                      isLight
                        ? "bg-[#eaf7f4] hover:bg-[#cfe7e2] text-[#315666] border border-teal-900/10"
                        : "bg-slate-800 hover:bg-slate-700 text-white"
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`${isLight ? "bg-[#eaf7f4] border-teal-900/10" : "bg-slate-800/40 border-slate-700"} border rounded-xl p-4`}>
                      <p className={`text-xs uppercase mb-1 ${isLight ? "text-[#517080]" : "text-slate-400"}`}>
                        Current Stage Result
                      </p>
                      <p className={`text-2xl font-bold mb-2 ${isLight ? "text-[#102a37]" : "text-white"}`}>
                        {caregiverReportPreview.currentStageResult.stage}
                      </p>
                      {caregiverReportPreview.currentStageResult.confidence != null && (
                        <p className={`text-sm ${isLight ? "text-[#365565]" : "text-slate-300"}`}>
                          Confidence:{" "}
                          {Math.round(
                            caregiverReportPreview.currentStageResult.confidence *
                              100
                          )}
                          %
                        </p>
                      )}
                      {caregiverReportPreview.currentStageResult.inferenceText && (
                        <p className={`text-sm mt-2 italic ${isLight ? "text-[#517080]" : "text-slate-400"}`}>
                          "
                          {caregiverReportPreview.currentStageResult.inferenceText}
                          "
                        </p>
                      )}
                    </div>

                    <div className={`${isLight ? "bg-[#eaf7f4] border-teal-900/10" : "bg-slate-800/40 border-slate-700"} border rounded-xl p-4`}>
                      <p className={`text-xs uppercase mb-1 ${isLight ? "text-[#517080]" : "text-slate-400"}`}>
                        Trajectory Progression
                      </p>
                      <p className={`text-lg font-semibold mb-1 ${isLight ? "text-[#102a37]" : "text-white"}`}>
                        {caregiverReportPreview.trajectory.predictedDecline}
                      </p>
                      <p className={`text-sm mb-2 ${isLight ? "text-[#365565]" : "text-slate-300"}`}>
                        Timeline: {caregiverReportPreview.trajectory.trajectoryMonths}
                      </p>
                      {caregiverReportPreview.trajectory.insight && (
                        <p className={`text-sm italic ${isLight ? "text-[#517080]" : "text-slate-400"}`}>
                          "{caregiverReportPreview.trajectory.insight}"
                        </p>
                      )}
                    </div>

                    <div className={`${isLight ? "bg-[#eaf7f4] border-teal-900/10" : "bg-slate-800/40 border-slate-700"} border rounded-xl p-4`}>
                      <p className={`text-xs uppercase mb-1 ${isLight ? "text-[#517080]" : "text-slate-400"}`}>
                        3D Brain Model Inference
                      </p>
                      <p className={`text-sm mb-2 ${isLight ? "text-[#365565]" : "text-slate-300"}`}>
                        {caregiverReportPreview.brainModel3d?.hasModel
                          ? "3D model available"
                          : "3D model not available"}
                      </p>
                      <p className={`text-sm italic ${isLight ? "text-[#517080]" : "text-slate-400"}`}>
                        {caregiverReportPreview.brainModel3d?.inferenceText
                          ? `"${caregiverReportPreview.brainModel3d.inferenceText}"`
                          : "No 3D inference available yet."}
                      </p>
                    </div>
                  </div>

                  <div className={`${isLight ? "bg-[#eaf7f4] border-teal-900/10" : "bg-slate-800/30 border-slate-700"} border rounded-xl p-4`}>
                    <h4 className={`${isLight ? "text-[#102a37]" : "text-white"} font-semibold mb-3`}>
                      Inference Details for Caregiver Report
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className={isLight ? "text-[#365565]" : "text-slate-300"}>
                        <span className={isLight ? "text-[#517080]" : "text-slate-400"}>Current Stage:</span>{" "}
                        {caregiverReportPreview.inferenceDetails?.currentStage ||
                          "No current-stage inference available."}
                      </p>
                      <p className={isLight ? "text-[#365565]" : "text-slate-300"}>
                        <span className={isLight ? "text-[#517080]" : "text-slate-400"}>Trajectory:</span>{" "}
                        {caregiverReportPreview.inferenceDetails?.trajectory ||
                          "No trajectory inference available."}
                      </p>
                      <p className={isLight ? "text-[#365565]" : "text-slate-300"}>
                        <span className={isLight ? "text-[#517080]" : "text-slate-400"}>3D Brain Model:</span>{" "}
                        {caregiverReportPreview.inferenceDetails?.brainModel3d ||
                          "No 3D brain-model inference available."}
                      </p>
                    </div>
                  </div>

                  {Array.isArray(caregiverReportPreview.trajectory.progression) &&
                    caregiverReportPreview.trajectory.progression.length > 0 && (
                      <div className={`${isLight ? "bg-[#eaf7f4] border-teal-900/10" : "bg-slate-800/30 border-slate-700"} border rounded-xl p-4`}>
                        <p className={`text-xs uppercase mb-2 ${isLight ? "text-[#517080]" : "text-slate-400"}`}>
                          Progression Points
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {caregiverReportPreview.trajectory.progression
                            .slice(0, 8)
                            .map((point, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-1 rounded-lg text-xs border ${
                                  isLight
                                    ? "border-teal-900/10 bg-[#d8eee9] text-[#315666]"
                                    : "border-slate-600 bg-slate-800 text-slate-300"
                                }`}
                              >
                                {(point.month || `Point ${idx + 1}`) +
                                  ": " +
                                  (point.stage || `${point.progress || 0}%`)}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                  <div className={`${isLight ? "bg-[#eaf7f4] border-teal-900/10" : "bg-slate-800/30 border-slate-700"} border rounded-xl p-4`}>
                    <h4 className={`${isLight ? "text-[#102a37]" : "text-white"} font-semibold mb-3`}>Cognitive Scores</h4>
                    {caregiverReportPreview.cognitiveScores.length === 0 ? (
                      <p className={`text-sm ${isLight ? "text-[#517080]" : "text-slate-400"}`}>
                        No cognitive test scores available yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {caregiverReportPreview.cognitiveScores.map((score) => (
                          <div
                            key={score.testType}
                            className={`${isLight ? "bg-[#d8eee9] border-teal-900/10" : "bg-slate-800/60 border-slate-700"} border rounded-lg p-3`}
                          >
                            <p className={`text-xs uppercase mb-1 ${isLight ? "text-[#517080]" : "text-slate-400"}`}>
                              {score.testType}
                            </p>
                            <p className={`text-lg font-bold ${isLight ? "text-[#102a37]" : "text-white"}`}>
                              {score.latestScore ?? "-"}
                              <span className={`text-xs ${isLight ? "text-[#517080]" : "text-slate-500"}`}>
                                /{score.maxScore}
                              </span>
                            </p>
                            <p className={`text-xs ${isLight ? "text-[#517080]" : "text-slate-400"}`}>
                              {score.scorePercent != null
                                ? `${score.scorePercent}% of max score`
                                : "No scored result yet"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`${isLight ? "bg-[#eaf7f4] border-teal-900/10 shadow-[0_14px_34px_rgba(15,78,83,0.08)]" : "bg-slate-800/30 border-slate-700"} border rounded-xl p-4`}>
                      <h4 className={`${isLight ? "text-[#102a37]" : "text-white"} font-semibold mb-2`}>Clinician Notes</h4>
                      <p className={`text-sm whitespace-pre-wrap ${isLight ? "text-[#315666]" : "text-slate-300"}`}>
                        {caregiverReportPreview.clinicianNotes.clinicalNotes ||
                          "No clinician notes added."}
                      </p>
                    </div>
                    <div className={`${isLight ? "bg-[#eaf7f4] border-teal-900/10 shadow-[0_14px_34px_rgba(15,78,83,0.08)]" : "bg-slate-800/30 border-slate-700"} border rounded-xl p-4`}>
                      <h4 className={`${isLight ? "text-[#102a37]" : "text-white"} font-semibold mb-2`}>
                        Recommendation Plan
                      </h4>
                      <p className={`text-sm whitespace-pre-wrap ${isLight ? "text-[#315666]" : "text-slate-300"}`}>
                        {caregiverReportPreview.clinicianNotes.recommendationPlan ||
                          "No recommendation plan added."}
                      </p>
                    </div>
                  </div>

                  <div className={`${isLight ? "bg-[#d8eee9] border-teal-900/10 text-[#517080]" : "bg-slate-800/30 border-slate-700 text-slate-400"} border rounded-xl p-4 text-xs space-y-1`}>
                    <p>Report Name: {caregiverReportPreview.caregiverReportName}</p>
                    <p>Patient ID: {caregiverReportPreview.patient.id}</p>
                    <p>
                      Caregiver IDs:{" "}
                      {caregiverReportPreview.caregiverIds.length > 0
                        ? caregiverReportPreview.caregiverIds.join(", ")
                        : "Not linked in patient profile"}
                    </p>
                    <p>
                      Generated At: {new Date(caregiverReportPreview.previewGeneratedAt).toLocaleString()}
                    </p>
                  </div>

                  {caregiverReportPreview.caregiverIds.length === 0 && (
                    <div className={`flex items-start space-x-2 border rounded-xl p-3 ${
                      isLight
                        ? "bg-amber-50 border-amber-300"
                        : "bg-yellow-500/10 border-yellow-500/30"
                    }`}>
                      <AlertCircle size={16} className={`${isLight ? "text-amber-700" : "text-yellow-400"} mt-0.5`} />
                      <p className={`text-xs ${isLight ? "text-amber-900" : "text-yellow-200"}`}>
                        No caregiver ID is linked to this patient yet. The report
                        will still be saved in caregiverReports and can be fetched
                        by patientId in the mobile app.
                      </p>
                    </div>
                  )}
                </div>

                <div className={`p-6 border-t flex items-center justify-end space-x-3 ${
                  isLight
                    ? "border-teal-900/10 bg-[#cfe7e2]/80"
                    : "border-slate-800 bg-slate-900/50"
                }`}>
                  <button
                    onClick={() => setShowCaregiverReportPreview(false)}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                      isLight
                        ? "bg-[#eaf7f4] hover:bg-[#d8eee9] text-[#315666] border border-teal-900/10 shadow-sm"
                        : "bg-slate-800 hover:bg-slate-700 text-white"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendCaregiverReport}
                    disabled={sendingCaregiverReport}
                    className={`flex items-center space-x-2 px-6 py-2.5 text-white rounded-xl font-medium transition-all disabled:opacity-50 ${
                      isLight
                        ? "bg-gradient-to-r from-[#047857] to-[#0f5f78] hover:from-[#065f46] hover:to-[#164e63] shadow-[0_14px_28px_rgba(4,120,87,0.22)]"
                        : "bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500"
                    }`}
                  >
                    {sendingCaregiverReport ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    <span>
                      {sendingCaregiverReport
                        ? "Sending..."
                        : "Send to Caregiver"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === SCHEDULE CONSULTATION MODAL === */}
          {showScheduleModal && (
            <div className={`fixed inset-0 backdrop-blur-sm z-[70] flex items-center justify-center p-4 ${
              isLight ? "bg-slate-950/35" : "bg-black/80"
            }`}>
              <div className={`rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl ${
                isLight
                  ? "bg-[#eaf7f4] border border-slate-200 shadow-[0_35px_90px_rgba(15,23,42,0.18)]"
                  : "bg-slate-900 border border-slate-700"
              }`}>
                {/* Header */}
                <div className={`p-6 border-b flex items-center justify-between ${
                  isLight
                    ? "border-slate-200 bg-[linear-gradient(135deg,#eaf7f4_0%,#dff3ee_100%)]"
                    : "border-slate-800 bg-gradient-to-r from-slate-900 to-green-900/20"
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isLight ? "bg-emerald-50 border border-emerald-100" : "bg-green-500/20"
                    }`}>
                      <CalendarPlus size={20} className="text-green-400" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>Schedule Consultation</h3>
                      <p className={`${isLight ? "text-slate-600" : "text-slate-400"} text-sm`}>Set up a video consultation session</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setShowScheduleModal(false);
                      setSelectedPatientForSchedule(null);
                    }}
                    className={`p-2 rounded-lg transition-all ${
                      isLight
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        : "bg-slate-800 hover:bg-slate-700 text-white"
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                  {/* Patient Selection */}
                  <div>
                    <label className={`block font-medium mb-2 ${isLight ? "text-slate-800" : "text-white"}`}>Select Patient</label>
                    <select 
                      value={selectedPatientForSchedule?.id || ""}
                      onChange={(e) => {
                        const patient = patients.find(p => p.id === e.target.value);
                        setSelectedPatientForSchedule(patient);
                      }}
                      className={`w-full border rounded-xl p-3 focus:outline-none ${
                        isLight
                          ? "bg-[#f0faf7] border-slate-300 text-slate-950 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                          : "bg-slate-800 border-slate-700 text-white focus:border-green-500"
                      }`}
                    >
                      <option value="">Choose a patient...</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>{patient.name} - {patient.diagnosis}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block font-medium mb-2 ${isLight ? "text-slate-800" : "text-white"}`}>Date</label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className={`w-full border rounded-xl p-3 focus:outline-none ${
                          isLight
                            ? "bg-[#f0faf7] border-slate-300 text-slate-950 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                            : "bg-slate-800 border-slate-700 text-white focus:border-green-500"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block font-medium mb-2 ${isLight ? "text-slate-800" : "text-white"}`}>Time</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className={`w-full border rounded-xl p-3 focus:outline-none ${
                          isLight
                            ? "bg-[#f0faf7] border-slate-300 text-slate-950 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                            : "bg-slate-800 border-slate-700 text-white focus:border-green-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Consultation Type */}
                  <div>
                    <label className={`block font-medium mb-2 ${isLight ? "text-slate-800" : "text-white"}`}>Consultation Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Follow-up", "Initial", "Emergency"].map((type) => (
                        <button
                          key={type}
                          className={`p-3 border rounded-xl text-sm font-medium transition-all ${
                            isLight
                              ? "bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700"
                              : "bg-slate-800 hover:bg-green-600/20 border-slate-700 hover:border-green-500/50 text-white"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className={`block font-medium mb-2 ${isLight ? "text-slate-800" : "text-white"}`}>Notes (Optional)</label>
                    <textarea
                      value={scheduleNotes}
                      onChange={(e) => setScheduleNotes(e.target.value)}
                      placeholder="Add any notes for this appointment..."
                      className={`w-full h-20 border rounded-xl p-3 resize-none focus:outline-none ${
                        isLight
                          ? "bg-[#f0faf7] border-slate-300 text-slate-950 placeholder-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                          : "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-green-500"
                      }`}
                    />
                  </div>

                  {/* Notification */}
                  <div className={`flex items-center space-x-3 p-3 border rounded-xl ${
                    isLight ? "bg-emerald-50 border-emerald-200" : "bg-green-500/10 border-green-500/20"
                  }`}>
                    <Bell size={18} className="text-green-400" />
                    <p className={`text-sm ${isLight ? "text-slate-700" : "text-slate-300"}`}>Patient and caregiver will be notified via email and app notification.</p>
                  </div>
                </div>

                {/* Footer */}
                <div className={`p-6 border-t flex items-center justify-end space-x-3 ${
                  isLight ? "border-slate-200 bg-slate-50/80" : "border-slate-800 bg-slate-900/50"
                }`}>
                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      setSelectedPatientForSchedule(null);
                    }}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                      isLight
                        ? "bg-[#edf8f5] hover:bg-[#dff3ee] text-slate-700 border border-slate-200"
                        : "bg-slate-800 hover:bg-slate-700 text-white"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Schedule logic here
                      setShowScheduleModal(false);
                      setSelectedPatientForSchedule(null);
                      alert("Consultation scheduled successfully!");
                    }}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-medium transition-all"
                  >
                    <Send size={18} />
                    <span>Schedule</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export { Dashboard };
export default Dashboard;
