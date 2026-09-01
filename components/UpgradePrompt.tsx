"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

export function UpgradePrompt({
  title = "This is a paid feature",
  message = "Upgrade to a Trial, Monthly or Lifetime plan to unlock downloads and sharing.",
  className = "",
}: {
  title?: string;
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-start gap-1 rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 text-sm ${className}`}
    >
      <span className="flex items-center gap-2 font-semibold text-amber-300">
        <Lock size={14} /> {title}
      </span>
      <p className="text-amber-200/80">{message}</p>
      <Link
        href="/pricing"
        className="mt-1 text-xs font-semibold text-teal-accent hover:underline"
      >
        View plans →
      </Link>
    </div>
  );
}
