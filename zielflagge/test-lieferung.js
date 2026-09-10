/**
 * test-lieferung.js — nimmt ZIELFLAGGE ein geliefertes Rennergebnis exakt ab?
 *
 *   node zielflagge/test-lieferung.js [laeufe]
 *
 * ZIELFLAGGE ist ein Live-Ticker in 3D, kein dritter Modus:
 *     simulateRace()  ->  Sofort-Sim | Live-Ticker | ZIELFLAGGE
 * Die Zahlen entstehen in EINER Engine. Liegt ein im RPG gerechnetes Ergebnis
 * bei, darf ZIELFLAGGE nicht wuerfeln, sondern nur noch dorthin animieren.
 *
 * Geprueft wird deshalb genau das, was tests/ticker-paritaet.js fuer den
 * Live-Ticker prueft: die Reihenfolge am Ende muss Fahrer fuer Fahrer der
 * Lieferung entsprechen. Keine Toleranz.
 *
 * Der Spieler-Slot ist ausgenommen - der wird im Spiel durch echtes Fahren
 * ersetzt ("nur dein Slot ist frei").
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = 'file:///' + path.join(__dirname, 'index.html').replace(/\\/g, '/');
const LAEUFE = parseInt(process.argv[2]) || 12;

/* Spielstand + geliefertes Rennergebnis, in exakt der Form, die das RPG erzeugt. */
function baueLieferung(jahr) {
    const src = fs.readFileSync(path.join(ROOT, 'data', 'seasons.js'), 'utf8');
    const SD = new Function(src + '; return SEASON_DATA;')();
    const sd = SD[String(jahr)];
    const teams = sd.t.map(t => ({
        id: t[0], name: t[1], color: t[2],
        carSpeed: t[3], reliability: t[4], strategy: t[5], histId: t[1]
    }));
    const drivers = sd.d.map(d => ({
        id: d[0], histId: d[0], name: d[1], team: d[2], nation: d[3],
        birthYear: d[4], pace: d[5], rain: d[6], consistency: d[7],
        experience: d[8], starts: d[9], status: 'active'
    }));

    // Ergebnis wie simulateRace es liefert: gemischte Reihenfolge, ein paar DNF
    const gemischt = drivers.slice().sort(() => Math.random() - 0.5);
    const results = [];
    let pos = 1;
    gemischt.forEach((d, i) => {
        const dnf = (i % 7 === 3);            // fest gestreute Ausfaelle
        results.push({
            driver: d.id, name: d.name, team: d.team,
            teamName: (teams.find(t => t.id === d.team) || {}).name || '',
            position: dnf ? 99 : pos++,
            points: 0, dnf, dnfType: dnf ? 'mechanical' : null,
            reasonRetired: dnf ? 'Motorschaden' : null
        });
    });

    const kopf = { _format: 'f1rpg-ndjson', _v: 1, exportVersion: '0.9.18.1', currentYear: jahr, currentRace: 0 };
    const core = { _t: 'core', state: { currentYear: jahr, teams, drivers, driverStandings: {} } };
    const rennen = {
        _t: 'rennen', jahr, rennIndex: 0, rennName: jahr + ' Testrennen',
        runden: 8, results
    };
    return {
        text: JSON.stringify(kopf) + '\n' + JSON.stringify(core) + '\n' + JSON.stringify(rennen) + '\n',
        soll: results.filter(r => !r.dnf).sort((a, b) => a.position - b.position).map(r => r.driver),
        sollDnf: results.filter(r => r.dnf).map(r => r.driver).sort()
    };
}

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const fehler = [];
    page.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
    await page.goto(HTML, { waitUntil: 'load' });
    await page.waitForTimeout(900);

    let gut = 0, schlecht = 0;
    const beispiele = [];

    for (let i = 0; i < LAEUFE; i++) {
        const jahr = [1988, 1976, 1962, 2001][i % 4];
        const L = baueLieferung(jahr);
        const r = await page.evaluate(({ txt, sollLen }) => {
            try {
                const res = parseImportedText(txt);
                applyImportResult(res);
                if (!state.lieferung) return { err: 'Lieferung nicht erkannt' };
                state.playerDriverId = DRIVERS[0].id;
                state.laps = 8;
                startRace();
                if (!aiSim || !aiSim.ausLieferung) return { err: 'aiSim kam NICHT aus der Lieferung' };
                // Endstand aus der Animation: nach Gesamtzeit sortieren
                const gefahren = state.starters
                    .filter(d => d.id !== state.playerDriverId && !aiSim.retired[d.id])
                    .map(d => ({ id: d.id, t: aiSim.cumulative[d.id] }))
                    .sort((a, b) => a.t - b.t).map(x => x.id);
                const raus = state.starters
                    .filter(d => d.id !== state.playerDriverId && aiSim.retired[d.id])
                    .map(d => d.id).sort();
                return { gefahren, raus, spieler: state.playerDriverId };
            } catch (e) { return { err: e.message }; }
        }, { txt: L.text, sollLen: L.soll.length });

        if (r.err) { schlecht++; if (beispiele.length < 3) beispiele.push(jahr + ': ' + r.err); continue; }

        // Soll ohne den Spieler-Slot
        const sollOhneSpieler = L.soll.filter(id => id !== r.spieler);
        const sollDnfOhne = L.sollDnf.filter(id => id !== r.spieler);
        const abw = [];
        if (r.gefahren.length !== sollOhneSpieler.length) {
            abw.push('Anzahl gewertet: ' + r.gefahren.length + ' statt ' + sollOhneSpieler.length);
        }
        for (let k = 0; k < Math.min(r.gefahren.length, sollOhneSpieler.length); k++) {
            if (r.gefahren[k] !== sollOhneSpieler[k]) {
                abw.push('P' + (k + 1) + ': ' + r.gefahren[k] + ' statt ' + sollOhneSpieler[k]);
                if (abw.length > 3) break;
            }
        }
        if (r.raus.join(',') !== sollDnfOhne.join(',')) abw.push('Ausfaelle weichen ab');

        if (abw.length === 0) gut++;
        else { schlecht++; if (beispiele.length < 3) beispiele.push(jahr + ': ' + abw.join(' | ')); }
        process.stdout.write(abw.length === 0 ? '.' : 'X');
    }
    await browser.close();

    console.log('\n\n═══ Nimmt ZIELFLAGGE die Lieferung exakt ab? ═══\n');
    console.log('Laeufe geprueft : ' + (gut + schlecht));
    console.log('  identisch     : ' + gut);
    console.log('  abweichend    : ' + schlecht);
    if (beispiele.length) { console.log('\nAbweichungen:'); beispiele.forEach(b => console.log('  ' + b)); }
    console.log('\nSkriptfehler    : ' + (fehler.length ? fehler.slice(0, 3).join('\n  ') : 'keine'));
    console.log('\n' + (schlecht === 0 && !fehler.length
        ? 'GRUEN — ZIELFLAGGE animiert das gelieferte Ergebnis, ohne selbst zu wuerfeln.'
        : 'FEHLGESCHLAGEN'));
    process.exit(schlecht === 0 && !fehler.length ? 0 : 1);
})();
