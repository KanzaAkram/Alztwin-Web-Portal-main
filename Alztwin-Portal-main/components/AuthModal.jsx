import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Building,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { auth, googleProvider } from "../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

export const AuthModal = ({ isOpen, onClose, initialMode, onAuthSuccess }) => {
  const [mode, setMode] = useState(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [institution, setInstitution] = useState("");

  useEffect(() => {
    setMode(initialMode);
    // Reset form when modal opens
    setError("");
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setInstitution("");
  }, [initialMode, isOpen]);

  useEffect(() => {
    // Prevent scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("Google sign in successful:", user);
      if (onAuthSuccess) onAuthSuccess(user);
      onClose();
    } catch (error) {
      console.error("Google sign in error:", error);
      setError(getErrorMessage(error.code));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Email/Password Sign In or Sign Up
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (mode === "login") {
        // Sign in with email/password
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log("Email sign in successful:", result.user);
        if (onAuthSuccess) onAuthSuccess(result.user);
      } else {
        // Create new account
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        // Update profile with name
        await updateProfile(result.user, {
          displayName: `${firstName} ${lastName}`,
        });
        console.log("Account created:", result.user);
        if (onAuthSuccess) onAuthSuccess(result.user);
      }
      onClose();
    } catch (error) {
      console.error("Auth error:", error);
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  // Convert Firebase error codes to user-friendly messages
  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "This email is already registered. Please sign in instead.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/user-disabled":
        return "This account has been disabled.";
      case "auth/user-not-found":
        return "No account found with this email. Please sign up first.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/invalid-credential":
        return "Invalid email or password. Please check your credentials or sign up if you don't have an account.";
      case "auth/popup-closed-by-user":
        return "Sign-in was cancelled.";
      case "auth/cancelled-popup-request":
        return "Sign-in was cancelled.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      default:
        return "An error occurred. Please try again.";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-midnight-900/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Decorative top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-brand-500 to-indigo-500"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === "login" ? "Welcome Back" : "Join AlzTwin"}
            </h2>
            <p className="text-slate-400 text-sm">
              {mode === "login"
                ? "Access your clinical dashboard"
                : "Start your digital twin journey today"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 border border-gray-300"
            >
              {isGoogleLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900 text-slate-400">
                  or continue with email
                </span>
              </div>
            </div>

            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">
                    First Name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-2.5 text-slate-500"
                      size={16}
                    />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm"
                      placeholder="Jane"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">
                    Last Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">
                  Clinic / Institution
                </label>
                <div className="relative">
                  <Building
                    className="absolute left-3 top-2.5 text-slate-500"
                    size={16}
                  />
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm"
                    placeholder="General Hospital"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-2.5 text-slate-500"
                  size={16}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm"
                  placeholder="doctor@clinic.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-2.5 text-slate-500"
                  size={16}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-lg mt-6 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-500/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              {mode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
