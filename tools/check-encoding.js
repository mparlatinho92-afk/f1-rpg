// check-encoding.js — Riegel gegen kaputte Zeichen VOR der Auslieferung
//
// Prueft zwei Dinge, beide teuer gelernt:
//
// 1. LATIN-1-FEHLDEKODIERUNG. In data/seasons.js standen "Pedro Rodriguez" und
//    "Francois Mazet" als UTF-8-Bytes, die einmal als Latin-1 gelesen worden waren.
//    Der Fehler ist still - das Spiel laeuft, nur der Name ist falsch - und wanderte
//    ueber die Templates in jeden Spielstand. Ueber den Namen laeuft die
//    histId-Aufloesung, deshalb bricht ein falscher Name mehr als nur die Anzeige.
//    Erkennung: C3/C2 gefolgt von einem Fortsetzungsbyte (80-BF). Diese Kombination
//    kommt in echtem deutschem, franzoesischem oder italienischem Text nicht vor.
//
// 2. STEUERZEICHEN IM QUELLTEXT. In v0.9.15.85 landete ein NUL-Byte mitten in einem
//    Regex-Literal (`/[^<NUL>-ÿ]/`). Ein ungueltiges Regex-Literal ist ein Fehler beim
//    ANLEGEN des Skripts: es lief keine einzige Zeile, nicht einmal Funktions-
//    deklarationen, und die Oberflaeche blieb komplett leer. `node --check` bemerkte es
//    nicht und die Test-Umgebung auch nicht, weil beide den Block anders einhaengen.
//    ZWEI ausgelieferte Versionen waren dadurch unbenutzbar.
//
// ⚠ ALLE Zeichenklassen hier mit \uXXXX-Escapes schreiben, nie mit rohen Zeichen.
//   Die erste Fassung dieses Skripts hatte selbst rohe Steuerzeichen im Ausdruck.
//
// Aufruf:  node tools/check-encoding.js          → Exit 1 bei Fund
//          node tools/check-encoding.js --list   → jeden Treffer mit Kontext
// Wird von manage-v.ps1 als Schritt 0 aufgerufen; ein Fund bricht die Auslieferung ab.
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

const MOJIBAKE = /[\u00C3\u00C2][\u0080-\u00BF]/g;
// Alles ausser Tab (09), LF (0A) und CR (0D).
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
const LIST = process.argv.includes('--list');

const zeileVon = (txt, i) => txt.slice(0, i).split('\n').length;
const kontext = (txt, i) => JSON.stringify(txt.slice(Math.max(0, i - 45), i + 25));

let mojiGesamt = 0;
const betroffen = [];

for (const rel of TARGETS) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, 'utf8');

    // Steuerzeichen brechen sofort ab — das ist der schwerere Fehler.
    const ctrl = txt.match(CTRL);
    if (ctrl) {
        const i = txt.search(CTRL);
        console.error(`\nSTEUERZEICHEN IM QUELLTEXT — ${rel}:${zeileVon(txt, i)} (${ctrl.length}x)`);
        console.error(`  Kontext: ${kontext(txt, i)}`);
        console.error(`\n  Ein NUL- oder Steuerzeichen in einem Regex- oder String-Literal bricht das`);
        console.error(`  GANZE Skript beim Anlegen ab — die Oberflaeche bleibt leer, ohne Fehlermeldung`);
        console.error(`  in der Konsole. Zeichenklassen nie mit rohen Zeichen schreiben, immer`);
        console.error(`  \\u0000-Escapes benutzen.`);
        process.exit(1);
    }

    const treffer = txt.match(MOJIBAKE);
    if (!treffer) continue;
    mojiGesamt += treffer.length;
    betroffen.push({ rel, n: treffer.length });
    if (LIST) {
        const rx = new RegExp(MOJIBAKE.source, 'g');
        let m, i = 0;
        while ((m = rx.exec(txt)) && i++ < 20) {
            console.log(`  ${rel}:${zeileVon(txt, m.index)}  ${kontext(txt, m.index)}`);
        }
    }
}

if (!mojiGesamt) {
    console.log('Zeichenkodierung: in Ordnung (keine Fehldekodierung, keine Steuerzeichen).');
    process.exit(0);
}

console.error(`\nZEICHENKODIERUNG KAPUTT — ${mojiGesamt} Treffer in ${betroffen.length} Datei(en):`);
betroffen.forEach(b => console.error(`  ${b.rel}: ${b.n}`));
console.error(`\nDas sind UTF-8-Bytes, die als Latin-1 gelesen wurden ("Rodr" + C3 AD + "guez"`);
console.error(`statt "Rodríguez"). Reparieren, NICHT durchwinken: der falsche Name wandert sonst`);
console.error(`in jeden neuen Spielstand und bricht dort die histId-Aufloesung.`);
console.error(`Fundstellen zeigen:  node tools/check-encoding.js --list`);
console.error(`\n⚠ Steht die Folge absichtlich in einem Kommentar, dort umschreiben statt den`);
console.error(`  Waechter zu lockern — genau so ist der Fehler beim ersten Mal durchgerutscht.`);
process.exit(1);
