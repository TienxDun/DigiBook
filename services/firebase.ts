
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
import {
  getFirestore,
  terminate,
  clearIndexedDbPersistence,
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch
} from "firebase/firestore";

// Thông tin cấu hình Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let auth;
let db_fs;
const googleProvider = new GoogleAuthProvider();

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db_fs = getFirestore(app);
  
  // Xử lý lỗi BloomFilterError bằng cách xóa cache nếu cần
  // Lưu ý: Trong môi trường thực tế, có thể gọi hàm này dựa trên bắt lỗi hoặc khi khởi động
  // clearIndexedDbPersistence(db_fs).catch(err => console.error("Could not clear persistence:", err));

  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
} catch (e) {
  console.error("Firebase initialization error:", e);
}

export { 
  auth, 
  googleProvider, 
  db_fs, 
  terminate,
  clearIndexedDbPersistence,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch
};
