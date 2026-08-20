// build-home-only.js — erzeugt data/home-only.js
//
// DREI VOLLSTAENDIGE LISTEN AUS F1DB (alle 915 Fahrer, alle 187 Konstrukteure):
//   1. HOME_ONLY_DRIVERS        — Fahrer, die in ihrer GESAMTEN Karriere nur im
//                                 eigenen Land (bzw. dessen Heimrennen-Ersatz) meldeten
//   2. HOME_ONLY_CONSTRUCTORS   — dasselbe fuer Konstrukteure
//   3. SINGLE_DRIVER_CONSTRUCTORS — Konstrukteure, fuer die je nur EIN Fahrer meldete
// Dazu REGION_ONLY_DRIVERS/-CONSTRUCTORS: das Nordamerika-Buendel (USA/MEX/CAN) und
// Suedamerika — wer zwar nicht nur daheim, aber nur in seiner Weltgegend meldete.
//
// WARUM GENERIERT: `HOME_ONLY_ENTRIES` (data/f1db.js) ist von Hand kuratiert und deckt
// 179 Faelle ab. Handarbeit kann nicht garantieren, dass sie alle Faelle kennt — diese
// Datei misst sie stattdessen. Der Anspruch des Nutzers: "das Spiel soll es dauerhaft
// wissen", also alle Treffer, nicht eine Auswahl.
//
// MELDUNG = Rennergebnis ODER Qualifikation ODER Vor-Qualifikation. Nicht nur Starts:
// wer nur DNQ fuhr, hat trotzdem gemeldet und gehoert in die Liste (die halbe
// Lokalmatadoren-Population der 1950er hat nie ein Rennen beendet).
//
// HEIMAT-SONDERREGELN (Vorgabe des Nutzers):
//   • DDR      -> Deutschland-GP     (F1DB kennt keine DDR, alle unter `germany`;
//                                     die Regel steht trotzdem im Export, weil das
//                                     SPIEL den Code GDR fuehrt)
//   • Schweiz  -> zusaetzlich Deutschland (Motorsport-Bann ab 1955: kein Schweizer
//                                     GP mehr, der Nuerburgring wurde das Heimrennen)
//   • Rhodesien-> Suedafrika          (kein eigenes Rennen, immer in RSA gemeldet)
//   • Nordamerika-Buendel USA/MEX/CAN wird SEPARAT ausgewiesen, nicht als "daheim"
//     verbucht — sonst waere jeder Mexikaner in Watkins Glen ein Heimrennen-Melder.
//
// INDIANAPOLIS: das Indy 500 zaehlte 1950-60 zur WM. Wer nur dort meldete, ist
// technisch "nur daheim" (USA), gehoert aber in den Indy-Pool und nicht zu den
// Lokalmatadoren. Solche Faelle werden mit `indy` markiert und NICHT exportiert.
//
// Aufruf:  node tools/build-home-only.js           (Trockenlauf + Bericht)
//          node tools/build-home-only.js --write   (schreibt data/home-only.js)
//          node tools/build-home-only.js --diff    (Abgleich mit HOME_ONLY_ENTRIES)
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = path.join(ROOT, 'f1db-json-splitted');
const OUT = path.join(ROOT, 'data', 'home-only.js');
const J = f => JSON.parse(fs.readFileSync(path.join(BASE, f), 'utf8'));
const WRITE = process.argv.includes('--write');
const DIFF = process.argv.includes('--diff');

// ── Stammdaten ─────────────────────────────────────────────────────────────
const countries = J('f1db-countries.json');
const iocOf = {};                       // countryId -> IOC-Code
countries.forEach(c => { iocOf[c.id] = c.iocCode || c.alpha3Code; });

const circuits = J('f1db-circuits.json');
const circCountry = {};                 // circuitId -> countryId
circuits.forEach(c => { circCountry[c.id] = c.countryId; });

const races = J('f1db-races.json');
const raceInfo = {};                    // raceId -> { year, circuitId, country }
races.forEach(r => {
    raceInfo[r.id] = {
        year: r.year,
        circuitId: r.circuitId,
        country: circCountry[r.circuitId] || null,
        isIndy: r.circuitId === 'indianapolis' && r.year <= 1960,
    };
});

const drivers = J('f1db-drivers.json');
const constructors = J('f1db-constructors.json');
const driverById = {}; drivers.forEach(d => driverById[d.id] = d);
const consById = {};   constructors.forEach(c => consById[c.id] = c);

// ── Meldungen einsammeln ───────────────────────────────────────────────────
const QUELLEN = [
    'f1db-races-race-results.json',
    'f1db-races-qualifying-results.json',
    'f1db-races-qualifying-1-results.json',
    'f1db-races-qualifying-2-results.json',
    'f1db-races-pre-qualifying-results.json',
];
const dEntries = {};   // driverId -> { countries:Set, circuits:Set, years:Set, n, indy }
const cEntries = {};   // constructorId -> dito + drivers:Set
function bucket(map, key) {
    return map[key] || (map[key] = {
        countries: new Set(), circuits: new Set(), years: new Set(),
        n: 0, indy: 0, drivers: new Set(), alleFahrer: new Set(),
    });
}
const gesehen = new Set();   // Doppelzaehlung ueber die Quellen vermeiden
for (const q of QUELLEN) {
    let rows; try { rows = J(q); } catch { continue; }
    for (const r of rows) {
        const info = raceInfo[r.raceId]; if (!info || !info.country) continue;
        const sig = r.raceId + '|' + r.driverId + '|' + r.constructorId;
        const neu = !gesehen.has(sig); gesehen.add(sig);
        // INDY RAUS — wie in build-driver-starts.js. Das Indy 500 lief 1950-60 zwar in
        // der WM-Wertung, hatte aber ein eigenes Fahrerfeld, das mit dem GP-Zirkus
        // nichts zu tun hatte. Wer es mitzaehlt, erklaert 103 amerikanische Oval-
        // Spezialisten zu "Heimrennen-Meldern" und Kurtis Kraft (214 Meldungen, davon
        // 213 in Indianapolis) zum US-Lokalkonstrukteur. Das Spiel fuehrt sie ueber
        // INDY_500_ONLY_DRIVERS und einen eigenen Pool.
        for (const [map, key] of [[dEntries, r.driverId], [cEntries, r.constructorId]]) {
            if (!key) continue;
            const b = bucket(map, key);
            // Fuer "nur EIN Fahrer" zaehlt Indy MIT — Kurtis Kraft hatte ausserhalb
            // von Indianapolis genau eine Meldung (Ward, Sebring 1959), im Oval aber
            // Dutzende Fahrer. Ohne diese Zeile stuende der groesste Indy-Hersteller
            // als Ein-Fahrer-Konstrukteur in der Liste.
            if (map === cEntries && r.driverId) b.alleFahrer.add(r.driverId);
            if (info.isIndy) { if (neu) b.indy++; continue; }
            b.countries.add(info.country); b.circuits.add(info.circuitId);
            b.years.add(info.year); if (neu) b.n++;
            if (map === cEntries && r.driverId) b.drivers.add(r.driverId);
        }
    }
}

// ── Heimat-Regeln ──────────────────────────────────────────────────────────
// countryId -> zusaetzlich als Heimat geltende Renn-Laender
const HEIM_ZUSATZ = {
    'zimbabwe':    ['south-africa'],   // Rhodesien
    'switzerland': ['germany'],        // Motorsport-Bann 1955
};
const NORDAMERIKA = new Set(['united-states-of-america', 'mexico', 'canada']);
const SUEDAMERIKA = new Set(['brazil', 'argentina', 'uruguay', 'venezuela', 'colombia', 'chile']);

function heimatSet(countryId) {
    const s = new Set([countryId]);
    (HEIM_ZUSATZ[countryId] || []).forEach(x => s.add(x));
    return s;
}
const ioc = cid => iocOf[cid] || String(cid || '').toUpperCase().slice(0, 3);

// ── Auswertung ─────────────────────────────────────────────────────────────
function auswerten(entity, heimatLand, e) {
    const laender = [...e.countries];
    const heim = heimatSet(heimatLand);
    if (laender.every(l => heim.has(l))) return { typ: 'heim', heim, laender };
    // Region-Buendel: nur Nordamerika bzw. nur Suedamerika, Heimat liegt darin
    if (NORDAMERIKA.has(heimatLand) && laender.every(l => NORDAMERIKA.has(l))) {
        return { typ: 'NA', heim, laender };
    }
    if (SUEDAMERIKA.has(heimatLand) && laender.every(l => SUEDAMERIKA.has(l))) {
        return { typ: 'SA', heim, laender };
    }
    return { typ: null, heim, laender };
}

const fahrerHeim = [], fahrerNA = [], fahrerSA = [], fahrerIndy = [];
for (const d of drivers) {
    const e = dEntries[d.id]; if (!e) continue;
    if (!e.n) { if (e.indy) fahrerIndy.push(d.id); continue; }   // ausschliesslich Indy
    const r = auswerten(d, d.nationalityCountryId, e);
    const rec = {
        id: d.id, name: d.name, nat: ioc(d.nationalityCountryId),
        natId: d.nationalityCountryId, indy: e.indy,
        n: e.n, jahre: [Math.min(...e.years), Math.max(...e.years)],
        circuits: [...e.circuits].sort(), laender: r.laender.map(ioc).sort(),
        heim: [...r.heim].map(ioc).sort(),
    };
    if (r.typ === 'heim') fahrerHeim.push(rec);
    else if (r.typ === 'NA') fahrerNA.push(rec);
    else if (r.typ === 'SA') fahrerSA.push(rec);
}

const teamHeim = [], teamNA = [], teamSA = [], teamIndy = [], teamEin = [];
for (const c of constructors) {
    const e = cEntries[c.id]; if (!e) continue;
    const nurIndy = !e.n;
    if (nurIndy && e.indy) teamIndy.push(c.id);
    const r = nurIndy ? { typ: null, heim: heimatSet(c.countryId), laender: [] }
                      : auswerten(c, c.countryId, e);
    const rec = {
        id: c.id, name: c.name, nat: ioc(c.countryId), natId: c.countryId, indy: e.indy,
        nurIndy,
        n: e.n || e.indy, jahre: nurIndy ? [0, 0] : [Math.min(...e.years), Math.max(...e.years)],
        circuits: nurIndy ? ['indianapolis'] : [...e.circuits].sort(),
        laender: r.laender.map(ioc).sort(),
        heim: [...r.heim].map(ioc).sort(),
        fahrer: [...e.alleFahrer],
    };
    if (e.alleFahrer.size === 1) teamEin.push(rec);
    if (nurIndy) continue;                                       // ausschliesslich Indy
    // Ueberwiegend-Indy-Hersteller gehoeren nicht in die Heimat-Liste: Kurtis Kraft
    // meldete 213-mal in Indianapolis und genau einmal (Ward, Sebring 1959) im GP-
    // Zirkus. Als "US-Lokalkonstrukteur" gefuehrt, wuerde er die Indy-Trennung
    // unterlaufen, die das Spiel ueber INDY_500_ONLY_* zieht.
    if (e.indy > e.n) continue;
    if (r.typ === 'heim') teamHeim.push(rec);
    else if (r.typ === 'NA') teamNA.push(rec);
    else if (r.typ === 'SA') teamSA.push(rec);
}

// ── Bericht ────────────────────────────────────────────────────────────────
const fmt = r => `  ${r.name.padEnd(26)} ${r.nat}  ${String(r.n).padStart(3)} Meld.  `
    + `${r.jahre[0]}${r.jahre[1] !== r.jahre[0] ? '-' + r.jahre[1] : '     '}  `
    + `${r.circuits.slice(0, 4).join(',')}${r.circuits.length > 4 ? ' +' + (r.circuits.length - 4) : ''}`
    + (r.indy ? `  [dazu ${r.indy}x Indy]` : '');

console.log(`\n=== 1. FAHRER, DIE NUR DAHEIM MELDETEN (${fahrerHeim.length} von ${drivers.length}) ===`);
const nachNat = {};
fahrerHeim.forEach(r => (nachNat[r.nat] = nachNat[r.nat] || []).push(r));
Object.keys(nachNat).sort((a, b) => nachNat[b].length - nachNat[a].length).forEach(n => {
    console.log(`\n-- ${n} (${nachNat[n].length}) --`);
    nachNat[n].sort((a, b) => b.n - a.n).forEach(r => console.log(fmt(r)));
});
console.log(`\n  [nur Indy, NICHT exportiert: ${fahrerIndy.length}]`);
console.log(`\n=== 1b. NUR NORDAMERIKA (${fahrerNA.length}) / NUR SUEDAMERIKA (${fahrerSA.length}) ===`);
fahrerNA.forEach(r => console.log(fmt(r)));
console.log('  --- Suedamerika ---');
fahrerSA.forEach(r => console.log(fmt(r)));

console.log(`\n=== 2. KONSTRUKTEURE, DIE NUR DAHEIM MELDETEN (${teamHeim.length} von ${constructors.length}) ===`);
teamHeim.sort((a, b) => b.n - a.n).forEach(r => console.log(fmt(r)));
console.log(`\n  [nur Indy, NICHT exportiert: ${teamIndy.length}] ${teamIndy.join(', ')}`);
console.log(`\n  --- nur Nordamerika (${teamNA.length}) ---`);
teamNA.forEach(r => console.log(fmt(r)));
console.log(`  --- nur Suedamerika (${teamSA.length}) ---`);
teamSA.forEach(r => console.log(fmt(r)));

console.log(`\n=== 3. KONSTRUKTEURE MIT NUR EINEM EINZIGEN FAHRER (${teamEin.length}) ===`);
teamEin.sort((a, b) => b.n - a.n).forEach(r => {
    const d = driverById[r.fahrer[0]];
    console.log(`  ${r.name.padEnd(26)} ${r.nat}  ${String(r.n).padStart(3)} Meld.  `
        + `${r.jahre[0]}${r.jahre[1] !== r.jahre[0] ? '-' + r.jahre[1] : '     '}  `
        + `-> ${d ? d.name : r.fahrer[0]} (${d ? ioc(d.nationalityCountryId) : '?'})`);
});

// ── Abgleich mit der kuratierten Liste ─────────────────────────────────────
if (DIFF) {
    const t = fs.readFileSync(path.join(ROOT, 'data', 'f1db.js'), 'utf8');
    const i = t.indexOf('const HOME_ONLY_ENTRIES');
    const body = t.slice(i, t.indexOf('};', i));
    const altMap = {};
    for (const m of body.matchAll(/'([a-z0-9-]+)'\s*:\s*\[([^\]]+)\]/g)) {
        altMap[m[1]] = (m[2].match(/'([^']+)'/g) || []).map(s => s.replace(/'/g, ''));
    }
    const alt = new Set(Object.keys(altMap));
    const neu = new Set(fahrerHeim.map(r => r.id));
    const fehlt = [...neu].filter(x => !alt.has(x));
    const zuviel = [...alt].filter(x => !neu.has(x));
    console.log(`\n=== ABGLEICH mit HOME_ONLY_ENTRIES (${alt.size} kuratiert) ===`);
    console.log(`  in F1DB belegt, in der Liste FEHLEND: ${fehlt.length}`);
    fehlt.forEach(id => { const r = fahrerHeim.find(x => x.id === id); console.log(fmt(r)); });
    // ⚠ KEIN FEHLERBEFUND. `HOME_ONLY_ENTRIES` ist eine STRECKENLISTE, keine
    // Heimatregel: sie bindet auch Auslaender an die Orte, an denen sie real
    // meldeten (David Prophet nur Ostlondon, Teddy Pilette Nivelles/Zandvoort/
    // Hockenheim/Monza). Wer hier auftaucht, ist deshalb nicht falsch eingetragen,
    // sondern nur kein Heimat-Fall. Geprueft werden muss allein, ob die Strecken
    // stimmen — dafuer steht neben jedem Eintrag FEHLT/ZUVIEL.
    console.log(`\n  in der Liste, aber KEIN Heimat-Fall (Streckenliste): ${zuviel.length}`);
    let schief = 0;
    zuviel.forEach(id => {
        const e = dEntries[id], d = driverById[id];
        if (!e) { console.log(`  ${id} — gar keine Meldung in F1DB`); return; }
        const real = [...e.circuits].sort(), k = (altMap[id] || []).slice().sort();
        const fehlt = real.filter(c => !k.includes(c)), ueber = k.filter(c => !real.includes(c));
        if (!fehlt.length && !ueber.length) return;                 // Strecken stimmen exakt
        schief++;
        console.log(`  ${(d ? d.name : id).padEnd(26)} ${d ? ioc(d.nationalityCountryId) : '?'}  `
            + `FEHLT: ${fehlt.join(',') || '-'}   ZUVIEL: ${ueber.join(',') || '-'}`);
    });
    console.log(`  davon mit falscher Streckenliste: ${schief} (Rest deckt sich exakt)`);
}

// ── Export ─────────────────────────────────────────────────────────────────
const q = s => `'${s}'`;
const mapBlock = (list, val) => list
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(r => `            ${(q(r.id) + ':').padEnd(28)} ${val(r)},`)
    .join('\n');

const natVal = r => (r.heim.length === 1 ? q(r.heim[0]) : `[${r.heim.map(q).join(', ')}]`);

const block = `        // HOME_ONLY — wer in seiner GESAMTEN Karriere nur im eigenen Land meldete.
        // GENERIERT von tools/build-home-only.js — NICHT von Hand editieren.
        //
        // Vollstaendig aus F1DB gemessen: alle ${drivers.length} Fahrer und ${constructors.length}
        // Konstrukteure, Meldung = Rennergebnis ODER Qualifikation ODER Vor-Qualifikation
        // (wer nur DNQ fuhr, hat gemeldet und zaehlt mit).
        //
        // Wert = erlaubte Heimatnation(en) als IOC-Code. Die STRECKEN stehen bewusst
        // nicht drin: das Spiel loest sie aus dem laufenden Kalender auf, damit die
        // Regel auch in einer alternativen Geschichte greift (1963 East London,
        // 1972 Kyalami — dieselbe Person, andere Strecke).
        //
        // Sonderregeln, wie vom Nutzer vorgegeben:
        //   • Schweizer haben ab dem Motorsport-Bann 1955 kein Heimrennen mehr —
        //     der Deutschland-GP gilt als Heimat (daher ['SUI','GER']).
        //   • Rhodesier meldeten immer in Suedafrika (['ZIM','RSA'] bzw. HOME_RACE_PROXY).
        //   • DDR-Fahrer fahren den Deutschland-GP. F1DB fuehrt keine DDR, alle liegen
        //     unter GER — die Zuordnung GDR->GER steht deshalb in HOME_NATION_ALIAS.
        //   • Reine Indy-500-Melder sind AUSGENOMMEN (eigener Pool, INDY_500_ONLY_DRIVERS).
        //
        // ${fahrerHeim.length} Fahrer, ${teamHeim.length} Konstrukteure. Die Listen bestehen nur aus TREFFERN.
        const HOME_ONLY_DRIVERS = {
${mapBlock(fahrerHeim, natVal)}
        };

        // Nation des Spiels -> Nation, deren Heimrennen sie fahren.
        const HOME_NATION_ALIAS = { GDR: 'GER', ZIM: 'RSA', RHO: 'RSA' };

        // Wer nicht nur daheim, aber nur in seiner WELTGEGEND meldete. Sie kamen zur
        // Formel 1, wenn die Formel 1 zu ihnen kam — ein Ersatzeinsatz in Europa waere
        // in keiner alternativen Geschichte plausibel. 'NA' = USA/MEX/CAN, 'SA' = Suedamerika.
        const REGION_ONLY_DRIVERS = {
${[mapBlock(fahrerNA, () => q('NA')), mapBlock(fahrerSA, () => q('SA'))].filter(Boolean).join('\n')}
        };

        // Konstrukteure, die nur im eigenen Land meldeten (${teamHeim.length}).
        const HOME_ONLY_CONSTRUCTORS = {
${mapBlock(teamHeim, natVal)}
        };
        const REGION_ONLY_CONSTRUCTORS = {
${[mapBlock(teamNA, () => q('NA')), mapBlock(teamSA, () => q('SA'))].filter(Boolean).join('\n')}
        };

        // Konstrukteure, fuer die in ihrer ganzen Geschichte nur EIN EINZIGER Fahrer
        // meldete (${teamEin.length}). Wert = dessen F1DB-Slug. Fuer die Besitzer-Fahrer-Regel:
        // ein zweites Cockpit hat es bei ihnen nie gegeben.
        const SINGLE_DRIVER_CONSTRUCTORS = {
${teamEin.sort((a, b) => a.id.localeCompare(b.id))
        .map(r => `            ${(q(r.id) + ':').padEnd(28)} ${q(r.fahrer[0])},`).join('\n')}
        };
`;

console.log(`\nDateigroesse: ${(block.length / 1024).toFixed(1)} KB`);
if (!WRITE) { console.log('Trockenlauf — nichts geschrieben. Mit --write erzeugen.'); process.exit(0); }
fs.writeFileSync(OUT, block, 'utf8');
console.log(`${OUT} geschrieben.`);
