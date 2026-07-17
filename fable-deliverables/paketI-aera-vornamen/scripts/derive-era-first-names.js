#!/usr/bin/env node
// Paket I — D2/D3: baut ../era-first-names.js (Bauform B: Gauß-Kurven je Name).
//
// Pipeline je Nation:
//   1. Beobachtungen sammeln: share(name, geburtsjahr)
//      - USA/FRA: echte Counts 1900–2020/22 (cohorts-*.json)
//      - GBR: Zipf-Synthese aus Top-100-Rängen 1904–1994 + echte Counts 1996–2020
//      - GER: Zipf-Synthese aus Dekaden-Rängen 1900er–2010er (kein Register)
//      - ITA: Zipf-Synthese aus kuratierten Dekaden-Rängen 1900–1990 + ISTAT 1999+
//   2. Zipf: share(rank) ∝ rank^(-s(t)); s(t) ära-abhängig aus zipf-fit.json
//      (Kalibrierbasis = Ø USA/FRA je Bucket; Nation-Multiplikator aus deren
//      eigenem modernen Fit, GER neutral 1.0). Masse-Normierung: Σ Top-N =
//      empirische Top-N-Coverage der Kalibriernationen im selben Bucket.
//   3. Gauß-Fit je Name (Grid-Search, Amplitude closed-form);
//      2. Komponente nur bei ≥12 Beobachtungspunkten, R²<0.85 und Gewinn ≥0.10.
//   4. Budget: Union der Top-M je 5J-Kohorte 1915–2020, M so, dass
//      |Union| ≈ Budget der Nation (heutige Poolgröße).
//   5. Emission: { Name: [peak, sigma, amp] } bzw. 6-Tupel; amp in Basispunkten
//      (1e-4) des Kohorten-Anteils, peak/sigma ganzzahlig.
//
// Aufruf: node derive-era-first-names.js   → schreibt ../era-first-names.js
//         + ../data/fit-report.json (Fit-Güte, Top-5-Proben, eff-Größen)
//         + ../data/immigrant-cohort-share.json (Anteil Einwanderungsnamen je Kohorte)

const fs = require('fs');
const path = require('path');
const DATA = path.join(__dirname, '..', 'data');

const BUDGET = { GER: 530, GBR: 590, USA: 590, FRA: 550, ITA: 590 };
const SEL_FROM = 1915, SEL_TO = 2020;   // Auswahl-Kohorten (Debüt ~1950 → Geburt ~1917)

// ── Einwanderungs-/Diaspora-Namen (fürs Regionen-Paket gemeldet, NICHT gefiltert) ──
const IMMIGRANT = {
    GER: /^(Mehmet|Ali|Mustafa|Ahmet|Mohammed|Mohamed|Muhammed|Abdul|Hasan|Hüseyin|Murat|Emre|Cem|Deniz|Kaan|Mert|Efe|Yusuf|Emir|Hamza|Malik|Miran|Ilyas|Elyas|José|Antonio|Giovanni|Vladimir|Andrzej|Ivan|Aleksander|Milos|Dragan|Goran)$/,
    GBR: /^(Muhammad|Mohammed|Mohammad|Ahmed|Ali|Ibrahim|Yusuf|Hasan|Hassan|Omar|Hamza|Zain|Aryan|Arjun|Dev|Rohan|Krishan|Imran|Kamran|Tariq|Abdullah|Bilal|Usman|Adnan|Rayyan|Ayaan|Musa|Isa|Zayn)$/,
    FRA: /^(Mohamed|Mohammed|Mehdi|Karim|Rachid|Yanis|Rayan|Bilal|Ibrahim|Sofiane|Nabil|Amine|Ayoub|Imran|Ismaël|Moussa|Mamadou|Abdoulaye|Ousmane|Ahmed|Ali|Omar|Hamza|Adam|Wassim|Walid|Farid|Khaled|Samir|Djibril|Aboubacar|Youssef|Yassine|Ilyes|Naïm|Nolan)$/,
    USA: /^$/,   // Schmelztiegel: Hispanic-Namen sind US-Kernbestand, keine Meldung
    ITA: /^(Adam|Rayan|Youssef|Amir|Omar|Ali|Mohamed|Ahmed|Karim|Sami|Ryan|Kevin|Brian|Denis|Manuel(?!e)|Christian|Cristian)$/
};
// Anm.: FRA "Adam"/"Nolan" und ITA "Christian/Kevin" sind Grenzfälle (assimilierte
// Moden) — gemeldet wird der Anteil, entschieden wird im Regionen-Paket.

// ── Laden ────────────────────────────────────────────────────────────────
const loadJson = f => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const cohorts = {};
for (const n of ['USA', 'FRA', 'GBR', 'ITA']) cohorts[n] = loadJson(`cohorts-${n}.json`);
const gerRanks = loadJson('ger-decade-ranks.json');
const itaRanks = loadJson('ita-decade-ranks.json');
const gbrRankCsv = fs.readFileSync(path.join(DATA, 'gbr-rankings-1904-1994.csv'), 'utf8');
const zipfFit = loadJson('zipf-fit.json');

// ── Rang → Anteil: EMPIRISCHE Kurve statt parametrischem Zipf ───────────
// Der parametrische Fit (zipf-calibrate.js) belegt die s-Drift, überschätzt aber
// den KOPF: FRA hat einen historischen Ausreißer-Kopf (Jean 1930 = 12 % real),
// der den Ø-Exponenten steil zieht — auf GER/GBR/ITA angewandt entstünden
// 25–50 %-Spitzennamen (real ~7–12 %). Ein in die Vergangenheit extrapolierter
// Modern-Multiplikator (ITA 1,5×) verschärft das. Deshalb: share(rang, t) =
// Ø über USA+FRA der BEOBACHTETEN Anteile an Position rang im nächstliegenden
// Bucket — nicht-parametrisch, Kopf/Coverage stimmen per Konstruktion.
const sortedShareCache = {};
function sortedShares(nat, i) {
    const key = nat + i;
    if (sortedShareCache[key]) return sortedShareCache[key];
    const d = cohorts[nat];
    return sortedShareCache[key] = Object.values(d.names)
        .map(a => a[i] / d.totals[i]).filter(x => x > 0).sort((a, b) => b - a);
}
function rankShares(names, t) {
    const per = [];
    for (const nat of ['USA', 'FRA']) {
        const d = cohorts[nat];
        const i = d.bucketStarts.reduce((b, s, j) => Math.abs(s - t) < Math.abs(d.bucketStarts[b] - t) ? j : b, 0);
        if (d.totals[i]) per.push(sortedShares(nat, i));
    }
    const out = {};
    names.forEach((n, r) => {
        let sum = 0, cnt = 0;
        for (const v of per) { if (v[r] != null) { sum += v[r]; cnt++; } }
        out[n] = cnt ? sum / cnt : 0;
    });
    return out;
}

// ── Beobachtungen je Nation: { name: Map(t -> share) }, Zeitpunkte tPoints ──
function realObs(nat, obs, tPoints, fromYear, toYear) {
    const d = cohorts[nat];
    for (let i = 0; i < d.bucketStarts.length; i++) {
        const t = d.bucketStarts[i] + 2;
        if (d.bucketStarts[i] < fromYear || d.bucketStarts[i] > toYear || !d.totals[i]) continue;
        tPoints.add(t);
        for (const n in d.names) {
            const sh = d.names[n][i] / d.totals[i];
            if (sh <= 0) continue;
            (obs[n] = obs[n] || new Map()).set(t, sh);
        }
    }
}
function rankObs(lists, obs, tPoints) {
    // lists: { decade -> [namen absteigend] }, t = Dekade+5
    for (const dec in lists) {
        if (dec.startsWith('_')) continue;
        const t = +dec + 5;
        tPoints.add(t);
        const sh = rankShares(lists[dec], t);
        for (const n in sh) (obs[n] = obs[n] || new Map()).set(t, sh[n]);
    }
}

function buildObservations(nat) {
    const obs = {}, tPoints = new Set();

    if (nat === 'USA' || nat === 'FRA') realObs(nat, obs, tPoints, 1900, 2022);
    if (nat === 'GBR') {
        // Ränge 1904–1994 (dekadisch, Top-100 männlich)
        const byYear = {};
        for (const line of gbrRankCsv.split('\n').slice(1)) {
            const [name, year, rank, sex] = line.split(',');
            if (sex !== 'M' || !name) continue;
            (byYear[year] = byYear[year] || [])[+rank - 1] = name;
        }
        for (const y in byYear) {
            const t = +y; tPoints.add(t);
            const sh = rankShares(byYear[y].filter(Boolean), t);
            for (const n in sh) (obs[n] = obs[n] || new Map()).set(t, sh[n]);
        }
        realObs('GBR', obs, tPoints, 1995, 2022);
    }
    if (nat === 'GER') rankObs(gerRanks, obs, tPoints);
    if (nat === 'ITA') {
        rankObs(itaRanks, obs, tPoints);
        realObs('ITA', obs, tPoints, 1995, 2024);
    }
    return { obs, tPoints: [...tPoints].sort((a, b) => a - b) };
}

// ── Gauß-Fit (wie analyze-turnover.js, + Gewichte) ───────────────────────
function fitGauss(t, y, w, peaks, sigmas) {
    let best = null;
    for (const p of peaks) for (const s of sigmas) {
        let sg = 0, syg = 0;
        const g = t.map(tt => Math.exp(-(((tt - p) / s) ** 2) / 2));
        for (let i = 0; i < t.length; i++) { sg += w[i] * g[i] * g[i]; syg += w[i] * y[i] * g[i]; }
        const a = sg ? Math.max(0, syg / sg) : 0;
        let sse = 0;
        for (let i = 0; i < t.length; i++) { const e = y[i] - a * g[i]; sse += w[i] * e * e; }
        if (!best || sse < best.sse) best = { p, s, a, sse };
    }
    return best;
}

function fitName(tAll, series, isRankSource) {
    // series: Map(t->share); Abwesenheit = 0 (Gewicht 0.5 bei Rang-Quellen: Liste zu kurz ≠ Name weg)
    const t = tAll, y = tAll.map(tt => series.get(tt) || 0);
    const w = tAll.map(tt => series.has(tt) ? 1 : (isRankSource(tt) ? 0.5 : 1));
    const nObs = [...series.keys()].length;
    const peaks = []; for (let p = t[0] - 40; p <= t[t.length - 1] + 40; p += 2) peaks.push(p);
    const sigmas = [4, 5, 6, 8, 10, 13, 16, 20, 25, 32, 40, 55, 75];
    if (nObs <= 2) {
        const tt = [...series.keys()], amp = Math.max(...series.values());
        return { comps: [[tt[Math.floor(tt.length / 2)], 8, amp]], r2: 1 };
    }
    const mean = y.reduce((a, b) => a + b, 0) / y.length;
    const sst = y.reduce((a, b) => a + (b - mean) ** 2, 0);
    const f1 = fitGauss(t, y, w, peaks, sigmas);
    const r2_1 = sst ? 1 - f1.sse / sst : 1;
    let comps = [[f1.p, f1.s, f1.a]], r2 = r2_1;
    if (nObs >= 12 && r2_1 < 0.85) {
        const resid = y.map((v, i) => v - f1.a * Math.exp(-(((t[i] - f1.p) / f1.s) ** 2) / 2));
        const f2 = fitGauss(t, resid, w, peaks, sigmas);
        const r2_2 = sst ? 1 - f2.sse / sst : 1;
        if (r2_2 - r2_1 >= 0.10 && f2.a > 0.1 * f1.a) { comps.push([f2.p, f2.s, f2.a]); r2 = r2_2; }
    }
    return { comps, r2 };
}

const evalComps = (comps, by) => comps.reduce((s, [p, sg, a]) => s + a * Math.exp(-(((by - p) / sg) ** 2) / 2), 0);

// ── Hauptlauf ────────────────────────────────────────────────────────────
const OUT = {}, report = {}, immigrantReport = {};
for (const nat of ['GBR', 'GER', 'ITA', 'FRA', 'USA']) {
    const { obs, tPoints } = buildObservations(nat);
    const isRankSource = t =>
        (nat === 'GER') || (nat === 'GBR' && t < 1995) || (nat === 'ITA' && t < 1997);

    // Fit für alle Namen mit relevanter Masse
    const fits = {};
    for (const n in obs) {
        const mass = [...obs[n].values()].reduce((a, b) => a + b, 0);
        if (mass < 0.0002) continue;               // reine Einzel-Kleinstwerte raus
        fits[n] = { ...fitName(tPoints, obs[n], isRankSource), mass };
    }

    // Budget: Top-M je Auswahl-Kohorte (aus den KURVEN, alle 5 Jahre), M → Budget
    const selYears = []; for (let yy = SEL_FROM; yy <= SEL_TO; yy += 5) selYears.push(yy);
    const pickUnion = M => {
        const u = new Set();
        for (const yy of selYears) {
            Object.keys(fits)
                .map(n => [n, evalComps(fits[n].comps, yy)])
                .filter(([, v]) => v > 1e-5)
                .sort((a, b) => b[1] - a[1]).slice(0, M)
                .forEach(([n]) => u.add(n));
        }
        return u;
    };
    let lo = 20, hi = 400, chosen = null;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1, u = pickUnion(mid);
        if (u.size < BUDGET[nat]) lo = mid + 1; else { chosen = { M: mid, u }; hi = mid - 1; }
    }
    if (!chosen) chosen = { M: 400, u: pickUnion(400) };

    // Emission (Amplitude in Basispunkten, min 1; Kompaktheit: runde peak/sigma)
    const entry = {};
    for (const n of [...chosen.u].sort((a, b) => fits[b].mass - fits[a].mass)) {
        const c = fits[n].comps.map(([p, s, a]) => [Math.round(p), Math.max(3, Math.round(s)), Math.max(1, Math.round(a * 10000))]);
        entry[n] = c.length === 1 ? c[0] : [...c[0], ...c[1]];
    }
    OUT[nat] = entry;

    // Report: Fit-Güte (massegew.), Top-5-Proben, eff je Probejahr
    const kept = [...chosen.u];
    let r2w = 0, mTot = 0, twoComp = 0;
    for (const n of kept) { r2w += fits[n].r2 * fits[n].mass; mTot += fits[n].mass; if (fits[n].comps.length > 1) twoComp++; }
    const probe = {};
    for (const yy of [1930, 1955, 1980, 2005]) {
        const ws = kept.map(n => [n, evalComps(fits[n].comps, yy)]).filter(([, v]) => v > 1e-5);
        const tot = ws.reduce((a, [, v]) => a + v, 0);
        const eff = 1 / ws.reduce((a, [, v]) => a + (v / tot) ** 2, 0);
        probe[yy] = {
            eff: +eff.toFixed(0), aktiveNamen: ws.length,
            top5: ws.sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, v]) => `${n} ${(100 * v / tot).toFixed(1)}%`)
        };
    }
    report[nat] = { poolGroesse: kept.length, M: chosen.M, r2wMasse: +(r2w / mTot).toFixed(3), zweiKomponenten: twoComp, probe };

    // Einwanderungsnamen-Anteil je Kohorte (aus Beobachtungen, im gehaltenen Pool)
    const imm = {};
    for (const t of tPoints) {
        let sImm = 0, sAll = 0;
        for (const n in obs) {
            const v = obs[n].get(t) || 0; sAll += v;
            if (IMMIGRANT[nat].test(n)) sImm += v;
        }
        if (sAll > 0) imm[t] = +(100 * sImm / sAll).toFixed(2);
    }
    immigrantReport[nat] = { prozentJeKohorte: imm, imPool: Object.keys(entry).filter(n => IMMIGRANT[nat].test(n)) };

    console.log(`${nat}: Pool ${kept.length} (M=${chosen.M}, Budget ${BUDGET[nat]}), R²w ${report[nat].r2wMasse}, 2-Komp: ${twoComp}`);
    for (const yy of [1930, 1955, 1980, 2005]) console.log(`  ${yy}: eff ${probe[yy].eff} | ${probe[yy].top5.join(', ')}`);
}

// ── Dateien schreiben ────────────────────────────────────────────────────
const clampMap = { GER: [1905, 2015], GBR: [1904, 2020], USA: [1902, 2020], FRA: [1902, 2022], ITA: [1905, 2022] };
let js = `// Paket I — Ära-Vornamen (Bauform B: Gauß-Kurven je Name), GENERIERT von
// fable-deliverables/paketI-aera-vornamen/scripts/derive-era-first-names.js
// — NICHT von Hand editieren, Regeneration siehe scripts/README dort.
//
// Format je Name: [peak, sigma, amp]  oder  [p1,s1,a1, p2,s2,a2] (Revival-Namen).
//   peak  = Geburtsjahr des Popularitäts-Gipfels
//   sigma = Breite (Jahre); amp = Anteil am Jahrgang in Basispunkten (1e-4) am Gipfel
// Gewicht zur Laufzeit (Pseudocode, Opus gießt das in pickPooledName):
//   birthYear = (Fahrer-Geburtsjahr bekannt) ? birthYear : pickYear - 24;
//   by = clamp(birthYear, ERA_FIRST_CLAMP[nat][0], ERA_FIRST_CLAMP[nat][1]);
//   w(name) = Σ_k  a_k * exp( -0.5 * ((by - p_k) / s_k)^2 )        // 1 od. 2 Terme
//   → weightedPick über alle Namen der Nation (w < 1 Basispunkt-Äquivalent ok).
// Die Kurven ersetzen die first-Fenster NUR für Region 0 dieser 5 Nationen;
// Diaspora-Regionen (GBR r1, FRA r1) behalten ihre kuratierten Listen.
// Tabellenbasis ist die NATIONALE Statistik → Einwanderungsnamen sind ENTHALTEN
// (Anteil je Kohorte: data/immigrant-cohort-share.json; Routing → Paket J).
//
const ERA_FIRST_CLAMP = ${JSON.stringify(clampMap)};
const ERA_FIRST_NAMES = {\n`;
for (const nat of ['GBR', 'GER', 'ITA', 'FRA', 'USA']) {
    js += `  ${nat}: {\n`;
    const es = Object.entries(OUT[nat]);
    for (let i = 0; i < es.length; i++)
        js += `    ${JSON.stringify(es[i][0])}: [${es[i][1].join(',')}]${i < es.length - 1 ? ',' : ''}\n`;
    js += `  },\n`;
}
js += `};\n`;
fs.writeFileSync(path.join(__dirname, '..', 'era-first-names.js'), js);
fs.writeFileSync(path.join(DATA, 'fit-report.json'), JSON.stringify(report, null, 1));
fs.writeFileSync(path.join(DATA, 'immigrant-cohort-share.json'), JSON.stringify(immigrantReport, null, 1));
const kb = (fs.statSync(path.join(__dirname, '..', 'era-first-names.js')).size / 1024).toFixed(0);
console.log(`\n-> era-first-names.js (${kb} KB), data/fit-report.json, data/immigrant-cohort-share.json`);
