
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

// Thông tin cấu hình Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: any = null;
let auth: any = null;
let isFirebaseReady = false;
const googleProvider = new GoogleAuthProvider();

// Kiểm tra cấu hình tối thiểu (apiKey và projectId)
const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

if (hasConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    isFirebaseReady = true;
    
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    console.log("🔥 Firebase Auth initialized successfully");
  } catch (e) {
    console.error("Firebase initialization error:", e);
    isFirebaseReady = false;
  }
} else {
  console.warn("⚠️ Firebase configuration is missing. Auth will be disabled.");
  isFirebaseReady = false;
}

export { 
  auth, 
  googleProvider, 
  isFirebaseReady,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut,
  onAuthStateChanged
};
