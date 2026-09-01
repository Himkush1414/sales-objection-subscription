"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import type { SalesInput } from "@/types";
import { useSession } from "@/components/SessionProvider";
import { generateReport, saveLastReport } from "@/lib/gemini";
import { consumeToken } from "@/lib/subscription";
import { SubscriptionModal } from "@/components/SubscriptionModal";

const BUSINESS_MODELS = [
  "B2B SaaS",
  "B2B Services",
  "B2C Product",
  "Marketplace",
  "Enterprise / On-prem",
  "Agency / Consulting",
  "D2C / E-commerce",
];

const BUYER_TYPES = [
  "Founder / CEO",
  "VP / Head of Department",
  "Mid-level Manager",
  "Procurement",
  "Technical Evaluator",
  "End User / Individual",
];

const DEAL_SIZES = [
  "Under ₹50,000",
  "₹50,000 – ₹2,00,000",
  "₹2,00,000 – ₹10,00,000",
  "₹10,00,000 – ₹50,00,000",
  "₹50,00,000+",
];

const EMPTY: SalesInput = {
  product: "",
  industry: "",
  businessModel: BUSINESS_MODELS[0],
  dealSize: DEAL_SIZES[1],
  buyerType: BUYER_TYPES[0],
};

export function SalesForm() {
  const router = useRouter();
  const { user, canGenerate } = useSession();
  const [form, setForm] = useState<SalesInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const set = <K extends keyof SalesInput>(k: K, v: SalesInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      router.push("/login");
      return;
    }
    if (!canGenerate) {
      setModalOpen(true);
      return;
    }

    setBusy(true);
    try {
      const report = await generateReport(form);
      const title = `${form.product.slice(0, 40)} → ${form.industry.slice(0, 30)}`;
      const updated = consumeToken(user.email, title);
      if (!updated) {
        setModalOpen(true);
        return;
      }
      saveLastReport(report);
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form onSubmit={submit} className="card space-y-5 p-5 sm:p-6">
        <div>
          <label className="label" htmlFor="product">
            What are you selling?
          </label>
          <textarea
            id="product"
            required
            rows={2}
            className="input-field resize-none"
            placeholder="e.g. An AI-powered workforce scheduling platform for hospitals"
            value={form.product}
            onChange={(e) => set("product", e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="industry">
            Target industry
          </label>
          <input
            id="industry"
            required
            className="input-field"
            placeholder="e.g. Healthcare, Manufacturing, Fintech"
            value={form.industry}
            onChange={(e) => set("industry", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="businessModel">
              Business model
            </label>
            <select
              id="businessModel"
              className="input-field"
              value={form.businessModel}
              onChange={(e) => set("businessModel", e.target.value)}
            >
              {BUSINESS_MODELS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="dealSize">
              Typical deal size
            </label>
            <select
              id="dealSize"
              className="input-field"
              value={form.dealSize}
              onChange={(e) => set("dealSize", e.target.value)}
            >
              {DEAL_SIZES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="buyerType">
            Buyer type
          </label>
          <select
            id="buyerType"
            className="input-field"
            value={form.buyerType}
            onChange={(e) => set("buyerType", e.target.value)}
          >
            {BUYER_TYPES.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {busy ? "Generating report…" : "Generate Sales Intelligence Report"}
        </button>
        {!user && (
          <p className="text-xs text-slate-500">You&apos;ll be asked to log in first. 1 token per report.</p>
        )}
      </form>

      <SubscriptionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        reason="You&apos;re out of tokens for this period."
      />
    </>
  );
}
