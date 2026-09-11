/* Prueft, dass ZIELFLAGGE die Aera-Wagen aus wagen.js baut - und nicht mehr
 * den alten Kasten. Ohne diese Probe faellt nicht auf, wenn buildCars zwar
 * laeuft, aber auf die Ersatzgeometrie zurueckfaellt.
 *
 *   node zielflagge/test-wagen-im-spiel.js [jahr]
 *
 * Schreibt zusaetzlich einen Screenshot der Startaufstellung nach
 * zielflagge/render/spiel-grid-<jahr>.png
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = 'file:///' + path.join(__dirname, 'index.html').split(String.fromCharCode(92)).join('/');
const OUT = path.join(__dirname, 'render') + '/';
const JAHR = process.argv[2] || '1988';

function ladeSaison(jahr) {
  const src = fs.readFileSync(path.join(ROOT, 'data', 'seasons.js'), 'utf8');
  const SD = new Function(src + '; return SEASON_DATA;')();
  return { [jahr]: SD[jahr] };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const fehler = [];
  page.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') fehler.push('CONSOLE: ' + m.text()); });

  await page.goto(HTML, { waitUntil: 'load' });
  await page.waitForTimeout(900);

  const r = await page.evaluate((txt) => {
    applyImportResult(parseImportedText(txt));
    state.playerDriverId = DRIVERS[5].id;
    state.laps = 3;
    startRace();
    const autos = Object.values(carMeshes);
    const dreiecke = autos.map(m => {
      let n = 0;
      m.group.traverse(o => {
        if (o.geometry && o.geometry.attributes && o.geometry.attributes.position) {
          const g = o.geometry;
          n += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
        }
      });
      return Math.round(n);
    });
    // Farbvielfalt: wie viele verschiedene Lackfarben stehen im Feld?
    const toene = new Set();
    autos.forEach(m => m.group.traverse(o => {
      if (o.material && o.material.color) toene.add(o.material.color.getHexString());
    }));
    return {
      autos: autos.length,
      aera: autos.length ? autos[0].group.userData.aera : null,
      jahrImModell: autos.length ? autos[0].group.userData.jahr : null,
      jahrImState: state.jahr,
      trisMin: Math.min.apply(null, dreiecke),
      trisMax: Math.max.apply(null, dreiecke),
      trisSumme: dreiecke.reduce((a, b) => a + b, 0),
      farbtoene: toene.size
    };
  }, JSON.stringify(ladeSaison(JAHR)));

  const p = [];
  const pruef = (name, ist, soll) => p.push({ name, ist, ok: String(ist) === String(soll) });
  const pruefWahr = (name, bed, hinweis) => p.push({ name, ist: hinweis, ok: !!bed });

  pruefWahr('Autos gebaut', r.autos > 10, r.autos + ' Wagen');
  pruef('Jahr im Modell = State', r.jahrImModell, r.jahrImState);
  pruefWahr('Aera gesetzt', !!r.aera, r.aera || '(keine)');
  // Der alte Kasten hatte 12 (Rumpf) + 12 (Fluegel) + 4x~40 = rund 190 Dreiecke
  // und KEIN userData. Ueber 300 heisst: das Aera-Modell ist da.
  pruefWahr('Aera-Modell statt Kasten', r.trisMin > 300, r.trisMin + '-' + r.trisMax + ' Dreiecke');
  pruefWahr('Feld unter 30k Dreiecke', r.trisSumme < 30000, r.trisSumme + ' gesamt');
  pruefWahr('Mehrere Lackfarben', r.farbtoene >= 4, r.farbtoene + ' Farbtoene');

  console.log('=== ZIELFLAGGE: Aera-Wagen im Spiel (' + JAHR + ') ===\n');
  p.forEach(x => console.log((x.ok ? '  OK  ' : ' FEHL ') + x.name.padEnd(26) + String(x.ist)));
  console.log('\nAera: ' + r.aera + '   |   ' + r.autos + ' Wagen, ' + r.trisSumme + ' Dreiecke');
  console.log('Skriptfehler: ' + (fehler.length ? fehler.join(' | ') : 'keine'));

  // Countdown abwarten: sonst zeigt das Bild nur die Drei.
  await page.waitForTimeout(5200);
  await page.screenshot({ path: OUT + 'spiel-grid-' + JAHR + '.png' });
  console.log('Screenshot: ' + OUT + 'spiel-grid-' + JAHR + '.png');

  await browser.close();
  const schlecht = p.filter(x => !x.ok).length;
  console.log(schlecht ? '\n' + schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN' : '\nALLES GRUEN');
  process.exit(schlecht ? 1 : 0);
})();
