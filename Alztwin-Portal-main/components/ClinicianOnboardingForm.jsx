import React, { useState } from "react";
import {
  Stethoscope,
  Building2,
  BadgeCheck,
  GraduationCap,
  Phone,
  MapPin,
  ArrowRight,
  Loader2,
  User,
  Briefcase,
} from "lucide-react";
import {
  createUserRecord,
  createClinicianProfile,
} from "../services/userService";

/**
 * Clinician onboarding form shown after Google Auth
 * Collects clinician-specific details and stores in Firestore
 */
export const ClinicianOnboardingForm = ({ user, onComplete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  // Form fields
  const [formData, setFormData] = useState({
    fullName: user?.displayName || "",
    specialization: "",
    licenseNumber: "",
    hospital: "",
    department: "",
    yearsOfExperience: "",
    phone: "",
    address: "",
    qualifications: "",
  });

  const specializations = [
    "Neurology",
    "Geriatric Medicine",
    "Psychiatry",
    "Internal Medicine",
    "Family Medicine",
    "Neuropsychology",
    "Radiology",
    "General Practice",
    "Other",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      setError("Please enter your full name");
      return false;
    }
    if (!formData.specialization) {
      setError("Please select your specialization");
      return false;
    }
    if (!formData.licenseNumber.trim()) {
      setError("Please enter your medical license number");
      return false;
    }
    setError("");
    return true;
  };

  const validateStep2 = () => {
    if (!formData.hospital.trim()) {
      setError("Please enter your hospital/clinic name");
      return false;
    }
    if (!formData.department.trim()) {
      setError("Please enter your department");
      return false;
    }
    setError("");
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setError("");
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Create user record with clinician role (automatic)
      await createUserRecord(user.uid, "clinician", {
        email: user.email,
        displayName: formData.fullName,
        photoURL: user.photoURL || "",
      });

      // Create clinician profile with collected details
      await createClinicianProfile(user.uid, {
        fullName: formData.fullName,
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber,
        hospital: formData.hospital,
        department: formData.department,
        yearsOfExperience: formData.yearsOfExperience,
        phone: formData.phone,
        address: formData.address,
        qualifications: formData.qualifications,
        email: user.email,
      });

      // Call parent callback with clinician role
      onComplete("clinician");
    } catch (err) {
      console.error("Error saving clinician profile:", err);
      if (err.code === "unavailable" || err.message?.includes("offline")) {
        console.warn("Firestore offline, allowing user to proceed anyway");
        onComplete("clinician");
      } else {
        setError("Failed to save profile. Please try again.");
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
              <Stethoscope size={32} className="text-blue-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Welcome to AlzTwin
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              {user?.email && `Logged in as ${user.email}`}
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Complete your clinician profile to get started
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                  currentStep >= 1
                    ? "bg-blue-500 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                1
              </div>
              <div
                className={`w-16 h-1 rounded-full transition-all ${
                  currentStep >= 2 ? "bg-blue-500" : "bg-slate-700"
                }`}
              ></div>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                  currentStep >= 2
                    ? "bg-blue-500 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                2
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-center">
              {error}
            </div>
          )}

          {/* Form Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Decorative top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500"></div>

            <form onSubmit={handleSubmit} className="p-8">
              {/* Step 1: Personal & Professional Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <User size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Professional Information
                      </h2>
                      <p className="text-sm text-slate-400">
                        Tell us about your medical background
                      </p>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Dr. John Smith"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Specialization */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Specialization <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <GraduationCap
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <select
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Select your specialization</option>
                        {specializations.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* License Number */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Medical License Number{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <BadgeCheck
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        placeholder="e.g., PMC-12345"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Years of Experience */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Years of Experience
                    </label>
                    <div className="relative">
                      <Briefcase
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="number"
                        name="yearsOfExperience"
                        value={formData.yearsOfExperience}
                        onChange={handleInputChange}
                        placeholder="e.g., 10"
                        min="0"
                        max="60"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Qualifications */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Qualifications / Degrees
                    </label>
                    <div className="relative">
                      <GraduationCap
                        size={18}
                        className="absolute left-4 top-3 text-slate-400"
                      />
                      <textarea
                        name="qualifications"
                        value={formData.qualifications}
                        onChange={handleInputChange}
                        placeholder="e.g., MBBS, MD Neurology, Fellowship in Dementia Care"
                        rows={2}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3.5 rounded-xl font-semibold transition-all transform hover:scale-[1.02]"
                  >
                    <span>Continue</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {/* Step 2: Institution & Contact Info */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Building2 size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Institution & Contact
                      </h2>
                      <p className="text-sm text-slate-400">
                        Where do you practice?
                      </p>
                    </div>
                  </div>

                  {/* Hospital/Clinic */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Hospital / Clinic Name{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        name="hospital"
                        value={formData.hospital}
                        onChange={handleInputChange}
                        placeholder="e.g., City General Hospital"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Department <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Stethoscope
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        placeholder="e.g., Neurology Department"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <Phone
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g., +92 300 1234567"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Clinic/Office Address
                    </label>
                    <div className="relative">
                      <MapPin
                        size={18}
                        className="absolute left-4 top-3 text-slate-400"
                      />
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter your clinic/office address"
                        rows={2}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-semibold transition-all border border-slate-700"
                    >
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3.5 rounded-xl font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <span>Complete Setup</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pb-8">
            <p className="text-sm text-slate-500">
              Your information is secure and will only be used to provide you
              with the best clinical experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicianOnboardingForm;
