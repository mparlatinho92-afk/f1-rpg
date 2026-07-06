# Paket B — Integrations-Spec: Erzählter Saison-Rückblick

**Deliverable:** `fable-deliverables/paketB-recap-bank.js` (Phrasen-Bank `RECAP_BANK`,
Ära-Register `RECAP_ERA_WORDS`, Assembler `seasonRecapText()` + 6 `_recap*`-Helfer).
Kein Runtime-LLM — rein deterministische Baustein-Montage. Diese Spec beschreibt die
chirurgische Verdrahtung für die Opus-Session.

## 1. Einbau-Ort

- Den kompletten Inhalt von `paketB-recap-bank.js` **inline** in `index.html` übernehmen
  (analog `MOTORSPORT_NATION_BLEND`: kein neues `data/*.js`, manage-v muss nichts extra
  inlinieren). Sinnvoller Platz: direkt vor `showSeasonEndModal()` (~Z. 10004, Stand v0.9.14.39).
- In `showSeasonEndModal()` einen **rein additiven** Card-Block NACH der
  Konstrukteurs-Champion-Card (Ende des ersten `html`-Template-Strings, ~Z. 10036) einfügen:

```js
const recap = seasonRecapText(champion, teamChampion,
    GAME_STATE.driverStandings, GAME_STATE.teamStandings,
    GAME_STATE.seasonDeaths, GAME_STATE.currentYear,
    { raceCount: GAME_STATE.races.length, isRookieChampion: /* §4 */ });
if (recap) html += `
    <div class="card p-4 rounded-lg mb-4">
        <h4 class="font-bold mb-2">📰 Saison-Rückblick</h4>
        <p class="text-sm leading-relaxed">${recap}</p>
    </div>`;
```

- **Keine** Änderung an Standings/Karriere/Score-Logik. Modus-neutral: `showSeasonEndModal()`
  wird von allen Modi genutzt → kein weiterer Andockpunkt nötig.

## 2. Signatur & Inputs

`seasonRecapText(champion, teamChampion, driverStandings, teamStandings, deaths, year, extra)`

- `champion`/`teamChampion`: die in `showSeasonEndModal()` bereits gebauten Objekte
  (`{ id, ...standingsEintrag }`). Nutzt `name, points, wins, poles, team`.
- `deaths`: `GAME_STATE.seasonDeaths` (nutzt `name, team, raceName`).
- `extra.raceCount`: `GAME_STATE.races.length` — schärft Dominanz- (≥50 % Siege) und
  Pole-König-Check (≥50 % Poles). Ohne raceCount greifen Fallback-Schwellen.
- Gibt `''` zurück wenn kein Champion → Card einfach weglassen (leere Saison / Abbruch).

## 3. Entscheidungslogik (im Assembler enthalten, hier nur Referenz)

- **Titelkampf-Kategorie:** `knapp` wenn Vorsprung ≤ Siegpunkte der Ära
  (<1961: 8, <1991: 9, <2010: 10, sonst 25); `dominant` wenn ≥50 % der Rennen gewonnen
  oder Vorsprung ≥ 3 Siegwertungen; sonst `normal`.
- **Satz-Slots:** Opener (Kategorie) → Vize-Duell (falls Vize mit >0 Punkten) →
  max. EINE Sonderbedingung (Rookie > Underdog[Team-Rang ≥4] > „meiste Siege verloren" >
  Pole-König) → Konstrukteurs-Satz (Doppelkrone vs. getrennt) → Tragik (1 vs. mehrere
  Todesfälle) → Schlusssatz (nur wenn <6 Sätze; tragische Variante bei Todesfällen).
- **Determinismus:** RNG geseedet aus `year|championName|points|wins` → Re-Render des
  Modals liefert identischen Text; jede Saison klingt anders.
- **Ära-Ton** über `RECAP_ERA_WORDS` (5 Register 1950–61 / 62–75 / 76–93 / 94–2009 / 2010+).
  Tokens haben feste grammatische Rollen (Kommentar im JS) — bei neuen Phrasen beachten.

## 4. Rookie-Erkennung (einzige Opus-Rechenaufgabe)

Bewusst NICHT im Assembler: `careerScores` ist bei geseedeten historischen Fahrern anfangs
leer → naive Prüfung würde Veteranen als Rookies feiern. Vorschlag:

```js
const champDrv = GAME_STATE.drivers.find(d => d.id === champion.id);
const isRookieChampion = !!(champDrv && Array.isArray(champDrv.careerScores) &&
    champDrv.careerScores.filter(c => c.year < GAME_STATE.currentYear).length === 0 &&
    GAME_STATE.currentYear > (GAME_STATE._gameStartYear || GAME_STATE.currentYear));
```

Kern-Guard: Saison muss NACH dem Spielstart liegen (im Startjahr sind alle careerScores
leer). Falls kein Feld mit dem Spielstart-Jahr existiert, eines beim Neuspiel setzen oder
Rookie-Feature vorerst mit `false` verdrahten (Rest funktioniert unverändert).

## 5. Fakten-Leitplanke (bei Phrasen-Erweiterungen einhalten)

Jeder Satz stützt sich nur auf State-Werte + neutrale Ära-Färbung. Verboten: Behauptungen
die der State nicht hergibt („sein erster Titel", „nach seinem Unfall in …",
Charakter-Zuschreibungen zu realen Personen), erfundene Unfallursachen bei Todesfällen.

## 5b. Phrasen-Bank erweitern — vollständige Regeln (self-contained, kein
## Session-Memory nötig)

1. **Quelle ist `fable-deliverables/paketB-recap-bank.js`** — dort editieren, dann den
   Inline-Block in index.html (RECAP_ERA_WORDS bis inkl. seasonRecapText, vor
   `isRookieChampionCheck`) synchron halten. NIE nur eine Kopie ändern.
2. **Kasus-Tokens nie mischen:** Zahl-Tokens sind fertige Nominalphrasen in festem
   Kasus — `{gapNom}`/`{gapDat}`/`{gapAkk}` („um {gapAkk}"!, „mit {gapDat}",
   „{gapNom} Vorsprung"), `{siegeNom}`/`{siegeDat}`. Nie nackte Zahlen mit
   angehängtem „Sieg(e)/Punkt(e)" im Template bilden.
3. **Verb-Kongruenz-Falle:** Konstruktionen, deren Verb-Numerus vom Zahlwert abhängt
   („trennte(n) … ein Punkt / 3 Punkte") vermeiden — auf invariante Formen umbauen
   („betrug der Abstand … {gapAkk}").
4. **Ära-Tokens:** feste grammatische Rollen — `{klasseNom}`/`{presseNom}`/`{publikum}`
   nur als Subjekt (alle Singular!), `{klasseGen}` nur Genitiv-Attribut, `{klasseIn}`
   fertige Präpositionalphrase, `{fahrerPl}` Plural-Nomen.
5. **Rückwirkung:** Pool-Änderungen ändern die Phrasen-WAHL auch rückwirkend für alte
   Saisons (deterministischer Pick über Poolgröße; Off-Season regeneriert). Fakten
   bleiben korrekt — bewusst akzeptierter Trade-off der 0-Byte-Regeneration.
6. Danach: Node-Test (Szenarien wie §7), `./update-functions-index.ps1`, manage-v.

## 6. Pflicht-Nacharbeiten (Opus)

1. `functions.schema.json`: `seasonRecapText` + `_recap*`-Helfer eintragen
   (`./update-functions-index.ps1`).
2. Changelog-Eintrag, Version per manage-v (Hotfix-Stufe, rein additiv).
3. Kein `data/*.js`-Eintrag nötig (inline).

## 7. Schnelltest (Browser-Konsole)

```js
seasonRecapText(
  { id:'x', name:'Juan Manuel Fangio', points:42, wins:6, poles:5, team:'mercedes' },
  { id:'mercedes', name:'Mercedes', points:80 },
  { x:{name:'Juan Manuel Fangio',team:'mercedes',points:42,wins:6,poles:5},
    y:{name:'Stirling Moss',team:'mercedes',points:41,wins:3,poles:2} },
  { mercedes:{name:'Mercedes',points:80}, ferrari:{name:'Ferrari',points:50} },
  [{ name:'Onofre Marimón', team:'Maserati', raceName:'German GP' }],
  1955, { raceCount:7 })
```

Erwartung: 4–6 deutsche Sätze, knapper Titelkampf (1 Punkt), Doppelkrone, Tragik-Satz,
1950er-Tonlage. Gleicher Aufruf → exakt gleicher Text.
