# Paket 8 — Delta-Spec: Fiktive Strecken- & Rennnamen

> **⚠️ ZUERST LESEN:** `fable-deliverables/FABLE-GRUNDREGELN.md` (alle 8 Regeln). Kern-Verbote, die hier gelten – egal was unten steht:
> 1. **NIE reale Erfolge/Fakten** (Titel, Siege, echte Karriere/Unfälle) – die Sim-Zeitlinie weicht ab.
> 2. **Ära-Register** e50/e62/e76/e94/e10 – Ton pro Dekade, kein Einheitston.
> 3. **0 Bytes gespeicherter Text** – nur Pools/Assembler; Sprache Deutsch (Eigennamen nativ).

> Baut auf `fable-deliverables/FABLE-GRUNDREGELN.md` auf.
> **SPEC-Entwurf von Fable (2026-07-11, Nutzer-Idee bei Paket 6).** Interface-Details
> (§0, Editor-Felder, Einhängepunkte) bestätigt/korrigiert Opus beim Feature-Bau.

**Deliverable:** `paket8-strecken/circuit-name-pools.js` — nationskohärente Orts-,
Strecken- und Rennnamen-Bausteine, ära-getreu (Schwester-Paket zu Paket 6).

## 0. ⚠️ ABHÄNGIGKEIT — Opus-Feature MUSS zuerst existieren (analog Paket 6 §0)
Es gibt **keinen Streckeneditor** im Code. Strecken stammen aus den Templates
(`circuitId` + `CIRCUIT_LENGTHS`/`getCircuitBaseTime`). Fables Pools sind wirkungslos, bis
Opus baut:
1. **Streckeneditor** (Feature-Entscheidung mit dem Nutzer): Neue Strecke anlegen mit
   Nation, Länge, Basiszeit/Charakteristik → Einhängen in Kalender + `CIRCUIT_LENGTHS`-
   Äquivalent + `getCircuitBaseTime`-Fallback. Balancing = Opus.
2. **Zufalls-Button** im Editor (wie Zufallsteam v0.9.14.62) — erst der macht die Pools
   nutzbar; Komponier-Logik = Opus.

## 1. Fable-Deliverable (unabhängig von §0 schreibbar)
- **Ortsnamen-Pool** je Nation: fiktive, nativ klingende Orte (`{loc}`-Füllung) —
  Grundlage für Strecken- UND Rennnamen (derselbe Ort für beide = kohärent).
- **Strecken-Muster** je Nation: `'Autodromo di {loc}'`, `'{loc}ring'`, `'Circuit de
  {loc}'`, `'{loc} Speedway'` … (Templates mit `{loc}`-Slot, wie Paket-6-Patterns).
- **Rennnamen-Muster** je Nation (lokalisiert) + Ära-Mix-Regel: **e50/e62 nur
  lokalisiert ohne Sponsor** („Gran Premio di {loc}", „{loc} Trophy"), ab e76 optional
  `'{sponsor} '`-Präfix, e94/e10 zunehmend generisch-korporativ (`'{loc} Grand Prix'`).
- **Sponsor:** Wiederverwendung von `TEAM_NAME_POOLS.sponsorTitle` (Paket 6) — dieselben
  fiktiven Marken dürfen Teams UND Rennen titeln (realistisch, kein Doppel-Pool).

## 2. Struktur
```js
CIRCUIT_NAME_POOLS = {
  place:          { it:[...], gb:[...], ... },                 // 30 Nationen, KEIN generic
  circuitPattern: { it:['Autodromo di {loc}', ...], ... },     // Templates, 1× {loc}
  racePattern:    { it:['Gran Premio di {loc}', ...], ... }    // Templates, 1× {loc}
};
```
**30 Nationen-Pools, KEIN generic-Fallback** (Nutzer-Vorgabe: jede Neuanlage klingt
nativ). Nation ohne Pool → Generator re-rollt die Nation; Mikrostaaten (MON, SGP)
ausschließen. IOC→Key-Map im Deliverable-Header. Sponsor-Komposition:
`'{sponsor} ' + racePattern` (nur e76+, Anteil s. Ära-Mix im Deliverable).

## 2b. ⚙️ Optionale Generator-Filter (Nutzer-Vorgabe, Umsetzung = Opus)
1. **Länder-Gewichtung** — Motorsport-Frequenz-Trichter (`pickNationMotorsport`) oder
   eigene Strecken-Gewichtstabelle (Rennland ≠ Fahrerland!).
2. **Saison-Ausschluss** — Länder bzw. Grand-Prix-Namen, die im aktuellen Kalender
   schon vorkommen, nicht erneut vergeben (kein zweiter „Großer Preis von X";
   optional ganze Nation sperren, wenn sie bereits einen Lauf hat).

## 3. Leitplanken
- **Keine realen Strecken/Rennorte** mit Motorsport-Historie (Monza, Spa, Riverside,
  Lakeside, Avus …) und keine zum Verwechseln ähnlichen Namen — Kollisions-Check gegen
  reale Kurs- und GP-Namen gehört zur Validierung.
- Ortsnamen ohne belastete/reale Bezüge; nativ-plausibel je Sprache (Paket-A-Prinzip).
- Rennname und Streckenname derselben Neuanlage nutzen **denselben `{loc}`** (Opus).
- Ära-Treue (Nutzer-Vorgabe): früher lokalisiert, Sponsor-Titel erst ab e76.

## 4. Mengen
`place` je Nation 8–10 · `circuitPattern` je Nation 4–6 · `racePattern` je Nation 3–5.

## 5. Opus-Vorarbeiten
1. **Zuerst §0** (Editor + Zufalls-Button) — sonst kein Andockpunkt.
2. Komponierer: Nation ziehen (`pickNationMotorsport`?), `{loc}` einmal ziehen, Strecken-
   + Rennname daraus; Ära-Mix + Sponsor-Anteil; Kollision mit bestehenden Kalender-Namen
   vermeiden.
3. Schema/Changelog/manage-v.

## 6. Testfälle (Fable liefert)
Je 2 komponierte Strecke+Rennen-Paare für IT/DE/GB/US in e50 und e10 (mit Sponsor-
Beispiel in e10), damit Opus Morphologie, Ära-Logik und Fiktivität prüfen kann.
