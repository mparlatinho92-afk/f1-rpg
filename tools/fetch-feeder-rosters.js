#!/usr/bin/env node
/**
 * fetch-feeder-rosters.js — liest die F2/F3-Startaufstellungen je Saison von Wikipedia
 * und vergleicht sie mit FEEDER_DRIVERS in index.html.
 *
 * Zweck: der offene Punkt aus FIXES_OFFEN.md — "fehlende Fahrer ab 2022 ergaenzen".
 * Es wird NICHTS geschrieben; das Skript liefert nur die Differenz als Bericht.
 *
 * Quelle: Wikipedia-Abschnitt "Entries" der Saisonartikel. Fahrer stehen dort als
 * {{flagicon|XXX}} [[Name]] — daran haengt die Erkennung, nicht an der Tabellenspalte.
 * Seitentitel sind uneinheitlich (F2 ohne "FIA", F3 mit), deshalb beide Varianten.
 *
 * Aufruf: node tools/fetch-feeder-rosters.js [--von=2022] [--bis=2026]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const VON = Number((args.find(a => a.startsWith('--von=')) || '').split('=')[1]) || 2022;
const BIS = Number((args.find(a => a.startsWith('--bis=')) || '').split('=')[1]) || 2026;

const sleep = ms => new Promise(r => setTimeout(r, ms));
function get(url) {
    return new Promise(res => {
        https.get(url, { headers: { 'User-Agent': 'F1RPG-roster-check/1.0 (personal hobby project)' } }, s => {
            const c = []; s.on('data', d => c.push(d));
            s.on('end', () => res(Buffer.concat(c).toString('utf8')));
        }).on('error', () => res(null));
    });
}
async function wikitext(title) {
    const b = await get('https://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&rvprop=content&rvslots=main&redirects=1&titles=' + encodeURIComponent(title));
    if (!b) return null;
    try {
        const p = Object.values(JSON.parse(b).query.pages)[0];
        return p && p.revisions ? p.revisions[0].slots.main['*'] : null;
    } catch (e) { return null; }
}

// Fahrer aus dem Abschnitt "Entries" ziehen
function driversFrom(wt) {
    if (!wt) return [];
    const i = wt.search(/^==+\s*Entries\s*==+/m);
    if (i < 0) return [];
    // bis zur naechsten gleichrangigen Ueberschrift
    const rest = wt.slice(i + 5);
    const j = rest.search(/^==[^=]/m);
    const blk = rest.slice(0, j > 0 ? j : 12000);
    const out = new Set();
    for (const m of blk.matchAll(/\{\{\s*flagicon\|[^}]+\}\}\s*'*\[\[([^\]|#]+)/g)) {
        const n = m[1].trim();
        // Teams/Serien haben oft Klammerzusaetze oder Schluesselwoerter
        if (/racing|motorsport|team|academy|engineering|gp$|prema|campos|trident|rodin|invicta|aix|hitech|van amersfoort/i.test(n)) continue;
        if (n.length < 4 || n.length > 40) continue;
        out.add(n);
    }
    return [...out];
}

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

(async () => {
    // Ist-Bestand
    const h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const i = h.indexOf('const FEEDER_DRIVERS'), e = h.indexOf('\n        ];', i);
    const have = [...h.slice(i, e).matchAll(/\["([^"]+)","([^"]*)",(\d+),"([^"]+)",(\d+)\]/g)]
        .map(r => ({ name: r[1], serie: r[4], entry: +r[5] }));
    const haveSet = new Set(have.map(d => norm(d.name)));
    console.log(`FEEDER_DRIVERS im Spiel: ${have.length}\n`);

    const found = new Map();   // normName -> {name, seasons:[{serie,year}]}
    for (let y = VON; y <= BIS; y++) {
        for (const serie of ['F2', 'F3']) {
            const titles = serie === 'F2'
                ? [`${y} Formula 2 Championship`, `${y} FIA Formula 2 Championship`]
                : [`${y} FIA Formula 3 Championship`, `${y} Formula 3 Championship`];
            let names = [];
            for (const t of titles) {
                await sleep(400);
                names = driversFrom(await wikitext(t));
                if (names.length) break;
            }
            console.log(`${y} ${serie}: ${names.length} Fahrer`);
            names.forEach(n => {
                const k = norm(n);
                if (!found.has(k)) found.set(k, { name: n, seasons: [] });
                found.get(k).seasons.push(serie + ' ' + y);
            });
        }
    }

    const missing = [...found.values()].filter(d => !haveSet.has(norm(d.name)));
    const extra = have.filter(d => !found.has(norm(d.name)));

    console.log(`\n=== Ergebnis ${VON}-${BIS} ===`);
    console.log(`auf Wikipedia gefunden : ${found.size}`);
    console.log(`davon im Spiel         : ${found.size - missing.length}`);
    console.log(`FEHLEN im Spiel        : ${missing.length}`);
    console.log(`im Spiel, aber nicht in diesen Saisons: ${extra.length} (aeltere Jahrgaenge oder andere Serien)`);

    console.log('\n--- Fehlende Fahrer ---');
    missing.sort((a, b) => a.name.localeCompare(b.name))
        .forEach(d => console.log(`  ${d.name.padEnd(26)} ${d.seasons.join(', ')}`));

    fs.writeFileSync(path.join(ROOT, 'assets-backup', 'feeder-roster-diff.json'),
        JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), von: VON, bis: BIS, missing, extra }, null, 2));
    console.log('\nRohdaten: assets-backup/feeder-roster-diff.json');
})();
