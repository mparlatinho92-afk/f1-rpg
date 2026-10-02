// worldnames.xyz: Rang / Name / Trägerzahl je Seite extrahieren
const {execSync}=require('child_process');const fs=require('fs');
const [,,base,maxPages,out]=process.argv;const rows=[];const seen=new Set();
const num=s=>{const m=s.match(/^([\d.]+)\s*([kM]?)$/);if(!m)return null;return Math.round(parseFloat(m[1])*(m[2]==='k'?1e3:m[2]==='M'?1e6:1))};
for(let p=1;p<=+maxPages;p++){
  const url=p===1?base:base+'page/'+p+'/';
  let h;try{h=execSync(`curl -sL -A "Mozilla/5.0" "${url}"`,{maxBuffer:1e8}).toString()}catch(e){break}
  h=h.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'');
  const t=h.replace(/<[^>]+>/g,'\n').split('\n').map(x=>x.trim()).filter(Boolean);
  let n=0;
  for(let i=0;i+2<t.length;i++){const r=t[i].match(/^(\d+)\.$/);if(!r)continue;const c=num(t[i+2]);if(c==null)continue;
    const k=t[i+1];if(seen.has(k))continue;seen.add(k);rows.push([+r[1],k,c]);n++;}
  process.stderr.write(`p${p}:${n} `);if(!n)break;
  execSync('sleep 1');
}
fs.writeFileSync(out,rows.map(r=>r.join('\t')).join('\n'));console.error('\n'+rows.length+' Zeilen →',out);
