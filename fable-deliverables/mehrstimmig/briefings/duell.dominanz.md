# Briefing für Schreib-KIs: Sätze über sportliche Duelle in einem Formel-1-Managerspiel

> **So benutzt du diese Datei:** Ära im Kasten unten eintragen, dann ganz in einen **neuen** Chat kopieren und abschicken. Die Antwort in den Claude-Code-Chat kopieren, mit Name der KI dazu. Gleiches Briefing für alle KIs.

---

## AUFTRAG DIESES DURCHLAUFS

- **Pool:** `duell.dominanz`
- **Ära:** `____` ← eine aus der Tabelle „Ära-Register“ eintragen (e50, e62, e76, e94, e10)
- **Menge:** 40 Vorschläge

---

## Worum es geht

Ein Browser-Managerspiel (Deutsch, Formel 1 von 1950 bis in die Zukunft) beschreibt im Fahrerprofil das markanteste **sportliche Duell** eines Fahrers in einem Satz. Die Grundlage sind echte Zahlen aus dem Spiel (Duellstand). Du schreibst neue Vorlagen für einen Pool.

**Dieser Pool:** Teamkollegen-Duell dieser Saison, klar einseitig: {driver} ist vorn.
Form: ein bis zwei Sätze.

**Wichtig:** Schreibe in **deinem eigenen, natürlichen Ton**. Versuche nicht, wie ein anderes Modell zu klingen. Gesucht sind ausdrücklich unterschiedliche Handschriften.

## Harte Regeln (Verstöße werden automatisch aussortiert)

1. **Nur beschreiben, nichts erfinden.** Das Spiel übergibt nur die Werte in der Platzhalter-Tabelle unten. Alles andere weiß es nicht. Deshalb: **keine Ursache**, **keine Intensität** („heftig“, „dramatisch“), **keine Orte** („auf der Geraden“), **keine Gefühle, Zustände oder Haltungen** einer Person („gelassen“, „wütend“), **keine weiteren Personen** und **keine erfundenen Ereignisse** aus der Vergangenheit.
2. **Keine echten Namen, Rennen, Strecken, Teams, Unfälle.** Die Spielgeschichte weicht von der echten ab; auch Anspielungen auf echte Ereignisse sind tabu.
3. **Platzhalter werden nie gebeugt.** Sie stehen als fertiger Wert im Satz: kein Genitiv-s (`{x}s` verboten), kein „des {x}“, nichts direkt anhängen. Schreib den Satz so, dass der Wert unverändert passt. Platzhalter nur in der Schreibweise der Tabelle, keine eigenen erfinden.
4. **Keine Ziffern im Text.** Zahlen kommen nur über Platzhalter. Keine ausgeschriebenen Zahlen, deren Form von einem Platzhalter abhängt.
5. **Keine Zeile zweimal, keine fast gleichen Zeilen.** Wechsle Satzbau, Länge und Einstieg. Höchstens zwei Zeilen mit demselben Anfang.
6. **Korrektes Deutsch.** Kommas vor Nebensätzen, keine Anglizismen, die es in der Epoche nicht gab.
7. **Länge:** 30 bis 150 Zeichen je Zeile.
8. **Nur das sportliche Duell.** Keine Feindschaft, kein Streit, keine Zitate, keine Dramen abseits der Strecke.
9. Platzhalter dürfen am Satzanfang stehen.
10. **Speziell für diesen Pool:** {driver} ist immer der Überlegene.

## Ära-Register

| Ära | Zeitraum | Ton |
|---|---|---|
| e50 | 1950–1961 | heroisch, formell, Grand-Prix-Pathos |
| e62 | 1962–1975 | klassisch, sachlich-respektvoll |
| e76 | 1976–1993 | TV-Zeitalter, griffiger |
| e94 | 1994–2009 | modern, technisch |
| e10 | ab 2010 | heutiges Broadcast-Deutsch, schnell |

Halte dich an das Wortmaterial der Ära (in e50 und e62 gibt es zum Beispiel keinen Boxenfunk, keine Telemetrie, kein Fernsehen). Vermeide englische Fachwörter, die erst im heutigen Broadcast üblich sind (z. B. „Curbs“ vor 2000).

## Platzhalter (nur diese, genau so geschrieben)

| Platzhalter | Bedeutung | Beispielwert | so verwenden |
|---|---|---|---|
| `{driver}` | Name des ersten Fahrers (bei Dominanz: der Überlegene) | Paul Hartmann | Name |
| `{h2hText}` | Duellstand als fertige Phrase | 12:8 in den Rennen / nur drei Punkte Abstand in der Wertung | als Einschub oder nach Doppelpunkt |
| `{rival}` | Name des Gegenübers | Luca Ferri | Name |

## Ausgabeformat (genau so, sonst geht Arbeit verloren)

- **Nur die Vorschläge**, eine pro Zeile, als reiner Text.
- **Keine** Nummerierung, keine Aufzählungszeichen, keine Anführungszeichen, keine Erklärungen, keine Überschriften, kein Codeblock.
- **Kein** Emoji.

Liefere jetzt **40 Vorschläge**.
