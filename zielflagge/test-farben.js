/* Vergleicht die Livery-Aufloesung von ZIELFLAGGE mit getTeamColors() des RPG.
 *   node zielflagge/test-farben.js [jahr|alle]
 *
 * ZIELFLAGGE nutzt eine VEREINFACHTE Fassung: die aufwendige ID-Normalisierung
 * des Originals entfaellt, weil unsere teamId direkt aus dem Spielstand bzw. aus
 * SEASON_DATA t[0] kommt und damit schon der gesuchte Key IST. Dieser Test
 * belegt, dass die Vereinfachung dasselbe Ergebnis liefert - sonst waere sie
 * eine stille Abweichung vom Hauptprojekt.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const JAHR = process.argv[2] || 'alle';

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SEASON_DATA = new Function(
  fs.readFileSync(path.join(ROOT, 'data', 'seasons.js'), 'utf8') + '; return SEASON_DATA;')();

function schneide(name) {
  const i = src.indexOf('const ' + name);
  let start = src.indexOf('=', i) + 1;
  while (' \n\r\t'.includes(src[start])) start++;
  const auf = src[start], zu = { '{': '}', '[': ']' }[auf];
  let tiefe = 0, k = start;
  for (; k < src.length; k++) {
    if (src[k] === auf) tiefe++;
    else if (src[k] === zu && --tiefe === 0) break;
  }
  return src.slice(start, k + 1);
}
const TEAM_COLORS_EXTRA = new Function('return ' + schneide('TEAM_COLORS_EXTRA'))();
const TEAM_COLORS_RANGES = new Function('return ' + schneide('TEAM_COLORS_RANGES'))();

/* --- ORIGINAL: getTeamColors aus index.html, woertlich uebernommen --- */
const i0 = src.indexOf('function getTeamColors(teamId, year, baseColor)');
let t0 = 0, k0 = src.indexOf('{', i0);
let ende = k0;
for (; ende < src.length; ende++) {
  if (src[ende] === '{') t0++;
  else if (src[ende] === '}' && --t0 === 0) break;
}
const originalQuelle = src.slice(i0, ende + 1);
const unpackEnteredTeamId = id => String(id || '').split('__')[0];
const getTeamColorsOriginal = new Function(
  'SEASON_DATA', 'TEAM_COLORS_EXTRA', 'TEAM_COLORS_RANGES', 'unpackEnteredTeamId',
  originalQuelle + '; return getTeamColors;'
)(SEASON_DATA, TEAM_COLORS_EXTRA, TEAM_COLORS_RANGES, unpackEnteredTeamId);

/* --- ZIELFLAGGE: die vereinfachte Fassung, aus zielflagge/index.html gezogen --- */
const zf = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const iz = zf.indexOf('function teamColorsFor(');
let tz = 0, kz = zf.indexOf('{', iz), endz = kz;
for (; endz < zf.length; endz++) {
  if (zf[endz] === '{') tz++;
  else if (zf[endz] === '}' && --tz === 0) break;
}
const teamColorsFor = new Function('TEAM_COLORS_EXTRA', 'TEAM_COLORS_RANGES',
  zf.slice(iz, endz + 1) + '; return teamColorsFor;')(TEAM_COLORS_EXTRA, TEAM_COLORS_RANGES);

/* --- Vergleich --- */
const jahre = JAHR === 'alle' ? Object.keys(SEASON_DATA).sort() : [JAHR];
let geprueft = 0, abweichend = 0, mitLivery = 0, grau = 0;
const abweichungen = [], grauListe = [];

for (const j of jahre) {
  const sd = SEASON_DATA[j];
  if (!sd) { console.log('Jahr ' + j + ' gibt es nicht'); process.exit(1); }
  for (const t of sd.t) {
    const id = t[0], name = t[1], base = t[2];
    const a = getTeamColorsOriginal(id, +j, base);
    const b = teamColorsFor(id, +j, base);
    geprueft++;
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      abweichend++;
      if (abweichungen.length < 12) abweichungen.push(j + ' ' + name + ' (' + id + '): RPG ' + JSON.stringify(a) + ' vs ZF ' + JSON.stringify(b));
    }
    if (b[0] && b[0].toLowerCase() !== '#888888') mitLivery++;
    else { grau++; if (JAHR !== 'alle' && grauListe.length < 20) grauListe.push(name + ' (' + id + ')'); }
  }
}

console.log('=== Livery-Aufloesung ZIELFLAGGE gegen getTeamColors() des RPG ===\n');
console.log('Jahrgaenge geprueft : ' + jahre.length + (JAHR === 'alle' ? ' (alle)' : ''));
console.log('Team-Jahr-Paare     : ' + geprueft);
console.log('Abweichungen        : ' + abweichend);
if (abweichungen.length) { console.log('\nBeispiele:'); abweichungen.forEach(x => console.log('   ' + x)); }
console.log('\nMit echter Livery   : ' + mitLivery + '  (' + (mitLivery / geprueft * 100).toFixed(1) + ' %)');
console.log('Auf Platzhalter grau: ' + grau + '  (' + (grau / geprueft * 100).toFixed(1) + ' %)');
if (grauListe.length) { console.log('\nOhne Livery in ' + JAHR + ':'); grauListe.forEach(x => console.log('   ' + x)); }
console.log('\n' + (abweichend === 0 ? 'ALLES GRUEN - identisch zum RPG' : abweichend + ' ABWEICHUNG(EN)'));
process.exit(abweichend === 0 ? 0 : 1);
