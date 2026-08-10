// check-encoding.js — Riegel gegen Zeichenkodierungs-Fehler VOR der Auslieferung
//
// WARUM: In data/seasons.js standen „Pedro Rodríguez" und „François Mazet" als
// UTF-8-Bytes, die einmal als Latin-1 gelesen worden waren. Der Fehler fiel erst
// Jahre später auf — in einem Spielstand, in den er längst hineingewandert war.
// Datenfehler dieser Art sind still: das Spiel läuft, nur der Name ist falsch,
// und über den Namen laufen histId-Auflösung und Rekord-Zuordnung.
//
// ERKENNUNG: Ein als Latin-1 gelesenes UTF-8-Zeichen wird zu C3/C2 gefolgt von
// einem Fortsetzungsbyte (80–BF). Diese Kombination kommt in echtem deutschem,
// französischem oder italienischem Text praktisch nicht vor — „Ä" steht nie
// direkt vor einem Steuerzeichen.
//
// Aufruf:  node tools/check-encoding.js          → Exit 1 bei Fund
//          node tools/check-encoding.js --list   → jeden Treffer mit Kontext
// Wird von manage-v.ps1 vor dem Build aufgerufen; ein Fund bricht die Auslieferung ab.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// Muss zu $DataFiles in manage-v.ps1 passen, plus die Entwicklungsdatei.
const TARGETS = [
    'index.html',
    'data/f1db.js', 'data/hist.js', 'data/seasons.js', 'data/names.js',
    'data/era-first-names.js', 'data/circuit-layouts.js', 'data/presence.js'
];

const BAD = /[ÃÂ][-¿]/g;
const LIST = process.argv.includes('--list');

let total = 0;
const betroffen = [];
for (const rel of TARGETS) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, 'utf8');
    const treffer = txt.match(BAD);
    if (!treffer) continue;
    total += treffer.length;
    betroffen.push({ rel, n: treffer.length });
    if (LIST) {
        const rx = new RegExp(BAD.source, 'g');
        let m, i = 0;
        while ((m = rx.exec(txt)) && i++ < 20) {
            const zeile = txt.slice(0, m.index).split('\n').length;
            const ctx = txt.slice(Math.max(0, m.index - 40), m.index + 20).replace(/\n/g, ' ');
            console.log(`  ${rel}:${zeile}  …${ctx}…`);
        }
    }
}

if (!total) {
    console.log('Zeichenkodierung: in Ordnung (keine Latin-1-Fehldekodierung gefunden).');
    process.exit(0);
}

console.error(`\nZEICHENKODIERUNG KAPUTT — ${total} Treffer in ${betroffen.length} Datei(en):`);
betroffen.forEach(b => console.error(`  ${b.rel}: ${b.n}`));
console.error(`\nDas sind UTF-8-Bytes, die als Latin-1 gelesen wurden ("Rodr" + C3 AD + "guez"`);
console.error(`statt "Rodríguez"). Reparieren, NICHT durchwinken: der falsche Name wandert sonst`);
console.error(`in jeden neuen Spielstand und bricht dort die histId-Auflösung.`);
console.error(`Fundstellen zeigen:  node tools/check-encoding.js --list`);
console.error(`\n⚠ Steht die Folge absichtlich in einem Kommentar, dort umschreiben statt`);
console.error(`  den Wächter zu lockern — genau so ist der Fehler beim ersten Mal durchgerutscht.`);
process.exit(1);
