// restore-version.js — alte Spielversion aus der Git-Historie zurueckholen
//
// WOZU: archive/ ist gitignored und wurde mit 496 Monolithen 2,7 GB gross. Die
// Dateien liegen aber alle in der Git-Historie — sie muessen nicht lokal doppelt
// vorgehalten werden. Dieses Skript macht das Zurueckholen zum Einzeiler, damit
// das Aufraeumen des Archivs gefahrlos ist.
//
// ⚠ ZWEI FALLEN, die den naiven Aufruf falsch machen:
//
// 1. `git log -- <datei>` liefert den LETZTEN Commit, der die Datei beruehrt hat —
//    und das ist der, in dem sie ins Archiv verschoben, also GELOESCHT wurde. Dort
//    existiert sie nicht mehr ("path does not exist"). Gesucht ist der neueste
//    Commit, in dem sie noch VORHANDEN ist.
// 2. Der aelteste Commit ist auch falsch: das ist der Zustand beim Anlegen. Manche
//    Dateien wurden danach noch veraendert.
//
// Aufruf:  node tools/restore-version.js 0.9.15.60      -> wiederhergestellt/
//          node tools/restore-version.js 0.9.15.60 --hier -> ins Wurzelverzeichnis
//          node tools/restore-version.js --liste          -> alle verfuegbaren Versionen
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// stdio: git schreibt beim Existenz-Test ("cat-file -e") ein "fatal: path does not
// exist" nach stderr — das ist hier ein ERWARTETES Ergebnis, kein Fehler, und darf
// die Ausgabe nicht zumuellen.
const sh = c => execSync(c, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64,
    stdio: ['ignore', 'pipe', 'ignore'] });
const args = process.argv.slice(2);

if (!args.length || args.includes('--hilfe')) {
    console.log('node tools/restore-version.js <version>   z.B. 0.9.15.60');
    console.log('node tools/restore-version.js --liste     alle in Git verfuegbaren Versionen');
    process.exit(0);
}

// Alle je committeten Monolithen einsammeln (auch als Umbenennung erfasste)
function alleVersionen() {
    const raw = sh(`git log --all --name-only --pretty=format: -- "f1-rpg-v*.html"`);
    // Nur echte Versionsnamen: frueher lagen auch Dateien wie
    // "f1-rpg-v0_8_7_1 - backup.html" im Repo, die keine Version bezeichnen.
    const set = new Set(raw.split('\n').map(s => s.trim())
        .filter(s => /^f1-rpg-v\d+(\.\d+)*\.html$/.test(s)));
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

if (args.includes('--liste')) {
    const v = alleVersionen();
    console.log(`${v.length} Versionen in der Git-Historie:\n`);
    console.log(v.map(f => '  ' + f.replace(/^f1-rpg-v|\.html$/g, '')).join('\n'));
    process.exit(0);
}

const version = args[0].replace(/^v/, '');
const datei = `f1-rpg-v${version}.html`;

// Neuester Commit, in dem die Datei noch EXISTIERT (s. Falle 1 oben)
let commit = null;
for (const c of sh(`git log --all --format=%h -- "${datei}"`).split('\n').map(s => s.trim()).filter(Boolean)) {
    try { sh(`git cat-file -e ${c}:"${datei}"`); commit = c; break; } catch (e) { /* dort geloescht */ }
}
if (!commit) {
    console.error(`${datei} ist NICHT in der Git-Historie.`);
    console.error(`Verfuegbare Versionen:  node tools/restore-version.js --liste`);
    process.exit(1);
}

const zielOrdner = args.includes('--hier') ? ROOT : path.join(ROOT, 'wiederhergestellt');
fs.mkdirSync(zielOrdner, { recursive: true });
const ziel = path.join(zielOrdner, datei);
fs.writeFileSync(ziel, sh(`git show ${commit}:"${datei}"`), 'utf8');

const inhalt = fs.readFileSync(ziel, 'utf8');
const titel = (inhalt.match(/<title>([^<]*)<\/title>/) || [])[1] || '?';
const konst = (inhalt.match(/const VERSION = '([^']*)'/) || [])[1] || '?';
console.log(`${datei} aus Commit ${commit} wiederhergestellt`);
console.log(`  Ablage:  ${path.relative(ROOT, ziel)}`);
console.log(`  Groesse: ${(fs.statSync(ziel).size / 1048576).toFixed(1)} MB`);
console.log(`  Titel:   ${titel}   VERSION-Konstante: ${konst}`);
if (konst !== version) {
    console.log(`  ⚠ Die Datei traegt intern die Version ${konst}, nicht ${version}.`);
    console.log(`    Kommt bei aelteren Staenden vor — der Dateiname wurde damals vergeben,`);
    console.log(`    bevor manage-v die Konstante patchte. Der Git-Stand ist der echte.`);
}
console.log(`\nOeffnen:  npx serve . --listen 3333   dann http://localhost:3333/${path.relative(ROOT, ziel).replace(/\\/g, '/')}`);
