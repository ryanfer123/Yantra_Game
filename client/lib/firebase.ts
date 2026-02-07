import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAq3Y-52E3pDPm7AeUkEiWyW-o2oKGwTeo",
  authDomain: "last-of-os-485319.firebaseapp.com",
  databaseURL: "https://last-of-os-485319-default-rtdb.firebaseio.com",
  projectId: "last-of-os-485319",
  storageBucket: "last-of-os-485319.firebasestorage.app",
  messagingSenderId: "79752798341",
  appId: "1:79752798341:web:4946ba3a106ca52a5a89ec",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ hd: "vitstudent.ac.in" });

/** Sign in with Google popup. Only allows @vitstudent.ac.in emails. */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const email = result.user.email ?? "";
  if (!email.endsWith("@vitstudent.ac.in")) {
    await fbSignOut(auth);
    localStorage.removeItem("authToken");
    throw new Error("Only VIT student emails (@vitstudent.ac.in) are allowed.");
  }
  const idToken = await result.user.getIdToken();
  localStorage.setItem("authToken", idToken);
  localStorage.setItem("playerName", result.user.displayName ?? "Player");
  return result.user;
}

/** Sign out and clear stored tokens. */
export async function signOut(): Promise<void> {
  await fbSignOut(auth);
  localStorage.removeItem("authToken");
  localStorage.removeItem("playerName");
  localStorage.removeItem("sessionId");
}

/** Refresh the ID token (call periodically since tokens expire in 1 h). */
export async function refreshToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const token = await user.getIdToken(true);
  localStorage.setItem("authToken", token);
  return token;
}

export { onAuthStateChanged, type User };
