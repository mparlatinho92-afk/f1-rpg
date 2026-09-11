/* Vermisst die Streckengeometrie: Kurvenradien, noetige Bremstempi, Laenge.
 *   node zielflagge/test-strecke.js
 *
 * Wozu: Bremspunkte entstehen nicht durch Skripte, sondern dadurch, dass die
 * Querbeschleunigung begrenzt ist. Ob das Gameplay ergibt, haengt daran, wie
 * eng die Kurven dieser Strecke im Verhaeltnis zum Hoechsttempo sind. Dieses
 * Werkzeug liefert die Zahlen dafuer - und spaeter dieselbe Auskunft fuer die
 * echten Strecken aus data/circuit-layouts.js.
 *
 * Kurvenradius aus drei Punkten (Umkreisradius): R = a*b*c / (4*Flaeche).
 * Grenztempo in einer Kurve: v = sqrt(GRIP * R).
 */
const { chromium } = require('playwright');
const path = require('path');

const HTML = 'file:///' + path.join(__dirname, 'index.html').split(String.fromCharCode(92)).join('/');
const GRIP = Number(process.argv[2] || 26);   // m/s^2 Querbeschleunigung

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const fehler = [];
  page.on('pageerror', e => fehler.push(e.message));
  await page.goto(HTML, { waitUntil: 'load' });
  await page.waitForTimeout(700);

  const r = await page.evaluate((grip) => {
    // Die Szene wird erst beim Rennstart aufgebaut; Kurve reicht aber schon.
    if (!curve) { initScene(); buildTrack(); }
    const N = 400;
    const pts = curve.getSpacedPoints(N);
    // ⚠ Stuetzweite: mit direkten Nachbarn (2,1 m Abstand) misst man das
    // Rauschen der Catmull-Rom-Kurve, nicht die Kurve. Der so ermittelte
    // Minimalradius lag bei 5,2 m - eine Haarnadel, die es gar nicht gibt.
    // Ueber rund 10 m Stuetzweite kommt der tatsaechliche Radius heraus.
    const W = Math.max(2, Math.round(N / 80));
    const radien = [];
    for (let i = 0; i < N; i++) {
      const a = pts[(i - W + N) % N], b = pts[i], c = pts[(i + W) % N];
      const ab = a.distanceTo(b), bc = b.distanceTo(c), ca = c.distanceTo(a);
      // Flaeche ueber Kreuzprodukt in der XZ-Ebene
      const flaeche = Math.abs((b.x - a.x) * (c.z - a.z) - (c.x - a.x) * (b.z - a.z)) / 2;
      radien.push(flaeche < 1e-6 ? 1e6 : (ab * bc * ca) / (4 * flaeche));
    }
    const sortiert = radien.slice().sort((x, y) => x - y);
    const q = p => sortiert[Math.floor(p * (sortiert.length - 1))];
    // Hoechsttempo wie in updatePlayer, mit mittleren Werten
    const maxSpeed = (trackLength / 24) * (0.85 + (70 + 65) / 400);
    const grenzTempo = radien.map(R => Math.sqrt(grip * R));
    // Anteil der Strecke, auf dem gebremst werden MUSS (Grenztempo unter Vmax)
    const bremsAnteil = grenzTempo.filter(v => v < maxSpeed).length / N;
    const engste = Math.sqrt(grip * sortiert[0]);
    return {
      laenge: +trackLength.toFixed(1),
      maxSpeed: +maxSpeed.toFixed(1),
      radiusMin: +sortiert[0].toFixed(1),
      radiusQ10: +q(0.10).toFixed(1),
      radiusMedian: +q(0.50).toFixed(1),
      grenzTempoEngste: +engste.toFixed(1),
      anteilEngste: +(engste / maxSpeed).toFixed(2),
      bremsAnteil: +bremsAnteil.toFixed(2)
    };
  }, GRIP);

  console.log('=== ZIELFLAGGE: Streckengeometrie (GRIP ' + GRIP + ' m/s²) ===\n');
  console.log('  Rundenlaenge        ' + r.laenge + ' m');
  console.log('  Hoechsttempo        ' + r.maxSpeed + ' m/s  (' + Math.round(r.maxSpeed * 3.6) + ' km/h)');
  console.log('  Kurvenradius min    ' + r.radiusMin + ' m');
  console.log('  Radius 10%-Quantil  ' + r.radiusQ10 + ' m');
  console.log('  Radius Median       ' + r.radiusMedian + ' m');
  console.log('  Grenztempo engste   ' + r.grenzTempoEngste + ' m/s  = ' +
    Math.round(r.anteilEngste * 100) + ' % vom Hoechsttempo');
  console.log('  Bremszonen-Anteil   ' + Math.round(r.bremsAnteil * 100) + ' % der Runde');
  console.log('\nSkriptfehler: ' + (fehler.length ? fehler.join(' | ') : 'keine'));

  // Eine Strecke ohne Bremszonen ist eine Rundbahn, keine Rennstrecke.
  const p = [];
  p.push({ n: 'Es gibt Bremszonen', ok: r.bremsAnteil > 0.05, ist: Math.round(r.bremsAnteil * 100) + ' %' });
  p.push({ n: 'Engste Kurve fordert Bremsen', ok: r.anteilEngste < 0.85, ist: Math.round(r.anteilEngste * 100) + ' %' });
  p.push({ n: 'Nicht die halbe Runde Bremszone', ok: r.bremsAnteil < 0.6, ist: Math.round(r.bremsAnteil * 100) + ' %' });
  console.log();
  p.forEach(x => console.log((x.ok ? '  OK  ' : ' FEHL ') + x.n.padEnd(32) + x.ist));

  await browser.close();
  const schlecht = p.filter(x => !x.ok).length;
  console.log(schlecht ? '\n' + schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN' : '\nALLES GRUEN');
  process.exit(schlecht ? 1 : 0);
})();
