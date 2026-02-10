import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as THREE from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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
const API_STAGE_URL = "https://cors-anywhere.herokuapp.com/https://ce68-34-6-200-182.ngrok-free.app/predict"; 
const API_PROGRESSION_URL =
  "https://cors-anywhere.herokuapp.com/https://cedd-34-73-45-27.ngrok-free.app/predict";
const API_3D_MODEL_URL = "https://cors-anywhere.herokuapp.com/https://integrant-freeman-inscriptively.ngrok-free.dev";
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

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
  return new Date(timestamp).toLocaleDateString();
};

const base64ToBlob = (base64Data, contentType = 'application/dicom') => {
  if (!base64Data) return null;
  const byteCharacters = atob(base64Data.split(',')[1] || base64Data);
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
  return new Blob(byteArrays, { type: contentType });
};

// --- 3D VIEWER COMPONENT (MUST BE HERE) ---
// --- 3D BRAIN VIEWER (Adapted from VTM Viewer) ---
const ThreeBrainView = ({ plyUrl }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!plyUrl || !mountRef.current) return;

    // 1. Setup Scene
    const container = mountRef.current;
    container.innerHTML = ""; // Clean up previous renders
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Match Dashboard Dark Theme

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.position.set(0, 0, 600); // Zoomed out slightly

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // 2. Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(300, 300, 300);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(-300, 0, -300);
    scene.add(rimLight);

    // 3. Labels Helper
    const labels = [];
    const lines = [];

    const createLabelWithLine = (text, regionPos, offset, color = "#ffffff") => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      
      // Label Background
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; 
      ctx.roundRect(0, 20, 256, 60, 10);
      ctx.fill();
      
      // Label Text
      ctx.fillStyle = color;
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(text, 128, 60);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
      const sprite = new THREE.Sprite(material);

      const labelPos = regionPos.clone().add(offset);
      sprite.position.copy(labelPos);
      sprite.scale.set(60, 30, 1); // Adjust label size
      sprite.renderOrder = 999;
      scene.add(sprite);

      labels.push({ sprite, regionPos, offset });

      // Line
      const geometry = new THREE.BufferGeometry().setFromPoints([regionPos.clone(), labelPos.clone()]);
      const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x4ade80, linewidth: 2, transparent: true, opacity: 0.6 }));
      scene.add(line);
      lines.push({ line, regionPos, offset });
    };

    // 4. Load PLY & Generate Heatmap
    const loader = new PLYLoader();
    loader.load(plyUrl, (geo) => {
      geo.computeVertexNormals();
      const pos = geo.attributes.position;
      
      // Centering
      geo.computeBoundingBox();
      const box = geo.boundingBox;
      const center = new THREE.Vector3();
      box.getCenter(center);
      geo.translate(-center.x, -center.y, -center.z);

      // Scaling
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 350 / maxDim; // Fit inside the 600px container
      
      // Create Base Mesh
      const material = new THREE.MeshStandardMaterial({
        color: 0x64748b, // Slate-500
        roughness: 0.4,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      const originalMesh = new THREE.Mesh(geo.clone(), material);
      originalMesh.scale.setScalar(scale);
      scene.add(originalMesh);

      // Create Heatmap Overlay
      const heatColors = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);

        let r = 0, g = 0, b = 0; 
        
        // --- Heatmap Logic (Customize zones here) ---
        if (z > 40) { r = 1; g = 0.2; b = 0.2; } // Frontal (Red)
        else if (z < -40) { r = 0.2; g = 0.4; b = 1; } // Occipital (Blue)
        else if (y < -30) { r = 1; g = 1; b = 0; } // Temporal (Yellow)
        else { r = 0.1; g = 0.8; b = 0.1; } // Parietal/Other (Green)

        heatColors[i * 3] = r;
        heatColors[i * 3 + 1] = g;
        heatColors[i * 3 + 2] = b;
      }

      const heatGeo = geo.clone();
      heatGeo.setAttribute("color", new THREE.BufferAttribute(heatColors, 3));
      const heatMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: 0.5, // See-through overlay
        side: THREE.DoubleSide
      });
      const heatMesh = new THREE.Mesh(heatGeo, heatMaterial);
      heatMesh.scale.setScalar(scale);
      scene.add(heatMesh);

      // Add Labels
      createLabelWithLine("Frontal Lobe", new THREE.Vector3(0, 60, 80).multiplyScalar(scale), new THREE.Vector3(0, 40, 40));
      createLabelWithLine("Temporal Lobe", new THREE.Vector3(60, -20, 0).multiplyScalar(scale), new THREE.Vector3(50, 0, 0));
      createLabelWithLine("Hippocampus", new THREE.Vector3(20, -30, 20).multiplyScalar(scale), new THREE.Vector3(40, 20, 0), "#fbbf24");
    });

    // 5. Animation
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      // Update lines to follow camera/rotation
      labels.forEach(({ sprite, regionPos, offset }, i) => {
        const newPos = regionPos.clone().add(offset);
        // lines[i].line.geometry.setFromPoints([regionPos, newPos]); // Optional dynamic update
        // sprite.position.copy(newPos);
      });

      renderer.render(scene, camera);
    };
    animate();

    // 6. Resize Handler
    const handleResize = () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if(container) container.innerHTML = "";
      renderer.dispose();
    };
  }, [plyUrl]);

  return <div ref={mountRef} className="w-full h-full rounded-2xl overflow-hidden cursor-move" />;
};
// Helper to safely convert Firestore Timestamps
// const formatDate = (timestamp) => {
//   if (!timestamp) return "N/A";
//   // If it's a Firestore Timestamp (has seconds)
//   if (timestamp.seconds) {
//     return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   }
//   // If it's already a string or Date object
//   return new Date(timestamp).toLocaleDateString();
// };

// Helper: Convert Base64 String back to a Blob (File)
// const base64ToBlob = (base64Data, contentType = 'application/dicom') => {
//   if (!base64Data) return null;
  
//   // 1. Strip the "data:image..." prefix if it exists to get raw string
//   const byteCharacters = atob(base64Data.split(',')[1] || base64Data);
  
//   // 2. Convert to Byte Array
//   const byteArrays = [];
//   for (let offset = 0; offset < byteCharacters.length; offset += 512) {
//     const slice = byteCharacters.slice(offset, offset + 512);
//     const byteNumbers = new Array(slice.length);
//     for (let i = 0; i < slice.length; i++) {
//       byteNumbers[i] = slice.charCodeAt(i);
//     }
//     const byteArray = new Uint8Array(byteNumbers);
//     byteArrays.push(byteArray);
//   }
  
//   // 3. Create Blob
//   return new Blob(byteArrays, { type: contentType });
// };
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
  // Since we are getting a file directly, we can't get inference text in the same response.
  // You can set a default message or make a separate API call for text.
  meshInference: inferenceText,
  detectedRegions: ["Hippocampus", "Ventricles", "Cortex"] // Default active regions
}));


      
      // 2. Download Mesh Blob
      const meshRes = await fetch(`${API_3D_MODEL_URL}/download_mesh`);
      const meshBlob = await meshBlobRes.blob();
      // const meshUrl = URL.createObjectURL(meshBlob);


      // 3. Update State
      setSelectedPatientForDT(prev => ({
        ...prev,
        meshUrl: meshUrl,
        meshInference: data.inference,
        detectedRegions: data.detected_regions
      }));

      alert("Digital Twin Model Generated Successfully!");
    } catch (err) {
      console.error(err);
      // alert("Failed to generate 3D model. Check API connection.");
    } finally {
      setAnalyzing(false);
    }
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
      const inferenceText = stageRes.data.explanation;
      const trajInference=progRes.data.explanation;
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
        inferenceText: inferenceText,
        trajInference:trajInference,
        
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
                  {/* MRI-Based 3D Brain Visualization Hero - REPLACED */}
{/* --- 3D BRAIN VISUALIZATION HERO --- */}
<div className="lg:col-span-3">
  <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden h-[600px] flex flex-col items-center justify-center">
    
    {/* Header Overlay */}
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-green-500/30">
          <div className={`w-2 h-2 rounded-full ${selectedPatientForDT?.meshUrl ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className="text-xs text-white font-medium">
            {selectedPatientForDT?.meshUrl ? 'Interactive VTM Model' : 'Waiting for DICOM'}
          </span>
        </div>
        
      </div>
    </div>

    {/* MAIN CONTENT */}
    {analyzing ? (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="text-purple-400 font-semibold animate-pulse">Reconstructing 3D Neuro-Atlas...</p>
      </div>

    ) : selectedPatientForDT?.meshUrl ? (
      // === SHOW 3D VIEWER ===
      <div className="w-full h-full relative">
        <ThreeBrainView plyUrl={selectedPatientForDT.meshUrl} />
        
        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-700 pointer-events-none">
           <span className="text-xs text-slate-400 flex items-center gap-2">
             <Move size={12}/> Rotate • Zoom • Pan
           </span>
        </div>
      </div>

    ) : (
      // === SHOW UPLOAD BUTTON ===
      <div className="text-center p-8 z-10">
        <div className="w-24 h-24 bg-slate-900 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mx-auto mb-6">
          <Brain size={40} className="text-slate-500" />
        </div>
        <h4 className="text-white font-bold text-xl mb-2">No Brain Reconstruction</h4>
        <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
          Upload a patient's DICOM folder to generate the high-fidelity Digital Twin.
        </p>
        
        <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 w-max mx-auto">
          <Upload size={20} />
          <span>Upload DICOM Folder</span>
          <input 
            type="file" 
            className="hidden" 
            webkitdirectory="true" 
            directory="true" 
            multiple 
            onChange={handleFolderUpload} 
          />
        </label>
      </div>
    )}
  </div>
</div>

{/* 3D INFERENCE DISPLAY */}
  {selectedPatientForDT?.meshInference && (
    <div className="mt-6 bg-slate-800/50 border-l-4 border-purple-500 rounded-xl p-5 shadow-lg">
      <div className="flex items-center space-x-2 mb-3">
        <Zap size={18} className="text-purple-400" />
        <h4 className="text-purple-400 font-bold text-xs uppercase tracking-widest">
          Volumetric AI Assessment
        </h4>
      </div>
      <p className="text-slate-300 text-sm italic leading-relaxed">
        "{selectedPatientForDT.meshInference}"
      </p>
    </div>
  )}
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

export default Dashboard;