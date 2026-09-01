"use client";

import Link from "next/link";
import { Coins, Infinity as InfinityIcon } from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { tokensLabel } from "@/lib/subscription";

export function TokenCounter() {
  const { subscription, unlimited } = useSession();
  if (!subscription) return null;

  const low = !unlimited && subscription.tokensRemaining <= 1;

  return (
    <Link
      href="/dashboard"
      title="Tokens remaining this period"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
        low
          ? "border-rose-400/40 bg-rose-500/15 text-rose-300"
          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
      }`}
    >
      {unlimited ? <InfinityIcon size={14} /> : <Coins size={14} />}
      <span>{unlimited ? "Unlimited" : `${tokensLabel(subscription)} tokens`}</span>
    </Link>
  );
}
