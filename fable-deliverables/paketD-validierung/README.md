# Paket D – Validierung (Realismus-QA eines Mega-Sim-Laufs)

**Rolle:** Fable = Plausibilitäts-Prüfer ("plausibel vor perfekt" braucht einen Maßstab).
**Deliverable:** Markdown-Report `PAKET-D-REPORT.md` mit Auffälligkeiten (Schweregrad, Begründung,
Bezug zur echten F1-Historie, Kalibrier-Anker). **Keine Code-Fixes** – Umsetzung macht Opus.

## Ablauf (Nutzer-getrieben)

1. **Spiel starten:** `npx serve .` → `localhost:3000` → `index.html`
2. **Neues Spiel, Startjahr 1950** (deckt alle Ären ab, läuft durch Minardi 2001).
   Einstellungen auf Default lassen (deathRealism 100, dnfRate 15). Junior-Modus egal
   ('off' reicht – Junior-Welt wird nicht geprüft).
3. **MegaSim starten** (Multi-Saison-Button) → **76 Saisons** eingeben (1950 → ~2026).
4. Nach Abschluss: **F12 → Konsole** → Inhalt von `qa-export-snippet.js` einfügen, Enter.
   → lädt `megasim-qa.json` herunter.
5. Die Datei in diesen Ordner legen (`fable-deliverables/paketD-validierung/megasim-qa.json`)
   und Fable Bescheid geben.

**Optional (schärferer Minardi-Anker):** zweiter Lauf, Neues Spiel 2001, MegaSim 5–10 Saisons,
Export als `megasim-qa-2001.json` – kleine Stichprobe direkt an der Roadmap-Referenz
"Minardi 2001 kommt selten in Punkte" (V1_ROADMAP.md).

## Was das Snippet exportiert (pro Saison, kompakt)

- Champion: Name, Alter, Nation, Team + Team-WM-Rang, Punkte, Siege, Rookie-Flag
- Fahrer-Top-10 (Punkte, Siege, Poles, Team, Nation, Alter, hist/generiert)
- Alle Teams: Rang, Punkte, Siege, **Punkte-Finishes**, DNFs (→ Backmarker-Check)
- DNF-Rate gesamt + Todesfälle
- Grid: Fahrer-/Teamzahl, Nationenverteilung (→ Ära-Plausibilität)
- Transfers (wer, Typ, von → zu; → "Champion zu Backmarker?"-Check), Entlassungen, Rücktritte (Alter, Grund)

Das Snippet ist rein lesend (inkl. Lazy-Load der schweren History-Details via
`getHistoryDetail`) und ändert nichts am Spielstand.

## Prüf-Dimensionen des Reports

1. **Titel-Verteilung** – gewinnen die richtigen Fahrer/Teams je Ära? Dynastien plausibel lang?
2. **Champion-Profil** – Alter, Team-Rang (Champion aus P5-Team = Ausnahme, nicht Regel)
3. **Transfer-Plausibilität** – Top-Fahrer zu Backmarkern? Alters-Karriereverläufe?
4. **Backmarker-Kalibrierung** – Punkte-Finishes von Minardi-Typ-Teams vs. Realität
   (Anker: Minardi 2001 = 0 Punkte, Minardi 1999–2005 ≈ 0–3 Punkte/Jahr)
5. **DNF-/Todes-Raten je Ära** – 1950er ~40–50 % DNF, 2020er ~10 %; Todesfälle-Häufigkeit
6. **Nationen je Ära** – z. B. keine Koreaner-Schwemme 1955, Italiener/Briten-Anteil 50er/60er
7. **Punktniveaus** – Champion-Punkte vs. reale Größenordnung je Punktesystem-Ära
