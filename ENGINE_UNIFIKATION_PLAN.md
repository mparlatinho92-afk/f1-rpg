# Engine-Unifikation: Live-Ticker als Basis für beide Modi (PLAN)

**Status:** 💤 GEPLANT / VERSCHOBEN (Entscheidung 2026-07-07). Balancing bleibt bis dahin komplett auf `simulateRace`.
**Zweck dieses Dokuments:** Den besprochenen Umbau festhalten, damit er später ohne erneute Analyse startklar ist.

## Zielbild

**Umgekehrte Logik zum „Replay":** Nicht der Live-Ticker spielt ein fertiges `simulateRace`-Ergebnis nach — sondern die **Runde-für-Runde-Simulation IST die einzige Engine**, und das Sofort-Rennen ist **derselbe Lauf headless im Zeitraffer**. Ein Klick = die Engine rennt alle Runden (Quali, Rundenereignisse, DNFs, Tode) unsichtbar durch und gibt sofort das Endergebnis zurück. Der Live-Ticker ist dieselbe Engine, nur real-time animiert.

**Warum:** emergenter (Sofort-Ergebnisse werden zu echten Rennverläufen statt einer Score-Formel), eine einzige Wahrheit, keine Modus-Divergenz mehr. Deckt die verbindliche `CLAUDE.md`-Regel „Modus = Darstellung, nie Konsequenzen" strukturell ab.

## Ausgangslage (Divergenz heute, Stand v0.9.14.45)

Zwei getrennte Ergebnis-Engines:

| | Klassisch (`simulateRace`, ~7725) | Live-Ticker (Lap-Loop, ~9376) |
|---|---|---|
| Fahrer-Gewicht | `pace * 0.45` (Good-Day-Wurf) | `pace * 0.02` pro Runde |
| Auto-Gewicht | `carSpeed * 0.15` | `carSpeed * 0.015` pro Runde |
| Car-Ceiling (v0.9.14.45) | ✅ ~7906 | ❌ fehlt |
| Erfahrung / Elo-Overlay / Ära-DNF | ✅ | teilweise / anders |
| Endreihenfolge | aus Performance-Score | aus akkumulierten Lap-Zeiten |
| Ergebnis-Objekt | `simulateRace` returnt `raceResult`, Caller ruft `applyRaceResults` | `closeLiveRace` baut eigenes `raceResult` + **dupliziert** Tode/Ersatz (~9587–9770) |

→ Ein *live gespieltes* Rennen speichert anders geformte Ergebnisse als der Sofort-Modus.

## Phasen

- **A – Reine Lap-Engine extrahieren.** `runRaceEngine(raceIndex, {headless, isRain})` als pure Simulation ohne DOM/Timer. Der sichtbare Pfad (`startLiveRace`/Lap-Animation) ruft dieselbe Engine, nur mit Callback pro Runde für UI. Headless-Pfad läuft ohne `addLiveEvent`/`setTimeout` durch.
- **B – Validierten Pace-Kern portieren.** Die `simulateRace`-Fahrerformel (Good-Day/Bad-Day-Konstanz, `pace*0.45`, `carSpeed*0.15`, Erfahrung, Elo-Overlay, **Car-Ceiling**, Regen, Lokalmatador, Grid-Bonus) in die **Pro-Runde-Pace** der Engine überführen. Ziel: die Runden-Akkumulation reproduziert statistisch die validierte Verteilung.
- **C – Aufrufer umstellen.** Sofort-Modus, Komplette-Saison **und Monte-Carlo/Balancing** auf `runRaceEngine(headless)`. `simulateRace` wird dünner Wrapper oder entfällt.
- **D – Neu-Validierung.** MC gegen Historie neu laufen (`tests/monte-carlo.js`), Pace/Ceiling nachtunen bis Champion-/DNF-Verteilungen wieder in Toleranz. **Zwingend**, weil Runden-Akkumulation ≠ Ein-Pass-Score.

## Risiken / Kosten

1. **Re-Validierung entwertet aktuelles Tuning.** Die gesamte Historien-Genauigkeit + der Car-Ceiling wurden gegen die Ein-Pass-Formel getunt. Die Lap-Engine verhält sich anders → iterative MC-Runden nötig (token-teuer).
2. **DOM/Timer-Entflechtung.** Die Lap-Schleife ist mit `addLiveEvent`/`setTimeout`/DOM verwoben — sauber vom Rechenkern trennen.
3. **Duplikat-Abbau.** Die ~180 Zeilen Tode/Ersatz im Live-Ticker (`closeLiveRace`) müssen weg (Engine erledigt es einmal). Positiv, aber sorgfältig.
4. **Performance:** headless ist die Mathematik billig (~60 Runden × ~26 Fahrer). MC von 100 Saisons bleibt im Sekundenbereich, SOFERN DOM/Timer im headless-Pfad wirklich nicht laufen. Vor Phase C kurz messen.

## Betroffene Funktionen

`simulateRace` (~7725), Live-Lap-Loop (~9376–9463), `startLiveRace` (~9788), `finishLiveRace` (~9524), `closeLiveRace` (~9536), `applyRaceResults` (~8313), `tests/sim-core.js` (lädt Monolith, ersetzt SIM_CONFIG).

## Billigere Alternative (falls Vollumbau nie kommt)

**Replay:** Live-Ticker übernimmt das `simulateRace`-Ergebnis und animiert nur noch dorthin. Bounded (eine Sitzung), entfernt die Duplikat-Tode-Logik, fasst Balancing nicht an — aber Sofort-Modus bleibt Ein-Pass (kein emergenter Rundenverlauf). Ergebnis-Parität ja, Architektur-Eleganz nein.

## Entscheidungskontext

Nutzer spielt hauptsächlich Sofort (`simulateRace`), live nur für spannende Saison-Phasen. Reform-Priorität liegt auf Fahrer-Markt/Reputation (Welle 2), nicht auf Sim-Engine-Eleganz. Daher verschoben — s. Memory `project_reputation_and_market_reform`.
