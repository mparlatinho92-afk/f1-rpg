# Briefing für Schreib-KIs: Ticker-Texte für ein Formel-1-Managerspiel

> **So benutzt du diese Datei:** Ära im Kasten unten eintragen, dann ganz in einen **neuen** Chat kopieren und abschicken. Die Antwort in den Claude-Code-Chat kopieren, mit Name der KI dazu. Gleiches Briefing für alle KIs.

---

## AUFTRAG DIESES DURCHLAUFS

- **Pool:** `ticker.red_flag`
- **Ära:** `____` ← eine aus der Tabelle „Ära-Register“ eintragen (e62, e76, e94, e10)
- **Menge:** 40 Vorschläge

---

## Worum es geht

Ein Browser-Managerspiel (Deutsch, Formel 1 von 1950 bis in die Zukunft) spielt Rennen Runde für Runde als **Live-Ticker** ab. Die Meldungen stammen aus einer Textbank: je Ereignis und je Ära ein Pool von Satzvorlagen mit Platzhaltern. Du schreibst neue Vorlagen für einen Pool. Wann sie im Rennen erscheinen, entscheidet das Spiel.

**Dieser Pool:** Rennunterbrechung, **Grund unbekannt**.
Form: eine Meldung, ein bis zwei kurze Sätze.

**Wichtig:** Schreibe in **deinem eigenen, natürlichen Ton**. Versuche nicht, wie ein anderes Modell zu klingen. Gesucht sind ausdrücklich unterschiedliche Handschriften.

## Harte Regeln (Verstöße werden automatisch aussortiert)

1. **Nur beschreiben, nichts erfinden.** Das Spiel übergibt nur die Werte in der Platzhalter-Tabelle unten. Alles andere weiß es nicht. Deshalb: **keine Ursache**, **keine Intensität** („heftig“, „dramatisch“), **keine Orte** („auf der Geraden“), **keine Gefühle, Zustände oder Haltungen** einer Person („gelassen“, „wütend“), **keine weiteren Personen** und **keine erfundenen Ereignisse** aus der Vergangenheit.
2. **Keine echten Namen, Rennen, Strecken, Teams, Unfälle.** Die Spielgeschichte weicht von der echten ab; auch Anspielungen auf echte Ereignisse sind tabu.
3. **Platzhalter werden nie gebeugt.** Sie stehen als fertiger Wert im Satz: kein Genitiv-s (`{x}s` verboten), kein „des {x}“, nichts direkt anhängen. Schreib den Satz so, dass der Wert unverändert passt. Platzhalter nur in der Schreibweise der Tabelle, keine eigenen erfinden.
4. **Keine Ziffern im Text.** Zahlen kommen nur über Platzhalter. Keine ausgeschriebenen Zahlen, deren Form von einem Platzhalter abhängt.
5. **Keine Zeile zweimal, keine fast gleichen Zeilen.** Wechsle Satzbau, Länge und Einstieg. Höchstens zwei Zeilen mit demselben Anfang.
6. **Korrektes Deutsch.** Kommas vor Nebensätzen, keine Anglizismen, die es in der Epoche nicht gab.
7. **Länge:** 18 bis 130 Zeichen je Zeile.
8. **Nichts über Titel oder Wertung.** Der Ticker läuft mitten im Rennen und kennt das Ende nicht.
9. **Ein Emoji am Anfang** (steht unten beim Pool), danach der Satz.
10. **Mischung der Platzhalter:** Etwa ein Drittel der Zeilen soll höchstens **einen** Platzhalter enthalten, weil das Spiel Zeilen überspringt, deren Platzhalter es gerade nicht belegen kann.
11. Schreibe Runden immer mit „**in** Runde {lap}“ oder „Runde {lap}:“, nie „auf Runde“, „zur Runde“ oder „mit Runde“.
12. **Speziell für diesen Pool:** **keine** Ursache (kein Unfall, Öl, Feuer, Trümmer, Sicherheit) und **kein Wetter**.

## Ära-Register

| Ära | Zeitraum | Ton |
|---|---|---|
| e62 | 1962–1975 | klassisch, sachlich-respektvoll |
| e76 | 1976–1993 | TV-Zeitalter, griffiger |
| e94 | 1994–2009 | modern, technisch |
| e10 | ab 2010 | heutiges Broadcast-Deutsch, schnell |

Halte dich an das Wortmaterial der Ära (in e50 und e62 gibt es zum Beispiel keinen Boxenfunk, keine Telemetrie, kein Fernsehen). Vermeide englische Fachwörter, die erst im heutigen Broadcast üblich sind (z. B. „Curbs“ vor 2000).

## Platzhalter (nur diese, genau so geschrieben)

| Platzhalter | Bedeutung | Beispielwert | so verwenden |
|---|---|---|---|
| `{lap}` | aktuelle Runde (Zahl) | 34 | „Runde {lap}:“ oder „in Runde {lap}“ |
| `{leader}` | Name des aktuell Führenden | Paul Hartmann | Subjekt oder unveränderliches Objekt |

Beispiel für die Form (nur Schema, kein Textvorschlag):

```
🟥 Runde {lap}: <Satz ohne Ziffern>
```

## Ausgabeformat (genau so, sonst geht Arbeit verloren)

- **Nur die Vorschläge**, eine pro Zeile, als reiner Text.
- **Keine** Nummerierung, keine Aufzählungszeichen, keine Anführungszeichen, keine Erklärungen, keine Überschriften, kein Codeblock.
- Jede Zeile beginnt mit dem Emoji 🟥, danach ein Leerzeichen und der Satz.

Liefere jetzt **40 Vorschläge**.
