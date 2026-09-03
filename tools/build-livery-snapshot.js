/**
 * build-livery-snapshot.js – erzeugt den Snapshot für das Livery-Werkzeug.
 *
 *   node tools/build-livery-snapshot.js
 *
 * Liest index.html + data/seasons.js + data/hist.js, führt die ECHTE
 * Farbkaskade des Spiels aus (nicht nachgebaut) und schreibt
 * tools/livery-snapshot.json. Den braucht die Übersicht im Werkstatt-Modus –
 * unterwegs, ohne laufenden Server. Im Live-Modus holt sie sich dieselben
 * Daten selbst und ignoriert den Snapshot bis auf den Veraltet-Vergleich.
 *
 * Die Unterwegs-Fassung (tools/livery-report.standalone.html) wird IMMER
 * mitgebaut – sie darf nie hinter der Werkstatt zurückbleiben.
 * --no-inline unterdrückt das nur für Sonderfälle.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Core = require('./livery-core.js');

const ROOT = path.resolve(__dirname, '..');
const p = f => path.join(ROOT, f);

function loadDataFile(rel, names) {
    const src = fs.readFileSync(p(rel), 'utf8') + '\n;' +
        names.map(n => `globalThis.__${n} = (typeof ${n} !== "undefined") ? ${n} : null;`).join('');
    // Die data/*.js deklarieren mit const – im vm-Kontext landen die NICHT auf
    // dem Kontextobjekt. Deshalb der explizite globalThis-Anhang oben.
    const sandbox = { window: {}, console: console, document: undefined };
    vm.runInNewContext(src, sandbox, { timeout: 120000, filename: rel });
    const out = {};
    for (const n of names) out[n] = sandbox['__' + n] || (sandbox.window && sandbox.window[n]) || null;
    return out;
}

function main() {
    const inline = !process.argv.includes('--no-inline');

    console.log('  lese data/seasons.js …');
    const { SEASON_DATA } = loadDataFile('data/seasons.js', ['SEASON_DATA']);
    if (!SEASON_DATA) throw new Error('SEASON_DATA nicht gefunden in data/seasons.js');

    console.log('  lese data/hist.js …');
    const { INDY_500_ONLY_CONSTRUCTORS } = loadDataFile('data/hist.js', ['INDY_500_ONLY_CONSTRUCTORS']);

    console.log('  schneide Farbkaskade aus index.html …');
    const html = fs.readFileSync(p('index.html'), 'utf8');
    const game = Core.extractGameColors(html)(SEASON_DATA);

    const built = Core.buildCells({
        SEASON_DATA: SEASON_DATA,
        game: game,
        indyConstructors: INDY_500_ONLY_CONSTRUCTORS || []
    });
    const findings = Core.gameFindings(built);

    // Kompakte Zellen: Jahr und Name stecken schon in Key bzw. teams.
    const cells = {};
    for (const key of Object.keys(built.cells)) {
        const c = built.cells[key];
        cells[key] = { c: c.colors, s: c.source };
        if (c.indy) cells[key].i = 1;
    }
    const teams = {};
    for (const id of Object.keys(built.teams)) {
        const t = built.teams[id];
        teams[id] = { name: t.name, years: t.years };
        if (t.indy) teams[id].indy = 1;
    }

    const reportPath = p('tools/livery-report.html');
    const reportHash = fs.existsSync(reportPath)
        ? Core.fnv1a(fs.readFileSync(reportPath, 'utf8')) : null;

    const snapshot = {
        meta: {
            schema: 'f1rpg-livery-snapshot/1',
            reportHash: reportHash,
            gameVersion: game.version,
            colorHash: game.hash,
            generated: new Date().toISOString().slice(0, 10),
            yearFrom: built.years[0],
            yearTo: built.years[built.years.length - 1],
            rangesCount: game.TEAM_COLORS_RANGES.length,
            extraYears: Object.keys(game.TEAM_COLORS_EXTRA).length
        },
        teams: teams,
        cells: cells,
        findings: findings
    };

    const outPath = p('tools/livery-snapshot.json');
    fs.writeFileSync(outPath, JSON.stringify(snapshot), 'utf8');

    // ------------------------------------------------------------- Bilanz
    const all = Object.values(built.cells);
    const nonIndy = all.filter(c => !c.indy);
    const count = s => nonIndy.filter(c => c.source === s).length;
    const banner = nonIndy.filter(c => c.colors.length > 1).length;

    console.log('\n  ' + path.relative(ROOT, outPath) +
        '  (' + (fs.statSync(outPath).size / 1024).toFixed(0) + ' KB)');
    console.log('  Spielversion ' + game.version + ', Farb-Hash ' + game.hash);
    console.log('\n  Team-Jahre gesamt : ' + all.length + '  (davon Indy: ' + (all.length - nonIndy.length) + ')');
    console.log('  ohne Indy         : ' + nonIndy.length);
    console.log('    EXTRA           : ' + count('extra'));
    console.log('    RANGES          : ' + count('range'));
    console.log('    SEASON_DATA     : ' + count('sd'));
    console.log('    ohne Farbe      : ' + count('none') + '  (' + findings.luecke.length + ' Teams)');
    console.log('  echtes Banner     : ' + banner + '  = ' + (banner / nonIndy.length * 100).toFixed(0) + ' %');
    console.log('  Einheitsfarbe     : ' + findings.einheitsfarbe.length + ' Teams, ' +
        findings.einheitsfarbe.reduce((n, f) => n + f.seasons, 0) + ' Team-Jahre');

    if (inline) {
        const tpl = p('tools/livery-report.html');
        if (!fs.existsSync(tpl)) {
            console.log('\n  --inline übersprungen: tools/livery-report.html fehlt noch.');
        } else {
            const src = fs.readFileSync(tpl, 'utf8');
            const core = fs.readFileSync(p('tools/livery-core.js'), 'utf8');
            const marker = '<!-- SNAPSHOT-INLINE -->';
            if (src.indexOf(marker) < 0) throw new Error('Marker ' + marker + ' fehlt in livery-report.html');
            const payload = '<script>window.LIVERY_SNAPSHOT = ' + JSON.stringify(snapshot) + ';</script>\n' +
                '<script>' + core + '</script>';
            const outHtml = src.replace(marker, payload)
                .replace(/<script src="livery-core\.js"><\/script>/, '');
            const dest = p('tools/livery-report.standalone.html');
            fs.writeFileSync(dest, outHtml, 'utf8');
            console.log('\n  ' + path.relative(ROOT, dest) +
                '  (' + (fs.statSync(dest).size / 1024).toFixed(0) + ' KB) – eine Datei, überall lauffähig');
        }
    }
}

try {
    main();
} catch (err) {
    console.error('\n  ABBRUCH: ' + err.message);
    process.exit(1);
}
