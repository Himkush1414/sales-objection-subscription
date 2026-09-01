import { NextResponse } from "next/server";
import type { SalesInput } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The thinking model takes ~25-30s. Vercel Hobby defaults to a 10s cap;
// 60 is the max allowed without enabling Fluid compute.
export const maxDuration = 60;

// Bump on every change to this file so a deployed build is visually verifiable:
// the marker appears in the error payload, the x-route-build header, and GET.
const ROUTE_BUILD = "gen-route/7";

// Abort the upstream AI call before Vercel kills the whole function, so the
// client always gets clean JSON instead of a platform timeout page.
const GEMINI_TIMEOUT_MS = 55_000;

type JsonBody = Record<string, unknown>;
function json(body: JsonBody, status = 200) {
  return NextResponse.json(
    { routeBuild: ROUTE_BUILD, ...body },
    { status, headers: { "x-route-build": ROUTE_BUILD } },
  );
}

/** Names + lengths + flags only — never the secret value. */
function envReport() {
  const rawKey = process.env.GEMINI_API_KEY;
  const rawPublic = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  return {
    routeBuild: ROUTE_BUILD,
    geminiEnvKeys: Object.keys(process.env)
      .filter((k) => /GEMINI/i.test(k))
      .sort(),
    GEMINI_API_KEY_defined: typeof rawKey === "string",
    GEMINI_API_KEY_length: rawKey?.length ?? 0,
    GEMINI_API_KEY_trimmed_length: rawKey?.trim().length ?? 0,
    NEXT_PUBLIC_GEMINI_API_KEY_defined: typeof rawPublic === "string",
    model: resolveModel(),
    vercelEnv: process.env.VERCEL_ENV ?? "(not on Vercel)",
    deploymentUrl: process.env.VERCEL_URL ?? null,
  };
}

/**
 * Diagnostic: open https://<site>/api/generate in a browser. Shows exactly what
 * this deployed function can see — no secrets, just presence/length/flags.
 */
export function GET() {
  const report = envReport();
  return json({ ok: report.GEMINI_API_KEY_trimmed_length > 0, ...report });
}

// Kept here (server-only) rather than in lib/gemini.ts so this route never
// pulls the client helper — which references window/localStorage and a
// relative fetch — into the serverless bundle.
const REPORT_SCHEMA_HINT = `Return ONLY valid JSON (no markdown fences) with this exact shape:
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

/**
 * Resolve the Gemini key at request time (never at module load, so it is read
 * from the live serverless environment). Trims whitespace and treats a blank
 * value as "not set".
 */
function resolveApiKey(): string | undefined {
  const raw = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function resolveModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
}

function buildPrompt(input: SalesInput, transcripts: string): string {
  return `You are a senior B2B sales strategist. You coach reps using two proprietary
frameworks:

- "Stab & Twist": first STAB — name the real emotion or fear hiding under the
  stated objection; then TWIST — reframe the conversation toward the cost of
  doing nothing.
- "6KLH": six short, deployable lines a rep can say, one each for Know, Like,
  Trust, Logic, Hope, and Urgency.

Build a Sales Intelligence Report for this situation:
- Selling: ${input.product}
- Target industry: ${input.industry}
- Business model: ${input.businessModel}
- Typical deal size: ${input.dealSize}
- Buyer type / persona: ${input.buyerType}

${
  transcripts
    ? `Use the following training transcripts as additional grounding for tone,
phrasing and objection patterns. Prefer their language where relevant:\n\n${transcripts}\n`
    : ""
}

${REPORT_SCHEMA_HINT}

Rupee amounts should look realistic for the stated deal size. Keep every string
tight and rep-ready — no fluff.`;
}

export async function POST(req: Request) {
  const key = resolveApiKey();
  if (!key) {
    const debug = envReport();
    console.error("[/api/generate] No usable Gemini API key:", JSON.stringify(debug));
    return json(
      {
        error:
          `[${ROUTE_BUILD}] Gemini API key not configured on the server. ` +
          "Locally: add GEMINI_API_KEY to .env.local and restart. " +
          "On Vercel: add GEMINI_API_KEY in Project Settings → Environment Variables " +
          "(Production + Preview), then redeploy — env-var changes only take effect on a new deployment. " +
          "Open /api/generate directly in a browser to see what this deployment can read.",
        debug,
      },
      500,
    );
  }

  let body: { input?: SalesInput; transcripts?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const { input, transcripts = "" } = body;
  if (!input || !input.product || !input.industry) {
    return json({ error: "Missing required fields." }, 400);
  }

  const model = resolveModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let geminiRes: Response;
  try {
    geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(input, transcripts) }] }],
        generationConfig: {
          // NOTE: gemini-3.6-flash does not accept custom sampling params.
          // temperature / topK / topP are silently ignored, and
          // frequencyPenalty / presencePenalty return a 400 — so none are sent.
          responseMimeType: "application/json",
          // 3.6-flash is a thinking model: reasoning shares this budget, so
          // keep it generous and hold thinking to "low" for structured output.
          maxOutputTokens: 8192,
          thinkingConfig: { thinkingLevel: "low" },
        },
      }),
    });
  } catch (err) {
    clearTimeout(timer);
    const timedOut = err instanceof Error && err.name === "AbortError";
    return json(
      {
        error: timedOut
          ? `The AI took longer than ${GEMINI_TIMEOUT_MS / 1000}s and was cancelled. Try again — it is usually faster on a warm function.`
          : "Could not reach the Gemini API.",
        elapsedMs: Date.now() - started,
      },
      timedOut ? 504 : 502,
    );
  }
  clearTimeout(timer);

  if (!geminiRes.ok) {
    const detail = await geminiRes.text();
    console.error(`[/api/generate] Gemini ${geminiRes.status}: ${detail.slice(0, 500)}`);
    return json(
      {
        error: `Gemini API error (${geminiRes.status}). ${detail.slice(0, 300)}`,
        geminiStatus: geminiRes.status,
        model,
      },
      502,
    );
  }

  const payload = await geminiRes.json();
  const text: string | undefined =
    payload?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ??
    payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const finish = payload?.candidates?.[0]?.finishReason;
    console.error(`[/api/generate] Empty text. finishReason=${finish}`, JSON.stringify(payload).slice(0, 500));
    return json(
      { error: `Gemini returned an empty response (finishReason: ${finish ?? "unknown"}).` },
      502,
    );
  }

  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  let report: unknown;
  try {
    report = JSON.parse(cleaned);
  } catch {
    return json({ error: "Could not parse the AI response. Please try again." }, 502);
  }

  return json({ report, elapsedMs: Date.now() - started });
}
