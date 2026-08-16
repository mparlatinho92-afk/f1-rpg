// Messung für den rotierenden Zukunfts-Kalender.
// Reine F1DB-Auswertung (kein sim-core, keine Simulation) – liefert die drei
// Zahlenblöcke, auf denen die Rotationsregeln aufsetzen sollen:
//   A) Monatsfenster je Strecke   – "jede Strecke hat feste erlaubte Jahreszeiten"
//   B) Rotationsrate + Fixsterne  – "so oft wie in den letzten 5-10 Jahren"
//   C) Doppel-Länder              – "2 pro Land, selten aber möglich"
//   D) Poolabgleich zum Sheet     – welche Wunschstrecken haben überhaupt Historie
//
// Aufruf:
//   node tests/calendar-rotation-analysis.js
//   node tests/calendar-rotation-analysis.js --ab=1990      Fensterbasis (Default 1990)
//   node tests/calendar-rotation-analysis.js --mit-indy     Indy 500 (1950-60) mitzaehlen
//   node tests/calendar-rotation-analysis.js --alle-strecken  auch Strecken vor der Fensterbasis

const fs = require('fs');
const path = require('path');

const DB = path.join(__dirname, '..', 'f1db-json-splitted');
const load = f => JSON.parse(fs.readFileSync(path.join(DB, f), 'utf8'));

const args = process.argv.slice(2);
const argVal = (name, def) => {
    const hit = args.find(a => a.startsWith('--' + name + '='));
    return hit ? hit.split('=')[1] : def;
};
const AB = parseInt(argVal('ab', '1990'), 10);
const MIT_INDY = args.includes('--mit-indy');
const ALLE_STRECKEN = args.includes('--alle-strecken');

const races = load('f1db-races.json');
const circuits = load('f1db-circuits.json');
const grandsPrix = load('f1db-grands-prix.json');

const circuitById = new Map(circuits.map(c => [c.id, c]));
const gpById = new Map(grandsPrix.map(g => [g.id, g]));

// Indy 500 lief 1950-60 in der WM, war aber ein Fremdkoerper mit eigenem Feld.
// Fuer Kalenderrotation verzerrt es Groesse, Laenderzahl und Fluktuation der 50er,
// deshalb standardmaessig raus. --mit-indy zeigt den Unterschied.
const isIndyWM = r => r.circuitId === 'indianapolis' && r.year <= 1960;

const felder = races.filter(r => MIT_INDY || !isIndyWM(r));

const jahre = [...new Set(felder.map(r => r.year))].sort((a, b) => a - b);
const MIN_JAHR = jahre[0], MAX_JAHR = jahre[jahre.length - 1];

const proJahr = new Map();   // year -> [race, ...]
felder.forEach(r => {
    if (!proJahr.has(r.year)) proJahr.set(r.year, []);
    proJahr.get(r.year).push(r);
});

const monat = r => r.date ? parseInt(r.date.slice(5, 7), 10) : null;
const MON = ['', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const landVon = cid => (circuitById.get(cid) || {}).countryId || '?';
const nameVon = cid => (circuitById.get(cid) || {}).name || cid;

const line = (s = '') => console.log(s);
const kopf = t => { line(); line('='.repeat(78)); line(t); line('='.repeat(78)); };

line(`F1DB-Kalenderanalyse – ${felder.length} Rennen, ${MIN_JAHR}–${MAX_JAHR}`);
line(`Indy 500 (1950-60): ${MIT_INDY ? 'MITGEZÄHLT' : 'ausgeschlossen'}   Fensterbasis: ab ${AB}`);

// ── A) MONATSFENSTER JE STRECKE ────────────────────────────────────────────
kopf('A) MONATSFENSTER JE STRECKE');
line('Fenster = kleinste Monatsmenge, die ≥90 % der Rennen dieser Strecke abdeckt.');
line('n = Anzahl Rennen in der Fensterbasis. Bei n ≤ 3 ist das Fenster geraten, nicht gemessen.');
line();

const proStrecke = new Map();
felder.forEach(r => {
    if (!proStrecke.has(r.circuitId)) proStrecke.set(r.circuitId, []);
    proStrecke.get(r.circuitId).push(r);
});

function fensterFuer(rennen) {
    const zaehl = new Map();
    rennen.forEach(r => {
        const m = monat(r);
        if (m) zaehl.set(m, (zaehl.get(m) || 0) + 1);
    });
    const gesamt = [...zaehl.values()].reduce((a, b) => a + b, 0);
    const sortiert = [...zaehl.entries()].sort((a, b) => b[1] - a[1]);
    const fenster = [];
    let abgedeckt = 0;
    for (const [m, n] of sortiert) {
        fenster.push(m);
        abgedeckt += n;
        if (abgedeckt / gesamt >= 0.9) break;
    }
    return { zaehl: sortiert, fenster: fenster.sort((a, b) => a - b), gesamt, abgedeckt };
}

const streckenZeilen = [];
for (const [cid, alle] of proStrecke) {
    const basis = alle.filter(r => r.year >= AB);
    const quelle = basis.length ? basis : (ALLE_STRECKEN ? alle : null);
    if (!quelle) continue;
    const f = fensterFuer(quelle);
    const jahreListe = quelle.map(r => r.year);
    streckenZeilen.push({
        cid,
        name: nameVon(cid),
        land: landVon(cid),
        n: quelle.length,
        vonBasis: basis.length > 0,
        von: Math.min(...jahreListe),
        bis: Math.max(...jahreListe),
        fenster: f.fenster,
        anteil: f.abgedeckt / f.gesamt,
        verteilung: f.zaehl.slice(0, 5).map(([m, n]) => `${MON[m]}×${n}`).join(' ')
    });
}
streckenZeilen.sort((a, b) => b.n - a.n);

line('Strecke                 Land                n   Jahre       Fenster          Verteilung');
line('-'.repeat(78));
streckenZeilen.forEach(z => {
    const fenster = z.fenster.map(m => MON[m]).join('/');
    const warn = z.n <= 3 ? ' ⚠' : (z.vonBasis ? '' : ' °');
    line(
        z.name.slice(0, 22).padEnd(23) +
        z.land.slice(0, 18).padEnd(19) +
        String(z.n).padStart(3) + '  ' +
        `${z.von}-${z.bis}`.padEnd(11) +
        (fenster + ` (${Math.round(z.anteil * 100)}%)`).padEnd(16) +
        z.verteilung + warn
    );
});
line();
line('⚠ = n ≤ 3, Fenster nicht belastbar' + (ALLE_STRECKEN ? '   ° = keine Rennen ab Fensterbasis, ganze Historie genutzt' : ''));

// ── B) ROTATIONSRATE ───────────────────────────────────────────────────────
kopf('B) ROTATIONSRATE – wie viel wechselt real pro Jahr?');
line('neu = Strecke war im Vorjahr nicht dabei, weg = war im Vorjahr dabei und fehlt jetzt.');
line();

const rotation = [];
for (let i = 1; i < jahre.length; i++) {
    const j = jahre[i], vj = jahre[i - 1];
    if (j - vj > 1) continue;                       // Luecke im Datensatz: nicht vergleichen
    const jetzt = new Set(proJahr.get(j).map(r => r.circuitId));
    const vorher = new Set(proJahr.get(vj).map(r => r.circuitId));
    const neu = [...jetzt].filter(c => !vorher.has(c));
    const weg = [...vorher].filter(c => !jetzt.has(c));
    rotation.push({ jahr: j, groesse: jetzt.size, rennen: proJahr.get(j).length, neu, weg });
}

line('Jahr  Rennen  Strecken  neu  weg   neue Strecken / weggefallene');
line('-'.repeat(78));
rotation.filter(r => r.jahr >= 2010).forEach(r => {
    const txt = (r.neu.length ? '+' + r.neu.map(nameVon).join(',') : '') +
                (r.weg.length ? '  −' + r.weg.map(nameVon).join(',') : '');
    line(
        String(r.jahr).padEnd(6) +
        String(r.rennen).padStart(5) + '   ' +
        String(r.groesse).padStart(6) + '  ' +
        String(r.neu.length).padStart(4) + ' ' +
        String(r.weg.length).padStart(4) + '   ' +
        txt.slice(0, 44)
    );
});

function schnitt(von, bis) {
    const rows = rotation.filter(r => r.jahr >= von && r.jahr <= bis);
    if (!rows.length) return null;
    const s = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
        n: rows.length,
        neu: s(rows.map(r => r.neu.length)),
        weg: s(rows.map(r => r.weg.length)),
        groesse: s(rows.map(r => r.groesse)),
        min: Math.min(...rows.map(r => r.rennen)),
        max: Math.max(...rows.map(r => r.rennen))
    };
}

line();
line('Zeitraum       Jahre   Ø Strecken  Rennen min-max   Ø neu/Jahr  Ø weg/Jahr');
line('-'.repeat(78));
[['letzte 5', MAX_JAHR - 4, MAX_JAHR], ['letzte 10', MAX_JAHR - 9, MAX_JAHR],
 ['2010er', 2010, 2019], ['2000er', 2000, 2009], ['1990er', 1990, 1999],
 ['1980er', 1980, 1989], ['1970er', 1970, 1979]].forEach(([label, v, b]) => {
    const s = schnitt(v, b);
    if (!s) return;
    line(
        `${label} (${v}-${b})`.padEnd(15) +
        String(s.n).padStart(5) + '   ' +
        s.groesse.toFixed(1).padStart(10) + '   ' +
        `${s.min}-${s.max}`.padStart(13) + '   ' +
        s.neu.toFixed(2).padStart(10) + '  ' +
        s.weg.toFixed(2).padStart(10)
    );
});

// Fixsterne: welche Strecken fallen ueberhaupt nie raus?
line();
line(`Beständigkeit ab ${AB}: in wie vielen der Jahre war die Strecke dabei?`);
line('-'.repeat(78));
const jahreAb = jahre.filter(j => j >= AB);
const praesenz = new Map();
jahreAb.forEach(j => {
    new Set(proJahr.get(j).map(r => r.circuitId)).forEach(c =>
        praesenz.set(c, (praesenz.get(c) || 0) + 1));
});
const rang = [...praesenz.entries()]
    .map(([c, n]) => ({ c, n, q: n / jahreAb.length }))
    .sort((a, b) => b.q - a.q);
const gruppen = [
    ['Fixsterne (≥95 %)', r => r.q >= 0.95],
    ['fast fix (80-94 %)', r => r.q >= 0.8 && r.q < 0.95],
    ['rotierend (40-79 %)', r => r.q >= 0.4 && r.q < 0.8],
    ['selten (<40 %)', r => r.q < 0.4]
];
gruppen.forEach(([label, test]) => {
    const rows = rang.filter(test);
    line(`${label}: ${rows.length}`);
    if (rows.length) line('   ' + rows.map(r => `${nameVon(r.c)}(${Math.round(r.q * 100)}%)`).join(', '));
});

// ── C) DOPPEL-LÄNDER ───────────────────────────────────────────────────────
kopf('C) MEHRFACHRENNEN PRO LAND – wie selten ist "selten"?');
line();
line('Jahr  Länder mit 2+   welche');
line('-'.repeat(78));
const doppelStat = [];
jahre.forEach(j => {
    const proLand = new Map();
    proJahr.get(j).forEach(r => {
        const l = landVon(r.circuitId);
        if (!proLand.has(l)) proLand.set(l, []);
        proLand.get(l).push(r.circuitId);
    });
    const doppel = [...proLand.entries()].filter(([, v]) => v.length >= 2);
    doppelStat.push({ jahr: j, anzahl: doppel.length, laender: doppel.length, max: Math.max(...[...proLand.values()].map(v => v.length)), doppel });
    if (j >= 2005) {
        line(String(j).padEnd(6) + String(doppel.length).padStart(9) + '       ' +
            doppel.map(([l, v]) => `${l}×${v.length}`).join(', ').slice(0, 55));
    }
});
line();
line('Zeitraum      Jahre   Ø Länder mit 2+   Jahre ohne Doppel   max Rennen/Land');
line('-'.repeat(78));
[['letzte 10', MAX_JAHR - 9, MAX_JAHR], ['2010er', 2010, 2019], ['2000er', 2000, 2009],
 ['1990er', 1990, 1999], ['1980er', 1980, 1989], ['1970er', 1970, 1979],
 ['1960er', 1960, 1969], ['1950er', 1950, 1959]].forEach(([label, v, b]) => {
    const rows = doppelStat.filter(r => r.jahr >= v && r.jahr <= b);
    if (!rows.length) return;
    const avg = rows.reduce((a, r) => a + r.anzahl, 0) / rows.length;
    const ohne = rows.filter(r => r.anzahl === 0).length;
    line(
        `${label} (${v}-${b})`.padEnd(14) +
        String(rows.length).padStart(5) + '   ' +
        avg.toFixed(2).padStart(15) + '   ' +
        `${ohne}/${rows.length}`.padStart(17) + '   ' +
        String(Math.max(...rows.map(r => r.max))).padStart(15)
    );
});

// Gleicher GP-Name doppelt im Jahr? (Sheet-Regel "nie 2 pro Grand Prix")
const gpDoppel = [];
jahre.forEach(j => {
    const z = new Map();
    proJahr.get(j).forEach(r => z.set(r.grandPrixId, (z.get(r.grandPrixId) || 0) + 1));
    [...z.entries()].filter(([, n]) => n > 1).forEach(([g, n]) => gpDoppel.push(`${j}: ${g}×${n}`));
});
line();
line(`Gleicher Grand-Prix-Name doppelt im selben Jahr: ${gpDoppel.length ? gpDoppel.join(', ') : 'nie'}`);

// ── D) POOLABGLEICH ZUM SHEET ──────────────────────────────────────────────
kopf('D) POOLABGLEICH – haben die Wunschstrecken aus dem Sheet Historie?');
line();
const wunsch = [
    'Jeddah', 'Imola', 'Hockenheim', 'Istanbul', 'Portimão', 'Mugello', 'Sochi',
    'Nürburgring', 'Kyalami', 'Magny-Cours', 'Bahrain', 'Sepang', 'Madrid',
    'Incheon', 'Bangkok', 'Qiddiya', 'Rwanda', 'Rio', 'Denmark'
];
const norm = s => s.toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ã/g, 'a').replace(/ß/g, 'ss');
line('Suchbegriff      Treffer in F1DB              Rennen  Jahre        Fenster');
line('-'.repeat(78));
wunsch.forEach(w => {
    const treffer = circuits.filter(c =>
        norm(c.id).includes(norm(w)) || norm(c.name).includes(norm(w)) ||
        norm(c.fullName || '').includes(norm(w)) || norm(c.placeName || '').includes(norm(w)));
    if (!treffer.length) {
        line(w.padEnd(17) + '— keine Strecke in F1DB (Fenster muss gesetzt werden)');
        return;
    }
    treffer.forEach(c => {
        const alle = proStrecke.get(c.id) || [];
        if (!alle.length) {
            line(w.padEnd(17) + `${c.name} (${c.id})`.slice(0, 28).padEnd(29) + '     0  —');
            return;
        }
        const f = fensterFuer(alle);
        const js = alle.map(r => r.year);
        line(
            w.padEnd(17) +
            `${c.name} (${c.id})`.slice(0, 28).padEnd(29) +
            String(alle.length).padStart(6) + '  ' +
            `${Math.min(...js)}-${Math.max(...js)}`.padEnd(11) + '  ' +
            f.fenster.map(m => MON[m]).join('/')
        );
    });
});
line();
