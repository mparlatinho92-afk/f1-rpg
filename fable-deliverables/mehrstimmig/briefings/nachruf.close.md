# Briefing für Schreib-KIs: Sätze für Nachrufe in einem Formel-1-Managerspiel

> **So benutzt du diese Datei:** Ganz in einen **neuen** Chat kopieren und abschicken. Die Antwort in den Claude-Code-Chat kopieren, mit Name der KI dazu. Gleiches Briefing für alle KIs.

---

## AUFTRAG DIESES DURCHLAUFS

- **Pool:** `nachruf.close`
- **Ära:** keine – diese Sätze erscheinen in **allen** Epochen von 1950 bis in die Zukunft
- **Menge:** 40 Vorschläge

---

## Worum es geht

Ein Browser-Managerspiel (Deutsch, Formel 1 von 1950 bis in die Zukunft) würdigt Fahrer, die im Spiel tödlich verunglücken, mit einem kurzen **Nachruf** aus drei Sätzen (Eröffnung, Bilanz, Schluss). Jeder Satz stammt aus einem Pool von Vorlagen mit Platzhaltern. Du schreibst neue Vorlagen für einen Pool.

**Dieser Pool:** Schlusssatz des Nachrufs.
Form: ein Satz, würdevoll und nüchtern, ohne Kitsch.

**Wichtig:** Schreibe in **deinem eigenen, natürlichen Ton**. Versuche nicht, wie ein anderes Modell zu klingen. Gesucht sind ausdrücklich unterschiedliche Handschriften.

## Harte Regeln (Verstöße werden automatisch aussortiert)

1. **Nur beschreiben, nichts erfinden.** Das Spiel übergibt nur die Werte in der Platzhalter-Tabelle unten. Alles andere weiß es nicht. Deshalb: **keine Ursache**, **keine Intensität** („heftig“, „dramatisch“), **keine Orte** („auf der Geraden“), **keine Gefühle, Zustände oder Haltungen** einer Person („gelassen“, „wütend“), **keine weiteren Personen** und **keine erfundenen Ereignisse** aus der Vergangenheit.
2. **Keine echten Namen, Rennen, Strecken, Teams, Unfälle.** Die Spielgeschichte weicht von der echten ab; auch Anspielungen auf echte Ereignisse sind tabu.
3. **Platzhalter werden nie gebeugt.** Sie stehen als fertiger Wert im Satz: kein Genitiv-s (`{x}s` verboten), kein „des {x}“, nichts direkt anhängen. Schreib den Satz so, dass der Wert unverändert passt. Platzhalter nur in der Schreibweise der Tabelle, keine eigenen erfinden.
4. **Keine Ziffern im Text.** Zahlen kommen nur über Platzhalter. Keine ausgeschriebenen Zahlen, deren Form von einem Platzhalter abhängt.
5. **Keine Zeile zweimal, keine fast gleichen Zeilen.** Wechsle Satzbau, Länge und Einstieg. Höchstens zwei Zeilen mit demselben Anfang.
6. **Korrektes Deutsch.** Kommas vor Nebensätzen, keine Anglizismen, die es in der Epoche nicht gab.
7. **Länge:** 18 bis 140 Zeichen je Zeile.
8. **Keine Todesumstände.** Kein Feuer, keine Verletzung, kein Krankenhaus, keine Schuld. Das Spiel kennt nur, dass der Fahrer gestorben ist.
9. Der Fahrer ist männlich („er“, „sein“). Platzhalter dürfen am Satzanfang stehen.
10. **Speziell für diesen Pool:** passt zu jedem Verstorbenen, ob Meister oder Hinterbänkler.

## Zeitlos schreiben

Derselbe Satz kann 1952 und 2035 erscheinen. Deshalb **kein zeitgebundenes Wortmaterial** (Fernsehen, Boxenfunk, Daten, Rookie, Social Media, Turbo, Hybrid …). Den Ton der Epoche liefern Platzhalter wie `{klasseNom}`, die das Spiel je nach Jahr füllt.

## Platzhalter (nur diese, genau so geschrieben)

| Platzhalter | Bedeutung | Beispielwert | so verwenden |
|---|---|---|---|
| `{fahrerPl}` | Fahrer, Plural-Nomen | Fahrer / Piloten | Plural |
| `{klasseGen}` | Rennklasse im Genitiv | der Formel 1 / des Grand-Prix-Sports | nur Genitiv-Attribut |
| `{klasseIn}` | Rennklasse als fertige Präpositionalphrase | in der Formel 1 / im Grand-Prix-Sport | fertig, kein „in“ davor |
| `{klasseNom}` | Name der Rennklasse, Nominativ Singular | die Formel 1 / die Königsklasse / der Grand-Prix-Sport | nur Subjekt |

## Ausgabeformat (genau so, sonst geht Arbeit verloren)

- **Nur die Vorschläge**, eine pro Zeile, als reiner Text.
- **Keine** Nummerierung, keine Aufzählungszeichen, keine Anführungszeichen, keine Erklärungen, keine Überschriften, kein Codeblock.
- **Kein** Emoji.

Liefere jetzt **40 Vorschläge**.
