
import { initializeApp, getApps } from 'firebase/app';
// Standard modular import for Firebase Authentication
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let firebaseApp;
let auth: any = null;
let db: any = null;
let isOfflineMode = false;

const firebaseConfigStr = process.env.FIREBASE_CONFIG;

// 檢查 Firebase 設定是否存在
if (firebaseConfigStr && firebaseConfigStr !== "undefined") {
  try {
    const config = JSON.parse(firebaseConfigStr);
    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApps()[0];
    }
    // Initialize Auth using the modular SDK pattern
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    console.log("Firebase 初始化成功。");
  } catch (error) {
    console.error("Firebase 初始化失敗，進入離線模式:", error);
    isOfflineMode = true;
  }
} else {
  // 若未設定環境變數，直接進入展示用的離線模式
  console.warn("未偵測到 FIREBASE_CONFIG，進入離線展示模式。");
  isOfflineMode = true;
}

export { auth, db, isOfflineMode };
