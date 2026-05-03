import React from "react";
import { Search, Bell, Settings } from "lucide-react";
import { useTheme } from "../ThemeContext";

export default function DashboardTopBar({ searchQuery, onSearchChange, pendingRequestsCount = 0 }) {
  const { isLight } = useTheme();

  return (
    <nav className={`border-b backdrop-blur-sm sticky top-0 z-50 ${
      isLight ? "bg-[#e8f6f3]/88 border-slate-200 shadow-[0_12px_30px_rgba(15,23,42,0.05)]" : "bg-slate-900/80 border-slate-800"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? "text-slate-400" : "text-slate-400"}`} />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none transition-all ${
                  isLight
                    ? "bg-[#f0faf7]/95 border border-slate-300 text-slate-950 placeholder-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    : "bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:border-blue-500"
                }`}
              />
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button className={`relative p-2 rounded-lg transition-colors ${
              isLight ? "text-slate-500 hover:text-slate-950 hover:bg-[#dff3ee]" : "text-slate-400 hover:text-white"
            }`}>
              <Bell size={20} />
              {pendingRequestsCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            <button className={`p-2 rounded-lg transition-colors ${
              isLight ? "text-slate-500 hover:text-slate-950 hover:bg-[#dff3ee]" : "text-slate-400 hover:text-white"
            }`}>
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
