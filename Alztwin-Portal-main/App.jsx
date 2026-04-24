import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { getUserRole, getUserData } from "./services/userService";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { DashboardPreview } from "./components/DashboardPreview";
import { Methodology } from "./components/Methodology";
import { Footer } from "./components/Footer";
import { AuthModal } from "./components/AuthModal";
import { InteractiveBrainModel } from "./components/InteractiveBrainModel";
import { Dashboard as ClinicianDashboard } from "./components/Dashboard";
import { PatientDashboard } from "./components/PatientDashboard";
import { CaregiverDashboard } from "./components/CaregiverDashboard";
import { ClinicianOnboardingForm } from "./components/ClinicianOnboardingForm";
import { ThemeProvider, useTheme } from "./components/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle";

function AppContent() {
  const { isLight } = useTheme();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Check if user has a role assigned
        try {
          const role = await getUserRole(currentUser.uid);

          if (role) {
            // User has a role, get full user data
            const data = await getUserData(currentUser.uid);
            setUserRole(role);
            setUserData(data);
            setIsAuthOpen(false);
            setShowOnboarding(false);
          } else {
            // New user, show clinician onboarding form
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          // If Firestore is offline/unavailable/permission denied, show role selector anyway
          if (
            error.code === "unavailable" ||
            error.message?.includes("offline") ||
            error.code === "permission-denied"
          ) {
            console.warn(
              "Firestore unavailable, showing onboarding form for new user"
            );
            setShowOnboarding(true);
          }
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserData(null);
        setShowOnboarding(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openLogin = () => {
    setAuthMode("login");
    setIsAuthOpen(true);
  };

  const openSignup = () => {
    setAuthMode("signup");
    setIsAuthOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      setUserData(null);
      setShowOnboarding(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleOnboardingComplete = async (role) => {
    // Role and profile have been saved to Firestore by ClinicianOnboardingForm
    setUserRole(role);
    setShowOnboarding(false);

    // Get updated user data
    try {
      const data = await getUserData(user.uid);
      setUserData(data);
    } catch (error) {
      console.error("Error getting user data:", error);
    }
  };

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <>
        <div
          className={`min-h-screen flex items-center justify-center ${
            isLight
              ? "bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_32%),linear-gradient(135deg,_#f8fafc_0%,_#eef6f2_45%,_#e6f1ed_100%)]"
              : "bg-slate-950"
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className={isLight ? "text-emerald-800" : "text-slate-400"}>Loading...</p>
          </div>
        </div>
        <ThemeToggle />
      </>
    );
  }

  // Show clinician onboarding form for new users
  if (user && showOnboarding) {
    return (
      <>
        <ClinicianOnboardingForm
          user={user}
          onComplete={handleOnboardingComplete}
        />
        <ThemeToggle />
      </>
    );
  }

  // Route to appropriate dashboard based on role
  if (user && userRole) {
    let dashboard = null;
    switch (userRole) {
      case "clinician":
        dashboard = <ClinicianDashboard user={user} onLogout={handleLogout} />;
        break;
      case "patient":
        dashboard = <PatientDashboard user={user} onLogout={handleLogout} />;
        break;
      case "caregiver":
        dashboard = <CaregiverDashboard user={user} onLogout={handleLogout} />;
        break;
      default:
        dashboard = <ClinicianDashboard user={user} onLogout={handleLogout} />;
        break;
    }

    return (
      <>
        {dashboard}
        <ThemeToggle />
      </>
    );
  }

  // Show landing page if not logged in
  return (
    <>
      <div
        className={`min-h-screen font-sans ${isLight ? "home-light" : ""} ${
          isLight
            ? "bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.16),_transparent_34%),radial-gradient(circle_at_80%_18%,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#fbfefd_0%,_#f3faf7_46%,_#ffffff_100%)] text-slate-950 selection:bg-emerald-800 selection:text-emerald-50"
            : "bg-midnight-900 text-slate-50 selection:bg-brand-500 selection:text-white"
        }`}
      >
        {isLight && (
          <style>{`
            .home-light section.bg-slate-950,
            .home-light section.bg-gradient-to-b.from-slate-950,
            .home-light .bg-slate-950,
            .home-light .bg-slate-950\\/50,
            .home-light .bg-slate-900,
            .home-light .bg-slate-900\\/95,
            .home-light .bg-slate-900\\/90,
            .home-light .bg-slate-900\\/80,
            .home-light .bg-slate-900\\/75,
            .home-light .bg-slate-900\\/70,
            .home-light .bg-slate-900\\/50,
            .home-light .bg-slate-800,
            .home-light .bg-slate-800\\/90,
            .home-light .bg-slate-800\\/80,
            .home-light .bg-slate-800\\/70,
            .home-light .bg-slate-800\\/60,
            .home-light .bg-slate-800\\/50,
            .home-light .bg-slate-800\\/30 {
              background: rgba(255, 255, 255, 0.94) !important;
            }

            .home-light section.bg-gradient-to-b.from-slate-950,
            .home-light .bg-gradient-to-b.from-slate-950,
            .home-light .bg-gradient-to-br.from-slate-900,
            .home-light .bg-gradient-to-br.from-slate-900\\/90,
            .home-light .bg-gradient-to-br.from-slate-800\\/80,
            .home-light .bg-gradient-to-b.from-slate-900\\/50 {
              background: linear-gradient(135deg, #ffffff 0%, #f0fdfa 52%, #eff6ff 100%) !important;
            }

            .home-light .border-slate-900,
            .home-light .border-slate-800,
            .home-light .border-slate-800\\/50,
            .home-light .border-slate-700,
            .home-light .border-slate-700\\/80,
            .home-light .border-slate-700\\/50,
            .home-light .border-slate-700\\/30,
            .home-light .border-slate-600,
            .home-light .border-slate-600\\/50 {
              border-color: #e2e8f0 !important;
            }

            .home-light .text-white,
            .home-light .text-slate-50,
            .home-light .text-slate-100,
            .home-light .text-slate-200,
            .home-light .text-slate-300 {
              color: #0f172a !important;
            }

            .home-light .text-slate-400 {
              color: #475569 !important;
            }

            .home-light .text-slate-500,
            .home-light .text-slate-600 {
              color: #64748b !important;
            }

            .home-light .text-blue-400,
            .home-light .text-cyan-300,
            .home-light .text-cyan-400 {
              color: #0891b2 !important;
            }

            .home-light .text-emerald-300,
            .home-light .text-emerald-400,
            .home-light .text-green-400 {
              color: #059669 !important;
            }

            .home-light .text-purple-400 {
              color: #7c3aed !important;
            }

            .home-light .text-orange-400,
            .home-light .text-yellow-400 {
              color: #d97706 !important;
            }

            .home-light .bg-blue-600,
            .home-light .bg-cyan-600 {
              background: linear-gradient(135deg, #0f766e, #0e7490) !important;
              color: #ffffff !important;
            }

            .home-light button.bg-blue-600,
            .home-light button.bg-cyan-600,
            .home-light button[class*="from-blue"],
            .home-light button[class*="from-green"],
            .home-light button[class*="from-emerald"],
            .home-light a[class*="from-blue"],
            .home-light a[class*="from-green"],
            .home-light a[class*="from-emerald"] {
              color: #ffffff !important;
              text-shadow: 0 1px 1px rgba(15, 23, 42, 0.22);
            }

            .home-light button.bg-blue-600 *,
            .home-light button.bg-cyan-600 *,
            .home-light button[class*="from-blue"] *,
            .home-light button[class*="from-green"] *,
            .home-light button[class*="from-emerald"] *,
            .home-light a[class*="from-blue"] *,
            .home-light a[class*="from-green"] *,
            .home-light a[class*="from-emerald"] * {
              color: #ffffff !important;
            }

            .home-light .bg-slate-700,
            .home-light .bg-slate-700\\/50 {
              background: #f1f5f9 !important;
            }

            .home-light .bg-blue-600\\/20,
            .home-light .bg-blue-500\\/20,
            .home-light .bg-cyan-500\\/10,
            .home-light .bg-cyan-500\\/20 {
              background: #ecfeff !important;
            }

            .home-light .bg-emerald-500\\/10,
            .home-light .bg-emerald-500\\/20,
            .home-light .bg-green-500\\/10,
            .home-light .bg-green-500\\/20 {
              background: #ecfdf5 !important;
            }

            .home-light .bg-purple-500\\/10,
            .home-light .bg-purple-500\\/20 {
              background: #f5f3ff !important;
            }

            .home-light .bg-red-500\\/10,
            .home-light .bg-red-500\\/20 {
              background: #fef2f2 !important;
            }

            .home-light .inline-flex.rounded-full,
            .home-light span.rounded-full,
            .home-light .rounded-full[class*="border"] {
              border-color: rgba(15, 118, 110, 0.22) !important;
            }

            .home-light .inline-flex.rounded-full:not([class*="bg-gradient"]),
            .home-light span.rounded-full:not([class*="bg-gradient"]) {
              background: rgba(236, 253, 245, 0.92) !important;
              color: #065f46 !important;
            }

            .home-light .font-bold.bg-gradient-to-r.bg-clip-text,
            .home-light .bg-clip-text.text-transparent {
              filter: saturate(1.15) contrast(1.1);
            }

            .home-light h1,
            .home-light h2,
            .home-light h3 {
              text-wrap: balance;
            }

            .home-light h1 .text-transparent,
            .home-light h2 .text-transparent {
              text-shadow: 0 0 0 rgba(15, 23, 42, 0);
            }

            .home-light p span.font-medium,
            .home-light p span.font-semibold,
            .home-light .font-semibold.text-emerald-400,
            .home-light .font-semibold.text-blue-400,
            .home-light .font-semibold.text-indigo-400 {
              color: #0f766e !important;
              background: linear-gradient(180deg, transparent 56%, rgba(16, 185, 129, 0.18) 56%);
              border-radius: 0.2rem;
              padding: 0 0.08rem;
            }

            .home-light .home-highlight-block {
              display: inline;
              box-decoration-break: clone;
              -webkit-box-decoration-break: clone;
              background: #006b46 !important;
              color: #ffffff !important;
              padding: 0.02em 0.14em 0.08em;
              line-height: 1.08;
              text-shadow: none !important;
            }

            .home-light .home-highlight-hero {
              display: inline-block !important;
              margin-top: 0.26em;
              padding: 0.01em 0.16em 0.09em;
            }

            .home-light .home-highlight-block * {
              color: #ffffff !important;
            }

            .home-light .home-inline-highlight {
              color: #047857 !important;
              background: #ccfbf1 !important;
              border-radius: 0.2rem;
              padding: 0.02rem 0.18rem;
              font-weight: 700;
            }

            .home-light .home-section-kicker {
              background: #ecfeff !important;
              color: #006b46 !important;
              border-color: #99f6e4 !important;
              box-shadow: 0 10px 24px rgba(15, 118, 110, 0.12);
            }

            .home-light .text-xs.font-semibold.uppercase,
            .home-light .text-xs.font-bold.uppercase,
            .home-light .text-\\[10px\\].font-bold.uppercase {
              letter-spacing: 0.08em;
            }

            .home-light .text-xs.font-semibold.text-emerald-400,
            .home-light .text-xs.font-semibold.text-blue-400,
            .home-light .text-xs.font-bold.text-blue-300,
            .home-light .text-xs.font-bold.text-emerald-400 {
              color: #065f46 !important;
            }

            .home-light .shadow-2xl,
            .home-light .shadow-xl,
            .home-light .shadow-lg,
            .home-light .shadow-blue-500\\/20,
            .home-light .shadow-cyan-500\\/20 {
              box-shadow: 0 22px 55px rgba(15, 23, 42, 0.09) !important;
            }

            .home-light .rounded-3xl,
            .home-light .rounded-2xl,
            .home-light .rounded-xl {
              box-shadow: 0 16px 42px rgba(15, 23, 42, 0.055);
            }

            .home-light .backdrop-blur-xl,
            .home-light .backdrop-blur-sm {
              backdrop-filter: blur(18px);
            }

            .home-light .bg-grid-slate-900 {
              background-image:
                linear-gradient(rgba(15,23,42,0.045) 1px, transparent 1px),
                linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px) !important;
              background-size: 42px 42px !important;
            }

            .home-light input,
            .home-light select,
            .home-light textarea {
              background: #ffffff !important;
              color: #0f172a !important;
              border-color: #cbd5e1 !important;
            }

            .home-light button.bg-slate-800,
            .home-light button.bg-slate-900,
            .home-light a.bg-slate-800,
            .home-light label.bg-slate-800 {
              background: #f8fafc !important;
              color: #334155 !important;
              border-color: #cbd5e1 !important;
            }

            .home-light button.bg-slate-800:hover,
            .home-light button.bg-slate-900:hover,
            .home-light a.bg-slate-800:hover,
            .home-light label.bg-slate-800:hover {
              background: #ecfdf5 !important;
              color: #047857 !important;
              border-color: #6ee7b7 !important;
            }

            .home-light .border-red-500\\/20,
            .home-light .border-red-500\\/30,
            .home-light .border-red-500\\/40 {
              border-color: #fecaca !important;
            }

            .home-light .text-red-400 {
              color: #b91c1c !important;
            }

            .home-light .text-indigo-400 {
              color: #4f46e5 !important;
            }

            .home-light .bg-indigo-500\\/20,
            .home-light .bg-indigo-500\\/10 {
              background: #eef2ff !important;
            }

            .home-light .border-indigo-500\\/20,
            .home-light .border-indigo-500\\/40 {
              border-color: #c7d2fe !important;
            }

            .home-light .home-preserve-white,
            .home-light .bg-blue-600 .text-white,
            .home-light .bg-cyan-600 .text-white,
            .home-light .bg-gradient-to-r.text-white,
            .home-light button[class*="from-"] {
              color: #ffffff !important;
            }
          `}</style>
        )}
        <Header onLogin={openLogin} onSignup={openSignup} />
        <main>
          <Hero onSignup={openSignup} />
          <InteractiveBrainModel />
          <Features />
          <DashboardPreview />
          <Methodology />
        </main>
        <Footer />

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          initialMode={authMode}
        />
      </div>
      <ThemeToggle />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
