// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCxINWrHxODC0qGkCj1vk2Km7QHqvmgoB8",
  authDomain: "vistarahotelmanagement.firebaseapp.com",
  projectId: "vistarahotelmanagement",
  storageBucket: "vistarahotelmanagement.firebasestorage.app",
  messagingSenderId: "32791890470",
  appId: "1:32791890470:web:41a8482cc292c3d6bcb4e7",
  measurementId: "G-5T9F2HJ1MM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);