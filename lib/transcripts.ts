import type { Transcript } from "@/types";

// ---------------------------------------------------------------------------
// Admin-uploaded training transcripts, stored in localStorage and injected
// as extra context into every Gemini call.
// ---------------------------------------------------------------------------

const KEY = "sos_transcripts";
const ADMIN_KEY = "sos_admin_ok";
export const ADMIN_PASSWORD = "admin123";

export function getTranscripts(): Transcript[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Transcript[]) : [];
  } catch {
    return [];
  }
}

function save(list: Transcript[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("sos:transcripts"));
}

export function addTranscript(name: string, content: string): Transcript {
  const t: Transcript = {
    id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    content,
    uploadedAt: new Date().toISOString(),
    size: content.length,
  };
  save([t, ...getTranscripts()]);
  return t;
}

export function deleteTranscript(id: string): void {
  save(getTranscripts().filter((t) => t.id !== id));
}

/** Concatenated transcript text, trimmed to a sane size for the prompt. */
export function transcriptContext(maxChars = 12000): string {
  const all = getTranscripts()
    .map((t) => `--- Transcript: ${t.name} ---\n${t.content}`)
    .join("\n\n");
  return all.length > maxChars ? all.slice(0, maxChars) + "\n...[truncated]" : all;
}

// --- admin gate -----------------------------------------------------------

export function checkAdminPassword(pw: string): boolean {
  return pw === ADMIN_PASSWORD;
}

export function setAdminSession(ok: boolean): void {
  if (typeof window === "undefined") return;
  if (ok) sessionStorage.setItem(ADMIN_KEY, "1");
  else sessionStorage.removeItem(ADMIN_KEY);
}

export function hasAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ADMIN_KEY) === "1";
}
