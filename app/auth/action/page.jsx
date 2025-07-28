"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAuth, applyActionCode } from "firebase/auth";

export default function EmailActionPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    if (mode === "verifyEmail" && oobCode) {
      const auth = getAuth();
      applyActionCode(auth, oobCode)
        .then(() => {
          setMessage("✅ Email successfully verified! You can now log in.");
        })
        .catch((error) => {
          console.error(error);
          setMessage(
            "❌ Verification failed. The link may be expired or invalid."
          );
        });
    } else {
      setMessage("❌ Invalid or unsupported action.");
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="bg-white text-black p-6 rounded-xl text-center shadow max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
        <p className="text-lg">{message}</p>
      </div>
    </main>
  );
}
