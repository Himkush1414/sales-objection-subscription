import type {
  PlanConfig,
  PlanId,
  Subscription,
  UsageRecord,
} from "@/types";

// ---------------------------------------------------------------------------
// Plan catalogue
// ---------------------------------------------------------------------------

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Always Free",
    tokens: 3,
    price: 0,
    priceLabel: "₹0",
    badgeClass: "bg-slate-600/30 text-slate-300 border border-slate-500/40",
    tagline: "Kick the tyres — 3 reports every month.",
    perks: [
      "3 reports per month",
      "All 4 report tabs",
      "Quota resets on the 1st",
    ],
    features: { pdf: false, share: false },
  },
  trial: {
    id: "trial",
    name: "Free 1 Month Trial",
    tokens: 50,
    price: 0,
    priceLabel: "₹0",
    durationDays: 30,
    badgeClass: "bg-blue-500/20 text-blue-300 border border-blue-400/40",
    tagline: "Everything unlocked for 30 days.",
    perks: [
      "50 reports for 30 days",
      "PDF & text download",
      "WhatsApp & email sharing",
      "Auto-reverts to Always Free",
    ],
    features: { pdf: true, share: true },
  },
  monthly: {
    id: "monthly",
    name: "Monthly",
    tokens: 100,
    price: 999,
    priceLabel: "₹999",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40",
    tagline: "For working sales teams.",
    perks: [
      "100 reports per month",
      "PDF & text download",
      "WhatsApp & email sharing",
      "Priority generation",
    ],
    features: { pdf: true, share: true },
  },
  lifetime: {
    id: "lifetime",
    name: "Lifetime",
    tokens: null,
    price: 4999,
    priceLabel: "₹4,999",
    badgeClass: "bg-amber-500/20 text-amber-300 border border-amber-400/40",
    tagline: "Pay once. Use forever.",
    perks: [
      "Unlimited reports, forever",
      "PDF & text download",
      "WhatsApp & email sharing",
      "All future features included",
    ],
    features: { pdf: true, share: true },
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "trial", "monthly", "lifetime"];

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const subKey = (email: string) => `sos_sub_${email.toLowerCase()}`;
const usageKey = (email: string) => `sos_usage_${email.toLowerCase()}`;

function startOfMonthISO(d = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function defaultSubscription(): Subscription {
  return {
    plan: "free",
    tokensRemaining: PLANS.free.tokens ?? 0,
    periodStart: startOfMonthISO(),
  };
}

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

/**
 * Reads the subscription for a user, applying any pending monthly reset or
 * trial expiry, and persisting the result.
 */
export function getSubscription(email: string): Subscription {
  if (typeof window === "undefined") return defaultSubscription();

  let sub: Subscription;
  try {
    const raw = localStorage.getItem(subKey(email));
    sub = raw ? (JSON.parse(raw) as Subscription) : defaultSubscription();
  } catch {
    sub = defaultSubscription();
  }

  const now = new Date();
  let mutated = false;

  // 1. Trial expiry -> drop to Always Free
  if (sub.plan === "trial" && sub.trialEndsAt && now.getTime() > new Date(sub.trialEndsAt).getTime()) {
    sub = {
      plan: "free",
      tokensRemaining: PLANS.free.tokens ?? 0,
      periodStart: startOfMonthISO(now),
    };
    mutated = true;
  }

  // 2. Monthly quota reset (skip unlimited lifetime)
  const planCfg = PLANS[sub.plan];
  if (planCfg.tokens !== null && !sameMonth(new Date(sub.periodStart), now)) {
    sub.tokensRemaining = planCfg.tokens;
    sub.periodStart = startOfMonthISO(now);
    mutated = true;
  }

  if (mutated) saveSubscription(email, sub);
  return sub;
}

export function saveSubscription(email: string, sub: Subscription): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(subKey(email), JSON.stringify(sub));
  window.dispatchEvent(new Event("sos:subscription"));
}

export function planConfig(sub: Subscription): PlanConfig {
  return PLANS[sub.plan];
}

export function isUnlimited(sub: Subscription): boolean {
  return PLANS[sub.plan].tokens === null;
}

export function tokensLabel(sub: Subscription): string {
  return isUnlimited(sub) ? "∞" : String(Math.max(0, sub.tokensRemaining));
}

export function canGenerate(sub: Subscription): boolean {
  return isUnlimited(sub) || sub.tokensRemaining > 0;
}

export function canDownloadPdf(sub: Subscription): boolean {
  return PLANS[sub.plan].features.pdf;
}

export function canShare(sub: Subscription): boolean {
  return PLANS[sub.plan].features.share;
}

/** Consumes one token and records usage. Returns the updated subscription, or null if blocked. */
export function consumeToken(email: string, title: string): Subscription | null {
  const sub = getSubscription(email);
  if (!canGenerate(sub)) return null;

  if (!isUnlimited(sub)) {
    sub.tokensRemaining = Math.max(0, sub.tokensRemaining - 1);
  }
  saveSubscription(email, sub);

  addUsage(email, {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    title,
    tokensUsed: 1,
    plan: sub.plan,
  });

  return sub;
}

export function upgradeToPlan(email: string, plan: PlanId): Subscription {
  const cfg = PLANS[plan];
  const now = new Date();

  const sub: Subscription = {
    plan,
    tokensRemaining: cfg.tokens ?? Number.MAX_SAFE_INTEGER,
    periodStart: startOfMonthISO(now),
  };

  if (plan === "trial") {
    const end = new Date(now);
    end.setDate(end.getDate() + (cfg.durationDays ?? 30));
    sub.trialEndsAt = end.toISOString();
  }
  if (plan === "monthly" || plan === "lifetime") {
    sub.purchasedAt = now.toISOString();
  }

  saveSubscription(email, sub);
  return sub;
}

export function trialAlreadyUsed(email: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`sos_trial_used_${email.toLowerCase()}`) === "1";
}

export function markTrialUsed(email: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`sos_trial_used_${email.toLowerCase()}`, "1");
}

// ---------------------------------------------------------------------------
// Usage history
// ---------------------------------------------------------------------------

export function getUsage(email: string): UsageRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(usageKey(email));
    return raw ? (JSON.parse(raw) as UsageRecord[]) : [];
  } catch {
    return [];
  }
}

export function addUsage(email: string, record: UsageRecord): void {
  if (typeof window === "undefined") return;
  const list = getUsage(email);
  list.unshift(record);
  localStorage.setItem(usageKey(email), JSON.stringify(list.slice(0, 100)));
  window.dispatchEvent(new Event("sos:subscription"));
}

export function daysLeftInTrial(sub: Subscription): number | null {
  if (sub.plan !== "trial" || !sub.trialEndsAt) return null;
  const ms = new Date(sub.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
