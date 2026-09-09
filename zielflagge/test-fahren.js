/* Prueft Fahrmechanik, Startaufstellung und Neustart.
 *   node zielflagge/test-fahren.js
 *
 * Der Lenktest rechnet gegen die KAMERA, nicht gegen Weltkoordinaten: nur so
 * faellt auf, wenn Taste und Bildschirm auseinanderlaufen (Fehler bis .17.55:
 * links lenkte nach rechts).
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
  return { [jahr]: SD[jahr] };
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const fehler = [];
  page.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') fehler.push('CONSOLE: ' + m.text()); });

  await page.goto(HTML, { waitUntil: 'load' });
  await page.waitForTimeout(900);

  // Feld laden und Rennen starten
  const start = await page.evaluate((txt) => {
    try {
      applyImportResult(parseImportedText(txt));
      state.playerDriverId = DRIVERS[5].id;          // bewusst NICHT der Schnellste
      state.laps = 3;
      startRace();
      const slots = state.gridSlots || {};
      const backs = Object.values(slots).map(v => v.back);
      const lats = Object.values(slots).map(v => v.lateral);
      const meinPlatz = state.grid.findIndex(q => q.id === state.playerDriverId) + 1;
      return {
        ok: true,
        gridLen: state.grid.length,
        eindeutigeBacks: new Set(backs).size,
        seiten: new Set(lats).size,
        polePos: state.grid[0].name,
        meinPlatz,
        spielerAufPole: meinPlatz === 1,
        gridZeilenImUI: document.querySelectorAll('#grid-list .gridrow').length,
        markierteZeile: document.querySelectorAll('#grid-list .gridrow.me').length
      };
    } catch (e) { return { ok: false, err: e.message }; }
  }, JSON.stringify(ladeSaison(JAHR)));

  // Lenktest gegen die Kamerabasis
  const lenk = await page.evaluate(() => {
    const probe = (taste) => {
      // definierter Ausgangszustand
      player.pos.set(0, 0, 0); player.heading = 0; player.speed = 25;
      player.finished = false; player.aborted = false;
      Object.keys(keys).forEach(k => keys[k] = false);
      keys[taste] = true;

      const h0 = player.heading;
      const p0 = player.pos.clone();
      for (let i = 0; i < 12; i++) updatePlayer(1 / 60);
      keys[taste] = false;

      // Kamerabasis wie in updateCameraFrame: Kamera steht bei heading+PI hinter
      // dem Auto und blickt darauf -> Blickrichtung == Fahrtrichtung.
      const forward = new THREE.Vector3(Math.sin(h0), 0, Math.cos(h0));
      const up = new THREE.Vector3(0, 1, 0);
      const linksAufDemSchirm = new THREE.Vector3().crossVectors(up, forward).normalize();
      const versatz = player.pos.clone().sub(p0);
      return {
        dHeading: player.heading - h0,
        nachLinks: versatz.dot(linksAufDemSchirm),   // >0 = wandert nach links im Bild
        strecke: versatz.length()
      };
    };
    return { links: probe('ArrowLeft'), rechts: probe('ArrowRight') };
  });

  // Neustart
  const neu = await page.evaluate(() => {
    try {
      const vorher = state.grid.map(q => q.id).join(',');
      resetForNewRace();
      const nachReset = { player: player === null, btnStart: document.getElementById('btn-start-race').style.display };
      startRace();
      return { ok: true, nachReset, gridNeu: state.grid.length,
               reihenfolgeAnders: state.grid.map(q => q.id).join(',') !== vorher };
    } catch (e) { return { ok: false, err: e.message }; }
  });

  await browser.close();

  const p = [];
  const pruef = (name, ist, soll) => p.push({ name, ist, soll, ok: String(ist) === String(soll) });
  const pruefWahr = (name, bed, hinweis) => p.push({ name, ist: hinweis, soll: 'erfuellt', ok: !!bed });

  pruef('Rennen startbar', start.ok, true);
  pruef('Grid vollstaendig', start.gridLen, start.ok ? start.gridLen : 0);
  pruefWahr('Startplaetze gestaffelt', start.eindeutigeBacks > 4, start.eindeutigeBacks + ' Laengsstufen');
  pruef('Zwei Startspuren', start.seiten, 2);
  pruefWahr('Spieler nicht auto-Pole', !start.spielerAufPole, 'Platz ' + start.meinPlatz);
  pruef('Grid im UI gerendert', start.gridZeilenImUI, start.gridLen);
  pruef('Eigene Zeile markiert', start.markierteZeile, 1);

  pruefWahr('LINKS lenkt nach links', lenk.links.nachLinks > 0.05,
            'Versatz ' + lenk.links.nachLinks.toFixed(3));
  pruefWahr('RECHTS lenkt nach rechts', lenk.rechts.nachLinks < -0.05,
            'Versatz ' + lenk.rechts.nachLinks.toFixed(3));
  pruefWahr('Lenkung symmetrisch',
            Math.abs(lenk.links.nachLinks + lenk.rechts.nachLinks) < 0.02,
            'Differenz ' + (lenk.links.nachLinks + lenk.rechts.nachLinks).toFixed(4));

  pruef('Neustart ohne Fehler', neu.ok, true);
  pruef('reset leert den Spieler', neu.ok && neu.nachReset.player, true);
  pruefWahr('Neues Quali gewuerfelt', neu.ok && neu.reihenfolgeAnders,
            neu.ok ? (neu.reihenfolgeAnders ? 'andere Reihenfolge' : 'identisch') : '-');

  console.log('=== ZIELFLAGGE Fahren / Grid / Neustart (' + JAHR + ') ===\n');
  let schlecht = 0;
  p.forEach(r => {
    if (!r.ok) schlecht++;
    console.log((r.ok ? '  OK  ' : ' FEHL ') + r.name.padEnd(26) + String(r.ist));
  });
  console.log('\nPole: ' + start.polePos + '   |   eigener Startplatz: ' + start.meinPlatz + '. von ' + start.gridLen);
  console.log('Lenkprobe links : dHeading=' + lenk.links.dHeading.toFixed(4) +
              '  Versatz nach links=' + lenk.links.nachLinks.toFixed(3));
  console.log('Lenkprobe rechts: dHeading=' + lenk.rechts.dHeading.toFixed(4) +
              '  Versatz nach links=' + lenk.rechts.nachLinks.toFixed(3));
  if (!start.ok) console.log('\nStart FEHLER: ' + start.err);
  if (!neu.ok) console.log('\nNeustart FEHLER: ' + neu.err);
  console.log('\nSkriptfehler: ' + (fehler.length ? '\n  ' + fehler.join('\n  ') : 'keine'));
  console.log('\n' + (schlecht === 0 && !fehler.length ? 'ALLES GRUEN' : schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN'));
  process.exit(schlecht === 0 && !fehler.length ? 0 : 1);
})();
