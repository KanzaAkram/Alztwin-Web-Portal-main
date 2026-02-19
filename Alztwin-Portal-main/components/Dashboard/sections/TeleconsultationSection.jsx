import React from "react";
import {
  Shield,
  Video,
  CalendarPlus,
  Search,
  Users,
  Calendar,
  Clock,
  Brain,
  Play,
  Plus,
  FileText,
  Star,
} from "lucide-react";

const TELECON_STATS = [
  { label: "Total Consultations", value: "156", icon: Video, color: "green" },
  { label: "This Week", value: "12", icon: Calendar, color: "blue" },
  { label: "Avg. Duration", value: "24 min", icon: Clock, color: "purple" },
  { label: "Satisfaction", value: "4.8/5", icon: Star, color: "yellow" },
];

const UPCOMING_SESSIONS = [
  {
    patient: "John Doe",
    time: "Today, 3:00 PM",
    type: "Follow-up",
    avatar: "JD",
  },
  {
    patient: "Sarah Wilson",
    time: "Tomorrow, 10:00 AM",
    type: "Initial",
    avatar: "SW",
  },
  {
    patient: "Michael Brown",
    time: "Dec 18, 2:30 PM",
    type: "Review",
    avatar: "MB",
  },
];

const CONSULTATION_HISTORY = [
  {
    patient: "John Doe",
    avatar: "JD",
    date: "Dec 15, 2:30 PM",
    duration: "25 min",
    type: "Follow-up",
    notes: "Discussed medication adjustment",
    status: "completed",
  },
  {
    patient: "Sarah Wilson",
    avatar: "SW",
    date: "Dec 14, 10:00 AM",
    duration: "18 min",
    type: "Emergency",
    notes: "Caregiver reported confusion",
    status: "completed",
  },
  {
    patient: "Michael Brown",
    avatar: "MB",
    date: "Dec 13, 3:15 PM",
    duration: "32 min",
    type: "Initial",
    notes: "First consultation, baseline established",
    status: "completed",
  },
  {
    patient: "Emma Davis",
    avatar: "ED",
    date: "Dec 12, 11:00 AM",
    duration: "28 min",
    type: "Review",
    notes: "Digital Twin analysis reviewed",
    status: "completed",
  },
];

export default function TeleconsultationSection({
  patients,
  onOpenScheduleModal,
  onSchedulePatient,
  onViewDigitalTwin,
  onStartCall,
}) {
  return (
    <div className="space-y-6">
      <div className="relative bg-gradient-to-r from-emerald-900/40 via-green-900/30 to-teal-900/40 border border-green-500/30 rounded-2xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(16,185,129,0.15),transparent_70%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="max-w-xl">
            <div className="flex items-center space-x-2 mb-3">
              <Shield size={18} className="text-green-400" />
              <span className="text-green-400 text-sm font-medium">
                HIPAA Compliant & Encrypted
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Secure Remote Consultations
            </h2>
            <p className="text-slate-300 mb-6">
              Connect with patients and caregivers through high-quality video
              consultations. Review Digital Twin data in real-time during calls
              for comprehensive care delivery.
            </p>
            <div className="flex items-center space-x-4">
              <button
                onClick={onOpenScheduleModal}
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TELECON_STATS.map((stat, idx) => (
          <div
            key={idx}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={20} className={`text-${stat.color}-400`} />
              <span
                className={`text-xs px-2 py-0.5 rounded bg-${stat.color}-500/20 text-${stat.color}-400`}
              >
                {idx === 1 ? "+3" : ""}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-slate-500 text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Users size={20} className="mr-2 text-blue-400" />
              Available Patients
            </h3>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search patients..."
                className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
          <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors group"
              >
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
                    <p className="text-white font-medium group-hover:text-green-400 transition-colors">
                      {patient.name}
                    </p>
                    <p className="text-slate-400 text-sm">{patient.diagnosis}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          patient.riskLevel === "high"
                            ? "bg-red-500/20 text-red-400"
                            : patient.riskLevel === "medium"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {patient.riskLevel?.toUpperCase()} RISK
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        Last: {patient.lastScan}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      onSchedulePatient(patient);
                      onOpenScheduleModal();
                    }}
                    className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
                    title="Schedule"
                  >
                    <Calendar size={16} />
                  </button>
                  <button
                    onClick={() => onViewDigitalTwin(patient)}
                    className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all"
                    title="View Digital Twin"
                  >
                    <Brain size={16} />
                  </button>
                  <button
                    onClick={() => onStartCall(patient)}
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

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <CalendarPlus size={20} className="mr-2 text-green-400" />
              Upcoming Sessions
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {UPCOMING_SESSIONS.map((apt, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-green-500/30 transition-colors"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                    {apt.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">
                      {apt.patient}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {apt.type} Consultation
                    </p>
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
              onClick={onOpenScheduleModal}
              className="w-full p-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-green-400 hover:border-green-500/50 transition-all flex items-center justify-center space-x-2"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">Schedule New</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Clock size={20} className="mr-2 text-purple-400" />
            Consultation History
          </h3>
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View All
          </button>
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
              {CONSULTATION_HISTORY.map((consultation, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {consultation.avatar}
                      </div>
                      <span className="text-white font-medium">
                        {consultation.patient}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-sm">
                    {consultation.date}
                  </td>
                  <td className="px-5 py-4 text-slate-300 text-sm">
                    {consultation.duration}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        consultation.type === "Emergency"
                          ? "bg-red-500/20 text-red-400"
                          : consultation.type === "Initial"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {consultation.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-sm max-w-xs truncate">
                    {consultation.notes}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
                        title="View Notes"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
                        title="View Recording"
                      >
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-xl p-5">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3">
            <Brain size={20} className="text-blue-400" />
          </div>
          <h4 className="text-white font-semibold mb-2">
            Digital Twin Integration
          </h4>
          <p className="text-slate-400 text-sm">
            Access patient's Digital Twin data directly during consultations for
            comprehensive insights.
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-xl p-5">
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center mb-3">
            <Shield size={20} className="text-green-400" />
          </div>
          <h4 className="text-white font-semibold mb-2">
            End-to-End Encryption
          </h4>
          <p className="text-slate-400 text-sm">
            All video consultations are encrypted and comply with HIPAA
            regulations.
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-xl p-5">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mb-3">
            <FileText size={20} className="text-purple-400" />
          </div>
          <h4 className="text-white font-semibold mb-2">Auto Documentation</h4>
          <p className="text-slate-400 text-sm">
            Consultation notes and recordings are automatically saved for
            future reference.
          </p>
        </div>
      </div>
    </div>
  );
}
