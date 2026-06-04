/**
 * Firebase Configuration (v0.5.0)
 * Integrated with Alex Lam's Firebase Project
 */

const firebaseConfig = {
  apiKey: "AIzaSyDT9rw73AYFohhWE1bzfJC-uXQRQTyFtqc",
  authDomain: "yr7sciencehero.firebaseapp.com",
  projectId: "yr7sciencehero",
  storageBucket: "yr7sciencehero.firebasestorage.app",
  messagingSenderId: "366034959896",
  appId: "1:366034959896:web:b7d6913f1643da85218d6d",
  measurementId: "G-QG1S6JEVYM"
};

// Initialize Firebase (using compat library)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

console.log("Firebase initialized and ready for Science Lab Hero.");
