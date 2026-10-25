#!/usr/bin/env node
/**
 * wiki-nwm-holen.js — holt die Formel-1-Rennen ohne WM-Status (1950–1985) aus der englischen Wikipedia
 * für das Werkzeug rennkalender.html.
 *
 * Stufe 1: Saisonartikel "<Jahr> Formula One season", Abschnitt "Non-championship races" (Tabelle mit
 *          Rennen, Strecke, Datum, Sieger, Link zum Rennbericht).
 * Stufe 2: Rennberichte (Wikitext mit Ergebnistabelle). Paketgröße 10: die API kürzt große Antworten
 *          sonst still (Befund aus tools/wiki-rennberichte.js).
 * Stufe 3: Koordinaten der verlinkten Strecken/Orte über prop=coordinates (kein Artikeltext nötig).
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
const pause = ms => new Promise(r => setTimeout(r, ms));
const API = 'https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1';
const KOPF = { headers: { 'User-Agent': 'F1-RPG-Rennkalender/1.0 (private Auswertung, Einzelprojekt)' } };

// Ein Paket Titel abfragen; liefert Map ursprünglicher Titel → Seite (nach Normalisierung und Weiterleitung)
async function paket(titel, prop) {
    const res = await fetch(API + prop + '&titles=' + encodeURIComponent(titel.join('|')), KOPF);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    const seiten = new Map((j.query.pages || []).map(s => [s.title, s]));
    const ziel = t => {
        for (const n of (j.query.normalized || [])) if (n.from === t) t = n.to;
        for (const r of (j.query.redirects || [])) if (r.from === t) t = r.to;
        return t;
    };
    return new Map(titel.map(t => [t, seiten.get(ziel(t))]));
}
async function holeAlle(titel, groesse, prop, ablegen, name) {
    let versuche = 0;
    for (let i = 0; i < titel.length; i += groesse) {
        const teil = titel.slice(i, i + groesse);
        try { for (const [t, s] of await paket(teil, prop)) ablegen(t, s); }
        catch (e) {
            // HTTP 429: Drosselung, nach Pause dasselbe Paket noch einmal (höchstens 5 Versuche)
            versuche = (versuche || 0) + 1;
            console.log(name, 'Paket', i / groesse + 1, e.message, versuche < 5 ? '— neuer Versuch in 30 s' : '— übersprungen');
            if (versuche < 5) { i -= groesse; await pause(30000); } else versuche = 0;
            continue;
        }
        versuche = 0;
        sichern();
        console.log(name, Math.min(i + groesse, titel.length), '/', titel.length);
        await pause(1500);
    }
}
const text = s => s && !s.missing && s.revisions ? s.revisions[0].slots.main.content : null;

(async () => {
    const jahre = [];
    for (let j = VON; j <= BIS; j++) if (!cache.saisons[j]) jahre.push(j);
    const saisonTitel = jahre.map(j => j + ' Formula One season');
    await holeAlle(saisonTitel, 10, '&prop=revisions&rvprop=content&rvslots=main',
        (t, s) => { cache.saisons[t.slice(0, 4)] = text(s); }, 'Saisons');

    const zeilen = Object.entries(cache.saisons).filter(([j, w]) => w && +j >= VON && +j <= BIS).flatMap(([j, w]) => saisonZeilen(w, +j));
    const berichte = [...new Set(zeilen.map(z => z.bericht).filter(Boolean))].filter(t => !cache.berichte[t]);
    await holeAlle(berichte, 10, '&prop=revisions&rvprop=content&rvslots=main',
        (t, s) => { cache.berichte[t] = text(s) ? { titel: s.title, text: text(s) } : null; }, 'Berichte');

    const orte = [...new Set(zeilen.map(z => z.ort).filter(Boolean))].filter(t => !cache.koord[t]);
    await holeAlle(orte, 50, '&prop=coordinates&coprimary=primary&colimit=max',
        (t, s) => { const c = s && s.coordinates && s.coordinates[0]; cache.koord[t] = c ? [c.lat, c.lon] : null; }, 'Koordinaten');

    const fehltB = Object.values(cache.berichte).filter(v => !v).length, fehltK = Object.values(cache.koord).filter(v => !v).length;
    console.log(`Fertig: ${zeilen.length} Rennen in ${Object.keys(cache.saisons).length} Saisons · Berichte ${Object.keys(cache.berichte).length}`
        + ` (fehlen ${fehltB}) · Orte ${Object.keys(cache.koord).length} (ohne Koordinaten ${fehltK})`);
})();
