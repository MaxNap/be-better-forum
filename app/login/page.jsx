"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "../../_utils/auth-context";
import { FaGithub, FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../_utils/firebase";

export default function LoginPage() {
  const router = useRouter();
  const { user, gitHubSignIn, googleSignIn, emailSignIn, firebaseSignOut } =
    useUserAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password & username state
  const [showReset, setShowReset] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [usernameEmail, setUsernameEmail] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) router.push("/profile");
  }, [user]);

  const handleGitHubLogin = async () => {
    try {
      await gitHubSignIn();
    } catch (error) {
      console.error("GitHub sign-in error:", error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error("Google sign-in error:", error.message);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await emailSignIn(email, password);
    } catch (error) {
      setAuthError("Invalid email or password");
    }
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setFeedbackMessage("Password reset email sent!");
      setResetEmail("");
      setShowReset(false);
    } catch (error) {
      setFeedbackMessage("Reset failed: " + error.message);
    }
  };

  const handleFindUsername = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", usernameEmail.trim())
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        setFeedbackMessage(`Your username is: ${userData.username}`);
      } else {
        setFeedbackMessage("No account found with that email.");
      }
      setUsernameEmail("");
      setShowUsername(false);
    } catch (error) {
      setFeedbackMessage("Username lookup failed: " + error.message);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="bg-white text-black rounded-xl p-8 w-full max-w-md shadow text-center">
        <h1 className="text-2xl font-bold mb-6">Login to Be Better</h1>

        {/* Email Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="you@example.com"
            />
          </div>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>
          {authError && <p className="text-red-500 text-sm">{authError}</p>}
          <button className="w-full bg-black text-white font-semibold py-2 rounded-md hover:bg-gray-800 transition">
            Sign in with Email
          </button>
        </form>

        {/* Forgot Options */}
        <div className="flex justify-between text-sm my-4">
          <button
            onClick={() => setShowReset(true)}
            className="text-blue-600 hover:underline"
          >
            Forgot Password?
          </button>
          <button
            onClick={() => setShowUsername(true)}
            className="text-blue-600 hover:underline"
          >
            Forgot Username?
          </button>
        </div>

        {/* OAuth Divider */}
        <div className="my-6">
          <div className="border-t border-gray-300 mb-4"></div>
          <span className="text-sm text-gray-500">Or continue with</span>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleGitHubLogin}
            className="flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-md hover:bg-gray-100 transition"
          >
            <FaGithub size={20} />
            GitHub
          </button>
          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-md hover:bg-gray-100 transition"
          >
            <FaGoogle size={20} className="text-red-600" />
            Google
          </button>
        </div>

        {/* Feedback Message */}
        {feedbackMessage && (
          <p className="text-sm text-center mb-4 text-green-600">
            {feedbackMessage}
          </p>
        )}

        {/* Password Reset */}
        {showReset && (
          <div className="p-4 bg-gray-50 border border-gray-300 rounded-md mb-4 text-left space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Reset Password</h2>
              <button
                className="text-sm text-gray-500 hover:underline"
                onClick={() => setShowReset(false)}
              >
                Cancel
              </button>
            </div>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={handleResetPassword}
              className="w-full bg-black text-white font-semibold py-2 rounded-md hover:bg-gray-800 transition"
            >
              Send Reset Link
            </button>
          </div>
        )}

        {/* Username Reminder */}
        {showUsername && (
          <div className="p-4 bg-gray-50 border border-gray-300 rounded-md mb-4 text-left space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Find Username</h2>
              <button
                className="text-sm text-gray-500 hover:underline"
                onClick={() => setShowUsername(false)}
              >
                Cancel
              </button>
            </div>
            <input
              type="email"
              value={usernameEmail}
              onChange={(e) => setUsernameEmail(e.target.value)}
              placeholder="Email used during signup"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={handleFindUsername}
              className="w-full bg-black text-white font-semibold py-2 rounded-md hover:bg-gray-800 transition"
            >
              Show My Username
            </button>
          </div>
        )}

        {/* Sign Up */}
        <p className="text-sm text-gray-600 mt-4">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-blue-600 hover:underline font-medium"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  );
}
