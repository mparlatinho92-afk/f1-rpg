/* Prueft ZIELFLAGGE gegen ECHTE F1-RPG-Daten.
 *   node zielflagge/test-import.js
 *
 * Deckt drei Dinge ab, die sonst still danebengehen:
 *   1. Skript-Tod beim Anlegen  - nur ueber Playwrights 'pageerror' sichtbar,
 *      node --check sieht ihn NICHT (siehe reference_silent_script_death)
 *   2. Import der echten Achsen - carSpeed/reliability/strategy (Team),
 *      pace/rain/consistency/experience (Fahrer)
 *   3. Team-Zuordnung           - driver.team ist eine ID ("MCL"), nicht der Name
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = 'file:///' + path.join(__dirname, 'index.html').replace(/\\/g, '/');
const JAHR = process.argv[2] || '1988';

function ladeSaison(jahr) {
  const src = fs.readFileSync(path.join(ROOT, 'data', 'seasons.js'), 'utf8');
  const SD = new Function(src + '; return SEASON_DATA;')();
  if (!SD[jahr]) throw new Error('Jahr ' + jahr + ' gibt es in SEASON_DATA nicht.');
  return { [jahr]: SD[jahr] };
}

(async () => {
  const saison = ladeSaison(JAHR);
  const erwartet = {
    teams: saison[JAHR].t.length,
    drivers: saison[JAHR].d.length,
    t0: saison[JAHR].t[0],   // [id, name, color, carSpeed, reliability, strategy]
    d0: saison[JAHR].d[0]    // [histId, name, teamId, nation, birthYear, pace, rain, cons, exp, starts]
  };

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const fehler = [];
  page.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') fehler.push('CONSOLE: ' + m.text()); });

  await page.goto(HTML, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  const lebt = await page.evaluate(() => ({
    three: typeof THREE !== 'undefined',
    parseF1Rpg: typeof parseF1Rpg === 'function',
    simulateRace: typeof simulateRace === 'function',
    appName: typeof APP_NAME !== 'undefined' ? APP_NAME : null
  }));

  const imp = await page.evaluate((txt) => {
    try {
      const res = parseImportedText(txt);
      applyImportResult(res);
      return {
        ok: true, quelle: res.quelle, jahr: res.jahr,
        teams: res.teams.length, drivers: res.drivers.length,
        ohneTeam: DRIVERS.filter(d => d.team === 'Ohne Team').length,
        erstesTeam: (() => { const n = Object.keys(TEAMS)[0]; const t = TEAMS[n];
          return t ? [n, t.carSpeed, t.reliability, t.strategy] : null; })(),
        ersterFahrer: (() => { const d = DRIVERS[0]; return d ?
          [d.name, d.team, d.pace, d.rain, d.consistency, d.experience, d.histId] : null; })()
      };
    } catch (e) { return { ok: false, err: e.message }; }
  }, JSON.stringify(saison));

  const rennen = await page.evaluate(() => {
    try {
      const sim = simulateRace(DRIVERS, 5, null);
      const top = DRIVERS.filter(d => !sim.retired[d.id])
        .map(d => ({ n: d.name, t: d.team, z: sim.cumulative[d.id] }))
        .sort((a, b) => a.z - b.z).slice(0, 5)
        .map(r => r.n + ' (' + r.t + ')');
      return { ok: true, top, dnf: Object.keys(sim.retired).length };
    } catch (e) { return { ok: false, err: e.message }; }
  });

  await browser.close();

  // ---- Auswertung ----
  const p = [];
  const pruef = (name, ist, soll) => p.push({ name, ist, soll, ok: String(ist) === String(soll) });

  pruef('Three.js geladen', lebt.three, true);
  pruef('Skript angelegt (parseF1Rpg)', lebt.parseF1Rpg, true);
  pruef('Importweg erkannt', imp.ok && /Saison/.test(imp.quelle || ''), true);
  pruef('Teamzahl', imp.teams, erwartet.teams);
  pruef('Fahrerzahl', imp.drivers, erwartet.drivers);
  pruef('Fahrer ohne Team', imp.ohneTeam, 0);
  if (imp.erstesTeam) {
    pruef('Team carSpeed', imp.erstesTeam[1], erwartet.t0[3]);
    pruef('Team reliability', imp.erstesTeam[2], erwartet.t0[4]);
    pruef('Team strategy', imp.erstesTeam[3], erwartet.t0[5]);
  }
  if (imp.ersterFahrer) {
    pruef('Fahrer pace', imp.ersterFahrer[2], erwartet.d0[5]);
    pruef('Fahrer rain', imp.ersterFahrer[3], erwartet.d0[6]);
    pruef('Fahrer consistency', imp.ersterFahrer[4], erwartet.d0[7]);
    pruef('Fahrer experience', imp.ersterFahrer[5], erwartet.d0[8]);
    pruef('Fahrer histId', imp.ersterFahrer[6], erwartet.d0[0]);
  }
  pruef('Rennen rechenbar', rennen.ok, true);

  console.log('=== ZIELFLAGGE-Import gegen SEASON_DATA ' + JAHR + ' ===\n');
  let schlecht = 0;
  p.forEach(r => {
    if (!r.ok) schlecht++;
    console.log((r.ok ? '  OK  ' : ' FEHL ') + r.name.padEnd(28) +
                'ist=' + String(r.ist).padEnd(14) + 'soll=' + r.soll);
  });
  console.log('\nQuelle erkannt als: ' + imp.quelle + ' (Jahr ' + imp.jahr + ')');
  if (imp.erstesTeam) console.log('Erstes Team : ' + JSON.stringify(imp.erstesTeam));
  if (imp.ersterFahrer) console.log('Erster Fahrer: ' + JSON.stringify(imp.ersterFahrer));
  if (rennen.ok) console.log('\nTop 5 (5 Runden): ' + rennen.top.join(', ') + '  | DNF: ' + rennen.dnf);
  else console.log('\nRennen FEHLER: ' + rennen.err);
  if (!imp.ok) console.log('\nImport FEHLER: ' + imp.err);
  console.log('\nSkriptfehler im Browser: ' + (fehler.length ? '\n  ' + fehler.join('\n  ') : 'keine'));
  console.log('\n' + (schlecht === 0 ? 'ALLES GRUEN' : schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN'));
  process.exit(schlecht === 0 && fehler.length === 0 ? 0 : 1);
})();
