"use client";

import type { PlanId } from "@/types";
import { PLANS } from "@/lib/subscription";

export function PlanBadge({ plan, className = "" }: { plan: PlanId; className?: string }) {
  const cfg = PLANS[plan];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.badgeClass} ${className}`}
    >
      {cfg.name}
    </span>
  );
}
