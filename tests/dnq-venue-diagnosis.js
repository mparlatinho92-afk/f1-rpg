// dnq-venue-diagnosis.js — DIAGNOSE fuer L3 (DNQ_MELDEPLAN.md Abschnitt 10)
//
// L1 ist gebaut und hat das NIVEAU getroffen (Befund A). Offen bleibt Befund B:
// die Meldezahl variiert im Spiel kaum ueber die Strecken, real stark
// (1952: Zandvoort 18 gegen Monza 35). Reale Streckenstreuung SD ~4,6 in den
// 50ern gegen ~1,9 im Spiel.
//
// WARUM DIESE DATEI VOR DEM BAU KOMMT: L3 gegen dieselbe F1DB-Meldezahl zu tunen
// waere zirkulaer (Bauplan Abschnitt 10). Deshalb wird hier NICHT die Zielgroesse
// nachgebaut, sondern ZERLEGT, welche STRUKTUR die reale Streuung erzeugt:
//   A) Stammfeld oder Schwanz? — Varianzzerlegung core/tail
//   B) Sind die Schwanz-Melder Lokalmatadoren? — Nationalitaet gegen Streckenland
//   C) Sind es feste Magnet-Strecken? — Abweichung je Strecke ueber Jahre gemittelt
// Erst daraus folgt der Mechanismus. Erfolgsmass bleibt SD, nicht Delta.
//
//   node tests/dnq-venue-diagnosis.js           → Teil A/B/C (reine Daten, schnell)
//   node tests/dnq-venue-diagnosis.js --game    → zusaetzlich Spiel-SD (laedt sim-core)
'use strict';
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'f1db-json-splitted');
const J = f => JSON.parse(fs.readFileSync(path.join(BASE, f), 'utf8'));

const races = J('f1db-races.json');
const sed = J('f1db-seasons-entrants-drivers.json');
const circuits = J('f1db-circuits.json');
const drivers = J('f1db-drivers.json');

const DEC = [1950, 1960, 1970, 1980];
const YEARS = []; for (let y = 1950; y <= 1989; y++) YEARS.push(y);

const circCountry = {};
for (const c of circuits) circCountry[c.id] = c.countryId;
const drvNat = {};
for (const d of drivers) drvNat[d.id] = d.nationalityCountryId;

// Kalender je Jahr, Indy raus (gleiche Filterregel wie build-presence.js)
const roundCircuit = {};                       // `${y}_${r}` -> circuitId | null
const calOf = {};                              // year -> [circuitId] in Rundenfolge
for (const r of races.slice().sort((a, b) => a.round - b.round)) {
    const indy = r.grandPrixId === 'indianapolis';
    const cid = indy ? null : String(r.circuitId || '').toLowerCase();
    roundCircuit[`${r.year}_${r.round}`] = cid;
    if (cid) (calOf[r.year] = calOf[r.year] || []).push(cid);
}

// year -> circuitId -> Set(driverId)   und   year -> driverId -> Anzahl Rennen
const entered = {}, drvRaces = {};
for (const e of sed) {
    if (e.testDriver) continue;
    for (const rd of (e.rounds || [])) {
        const cid = roundCircuit[`${e.year}_${rd}`];
        if (!cid) continue;
        ((entered[e.year] = entered[e.year] || {})[cid] =
            entered[e.year][cid] || new Set()).add(e.driverId);
    }
}
for (const y in entered) {
    const m = (drvRaces[y] = {});
    for (const cid in entered[y]) for (const d of entered[y][cid]) m[d] = (m[d] || 0) + 1;
}

const sd = a => {
    if (!a.length) return 0;
    const m = a.reduce((s, v) => s + v, 0) / a.length;
    return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length);
};
const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;

// ── Teil A: Varianzzerlegung Stammfeld / Schwanz ─────────────────────────────
// „Stammfeld" = Fahrer mit >= 60 % des Kalenders. Alles darunter ist der Schwanz:
// Gaststarter, Lokalmatadoren, Kurz-Cockpits. Wenn die Streuung im Schwanz sitzt,
// muss L3 den Schwanz umverteilen — nicht das Stammfeld antasten (das haelt L1).
const CORE_SHARE = 0.6;
console.log('\nTEIL A — Wo sitzt die reale Streuung? (SD ueber die Strecken einer Saison)');
console.log('Dekade │ Ø Meld │ SD gesamt │ SD Stamm │ SD Schwanz │ Ø Schwanz │ Ø Einmal-Melder');
console.log('─'.repeat(88));
const decRows = {};
for (const y of YEARS) {
    if (!entered[y] || !calOf[y]) continue;
    const cal = calOf[y], calLen = cal.length;
    const tot = [], core = [], tail = [], once = [];
    for (const cid of cal) {
        const set = entered[y][cid]; if (!set) continue;
        let c = 0, t = 0, o = 0;
        for (const d of set) {
            const n = drvRaces[y][d] || 0;
            if (n >= CORE_SHARE * calLen) c++; else { t++; if (n === 1) o++; }
        }
        tot.push(c + t); core.push(c); tail.push(t); once.push(o);
    }
    if (tot.length < 2) continue;
    const d = Math.floor(y / 10) * 10;
    const D = (decRows[d] = decRows[d] || { tot: [], sdT: [], sdC: [], sdX: [], tail: [], once: [] });
    D.tot.push(mean(tot)); D.sdT.push(sd(tot)); D.sdC.push(sd(core)); D.sdX.push(sd(tail));
    D.tail.push(mean(tail)); D.once.push(mean(once));
}
for (const d of DEC) {
    const D = decRows[d]; if (!D) continue;
    console.log(`${d}s  │ ${mean(D.tot).toFixed(1).padStart(6)} │ ${mean(D.sdT).toFixed(2).padStart(9)} │ ${mean(D.sdC).toFixed(2).padStart(8)} │ ${mean(D.sdX).toFixed(2).padStart(10)} │ ${mean(D.tail).toFixed(1).padStart(9)} │ ${mean(D.once).toFixed(1).padStart(15)}`);
}

// ── Teil B: Sind die Schwanz-Melder Lokalmatadoren? ──────────────────────────
// Wenn ja, ist der Mechanismus eine LAND-Gewichtung bei der Streckenwahl — genau
// das, was assignGenericHomeOnly heute nur fuer reine Heimrennen-Melder tut.
console.log('\nTEIL B — Herkunft der Schwanz-Melder (Nationalitaet = Streckenland?)');
console.log('Dekade │ Schwanz gesamt │ davon Landsleute │ Anteil │ Stammfeld-Anteil Landsleute');
console.log('─'.repeat(88));
const decB = {};
for (const y of YEARS) {
    if (!entered[y] || !calOf[y]) continue;
    const cal = calOf[y], calLen = cal.length;
    const d = Math.floor(y / 10) * 10;
    const B = (decB[d] = decB[d] || { t: 0, th: 0, c: 0, ch: 0 });
    for (const cid of cal) {
        const set = entered[y][cid]; if (!set) continue;
        const land = circCountry[cid];
        for (const dr of set) {
            const home = drvNat[dr] && land && drvNat[dr] === land;
            if ((drvRaces[y][dr] || 0) >= CORE_SHARE * calLen) { B.c++; if (home) B.ch++; }
            else { B.t++; if (home) B.th++; }
        }
    }
}
for (const d of DEC) {
    const B = decB[d]; if (!B) continue;
    console.log(`${d}s  │ ${String(B.t).padStart(14)} │ ${String(B.th).padStart(16)} │ ${(B.th / B.t * 100).toFixed(1).padStart(5)}% │ ${(B.ch / B.c * 100).toFixed(1).padStart(26)}%`);
}

// ── Teil C: Magnet-Strecken ──────────────────────────────────────────────────
// Abweichung vom Saison-Mittel, ueber die Jahre einer Dekade gemittelt. Wiederholt
// sich das Muster je Strecke, ist die Strecke selbst der Traeger (Prestige, Groesse,
// Anreise) — dann braucht L3 einen Streckenfaktor, keinen reinen Landsmann-Zug.
console.log('\nTEIL C — Magnet- und Auslass-Strecken (Ø Abweichung vom Saison-Mittel)');
for (const d of DEC) {
    const acc = {};
    for (let y = d; y < d + 10; y++) {
        if (!entered[y] || !calOf[y]) continue;
        const vals = calOf[y].map(cid => (entered[y][cid] || { size: 0 }).size);
        const m = mean(vals);
        calOf[y].forEach((cid, i) => {
            const A = (acc[cid] = acc[cid] || { s: 0, n: 0 });
            A.s += vals[i] - m; A.n++;
        });
    }
    const rows = Object.keys(acc).filter(c => acc[c].n >= 3)
        .map(c => ({ c, d: acc[c].s / acc[c].n, n: acc[c].n }))
        .sort((a, b) => b.d - a.d);
    const fmt = r => `${r.c}(${r.d >= 0 ? '+' : ''}${r.d.toFixed(1)}/${r.n}J)`;
    console.log(`\n${d}s  Magnete: ${rows.slice(0, 5).map(fmt).join('  ')}`);
    console.log(`      Auslass: ${rows.slice(-5).reverse().map(fmt).join('  ')}`);
}

// ── Teil B2: Zwei strukturelle Kandidaten fuer den Schwanz ───────────────────
// Teil C zeigt, dass die Magnete (Aintree/Silverstone/Nuerburgring/Monza) genau in
// den Laendern mit den groessten Privatier-Populationen liegen und die Auslass-
// Strecken ueberseeisch oder in kleinen Nationen. Hier wird beides getrennt
// gemessen, damit klar ist, welcher Zug wieviel traegt.
const EUROPE = new Set(['united-kingdom', 'italy', 'germany', 'east-germany', 'france', 'belgium',
    'netherlands', 'switzerland', 'spain', 'portugal', 'austria', 'sweden', 'monaco']);
console.log('\nTEIL B2 — Schwanz nach Streckenlage (Europa = Anreise billig)');
console.log('Dekade │ Europa: Ø Schwanz (lokal/fremd) │ Uebersee: Ø Schwanz (lokal/fremd)');
console.log('─'.repeat(88));
for (const d of DEC) {
    const acc = { eu: { n: 0, l: 0, f: 0 }, ov: { n: 0, l: 0, f: 0 } };
    for (let y = d; y < d + 10; y++) {
        if (!entered[y] || !calOf[y]) continue;
        const calLen = calOf[y].length;
        for (const cid of calOf[y]) {
            const set = entered[y][cid]; if (!set) continue;
            const land = circCountry[cid];
            const A = acc[EUROPE.has(land) ? 'eu' : 'ov'];
            A.n++;
            for (const dr of set) {
                if ((drvRaces[y][dr] || 0) >= CORE_SHARE * calLen) continue;
                if (drvNat[dr] && land && drvNat[dr] === land) A.l++; else A.f++;
            }
        }
    }
    const f = A => A.n ? `${((A.l + A.f) / A.n).toFixed(1)} (${(A.l / A.n).toFixed(1)}/${(A.f / A.n).toFixed(1)})` : '—';
    console.log(`${d}s  │ ${f(acc.eu).padStart(30)} │ ${f(acc.ov).padStart(32)}`);
}

// ── Teil D: Spiel-Seite (optional, laedt sim-core) ───────────────────────────
if (process.argv.includes('--game')) {
    const { getContext } = require('./sim-core');
    const ctx = getContext();
    const { expandSeasonData, privateerEntersRace, applyConstructorCarCap, isIndyOnlyConstructor,
            getGridSize } = ctx;
    // reale DNQ je Strecke = Melder − Starter (Startaufstellung, gleiche Filterregel)
    const startedAt = {};
    for (const g of J('f1db-races-starting-grid-positions.json')) {
        const cid = roundCircuit[`${g.year}_${g.round}`]; if (!cid) continue;
        ((startedAt[g.year] = startedAt[g.year] || {})[cid] =
            startedAt[g.year][cid] || new Set()).add(g.driverId);
    }
    const N = Number(process.env.N_RUNS || 60);

    function isIndyDriver(dr, teams) {
        if (dr.isIndyOnly) return true;
        const t = teams.find(x => x.id === dr.team);
        return !!t && (isIndyOnlyConstructor(t.id) || isIndyOnlyConstructor(t.histId));
    }
    // Ein Lauf = eine Saison; SD pro LAUF messen und dann mitteln. Ueber Laeufe zu
    // mitteln und erst danach die SD zu nehmen wuerde die Streuung wegmitteln —
    // genau der Fehler, den der Trockenlauf-Kontextblock noch macht.
    function gameSd(year) {
        const sds = [], tails = [], perCirc = {}, perDnq = {};
        for (let k = 0; k < N; k++) {
            const s = expandSeasonData(year); if (!s) return null;
            const cal = s.races.filter(r => !r.isIndy && r.circuitId);
            if (cal.length < 2) return null;
            const counts = [], tail = [];
            const nRaces = {};
            for (const race of cal) {
                let a = s.drivers.filter(x => (!x.status || x.status === 'active') && x.team);
                a = a.filter(x => !isIndyDriver(x, s.teams));
                a = a.filter(x => privateerEntersRace(x, race));
                a = applyConstructorCarCap(a, s.teams, year);
                counts.push(a.length);
                a.forEach(x => { nRaces[x.id] = (nRaces[x.id] || 0) + 1; });
                tail.push(a);
                const cid = race.circuitId.toLowerCase();
                (perCirc[cid] = perCirc[cid] || []).push(a.length);
                (perDnq[cid] = perDnq[cid] || []).push(Math.max(0, a.length - getGridSize(year, race)));
            }
            sds.push(sd(counts));
            tails.push(mean(tail.map(list => list.filter(x => (nRaces[x.id] || 0) < CORE_SHARE * cal.length).length)));
        }
        const avg = {}; for (const c in perCirc) avg[c] = mean(perCirc[c]);
        const dnq = {}; for (const c in perDnq) dnq[c] = mean(perDnq[c]);
        return { sd: mean(sds), tail: mean(tails), perCirc: avg, perDnq: dnq };
    }

    const _cache = {};                       // Teil D/E/F teilen sich die Laeufe
    const gameOf = y => (y in _cache ? _cache[y] : (_cache[y] = gameSd(y)));

    console.log(`\nTEIL D — Spiel gegen real (SD je Saison, Ø ${N} Laeufe/Jahr, Stand mit L1)`);
    console.log('Dekade │ Spiel-SD │ real-SD │ Luecke │ Spiel-Schwanz │ real-Schwanz');
    console.log('─'.repeat(78));
    const decD = {};
    for (const y of YEARS) {
        if (!entered[y] || !calOf[y]) continue;
        const g = gameOf(y); if (!g) continue;
        const cal = calOf[y], calLen = cal.length;
        const vals = [], tl = [];
        for (const cid of cal) {
            const set = entered[y][cid]; if (!set) continue;
            vals.push(set.size);
            tl.push([...set].filter(dr => (drvRaces[y][dr] || 0) < CORE_SHARE * calLen).length);
        }
        const d = Math.floor(y / 10) * 10;
        const D = (decD[d] = decD[d] || { g: [], r: [], gt: [], rt: [] });
        D.g.push(g.sd); D.r.push(sd(vals)); D.gt.push(g.tail); D.rt.push(mean(tl));
    }
    for (const d of DEC) {
        const D = decD[d]; if (!D) continue;
        console.log(`${d}s  │ ${mean(D.g).toFixed(2).padStart(8)} │ ${mean(D.r).toFixed(2).padStart(7)} │ ${(mean(D.r) - mean(D.g)).toFixed(2).padStart(6)} │ ${mean(D.gt).toFixed(1).padStart(13)} │ ${mean(D.rt).toFixed(1).padStart(12)}`);
    }

    // ── Teil E: SYSTEMATISCHE Streuung — landet sie auf denselben Strecken? ──
    // Teil D misst die Streuung EINER Saison, also Systematik + Zufall zusammen.
    // Das Spiel kann die richtige Groesse allein aus Zufall erzeugen und trotzdem
    // falsch sein: dann sind Monza und Zandvoort austauschbar. Deshalb hier die
    // ueber Jahre gemittelte Abweichung je Strecke (der Zufall mittelt sich weg)
    // plus die Korrelation der beiden Streckenprofile. DAS ist das Erfolgsmass
    // fuer L3 — nicht Delta (zirkulaer) und nicht die Gesamt-SD (schon erreicht).
    console.log(`\nTEIL E — Systematisches Streckenprofil (Ø Abweichung je Strecke ueber die Jahre)`);
    console.log('Dekade │ Strecken │ SD real │ SD Spiel │ Korrelation │ groesste Fehltreffer');
    console.log('─'.repeat(96));
    for (const d of DEC) {
        const acc = {};   // cid -> { r:[], g:[] } Abweichungen vom jeweiligen Saison-Mittel
        for (let y = d; y < d + 10; y++) {
            if (!entered[y] || !calOf[y]) continue;
            const g = gameOf(y); if (!g) continue;
            const cids = calOf[y].filter(c => entered[y][c] && g.perCirc[c] != null);
            if (cids.length < 2) continue;
            const rV = cids.map(c => entered[y][c].size), gV = cids.map(c => g.perCirc[c]);
            const rM = mean(rV), gM = mean(gV);
            cids.forEach((c, i) => {
                const A = (acc[c] = acc[c] || { r: [], g: [] });
                A.r.push(rV[i] - rM); A.g.push(gV[i] - gM);
            });
        }
        const rows = Object.keys(acc).filter(c => acc[c].r.length >= 3)
            .map(c => ({ c, r: mean(acc[c].r), g: mean(acc[c].g) }));
        if (rows.length < 3) continue;
        const rA = rows.map(x => x.r), gA = rows.map(x => x.g);
        const rM = mean(rA), gM = mean(gA);
        const cov = mean(rows.map(x => (x.r - rM) * (x.g - gM)));
        const corr = (sd(rA) && sd(gA)) ? cov / (sd(rA) * sd(gA)) : 0;
        const miss = rows.slice().sort((a, b) => Math.abs(b.r - b.g) - Math.abs(a.r - a.g)).slice(0, 4)
            .map(x => `${x.c}(real${x.r >= 0 ? '+' : ''}${x.r.toFixed(1)}/Spiel${x.g >= 0 ? '+' : ''}${x.g.toFixed(1)})`).join(' ');
        console.log(`${d}s  │ ${String(rows.length).padStart(8)} │ ${sd(rA).toFixed(2).padStart(7)} │ ${sd(gA).toFixed(2).padStart(8)} │ ${corr.toFixed(2).padStart(11)} │ ${miss}`);
    }

    // ── Teil F: DNQ-BALLUNG — das eigentliche Symptom aus Befund B ───────────
    // Bauplan Abschnitt 5: „Reale DNQ waren an wenigen Strecken geballt (Monza,
    // Nuerburgring, Monaco), im Spiel streuen sie gleichmaessig." Gemessen wird
    // deshalb nicht die DNQ-Menge (die haelt L1), sondern ihre VERTEILUNG:
    // Anteil der Saison-DNQ an den zwei staerksten Strecken und Anteil der
    // Rennen ganz ohne DNQ. Gleichverteilung → beides faellt auseinander.
    console.log(`\nTEIL F — DNQ-Ballung (Anteil an den Top-2-Strecken / Rennen ohne DNQ)`);
    console.log('Dekade │ real Top2 │ Spiel Top2 │ real ohne DNQ │ Spiel ohne DNQ │ Ø DNQ real │ Ø DNQ Spiel');
    console.log('─'.repeat(96));
    for (const d of DEC) {
        const A = { rt: [], gt: [], rz: [], gz: [], rm: [], gm: [] };
        for (let y = d; y < d + 10; y++) {
            if (!entered[y] || !calOf[y] || !startedAt[y]) continue;
            const g = gameOf(y); if (!g) continue;
            const cids = calOf[y].filter(c => entered[y][c] && g.perDnq[c] != null);
            if (cids.length < 3) continue;
            const rD = cids.map(c => Math.max(0, entered[y][c].size - ((startedAt[y][c] || { size: 0 }).size)));
            const gD = cids.map(c => g.perDnq[c]);
            const top2 = a => { const s = a.slice().sort((x, z) => z - x); const t = a.reduce((p, v) => p + v, 0); return t ? (s[0] + s[1]) / t : 0; };
            // Schwelle 0,5 statt 0: der Spielwert ist ein Mittel aus N Laeufen und
            // waere sonst fast nie exakt null.
            A.rt.push(top2(rD)); A.gt.push(top2(gD));
            A.rz.push(rD.filter(v => v < 0.5).length / rD.length);
            A.gz.push(gD.filter(v => v < 0.5).length / gD.length);
            A.rm.push(mean(rD)); A.gm.push(mean(gD));
        }
        if (!A.rt.length) continue;
        const p = a => (mean(a) * 100).toFixed(0) + '%';
        console.log(`${d}s  │ ${p(A.rt).padStart(9)} │ ${p(A.gt).padStart(10)} │ ${p(A.rz).padStart(13)} │ ${p(A.gz).padStart(14)} │ ${mean(A.rm).toFixed(1).padStart(10)} │ ${mean(A.gm).toFixed(1).padStart(11)}`);
    }

    // ── Teil G: Landsmann-Anteil im Schwanz, Spiel gegen real ───────────────
    // Teil A+B sagen: die Streuung sitzt im Schwanz, und ein Drittel des Schwanzes
    // sind Landsleute. Teil D sagt: das Spiel hat den Schwanz in der richtigen
    // GROESSE. Bleibt die Frage, ob es ihn auf die richtigen Strecken schickt —
    // _pickPrivateerRaces zieht die Rennen heute gleichverteilt (bzw. als Block),
    // ohne die Nation des Fahrers anzusehen. Liegt der Spielwert hier bei der
    // reinen Zufallserwartung, ist genau das der Rest-Fehler.
    // IOC-Code -> f1db-countryId. Das Spiel fuehrt IOC ("SUI", "GER", "NED"), f1db
    // schluesselt auf eigene Ids. Ueber alpha3Code gemappt fielen genau die grossen
    // Privatier-Nationen heraus (CHE/DEU/NLD != SUI/GER/NED) — die Landsmann-Quote
    // war dadurch zu niedrig. alpha3 nur als Rueckfall, iocCode hat Vorrang.
    const IOC2C = {};
    for (const c of J('f1db-countries.json')) if (c.iocCode) IOC2C[c.iocCode.toUpperCase()] = c.id;
    for (const c of J('f1db-countries.json')) {
        const a = c.alpha3Code && c.alpha3Code.toUpperCase();
        if (a && !IOC2C[a]) IOC2C[a] = c.id;
    }
    IOC2C.DDR = IOC2C.DDR || 'east-germany';       // Spiel nutzt DDR, f1db GDR/east-germany
    const ioc = v => {
        const s = String(v || '');
        return s.length === 3 ? s.toUpperCase() : (ctx.convertEmojiToIOC ? String(ctx.convertEmojiToIOC(s) || '').toUpperCase() : '');
    };
    console.log(`\nTEIL G — Landsleute im Schwanz (Nationalitaet = Streckenland)`);
    console.log('Dekade │ real Anteil │ Spiel Anteil │ Zufallserwartung Spiel');
    console.log('─'.repeat(72));
    for (const d of DEC) {
        let gt = 0, gh = 0, exp = 0, expN = 0;
        for (let y = d; y < d + 10; y++) {
            if (!entered[y]) continue;
            for (let k = 0; k < Math.max(10, N / 4); k++) {
                const s = expandSeasonData(y); if (!s) break;
                const cal = s.races.filter(r => !r.isIndy && r.circuitId);
                if (cal.length < 2) break;
                const lists = [], nRaces = {};
                for (const race of cal) {
                    let a = s.drivers.filter(x => (!x.status || x.status === 'active') && x.team);
                    a = a.filter(x => !isIndyDriver(x, s.teams));
                    a = a.filter(x => privateerEntersRace(x, race));
                    a = applyConstructorCarCap(a, s.teams, y);
                    a.forEach(x => { nRaces[x.id] = (nRaces[x.id] || 0) + 1; });
                    lists.push({ race, a });
                }
                for (const { race, a } of lists) {
                    const land = IOC2C[ioc(race.country)];
                    const tail = a.filter(x => (nRaces[x.id] || 0) < CORE_SHARE * cal.length);
                    gt += tail.length;
                    gh += tail.filter(x => land && IOC2C[ioc(x.nation)] === land).length;
                    // Zufallserwartung: Anteil dieser Nation am gesamten Schwanz-Kader
                    // der Saison — so viele Landsleute kaemen ohne jede Gewichtung.
                    const pool = s.drivers.filter(x => (nRaces[x.id] || 0) > 0 && (nRaces[x.id] || 0) < CORE_SHARE * cal.length);
                    if (pool.length && land) {
                        exp += tail.length * pool.filter(x => IOC2C[ioc(x.nation)] === land).length / pool.length;
                        expN += tail.length;
                    }
                }
            }
        }
        const B = decB[d]; if (!B || !gt) continue;
        console.log(`${d}s  │ ${(B.th / B.t * 100).toFixed(1).padStart(10)}% │ ${(gh / gt * 100).toFixed(1).padStart(11)}% │ ${(expN ? exp / expN * 100 : 0).toFixed(1).padStart(21)}%`);
    }
}
