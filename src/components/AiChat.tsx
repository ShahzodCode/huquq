import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ART } from "../data";
import { analyze } from "../engine";
import { aiAvailable, chatAI, type ChatTurn } from "../ai";
import { useArticle } from "../context";
import { store } from "../hooks/useLocalStorage";
import { Icon } from "./Icon";

interface Msg extends ChatTurn { arts?: number[]; failed?: boolean; urgent?: boolean }

const STARTERS = [
  "Oʻquvchi sifatida qanday huquqlarim bor?",
  "Sinfdoshim telefonimni ruxsatsiz ochdi, nima qilay?",
  "Konstitutsiya nima va nega muhim?",
  "Saytda testlar qayerda?",
];

/** Articles the AI may cite: numbers the student named, then the on-device matcher's picks
    for the last two questions (so follow-ups like “nima qilay?” keep their context). */
function candidatesFor(userTexts: string[]) {
  const recent = userTexts.slice(-2).join(". ");
  const named = [...recent.matchAll(/(\d{1,3})\s*-?\s*(modda|модда|статья|article)/gi)]
    .map((m) => Number(m[1]))
    .filter((n) => ART[n]);
  const a = analyze(recent, 6);
  return { cands: [...new Set([...named, ...a.matches.map((m) => m.n)])].slice(0, 8), urgent: a.urgent };
}

export function AiChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [seen, setSeen] = useState(() => store.get("chatSeen", false));
  const { open: artOpen, openArt } = useArticle();
  const artOpenRef = useRef(artOpen);
  artOpenRef.current = artOpen;
  const fab = useRef<HTMLButtonElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    area.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      // Esc closes the chat, unless an article drawer opened from it is on top. Capture phase:
      // it must run before the drawer's own Esc handler re-renders the drawer as closed.
      if (e.key === "Escape" && artOpenRef.current == null) close();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [msgs, busy, open]);

  if (!aiAvailable()) return null;

  const show = () => {
    setOpen(true);
    if (!seen) { setSeen(true); store.set("chatSeen", true); }
  };
  const close = () => {
    setOpen(false);
    window.setTimeout(() => fab.current?.focus(), 0);
  };

  const send = async (raw: string) => {
    const text = raw.trim().slice(0, 600);
    if (text.length < 2 || busy) return;
    const history = msgs.filter((m) => !m.failed);
    const { cands, urgent } = candidatesFor([...history.filter((m) => m.role === "user").map((m) => m.text), text]);
    const mine: Msg = { role: "user", text, urgent };
    setMsgs((m) => [...m, mine]);
    setInput("");
    setBusy(true);
    const reply = await chatAI([...history, mine].map(({ role, text: t }) => ({ role, text: t })), cands);
    setBusy(false);
    setMsgs((m) => [
      ...m,
      reply
        ? { role: "model", text: reply.answer, arts: reply.arts }
        : { role: "model", text: "Sunʼiy intellekt hozir javob bermadi. Birozdan keyin qayta urinib koʻring.", failed: true },
    ]);
  };

  return (
    <>
      {!open && (
        <button ref={fab} className={"chat-fab" + (seen ? "" : " new")} onClick={show} aria-haspopup="dialog" aria-label="AI yordamchi bilan suhbatni ochish">
          <Icon k="spark" />
          <span>AI yordamchi</span>
          {!seen && <em aria-hidden="true">Yangi</em>}
        </button>
      )}
      {open && (
        <section className="chat" role="dialog" aria-modal="false" aria-labelledby="chat-h">
          <header className="chat-head">
            <span className="chat-ava" aria-hidden="true"><Icon k="spark" /></span>
            <div>
              <h2 id="chat-h">AI yordamchi</h2>
              <small><span data-keep>Google Gemini</span> · javoblar tekshirilmagan</small>
            </div>
            {msgs.length > 0 && (
              <button className="chat-icon" onClick={() => setMsgs([])} aria-label="Suhbatni tozalash" title="Suhbatni tozalash" disabled={busy}>
                <Icon k="reset" />
              </button>
            )}
            <button className="chat-icon" onClick={close} aria-label="Yopish" title="Yopish">
              <Icon k="close" />
            </button>
          </header>

          <div className="chat-list" ref={list} aria-live="polite">
            <div className="chat-msg model">
              <p>
                Salom! Men Konstitutsiya va huquqlaringiz haqidagi savollarga javob beraman, saytdan foydalanishda ham yordam beraman.
                Savolingizni yozing.
              </p>
            </div>
            <p className="chat-privacy">
              <Icon k="shield" />
              <span>Xabarlaringiz javob olish uchun <span data-keep>Google Gemini</span> sunʼiy intellektiga yuboriladi — ism, telefon yoki manzil yozmang.</span>
            </p>
            {msgs.length === 0 && (
              <div className="chat-starters" aria-label="Namuna savollar">
                {STARTERS.map((s) => (
                  <button key={s} type="button" onClick={() => void send(s)}>{s}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i}>
                {m.urgent && (
                  <div className="chat-urgent" role="alert">
                    <Icon k="alert" />
                    <p>Xavf ostidamisiz? Darhol <b>102</b> (politsiya) yoki <b>103</b> (tez yordam) raqamiga qoʻngʻiroq qiling.</p>
                  </div>
                )}
                <div className={"chat-msg " + m.role + (m.failed ? " failed" : "")} data-keep={m.role === "user" ? "" : undefined}>
                  <p>{m.text}</p>
                  {m.failed && (
                    <Link to="/vaziyatlar" onClick={close}>Qurilmadagi huquqiy yordamchini ochish →</Link>
                  )}
                  {m.arts && m.arts.length > 0 && (
                    <div className="chat-arts">
                      {m.arts.map((n) => (
                        <button key={n} className="art" onClick={() => openArt(n)} aria-label={`${n}-moddani ochish`}>
                          {n}-modda
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="chat-msg model typing" aria-label="AI javob yozmoqda">
                <i /><i /><i />
              </div>
            )}
          </div>

          <form className="chat-form" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
            <label htmlFor="chat-q" className="sr">Savolingiz</label>
            <textarea
              id="chat-q"
              ref={area}
              rows={1}
              maxLength={600}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }}
              placeholder="Savolingizni yozing…"
            />
            <button type="submit" className="chat-send" aria-label="Yuborish" disabled={busy || input.trim().length < 2}>
              <Icon k="arrow" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
