// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth/react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDlL4KCXzUU096GVU28WU_a0wCl8tFvDCU",
  authDomain: "drawapp-37816.firebaseapp.com",
  projectId: "drawapp-37816",
  storageBucket: "drawapp-37816.firebasestorage.app",
  messagingSenderId: "452753641796",
  appId: "1:452753641796:web:32f3db73d2e52d5a074711"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);
export {db, auth, app};