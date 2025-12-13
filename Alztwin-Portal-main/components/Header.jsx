import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export const Header = ({ onLogin, onSignup }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 border-b ${
        isScrolled
          ? "bg-slate-950/90 backdrop-blur-md border-slate-800 py-3"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => window.scrollTo(0, 0)}
          >
            <img
              src="/logo.jpeg"
              alt="AlzTwin"
              className="w-10 h-10 rounded-lg object-cover shadow-lg"
            />
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-white leading-none">
                AlzTwin
              </span>
              <span className="text-[10px] font-medium text-blue-400 uppercase tracking-widest leading-none mt-1">
                Clinician Portal
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-slate-300 hover:text-white font-medium transition-colors text-sm hover:underline decoration-blue-500 underline-offset-4"
            >
              Features
            </a>
            <a
              href="#analytics"
              className="text-slate-300 hover:text-white font-medium transition-colors text-sm hover:underline decoration-blue-500 underline-offset-4"
            >
              Analytics
            </a>
            <a
              href="#methodology"
              className="text-slate-300 hover:text-white font-medium transition-colors text-sm hover:underline decoration-blue-500 underline-offset-4"
            >
              Methodology
            </a>

            <div className="h-6 w-px bg-slate-800"></div>

            <button
              onClick={onLogin}
              className="text-slate-300 font-medium hover:text-white transition-colors text-sm"
            >
              Log In
            </button>
            <button
              onClick={onSignup}
              className="bg-white text-slate-900 px-5 py-2.5 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-lg shadow-white/5 text-sm border border-transparent hover:border-blue-200"
            >
              Request Access
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-2"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 absolute w-full shadow-2xl animate-fade-in">
          <div className="px-4 pt-4 pb-8 space-y-4">
            <a
              href="#features"
              className="block text-slate-300 hover:text-white font-medium py-2 border-b border-slate-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#analytics"
              className="block text-slate-300 hover:text-white font-medium py-2 border-b border-slate-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Analytics
            </a>
            <a
              href="#methodology"
              className="block text-slate-300 hover:text-white font-medium py-2 border-b border-slate-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Methodology
            </a>
            <div className="pt-4 flex flex-col space-y-3">
              <button
                onClick={() => {
                  onLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-center text-slate-300 hover:text-white font-medium py-3 rounded-lg hover:bg-slate-900"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  onSignup();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-blue-600 text-white px-5 py-3 rounded-lg font-bold shadow-lg shadow-blue-900/50"
              >
                Request Clinical Access
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
