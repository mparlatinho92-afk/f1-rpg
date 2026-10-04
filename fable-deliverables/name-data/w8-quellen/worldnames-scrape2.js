// worldnames.xyz: Rang / Name / Trägerzahl je Seite extrahieren (Welle 8, 2026-10-04).
// Gegenüber ro-quellen/worldnames-scrape.js: Namen stehen teils zweischriftig ("Latein / Kyrillisch"),
// die Zahl folgt nicht direkt. Es zählt das erste Token nach dem Rang (lateinische Form), die Zahl ist das
// erste Zahl-Token danach (max. 8 Tokens). Ausgabe: rang<TAB>name<TAB>traeger<TAB>zweitform. Gibt nur Zahlen aus.
// Aufruf: node worldnames-scrape2.js <basis-url> <max-seiten> <out.tsv>
const { execSync } = require('child_process'); const fs = require('fs');
const [, , base, maxPages, out] = process.argv; const rows = []; const seen = new Set();
const num = s => { const m = s.replace(/,/g, '').match(/^([\d.]+)\s*([kKM]?)$/); if (!m) return null; return Math.round(parseFloat(m[1]) * (/k/i.test(m[2]) ? 1e3 : m[2] === 'M' ? 1e6 : 1)); };
for (let p = 1; p <= +maxPages; p++) {
    const url = p === 1 ? base : base + 'page/' + p + '/';
    let h; try { h = execSync(`curl -s -m 30 -A "Mozilla/5.0" "${url}"`, { maxBuffer: 1e8 }).toString(); } catch (e) { break; }
    h = h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
    const t = h.replace(/<[^>]+>/g, '\n').split('\n').map(x => x.trim()).filter(Boolean);
    let n = 0;
    for (let i = 0; i + 1 < t.length; i++) {
        const r = t[i].match(/^(\d+)\.$/); if (!r) continue;
        const name = t[i + 1]; let alt = '', c = null;
        for (let j = i + 2; j < Math.min(t.length, i + 10); j++) {
            if (t[j] === '/') { if (!alt && t[j + 1]) alt = t[j + 1]; continue; }
            const v = num(t[j]); if (v != null) { c = v; break; }
        }
        if (c == null || seen.has(name)) continue;
        seen.add(name); rows.push([+r[1], name, c, alt]); n++;
    }
    process.stderr.write(`p${p}:${n} `); if (!n) break;
    execSync('sleep 1');
}
fs.writeFileSync(out, rows.map(r => r.join('\t')).join('\n'));
console.error('\n' + rows.length + ' Zeilen → ' + out);
