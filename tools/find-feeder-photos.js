#!/usr/bin/env node
/**
 * find-feeder-photos.js — sucht Fotos fuer Feeder-Fahrer auf Wikimedia Commons.
 *
 * Ergaenzt f2_f3_fahrerfotos_check.py (Nutzer-Skript) fuer die Namen, die dort nie
 * in der Eingabeliste standen — vor allem die 2022er-Nachtraege. Gleiche Methode:
 * Wikidata-Eintrag suchen -> Bildeigenschaft P18 -> Commons-Metadaten fuer Lizenz
 * und Urheber. Ohne Lizenz+Urheber ist ein Bild fuer uns wertlos, weil CC BY-SA
 * Namensnennung verlangt.
 *
 * Schreibt NICHTS ins Spiel; Ergebnis landet in assets-backup/feeder-photos-found.json
 * im selben Feldformat wie fahrerfotos_ergebnis.json, damit beides zusammenpasst.
 *
 * Aufruf: node tools/find-feeder-photos.js [--datei=assets-backup/feeder-ohne-foto.txt]
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const LISTE = (args.find(a => a.startsWith('--datei=')) || '').split('=')[1]
    || path.join('assets-backup', 'feeder-ohne-foto.txt');

const sleep = ms => new Promise(r => setTimeout(r, ms));
function api(url) {
    return new Promise(res => {
        https.get(url, { headers: { 'User-Agent': 'F1RPG-photo-lookup/1.0 (personal hobby project)' } }, s => {
            const c = []; s.on('data', d => c.push(d));
            s.on('end', () => { try { res(JSON.parse(Buffer.concat(c).toString())); } catch (e) { res(null); } });
        }).on('error', () => res(null));
    });
}

// Commons-Dateiname -> URL + Lizenz + Urheber (extmetadata liefert beides)
async function commonsInfo(file) {
    const d = await api('https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo'
        + '&iiprop=url|extmetadata&iiextmetadatafilter=LicenseShortName|Artist&titles=' + encodeURIComponent('File:' + file));
    try {
        const p = Object.values(d.query.pages)[0];
        const ii = p.imageinfo && p.imageinfo[0];
        if (!ii) return null;
        const em = ii.extmetadata || {};
        return {
            url: ii.url,
            license: em.LicenseShortName ? em.LicenseShortName.value : null,
            author: em.Artist ? em.Artist.value : null
        };
    } catch (e) { return null; }
}

(async () => {
    const names = fs.readFileSync(path.join(ROOT, LISTE), 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const resultFile = path.join(ROOT, 'assets-backup', 'feeder-photos-found.json');
    // Wiederaufnahme: bereits gefundene nicht erneut abfragen
    const prev = fs.existsSync(resultFile) && !args.includes('--fresh')
        ? new Map(JSON.parse(fs.readFileSync(resultFile, 'utf8')).filter(o => o.found).map(o => [o.name, o]))
        : new Map();
    if (prev.size) console.log(`${prev.size} bereits gefunden, werden uebernommen`);
    console.log(`Suche Fotos fuer ${names.length - prev.size} Fahrer\n`);
    const out = [...prev.values()];

    for (const name of names) {
        if (prev.has(name)) continue;
        // Wikidata drosselt: leere Trefferliste heisst meist "zu schnell", nicht "gibt es nicht".
        // Deshalb mehrfach mit wachsender Pause versuchen, bevor ein Name als fehlend gilt.
        let qid = null;
        for (let a = 0; a < 4 && !qid; a++) {
            await sleep(a === 0 ? 2500 : 15000 * a);
            const s = await api('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=5&search=' + encodeURIComponent(name));
            if (s && s.search && s.search.length) {
                // Treffer bevorzugen, dessen Beschreibung nach Motorsport klingt
                const best = s.search.find(x => /driver|racing|motorsport|pilot/i.test(x.description || '')) || s.search[0];
                if (best) qid = best.id;
            }
        }
        if (!qid) { out.push({ name, found: false, reason: 'kein Wikidata-Eintrag' }); console.log(`  ${name.padEnd(24)} kein Wikidata-Eintrag`); continue; }

        await sleep(1800);
        const ent = await api(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${qid}`);
        const claims = ent && ent.entities && ent.entities[qid] && ent.entities[qid].claims;
        const p18 = claims && claims.P18 && claims.P18[0] && claims.P18[0].mainsnak.datavalue;
        if (!p18) { out.push({ name, found: false, wikidata_qid: qid, reason: 'kein Bild (P18)' }); console.log(`  ${name.padEnd(24)} kein Bild hinterlegt (${qid})`); continue; }

        await sleep(1200);
        const info = await commonsInfo(p18.value);
        if (!info) { out.push({ name, found: false, wikidata_qid: qid, reason: 'Commons-Info fehlt' }); console.log(`  ${name.padEnd(24)} Commons-Info fehlt`); continue; }

        out.push({ name, found: true, image_url: info.url, license: info.license, author: info.author, source: 'wikidata_P18', wikidata_qid: qid });
        console.log(`  ${name.padEnd(24)} ${String(info.license || '?').padEnd(16)} ${decodeURIComponent(info.url.split('/').pop()).slice(0, 45)}`);
    }

    fs.writeFileSync(path.join(ROOT, 'assets-backup', 'feeder-photos-found.json'), JSON.stringify(out, null, 2));
    const ok = out.filter(o => o.found).length;
    console.log(`\ngefunden: ${ok}/${out.length}`);
    const lic = {}; out.filter(o => o.found).forEach(o => lic[o.license || '?'] = (lic[o.license || '?'] || 0) + 1);
    console.log('Lizenzen: ' + Object.entries(lic).map(([k, v]) => k + ': ' + v).join(', '));
    console.log('Ergebnis: assets-backup/feeder-photos-found.json');
})();
