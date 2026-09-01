"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Minus } from "lucide-react";
import type { PlanId } from "@/types";
import {
  PLAN_ORDER,
  PLANS,
  markTrialUsed,
  trialAlreadyUsed,
  upgradeToPlan,
} from "@/lib/subscription";
import { useSession } from "@/components/SessionProvider";

const FEATURE_ROWS: { label: string; get: (p: PlanId) => string | boolean }[] = [
  { label: "Monthly report quota", get: (p) => (PLANS[p].tokens === null ? "Unlimited" : `${PLANS[p].tokens}`) },
  { label: "All 4 report tabs", get: () => true },
  { label: "PDF & text download", get: (p) => PLANS[p].features.pdf },
  { label: "WhatsApp & email sharing", get: (p) => PLANS[p].features.share },
  { label: "Full access duration", get: (p) => (p === "trial" ? "30 days" : p === "free" ? "—" : "Ongoing") },
  { label: "Price", get: (p) => (PLANS[p].price === 0 ? "Free" : `${PLANS[p].priceLabel}${p === "monthly" ? " / mo" : ""}`) },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, subscription, refresh } = useSession();
  const [busy, setBusy] = useState<PlanId | null>(null);

  const act = (plan: PlanId) => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (plan === subscription?.plan) return;

    if (plan === "free") {
      setBusy(plan);
      upgradeToPlan(user.email, "free");
      refresh();
      setBusy(null);
      return;
    }

    if (plan === "trial") {
      if (trialAlreadyUsed(user.email)) return;
      setBusy(plan);
      upgradeToPlan(user.email, "trial");
      markTrialUsed(user.email);
      refresh();
      setBusy(null);
      router.push("/dashboard");
      return;
    }

    router.push(`/payment?plan=${plan}`);
  };

  const ctaLabel = (plan: PlanId): string => {
    if (plan === subscription?.plan) return "Current plan";
    if (plan === "trial" && user && trialAlreadyUsed(user.email)) return "Trial used";
    if (plan === "free") return "Switch to Free";
    if (plan === "trial") return "Start 30-day trial";
    return `Get ${PLANS[plan].name}`;
  };

  const ctaDisabled = (plan: PlanId) =>
    plan === subscription?.plan || (plan === "trial" && !!user && trialAlreadyUsed(user.email));

  return (
    <div className="py-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">Plans &amp; pricing</h1>
        <p className="mt-2 text-sm text-slate-400">
          Every plan uses the same engine. Paid plans unlock exports, sharing and more tokens.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((id) => {
          const cfg = PLANS[id];
          const current = id === subscription?.plan;
          return (
            <div
              key={id}
              className={`card flex flex-col p-5 ${
                current ? "border-teal-accent/50 ring-1 ring-teal-accent/30" : ""
              } ${id === "lifetime" ? "md:col-span-2 xl:col-span-1" : ""}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-100">{cfg.name}</h2>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.badgeClass}`}>
                  {cfg.price === 0 ? "Free" : cfg.priceLabel}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{cfg.tagline}</p>

              <div className="mt-3 text-2xl font-bold text-slate-100">
                {cfg.price === 0 ? "₹0" : cfg.priceLabel}
                <span className="text-sm font-medium text-slate-500">
                  {id === "monthly" ? " / month" : id === "lifetime" ? " once" : ""}
                </span>
              </div>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-300">
                {cfg.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Check size={15} className="mt-0.5 shrink-0 text-teal-accent" />
                    {perk}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => act(id)}
                disabled={ctaDisabled(id) || busy === id}
                className={`mt-5 w-full ${current ? "btn-ghost" : "btn-primary"}`}
              >
                {busy === id && <Loader2 size={15} className="animate-spin" />}
                {ctaLabel(id)}
              </button>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="card mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-slate-400">
              <th className="p-4 font-medium">Feature</th>
              {PLAN_ORDER.map((id) => (
                <th key={id} className="p-4 font-semibold text-slate-200">
                  {PLANS[id].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURE_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-white/5 last:border-0">
                <td className="p-4 text-slate-400">{row.label}</td>
                {PLAN_ORDER.map((id) => {
                  const val = row.get(id);
                  return (
                    <td key={id} className="p-4 text-slate-200">
                      {typeof val === "boolean" ? (
                        val ? (
                          <Check size={16} className="text-teal-accent" />
                        ) : (
                          <Minus size={16} className="text-slate-600" />
                        )
                      ) : (
                        val
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!user && (
        <p className="mt-6 text-center text-sm text-slate-400">
          <button
            onClick={() => router.push("/signup")}
            className="font-semibold text-teal-accent hover:underline"
          >
            Create an account
          </button>{" "}
          to choose a plan.
        </p>
      )}
    </div>
  );
}
