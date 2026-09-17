#!/usr/bin/env node
/**
 * vakuum-saison.js — die Ergebniserzeugung im luftleeren Raum.
 *
 * Alle anderen Werkzeuge messen das Spiel MIT seiner Welt: Transfers,
 * Rücktritte, Feldgröße, Meldelogik. Wenn dort etwas abweicht, weiß man nicht,
 * ob die Rennsimulation schuld ist oder das Drumherum.
 *
 * Hier wird das Drumherum FIXIERT: echte Fahrer, echte Teams, echtes Startfeld
 * aus F1DB. Was dann noch abweicht, kommt aus `simulateRace` — aus carSpeed,
 * der Elo-Übersetzung und der Form-Vielfalt. Genau die drei Stellschrauben.
 *
 * Aufruf:  node tests/vakuum-saison.js <jahr> [laeufe] [--quali]
 *   jahr     z.B. 1988
 *   laeufe   Default 20 — ein einzelner Lauf ist Rauschen, kein Befund
 *   --quali  fiktive Quali statt realer Startplätze (s. unten)
 *
 * Immer mit SIMCORE_FROM_INDEX=1, sonst misst es den letzten Monolithen:
 *   SIMCORE_FROM_INDEX=1 node tests/vakuum-saison.js 1988 20
 *
 * ZWEI MODI, und die Differenz ist selbst ein Messwert:
 *   ohne --quali  reale Startplätze aus F1DB. Misst NUR das Rennen.
 *   mit  --quali  das Spiel qualifiziert selbst, nur das Teilnehmerfeld ist
 *                 fixiert. Die Differenz beider Läufe sagt, wie viel die
 *                 Qualifikation zur Ergebnisstreuung beiträgt.
 *
 * MECHANIK: Nicht das Fahrerfeld wird umgebaut, sondern `qualifyingResults`
 * gesetzt — seit v0.9.17.14 gilt „das Rennen folgt der Qualifikation", also
 * bestimmt das Quali-Ergebnis Teilnehmer UND Startplätze. Das nutzt die
 * bestehende Mechanik, statt sie zu umgehen.
 *
 * ⚠ MESSFALLEN:
 *   - Ein Fahrer ohne gültiges `team` aus `GAME_STATE.teams` wird in
 *     simulateRace stillschweigend übersprungen. Deshalb weist der Bericht die
 *     DECKUNG aus: wie viele reale Starter tatsächlich ins Feld kamen. Unter
 *     ~90 % ist das Ergebnis wertlos.
 *   - Indy 500 (1950-60) ist ein anderes Rennen mit eigenem Feld und fliegt
 *     raus, sonst verzerrt es die Deckung.
 *   - Punkte kommen aus `getPointsForPosition` und sind ära-korrekt; die reale
 *     Wertung wird mit derselben Funktion nachgerechnet, damit Abschneide-
 *     regeln beider Seiten gleich behandelt werden.
 */
const fs = require('fs');
const path = require('path');
const { getContext } = require('./sim-core');

const JAHR = Number(process.argv[2] || 1988);
const LAEUFE = Number(process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 20);
const FIKTIVE_QUALI = process.argv.includes('--quali');
const ROOT = path.join(__dirname, '..');
const DB = path.join(ROOT, 'f1db-json-splitted');

const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// ── Reale Saison laden ───────────────────────────────────────────────────
function realeSaison(jahr) {
    const grid = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-races-starting-grid-positions.json'), 'utf8'))
        .filter(r => r.year === jahr);
    const erg = JSON.parse(fs.readFileSync(path.join(DB, 'f1db-races-race-results.json'), 'utf8'))
        .filter(r => r.year === jahr);

    const runden = {};
    for (const g of grid) {
        const r = runden[g.round] = runden[g.round] || { starter: [] };
        r.starter.push({
            driverId: g.driverId,
            constructorId: g.constructorId,
            platz: g.positionNumber || 99
        });
    }
    for (const r of Object.values(runden)) r.starter.sort((a, b) => a.platz - b.platz);

    // reale Fahrerwertung, mit DERSELBEN Punktefunktion wie das Spiel
    const punkteReal = {};
    for (const e of erg) {
        const pt = String(e.positionText || '');
        if (!/^\d+$/.test(pt)) continue;
        punkteReal[e.driverId] = punkteReal[e.driverId] || 0;
    }
    return { runden, erg, punkteReal };
}

// ── Zuordnung real → Spielobjekt ─────────────────────────────────────────
function baueZuordnung(ctx) {
    const fahrer = new Map(), teams = new Map();
    const alle = (ctx.GAME_STATE.drivers || []).concat(ctx.GAME_STATE.reservePool || []);
    for (const d of alle) {
        if (d.histId) fahrer.set(norm(d.histId), d);
        if (d.name) fahrer.set('n:' + norm(d.name), d);
    }
    for (const t of (ctx.GAME_STATE.teams || [])) {
        if (t.histId) teams.set(norm(t.histId), t);
        if (t.name) teams.set(norm(t.name), t);
    }
    return { fahrer, teams };
}

function findeFahrer(z, driverId) {
    return z.fahrer.get(norm(driverId)) || null;
}
function findeTeam(z, constructorId) {
    return z.teams.get(norm(constructorId)) || null;
}

// ── Ein Lauf ─────────────────────────────────────────────────────────────
function einLauf(ctx, real, punkteFn) {
    ctx.initFromYear(JAHR);
    const gs = ctx.GAME_STATE;
    const z = baueZuordnung(ctx);

    const rennen = gs.races || [];
    let gesucht = 0, gesetzt = 0;

    for (let i = 0; i < rennen.length; i++) {
        const r = rennen[i];
        // Indy 500 der 50er ist ein anderes Rennen mit eigenem Feld
        if (r.isIndy500 || /indianapolis/i.test(r.circuit || '')) continue;

        const rund = real.runden[i + 1];
        if (!rund) continue;

        const eintraege = [];
        for (const s of rund.starter) {
            gesucht++;
            const d = findeFahrer(z, s.driverId);
            const t = findeTeam(z, s.constructorId);
            if (!d || !t) continue;
            d.team = t.id;                 // reale Zuordnung erzwingen
            if (!d.status || d.status !== 'active') d.status = 'active';
            if (!gs.drivers.some(x => x.id === d.id)) gs.drivers.push(d);
            eintraege.push({
                driver: d.id, name: d.name, team: t.id, teamName: t.name,
                position: eintraege.length + 1, score: 1000 - eintraege.length,
                time: null, dnpq: false, fatal: false
            });
            gesetzt++;
        }
        if (!eintraege.length) continue;

        if (FIKTIVE_QUALI) {
            // Feld fixiert, Reihenfolge würfelt das Spiel selbst aus
            ctx.simulateQualifying(i, false);
        } else {
            gs.qualifyingResults = (gs.qualifyingResults || []).filter(q => q.raceIndex !== i);
            gs.qualifyingResults.push({
                raceIndex: i, raceName: r.name, raceCountry: r.country, isRain: false,
                results: eintraege, dnpqIds: [],
                polePosition: eintraege[0].driver, timestamp: new Date().toISOString()
            });
        }

        const erg = ctx.simulateRace(i, false);
        if (erg) ctx.applyRaceResults(erg);
    }

    // Endstand des Spiels — ⚠ die Standings-Keys sind SPIEL-IDs (mit Zeitstempel),
    // keine F1DB-Slugs. Ohne Aufloesung ueber histId vergleicht man Aepfel mit
    // Birnen und bekommt sinnlose Trefferquoten.
    const idx = new Map();
    for (const d of (gs.drivers || []).concat(gs.reservePool || [])) {
        if (d && d.id) idx.set(d.id, d.histId || null);
    }
    const stand = Object.entries(gs.driverStandings || {})
        .map(([id, s]) => ({ id, hist: idx.get(id) || null, name: s.name, punkte: s.points || 0 }))
        .sort((a, b) => b.punkte - a.punkte);

    return { stand, deckung: gesucht ? gesetzt / gesucht : 0 };
}

// ── Realer Endstand mit derselben Punktefunktion ─────────────────────────
function realerStand(real, punkteFn) {
    const p = {};
    for (const e of real.erg) {
        const pt = String(e.positionText || '');
        if (!/^\d+$/.test(pt)) continue;
        p[e.driverId] = (p[e.driverId] || 0) + punkteFn(Number(pt), JAHR);
    }
    return Object.entries(p).map(([id, punkte]) => ({ id, punkte }))
        .sort((a, b) => b.punkte - a.punkte);
}

(async () => {
    const ctx = getContext();
    const real = realeSaison(JAHR);
    const rundenZahl = Object.keys(real.runden).length;
    if (!rundenZahl) { console.error('Keine Startaufstellungen fuer ' + JAHR + ' in F1DB.'); process.exit(1); }

    const punkteFn = ctx.getPointsForPosition;
    const rStand = realerStand(real, punkteFn);
    const rTop = rStand.slice(0, 10).map(x => x.id);

    console.log('VAKUUM-SAISON ' + JAHR + '  (' + rundenZahl + ' Rennen mit realem Grid, '
        + LAEUFE + ' Laeufe, ' + (FIKTIVE_QUALI ? 'FIKTIVE Quali' : 'reale Startplaetze') + ')');
    console.log('Realer Meister: ' + rStand[0].id + ' mit ' + rStand[0].punkte + ' Punkten\n');

    const champTreffer = [], top3Treffer = [], rangAbw = [], deckungen = [], quoten = [], absolut = [];
    for (let l = 0; l < LAEUFE; l++) {
        const { stand, deckung } = einLauf(ctx, real, punkteFn);
        deckungen.push(deckung);
        if (!stand.length) continue;

        // Vergleich laeuft ueber histId — nur wer eine hat, ist zuordenbar
        const schluessel = x => x.hist ? norm(x.hist) : null;

        champTreffer.push(schluessel(stand[0]) === norm(rStand[0].id) ? 1 : 0);

        // Top-3-Ueberschneidung
        const simTop3 = stand.slice(0, 3).map(schluessel).filter(Boolean);
        const realTop3 = rStand.slice(0, 3).map(x => norm(x.id));
        top3Treffer.push(simTop3.filter(x => realTop3.includes(x)).length / 3);

        // mittlere Rangabweichung ueber die realen Top 10
        const simRang = new Map();
        stand.forEach((x, i) => { const k = schluessel(x); if (k && !simRang.has(k)) simRang.set(k, i); });
        const abw = [];
        rTop.forEach((id, i) => {
            const s = simRang.get(norm(id));
            if (s !== undefined) abw.push(Math.abs(s - i));
        });
        if (abw.length) rangAbw.push(avg(abw));

        quoten.push(100 * stand.filter(x => x.punkte > 0).length / stand.length);
        absolut.push(stand.filter(x => x.punkte > 0).length);
    }

    const d = avg(deckungen) * 100;
    console.log('  Deckung reales Grid → Spielfeld: ' + d.toFixed(1) + ' %'
        + (d < 90 ? '   ⚠ ZU NIEDRIG, Ergebnis nicht belastbar' : ''));
    console.log('  Meister getroffen:               ' + (100 * avg(champTreffer)).toFixed(0) + ' % der Laeufe');
    console.log('  Top-3-Ueberschneidung:           ' + (100 * avg(top3Treffer)).toFixed(0) + ' %');
    console.log('  Ø Rangabweichung (reale Top 10): ' + avg(rangAbw).toFixed(2) + ' Plaetze');
    // ⚠ ABSOLUTE Zahl ist die belastbare Groesse, nicht die Quote: die Quote haengt
    //   mechanisch an der Feldgroesse (10 Punkteraenge auf 22 Fahrer ergeben eine
    //   hoehere Quote als auf 29, ohne dass die Engine anders rechnet). Nur wenn
    //   Feld und Bezugsgruppe identisch sind, darf man Quoten vergleichen.
    const realFeld = new Set(real.erg.map(e => e.driverId)).size;
    const realPunktefahrer = rStand.filter(x => x.punkte > 0).length;
    console.log('  Fahrer mit Punkten:  Spiel ' + avg(absolut).toFixed(1)
        + '   real ' + realPunktefahrer
        + '   Differenz ' + (avg(absolut) - realPunktefahrer >= 0 ? '+' : '')
        + (avg(absolut) - realPunktefahrer).toFixed(1) + ' Fahrer');
    console.log('  (Quote Spiel ' + avg(quoten).toFixed(1) + ' %  gegen real '
        + (100 * realPunktefahrer / realFeld).toFixed(1) + ' %  bei ' + realFeld + ' Startern)');
    console.log('\n  Beide Modi fahren und die Differenz lesen: sie ist der Beitrag der Quali.');
})();
