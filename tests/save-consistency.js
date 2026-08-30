// save-consistency.js — HALTEN DIE NEUEN UI-ANSICHTEN, WAS SIE BEHAUPTEN?
//
// Die beiden Ansichten aus v0.9.17.6 zeigen Dinge, die vorher unsichtbar waren:
//   1. Qualifying mit Startfeld-Grenze — wer ist qualifiziert, wer nicht?
//   2. Rennergebnis-Matrix nach Wikipedia-Art — jedes Team einer Saison in eigener Zeile.
// Beides ist nur so gut wie die Daten dahinter. Nutzer: „ob qualifiziert und
// startaufstellung zueinander passen und ob die behauptung fahrer fuhr bei zwei teams
// rennen für rennen nachweisbar ist."
//
// Dieses Skript liest einen NDJSON-Export und prueft genau das — ohne Simulation, es
// beurteilt den gespeicherten Stand selbst.
//
//   node tests/save-consistency.js "C:/Users/.../F1RPG_2026_R0.json"
'use strict';
const fs = require('fs');

const PFAD = process.argv[2];
if (!PFAD) { console.log('Aufruf: node tests/save-consistency.js <export.json>'); process.exit(1); }

const saisons = [];
for (const zeile of fs.readFileSync(PFAD, 'utf8').split(/\r?\n/)) {
    if (!zeile.trim()) continue;
    let o; try { o = JSON.parse(zeile); } catch (e) { continue; }
    if (o.d && o.d.year) saisons.push(o.d);
}
console.log(`\nSPIELSTAND-PRUEFUNG  |  ${saisons.length} Saisons  |  ${PFAD.split(/[\\/]/).pop()}\n`);

const pct = (a, b) => b ? (100 * a / b).toFixed(1) + ' %' : '–';

// ══ 1. QUALIFYING ↔ STARTAUFSTELLUNG ═══════════════════════════════════════════
// Erwartung an einen gesunden Stand:
//   - jeder Starter hat eine Qualifying-Zeit
//   - kein als DNQ gefuehrter Fahrer taucht im Rennergebnis auf
//   - die Quali-Liste ist mindestens so lang wie das Starterfeld
let rennen = 0, ohneQuali = 0, starterOhneQualiZeile = 0, dnqGestartet = 0,
    qualiKuerzerAlsFeld = 0, dnqGesamt = 0, dnpqGesamt = 0, dnsGesamt = 0, starterGesamt = 0,
    stillVerschwunden = 0;
const beispiele = [], stillBsp = [];
for (const s of saisons) {
    const qualiJeRennen = {};
    for (const q of (s.qualifyingResults || [])) qualiJeRennen[q.ri ?? q.raceIndex] = q;
    for (const r of (s.results || [])) {
        rennen++;
        const idx = r.ri ?? r.raceIndex;
        const res = r.res || r.results || [];
        const starter = new Set(res.map(x => x.d || x.driver).filter(Boolean));
        starterGesamt += starter.size;
        const dnq = new Set(r.dnq || []); dnqGesamt += dnq.size;
        const dnpq = new Set(r.dnpq || []); dnpqGesamt += dnpq.size;
        // NICHT ANGETRETEN ist ein eigener Vermerk (v0.9.17.13) — dieses Skript kannte
        // ihn nicht und meldete jeden DNS als „still verschwunden": 305 Fehlalarme im
        // Spielstand des Nutzers, exakt die Zahl der DNS-Eintraege darin.
        const dns = new Set(r.dns || []); dnsGesamt += dns.size;
        const q = qualiJeRennen[idx];
        if (!q) { ohneQuali++; continue; }
        const qIds = new Set((q.res || q.results || []).map(x => x.d || x.driver).filter(Boolean));
        for (const id of starter) if (!qIds.has(id)) {
            starterOhneQualiZeile++;
            if (beispiele.length < 5) beispiele.push(`${s.year} Lauf ${idx + 1}: Starter ohne Quali-Zeile`);
        }
        for (const id of dnq) if (starter.has(id)) {
            dnqGestartet++;
            if (beispiele.length < 5) beispiele.push(`${s.year} Lauf ${idx + 1}: als DNQ gefuehrt, aber gestartet`);
        }
        if (qIds.size < starter.size) qualiKuerzerAlsFeld++;
        // UMGEKEHRTER FALL (Nutzer): qualifiziert, aber nicht gestartet — OHNE als DNQ
        // oder DNPQ vermerkt zu sein. Das ist die stille Luecke: der Fahrer verschwindet
        // zwischen Qualifying und Rennen, ohne dass irgendwo steht, warum.
        for (const id of qIds) {
            if (starter.has(id) || dnq.has(id) || dnpq.has(id) || dns.has(id)) continue;
            stillVerschwunden++;
            if (stillBsp.length < 6) {
                const nm = (s.drivers || []).find(d => d.id === id)?.name || id;
                stillBsp.push(`${s.year} Lauf ${idx + 1}: ${nm}`);
            }
        }
    }
}
console.log('1) QUALIFYING ↔ STARTAUFSTELLUNG');
console.log(`   Rennen gesamt: ${rennen} · Starter ${starterGesamt} · DNQ ${dnqGesamt} · DNS ${dnsGesamt} · DNPQ ${dnpqGesamt}`);
console.log(`   ${ohneQuali ? '⚠' : '✅'} Rennen ohne Qualifying-Datensatz:      ${ohneQuali} (${pct(ohneQuali, rennen)})`);
console.log(`   ${starterOhneQualiZeile ? '❌' : '✅'} Starter ohne Qualifying-Zeile:         ${starterOhneQualiZeile}`);
console.log(`   ${dnqGestartet ? '❌' : '✅'} Als DNQ gefuehrt, aber gestartet:      ${dnqGestartet}`);
console.log(`   ${qualiKuerzerAlsFeld ? '⚠' : '✅'} Quali kuerzer als das Starterfeld:     ${qualiKuerzerAlsFeld}`);
console.log(`   ${stillVerschwunden ? '⚠' : '✅'} Qualifiziert, aber ohne Vermerk weg:   ${stillVerschwunden}`);
if (stillBsp.length) stillBsp.forEach(b => console.log('      · ' + b));
if (beispiele.length) beispiele.forEach(b => console.log('      · ' + b));

// ══ 2. MEHRERE TEAMS JE FAHRER UND SAISON ══════════════════════════════════════
// Die Matrix behauptet „Fahrer X fuhr 1994 fuer Lotus UND Benetton". Das ist genau dann
// belegt, wenn sich die Rennen sauber aufteilen lassen. Geprueft wird:
//   - Ueberschneidung: dasselbe Rennen fuer zwei Teams (waere unmoeglich)
//   - Verzahnung: A B A B statt A A B B (ein Hin und Her ist unplausibel)
let mehrTeam = 0, ueberschneidung = 0, verzahnt = 0, sauberBlock = 0;
const verzahntBsp = [], blockBsp = [];
for (const s of saisons) {
    const proFahrer = {};
    for (const r of (s.results || [])) {
        const idx = r.ri ?? r.raceIndex;
        for (const e of (r.res || r.results || [])) {
            const id = e.d || e.driver; if (!id) continue;
            const team = e.team || e.tmn || e.teamName; if (!team) continue;
            (proFahrer[id] = proFahrer[id] || []).push({ idx, team });
        }
    }
    for (const [id, laeufe] of Object.entries(proFahrer)) {
        const teams = new Set(laeufe.map(x => x.team));
        if (teams.size < 2) continue;
        mehrTeam++;
        // Ueberschneidung: gleicher Lauf, zwei Teams
        const proLauf = {};
        for (const l of laeufe) (proLauf[l.idx] = proLauf[l.idx] || new Set()).add(l.team);
        if (Object.values(proLauf).some(t => t.size > 1)) ueberschneidung++;
        // Verzahnung: Teamwechsel-Zahl gegen Teamzahl
        const folge = laeufe.slice().sort((a, b) => a.idx - b.idx).map(x => x.team);
        let wechsel = 0;
        for (let i = 1; i < folge.length; i++) if (folge[i] !== folge[i - 1]) wechsel++;
        const name = (s.drivers || []).find(d => d.id === id)?.name || id;
        if (wechsel > teams.size - 1) {
            verzahnt++;
            if (verzahntBsp.length < 6) verzahntBsp.push(`${s.year} ${name}: ${folge.join(' → ')}`);
        } else {
            sauberBlock++;
            if (blockBsp.length < 3) blockBsp.push(`${s.year} ${name}: ${folge.join(' → ')}`);
        }
    }
}
console.log('\n2) MEHRERE TEAMS JE FAHRER UND SAISON');
console.log(`   Faelle gesamt: ${mehrTeam}`);
console.log(`   ${ueberschneidung ? '❌' : '✅'} Dasselbe Rennen fuer zwei Teams:       ${ueberschneidung}`);
console.log(`   ✅ Sauberer Wechsel (A…A B…B):          ${sauberBlock} (${pct(sauberBlock, mehrTeam)})`);
console.log(`   ${verzahnt ? '⚠' : '✅'} Hin und Her (A B A …):                 ${verzahnt} (${pct(verzahnt, mehrTeam)})`);
if (blockBsp.length) { console.log('\n   Beispiele sauberer Wechsel:'); blockBsp.forEach(b => console.log('      · ' + b)); }
if (verzahntBsp.length) { console.log('\n   Beispiele Hin und Her:'); verzahntBsp.forEach(b => console.log('      · ' + b)); }

// ══ 3. REALE REFERENZ AUS F1DB ═════════════════════════════════════════════════
// ⚠ OHNE DIESEN TEIL SIND DIE ZAHLEN OBEN WERTLOS. Beide gemessenen Groessen haben in
// der echten Formel 1 einen Sockel, der nicht null ist:
//   · Starter ohne Quali-Zeile gab es real staendig — geteilte Autos, Ersatzfahrer,
//     Starterlaubnis ohne Zeit. Wer hier 0 % erwartet, kalibriert gegen eine Fiktion.
//   · „Hin und Her" zwischen Teams war in den 1950ern normal (Mike Hawthorn 1956 real:
//     Maserati → BRM → Maserati → Vanwall → BRM).
// Deshalb wird beides aus F1DB nachgerechnet und danebengestellt.
(function referenz() {
    let Q, R;
    try {
        const vm = require('vm'), path = require('path');
        const box = {};
        vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'data', 'f1db.js'), 'utf8')
            + ';__q=F1DB_QUALIFYING;__r=F1DB_RESULTS;', box);
        Q = box.__q; R = box.__r;
    } catch (e) { console.log('\n(keine F1DB-Referenz verfuegbar)'); return; }
    if (!Q || !R) { console.log('\n(keine F1DB-Referenz verfuegbar)'); return; }

    let rStarter = 0, rOhneQ = 0, rMehr = 0, rVerz = 0, rBlock = 0;
    for (const y in R) {
        if (+y > 2025) continue;
        const proF = {};
        R[y].forEach((race, i) => {
            const q = Q[String(race[0])];
            const qIds = q ? new Set(q.map(e => e[1])) : null;
            for (const e of (race[2] || [])) {
                if (qIds) { rStarter++; if (!qIds.has(e[3])) rOhneQ++; }
                if (e[3] && e[4]) (proF[e[3]] = proF[e[3]] || []).push({ i: race[1] || i, t: e[4] });
            }
        });
        for (const l of Object.values(proF)) {
            const teams = new Set(l.map(x => x.t));
            if (teams.size < 2) continue;
            rMehr++;
            const folge = l.slice().sort((a, b) => a.i - b.i).map(x => x.t);
            let w = 0; for (let i = 1; i < folge.length; i++) if (folge[i] !== folge[i - 1]) w++;
            if (w > teams.size - 1) rVerz++; else rBlock++;
        }
    }
    console.log('\n3) GEGEN DIE WIRKLICHKEIT (F1DB 1950-2025)');
    console.log('                                     Spiel        real');
    console.log(`   Starter ohne Quali-Zeile      ${pct(starterOhneQualiZeile, starterGesamt).padStart(9)}   ${pct(rOhneQ, rStarter).padStart(9)}`);
    console.log(`   Teamwechsel „Hin und Her"     ${pct(verzahnt, mehrTeam).padStart(9)}   ${pct(rVerz, rMehr).padStart(9)}`);
    console.log(`   Multi-Team-Faelle gesamt      ${String(mehrTeam).padStart(9)}   ${String(rMehr).padStart(9)}`);
})();

// ══ 4. STARTFELDGROESSE JE RENNEN: SPIEL GEGEN F1DB ════════════════════════════
// Nutzer: „auch bei anderen rennen f1db vs. spielstand testen. natuerlich kann ein
// einzelner spielstand nichts aussagen wenn die gridzahl aus dynamischen gruenden
// abweicht, aber es gibt einige weitere fixe gridzahlen die vorgegeben sind."
// Verglichen wird deshalb je STRECKE UND JAHR — nur dort, wo beide Seiten dasselbe
// Rennen kennen. Ausgewiesen werden die groessten Abweichungen, nicht ein Mittelwert:
// ein Feld, das mal zu gross und mal zu klein ist, hebt sich im Schnitt sonst auf.
(function startfelder() {
    let races, erg;
    try {
        races = require('../f1db-json-splitted/f1db-races.json');
        erg = require('../f1db-json-splitted/f1db-races-race-results.json');
    } catch (e) { console.log('\n(F1DB-Rohdaten nicht verfuegbar)'); return; }
    // ⚠ MESSFALLE (selbst hineingetappt): 2020 fuhr die Formel 1 ZWEIMAL in Spielberg,
    // Silverstone und Bahrain. Ein Schluessel „jahr|circuitId" summiert beide Rennen und
    // meldet dann „Spiel 20 · real 40" — zwanzig fehlende Autos, die es nie gab.
    // Deshalb wird je Strecke und Jahr der DURCHSCHNITT eines Rennens gebildet.
    const realRoh = {};                        // "jahr|circuitId" → [Starter je Rennen]
    const raceMeta = {};
    for (const r of races) raceMeta[r.id] = r;
    // ⚠ ZWEITE MESSFALLE: `f1db-races-race-results.json` fuehrt auch NICHT-STARTER.
    // 1989 Imola hat 39 Eintraege — 12 klassiert, 12 DNF, 1 NC, 1 DSQ, aber auch
    // 4 DNQ und 9 DNPQ. Wer alles zaehlt, vergleicht Spiel-STARTER gegen F1DB-MELDER
    // und meldet 15 fehlende Autos, die nie am Start standen.
    const KEIN_START = new Set(['DNQ', 'DNPQ', 'DNS', 'WD', 'EX', 'NC*']);
    const proRennen = {};
    for (const e of erg) {
        const r = raceMeta[e.raceId]; if (!r) continue;
        if (KEIN_START.has(String(e.positionText || '').toUpperCase())) continue;
        proRennen[e.raceId] = (proRennen[e.raceId] || 0) + 1;
    }
    for (const [rid, n] of Object.entries(proRennen)) {
        const r = raceMeta[rid]; if (!r) continue;
        (realRoh[r.year + '|' + r.circuitId] = realRoh[r.year + '|' + r.circuitId] || []).push(n);
    }
    const realZahl = {};
    for (const [k, arr] of Object.entries(realRoh)) {
        realZahl[k] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    }
    const abw = [];
    let verglichen = 0, summeAbw = 0;
    for (const s of saisons) {
        const kal = s.races || [];
        (s.results || []).forEach((r, i) => {
            const idx = r.ri ?? r.raceIndex ?? i;
            const cid = kal[idx]?.circuitId; if (!cid) return;
            const k = s.year + '|' + cid;
            if (realZahl[k] == null) return;
            const spiel = (r.res || r.results || []).length;
            const real = realZahl[k];
            verglichen++; summeAbw += Math.abs(spiel - real);
            abw.push({ jahr: s.year, cid, spiel, real, d: spiel - real });
        });
    }
    if (!verglichen) { console.log('\n(keine gemeinsamen Rennen fuer den Vergleich)'); return; }
    abw.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
    const zuKlein = abw.filter(x => x.d <= -6).length;
    const zuGross = abw.filter(x => x.d >= 6).length;
    console.log('\n4) STARTFELDGROESSE JE RENNEN (Spiel gegen F1DB, gleiche Strecke + Jahr)');
    console.log(`   verglichene Rennen: ${verglichen} · mittlere Abweichung ${(summeAbw / verglichen).toFixed(1)} Autos`);
    console.log(`   mehr als 5 zu wenig: ${zuKlein} (${pct(zuKlein, verglichen)}) · mehr als 5 zu viel: ${zuGross} (${pct(zuGross, verglichen)})`);
    console.log('   groesste Abweichungen:');
    abw.slice(0, 10).forEach(x => console.log(
        `      ${x.jahr} ${String(x.cid).padEnd(20)} Spiel ${String(x.spiel).padStart(2)} · real ${String(x.real).padStart(2)} · ${x.d > 0 ? '+' : ''}${x.d}`));
    // Strecken mit systematischer Schieflage (mind. 5 gemeinsame Rennen)
    const jeStrecke = {};
    for (const x of abw) {
        (jeStrecke[x.cid] = jeStrecke[x.cid] || []).push(x.d);
    }
    const systematisch = Object.entries(jeStrecke)
        .filter(([, ds]) => ds.length >= 5)
        .map(([cid, ds]) => ({ cid, n: ds.length, mittel: ds.reduce((a, b) => a + b, 0) / ds.length }))
        .filter(x => Math.abs(x.mittel) >= 3)
        .sort((a, b) => Math.abs(b.mittel) - Math.abs(a.mittel));
    if (systematisch.length) {
        console.log('   systematisch daneben (>= 5 Rennen, Mittel >= 3 Autos):');
        systematisch.slice(0, 8).forEach(x => console.log(
            `      ${String(x.cid).padEnd(20)} ${x.n} Rennen · im Mittel ${x.mittel > 0 ? '+' : ''}${x.mittel.toFixed(1)}`));
    } else {
        console.log('   ✅ keine Strecke systematisch daneben.');
    }
})();

console.log('');
if (dnqGestartet || ueberschneidung) {
    console.log(`❌ ${dnqGestartet + ueberschneidung} harte Widersprueche (DNQ gestartet / ein Rennen fuer zwei Teams).`);
} else {
    console.log('✅ Keine harten Widersprueche: kein DNQ-Fahrer startet, kein Rennen zaehlt fuer zwei Teams.');
    console.log('   Die weichen Zahlen bitte immer gegen die Referenz in Abschnitt 3 lesen.');
}
