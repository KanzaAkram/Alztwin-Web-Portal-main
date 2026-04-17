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
  addDoc,
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

/**
 * Create a patient access request from caregiver to clinician
 * @param {string} caregiverId - Caregiver user ID
 * @param {string} patientId - Patient user ID
 * @param {string} clinicianId - Clinician user ID
 * @param {Object} additionalData - Additional request information
 */
export const createPatientAccessRequest = async (
  caregiverId,
  patientId,
  clinicianId,
  additionalData = {}
) => {
  try {
    const requestData = {
      caregiverId,
      patientId,
      clinicianId,
      status: "pending", // pending, accepted, rejected
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...additionalData,
    };

    const docRef = await addDoc(
      collection(db, "consult_requests"),
      requestData
    );
    return { id: docRef.id, ...requestData };
  } catch (error) {
    console.error("Error creating patient access request:", error);
    throw error;
  }
};

/**
 * Get all pending patient access requests for a clinician
 * @param {string} clinicianId - Clinician user ID
 */
export const getClinicianPendingRequests = async (clinicianId) => {
  try {
    const q = query(
      collection(db, "consult_requests"),
      where("clinicianId", "==", clinicianId),
      where("status", "==", "pending")
    );
    const querySnapshot = await getDocs(q);
    const requests = [];

    for (const docSnapshot of querySnapshot.docs) {
      const requestData = { id: docSnapshot.id, ...docSnapshot.data() };

      // Get patient details
      const patientDoc = await getDoc(
        doc(db, "patients", requestData.patientId)
      );
      if (patientDoc.exists()) {
        requestData.patientData = patientDoc.data();
      }

      // Get patient user details
      const userDoc = await getDoc(doc(db, "users", requestData.patientId));
      if (userDoc.exists()) {
        requestData.patientUserData = userDoc.data();
      }

      // Get caregiver details
      const caregiverDoc = await getDoc(
        doc(db, "users", requestData.caregiverId)
      );
      if (caregiverDoc.exists()) {
        requestData.caregiverData = caregiverDoc.data();
      }

      requests.push(requestData);
    }

    return requests;
  } catch (error) {
    console.error("Error getting clinician pending requests:", error);
    return [];
  }
};

/**
 * Get ALL patient access requests for a clinician (including accepted/rejected)
 * @param {string} clinicianId - Clinician user ID
 */
export const getClinicianAllRequests = async (clinicianId) => {
  try {
    const q = query(
      collection(db, "consult_requests"),
      where("clinicianId", "==", clinicianId)
    );
    const querySnapshot = await getDocs(q);
    const requests = [];

    for (const docSnapshot of querySnapshot.docs) {
      const requestData = { id: docSnapshot.id, ...docSnapshot.data() };

      // Get patient details
      const patientDoc = await getDoc(
        doc(db, "patients", requestData.patientId)
      );
      if (patientDoc.exists()) {
        requestData.patientData = patientDoc.data();
      }

      // Get patient user details
      const userDoc = await getDoc(doc(db, "users", requestData.patientId));
      if (userDoc.exists()) {
        requestData.patientUserData = userDoc.data();
      }

      // Get caregiver details
      const caregiverDoc = await getDoc(
        doc(db, "users", requestData.caregiverId)
      );
      if (caregiverDoc.exists()) {
        requestData.caregiverData = caregiverDoc.data();
      }

      requests.push(requestData);
    }

    return requests;
  } catch (error) {
    console.error("Error getting clinician all requests:", error);
    return [];
  }
};

/**
 * Accept a patient access request
 * @param {string} requestId - Request document ID
 * @param {string} patientId - Patient user ID
 * @param {string} clinicianId - Clinician user ID
 * @param {Object} patientData - Patient data from the request (optional)
 */
export const acceptPatientRequest = async (
  requestId,
  patientId,
  clinicianId,
  patientData = {}
) => {
  try {
    // Get the request data first to extract patient info
    const requestDoc = await getDoc(doc(db, "consult_requests", requestId));
    const requestInfo = requestDoc.exists() ? requestDoc.data() : {};

    // Update the request status
    await updateDoc(doc(db, "consult_requests", requestId), {
      status: "accepted",
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Check if patient document exists
    const existingPatientDoc = await getDoc(doc(db, "patients", patientId));

    if (existingPatientDoc.exists()) {
      // Update existing patient document with clinicianId
      await updateDoc(doc(db, "patients", patientId), {
        clinicianId: clinicianId,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new patient document with data from request
      const newPatientData = {
        clinicianId: clinicianId,
        caregiverId: requestInfo.caregiverId || null,
        name: patientData.name || requestInfo.patientName || "Patient",
        age: patientData.age || requestInfo.patientAge || null,
        gender: patientData.gender || requestInfo.patientGender || null,
        diagnosis:
          patientData.diagnosis ||
          requestInfo.diagnosis ||
          "Pending Assessment",
        summary: requestInfo.summary || "",
        riskScore: patientData.riskScore || 0,
        riskLevel: patientData.riskLevel || "low",
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "patients", patientId), newPatientData);
    }

    // Update clinician's patient count
    const clinicianDoc = await getDoc(doc(db, "clinicians", clinicianId));
    if (clinicianDoc.exists()) {
      const currentCount = clinicianDoc.data().patientsCount || 0;
      await updateDoc(doc(db, "clinicians", clinicianId), {
        patientsCount: currentCount + 1,
        updatedAt: serverTimestamp(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error accepting patient request:", error);
    throw error;
  }
};

/**
 * Reject a patient access request
 * @param {string} requestId - Request document ID
 */
export const rejectPatientRequest = async (requestId) => {
  try {
    await updateDoc(doc(db, "consult_requests", requestId), {
      status: "rejected",
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error rejecting patient request:", error);
    throw error;
  }
};

/**
 * Get all patients registered with a clinician (accepted)
 * @param {string} clinicianId - Clinician user ID
 */
export const getAcceptedPatients = async (clinicianId) => {
  try {
    const patients = [];
    const addedPatientIds = new Set();

    // Method 1: Get patients from patients collection where clinicianId matches
    const patientsQuery = query(
      collection(db, "patients"),
      where("clinicianId", "==", clinicianId)
    );
    const patientsSnapshot = await getDocs(patientsQuery);

    for (const docSnapshot of patientsSnapshot.docs) {
      const patientData = { id: docSnapshot.id, ...docSnapshot.data() };

      // Get patient user details
      const userDoc = await getDoc(doc(db, "users", docSnapshot.id));
      if (userDoc.exists()) {
        patientData.userData = userDoc.data();
      }

      patients.push(patientData);
      addedPatientIds.add(docSnapshot.id);
    }

    // Method 2: Also get from accepted consult_requests (for patients not in patients collection)
    const requestsQuery = query(
      collection(db, "consult_requests"),
      where("clinicianId", "==", clinicianId),
      where("status", "==", "accepted")
    );
    const requestsSnapshot = await getDocs(requestsQuery);

    for (const docSnapshot of requestsSnapshot.docs) {
      const requestData = docSnapshot.data();
      const patientId = requestData.patientId;

      // Skip if already added from patients collection
      if (addedPatientIds.has(patientId)) {
        continue;
      }

      // Create patient data from request
      const patientData = {
        id: patientId,
        name: requestData.patientName || "Patient",
        age: requestData.patientAge || null,
        gender: requestData.patientGender || null,
        diagnosis: requestData.diagnosis || "Pending Assessment",
        summary: requestData.summary || "",
        clinicianId: clinicianId,
        caregiverId: requestData.caregiverId,
        riskScore: requestData.riskScore || 0,
        riskLevel: requestData.riskLevel || "low",
        status: "active",
        acceptedAt: requestData.acceptedAt,
      };

      // Try to get user details
      const userDoc = await getDoc(doc(db, "users", patientId));
      if (userDoc.exists()) {
        patientData.userData = userDoc.data();
        // Use user's displayName if patient name not set
        if (!requestData.patientName && userDoc.data().displayName) {
          patientData.name = userDoc.data().displayName;
        }
      }

      patients.push(patientData);
      addedPatientIds.add(patientId);
    }

    return patients;
  } catch (error) {
    console.error("Error getting accepted patients:", error);
    return [];
  }
};

/**
 * Get full patient details including health data
 * @param {string} patientId - Patient user ID
 */
export const getPatientFullDetails = async (patientId) => {
  try {
    const patientDoc = await getDoc(doc(db, "patients", patientId));
    const userDoc = await getDoc(doc(db, "users", patientId));

    if (!patientDoc.exists()) {
      return null;
    }

    return {
      id: patientId,
      ...patientDoc.data(),
      userData: userDoc.exists() ? userDoc.data() : null,
    };
  } catch (error) {
    console.error("Error getting patient full details:", error);
    return null;
  }
};

/**
 * Create a video consultation session
 * @param {string} clinicianId - Clinician user ID
 * @param {string} patientId - Patient user ID
 * @param {string} caregiverId - Caregiver user ID (optional)
 */
export const createConsultationSession = async (
  clinicianId,
  patientId,
  caregiverId = null
) => {
  try {
    const sessionData = {
      clinicianId,
      patientId,
      caregiverId,
      status: "waiting", // waiting, active, ended
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      roomId: `consultation_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    };

    const docRef = await addDoc(
      collection(db, "consultation_sessions"),
      sessionData
    );
    return { id: docRef.id, ...sessionData };
  } catch (error) {
    console.error("Error creating consultation session:", error);
    throw error;
  }
};

/**
 * Get active consultation session for a patient
 * @param {string} patientId - Patient user ID
 */
export const getActiveConsultation = async (patientId) => {
  try {
    const q = query(
      collection(db, "consultation_sessions"),
      where("patientId", "==", patientId),
      where("status", "in", ["waiting", "active"])
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting active consultation:", error);
    return null;
  }
};

/**
 * Get all consultation sessions for a clinician
 * @param {string} clinicianId - Clinician user ID
 */
export const getClinicianConsultations = async (clinicianId) => {
  try {
    const q = query(
      collection(db, "consultation_sessions"),
      where("clinicianId", "==", clinicianId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting clinician consultations:", error);
    return [];
  }
};

/**
 * Update consultation session status
 * @param {string} sessionId - Session document ID
 * @param {string} status - New status
 */
export const updateConsultationStatus = async (sessionId, status) => {
  try {
    await updateDoc(doc(db, "consultation_sessions", sessionId), {
      status,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating consultation status:", error);
    throw error;
  }
};

/**
 * Store WebRTC signaling data for video calls
 * @param {string} sessionId - Session ID
 * @param {string} type - Signal type (offer, answer, ice-candidate)
 * @param {Object} data - Signal data
 * @param {string} fromUserId - Sender user ID
 */
export const sendSignalingData = async (sessionId, type, data, fromUserId) => {
  try {
    const signalData = {
      sessionId,
      type,
      data: JSON.stringify(data),
      fromUserId,
      createdAt: serverTimestamp(),
      processed: false,
    };
    await addDoc(collection(db, "webrtc_signals"), signalData);
    return true;
  } catch (error) {
    console.error("Error sending signaling data:", error);
    throw error;
  }
};

/**
 * Get signaling data for a session
 * @param {string} sessionId - Session ID
 * @param {string} forUserId - User ID to get signals for (not from)
 */
export const getSignalingData = async (sessionId, forUserId) => {
  try {
    const q = query(
      collection(db, "webrtc_signals"),
      where("sessionId", "==", sessionId),
      where("processed", "==", false)
    );
    const querySnapshot = await getDocs(q);
    const signals = [];

    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      if (data.fromUserId !== forUserId) {
        signals.push({
          id: docSnapshot.id,
          ...data,
          data: JSON.parse(data.data),
        });
        // Mark as processed
        await updateDoc(doc(db, "webrtc_signals", docSnapshot.id), {
          processed: true,
        });
      }
    }

    return signals;
  } catch (error) {
    console.error("Error getting signaling data:", error);
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
  createPatientAccessRequest,
  getClinicianPendingRequests,
  acceptPatientRequest,
  rejectPatientRequest,
  getAcceptedPatients,
  getPatientFullDetails,
  createConsultationSession,
  getActiveConsultation,
  getClinicianConsultations,
  updateConsultationStatus,
  sendSignalingData,
  getSignalingData,
};
