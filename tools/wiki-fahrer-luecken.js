#!/usr/bin/env node
/**
 * wiki-fahrer-luecken.js — welche Rennserien fuhren die F1-Fahrer der Ära (Debüt bis 1985) außerdem,
 * und welche davon fehlen dem Rennkalender? Rohdaten: tools/wiki-fahrer-holen.js.
 *
 * Drei Quellen je Artikel:
 *   1. Tabelle "Career summary" (Season | Series | … | Races): Serie, Jahr, Rennzahl.
 *   2. Abschnitte "Complete <Serie> results": Jahre aus der ersten Spalte, Rennzahl aus belegten Ergebniszellen.
 *   3. Kategorien "<Serie> drivers": ohne Jahr, nur Zusatz für Fahrer ohne Tabellen.
 * Gezählt werden nur Jahre 1950–1985.
 *
 * Stand 25.10.2026: 668 Fahrer (Debüt bis 1985), 667 Artikel (Thomas Monarch ohne), 644 mit auswertbarer
 * Tabelle, 8132 Fahrer × Serie × Jahr. Größte Lücken (Fahrer / Fahrer-Jahre 1950–85):
 *   US-Champ-Car AAA/USAC/CART 81 / 548 (dazu Indy 500 nach 1960 ~280) · Tourenwagen 87 / 259 (BSCC 68 / 165)
 *   · Formel 2 69 / 203 (EM ab 1967: 61 / 184) · Sportwagen außerhalb der WM ~230 (Le Mans 1950–52/56/75–77,
 *   12 h Reims/Pescara/Casablanca/Hyères, Mille Miglia 1950–52) · Formel 3 46 / 91 · Can-Am 24 / 88
 *   · Britische F1 (Shellsport/Aurora) 26 / 78 · Japan 20 / 72 · Motorrad 10 / 59 · Tasman 17 / 54 · F5000 20 / 51.
 * Deckung des Importierten (--deckung): Nicht-WM 98 % (588/600), Sportwagen-WM 99 % (282/284), Le Mans 85 %
 * (630/738; 103 der 108 fehlenden in Jahren ohne WM-Status), Sebring/Daytona 98 %.
 * Fallen:
 *  - {{sortname}} hat benannte Parameter (dab=racing driver → Artikel "Name (racing driver)"): 97 Artikel fehlten.
 *  - Muster-Reihenfolge: "Formula One non-championship" vor das F1-WM-Muster, sonst fällt Nicht-WM in die WM;
 *    "British Sports Car Championship" endet auf "Sports Car Championship" ≠ Sportwagen-WM.
 *  - Rennzahl aus "Complete … results" zählt bei Le Mans Spalten (Runden, Klasse) mit → nur Fahrer-Jahre vergleichen.
 *  - Nachwuchs/Club 1950er–60er fehlen in den Tabellen fast ganz (Formel Junior 2 Fahrer-Jahre, F2 1950er 0):
 *    Abwesenheit hier ist kein Befund, dafür formula2.se o. Ä.
 *
 * Aufruf: node tools/wiki-fahrer-luecken.js [--roh] [--deckung] [--serie <Muster>]
 *   --roh      Serien ohne Zusammenfassung zu Gruppen (zum Pflegen von GRUPPEN)
 *   --serie    Fahrer und Jahre einer Gruppe auflisten
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { klar, links, tabelle, tabellen } = require('./wiki-nwm-lesen.js');
const roh = JSON.parse(fs.readFileSync(path.join(__dirname, 'quellen', 'wiki-fahrer.json'), 'utf8'));
const ARG = process.argv.slice(2), ROH = ARG.includes('--roh'), SERIE = ARG.includes('--serie') ? ARG[ARG.indexOf('--serie') + 1] : null;
const VON = 1950, BIS = 1985;

// Seriennamen aus Link oder Text: Jahreszahl vorn, "season" hinten weg
const serieAus = zelle => {
    const l = links(zelle)[0], t = (l ? l.ziel : klar(zelle)).replace(/#.*$/, '');
    return t.replace(/^\d{4}(\s*[–-]\s*\d{2,4})?\s+/, '').replace(/\s+(season|Season)$/, '').replace(/\s+/g, ' ').trim();
};

// Gruppen: Muster → Name. Reihenfolge zählt (erstes passendes Muster gewinnt). "drin" = schon im Rennkalender.
const GRUPPEN = [
    [/non-championship|^Non-Championship/i, 'F1 Nicht-WM', 'drin'],
    [/^Formula One|World Championship results$|^FIA World Drivers|^World (Drivers' )?Championship( Grand Prix)?$/i, 'F1-WM', 'drin'],
    [/^(World Sportscar|World Endurance|World Challenge for Endurance|World Sports-Prototype|World Championship for Makes|International Championship for Makes|World Manufacturers)/i, 'Sportwagen-WM', 'drin'],
    [/Le Mans/i, '24 h Le Mans', 'drin außer 1956, 1975'],
    [/Indianapolis 500|Indy 500/i, 'Indianapolis 500', 'drin 1950–60'],
    [/AAA|USAC|Champ ?Car|CART|IndyCar|Championship Car|PPG Indy/i, 'US-Champ-Car (AAA/USAC/CART)'],
    [/Motorcycle|motorcycle|500cc|350cc|Isle of Man/i, 'Motorrad'],
    [/Japan|Fuji|Super Formula|Top Formula/i, 'Japan (Formel, Fuji GC)'],
    [/Formula 3000/i, 'Formel 3000'],
    [/Formula Two|Formula 2\b/i, 'Formel 2'],
    [/Formula Three|Formula 3\b/i, 'Formel 3'],
    [/Formula Junior/i, 'Formel Junior'],
    [/Formula Ford/i, 'Formel Ford'],
    [/Formula Renault/i, 'Formel Renault'],
    [/Formula Vee|Super Vee|Formula V\b/i, 'Formel V / Super Vee'],
    [/British Formula One|Aurora|Shellsport/i, 'Britische F1 (Shellsport/Aurora)'],
    [/Formula 5000|F5000|Formula A\b|Rothmans/i, 'Formel 5000'],
    [/Tasman/i, 'Tasman-Serie'],
    [/Formula Atlantic|Formula Pacific/i, 'Formel Atlantic / Pacific'],
    [/Can-Am|Canadian-American/i, 'Can-Am'],
    [/Procar/i, 'BMW M1 Procar'],
    [/NASCAR|Stock Car|ARCA|IROC/i, 'NASCAR / Stockcar'],
    [/Bathurst|Hardie|Touring|Saloon|Tourenwagen|DTM|Deutsche Rennsport|Turismo|Tourisme/i, 'Tourenwagen (inkl. Bathurst, DRM)'],
    [/IMSA|Trans-Am|Trans-American|SCCA|USRRC|Road Racing Championship/i, 'US-Sportwagen (IMSA, Trans-Am, USRRC)'],
    [/Sebring|Daytona|Watkins Glen|Road America|Riverside/i, 'US-Langstrecke (Sebring, Daytona …)'],
    [/Mille Miglia|Carrera Panamericana|Targa/i, 'Straßenrennen (Mille Miglia, Carrera, Targa)'],
    [/Interserie|Sportscar|Sports car|Sports Car|Group C|Prototype|GT Championship|Nürburgring|1000 ?km|Spa 24|24 Hours of Spa|Tourist Trophy|Reims|Pescara|Casablanca|Hyères|Hours|Endurance|Trophées de France|Norisring/i, 'sonstige Sportwagen/Langstrecke'],
    [/Rally|Rallye|WRC|Dakar/i, 'Rallye'],
    [/Hill ?Climb|Bergrennen|Mountain/i, 'Bergrennen'],
    [/Macau|Race of Champions/i, 'Einzelrennen (Macau …)'],
    [/Grand Prix|Temporada|Formula Libre|Formula Mondial|Australian Drivers|New Zealand|Gold Star/i, 'nationale Formel-Rennen / Formel Libre'],
    [/Kart|CIK|100cc/i, 'Kart'],
];
const gruppe = s => { for (const [re, n, st] of GRUPPEN) if (re.test(s)) return [n, st || '']; return [s, '?']; };

const eintraege = []; // { fahrer, serie, jahr, rennen, quelle }
const ausKategorie = []; // { fahrer, serie }
for (const f of roh.liste.filter(f => Math.min(...f.jahre) <= BIS)) {
    const w = roh.artikel[f.artikel];
    if (!w) continue;
    const kopfe = [...w.matchAll(/\n(={2,4})\s*([^=\n]+?)\s*\1[ \t]*(?=\n)/g)];
    for (let i = 0; i < kopfe.length; i++) {
        const titel = kopfe[i][2], start = kopfe[i].index, ende = i + 1 < kopfe.length ? kopfe[i + 1].index : w.length;
        const text = w.slice(start, ende);
        const summary = /career summary|racing record|career results/i.test(titel);
        const komplett = titel.match(/^(?:Complete\s+)?(.+?)\s+(?:results|record)$/i);
        if (!summary && !komplett) continue;
        for (const t of tabellen(text)) {
            const z = tabelle(t), kopf = z.find(r => r.filter(c => c.kopf).length >= 2);
            if (!kopf) continue;
            const sp = re => kopf.findIndex(c => re.test(klar(c.inhalt)));
            const sJahr = sp(/^(season|year)/i), sSerie = sp(/^(series|championship|class)/i), sRennen = sp(/^(races|starts)/i);
            if (summary && sJahr >= 0 && sSerie >= 0) {
                for (const r of z) {
                    if (r === kopf || !r[sJahr] || !r[sSerie]) continue;
                    const jahr = +(klar(r[sJahr].inhalt).match(/\d{4}/) || [])[0];
                    if (!(jahr >= VON && jahr <= BIS)) continue;
                    const serie = serieAus(r[sSerie].inhalt);
                    if (!serie || /^series$/i.test(serie)) continue;
                    const rennen = sRennen >= 0 && r[sRennen] ? parseInt(klar(r[sRennen].inhalt)) || 0 : 0;
                    eintraege.push({ fahrer: f.name, serie, jahr, rennen, quelle: 'summary' });
                }
            } else if (komplett) {
                const serie = komplett[1].replace(/^(Complete|Full)\s+/i, '');
                for (const r of z) {
                    if (r === kopf || !r[0]) continue;
                    const jahr = +(klar(r[0].inhalt).match(/^\D{0,3}(\d{4})/) || [])[1];
                    if (!(jahr >= VON && jahr <= BIS)) continue;
                    // Rennzahl: belegte Zellen mit Platz oder Ausfallkürzel
                    const rennen = r.slice(1).filter(c => /^(\d{1,2}|Ret|DNF|DNS|DSQ|NC|DNQ|DNPQ|EX|WD)\b/i.test(klar(c.inhalt).replace(/\s.*$/, ''))).length;
                    eintraege.push({ fahrer: f.name, serie, jahr, rennen, quelle: 'komplett' });
                }
            }
        }
    }
    for (const m of w.matchAll(/\[\[Category:([^\]|]+?) (?:drivers|racers|riders)\b/g)) {
        const k = m[1];
        // Team- und Herkunftskategorien sind keine Serie
        if (/Formula One$|racing$|^(?:[A-Z][a-z]+ ){0,2}(?:from|in)\b/.test(k) || / Formula One/.test(k + ' ') && !/World/.test(k)) continue;
        ausKategorie.push({ fahrer: f.name, serie: k });
    }
}

const era = roh.liste.filter(f => Math.min(...f.jahre) <= BIS);
const mitTabelle = new Set(eintraege.map(e => e.fahrer));
console.log(`${era.length} Fahrer mit Debüt bis ${BIS}; mit auswertbarer Tabelle ${mitTabelle.size}, `
    + `${eintraege.length} Einträge (Fahrer × Serie × Jahr) ${VON}–${BIS}`);

// --deckung: Fahrer-Jahre der schon importierten Serien gegen rennkalender/daten-*.js (Fahrer über F1DB-Namen)
if (ARG.includes('--deckung')) {
    const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/ +/g, ' ').trim();
    const idJe = new Map();
    for (const d of JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'f1db-json-splitted', 'f1db-drivers.json'), 'utf8')))
        for (const n of [d.name, d.fullName]) if (n && !idJe.has(norm(n))) idJe.set(norm(n), d.id);
    const da = new Set(), namen = new Map(); // namen: Fahrer+Jahr → Renn- und Streckennamen (Einzelrennen-Abgleich)
    for (const [datei, k] of [['daten-nwm.js', 'RK_NWM'], ['daten-sw.js', 'RK_SW']]) {
        const RK = new Function(fs.readFileSync(path.join(__dirname, '..', 'rennkalender', datei), 'utf8') + ';return ' + k)();
        for (const r of RK.rennen) for (const e of r.feld) {
            da.add(r.serie + e[0] + r.datum.slice(0, 4));
            if (/Le Mans/.test(r.name)) da.add('LM' + e[0] + r.datum.slice(0, 4));
            const k = e[0] + r.datum.slice(0, 4);
            namen.set(k, (namen.get(k) || '') + ' ' + (r.name + ' ' + (RK.strecken[r.strecke] || {}).name).toLowerCase());
        }
    }
    // Einzelrennen (Sebring, Mille Miglia …): gefunden, wenn ein Rennen desselben Jahres ein Kennwort des Seriennamens trägt
    const kennwoerter = s => s.toLowerCase().split(/[^a-zà-ü]+/).filter(w => w.length > 3 && !/^(hours|grand|prix|race|trophy|international|championship|cup|series)$/.test(w));
    for (const [g, schl] of [['F1 Nicht-WM', 'F1-NWM'], ['Sportwagen-WM', 'SW-WM'], ['24 h Le Mans', 'LM'],
        ['US-Langstrecke (Sebring, Daytona …)', null], ['Straßenrennen (Mille Miglia, Carrera, Targa)', null], ['sonstige Sportwagen/Langstrecke', null]]) {
        const fj = new Map();
        for (const e of eintraege) if (gruppe(e.serie)[0] === g) fj.set(e.fahrer + '|' + e.jahr, e);
        let ohneId = 0; const fehlt = [];
        for (const [k] of fj) {
            const [n, j] = k.split('|'), id = idJe.get(norm(n));
            if (!id) { ohneId++; continue; }
            const e = fj.get(k);
            const ok = schl ? da.has(schl + id + j) : kennwoerter(e.serie).some(w => (namen.get(id + j) || '').includes(w));
            if (!ok) fehlt.push(schl ? n + ' ' + j : `${n} ${e.serie} ${j}`);
        }
        const geprueft = fj.size - ohneId;
        console.log(`${g}: ${geprueft} Fahrer-Jahre prüfbar, ${geprueft - fehlt.length} gefunden (${Math.round(100 - 100 * fehlt.length / geprueft)} %), `
            + `fehlen ${fehlt.length}: ${fehlt.sort((a, b) => a.slice(-4) - b.slice(-4)).slice(0, 40).join(' · ')}${fehlt.length > 40 ? ' …' : ''}`);
    }
    process.exit(0);
}
if (SERIE) {
    const re = new RegExp(SERIE, 'i'), je = new Map();
    for (const e of eintraege) if (re.test(gruppe(e.serie)[0]) || re.test(e.serie)) {
        if (!je.has(e.fahrer)) je.set(e.fahrer, []);
        je.get(e.fahrer).push(e.jahr + (e.rennen ? `(${e.rennen})` : ''));
    }
    for (const [f, j] of [...je].sort((a, b) => b[1].length - a[1].length)) console.log(f.padEnd(28), [...new Set(j)].sort().join(' '));
    process.exit(0);
}

const zaehle = (liste, schluessel) => {
    const m = new Map();
    for (const e of liste) {
        const k = schluessel(e);
        if (!m.has(k)) m.set(k, { fahrer: new Set(), fj: new Set(), rennen: 0, roh: new Set() });
        const s = m.get(k);
        s.fahrer.add(e.fahrer); s.fj.add(e.fahrer + e.jahr); s.rennen += e.rennen || 0; s.roh.add(e.serie);
    }
    return [...m].sort((a, b) => b[1].fj.size - a[1].fj.size);
};
const kat = new Map();
for (const e of ausKategorie) {
    const k = ROH ? e.serie : gruppe(e.serie)[0];
    if (!kat.has(k)) kat.set(k, new Set());
    kat.get(k).add(e.fahrer);
}
const zeilen = zaehle(eintraege, e => ROH ? e.serie : gruppe(e.serie)[0]);
console.log('\nSerie'.padEnd(52) + 'Fahrer  Fahrer-Jahre  Rennen  (Kategorie: Fahrer)  Stand');
for (const [k, s] of zeilen.slice(0, ROH ? 120 : 40)) {
    const st = ROH ? '' : gruppe([...s.roh][0])[1];
    console.log(k.slice(0, 50).padEnd(51), String(s.fahrer.size).padStart(6), String(s.fj.size).padStart(13), String(s.rennen).padStart(7),
        String((kat.get(k) || new Set()).size).padStart(12), '         ', st);
    if (!ROH && st === '?') continue;
}
if (!ROH) {
    const rest = zeilen.filter(([, s]) => gruppe([...s.roh][0])[1] === '?');
    console.log(`\nnicht zugeordnet: ${rest.length} Serien, ${rest.reduce((a, [, s]) => a + s.fj.size, 0)} Fahrer-Jahre`);
}
