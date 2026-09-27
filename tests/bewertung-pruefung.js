#!/usr/bin/env node
/**
 * bewertung-pruefung.js — folgen Zufriedenheit und Ansehen der Über-/Unterperformance?
 *
 * Nutzer-Regel (26.09.2026): Der vorgesehene Platz eines Fahrers ergibt sich aus dem Rang
 * seines Teams — beim siebtbesten Team etwa Platz 13–14 (zwei Wagen je Team). Geprüft
 * gegen WM-Stand, Startplatz und Rennen, dort bereinigt um Ausfälle (Platz unter den
 * Angekommenen, als wäre niemand ausgefallen). Als PERZENTIL formuliert, damit Feldgröße
 * und Ausfallquote herausfallen:
 *   erwartet  = (Teamrang − 0,5) / Teams
 *   tatsächl. = Mittel aus WM-Rang, Ø Startplatz und Ø Zielplatz unter den Angekommenen,
 *               jeweils als Anteil des Feldes
 *   Über      = erwartet − tatsächlich  (> 0: besser als das Auto verspricht)
 * Gemessen: Korrelation der heutigen Zufriedenheit (evaluateDriverPerformance.score) und
 * des Saison-Rohwerts des Ansehens (repHistory.raw) mit „Über" und mit dem absoluten
 * Abschneiden, dazu die Form der Verteilungen (Glockenkurve?).
 *
 * Aufruf: node tests/bewertung-pruefung.js [laeufe]   (misst index.html)
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const { getContext } = require('./sim-core');
const ctx = getContext();
const LAEUFE = Number(process.argv[2] || 3);
const JAHRE = [1965, 1985, 2001, 2015];

const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
const sd = a => { const m = avg(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };
const pear = (a, b) => { const ma = avg(a), mb = avg(b); let c = 0, va = 0, vb = 0; for (let i = 0; i < a.length; i++) { c += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; } return c / Math.sqrt(va * vb); };
const schiefe = a => { const m = avg(a), s = sd(a); return a.reduce((x, v) => x + ((v - m) / s) ** 3, 0) / a.length; };

const zeilen = [];
for (const jahr of JAHRE) for (let l = 0; l < LAEUFE; l++) {
    ctx.initFromYear(jahr);
    const gs = ctx.GAME_STATE;
    ctx.simulateSeasonRaces();
    const nRennen = (gs.results || []).length;
    // Teamrang aus der Konstrukteurs-WM (wie evaluateDriverPerformance)
    const teams = Object.entries(gs.teamStandings || {}).map(([id, s]) => ({ id, p: s.points || 0 })).sort((a, b) => b.p - a.p);
    const teamRang = id => { const i = teams.findIndex(t => t.id === id); return i >= 0 ? i + 1 : teams.length; };
    // WM-Rang unter allen Fahrern mit Starts
    const fahrerStarts = {};
    for (const rr of gs.results) for (const e of rr.results) fahrerStarts[e.driver] = (fahrerStarts[e.driver] || 0) + 1;
    const wm = Object.entries(gs.driverStandings || {}).filter(([id]) => fahrerStarts[id]).map(([id, s]) => ({ id, p: s.points || 0 })).sort((a, b) => b.p - a.p);
    // Ansehen vorher merken, dann die Saison-Auswertung wie im Spiel
    ctx.updateDriverReputations();
    for (const d of gs.drivers.filter(d => (!d.status || d.status === 'active') && d.team && fahrerStarts[d.id] >= nRennen / 2)) {
        const zf = [], gr = [];
        for (const rr of gs.results) {
            const e = rr.results.find(x => x.driver === d.id); if (!e) continue;
            const angekommen = rr.results.filter(x => !x.dnf && !x.fatal && x.position > 0).sort((a, b) => a.position - b.position);
            const i = angekommen.findIndex(x => x.driver === d.id);
            if (i >= 0 && angekommen.length > 1) zf.push(i / (angekommen.length - 1));
            if (e.qualiPos > 0) gr.push((e.qualiPos - 1) / Math.max(1, rr.results.length - 1));
        }
        const wmI = wm.findIndex(x => x.id === d.id);
        const wmAnteil = wmI >= 0 ? wmI / Math.max(1, wm.length - 1) : 1;
        const teile = [wmAnteil]; if (zf.length) teile.push(avg(zf)); if (gr.length) teile.push(avg(gr));
        const tats = avg(teile);
        const erw = (teamRang(d.team) - 0.5) / teams.length;
        const ev = ctx.evaluateDriverPerformance(d.id);
        const rep = (d.repHistory || []).find(h => h.year === gs.currentYear);
        if (!ev || !rep) continue;
        const autoRang = [...gs.teams].filter(t => t.carSpeed > 0).sort((a, b) => b.carSpeed - a.carSpeed).findIndex(t => t.id === d.team);
        zeilen.push({ jahr, uSpiel: ev.ueber, autoDrittel: autoRang < 0 ? null : Math.floor(3 * autoRang / gs.teams.filter(t => t.carSpeed > 0).length), ueber: erw - tats, absolut: 1 - tats, zufr: ev.score, repRoh: rep.raw, rep: d.reputation, rang: teamRang(d.team), teams: teams.length });
    }
}

console.log('Fahrer-Saisons:', zeilen.length, '(' + JAHRE.join(', ') + ', je ' + LAEUFE + ' Läufe)\n');
const u = zeilen.map(z => z.ueber), ab = zeilen.map(z => z.absolut);
console.log('                        r(Über-/Unterperf.)   r(absolutes Abschneiden)   Mittel   σ     Schiefe');
for (const [n, k] of [['Zufriedenheit', 'zufr'], ['Ansehen Saison-Rohwert', 'repRoh'], ['Ansehen geglättet', 'rep']]) {
    const v = zeilen.map(z => z[k]);
    console.log('  ' + n.padEnd(22), pear(v, u).toFixed(2).padStart(10), '             ', pear(v, ab).toFixed(2).padStart(10), '          ', avg(v).toFixed(1).padStart(5), sd(v).toFixed(1).padStart(5), schiefe(v).toFixed(2).padStart(7));
}
console.log('  Über-/Unterperf. selbst:', '  Mittel ' + avg(u).toFixed(3), '· σ ' + sd(u).toFixed(3), '· Schiefe ' + schiefe(u).toFixed(2));

// Verteilung in Zehnerstufen
for (const [n, k] of [['Zufriedenheit', 'zufr'], ['Ansehen Saison-Rohwert', 'repRoh']]) {
    const h = new Array(10).fill(0);
    for (const z of zeilen) h[Math.min(9, Math.max(0, Math.floor(z[k] / 10)))]++;
    console.log('\n' + n + ' (0–9, 10–19, …, 90–100):');
    console.log('  ' + h.map(c => '█'.repeat(Math.round(c / zeilen.length * 80)).padEnd(2) + ' ' + c).join('\n  '));
}

// Faustregel-Probe: Fahrer genau auf Erwartung (|Über| < 0,05) je Team-Drittel
console.log('\nFahrer GENAU auf Erwartung (|Über| < 0,05) — gleiche Leistung relativ zum Auto:');
for (const [n, f] of [['Team oben', z => z.rang <= z.teams / 3], ['Team Mitte', z => z.rang > z.teams / 3 && z.rang <= 2 * z.teams / 3], ['Team unten', z => z.rang > 2 * z.teams / 3]]) {
    const l = zeilen.filter(z => Math.abs(z.ueber) < 0.05 && f(z));
    if (l.length) console.log('  ' + n.padEnd(11), 'Zufriedenheit Ø ' + avg(l.map(z => z.zufr)).toFixed(0), '· Ansehen roh Ø ' + avg(l.map(z => z.repRoh)).toFixed(0), '(n ' + l.length + ')');
}

// Gleiche Probe mit der Erwartung, die die Zufriedenheit selbst nutzt (Auto-Rang, ev.ueber)
console.log('\nGENAU auf Erwartung nach AUTO-Rang (|ev.ueber| < 0,05) — Maßstab der Zufriedenheit:');
for (const [n, dr] of [['Auto oben', 0], ['Auto Mitte', 1], ['Auto unten', 2]]) {
    const l = zeilen.filter(z => z.uSpiel !== null && Math.abs(z.uSpiel) < 0.05 && z.autoDrittel === dr);
    if (l.length) console.log('  ' + n.padEnd(11), 'Zufriedenheit Ø ' + avg(l.map(z => z.zufr)).toFixed(1), '± ' + (sd(l.map(z => z.zufr)) / Math.sqrt(l.length)).toFixed(1), '(n ' + l.length + ')');
}
