// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3UHtl3NkTmDjKEITWWygSV1DJmmo_oSE",
  authDomain: "homespace-6e28a.firebaseapp.com",
  databaseURL: "https://homespace-6e28a-default-rtdb.firebaseio.com",
  projectId: "homespace-6e28a",
  storageBucket: "homespace-6e28a.firebasestorage.app",
  messagingSenderId: "353863742679",
  appId: "1:353863742679:web:e4e2596b705b6819c92c92",
  measurementId: "G-7V0TXCGZFE"
};


const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore


// export { auth, db, analytics }; 
export { auth, db};
export default app;