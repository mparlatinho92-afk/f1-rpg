/* Prueft den Import eines ECHTEN Spielstands (NDJSON aus window.exportSave).
 *   node zielflagge/test-spielstand.js                    -> synthetischer Stand
 *   node zielflagge/test-spielstand.js "C:/pfad/save.json" -> echte Datei
 *
 * Diese Luecke hat den Reserve-Fehler durchgelassen: test-import.js prueft nur
 * SEASON_DATA, nie das NDJSON-Format. Dort ist die core-Zeile VERSCHACHTELT
 * ({_t:'core', state:{...}}) - ohne Auspacken faellt der Import stumm auf die
 * Rate-Heuristik zurueck und zieht reservePool und Historie mit herein.
 *
 * Erkennungsmerkmal im Ergebnis: Teams stehen als ID ("MCL") statt als Name,
 * und "Unbekanntes Team" taucht auf.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = 'file:///' + path.join(__dirname, 'index.html').replace(/\\/g, '/');
const DATEI = process.argv[2] || null;

/* Baut einen Spielstand in exakt der Form, die exportSave erzeugt. */
function baueStand() {
  const src = fs.readFileSync(path.join(ROOT, 'data', 'seasons.js'), 'utf8');
  const SD = new Function(src + '; return SEASON_DATA;')();
  const sd = SD['1988'];
  const teams = sd.t.map(t => ({
    id: t[0], name: t[1], color: t[2],
    carSpeed: t[3], reliability: t[4], strategy: t[5], histId: t[1]
  }));
  const drivers = sd.d.map(d => ({
    id: d[0], histId: d[1].toLowerCase().replace(/ /g, '-'), name: d[1], team: d[2],
    nation: d[3], birthYear: d[4], pace: d[5], rain: d[6],
    consistency: d[7], experience: d[8], starts: d[9], status: 'active'
  }));
  // Reservepool: muss beim Import KOMPLETT draussen bleiben
  const reservePool = Array.from({ length: 40 }, (_, i) => ({
    id: 'reserve-' + i, name: 'Reservist ' + (i + 1), team: null,
    pace: 40 + i % 30, rain: 50, consistency: 50, experience: 20,
    isReserve: true, poolGroup: 'A', status: 'active'
  }));
  // ausserdem ein Fahrer, der im aktiven Feld steht, aber als Reserve markiert ist
  drivers.push({
    id: 'schleichender', name: 'Schleichender Reservist', team: sd.t[0][0],
    pace: 50, rain: 50, consistency: 50, experience: 10, isReserve: true, status: 'active'
  });
  // und einer mit einem Team, das es nicht gibt
  drivers.push({
    id: 'geisterfahrer', name: 'Geisterfahrer', team: 'GIBTSNICHT',
    pace: 50, rain: 50, consistency: 50, experience: 10, status: 'active'
  });
  const kopf = { _format: 'f1rpg-ndjson', _v: 1, exportVersion: '0.9.17.55', currentYear: 1988, currentRace: 1, seasons: 0 };
  const core = { _t: 'core', state: { version: '0.9.17.55', currentYear: 1988, currentRace: 1, teams, drivers, reservePool, driverStandings: {} } };
  return { text: JSON.stringify(kopf) + '\n' + JSON.stringify(core) + '\n', echteTeams: teams.length, echteFahrer: sd.d.length };
}

(async () => {
  let text, erwartetTeams = null, erwartetFahrer = null, quelle;
  if (DATEI) {
    text = fs.readFileSync(DATEI, 'utf8');
    quelle = path.basename(DATEI);
    const zeilen = text.split('\n').filter(Boolean);
    const core = JSON.parse(zeilen[1]);
    const st = core.state || core;
    erwartetTeams = st.teams.length; erwartetFahrer = st.drivers.length;
    console.log('Datei: ' + quelle + ' (' + st.teams.length + ' Teams, ' +
      st.drivers.length + ' aktive Fahrer, ' + (st.reservePool || []).length + ' Reserven)\n');
  } else {
    const b = baueStand();
    text = b.text; erwartetTeams = b.echteTeams; erwartetFahrer = b.echteFahrer;
    quelle = 'synthetischer Stand 1988';
    console.log('Synthetischer Stand: ' + b.echteTeams + ' Teams, ' + b.echteFahrer +
      ' aktive Fahrer, 40 Reserven + 1 getarnte Reserve + 1 Geisterfahrer\n');
  }

  // IDs und Namen der Teams aus dem Stand ziehen - Massstab fuer die Aufloesung
  const _zeilen = text.split(String.fromCharCode(10)).filter(Boolean);
  const _core = JSON.parse(_zeilen[1]);
  const _st = _core.state || _core;
  const idListe = (_st.teams || []).map(t => t.id);
  const nameListe = (_st.teams || []).map(t => t.name);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const fehler = [];
  page.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
  await page.goto(HTML, { waitUntil: 'load' });
  await page.waitForTimeout(900);

  const r = await page.evaluate(txt => {
    try {
      const res = parseImportedText(txt);
      applyImportResult(res);
      const namen = Object.keys(TEAMS);
      return {
        ok: true, quelle: res.quelle || null, jahr: res.jahr,
        teams: res.teams.length, drivers: res.drivers.length,
        teamNamen: namen.slice(0, 6),
        // Gegen die ECHTEN Namen des Stands pruefen statt gegen ein Muster:
        // AGS, BRM und ATS sind echte Teamnamen in Grossbuchstaben, ein
        // Regex-Test darauf schlaegt faelschlich an.
        namenAlle: namen,
        unbekannt: namen.filter(n => /Unbekannt|Ohne Team/i.test(n)).length,
        reservenDrin: DRIVERS.filter(d => /Reservist/i.test(d.name)).length,
        geisterDrin: DRIVERS.filter(d => /Geisterfahrer/i.test(d.name)).length,
        meldung: importMeldung(res)
      };
    } catch (e) { return { ok: false, err: e.message }; }
  }, text);

  await browser.close();

  const p = [];
  const pr = (name, ist, soll) => p.push({ name, ist, soll, ok: String(ist) === String(soll) });
  pr('Import laeuft', r.ok, true);
  pr('Als Spielstand erkannt', /Spielstand/.test(r.quelle || ''), true);
  // Ein Name, der als ID im Stand vorkommt, aber nicht als Name -> Aufloesung kaputt
  const idsImStand = new Set(idListe);
  const namenImStand = new Set(nameListe);
  const alsIdGelandet = (r.namenAlle || []).filter(n => idsImStand.has(n) && !namenImStand.has(n));
  pr('Teams als Name, nicht als ID', alsIdGelandet.length, 0);
  if (alsIdGelandet.length) console.log('   betroffen: ' + alsIdGelandet.join(', '));
  pr('Kein "Unbekanntes Team"', r.unbekannt, 0);
  pr('Reserven draussen', r.reservenDrin, 0);
  pr('Geisterfahrer draussen', r.geisterDrin, 0);
  if (erwartetTeams !== null && !DATEI) pr('Teamzahl', r.teams, erwartetTeams);
  if (erwartetFahrer !== null && !DATEI) pr('Fahrerzahl', r.drivers, erwartetFahrer);

  console.log('=== Spielstand-Import: ' + quelle + ' ===\n');
  let schlecht = 0;
  p.forEach(x => { if (!x.ok) schlecht++; console.log((x.ok ? '  OK  ' : ' FEHL ') + x.name.padEnd(26) + 'ist=' + x.ist + '  soll=' + x.soll); });
  console.log('\nMeldung im UI : ' + r.meldung);
  console.log('Erste Teams   : ' + (r.teamNamen || []).join(', '));
  if (!r.ok) console.log('FEHLER: ' + r.err);
  console.log('\nSkriptfehler  : ' + (fehler.length ? fehler.join('\n  ') : 'keine'));
  console.log('\n' + (schlecht === 0 && !fehler.length ? 'ALLES GRUEN' : schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN'));
  process.exit(schlecht === 0 && !fehler.length ? 0 : 1);
})();
