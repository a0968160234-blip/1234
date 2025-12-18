
import { initializeApp, getApps } from 'firebase/app';
// Fix: Use import type for Auth and separate value import for getAuth to resolve potential module resolution issues.
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
// Fix: Use import type for Firestore and separate value import for getFirestore.
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// --- 請在此處填寫您的 Firebase 設定 ---
// 這樣做是為了讓您後續開發更順利，不需透過 GitHub Secrets 管理此部分
const firebaseConfig = {
  apiKey: "AIzaSyAjabYSp_3jsXBNzY6WlVYQqyvSwbSAUg8",
  authDomain: "project-493284764010517586.firebaseapp.com",
  projectId: "project-493284764010517586",
  storageBucket: "project-493284764010517586.firebasestorage.app",
  messagingSenderId: "240928712258",
  appId: "1:240928712258:web:8326ec043124bb9bc32fdb"
};

let auth: Auth | null = null;
let db: Firestore | null = null;
let isOfflineMode = false;

// 檢查是否已填寫設定，若仍為預設值則進入離線模式
if (firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY") {
  console.warn("偵測到未配置的 Firebase 設定，進入離線展示模式。");
  isOfflineMode = true;
} else {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase 初始化成功。");
  } catch (error) {
    console.error("Firebase 初始化失敗:", error);
    isOfflineMode = true;
  }
}

export { auth, db, isOfflineMode };
