import React, { useState, useEffect } from "react";
import { X, Mail, Lock, User, Building, ArrowRight, Loader2 } from "lucide-react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useTheme } from "./ThemeContext";

export const AuthModal = ({ isOpen, onClose, initialMode, onAuthSuccess }) => {
  const { isLight } = useTheme();
  const [mode, setMode] = useState(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [institution, setInstitution] = useState("");

  useEffect(() => {
    setMode(initialMode);
    setError(""); setEmail(""); setPassword(""); setFirstName(""); setLastName(""); setInstitution("");
  }, [initialMode, isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true); setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (onAuthSuccess) onAuthSuccess(result.user);
      onClose();
    } catch (err) { setError(getErrorMessage(err.code)); }
    finally { setIsGoogleLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setIsLoading(true); setError("");
    try {
      if (mode === "login") {
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (onAuthSuccess) onAuthSuccess(result.user);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: `${firstName} ${lastName}` });
        if (onAuthSuccess) onAuthSuccess(result.user);
      }
      onClose();
    } catch (err) { setError(getErrorMessage(err.code)); }
    finally { setIsLoading(false); }
  };

  const getErrorMessage = (code) => ({
    "auth/email-already-in-use": "This email is already registered. Please sign in instead.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/too-many-requests": "Too many failed attempts. Please try again later.",
  }[code] || "An error occurred. Please try again.");

  const inputCls = isLight
    ? "w-full bg-[#f0faf7] border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
    : "w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm";

  const labelCls = `text-xs font-medium ${isLight ? "text-gray-700" : "text-slate-400"}`;
  const iconCls = `absolute left-3 top-2.5 ${isLight ? "text-gray-400" : "text-slate-500"}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className={`absolute inset-0 backdrop-blur-sm ${isLight ? "bg-gray-900/60" : "bg-midnight-900/90"}`} onClick={onClose}></div>

      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up border ${
        isLight ? "bg-[#eaf7f4] border-gray-200" : "bg-slate-900 border-slate-700"
      }`}>
        <div className={`h-1 w-full bg-gradient-to-r ${isLight ? "from-emerald-500 to-teal-500" : "from-brand-500 to-indigo-500"}`}></div>

        <button onClick={onClose} className={`absolute top-4 right-4 transition-colors ${isLight ? "text-gray-400 hover:text-gray-700" : "text-slate-400 hover:text-white"}`}>
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className={`text-2xl font-bold mb-2 ${isLight ? "text-gray-900" : "text-white"}`}>
              {mode === "login" ? "Welcome Back" : "Join AlzTwin"}
            </h2>
            <p className={`text-sm ${isLight ? "text-gray-500" : "text-slate-400"}`}>
              {mode === "login" ? "Access your clinical dashboard" : "Start your digital twin journey today"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>}

            {/* Google */}
            <button type="button" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}
              className="w-full bg-[#edf8f5] hover:bg-[#dff3ee] text-gray-800 font-semibold py-3 rounded-lg transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 border border-gray-300 shadow-sm">
              {isGoogleLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isLight ? "border-gray-200" : "border-slate-700"}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-4 ${isLight ? "bg-[#eaf7f4] text-gray-500" : "bg-slate-900 text-slate-400"}`}>or continue with email</span>
              </div>
            </div>

            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>First Name</label>
                  <div className="relative">
                    <User className={iconCls} size={16} />
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} placeholder="Jane" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Last Name</label>
                  <div className="relative">
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} style={{ paddingLeft: "0.75rem" }} placeholder="Doe" required />
                  </div>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-1">
                <label className={labelCls}>Clinic / Institution</label>
                <div className="relative">
                  <Building className={iconCls} size={16} />
                  <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} className={inputCls} placeholder="General Hospital" required />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className={labelCls}>Email Address</label>
              <div className="relative">
                <Mail className={iconCls} size={16} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="doctor@clinic.com" required />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Password</label>
              <div className="relative">
                <Lock className={iconCls} size={16} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" required minLength={6} />
              </div>
            </div>

            <button type="submit" disabled={isLoading || isGoogleLoading}
              className={`w-full font-semibold py-3 rounded-lg mt-6 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-white ${
                isLight ? "bg-emerald-700 hover:bg-emerald-600 shadow-emerald-200" : "bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-brand-500/25"
              }`}>
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <><span>{mode === "login" ? "Sign In" : "Create Account"}</span><ArrowRight size={16} className="ml-2" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${isLight ? "text-gray-500" : "text-slate-400"}`}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className={`font-medium transition-colors ${isLight ? "text-emerald-700 hover:text-emerald-600" : "text-brand-400 hover:text-brand-300"}`}>
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
