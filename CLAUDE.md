# F1 RPG – Claude Code Regeln

## Anrede & Sprache (gilt immer)
**Deutsch, und den Nutzer DUZEN.** Nie siezen – auch nicht in Rückfragen, Bestätigungen oder Fehlermeldungen. Im Zweifel duzen.
Code-Kommentare, Commit-Nachrichten und Changelog bleiben sachlich und ohne Anrede.

## Projektkontext
- **Endprodukt:** eine HTML-Datei `f1-rpg-vX.html` (~18 MB Monolith, standalone). Löwenanteil `data/images.js` (Fahrerfotos).
- **Entwicklung:** `index.html` (~3 MB) + `data/*.js`. `manage-v` inliniert die data-Dateien → Monolith.
- **Spiellogik:** plausibel vor perfekt, emergent vor gescriptet.
- **Ziel:** maximale Token-Effizienz durch chirurgische Eingriffe.
- Hintergrund und Einzelheiten zu den Regeln unten: `HINTERGRUND.md` (nur bei Bedarf lesen).

## Arbeitsweise
- **Schemas zuerst:** `/schemas/` lesen statt blind in der HTML suchen. Vor Zugriff auf GAME_STATE, Driver, SEASON_DATA oder HIST_SEASONS das zugehörige Schema lesen.
- `functions.schema.json` liefert Zeilennummern (~850 Funktionen). Bei Abweichung >10 Zeilen `grep -n`, danach `./update-functions-index.ps1`.
- Nur die identifizierten Blöcke lesen (ca. 200–300 Zeilen), im Diff-Modus arbeiten, nie die ganze Datei zeigen.
- Kurz das **Warum** einer Änderung erklären.
- **Nachfragen**, bevor mehr als 3 Stellen gleichzeitig geändert werden, und bei Unklarheiten.
- **Daten editieren:** SEASON_DATA → `data/seasons.js`, HIST_SEASONS → `data/hist.js`, F1DB → `data/f1db.js` (3,6 MB, nur greppen).

| Schema | Inhalt |
|---|---|
| `functions.schema.json` | Top-Level-Funktionen mit Zeile + Zweck (auch ZIELFLAGGE, Details `HINTERGRUND.md`) |
| `season-data.schema.json` | SEASON_DATA[year].t / .d |
| `hist-seasons.schema.json` | HIST_SEASONS[slug], Pitfalls |
| `game-state.schema.json` | GAME_STATE Top-Level-Felder |
| `driver-objects.schema.json` | Simulierter Fahrer, Team, Kontext-Varianten |

## Bestätigung vor Wirkung (Git, Push, manage-v)
Vor **`./manage-v`**, **`git push`** und Commits, auf die ein Push folgen könnte, fragen: **„1“** = ja, **„2“** = nein (oder y/n).
Nie eigenmächtig, nur weil ein Task fertig ist. Ausnahme: der Nutzer sagt es eindeutig („push ausführen“).

## Eingriffe außerhalb des Projektordners
Alles, was den Projektordner verlässt, **vorher in einem Satz ansagen** — auch ohne Rückfrage der Berechtigung: Datei im Standardprogramm öffnen, außerhalb des Projekts schreiben, ein Fenster öffnen, etwas an einen externen Dienst schicken. Ein Fenster, das unangekündigt aufgeht, ist ein Schreck.
- **Ergebnisse liefern statt erwähnen:** erst geliefert, wenn es an einem Ort liegt, den der Nutzer kennt, mit Pfad. Scratchpad und selbst betrachtete Bilder sieht er nicht.
- **Zugriffsrechte:** die echte Konfiguration lesen und Fakten nennen, nicht allgemein beruhigen.

## Nach jedem Task (PFLICHT, unaufgefordert)
1. **Schema-Inventur:** Bei neuen Funktionen `./update-functions-index.ps1` ausführen, neue Einträge dem Nutzer melden.
2. **Befund-Inventur:** Jede Messung, die eine Annahme bestätigt oder widerlegt, kommt **ins Repo**, nicht nur in Memory oder Commit: Zahl + Messfalle, **Negativergebnisse mit Zahlen**, widerlegte Annahmen dort korrigieren, wo sie stehen. Neues Messwerkzeug → `tests/README.md`.

   | Ziel | Inhalt |
   |---|---|
   | `BEFUNDE.md` | Messbefunde Hauptspiel: Zahlen, Messfallen, Negativergebnisse |
   | `zielflagge/BEFUNDE.md` | dasselbe für ZIELFLAGGE |
   | `tests/README.md` | wie man misst, Werkzeuge |
   | `CLAUDE.md` | nur Regel oder Zielwert, 1–2 Zeilen, plus Zeiger |

3. **Version vorschlagen** (erst nach 1. und 2.): `./manage-v -NewVersion "0.9.x.y" -CommitMsg "…" -ChangelogPoints "NEU: …;FIX: …"`. Das Skript patcht VERSION, Titel und Changelog, archiviert, committet und pusht. Changelog nie von Hand editieren.

▶ **Fahrerentwicklung, Karriereenden, Alterskurven, Renn-Balancing: vorher `BEFUNDE.md` lesen.**

## Versionierung
- **Hotfix** (4. Stelle): Bugfix, kleine UI-Änderung – Hauptformat bis 1.0
- **Patch** (3. Stelle): abgeschlossene Feature-Gruppe aus `V1_ROADMAP.md`
- **Minor** (2. Stelle): mehrere Feature-Gruppen; **1.0.0**, wenn `V1_ROADMAP.md` erfüllt ist (vor v1.0-Arbeit lesen)
- Nummer selbst vergeben und kurz begründen. Die Versionsanzeige kommt immer aus der Konstante `VERSION`, nie hardcoded.

## Messen und Testen
- Kurze Messungen und Abstimmungsschleifen führt Claude **selbst** aus, mit gefilterter Ausgabe (`grep`/`tail`).
- **Lange Läufe** (über ~5 Minuten, Downloads, Mega-Sims) nennt Claude als Befehl. Der Nutzer startet sie in einem **eigenen Terminal** und schickt nur die Ergebniszeilen oder schreibt nach `tests/output/`. Das `!`-Präfix spart keine Tokens: die ganze Ausgabe landet im Gespräch.
- Werkzeuge und Messfallen: `tests/README.md`.

## Simulations-Architektur (eine Engine, mehrere Darstellungen)
**Modus = Darstellung, nie Konsequenzen.** Ergebnisse, Statistiken und Effekte sind in allen Modi identisch (Sofort-Rennen, Live-Ticker, Komplette Saison, Balancing-Tool). Eine Mechanik, die nur in einem Modus wirkt, ist falsch platziert.

**Live-Ticker (VERBINDLICH):** `startLiveRace()` ruft `simulateRace()`, legt das Ergebnis in `liveRaceState.plannedResult`, der Ticker **animiert nur dorthin**; `closeLiveRace()` reicht es durch.
- ⚠ **Keine Renn-Logik in den Ticker.** Feintuning nur in `simulateRace()`, der Ticker erbt es.
- **Reine Darstellung ist erwünscht:** Positionswechsel, Überholmeldungen, Ausfall*runde* (ob jemand ausfällt, steht in `simulateRace` fest, nur das Wann ist frei).
- **Boxenstopps (Nutzer 22.10.2026, nicht schwarz-weiß):** Ein Stopp darf im Verlauf Plätze kosten oder bringen und **erzählen, warum** ein Fahrer laut Plan verliert oder gewinnt (langsamer Stopp, Strategie, Reifen, Reparatur). Was das Ergebnis nicht hergibt, wird vor der Schlussrunde eingesammelt.
- Marker `// [SYNC simulateRace]` sind Verweise auf die Engine, keine Pflicht zur Doppelpflege.
- **Prüfstein:** `node tests/ticker-paritaet.js --alle 40` nach jeder Änderung an Ticker oder `simulateRace`.

**Zentrale Logik (nie duplizieren):** Saison-Ende `processSeasonEndEvents()` · Saison-Ende-UI `showSeasonEndModal()` (liest, schreibt nie) · Saison-Start `startNewSeason()` · Between-Race-Events `processMidSeasonEvents()` via `applyRaceResults()`.

## Fachregeln
- **Indianapolis:** Indy 500 (1950–60, `isIndy500`, 33 Startplätze) und Indy GP (2000–07, `isIndyGP`) nie verwechseln; ein Feld `isIndy` am Rennen gibt es nicht mehr. Die **40–48 Melder beim Indy 500 sind gewollte Halb-Fiktion**, kein Bug. Wächter `node tests/indy-500-vs-gp.js`. Details `HINTERGRUND.md`.
- **Lesbarkeit:** Schriftfarbe nur über Theme-Variable (`--text-*`, `--accent-main-text`) oder `lesbareTextfarbe(hex)` — nie feste Grautöne, nie `--accent-main`/`--accent-blue` als Schrift, keine `opacity` auf Text. Prüfen: `node tests/kontrast-audit.js --themes dark,slate`.
- **Archiv:** `archive/` hält nur die letzten ~10 Versionen, Sollstand **14 Dateien** (10 + 4 eingecheckte Ausnahmen); `manage-v` räumt selbst auf. Alte Stände zurückholen mit `node tools/restore-version.js <version>`, **nicht** per `git log` suchen. Nie den ganzen Ordner einchecken. Details `HINTERGRUND.md`.

## Dateistruktur
```
/f1-rpg-vX.X.X.html   Endprodukt (von manage-v erzeugt)
/index.html           Entwicklungsdatei
/data/                f1db.js, hist.js, seasons.js, images.js …
/archive/             letzte ~10 Versionen
/tests/               Messwerkzeuge (README.md)
/schemas/             Datenstruktur-Doku, kein Laufzeit-Code
/BEFUNDE.md           Messbefunde
/HINTERGRUND.md       Warum und Einzelheiten zu diesen Regeln
/zielflagge/          3D-Spiel, PAUSIERT seit 14.09.2026 — Einstieg STAND.md,
                      vor Arbeit an Fahr-KI/Strecken BEFUNDE.md lesen
```
