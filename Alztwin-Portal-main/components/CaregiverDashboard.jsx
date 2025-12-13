import React, { useState } from "react";
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
} from "lucide-react";

export const CaregiverDashboard = ({ user, onLogout }) => {
  const [selectedPatient, setSelectedPatient] = useState(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.jpeg"
                alt="AlzTwin"
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div>
                <p className="text-sm text-slate-400">Caregiver App</p>
                <p className="text-white font-semibold">AlzTwin</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {user?.displayName?.split(" ")[0]}! 👋
          </h1>
          <p className="text-slate-400">
            Monitor and support your loved ones' health journey
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patients List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Your Patients
              </h2>
              <span className="text-sm text-slate-400">
                {patients.length} people
              </span>
            </div>

            {patients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient.id)}
                className={`bg-slate-800/50 border rounded-xl p-5 cursor-pointer transition-all hover:border-slate-600 ${
                  selectedPatient === patient.id
                    ? "border-blue-500 bg-slate-800"
                    : "border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-medium">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {patient.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {patient.relationship}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <button className="p-2 text-slate-400 hover:text-white transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Risk Level</p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(
                        patient.riskLevel
                      )}`}
                    >
                      {patient.riskScore}%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    <p className="text-sm text-slate-300 capitalize">
                      {patient.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Last Check</p>
                    <p className="text-sm text-slate-300">
                      {patient.lastCheck}
                    </p>
                  </div>
                </div>

                {patient.alertsCount > 0 && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
                    <AlertCircle size={16} className="text-red-400" />
                    <span className="text-xs text-red-400">
                      {patient.alertsCount} alert
                      {patient.alertsCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">
                Overview
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Patients</span>
                  <span className="text-2xl font-bold text-white">
                    {patients.length}
                  </span>
                </div>
                <div className="h-px bg-slate-700"></div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">High Risk</span>
                  <span className="text-2xl font-bold text-red-400">1</span>
                </div>
                <div className="h-px bg-slate-700"></div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Active Alerts</span>
                  <span className="text-2xl font-bold text-yellow-400">1</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentActivity.slice(0, 4).map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 pb-3 border-b border-slate-700 last:border-b-0 last:pb-0"
                    >
                      <IconComponent
                        size={16}
                        className="text-slate-400 mt-1 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 font-medium truncate">
                          {activity.patient}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {activity.action}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle
                  size={20}
                  className="text-red-400 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-red-400 font-semibold text-sm">
                    Emergency Contact
                  </p>
                  <p className="text-xs text-red-300/80 mt-1">
                    If patient shows concerning symptoms, call 911 or your local
                    emergency number.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaregiverDashboard;
