/**
 * test-wagen.js — rendert alle Ära-Wagen nebeneinander und misst sie.
 *
 *   node zielflagge/test-wagen.js
 *
 * Erzeugt Screenshots in den Scratchpad und meldet Dreiecke je Ära, damit
 * beurteilbar ist, ob die Silhouetten unterscheidbar sind — besonders die
 * Fälle, die der Nutzer genannt hat: 1967 gegen 1968 (erste Flügel).
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = process.env.ZF_OUT ||
    'C:/Users/lyric/AppData/Local/Temp/claude/C--Users-lyric-Documents-F1-RPG-HTML/08f77b69-81cd-4baa-8be8-b505e1de5216/scratchpad/';

const JAHRE = [1954, 1962, 1967, 1968, 1973, 1979, 1985, 1993, 2003, 2012, 2022];
const FARBEN = ['#DC0000', '#005AFF', '#FFD100', '#00A550', '#FF8000',
    '#9B0000', '#B81515', '#163476', '#00A550', '#1A52CC', '#FF8000'];

(async () => {
    const three = fs.readFileSync(path.join(__dirname, 'three.min.js'), 'utf8');
    const wagen = fs.readFileSync(path.join(__dirname, 'wagen.js'), 'utf8');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{margin:0;background:#eceae5}canvas{display:block}</style></head>
<body><canvas id="c" width="1400" height="780"></canvas>
<script>${three}<\/script>
<script>${wagen}<\/script>
<script>
const sc = new THREE.Scene();
sc.background = new THREE.Color(0xeceae5);
const cam = new THREE.PerspectiveCamera(35, 1400/780, 0.1, 400);
const rd = new THREE.WebGLRenderer({canvas:document.getElementById('c'), antialias:true});
rd.setSize(1400,780,false);
sc.add(new THREE.HemisphereLight(0xffffff, 0x667788, 1.0));
const dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(5,9,6); sc.add(dl);
const dl2 = new THREE.DirectionalLight(0xffffff, 0.3); dl2.position.set(-6,4,-5); sc.add(dl2);
const boden = new THREE.Mesh(new THREE.PlaneGeometry(200,200),
  new THREE.MeshStandardMaterial({color:0xd8d5cf, roughness:1}));
boden.rotation.x = -Math.PI/2; boden.position.y = -0.001; sc.add(boden);

window.JAHRE = ${JSON.stringify(JAHRE)};
window.FARBEN = ${JSON.stringify(FARBEN)};
window.INFO = [];
const gruppen = [];
JAHRE.forEach((j, i) => {
  const w = baueWagen(j, [FARBEN[i % FARBEN.length], '#f0f0f0']);
  gruppen.push(w);
  window.INFO.push({ jahr: j, aera: w.userData.aera, tris: wagenDreiecke(w) });
});

window.zeigeEinen = function(i, theta, phi, zoom) {
  sc.children.filter(o=>o.userData && o.userData.jahr).forEach(o=>sc.remove(o));
  const w = gruppen[i];
  w.position.set(0,0,0);
  sc.add(w);
  const r = 6.5 * (zoom||1);
  cam.position.set(r*Math.sin(phi)*Math.sin(theta), r*Math.cos(phi)+0.4, r*Math.sin(phi)*Math.cos(theta));
  cam.lookAt(0, 0.45, 0);
  rd.render(sc, cam);
};
window.zeigeReihe = function(von, bis, theta, phi) {
  sc.children.filter(o=>o.userData && o.userData.jahr).forEach(o=>sc.remove(o));
  const n = bis - von;
  let x = -(n-1)*3.6/2;
  for (let i=von;i<bis;i++){ const w=gruppen[i]; w.position.set(x,0,0); sc.add(w); x+=3.6; }
  const r = 3.6*n*0.85;
  cam.position.set(r*Math.sin(phi)*Math.sin(theta), r*Math.cos(phi)+1.2, r*Math.sin(phi)*Math.cos(theta));
  cam.lookAt(0, 0.5, 0);
  rd.render(sc, cam);
};
window.zeigeReihe(0, JAHRE.length, 0.35, 1.15);
<\/script></body></html>`;

    const tmp = OUT + 'wagen-view.html';
    fs.writeFileSync(tmp, html, 'utf8');

    const b = await chromium.launch();
    const p = await b.newPage({ viewport: { width: 1400, height: 780 } });
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file:///' + tmp.replace(/\\/g, '/'), { waitUntil: 'load' });
    await p.waitForTimeout(1500);

    const info = await p.evaluate(() => window.INFO);
    console.log('Jahr   Ära                        Dreiecke');
    console.log('-'.repeat(48));
    let summe = 0;
    info.forEach(x => {
        summe += x.tris;
        console.log(String(x.jahr).padEnd(7) + x.aera.padEnd(28) + String(x.tris).padStart(6));
    });
    console.log('-'.repeat(48));
    console.log('Schnitt je Wagen: ' + Math.round(summe / info.length) + ' Dreiecke');
    console.log('26 Wagen im Feld: ~' + Math.round(summe / info.length * 26 / 1000) + 'k Dreiecke');

    // Gesamtreihe
    await p.screenshot({ path: OUT + 'wagen-reihe.png' });
    // Erste Hälfte / zweite Hälfte größer
    await p.evaluate(() => window.zeigeReihe(0, 6, 0.35, 1.12));
    await p.waitForTimeout(200); await p.screenshot({ path: OUT + 'wagen-1950-1979.png' });
    await p.evaluate(() => window.zeigeReihe(6, 11, 0.35, 1.12));
    await p.waitForTimeout(200); await p.screenshot({ path: OUT + 'wagen-1985-2022.png' });
    // Der kritische Vergleich: 1967 gegen 1968
    await p.evaluate(() => window.zeigeReihe(2, 4, 0.6, 1.15));
    await p.waitForTimeout(200); await p.screenshot({ path: OUT + 'wagen-1967-1968.png' });

    console.log('\nSkriptfehler: ' + (errs.length ? errs.join(' | ') : 'keine'));
    await b.close();
})();
