import React, { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Settings,
  LogOut,
  Users,
  Activity,
  Brain,
  Calendar,
  ChevronRight,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  Plus,
  Eye,
  UserPlus,
  CheckCircle,
  XCircle,
  ClipboardList,
  Home,
  FileText,
  X,
  Video,
  Stethoscope,
  HeartPulse,
  Pill,
  Clock,
  MessageSquare,
  Share2,
} from "lucide-react";
import { VideoConsultation } from "./VideoConsultation";
import {
  getClinicianPendingRequests,
  acceptPatientRequest,
  rejectPatientRequest,
  getAcceptedPatients,
  getPatientFullDetails,
} from "../services/userService";

// Demo patients data
const DEMO_PATIENTS = [
  {
    id: "PAT-001",
    name: "John Smith",
    age: 72,
    gender: "Male",
    lastScan: "2024-12-10",
    riskLevel: "high",
    riskScore: 78,
    diagnosis: "MCI - Amnestic",
    trend: "down",
    avatar: "JS",
  },
  {
    id: "PAT-002",
    name: "Mary Johnson",
    age: 68,
    gender: "Female",
    lastScan: "2024-12-08",
    riskLevel: "medium",
    riskScore: 45,
    diagnosis: "Preclinical AD",
    trend: "stable",
    avatar: "MJ",
  },
  {
    id: "PAT-003",
    name: "Robert Williams",
    age: 75,
    gender: "Male",
    lastScan: "2024-12-05",
    riskLevel: "low",
    riskScore: 22,
    diagnosis: "Normal Aging",
    trend: "up",
    avatar: "RW",
  },
  {
    id: "PAT-004",
    name: "Patricia Brown",
    age: 70,
    gender: "Female",
    lastScan: "2024-12-12",
    riskLevel: "high",
    riskScore: 85,
    diagnosis: "Early AD",
    trend: "down",
    avatar: "PB",
  },
  {
    id: "PAT-005",
    name: "Michael Davis",
    age: 67,
    gender: "Male",
    lastScan: "2024-12-01",
    riskLevel: "medium",
    riskScore: 52,
    diagnosis: "MCI - Non-amnestic",
    trend: "stable",
    avatar: "MD",
  },
  {
    id: "PAT-006",
    name: "Linda Wilson",
    age: 73,
    gender: "Female",
    lastScan: "2024-11-28",
    riskLevel: "low",
    riskScore: 18,
    diagnosis: "Normal Aging",
    trend: "up",
    avatar: "LW",
  },
];

const getRiskColor = (level) => {
  switch (level) {
    case "high":
      return "text-red-400 bg-red-500/10 border-red-500/20";
    case "medium":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    case "low":
      return "text-green-400 bg-green-500/10 border-green-500/20";
    default:
      return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  }
};

const getTrendIcon = (trend) => {
  switch (trend) {
    case "up":
      return <TrendingUp size={14} className="text-green-400" />;
    case "down":
      return <TrendingDown size={14} className="text-red-400" />;
    default:
      return <Minus size={14} className="text-yellow-400" />;
  }
};

export const Dashboard = ({ user, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [activeSection, setActiveSection] = useState("overview"); // overview, patients, requests, patientDashboard
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedPatients, setAcceptedPatients] = useState([]);
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [viewingPatient, setViewingPatient] = useState(null); // For digital twin dashboard
  const [patientDashboardTab, setPatientDashboardTab] = useState("digitalTwin"); // digitalTwin, consultation, records, prescriptions
  const [showVideoCall, setShowVideoCall] = useState(false);

  // Fetch pending requests and accepted patients on component mount
  useEffect(() => {
    if (user?.uid) {
      fetchData();
    }
  }, [user?.uid]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requests, patients] = await Promise.all([
        getClinicianPendingRequests(user.uid),
        getAcceptedPatients(user.uid),
      ]);
      setPendingRequests(requests);
      setAcceptedPatients(patients);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleAcceptRequest = async (request) => {
    setActionLoading(request.id);
    try {
      // Prepare patient data from the request
      const patientData = {
        name:
          request.patientData?.name ||
          request.patientUserData?.displayName ||
          "Patient",
        age: request.patientData?.age,
        gender: request.patientData?.gender,
        diagnosis: request.patientData?.diagnosis || "Pending Assessment",
        riskScore: request.patientData?.riskScore || 0,
        riskLevel: request.patientData?.riskLevel || "low",
      };

      await acceptPatientRequest(
        request.id,
        request.patientId,
        user.uid,
        patientData
      );
      // Refresh data
      await fetchData();

      // Automatically open the patient's digital twin dashboard after accepting
      const acceptedPatient = {
        id: request.patientId,
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender,
        diagnosis: patientData.diagnosis,
        riskLevel: patientData.riskLevel,
        riskScore: patientData.riskScore,
        lastScan: request.patientData?.lastScan || "No scans",
        summary: request.summary || "",
      };
      handleOpenPatientDashboard(acceptedPatient);
    } catch (error) {
      console.error("Error accepting request:", error);
    }
    setActionLoading(null);
  };

  const handleRejectRequest = async (request) => {
    setActionLoading(request.id);
    try {
      await rejectPatientRequest(request.id);
      // Remove from local state
      setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
    setActionLoading(null);
  };

  const handleViewPatient = async (patientId) => {
    try {
      const details = await getPatientFullDetails(patientId);
      setSelectedPatientDetails(details);
      setShowPatientModal(true);
    } catch (error) {
      console.error("Error fetching patient details:", error);
    }
  };

  // Open patient digital twin dashboard
  const handleOpenPatientDashboard = async (patient) => {
    setViewingPatient(patient);
    setActiveSection("patientDashboard");
  };

  // Go back from patient dashboard
  const handleBackToPatients = () => {
    setViewingPatient(null);
    setActiveSection("patients");
  };

  // Combine demo patients with accepted patients for display
  const allPatients = [
    ...DEMO_PATIENTS,
    ...acceptedPatients.map((p) => ({
      id: p.id,
      name: p.name || p.userData?.displayName || "Unknown Patient",
      age: p.age || "N/A",
      gender: p.gender || "Unknown",
      lastScan: p.lastScan || "N/A",
      riskLevel:
        p.riskLevel ||
        (p.riskScore > 70 ? "high" : p.riskScore > 40 ? "medium" : "low"),
      riskScore: p.riskScore || 0,
      diagnosis: p.diagnosis || "Pending Assessment",
      summary: p.summary || "",
      trend: "stable",
      avatar: (p.name || p.userData?.displayName || "U")
        .charAt(0)
        .toUpperCase(),
      isReal: true, // Mark as real patient (not demo)
      caregiverId: p.caregiverId,
    })),
  ];

  const filteredPatients = allPatients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" || patient.riskLevel === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalPatients: allPatients.length,
    highRisk: allPatients.filter((p) => p.riskLevel === "high").length,
    scansThisWeek: 4,
    avgRiskScore: Math.round(
      allPatients.reduce((acc, p) => acc + p.riskScore, 0) / allPatients.length
    ),
    pendingRequests: pendingRequests.length,
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 fixed h-full">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.jpeg"
              alt="AlzTwin"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <span className="text-xl font-bold text-white">AlzTwin</span>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => {
              setActiveSection("overview");
              setViewingPatient(null);
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "overview"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Home size={20} />
            <span className="font-medium">Overview</span>
          </button>

          <button
            onClick={() => {
              setActiveSection("patients");
              setViewingPatient(null);
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === "patients" ||
              activeSection === "patientDashboard"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Users size={20} />
            <span className="font-medium">My Patients</span>
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
              <span className="font-medium">Caregiver Requests</span>
            </div>
            {pendingRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.displayName || "User"}
              </p>
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

      {/* Main Content Area */}
      <div className="ml-64 flex-1">
        {/* Top Navigation */}
        <nav className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Search Bar */}
              <div className="flex items-center flex-1 max-w-md">
                <div className="relative w-full">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center space-x-4">
                <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                  <Bell size={20} />
                  {pendingRequests.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                  <Settings size={20} />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {activeSection === "patientDashboard" && viewingPatient
                ? `${viewingPatient.name}'s Digital Twin`
                : `Welcome back, ${
                    user?.displayName?.split(" ")[0] || "Doctor"
                  }! 👋`}
            </h1>
            <p className="text-slate-400">
              {activeSection === "overview"
                ? "Here's an overview of your patients and recent activity."
                : activeSection === "patients"
                ? "Manage and view all your registered patients."
                : activeSection === "requests"
                ? "Review and manage patient access requests from caregivers."
                : "View patient's digital twin dashboard and health data."}
            </p>
          </div>

          {/* Overview Section */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Users size={20} className="text-blue-400" />
                    </div>
                    <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                      +2 this week
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {allPatients.length}
                  </p>
                  <p className="text-sm text-slate-400">Total Patients</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <Activity size={20} className="text-red-400" />
                    </div>
                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
                      Needs attention
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {allPatients.filter((p) => p.riskLevel === "high").length}
                  </p>
                  <p className="text-sm text-slate-400">High Risk Patients</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <UserPlus size={20} className="text-yellow-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {pendingRequests.length}
                  </p>
                  <p className="text-sm text-slate-400">Pending Requests</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Calendar size={20} className="text-green-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">3</p>
                  <p className="text-sm text-slate-400">Consultations Today</p>
                </div>
              </div>

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Patients */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Recent Patients
                    </h3>
                    <button
                      onClick={() => setActiveSection("patients")}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {allPatients.slice(0, 4).map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => handleOpenPatientDashboard(patient)}
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                            {patient.avatar || patient.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {patient.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {patient.diagnosis}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(
                            patient.riskLevel
                          )}`}
                        >
                          {patient.riskLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending Requests */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Pending Requests
                    </h3>
                    <button
                      onClick={() => setActiveSection("requests")}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      View All
                    </button>
                  </div>
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <UserPlus
                        size={32}
                        className="mx-auto text-slate-600 mb-2"
                      />
                      <p className="text-slate-500 text-sm">
                        No pending requests
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingRequests.slice(0, 3).map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-sm font-medium">
                              {request.patientData?.name?.charAt(0) || "P"}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {request.patientData?.name || "Patient"}
                              </p>
                              <p className="text-xs text-slate-400">
                                From:{" "}
                                {request.caregiverData?.displayName ||
                                  "Caregiver"}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAcceptRequest(request)}
                              className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request)}
                              className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveSection("patients")}
                    className="flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <Users size={24} className="text-blue-400 mb-2" />
                    <span className="text-sm text-white">View Patients</span>
                  </button>
                  <button
                    onClick={() => setActiveSection("requests")}
                    className="flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <UserPlus size={24} className="text-green-400 mb-2" />
                    <span className="text-sm text-white">View Requests</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors">
                    <Brain size={24} className="text-purple-400 mb-2" />
                    <span className="text-sm text-white">AI Analysis</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors">
                    <FileText size={24} className="text-yellow-400 mb-2" />
                    <span className="text-sm text-white">Reports</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Patient Digital Twin Dashboard */}
          {activeSection === "patientDashboard" && viewingPatient && (
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={handleBackToPatients}
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-4"
              >
                <ChevronRight size={20} className="rotate-180" />
                <span>Back to Patients</span>
              </button>

              {/* Patient Info Header with Actions */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                      {viewingPatient.avatar ||
                        viewingPatient.name?.charAt(0) ||
                        "P"}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {viewingPatient.name}
                      </h2>
                      <p className="text-slate-400">
                        Patient ID: {viewingPatient.id}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-slate-500">
                          Age: {viewingPatient.age || "N/A"}
                        </span>
                        <span className="text-sm text-slate-500">
                          Gender: {viewingPatient.gender || "N/A"}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRiskColor(
                            viewingPatient.riskLevel
                          )}`}
                        >
                          {viewingPatient.riskScore}% -{" "}
                          {viewingPatient.riskLevel?.charAt(0).toUpperCase() +
                            viewingPatient.riskLevel?.slice(1)}{" "}
                          Risk
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Quick Actions */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowVideoCall(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      <Video size={18} />
                      <span>Start Consultation</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors">
                      <Share2 size={18} />
                      <span>Share Report</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPatientDashboardTab("digitalTwin")}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors ${
                      patientDashboardTab === "digitalTwin"
                        ? "bg-blue-500 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Brain size={18} />
                    <span>Digital Twin</span>
                  </button>
                  <button
                    onClick={() => setPatientDashboardTab("consultation")}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors ${
                      patientDashboardTab === "consultation"
                        ? "bg-blue-500 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Stethoscope size={18} />
                    <span>Consultation</span>
                  </button>
                  <button
                    onClick={() => setPatientDashboardTab("records")}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors ${
                      patientDashboardTab === "records"
                        ? "bg-blue-500 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <FileText size={18} />
                    <span>Medical Records</span>
                  </button>
                  <button
                    onClick={() => setPatientDashboardTab("prescriptions")}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors ${
                      patientDashboardTab === "prescriptions"
                        ? "bg-blue-500 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Pill size={18} />
                    <span>Prescriptions</span>
                  </button>
                </div>
              </div>

              {/* Digital Twin Tab Content */}
              {patientDashboardTab === "digitalTwin" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Brain Scan Card */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Brain size={24} className="text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                          Brain Scan
                        </h3>
                      </div>
                      <div className="h-48 bg-slate-800/50 rounded-lg flex items-center justify-center border border-dashed border-slate-700">
                        <div className="text-center">
                          <Brain
                            size={48}
                            className="mx-auto text-slate-600 mb-2"
                          />
                          <p className="text-slate-500 text-sm">
                            No scan data available
                          </p>
                          <button className="mt-3 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30 transition-colors">
                            Upload Scan
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Cognitive Assessment Card */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <Activity size={24} className="text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                          Cognitive Assessment
                        </h3>
                      </div>
                      <div className="h-48 bg-slate-800/50 rounded-lg flex items-center justify-center border border-dashed border-slate-700">
                        <div className="text-center">
                          <ClipboardList
                            size={48}
                            className="mx-auto text-slate-600 mb-2"
                          />
                          <p className="text-slate-500 text-sm">
                            No assessment data
                          </p>
                          <button className="mt-3 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30 transition-colors">
                            New Assessment
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progression Tracking Card */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <TrendingUp size={24} className="text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                          Progression Tracking
                        </h3>
                      </div>
                      <div className="h-48 bg-slate-800/50 rounded-lg flex items-center justify-center border border-dashed border-slate-700">
                        <div className="text-center">
                          <TrendingUp
                            size={48}
                            className="mx-auto text-slate-600 mb-2"
                          />
                          <p className="text-slate-500 text-sm">
                            No tracking data
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Diagnosis & Treatment
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-slate-800/50 rounded-lg p-4">
                          <p className="text-sm text-slate-400 mb-1">
                            Current Diagnosis
                          </p>
                          <p className="text-white font-medium">
                            {viewingPatient.diagnosis || "Pending Assessment"}
                          </p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4">
                          <p className="text-sm text-slate-400 mb-1">
                            Last Scan Date
                          </p>
                          <p className="text-white font-medium">
                            {viewingPatient.lastScan || "No scans recorded"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Notes & Observations
                      </h3>
                      <div className="h-40 bg-slate-800/50 rounded-lg flex items-center justify-center border border-dashed border-slate-700">
                        <div className="text-center">
                          <FileText
                            size={32}
                            className="mx-auto text-slate-600 mb-2"
                          />
                          <p className="text-slate-500 text-sm">
                            No notes available
                          </p>
                          <button className="mt-3 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30 transition-colors">
                            Add Note
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Consultation Tab Content */}
              {patientDashboardTab === "consultation" && (
                <div className="space-y-6">
                  {/* Start Consultation Card */}
                  <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                      <Video size={40} className="text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Video Consultation
                    </h3>
                    <p className="text-slate-400 mb-6 max-w-md mx-auto">
                      Start a secure video call with the patient or their
                      caregiver for remote consultation.
                    </p>
                    <button
                      onClick={() => setShowVideoCall(true)}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors"
                    >
                      <Video size={20} />
                      <span>Start Video Call</span>
                    </button>
                  </div>

                  {/* Consultation History */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <Clock size={20} className="text-slate-400" />
                      <span>Consultation History</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Video size={20} className="text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              Video Consultation
                            </p>
                            <p className="text-sm text-slate-400">
                              No previous consultations
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Notes */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                      <MessageSquare size={20} className="text-slate-400" />
                      <span>Consultation Notes</span>
                    </h3>
                    <textarea
                      placeholder="Add notes from your consultation..."
                      className="w-full h-32 bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                    />
                    <div className="flex justify-end mt-3">
                      <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                        Save Notes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Medical Records Tab Content */}
              {patientDashboardTab === "records" && (
                <div className="space-y-6">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white">
                        Medical Records
                      </h3>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors">
                        <Plus size={18} />
                        <span>Add Record</span>
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-purple-500/10 rounded-lg">
                            <FileText size={20} className="text-purple-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              MRI Scan Report
                            </p>
                            <p className="text-sm text-slate-400">
                              Uploaded on Dec 10, 2024
                            </p>
                          </div>
                        </div>
                        <button className="text-blue-400 hover:text-blue-300 transition-colors">
                          <Eye size={18} />
                        </button>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-green-500/10 rounded-lg">
                            <Activity size={20} className="text-green-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              Cognitive Test Results
                            </p>
                            <p className="text-sm text-slate-400">
                              Uploaded on Dec 5, 2024
                            </p>
                          </div>
                        </div>
                        <button className="text-blue-400 hover:text-blue-300 transition-colors">
                          <Eye size={18} />
                        </button>
                      </div>
                      <div className="h-32 bg-slate-800/30 rounded-lg flex items-center justify-center border border-dashed border-slate-700">
                        <div className="text-center">
                          <Plus
                            size={32}
                            className="mx-auto text-slate-600 mb-2"
                          />
                          <p className="text-slate-500 text-sm">
                            Drop files here or click to upload
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Prescriptions Tab Content */}
              {patientDashboardTab === "prescriptions" && (
                <div className="space-y-6">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white">
                        Current Prescriptions
                      </h3>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors">
                        <Plus size={18} />
                        <span>New Prescription</span>
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <Pill size={20} className="text-blue-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                Donepezil (Aricept)
                              </p>
                              <p className="text-sm text-slate-400">
                                10mg - Once daily
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span>Started: Oct 15, 2024</span>
                          <span>•</span>
                          <span>Refills: 2 remaining</span>
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                              <Pill size={20} className="text-purple-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                Memantine (Namenda)
                              </p>
                              <p className="text-sm text-slate-400">
                                5mg - Twice daily
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span>Started: Nov 1, 2024</span>
                          <span>•</span>
                          <span>Refills: 3 remaining</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prescription History */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Prescription History
                    </h3>
                    <div className="text-center py-8">
                      <HeartPulse
                        size={48}
                        className="mx-auto text-slate-600 mb-3"
                      />
                      <p className="text-slate-500">
                        No prescription history available
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Patient Requests Section */}
          {activeSection === "requests" && (
            <div className="space-y-4">
              {loading ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading requests...</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                  <UserPlus size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 text-lg mb-2">
                    No pending requests
                  </p>
                  <p className="text-slate-500 text-sm">
                    Patient requests from caregivers will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                            {(request.patientUserData?.displayName || "P")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {request.patientUserData?.displayName ||
                                "Unknown Patient"}
                            </h3>
                            <p className="text-sm text-slate-400">
                              {request.patientUserData?.email || "No email"}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-slate-500">
                                Age: {request.patientData?.age || "N/A"}
                              </span>
                              <span className="text-xs text-slate-500">
                                Gender: {request.patientData?.gender || "N/A"}
                              </span>
                              <span className="text-xs text-slate-500">
                                Diagnosis:{" "}
                                {request.patientData?.diagnosis || "Pending"}
                              </span>
                            </div>
                            <div className="mt-2 p-2 bg-slate-800/50 rounded-lg">
                              <p className="text-xs text-slate-400">
                                <span className="text-slate-500">
                                  Requested by:
                                </span>{" "}
                                {request.caregiverData?.displayName ||
                                  "Unknown Caregiver"}{" "}
                                ({request.caregiverData?.email})
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewPatient(request.patientId)}
                            className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                          >
                            <Eye size={16} />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => handleAcceptRequest(request)}
                            disabled={actionLoading === request.id}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={16} />
                            <span>
                              {actionLoading === request.id ? "..." : "Accept"}
                            </span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request)}
                            disabled={actionLoading === request.id}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <XCircle size={16} />
                            <span>
                              {actionLoading === request.id ? "..." : "Reject"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Patients Section (existing view) */}
          {activeSection === "patients" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Users size={20} className="text-blue-400" />
                    </div>
                    <span className="text-xs text-slate-500">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalPatients}
                  </p>
                  <p className="text-sm text-slate-400">Patients</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <Activity size={20} className="text-red-400" />
                    </div>
                    <span className="text-xs text-slate-500">Attention</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats.highRisk}
                  </p>
                  <p className="text-sm text-slate-400">High Risk</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Brain size={20} className="text-green-400" />
                    </div>
                    <span className="text-xs text-slate-500">This Week</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats.scansThisWeek}
                  </p>
                  <p className="text-sm text-slate-400">New Scans</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <TrendingUp size={20} className="text-yellow-400" />
                    </div>
                    <span className="text-xs text-slate-500">Average</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats.avgRiskScore}%
                  </p>
                  <p className="text-sm text-slate-400">Risk Score</p>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <UserPlus size={20} className="text-purple-400" />
                    </div>
                    <span className="text-xs text-slate-500">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats.pendingRequests}
                  </p>
                  <p className="text-sm text-slate-400">Requests</p>
                </div>
              </div>

              {/* Patients Section */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Patient Registry
                    </h2>
                    <p className="text-sm text-slate-400">
                      Manage and monitor your patients
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* Filter Buttons */}
                    <div className="hidden md:flex items-center space-x-2 bg-slate-800 rounded-lg p-1">
                      {["all", "high", "medium", "low"].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setSelectedFilter(filter)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            selectedFilter === filter
                              ? "bg-blue-500 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>
                    <button className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      <Plus size={16} />
                      <span>Add Patient</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Search */}
                <div className="p-4 md:hidden border-b border-slate-800">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3">
                          Patient
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                          Diagnosis
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3">
                          Risk Level
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">
                          Last Scan
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                          Trend
                        </th>
                        <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredPatients.map((patient) => (
                        <tr
                          key={patient.id}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-sm font-medium">
                                {patient.avatar}
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {patient.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {patient.id} • {patient.age}y •{" "}
                                  {patient.gender}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell">
                            <span className="text-sm text-slate-300">
                              {patient.diagnosis}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRiskColor(
                                patient.riskLevel
                              )}`}
                            >
                              {patient.riskScore}% -{" "}
                              {patient.riskLevel.charAt(0).toUpperCase() +
                                patient.riskLevel.slice(1)}
                            </span>
                          </td>
                          <td className="px-5 py-4 hidden lg:table-cell">
                            <div className="flex items-center space-x-2 text-sm text-slate-400">
                              <Calendar size={14} />
                              <span>{patient.lastScan}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 hidden md:table-cell">
                            <div className="flex items-center space-x-1">
                              {getTrendIcon(patient.trend)}
                              <span className="text-xs text-slate-400 capitalize">
                                {patient.trend}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() =>
                                  handleOpenPatientDashboard(patient)
                                }
                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="View Digital Twin Dashboard"
                              >
                                <Eye size={16} />
                              </button>
                              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty State */}
                {filteredPatients.length === 0 && (
                  <div className="p-12 text-center">
                    <Users size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400">
                      No patients found matching your criteria.
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    Showing {filteredPatients.length} of {allPatients.length}{" "}
                    patients
                  </p>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors">
                      Previous
                    </button>
                    <button className="px-3 py-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Patient Details Modal */}
          {showPatientModal && selectedPatientDetails && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">
                    Patient Details
                  </h2>
                  <button
                    onClick={() => setShowPatientModal(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-medium">
                      {(selectedPatientDetails.userData?.displayName || "P")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {selectedPatientDetails.userData?.displayName ||
                          "Unknown Patient"}
                      </h3>
                      <p className="text-slate-400">
                        {selectedPatientDetails.userData?.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-sm text-slate-400 mb-1">Age</p>
                      <p className="text-lg font-medium text-white">
                        {selectedPatientDetails.age || "N/A"}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-sm text-slate-400 mb-1">Gender</p>
                      <p className="text-lg font-medium text-white">
                        {selectedPatientDetails.gender || "N/A"}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-sm text-slate-400 mb-1">Diagnosis</p>
                      <p className="text-lg font-medium text-white">
                        {selectedPatientDetails.diagnosis ||
                          "Pending Assessment"}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-sm text-slate-400 mb-1">Risk Score</p>
                      <p className="text-lg font-medium text-white">
                        {selectedPatientDetails.riskScore || 0}%
                      </p>
                    </div>
                  </div>

                  {selectedPatientDetails.medications &&
                    selectedPatientDetails.medications.length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium text-white mb-3">
                          Medications
                        </h4>
                        <div className="space-y-2">
                          {selectedPatientDetails.medications.map(
                            (med, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-800/50 rounded-lg p-3 text-slate-300"
                              >
                                {typeof med === "string" ? med : med.name}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
                <div className="p-6 border-t border-slate-800">
                  <button
                    onClick={() => setShowPatientModal(false)}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Video Consultation Modal */}
          {showVideoCall && viewingPatient && (
            <VideoConsultation
              user={user}
              patient={viewingPatient}
              onClose={() => setShowVideoCall(false)}
              onEndCall={() => setShowVideoCall(false)}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
