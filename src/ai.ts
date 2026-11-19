/* Optional AI layer (Google Gemini through our own proxy, see /worker).
   The on-device matcher picks candidate articles; the AI may only choose among them and
   add a short, clearly labelled answer. Any failure → the site keeps the offline result. */
import { ART } from "./data";

const aiUrl = (): string => import.meta.env.VITE_AI_URL || "";
export const aiAvailable = () => !!aiUrl();

export interface AiReply { arts: number[]; answer: string }

export async function askAI(text: string, candidates: number[], timeoutMs = 20000): Promise<AiReply | null> {
  const AI_URL = aiUrl();
  if (!AI_URL || !candidates.length) return null;
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text.slice(0, 600),
        candidates: candidates.slice(0, 8).map((n) => ({ n, text: ART[n].text.join(" ") })),
      }),
      signal: ctrl.signal,
    });
    if (!r.ok) return null;
    const d = (await r.json()) as Partial<AiReply>;
    // re-check on our side too: only articles we offered, plain text only
    const arts = (Array.isArray(d.arts) ? d.arts : []).map(Number).filter((n) => candidates.includes(n));
    const answer = typeof d.answer === "string" ? d.answer.trim().slice(0, 700) : "";
    return arts.length || answer ? { arts: [...new Set(arts)], answer } : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(t);
  }
}

export interface ChatTurn { role: "user" | "model"; text: string }

/** One turn of the AI chat. `candidates` are articles the on-device matcher found for the
    recent questions; the AI may cite only those (the proxy and this check both enforce it). */
export async function chatAI(turns: ChatTurn[], candidates: number[], timeoutMs = 20000): Promise<AiReply | null> {
  const AI_URL = aiUrl();
  if (!AI_URL || !turns.length) return null;
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "chat",
        messages: turns.slice(-10).map((m) => ({ role: m.role, text: m.text.slice(0, m.role === "user" ? 600 : 900) })),
        candidates: candidates.slice(0, 8).map((n) => ({ n, text: ART[n].text.join(" ") })),
      }),
      signal: ctrl.signal,
    });
    if (!r.ok) return null;
    const d = (await r.json()) as Partial<AiReply>;
    const arts = (Array.isArray(d.arts) ? d.arts : []).map(Number).filter((n) => candidates.includes(n));
    const answer = typeof d.answer === "string" ? d.answer.trim().slice(0, 1200) : "";
    return answer ? { arts: [...new Set(arts)], answer } : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(t);
  }
}
