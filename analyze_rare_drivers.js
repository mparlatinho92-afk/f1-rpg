const fs = require('fs');
const path = require('path');

// Lade JSON-Dateien
const drivers = JSON.parse(fs.readFileSync('./f1db-json-splitted/f1db-drivers.json', 'utf8'));
const races = JSON.parse(fs.readFileSync('./f1db-json-splitted/f1db-races.json', 'utf8'));
const raceResults = JSON.parse(fs.readFileSync('./f1db-json-splitted/f1db-races-race-results.json', 'utf8'));

// Definiere Heimstrecken pro Land
const HOME_CIRCUITS = {
  'ESP': ['pedralbes', 'montjuic', 'jarama', 'jerez', 'catalunya', 'valencia'],
  'POR': ['estoril', 'portimao', 'monsanto'],
  'AUT': ['zeltweg', 'spielberg'],
  'HUN': ['hungaroring'],
  'GRE': [], // kein Heimrennen
  'YUG': [], // kein Heimrennen
  'SRB': [], // kein Heimrennen
  'CRO': [], // kein Heimrennen
  'POL': [], // kein Heimrennen
  'FIN': [], // kein Heimrennen
  'DEN': [], // kein Heimrennen
  'IRL': [], // kein Heimrennen
  'ZAF': ['kyalami', 'eastlondon'] // aber wir suchen ANDERE
};

// Index: circuitId -> circuitId (vereinfacht)
const racesByCircuit = {};
races.forEach(race => {
  if (!racesByCircuit[race.circuitId]) {
    racesByCircuit[race.circuitId] = [];
  }
  racesByCircuit[race.circuitId].push(race);
});

// Index: driverId -> Set von circuitIds
const driverCircuits = {};
const driverRaceCount = {};

raceResults.forEach(result => {
  const driverId = result.driverId;
  const raceId = result.raceId;
  
  // Finde den Circuit für diesen Race
  const race = races.find(r => r.raceId === raceId);
  if (!race) return;
  
  const circuitId = race.circuitId;
  
  if (!driverCircuits[driverId]) {
    driverCircuits[driverId] = new Set();
    driverRaceCount[driverId] = 0;
  }
  
  driverCircuits[driverId].add(circuitId);
  driverRaceCount[driverId]++;
});

// Filtere Fahrer mit max. 5 Starts und gruppiere nach Nationalität
const results = {};

Object.keys(HOME_CIRCUITS).forEach(nationality => {
  results[nationality] = [];
  
  drivers.forEach(driver => {
    if (driver.nationalityCountryId !== nationality) return;
    
    const totalStarts = driverRaceCount[driver.driverId] || 0;
    if (totalStarts === 0 || totalStarts > 5) return; // max. 5 Starts
    
    const circuits = Array.from(driverCircuits[driver.driverId] || new Set());
    const homeCircuits = HOME_CIRCUITS[nationality];
    const atHomeOnly = homeCircuits.length === 0 ? 'N/A' : circuits.every(c => homeCircuits.includes(c));
    
    results[nationality].push({
      slug: driver.driverId,
      name: driver.name,
      nationality,
      circuits: circuits.sort(),
      starts: totalStarts,
      atHomeOnly: atHomeOnly,
      homeCircuits: homeCircuits
    });
  });
});

// Sortiere und gebe aus
Object.keys(results).forEach(nat => {
  const drivers = results[nat]
    .sort((a, b) => a.starts - b.starts || a.name.localeCompare(b.name));
  
  if (drivers.length === 0) {
    console.log(`\n${nat}: (keine Fahrer mit max. 5 Starts)\n`);
    return;
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${nat} - ${drivers.length} Fahrer mit max. 5 Starts`);
  console.log(`${'='.repeat(80)}\n`);
  
  drivers.forEach(d => {
    const homeNote = d.homeCircuits.length === 0 
      ? '(kein Heimrennen)' 
      : d.atHomeOnly 
        ? '✓ NUR bei Heimrennen!' 
        : `(auch auswärts)`;
    
    console.log(`${d.slug} | ${d.name} | ${d.starts} Starts`);
    console.log(`  Strecken: ${d.circuits.join(', ')}`);
    console.log(`  ${homeNote}\n`);
  });
});

console.log(`\n${'='.repeat(80)}`);
console.log(`ZUSAMMENFASSUNG`);
console.log(`${'='.repeat(80)}\n`);

let totalCount = 0;
let homeOnlyCount = 0;

Object.values(results).forEach(drivers => {
  drivers.forEach(d => {
    totalCount++;
    if (d.atHomeOnly === true) homeOnlyCount++;
  });
});

console.log(`Gesamt Fahrer mit max. 5 Starts: ${totalCount}`);
console.log(`Davon NUR bei Heimrennen: ${homeOnlyCount}`);

