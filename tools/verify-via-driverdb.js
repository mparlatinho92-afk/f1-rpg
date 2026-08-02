#!/usr/bin/env node
/**
 * verify-via-driverdb.js — zweite, unabhaengige Identitaetsquelle: driverdb.com.
 *
 * Warum noetig: Wikidata deckt nur einen Teil der Junioren ab, und der Abgleich dort
 * scheitert, wenn die Wikidata-Suche schon den falschen Menschen erwischt hat. DriverDB
 * ist eine reine Motorsport-Datenbank — wer dort steht, ist Rennfahrer.
 *
 * Die Seiten liefern schema.org-Daten im Quelltext:
 *   jobTitle "Racing Driver", birthDate, nationality, memberOf (Team)
 * Damit laesst sich Jahrgang UND Nationalitaet gegen FEEDER_DRIVERS pruefen.
 *
 * REGELN, die eingehalten werden:
 *  - robots.txt erlaubt die Seiten, verbietet aber /api/ — es wird NUR /drivers/ geholt.
 *  - Es werden KEINE Bilder uebernommen. Die dortigen Fotos tragen keine freie Lizenz.
 *    DriverDB dient ausschliesslich der Verifikation (Nutzer-Entscheidung 2026-08-02).
 *
 * Aufruf: node tools/verify-via-driverdb.js [--delay=1500] [--namen=A,B]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const DELAY = Number((args.find(a => a.startsWith('--delay=')) || '').split('=')[1]) || 1500;
const NAMEN = (args.find(a => a.startsWith('--namen=')) || '').split('=')[1];

const sleep = ms => new Promise(r => setTimeout(r, ms));
// Umlaute werden in DriverDB-Slugs als ue/oe/ae geschrieben (joshua-duerksen), die
// uebliche Diakritika-Entfernung macht daraus 'u' — deshalb beide Formen als Schluessel.
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
const normDe = s => (s || '').toLowerCase().replace(/ü/g,'ue').replace(/ö/g,'oe').replace(/ä/g,'ae').replace(/ß/g,'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

function hole(url) {
    return new Promise(res => {
        https.get(url, { headers: { 'User-Agent': 'F1RPG-verify/1.0 (https://github.com/mparlatinho92-afk/f1-rpg)' } }, s => {
            if ([301, 302, 307, 308].includes(s.statusCode) && s.headers.location) {
                s.resume(); return res(hole(new URL(s.headers.location, url).toString()));
            }
            const c = []; s.on('data', d => c.push(d));
            s.on('end', () => res({ code: s.statusCode, body: Buffer.concat(c).toString() }));
        }).on('error', e => res({ err: e.message }));
    });
}

// DriverDB fuehrt teils den vollen buergerlichen Namen, unser Kader den Rennnamen.
// Diese Faelle sind per Namensabgleich nicht auffindbar und deshalb hier hinterlegt.
const SLUG_AUSNAHMEN = {
    'Javier Sagrera': 'francisco-javier-sagrera-pont',
    'Martinius Stenshorne': 'martinius-kleve-stenshorne',
    'Francesco Pizzi': 'francesco-raffaele-pizzi'
};

// WICHTIG zur Bewertung: DriverDB ist eine zweite Meinung, keine hoehere Instanz.
// Beispiel Alessandro Giusti — DriverDB sagt Jahrgang 2005, Wikipedia UND Wikidata
// sagen 2006-09-10. Bei Abweichungen also immer eine dritte Quelle heranziehen,
// nicht blind umschreiben. Umgekehrt lag bei Francesco Simonazzi unser Kader falsch.

// Slug-Verzeichnis aus den Sitemaps — die Slugs sind uneinheitlich
// (mal vorname-nachname, mal nachname-vorname), deshalb nicht ableitbar.
async function slugIndex() {
    const cache = path.join(ROOT, 'assets-backup', 'driverdb-slugs.json');
    if (fs.existsSync(cache)) return new Map(JSON.parse(fs.readFileSync(cache, 'utf8')));
    const map = new Map();
    for (let i = 0; i < 4; i++) {
        await sleep(800);
        const r = await hole(`https://www.driverdb.com/sitemap/drivers-${i}.xml`);
        if (!r.body) continue;
        for (const m of r.body.matchAll(/drivers\/([^<\s]+)/g)) {
            const slug = m[1];
            map.set(norm(slug), slug);                       // vorname-nachname
            map.set(norm(slug.split('-').reverse().join('')), slug);   // umgekehrte Reihenfolge
            map.set(normDe(slug), slug);                     // ue/oe/ae-Schreibung
            map.set(normDe(slug.split('-').reverse().join('')), slug);
        }
        process.stdout.write(`  Sitemap ${i}: ${map.size} Schluessel\n`);
    }
    fs.writeFileSync(cache, JSON.stringify([...map]));
    return map;
}

// schema.org-Daten aus dem Quelltext ziehen
function personDaten(html) {
    const i = html.indexOf('"jobTitle":"Racing Driver"');
    if (i < 0) return null;
    const seg = html.slice(Math.max(0, i - 400), i + 600);
    const g = re => { const m = seg.match(re); return m ? m[1] : null; };
    return {
        birthDate: g(/"birthDate":"([^"]+)"/),
        nationality: g(/"nationality":\{[^}]*"name":"([^"]+)"/),
        team: g(/"memberOf":\{[^}]*"name":"([^"]+)"/)
    };
}

(async () => {
    const h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const i = h.indexOf('const FEEDER_DRIVERS'), e = h.indexOf('\n        ];', i);
    let kader = [...h.slice(i, e).matchAll(/\["([^"]+)","([^"]*)",(\d+),/g)]
        .map(m => ({ name: m[1], flagge: m[2], birth: +m[3] }));
    if (NAMEN) { const w = new Set(NAMEN.split(',')); kader = kader.filter(d => w.has(d.name)); }

    console.log('Slug-Verzeichnis aufbauen...');
    const slugs = await slugIndex();
    console.log(`${slugs.size} Schluessel, pruefe ${kader.length} Fahrer\n`);

    const ok = [], abweichung = [], fehlt = [];
    for (const d of kader) {
        const umgedreht = d.name.split(/\s+/).reverse().join('');
        const slug = SLUG_AUSNAHMEN[d.name]
            || slugs.get(norm(d.name)) || slugs.get(normDe(d.name))
            || slugs.get(norm(umgedreht)) || slugs.get(normDe(umgedreht));
        if (!slug) { fehlt.push({ ...d, grund: 'nicht in der Sitemap' }); console.log(`  ·  ${d.name.padEnd(26)} nicht gefunden`); continue; }
        await sleep(DELAY);
        const r = await hole('https://www.driverdb.com/drivers/' + slug);
        if (!r.body || r.code !== 200) { fehlt.push({ ...d, slug, grund: 'HTTP ' + (r.code || r.err) }); console.log(`  ·  ${d.name.padEnd(26)} HTTP ${r.code || r.err}`); continue; }
        const p = personDaten(r.body);
        if (!p || !p.birthDate) { fehlt.push({ ...d, slug, grund: 'keine Personendaten' }); console.log(`  ?  ${d.name.padEnd(26)} keine Daten auf der Seite`); continue; }

        const jahr = parseInt(p.birthDate.slice(0, 4), 10);
        const zeile = { name: d.name, sollJahr: d.birth, istJahr: jahr, nationalitaet: p.nationality, team: p.team, slug };
        if (jahr !== d.birth) { abweichung.push(zeile); console.log(`  ✗  ${d.name.padEnd(26)} Jahrgang ${jahr} statt ${d.birth}   (${p.nationality || '?'})`); }
        else { ok.push(zeile); console.log(`  ✓  ${d.name.padEnd(26)} ${jahr}  ${String(p.nationality || '').padEnd(14)} ${p.team || ''}`); }
    }

    fs.writeFileSync(path.join(ROOT, 'assets-backup', 'driverdb-verify.json'),
        JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), ok, abweichung, fehlt }, null, 2));
    console.log(`\nbestaetigt: ${ok.length}   Abweichung: ${abweichung.length}   ohne Eintrag: ${fehlt.length}`);
})();
