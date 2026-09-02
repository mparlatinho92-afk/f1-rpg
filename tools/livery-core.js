/**
 * livery-core.js – gemeinsamer Kern des Livery-Werkzeugs.
 *
 * Läuft in Node (Snapshot-Generator) UND im Browser (Live-Modus der Übersicht).
 * Eine Logik für beide Wege, damit nicht dasselbe zweimal existiert und
 * auseinanderläuft – siehe LIVERY_TOOL_PLAN.md, Abschnitt 8.
 *
 * Kernregel: Die Farbkaskade wird NICHT nachgebaut. getTeamColors() wird aus
 * index.html herausgeschnitten und ausgeführt. Fehlt ein Block, brechen wir ab.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.LiveryCore = factory();
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Diese Blöcke werden aus index.html geschnitten und im Werkzeug ausgeführt.
    const BLOCKS = [
        ['const TEAM_COLORS_EXTRA = {', '\n        };'],
        ['const TEAM_COLORS_RANGES = [', '\n        ];'],
        ['function unpackEnteredTeamId(', '\n        }'],
        ['function getTeamColors(', '\n        }'],
        ['function getTeamHeaderGradient(', '\n        }']
    ];

    function cutBlock(src, startMark, endMark) {
        const i = src.indexOf(startMark);
        if (i < 0) return null;
        const j = src.indexOf(endMark, i);
        if (j < 0) return null;
        return src.slice(i, j + endMark.length);
    }

    function fnv1a(str) {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
        }
        return h.toString(16).padStart(8, '0');
    }

    /**
     * Schneidet die Farb-Bausteine aus dem index.html-Quelltext und macht sie
     * aufrufbar. Wirft, wenn ein Block fehlt – lieber lauter Abbruch als ein
     * stiller Nachbau, der etwas anderes behauptet als das Spiel.
     */
    function extractGameColors(htmlSrc) {
        const parts = [];
        for (const [start, end] of BLOCKS) {
            const block = cutBlock(htmlSrc, start, end);
            if (!block) {
                throw new Error('Farb-Block nicht gefunden: "' + start.trim() +
                    '" – index.html hat sich strukturell geändert, Werkzeug anpassen.');
            }
            parts.push(block);
        }
        const body = parts.join('\n');
        const version = (/const VERSION\s*=\s*['"]([^'"]+)['"]/.exec(htmlSrc) || [])[1] || '?';

        // new Function statt vm/eval: funktioniert in Node und im Browser gleich.
        const make = new Function('SEASON_DATA', body +
            '\nreturn { getTeamColors, getTeamHeaderGradient, TEAM_COLORS_EXTRA, TEAM_COLORS_RANGES };');

        return function bind(SEASON_DATA) {
            const api = make(SEASON_DATA);
            api.version = version;
            api.hash = fnv1a(body);
            return api;
        };
    }

    // ---------------------------------------------------------------- Zellen

    const GREY = ['#888888', '#888'];
    const isGrey = c => !c || GREY.indexOf(String(c).toLowerCase()) >= 0;

    function normId(x) {
        return String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    /**
     * Baut aus SEASON_DATA + der echten Farbkaskade das Zellenraster:
     * ein Eintrag je Team × Jahr, mit dem Wert, den das Spiel HEUTE liefert.
     */
    function buildCells(opts) {
        const SD = opts.SEASON_DATA;
        const game = opts.game;                       // Rückgabe von extractGameColors(...)(SD)
        const indy = (opts.indyConstructors || []).slice();
        const indySet = new Set(indy.map(normId));
        const isIndy = x => indySet.has(normId(x));

        const cells = {};
        const teams = {};
        const years = Object.keys(SD).map(Number).sort((a, b) => a - b);

        for (const year of years) {
            for (const t of (SD[String(year)].t || [])) {
                const id = t[0], name = t[1], sdColor = t[2] || null;
                // Indy-Konstrukteure treffen über den NAMEN, nie über die Kurz-ID.
                const indyFlag = isIndy(id) || isIndy(name);

                const colors = game.getTeamColors(id, year, null) || [];
                let source = 'none';
                const extra = game.TEAM_COLORS_EXTRA[String(year)];
                if (extra && extra[id]) source = 'extra';
                else if (game.TEAM_COLORS_RANGES.some(r => r[2] === id && year >= r[0] && year <= r[1])) source = 'range';
                else if (!isGrey(colors[0])) source = 'sd';

                const key = id + ':' + year;
                cells[key] = {
                    team: id, year: year, name: name,
                    colors: source === 'none' ? [] : colors.slice(),
                    source: source,
                    sdColor: isGrey(sdColor) ? null : sdColor,
                    indy: indyFlag
                };
                if (!teams[id]) teams[id] = { id: id, name: name, years: [], indy: indyFlag };
                teams[id].years.push(year);
                teams[id].name = name;   // letzter bekannter Anzeigename gewinnt
            }
        }
        return { cells: cells, teams: teams, years: years };
    }

    /**
     * Befunde, die allein aus dem Spielstand ableitbar sind (ohne Werkstattdaten).
     * `einheitsfarbe`: Team fährt ≥3 Saisons und trägt über alle denselben Wert,
     * gezogen aus SEASON_DATA – das ist keine Lücke, sondern eine fehlende
     * Ära-Struktur (March 14× orange). Muss anders aussehen als grau.
     */
    function gameFindings(built, minSeasons) {
        const min = minSeasons || 3;
        const out = { luecke: [], einheitsfarbe: [] };
        for (const id of Object.keys(built.teams)) {
            const team = built.teams[id];
            if (team.indy) continue;
            const rows = team.years.map(y => built.cells[id + ':' + y]);
            const missing = rows.filter(r => r.source === 'none');
            if (missing.length) out.luecke.push({ team: id, name: team.name, years: missing.map(r => r.year) });

            if (rows.length >= min && !missing.length) {
                const vals = new Set(rows.map(r => r.colors.join(',')));
                const srcs = new Set(rows.map(r => r.source));
                if (vals.size === 1 && srcs.size === 1 && srcs.has('sd')) {
                    out.einheitsfarbe.push({
                        team: id, name: team.name, seasons: rows.length,
                        value: rows[0].colors.slice(), from: team.years[0],
                        to: team.years[team.years.length - 1]
                    });
                }
            }
        }
        out.einheitsfarbe.sort((a, b) => b.seasons - a.seasons);
        out.luecke.sort((a, b) => b.years.length - a.years.length);
        return out;
    }

    // ------------------------------------------------------------- Farbworte

    const COLOR_WORDS = {
        'weiss': '#FFFFFF', 'weiß': '#FFFFFF', 'white': '#FFFFFF',
        'schwarz': '#111111', 'black': '#111111',
        'rot': '#CC0000', 'dunkelrot': '#8B0000', 'weinrot': '#7B1F2B', 'bordeaux': '#6D1F2E',
        'blau': '#0033CC', 'dunkelblau': '#00008B', 'hellblau': '#87CEEB', 'navy': '#012169',
        'gruen': '#1B7A2E', 'grün': '#1B7A2E', 'dunkelgruen': '#0B3D1E', 'dunkelgrün': '#0B3D1E',
        'hellgruen': '#4CAF50', 'hellgrün': '#4CAF50',
        'british racing green': '#004225', 'brg': '#004225',
        'gelb': '#FFD100', 'dunkelgelb': '#DFAC1A', 'gold': '#D4A017',
        'orange': '#FF6600', 'papaya': '#FF8000',
        'silber': '#C0C0C0', 'grau': '#9AA0A6', 'anthrazit': '#3A3F44',
        'rosa': '#FF69B4', 'pink': '#F596C8', 'lila': '#6B3FA0', 'violett': '#6B3FA0',
        'tuerkis': '#00C5B0', 'türkis': '#00C5B0', 'braun': '#6B4423', 'beige': '#E8DCC4'
    };

    const isHex = s => /^#?[0-9a-f]{6}$/i.test(String(s || '').trim()) || /^#?[0-9a-f]{3}$/i.test(String(s || '').trim());
    const toHex = s => {
        let v = String(s).trim().replace(/^#/, '');
        if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
        return '#' + v.toUpperCase();
    };

    /**
     * "blau-blau-weiß" → ["#0033CC","#0033CC","#FFFFFF"] (⅔ blau + ⅓ weiß).
     * Unbekannte Wörter werden NICHT geraten: colors bleibt null, der Rohtext
     * bleibt stehen und der Kandidat gilt als ungeklärt.
     */
    function parseColorInput(input) {
        const raw = String(input == null ? '' : input).trim();
        if (!raw) return { raw: raw, colors: null, unresolved: [] };

        // Auch ein Array-Element kann eine Wortkette sein ("colors": ["rot-weiss"]) –
        // das kommt so aus den Chats. Bekanntes bleibt am Stück, alles andere wird zerlegt.
        const SPLIT = /[-,/]|\s+\+\s+/;
        const parts = [];
        for (const chunk of (Array.isArray(input) ? input.map(String) : [raw])) {
            const key = chunk.trim().toLowerCase();
            if (isHex(chunk) || COLOR_WORDS[key]) parts.push(chunk);
            else parts.push.apply(parts, chunk.split(SPLIT));
        }
        const colors = [], unresolved = [];

        for (let part of parts) {
            part = part.trim();
            if (!part) continue;
            if (isHex(part)) { colors.push(toHex(part)); continue; }
            const key = part.toLowerCase();
            if (COLOR_WORDS[key]) { colors.push(COLOR_WORDS[key]); continue; }
            unresolved.push(part);
        }
        // Ein zusammengesetzter Begriff wie "British Racing Green" überlebt das
        // Zerlegen an Leerzeichen nicht – deshalb vorher als Ganzes prüfen.
        if (unresolved.length && COLOR_WORDS[raw.toLowerCase()]) {
            return { raw: raw, colors: [COLOR_WORDS[raw.toLowerCase()]], unresolved: [] };
        }
        if (unresolved.length || !colors.length) return { raw: raw, colors: null, unresolved: unresolved };
        return { raw: raw, colors: colors.slice(0, 3), unresolved: [] };
    }

    // --------------------------------------------------------------- Faltung

    /**
     * Zellen → Ranges für liveries-todo.json.
     * Jahre ohne Team-Eintrag brechen die Spanne nicht (hält die Liste kurz und
     * ist folgenlos, weil getTeamColors nur bei einem Treffer liest).
     */
    function foldToRanges(picked, built) {
        const byTeam = {};
        for (const key of Object.keys(picked)) {
            const p = picked[key];
            if (!p || !p.colors || !p.colors.length) continue;
            const [team, year] = key.split(':');
            (byTeam[team] = byTeam[team] || []).push({ year: +year, colors: p.colors, comment: p.comment || '' });
        }

        const out = [];
        for (const team of Object.keys(byTeam)) {
            const rows = byTeam[team].sort((a, b) => a.year - b.year);
            let run = null;
            const flush = () => { if (run) out.push(run); run = null; };
            for (const row of rows) {
                const sig = row.colors.join(',');
                if (run && run._sig === sig) { run.to = row.year; continue; }
                flush();
                run = { team: team, from: row.year, to: row.year, colors: row.colors.slice(), comment: row.comment, done: false, _sig: sig };
            }
            flush();
        }

        // Was exakt so schon im Spiel steht, muss nicht noch einmal eingebaut werden.
        return out.filter(r => {
            for (let y = r.from; y <= r.to; y++) {
                const cell = built && built.cells[r.team + ':' + y];
                if (!cell) continue;
                if (cell.colors.join(',').toUpperCase() !== r._sig.toUpperCase()) return true;
            }
            return false;
        }).map(r => { delete r._sig; return r; });
    }

    // ---------------------------------------------------------------- Import

    /** Löst "SAU" oder "Sauber" gegen das Zellenraster auf. */
    function resolveTeam(input, built) {
        const want = String(input || '').trim();
        if (!want) return null;
        if (built.teams[want]) return want;
        const upper = want.toUpperCase();
        if (built.teams[upper]) return upper;
        const flat = normId(want);
        for (const id of Object.keys(built.teams)) {
            if (normId(id) === flat || normId(built.teams[id].name) === flat) return id;
        }
        for (const id of Object.keys(built.teams)) {
            if (normId(built.teams[id].name).indexOf(flat) === 0) return id;
        }
        return null;
    }

    /**
     * Import-JSON (schema f1rpg-livery/1) → flache Kandidatenliste je Zelle.
     * `trusted` kommt aus der einmaligen Rückfrage "Stapel als mitgeprüft
     * übernehmen?" – nie aus der Datei selbst.
     */
    function normalizeImport(doc, built, trusted) {
        const res = { entries: [], skipped: [], source: (doc && doc.source) || {} };
        const list = (doc && doc.entries) || [];
        for (const e of list) {
            const team = resolveTeam(e.team, built);
            if (!team) { res.skipped.push({ entry: e, why: 'Team nicht auflösbar: ' + e.team }); continue; }

            const from = Number(e.from != null ? e.from : e.year);
            const to = Number(e.to != null ? e.to : (e.year != null ? e.year : e.from));
            if (!from || !to || to < from) { res.skipped.push({ entry: e, why: 'Jahr fehlt oder ist unplausibel' }); continue; }

            const parsed = parseColorInput(e.colors != null ? e.colors : e.color);
            const kind = (e.kind === 'note' || (!parsed.colors && !parsed.unresolved.length)) ? 'note' : 'colors';

            for (let y = from; y <= to; y++) {
                if (!built.cells[team + ':' + y]) continue;   // Team fuhr dieses Jahr nicht
                res.entries.push({
                    key: team + ':' + y, team: team, year: y,
                    kind: kind,
                    colors: parsed.colors,
                    raw: parsed.raw,
                    unresolved: parsed.unresolved,
                    stage: trusted && parsed.colors ? 'bestaetigt' : (parsed.colors ? 'vorschlag' : 'idee'),
                    note: e.comment || e.note || '',
                    spanFrom: from, spanTo: to
                });
            }
        }
        return res;
    }

    // ------------------------------------------------------------- Luminanz

    /** Wie renderTeamNameColored: entscheidet, ob die Schrift einen Rand braucht. */
    function luminance(hex) {
        const v = String(hex || '').replace('#', '');
        if (v.length !== 6) return 0.5;
        const r = parseInt(v.slice(0, 2), 16) / 255;
        const g = parseInt(v.slice(2, 4), 16) / 255;
        const b = parseInt(v.slice(4, 6), 16) / 255;
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    return {
        extractGameColors: extractGameColors,
        buildCells: buildCells,
        gameFindings: gameFindings,
        parseColorInput: parseColorInput,
        foldToRanges: foldToRanges,
        resolveTeam: resolveTeam,
        normalizeImport: normalizeImport,
        luminance: luminance,
        fnv1a: fnv1a,
        COLOR_WORDS: COLOR_WORDS
    };
}));
