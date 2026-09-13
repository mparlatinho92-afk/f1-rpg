/* Erzeugt zielflagge/strecken-daten.js aus den Daten des Hauptprojekts.
 *   node zielflagge/build-strecken-daten.js
 *
 * ZIELFLAGGE laeuft eigenstaendig - es kennt weder data/circuit-layouts.js
 * noch data/f1db.js. Genau wie bei den Liveries (build-colors.js -> colors.js)
 * wird deshalb eine Kopie erzeugt, die nur das Noetige enthaelt:
 *   CIRCUIT_LAYOUTS  - 78 Strecken, 160 Ausbaustufen als SVG-Pfade
 *   CIRCUIT_LENGTHS  - Streckenlaengen in km (71 von 78 Strecken)
 *
 * ⚠ CIRCUIT_LENGTHS klammerbalanciert ausschneiden. Eine Regex mit
 *   nicht-gieriger Klammer bricht beim ersten "};" ab - dann fehlen Eintraege
 *   und Strecken wie monza sehen aus, als stuenden sie gar nicht drin.
 * ⚠ Nicht von Hand editieren, sondern dieses Skript erneut laufen lassen.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ZIEL = path.join(__dirname, 'strecken-daten.js');

function schneideObjekt(quelle, name) {
  const i = quelle.indexOf(name);
  if (i < 0) throw new Error(name + ' nicht gefunden');
  const a = quelle.indexOf('{', i);
  let tiefe = 0, b = a;
  for (; b < quelle.length; b++) {
    if (quelle[b] === '{') tiefe++;
    else if (quelle[b] === '}') { tiefe--; if (!tiefe) { b++; break; } }
  }
  return quelle.slice(a, b);
}

const layoutsSrc = fs.readFileSync(path.join(ROOT, 'data', 'circuit-layouts.js'), 'utf8');
const f1Src = fs.readFileSync(path.join(ROOT, 'data', 'f1db.js'), 'utf8');

const layouts = schneideObjekt(layoutsSrc, 'const CIRCUIT_LAYOUTS');
const laengen = schneideObjekt(f1Src, 'const CIRCUIT_LENGTHS');

// Gegenprobe: beides muss sich auswerten lassen, sonst liefern wir Schrott aus
const L = new Function('return ' + layouts + ';')();
const M = new Function('return ' + laengen + ';')();
const stufen = Object.keys(L).reduce((a, k) => a + L[k].l.length, 0);

const kopf = '/* ERZEUGT von zielflagge/build-strecken-daten.js - NICHT von Hand editieren.\n'
  + ' * Quellen: data/circuit-layouts.js (CC-BY-4.0, ROY Jules) und data/f1db.js\n'
  + ' * ' + Object.keys(L).length + ' Strecken, ' + stufen + ' Ausbaustufen, '
  + Object.keys(M).length + ' Laengenangaben.\n */\n';

fs.writeFileSync(ZIEL,
  kopf + 'const CIRCUIT_LAYOUTS = ' + layouts + ';\n'
  + 'const CIRCUIT_LENGTHS = ' + laengen + ';\n', 'utf8');

const kb = (fs.statSync(ZIEL).size / 1024).toFixed(0);
console.log('geschrieben: zielflagge/strecken-daten.js  (' + kb + ' KB)');
console.log('  ' + Object.keys(L).length + ' Strecken, ' + stufen + ' Ausbaustufen, '
  + Object.keys(M).length + ' Laengenangaben');
const ohne = Object.keys(L).filter(s => M[s] === undefined);
if (ohne.length) console.log('  ohne Laengenangabe (nicht fahrbar): ' + ohne.join(', '));
