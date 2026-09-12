/* Prueft zwei Regeln, die der Nutzer gesetzt hat:
 *   1. Selbst fahren ist IMMER Echtzeit - Zeitraffer gilt nur dem Feld.
 *   2. Ausgefallene Wagen stehen nicht mehr auf der Ideallinie.
 *
 *   node zielflagge/test-tempo-und-ausfall.js [jahr]
 *
 * Die Echtzeit-Probe misst den zurueckgelegten Weg des eigenen Wagens bei
 * gleichem dt und verschiedenen raceSpeed-Werten. Frueher skalierte
 * animateLoop auch updatePlayer mit - bei 2x beschleunigte der eigene Wagen
 * doppelt so schnell.
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

  // Rennen aufsetzen. 30 Runden, damit ueberhaupt jemand ausfaellt - mit drei
  // Runden bleibt das Feld vollstaendig und die Ausfall-Probe misst nichts.
  await page.evaluate((txt) => {
    applyImportResult(parseImportedText(txt));
    state.playerDriverId = DRIVERS[5].id;
    state.laps = 30;
    startRace();
    paused = true;   // sofort, siehe unten
  }, JSON.stringify(ladeSaison(JAHR)));

  // ⚠ Zwei Fallen auf einmal, beide beim ersten Entwurf getreten:
  //   1. racing wird erst NACH dem Countdown (3x800 ms) true. Wer vorher misst,
  //      findet spielerFaehrt()===false und haelt die Echtzeit-Sperre
  //      faelschlich fuer kaputt.
  //   2. racing ist mit "let" deklariert und landet damit NICHT auf window -
  //      window.racing ist immer undefined. Ohne Praefix abfragen.
  //      (Dieselbe Falle wie liveRaceState im Hauptprojekt, siehe CLAUDE.md.)
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
    // ── Regel 1: Weg des eigenen Wagens haengt NICHT an raceSpeed ──────────
    // Vollstaendig gleicher Ausgangszustand, nur raceSpeed unterscheidet sich.
    const p0 = player.pos.clone(), h0 = player.heading;
    const wegBei = (tempo) => {
      raceSpeed = tempo;
      player.pos.copy(p0); player.heading = h0;
      player.speed = 0; player.lap = 0; player.frac = 0;
      // ⚠ Auch den Ausweichimpuls zuruecksetzen: er ueberlebt sonst den
      // ersten Durchgang und verfaelscht den zweiten um 0,6 %.
      if (player.schub) player.schub.set(0, 0, 0);
      keys['ArrowUp'] = true;
      for (let i = 0; i < 60; i++) updatePlayer(1 / 60);   // genau 1 Sekunde
      keys['ArrowUp'] = false;
      return player.pos.distanceTo(p0);
    };
    const weg1 = wegBei(1);
    const weg10 = wegBei(10);
    player.pos.copy(p0); player.heading = h0; player.speed = 0;

    // setSpeed darf waehrend der Fahrt gar nicht erst hochschalten
    raceSpeed = 1;
    setSpeed(10);
    // ⚠ tempoKnoepfeAktualisieren laeuft sonst in der Hauptschleife - die ist
    //   im Test angehalten, damit die Messung reproduzierbar bleibt.
    tempoKnoepfeAktualisieren();
    const tempoNachKlick = raceSpeed;
    const hinweis = (document.getElementById('tempo-info') || {}).textContent || '';
    const gesperrteKnoepfe = Array.from(document.querySelectorAll('.speedbtn'))
      .filter(b => +b.dataset.speed > 1 && b.disabled).length;

    // ── Regel 2: Ausgefallene stehen neben der Bahn ────────────────────────
    /* ⚠ EINHEITEN: endTime ist PLANzeit, raceClock ist RENNzeit, dazwischen
       steht state.aiScale (getProgressAI rechnet raceClock/aiScale). Ohne die
       Streckung misst man bei aiScale 1,22 nur 82 % des Plans - dort faehrt
       ein Fahrer, der spaeter ausfaellt, noch, wird von diesem Test aber schon
       als ausgefallen gezaehlt. Ergebnis: "Ausgefallener steht ueber einem
       Fahrenden" in 3 von 5 Laeufen. */
    const ende = Math.max.apply(null, Object.values(aiAnimData).map(a => a.endTime || 0))
      * (state.aiScale || 1);
    updateAICars(ende + 5);
    const halb = trackHalfWidth();
    let ausgefallen = 0, aufDerLinie = 0, amRand = 0;
    for (const id in carMeshes) {
      if (player && id === player.id) continue;
      if (!(aiSim.retired && aiSim.retired[id])) continue;
      const prog = getProgressAI(id, ende + 5);
      if (!prog.frozen) continue;
      ausgefallen++;
      const info = nearestTrackInfo(carMeshes[id].group.position);
      if (Math.abs(info.lateral) > halb) amRand++; else aufDerLinie++;
    }

    // ── Regel 3: Klassement ────────────────────────────────────
    // Mitten im Rennen darf niemand als "Ausfall" markiert sein, der noch faehrt.
    raceClock = ende * 0.35;
    updateAICars(raceClock); tickHudAndLeaderboard(raceClock);
    let etikettZuFrueh = 0;
    Array.from(document.querySelectorAll('.leaderboard-row')).forEach(el => {
      if (el.querySelector('.gap').textContent.trim() !== 'Ausfall') return;
      const nm = el.querySelector('.name').textContent.trim();
      const d = (state.starters || DRIVERS).find(x => nm.indexOf(x.name) >= 0);
      if (d && !getProgressAI(d.id, raceClock).frozen) etikettZuFrueh++;
    });
    // Am Ende: Ausgefallene unten, untereinander nach gefahrener Distanz.
    raceClock = ende + 5;
    updateAICars(raceClock); tickHudAndLeaderboard(raceClock);
    const zeilen = Array.from(document.querySelectorAll('.leaderboard-row')).map((el, i) => {
      const nm = el.querySelector('.name').textContent.trim();
      const d = (state.starters || DRIVERS).find(x => nm.indexOf(x.name) >= 0);
      // Nur wer WIRKLICH SCHON draussen ist, zaehlt als ausgefallen - nicht,
      // wer irgendwann ausfaellt.
      const rr = d && aiSim.retired[d.id] && getProgressAI(d.id, raceClock).frozen
        ? aiSim.retired[d.id] : null;
      return { i, ausgefallen: !!rr, runde: rr ? rr.lap : null };
    });
    const letzterFahrende = Math.max.apply(null, zeilen.filter(z => !z.ausgefallen).map(z => z.i));
    const ausUeberFahrenden = zeilen.filter(z => z.ausgefallen && z.i < letzterFahrende).length;
    const runden = zeilen.filter(z => z.ausgefallen).map(z => z.runde);
    let absteigend = true;
    for (let i = 1; i < runden.length; i++) if (runden[i] > runden[i - 1]) absteigend = false;

    return {
      etikettZuFrueh, ausUeberFahrenden, runden, absteigend,
      weg1: +weg1.toFixed(3), weg10: +weg10.toFixed(3),
      tempoNachKlick, hinweis: hinweis.length > 0, gesperrteKnoepfe,
      ausgefallen, aufDerLinie, amRand,
      stufen: document.querySelectorAll('.speedbtn').length
    };
  });

  const p = [];
  const pruefWahr = (name, bed, hinweis) => p.push({ name, ist: hinweis, ok: !!bed });

  pruefWahr('Vier Tempo-Stufen', r.stufen === 4, r.stufen + ' Knoepfe');
  pruefWahr('Eigener Weg unabhaengig vom Tempo',
    Math.abs(r.weg1 - r.weg10) < 0.01, r.weg1 + ' m bei 1x, ' + r.weg10 + ' m bei 10x');
  pruefWahr('Hochschalten waehrend der Fahrt gesperrt', r.tempoNachKlick === 1,
    'raceSpeed blieb ' + r.tempoNachKlick);
  pruefWahr('Sperre wird begruendet', r.hinweis, r.hinweis ? 'Hinweis steht' : 'kein Hinweis');
  pruefWahr('Hoehere Stufen ausgegraut', r.gesperrteKnoepfe === 3, r.gesperrteKnoepfe + ' von 3 gesperrt');
  pruefWahr('Ausfaelle vorhanden', r.ausgefallen > 0, r.ausgefallen + ' ausgefallen');
  pruefWahr('Keiner steht auf der Ideallinie', r.aufDerLinie === 0,
    r.amRand + ' am Rand, ' + r.aufDerLinie + ' auf der Linie');
  pruefWahr('Kein "Ausfall" bei Fahrenden', r.etikettZuFrueh === 0,
    r.etikettZuFrueh + ' zu frueh markiert');
  pruefWahr('Ausgefallene stehen unten', r.ausUeberFahrenden === 0,
    r.ausUeberFahrenden + ' ueber einem Fahrenden');
  pruefWahr('Ausgefallene nach Distanz sortiert', r.absteigend,
    'Ausfallrunden ' + r.runden.join(', '));

  console.log('=== ZIELFLAGGE: Tempo-Regel und Ausfall-Parken (' + JAHR + ') ===\n');
  p.forEach(x => console.log((x.ok ? '  OK  ' : ' FEHL ') + x.name.padEnd(38) + String(x.ist)));
  console.log('\nSkriptfehler: ' + (fehler.length ? fehler.join(' | ') : 'keine'));

  await browser.close();
  const schlecht = p.filter(x => !x.ok).length;
  console.log(schlecht ? '\n' + schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN' : '\nALLES GRUEN');
  process.exit(schlecht ? 1 : 0);
})();
