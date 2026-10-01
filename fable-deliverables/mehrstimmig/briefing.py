#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Baut das Briefing für Fremd-KIs (Gemini, ChatGPT, Kimi, Mistral, Qwen …) aus pools.py.

Das Briefing ist die Verallgemeinerung von
browser-pakete/erledigt/P2-ergebnis/P2-fremd-ki-briefing.md:
  * enthält KEINE Bestandszeilen (keine Stilansteckung, KONZEPT-mehrstimmige-textbanken.md)
  * nennt nur die Platzhalter, die das Spiel für diesen Pool wirklich übergibt
  * trägt die Streichgründe der ersten Agenten-Lesung als feste Regel (Intensität, Ort,
    Zustand, Ära, Grammatik), damit der nächste Durchlauf weniger davon produziert

Aufruf (aus diesem Ordner):
  python briefing.py --pool ticker.pit --era e76          # -> briefings/ticker.pit_e76.md
  python briefing.py --pool rueckblick.closer.normal      # zeitlos, ohne --era
  python briefing.py --pool duell.eng                     # Ära bleibt im Auftragskasten offen
  python briefing.py --alle                               # ein Briefing je Pool nach briefings/
Optional: --menge 60 (Standard 40), --stdout (nur ausgeben, nichts schreiben)
"""
import argparse, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import pools as P

ALLGEMEIN = [
    "**Nur beschreiben, nichts erfinden.** Das Spiel übergibt nur die Werte in der Platzhalter-Tabelle "
    "unten. Alles andere weiß es nicht. Deshalb: **keine Ursache**, **keine Intensität** („heftig“, "
    "„dramatisch“), **keine Orte** („auf der Geraden“), **keine Gefühle, Zustände oder Haltungen** einer "
    "Person („gelassen“, „wütend“), **keine weiteren Personen** und **keine erfundenen Ereignisse** aus der Vergangenheit.",
    "**Keine echten Namen, Rennen, Strecken, Teams, Unfälle.** Die Spielgeschichte weicht von der "
    "echten ab; auch Anspielungen auf echte Ereignisse sind tabu.",
    "**Platzhalter werden nie gebeugt.** Sie stehen als fertiger Wert im Satz: kein Genitiv-s "
    "(`{x}s` verboten), kein „des {x}“, nichts direkt anhängen. Schreib den Satz so, dass der Wert "
    "unverändert passt. Platzhalter nur in der Schreibweise der Tabelle, keine eigenen erfinden.",
    "**Keine Ziffern im Text.** Zahlen kommen nur über Platzhalter. Keine ausgeschriebenen Zahlen, "
    "deren Form von einem Platzhalter abhängt.",
    "**Keine Zeile zweimal, keine fast gleichen Zeilen.** Wechsle Satzbau, Länge und Einstieg. "
    "Höchstens zwei Zeilen mit demselben Anfang.",
    "**Korrektes Deutsch.** Kommas vor Nebensätzen, keine Anglizismen, die es in der Epoche nicht gab.",
]


def ph_table(pid):
    pool = P.POOLS[pid]
    rows = ["| Platzhalter | Bedeutung | Beispielwert | so verwenden |", "|---|---|---|---|"]
    for name in sorted(pool["ph"]):
        bed, bsp, use = P.ph_info(pid, name)
        rows.append("| `{%s}` | %s | %s | %s |" % (name, bed, bsp, use.replace("|", "/")))
    return "\n".join(rows)


def build(pid, era=None, menge=40):
    pool, g = P.POOLS[pid], P.group_of(pid)
    eras = P.eras_of(pid)
    tag = pid + ("_" + era if era else "")
    out = []
    out.append("# Briefing für Schreib-KIs: %s" % g["titel"])
    out.append("")
    out.append("> **So benutzt du diese Datei:** %s in einen **neuen** Chat kopieren und abschicken. "
               "Die Antwort in den Claude-Code-Chat kopieren, mit Name der KI dazu. "
               "Gleiches Briefing für alle KIs."
               % ("Ära im Kasten unten eintragen, dann ganz" if eras and not era else "Ganz"))
    out += ["", "---", "", "## AUFTRAG DIESES DURCHLAUFS", ""]
    out.append("- **Pool:** `%s`" % pid)
    if eras:
        if era:
            out.append("- **Ära:** `%s` (%s, %s)" % (era, P.ERAS[era][0], P.ERAS[era][1]))
        else:
            out.append("- **Ära:** `____` ← eine aus der Tabelle „Ära-Register“ eintragen (%s)" % ", ".join(eras))
    else:
        out.append("- **Ära:** keine – diese Sätze erscheinen in **allen** Epochen von 1950 bis in die Zukunft")
    out.append("- **Menge:** %d Vorschläge" % menge)
    out += ["", "---", "", "## Worum es geht", "", g["worum"], ""]
    out.append("**Dieser Pool:** %s." % pool["wann"].rstrip("."))
    out.append("Form: %s." % g["form"])
    out += ["", "**Wichtig:** Schreibe in **deinem eigenen, natürlichen Ton**. Versuche nicht, wie ein "
            "anderes Modell zu klingen. Gesucht sind ausdrücklich unterschiedliche Handschriften.", ""]

    out += ["## Harte Regeln (Verstöße werden automatisch aussortiert)", ""]
    regeln = list(ALLGEMEIN)
    regeln.append("**Länge:** %d bis %d Zeichen je Zeile." % (g["min_len"], g["warn_len"]))
    regeln += g["regeln"]
    if pool["zusatz"]:
        regeln.append("**Speziell für diesen Pool:** %s." % pool["zusatz"].rstrip("."))
    if pool["need"]:
        regeln.append("**Pflicht in jeder Zeile:** %s." % ", ".join("`{%s}`" % n for n in sorted(pool["need"])))
    if not pool["ph"]:
        regeln.append("**Keine Platzhalter** in diesem Pool.")
    for i, r in enumerate(regeln, 1):
        out.append("%d. %s" % (i, r))
    out.append("")

    if eras:
        out += ["## Ära-Register", "", "| Ära | Zeitraum | Ton |", "|---|---|---|"]
        for e in eras:
            mark = " **← dieser Auftrag**" if e == era else ""
            out.append("| %s | %s | %s%s |" % (e, P.ERAS[e][0], P.ERAS[e][1], mark))
        out += ["", "Halte dich an das Wortmaterial der Ära (in e50 und e62 gibt es zum Beispiel keinen "
                "Boxenfunk, keine Telemetrie, kein Fernsehen). Vermeide englische Fachwörter, die erst im "
                "heutigen Broadcast üblich sind (z. B. „Curbs“ vor 2000).", ""]
    else:
        out += ["## Zeitlos schreiben", "",
                "Derselbe Satz kann 1952 und 2035 erscheinen. Deshalb **kein zeitgebundenes Wortmaterial** "
                "(Fernsehen, Boxenfunk, Daten, Rookie, Social Media, Turbo, Hybrid …). Den Ton der Epoche "
                "liefern Platzhalter wie `{klasseNom}`, die das Spiel je nach Jahr füllt.", ""]

    if pool["ph"]:
        out += ["## Platzhalter (nur diese, genau so geschrieben)", "", ph_table(pid), ""]
        if pool["emoji"]:
            out.append("Beispiel für die Form (nur Schema, kein Textvorschlag):")
            out += ["", "```", "%s Runde {lap}: <Satz ohne Ziffern>" % pool["emoji"]
                    if "lap" in pool["ph"] else "%s <Satz mit Platzhaltern>" % pool["emoji"], "```", ""]

    out += ["## Ausgabeformat (genau so, sonst geht Arbeit verloren)", "",
            "- **Nur die Vorschläge**, eine pro Zeile, als reiner Text.",
            "- **Keine** Nummerierung, keine Aufzählungszeichen, keine Anführungszeichen, keine "
            "Erklärungen, keine Überschriften, kein Codeblock."]
    if pool["emoji"]:
        out.append("- Jede Zeile beginnt mit dem Emoji %s, danach ein Leerzeichen und der Satz." % pool["emoji"])
    else:
        out.append("- **Kein** Emoji.")
    out += ["", "Liefere jetzt **%d Vorschläge**." % menge, ""]
    return tag, "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description="Briefing für Fremd-KIs aus pools.py bauen")
    ap.add_argument("--pool", choices=sorted(P.POOLS), metavar="POOL")
    ap.add_argument("--era", choices=P.ALL_ERAS)
    ap.add_argument("--menge", type=int, default=40)
    ap.add_argument("--alle", action="store_true", help="ein Briefing je Pool nach briefings/ (Ära im Kasten offen)")
    ap.add_argument("--stdout", action="store_true")
    a = ap.parse_args()
    jobs = []
    if a.alle:
        jobs = [(pid, None) for pid in sorted(P.POOLS)]
    elif a.pool:
        eras = P.eras_of(a.pool)
        if a.era and a.era not in eras: ap.error("Pool %s kennt die Ären: %s" % (a.pool, " ".join(eras) or "keine (zeitlos)"))
        jobs = [(a.pool, a.era)]
    else:
        ap.error("--pool oder --alle angeben (Pools: python filter_kandidaten.py --liste)")
    target = HERE / "briefings"
    for pid, era in jobs:
        tag, text = build(pid, era, a.menge)
        if a.stdout:
            print(text); continue
        target.mkdir(exist_ok=True)
        (target / (tag + ".md")).write_text(text, encoding="utf8")
        if not a.alle and (era or not P.eras_of(pid)):
            (HERE / "kandidaten" / tag).mkdir(parents=True, exist_ok=True)   # Ablage gleich anlegen
        print("geschrieben: briefings/%s.md" % tag)


if __name__ == "__main__":
    main()
