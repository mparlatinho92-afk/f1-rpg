// Bevölkerungsechte effektive Poolgröße (Simpson 1/sum(p^2)) je Land, streamend.
// Nur Sum/SumSq/N nötig -> O(1) Speicher pro Land.
const fs=require('fs'), readline=require('readline');
const [,,inFile,outFile,genderFilter='M']=process.argv;
const THRESH=100;
const acc=new Map(); // iso -> {n,sum,sumsq,distinct}
const rl=readline.createInterface({input:fs.createReadStream(inFile),crlfDelay:Infinity});
let first=true;
rl.on('line',l=>{
  if(first){first=false; if(/country/i.test(l)) return;}
  const p=l.split(',');
  if(p.length<4) return;
  const g=p[1].trim().toUpperCase(), c=p[2].trim().toUpperCase(), n=parseInt(p[3],10);
  if(!c||!n) return;
  if(genderFilter!=='ALL' && g!==genderFilter) return;
  let a=acc.get(c); if(!a){a={n:0,sum:0,sumsq:0,distinct:0};acc.set(c,a);}
  a.distinct++;
  if(n>=THRESH){ a.n++; a.sum+=n; a.sumsq+=n*n; }
});
rl.on('close',()=>{
  const out={};
  for(const [c,a] of acc){
    if(!a.n) continue;
    // eff = sum^2 / sumsq  (== 1/sum(p^2))
    out[c]={n100:a.n, distinct:a.distinct, eff:a.sumsq>0? (a.sum*a.sum)/a.sumsq : 0, carriers:a.sum};
  }
  fs.writeFileSync(outFile, JSON.stringify(out,null,1));
  console.log('Länder:',Object.keys(out).length,'->',outFile);
});
