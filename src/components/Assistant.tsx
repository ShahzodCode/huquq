import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CONTENT } from "../data";
import { analyze } from "../engine";
import { excerpt } from "../search";
import { stem, tokens } from "../nlp";
import { useArticle } from "../context";
import { aiAvailable, askAI, type AiReply } from "../ai";
import { store } from "../hooks/useLocalStorage";
import { Icon } from "./Icon";
import { Terms } from "./common";
import { useOfficial } from "./Script";

export const EXAMPLES = [
  "Sinfdoshim telefonimni ochib, xabarlarimni guruhga tashladi",
  "Maktabda darsga kirish uchun pul soʻrashyapti",
  "Akamni politsiya ushlab ketdi, advokat berishmayapti",
  "Uyimiz yonidagi zavod havoni ifloslantiryapti",
  "Aravachada yuraman, maktab meni qabul qilmayapti",
  "Ўқитувчи мени синф олдида ҳақорат қилди",
];

const GENERAL_STEPS: [string, number?][] = [
  ["Nima boʻlganini yozib qoʻying: sana, joy, guvohlar, skrinshotlar."],
  ["Ishonchli kattalarga — ota-onangiz, sinf rahbari yoki maktab psixologiga ayting."],
  ["Tegishli tashkilotga ariza yoki shikoyat bilan murojaat qilishingiz mumkin.", 40],
  ["Huquqingiz buzilgan boʻlsa, uni sud orqali himoya qilish mumkin.", 55],
  ["Jiddiy holatda huquqshunos yoki advokat maslahatini oling.", 29],
];

const cards = [...CONTENT.rights, ...CONTENT.duties, ...CONTENT.student.cards.map((c) => ({ ...c, example: "" }))];

/** The situation (from the 8 reviewed cases) closest to what the user wrote. */
function closestSituation(text: string, arts: number[]) {
  const q = new Set(tokens(text).map(stem));
  let best = -1, bestScore = 0;
  CONTENT.situations.forEach((s, i) => {
    const right = s.q2.o[s.q2.a];
    const rank = arts.indexOf(right);
    if (rank < 0 || rank > 1) return;
    const overlap = tokens(s.title + " " + s.story).map(stem).filter((t) => q.has(t)).length;
    const sc = (2 - rank) * 2 + overlap;
    if (sc > bestScore) { bestScore = sc; best = i; }
  });
  return best;
}

export function Assistant({ initial = "" }: { initial?: string }) {
  const [input, setInput] = useState(initial);
  const [query, setQuery] = useState(initial);
  const { openArt } = useArticle();
  const official = useOfficial();
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setQuery(input), 350);
    return () => window.clearTimeout(id);
  }, [input]);

  /* ---- optional AI (Gemini via proxy): runs on submit only, never on every keystroke ---- */
  const canAI = aiAvailable();
  const [aiOn, setAiOnState] = useState(() => store.get("ai", true));
  const setAiOn = (v: boolean) => { store.set("ai", v); setAiOnState(v); };
  const [ai, setAi] = useState<{ q: string; state: "loading" | "done" | "fail"; reply?: AiReply } | null>(null);
  const runAI = async (q: string) => {
    if (!canAI || !aiOn || q.trim().length < 3) return;
    const cands = analyze(q, 6).matches.map((m) => m.n);
    if (!cands.length) return;
    setAi({ q, state: "loading" });
    const reply = await askAI(q, cands);
    setAi((cur) => (cur?.q === q ? (reply ? { q, state: "done", reply } : { q, state: "fail" }) : cur));
  };
  const submit = (t: string) => {
    setInput(t);
    setQuery(t);
    void runAI(t);
  };
  useEffect(() => {
    if (initial) void runAI(initial);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const aiNow = ai && ai.q === query && aiOn ? ai : null;
  const res = useMemo(() => {
    if (query.trim().length < 3) return null;
    const r = analyze(query, 6);
    const picked = aiNow?.reply?.arts || [];
    // AI choice first (only among our candidates), then the rest of the on-device ranking
    const ordered = [...picked.map((n) => r.matches.find((m) => m.n === n)!).filter(Boolean), ...r.matches.filter((m) => !picked.includes(m.n))];
    return { ...r, matches: ordered.slice(0, 4) };
  }, [query, aiNow]);
  const aiPicked = new Set(aiNow?.reply?.arts || []);
  const sit = res && res.matches.length ? closestSituation(query, res.matches.map((m) => m.n)) : -1;
  const pick = (t: string) => {
    submit(t);
    area.current?.focus();
  };

  return (
    <section className="ai" aria-labelledby="ai-h">
      <div className="ai-panel">
        <div className="ai-badge"><Icon k="spark" /> Huquqiy yordamchi</div>
        <h2 id="ai-h">Nima boʻldi? Oʻz soʻzlaringiz bilan yozing</h2>
        <p className="ai-sub">
          Yordamchi vaziyatingizga mos moddalarni topadi va rasmiy matnni oʻzgarishsiz koʻrsatadi.{" "}
          {canAI && aiOn
            ? "Batafsil javob uchun matningiz Google Gemini sunʼiy intellektiga yuboriladi — ism, telefon yoki manzil yozmang."
            : "Tahlil qurilmangizning oʻzida bajariladi — yozganingiz hech qayerga yuborilmaydi."}
        </p>
        <form className="ai-box" onSubmit={(e) => { e.preventDefault(); submit(input); }}>
          <label htmlFor="ai-q" className="sr">Vaziyatingizni yozing</label>
          <textarea
            id="ai-q"
            ref={area}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
            placeholder="Masalan: sinfdoshim telefonimni ochib, xabarlarimni guruhga tashladi"
          />
          <button className="ai-go" type="submit" aria-label="Tahlil qilish"><Icon k="arrow" /></button>
        </form>
        <div className="ai-ex" aria-label="Namunalar">
          {EXAMPLES.map((x) => (
            <button key={x} type="button" onClick={() => pick(x)}>{x}</button>
          ))}
        </div>
        {canAI && (
          <label className="ai-switch">
            <input type="checkbox" checked={aiOn} onChange={(e) => setAiOn(e.target.checked)} />
            <span className="track" aria-hidden="true"><i /></span>
            Sunʼiy intellekt javobi (Google Gemini)
          </label>
        )}
      </div>

      <div aria-live="polite">
        {res && res.urgent && (
          <div className="ai-urgent" role="alert">
            <Icon k="alert" />
            <p><b>Xavf ostidamisiz?</b> Hayotingiz yoki sogʻligʻingizga xavf boʻlsa, darhol <b>102</b> (politsiya) yoki <b>103</b> (tez yordam) raqamiga qoʻngʻiroq qiling va yaqin kattalarga xabar bering.</p>
          </div>
        )}

        {res && res.matches.length === 0 && (
          <div className="ai-empty">
            <p><b>Mos modda topilmadi.</b> Vaziyatni batafsilroq yozing: kim, nima qildi, qayerda? Masalan, “telefon”, “maktab”, “ish haqi”, “shifoxona” kabi soʻzlar yordam beradi.</p>
          </div>
        )}

        {aiNow?.state === "loading" && (
          <div className="ai-answer loading" aria-busy="true">
            <div className="ai-answer-head"><Icon k="spark" /> Sunʼiy intellekt tahlil qilmoqda…</div>
            <div className="shimmer"><i /><i /><i /></div>
          </div>
        )}
        {aiNow?.state === "done" && aiNow.reply!.answer && (
          <div className="ai-answer">
            <div className="ai-answer-head">
              <Icon k="spark" /> AI javobi <span className="unchecked">tekshirilmagan</span>
            </div>
            <p>{aiNow.reply!.answer}</p>
            <p className="ai-answer-note">
              Bu javobni sunʼiy intellekt hozir yozdi, uni oʻqituvchi tekshirmagan. Asosiysi — pastdagi rasmiy modda matni.
            </p>
          </div>
        )}
        {aiNow?.state === "fail" && (
          <p className="muted small" style={{ marginTop: 14 }}>Sunʼiy intellekt hozir javob bermadi — quyida qurilmadagi tahlil natijasi.</p>
        )}

        {res && res.matches.length > 0 && (
          <div className="ai-out">
            <div className="ai-meta">
              <span className={"conf c-" + (res.confidence === "yuqori" ? "hi" : res.confidence === "past" ? "lo" : "mid")}>
                <i /><i /><i /> Moslik: {res.confidence}
              </span>
              {res.concepts.slice(0, 4).map((h) => (
                <span className="concept" key={h.concept.id} title={"Soʻzlar: " + h.words.join(", ")}>{h.concept.label}</span>
              ))}
            </div>

            <ol className="hits">
              {res.matches.map((m, i) => {
                const o = official(m.n);
                const card = cards.find((c) => c.arts.includes(m.n));
                return (
                  <li className={"hit" + (i === 0 ? " top" : "")} key={m.n} style={{ animationDelay: i * 70 + "ms" }}>
                    <div className="hit-head">
                      <button className="hit-num" onClick={() => openArt(m.n)} aria-label={`${m.n}-moddani ochish`}>
                        {m.n}<small>-modda</small>
                      </button>
                      <div className="hit-why">
                        {aiPicked.has(m.n) && <span className="aipick">AI tanlovi</span>}
                        {m.para > 0 && <span className="part">{m.para + 1}-qism</span>}
                        {m.reasons.slice(0, 2).map((r) => <span key={r}>{r}</span>)}
                        {!m.reasons.length && m.words.length > 0 && <span>matnda: {m.words.slice(0, 3).join(", ")}</span>}
                      </div>
                    </div>
                    <blockquote className="hit-q" data-official>
                      {excerpt(o.text[m.para] ?? o.text[0], res.stems, 320).map((s, k) => (s.mark ? <mark key={k}>{s.text}</mark> : <span key={k}>{s.text}</span>))}
                    </blockquote>
                    {card && i < 3 && (
                      <div className="hit-plain">
                        <b>{card.title}.</b> <Terms text={card.simple} />
                      </div>
                    )}
                    <button className="hit-open" onClick={() => openArt(m.n)}>Toʻliq rasmiy matn <Icon k="arrow" /></button>
                  </li>
                );
              })}
            </ol>

            <div className="ai-steps">
              <h3>Nima qilish mumkin?</h3>
              {sit >= 0 ? (
                <>
                  <ol className="todo">{CONTENT.situations[sit].steps.map((x, i) => <li key={i}><Terms text={x} /></li>)}</ol>
                  <p className="muted small">Bu maslahatlar “{CONTENT.situations[sit].title}” vaziyatidan olingan.</p>
                </>
              ) : (
                <ol className="todo">
                  {GENERAL_STEPS.map(([t, n], i) => (
                    <li key={i}>{t}{n && <> <button className="art sm" onClick={() => openArt(n)}>{n}-modda</button></>}</li>
                  ))}
                </ol>
              )}
              {sit >= 0 && (
                <Link className="btn soft" to={`/vaziyatlar?v=${sit + 1}`}>Shunga oʻxshash vaziyatni yechib koʻring <Icon k="arrow" /></Link>
              )}
            </div>
            <p className="ai-note">
              Yordamchi faqat Konstitutsiya moddalarini koʻrsatadi va rasmiy huquqiy maslahat oʻrnini bosmaydi. Moslik soʻzlar va
              tushunchalar asosida aniqlanadi — har doim modda matnini oʻzingiz ham oʻqing.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
