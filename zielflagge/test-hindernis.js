/* Prueft den Sonderfall "stehendes Hindernis".
 *   node zielflagge/test-hindernis.js [jahr] [samen]
 *
 * Nutzer: "stehendes hindernis als sonderfall mit auslaufzone. crashs sind
 * moeglich aber selten. je mehr beteiligte desto seltener."
 *
 * ZWEI Lagen, weil sie verschiedene Antworten verlangen:
 *   A) EIN stehender Wagen quer auf der Ideallinie. Die Bahn ist 15 m breit -
 *      daneben passt jeder vorbei, OHNE sie zu verlassen. Genau das wird
 *      geprueft: das Hindernis wird erkannt, aber die Auslaufzone bleibt
 *      ungenutzt. Ins Gelaende zu fahren, wo Asphalt frei ist, waere falsch.
 *   B) FUENF Wagen im 3-m-Raster quer ueber die Bahn. Auf dem Asphalt gibt es
 *      keinen Weg mehr - hier MUSS die Auslaufzone benutzt werden.
 *      ⚠ Drei Wagen auf -5/0/+5 genuegen NICHT: dazwischen bleiben 5 m, und da
 *      passt ein Wagen durch. Der Code fuhr voellig richtig hindurch, und die
 *      Pruefung sah trotzdem rot aus. Blockiert ist die 15-m-Bahn erst im
 *      3-m-Raster.
 * Dazu die GEGENPROBE ohne Hindernis: dann darf niemand die Bahn verlassen.
 *
 * ⚠ Die Hindernisse muessen in JEDEM Bild neu festgehalten werden. fahreGegner
 *   laesst den Dreher ueber ein bis zwei Sekunden abklingen und beschleunigt
 *   danach wieder - ohne Nachsetzen faehrt das "Hindernis" einfach los.
 * ⚠ Der stehende Start darf den Zweig nicht ausloesen: dort steht das ganze
 *   Feld. Deshalb wird erst nach der Startphase gemessen, und die Gegenprobe
 *   prueft es zusaetzlich.
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

  await festerZufall(page, SAMEN);
  await page.goto(HTML, { waitUntil: 'load' });
  await page.waitForTimeout(900);

  await page.evaluate((txt) => {
    applyImportResult(parseImportedText(txt));
    state.playerDriverId = DRIVERS[5].id;
    state.laps = 30;
    document.getElementById('start-modus').value = 'ki';
    startRace();
    paused = true;
  }, JSON.stringify(ladeSaison(JAHR)));
  await page.waitForFunction(() => racing === true, null, { timeout: 15000 });
  await page.evaluate(() => { paused = true; });

  const r = await page.evaluate(() => {
    const out = {};
    const fahre = (n) => {
      for (let i = 0; i < n; i++) { raceClock += 1 / 60; updateAICars(raceClock, 1 / 60); }
    };

    // Startphase hinter uns lassen - dort steht das ganze Feld.
    while (raceClock < GRID_FADE_S + 3) fahre(1);

    const lebt = (id) => !getProgressAI(id, raceClock).frozen;
    const ids = Object.keys(carMeshes).filter(id => id !== player.id && lebt(id));
    ids.sort((a, b) => carMeshes[b].fortschritt - carMeshes[a].fortschritt);

    // -- Gegenprobe: ohne Hindernis bleibt jeder auf dem Asphalt ----------
    let ohne = 0;
    for (let i = 0; i < 600; i++) {
      fahre(1);
      ids.forEach(id => {
        const c = carMeshes[id];
        // Ausgefallene stehen geparkt in der Auslaufzone - nicht mitzaehlen.
        if (getProgressAI(id, raceClock).frozen) return;
        if (c && c.seitlich !== undefined) ohne = Math.max(ohne, Math.abs(c.seitlich));
      });
    }
    out.ohneHindernisMaxQuer = +ohne.toFixed(2);
    out.bahnRand = TRACK_WIDTH / 2;

    /* Ein Durchgang: die vordersten Wagen werden in JEDEM Bild auf ihrer
       Stelle und Querlage festgenagelt, das Feld dahinter faehrt heran. */
    const lauf = (querlagen) => {
      const mitte = ids[Math.floor(ids.length / 2)];
      const fort = carMeshes[mitte].fortschritt;
      const bloecke = ids.filter(id => carMeshes[id].fortschritt >= fort).slice(0, querlagen.length);
      if (bloecke.length < querlagen.length) return null;
      const festhalten = () => bloecke.forEach((id, k) => {
        const c = carMeshes[id];
        c.fortschritt = fort; c.tempo = 0; c.dreher = 1.2; c.seitlich = querlagen[k];
      });
      const hinten = ids.filter(id => bloecke.indexOf(id) < 0 && carMeshes[id].fortschritt < fort);
      const minAbstand = {}, maxQuer = {}, erkannt = {};
      hinten.forEach(id => { minAbstand[id] = 999; maxQuer[id] = 0; erkannt[id] = false; });
      for (let i = 0; i < 2400; i++) {
        festhalten();
        raceClock += 1 / 60;
        updateAICars(raceClock, 1 / 60);
        festhalten();
        hinten.forEach(id => {
          const c = carMeshes[id];
          if (!c || c.seitlich === undefined) return;
          /* ⚠ Waehrend der 40 Sekunden faellt der eine oder andere aus. Ein
             Ausgefallener wird auf trackHalfWidth()+2,5 geparkt - also GENAU
             in der Auslaufzone, bei 10,0 m. Wer ihn mitzaehlt, haelt das
             Abstellen fuer ein Ausweichmanoever: so sahen 9 von 11 Wagen aus,
             als waeren sie neben die Bahn gefahren. */
          if (getProgressAI(id, raceClock).frozen) return;
          if (c.ausweichFuer !== undefined) erkannt[id] = true;
          /* ⚠ Die Querlage NUR in der Naehe des gepinnten Wagens zaehlen.
             Ueber 40 Sekunden faehrt jeder mehrere Runden, und irgendwo auf
             der Strecke dreht sich immer jemand. Wer den Hoechstwert ueber den
             ganzen Lauf nimmt, schreibt fremde Zwischenfaelle dieser Lage zu -
             gemessen sahen so 9 von 11 Wagen aus, als wichen sie einem
             einzelnen Hindernis ins Gelaende aus. */
          /* ⚠ LAENGS der Bahn messen, nicht Luftlinie. Auf dieser Strecke
             laufen Abschnitte dicht aneinander vorbei - per Luftlinie steht
             ein Wagen auf der Nachbargeraden scheinbar 11 m neben dem
             Hindernis und bringt seinen fremden Zwischenfall in die
             Messung ein. Genau das liess 8 von 11 Wagen so aussehen, als
             wichen sie einem einzelnen Hindernis ins Gelaende aus. */
          let nah = 1e9;
          bloecke.forEach(bid => {
            const bu = ((carMeshes[bid].fortschritt % 1) + 1) % 1;
            const cu = ((c.fortschritt % 1) + 1) % 1;
            const dl = Math.abs(laengsAbstand(cu, bu));
            nah = Math.min(nah, dl);
            minAbstand[id] = Math.min(minAbstand[id],
              c.group.position.distanceTo(carMeshes[bid].group.position));
          });
          /* ⚠ Nur zaehlen, waehrend der Wagen WIRKLICH dem gepinnten Wagen
             ausweicht. Sonst geht alles mit ein, was sonst noch passiert:
             Nachlauf aus einem frueheren Manoever (cm.seitlich schwenkt ueber
             rund eine Sekunde zurueck) und Zwischenfaelle im Stau, der sich
             hinter dem Hindernis bildet. Gemessen sah so jeder zweite Wagen
             aus, als sei er neben die Bahn gefahren, obwohl seine Ausweich-
             ZIELE alle auf dem Asphalt lagen. */
          if (nah < 40 && bloecke.indexOf(c.ausweichFuer) >= 0)
            maxQuer[id] = Math.max(maxQuer[id], Math.abs(c.seitlich));
        });
      }
      const dran = hinten.filter(id => minAbstand[id] < 30);
      return {
        herangekommen: dran.length,
        erkannt: dran.filter(id => erkannt[id]).length,
        imAuslauf: dran.filter(id => maxQuer[id] > TRACK_WIDTH / 2).length,
        beruehrt: dran.filter(id => minAbstand[id] < 1.8).length,
        maxQuer: +Math.max.apply(null, dran.map(id => maxQuer[id]).concat([0])).toFixed(2),
        abstand: +(dran.reduce((a, id) => a + minAbstand[id], 0) / Math.max(dran.length, 1)).toFixed(2)
      };
    };

    // A) einer auf der Ideallinie
    const m = ids[Math.floor(ids.length / 2)];
    const uA = ((carMeshes[m].fortschritt % 1) + 1) % 1;
    out.a = lauf([idealBei(uA, 0)]);
    // B) fuenf im 3-m-Raster - jetzt ist wirklich kein Weg mehr frei
    out.b = lauf([-6.0, -3.0, 0, 3.0, 6.0]);
    return out;
  });

  const zeig = (name, x) => {
    console.log('');
    console.log(name);
    console.log('  herangekommen            : ' + x.herangekommen);
    console.log('  davon Hindernis erkannt  : ' + x.erkannt);
    console.log('  davon in der Auslaufzone : ' + x.imAuslauf);
    console.log('  davon beruehrt (<1,8 m)  : ' + x.beruehrt);
    console.log('  groesste Querlage        : ' + x.maxQuer + ' m');
    console.log('  mittlerer Mindestabstand : ' + x.abstand + ' m');
  };
  console.log('');
  console.log('Bahnrand                        : ' + r.bahnRand + ' m');
  console.log('Gegenprobe ohne Hindernis, quer : ' + r.ohneHindernisMaxQuer + ' m');
  zeig('A) EIN stehender Wagen auf der Ideallinie', r.a);
  zeig('B) FUENF quer ueber die Bahn', r.b);

  let schlecht = 0;
  const pruef = (name, ok, info) => {
    console.log((ok ? '  OK  ' : ' FEHL ') + name.padEnd(34) + info);
    if (!ok) schlecht++;
  };
  console.log('');
  console.log('=== ZIELFLAGGE: stehendes Hindernis ===');
  /* ⚠ "Ohne Hindernis" heisst ohne GEPINNTES Hindernis. Im laufenden Rennen
     dreht sich immer mal jemand, und ihm auszuweichen ist richtig - die
     Gegenprobe kann deshalb nicht null Gelaende verlangen. Sie verlangt, dass
     niemand TIEF hineinfaehrt: die Auslaufzone ist bis zu 22 m breit. */
  pruef('Ohne Hindernis kaum Gelaende',
    r.ohneHindernisMaxQuer <= r.bahnRand + 3,
    r.ohneHindernisMaxQuer + ' m, Bahnrand ' + r.bahnRand + ' m');
  pruef('A: Wagen kommen heran', r.a.herangekommen >= 3, r.a.herangekommen + ' Wagen');
  pruef('A: Hindernis wird erkannt', r.a.erkannt >= 1,
    r.a.erkannt + ' von ' + r.a.herangekommen);
  /* Neben EINEM stehenden Wagen ist Asphalt frei - wer trotzdem ins Gelaende
     faehrt, faehrt falsch. Einzelne duerfen es dennoch: aus Beruehrungen
     entstehen weitere gedrehte Wagen, und DENEN auszuweichen ist richtig. */
  pruef('A: Gelaende bleibt die Ausnahme',
    r.a.imAuslauf <= Math.max(1, Math.round(r.a.herangekommen * 0.25)),
    r.a.imAuslauf + ' von ' + r.a.herangekommen + ', bis ' + r.a.maxQuer + ' m');
  pruef('A: Crashs bleiben die Ausnahme',
    r.a.beruehrt <= Math.max(1, Math.round(r.a.herangekommen * 0.3)),
    r.a.beruehrt + ' von ' + r.a.herangekommen + ' beruehrt');
  pruef('B: Auslaufzone wird benutzt',
    r.b.imAuslauf >= Math.max(1, Math.round(r.b.herangekommen * 0.5)),
    r.b.imAuslauf + ' von ' + r.b.herangekommen + ', bis ' + r.b.maxQuer + ' m');
  pruef('B: die meisten kommen durch',
    r.b.beruehrt <= Math.max(1, Math.round(r.b.herangekommen * 0.5)),
    r.b.beruehrt + ' von ' + r.b.herangekommen + ' beruehrt');
  pruef('Skriptfehler', fehler.length === 0, fehler.length ? fehler[0] : 'keine');

  console.log('');
  console.log(schlecht ? (schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN') : 'ALLES GRUEN');
  await browser.close();
  process.exit(schlecht ? 1 : 0);
})();
