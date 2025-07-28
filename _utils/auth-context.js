"use client";

import { useContext, createContext, useState, useEffect } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "./firebase";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Wrapper
export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // GitHub Login
  const gitHubSignIn = () => signInWithPopup(auth, new GithubAuthProvider());

  // Google Login
  const googleSignIn = () => signInWithPopup(auth, new GoogleAuthProvider());

  // Email/Password Login
  const emailSignIn = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  // Email/Password Signup + Save Username
  const emailSignUp = async (email, password, username) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Set displayName for Firebase Auth
      await updateProfile(user, {
        displayName: username,
      });

      // Save to Firestore "users" collection
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        username,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // Check if username already exists in Firestore
  const isUsernameTaken = async (username) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const snapshot = await getDocs(q);
    return !snapshot.empty; // true if taken
  };

  // Sign out
  const firebaseSignOut = () => signOut(auth);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        gitHubSignIn,
        googleSignIn,
        emailSignIn,
        emailSignUp,
        firebaseSignOut,
        isUsernameTaken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook for easy access
export const useUserAuth = () => useContext(AuthContext);
