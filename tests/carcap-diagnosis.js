// carcap-diagnosis.js — WAGEN JE KONSTRUKTEUR: haelt der Deckel, und stimmt die Zahl?
//
// Zwei Betriebsarten:
//
// [1] EINZELJAHR — wo entsteht ein ueberzaehliger Wagen?
//     Legt drei Messpunkte je Rennen nebeneinander:
//       [A] VOR dem Deckel     — Eingabe von applyConstructorCarCap (Wrapper)
//       [B] NACH dem Deckel    — Rueckgabe von applyConstructorCarCap (Wrapper)
//       [C] Ergebnisliste      — Starter + DNQ + DNPQ aus simulateRace
//     Bleibt [B] sauber und [C] nicht, kommt der Wagen NACH dem Deckel dazu.
//     So wurde das 2005er Drittauto geschlossen (Ursache war der Grid-Fueller).
//
// [2] MASKE (--maske) — stimmt die Wagenzahl ueber die ganze Zeitachse?
//     Misst JE JAHRFUENFT und vergleicht mit F1DB. Der Deckel selbst ist nach
//     Dekaden gestaffelt (_maxCarsPerConstructor), die Wirklichkeit aber nicht:
//     die Drittautos der 1970er lagen fast alle in der ERSTEN Haelfte des
//     Jahrzehnts. Ein Dekadenmittel als Referenz verdeckt genau das — deshalb
//     Jahrfuenfte. Die Sims werden gleichmaessig auf die fuenf Jahre verteilt,
//     damit kein Einzeljahr die Gruppe traegt.
//
// Der Wrapper haengt sich an die Kontext-Global (`ctx.applyConstructorCarCap`) —
// Top-Level-Funktionen der HTML liegen dort, und simulateRace loest sie ueber die
// Scope-Kette darueber auf. `globalThis`-Sonden funktionieren NICHT (eigener
// vm-Kontext), siehe Messfalle im Themen-Memo.
//
// AUFRUF
//   node tests/carcap-diagnosis.js 2005 15              Einzeljahr, 15 Sims
//   node tests/carcap-diagnosis.js 2005 15 --alle       jede Verletzung einzeln
//   node tests/carcap-diagnosis.js --maske              alle Jahrfuenfte, 50 Sims je Gruppe
//   node tests/carcap-diagnosis.js --maske --sims=20    schneller Durchlauf
//   node tests/carcap-diagnosis.js --maske=1950-1989    nur dieser Ausschnitt
//   node tests/carcap-diagnosis.js --maske --jahre      zusaetzlich jedes Jahr einzeln
//
// SHELL: SIMCORE_FROM_INDEX misst die unkommittete index.html statt des Monolithen.
//   PowerShell  $env:SIMCORE_FROM_INDEX = "1"   / aus mit $null
//   cmd.exe     set SIMCORE_FROM_INDEX=1        / aus mit leerem Wert: set SIMCORE_FROM_INDEX=
//   Die PowerShell-Form in cmd getippt bricht ab — der Test laeuft dann still
//   gegen den Monolithen weiter.
//
// REFERENZ: f1db-json-splitted/. Gezaehlt wird wie in der Kalibrierung von
//   _maxCarsPerConstructor (index.html): verschiedene Fahrer je constructorId und
//   Rennen, Testfahrer raus, Indianapolis raus (eigenes Starterfeld).
'use strict';
const fs = require('fs');
const path = require('path');
const { getContext } = require('./sim-core');

// ── Argumente ───────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const num = argv.filter(a => /^\d+$/.test(a)).map(Number);
const opt = k => {
    const a = argv.find(x => x === `--${k}` || x.startsWith(`--${k}=`));
    if (!a) return null;
    return a.includes('=') ? a.split('=').slice(1).join('=') : true;
};
const MASKE = opt('maske');
const ALLE = argv.includes('--alle');
const JAHRE = argv.includes('--jahre');
const YEAR = num[0] || 2005;
const SIMS = MASKE ? Number(opt('sims') || 50) : (num[1] || 5);

// Bereich der Maske. Default 1950–2024: f1db reicht weiter, aber die
// SEASON_DATA-Vorlagen enden um 2025 — angefangene Jahrfuenfte verzerren.
let VON = 1950, BIS = 2024;
if (typeof MASKE === 'string') {
    const m = MASKE.match(/^(\d{4})-(\d{4})$/);
    if (!m) { console.log(`ABBRUCH: --maske erwartet z.B. --maske=1950-1989`); process.exit(1); }
    VON = Number(m[1]); BIS = Number(m[2]);
}

// ── Lokalmatadoren ──────────────────────────────────────────────────────────
// HOME_ONLY_ENTRIES (data/f1db.js) = die kuratierten Fahrer, die real AUSSCHLIESSLICH
// bei bestimmten Heimrennen starteten — der lokale Privatier im Kundenauto. Sie
// melden unter dem Konstrukteursnamen (Brabham, Lotus, Cooper) und blaehen dessen
// Wagenzahl an genau diesem Wochenende auf. Weil das Spiel dieselbe Erscheinung
// ueber `d.homeOnly` selbst modelliert, muss sie auf BEIDEN Seiten gleich behandelt
// werden — sonst misst der Vergleich den Filter statt der Wirklichkeit.
//   real  -> Slug steht in HOME_ONLY_ENTRIES
//   Spiel -> d.homeOnly (deckt kuratierte UND generisch zugewiesene ab, also auch
//            die erfundenen Lokalmatadoren, die es real nie gab)
// Direkt aus data/f1db.js gelesen und nicht aus dem sim-core-Kontext: die Liste ist
// dort ein `const` im Skript-Rumpf und landet deshalb NICHT auf der Kontext-Global.
function ladeLokalmatadoren() {
    const src = fs.readFileSync(path.join(__dirname, '..', 'data', 'f1db.js'), 'utf8');
    const i = src.indexOf('const HOME_ONLY_ENTRIES');
    if (i < 0) return new Set();
    const obj = eval('(' + src.slice(src.indexOf('{', i), src.indexOf('};', i) + 1) + ')');
    return new Set(Object.keys(obj).map(s => s.toLowerCase()));
}
let LOKAL = new Set();
try { LOKAL = ladeLokalmatadoren(); }
catch (e) { console.log(`WARNUNG: HOME_ONLY_ENTRIES nicht lesbar (${e.message}) — die Lokalmatadoren-Sicht bleibt leer.\n`); }

// ── Reale Referenz aus F1DB ─────────────────────────────────────────────────
// jahr -> [[alle, ohneLokal], ...] je (Rennen, Konstrukteur). Dieselbe Zaehlweise
// wie die Kalibrierung des Deckels, damit Spiel und Referenz dasselbe messen.
const BASE = path.join(__dirname, '..', 'f1db-json-splitted');
function ladeReal() {
    const J = f => JSON.parse(fs.readFileSync(path.join(BASE, f), 'utf8'));
    const istIndy = {};
    for (const r of J('f1db-races.json')) istIndy[`${r.year}_${r.round}`] = r.grandPrixId === 'indianapolis';
    const proRennen = {};   // `${jahr}|${runde}|${konstrukteur}` -> Set(fahrer)
    for (const e of J('f1db-seasons-entrants-drivers.json')) {
        if (e.testDriver) continue;
        for (const rd of (e.rounds || [])) {
            if (istIndy[`${e.year}_${rd}`]) continue;
            const k = `${e.year}|${rd}|${e.constructorId}`;
            (proRennen[k] = proRennen[k] || new Set()).add(String(e.driverId).toLowerCase());
        }
    }
    const real = {};
    for (const k in proRennen) {
        const jahr = Number(k.split('|')[0]);
        const fahrer = [...proRennen[k]];
        const ohne = fahrer.filter(d => !LOKAL.has(d)).length;
        (real[jahr] = real[jahr] || []).push([fahrer.length, ohne]);
    }
    return real;
}
let REAL = {};
try { REAL = ladeReal(); }
catch (e) { console.log(`WARNUNG: F1DB-Referenz nicht lesbar (${e.message}) — es wird ohne Vergleich gemessen.\n`); }

// ── Kontext + Wrapper um den Deckel ─────────────────────────────────────────
const ctx = getContext();
for (const fn of ['applyConstructorCarCap', '_maxCarsPerConstructor', 'simulateRace']) {
    if (typeof ctx[fn] !== 'function') {
        console.log(`ABBRUCH: ${fn} ist im sim-core-Kontext nicht sichtbar.`);
        process.exit(1);
    }
}

// Die letzte Deckel-Rechnung des laufenden Rennens. simulateTraining und
// simulateQualifying rufen denselben Deckel — massgeblich ist der LETZTE Aufruf
// vor der Auswertung, also der aus simulateRace.
let letzterDeckel = null;
const _origCap = ctx.applyConstructorCarCap;
ctx.applyConstructorCarCap = function (drivers, teams, year) {
    const vorher = {};
    drivers.forEach(d => { if (d.team) vorher[d.team] = (vorher[d.team] || 0) + 1; });
    const out = _origCap.call(this, drivers, teams, year);
    const nachher = {};
    out.forEach(d => { if (d.team) nachher[d.team] = (nachher[d.team] || 0) + 1; });
    letzterDeckel = { vorher, nachher, deckel: ctx._maxCarsPerConstructor(year) };
    return out;
};

// ── Messung ─────────────────────────────────────────────────────────────────
function neuerEimer() {
    return {
        sims: 0, rennen: 0, gaeste: 0, lokale: 0,
        ueberVorDeckel: 0, ueberNachDeckel: 0, ueberImErgebnis: 0,
        quellen: {}, faelle: [],
        // Zwei parallele Sichten auf dieselben Rennen: mit allen Meldungen und
        // ohne die Lokalmatadoren. Gleiche Felder, damit spielKennzahl beide kann.
        alle:  { teamsGesamt: 0, wagenSumme: 0, max: 0, verteilung: {} },
        ohne:  { teamsGesamt: 0, wagenSumme: 0, max: 0, verteilung: {} },
    };
}

// Simuliert EINE Saison des Jahres und schreibt in ALLE uebergebenen Eimer
// gleichzeitig (Gruppe und Jahr). Bewusst kein Nachrechnen von Differenzen —
// jeder Zaehler wird an Ort und Stelle in jedem Eimer erhoeht.
// Rueckgabe: true wenn der Durchlauf verwertbar war.
function simuliereSaison(jahr, eimerIn, simNr) {
    const eimerListe = Array.isArray(eimerIn) ? eimerIn : [eimerIn];
    const inc = (feld, wert = 1) => eimerListe.forEach(e => { e[feld] += wert; });
    const incMap = (feld, schluessel, wert = 1) => eimerListe.forEach(e => { e[feld][schluessel] = (e[feld][schluessel] || 0) + wert; });
    // Eine Team-Meldung in eine der beiden Sichten buchen. n = 0 heisst: dieser
    // Konstrukteur hatte an dem Wochenende NUR Lokalmatadoren — dann existiert er
    // in der gefilterten Sicht gar nicht und darf auch nicht als „0 Wagen" zaehlen.
    const buche = (sicht, n) => {
        if (!n) return;
        eimerListe.forEach(e => {
            const S = e[sicht];
            S.teamsGesamt++; S.wagenSumme += n;
            if (n > S.max) S.max = n;
            S.verteilung[n] = (S.verteilung[n] || 0) + 1;
        });
    };

    try { ctx.initFromYear(jahr); }
    catch (e) { return false; }

    const races = ctx.GAME_STATE.races || [];
    if (!races.length) return false;

    for (let i = 0; i < races.length; i++) {
        const race = races[i];
        if (race.isIndy || (race.name || '').includes('Indianapolis')) continue;
        let result = null;
        letzterDeckel = null;
        try {
            if (typeof ctx.applyGuestMoves === 'function') ctx.applyGuestMoves(i);
            ctx.simulateTraining(i);
            ctx.simulateQualifying(i, false);
            result = ctx.simulateRace(i, false);
        } catch (e) { continue; }
        if (!result) continue;

        // Kader JETZT einlesen — vor applyRaceResults, das schon Sitzverluste nachzieht.
        const dName = {}, dTeam = {}, dLokal = {}, tName = {};
        for (const d of (ctx.GAME_STATE.drivers || [])) {
            dName[d.id] = d.name; dTeam[d.id] = d.team || null;
            // Spielseitige Entsprechung zu HOME_ONLY_ENTRIES. Das Flag deckt beide
            // Quellen ab: kuratiert (_homeOnlyCurated) und generisch zugewiesen.
            dLokal[d.id] = !!d.homeOnly;
        }
        for (const t of (ctx.GAME_STATE.teams || [])) tName[t.id] = t.name;

        const deckel = ctx._maxCarsPerConstructor(ctx.GAME_STATE.currentYear);
        inc('rennen');

        // [C] Ergebnisliste. Starter tragen ihr Team SELBST (r.team) — DNQ/DNPQ
        // sind nur Ids und muessen ueber den Kader aufgeloest werden.
        const carsOf = {};
        const push = (tid, e) => { if (tid) (carsOf[tid] = carsOf[tid] || []).push(e); };
        (result.results || []).forEach(r => {
            push(r.team, { name: r.name || dName[r.driver] || r.driver, kind: 'Start', gast: !!r.isGuest, lokal: !!dLokal[r.driver] });
            if (r.isGuest) inc('gaeste');
            if (dLokal[r.driver]) inc('lokale');
        });
        (result.dnq || []).forEach(id => push(dTeam[id], { name: dName[id] || id, kind: 'DNQ', gast: false, lokal: !!dLokal[id] }));
        (result.dnpq || []).forEach(id => push(dTeam[id], { name: dName[id] || id, kind: 'DNPQ', gast: false, lokal: !!dLokal[id] }));

        for (const tid in carsOf) {
            const n = carsOf[tid].length;
            buche('alle', n);
            buche('ohne', carsOf[tid].filter(e => !e.lokal).length);
            if (n <= deckel) continue;
            inc('ueberImErgebnis');
            carsOf[tid].slice(deckel).forEach(e => incMap('quellen', e.gast ? 'Grid-Fueller' : e.kind));
            const fall = {
                sim: simNr, jahr, rennen: race.name || race.circuitId, team: tName[tid] || tid,
                vorDeckel: letzterDeckel ? (letzterDeckel.vorher[tid] || 0) : null,
                nachDeckel: letzterDeckel ? (letzterDeckel.nachher[tid] || 0) : null,
                fahrer: carsOf[tid],
            };
            eimerListe.forEach(e => e.faelle.push(fall));
        }

        if (letzterDeckel) {
            for (const tid in letzterDeckel.vorher) if (letzterDeckel.vorher[tid] > letzterDeckel.deckel) inc('ueberVorDeckel');
            for (const tid in letzterDeckel.nachher) if (letzterDeckel.nachher[tid] > letzterDeckel.deckel) inc('ueberNachDeckel');
        }

        try { ctx.applyRaceResults(result); } catch (e) { /* die Meldung steht bereits fest */ }
    }
    inc('sims');
    return true;
}

// ── Kennzahlen ──────────────────────────────────────────────────────────────
const pcv = (a, b) => b ? (a / b * 100) : 0;
const pcs = (a, b, w = 5) => (b ? (a / b * 100).toFixed(1) : '  -').padStart(w);
const f2 = (v, w = 4) => (v == null ? '   -' : v.toFixed(2)).padStart(w);
const dlt = (g, r, w = 6, nk = 2) => (r == null ? '     -' : ((g - r >= 0 ? '+' : '') + (g - r).toFixed(nk)).padStart(w));

// Reale Kennzahlen ueber eine Jahresliste. sicht = 'alle' | 'ohne'
// (die realen Eintraege sind Paare [alle, ohneLokal]; 0 = nur Lokalmatadoren,
// dieser Konstrukteur existiert in der gefilterten Sicht nicht).
function realKennzahl(jahre, sicht = 'alle') {
    const idx = sicht === 'ohne' ? 1 : 0;
    const sizes = [];
    jahre.forEach(y => (REAL[y] || []).forEach(p => { if (p[idx]) sizes.push(p[idx]); }));
    if (!sizes.length) return null;
    return {
        n: sizes.length,
        avg: sizes.reduce((s, v) => s + v, 0) / sizes.length,
        ein: pcv(sizes.filter(v => v === 1).length, sizes.length),
        ueber2: pcv(sizes.filter(v => v > 2).length, sizes.length),
        max: Math.max(...sizes),
    };
}
function spielKennzahl(e, sicht = 'alle') {
    const S = e[sicht];
    if (!S || !S.teamsGesamt) return null;
    let ueber2 = 0;
    for (const k in S.verteilung) if (Number(k) > 2) ueber2 += S.verteilung[k];
    return {
        n: S.teamsGesamt,
        avg: S.wagenSumme / S.teamsGesamt,
        ein: pcv(S.verteilung[1] || 0, S.teamsGesamt),
        ueber2: pcv(ueber2, S.teamsGesamt),
        max: S.max,
    };
}

// ══════════════════════════════════════════════════════════════════════════
// BETRIEBSART 2: MASKE ueber die Jahrfuenfte
// ══════════════════════════════════════════════════════════════════════════
if (MASKE) {
    // Gruppen an den Jahrzehnten ausgerichtet (1950-54, 1955-59, ...), damit die
    // Grenzen der Deckel-Staffelung mit den Gruppengrenzen zusammenfallen.
    const gruppen = [];
    for (let a = Math.floor(VON / 5) * 5; a <= BIS; a += 5) {
        const jahre = [];
        for (let y = Math.max(a, VON); y <= Math.min(a + 4, BIS); y++) jahre.push(y);
        if (jahre.length) gruppen.push({ von: a, bis: a + 4, jahre });
    }

    console.log(`\n${'='.repeat(96)}`);
    console.log(`  WAGEN JE KONSTRUKTEUR — Maske ueber ${gruppen.length} Jahrfuenfte, ${SIMS} Sims je Gruppe`);
    console.log(`  Sims gleichmaessig auf die Jahre der Gruppe verteilt. Referenz: F1DB, Indy raus.`);
    console.log(`${'='.repeat(96)}\n`);

    const proGruppe = [], proJahr = {};
    for (const g of gruppen) {
        const eimer = neuerEimer();
        const jahrEimer = {};
        g.jahre.forEach(y => jahrEimer[y] = neuerEimer());
        let ok = 0;
        process.stdout.write(`  ${g.von}-${String(g.bis).slice(2)} `);
        for (let s = 0; s < SIMS; s++) {
            const jahr = g.jahre[s % g.jahre.length];   // Round Robin ueber die Jahre
            // Gruppen- UND Jahres-Eimer in EINEM Durchlauf: die feine Aufloesung
            // kostet keine zusaetzliche Simulation.
            if (simuliereSaison(jahr, [eimer, jahrEimer[jahr]], s + 1)) ok++;
            if (s % Math.max(1, Math.floor(SIMS / 10)) === 0) process.stdout.write('.');
        }
        console.log(` ${ok}/${SIMS}`);
        proGruppe.push({ g, eimer, ok });
        g.jahre.forEach(y => proJahr[y] = jahrEimer[y]);
    }

    // Zwei Tabellen mit identischem Aufbau: einmal alle Meldungen, einmal ohne die
    // Lokalmatadoren. Sie stehen NEBENEINANDER statt einander zu ersetzen — welche
    // Sicht die richtige ist, haengt an der Frage, und beide sind hier wohlfeil.
    const tabelle = (sicht, titel) => {
        console.log(`\nJE JAHRFUENFT — ${titel}`);
        console.log(`Zeitraum  │ Deckel │   Ø Wagen je Team    │   Anteil > 2 Wagen    │   Anteil 1 Wagen      │ Max      │ Verletz.`);
        console.log(`          │        │ Spiel   real      Δ │ Spiel   real       Δ  │ Spiel   real       Δ  │ Spiel/re │ [B] / [C]`);
        console.log('─'.repeat(104));
        for (const { g, eimer } of proGruppe) {
            const S = spielKennzahl(eimer, sicht), R = realKennzahl(g.jahre, sicht);
            const d1 = ctx._maxCarsPerConstructor(g.von), d2 = ctx._maxCarsPerConstructor(g.bis);
            const dTxt = (d1 === d2 ? String(d1) : `${d1}/${d2}`).padStart(5);
            if (!S) { console.log(`${g.von}-${String(g.bis).slice(2)}   │ ${dTxt}  │ keine verwertbare Simulation`); continue; }
            console.log(
                `${g.von}-${String(g.bis).slice(2)}   │ ${dTxt}  │ ` +
                `${f2(S.avg, 5)}  ${f2(R && R.avg, 5)} ${dlt(S.avg, R && R.avg)} │ ` +
                `${pcs(S.ueber2, 100, 5)}%  ${R ? pcs(R.ueber2, 100, 5) : '    -'}% ${dlt(S.ueber2, R && R.ueber2, 7, 1)} │ ` +
                `${pcs(S.ein, 100, 5)}%  ${R ? pcs(R.ein, 100, 5) : '    -'}% ${dlt(S.ein, R && R.ein, 7, 1)} │ ` +
                `${String(S.max).padStart(3)}/${String(R ? R.max : '-').padStart(3)}  │ ` +
                `${String(eimer.ueberNachDeckel).padStart(3)} / ${String(eimer.ueberImErgebnis).padStart(3)}`
            );
        }
    };
    tabelle('alle', 'ALLE MELDUNGEN (Indy raus)');
    tabelle('ohne', 'OHNE LOKALMATADOREN (real: HOME_ONLY_ENTRIES · Spiel: d.homeOnly)');

    if (JAHRE) {
        console.log(`\nJE JAHR — Ø Wagen je Team, beide Sichten (wenige Sims je Jahr, entsprechend verrauscht)`);
        console.log(`Jahr │   alle Meldungen     │  ohne Lokalmatadoren │ Sims │ Rennen`);
        console.log(`     │ Spiel   real      Δ │ Spiel   real      Δ  │      │`);
        console.log('─'.repeat(104));
        Object.keys(proJahr).map(Number).sort((a, b) => a - b).forEach(y => {
            const A = spielKennzahl(proJahr[y], 'alle'), RA = realKennzahl([y], 'alle');
            const O = spielKennzahl(proJahr[y], 'ohne'), RO = realKennzahl([y], 'ohne');
            if (!A) return;
            console.log(`${y} │ ${f2(A.avg, 5)}  ${f2(RA && RA.avg, 5)} ${dlt(A.avg, RA && RA.avg)} │ ` +
                `${f2(O && O.avg, 5)}  ${f2(RO && RO.avg, 5)} ${O ? dlt(O.avg, RO && RO.avg) : '     -'} │ ` +
                `${String(proJahr[y].sims).padStart(4)} │ ${String(proJahr[y].rennen).padStart(6)}`);
        });
    }

    // Verletzungen: der urspruengliche Zweck des Skripts, ueber alle Gruppen.
    const vB = proGruppe.reduce((s, x) => s + x.eimer.ueberNachDeckel, 0);
    const vC = proGruppe.reduce((s, x) => s + x.eimer.ueberImErgebnis, 0);
    const teams = proGruppe.reduce((s, x) => s + x.eimer.alle.teamsGesamt, 0);
    const gaeste = proGruppe.reduce((s, x) => s + x.eimer.gaeste, 0);
    const lokale = proGruppe.reduce((s, x) => s + x.eimer.lokale, 0);
    console.log(`\nDECKEL-PRUEFUNG ueber alle Gruppen: [B] ${vB} · [C] ${vC} von ${teams} Team-Meldungen` +
                ` (${pcs(vC, teams, 1).trim()} %) · Grid-Fueller-Eintraege ${gaeste}`);
    console.log(`Lokalmatadoren im Spiel: ${lokale} Startereintraege · kuratierte Liste real: ${LOKAL.size} Fahrer`);
    if (vC) {
        const q = {};
        proGruppe.forEach(x => { for (const k in x.eimer.quellen) q[k] = (q[k] || 0) + x.eimer.quellen[k]; });
        console.log(`Sorte des ueberzaehligen Eintrags: ` + Object.entries(q).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
        const alle = proGruppe.flatMap(x => x.eimer.faelle);
        (ALLE ? alle : alle.slice(0, 15)).forEach(f => {
            console.log(`  ${f.jahr} ${String(f.rennen).slice(0, 26).padEnd(26)} ${f.team} — Deckel ${f.vorDeckel}->${f.nachDeckel}, Ergebnis ${f.fahrer.length}` +
                `  [${f.fahrer.map(e => e.name + (e.gast ? '*' : '')).join(', ')}]`);
        });
        if (!ALLE && alle.length > 15) console.log(`  ... ${alle.length - 15} weitere mit --alle`);
    }

    console.log(`\nLESART`);
    console.log(`  Δ bei „> 2 Wagen" ist der eigentliche Realismus-Wert: er sagt, wie oft ein`);
    console.log(`  Konstrukteur mehr als das Stammduo meldet. [B] > 0 = der Deckel rechnet falsch,`);
    console.log(`  [B] = 0 bei [C] > 0 = der Wagen kommt NACH dem Deckel dazu (Grid-Fueller = *).`);
    console.log(`  Der Deckel ist nach DEKADEN gestaffelt, die Wirklichkeit nicht — ein sichtbarer`);
    console.log(`  Bruch zwischen zwei Jahrfuenften derselben Dekade zeigt genau diese Kerbe.`);
    process.exit(0);
}

// ══════════════════════════════════════════════════════════════════════════
// BETRIEBSART 1: EINZELJAHR
// ══════════════════════════════════════════════════════════════════════════
const eimer = neuerEimer();
for (let s = 0; s < SIMS; s++) {
    process.stdout.write(`  Sim ${s + 1}/${SIMS}... `);
    console.log(simuliereSaison(YEAR, eimer, s + 1) ? 'fertig' : 'FEHLGESCHLAGEN');
}

const S = spielKennzahl(eimer, 'alle'), R = realKennzahl([YEAR], 'alle');
const SO = spielKennzahl(eimer, 'ohne'), RO = realKennzahl([YEAR], 'ohne');
console.log(`\n${'='.repeat(78)}`);
console.log(`  WAGEN JE KONSTRUKTEUR — ${YEAR}, ${eimer.sims} Sims, ${eimer.rennen} Rennen`);
console.log(`${'='.repeat(78)}`);
console.log(`Deckel laut _maxCarsPerConstructor: ${ctx._maxCarsPerConstructor(YEAR)}\n`);

console.log(`[A] Teams ueber Deckel VOR  applyConstructorCarCap : ${eimer.ueberVorDeckel}`);
console.log(`[B] Teams ueber Deckel NACH applyConstructorCarCap : ${eimer.ueberNachDeckel}   <- muss 0 sein`);
console.log(`[C] Teams ueber Deckel in der ERGEBNISLISTE        : ${eimer.ueberImErgebnis}  (${pcs(eimer.ueberImErgebnis, eimer.alle.teamsGesamt, 1).trim()} % aller ${eimer.alle.teamsGesamt} Team-Meldungen)\n`);

const kennzahlBlock = (titel, s, r) => {
    if (!s) return;
    console.log(`${titel}`);
    console.log(`Kennzahl                  │  Spiel │   real │      Δ`);
    console.log('─'.repeat(56));
    console.log(`Ø Wagen je Team u. Rennen │  ${f2(s.avg, 5)} │  ${f2(r && r.avg, 5)} │ ${dlt(s.avg, r && r.avg)}`);
    console.log(`Anteil > 2 Wagen          │ ${pcs(s.ueber2, 100)} % │ ${r ? pcs(r.ueber2, 100) : '    -'} % │ ${dlt(s.ueber2, r && r.ueber2, 6, 1)}`);
    console.log(`Anteil genau 1 Wagen      │ ${pcs(s.ein, 100)} % │ ${r ? pcs(r.ein, 100) : '    -'} % │ ${dlt(s.ein, r && r.ein, 6, 1)}`);
    console.log(`Maximum                   │  ${String(s.max).padStart(5)} │  ${String(r ? r.max : '-').padStart(5)} │`);
    if (!r) console.log(`(keine F1DB-Referenz fuer ${YEAR} — Vergleichsspalten leer)`);
    console.log('');
};
kennzahlBlock('ALLE MELDUNGEN (Indy raus)', S, R);
kennzahlBlock('OHNE LOKALMATADOREN (real: HOME_ONLY_ENTRIES · Spiel: d.homeOnly)', SO, RO);

console.log('Verteilung Wagen je Team und Rennen (alle Meldungen):');
const rAlle = (REAL[YEAR] || []).map(p => p[0]);
Object.keys(eimer.alle.verteilung).map(Number).sort((a, b) => a - b).forEach(n => {
    const r = rAlle.filter(v => v === n).length;
    console.log(`  ${n} Wagen: ${String(eimer.alle.verteilung[n]).padStart(6)}  ${pcs(eimer.alle.verteilung[n], eimer.alle.teamsGesamt)} %   real ${rAlle.length ? pcs(r, rAlle.length) + ' %' : '   -'}`);
});
console.log(`\nGrid-Fueller-Eintraege insgesamt: ${eimer.gaeste} · Lokalmatadoren-Starts: ${eimer.lokale}`);

if (eimer.ueberImErgebnis) {
    console.log('\nSorte des ueberzaehligen Eintrags:');
    Object.entries(eimer.quellen).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k.padEnd(14)} ${String(v).padStart(5)}`));
    console.log('\nFAELLE' + (ALLE ? '' : ' (erste 15 — alle mit --alle)'));
    console.log('-'.repeat(78));
    (ALLE ? eimer.faelle : eimer.faelle.slice(0, 15)).forEach(f => {
        console.log(`Sim ${f.sim} | ${String(f.rennen).slice(0, 30).padEnd(30)} | ${f.team}`);
        console.log(`   Deckel-Wrapper: vorher ${f.vorDeckel} -> nachher ${f.nachDeckel} | Ergebnis ${f.fahrer.length}`);
        f.fahrer.forEach(e => console.log(`   - ${e.name.padEnd(24)} ${e.kind}${e.gast ? ' (Grid-Fueller)' : ''}`));
    });
    if (!ALLE && eimer.faelle.length > 15) console.log(`... ${eimer.faelle.length - 15} weitere mit --alle`);
} else {
    console.log('\nKeine Verletzung — der Deckel haelt bis in die Ergebnisliste.');
}

console.log(`\nLESART: [B] > 0 = der Deckel selbst rechnet falsch. [B] = 0 und [C] > 0 =`);
console.log(`der dritte Wagen kommt NACH dem Deckel dazu (Grid-Fueller, Gastzug, Kaderwechsel).`);
console.log(`Fuer die ganze Zeitachse: --maske (Jahrfuenfte gegen F1DB).`);
