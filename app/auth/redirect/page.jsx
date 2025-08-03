"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function RedirectPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    signIn("google", { callbackUrl });
  }, [callbackUrl]);

  return (
    <div className="h-screen bg-[#0f0e0e] flex flex-col items-center justify-center text-white">
      <div className="bg-[#181818] rounded-lg p-6 md:p-8 flex flex-col items-center shadow-lg">
        <div className="w-12 h-12 relative mb-4">
          <svg
            className="animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <h1 className="text-xl md:text-2xl font-semibold mb-2">
          Redirecting to Google Sign-In
        </h1>
        <p className="text-sm md:text-base text-gray-400 text-center">
          Please wait while we securely redirect you to sign in with Google.
        </p>
      </div>
    </div>
  );
}
