#!/usr/bin/env node
// Paket I — GER-Ranglisten aus beliebte-vornamen.de-Dekaden-HTML extrahieren.
// GER hat kein amtliches Vornamen-Register (Destatis erhebt nicht) → Rang-only.
// Seitenstruktur: <table> mit zwei <ol> — erste = Mädchen, zweite = JUNGEN.
// Schreibt ../data/ger-decade-ranks.json (Rang = Arrayposition + 1).
//
// Aufruf: node parse-ger-decades.js [rawDir]  — erwartet ger-<dekade>er.html
// (Download: siehe fetch-raw.sh-Muster; Seiten: /3747-1900er-jahre.htm usw.)

const fs = require('fs');
const path = require('path');

const RAW = process.argv[2] || path.join(__dirname, 'raw');
const OUT = path.join(__dirname, '..', 'data', 'ger-decade-ranks.json');

const PAGES = {
    1900: '3747-1900er-jahre.htm', 1910: '3752-1910er-jahre.htm',
    1920: '3764-1920er-jahre.htm', 1930: '3766-1930er-jahre.htm',
    1940: '3768-1940er-jahre.htm', 1950: '3770-1950er-jahre.htm',
    1960: '3772-1960er-jahre.htm', 1970: '3774-1970er-jahre.htm',
    1980: '3776-1980er-jahre.htm', 1990: '3778-1990er-jahre.htm',
    2000: '3780-2000er-jahre.htm', 2010: '26104-2010er-jahre.htm'
};

const ENT = { '&auml;': 'ä', '&ouml;': 'ö', '&uuml;': 'ü', '&Auml;': 'Ä', '&Ouml;': 'Ö', '&Uuml;': 'Ü', '&szlig;': 'ß', '&eacute;': 'é', '&amp;': '&' };
const decode = s => s.replace(/&[a-zA-Z]+;/g, m => ENT[m] || m).replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));

function extractBoys(html) {
    const ols = [...html.matchAll(/<ol>([\s\S]*?)<\/ol>/g)].map(m => m[1]);
    if (ols.length < 2) throw new Error('erwartete 2 <ol> (Mädchen, Jungen), fand ' + ols.length);
    const boys = ols[1];
    return [...boys.matchAll(/<li>([\s\S]*?)<\/li>/g)]
        .map(m => decode(m[1].replace(/<[^>]+>/g, '').trim()))
        .filter(Boolean);
}

const out = {
    _meta: {
        quelle: 'beliebte-vornamen.de Jahrzehnt-Seiten (Knud Bielefeld), abgerufen 2026-07-17',
        urls: Object.fromEntries(Object.entries(PAGES).map(([d, p]) => [d, `https://www.beliebte-vornamen.de/${p}`])),
        hinweis: 'Rang-only (GER hat kein amtliches Vornamen-Register). Reihenfolge = exakte Site-Rangfolge, Jungennamen. Gewichte entstehen per Zipf-Fit (kalibriert auf US/FR/GB), siehe METHODIK.md.'
    }
};
for (const [dec, page] of Object.entries(PAGES)) {
    const f = path.join(RAW, `ger-${dec}er.html`);
    if (!fs.existsSync(f)) { console.warn(`FEHLT: ${f} — Dekade ${dec} übersprungen`); continue; }
    out[dec] = extractBoys(fs.readFileSync(f, 'utf8'));
    console.log(`${dec}er: ${out[dec].length} Jungennamen (Top: ${out[dec].slice(0, 5).join(', ')})`);
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('->', OUT);
