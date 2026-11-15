// debuet-pruefung.js — jedes Debuet-Abzeichen eines Langlaufs mit Grund pruefen (Browser).
//
// ANLASS (Nutzer 15.11.2026): Kimi Antonelli trug 2030 „Debüt“, obwohl er seit 2025 fuhr. Regel:
// Debuet = erste Meldung zur Qualifikation oder Vorqualifikation (Start, DNQ, DNS, DNPQ; nie Freitagstraining).
//
// ABLAUF   initFromYear(START), N Saisons. Vor jedem Saisonende fuer jeden Fahrer (Kader + Pool):
//          - Abzeichen wie im Steckbrief-Titel: getF1DebutYear(d) ?? (laufendes Jahr && Team ? Jahr : null)
//          - Grund: welcher Zweig von getF1DebutYear griff (HIST / f1DebutYear / allTime / careerScores
//            / Rueckfall „hat ein Team“)
//          - Wahrheit: Quali-Meldung in dieser Saison und in keiner frueheren (Spiel, gefuehrt ueber
//            histId bzw. Namen, weil Fahrer-IDs nicht stabil sind) und real nicht vor dem Spielstart.
// AUSGABE  je Saison: Abzeichen, davon falsch (frueher schon gemeldet), fehlend (erste Meldung ohne
//          Abzeichen), Abzeichen ohne jede Meldung; Gruende gezaehlt; die ersten Fehlfaelle mit Daten.
// AUFRUF   node tests/debuet-pruefung.js [Start=1980] [Saisons=10]
const { chromium } = require('playwright'); const path = require('path'); const { pathToFileURL } = require('url');
const START = +(process.argv[2] || 1980), N = +(process.argv[3] || 10);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const err = [];
  p.on('pageerror', e => err.push(e.message));
  await p.goto(pathToFileURL(path.join(process.cwd(), 'index.html')).href, { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  const res = await p.evaluate(async ([START, N]) => {
    window.alert = () => {}; window.confirm = () => true;
    const key = d => d.histId || ('n:' + String(d.name || '').toLowerCase().trim());
    const gesehen = new Map();          // key -> erstes Jahr mit Quali-Meldung im Spiel
    const zeilen = [], fehl = [], gruende = {};
    const grund = d => {
      const echt = d.histId && typeof HIST_DRIVERS !== 'undefined' ? HIST_DRIVERS[d.histId]?.[6] : null;
      const start = parseInt(GAME_STATE.templateUsed) || null;
      if (echt && (!start || echt < start)) return 'HIST';
      // wie getF1DebutYear: fruehestes Jahr der Spielquellen, Name der Quelle mit dem Minimum
      const k = [];
      if (typeof d.f1DebutYear === 'number') k.push(['f1DebutYear', d.f1DebutYear]);
      const at = GAME_STATE.allTimeStATS?.drivers?.[d.histId || d.id];
      if (at && typeof at.firstSimYear === 'number') k.push(['allTime.firstSimYear', at.firstSimYear]);
      const dj = GAME_STATE.debutJahre?.[d.histId || d.id];
      if (typeof dj === 'number') k.push(['debutJahre', dj]);
      const cs = Array.isArray(d.careerScores) ? d.careerScores.filter(c => c && !c.preSim && typeof c.year === 'number') : [];
      if (cs.length) k.push(['careerScores', Math.min(...cs.map(c => c.year))]);
      if (!k.length) return 'Rueckfall-Team';
      k.sort((a, b) => a[1] - b[1]);
      return k[0][0];
    };
    initFromYear(START);
    for (let s = 0; s < N; s++) {
      simulateSeasonRaces();
      const y = GAME_STATE.currentYear;
      const alle = [...GAME_STATE.drivers, ...(GAME_STATE.reservePool || [])];
      const byId = new Map(alle.map(d => [d.id, d]));
      // Quali-Meldungen dieser Saison: Starter, DNQ, DNS, DNPQ
      const gemeldet = new Set();
      (GAME_STATE.results || []).forEach(r => {
        (r.results || []).forEach(e => gemeldet.add(e.driver));
        (r.dnq || []).forEach(i => gemeldet.add(i)); (r.dns || []).forEach(i => gemeldet.add(i)); (r.dnpq || []).forEach(i => gemeldet.add(i));
      });
      const z = { jahr: y, abzeichen: 0, falsch: 0, fehlend: 0, ohneMeldung: 0 };
      const doppelt = new Set();
      alle.forEach(d => {
        if (d.status && d.status !== 'active') return;
        const k = key(d); if (doppelt.has(k)) return; doppelt.add(k);
        // wie Steckbrief-Titel; geprueft wird am Saisonende, der Rueckfall „hat ein Team“ greift dann nicht
        const _laeuft = (GAME_STATE.currentRace || 0) < (GAME_STATE.races || []).length;
        const deb = getF1DebutYear(d) ?? (d.team && _laeuft ? y : null);
        const badge = deb === y;
        const hatMeldung = gemeldet.has(d.id);
        const frueherSpiel = gesehen.has(k) && gesehen.get(k) < y;
        const echt = d.histId && typeof HIST_DRIVERS !== 'undefined' ? HIST_DRIVERS[d.histId]?.[6] : null;
        const frueherReal = echt != null && echt < START;
        const wahr = hatMeldung && !frueherSpiel && !frueherReal;
        if (badge) { z.abzeichen++; const g = grund(d); gruende[g] = (gruende[g] || 0) + 1; }
        let fall = null;
        if (badge && (frueherSpiel || frueherReal)) { z.falsch++; fall = 'falsch: frueher schon gemeldet'; }
        else if (badge && !hatMeldung) { z.ohneMeldung++; fall = 'Abzeichen ohne Meldung'; }
        else if (!badge && wahr) { z.fehlend++; fall = 'erste Meldung ohne Abzeichen'; }
        if (fall && fehl.length < 25) fehl.push({ jahr: y, fall, name: d.name, id: d.id, histId: d.histId || null,
          deb, grund: grund(d), f1DebutYear: d.f1DebutYear ?? null, echt, ersteImSpiel: gesehen.get(k) ?? null, team: d.team || null,
          imPool: (GAME_STATE.reservePool || []).includes(d) });
      });
      // erst jetzt merken, damit „frueher“ nur Vorsaisons meint
      gemeldet.forEach(id => { const d = byId.get(id); if (d) { const k = key(d); if (!gesehen.has(k)) gesehen.set(k, y); } });
      zeilen.push(z);
      processSeasonEndEvents(); await startNewSeason(); await new Promise(r => setTimeout(r, 150));
    }
    return { zeilen, gruende, fehl };
  }, [START, N]);
  res.zeilen.forEach(z => console.log(JSON.stringify(z)));
  const sum = k => res.zeilen.reduce((n, z) => n + z[k], 0);
  console.log(`SUMME ${START}+${N}: Abzeichen ${sum('abzeichen')}, falsch ${sum('falsch')}, fehlend ${sum('fehlend')}, ohne Meldung ${sum('ohneMeldung')}`);
  console.log('Gruende:', JSON.stringify(res.gruende));
  res.fehl.forEach(f => console.log('FALL', JSON.stringify(f)));
  console.log(err.length ? 'pageerror ' + err.slice(0, 2).join(' | ') : 'kein pageerror');
  await b.close();
})();
