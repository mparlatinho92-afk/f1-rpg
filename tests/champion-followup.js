// champion-followup.js — FAEHRT EIN WELTMEISTER DIE FOLGESAISON NOCH?
//
// Nutzer-Befund am Castellotti-Fall: „eine Banalitaet der Karriere. erst weltmeister
// dann danach nur noch sporadisch im einsatz." Vermutung des Nutzers: das erneuerte
// Meldesystem (markPrivateers nach realer Rennzahl + hasEarnedFullSeat, v0.9.16.15/.16)
// koennte das kuenftig verhindern.
//
// Genau das misst dieses Skript: je Saison den Champion merken und in der FOLGESAISON
// nachsehen, an wie vielen Rennen er meldet — absolut und als Anteil des Kalenders.
//
// ZWEI MESSFALLEN, die der erste Entwurf hatte und die hier geschlossen sind:
//
//  1. FALSCHE REFERENZ. Der Vergleichswert „90 % fahren die volle Folgesaison" ist der
//     Schnitt ueber 76 Jahre. Ein Lauf ab 1955 deckt aber 1956-1961 ab — genau die Ära
//     mit den realen Ausnahmen (Fangio hoerte 1958 auf, Hawthorn ebenso, Ascari starb).
//     Gegen den 76-Jahres-Schnitt kalibriert man die 50er auf eine Zahl, die dort nie
//     galt. Das Skript rechnet die reale Quote deshalb fuer GENAU DIE JAHRE nach, die
//     es simuliert — aus HIST_CHAMPIONS + DRIVER_STARTS (0 = volle Saison, n = n Rennen,
//     fehlt = hat gar nicht gemeldet).
//
//  2. „WEG" IST KEINE URSACHE. Ruecktritt, Tod und „im Kader nicht auffindbar" sind drei
//     verschiedene Fehler mit drei verschiedenen Hebeln und wurden vorher zusammen
//     gezaehlt. Jetzt getrennt ausgewiesen.
//
// Dazu die entscheidende Zusatzfrage bei Teilzeit: liegt es am FAHRER oder an seinem
// TEAM? Gemessen wird die beste Quote im selben Team — faehrt der ganze Rennstall nur
// 4 von 7, ist der Champion nicht das Problem, sondern seine Adresse (Transfermarkt).
//
//   node tests/champion-followup.js 1955 10 6              Startjahr, Sims, Saisons
//   node tests/champion-followup.js 1955,1975,1995,2010 4 6   mehrere Startjahre
//
// ⚠ Ein einzelnes Startjahr liefert nur SEASONS-1 reale Vergleichsfaelle — bei 1955/6
//   also SECHS. Darauf laesst sich nichts kalibrieren. Fuer eine belastbare Aussage
//   mehrere Startjahre ueber die Dekaden angeben.
'use strict';
const { getContext } = require('./sim-core');

const YEARS = String(process.argv[2] || '1955').split(',').map(Number).filter(n => n >= 1950);
const SIMS = Number(process.argv[3] || 10);
const SEASONS = Number(process.argv[4] || 6);

const ctx = getContext();
const faelle = [];

function championVonJetzt() {
    const st = ctx.GAME_STATE.driverStandings || {};
    let best = null;
    for (const id in st) {
        const s = st[id];
        if (!best || (s.points || 0) > (best.p || 0)) best = { id, p: s.points || 0, name: s.name };
    }
    return best && best.p > 0 ? best : null;
}

function meldungen(id, name) {
    const gs = ctx.GAME_STATE;
    const cal = (gs.races || []).filter(r => !r.isIndy && r.circuitId);
    // ⚠ NAMENSSUCHE, NICHT ID: Fahrer-IDs tragen einen Zeitstempel und wechseln,
    //   sobald ein Objekt neu erzeugt wird. Ueber die ID zaehlt man Fahrer als
    //   verschwunden, die laengst wieder im Feld stehen.
    const _n = String(name || '').toLowerCase().trim();
    const d = (gs.drivers || []).find(x => x.id === id)
           || (gs.drivers || []).find(x => String(x.name || '').toLowerCase().trim() === _n);
    if (!d) return { da: false, grund: 'verschwunden', n: 0, kal: cal.length };
    if (d.status && d.status !== 'active') {
        const grund = d.status === 'deceased' ? 'tot' : d.status === 'retired' ? 'ruecktritt' : d.status;
        return { da: false, grund, n: 0, kal: cal.length };
    }
    const n = cal.filter(r => ctx.privateerEntersRace(d, r)).length;
    // Team-Deckung: beste Quote im selben Rennstall. Liegt sie genauso tief wie die
    // des Champions, meldet das TEAM nicht mehr — dann ist der Fahrer nicht die Ursache.
    let teamBest = n, teamName = '';
    if (d.team) {
        const team = (gs.teams || []).find(t => t.id === d.team);
        teamName = team ? team.name : String(d.team);
        for (const k of (gs.drivers || [])) {
            if (k.team !== d.team || (k.status && k.status !== 'active')) continue;
            const kn = cal.filter(r => ctx.privateerEntersRace(k, r)).length;
            if (kn > teamBest) teamBest = kn;
        }
    }
    return { da: true, n, kal: cal.length, teamBest, teamName };
}

// ── REALE REFERENZ fuer exakt die simulierten Jahre ────────────────────────────
// Champion des Jahres y aus HIST_CHAMPIONS, seine Meldungen in y+1 aus DRIVER_STARTS,
// Kalendergroesse aus F1DB (ohne Indianapolis — kein F1-Stammfahrer meldete dort, und
// bei 8 Rennen waere ein fehlendes Indy sofort 12 % Quotenverlust).
// ⚠ `const` haengt NICHT am globalen vm-Objekt: ctx.HIST_CHAMPIONS ist immer undefined.
//   HIST_CHAMPIONS wird deshalb aus data/hist.js in einer eigenen kleinen Box geladen.
// ⚠ DRIVER_STARTS wird hier BEWUSST NICHT benutzt: die Tabelle erfasst nicht jeden
//   Melder (2005: 22 Eintraege bei 27 realen Fahrern). Ein fehlender Champion waere
//   faelschlich als „weg" gezaehlt worden. Die Starts kommen direkt aus F1DB.
function ladeKonstante(datei, name) {
    const vm = require('vm'), fs = require('fs'), path = require('path');
    const box = {};
    try {
        vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', datei), 'utf8')
            + `;__x = ${name};`, box);
    } catch (e) { return null; }
    return box.__x || null;
}
const HIST_CHAMPIONS = ladeKonstante('data/hist.js', 'HIST_CHAMPIONS');

// Kalender + Starts je Fahrer/Jahr aus F1DB. Indianapolis raus — es zaehlte 1950-1960
// zur WM, aber kein F1-Stammfahrer meldete dort; bei 8 Rennen waeren das sonst 12 %
// Quotenverlust fuer jeden Champion der Aera.
const F1DB = (() => {
    try {
        const races = require('../f1db-json-splitted/f1db-races.json');
        const ergebnisse = require('../f1db-json-splitted/f1db-races-race-results.json');
        const indyRennen = new Set(races.filter(r => r.circuitId === 'indianapolis').map(r => r.raceId || r.id));
        const kalender = {}, starts = {};
        for (const r of races) {
            if (r.circuitId === 'indianapolis') continue;
            kalender[r.year] = (kalender[r.year] || 0) + 1;
        }
        for (const e of ergebnisse) {
            if (indyRennen.has(e.raceId)) continue;
            const k = e.year + '|' + e.driverId;
            starts[k] = (starts[k] || 0) + 1;
        }
        return { kalender, starts };
    } catch (e) { return null; }
})();

function realeReferenz(jahre) {
    if (!HIST_CHAMPIONS || !F1DB) return null;
    const z = { gesamt: 0, weg: 0, voll: 0, teil: 0, spor: 0, faelle: [] };
    for (const y of jahre) {
        const champ = HIST_CHAMPIONS[y];
        const kal = F1DB.kalender[y + 1];
        if (!champ || !kal) continue;
        z.gesamt++;
        const n = F1DB.starts[(y + 1) + '|' + champ] || 0;
        if (n === 0) { z.weg++; z.faelle.push(`${y + 1} ${champ}: kein Start`); continue; }
        const q = n / kal;
        if (q >= 0.9) z.voll++;
        else if (q >= 0.4) { z.teil++; z.faelle.push(`${y + 1} ${champ}: ${n}/${kal}`); }
        else { z.spor++; z.faelle.push(`${y + 1} ${champ}: ${n}/${kal} (sporadisch)`); }
    }
    return z;
}

let ok = 0, laeufe = 0;
const simulierteJahre = new Set();
for (const YEAR of YEARS) for (let s = 0; s < SIMS; s++) {
    laeufe++;
    try {
        ctx.initFromYear(YEAR);
        let vorChampion = null;
        for (let k = 0; k < SEASONS; k++) {
            if (vorChampion) {
                const m = meldungen(vorChampion.id, vorChampion.name);
                faelle.push({ jahr: ctx.GAME_STATE.currentYear, name: vorChampion.name, ...m });
                simulierteJahre.add(ctx.GAME_STATE.currentYear - 1);
            }
            // Saison fahren
            const races = ctx.GAME_STATE.races || [];
            for (let r = 0; r < races.length; r++) {
                const res = ctx.simulateRace(r);
                if (typeof ctx.applyRaceResults === 'function') ctx.applyRaceResults(res, r);
            }
            vorChampion = championVonJetzt();
            if (k === SEASONS - 1) break;
            const y = ctx.GAME_STATE.currentYear;
            if (typeof ctx.updateDriverCareerScores === 'function') ctx.updateDriverCareerScores();
            if (typeof ctx.processDriverPaceDevelopment === 'function') ctx.processDriverPaceDevelopment();
            if (typeof ctx.checkCareerEnds === 'function') ctx.checkCareerEnds();
            if (typeof ctx.initReservePool === 'function') ctx.initReservePool(y + 1);
            if (typeof ctx._injectNewSeasonDrivers === 'function') ctx._injectNewSeasonDrivers(y + 1);
            if (typeof ctx.processTeamChanges === 'function') ctx.processTeamChanges();
            ctx.startNewSeason();
        }
        ok++;
    } catch (e) { if (s === 0) console.log('  (Sim 1 verworfen: ' + e.message.slice(0, 100) + ')'); }
}

console.log(`\nWELTMEISTER IN DER FOLGESAISON  |  Start ${YEARS.join('/')}  |  `
    + `${ok}/${laeufe} Sims x ${SEASONS} Saisons\n`);
const imFeld = faelle.filter(f => f.da);
const weg = faelle.filter(f => !f.da);
const quote = f => f.kal ? f.n / f.kal : 0;
const voll = imFeld.filter(f => quote(f) >= 0.9);
const teil = imFeld.filter(f => quote(f) >= 0.4 && quote(f) < 0.9);
const spor = imFeld.filter(f => quote(f) < 0.4);
const pct = (a, b) => b ? Math.round(100 * a / b) + ' %' : '–';

const jahre = [...simulierteJahre].sort((a, b) => a - b);
const ref = realeReferenz(jahre);
console.log(`Simulierte Titeljahre: ${jahre[0]}–${jahre[jahre.length - 1]}`
    + (ref ? `  |  reale Referenz aus denselben ${ref.gesamt} Jahren` : '  |  (keine Referenz verfuegbar)'));
console.log('');
console.log('                          Spiel            real (gleiche Jahre)');
console.log('  ──────────────────────────────────────────────────────────────');
const zeile = (label, a, b) => console.log(`  ${label.padEnd(22)} ${pct(a, faelle.length).padStart(6)}`
    + `  ${ref ? pct(b, ref.gesamt).padStart(16) : ''}`);
zeile('nach Titel weg', weg.length, ref && ref.weg);
zeile('volle Saison (>=90 %)', voll.length, ref && ref.voll);
zeile('Teilzeit (40-89 %)', teil.length, ref && ref.teil);
zeile('sporadisch (<40 %)', spor.length, ref && ref.spor);
console.log(`  ${''.padEnd(22)} ${String(faelle.length).padStart(6)}  ${ref ? String(ref.gesamt).padStart(16) : ''}   (Faelle)`);
if (ref && ref.gesamt < 10) {
    console.log(`\n  ⚠ Nur ${ref.gesamt} reale Vergleichsfaelle — darauf laesst sich NICHTS kalibrieren.`);
    console.log('    Mehrere Startjahre angeben, z. B.  1955,1970,1985,2000  4 6');
}

// Aufschluesselung „weg": drei verschiedene Fehler mit drei verschiedenen Hebeln
if (weg.length) {
    const nach = {};
    weg.forEach(f => { nach[f.grund] = (nach[f.grund] || 0) + 1; });
    console.log('\n  „weg" im Detail: ' + Object.entries(nach)
        .sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g} ${n}`).join(' · '));
}

// Fahrer oder Team? Bei Teilzeit die Team-Deckung danebenstellen.
const untervoll = teil.concat(spor);
if (untervoll.length) {
    const teamSchuld = untervoll.filter(f => (f.teamBest || 0) <= f.n).length;
    console.log(`\n  Teilzeit/sporadisch: ${untervoll.length} Faelle — davon ${teamSchuld} `
        + `(${pct(teamSchuld, untervoll.length)}), bei denen der ganze Rennstall nicht mehr meldet.`);
    console.log('  → in diesen Faellen liegt der Hebel im TRANSFERMARKT (Champion bei Teilzeit-Team),');
    console.log('    nicht im Meldesystem.\n');
    untervoll.slice(0, 12).forEach(f => console.log(`    ${f.jahr}  ${String(f.name).padEnd(24)} `
        + `${f.n}/${f.kal}   Team ${String(f.teamName || '?').padEnd(18)} bestes im Team ${f.teamBest}/${f.kal}`));
}

if (ref && ref.faelle.length) {
    console.log('\n  real nicht voll gefahren (dieselben Jahre):');
    ref.faelle.slice(0, 12).forEach(t => console.log('    ' + t));
}
