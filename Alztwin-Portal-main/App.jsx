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
              ? "bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-100"
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
        className={`min-h-screen font-sans ${
          isLight
            ? "bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-100 text-emerald-950 selection:bg-emerald-700 selection:text-emerald-50"
            : "bg-midnight-900 text-slate-50 selection:bg-brand-500 selection:text-white"
        }`}
      >
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
