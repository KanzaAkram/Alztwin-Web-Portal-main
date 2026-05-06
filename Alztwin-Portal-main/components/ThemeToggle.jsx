import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";

export function ThemeToggle() {
  const { isLight, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`fixed top-6 right-6 z-[120] inline-flex h-11 w-11 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
        isLight
          ? "bg-emerald-900 text-emerald-100 border border-emerald-700 hover:bg-emerald-800 shadow-emerald-900/30"
          : "bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-md shadow-black/30"
      }`}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      {isLight ? <Moon size={18} /> : <Sun size={18} className="text-yellow-300" />}
    </button>
  );
}
