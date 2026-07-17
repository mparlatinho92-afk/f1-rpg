#!/usr/bin/env node
// Paket I — Schritt 1: Rohquellen → 5-Jahres-GEBURTSKOHORTEN (männlich), kompakt.
//
// Liest die Roh-Dateien (fetch-raw.sh), schreibt ../data/cohorts-{USA,FRA,GBR}.json:
//   { nation, source, bucketStarts:[1900,1905,…], totals:[…], names:{ "Name":[counts je Bucket] } }
// totals = ALLE männlichen Geburten der Quelle im Bucket (inkl. Rare-Aggregat) →
// share(name,bucket) = names[name][i] / totals[i] ist selbst-normalisierend,
// Teil-Buckets am Rand brauchen keine Sonderbehandlung.
//
// Behalten wird die UNION der Top-KEEP_TOP je Bucket (ein 1930-Riese, der heute weg
// ist, bleibt drin). GBR: nur England & Wales (Schottland/NI raus — ONS-Linie des
// Briefs; leichte Untererfassung schottischer Namen, bewusst).
//
// Aufruf: node build-cohorts.js [rawDir]   (Default ./raw)

const fs = require('fs');
const path = require('path');

const RAW = process.argv[2] || path.join(__dirname, 'raw');
const OUT = path.join(__dirname, '..', 'data');
const B0 = 1900, B1 = 2020, STEP = 5;           // Bucket-Starts 1900,1905,…,2020
const NB = Math.floor((B1 - B0) / STEP) + 1;
const KEEP_TOP = 400;                            // je Bucket → Union

const bucketOf = y => (y < B0 || y > B1 + STEP - 1) ? -1 : Math.min(Math.floor((y - B0) / STEP), NB - 1);

// Title-Case mit Bindestrich/Apostroph ("JEAN-PIERRE"→"Jean-Pierre", "D'ARCY"→"D'Arcy").
// Lokale-sicher für Akzente (É→é via toLowerCase mit Unicode).
function titleCase(s) {
    return s.toLowerCase().replace(/(^|[-'\s])(\p{L})/gu, (m, sep, c) => sep + c.toUpperCase());
}

function emit(nation, source, acc, totals) {
    // acc: Map name -> Int32Array(NB)
    const keep = new Set();
    for (let i = 0; i < NB; i++) {
        const col = [...acc.entries()].filter(([, a]) => a[i] > 0)
            .sort((x, y) => y[1][i] - x[1][i]).slice(0, KEEP_TOP);
        for (const [n] of col) keep.add(n);
    }
    const names = {};
    for (const n of [...keep].sort()) names[n] = [...acc.get(n)];
    const out = {
        nation, source,
        bucketStarts: Array.from({ length: NB }, (_, i) => B0 + i * STEP),
        totals: [...totals], names
    };
    const f = path.join(OUT, `cohorts-${nation}.json`);
    fs.writeFileSync(f, JSON.stringify(out));
    console.log(`${nation}: ${keep.size} Namen, ${NB} Buckets -> ${f} (${(fs.statSync(f).size / 1024).toFixed(0)} KB)`);
}

function addCount(acc, name, b, c) {
    let a = acc.get(name);
    if (!a) acc.set(name, a = new Int32Array(NB));
    a[b] += c;
}

// ── USA: SSA (Name,Sex,Count,Year), volle Counts ≥5 Träger ──────────────
function usa() {
    const acc = new Map(), totals = new Int32Array(NB);
    for (const line of fs.readFileSync(path.join(RAW, 'ssa-alldata.txt'), 'utf8').split('\n')) {
        if (!line) continue;
        const [name, sex, cnt, yr] = line.split(',');
        if (sex !== 'M') continue;
        const b = bucketOf(+yr); if (b < 0) continue;
        const c = +cnt;
        totals[b] += c;
        addCount(acc, name, b, c);
    }
    emit('USA', 'SSA via hackerb9/ssa-baby-names (1900-2020, maennlich, Counts >=5)', acc, totals);
}

// ── FRA: INSEE nat2022 (sexe;preusuel;annais;nombre) ────────────────────
function fra() {
    const acc = new Map(), totals = new Int32Array(NB);
    const txt = fs.readFileSync(path.join(RAW, 'insee', 'nat2022.csv'), 'utf8');
    for (const line of txt.split('\n')) {
        const p = line.split(';');
        if (p.length < 4 || p[0] !== '1') continue;   // 1 = männlich
        const b = bucketOf(+p[2]); if (b < 0) continue; // 'XXXX' → NaN → -1
        const c = +p[3];
        totals[b] += c;                                // _PRENOMS_RARES zählt in totals
        if (p[1] === '_PRENOMS_RARES') continue;
        addCount(acc, titleCase(p[1]), b, c);
    }
    emit('FRA', 'INSEE fichier des prenoms nat2022 (1900-2022, maennlich, inkl. _PRENOMS_RARES in totals)', acc, totals);
}

// ── GBR: ukbabynames.csv, nur England & Wales, 1996–2020 ────────────────
function gbr() {
    const acc = new Map(), totals = new Int32Array(NB);
    const txt = fs.readFileSync(path.join(RAW, 'ukbabynames.csv'), 'utf8');
    let first = true;
    for (const line of txt.split('\n')) {
        if (first) { first = false; continue; }
        if (!line) continue;
        // year,sex,name,n,rank,nation — name kann Kommata nicht enthalten (geprüft)
        const p = line.split(',');
        if (p[1] !== 'M' || p[5] !== 'England & Wales') continue;
        const b = bucketOf(+p[0]); if (b < 0) continue;
        const c = +p[3];
        totals[b] += c;
        addCount(acc, titleCase(p[2]), b, c);
    }
    emit('GBR', 'ONS England&Wales via ukbabynames (1996-2020, maennlich, Counts >=3)', acc, totals);
}

// ── ITA: ISTAT Contanomi-API, Top-300/Jahr 1999–2024 ────────────────────
// JSONP-Dateien cb({"years":[Y],"0":[{name,count,gender:"m",percent},…],"1":[w]})
// Jahres-Total rekonstruiert aus count/percent → totals = echte Männer-Geburten.
function ita() {
    const acc = new Map(), totals = new Float64Array(NB);
    const dir = path.join(RAW, 'istat');
    for (const f of fs.readdirSync(dir).filter(f => /^ita-\d{4}\.json$/.test(f))) {
        const txt = fs.readFileSync(path.join(dir, f), 'utf8');
        const j = JSON.parse(txt.slice(txt.indexOf('(') + 1, txt.lastIndexOf(')')));
        const males = j['0'].filter(e => e.gender === 'm');
        if (!males.length) continue;
        const year = males[0].year, b = bucketOf(year);
        if (b < 0) continue;
        const yearTotal = males[0].count / (males[0].percent / 100);
        totals[b] += yearTotal;
        for (const e of males) addCount(acc, titleCase(e.name), b, e.count);
    }
    const tInt = new Int32Array(NB); for (let i = 0; i < NB; i++) tInt[i] = Math.round(totals[i]);
    emit('ITA', 'ISTAT Contanomi nati-API (1999-2024, maennlich, Top-300/Jahr; totals aus count/percent rekonstruiert)', acc, tInt);
}

usa(); fra(); gbr(); ita();
