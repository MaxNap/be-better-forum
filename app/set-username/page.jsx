"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "../../_utils/auth-context";
import { db } from "../../_utils/firebase";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { toast } from "sonner";

export default function SetUsernamePage() {
  const router = useRouter();
  const { user } = useUserAuth();

  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Check username availability in Firestore
  const checkUsernameAvailability = async (inputUsername) => {
    setUsername(inputUsername);
    setError("");

    if (!inputUsername.trim()) {
      setUsernameAvailable(null);
      return;
    }

    const q = query(
      collection(db, "users"),
      where("username", "==", inputUsername.trim())
    );
    const querySnapshot = await getDocs(q);
    setUsernameAvailable(querySnapshot.empty);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (usernameAvailable === false) {
      setError("This username is already taken.");
      return;
    }

    try {
      setLoading(true);

      // Save username to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        username: username.trim(),
        createdAt: serverTimestamp(),
      });

      // Update Firebase Auth displayName
      await updateProfile(user, {
        displayName: username.trim(),
      });

      toast.success("Username saved!");
      router.push("/profile");
    } catch (err) {
      console.error("Username save error:", err);
      toast.error("Failed to save username. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="bg-white text-black rounded-xl p-8 w-full max-w-md shadow text-center">
        <h1 className="text-2xl font-bold mb-4">Choose a Username</h1>
        <p className="text-sm text-gray-600 mb-4">
          This will be your public name on the forum.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => checkUsernameAvailability(e.target.value)}
              placeholder="Enter a username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {username && usernameAvailable === true && (
              <p className="text-green-600 text-sm mt-1">
                Username is available
              </p>
            )}
            {username && usernameAvailable === false && (
              <p className="text-red-600 text-sm mt-1">
                Username is already taken
              </p>
            )}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-md font-semibold hover:bg-gray-800 transition"
          >
            {loading ? "Saving..." : "Save Username"}
          </button>
        </form>
      </div>
    </main>
  );
}
