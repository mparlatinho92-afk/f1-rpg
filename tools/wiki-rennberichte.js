#!/usr/bin/env node
/**
 * wiki-rennberichte.js — holt die englischen Wikipedia-Artikel aller WM-Grand-Prix
 * (1950–2025, ohne Indy 500) und speichert den Wikitext im Projekt.
 *
 * Zweck: F1DB kennt weder Wetter noch rote Flaggen. Die Artikel nennen das Wetter
 * (Infobox) und beschreiben Abbrüche im Text. Ausgewertet wird separat
 * (tests/stoerungen-real.js), dieser Abruf läuft nur einmal.
 *
 * Titel: "<Jahr> <fullName aus f1db-grands-prix.json>", z.B. "1996 Monaco Grand Prix".
 * Weiterleitungen werden aufgelöst. Nicht gefundene Titel landen in der Fehlerliste.
 * Abruf in Paketen zu 50 Titeln über die MediaWiki-API, 1,5 s Pause je Paket.
 *
 * Ausgabe: tools/quellen/wiki-rennberichte.json  { raceId: { titel, text } }
 * Aufruf:  node tools/wiki-rennberichte.js [paketgroesse] [pause-ms]   (holt nur, was fehlt)
 * ⚠ HTTP 429 (Drosselung) bei schneller Folge: Rest mit z.B. 1 5000 nachholen.
 * ⚠ Die API kürzt große Antworten: bei 50 langen Artikeln fehlten 250 Rennen
 *   still. Nachholen mit kleinerer Paketgröße, z.B. 10.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const DB = path.join(ROOT, 'f1db-json-splitted');
const OUT = path.join(__dirname, 'quellen', 'wiki-rennberichte.json');
const L = f => JSON.parse(fs.readFileSync(path.join(DB, f), 'utf8'));

const races = L('f1db-races.json').filter(r => r.year <= 2025 && !(r.circuitId === 'indianapolis' && r.year <= 1960));
const gp = new Map(L('f1db-grands-prix.json').map(g => [g.id, g]));
const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};

const offen = races.filter(r => !cache[r.id]).map(r => ({ id: r.id, titel: r.year + ' ' + gp.get(r.grandPrixId).fullName }));
console.log('Rennen gesamt', races.length, '· im Cache', Object.keys(cache).length, '· offen', offen.length);

const pause = ms => new Promise(r => setTimeout(r, ms));
(async () => {
    const fehler = [];
    const GROESSE = Number(process.argv[2] || 50);
    for (let i = 0; i < offen.length; i += GROESSE) {
        const paket = offen.slice(i, i + GROESSE);
        const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1'
            + '&prop=revisions&rvprop=content&rvslots=main&titles=' + encodeURIComponent(paket.map(p => p.titel).join('|'));
        const res = await fetch(url, { headers: { 'User-Agent': 'F1-RPG-Balancing/1.0 (private Auswertung, Einzelprojekt)' } });
        if (!res.ok) { console.log('HTTP', res.status, 'bei Paket', i / 50); fehler.push(...paket.map(p => p.titel)); await pause(5000); continue; }
        const j = await res.json();
        // Titel nach Normalisierung und Weiterleitung zurückverfolgen
        const ziel = t => {
            for (const n of (j.query.normalized || [])) if (n.from === t) t = n.to;
            for (const r of (j.query.redirects || [])) if (r.from === t) t = r.to;
            return t;
        };
        const seiten = new Map((j.query.pages || []).map(s => [s.title, s]));
        for (const p of paket) {
            const s = seiten.get(ziel(p.titel));
            const text = s && !s.missing && s.revisions && s.revisions[0].slots.main.content;
            if (text) cache[p.id] = { titel: s.title, text };
            else fehler.push(p.titel);
        }
        fs.writeFileSync(OUT, JSON.stringify(cache));
        console.log("Paket", i / GROESSE + 1, "von", Math.ceil(offen.length / GROESSE), '· im Cache', Object.keys(cache).length);
        await pause(Number(process.argv[3] || 1500));
    }
    console.log('Fertig. Im Cache', Object.keys(cache).length, '· nicht gefunden', fehler.length);
    if (fehler.length) console.log('  ' + fehler.slice(0, 30).join(' · '));
})();
