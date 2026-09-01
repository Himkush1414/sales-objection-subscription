"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { PLAN_ORDER, PLANS } from "@/lib/subscription";
import { useSession } from "@/components/SessionProvider";
import { trialAlreadyUsed } from "@/lib/subscription";

export function SubscriptionModal({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  reason?: string;
}) {
  const router = useRouter();
  const { user, subscription } = useSession();

  if (!open) return null;

  const go = (planId: string) => {
    onClose();
    if (planId === "trial") {
      router.push("/pricing");
    } else {
      router.push(`/payment?plan=${planId}`);
    }
  };

  const options = PLAN_ORDER.filter((p) => p !== "free").filter((p) => {
    if (p === subscription?.plan) return false;
    if (p === "trial" && user && trialAlreadyUsed(user.email)) return false;
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-navy-950/80 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-accent/15 text-teal-accent">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-100">Upgrade to keep going</h2>
              {reason && <p className="text-sm text-slate-400">{reason}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-2.5">
          {options.map((id) => {
            const cfg = PLANS[id];
            return (
              <button
                key={id}
                onClick={() => go(id)}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-teal-accent/40 hover:bg-white/10"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-100">{cfg.name}</span>
                  <span className="block text-xs text-slate-400">{cfg.tagline}</span>
                </span>
                <span className="flex items-center gap-2 text-sm font-semibold text-teal-accent">
                  {cfg.price === 0 ? "Free" : cfg.priceLabel}
                  <ArrowRight size={15} />
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            onClose();
            router.push("/pricing");
          }}
          className="mt-4 w-full text-center text-xs font-medium text-slate-400 hover:text-slate-200"
        >
          Compare all plans
        </button>
      </div>
    </div>
  );
}
