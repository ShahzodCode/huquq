/* Uzbek text tools: script conversion, tokenizing and suffix-aware matching.
   Everything runs in the browser — no text ever leaves the device. */

/* ---------- Cyrillic → Latin (for queries typed in Cyrillic; output uses plain ') ---------- */
const C2L: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ч: "ch", ш: "sh", щ: "sh", ъ: "'", ы: "i", ь: "",
  э: "e", ю: "yu", я: "ya", ў: "o'", қ: "q", ғ: "g'", ҳ: "h",
};
const CYR_VOWEL = /[аеёиоуэюяўъ]/;

export function toLatin(s: string): string {
  const low = s.toLowerCase();
  let out = "";
  for (let i = 0; i < low.length; i++) {
    const ch = low[i];
    if (ch === "е") out += i === 0 || !/[а-яёўқғҳ]/.test(low[i - 1]) || CYR_VOWEL.test(low[i - 1]) ? "ye" : "e";
    else if (ch === "ц") out += i > 0 && CYR_VOWEL.test(low[i - 1]) ? "ts" : "s";
    else out += C2L[ch] ?? ch;
  }
  return out;
}

/* ---------- Latin → Cyrillic (for the interface text in Cyrillic mode) ---------- */
const L2C: Record<string, string> = {
  a: "а", b: "б", d: "д", e: "е", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о",
  p: "п", q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в", x: "х", y: "й", z: "з", c: "ц", w: "в",
};
const MOD = "ʻ‘'`"; // oʻ / gʻ modifier
const SEP = "ʼ’"; // tutuq belgisi → ъ
const isUp = (c: string) => c !== c.toLowerCase();
const isLetter = (c: string | undefined) => !!c && /[a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ]/.test(c);
const LAT_VOWEL = /[aeiouAEIOU]/;
const KEEP = /(https?:\/\/\S+|\b[\w-]+\.(uz|com|org|net)\b\S*)/g; // URLs and domains stay Latin

function convertWordish(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const lo = c.toLowerCase();
    const nx = s[i + 1];
    const nlo = nx?.toLowerCase();
    // case of a two-letter combination: upper if the first letter is upper
    const up = isUp(c);
    const cas = (x: string) => (up ? x.toUpperCase() : x);
    if (lo === "y" && nlo === "o" && s[i + 2] && MOD.includes(s[i + 2])) { out += cas("й") + (isUp(nx!) ? "Ў" : "ў"); i += 2; continue; }
    if ((lo === "o" || lo === "g") && nx && MOD.includes(nx)) { out += cas(lo === "o" ? "ў" : "ғ"); i += 1; continue; }
    if (lo === "s" && nlo === "h") { out += cas("ш"); i += 1; continue; }
    if (lo === "c" && nlo === "h") { out += cas("ч"); i += 1; continue; }
    if (lo === "y" && nlo === "o") { out += cas("ё"); i += 1; continue; }
    if (lo === "y" && nlo === "u") { out += cas("ю"); i += 1; continue; }
    if (lo === "y" && nlo === "a") { out += cas("я"); i += 1; continue; }
    if (lo === "y" && nlo === "e") { out += cas("е"); i += 1; continue; }
    // loanwords: -tsiya / -tsiy → ция / ций (konstitutsiya); native "ketsa" keeps тс
    if (lo === "t" && nlo === "s" && /^i[yя]/i.test(s.slice(i + 2, i + 4))) { out += cas("ц"); i += 1; continue; }
    if (lo === "e") {
      const prev = s[i - 1];
      out += cas(!isLetter(prev) || LAT_VOWEL.test(prev!) ? "э" : "е");
      continue;
    }
    if (SEP.includes(c)) { out += "ъ"; continue; }
    const m = L2C[lo];
    out += m ? cas(m) : c;
  }
  return out;
}

export function toCyrillic(s: string): string {
  if (!/[a-zA-Z]/.test(s)) return s;
  let out = "";
  let last = 0;
  for (const m of s.matchAll(KEEP)) {
    out += convertWordish(s.slice(last, m.index)) + m[0];
    last = m.index! + m[0].length;
  }
  return out + convertWordish(s.slice(last));
}

/* ---------- normalizing & tokenizing ---------- */
/** lower-case, one apostrophe style, Cyrillic → Latin */
export const normText = (s: string) =>
  toLatin(s).replace(/[ʻʼ'‘’`´]/g, "'").replace(/ё/g, "yo");

const STOP = new Set(
  ("va bilan uchun men meni mening menga sen seni sening senga u uni uning unga bu shu o'sha bir ham lekin ammo edi deb nima nimaga " +
    "qanday qilish qildi qilib qilsa qilmoqda qiladi kerak mumkin bor yo'q emas juda endi bo'ldi bo'lib bo'lsa dedi deydi deyapti ular " +
    "biz siz bizni sizni hamma har qaysi nega agar yoki esa ekan chunki keyin oldin hozir yana faqat hech kim kimdir narsa mana " +
    "shunday bunday menimcha iltimos salom yordam bering kerakmi qilaman nima qilay qachon qayerda o'zim o'zi ozgina")
    .split(" "),
);

export function tokens(s: string): string[] {
  return normText(s)
    .split(/[^a-z0-9']+/)
    .map((t) => t.replace(/^'+|'+$/g, ""))
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/* ---------- Uzbek suffixes ---------- */
// inflectional + common verbal endings, longest first
const SUFFIXES = [
  "larimizning", "laringizning", "larimizga", "larimizda", "larimizni", "larimiz", "laringiz", "larining", "larning", "laridan",
  "larini", "lariga", "larida", "lardan", "larga", "larda", "larni", "lari", "lar",
  "imizning", "ingizning", "imizga", "imizda", "imizni", "imizdan", "imiz", "ingiz", "ning", "niki", "dagi", "dan", "tan",
  "yapti", "yapman", "yotgan", "ayotgan", "moqda", "moqchi", "maydi", "madi", "mayapti", "moq", "gani", "gan", "kan", "qan",
  "dilar", "dim", "ding", "dik", "di", "ti", "adi", "ydi", "ib", "sa", "may", "mas", "ish", "ishni", "ishga", "lash", "lab", "ladi", "lan", "la",
  "imni", "imga", "imda", "imdan", "ingni", "ini", "iga", "ida", "idan", "sini", "siga", "sida", "si",
  "ga", "ka", "qa", "da", "ta", "ni", "ng", "im", "ing", "miz", "ngiz", "lik", "ligi", "dir", "mi", "i", "m",
];

/** Strip suffixes while a stem of 3+ letters remains. */
export function stem(t: string): string {
  let s = t;
  for (let changed = true; changed; ) {
    changed = false;
    for (const suf of SUFFIXES) {
      if (s.endsWith(suf) && s.length - suf.length >= (suf.length === 1 ? 4 : 3)) {
        s = s.slice(0, -suf.length);
        changed = true;
        break;
      }
    }
  }
  return s;
}

/** Is `rest` a chain of known suffixes? (so "uy" matches "uyimga" but "rasm" does not match "rasmiy") */
function suffixChain(rest: string, depth = 0): boolean {
  if (!rest) return true;
  if (depth > 4) return false;
  return SUFFIXES.some((suf) => rest.startsWith(suf) && suffixChain(rest.slice(suf.length), depth + 1));
}

/** Does query token `tok` express the trigger word `trig` (already normalized, may contain spaces)? */
export function matchesWord(tok: string, trig: string): boolean {
  if (tok === trig) return true;
  if (!tok.startsWith(trig)) return false;
  return trig.length >= 6 || suffixChain(tok.slice(trig.length));
}
