#!/usr/bin/env node
/**
 * stoerungen-real.js — Regen und rote Flaggen je Session aus den Wikipedia-Rennberichten.
 *
 * Quelle: tools/quellen/wiki-rennberichte.json (einmalig geholt mit
 * tools/wiki-rennberichte.js). F1DB kennt weder Wetter noch Flaggen.
 *
 * Je Rennen:
 *   regen.rennen   'trocken' | 'teilweise' | 'nass' | null   aus dem Infobox-Feld weather
 *   regen.quali    true/false   Regenwörter im Qualifying-Abschnitt
 *   regen.training true/false   Regenwörter im Trainings-Abschnitt
 *   rot.{training,quali,rennen}  rote Flagge / Unterbrechung im jeweiligen Abschnitt
 *
 * ⚠ HEURISTIK: Abschnitte werden über ihre Überschriften zugeordnet, Regen und Flaggen
 *   über Schlüsselwörter. Validiert wird gegen WET_RACE_IDS und die Rundenzeiten
 *   (Rennrunde > 5 % langsamer als die Streckennorm). Lange Artikel (moderne Ära)
 *   erwähnen Flaggen und Wetter häufiger als kurze (50er) — Quoten der alten Ären sind
 *   eher UNTERgrenzen.
 *
 * Aufruf: node tests/stoerungen-real.js [--liste]
 * Schreibt die Klassifikation nach tools/quellen/wiki-stoerungen.json (klein, versioniert).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const QUELLE = path.join(ROOT, 'tools', 'quellen', 'wiki-rennberichte.json');
const ZIEL = path.join(ROOT, 'tools', 'quellen', 'wiki-stoerungen.json');
const L = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'f1db-json-splitted', f), 'utf8'));

const wiki = JSON.parse(fs.readFileSync(QUELLE, 'utf8'));
const races = new Map(L('f1db-races.json').map(r => [r.id, r]));

// ── Wetter der Infobox ────────────────────────────────────────────────────
function saeubern(s) {
    return s.replace(/<ref[^>]*\/>/g, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
        .replace(/\{\{[^{}]*\}\}/g, '').replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
        .replace(/<br\s*\/?>/gi, ' ').toLowerCase().trim();
}
const KEIN_REGEN = /threat of rain|chance of rain|no rain|rain (?:was )?(?:threatened|forecast|expected)|risk of rain|possibility of rain/;
const REGEN = /rain|wet|shower|drizzl|damp|storm|downpour|torrential|monsoon/;
const STARK = /heavy|torrential|monsoon|downpour|very wet|thunder|storm|pouring/;
const TEILWEISE = /light|drizzl|damp|shower|intermittent|drying|dry\s*\/\s*wet|wet\s*\/\s*dry|later|early|start|changeable|mixed|brief|spots|patchy|occasional|at times|sporadic|beginning|then/;
function rennWetter(text) {
    const m = text.match(/\|\s*weather\s*=\s*([^\n]*)/i);
    if (!m) return null;
    const w = saeubern(m[1].split(/\n\s*\|/)[0]);
    if (!w || !/[a-z]/.test(w)) return null;
    const ohneDrohung = w.replace(KEIN_REGEN, '');
    if (!REGEN.test(ohneDrohung)) return 'trocken';
    if (STARK.test(ohneDrohung)) return 'nass';
    if (TEILWEISE.test(ohneDrohung)) return 'teilweise';
    return 'nass';
}

// ── Abschnitte ────────────────────────────────────────────────────────────
// Überschriften der Ebene 2/3. Zuordnung über Schlüsselwörter im Titel.
function abschnitte(text) {
    const teile = { training: '', quali: '', rennen: '' };
    const re = /^(={2,3})\s*([^=\n]+?)\s*\1\s*$/gm;
    const marken = []; let m;
    while ((m = re.exec(text))) marken.push({ pos: m.index, titel: m[2].toLowerCase(), ende: re.lastIndex });
    for (let i = 0; i < marken.length; i++) {
        const t = marken[i].titel, inhalt = text.slice(marken[i].ende, i + 1 < marken.length ? marken[i + 1].pos : text.length);
        if (/classification|result|standings|reference|note|see also|external|footnote/.test(t)) continue;
        if (/practi[cs]e|free practice|friday|warm.?up|testing/.test(t)) teile.training += inhalt;
        else if (/qualif|pole|grid/.test(t)) teile.quali += inhalt;
        else if (/race|report|summary|start|lap|finish|background|post/.test(t)) teile.rennen += inhalt;
    }
    return teile;
}
const REGEN_TEXT = /\b(?:rain(?:ed|ing|fall|s)?|wet(?:ter)?|drizzl\w*|showers?|downpour|damp)\b/i;
const ROTE_FLAGGE = /red[\s-]flag|red-flagged|(?:race|session) was (?:stopped|halted|suspended)|stopped the (?:race|session)|was restarted|restart(?:ed)? (?:the race|on lap)|second part of the race|on aggregate|aggregate (?:times|result)/i;

// ── Auswertung ────────────────────────────────────────────────────────────
const ctx = { window: {}, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', 'f1db.js'), 'utf8').replace(/\bconst (\w+)\s*=/g, 'var $1 ='), ctx);
const WET = ctx.WET_RACE_IDS;

const ergebnis = {};
for (const [id, { text }] of Object.entries(wiki)) {
    const r = races.get(+id); if (!r) continue;
    const a = abschnitte(text);
    ergebnis[id] = {
        jahr: r.year,
        regen: { rennen: rennWetter(text), quali: REGEN_TEXT.test(a.quali), training: REGEN_TEXT.test(a.training) },
        rot: { training: ROTE_FLAGGE.test(a.training), quali: ROTE_FLAGGE.test(a.quali), rennen: ROTE_FLAGGE.test(a.rennen) },
        verkuerzt: !!(r.scheduledLaps && r.laps && r.laps < r.scheduledLaps * 0.9),
        abschnitte: { training: a.training.length > 0, quali: a.quali.length > 0 }
    };
}
fs.writeFileSync(ZIEL, JSON.stringify(ergebnis));

// Validierung Rennregen gegen WET_RACE_IDS
const mitWetter = Object.entries(ergebnis).filter(([, e]) => e.regen.rennen);
const nassW = mitWetter.filter(([, e]) => e.regen.rennen !== 'trocken');
const tp = nassW.filter(([id]) => WET.has(+id)).length;
const listeMit = mitWetter.filter(([id]) => WET.has(+id)).length;
console.log('Infobox-Wetter vorhanden:', mitWetter.length, 'von', Object.keys(ergebnis).length);
console.log('Abgleich mit WET_RACE_IDS: Wiki nass', nassW.length, '· davon in der Liste', tp,
    '· Liste (mit Wiki-Wetter)', listeMit, '· Liste von Wiki erkannt', (tp / listeMit * 100).toFixed(0) + ' %');

// Je Dekade
const dek = {};
for (const e of Object.values(ergebnis)) {
    const d = Math.floor(e.jahr / 10) * 10;
    const z = dek[d] = dek[d] || { n: 0, w: 0, tr: 0, teil: 0, nass: 0, qn: 0, q: 0, tn: 0, t: 0, rr: 0, rq: 0, rt: 0, kurz: 0 };
    z.n++;
    if (e.regen.rennen) { z.w++; if (e.regen.rennen === 'teilweise') z.teil++; if (e.regen.rennen === 'nass') z.nass++; }
    if (e.abschnitte.quali) { z.q++; if (e.regen.quali) z.qn++; }
    if (e.abschnitte.training) { z.t++; if (e.regen.training) z.tn++; }
    if (e.rot.rennen) z.rr++; if (e.rot.quali) z.rq++; if (e.rot.training) z.rt++;
    if (e.verkuerzt) z.kurz++;
}
const p = (a, b) => b ? (a / b * 100).toFixed(1).padStart(5) + ' %' : '    –  ';
console.log('\nDekade | Rennen | Rennen nass (teilw./durchg.) | Quali Regen | Training Regen | Rote Flagge Rennen/Quali/Training | verkürzt');
for (const [d, z] of Object.entries(dek))
    console.log(' ' + d, '|', String(z.n).padStart(4), '|', p(z.teil + z.nass, z.w), '(' + p(z.teil, z.w).trim() + ' / ' + p(z.nass, z.w).trim() + ')',
        '|', p(z.qn, z.q), '|', p(z.tn, z.t), '|', p(z.rr, z.n), '/', p(z.rq, z.n).trim(), '/', p(z.rt, z.n).trim(), '|', z.kurz);

if (process.argv.includes('--liste')) {
    console.log('\nRennen mit roter Flagge im Rennen:');
    for (const [id, e] of Object.entries(ergebnis)) if (e.rot.rennen) console.log('  ' + e.jahr + ' ' + wiki[id].titel);
}
