#!/usr/bin/env node
/**
 * verify-feeder-identity.js — prueft, ob die Fotos wirklich den richtigen Fahrer zeigen.
 *
 * Anlass: zwei Bilder zeigten voellig andere Personen — "Roberto Faria" war der
 * Brasilianer Roberto Farias aus dem Fernsehen, "Santiago Ramos" ein Schauspieler
 * von einem Filmfestival 2011. Beide kamen aus einer reinen Namenssuche.
 *
 * Verlaesslicher Test ist der JAHRGANG: Wikidata P569 gegen das Geburtsjahr in
 * FEEDER_DRIVERS. Weicht es ab, ist es ein anderer Mensch. Zusaetzlich P106 (Beruf)
 * — wer kein Rennfahrer ist, ist es erst recht nicht.
 *
 * Schreibt NICHTS ins Spiel, sondern nur den Bericht.
 * Aufruf: node tools/verify-feeder-identity.js [--delay=1500]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const DELAY = Number((args.find(a => a.startsWith('--delay=')) || '').split('=')[1]) || 1500;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function api(url) {
    return new Promise(res => {
        https.get(url, { headers: { 'User-Agent': 'F1RPG-identity-check/1.0 (https://github.com/mparlatinho92-afk/f1-rpg)' } }, s => {
            const c = []; s.on('data', d => c.push(d));
            s.on('end', () => { try { res(JSON.parse(Buffer.concat(c).toString())); } catch (e) { res(null); } });
        }).on('error', () => res(null));
    });
}
async function apiGeduldig(url) {
    let r = await api(url);
    for (let a = 1; a <= 4 && !r; a++) { await sleep(8000 * a); r = await api(url); }
    return r;
}

// Berufe, die als Rennfahrer durchgehen (Wikidata-QIDs)
const FAHRER = new Set(['Q378622', 'Q10841764', 'Q11774891', 'Q15117302', 'Q3665646']);

(async () => {
    const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets-backup', 'manifest.json'), 'utf8'));
    const h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const i = h.indexOf('const FEEDER_DRIVERS'), e = h.indexOf('\n        ];', i);
    const jahrgang = new Map([...h.slice(i, e).matchAll(/\["([^"]+)","[^"]*",(\d+),/g)].map(m => [m[1], +m[2]]));
    const oi = h.indexOf('const FEEDER_PHOTO_OVERRIDES'), oe = h.indexOf('\n        };', oi);
    const slug = n => 'feeder-' + n.normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const drin = new Set([...h.slice(oi, oe).matchAll(/'([^']+)'\s*:\s*'https?:/g)].map(m => m[1]));

    const liste = man.feederPhotos.filter(r => r.wikidata_qid && drin.has(slug(r.name)));
    console.log(`Pruefe ${liste.length} Fotos, die im Spiel verwendet werden\n`);

    const ok = [], falsch = [], unklar = [];
    for (const r of liste) {
        await sleep(DELAY);
        const d = await apiGeduldig(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels&languages=en&ids=${r.wikidata_qid}`);
        const ent = d && d.entities && d.entities[r.wikidata_qid];
        if (!ent || !ent.claims) { unklar.push({ ...r, grund: 'Wikidata nicht lesbar' }); console.log(`  ?  ${r.name.padEnd(24)} nicht lesbar`); continue; }

        let jahr = null;
        const p569 = ent.claims.P569 && ent.claims.P569[0] && ent.claims.P569[0].mainsnak.datavalue;
        if (p569) jahr = parseInt(String(p569.value.time).replace(/^[+-]/, '').slice(0, 4), 10);
        const berufe = (ent.claims.P106 || []).map(c => c.mainsnak.datavalue && c.mainsnak.datavalue.value.id).filter(Boolean);
        const istFahrer = berufe.some(b => FAHRER.has(b));
        const soll = jahrgang.get(r.name);
        const label = (ent.labels && ent.labels.en && ent.labels.en.value) || '';

        const zeile = { name: r.name, soll, jahr, label, istFahrer, qid: r.wikidata_qid, file: r.file };
        if (jahr && soll && jahr !== soll) { falsch.push({ ...zeile, grund: `Jahrgang ${jahr} statt ${soll}` }); console.log(`  ✗  ${r.name.padEnd(24)} Jahrgang ${jahr} statt ${soll}   (${label})`); }
        else if (!jahr) { unklar.push({ ...zeile, grund: 'kein Geburtsdatum' }); console.log(`  ?  ${r.name.padEnd(24)} kein Geburtsdatum   (${label})`); }
        else if (!istFahrer && berufe.length) { unklar.push({ ...zeile, grund: 'kein Rennfahrer laut Beruf' }); console.log(`  ?  ${r.name.padEnd(24)} Beruf passt nicht   (${label})`); }
        else ok.push(zeile);
    }

    fs.writeFileSync(path.join(ROOT, 'assets-backup', 'identity-check.json'),
        JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), ok, falsch, unklar }, null, 2));
    console.log(`\nbestaetigt: ${ok.length}   FALSCHE PERSON: ${falsch.length}   unklar: ${unklar.length}`);
    if (falsch.length) console.log('\nzu entfernen: ' + falsch.map(f => f.name).join(', '));
})();
