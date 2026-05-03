import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";
import {
  Bell,
  Settings,
  LogOut,
  Users,
  Heart,
  AlertCircle,
  Calendar,
  ChevronRight,
  MoreVertical,
  MessageSquare,
  CheckCircle,
  Clock,
  UserPlus,
  Send,
  X,
} from "lucide-react";
import {
  getAllClinicians,
  createPatientAccessRequest,
} from "../services/userService";

export const CaregiverDashboard = ({ user, onLogout }) => {
  const { isLight } = useTheme();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [clinicians, setClinicians] = useState([]);
  const [selectedClinician, setSelectedClinician] = useState(null);
  const [requestingPatient, setRequestingPatient] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Fetch clinicians on component mount
  useEffect(() => {
    const fetchClinicians = async () => {
      const clinicianList = await getAllClinicians();
      setClinicians(clinicianList);
    };
    fetchClinicians();
  }, []);

  const handleRequestClinicianAccess = (patient) => {
    setRequestingPatient(patient);
    setShowRequestModal(true);
    setRequestSuccess(false);
    setSelectedClinician(null);
  };

  const handleSubmitRequest = async () => {
    if (!selectedClinician || !requestingPatient) return;

    setRequestLoading(true);
    try {
      await createPatientAccessRequest(
        user.uid,
        requestingPatient.id, // This would be the actual patient ID from Firebase
        selectedClinician.id,
        {
          patientName: requestingPatient.name,
          caregiverName: user.displayName || user.email,
          relationship: requestingPatient.relationship,
        }
      );
      setRequestSuccess(true);
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error submitting request:", error);
    }
    setRequestLoading(false);
  };

  // Mock caregiver data
  const patients = [
    {
      id: 1,
      name: "John Smith",
      relationship: "Father",
      riskLevel: "high",
      riskScore: 78,
      lastCheck: "2 hours ago",
      status: "stable",
      medications: 3,
      alertsCount: 1,
    },
    {
      id: 2,
      name: "Mary Johnson",
      relationship: "Mother",
      riskLevel: "medium",
      riskScore: 52,
      lastCheck: "1 hour ago",
      status: "monitoring",
      medications: 2,
      alertsCount: 0,
    },
    {
      id: 3,
      name: "Robert Williams",
      relationship: "Grandfather",
      riskLevel: "low",
      riskScore: 22,
      lastCheck: "30 minutes ago",
      status: "healthy",
      medications: 1,
      alertsCount: 0,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "medication",
      patient: "John Smith",
      action: "Took morning medications",
      time: "2 hours ago",
      icon: CheckCircle,
    },
    {
      id: 2,
      type: "alert",
      patient: "John Smith",
      action: "Sleep quality below normal",
      time: "1 hour ago",
      icon: AlertCircle,
    },
    {
      id: 3,
      type: "assessment",
      patient: "Mary Johnson",
      action: "Cognitive assessment completed",
      time: "30 minutes ago",
      icon: CheckCircle,
    },
    {
      id: 4,
      type: "message",
      patient: "Robert Williams",
      action: "Sent reminder for appointment",
      time: "15 minutes ago",
      icon: MessageSquare,
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

  const card = isLight
    ? "bg-[#eaf7f4] border border-gray-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-sm transition-all"
    : "bg-slate-800/50 border border-slate-700 rounded-xl p-5";

  const muted = isLight ? "text-gray-500" : "text-slate-400";
  const heading = isLight ? "text-gray-900" : "text-white";
  const subtext = isLight ? "text-gray-700" : "text-slate-300";

  return (
    <div className={`min-h-screen ${isLight ? "bg-[linear-gradient(180deg,#e8f6f3_0%,#e5f4f7_52%,#e8f0fb_100%)]" : "bg-gradient-to-br from-slate-950 to-slate-900"}`}>
      {/* Navigation */}
      <nav className={`border-b backdrop-blur-sm sticky top-0 z-50 ${isLight ? "bg-[#e8f6f3]/90 border-gray-200 shadow-sm" : "bg-slate-900/80 border-slate-800"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src="/logo.jpeg" alt="AlzTwin" className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <p className={`text-sm ${muted}`}>Caregiver App</p>
                <p className={`font-semibold ${heading}`}>AlzTwin</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className={`p-2 rounded-lg relative transition-colors ${isLight ? "text-gray-500 hover:text-gray-900 hover:bg-[#dff3ee]" : "text-slate-400 hover:text-white"}`}>
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className={`p-2 rounded-lg transition-colors ${isLight ? "text-gray-500 hover:text-gray-900 hover:bg-[#dff3ee]" : "text-slate-400 hover:text-white"}`}>
                <Settings size={20} />
              </button>
              <div className={`h-6 w-px ${isLight ? "bg-gray-200" : "bg-slate-700"}`}></div>
              <button onClick={onLogout} className="flex items-center space-x-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                <LogOut size={18} />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${heading}`}>Welcome, {user?.displayName?.split(" ")[0]}! 👋</h1>
          <p className={muted}>Monitor and support your loved ones' health journey</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patients List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${heading}`}>Your Patients</h2>
              <span className={`text-sm ${muted}`}>{patients.length} people</span>
            </div>

            {patients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient.id)}
                className={`border rounded-xl p-5 cursor-pointer transition-all ${
                  isLight
                    ? selectedPatient === patient.id
                      ? "bg-[#dff3ee] border-emerald-700 shadow-md"
                      : "bg-[#eaf7f4] border-gray-200 hover:border-emerald-300 hover:shadow-sm"
                    : selectedPatient === patient.id
                      ? "border-blue-500 bg-slate-800"
                      : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      isLight ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-slate-600 to-slate-700"
                    }`}>
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-semibold ${heading}`}>{patient.name}</p>
                      <p className={`text-xs ${muted}`}>{patient.relationship}</p>
                    </div>
                  </div>
                  <button className={`p-2 rounded-lg transition-colors ${isLight ? "text-gray-400 hover:text-gray-700 hover:bg-[#dff3ee]" : "text-slate-400 hover:text-white"}`}>
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Risk Level", value: <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(patient.riskLevel)}`}>{patient.riskScore}%</span> },
                    { label: "Status", value: <p className={`text-sm capitalize ${subtext}`}>{patient.status}</p> },
                    { label: "Last Check", value: <p className={`text-sm ${subtext}`}>{patient.lastCheck}</p> },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className={`text-xs mb-1 ${muted}`}>{label}</p>
                      {value}
                    </div>
                  ))}
                </div>

                {patient.alertsCount > 0 && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
                    <AlertCircle size={16} className="text-red-400" />
                    <span className="text-xs text-red-400">{patient.alertsCount} alert{patient.alertsCount !== 1 ? "s" : ""}</span>
                  </div>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); handleRequestClinicianAccess(patient); }}
                  className={`mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors border text-sm font-medium ${
                    isLight
                      ? "bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-700"
                      : "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30"
                  }`}
                >
                  <UserPlus size={16} />
                  <span>Request Clinician Access</span>
                </button>
              </div>
            ))}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className={card}>
              <h3 className={`text-lg font-semibold mb-4 ${heading}`}>Overview</h3>
              <div className="space-y-3">
                {[
                  { label: "Total Patients", value: patients.length, cls: heading },
                  { label: "High Risk", value: 1, cls: "text-red-400" },
                  { label: "Active Alerts", value: 1, cls: "text-yellow-500" },
                ].map(({ label, value, cls }, i) => (
                  <React.Fragment key={label}>
                    {i > 0 && <div className={`h-px ${isLight ? "bg-gray-100" : "bg-slate-700"}`}></div>}
                    <div className="flex items-center justify-between">
                      <span className={muted}>{label}</span>
                      <span className={`text-2xl font-bold ${cls}`}>{value}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className={card}>
              <h3 className={`text-lg font-semibold mb-4 ${heading}`}>Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.slice(0, 4).map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <div key={activity.id} className={`flex items-start space-x-3 pb-3 border-b last:border-b-0 last:pb-0 ${isLight ? "border-gray-100" : "border-slate-700"}`}>
<IconComponent size={16} className={`${muted} mt-1 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${subtext}`}>{activity.patient}</p>
                        <p className={`text-xs truncate ${muted}`}>{activity.action}</p>
                        <p className={`text-xs mt-1 ${isLight ? "text-gray-400" : "text-slate-500"}`}>{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-semibold text-sm">Emergency Contact</p>
                  <p className="text-xs text-red-400/70 mt-1">If patient shows concerning symptoms, call 911 or your local emergency number.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Request Clinician Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-md w-full border ${isLight ? "bg-[#eaf7f4] border-gray-200" : "bg-slate-900 border-slate-800"}`}>
            <div className={`p-6 border-b flex items-center justify-between ${isLight ? "border-gray-100" : "border-slate-800"}`}>
              <h2 className={`text-xl font-semibold ${heading}`}>Request Clinician Access</h2>
              <button onClick={() => setShowRequestModal(false)} className={`p-2 rounded-lg transition-colors ${isLight ? "text-gray-400 hover:text-gray-700 hover:bg-[#dff3ee]" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
                <X size={20} />
              </button>
            </div>

            {requestSuccess ? (
              <div className="p-8 text-center">
                <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
                <h3 className={`text-lg font-semibold mb-2 ${heading}`}>Request Sent!</h3>
                <p className={muted}>The clinician will review your request shortly.</p>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-4">
                  <div>
                    <p className={`text-sm mb-2 ${muted}`}>Requesting access for:</p>
                    <div className={`rounded-lg p-3 flex items-center space-x-3 ${isLight ? "bg-[#dff3ee] border border-gray-200" : "bg-slate-800/50"}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${isLight ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-blue-500 to-purple-500"}`}>
                        {requestingPatient?.name?.charAt(0) || "P"}
                      </div>
                      <div>
                        <p className={`font-medium ${heading}`}>{requestingPatient?.name}</p>
                        <p className={`text-xs ${muted}`}>{requestingPatient?.relationship}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className={`text-sm mb-2 ${muted}`}>Select a Clinician:</p>
                    {clinicians.length === 0 ? (
                      <div className={`rounded-lg p-4 text-center ${isLight ? "bg-[#dff3ee]" : "bg-slate-800/50"}`}>
                        <p className={`text-sm ${muted}`}>No clinicians available</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {clinicians.map((clinician) => (
                          <button
                            key={clinician.id}
                            onClick={() => setSelectedClinician(clinician)}
                            className={`w-full p-3 rounded-lg border transition-colors text-left ${
                              selectedClinician?.id === clinician.id
                                ? isLight ? "bg-emerald-700 border-emerald-700 text-white" : "bg-blue-500/20 border-blue-500/50"
                                : isLight ? "bg-[#edf8f5] border-gray-200 hover:border-emerald-300" : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                            }`}
                          >
                            <p className={`font-medium ${selectedClinician?.id === clinician.id && isLight ? "text-white" : heading}`}>Dr. {clinician.displayName || clinician.email}</p>
                            <p className={`text-xs ${selectedClinician?.id === clinician.id && isLight ? "text-emerald-100" : muted}`}>{clinician.specialization || "General Practitioner"} • {clinician.hospital || "Not specified"}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`p-6 border-t ${isLight ? "border-gray-200" : "border-slate-800"}`}>
                  <button
                    onClick={handleSubmitRequest}
                    disabled={!selectedClinician || requestLoading}
                    className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg font-medium transition-colors text-white ${
                      isLight
                        ? "bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed"
                    }`}
                  >
                    {requestLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Send Request</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaregiverDashboard;
