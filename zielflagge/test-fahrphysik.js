/* Prueft die drei Bausteine des Beispiel-Gameplays:
 *   1. Haftgrenze - wer zu schnell in die Kurve faehrt, schiebt nach aussen.
 *      Daraus entstehen Bremspunkte, ohne dass sie irgendwo geskriptet sind.
 *   2. Beruehrungen mit Gegnern kosten Tempo (und nur den Spieler: die Gegner
 *      fahren ihren Plan, ihr Ergebnis steht vorher fest).
 *   3. Streckenbegrenzung - hinter der Auslaufzone steht eine Mauer.
 *
 *   node zielflagge/test-fahrphysik.js [jahr]
 *
 * ⚠ Zwei Fallen wie in den anderen Fahrtests: racing wird erst NACH dem
 *   Startcountdown true, und racing/player stehen als "let" NICHT auf window.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = 'file:///' + path.join(__dirname, 'index.html').split(String.fromCharCode(92)).join('/');
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

  await page.evaluate((txt) => {
    applyImportResult(parseImportedText(txt));
    state.playerDriverId = DRIVERS[5].id;
    state.laps = 30;
    document.getElementById('start-modus').value = 'mensch';
    startRace();
  }, JSON.stringify(ladeSaison(JAHR)));

  await page.waitForFunction(() => racing === true, null, { timeout: 15000 });

  const r = await page.evaluate(() => {
    const out = {};

    // Hilfsmittel: Wagen an eine Stelle der Bahn setzen, in Fahrtrichtung.
    const setzen = (u, tempo) => {
      const p = placeOnTrack(u, 0);
      player.pos.set(p.pos.x, 0, p.pos.z);
      player.heading = p.heading;
      player.speed = tempo;
      player.steerNow = 0;
      player.frac = u;
      Object.keys(keys).forEach(k => { keys[k] = false; });
    };
    // Engste Stelle der Strecke suchen (gleiche Rechnung wie test-strecke.js)
    const N = 400, pts = curve.getSpacedPoints(N), W = Math.round(N / 80);
    let engU = 0, engR = Infinity;
    for (let i = 0; i < N; i++) {
      const a = pts[(i - W + N) % N], b = pts[i], c = pts[(i + W) % N];
      const ab = a.distanceTo(b), bc = b.distanceTo(c), ca = c.distanceTo(a);
      const fl = Math.abs((b.x - a.x) * (c.z - a.z) - (c.x - a.x) * (b.z - a.z)) / 2;
      const R = fl < 1e-6 ? 1e6 : (ab * bc * ca) / (4 * fl);
      if (R < engR) { engR = R; engU = i / N; }
    }
    out.engsterRadius = +engR.toFixed(1);
    const grenzTempo = Math.sqrt(GRIP * engR);
    out.grenzTempo = +grenzTempo.toFixed(1);

    // ── 1a. Drehrate MUSS mit dem Tempo sinken ────────────────────────────
    const drehBei = (tempo) => {
      setzen(0.5, tempo);
      player.steerNow = 1;
      keys['ArrowLeft'] = true;
      const h0 = player.heading;
      updatePlayer(1 / 60);
      keys['ArrowLeft'] = false;
      return Math.abs(player.heading - h0) * 60;      // rad/s
    };
    out.drehLangsam = +drehBei(10).toFixed(2);
    out.drehSchnell = +drehBei(40).toFixed(2);

    // ── 1b. Welchen Radius schafft der Wagen bei welchem Tempo? ───────
    // Das IST der Bremspunkt-Mechanismus: R = v²/GRIP. Direkt gemessen statt
    // ueber eine simulierte Kurvenfahrt - die haengt an der Lenk-Heuristik des
    // Tests und daran, dass nearestTrackInfo global sucht und der
    // Streckenanteil springt, sobald der Wagen weit neben die Bahn geraet.
    const radiusBei = (tempo) => {
      setzen(0.5, tempo);
      player.steerNow = 1;
      const h0 = player.heading, p0 = player.pos.clone();
      keys['ArrowLeft'] = true;
      let weg = 0;
      for (let i = 0; i < 30; i++) {          // eine halbe Sekunde
        const vor = player.pos.clone();
        player.speed = tempo;                 // Tempo halten, Radius isolieren
        updatePlayer(1 / 60);
        weg += player.pos.distanceTo(vor);
      }
      keys['ArrowLeft'] = false;
      let dh = Math.abs(player.heading - h0);
      return dh < 1e-4 ? 1e6 : +(weg / dh).toFixed(1);
    };
    out.radiusBei40 = radiusBei(40);
    out.radiusBei20 = radiusBei(20);
    out.radiusBei12 = radiusBei(12);
    // Theorie: v²/GRIP, gedeckelt durch die maximale Lenkrate
    out.theorie40 = +Math.max(40 * 40 / GRIP, 40 / LENK_MAX).toFixed(1);

    // ── 2. Beruehrung kostet Tempo, der Gegner bleibt auf Kurs ────────────
    const gegnerId = Object.keys(carMeshes).find(id => id !== player.id);
    const g = carMeshes[gegnerId].group.position.clone();
    const gegnerVorher = g.clone();
    setzen(0.5, 30);
    player.pos.set(g.x + 0.6, 0, g.z + 0.6);         // mitten im Gegner
    const vVorher = player.speed;
    updatePlayer(1 / 60);
    out.tempoNachKontakt = +player.speed.toFixed(1);
    out.tempoVorKontakt = +vVorher.toFixed(1);
    out.kontaktErkannt = !!player.kontakt;
    out.abstandNachher = +Math.hypot(player.pos.x - g.x, player.pos.z - g.z).toFixed(2);
    out.gegnerUnbewegt = carMeshes[gegnerId].group.position.distanceTo(gegnerVorher) < 0.001;

    // ── 3. Mauer hinter der Auslaufzone ───────────────────────────────────
    const p2 = placeOnTrack(0.25, 0);
    const t2 = curve.getTangentAt(0.25).normalize();
    const n2 = new THREE.Vector3(-t2.z, 0, t2.x);
    // weit draussen starten und quer nach aussen fahren
    player.pos.set(p2.pos.x + n2.x * (trackHalfWidth() + AUSLAUF - 1),
      0, p2.pos.z + n2.z * (trackHalfWidth() + AUSLAUF - 1));
    player.heading = Math.atan2(n2.x, n2.z);
    player.speed = 35; player.steerNow = 0;
    let maxAussen = 0;
    for (let i = 0; i < 60; i++) {
      updatePlayer(1 / 60);
      maxAussen = Math.max(maxAussen, Math.abs(nearestTrackInfo(player.pos).lateral));
    }
    out.maxAussen = +maxAussen.toFixed(1);
    out.mauerBei = +(trackHalfWidth() + AUSLAUF).toFixed(1);
    return out;
  });

  const p = [];
  const pruefWahr = (name, bed, hinweis) => p.push({ name, ist: hinweis, ok: !!bed });

  pruefWahr('Drehrate sinkt mit dem Tempo', r.drehSchnell < r.drehLangsam * 0.6,
    r.drehLangsam + ' rad/s bei 10 m/s, ' + r.drehSchnell + ' bei 40');
  pruefWahr('Grenztempo unter Hoechsttempo', r.grenzTempo < 30,
    r.grenzTempo + ' m/s bei R=' + r.engsterRadius + ' m');
  pruefWahr('Radius waechst mit dem Tempo', r.radiusBei40 > r.radiusBei12 * 5,
    r.radiusBei12 + ' m bei 12 m/s, ' + r.radiusBei20 + ' bei 20, ' + r.radiusBei40 + ' bei 40');
  pruefWahr('Radius entspricht v²/GRIP', Math.abs(r.radiusBei40 - r.theorie40) < r.theorie40 * 0.15,
    r.radiusBei40 + ' m gemessen, ' + r.theorie40 + ' m erwartet');
  pruefWahr('Engste Kurve nicht voll fahrbar', r.radiusBei40 > r.engsterRadius * 3,
    'Kurve ' + r.engsterRadius + ' m, bei Vollgas nur ' + r.radiusBei40 + ' m moeglich');
  pruefWahr('Beruehrung erkannt', r.kontaktErkannt, 'ja');
  pruefWahr('Beruehrung kostet Tempo', r.tempoNachKontakt < r.tempoVorKontakt * 0.95,
    r.tempoVorKontakt + ' auf ' + r.tempoNachKontakt + ' m/s');
  pruefWahr('Wagen werden getrennt', r.abstandNachher > 2, r.abstandNachher + ' m');
  pruefWahr('Gegner bleibt auf seinem Plan', r.gegnerUnbewegt, 'unbewegt');
  pruefWahr('Mauer haelt', r.maxAussen <= r.mauerBei + 0.5,
    r.maxAussen + ' m erreicht, Mauer bei ' + r.mauerBei + ' m');

  console.log('=== ZIELFLAGGE: Fahrphysik (' + JAHR + ') ===\n');
  p.forEach(x => console.log((x.ok ? '  OK  ' : ' FEHL ') + x.name.padEnd(32) + String(x.ist)));
  console.log('\nSkriptfehler: ' + (fehler.length ? fehler.join(' | ') : 'keine'));

  await browser.close();
  const schlecht = p.filter(x => !x.ok).length;
  console.log(schlecht ? '\n' + schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN' : '\nALLES GRUEN');
  process.exit(schlecht ? 1 : 0);
})();
