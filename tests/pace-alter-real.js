/**
 * pace-alter-real.js — Pace-Δ desselben Fahrers zum Folgejahr nach Alter und Karrierejahr, je Ära (26.11.2026)
 * Quelle PACE_RATINGS (data/f1db.js) + Geburtsjahr F1DB. ⚠ nur wer im Folgejahr noch Elo hat (Auslese).
 * Aufruf (aus dem Projektordner): node tests/pace-alter-real.js
 */
const fs=require('fs'),path=require('path');const ROOT=process.cwd();
const q=fs.readFileSync(path.join(ROOT,'data','f1db.js'),'utf8');const s=q.indexOf('PACE_RATINGS=');const off=q.indexOf('{',s);let t=0,e=-1;
for(let i=off;i<q.length;i++){const c=q[i];if(c==='{')t++;else if(c==='}'){t--;if(!t){e=i+1;break;}}}
const PR=JSON.parse(q.slice(off,e));
const geb={};for(const d of JSON.parse(fs.readFileSync('f1db-json-splitted/f1db-drivers.json','utf8')))if(d.dateOfBirth)geb[d.id]=+d.dateOfBirth.slice(0,4);
const ERA=[[1950,1979],[1980,2009],[2010,2025]];const ALT=[[18,22],[23,25],[26,28],[29,31],[32,34],[35,37],[38,45]];
const KJ=[[1,1],[2,3],[4,5],[6,8],[9,12],[13,30]];
const rows=[];
for(const[id,j]of Object.entries(PR)){const ys=Object.keys(j).map(Number).sort((a,b)=>a-b);ys.forEach((y,i)=>{if(!(j[y+1]&&j[y][0]>0&&j[y+1][0]>0))return;rows.push({y,kj:i+1,alt:geb[id]?y-geb[id]:null,d:j[y+1][0]-j[y][0],dp:j[y+1][1]-j[y][1]});});}
function tab(name,f,st){console.log('\n'+name+'  (Ø Δpace t→t+1 ± SE, n) — nur Fahrer, die im Folgejahr noch Elo haben');
for(const[a,b]of st){let z=`  ${String(a+'-'+b).padStart(6)}`;for(const[ea,eb]of ERA){const r=rows.filter(x=>x.y>=ea&&x.y<=eb&&x[f]!=null&&x[f]>=a&&x[f]<=b);const m=r.reduce((s,x)=>s+x.d,0)/r.length;const se=Math.sqrt(r.reduce((s,x)=>s+(x.d-m)**2,0)/(r.length-1)/r.length);z+=` | ${ea}-${eb}: ${(m>=0?'+':'')+m.toFixed(2)} ±${se.toFixed(2)} (${r.length})`;}console.log(z);}}
tab('ALTER','alt',ALT);tab('KARRIEREJAHR','kj',KJ);
for(const h of['max-verstappen','oscar-piastri','andrea-kimi-antonelli','lewis-hamilton','fernando-alonso'])if(PR[h])console.log(h,Object.entries(PR[h]).slice(-6).map(([y,v])=>y+':'+v[0]+'/'+v[1]).join(' '));
console.log('max Jahr',Math.max(...Object.values(PR).flatMap(j=>Object.keys(j).map(Number))));
