import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import {
  RAFAY_PATIENT_NAME,
  RAFAY_SENSOR_MOCK_READINGS,
  SENSOR_SEED_VERSION,
} from "../data/wearableDeviceDataMock.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZEjG3vA-VyVpMme0lzM5YTpo-36Xbsu0",
  authDomain: "alztwin-test.firebaseapp.com",
  databaseURL:
    "https://alztwin-test-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "alztwin-test",
  storageBucket: "alztwin-test.firebasestorage.app",
  messagingSenderId: "739523529786",
  appId: "1:739523529786:web:a838db929e12aa18f6f903",
  measurementId: "G-0NS60D141H",
};

const formatPatientLogTimestamp = (timestampMs) => {
  const date = new Date(timestampMs);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const formatPatientLogDocId = (timestampMs) =>
  formatPatientLogTimestamp(timestampMs).replace(" ", "_").replaceAll(":", "-");

const toPatientLogRecord = (reading, rafay) => ({
  bpm: reading.bpm,
  fall: reading.fall,
  latitude: reading.latitude,
  longitude: reading.longitude,
  outOfZone: reading.outOfZone,
  outOfBound: reading.outOfBound,
  pitch: reading.pitch,
  roll: reading.roll,
  sleeping: reading.sleeping,
  timestamp: formatPatientLogTimestamp(reading.timestampMs),
  timestampMs: reading.timestampMs,
  dateKey: reading.dateKey,
  patientDocId: rafay.id,
  patientId: rafay.patientId || rafay.id,
  patientName: rafay.name || RAFAY_PATIENT_NAME,
  isMockData: true,
  seedVersion: SENSOR_SEED_VERSION,
  updatedAt: serverTimestamp(),
});

const findRafayPatient = async (db, requestedPatientId) => {
  if (requestedPatientId) {
    const directDoc = await getDoc(doc(db, "patients", requestedPatientId));
    if (directDoc.exists()) {
      return { id: directDoc.id, ...directDoc.data() };
    }

    const patientIdQuery = query(
      collection(db, "patients"),
      where("patientId", "==", requestedPatientId)
    );
    const patientIdSnap = await getDocs(patientIdQuery);
    if (!patientIdSnap.empty) {
      const patientDoc = patientIdSnap.docs[0];
      return { id: patientDoc.id, ...patientDoc.data() };
    }

    throw new Error(
      `No patient document or patientId field matched "${requestedPatientId}".`
    );
  }

  const patientsSnap = await getDocs(collection(db, "patients"));
  const matches = patientsSnap.docs
    .map((patientDoc) => ({ id: patientDoc.id, ...patientDoc.data() }))
    .filter((patient) => {
      const haystack = [patient.id, patient.patientId, patient.name, patient.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(RAFAY_PATIENT_NAME.toLowerCase());
    });

  if (matches.length === 0) {
    throw new Error(`No patient matching "${RAFAY_PATIENT_NAME}" was found.`);
  }

  return matches[0];
};

const main = async () => {
  const email = process.env.FIREBASE_SEED_EMAIL;
  const password = process.env.FIREBASE_SEED_PASSWORD;
  const requestedPatientId = process.env.FIREBASE_SEED_PATIENT_ID;

  if (!email || !password) {
    throw new Error(
      "Set FIREBASE_SEED_EMAIL and FIREBASE_SEED_PASSWORD to a Firebase user that can write Firestore data."
    );
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInWithEmailAndPassword(auth, email, password);
  const rafay = await findRafayPatient(db, requestedPatientId);

  await Promise.all(
    RAFAY_SENSOR_MOCK_READINGS.map((reading) =>
      setDoc(
        doc(db, "patient_logs", formatPatientLogDocId(reading.timestampMs)),
        toPatientLogRecord(reading, rafay),
        { merge: true }
      )
    )
  );

  console.log(
    `Seeded ${RAFAY_SENSOR_MOCK_READINGS.length} patient_logs readings for ${rafay.name || RAFAY_PATIENT_NAME} (${rafay.id}).`
  );
  console.log(`Root stream path: patient_logs/{yyyy-MM-dd_HH-mm-ss}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
