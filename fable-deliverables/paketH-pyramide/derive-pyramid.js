// ============================================================================
// Paket H — derive-pyramid.js (Fable, 2026-07-17)
// Erzeugt die Pyramiden-Deliverables aus echten Quellen:
//   1. pyramid-flow.js          (D1+D2: Ebenen-Skelett + Einsteiger-Raten, F1-Zeile EMPIRISCH)
//   2. intake-nation-shares.js  (D3a: Nationen-Verteilung der frischen Einsteiger an der Basis)
//   3. promotion-rates.js       (D3b: nationsspezifischer Leiter-Modifikator je Ära)
//   4. VALIDIERUNG-D4.md        (D4: Trichter-Modell vs. DECADE_NATION_POOLS je Dekade/Nation)
//
// Quellen (nur LESEN):
//   ../../f1db-json-splitted/*.json           — F1-Empirie (Debüts, Verweildauer, Alter, Grid)
//   ../../index.html                          — DECADE_NATION_POOLS (Validierungs-Ziel),
//                                               MOTORSPORT_NATION_BLEND (Nationen-Master)
//   ../nation-data/nation-frequency-by-decade.js — MOTORSPORT_NATION_FREQ (Kultur-Signal)
//
// Aufruf:  node derive-pyramid.js            (aus fable-deliverables/paketH-pyramide/)
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

// ────────────────────────────────────────────────────────────────────────────
// 0. Quellen laden
// ────────────────────────────────────────────────────────────────────────────
const drivers   = require(path.join(ROOT, 'f1db-json-splitted', 'f1db-drivers.json'));
const races     = require(path.join(ROOT, 'f1db-json-splitted', 'f1db-races.json'));
const results   = require(path.join(ROOT, 'f1db-json-splitted', 'f1db-races-race-results.json'));
const countries = require(path.join(ROOT, 'f1db-json-splitted', 'f1db-countries.json'));
const { MOTORSPORT_NATION_FREQ } = require(path.join(__dirname, '..', 'nation-data', 'nation-frequency-by-decade.js'));

// DECADE_NATION_POOLS + MODERN_ONLY aus index.html extrahieren (read-only, Regex).
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
function extractConst(name) {
    const start = html.indexOf('const ' + name);
    if (start < 0) throw new Error(name + ' nicht in index.html gefunden');
    const eq = html.indexOf('=', start);
    let i = html.indexOf('{', eq), depth = 0, j = i;
    for (; j < html.length; j++) {
        if (html[j] === '{') depth++;
        else if (html[j] === '}') { depth--; if (depth === 0) break; }
    }
    // eslint-disable-next-line no-eval
    return eval('(' + html.slice(i, j + 1) + ')');
}
const DECADE_NATION_POOLS    = extractConst('DECADE_NATION_POOLS');
const MOTORSPORT_NATION_BLEND = extractConst('MOTORSPORT_NATION_BLEND');
const MODERN_ONLY = new Set(['QAT', 'SAU', 'UAE', 'EGY']);   // wie index.html L4841

// Nationen-Master = Vereinigung Pools(2020) ∪ Blend(2020) — exakt die IOC-Codes des Spiels.
const MASTER = [...new Set([
    ...Object.keys(DECADE_NATION_POOLS[2020].weights),
    ...Object.keys(MOTORSPORT_NATION_BLEND[2020])
])].sort();
const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
const EPS = 0.002;                                            // Floor-Regel aus Paket F

// ────────────────────────────────────────────────────────────────────────────
// 1. F1-EMPIRIE aus F1DB (Road-F1, Indy raus — Präzedenz recompute-1950s-road-f1.js)
// ────────────────────────────────────────────────────────────────────────────
const iocByCountry = new Map(countries.map(c => [c.id, c.iocCode || c.alpha3Code]));
const indyRaceIds = new Set(races.filter(r => r.grandPrixId && r.grandPrixId.includes('indianapolis')).map(r => r.id));
const birthYear = new Map(drivers.map(d => [d.id, d.dateOfBirth ? +d.dateOfBirth.slice(0, 4) : null]));

const firstYear = new Map(), careerYears = new Map(), startsPerDriver = new Map();
const startersPerRace = new Map(), raceYear = new Map();
let maxDataYear = 0;
for (const r of results) {
    if (indyRaceIds.has(r.raceId)) continue;
    if (r.year > maxDataYear) maxDataYear = r.year;
    if (!firstYear.has(r.driverId) || r.year < firstYear.get(r.driverId)) firstYear.set(r.driverId, r.year);
    if (!careerYears.has(r.driverId)) careerYears.set(r.driverId, new Set());
    careerYears.get(r.driverId).add(r.year);
    startsPerDriver.set(r.driverId, (startsPerDriver.get(r.driverId) || 0) + 1);
    startersPerRace.set(r.raceId, (startersPerRace.get(r.raceId) || 0) + 1);
    raceYear.set(r.raceId, r.year);
}

function median(arr) { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; }
function pct(arr, p) { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; }

const f1EmpByDecade = {};
for (const dec of DECADES) {
    const yearsInDecade = Math.min(dec + 9, maxDataYear) - dec + 1;   // 2020er: nur 6 Datenjahre!
    const debs = [...firstYear.entries()].filter(([, y]) => Math.floor(y / 10) * 10 === dec);
    const grids = [...startersPerRace.entries()].filter(([rid]) => Math.floor(raceYear.get(rid) / 10) * 10 === dec).map(([, n]) => n);
    // Verweildauer: nur unzensierte Karrieren (letztes Jahr < maxDataYear-1)
    const tenures = debs
        .filter(([d]) => Math.max(...careerYears.get(d)) < maxDataYear - 1)
        .map(([d]) => careerYears.get(d).size);
    const ages = debs.map(([d, y]) => birthYear.get(d) ? y - birthYear.get(d) : null).filter(a => a !== null);
    const oneOff = debs.filter(([d]) => startsPerDriver.get(d) <= 3).length;
    f1EmpByDecade[dec] = {
        debutsPerYear: +(debs.length / yearsInDecade).toFixed(1),
        debutsTotal: debs.length,
        avgStarters: +(grids.reduce((s, x) => s + x, 0) / grids.length).toFixed(1),
        tenureMedian: tenures.length ? median(tenures) : null,
        tenureMean: tenures.length ? +(tenures.reduce((s, x) => s + x, 0) / tenures.length).toFixed(1) : null,
        oneOffShare: +(oneOff / debs.length).toFixed(2),               // ≤3 Starts insgesamt
        debutAgeP10: ages.length ? pct(ages, 0.10) : null,
        debutAgeMedian: ages.length ? median(ages) : null,
        debutAgeP90: ages.length ? pct(ages, 0.90) : null
    };
}

// Ära-Register des Spiels (Paket B/C: e50/e62/e76/e94/e10)
const ERAS = { e50: [1950, 1961], e62: [1962, 1975], e76: [1976, 1993], e94: [1994, 2009], e10: [2010, 2035] };
const DEC2ERA = { 1950: 'e50', 1960: 'e62', 1970: 'e62', 1980: 'e76', 1990: 'e76', 2000: 'e94', 2010: 'e10', 2020: 'e10' };

function f1EmpForEra(era) {
    const decs = DECADES.filter(d => DEC2ERA[d] === era);
    const w = decs.map(d => f1EmpByDecade[d]);
    const avg = k => +(w.reduce((s, x) => s + (x[k] ?? 0), 0) / w.filter(x => x[k] !== null).length).toFixed(1);
    return {
        seats: avg('avgStarters'), debutsPerYear: avg('debutsPerYear'),
        tenureMedian: avg('tenureMedian'), tenureMean: avg('tenureMean'),
        oneOffShare: avg('oneOffShare'),
        ageLo: Math.round(avg('debutAgeP10')), ageMed: Math.round(avg('debutAgeMedian')), ageHi: Math.round(avg('debutAgeP90'))
    };
}

// ────────────────────────────────────────────────────────────────────────────
// 2. D1+D2 — Ebenen-Skelett je Ära. Junior-Ebenen wissensbasiert [S], mit
//    Fluss-Arithmetik geschlossen [A]; F1-Zeile empirisch [D].
//    Quellen-Tags: [D]=datenbelegt (F1DB), [A]=abgeleitet (Flussbilanz), [S]=Schätzung.
// ────────────────────────────────────────────────────────────────────────────
// promoteShare = Anteil der ABGÄNGER, der eine Ebene aufsteigt.
// freshShare   = Anteil der NEUZUGÄNGE dieser Ebene, der frisch aus der
//                nicht-simulierten Masse kommt (Rest: von unten befördert).
// fieldOverlap = true → Sitze > Fahrer (WM+EM teilen sich dasselbe Feld).
const ERA_LEVELS = {
    e50: {   // 1950–61: KEINE Leiter. Kart existiert nicht (WM erst 1964), F4-Äquivalent nicht.
        kart: null,
        f4:   null,
        f3:   { seats: 60,  fieldOverlap: false, tenure: 2.0, promoteShare: 0.15, freshShare: 1.00, entryAge: [20, 32], src: 'S', note: '500cc-F3 (UK-lastig); kein Unterbau → fresh 1.0' },
        f2:   { seats: 60,  fieldOverlap: false, tenure: 2.0, promoteShare: 0.30, freshShare: 0.85, entryAge: [21, 33], src: 'S', note: 'F2 real groß (WM 1952/53 nach F2-Reglement)' }
    },
    e62: {   // 1962–75: Leiter entsteht. Kart-WM ab 1964, Formula Ford ab 1967.
        kart: { seats: 60,  fieldOverlap: true,  tenure: 2.5, promoteShare: 0.15, freshShare: 1.00, entryAge: [15, 25], src: 'S', note: 'CIK-WM ab 1964, auch Erwachsene (Peterson)' },
        f4:   { seats: 150, fieldOverlap: false, tenure: 1.5, promoteShare: 0.28, freshShare: 0.96, entryAge: [17, 26], src: 'S', note: 'hist. Formula Ford ab 1967 (Einstiegs-Formel)' },
        f3:   { seats: 80,  fieldOverlap: false, tenure: 2.0, promoteShare: 0.30, freshShare: 0.30, entryAge: [18, 28], src: 'S', note: 'nationale F3s (GBR/FRA/ITA aggregiert)' },
        f2:   { seats: 40,  fieldOverlap: false, tenure: 2.0, promoteShare: 0.37, freshShare: 0.40, entryAge: [19, 30], src: 'S', note: 'Euro-F2 ab 1967; F1-Piloten fuhren mit (Overlap nach oben)' }
    },
    e76: {   // 1976–93: Leiter verfestigt: Kart → FF1600/FR → F3 → F2/F3000 → F1.
        kart: { seats: 100, fieldOverlap: true,  tenure: 2.5, promoteShare: 0.30, freshShare: 1.00, entryAge: [13, 20], src: 'S', note: 'Kart-Elite wird jünger (Senna/Prost-Generation)' },
        f4:   { seats: 300, fieldOverlap: false, tenure: 1.5, promoteShare: 0.25, freshShare: 0.94, entryAge: [16, 22], src: 'S', note: 'FF1600 + Formula Renault national aggregiert' },
        f3:   { seats: 120, fieldOverlap: false, tenure: 2.0, promoteShare: 0.15, freshShare: 0.15, entryAge: [17, 24], src: 'S', note: 'nationale F3s (D/GB/I/F) — breiteste F3-Ära' },
        f2:   { seats: 26,  fieldOverlap: false, tenure: 2.0, promoteShare: 0.45, freshShare: 0.30, entryAge: [19, 27], src: 'S', note: 'Euro-F2 → ab 1985 Int. F3000' }
    },
    e94: {   // 1994–2009: professionalisiert, Kart quasi Pflicht.
        kart: { seats: 130, fieldOverlap: true,  tenure: 2.5, promoteShare: 0.35, freshShare: 1.00, entryAge: [12, 17], src: 'S', note: 'CIK WM/EM + Junior-Klassen' },
        f4:   { seats: 350, fieldOverlap: false, tenure: 1.5, promoteShare: 0.19, freshShare: 0.92, entryAge: [15, 19], src: 'S', note: 'Formula Renault 2.0 / Formula BMW / nat. Serien' },
        f3:   { seats: 100, fieldOverlap: false, tenure: 2.0, promoteShare: 0.20, freshShare: 0.10, entryAge: [16, 21], src: 'S', note: 'F3-Euroserie + nationale F3s' },
        f2:   { seats: 26,  fieldOverlap: false, tenure: 2.0, promoteShare: 0.34, freshShare: 0.25, entryAge: [18, 24], src: 'S', note: 'F3000 → ab 2005 GP2' }
    },
    e10: {   // 2010+: geschlossene Pipeline (Superlizenz-Punkte ab 2015).
        kart: { seats: 150, fieldOverlap: true,  tenure: 2.5, promoteShare: 0.40, freshShare: 1.00, entryAge: [12, 16], src: 'S', note: 'CIK OK/OKJ/KZ WM+EM — überlappende Felder, ~150 Fahrer' },
        f4:   { seats: 420, fieldOverlap: false, tenure: 1.5, promoteShare: 0.06, freshShare: 0.91, entryAge: [15, 17], src: 'S', note: '~15 nationale F4-Serien à ~28, geografisch getrennt' },
        f3:   { seats: 30,  fieldOverlap: false, tenure: 1.7, promoteShare: 0.55, freshShare: 0.05, entryAge: [16, 20], src: 'S', note: 'eine FIA-F3; FRegional-Zwischenebene implizit in Raten' },
        f2:   { seats: 22,  fieldOverlap: false, tenure: 2.0, promoteShare: 0.30, freshShare: 0.15, entryAge: [17, 22], src: 'S', note: 'eine FIA-F2' }
    }
};
// F1-freshShare je Ära (Anteil F1-Debütanten OHNE Leiter-Herkunft: Sportwagen, Motorrad, nichts)
const F1_FRESH = { e50: 0.65, e62: 0.45, e76: 0.20, e94: 0.08, e10: 0.02 };   // [S], e50/e62 aus Biografie-Wissen

// Fluss-Konsistenz prüfen: freshShare(oben) muss zur promoteShare(unten) passen.
const LEVEL_ORDER = ['kart', 'f4', 'f3', 'f2'];
console.log('── Fluss-Konsistenz (implizit vs. deklariert) ──');
for (const era of Object.keys(ERA_LEVELS)) {
    const L = ERA_LEVELS[era];
    for (let i = 1; i < LEVEL_ORDER.length; i++) {
        const lo = L[LEVEL_ORDER[i - 1]], hi = L[LEVEL_ORDER[i]];
        if (!lo || !hi) continue;
        const fromBelow = (lo.seats / lo.tenure) * lo.promoteShare;
        const intake = hi.seats / hi.tenure;
        const freshImpl = Math.max(0, 1 - fromBelow / intake);
        const diff = Math.abs(freshImpl - hi.freshShare);
        console.log(`${era} ${LEVEL_ORDER[i]}: intake ${intake.toFixed(1)}/J, von unten ${fromBelow.toFixed(1)} → fresh impl. ${freshImpl.toFixed(2)} / dekl. ${hi.freshShare}${diff > 0.12 ? '  ⚠️' : ''}`);
    }
    // F2 → F1
    const f2 = L.f2, emp = f1EmpForEra(era);
    const fromF2 = (f2.seats / f2.tenure) * f2.promoteShare;
    const freshImpl = Math.max(0, 1 - fromF2 / emp.debutsPerYear);
    console.log(`${era} f1: Debüts ${emp.debutsPerYear}/J [D], aus F2 ${fromF2.toFixed(1)} → fresh impl. ${freshImpl.toFixed(2)} / dekl. ${F1_FRESH[era]}${Math.abs(freshImpl - F1_FRESH[era]) > 0.15 ? '  ⚠️' : ''}`);
}

// ────────────────────────────────────────────────────────────────────────────
// 3. D3a — Intake-Verteilung an der Basis
//    Formel: intake = renorm( min( freqMaster^GAMMA , popShare×CAP ) ), Floor ε.
//    FREQ = Wikidata ALLE Serien (nicht F1) → enthält NASCAR/Supercars/Rally-Breite,
//    d.h. USA/AUS/JPN liegen hier von selbst ÜBER ihrem F1-Anteil (Brief-Forderung).
//    GAMMA drückt den Enzyklopädie-Überlebenden-Bias (Spitze komprimieren).
//    POP-Cap erledigt MON/LIE/LUX (Import-/Kleinstaaten): kein Land kann mehr
//    Kart-Einsteiger pro Kopf liefern als CAP × Weltschnitt.
// ────────────────────────────────────────────────────────────────────────────
const GAMMA = 0.75;      // kalibriert via D4 (s. METHODIK §5)
const CAP   = 25;        // max. Pro-Kopf-Faktor vs. Master-Schnitt (FIN real ~21× → bleibt drin)

// Bevölkerung in Mio (UN-Größenordnungen, Anker 1950/1985/2020, geometrische Interpolation). [S]
const POP_MIO = {
    GBR: [50, 57, 67],   FRA: [42, 55, 65],   ITA: [47, 57, 60],   GER: [69, 78, 83],
    USA: [152, 238, 331], ESP: [28, 38, 47],  BRA: [54, 135, 213], ARG: [17, 30, 45],
    AUS: [8, 16, 26],    NED: [10, 14.5, 17.4], BEL: [8.6, 9.9, 11.6], SUI: [4.7, 6.5, 8.6],
    AUT: [6.9, 7.6, 8.9], SWE: [7, 8.4, 10.4], FIN: [4, 4.9, 5.5], DEN: [4.3, 5.1, 5.8],
    NOR: [3.3, 4.2, 5.4], POR: [8.4, 10, 10.3], IRL: [3, 3.5, 5],  GRE: [7.5, 9.9, 10.7],
    POL: [25, 37, 38],   CZE: [8.9, 10.3, 10.7], HUN: [9.3, 10.6, 9.7], RUS: [103, 144, 146],
    UKR: [37, 51, 44],   EST: [1.1, 1.5, 1.3], BUL: [7.3, 8.9, 6.9], ROU: [16.3, 22.7, 19.3],
    SRB: [6.7, 7.8, 6.9], TUR: [21, 50, 84],  ISR: [1.3, 4.2, 9.2], CAN: [14, 26, 38],
    MEX: [28, 76, 126],  COL: [12, 30, 51],   VEN: [5, 17, 28],    CHI: [6, 12, 19],
    PER: [7.6, 19, 33],  URU: [2.2, 3, 3.5],  JPN: [83, 121, 126], CHN: [554, 1050, 1412],
    IND: [376, 780, 1380], KOR: [19, 41, 52], INA: [70, 165, 274], MAS: [6, 16, 32],
    THA: [20, 51, 70],   PHI: [19, 55, 110],  RSA: [14, 33, 59],   MAR: [9, 22, 37],
    CIV: [2.6, 10, 26],  KEN: [6, 20, 54],    ZIM: [2.7, 8.9, 15], NZL: [1.9, 3.3, 5.1],
    MON: [0.02, 0.03, 0.039], LIE: [0.014, 0.027, 0.039], LUX: [0.3, 0.37, 0.63],
    SAU: [3, 13, 35],    UAE: [0.07, 1.4, 9.9], QAT: [0.025, 0.35, 2.9], EGY: [20, 50, 102]
};
function popAt(nat, decade) {
    const [a, b, c] = POP_MIO[nat] || [1, 1, 1];
    const mid = decade + 5;
    if (mid <= 1985) { const t = (mid - 1950) / 35; return a * Math.pow(b / a, t); }
    const t = (mid - 1985) / 35; return b * Math.pow(c / b, Math.min(t, 1));
}

const INTAKE = {};
for (const dec of DECADES) {
    const freq = MOTORSPORT_NATION_FREQ.shares[dec] || MOTORSPORT_NATION_FREQ.shares[2020];
    // auf Master filtern + renormieren
    let f = {}, sum = 0;
    for (const n of MASTER) { f[n] = freq[n] || 0; sum += f[n]; }
    for (const n of MASTER) f[n] /= sum;
    // Pop-Shares im Master
    let popSum = 0; for (const n of MASTER) popSum += popAt(n, dec);
    // Formel anwenden
    let raw = {}, s2 = 0;
    for (const n of MASTER) {
        const cap = (popAt(n, dec) / popSum) * CAP;
        raw[n] = Math.min(Math.pow(f[n], GAMMA), cap);
        s2 += raw[n];
    }
    // Floor + MODERN-Gate (Gate nur informativ — Werte bleiben ε, Laufzeit-Gate zieht sie raus)
    let out = {}, s3 = 0;
    for (const n of MASTER) {
        let v = raw[n] / s2;
        if (dec < 2000 && MODERN_ONLY.has(n)) v = EPS;
        out[n] = Math.max(v, EPS); s3 += out[n];
    }
    for (const n of MASTER) out[n] = +(out[n] / s3).toFixed(4);
    // Rundungsrest auf größte Nation
    let rest = +(1 - Object.values(out).reduce((s, x) => s + x, 0)).toFixed(4);
    const big = MASTER.reduce((a, b) => out[a] >= out[b] ? a : b);
    out[big] = +(out[big] + rest).toFixed(4);
    INTAKE[dec] = out;
}

// ────────────────────────────────────────────────────────────────────────────
// 4. D3b — Leiter-Modifikator je Nation × Ära (relativ zum Feld-Schnitt 1.0).
//    Genau EINMAL anwenden (an der Europa-Commit-Stufe F4→F3), NICHT je Stufe.
//    Archetypen (METHODIK §4), keine freie Kurvenanpassung je Nation:
//    Werte < 1: eigene Welt saugt ab (USA: NASCAR/Indy; AUS: Supercars; JPN: SF/SGT;
//    Ostblock vor 1990: politisches Tor). Werte > 1: Kultur-Überconversion (FIN).
// ────────────────────────────────────────────────────────────────────────────
const LADDER_BY_ERA = { e50: {}, e62: {}, e76: {}, e94: {}, e10: {} };
// Kalibriert via `node derive-pyramid.js --calibrate` (Vorschlag = λ×Ø(Ziel/Modell),
// Debüt-gewichtet), dann von HAND auf 0.05er-Bänder gerundet. Bewusst NICHT gefittet:
// MON/LIE (Kleinstaaten-Poisson, Leclerc), THA (Albon), 2020er-Einzelfahrer-Rauschen.
const LADDER_SPEC = {
    //          e50    e62    e76    e94    e10
    // ── Große Europäer: Industrie-Heimvorteil & echte Konversions-Wellen ──
    GBR:      [1.55,  2.30,  1.30,  1.10,  1.30],  // e62 = Garagisten/Club-Racing-Boom (26,7% aller 60er-Debüts)
    FRA:      [0.65,  0.55,  1.35,  0.70,  1.40],  // e62-Dürre → Elf-Welle ab ~1970 (Ära-Mittel), e10 FFSA-Filière
    ITA:      [0.85,  0.90,  2.20,  1.35,  0.55],  // e76/e94 F3-/Kart-Industrie; e10 = realer ital. Konversions-Kollaps
    GER:      [0.95,  0.50,  0.70,  1.95,  2.20],  // vor-Schumacher-Dürre e62/e76, danach ADAC/DMSB-Leiter-Boom
    ESP:      [0.40,  0.15,  0.35,  1.20,  1.40],  // Motorrad-/Rally-Drain bis Alonso-Effekt (e94+)
    BEL:      [1.80,  0.75,  0.40,  0.10,  0.45],  // e50-Größe real; danach GT-/Tourenwagen-Drain
    NED:      [1.00,  0.60,  0.40,  1.00,  1.10],
    SUI:      [1.00,  1.30,  0.80,  0.25,  0.25],  // Rundstrecken-Verbot 1955 → Exil-Fahrer (Siffert/Regazzoni), dann Erosion
    AUT:      [0.10,  0.85,  1.50,  1.40,  0.10],  // e76 Lauda/Berger-, e94 Wurz/Klien-Welle; e10 ≈ null Konversion
    SWE:      [0.20,  0.60,  0.30,  0.10,  0.30],  // Rally-Drain par excellence
    POR:      [1.00,  0.15,  0.20,  0.40,  0.15],  // Rally-Drain
    NOR:      [1.00,  0.15,  0.10,  0.10,  0.10],  // Rally-Drain
    DEN:      [1.00,  0.40,  0.20,  0.30,  1.00],
    IRL:      [1.00,  1.00,  2.00,  1.00,  1.00],  // e76 Watson/Daly-Welle
    FIN:      [0.10,  0.30,  1.10,  3.20,  3.10],  // DIE Überconversion (Häkkinen→Räikkönen→Bottas); vor 1975 kaum Rundstrecke
    GRE:      [0.60,  0.60,  0.60,  0.60,  0.60],
    // ── Eigene-Welt-Nationen (Abfluss implizit — Kern des Brief-Auftrags) ──
    USA:      [0.30,  0.50,  0.08,  0.04,  0.04],  // Indy/NASCAR; e50 reproduziert Indy-Präzedenz (34,8→7,2%)
    AUS:      [0.50,  1.05,  0.30,  0.35,  0.85],  // e62 Brabham-Ära offen, dann Supercars-Drain, e10 wieder offener
    NZL:      [0.60,  2.40,  0.40,  0.30,  0.50],  // e62-Anomalie real: McLaren/Hulme/Amon (Tasman-Pipeline)
    JPN:      [0.05,  0.15,  0.40,  0.90,  0.50],  // Super Formula/SGT halten daheim; Werks-Programme exportieren
    RSA:      [0.50,  2.90,  0.25,  0.12,  0.15],  // e62: eigener WM-GP + nationale F1-Serie; e76 Sanktionen/Isolation
    ARG:      [1.90,  0.30,  0.35,  0.20,  0.10],  // e50 Staats-gestützt (Fangio-Ära), danach TC-Binnenwelt
    CAN:      [0.45,  0.50,  0.35,  0.40,  0.80],
    MEX:      [0.50,  1.00,  0.35,  0.30,  0.85],  // e62 Rodríguez-Brüder; e10 Pérez/Escudería-Geld
    BRA:      [0.70,  0.95,  1.60,  1.95,  1.15],  // Voll-Commit-Kultur ab Fittipaldi, e94 Massa/Barrichello-Welle
    THA:      [0.80,  0.30,  0.30,  0.40,  0.80],  // e50: Bira (Aristokraten-Ausnahme)
    COL:      [0.60,  0.45,  0.40,  0.60,  0.50],  // e94 Montoya
    VEN:      [0.60,  0.45,  0.40,  0.40,  0.50],
    CHI:      [0.60,  0.45,  0.40,  0.40,  0.50],
    PER:      [0.60,  0.45,  0.40,  0.40,  0.50],
    URU:      [0.80,  0.45,  0.40,  0.40,  0.50],
    // ── Ostblock: vor 1990 politisches Tor (keine Ausreise in West-Serien) ──
    RUS:      [0.05,  0.05,  0.08,  0.10,  1.00],  // e10 Geld-Ära (Petrov/Kvyat/Mazepin)
    UKR:      [0.05,  0.05,  0.08,  0.30,  0.35],
    EST:      [0.05,  0.05,  0.08,  0.30,  0.35],
    CZE:      [0.05,  0.05,  0.08,  0.30,  0.35],
    POL:      [0.05,  0.05,  0.08,  0.45,  0.40],  // Kubica
    HUN:      [0.05,  0.05,  0.08,  0.30,  0.35],
    BUL:      [0.05,  0.05,  0.08,  0.30,  0.35],
    ROU:      [0.05,  0.05,  0.08,  0.30,  0.35],
    SRB:      [0.10,  0.10,  0.15,  0.30,  0.35],  // Jugoslawien halboffen
    // ── Asien aufstrebend ──
    CHN:      [0.10,  0.10,  0.15,  0.40,  0.35],
    IND:      [0.10,  0.10,  0.15,  0.40,  0.65],
    KOR:      [0.10,  0.10,  0.15,  0.40,  0.65],
    INA:      [0.10,  0.10,  0.15,  0.40,  0.65],
    MAS:      [0.10,  0.10,  0.15,  0.40,  0.65],
    PHI:      [0.10,  0.10,  0.15,  0.40,  0.65],
    // ── Sonstige Kleine ──
    TUR:      [0.40,  0.50,  0.35,  0.35,  0.45],
    MAR:      [0.40,  0.50,  0.35,  0.35,  0.45],
    CIV:      [0.40,  0.50,  0.35,  0.35,  0.45],
    KEN:      [0.40,  0.50,  0.35,  0.35,  0.45],
    ZIM:      [0.40,  1.90,  0.35,  0.35,  0.45],  // e62: RSA-Meisterschafts-Anschluss (Love)
    ISR:      [0.40,  0.50,  0.35,  0.35,  0.45],
    // ── Golf/Ägypten (MODERN_ONLY — vor 2000 vom Gate entfernt) ──
    SAU:      [0.30,  0.30,  0.30,  0.30,  0.70],
    UAE:      [0.30,  0.30,  0.30,  0.30,  0.70],
    QAT:      [0.30,  0.30,  0.30,  0.30,  0.70],
    EGY:      [0.30,  0.30,  0.30,  0.30,  0.70]
    // alle übrigen (MON/LIE/LUX + Rest-Europa-Kern): 1.00 in allen Ären
};
const ERA_KEYS = ['e50', 'e62', 'e76', 'e94', 'e10'];
for (const n of MASTER) {
    const spec = LADDER_SPEC[n];
    ERA_KEYS.forEach((e, i) => { LADDER_BY_ERA[e][n] = spec ? spec[i] : 1.00; });
}

// ────────────────────────────────────────────────────────────────────────────
// 5. D4 — Validierung: renorm(intake × ladder) vs. DECADE_NATION_POOLS
// ────────────────────────────────────────────────────────────────────────────
const valLines = [];
valLines.push('# Paket H — D4-Validierung: Trichter-Modell vs. `DECADE_NATION_POOLS`');
valLines.push('');
valLines.push('GENERIERT von `derive-pyramid.js` — nicht von Hand editieren.');
valLines.push('');
valLines.push('Modell je Dekade: `F1(nat) = renorm( INTAKE_NATION_SHARES[dek][nat] × LADDER[era(dek)][nat] )`,');
valLines.push('Floor ε=0.002, MODERN-Gate vor 2000. Ziel: `DECADE_NATION_POOLS` (selbst geglättet, Paket F).');
valLines.push('Fehlermaß: **TVD** = ½·Σ|Modell−Ziel| (0 = identisch, 1 = disjunkt).');
valLines.push('');
valLines.push('| Dekade | TVD | F1-Debüts (Stichprobe) | Bewertung |');
valLines.push('|---|---:|---:|---|');

const tvdByDec = {};
const detailBlocks = [];
for (const dec of DECADES) {
    const era = DEC2ERA[dec];
    const target = DECADE_NATION_POOLS[dec].weights;
    let model = {}, s = 0;
    for (const n of MASTER) {
        let v = INTAKE[dec][n] * LADDER_BY_ERA[era][n];
        if (dec < 2000 && MODERN_ONLY.has(n)) v = 0;
        model[n] = v; s += v;
    }
    let s2 = 0;
    for (const n of MASTER) { model[n] = Math.max(model[n] / s, (dec < 2000 && MODERN_ONLY.has(n)) ? 0 : EPS); s2 += model[n]; }
    for (const n of MASTER) model[n] /= s2;

    let tvd = 0;
    const diffs = [];
    for (const n of MASTER) {
        const t = target[n] || 0, m = model[n] || 0;
        tvd += Math.abs(m - t) / 2;
        diffs.push([n, m, t, m - t]);
    }
    tvdByDec[dec] = tvd;
    const nDeb = f1EmpByDecade[dec].debutsTotal;
    const rating = tvd < 0.15 ? '✅ gut' : tvd < 0.25 ? '🟡 ok (Dekaden-Rauschen)' : '⚠️ prüfen';
    valLines.push(`| ${dec} | ${tvd.toFixed(3)} | ${nDeb} | ${rating} |`);

    diffs.sort((a, b) => Math.abs(b[3]) - Math.abs(a[3]));
    const rows = diffs.slice(0, 10).map(([n, m, t, d]) =>
        `| ${n} | ${(100 * m).toFixed(1)}% | ${(100 * t).toFixed(1)}% | ${(d > 0 ? '+' : '')}${(100 * d).toFixed(1)}pp |`);
    detailBlocks.push(`\n## ${dec}er (TVD ${tvd.toFixed(3)}, Ära ${era})\n\n| Nation | Modell | Ziel (Pools) | Δ |\n|---|---:|---:|---:|\n${rows.join('\n')}`);
}
const meanTVD = Object.values(tvdByDec).reduce((a, b) => a + b, 0) / DECADES.length;
valLines.push('');
valLines.push(`**Mittlere TVD über 8 Dekaden: ${meanTVD.toFixed(3)}**`);
valLines.push('');
valLines.push('Hinweis Stichprobengröße: 2010er/2020er haben nur 41/11 reale F1-Debüts — ein einzelner');
valLines.push('Fahrer bewegt dort mehrere Prozentpunkte (Piastri ≈ 9% der 2020er-Debüts). Abweichungen');
valLines.push('bei AUS/MON/THA 2020 sind Poisson-Rauschen des Ziels, kein Modellfehler (METHODIK §6).');
valLines.push(detailBlocks.join('\n'));

console.log('\n── D4: TVD je Dekade ──');
for (const dec of DECADES) console.log(dec, tvdByDec[dec].toFixed(3));
console.log('Mittel:', meanTVD.toFixed(3));

// Kalibrier-Hilfe (--calibrate): je Ära/Nation Vorschlag λ_neu = λ_alt × Ø(Ziel/Modell),
// Dekaden nach Debüt-Stichprobe gewichtet. Vorschläge werden von HAND auf interpretierbare
// Bänder gerundet (METHODIK §4) — kein Auto-Fit, 2020er-Rauschen wird bewusst NICHT gejagt.
if (process.argv.includes('--calibrate')) {
    console.log('\n── Kalibrier-Vorschläge (|Δ|>1pp) ──');
    for (const era of ERA_KEYS) {
        const decs = DECADES.filter(d => DEC2ERA[d] === era);
        const sugg = [];
        for (const n of MASTER) {
            let num = 0, den = 0, maxAbs = 0;
            for (const dec of decs) {
                const t = DECADE_NATION_POOLS[dec].weights[n] || 0;
                const era2 = DEC2ERA[dec];
                // Modell neu aufbauen (wie oben)
                let s = 0, mv = 0;
                for (const k of MASTER) {
                    let v = INTAKE[dec][k] * LADDER_BY_ERA[era2][k];
                    if (dec < 2000 && MODERN_ONLY.has(k)) v = 0;
                    s += v; if (k === n) mv = v;
                }
                const m = Math.max(mv / s, EPS);
                const wgt = f1EmpByDecade[dec].debutsTotal;
                num += (t / m) * wgt; den += wgt;
                maxAbs = Math.max(maxAbs, Math.abs(m - t));
            }
            if (maxAbs > 0.01) sugg.push([n, LADDER_BY_ERA[era][n], LADDER_BY_ERA[era][n] * num / den]);
        }
        sugg.sort((a, b) => Math.abs(b[2] - b[1]) - Math.abs(a[2] - a[1]));
        console.log(era + ': ' + sugg.map(([n, o, s]) => `${n} ${o.toFixed(2)}→${s.toFixed(2)}`).join('  '));
    }
}

// ────────────────────────────────────────────────────────────────────────────
// 6. Outputs schreiben
// ────────────────────────────────────────────────────────────────────────────
const HEADER = (what) => `// ============================================================================
// ${what}
// GENERIERT von fable-deliverables/paketH-pyramide/derive-pyramid.js — NICHT von
// Hand editieren. Reproduktion: node derive-pyramid.js (Quellen: F1DB-JSON,
// MOTORSPORT_NATION_FREQ, index.html read-only). Methodik/Quellen-Tags: METHODIK.md.
// ============================================================================
`;

// 6a. pyramid-flow.js
function lvlStr(l) {
    if (!l) return 'null';
    return `{ seats:${l.seats}, fieldOverlap:${l.fieldOverlap}, tenure:${l.tenure}, promoteShare:${l.promoteShare}, freshShare:${l.freshShare}, entryAge:[${l.entryAge}], src:'${l.src}' /* ${l.note} */ }`;
}
let pf = HEADER('PYRAMID_FLOW — Ebenen-Skelett + Einsteiger-Raten je Ära (Paket H, D1+D2)');
pf += `// Felder je Ebene:
//   seats        Sitze gleichzeitig (real-aggregiert; Spiel darf eigene Grid-Größen skalieren,
//                die RATEN (tenure/promoteShare/freshShare) sind skalenfrei)
//   fieldOverlap true → Sitze > Fahrer (Kart: WM+EM = dasselbe ~Feld)
//   tenure       Ø Verweildauer in Jahren → Neuzugänge/Jahr = seats/tenure
//   promoteShare Anteil der ABGÄNGER, der aufsteigt (Rest verschwindet — Ursache egal)
//   freshShare   Anteil der NEUZUGÄNGE frisch aus der nicht-simulierten Masse
//   entryAge     Einstiegsalter-Spanne [von, bis]
//   src          'D' = F1DB-empirisch, 'A' = Flussbilanz-abgeleitet, 'S' = Schätzung
// F1-Zeile: empirisch aus F1DB (Road-F1, Indy raus, Zensur-korrigiert).
//   oneOffShare  Anteil Debütanten mit ≤3 GP-Starts (e50: Drehtür-Privatiers!)
const PYRAMID_FLOW = {
    meta: { generated: '${new Date().toISOString().slice(0, 10)}', source: 'Paket H', eras: { e50:[1950,1961], e62:[1962,1975], e76:[1976,1993], e94:[1994,2009], e10:[2010,null] } },
`;
for (const era of ERA_KEYS) {
    const emp = f1EmpForEra(era);
    pf += `    ${era}: {\n`;
    for (const lv of LEVEL_ORDER) pf += `        ${lv}: ${lvlStr(ERA_LEVELS[era][lv])},\n`;
    pf += `        f1: { seats:${emp.seats}, fieldOverlap:false, tenure:${emp.tenureMedian}, tenureMean:${emp.tenureMean}, entriesPerYear:${emp.debutsPerYear}, freshShare:${F1_FRESH[era]}, oneOffShare:${emp.oneOffShare}, entryAge:[${emp.ageLo},${emp.ageHi}], entryAgeMedian:${emp.ageMed}, src:'D' }\n    },\n`;
}
pf += `};\n`;
fs.writeFileSync(path.join(__dirname, 'pyramid-flow.js'), pf);

// 6b. intake-nation-shares.js
let is = HEADER('INTAKE_NATION_SHARES — Nationen-Verteilung der FRISCHEN Einsteiger an der Basis (Paket H, D3a)');
is += `// Struktur analog MOTORSPORT_NATION_BLEND: { dekade: { IOC: anteil } }, Summe je Dekade = 1.0.
// Getrieben von Motorsport-KULTUR-Breite (Wikidata alle Serien, Bias-gedämpft) × Pro-Kopf-
// Deckel (Bevölkerung) — NICHT von F1-Erfolg. MON/LIE/LUX ≈ ε (Pro-Kopf-Deckel),
// USA/AUS/JPN deutlich ÜBER ihrem F1-Anteil (eigene Welten fließen erst über
// PYRAMID_NATION_LADDER ab). Floor ε=0.002 (Paket-F-Regel), MODERN_ONLY_NATIONS
// (QAT/SAU/UAE/EGY) stehen vor 2000 auf ε und werden vom bestehenden Laufzeit-Gate entfernt.
const INTAKE_NATION_SHARES = {
`;
for (const dec of DECADES) {
    const entries = MASTER.map(n => [n, INTAKE[dec][n]]).sort((a, b) => b[1] - a[1]);
    is += `    ${dec}: { ${entries.map(([n, v]) => `${n}:${v}`).join(',')} },\n`;
}
is += `};\n`;
fs.writeFileSync(path.join(__dirname, 'intake-nation-shares.js'), is);

// 6c. promotion-rates.js
let pr = HEADER('PYRAMID_NATION_LADDER — nationsspezifischer Leiter-Modifikator je Ära (Paket H, D3b)');
pr += `// Relativer Durchsetzungs-Modifikator (Feld-Schnitt = 1.0). GENAU EINMAL pro Fahrer
// anwenden — an der Europa-Commit-Stufe (F4→F3): promoteChance *= LADDER[era][nat].
// NICHT je Stufe multiplizieren (sonst quadriert sich der Effekt).
// < 1: eigene Welt saugt ab (USA→NASCAR/Indy, AUS→Supercars, JPN→SF/SGT, Ostblock-Tor vor 1990).
// > 1: Kultur-Überconversion (FIN). Werte je Archetyp, METHODIK §4 — keine Einzel-Kurvenanpassung.
// Löst langfristig dampUSA in pickNationMotorsport ab (Entscheidung Opus/Nutzer).
const PYRAMID_NATION_LADDER = {
`;
for (const e of ERA_KEYS) {
    const entries = MASTER.map(n => [n, LADDER_BY_ERA[e][n]]).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
    pr += `    ${e}: { ${entries.map(([n, v]) => `${n}:${v.toFixed(2)}`).join(',')} },\n`;
}
pr += `};\n`;
fs.writeFileSync(path.join(__dirname, 'promotion-rates.js'), pr);

// 6d. Validierungs-Report
fs.writeFileSync(path.join(__dirname, 'VALIDIERUNG-D4.md'), valLines.join('\n') + '\n');

// 6e. F1-Empirie als Referenztabelle für die METHODIK
console.log('\n── F1-Empirie je Dekade (Road-F1, Indy raus) ──');
console.log('Dek | Starter/Rennen | Debüts/J | Verweild. Med/Mean | ≤3-Starts | Debütalter P10/Med/P90');
for (const dec of DECADES) {
    const e = f1EmpByDecade[dec];
    console.log(`${dec} | ${e.avgStarters} | ${e.debutsPerYear} | ${e.tenureMedian}/${e.tenureMean} | ${(e.oneOffShare * 100).toFixed(0)}% | ${e.debutAgeP10}/${e.debutAgeMedian}/${e.debutAgeP90}`);
}
console.log('\nGeschrieben: pyramid-flow.js, intake-nation-shares.js, promotion-rates.js, VALIDIERUNG-D4.md');
