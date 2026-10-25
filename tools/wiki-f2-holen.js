#!/usr/bin/env node
/**
 * wiki-f2-holen.js — holt die Formel-2-Saisons aus der englischen Wikipedia für rennkalender.html:
 * "1960 Formula Two season" und "<Jahr> European Formula Two Championship" 1967–1984 (1957–59, 1964–66 haben
 * keinen Saisonartikel). Rennartikel gibt es wenige; das Feld steht im Saisonartikel (wiki-f2-lesen.js), die
 * vorhandenen Rennartikel ergänzen es.
 *
 * Ausgabe: tools/quellen/wiki-f2.json { saisons, berichte: {}, koord } — Rohdaten, nicht im Repo.
 * Aufruf:  node tools/wiki-f2-holen.js   (holt nur, was fehlt)
 * Lizenz der Inhalte: CC BY-SA 4.0 (Wikipedia-Autoren).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'quellen', 'wiki-f2.json');
const { zeilenF2 } = require('./wiki-f2-lesen.js');
const { wikiApi, text, koord, TEXT, KOORD } = require('./wiki-api.js');

const titel = j => j < 1967 ? `${j} Formula Two season` : `${j} European Formula Two Championship`;
const JAHRE = [1960, ...Array.from({ length: 18 }, (_, i) => 1967 + i)];
const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
cache.saisons = cache.saisons || {}; cache.berichte = cache.berichte || {}; cache.koord = cache.koord || {};
const sichern = () => fs.writeFileSync(OUT, JSON.stringify(cache));
const { holeAlle } = wikiApi('en', sichern);

(async () => {
    const fehlt = JAHRE.filter(j => !cache.saisons[j]);
    await holeAlle(fehlt.map(titel), 10, TEXT, (t, s) => { cache.saisons[t.match(/\d{4}/)[0]] = text(s); }, 'Saisons');
    const zeilen = Object.entries(cache.saisons).filter(([, w]) => w).flatMap(([j, w]) => zeilenF2(w, +j));
    const berichte = [...new Set(zeilen.map(z => z.bericht).filter(Boolean))].filter(t => !(t in cache.berichte));
    await holeAlle(berichte, 10, TEXT, (t, s) => { cache.berichte[t] = text(s) ? { titel: s.title, text: text(s) } : null; }, 'Berichte');
    const orte = [...new Set(zeilen.map(z => z.ort).filter(Boolean))].filter(t => !cache.koord[t]);
    await holeAlle(orte, 50, KOORD, (t, s) => { cache.koord[t] = koord(s); }, 'Koordinaten');
    const ohneK = Object.entries(cache.koord).filter(([, v]) => !v).map(([k]) => k);
    const bOk = Object.values(cache.berichte).filter(Boolean).length;
    console.log(`Fertig: ${zeilen.length} Läufe in ${Object.values(cache.saisons).filter(Boolean).length} Saisons · Rennartikel ${bOk} von `
        + `${Object.keys(cache.berichte).length} verlinkten · Orte `
        + `${Object.keys(cache.koord).length} (ohne Koordinaten ${ohneK.length}${ohneK.length ? ': ' + ohneK.join(' · ') : ''})`);
})();
