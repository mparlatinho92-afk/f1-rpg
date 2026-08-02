#!/usr/bin/env node
/**
 * search-openverse-portraits.js — fuenfter Suchweg: Openverse.
 *
 * Openverse buendelt CC-lizenzierte Bilder aus Wikimedia, Flickr und weiteren Quellen und
 * durchsucht TITEL UND BESCHREIBUNG — nicht nur den Dateinamen. Genau daran scheiterte der
 * Commons-Weg: "Pepe Marti en la F1 Academy 2023" liegt auf Commons, der Dateiname lautet
 * aber anders. Zusaetzlich kommt Flickr dazu, dort teils unter by-sa.
 *
 * Lizenzfilter: nur by, by-sa, cc0, pdm — also Lizenzen, die BEARBEITUNG erlauben.
 * ND-Lizenzen sind ausgeschlossen, weil wir die Bilder zuschneiden.
 *
 * Sicherungen wie beim Commons-Weg:
 *  - Name muss zusammenhaengend im Titel stehen
 *  - Rennkontext als VERTRAUENSGRAD, nicht als Ausschluss: er verwarf sonst genau die
 *    besten Portraets, deren Titel nur aus Name und Jahr besteht (RalphBoschung2021).
 *  - Seitenverhaeltnis <= 1.2 (Openverse liefert width/height mit, kein Download noetig)
 *
 * Schreibt NICHTS ins Spiel. Ergebnis: assets-backup/openverse-portraits.json
 * Aufruf: node tools/search-openverse-portraits.js [--delay=1500] [--limit=N]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const DELAY = Number((args.find(a => a.startsWith('--delay=')) || '').split('=')[1]) || 1500;
const LIMIT = Number((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || 0;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
const slug = n => 'feeder-' + n.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Rennkontext. Gegenueber dem Commons-Lauf ergaenzt um Serien, die dort gefehlt haben —
// "Callum Voisin GB3" war deshalb faelschlich durchgefallen.
const MOTORSPORT_WORTE = ['f1', 'f2', 'f3', 'f4', 'gb3', 'gb4', 'formula', 'formel', 'formule', 'frec', 'freca',
    'gp2', 'gp3', 'euroformula', 'eurocup', 'adac', 'indy', 'indycar', 'nascar', 'kart', 'karting', 'academy',
    'motorsport', 'motorsports', 'racing', 'grand', 'prix', 'eprix', 'paddock', 'pitlane', 'podium', 'grid',
    'circuit', 'ring', 'raceway', 'autodromo', 'spielberg', 'monza', 'silverstone', 'zandvoort', 'barcelona',
    'imola', 'spa', 'macau', 'baku', 'jerez', 'mugello', 'hockenheim', 'nurburgring', 'melbourne', 'austria',
    'bahrain', 'monaco', 'suzuka', 'interlagos', 'hungaroring', 'sakhir', 'losail', 'yas', 'marina'];
function hatRennkontext(text) {
    const t = ' ' + String(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ') + ' ';
    return MOTORSPORT_WORTE.some(w => t.includes(' ' + w + ' '));
}
// Portraet-Hinweise, beste zuerst
const PORTRAIT = [/headshot/i, /portrait/i, /cropped/i, /paddock/i, /grid/i, /interview/i, /press/i];
const rang = t => { for (let i = 0; i < PORTRAIT.length; i++) if (PORTRAIT[i].test(t)) return i; return 99; };

function api(url) {
    return new Promise(res => {
        https.get(url, { headers: { 'User-Agent': 'F1RPG-asset-backup/1.0 (https://github.com/mparlatinho92-afk/f1-rpg)', 'Accept': 'application/json' } }, s => {
            const c = []; s.on('data', d => c.push(d));
            s.on('end', () => { try { res(JSON.parse(Buffer.concat(c).toString())); } catch (e) { res(null); } });
        }).on('error', () => res(null));
    });
}

(async () => {
    const h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const i = h.indexOf('const FEEDER_DRIVERS'), e = h.indexOf('\n        ];', i);
    const kader = [...h.slice(i, e).matchAll(/\["([^"]+)","[^"]*",(\d+),/g)].map(m => ({ name: m[1], birth: +m[2] }));
    const oi = h.indexOf('const FEEDER_PHOTO_OVERRIDES'), oe = h.indexOf('\n        };', oi);
    const drin = new Set([...h.slice(oi, oe).matchAll(/'([^']+)'\s*:/g)].map(m => m[1]));

    let offen = kader.filter(d => !drin.has(slug(d.name)));
    if (LIMIT) offen = offen.slice(0, LIMIT);
    console.log(`${offen.length} Fahrer ohne Foto — Suche ueber Openverse\n`);

    const treffer = [], leer = [];
    for (const d of offen) {
        await sleep(DELAY);
        const r = await api('https://api.openverse.org/v1/images/?q=' + encodeURIComponent(d.name)
            + '&license=by,by-sa,cc0,pdm&page_size=20');
        const res = (r && r.results) || [];
        const voll = norm(d.name);
        // Harte Bedingungen: Name im Titel und Portraet-Format. Der Rennkontext ist BEWUSST
        // keine Ausschlussbedingung mehr — er verwarf sonst gerade die besten Bilder, deren
        // Titel nur aus Name und Jahr besteht ("RalphBoschung2021", Format 0.76). Stattdessen
        // wird er als Vertrauensgrad mitgefuehrt; gesichtet wird ohnehin jedes Bild.
        const kandidaten = res
            .filter(x => norm(x.title || '').includes(voll))
            .filter(x => !x.width || !x.height || (x.width / x.height) <= 1.2)
            .map(x => ({
                x, kontext: hatRennkontext((x.title || '') + ' ' + (x.creator || '')
                    + ' ' + ((x.tags || []).map(t => t.name || t).join(' ')))
            }))
            .sort((a, b) => (b.kontext - a.kontext) || (rang(a.x.title || '') - rang(b.x.title || '')))
            .map(o => Object.assign(o.x, { _kontext: o.kontext }));
        if (!kandidaten.length) { leer.push(d.name); console.log(`  ·  ${d.name.padEnd(24)} ${res.length} Treffer, keiner passt`); continue; }
        const k = kandidaten[0];
        treffer.push({
            name: d.name, birth: d.birth, titel: k.title, quelle: k.source,
            license: (k.license || '').toUpperCase() + (k.license_version ? ' ' + k.license_version : ''),
            author: k.creator || 'unbekannt', url: k.url, seite: k.foreign_landing_url, rennkontext: !!k._kontext,
            ar: k.width && k.height ? +(k.width / k.height).toFixed(2) : null
        });
        console.log(`  ✓  ${d.name.padEnd(24)} AR ${String(treffer[treffer.length - 1].ar).padEnd(5)} ${String(treffer[treffer.length - 1].license).padEnd(10)} ${(k._kontext ? 'Kontext' : 'nur Name').padEnd(9)} ${String(k.source).padEnd(10)} ${(k.title || '').slice(0, 34)}`);
    }

    fs.writeFileSync(path.join(ROOT, 'assets-backup', 'openverse-portraits.json'),
        JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), treffer, leer }, null, 2));
    console.log(`\ngefunden: ${treffer.length}   weiterhin ohne: ${leer.length}`);
    console.log('NAECHSTER SCHRITT: Identitaet pruefen (DriverDB/Wikidata) und Bilder sichten.');
})();
