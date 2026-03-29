/**
 * normalize-elo.js
 * Übersetzt elo_ratings.json → pace_ratings.json
 *
 * Pipeline:
 *   1. relatives Elo  = driver_elo − team_avg_elo  (trennt Fahrer- von Wagenpace)
 *   2. Normalisierung = globale Perzentile 5%/95% → 58–98
 *   3. Reliability-Dämpfung  (Rookies mit < 20 Rennen zur Mitte hin gedämpft)
 *   4. Velocity-Bonus        (2-Jahres-Elo-Trend → ±pace)
 *   5. potential_pace        = bestes career-pace, eingefroren
 *
 * Ausführen: node tests/normalize-elo.js
 * Output:    tests/pace_ratings.json
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const HTML_FILE       = path.join(__dirname, '..', 'index.html');
const ELO_FILE        = path.join(__dirname, 'elo_ratings.json');
const OUT_FILE        = path.join(__dirname, 'pace_ratings.json');
const F1DB_DRV_FILE   = path.join(__dirname, '..', 'f1db-json-splitted', 'f1db-drivers.json');

// Geburtsjahre aus f1db-drivers.json { slug: year }
const birthYears = {};
for (const d of JSON.parse(fs.readFileSync(F1DB_DRV_FILE, 'utf8'))) {
    if (d.id && d.dateOfBirth) birthYears[d.id] = parseInt(d.dateOfBirth.slice(0, 4));
}

const PACE_MIN   = 58;
const PACE_MAX   = 98;
const PACE_RANGE = PACE_MAX - PACE_MIN; // 40

// Wie viele Rennteilnahmen bis ein Fahrer als "vollständig bewertet" gilt
const RELIABILITY_FULL = 20;

// Velocity: bei ±300 Elo-Punkte 2-Jahres-Delta → ±max Bonus/Malus
const MAX_VELOCITY     = 300;
const VELOCITY_UP      =  0.10;  // max +10% pace bei Aufsteiger
const VELOCITY_DOWN    = -0.05;  // max −5%  pace bei Absteiger

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────

function loadF1DBResults() {
    console.log('  Lade F1DB_RESULTS aus index.html …');
    const html = fs.readFileSync(HTML_FILE, 'utf8');
    const line = html.split('\n').find(l => l.includes('const F1DB_RESULTS'));
    if (!line) throw new Error('F1DB_RESULTS nicht in index.html gefunden');
    const json = line.replace(/^\s*const F1DB_RESULTS\s*=\s*/, '').replace(/;\s*$/, '');
    return JSON.parse(json);
}

/** p-tes Perzentil eines Arrays (0–100). */
function percentile(arr, p) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx    = (p / 100) * (sorted.length - 1);
    const lo     = Math.floor(idx);
    const hi     = Math.ceil(idx);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function round1(v) { return Math.round(v * 10) / 10; }

/** Phase 3b – Alters-Multiplikator für Fahrerpace.
 *  Aufbau bis 29 (Potenz-Kurve), Zenit 29–32, Abbau 1.5 %/Jahr ab 32.
 *  Ohne Geburtsjahr → 1.0 (keine Einschränkung). */
function ageFactor(birthYear, raceYear) {
    if (!birthYear) return 1.0;
    const age = raceYear - birthYear;
    const PEAK_AGE   = 29;
    const PRIME_END  = 32;
    const DECLINE    = 0.015;   // 1.5 % pro Jahr nach 32
    if (age < PEAK_AGE)  return Math.pow(Math.max(0.5, age / PEAK_AGE), 0.4);
    if (age <= PRIME_END) return 1.0;
    return Math.max(0.5, 1.0 - DECLINE * (age - PRIME_END));
}

// ── DSQ-Overrides (identisch zu calculate-elo.js) ────────────────────────────
const DSQ_OVERRIDES = {
    389: { 'martin-brundle': { pos: 5  }, 'stefan-bellof':  { dnfType: 'tech'      } },
    390: { 'martin-brundle': { pos: 11 }, 'stefan-bellof':  { dnfType: 'tech'      } },
    391: { 'stefan-bellof':  { pos: 6  }, 'martin-brundle': { dnfType: 'tech'      } },
    392: { 'stefan-bellof':  { pos: 5  }, 'martin-brundle': { dnfType: 'tech'      } },
    393: { 'stefan-bellof':  { dnfType: 'tech'   }, 'martin-brundle': { pos: 10 }    },
    394: { 'stefan-bellof':  { pos: 3  }                                              },
    395: { 'stefan-bellof':  { dnfType: 'tech'   }, 'martin-brundle': { pos: 9  }    },
    396: { 'stefan-bellof':  { dnfType: 'driver' }, 'martin-brundle': { pos: 2  }    },
    397: { 'stefan-bellof':  { dnfType: 'driver' }                                   },
    398: { 'stefan-bellof':  { pos: 10 }, 'stefan-johansson': { dnfType: 'collision' } },
    399: { 'stefan-johansson': { dnfType: 'tech' }                                   },
    401: { 'stefan-bellof':  { pos: 10 }, 'stefan-johansson': { pos: 12 }            },
};

// ── Potential-Overrides: bekannte Ausnahmefälle ───────────────────────────────
// Nur für Fahrer bei denen peak_relElo strukturell unterschätzt wird:
//   - kurze Karriere vollständig in Backmarker-Auto (Daten können Talent nicht beweisen)
//   - historisch belegtes Ausnahmetalent aus anderen Quellen (WSPC, Rennsportruf etc.)
//
// Fallback-Empfehlung wenn dieser Override nicht ausreicht:
//   Velocity→Potential: 2-Jahres-Elo-Delta auch auf potential_pace anwenden
//   (hilft bei Rising Stars mit vorhandenen Elo-Daten, z.B. Senna 1984 Toleman)
const POTENTIAL_OVERRIDE = {
    'stefan-bellof':     85,  // Nürburgring-Rekord 1983, WSPC-Dominanz, Monaco 1984 P3 – Tyrrell zu schwach für Elo-Beweis
    'gilles-villeneuve': 93,  // stirbt 1982 im Ferrari; nie in echtem Titelfight-Auto trotz Weltklasseniveau
};

// ── 1. Daten laden ───────────────────────────────────────────────────────────

console.log('\nLade Daten …');
const f1db       = loadF1DBResults();
const eloRatings = JSON.parse(fs.readFileSync(ELO_FILE, 'utf8'));

// ── 2. Team-Zuordnung + Race-Count aus F1DB (1950+) ──────────────────────────

// teamByYear[year][slug]     = teamId (letzter Wert pro Saison – normalerweise konsistent)
// raceCountByYear[year][slug] = Anzahl tatsächlicher Rennteilnahmen (ohne DNQ/DNPQ)
const teamByYear      = {};
const raceCountByYear = {};

for (const [yearStr, rounds] of Object.entries(f1db)) {
    const year = String(yearStr);
    teamByYear[year]      = teamByYear[year]      || {};
    raceCountByYear[year] = raceCountByYear[year] || {};

    for (const [raceId, , entries] of rounds) {
        if (!Array.isArray(entries)) continue;
        for (const e of entries) {
            const posText = e[2];
            const slug    = e[3];
            const team    = e[4];
            if (!slug) continue;

            // DNQ/DNPQ: nicht qualifiziert → kein Team-Eintrag, kein Race-Count
            if (posText === 'DNPQ' || posText === 'DNQ') continue;

            teamByYear[year][slug] = team;

            // Race-Count nur für echte Startteilnahmen
            // DSQ: nur zählen wenn Override vorhanden (= tatsächlich gestartet, z.B. Tyrrell 1984)
            if (posText === 'DNS' || posText === 'EX') continue;
            if (posText === 'DSQ' && !(DSQ_OVERRIDES[raceId] || {})[slug]) continue;
            raceCountByYear[year][slug] = (raceCountByYear[year][slug] || 0) + 1;
        }
    }
}

// ── 3. Relatives Elo pro Jahr ────────────────────────────────────────────────

// relData[year][slug] = { driverElo, team, relElo }
const relData = {};

// 3a: driver_elo + team sammeln
for (const [slug, years] of Object.entries(eloRatings)) {
    for (const [year, vals] of Object.entries(years)) {
        relData[year] = relData[year] || {};
        relData[year][slug] = {
            driverElo: vals.driver_elo,
            team:      (teamByYear[year] || {})[slug] || null,
        };
    }
}

// 3b: relElo = driverElo − jahresfeld_avg
// Warum Jahresfeld statt Team-Avg:
//   - Pace ist fahrerintrinsisch, unabhängig vom Auto
//   - Team-Avg bestraft Fahrer mit starken Teamkollegen (Prost 1988 verliert gegen Senna → pace 73)
//   - Jahresfeld-Avg: Senna UND Prost sind beide weit über dem Schnitt → beide hohe pace
//   - Auto-Inflation durch gutes Team ist gering und wird durch Hard Cap (98) + carSpeed begrenzt
for (const [year, drivers] of Object.entries(relData)) {
    const allElos = Object.values(drivers).map(d => d.driverElo);
    const yearAvg = allElos.reduce((a, b) => a + b, 0) / allElos.length;
    for (const d of Object.values(drivers)) {
        d.relElo = d.driverElo - yearAvg;
    }
}

// ── 4. Globale Normalisierung (Perzentile 5% / 95%) ──────────────────────────
//
// Warum global statt pro Jahr:
//   - Verhindert künstliche Aufblähung schwächerer Jahrgänge
//   - relative_elo ist vergleichbar: +100 in 1954 = +100 in 2023
//   - Senna 1988 bekommt hohe Pace weil er global über dem Ø liegt, nicht weil
//     er in einem schwachen Feld fährt

const allRelElos = [];
for (const drivers of Object.values(relData)) {
    for (const d of Object.values(drivers)) {
        if (d.relElo !== undefined) allRelElos.push(d.relElo);
    }
}

const P5  = percentile(allRelElos, 5);
const P95 = percentile(allRelElos, 95);

console.log(`\nGlobale Normalisierung:`);
console.log(`  P5  = ${P5.toFixed(1)} rel-Elo → ${PACE_MIN} pace`);
console.log(`  P95 = ${P95.toFixed(1)} rel-Elo → ${PACE_MAX} pace`);
console.log(`  Jahresschnitt (rel=0) → ${round1(((0 - P5) / (P95 - P5)) * PACE_RANGE + PACE_MIN)} pace`);

function normalizeRelElo(relElo) {
    return clamp(((relElo - P5) / (P95 - P5)) * PACE_RANGE + PACE_MIN, PACE_MIN, PACE_MAX);
}

// Pace für "Durchschnittsfahrer" (rel=0) – Ankerpunkt für Reliability-Dämpfung
const AVG_PACE = normalizeRelElo(0);

// ── 5. Reliability-Dämpfung + Velocity-Bonus ─────────────────────────────────

// rawPace[year][slug] = pace nach Reliability (vor Velocity)
const rawPace = {};

for (const [year, drivers] of Object.entries(relData)) {
    rawPace[year] = {};
    for (const [slug, d] of Object.entries(drivers)) {
        if (d.relElo === undefined) continue;
        const eloPace    = normalizeRelElo(d.relElo);
        const races      = (raceCountByYear[year] || {})[slug] || 0;
        const reliability = Math.min(1.0, races / RELIABILITY_FULL);

        // Rookie (reliability < 1): zur Mitte hin gedämpft
        // Vollständig bewertet (reliability = 1): reines elo_pace
        rawPace[year][slug] = {
            pace:       eloPace * reliability + AVG_PACE * (1 - reliability),
            raceCount:  races,
        };
    }
}

// Velocity-Bonus: 2-Jahres-Delta im driver_elo
// Aufsteiger bekommen bis +10%, Absteiger bis −5%
// Gewichtet mit reliability (Rookie bekommt kaum Velocity-Bonus)
const finalPace = {};

for (const [year, drivers] of Object.entries(rawPace)) {
    finalPace[year] = {};
    const y = parseInt(year);

    for (const [slug, d] of Object.entries(drivers)) {
        const eloNow    = eloRatings[slug]?.[year]?.driver_elo;
        const eloMinus2 = eloRatings[slug]?.[String(y - 2)]?.driver_elo;

        let trendBonus = 0;
        if (eloNow && eloMinus2) {
            const velocity = eloNow - eloMinus2;
            trendBonus = clamp(velocity / MAX_VELOCITY, VELOCITY_DOWN, VELOCITY_UP);
        }

        const reliability = Math.min(1.0, d.raceCount / RELIABILITY_FULL);
        const withVelocity = d.pace + trendBonus * PACE_RANGE * reliability;

        finalPace[year][slug] = {
            pace:      round1(clamp(withVelocity, PACE_MIN, PACE_MAX)),
            raceCount: d.raceCount,
        };
    }
}

// ── 6. potential_pace = Option B: peak_relElo (Ø bester 3 Jahre) ─────────────
//
// Warum nicht career-max-pace:
//   - career-max-pace = Saisonschnitt, schlechtes Auto drückt gute Fahrer runter
//   - Bellof 1984 Monaco-P3 = Einzelrennen-Hochleistung → in peak_race_elo sichtbar
//   - Fangio ohne peak_relElo hätte zu niedrige potential wegen wenig Rennen
//
// Methode:
//   peak_relElo pro Jahr = peak_race_elo − Jahres-Ø(race_elo)
//   Smoothing: Ø der besten 3 Jahre (verhindert Einzelrennen-Spike)
//   Fahrer mit < 3 Jahren: alle Jahre gemittelt
//   Normalisierung: globale P5/P95 → 58–98

// Jahres-Ø der race_elo (für Relativierung)
const yearAvgRaceElo = {};
for (const [slug, years] of Object.entries(eloRatings)) {
    for (const [year, vals] of Object.entries(years)) {
        yearAvgRaceElo[year] = yearAvgRaceElo[year] || { sum: 0, n: 0 };
        yearAvgRaceElo[year].sum += vals.race_elo;
        yearAvgRaceElo[year].n   += 1;
    }
}
for (const y of Object.keys(yearAvgRaceElo)) {
    yearAvgRaceElo[y] = yearAvgRaceElo[y].sum / yearAvgRaceElo[y].n;
}

// Bester Ø aus Top-3-Jahren (peak_relElo) pro Fahrer
const careerPotentialRelElo = {};
for (const [slug, years] of Object.entries(eloRatings)) {
    const relPeaks = [];
    for (const [year, vals] of Object.entries(years)) {
        const peakElo = vals.peak_race_elo ?? vals.race_elo; // Fallback: race_elo wenn kein Peak
        const avgElo  = yearAvgRaceElo[year] ?? peakElo;
        relPeaks.push(peakElo - avgElo);
    }
    relPeaks.sort((a, b) => b - a);
    const top = relPeaks.slice(0, 3);
    careerPotentialRelElo[slug] = top.reduce((a, b) => a + b, 0) / top.length;
}

// Globale P5/P99 der career potential relElos
// P99 statt P95: nur absolute Top-Karrieren (Hamilton, Verstappen, Senna) erreichen 98.
// Mit P95 überschreiten zu viele Fahrer den Schwellenwert → alles clampt auf 98.
const allPotRelElos = Object.values(careerPotentialRelElo);
const POT_P5  = percentile(allPotRelElos, 5);
const POT_P95 = percentile(allPotRelElos, 99);

function normalizePotential(relElo) {
    return clamp(((relElo - POT_P5) / (POT_P95 - POT_P5)) * PACE_RANGE + PACE_MIN, PACE_MIN, PACE_MAX);
}


// Output wird nach Phase 3e + 3d gebaut (consistency muss zuerst gesetzt sein)

// ── 8. Phase 3e – Konstanz-Kennzahl ─────────────────────────────────────────
//
// Pro Fahrer pro Saison aus F1DB:
//   pos_stddev       = Stddev der Zielpositionen (DNF = letzter Platz + 1)
//   driver_fault_rate = (Spin + Kollisions-DNF) / Starts
//
// Kombination: 40% fault_rate + 60% pos_stddev → invertiert → Skala 58–98
// Höher = konsistenter. Berger 1988 = schnell aber niedrige Konstanz.

function classifyStatus(status) {
    if (!status || /^\+/.test(status)) return null; // Finisher
    if (/collision|contact|collided/i.test(status)) return 'collision';
    if (/^spun off$|^spin off$|^spin$|^spun$/i.test(status)) return 'driver';
    return 'tech'; // Engine, Gearbox, Accident etc. → neutral
}

// Saison-Stats pro Fahrer sammeln
const seasonStats = {}; // [slug][year] = { positions[], faults, starts }

for (const [yearStr, rounds] of Object.entries(f1db)) {
    for (const [raceId, , entries] of rounds) {
        // Anzahl Starter pro Rennen (für "letzter Platz + 1")
        const starters = entries.filter(e => e[2] !== 'DNQ' && e[2] !== 'DNPQ' && e[2] !== 'DNS').length;
        const dnfPos   = starters + 1;

        for (const e of entries) {
            const posText = e[2];
            const slug    = e[3];
            const pos     = e[1];
            const status  = (e[9] || '').toLowerCase();

            if (posText === 'DNQ' || posText === 'DNPQ' || posText === 'DNS') continue;
            // DSQ: nur zählen wenn Override vorhanden (= tatsächlich gestartet)
            const dsqOv = posText === 'DSQ' ? (DSQ_OVERRIDES[raceId] || {})[slug] : null;
            if (posText === 'DSQ' && !dsqOv) continue;

            seasonStats[slug]          = seasonStats[slug]          || {};
            seasonStats[slug][yearStr] = seasonStats[slug][yearStr] || { positions: [], gridPositions: [], faults: 0, starts: 0 };
            const st = seasonStats[slug][yearStr];
            st.starts++;

            // Grid-Position als Fallback für pos_stddev (e[11] = gridPositionNumber)
            const gridPos = e[11];
            if (gridPos != null && gridPos > 0) st.gridPositions.push(gridPos);

            if (dsqOv) {
                // Override: echte Position verwenden, DNFs NICHT in positions
                if (dsqOv.pos !== undefined) {
                    st.positions.push(dsqOv.pos);
                } else if (dsqOv.dnfType === 'driver' || dsqOv.dnfType === 'collision') {
                    st.faults++;  // Fahrerfehler → fault_rate, kein Eintrag in positions
                }
                // Tech-DNF-Override: kein Eintrag in positions, kein fault
            } else if (pos) {
                // Klassifizierte Zieleinfahrt → positions
                st.positions.push(pos);
            } else {
                // DNF: Tech → stilles Überspringen; Driver/Collision → fault_rate
                // pos_stddev bleibt unberührt (kein dnfPos mehr!)
                const type = classifyStatus(status);
                if (type === 'driver' || type === 'collision') st.faults++;
            }
        }
    }
}

function stddev(arr) {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
}

// Globale Perzentile für Normalisierung sammeln
const allFaultRates = [], allStddevs = [];
for (const years of Object.values(seasonStats)) {
    for (const [, st] of Object.entries(years)) {
        if (st.starts < 3) continue;
        const posArr = st.positions.length >= 3 ? st.positions
                     : st.gridPositions.length >= 3 ? st.gridPositions
                     : [];
        allFaultRates.push(st.faults / st.starts);
        if (posArr.length >= 3) allStddevs.push(stddev(posArr));
    }
}

const FR_P5  = percentile(allFaultRates, 5);
const FR_P95 = percentile(allFaultRates, 95);
const SD_P5  = percentile(allStddevs,   5);
const SD_P95 = percentile(allStddevs,  95);

// consistency: hohe fault_rate + hohe stddev = niedrige Konstanz → invertieren
function calcConsistency(faultRate, posStd) {
    const frNorm = clamp((faultRate - FR_P5) / (FR_P95 - FR_P5), 0, 1);
    const sdNorm = clamp((posStd    - SD_P5) / (SD_P95 - SD_P5), 0, 1);
    const raw    = frNorm * 0.4 + sdNorm * 0.6; // 0 = perfekt konsistent
    return Math.round((1 - raw) * PACE_RANGE + PACE_MIN); // 58–98
}

// In finalPace einmergen
for (const [year, drivers] of Object.entries(finalPace)) {
    for (const [slug, d] of Object.entries(drivers)) {
        const st = seasonStats[slug]?.[year];
        if (!st || d.raceCount < 5) {
            d.consistency = null;
            continue;
        }
        // pos_stddev: primär Zieleinfahrten, Fallback Grid-Positionen, sonst 0
        // Mindestens 3 Werte für aussagekräftigen stddev
        const posArr = st.positions.length >= 3 ? st.positions
                     : st.gridPositions.length >= 3 ? st.gridPositions
                     : [];
        const posStd = posArr.length >= 3 ? stddev(posArr) : 0;
        d.consistency = calcConsistency(st.faults / st.starts, posStd);
    }
}

// ── 7. Output aufbauen (nach Phase 3e, damit consistency gesetzt ist) ────────

const output = {};
for (const [slug, years] of Object.entries(eloRatings)) {
    const driverOut = {};
    for (const year of Object.keys(years)) {
        const d = finalPace[year]?.[slug];
        if (!d) continue;
        const potPace   = round1(normalizePotential(careerPotentialRelElo[slug] ?? 0));
        const potFinal  = round1(Math.max(d.pace, potPace, POTENTIAL_OVERRIDE[slug] ?? 0));
        // Age curve als Prior: viel Gewicht bei wenig Daten, null Gewicht bei ≥ RELIABILITY_FULL Rennen
        // → gut kalibrierte Fahrer (20+ Rennen) bleiben reines Elo; Rookies/wenige Rennen nähern sich Alterskurve an
        const ageF      = ageFactor(birthYears[slug], +year);
        const ageCap    = Math.max(PACE_MIN, potFinal * ageF);
        const ageWeight = Math.max(0, 1 - d.raceCount / RELIABILITY_FULL); // 0 = pure Elo, 1 = pure Alterskurve
        const curPace   = round1(d.pace - ageWeight * Math.max(0, d.pace - ageCap));
        driverOut[year] = {
            pace:           d.pace,
            current_pace:   curPace,
            potential_pace: potFinal,
            race_count:     d.raceCount,
            consistency:    d.consistency ?? null,
        };
    }
    if (Object.keys(driverOut).length > 0) output[slug] = driverOut;
}

// ── 8b. Phase 3d – carSpeed aus Team-Elo ────────────────────────────────────
//
// team_avg_elo = Ø driver_elo aller Fahrer die ≥ 2 Rennen für das Team fuhren
// Normalisierung: globale Perzentile 5%/95% → Skala 60–96 (= SEASON_DATA-Skala)
// Output: tests/carspeed_ratings.json { teamSlug: { year: carSpeed } }

const CS_MIN   = 60;
const CS_MAX   = 96;
const CS_RANGE = CS_MAX - CS_MIN;

// team_avg_elo[year][teamSlug] aufbauen
const teamEloByYear = {};

for (const [yearStr, drivers] of Object.entries(relData)) {
    // Welche Slugs haben dieses Jahr einen Team-Eintrag + race_count >= 2?
    const teamEntries = {};
    for (const [slug, d] of Object.entries(drivers)) {
        const rc   = (raceCountByYear[yearStr] || {})[slug] || 0;
        const team = (teamByYear[yearStr] || {})[slug];
        if (!team || rc < 2) continue;
        (teamEntries[team] = teamEntries[team] || []).push(d.driverElo);
    }
    teamEloByYear[yearStr] = {};
    for (const [team, elos] of Object.entries(teamEntries)) {
        // Max statt Avg: der beste Fahrer zeigt die Decke des Autos
        // Avg würde schwache Teamkollegen (Alboreto 1988) das Auto künstlich schlechtstellen
        teamEloByYear[yearStr][team] = Math.max(...elos);
    }
}

// Globale Perzentile über alle team_avg_elo-Werte
const allTeamElos = [];
for (const teams of Object.values(teamEloByYear)) {
    for (const v of Object.values(teams)) allTeamElos.push(v);
}
const CS_P5  = percentile(allTeamElos, 5);
const CS_P95 = percentile(allTeamElos, 95);

console.log(`\ncarSpeed-Normalisierung:`);
console.log(`  P5  = ${CS_P5.toFixed(1)} team-Elo → ${CS_MIN}`);
console.log(`  P95 = ${CS_P95.toFixed(1)} team-Elo → ${CS_MAX}`);

const carspeedOutput = {};
for (const [year, teams] of Object.entries(teamEloByYear)) {
    for (const [team, avgElo] of Object.entries(teams)) {
        const cs = Math.round(clamp(
            ((avgElo - CS_P5) / (CS_P95 - CS_P5)) * CS_RANGE + CS_MIN,
            CS_MIN, CS_MAX
        ));
        (carspeedOutput[team] = carspeedOutput[team] || {})[year] = cs;
    }
}

const CS_FILE = path.join(__dirname, 'carspeed_ratings.json');
fs.writeFileSync(CS_FILE, JSON.stringify(carspeedOutput, null, 2), 'utf8');
console.log(`✓ Fertig: ${Object.keys(carspeedOutput).length} Teams → tests/carspeed_ratings.json`);

// Phase 4b: carSpeed in output einbetten (zweiter Pass, da carspeedOutput erst hier fertig ist)
for (const [slug, years] of Object.entries(output)) {
    for (const [yearStr, d] of Object.entries(years)) {
        const team = (teamByYear[yearStr] || {})[slug];
        d.car_speed = team ? (carspeedOutput[team]?.[yearStr] ?? null) : null;
    }
}

// carSpeed-Validierung 1988 + 2002
const csChecks = [
    ['mclaren', '1988', 'McLaren 1988'],
    ['ferrari', '1988', 'Ferrari 1988'],
    ['benetton','1988', 'Benetton 1988'],
    ['ferrari', '2002', 'Ferrari 2002'],
    ['williams','2002', 'Williams 2002'],
    ['minardi', '2002', 'Minardi 2002'],
    ['williams','1992', 'Williams 1992'],
    ['red-bull',       '2023','Red Bull 2023'],
    ['mercedes','2019', 'Mercedes 2019'],
    ['alfa-romeo','1950','Alfa Romeo 1950'],
];
console.log('\nValidierung carSpeed:');
console.log('─'.repeat(40));
for (const [team, year, label] of csChecks) {
    const cs = carspeedOutput[team]?.[year];
    console.log(`  ${label.padEnd(22)} ${cs !== undefined ? cs : '← KEIN EINTRAG'}`);
}

// ── 9. Speichern pace_ratings ─────────────────────────────────────────────────

fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
console.log(`\n✓ Fertig: ${Object.keys(output).length} Fahrer → tests/pace_ratings.json`);

// ── 9. Validierungs-Bericht ──────────────────────────────────────────────────

const checks = [
    ['ayrton-senna',           '1988', 'Senna 1988 (Peak McLaren)'],
    ['ayrton-senna',           '1984', 'Senna 1984 (Toleman-Rookie)'],
    ['alain-prost',            '1988', 'Prost 1988 (McLaren)'],
    ['gerhard-berger',         '1988', 'Berger 1988 (Ferrari)'],
    ['michael-schumacher',     '1994', 'Schumacher 1994 (Peak)'],
    ['michael-schumacher',     '1991', 'Schumacher 1991 (Debut Jordan)'],
    ['rubens-barrichello',     '2002', 'Barrichello 2002 (Nr. 2 Ferrari)'],
    ['juan-manuel-fangio',     '1954', 'Fangio 1954 (Peak)'],
    ['nigel-mansell',          '1992', 'Mansell 1992 (Williams dominiert)'],
    ['fernando-alonso',        '2001', 'Alonso 2001 (Minardi)'],
    ['fernando-alonso',        '2005', 'Alonso 2005 (WM Renault)'],
    ['stefan-bellof',          '1984', 'Bellof 1984 (Tyrrell)'],
    ['max-verstappen',         '2023', 'Verstappen 2023 (dominiert)'],
    ['lewis-hamilton',         '2019', 'Hamilton 2019 (Peak)'],
    ['jim-clark',              '1965', 'Clark 1965 (dominiert)'],
    ['graham-hill',            '1965', 'Hill G. 1965'],
    ['romain-grosjean',        '2012', 'Grosjean 2012 (schnell+crashprone)'],
    ['romain-grosjean',        '2015', 'Grosjean 2015 (reifer)'],
    ['kimi-raikkonen',         '2003', 'Räikkönen 2003 (McLaren)'],
];

console.log('\nValidierung bekannter Fahrer:');
console.log('─'.repeat(70));
for (const [slug, year, label] of checks) {
    const d = output[slug]?.[year];
    if (d) {
        const pace = String(d.pace).padStart(4);
        const cur  = String(d.current_pace ?? '–').padStart(4);
        const pot  = String(d.potential_pace).padStart(4);
        const con  = String(d.consistency ?? '–').padStart(4);
        const cs   = String(d.car_speed ?? '–').padStart(4);
        const n    = String(d.race_count).padStart(2);
        console.log(`  ${label.padEnd(40)} pace=${pace}  cur=${cur}  pot=${pot}  con=${con}  cs=${cs}  n=${n}`);
    } else {
        console.log(`  ${label.padEnd(40)} ← KEIN EINTRAG`);
    }
}

// ── Kompakt-Export für HTML-Einbettung ───────────────────────────────────────
// Format: { slug: { year: [current_pace, potential_pace, consistency_or_-1, carSpeed_or_0] } }
// - Nur 1950+ (F1-Saisons)
// - Nur Fahrer die in F1DB vorkommen (race_count > 0 in mind. 1 Jahr)
// - [0] current_pace: Elo-Pace begrenzt durch Alterskurve (Phase 3b)
// - [1] potential_pace: Career-Peak (eingefroren)
// - [2] consistency: null → -1
// - [3] car_speed: Team-Elo-abgeleitet 60–96, unbekannt → 0

const compact = {};
for (const [slug, years] of Object.entries(output)) {
    const f1Years = Object.entries(years).filter(([y]) => +y >= 1950);
    if (f1Years.length === 0) continue;
    const hasRaces = f1Years.some(([, d]) => (d.race_count || 0) > 0);
    if (!hasRaces) continue;

    compact[slug] = {};
    for (const [year, d] of f1Years) {
        compact[slug][year] = [
            Math.round(d.current_pace ?? d.pace),
            Math.round(d.potential_pace),
            d.consistency !== null ? d.consistency : -1,
            d.car_speed  !== null ? Math.round(d.car_speed) : 0,
        ];
    }
}

const COMPACT_FILE = path.join(__dirname, 'pace_ratings_compact.js');
const compactJs = 'const PACE_RATINGS=' + JSON.stringify(compact) + ';';
fs.writeFileSync(COMPACT_FILE, compactJs, 'utf8');
const kb = (compactJs.length / 1024).toFixed(1);
console.log(`\n✓ Kompakt-Export: ${Object.keys(compact).length} Fahrer, ${kb} KB → tests/pace_ratings_compact.js`);
