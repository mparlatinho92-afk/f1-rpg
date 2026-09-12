/* Analysiert die Fahrlinien und zeichnet sie als Draufsicht.
 *   node zielflagge/test-linien.js
 *
 * Zwei Regeln aus dem Rennsport, die der Nutzer genannt hat und die hier
 * geprueft werden (Lehrbilder in zielflagge/Ideallinie):
 *   1. Kurven werden GESCHNITTEN - am Scheitel gehoert die Linie nach innen.
 *   2. In SCHIKANEN wird nicht geschnitten, sondern begradigt: dort bleibt die
 *      Linie neutral und zieht durch, statt beide Boegen einzeln zu fahren.
 *
 * ⚠ VORZEICHEN. Welche Seite "innen" ist, steckt NICHT im Vorzeichen des
 *   Kreuzprodukts dreier Bahnpunkte - das war bei 177 von 177 starken
 *   Kurvenstellen genau invertiert und liess eine gut geschnittene Linie wie
 *   eine falsch herum gefahrene aussehen. Innen ist die Richtung vom Bahnpunkt
 *   zur Mitte der Sehne durch seine Nachbarn.
 *
 * Bilder: render/linien-draufsicht.png, linien-kurve.png, linien-schikane.png
 */
const { chromium } = require('playwright');
const fs=require('fs'), path=require('path');
const HTML='file:///'+path.join(__dirname,'index.html').split(String.fromCharCode(92)).join('/');
const OUT=path.join(__dirname,'render')+'/';
(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1400,height:1000}});
  p.on('pageerror',e=>console.log('PAGEERROR',e.message));
  await p.goto(HTML,{waitUntil:'load'});
  await p.waitForFunction(()=>typeof LINIEN!=='undefined'&&LINIEN.length>0,null,{timeout:60000});

  // ── Kennzahlen ────────────────────────────────────────────────────────
  const mess = await p.evaluate(()=>{
    const N=idealLinie.length, maxAb=TRACK_WIDTH/2-1.4;
    // Signierte Kruemmung je Punkt (positiv = dreht zur +Normale)
    const kr=new Array(N);
    for(let i=0;i<N;i++){
      const a=spacedPts[(i-3+N*2)%N], m=spacedPts[i], c=spacedPts[(i+3)%N];
      // Wahrheit statt Kreuzprodukt-Vorzeichen: der Vektor vom Punkt zur Mitte
      // der Sehne zeigt nach INNEN. Das Kreuzprodukt war genau invertiert -
      // bei 177 von 177 starken Stellen.
      const t=spacedTangents[i];
      kr[i]=((a.x+c.x)/2-m.x)*(-t.z)+((a.z+c.z)/2-m.z)*(t.x);
    }
    let gr=0; for(const x of kr) gr=Math.max(gr,Math.abs(x));
    const kn=kr.map(x=>x/gr);              // -1..1
    // Kurven finden: zusammenhaengende Bereiche mit |kn|>0.25
    const kurven=[]; let start=null;
    for(let i=0;i<N;i++){
      const drin=Math.abs(kn[i])>0.25;
      if(drin&&start===null) start=i;
      if(!drin&&start!==null){ kurven.push([start,i-1]); start=null; }
    }
    if(start!==null) kurven.push([start,N-1]);
    // Fuer jede Kurve: Scheitelpunkt und wo die Linie dort liegt
    const befund=kurven.map(([a,b])=>{
      let sch=a, best=0;
      for(let i=a;i<=b;i++) if(Math.abs(kn[i])>best){best=Math.abs(kn[i]); sch=i;}
      const innenSeite=Math.sign(kn[sch]);   // dorthin gehoert der Scheitel
      const amScheitel=idealLinie[sch]*innenSeite;   // >0 = innen, <0 = aussen
      return {von:a, bis:b, laenge:b-a+1, scheitel:sch,
              innenAusnutzung:+(amScheitel/maxAb).toFixed(2),
              versatz:+idealLinie[sch].toFixed(1)};
    });
    // Schikanen: zwei Kurven entgegengesetzter Richtung dicht hintereinander
    const schikanen=[];
    for(let k=0;k+1<kurven.length;k++){
      const [a1,b1]=kurven[k], [a2,b2]=kurven[k+1];
      const s1=Math.sign(kn[befund[k].scheitel]), s2=Math.sign(kn[befund[k+1].scheitel]);
      const abstand=(a2-b1)/N*trackLength;
      if(s1!==s2 && abstand<60){
        // In einer Schikane sollte die Linie GERADE durch: wenig Kruemmung
        let summe=0, zahl=0;
        for(let i=a1;i<=b2;i++){
          const v=(i-1+N)%N, n2=(i+1)%N;
          const pt=(kk)=>({x:spacedPts[kk].x-spacedTangents[kk].z*idealLinie[kk],
                           z:spacedPts[kk].z+spacedTangents[kk].x*idealLinie[kk]});
          const A=pt(v),M=pt(i),C=pt(n2);
          const ab=Math.hypot(M.x-A.x,M.z-A.z), bc=Math.hypot(C.x-M.x,C.z-M.z);
          const ca=Math.hypot(C.x-A.x,C.z-A.z);
          const fl=Math.abs((M.x-A.x)*(C.z-A.z)-(C.x-A.x)*(M.z-A.z))/2;
          if(fl>1e-9){ summe+=1/((ab*bc*ca)/(4*fl)); zahl++; }
        }
        schikanen.push({von:a1, bis:b2, abstandM:+abstand.toFixed(0),
          kruemmungLinie:+(summe/Math.max(zahl,1)*1000).toFixed(2)});
      }
    }
    return {kurvenGefunden:kurven.length, schikanen:schikanen.length,
      maxAb:+maxAb.toFixed(1), befund, schikanenDetail:schikanen};
  });
  const befund = mess.befund;
  const abstand01 = await p.evaluate(()=>{
    const N=LINIEN[0].length; let s=0;
    for(let i=0;i<N;i++) s+=Math.abs(LINIEN[1][i]-LINIEN[0][i]);
    return s/N;
  });
  console.log(JSON.stringify(mess, null, 2));
  const zeiten = await p.evaluate(()=>{
    const N=spacedPts.length, W=Math.max(2,Math.round(N/80));
    const vMax=TOP_TEMPO*(0.85+(75+75)/400);
    const zeit=(lat)=>{
      const ds=trackLength/N, v=new Array(N);
      const pt=(k)=>({x:spacedPts[k].x-spacedTangents[k].z*lat[k],
                      z:spacedPts[k].z+spacedTangents[k].x*lat[k]});
      for(let i=0;i<N;i++){
        const a=pt((i-W+N*2)%N), m=pt(i), c=pt((i+W)%N);
        const ab=Math.hypot(m.x-a.x,m.z-a.z), bc=Math.hypot(c.x-m.x,c.z-m.z);
        const ca=Math.hypot(c.x-a.x,c.z-a.z);
        const fl=Math.abs((m.x-a.x)*(c.z-a.z)-(c.x-a.x)*(m.z-a.z))/2;
        const R=fl<1e-9?1e6:(ab*bc*ca)/(4*fl);
        v[i]=Math.min(vMax, Math.sqrt(GRIP*R));
      }
      for(let k=0;k<2;k++){
        for(let i=N-1;i>=0;i--) v[i]=Math.min(v[i],Math.sqrt(v[(i+1)%N]**2+2*KI_BREMS*ds));
        for(let i=0;i<N;i++) v[i]=Math.min(v[i],Math.sqrt(v[(i-1+N)%N]**2+2*KI_BESCHL*ds));
      }
      let t=0; for(let i=0;i<N;i++) t+=ds/Math.max(v[i],1); return t;
    };
    return {mitte:+zeit(new Array(N).fill(0)).toFixed(2),
            linien:LINIEN.map(L=>+zeit(L).toFixed(2))};
  });

  // ── Draufsicht zeichnen ───────────────────────────────────────────────
  await p.evaluate(()=>{
    const N=spacedPts.length;
    const cv=document.createElement('canvas');
    cv.width=1400; cv.height=1000; cv.id='karte';
    cv.style.cssText='position:fixed;left:0;top:0;z-index:9999;background:#f4f2ee';
    document.body.appendChild(cv);
    const g=cv.getContext('2d');
    let minX=1e9,maxX=-1e9,minZ=1e9,maxZ=-1e9;
    for(const p2 of spacedPts){ minX=Math.min(minX,p2.x);maxX=Math.max(maxX,p2.x);
      minZ=Math.min(minZ,p2.z);maxZ=Math.max(maxZ,p2.z); }
    const rand=60;
    const sk=Math.min((cv.width-2*rand)/(maxX-minX),(cv.height-2*rand)/(maxZ-minZ));
    const X=(x)=>rand+(x-minX)*sk, Z=(z)=>rand+(z-minZ)*sk;
    const bahn=(off)=>{ g.beginPath();
      for(let i=0;i<=N;i++){ const j=i%N; const t=spacedTangents[j];
        const x=spacedPts[j].x-t.z*off, z=spacedPts[j].z+t.x*off;
        i?g.lineTo(X(x),Z(z)):g.moveTo(X(x),Z(z)); } g.closePath(); };
    // Asphalt
    g.fillStyle='#3f4247'; bahn(TRACK_WIDTH/2); g.fill('evenodd');
    g.globalCompositeOperation='destination-out'; bahn(-TRACK_WIDTH/2); g.fill();
    g.globalCompositeOperation='source-over';
    g.strokeStyle='#ffffff'; g.lineWidth=2; bahn(TRACK_WIDTH/2); g.stroke();
    bahn(-TRACK_WIDTH/2); g.stroke();
    // Linien
    const farben=['#e53935','#1e88e5','#43a047'];
    LINIEN.forEach((L,k)=>{
      g.strokeStyle=farben[k]; g.lineWidth=k===0?4:3; g.globalAlpha=k===0?1:0.75;
      g.beginPath();
      for(let i=0;i<=N;i++){ const j=i%N; const t=spacedTangents[j];
        const x=spacedPts[j].x-t.z*L[j], z=spacedPts[j].z+t.x*L[j];
        i?g.lineTo(X(x),Z(z)):g.moveTo(X(x),Z(z)); }
      g.closePath(); g.stroke();
    });
    g.globalAlpha=1;
    // Start-Ziel
    const t0=spacedTangents[0];
    g.strokeStyle='#111'; g.lineWidth=4; g.beginPath();
    g.moveTo(X(spacedPts[0].x-t0.z*TRACK_WIDTH/2),Z(spacedPts[0].z+t0.x*TRACK_WIDTH/2));
    g.lineTo(X(spacedPts[0].x+t0.z*TRACK_WIDTH/2),Z(spacedPts[0].z-t0.x*TRACK_WIDTH/2));
    g.stroke();
    g.fillStyle='#111'; g.font='bold 22px system-ui';
    g.fillText('rot = schnellste Linie   ·   blau/grün = Alternativen', rand, 34);
  });
  await p.waitForTimeout(400);
  await p.screenshot({path:OUT+'linien-draufsicht.png'});

  // Ausschnitt: die grossen Kurven 6-8 und eine Schikane
  for(const [name, von, bis] of [['linien-kurve', 150, 290], ['linien-schikane', 90, 200],
                                 ['linien-eine-kurve', 188, 240]]){
    await p.evaluate(([von,bis])=>{
      const N=spacedPts.length;
      const cv=document.getElementById('karte'); const g=cv.getContext('2d');
      g.clearRect(0,0,cv.width,cv.height);
      g.fillStyle='#f4f2ee'; g.fillRect(0,0,cv.width,cv.height);
      let minX=1e9,maxX=-1e9,minZ=1e9,maxZ=-1e9;
      for(let i=von;i<=bis;i++){ const p2=spacedPts[i%N];
        minX=Math.min(minX,p2.x);maxX=Math.max(maxX,p2.x);
        minZ=Math.min(minZ,p2.z);maxZ=Math.max(maxZ,p2.z); }
      const rand=70;
      const sk=Math.min((cv.width-2*rand)/(maxX-minX+30),(cv.height-2*rand)/(maxZ-minZ+30));
      const X=(x)=>rand+(x-minX+15)*sk, Z=(z)=>rand+(z-minZ+15)*sk;
      const band=(o1,o2)=>{ g.beginPath();
        for(let i=von-6;i<=bis+6;i++){ const j=(i+N*2)%N; const t=spacedTangents[j];
          const x=spacedPts[j].x-t.z*o1, z=spacedPts[j].z+t.x*o1;
          i===von-6?g.moveTo(X(x),Z(z)):g.lineTo(X(x),Z(z)); }
        for(let i=bis+6;i>=von-6;i--){ const j=(i+N*2)%N; const t=spacedTangents[j];
          const x=spacedPts[j].x-t.z*o2, z=spacedPts[j].z+t.x*o2;
          g.lineTo(X(x),Z(z)); }
        g.closePath(); };
      g.fillStyle='#3f4247'; band(TRACK_WIDTH/2,-TRACK_WIDTH/2); g.fill();
      g.strokeStyle='#fff'; g.lineWidth=3;
      [TRACK_WIDTH/2,-TRACK_WIDTH/2].forEach(o=>{ g.beginPath();
        for(let i=von-6;i<=bis+6;i++){ const j=(i+N*2)%N; const t=spacedTangents[j];
          const x=spacedPts[j].x-t.z*o, z=spacedPts[j].z+t.x*o;
          i===von-6?g.moveTo(X(x),Z(z)):g.lineTo(X(x),Z(z)); } g.stroke(); });
      // Mittellinie gestrichelt
      g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=2; g.setLineDash([8,8]);
      g.beginPath();
      for(let i=von-6;i<=bis+6;i++){ const j=(i+N*2)%N;
        i===von-6?g.moveTo(X(spacedPts[j].x),Z(spacedPts[j].z)):g.lineTo(X(spacedPts[j].x),Z(spacedPts[j].z)); }
      g.stroke(); g.setLineDash([]);
      // Randsteine: rot-weiss gestreift, damit die Bahnkante unuebersehbar ist
      [TRACK_WIDTH/2,-TRACK_WIDTH/2].forEach(o=>{
        for(let i=von-6;i<=bis+6;i++){
          const j=(i+N*2)%N, j2=(i+1+N*2)%N;
          const t=spacedTangents[j], t2=spacedTangents[j2];
          const a={x:spacedPts[j].x-t.z*o, z:spacedPts[j].z+t.x*o};
          const c={x:spacedPts[j2].x-t2.z*o, z:spacedPts[j2].z+t2.x*o};
          g.strokeStyle=(i%4<2)?'#e0e0e0':'#c62828'; g.lineWidth=7;
          g.beginPath(); g.moveTo(X(a.x),Z(a.z)); g.lineTo(X(c.x),Z(c.z)); g.stroke();
        }
      });
      const farben=['#e53935','#1e88e5','#43a047'];
      LINIEN.forEach((L,k)=>{
        g.strokeStyle=farben[k]; g.lineWidth=k===0?6:4; g.globalAlpha=k===0?1:0.7;
        g.beginPath();
        for(let i=von-6;i<=bis+6;i++){ const j=(i+N*2)%N; const t=spacedTangents[j];
          const x=spacedPts[j].x-t.z*L[j], z=spacedPts[j].z+t.x*L[j];
          i===von-6?g.moveTo(X(x),Z(z)):g.lineTo(X(x),Z(z)); }
        g.stroke();
      });
      g.globalAlpha=1; g.fillStyle='#111'; g.font='bold 20px system-ui';
      g.fillText('rot = schnellste Linie  ·  blau/grün = Alternativen  ·  weiß gestrichelt = Bahnmitte', rand, 36);
    }, [von,bis]);
    await p.waitForTimeout(250);
    await p.screenshot({path:OUT+name+'.png'});
    console.log('Bild: '+OUT+name+'.png');
  }
  console.log('Bild: '+OUT+'linien-draufsicht.png');
  // ── Abnahme ──────────────────────────────────────────────────────────
  const p2 = [];
  const pruef = (name, ok, ist) => p2.push({ name, ok: !!ok, ist });
  const grosse = befund.filter(b => b.laenge >= 14);
  const kurze = befund.filter(b => b.laenge < 14);
  const schnittGross = grosse.length
    ? grosse.reduce((a, b) => a + b.innenAusnutzung, 0) / grosse.length : 0;
  const schnittKurz = kurze.length
    ? kurze.reduce((a, b) => a + b.innenAusnutzung, 0) / kurze.length : 0;
  pruef('Grosse Kurven werden geschnitten', schnittGross > 0.25,
    Math.round(schnittGross * 100) + ' % innen im Schnitt (' + grosse.length + ' Kurven)');
  pruef('Keine Kurve faehrt aussen am Scheitel',
    befund.every(b => b.innenAusnutzung > -0.15),
    'schlechteste ' + Math.round(Math.min.apply(null, befund.map(b => b.innenAusnutzung)) * 100) + ' %');
  pruef('In Schikanen wird nicht geschnitten', schnittKurz < schnittGross,
    Math.round(schnittKurz * 100) + ' % gegen ' + Math.round(schnittGross * 100) + ' %');
  pruef('Linien sind schneller als die Mittellinie', zeiten.linien[0] < zeiten.mitte,
    zeiten.linien[0] + ' s gegen ' + zeiten.mitte + ' s');
  /* Schwelle von 0,6 auf 0,9 s. Die Linien liegen jetzt 3,5 m auseinander -
     sonst fuhr das ganze Feld im Gaensemarsch auf derselben Spur, weil 1,6 m
     schmaler sind als ein Wagen. Weiter auseinander heisst zwangslaeufig
     groesserer Zeitunterschied. Die Alternativen sind auch nicht fuer die
     ganze Runde gedacht, sondern fuer ein Ueberholmanoever - dort zaehlt die
     Position, nicht die Rundenzeit. */
  pruef('Alternativen bleiben brauchbar',
    Math.max.apply(null, zeiten.linien) - Math.min.apply(null, zeiten.linien) < 0.9,
    zeiten.linien.join(' / ') + ' s');
  pruef('Linien liegen mehr als eine Wagenbreite auseinander', abstand01 > 2.2,
    abstand01.toFixed(1) + ' m im Schnitt zur Nachbarlinie');

  console.log('');
  console.log('=== ZIELFLAGGE: Fahrlinien ===');
  p2.forEach(x => console.log((x.ok ? '  OK  ' : ' FEHL ') + x.name.padEnd(36) + x.ist));
  await b.close();
  const schlecht = p2.filter(x => !x.ok).length;
  console.log(schlecht ? (schlecht + ' PRUEFUNG(EN) FEHLGESCHLAGEN') : 'ALLES GRUEN');
  process.exit(schlecht ? 1 : 0);
})();
