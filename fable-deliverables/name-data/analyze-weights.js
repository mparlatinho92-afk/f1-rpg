// Analyse der Count-Verteilungen zur Wahl von Gewichts-Exponent & Skala (Paket A v3).
// Aufruf: node analyze-weights.js
const fs = require('fs');

const readAgg = (file) => {
    const by = new Map();
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/^([A-Z]{2}),"(.*)",(\d+)$/);
        if (!m) continue;
        if (!by.has(m[1])) by.set(m[1], []);
        by.get(m[1]).push([m[2], parseInt(m[3], 10)]);
    }
    return by;
};

const sur = readAgg('sur_agg.csv');
const fore = readAgg('fore_agg.csv');

function stats(list, label) {
    if (!list) { console.log(label, '— FEHLT'); return; }
    const counts = list.map(e => e[1]);
    const max = counts[0], n = counts.length;
    const at = (i) => counts[Math.min(i, n - 1)];
    const sum = counts.reduce((a, b) => a + b, 0);
    const headShare = counts.slice(0, 10).reduce((a, b) => a + b, 0) / sum;
    console.log(`${label}: n=${n} max=${max} p10=${at(9)} p50=${at(49)} p100=${at(99)} p200=${at(199)} p300=${at(299)} p400=${at(399)} | max/p50=${(max/at(49)).toFixed(1)} max/p300=${(max/at(299)).toFixed(1)} | Top10-Anteil=${(headShare*100).toFixed(1)}%`);
    console.log(`   Top5: ${list.slice(0,5).map(e=>e[0]+':'+e[1]).join(', ')}`);
}

for (const iso of ['GB','US','DE','IT','FR','BR','JP','ES','NL','FI','CO','IE']) {
    stats(sur.get(iso), `SUR ${iso}`);
}
console.log('');
for (const iso of ['GB','US','DE','FR','JP']) {
    stats(fore.get(iso), `FORE ${iso}`);
}

// Wie sähen Gewichte unter verschiedenen Alphas aus? w = max(1, round(100*(c/max)^a))
console.log('\n— Gewichts-Preview GB Nachnamen (w = round(100*(c/max)^a)) —');
const gb = sur.get('GB');
for (const a of [1.0, 0.7, 0.6, 0.5, 0.4]) {
    const w = (i) => Math.max(1, Math.round(100 * Math.pow(gb[Math.min(i,gb.length-1)][1] / gb[0][1], a)));
    // Anteil von Smith am Pool (Top-350)
    const N = Math.min(350, gb.length);
    let tot = 0; for (let i = 0; i < N; i++) tot += Math.max(1, Math.round(100 * Math.pow(gb[i][1]/gb[0][1], a)));
    console.log(`a=${a}: w(#1)=${w(0)} w(#10)=${w(9)} w(#50)=${w(49)} w(#150)=${w(149)} w(#300)=${w(299)} | Smith-Anteil Top350=${(100*w(0)/tot).toFixed(2)}%`);
}
// Dasselbe für DE
console.log('\n— Gewichts-Preview DE Nachnamen —');
const de = sur.get('DE');
for (const a of [1.0, 0.7, 0.6, 0.5, 0.4]) {
    const w = (i) => Math.max(1, Math.round(100 * Math.pow(de[Math.min(i,de.length-1)][1] / de[0][1], a)));
    const N = Math.min(350, de.length);
    let tot = 0; for (let i = 0; i < N; i++) tot += Math.max(1, Math.round(100 * Math.pow(de[i][1]/de[0][1], a)));
    console.log(`a=${a}: w(#1)=${w(0)} w(#10)=${w(9)} w(#50)=${w(49)} w(#150)=${w(149)} w(#300)=${w(299)} | Müller-Anteil Top350=${(100*w(0)/tot).toFixed(2)}%`);
}
