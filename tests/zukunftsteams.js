// zukunftsteams.js — Teams jenseits des SEASON_DATA-Horizonts (Browser).
//
// ANLASS (Fix-Liste „Teamfarben & Liveries“, 14.11.2026): SEASON_DATA endet 2025. Ab 2026
// verloren simulierte Saisons die Teamfarben (nur McLaren hatte eine Range bis 2099),
// Kick Sauber fuhr ewig weiter, Cadillac trat nie an. Seit v0.9.21.37: FUTURE_TEAMS,
// CONSTRUCTOR_SUCCESSION 'Kick Sauber' -> 'Audi', applyFutureTeamEntries, Horizont-Rueckfall
// in getTeamColors.
//
// ABLAUF   initFromYear(2025), dann drei Saisonketten (processSeasonEndEvents + startNewSeason)
//          bis 2028. Je Jahr: Audi/Cadillac vorhanden? wie viele Fahrer? Farben aus getTeamColors.
// DNQ      je Saison die DNQ-Meldungen aller Rennen (GAME_STATE.results[].dnq) vor dem Saisonende
//          — die Moderne kennt keine; mit festen 20 Startplaetzen schied 2026 je Rennen zwei aus.
// SOLL     2026+: Audi (id KIC) und Cadillac (id CAD) mit je 2 Fahrern, Cadillac genau einmal,
//          keine Kick Sauber mehr; grau = 0 Teams; unter2 = Teams mit weniger als 2 Fahrern = 0; dnq = 0; Audi/Cadillac in der Farbe aus FUTURE_TEAMS-Range.
// AUFRUF   node tests/zukunftsteams.js [Saisonwechsel, Standard 3]   (Langlauf: 15 = bis 2040, ~5 Min.)
const { chromium } = require('playwright'); const path = require('path'); const { pathToFileURL } = require('url');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const err = [];
  p.on('pageerror', e => err.push(e.message));
  await p.goto(pathToFileURL(path.join(process.cwd(), 'index.html')).href, { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  const N = Number(process.argv[2]) || 3;
  const rows = await p.evaluate(async (N) => {
    window.alert = () => {}; window.confirm = () => true;
    const out = [];
    const snap = () => {
      const y = GAME_STATE.currentYear;
      const act = d => !d.status || d.status === 'active';
      const n = id => GAME_STATE.drivers.filter(d => d.team === id && act(d)).length;
      const grey = GAME_STATE.teams.filter(t => {
        const c = getTeamColors(t.id, y); return !c || !c[0] || /^#888(888)?$/i.test(c[0]);
      }).map(t => t.name);
      const pick = name => { const t = GAME_STATE.teams.filter(x => x.name === name);
        return t.length ? t.map(x => ({ id: x.id, fahrer: n(x.id), farbe: getTeamColors(x.id, y).join(' ') })) : null; };
      out.push({ jahr: y, teams: GAME_STATE.teams.length, kick: !!GAME_STATE.teams.find(t => t.name === 'Kick Sauber'),
        audi: pick('Audi'), cadillac: pick('Cadillac'), grau: grey, unter2: GAME_STATE.teams.filter(t => n(t.id) < 2).map(t => t.name), eingetreten: GAME_STATE.futureTeamsEntered || null });
    };
    initFromYear(2025); snap();
    for (let i = 0; i < N; i++) {
      simulateSeasonRaces();
      out[out.length - 1].dnq = (GAME_STATE.results || []).reduce((n, r) => n + ((r.dnq || []).length), 0);
      out[out.length - 1].grid = getGridSize(GAME_STATE.currentYear);
      processSeasonEndEvents(); await startNewSeason();
      await new Promise(r => setTimeout(r, 300)); snap();
    }
    simulateSeasonRaces();
    out[out.length - 1].dnq = (GAME_STATE.results || []).reduce((n, r) => n + ((r.dnq || []).length), 0);
    out[out.length - 1].grid = getGridSize(GAME_STATE.currentYear);
    return out;
  }, N);
  rows.forEach(r => console.log(JSON.stringify(r)));
  console.log(err.length ? 'pageerror ' + err.slice(0, 3).join(' | ') : 'kein pageerror');
  await b.close();
})();
