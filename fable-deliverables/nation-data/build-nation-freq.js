// ============================================================================
// build-nation-freq.js — Nationen-Frequenz aus großem Motorsport-Pool (Paket A v3)
//
// Quelle: Wikidata-SPARQL (wikidata-cardrivers-raw.json) —
//   12.209 AUTO-Rennfahrer (occupation im Subklassen-Baum von Q10349745
//   "racing automobile driver" ODER direkt Q378622 "racing driver") mit
//   Nationalität (P27) und Geburtsjahr (P569), aggregiert Land × Geburtsdekade.
//   Zweiräder (motorcycle racer/speedway — 5.600+ Fahrer, hätten POL/EST massiv
//   verzerrt) und Motorboote sind BEWUSST ausgeschlossen.
//
// Verarbeitung:
//   1. Land → IOC: P984 wo vorhanden, historische Staaten per Label-Map
//      (Kingdom of Italy → ITA, UdSSR → RUS, …), IOC-Alt-Codes normalisiert
//      (SPA→ESP, FRG/GDR→GER, URS→RUS, TCH→CZE, RHO→ZIM, …)
//   2. Geburtsdekade → Debüt-Dekade: +20 Jahre (Debüt Kart→Formel ~18–25)
//   3. Je Debüt-Dekade normalisierte Anteile; Länder <3 Fahrer je Dekade
//      bleiben als Rohcount erhalten (Filterung ist Integrations-Entscheidung)
//
// Reproduktion der Rohdaten (WDQS):
//   SELECT ?c ?cLabel (SAMPLE(?iocv) AS ?ioc) ?decade (COUNT(DISTINCT ?p) AS ?n)
//   WHERE { { ?p wdt:P106/wdt:P279* wd:Q10349745 . } UNION { ?p wdt:P106 wd:Q378622 . }
//     ?p wdt:P27 ?c . ?p wdt:P569 ?dob . OPTIONAL { ?c wdt:P984 ?iocv . }
//     BIND(FLOOR(YEAR(?dob)/10)*10 AS ?decade)
//     FILTER(YEAR(?dob) >= 1880 && YEAR(?dob) <= 2012)
//     SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }
//   GROUP BY ?c ?cLabel ?decade
//
// Aufruf: node build-nation-freq.js  → nation-frequency-by-decade.js + Konsolen-Report
// ============================================================================
'use strict';
const fs = require('fs');
const raw = require('./wikidata-cardrivers-raw.json');

// IOC-Alt-/Sondercodes → Spiel-IOC
const IOC_NORM = {
    'SPA':'ESP', 'FRG':'GER', 'GDR':'GER', 'SAA':'GER', 'EUA':'GER',
    'URS':'RUS', 'EUN':'RUS', 'ROC':'RUS', 'TCH':'CZE', 'BOH':'CZE',
    'YUG':'SRB', 'SCG':'SRB', 'RHO':'ZIM', 'BUR':'MYA', 'CEY':'SRI',
    'HOL':'NED', 'ANZ':'AUS', 'GBS':'GBR', 'MAL':'MAS', 'ZAI':'COD',
    'UAR':'EGY', 'PRK':'PRK', 'TWN':'TPE', 'ROM':'ROU', 'RUM':'ROU'
};
// Historische Staaten ohne P984 (Label → IOC)
const LABEL_MAP = {
    'Kingdom of Italy':'ITA', 'Kingdom of the Netherlands':'NED',
    'United Kingdom of Great Britain and Ireland':'GBR', 'Kingdom of Denmark':'DEN',
    'Empire of Japan':'JPN', 'German Reich':'GER', 'Nazi Germany':'GER', 'Prussia':'GER',
    'Austria–Hungary':'AUT', 'Austria-Hungary':'AUT',
    'Socialist Federal Republic of Yugoslavia':'SRB', 'Kingdom of Yugoslavia':'SRB',
    'Russian Empire':'RUS', 'Ottoman Empire':'TUR', 'British Hong Kong':'HKG',
    'Kingdom of Romania':'ROU', 'Kingdom of Portugal':'POR',
    'Federation of Rhodesia and Nyasaland':'ZIM', 'Southern Rhodesia':'ZIM',
    'Dominion of India':'IND', 'Isle of Man':'GBR', 'Kingdom of Greece':'GRE',
    'Weimar Republic':'GER', 'French Third Republic':'FRA', 'Irish Free State':'IRL',
    'Second Polish Republic':'POL', 'Czechoslovakia':'CZE', 'Soviet Union':'RUS',
    'West Germany':'GER', 'East Germany':'GER'
};
// Offensichtlicher Wikidata-Vandalismus/Datenmüll
const JUNK = new Set(['Colina', 'New Rearendia']);

const byBirth = {}; // birthDecade → { IOC → count }
let mapped = 0, droppedJunk = 0, droppedNoMap = [];
for (const b of raw.results.bindings) {
    const label = b.cLabel.value;
    const dec = +b.decade.value;
    const n = +b.n.value;
    if (JUNK.has(label)) { droppedJunk += n; continue; }
    let ioc = b.ioc ? b.ioc.value.toUpperCase() : null;
    if (ioc && IOC_NORM[ioc]) ioc = IOC_NORM[ioc];
    if (!ioc) ioc = LABEL_MAP[label] || null;
    if (!ioc || !/^[A-Z]{3}$/.test(ioc)) { droppedNoMap.push(`${label}:${n}`); continue; }
    if (!byBirth[dec]) byBirth[dec] = {};
    byBirth[dec][ioc] = (byBirth[dec][ioc] || 0) + n;
    mapped += n;
}

// Geburts- → Debüt-Dekade (+20 Jahre), Spiel-Fenster 1950–2020
const byDebut = {};
for (const [dec, nations] of Object.entries(byBirth)) {
    let debut = +dec + 20;
    if (debut < 1950) debut = 1950;   // Vorkriegs-Piloten sammeln sich in 1950
    if (debut > 2020) debut = 2020;
    if (!byDebut[debut]) byDebut[debut] = {};
    for (const [ioc, n] of Object.entries(nations)) byDebut[debut][ioc] = (byDebut[debut][ioc] || 0) + n;
}

// Anteile normalisieren
const shares = {};
for (const [dec, nations] of Object.entries(byDebut)) {
    const tot = Object.values(nations).reduce((a, b) => a + b, 0);
    shares[dec] = {};
    for (const [ioc, n] of Object.entries(nations).sort((a, b) => b[1] - a[1])) {
        shares[dec][ioc] = +(n / tot).toFixed(4);
    }
}

// F1-Blend: 50 % Motorsport-Pool + 50 % DECADE_NATION_POOLS (F1-Komponente aus dem
// Spiel = kuratiert/renormiert, KEINE Einzelfahrer-Artefakte à la Liechtenstein).
// Zieht die Verteilung Richtung F1-Realität (US-Breitensport ↓, Europa-Trichter ↑),
// behält aber den Long-Tail des großen Pools. λ ist bei Integration verhandelbar.
const F1_LAMBDA = 0.5;
const html = fs.readFileSync('../../index.html', 'utf8');
const dm = html.match(/const DECADE_NATION_POOLS = (\{[\s\S]*?\n\s*\});/);
const DECADES_F1 = dm ? eval('(' + dm[1] + ')') : null;
const sharesF1Blend = {};
if (DECADES_F1) {
    for (const [dec, nations] of Object.entries(shares)) {
        const f1 = (DECADES_F1[+dec] || DECADES_F1[2020]).weights;
        const all = new Set([...Object.keys(nations), ...Object.keys(f1)]);
        const raw = {};
        let tot = 0;
        for (const ioc of all) {
            const v = (1 - F1_LAMBDA) * (nations[ioc] || 0) + F1_LAMBDA * (f1[ioc] || 0);
            if (v > 0) { raw[ioc] = v; tot += v; }
        }
        sharesF1Blend[dec] = {};
        for (const [ioc, v] of Object.entries(raw).sort((a, b) => b[1] - a[1])) sharesF1Blend[dec][ioc] = +(v / tot).toFixed(4);
    }
}

// Emit
let out = `// ============================================================================
// MOTORSPORT_NATION_FREQ — Nationen-Frequenz je Debüt-Dekade (Fable, Paket A v3)
// Datengetrieben aus ${mapped.toLocaleString('de-DE')} AUTO-Rennfahrern (Wikidata, alle Serien/Ären,
// Zweiräder ausgeschlossen). GENERIERT von build-nation-freq.js — nicht von Hand editieren.
//
// counts = Roh-Fahrerzahlen (Basis für eigene Filter/Schwellen bei Integration),
// shares = normalisierte Anteile je Dekade.
// Nutzung (Opus-Integration): Basis-Verteilung der gesamten Motorsport-Welt.
// F1-/Junior-Ebene = gefilterte Ausschnitte (Trichter) — z.B. Mindest-Anteil,
// oder Verschneidung mit Renntradition. Ersetzt langfristig DECADE_NATION_POOLS
// und JUNIOR_NATIONS (aktuell 15 gleichgewichtet).
//
// Bekannte Verzerrungen (dokumentiert, bei Integration bedenken):
// - USA ~17–20 %: reale Breite (NASCAR/Indy/SCCA-Ligen), aber en-Wikipedia-Bias
//   wirkt zusätzlich. Für F1-Ausschnitte ggf. dämpfen (F1-Realität: US-Anteil klein).
// - 2020er (Geburtsjahrgänge ~2000+): Wikidata hinkt der Gegenwart nach —
//   Dekade dünner besetzt, ggf. mit 2010ern mischen.
// - Debüt = Geburtsdekade + 20 (Näherung Kart→Formel-Einstieg 18–25).
// ============================================================================

const MOTORSPORT_NATION_FREQ = {
    meta: { source: 'Wikidata (Q10349745-Baum ∪ Q378622 direkt)', drivers: ${mapped}, generated: '${new Date().toISOString().slice(0, 10)}', debutShift: 20 },
    counts: {
`;
for (const dec of Object.keys(byDebut).sort()) {
    const es = Object.entries(byDebut[dec]).sort((a, b) => b[1] - a[1]);
    out += `        ${dec}: { ${es.map(([i, n]) => `${i}:${n}`).join(', ')} },\n`;
}
out += `    },
    shares: {
`;
for (const dec of Object.keys(shares).sort()) {
    const es = Object.entries(shares[dec]);
    out += `        ${dec}: { ${es.map(([i, s]) => `${i}:${s}`).join(', ')} },\n`;
}
out += `    },
    // F1-Blend (λ=${F1_LAMBDA}): (1−λ)·Motorsport-Pool + λ·DECADE_NATION_POOLS des Spiels.
    // Für den F1-nahen Trichter (Reserve-Pool, F2/F3-Spitze); reine Kart-/Breiten-Basis → shares.
    sharesF1Blend: {
`;
for (const dec of Object.keys(sharesF1Blend).sort()) {
    const es = Object.entries(sharesF1Blend[dec]);
    out += `        ${dec}: { ${es.map(([i, s]) => `${i}:${s}`).join(', ')} },\n`;
}
out += `    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MOTORSPORT_NATION_FREQ };
}
`;
fs.writeFileSync('nation-frequency-by-decade.js', out);

// Report
console.log(`Gemappt: ${mapped} Fahrer | Junk: ${droppedJunk} | Ohne Mapping: ${droppedNoMap.length ? droppedNoMap.join(', ') : '(keine)'}`);
for (const dec of Object.keys(shares).sort()) {
    const es = Object.entries(shares[dec]).slice(0, 12);
    const tot = Object.values(byDebut[dec]).reduce((a, b) => a + b, 0);
    console.log(`${dec}er (n=${tot}): ${es.map(([i, s]) => `${i} ${(s * 100).toFixed(1)}%`).join(', ')}`);
}
