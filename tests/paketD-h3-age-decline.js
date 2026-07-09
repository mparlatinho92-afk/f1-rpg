/**
 * paketD-h3-age-decline.js — Paket-D HOCH#3 (Alters-Decline historischer Fahrer zu schwach)
 *
 * BEFUND (Paket-D-Report): Historische Fahrer altern zu langsam. Lauf 2 hatte allein
 *   3 Titel im Bereich 38–41 (Schumacher 2007/2009/2010 mit 38/40/41). Real:
 *   - Ältester Weltmeister seit 1968: 39 (Graham Hill 1968, Mansell 1992)
 *   - 40+ = 0 Titel seit Fangio (46, 1957 – vor-moderner Sonderfall)
 *   - Titel-Wahrscheinlichkeit real: 23–31 Normalfall, 32–36 abnehmend, 37+ praktisch 0
 *
 * URSACHE (Code, ~L13724 startNewSeason Phase 4b): Für hist. Fahrer wird die Pace aus
 *   PACE_RATINGS[histId][year] gezogen. Jenseits des realen Karriere-Endes greift NUR ein
 *   Inaktivitäts-Decay (2.5–4.0/Jahr, gap-basiert) – KEINE altersbeschleunigte Obergrenze.
 *   Ein Fahrer der im Alt-Timeline seinen Sitz behält, altert damit viel zu langsam.
 *
 * Dieser Test misst die Champion-Alters-Verteilung als BASELINE (vor Fix) und als
 * Regressionsanker (nach Fix). Er ändert NICHTS am Code.
 *
 * Kernkennzahlen:
 *   - Anteil Champions ≥37 J.  (real ~3 %, 2 Fälle in 57 Jahren)  → Ziel ≤ ~5 %
 *   - Anteil Champions ≥40 J.  (real 0 % seit 1957)               → Ziel ~0 %
 *   - Alters-Verteilung (Ø / Median / Max) + Buckets
 *   - Aufschlüsselung real (histId) vs. generiert
 *
 * Verwendung: node tests/paketD-h3-age-decline.js [sims] [startYear] [seasons]
 *   default: 10 Sims, Start 2001, 15 Saisons  (reproduziert den Schumi-Befund)
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const { getContext } = require('./sim-core');

const N       = parseInt(process.argv[2]) || 10;
const START   = parseInt(process.argv[3]) || 2001;
const SEASONS = parseInt(process.argv[4]) || 15;
const END     = START + SEASONS - 1;
console.log(`\n═══ Paket-D HOCH#3 Alters-Decline | ${START}–${END} | ${N} Sims ═══\n`);

const ctx = getContext();

function simulateSeason(c) {
    const races = c.GAME_STATE.races;
    for (let i = 0; i < races.length; i++) {
        const rain = Math.random() < 0.15;
        try {
            if (c.simulateTraining) c.simulateTraining(i);
            c.simulateQualifying(i, rain);
            const r = c.simulateRace(i, rain);
            if (r) c.applyRaceResults(r);
        } catch (_) {}
    }
}
const isReal = d => d && d.histId && !/^(gen-|jw|reserve-)/.test(String(d.histId));

// gesammelte Champions: { year, name, age, real, pace }
const champs = [];
let okSims = 0, errSims = 0;

for (let sim = 0; sim < N; sim++) {
    try {
        ctx.initFromYear(START);
        for (let year = START; year <= END; year++) {
            simulateSeason(ctx);

            // WDC-Champion direkt nach der Saison (vor Karriere-Progression)
            const st = ctx.GAME_STATE.driverStandings || {};
            const topId = Object.entries(st)
                .map(([id, s]) => ({ id, points: s.points || 0 }))
                .sort((a, b) => b.points - a.points)[0];
            if (topId && topId.points > 0) {
                const drv = ctx.GAME_STATE.drivers.find(d => d.id === topId.id);
                if (drv && drv.birthYear) {
                    champs.push({
                        year, name: drv.name || drv.histId || '?',
                        age: year - drv.birthYear,
                        real: isReal(drv),
                        pace: Math.round(drv.currentPace || drv.pace || 0),
                    });
                }
            }

            if (year >= END) break;
            if (ctx.updateDriverCareerScores)     ctx.updateDriverCareerScores();
            if (ctx.updateDriverReputations)      ctx.updateDriverReputations();
            if (ctx.processDriverPaceDevelopment) ctx.processDriverPaceDevelopment();
            if (ctx.checkCareerEnds)              ctx.checkCareerEnds();
            if (ctx.initReservePool)              ctx.initReservePool(year + 1);
            if (ctx._injectNewSeasonDrivers)      ctx._injectNewSeasonDrivers(year + 1);
            if (ctx.processTeamChanges)           ctx.processTeamChanges();
            ctx.startNewSeason();
        }
        okSims++;
    } catch (e) { errSims++; if (errSims <= 3) console.log('  Fehler:', e.message); }
}

// ── Auswertung ──────────────────────────────────────────────────────────────
function stat(a) {
    if (!a.length) return null;
    const s = [...a].sort((x, y) => x - y);
    const sum = s.reduce((x, y) => x + y, 0);
    return { min: s[0], max: s[s.length - 1], avg: sum / s.length, median: s[Math.floor(s.length / 2)] };
}
const pct = (n, d) => d ? (n / d * 100).toFixed(1) + '%' : '–';

const ages   = champs.map(c => c.age);
const realA  = champs.filter(c => c.real).map(c => c.age);
const genA   = champs.filter(c => !c.real).map(c => c.age);
const aSt = stat(ages), rSt = stat(realA), gSt = stat(genA);
const T = champs.length;

const buckets = [
    ['≤25    ', c => c.age <= 25],
    ['26–31  ', c => c.age >= 26 && c.age <= 31],
    ['32–36  ', c => c.age >= 32 && c.age <= 36],
    ['37–39  ', c => c.age >= 37 && c.age <= 39],
    ['40+    ', c => c.age >= 40],
];

const n37 = champs.filter(c => c.age >= 37).length;
const n40 = champs.filter(c => c.age >= 40).length;

console.log(`${okSims}/${N} Sims ok. ${T} Champion-Saisons erfasst (${realA.length} real / ${genA.length} generiert).\n`);

console.log('── CHAMPION-ALTER (Ziel: Ø ~29, Max ≤39, kein 40+) ──');
console.log(`  Gesamt:     ${aSt ? `Ø ${aSt.avg.toFixed(1)} · Median ${aSt.median} · min ${aSt.min} · max ${aSt.max}` : '–'}`);
console.log(`  Real (hist):${rSt ? `Ø ${rSt.avg.toFixed(1)} · Median ${rSt.median} · min ${rSt.min} · max ${rSt.max}` : '–'}`);
console.log(`  Generiert:  ${gSt ? `Ø ${gSt.avg.toFixed(1)} · Median ${gSt.median} · min ${gSt.min} · max ${gSt.max}` : '–'}`);

console.log('\n── ALTERS-BUCKETS ──');
for (const [label, fn] of buckets) {
    const all = champs.filter(fn).length;
    const rr  = champs.filter(c => fn(c) && c.real).length;
    console.log(`  ${label} ${String(all).padStart(3)}  (${pct(all, T).padStart(6)})   davon real: ${rr}`);
}

console.log('\n── KRITISCHE ANKER (real seit 1968) ──');
console.log(`  ≥37 J.: ${n37}  (${pct(n37, T)})   ← real ~3 % (2 Fälle/57 J.)  Ziel ≤ ~5 %`);
console.log(`  ≥40 J.: ${n40}  (${pct(n40, T)})   ← real 0 % seit 1957        Ziel ~0 %`);

// Konkrete Alt-Champions (≥37) auflisten – die "Schumi-40/41"-Fälle
const old = champs.filter(c => c.age >= 37).sort((a, b) => b.age - a.age);
if (old.length) {
    console.log('\n── ÜBERALTERTE CHAMPIONS (≥37, Report-Analogon) ──');
    old.slice(0, 20).forEach(c => {
        console.log(`  ${c.year}  ${c.name.padEnd(22)} ${c.age}J  ${c.real ? 'REAL' : 'gen '}  Pace ${c.pace}`);
    });
    if (old.length > 20) console.log(`  … +${old.length - 20} weitere`);
}
console.log();
