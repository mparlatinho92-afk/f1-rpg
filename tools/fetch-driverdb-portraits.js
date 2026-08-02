#!/usr/bin/env node
/**
 * fetch-driverdb-portraits.js — holt die Profilbilder von driverdb.com.
 *
 * QUALITAET: echte Studioportraets vor weissem Hintergrund, im selben Stil wie die
 * statsf1-Bilder. Vorhanden sind sie allerdings nur fuer etwa jeden dritten Junior.
 *
 * RECHTELAGE — bitte lesen, bevor jemand das ausweitet:
 * Diese Bilder stehen NICHT unter einer freien Lizenz. DriverDB nennt als Nachweis
 * Presse- und Teamquellen ("ADAC Motorsport"), also geschuetztes Material. Der Nutzer
 * hat die Verwendung fuer sein privates Projekt am 2026-08-02 ausdruecklich entschieden,
 * nachdem auf die Lage hingewiesen wurde. Daraus folgt:
 *  - Bilder werden VERLINKT, nicht in die HTML eingebettet.
 *  - Die lokalen Kopien liegen in assets-backup/driverdb-photos/ und sind per .gitignore
 *    vom oeffentlichen Repo ausgenommen — dort wird nichts weiterverbreitet.
 *  - Der Nachweis aus profile_image_credits wird mitgefuehrt und im Spiel angezeigt.
 *
 * robots.txt: /drivers/ ist erlaubt, /api/ verboten — es wird nur /drivers/ geholt.
 *
 * Aufruf: node tools/fetch-driverdb-portraits.js [--delay=1600] [--limit=N]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets-backup', 'driverdb-photos');
const args = process.argv.slice(2);
const DELAY = Number((args.find(a => a.startsWith('--delay=')) || '').split('=')[1]) || 1600;
const LIMIT = Number((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || 0;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
const normDe = s => (s || '').toLowerCase().replace(/ü/g, 'ue').replace(/ö/g, 'oe').replace(/ä/g, 'ae').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
const slug = n => 'feeder-' + n.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const SLUG_AUSNAHMEN = {
    'Javier Sagrera': 'francisco-javier-sagrera-pont',
    'Martinius Stenshorne': 'martinius-kleve-stenshorne',
    'Francesco Pizzi': 'francesco-raffaele-pizzi'
};

function hole(url, r0 = 0) {
    return new Promise(res => {
        if (r0 > 4) return res({});
        https.get(url, { headers: { 'User-Agent': 'F1RPG-asset-backup/1.0 (https://github.com/mparlatinho92-afk/f1-rpg)' } }, s => {
            if ([301, 302, 307, 308].includes(s.statusCode) && s.headers.location) {
                s.resume(); return res(hole(new URL(s.headers.location, url).toString(), r0 + 1));
            }
            const c = []; s.on('data', d => c.push(d));
            s.on('end', () => res({ code: s.statusCode, buf: Buffer.concat(c) }));
        }).on('error', () => res({}));
    });
}

// Die Seitendaten liegen als maskiertes JSON im Quelltext — erst entmaskieren, dann lesen.
function feld(html, name) {
    const roh = html.split('\\"').join('"');
    const i = roh.indexOf('"' + name + '"');
    if (i < 0) return undefined;
    const m = roh.slice(i + name.length + 2, i + name.length + 400).match(/^\s*:\s*(null|"([^"]*)")/);
    if (!m) return undefined;
    return m[1] === 'null' ? null : m[2];
}

(async () => {
    const h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const i = h.indexOf('const FEEDER_DRIVERS'), e = h.indexOf('\n        ];', i);
    const kader = [...h.slice(i, e).matchAll(/\["([^"]+)","[^"]*",(\d+),/g)].map(m => ({ name: m[1], birth: +m[2] }));
    const oi = h.indexOf('const FEEDER_PHOTO_OVERRIDES'), oe = h.indexOf('\n        };', oi);
    const drin = new Set([...h.slice(oi, oe).matchAll(/'([^']+)'\s*:/g)].map(m => m[1]));
    let offen = kader.filter(d => !drin.has(slug(d.name)));
    if (LIMIT) offen = offen.slice(0, LIMIT);

    const slugs = new Map(JSON.parse(fs.readFileSync(path.join(ROOT, 'assets-backup', 'driverdb-slugs.json'), 'utf8')));
    fs.mkdirSync(OUT, { recursive: true });
    console.log(`${offen.length} Fahrer ohne Foto — DriverDB-Profilbilder\n`);

    const treffer = [], leer = [];
    for (const d of offen) {
        const um = d.name.split(/\s+/).reverse().join('');
        const s = SLUG_AUSNAHMEN[d.name] || slugs.get(norm(d.name)) || slugs.get(normDe(d.name))
            || slugs.get(norm(um)) || slugs.get(normDe(um));
        if (!s) { leer.push({ name: d.name, grund: 'kein Slug' }); console.log(`  ·  ${d.name.padEnd(24)} kein Slug`); continue; }
        await sleep(DELAY);
        const r = await hole('https://www.driverdb.com/drivers/' + s);
        if (!r.buf) { leer.push({ name: d.name, grund: 'Seite nicht erreichbar' }); console.log(`  ·  ${d.name.padEnd(24)} nicht erreichbar`); continue; }
        const html = r.buf.toString();
        const url = feld(html, 'profile_image_url');
        // Jahrgang gleich mitpruefen — ein falscher Slug faellt so sofort auf
        const geb = feld(html, 'birthDate');
        const jahr = geb ? parseInt(geb.slice(0, 4), 10) : null;
        if (jahr && jahr !== d.birth) { leer.push({ name: d.name, grund: `Jahrgang ${jahr} statt ${d.birth}` }); console.log(`  ✗  ${d.name.padEnd(24)} FALSCHE PERSON (${jahr} statt ${d.birth})`); continue; }
        if (!url) { leer.push({ name: d.name, grund: 'kein Profilbild' }); console.log(`  ·  ${d.name.padEnd(24)} kein Profilbild hinterlegt`); continue; }

        const credits = feld(html, 'profile_image_credits') || 'DriverDB';
        await sleep(500);
        const img = await hole(url);
        if (!img.buf || img.buf.length < 900) { leer.push({ name: d.name, grund: 'Bild-Download ' + img.code }); console.log(`  ·  ${d.name.padEnd(24)} Download HTTP ${img.code}`); continue; }
        const datei = slug(d.name).replace(/^feeder-/, '') + '.jpg';
        fs.writeFileSync(path.join(OUT, datei), img.buf);
        treffer.push({ name: d.name, datei, bytes: img.buf.length, url, credits, slug: s, jahr });
        console.log(`  ✓  ${d.name.padEnd(24)} ${(img.buf.length / 1024).toFixed(1).padStart(6)} KB   ${credits}`);
    }

    fs.writeFileSync(path.join(ROOT, 'assets-backup', 'driverdb-portraits.json'),
        JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), treffer, leer }, null, 2));
    console.log(`\ngefunden: ${treffer.length}   ohne: ${leer.length}`);
})();
