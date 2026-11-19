export interface Article {
  n: number;
  anchor?: string;
  text: string[];
  notes?: string[];
}
export interface Chapter { title: string; articles: Article[] }
export interface Section { title: string; chapters: Chapter[] }
export interface Constitution { title: string; preamble: string[]; sections: Section[] }
/** Article enriched with its position in the constitution. */
export interface ArticleInfo extends Article { sec: number; secTitle: string; chap: string }

export interface Cat { id: string; name: string; desc: string }
export interface Right { cat: string; title: string; arts: number[]; simple: string; example: string }
export interface Guarantee { title: string; arts: number[]; simple: string }
export interface StudentCard { title: string; arts: number[]; simple: string }
export interface DaySlot { time: string; title: string; text: string; arts: number[] }
export interface Duty { title: string; arts: number[]; simple: string; example: string }
export interface SortItem { s: string; k: "huquq" | "burch"; art: number }
export interface QuizQ { lvl: 1 | 2 | 3; q: string; o: string[]; a: number; art: number; why: string }
export interface BlitzItem { s: string; t: boolean; art: number }
export interface Situation {
  title: string;
  story: string;
  /** options, correct index, and a short "why / why not" for every option */
  q1: { o: string[]; a: number; why: string[] };
  q2: { o: number[]; a: number; why: string[] };
  steps: string[];
}
export interface GlossaryTerm { t: string; d: string }
export interface Source { name: string; url: string; note: string }
export interface Content {
  cats: Cat[];
  rights: Right[];
  guarantees: Guarantee[];
  student: { intro: string; cards: StudentCard[]; day: DaySlot[] };
  duties: Duty[];
  sort: SortItem[];
  quiz: QuizQ[];
  blitz: BlitzItem[];
  findPool: number[];
  situations: Situation[];
  glossary: GlossaryTerm[];
  sources: Source[];
}
export interface Progress {
  read: number[];
  quiz: Record<string, number>;
  sitDone: number[];
  /** best score per situation (0–4: 2 points per step on the first try, 1 on the second) */
  sitScore: Record<string, number>;
  sortBest: number;
  blitzBest: number;
  findBest: number;
}
