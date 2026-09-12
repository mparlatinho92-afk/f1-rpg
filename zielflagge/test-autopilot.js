/* Prueft das Umschalten zwischen Autopilot und selbst fahren.
 *   node zielflagge/test-autopilot.js [jahr]
 *
 * Die wichtigste Probe ist der SPRUNG beim Abgeben: der Plan sagt, wo der
 * Wagen zu einer Planzeit waere - der Spieler ist aber woanders. Ohne den
 * Zeitversatz in updateAICars wuerde der Wagen im Moment der Uebergabe auf die
 * Planposition springen. Gemessen wird deshalb die Strecke, die der Wagen im
 * ersten Bild nach dem Abgeben zuruecklegt.
 *
 * Zwei Fallen wie in test-tempo-und-ausfall.js:
 *   - racing wird erst NACH dem Startcountdown (3x800 ms) true.
 *   - racing/player sind mit "let" deklariert, stehen also NICHT auf window.
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
    document.getElementById('start-modus').value = 'mensch';
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
    out.startAlsMensch = !state.autopilot;

    // Ein Stueck selbst fahren, damit der Wagen NICHT auf der Planposition steht.
    keys['ArrowUp'] = true;
    for (let i = 0; i < 240; i++) { raceClock += 1 / 60; updatePlayer(1 / 60); }
    keys['ArrowUp'] = false;
    const vorAbgabe = player.pos.clone();

    // ── Abgeben: darf keinen Sprung ENTLANG der Strecke erzeugen ───────────
    // Seitlich ist ein Versatz unvermeidlich und gewollt: der Autopilot faehrt
    // die Ideallinie, wer daneben abgibt, muss zurueck. Die Streckenposition
    // dagegen muss auf den Meter stimmen, sonst waere der Zeitversatz falsch.
    const fracVor = player.frac;
    autopilotUebernehmen();
    out.autopilotAn = !!state.autopilot;
    out.blendLaeuft = state.uebergabeBis > raceClock;
    updateAICars(raceClock);
    const progNach = getProgressAI(player.id, raceClock - state.planVersatz);
    out.sprungBeimAbgeben = +(Math.abs(progNach.frac - fracVor) * trackLength).toFixed(2);
    // Das erste Bild muss noch nah an der eigenen Position liegen (Blend).
    out.blendStartNah = carMeshes[player.id].group.position.distanceTo(vorAbgabe) < 6;
    // Nach dem Blend sitzt der Wagen auf der Bahn.
    raceClock += 1.3;
    updateAICars(raceClock);
    out.nachBlendAufDerBahn = Math.abs(nearestTrackInfo(carMeshes[player.id].group.position).lateral) < trackHalfWidth();

    // Ein Stueck Autopilot: der Wagen muss sich bewegen und Runden zaehlen.
    const vorFahrt = carMeshes[player.id].group.position.clone();
    const rundeVorher = player.lap;
    for (let i = 0; i < 120; i++) { raceClock += 1 / 60; updateAICars(raceClock); }
    out.autopilotFaehrt = +carMeshes[player.id].group.position.distanceTo(vorFahrt).toFixed(2);

    // Lenken darf jetzt nichts bewirken.
    const vorLenk = carMeshes[player.id].group.position.clone();
    keys['ArrowLeft'] = true;
    for (let i = 0; i < 60; i++) updatePlayer(1 / 60);
    keys['ArrowLeft'] = false;
    out.lenkenIgnoriert = +carMeshes[player.id].group.position.distanceTo(vorLenk).toFixed(3);

    // ── Uebernahme: drei Sekunden, vorher keine Kontrolle ───────────────────
    selbstUebernehmen();
    out.uebernahmeAngemeldet = state.uebernahmeBis !== null;
    raceClock += 1; uebernahmeTicken();
    out.nachEinerSekundeNochAuto = !!state.autopilot;
    out.overlaySichtbar = document.getElementById('uebernahme-overlay').style.display === 'block';
    raceClock += 2.1; uebernahmeTicken();
    out.nachDreiSekundenMensch = !state.autopilot;
    out.overlayWiederWeg = document.getElementById('uebernahme-overlay').style.display === 'none';
    out.tempoBeimUebernehmen = player.speed > 1;

    // Der Wagen darf auch beim Zurueckholen nicht springen.
    const vorRueck = carMeshes[player.id].group.position.clone();
    updatePlayer(1 / 60);
    out.sprungBeimUebernehmen = +carMeshes[player.id].group.position.distanceTo(vorRueck).toFixed(2);

    // Plan fuer den Spielerwagen muss ueberhaupt existieren.
    out.planSegmente = (aiAnimData[player.id] && aiAnimData[player.id].segs.length) || 0;
    // ... und der Spieler darf NICHT im gelieferten Ausfall-Register stehen.
    out.spielerNichtAusgefallen = !(aiSim.retired && aiSim.retired[player.id]);
    return out;
  });

  // Zweiter Lauf: Rennen im Autopilot-Modus STARTEN.
  await page.evaluate(() => {
    resetForNewRace();
    document.getElementById('start-modus').value = 'ki';
    startRace();
    paused = true;   // sofort, siehe unten
  });
  await page.waitForFunction(() => racing === true, null, { timeout: 15000 });
  const r2 = await page.evaluate(() => {
    const vor = carMeshes[player.id].group.position.clone();
    for (let i = 0; i < 120; i++) { raceClock += 1 / 60; updateAICars(raceClock); }
    return {
      startAlsKi: !!state.autopilot,
      bewegtSich: +carMeshes[player.id].group.position.distanceTo(vor).toFixed(2),
      knopfText: (document.getElementById('btn-fahrer') || {}).textContent || ''
    };
  });

  const p = [];
  const pruefWahr = (name, bed, hinweis) => p.push({ name, ist: hinweis, ok: !!bed });

  pruefWahr('Start als Mensch gewaehlt', r.startAlsMensch, r.startAlsMensch ? 'ja' : 'nein');
  pruefWahr('Plan fuer den Spielerwagen', r.planSegmente > 0, r.planSegmente + ' Segmente');
  pruefWahr('Spieler faellt nicht von selbst aus', r.spielerNichtAusgefallen, 'kein DNF im Plan');
  pruefWahr('Abgeben schaltet um', r.autopilotAn, 'autopilot=' + r.autopilotAn);
  pruefWahr('Streckenposition stimmt beim Abgeben', r.sprungBeimAbgeben < 3, r.sprungBeimAbgeben + ' m laengs');
  pruefWahr('Rueckgleiten statt Springen', r.blendLaeuft && r.blendStartNah, 'Blend laeuft, erstes Bild nah');
  pruefWahr('Nach dem Blend auf der Bahn', r.nachBlendAufDerBahn, 'ja');
  pruefWahr('Autopilot bewegt den Wagen', r.autopilotFaehrt > 5, r.autopilotFaehrt + ' m in 2 s');
  pruefWahr('Lenken ohne Wirkung', r.lenkenIgnoriert < 0.01, r.lenkenIgnoriert + ' m');
  pruefWahr('Uebernahme angemeldet', r.uebernahmeAngemeldet, 'ja');
  pruefWahr('Overlay zeigt den Countdown', r.overlaySichtbar, 'sichtbar');
  pruefWahr('Nach 1 s noch Autopilot', r.nachEinerSekundeNochAuto, 'ja');
  pruefWahr('Nach 3 s faehrt der Mensch', r.nachDreiSekundenMensch, 'ja');
  pruefWahr('Overlay wieder weg', r.overlayWiederWeg, 'ja');
  pruefWahr('Uebernahme mit Schwung', r.tempoBeimUebernehmen, 'Tempo > 0');
  pruefWahr('Kein Sprung beim Uebernehmen', r.sprungBeimUebernehmen < 3, r.sprungBeimUebernehmen + ' m');
  pruefWahr('Start im Autopilot-Modus', r2.startAlsKi, 'autopilot=' + r2.startAlsKi);
  pruefWahr('Autopilot faehrt ab Start', r2.bewegtSich > 5, r2.bewegtSich + ' m in 2 s');
  pruefWahr('Knopf bietet Uebernahme an', /übernehme/i.test(r2.knopfText), r2.knopfText.trim());

  console.log('=== ZIELFLAGGE: Autopilot und Uebernahme (' + JAHR + ') ===\n');
  p.forEach(x => console.log((x.ok ? '  OK  ' : ' FEHL ') + x.name.padEnd(34) + String(x.ist)));
  console.log('\nSkriptfehler: ' + (fehler.length ? fehler.join(' | ') : 'keine'));

  await browser.close();
  const schlecht = p.filter(x => !x.ok).length;
  console.log(schlecht ? '\n' + schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN' : '\nALLES GRUEN');
  process.exit(schlecht ? 1 : 0);
})();
