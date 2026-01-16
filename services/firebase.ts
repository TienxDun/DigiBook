
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
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
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
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
