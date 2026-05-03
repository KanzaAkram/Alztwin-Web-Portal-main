import React, { useState } from "react";
import { useTheme } from "./ThemeContext";
import {
  Bell,
  Settings,
  LogOut,
  Heart,
  Brain,
  Activity,
  TrendingUp,
  Calendar,
  MoreVertical,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export const PatientDashboard = ({ user, onLogout }) => {
  const { isLight } = useTheme();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Mock patient health data
  const healthData = {
    riskLevel: "low",
    riskScore: 25,
    lastAssessment: "2024-12-10",
    cognitiveScore: 92,
    moodScore: 85,
    sleepScore: 78,
    activityLevel: "moderate",
  };

  const assessments = [
    {
      date: "2024-12-10",
      type: "Cognitive Assessment",
      score: 92,
      status: "normal",
    },
    {
      date: "2024-12-03",
      type: "Physical Activity",
      score: 78,
      status: "good",
    },
    {
      date: "2024-11-26",
      type: "Sleep Quality",
      score: 68,
      status: "needs-improvement",
    },
    { date: "2024-11-19", type: "Mood Assessment", score: 85, status: "good" },
  ];

  const medications = [
    {
      name: "Donepezil",
      dosage: "5mg",
      frequency: "Once daily",
      status: "active",
    },
    {
      name: "Vitamin D",
      dosage: "1000IU",
      frequency: "Once daily",
      status: "active",
    },
    {
      name: "Omega-3",
      dosage: "500mg",
      frequency: "Once daily",
      status: "active",
    },
  ];

  const card = isLight
    ? "bg-[#eaf7f4] border border-gray-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md transition-all"
    : "bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors";

  return (
    <div className={`min-h-screen ${isLight ? "bg-[linear-gradient(180deg,#e8f6f3_0%,#e5f4f7_52%,#e8f0fb_100%)]" : "bg-gradient-to-br from-slate-950 to-slate-900"}`}>
      {/* Navigation */}
      <nav className={`border-b backdrop-blur-sm sticky top-0 z-50 ${isLight ? "bg-[#e8f6f3]/90 border-gray-200 shadow-sm" : "bg-slate-900/80 border-slate-800"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src="/logo.jpeg" alt="AlzTwin" className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <p className={`text-sm ${isLight ? "text-gray-500" : "text-slate-400"}`}>Patient Portal</p>
                <p className={`font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>AlzTwin</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className={`p-2 rounded-lg transition-colors relative ${isLight ? "text-gray-500 hover:text-gray-900 hover:bg-[#dff3ee]" : "text-slate-400 hover:text-white"}`}>
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
              </button>
              <button className={`p-2 rounded-lg transition-colors ${isLight ? "text-gray-500 hover:text-gray-900 hover:bg-[#dff3ee]" : "text-slate-400 hover:text-white"}`}>
                <Settings size={20} />
              </button>
              <div className={`h-6 w-px ${isLight ? "bg-gray-200" : "bg-slate-700"}`}></div>
              <button onClick={onLogout} className="flex items-center space-x-2 px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut size={18} />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isLight ? "text-gray-900" : "text-white"}`}>
            Welcome back, {user?.displayName?.split(" ")[0]}! 👋
          </h1>
          <p className={isLight ? "text-gray-500" : "text-slate-400"}>Your health summary and activity tracking</p>
        </div>

        {/* Health Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Cognitive Health", value: `${healthData.cognitiveScore}%`, icon: Brain,     iconCls: "text-blue-500",   status: "✓ Excellent", statusCls: "text-green-600" },
            { label: "Mood",             value: `${healthData.moodScore}%`,      icon: Heart,     iconCls: "text-red-500",    status: "✓ Good",      statusCls: "text-green-600" },
            { label: "Sleep Quality",    value: `${healthData.sleepScore}%`,     icon: Activity,  iconCls: "text-purple-500", status: "⚠ Fair",      statusCls: "text-amber-600" },
            { label: "Risk Level",       value: `${healthData.riskScore}%`,      icon: TrendingUp,iconCls: "text-emerald-600",status: "✓ Low",       statusCls: "text-green-600" },
          ].map(({ label, value, icon: Icon, iconCls, status, statusCls }) => (
            <div key={label} className={card}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm ${isLight ? "text-gray-500" : "text-slate-400"}`}>{label}</p>
                <Icon size={20} className={iconCls} />
              </div>
              <p className={`text-3xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>{value}</p>
              <p className={`text-xs mt-2 font-medium ${statusCls}`}>{status}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assessments */}
          <div className={`lg:col-span-2 rounded-xl overflow-hidden border ${isLight ? "bg-[#eaf7f4] border-gray-200" : "bg-slate-800/50 border-slate-700"}`}>
            <div className={`p-6 border-b ${isLight ? "border-gray-100" : "border-slate-700"}`}>
              <h2 className={`text-lg font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>Recent Assessments</h2>
            </div>
            <div className={`divide-y ${isLight ? "divide-gray-100" : "divide-slate-700"}`}>
              {assessments.map((assessment, idx) => (
                <div key={idx} className={`p-4 transition-colors flex items-center justify-between ${isLight ? "hover:bg-[#dff3ee]" : "hover:bg-slate-700/30"}`}>
                  <div className="flex-1">
                    <p className={`font-medium ${isLight ? "text-gray-900" : "text-white"}`}>{assessment.type}</p>
                    <p className={`text-sm ${isLight ? "text-gray-500" : "text-slate-400"}`}>{assessment.date}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${isLight ? "text-gray-900" : "text-white"}`}>{assessment.score}%</p>
                      <p className={`text-xs capitalize ${isLight ? "text-gray-500" : "text-slate-400"}`}>{assessment.status.replace("-", " ")}</p>
                    </div>
                    <ChevronRight size={20} className={isLight ? "text-gray-400" : "text-slate-500"} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medications */}
          <div className={`rounded-xl overflow-hidden border ${isLight ? "bg-[#eaf7f4] border-gray-200" : "bg-slate-800/50 border-slate-700"}`}>
            <div className={`p-6 border-b ${isLight ? "border-gray-100" : "border-slate-700"}`}>
              <h2 className={`text-lg font-semibold ${isLight ? "text-gray-900" : "text-white"}`}>Current Medications</h2>
            </div>
            <div className={`divide-y ${isLight ? "divide-gray-100" : "divide-slate-700"}`}>
              {medications.map((med, idx) => (
                <div key={idx} className={`p-4 transition-colors ${isLight ? "hover:bg-[#dff3ee]" : "hover:bg-slate-700/30"}`}>
                  <p className={`font-medium text-sm ${isLight ? "text-gray-900" : "text-white"}`}>{med.name}</p>
                  <p className={`text-xs mt-1 ${isLight ? "text-gray-600" : "text-slate-400"}`}>{med.dosage}</p>
                  <p className={`text-xs mt-1 ${isLight ? "text-gray-500" : "text-slate-500"}`}>{med.frequency}</p>
                  <div className="mt-2 inline-block px-2 py-1 bg-emerald-700 text-white rounded text-xs font-medium">Active</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alert */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle size={20} className="text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-yellow-500 font-medium">Sleep Quality Declining</p>
            <p className="text-sm text-yellow-600/80 mt-1">Your sleep quality has declined. Please consult with your care team for recommendations.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
