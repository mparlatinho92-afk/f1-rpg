// guest-episodes.js — WIE OFT UND WIE LANGE SPRINGT EIN FAHRER BEI EINEM ANDEREN TEAM EIN?
//
// Nutzer: „gründe fürs hin und her einbauen. so wie in echt. aber wie oft war das?"
// An F1DB gemessen (Episode = zusammenhaengende Rennen ausserhalb des Stammteams):
//   Faelle je Saison: 1980er 2,6 · 1990er 1,8 · 2000er 0,8 · 2010er 0,5
//   Ø Laenge:         1950-70er 1,3-1,4 · 1980er 3,9 · 1990er 2,0 · 2000er 2,5 · 2010er 4,0
// Frueher sprang jemand fuer EIN Rennen in ein zweites Auto; spaeter vertritt er einen
// verletzten Stammfahrer — und eine Verletzung dauert mehrere Rennen.
//
// ⚠ OHNE applyGuestMoves(raceIndex) VOR jedem Rennen misst dieses Skript NULL Bewegung,
//   obwohl das Spiel welche hat. Diese Falle hat schon einmal eine halbe Fehldiagnose
//   gekostet — der Aufruf unten ist kein Beiwerk.
//
//   SIMCORE_FROM_INDEX=1 node tests/guest-episodes.js
// Misst Multi-Team-Faelle je Saison im Vergleich zur realen Zahl.
const { getContext } = require('./sim-core');
const ctx = getContext();
const JAHRE = [1985, 2005, 2015];
for (const y of JAHRE) {
    let faelle = 0, verzahnt = 0, laengen = [];
    const SIMS = 3;
    for (let s = 0; s < SIMS; s++) {
        ctx.initFromYear(y);
        for (let r = 0; r < (ctx.GAME_STATE.races || []).length; r++) {
            if (typeof ctx.applyGuestMoves === "function") ctx.applyGuestMoves(r);
            const res = ctx.simulateRace(r);
            if (ctx.applyRaceResults) ctx.applyRaceResults(res, r);
        }
        const pf = {};
        (ctx.GAME_STATE.results || []).forEach((race, i) => {
            for (const e of (race.results || [])) {
                const t = e.teamName || e.team; if (!e.driver || !t) continue;
                (pf[e.driver] = pf[e.driver] || []).push({ i, t });
            }
        });
        for (const l of Object.values(pf)) {
            const T = new Set(l.map(x => x.t)); if (T.size < 2) continue;
            faelle++;
            const f = l.slice().sort((a, b) => a.i - b.i).map(x => x.t);
            let w = 0; for (let i = 1; i < f.length; i++) if (f[i] !== f[i - 1]) w++;
            if (w > T.size - 1) verzahnt++;
            const cnt = {}; f.forEach(t => cnt[t] = (cnt[t] || 0) + 1);
            const haupt = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0];
            let cur = 0; for (const t of f) { if (t !== haupt) cur++; else if (cur) { laengen.push(cur); cur = 0; } }
            if (cur) laengen.push(cur);
        }
    }
    const avg = laengen.length ? (laengen.reduce((a, b) => a + b, 0) / laengen.length).toFixed(1) : '-';
    console.log(`${y}: ${(faelle / SIMS).toFixed(1)} Multi-Team-Faelle/Saison · `
        + `${faelle ? Math.round(100 * verzahnt / faelle) : 0} % verzahnt · Ø Episode ${avg} Rennen`);
}
