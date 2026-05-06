// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, realtimeDb, storage, googleProvider, analytics };
