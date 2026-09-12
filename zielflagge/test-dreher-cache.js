/* Prueft zwei Dinge, die der Nutzer angefordert hat:
 *   1. Dreher bei Kontakt - in BEIDE Richtungen.
 *   2. Zwischenspeicher: der importierte Spielstand ueberlebt ein Neuladen.
 *
 *   node zielflagge/test-dreher-cache.js [jahr]
 *
 * Der Cache-Teil laedt die Seite WIRKLICH neu (page.reload) statt den Zustand
 * nachzubauen - nur so faellt auf, wenn der Stand zwar geschrieben, beim
 * Start aber nicht gelesen wird.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = 'file:///' + path.join(__dirname, 'index.html').split(String.fromCharCode(92)).join('/');
const JAHR = process.argv[2] || '1990';

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
  await page.waitForTimeout(800);

  const p = [];
  const pruefWahr = (name, bed, hinweis) => p.push({ name, ist: hinweis, ok: !!bed });

  // ══ 1. DREHER ══════════════════════════════════════════════════════════
  await page.evaluate((txt) => {
    applyImportResult(parseImportedText(txt));
    state.playerDriverId = DRIVERS[5].id;
    state.laps = 20;
    document.getElementById('start-modus').value = 'mensch';
    startRace();
  }, JSON.stringify(ladeSaison(JAHR)));
  await page.waitForFunction(() => racing === true, null, { timeout: 15000 });

  const d = await page.evaluate(() => {
    const out = {};
    const gid = Object.keys(carMeshes).find(id => id !== player.id);
    const gm = carMeshes[gid].group;

    // Seitlicher Einschlag: der dreht. Spieler faehrt quer in den Gegner.
    const pp = placeOnTrack(0.5, 0);
    const t = curve.getTangentAt(0.5).normalize();
    const n = new THREE.Vector3(-t.z, 0, t.x);
    const stelle = (winkel, tempo) => {
      gm.position.set(pp.pos.x, 0.05, pp.pos.z);
      gm.rotation.y = pp.heading;
      carMeshes[gid].dreher = 0; carMeshes[gid].versatz = null; carMeshes[gid].letztePos = null;
      /* Spieler 3 m seitlich UND 1,6 m hinter der Gegnermitte: er trifft
         dessen HECK, nicht die Mitte. Ein Stoss genau durch die Mitte dreht
         zu Recht nichts - der erste Entwurf zielte dorthin und mass deshalb
         null, obwohl die Rechnung stimmte. */
      const laengs = new THREE.Vector3(Math.sin(pp.heading), 0, Math.cos(pp.heading));
      player.pos.set(pp.pos.x + n.x * 3 - laengs.x * 1.6,
        0, pp.pos.z + n.z * 3 - laengs.z * 1.6);
      player.heading = pp.heading + winkel;
      player.speed = tempo; player.steerNow = 0; player.dreh = 0;
      player.schub.set(0, 0, 0);
      Object.keys(keys).forEach(k => { keys[k] = false; });
      for (let i = 0; i < 40; i++) updatePlayer(1 / 60);
      return { spieler: Math.abs(player.dreh), gegner: Math.abs(carMeshes[gid].dreher || 0) };
    };
    /* ⚠ Vorzeichen: die Bahnrichtung ist (sin H, cos H), die Normale
       (-cos H, sin H). Wer zum Gegner hin will, braucht -Normale, und das ist
       heading H + PI/2. Mit H - PI/2 faehrt man genau WEG - der erste Entwurf
       mass deshalb null Drehung. */
    const quer = stelle(Math.PI / 2, 28);      // genau von der Seite
    out.querSpieler = +quer.spieler.toFixed(2);
    out.querGegner = +quer.gegner.toFixed(2);

    // Auffahren genau von hinten: schiebt, dreht aber kaum.
    gm.position.set(pp.pos.x, 0.05, pp.pos.z); gm.rotation.y = pp.heading;
    carMeshes[gid].dreher = 0; carMeshes[gid].versatz = null; carMeshes[gid].letztePos = null;
    const gd = new THREE.Vector3(Math.sin(pp.heading), 0, Math.cos(pp.heading));
    player.pos.set(pp.pos.x - gd.x * 5.0, 0, pp.pos.z - gd.z * 5.0);
    player.heading = pp.heading; player.speed = 28; player.dreh = 0; player.steerNow = 0;
    player.schub.set(0, 0, 0);
    for (let i = 0; i < 40; i++) updatePlayer(1 / 60);
    out.laengsSpieler = +Math.abs(player.dreh).toFixed(2);
    return out;
  });

  pruefWahr('Seitlicher Einschlag dreht den Spieler', d.querSpieler > 0.3,
    d.querSpieler.toFixed(2) + ' rad/s');
  pruefWahr('... und den Gegner', d.querGegner > 0.1, d.querGegner.toFixed(2) + ' rad');
  pruefWahr('Auffahren von hinten dreht kaum', d.laengsSpieler < d.querSpieler * 0.5,
    d.laengsSpieler.toFixed(2) + ' gegen ' + d.querSpieler.toFixed(2));

  // ══ 2. ZWISCHENSPEICHER ════════════════════════════════════════════════
  const vorher = await page.evaluate((txt) => {
    // Import wie ueber das Einfuegefeld - das schreibt den Zwischenspeicher
    document.getElementById('import-paste').value = txt;
    handlePasteImport();
    state.playerDriverId = DRIVERS[7].id;
    state.laps = 17;
    standSpeichern(txt, 'Test');
    return { jahr: state.jahr, fahrer: state.playerDriverId,
             fahrerName: (DRIVERS.find(x => x.id === state.playerDriverId) || {}).name,
             runden: state.laps, anzahl: DRIVERS.length };
  }, JSON.stringify(ladeSaison(JAHR)));

  // WIRKLICH neu laden
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(900);

  const nachher = await page.evaluate(() => ({
    jahr: state.jahr, fahrer: state.playerDriverId,
    fahrerName: (DRIVERS.find(x => x.id === state.playerDriverId) || {}).name,
    runden: state.laps, anzahl: DRIVERS.length,
    meldung: (document.getElementById('import-status') || {}).textContent || ''
  }));

  pruefWahr('Jahr ueberlebt das Neuladen', String(nachher.jahr) === String(vorher.jahr),
    vorher.jahr + ' -> ' + nachher.jahr);
  pruefWahr('Feld ueberlebt', nachher.anzahl === vorher.anzahl,
    vorher.anzahl + ' -> ' + nachher.anzahl + ' Fahrer');
  // Ueber den NAMEN pruefen, nicht ueber die ID: die wird beim Einlesen neu
  // vergeben und ist nach dem Neuladen zwangslaeufig eine andere.
  pruefWahr('Fahrerwahl ueberlebt', nachher.fahrerName === vorher.fahrerName,
    (vorher.fahrerName || '?') + ' -> ' + (nachher.fahrerName || '?'));
  pruefWahr('Rundenzahl ueberlebt', nachher.runden === vorher.runden,
    vorher.runden + ' -> ' + nachher.runden);
  pruefWahr('Herkunft wird gemeldet', /Zwischenspeicher/.test(nachher.meldung),
    nachher.meldung.slice(0, 60));

  // Leeren muss auch wirken
  await page.evaluate(() => standVergessen());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(900);
  const leer = await page.evaluate(() => ({
    meldung: (document.getElementById('import-status') || {}).textContent || '',
    anzahl: DRIVERS.length
  }));
  pruefWahr('Leeren wirkt', !/Zwischenspeicher/.test(leer.meldung),
    leer.anzahl + ' Fahrer aus dem Beispiel-Feld');

  console.log('=== ZIELFLAGGE: Dreher und Zwischenspeicher (' + JAHR + ') ===\n');
  p.forEach(x => console.log((x.ok ? '  OK  ' : ' FEHL ') + x.name.padEnd(38) + String(x.ist)));
  console.log('\nSkriptfehler: ' + (fehler.length ? fehler.join(' | ') : 'keine'));

  await browser.close();
  const schlecht = p.filter(x => !x.ok).length;
  console.log(schlecht ? '\n' + schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN' : '\nALLES GRUEN');
  process.exit(schlecht ? 1 : 0);
})();
