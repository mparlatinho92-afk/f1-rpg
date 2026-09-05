/**
 * build-places.js — erzeugt data/places.js aus GeoNames.
 *
 * data/places.js ist GENERIERT. Nie von Hand editieren, sondern hier ändern
 * und neu bauen (gleiche Regel wie data/names.js / build-names-v3.js).
 *
 * Aufruf:
 *   node tools/build-places.js <pfad-zu-geonames>
 * erwartet dort cities500.txt und alternateNamesV2.txt
 * (https://download.geonames.org/export/dump/, CC-BY 4.0).
 * Die Rohdateien (~785 MB) gehören NICHT ins Repo.
 *
 * Warum zwei Dateien: cities500 liefert Ort + Einwohnerzahl, aber für
 * Großstädte oft das englische Exonym („Rome", „Munich", „Warsaw").
 * alternateNamesV2 liefert den Namen in der Landessprache — nötig, damit
 * „Gran Premio di Roma" nicht „di Rome" heißt.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const GEO = process.argv[2];
if (!GEO) { console.error('Aufruf: node tools/build-places.js <geonames-verzeichnis>'); process.exit(1); }
const F_CITIES = path.join(GEO, 'cities500.txt');
const F_ALT = path.join(GEO, 'alternateNamesV2.txt');
const DECKEL = parseInt(process.env.DECKEL || '300', 10);

// ── Nationen ────────────────────────────────────────────────────────────────
// IOC → ISO2. Fallen: IOC CHI = Chile (nicht China = CHN),
// MAS = Malaysia, MAR = Marokko, INA = Indonesien.
const IOC2ISO = {
    ITA:'IT',GBR:'GB',FRA:'FR',GER:'DE',USA:'US',JPN:'JP',BRA:'BR',ESP:'ES',AUT:'AT',SUI:'CH',
    BEL:'BE',NED:'NL',POR:'PT',SWE:'SE',FIN:'FI',HUN:'HU',CZE:'CZ',RUS:'RU',TUR:'TR',RSA:'ZA',
    ARG:'AR',MEX:'MX',CAN:'CA',AUS:'AU',NZL:'NZ',CHN:'CN',KOR:'KR',IND:'IN',MAS:'MY',UAE:'AE',
    EST:'EE',DEN:'DK',POL:'PL',NOR:'NO',IRL:'IE',THA:'TH',COL:'CO',VEN:'VE',CHI:'CL',
    UKR:'UA',URU:'UY',GRE:'GR',ZIM:'ZW',INA:'ID',ROU:'RO',KEN:'KE',BUL:'BG',PER:'PE',ISR:'IL',
    PHI:'PH',SRB:'RS',MAR:'MA',LUX:'LU',CIV:'CI',EGY:'EG',SAU:'SA'
};
// Nicht dabei: MON (per EXCL im Spiel gesperrt), LIE und QAT (10/14/42 Orte — zu dünn).

// Landessprache je Land, aber NUR wo sie lateinisch geschrieben wird.
// Für Japan, Korea, China, Russland, Ukraine, Griechenland, Israel, Indien,
// Thailand, Serbien, Bulgarien und die arabischen Länder bleibt es bei der
// Umschrift aus cities500 — sonst stünde dort 東京 oder Москва.
const SPRACHE = {
    IT:'it', DE:'de', FR:'fr', ES:'es', PT:'pt', PL:'pl', CZ:'cs', NL:'nl', SE:'sv', FI:'fi',
    HU:'hu', TR:'tr', RO:'ro', DK:'da', NO:'no', EE:'et', AT:'de', CH:'de', BE:'nl', LU:'fr',
    BR:'pt', MX:'es', AR:'es', CO:'es', VE:'es', CL:'es', PE:'es', UY:'es', CI:'fr', MA:'fr',
    ID:'id', MY:'ms'
};

// ── Ortstypen ───────────────────────────────────────────────────────────────
// PPLX = Stadtteil (》Jumeirah《, 》Ido-dong《, 》Lingotto《) — kein eigener Ort.
// PPLQ/PPLW/PPLH/PPLCH/PPLS = verlassen, zerstört, historisch, ehemalig, Sammel-Eintrag.
const RAUS_FCODE = new Set(['PPLX', 'PPLQ', 'PPLW', 'PPLH', 'PPLCH', 'PPLS']);

// ── Namensglättung ──────────────────────────────────────────────────────────
// Europäische Diakritika bleiben (Puławy, Nürburg, Montmeló, Dębica) — das ist
// echte Landessprache. Transliterationszeichen aus dem Arabischen/Persischen
// (Makron, Unterpunkt: Khawr Fakkān, Al Ḩamīdīyah) werden auf den Grundbuchstaben
// geglättet, weil sie im Spiel wie Setzfehler aussehen.
// Achtung Grenzfall: der osteuropäische Satz beginnt bei Ą (U+0104), NICHT bei
// Ā (U+0100). Ā/ā/ī/ū sind Makron-Zeichen aus der Umschrift — die sollen raus.
const EUROPA = 'a-zA-Z0-9 \'\\-'
    + 'À-ÿ'          // Latin-1: àáâãäåæçèéêëìíîïñòóôõöøùúûüý
    + 'Ą-ćČ-đĘ-ěĹ-ľŁ-ń'
    + 'Ň-ňŐ-ŕŘ-ťŮ-ųŹ-ž';
const NICHT_EUROPA = new RegExp('[^' + EUROPA + ']', 'g');

function glaetten(n) {
    if (!NICHT_EUROPA.test(n)) return n;
    NICHT_EUROPA.lastIndex = 0;
    // NFD zerlegt 》ā《 in 》a《 + Kombinationszeichen; wir werfen nur das weg,
    // was außerhalb des europäischen Satzes liegt.
    return n.normalize('NFD').replace(/[̀-ͯ]/g, (m, i, s) => '')
        .replace(NICHT_EUROPA, '').replace(/\s+/g, ' ').trim();
}

// ── Namensqualität ──────────────────────────────────────────────────────────
const REAL = new Set();
{
    const p = 'f1db-json-splitted/f1db-circuits.json';
    if (fs.existsSync(p)) {
        for (const c of JSON.parse(fs.readFileSync(p, 'utf8'))) {
            if (c.placeName) REAL.add(c.placeName.toLowerCase());
            if (c.name) REAL.add(c.name.toLowerCase());
        }
    } else {
        console.warn('WARNUNG: ' + p + ' fehlt — Namensvettern echter Strecken werden NICHT getilgt.');
    }
}

function brauchbar(n) {
    if (n.length < 3 || n.length > 16) return false;        // UI-Breite
    if (/[0-9(),.\/]/.test(n)) return false;
    // Höchstens zwei Wortteile — aber drei, wenn der Name insgesamt kurz bleibt.
    // Sonst fallen arabische Ortsnamen pauschal weg (》Ras Al Khaimah《), und die
    // Emirate behalten am Ende drei Dutzend Orte.
    const teile = n.split(/[ \-]/).length;
    if (teile > 3 || (teile === 3 && n.length > 15)) return false;
    if (REAL.has(n.toLowerCase())) return false;             // Namensvetter echter Strecke
    return true;
}

// ── Schritt 1: cities500 einlesen ───────────────────────────────────────────
const iso2ioc = {};
for (const [ioc, iso] of Object.entries(IOC2ISO)) iso2ioc[iso] = ioc;

const orte = [];            // {id, name, iso, pop}
const brauchtAlt = new Map(); // geonameid -> index in orte (nur Lateinschrift-Länder)

for (const line of fs.readFileSync(F_CITIES, 'utf8').split('\n')) {
    if (!line) continue;
    const f = line.split('\t');
    const iso = f[8];
    if (!iso2ioc[iso]) continue;
    if (RAUS_FCODE.has(f[7])) continue;
    const pop = parseInt(f[14], 10) || 0;
    if (!pop) continue;                                      // pop=0 = unbekannt, nicht klein
    const idx = orte.push({ id: f[0], name: f[1], iso, pop }) - 1;
    if (SPRACHE[iso]) brauchtAlt.set(f[0], idx);
}
console.log('cities500: ' + orte.length.toLocaleString('de-DE') + ' Orte in '
    + Object.keys(iso2ioc).length + ' Ländern (Stadtteile/verlassene Orte bereits raus)');

// ── Schritt 2: alternateNamesV2 streamen (746 MB) ───────────────────────────
// Spalten: 1=geonameid 2=isolanguage 3=name 4=isPreferred 5=isShort 7=isHistoric
const besser = new Map();   // geonameid -> {name, rang}
let zeilen = 0;

const rl = readline.createInterface({
    input: fs.createReadStream(F_ALT, { encoding: 'utf8' }),
    crlfDelay: Infinity
});

rl.on('line', line => {
    zeilen++;
    const f = line.split('\t');
    const idx = brauchtAlt.get(f[1]);
    if (idx === undefined) return;
    if (f[7] === '1') return;                                // historischer Name
    const soll = SPRACHE[orte[idx].iso];
    if (f[2] !== soll) return;
    // Bevorzugt: isPreferredName. Kurzname als zweite Wahl, sonst Rang 1.
    const rang = f[4] === '1' ? 3 : (f[5] === '1' ? 2 : 1);
    const alt = besser.get(f[1]);
    if (!alt || rang > alt.rang) besser.set(f[1], { name: f[3], rang });
});

rl.on('close', () => {
    console.log('alternateNamesV2: ' + zeilen.toLocaleString('de-DE') + ' Zeilen gelesen, '
        + besser.size.toLocaleString('de-DE') + ' Orte mit Namen in der Landessprache');
    fertigstellen();
});

// ── Schritt 3: auflösen, filtern, deckeln, schreiben ────────────────────────
function fertigstellen() {
    const eimer = {};
    for (const ioc of Object.keys(IOC2ISO)) eimer[ioc] = { klein: [], gross: [] };

    let ersetzt = 0, weggefiltert = 0, geglaettet = 0;
    for (const o of orte) {
        let name = o.name;
        const alt = besser.get(o.id);
        if (alt && alt.name !== name) { name = alt.name; ersetzt++; }
        const g = glaetten(name);
        if (g !== name) geglaettet++;
        name = g;
        if (!brauchbar(name)) { weggefiltert++; continue; }
        const ioc = iso2ioc[o.iso];
        (o.pop < 50000 ? eimer[ioc].klein : eimer[ioc].gross).push([name, o.pop]);
    }
    console.log('Exonyme durch Landessprache ersetzt: ' + ersetzt.toLocaleString('de-DE')
        + ' | Transliteration geglättet: ' + geglaettet.toLocaleString('de-DE')
        + ' | vom Namensfilter verworfen: ' + weggefiltert.toLocaleString('de-DE'));

    // Deckel: 70 % Kleinorte (permanente Kurse), 30 % Städte (Straßenkurse).
    // Reicht ein Eimer nicht, füllt der andere auf — so bekommen Korea und die
    // Emirate Städte in den Dorf-Eimer statt einer halbleeren Liste.
    const out = {};
    let gesamt = 0;
    const duenn = [];
    for (const [ioc, b] of Object.entries(eimer)) {
        const zielK = Math.round(DECKEL * 0.7), zielG = DECKEL - zielK;
        const uniq = a => [...new Map(a.map(x => [x[0].toLowerCase(), x])).values()];
        const k = uniq(b.klein).sort((x, y) => y[1] - x[1]);
        const g = uniq(b.gross).sort((x, y) => y[1] - x[1]);
        let nk = k.slice(0, zielK), ng = g.slice(0, zielG);
        if (nk.length < zielK) ng = g.slice(0, Math.min(g.length, DECKEL - nk.length));
        if (ng.length < zielG) nk = k.slice(0, Math.min(k.length, DECKEL - ng.length));
        out[ioc] = { k: nk.map(x => x[0]), g: ng.map(x => x[0]) };
        gesamt += nk.length + ng.length;
        if (nk.length + ng.length < 60) duenn.push(ioc + '(' + (nk.length + ng.length) + ')');
    }

    const kopf = '// GENERIERT von tools/build-places.js — nicht von Hand editieren.\n'
        + '// Quelle: GeoNames (CC-BY 4.0), cities500 + alternateNamesV2.\n'
        + '// Ortsnamen je IOC-Nation: k = Kleinorte (< 50.000 Einw., permanente Kurse),\n'
        + '// g = Städte (>= 50.000, Straßenkurse). Deckel ' + DECKEL + ' je Land.\n';
    const js = kopf + 'const CIRCUIT_PLACES = ' + JSON.stringify(out) + ';\n';
    fs.writeFileSync('data/places.js', js, 'utf8');

    console.log('');
    console.log('data/places.js geschrieben: ' + gesamt.toLocaleString('de-DE') + ' Orte, '
        + Object.keys(out).length + ' Nationen, '
        + (Buffer.byteLength(js, 'utf8') / 1024).toFixed(0) + ' KB');
    if (duenn.length) console.log('dünn besetzt (< 60): ' + duenn.join(' '));

    console.log('');
    console.log('--- Stichprobe ---');
    for (const ioc of ['GBR', 'GER', 'ITA', 'FRA', 'POL', 'KOR', 'UAE', 'CIV', 'JPN']) {
        if (!out[ioc]) continue;
        console.log(ioc + ' k(' + out[ioc].k.length + '): ' + out[ioc].k.slice(0, 7).join(', '));
        console.log('    g(' + out[ioc].g.length + '): ' + out[ioc].g.slice(0, 6).join(', '));
    }
}
