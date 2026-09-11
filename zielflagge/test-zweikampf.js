/* Prueft die seitliche Freiheit der Gegner - und vor allem, dass sie das
 * Ergebnis NICHT anfasst.
 *   node zielflagge/test-zweikampf.js [jahr]
 *
 * Der Plan legt die LAENGSposition jedes Gegners fest; daran haengt die
 * Wertung. Quer zur Bahn sagt er nichts - dort duerfen Zweikaempfe entstehen.
 * Dieser Test misst beides: dass es quer wirklich Bewegung gibt, und dass
 * laengs auf den Zentimeter nichts passiert.
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
    document.getElementById('start-modus').value = 'ki';
    startRace();
  }, JSON.stringify(ladeSaison(JAHR)));

  await page.waitForFunction(() => racing === true, null, { timeout: 15000 });

  const r = await page.evaluate(() => {
    const out = {};
    const gegner = Object.keys(carMeshes).filter(id => id !== player.id);

    /* ⚠ NICHT ueber nearestTrackInfo messen. Die Funktion sucht den global
       naechsten Streckenpunkt; auf dieser Strecke laufen Abschnitte dicht
       aneinander vorbei, und dann springt der gemeldete Streckenanteil um
       ueber hundert Meter. Gemessen wird stattdessen gegen den PLANPUNKT:
       Abstand zerlegt in laengs (Tangente) und quer (Normale). */
    const zerlege = (id, t) => {
      const prog = getProgressAI(id, t);
      const u = clamp(prog.frac, 0, 0.9999);
      const mitte = curve.getPointAt(u);
      const tan = curve.getTangentAt(u).normalize();
      const pos = carMeshes[id].group.position;
      const dx = pos.x - mitte.x, dz = pos.z - mitte.z;
      return {
        frozen: prog.frozen,
        laengs: dx * tan.x + dz * tan.z,
        quer: dx * (-tan.z) + dz * tan.x
      };
    };

    // ⚠ Startphase ueberspringen. In den ersten GRID_FADE_S Sekunden steht
    //   jeder Wagen ABSICHTLICH hinter seinem Planpunkt - das ist der
    //   Startaufstellungs-Versatz, bis zu 70 m. Wer dagegen misst, findet 88 m
    //   Laengsfehler und haelt die Garantie faelschlich fuer gebrochen.
    //   Die Zusage lautet: nach der Startphase liegt jeder Gegner exakt auf
    //   seinem Plan, und quer bewegt er sich frei.
    while (raceClock < GRID_FADE_S + 1) { raceClock += 1 / 60; updateAICars(raceClock, 1 / 60); }

    // ── 1. Die Laengsposition bleibt exakt der Plan ───────────────────────
    let maxLaengsFehler = 0;
    const querSpanne = {};
    gegner.forEach(id => { querSpanne[id] = { min: 99, max: -99 }; });
    for (let i = 0; i < 900; i++) {
      raceClock += 1 / 60;
      updateAICars(raceClock, 1 / 60);
      gegner.forEach(id => {
        const z = zerlege(id, raceClock);
        if (z.frozen) return;
        maxLaengsFehler = Math.max(maxLaengsFehler, Math.abs(z.laengs));
        const sp = querSpanne[id];
        sp.min = Math.min(sp.min, z.quer); sp.max = Math.max(sp.max, z.quer);
      });
    }
    out.maxLaengsFehler = +maxLaengsFehler.toFixed(3);
    const spannen = gegner.map(id => querSpanne[id].max - querSpanne[id].min)
      .filter(x => x > 0 && x < 50);
    out.querSpanneMittel = +(spannen.reduce((a, b) => a + b, 0) / spannen.length).toFixed(2);
    out.querSpanneMax = +Math.max.apply(null, spannen).toFixed(2);

    // ── 2. Gegner fahren nicht ineinander ─────────────────────────────────
    let paareZuNah = 0, paarePruefungen = 0;
    for (let k = 0; k < 300; k++) {
      raceClock += 1 / 60;
      updateAICars(raceClock, 1 / 60);
      if (k % 20) continue;
      for (let x = 0; x < gegner.length; x++) {
        for (let y = x + 1; y < gegner.length; y++) {
          if (getProgressAI(gegner[x], raceClock).frozen) continue;
          if (getProgressAI(gegner[y], raceClock).frozen) continue;
          paarePruefungen++;
          if (carMeshes[gegner[x]].group.position
              .distanceTo(carMeshes[gegner[y]].group.position) < 1.6) paareZuNah++;
        }
      }
    }
    out.anteilZuNah = +(paareZuNah / Math.max(paarePruefungen, 1) * 100).toFixed(2);

    // ── 3. Gegner weicht dem Spieler aus ──────────────────────────────────
    // ⚠ Waehrend der VORBEIFAHRT messen, nicht danach: bei 28 m/s ist das
    //   Ausweichfenster (10 m) nach 0,36 s vorbei, und der Wagen ist laengst
    //   auf seine Linie zurueck. Der erste Entwurf mass 1,5 s spaeter und fand
    //   0,01 m.
    state.autopilot = false;
    const g0 = gegner.find(id => !getProgressAI(id, raceClock).frozen);
    let maxAusweichen = 0;
    for (let i = 0; i < 240; i++) {
      // Spieler klebt knapp VOR dem Gegner auf dessen Linie - er muss vorbei
      const prog = getProgressAI(g0, raceClock);
      const uP = (clamp(prog.frac, 0, 0.9999) + 0.006) % 1;
      const pp = placeOnTrack(uP, carMeshes[g0].laneOffset || 0);
      player.pos.set(pp.pos.x, 0, pp.pos.z);
      player.heading = pp.heading; player.frac = uP; player.speed = 0;
      raceClock += 1 / 60;
      updateAICars(raceClock, 1 / 60);
      const z = zerlege(g0, raceClock);
      const basis = carMeshes[g0].laneOffset || 0;
      maxAusweichen = Math.max(maxAusweichen, Math.abs(z.quer - basis));
    }
    out.ausweichen = +maxAusweichen.toFixed(2);

    // ── 4. Der gemeldete Fehler: beim Start durchgereicht ─────────────────
    // Rennen neu starten, Spieler steht auf seinem Startplatz und tut nichts.
    // Frueher schob ihn das ganze Feld beim Abbau des Startversatzes beiseite.
    resetForNewRace();
    document.getElementById('start-modus').value = 'mensch';
    startRace();
    racing = true; raceClock = 0;
    const startPos = player.pos.clone();
    let kontakte = 0;
    for (let i = 0; i < 12 * 60; i++) {
      raceClock += 1 / 60;
      updatePlayer(1 / 60);
      updateAICars(raceClock, 1 / 60);
      if (player.kontakt) kontakte++;
    }
    out.startVersatz = +player.pos.distanceTo(startPos).toFixed(2);
    out.startKontakte = kontakte;
    return out;
  });

  const p = [];
  const pruefWahr = (name, bed, hinweis) => p.push({ name, ist: hinweis, ok: !!bed });

  pruefWahr('Laengsposition bleibt der Plan', r.maxLaengsFehler < 0.05,
    r.maxLaengsFehler + ' m groesste Abweichung');
  pruefWahr('Quer gibt es Bewegung', r.querSpanneMittel > 1.0,
    r.querSpanneMittel + ' m im Schnitt, ' + r.querSpanneMax + ' m maximal');
  pruefWahr('Gegner fahren nicht ineinander', r.anteilZuNah < 1.0,
    r.anteilZuNah + ' % der Paare unter 1,6 m');
  pruefWahr('Gegner weicht dem Spieler aus', r.ausweichen > 0.4,
    r.ausweichen + ' m zur Seite');
  pruefWahr('Beim Start nicht durchgereicht', r.startVersatz < 6,
    r.startVersatz + ' m verschoben in 12 s');
  pruefWahr('Kaum Rempler beim Start', r.startKontakte < 60,
    r.startKontakte + ' Bilder mit Kontakt von 720');

  console.log('=== ZIELFLAGGE: Zweikaempfe ohne Eingriff ins Ergebnis (' + JAHR + ') ===\n');
  p.forEach(x => console.log((x.ok ? '  OK  ' : ' FEHL ') + x.name.padEnd(34) + String(x.ist)));
  console.log('\nSkriptfehler: ' + (fehler.length ? fehler.join(' | ') : 'keine'));

  await browser.close();
  const schlecht = p.filter(x => !x.ok).length;
  console.log(schlecht ? '\n' + schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN' : '\nALLES GRUEN');
  process.exit(schlecht ? 1 : 0);
})();
