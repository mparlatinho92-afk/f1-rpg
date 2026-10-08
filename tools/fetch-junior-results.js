#!/usr/bin/env node
/**
 * fetch-junior-results.js — Rennergebnisse der Nachwuchsserien von Wikipedia (08.10.2026)
 *
 * Zweck: Grundlage fuer die Junior-Elo (tools/junior-elo.js). Die Feeder-Fahrer wuerfelten ihre
 * Werte pro Spielstand — Vesti und Pourchaire unterschieden sich nur durch Wuerfelglueck von einem
 * unbekannten F3-Fahrer.
 *
 * Quelle: Wikipedia-Saisonartikel, Tabelle "Drivers' Championship" (eine Zelle je Rennen, Sprint
 * und Feature getrennt) plus Abschnitt "Entries" fuer die Teamzuordnung. Kein Karriere-Scraping:
 * die Saisontabellen sind einheitlich aufgebaut, die Karriereseiten nicht.
 *
 * Serien: F2 2017–2026, F3 2019–2026, FRECA 2019–2026 (Vorgeschichte der Pool-Fahrer).
 * Rohtexte werden in tools/quellen/junior-wiki/ zwischengespeichert — ein zweiter Lauf fragt
 * Wikipedia nicht erneut ab (--neu erzwingt den Abruf).
 *
 * Aufruf: node tools/fetch-junior-results.js [--neu]
 * Ausgabe: tools/quellen/junior-results.json
 *   [{ serie, jahr, rennen: [[[fahrer, platz|null, status], ...], ...], teams: { fahrer: team } }]
 *   platz null = nicht gewertet; status 'ret' | 'dns' | 'dsq' | 'nc' | ''.
 */
'use strict';
const fs = require('fs'), path = require('path'), https = require('https');

const ROOT = path.join(__dirname, '..');
const CACHE = path.join(ROOT, 'tools', 'quellen', 'junior-wiki');
const OUT = path.join(ROOT, 'tools', 'quellen', 'junior-results.json');
const NEU = process.argv.includes('--neu');

const SERIEN = [
    { serie: 'F2', von: 2017, bis: 2026, titel: y => [`${y} Formula 2 Championship`, `${y} FIA Formula 2 Championship`] },
    { serie: 'F3', von: 2019, bis: 2026, titel: y => [`${y} FIA Formula 3 Championship`, `${y} Formula 3 Championship`] },
    { serie: 'FRECA', von: 2019, bis: 2026, titel: y => [`${y} Formula Regional European Championship`, `${y} Formula Regional European Championship by Alpine`] },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
function get(url) {
    return new Promise(res => {
        https.get(url, { headers: { 'User-Agent': 'F1RPG-junior-elo/1.0 (personal hobby project)' } }, s => {
            const c = []; s.on('data', d => c.push(d));
            s.on('end', () => res(Buffer.concat(c).toString('utf8')));
        }).on('error', () => res(null));
    });
}
// Wikipedia drosselt nach ~10 schnellen Abrufen mit Klartext „too many requests" (kein JSON) →
// warten und erneut versuchen statt die Seite als fehlend zu melden.
async function wikitext(title) {
    for (const warte of [0, 15000, 45000, 90000]) {
        if (warte) { console.log(`    … gedrosselt, warte ${warte / 1000} s`); await sleep(warte); }
        const t = await wikitextEinmal(title);
        if (t !== 'GEDROSSELT') return t;
    }
    return null;
}
async function wikitextEinmal(title) {
    const b = await get('https://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&rvprop=content&rvslots=main&redirects=1&titles=' + encodeURIComponent(title));
    if (b && /too many requests/i.test(b)) return 'GEDROSSELT';
    try {
        const p = Object.values(JSON.parse(b).query.pages)[0];
        return p && p.revisions ? p.revisions[0].slots.main['*'] : null;
    } catch (e) { return null; }
}

// [[Ziel|Anzeige]] → Anzeige; Klammerzusatz „(racing driver)" fällt weg
function linkName(s) {
    const m = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/.exec(s);
    if (!m) return null;
    return (m[2] || m[1]).replace(/\s*\([^)]*\)\s*$/, '').trim();
}
function abschnitt(wt, re) {
    const i = wt.search(re);
    if (i < 0) return null;
    const rest = wt.slice(i);
    const tab = rest.indexOf('{|');
    return tab < 0 ? null : rest.slice(tab);
}

// Teams aus "Entries": Zeile mit zwei Links = Team + Fahrer, mit einem Link = Fahrer (Team per rowspan von oben)
function teamsAus(wt) {
    const blk = abschnitt(wt, /^==+\s*(Entries|Teams and drivers|Entry list)\s*==+/mi);
    if (!blk) return {};
    const ende = blk.search(/^\|\}/m);
    const teams = {};
    let team = null;
    for (const zeile of blk.slice(0, ende > 0 ? ende : blk.length).split(/^\|-.*$/m)) {
        const zellen = zeile.split('\n').filter(l => /^\|(?!\})/.test(l) && /\[\[/.test(l));
        if (!zellen.length) continue;
        if (zellen.length >= 2) team = linkName(zellen[0]);
        const fahrer = linkName(zellen[zellen.length - 1]);
        if (fahrer && team && !teams[fahrer]) teams[fahrer] = team;
    }
    return teams;
}

// Zellwert → [platz|null, status]
function zelle(roh) {
    const v = roh.replace(/<ref[^>]*\/>|<ref[\s\S]*?<\/ref>/g, '').replace(/<[^>]+>[^<]*<\/[^>]+>/g, m => /<sup>/.test(m) ? '' : m)
        .replace(/<[^>]+>/g, '').replace(/\{\{[^}]*\}\}/g, '').replace(/'''?/g, '').trim();
    const n = parseInt(v, 10);
    if (!isNaN(n) && /^\d+/.test(v)) return [n, ''];
    const s = v.toLowerCase();
    if (/^ret/.test(s)) return [null, 'ret'];
    if (/^dns|^dnp|^wd|^dnq/.test(s)) return [null, 'dns'];
    if (/^dsq|^ex/.test(s)) return [null, 'dsq'];
    if (/^nc/.test(s)) return [null, 'nc'];
    return [null, ''];
}

function ergebnisseAus(wt) {
    const blk = abschnitt(wt, /^==+\s*Drivers'?\s*([Cc]hampionship(\s+standings)?|[Ss]tandings)\s*==+/m);
    if (!blk) return null;
    const ende = blk.search(/^\|\}/m);
    const iTab = blk.search(/\{\|\s*class="wikitable/);   // 2018–2021: „{|class=" ohne Leerzeichen
    if (iTab < 0) return null;
    const tab = blk.slice(iTab, ende > iTab ? ende : blk.length);
    const reihen = tab.split(/^\|-.*$/m).slice(1);
    const zeilenJeFahrer = [];
    let nRennen = 0;
    for (const r of reihen) {
        const zeilen = r.split('\n').map(l => l.trim()).filter(Boolean);
        const iName = zeilen.findIndex(l => /^\|/.test(l) && /\[\[/.test(l));
        if (iName < 0 || !/^!/.test(zeilen[0] || '')) continue;   // Fahrerzeile beginnt mit „! Pos"
        const name = linkName(zeilen[iName]);
        const werte = [];
        for (const l of zeilen.slice(iName + 1)) {
            if (/^!/.test(l)) break;                                     // „! Punkte" beendet die Zeile
            if (!/^\|/.test(l)) continue;
            for (const teil of l.slice(1).split('||')) {
                const cs = /colspan\s*=\s*"?(\d+)/.exec(teil);
                const roh = teil.includes('|') && /style|colspan|rowspan|align/.test(teil.split('|')[0]) ? teil.slice(teil.indexOf('|') + 1) : teil;
                const w = zelle(roh);
                for (let k = 0; k < (cs ? +cs[1] : 1); k++) werte.push(w);
            }
        }
        nRennen = Math.max(nRennen, werte.length);
        zeilenJeFahrer.push([name, werte]);
    }
    // Spaltenweise zu Rennen umbauen; Fahrer ohne Eintrag (leere Zelle) fehlen im Rennen
    const rennen = [];
    for (let i = 0; i < nRennen; i++) {
        const feld = [];
        for (const [name, w] of zeilenJeFahrer) {
            const x = w[i];
            if (!x || (x[0] === null && !x[1])) continue;
            feld.push([name, x[0], x[1]]);
        }
        if (feld.length >= 5) rennen.push(feld);
    }
    return rennen;
}

// F3 2020 u.a.: Ergebniszellen stehen nicht in der Tabelle, sondern in einer Vorlage
// {{F3R2020|PIA|RB1F}} — #switch Kuerzel → #switch Rennen → Zellinhalt. Vorlage laden und einsetzen.
function vorlageAuflosen(vt) {
    const karte = {};
    let kurz = null;
    for (const l of vt.split(/\r?\n/)) {
        const a = /^\|\s*([A-Z0-9]+)\s*=\s*\{\{safesubst/.exec(l);
        if (a) { kurz = a[1]; karte[kurz] = {}; continue; }
        const b = /^\|\s*([A-Za-z0-9]+)\s*=\s*(.*)$/.exec(l);
        if (b && kurz) karte[kurz][b[1]] = b[2];
    }
    return karte;
}
async function vorlagenEinsetzen(wt) {
    const namen = [...new Set([...wt.matchAll(/\{\{(F\dR\d{4})\|/g)].map(m => m[1]))];
    for (const n of namen) {
        const datei = path.join(CACHE, `Template-${n}.txt`);
        let vt = fs.existsSync(datei) ? fs.readFileSync(datei, 'utf8') : null;
        if (!vt) { vt = await wikitext('Template:' + n); await sleep(3000); if (vt) fs.writeFileSync(datei, vt); }
        if (!vt) continue;
        const karte = vorlageAuflosen(vt);
        wt = wt.replace(new RegExp('\\{\\{' + n + '\\|(\\w+)\\|(\\w+)\\}\\}', 'g'), (_, a, b) => (karte[a] && karte[a][b]) || '');
    }
    return wt;
}

(async () => {
    fs.mkdirSync(CACHE, { recursive: true });
    const aus = [];
    for (const s of SERIEN) for (let y = s.von; y <= s.bis; y++) {
        const datei = path.join(CACHE, `${s.serie}-${y}.txt`);
        let wt = !NEU && fs.existsSync(datei) ? fs.readFileSync(datei, 'utf8') : null;
        if (!wt) {
            for (const t of s.titel(y)) { wt = await wikitext(t); await sleep(3000); if (wt) break; }
            if (wt) fs.writeFileSync(datei, wt);
        }
        if (!wt) { console.log(`  ✗ ${s.serie} ${y}: keine Seite`); continue; }
        wt = await vorlagenEinsetzen(wt);
        const rennen = ergebnisseAus(wt), teams = teamsAus(wt);
        if (!rennen || !rennen.length) { console.log(`  ✗ ${s.serie} ${y}: keine Wertungstabelle erkannt`); continue; }
        const fahrer = new Set(rennen.flat().map(e => e[0]));
        const ohneTeam = [...fahrer].filter(f => !teams[f]).length;
        console.log(`  ✓ ${s.serie} ${y}: ${rennen.length} Rennen, ${fahrer.size} Fahrer, ${Object.keys(teams).length} Teamzuordnungen${ohneTeam ? `, ${ohneTeam} ohne Team` : ''}`);
        aus.push({ serie: s.serie, jahr: y, rennen, teams });
    }
    fs.writeFileSync(OUT, JSON.stringify(aus));
    console.log(`→ ${path.relative(ROOT, OUT)} (${aus.length} Saisons)`);
})();
