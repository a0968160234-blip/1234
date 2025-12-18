
import { initializeApp, getApps } from 'firebase/app';
// Ensure correct named imports for Firebase Auth and Firestore from the modular SDK.
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let firebaseApp;
let auth: any = null;
let db: any = null;
let isOfflineMode = false;

const firebaseConfigStr = process.env.FIREBASE_CONFIG;

if (firebaseConfigStr) {
  try {
    const config = JSON.parse(firebaseConfigStr);
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApps()[0];
    }
    // Initialize Auth and Firestore using the modular functions.
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed, entering offline mode:", error);
    isOfflineMode = true;
  }
} else {
  console.warn("No FIREBASE_CONFIG found, entering offline mode.");
  isOfflineMode = true;
}

export { auth, db, isOfflineMode };
