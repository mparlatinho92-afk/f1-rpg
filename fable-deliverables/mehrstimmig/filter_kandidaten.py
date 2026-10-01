#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Stilneutraler Filter für mehrstimmige Textbanken (alle Fable-Satzbanken des Spiels).

Verallgemeinert aus Paket 1b/P2 (browser-pakete/erledigt/P2-ergebnis/filter_kandidaten.py).
Die Pools stehen in pools.py, die Logik ist dieselbe:
  Stufe 1  harte Regeln (Platzhalter, verbotene Inhalte, Ziffern, Länge, Duplikate)
  Stufe 2  Agent liest survivors_*.tsv, streicht nur Regelbruch/Ära/Grammatik
           (Datei streichungen.txt im Kandidatenordner, dann erneut laufen lassen)
  Auswahl  reihum über die Quellen, keine Stimme dominiert

Neu gegenüber P2:
  * Bestand kommt direkt aus index.html (Quelle "bestand"). Er bleibt vollständig erhalten;
    neue Zeilen, die einer Bestandszeile zu ähnlich sind, fliegen raus. Ausgegeben werden
    nur die NEUEN Zeilen zum Anhängen.
  * Pools ohne Ära-Achse (Rückblick, Vorschau, Nachruf …): --era weglassen.
  * Quellenkürzel aus dem Dateinamen ("Kimi K3 Hoch.txt" -> kimi), Zuordnung im Report.

Aufruf (aus diesem Ordner):
  python filter_kandidaten.py --liste
  python filter_kandidaten.py --pool ticker.pit --era e76
  python filter_kandidaten.py --pool rueckblick.closer.normal
  python filter_kandidaten.py --kalibrieren          # Regeln gegen den ganzen Bestand prüfen

Standardordner: kandidaten/<pool>[_<ära>]/  ->  ergebnis/<pool>[_<ära>]/
Nur Python-Standardbibliothek (+ node für bestand.js).
"""
import argparse, json, re, subprocess, sys, difflib, unicodedata
from pathlib import Path
from collections import Counter

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import pools as P

INDEX = HERE.parent.parent / "index.html"
SIM_RATIO, SIM_JACCARD = 0.80, 0.75
OPENER_CAP = 2       # gleiche Satzeröffnung max. so oft je Quelle (gilt für ALLE gleich)

# ───────────────────────── Hilfsfunktionen ─────────────────────────
def is_emoji_char(c):
    return unicodedata.category(c) in ("So", "Sk") or c in "️‍"

def split_emoji(s):
    i = 0
    while i < len(s) and is_emoji_char(s[i]): i += 1
    return s[:i], s[i:].lstrip()

def norm_emoji(e): return e.replace("️", "")

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

def source_names(files):
    """Dateiname -> Kürzel (erste Buchstabenfolge, klein: "Qwen3.7-plus" -> qwen).
    Doppelte bekommen -2, -3 … Das Kürzel ist die ID in streichungen.txt."""
    out, seen = {}, Counter()
    for f in files:
        m = re.match(r"[a-z]+", f.stem.lower())
        base = m.group(0) if m else "quelle"
        seen[base] += 1
        out[f] = base if seen[base] == 1 else "%s-%d" % (base, seen[base])
    return out

def read_bestand(pid, era, index=INDEX):
    path = P.bank_path(pid, era)
    try:
        r = subprocess.run(["node", str(HERE / "bestand.js"), str(index), path],
                           capture_output=True, text=True, encoding="utf8", check=True)
        return json.loads(r.stdout or "[]")
    except (OSError, subprocess.CalledProcessError) as e:
        print("WARNUNG: Bestand %s nicht lesbar (%s) – weiter ohne Bestand." % (path, e), file=sys.stderr)
        return []

def text_body(pid, text):
    return split_emoji(text)[1] if P.group_of(pid)["emoji"] else text

# ───────────────────────── Stufe 1: harte Regeln ─────────────────────────
def check(raw_line, pid, era):
    """-> (ok, text, rejects, warns, notes) oder None für Leer-/Kommentarzeilen"""
    pool, g = P.POOLS[pid], P.group_of(pid)
    rejects, warns, notes = [], [], []
    s = clean_line(raw_line)
    if s is None: return None
    emo, body = split_emoji(s)
    if g["emoji"]:
        if norm_emoji(emo) != norm_emoji(pool["emoji"]): notes.append("emoji-korrigiert")
        text = pool["emoji"] + " " + body
    else:
        if emo: notes.append("emoji-entfernt")
        text = body
    allowed = pool["ph"] | ({"driver"} if pool["driver_slot"] else set())
    # Platzhalter
    phs = re.findall(r"\{([^{}]*)\}", body)
    rest = re.sub(r"\{[^{}]*\}", "", body)
    if "{" in rest or "}" in rest: rejects.append("Klammern unausgewogen")
    for p in phs:
        if p not in allowed: rejects.append("Platzhalter nicht erlaubt: {%s}" % p)
    for p in sorted(pool["need"]):
        if p not in phs and not (p == "leader" and "driver" in phs): rejects.append("Pflicht-Platzhalter fehlt: {%s}" % p)
    if pool["driver_slot"] and "driver" in phs and re.search(P.LEADER_BOUND, body, re.I):
        rejects.append("{driver} in Zeile, die den Führenden voraussetzt")
    if re.search(r"\{\w+\}[a-zäöüß]", body): rejects.append("Platzhalter gebeugt/angehängt")
    if re.search(r"\bdes\s+\{", body): rejects.append("Genitiv vor Platzhalter")
    if re.search(r"\{\w+\}'?s\b", body): rejects.append("Genitiv-s am Platzhalter")
    if re.search(r"\{nameE\}\s*[,.;:!?–-]", body): rejects.append("{nameE} nicht direkt vom Verb gefolgt (Komma steckt schon drin)")
    if re.search(r"\b(der|dem|den)\s+\{(?!h2hText|peakText)", body): warns.append("Artikel vor Platzhalter")
    if not g["cap"] and re.match(r"[a-zäöüß]|\{(klasseNom|klasseGen|klasseIn|presseNom|publikum|deadRaceBei|fahrerPl|gap\w+|siege\w+)\}", body):
        rejects.append("Satzanfang klein (wird hier nicht automatisch großgeschrieben)")
    # Inhalt
    plain = re.sub(r"\{\w+\}", " ", body)          # Platzhalternamen nie gegen Regex prüfen ({favorit2})
    if re.search(r"\d", re.sub(pool["digits_ok"], "", plain) if pool["digits_ok"] else plain):
        rejects.append("Ziffer im Text")
    if len(body) < g["min_len"]: rejects.append("zu kurz")
    if len(body) > g["max_len"]: rejects.append("zu lang")
    elif len(body) > g["warn_len"]: warns.append("lang")
    for rx in (g.get("reject", ""), pool["reject"]):
        if rx and re.search(rx, plain, re.I):
            rejects.append("verbotener Inhalt: „%s“" % re.search(rx, plain, re.I).group(0))
    if re.search(r"\b(" + P.REAL + r")\b", plain): rejects.append("echter Name/Ort/Team")
    # Warnungen (nur Lesehinweis)
    if pool["warn"] and re.search(pool["warn"], plain, re.I): warns.append("prüfen: „%s“" % re.search(pool["warn"], plain, re.I).group(0))
    if era:
        if re.search(P.ERA_WARN.get(era, "$^"), plain, re.I): warns.append("Anachronismus?")
        if era in ("e50", "e62") and re.search(P.SLANG_OLD, plain, re.I): warns.append("Register zu locker?")
    elif re.search(P.TIMELESS_WARN, plain, re.I):
        warns.append("zeitgebunden? (Zeile erscheint in allen Epochen)")
    return (not rejects), text, rejects, warns, notes

# ───────────────────────── Stufe 2: Auswahl ohne Dominanz ─────────────────────────
def select(queues, n, minsingle, name_share=None, fixed=()):
    """Immer zuerst die Quelle mit den bisher wenigsten Treffern (Gleichstand: kleinste Quelle).
    `fixed` = Bestand: zählt für Ähnlichkeit, wird aber nicht ausgegeben."""
    picked = []
    order = sorted(queues, key=lambda k: len(queues[k]))
    single = lambda c: len(set(c["ph"])) <= 1
    def dup(c): return any(similar(c["mask"], p["mask"]) for p in picked) or any(similar(c["mask"], m) for m in fixed)
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
            if name_share is not None and pred is not single:
                want = has_l if (sum(map(has_l, picked)) < name_share * (len(picked) + 1)) else (lambda c: not has_l(c))
                if take(k, want): return True
            if take(k, pred): return True
        return False
    while sum(map(single, picked)) < minsingle and len(picked) < n and pick_next(single):
        pass
    while len(picked) < n and pick_next(lambda c: True):
        pass
    # Dubletten innerhalb der Kandidaten zählen, damit der Report sie ausweisen kann
    return picked

def style_stats(cands):
    n = len(cands)
    if not n: return "keine Kandidaten"
    f = lambda pat: sum(1 for c in cands if re.search(pat, c["text"])) / n
    top = Counter(opener(c["mask"]) for c in cands).most_common(3)
    return "Ø %d Zeichen | '!' %d%% | '?' %d%% | Gedankenstrich %d%% | häufigste Anfänge: %s" % (
        sum(len(c["text"]) for c in cands) / n, 100*f(r"!"), 100*f(r"\?"), 100*f(r" [–-] "),
        "; ".join("%s (%d)" % t for t in top))

# ───────────────────────── Kalibrierung ─────────────────────────
def kalibrieren():
    """Prüft jeden Pool-Bestand gegen die eigenen Regeln. Ablehnungen im Bestand heißen:
    Regel zu scharf ODER Bestandszeile bricht eine Regel. Beides vor dem Einsatz klären."""
    total = bad = 0
    for pid in sorted(P.POOLS):
        for era in (P.eras_of(pid) or [None]):
            lines = read_bestand(pid, era)
            for i, l in enumerate(lines, 1):
                res = check(l, pid, era)
                if res is None: continue
                total += 1
                if not res[0]:
                    bad += 1
                    print("%-40s %-4s #%-3d %s\n      %s" % (pid, era or "", i, "; ".join(res[2]), l))
    print("\nBestand geprüft: %d Zeilen, abgelehnt: %d" % (total, bad))

def liste():
    print("%-40s %-22s %s" % ("POOL", "ÄREN", "BESTAND (Zeilen je Ära)"))
    for pid in sorted(P.POOLS):
        eras = P.eras_of(pid)
        counts = [len(read_bestand(pid, e)) for e in (eras or [None])]
        print("%-40s %-22s %s" % (pid, " ".join(eras) or "zeitlos", " ".join(map(str, counts))))

# ───────────────────────── Hauptablauf ─────────────────────────
def main():
    ap = argparse.ArgumentParser(description="Stilneutraler Filter für mehrstimmige Textbanken")
    ap.add_argument("--pool", choices=sorted(P.POOLS), metavar="POOL", help="Pool-ID (siehe --liste)")
    ap.add_argument("--era", choices=P.ALL_ERAS, help="Ära; bei zeitlosen Pools weglassen")
    ap.add_argument("--dir", help="Ordner mit <quelle>.txt (Standard: kandidaten/<pool>[_<ära>])")
    ap.add_argument("--out", help="Ausgabeordner (Standard: ergebnis/<pool>[_<ära>])")
    ap.add_argument("--index", default=str(INDEX), help="index.html, aus der der Bestand gelesen wird")
    ap.add_argument("--ohne-bestand", action="store_true", help="Bestand ignorieren (nur Kandidaten vergleichen)")
    ap.add_argument("--n", type=int, default=0, help="Zielgröße neuer Zeilen; 0 = alle nicht doppelten")
    ap.add_argument("--no-driver-slot", action="store_true", help="{leader}-Zeilen nicht in {driver} umwandeln")
    ap.add_argument("--minsingle", type=int, help="min. Zeilen mit höchstens einem Platzhalter (Standard je Bank)")
    ap.add_argument("--name-share", type=float, default=0.5, help="Ziel-Anteil Zeilen mit Namen (nur Pools mit {leader})")
    ap.add_argument("--streichen", help="Agenten-Streichungen (Standard: <dir>/streichungen.txt)")
    ap.add_argument("--liste", action="store_true", help="alle Pools mit Ären und Bestand zeigen")
    ap.add_argument("--kalibrieren", action="store_true", help="Regeln gegen den gesamten Bestand prüfen")
    a = ap.parse_args()
    if a.liste: return liste()
    if a.kalibrieren: return kalibrieren()
    if not a.pool: ap.error("--pool fehlt (oder --liste / --kalibrieren)")

    pid, era = a.pool, a.era
    eras = P.eras_of(pid)
    if eras and era not in eras: ap.error("Pool %s braucht --era aus: %s" % (pid, " ".join(eras)))
    if not eras and era: ap.error("Pool %s ist zeitlos – --era weglassen" % pid)
    pool, g = P.POOLS[pid], P.group_of(pid)
    tag = pid + ("_" + era if era else "")
    cdir = Path(a.dir) if a.dir else HERE / "kandidaten" / tag
    out = Path(a.out) if a.out else HERE / "ergebnis" / tag
    N = a.n or 10**6
    minsingle = g["minsingle"] if a.minsingle is None else a.minsingle

    files = sorted(cdir.glob("*.txt")) if cdir.exists() else []
    files = [f for f in files if f.name != "streichungen.txt"]
    if not files: sys.exit("Keine Kandidaten in %s (je Quelle eine .txt)." % cdir)
    names = source_names(files)
    raw = {names[f]: f.read_text(encoding="utf8").splitlines() for f in files}

    bestand = [] if a.ohne_bestand else read_bestand(pid, era, a.index)
    fixed = [mask(text_body(pid, b)) for b in bestand]

    gestrichen = set()
    sfile = Path(a.streichen) if a.streichen else cdir / "streichungen.txt"
    if sfile.exists():
        for l in sfile.read_text(encoding="utf8").splitlines():
            m = re.match(r"\s*([\w\-]+:\d+)", l)
            if m: gestrichen.add(m.group(1))

    rep, surv, queues = [], [], {}
    rep.append("REPORT  Pool=%s  Ära=%s  Bank=%s" % (pid, era or "zeitlos", P.bank_path(pid, era)))
    rep.append("Quellen: " + ", ".join("%s = %s" % (names[f], f.name) for f in files))
    rep.append("Bestand: %d Zeilen (bleiben vollständig; neue Zeilen werden gegen sie auf Ähnlichkeit geprüft)" % len(bestand))
    rep.append("=" * 78)
    bestand_c = [dict(text=b, mask=m) for b, m in zip(bestand, fixed)]
    if bestand_c: rep.append("[bestand] Stil: " + style_stats(bestand_c))
    for src, lines in raw.items():
        cands, rej, wcount, stricken, capped, same = [], Counter(), 0, 0, 0, 0
        seen_open, seen_exact = Counter(), set()
        for i, l in enumerate(lines, 1):
            res = check(l, pid, era)
            if res is None: continue
            ok, text, rejects, warns, notes = res
            cid = "%s:%d" % (src, i)
            if not ok:
                for r_ in rejects: rej[r_] += 1
                continue
            if cid in gestrichen: stricken += 1; continue
            if (pool["driver_slot"] and not a.no_driver_slot and "{leader}" in text
                    and not re.search(P.LEADER_BOUND, text, re.I)):
                text = text.replace("{leader}", "{driver}"); notes.append("leader->driver")
            m = mask(text_body(pid, text))
            if m in seen_exact: rej["exaktes Duplikat"] += 1; continue
            seen_exact.add(m)
            if any(similar(m, f) for f in fixed): same += 1; continue
            o = opener(m)
            seen_open[o] += 1
            if seen_open[o] > OPENER_CAP: capped += 1; continue
            c = dict(id=cid, src=src, text=text, mask=m, warns=warns, notes=notes,
                     ph=re.findall(r"\{(\w+)\}", text))
            wcount += bool(warns)
            cands.append(c)
        queues[src] = list(cands); surv += cands
        rep.append("\n[%s] gelesen: %d | überlebt: %d | mit Warnung: %d | vom Agenten gestrichen: %d | "
                   "Anfangs-Deckel: %d | zu nah am Bestand: %d"
                   % (src, sum(1 for x in lines if clean_line(x)), len(cands), wcount, stricken, capped, same))
        for k, v in rej.most_common(): rep.append("     abgelehnt: %-60s %d" % (k, v))
        rep.append("     Stil: " + style_stats(cands))

    ls = a.name_share if pool["driver_slot"] else None
    picked = select(queues, N, minsingle, ls, fixed)
    out.mkdir(parents=True, exist_ok=True)
    with open(out / ("survivors_%s.tsv" % tag), "w", encoding="utf8") as fh:
        fh.write("id\tquelle\twarnungen\ttext\n")
        for c in surv: fh.write("%s\t%s\t%s\t%s\n" % (c["id"], c["src"], ",".join(c["warns"]), c["text"]))
    with open(out / ("auswahl_%s.js" % tag), "w", encoding="utf8") as fh:
        fh.write("// %d neue Zeilen für %s – an das Ende des bestehenden Arrays anhängen\n"
                 % (len(picked), P.bank_path(pid, era)))
        for c in picked:
            esc = c["text"].replace("\\", "\\\\").replace("'", "\\'")
            t_ = "L" if "leader" in c["ph"] else ("D" if "driver" in c["ph"] and pool["driver_slot"] else "-")
            fh.write("'%s',  // %s [%s]\n" % (esc, c["id"], t_))

    rep.append("\n" + "=" * 78 + "\nAUSWAHL: %d neue Zeilen von %d Überlebenden (Round-Robin über Quellen)" % (len(picked), len(surv)))
    share = Counter(c["src"] for c in picked)
    rest = {k: len(q) for k, q in queues.items()}
    for s_ in raw:
        cnt = share.get(s_, 0)
        pct = 100 * cnt / max(1, len(picked))
        others_left = any(v > 0 for k, v in rest.items() if k != s_)
        flag = ""
        if len(raw) > 1 and pct > 100 / len(raw) + 15:
            flag = ("  <-- Anteil auffällig hoch, obwohl andere Quellen noch Kandidaten hätten" if others_left
                    else "  (hoch, weil andere Quellen erschöpft sind: dort mehr anfordern)")
        rep.append("   %-14s %3d Zeilen (%d%%), unbenutzt übrig: %d%s" % (s_, cnt, pct, rest.get(s_, 0), flag))
    if minsingle:
        ns = sum(1 for c in picked if len(set(c["ph"])) <= 1)
        rep.append("   Zeilen mit höchstens einem Platzhalter: %d (Minimum %d)%s" % (ns, minsingle, "" if ns >= minsingle else "  <-- ZU WENIG"))
    if a.n and len(picked) < a.n: rep.append("   Hinweis: nur %d Zeilen erreicht – mehr Kandidaten anfordern." % len(picked))
    if pool["driver_slot"]:
        B = sum(1 for c in picked if "leader" in c["ph"])
        D = sum(1 for c in picked if "driver" in c["ph"])
        rep.append("   Zeilen mit Namen: %d von %d  (leader-gebunden {leader}: %d | fahrer-neutral {driver}: %d)" % (B + D, len(picked), B, D))
    rep.append("   Pool danach: %d Zeilen (Bestand %d + neu %d)" % (len(bestand) + len(picked), len(bestand), len(picked)))
    rep.append("   Zeilen mit Warnung in der Auswahl: %d  (vor Einbau lesen!)" % sum(1 for c in picked if c["warns"]))
    txt = "\n".join(rep)
    (out / ("report_%s.txt" % tag)).write_text(txt, encoding="utf8")
    print(txt)
    print("\nDateien in %s: survivors_%s.tsv, auswahl_%s.js, report_%s.txt" % (out, tag, tag, tag))

if __name__ == "__main__":
    main()
