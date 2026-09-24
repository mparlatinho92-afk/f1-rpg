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
function einLauf(ctx, real, punkteFn, gefahren) {
    ctx.initFromYear(JAHR);
    const gs = ctx.GAME_STATE;
    const z = baueZuordnung(ctx);

    const rennen = gs.races || [];
    let gesucht = 0, gesetzt = 0, imRennen = 0, imQuali = 0;
    // Punkte je REALEM Konstrukteur, aus den Fahrerpunkten jedes Rennens. Nicht
    // teamStandings: dort gelten je nach Aera Konstrukteursregeln (nur bestes Auto).
    const teamZuKonstr = new Map(), konstrPunkte = {};

    for (let i = 0; i < rennen.length; i++) {
        const r = rennen[i];
        // Ausschluss zentral in gefahreneRunden() — beide Seiten MUESSEN dieselbe
        // Menge verwenden, sonst misst man gegen Rennen, die nie stattfanden.
        if (!gefahren.has(i + 1)) continue;

        const rund = real.runden[i + 1];
        if (!rund) continue;

        const eintraege = [];
        for (const s of rund.starter) {
            gesucht++;
            const d = findeFahrer(z, s.driverId);
            const t = findeTeam(z, s.constructorId);
            if (!d || !t) continue;
            d.team = t.id;                 // reale Zuordnung erzwingen
            teamZuKonstr.set(t.id, s.constructorId);
            if (!d.status || d.status !== 'active') d.status = 'active';
            // ⚠ MELDE-FILTER AUSHEBELN (18.09.2026). Wer real in der
            // Startaufstellung stand, hat nachweislich teilgenommen — der
            // Privateer-/Meldeplan darf ihn im Vakuum nicht aussortieren.
            // Ohne das fehlten in alten Jahren bis zu 17 % der realen Starter
            // (1955 83,2 % Renn-Deckung, 1965 87,0 %, 2010 dagegen 99,5 %), weil
            // dort fast jeder Zweite als Privatier markiert ist. Die Messung lief
            // damit auf einem kleineren Feld als dem realen und meldete trotzdem
            // 100 % Deckung — jede Aussage ueber alte Aeren war dadurch verzerrt.
            d.isPrivateer = false;
            d.scheduledRaces = null;
            d.homeOnly = false;
            if (!gs.drivers.some(x => x.id === d.id)) gs.drivers.push(d);
            eintraege.push({
                driver: d.id, name: d.name, team: t.id, teamName: t.name,
                position: eintraege.length + 1, score: 1000 - eintraege.length,
                time: null, dnpq: false, fatal: false
            });
            gesetzt++;
        }
        if (!eintraege.length) continue;

        // ⚠ WER REAL NICHT STARTETE, DARF AUCH NICHT IM FELD STEHEN (18.09.2026).
        // Die realen Starter zu setzen genuegt NICHT: die uebrigen Fahrer aus
        // SEASON_DATA bleiben sonst im Kader und konkurrieren um dieselben
        // Startplaetze. Ferrari stand 1982 dadurch mit drei Autos da, und
        // simulateRace warf einen heraus — ohne DNQ, DNS oder sonst eine Spur.
        // Gilles Villeneuve fehlte so in Rennen, die er real bestritten hat.
        // Betrifft besonders Jahre mit vielen Fahrerwechseln: 1982 kam auf 86,8 %
        // Renn-Deckung, 1995 auf 83,3 %.
        const startetHier = new Set(eintraege.map(e => e.driver));
        for (const d of gs.drivers) {
            if (!startetHier.has(d.id)) d.team = null;
        }

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
        for (const e of (erg ? erg.results || [] : [])) {
            const k = teamZuKonstr.get(e.team);
            if (k && e.points > 0) konstrPunkte[k] = (konstrPunkte[k] || 0) + e.points;
        }

        // ⚠ Die Deckung muss die RENNTEILNAHME messen, nicht das gesetzte Quali.
        // Gemessen 2005: in 6 von 19 Runden stand ein Fahrer im Quali, tauchte im
        // Rennen aber nicht auf — simulateRace filtert still (kein Team in
        // GAME_STATE.teams, homeOnly, Indy-Regel, Status). Wer nur das Quali zaehlt,
        // meldet 100 % Deckung und misst trotzdem ein anderes Feld als das reale.
        imRennen += erg ? (erg.results || []).length : 0;
        imQuali += eintraege.length;
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

    const siegeChamp = stand.length
        ? (gs.driverStandings[stand[0].id] || {}).wins || 0
        : 0;
    // Wie viele TEAMS punkten? Real ist das der staerkste Treiber der
    // Punktefahrer-Zahl: Korrelation 0,602 ueber 75 Jahre, und die
    // Top-2-Konzentration -0,555 — beides deutlich vor DNF-Quote (0,139),
    // Feldgroesse (0,229) oder Rennzahl (0,276).
    // 1953 punkten real 3 Teams und 12 Fahrer, 1989 sind es 16 Teams und 29
    // Fahrer. Wer die Fahrerzahl treffen will, muss die TEAMS treffen.
    const teamPunkte = Object.values(gs.teamStandings || {}).filter(t => (t.points || 0) > 0).length;
    return { stand, teamPunkte, konstrPunkte, deckung: gesucht ? gesetzt / gesucht : 0, siegeChamp,
             rennDeckung: imQuali ? imRennen / imQuali : 0 };
}

// ── Realer Endstand mit derselben Punktefunktion ─────────────────────────
// ⚠ NUR ueber die Runden, die das Spiel auch faehrt. Sonst misst man gegen eine
//   Wertung, die Rennen enthaelt, die im Spiel gar nicht stattfanden:
//     1955  real 24 Punktefahrer MIT Indy 500, nur 17 ohne  → 7 Fahrer Differenz
//     1950  22 gegen 16 · 1960  24 gegen 19 · 2005  24 gegen 21
//   Das Spiel konnte diese Fahrer nie erreichen; die Abweichung war ein reiner
//   Messfehler. 1955 stand dadurch bei -7,6 statt bei -0,6.
function realerStand(real, punkteFn, gefahren) {
    const p = {};
    for (const e of real.erg) {
        if (gefahren && !gefahren.has(e.round)) continue;
        const pt = String(e.positionText || '');
        if (!/^\d+$/.test(pt)) continue;
        p[e.driverId] = (p[e.driverId] || 0) + punkteFn(Number(pt), JAHR);
    }
    return Object.entries(p).map(([id, punkte]) => ({ id, punkte }))
        .sort((a, b) => b.punkte - a.punkte);
}

// Welche Runden faehrt das Spiel? Muss dieselbe Logik sein wie in einLauf().
//   - Indy 500 der 50er: eigene Fahrer- und Teamwelt, fix 33 Startplaetze —
//     gehoert nicht in einen Vergleich der F1-Saison.
//   - Rennen mit einem Bruchteil des ueblichen Feldes: Anomalie, kein Massstab.
//     Trifft den US-GP 2005 (6 Starter nach dem Michelin-Rueckzug).
function gefahreneRunden(ctx, real) {
    const gefahren = new Set(), raus = [];
    const groessen = Object.values(real.runden).map(r => r.starter.length).sort((a, b) => a - b);
    const median = groessen.length ? groessen[groessen.length >> 1] : 0;
    (ctx.GAME_STATE.races || []).forEach((r, i) => {
        const rund = real.runden[i + 1];
        if (!rund) return;
        if (r.isIndy500 || /indianapolis/i.test(r.circuit || '')) {
            raus.push((i + 1) + ' Indianapolis'); return;
        }
        if (median > 0 && rund.starter.length < median * 0.6) {
            raus.push((i + 1) + ' nur ' + rund.starter.length + ' Starter'); return;
        }
        gefahren.add(i + 1);
    });
    return { gefahren, raus };
}

(async () => {
    const ctx = getContext();
    const real = realeSaison(JAHR);
    const rundenZahl = Object.keys(real.runden).length;
    if (!rundenZahl) { console.error('Keine Startaufstellungen fuer ' + JAHR + ' in F1DB.'); process.exit(1); }

    const punkteFn = ctx.getPointsForPosition;
    // Rundenmenge EINMAL bestimmen und an beide Seiten geben
    ctx.initFromYear(JAHR);
    const { gefahren, raus } = gefahreneRunden(ctx, real);
    const rStand = realerStand(real, punkteFn, gefahren);
    const rTop = rStand.slice(0, 10).map(x => x.id);

    if (raus.length) console.log('  ausgeschlossen (beide Seiten): ' + raus.join(' · '));
    console.log('VAKUUM-SAISON ' + JAHR + '  (' + gefahren.size + ' von ' + rundenZahl + ' Rennen, '
        + LAEUFE + ' Laeufe, ' + (FIKTIVE_QUALI ? 'FIKTIVE Quali' : 'reale Startplaetze') + ')');
    console.log('Realer Meister: ' + rStand[0].id + ' mit ' + rStand[0].punkte + ' Punkten\n');

    const champTreffer = [], top3Treffer = [], rangAbw = [], deckungen = [], quoten = [], absolut = [];
    // DOMINANZ des Besten — Gegenprobe zu jeder Streuungs-Senkung: weniger Zufall
    // heisst zwangslaeufig konsistentere Spitze. Wer die Streuung senkt, muss HIER
    // nachsehen, sonst tauscht er ein Problem gegen ein anderes.
    const champAnteil = [], champSiege = [];
    // Vollstaendiger Endstand-Vergleich: was hier abweicht, ist bei fixiertem Feld
    // und kalibrierter Streuung im Wesentlichen die FAHRERBEWERTUNG.
    const alleAbw = [], spearman = [], punktAbw = [], zuordenbar = [], rennDeck = [], teamsMitPunkten = [];
    const laufRaenge = [];   // je Lauf: Map Fahrer-Schluessel -> Rang, fuer Spiel<->Spiel
    const konstrLaeufe = [];
    for (let l = 0; l < LAEUFE; l++) {
        const { stand, teamPunkte, konstrPunkte, deckung, siegeChamp, rennDeckung } = einLauf(ctx, real, punkteFn, gefahren);
        konstrLaeufe.push(konstrPunkte);
        rennDeck.push(rennDeckung);
        teamsMitPunkten.push(teamPunkte);
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

        // === VOLLSTAENDIGER ENDSTAND (v0.9.18.7) ===
        // Wie nah kommt das Vakuum an das ECHTE Jahr? Ueber ALLE zuordenbaren
        // Fahrer, nicht nur die Top 10 — dort faellt der Schwanz sonst unter den
        // Tisch, und genau der ist das offene Thema.
        // Was hier noch abweicht, ist im Wesentlichen die FAHRERBEWERTUNG: Feld,
        // Teams und Startplaetze sind fixiert, die Streuung ist kalibriert.
        const paare = [];
        rStand.forEach((r, ri) => {
            const s = simRang.get(norm(r.id));
            if (s !== undefined) paare.push({ realRang: ri, simRang: s, realPunkte: r.punkte });
        });
        if (paare.length > 3) {
            alleAbw.push(avg(paare.map(p => Math.abs(p.simRang - p.realRang))));
            // ⚠ Spearman NUR ueber Raenge derselben Menge. Vorher standen hier
            // simRang (aus der vollen Spiel-Tabelle, 0..m) gegen realRang
            // (0..n) — zwei verschiedene Wertebereiche. Die d²-Formel setzt
            // Permutationen gleicher Laenge voraus und lieferte sonst Unsinn:
            // 1955 ergab -1,520, unmoeglich fuer eine Korrelation.
            // Deshalb beide Seiten INNERHALB der gemeinsamen Fahrer neu ranken.
            const n = paare.length;
            const rangVon = werte => {
                const idx = werte.map((w, i) => [w, i]).sort((a, b) => a[0] - b[0]);
                const r = new Array(werte.length);
                idx.forEach((x, i) => { r[x[1]] = i; });
                return r;
            };
            const rr = rangVon(paare.map(p => p.realRang));
            const rs = rangVon(paare.map(p => p.simRang));
            const d2 = rr.reduce((a, v, i) => a + Math.pow(v - rs[i], 2), 0);
            spearman.push(1 - (6 * d2) / (n * (n * n - 1)));
            zuordenbar.push(n);
            // Punktabweichung, normiert auf die Meisterpunkte des Jahres — sonst
            // sind Aeren mit 9-Punkte-Siegen und 25-Punkte-Siegen nicht vergleichbar
            const simPunkte = new Map();
            stand.forEach(x => { const k = schluessel(x); if (k && !simPunkte.has(k)) simPunkte.set(k, x.punkte); });
            const cp = rStand[0].punkte || 1;
            const pAbw = [];
            for (const r of rStand) {
                const sp = simPunkte.get(norm(r.id));
                if (sp !== undefined) pAbw.push(Math.abs(sp - r.punkte) / cp);
            }
            if (pAbw.length) punktAbw.push(100 * avg(pAbw));
        }
        const abw = [];
        rTop.forEach((id, i) => {
            const s = simRang.get(norm(id));
            if (s !== undefined) abw.push(Math.abs(s - i));
        });
        if (abw.length) rangAbw.push(avg(abw));

        quoten.push(100 * stand.filter(x => x.punkte > 0).length / stand.length);
        absolut.push(stand.filter(x => x.punkte > 0).length);
        const summe = stand.reduce((a, b) => a + b.punkte, 0);
        if (summe > 0) champAnteil.push(100 * stand[0].punkte / summe);
        champSiege.push(siegeChamp);
        laufRaenge.push(simRang);
    }

    const d = avg(deckungen) * 100;
    const rd = avg(rennDeck) * 100;
    console.log('  Deckung reales Grid → Quali:     ' + d.toFixed(1) + ' %'
        + (d < 90 ? '   ⚠ ZU NIEDRIG, Ergebnis nicht belastbar' : ''));
    console.log('  davon auch im RENNEN gestartet:  ' + rd.toFixed(1) + ' %'
        + (rd < 97 ? '   ⚠ simulateRace filtert still — Feld weicht ab' : ''));
    console.log('  Meister getroffen:               ' + (100 * avg(champTreffer)).toFixed(0) + ' % der Laeufe');
    console.log('  Top-3-Ueberschneidung:           ' + (100 * avg(top3Treffer)).toFixed(0) + ' %');
    console.log('  Ø Rangabweichung (reale Top 10): ' + avg(rangAbw).toFixed(2) + ' Plaetze');
    // ⚠ ABSOLUTE Zahl ist die belastbare Groesse, nicht die Quote: die Quote haengt
    //   mechanisch an der Feldgroesse (10 Punkteraenge auf 22 Fahrer ergeben eine
    //   hoehere Quote als auf 29, ohne dass die Engine anders rechnet). Nur wenn
    //   Feld und Bezugsgruppe identisch sind, darf man Quoten vergleichen.
    const realFeld = new Set(real.erg.map(e => e.driverId)).size;
    const realPunktefahrer = rStand.filter(x => x.punkte > 0).length;
    // reale Teams mit Punkten, nur ueber die gefahrenen Runden
    const rTeam = {};
    for (const e of real.erg) {
        if (!gefahren.has(e.round)) continue;
        const pt = String(e.positionText || '');
        if (!/^[0-9]+$/.test(pt)) continue;
        if (punkteFn(Number(pt), JAHR) > 0) rTeam[e.constructorId] = 1;
    }
    console.log('  Teams mit Punkten:   Spiel ' + avg(teamsMitPunkten).toFixed(1)
        + '   real ' + Object.keys(rTeam).length
        + '   Differenz ' + (avg(teamsMitPunkten) - Object.keys(rTeam).length >= 0 ? '+' : '')
        + (avg(teamsMitPunkten) - Object.keys(rTeam).length).toFixed(1));
    console.log('  Fahrer mit Punkten:  Spiel ' + avg(absolut).toFixed(1)
        + '   real ' + realPunktefahrer
        + '   Differenz ' + (avg(absolut) - realPunktefahrer >= 0 ? '+' : '')
        + (avg(absolut) - realPunktefahrer).toFixed(1) + ' Fahrer');
    // === PUNKTEANTEIL JE TEAM-DRITTEL (24.09.2026) ===
    // Die ANZAHL punktender Fahrer/Teams liegt an ihrer Rauschgrenze (BEFUNDE.md
    // "Die Rauschgrenze"). Der Punkteanteil je Drittel sagt direkt, ob schwache
    // Teams zu schwach sind. Drittel nach realem mittlerem Startplatz, nicht nach
    // Punkten (die haengen selbst am Ergebnis). Teams ab 3 Starts.
    {
        const gridSum = {}, gridN = {}, rPkt = {};
        for (const [rd, rund] of Object.entries(real.runden)) {
            if (!gefahren.has(Number(rd))) continue;
            for (const st of rund.starter) {
                gridSum[st.constructorId] = (gridSum[st.constructorId] || 0) + st.platz;
                gridN[st.constructorId] = (gridN[st.constructorId] || 0) + 1;
            }
        }
        for (const e of real.erg) {
            if (!gefahren.has(e.round)) continue;
            const pt = String(e.positionText || '');
            if (!/^[0-9]+$/.test(pt)) continue;
            rPkt[e.constructorId] = (rPkt[e.constructorId] || 0) + punkteFn(Number(pt), JAHR);
        }
        const konstr = Object.keys(gridN).filter(k => gridN[k] >= 3)
            .sort((a, b) => gridSum[a] / gridN[a] - gridSum[b] / gridN[b]);
        const n3 = Math.max(1, Math.round(konstr.length / 3));
        const drittel = [konstr.slice(0, n3), konstr.slice(n3, konstr.length - n3), konstr.slice(konstr.length - n3)];
        const anteile = pkt => {
            const ges = konstr.reduce((a, k) => a + (pkt[k] || 0), 0) || 1;
            return drittel.map(d => 100 * d.reduce((a, k) => a + (pkt[k] || 0), 0) / ges);
        };
        const rA = anteile(rPkt);
        const sA = [0, 1, 2].map(i => avg(konstrLaeufe.map(p => anteile(p)[i])));
        console.log('  Punkteanteil Drittel: Spiel ' + sA.map(v => v.toFixed(1)).join('/')
            + '   real ' + rA.map(v => v.toFixed(1)).join('/')
            + '   (stark/mittel/schwach nach realem Startplatz, ' + konstr.length + ' Teams)');
    }
    console.log('  (Quote Spiel ' + avg(quoten).toFixed(1) + ' %  gegen real '
        + (100 * realPunktefahrer / realFeld).toFixed(1) + ' %  bei ' + realFeld + ' Startern)');
    const rSumme = rStand.reduce((a, b) => a + b.punkte, 0);
    const rAnteil = rSumme > 0 ? 100 * rStand[0].punkte / rSumme : NaN;
    let rSiege = 0;
    for (const e of real.erg) {
        if (!gefahren.has(e.round)) continue;
        if (String(e.positionText) === '1' && e.driverId === rStand[0].id) rSiege++;
    }
    console.log('\n  ── ENDSTAND gegen das echte Jahr ──');
    console.log('  zuordenbare Fahrer:           ' + Math.round(avg(zuordenbar)) + ' von ' + rStand.length);
    console.log('  Ø Rangabweichung, ALLE:       ' + avg(alleAbw).toFixed(2) + ' Plaetze');
    console.log('  Spearman-Rangkorrelation:     ' + avg(spearman).toFixed(3) + '   (1,0 = identische Reihenfolge)');
    // === RAUSCHGRENZE (24.09.2026) ===
    // Auch ein perfektes Spiel erreicht gegen EINE reale Saison nicht 1,0 — die reale
    // Saison ist selbst ein Zufallswurf. Spiel<->Spiel (zwei unabhaengige Laeufe,
    // dieselbe Fahrermenge wie gegen real) zeigt die Obergrenze. Liegt Spiel<->real
    // nahe daran, ist der Rest Zufall und kein Modellfehler.
    {
        const realSchl = rStand.map(r => norm(r.id));
        const werte = [];
        for (let i = 0; i + 1 < laufRaenge.length; i += 2) {
            const a = laufRaenge[i], b = laufRaenge[i + 1];
            const gem = realSchl.filter(k => a.has(k) && b.has(k));
            if (gem.length < 4) continue;
            const rangVon = w => { const o = w.map((v, j) => [v, j]).sort((x, y) => x[0] - y[0]); const r = []; o.forEach((x, j) => { r[x[1]] = j; }); return r; };
            const ra = rangVon(gem.map(k => a.get(k))), rb = rangVon(gem.map(k => b.get(k)));
            const n = gem.length, d2 = ra.reduce((acc, v, j) => acc + (v - rb[j]) ** 2, 0);
            werte.push(1 - 6 * d2 / (n * (n * n - 1)));
        }
        if (werte.length) console.log('  Spearman Spiel<->Spiel:       ' + avg(werte).toFixed(3) + '   (Rauschgrenze, ' + werte.length + ' Laufpaare)');
    }
    console.log('  Ø Punktabweichung je Fahrer:  ' + avg(punktAbw).toFixed(1) + ' % der Meisterpunkte');

    console.log('\n  ── DOMINANZ des Besten ──');
    console.log('  Punktanteil des Fuehrenden:  Spiel ' + avg(champAnteil).toFixed(1)
        + ' %   real ' + rAnteil.toFixed(1) + ' %');
    console.log('  Siege des Fuehrenden:        Spiel ' + avg(champSiege).toFixed(1)
        + '     real ' + rSiege + '  (von ' + gefahren.size + ' Rennen)');

    console.log('\n  Beide Modi fahren und die Differenz lesen: sie ist der Beitrag der Quali.');
})();
