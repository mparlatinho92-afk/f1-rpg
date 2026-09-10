/* ═══════════════════════════════════════════════════════════════════════════
   WAGEN-GENERATOR — ein Modell je Ära, prozedural

   Warum prozedural statt Modelldateien:
     Ein exportiertes Modell des 80er-Formstudios wiegt 608 KB. Bei 16 Jahr-
     fünften waeren das 9,7 MB, nur fuer Karosserien. Hier entsteht der Wagen
     beim Laden aus einem Parametersatz — rund 300 Bytes je Aera.

   Wie detailliert? Gemessen am Formstudio-Modell (16.384 Dreiecke):
     Fahrer + Helm     43,4 %   ← auf der Strecke wenige Pixel gross
     Karosserie        24,2 %
     Raeder            10,7 %
     Spiegel/Auspuff   10,2 %
     Cockpit innen     10,0 %   ← Pedale und Schaltkulisse sieht nie jemand
     Fluegel            1,5 %   ← macht die AERA erkennbar, kostet fast nichts
   Das Formstudio brauchte diese Tiefe (Nutzer-Anforderung, aus zwei Metern
   betrachtet). Auf der Rennstrecke mit 26 Wagen zaehlt die SILHOUETTE:
   Zigarre gegen Keil, schmale gegen breite Reifen, Fluegel ja/nein/hoch/tief,
   Airbox, Wing-Car-Schuerzen, Halo. Ziel hier: ~1.500 Dreiecke je Wagen.

   Was die Ären unterscheidet (Erkennungsmerkmale, nicht Vollstaendigkeit):
     1950-57  Zigarre, Frontmotor, sehr schmale hohe Raeder, kein Fluegel
     1958-65  Zigarre, Heckmotor, flacher, noch schmale Raeder
     1966-67  breitere Reifen, dickerer Rumpf — noch immer keine Fluegel
     1968-69  ERSTE FLUEGEL, hoch auf Stelzen
     1970-76  Keilform, Hochairbox, breite Slicks, tiefere Fluegel
     1977-82  Wing-Car: Seitenkaesten mit Schuerzen, Taille (Coke-Bottle)
     1983-88  Turbo, flache Keilnase, Airbox zurueck, tiefe Fluegel
     1989-97  hohe schmale Nase beginnt, schmalere Karosserie
     1998-08  schmale Spur, hohe Nase, viele Winglets (hier angedeutet)
     2009-16  breite Frontfluegel, sehr niedrige Nase, schmaler Heckfluegel
     2017-25  wieder breit, Halo ab 2018

   Parameterbedeutung: siehe ARCHETYPEN unten. Die Namen folgen dem
   Formstudio-Wortschatz (Radstand, Nasenlaenge, Taille, Airbox …), damit
   Werte von dort uebernommen werden koennen.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Reale Wagenbreiten als Anker (Nutzer-Vorgabe):
   1950 1,47 m · 1960 1,55 m · 1970 1,88 m · 1980 2,00 m · 2026 1,90 m */
const WAGEN_AEREN = [
  // [abJahr, bisJahr, name, parameter]
  [1950, 1957, 'Front-Zigarre', {
    breite: 1.47, laenge: 3.95, hoehe: 0.95, radstand: 2.35,
    rumpfBreite: 0.62, rumpfHoehe: 0.52, bodenfreiheit: 0.14,
    nasenLaenge: 1.05, nasenSpitze: 0.34, nasenHoehe: 0.42, nasenRund: 0.9,
    reifenBreiteV: 0.15, reifenBreiteH: 0.18, radR: 0.37,
    frontFluegel: 0, heckFluegel: 0, airbox: 0, schuerzen: 0, halo: 0,
    taille: 0.05, cockpitOffen: 0.55, ueberrollbuegel: 0.0
  }],
  [1958, 1965, 'Heck-Zigarre', {
    breite: 1.55, laenge: 3.85, hoehe: 0.82, radstand: 2.30,
    rumpfBreite: 0.60, rumpfHoehe: 0.44, bodenfreiheit: 0.10,
    nasenLaenge: 0.95, nasenSpitze: 0.30, nasenHoehe: 0.32, nasenRund: 0.85,
    reifenBreiteV: 0.16, reifenBreiteH: 0.21, radR: 0.33,
    frontFluegel: 0, heckFluegel: 0, airbox: 0, schuerzen: 0, halo: 0,
    taille: 0.08, cockpitOffen: 0.60, ueberrollbuegel: 0.10
  }],
  [1966, 1967, 'Breitreifen ohne Flügel', {
    breite: 1.70, laenge: 4.05, hoehe: 0.85, radstand: 2.40,
    rumpfBreite: 0.66, rumpfHoehe: 0.46, bodenfreiheit: 0.09,
    nasenLaenge: 0.90, nasenSpitze: 0.34, nasenHoehe: 0.30, nasenRund: 0.8,
    reifenBreiteV: 0.21, reifenBreiteH: 0.30, radR: 0.32,
    frontFluegel: 0, heckFluegel: 0, airbox: 0, schuerzen: 0, halo: 0,
    taille: 0.10, cockpitOffen: 0.60, ueberrollbuegel: 0.14
  }],
  [1968, 1969, 'Erste Flügel', {
    breite: 1.75, laenge: 4.15, hoehe: 1.15, radstand: 2.42,
    rumpfBreite: 0.66, rumpfHoehe: 0.46, bodenfreiheit: 0.09,
    nasenLaenge: 0.92, nasenSpitze: 0.32, nasenHoehe: 0.30, nasenRund: 0.75,
    reifenBreiteV: 0.23, reifenBreiteH: 0.34, radR: 0.32,
    frontFluegel: 1, ffBreite: 1.10, ffHoehe: 0.30, ffTiefe: 0.24,
    heckFluegel: 1, hfBreite: 1.05, hfHoehe: 0.95, hfTiefe: 0.30, hfStelzen: 1,
    airbox: 0, schuerzen: 0, halo: 0,
    taille: 0.10, cockpitOffen: 0.58, ueberrollbuegel: 0.16
  }],
  [1970, 1976, 'Keil mit Hochairbox', {
    breite: 1.88, laenge: 4.30, hoehe: 1.05, radstand: 2.55,
    rumpfBreite: 0.70, rumpfHoehe: 0.44, bodenfreiheit: 0.07,
    nasenLaenge: 0.95, nasenSpitze: 0.34, nasenHoehe: 0.24, nasenRund: 0.35,
    reifenBreiteV: 0.26, reifenBreiteH: 0.44, radR: 0.33,
    frontFluegel: 1, ffBreite: 1.35, ffHoehe: 0.20, ffTiefe: 0.28,
    heckFluegel: 1, hfBreite: 1.25, hfHoehe: 0.72, hfTiefe: 0.34, hfStelzen: 0,
    airbox: 1, airboxHoehe: 0.42, airboxBreite: 0.34,
    schuerzen: 0, halo: 0,
    taille: 0.14, cockpitOffen: 0.52, ueberrollbuegel: 0.10
  }],
  [1977, 1982, 'Wing-Car', {
    breite: 2.00, laenge: 4.45, hoehe: 1.00, radstand: 2.65,
    rumpfBreite: 0.66, rumpfHoehe: 0.42, bodenfreiheit: 0.04,
    nasenLaenge: 1.00, nasenSpitze: 0.36, nasenHoehe: 0.22, nasenRund: 0.25,
    reifenBreiteV: 0.28, reifenBreiteH: 0.50, radR: 0.33,
    frontFluegel: 1, ffBreite: 1.42, ffHoehe: 0.17, ffTiefe: 0.30,
    heckFluegel: 1, hfBreite: 1.30, hfHoehe: 0.70, hfTiefe: 0.36, hfStelzen: 0,
    airbox: 1, airboxHoehe: 0.30, airboxBreite: 0.30,
    schuerzen: 1, seitenkasten: 1,
    halo: 0, taille: 0.22, cockpitOffen: 0.48, ueberrollbuegel: 0.12
  }],
  [1983, 1988, 'Turbo-Keil', {
    breite: 2.00, laenge: 4.50, hoehe: 0.95, radstand: 2.72,
    rumpfBreite: 0.64, rumpfHoehe: 0.40, bodenfreiheit: 0.05,
    nasenLaenge: 1.05, nasenSpitze: 0.34, nasenHoehe: 0.24, nasenRund: 0.2,
    reifenBreiteV: 0.28, reifenBreiteH: 0.52, radR: 0.33,
    frontFluegel: 1, ffBreite: 1.45, ffHoehe: 0.15, ffTiefe: 0.30,
    heckFluegel: 1, hfBreite: 1.32, hfHoehe: 0.68, hfTiefe: 0.36, hfStelzen: 0,
    airbox: 1, airboxHoehe: 0.34, airboxBreite: 0.32,
    schuerzen: 0, seitenkasten: 1, halo: 0,
    taille: 0.24, cockpitOffen: 0.46, ueberrollbuegel: 0.14
  }],
  [1989, 1997, 'Hohe Nase', {
    breite: 2.00, laenge: 4.45, hoehe: 0.95, radstand: 2.90,
    rumpfBreite: 0.58, rumpfHoehe: 0.38, bodenfreiheit: 0.05,
    nasenLaenge: 1.10, nasenSpitze: 0.34, nasenHoehe: 0.42, nasenRund: 0.3,
    reifenBreiteV: 0.28, reifenBreiteH: 0.50, radR: 0.32,
    frontFluegel: 1, ffBreite: 1.50, ffHoehe: 0.12, ffTiefe: 0.30,
    heckFluegel: 1, hfBreite: 1.20, hfHoehe: 0.72, hfTiefe: 0.34, hfStelzen: 0,
    airbox: 1, airboxHoehe: 0.36, airboxBreite: 0.28,
    schuerzen: 0, seitenkasten: 1, halo: 0,
    taille: 0.24, cockpitOffen: 0.40, ueberrollbuegel: 0.18
  }],
  [1998, 2008, 'Schmalspur', {
    breite: 1.80, laenge: 4.55, hoehe: 0.95, radstand: 3.05,
    rumpfBreite: 0.52, rumpfHoehe: 0.36, bodenfreiheit: 0.05,
    nasenLaenge: 1.15, nasenSpitze: 0.30, nasenHoehe: 0.48, nasenRund: 0.3,
    reifenBreiteV: 0.24, reifenBreiteH: 0.40, radR: 0.31,
    frontFluegel: 1, ffBreite: 1.40, ffHoehe: 0.11, ffTiefe: 0.28,
    heckFluegel: 1, hfBreite: 1.00, hfHoehe: 0.78, hfTiefe: 0.30, hfStelzen: 0,
    airbox: 1, airboxHoehe: 0.34, airboxBreite: 0.26,
    schuerzen: 0, seitenkasten: 1, halo: 0,
    taille: 0.26, cockpitOffen: 0.34, ueberrollbuegel: 0.20
  }],
  [2009, 2016, 'Breiter Frontflügel', {
    breite: 1.80, laenge: 4.80, hoehe: 0.95, radstand: 3.20,
    rumpfBreite: 0.52, rumpfHoehe: 0.34, bodenfreiheit: 0.04,
    nasenLaenge: 1.20, nasenSpitze: 0.28, nasenHoehe: 0.30, nasenRund: 0.25,
    reifenBreiteV: 0.24, reifenBreiteH: 0.38, radR: 0.31,
    frontFluegel: 1, ffBreite: 1.80, ffHoehe: 0.08, ffTiefe: 0.32,
    heckFluegel: 1, hfBreite: 0.75, hfHoehe: 0.82, hfTiefe: 0.28, hfStelzen: 0,
    airbox: 1, airboxHoehe: 0.32, airboxBreite: 0.24,
    schuerzen: 0, seitenkasten: 1, halo: 0,
    taille: 0.28, cockpitOffen: 0.32, ueberrollbuegel: 0.20
  }],
  [2017, 2099, 'Moderne Breitspur', {
    breite: 2.00, laenge: 5.30, hoehe: 0.95, radstand: 3.45,
    rumpfBreite: 0.56, rumpfHoehe: 0.34, bodenfreiheit: 0.04,
    nasenLaenge: 1.25, nasenSpitze: 0.30, nasenHoehe: 0.32, nasenRund: 0.2,
    reifenBreiteV: 0.30, reifenBreiteH: 0.40, radR: 0.34,
    frontFluegel: 1, ffBreite: 1.90, ffHoehe: 0.07, ffTiefe: 0.34,
    heckFluegel: 1, hfBreite: 1.02, hfHoehe: 0.80, hfTiefe: 0.32, hfStelzen: 0,
    airbox: 1, airboxHoehe: 0.34, airboxBreite: 0.26,
    schuerzen: 0, seitenkasten: 1, halo: 1,
    taille: 0.30, cockpitOffen: 0.30, ueberrollbuegel: 0.22
  }]
];

function wagenParamFuer(jahr) {
  for (const [von, bis, name, p] of WAGEN_AEREN) {
    if (jahr >= von && jahr <= bis) return Object.assign({ _name: name, _von: von, _bis: bis }, p);
  }
  return Object.assign({ _name: 'Fallback' }, WAGEN_AEREN[WAGEN_AEREN.length - 1][3]);
}

/* ── Bausteine ────────────────────────────────────────────────────────────
   Bewusst wenige, grobe Formen. Jede zusaetzliche Unterteilung kostet
   Dreiecke mal 26 Wagen auf der Strecke. */

function _box(b, h, t, mat) {
  return new THREE.Mesh(new THREE.BoxGeometry(b, h, t), mat);
}

/* Rumpf als verjuengter Koerper aus wenigen Querschnitten. Der Formstudio-
   Ansatz (geloftete Superellipsen) waere schoener, kostet aber ein Vielfaches;
   hier reicht ein Zylinder mit wenigen Segmenten, oben abgeflacht. */
function _rumpf(p, mat) {
  const g = new THREE.CylinderGeometry(p.rumpfBreite / 2, p.rumpfBreite / 2 * 0.82,
    p.laenge * 0.52, 8, 1, false);
  g.rotateX(Math.PI / 2);
  g.scale(1, p.rumpfHoehe / p.rumpfBreite, 1);
  return new THREE.Mesh(g, mat);
}

function _nase(p, laenge, mat) {
  const g = new THREE.CylinderGeometry(p.nasenSpitze / 2, p.rumpfBreite / 2,
    laenge, 7, 1, false);
  g.rotateX(Math.PI / 2);
  g.scale(1, Math.max(0.35, p.nasenHoehe / p.nasenSpitze) * (p.nasenRund * 0.5 + 0.5), 1);
  return new THREE.Mesh(g, mat);
}

function _rad(p, hinten, mat) {
  const br = hinten ? p.reifenBreiteH : p.reifenBreiteV;
  const g = new THREE.CylinderGeometry(p.radR, p.radR, br, 10);
  g.rotateZ(Math.PI / 2);
  return new THREE.Mesh(g, mat);
}

function _fluegel(breite, tiefe, mat) {
  return _box(breite, 0.035, tiefe, mat);
}

/* ── Der Wagen ────────────────────────────────────────────────────────────
   farben: Array aus getTeamColors — [haupt] bis [haupt, zweit, dritt].
   Das Modell ist EINS je Aera; die Livery macht den Unterschied zwischen
   den Teams. Sonderformen (Sechsrad-Tyrrell, Eifelland) sind bewusst NICHT
   abgebildet — Nutzer-Entscheidung: "diese unterscheidung muss nicht sein". */
function baueWagen(jahr, farben) {
  const p = wagenParamFuer(jahr);
  const haupt = (farben && farben[0]) || '#cccccc';
  const zweit = (farben && farben[1]) || haupt;

  const mLack = new THREE.MeshStandardMaterial({ color: new THREE.Color(haupt), roughness: 0.42, metalness: 0.12 });
  const mZweit = new THREE.MeshStandardMaterial({ color: new THREE.Color(zweit), roughness: 0.42, metalness: 0.12 });
  const mDunkel = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.85 });
  const mFelge = new THREE.MeshStandardMaterial({ color: 0xb8b8bd, roughness: 0.4, metalness: 0.6 });
  const mHelm = new THREE.MeshStandardMaterial({ color: new THREE.Color(zweit), roughness: 0.3 });

  const g = new THREE.Group();
  const halbeL = p.laenge / 2;

  // Rumpf sitzt hinter der Mitte, Nase davor
  const rumpf = _rumpf(p, mLack);
  rumpf.position.set(0, p.bodenfreiheit + p.rumpfHoehe / 2, -p.laenge * 0.08);
  g.add(rumpf);

  // Aufbau ueber der Wanne: hebt Cockpitrand und Motorabdeckung von der
  // Grundform ab. Ohne ihn liest sich der Wagen als flaches Brett.
  const aufbau = _box(p.rumpfBreite * 0.78, p.rumpfHoehe * 0.55, p.laenge * 0.30, mLack);
  aufbau.position.set(0, p.bodenfreiheit + p.rumpfHoehe * 0.92, -p.laenge * 0.16);
  g.add(aufbau);

  // Getriebe hinter der Hinterachse: ohne es endete die Karosserie 13 cm
  // hinter der Achse und der Heckfluegel schwebte frei dahinter.
  const rumpfHintenZ = -p.laenge * 0.34;
  const getrL = p.laenge * 0.10;
  const getriebe = _box(p.rumpfBreite * 0.46, p.rumpfHoehe * 0.60, getrL, mDunkel);
  getriebe.position.set(0, p.bodenfreiheit + p.rumpfHoehe * 0.32,
    rumpfHintenZ - getrL / 2 + 0.02);
  g.add(getriebe);

  const rumpfVornZ = -p.laenge * 0.08 + p.laenge * 0.26;
  const naseSpitzeZ = halbeL - 0.15;
  const naseL = naseSpitzeZ - rumpfVornZ + 0.06;   // 6 cm Ueberlappung
  const nase = _nase(p, naseL, mLack);
  nase.position.set(0, p.bodenfreiheit + p.nasenHoehe, naseSpitzeZ - naseL / 2 + 0.03);
  g.add(nase);

  // Seitenkaesten (ab Wing-Car-Aera deutlich, davor nur angedeutet)
  if (p.seitenkasten) {
    // Breite aus der Luecke zwischen Rumpf und Radinnenkante ableiten, nicht
    // pauschal aus der Wagenbreite: sonst steckt der Kasten IM Vorderrad.
    const radInnen = p.breite / 2 - Math.max(p.reifenBreiteV, p.reifenBreiteH);
    const skBreite = Math.max(0.12, (radInnen - p.rumpfBreite / 2) * 0.86);
    for (const s of [-1, 1]) {
      const sk = _box(skBreite, p.rumpfHoehe * 0.62, p.laenge * 0.28, mZweit);
      sk.position.set(s * (p.rumpfBreite / 2 + skBreite / 2),
        p.bodenfreiheit + p.rumpfHoehe * 0.34, -p.laenge * 0.02);
      g.add(sk);
      if (p.schuerzen) {
        const sch = _box(0.03, p.bodenfreiheit + 0.05, p.laenge * 0.32, mDunkel);
        sch.position.set(s * (p.rumpfBreite / 2 + skBreite),
          (p.bodenfreiheit + 0.05) / 2, -p.laenge * 0.04);
        g.add(sch);
      }
    }
  }

  // Airbox / Ueberrollbuegel
  if (p.airbox) {
    const ab = _box(p.airboxBreite, p.airboxHoehe, p.airboxBreite * 1.5, mLack);
    ab.position.set(0, p.bodenfreiheit + p.rumpfHoehe + p.airboxHoehe / 2 - 0.04, -p.laenge * 0.16);
    g.add(ab);
  } else if (p.ueberrollbuegel > 0) {
    const bu = _box(p.rumpfBreite * 0.7, p.ueberrollbuegel, 0.06, mDunkel);
    bu.position.set(0, p.bodenfreiheit + p.rumpfHoehe + p.ueberrollbuegel / 2 - 0.02, -p.laenge * 0.10);
    g.add(bu);
  }

  // Cockpitoeffnung + Fahrerhelm (grob: eine Kugel, mehr sieht man nie)
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.135, 8, 6), mHelm);
  helm.position.set(0, p.bodenfreiheit + p.rumpfHoehe + 0.02, p.laenge * 0.02);
  g.add(helm);

  // Fluegel
  if (p.frontFluegel) {
    // Fluegelblatt in der HAUPTfarbe: bei hellem Zweitton verschwand sonst
    // genau das Merkmal, an dem die Aera zu erkennen ist.
    // Hinterkante nie vor der Nasenspitze: sonst haengt der Fluegel im Nichts.
    const ffZ = Math.min(halbeL - p.ffTiefe / 2 - 0.02, naseSpitzeZ - p.ffTiefe * 0.25);
    const ffY = p.bodenfreiheit + p.ffHoehe;
    const ff = _fluegel(p.ffBreite, p.ffTiefe, mLack);
    ff.position.set(0, ffY, ffZ);
    g.add(ff);
    for (const s of [-1, 1]) {
      const ep = _box(0.02, p.ffTiefe * 0.7, p.ffTiefe, mZweit);
      ep.position.set(s * p.ffBreite / 2, ffY + p.ffTiefe * 0.3, ffZ);
      g.add(ep);
    }
    // Halter zur Nase - ab der Hochnasen-Aera lang und das sichtbare Merkmal,
    // davor kurz. Immer setzen: ohne Anbindung liest sich der Fluegel als
    // loser Kasten vor dem Wagen.
    const ffStH = Math.max(0.06, p.bodenfreiheit + p.nasenHoehe - ffY);
    {
      for (const s of [-1, 1]) {
        const st = _box(0.04, ffStH, 0.06, mDunkel);
        st.position.set(s * p.nasenSpitze * 0.32, ffY + ffStH / 2, ffZ + p.ffTiefe * 0.25);
        g.add(st);
      }
    }
  }
  if (p.heckFluegel) {
    // Bezug ist die Hinterachse, nicht das Laengen-Ende: sonst wandert der
    // Fluegel bei langen Aeren immer weiter nach hinten weg.
    const achseHz = -p.radstand / 2;
    const hfZ = p.hfStelzen ? achseHz - 0.05
      : Math.max(-halbeL + p.hfTiefe / 2, achseHz - 0.42);
    const hf = _fluegel(p.hfBreite, p.hfTiefe, mLack);
    hf.position.set(0, p.hfHoehe, hfZ);
    g.add(hf);
    for (const s of [-1, 1]) {
      const ep = _box(0.02, p.hfTiefe * 0.9, p.hfTiefe, mZweit);
      ep.position.set(s * p.hfBreite / 2, p.hfHoehe + p.hfTiefe * 0.2, hfZ);
      g.add(ep);
    }
    // Stelzen der 68er-Aera sind das Erkennungsmerkmal schlechthin
    const stH = p.hfHoehe - p.bodenfreiheit - p.rumpfHoehe * 0.5;
    if (stH > 0.05) {
      if (p.hfStelzen) {
        for (const s of [-1, 1]) {
          const st = _box(0.035, stH, 0.05, mDunkel);
          st.position.set(s * p.rumpfBreite * 0.28, p.hfHoehe - stH / 2, hfZ + 0.02);
          g.add(st);
        }
      } else {
        const st = _box(p.rumpfBreite * 0.30, stH, p.hfTiefe * 0.55, mDunkel);
        st.position.set(0, p.hfHoehe - stH / 2, hfZ + 0.02);
        g.add(st);
      }
    }
  }

  // Halo ab 2018
  if (p.halo) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.028, 5, 10, Math.PI), mDunkel);
    ring.rotation.x = Math.PI / 2; ring.rotation.z = Math.PI;
    ring.position.set(0, p.bodenfreiheit + p.rumpfHoehe + 0.10, p.laenge * 0.02);
    g.add(ring);
  }

  // Raeder
  const achseV = p.radstand / 2, achseH = -p.radstand / 2;
  for (const [z, hinten] of [[achseV, false], [achseH, true]]) {
    const br = hinten ? p.reifenBreiteH : p.reifenBreiteV;
    for (const s of [-1, 1]) {
      const r = _rad(p, hinten, mDunkel);
      r.position.set(s * (p.breite / 2 - br / 2), p.radR, z);
      g.add(r);
      const f = new THREE.Mesh(new THREE.CylinderGeometry(p.radR * 0.45, p.radR * 0.45, br * 1.02, 8), mFelge);
      f.rotateZ(Math.PI / 2);
      f.position.copy(r.position);
      g.add(f);

      const nabeX = Math.abs(r.position.x) - br / 2;
      const wurzelX = p.rumpfBreite * 0.42;
      const spanne = nabeX - wurzelX;
      if (spanne > 0.05) {
        for (const [hoehe, tiefe] of [[p.radR * 1.05, 0.05], [p.radR * 0.45, 0.06]]) {
          const ql = _box(spanne, 0.035, tiefe, mDunkel);
          ql.position.set(s * (wurzelX + spanne / 2), hoehe, z);
          g.add(ql);
        }
      }
    }
  }

  g.userData.aera = p._name;
  g.userData.jahr = jahr;
  return g;
}

function wagenDreiecke(gruppe) {
  let n = 0;
  gruppe.traverse(o => {
    if (o.geometry && o.geometry.attributes && o.geometry.attributes.position) {
      const g = o.geometry;
      n += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
    }
  });
  return Math.round(n);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WAGEN_AEREN, wagenParamFuer, baueWagen, wagenDreiecke };
}
