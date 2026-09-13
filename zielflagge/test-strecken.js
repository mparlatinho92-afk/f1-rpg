/* Probe: echte Strecken aus data/circuit-layouts.js fahrbar machen.
 *   node zielflagge/test-strecken.js [slug]
 *
 * Vorgabe ist silverstone, weil es mit ACHT Ausbaustufen von 1950 bis 2026 der
 * haerteste Fall ist und weil sich daran die Kernfrage zeigt: die Stufen sind
 * aus demselben Satz gezeichnet, liegen also deckungsgleich uebereinander und
 * bauen aufeinander auf - genau wie in echt.
 *
 * Geprueft wird:
 *   1. der Pfad-Wandler laeuft ueber ALLE 160 Layouts ohne Ausreisser,
 *   2. EIN Massstab je Strecke genuegt fuer alle ihre Stufen,
 *   3. die umgerechneten Laengen treffen die echten.
 *
 * Bilder: render/strecken-silverstone.png (alle Stufen uebereinander)
 *         render/strecken-silverstone-stufen.png (Stufe fuer Stufe)
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const S = require('./strecken.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'render') + '/';
const SLUG = process.argv[2] || 'silverstone';

function ladeLayouts() {
  const src = fs.readFileSync(path.join(ROOT, 'data', 'circuit-layouts.js'), 'utf8');
  return new Function(src + '; return CIRCUIT_LAYOUTS;')();
}
/* ⚠ Klammerbalanciert ausschneiden. Eine Regex mit nicht-gieriger Klammer
   schneidet die Tabelle beim ersten "};" ab - dann fehlten 300 Eintraege und
   monza sah aus, als stuende es gar nicht drin. */
function ladeLaengen() {
  const f1 = fs.readFileSync(path.join(ROOT, 'data', 'f1db.js'), 'utf8');
  const i = f1.indexOf('const CIRCUIT_LENGTHS');
  const a = f1.indexOf('{', i);
  let tiefe = 0, b = a;
  for (; b < f1.length; b++) {
    if (f1[b] === '{') tiefe++;
    else if (f1[b] === '}') { tiefe--; if (!tiefe) { b++; break; } }
  }
  return new Function('return ' + f1.slice(a, b) + ';')();
}

// Echte Laengen der Silverstone-Stufen, zum Gegenrechnen.
const ECHT = {
  'silverstone-1': 4.711, 'silverstone-2': 4.719, 'silverstone-3': 4.778,
  'silverstone-4': 5.226, 'silverstone-5': 5.057, 'silverstone-6': 5.072,
  'silverstone-7': 5.141, 'silverstone-8': 5.891
};

(async () => {
  const LAY = ladeLayouts();
  const LEN = ladeLaengen();
  const strecke = LAY[SLUG];
  if (!strecke) { console.log('Unbekannte Strecke: ' + SLUG); process.exit(1); }

  let schlecht = 0;
  const pruef = (name, ok, info) => {
    console.log((ok ? '  OK  ' : ' FEHL ') + name.padEnd(40) + info);
    if (!ok) schlecht++;
  };

  // ── 1. Der Wandler ueber alle 160 Layouts ──────────────────────────────
  let fehler = 0, entartet = 0, gesamt = 0;
  for (const slug of Object.keys(LAY)) {
    for (const stufe of LAY[slug].l) {
      gesamt++;
      try {
        const pts = S.entdoppeln(S.pfadZuPunkten(stufe.d));
        const l = S.polyLaenge(pts, true);
        // Entartet heisst: zu wenige Punkte oder keine Ausdehnung
        if (pts.length < 20 || !(l > 1)) entartet++;
      } catch (e) { fehler++; }
    }
  }

  // ── 2. Massstab und Laengen ────────────────────────────────────────────
  /* ⚠ CIRCUIT_LENGTHS haelt EINE Zahl je Strecke, und bei Silverstone ist das
     die HISTORISCHE (4,71 km = Stand 1950), nicht die heutige. Der Massstab
     wird deshalb aus der aeltesten Stufe abgeleitet. Fuer den Renneinsatz muss
     je Strecke festgehalten werden, auf welche Stufe sich die Zahl bezieht. */
  const bezug = strecke.l[0];
  const skala = LEN[SLUG] ? S.massstabFuer(bezug.d, LEN[SLUG] * 1000) : null;

  console.log('');
  console.log('=== ZIELFLAGGE: echte Strecken - Probe ' + SLUG + ' ===');
  console.log('');
  console.log(strecke.n + ', ' + strecke.l.length + ' Ausbaustufen');
  console.log('CIRCUIT_LENGTHS: ' + (LEN[SLUG] ? LEN[SLUG] + ' km' : 'FEHLT')
    + (skala ? ('   ->  ' + skala.toFixed(3) + ' m je Bildpunkt (aus ' + bezug.id + ')') : ''));
  console.log('');

  const stufen = [];
  let maxAbw = 0, mitEcht = 0;
  console.log('  Stufe            Jahre                gerechnet    echt     Abweichung');
  for (const x of strecke.l) {
    const r = skala ? S.stufeZuMittellinie(x.d, skala, 400) : null;
    stufen.push({ id: x.id, y: x.y, pts: r ? r.pts : [], km: r ? r.laenge / 1000 : 0 });
    const e = ECHT[x.id];
    let ab = null;
    if (r && e) { ab = (r.laenge / 1000 - e) / e * 100; maxAbw = Math.max(maxAbw, Math.abs(ab)); mitEcht++; }
    console.log('  ' + x.id.padEnd(16) + String(x.y).slice(0, 18).padEnd(20)
      + (r ? (r.laenge / 1000).toFixed(3) + ' km' : '   -   ')
      + (e ? ('   ' + e.toFixed(3) + ' km   ' + (ab >= 0 ? '+' : '') + ab.toFixed(1) + ' %') : ''));
  }

  // Gleiche Pfade erkennen - die Quelle unterscheidet nicht jede Variante
  const gleich = {};
  strecke.l.forEach(x => { (gleich[x.d] = gleich[x.d] || []).push(x.id); });
  const doppelt = Object.values(gleich).filter(g => g.length > 1);

  console.log('');
  console.log('  Wandler ueber alle Layouts: ' + gesamt + ' geprueft, '
    + fehler + ' Fehler, ' + entartet + ' entartet');
  console.log('  Strecken mit Laengenangabe: ' + Object.keys(LAY).filter(s => LEN[s]).length
    + ' von ' + Object.keys(LAY).length);
  if (doppelt.length)
    doppelt.forEach(g => console.log('  identischer Pfad in der Quelle: ' + g.join(', ')));

  // ── 3. Bilder ──────────────────────────────────────────────────────────
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.setContent('<body style="margin:0"><canvas id="c"></canvas></body>');

  const farben = ['#e53935', '#fb8c00', '#fdd835', '#7cb342', '#00acc1',
                  '#3949ab', '#8e24aa', '#ec407a'];

  await page.evaluate(([stufen, farben, name]) => {
    const cv = document.getElementById('c');
    cv.width = 1400; cv.height = 1000;
    const g = cv.getContext('2d');
    g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, 1400, 1000);
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    stufen.forEach(s => s.pts.forEach(p => {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }));
    const rand = 90;
    const sk = Math.min((1400 - 2 * rand) / (maxX - minX), (1000 - 2 * rand - 60) / (maxZ - minZ));
    const X = x => rand + (x - minX) * sk;
    const Z = z => rand + 60 + (z - minZ) * sk;
    stufen.forEach((s, k) => {
      g.strokeStyle = farben[k % farben.length];
      g.lineWidth = 7 - k * 0.5; g.globalAlpha = 0.85;
      g.beginPath();
      s.pts.forEach((p, i) => i ? g.lineTo(X(p.x), Z(p.z)) : g.moveTo(X(p.x), Z(p.z)));
      g.closePath(); g.stroke();
    });
    g.globalAlpha = 1;
    g.fillStyle = '#111'; g.font = 'bold 26px system-ui';
    g.fillText(name + ' - alle Ausbaustufen auf einer Karte', rand, 40);
    g.font = 'bold 15px system-ui';
    stufen.forEach((s, k) => {
      const x = rand + (k % 4) * 300, y = 1000 - 46 + Math.floor(k / 4) * 22;
      g.fillStyle = farben[k % farben.length];
      g.fillRect(x, y - 10, 22, 5);
      g.fillStyle = '#111';
      g.fillText(String(s.y).slice(0, 22) + '   ' + s.km.toFixed(3) + ' km', x + 30, y);
    });
  }, [stufen, farben, strecke.n]);
  await page.screenshot({ path: OUT + 'strecken-' + SLUG + '.png' });

  // Stufe fuer Stufe, jeweils mit der vorigen blass dahinter
  await page.evaluate(([stufen, farben, name]) => {
    const cv = document.getElementById('c');
    cv.width = 1400; cv.height = 1000;
    const g = cv.getContext('2d');
    g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, 1400, 1000);
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    stufen.forEach(s => s.pts.forEach(p => {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }));
    const spalten = 4, zeilen = Math.ceil(stufen.length / spalten);
    const bw = 1400 / spalten, bh = (1000 - 50) / zeilen;
    g.fillStyle = '#111'; g.font = 'bold 22px system-ui';
    g.fillText(name + ' - wie die Stufen aufeinander aufbauen', 24, 32);
    stufen.forEach((s, k) => {
      const cx = (k % spalten) * bw, cy = 50 + Math.floor(k / spalten) * bh;
      const sk = Math.min((bw - 40) / (maxX - minX), (bh - 52) / (maxZ - minZ));
      const X = x => cx + 20 + (x - minX) * sk;
      const Z = z => cy + 34 + (z - minZ) * sk;
      const zeichne = (pts, farbe, breite, alpha) => {
        g.strokeStyle = farbe; g.lineWidth = breite; g.globalAlpha = alpha;
        g.beginPath();
        pts.forEach((p, i) => i ? g.lineTo(X(p.x), Z(p.z)) : g.moveTo(X(p.x), Z(p.z)));
        g.closePath(); g.stroke(); g.globalAlpha = 1;
      };
      if (k > 0) zeichne(stufen[k - 1].pts, '#999', 5, 0.5);
      zeichne(s.pts, farben[k % farben.length], 3.5, 1);
      g.fillStyle = '#111'; g.font = 'bold 14px system-ui';
      g.fillText(String(s.y).slice(0, 26), cx + 20, cy + 22);
      g.font = '13px system-ui'; g.fillStyle = '#555';
      g.fillText(s.km.toFixed(3) + ' km', cx + 20, cy + bh - 8);
    });
  }, [stufen, farben, strecke.n]);
  await page.screenshot({ path: OUT + 'strecken-' + SLUG + '-stufen.png' });

  // ── 4. Wirklich ins Spiel laden ────────────────────────────────────────
  const spiel = await page.goto('file:///' + path.join(__dirname, 'index.html')
    .split(String.fromCharCode(92)).join('/'), { waitUntil: 'load' }).then(() => page)
    .then(async (pg) => { await pg.waitForTimeout(800); return pg; });
  const geladen = await spiel.evaluate(([slug, jahre]) => {
    const aus = [];
    for (const j of jahre) {
      const ok = typeof streckeLaden === 'function' && streckeLaden(slug, j);
      aus.push({
        jahr: j, ok,
        stufe: ok ? state.streckeStufe : null,
        km: ok ? +(trackLength / 1000).toFixed(3) : 0,
        linien: ok ? LINIEN.length : 0,
        punkte: ok ? spacedPts.length : 0,
        runde: ok ? +optimaleRundenzeit(TOP_TEMPO).toFixed(1) : 0,
        quelle: ok ? state.streckeStartQuelle : null
      });
    }
    return aus;
  }, [SLUG, [1950, 1980, 1988, 1992, 1995, 2000, 2015]]);
  await browser.close();

  console.log('');
  console.log('  Ins Spiel geladen:');
  geladen.forEach(g => console.log('    ' + g.jahr + ': '
    + (g.ok ? (String(g.stufe).padEnd(15) + String(g.km).padStart(6) + ' km, '
      + g.linien + ' Linien, opt. Runde ' + g.runde + ' s, Start aus ' + g.quelle)
      : 'FEHLGESCHLAGEN')));
  const alleOk = geladen.every(g => g.ok && g.linien === 3 && g.punkte > 100 && g.km > 1);
  /* Die Zuordnung Jahr -> Stufe ist der Teil, der am leichtesten still kaputt
     geht: die Jahresangaben sind luecken haft (Silverstone wechselte sich mit
     Brands Hatch ab), und ohne Sorgfalt landet 1980 auf dem Layout von 2010. */
  const jahrRichtig = geladen.find(g => g.jahr === 1980);
  const jahrOk = jahrRichtig && jahrRichtig.stufe === 'silverstone-2';

  console.log('');
  console.log('Bild: ' + OUT + 'strecken-' + SLUG + '.png');
  console.log('Bild: ' + OUT + 'strecken-' + SLUG + '-stufen.png');
  console.log('');
  pruef('Wandler laeuft ueber alle Layouts', fehler === 0, fehler + ' Fehler bei ' + gesamt + ' Layouts');
  pruef('Keine entarteten Mittellinien', entartet === 0, entartet + ' entartet');
  pruef('Massstab vorhanden', !!skala, skala ? (skala.toFixed(3) + ' m/px') : 'CIRCUIT_LENGTHS fehlt');
  pruef('EIN Massstab traegt alle Stufen', mitEcht > 0 && maxAbw < 5,
    'groesste Abweichung ' + maxAbw.toFixed(1) + ' % bei ' + mitEcht + ' geprueften Stufen');
  pruef('Strecke laedt im Spiel', alleOk, geladen.filter(g => g.ok).length + ' von ' + geladen.length + ' Jahren');
  pruef('Jahr trifft die richtige Stufe', !!jahrOk,
    '1980 -> ' + (jahrRichtig ? jahrRichtig.stufe : '-') + ' (erwartet silverstone-2)');
  console.log('');
  console.log(schlecht ? (schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN') : 'ALLES GRUEN');
  process.exit(schlecht ? 1 : 0);
})();
