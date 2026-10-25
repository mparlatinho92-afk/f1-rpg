#!/usr/bin/env node
/**
 * build-rennkalender.js — Daten für das eigenständige Werkzeug rennkalender.html.
 *
 *   node tools/build-rennkalender.js [vonJahr] [bisJahr]     (Standard 1950–1985)
 *
 * Schritt 1: WM-Läufe aus F1DB (f1db-json-splitted/) mit Datum, Strecke, Koordinaten und allen
 * gemeldeten Fahrern (Starter, DNQ, DNPQ …). Zeitzone je Strecke = IANA-Zone des nächstgelegenen
 * Orts aus GeoNames cities500 (tools/quellen/geonames, CC BY 4.0) — so funktioniert dieselbe
 * Zuordnung später auch für Nicht-WM-Strecken. Sommerzeit rechnet der Browser (Intl, historisch).
 * Startzeiten hat F1DB vor 1985 keine einzige: das Werkzeug setzt 14 Uhr Ortszeit an.
 *
 * Ausgabe: rennkalender/daten-wm.js (const RK_WM = {...}), damit die Seite auch per file:// lädt.
 *
 * Schritt 2: Formel-1-Rennen ohne WM-Status aus Wikipedia (Rohdaten vorher: node tools/wiki-nwm-holen.js,
 * gelesen mit tools/wiki-nwm-lesen.js) → rennkalender/daten-nwm.js (const RK_NWM).
 * Stand 25.10.2026: 327 Rennen, davon 32 nur mit Sieger (kein Bericht oder keine Tabelle), 68 Strecken,
 * 5547 Einträge, 4395 (79 %) F1DB-Fahrern zugeordnet. Der Rest sind Fahrer ohne WM-Start (Horace Richards,
 * Jimmy Somervail, André Wicky …) und bekommt IDs "w-…". 522 Einträge DNA (gemeldet, nicht erschienen).
 * Fallen:
 *  - Saisonartikel haben teils mehrere Abschnitte mit "non-championship" (1951: erst "Pre-season …" ohne
 *    Tabelle), 1980/81 heißt er "Non-championship race". Alle passenden Abschnitte lesen.
 *  - prop=coordinates liefert ohne colimit=max nur 10 Koordinaten je Abfrage (81 von 102 fehlten still).
 *  - Name nur über Nachname + Initiale trifft falsch (Brian → Bill Whitehouse, Edward Miles-Martin → Eugène
 *    Martin). Jetzt: drei gleiche Anfangsbuchstaben und WM-Jahr in ±5 Jahren; Abweichungen im Log prüfen.
 *  - Vorläufe, Meldeliste und Ergebnis nennen denselben Fahrer mehrfach → je Rennen ein Eintrag.
 *
 * Schritt 3: Sportwagen-WM 1953–1985 aus der DEUTSCHEN Wikipedia (node tools/wiki-sportwagen-holen.js,
 * gelesen mit tools/wiki-sportwagen-lesen.js) → rennkalender/daten-sw.js (const RK_SW).
 * Stand 25.10.2026: 364 Läufe (alle mit Bericht; darin 14 Bergrennen und 3 Rallyes der GT-Wertung 1962–67),
 * 43 892 Fahrereinträge (jeder Fahrer eines Wagens einzeln), 6911 (16 %) mit F1DB-ID, 2,75 MB.
 * Fallen:
 *  - en.wikipedia hat 1961–1983 meist nur Le Mans (129 von 286 Berichten) → de.wikipedia (alle 364).
 *  - "Ergebnisse" umfasst "Schlussklassement" und "Nur in der Meldeliste": beide Ebenen gelesen → doppelte
 *    Tabellen (93 766 statt 46 883 Rohzeilen). Jede Tabelle nur einmal lesen.
 *  - Status steht in Zwischenzeilen ("Ausgefallen", "Nicht gestartet" …), die Pos.-Spalte zählt durch.
 *  - Unverlinkte Strecke im Rennkalender (schon weiter oben verlinkt): Text als Titel; Streckenrennen
 *    (Mille Miglia, Carrera Panamericana, Tour de France) → Startort.
 *  - "XXX" ist ein Platzhalter für unbekannte Fahrer (Rallye Wiesbaden 1963), keine Person.
 *  - Namensvetter (Nutzer-Hinweis 25.10.2026): "Dave Morgan" Sebring 1960–68 ist nicht der F1-Fahrer (*1944).
 *    Altersgrenze allein reicht nicht (1960 schon 15). Signal: von 470 Namen mit F1DB-Treffer sind nur 4 in der
 *    ganzen Quelle nie verlinkt (Dave Morgan 12×, Karl Wendlinger 3×, Jack Turner 2×, Art Cross 2×) → kein
 *    gleichnamiger Treffer ohne Artikel. Dazu Lebensdaten: ≥ 15 am Renntag, höchstens ein Jahr tot (Tote stehen
 *    noch in Meldelisten: Bianchi, Hansgen, Giunti). Alberto Augusto Crespo 1953 laut Rennbericht der F1-Fahrer
 *    (ALIAS); Richard Gibson Le Mans 1958 (DNS, Peerless) nicht zu klären, bleibt getrennt. 6938 → 6911 F1DB-Einträge.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const [VON = 1950, BIS = 1985] = process.argv.slice(2).map(Number);
const ROOT = path.join(__dirname, '..');
const DB = path.join(ROOT, 'f1db-json-splitted');
const lade = f => JSON.parse(fs.readFileSync(path.join(DB, f), 'utf8'));

const rennen = lade('f1db-races.json').filter(r => r.year >= VON && r.year <= BIS);
const rennIds = new Set(rennen.map(r => r.id));
const ergebnisse = lade('f1db-races-race-results.json').filter(e => rennIds.has(e.raceId));
const strecken = new Map(lade('f1db-circuits.json').map(c => [c.id, c]));
const laender = new Map(lade('f1db-countries.json').map(c => [c.id, c]));
const fahrer = new Map(lade('f1db-drivers.json').map(d => [d.id, d]));
const konstrukteure = new Map(lade('f1db-constructors.json').map(c => [c.id, c]));
const grandsPrix = new Map(lade('f1db-grands-prix.json').map(g => [g.id, g]));

// --- Zeitzone: nächster GeoNames-Ort (Spalten: 1 Name, 4 lat, 5 lon, 8 Land ISO-2, 17 timezone) ---
const orte = [];
for (const z of fs.readFileSync(path.join(ROOT, 'tools/quellen/geonames/cities500.txt'), 'utf8').split('\n')) {
    const s = z.split('\t');
    if (s.length > 17 && s[17]) orte.push([+s[4], +s[5], s[17], s[1], s[8]]);
}
function naechsterOrt(lat, lon) {
    let best = null, bestD = Infinity;
    const cosLat = Math.cos(lat * Math.PI / 180);
    for (const o of orte) {
        const d = (o[0] - lat) ** 2 + ((o[1] - lon) * cosLat) ** 2;
        if (d < bestD) { bestD = d; best = o; }
    }
    return { tz: best[2], name: best[3], land: best[4] };
}
const zeitzone = (lat, lon) => naechsterOrt(lat, lon).tz;

const outStrecken = {}, outFahrer = {}, outTeams = {};
for (const id of new Set(rennen.map(r => r.circuitId))) {
    const c = strecken.get(id);
    outStrecken[id] = { name: c.fullName || c.name, ort: c.placeName, land: (laender.get(c.countryId) || {}).name || c.countryId,
        lat: c.latitude, lon: c.longitude, tz: zeitzone(c.latitude, c.longitude) };
}
const outRennen = rennen.sort((a, b) => a.date.localeCompare(b.date)).map(r => {
    const feld = ergebnisse.filter(e => e.raceId === r.id).sort((a, b) => a.positionDisplayOrder - b.positionDisplayOrder);
    for (const e of feld) {
        if (!outFahrer[e.driverId]) {
            const d = fahrer.get(e.driverId);
            outFahrer[e.driverId] = { n: d.name, nat: (laender.get(d.nationalityCountryId) || {}).alpha3Code || '' };
        }
        if (!outTeams[e.constructorId]) outTeams[e.constructorId] = (konstrukteure.get(e.constructorId) || {}).name || e.constructorId;
    }
    return { id: 'wm-' + r.id, serie: 'F1-WM', datum: r.date, name: (grandsPrix.get(r.grandPrixId) || {}).fullName || r.officialName,
        strecke: r.circuitId, feld: feld.map(e => [e.driverId, e.positionText, e.constructorId]) };
});

const kopf = `// GENERIERT von tools/build-rennkalender.js — nicht von Hand editieren.\n`
    + `// Quelle: F1DB (CC BY 4.0) ${VON}–${BIS}, Zeitzonen GeoNames cities500 (CC BY 4.0).\n`;
const ziel = path.join(ROOT, 'rennkalender', 'daten-wm.js');
fs.mkdirSync(path.dirname(ziel), { recursive: true });
fs.writeFileSync(ziel, kopf + 'const RK_WM = ' + JSON.stringify({ von: VON, bis: BIS, strecken: outStrecken,
    fahrer: outFahrer, teams: outTeams, rennen: outRennen }) + ';\n', 'utf8');

const zonen = {};
Object.values(outStrecken).forEach(s => { zonen[s.tz] = (zonen[s.tz] || 0) + 1; });
console.log(`${outRennen.length} Rennen, ${Object.keys(outStrecken).length} Strecken, ${Object.keys(outFahrer).length} Fahrer, `
    + `${ergebnisse.length} Meldungen → ${path.relative(ROOT, ziel)} (${(fs.statSync(ziel).size / 1024).toFixed(0)} KB)`);
console.log('Zeitzonen: ' + Object.entries(zonen).map(([z, n]) => `${z} ${n}`).join(' · '));

// =====================================================================================================
// Schritt 2 und 3: Wikipedia-Quellen (Rohdaten vorher holen, siehe Dateikopf)
//   F1 Nicht-WM  — en.wikipedia, node tools/wiki-nwm-holen.js        → rennkalender/daten-nwm.js (RK_NWM)
//   Sportwagen-WM — de.wikipedia, node tools/wiki-sportwagen-holen.js → rennkalender/daten-sw.js  (RK_SW)
// Strecken und Fahrer ohne F1DB-ID bekommen quellenübergreifend dieselbe ID "w-…" (gleicher Ort in 8 km,
// gleicher Name), damit ein Fahrer in Nicht-WM und Sportwagen derselbe ist.
// =====================================================================================================
const { saisonZeilen, berichtFeld } = require('./wiki-nwm-lesen.js');
const { saisonZeilenDe, berichtFeldDe } = require('./wiki-sportwagen-lesen.js');

// Orte, deren Artikel keine Koordinaten tragen (Stand 25.10.2026), von Hand nachgeschlagen
const KOORD_NACHTRAG = {
    'Lungomare': [41.13, 16.87], 'Nürburgring': [50.335, 6.947], 'Skarpnäck Airfield': [59.27, 18.13],
    'RAF Charterhall': [55.70, -2.38], 'Halle-Saale-Schleife': [51.50, 11.92], 'Aspern Aerodrome': [48.23, 16.50],
    'Westmead Circuit': [-29.83, 30.93], 'Roy Hesketh': [-29.63, 30.41], 'Brandkop': [-29.17, 26.18],
    'Bordeaux Circuit': [44.84, -0.58], 'Winfield, Scotland': [55.74, -2.13],
    // Sportwagen (de.wikipedia)
    'Autódromo Municipal-Avenida Paz': [-34.69, -58.46], 'Circuito de la Costanera Norte': [-34.56, -58.40],
    'Piccolo circuito delle Madonie': [37.95, 13.80], 'Circuito del Garda': [45.60, 10.52],
    'Bridgehampton Race Circuit': [40.97, -72.31], 'Passo della Consuma': [43.79, 11.59],
    'Schauinslandstraße': [47.91, 7.90], 'Circuit de Dijon': [47.36, 4.90],
};
const laenderIso2 = new Map([...laender.values()].map(c => [c.alpha2Code, c]));
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
const slug = s => norm(s).replace(/ /g, '-');

// Strecke: innerhalb 8 km einer F1DB-Strecke → deren ID (gleicher Ort wie WM-Lauf), sonst erste Wiki-Strecke in 8 km.
// 8 statt 3 km: Wiki verlinkt teils die Stadt (East London) statt der Strecke (Prince George Circuit).
const f1dbStrecken = [...strecken.values()];
const wStrecken = {};
function strecke(koordQuelle, ortTitel, ortText) {
    const k = koordQuelle[ortTitel] || KOORD_NACHTRAG[ortTitel];
    if (!k) return null;
    const p = { lat: k[0], lon: k[1] };
    const nah = (a, b) => Math.hypot(a.lat - b.lat, (a.lon - b.lon) * Math.cos(a.lat * Math.PI / 180)) * 111 < 8;
    const f = f1dbStrecken.find(c => nah(p, { lat: c.latitude, lon: c.longitude }));
    if (f) {
        if (!wStrecken[f.id]) wStrecken[f.id] = { name: f.fullName || f.name, ort: f.placeName,
            land: (laender.get(f.countryId) || {}).name || f.countryId, lat: f.latitude, lon: f.longitude, tz: zeitzone(f.latitude, f.longitude) };
        return f.id;
    }
    const w = Object.entries(wStrecken).find(([id, s]) => id.startsWith('w-') && nah(p, s));
    if (w) return w[0];
    const o = naechsterOrt(p.lat, p.lon), id = 'w-' + slug(ortTitel);
    wStrecken[id] = { name: ortText || ortTitel, ort: ortText || o.name, land: (laenderIso2.get(o.land) || {}).name || o.land, lat: p.lat, lon: p.lon, tz: o.tz };
    return id;
}

// Fahrer: Name → F1DB-ID; bei Namensgleichheit der mit WM-Starts im nächstgelegenen Jahr. Sonst eigene ID "w-…".
const jahreJeFahrer = new Map();
for (const e of lade('f1db-races-race-results.json')) {
    if (!jahreJeFahrer.has(e.driverId)) jahreJeFahrer.set(e.driverId, []);
    jahreJeFahrer.get(e.driverId).push(e.year);
}
const nachName = new Map();
for (const d of fahrer.values()) for (const n of [d.name, d.fullName, d.firstName + ' ' + d.lastName]) {
    if (!n) continue;
    const k = norm(n);
    if (!nachName.has(k)) nachName.set(k, new Set());
    nachName.get(k).add(d.id);
}
// Wikipedia-Namen, die F1DB anders führt
const ALIAS = { 'giuseppe farina': 'nino-farina', 'b bira': 'birabongse-bhanudej', 'prince bira': 'birabongse-bhanudej',
    'toulo de graffenried': 'emmanuel-de-graffenried', 'mario de cabral': 'mario-de-araujo-cabral', 'mario cabral': 'mario-de-araujo-cabral',
    // unverlinkt, laut Rennbericht derselbe Fahrer (Nutzer 25.10.2026)
    'alberto augusto crespo': 'alberto-crespo' };
for (const [n, id] of Object.entries(ALIAS)) nachName.set(n, new Set([id]));
// Zweiter Versuch: gleicher Nachname, Vorname mit denselben drei Anfangsbuchstaben (Geoff/Geoffrey, Denis/Denny),
// genau ein F1DB-Fahrer mit WM-Jahr in ±5 Jahren. Nur Initiale traf falsch (Brian → Bill Whitehouse).
const nachNachname = new Map();
for (const d of fahrer.values()) {
    const k = norm(d.lastName || '');
    if (!nachNachname.has(k)) nachNachname.set(k, []);
    nachNachname.get(k).push(d);
}
// Lebensdaten: am Renntag mindestens 15 und höchstens ein Jahr tot. Namensvetter sonst zusammengelegt: Dave Morgan (F1, *1944)
// bekam die Sebring-Starts 1960–68 des gleichnamigen Amerikaners. Tote stehen noch in Meldelisten (Bianchi, Hansgen nach
// Testunfällen; Giunti starb am Renntag), daher erst ab einem Jahr nach dem Tod getrennt (Eddie Johnson 1978).
const moeglich = (id, datum) => { const d = fahrer.get(id); if (!d) return true;
    const alt = d.dateOfBirth ? (Date.parse(datum) - Date.parse(d.dateOfBirth)) / 3.15576e10 : 99;
    return alt >= 15 && !(d.dateOfDeath && Date.parse(datum) - Date.parse(d.dateOfDeath) > 3.15576e10); };
function nachInitiale(name, jahr, datum) {
    const teile = norm(name).split(' ');
    if (teile.length < 2) return null;
    const kandidaten = (nachNachname.get(teile.slice(1).join(' ')) || []).filter(d => norm(d.firstName || '').slice(0, 3) === teile[0].slice(0, 3)
        && moeglich(d.id, datum) && (jahreJeFahrer.get(d.id) || []).some(j => Math.abs(j - jahr) <= 5));
    return kandidaten.length === 1 ? kandidaten[0].id : null;
}
const wFahrer = {};
function fahrerId(e, datum, log) {
    const jahr = +datum.slice(0, 4);
    // In der ganzen Quelle nie verlinkt = kein Wikipedia-Artikel = kein F1-Fahrer, der gleichnamige Treffer gilt nicht
    // (Sportwagen-WM: 4 von 470 Namen, u. a. Dave Morgan Sebring 1960–68; der F1-Fahrer steht 1975 verlinkt als
    // "David Morgan"). Die Näherung bleibt: Tippfehler wie "Oliver Gendebien" sind meist unverlinkt.
    const ohneArtikel = e.fahrerZiel === null && !log.verlinkt.has(norm(e.fahrer)) && !ALIAS[norm(e.fahrer)];
    if (ohneArtikel && nachName.has(norm(e.fahrer))) log.ohneArtikel.add(e.fahrer);
    for (const n of [e.fahrer, e.fahrerZiel].filter(Boolean)) {
        let ids = ohneArtikel ? null : nachName.get(norm(n));
        if (ids) {
            const weg = [...ids].filter(id => !moeglich(id, datum));
            for (const id of weg) log.lebensdaten.add(`${n} ${jahr} ≠ ${fahrer.get(id).name} (*${fahrer.get(id).dateOfBirth})`);
            ids = ids.size > weg.length ? new Set([...ids].filter(id => moeglich(id, datum))) : null;
            if (!ids) continue;
        }
        if (!ids) {
            const id = nachInitiale(n, jahr, datum);
            if (id) { ids = new Set([id]); log.naeherung.add(`${n} → ${fahrer.get(id).name}`); }
        }
        if (!ids) continue;
        const id = [...ids].sort((a, b) => Math.min(...(jahreJeFahrer.get(a) || [9999]).map(j => Math.abs(j - jahr)))
            - Math.min(...(jahreJeFahrer.get(b) || [9999]).map(j => Math.abs(j - jahr))))[0];
        if (!wFahrer[id]) {
            const d = fahrer.get(id);
            wFahrer[id] = { n: d.name, nat: (laender.get(d.nationalityCountryId) || {}).alpha3Code || '' };
        }
        return id;
    }
    const id = 'w-' + slug(e.fahrer);
    if (!wFahrer[id]) wFahrer[id] = { n: e.fahrer, nat: '' };
    log.unbekannt.set(e.fahrer, (log.unbekannt.get(e.fahrer) || 0) + 1);
    return id;
}

// Je Fahrer ein Eintrag (Vorläufe, Meldeliste und Ergebnis nennen ihn mehrfach): Ergebnis vor Status vor leer vor DNA
const rang = p => /^\d+$/.test(p) ? 0 : p === 'DNA' ? 3 : p ? 1 : 2;
function importiere({ name, datei, konstante, rohdatei, kopf, serie, idPrefix, zeilenAus, feldAus }) {
    const roh = path.join(ROOT, 'tools/quellen', rohdatei);
    if (!fs.existsSync(roh)) { console.log(`${name} übersprungen: Rohdaten ${rohdatei} fehlen`); return; }
    const wiki = JSON.parse(fs.readFileSync(roh, 'utf8'));
    const log = { naeherung: new Set(), unbekannt: new Map(), lebensdaten: new Set(), ohneArtikel: new Set(), verlinkt: new Set() };
    for (const b of Object.values(wiki.berichte)) if (b) for (const e of feldAus(b.text).feld) if (e.fahrerZiel) log.verlinkt.add(norm(e.fahrer));
    const aus = [], ohneOrt = [];
    let ohneFeld = 0;
    for (const [jahr, text] of Object.entries(wiki.saisons)) {
        if (!text || +jahr < VON || +jahr > BIS) continue;
        for (const z of zeilenAus(text, +jahr)) {
            const b = z.bericht && wiki.berichte[z.bericht];
            const inhalt = b ? feldAus(b.text) : { ort: null, feld: [] };
            const sid = strecke(wiki.koord, z.ort, z.ortText) || strecke(wiki.koord, inhalt.ort, z.ortText);
            if (!sid) { ohneOrt.push(`${z.datum} ${z.name} (${z.ort || z.ortText})`); continue; }
            const je = new Map();
            for (const e of inhalt.feld) {
                const id = fahrerId(e, z.datum, log), alt = je.get(id);
                if (!alt || rang(e.pos) < rang(alt[1])) je.set(id, [id, e.pos, e.team]);
            }
            // Ohne Bericht oder Tabelle bleibt nur der Sieger aus der Saisonübersicht
            if (!je.size && z.sieger) { ohneFeld++; je.set('s', [fahrerId({ fahrer: z.sieger }, z.datum, log), '1', '']); }
            aus.push({ id: idPrefix + z.datum + '-' + slug(z.name), serie, datum: z.datum, ...(z.bis ? { bis: z.bis } : {}),
                name: z.name, strecke: sid, quelle: b ? b.titel : null, feld: [...je.values()] });
        }
    }
    aus.sort((a, b) => a.datum.localeCompare(b.datum));
    // Nur die Strecken und Fahrer, die diese Datei braucht
    const st = {}, fa = {}, teams = {};
    for (const r of aus) {
        if (!outStrecken[r.strecke]) st[r.strecke] = wStrecken[r.strecke];
        for (const e of r.feld) { if (!outFahrer[e[0]]) fa[e[0]] = wFahrer[e[0]]; if (e[2]) teams[e[2]] = e[2]; }
    }
    const zielDatei = path.join(ROOT, 'rennkalender', datei);
    fs.writeFileSync(zielDatei, `// GENERIERT von tools/build-rennkalender.js — nicht von Hand editieren.\n${kopf}`
        + `const ${konstante} = ` + JSON.stringify({ strecken: st, fahrer: fa, teams, rennen: aus }) + ';\n', 'utf8');
    const eintraege = aus.reduce((s, r) => s + r.feld.length, 0);
    const zugeordnet = aus.reduce((s, r) => s + r.feld.filter(e => !e[0].startsWith('w-')).length, 0);
    console.log(`${name}: ${aus.length} Rennen (${ohneFeld} nur mit Sieger), ${Object.keys(st).length} Strecken, `
        + `${eintraege} Einträge, davon ${zugeordnet} F1DB-Fahrern zugeordnet → rennkalender/${datei} (${(fs.statSync(zielDatei).size / 1024).toFixed(0)} KB)`);
    if (ohneOrt.length) console.log('  ohne Ort: ' + ohneOrt.join(' · '));
    console.log('  über Nachname + Initiale: ' + [...log.naeherung].join(' · '));
    console.log('  nie verlinkt, nicht F1DB: ' + ([...log.ohneArtikel].join(' · ') || 'keine'));
    console.log('  Namensvetter nach Lebensdaten getrennt: ' + ([...log.lebensdaten].join(' · ') || 'keine'));
    console.log('  häufigste ohne F1DB-ID: ' + [...log.unbekannt].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([n, k]) => `${n} ${k}`).join(' · '));
}

importiere({ name: 'Nicht-WM', datei: 'daten-nwm.js', konstante: 'RK_NWM', rohdatei: 'wiki-nwm.json', serie: 'F1-NWM', idPrefix: 'nwm-',
    kopf: `// Quelle: englische Wikipedia (CC BY-SA 4.0), Saisonartikel "<Jahr> Formula One season" und Rennberichte;\n`
        + `// Fahrer-IDs nach F1DB, Zeitzonen GeoNames. Team = Konstrukteur als Text.\n`,
    zeilenAus: saisonZeilen, feldAus: berichtFeld });
importiere({ name: 'Sportwagen-WM', datei: 'daten-sw.js', konstante: 'RK_SW', rohdatei: 'wiki-sportwagen.json', serie: 'SW-WM', idPrefix: 'sw-',
    kopf: `// Quelle: deutsche Wikipedia (CC BY-SA 4.0), Saisonartikel "Sportwagen-Weltmeisterschaft <Jahr>" und Rennberichte;\n`
        + `// alle Fahrer eines Wagens einzeln, Fahrer-IDs nach F1DB, Zeitzonen GeoNames. Team = Bewerber als Text.\n`,
    zeilenAus: saisonZeilenDe, feldAus: berichtFeldDe });

