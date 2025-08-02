"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getAuth,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "sonner";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isStrongPassword = (pw) => pw.length >= 8 && /\d/.test(pw);

  useEffect(() => {
    if (!mode || !oobCode) {
      setStatus("error");
      setMessage("Invalid or missing link parameters.");
      return;
    }

    if (mode === "verifyEmail") {
      applyActionCode(auth, oobCode)
        .then(() => {
          setStatus("success");
          setMessage("Email successfully verified! You can now log in.");
        })
        .catch((error) => {
          console.error("Email verification error:", error);
          setStatus("error");
          setMessage(
            "Verification failed. The link may be expired or invalid."
          );
        });
    } else if (mode === "resetPassword") {
      verifyPasswordResetCode(auth, oobCode)
        .then(() => setStatus("reset"))
        .catch((error) => {
          console.error("Password reset validation error:", error);
          setStatus("error");
          setMessage("Password reset link is invalid or expired.");
        });
    } else {
      setStatus("error");
      setMessage("Unsupported action.");
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
      toast.success("Password reset successful.");
      setStatus("success");
      setMessage("Password reset successful.");
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("Failed to reset password.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="bg-white text-black p-6 rounded-xl text-center shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">
          {mode === "verifyEmail" ? "Email Verification" : "Password Reset"}
        </h1>

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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleResetPassword();
            }}
            className="text-left space-y-4"
          >
            <p className="text-sm text-gray-600">
              Enter your new password. It must be at least 8 characters and
              include a number.
            </p>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium mb-1"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded pr-10"
                  placeholder="New password"
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
              <ul className="text-sm mt-2 space-y-1">
                <li
                  className={
                    newPassword.length >= 8 ? "text-green-600" : "text-gray-500"
                  }
                >
                  At least 8 characters
                </li>
                <li
                  className={
                    /\d/.test(newPassword) ? "text-green-600" : "text-gray-500"
                  }
                >
                  Contains a number
                </li>
              </ul>
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded pr-10"
                  placeholder="Confirm password"
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
                    newPassword === confirmPassword
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {newPassword === confirmPassword
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              )}
            </div>

            {passwordError && (
              <p className="text-red-600 text-sm">{passwordError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition"
            >
              Reset Password
            </button>
          </form>
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
