"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Coins, History, Infinity as InfinityIcon, User2 } from "lucide-react";
import type { UsageRecord } from "@/types";
import { useSession } from "@/components/SessionProvider";
import { RequireAuth } from "@/components/RequireAuth";
import { PlanBadge } from "@/components/PlanBadge";
import {
  PLANS,
  daysLeftInTrial,
  getUsage,
  tokensLabel,
} from "@/lib/subscription";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}

function DashboardInner() {
  const { user, subscription, plan, unlimited } = useSession();
  const [usage, setUsage] = useState<UsageRecord[]>([]);

  useEffect(() => {
    if (user) setUsage(getUsage(user.email));
  }, [user]);

  if (!user || !subscription || !plan) return null;

  const trialDays = daysLeftInTrial(subscription);
  const quota = plan.tokens;
  const used = quota === null ? 0 : quota - subscription.tokensRemaining;
  const pct = quota === null ? 100 : Math.max(0, Math.min(100, (subscription.tokensRemaining / quota) * 100));

  return (
    <div className="space-y-5 py-4">
      <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Account */}
        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-400">
            <User2 size={15} />
            <span className="text-xs font-semibold uppercase tracking-wide">Account</span>
          </div>
          <p className="mt-3 font-semibold text-slate-100">{user.name || "—"}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
          <p className="mt-2 text-xs text-slate-500">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Plan */}
        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-400">
            <CalendarClock size={15} />
            <span className="text-xs font-semibold uppercase tracking-wide">Current plan</span>
          </div>
          <div className="mt-3">
            <PlanBadge plan={subscription.plan} />
          </div>
          <p className="mt-2 text-sm text-slate-400">{plan.tagline}</p>
          {trialDays !== null && (
            <p className="mt-2 text-xs font-medium text-blue-300">
              {trialDays} day{trialDays === 1 ? "" : "s"} left · then reverts to Always Free
            </p>
          )}
          {subscription.plan !== "lifetime" && (
            <Link href="/pricing" className="btn-primary mt-4 inline-flex !px-3 !py-1.5 text-xs">
              {subscription.plan === "free" ? "Upgrade" : "Change plan"}
            </Link>
          )}
        </div>

        {/* Tokens */}
        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-400">
            {unlimited ? <InfinityIcon size={15} /> : <Coins size={15} />}
            <span className="text-xs font-semibold uppercase tracking-wide">Tokens</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-100">
            {tokensLabel(subscription)}
            {quota !== null && <span className="text-sm font-medium text-slate-500"> / {quota}</span>}
          </p>
          {quota !== null ? (
            <>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${pct <= 20 ? "bg-rose-400" : "bg-teal-accent"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {used} used this period · resets on the 1st
              </p>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Unlimited reports — no monthly cap</p>
          )}
        </div>
      </div>

      {/* Usage history */}
      <div className="card">
        <div className="flex items-center gap-2 border-b border-white/10 p-4 text-slate-400">
          <History size={15} />
          <span className="text-xs font-semibold uppercase tracking-wide">Usage history</span>
        </div>
        {usage.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No reports yet.{" "}
            <Link href="/" className="font-semibold text-teal-accent hover:underline">
              Generate your first one
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {usage.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-slate-200">{u.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleString()} · {PLANS[u.plan].name}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-slate-400">
                  −{u.tokensUsed} token
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
