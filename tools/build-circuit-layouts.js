/**
 * Baut data/circuit-layouts.js aus github.com/julesr0y/f1-circuits-svg (CC-BY-4.0).
 *
 * Es wird NUR die Pfad-Geometrie uebernommen (ein <path> pro Layout, viewBox 0 0 500 500).
 * Farbe/Strichstaerke kommen zur Laufzeit aus dem Theme (stroke: currentColor) – deshalb
 * reicht eine einzige Stilvariante des Repos als Quelle.
 *
 * Aufruf:
 *   node tools/build-circuit-layouts.js                  → alle 78 Strecken
 *   node tools/build-circuit-layouts.js pescara porto    → nur diese (Probe-Modus)
 */
const fs = require('fs');
const path = require('path');

const REPO = 'https://raw.githubusercontent.com/julesr0y/f1-circuits-svg/main';
const OUT = path.join(__dirname, '..', 'data', 'circuit-layouts.js');
const only = process.argv.slice(2);

(async () => {
    const circuits = await (await fetch(REPO + '/circuits.json')).json();
    const wanted = only.length ? circuits.filter(c => only.includes(c.id)) : circuits;
    if (only.length && wanted.length !== only.length) {
        const miss = only.filter(id => !wanted.some(c => c.id === id));
        throw new Error('Unbekannte Strecken-ID(s): ' + miss.join(', '));
    }

    const out = {};
    for (const c of wanted) {
        const layouts = [];
        for (const l of c.layouts) {
            const svg = await (await fetch(`${REPO}/circuits/minimal/black/${l.layoutId}.svg`)).text();
            const d = (svg.match(/\sd="([^"]+)"/) || [])[1];
            if (!d) { console.warn('  kein Pfad in ' + l.layoutId); continue; }
            layouts.push({ id: l.layoutId, y: l.seasons, d });
        }
        out[c.id] = { n: c.name, l: layouts };
        console.log(c.id.padEnd(20), layouts.length + ' Layout(s)');
    }

    const body = Object.entries(out).map(([cid, v]) =>
        `  ${/^[a-z][a-z0-9]*$/.test(cid) ? cid : JSON.stringify(cid)}: { n: ${JSON.stringify(v.n)}, l: [\n` +
        v.l.map(l => `    { id: ${JSON.stringify(l.id)}, y: ${JSON.stringify(l.y)}, d: ${JSON.stringify(l.d)} }`).join(',\n') +
        `\n  ] }`
    ).join(',\n');

    fs.writeFileSync(OUT,
`// ============================================================
// STRECKEN-LAYOUTS (SVG-Pfade, viewBox 0 0 500 500)
// GENERIERT von tools/build-circuit-layouts.js - NICHT von Hand editieren.
// Quelle: https://github.com/julesr0y/f1-circuits-svg (CC-BY-4.0, ROY Jules)
// Schluessel = f1db-Streckenslug (= canonicalCircuitId), y = Saisons des Layouts.
// ============================================================
const CIRCUIT_LAYOUTS = {
${body}
};
`, 'utf8');

    const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
    console.log(`\n→ ${OUT} (${Object.keys(out).length} Strecken, ${kb} KB)`);
})();
