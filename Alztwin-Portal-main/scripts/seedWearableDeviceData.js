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
  updateDoc,
  where,
} from "firebase/firestore";
import {
  RAFAY_PATIENT_NAME,
  RAFAY_SENSOR_MOCK_READINGS,
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

const toDeviceDataMap = (readings) =>
  readings.reduce((acc, reading) => {
    acc[String(reading.timestampMs)] = {
      bpm: reading.bpm,
      fall: reading.fall,
      latitude: reading.latitude,
      longitude: reading.longitude,
      outOfZone: reading.outOfZone,
      outOfBound: reading.outOfBound,
      pitch: reading.pitch,
      roll: reading.roll,
      sleeping: reading.sleeping,
      timestampMs: reading.timestampMs,
      dateKey: reading.dateKey,
    };
    return acc;
  }, {});

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

  const readings = RAFAY_SENSOR_MOCK_READINGS.map((reading) => ({
    ...reading,
    patientId: rafay.id,
    patientName: rafay.name || RAFAY_PATIENT_NAME,
    isMockData: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  const latest = readings.reduce((max, reading) =>
    reading.timestampMs > max.timestampMs ? reading : max
  );

  await Promise.all([
    setDoc(doc(db, "patients", rafay.id, "current", "latest"), latest, {
      merge: true,
    }),
    ...readings.map((reading) =>
      setDoc(
        doc(
          db,
          "patients",
          rafay.id,
          "sensorData",
          reading.dateKey,
          "readings",
          String(reading.timestampMs)
        ),
        reading,
        { merge: true }
      )
    ),
  ]);

  await updateDoc(doc(db, "patients", rafay.id), {
    deviceData: toDeviceDataMap(readings),
    latestWearableSyncAt: serverTimestamp(),
  });

  console.log(
    `Seeded ${readings.length} timestamped sensor readings for ${rafay.name || RAFAY_PATIENT_NAME} (${rafay.id}).`
  );
  console.log(`Latest reading: patients/${rafay.id}/current/latest`);
  console.log(`History path: patients/${rafay.id}/sensorData/{date}/readings/{timestampMs}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
