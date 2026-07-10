# Paket 1 — Delta-Spec: Live-Ticker-Kommentar

> **⚠️ ZUERST LESEN:** `fable-deliverables/FABLE-GRUNDREGELN.md` (alle 8 Regeln). Kern-Verbote, die hier gelten – egal was unten steht:
> 1. **NIE reale Erfolge/Fakten** (Titel, Siege, echte Karriere/Unfälle) – die Sim-Zeitlinie weicht ab.
> 2. **Ära-Register** e50/e62/e76/e94/e10 – Ton pro Dekade, kein Einheitston.
> 3. **0 Bytes gespeicherter Text** – nur Pools/Assembler, Regeneration zur Laufzeit; Sprache Deutsch.

> Baut auf `fable-deliverables/FABLE-GRUNDREGELN.md` auf. Hier steht nur das Paket-Spezifische.

**Deliverable:** `fable-deliverables/paket1-live-kommentar/live-commentary-bank.js`
— ein Objekt `LIVE_COMMENTARY` (Phrasen-Pools je Event × Ära) + optional ein winziger
Picker `liveLine(event, ctx)`. Rein deterministische Baustein-Montage, kein Runtime-LLM.

---

## 0. Was dieses Paket ist — und die eine große Sicherheitszusage
Der Live-Ticker ist laut CLAUDE.md **nur „das Wie" (Darstellung)**; die Zahlen (Ergebnis,
DNF, Tode, Punkte) entstehen in der Engine. Kommentar-Text ist damit **100 % Präsentation
und hat null Konsequenz** — er kann die `[SYNC simulateRace]`-Regel gar nicht verletzen.
Deshalb ist dieses Paket ungefährlich: es tauscht nur die aktuell **hartcodierten
Einzelstrings** in `addLiveEvent(...)` gegen variantenreiche, ära-gerechte Zeilen.

**Kein Determinismus nötig** (Unterschied zu Paket B): Der Ticker ist ephemer und wird nicht
re-gerendert. Ein einfacher (optional gewichteter) Zufalls-Pick pro Event genügt — nicht seeden.

**Warum Volumen hier am wichtigsten ist:** Ein Rennen feuert Dutzende Events (jede Box, jedes
Überholen, jeder Ausfall). Wenige Varianten → sofort spürbare Wiederholung. Das ist der
Haupt-Job dieses Pakets. Siehe Mengen in §3.

## 1. Die 6 realen Events (Opus committet auf diese Taxonomie)
Aus den 6 `addLiveEvent`-Aufrufen im aktuellen Ticker. Pro Event die **verfügbaren
Kontextfelder** (Opus stellt sie im ctx-Objekt bereit — Fable darf nur diese nutzen):

| Event-Key         | Auslöser (Ist-Zeile)                     | Verfügbare ctx-Felder |
|-------------------|------------------------------------------|-----------------------|
| `start`           | Rennstart (L10219)                       | `fieldSize`, `totalLaps`, `year` |
| `pit`             | Boxenstopp (L9658)                       | `driver`, `team`, `lap`, `totalLaps`, `pos`, `year` |
| `overtake`        | Überholmanöver (L9744)                    | `driver`, `victim`, `lap`, `pos`, `year` |
| `dnf_mechanical`  | Ausfall, `dnfType==='mechanical'` (L9703) | `driver`, `team`, `lap`, `reason`, `pos`, `year` |
| `dnf_accident`    | Ausfall, `dnfType==='accident'` (L9703)   | `driver`, `team`, `lap`, `reason`, `pos`, `year` |
| `death`           | Tödlicher Unfall (L9713)                  | `driver`, `team`, `lap`, `year` |
| `finish`          | Sieg/Zieldurchfahrt (L9761)               | `driver`, `team`, `year` |

- `driver`, `victim`, `team` = fertige Anzeige-Strings (Name / Teamname). **Nicht deklinieren.**
- `lap` = aktuelle Runde (Kardinalzahl, „Runde {lap}"). `pos` = aktuelle Position (Zahl).
- `year` wählt das Ära-Register (§ Grundregel 3) — Opus mappt `year` → Register-Key, Fable
  strukturiert die Pools nur nach den 5 Keys `e50 / e62 / e76 / e94 / e10`.
- **`reason` (WICHTIG):** Im Ist-Code ist der Ausfallgrund ein **englischer Token**
  ('Engine', 'Gearbox', 'Accident' …). **Opus liefert eine Token→Deutsch-Nomen-Map**
  (z.B. Engine→„Motorschaden", Gearbox→„Getriebeschaden", Suspension→„Aufhängungsdefekt").
  Fable behandelt `{reason}` deshalb als **fertiges deutsches Schadens-Nomen** und baut
  Templates, in die es als Nominal passt („Aus für {driver} — {reason}.").

## 2. Struktur des Deliverables
```js
const LIVE_COMMENTARY = {
  start:          { e50:[...], e62:[...], e76:[...], e94:[...], e10:[...] },
  pit:            { e50:[...], ... },
  overtake:       { e50:[...], ... },
  dnf_mechanical: { e50:[...], ... },
  dnf_accident:   { e50:[...], ... },
  death:          { e50:[...], ... },   // siehe §4 — nüchtern, ära-arm
  finish:         { e50:[...], ... },
};
```
Jeder String nutzt nur die für sein Event erlaubten Slots aus §1. Emoji-Präfix ist **optional**
(Opus kann es setzen); wenn Fable Emojis mitliefert, konsistent zum Ist-Stil
(🔧 pit, ⚡ overtake, ❌ dnf, 💀 death, 🏁 start/finish).

## 3. Mindest-Mengen pro Event × Register (Anti-Monotonie)
| Event | Varianten je Register | Begründung |
|-------|----------------------|------------|
| `pit`, `overtake`, `dnf_mechanical`, `dnf_accident` | **je 14–18** | feuern oft pro Rennen |
| `start`, `finish` | je 8–10 | 1× pro Rennen, aber prägnant |
| `death` | 6–8 (§4) | selten, bewusst sparsam |

Bei den DNF-Pools: **Hälfte mit `{reason}`-Slot, Hälfte generisch ohne** (falls die Map einen
Grund mal nicht kennt, und für Abwechslung). `dnf_accident` darf dramatischer sein als
`dnf_mechanical`, aber **keine Verletzungen/Todesfolge andeuten** — Tod ist ein eigenes Event.

## 4. Sonderfall `death` — Tonleitplanke
- 2 knappe Zeilen genügen pro Fall (der Ticker feuert danach nichts Beschönigendes).
- **Nüchtern, respektvoll, keine erfundene Ursache, kein Pathos-Kitsch.** Ära-Färbung nur
  minimal (formeller in e50, sachlicher in e10). Wiederverwendbarkeit im Sinne der Grundregel 7
  ist hier nicht nötig (death-only), aber der Ton muss zu Paket C (Nachrufe) passen.
- Nie „er kämpfte noch" / medizinische Details / Schuldzuweisung.

## 5. Fakten-Leitplanken speziell für Live-Kommentar
- Kommentar feuert **mitten im Rennen** ohne Kenntnis des Endergebnisses. Deshalb **nie**
  Wertungs-/Titel-Aussagen („damit ist er Weltmeister", „das entscheidet die Saison").
- `overtake` feuert nur, wenn real überholt wurde → Überhol-/Pace-Aussagen sind erlaubt.
  Aber keine Positions-Behauptung über `pos` hinaus („geht in Führung" nur wenn `pos===1`).
- `dnf_*`-Zeilen dürfen nur den übergebenen `{reason}` nennen, nie eine andere Schadensart.
- `finish`: „Sieg für {driver}" ja; **kein** „ungefährdet/dominant" (Abstand ist nicht im ctx —
  falls gewünscht, muss Opus erst `margin` nachliefern; ohne das keine Souveränitäts-Behauptung).

## 6. Opus-Vorarbeiten (bevor die Bank verdrahtet wird)
1. Token→Deutsch-Nomen-Map für `dnfReason` (alle Pools aus L9692–9700 abdecken).
2. `year` → Register-Key-Helfer (5 Bänder wie oben) — identisch zu Paket B/C halten.
3. Winzigen Picker `liveLine(event, ctx)` (Register wählen → Pool → Zufalls-Pick → Slots füllen),
   dann die 6 `addLiveEvent(...)`-Strings dagegen tauschen.
4. **Sieger-Zeile L9761 (portugiesisches Easter-Egg „BANDEIRADA…"):** Ersatz durch den
   deutschen `finish`-Pool ist eine **Nutzer-Entscheidung** — vor dem Tausch rückfragen.
5. `functions.schema.json` (`liveLine`), Changelog, manage-v (Hotfix, rein additiv).

## 7. Mini-Testfälle (Fable soll je 1 Beispiel pro Event mitliefern)
Für jedes Event eine Beispiel-Ausgabe in 2 Registern (z.B. e50 + e10), damit Opus Ton und
Slot-Füllung sofort prüfen kann. Z.B. `overtake`, e10, ctx `{driver:'Verstappen',
victim:'Norris', lap:34, pos:2}` → „⚡ Runde 34: Verstappen schnappt sich Norris — jetzt P2!"
