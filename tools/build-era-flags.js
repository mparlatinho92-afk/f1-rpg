#!/usr/bin/env node
/**
 * build-era-flags.js — erzeugt die historischen Flaggen als data-URI-Zeilen fuer
 * CUSTOM_SVG_FLAGS in index.html und legt sie zugleich als SVG ins Backup.
 *
 * Stil wie die bestehenden Eintraege: viewBox "0 0 60 30", bewusst reduziert —
 * die Flagge wird im Spiel ~20 px hoch dargestellt, Wappendetails waeren Matsch.
 * Erkennbarkeit schlaegt Detailtreue.
 *
 * Aufruf: node tools/build-era-flags.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUTDIR = path.join(ROOT, 'assets-backup', 'era-flags');

const S = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30">${inner}</svg>`;

// Fuenfzackiger Stern, zentriert auf (cx,cy)
function star(cx, cy, r, fill) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
        const rad = (i % 2 === 0) ? r : r * 0.382;
        const a = -Math.PI / 2 + i * Math.PI / 5;
        pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
}
// Sternenfeld fuer die US-Flaggen: rows x cols, gleichmaessig im Kanton verteilt
function starField(rows, cols, w, h, r) {
    let out = '';
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        out += `<circle cx="${((x + 0.5) * w / cols).toFixed(2)}" cy="${((y + 0.5) * h / rows).toFixed(2)}" r="${r}" fill="#fff"/>`;
    }
    return out;
}
// 13 Streifen der US-Flagge
const usStripes = () => {
    let o = '<rect width="60" height="30" fill="#B22234"/>';
    for (let i = 1; i < 13; i += 2) o += `<rect y="${(i * 30 / 13).toFixed(2)}" width="60" height="${(30 / 13).toFixed(2)}" fill="#fff"/>`;
    return o;
};

const FLAGS = {
    // Sowjetunion 1923-1991: rotes Feld, Hammer und Sichel mit Stern im Obereck
    'URS': S(`<rect width="60" height="30" fill="#CC0000"/>` +
        star(9.5, 5.5, 3.2, '#FFD700') +
        // Sichel: Bogen, oeffnet nach rechts
        `<path d="M7 10 a6 6 0 0 1 6 8" stroke="#FFD700" stroke-width="1.6" fill="none"/>` +
        // Hammer: Stiel diagonal + Kopf
        `<path d="M7.5 17.5 L13 11.5" stroke="#FFD700" stroke-width="1.6"/>` +
        `<rect x="12" y="9.6" width="3.4" height="2.2" fill="#FFD700" transform="rotate(-45 13.7 10.7)"/>`),

    // Jugoslawien 1946-1992: Trikolore mit rotem, gold gesaeumtem Stern
    'YUG': S(`<rect width="60" height="10" fill="#0C4076"/><rect y="10" width="60" height="10" fill="#fff"/><rect y="20" width="60" height="10" fill="#D52B1E"/>` +
        star(30, 15, 7, '#FFD700') + star(30, 15, 5.6, '#D52B1E')),

    // Ungarn 1949-1989: Trikolore mit sozialistischem Wappen (Aehren, roter Stern)
    'HUN_SOC': S(`<rect width="60" height="10" fill="#CE2939"/><rect y="10" width="60" height="10" fill="#fff"/><rect y="20" width="60" height="10" fill="#477050"/>` +
        `<ellipse cx="30" cy="15" rx="6" ry="7" fill="none" stroke="#E8A33D" stroke-width="1.6"/>` +
        `<rect x="28.4" y="13" width="3.2" height="6" fill="#CE2939"/>` +
        star(30, 10.5, 2.6, '#CE2939')),

    // Rumaenien 1965-1989: senkrechte Trikolore, Wappen im gelben Streifen
    'ROU_SOC': S(`<rect width="20" height="30" fill="#002B7F"/><rect x="20" width="20" height="30" fill="#FCD116"/><rect x="40" width="20" height="30" fill="#CE1126"/>` +
        `<ellipse cx="30" cy="15" rx="4.4" ry="6" fill="none" stroke="#7A5C1E" stroke-width="1.4"/>` +
        `<path d="M27.5 17 L30 10 L32.5 17 Z" fill="#2E7D32"/>` +
        star(30, 9.5, 2, '#CE1126')),

    // Bulgarien 1948-1990: Trikolore, Staatsemblem im Obereck
    'BUL_SOC': S(`<rect width="60" height="10" fill="#fff"/><rect y="10" width="60" height="10" fill="#00966E"/><rect y="20" width="60" height="10" fill="#D62612"/>` +
        `<ellipse cx="11" cy="8" rx="5.4" ry="6.4" fill="none" stroke="#D62612" stroke-width="1.3"/>` +
        `<path d="M8.4 10.4 q2.6 -4 5.2 0 q-2.6 2.4 -5.2 0z" fill="#C8A020"/>` +
        star(11, 3.4, 1.9, '#D62612')),

    // USA bis 1959: 48 Sterne (6x8)
    'USA_48': S(usStripes() + `<rect width="24" height="${(30 * 7 / 13).toFixed(2)}" fill="#3C3B6E"/>` +
        starField(6, 8, 24, 30 * 7 / 13, 0.85)),

    // USA 1959-1960: 49 Sterne (7x7)
    'USA_49': S(usStripes() + `<rect width="24" height="${(30 * 7 / 13).toFixed(2)}" fill="#3C3B6E"/>` +
        starField(7, 7, 24, 30 * 7 / 13, 0.85)),

    // Malaiische Foederation 1950-1963: 11 Streifen, Halbmond + 11-zackiger Stern
    'MAS_MALAYA': (() => {
        let stripes = '<rect width="60" height="30" fill="#fff"/>';
        for (let i = 0; i < 11; i += 2) stripes += `<rect y="${(i * 30 / 11).toFixed(2)}" width="60" height="${(30 / 11).toFixed(2)}" fill="#CC0001"/>`;
        const pts = [];
        for (let i = 0; i < 22; i++) {
            const rr = (i % 2 === 0) ? 3.2 : 1.4;
            const a = -Math.PI / 2 + i * Math.PI / 11;
            pts.push(`${(19 + rr * Math.cos(a)).toFixed(2)},${(9 + rr * Math.sin(a)).toFixed(2)}`);
        }
        return S(stripes + `<rect width="27" height="${(30 * 6 / 11).toFixed(2)}" fill="#000080"/>` +
            `<circle cx="10" cy="9" r="4.6" fill="#FFCC00"/><circle cx="11.8" cy="8.2" r="4" fill="#000080"/>` +
            `<polygon points="${pts.join(' ')}" fill="#FFCC00"/>`);
    })(),

    // Griechenland bis 1978: nur das weisse Kreuz auf Blau, ohne Streifen
    'GRE_OLD': S(`<rect width="60" height="30" fill="#0D5EAF"/>` +
        `<rect x="24" width="12" height="30" fill="#fff"/><rect y="9" width="60" height="12" fill="#fff"/>`)
};

fs.mkdirSync(OUTDIR, { recursive: true });
const lines = [];
for (const [code, svg] of Object.entries(FLAGS)) {
    fs.writeFileSync(path.join(OUTDIR, code + '.svg'), svg);
    const uri = 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');
    lines.push(`            '${code}':${' '.repeat(Math.max(1, 12 - code.length))}'${uri}',`);
    console.log(`${code.padEnd(12)} ${String(svg.length).padStart(5)} B roh  ->  ${uri.length} B als data-URI`);
}
fs.writeFileSync(path.join(OUTDIR, '_snippet.txt'), lines.join('\n'));
console.log(`\n${Object.keys(FLAGS).length} Flaggen -> ${path.relative(ROOT, OUTDIR)}/  (+ _snippet.txt zum Einsetzen)`);
