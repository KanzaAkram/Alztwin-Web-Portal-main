import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

/**
 * User roles enum
 */
export const USER_ROLES = {
  CLINICIAN: "clinician",
  CAREGIVER: "caregiver",
  PATIENT: "patient",
};

/**
 * Get user role from Firestore (users collection)
 * @param {string} userId - Firebase user ID
 * @returns {Promise<string|null>} User role (clinician, caregiver, patient) or null
 */
export const getUserRole = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data().role || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting user role:", error);
    // Handle various error types
    if (error.code === "unavailable" || error.message?.includes("offline")) {
      console.warn("Firestore is offline. User will see role selector.");
      return null;
    }
    if (error.code === "permission-denied") {
      console.warn(
        "Permission denied. Firestore security rules may be restrictive."
      );
      return null; // Show role selector for new users
    }
    throw error;
  }
};

/**
 * Get full user data from Firestore (users collection)
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object|null>} Full user object or null
 */
export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    if (error.code === "unavailable" || error.message?.includes("offline")) {
      console.warn("Firestore is offline.");
      return null;
    }
    if (error.code === "permission-denied") {
      console.warn("Permission denied reading user data.");
      return null;
    }
    throw error;
  }
};

/**
 * Create new user record in Firestore (users collection)
 * @param {string} userId - Firebase user ID
 * @param {string} role - User role (clinician, caregiver, patient)
 * @param {Object} additionalData - Additional user information
 */
export const createUserRecord = async (userId, role, additionalData = {}) => {
  try {
    const userData = {
      uid: userId,
      role,
      email: additionalData.email || "",
      displayName: additionalData.displayName || "",
      photoURL: additionalData.photoURL || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      ...additionalData,
    };

    await setDoc(doc(db, "users", userId), userData, { merge: true });
    return userData;
  } catch (error) {
    console.error("Error creating user record:", error);
    // If offline or permission denied, return the userData object anyway (it will sync when online)
    if (
      error.code === "unavailable" ||
      error.message?.includes("offline") ||
      error.code === "permission-denied"
    ) {
      console.warn(
        "Firestore unavailable or permission denied. User data will sync when connection restored or rules are updated."
      );
      return userData;
    }
    throw error;
  }
};

/**
 * Create clinician profile
 * @param {string} userId - Firebase user ID
 * @param {Object} clinicianData - Clinician specific data
 */
export const createClinicianProfile = async (userId, clinicianData = {}) => {
  try {
    const profile = {
      userId, // Reference to users collection
      specialization: clinicianData.specialization || "",
      licenseNumber: clinicianData.licenseNumber || "",
      hospital: clinicianData.hospital || "",
      department: clinicianData.department || "",
      patientsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      ...clinicianData,
    };

    await setDoc(doc(db, "clinicians", userId), profile, { merge: true });
    return profile;
  } catch (error) {
    console.error("Error creating clinician profile:", error);
    if (error.code === "unavailable" || error.message?.includes("offline")) {
      console.warn("Firestore offline. Clinician data will sync when online.");
      return profile;
    }
    throw error;
  }
};

/**
 * Get clinician profile
 * @param {string} userId - Firebase user ID
 */
export const getClinicianProfile = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, "clinicians", userId));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting clinician profile:", error);
    throw error;
  }
};

/**
 * Create patient profile
 * @param {string} userId - Firebase user ID
 * @param {Object} patientData - Patient specific data
 */
export const createPatientProfile = async (userId, patientData = {}) => {
  try {
    const profile = {
      userId, // Reference to users collection
      age: patientData.age || null,
      gender: patientData.gender || "",
      diagnosis: patientData.diagnosis || "",
      riskScore: patientData.riskScore || 0,
      clinicianId: patientData.clinicianId || null, // Reference to clinician
      medications: patientData.medications || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      ...patientData,
    };

    await setDoc(doc(db, "patients", userId), profile, { merge: true });
    return profile;
  } catch (error) {
    console.error("Error creating patient profile:", error);
    if (error.code === "unavailable" || error.message?.includes("offline")) {
      console.warn("Firestore offline. Patient data will sync when online.");
      return profile;
    }
    throw error;
  }
};

/**
 * Get patient profile
 * @param {string} userId - Firebase user ID
 */
export const getPatientProfile = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, "patients", userId));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting patient profile:", error);
    throw error;
  }
};

/**
 * Create caregiver profile
 * @param {string} userId - Firebase user ID
 * @param {Object} caregiverData - Caregiver specific data
 */
export const createCaregiverProfile = async (userId, caregiverData = {}) => {
  try {
    const profile = {
      userId, // Reference to users collection
      relationship: caregiverData.relationship || "", // e.g., "Son", "Daughter", "Spouse"
      patientId: caregiverData.patientId || null, // Reference to patient
      phone: caregiverData.phone || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      ...caregiverData,
    };

    await setDoc(doc(db, "caregivers", userId), profile, { merge: true });
    return profile;
  } catch (error) {
    console.error("Error creating caregiver profile:", error);
    if (error.code === "unavailable" || error.message?.includes("offline")) {
      console.warn("Firestore offline. Caregiver data will sync when online.");
      return profile;
    }
    throw error;
  }
};

/**
 * Get caregiver profile
 * @param {string} userId - Firebase user ID
 */
export const getCaregiverProfile = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, "caregivers", userId));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting caregiver profile:", error);
    throw error;
  }
};

/**
 * Update last login for any user
 * @param {string} userId - Firebase user ID
 * @param {string} role - User role
 */
export const updateLastLogin = async (userId, role) => {
  try {
    // Update in users collection
    await updateDoc(doc(db, "users", userId), {
      lastLogin: serverTimestamp(),
    });

    // Update in role-specific collection
    let collectionName = "";
    switch (role) {
      case "clinician":
        collectionName = "clinicians";
        break;
      case "patient":
        collectionName = "patients";
        break;
      case "caregiver":
        collectionName = "caregivers";
        break;
      default:
        return;
    }

    if (collectionName) {
      await updateDoc(doc(db, collectionName, userId), {
        lastLogin: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error updating last login:", error);
  }
};

/**
 * Get all clinicians (admin/query purposes)
 */
export const getAllClinicians = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "clinicians"));
    const clinicians = [];
    querySnapshot.forEach((doc) => {
      clinicians.push({ id: doc.id, ...doc.data() });
    });
    return clinicians;
  } catch (error) {
    console.error("Error getting clinicians:", error);
    return [];
  }
};

/**
 * Get all patients for a clinician
 * @param {string} clinicianId - Clinician user ID
 */
export const getClinicianPatients = async (clinicianId) => {
  try {
    const q = query(
      collection(db, "patients"),
      where("clinicianId", "==", clinicianId)
    );
    const querySnapshot = await getDocs(q);
    const patients = [];
    querySnapshot.forEach((doc) => {
      patients.push({ id: doc.id, ...doc.data() });
    });
    return patients;
  } catch (error) {
    console.error("Error getting clinician patients:", error);
    return [];
  }
};

export default {
  USER_ROLES,
  getUserRole,
  getUserData,
  createUserRecord,
  createClinicianProfile,
  getClinicianProfile,
  createPatientProfile,
  getPatientProfile,
  createCaregiverProfile,
  getCaregiverProfile,
  updateLastLogin,
  getAllClinicians,
  getClinicianPatients,
};
