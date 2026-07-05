// Excel-Export der Nationen-Frequenz (Paket A v3) — 4 Blätter:
//   Anteile %, Rohzahlen, F1-Blend %, Mapping (historische Staaten)
// Benötigt SheetJS aus dem Session-Scratchpad (nicht im Repo):
//   node export-nation-xlsx.js <pfad-zu-node_modules>
'use strict';
const XLSX = require(process.argv[2] + '/xlsx');
const { MOTORSPORT_NATION_FREQ: M } = require('./nation-frequency-by-decade.js');
const raw = require('./wikidata-cardrivers-raw.json');

const decades = Object.keys(M.counts).map(Number).sort((a, b) => a - b);

// Nationen-Union, sortiert nach Gesamt-Fahrerzahl
const totals = {};
for (const dec of decades) for (const [ioc, n] of Object.entries(M.counts[dec])) totals[ioc] = (totals[ioc] || 0) + n;
const nations = Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
const blendNations = [...new Set([...nations, ...decades.flatMap(d => Object.keys(M.sharesF1Blend[d] || {}))])]
    .sort((a, b) => (totals[b] || 0) - (totals[a] || 0));

function matrixSheet(source, rows, percent) {
    const header = ['Nation', ...decades.map(d => d + 'er'), 'Gesamt'];
    const data = [header];
    for (const ioc of rows) {
        const line = [ioc];
        let sum = 0;
        for (const dec of decades) {
            const v = (source[dec] && source[dec][ioc]) || 0;
            sum += v;
            line.push(percent ? +(v * 100).toFixed(2) : v);
        }
        line.push(percent ? +(sum / decades.length * 100).toFixed(2) : sum);
        data.push(line);
    }
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 8 }, ...decades.map(() => ({ wch: 9 })), { wch: 9 }];
    return ws;
}

// Mapping-Blatt aus den Rohdaten rekonstruieren
const IOC_NORM = { 'SPA':'ESP','FRG':'GER','GDR':'GER','SAA':'GER','EUA':'GER','URS':'RUS','EUN':'RUS','ROC':'RUS','TCH':'CZE','BOH':'CZE','YUG':'SRB','SCG':'SRB','RHO':'ZIM','HOL':'NED','ANZ':'AUS','MAL':'MAS','UAR':'EGY','ROM':'ROU','RUM':'ROU' };
const LABEL_MAP = { 'Kingdom of Italy':'ITA','Kingdom of the Netherlands':'NED','United Kingdom of Great Britain and Ireland':'GBR','Kingdom of Denmark':'DEN','Empire of Japan':'JPN','German Reich':'GER','Nazi Germany':'GER','Prussia':'GER','Austria–Hungary':'AUT','Socialist Federal Republic of Yugoslavia':'SRB','Kingdom of Yugoslavia':'SRB','Russian Empire':'RUS','Ottoman Empire':'TUR','British Hong Kong':'HKG','Kingdom of Romania':'ROU','Kingdom of Portugal':'POR','Federation of Rhodesia and Nyasaland':'ZIM','Southern Rhodesia':'ZIM','Dominion of India':'IND','Isle of Man':'GBR','Czechoslovakia':'CZE','Soviet Union':'RUS','West Germany':'GER','East Germany':'GER' };
const mapAgg = new Map();
for (const b of raw.results.bindings) {
    const label = b.cLabel.value, n = +b.n.value;
    const ioc = b.ioc ? b.ioc.value.toUpperCase() : null;
    let target = null, quelle = '';
    if (ioc && IOC_NORM[ioc]) { target = IOC_NORM[ioc]; quelle = `IOC-Altcode ${ioc}`; }
    else if (!ioc && LABEL_MAP[label]) { target = LABEL_MAP[label]; quelle = 'Label-Mapping'; }
    else if (!ioc) { target = '(verworfen)'; quelle = 'Junk/Vandalismus'; }
    if (target) {
        const k = `${label}|${target}|${quelle}`;
        mapAgg.set(k, (mapAgg.get(k) || 0) + n);
    }
}
const mapData = [['Historischer Staat / Sonderfall', '→ IOC', 'Fahrer', 'Mapping-Quelle']];
for (const [k, n] of [...mapAgg.entries()].sort((a, b) => b[1] - a[1])) {
    const [label, target, quelle] = k.split('|');
    mapData.push([label, target, n, quelle]);
}
const wsMap = XLSX.utils.aoa_to_sheet(mapData);
wsMap['!cols'] = [{ wch: 45 }, { wch: 12 }, { wch: 8 }, { wch: 18 }];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, matrixSheet(M.shares, nations, true), 'Anteile %');
XLSX.utils.book_append_sheet(wb, matrixSheet(M.counts, nations, false), 'Rohzahlen');
XLSX.utils.book_append_sheet(wb, matrixSheet(M.sharesF1Blend, blendNations, true), 'F1-Blend 50% %');
XLSX.utils.book_append_sheet(wb, wsMap, 'Mapping hist. Staaten');
XLSX.writeFile(wb, 'nation-frequency-by-decade.xlsx');
console.log('OK — nation-frequency-by-decade.xlsx:', nations.length, 'Nationen ×', decades.length, 'Dekaden (+Blend:', blendNations.length, 'Nationen)');
