#!/usr/bin/env node
/**
 * junior-elo.js — Elo der Nachwuchsserien (F2, F3, FRECA) und Umrechnung auf die F1-Skala (08.10.2026)
 *
 * Serien: F2, F3, FRECA + seit 09.10.2026 Euroformula Open (EFO), GB3, Eurocup-3 (EC3).
 * Mechanik wie tests/calculate-elo.js (unverändert übernommen, die F1-Elo selbst bleibt unberührt):
 * jeder Finisher duelliert sich mit jedem anderen Finisher, K = 16, Gewinn nach Erwartung — wer den
 * Besten schlägt, gewinnt viel. Ausfälle sind neutral (Wikipedia nennt nur „Ret", keine Ursache;
 * calculate-elo wertet unbekannte Ursachen ebenso neutral).
 *
 * Was die Daten entscheiden, nicht eine Annahme:
 *   1. Serienabstand (FRECA → F3 → F2): an Fahrern, die in Folgejahren in beiden Serien fuhren.
 *   2. Team-Anteil: F2/F3 sind Einheitsautos — Teamkorrektur 0 / ½ / 1 wird gegen die Anker getestet.
 *   3. Prüfung an den Ankern (Fahrer mit späterem PACE_RATINGS-Jahr): trägt die Reihenfolge Signal?
 *
 * Umrechnung: die Elo bestimmt die REIHENFOLGE, die Skala bleibt die bisherige Feeder-Spanne 74–92.
 * Eine direkte Regression (r ≈ 0,44) drückte alle Feeder auf 68–83 zusammen — unter die generierten
 * Rookies (75–94), Vesti wäre schwächer gewesen als ein erfundener Durchschnitts-Rookie.
 * Debüt-Pace = 88,5 % des Potenzials (reale Kurve, BEFUNDE.md); direkt vorhersagbar ist sie nicht (r ≈ 0,12).
 *
 * Aufruf: node tools/junior-elo.js            (Bericht)
 *         node tools/junior-elo.js --write    (schreibt data/feeder-elo.js)
 * Eingabe: tools/quellen/junior-results.json  (← tools/fetch-junior-results.js)
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const WRITE = process.argv.includes('--write');

const K_RACE = 16, START_ELO = 1500;
const MIN_RENNEN = 8;              // eine Saison zählt erst ab so vielen gewerteten Rennen
const SHRINK_RENNEN = 10;          // Zuverlässigkeit: Wert × n/(n+10) Richtung Serienmitte (wie normalize-elo)
const SERIEN_RANG = { EC3: 0, GB3: 0, EFO: 0, FRECA: 0, F3: 1, F2: 2 };   // nur Reihenfolge innerhalb eines Jahres

const lade = (f, n) => vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8') + ';' + n, { window: {} });
const HIST_NAMES = lade('hist.js', 'HIST_NAMES');
const PR = lade('f1db.js', 'PACE_RATINGS');
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, '').trim();

// FEEDER_DRIVERS + FEEDER_HIST_IDS direkt aus index.html (keine zweite Liste pflegen)
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FEEDER = vm.runInNewContext(/const FEEDER_DRIVERS = (\[[\s\S]*?\n\s*\]);/.exec(html)[1]);
const FEEDER_HIST_IDS = vm.runInNewContext('(' + /const FEEDER_HIST_IDS = (\{[\s\S]*?\});/.exec(html)[1] + ')');

// Junior-Name → F1-Slug: exakt, über FEEDER_HIST_IDS, oder F1-Name ist das Ende des Junior-Namens
// („Andrea Kimi Antonelli" → „Kimi Antonelli")
const slugByName = {};
for (const [slug, n] of Object.entries(HIST_NAMES)) slugByName[norm(n)] = slug;
function f1Slug(name) {
    if (FEEDER_HIST_IDS[name]) return FEEDER_HIST_IDS[name];
    const n = norm(name);
    if (slugByName[n]) return slugByName[n];
    const teile = n.split(' ');
    for (let i = 1; i < teile.length - 1; i++) { const s = slugByName[teile.slice(i).join(' ')]; if (s) return s; }
    return null;
}

// ── 1. Elo je Serie, chronologisch ─────────────────────────────────────────
const daten = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'quellen', 'junior-results.json'), 'utf8'))
    .sort((a, b) => a.jahr - b.jahr || SERIEN_RANG[a.serie] - SERIEN_RANG[b.serie]);
const elo = {};                    // serie|name → Wert (wird über die Jahre weitergetragen)
const saisons = [];                // { serie, jahr, name, team, elo, n }
const E = (a, b) => 1 / (1 + Math.pow(10, (b - a) / 400));
for (const s of daten) {
    const n = {};
    for (const r of s.rennen) {
        const fin = r.filter(e => e[1] != null).sort((a, b) => a[1] - b[1]);
        for (const e of r) { const k = s.serie + '|' + e[0]; if (elo[k] == null) elo[k] = START_ELO; }
        for (let i = 0; i < fin.length; i++) for (let j = i + 1; j < fin.length; j++) {
            const ka = s.serie + '|' + fin[i][0], kb = s.serie + '|' + fin[j][0];
            const ea = E(elo[ka], elo[kb]);
            elo[ka] += K_RACE * (1 - ea); elo[kb] -= K_RACE * (1 - ea);
        }
        for (const e of fin) n[e[0]] = (n[e[0]] || 0) + 1;
    }
    for (const name of Object.keys(n)) saisons.push({ serie: s.serie, jahr: s.jahr, name, team: s.teams[name] || '?', elo: elo[s.serie + '|' + name], n: n[name] });
}

// ── 2. Teamkorrektur, Serienabstand, Fahrerwert ─────────────────────────────
function fahrerWerte(teamGewicht) {
    const teamSchnitt = {};
    for (const x of saisons) { const k = x.serie + x.jahr + x.team; (teamSchnitt[k] = teamSchnitt[k] || []).push(x.elo); }
    const rel = x => { const t = teamSchnitt[x.serie + x.jahr + x.team]; const m = t.reduce((a, b) => a + b, 0) / t.length;
        const v = x.elo - teamGewicht * (m - START_ELO); return START_ELO + (v - START_ELO) * x.n / (x.n + SHRINK_RENNEN); };
    // Serienabstand: Fahrer mit Saison in Serie A (Jahr y) und Serie B höher (Jahr y+1)
    const bester = {};             // name|serie → bester rel-Wert einer Saison mit ≥ MIN_RENNEN
    for (const x of saisons) { if (x.n < MIN_RENNEN) continue; const k = x.name + '|' + x.serie, v = rel(x); if (bester[k] == null || v > bester[k]) bester[k] = v; }
    const off = { F2: 0 };
    for (const [unten, oben] of [['F3', 'F2'], ['FRECA', 'F3']]) {
        const d = [];
        for (const x of saisons) if (x.serie === unten && x.n >= MIN_RENNEN) {
            const y = saisons.find(z => z.serie === oben && z.name === x.name && z.jahr === x.jahr + 1 && z.n >= MIN_RENNEN);
            if (y) d.push(rel(y) - rel(x));
        }
        off[unten] = off[oben] + (d.length ? d.reduce((a, b) => a + b, 0) / d.length : 0);
        off['_n' + unten] = d.length;
    }
    // Weitere Serien (EFO, GB3, Eurocup-3, seit 09.10.2026): Abstand über Fahrer, die im Folgejahr
    // in eine schon geeichte Serie wechselten (F2, F3, FRECA) — gemittelt über alle Ziele.
    for (const serie of ['EFO', 'GB3', 'EC3']) {
        const d = [];
        for (const x of saisons) if (x.serie === serie && x.n >= MIN_RENNEN) {
            for (const ziel of ['F2', 'F3', 'FRECA']) {
                const y = saisons.find(z => z.serie === ziel && z.name === x.name && z.jahr === x.jahr + 1 && z.n >= MIN_RENNEN);
                if (y) d.push(rel(y) + off[ziel] - rel(x));
            }
        }
        off[serie] = d.length ? d.reduce((a, b) => a + b, 0) / d.length : off.FRECA;
        off['_n' + serie] = d.length;
    }
    const wert = {};
    for (const [k, v] of Object.entries(bester)) { const [name, serie] = k.split('|'); const w = v + off[serie]; if (wert[name] == null || w > wert[name].w) wert[name] = { w, serie }; }
    // Rückfall NUR für Feeder ohne eine volle Saison (Escotto: Indy NXT, Bennett: Langstrecke):
    // beste Teilsaison. Der Zuverlässigkeitsfaktor n/(n+10) zieht sie ohnehin stark zur Serienmitte.
    // Fließt nicht in die Prüfgrößen (Anker, AUC) — dort zählt nur `wert`.
    const teil = {};
    for (const x of saisons) { if (wert[x.name]) continue; const w = rel(x) + off[x.serie];
        if (teil[x.name] == null || w > teil[x.name].w) teil[x.name] = { w, serie: x.serie, teil: x.n }; }
    return { wert, off, teil };
}

// ── 3. Anker und Regression ────────────────────────────────────────────────
function regression(pt) {
    const n = pt.length, mx = pt.reduce((a, p) => a + p[0], 0) / n, my = pt.reduce((a, p) => a + p[1], 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (const [x, y] of pt) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
    const b = sxy / sxx; return { a: my - b * mx, b, r: sxy / Math.sqrt(sxx * syy), n };
}
function anker(wert) {
    const out = [];
    for (const [name, { w }] of Object.entries(wert)) {
        const slug = f1Slug(name); if (!slug || !PR[slug]) continue;
        const jahre = Object.keys(PR[slug]).map(Number).sort((a, b) => a - b);
        out.push({ name, w, pot: PR[slug][jahre[0]][1], debut: PR[slug][jahre[0]][0] });
    }
    return out;
}

console.log('JUNIOR-ELO — ' + daten.length + ' Saisons, ' + saisons.length + ' Fahrer-Saisons');
let wahl = null;
for (const tg of [0, 0.5, 1]) {
    const { wert, off, teil } = fahrerWerte(tg), a = anker(wert);
    const rp = regression(a.map(x => [x.w, x.pot])), rd = regression(a.map(x => [x.w, x.debut]));
    console.log(`  Teamkorrektur ${tg}: Anker ${a.length} · r(Potenzial) ${rp.r.toFixed(2)} · r(Debüt-Pace) ${rd.r.toFixed(2)} · Serienabstand F3 ${off.F3.toFixed(0)} (n ${off._nF3}), FRECA ${off.FRECA.toFixed(0)} (n ${off._nFRECA}), EFO ${off.EFO.toFixed(0)} (n ${off._nEFO}), GB3 ${off.GB3.toFixed(0)} (n ${off._nGB3}), EC3 ${off.EC3.toFixed(0)} (n ${off._nEC3})`);
    if (!wahl || rp.r > wahl.rp.r) wahl = { tg, wert, off, teil, a, rp, rd };
}
const { wert, teil, a, rp, rd } = wahl;
console.log(`→ gewählt: Teamkorrektur ${wahl.tg}`);
console.log(`  Potenzial = ${rp.a.toFixed(1)} + ${rp.b.toFixed(4)} × Wert   ·   Debüt-Pace = ${rd.a.toFixed(1)} + ${rd.b.toFixed(4)} × Wert`);
console.log('  Anker (Wert → Potenzial echt / geschätzt · Debüt echt / geschätzt):');
for (const x of a.sort((p, q) => q.w - p.w))
    console.log(`    ${x.name.padEnd(22)} ${x.w.toFixed(0).padStart(5)}   ${String(x.pot).padStart(3)} / ${(rp.a + rp.b * x.w).toFixed(0).padStart(3)}   ${String(x.debut).padStart(3)} / ${(rd.a + rd.b * x.w).toFixed(0).padStart(3)}`);

// ── 4. Werte für die Feeder ────────────────────────────────────────────────
const POT_MIN = 74, POT_MAX = 92, DEBUT_ANTEIL = 0.885;
const spearman = pt => { const rang = v => { const s = v.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]), r = []; s.forEach(([, i], k) => r[i] = k); return r; };
    const rx = rang(pt.map(p => p[0])), ry = rang(pt.map(p => p[1])); return regression(rx.map((x, i) => [x, ry[i]])).r; };
console.log(`  Spearman Rang Junior-Elo ↔ Rang F1-Potenzial: ${spearman(a.map(x => [x.w, x.pot])).toFixed(2)} (n ${a.length})`);
let AUC = NaN;
// Zweite Prüfung mit großer Stichprobe: trennt die Elo, wer in die F1 kam? (Auswahl echter Teams)
// Gezählt nur, wer seine letzte Junior-Saison bis 2023 fuhr — Jüngere hatten noch keine Chance.
{
    const letzte = {}; for (const x of saisons) letzte[x.name] = Math.max(letzte[x.name] || 0, x.jahr);
    const pool = Object.entries(wert).filter(([n]) => letzte[n] <= 2023).map(([n, v]) => [v.w, f1Slug(n) && PR[f1Slug(n)] ? 1 : 0]);
    const ja = pool.filter(p => p[1]).map(p => p[0]), nein = pool.filter(p => !p[1]).map(p => p[0]);
    let gew = 0; for (const x of ja) for (const y of nein) gew += x > y ? 1 : x === y ? 0.5 : 0;
    const auc = gew / (ja.length * nein.length); AUC = auc;
    // Zielwert für tests/gen-debut-age.js („Feeder-Debütanten … aus dem oberen Drittel")
    const sortiert = pool.slice().sort((p, q) => q[0] - p[0]), d3 = Math.ceil(sortiert.length / 3);
    const drittel = [sortiert.slice(0, d3), sortiert.slice(d3, 2 * d3), sortiert.slice(2 * d3)].map(t => t.filter(p => p[1]).length);
    console.log(`  Reale F1-Aufsteiger je Elo-Drittel (oben/Mitte/unten): ${drittel.join(' / ')} von ${ja.length} → oben ${(100 * drittel[0] / ja.length).toFixed(0)} %, unten ${(100 * drittel[2] / ja.length).toFixed(0)} %`);
    const quart = pool.map(p => p[0]).sort((p, q) => q - p), q1 = quart[Math.floor(quart.length / 4)];
    const obenF1 = pool.filter(p => p[0] >= q1), untenF1 = pool.filter(p => p[0] < q1);
    console.log(`  F1-Aufstieg: AUC ${auc.toFixed(2)} (0,5 = Zufall) · oberstes Viertel ${(100 * obenF1.filter(p => p[1]).length / obenF1.length).toFixed(0)} % in der F1, Rest ${(100 * untenF1.filter(p => p[1]).length / untenF1.length).toFixed(0)} % (n ${ja.length} von ${pool.length})`);
}
const feederWerte = [];
for (const f of FEEDER) {
    const name = f[0], wx = wert[name] || wert[Object.keys(wert).find(k => norm(k) === norm(name))] || teil[name];
    feederWerte.push([name, wx ? { w: wx.w, serie: wx.serie + (wx.teil ? ` (Teilsaison, ${wx.teil} R.)` : '') } : null]);
}
const mit = feederWerte.filter(x => x[1]);
// Rang → Spanne (bester = POT_MAX, schwächster = POT_MIN)
mit.slice().sort((p, q) => p[1].w - q[1].w).forEach(([, v], i, arr) => {
    v.pot = Math.round(POT_MIN + (POT_MAX - POT_MIN) * (arr.length > 1 ? i / (arr.length - 1) : 0.5));
    v.deb = Math.round(v.pot * DEBUT_ANTEIL);
});
const ws = mit.map(x => x[1].w), mw = ws.reduce((p, q) => p + q, 0) / ws.length, sd = Math.sqrt(ws.reduce((p, q) => p + (q - mw) ** 2, 0) / ws.length);
// Reife-Verschiebung: eine Standardabweichung besser = ein Jahr früher reif, gedeckelt ±2
for (const [, v] of mit) v.reife = Math.max(-2, Math.min(2, -Math.round((v.w - mw) / sd)));
console.log(`\nFEEDER: ${mit.length} von ${FEEDER.length} mit Junior-Elo (ohne: ${feederWerte.filter(x => !x[1]).map(x => x[0]).join(', ') || '–'})`);
const zeig = mit.slice().sort((p, q) => q[1].w - p[1].w);
const fmt = ([n, v]) => `    ${n.padEnd(24)} ${v.serie.padEnd(5)} Wert ${v.w.toFixed(0)} → Potenzial ${v.pot}, Debüt ${v.deb}, Reife ${v.reife >= 0 ? '+' : ''}${v.reife}`;
console.log('  Spitze:'); zeig.slice(0, 8).forEach(x => console.log(fmt(x)));
console.log('  Ende:'); zeig.slice(-5).forEach(x => console.log(fmt(x)));
for (const n of ['Frederik Vesti', 'Théo Pourchaire', 'Ricardo Escotto', 'Carl Bennett']) { const x = mit.find(y => y[0] === n); if (x) console.log('  ' + fmt(x).trim()); }

if (WRITE) {
    const ziel = path.join(ROOT, 'data', 'feeder-elo.js');
    const obj = {}; for (const [n, v] of mit) obj[n] = [v.pot, v.deb, v.reife];
    fs.writeFileSync(ziel, `// FEEDER_ELO — GENERIERT von tools/junior-elo.js (${new Date().toISOString().slice(0, 10)}) — NICHT von Hand editieren.\n`
        + `// Junior-Elo aus F2/F3/FRECA-Rennergebnissen (Wikipedia). Elo = Reihenfolge, Skala = Feeder-Spanne ${POT_MIN}–${POT_MAX},\n`
        + `// Debuet-Pace = ${(DEBUT_ANTEIL * 100).toFixed(1)} % des Potenzials. Geprueft: trennt den spaeteren F1-Aufstieg mit AUC ${AUC.toFixed(2)}.\n`
        + `// Format: Name → [Potenzial, Debuet-Pace, Reife-Verschiebung in Jahren].\n`
        + `const FEEDER_ELO = ${JSON.stringify(obj)};\n`);
    console.log('→ ' + path.relative(ROOT, ziel) + ' geschrieben (' + mit.length + ' Fahrer)');
}
