// ============================================================================
// ROU-Namenspool (2026-10-02). Rumänien fehlt im Kaggle-Datensatz komplett.
//   Kopf:   worldnames.xyz (ro-quellen/, 200 Vornamen, 100 Nachnamen mit Trägerzahl)
//   Schwanz: Moldau aus Kaggle (md_sur_agg.csv), auf rumänische Formen gebracht
// Gewichte wie überall: w = round(100 · (count/max)^0.6).
// Der Schwanz hat keine rumänischen Zählungen. Würde er wie sonst mit Gewicht 1
// angehängt, fiele fast alles auf die Top 100 — rumänische Nachnamen sind aber
// breit gestreut. Deshalb: Rang aus Moldau, Zählung aus der Rangkurve der
// rumänischen Top 100 fortgeschrieben (log count ~ log rang, Kleinste Quadrate).
// Aufruf: node build-ro-names.js  → ro-names.js (von build-names-v3.js gelesen)
// ============================================================================
const fs = require('fs');

const ALPHA = 0.6, SCALE = 100;
const SUR_TOTAL = 350;     // wie Größenklasse 'tiny'
const MD_MIN_COUNT = 3;    // darunter ist die Moldau-Reihenfolge Rauschen

const readTsv = f => fs.readFileSync(f, 'utf8').split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('\t')).filter(p => p.length === 3).map(p => [p[1].trim(), +p[2]]);
const readAgg = f => fs.readFileSync(f, 'utf8').split('\n')
    .map(l => l.match(/^MD,"(.*)",(\d+)$/)).filter(Boolean).map(m => [m[1], +m[2]]);

// Kommaunterlegung statt Cedille (ș/ț ist die rumänische Norm), fremde Akute weg.
const norm = s => s.replace(/ş/g, 'ș').replace(/ţ/g, 'ț').replace(/Ş/g, 'Ș').replace(/Ţ/g, 'Ț')
    .replace(/í/g, 'i').replace(/é/g, 'e').replace(/á/g, 'a');
const ascii = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const hasRoDiac = s => /[ăâîșțĂÂÎȘȚ]/.test(s);

// Schreibung ohne Datenvariante — reine Orthographie, keine erfundenen Namen
const DIAC = {
    // Vornamen
    Danut:'Dănuț', Nicusor:'Nicușor', Mihaita:'Mihăiță', Petrisor:'Petrișor', Vladut:'Vlăduț',
    Costica:'Costică', Serban:'Șerban', Horatiu:'Horațiu', Rares:'Rareș', Catalin:'Cătălin',
    Dragos:'Dragoș', Laurentiu:'Laurențiu', Stefan:'Ștefan', Ionut:'Ionuț', Razvan:'Răzvan',
    Calin:'Călin', Petrica:'Petrică',
    // Nachnamen
    Lazar:'Lazăr', Craciun:'Crăciun', Ionita:'Ioniță', Tanase:'Tănase', Muresan:'Mureșan',
    Dragan:'Drăgan', Cretu:'Crețu', Sirbu:'Sârbu', Gutu:'Guțu', Turcanu:'Țurcanu', Turcan:'Țurcan',
    Rosca:'Roșca', Spinu:'Spânu', Capatina:'Căpățână', Raileanu:'Răileanu', Mereuta:'Mereuță',
    Gutan:'Guțan', Siscanu:'Șișcanu', Musteata:'Musteață', Cusnir:'Cușnir', Plesca:'Pleșca',
    Taran:'Țaran', Girlea:'Gârlea', Plamadeala:'Plămădeală', Mindru:'Mândru', Gorobet:'Gorobeț',
    Virlan:'Vârlan', Patrascu:'Pătrașcu', Jalba:'Jalbă', Frunza:'Frunză', Nicoara:'Nicoară',
    Stirbu:'Știrbu', Negara:'Negară', Tabarcea:'Tăbârcea',
    Pinzaru:'Pânzaru', Esanu:'Eșanu', Cucos:'Cucoș', Grigoras:'Grigoraș', Paduraru:'Păduraru', Puscas:'Pușcaș', Schiopu:'Șchiopu',
    Gavrilita:'Gavriliță', Brinza:'Brânză', Cirlig:'Cârlig', Girbu:'Gârbu', Untila:'Untilă', Gradinaru:'Grădinaru', Dragutan:'Drăguțan',
    Bargan:'Bârgan', Movila:'Movilă', Stanila:'Stănilă', Spataru:'Spătaru', Popusoi:'Popușoi', Seremet:'Șeremet', Placinta:'Plăcintă',
    Leanca:'Leancă', Cotruta:'Cotruță', Ciorba:'Ciorbă', Catana:'Cătană', Sanduta:'Sănduță', Lesan:'Leșan', Hincu:'Hâncu', Bors:'Borș',
    Gisca:'Gâscă', Tataru:'Tătaru', Pislaru:'Pâslaru', Bitca:'Bâtca', Castravet:'Castraveț', Mirza:'Mârza', Creciun:'Crăciun',
    Frunze:'Frunză', Gheorghita:'Gheorghiță', Furtuna:'Furtună', Stavila:'Stavilă', Talpa:'Talpă', Sochirca:'Sochircă', Cataraga:'Cataragă',
    Calancea:'Calancea', Stratila:'Stratilă', Chetraru:'Chetraru', Scutaru:'Scutaru', Bruma:'Brumă', Gonta:'Gonța',
    Neamtu:'Neamțu', Galusca:'Găluscă', Varzaru:'Vărzaru', Chirita:'Chiriță', Sendrea:'Șendrea', Veverita:'Veveriță', Colta:'Colța',
    Tudos:'Tudoș', Onofras:'Onofraș', Cirlan:'Cârlan', Batrincea:'Bătrâncea', Danila:'Dănilă', Verdes:'Verdeș', Andriuta:'Andriuță', Birca:'Bârcă'
};

// Ungarische Minderheit (~6 %) gesperrt — gleiche Regel wie BUL-Türken/SRB-Bosniaken:
// im selben Pool entstünde "Zsolt Popescu". Andrada ist weiblich.
const BAN_FIRST = /^(Attila|Zsolt|Istvan|Zoltan|Csaba|Szabolcs|Levente|Laszlo|Tamas|Sandor|Lorand|Szilard|Jozsef|Hunor|Botond|Tibor|Janos|Andras|Arpad|Csongor|Ferenc|Imre|Barna|Gabor|Andrada)$/;
const BAN_LAST = /^(Nagy|Szabo|Varga|Kovacs)$/;

// Moldauischer Schwanz: russisch/ukrainisch geprägte Formen raus
const MD_FOREIGN = /(ov|ova|ev|eva|in|ina|enko|enco|uk|iuc|ski|sky|skii|skaya|ich|ici|ko|co|ii|aya|yi)$/i;
// ukrainisch/russisch-stämmig in moldauischer Schreibung, gagausisch, Orte
const MD_BAN = /^(Tcaci|Mazur|Belous|Goncear|Colesnic|Ciumac|Covali|Uzun|Topal|Topala|Cara|Caraman|Chisinau|Chișinău|Ojog|Seremet|Lisnic|Scripnic|Bulat|Soltan|Gritco|Boico|Russu|Rusnac|Kara|Moroz)$/;

function pickDisplay(forms) {
    // forms: Map(name → count). Diakritische Form gewinnt, sonst DIAC, sonst häufigste.
    const sorted = [...forms.entries()].sort((a, b) => b[1] - a[1]);
    const di = sorted.find(([n]) => hasRoDiac(n));
    if (di) return di[0];
    const top = sorted[0][0];
    return top.split('-').map(p => DIAC[p] || p).join('-');
}

function mergeByAscii(rows) {
    const by = new Map();
    for (let [n, c] of rows) {
        n = norm(n);
        const k = ascii(n);
        if (!by.has(k)) by.set(k, { forms: new Map(), c: 0 });
        const e = by.get(k); e.c += c; e.forms.set(n, (e.forms.get(n) || 0) + c);
    }
    return [...by.values()].map(e => ({ name: pickDisplay(e.forms), c: e.c })).sort((a, b) => b.c - a.c);
}
const weight = (c, max) => Math.max(1, Math.round(SCALE * Math.pow(c / max, ALPHA)));

// ── Vornamen ────────────────────────────────────────────────────────────────
const fore = mergeByAscii(readTsv('ro-quellen/worldnames-ro-fore.tsv'))
    .filter(e => !BAN_FIRST.test(e.name.normalize('NFD').replace(/[̀-ͯ]/g, '')));
const fMax = fore[0].c;
const first = fore.map(e => [e.name, weight(e.c, fMax)]);

// ── Nachnamen: Kopf ─────────────────────────────────────────────────────────
const head = mergeByAscii(readTsv('ro-quellen/worldnames-ro-sur.tsv')).filter(e => !BAN_LAST.test(e.name));
const sMax = head[0].c;

// Rangkurve des Kopfs: log c = a − s · log r
const pts = head.map((e, i) => [Math.log(i + 1), Math.log(e.c)]);
const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length, my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
const slope = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
const icpt = my - slope * mx;
// Auf den letzten echten Kopfwert kalibriert, damit Rang 101 nahtlos an Rang 100 anschließt
const calib = head[head.length - 1].c / Math.exp(icpt + slope * Math.log(head.length));
const estCount = r => calib * Math.exp(icpt + slope * Math.log(r));

// ── Nachnamen: Schwanz aus Moldau ───────────────────────────────────────────
const vorn = new Set([...readTsv('ro-quellen/worldnames-ro-fore.tsv').map(r => ascii(norm(r[0]))),
                      ...readAgg('md_fore_agg.csv').map(r => ascii(r[0])), ...readAgg('md_fore_f_agg.csv').map(r => ascii(r[0]))]);
const headKeys = new Set(head.map(e => ascii(e.name)));
const mdRows = readAgg('md_sur_agg.csv')
    .filter(([n, c]) => c >= MD_MIN_COUNT && /^[A-ZĂÂÎȘȚŞŢ][a-zăâîșțşţ-]{2,}$/.test(n) && !MD_FOREIGN.test(n))
    .map(([n, c]) => {
        n = norm(n);
        n = n.replace(/ari$/, 'aru');                                  // Cojocari → Cojocaru
        n = n.replace(/(?<=.)î(?=.)/g, 'â');                          // Sîrbu → Sârbu (Rechtschreibung 1993)
        n = DIAC[n] || n;                                              // vor dem Merge, sonst doppelt (Sirbu/Sârbu)
        return [n, c];
    });
const tailAll = mergeByAscii(mdRows).filter(e => !headKeys.has(ascii(e.name)) && !vorn.has(ascii(e.name)) && !BAN_LAST.test(e.name) && !MD_BAN.test(e.name));
const tail = tailAll.slice(0, SUR_TOTAL - head.length);

const last = [
    ...head.map(e => [e.name, weight(e.c, sMax)]),
    ...tail.map((e, i) => [e.name, weight(estCount(head.length + 1 + i), sMax)])
];

const out = `// GENERIERT von build-ro-names.js — NICHT von Hand editieren.
// Kopf: worldnames.xyz (abgerufen 02.10.2026), Schwanz: Kaggle Moldau (md_sur_agg.csv).
// Rangkurve Kopf: Steigung ${slope.toFixed(3)} (log Träger je log Rang).
module.exports = {
    first: ${JSON.stringify(first)},
    last: ${JSON.stringify(last)}
};
`;
fs.writeFileSync('ro-names.js', out);
console.log(`ROU: ${first.length} Vornamen, ${last.length} Nachnamen (Kopf ${head.length}, Moldau-Schwanz ${tail.length} von ${tailAll.length})`);
console.log(`Rangkurve Steigung ${slope.toFixed(3)}; Gewicht Rang 100 = ${last[head.length - 1][1]}, Rang 101 = ${last[head.length] && last[head.length][1]}, letzter = ${last[last.length - 1][1]}`);
