"use client";

import { useUserAuth } from "../../_utils/auth-context";

export default function LoginPage() {
  const { user, gitHubSignIn, googleSignIn, firebaseSignOut } = useUserAuth();

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

  const handleLogout = async () => {
    try {
      await firebaseSignOut();
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="bg-white text-black rounded-xl p-8 w-full max-w-md shadow text-center">
        {user ? (
          <>
            <h1 className="text-2xl font-bold mb-4">
              Welcome, {user.displayName}
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
            <div className="space-y-4">
              <button
                onClick={handleGitHubLogin}
                className="w-full bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition"
              >
                Sign in with GitHub
              </button>
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition"
              >
                Sign in with Google
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
