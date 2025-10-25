// Firebase Configuration and Initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCB-y_tfXKjeLFq9B6Oh4pkmyRbCb2cLgY",
  authDomain: "jj-wishlist.firebaseapp.com",
  projectId: "jj-wishlist",
  storageBucket: "jj-wishlist.firebasestorage.app",
  messagingSenderId: "125732518783",
  appId: "1:125732518783:web:37d37cf4c229c5bbe0b84a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
