# Briefing für Schreib-KIs: Ticker-Texte für ein Formel-1-Managerspiel

> **So benutzt du diese Datei:** Ganz in einen neuen Chat kopieren. Vorher nur den Kasten
> „AUFTRAG DIESES DURCHLAUFS" anpassen (Pool und Ära). Pool-Beschreibungen stehen unten.
> Die Antwort der KI als `<name-der-ki>.txt` speichern (eine Zeile = ein Vorschlag).

---

## AUFTRAG DIESES DURCHLAUFS

- **Pool:** `rain_arrives`
- **Ära:** `e76` (1976–1993, TV-Zeitalter, griffiger)
- **Menge:** 40 Vorschläge

---

## Worum es geht

Ein Browser-Managerspiel (Deutsch, Formel 1 von 1950 bis in die Zukunft) spielt Rennen
Runde für Runde als **Live-Ticker** ab. Die Meldungen stammen aus einer Textbank: je
Ereignis und je Ära ein Pool von Satzvorlagen mit Platzhaltern. Du schreibst neue
Vorlagen für einen Pool. Wann sie im Rennen erscheinen, entscheidet das Spiel.

**Wichtig:** Schreibe in **deinem eigenen, natürlichen Ton**. Versuche nicht, wie ein
anderes Modell zu klingen. Gesucht sind ausdrücklich unterschiedliche Handschriften.

## Harte Regeln (Verstöße werden automatisch aussortiert)

1. **Nur beschreiben, nichts entscheiden.** Behaupte nichts, was das Spiel nicht übergibt.
2. **Keine Ursache erfinden.** Das Spiel kennt nur die Ereignisse aus der Poolbeschreibung.
   Das heißt auch: **keine Intensität** (nicht „heftig", „stark", „Wolkenbruch", „prasselt"),
   **keine Ausdehnung** („auf der gesamten Strecke"), **keine Orte** („auf der Geraden"),
   **keine Zustände oder Haltung des Führenden** („gelassen", „unbeeindruckt") und **keine
   Gegner oder Duelle**. Das Spiel liefert nur Runde und Namen des Führenden.
3. **Keine echten Namen, Rennen, Strecken, Teams, Unfälle.** Die Spielgeschichte weicht
   von der echten ab.
4. **Platzhalter werden nie gebeugt.** Sie stehen als fertiger Name bzw. Wert im Satz:
   kein Genitiv-s (`{leader}s` verboten), kein `des {leader}`, nichts direkt anhängen.
5. **Keine Ziffern im Text.** Zahlen kommen nur über Platzhalter, zum Beispiel
   „Runde {lap}". Keine ausgeschriebenen Zahlen mit Beugung.
6. **Ein Emoji am Anfang** (steht im Pool unten), danach der Satz. 18 bis 140 Zeichen.
7. **Keine Zeile zweimal, keine fast gleichen Zeilen.** Wechsle Satzbau, Länge und Einstieg.
8. **Mischung der Platzhalter:** Etwa ein Drittel der Zeilen soll höchstens **einen**
   Platzhalter enthalten (Ausnahme: nur `{lap}`), weil das Spiel Zeilen überspringt,
   deren Platzhalter es nicht belegen kann.

## Ära-Register

| Ära | Zeitraum | Ton |
|---|---|---|
| e50 | 1950–61 | heroisch, formell, Grand-Prix-Pathos |
| e62 | 1962–75 | klassisch, sachlich-respektvoll |
| e76 | 1976–93 | TV-Zeitalter, griffiger |
| e94 | 1994–2009 | modern, technisch |
| e10 | ab 2010 | heutiges Broadcast-Deutsch, schnell |

Halte dich an das Wortmaterial der Ära (in e50 und e62 gibt es zum Beispiel keinen
Boxenfunk, keine Telemetrie, kein DRS). Vermeide englische Fachwörter, die erst im
heutigen Broadcast üblich sind (z. B. „Curbs" vor 2000).

Schreibe Runden immer mit „**in** Runde {lap}" oder „Runde {lap}:", nie „auf Runde",
„zur Runde" oder „mit Runde".

## Platzhalter

| Platzhalter | Bedeutung |
|---|---|
| `{lap}` | aktuelle Runde |
| `{leader}` | Name des aktuell Führenden (Subjekt oder unveränderliches Objekt) |
| `{totalLaps}` | Renndistanz in Runden |
| `{fieldSize}` | Anzahl der Fahrzeuge im Feld |

## So klingt der Bestand (anderer Pool, nur zur Orientierung bei Länge und Form)

```
e50: ❌ Runde {lap}: {reason} bei {driver} – der Wagen steht abseits der Bahn.
e62: ❌ Runde {lap}: {driver} scheidet nach {reason} aus.
e76: ❌ Runde {lap}: {driver} fliegt ab – {reason}! Das Rennen ist gelaufen.
e94: ❌ Runde {lap}: {driver} ist raus – {reason}.
e10: ❌ Runde {lap}: {reason}! Das war es für {driver}.
```

## Pool-Beschreibungen (den passenden in den Auftrag oben einsetzen)

| Pool | Emoji | Wann | Platzhalter | Zusatzregel |
|---|---|---|---|---|
| `wet_start` | 🌧️ | Start bei durchgehend nassem Rennen, direkt nach der Startmeldung | `{fieldSize}`, `{totalLaps}` | nur sagen, dass die Bahn nass ist; nicht behaupten, dass es gerade regnet |
| `rain_arrives` | 🌧️ | Regen setzt im laufenden Rennen ein | `{lap}`, `{leader}` | kein Boxenstopp, keine Reifenwahl als Tatsache behaupten; niemand „profitiert" |
| `track_drying` | ☀️ | die Strecke trocknet ab | `{lap}`, `{leader}` | keine Behauptung über Reifenwechsel |
| `red_flag` | 🟥 | Rennunterbrechung, **Grund unbekannt** | `{lap}`, `{leader}` | **keine** Ursache (kein Unfall, Öl, Feuer, Trümmer, Sicherheit) und **kein Wetter** |
| `red_flag_wet` | 🟥 | Unterbrechung bei nassem Rennen | `{lap}`, `{leader}` | Wetter darf als Kulisse genannt werden, sonst keine Ursache |
| `restart_new` | 🟢 | Wiederaufnahme **vor 2000**: Neustart | `{lap}`, `{totalLaps}` | nichts zu Wertung, Punkten, Addition |
| `restart_resume` | 🟢 | Wiederaufnahme **ab 2000**: Fortsetzung, Abstände gelöscht, Feld dicht, neue Reifen frei | `{lap}`, `{leader}` | darf Reifen, Zusammenschieben, neue Chance für Verfolger nennen, aber **nicht** behaupten, dass jemand profitiert |

Hinweis für `red_flag` und `red_flag_wet`: nur in den Ären e62 (1970–75), e76, e94, e10.
Für `restart_new`: e62, e76, e94. Für `restart_resume`: e94, e10.

## Ausgabeformat (genau so, sonst geht Arbeit verloren)

- **Nur die Vorschläge**, eine pro Zeile, als reiner Text.
- **Keine** Nummerierung, keine Aufzählungszeichen, keine Anführungszeichen, keine
  Erklärungen, keine Überschriften, kein Codeblock.
- Jede Zeile beginnt mit dem Emoji des Pools.

Beispiel für die Form (inhaltlich nur Platzhalter-Schema, kein Textvorschlag):

```
<Emoji> Runde {lap}: <Satz ohne Ziffern>
<Emoji> <Satz mit {leader}>
```

Liefere jetzt **40 Vorschläge**.
