"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { PlanId } from "@/types";
import { PLANS } from "@/lib/subscription";
import { RequireAuth } from "@/components/RequireAuth";
import { PaymentForm } from "@/components/PaymentForm";

const PAID: PlanId[] = ["monthly", "lifetime"];

function PaymentInner() {
  const params = useSearchParams();
  const raw = params.get("plan") as PlanId | null;
  const plan: PlanId = raw && PAID.includes(raw) ? raw : "monthly";

  return (
    <div>
      <h1 className="sr-only">Checkout — {PLANS[plan].name}</h1>
      <PaymentForm plan={plan} />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <PaymentInner />
      </Suspense>
    </RequireAuth>
  );
}
