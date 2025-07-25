"use client";

import { useContext, createContext, useState, useEffect } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GithubAuthProvider,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // GitHub Auth
  const gitHubSignIn = () => {
    const provider = new GithubAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Google Auth
  const googleSignIn = () => {
    return signInWithPopup(auth, googleProvider);
  };

  // Sign Out
  const firebaseSignOut = () => {
    return signOut(auth);
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, gitHubSignIn, googleSignIn, firebaseSignOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useUserAuth = () => useContext(AuthContext);
