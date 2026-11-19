import { useEffect, useRef } from "react";
import { ART, CONTENT, LEX, LEX_CYR, SECT_SHORT } from "../data";
import { useArticle, useSettings, useToast } from "../context";
import { useOfficial } from "./Script";

export function ArticleDrawer() {
  const { open: n, openArt, closeArt } = useArticle();
  const toast = useToast();
  const closeRef = useRef<HTMLButtonElement>(null);
  const a = n != null ? ART[n] : null;
  const official = useOfficial();
  const { script } = useSettings();
  const o = a ? official(a.n) : null;
  const src = script === "cyr" ? LEX_CYR : LEX;
  const anchor = a?.anchor ? "#" + (script === "cyr" ? a.anchor.replace(/^-/, "") : a.anchor) : "";

  useEffect(() => {
    if (n != null) closeRef.current?.focus();
  }, [n]);

  const rel = a ? [...CONTENT.rights, ...CONTENT.duties].filter((r) => r.arts.includes(a.n)) : [];

  const copy = async () => {
    if (!a) return;
    try {
      await navigator.clipboard.writeText(`${a.n}-modda. ${a.text.join("\n")}\nManba: ${LEX}`);
      toast("Nusxa olindi");
    } catch {
      toast("Nusxa olib boʻlmadi — matnni belgilab oling");
    }
  };

  return (
    <>
      <div className={"scrim" + (n != null ? " on" : "")} onClick={closeArt} />
      <aside className={"drawer" + (n != null ? " on" : "")} id="drawer" role="dialog" aria-modal="true" aria-labelledby="dnum">
        {a && o && (
          <>
            <div className="dhead">
              <div>
                <div className="num" id="dnum">{a.n}-modda</div>
                <div className="where">
                  {SECT_SHORT[a.sec]}
                  {o.chap && <span data-official>{" · " + o.chap}</span>}
                </div>
              </div>
              <button className="close" ref={closeRef} onClick={closeArt} aria-label="Yopish">×</button>
            </div>
            <div className="dbody">
              <div className="official">Rasmiy matn — oʻzgarishsiz</div>
              <div data-official>
                {o.text.map((p, i) => (
                  <p className="para" key={i}>{p}</p>
                ))}
              </div>
              {o.notes && (
                <div className="note" data-official>
                  {o.notes.map((x, i) => (
                    <span key={i}>{i > 0 && <br />}{x}</span>
                  ))}
                </div>
              )}
              {rel.length > 0 && (
                <div className="related">
                  <h4>Sodda tilda</h4>
                  {rel.map((r, i) => (
                    <p key={i}><b>{r.title}.</b> {r.simple}</p>
                  ))}
                </div>
              )}
            </div>
            <div className="dfoot">
              <a className="btn" href={src + anchor} target="_blank" rel="noopener">Rasmiy manbada ochish</a>
              <button className="btn ghost" onClick={copy}>Matndan nusxa olish</button>
              {a.n > 1 && <button className="btn soft" onClick={() => openArt(a.n - 1)} aria-label="Oldingi modda">‹ {a.n - 1}</button>}
              {a.n < 155 && <button className="btn soft" onClick={() => openArt(a.n + 1)} aria-label="Keyingi modda">{a.n + 1} ›</button>}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
