import Link from "next/link";
import { SalesForm } from "@/components/SalesForm";

export default function HomePage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
      <section className="pt-4">
        <p className="mb-3 inline-flex items-center rounded-full border border-teal-accent/30 bg-teal-accent/10 px-3 py-1 text-xs font-semibold text-teal-accent">
          Stab &amp; Twist · 6KLH
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-100 sm:text-4xl">
          Turn every objection into a reason to buy.
        </h1>
        <p className="mt-4 max-w-md text-slate-400">
          Describe your deal and get a full Sales Intelligence Report — the objections you&apos;ll
          hear, the questions to ask, the real cost of inaction, and a closing playbook your reps
          can use today.
        </p>

        <ul className="mt-6 space-y-2 text-sm text-slate-300">
          {[
            "5 predicted objections with Stab & Twist reframes",
            "6KLH lines for Know, Like, Trust, Logic, Hope, Urgency",
            "Inaction Cost Calculator with rupee impact",
            "Discovery questions and battle-tested closers",
          ].map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-accent" />
              {f}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs text-slate-500">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-teal-accent hover:underline">
            Create a free account
          </Link>{" "}
          — 3 reports every month, no card needed.
        </p>
      </section>

      <section>
        <SalesForm />
      </section>
    </div>
  );
}
