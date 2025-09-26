"use client";

import { useRef } from "react";
import { useWallet } from "@crossmint/client-sdk-react-ui";
import { LandingPage } from "@/components/landing-page";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { Dashboard } from "@/components/dashboard";
import { useAuth } from "@/app/providers";

export default function Home() {
  const { wallet, status: walletStatus } = useWallet();
  const { user, loading } = useAuth();
  const nodeRef = useRef(null);
  console.log("user", user);
  console.log("wallet", wallet);

  const isLoggedIn = wallet != null && user !== null;
  const isLoading = walletStatus === "in-progress" || loading;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <SwitchTransition mode="out-in">
          <CSSTransition
            key={isLoggedIn ? "dashboard" : "landing"}
            nodeRef={nodeRef}
            timeout={400}
            classNames="page-transition"
            unmountOnExit
          >
            <div ref={nodeRef}>
              {isLoggedIn ? (
                <Dashboard />
              ) : (
                <LandingPage isLoading={isLoading} />
              )}
            </div>
          </CSSTransition>
        </SwitchTransition>
      </main>
    </div>
  );
}
