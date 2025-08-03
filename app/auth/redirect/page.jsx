"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function RedirectPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    signIn("google", { callbackUrl });
  }, [callbackUrl]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
      <p>Please wait while we redirect you to sign in with Google.</p>
    </div>
  );
}
