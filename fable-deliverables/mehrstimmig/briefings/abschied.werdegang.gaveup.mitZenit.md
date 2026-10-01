# Briefing für Schreib-KIs: Sätze für Karriere-Abschiede in einem Formel-1-Managerspiel

> **So benutzt du diese Datei:** Ganz in einen **neuen** Chat kopieren und abschicken. Die Antwort in den Claude-Code-Chat kopieren, mit Name der KI dazu. Gleiches Briefing für alle KIs.

---

## AUFTRAG DIESES DURCHLAUFS

- **Pool:** `abschied.werdegang.gaveup.mitZenit`
- **Ära:** keine – diese Sätze erscheinen in **allen** Epochen von 1950 bis in die Zukunft
- **Menge:** 40 Vorschläge

---

## Worum es geht

Ein Browser-Managerspiel (Deutsch, Formel 1 von 1950 bis in die Zukunft) verabschiedet Fahrer, die ihre Laufbahn beenden, mit einem kurzen **Abschiedstext** aus drei bis vier Sätzen (Eröffnung, Werdegang, Bilanz, Schluss). Jeder Satz stammt aus einem Pool von Vorlagen mit Platzhaltern. Du schreibst neue Vorlagen für einen Pool.

**Dieser Pool:** Werdegang-Satz zwischen Eröffnung und Bilanz. Der Fahrer gibt vorzeitig auf, weil ihm die Kraft oder der Wille fehlt (nicht aus Altersgründen). Sein Höhepunkt ist bekannt ({peakText}).
Form: ein Satz, warm und würdevoll, ohne Kitsch.

**Wichtig:** Schreibe in **deinem eigenen, natürlichen Ton**. Versuche nicht, wie ein anderes Modell zu klingen. Gesucht sind ausdrücklich unterschiedliche Handschriften.

## Harte Regeln (Verstöße werden automatisch aussortiert)

1. **Nur beschreiben, nichts erfinden.** Das Spiel übergibt nur die Werte in der Platzhalter-Tabelle unten. Alles andere weiß es nicht. Deshalb: **keine Ursache**, **keine Intensität** („heftig“, „dramatisch“), **keine Orte** („auf der Geraden“), **keine Gefühle, Zustände oder Haltungen** einer Person („gelassen“, „wütend“), **keine weiteren Personen** und **keine erfundenen Ereignisse** aus der Vergangenheit.
2. **Keine echten Namen, Rennen, Strecken, Teams, Unfälle.** Die Spielgeschichte weicht von der echten ab; auch Anspielungen auf echte Ereignisse sind tabu.
3. **Platzhalter werden nie gebeugt.** Sie stehen als fertiger Wert im Satz: kein Genitiv-s (`{x}s` verboten), kein „des {x}“, nichts direkt anhängen. Schreib den Satz so, dass der Wert unverändert passt. Platzhalter nur in der Schreibweise der Tabelle, keine eigenen erfinden.
4. **Keine Ziffern im Text.** Zahlen kommen nur über Platzhalter. Keine ausgeschriebenen Zahlen, deren Form von einem Platzhalter abhängt.
5. **Keine Zeile zweimal, keine fast gleichen Zeilen.** Wechsle Satzbau, Länge und Einstieg. Höchstens zwei Zeilen mit demselben Anfang.
6. **Korrektes Deutsch.** Kommas vor Nebensätzen, keine Anglizismen, die es in der Epoche nicht gab.
7. **Länge:** 18 bis 140 Zeichen je Zeile.
8. Der Fahrer lebt und tritt zurück: nichts, was nach Tod oder Unglück klingt.
9. Der Fahrer ist männlich („er“, „sein“). Platzhalter dürfen am Satzanfang stehen.
10. **Speziell für diesen Pool:** erzählt den Bogen vom Debüt bis heute; {peakText} genau einmal.
11. **Pflicht in jeder Zeile:** `{peakText}`.

## Zeitlos schreiben

Derselbe Satz kann 1952 und 2035 erscheinen. Deshalb **kein zeitgebundenes Wortmaterial** (Fernsehen, Boxenfunk, Daten, Rookie, Social Media, Turbo, Hybrid …). Den Ton der Epoche liefern Platzhalter wie `{klasseNom}`, die das Spiel je nach Jahr füllt.

## Platzhalter (nur diese, genau so geschrieben)

| Platzhalter | Bedeutung | Beispielwert | so verwenden |
|---|---|---|---|
| `{peakText}` | Höhepunkt als fertiges Prädikatsnomen | ein Titelanwärter / ein Rennsieger / ein Podestkandidat | nur nach „war er“ o. Ä. |
| `{seasonsText}` | Dauer der Laufbahn als fertige Zeitangabe | nach zwölf Jahren im Feld / nach nur einer Saison im Cockpit | adverbial; am Satzanfang folgt das Verb (V2) |

## Ausgabeformat (genau so, sonst geht Arbeit verloren)

- **Nur die Vorschläge**, eine pro Zeile, als reiner Text.
- **Keine** Nummerierung, keine Aufzählungszeichen, keine Anführungszeichen, keine Erklärungen, keine Überschriften, kein Codeblock.
- **Kein** Emoji.

Liefere jetzt **40 Vorschläge**.
