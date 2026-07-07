# Paket F – Nationen-Glättung (Re-Derivation der Nationen-Tabellen)

**Auftraggeber:** Opus (im Namen des Nutzers) · **Bearbeiter:** Fable · **Sprache:** Deutsch

## Problem

Die aktuellen Nationen-Pools sind **frequenz-gematcht** auf echte F1-/Motorsport-Daten. Dadurch:

1. **Zu ähnlich zur echten F1** → zu wenig Nationenvielfalt. Die gespielte Welt fühlt sich an wie eine Kopie der Realität.
2. **Einzelfahrer-Nationen überbewertet.** Beispiel: `THA:0.0485` im DECADE-Pool 2020 existiert nur, weil Albon der einzige Thai-Fahrer ist — die Ableitung aus „unique F1-Nationen je Dekade" bläht Ein-Fahrer-Nationen auf. Ergebnis im Spiel: gefühlt zu viele Thailänder.
3. **Manche Nationen bei 0 %.** Der Nutzer will: **keine Nation darf 0 % Wahrscheinlichkeit haben.**

## Ziel

Die Tabellen so **re-derivieren**, dass sie plausibel bleiben (Glättung muss sein), aber:
- **mehr Vielfalt** (weniger stark an die echte F1 geklebt),
- **Einzelfahrer-Nationen entschärft** (Albon/THA nicht mehr überrepräsentiert),
- **kein Wert 0 %** (globaler Floor),
- **milder Europa-Fokus** (der Nutzer will Europa-Schwerpunkt setzen — Kalibrierung liegt bei dir, dokumentieren).

**Ausdrücklich NICHT Teil dieses Pakets:** zusätzliche USA-Dämpfung in Junior/Kart. Der Nutzer hat das zurückgezogen — das bestehende `dampUSA` (×0.5) bleibt unangetastet. Nicht anfassen.

## Betroffene Tabellen (in `index.html`, ~Zeile 4632 ff.)

- `DECADE_NATION_POOLS` — Struktur je Dekade: `1950: {weights: {'GBR':0.33, ...}}`, Summe = 1.0. Dekaden 1950–2020.
- `MOTORSPORT_NATION_BLEND` — Struktur je Dekade: `1950: { GBR:0.23, USA:0.16, ... }` (ohne `weights`-Wrapper), Summe = 1.0. Dekaden 1950–2020.

Die Junior-Welt konsumiert `MOTORSPORT_NATION_BLEND` via `pickNationMotorsport(year, dampUSA)` — profitiert also automatisch von den geglätteten Werten, **ohne** dass eine separate Junior-Tabelle nötig ist. Keine neue Tabelle erzeugen.

## Methodik (Vorschlag — du darfst begründet abweichen)

1. **Potenz-Glättung** der Roh-Frequenzen: `w' = w^p` mit `p` ≈ 0.6–0.7, danach renormieren. Analog zum Namen-Paket (`count^0.6`). `p` so wählen, dass ein **Diversitäts-/Entropie-Ziel** getroffen wird — miss die Shannon-Entropie vorher/nachher und dokumentiere sie je Dekade.
2. **Single-Driver-Fix:** Für 2000–2020 die DECADE-Pools **nicht** aus „unique SEASON_DATA-Nationen" ableiten, sondern aus Fahrer-*Saisons* (bzw. Starts) — so zählt eine Nation nach tatsächlichem Volumen, nicht nach Anwesenheit. THA sollte danach deutlich unter 0.02 liegen.
3. **Floor ε:** Master-Liste aller je auftretenden Nationen definieren; jede bekommt mind. `ε` (Vorschlag ε ≈ 0.0015–0.003), danach renormieren. Kein Wert 0.
4. **Europa-Tilt:** milder Multiplikator (`×1.1–1.3`) auf europäische Nationen **vor** der Renormierung. Stärke dokumentieren; darf era-abhängig sein (in den 1950/60ern ohnehin schon europalastig → dort kleiner/keiner).

## Gewünschtes Output-Format

Ordner: `fable-deliverables/paketF-nation-smoothing/`

1. **`DECADE_NATION_POOLS.js`** — fertiges JS-Objektliteral, **exakt** in der bestehenden Key-Struktur (`YYYY: {weights:{...}}`), Summe je Dekade = 1.0 (auf ±0.001), Kommentar-Header mit Ableitungsdatum. Zum direkten Pasten.
2. **`MOTORSPORT_NATION_BLEND.js`** — dito, in der bestehenden Struktur (`YYYY: {NAT:wert, ...}`, ohne `weights`-Wrapper), Summe = 1.0.
3. **`METHODIK.md`** — gewähltes `p`, `ε`, Europa-Faktor(en); Entropie-Tabelle vorher/nachher je Dekade; kurze Begründung; Vorher/Nachher der auffälligsten Werte (mind. THA, USA, GBR, ITA je Dekade).

## Randbedingungen / Fallen

- **IOC-Codes** exakt wie bestehend beibehalten (GBR, GER, USA, THA, RSA, …). Keine neuen Schreibweisen.
- Reihenfolge der Keys egal, aber **alle** bisherigen Nationen müssen erhalten bleiben (durch den Floor kommen eher welche dazu, keine verschwinden).
- Summen sauber renormieren — der Ziehungs-Code (`pickNationByDecade` / `pickNationMotorsport`) normiert zwar selbst, aber die Tabelle soll trotzdem auf 1.0 summieren.
- Indy bleibt außen vor (dort hart 'USA') — diese Tabellen betreffen Indy nicht.
