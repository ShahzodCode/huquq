import constitutionJson from "./constitution.json";
import contentJson from "./content.json";
import type { ArticleInfo, Constitution, Content } from "../types";

export const K = constitutionJson as Constitution;
export const CONTENT = contentJson as unknown as Content;

export const LEX = "https://lex.uz/docs/-6445145";
export const CHECKED = "2026-yil 10-noyabr";

export const SECT_SHORT = [
  "Asosiy prinsiplar",
  "Huquqlar, erkinliklar va burchlar",
  "Jamiyat va shaxs",
  "Maʼmuriy-hududiy tuzilish",
  "Davlat hokimiyati",
  "Oʻzgartirish tartibi",
];
export const SCOL = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s5)", "var(--s6)"];

export const ART: Record<number, ArticleInfo> = {};
K.sections.forEach((s, si) =>
  s.chapters.forEach((c) =>
    c.articles.forEach((a) => {
      ART[a.n] = { ...a, sec: si, secTitle: s.title, chap: c.title };
    }),
  ),
);

export const norm = (s: string) =>
  s.toLowerCase().replace(/[ʻʼ'‘’`´]/g, "'").replace(/ё/g, "е");
