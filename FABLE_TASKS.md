# Fable-5-Übergabe-Pakete

Kuratierte Aufgaben, die eine **Fable-5-Session** kalt starten kann. Jedes Paket ist so
geschrieben, dass Fable ohne Vorwissen loslegen kann. Reihenfolge = Empfehlungspriorität.

## Grund-Prinzip (für ALLE Pakete gültig)

**Das Spiel hat zur Laufzeit KEIN LLM.** Es ist ein Standalone-HTML-Monolith.
Fable generiert daher **niemals Text/Daten im laufenden Spiel**, sondern **autort einmalig das
Material** (Phrasen-Banken, gewichtete Datenpools, Plausibilitäts-Urteile). Das Spiel setzt daraus
deterministisch zusammen.

**Setup-Schutz (wichtig):** Fable liefert **Material als abgegrenzten Block** (JS-Literal, JSON,
Markdown-Urteil). Die eigentliche chirurgische Integration in `index.html` / `data/*.js`
(Diff-Modus, Schema-Pflege `functions.schema.json`, `manage-v`) macht die reguläre Opus-Session
danach. → Fable fasst die fragile Monolith-Mechanik NICHT an. Kein `git push`, kein `manage-v`.

Sprache aller Ausgaben: **Deutsch** (UI-Text) bzw. neutrale Daten.

---

# PAKET A (Daten) 🥇 — Nationskorrekte, ära-gewichtete Namens-Pools

### Das Problem (echter Code-Defekt)
- `pickNationByDecade(year)` → `index.html:4590`, nutzt `DECADE_NATION_POOLS` (`4579`) und wählt die
  **Nation** ära-korrekt gewichtet (z.B. 1980er: ITA 22.8 %, FRA 15.2 %, GBR 13.9 % …).
- `generateDriver(teamId, year)` → `index.html:4682`. Namens-Zusammenbau in **`4703–4718`**:
  zieht Vor-/Nachname via `weightedPick` (`4617`) aus **einem flachen Welt-Topf**
  `FIRST_NAMES_W` (`4259`, ~515 Einträge) und `LAST_NAMES_W` (`4381`).
- **Folge:** Nation und Name sind **entkoppelt**. Ein `nation:'SUI'`-Fahrer kann „Takeshi Smith"
  heißen. Kein Bezug zwischen gewählter Nation und kultureller Namensherkunft.
- Ausnahme heute schon vorhanden: Indy-Teams bekommen einen US-Sonder-Topf (`4688–4701`) —
  das ist der einzige Ort mit Nation↔Name-Kopplung und dient als Muster.

### Ziel
Namens-Pools **pro Nation** (IOC-Code, wie in `DECADE_NATION_POOLS`: GBR, ITA, FRA, GER, SUI, BRA,
JPN, FIN, USA, ARG, ESP, NED, BEL, AUT, SWE, AUS, RSA, MEX, CAN, COL, RUS, POL, CZE, JPN, …),
mit **korrekter interner Häufigkeit** und **ära-Sensibilität**. Danach koppelt `generateDriver`
Name an die von `pickNationByDecade` gewählte Nation.

### Rohquelle
BigQuery-Namens-Frequenz-Datensatz (liegt im Archiv des Nutzers, noch nicht eingebaut).
Zwei CSVs, je **ein Name pro Zeile**, Schema:
```
forename,gender,country,count      # bzw. surname,gender,country,count
Md,M,AE,132181
Muhammad,M,AE,84884
Mohammed,M,AE,51575
```
- Vornamen ~200 MB, Nachnamen ~372 MB roh. **Nur Build-Zeit-Quelle** — kommt NIE ins Spiel.
- `count` = echte Häufigkeit je Land → **ersetzt die manuelle 5/3/1-Schätzung** direkt.
- Der Nutzer stellt den Export bereit. Fables Aufgabe ist die **Veredelung**, nicht die Beschaffung.

**Wichtig – Laufzeit:** Der Monolith bleibt offline/standalone. Das Enddeliverable ist ein
**~30–80 KB großer, eingebackener Pool** (wie heute `FIRST_NAMES_W`). Die Roh-DB ist danach irrelevant.
Das Spiel funktioniert auch komplett OHNE dieses Paket weiter (heutige flache Pools) — es ist eine
Verbesserung, keine Abhängigkeit.

### Aufbereitungs-Pipeline (Big Data NIE lokal anfassen)
1. **Aggregation in BigQuery** (nicht auf dem PC — spart die 572 MB komplett):
   ```sql
   SELECT country, forename, count
   FROM forenames
   WHERE gender = 'M'                      -- F1 historisch quasi rein männlich
   QUALIFY ROW_NUMBER() OVER (PARTITION BY country ORDER BY count DESC) <= 120
   ```
   → Export ist eine **Mini-CSV** (paar hundert KB) statt 572 MB. Analog für Nachnamen.
2. **ISO→IOC-Mapping:** `country` ist ISO-2 (`AE`,`CH`,`DE`), das Spiel nutzt IOC-Codes
   (`GBR`,`SUI`,`GER` — siehe `DECADE_NATION_POOLS`). Kleine Mapping-Tabelle ist Pflicht.
3. **`count` → Gewicht normalisieren:** relative Häufigkeit je Land auf handhabbare Gewichte mappen
   (z.B. log-skaliert oder auf 1–5 gebucketet), damit `weightedPick` wie gewohnt funktioniert.
4. **Region-Caveat (Fables eigentlicher Mehrwert):** die CSV liefert *Häufigkeit* + *Nation*, aber
   **NICHT** die Sprachregion. Schweiz kommt als ein `CH`-Topf (DE/FR/IT gemischt) → naive Paarung
   erzeugt weiter „Jacques Müller". Fable muss die Namen intra-national nach wahrscheinlicher
   Sprachregion taggen bzw. Kohärenz-Regeln setzen (siehe Regel 2 unten).

### Die schwierigen Regeln (genau das, was zu prompten anstrengend ist — Fables Kernnutzen)
1. **Häufigkeitsverteilung realistisch:** nicht zu viele seltene Doppelnamen (kein Überfluss an
   „Kleinschmidt-Petersen"), nicht zu wenige echte Allerweltsnamen (genug „Müller", „Smith",
   „Rossi"). Gewicht `5 = häufig · 3 = mittel · 1 = selten`, wie im Bestand.
2. **Sprachregionen innerhalb eines Landes:** z.B. Schweiz = DE/FR/IT-Regionen. Ein Schweizer ist
   **entweder** „Hugo Müller" (Deutschschweiz) **oder** „Jacques Grosjean" (Romandie) — **nicht**
   „Jacques Müller" (Vor-/Nachname aus verschiedenen Regionen gemischt). → Vor- und Nachname müssen
   **regionkohärent** gezogen werden (Sub-Pools je Region + regioninterne Kopplung).
3. **Ära-Drift der Vornamen:** ein moderner Deutscher (2020er) heißt schlecht „Klaus-Jürgen";
   ein 1960er schlecht „Finn-Luca". Vornamen brauchen **Ära-Fenster** (früh/mittel/heute), Nachnamen
   sind ära-stabiler.
4. **Exoten-Fallback:** wenn `pickNationByDecade` eine seltene Nation liefert, für die (noch) kein
   dedizierter Pool existiert (z.B. ein Kirgise / INA / EST / VEN) — definierter Fallback:
   nächstverwandter Kulturpool ODER ein kleiner generischer Regionstopf, nie der falsche
   (kein „Hans Schmidt" für einen Kirgisen). Regel klar dokumentieren.
5. **Eindeutigkeit bleibt beim Spiel:** die bestehende Dedup-Logik gegen aktive Nachnamen
   (`4705–4716`) muss weiter greifen; Fable liefert nur die Pools, nicht die Anti-Duplikat-Logik.

### Erwartetes Deliverable (plug-in-fähig)
- Eine Struktur `NAME_POOLS_BY_NATION` (JS-Literal oder JSON), Schema-Vorschlag:
  ```
  {
    "SUI": {
      "regions": [
        { "w": 0.65, "first": [["Hans",5],["Hugo",3],...], "last": [["Müller",5],["Meier",4],...] },   // DE
        { "w": 0.30, "first": [["Jacques",4],["Olivier",3],...], "last": [["Grosjean",4],["Favre",3],...] }, // FR
        { "w": 0.05, "first": [["Gianluca",3],...], "last": [["Rossi",3],...] }  // IT
      ]
    },
    "GER": { "regions": [ { "w": 1, "first": {"early":[...],"mid":[...],"modern":[...]}, "last":[...] } ] },
    ...
  }
  ```
  (Regionen-Gewicht `w`; Vornamen optional nach Ära-Fenster `early/mid/modern`.)
- Eine **kurze Pick-Spezifikation** (Prosa, ~15 Zeilen): wie `generateDriver` künftig zieht —
  Nation → Region (nach `w`) → Ära-Fenster (aus `year`) → `weightedPick` first+last aus **derselben**
  Region. Plus Fallback-Regel für pool-lose Nationen.
- Abdeckung mindestens der Nationen aus `DECADE_NATION_POOLS` (oben gelistet). Rest → Fallback.

### Abgrenzung (NICHT tun)
- Keine Änderung an `pickNationByDecade` / `DECADE_NATION_POOLS` (Nations-Gewichte stimmen bereits).
- `generateDriver` nicht selbst umbauen — nur die Pick-Spezifikation liefern; Umbau macht Opus.
- Kein `manage-v`, kein Commit.

---

# PAKET B (Prosa) 🥇 — Erzählter Saison-Rückblick am Saisonende

### Andockpunkt
- `showSeasonEndModal()` → `index.html:9709`. Baut das Saisonende-Modal (`html`-String).
  Champion-Objekt ab `9713`, Team-Champion `9717`, Todesfälle-Block ab `9745`.
- `processSeasonEndEvents()` → `9603` (Logik, kein UI). `prepareSeasonEndSnapshot()` → `9668`.
- **Einbaustelle für den Rückblick:** neuer Card-Block im `html` NACH dem Konstrukteurs-Champion
  (`~9741`) und VOR/nach dem Todesfälle-Block. Rein additiv, ändert keine Berechnung.

### Verfügbarer State (Input für die Erzähl-Bausteine)
- `champion` / `teamChampion`: `{ id, name, points, wins }`.
- `GAME_STATE.driverStandings` / `teamStandings`: volle Wertung (Punkte je Fahrer/Team) → für
  Titel-Vorsprung, „bis zum letzten Rennen", Vize etc.
- `GAME_STATE.seasonDeaths` (Array): `{ driver, name, team, raceName, replacement, replacementTeam }`.
- `GAME_STATE.currentYear` → **Ära** (bestimmt Ton/Namens-Lore).
- Fahrer tragen **echte historische Namen** → Fables F1-Wissen anwendbar (reale Rivalitäten,
  Charaktere, Team-Lore der jeweiligen Ära).

### Ziel & Warum Fable
Ein **erzählter Report** (3–6 Sätze), der den Titelkampf lebendig nacherzählt — mit echten Namen,
ära-stimmig. Braucht Varianz (jede Saison klingt anders) **und** F1-Lore-Gefühl = Fables Doppelstärke.

### Deliverable (kein Runtime-LLM!)
- Eine **Phrasen-Bank + Assembler-Spezifikation**: modulare Satzbausteine (Titel-knapp / Titel-
  dominant / Überraschungssieger / Rookie-Durchbruch / tragische Saison bei Todesfällen / Backmarker-
  Sensation), die das Spiel deterministisch nach State-Bedingungen zusammensetzt.
- Strukturvorschlag: `function seasonRecapText(champion, teamChampion, standings, deaths, year)`
  → gibt fertigen deutschen Absatz zurück, rein aus Bausteinen + Bedingungen (Vorsprung, #Siege,
  #Tote, Ära). Fable liefert die Bausteine + Auswahl-Logik als Prosa/Pseudo-Code; Opus verdrahtet.
- Ton: sportjournalistisch, deutsch, ära-angepasst (1950er nüchtern-heroisch, 2000er
  medial-modern). Keine erfundenen Fakten über reale Personen — nur was aus dem State folgt + neutrale
  Lore-Färbung.

### Abgrenzung
- Nur additiver Anzeige-Block. Keine Änderung an Standings/Karriere/Score-Logik.
- Modus-neutral: erscheint in JEDEM Modus gleich (Modus = nur Darstellung).

---

# PAKET C (Prosa) 🥈 — Nachrufe & Abschiede

### Andockpunkte
- Tod: `_rollWeekendDeath()` → `index.html:7949`; Anzeige im Saisonende-Modal ab `9745`
  (`GAME_STATE.seasonDeaths`-Map, Felder siehe Paket B).
- Karriereende/Rücktritt: `checkCareerEnds()` → `10041`, `checkRetirements()` → `10222`.

### Ziel & Warum Fable
Wenn ein **echter historischer** Fahrer im Sim tödlich verunglückt oder zurücktritt → kurzer,
würdiger Nachruf/Abschiedstext (1–3 Sätze), der aufgreift, wer der Fahrer real war (Ära, echte
Erfolge, Charakter). Emotional, lore-schwer, self-contained — der stärkste „Ton-Unterschied"-Test.

### Deliverable
- Phrasen-Bank in zwei Registern: **Nachruf** (Tod, würdevoll) und **Abschied** (Rücktritt, warm/
  ehrend). Bausteine nach: erfahrener Champion vs. junges Talent vs. langjähriger Backmarker;
  Ära-Ton. Assembler-Spec analog Paket B.
- Für **reale** Fahrer darf Fable neutrale Lore-Färbung einweben; für **fiktive/generierte** Fahrer
  (histId ohne reale Entsprechung) nur State-basierte, generische Würdigung (keine erfundene Bio).
  → Fable braucht eine Regel „real vs. generiert erkennen" (z.B. via vorhandenes `histId`-Schema;
  Details liefert die Opus-Session).

### Abgrenzung
- Additiver Text im bestehenden Todesfall-/Rücktritts-Block. Keine Logikänderung.

---

# PAKET D (Validierung) 🥈 — Realismus-QA eines Mega-Sim-Laufs

### Kontext
Leitlinie: **„plausibel vor perfekt, emergent vor gescriptet"** (CLAUDE.md). Es fehlt ein Maßstab für
*plausibel*. Fable = F1-Wissens-Orakel als Plausibilitäts-Prüfer.

### Ablauf (Nutzer-getrieben, kein Code)
- Nutzer liefert Output eines Headless-Laufs (`runSeasonHeadless` → `index.html:13524`,
  `simulateSeasonRaces` → `13460`) — z.B. mehrere simulierte Saisons als Tabellen/JSON.
- Fable urteilt strukturiert: **plausibel / unplausibel + Begründung** je Auffälligkeit.
  Fokus: Wechselt ein 34-jähriger Champion realistisch zu einem Backmarker? Passen Nationen zur
  Ära? Sind Titel-/DNF-Verteilungen historisch glaubwürdig? Backmarker zu oft in Punkten?

### Deliverable
- Markdown-Report: Liste der Auffälligkeiten, je mit Schweregrad + „warum unrealistisch" + Bezug zu
  echter F1-Historie. **Keine Code-Fixes** — nur das Urteil. Kalibrier-/Logik-Fixes macht Opus.
- Verknüpft mit Roadmap-Punkt „Minardi 2001 kommt selten in Punkte" (`V1_ROADMAP.md`): welche realen
  Teams/Fahrer taugen als Kalibrier-Anker.

---

# PAKET E (Validierung) 🥉 — Historische Daten-Validierung SEASON_DATA

### Kontext
Laut Projekt-Memory ~42 SEASON_DATA-Abweichungen, Cockpit-Lücken, offene Elo-Fixes.
Fable als **Faktenchecker gegen echte F1-Historie**: wer fuhr wann, welches Team, welche Nation.

### Ablauf
- Nutzer/Opus liefert die konkreten Abweichungs-Kandidaten (Jahr, Team, Fahrer, Feld) aus
  `data/seasons.js` (Schema: `schemas/season-data.schema.json`).
- Fable prüft je Fall gegen reale Historie und schlägt Korrektur vor (mit kurzer Quelle/Begründung
  aus Wissen). **Keine** direkte Datei-Edits — Fable liefert die Korrektur-Tabelle; Einbau via Opus.

### Deliverable
- Tabelle: `Jahr | Team | Feld | ist | soll | Begründung`. Priorisiert nach Sicherheit.

---

## Session-Reihenfolge-Empfehlung
1. **Paket A** (Namen) — größter struktureller Gewinn, Fables Wissens-Kern, du wartest ohnehin auf den
   BQ-Datensatz-Einbau.
2. **Paket B** (Saison-Rückblick) — sichtbarster Prosa-Test, jeder sieht das Saisonende.
3. Danach C / D / E nach Lust.

Nach jeder Fable-Session: Material an Opus zurück → chirurgische Integration + `functions.schema.json`
+ `manage-v`. Fable bleibt außerhalb der Monolith-Mechanik.
