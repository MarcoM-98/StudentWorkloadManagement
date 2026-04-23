// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "REMOVED_API_KEY",
  authDomain: "REMOVED_AUTH_DOMAIN",
  projectId: "REMOVED_PROJECT_ID",
  storageBucket: "REMOVED_STORAGE_BUCKET",
  messagingSenderId: "REMOVED_MESSAGING_SENDER_ID",
  appId: "REMOVED_APP_ID",
  measurementId: "REMOVED_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { auth, app };