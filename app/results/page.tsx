"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { SalesReport } from "@/types";
import { loadLastReport } from "@/lib/gemini";
import { RequireAuth } from "@/components/RequireAuth";
import { ReportOutput } from "@/components/ReportOutput";

export default function ResultsPage() {
  return (
    <RequireAuth>
      <ResultsInner />
    </RequireAuth>
  );
}

function ResultsInner() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReport(loadLastReport());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-slate-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto mt-16 max-w-md text-center">
        <h1 className="text-lg font-bold text-slate-100">No report yet</h1>
        <p className="mt-2 text-sm text-slate-400">
          Generate a Sales Intelligence Report to see it here.
        </p>
        <Link href="/" className="btn-primary mt-5 inline-flex">
          Start an analysis
        </Link>
      </div>
    );
  }

  return <ReportOutput report={report} />;
}
