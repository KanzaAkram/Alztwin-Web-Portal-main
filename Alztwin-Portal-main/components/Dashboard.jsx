import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
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
import { db } from "../firebase"; 
import { collection, getDocs } from "firebase/firestore";
import {
  getClinicianPendingRequests,
  getClinicianAllRequests,
  acceptPatientRequest,
  rejectPatientRequest,
  getPatientFullDetails,
} from "../services/userService";

// --- CONFIGURATION ---
const API_STAGE_URL = "https://cors-anywhere.herokuapp.com/https://dfab51dbbacc.ngrok-free.app/predict"; 
const API_PROGRESSION_URL =
  "https://cors-anywhere.herokuapp.com/https://abee1187519c.ngrok-free.app/predict"; 

// Helper for UI Colors
const getRiskColor = (level) => {
  switch (level?.toLowerCase()) {
    case "high": return "text-red-400 bg-red-500/10 border-red-500/20";
    case "medium": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    case "low": return "text-green-400 bg-green-500/10 border-green-500/20";
    default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  }
};

const getTrendIcon = (trend) => {
  switch (trend?.toLowerCase()) {
    case "up": return <TrendingUp size={14} className="text-green-400" />;
    case "down": return <TrendingDown size={14} className="text-red-400" />;
    default: return <Minus size={14} className="text-yellow-400" />;
  }
};

// Helper to safely convert Firestore Timestamps
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  // If it's a Firestore Timestamp (has seconds)
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  // If it's already a string or Date object
  return new Date(timestamp).toLocaleDateString();
};

// Helper: Convert Base64 String back to a Blob (File)
const base64ToBlob = (base64Data, contentType = 'application/dicom') => {
  if (!base64Data) return null;
  
  // 1. Strip the "data:image..." prefix if it exists to get raw string
  const byteCharacters = atob(base64Data.split(',')[1] || base64Data);
  
  // 2. Convert to Byte Array
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  // 3. Create Blob
  return new Blob(byteArrays, { type: contentType });
};
export const Dashboard = ({ user, onLogout }) => {
  // ... existing state ...
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

  // Treatment Notes State
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [recommendationPlan, setRecommendationPlan] = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

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
          
          // 3. Pass the full array. We will process base64Data in handleViewPatient
          mriScans: data.mriScans || [] 
        });
      });

      

      setPatients(realPatients);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
    setLoading(false);
  };

  // --- VIDEO CONSULTATION FUNCTIONS ---
  const startVideoCall = async () => {
    try {
      setCallStatus("connecting");
      setShowVideoCall(true);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setCallStatus("connected");
      
      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error starting video call:", error);
      setCallStatus("idle");
      alert("Could not access camera/microphone. Please check permissions.");
    }
  };

  const endVideoCall = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
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

      // C. Set State
      setSelectedPatientDetails({
        ...patientData,
        ...latestVitals,
        ...dummyClinicalData,
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

      // B. Extract Trajectory from Progression API
      // Python returns: { "next_stage_prediction": ["AD"] }
      const nextStagesList = progRes.data.next_stage_prediction || [];
      const predictedDecline = nextStagesList.length > 0 
          ? nextStagesList.join(" -> ") 
          : "Stable";

      // C. Calculate Stage Level for Progress Bar (0-3 scale)
      const stageMap = {
          "CN": 0, "Normal": 0, "SMC": 0,
          "EMCI": 1, "MCI": 1, 
          "LMCI": 2, "Mild": 2,
          "AD": 3, "Severe": 3
      };
      
      // Default to 0 if unknown
      const stageLevelIndex = stageMap[currentStage] !== undefined ? stageMap[currentStage] : 0;

      // 4. UPDATE UI
      setSelectedPatientDetails(prev => ({
        ...prev,
        currentStage: currentStage, 
        stageLevel: stageLevelIndex, 
        predictedDecline: predictedDecline,
        
        // Progression API doesn't output time, so we keep the estimate
        trajectoryMonths: "12 (Est.)" 
      }));

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

        // 2. Prepare Payload
        const payload = {
          patientId: selectedPatientDetails.id,
          fileName: file.name,
          fileType: "DICOM",
          base64Data: base64String, // Send the string to API
          uploadedAt: new Date().toISOString()
        };

        // 3. Send to API
        // await axios.post(API_UPLOAD_URL, payload); 
        
        // --- SIMULATE API CALL (Remove timeout and uncomment above line in production) ---
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log("File sent to API:", payload);
        // --------------------------------------------------------------------------------

        // 4. Update UI "At Real Time" (Add new scan to the list immediately)
        const newScan = {
          date: new Date().toLocaleDateString(),
          url: base64String, // Display immediate preview
          type: "DICOM",
          base64Data: base64String
        };

        setSelectedPatientDetails(prev => ({
          ...prev,
          mriScans: [newScan, ...prev.mriScans] // Add to top of list
        }));

        alert("MRI Scan uploaded and sent to API successfully!");

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
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 fixed h-full z-20">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <img src="/logo.jpeg" alt="AlzTwin" className="w-10 h-10 rounded-xl object-cover" />
            <span className="text-xl font-bold text-white">AlzTwin</span>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveSection("patients")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "patients"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Users size={20} />
            <span className="font-medium">My Patients</span>
          </button>

          <button
            onClick={() => setActiveSection("digitalTwin")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "digitalTwin"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Brain size={20} />
            <span className="font-medium">Digital Twin</span>
          </button>

          <button
            onClick={() => setActiveSection("teleconsultation")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "teleconsultation"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Video size={20} />
            <span className="font-medium">Teleconsultation</span>
          </button>

          <button
            onClick={() => setActiveSection("requests")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              activeSection === "requests"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <div className="flex items-center space-x-3">
              <UserPlus size={20} />
              <span className="font-medium">Patient Requests</span>
            </div>
            {pendingRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
              {user?.displayName?.charAt(0) || "D"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.displayName || "Clinician"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="ml-64 flex-1">
        <nav className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center flex-1 max-w-md">
                <div className="relative w-full">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                  <Bell size={20} />
                  {pendingRequests.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                </button>
                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                  <Settings size={20} />
                </button>
              </div>
            </div>
          </div>
        </nav>

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

          {/* === REQUESTS SECTION === */}
          {activeSection === "requests" && (
            <div className="space-y-4">
              {/* Filter Tabs */}
              <div className="flex space-x-2 mb-4">
                {[
                  { key: 'all', label: 'All Requests', count: allRequests.length },
                  { key: 'pending', label: 'Pending', count: allRequests.filter(r => r.status === 'pending').length },
                  { key: 'accepted', label: 'Accepted', count: allRequests.filter(r => r.status === 'accepted').length },
                  { key: 'rejected', label: 'Rejected', count: allRequests.filter(r => r.status === 'rejected').length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setRequestsFilter(tab.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      requestsFilter === tab.key
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading requests...</div>
              ) : allRequests.filter(r => requestsFilter === 'all' || r.status === requestsFilter).length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                  <UserPlus size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 text-lg">No {requestsFilter === 'all' ? '' : requestsFilter} requests found</p>
                  <p className="text-slate-500 text-sm mt-2">Clinician ID: {user?.uid?.substring(0, 8)}...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {allRequests
                    .filter(r => requestsFilter === 'all' || r.status === requestsFilter)
                    .map((request) => (
                    <div key={request.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                            request.status === 'accepted' ? 'bg-green-600' :
                            request.status === 'rejected' ? 'bg-red-600' :
                            'bg-slate-700'
                          }`}>
                            {(request.patientUserData?.displayName || request.patientId || "P").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {request.patientUserData?.displayName || request.patientId?.substring(0, 12) + "..."}
                            </h3>
                            <p className="text-sm text-slate-400">
                              Requested by: {request.caregiverData?.email || request.caregiverId?.substring(0, 12) + "..."}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                request.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                                request.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {request.status?.toUpperCase()}
                              </span>
                              {request.summary && (
                                <span className="text-xs text-slate-500">• {request.summary}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                           <button onClick={() => handleViewPatient(request.patientId)} className="p-2 bg-slate-700 text-white rounded hover:bg-slate-600"><Eye size={16}/></button>
                           {request.status === 'pending' && (
                             <>
                               <button onClick={() => handleAcceptRequest(request)} className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"><CheckCircle size={16}/></button>
                               <button onClick={() => handleRejectRequest(request)} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"><XCircle size={16}/></button>
                             </>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === DIGITAL TWIN SECTION === */}
          {activeSection === "digitalTwin" && (
            <div className="space-y-6">
              {/* Patient Selector for Digital Twin */}
              <div className="bg-gradient-to-br from-slate-900/80 via-purple-900/10 to-slate-900/80 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Brain className="mr-2 text-purple-400" size={22} />
                  Select Patient for Digital Twin Analysis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatientForDT(patient)}
                      className={`p-4 rounded-xl border transition-all duration-300 text-left group ${
                        selectedPatientForDT?.id === patient.id 
                          ? "bg-gradient-to-br from-purple-600/30 to-blue-600/30 border-purple-500 ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20" 
                          : "bg-slate-800/50 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/80"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg ${selectedPatientForDT?.id === patient.id ? 'ring-2 ring-white/30' : ''}`}>
                          {patient.avatar}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm group-hover:text-purple-300 transition-colors">{patient.name}</p>
                          <p className="text-slate-400 text-xs">{patient.diagnosis}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                            patient.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                            patient.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {patient.riskLevel?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedPatientForDT ? (
                <>
                  {/* MRI-Based 3D Brain Visualization Hero */}
                  <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-purple-500/20 rounded-2xl overflow-hidden">
                    {/* Animated Background Grid */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'linear-gradient(rgba(139,92,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.1) 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                      }} />
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.1),transparent_70%)]" />
                    
                    {/* Header Controls */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-green-500/30">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-xs text-green-400 font-medium">Live MRI Digital Twin</span>
                        </div>
                        <div className="bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-700">
                          <span className="text-xs text-slate-400">Volumetric Analysis</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setAutoRotate(!autoRotate)}
                          className={`p-2 rounded-lg border transition-all ${autoRotate ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'}`}
                          title="Auto Rotate"
                        >
                          <RotateCcw size={16} className={autoRotate ? 'animate-spin' : ''} />
                        </button>
                        <button 
                          onClick={() => setBrainZoom(Math.min(150, brainZoom + 10))}
                          className="p-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                          title="Zoom In"
                        >
                          <ZoomIn size={16} />
                        </button>
                        <button 
                          onClick={() => setBrainZoom(Math.max(50, brainZoom - 10))}
                          className="p-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                          title="Zoom Out"
                        >
                          <ZoomOut size={16} />
                        </button>
                        <button 
                          onClick={() => { setBrainRotation({ x: -20, y: 0 }); setBrainZoom(100); }}
                          className="p-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                          title="Reset View"
                        >
                          <Maximize2 size={16} />
                        </button>
                        <button 
                          onClick={() => setShowExportModal(true)}
                          className="flex items-center space-x-2 px-3 py-2 bg-purple-600/20 border border-purple-500/50 rounded-lg text-purple-400 hover:bg-purple-600/30 transition-all"
                        >
                          <Download size={14} />
                          <span className="text-xs font-medium">Export 3D</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative p-8 pt-16">
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* 3D Brain Visualization - Main Area */}
                        <div className="lg:col-span-3 relative">
                          <div 
                            className="aspect-square max-w-lg mx-auto relative cursor-grab active:cursor-grabbing select-none"
                            style={{ perspective: '1000px' }}
                            onMouseDown={(e) => {
                              setIsDragging(true);
                              setDragStart({ x: e.clientX, y: e.clientY });
                              setAutoRotate(false);
                            }}
                            onMouseMove={(e) => {
                              if (isDragging) {
                                const deltaX = e.clientX - dragStart.x;
                                const deltaY = e.clientY - dragStart.y;
                                setBrainRotation(prev => ({
                                  x: Math.max(-60, Math.min(60, prev.x - deltaY * 0.5)),
                                  y: prev.y + deltaX * 0.5
                                }));
                                setDragStart({ x: e.clientX, y: e.clientY });
                              }
                            }}
                            onMouseUp={() => setIsDragging(false)}
                            onMouseLeave={() => setIsDragging(false)}
                          >
                            {/* 3D Scene Container */}
                            <div 
                              className="w-full h-full relative transition-transform duration-100"
                              style={{
                                transform: `scale(${brainZoom / 100}) rotateX(${brainRotation.x}deg) rotateY(${brainRotation.y + (autoRotate ? Date.now() / 50 % 360 : 0)}deg)`,
                                transformStyle: 'preserve-3d'
                              }}
                            >
                              {/* Realistic 3D Brain Model */}
                              <svg viewBox="0 0 400 400" className="w-full h-full" style={{ transform: 'translateZ(0)' }}>
                                <defs>
                                  {/* Brain Tissue Gradients */}
                                  <radialGradient id="brainBase" cx="50%" cy="40%" r="60%">
                                    <stop offset="0%" stopColor="#E8B4B8" />
                                    <stop offset="40%" stopColor="#D4A0A4" />
                                    <stop offset="70%" stopColor="#C08B8F" />
                                    <stop offset="100%" stopColor="#A67377" />
                                  </radialGradient>
                                  <radialGradient id="brainShadow" cx="50%" cy="60%" r="50%">
                                    <stop offset="0%" stopColor="transparent" />
                                    <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
                                  </radialGradient>
                                  <linearGradient id="brainHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#F5D0D3" stopOpacity="0.8" />
                                    <stop offset="50%" stopColor="#E8B4B8" stopOpacity="0.5" />
                                    <stop offset="100%" stopColor="#C08B8F" stopOpacity="0.3" />
                                  </linearGradient>
                                  <filter id="brainTexture">
                                    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise"/>
                                    <feDiffuseLighting in="noise" lightingColor="#E8B4B8" surfaceScale="2" result="light">
                                      <feDistantLight azimuth="45" elevation="60"/>
                                    </feDiffuseLighting>
                                    <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/>
                                  </filter>
                                  <filter id="innerShadow">
                                    <feOffset dx="0" dy="2"/>
                                    <feGaussianBlur stdDeviation="3" result="blur"/>
                                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                                  </filter>
                                  {/* Affected Region Gradients */}
                                  <radialGradient id="healthyRegion" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="#22C55E" stopOpacity="0.3" />
                                  </radialGradient>
                                  <radialGradient id="atRiskRegion" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#FDE047" stopOpacity="0.7" />
                                    <stop offset="100%" stopColor="#EAB308" stopOpacity="0.4" />
                                  </radialGradient>
                                  <radialGradient id="affectedRegion" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#FCA5A5" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0.5" />
                                  </radialGradient>
                                </defs>
                                
                                {/* Brain Shadow */}
                                <ellipse cx="200" cy="360" rx="120" ry="20" fill="rgba(0,0,0,0.2)" filter="blur(10px)" />
                                
                                {/* Cerebellum (Back Bottom) */}
                                <ellipse cx="200" cy="320" rx="70" ry="40" fill="#C9A0A4" stroke="#B08085" strokeWidth="1" />
                                <path d="M140,320 Q150,300 160,320 Q170,300 180,320 Q190,300 200,320 Q210,300 220,320 Q230,300 240,320 Q250,300 260,320" fill="none" stroke="#A08085" strokeWidth="1.5" />
                                
                                {/* Brain Stem */}
                                <path d="M185,340 Q190,370 200,380 Q210,370 215,340" fill="#D4A0A4" stroke="#B08085" strokeWidth="1" />
                                
                                {/* Main Brain Body - Left Hemisphere */}
                                <path 
                                  d="M200,60 
                                     Q120,60 90,120 
                                     Q60,180 70,240 
                                     Q80,300 130,320 
                                     Q180,340 200,300"
                                  fill="url(#brainBase)" 
                                  stroke="#A67377" 
                                  strokeWidth="2"
                                  className="transition-all duration-300"
                                  style={{ filter: 'url(#innerShadow)' }}
                                />
                                
                                {/* Main Brain Body - Right Hemisphere */}
                                <path 
                                  d="M200,60 
                                     Q280,60 310,120 
                                     Q340,180 330,240 
                                     Q320,300 270,320 
                                     Q220,340 200,300"
                                  fill="url(#brainBase)" 
                                  stroke="#A67377" 
                                  strokeWidth="2"
                                  className="transition-all duration-300"
                                  style={{ filter: 'url(#innerShadow)' }}
                                />
                                
                                {/* Central Fissure (Longitudinal) */}
                                <path d="M200,65 Q198,150 200,200 Q202,250 200,295" fill="none" stroke="#8B6B6F" strokeWidth="3" strokeLinecap="round" />
                                
                                {/* Left Hemisphere Gyri (Folds) */}
                                <g stroke="#9B7B7F" strokeWidth="1.5" fill="none" strokeLinecap="round">
                                  {/* Frontal Lobe Folds */}
                                  <path d="M120,100 Q140,95 155,105 Q170,115 180,100" />
                                  <path d="M100,130 Q120,125 140,135 Q160,145 175,130" />
                                  <path d="M90,165 Q110,160 130,170 Q150,180 170,165" />
                                  {/* Parietal Lobe Folds */}
                                  <path d="M95,200 Q115,195 135,205 Q155,215 170,200" />
                                  <path d="M100,235 Q120,230 140,240 Q160,250 175,235" />
                                  {/* Temporal Lobe Folds */}
                                  <path d="M85,270 Q105,275 125,265 Q145,255 160,270" />
                                  <path d="M110,295 Q130,290 150,300" />
                                </g>
                                
                                {/* Right Hemisphere Gyri (Folds) */}
                                <g stroke="#9B7B7F" strokeWidth="1.5" fill="none" strokeLinecap="round">
                                  {/* Frontal Lobe Folds */}
                                  <path d="M280,100 Q260,95 245,105 Q230,115 220,100" />
                                  <path d="M300,130 Q280,125 260,135 Q240,145 225,130" />
                                  <path d="M310,165 Q290,160 270,170 Q250,180 230,165" />
                                  {/* Parietal Lobe Folds */}
                                  <path d="M305,200 Q285,195 265,205 Q245,215 230,200" />
                                  <path d="M300,235 Q280,230 260,240 Q240,250 225,235" />
                                  {/* Temporal Lobe Folds */}
                                  <path d="M315,270 Q295,275 275,265 Q255,255 240,270" />
                                  <path d="M290,295 Q270,290 250,300" />
                                </g>
                                
                                {/* Lateral Fissure (Sylvian) - Left */}
                                <path d="M85,190 Q120,200 160,190 Q180,185 195,195" fill="none" stroke="#7B5B5F" strokeWidth="2.5" strokeLinecap="round" />
                                
                                {/* Lateral Fissure (Sylvian) - Right */}
                                <path d="M315,190 Q280,200 240,190 Q220,185 205,195" fill="none" stroke="#7B5B5F" strokeWidth="2.5" strokeLinecap="round" />
                                
                                {/* Central Sulcus - Left */}
                                <path d="M140,90 Q135,130 145,170 Q155,200 150,230" fill="none" stroke="#7B5B5F" strokeWidth="2" strokeLinecap="round" />
                                
                                {/* Central Sulcus - Right */}
                                <path d="M260,90 Q265,130 255,170 Q245,200 250,230" fill="none" stroke="#7B5B5F" strokeWidth="2" strokeLinecap="round" />
                                
                                {/* Highlight on top */}
                                <ellipse cx="200" cy="100" rx="80" ry="30" fill="url(#brainHighlight)" opacity="0.4" />
                                
                                {/* ====== INTERACTIVE AFFECTED REGIONS ====== */}
                                
                                {/* Hippocampus - Left (AFFECTED - Memory Center) */}
                                <g 
                                  className="cursor-pointer transition-all duration-300 hover:scale-110"
                                  onClick={() => { setSelectedBrainRegion('hippocampus'); setShowRegionInfo(true); }}
                                  style={{ transformOrigin: '130px 260px' }}
                                >
                                  <ellipse 
                                    cx="130" cy="260" rx="25" ry="15" 
                                    fill={selectedPatientForDT.riskLevel === 'high' ? 'url(#affectedRegion)' : selectedPatientForDT.riskLevel === 'medium' ? 'url(#atRiskRegion)' : 'url(#healthyRegion)'} 
                                    stroke={selectedPatientForDT.riskLevel === 'high' ? '#EF4444' : selectedPatientForDT.riskLevel === 'medium' ? '#EAB308' : '#22C55E'}
                                    strokeWidth="2"
                                    className={selectedBrainRegion === 'hippocampus' ? 'animate-pulse' : ''}
                                  />
                                  <text x="130" y="263" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">L-HC</text>
                                </g>
                                
                                {/* Hippocampus - Right (AFFECTED) */}
                                <g 
                                  className="cursor-pointer transition-all duration-300 hover:scale-110"
                                  onClick={() => { setSelectedBrainRegion('hippocampus'); setShowRegionInfo(true); }}
                                  style={{ transformOrigin: '270px 260px' }}
                                >
                                  <ellipse 
                                    cx="270" cy="260" rx="25" ry="15" 
                                    fill={selectedPatientForDT.riskLevel === 'high' ? 'url(#affectedRegion)' : selectedPatientForDT.riskLevel === 'medium' ? 'url(#atRiskRegion)' : 'url(#healthyRegion)'} 
                                    stroke={selectedPatientForDT.riskLevel === 'high' ? '#EF4444' : selectedPatientForDT.riskLevel === 'medium' ? '#EAB308' : '#22C55E'}
                                    strokeWidth="2"
                                    className={selectedBrainRegion === 'hippocampus' ? 'animate-pulse' : ''}
                                  />
                                  <text x="270" y="263" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">R-HC</text>
                                </g>
                                
                                {/* Frontal Lobe - Left (AT RISK) */}
                                <g 
                                  className="cursor-pointer transition-all duration-300 hover:scale-110"
                                  onClick={() => { setSelectedBrainRegion('frontal'); setShowRegionInfo(true); }}
                                  style={{ transformOrigin: '140px 120px' }}
                                >
                                  <ellipse 
                                    cx="140" cy="120" rx="35" ry="25" 
                                    fill={selectedPatientForDT.riskLevel !== 'low' ? 'url(#atRiskRegion)' : 'url(#healthyRegion)'} 
                                    stroke={selectedPatientForDT.riskLevel !== 'low' ? '#EAB308' : '#22C55E'}
                                    strokeWidth="2"
                                    opacity="0.7"
                                    className={selectedBrainRegion === 'frontal' ? 'animate-pulse' : ''}
                                  />
                                  <text x="140" y="123" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">L-FL</text>
                                </g>
                                
                                {/* Frontal Lobe - Right */}
                                <g 
                                  className="cursor-pointer transition-all duration-300 hover:scale-110"
                                  onClick={() => { setSelectedBrainRegion('frontal'); setShowRegionInfo(true); }}
                                  style={{ transformOrigin: '260px 120px' }}
                                >
                                  <ellipse 
                                    cx="260" cy="120" rx="35" ry="25" 
                                    fill={selectedPatientForDT.riskLevel !== 'low' ? 'url(#atRiskRegion)' : 'url(#healthyRegion)'} 
                                    stroke={selectedPatientForDT.riskLevel !== 'low' ? '#EAB308' : '#22C55E'}
                                    strokeWidth="2"
                                    opacity="0.7"
                                    className={selectedBrainRegion === 'frontal' ? 'animate-pulse' : ''}
                                  />
                                  <text x="260" y="123" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">R-FL</text>
                                </g>
                                
                                {/* Temporal Lobe - Left (SEVERELY AFFECTED) */}
                                <g 
                                  className="cursor-pointer transition-all duration-300 hover:scale-110"
                                  onClick={() => { setSelectedBrainRegion('temporal'); setShowRegionInfo(true); }}
                                  style={{ transformOrigin: '90px 220px' }}
                                >
                                  <ellipse 
                                    cx="90" cy="220" rx="20" ry="35" 
                                    fill={selectedPatientForDT.riskLevel === 'high' ? 'url(#affectedRegion)' : 'url(#atRiskRegion)'} 
                                    stroke={selectedPatientForDT.riskLevel === 'high' ? '#EF4444' : '#EAB308'}
                                    strokeWidth="2"
                                    opacity="0.7"
                                    className={selectedBrainRegion === 'temporal' ? 'animate-pulse' : ''}
                                  />
                                  <text x="90" y="223" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">L-TL</text>
                                </g>
                                
                                {/* Temporal Lobe - Right */}
                                <g 
                                  className="cursor-pointer transition-all duration-300 hover:scale-110"
                                  onClick={() => { setSelectedBrainRegion('temporal'); setShowRegionInfo(true); }}
                                  style={{ transformOrigin: '310px 220px' }}
                                >
                                  <ellipse 
                                    cx="310" cy="220" rx="20" ry="35" 
                                    fill={selectedPatientForDT.riskLevel === 'high' ? 'url(#affectedRegion)' : 'url(#atRiskRegion)'} 
                                    stroke={selectedPatientForDT.riskLevel === 'high' ? '#EF4444' : '#EAB308'}
                                    strokeWidth="2"
                                    opacity="0.7"
                                    className={selectedBrainRegion === 'temporal' ? 'animate-pulse' : ''}
                                  />
                                  <text x="310" y="223" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">R-TL</text>
                                </g>
                                
                                {/* Parietal Lobe - Left (HEALTHY) */}
                                <g 
                                  className="cursor-pointer transition-all duration-300 hover:scale-110"
                                  onClick={() => { setSelectedBrainRegion('parietal'); setShowRegionInfo(true); }}
                                  style={{ transformOrigin: '130px 180px' }}
                                >
                                  <ellipse 
                                    cx="130" cy="180" rx="30" ry="20" 
                                    fill="url(#healthyRegion)" 
                                    stroke="#22C55E"
                                    strokeWidth="2"
                                    opacity="0.6"
                                    className={selectedBrainRegion === 'parietal' ? 'animate-pulse' : ''}
                                  />
                                  <text x="130" y="183" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">L-PL</text>
                                </g>
                                
                                {/* Parietal Lobe - Right */}
                                <g 
                                  className="cursor-pointer transition-all duration-300 hover:scale-110"
                                  onClick={() => { setSelectedBrainRegion('parietal'); setShowRegionInfo(true); }}
                                  style={{ transformOrigin: '270px 180px' }}
                                >
                                  <ellipse 
                                    cx="270" cy="180" rx="30" ry="20" 
                                    fill="url(#healthyRegion)" 
                                    stroke="#22C55E"
                                    strokeWidth="2"
                                    opacity="0.6"
                                    className={selectedBrainRegion === 'parietal' ? 'animate-pulse' : ''}
                                  />
                                  <text x="270" y="183" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">R-PL</text>
                                </g>
                                
                                {/* Occipital Lobe - Left (HEALTHY) */}
                                <g 
                                  className="cursor-pointer transition-all duration-300 hover:scale-110"
                                  onClick={() => { setSelectedBrainRegion('occipital'); setShowRegionInfo(true); }}
                                  style={{ transformOrigin: '160px 290px' }}
                                >
                                  <ellipse 
                                    cx="160" cy="290" rx="20" ry="15" 
                                    fill="url(#healthyRegion)" 
                                    stroke="#22C55E"
                                    strokeWidth="1.5"
                                    opacity="0.6"
                                    className={selectedBrainRegion === 'occipital' ? 'animate-pulse' : ''}
                                  />
                                  <text x="160" y="293" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">L-OL</text>
                                </g>
                                
                                {/* Occipital Lobe - Right */}
                                <g 
                                  className="cursor-pointer transition-all duration-300 hover:scale-110"
                                  onClick={() => { setSelectedBrainRegion('occipital'); setShowRegionInfo(true); }}
                                  style={{ transformOrigin: '240px 290px' }}
                                >
                                  <ellipse 
                                    cx="240" cy="290" rx="20" ry="15" 
                                    fill="url(#healthyRegion)" 
                                    stroke="#22C55E"
                                    strokeWidth="1.5"
                                    opacity="0.6"
                                    className={selectedBrainRegion === 'occipital' ? 'animate-pulse' : ''}
                                  />
                                  <text x="240" y="293" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">R-OL</text>
                                </g>
                              </svg>
                            </div>
                            
                            {/* Drag Instructions */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700">
                              <Move size={14} className="text-slate-400" />
                              <span className="text-xs text-slate-400">Click and drag to rotate • Click regions for details</span>
                            </div>
                          </div>
                          
                          {/* Volumetric Stats Below Brain */}
                          <div className="mt-4 grid grid-cols-4 gap-2">
                            {[
                              { label: "Total Volume", value: "1,247 cm³", change: "-3.2%", status: "warning" },
                              { label: "Hippocampus", value: "5.8 cm³", change: "-12%", status: "critical" },
                              { label: "Ventricles", value: "38 cm³", change: "+8%", status: "warning" },
                              { label: "Cortical", value: "487 cm³", change: "-2.1%", status: "normal" },
                            ].map((stat, idx) => (
                              <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 text-center">
                                <p className="text-slate-400 text-[10px] uppercase">{stat.label}</p>
                                <p className="text-white font-bold text-sm">{stat.value}</p>
                                <p className={`text-[10px] font-medium ${stat.status === 'critical' ? 'text-red-400' : stat.status === 'warning' ? 'text-yellow-400' : 'text-green-400'}`}>
                                  {stat.change}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right Panel - Patient Info & Region Details */}
                        <div className="lg:col-span-2 space-y-4">
                          {/* Patient Card */}
                          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
                                {selectedPatientForDT.avatar}
                              </div>
                              <div>
                                <h3 className="text-white font-bold">{selectedPatientForDT.name}</h3>
                                <p className="text-purple-400 text-sm">{selectedPatientForDT.diagnosis}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                                <p className="text-slate-500 text-[10px] uppercase">Stage</p>
                                <p className="text-yellow-400 font-bold text-sm">{selectedPatientForDT.stage || "MCI"}</p>
                              </div>
                              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                                <p className="text-slate-500 text-[10px] uppercase">Risk</p>
                                <p className={`font-bold text-sm ${selectedPatientForDT.riskLevel === 'high' ? 'text-red-400' : selectedPatientForDT.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                                  {selectedPatientForDT.riskScore || 68}%
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Region Analysis Panel */}
                          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                            <h4 className="text-white font-semibold mb-3 flex items-center">
                              <Target size={16} className="mr-2 text-purple-400" />
                              Region Analysis
                            </h4>
                            {selectedBrainRegion ? (
                              <div className="space-y-3">
                                {(() => {
                                  const regions = {
                                    hippocampus: { 
                                      name: "Hippocampus", 
                                      status: selectedPatientForDT.riskLevel === 'high' ? "Severe Atrophy" : "Moderate Atrophy",
                                      volume: "5.8 cm³", 
                                      normal: "7.5 cm³",
                                      change: "-22.6%",
                                      color: selectedPatientForDT.riskLevel === 'high' ? "red" : "yellow",
                                      desc: "Critical for memory formation. Significant volume loss detected affecting short-term memory consolidation.",
                                      functions: ["Memory Formation", "Spatial Navigation", "Learning"]
                                    },
                                    frontal: { 
                                      name: "Frontal Lobe", 
                                      status: "Mild Changes",
                                      volume: "178 cm³", 
                                      normal: "185 cm³",
                                      change: "-3.8%",
                                      color: "yellow",
                                      desc: "Executive function center showing early signs of cortical thinning.",
                                      functions: ["Executive Function", "Decision Making", "Personality"]
                                    },
                                    temporal: { 
                                      name: "Temporal Lobe", 
                                      status: selectedPatientForDT.riskLevel === 'high' ? "Significant Atrophy" : "Moderate Changes",
                                      volume: "132 cm³", 
                                      normal: "155 cm³",
                                      change: "-14.8%",
                                      color: selectedPatientForDT.riskLevel === 'high' ? "red" : "yellow",
                                      desc: "Language processing area with notable tissue loss affecting verbal abilities.",
                                      functions: ["Language", "Hearing", "Memory Storage"]
                                    },
                                    parietal: { 
                                      name: "Parietal Lobe", 
                                      status: "Normal",
                                      volume: "142 cm³", 
                                      normal: "145 cm³",
                                      change: "-2.1%",
                                      color: "green",
                                      desc: "Spatial processing intact. No significant abnormalities detected.",
                                      functions: ["Spatial Awareness", "Sensory Integration", "Math"]
                                    },
                                    occipital: { 
                                      name: "Occipital Lobe", 
                                      status: "Normal",
                                      volume: "68 cm³", 
                                      normal: "70 cm³",
                                      change: "-2.8%",
                                      color: "green",
                                      desc: "Visual processing center functioning within normal parameters.",
                                      functions: ["Visual Processing", "Color Recognition", "Object Recognition"]
                                    }
                                  };
                                  const region = regions[selectedBrainRegion];
                                  return (
                                    <>
                                      <div className="flex items-center justify-between">
                                        <h5 className="text-white font-medium">{region.name}</h5>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                          region.color === 'red' ? 'bg-red-500/20 text-red-400' :
                                          region.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                                          'bg-green-500/20 text-green-400'
                                        }`}>
                                          {region.status}
                                        </span>
                                      </div>
                                      <p className="text-slate-400 text-xs">{region.desc}</p>
                                      <div className="grid grid-cols-3 gap-2 mt-2">
                                        <div className="bg-slate-900/50 rounded p-2 text-center">
                                          <p className="text-slate-500 text-[9px]">Current</p>
                                          <p className="text-white font-bold text-xs">{region.volume}</p>
                                        </div>
                                        <div className="bg-slate-900/50 rounded p-2 text-center">
                                          <p className="text-slate-500 text-[9px]">Normal</p>
                                          <p className="text-slate-300 font-bold text-xs">{region.normal}</p>
                                        </div>
                                        <div className="bg-slate-900/50 rounded p-2 text-center">
                                          <p className="text-slate-500 text-[9px]">Change</p>
                                          <p className={`font-bold text-xs ${region.color === 'red' ? 'text-red-400' : region.color === 'yellow' ? 'text-yellow-400' : 'text-green-400'}`}>
                                            {region.change}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="mt-2">
                                        <p className="text-slate-500 text-[9px] uppercase mb-1">Functions</p>
                                        <div className="flex flex-wrap gap-1">
                                          {region.functions.map((fn, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-slate-700/50 rounded text-[10px] text-slate-300">{fn}</span>
                                          ))}
                                        </div>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <Brain size={32} className="mx-auto text-slate-600 mb-2" />
                                <p className="text-slate-500 text-sm">Click on a brain region to view detailed analysis</p>
                              </div>
                            )}
                          </div>
                          
                          {/* View Options */}
                          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                            <h4 className="text-white font-semibold mb-3 flex items-center">
                              <Layers size={16} className="mr-2 text-blue-400" />
                              MRI View Modes
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: "3d", label: "3D Model", icon: Box },
                                { id: "axial", label: "Axial", icon: Layers },
                                { id: "sagittal", label: "Sagittal", icon: Layers },
                                { id: "coronal", label: "Coronal", icon: Layers },
                              ].map((view) => (
                                <button
                                  key={view.id}
                                  onClick={() => setBrainViewMode(view.id)}
                                  className={`flex items-center space-x-2 p-2 rounded-lg border transition-all ${
                                    brainViewMode === view.id 
                                      ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                                      : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                  }`}
                                >
                                  <view.icon size={14} />
                                  <span className="text-xs font-medium">{view.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Legend */}
                          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
                            <h4 className="text-white font-semibold mb-3">Region Status</h4>
                            <div className="space-y-2">
                              {[
                                { color: "bg-green-500", label: "Healthy", desc: "Within normal range" },
                                { color: "bg-yellow-500", label: "At Risk", desc: "Early changes detected" },
                                { color: "bg-red-500", label: "Affected", desc: "Significant atrophy" },
                              ].map((item, idx) => (
                                <div key={idx} className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                  <div>
                                    <p className="text-white text-xs font-medium">{item.label}</p>
                                    <p className="text-slate-500 text-[10px]">{item.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Disease Progression Prediction */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <TrendingUp className="mr-2 text-orange-400" size={20} />
                        Disease Progression Prediction
                      </h3>
                      <div className="relative h-48">
                        {/* Progression Chart */}
                        <div className="absolute inset-0 flex items-end justify-between px-4">
                          {[
                            { month: "Current", stage: "MCI", progress: 35, predicted: false },
                            { month: "+6 Mo", stage: "MCI", progress: 42, predicted: true },
                            { month: "+12 Mo", stage: "Mild AD", progress: 55, predicted: true },
                            { month: "+18 Mo", stage: "Mild AD", progress: 65, predicted: true },
                            { month: "+24 Mo", stage: "Moderate", progress: 75, predicted: true },
                          ].map((point, idx) => (
                            <div key={idx} className="flex flex-col items-center flex-1">
                              <div className="relative w-full flex justify-center mb-2">
                                <div 
                                  className={`w-8 rounded-t-lg transition-all duration-500 ${point.predicted ? 'bg-gradient-to-t from-orange-600/50 to-orange-400/30 border border-orange-500/30 border-dashed' : 'bg-gradient-to-t from-purple-600 to-blue-500'}`}
                                  style={{ height: `${point.progress * 1.5}px` }}
                                />
                              </div>
                              <p className="text-[10px] text-slate-500 uppercase">{point.month}</p>
                              <p className={`text-xs font-medium ${point.predicted ? 'text-orange-400' : 'text-white'}`}>{point.stage}</p>
                              <p className="text-[10px] text-slate-400">{point.progress}%</p>
                            </div>
                          ))}
                        </div>
                        {/* Trend Line */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          <path 
                            d="M40,140 Q100,130 160,100 T280,60 T400,30" 
                            fill="none" 
                            stroke="rgba(251,146,60,0.5)" 
                            strokeWidth="2" 
                            strokeDasharray="5,5"
                          />
                        </svg>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-600 to-blue-500" />
                            <span className="text-xs text-slate-400">Current</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded bg-orange-500/50 border border-dashed border-orange-500" />
                            <span className="text-xs text-slate-400">Predicted</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">AI-Predicted Trajectory (95% confidence)</p>
                      </div>
                    </div>

                    {/* Stage Information */}
                    <div className="bg-gradient-to-br from-slate-900 to-purple-900/20 border border-purple-500/20 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Brain className="mr-2 text-purple-400" size={20} />
                        Current Stage
                      </h3>
                      <div className="space-y-3">
                        {[
                          { stage: "Normal", active: false, color: "green" },
                          { stage: "MCI", active: true, color: "yellow" },
                          { stage: "Mild AD", active: false, color: "orange" },
                          { stage: "Moderate AD", active: false, color: "red" },
                          { stage: "Severe AD", active: false, color: "red" },
                        ].map((item, idx) => (
                          <div key={idx} className={`flex items-center space-x-3 p-2 rounded-lg ${item.active ? 'bg-yellow-500/10 border border-yellow-500/30' : ''}`}>
                            <div className={`w-3 h-3 rounded-full ${
                              item.active ? 'bg-yellow-400 ring-4 ring-yellow-400/30' :
                              item.color === 'green' ? 'bg-green-500/30' :
                              item.color === 'yellow' ? 'bg-yellow-500/30' :
                              item.color === 'orange' ? 'bg-orange-500/30' : 'bg-red-500/30'
                            }`} />
                            <span className={`text-sm ${item.active ? 'text-yellow-400 font-semibold' : 'text-slate-400'}`}>{item.stage}</span>
                            {item.active && <ChevronRight size={14} className="text-yellow-400 ml-auto" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Brain Region Analysis */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Activity className="mr-2 text-blue-400" size={20} />
                      Brain Region Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { region: "Hippocampus", status: "Moderate Atrophy", score: 58, icon: "🧠", desc: "Memory formation affected", color: "yellow" },
                        { region: "Frontal Lobe", status: "Mild Changes", score: 78, icon: "💭", desc: "Executive function intact", color: "green" },
                        { region: "Temporal Lobe", status: "Significant Atrophy", score: 42, icon: "👂", desc: "Language processing impacted", color: "red" },
                        { region: "Parietal Lobe", status: "Normal", score: 85, icon: "🎯", desc: "Spatial awareness normal", color: "green" }
                      ].map((region, idx) => (
                        <div key={idx} className={`bg-slate-800/50 border rounded-xl p-4 transition-all hover:scale-105 ${
                          region.color === 'red' ? 'border-red-500/30 hover:border-red-500/50' :
                          region.color === 'yellow' ? 'border-yellow-500/30 hover:border-yellow-500/50' :
                          'border-green-500/30 hover:border-green-500/50'
                        }`}>
                          <div className="flex items-start justify-between mb-3">
                            <span className="text-2xl">{region.icon}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              region.color === 'red' ? 'bg-red-500/20 text-red-400' :
                              region.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {region.status}
                            </span>
                          </div>
                          <h4 className="text-white font-semibold text-sm mb-1">{region.region}</h4>
                          <p className="text-slate-500 text-xs mb-3">{region.desc}</p>
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                region.color === 'red' ? 'bg-gradient-to-r from-red-600 to-red-400' :
                                region.color === 'yellow' ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                                'bg-gradient-to-r from-green-600 to-green-400'
                              }`}
                              style={{ width: `${region.score}%` }}
                            />
                          </div>
                          <p className="text-right text-xs text-slate-400 mt-1">{region.score}%</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cognitive Test History */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <BarChart3 className="mr-2 text-cyan-400" size={20} />
                        Cognitive Test History
                      </h3>
                      <div className="space-y-4">
                        {[
                          { test: "MMSE", scores: [28, 26, 25, 24, 23], current: 24, max: 30 },
                          { test: "MoCA", scores: [26, 24, 23, 22, 21], current: 21, max: 30 },
                          { test: "CDR", scores: [0, 0.5, 0.5, 0.5, 1], current: 0.5, max: 3, inverted: true },
                        ].map((test, idx) => (
                          <div key={idx} className="bg-slate-800/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium text-sm">{test.test}</span>
                              <span className="text-cyan-400 font-bold">{test.current}/{test.max}</span>
                            </div>
                            <div className="flex items-end space-x-1 h-12">
                              {test.scores.map((score, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center">
                                  <div 
                                    className={`w-full rounded-t ${i === test.scores.length - 1 ? 'bg-cyan-500' : 'bg-slate-600'}`}
                                    style={{ height: `${(score / test.max) * 100}%` }}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[10px] text-slate-500">6 mo ago</span>
                              <span className="text-[10px] text-slate-500">Current</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Physiological Data from Device */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Smartphone className="mr-2 text-green-400" size={20} />
                        Device Physiological Data
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Sleep Quality", value: "6.5 hrs", trend: "down", icon: "😴", color: "yellow" },
                          { label: "Activity Level", value: "4,200 steps", trend: "up", icon: "🚶", color: "green" },
                          { label: "Heart Rate", value: "72 bpm", trend: "stable", icon: "❤️", color: "green" },
                          { label: "Stress Level", value: "Moderate", trend: "up", icon: "😰", color: "yellow" },
                          { label: "Blood Pressure", value: "128/82", trend: "stable", icon: "🩺", color: "yellow" },
                          { label: "Medication", value: "Compliant", trend: "stable", icon: "💊", color: "green" },
                        ].map((item, idx) => (
                          <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-lg">{item.icon}</span>
                              {item.trend === 'up' ? <TrendingUp size={14} className="text-green-400" /> :
                               item.trend === 'down' ? <TrendingDown size={14} className="text-red-400" /> :
                               <Minus size={14} className="text-slate-400" />}
                            </div>
                            <p className="text-white font-semibold text-sm">{item.value}</p>
                            <p className="text-slate-500 text-xs">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Treatment Notes & Recommendations */}
                  <div className="bg-gradient-to-r from-slate-900 via-blue-900/10 to-slate-900 border border-blue-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <Pill className="mr-2 text-blue-400" size={20} />
                        Treatment Notes & Recommendations
                      </h3>
                      <button 
                        onClick={() => setShowNotesModal(true)}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        <Plus size={16} />
                        <span>Add Note</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <h4 className="text-white font-medium mb-2 flex items-center">
                          <FileText size={16} className="mr-2 text-purple-400" />
                          Current Treatment Plan
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                          <li className="flex items-start space-x-2">
                            <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Donepezil 10mg daily - Cholinesterase inhibitor</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Memantine 20mg daily - NMDA receptor antagonist</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                            <span>Weekly cognitive therapy sessions</span>
                          </li>
                        </ul>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <h4 className="text-white font-medium mb-2 flex items-center">
                          <Stethoscope size={16} className="mr-2 text-cyan-400" />
                          Clinical Recommendations
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                          <li className="flex items-start space-x-2">
                            <ChevronRight size={14} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                            <span>Follow-up MRI in 6 months</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <ChevronRight size={14} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                            <span>Increase physical activity to 30 min/day</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <ChevronRight size={14} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                            <span>Consider support group enrollment</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900 border border-purple-500/20 rounded-xl p-16 text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
                    <Brain size={80} className="relative text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Select a Patient</h3>
                  <p className="text-slate-400 max-w-md mx-auto">Choose a patient above to explore their comprehensive Digital Twin analysis including MRI visualization, disease progression, and treatment recommendations.</p>
                </div>
              )}
            </div>
          )}

          {/* === TELECONSULTATION SECTION === */}
          {activeSection === "teleconsultation" && (
            <div className="space-y-6">
              {/* Hero Banner */}
              <div className="relative bg-gradient-to-r from-emerald-900/40 via-green-900/30 to-teal-900/40 border border-green-500/30 rounded-2xl p-8 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(16,185,129,0.15),transparent_70%)]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
                <div className="relative flex items-center justify-between">
                  <div className="max-w-xl">
                    <div className="flex items-center space-x-2 mb-3">
                      <Shield size={18} className="text-green-400" />
                      <span className="text-green-400 text-sm font-medium">HIPAA Compliant & Encrypted</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-3">Secure Remote Consultations</h2>
                    <p className="text-slate-300 mb-6">Connect with patients and caregivers through high-quality video consultations. Review Digital Twin data in real-time during calls for comprehensive care delivery.</p>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => setShowScheduleModal(true)}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-green-500/25"
                      >
                        <CalendarPlus size={20} />
                        <span>Schedule Consultation</span>
                      </button>
                      <button className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-all border border-slate-700">
                        <Video size={20} />
                        <span>Quick Start Call</span>
                      </button>
                    </div>
                  </div>
                  <div className="hidden lg:block relative">
                    <div className="w-48 h-48 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                      <Video size={64} className="text-green-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Consultations", value: "156", icon: Video, color: "green" },
                  { label: "This Week", value: "12", icon: Calendar, color: "blue" },
                  { label: "Avg. Duration", value: "24 min", icon: Clock, color: "purple" },
                  { label: "Satisfaction", value: "4.8/5", icon: Star, color: "yellow" },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon size={20} className={`text-${stat.color}-400`} />
                      <span className={`text-xs px-2 py-0.5 rounded bg-${stat.color}-500/20 text-${stat.color}-400`}>
                        {idx === 1 ? '+3' : ''}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-slate-500 text-xs">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Patient List for Teleconsultation */}
                <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Users size={20} className="mr-2 text-blue-400" />
                      Available Patients
                    </h3>
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search patients..."
                        className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                  <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
                    {patients.map((patient) => (
                      <div key={patient.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors group">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                              {patient.avatar}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                              <span className="w-2 h-2 bg-white rounded-full" />
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium group-hover:text-green-400 transition-colors">{patient.name}</p>
                            <p className="text-slate-400 text-sm">{patient.diagnosis}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                patient.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                                patient.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {patient.riskLevel?.toUpperCase()} RISK
                              </span>
                              <span className="text-slate-500 text-[10px]">Last: {patient.lastScan}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPatientForSchedule(patient);
                              setShowScheduleModal(true);
                            }}
                            className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
                            title="Schedule"
                          >
                            <Calendar size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPatientForDT(patient);
                              setActiveSection("digitalTwin");
                            }}
                            className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all"
                            title="View Digital Twin"
                          >
                            <Brain size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPatientDetails(patient);
                              startVideoCall();
                            }}
                            className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-green-500/20"
                          >
                            <Video size={16} />
                            <span>Call</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scheduled Appointments */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-slate-800">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <CalendarPlus size={20} className="mr-2 text-green-400" />
                      Upcoming Sessions
                    </h3>
                  </div>
                  <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                    {[
                      { patient: "John Doe", time: "Today, 3:00 PM", type: "Follow-up", avatar: "JD" },
                      { patient: "Sarah Wilson", time: "Tomorrow, 10:00 AM", type: "Initial", avatar: "SW" },
                      { patient: "Michael Brown", time: "Dec 18, 2:30 PM", type: "Review", avatar: "MB" },
                    ].map((apt, idx) => (
                      <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-green-500/30 transition-colors">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                            {apt.avatar}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm">{apt.patient}</p>
                            <p className="text-slate-400 text-xs">{apt.type} Consultation</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-green-400">
                            <Clock size={14} />
                            <span className="text-sm font-medium">{apt.time}</span>
                          </div>
                          <button className="flex items-center space-x-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
                            <Play size={12} />
                            <span>Join</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => setShowScheduleModal(true)}
                      className="w-full p-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-green-400 hover:border-green-500/50 transition-all flex items-center justify-center space-x-2"
                    >
                      <Plus size={18} />
                      <span className="text-sm font-medium">Schedule New</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Consultation History */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Clock size={20} className="mr-2 text-purple-400" />
                    Consultation History
                  </h3>
                  <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 font-medium">
                      <tr>
                        <th className="px-5 py-3 text-left">Patient</th>
                        <th className="px-5 py-3 text-left">Date & Time</th>
                        <th className="px-5 py-3 text-left">Duration</th>
                        <th className="px-5 py-3 text-left">Type</th>
                        <th className="px-5 py-3 text-left">Notes</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {[
                        { patient: "John Doe", avatar: "JD", date: "Dec 15, 2:30 PM", duration: "25 min", type: "Follow-up", notes: "Discussed medication adjustment", status: "completed" },
                        { patient: "Sarah Wilson", avatar: "SW", date: "Dec 14, 10:00 AM", duration: "18 min", type: "Emergency", notes: "Caregiver reported confusion", status: "completed" },
                        { patient: "Michael Brown", avatar: "MB", date: "Dec 13, 3:15 PM", duration: "32 min", type: "Initial", notes: "First consultation, baseline established", status: "completed" },
                        { patient: "Emma Davis", avatar: "ED", date: "Dec 12, 11:00 AM", duration: "28 min", type: "Review", notes: "Digital Twin analysis reviewed", status: "completed" },
                      ].map((consultation, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="px-5 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                {consultation.avatar}
                              </div>
                              <span className="text-white font-medium">{consultation.patient}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-300 text-sm">{consultation.date}</td>
                          <td className="px-5 py-4 text-slate-300 text-sm">{consultation.duration}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              consultation.type === 'Emergency' ? 'bg-red-500/20 text-red-400' :
                              consultation.type === 'Initial' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-slate-700 text-slate-300'
                            }`}>
                              {consultation.type}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-400 text-sm max-w-xs truncate">{consultation.notes}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all" title="View Notes">
                                <FileText size={16} />
                              </button>
                              <button className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all" title="View Recording">
                                <Play size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Features & Tips */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-xl p-5">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3">
                    <Brain size={20} className="text-blue-400" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Digital Twin Integration</h4>
                  <p className="text-slate-400 text-sm">Access patient's Digital Twin data directly during consultations for comprehensive insights.</p>
                </div>
                <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-xl p-5">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center mb-3">
                    <Shield size={20} className="text-green-400" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">End-to-End Encryption</h4>
                  <p className="text-slate-400 text-sm">All video consultations are encrypted and comply with HIPAA regulations.</p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-xl p-5">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mb-3">
                    <FileText size={20} className="text-purple-400" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Auto Documentation</h4>
                  <p className="text-slate-400 text-sm">Consultation notes and recordings are automatically saved for future reference.</p>
                </div>
              </div>
            </div>
          )}

          {/* === PATIENTS SECTION (REAL DATA) === */}
          {activeSection === "patients" && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <p className="text-slate-500 text-xs uppercase">Total Patients</p>
                  <p className="text-2xl font-bold text-white">{stats.totalPatients}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <p className="text-slate-500 text-xs uppercase">High Risk</p>
                  <p className="text-2xl font-bold text-white text-red-400">{stats.highRisk}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <p className="text-slate-500 text-xs uppercase">Active Scans</p>
                  <p className="text-2xl font-bold text-white text-green-400">{stats.scansThisWeek}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <p className="text-slate-500 text-xs uppercase">Avg Risk Score</p>
                  <p className="text-2xl font-bold text-white text-yellow-400">{stats.avgRiskScore}%</p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                 <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Patient Registry</h2>
                    <div className="flex space-x-2">
                        {['all', 'high', 'medium', 'low'].map(f => (
                            <button key={f} onClick={() => setSelectedFilter(f)} className={`px-3 py-1 rounded text-xs uppercase ${selectedFilter === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{f}</button>
                        ))}
                    </div>
                 </div>
                 
                 <div className="overflow-x-auto">
                   <table className="w-full">
                     <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 font-medium">
                       <tr>
                         <th className="px-5 py-3 text-left">Patient</th>
                         <th className="px-5 py-3 text-left">Diagnosis</th>
                         <th className="px-5 py-3 text-left">Risk</th>
                         <th className="px-5 py-3 text-left">Last Scan</th>
                         <th className="px-5 py-3 text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800">
                       {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                         <tr key={patient.id} className="hover:bg-slate-800/30">
                           <td className="px-5 py-4">
                             <div className="flex items-center space-x-3">
                               <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                                 {patient.avatar}
                               </div>
                               <div>
                                 <p className="text-white font-medium">{patient.name}</p>
                                 <p className="text-slate-400 text-xs">{patient.id}</p>
                               </div>
                             </div>
                           </td>
                           <td className="px-5 py-4 text-slate-300 text-sm">{patient.diagnosis}</td>
                           <td className="px-5 py-4">
                             <span className={`px-2 py-1 rounded text-xs border ${getRiskColor(patient.riskLevel)}`}>
                                {patient.riskLevel.toUpperCase()}
                             </span>
                           </td>
                           <td className="px-5 py-4 text-slate-400 text-sm">{patient.lastScan}</td>
                           <td className="px-5 py-4 text-right">
                             <button onClick={() => handleViewPatient(patient.id)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                               <Eye size={18} />
                             </button>
                           </td>
                         </tr>
                       )) : (
                         <tr><td colSpan="5" className="p-8 text-center text-slate-500">No patients found.</td></tr>
                       )}
                     </tbody>
                   </table>
                 </div>
              </div>
            </>
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
                          <h3 className="text-white font-semibold flex items-center mb-4"><Brain className="mr-2 text-blue-400" size={20}/> Disease Stage Assessment</h3>
                          
                          {/* Progress Bar */}
                          <div className="h-2 bg-slate-700 rounded-full flex mb-2">
                             {[0,1,2,3].map(step => (
                                <div key={step} className={`flex-1 h-full border-r border-slate-900 last:border-0 ${step <= (selectedPatientDetails.stageLevel || 1) ? 'bg-blue-500' : 'bg-transparent'}`}/>
                             ))}
                          </div>
                          <div className="flex justify-between text-xs text-slate-500 uppercase font-medium mb-4">
                             <span>Normal</span><span>MCI</span><span>Mild</span><span>Severe</span>
                          </div>

                          <div className="p-4 bg-slate-800 rounded border border-slate-700 flex justify-between items-center">
                             <div>
                                <p className="text-xs text-slate-400 uppercase">Current Stage</p>
                                <p className="text-xl font-bold text-white">{selectedPatientDetails.currentStage || "Mild Cognitive Impairment"}</p>
                             </div>
                             {(selectedPatientDetails.currentStage === "Pending Analysis" || !selectedPatientDetails.currentStage) ? 
                               <span className="text-yellow-400 text-xs font-bold border border-yellow-400/30 px-2 py-1 rounded">AI Required</span> :
                               <span className="text-green-400 text-xs font-bold border border-green-400/30 px-2 py-1 rounded">AI Analyzed</span>
                             }
                          </div>
                       </div>

                       {/* AI Trajectory Result */}
                       <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
                          <h3 className="text-white font-semibold flex items-center mb-4"><TrendingDown className="mr-2 text-purple-400" size={20}/> Progression Trajectory</h3>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-slate-800 rounded border border-slate-700">
                                <p className="text-xs text-slate-400 uppercase">Decline Rate</p>
                                <p className="text-xl font-bold text-white">{selectedPatientDetails.predictedDecline || "2.3% / month"}</p>
                             </div>
                             <div className="p-4 bg-slate-800 rounded border border-slate-700">
                                <p className="text-xs text-slate-400 uppercase">Time to Next Stage</p>
                                <p className="text-xl font-bold text-white">
                                    {selectedPatientDetails.trajectoryMonths > 0 ? `${selectedPatientDetails.trajectoryMonths} Months` : "~18 Months"}
                                </p>
                             </div>
                          </div>
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
                        </div>

                        {/* MRI Gallery */}
                        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
                           <h3 className="text-white font-semibold flex items-center mb-4"><ImageIcon className="mr-2 text-indigo-400" size={20}/> MRI Scans</h3>
                           <div className="grid grid-cols-2 gap-2">
                              {selectedPatientDetails.mriScans.length > 0 ? (
                                selectedPatientDetails.mriScans.map((scan, i) => (
                                    <div key={i} className="relative aspect-square bg-black rounded border border-slate-600 overflow-hidden group">
                                        <img src={scan.url} alt="Scan" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white p-1 text-center">
                                            {scan.date}
                                        </div>
                                    </div>
                                ))
                              ) : (
                                <div className="col-span-2 py-6 text-center text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded">No DICOM Data</div>
                              )}
                           </div>
                           {/* 1. HIDDEN INPUT (Required to open file dialog) */}
                           <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleFileUpload} 
                              className="hidden" 
                              accept=".dcm,.png,.jpg,.jpeg" 
                           />

                           {/* 2. UPDATED BUTTON */}
                           <button 
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
                           </button>
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

export default Dashboard;