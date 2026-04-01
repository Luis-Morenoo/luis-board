import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDZYZANCqnJdLEZ-KWJfCwMbLMTtn2YsBw",
  authDomain: "luis-board-7fce3.firebaseapp.com",
  projectId: "luis-board-7fce3",
  storageBucket: "luis-board-7fce3.firebasestorage.app",
  messagingSenderId: "240713125754",
  appId: "1:240713125754:web:96ac6c06f6550fc713d0c3",
  measurementId: "G-PG237EKQYJ",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);
export const OWNER_EMAIL = "luismorenosofteng@gmail.com";
