import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBcvrNK0AiPIoMKTOQ0qaRwugZMQstijtA",
  authDomain: "church--website.firebaseapp.com",
  projectId: "church--website",
  storageBucket: "church--website.appspot.com",
  messagingSenderId: "538682223859",
  appId: "1:538682223859:web:5ba83e7c72a912e3875b86"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// Optional: Add these settings to reduce unnecessary auth checks
auth.useDeviceLanguage();