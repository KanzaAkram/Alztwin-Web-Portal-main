import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useTheme } from "./ThemeContext";

export const Header = ({ onLogin, onSignup }) => {
  const { isLight } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 border-b ${
        isScrolled
          ? isLight
            ? "bg-[#e8f6f3]/92 backdrop-blur-xl border-emerald-950/10 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
            : "bg-slate-950/90 backdrop-blur-md border-slate-800 py-3"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <img src="/logo.jpeg" alt="AlzTwin" className="w-10 h-10 rounded-lg object-cover shadow-lg" />
            <div className="flex flex-col">
              <span className={`text-2xl font-bold tracking-tight leading-none ${isLight ? "text-gray-900" : "text-white"}`}>
                AlzTwin
              </span>
              <span className={`text-[10px] font-medium uppercase tracking-widest leading-none mt-1 ${isLight ? "text-slate-600" : "text-blue-400"}`}>
                Clinician Portal
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {[["#features","Features"],["#analytics","Analytics"],["#methodology","Methodology"]].map(([href,label]) => (
              <a key={href} href={href} className={`font-medium transition-colors text-sm ${
                isLight
                  ? "text-slate-700 hover:text-emerald-800 underline-offset-4 decoration-emerald-600"
                  : "text-slate-300 hover:text-white underline-offset-4 decoration-blue-500"
              }`}>
                {label}
              </a>
            ))}

            <div className={`h-6 w-px ${isLight ? "bg-slate-300/80" : "bg-slate-800"}`}></div>

            <button onClick={onLogin} className={`font-medium transition-colors text-sm ${
              isLight ? "text-slate-700 hover:text-slate-950" : "text-slate-300 hover:text-white"
            }`}>
              Log In
            </button>

            <button onClick={onSignup} className={`px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg text-sm ${
              isLight
                ? "bg-[linear-gradient(135deg,#0f766e,#0f766e,#115e59)] text-white hover:brightness-110 shadow-[0_18px_35px_rgba(15,118,110,0.24)]"
                : "bg-white text-slate-900 hover:bg-blue-50 shadow-white/5 border border-transparent hover:border-blue-200"
            }`}>
              Request Access
            </button>
          </div>

          {/* Mobile Button */}
          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`p-2 ${isLight ? "text-gray-900" : "text-white"}`}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={`md:hidden border-b absolute w-full shadow-xl animate-fade-in ${
          isLight ? "bg-[#e8f6f3] border-emerald-950/10" : "bg-slate-950 border-slate-800"
        }`}>
          <div className="px-4 pt-4 pb-8 space-y-4">
            {[["#features","Features"],["#analytics","Analytics"],["#methodology","Methodology"]].map(([href,label]) => (
              <a key={href} href={href} className={`block font-medium py-2 border-b text-sm ${
                isLight ? "text-slate-700 hover:text-slate-950 border-slate-200/80" : "text-slate-300 hover:text-white border-slate-800"
              }`} onClick={() => setIsMobileMenuOpen(false)}>
                {label}
              </a>
            ))}
            <div className="pt-4 flex flex-col space-y-3">
              <button onClick={() => { onLogin(); setIsMobileMenuOpen(false); }} className={`w-full text-center font-medium py-3 rounded-lg text-sm ${
                isLight ? "text-slate-700 hover:text-slate-950 hover:bg-emerald-50" : "text-slate-300 hover:text-white hover:bg-slate-900"
              }`}>
                Log In
              </button>
              <button onClick={() => { onSignup(); setIsMobileMenuOpen(false); }} className={`w-full px-5 py-3 rounded-lg font-bold text-white ${
                isLight ? "bg-[linear-gradient(135deg,#0f766e,#115e59)] hover:brightness-110" : "bg-blue-600"
              }`}>
                Request Clinical Access
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
