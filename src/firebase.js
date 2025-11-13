import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// 🔍 DEBUG temporal - eliminar después
console.log('🔍 API Key:', process.env.REACT_APP_FIREBASE_API_KEY);
console.log('🔍 Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Log para verificar inicialización (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  console.log('🔥 Firebase inicializado correctamente');
  console.log('📊 Firestore DB:', db);
}

export default app;