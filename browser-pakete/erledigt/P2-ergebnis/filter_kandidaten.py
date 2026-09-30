#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Stilneutraler Filter für mehrstimmige Textbanken (F1 RPG, Ticker & Co.)

Idee: Mehrere Schreibquellen ("Stimmen") liefern Kandidaten für einen Pool.
Dieses Skript entscheidet NUR nach harten Regeln (Platzhalter, verbotene Inhalte,
Duplikate). Es bewertet keinen Geschmack. Danach wird nach Quellen abwechselnd
(Round-Robin) ausgewählt, damit keine Stimme dominiert – auch Claude nicht.

Aufruf (Beispiel):
  python filter_kandidaten.py --pool rain_arrives --era e76 \
      --dir kandidaten/rain_arrives_e76 \
      --claude-js paket1b-ticker-wetter.js --n 24 --out ergebnis

Eingabe: je Quelle eine .txt (eine Zeile = ein Kandidat), Dateiname = Quellenname.
Nur Python-Standardbibliothek.
"""
import argparse, re, sys, difflib, unicodedata
from pathlib import Path
from collections import Counter

# ───────────────────────── Konfiguration je Pool ─────────────────────────
# Neuer Pool / neues Paket = neuer Eintrag hier. Keine Logik anfassen.
CAUSE = (r"Unfall|Unfälle|Crash|Kollision|Zusammenstoß|Zusammenprall|Öl\b|Ölspur|Feuer|Brand|"
         r"Flammen|Trümmer|Wrack|Unglück|Abflug|abgeflogen|Defekt|Streckenbegrenzung|Kiesbett|"
         r"Leitplanke|Barriere|Verletz|Rettung|Sanitäter|Arzt|Krankenwagen|Sicherheitsgründen|"
         r"Gefahr|Zwischenfall|Vorfall")
WEATHER = r"Regen|nass|Nässe|Wetter|Gischt|Schauer|Tropfen"
SCORING = r"Punkte|Wertung|Addition|addiert|halbe|zählt|gewertet"
PROFIT = r"profitier|Vorteil|Nachteil|zugute|Gewinner|Verlierer"

POOLS = {
  "wet_start":      dict(emoji="🌧️", ph={"fieldSize","totalLaps"}, reject=""),
  "rain_arrives":   dict(emoji="🌧️", ph={"lap","leader"},          reject=""),
  "track_drying":   dict(emoji="☀️", ph={"lap","leader"},          reject=""),
  "red_flag":       dict(emoji="🟥", ph={"lap","leader"},          reject=CAUSE+"|"+WEATHER),
  "red_flag_wet":   dict(emoji="🟥", ph={"lap","leader"},          reject=CAUSE),
  "restart_new":    dict(emoji="🟢", ph={"lap","totalLaps"},       reject=SCORING),
  "restart_resume": dict(emoji="🟢", ph={"lap","leader"},          reject=PROFIT),
}

for _cfg in POOLS.values():
    if "leader" in _cfg["ph"]:
        _cfg["ph"] = _cfg["ph"] | {"driver"}   # Fahrer-Slot: Code setzt wechselnde Fahrer ein

# Zeilen, die inhaltlich nur für den FÜHRENDEN gelten, bleiben bei {leader}.
# Alle anderen Zeilen mit Namen werden zu {driver} (jeder der sechs Fahrer möglich).
LEADER_BOUND = re.compile(
    r"[Ff]ühr|Spitze|\bvorn\w*|Referenz|Takt an|Tempo vorgibt|zeigt die Richtung|"
    r"behält oben|selbst \{leader\}|Vorsprung|Nase|voran|dahinter", re.I)

# echte Namen/Orte/Teams: Spiel-Geschichte weicht von der echten ab (Regel 3)
REAL = (r"Senna|Prost|Schumacher|Hamilton|Verstappen|Lauda|Fangio|Vettel|Alonso|Räikkönen|"
        r"Ascari|Moss|Ferrari|McLaren|Mercedes|Williams|Lotus|Brabham|Monza|Spa|Silverstone|"
        r"Monaco|Imola|Suzuka|Nürburgring|Hockenheim|Interlagos|Zandvoort|Indianapolis")

# Warnlisten: NICHT hart abgelehnt, nur markiert für die Agenten-Lesung
ERA_WARN = {
  "e50": r"Boxenfunk|Funk\b|Telemetrie|Intermediate|Inters\b|DRS|Safety|Setup|Aquaplaning|Grip\b|Traktion|Ampel|Reifenstrategie",
  "e62": r"Boxenfunk|Telemetrie|Intermediate|Inters\b|DRS|Safety|Setup|Grip\b|Ampel",
  "e76": r"Telemetrie|DRS|Inters\b|Intermediate|Full Wet|Safety|Broadcast",
  "e94": r"DRS|Full Wet|Inters\b|Broadcast",
  "e10": r"$^",
}
SLANG_OLD = r"krass|geil|mega|Hammer|Kracher|abgefahren|Action|cool"   # für e50/e62 nur Warnung

MIN_LEN, MAX_LEN, WARN_LEN = 18, 170, 130
SIM_RATIO, SIM_JACCARD = 0.80, 0.75
OPENER_CAP = 2       # gleiche Satzeröffnung max. so oft je Quelle (gilt für ALLE gleich)

# ───────────────────────── Hilfsfunktionen ─────────────────────────
def is_emoji_char(c):
    return unicodedata.category(c) in ("So", "Sk") or c in "\ufe0f\u200d"

def split_emoji(s):
    i = 0
    while i < len(s) and is_emoji_char(s[i]): i += 1
    return s[:i], s[i:].lstrip()

def norm_emoji(e): return e.replace("\ufe0f", "")

def clean_line(raw):
    s = raw.strip()
    if not s or s.startswith("#") or s.startswith("//"): return None
    s = re.sub(r"^\s*(?:\d+[.)]|[-*•])\s+", "", s)
    s = s.strip().rstrip(",").strip()
    if len(s) >= 2 and s[0] in "'\"„“`" and s[-1] in "'\"“”`": s = s[1:-1].strip()
    s = s.replace("\\'", "'")
    return s or None

def mask(body):
    t = re.sub(r"\{\w+\}", "§", body.lower())
    t = re.sub(r"[^\wäöüß§ ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def opener(m):
    toks = [w for w in m.split() if w not in ("runde", "§", "von")]
    return " ".join(toks[:3])

def similar(a, b):
    if difflib.SequenceMatcher(None, a, b).ratio() >= SIM_RATIO: return True
    A, B = set(a.split()), set(b.split())
    return bool(A and B) and len(A & B) / len(A | B) >= SIM_JACCARD

def read_js_pool(path, pool, era):
    src = Path(path).read_text(encoding="utf8")
    m = re.search(r"\b" + pool + r":\s*\{", src)
    if not m: return []
    seg = src[m.end():]
    end = re.search(r"\n\s{2}\}", seg)
    seg = seg[:end.start()] if end else seg
    m2 = re.search(r"\b" + era + r":\s*\[(.*?)\n\s*\]", seg, re.S)
    if not m2: return []
    return [x.replace("\\'", "'") for x in re.findall(r"'((?:[^'\\]|\\.)*)'", m2.group(1))]

# ───────────────────────── Stufe 1: harte Regeln ─────────────────────────
def check(raw_line, pool, era):
    """-> (ok, text, rejects, warns, notes)"""
    cfg = POOLS[pool]
    rejects, warns, notes = [], [], []
    s = clean_line(raw_line)
    if s is None: return None
    emo, body = split_emoji(s)
    if norm_emoji(emo) != norm_emoji(cfg["emoji"]):
        notes.append("emoji-korrigiert")
    text = cfg["emoji"] + " " + body
    # Platzhalter
    phs = re.findall(r"\{([^{}]*)\}", body)
    rest = re.sub(r"\{[^{}]*\}", "", body)
    if "{" in rest or "}" in rest: rejects.append("Klammern unausgewogen")
    for p in phs:
        if p not in cfg["ph"]: rejects.append("Platzhalter nicht erlaubt: {%s}" % p)
    if "driver" in phs and LEADER_BOUND.search(body): rejects.append("{driver} in Zeile, die den Führenden voraussetzt")
    if re.search(r"\{\w+\}[a-zäöüß]", body): rejects.append("Platzhalter gebeugt/angehängt")
    if re.search(r"\bdes\s+\{", body): rejects.append("Genitiv vor Platzhalter")
    if re.search(r"\b(der|dem|den)\s+\{", body): warns.append("Artikel vor Platzhalter")
    if re.search(r"\{\w+\}'?s\b", body): rejects.append("Genitiv-s am Platzhalter")
    # Inhalt
    if re.search(r"\d", body): rejects.append("Ziffer im Text")
    if len(body) < MIN_LEN: rejects.append("zu kurz")
    if len(body) > MAX_LEN: rejects.append("zu lang")
    elif len(body) > WARN_LEN: warns.append("lang")
    if cfg["reject"] and re.search(cfg["reject"], body, re.I): rejects.append("verbotener Inhalt (Ursache/Wetter/Wertung/Profiteur)")
    if re.search(r"\b(" + REAL + r")\b", body): rejects.append("echter Name/Ort/Team")
    # Warnungen (nur Lesehinweis)
    if re.search(ERA_WARN.get(era, "$^"), body, re.I): warns.append("Anachronismus?")
    if era in ("e50", "e62") and re.search(SLANG_OLD, body, re.I): warns.append("Register zu locker?")
    return (not rejects), text, rejects, warns, notes

# ───────────────────────── Stufe 2: Auswahl ohne Dominanz ─────────────────────────
def select(queues, n, minsingle, name_share=None):
    """Immer zuerst die Quelle mit den bisher wenigsten Treffern (Gleichstand: kleinste Quelle).
    So bleibt der Anteil je Quelle bis auf +-1 gleich, solange alle Quellen noch etwas haben."""
    picked = []
    order = sorted(queues, key=lambda k: len(queues[k]))
    single = lambda c: len(set(c["ph"])) <= 1
    def dup(c): return any(similar(c["mask"], p["mask"]) for p in picked)
    def take(k, pred):
        q = queues[k]
        for i, c in enumerate(q):
            if pred(c) and not dup(c):
                picked.append(q.pop(i)); return True
        return False
    has_l = lambda c: "leader" in c["ph"] or "driver" in c["ph"]
    def pick_next(pred):
        cnt = Counter(c["src"] for c in picked)
        for k in sorted(queues, key=lambda k: (cnt[k], order.index(k))):
            pref = pred
            if name_share is not None and pred is not single:
                want = has_l if (sum(map(has_l, picked)) < name_share * (len(picked) + 1)) else (lambda c: not has_l(c))
                if take(k, want): return True
            if take(k, pref): return True
        return False
    while sum(map(single, picked)) < minsingle and len(picked) < n and pick_next(single):
        pass
    while len(picked) < n and pick_next(lambda c: True):
        pass
    return picked

def style_stats(cands):
    n = len(cands)
    if not n: return "keine Kandidaten"
    f = lambda pat: sum(1 for c in cands if re.search(pat, c["text"])) / n
    top = Counter(opener(c["mask"]) for c in cands).most_common(3)
    return "Ø %d Zeichen | '!' %d%% | '?' %d%% | Gedankenstrich %d%% | häufigste Anfänge: %s" % (
        sum(len(c["text"]) for c in cands) / n, 100*f(r"!"), 100*f(r"\?"), 100*f(r" [–-] "),
        "; ".join("%s (%d)" % t for t in top))

# ───────────────────────── Hauptablauf ─────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pool", required=True, choices=sorted(POOLS))
    ap.add_argument("--era", required=True, choices=sorted(ERA_WARN))
    ap.add_argument("--dir", required=True, help="Ordner mit <quelle>.txt")
    ap.add_argument("--claude-js", help="Paket-JS, daraus wird die Quelle 'claude' gelesen")
    ap.add_argument("--n", type=int, default=0, help="Zielgröße; 0 = alle nicht doppelten Zeilen (mehr Vielfalt ist besser)")
    ap.add_argument("--no-driver-slot", action="store_true", help="{leader}-Zeilen nicht in {driver} umwandeln")
    ap.add_argument("--minsingle", type=int, default=4, help="min. Zeilen mit höchstens einem Platzhalter")
    ap.add_argument("--name-share", type=float, default=0.5, help="Ziel-Anteil Zeilen mit Namen ({leader}/{driver}) (nur Pools mit {leader})")
    ap.add_argument("--streichen", help="Datei mit Agenten-Streichungen: je Zeile '<quelle>:<zeilennr>'")
    ap.add_argument("--out", default="ergebnis")
    a = ap.parse_args()
    N = a.n or 10**6

    raw = {}
    for f in sorted(Path(a.dir).glob("*.txt")):
        raw[f.stem] = f.read_text(encoding="utf8").splitlines()
    if a.claude_js and "claude" not in raw:
        raw["claude"] = read_js_pool(a.claude_js, a.pool, a.era)
    if not raw: sys.exit("Keine Quellen gefunden.")

    gestrichen = set()
    if a.streichen and Path(a.streichen).exists():
        for l in Path(a.streichen).read_text(encoding="utf8").splitlines():
            m = re.match(r"\s*([\w\-]+:\d+)", l)
            if m: gestrichen.add(m.group(1))

    rep, surv, queues = [], [], {}
    rep.append("REPORT  Pool=%s  Ära=%s  Ziel=%s  Quellen=%s" % (a.pool, a.era, a.n or "alle", ", ".join(raw)))
    rep.append("=" * 78)
    for src, lines in raw.items():
        cands, rej, wcount, stricken, capped = [], Counter(), 0, 0, 0
        seen_open, seen_exact = Counter(), set()
        for i, l in enumerate(lines, 1):
            res = check(l, a.pool, a.era)
            if res is None: continue
            ok, text, rejects, warns, notes = res
            cid = "%s:%d" % (src, i)
            if not ok:
                for r_ in rejects: rej[r_] += 1
                continue
            if cid in gestrichen: stricken += 1; continue
            if (not a.no_driver_slot and "leader" in POOLS[a.pool]["ph"] and "{leader}" in text
                    and not LEADER_BOUND.search(text)):
                text = text.replace("{leader}", "{driver}"); notes.append("leader->driver")
            m = mask(text.split(" ", 1)[1] if " " in text else text)
            if m in seen_exact: rej["exaktes Duplikat"] += 1; continue
            seen_exact.add(m)
            o = opener(m)
            seen_open[o] += 1
            if seen_open[o] > OPENER_CAP: capped += 1; continue
            c = dict(id=cid, src=src, text=text, mask=m, warns=warns, notes=notes,
                     ph=re.findall(r"\{(\w+)\}", text))
            wcount += bool(warns)
            cands.append(c)
        queues[src] = list(cands); surv += cands
        rep.append("\n[%s] gelesen: %d | überlebt: %d | mit Warnung: %d | vom Agenten gestrichen: %d | Anfangs-Deckel: %d"
                   % (src, sum(1 for x in lines if clean_line(x)), len(cands), wcount, stricken, capped))
        for k, v in rej.most_common(): rep.append("     abgelehnt: %-55s %d" % (k, v))
        rep.append("     Stil: " + style_stats(cands))

    ls = a.name_share if "leader" in POOLS[a.pool]["ph"] else None
    picked = select(queues, N, a.minsingle, ls)
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    tag = "%s_%s" % (a.pool, a.era)
    with open(out / ("survivors_%s.tsv" % tag), "w", encoding="utf8") as fh:
        fh.write("id\tquelle\twarnungen\ttext\n")
        for c in surv: fh.write("%s\t%s\t%s\t%s\n" % (c["id"], c["src"], ",".join(c["warns"]), c["text"]))
    with open(out / ("auswahl_%s.js" % tag), "w", encoding="utf8") as fh:
        fh.write("    %s: [\n" % a.era)
        for i, c in enumerate(picked):
            esc = c["text"].replace("\\", "\\\\").replace("'", "\\'")
            tag_ = "L" if "leader" in c["ph"] else ("D" if "driver" in c["ph"] else "-")
            fh.write("      '%s'%s  // %s [%s]\n" % (esc, "," if i < len(picked)-1 else "", c["id"], tag_))
        fh.write("    ]\n")

    rep.append("\n" + "=" * 78 + "\nAUSWAHL: %d von %d Überlebenden (Round-Robin über Quellen)" % (len(picked), len(surv)))
    share = Counter(c["src"] for c in picked)
    rest = {k: len(q) for k, q in queues.items()}          # unbenutzte Überlebende je Quelle
    for s_ in raw:
        cnt = share.get(s_, 0)
        pct = 100 * cnt / max(1, len(picked))
        others_left = any(v > 0 for k, v in rest.items() if k != s_)
        flag = ""
        if len(raw) > 1 and pct > 100 / len(raw) + 15:
            if others_left:
                flag = "  <-- Anteil auffällig hoch, obwohl andere Quellen noch Kandidaten hätten (Duplikate/Minimum prüfen)"
            else:
                flag = "  (Anteil hoch, weil andere Quellen erschöpft sind: mehr Kandidaten dort anfordern)"
        rep.append("   %-12s %2d Zeilen (%d%%), unbenutzt übrig: %d%s" % (s_, cnt, pct, rest.get(s_, 0), flag))
    ns = sum(1 for c in picked if len(set(c["ph"])) <= 1)
    rep.append("   Zeilen mit höchstens einem Platzhalter: %d (Minimum %d)%s" % (ns, a.minsingle, "" if ns >= a.minsingle else "  <-- ZU WENIG"))
    if a.n and len(picked) < a.n: rep.append("   Hinweis: nur %d Zeilen erreicht – mehr Kandidaten anfordern." % len(picked))
    if "leader" in POOLS[a.pool]["ph"]:
        B = sum(1 for c in picked if "leader" in c["ph"])
        D = sum(1 for c in picked if "driver" in c["ph"])
        rep.append("   Zeilen mit Namen: %d von %d  (leader-gebunden {leader}: %d | fahrer-neutral {driver}: %d)" % (B + D, len(picked), B, D))
        if B + D:
            rep.append("   Geschätzter Führenden-Anteil an allen Namensnennungen (wenn {driver} zu 50%% den Führenden nennt): %d%%" % round(100 * (B + 0.5 * D) / (B + D)))
    rep.append("   Zeilen mit Warnung in der Auswahl: %d  (vor Einbau lesen!)" % sum(1 for c in picked if c["warns"]))
    txt = "\n".join(rep)
    (out / ("report_%s.txt" % tag)).write_text(txt, encoding="utf8")
    print(txt)
    print("\nDateien in %s: survivors_%s.tsv, auswahl_%s.js, report_%s.txt" % (out, tag, tag, tag))

if __name__ == "__main__":
    main()
