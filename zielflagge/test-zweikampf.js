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
const { festerZufall } = require('./test-hilfe');

const ROOT = path.join(__dirname, '..');
const HTML = 'file:///' + path.join(__dirname, 'index.html').split(String.fromCharCode(92)).join('/');
const JAHR = process.argv[2] || '1988';
const SAMEN = Number(process.argv[3] || 20260912);

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

  // Fester Zufallssamen: sonst tastet jeder Lauf ein anderes Rennen ab
  // und dieselbe Pruefung ist mal gruen, mal rot (siehe test-hilfe.js).
  await festerZufall(page, SAMEN);
  await page.goto(HTML, { waitUntil: 'load' });
  await page.waitForTimeout(900);

  await page.evaluate((txt) => {
    applyImportResult(parseImportedText(txt));
    state.playerDriverId = DRIVERS[5].id;
    state.laps = 30;
    document.getElementById('start-modus').value = 'ki';
    startRace();
    paused = true;   // sofort, siehe unten
  }, JSON.stringify(ladeSaison(JAHR)));

  await page.waitForFunction(() => racing === true, null, { timeout: 15000 });
  /* ⚠ Die Hauptschleife ist schon beim startRace() angehalten worden.
     Sie laeuft ueber requestAnimationFrame
     in Echtzeit weiter und schiebt raceClock vor, waehrend der Test sie
     gleichzeitig von Hand taktet. Wie viele Bilder dazwischenkommen, haengt an
     der Wanduhr - dann schwankt das Ergebnis trotz festem Zufallssamen.
     ⚠ Erst NACH dem Countdown anzuhalten genuegt nicht: zwischen "racing wird
     true" und dem Anhalten liegen je nach Rechnerlaune ein paar Bilder. */
  await page.evaluate(() => { paused = true; });   // Absicherung

  const r = await page.evaluate(() => {
    const out = {};
    const gegner = Object.keys(carMeshes).filter(id => id !== player.id);

    /* ⚠ NICHT ueber nearestTrackInfo messen. Die Funktion sucht den global
       naechsten Streckenpunkt; auf dieser Strecke laufen Abschnitte dicht
       aneinander vorbei, und dann springt der gemeldete Streckenanteil um
       ueber hundert Meter. Gemessen wird stattdessen gegen den PLANPUNKT:
       Abstand zerlegt in laengs (Tangente) und quer (Normale). */
    /* ⚠ Seit die Gegner selbst fahren, liegt ihr Wagen NICHT mehr am Planpunkt.
       Eine Projektion gegen den Planpunkt vermischt deshalb Laengsabweichung
       mit Querlage und liefert Unsinn (gemessen: 66 m "quer" auf einer 15 m
       breiten Bahn). Laengs wird jetzt aus dem Fortschritt gerechnet, quer
       direkt aus cm.seitlich - dem Wert, der die Querlage IST. */
    const zerlege = (id, t) => {
      const prog = getProgressAI(id, t);
      const cm = carMeshes[id];
      const fort = (cm.fortschritt !== undefined) ? cm.fortschritt : (prog.lap + prog.frac);
      return {
        frozen: prog.frozen,
        laengs: (fort - (prog.lap + prog.frac)) * trackLength,
        quer: (cm.seitlich !== undefined) ? cm.seitlich : 0
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
    /* 60 s statt 15 s abtasten. Mit dem stehenden Start beschleunigt das Feld
       die ersten Sekunden nur geradeaus - in einem so kurzen Fenster gibt es
       kaum Begegnungen, und die Querbewegung sieht kleiner aus als sie ist. */
    for (let i = 0; i < 3600; i++) {
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

    // ── 2b. Zittern messen: Richtungswechsel der Querbewegung je Sekunde ──
    // Ein Rennwagen wechselt die Querrichtung vielleicht ein- bis zweimal je
    // Sekunde. Flimmert die Seitenwahl, sind es zehn und mehr.
    /* ⚠ MIT TOTBAND zaehlen. Jeder Vorzeichenwechsel zaehlt sonst mit, auch
       einer von 10^-9 m: liegt der geglaettete Wert auf seinem Ziel, flackert
       das Vorzeichen allein durch Rundung, und die Messung meldet 8 Wechsel je
       Sekunde, wo optisch nichts passiert. Gezaehlt wird eine Richtungsumkehr
       erst, wenn seit der letzten Umkehr mindestens 5 cm zurueckgelegt wurden -
       darunter sieht man ohnehin nichts. */
    const letzte = {}, wechsel = {}, richt = {}, weg = {};
    gegner.forEach(id => { letzte[id] = null; wechsel[id] = 0; richt[id] = 0; weg[id] = 0; });
    const sekunden = 6;
    for (let k = 0; k < sekunden * 60; k++) {
      raceClock += 1 / 60;
      updateAICars(raceClock, 1 / 60);
      gegner.forEach(id => {
        if (getProgressAI(id, raceClock).frozen) return;
        const q = carMeshes[id].seitlich;
        if (q === undefined) return;
        if (letzte[id] !== null) {
          const d = q - letzte[id];
          const r = Math.sign(d);
          if (r !== 0) {
            if (richt[id] !== 0 && r !== richt[id]) {
              if (weg[id] >= 0.05) wechsel[id]++;
              weg[id] = 0;
            }
            weg[id] += Math.abs(d);
            richt[id] = r;
          }
        }
        letzte[id] = q;
      });
    }
    const proSek = gegner.map(id => wechsel[id] / sekunden).sort((a, b) => a - b);
    out.zitternMittel = +(proSek.reduce((a, b) => a + b, 0) / proSek.length).toFixed(2);
    out.zitternMax = +proSek[proSek.length - 1].toFixed(2);
    // 90. Perzentil statt Maximum: EIN Wagen, der gerade um eine Position
    // kaempft, lenkt zu Recht oefter hin und her. Zittern waere, wenn das FELD
    // es tut.
    out.zittern90 = +proSek[Math.floor(proSek.length * 0.9)].toFixed(2);

    // ── 2c. Nase im Heck: kleinster Laengsabstand seitlich fluchtender Wagen ─
    let engsterHintereinander = 999;
    for (let k = 0; k < 300; k++) {
      raceClock += 1 / 60;
      updateAICars(raceClock, 1 / 60);
      if (k % 15) continue;
      for (let x = 0; x < gegner.length; x++) {
        for (let y = 0; y < gegner.length; y++) {
          if (x === y) continue;
          const A = carMeshes[gegner[x]], B = carMeshes[gegner[y]];
          if (A.planU === undefined || B.planU === undefined) continue;
          if (getProgressAI(gegner[x], raceClock).frozen) continue;
          if (getProgressAI(gegner[y], raceClock).frozen) continue;
          if (Math.abs((A.seitlich || 0) - (B.seitlich || 0)) > 1.8) continue;
          const dl = laengsAbstand(B.planU, A.planU);
          if (dl > 0 && dl < engsterHintereinander) engsterHintereinander = dl;
        }
      }
    }
    out.engsterHintereinander = +engsterHintereinander.toFixed(2);

    // ── 3. Gegner weicht dem Spieler aus ──────────────────────────────────
    // ⚠ Waehrend der VORBEIFAHRT messen, nicht danach: bei 28 m/s ist das
    //   Ausweichfenster (10 m) nach 0,36 s vorbei, und der Wagen ist laengst
    //   auf seine Linie zurueck. Der erste Entwurf mass 1,5 s spaeter und fand
    //   0,01 m.
    state.autopilot = false;
    const g0 = gegner.find(id => !getProgressAI(id, raceClock).frozen);
    let maxAusweichen = 0;
    for (let i = 0; i < 240; i++) {
      /* Spieler klebt knapp VOR dem Gegner auf dessen Linie - er muss vorbei.
         ⚠ An dessen TATSAECHLICHE Position setzen, nicht an die Planposition:
         seit die Gegner selbst fahren, koennen die hunderte Meter auseinander
         liegen. Der erste Entwurf setzte den Spieler an den Planpunkt und mass
         darum 0 m Ausweichen - der Gegner kam nie vorbei. */
      const cmg = carMeshes[g0];
      const uG = ((cmg.fortschritt % 1) + 1) % 1;
      const uP = (uG + 0.006) % 1;
      const pp = placeOnTrack(uP, cmg.seitlich || 0);
      player.pos.set(pp.pos.x, 0, pp.pos.z);
      player.heading = pp.heading; player.frac = uP; player.speed = 0;
      raceClock += 1 / 60;
      updateAICars(raceClock, 1 / 60);
      const basis = carMeshes[g0].laneOffset || 0;
      maxAusweichen = Math.max(maxAusweichen, Math.abs((carMeshes[g0].seitlich || 0) - basis));
    }
    out.ausweichen = +maxAusweichen.toFixed(2);

    // ── 4. Der gemeldete Fehler: beim Start durchgereicht ─────────────────
    // Rennen neu starten, Spieler steht auf seinem Startplatz und tut nichts.
    // Frueher schob ihn das ganze Feld beim Abbau des Startversatzes beiseite.
    resetForNewRace();
    document.getElementById('start-modus').value = 'mensch';
    startRace();
    paused = true;   // sofort, siehe unten
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
    paused = true;   // sofort, siehe unten
    racing = true; raceClock = 0;
    const gg = Object.keys(carMeshes).filter(id => id !== player.id);
    // Reihenfolge nach PLAN (ohne Spielraum) als Referenz
    const planOrdnung = (t) => gg.filter(id => !getProgressAI(id, t).frozen)
      .map(id => { const p = getProgressAI(id, t); return { id, m: p.lap + p.frac }; })
      .sort((a, b) => b.m - a.m).map(x => x.id).join(',');
    // Reihenfolge wie SICHTBAR - aus dem tatsaechlich gefahrenen Fortschritt
    const sichtOrdnung = (t) => gg.filter(id => !getProgressAI(id, t).frozen)
      .map(id => ({ id, m: carMeshes[id].fortschritt !== undefined
        ? carMeshes[id].fortschritt
        : (getProgressAI(id, t).lap + getProgressAI(id, t).frac) }))
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
        gg.forEach(id => { const pr = getProgressAI(id, raceClock);
          const d = ((carMeshes[id].fortschritt || 0) - (pr.lap + pr.frac)) * trackLength;
          maxBand = Math.max(maxBand, Math.abs(d)); });
      }
    }
    out.wechselGesehen = wechselGesehen;
    out.maxBand = +maxBand.toFixed(1);
    out.trackLaenge = +trackLength.toFixed(0);

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

    /* ── 6. Niemand bleibt einfach stehen ────────────────────────────────
       Vom Nutzer gemeldet: "drei NICHT-ausgeschiedene bleiben einfach auf der
       strecke stehen." Ursache war ein Zaehlfehler an der Ziellinie - der
       Spieler wurde unter Autopilot nie als im Ziel erkannt, sein Wagen stand
       fuer immer auf der Linie, und weil die Gegner fuer ihn bremsen, stand
       kurz darauf das ganze Feld dahinter. Kurzes Rennen, ganz durchfahren. */
    resetForNewRace();
    document.getElementById('start-modus').value = 'ki';
    startRace();
    paused = true;
    state.laps = 5;
    racing = true; raceClock = 0;
    const g5 = Object.keys(carMeshes).filter(id => id !== player.id);
    for (let i = 0; i < 60 * 260; i++) {
      raceClock += 1 / 60;
      updateAICars(raceClock, 1 / 60);
    }
    out.stehenGeblieben = g5.filter(id =>
      (carMeshes[id].tempo || 0) < 1 && !aiSim.retired[id]).length;
    out.alleImZiel = g5.filter(id => carMeshes[id].imZiel || aiSim.retired[id]).length;
    out.feldGroesse = g5.length;
    out.spielerImZiel = !!player.finished;
    return out;
  });

  const trackLaenge = r.trackLaenge || 1293;
  const p = [];
  const pruefWahr = (name, bed, hinweis) => p.push({ name, ist: hinweis, ok: !!bed });

  // Die Zusage hat sich mit dem Laengs-Spielraum absichtlich geaendert: nicht
  // mehr "exakt auf dem Plan", sondern "innerhalb des Bandes". Was exakt bleibt,
  // ist die ENDwertung - die kommt aus aiSim und sieht den Spielraum nie.
  /* ⚠ Das Laengs-BAND gibt es seit dem 12.09.2026 nicht mehr. Die Gegner
     fahren selbst; ihre Abweichung vom Plan ist kein Fehler, sondern der Zweck.
     Geprueft wird nur noch, dass sie nicht davonlaufen: mehr als eine halbe
     Runde Abstand zum Plan hiesse, der Regler haelt den Rahmen nicht mehr.
     Wie stark das Rennen die Lieferung verschiebt, misst test-lieferung.js. */
  pruefWahr('Gegner laufen dem Plan nicht davon', r.maxLaengsFehler < trackLaenge * 0.5,
    r.maxLaengsFehler + ' m von ' + Math.round(trackLaenge * 0.5) + ' m erlaubt');
  /* Am MAXIMUM messen, nicht am Mittel. Im freien Modell verteilt sich das
     Feld: in manchen Rennen begegnen sich kaum zwei Wagen, dann ist der
     Mittelwert klein, ohne dass etwas kaputt waere. Die Frage lautet, ob
     Querbewegung ueberhaupt stattfindet - dafuer genuegt EIN Wagen. */
  pruefWahr('Quer gibt es Bewegung', r.querSpanneMax > 1.0,
    r.querSpanneMittel + ' m im Schnitt, ' + r.querSpanneMax + ' m maximal');
  pruefWahr('Gegner fahren nicht ineinander', r.anteilZuNah < 1.0,
    r.anteilZuNah + ' % der Paare unter 1,6 m');
  pruefWahr('Gegner weicht dem Spieler aus', r.ausweichen > 0.4,
    r.ausweichen + ' m zur Seite');
  pruefWahr('Kein Zittern', r.zitternMittel < 2 && r.zittern90 < 4,
    r.zitternMittel + '/s im Schnitt, ' + r.zittern90 + ' im 90. Perzentil, '
    + r.zitternMax + ' maximal');
  pruefWahr('Keine Nase im Heck', r.engsterHintereinander > 4.0,
    r.engsterHintereinander + ' m engster Abstand hintereinander');
  pruefWahr('Beim Start nicht durchgereicht', r.startVersatz < 6,
    r.startVersatz + ' m verschoben in 12 s');
  pruefWahr('Kaum Rempler beim Start', r.startKontakte < 60,
    r.startKontakte + ' Bilder mit Kontakt von 720');
  pruefWahr('Positionswechsel im Feld', r.wechselGesehen > 0,
    r.wechselGesehen + ' Stichproben mit anderer Reihenfolge');
  /* Nur noch eine Ausreisser-Schranke, keine Rahmen-Pruefung.
     Wie stark das Rennen die Lieferung verschiebt, misst test-lieferung.js
     direkt und in der richtigen Einheit (Plaetze, nicht Meter): dort sind es
     0,38 Plaetze im Schnitt. Hier geht es nur darum, dass der Regler nicht
     davonlaeuft - drei Runden Rueckstand waeren ein kaputter Regler, zwei sind
     ein Wagen, der im Verkehr steckt. */
  pruefWahr('Regler laeuft nicht davon', r.maxBand < r.trackLaenge * 3,
    r.maxBand + ' m, entspricht ' + (r.maxBand / r.trackLaenge).toFixed(2) + ' Runden');
  pruefWahr('Wertungsdaten unveraendert', r.wertungUnveraendert,
    'aiSim vor und nach dem Rennen identisch');
  pruefWahr('Niemand bleibt stehen', r.stehenGeblieben === 0,
    r.stehenGeblieben + ' Wagen mit Tempo 0, nicht ausgefallen');
  pruefWahr('Alle kommen an', r.alleImZiel === r.feldGroesse,
    r.alleImZiel + ' von ' + r.feldGroesse);
  pruefWahr('Spieler kommt unter Autopilot an', r.spielerImZiel, 'ja');

  console.log('=== ZIELFLAGGE: Zweikaempfe ohne Eingriff ins Ergebnis (' + JAHR + ') ===\n');
  p.forEach(x => console.log((x.ok ? '  OK  ' : ' FEHL ') + x.name.padEnd(34) + String(x.ist)));
  console.log('\nSkriptfehler: ' + (fehler.length ? fehler.join(' | ') : 'keine'));

  await browser.close();
  const schlecht = p.filter(x => !x.ok).length;
  console.log(schlecht ? '\n' + schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN' : '\nALLES GRUEN');
  process.exit(schlecht ? 1 : 0);
})();
