// Top-K Counts je Land (nur Spiel-Länder) -> für eff(K)-Kurven
const fs=require('fs'), readline=require('readline');
const [,,inFile,outFile,genderFilter='M',K='6000']=process.argv;
const TOPK=+K;
const WANTED=new Set(['GB','DE','IT','FR','US','BR','JP','AR','ES','NL','BE','CH','AT','SE','FI','DK','CA','MX','ZA','IE','PT','UY','CO','RU','PL','CZ','HU','IN','IL','MY','ID','EE','NO','TR','GR','KR','MA','CL','PE','EG','SA','AE','QA','CN','AU','NZ','TH','MC','VE','ZW']);
const by=new Map();
const rl=readline.createInterface({input:fs.createReadStream(inFile),crlfDelay:Infinity});
let first=true;
rl.on('line',l=>{
  if(first){first=false; if(/country/i.test(l)) return;}
  const p=l.split(',');
  if(p.length<4) return;
  const g=p[1].trim().toUpperCase(), c=p[2].trim().toUpperCase(), n=parseInt(p[3],10);
  if(!WANTED.has(c)||!n) return;
  if(genderFilter!=='ALL' && g!==genderFilter) return;
  let a=by.get(c); if(!a){a=[];by.set(c,a);}
  a.push(n);
});
rl.on('close',()=>{
  const out={};
  for(const [c,arr] of by){ arr.sort((x,y)=>y-x); out[c]=arr.slice(0,TOPK); }
  fs.writeFileSync(outFile, JSON.stringify(out));
  console.log('ok',Object.keys(out).length,'->',outFile);
});
