#!/usr/bin/env node
/**
 * wiki-nwm-holen.js — holt die Formel-1-Rennen ohne WM-Status (1950–1985) aus der englischen Wikipedia
 * für das Werkzeug rennkalender.html.
 *
 * Stufe 1: Saisonartikel "<Jahr> Formula One season", Abschnitt "Non-championship races" (Tabelle mit
 *          Rennen, Strecke, Datum, Sieger, Link zum Rennbericht).
 * Stufe 2: Rennberichte (Wikitext mit Ergebnistabelle).
 * Stufe 3: Koordinaten der verlinkten Strecken/Orte über prop=coordinates (kein Artikeltext nötig).
 * Abruf, Paketgrößen und Drosselung: tools/wiki-api.js.
 *
 * Ausgabe: tools/quellen/wiki-nwm.json { saisons: {jahr: text}, berichte: {titel: {titel, text}|null},
 *          koord: {titel: [lat, lon]|null} } — Rohdaten, nicht im Repo. Ausgewertet von build-rennkalender.js.
 * Aufruf:  node tools/wiki-nwm-holen.js [vonJahr] [bisJahr]   (holt nur, was fehlt)
 * Lizenz der Inhalte: CC BY-SA 4.0 (Wikipedia-Autoren).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'quellen', 'wiki-nwm.json');
const { saisonZeilen } = require('./wiki-nwm-lesen.js');

const [VON = 1950, BIS = 1985] = process.argv.slice(2).map(Number);
const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
cache.saisons = cache.saisons || {}; cache.berichte = cache.berichte || {}; cache.koord = cache.koord || {};
const sichern = () => fs.writeFileSync(OUT, JSON.stringify(cache));
const { wikiApi, text, koord, TEXT, KOORD } = require('./wiki-api.js');
const { holeAlle } = wikiApi('en', sichern);

(async () => {
    const jahre = [];
    for (let j = VON; j <= BIS; j++) if (!cache.saisons[j]) jahre.push(j);
    const saisonTitel = jahre.map(j => j + ' Formula One season');
    await holeAlle(saisonTitel, 10, TEXT, (t, s) => { cache.saisons[t.slice(0, 4)] = text(s); }, 'Saisons');

    const zeilen = Object.entries(cache.saisons).filter(([j, w]) => w && +j >= VON && +j <= BIS).flatMap(([j, w]) => saisonZeilen(w, +j));
    const berichte = [...new Set(zeilen.map(z => z.bericht).filter(Boolean))].filter(t => !cache.berichte[t]);
    await holeAlle(berichte, 10, TEXT, (t, s) => { cache.berichte[t] = text(s) ? { titel: s.title, text: text(s) } : null; }, 'Berichte');

    const orte = [...new Set(zeilen.map(z => z.ort).filter(Boolean))].filter(t => !cache.koord[t]);
    await holeAlle(orte, 50, KOORD, (t, s) => { cache.koord[t] = koord(s); }, 'Koordinaten');

    const fehltB = Object.values(cache.berichte).filter(v => !v).length, fehltK = Object.values(cache.koord).filter(v => !v).length;
    console.log(`Fertig: ${zeilen.length} Rennen in ${Object.keys(cache.saisons).length} Saisons · Berichte ${Object.keys(cache.berichte).length}`
        + ` (fehlen ${fehltB}) · Orte ${Object.keys(cache.koord).length} (ohne Koordinaten ${fehltK})`);
})();
