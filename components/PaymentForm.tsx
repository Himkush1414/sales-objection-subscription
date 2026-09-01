"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import type { PlanId } from "@/types";
import { PLANS, upgradeToPlan } from "@/lib/subscription";
import { useSession } from "@/components/SessionProvider";

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.4 + Math.random() * 2,
        color: ["#2dd4bf", "#38bdf8", "#f59e0b", "#f472b6", "#a3e635"][i % 5],
        size: 6 + Math.random() * 8,
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block animate-confetti-fall rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export function PaymentForm({ plan }: { plan: PlanId }) {
  const router = useRouter();
  const { user, refresh } = useSession();
  const cfg = PLANS[plan];

  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    setStatus("processing");
    // Mock gateway — any input is approved after a short delay.
    setTimeout(() => {
      upgradeToPlan(user.email, plan);
      refresh();
      setStatus("done");
    }, 2000);
  };

  if (status === "done") {
    return (
      <>
        <Confetti />
        <div className="mx-auto mt-12 max-w-md text-center">
          <CheckCircle2 size={56} className="mx-auto text-teal-accent" />
          <h1 className="mt-4 text-2xl font-bold text-slate-100">Payment successful</h1>
          <p className="mt-2 text-sm text-slate-400">
            You&apos;re now on the <span className="font-semibold text-slate-200">{cfg.name}</span> plan.
            {cfg.tokens === null
              ? " Enjoy unlimited reports, forever."
              : ` ${cfg.tokens} tokens have been added to your account.`}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => router.push("/")} className="btn-primary">
              Generate a report
            </button>
            <button onClick={() => router.push("/dashboard")} className="btn-ghost">
              View dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="mx-auto mt-8 grid max-w-3xl gap-5 md:grid-cols-[1.2fr_1fr]">
      <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-slate-100">
          <CreditCard size={18} className="text-teal-accent" />
          <h1 className="text-lg font-bold">Payment details</h1>
        </div>
        <p className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
          Demo checkout — no real gateway. Any card details are approved.
        </p>

        <div>
          <label className="label" htmlFor="name">Name on card</label>
          <input id="name" required className="input-field" value={name}
            onChange={(e) => setName(e.target.value)} placeholder="Alex Rao" />
        </div>
        <div>
          <label className="label" htmlFor="card">Card number</label>
          <input id="card" required inputMode="numeric" className="input-field font-mono tracking-wider"
            value={card} onChange={(e) => setCard(formatCard(e.target.value))}
            placeholder="4242 4242 4242 4242" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="expiry">Expiry</label>
            <input id="expiry" required className="input-field font-mono" value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" />
          </div>
          <div>
            <label className="label" htmlFor="cvv">CVV</label>
            <input id="cvv" required inputMode="numeric" className="input-field font-mono"
              value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="123" />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={status === "processing"}>
          {status === "processing" ? (
            <><Loader2 size={16} className="animate-spin" /> Processing payment…</>
          ) : (
            <><Lock size={15} /> Pay {cfg.priceLabel}{plan === "monthly" ? " / month" : ""}</>
          )}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck size={13} /> Mock 256-bit encryption · nothing is charged
        </p>
      </form>

      <aside className="card h-fit p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Order summary</h2>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-semibold text-slate-100">{cfg.name}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.badgeClass}`}>
            {plan === "lifetime" ? "One-time" : "Monthly"}
          </span>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
          {cfg.perks.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-teal-accent" /> {p}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-slate-100">
          <span className="text-sm text-slate-400">Total due</span>
          <span className="text-lg font-bold">
            {cfg.priceLabel}
            {plan === "monthly" && <span className="text-xs font-medium text-slate-500"> / mo</span>}
          </span>
        </div>
      </aside>
    </div>
  );
}
