import { describe, expect, it } from "vitest";
import { ART, ART_CYR, CONTENT, K, K_CYR } from "../data";
import { CONCEPTS } from "../data/concepts";
import { analyze } from "../engine";
import { matchesWord, stem, toCyrillic, toLatin } from "../nlp";
import { decode, encode, makeResult, parseMany } from "../teacher";

describe("nlp", () => {
  it("transliterates Latin interface text to Cyrillic", () => {
    expect(toCyrillic("Oʻzbekiston Respublikasi Konstitutsiyasi")).toBe("Ўзбекистон Республикаси Конституцияси");
    expect(toCyrillic("Huquqiy yordamchi")).toBe("Ҳуқуқий ёрдамчи");
    expect(toCyrillic("taʼlim, eʼtibor, yoʻq, gʻamxoʻrlik")).toBe("таълим, эътибор, йўқ, ғамхўрлик");
    expect(toCyrillic("ketsa")).toBe("кетса"); // native -tsa stays тс
    expect(toCyrillic("Manba: lex.uz")).toBe("Манба: lex.uz");
  });
  it("reads Cyrillic queries as Latin", () => {
    expect(toLatin("Ўқитувчи ҳақорат қилди")).toBe("o'qituvchi haqorat qildi");
    expect(toLatin("таълим")).toBe("ta'lim");
  });
  it("matches inflected Uzbek words but not unrelated ones", () => {
    expect(stem("telefonimni")).toBe("telefon");
    expect(stem("maktabimizda")).toBe("maktab");
    expect(matchesWord("uyimga", "uy")).toBe(true);
    expect(matchesWord("urdi", "ur")).toBe(true);
    expect(matchesWord("rasmiy", "rasm")).toBe(false);
    expect(matchesWord("haqoratladi", "haqorat")).toBe(true);
  });
});

describe("assistant", () => {
  const top = (q: string) => analyze(q).matches.map((m) => m.n);
  it.each([
    ["Sinfdoshim telefonimni ochib, xabarlarimni guruhga tashladi", 31],
    ["Maktabda darsga kirish uchun pul soʻrashyapti", 50],
    ["Akamni politsiya ushlab ketdi, advokat berishmayapti", 29],
    ["Uyimiz yonidagi zavod havoni ifloslantiryapti", 49],
    ["Aravachada yuraman, maktab meni qabul qilmayapti", 57],
    ["Ўқитувчи мени синф олдида ҳақорат қилди", 26],
    ["14 yoshli ukamni bozorda ogʻir yuk tashishga majburlashyapti", 44],
    ["Opamni majburan turmushga bermoqchi", 76],
    ["Ish beruvchi ikki oydan beri maosh bermayapti", 42],
    ["Shifoxonada davolashdan bosh tortishdi", 48],
  ])("%s → %i-modda in top 2", (q, n) => {
    expect(top(q).slice(0, 2)).toContain(n);
  });
  it("points to the exact paragraph", () => {
    const m = analyze("telefonimdagi xabarlarni oʻqishdi").matches.find((x) => x.n === 31)!;
    expect(m.para).toBe(1);
  });
  it("flags danger", () => {
    expect(analyze("Meni maktabda urishdi").urgent).toBe(true);
    expect(analyze("мактабда мени уришди").matches[0].n).toBe(26);
    expect(analyze("Maktabda pul soʻrashdi").urgent).toBe(false);
  });
  it("returns nothing for unrelated text", () => {
    expect(analyze("qwerty asdf").matches).toHaveLength(0);
  });
  it("concept paragraphs exist in the official text", () => {
    for (const c of CONCEPTS) for (const [n, p] of c.arts) expect(ART[n]?.text[p], `${c.id} → ${n}.${p}`).toBeTruthy();
  });
});

describe("situations", () => {
  it("every option has an explanation and a valid article", () => {
    CONTENT.situations.forEach((s) => {
      expect(s.q1.why).toHaveLength(s.q1.o.length);
      expect(s.q2.why).toHaveLength(s.q2.o.length);
      expect(s.q2.o.length).toBe(4);
      s.q2.o.forEach((n) => expect(ART[n]).toBeTruthy());
    });
  });
});

describe("official Cyrillic text", () => {
  it("mirrors the Latin structure paragraph by paragraph", () => {
    expect(K_CYR.preamble).toHaveLength(K.preamble.length);
    for (const n of Object.keys(ART).map(Number)) {
      expect(ART_CYR[n].text, `${n}`).toHaveLength(ART[n].text.length);
      expect(ART_CYR[n].text.join(" ")).not.toMatch(/[a-z]{4}/); // no Latin words leaked in
    }
  });
});

describe("teacher codes", () => {
  const P = { read: [1, 2, 3], quiz: { "1": 10, "3": 7 }, sitDone: [0, 1], sitScore: { "0": 4, "1": 3 }, sortBest: 12, blitzBest: 15, findBest: 8 };
  it("round-trips and carries no name", () => {
    const r = makeResult(P, "10a-k7q", 7, new Date("2026-11-19"));
    const code = encode(r);
    expect(decode(code)).toEqual(r);
    expect(r).toMatchObject({ c: "10A-K7Q", j: 7, q: [10, -1, 7], s: 7, sd: 2 });
  });
  it("rejects edited codes and finds codes in pasted chat text", () => {
    const code = encode(makeResult(P, "10A-K7Q", 3));
    const broken = code.slice(0, 8) + (code[8] === "A" ? "B" : "A") + code.slice(9);
    expect(decode(broken)).toBeNull();
    const chat = `Ali: ${code}\nVali: salom\nSoli: ${broken}`;
    const { ok, bad } = parseMany(chat);
    expect(ok).toHaveLength(1);
    expect(bad).toBe(1);
  });
});
