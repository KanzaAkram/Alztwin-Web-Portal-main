import React from "react";
import { Users, Brain, Video, UserPlus, LogOut } from "lucide-react";

const navItems = [
  { id: "patients", label: "My Patients", icon: Users },
  { id: "digitalTwin", label: "Digital Twin", icon: Brain },
  { id: "teleconsultation", label: "Teleconsultation", icon: Video },
  { id: "requests", label: "Patient Requests", icon: UserPlus },
];

export default function DashboardSidebar({
  user,
  onLogout,
  activeSection,
  setActiveSection,
  pendingRequestsCount = 0,
}) {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 fixed h-full z-20">
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
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              activeSection === id
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </div>
            {id === "requests" && pendingRequestsCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
            {user?.displayName?.charAt(0) || "D"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.displayName || "Clinician"}
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
  );
}
