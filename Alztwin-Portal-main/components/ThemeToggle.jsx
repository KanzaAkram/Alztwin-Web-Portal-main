import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";

export function ThemeToggle() {
  const { isLight, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`fixed bottom-6 right-6 z-[120] inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-xl transition-all duration-300 ${
        isLight
          ? "bg-[#0f2f41] text-emerald-100 border border-[#265b73] hover:bg-[#133a4f]"
          : "bg-slate-900/95 text-cyan-200 border border-slate-700 hover:border-cyan-500/40"
      }`}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
      <span>{isLight ? "Dark" : "Light"} Mode</span>
    </button>
  );
}
