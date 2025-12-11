// frontend/lib/firebase.ts

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA_pWSFA__VwkrJGmcFg1XqbyRNZLRY4tg",
  authDomain: "career-pilot-480900.firebaseapp.com",
  projectId: "career-pilot-480900",
  storageBucket: "career-pilot-480900.firebasestorage.app",
  messagingSenderId: "408645434576",
  appId: "1:408645434576:web:3512738ef77b5a854a32d5",
  measurementId: "G-4158NPK8ME"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();