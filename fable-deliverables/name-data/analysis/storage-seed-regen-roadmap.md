# Junior-Welt-Speicher: Seed-Regeneration — Umsetzungs-Fahrplan

**Status:** DESIGN, noch NICHT gebaut. Leitprinzip (Nutzer): **„RAM statt Speicher"** — alles,
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

## Offene Umsetzungs-Schritte (wenn grünes Licht)
1. `_simulateJuniorSeriesSeason` + `_makeJuniorDriver` auf seeded RNG umstellen (durchgängig).
2. `fillerDriver()` + deterministischer Namens-Pick (`pickPooledName` seeded).
3. Spine-Persist-Umbau: Live-Sim schreibt nur Spine, kein heavy-Blob mehr.
4. Regen-Trigger + Session-Cache in `_renderJuniorSeason`.
5. `allTimeStats`-Pruning auf „notable".
6. `genVersion`-Feld für Generator-Versionierung.
