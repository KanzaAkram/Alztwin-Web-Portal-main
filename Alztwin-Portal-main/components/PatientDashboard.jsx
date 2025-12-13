import React, { useState } from "react";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.jpeg"
                alt="AlzTwin"
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div>
                <p className="text-sm text-slate-400">Patient Portal</p>
                <p className="text-white font-semibold">AlzTwin</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
              </button>
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <Settings size={20} />
              </button>
              <div className="h-6 w-px bg-slate-700"></div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.displayName?.split(" ")[0]}! 👋
          </h1>
          <p className="text-slate-400">
            Your health summary and activity tracking
          </p>
        </div>

        {/* Health Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">Cognitive Health</p>
              <Brain size={20} className="text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              {healthData.cognitiveScore}%
            </p>
            <p className="text-xs text-green-400 mt-2">✓ Excellent</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">Mood</p>
              <Heart size={20} className="text-red-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              {healthData.moodScore}%
            </p>
            <p className="text-xs text-green-400 mt-2">✓ Good</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">Sleep Quality</p>
              <Activity size={20} className="text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              {healthData.sleepScore}%
            </p>
            <p className="text-xs text-yellow-400 mt-2">⚠ Fair</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">Risk Level</p>
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              {healthData.riskScore}%
            </p>
            <p className="text-xs text-green-400 mt-2">✓ Low</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assessments */}
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                Recent Assessments
              </h2>
            </div>
            <div className="divide-y divide-slate-700">
              {assessments.map((assessment, idx) => (
                <div
                  key={idx}
                  className="p-4 hover:bg-slate-700/30 transition-colors flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{assessment.type}</p>
                    <p className="text-sm text-slate-400">{assessment.date}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {assessment.score}%
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        {assessment.status.replace("-", " ")}
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medications */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                Current Medications
              </h2>
            </div>
            <div className="divide-y divide-slate-700">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <p className="text-white font-medium text-sm">{med.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{med.dosage}</p>
                  <p className="text-xs text-slate-500 mt-1">{med.frequency}</p>
                  <div className="mt-2 inline-block px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">
                    Active
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alert */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start space-x-3">
          <AlertCircle
            size={20}
            className="text-yellow-500 mt-0.5 flex-shrink-0"
          />
          <div>
            <p className="text-yellow-400 font-medium">
              Sleep Quality Declining
            </p>
            <p className="text-sm text-yellow-300/80 mt-1">
              Your sleep quality has declined. Please consult with your care
              team for recommendations.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
