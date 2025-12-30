import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCxINWrHxODC0qGkCj1vk2Km7QHqvmgoB8",
  authDomain: "vistarahotelmanagement.firebaseapp.com",
  projectId: "vistarahotelmanagement",
  storageBucket: "vistarahotelmanagement.firebasestorage.app",
  messagingSenderId: "32791890470",
  appId: "1:32791890470:web:41a8482cc292c3d6bcb4e7",
  measurementId: "G-5T9F2HJ1MM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
