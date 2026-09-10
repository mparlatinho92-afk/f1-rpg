/**
 * test-wagen.js — rendert alle Ära-Wagen und misst sie.
 *
 *   node zielflagge/test-wagen.js
 *
 * Orthografische Kamera: jeder Wagen erscheint gleich groß, egal wo er im
 * Raster steht. Mit Perspektive schrumpften die hinteren Wagen und fielen aus
 * dem Bild — dann vergleicht man Kameraabstand statt Silhouette.
 *
 * Erzeugt in den Scratchpad:
 *   wagen-raster.png     alle Ären im Raster, Dreiviertelblick
 *   wagen-profil.png     alle Ären in reiner Seitenansicht (Ära liest sich
 *                        im Profil am klarsten: Flügelhöhe, Nase, Räder)
 *   wagen-1967-1968.png  der kritische Vergleich (erste Flügel)
 *   wagen-einzeln.png    ein Wagen groß, drei Blickwinkel
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = process.env.ZF_OUT ||
    'C:/Users/lyric/AppData/Local/Temp/claude/C--Users-lyric-Documents-F1-RPG-HTML/08f77b69-81cd-4baa-8be8-b505e1de5216/scratchpad/';

const JAHRE = [1954, 1962, 1967, 1968, 1973, 1979, 1985, 1993, 2003, 2012, 2022];
const FARBEN = ['#DC0000', '#005AFF', '#FFD100', '#00A550', '#FF8000', '#9B0000',
    '#0B0B0B', '#163476', '#C0C0C4', '#1A52CC', '#E8477E'];
const ZWEIT = ['#FFFFFF', '#FFD100', '#0B0B0B', '#FFFFFF', '#0B0B0B', '#FFD100',
    '#D4AF37', '#FFFFFF', '#DC0000', '#FF8000', '#0B0B0B'];

(async () => {
    const three = fs.readFileSync(path.join(__dirname, 'three.min.js'), 'utf8');
    const wagen = fs.readFileSync(path.join(__dirname, 'wagen.js'), 'utf8');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{margin:0;background:#6f7a82}canvas{display:block}</style></head>
<body><canvas id="c" width="1500" height="900"></canvas>
<script>${three}<\/script>
<script>${wagen}<\/script>
<script>
const B = 1500, H = 900;
const sc = new THREE.Scene();
sc.background = new THREE.Color(0x6f7a82);
const rd = new THREE.WebGLRenderer({canvas:document.getElementById('c'), antialias:true});
rd.setSize(B,H,false);
sc.add(new THREE.HemisphereLight(0xffffff, 0x55606a, 1.0));
const dl = new THREE.DirectionalLight(0xffffff, 0.95); dl.position.set(5,9,6); sc.add(dl);
const dl2 = new THREE.DirectionalLight(0xffffff, 0.35); dl2.position.set(-6,4,-5); sc.add(dl2);
const boden = new THREE.Mesh(new THREE.PlaneGeometry(400,400),
  new THREE.MeshStandardMaterial({color:0x5c666e, roughness:1}));
boden.rotation.x = -Math.PI/2; boden.position.y = -0.001; sc.add(boden);

// Orthografisch: gleiche Groesse an jeder Rasterstelle.
const cam = new THREE.OrthographicCamera(-1,1,1,-1, 0.1, 400);

window.JAHRE = ${JSON.stringify(JAHRE)};
window.INFO = [];
const gruppen = [];
JAHRE.forEach((j, i) => {
  const w = baueWagen(j, [${JSON.stringify(FARBEN)}[i], ${JSON.stringify(ZWEIT)}[i]]);
  gruppen.push(w);
  window.INFO.push({ jahr: j, aera: w.userData.aera, tris: wagenDreiecke(w) });
});

function leeren(){ gruppen.forEach(w => { if (w.parent) sc.remove(w); }); }
function stellen(i, x, z, drehung){
  const w = gruppen[i];
  w.position.set(x, 0, z);
  w.rotation.y = drehung || 0;
  sc.add(w);
}
// Sichtfeld in Weltmetern setzen (halbe Breite), Kamera aus Kugelkoordinaten.
function blick(theta, phi, halbBreite, mitteX, mitteZ){
  const hb = halbBreite, hh = hb * H / B;
  cam.left = -hb; cam.right = hb; cam.top = hh; cam.bottom = -hh;
  cam.updateProjectionMatrix();
  const r = 60;
  cam.position.set(
    (mitteX||0) + r*Math.sin(phi)*Math.sin(theta),
    r*Math.cos(phi) + 0.5,
    (mitteZ||0) + r*Math.sin(phi)*Math.cos(theta));
  cam.lookAt(mitteX||0, 0.5, mitteZ||0);
  rd.render(sc, cam);
}

/* Raster: spalten x zeilen, Dreiviertelblick von vorn rechts. */
window.zeigeRaster = function(spalten, dx, dz, theta, phi){
  leeren();
  const n = gruppen.length, zeilen = Math.ceil(n/spalten);
  for (let i=0;i<n;i++){
    const sp = i % spalten, ze = (i / spalten) | 0;
    stellen(i, (sp - (spalten-1)/2) * dx, (ze - (zeilen-1)/2) * dz, 0);
  }
  blick(theta, phi, spalten * dx * 0.70, 0, 0);
};
/* Profil als Tafel: spalten x zeilen, reine Seitenansicht. */
window.zeigeProfil = function(spalten, dz, dy){
  leeren();
  boden.visible = false;
  const n = gruppen.length, zeilen = Math.ceil(n/spalten);
  for (let i=0;i<n;i++){
    const sp = i % spalten, ze = (i / spalten) | 0;
    const w = gruppen[i];
    w.position.set(0, (zeilen-1-ze - (zeilen-1)/2) * dy, (sp - (spalten-1)/2) * dz);
    w.rotation.y = 0;
    sc.add(w);
  }
  const hb = spalten * dz * 0.52;
  cam.left = -hb; cam.right = hb;
  const hh = hb * H / B;
  cam.top = hh; cam.bottom = -hh;
  cam.updateProjectionMatrix();
  cam.position.set(60, 0.45, 0);
  cam.lookAt(0, 0.45, 0);
  rd.render(sc, cam);
  boden.visible = true;
};
/* Ein Paar gross nebeneinander. */
window.zeigePaar = function(a, b, theta, phi){
  leeren();
  stellen(a, -2.6, 0, 0); stellen(b, 2.6, 0, 0);
  blick(theta, phi, 5.4, 0, 0);
};
/* Ein Wagen gross, drei Blickwinkel nebeneinander (gleiches Modell 3x). */
window.zeigeEinzeln = function(i, theta, phi, halbBreite){
  leeren();
  stellen(i, 0, 0, 0);
  blick(theta, phi, halbBreite || 2.9, 0, 0);
};
window.zeigeRaster(4, 4.2, 6.2, 0.42, 1.05);
<\/script></body></html>`;

    const tmp = OUT + 'wagen-view.html';
    fs.writeFileSync(tmp, html, 'utf8');

    const b = await chromium.launch();
    const p = await b.newPage({ viewport: { width: 1500, height: 900 } });
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file:///' + tmp.split(String.fromCharCode(92)).join('/'), { waitUntil: 'load' });
    await p.waitForTimeout(1500);

    const info = await p.evaluate(() => window.INFO);
    console.log('Jahr   Ära                          Dreiecke');
    console.log('-'.repeat(48));
    let summe = 0;
    info.forEach(x => {
        summe += x.tris;
        console.log(String(x.jahr).padEnd(7) + x.aera.padEnd(30) + String(x.tris).padStart(6));
    });
    console.log('-'.repeat(48));
    console.log('Schnitt je Wagen: ' + Math.round(summe / info.length) + ' Dreiecke');
    console.log('26 Wagen im Feld: ~' + Math.round(summe / info.length * 26 / 1000) + 'k Dreiecke');

    const schuss = async (name, fn, arg) => {
        await p.evaluate(([f, a]) => window[f].apply(null, a), [fn, arg]);
        await p.waitForTimeout(250);
        await p.screenshot({ path: OUT + name + '.png' });
    };
    await schuss('wagen-raster', 'zeigeRaster', [4, 4.2, 6.2, 0.42, 1.05]);
    await schuss('wagen-profil', 'zeigeProfil', [3, 5.0, 1.55]);
    await schuss('wagen-1967-1968', 'zeigePaar', [2, 3, 0.55, 1.12]);
    await schuss('wagen-einzeln', 'zeigeEinzeln', [6, 0.75, 1.10, 2.6]);

    console.log('\nSkriptfehler: ' + (errs.length ? errs.join(' | ') : 'keine'));
    console.log('Bilder in: ' + OUT);
    await b.close();
})();
