// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Tu configuración de Firebase
// Obtén estos datos de: Firebase Console > Project Settings > General

// const firebaseConfig = {
//   apiKey: "AIzaSyDvEy9H815YkZFcwFgeOv6BJVzp9HUmD9o",
//   authDomain: "acmc-sistema-citas-y-pagos.firebaseapp.com",
//   projectId: "acmc-sistema-citas-y-pagos",
//   storageBucket: "acmc-sistema-citas-y-pagos.firebasestorage.app",
//   messagingSenderId: "467946933767",
//   appId: "1:467946933767:web:6e587f74bc61bc9b31e4a2",
//   measurementId: "G-6PM09PZYFP"
// };

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore y Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Log para verificar inicialización
console.log('🔥 Firebase inicializado correctamente');
console.log('📊 Firestore DB:', db);

export default app;