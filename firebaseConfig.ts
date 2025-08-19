import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyArY1wQhYeCBb73CohiRxbUTaJQAVLU4BM",
  authDomain: "rasyon-mobil-ffdfa.firebaseapp.com",
  projectId: "rasyon-mobil-ffdfa",
  storageBucket: "rasyon-mobil-ffdfa.firebasestorage.app",
  messagingSenderId: "910288660539",
  appId: "1:910288660539:web:de2dad00db0a2a5341941e"
};

export const app = initializeApp(firebaseConfig);

// Firebase Auth'u başlat
export const auth = getAuth(app);

// Firestore'u başlat
export const db = getFirestore(app);