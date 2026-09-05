/**
 * circuit-namegen.js — prüft den Strecken-/Rennnamen-Generator (Fable-Paket 8).
 *
 * Zwei Fragen:
 *  1. Ist die Nations-Ziehung gewichtet? Spanien muss deutlich häufiger kommen
 *     als die Elfenbeinküste — auch im Notausgang, wenn der Kalender voll ist.
 *  2. Passt der Ort zum Muster? Straßenkurs → Stadt, permanenter Kurs → Kleinort.
 *
 * Aufruf: SIMCORE_FROM_INDEX=1 node tests/circuit-namegen.js
 */
const { getContext } = require('./sim-core');
const vm = require('vm');

const ctx = getContext();
const run = expr => vm.runInContext(expr, ctx);

const N = 20000;
console.log('Ziehungen je Test: ' + N.toLocaleString('de-DE') + '\n');

// ── 1. Nations-Gewichtung, leerer Kalender ──────────────────────────────────
function nationsVerteilung(usedJs) {
    const code = `(() => {
        const used = ${usedJs};
        const z = {};
        for (let i = 0; i < ${N}; i++) {
            const ioc = _pickCircuitNation(1990, used);
            z[ioc] = (z[ioc] || 0) + 1;
        }
        return z;
    })()`;
    return run(code);
}

const leer = nationsVerteilung('new Set()');
const srt = Object.entries(leer).sort((a, b) => b[1] - a[1]);
console.log('LEERER KALENDER — Top 10 Nationen:');
console.log('  ' + srt.slice(0, 10).map(x => x[0] + ' ' + (x[1] / N * 100).toFixed(1) + '%').join('  '));
console.log('  Nationen insgesamt gezogen: ' + srt.length);
const esp = (leer.ESP || 0), civ = (leer.CIV || 0);
console.log('  ESP=' + esp + '  CIV=' + civ + '  -> Faktor ' + (civ ? (esp / civ).toFixed(1) : '∞'));

// ── 2. Notausgang: die 12 größten Nationen sind belegt ──────────────────────
const gross = ['GBR','FRA','ITA','USA','GER','BRA','ESP','JPN','FIN','ARG','AUS','SUI'];
const voll = nationsVerteilung('new Set(' + JSON.stringify(gross) + ')');
const srt2 = Object.entries(voll).sort((a, b) => b[1] - a[1]);
console.log('\nVOLLER KALENDER (12 große Nationen belegt) — Top 10:');
console.log('  ' + srt2.slice(0, 10).map(x => x[0] + ' ' + (x[1] / N * 100).toFixed(1) + '%').join('  '));
const belegt = srt2.filter(x => gross.includes(x[0]));
console.log('  belegte Nationen erneut gezogen: ' + (belegt.length ? belegt.map(x=>x[0]).join(' ') : 'keine (richtig)'));
const rus = (voll.RUS || 0), civ2 = (voll.CIV || 0);
console.log('  RUS=' + rus + '  CIV=' + civ2 + '  -> Faktor ' + (civ2 ? (rus / civ2).toFixed(1) : '∞')
    + '   (gleichverteilt wäre 1,0)');

// ── 3. Ort passt zum Muster ─────────────────────────────────────────────────
console.log('\nORT ZUM MUSTER (Straßenkurs muss Stadt ziehen):');
const kopplung = run(`(() => {
    let strasseStadt = 0, strasseGesamt = 0, permKlein = 0, permGesamt = 0;
    for (let i = 0; i < ${N}; i++) {
        const ioc = _pickCircuitNation(2005, new Set());
        const b = CIRCUIT_PLACES[ioc]; if (!b) continue;
        const key = CIRCUIT_NATION_KEY[ioc] || 'intl';
        const m = _circuitPick(CIRCUIT_NAME_POOLS.circuitPattern[key], 'e94');
        const strasse = /Street/.test(m);
        const loc = _pickPlace(ioc, strasse);
        const istStadt = b.g.includes(loc);
        if (strasse) { strasseGesamt++; if (istStadt) strasseStadt++; }
        else { permGesamt++; if (!istStadt) permKlein++; }
    }
    return { strasseStadt, strasseGesamt, permKlein, permGesamt };
})()`);
const pct = (a, b) => b ? (a / b * 100).toFixed(1) + '%' : '—';
console.log('  Straßenkurse mit Stadt:     ' + pct(kopplung.strasseStadt, kopplung.strasseGesamt)
    + '  (' + kopplung.strasseGesamt + " Fälle)");
console.log('  permanente Kurse mit Kleinort: ' + pct(kopplung.permKlein, kopplung.permGesamt)
    + '  (' + kopplung.permGesamt + ' Fälle)');

// ── 4. Stichprobe echter Namen je Ära ───────────────────────────────────────
console.log('\nSTICHPROBE:');
for (const jahr of [1955, 1975, 1995, 2020]) {
    const namen = run(`(() => {
        const out = [];
        for (let i = 0; i < 6; i++) {
            const ioc = _pickCircuitNation(${jahr}, new Set());
            const key = CIRCUIT_NATION_KEY[ioc] || 'intl';
            const era = _teamEraKey(${jahr});
            const m = _circuitPick(CIRCUIT_NAME_POOLS.circuitPattern[key], era);
            const loc = _pickPlace(ioc, /Street/.test(m));
            const r = _circuitPick(CIRCUIT_NAME_POOLS.racePattern[key], era).replace('{loc}', loc);
            out.push(m.replace('{loc}', loc) + '  —  ' + r + ' [' + ioc + ']');
        }
        return out;
    })()`);
    console.log('  ' + jahr + ':');
    for (const n of namen) console.log('    ' + n);
}
