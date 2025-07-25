"use client";

import Link from "next/link";
import { useUserAuth } from "../_utils/auth-context";

export default function Navbar() {
  const { user, firebaseSignOut } = useUserAuth();

  const handleLogout = async () => {
    try {
      await firebaseSignOut();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav className="w-full bg-black text-white py-4 px-6 flex justify-between items-center border-b border-gray-800">
      {/* Logo / Home */}
      <Link href="/" className="text-xl font-bold tracking-wide">
        BE BETTER FORUM
      </Link>

      {/* Right Nav Actions */}
      <div className="space-x-4 text-sm font-medium flex items-center">
        <Link href="/feed" className="hover:text-gray-300">
          Posts
        </Link>
        {user ? (
          <>
            <Link href="/profile" className="hover:text-gray-300">
              Profile
            </Link>
            <span className="text-gray-400 hidden sm:inline">
              Hi, {user.displayName || "User"}
            </span>
            <button
              onClick={handleLogout}
              className="bg-white text-black px-3 py-1 rounded hover:bg-gray-200 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="hover:text-gray-300">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
