import type { SalesInput, SalesReport } from "@/types";
import { transcriptContext } from "@/lib/transcripts";

// ---------------------------------------------------------------------------
// Client-side helper. The API key stays on the server in /api/generate — this
// just forwards the form input plus any admin training transcripts.
// The Gemini prompt / response schema lives in app/api/generate/route.ts so it
// is never bundled into client code.
// ---------------------------------------------------------------------------

export async function generateReport(input: SalesInput): Promise<SalesReport> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, transcripts: transcriptContext() }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Report generation failed. Please try again.");
  }

  return { ...(data.report as SalesReport), generatedAt: new Date().toISOString(), input };
}

// --- last-report persistence (so /results survives a refresh) ---------------

const LAST_REPORT_KEY = "sos_last_report";

export function saveLastReport(report: SalesReport): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_REPORT_KEY, JSON.stringify(report));
}

export function loadLastReport(): SalesReport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_REPORT_KEY);
    return raw ? (JSON.parse(raw) as SalesReport) : null;
  } catch {
    return null;
  }
}
