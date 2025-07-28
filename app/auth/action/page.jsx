"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getAuth,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";

export default function EmailActionPage() {
  const auth = getAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Processing...");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!mode || !oobCode) {
      setStatus("error");
      setMessage("❌ Invalid or missing link parameters.");
      return;
    }

    if (mode === "verifyEmail") {
      // Verify Email Flow
      applyActionCode(auth, oobCode)
        .then(() => {
          setStatus("success");
          setMessage("✅ Email successfully verified! You can now log in.");
        })
        .catch((error) => {
          console.error("Email verification error:", error);
          setStatus("error");
          setMessage(
            "❌ Verification failed. The link may be expired or invalid."
          );
        });
    } else if (mode === "resetPassword") {
      // Pre-validate password reset link
      verifyPasswordResetCode(auth, oobCode)
        .then(() => {
          setStatus("reset");
        })
        .catch((error) => {
          console.error("Password reset validation error:", error);
          setStatus("error");
          setMessage("❌ Password reset link is invalid or expired.");
        });
    } else {
      setStatus("error");
      setMessage("❌ Unsupported action.");
    }
  }, [mode, oobCode]);

  const handleResetPassword = async () => {
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus("success");
      setMessage("✅ Password successfully reset! You can now log in.");
    } catch (error) {
      console.error("Reset error:", error);
      setPasswordError("Failed to reset password. Try again.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="bg-white text-black p-6 rounded-xl text-center shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Account Action</h1>

        {status === "loading" && <p className="text-lg">{message}</p>}

        {status === "success" && (
          <>
            <p className="text-lg mb-4">{message}</p>
            <button
              onClick={() => router.push("/login")}
              className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
            >
              Go to Login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <p className="text-red-600 text-lg mb-4">{message}</p>
            <button
              onClick={() => router.push("/")}
              className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
            >
              Go Home
            </button>
          </>
        )}

        {status === "reset" && (
          <div className="text-left space-y-4">
            <p className="text-sm text-gray-600">
              Enter your new password below.
            </p>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            {passwordError && (
              <p className="text-red-600 text-sm">{passwordError}</p>
            )}
            <button
              onClick={handleResetPassword}
              className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
            >
              Reset Password
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
