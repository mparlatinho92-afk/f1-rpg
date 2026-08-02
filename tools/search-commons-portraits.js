#!/usr/bin/env node
/**
 * search-commons-portraits.js — vierter Suchweg fuer Fahrerfotos: Commons-VOLLTEXT.
 *
 * Die bisherigen Wege (Wikidata-P18, Wikipedia-Vorschaubild, Commons-Kategorie) uebersehen
 * Dateien, die niemand einer Fahrer-Kategorie zugeordnet und niemand als P18 hinterlegt hat.
 * Genau dort liegen aber die Portraets: "Taylor Barnard - Berlin Grid 2026",
 * "Mari Boya 07-06-25 (cropped)". Die Volltextsuche findet sie.
 *
 * Sicherungen, die dabei NICHT fallen:
 *  - Nur Dateien, deren Name ALLE Namensbestandteile des Fahrers enthaelt. Ein blosser
 *    Namensabgleich ohne Kontext hatte drei fremde Personen ins Spiel gebracht.
 *  - Lizenz und Urheber muessen vorhanden sein, sonst unbrauchbar (CC verlangt Nennung).
 *  - Seitenverhaeltnis <= 1.2, sonst ist es eine Streckenaufnahme statt eines Gesichts.
 *
 * Schreibt NICHTS ins Spiel. Ergebnis: assets-backup/commons-portraits.json
 *
 * Aufruf: node tools/search-commons-portraits.js [--delay=1200] [--limit=N]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const DELAY = Number((args.find(a => a.startsWith('--delay=')) || '').split('=')[1]) || 1200;
const LIMIT = Number((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || 0;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
const slug = n => 'feeder-' + n.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function api(url) {
    return new Promise(res => {
        https.get(url, { headers: { 'User-Agent': 'F1RPG-asset-backup/1.0 (https://github.com/mparlatinho92-afk/f1-rpg)' } }, s => {
            const c = []; s.on('data', d => c.push(d));
            s.on('end', () => { try { res(JSON.parse(Buffer.concat(c).toString())); } catch (e) { res(null); } });
        }).on('error', () => res(null));
    });
}
async function apiGeduldig(url) {   // Wikimedia drosselt; warten statt haemmern
    let r = await api(url);
    for (let a = 1; a <= 3 && !r; a++) { await sleep(10000 * a); r = await api(url); }
    return r;
}

// Rennkontext im Dateinamen. Serien, Strecken und Anlaesse — ohne mindestens einen
// dieser Belege ist ein Namenstreffer wertlos.
// Rennkontext im Dateinamen. Als Wortliste statt als Muster: Wortgrenzen im regulaeren
// Ausdruck ueberlebten die Shell-Maskierung nicht und lieferten stillschweigend null Treffer.
const MOTORSPORT_WORTE = ['f1','f2','f3','f4','formula','formel','formule','frec','freca',
    'gp2','gp3','euroformula','eurocup','indy','nascar','kart','karting','motorsport','racing',
    'grand','prix','eprix','paddock','pitlane','podium','grid','circuit','ring','spielberg',
    'monza','silverstone','zandvoort','barcelona','imola','spa','macau','baku','jerez','mugello',
    'hockenheim','melbourne','austria','bahrain','monaco','suzuka','interlagos','hauptrennen'];
function hatRennkontext(datei) {
    const t = ' ' + String(datei).toLowerCase().replace(/[^a-z0-9]+/g, ' ') + ' ';
    return MOTORSPORT_WORTE.some(w => t.includes(' ' + w + ' '));
}

// Hinweise im Dateinamen, die fuer ein Portraet sprechen — je frueher, desto besser
const PORTRAIT = [/headshot/i, /portrait/i, /\(cropped/i, /paddock/i, /grid/i, /interview/i, /melbourne walk/i, /press/i];
function rang(datei) {
    for (let i = 0; i < PORTRAIT.length; i++) if (PORTRAIT[i].test(datei)) return i;
    return 99;
}

(async () => {
    const h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const i = h.indexOf('const FEEDER_DRIVERS'), e = h.indexOf('\n        ];', i);
    const kader = [...h.slice(i, e).matchAll(/\["([^"]+)","[^"]*",(\d+),/g)].map(m => ({ name: m[1], birth: +m[2] }));
    const oi = h.indexOf('const FEEDER_PHOTO_OVERRIDES'), oe = h.indexOf('\n        };', oi);
    const drin = new Set([...h.slice(oi, oe).matchAll(/'([^']+)'\s*:/g)].map(m => m[1]));

    let offen = kader.filter(d => !drin.has(slug(d.name)));
    if (LIMIT) offen = offen.slice(0, LIMIT);
    console.log(`${offen.length} Fahrer ohne Foto — Volltextsuche auf Commons\n`);

    const treffer = [], leer = [];
    for (const d of offen) {
        await sleep(DELAY);
        const such = await apiGeduldig('https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=25&srsearch=' + encodeURIComponent(d.name));
        const dateien = ((such && such.query || {}).search || []).map(x => x.title.replace(/^File:/, ''));
        // Der Name muss ZUSAMMENHAENGEND im Dateinamen stehen. "Alle Teile irgendwo" reicht
        // nicht: so traf "Josh Mason" das Bild "Josh Norman, Cam Newton, Mason Foster" —
        // drei fremde Personen, deren Namensteile zufaellig passten.
        const voll = norm(d.name);
        // ZWEITE Bedingung: Motorsport-Bezug. Der Name allein trifft weltweit Namensvettern —
        // die Suche lieferte unter "Alessandro Giusti" ein Fresko, unter "Carl Bennett" ein Grab
        // und unter "Josh Mason" einen Angehoerigen der US Air Force. Erst Name UND Rennkontext
        // im Dateinamen machen den Treffer belastbar.
        const passend = dateien.filter(f => norm(f).includes(voll))
            .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
            .filter(f => hatRennkontext(f))
            .sort((a, b) => rang(a) - rang(b));
        if (!passend.length) { leer.push(d.name); console.log(`  ·  ${d.name.padEnd(26)} nichts`); continue; }

        // Beste Kandidaten der Reihe nach pruefen: Format + Lizenz muessen stimmen
        let gewaehlt = null;
        for (const datei of passend.slice(0, 6)) {
            await sleep(600);
            const meta = await apiGeduldig('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo'
                + '&iiprop=url|size|extmetadata&iiextmetadatafilter=LicenseShortName|Artist&iiurlwidth=250&titles='
                + encodeURIComponent('File:' + datei));
            let ii = null;
            try { ii = Object.values(meta.query.pages)[0].imageinfo[0]; } catch (x) { }
            if (!ii) continue;
            const ar = ii.width && ii.height ? +(ii.width / ii.height).toFixed(2) : null;
            const em = ii.extmetadata || {};
            const lic = em.LicenseShortName ? em.LicenseShortName.value : null;
            const aut = (em.Artist ? em.Artist.value : '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
            if (!lic) continue;                       // ohne Lizenz unbrauchbar
            if (ar && ar > 1.2) continue;             // zu breit -> Streckenaufnahme
            gewaehlt = { datei, ar, license: lic, author: aut, thumb: ii.thumburl || ii.url };
            break;
        }
        if (!gewaehlt) { leer.push(d.name); console.log(`  ·  ${d.name.padEnd(26)} ${passend.length} Namenstreffer, aber kein brauchbares Format/Lizenz`); continue; }
        treffer.push({ name: d.name, birth: d.birth, ...gewaehlt });
        console.log(`  ✓  ${d.name.padEnd(26)} AR ${String(gewaehlt.ar).padEnd(5)} ${String(gewaehlt.license).padEnd(14)} ${gewaehlt.datei.slice(0, 46)}`);
    }

    fs.writeFileSync(path.join(ROOT, 'assets-backup', 'commons-portraits.json'),
        JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), treffer, leer }, null, 2));
    console.log(`\ngefunden: ${treffer.length}   weiterhin ohne: ${leer.length}`);
    console.log('Ergebnis: assets-backup/commons-portraits.json');
    console.log('NAECHSTER SCHRITT: Identitaet pruefen (Jahrgang) und Bilder sichten, bevor etwas eingebaut wird.');
})();
