import { NextResponse } from "next/server";
import { REPORT_SCHEMA_HINT } from "@/lib/gemini";
import type { SalesInput } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

function apiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || undefined;
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
  const key = apiKey();
  if (!key) {
    return NextResponse.json(
      { error: "Gemini API key not configured. Add GEMINI_API_KEY to .env.local." },
      { status: 500 },
    );
  }

  let body: { input?: SalesInput; transcripts?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { input, transcripts = "" } = body;
  if (!input || !input.product || !input.industry) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(input, transcripts) }] }],
        generationConfig: {
          temperature: 0.8,
          responseMimeType: "application/json",
          maxOutputTokens: 4096,
        },
      }),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the Gemini API." }, { status: 502 });
  }

  if (!geminiRes.ok) {
    const detail = await geminiRes.text();
    return NextResponse.json(
      { error: `Gemini API error (${geminiRes.status}). ${detail.slice(0, 300)}` },
      { status: 502 },
    );
  }

  const payload = await geminiRes.json();
  const text: string | undefined =
    payload?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ??
    payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 502 });
  }

  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  let report: unknown;
  try {
    report = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: "Could not parse the AI response. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ report });
}
