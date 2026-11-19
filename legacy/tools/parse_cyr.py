"""Parse the official Cyrillic text (lex.uz/docs/6445145) into src/data/constitution.cyr.json.

Usage: python parse_cyr.py <saved lex.uz html> <latin constitution.json> <out.json>

The output mirrors the Latin file's shape (title, preamble, sections -> chapters -> articles)
and is validated against it: same 155 articles, same paragraph count per article.
Text is copied verbatim from lex.uz; only HTML tags are removed.
"""
import html
import json
import re
import sys

src, lat_path, out_path = sys.argv[1:4]
h = open(src, encoding="utf-8").read()
lat = json.load(open(lat_path, encoding="utf-8"))

ELEM = re.compile(
    r'<div class="(ACT_TEXT|CLAUSE_DEFAULT|TEXT_HEADER_DEFAULT|ACT_TITLE|TEXT_BOLD_CENTER)[^"]*lx_elem"[^>]*>.*?'
    r'<div name="\d+" id="\d+">(.*?)</div></div>'
    r'|<div class="(?:CHANGES|PUBLICATION)_ORIGINS?[^"]*">\s*<label[^>]*></label>\s*<div name="\d+" id="\d+">(.*?)</div></div>',
    re.S,
)


def clean(s: str) -> str:
    s = re.sub(r"<sup>(.*?)</sup>", lambda m: "".join("⁰¹²³⁴⁵⁶⁷⁸⁹"[int(d)] for d in m.group(1) if d.isdigit()), s)
    s = re.sub(r"<[^>]+>", "", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


title, preamble, headers, arts = "", [], [], {}
cur = None
for m in ELEM.finditer(h):
    kind, body, note = m.group(1), m.group(2), m.group(3)
    if note is not None:
        if cur is not None:
            arts[cur].setdefault("notes", []).append(clean(note))
        continue
    t = clean(body)
    if kind == "ACT_TITLE":
        title = t
    elif kind == "TEXT_HEADER_DEFAULT":
        headers.append(t)
    elif kind == "CLAUSE_DEFAULT":
        cur = int(re.match(r"(\d+)", t).group(1))
        arts[cur] = {"text": []}
    elif kind == "ACT_TEXT" and t and t != "Олдинги таҳрирга қаранг.":
        (arts[cur]["text"] if cur is not None else preamble).append(t)

# rebuild the Latin skeleton with Cyrillic text
hi = iter(headers)
out = {"title": title, "preamble": preamble, "sections": []}
problems = []
if len(preamble) != len(lat["preamble"]):
    problems.append(f"preamble {len(preamble)} vs {len(lat['preamble'])}")
for s in lat["sections"]:
    sec = {"title": next(hi), "chapters": []}
    for c in s["chapters"]:
        ch = {"title": next(hi) if c["title"] else "", "articles": []}
        for a in c["articles"]:
            ca = arts.get(a["n"])
            if not ca:
                problems.append(f"missing {a['n']}")
                continue
            if len(ca["text"]) != len(a["text"]):
                problems.append(f"{a['n']}: {len(ca['text'])} vs {len(a['text'])} paragraphs")
            if len(ca.get("notes", [])) != len(a.get("notes", [])):
                problems.append(f"{a['n']}: notes {len(ca.get('notes', []))} vs {len(a.get('notes', []))}")
            item = {"n": a["n"], "text": ca["text"]}
            if ca.get("notes"):
                item["notes"] = ca["notes"]
            ch["articles"].append(item)
        sec["chapters"].append(ch)
    out["sections"].append(sec)

if problems:
    print("MISMATCH:", *problems, sep="\n  ")
    sys.exit(1)
json.dump(out, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("ok", len(arts), "articles,", len(headers), "headers")
