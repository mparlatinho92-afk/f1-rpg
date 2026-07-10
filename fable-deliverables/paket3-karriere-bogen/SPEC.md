# Paket 3 — Delta-Spec: Karriere-Bogen beim Rücktritt

> **⚠️ ZUERST LESEN:** `fable-deliverables/FABLE-GRUNDREGELN.md` (alle 8 Regeln). Kern-Verbote, die hier gelten – egal was unten steht:
> 1. **NIE reale Erfolge/Fakten** (Titel, Siege, echte Karriere/Unfälle) – die Sim-Zeitlinie weicht ab.
> 2. **Ära-Register** e50/e62/e76/e94/e10 – Ton pro Dekade, kein Einheitston.
> 3. **0 Bytes gespeicherter Text** – nur Pools/Assembler, Regeneration zur Laufzeit; Sprache Deutsch.

> Baut auf `fable-deliverables/FABLE-GRUNDREGELN.md` auf.

**Deliverable:** Erweiterung von `OBIT_BANK.abschied` (kein neuer Assembler) — ein neuer
Satz-Slot „Werdegang" + optional reichere `close`-Varianten. Fable liefert nur Pools.

## 0. Was schon existiert (NICHT neu bauen)
`obituaryText(name, drv, stats, year, mode='retire', ctx)` (~L11352) montiert bereits den
Abschied aus `OBIT_BANK.abschied`: **open[cat] → stats → close** (3 Sätze). Kategorien:
`champion / talent / star / backmarker / generic / gaveup`. Dieses Paket **fügt einen
mittleren „Werdegang"-Satz** ein (Debüt → Spanne → Zenit), damit der Abschied einen Bogen
erzählt statt nur einer Momentaufnahme.

## 1. Neue verfügbare Felder (Opus liefert in ctx)
- `{seasonsText}` — **fertige Phrase**, z.B. „nach zwölf Jahren im Feld" (Opus rechnet
  `year − debutYear + 1`; Grundregel 5: NIE `{seasons}` als nackte Zahl mit
  Verb-Kongruenz, immer die fertige Phrase).
- `{peakText}` — fertige Zenit-Phrase aus `careerScores` (z.B. „in seiner stärksten Saison
  Vizemeister" / „mit Rennsiegen in mehreren Jahren"). **Opus berechnet** den Zenit aus der
  Sim-Historie; existiert kein klarer Höhepunkt → leer, Satz entfällt.
- Bestehend: `{name}`, `{nameE}` (Lore-Epitheton, nur reale Fahrer), `{bilanz}`.

## 2. Deliverable-Struktur
```js
OBIT_BANK.abschied.werdegang = {
  champion:[...], star:[...], backmarker:[...], talent:[...], generic:[...], gaveup:[...]
};
```
- Je Kategorie **5–6 Varianten**, die `{seasonsText}` und/oder `{peakText}` einbinden.
- Opus schiebt den Satz zwischen `open` und `stats` ein — nur wenn `{seasonsText}`
  vorhanden (frisch generierte Kurzkarrieren: entfällt sauber).

## 3. Leitplanken
- **Nur Sim-Spanne**, keine reale Laufbahn. `{peakText}` kommt aus `careerScores`, nie aus
  echter Historie (Grundregel 2).
- Ton konsistent zum bestehenden `abschied`-Register (würdevoll, kein Kitsch) und zu Paket C.
- `{nameE}`/Lore wird geteilt mit Nachruf → tonneutral halten (Grundregel 7).

## 4. Determinismus
Wie `obituaryText` schon: geseedet aus `mode|name|year`. Fable liefert nur Pools, Seeding
bleibt unverändert.

## 5. Opus-Vorarbeiten
1. `{seasonsText}`- und `{peakText}`-Builder aus `debutYear`/`year`/`careerScores`.
2. `werdegang`-Satz in `obituaryText` einhängen (nach `open`, vor `stats`, nur wenn vorhanden).
3. Node-Test (Kurzkarriere → kein Werdegang; lange Karriere → Bogen), Schema/Changelog/manage-v.

## 6. Testfälle (Fable liefert)
Je Kategorie 1 Beispiel mit gefülltem `{seasonsText}`+`{peakText}` und eines ohne
`{peakText}` (Satz muss auch dann grammatikalisch tragen).
