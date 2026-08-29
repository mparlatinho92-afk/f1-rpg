// Diagnose-Probe: welches Spiel hat welchen History-Record geschrieben?
// Aufruf im Spiel-Tab (F12 -> Konsole):   await import('/tools/probe-storage.js')
// Erneut laufen lassen: Zahl anhaengen, z.B. '/tools/probe-storage.js?2'
// Gehoert NICHT zum Spiel - reine Werkzeugdatei, wird nicht inliniert.

const db = await new Promise((res, rej) => {
    const o = indexedDB.open('f1rpg', 4);
    o.onsuccess = () => res(o.result);
    o.onerror = () => rej(o.error);
});

const keysOf = (store) => new Promise((res) => {
    const q = db.transaction(store, 'readonly').objectStore(store).getAllKeys();
    q.onsuccess = () => res(q.result);
    q.onerror = () => res([]);
});

// Fahrer-IDs tragen ihren Erzeugungszeitpunkt (reserve-XYZ-1787992101408-314).
// Der haeufigste Zeitstempel eines Records verraet, welches Spiel ihn geschrieben hat.
const herkunft = (obj) => {
    const zaehler = {};
    const re = /-(\d{13})-/g;
    const text = JSON.stringify(obj || {});
    let treffer;
    while ((treffer = re.exec(text))) {
        const stempel = new Date(+treffer[1]).toISOString().slice(0, 16).replace('T', ' ');
        zaehler[stempel] = (zaehler[stempel] || 0) + 1;
    }
    const sortiert = Object.entries(zaehler).sort((a, b) => b[1] - a[1]);
    return sortiert.length ? `${sortiert[0][0]} (${sortiert[0][1]}x)` : 'keine IDs';
};

const detailKeys = await keysOf('history_detail');
const lightKeys = await keysOf('history');
const ramJahre = (GAME_STATE.history || []).map(h => h.year);

const zeilen = [];
for (const key of detailKeys) {
    const detail = await idbHistDetailGet(key);
    zeilen.push({
        Jahr: key,
        Typ: typeof key,
        Herkunft: herkunft(detail),
        imSpiel: ramJahre.includes(Number(key)) ? 'ja' : 'NEIN'
    });
}

console.log('Spieljahr:', GAME_STATE.currentYear, '| Version:', GAME_STATE.version);
console.log('Saisons im RAM:', ramJahre.length,
            '| leichte Records:', lightKeys.length,
            '| schwere Records:', detailKeys.length);
console.table(zeilen);

const gruppen = {};
for (const z of zeilen) gruppen[z.Herkunft] = (gruppen[z.Herkunft] || 0) + 1;
console.log('Records je Herkunft:', gruppen);

const fremd = zeilen.filter(z => z.imSpiel === 'NEIN').map(z => z.Jahr);
console.log('Records ohne zugehoerige Saison im Spiel:', fremd.length ? fremd.join(',') : 'keine');

window.__probe = { zeilen, gruppen, fremd, lightKeys, detailKeys, ramJahre };
console.log('Zum Kopieren:  copy(JSON.stringify(__probe.zeilen))');
