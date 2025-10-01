"use client";

import { useEffect, useState } from "react";
import { useCrossmint, useWallet } from "@crossmint/client-sdk-react-ui";
import type { User } from "firebase/auth";
import { onAuthStateChange } from "@/lib/firebase";

export const useFirebase = () => {
  const { getOrCreateWallet } = useWallet();

  const { experimental_setCustomAuth } = useCrossmint();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);
      if (user == null) {
        setIsLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        experimental_setCustomAuth({
          email: user?.email ?? "",
          jwt: token,
        });
        await getOrCreateWallet({
          chain: "base-sepolia",
          signer: {
            type: "email",
            email: user?.email ?? "",
          },
        });
      } catch (error) {
        console.error("Failed to get Firebase JWT:", error);
        experimental_setCustomAuth(undefined);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [experimental_setCustomAuth, getOrCreateWallet]);

  return {
    user,
    isLoading,
  };
};
