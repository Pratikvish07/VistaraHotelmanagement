import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ✅ Declare ONCE
const firebaseConfig = {
  apiKey: 'AIzaSyCxINWrHxODC0qGkCj1vk2Km7QHqvmgoB8',
  authDomain: 'vistarahotelmanagement.firebaseapp.com',
  projectId: 'vistarahotelmanagement',
  storageBucket: 'vistarahotelmanagement.firebasestorage.app',
  messagingSenderId: '32791890470',
  appId: '1:32791890470:web:41a8482cc292c3d6bcb4e7',
  measurementId: 'G-5T9F2HJ1MM',
};

// ✅ Initialize ONCE
const app = initializeApp(firebaseConfig);

// ✅ Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ Export ONCE
export { auth, db, storage };
export default app;
