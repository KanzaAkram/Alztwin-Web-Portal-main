import React from "react";
import { Users, Brain, Video, UserPlus, LogOut, BarChart3 } from "lucide-react";
import { useTheme } from "../ThemeContext";

const navItems = [
  { id: "patients",        label: "My Patients",       icon: Users     },
  { id: "cognitiveTests",  label: "Cognitive Tests",   icon: BarChart3 },
  { id: "digitalTwin",     label: "Digital Twin",      icon: Brain     },
  { id: "teleconsultation",label: "Teleconsultation",  icon: Video     },
  { id: "requests",        label: "Patient Requests",  icon: UserPlus  },
];

export default function DashboardSidebar({ user, onLogout, activeSection, setActiveSection, pendingRequestsCount = 0 }) {
  const { isLight } = useTheme();

  return (
    <aside className={`w-64 fixed h-full z-20 border-r ${
      isLight ? "bg-[linear-gradient(180deg,#fbfdfc_0%,#f1f6f3_100%)] border-slate-200 shadow-[8px_0_30px_rgba(15,23,42,0.05)]" : "bg-slate-900 border-slate-800"
    }`}>
      {/* Logo */}
      <div className={`p-4 border-b ${isLight ? "border-slate-200" : "border-slate-800"}`}>
        <div className="flex items-center space-x-3">
          <img src="/logo.jpeg" alt="AlzTwin" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <span className={`block text-xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>AlzTwin</span>
            <span className={`block text-[10px] uppercase tracking-[0.22em] ${isLight ? "text-slate-500" : "text-slate-400"}`}>Clinician OS</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="p-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
              activeSection === id
                ? isLight
                  ? "bg-[linear-gradient(135deg,#0f766e,#115e59)] text-white shadow-[0_16px_28px_rgba(15,118,110,0.18)]"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : isLight
                  ? "text-slate-600 hover:bg-white/90 hover:text-slate-950 hover:shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Icon size={20} />
              <span className="font-medium text-sm">{label}</span>
            </div>
            {id === "requests" && pendingRequestsCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User Footer */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${isLight ? "border-slate-200 bg-white/40" : "border-slate-800"}`}>
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
            isLight ? "bg-[linear-gradient(135deg,#0f766e,#155e75)]" : "bg-gradient-to-br from-blue-500 to-purple-500"
          }`}>
            {user?.displayName?.charAt(0) || "D"}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${isLight ? "text-slate-950" : "text-white"}`}>
              {user?.displayName || "Clinician"}
            </p>
            <p className={`text-xs truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>{user?.email}</p>
          </div>
        </div>
        <button onClick={onLogout} className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isLight ? "text-rose-700 hover:text-rose-800 hover:bg-rose-50" : "text-red-500 hover:text-red-600 hover:bg-red-50"}`}>
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
