// ============================================================================
// Paket F – Nationen-Glättung: Re-Derivation von DECADE_NATION_POOLS und
// MOTORSPORT_NATION_BLEND (1950–2020).
//
// Aufruf:  node derive-smoothed-pools.js   (aus fable-deliverables/paketF-nation-smoothing/)
// Schreibt: DECADE_NATION_POOLS.js, MOTORSPORT_NATION_BLEND.js, METHODIK.md
//
// Pipeline (je Dekade):
//   1. Rohbasis DECADE-Pools = Renn-STARTS je Nation (Road-F1, Indy-500 raus,
//      F1DB bis inkl. 2025) → Volumen statt Anwesenheit (Single-Driver-Fix Teil 1).
//   2. Potenz-Glättung w' = w^p (p=0.65), renormiert  → mehr Vielfalt.
//   3. Empirical-Bayes-artige Schrumpfung × u/(u+k) (u = unique Fahrer der
//      Nation in der Dekade, k=4) → Ein-Fahrer-Nationen entschärft (Teil 2).
//   4. Europa-Tilt (era-abhängig ×1.0–1.2) vor Renormierung.
//   5. Floor ε=0.002 über die Master-Liste (Union aller je auftretenden
//      Nationen beider Tabellen + F1DB-Startdaten), renormiert → kein 0%.
// BLEND = 50% Wikidata-Motorsport-Shares (gleich geglättet: ^p, Tilt) +
//         50% geglätteter DECADE-Pool, dann Floor + Renorm.
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

const P = 0.65;                 // Potenz-Glättung
const K_SHRINK = 4;             // Schrumpfung u/(u+K)
const EPS = 0.002;              // Floor
const EURO_TILT = { 1950: 1.0, 1960: 1.0, 1970: 1.05, 1980: 1.1, 1990: 1.1, 2000: 1.15, 2010: 1.2, 2020: 1.2 };
const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
const LAST_YEAR = 2025;         // letzte komplette F1DB-Saison

const EUROPE = new Set(['GBR','GER','ITA','FRA','ESP','POR','BEL','NED','LUX','SUI','AUT','SWE','NOR','DEN','FIN','IRL','MON','POL','CZE','SVK','HUN','ROU','BUL','GRE','TUR','RUS','UKR','EST','LAT','LTU','SRB','CRO','SLO','SMR','LIE','AND','ISL','BIH','MKD','ALB']);

// ── Aktuelle Tabellen (index.html v0.9.14.46, ~Z.4639/4679) für Vorher/Nachher ──
const CURRENT_DECADE = {
    1950: {'GBR':0.3305,'GER':0.1186,'ITA':0.1144,'FRA':0.1059,'USA':0.072,'ARG':0.0593,'BEL':0.0551,'SUI':0.0339,'BRA':0.0169,'AUS':0.0169,'URU':0.0169,'ESP':0.0127,'NED':0.0127,'MON':0.0085,'IRL':0.0042,'THA':0.0042,'SWE':0.0042,'NZL':0.0042,'MAR':0.0042,'POR':0.0042},
    1960: {'GBR':0.2444,'USA':0.1704,'ITA':0.1185,'RSA':0.1037,'SUI':0.0519,'FRA':0.0519,'CAN':0.0519,'GER':0.0444,'ARG':0.0296,'MEX':0.0222,'NZL':0.0222,'ZIM':0.0222,'BEL':0.0148,'AUS':0.0148,'AUT':0.0148,'VEN':0.0074,'ESP':0.0074,'NED':0.0074},
    1970: {'GBR':0.1729,'ITA':0.1278,'FRA':0.1053,'USA':0.0677,'AUS':0.0526,'BRA':0.0526,'SWE':0.0451,'AUT':0.0451,'JPN':0.0451,'NED':0.0376,'RSA':0.0376,'SUI':0.0301,'ESP':0.0226,'NZL':0.0226,'GER':0.0226,'FIN':0.0226,'BEL':0.0226,'CAN':0.015,'ARG':0.015,'DEN':0.015,'MEX':0.0075,'IRL':0.0075},
    1980: {'ITA':0.2278,'FRA':0.1519,'GBR':0.1392,'GER':0.0759,'BRA':0.0633,'USA':0.0253,'IRL':0.0253,'SWE':0.0253,'ARG':0.0253,'COL':0.0253,'CAN':0.0253,'AUT':0.0253,'JPN':0.0253,'SUI':0.0253,'ESP':0.0253,'RSA':0.0127,'NZL':0.0127,'BEL':0.0127,'VEN':0.0127,'NED':0.0127,'FIN':0.0127},
    1990: {'ITA':0.2239,'FRA':0.1194,'JPN':0.1045,'BRA':0.0896,'GBR':0.0746,'GER':0.0597,'AUT':0.0448,'AUS':0.0299,'POR':0.0299,'BEL':0.0299,'FIN':0.0299,'SUI':0.0299,'ARG':0.0299,'ESP':0.0299,'USA':0.0149,'NED':0.0149,'MON':0.0149,'DEN':0.0149,'CAN':0.0149},
    2000: {'GER':0.1926,'GBR':0.1704,'ITA':0.1481,'BRA':0.1407,'ESP':0.0593,'AUS':0.0593,'CAN':0.0519,'COL':0.0444,'FRA':0.0296,'POL':0.0296,'NED':0.0222,'IRL':0.0222,'FIN':0.0222,'JPN':0.0074},
    2010: {'GER':0.1613,'GBR':0.1613,'ESP':0.1129,'AUS':0.1048,'BRA':0.1048,'FIN':0.0887,'DEN':0.0484,'FRA':0.0484,'NED':0.0403,'JPN':0.0323,'ITA':0.0323,'CAN':0.0242,'POL':0.0161,'MON':0.0161,'THA':0.0081},
    2020: {'GBR':0.1748,'FRA':0.1165,'ESP':0.1068,'CAN':0.0874,'AUS':0.0777,'NED':0.0583,'MON':0.0583,'FIN':0.0485,'THA':0.0485,'GER':0.0485,'JPN':0.0485,'DEN':0.0388,'CHN':0.0291,'ITA':0.0194,'USA':0.0194,'BRA':0.0097,'POL':0.0097}
};
const CURRENT_BLEND = require(path.join(__dirname, 'current-blend-snapshot.js'));

// ── Wikidata-Motorsport-Shares (Paket A v3) ──
const wdSrc = fs.readFileSync(path.join(ROOT, 'fable-deliverables', 'nation-data', 'nation-frequency-by-decade.js'), 'utf8');
const MOTORSPORT_NATION_FREQ = eval(wdSrc + '; MOTORSPORT_NATION_FREQ');

// ── F1DB laden ──
const races = require(path.join(ROOT, 'f1db-json-splitted', 'f1db-races.json'));
const results = require(path.join(ROOT, 'f1db-json-splitted', 'f1db-races-race-results.json'));
const drivers = require(path.join(ROOT, 'f1db-json-splitted', 'f1db-drivers.json'));
const countries = require(path.join(ROOT, 'f1db-json-splitted', 'f1db-countries.json'));

const iocByCountry = new Map(countries.map(c => [c.id, c.iocCode || c.alpha3Code]));
const natByDriver = new Map(drivers.map(d => [d.id, iocByCountry.get(d.nationalityCountryId) || '???']));
const indyRaceIds = new Set(races.filter(r => r.grandPrixId && r.grandPrixId.includes('indianapolis')).map(r => r.id));

// Starts + unique Fahrer je Nation je Dekade (Road-F1, ≤2025)
const startsByDec = {}, uniqByDec = {};
for (const d of DECADES) { startsByDec[d] = {}; uniqByDec[d] = {}; }
for (const r of results) {
    if (r.year > LAST_YEAR) continue;
    if (indyRaceIds.has(r.raceId)) continue;
    let dec = Math.floor(r.year / 10) * 10; if (dec > 2020) dec = 2020;
    const nat = natByDriver.get(r.driverId);
    if (!nat || nat === '???') continue;
    startsByDec[dec][nat] = (startsByDec[dec][nat] || 0) + 1;
    (uniqByDec[dec][nat] = uniqByDec[dec][nat] || new Set()).add(r.driverId);
}

// ── Master-Liste ──
const master = new Set();
for (const d of DECADES) {
    Object.keys(CURRENT_DECADE[d]).forEach(n => master.add(n));
    Object.keys(CURRENT_BLEND[d]).forEach(n => master.add(n));
    Object.keys(startsByDec[d]).forEach(n => master.add(n));
}
const MASTER = [...master].sort();
console.log(`Master-Liste: ${MASTER.length} Nationen: ${MASTER.join(',')}`);
const onlyFromF1db = MASTER.filter(n => !DECADES.some(d => CURRENT_DECADE[d][n] || CURRENT_BLEND[d][n]));
console.log(`Neu aus F1DB-Startdaten (nicht in bestehenden Tabellen): ${onlyFromF1db.join(',') || '—'}`);

// ── Helfer ──
function renorm(w) { const s = Object.values(w).reduce((a, b) => a + b, 0); const o = {}; for (const k in w) o[k] = w[k] / s; return o; }
function entropy(w) { let h = 0; for (const k in w) { const p = w[k]; if (p > 0) h -= p * Math.log2(p); } return h; }
function round4(w) {
    // auf 4 Nachkommastellen runden, Rundungsrest auf größten Eintrag schlagen → Summe exakt 1.0
    const keys = Object.keys(w).sort((a, b) => w[b] - w[a]);
    const o = {}; let s = 0;
    for (const k of keys) { o[k] = Math.round(w[k] * 10000) / 10000; s += o[k]; }
    o[keys[0]] = Math.round((o[keys[0]] + (1 - s)) * 10000) / 10000;
    return o;
}
function applyFloor(w) {
    const o = {};
    for (const n of MASTER) o[n] = Math.max(w[n] || 0, EPS);
    return renorm(o);
}
function smoothCore(raw, dec, uniq) {
    // raw: Anteile (müssen nicht normiert sein) → ^p → shrink → tilt → renorm (OHNE Floor)
    let w = {};
    for (const n in raw) if (raw[n] > 0) w[n] = Math.pow(raw[n], P);
    w = renorm(w);
    if (uniq) for (const n in w) { const u = (uniq[n] ? uniq[n].size : 0); w[n] *= u / (u + K_SHRINK); }
    for (const n in w) if (EUROPE.has(n)) w[n] *= EURO_TILT[dec];
    return renorm(w);
}

// ── DECADE_NATION_POOLS neu ──
// Basis = geometrisches Mittel aus Start-Anteil (Volumen) und Unique-Fahrer-Anteil
// (Köpfe): Ein-Fahrer-Nationen (Albon/THA: 6 Saisons, 1 Kopf) werden gedrückt,
// Ein-Rennen-Fahrer-Nationen (1950er Privatiers) ebenso — beide Verzerrungen raus.
const newDecade = {}, newDecadePreFloor = {};
for (const d of DECADES) {
    const startShare = renorm(startsByDec[d]);
    const drvCounts = {}; for (const n in uniqByDec[d]) drvCounts[n] = uniqByDec[d][n].size;
    const drvShare = renorm(drvCounts);
    const geo = {}; for (const n in startShare) geo[n] = Math.sqrt(startShare[n] * (drvShare[n] || 0));
    const core = smoothCore(renorm(geo), d, uniqByDec[d]);
    newDecadePreFloor[d] = core;
    newDecade[d] = round4(applyFloor(core));
}

// ── MOTORSPORT_NATION_BLEND neu ──
const newBlend = {};
for (const d of DECADES) {
    // Wikidata-Anteil: auf Master-Liste beschränken, renorm, dann ^p + Tilt (keine Shrink —
    // 12.207-Fahrer-Basis hat kein Ein-Fahrer-Problem in relevanter Größenordnung)
    const wdRaw = {};
    for (const n in MOTORSPORT_NATION_FREQ.shares[d]) if (master.has(n)) wdRaw[n] = MOTORSPORT_NATION_FREQ.shares[d][n];
    const wdSmooth = smoothCore(renorm(wdRaw), d, null);
    const mix = {};
    for (const n of MASTER) mix[n] = 0.5 * (wdSmooth[n] || 0) + 0.5 * (newDecadePreFloor[d][n] || 0);
    newBlend[d] = round4(applyFloor(renorm(mix)));
}

// ── Checks ──
console.log('\n── Zielwert-Checks ──');
console.log(`THA 2020 DECADE: vorher ${CURRENT_DECADE[2020].THA} → nachher ${newDecade[2020].THA} (Ziel <0.02)`);
console.log(`THA 2020 BLEND : vorher ${CURRENT_BLEND[2020].THA} → nachher ${newBlend[2020].THA}`);
for (const d of DECADES) {
    const s1 = Object.values(newDecade[d]).reduce((a, b) => a + b, 0);
    const s2 = Object.values(newBlend[d]).reduce((a, b) => a + b, 0);
    const z1 = Object.values(newDecade[d]).filter(v => v <= 0).length;
    const z2 = Object.values(newBlend[d]).filter(v => v <= 0).length;
    console.log(`${d}: Summe DECADE=${s1.toFixed(4)} BLEND=${s2.toFixed(4)} | Nullen: ${z1}/${z2} | Nationen: ${Object.keys(newDecade[d]).length}/${Object.keys(newBlend[d]).length}`);
}

// ── Entropie-Tabelle ──
const entRows = [];
for (const d of DECADES) {
    entRows.push({
        dec: d,
        dOld: entropy(renorm(CURRENT_DECADE[d])), dNew: entropy(newDecade[d]),
        bOld: entropy(renorm(CURRENT_BLEND[d])), bNew: entropy(newBlend[d])
    });
}
console.log('\nEntropie (bits, eff. Nationen = 2^H):');
for (const r of entRows) console.log(`${r.dec}: DECADE ${r.dOld.toFixed(2)}→${r.dNew.toFixed(2)} (${Math.pow(2, r.dOld).toFixed(1)}→${Math.pow(2, r.dNew).toFixed(1)} eff.) | BLEND ${r.bOld.toFixed(2)}→${r.bNew.toFixed(2)} (${Math.pow(2, r.bOld).toFixed(1)}→${Math.pow(2, r.bNew).toFixed(1)} eff.)`);

// ── Vorher/Nachher auffälligste Werte ──
const WATCH = ['THA', 'USA', 'GBR', 'ITA'];
console.log('\nWatch-Nationen je Dekade (DECADE-Pool, vorher→nachher):');
for (const d of DECADES) {
    console.log(`${d}: ` + WATCH.map(n => `${n} ${(CURRENT_DECADE[d][n] || 0).toFixed(4)}→${(newDecade[d][n] || 0).toFixed(4)}`).join(' | '));
}

// ── Dateien schreiben ──
function fmtTable(obj, wrapWeights) {
    const lines = [];
    for (const d of DECADES) {
        const entries = Object.entries(obj[d]).sort((a, b) => b[1] - a[1])
            .map(([n, v]) => `${wrapWeights ? `'${n}'` : n}:${v}`).join(',');
        lines.push(wrapWeights
            ? `            ${d}: {weights: {${entries}}}`
            : `            ${d}: { ${entries} }`);
    }
    return lines.join(',\n');
}
const today = new Date().toISOString().slice(0, 10);
const headDec = `// ============================================================================
// DECADE_NATION_POOLS — geglättet (Fable Paket F, ${today})
// Basis: F1DB Renn-STARTS je Nation/Dekade (Road-F1 1950–${LAST_YEAR}, Indy-500 raus)
// Pipeline: w^${P} → Shrink u/(u+${K_SHRINK}) (Ein-Fahrer-Fix) → Europa-Tilt (1.0–1.2)
//           → Floor ε=${EPS} über ${MASTER.length}-Nationen-Master-Liste → renorm.
// GENERIERT von derive-smoothed-pools.js — nicht von Hand editieren.
// Ersetzt die Tabelle in index.html 1:1 (gleiche Struktur, Summe je Dekade = 1.0).
// ============================================================================
`;
const headBlend = `// ============================================================================
// MOTORSPORT_NATION_BLEND — geglättet (Fable Paket F, ${today})
// = 50% Wikidata-Motorsport-Shares (12.207 Fahrer, ^${P} + Europa-Tilt)
// + 50% geglätteter DECADE-Pool (siehe DECADE_NATION_POOLS.js),
// dann Floor ε=${EPS} über ${MASTER.length}-Nationen-Master-Liste → renorm.
// GENERIERT von derive-smoothed-pools.js — nicht von Hand editieren.
// Ersetzt die Tabelle in index.html 1:1 (gleiche Struktur, Summe je Dekade = 1.0).
// ============================================================================
`;
fs.writeFileSync(path.join(__dirname, 'DECADE_NATION_POOLS.js'),
    headDec + 'const DECADE_NATION_POOLS = {\n' + fmtTable(newDecade, true) + '\n};\n');
fs.writeFileSync(path.join(__dirname, 'MOTORSPORT_NATION_BLEND.js'),
    headBlend + 'const MOTORSPORT_NATION_BLEND = {\n' + fmtTable(newBlend, false) + '\n};\n');
console.log('\nGeschrieben: DECADE_NATION_POOLS.js, MOTORSPORT_NATION_BLEND.js');

// Daten für METHODIK.md als JSON hinterlegen (das MD schreibt Fable von Hand)
fs.writeFileSync(path.join(__dirname, 'methodik-data.json'), JSON.stringify({
    params: { P, K_SHRINK, EPS, EURO_TILT, LAST_YEAR, masterCount: MASTER.length },
    master: MASTER, newFromF1db: onlyFromF1db,
    entropy: entRows,
    watch: Object.fromEntries(DECADES.map(d => [d, Object.fromEntries(WATCH.map(n => [n, {
        decOld: CURRENT_DECADE[d][n] || 0, decNew: newDecade[d][n] || 0,
        blendOld: CURRENT_BLEND[d][n] || 0, blendNew: newBlend[d][n] || 0
    }]))]))
}, null, 2));
