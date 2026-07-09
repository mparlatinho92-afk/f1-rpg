'use strict';
const fs = require('fs'), path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname,'circuit-climate.json'),'utf8'));

// circuit-id → IOC-3-letter code
const CIRCUIT_COUNTRY = {
    'albert-park':'AUS','bahrain':'BHR','baku':'AZE','barcelona':'ESP',
    'hungaroring':'HUN','imola':'ITA','interlagos':'BRA','istanbul':'TUR',
    'jeddah':'SAU','kyalami':'ZAF','las-vegas':'USA','losail':'QAT','lusail':'QAT',
    'marina-bay':'SGP','mexico-city':'MEX','miami':'USA','monaco':'MCO',
    'monza':'ITA','mugello':'ITA','nurburgring':'DEU','paul-ricard':'FRA',
    'portimao':'PRT','red-bull-ring':'AUT','sepang':'MYS','shanghai':'CHN',
    'silverstone':'GBR','sochi':'RUS','spa-francorchamps':'BEL','suzuka':'JPN',
    'yas-marina':'UAE','yeongam':'KOR','zandvoort':'NLD','zolder':'BEL',
    'ain-diab':'MAR','aintree':'GBR','anderstorp':'SWE','avus':'DEU',
    'brands-hatch':'GBR','bremgarten':'CHE','clermont-ferrand':'FRA',
    'detroit':'USA','dijon':'FRA','estoril':'PRT','hockenheimring':'DEU',
    'jacarepagua':'BRA','jerez':'ESP','long-beach':'USA','montjuic':'ESP',
    'pedralbes':'ESP','pescara':'ITA','porto':'PRT','reims':'FRA',
    'rouen':'FRA','valencia':'ESP','watkins-glen':'USA','zeltweg':'AUT',
    'austin':'USA','dallas':'USA','fair-park':'USA','indianapolis':'USA',
    'las-vegas-street':'USA','phoenix':'USA','riverside':'USA','sebring':'USA',
    'buenos-aires':'ARG','monsanto':'PRT',
    'aida':'JPN','buddh':'IND','fuji':'JPN',
};

const acc = {};
for (const [cid, ioc] of Object.entries(CIRCUIT_COUNTRY)) {
    if (!data[cid] || cid === '_fallback') continue;
    if (!acc[ioc]) acc[ioc] = { r: new Array(12).fill(0), t: new Array(12).fill(0), n: 0 };
    acc[ioc].n++;
    for (let m = 0; m < 12; m++) {
        acc[ioc].r[m] += data[cid].rainProb[m];
        acc[ioc].t[m] += data[cid].tempAvg[m];
    }
}

const result = {};
for (const [ioc, v] of Object.entries(acc)) {
    result[ioc] = {
        r: v.r.map(x => Math.round(x/v.n*100)/100),
        t: v.t.map(x => Math.round(x/v.n*10)/10),
    };
}
// Sort by IOC
const sorted = Object.fromEntries(Object.entries(result).sort());
console.log(JSON.stringify(sorted, null, 2));
fs.writeFileSync(path.join(__dirname,'country-climate.json'), JSON.stringify(sorted, null, 2));
console.error(`\n→ ${Object.keys(sorted).length} Länder → tests/country-climate.json`);
