#!/usr/bin/env node
/**
 * wiki-fahrer-holen.js — holt die en.wikipedia-Artikel aller F1-Fahrer mit Debüt bis 1985, um ihre Karrieren
 * außerhalb der F1 zu sehen (Auswertung: tools/wiki-fahrer-luecken.js).
 *
 * Stufe 1: "List of Formula One drivers" → je Zeile {{sortname|Vorname|Nachname|Artikel}} und Saisons {{F1|JJJJ}}.
 * Stufe 2: Artikeltexte (Pakete zu 10, Abruf tools/wiki-api.js).
 *
 * Ausgabe: tools/quellen/wiki-fahrer.json { liste: [{ name, artikel, jahre }], artikel: { titel: text } } — nicht im Repo.
 * Aufruf:  node tools/wiki-fahrer-holen.js [bisDebuet=1985]   (holt nur, was fehlt)
 * Lizenz der Inhalte: CC BY-SA 4.0 (Wikipedia-Autoren).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'quellen', 'wiki-fahrer.json');
const { wikiApi, text, TEXT } = require('./wiki-api.js');

const BIS = +(process.argv[2] || 1985);
const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
cache.artikel = cache.artikel || {};
const sichern = () => fs.writeFileSync(OUT, JSON.stringify(cache));
const { holeAlle } = wikiApi('en', sichern);

// Zeilen der Fahrerliste: Name aus sortname, Saisons aus den F1-Jahreslinks der dritten Zelle
function listeAus(w) {
    const aus = [];
    for (const zeile of w.split(/\n\|-/)) {
        const m = zeile.match(/\{\{sortname\|([^}]*)\}\}/i);
        if (!m) continue;
        // Positionsparameter Vorname|Nachname|Artikel, benannt dab=… (Artikel "Name (racing driver)")
        const p = m[1].split('|'), pos = p.filter(x => !x.includes('=')), dab = (p.find(x => /^dab=/.test(x)) || '').slice(4);
        const name = (pos[0] + ' ' + pos[1]).trim();
        const artikel = (pos[2] && pos[2] !== 'nolink' ? pos[2] : dab ? name + ' (' + dab + ')' : name).trim();
        const zellen = zeile.split(/\n\|/), saisons = zellen[3] || '';
        const jahre = [...saisons.matchAll(/\{\{F1\|(\d{4})\}\}(?:\s*[–-]\s*\{\{F1\|(\d{4})\}\})?/g)]
            .flatMap(x => { const a = +x[1], b = +(x[2] || x[1]); return Array.from({ length: b - a + 1 }, (_, i) => a + i); });
        if (jahre.length) aus.push({ name, artikel, jahre });
    }
    return aus;
}

(async () => {
    if (!cache.liste) await holeAlle(['List of Formula One drivers'], 1, TEXT, (t, s) => { cache.liste = listeAus(text(s)); }, 'Liste');
    const era = cache.liste.filter(f => Math.min(...f.jahre) <= BIS);
    const fehlt = [...new Set(era.map(f => f.artikel))].filter(t => !(t in cache.artikel));
    await holeAlle(fehlt, 10, TEXT, (t, s) => { cache.artikel[t] = text(s); }, 'Artikel');
    const ohne = era.filter(f => !cache.artikel[f.artikel]).map(f => f.artikel);
    console.log(`Fertig: ${cache.liste.length} Fahrer in der Liste, ${era.length} mit Debüt bis ${BIS}, ohne Artikel ${ohne.length}`
        + (ohne.length ? ': ' + ohne.join(' · ') : ''));
})();
