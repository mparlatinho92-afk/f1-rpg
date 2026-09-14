/* ZIELFLAGGE: echte Strecken aus data/circuit-layouts.js fahrbar machen.
 *
 * Die Layouts liegen dort als SVG-Pfade in einer 500x500-Box, erzeugt aus
 * f1-circuits-svg. Dieses Modul macht daraus eine Mittellinie in METERN, so
 * wie buildTrack sie erwartet: eine geschlossene Punktfolge in der x/z-Ebene.
 *
 * ══ DREI DINGE, DIE IM SVG NICHT STEHEN ═══════════════════════════════════
 * 1. Der MASSSTAB. Ein Pfad ist in Bildpunkten angegeben. Die echte Laenge
 *    steht in CIRCUIT_LENGTHS (data/f1db.js) unter demselben f1db-Slug.
 * 2. START UND ZIEL. Der Pfad faengt irgendwo an. Ohne Angabe wird der
 *    Anfangspunkt genommen - fuer eine Probe reicht das, fuer den Renneinsatz
 *    muss die Stelle je Strecke gesetzt werden.
 * 3. Die FAHRTRICHTUNG. Ob der Pfad im oder gegen den Uhrzeigersinn laeuft,
 *    ist Zufall der Quelle und sagt nichts ueber die echte Richtung.
 *
 * ⚠ ALLE AUSBAUSTUFEN EINER STRECKE TEILEN SICH EIN KOORDINATENSYSTEM.
 *   Sie sind aus demselben Satz gezeichnet und liegen deckungsgleich
 *   uebereinander - genau wie in echt, wo eine neue Variante Teile der alten
 *   weiterbenutzt. Daraus folgt etwas Praktisches: EIN Massstab gilt fuer alle
 *   Stufen. Man braucht also nicht fuer jede Stufe eine eigene Laengenangabe,
 *   sondern leitet den Faktor aus der Stufe ab, deren Laenge bekannt ist.
 */
(function (global) {
  'use strict';

  /* ── SVG-Pfad in eine Punktfolge abwickeln ──────────────────────────────
     Unterstuetzt M L H V C S Q T A Z in Gross- und Kleinschreibung. Ueber
     alle 160 Layouts kommen genau diese vor.
     Kurven werden in feste Stuecke zerlegt; die Punktdichte spielt keine
     Rolle, weil danach ohnehin gleichmaessig neu abgetastet wird. */
  function pfadZuPunkten(d, stueckeProKurve) {
    const N = stueckeProKurve || 24;
    const pts = [];
    let x = 0, z = 0, startX = 0, startZ = 0;
    let letzterC = null, letzterQ = null, letzterBefehl = '';

    const zahlen = (txt) => {
      const raus = [];
      const re = /-?\d*\.?\d+(?:[eE][-+]?\d+)?/g;
      let m;
      while ((m = re.exec(txt)) !== null) raus.push(parseFloat(m[0]));
      return raus;
    };
    const setze = (nx, nz) => { x = nx; z = nz; pts.push({ x, z }); };

    const kubisch = (x0, z0, x1, z1, x2, z2, x3, z3) => {
      for (let i = 1; i <= N; i++) {
        const t = i / N, u = 1 - t;
        setze(u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
              u * u * u * z0 + 3 * u * u * t * z1 + 3 * u * t * t * z2 + t * t * t * z3);
      }
    };
    const quadratisch = (x0, z0, x1, z1, x2, z2) =>
      kubisch(x0, z0, x0 + 2 / 3 * (x1 - x0), z0 + 2 / 3 * (z1 - z0),
              x2 + 2 / 3 * (x1 - x2), z2 + 2 / 3 * (z1 - z2), x2, z2);

    /* ⚠ Der elliptische Bogen ist der einzige wirklich unangenehme Befehl.
       Das SVG gibt Anfang, Ende, Radien und zwei Flaggen an - gebraucht wird
       aber der MITTELPUNKT. Die Umrechnung steht so in der SVG-Spezifikation
       (Anhang F.6.5) und ist hier eins zu eins uebernommen. */
    const bogen = (x0, z0, rx, rz, drehGrad, grossFlag, sweepFlag, x1, z1) => {
      if (rx === 0 || rz === 0) { setze(x1, z1); return; }
      rx = Math.abs(rx); rz = Math.abs(rz);
      const phi = drehGrad * Math.PI / 180;
      const cosP = Math.cos(phi), sinP = Math.sin(phi);
      const dx2 = (x0 - x1) / 2, dz2 = (z0 - z1) / 2;
      const x1s = cosP * dx2 + sinP * dz2;
      const z1s = -sinP * dx2 + cosP * dz2;
      // Radien notfalls aufblasen, sonst gibt es keine Loesung
      const lam = (x1s * x1s) / (rx * rx) + (z1s * z1s) / (rz * rz);
      if (lam > 1) { const w = Math.sqrt(lam); rx *= w; rz *= w; }
      const zaehler = rx * rx * rz * rz - rx * rx * z1s * z1s - rz * rz * x1s * x1s;
      const nenner = rx * rx * z1s * z1s + rz * rz * x1s * x1s;
      let faktor = Math.sqrt(Math.max(0, zaehler / nenner));
      if (grossFlag === sweepFlag) faktor = -faktor;
      const cxs = faktor * rx * z1s / rz;
      const czs = -faktor * rz * x1s / rx;
      const cx = cosP * cxs - sinP * czs + (x0 + x1) / 2;
      const cz = sinP * cxs + cosP * czs + (z0 + z1) / 2;
      const winkel = (ux, uz, vx, vz) => {
        const p = ux * vx + uz * vz;
        const n = Math.sqrt((ux * ux + uz * uz) * (vx * vx + vz * vz));
        let a = Math.acos(Math.min(1, Math.max(-1, p / n)));
        if (ux * vz - uz * vx < 0) a = -a;
        return a;
      };
      const theta0 = winkel(1, 0, (x1s - cxs) / rx, (z1s - czs) / rz);
      let dTheta = winkel((x1s - cxs) / rx, (z1s - czs) / rz,
                          (-x1s - cxs) / rx, (-z1s - czs) / rz);
      if (!sweepFlag && dTheta > 0) dTheta -= 2 * Math.PI;
      if (sweepFlag && dTheta < 0) dTheta += 2 * Math.PI;
      const schritte = Math.max(6, Math.ceil(Math.abs(dTheta) / (Math.PI / 12)));
      for (let i = 1; i <= schritte; i++) {
        const th = theta0 + dTheta * (i / schritte);
        const ex = rx * Math.cos(th), ez = rz * Math.sin(th);
        setze(cosP * ex - sinP * ez + cx, sinP * ex + cosP * ez + cz);
      }
    };

    const teile = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
    for (const teil of teile) {
      const b = teil[0];
      const a = zahlen(teil.slice(1));
      const rel = b === b.toLowerCase();
      let i = 0;
      switch (b.toUpperCase()) {
        case 'M':
          while (i < a.length) {
            const nx = rel ? x + a[i] : a[i], nz = rel ? z + a[i + 1] : a[i + 1];
            if (i === 0) { setze(nx, nz); startX = nx; startZ = nz; }
            else setze(nx, nz);       // weitere Paare gelten als Linie
            i += 2;
          }
          break;
        case 'L':
          while (i + 1 < a.length) { setze(rel ? x + a[i] : a[i], rel ? z + a[i + 1] : a[i + 1]); i += 2; }
          break;
        case 'H':
          while (i < a.length) { setze(rel ? x + a[i] : a[i], z); i++; }
          break;
        case 'V':
          while (i < a.length) { setze(x, rel ? z + a[i] : a[i]); i++; }
          break;
        case 'C':
          while (i + 5 < a.length) {
            const x1 = rel ? x + a[i] : a[i], z1 = rel ? z + a[i + 1] : a[i + 1];
            const x2 = rel ? x + a[i + 2] : a[i + 2], z2 = rel ? z + a[i + 3] : a[i + 3];
            const x3 = rel ? x + a[i + 4] : a[i + 4], z3 = rel ? z + a[i + 5] : a[i + 5];
            const px = x, pz = z;
            kubisch(px, pz, x1, z1, x2, z2, x3, z3);
            letzterC = { x: x2, z: z2 }; i += 6;
          }
          break;
        case 'S':
          while (i + 3 < a.length) {
            const glatt = 'CS'.indexOf(letzterBefehl.toUpperCase()) >= 0 && letzterC;
            const x1 = glatt ? 2 * x - letzterC.x : x;
            const z1 = glatt ? 2 * z - letzterC.z : z;
            const x2 = rel ? x + a[i] : a[i], z2 = rel ? z + a[i + 1] : a[i + 1];
            const x3 = rel ? x + a[i + 2] : a[i + 2], z3 = rel ? z + a[i + 3] : a[i + 3];
            const px = x, pz = z;
            kubisch(px, pz, x1, z1, x2, z2, x3, z3);
            letzterC = { x: x2, z: z2 }; i += 4;
          }
          break;
        case 'Q':
          while (i + 3 < a.length) {
            const x1 = rel ? x + a[i] : a[i], z1 = rel ? z + a[i + 1] : a[i + 1];
            const x2 = rel ? x + a[i + 2] : a[i + 2], z2 = rel ? z + a[i + 3] : a[i + 3];
            const px = x, pz = z;
            quadratisch(px, pz, x1, z1, x2, z2);
            letzterQ = { x: x1, z: z1 }; i += 4;
          }
          break;
        case 'T':
          while (i + 1 < a.length) {
            const glatt = 'QT'.indexOf(letzterBefehl.toUpperCase()) >= 0 && letzterQ;
            const x1 = glatt ? 2 * x - letzterQ.x : x;
            const z1 = glatt ? 2 * z - letzterQ.z : z;
            const x2 = rel ? x + a[i] : a[i], z2 = rel ? z + a[i + 1] : a[i + 1];
            const px = x, pz = z;
            quadratisch(px, pz, x1, z1, x2, z2);
            letzterQ = { x: x1, z: z1 }; i += 2;
          }
          break;
        case 'A':
          while (i + 6 < a.length) {
            const x1 = rel ? x + a[i + 5] : a[i + 5], z1 = rel ? z + a[i + 6] : a[i + 6];
            bogen(x, z, a[i], a[i + 1], a[i + 2], !!a[i + 3], !!a[i + 4], x1, z1);
            i += 7;
          }
          break;
        case 'Z':
          setze(startX, startZ);
          break;
      }
      letzterBefehl = b;
      if ('CS'.indexOf(b.toUpperCase()) < 0) letzterC = null;
      if ('QT'.indexOf(b.toUpperCase()) < 0) letzterQ = null;
    }
    return pts;
  }

  /** Laenge eines Polygonzugs. Geschlossen heisst: der letzte Punkt zaehlt
   *  zurueck auf den ersten. */
  function polyLaenge(pts, geschlossen) {
    let s = 0;
    for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    if (geschlossen && pts.length > 1)
      s += Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].z - pts[pts.length - 1].z);
    return s;
  }

  /** Doppelte und fast doppelte Punkte entfernen - sie stoeren die
   *  Kruemmungsrechnung spaeter mehr als sie nuetzen. */
  function entdoppeln(pts, mindest) {
    const eps = mindest || 1e-4;
    const raus = [];
    for (const p of pts) {
      const l = raus[raus.length - 1];
      if (!l || Math.hypot(p.x - l.x, p.z - l.z) > eps) raus.push(p);
    }
    if (raus.length > 2) {
      const a = raus[0], b = raus[raus.length - 1];
      if (Math.hypot(a.x - b.x, a.z - b.z) < eps) raus.pop();
    }
    return raus;
  }

  /** Gleichmaessig neu abtasten: n Punkte in konstantem Abstand entlang des
   *  geschlossenen Zuges. Das ist die Form, die buildTrack braucht. */
  function gleichmaessig(pts, n) {
    const ges = polyLaenge(pts, true);
    const schritt = ges / n;
    const raus = [];
    let idx = 0, rest = 0;
    let cur = { x: pts[0].x, z: pts[0].z };
    raus.push({ x: cur.x, z: cur.z });
    for (let k = 1; k < n; k++) {
      let uebrig = schritt;
      while (uebrig > 0) {
        const naechst = pts[(idx + 1) % pts.length];
        const dx = naechst.x - cur.x, dz = naechst.z - cur.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 1e-12) { idx = (idx + 1) % pts.length; cur = { x: naechst.x, z: naechst.z }; continue; }
        if (dist >= uebrig) {
          const t = uebrig / dist;
          cur = { x: cur.x + dx * t, z: cur.z + dz * t };
          uebrig = 0;
        } else {
          uebrig -= dist;
          idx = (idx + 1) % pts.length;
          cur = { x: naechst.x, z: naechst.z };
        }
      }
      raus.push({ x: cur.x, z: cur.z });
    }
    void rest;
    return raus;
  }

  /**
   * Eine Ausbaustufe in eine fahrbare Mittellinie umrechnen.
   * @param {string} d          SVG-Pfad der Stufe
   * @param {number} meterProPx Massstab (siehe massstabFuer)
   * @param {number} punkte     Stuetzpunkte der Ausgabe (Vorgabe 240)
   * @returns {{pts:Array, laenge:number}} Punkte in Metern, um den Schwerpunkt zentriert
   */
  function stufeZuMittellinie(d, meterProPx, punkte) {
    const roh = entdoppeln(pfadZuPunkten(d));
    const gl = gleichmaessig(roh, punkte || 240);
    let mx = 0, mz = 0;
    for (const p of gl) { mx += p.x; mz += p.z; }
    mx /= gl.length; mz /= gl.length;
    /* ⚠ z spiegeln. In SVG zeigt y nach UNTEN, in der Drei-D-Szene zeigt z
       nach vorn. Ohne die Spiegelung faehrt man jede Strecke seitenverkehrt -
       aus Silverstone im Uhrzeigersinn wird eine Strecke gegen den Uhrzeiger. */
    const pts = gl.map(p => ({ x: (p.x - mx) * meterProPx, z: -(p.z - mz) * meterProPx }));
    return { pts, laenge: polyLaenge(pts, true) };
  }

  /**
   * Massstab einer Strecke: aus der Stufe, deren echte Laenge bekannt ist.
   * ⚠ Gilt fuer ALLE Stufen derselben Strecke - sie teilen sich das
   *   Koordinatensystem. Deshalb reicht EINE Laengenangabe je Strecke, und
   *   man braucht keine Tabelle mit 160 Eintraegen.
   */
  function massstabFuer(pfad, echteLaengeM) {
    const px = polyLaenge(entdoppeln(pfadZuPunkten(pfad)), true);
    return px > 0 ? (echteLaengeM / px) : 1;
  }

  /* ── Krümmung je Punkt: Richtungsänderung in Grad je Meter ───────────── */
  function kruemmung(pts) {
    const n = pts.length, k = new Array(n);
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], m = pts[i], c = pts[(i + 1) % n];
      const w1 = Math.atan2(m.z - a.z, m.x - a.x);
      const w2 = Math.atan2(c.z - m.z, c.x - m.x);
      let d = w2 - w1;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      const ds = Math.hypot(c.x - a.x, c.z - a.z) / 2;
      k[i] = ds > 1e-9 ? Math.abs(d) * 180 / Math.PI / ds : 0;
    }
    return k;
  }

  /**
   * Wo liegt Start und Ziel? Im SVG steht es NICHT.
   *
   * Abgeleitet statt gepflegt: die Linie gehoert ans ENDE der laengsten
   * Geraden. Das ist bei fast jedem echten Kurs so - und es ist zugleich die
   * einzige Stelle, an der das Startfeld ueberhaupt Platz hat. Ein 26er-Feld
   * reicht rund 120 m zurueck; steht die Linie woanders, stehen die hinteren
   * Startplaetze in einer Kurve und fahren beim Losfahren geradeaus ins
   * Kiesbett (gemessen auf der Beispielstrecke, siehe BEFUNDE.md).
   *
   * @returns {number} Index in pts, der Start/Ziel werden soll
   */
  /* ⚠ Was als GERADE gilt, entscheidet alles. Mit 0,5 Grad je Meter zaehlte
     jede sanfte Kurve mit - fuer das alte Silverstone kamen 1884 m "Gerade"
     auf einer 4,7-km-Bahn heraus, also Unsinn. Bei 12 m Punktabstand sind
     0,5 Grad/m schon 6 Grad je Schritt.
     0,12 Grad je Meter entspricht rund 480 m Radius: das faehrt man voll, und
     das Startfeld steht dort sauber in der Reihe. */
  const GERADE_GRAD_PRO_M = 0.12;

  function startZielIndex(pts, bedarfM) {
    const n = pts.length;
    const k = kruemmung(pts);
    const absch = [];
    for (let i = 0; i < n; i++) absch.push(Math.hypot(
      pts[(i + 1) % n].x - pts[i].x, pts[(i + 1) % n].z - pts[i].z));
    const gerade = k.map(x => x < GERADE_GRAD_PRO_M);
    if (!gerade.some(Boolean)) return 0;              // reines Oval
    // Laengste zusammenhaengende Gerade, ueber den Rundenschluss hinweg
    let besteLen = -1, besteAnfang = 0;
    for (let start = 0; start < n; start++) {
      if (!gerade[start] || gerade[(start - 1 + n) % n]) continue;   // nur Anfaenge
      let len = 0, i = start;
      while (gerade[i % n] && (i - start) < n) { len += absch[i % n]; i++; }
      if (len > besteLen) { besteLen = len; besteAnfang = start; }
    }
    if (besteLen < 0) return 0;
    /* ⚠ NACH DEM ERSTEN DRITTEL der Geraden, nicht an ihrem Ende.
       Nutzer: "die karierte startflagge ist zu weit hinten. ende des ersten
       drittels der zielgeraden muesste die stelle der pole-position sein."
       Das ist auch sachlich richtig: hinter der Linie steht das Feld (ein
       26er-Grid reicht rund 120 m zurueck), vor ihr muss genug Platz bleiben,
       um bis zur ersten Kurve zu beschleunigen. Am Ende der Geraden gesetzt
       hatte man beides falsch herum. */
    let i = besteAnfang, weg = 0;
    const ziel = besteLen / 3;
    while (weg < ziel) { weg += absch[i % n]; i = (i + 1) % n; }
    void bedarfM;
    return i;
  }

  /** Laenge der Geraden VOR einem Punkt - so viel Platz hat das Startfeld. */
  function geradeVor(pts, idx) {
    const n = pts.length, k = kruemmung(pts);
    let i = idx, weg = 0, schritte = 0;
    while (k[(i - 1 + n) % n] < GERADE_GRAD_PRO_M && schritte < n) {
      i = (i - 1 + n) % n;
      weg += Math.hypot(pts[(i + 1) % n].x - pts[i].x, pts[(i + 1) % n].z - pts[i].z);
      schritte++;
    }
    return weg;
  }

  /** Dreht die Punktfolge so, dass idx zum Anfang wird. */
  /**
   * Start/Ziel mit zwei Stufen.
   *
   * ⚠ Zuerst der PFADANFANG. Die Quelle zeichnet viele Kurse an der
   *   Start-Ziel-Linie an - gemessen liegen bei Silverstone und Spa je 363 m
   *   Gerade davor. Verlassen kann man sich darauf aber nicht: Catalunya und
   *   Zandvoort fangen mitten in einer Kurve an (0 m).
   *   Hat der Pfadanfang genug Gerade fuer das Startfeld, ist er die
   *   ehrlichste Wahl - er trifft die ECHTE Linie. Sonst wird sie ueber die
   *   laengste Gerade gesetzt: nicht immer die richtige Stelle, aber immer
   *   eine fahrbare.
   */
  function startZiel(pts, bedarfM) {
    const bedarf = bedarfM || 150;
    if (geradeVor(pts, 0) >= bedarf) return { idx: 0, quelle: 'Pfadanfang' };
    return { idx: startZielIndex(pts), quelle: 'laengste Gerade' };
  }

  function aufStartDrehen(pts, idx) {
    return pts.slice(idx).concat(pts.slice(0, idx));
  }

  /**
   * Fahrtrichtung. Im SVG steht sie NICHT - ob ein Pfad im oder gegen den
   * Uhrzeigersinn gezeichnet wurde, ist Zufall der Quelle.
   * Vorzeichen der Flaeche sagt, wie er LIEGT; gedreht wird auf die
   * gewuenschte Richtung.
   */
  function flaeche(pts) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      s += a.x * b.z - b.x * a.z;
    }
    return s / 2;
  }
  function richtungSetzen(pts, imUhrzeigersinn) {
    /* In der Szene zeigt x nach rechts und z nach vorn (rechtshaendig), eine
       positive Flaeche bedeutet damit GEGEN den Uhrzeigersinn von oben. */
    const gegen = flaeche(pts) > 0;
    return (gegen === !imUhrzeigersinn) ? pts : pts.slice().reverse();
  }

  const API = { pfadZuPunkten, polyLaenge, entdoppeln, gleichmaessig,
                stufeZuMittellinie, massstabFuer,
                kruemmung, startZielIndex, startZiel, geradeVor, aufStartDrehen,
                flaeche, richtungSetzen };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else global.STRECKEN = API;
})(typeof window !== 'undefined' ? window : globalThis);
