/* Zeichnet die Streckenkarte als Draufsicht, mit Ideallinie.
 *   node zielflagge/test-streckenkarte.js
 *
 * Ergebnis: render/streckenkarte.png
 *
 * Enthaelt Asphalt, Randsteine, Auslaufzonen, Start-Ziel, nummerierte Kurven,
 * die drei Fahrlinien und einen Massstab. Die Bremszonen sind eingefaerbt -
 * sie ergeben sich aus der Haftgrenze und sind nirgends eingezeichnet, sondern
 * gerechnet (Grenztempo = sqrt(GRIP * Radius), dann rueckwaerts der Bremsweg).
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const HTML = 'file:///' + path.join(__dirname, 'index.html').split(String.fromCharCode(92)).join('/');
const OUT = path.join(__dirname, 'render') + '/';
/* Zweite Ausgabe: dieselbe Karte OHNE Fahrlinien, zum Selbst-Einzeichnen.
   Der Nutzer will seine eigene Ideallinie zeigen - dafuer braucht er eine
   saubere Bahn mit Massstab und Kurvennummern, sonst laesst sich nachher
   nicht sagen, wovon er spricht. */

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
  const fehler = [];
  page.on('pageerror', e => fehler.push(e.message));
  await page.goto(HTML, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof LINIEN !== 'undefined' && LINIEN.length > 0,
    null, { timeout: 60000 });

  /* Die Zeichenfunktion wird ZWEIMAL im Browser ausgefuehrt: einmal mit
     Fahrlinien, einmal ohne (window.__ohneLinien). Deshalb steht sie als
     benannte Funktion hier und nicht inline. */
  const zeichneKarte = () => {
    // Alles der Spieloberflaeche verstecken - sonst scheint sie durch
    document.querySelectorAll('body > *').forEach(el => { el.style.display = 'none'; });
    const cv = document.createElement('canvas');
    cv.width = 1500; cv.height = 1100;
    cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999';
    document.body.appendChild(cv);
    const g = cv.getContext('2d');
    g.fillStyle = '#eceae4'; g.fillRect(0, 0, cv.width, cv.height);

    const N = spacedPts.length;
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (const p of spacedPts) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    const rand = 70, extra = 26;
    const sk = Math.min((cv.width - 2 * rand - 330) / (maxX - minX + extra),
      (cv.height - 2 * rand) / (maxZ - minZ + extra));
    const X = x => rand + (x - minX + extra / 2) * sk;
    const Z = z => rand + (z - minZ + extra / 2) * sk;
    const nrm = i => { const t = spacedTangents[i]; return { x: -t.z, z: t.x }; };
    const pkt = (i, off) => {
      const n = nrm(i);
      return { x: spacedPts[i].x + n.x * off, z: spacedPts[i].z + n.z * off };
    };

    // Auslaufzonen
    g.fillStyle = '#b9ab8e';
    [1, -1].forEach(seite => {
      const breiten = seite > 0 ? auslaufLinks : auslaufRechts;
      g.beginPath();
      for (let i = 0; i <= N; i++) {
        const j = i % N, a = pkt(j, seite * TRACK_WIDTH / 2);
        i ? g.lineTo(X(a.x), Z(a.z)) : g.moveTo(X(a.x), Z(a.z));
      }
      for (let i = N; i >= 0; i--) {
        const j = i % N;
        const a = pkt(j, seite * (TRACK_WIDTH / 2 + (breiten[j] || 9)));
        g.lineTo(X(a.x), Z(a.z));
      }
      g.closePath(); g.fill();
    });

    // Asphalt
    g.beginPath();
    for (let i = 0; i <= N; i++) { const j = i % N, a = pkt(j, TRACK_WIDTH / 2);
      i ? g.lineTo(X(a.x), Z(a.z)) : g.moveTo(X(a.x), Z(a.z)); }
    for (let i = N; i >= 0; i--) { const j = i % N, a = pkt(j, -TRACK_WIDTH / 2);
      g.lineTo(X(a.x), Z(a.z)); }
    g.closePath();
    g.fillStyle = '#45484e'; g.fill();

    /* Bremszonen RICHTIG: dort, wo das Tempoprofil FAELLT - also wo man
       tatsaechlich verzoegern muss. Eine Stelle mit niedrigem Grenztempo ist
       keine Bremszone, sondern die Kurve selbst; gebremst wird davor.
       Der erste Entwurf faerbte alles ein, wo das Grenztempo unter 85 % lag -
       das war fast die ganze Runde. */
    const vMax = TOP_TEMPO * (0.85 + (75 + 75) / 400);
    const ds = trackLength / N;
    const prof = new Array(N);
    for (let i = 0; i < N; i++) prof[i] = Math.min(vMax, grenzTempoBei(i / N));
    for (let k = 0; k < 2; k++) {
      for (let i = N - 1; i >= 0; i--)
        prof[i] = Math.min(prof[i], Math.sqrt(prof[(i + 1) % N] ** 2 + 2 * KI_BREMS * ds));
      for (let i = 0; i < N; i++)
        prof[i] = Math.min(prof[i], Math.sqrt(prof[(i - 1 + N) % N] ** 2 + 2 * KI_BESCHL * ds));
    }
    /* ⚠ Nach der VERZOEGERUNG fragen, nicht nach einem Tempoabfall.
       "faellt um mehr als 0,15 m/s" ist ueber 3,2 m Abstand praktisch nichts -
       damit war fast die ganze Runde eingefaerbt. Gefragt ist, ob hier
       WIRKLICH gebremst wird: a = (v1^2 - v2^2) / (2*ds), ab 6 m/s^2 ist es
       eine Bremszone. */
    for (let i = 0; i < N; i++) {
      const v1 = prof[i], v2 = prof[(i + 1) % N];
      const verzoegerung = (v1 * v1 - v2 * v2) / (2 * ds);
      if (verzoegerung < 4) continue;
      const j = (i + 1) % N;
      const a1 = pkt(i, TRACK_WIDTH / 2), a2 = pkt(i, -TRACK_WIDTH / 2);
      const b1 = pkt(j, TRACK_WIDTH / 2), b2 = pkt(j, -TRACK_WIDTH / 2);
      g.fillStyle = 'rgba(214,60,30,0.55)';
      g.beginPath(); g.moveTo(X(a1.x), Z(a1.z)); g.lineTo(X(b1.x), Z(b1.z));
      g.lineTo(X(b2.x), Z(b2.z)); g.lineTo(X(a2.x), Z(a2.z)); g.closePath(); g.fill();
    }

    // Randsteine
    [TRACK_WIDTH / 2, -TRACK_WIDTH / 2].forEach(off => {
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N, a = pkt(i, off), b = pkt(j, off);
        g.strokeStyle = (i % 6 < 3) ? '#f4f4f4' : '#d8d2c8';
        g.lineWidth = 3; g.lineCap = 'butt';
        g.beginPath(); g.moveTo(X(a.x), Z(a.z)); g.lineTo(X(b.x), Z(b.z)); g.stroke();
      }
    });

    // Fahrlinien - entfallen in der leeren Karte
    const zeichne = (L, farbe, breite, alpha) => {
      if (window.__ohneLinien) return;
      g.strokeStyle = farbe; g.lineWidth = breite; g.globalAlpha = alpha;
      g.lineJoin = 'round'; g.beginPath();
      for (let i = 0; i <= N; i++) {
        const j = i % N, a = pkt(j, L[j]);
        i ? g.lineTo(X(a.x), Z(a.z)) : g.moveTo(X(a.x), Z(a.z));
      }
      g.stroke(); g.globalAlpha = 1;
    };
    zeichne(LINIEN[1], '#2f7fd8', 3, 0.55);
    zeichne(LINIEN[2], '#2fa45a', 3, 0.55);
    zeichne(LINIEN[0], '#e02a20', 5, 1);

    // Fahrtrichtung: ohne sie weiss niemand, herum welche Richtung die Linie
    // gehoert - und eine Rennlinie ist richtungsabhaengig.
    if (window.__ohneLinien) {
      for (let i = 0; i < N; i += 22) {
        const t = spacedTangents[i], p0 = spacedPts[i];
        const n = nrm(i);
        const sp = 4.5, lg = 9;
        const a = { x: p0.x - t.x * lg / 2, z: p0.z - t.z * lg / 2 };
        const b = { x: p0.x + t.x * lg / 2, z: p0.z + t.z * lg / 2 };
        const c = { x: b.x - t.x * sp + n.x * sp * 0.55, z: b.z - t.z * sp + n.z * sp * 0.55 };
        const d = { x: b.x - t.x * sp - n.x * sp * 0.55, z: b.z - t.z * sp - n.z * sp * 0.55 };
        g.strokeStyle = 'rgba(255,255,255,0.30)'; g.lineWidth = 2.5;
        g.beginPath(); g.moveTo(X(a.x), Z(a.z)); g.lineTo(X(b.x), Z(b.z));
        g.moveTo(X(c.x), Z(c.z)); g.lineTo(X(b.x), Z(b.z));
        g.lineTo(X(d.x), Z(d.z)); g.stroke();
      }
    }

    // Start-Ziel
    const s1 = pkt(0, TRACK_WIDTH / 2), s2 = pkt(0, -TRACK_WIDTH / 2);
    g.strokeStyle = '#111'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(X(s1.x), Z(s1.z)); g.lineTo(X(s2.x), Z(s2.z)); g.stroke();
    g.fillStyle = '#111'; g.font = 'bold 17px system-ui';
    g.fillText('START / ZIEL', X(s1.x) + 14, Z(s1.z) - 10);

    // Kurven nummerieren
    const innen = new Array(N);
    for (let i = 0; i < N; i++) {
      const a = spacedPts[(i - 3 + N * 2) % N], m = spacedPts[i], c = spacedPts[(i + 3) % N];
      const n = nrm(i);
      innen[i] = ((a.x + c.x) / 2 - m.x) * n.x + ((a.z + c.z) / 2 - m.z) * n.z;
    }
    let gr = 0; for (const x of innen) gr = Math.max(gr, Math.abs(x));
    const kn = innen.map(x => x / gr);
    const kurven = []; let st = null;
    for (let i = 0; i < N; i++) {
      const drin = Math.abs(kn[i]) > 0.25;
      if (drin && st === null) st = i;
      if (!drin && st !== null) { kurven.push([st, i - 1]); st = null; }
    }
    if (st !== null) kurven.push([st, N - 1]);
    const gross = kurven.filter(([a, b]) => b - a >= 8);
    gross.forEach(([a, b], k) => {
      let sch = a, best = 0;
      for (let i = a; i <= b; i++) if (Math.abs(kn[i]) > best) { best = Math.abs(kn[i]); sch = i; }
      const seite = -Math.sign(kn[sch]);
      const p = pkt(sch, seite * (TRACK_WIDTH / 2 + 16));
      g.fillStyle = '#111'; g.beginPath();
      g.arc(X(p.x), Z(p.z), 15, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.font = 'bold 16px system-ui';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(k + 1), X(p.x), Z(p.z));
      g.textAlign = 'start'; g.textBaseline = 'alphabetic';
    });

    // Legende
    const lx = cv.width - 300, ly = 110;
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.fillRect(lx - 20, ly - 45, 300, 300);
    g.strokeStyle = '#ccc'; g.lineWidth = 1; g.strokeRect(lx - 20, ly - 45, 300, 300);
    g.fillStyle = '#111'; g.font = 'bold 21px system-ui';
    g.fillText('Musterstrecke', lx, ly - 16);
    g.font = '15px system-ui';
    const zeile = (y, farbe, txt, dick) => {
      if (farbe) { g.strokeStyle = farbe; g.lineWidth = dick || 4;
        g.beginPath(); g.moveTo(lx, y - 5); g.lineTo(lx + 34, y - 5); g.stroke(); }
      g.fillStyle = '#111'; g.fillText(txt, lx + 46, y);
    };
    if (window.__ohneLinien) {
      g.fillStyle = '#111';
      g.fillText('Zum Einzeichnen der eigenen Linie.', lx, ly + 18);
      g.fillText('Fahrtrichtung: Pfeile auf der Bahn.', lx, ly + 42);
      g.fillStyle = 'rgba(214,60,30,0.55)'; g.fillRect(lx, ly + 58, 34, 12);
      g.fillStyle = '#111'; g.fillText('Bremszone', lx + 46, ly + 69);
      g.fillStyle = '#b9ab8e'; g.fillRect(lx, ly + 82, 34, 12);
      g.fillStyle = '#111'; g.fillText('Auslaufzone', lx + 46, ly + 93);
    } else {
      zeile(ly + 18, '#e02a20', 'Ideallinie', 5);
      zeile(ly + 44, '#2f7fd8', 'Nebenlinie außen', 3);
      zeile(ly + 70, '#2fa45a', 'Nebenlinie innen', 3);
      g.fillStyle = 'rgba(214,60,30,0.55)'; g.fillRect(lx, ly + 84, 34, 12);
      g.fillStyle = '#111'; g.fillText('Bremszone', lx + 46, ly + 95);
      g.fillStyle = '#b9ab8e'; g.fillRect(lx, ly + 108, 34, 12);
      g.fillStyle = '#111'; g.fillText('Auslaufzone', lx + 46, ly + 119);
    }
    g.font = '14px system-ui';
    g.fillText('Länge ' + Math.round(trackLength) + ' m', lx, ly + 152);
    g.fillText('Breite ' + TRACK_WIDTH + ' m', lx, ly + 174);
    g.fillText('Kurven ' + gross.length, lx, ly + 196);
    g.fillText('schnellste Runde ' + optimaleRundenzeit(vMax).toFixed(1) + ' s', lx, ly + 218);

    // Massstab
    const meter = 100, px = meter * sk;
    const mx = rand, my = cv.height - 50;
    g.strokeStyle = '#111'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + px, my);
    g.moveTo(mx, my - 6); g.lineTo(mx, my + 6);
    g.moveTo(mx + px, my - 6); g.lineTo(mx + px, my + 6); g.stroke();
    g.fillStyle = '#111'; g.font = '15px system-ui';
    g.fillText('100 m', mx + px / 2 - 22, my - 12);

    return { kurven: gross.length, laenge: Math.round(trackLength) };
  };
  const info = await page.evaluate(zeichneKarte);

  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + 'streckenkarte.png' });
  console.log('Streckenkarte: ' + OUT + 'streckenkarte.png');

  // Zweiter Durchlauf: dieselbe Karte ohne Fahrlinien
  await page.evaluate(() => {
    window.__ohneLinien = true;
    document.querySelectorAll('canvas').forEach(c => { if (c.width === 1500) c.remove(); });
  });
  await page.evaluate(zeichneKarte);
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + 'streckenkarte-leer.png' });
  console.log('Leere Karte : ' + OUT + 'streckenkarte-leer.png');
  console.log('  ' + info.laenge + ' m, ' + info.kurven + ' Kurven');
  console.log('  Skriptfehler: ' + (fehler.length ? fehler.join(' | ') : 'keine'));
  await browser.close();
})();
