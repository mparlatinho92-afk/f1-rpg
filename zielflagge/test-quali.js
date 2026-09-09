/* Misst die Streuung des Qualifyings: wie oft landet wer auf Pole?
 *   node zielflagge/test-quali.js [jahr] [laeufe]
 * Hintergrund: ein Hinterbaenkler auf Pole faellt sofort als falsch auf. Die
 * Frage ist, ob das ein Ausreisser ist oder die Streuung strukturell zu gross.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = 'file:///' + path.join(__dirname, 'index.html').replace(/\\/g, '/');
const JAHR = process.argv[2] || '1988';
const LAEUFE = +(process.argv[3] || 400);

(async () => {
  const src = fs.readFileSync(path.join(ROOT, 'data', 'seasons.js'), 'utf8');
  const SD = new Function(src + '; return SEASON_DATA;')();
  const saison = { [JAHR]: SD[JAHR] };

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(HTML, { waitUntil: 'load' });
  await page.waitForTimeout(800);

  const r = await page.evaluate(({ txt, n }) => {
    applyImportResult(parseImportedText(txt));
    // Rangliste nach reiner Staerke, ohne Zufall - das ist der Massstab
    const stark = DRIVERS.map(d => {
      const t = TEAMS[d.team] || { carSpeed: 60, strategy: 60 };
      return { id: d.id, name: d.name, team: d.team, sc: perfScore(d, t) };
    }).sort((a, b) => b.sc - a.sc);
    const rangVon = {};
    stark.forEach((x, i) => rangVon[x.id] = i + 1);

    const poles = {}, abweichung = [];
    let poleAusTop6 = 0, poleAusHinterfeld = 0;
    for (let i = 0; i < n; i++) {
      const q = qualify(DRIVERS);
      const pole = q[0];
      poles[pole.name] = (poles[pole.name] || 0) + 1;
      const rp = rangVon[pole.id];
      if (rp <= 6) poleAusTop6++;
      if (rp > DRIVERS.length / 2) poleAusHinterfeld++;
      // mittlere Rangverschiebung ueber das ganze Feld
      q.forEach((x, pos) => abweichung.push(Math.abs((pos + 1) - rangVon[x.id])));
    }
    const mittlereAbw = abweichung.reduce((a, b) => a + b, 0) / abweichung.length;
    return {
      feld: DRIVERS.length,
      staerkste: stark.slice(0, 5).map(x => x.name + ' (' + x.team + ', ' + x.sc.toFixed(1) + ')'),
      schwaechste: stark.slice(-3).map(x => x.name + ' (' + x.team + ', ' + x.sc.toFixed(1) + ')'),
      poleTop6Prozent: (poleAusTop6 / n * 100),
      poleHinterfeldProzent: (poleAusHinterfeld / n * 100),
      mittlereAbw,
      topPoles: Object.entries(poles).sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([k, v]) => k + ': ' + (v / n * 100).toFixed(1) + '%')
    };
  }, { txt: JSON.stringify(saison), n: LAEUFE });

  await browser.close();

  console.log('=== Qualifying-Streuung ' + JAHR + ', ' + LAEUFE + ' Laeufe ===\n');
  console.log('Feld: ' + r.feld + ' Fahrer');
  console.log('Staerkste nach Formel:');
  r.staerkste.forEach(x => console.log('   ' + x));
  console.log('Schwaechste:');
  r.schwaechste.forEach(x => console.log('   ' + x));
  console.log('\nPole kam aus den Top 6 der Staerke : ' + r.poleTop6Prozent.toFixed(1) + ' %');
  console.log('Pole kam aus der hinteren Haelfte  : ' + r.poleHinterfeldProzent.toFixed(1) + ' %');
  console.log('Mittlere Rangverschiebung         : ' + r.mittlereAbw.toFixed(2) + ' Plaetze');
  console.log('\nHaeufigste Polesetter:');
  r.topPoles.forEach(x => console.log('   ' + x));
})();
