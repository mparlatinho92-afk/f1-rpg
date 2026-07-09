// elo-decade-peaks.js – Top 20 Elo-Peaks pro Jahrzehnt
// Quellen:
//   elo_ratings.json      – European/F1 raw Elo 1930–1949
//   pace_ratings.json     – Normalisierter Pace 1950–2024
//   champcar-YYYY.json    – AAA/USAC separater Elo-Pool 1930–1960
// Output: elo_decade_peaks.md

const fs   = require('fs');
const path = require('path');

// ── Laden ──────────────────────────────────────────────────────────────────

const eloRatings  = JSON.parse(fs.readFileSync(path.join(__dirname, 'elo_ratings.json'), 'utf8'));
const paceRatings = JSON.parse(fs.readFileSync(path.join(__dirname, 'pace_ratings.json'), 'utf8'));
const PRE50_DIR   = path.join(__dirname, 'pre1950-data');

function slugToName(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── Normalisierung raw Elo → 55–98 (gleiche Skala wie pace_ratings) ────────
// Kalibriert auf historischen Maximalwert Hamilton/Verstappen ~2067
const ELO_BASE = 1500;
const ELO_MAX  = 2067;
const NORM_LO  = 55;
const NORM_HI  = 98;

function eloToScore(elo) {
  const raw = NORM_LO + (elo - ELO_BASE) / (ELO_MAX - ELO_BASE) * (NORM_HI - NORM_LO);
  return Math.max(NORM_LO, Math.min(NORM_HI, raw));
}

// ── Jahrzehnte ─────────────────────────────────────────────────────────────

const decades = [];
for (let d = 1930; d <= 2020; d += 10) decades.push(d);

// ═══════════════════════════════════════════════════════════════════════════
// TEIL 1 – Europäisch / F1 (1930–1949: elo_ratings, 1950+: pace_ratings)
// ═══════════════════════════════════════════════════════════════════════════

function buildEuropeanPeaks(decade) {
  const peaks = [];

  if (decade < 1950) {
    // Verwende elo_ratings.json, Schwelle: driver_elo > 1550 (echte Rennaktivität)
    for (const [id, years] of Object.entries(eloRatings)) {
      let maxScore = -Infinity;
      let peakYear = null;

      for (let y = decade; y < decade + 10; y++) {
        const e = years[String(y)];
        if (!e || e.driver_elo <= 1550) continue;
        const score = eloToScore(e.driver_elo);
        if (score > maxScore) { maxScore = score; peakYear = y; }
      }

      if (peakYear !== null) {
        peaks.push({ id, name: slugToName(id), pace: maxScore, year: peakYear });
      }
    }
  } else {
    // Verwende pace_ratings.json (race_count >= 3)
    for (const [id, years] of Object.entries(paceRatings)) {
      let maxScore = -Infinity;
      let peakYear = null;

      for (let y = decade; y < decade + 10; y++) {
        const e = years[String(y)];
        if (!e || (e.race_count ?? 0) < 3) continue;
        if (e.pace > maxScore) { maxScore = e.pace; peakYear = y; }
      }

      if (peakYear !== null) {
        peaks.push({ id, name: slugToName(id), pace: maxScore, year: peakYear });
      }
    }
  }

  peaks.sort((a, b) => b.pace - a.pace);
  return peaks.slice(0, 20);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEIL 2 – AAA / USAC (champcar-YYYY.json, separater Elo-Pool)
// ═══════════════════════════════════════════════════════════════════════════

function runChampcarElo() {
  const K = 24;
  const elo = {};           // driverSlug → current elo
  const peakPerYear = {};   // driverSlug → { year → elo }
  const racedInYear = {};   // driverSlug → Set of years actually started

  function getElo(id) {
    if (!elo[id]) elo[id] = 1500;
    return elo[id];
  }
  function updateElo(id, newVal) {
    elo[id] = newVal;
  }
  function expected(a, b) {
    return 1 / (1 + Math.pow(10, (b - a) / 400));
  }

  // Alle Jahrgänge laden (1930–1960 champcar-Dateien)
  const years = [];
  for (let y = 1930; y <= 1960; y++) {
    const file = path.join(PRE50_DIR, `champcar-${y}.json`);
    if (fs.existsSync(file)) {
      const d = JSON.parse(fs.readFileSync(file, 'utf8'));
      years.push({ year: y, races: d.races || [] });
    }
  }

  for (const { year, races } of years) {
    const startedThisYear = new Set();

    for (const race of races) {
      // Nur Non-DNQ, Non-DNF wo sinnvoll
      const finishers = (race.entries || [])
        .filter(e => !e.dnq && e.pos != null && e.pos > 0)
        .sort((a, b) => a.pos - b.pos);

      if (finishers.length < 2) continue;

      finishers.forEach(e => { if (e.driverSlug) startedThisYear.add(e.driverSlug); });

      // Paarweise Head-to-Head
      for (let i = 0; i < finishers.length; i++) {
        for (let j = i + 1; j < finishers.length; j++) {
          const slugA = finishers[i].driverSlug;
          const slugB = finishers[j].driverSlug;
          if (!slugA || !slugB) continue;

          const eA = getElo(slugA);
          const eB = getElo(slugB);
          const expA = expected(eA, eB);
          updateElo(slugA, eA + K * (1 - expA));
          updateElo(slugB, eB + K * (0 - (1 - expA)));
        }
      }
    }

    // Snapshot: nur Fahrer die dieses Jahr wirklich gestartet sind
    for (const id of startedThisYear) {
      if (!peakPerYear[id]) peakPerYear[id] = {};
      peakPerYear[id][year] = elo[id];
      if (!racedInYear[id]) racedInYear[id] = new Set();
      racedInYear[id].add(year);
    }
  }

  return { peakPerYear, racedInYear };
}

const { peakPerYear: champcarPeaks, racedInYear: champcarRaced } = runChampcarElo();

// Normalisierung innerhalb des champcar-Pools (eigene Min/Max)
// yearRange: z.B. [1950, 1960] für die 1950er-inkl.-1960-Dekade
function buildChampcarPeaks(decade, extraYear) {
  const peaks = [];
  const endYear = decade + 9 + (extraYear ? 1 : 0); // ggf. ein Extrajar anhängen

  for (const [id, yearData] of Object.entries(champcarPeaks)) {
    let maxElo = -Infinity;
    let peakYear = null;

    for (let y = decade; y <= endYear; y++) {
      const val = yearData[y];
      if (val === undefined) continue;
      // Sicherstellen dass Fahrer dieses Jahr wirklich gestartet ist
      if (!champcarRaced[id] || !champcarRaced[id].has(y)) continue;
      if (val > maxElo) { maxElo = val; peakYear = y; }
    }

    if (peakYear !== null) {
      peaks.push({ id, name: slugToName(id), eloRaw: maxElo, year: peakYear });
    }
  }

  if (peaks.length === 0) return [];

  // Min-Max innerhalb champcar-Dekade → 55–98
  const vals = peaks.map(p => p.eloRaw);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const range = hi - lo || 1;

  peaks.forEach(p => {
    p.pace = 55 + (p.eloRaw - lo) / range * (NORM_HI - 55);
  });

  peaks.sort((a, b) => b.pace - a.pace);
  return peaks.slice(0, 20);
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTPUT
// ═══════════════════════════════════════════════════════════════════════════

const lines = [
  '# Fahrer-Elo-Peaks – Top 20 pro Jahrzehnt',
  '',
  '> **Europäisch / F1:** Elo-normalisierter Pace (0–100), fahrerintrinsisch.',
  '> 1930–1949: `elo_ratings.json` (mind. Elo > 1550), 1950+: `pace_ratings.json` (mind. 3 Rennen).',
  '> **AAA/USAC:** Separater Elo-Pool aus `champcar-YYYY.json`, min-max-normalisiert innerhalb der Dekade.',
  '',
  '---',
  '',
];

// Section 1: Europäisch / F1
lines.push('## Europäisch / Formel 1');
lines.push('');

for (const decade of decades) {
  const list = buildEuropeanPeaks(decade);
  if (!list || list.length === 0) continue;

  lines.push(`### ${decade}er`);
  lines.push('');
  lines.push('| # | Fahrer | Score | Peak-Jahr |');
  lines.push('|---|--------|-------|-----------|');

  list.forEach((d, i) => {
    lines.push(`| ${String(i + 1).padStart(2)} | ${d.name} | ${d.pace.toFixed(1)} | ${d.year} |`);
  });

  lines.push('');
}

// Section 2: AAA/USAC
lines.push('---');
lines.push('');
lines.push('## AAA / USAC (Champ Car)');
lines.push('');
lines.push('> Separater Elo-Pool, nur champcar-Rennen 1930–1960. Score min-max-normalisiert pro Dekade.');
lines.push('');

// 1950er-Dekade bekommt auch 1960 (letzte Datenjahr = Übergang)
const champDecadeConfig = [
  { decade: 1930, extra: false, label: '1930er' },
  { decade: 1940, extra: false, label: '1940er' },
  { decade: 1950, extra: true,  label: '1950er (inkl. 1960)' },
];
for (const { decade, extra, label } of champDecadeConfig) {
  const list = buildChampcarPeaks(decade, extra);
  if (!list || list.length === 0) continue;

  lines.push(`### ${label}`);
  lines.push('');
  lines.push('| # | Fahrer | Score | Peak-Jahr |');
  lines.push('|---|--------|-------|-----------|');

  list.forEach((d, i) => {
    lines.push(`| ${String(i + 1).padStart(2)} | ${d.name} | ${d.pace.toFixed(1)} | ${d.year} |`);
  });

  lines.push('');
}
lines.push('> *Champcar-Daten enden bei 1960 – 1960er+ nicht abgedeckt.*');
lines.push('');

const outPath = path.join(__dirname, '..', 'elo_decade_peaks.md');
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Fertig: ${outPath}`);
