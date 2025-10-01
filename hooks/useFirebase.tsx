"use client";

import { useEffect, useState } from "react";
import { useCrossmint, useWallet } from "@crossmint/client-sdk-react-ui";
import type { User } from "firebase/auth";
import { onAuthStateChange } from "@/lib/firebase";

export const useFirebase = () => {
  const { getOrCreateWallet } = useWallet();

  const { setJwt } = useCrossmint();
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
        setJwt(token);
        await getOrCreateWallet({
          chain: "base-sepolia",
          signer: {
            type: "email",
            email: user?.email ?? "",
          },
        });
      } catch (error) {
        console.error("Failed to get Firebase JWT:", error);
        setJwt(undefined);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setJwt, getOrCreateWallet]);

  return {
    user,
    isLoading,
  };
};
