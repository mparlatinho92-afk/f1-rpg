# F1 RPG – Hintergrund zu den Regeln in CLAUDE.md

`CLAUDE.md` läuft in jeder Sitzung mit und hält nur Regeln und Zeiger. Hier steht das
Warum und die Einzelheiten — **nur bei Bedarf lesen**, jeweils beim passenden Thema.

## Indianapolis: zwei Rennen, ein Gelände (NICHT verwechseln)
In Indianapolis fanden **zwei grundverschiedene Rennen** statt — dieselbe `circuitId`, dasselbe Rohflag in F1DB:

| | Jahre | Kurs | Runden | Startplätze |
|---|---|---|---|---|
| **Indy 500** | 1950–1960 | Oval | 200 | **33 per Reglement** |
| **Indy GP** (US-GP) | 2000–2007 | Infield-Rundkurs | ~73 | normales Feld, real 20–22 |

- **Das Feld heißt `isIndy500` bzw. `isIndyGP`.** Ein Feld `isIndy` gibt es nicht mehr — es stand bei BEIDEN auf `true` und gab dem US-GP 2005 ein 33er-Feld (27 Starter statt real 20) sowie ~5 Phantom-Tode je Jahrzehnt.
- Getrennt wird **an der Quelle** in `getF1DBYear` (data/f1db.js) nach Jahr. Das Rohflag `meta[3]` sagt nur, auf welchem Gelände gefahren wurde — nie allein abfragen.
- Altstände tragen noch `isIndy`; die Helfer `istIndy500(race, year)` / `istIndyGP(race, year)` lösen das über das Jahr auf. **Gespeicherte Stände werden nicht rückwirkend umgeschrieben.**
- ⚠ Lokale Variablen namens `isIndy` bedeuten etwas ANDERES: ist der *Fahrer* oder das *Team* Indy-only. Nicht mit dem Rennen verwechseln.
- **Wächter:** `node tests/indy-500-vs-gp.js` — 26 Prüfungen über sechs Jahrgänge (Flags, Deckel, Melder, Starter). Nach jeder Änderung an Kalender oder Startfeld laufen lassen.

### Die hohe Melderzahl beim Indy 500 ist GEWOLLT — kein Bug
Das Indy 500 bekommt **40–48 Melder auf 33 Startplätze**, also 12–15 DNQ. Das ist eine bewusst gesetzte **Halb-Fiktion** und darf nicht „korrigiert" werden:

> Die offizielle F1-Statistik kennt keine Indy-DNQs. Fahrer, die es nie ins Rennen schafften, werden dort nie erwähnt — es gibt also keine Gegenzahl, gegen die man kalibrieren könnte.

Der Kandidatenpool sollen **Datenbank-Fahrer** sein (halb-fiktional), generierte Fahrer nur als Rückfall.

## Befund-Inventur: Vorgeschichte und Absicherung
Der Nutzer hat die Regel am 16.09.2026 angemahnt: Befunde landeten in Code-Kommentaren
und Memory, aber nicht in `tests/README.md`.

**Absicherung:** Ein **Stop-Hook** (`tools/befund-inventur.js`, eingehängt in
`.claude/settings.json`) erinnert automatisch am Task-Ende — aber nur, wenn in `tests/`
uncommittete Arbeit liegt **und** die Befund-Dateien unberührt sind. Wer die Doku
mitschreibt, sieht die Meldung nie. Kein Skill: der müsste aktiv aufgerufen werden und
bräuchte genau die Disziplin, die gefehlt hat.

## Funktions-Index: was gescannt wird
**Der Index umfasst seit 11.09.2026 auch ZIELFLAGGE.** Gescannt werden in dieser Reihenfolge:
`index.html` · `zielflagge/index.html` · `zielflagge/wagen.js` · `zielflagge/colors.js` · `zielflagge/build-colors.js` · `zielflagge/strecken.js`.
- **`index.html` bleibt die Leitdatei:** dort gefundene Funktionen haben KEIN `file`-Feld, ihre Zeilennummer gilt für `index.html`. Alles andere trägt `file`.
- Bei Namensgleichheit gewinnt die erste Quelle – also `index.html`.
- **Nicht gescannt:** `zielflagge/three.min.js` (Fremdcode, eine Zeile mit tausenden Treffern) und `zielflagge/test-*.js` (Werkzeug, genau wie `tests/` im Hauptprojekt).
- ⚠ **`const foo = (` ist keine Funktion.** Das Muster traf jeden Ternär und jede geklammerte Zuweisung (`const haupt = (farben && farben[0]) || …`) und trug 14 Variablen als Funktionen ein. Die Neuentdeckung verlangt jetzt zusätzlich `=>` oder `function` in derselben Zeile.

## Archiv: Einzelheiten
`archive/` war auf 496 Monolithen und 2,7 GB gewachsen, bei 1,4 GB freiem Plattenplatz.
Gefahrlos kürzbar, weil `manage-v` jede Version **committet, bevor** sie ins Archiv
wandert: alle alten Stände liegen in der GitHub-Historie unter ihrem damaligen Wurzelpfad.

- **Zurückholen:** `node tools/restore-version.js <version>` → `wiederhergestellt/`, oder `--url` für die GitHub-Adresse, `--liste` für alle verfügbaren.
- ⚠ **Nicht selbst mit `git log` suchen:** das liefert den Commit, in dem die Datei ins Archiv verschoben, also **gelöscht** wurde — dort existiert sie nicht („path does not exist"). Gesucht ist der *neueste Commit, in dem sie noch vorhanden ist*. Genau das macht das Skript.
- **Vier Stände sind Ausnahmen** und in `archive/` eingecheckt, weil sie nie im Repo landeten: `f1-rpg-v0.9.7.3_pre/b_pre/c_pre` (Vorabstände, weichen um ~100 Zeilen von der Release ab) und `f1-rpg-v0.9.9.37`. Die `.gitignore` nutzt dafür `archive/*` plus `!`-Ausnahmen — Git kann eine Datei nicht einschließen, wenn ihr Verzeichnis ausgeschlossen ist.
- **Nie den ganzen Ordner einchecken.** Das erzeugte ~2,6 GB neue Objekte ohne Sicherheitsgewinn: die Arbeitskopien haben CRLF, die Git-Objekte LF — Git entdoppelt sie also nicht.
- **Aufräumen** passiert in `manage-v.ps1` Schritt 6a: behält die 10 neuesten, fasst eingecheckte Dateien nie an, löscht nur, was in der Historie von `origin/master` liegt. **Sollstand = 14 Dateien** (10 + die 4 Ausnahmen). Nur bei mehr als 14 nachsehen, warum 6a nicht gegriffen hat (Warnung „ist NICHT auf origin/master").

## Changelog-Format
`manage-v` schreibt den Changelog selbst. Er liegt im Popup `#changelog-modal` (Klick auf
die Versionsnummer im Header oder Button in den Einstellungen), Marker `<!-- CHANGELOG -->`
genau 1×. Format: neueste Version oben mit `(aktuell)` in grün, darunter `• NEU:` / `• FIX:`,
3–5 Punkte, ältere Einträge bleiben stehen.

## Nach PC-Neustart (Nutzer-Info)
1. CMD im Projektordner öffnen
2. `npx serve .` → localhost:3000 im Browser
3. Neues CMD-Tab → `claude`
