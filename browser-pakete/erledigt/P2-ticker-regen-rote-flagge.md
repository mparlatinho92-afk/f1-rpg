# Paket P2 (= Fable-Paket 1b): Live-Ticker-Texte für Regen und rote Flagge

Du arbeitest für ein Formel-1-Managerspiel (Browser, Deutsch, 1950 bis Zukunft). Du hast
**keinen** Zugriff auf das Projekt, und das ist auch nicht nötig: Alles, was du brauchst,
steht in dieser Datei.

## Worum es geht

Das Spiel hat einen Live-Ticker, der ein Rennen Runde für Runde als Textmeldungen
abspielt. Die Meldungen kommen aus einer Textbank `LIVE_COMMENTARY`: je Ereignis und je
Ära ein Pool von Vorlagen mit Platzhaltern. Es gibt schon Pools für Start, Boxenstopp,
Überholen, technischen Ausfall, Unfall, Tod und Zieleinlauf.

**Neu in der Simulation, aber im Ticker noch stumm:**
- **Regen** in zwei Stärken: *teilweise nass* (Regen setzt im Rennen ein oder die Strecke
  trocknet ab) und *durchgehend nass* (von Anfang bis Ende).
- **Rote Flagge**: das Rennen wird unterbrochen und danach wieder aufgenommen.

Deine Aufgabe: die Texte dafür. Wann das im Rennen passiert, entscheidet das Spiel. Du
lieferst nur die Sprache.

## Grundregeln (verbindlich)

1. **Der Text beschreibt nur, er entscheidet nichts.** Er darf nichts behaupten, was das
   Spiel nicht übergibt.
2. **Keine Ursache erfinden.** Die rote Flagge kommt ohne Grund an: Das Spiel weiß nicht,
   ob es ein Unfall, Öl, ein Feuer oder die Streckenbegrenzung war. Also keine
   Formulierung wie „nach dem schweren Unfall". Ausnahme: der eigene Pool `red_flag_wet`
   darf das Wetter nennen, denn den ruft das Spiel nur bei nassem Rennen auf.
3. **Keine echten Namen, Rennen, Unfälle oder Ereignisse.** Die Spielgeschichte weicht von
   der echten ab.
4. **Ära-Register statt Einheitston:**
   - **e50** 1950–61: heroisch, formell, Grand-Prix-Pathos
   - **e62** 1962–75: klassisch, sachlich-respektvoll
   - **e76** 1976–93: TV-Zeitalter, griffiger
   - **e94** 1994–2009: modern, technisch
   - **e10** 2010+: heutiges Broadcast-Deutsch, schnell
5. **Platzhalter nicht beugen.** `{driver}` ist ein fertiger Name und steht im Satz so,
   dass er unverändert passt (Subjekt oder unveränderliches Objekt, kein Genitiv-s).
   Zahlen stehen immer als „Runde {lap}", nie als ausgeschriebene Zahl mit Beugung.
6. **Deutsch, ein Emoji am Anfang**, wie im Bestand: 🌧️ Regen, ☀️ abtrocknend, 🟥 rote Flagge, 🟢 Wiederaufnahme.

## So klingt der Bestand (Pool `dnf_accident`, zwei Zeilen je Ära)

```
e50: '❌ Runde {lap}: {reason} bei {driver} – der Wagen steht abseits der Bahn.'
     '❌ Runde {lap}: Schreckmoment: {reason} bei {driver} – er scheidet aus.'
e62: '❌ Runde {lap}: {driver} scheidet nach {reason} aus.'
     '❌ Runde {lap}: Zwischenfall für {driver}: {reason}, Aufgabe.'
e76: '❌ Runde {lap}: {driver} fliegt ab – {reason}! Das Rennen ist gelaufen.'
     '❌ Runde {lap}: Drama! {reason} beendet das Rennen von {driver}.'
e94: '❌ Runde {lap}: {driver} ist raus – {reason}.'
     '❌ Runde {lap}: Rennende für {driver}: {reason} auf P{pos}.'
e10: '❌ Runde {lap}: {reason}! Das war es für {driver}.'
     '❌ Runde {lap}: Drama um {driver}: {reason} auf P{pos}.'
```

Ist eine Vorlage nicht voll belegbar (ein Platzhalter fehlt im Kontext), überspringt das
Spiel sie. Mehrere Platzhalter sind also erlaubt, aber jeder Pool braucht **auch Zeilen
nur mit `{lap}`**.

## Die sieben neuen Ereignisse

| Schlüssel | Wann | Platzhalter | Ären |
|---|---|---|---|
| `wet_start` | Rennstart bei durchgehend nassem Rennen, direkt nach der Startmeldung | `{fieldSize}`, `{totalLaps}` | alle fünf |
| `rain_arrives` | teilweise nass: Regen setzt im Rennen ein | `{lap}`, `{leader}` | alle fünf |
| `track_drying` | teilweise nass: die Strecke trocknet ab | `{lap}`, `{leader}` | alle fünf |
| `red_flag` | Unterbrechung, Grund unbekannt | `{lap}`, `{leader}` | **e62, e76, e94, e10** |
| `red_flag_wet` | Unterbrechung in einem nassen Rennen | `{lap}`, `{leader}` | **e62, e76, e94, e10** |
| `restart_new` | Wiederaufnahme **vor 2000**: Neustart | `{lap}`, `{totalLaps}` | **e62, e76, e94** |
| `restart_resume` | Wiederaufnahme **ab 2000**: Fortsetzung | `{lap}`, `{leader}` | **e94, e10** |

`{leader}` = der Führende in dem Moment. `{lap}` = aktuelle Runde. `{totalLaps}` = Renndistanz.

**Warum die Ären bei der roten Flagge fehlen:** Das Spiel würfelt rote Flaggen erst ab
1970 (vorher wurde das Verfahren nicht erfasst). In e62 zählen also nur die Jahre 1970–75.

**Warum zwei Wiederaufnahmen:** Bis 1999 wurde meist **neu gestartet**, die Reihenfolge
blieb dabei praktisch gleich. Ab 2000 wird **fortgesetzt**: Die Abstände sind gelöscht,
das Feld steht dicht beieinander, und neue Reifen gibt es frei. Das sorgt spürbar für
Durcheinander. Das Spiel bildet genau diesen Unterschied ab, die Texte sollen ihn hörbar
machen. Weil e94 über das Jahr 2000 reicht, stehen dort beide Pools.
- `restart_new`: **keine** Aussage über Wertung, Addition oder halbe Punkte, das rechnet das Spiel nicht.
- `restart_resume`: darf den Reifenwechsel, das Zusammenschieben und die neue Chance für
  die Verfolger nennen, aber **nicht** behaupten, dass jemand davon profitiert.

## Mengen

- `wet_start`, `rain_arrives`, `track_drying`: **8 Zeilen je Ära**
- `red_flag`, `red_flag_wet`: **8 Zeilen je Ära**
- `restart_new`, `restart_resume`: **6 Zeilen je Ära**

Die Ereignisse feuern höchstens einmal pro Rennen. Die Menge dient dazu, dass sich über
eine Saison nichts wiederholt, nicht dem Rennen selbst.

## Rückgabe: genau eine Datei `paket1b-ticker-wetter.js`

```js
// Paket 1b – Ticker: Regen und rote Flagge. Wird in LIVE_COMMENTARY eingehängt.
const LIVE_COMMENTARY_1B = {
  wet_start:      { e50: [...], e62: [...], e76: [...], e94: [...], e10: [...] },
  rain_arrives:   { e50: [...], ... },
  track_drying:   { e50: [...], ... },
  red_flag:       { e62: [...], e76: [...], e94: [...], e10: [...] },
  red_flag_wet:   { e62: [...], e76: [...], e94: [...], e10: [...] },
  restart_new:    { e62: [...], e76: [...], e94: [...] },
  restart_resume: { e94: [...], e10: [...] }
};
```

Darunter ein kurzer Kommentarblock: welche Zeilen dir grammatisch heikel vorkommen und wo du
beim Ton einer Ära unsicher warst.

Arbeite Ereignis für Ereignis und zeig nach jedem kurz eine Stichprobe (eine Zeile je Ära),
bevor du den nächsten Pool anfängst.
