import React, { useState } from "react";
import {
  Users,
  Smartphone,
  Stethoscope,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { createUserRecord } from "../services/userService";

/**
 * Component shown on first login to let user select their portal type
 */
export const RoleSelector = ({ user, onRoleSelected, isLoading }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const roles = [
    {
      id: "clinician",
      title: "Clinician Portal",
      description:
        "Healthcare provider access to patient management and analytics",
      icon: Stethoscope,
      color: "from-blue-500 to-blue-600",
      borderColor: "border-blue-500/50",
    },
    {
      id: "patient",
      title: "Patient App",
      description: "Mobile app for patients to track their health data",
      icon: Smartphone,
      color: "from-green-500 to-green-600",
      borderColor: "border-green-500/50",
    },
    {
      id: "caregiver",
      title: "Caregiver App",
      description: "Mobile app for caregivers to monitor patient progress",
      icon: Users,
      color: "from-purple-500 to-purple-600",
      borderColor: "border-purple-500/50",
    },
  ];

  const handleSelectRole = async (roleId) => {
    setSelectedRole(roleId);
    setIsSubmitting(true);
    setError("");

    try {
      // Save user role to Firestore
      await createUserRecord(user.uid, roleId, {
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
      });

      // Call parent callback with the selected role
      onRoleSelected(roleId);
    } catch (err) {
      console.error("Error setting user role:", err);
      // Even if Firestore is offline, allow user to proceed
      if (err.code === "unavailable" || err.message?.includes("offline")) {
        console.warn("Firestore offline, allowing user to proceed anyway");
        // Still proceed with the role
        onRoleSelected(roleId);
      } else {
        setError("Failed to set role. Please try again.");
        setIsSubmitting(false);
        setSelectedRole(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <img
              src="/logo.jpeg"
              alt="AlzTwin"
              className="w-12 h-12 rounded-lg object-cover"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Welcome to AlzTwin
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Select your portal type to get started.{" "}
            {user?.displayName && `Hello ${user.displayName}!`}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-8 text-center">
            {error}
          </div>
        )}

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => {
            const IconComponent = role.icon;
            const isSelected = selectedRole === role.id;
            const isDisabled = isSubmitting && selectedRole !== role.id;

            return (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role.id)}
                disabled={isSubmitting || isLoading}
                className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? `border-white bg-slate-900 shadow-2xl`
                    : `${role.borderColor} bg-slate-900/50 hover:bg-slate-900 hover:border-white`
                }`}
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${role.color} transition-opacity`}
                ></div>

                {/* Content */}
                <div className="relative p-8 h-full flex flex-col">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                      isSelected
                        ? `bg-gradient-to-br ${role.color} text-white`
                        : `bg-slate-800 text-slate-400 group-hover:text-white`
                    }`}
                  >
                    <IconComponent size={24} />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-2 text-left">
                    {role.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-400 text-left flex-grow mb-4">
                    {role.description}
                  </p>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="flex items-center space-x-2 text-white text-sm font-medium">
                      <span>Selected</span>
                      {isSubmitting && (
                        <Loader2 size={16} className="animate-spin" />
                      )}
                    </div>
                  )}

                  {!isSelected && !isSubmitting && (
                    <div className="text-slate-400 group-hover:text-white transition-colors">
                      <ArrowRight size={20} className="ml-auto" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-3">Portal Overview</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-400">
            <div>
              <p className="font-medium text-blue-400 mb-1">Clinician Portal</p>
              <p>
                Web-based platform for healthcare providers to manage and
                analyze patient data.
              </p>
            </div>
            <div>
              <p className="font-medium text-green-400 mb-1">Patient App</p>
              <p>
                Mobile application for patients to view their health metrics and
                reports.
              </p>
            </div>
            <div>
              <p className="font-medium text-purple-400 mb-1">Caregiver App</p>
              <p>
                Mobile application for caregivers to monitor and support patient
                care.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          You can change your portal type later in your account settings.
        </p>
      </div>
    </div>
  );
};

export default RoleSelector;
