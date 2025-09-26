"use client";

import { signInWithGoogle } from "@/lib/firebase";
import Image from "next/image";

export function LoginButton() {
  return (
    <button
      type="button"
      className="flex items-center gap-2 py-2 px-3 rounded-full text-sm m-auto font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
      onClick={signInWithGoogle}
    >
      Sign in with Google
      <Image src="/log-in.svg" alt="Login" width={16} height={16} />
    </button>
  );
}
