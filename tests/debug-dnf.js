'use strict';
const { getContext } = require('./sim-core');

const ctx = getContext();
ctx.initFromYear(1967);

const races = ctx.GAME_STATE.races;
console.log(`Saison 1967: ${races.length} Rennen, ${ctx.GAME_STATE.drivers.length} Fahrer`);
console.log(`GAME_STATE.dnfRate (Multiplikator) = ${ctx.GAME_STATE.dnfRate}%`);
console.log(`Ära-DNF-Basis 1967 = ${ctx.getEraDNFRate ? ctx.getEraDNFRate(1967) : '?'}%`);

// Teams + Reliability
console.log('\nTeam Reliabilities:');
for (const t of ctx.GAME_STATE.teams) {
    console.log(`  ${t.name}: reliability=${t.reliability}, carSpeed=${t.carSpeed}`);
}

// Erstes Rennen simulieren
console.log('\n--- Rennen 0 ---');
const result = ctx.simulateRace(0, false);
if (!result) { console.log('Kein Ergebnis!'); process.exit(1); }

let dnfs = 0, total = 0;
for (const r of result.results) {
    total++;
    if (r.dnf || r.fatal) dnfs++;
    console.log(`  P${String(r.position).padStart(2)} ${r.name.padEnd(28)} dnf=${r.dnf} score=${r.score?.toFixed(1)}`);
}
console.log(`\nDNFs: ${dnfs}/${total} = ${(dnfs/total*100).toFixed(1)}%`);
