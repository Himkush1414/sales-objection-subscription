import type { SalesInput, SalesReport } from "@/types";
import { transcriptContext } from "@/lib/transcripts";

// ---------------------------------------------------------------------------
// Client-side helper. The API key stays on the server in /api/generate — this
// just forwards the form input plus any admin training transcripts.
// The Gemini prompt / response schema lives in app/api/generate/route.ts so it
// is never bundled into client code.
// ---------------------------------------------------------------------------

export async function generateReport(input: SalesInput): Promise<SalesReport> {
  let res: Response;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, transcripts: transcriptContext() }),
    });
  } catch {
    throw new Error("Network error reaching /api/generate. Check your connection and try again.");
  }

  const build = res.headers.get("x-route-build") || "?";
  const raw = await res.text();

  // The server always replies with JSON. A non-JSON body here means the
  // response came from the platform, not our route — almost always a Vercel
  // function timeout (the AI call is slow) or a 404 on an old deployment.
  let data: { report?: unknown; error?: string; debug?: unknown } | null = null;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `Server returned a non-JSON ${res.status} response (build ${build}). ` +
        (res.status === 504 || res.status === 408
          ? "The report generation timed out on the server."
          : raw.slice(0, 200)),
    );
  }

  if (!res.ok) {
    if (data?.debug) console.error("[/api/generate] error debug:", data.debug);
    throw new Error(data?.error || `Report generation failed (${res.status}, build ${build}).`);
  }

  return { ...(data!.report as SalesReport), generatedAt: new Date().toISOString(), input };
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
