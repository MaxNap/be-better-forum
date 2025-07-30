"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "../../_utils/auth-context";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth, sendEmailVerification } from "firebase/auth";
import { db } from "../../_utils/firebase";
import { toast } from "sonner";

export default function SignUpPage() {
  const { emailSignUp } = useUserAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [authError, setAuthError] = useState(null);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  const checkUsernameAvailability = async (inputUsername) => {
    setUsername(inputUsername);
    setUsernameError("");

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

  const isStrongPassword = (pw) => pw.length >= 8 && /\d/.test(pw);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError("");
    setUsernameError("");
    setPasswordError("");
    setConfirmError("");

    if (!username.trim()) {
      setUsernameError("Username is required.");
      return;
    }

    if (usernameAvailable === false) {
      setUsernameError("Username is already taken.");
      return;
    }

    if (!isStrongPassword(password)) {
      setPasswordError(
        "Password must be at least 8 characters and include a number."
      );
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      return;
    }

    try {
      await emailSignUp(email, password, username.trim());

      const auth = getAuth();
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        toast.success("Verification email sent! Please check your inbox.");
      }

      router.push("/profile");
    } catch (error) {
      console.error("Signup error:", error);
      setAuthError(error.message || "Signup failed.");
      toast.error(error.message || "Signup failed.");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 sm:px-6">
      <div className="bg-white text-black rounded-xl p-8 w-full max-w-md shadow text-center">
        <h1 className="text-2xl font-bold mb-6">Create an Account</h1>

        <form onSubmit={handleSignUp} className="text-left space-y-4">
          {/* Username */}
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
              required
              placeholder="Choose a username"
              value={username}
              onChange={(e) => checkUsernameAvailability(e.target.value)}
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
            {usernameError && (
              <p className="text-red-500 text-sm mt-1">{usernameError}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Minimum 8 characters, includes number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
            <ul className="text-sm mt-2 space-y-1">
              <li
                className={
                  password.length >= 8 ? "text-green-600" : "text-gray-500"
                }
              >
                At least 8 characters
              </li>
              <li
                className={
                  /\d/.test(password) ? "text-green-600" : "text-gray-500"
                }
              >
                Contains a number
              </li>
            </ul>
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? (
                  <FaEyeSlash size={18} />
                ) : (
                  <FaEye size={18} />
                )}
              </button>
            </div>
            {confirmPassword && (
              <p
                className={`text-sm mt-1 ${
                  password === confirmPassword
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {password === confirmPassword
                  ? "Passwords match"
                  : "Passwords do not match"}
              </p>
            )}
            {confirmError && (
              <p className="text-red-500 text-sm mt-1">{confirmError}</p>
            )}
          </div>

          {/* General Auth Error */}
          {authError && (
            <p className="text-red-500 text-sm mt-1">{authError}</p>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition"
          >
            Sign Up
          </button>
        </form>
      </div>
    </main>
  );
}
