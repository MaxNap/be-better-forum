"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "../../_utils/auth-context";
import { FaGithub, FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import Link from "next/link";
import toast from "react-hot-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../_utils/firebase";

export default function LoginPage() {
  const router = useRouter();
  const { user, gitHubSignIn, googleSignIn, emailSignIn } = useUserAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    if (user) router.push("/profile");
  }, [user]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await emailSignIn(email, password);
      if (!res.user.emailVerified) {
        await auth.signOut();
        toast.error("Please verify your email before logging in.");
        return;
      }
    } catch (error) {
      setAuthError("Invalid email or password");
    }
  };

  const handleResetPassword = async () => {
    try {
      if (!resetEmail.trim()) {
        toast.error("Please enter your email.");
        return;
      }

      await sendPasswordResetEmail(auth, resetEmail.trim());
      toast.success("Reset email sent!");
      setResetEmail("");
      setShowReset(false);
    } catch (error) {
      console.error("Reset error:", error.code);
      if (error.code === "auth/user-not-found") {
        toast.error("No user found with that email.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email address.");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Too many requests. Try again later.");
      } else {
        toast.error(error.message);
      }
    }
  };

  const handleGitHubLogin = async () => {
    try {
      await gitHubSignIn();
    } catch (error) {
      console.error("GitHub error:", error.message);
      toast.error("GitHub login failed.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error("Google error:", error.message);
      toast.error("Google login failed.");
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

        {/* Forgot Password */}
        <div className="text-sm my-4">
          <button
            onClick={() => setShowReset(true)}
            className="relative text-sm text-blue-700 font-medium transition-all hover:text-blue-900 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-blue-700 after:transition-all hover:after:w-full"
          >
            Forgot your password?
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

        {/* Reset Password Modal */}
        {showReset && (
          <div className="p-6 bg-gray-100 border border-gray-300 rounded-xl mb-4 text-left space-y-4 shadow-inner">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Reset your password
              </h2>
              <button
                className="text-sm text-gray-500 hover:underline"
                onClick={() => setShowReset(false)}
              >
                Cancel
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Enter your email address and we’ll send you a reset link.
            </p>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={handleResetPassword}
              className="w-full bg-black text-white font-semibold py-2 rounded-md hover:bg-gray-800 transition"
            >
              Send Reset Email
            </button>
          </div>
        )}

        {/* Sign Up Link */}
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
