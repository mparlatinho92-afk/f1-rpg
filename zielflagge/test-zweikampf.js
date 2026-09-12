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

    // ── 5. Laengs-Spielraum: Positionswechsel ja, Ergebnis nein ───────────
    resetForNewRace();
    document.getElementById('start-modus').value = 'ki';
    startRace();
    racing = true; raceClock = 0;
    const gg = Object.keys(carMeshes).filter(id => id !== player.id);
    // Reihenfolge nach PLAN (ohne Spielraum) als Referenz
    const planOrdnung = (t) => gg.filter(id => !getProgressAI(id, t).frozen)
      .map(id => { const p = getProgressAI(id, t); return { id, m: p.lap + p.frac }; })
      .sort((a, b) => b.m - a.m).map(x => x.id).join(',');
    // Reihenfolge wie SICHTBAR (mit Spielraum)
    const sichtOrdnung = (t) => gg.filter(id => !getProgressAI(id, t).frozen)
      .map(id => { const p = getProgressAI(id, t);
        return { id, m: p.lap + p.frac + ((carMeshes[id].laengsIst || 0) / trackLength) }; })
      .sort((a, b) => b.m - a.m).map(x => x.id).join(',');

    const simVorher = { c: JSON.stringify(aiSim.cumulative), r: JSON.stringify(aiSim.retired) };
    let wechselGesehen = 0, maxBand = 0;
    /* ⚠ EINHEITEN: aiAnimData[].endTime ist PLANzeit, raceClock ist RENNzeit.
       getProgressAI rechnet intern raceClock/state.aiScale. Wer bis endTime
       laufen laesst, ist bei aiScale 1,2 erst bei Runde 25 von 30 - und haelt
       dann faelschlich fuer kaputt, dass der Laengs-Spielraum noch nicht
       ausgelaufen ist. Genau das ist hier passiert. */
    const skala = state.aiScale || 1;
    const ende = Math.max.apply(null, Object.values(aiAnimData).map(a => a.endTime || 0)) * skala;
    while (raceClock < ende * 0.5) {
      raceClock += 1 / 60;
      updateAICars(raceClock, 1 / 60);
      if (Math.random() < 0.02) {
        if (planOrdnung(raceClock) !== sichtOrdnung(raceClock)) wechselGesehen++;
        gg.forEach(id => { maxBand = Math.max(maxBand, Math.abs(carMeshes[id].laengsIst || 0)); });
      }
    }
    out.wechselGesehen = wechselGesehen;
    out.maxBand = +maxBand.toFixed(1);

    // Bis zum Ziel durchlaufen: der Spielraum muss auf null auslaufen
    while (raceClock < ende + 6) { raceClock += 1 / 60; updateAICars(raceClock, 1 / 60); }
    let bandAmEnde = 0;
    gg.forEach(id => {
      if (getProgressAI(id, raceClock).frozen) return;
      bandAmEnde = Math.max(bandAmEnde, Math.abs(carMeshes[id].laengsIst || 0));
    });
    out.bandAmEnde = +bandAmEnde.toFixed(2);
    out.zielOrdnungGleich = planOrdnung(raceClock) === sichtOrdnung(raceClock);

    /* Die Wertung darf vom Spielraum nichts mitbekommen.
       ⚠ NICHT ueber "Reihenfolge nach Distanz gegen Reihenfolge nach Zeit"
          pruefen: wer im Ziel ist, steht bei lap+frac auf dem Maximum, also
          haben alle Fertigen denselben Wert und ihre Reihenfolge ist
          willkuerlich. Zwei Anlaeufe sind daran gescheitert.
       Gefragt ist, ob der Spielraum jemals in aiSim zurueckschreibt - und das
       laesst sich direkt messen: Momentaufnahme vorher gegen nachher. Aus aiSim
       baut finalizeAndShowResults die Endwertung. */
    out.wertungUnveraendert = (JSON.stringify(aiSim.cumulative) === simVorher.c)
                           && (JSON.stringify(aiSim.retired) === simVorher.r);
    return out;
  });

  const p = [];
  const pruefWahr = (name, bed, hinweis) => p.push({ name, ist: hinweis, ok: !!bed });

  // Die Zusage hat sich mit dem Laengs-Spielraum absichtlich geaendert: nicht
  // mehr "exakt auf dem Plan", sondern "innerhalb des Bandes". Was exakt bleibt,
  // ist die ENDwertung - die kommt aus aiSim und sieht den Spielraum nie.
  pruefWahr('Laengsabweichung bleibt im Band', r.maxLaengsFehler <= 12.5,
    r.maxLaengsFehler + ' m von ' + 12 + ' m erlaubt');
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
  pruefWahr('Positionswechsel im Feld', r.wechselGesehen > 0,
    r.wechselGesehen + ' Stichproben mit anderer Reihenfolge');
  pruefWahr('Spielraum bleibt im Band', r.maxBand <= 12.5, r.maxBand + ' m maximal');
  pruefWahr('Spielraum laeuft zum Ziel aus', r.bandAmEnde < 0.5, r.bandAmEnde + ' m am Ende');
  pruefWahr('Zielreihenfolge = Planreihenfolge', r.zielOrdnungGleich, 'identisch');
  pruefWahr('Wertungsdaten unveraendert', r.wertungUnveraendert,
    'aiSim vor und nach dem Rennen identisch');

  console.log('=== ZIELFLAGGE: Zweikaempfe ohne Eingriff ins Ergebnis (' + JAHR + ') ===\n');
  p.forEach(x => console.log((x.ok ? '  OK  ' : ' FEHL ') + x.name.padEnd(34) + String(x.ist)));
  console.log('\nSkriptfehler: ' + (fehler.length ? fehler.join(' | ') : 'keine'));

  await browser.close();
  const schlecht = p.filter(x => !x.ok).length;
  console.log(schlecht ? '\n' + schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN' : '\nALLES GRUEN');
  process.exit(schlecht ? 1 : 0);
})();
