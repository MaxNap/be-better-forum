"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getAuth,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import toast from "react-hot-toast";

function EmailActionHandler() {
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

  // Strong password rule
  const isStrongPassword = (pw) => pw.length >= 8 && /\d/.test(pw);

  useEffect(() => {
    if (!mode || !oobCode) {
      setStatus("error");
      setMessage("❌ Invalid or missing link parameters.");
      return;
    }

    if (mode === "verifyEmail") {
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
      verifyPasswordResetCode(auth, oobCode)
        .then(() => setStatus("reset"))
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

    if (!isStrongPassword(newPassword)) {
      setPasswordError(
        "Password must be at least 8 characters and include a number."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      toast.success("✅ Password reset successful. You can now log in.");
      setStatus("success");
      setMessage("Password reset successful.");
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("❌ Failed to reset password.");
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
              Enter your new password below. It must be at least 8 characters
              and include a number.
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

export default function EmailActionPage() {
  return (
    <Suspense fallback={<p className="text-white p-4">Loading...</p>}>
      <EmailActionHandler />
    </Suspense>
  );
}
