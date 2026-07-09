// Paket D – Aggregations-Skript: verdichtet megasim-qa.json zu prüfbaren Kennzahlen.
// Verwendung: node analyze-qa.js megasim-qa.json > analysis.txt
'use strict';
const path = require('path');
const file = process.argv[2] || 'megasim-qa.json';
const d = require(path.resolve(__dirname, file));

// Emoji-Flaggen → IOC (History-Snapshots mischen beide Kodierungen)
const EMO = { '🇬🇧':'GBR','🇺🇸':'USA','🇮🇹':'ITA','🇫🇷':'FRA','🇩🇪':'GER','🇦🇷':'ARG','🇧🇷':'BRA',
  '🇧🇪':'BEL','🇨🇭':'SUI','🇪🇸':'ESP','🇦🇹':'AUT','🇦🇺':'AUS','🇳🇿':'NZL','🇸🇪':'SWE','🇫🇮':'FIN',
  '🇳🇱':'NED','🇨🇦':'CAN','🇲🇽':'MEX','🇯🇵':'JPN','🇿🇦':'RSA','🇲🇨':'MON','🇵🇹':'POR','🇩🇰':'DEN',
  '🇮🇪':'IRL','🇹🇭':'THA','🇺🇾':'URU','🇻🇪':'VEN','🇨🇴':'COL','🇵🇱':'POL','🇷🇺':'RUS','🇨🇳':'CHN',
  '🇮🇳':'IND','🇲🇾':'MYS','🇮🇩':'IDN','🇲🇦':'MAR','🇷🇴':'ROU','🇭🇺':'HUN','🇨🇿':'CZE','🇬🇷':'GRE',
  '🇹🇷':'TUR','🇰🇷':'KOR','🇳🇴':'NOR','🇱🇮':'LIE','🇷🇭':'RHO','🇨🇱':'CHI','🇨🇺':'CUB','🇵🇷':'PUR' };
const nat = n => EMO[n] || n || '?';
const dec = y => Math.floor(y / 10) * 10;
const pct = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '–';

const S = d.seasons;
console.log(`META ${JSON.stringify(d.meta)}\n`);

// ── 1. Saison-Zeilen ────────────────────────────────────────────────────────
console.log('── SAISONS ──');
for (const s of S) {
  const c = s.champion;
  console.log(`${s.year} | ${c.name} (${c.age ?? '?'}, ${nat(c.nation)}, ${c.team}#${c.teamRank ?? '?'}${c.hist ? '' : ', gen'}${c.rookie ? ', ROOKIE' : ''}) ${c.points}P/${c.wins}S | Team-WM: ${s.teamChampion.name} ${s.teamChampion.points}P | R${s.raceCount} DNF ${s.dnf.rate ?? '?'}% Fat ${s.dnf.fatals} Tode ${s.deaths.length} | Grid ${s.grid.drivers}F/${s.grid.teams}T`);
}

// ── 2. Champion-Profil ──────────────────────────────────────────────────────
const ages = S.map(s => s.champion.age).filter(a => a != null);
const rankDist = {};
S.forEach(s => { const r = s.champion.teamRank ?? '?'; rankDist[r] = (rankDist[r] || 0) + 1; });
console.log('\n── CHAMPION-PROFIL ──');
console.log(`Alter: min ${Math.min(...ages)} / Ø ${(ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1)} / max ${Math.max(...ages)}`);
console.log(`Team-Rang des Champions: ${JSON.stringify(rankDist)}`);
console.log(`Rookie-Champions: ${S.filter(s => s.champion.rookie).map(s => s.year + ' ' + s.champion.name).join(', ') || 'keine'}`);
const histByDec = {};
S.forEach(s => { const k = dec(s.year); (histByDec[k] = histByDec[k] || { h: 0, g: 0 })[s.champion.hist ? 'h' : 'g']++; });
console.log(`Champion hist/generiert je Dekade: ${Object.entries(histByDec).map(([k, v]) => `${k}er ${v.h}h/${v.g}g`).join('  ')}`);

// ── 3. Titel-Häufungen ──────────────────────────────────────────────────────
const champCount = {}, teamChampCount = {};
S.forEach(s => {
  champCount[s.champion.name] = (champCount[s.champion.name] || 0) + 1;
  teamChampCount[s.teamChampion.name] = (teamChampCount[s.teamChampion.name] || 0) + 1;
});
console.log('\n── TITEL ──');
console.log('Fahrer (≥2): ' + Object.entries(champCount).filter(([, v]) => v >= 2).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}×${v}`).join(', '));
console.log('Teams: ' + Object.entries(teamChampCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}×${v}`).join(', '));
let runD = 1, maxD = 1, runT = 1, maxT = 1;
for (let i = 1; i < S.length; i++) {
  runD = S[i].champion.name === S[i - 1].champion.name ? runD + 1 : 1; maxD = Math.max(maxD, runD);
  runT = S[i].teamChampion.name === S[i - 1].teamChampion.name ? runT + 1 : 1; maxT = Math.max(maxT, runT);
}
console.log(`Längste Serie: Fahrer ${maxD}, Team ${maxT}`);

// ── 4. DNF / Tode je Dekade ─────────────────────────────────────────────────
console.log('\n── DNF/TODE JE DEKADE ──');
const decAgg = {};
S.forEach(s => {
  const k = dec(s.year);
  const a = decAgg[k] = decAgg[k] || { dnf: [], fat: 0, deaths: 0, n: 0 };
  if (s.dnf.rate != null) a.dnf.push(s.dnf.rate);
  a.fat += s.dnf.fatals; a.deaths += s.deaths.length; a.n++;
});
Object.entries(decAgg).forEach(([k, a]) =>
  console.log(`${k}er: DNF Ø ${(a.dnf.reduce((x, y) => x + y, 0) / a.dnf.length).toFixed(1)}% | tödl. Unfälle ${a.fat} | Saison-Tode ${a.deaths} (${a.n} Saisons)`));

// ── 5. Nationen je Dekade (Grid-Anteile, Top 8) ────────────────────────────
console.log('\n── NATIONEN JE DEKADE (Grid) ──');
const natByDec = {};
S.forEach(s => {
  const k = dec(s.year); const m = natByDec[k] = natByDec[k] || {};
  Object.entries(s.grid.nations || {}).forEach(([n, c]) => { m[nat(n)] = (m[nat(n)] || 0) + c; });
});
Object.entries(natByDec).forEach(([k, m]) => {
  const tot = Object.values(m).reduce((a, b) => a + b, 0);
  const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([n, c]) => `${n} ${pct(c, tot)}`).join(', ');
  console.log(`${k}er (${tot} Slots): ${top}`);
});

// ── 6. Backmarker-Kalibrierung ─────────────────────────────────────────────
console.log('\n── BACKMARKER (unteres Drittel der Team-WM) ──');
let bmSeasons = 0, bmTeams = 0, bmWithPts = 0, bmPtsFin = 0, bmWins = 0;
const bmDetail = [];
S.forEach(s => {
  const n = s.teams.length; if (n < 6) return;
  const cut = Math.ceil(n * 2 / 3);
  const bottom = s.teams.filter(t => t.rank > cut);
  bmSeasons++;
  bottom.forEach(t => {
    bmTeams++;
    if (t.pts > 0) bmWithPts++;
    bmPtsFin += t.ptsFinishes;
    if (t.wins > 0) { bmWins++; bmDetail.push(`${s.year} ${t.name} (#${t.rank}/${n}) ${t.wins} SIEG(E), ${t.pts}P`); }
  });
});
console.log(`Teams im unteren Drittel: ${bmTeams} Team-Saisons | davon mit Punkten: ${bmWithPts} (${pct(bmWithPts, bmTeams)}) | Ø Punkte-Finishes: ${(bmPtsFin / bmTeams).toFixed(2)}`);
console.log(`Backmarker-SIEGE: ${bmWins}${bmDetail.length ? '\n  ' + bmDetail.join('\n  ') : ''}`);

// Referenz-Teams über alle Saisons
console.log('\n── REFERENZ-TEAMS (Punkte je Saison) ──');
['Minardi', 'Arrows', 'Osella', 'Zakspeed', 'AGS', 'Coloni', 'Forti', 'Simtek', 'Pacific', 'HRT', 'Manor', 'Caterham', 'Marussia', 'Williams', 'Ferrari', 'McLaren'].forEach(name => {
  const rows = S.map(s => ({ y: s.year, t: s.teams.find(t => t.name === name) })).filter(r => r.t);
  if (!rows.length) return;
  console.log(`${name}: ` + rows.map(r => `${r.y}:#${r.t.rank}/${r.t.pts}P(${r.t.ptsFinishes}PF${r.t.wins ? ',' + r.t.wins + 'S' : ''})`).join(' '));
});

// ── 7. Transfer-Plausibilität ──────────────────────────────────────────────
console.log('\n── AUFFÄLLIGE TRANSFERS (Top-6-Fahrer → unteres Drittel; Champion-Wechsel) ──');
S.forEach(s => {
  const n = s.teams.length; const cut = Math.ceil(n * 2 / 3);
  const rankByTeam = new Map(s.teams.map(t => [t.name, t.rank]));
  const topNames = new Map(s.top10.slice(0, 6).map((t, i) => [t.name, i + 1]));
  (s.transfers || []).forEach(t => {
    const isChamp = t.n === s.champion.name;
    const stRank = topNames.get(t.n);
    const toRank = rankByTeam.get(t.to);
    if (isChamp || (stRank && toRank && toRank > cut)) {
      console.log(`${s.year}: ${t.n}${isChamp ? ' [CHAMPION]' : stRank ? ` [WM-P${stRank}]` : ''} ${t.from} → ${t.to}${toRank ? ` (#${toRank}/${n})` : ''} [${t.ty}]`);
    }
  });
});

// ── 8. Rücktritte / Alter ──────────────────────────────────────────────────
console.log('\n── RÜCKTRITTE ──');
const retAges = [];
const reasons = {};
S.forEach(s => (s.retirements || []).forEach(r => {
  if (r.age != null) retAges.push(r.age);
  const key = (r.reason || '?').replace(/bei .+$/, 'bei <Team>').slice(0, 40);
  reasons[key] = (reasons[key] || 0) + 1;
}));
if (retAges.length) {
  retAges.sort((a, b) => a - b);
  const buckets = {};
  retAges.forEach(a => { const b = a < 25 ? '<25' : a < 30 ? '25-29' : a < 35 ? '30-34' : a < 40 ? '35-39' : a < 45 ? '40-44' : '45+'; buckets[b] = (buckets[b] || 0) + 1; });
  console.log(`n=${retAges.length}, Median ${retAges[Math.floor(retAges.length / 2)]}, Verteilung ${JSON.stringify(buckets)}`);
}
console.log('Gründe: ' + Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}×${v}`).join(' | '));

// ── 9. Todesfälle (Alter/Jahr) ─────────────────────────────────────────────
console.log('\n── TODESFÄLLE ──');
S.forEach(s => { if (s.deaths.length) console.log(`${s.year}: ${s.deaths.map(x => `${x.n}(${x.age ?? '?'})`).join(', ')}`); });
