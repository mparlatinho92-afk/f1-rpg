# Junior-Welt-Speicher: Seed-Regeneration — Umsetzungs-Fahrplan

**Status:** **Stufe 1 EINGEBAUT (v0.9.14.72).** Stufen 2–4 offen. Leitprinzip (Nutzer): **„RAM statt Speicher"** — alles,
was deterministische Funktion gespeicherter Anker ist, wird beim Ansehen in RAM neu erzeugt statt
persistiert. Speicher wächst über Jahrhunderte unbegrenzt; Rechenzeit ist transient und fällt nur
an, wenn jemand hinschaut.

Verwandt: `project_storage_roadmap`, `project_junior_world`, `project_lazy_loading_phase3`,
`project_gzip_phase4`. Namens-Seed geht hier auf (`capacity-and-compression.md` §5).

---

## Warum: Namen sind ein Nebenschauplatz

Speicher-Messung der vollen Pyramide (91 Serien, 2.872 Sitze/Saison), gzip:

| Variante | /Saison | /Jahrhundert | 3 Jh | 5 Jh |
|----------|--------:|-------------:|-----:|-----:|
| ① Volldetail **mit** Namen | 0,6 MB | 57,5 MB | 173 MB | 288 MB |
| ② Volldetail **ohne** Namen | 0,6 MB | 55,8 MB | 167 MB | 279 MB |
| ③ nur Standings (kein Renn-Detail) | – | 3,1 MB | 9 MB | 15 MB |
| ④ Seed-only (Regeneration) | – | 0,2 MB | 0,5 MB | 0,8 MB |

**Namen sind nur ~3 %** (① vs ②: 1,7 MB/Jh). Die Masse sind die **Renn-Detaildaten**
(results/qualifying jeder Runde jeder Serie) = **56 MB/Jh → 5 Jh = 279 MB**. Das ist das echte
Speicherproblem. Namen komprimieren = am falschen Ende sparen.

---

## Das Speicher↔RAM-Spektrum

| Level | Gespeichert | 5 Jh | RAM-Einsatz |
|-------|-------------|-----:|-------------|
| 0 (heute) | alles (heavy) | 279 MB | keiner |
| 1 | nur Standings/Champions | 15 MB | leicht |
| **2 ⭐** | Spine + Season-Seed | ~5 MB | Regen einer Saison beim Ansehen (schnell, gecacht) |
| 3 | nur worldSeed + notable | ~1 MB | Voll-Replay (teuer, Cache nötig) |

**Empfehlung Level 2** — bester Schnitt. RAM nur bei tatsächlichem Öffnen einer Alt-Saison,
Ergebnis für die Session gecacht.

---

## Junior-Welt-Datenmodell (vier Speicher-Ebenen, Ist-Zustand)
- **`jw.drivers`** — aktive Kletterer (persistente Fahrer, steigen F3→F2 auf): `id, histId, name,
  nation, pace/potential/consistency/rain, age, _retireAge, contractEnd, seriesId, _lastPoints`.
  Bounded (~2.872 aktiv, Retirees fallen raus).
- **`jw.history` (light)** — pro Jahr/Serie nur Champion-Summary.
- **heavy (IDB_JDETAIL, gzip)** — standings, drivers-Snapshots, races (results+qualifying jeder
  Runde) ← **die 56 MB/Jh**.
- **Aggregate** — `allTimeStats` (Karriere je histId), `circuitIndex` (Rekorde).

---

## SPINE — was zwingend persistiert werden muss

| Element | Warum nicht regenerierbar | Größe über Zeit |
|---------|---------------------------|-----------------|
| `jw.series` (Definitionen) | statischer Anker, überall referenziert | winzig, konstant |
| `jw.drivers` (aktive Kletterer) | tragen Karriere + Aufstieg nach vorn; Identität muss stabil sein | konstant (~430 KB, nicht kumulativ) |
| `jw.history` light (Champion/Jahr/Serie) | kanonischer Meister — Ankerpunkt jeder Saison | ~7 KB/Jahr → 0,7 MB/Jh |
| `jw.circuitIndex` (Streckenrekorde) | Aggregat, bounded durch #Strecken | klein, ~konstant |
| `jw.allTimeStats` (Karriere-Aggregat) | ohne Replay nicht rekonstruierbar ⚠️ | wächst → **prunen!** |
| pro Saison/Serie: `seed + championId` (+ top3?) | Anker, aus dem der Rest neu entsteht | 0,2 MB/Jh |

## FILLER — nur Seed, komplett regenerierbar
- `heavy.races` (results/qualifying jeder Runde) — die eigentlichen 56 MB/Jh
- `heavy.standings` / teamPoints / Fahrer-Snapshots — aus dem Seed neu würfelbar
- Namen + Werte der **Nicht-Kletterer** (Feld-Auffüller, die nie aufsteigen/gewinnen)

## Das eine Wachstums-Risiko: `allTimeStats`
Wächst pro distinktem Fahrer (~48k/Jh) → unbeschnitten ~5 MB/Jh, 5 Jh ~24 MB. **Lösung:** nur
„notable" persistieren — Champions, Aufsteiger (F2/F1-Kandidaten), Rekordhalter. Filler-Fahrer
(nie gewonnen, nie aufgestiegen) brauchen keinen All-Time-Eintrag → gepruned ~0,5 MB/Jh.

## Spine/Filler-Grenzregel (für die Regen)
In einer regenerierten Alt-Saison: Fahrer, die der Spine kennt (Champion, Kletterer,
allTimeStats-Eintrag) behalten ihre persistierte Identität/Namen; reine Filler werden aus dem Seed
neu erzeugt (Name = f(id)). So bleibt der Meister von 2087 immer derselbe, aber das P14-Feld dahinter
kostet nichts. **Netto Spine (gepruned): ~1 MB/Jh → ~5 MB über 5 Jh** (gegenüber ~279 MB Filler).

---

## Determinismus-Mechanik (Umsetzung)

1. **Seeded RNG statt `Math.random`** in `_simulateJuniorSeriesSeason` + `_makeJuniorDriver`.
   Kein neuer Speicher: `rng = _recapRng(hash(worldSeed|seriesId|year))` — die eine `worldSeed` +
   (Serie, Jahr) leitet alle Sub-Seeds ab.
2. **Filler-Fahrer deterministisch:** `fillerDriver(rng, seriesId, year, seatIndex)` → Name = f(id)
   (der Namens-Seed geht hier auf), Nation/Werte aus demselben rng. Nichts gespeichert.
3. **Notable-Fahrer (Spine) injiziert:** echte Identität aus dem Spine. Pace im Jahr Y ist kein
   Speicher-Problem, wenn Alterung deterministisch ist (Pace wächst per Formel Richtung `potential`
   über `year − debutYear`) → aus `{basePace, potential, debutYear}` (steht schon in `jw.drivers`)
   rekonstruierbar. Sonst kompakter Stat-Track nur für die wenigen Notable.
4. **Sim läuft** → results/qualifying/standings entstehen in RAM. Champion ergibt sich; muss dem
   gespeicherten entsprechen (bei identischem Roster+Seed automatisch).

## Trigger + Cache
- Beim Öffnen einer Alt-Saison (`_renderJuniorSeason(year)`): kein heavy-Blob → regenerieren aus
  Spine+Seed, in Session-Map-Cache legen. Zweiter Blick = gratis.
- Live-Simulation (aktuelles Jahr) läuft weiter wie bisher, schreibt aber nur den **Spine** raus
  (kein heavy-Persist mehr).

## Ehrliche Caveats
- **Determinismus-Disziplin:** jeder Zufallsaufruf im Regen-Pfad muss geseedet sein (auch die
  Pace-Alterung). Ein einziges übriges `Math.random` → nicht reproduzierbar.
- **Versionierung:** ändert sich der Generator, würfeln alte Seeds anders → `genVersion`
  mitspeichern, oder kosmetische Drift bei Uralt-Saisons akzeptieren.
- **Spine ist autoritativ:** weicht ein regenerierter Wert vom Anker ab (nach Code-Änderung),
  gewinnt der Spine (Champion/Notable-Stats überschreiben die Regen-Flavour).
- **Stabiler Namenspool:** ändert sich `names.js`, driften regenerierte Filler-Namen — akzeptabel/
  versionierbar.
- **Zukünftiger F1-Aufstieg:** sobald Junioren in die F1 aufsteigen, wird der Aufsteiger automatisch
  Spine (persistiert) — nur Filler bleibt volatil. Sauber.

**Netto:** volle Junior-Pyramide über Jahrhunderte für **~5 MB statt 279 MB**, ohne Verlust an
Ansehbarkeit — jede Alt-Saison ist auf Klick wieder da, nur aus RAM.

---

## Erkenntnisse aus dem echten Code (2026-07-15, bei Stufe-1-Bau bestätigt)
- **Pfadabhängigkeit:** `advanceJuniorWorld` ist eine Kette (altern→Rücktritt→Aufstieg→Transfer→Nachrücker→Sim), das `jw.drivers`-Roster evolviert Jahr für Jahr. Season Y lässt sich NICHT aus einem reinen Season-Seed isoliert regenerieren — der Roster-Zustand bei Y ist Produkt aller Vorjahre. **Darum:** Stufe 2 speichert den Roster-Snapshot + Seed und regeneriert nur `races`; erst Stufe 4 (Voll-Replay der Evolution) darf den Snapshot droppen.
- **Der heavy-Record hat 2 Teile:** `drivers` (Roster-Snapshot, klein) + `races` (Ergebnisse/Quali jeder Runde, ~90 % der Masse). Stufe 2 = `races` regenerieren spart das meiste.
- **Spine/Filler ist PRO TEILNEHMER, nicht pro Serie** — Grundlage für die spätere Crossover-Chaos-Welt (echte F1-Fahrer fahren zusätzlich Le Mans/Tasman etc.): deren Teilnahme+Ergebnis = Spine (gespeichert), Rest des Feldes = Filler (regenerierbar). Bleibt durch #Spine-Entitäten begrenzt, nicht durch Gesamt-Teilnahmen. `heavy.spine:[]`-Feld ist in Stufe 1 schon angelegt (leer).
- **Serien dynamisch/era-abhängig:** Register ist append-only mit `startYear`/`endYear`/`kind`. Serien hinzufügen/abschaffen berührt eingefrorene Alt-Saisons nie.
- **Skalierung:** Stufe 2 (Snapshots) trägt ~91 Serien (~28 MB/5 Jh) locker; ~500 Kart-Serien brauchen Stufe 4 (Snapshots droppen → ~5 MB, wenn Determinismus der Evolution hält).

## Umsetzungs-Schritte
### Stufe 1 — Fundament ✅ EINGEBAUT (v0.9.14.72)
- `jw.worldSeed` (in `_emptyJuniorWorld`, Backfill in `advanceJuniorWorld`).
- Era-Register: `kind`/`startYear`/`endYear` an `JUNIOR_SERIES_DEFS` + Backfill in `_ensureJuniorRoster`.
- `_simulateJuniorSeriesSeason(…, seed)` vollständig deterministisch (11× `Math.random`→`rng=_recapRng(seed)`; Kalender per **salted** Sub-Seed `seed^0x9e3779b9` isoliert → Kalender-Existenz verschiebt Renn-Stream nicht). Season-Seed = `_recapHash(worldSeed|seriesId|year)`. `heavy.seed`+`heavy.spine:[]` selbstbeschreibend.
- Node-Test 8/8 grün (gleicher Seed→byte-identisch; anderer Seed→anders; Kalender-Isolation; Todes-Modus deterministisch). Null Player-Impact (rng() uniform wie Math.random).

### Stufe 2 — Races droppen (offen, der eigentliche Speicher-Gewinn)
- `advanceJuniorWorld`/`idbJDetailPut`: `heavy.races` NICHT mehr persistieren (nur Snapshot+seed).
- `_renderJuniorSeason` (~L18527): kein heavy-Blob → aus Snapshot+seed regenerieren, Session-Cache. Alt-Saves mit gespeicherten `races` = Fallback.
- ⚠️ Gotcha: `_foldJuniorAggregates` läuft schon inkrementell aus `sim.heavy` (bleibt), also allTimeStats unabhängig von der races-Persistenz.

### Stufe 3 — allTimeStats prunen (offen)
- Nur „notable" (Champions/Aufsteiger/Rekordhalter) persistieren; Filler regenerierbar. `heavy.spine` füllen.

### Stufe 4 — Voll-Replay (offen, optional/später)
- Roster-Evolution aus `worldSeed` deterministisch: `_makeJuniorDriver`, `_assignJuniorNumber`, `_developJuniorDriver`, `_ageAndRetireJuniors`, `_ensureJuniorTeams`, `_juniorContractMoves` + Namens-Kette (`pickNationMotorsport`/`pickPooledName`) seeded. Dann Snapshot droppen. `genVersion`-Feld für Generator-Versionierung.
- Entscheidet, ob 500-Kart-Extrem tatsächlich geht.
