/* Zieht die Livery-Tabellen aus ../index.html nach zielflagge/colors.js.
 *   node zielflagge/build-colors.js
 *
 * NICHT von Hand editieren - colors.js ist erzeugt. Quelle der Wahrheit bleibt
 * index.html, damit gepflegte Liveries (add-livery) hier nicht auseinanderlaufen.
 * Nach jeder Livery-Aenderung im Hauptprojekt neu laufen lassen.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'index.html');
const OUT = path.join(__dirname, 'colors.js');

function schneideBlock(s, name) {
  const i = s.indexOf('const ' + name);
  if (i < 0) throw new Error(name + ' nicht in index.html gefunden');
  let start = s.indexOf('=', i) + 1;
  while (' \n\r\t'.includes(s[start])) start++;
  const auf = s[start];
  const zu = { '{': '}', '[': ']' }[auf];
  if (!zu) throw new Error(name + ': unerwarteter Blockanfang ' + auf);
  let tiefe = 0, k = start;
  for (; k < s.length; k++) {
    if (s[k] === auf) tiefe++;
    else if (s[k] === zu && --tiefe === 0) break;
  }
  return s.slice(start, k + 1);
}

const src = fs.readFileSync(SRC, 'utf8');
const extra = schneideBlock(src, 'TEAM_COLORS_EXTRA');
const ranges = schneideBlock(src, 'TEAM_COLORS_RANGES');

// Gegenprobe: der Block muss als JS auswertbar sein und plausibel gefuellt
const pExtra = new Function('return ' + extra)();
const pRanges = new Function('return ' + ranges)();
if (!pRanges.length) throw new Error('TEAM_COLORS_RANGES ist leer');
if (!Object.keys(pExtra).length) throw new Error('TEAM_COLORS_EXTRA ist leer');

const kopf = `/* ERZEUGT von build-colors.js aus ../index.html - nicht von Hand editieren.
   Stand: ${new Date().toISOString().slice(0, 10)}
   ${pRanges.length} Jahresbereiche, ${Object.keys(pExtra).length} jahresexakte Eintraege. */
`;
fs.writeFileSync(OUT, kopf +
  'const TEAM_COLORS_EXTRA = ' + extra + ';\n\n' +
  'const TEAM_COLORS_RANGES = ' + ranges + ';\n', 'utf8');

console.log('geschrieben: ' + path.relative(process.cwd(), OUT));
console.log('  TEAM_COLORS_RANGES: ' + pRanges.length + ' Bereiche');
console.log('  TEAM_COLORS_EXTRA : ' + Object.keys(pExtra).length + ' Jahre (' +
  Object.keys(pExtra).sort().join(', ') + ')');
