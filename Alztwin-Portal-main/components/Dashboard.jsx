import React, { useState } from "react";
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
} from "lucide-react";

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

  const filteredPatients = DEMO_PATIENTS.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" || patient.riskLevel === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalPatients: DEMO_PATIENTS.length,
    highRisk: DEMO_PATIENTS.filter((p) => p.riskLevel === "high").length,
    scansThisWeek: 4,
    avgRiskScore: Math.round(
      DEMO_PATIENTS.reduce((acc, p) => acc + p.riskScore, 0) /
        DEMO_PATIENTS.length
    ),
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Navigation */}
      <nav className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img
                src="/logo.jpeg"
                alt="AlzTwin"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <span className="text-xl font-bold text-white">AlzTwin</span>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
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
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <Settings size={20} />
              </button>
              <div className="h-6 w-px bg-slate-700"></div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.displayName?.charAt(0) ||
                    user?.email?.charAt(0) ||
                    "U"}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white">
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
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
            Welcome back, {user?.displayName?.split(" ")[0] || "Doctor"}! 👋
          </h1>
          <p className="text-slate-400">
            Here's an overview of your patients and recent activity.
          </p>
        </div>

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
            <p className="text-2xl font-bold text-white">{stats.highRisk}</p>
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
                            {patient.id} • {patient.age}y • {patient.gender}
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
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="View Details"
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
              Showing {filteredPatients.length} of {DEMO_PATIENTS.length}{" "}
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
      </main>
    </div>
  );
};

export default Dashboard;
