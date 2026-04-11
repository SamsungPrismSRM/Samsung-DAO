import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

/** Google Workspace hosted-domain hint for Samsung corporate SSO (OAuth `hd` parameter). */
const samsungWorkspaceDomain =
  import.meta.env.VITE_SAMSUNG_GOOGLE_WORKSPACE_DOMAIN ?? "samsung.com";

const firebaseConfig = {
  apiKey: "AIzaSyCOr0X5goMGi-V8J-ojai2UpBDdY6G04y8",
  authDomain: "namoj-551b3.firebaseapp.com",
  projectId: "namoj-551b3",
  storageBucket: "namoj-551b3.firebasestorage.app",
  messagingSenderId: "84820523288",
  appId: "1:84820523288:web:3f8d0a820affc0f694c66d",
  measurementId: "G-JF51X4Z5QS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  hd: samsungWorkspaceDomain,
  prompt: "select_account",
});
