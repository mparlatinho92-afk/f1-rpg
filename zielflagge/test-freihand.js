/* Liest die vom Nutzer per Hand gezeichnete Linie aus dem Bild zurueck.
 *   node zielflagge/test-freihand.js
 *
 * Die Handzeichnung liegt auf MEINEM Bild (render/linien-eine-kurve.png,
 * 1400x1000) - also in derselben Projektion. Damit laesst sie sich
 * zurueckrechnen statt nachempfunden werden: fuer jeden Bahnpunkt wird entlang
 * der Normalen gesucht, wo die schwarze Spur liegt. Ergebnis ist ein Versatz in
 * METERN, direkt vergleichbar mit LINIEN[0].
 *
 * ⚠ Die Projektion muss EXAKT die des Ausschnitts sein (rand=70, +15 m Rand,
 *   von/bis = 188/240) - sonst misst man eine verschobene Linie.
 *
 * Bild: render/linien-freihand-vergleich.png
 */
const { chromium } = require('playwright');
const fs=require('fs'), path=require('path');
const HTML='file:///'+path.join(__dirname,'index.html').split(String.fromCharCode(92)).join('/');
const OUT=path.join(__dirname,'render')+'/';
const VON=188, BIS=240;
(async()=>{
  const bild='data:image/png;base64,'+fs.readFileSync(OUT+'linien-eine-kurve_freihand.png').toString('base64');
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1400,height:1000}});
  p.on('pageerror',e=>console.log('PAGEERROR',e.message));
  await p.goto(HTML,{waitUntil:'load'});
  await p.waitForFunction(()=>typeof LINIEN!=='undefined'&&LINIEN.length>0,null,{timeout:60000});

  const erg = await p.evaluate(async([bild,VON,BIS])=>{
    const N=spacedPts.length;
    // dieselbe Projektion wie im Ausschnitt
    let minX=1e9,maxX=-1e9,minZ=1e9,maxZ=-1e9;
    for(let i=VON;i<=BIS;i++){ const q=spacedPts[i%N];
      minX=Math.min(minX,q.x);maxX=Math.max(maxX,q.x);
      minZ=Math.min(minZ,q.z);maxZ=Math.max(maxZ,q.z); }
    const rand=70;
    const sk=Math.min((1400-2*rand)/(maxX-minX+30),(1000-2*rand)/(maxZ-minZ+30));
    const X=(x)=>rand+(x-minX+15)*sk, Z=(z)=>rand+(z-minZ+15)*sk;

    // Handzeichnung als Pixelfeld
    const img=await new Promise(r=>{ const im=new Image(); im.onload=()=>r(im); im.src=bild; });
    const cv=document.createElement('canvas'); cv.width=1400; cv.height=1000;
    const gg=cv.getContext('2d'); gg.drawImage(img,0,0);
    const px=gg.getImageData(0,0,1400,1000).data;
    // Schwarz heisst: dunkler als der Asphalt (63,66,71). Die Kopfzeile steht
    // in #111 - deshalb erst ab y=56 suchen.
    const schwarz=(sx,sy)=>{
      sx=Math.round(sx); sy=Math.round(sy);
      if(sx<0||sy<56||sx>=1400||sy>=1000) return false;
      const o=(sy*1400+sx)*4;
      return px[o]<45&&px[o+1]<45&&px[o+2]<45;
    };

    // entlang der Normalen suchen
    const roh=new Array(N).fill(null);
    for(let i=VON-6;i<=BIS+6;i++){
      const j=(i+N*2)%N, t=spacedTangents[j], q=spacedPts[j];
      const treffer=[];
      for(let o=-9;o<=9;o+=0.04){
        const x=q.x-t.z*o, z=q.z+t.x*o;
        if(schwarz(X(x),Z(z))) treffer.push(o);
      }
      if(treffer.length) roh[j]=treffer[Math.floor(treffer.length/2)];
    }
    const wert=(i)=>roh[(i+N*2)%N];
    const idx=[]; for(let i=VON-6;i<=BIS+6;i++) if(wert(i)!==null) idx.push(i);
    // Luecken (der Nutzer hat zweimal angesetzt) linear ueberbruecken
    for(let i=idx[0];i<=idx[idx.length-1];i++){
      const j=(i+N*2)%N;
      if(roh[j]!==null) continue;
      let a=i, c=i; while(wert(a)===null) a--; while(wert(c)===null) c++;
      roh[j]=wert(a)+(wert(c)-wert(a))*(i-a)/(c-a);
    }
    // Glaetten - Freihand zittert; Fenster +-4 Punkte (~13 m)
    const glatt=new Array(N).fill(null);
    for(let i=idx[0];i<=idx[idx.length-1];i++){
      let s=0,n=0;
      for(let d=-4;d<=4;d++){ const v=wert(i+d); if(v!==null){ s+=v; n++; } }
      glatt[(i+N*2)%N]=s/n;
    }
    // Vergleich mit meiner Linie
    const diff=[], meine=[], deine=[];
    for(let i=VON;i<=BIS;i++){ const j=(i+N*2)%N;
      if(glatt[j]===null) continue;
      meine.push(LINIEN[0][j]); deine.push(glatt[j]); diff.push(LINIEN[0][j]-glatt[j]); }
    const abs=diff.map(Math.abs);
    // Abschnittsweise: wo liegt wessen Linie weiter innen?
    const abschnitt=[];
    for(let a=VON;a<BIS;a+=13){
      const bb=Math.min(a+12,BIS); let sm=0,sd=0,n2=0;
      for(let i=a;i<=bb;i++){ const j=(i+N*2)%N; if(glatt[j]===null) continue;
        sm+=LINIEN[0][j]; sd+=glatt[j]; n2++; }
      abschnitt.push([a+'-'+bb, +(sd/n2).toFixed(2), +(sm/n2).toFixed(2)]);
    }
    return {glatt, abschnitt, von:VON, bis:BIS, halb:TRACK_WIDTH/2, n:diff.length,
      mittel:+(abs.reduce((a,c)=>a+c,0)/abs.length).toFixed(2),
      max:+Math.max(...abs).toFixed(2),
      deineSpanne:[+Math.min(...deine).toFixed(2),+Math.max(...deine).toFixed(2)],
      meineSpanne:[+Math.min(...meine).toFixed(2),+Math.max(...meine).toFixed(2)]};
  },[bild,VON,BIS]);

  console.log('Punkte verglichen   : '+erg.n);
  console.log('deine Linie, Versatz: '+erg.deineSpanne[0]+' .. '+erg.deineSpanne[1]+' m (Bahnrand '+(-erg.halb)+' .. '+erg.halb+')');
  console.log('meine Linie, Versatz: '+erg.meineSpanne[0]+' .. '+erg.meineSpanne[1]+' m');
  console.log('Abstand im Schnitt  : '+erg.mittel+' m');
  console.log('groesster Abstand   : '+erg.max+' m');
  console.log('');
  console.log('Abschnitt   deine    meine   (Meter vom Bahnmittelstrich, minus = innen)');
  for(const [a,d,m] of erg.abschnitt)
    console.log(('  '+a).padEnd(12)+String(d).padStart(6)+String(m).padStart(9));

  // Bild: dein geglaetteter Strich gegen meine Linie
  await p.evaluate(([glatt,VON,BIS])=>{
    const N=spacedPts.length;
    const cv=document.createElement('canvas'); cv.width=1400; cv.height=1000;
    cv.style.cssText='position:fixed;left:0;top:0;z-index:9999'; document.body.appendChild(cv);
    const g=cv.getContext('2d');
    g.fillStyle='#f4f2ee'; g.fillRect(0,0,1400,1000);
    let minX=1e9,maxX=-1e9,minZ=1e9,maxZ=-1e9;
    for(let i=VON;i<=BIS;i++){ const q=spacedPts[i%N];
      minX=Math.min(minX,q.x);maxX=Math.max(maxX,q.x);
      minZ=Math.min(minZ,q.z);maxZ=Math.max(maxZ,q.z); }
    const rand=70;
    const sk=Math.min((1400-2*rand)/(maxX-minX+30),(1000-2*rand)/(maxZ-minZ+30));
    const X=(x)=>rand+(x-minX+15)*sk, Z=(z)=>rand+(z-minZ+15)*sk;
    const band=(o1,o2)=>{ g.beginPath();
      for(let i=VON-6;i<=BIS+6;i++){ const j=(i+N*2)%N; const t=spacedTangents[j];
        g.lineTo(X(spacedPts[j].x-t.z*o1),Z(spacedPts[j].z+t.x*o1)); }
      for(let i=BIS+6;i>=VON-6;i--){ const j=(i+N*2)%N; const t=spacedTangents[j];
        g.lineTo(X(spacedPts[j].x-t.z*o2),Z(spacedPts[j].z+t.x*o2)); }
      g.closePath(); };
    g.fillStyle='#3f4247'; band(TRACK_WIDTH/2,-TRACK_WIDTH/2); g.fill();
    g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=2; g.setLineDash([8,8]); g.beginPath();
    for(let i=VON-6;i<=BIS+6;i++){ const j=(i+N*2)%N;
      g.lineTo(X(spacedPts[j].x),Z(spacedPts[j].z)); }
    g.stroke(); g.setLineDash([]);
    [TRACK_WIDTH/2,-TRACK_WIDTH/2].forEach(o=>{
      for(let i=VON-6;i<=BIS+6;i++){
        const j=(i+N*2)%N, j2=(i+1+N*2)%N;
        const t=spacedTangents[j], t2=spacedTangents[j2];
        g.strokeStyle=(i%4<2)?'#e0e0e0':'#c62828'; g.lineWidth=7; g.beginPath();
        g.moveTo(X(spacedPts[j].x-t.z*o),Z(spacedPts[j].z+t.x*o));
        g.lineTo(X(spacedPts[j2].x-t2.z*o),Z(spacedPts[j2].z+t2.x*o)); g.stroke(); }
    });
    const zeichne=(hol,farbe,breite)=>{
      g.strokeStyle=farbe; g.lineWidth=breite; g.beginPath(); let an=false;
      for(let i=VON-6;i<=BIS+6;i++){ const j=(i+N*2)%N; const v=hol(j);
        if(v===null||v===undefined){ an=false; continue; }
        const t=spacedTangents[j];
        const x=X(spacedPts[j].x-t.z*v), z=Z(spacedPts[j].z+t.x*v);
        an?g.lineTo(x,z):g.moveTo(x,z); an=true; }
      g.stroke();
    };
    zeichne(j=>glatt[j], '#111', 8);
    zeichne(j=>LINIEN[0][j], '#e53935', 5);
    g.fillStyle='#111'; g.font='bold 21px system-ui';
    g.fillText('schwarz = deine Handlinie, geglättet und zurückgerechnet', rand, 34);
    g.fillStyle='#c62828';
    g.fillText('rot = meine berechnete Ideallinie', rand, 62);
  },[erg.glatt,VON,BIS]);
  await p.waitForTimeout(300);
  await p.screenshot({path:OUT+'linien-freihand-vergleich.png'});
  await b.close();
})();
