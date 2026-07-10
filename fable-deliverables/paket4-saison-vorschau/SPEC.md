# Paket 4 — Delta-Spec: Erzählte Saison-Vorschau

> Baut auf `fable-deliverables/FABLE-GRUNDREGELN.md` auf. Spiegelbild zu Paket B (Rückblick).

**Deliverable:** `paket4-saison-vorschau/preview-bank.js` — `PREVIEW_BANK` + Assembler
`seasonPreviewText(...)`, analog `seasonRecapText`. Deterministisch, 4–6 deutsche Sätze.

## 1. Einbau-Ort
`showOffSeasonModal(year)` (~L6902) bzw. Saison-Start — additive Card „🔮 Saison-Vorschau"
VOR dem ersten Rennen des neuen Jahres. Modus-neutral (Off-Season-Popup wird von allen
Modi genutzt). Rein additiv, keine State-Schreibzugriffe.

## 2. Inputs (Opus liefert; alle aus dem State VOR der Saison)
- **Titelverteidiger:** Champion der Vorsaison (letzte `driverStandings`-P1).
- **Favorit:** höchste `driver.reputation` × bestes `team.speed` — Opus wählt 1–2.
- **Aufsteiger:** neue Rookies der Saison (Debüt-Jahr = `year`, `isPoolTalent`).
- **Comeback / Wechsel:** markante Teamwechsel (neue Lineups aus `processTeamChanges`).
- `year` → Ära-Register (5 Bänder wie Paket B/C).

## 3. Satz-Slots (Assembler-Logik, Opus baut)
Titelverteidiger-Satz → Favoriten-Satz → Aufsteiger/Rookie-Satz (falls vorhanden) →
Wechsel/Comeback-Satz (falls markant) → offene-Frage-/Ausblick-Schluss. Max. EIN
Sonderbedingungs-Satz wie in Paket B.

## 4. Leitplanke — es ist eine PROGNOSE
Die Vorschau läuft **vor** jedem Rennen. Deshalb **durchgehend spekulativ/hedged**:
„gilt als Favorit", „dürfte", „muss sich beweisen" — **NIE** Ergebnis-Behauptungen
(„wird Meister", „schlägt X"). Basis ausschließlich `reputation`, Vorjahres-Standings,
`team.speed`. Keine reale Karriere (Grundregel 2). Kein Bezug auf Rennen, die noch nicht
gefahren wurden.

## 5. Determinismus
Wie Paket B: RNG geseedet aus `year|championName|...` → Re-Render (Off-Season-Popup)
liefert identischen Text. 0 Bytes gespeichert.

## 6. Mengen
Pro Slot × Register **6–8 Varianten**. Register-Wortlisten wie Paket B wiederverwenden
(`RECAP_ERA_WORDS`), nur um vorschau-spezifische Tokens ergänzen (z.B. „geht als Gejagter
in die Saison").

## 7. Opus-Vorarbeiten
1. Favoriten-/Aufsteiger-/Wechsel-Selektoren (reputation×speed, Debüt-Erkennung).
2. `seasonPreviewText` bauen + Card einhängen, geseedet.
3. Schema/Changelog/manage-v (Hotfix, additiv).

## 8. Testfälle (Fable liefert)
1 Vorschau in e50 + 1 in e10, jeweils mit Titelverteidiger + Favorit + Rookie, damit Opus
Hedging-Ton und Register prüft.
