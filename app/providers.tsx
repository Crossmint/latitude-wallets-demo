"use client";

import {
  CrossmintProvider,
  CrossmintWalletProvider,
  useCrossmint,
  useWallet,
} from "@crossmint/client-sdk-react-ui";

const crossmintApiKey = process.env.NEXT_PUBLIC_CROSSMINT_API_KEY ?? "";

if (!crossmintApiKey) {
  throw new Error("NEXT_PUBLIC_CROSSMINT_API_KEY is not set");
}
import {
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createContext, useContext, useEffect, useState } from "react";

interface FirebaseAuthContextType {
  user: User | null;
  loading: boolean;
  googleSignIn: () => Promise<void>;
  logOut: () => Promise<void>;
  idToken: string | null;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType>({
  user: null,
  loading: true,
  googleSignIn: async () => {},
  logOut: async () => {},
  idToken: null,
});

export const useAuth = () => useContext(FirebaseAuthContext);

function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const { setJwt } = useCrossmint();
  const { getOrCreateWallet } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);

  // Google Sign In
  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  // Sign Out
  const logOut = async () => {
    try {
      await signOut(auth);
      setIdToken(null);
      setJwt(undefined);
      console.log("User logged out");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);

      try {
        if (currentUser) {
          // Get initial token
          const token = await currentUser.getIdToken();
          setIdToken(token);
          setJwt(token);
          console.log("User signed in, token obtained");

          // Set up token refresh interval (Firebase tokens expire after 1 hour)
          const tokenRefreshInterval = setInterval(async () => {
            try {
              const newToken = await currentUser.getIdToken(true); // Force refresh
              setIdToken(newToken);
              setJwt(newToken);
              console.log("Token refreshed");
            } catch (error) {
              console.error("Error refreshing token:", error);
            }
          }, 55 * 60 * 1000); // Refresh every 55 minutes (before 1-hour expiry)

          // Cleanup interval on unmount or user change
          return () => clearInterval(tokenRefreshInterval);
        }
        setIdToken(null);
        setJwt(undefined);
        console.log("No user signed in");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setJwt]);

  // Listen for token changes
  useEffect(() => {
    if (user) {
      // Listen for token changes
      const unsubscribe = auth.onIdTokenChanged(async (user) => {
        if (user) {
          console.log("User token changed");
          const token = await user.getIdToken();
          setIdToken(token);
          setJwt(token);
          await getOrCreateWallet({
            chain: "base-sepolia",
            signer: {
              type: "email",
              email: user?.email ?? "",
            },
          });
        }
      });

      return () => unsubscribe();
    }
  }, [user, setJwt, getOrCreateWallet]);

  return (
    <FirebaseAuthContext.Provider
      value={{ user, loading, googleSignIn, logOut, idToken }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CrossmintProvider apiKey={crossmintApiKey}>
      <CrossmintWalletProvider>
        <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
      </CrossmintWalletProvider>
    </CrossmintProvider>
  );
}
