import React, { useState, useEffect, useRef } from "react";
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
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
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
} from "../../services/userService";
import {
  formatDate,
  base64ToBlob,
  API_STAGE_URL,
  API_PROGRESSION_URL,
  API_3D_MODEL_URL,
  STAGE_LEVEL_MAP,
  deriveRiskFromStage,
} from "./config";
import MriComparisonCharts from "./MriComparisonCharts";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopBar from "./DashboardTopBar";
import RequestsSection from "./sections/RequestsSection";
import DigitalTwinSection from "./sections/DigitalTwinSection";
import TeleconsultationSection from "./sections/TeleconsultationSection";
import PatientsSection from "./sections/PatientsSection";

const Dashboard = ({ user, onLogout }) => {
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
  const [analyzing, setAnalyzing] = useState(false);

  // Video Consultation State
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [callStatus, setCallStatus] = useState("idle"); // idle, connecting, connected, ended
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const callTimerRef = useRef(null);
  // WebRTC refs
  const pcRef = useRef(null);
  const sessionIdRef = useRef(null);
  const unsubSignalsRef = useRef(null);
  const seenSignalsRef = useRef(new Set());
  const pendingCandidatesRef = useRef([]);

  // Treatment Notes State
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [recommendationPlan, setRecommendationPlan] = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

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
      const realPatients = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
       const firstScan = (data.mriScans && data.mriScans.length > 0) ? data.mriScans[0] : null;

        realPatients.push({
          id: doc.id,
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
          
          deviceData: data.deviceData || {},

          // Digital Twin clinical fields (all optional — render empty states when absent)
          stage: data.stage || data.diagnosis || null,
          stageLevel: typeof data.stageLevel === "number" ? data.stageLevel : null,
          progression: Array.isArray(data.progression) ? data.progression : [],
          regions: Array.isArray(data.regions) ? data.regions : [],
          cognitiveTests: Array.isArray(data.cognitiveTests) ? data.cognitiveTests : [],
          treatmentPlan: Array.isArray(data.treatmentPlan) ? data.treatmentPlan : [],
          recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
          predictedDecline: data.predictedDecline || null,
          trajectoryMonths: data.trajectoryMonths || null,
          aiConfidence: data.aiConfidence ?? null,
          lastAnalysisAt: data.lastAnalysisAt
            ? formatDate(data.lastAnalysisAt)
            : null,

          // 3. Pass the full array. We will process base64Data in handleViewPatient
          mriScans: data.mriScans || []
        });
      });

      

      setPatients(realPatients);

      // C. Fetch Consultations for this clinician
      const clinicianConsultations = await getClinicianConsultations(user.uid);
      setConsultations(clinicianConsultations);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
    setLoading(false);
  };
  // === 3D FOLDER UPLOAD LOGIC ===
  const handleFolderUpload = async (e) => {
    if (!selectedPatientForDT) {
      alert("Please select a patient first.");
      return;
    }
    setAnalyzing(true);
    
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

// FIX: Read as Blob (Binary File), NOT JSON
const blobResponse = await res.blob(); 
const meshUrl = URL.createObjectURL(blobResponse);
const inferenceText = res.headers.get("X-Gemini-Inference") || "Analysis complete.";
// Update selected patient state with 3D data
setSelectedPatientForDT(prev => ({
  ...prev,
  meshUrl: meshUrl,
  meshInference: inferenceText,
  detectedRegions: ["Hippocampus", "Ventricles", "Cortex"],
}));
      alert("Digital Twin Model Generated Successfully!");
    } catch (err) {
      console.error(err);
      // alert("Failed to generate 3D model. Check API connection.");
    } finally {
      setAnalyzing(false);
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

      // 1. Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Create the consultation session in Firestore (status: waiting)
      const session = await createConsultationSession(
        user.uid,
        selectedPatientDetails.id,
        null
      );
      sessionIdRef.current = session.id;
      console.log("Consultation session created:", session.id);

      // 3. Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Remote stream arrives here
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

      // Ship local ICE candidates to the patient via Firestore
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
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          console.warn("Peer connection lost:", pc.connectionState);
        }
      };

      // 4. Subscribe to incoming signals from the patient (answer + ICE)
      unsubSignalsRef.current = subscribeToSignalingData(
        session.id,
        user.uid,
        async (signal) => {
          if (seenSignalsRef.current.has(signal.id)) return;
          seenSignalsRef.current.add(signal.id);

          try {
            if (signal.type === "answer") {
              if (pc.signalingState === "have-local-offer") {
                await pc.setRemoteDescription(
                  new RTCSessionDescription(signal.data)
                );
                // Drain any ICE candidates that arrived before the answer
                for (const c of pendingCandidatesRef.current) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(c));
                  } catch (e) {
                    console.warn("Pending ICE add failed:", e);
                  }
                }
                pendingCandidatesRef.current = [];
              }
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

      // 5. Create and send the offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignalingData(
        session.id,
        "offer",
        { type: offer.type, sdp: offer.sdp },
        user.uid
      );
      console.log("Offer sent. Waiting for patient to answer…");
    } catch (error) {
      console.error("Error starting video call:", error);
      setCallStatus("idle");
      alert(
        error.name === "NotAllowedError"
          ? "Camera/microphone access denied. Please allow access and try again."
          : "Could not start call: " + (error.message || "Unknown error")
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
    // Mark the session ended in Firestore
    if (sessionIdRef.current) {
      try { await updateConsultationStatus(sessionIdRef.current, "ended"); } catch {}
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

    setShowVideoCall(false);
    setCallStatus("idle");
    setCallDuration(0);
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
const handleViewPatient = async (patientId) => {
    try {
      let patientData = patients.find(p => p.id === patientId);
      if (!patientData) return;

      // Fetch AI analysis history for this patient (newest first)
      let history = [];
      try {
        const historySnap = await getDocs(
          query(
            collection(db, "patients", patientId, "aiAnalyses"),
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
            inferenceText: latestAnalysis.inferenceText,
            trajInference: latestAnalysis.trajInference,
          }
        : {};

      setSelectedPatientDetails({
        ...patientData,
        ...latestVitals,
        ...dummyClinicalData,
        ...aiSeed,
        mriScans: processedScans,
        medications: patientData.medications || ["Donepezil 10mg", "Memantine 20mg"]
      });

      setShowPatientModal(true);
    } catch (error) {
      console.error("Error opening details:", error);
    }
  };
  // --- 4. AI ANALYSIS (SEND DICOM TO BOTH APIS) ---
// --- 4. AI ANALYSIS (SEND DICOM TO BOTH APIS) ---
  const analyzePatientData = async () => {
    if (!selectedPatientDetails) return;
    setAnalyzing(true);

    try {
      // 1. PREPARE MRI DATA
      const latestScan = selectedPatientDetails.mriScans.length > 0 
        ? selectedPatientDetails.mriScans[0] 
        : null;
      const mriBase64 = latestScan ? latestScan.base64Data : null;

      if (!mriBase64) {
        alert("No MRI data found. Cannot run diagnostics.");
        setAnalyzing(false);
        return;
      }

      // Convert Base64 to File
      const blob = base64ToBlob(mriBase64);
      const mriFile = new File([blob], "patient_scan.dcm", { type: "application/dicom" });
      
      // Create FormData (Both APIs expect a file upload)
      const formData = new FormData();
      formData.append("file", mriFile); 

      // 2. CALL BOTH APIS IN PARALLEL
      console.log("Sending DICOM to AI Models...");

      const [stageRes, progRes] = await Promise.all([
        // API 1: Current Stage Detection
        axios.post(API_STAGE_URL, formData, {
           headers: { "Content-Type": "multipart/form-data" },
        }),
        // API 2: Progression/Trajectory Prediction
        axios.post(API_PROGRESSION_URL, formData, {
           headers: { "Content-Type": "multipart/form-data" },
        })
      ]);

      console.log("Stage API Result:", stageRes.data);
      console.log("Progression API Result:", progRes.data);

      // 3. PROCESS RESULTS
      
      // A. Extract Current Stage from Stage API
      // Assuming Stage API returns: { "stage": "MCI", "confidence": 0.95 }
      const currentStage = stageRes.data.stage || "Unknown";
      const inferenceText = stageRes.data.explanation;
      const trajInference=progRes.data.explanation;
      // B. Extract Trajectory from Progression API
      // Python returns: { "next_stage_prediction": ["AD"] }
      const nextStagesList = progRes.data.next_stage_prediction || [];
      const predictedDecline = nextStagesList.length > 0 
          ? nextStagesList.join(" -> ") 
          : "Stable";

      // C. Calculate Stage Level + derive Risk from stage + confidence
      const stageLevelIndex =
        STAGE_LEVEL_MAP[currentStage] !== undefined ? STAGE_LEVEL_MAP[currentStage] : 0;
      const confidence = stageRes.data.confidence ?? 1;
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
        trajectoryMonths: "12 (Est.)"
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
          stageApi: {
            stage: stageRes.data.stage || null,
            confidence: stageRes.data.confidence ?? null,
            details: stageRes.data.details || null,
            explanation: stageRes.data.explanation || null,
          },
          progressionApi: {
            next_stage_prediction: nextStagesList,
            explanation: progRes.data.explanation || null,
          },
          scanRef: {
            type: latestScan?.fileType || null,
            uploadedAt: latestScan?.uploadedAt || null,
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
          riskLevel,
          riskScore,
          stageLevel: stageLevelIndex,
          predictedDecline,
          trajectoryMonths: "12 (Est.)",
          aiConfidence: confidence,
          lastAnalysisAt: serverTimestamp(),
        });
      } catch (saveErr) {
        console.error("Failed to save AI analysis to Firestore:", saveErr);
      }

    } catch (error) {
      console.error("AI Analysis Error:", error);
      const msg = error.response?.data?.error || error.message;
      alert(`AI Analysis Failed: ${msg}`);
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
    <div className="min-h-screen bg-slate-950 flex font-sans">
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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {activeSection === "digitalTwin" ? "Digital Twin Analysis 🧠" : 
               activeSection === "teleconsultation" ? "Teleconsultation Hub 📹" : 
               "Welcome back! 👋"}
            </h1>
            <p className="text-slate-400">
              {activeSection === "patients" ? "Monitor your patients from the Firestore Registry." : 
               activeSection === "requests" ? "Review access requests from caregivers." :
               activeSection === "digitalTwin" ? "Explore AI-powered brain visualization and cognitive analysis." :
               activeSection === "teleconsultation" ? "Connect with patients through secure video consultations." :
               "Review access requests."}
            </p>
          </div>

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
              onFolderUpload={handleFolderUpload}
              onShowNotesModal={() => setShowNotesModal(true)}
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
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                        {selectedPatientDetails.avatar}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedPatientDetails.name}</h2>
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
                      <button onClick={() => setShowPatientModal(false)} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">
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
                          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                             <div>
                                <p className="text-slate-400 text-xs uppercase">Heart Rate</p>
                                <p className="text-2xl font-bold text-white">{selectedPatientDetails.heartRate || 72} <span className="text-sm font-normal text-slate-500">bpm</span></p>
                             </div>
                             <Heart className="text-red-400" size={24} />
                          </div>
                          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                             <div>
                                <p className="text-slate-400 text-xs uppercase">Temperature</p>
                                <p className="text-2xl font-bold text-white">{selectedPatientDetails.temperature || 36.8} <span className="text-sm font-normal text-slate-500">°C</span></p>
                             </div>
                             <Thermometer className="text-blue-400" size={24} />
                          </div>
                          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                             <div>
                                <p className="text-slate-400 text-xs uppercase">Blood Pressure</p>
                                <p className="text-2xl font-bold text-white">{selectedPatientDetails.bloodPressure || "128/82"}</p>
                             </div>
                             <Activity className="text-green-400" size={24} />
                          </div>
                          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex justify-between items-center">
                             <div>
                                <p className="text-slate-400 text-xs uppercase">SpO2</p>
                                <p className="text-2xl font-bold text-white">{selectedPatientDetails.spo2 || 98} <span className="text-sm font-normal text-slate-500">%</span></p>
                             </div>
                             <Wind className="text-cyan-400" size={24} />
                          </div>
                       </div>

                       {/* Additional Vitals Row */}
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                             <div className="flex items-center justify-between mb-2">
                                <p className="text-slate-400 text-xs uppercase">Sleep Quality</p>
                                <Moon className="text-purple-400" size={18} />
                             </div>
                             <p className="text-xl font-bold text-white">{selectedPatientDetails.sleepHours || 6.5} <span className="text-sm font-normal text-slate-500">hrs</span></p>
                             <p className="text-xs text-yellow-400 mt-1">Below optimal</p>
                          </div>
                          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                             <div className="flex items-center justify-between mb-2">
                                <p className="text-slate-400 text-xs uppercase">Steps Today</p>
                                <Footprints className="text-orange-400" size={18} />
                             </div>
                             <p className="text-xl font-bold text-white">{selectedPatientDetails.steps || "4,250"}</p>
                             <p className="text-xs text-green-400 mt-1">+12% from yesterday</p>
                          </div>
                          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                             <div className="flex items-center justify-between mb-2">
                                <p className="text-slate-400 text-xs uppercase">Glucose</p>
                                <Droplets className="text-pink-400" size={18} />
                             </div>
                             <p className="text-xl font-bold text-white">{selectedPatientDetails.glucose || 105} <span className="text-sm font-normal text-slate-500">mg/dL</span></p>
                             <p className="text-xs text-green-400 mt-1">Normal range</p>
                          </div>
                          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                             <div className="flex items-center justify-between mb-2">
                                <p className="text-slate-400 text-xs uppercase">Weight</p>
                                <Gauge className="text-blue-400" size={18} />
                             </div>
                             <p className="text-xl font-bold text-white">{selectedPatientDetails.weight || 68} <span className="text-sm font-normal text-slate-500">kg</span></p>
                             <p className="text-xs text-slate-400 mt-1">Stable</p>
                          </div>
                       </div>

                       {/* AI Stage Result */}
                     <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
  <h3 className="text-white font-semibold flex items-center mb-4">
    <Brain className="mr-2 text-blue-400" size={20}/> 
    Disease Stage Assessment
  </h3>
  
  {/* Progress Bar */}
  <div className="h-2 bg-slate-700 rounded-full flex mb-2">
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
  <div className="p-4 bg-slate-800 rounded-t-xl border-x border-t border-slate-700 flex justify-between items-center">
    <div>
      <p className="text-xs text-slate-400 uppercase">Current Stage</p>
      <p className="text-xl font-bold text-white leading-tight">
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
    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-b-xl border-t-0">
      <div className="p-3 bg-blue-500/10 border-l-2 border-blue-500 rounded">
        <p className="text-xs text-blue-400 font-bold uppercase mb-1 flex items-center">
          <Info size={12} className="mr-1"/> AI Clinical Insight
        </p>
        <p className="text-sm text-slate-300 italic leading-relaxed">
          "{selectedPatientDetails.inferenceText}"
        </p>
      </div>
    </div>
  )}
</div>

{/* AI Trajectory Result */}
<div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
  <h3 className="text-white font-semibold flex items-center mb-4">
    <TrendingDown className="mr-2 text-purple-400" size={20}/> 
    Progression Trajectory
  </h3>

  {/* Grid for small data points */}
  <div className="grid grid-cols-2 gap-4 mb-4">
    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
      <p className="text-xs text-slate-400 uppercase mb-1">Decline Rate</p>
      <p className="text-xl font-bold text-white">
        {selectedPatientDetails.predictedDecline || "2.3% / month"}
      </p>
    </div>

    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
      <p className="text-xs text-slate-400 uppercase mb-1">Time to Next Stage</p>
      <p className="text-xl font-bold text-white">
        {selectedPatientDetails.trajectoryMonths > 0 
          ? `${selectedPatientDetails.trajectoryMonths} Months` 
          : "~18 Months"}
      </p>
    </div>
  </div>

  {/* Full-width Inference Block */}
  {selectedPatientDetails.inferenceText && (
    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
      <div className="flex items-center space-x-2 mb-2">
        <div className="p-1 bg-blue-500/20 rounded">
          <Info size={14} className="text-blue-400" />
        </div>
        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
          AI Clinical Insight
        </h4>
      </div>
      <p className="text-sm text-slate-300 italic leading-relaxed">
        "{selectedPatientDetails.inferenceText}"
      </p>
    </div>
  )}


                       </div>

{/* MRI Scan Comparison Charts */}
<MriComparisonCharts aiHistory={aiHistory} />

{/* AI Analysis History & Comparison */}
<div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-white font-semibold flex items-center">
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
        className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1"
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
              <p className="text-white font-medium">
                {h.currentStage}
                {idx === 0 && (
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-blue-400 font-bold">
                    Latest
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400">
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
          <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-700 text-xs uppercase tracking-wider">
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
                        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
                           <h3 className="text-white font-semibold flex items-center mb-4"><Smartphone className="mr-2 text-green-400" size={20}/> Device Status</h3>
                           <div className="space-y-3 text-sm">
                              <div className="flex justify-between border-b border-slate-700 pb-2">
                                 <span className="text-slate-400">ID</span>
                                 <span className="text-white font-mono">{selectedPatientDetails.id.substring(0,8)}...</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-700 pb-2">
                                 <span className="text-slate-400">Sync</span>
                                 <span className="text-white">{selectedPatientDetails.lastUpdate}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-slate-400">Connection</span>
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
          {showVideoCall && (
            <div className="fixed inset-0 bg-slate-950 z-[60] flex flex-col">
              {/* Video Call Header */}
              <div className="flex items-center justify-between p-4 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {selectedPatientDetails?.avatar || "P"}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      Consultation with {selectedPatientDetails?.name || "Patient"}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${callStatus === "connected" ? "bg-green-400" : callStatus === "connecting" ? "bg-yellow-400 animate-pulse" : "bg-red-400"}`} />
                      <span className="text-sm text-slate-400">
                        {callStatus === "connected" ? `Connected • ${formatCallDuration(callDuration)}` : callStatus === "connecting" ? "Connecting..." : "Disconnected"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={endVideoCall}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Video Area */}
              <div className="flex-1 relative bg-slate-900 overflow-hidden">
                {/* Remote Video / Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {callStatus === "connected" ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-6">
                        <span className="text-5xl font-bold text-white">
                          {selectedPatientDetails?.avatar || "P"}
                        </span>
                      </div>
                      <h3 className="text-xl text-white font-semibold mb-2">
                        {selectedPatientDetails?.name || "Patient"}
                      </h3>
                      {callStatus === "connecting" && (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                          <span className="text-slate-400 ml-2">Starting camera...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Local Video (Picture-in-Picture) */}
                <div className="absolute bottom-24 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-800">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!isVideoOn && (
                    <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                      <VideoOff size={32} className="text-slate-500" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-slate-900/80 rounded text-xs text-white">
                    You
                  </div>
                </div>

                {/* Control Bar */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-slate-900/90 backdrop-blur-sm rounded-full px-6 py-3 border border-slate-700">
                  <button
                    onClick={toggleAudio}
                    className={`p-3 rounded-full transition-colors ${isAudioOn ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                    title={isAudioOn ? "Mute" : "Unmute"}
                  >
                    {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>

                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full transition-colors ${isVideoOn ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                    title={isVideoOn ? "Turn off camera" : "Turn on camera"}
                  >
                    {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>

                  <button
                    onClick={endVideoCall}
                    className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    title="End call"
                  >
                    <PhoneOff size={20} />
                  </button>

                  <button
                    className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full transition-colors"
                    title="Chat"
                  >
                    <MessageSquare size={20} />
                  </button>
                </div>
              </div>

              {/* Patient Info Sidebar (Optional) */}
              <div className="absolute top-20 left-4 w-72 bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700 p-4 hidden lg:block">
                <h4 className="text-white font-semibold mb-3">Patient Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name</span>
                    <span className="text-white">{selectedPatientDetails?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Age</span>
                    <span className="text-white">{selectedPatientDetails?.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Diagnosis</span>
                    <span className="text-white">{selectedPatientDetails?.diagnosis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk Level</span>
                    <span className={`${selectedPatientDetails?.riskLevel === 'high' ? 'text-red-400' : selectedPatientDetails?.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                      {selectedPatientDetails?.riskLevel?.charAt(0).toUpperCase() + selectedPatientDetails?.riskLevel?.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs text-slate-500">Consultation Notes</p>
                  <textarea
                    placeholder="Add notes during consultation..."
                    className="w-full mt-2 bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none h-24"
                  />
                </div>
              </div>
            </div>
          )}

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
                    onClick={() => {
                      // Save notes logic here
                      setShowNotesModal(false);
                      alert("Notes saved successfully!");
                    }}
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

          {/* === SCHEDULE CONSULTATION MODAL === */}
          {showScheduleModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-green-900/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <CalendarPlus size={20} className="text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Schedule Consultation</h3>
                      <p className="text-slate-400 text-sm">Set up a video consultation session</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setShowScheduleModal(false);
                      setSelectedPatientForSchedule(null);
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                  {/* Patient Selection */}
                  <div>
                    <label className="block text-white font-medium mb-2">Select Patient</label>
                    <select 
                      value={selectedPatientForSchedule?.id || ""}
                      onChange={(e) => {
                        const patient = patients.find(p => p.id === e.target.value);
                        setSelectedPatientForSchedule(patient);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-green-500"
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
                      <label className="block text-white font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Time</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>

                  {/* Consultation Type */}
                  <div>
                    <label className="block text-white font-medium mb-2">Consultation Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Follow-up", "Initial", "Emergency"].map((type) => (
                        <button
                          key={type}
                          className="p-3 bg-slate-800 hover:bg-green-600/20 border border-slate-700 hover:border-green-500/50 rounded-xl text-white text-sm font-medium transition-all"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-white font-medium mb-2">Notes (Optional)</label>
                    <textarea
                      value={scheduleNotes}
                      onChange={(e) => setScheduleNotes(e.target.value)}
                      placeholder="Add any notes for this appointment..."
                      className="w-full h-20 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 resize-none"
                    />
                  </div>

                  {/* Notification */}
                  <div className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <Bell size={18} className="text-green-400" />
                    <p className="text-sm text-slate-300">Patient and caregiver will be notified via email and app notification.</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 flex items-center justify-end space-x-3 bg-slate-900/50">
                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      setSelectedPatientForSchedule(null);
                    }}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all"
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