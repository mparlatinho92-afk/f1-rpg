#!/usr/bin/env node
/**
 * wiki-sportwagen-holen.js — holt die Läufe der Sportwagen-WM (1953–1985) aus der deutschen Wikipedia
 * für das Werkzeug rennkalender.html.
 *
 * Warum de statt en: en.wikipedia hat für 1961–1983 meist nur Le Mans (129 von 286 Rennberichten,
 * Messung 25.10.2026), de.wikipedia führt fast jeden Lauf mit einheitlichem "Schlussklassement".
 *
 * Stufe 1: Saisonartikel "Sportwagen-Weltmeisterschaft <Jahr>", Abschnitt "Rennkalender".
 * Stufe 2: Rennberichte. Stufe 3: Koordinaten der Strecken. Abruf: tools/wiki-api.js.
 *
 * Ausgabe: tools/quellen/wiki-sportwagen.json { saisons, berichte, koord } — Rohdaten, nicht im Repo.
 * Aufruf:  node tools/wiki-sportwagen-holen.js [vonJahr] [bisJahr]   (holt nur, was fehlt)
 * Lizenz der Inhalte: CC BY-SA 4.0 (Wikipedia-Autoren).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'quellen', 'wiki-sportwagen.json');
const { saisonZeilenDe } = require('./wiki-sportwagen-lesen.js');
const { wikiApi, text, koord, TEXT, KOORD } = require('./wiki-api.js');

const [VON = 1953, BIS = 1985] = process.argv.slice(2).map(Number);
const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
cache.saisons = cache.saisons || {}; cache.berichte = cache.berichte || {}; cache.koord = cache.koord || {};
const sichern = () => fs.writeFileSync(OUT, JSON.stringify(cache));
const { holeAlle } = wikiApi('de', sichern);

(async () => {
    const jahre = [];
    for (let j = VON; j <= BIS; j++) if (!cache.saisons[j]) jahre.push(j);
    await holeAlle(jahre.map(j => 'Sportwagen-Weltmeisterschaft ' + j), 10, TEXT, (t, s) => { cache.saisons[t.slice(-4)] = text(s); }, 'Saisons');

    const zeilen = Object.entries(cache.saisons).filter(([j, w]) => w && +j >= VON && +j <= BIS).flatMap(([j, w]) => saisonZeilenDe(w, +j));
    const berichte = [...new Set(zeilen.map(z => z.bericht).filter(Boolean))].filter(t => !cache.berichte[t]);
    await holeAlle(berichte, 10, TEXT, (t, s) => { cache.berichte[t] = text(s) ? { titel: s.title, text: text(s) } : null; }, 'Berichte');

    const orte = [...new Set(zeilen.map(z => z.ort).filter(Boolean))].filter(t => !cache.koord[t]);
    await holeAlle(orte, 50, KOORD, (t, s) => { cache.koord[t] = koord(s); }, 'Koordinaten');

    const fehltB = Object.values(cache.berichte).filter(v => !v).length, fehltK = Object.values(cache.koord).filter(v => !v).length;
    console.log(`Fertig: ${zeilen.length} Rennen in ${Object.values(cache.saisons).filter(Boolean).length} Saisons · Berichte `
        + `${Object.keys(cache.berichte).length} (fehlen ${fehltB}) · Orte ${Object.keys(cache.koord).length} (ohne Koordinaten ${fehltK})`);
})();
