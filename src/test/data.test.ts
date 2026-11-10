import { describe, expect, it } from "vitest";
import { ART, CONTENT, K } from "../data";
import { excerpt, search } from "../search";
import { splitTerms } from "../components/common";

describe("data integrity (ported from build_content.py)", () => {
  it("has all 155 articles in order", () => {
    expect(Object.keys(ART).map(Number)).toEqual(Array.from({ length: 155 }, (_, i) => i + 1));
    expect(K.sections).toHaveLength(6);
  });

  it("every article reference in content exists", () => {
    const refs: number[] = [];
    [...CONTENT.rights, ...CONTENT.duties, ...CONTENT.guarantees, ...CONTENT.student.cards, ...CONTENT.student.day].forEach((x) => refs.push(...x.arts));
    [...CONTENT.sort, ...CONTENT.quiz, ...CONTENT.blitz].forEach((x) => refs.push(x.art));
    refs.push(...CONTENT.findPool);
    CONTENT.situations.forEach((s) => refs.push(...s.q2.o));
    expect(refs.filter((n) => !ART[n])).toEqual([]);
  });

  it("content counts match the site copy", () => {
    expect(CONTENT.quiz).toHaveLength(36);
    expect(CONTENT.situations).toHaveLength(8);
    for (const l of [1, 2, 3]) expect(CONTENT.quiz.filter((q) => q.lvl === l)).toHaveLength(12);
    CONTENT.quiz.forEach((q) => expect(q.a).toBeLessThan(q.o.length));
  });
});

describe("search", () => {
  it("finds an article by number", () => {
    const r = search("50-modda");
    expect(r.kind).toBe("hits");
    if (r.kind === "hits") expect(r.hits[0][0]).toBe(50);
  });
  it("reports missing numbers and short queries", () => {
    expect(search("999")).toEqual({ kind: "missing", n: 999 });
    expect(search("a")).toEqual({ kind: "short" });
    expect(search("  ")).toEqual({ kind: "empty" });
  });
  it("matches keywords regardless of apostrophe style", () => {
    const r = search("taʼlim");
    expect(r.kind === "hits" && r.hits.length).toBeGreaterThan(0);
  });
  it("highlights matches without HTML", () => {
    const parts = excerpt("Davlat tili — oʻzbek tili.", "tili");
    expect(parts.filter((p) => p.mark)).toHaveLength(2);
    expect(parts.map((p) => p.text).join("")).toBe("Davlat tili — oʻzbek tili.");
  });
});

describe("glossary terms", () => {
  it("splits text around glossary words and loses nothing", () => {
    const s = "Referendum orqali qaror qabul qilinadi.";
    const parts = splitTerms(s);
    expect(parts.some((p) => p.term)).toBe(true);
    expect(parts.map((p) => p.text).join("")).toBe(s);
  });
});
