#!/usr/bin/env node
/**
 * resolve-feeder-identity.js — ermittelt Jahrgang und Staatsangehoerigkeit der neuen
 * Feeder-Fahrer ueber Wikidata.
 *
 * Warum Wikidata und nicht der Artikeltext: dort stehen Geburtsdatum (P569) und
 * Staatsbuergerschaft (P27) als strukturierte Angaben, inklusive ISO-Laendercode (P297).
 * Das Parsen von Infoboxen hatte zwei Nationen falsch geliefert (Smolyar erschien als
 * Neutralflagge "WHI", Chovanec als Portugiese).
 *
 * QIDs kommen wenn moeglich aus fahrerfotos_ergebnis.json, sonst per Suche.
 *
 * Aufruf: node tools/resolve-feeder-identity.js
 * Ergebnis: assets-backup/feeder-roster-new.json wird um wdBirth/wdIso/wdCountry ergaenzt
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

function get(url) {
    return new Promise(res => {
        https.get(url, { headers: { 'User-Agent': 'F1RPG-identity/1.0 (personal hobby project)' } }, s => {
            const c = []; s.on('data', d => c.push(d));
            s.on('end', () => { try { res(JSON.parse(Buffer.concat(c).toString())); } catch (e) { res(null); } });
        }).on('error', () => res(null));
    });
}

const isoCache = new Map();
async function isoOf(countryQid) {
    if (isoCache.has(countryQid)) return isoCache.get(countryQid);
    await sleep(300);
    const d = await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels&languages=de&ids=${countryQid}`);
    const ent = d && d.entities && d.entities[countryQid];
    let iso = null, label = null;
    if (ent) {
        label = ent.labels && ent.labels.de && ent.labels.de.value;
        const p297 = ent.claims && ent.claims.P297;
        if (p297 && p297[0]) iso = p297[0].mainsnak.datavalue.value;
    }
    const r = { iso, label };
    isoCache.set(countryQid, r);
    return r;
}

(async () => {
    const file = path.join(ROOT, 'assets-backup', 'feeder-roster-new.json');
    const list = JSON.parse(fs.readFileSync(file, 'utf8'));

    // QIDs aus dem Foto-Lauf uebernehmen, wo vorhanden
    const photoFile = path.join(ROOT, 'fahrerfotos_ergebnis.json');
    const qidByName = new Map();
    if (fs.existsSync(photoFile)) {
        for (const r of JSON.parse(fs.readFileSync(photoFile, 'utf8'))) {
            if (r.wikidata_qid) qidByName.set(norm(r.name), r.wikidata_qid);
        }
    }

    for (const o of list) {
        let qid = qidByName.get(norm(o.name)) || null;
        if (!qid) {
            await sleep(400);
            const s = await get('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=3&search=' + encodeURIComponent(o.name));
            if (s && s.search && s.search.length) qid = s.search[0].id;
        }
        if (!qid) { console.log(o.name.padEnd(24) + 'kein Wikidata-Eintrag'); continue; }

        await sleep(400);
        const d = await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${qid}`);
        const cl = d && d.entities && d.entities[qid] && d.entities[qid].claims;
        if (!cl) { console.log(o.name.padEnd(24) + 'keine Claims'); continue; }

        if (cl.P569 && cl.P569[0] && cl.P569[0].mainsnak.datavalue) {
            const t = cl.P569[0].mainsnak.datavalue.value.time;   // z.B. "+2004-03-11T00:00:00Z"
            const y = parseInt(String(t).replace(/^[+-]/, '').slice(0, 4), 10);
            if (y > 1900 && y < 2020) o.wdBirth = y;
        }
        if (cl.P27 && cl.P27.length) {
            // letzte Staatsbuergerschaft nehmen (bei Wechseln die aktuelle)
            const cq = cl.P27[cl.P27.length - 1].mainsnak.datavalue.value.id;
            const { iso, label } = await isoOf(cq);
            o.wdIso = iso; o.wdCountry = label;
        }
        o.qid = qid;
        const abw = (o.wdBirth && o.birth && o.wdBirth !== o.birth) ? '  ABWEICHUNG zu ' + o.birth : '';
        console.log(o.name.padEnd(24) + String(o.wdBirth || '?').padEnd(6) + String(o.wdIso || '?').padEnd(4) + (o.wdCountry || '') + abw);
    }

    fs.writeFileSync(file, JSON.stringify(list, null, 2));
    console.log(`\nJahrgang aus Wikidata: ${list.filter(o => o.wdBirth).length}/${list.length}`);
    console.log(`Nation aus Wikidata  : ${list.filter(o => o.wdIso).length}/${list.length}`);
})();
