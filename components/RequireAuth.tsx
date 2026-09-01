"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@/components/SessionProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-slate-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
