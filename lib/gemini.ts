import type { SalesInput, SalesReport } from "@/types";
import { transcriptContext } from "@/lib/transcripts";

// ---------------------------------------------------------------------------
// Client-side helper. The API key stays on the server in /api/generate — this
// just forwards the form input plus any admin training transcripts.
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

// Shared JSON shape description, also used server-side.
export const REPORT_SCHEMA_HINT = `Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "headline": string,
  "summary": string,
  "objections": [
    {
      "objection": string,
      "category": "Price" | "Timing" | "Trust" | "Authority" | "Need" | "Competition" | "Risk",
      "whyItComesUp": string,
      "stab": string,          // the "Stab": name the real fear behind the objection
      "twist": string,         // the "Twist": reframe it toward the cost of inaction
      "sixKLH": [string, string, string, string, string, string], // 6 KLH moves: Know, Like, Trust, Logic, Hope, urgency-style lines
      "recommendedResponse": string
    }
  ],                            // exactly 5 objections
  "clientQuestions": [
    { "question": string, "suggestedAnswer": string, "followUp": string }
  ],                            // 5 items — smart questions the buyer should be asked / will ask
  "inactionCost": {
    "assumptions": [string],    // 3-4 plain-language assumptions with rough numbers
    "monthlyLoss": string,      // e.g. "₹3,20,000 / month"
    "yearlyLoss": string,
    "explanation": string
  },
  "playbook": {
    "discoveryQuestions": [string],   // 6 items
    "valueProps": [string],           // 4 items
    "closingLines": [string],         // 4 items
    "quickReference": [ { "objection": string, "oneLiner": string } ]  // 5 items
  }
}`;
