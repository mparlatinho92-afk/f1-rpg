# Paket C — Integrations-Spec: Nachrufe & Abschiede

**Deliverable:** `fable-deliverables/paketC-obituary-bank.js` — `DRIVER_LORE`
(~238 kuratierte Epitheta realer Fahrer inkl. Indy-Piloten 1950–60, Key = normalisierter Name),
`OBIT_BANK` (Register `nachruf`/`abschied` mit Kategorien champion/talent/star/
backmarker/gaveup/generic), Assembler `obituaryText()` + 3 `_obit*`-Helfer.
Wiederverwendet aus Paket B (bereits inline): `_recapHash/_recapRng/_recapPick/
_recapFill/RECAP_ERA_WORDS` — Paket C MUSS im Monolithen NACH dem Paket-B-Block
stehen.

## 1. Lore-Leitplanke (Kernregel, bei Erweiterungen einhalten)

Epitheta beschreiben NUR Herkunft/Fahrstil/Charakter/etablierte Spitznamen —
NIE reale Erfolge/Titel. Grund: Sim-Karrieren weichen von der Realität ab
(Fangio kann im Sim 1952 titellos sterben). Erfolge kommen ausschließlich aus
`allTimeStATS` (Sim-State). Generierte Fahrer (histId null / gen-/jw-Präfix)
bekommen NIE Lore — nur generische, state-basierte Bausteine.

## 2. Einbau-Orte (rein additiv, keine Logik-Änderung)

Beide in `showSeasonEndModal()`:

**(a) Todesfälle-Block** (`GAME_STATE.seasonDeaths.map(...)`, ~Z. 10460 in
v0.9.14.41): pro Eintrag nach der Ersatz-Zeile ein Nachruf-Absatz:

```js
const drv = GAME_STATE.drivers.find(x => x.id === d.driver) || null;
const stats = drv ? GAME_STATE.allTimeStATS?.drivers?.[drv.histId || drv.id] : null;
const obit = obituaryText(d.name, drv, stats, GAME_STATE.currentYear, 'death');
// → <div class="text-xs italic text-tertiary mt-1">${obit}</div>
```

**(b) Karriereenden-Block** (byAge/gaveUp-Listen): pro Eintrag eine
Abschieds-Zeile darunter:

```js
const obit = obituaryText(r.name, drv, stats, GAME_STATE.currentYear, 'retire',
    { age: r.age, retireType: r.type });   // r.type: 'age' | 'gaveup'
```

Fahrer-Lookup via `r.driver` (ID); `drv`/`stats` dürfen null sein — der
Assembler degradiert dann auf generische Bausteine ohne Bilanz-Satz.

## 3. Entscheidungslogik (im Assembler, Referenz)

- **Kategorie (nur Sim-State):** champion (WM-Titel > 0) → talent (Tod & Alter
  ≤ 25) → star (Siege > 0 oder Podien ≥ 3) → backmarker (Starts ≥ 50) →
  generic. Bei Rücktritt Typ `gaveup` (und nicht champion/star): eigener
  leiserer Ton.
- **Lore-Lookup:** nur wenn `_obitIsReal(drv)` (histId vorhanden, kein
  gen-/jw-/reserve-Präfix); Key = `_obitNameKey(name)` (lowercase, Akzente
  weg, Nicht-Alphanumerik → `-`) — bewusst über den NAMEN, nicht den
  histId-Slug (robust gegen Slug-Konventionen).
- **Grammatik:** `{nameE}` (Name + Lore-Apposition) steht in allen Templates
  ausschließlich in Subjekt-Position (Nominativ); `{bilanz}` nutzt Ziffern
  (kasus-invariant). Bei neuen Phrasen beide Regeln einhalten.
- **Determinismus:** Seed `mode|name|year` → Re-Render-stabil.
- **Off-Season-Retro (umgesetzt):** `startNewSeason` friert beim History-Push
  pro deaths-/retirements-Eintrag `histId`, `birthYear` und `obitStats`
  ({races,wins,podiums,championships}) LEICHT ein (~40 Bytes) — damit
  regeneriert `showOffSeasonModal` Nachruf/Abschied wortgleich für immer,
  unabhängig von GAME_STATE.drivers/allTimeStATS. Alt-Saisons ohne diese
  Felder: Live-Lookup-Fallback, sonst generische Würdigung. Abschied nur für
  Typ age/gaveup (Entlassene bekommen keinen warmen Abschiedstext).

## 3b. Phrasen-Bank erweitern — vollständige Regeln (self-contained, kein
## Session-Memory nötig)

1. **Quelle ist `fable-deliverables/paketC-obituary-bank.js`** — dort editieren,
   dann den Inline-Block in index.html (zwischen `// FABLE PAKET C`-Header und
   `function showSeasonEndModal()`) daraus neu generieren (Export-Block
   entfernen, 8 Spaces Basis-Indent). NIE nur eine der beiden Kopien ändern.
2. **Lore (`DRIVER_LORE`):** nur Herkunft/Fahrstil/Charakter/etablierte
   Spitznamen — NIE reale Erfolge/Titel (§1). Maskuline/neutrale
   NOMINATIV-Apposition ("der stille Schotte"), Key = kebab-case-Name ohne
   Akzente (`_obitNameKey`).
3. **Templates:** `{nameE}` ausschließlich in Subjekt-Position (Nominativ);
   `{name}` ist kasus-frei; `{bilanz}` nur als Aufzählung einbetten (Ziffern,
   kasus-invariant, aber NUMERUS beachten: 1 → Singular-Nomen im Builder);
   Ära-Tokens: `{klasseNom}` nur als Subjekt, `{klasseIn}` fertige
   Präpositionalphrase, `{klasseGen}` nur Genitiv-Attribut. Satzanfänge werden
   automatisch großgeschrieben (Tokens dürfen vorn stehen).
4. **Wiederholungs-Faustegel:** close-/stats-Pools ≥ 8 bzw. ≥ 5 Varianten
   halten — bei mehreren Todesfällen/Rücktritten pro Saison werden sonst
   sichtbar gleiche Schlusssätze untereinander gezogen (Seed ist pro Fahrer,
   Kollisionen sind Zufall).
5. **Rückwirkung:** Pool-Änderungen ändern die Phrasen-WAHL auch rückwirkend
   für alte Saisons (deterministischer Pick über Poolgröße). Fakten bleiben
   korrekt — bewusst akzeptierter Trade-off der 0-Byte-Regeneration.
6. Danach: Node-Test (Szenarien in `tests`-Abschnitt unten bzw. Scratch),
   `./update-functions-index.ps1`, manage-v.

## 4. Pflicht-Nacharbeiten (Opus)

1. functions.schema.json: `obituaryText`, `_obitNameKey`, `_obitIsReal`,
   `_obitBilanz` (+ `./update-functions-index.ps1`).
2. Changelog + manage-v (Hotfix-Stufe).
3. Kein data/*.js nötig (inline, wie Paket B).

## 5. Schnelltest (Browser-Konsole, nach Integration)

```js
obituaryText('Jim Clark', { histId: 'jim-clark', birthYear: 1936 },
  { races: 72, wins: 25, podiums: 32, championships: 2 }, 1968, 'death')
// → Champion-Nachruf mit Lore-Apposition, Bilanz, Ära-Schluss (3 Sätze)
obituaryText('Hans Testmann', { histId: null }, { races: 84, wins: 0, podiums: 1 }, 1975, 'retire', { retireType: 'age' })
// → generischer Backmarker-Abschied OHNE Lore
```
