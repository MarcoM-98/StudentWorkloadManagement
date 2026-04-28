import { initializeApp } from "firebase/app";
import { getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics is optional for auth; ignore unsupported environments.
    });
}

export { auth, app };
