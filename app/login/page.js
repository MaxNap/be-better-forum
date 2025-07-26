"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "../../_utils/auth-context";
import { FaGithub, FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { user, gitHubSignIn, googleSignIn, emailSignIn, firebaseSignOut } =
    useUserAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect after login
  useEffect(() => {
    if (user) {
      router.push("/profile");
    }
  }, [user]);

  const handleGitHubLogin = async () => {
    try {
      await gitHubSignIn();
    } catch (error) {
      console.error("GitHub sign-in error:", error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setAuthError(null);
      await emailSignIn(email, password);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setAuthError("Invalid email or password");
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut();
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 sm:px-6">
      <div className="bg-white text-black rounded-xl p-8 w-full max-w-md shadow text-center">
        {user ? (
          <>
            <h1 className="text-2xl font-bold mb-4">
              Welcome, {user.displayName || user.email}
            </h1>
            <p className="mb-6 text-sm text-gray-600">{user.email}</p>
            <button
              onClick={handleLogout}
              className="w-full bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition"
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6">Login to Be Better</h1>

            {/* Email Login Form */}
            <form
              onSubmit={handleEmailLogin}
              className="space-y-4 mb-6 text-left"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <FaEyeSlash size={18} />
                    ) : (
                      <FaEye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {authError && <p className="text-red-500 text-sm">{authError}</p>}
              <button
                type="submit"
                className="w-full bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition"
              >
                Sign in with Email
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Continue with
                </span>
              </div>
            </div>

            {/* OAuth Providers */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={handleGitHubLogin}
                aria-label="Sign in with GitHub"
                className="flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-md hover:bg-gray-100 transition"
              >
                <FaGithub size={20} className="text-gray-800" />
                <span className="text-sm font-medium">GitHub</span>
              </button>
              <button
                onClick={handleGoogleLogin}
                aria-label="Sign in with Google"
                className="flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-md hover:bg-gray-100 transition"
              >
                <FaGoogle size={20} className="text-red-600" />
                <span className="text-sm font-medium">Google</span>
              </button>
            </div>

            {/* Sign Up Redirect */}
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-blue-600 hover:underline font-medium"
              >
                Sign Up
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
