// ============================================================================
// Nationen-Bedarf: Ist-Pool vs. Bevölkerung vs. Trichter-Bedarf
// Aufruf (aus diesem Ordner):  node nation-demand.js [sitze] [jahre] [tenure]
//   sitze  = sichtbare Sitze gleichzeitig (Default 648 = F1+F2+F3+F4+Kart-WM/EM)
//   jahre  = Simulationshorizont (Default 500)
//   tenure = Ø Verweildauer für die grobe Frisch-Rate (Default 6)
// Voraussetzung: pop-sur.json / pop-fore.json (liegen daneben, s. README.md)
//
// WICHTIG (die zwei Fallstricke dieser Analyse):
//  1. EFFEKTIVE Poolgröße (Simpson 1/Σp²), nicht Rohzahl. GBR: 1322 Nachnamen
//     verhalten sich wie 437, weil Smith (w=100) gegen ~830 weight-1-Tails steht.
//  2. NAME_TAILS_BY_NATION wird erst zur LAUFZEIT gemerged (ensureNamePoolsMerged,
//     index.html ~L4991, Gewicht 1, first nur mid+modern). Wer nur
//     NAME_POOLS_BY_NATION zählt, sieht ~490 statt 1322 und hält v4 für ungebaut.
// ============================================================================
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.resolve(__dirname, '../../../..');           // Projektwurzel
const HERE = __dirname;
const [, , seatsArg, yearsArg, tenureArg] = process.argv;
const SEATS = +(seatsArg || 648), YEARS = +(yearsArg || 500), TENURE = +(tenureArg || 6);

// ── 1. Ist-Pools inkl. Laufzeit-Merge der Tails ─────────────────────────────
const sandbox = {};
new vm.Script(fs.readFileSync(path.join(ROOT, 'data/names.js'), 'utf8') +
  ';;__P__=NAME_POOLS_BY_NATION;__T__=NAME_TAILS_BY_NATION;').runInNewContext(sandbox);
const P = sandbox.__P__, T = sandbox.__T__;
for (const nat in T) {                                          // ensureNamePoolsMerged nachbilden
    const pool = P[nat]; if (!pool || !pool.regions) continue;
    for (const t of T[nat]) {
        const r = pool.regions[t.r]; if (!r) continue;
        if (t.last) for (const nm of t.last) r.last.push([nm, 1]);
        if (t.first) {
            if (Array.isArray(r.first)) for (const nm of t.first) r.first.push([nm, 1]);
            else for (const nm of t.first) { r.first.mid.push([nm, 1]); r.first.modern.push([nm, 1]); }
        }
    }
}
// Regionen-gewichtete Mischverteilung → {n, eff}
function mix(nat, kind, era) {
    const g = P[nat]; if (!g) return null;
    const m = new Map();
    for (const r of g.regions) {
        const list = kind === 'last'
            ? (Array.isArray(r.last) ? r.last : r.last && r.last[era])
            : (Array.isArray(r.first) ? r.first : r.first && r.first[era]);
        if (!list || !list.length) continue;
        const tot = list.reduce((a, x) => a + x[1], 0);
        for (const [n, w] of list) m.set(n, (m.get(n) || 0) + r.w * w / tot);
    }
    if (!m.size) return { n: 0, eff: 0 };
    const tot = [...m.values()].reduce((a, b) => a + b, 0);
    const ps = [...m.values()].map(v => v / tot);
    return { n: m.size, eff: 1 / ps.reduce((a, p) => a + p * p, 0) };
}

// ── 2. Nationen-Anteile aus index.html ──────────────────────────────────────
// ACHTUNG: DECADE_NATION_POOLS (~L4839, {weights:{...}}-Wrapper) und
// MOTORSPORT_NATION_BLEND (~L4877, flach) liegen nur 38 Zeilen auseinander.
// Ein großzügiges Slice erwischt die falsche Tabelle → exakte Klammer-Grenzen.
const SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
function block(name) {
    const i = SRC.indexOf('const ' + name); if (i < 0) return null;
    const s = SRC.indexOf('{', i); let d = 0;
    for (let j = s; j < SRC.length; j++) {
        if (SRC[j] === '{') d++;
        else if (SRC[j] === '}') { d--; if (d === 0) return SRC.slice(s, j + 1); }
    }
}
function blendDecade(y) {                                       // Junior-Welt zieht hieraus
    const m = block('MOTORSPORT_NATION_BLEND').match(new RegExp('(?:^|[,{\\s])' + y + '\\s*:\\s*\\{([^}]*)\\}'));
    const o = {};
    for (const p of m[1].split(',')) { const [k, v] = p.split(':'); if (k && v) o[k.trim()] = parseFloat(v); }
    return o;
}
const SHARE = blendDecade('2020');

// ── 3. Bevölkerungs-Baseline ────────────────────────────────────────────────
const popS = JSON.parse(fs.readFileSync(path.join(HERE, 'pop-sur.json')));
const popF = JSON.parse(fs.readFileSync(path.join(HERE, 'pop-fore.json')));
const ISO = { GBR:'GB',GER:'DE',ITA:'IT',FRA:'FR',USA:'US',BRA:'BR',JPN:'JP',ESP:'ES',ARG:'AR',NED:'NL',
  BEL:'BE',SUI:'CH',AUT:'AT',SWE:'SE',FIN:'FI',DEN:'DK',NOR:'NO',CAN:'CA',MEX:'MX',RSA:'ZA',IRL:'IE',
  POR:'PT',COL:'CO',RUS:'RU',POL:'PL',CZE:'CZ',HUN:'HU',GRE:'GR',TUR:'TR',URU:'UY',ISR:'IL',IND:'IN',
  MAS:'MY',INA:'ID',KOR:'KR',EST:'EE',MAR:'MA',CHI:'CL',PER:'PE',EGY:'EG',SAU:'SA',UAE:'AE',QAT:'QA' };

// ── 4. Ausgabe ──────────────────────────────────────────────────────────────
const perYear = SEATS / TENURE, total = perYear * YEARS;
console.log(`# ${SEATS.toLocaleString('de')} Sitze | ${Math.round(perYear)} frisch/Jahr (grob, tenure ${TENURE})`
  + ` | ${Math.round(total).toLocaleString('de')} Fahrer / ${YEARS} J`);
console.log('# ACHTUNG: perYear = Sitze/Tenure ist die GROBE Näherung. Im echten Trichter mit');
console.log('# Beförderung entstehen neue Fahrer NUR beim Eintritt (F3/F1 = 0 frisch) → deutlich');
console.log('# weniger. Siehe pyramid-300kart-nation-demand.md §"Rechenfehler".\n');
console.log('NAT  Anteil | gleichz | effV effN | Ausl. | Dup ist   natürl | Faktor');
console.log('-'.repeat(74));
const rows = [];
for (const nat of Object.keys(SHARE)) {
    if (!P[nat]) continue;
    const sh = SHARE[nat], iso = ISO[nat];
    const D = total * sh, sim = SEATS * sh;
    const F = mix(nat, 'first', 'modern'), L = mix(nat, 'last', 'modern');
    const effNow = F.eff * L.eff;
    const pf = iso && popF[iso], pl = iso && popS[iso];
    const effPop = (pf && pl) ? pf.eff * pl.eff : null;         // null = Nation nicht in der Quelle
    rows.push({ nat, sh, sim, F, L, dupNow: D * D / (2 * effNow),
        dupPop: effPop ? D * D / (2 * effPop) : null,
        faktor: effPop ? effPop / effNow : null, util: sim / L.eff,
        thin: pl ? pl.carriers < 5e5 : false });
}
rows.sort((a, b) => b.util - a.util);
for (const r of rows) console.log(
    r.nat.padEnd(4), (r.sh * 100).toFixed(2).padStart(5) + '% |',
    Math.round(r.sim).toString().padStart(7), '|',
    r.F.eff.toFixed(0).padStart(4), r.L.eff.toFixed(0).padStart(4), '|',
    (100 * r.util).toFixed(0).padStart(4) + '% |',
    Math.round(r.dupNow).toLocaleString('de').padStart(8),
    (r.dupPop != null ? Math.round(r.dupPop).toLocaleString('de') : '—').padStart(8), '|',
    (r.faktor != null ? r.faktor.toFixed(1) + 'x' : 'keine Daten').padStart(11),
    r.thin ? ' ⚠ dünne Quelle' : '');
console.log('\n⚠ dünne Quelle (<0,5 Mio Träger) → "natürlich"/Faktor ist Datensatz-Artefakt,');
console.log('  KEINE Realität. Nicht darauf hin schrumpfen (KOR eff=2 ist Quellenlücke, nicht Korea).');
