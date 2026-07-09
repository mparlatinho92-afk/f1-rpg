// ═══════════════════════════════════════════════════════════════════════════
// PAKET D – QA-EXPORT-SNIPPET (Browser-Konsole)
// Nach einem MegaSim-Lauf in der Konsole (F12) einfügen und Enter drücken.
// Lädt pro Saison das schwere Detail lazy aus IndexedDB (getHistoryDetail)
// und lädt am Ende automatisch "megasim-qa.json" herunter.
// KEIN Eingriff ins Spiel – nur lesender Export.
// ═══════════════════════════════════════════════════════════════════════════
(async () => {
    const out = {
        meta: {
            version: typeof VERSION !== 'undefined' ? VERSION : '?',
            exportedAt: new Date().toISOString(),
            settings: {
                deathRealism: GAME_STATE.deathRealism,
                dnfRate: GAME_STATE.dnfRate,
                dnfWeight: GAME_STATE.dnfWeight,
                juniorMode: GAME_STATE.juniorMode || 'off'
            },
            seasonsInHistory: GAME_STATE.history.length,
            currentYear: GAME_STATE.currentYear,
            templateUsed: GAME_STATE.templateUsed || null
        },
        seasons: []
    };

    for (const h of GAME_STATE.history) {
        if (h.type && h.type !== 'simulated') continue;
        // Schweres Detail lazy nachladen (nach Save/Load liegen results/drivers in IndexedDB)
        let det = null;
        try {
            det = (typeof getHistoryDetail === 'function') ? await getHistoryDetail(h.year) : null;
        } catch (e) { /* Detail fehlt → leichte Felder reichen teilweise */ }
        const g = (k) => (h[k] !== undefined && h[k] !== null) ? h[k] : (det ? det[k] : undefined);

        const drivers     = g('drivers') || [];
        const teams       = g('teams') || [];
        const dStand      = g('driverStandings') || {};
        const tStand      = g('teamStandings') || {};
        const results     = g('results') || [];
        const transfers   = g('transfers') || [];
        const deaths      = g('deaths') || [];
        const retirements = g('retirements') || [];

        const dById = new Map(drivers.map(d => [d.id, d]));
        const tById = new Map(teams.map(t => [t.id, t]));
        const teamName = id => tById.get(id)?.name || id || null;

        const dSorted = Object.entries(dStand).map(([id, s]) => ({ id, ...s }))
            .sort((a, b) => (b.points || 0) - (a.points || 0));
        const tSorted = Object.entries(tStand).map(([id, s]) => ({ id, ...s }))
            .sort((a, b) => (b.points || 0) - (a.points || 0));

        // DNF- & Punkte-Finish-Statistik aus den komprimierten Rennergebnissen
        let starts = 0, dnfs = 0, fatals = 0;
        const dnfByTeam = {}, ptsFinishByTeam = {};
        for (const race of results) {
            for (const r of (race.res || [])) {
                starts++;
                const tn = r.tmn || teamName(dById.get(r.d)?.team) || '?';
                if (r.dnf) { dnfs++; dnfByTeam[tn] = (dnfByTeam[tn] || 0) + 1; }
                if (r.fat) fatals++;
                if ((r.pt || 0) > 0) ptsFinishByTeam[tn] = (ptsFinishByTeam[tn] || 0) + 1;
            }
        }

        const champD = dById.get(h.championId);
        const champTeamRank = tSorted.findIndex(t => t.id === champD?.team) + 1;

        out.seasons.push({
            year: h.year,
            raceCount: h.raceCount ?? results.length,
            champion: {
                name: h.champion,
                points: h.championPoints,
                rookie: !!h.championRookie,
                age: champD?.birthYear ? h.year - champD.birthYear : null,
                nation: champD?.nation || null,
                team: champD ? teamName(champD.team) : null,
                teamRank: champTeamRank || null,
                wins: dSorted.find(x => x.id === h.championId)?.wins ?? null,
                hist: !!(champD?.histId)
            },
            teamChampion: { name: h.teamChampion, points: h.teamChampionPoints },
            top10: dSorted.slice(0, 10).map(s => {
                const d = dById.get(s.id);
                return {
                    name: s.name || d?.name || s.id,
                    pts: s.points || 0, wins: s.wins || 0, poles: s.poles || 0,
                    team: d ? teamName(d.team) : (s.teamName || null),
                    nation: d?.nation || null,
                    age: d?.birthYear ? h.year - d.birthYear : null,
                    hist: !!(d?.histId)
                };
            }),
            teams: tSorted.map((s, i) => {
                const nm = s.name || teamName(s.id) || s.id;
                return {
                    rank: i + 1, name: nm, pts: s.points || 0, wins: s.wins || 0,
                    ptsFinishes: ptsFinishByTeam[nm] || 0,
                    dnfs: dnfByTeam[nm] || 0
                };
            }),
            dnf: { starts, dnfs, rate: starts ? +(dnfs / starts * 100).toFixed(1) : null, fatals },
            grid: {
                drivers: drivers.filter(d => d.team).length,
                teams: teams.length,
                nations: drivers.filter(d => d.team).reduce((m, d) => {
                    const n = d.nation || '?'; m[n] = (m[n] || 0) + 1; return m;
                }, {})
            },
            transfers: transfers.filter(t => t.type !== 'dismissed')
                .map(t => ({ n: t.driverName, ty: t.type, from: t.fromTeam, to: t.toTeam })),
            dismissed: transfers.filter(t => t.type === 'dismissed').length,
            deaths: deaths.map(d => ({ n: d.name, age: d.birthYear ? h.year - d.birthYear : null })),
            retirements: retirements.map(r => ({
                n: r.name,
                age: r.age ?? (r.birthYear ? h.year - r.birthYear : null),
                reason: r.reason || r.type || null
            }))
        });
    }

    const blob = new Blob([JSON.stringify(out)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'megasim-qa.json';
    a.click();
    console.log(`✓ Paket-D-Export: ${out.seasons.length} Saisons, ${(blob.size / 1024).toFixed(0)} KB → megasim-qa.json`);
})();
