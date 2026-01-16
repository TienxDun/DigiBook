
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
  apiKey: "AIzaSyD-wlKR1855xqamk5qdi7vhVCDO4ykcG78",
  authDomain: "digibook-2026.firebaseapp.com",
  projectId: "digibook-2026",
  storageBucket: "digibook-2026.firebasestorage.app",
  messagingSenderId: "684984926015",
  appId: "1:684984926015:web:8ba46740804318d7eedd8a"
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
