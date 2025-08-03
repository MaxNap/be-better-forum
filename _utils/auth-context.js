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
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

// Create Auth Context
const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // GitHub Login
  const gitHubSignIn = async () => {
    const result = await signInWithPopup(auth, new GithubAuthProvider());
    await handlePostSocialLogin(result.user);
  };

  // Google Login
  const googleSignIn = async () => {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    await handlePostSocialLogin(result.user);
  };

  // Shared logic after social login
  const handlePostSocialLogin = async (firebaseUser) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists() || !userDoc.data()?.username) {
      // Redirect to set-username if missing
      router.push("/set-username");
    } else {
      // Username exists, update state
      setUser(firebaseUser);
    }
  };

  const emailSignIn = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const emailSignUp = async (email, password, username) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName: username });

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      username,
      createdAt: serverTimestamp(),
    });
  };

  const isUsernameTaken = async (username) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  const firebaseSignOut = () => signOut(auth);

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

export const useUserAuth = () => useContext(AuthContext);
