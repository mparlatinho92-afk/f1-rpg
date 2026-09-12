/**
 * test-lieferung.js — nimmt ZIELFLAGGE ein geliefertes Rennergebnis exakt ab?
 *
 *   node zielflagge/test-lieferung.js [laeufe]
 *
 * ⚠ DIE ZUSAGE HAT SICH AM 12.09.2026 GEAENDERT.
 * Bis dahin galt: ZIELFLAGGE animiert die Lieferung Fahrer fuer Fahrer, keine
 * Toleranz - wie tests/ticker-paritaet.js fuer den Live-Ticker. Der Test las
 * dafuer aiSim.cumulative, also den PLAN, und konnte deshalb gar nicht
 * durchfallen.
 *
 * Seit die Gegner selbst fahren, ist ZIELFLAGGE der MANIPULATIVE Modus
 * (Nutzer: "im endergebnis ist es egal ob es sofort-sim, zielgerade oder
 * live-ticker war. der weg dahin ist entweder gescriptet, oder gescriptet und
 * manipulation kaempfen gegeneinander").
 *
 * Die Lieferung ist damit der RAHMEN, nicht das Ergebnis:
 *   - sie muss uebernommen werden (aiSim.ausLieferung),
 *   - sie muss das Renngeschehen DOMINIEREN - wer im Plan vorn ist, kommt in
 *     aller Regel vorn an,
 *   - aber sie darf abweichen, sonst waere das Eingreifen wirkungslos.
 * Geprueft wird deshalb die mittlere Platzverschiebung gegen die Lieferung,
 * gemessen am TATSAECHLICH gefahrenen Rennen.
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
    const verschiebungen = [];
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
                // Rennen wirklich durchlaufen lassen - nicht den Plan ablesen.
                racing = true; raceClock = 0;
                const gg = state.starters.filter(d => d.id !== state.playerDriverId);
                let sicher = 0;
                while (sicher++ < 60 * 60 * 6) {
                    raceClock += 1 / 60;
                    updateAICars(raceClock, 1 / 60);
                    if (gg.every(d => carMeshes[d.id].imZiel
                        || getProgressAI(d.id, raceClock).frozen)) break;
                }
                // Endstand aus dem GEFAHRENEN Rennen
                const gefahren = gg
                    .filter(d => !aiSim.retired[d.id])
                    .map(d => ({ id: d.id, t: carMeshes[d.id].zielZeit !== undefined
                        ? carMeshes[d.id].zielZeit : 1e9 - (carMeshes[d.id].fortschritt || 0) }))
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
        // Mittlere Platzverschiebung gegen die Lieferung. 0 hiesse: das
        // Eingreifen ist wirkungslos. Gross hiesse: die Lieferung ist egal.
        let summe = 0, n = 0;
        r.gefahren.forEach((id, k) => {
            const soll = sollOhneSpieler.indexOf(id);
            if (soll < 0) return;
            summe += Math.abs(soll - k); n++;
        });
        const schnittVersch = n ? summe / n : 0;
        verschiebungen.push(schnittVersch);
        if (r.raus.join(',') !== sollDnfOhne.join(',')) abw.push('Ausfaelle weichen ab');

        if (abw.length === 0) gut++;
        else { schlecht++; if (beispiele.length < 3) beispiele.push(jahr + ': ' + abw.join(' | ')); }
        process.stdout.write(abw.length === 0 ? '.' : 'X');
    }
    await browser.close();

    console.log('\n\n═══ Bleibt die Lieferung der Rahmen des gefahrenen Rennens? ═══\n');
    console.log('Laeufe geprueft : ' + (gut + schlecht));
    console.log('  identisch     : ' + gut);
    console.log('  abweichend    : ' + schlecht);
    const vSchnitt = verschiebungen.length
        ? verschiebungen.reduce((a, b) => a + b, 0) / verschiebungen.length : 0;
    const vMax = verschiebungen.length ? Math.max.apply(null, verschiebungen) : 0;
    console.log('');
    console.log('Platzverschiebung gegen die Lieferung:');
    console.log('  im Schnitt    : ' + vSchnitt.toFixed(2) + ' Plaetze');
    console.log('  groesster Lauf: ' + vMax.toFixed(2) + ' Plaetze');
    const rahmenHaelt = vSchnitt < 4.0;
    const wirkung = vSchnitt > 0.05;
    console.log((rahmenHaelt ? '  OK  ' : ' FEHL ') + 'Lieferung bleibt der Rahmen (<4 Plaetze)');
    console.log((wirkung ? '  OK  ' : ' FEHL ') + 'Rennen weicht ueberhaupt ab (>0,05)');
    if (!rahmenHaelt || !wirkung) schlecht++;
    if (beispiele.length) { console.log('\nAbweichungen:'); beispiele.forEach(b => console.log('  ' + b)); }
    console.log('\nSkriptfehler    : ' + (fehler.length ? fehler.slice(0, 3).join('\n  ') : 'keine'));
    console.log('\n' + (schlecht === 0 && !fehler.length
        ? 'GRUEN — die Lieferung bleibt der Rahmen, das Rennen entscheidet darin.'
        : 'FEHLGESCHLAGEN'));
    process.exit(schlecht === 0 && !fehler.length ? 0 : 1);
})();
