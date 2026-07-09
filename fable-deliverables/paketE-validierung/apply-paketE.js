/**
 * apply-paketE.js — wendet die Paket-E-Korrekturen (Abschnitt A + B, B1 minimal) auf
 * data/seasons.js an. Matcht Fahrer per Name innerhalb des Jahres, verlangt Eindeutigkeit,
 * loggt jede Aktion. DRY-RUN per Default (--apply zum Schreiben).
 *
 * MOVE  {year, name, newTeam}  → ändert teamId (Feld idx 2) des Fahrer-Eintrags
 * REMOVE{year, name}           → entfernt den Fahrer-Eintrag (+ angrenzendes Komma)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', '..', 'data', 'seasons.js');
const APPLY = process.argv.includes('--apply');

const moves = [
  // A1 + A2/B1(minimal) + B2
  { year: '1954', name: 'Alberto Ascari',    newTeam: 'LAN' },
  { year: '1966', name: 'Richie Ginther',    newTeam: 'HON' },
  { year: '1975', name: 'John Watson',       newTeam: 'SUR' },
  { year: '1981', name: 'Eliseo Salazar',    newTeam: 'MAR' },
  { year: '1985', name: 'Piercarlo Ghinzani',newTeam: 'TOL' },
  { year: '1990', name: 'Roberto Moreno',    newTeam: 'EUR' },
  { year: '1956', name: 'Harry Schell',      newTeam: 'VAN' },  // B1 minimal
  { year: '1955', name: 'Harry Schell',      newTeam: 'VAN' },  // B2
];

const removes = [
  // A1-Begleitstreichungen
  { year: '1975', name: 'Dave Morgan' },
  { year: '1981', name: 'Ricardo Londoño' },
  // A2
  { year: '1956', name: 'Colin Chapman' },
  // A3 (25 Ein-Cockpit-Reduktionen)
  { year: '1952', name: 'Peter Whitehead' },
  { year: '1952', name: 'Robin Montgomerie-Charrington' },
  { year: '1959', name: 'Maria Teresa de Filippis' },
  { year: '1960', name: 'Fred Gamble' },
  { year: '1962', name: 'Wolfgang Seidel' },
  { year: '1970', name: 'Tim Schenken' },
  { year: '1970', name: 'Brian Redman' },
  { year: '1974', name: 'Mike Wilds' },
  { year: '1974', name: 'Ian Scheckter' },
  { year: '1975', name: 'Mike Wilds' },
  { year: '1975', name: 'Arturo Merzario' },
  { year: '1975', name: 'Hiroshi Fushida' },
  { year: '1976', name: 'Jacky Ickx' },
  { year: '1976', name: 'Hans Binder' },
  { year: '1977', name: 'Teddy Pilette' },
  { year: '1977', name: 'Conny Andersson' },
  { year: '1977', name: 'Guy Edwards' },
  { year: '1978', name: 'Eddie Cheever' },
  { year: '1979', name: 'Patrick Gaillard' },
  { year: '1979', name: 'Marc Surer' },
  { year: '1979', name: 'Alex Ribeiro' },
  { year: '1979', name: 'James Hunt' },
  { year: '1981', name: 'Jan Lammers' },
  { year: '1982', name: 'Tommy Byrne' },
  { year: '1982', name: 'Jan Lammers' },
  { year: '1984', name: 'Huub Rothengatter' },
  { year: '1985', name: 'Christian Danner' },
  { year: '1987', name: 'Roberto Moreno' },
  { year: '1989', name: 'Oscar Larrauri' },
  { year: '1990', name: 'Gary Brabham' },
  { year: '1991', name: 'Naoki Hattori' },
  // B3
  { year: '1965', name: 'Jackie Pretorius' },
];

let src = fs.readFileSync(FILE, 'utf8');
const lines = src.split('\n');
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function findYearLineIdx(year) {
  return lines.findIndex(l => l.startsWith(`'${year}':{`) || l.includes(`'${year}':{`));
}
// Matcht einen Fahrer-Eintrag ['id','Name','TEAM',...] per Name (Feld idx 1)
function entryRegex(name) {
  return new RegExp(`\\['[^']*','${reEsc(name)}','([A-Za-z0-9]+)'[^\\]]*\\]`, 'g');
}

let ok = 0, warn = 0;
function applyOp(op, kind) {
  const idx = findYearLineIdx(op.year);
  if (idx < 0) { console.log(`  ⚠ ${kind} ${op.year} ${op.name}: JAHR NICHT GEFUNDEN`); warn++; return; }
  let line = lines[idx];
  const matches = [...line.matchAll(entryRegex(op.name))];
  if (matches.length === 0) { console.log(`  ⚠ ${kind} ${op.year} "${op.name}": KEIN TREFFER`); warn++; return; }
  if (matches.length > 1) {
    console.log(`  ⚠ ${kind} ${op.year} "${op.name}": ${matches.length} TREFFER (Teams: ${matches.map(m=>m[1]).join(',')}) – übersprungen`);
    warn++; return;
  }
  const m = matches[0], entry = m[0], team = m[1];
  if (kind === 'MOVE') {
    const newEntry = entry.replace(`,'${team}',`, `,'${op.newTeam}',`);
    line = line.slice(0, m.index) + newEntry + line.slice(m.index + entry.length);
    console.log(`  ✓ MOVE ${op.year} ${op.name}: ${team} → ${op.newTeam}`);
  } else {
    // Eintrag + genau ein angrenzendes Komma entfernen
    let start = m.index, end = m.index + entry.length;
    if (line[end] === ',') end++;
    else if (line[start - 1] === ',') start--;
    line = line.slice(0, start) + line.slice(end);
    console.log(`  ✓ REMOVE ${op.year} ${op.name} (Team ${team})`);
  }
  lines[idx] = line;
  ok++;
}

console.log(`\n=== Paket-E ${APPLY ? 'APPLY' : 'DRY-RUN'} ===\n-- MOVES --`);
moves.forEach(op => applyOp(op, 'MOVE'));
console.log('-- REMOVES --');
removes.forEach(op => applyOp(op, 'REMOVE'));
console.log(`\nErgebnis: ${ok} angewandt, ${warn} Warnungen (${moves.length + removes.length} Ops gesamt).`);

if (APPLY && warn === 0) {
  fs.writeFileSync(FILE, lines.join('\n'), 'utf8');
  console.log('→ data/seasons.js geschrieben.');
} else if (APPLY) {
  console.log('→ NICHT geschrieben (Warnungen vorhanden – erst beheben).');
}
