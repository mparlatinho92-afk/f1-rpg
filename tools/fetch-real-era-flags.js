#!/usr/bin/env node
/**
 * fetch-real-era-flags.js — holt die historischen Flaggen als echte SVGs von
 * Wikimedia Commons (Nationalflaggen sind dort gemeinfrei).
 *
 * WICHTIG: URLs nur ueber die imageinfo-API aufloesen. Selbst gebaute /thumb/-Pfade
 * liefern HTTP 400 — siehe reference_logo_sources.
 *
 * Aufruf: node tools/fetch-real-era-flags.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets-backup', 'era-flags', 'real');

// Code -> Commons-Dateiname (ohne "File:")
const WANTED = {
    'URS':        'Flag of the Soviet Union (1955–1980).svg',
    'YUG':        'Flag of Yugoslavia (1946-1992).svg',
    'HUN_SOC':    'Flag of Hungary (1957-1989).svg',
    'ROU_SOC':    'Flag of Romania (1965-1989).svg',
    'BUL_SOC':    'Flag of Bulgaria (1971-1990).svg',
    'MAS_MALAYA': 'Flag of the Federation of Malaya.svg',
    'GRE_OLD':    'Flag of Greece (1822-1978).svg'
};

function get(url, redirects = 0) {
    return new Promise(res => {
        if (redirects > 4) return res({ error: 'zu viele Redirects' });
        https.get(url, { headers: { 'User-Agent': 'F1RPG-asset-backup/1.0 (personal project)' } }, s => {
            if ([301, 302, 307, 308].includes(s.statusCode) && s.headers.location) {
                s.resume(); return res(get(new URL(s.headers.location, url).toString(), redirects + 1));
            }
            if (s.statusCode !== 200) { s.resume(); return res({ code: s.statusCode }); }
            const c = []; s.on('data', d => c.push(d));
            s.on('end', () => res({ code: 200, buf: Buffer.concat(c) }));
        }).on('error', e => res({ error: e.message }));
    });
}

(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const results = [];
    for (const [code, file] of Object.entries(WANTED)) {
        const api = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size&titles='
            + encodeURIComponent('File:' + file);
        const meta = await get(api);
        if (!meta.buf) { results.push({ code, file, status: 'API ' + (meta.code || meta.error) }); continue; }
        let url = null;
        try {
            const pages = JSON.parse(meta.buf.toString()).query.pages;
            const p = Object.values(pages)[0];
            if (p && p.imageinfo && p.imageinfo[0]) url = p.imageinfo[0].url;
        } catch (e) { /* faellt unten auf 'nicht gefunden' */ }
        if (!url) { results.push({ code, file, status: 'nicht gefunden' }); continue; }

        const img = await get(url);
        if (!img.buf) { results.push({ code, file, status: 'Download ' + (img.code || img.error) }); continue; }
        fs.writeFileSync(path.join(OUT, code + '.svg'), img.buf);
        results.push({ code, file, status: 'ok', bytes: img.buf.length, url });
        await new Promise(r => setTimeout(r, 300));
    }

    console.log('Code         Groesse    Datei');
    results.forEach(r => console.log(
        r.code.padEnd(12) + (r.status === 'ok' ? ((r.bytes / 1024).toFixed(1) + ' KB').padStart(9) : r.status.padStart(9)) + '   ' + r.file));
    const ok = results.filter(r => r.status === 'ok');
    console.log(`\n${ok.length}/${results.length} geladen, zusammen ${(ok.reduce((a, r) => a + r.bytes, 0) / 1024).toFixed(1)} KB`);
    console.log('Als data-URI waeren das +33 % — Vergleich mit den handgezeichneten: 5,0 KB gesamt.');
    fs.writeFileSync(path.join(OUT, '_quellen.json'), JSON.stringify(results, null, 2));
})();
