import { useCallback, useEffect } from "react";
import { ART, ART_CYR } from "../data";
import { toCyrillic } from "../nlp";
import { useSettings } from "../context";

/** Official article text in the chosen script. Cyrillic comes verbatim from lex.uz/docs/6445145. */
export function useOfficial() {
  const { script } = useSettings();
  return useCallback(
    (n: number) => {
      const a = ART[n];
      if (script === "cyr") {
        const c = ART_CYR[n];
        return { text: c.text, notes: c.notes, chap: c.chap };
      }
      return { text: a.text, notes: a.notes, chap: a.chap };
    },
    [script],
  );
}

const SKIP = "[data-official],script,style,textarea,input,code,[data-keep]";
const ATTRS = ["placeholder", "aria-label", "title"];

/**
 * Cyrillic mode for the interface: converts our own (non-legal) Latin text to Cyrillic in place and
 * keeps it converted as React re-renders. Elements marked data-official are never touched — their
 * text is rendered from the official Cyrillic source instead.
 */
export function ScriptLayer() {
  const { script } = useSettings();
  useEffect(() => {
    if (script !== "cyr") return;
    const texts = new Map<Text, { from: string; to: string }>();
    const attrs = new Map<Element, Record<string, { from: string; to: string }>>();

    const doText = (t: Text) => {
      const v = t.nodeValue || "";
      if (texts.get(t)?.to === v || !/[A-Za-z]/.test(v) || t.parentElement?.closest(SKIP)) return;
      const to = toCyrillic(v);
      texts.set(t, { from: v, to });
      t.nodeValue = to;
    };
    const doAttrs = (el: Element) => {
      if (el.closest(SKIP) && !(el instanceof HTMLInputElement)) return;
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (!v || !/[A-Za-z]/.test(v)) continue;
        const rec = attrs.get(el) || {};
        if (rec[a]?.to === v) continue;
        rec[a] = { from: v, to: toCyrillic(v) };
        attrs.set(el, rec);
        el.setAttribute(a, rec[a].to);
      }
    };
    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) return doText(root as Text);
      if (!(root instanceof Element)) return;
      doAttrs(root);
      root.querySelectorAll("*").forEach(doAttrs);
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) doText(n as Text);
    };
    const title = () => {
      if (/[A-Za-z]/.test(document.title)) document.title = toCyrillic(document.title);
    };

    walk(document.body);
    title();
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "characterData") doText(m.target as Text);
        else if (m.type === "attributes") doAttrs(m.target as Element);
        else m.addedNodes.forEach(walk);
      }
      title();
    });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    const tmo = new MutationObserver(title);
    const titleEl = document.querySelector("title");
    if (titleEl) tmo.observe(titleEl, { childList: true, characterData: true, subtree: true });

    return () => {
      mo.disconnect();
      tmo.disconnect();
      texts.forEach((v, t) => {
        if (t.nodeValue === v.to) t.nodeValue = v.from;
      });
      attrs.forEach((rec, el) => {
        for (const a in rec) if (el.getAttribute(a) === rec[a].to) el.setAttribute(a, rec[a].from);
      });
    };
  }, [script]);
  return null;
}
