"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PlanConfig, Subscription, User } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import {
  canDownloadPdf,
  canGenerate,
  canShare,
  getSubscription,
  isUnlimited,
  planConfig,
} from "@/lib/subscription";

interface SessionValue {
  user: User | null;
  subscription: Subscription | null;
  plan: PlanConfig | null;
  loading: boolean;
  unlimited: boolean;
  canGenerate: boolean;
  canDownloadPdf: boolean;
  canShare: boolean;
  refresh: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const u = getCurrentUser();
    setUser(u);
    setSubscription(u ? getSubscription(u.email) : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("sos:auth", onChange);
    window.addEventListener("sos:subscription", onChange);
    window.addEventListener("storage", onChange);
    window.addEventListener("focus", onChange);
    return () => {
      window.removeEventListener("sos:auth", onChange);
      window.removeEventListener("sos:subscription", onChange);
      window.removeEventListener("storage", onChange);
      window.removeEventListener("focus", onChange);
    };
  }, [refresh]);

  const value = useMemo<SessionValue>(() => {
    return {
      user,
      subscription,
      plan: subscription ? planConfig(subscription) : null,
      loading,
      unlimited: subscription ? isUnlimited(subscription) : false,
      canGenerate: subscription ? canGenerate(subscription) : false,
      canDownloadPdf: subscription ? canDownloadPdf(subscription) : false,
      canShare: subscription ? canShare(subscription) : false,
      refresh,
    };
  }, [user, subscription, loading, refresh]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
