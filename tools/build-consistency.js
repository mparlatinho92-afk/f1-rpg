// build-consistency.js — Konstanz aus F1DB, Plan A Schritt 1 (23.11.2026)
//
// DEFINITION (Nutzer 22./23.11.2026): Konstanz K = Anteil der Rennen OHNE Ausreißer, in Prozent.
// K 95 = 5 % Ausreißer, K 66 = 34 %. Ausreißer = eigener Fehler-Ausfall ODER Einbruch im Ziel.
// Die Realität ist das Vorbild, auch wenn sie langweilig ist (Verstappen 2023, Mercedes 2014–16, McLaren 1988).
//
// AUSREISSER JE RENNEN
//   • Fehler-Ausfall (Gewicht 1): Accident, Spun off, Spin, Accident damage, Fatal accident/collision, Stalled,
//     Accident on formation lap, Push start, Illegal start, Ignored red light, Caused collision.
//   • Kollision (Gewicht 0,5): Collision, Collision damage — Täter oder Opfer ist aus F1DB nicht zu trennen.
//   • Nicht gezählt: Technik, Reifen, „Illegal …“ am Auto (Team); Physical/Injury/Unwell/Illness/Withdrew
//     (Gesundheit, keine Konstanz); alles „… in practice/qualifying/warm-up“ (nicht gestartet).
//   • Einbruch (Gewicht 0–1, gleitend): im Ziel schlechter gegen die Teamkollegen als üblich; SCHWELLE Plätze = 0,5,
//     SCHWELLE ± RAMPE = 0 bzw. 1 (Nutzer 24.11.2026: einzelne Rennen wenig Gewicht, großer Verlust mehr).
//
// TEAMKOLLEGEN (Nutzer 23.11.2026)
//   • Team = Rennstall + Konstrukteur je Lauf (seasons-entrants-drivers.rounds) — Werks- und Privat-Cooper der
//     1960er sind keine Teamkollegen, obwohl race-results nur den Konstrukteur nennt.
//   • Jedes PAAR hat seinen eigenen Normalabstand = Mittel der mittleren Hälfte ihrer gemeinsamen Zielankünfte der
//     Saison (≥ MIN_PAAR; bis 24.11.2026 der Median, zu sprunghaft).
//     Je Rennen zählt der DURCHSCHNITT über alle Teamkollegen dieses Rennens (viele Kollegen in den 1960ern).
//   • Kollegen ohne gemeinsame Zielankunft bilden kein Paar. Ein Rennen ohne brauchbares Paar zählt nicht
//     (der Rückfall auf den eigenen Saison-Median war zu ungenau: 35 % der Rennen, Masten Gregory 1960 = 97).
//
// DÜNNE DATEN: Glättung Saison → Karriere → Feld, je mit GLAETTUNG Pseudo-Rennen:
//   K_Karriere = (n·K_roh + G·K_Feld)/(n + G), K_Saison = (n·K_roh + G·K_Karriere)/(n + G).
//
// ⚠ Die absolute Höhe hängt an SCHWELLE. Endgültig erst nach dem Abgleich mit dem Spiel (Plan A Schritt 3):
//   dieselbe Messung auf simulierte Rennen, bis Spiel-K = Eingabe-K.
//
// Aufruf: node tools/build-consistency.js [Schwelle=4]   → tests/output/konstanz-f1db.json + Bericht auf der Konsole
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const SCHWELLE = +(process.argv[2] || 4), MIN_PAAR = 3, GLAETTUNG = 10, RAMPE = 2;
const J = f => JSON.parse(fs.readFileSync(path.join(root, 'f1db-json-splitted', `f1db-${f}.json`), 'utf8'));
const res = J('races-race-results'), sed = J('seasons-entrants-drivers');

const FEHLER = /^(accident|spun off|spin|accident damage|fatal accident|fatal collision|stalled|accident on formation lap|push start|illegal start|ignored red light|caused collision)/i;
const NICHT_GESTARTET = /in (practice|qualifying|warm-up|support race)$/i;
const KOLLISION = /^collision( damage)?$/i;
const gewichtAusfall = g => !g || NICHT_GESTARTET.test(g) ? 0 : FEHLER.test(g) ? 1 : KOLLISION.test(g) ? 0.5 : 0;

const rennstall = {};
for (const e of sed) for (const rd of (e.rounds || [])) rennstall[`${e.year}|${rd}|${e.driverId}|${e.constructorId}`] = e.entrantId;
const team = e => (rennstall[`${e.year}|${e.round}|${e.driverId}|${e.constructorId}`] || '?') + '/' + e.constructorId;
// Normalabstand = Mittel der mittleren Hälfte (je Ende round(n/4) weg; n 3–4 = Median). Der reine Median sprang
// mit einem Rennen mehr um ganze Plätze (Piastri 2026: 86 → 75 durch Las Vegas).
const normal = a => { const b = [...a].sort((x, y) => x - y), w = Math.round(b.length / 4), m = b.slice(w, b.length - w);
    return m.reduce((x, y) => x + y, 0) / m.length; };
// Einbruch-Gewicht gleitend statt Kante: SCHWELLE − RAMPE → 0, SCHWELLE → 0,5, SCHWELLE + RAMPE → 1 (größerer Verlust zählt mehr)
const einbruchGewicht = x => Math.max(0, Math.min(1, (x - SCHWELLE + RAMPE) / (2 * RAMPE)));

const proRennen = {};
for (const e of res) { if (['DNQ', 'DNPQ', 'DNS', 'EX'].includes(e.positionText)) continue; (proRennen[e.raceId] ??= []).push(e); }
const rennen = Object.values(proRennen);

// 1. Normalabstand je Paar und Saison
const paarAbst = {};
for (const es of rennen) for (const a of es) {
    if (a.positionNumber == null) continue;
    for (const b of es) if (a !== b && b.positionNumber != null && team(a) === team(b))
        (paarAbst[`${a.year}|${a.driverId}|${b.driverId}`] ??= []).push(a.positionNumber - b.positionNumber);
}
const paarMed = {};
for (const [k, v] of Object.entries(paarAbst)) if (v.length >= MIN_PAAR) paarMed[k] = normal(v);

// 2. Ausreißer je Rennen
const st = {};   // slug|jahr → { n, fehler, koll, einbruch, ohnePaar, techn }
// ⚠ Gleiche Zählbasis für Ausfälle und Zielankünfte: ein Rennen zählt, wenn ein Teamkollege GESTARTET ist.
//   1. Fassung zählte Fehler-Ausfälle immer, Zielankünfte nur mit Kollegen im Ziel → Ausfälle übergewichtet
//   (1970–89: 23 % der Rennen). 2. Fassung verlangte für Ausfälle einen Paar-Median → de Cesaris 1987 = 0 Rennen.
//   Ist ein Einbruch nicht messbar (kein Paar-Median oder Kollege nicht im Ziel), zählt die Feld-Einbruchquote als
//   Erwartungswert — „normal" anzunehmen hob 1950–69 auf 41 % ≥ 90.
const offen = [];   // nicht messbare Zielankünfte → Erwartungswert nach Durchlauf
let messN = 0, messE = 0;
for (const es of rennen) for (const a of es) {
    const s = st[`${a.driverId}|${a.year}`] ??= { n: 0, fehler: 0, koll: 0, einbruch: 0, ohnePaar: 0, techn: 0, erwartet: 0 };
    const partner = es.filter(b => a !== b && team(a) === team(b));
    if (a.positionNumber == null) {
        const g = gewichtAusfall(a.reasonRetired);
        if (!g) { s.techn++; continue; }
        if (!partner.length) { s.ohnePaar++; continue; }
        s.n++; if (g === 1) s.fehler++; else s.koll++;
        continue;
    }
    if (!partner.length) { s.ohnePaar++; continue; }
    s.n++;
    const d = partner.filter(b => b.positionNumber != null && paarMed[`${a.year}|${a.driverId}|${b.driverId}`] != null)
        .map(b => a.positionNumber - b.positionNumber - paarMed[`${a.year}|${a.driverId}|${b.driverId}`]);
    if (!d.length) { offen.push(s); continue; }
    messN++; const e = einbruchGewicht(d.reduce((x, y) => x + y, 0) / d.length); s.einbruch += e; messE += e;
}
const feldEinbruch = messE / messN;
for (const s of offen) s.erwartet += feldEinbruch;
const aus = s => s.fehler + 0.5 * s.koll + s.einbruch + s.erwartet;

// 3. Glättung Saison → Karriere → Feld
let fN = 0, fA = 0; const kar = {};
for (const [k, s] of Object.entries(st)) { fN += s.n; fA += aus(s); const c = kar[k.split('|')[0]] ??= { n: 0, a: 0 }; c.n += s.n; c.a += aus(s); }
const kFeld = 1 - fA / fN;
const kKar = slug => { const c = kar[slug]; return c.n ? (c.n * (1 - c.a / c.n) + GLAETTUNG * kFeld) / (c.n + GLAETTUNG) : kFeld; };
const out = {};
for (const [k, s] of Object.entries(st)) {
    const [slug, jahr] = k.split('|');
    const roh = s.n ? 1 - aus(s) / s.n : null;
    const K = ((s.n ? s.n * roh : 0) + GLAETTUNG * kKar(slug)) / (s.n + GLAETTUNG);
    (out[slug] ??= {})[jahr] = { K: Math.round(100 * K), roh: roh == null ? null : Math.round(100 * roh), n: s.n,
        fehler: s.fehler, koll: s.koll, einbruch: Math.round(10 * s.einbruch) / 10, ohnePaar: s.ohnePaar, karriere: Math.round(100 * kKar(slug)) };
}
fs.mkdirSync(path.join(root, 'tests', 'output'), { recursive: true });
fs.writeFileSync(path.join(root, 'tests', 'output', 'konstanz-f1db.json'),
    JSON.stringify({ schwelle: SCHWELLE, rampe: RAMPE, norm: 'mittelhaelfte', minPaar: MIN_PAAR, glaettung: GLAETTUNG, feld: Math.round(1000 * kFeld) / 10, fahrer: out }));

// ── Bericht ────────────────────────────────────────────────────────────────
const PR = require('vm').runInNewContext(fs.readFileSync(path.join(root, 'data', 'f1db.js'), 'utf8') + ';PACE_RATINGS', { window: {} });
const zeilen = [];
for (const [slug, jj] of Object.entries(out)) for (const [jahr, v] of Object.entries(jj)) {
    const alt = PR[slug]?.[jahr]?.[2]; zeilen.push({ slug, jahr: +jahr, ...v, alt: alt > 0 ? alt : null });
}
const p = (a, q) => a[Math.floor(q * (a.length - 1))];
const vert = a => { const b = a.sort((x, y) => x - y); return `P5 ${p(b, .05)} · P25 ${p(b, .25)} · P50 ${p(b, .5)} · P75 ${p(b, .75)} · P95 ${p(b, .95)} · ≥ 90: ${(100 * b.filter(x => x >= 90).length / b.length).toFixed(0)} %`; };
console.log(`KONSTANZ AUS F1DB — Schwelle ${SCHWELLE} Plätze, Paar ab ${MIN_PAAR} gemeinsamen Zielankünften, Glättung ${GLAETTUNG}`);
console.log(`Einbruchquote messbarer Zielankünfte ${(100 * feldEinbruch).toFixed(1)} % (n ${messN}), nicht messbar ${offen.length} → Erwartungswert`);
console.log(`Feld-Mittel ${(100 * kFeld).toFixed(1)} · Fahrer-Saisons ${zeilen.length} (davon ${zeilen.filter(z => z.n >= 8).length} mit ≥ 8 gezählten Rennen)`);
const mitAlt = zeilen.filter(z => z.alt != null);
console.log(`neu (alle mit altem Wert, n ${mitAlt.length}): ${vert(mitAlt.map(z => z.K))}`);
console.log(`alt PACE_RATINGS[2]:              ${vert(mitAlt.map(z => z.alt))}`);
const kor = (x, y) => { const mx = x.reduce((a, b) => a + b) / x.length, my = y.reduce((a, b) => a + b) / y.length;
    let sxy = 0, sxx = 0, syy = 0; x.forEach((v, i) => { sxy += (v - mx) * (y[i] - my); sxx += (v - mx) ** 2; syy += (y[i] - my) ** 2; }); return sxy / Math.sqrt(sxx * syy); };
console.log(`Korrelation alt ↔ neu: ${kor(mitAlt.map(z => z.alt), mitAlt.map(z => z.K)).toFixed(2)}`);
for (const [a, b] of [[1950, 1969], [1970, 1989], [1990, 2009], [2010, 2025]]) {
    const z = zeilen.filter(x => x.jahr >= a && x.jahr <= b && x.n >= 5);
    const ausfallAnteil = z.reduce((s, x) => s + x.fehler + 0.5 * x.koll, 0) / z.reduce((s, x) => s + x.n, 0);
    console.log(`  ${a}–${b}: n ${String(z.length).padStart(4)} · ${vert(z.map(x => x.K))} · Ausreißer davon Fehler-Ausfall ${(100 * ausfallAnteil).toFixed(1)} % der Rennen`);
}
const PROBE = ['max-verstappen|2023', 'lewis-hamilton|2015', 'nico-rosberg|2015', 'ayrton-senna|1988', 'alain-prost|1988',
    'jackie-stewart|1969', 'jackie-stewart|1970', 'jim-clark|1965', 'michael-schumacher|2004', 'andrea-de-cesaris|1985',
    'andrea-de-cesaris|1987', 'romain-grosjean|2012', 'pastor-maldonado|2012', 'lando-norris|2024', 'oscar-piastri|2025',
    'sergio-perez|2023', 'gilles-villeneuve|1981', 'nigel-mansell|1992', 'kimi-raikkonen|2007', 'masten-gregory|1960'];
console.log('\nPROBEN                       neu   roh  Karr.  alt   Rennen  Fehler Koll. Einbr. ohnePaar');
for (const k of PROBE) {
    const [s, j] = k.split('|'); const v = out[s]?.[j]; if (!v) { console.log('  ' + k.padEnd(26) + ' —'); continue; }
    const alt = PR[s]?.[j]?.[2];
    console.log(`  ${k.padEnd(26)} ${String(v.K).padStart(3)}  ${String(v.roh ?? '–').padStart(4)}  ${String(v.karriere).padStart(4)}  ${String(alt > 0 ? alt : '–').padStart(4)}   ${String(v.n).padStart(4)}   ${String(v.fehler).padStart(4)}  ${String(v.koll).padStart(4)}  ${String(v.einbruch).padStart(4)}   ${String(v.ohnePaar).padStart(4)}`);
}
const karListe = Object.entries(kar).filter(([, c]) => c.n >= 60).map(([s]) => [s, Math.round(100 * kKar(s))]).sort((a, b) => a[1] - b[1]);
console.log('\nKARRIERE (≥ 60 gezählte Rennen) — unten: ' + karListe.slice(0, 8).map(x => x.join(' ')).join(', '));
console.log('                                 oben: ' + karListe.slice(-8).reverse().map(x => x.join(' ')).join(', '));

// ── Spieldatei (Plan A, wörtliche Konstanz) ─────────────────────────────────
// --spiel s dreh min max: K_wörtlich = dreh + s·(K_F1DB − dreh), begrenzt auf min..max (Nutzer: keine
// Hyper-Konstanz). Die F1DB-Messung gegen den Teamkollegen staucht (beide schwächeln → hebt sich auf; der eigene
// Median schluckt Einbrüche) — die Umrechnung holt die wahre Häufigkeit zurück. s/dreh aus tests/konstanz-abgleich.js.
const iSpiel = process.argv.indexOf('--spiel');
if (iSpiel > 0) {
    // optional 5. Wert: eigene Steigung unterhalb des Drehpunkts (sUnten), Vorgabe = s
    const [s, dreh, kmin, kmax, sU] = process.argv.slice(iSpiel + 1, iSpiel + 6).map(Number);
    const sUnten = Number.isFinite(sU) ? sU : s;
    const w = k => Math.round(Math.max(kmin, Math.min(kmax, dreh + (k < dreh ? sUnten : s) * (k - dreh))));
    const fahrer = {};
    for (const [slug, jj] of Object.entries(out)) {
        const e = fahrer[slug] = { k: w(kKar(slug) * 100) };
        for (const [jahr, v] of Object.entries(jj)) if (v.n > 0) e[jahr] = w(v.K);
    }
    const kopf = `// data/konstanz.js — GENERIERT von tools/build-consistency.js --spiel ${s} ${dreh} ${kmin} ${kmax} ${sUnten}, nicht von Hand ändern.\n`
        + `// Wörtliche Konstanz (Plan A, Nutzer 23.11.2026): K = % der Rennen ohne schlechten Tag. { slug: { k: Karriere, Jahr: K } }.\n`
        + `// Wirkt nur mit KONSTANZ_MODELL.aktiv (konstanzFuer).\n`;
    // Median je Jahrzehnt (wörtlich, Saisons mit ≥ 5 gezählten Rennen) — für generierte Fahrer: moderne Felder sind
    // konstanter (2010–25 F1DB 83, 1970–89 75). Ohne das sank der Feld-Median nach dem Datenende von 81 auf 68–73.
    const aera = {};
    for (let d = 1950; d <= 2020; d += 10) {
        const v = zeilen.filter(z => z.jahr >= d && z.jahr < d + 10 && z.n >= 5).map(z => w(z.K)).sort((x, y) => x - y);
        if (v.length) aera[d] = v[v.length >> 1];
    }
    fs.writeFileSync(path.join(root, 'data', 'konstanz.js'), kopf + 'const REAL_KONSTANZ = ' + JSON.stringify({ feld: w(kFeld * 100), aera, fahrer }) + ';\n');
    console.log('Ära-Mediane (wörtlich): ' + JSON.stringify(aera));
    const alle = Object.values(fahrer).flatMap(e => Object.entries(e).filter(([k]) => k !== 'k').map(([, v]) => v)).sort((a, b) => a - b);
    console.log(`\ndata/konstanz.js: ${Object.keys(fahrer).length} Fahrer, ${alle.length} Fahrer-Saisons, Feld ${w(kFeld * 100)} · P5 ${p(alle, .05)} · P50 ${p(alle, .5)} · P95 ${p(alle, .95)} · an der Obergrenze ${alle.filter(x => x >= kmax).length}`);
}
