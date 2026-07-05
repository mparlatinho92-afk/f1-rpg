// ============================================================================
// FABLE PAKET B — Erzählter Saison-Rückblick (Phrasen-Bank + Assembler)
// ============================================================================
// KEIN Runtime-LLM: Dieses Modul ist eine statische Phrasen-Bank plus eine
// deterministische Assembler-Funktion. Das Spiel setzt daraus zur Laufzeit
// rein regelbasiert einen deutschen Absatz (3–6 Sätze) zusammen.
//
// Integration (macht die Opus-Session, siehe paketB-recap-spec.md):
//   const text = seasonRecapText(champion, teamChampion,
//       GAME_STATE.driverStandings, GAME_STATE.teamStandings,
//       GAME_STATE.seasonDeaths, GAME_STATE.currentYear,
//       { raceCount: GAME_STATE.races.length, drivers: GAME_STATE.drivers });
//   → neuer Card-Block in showSeasonEndModal() NACH der Konstrukteurs-Card.
//
// Determinismus: Der Zufall wird aus (Jahr, Champion-Name, Punkte, Siege)
// geseedet → derselbe Saisonstand ergibt immer denselben Text (Re-Render-fest),
// unterschiedliche Saisons klingen unterschiedlich.
//
// Fakten-Leitplanke: Jeder Satz stützt sich NUR auf State-Werte (Punkte, Siege,
// Vorsprung, Poles, Team-Rang, Todesfälle) + neutrale Ära-Färbung. Keine
// erfundenen Behauptungen über reale Personen (keine "erster Titel"-Claims,
// keine Unfallursachen, keine Charakterzuschreibungen).
// ============================================================================

// ---------------------------------------------------------------------------
// Ära-Register: Tokens mit FESTER grammatischer Rolle (Kasus-sicher).
//   klasseNom  → nur als Satz-Subjekt verwenden
//   klasseGen  → nur als Genitiv-Attribut ("Weltmeister {klasseGen}")
//   klasseIn   → fertige Präpositionalphrase ("… {klasseIn} …")
//   presseNom  → Singular, feminin, nur als Subjekt
//   publikum   → Singular-Kollektiv, nur als Subjekt
//   fahrerPl   → Plural-Nomen ("{n} {fahrerPl}")
// ---------------------------------------------------------------------------
const RECAP_ERA_WORDS = [
    { from: 1950, to: 1961,
      klasseNom: 'der Grand-Prix-Sport', klasseGen: 'des Grand-Prix-Sports',
      klasseIn: 'im Grand-Prix-Sport', fahrerPl: 'Piloten',
      presseNom: 'die Fachpresse', publikum: 'das Publikum an den Strecken' },
    { from: 1962, to: 1975,
      klasseNom: 'die Formel 1', klasseGen: 'der Formel 1',
      klasseIn: 'in der Formel 1', fahrerPl: 'Fahrer',
      presseNom: 'die Fachpresse', publikum: 'das Publikum' },
    { from: 1976, to: 1993,
      klasseNom: 'die Königsklasse', klasseGen: 'der Königsklasse',
      klasseIn: 'in der Königsklasse', fahrerPl: 'Fahrer',
      presseNom: 'die Presse', publikum: 'die Fangemeinde' },
    { from: 1994, to: 2009,
      klasseNom: 'die Formel 1', klasseGen: 'der Formel 1',
      klasseIn: 'in der Königsklasse', fahrerPl: 'Fahrer',
      presseNom: 'die Presse', publikum: 'das Millionenpublikum am Bildschirm' },
    { from: 2010, to: 9999,
      klasseNom: 'die Formel 1', klasseGen: 'der Formel 1',
      klasseIn: 'in der Motorsport-Königsklasse', fahrerPl: 'Fahrer',
      presseNom: 'die Fachwelt', publikum: 'die weltweite Fangemeinde' }
];

// ---------------------------------------------------------------------------
// Phrasen-Bank. Platzhalter {token} werden vom Assembler gefüllt.
// Zahl-Tokens sind fertige Nominalphrasen in festem Kasus:
//   {siegeNom}/{siegeDat}, {gapNom}/{gapDat}, {maxWinnerSiegeNom} — nie nackte
//   Zahlen mit angehängtem "Sieg(e)" in den Templates selbst bilden!
// ---------------------------------------------------------------------------
const RECAP_BANK = {

    // Satz 1 — Eröffnung, nach Titelkampf-Kategorie
    opener: {
        dominant: [
            '{champion} ließ {year} keinen Zweifel aufkommen: Mit {siegeDat} und {points} Punkten beherrschte er die Saison nach Belieben.',
            'Die Saison {year} trug eine einzige Handschrift – die von {champion}, der dem Jahr {klasseIn} mit {siegeDat} seinen Stempel aufdrückte.',
            'Selten war ein Titel so ungefährdet: {champion} fuhr {year} in einer eigenen Liga und krönte sich mit {points} Punkten zum Weltmeister.',
            '{year} gab es an {champion} kein Vorbeikommen: {siegeNom}, {points} Punkte – die Konkurrenz fuhr hinterher.',
            'Was {champion} {year} zeigte, war Dominanz in Reinform: {siegeNom}, {points} Punkte, keine offenen Fragen.'
        ],
        knapp: [
            'Einen engeren Ausgang hätte sich {klasseNom} kaum ausdenken können: Am Ende der Saison {year} betrug der Abstand zwischen {champion} und {vize} gerade einmal {gapAkk}.',
            'Die Saison {year} wurde zum Nervenspiel – erst ganz am Ende sicherte sich {champion} den Titel, mit {gapDat} Vorsprung vor {vize}.',
            'Bis zuletzt blieb der Titelkampf {year} offen, dann hatte {champion} das bessere Ende für sich: {gapNom} Vorsprung auf {vize} – mehr nicht.',
            '{year} lieferten sich {champion} und {vize} ein Duell auf Augenhöhe, das {champion} um {gapAkk} für sich entschied.',
            'Am Ende entschieden Nuancen: {champion} rettete {year} einen Vorsprung von {gapDat} auf {vize} ins Ziel und ist Weltmeister.'
        ],
        normal: [
            '{champion} sicherte sich {year} mit {points} Punkten und {siegeDat} den Fahrertitel.',
            'Die Weltmeisterschaft des Jahres {year} ging an {champion}, der sich mit {siegeDat} und konstanten Resultaten durchsetzte.',
            'Am Ende einer intensiven Saison {year} stand {champion} als verdienter Champion fest – {points} Punkte, {siegeNom}.',
            '{champion} hieß der Mann, an dem {year} kein Weg vorbeiführte: Der Titel ging mit {siegeDat} an ihn.',
            'Mit {siegeDat} und {points} Punkten kürte sich {champion} {year} zum Weltmeister {klasseGen}.'
        ]
    },

    // Satz 2 — Duell/Vize, nach Titelkampf-Kategorie (entfällt ohne Vize)
    duell: {
        dominant: [
            'Dahinter blieb {vize} als bester Verfolger chancenlos – der Rückstand von {gapDat} spricht eine deutliche Sprache.',
            '{vize} wurde Vize-Weltmeister, doch die Lücke von {gapDat} ließ nie echte Spannung aufkommen.',
            'Die Vize-Weltmeisterschaft ging an {vize}, der dem Dominator über weite Strecken nur hinterherfahren konnte.',
            'Bester der Geschlagenen: {vize}, der mit {vizePoints} Punkten immerhin den Rest des Feldes hinter sich hielt.'
        ],
        knapp: [
            'Für {vize} bleibt die bittere Rolle des geschlagenen Helden – kaum je war ein Vize-Weltmeister so nah dran.',
            '{vize} verlor den Titel nicht durch Schwäche, sondern um Haaresbreite – ein Jahrgang, der beiden zur Ehre gereicht.',
            'So kurz vor dem Ziel gescheitert: {vize} wird den Winter mit der Frage verbringen, wo die entscheidenden Punkte liegen blieben.',
            'Auf der anderen Seite stand {vize}, der mit {vizePoints} Punkten alles gegeben hatte – und dem am Ende fast nichts fehlte.'
        ],
        normal: [
            'Rang zwei ging an {vize}, der mit {vizePoints} Punkten der beständigste Herausforderer war.',
            'Als Vize-Weltmeister behauptete sich {vize}, ohne den Champion je ernsthaft in Bedrängnis zu bringen.',
            '{vize} komplettierte als Zweiter das Spitzenduo, {gapAkk} hinter dem Champion.',
            'Dahinter reihte sich {vize} als Vize-Weltmeister ein – respektabel, aber ohne echten Zugriff auf die Krone.'
        ]
    },

    // Satz 3 (optional, max. einer) — Sonderbedingungen
    special: {
        rookie: [
            'Dass ausgerechnet ein Mann in seinem ersten Jahr die etablierte Garde düpierte, machte den Titel umso bemerkenswerter – ein Durchbruch, wie ihn {klasseNom} nur selten erlebt.',
            'Es war der Durchbruch eines Neulings: In seiner ersten Saison ließ {champion} sämtlichen Routiniers das Nachsehen.',
            'Ein Rookie als Weltmeister – {champion} verwandelte sein Debütjahr in einen Triumphzug.'
        ],
        underdog: [
            'Die eigentliche Sensation lieferte das Material: {champTeam} beendete die Konstrukteurswertung nur auf Rang {champTeamRank} – den Fahrertitel holte {champion} trotzdem.',
            'Dass der Titel ausgerechnet in ein Team der zweiten Reihe wanderte – {champTeam}, nur Rang {champTeamRank} bei den Konstrukteuren –, gab der Saison ihre eigene Note.',
            '{champion} schlug mit unterlegenem Gerät zu: Sein Team {champTeam} kam in der Konstrukteurswertung nicht über Rang {champTeamRank} hinaus.'
        ],
        mostWinsLost: [
            'Kurios: Die meisten Saisonsiege feierte mit {maxWinner} ein anderer ({maxWinnerSiegeNom}) – am Ende zählte die Konstanz von {champion}.',
            'Der siegreichste Mann des Jahres hieß {maxWinner} ({maxWinnerSiegeNom}), doch die Krone trug am Ende der beständigere {champion}.',
            '{maxWinner} gewann mehr Rennen als jeder andere – Weltmeister aber wurde {champion}: ein Sieg der Regelmäßigkeit über den Glanz.'
        ],
        poleKing: [
            'Auch samstags war {champion} das Maß aller Dinge: {poles} Pole-Positions unterstreichen die Vormachtstellung.',
            'Dazu kam rohe Geschwindigkeit: {poles} Pole-Positions machten {champion} auch zum König des Qualifyings.',
            'Im Qualifying regierte {champion} mit {poles} Pole-Positions fast nach Belieben.'
        ]
    },

    // Satz 4 — Konstrukteurswertung
    team: {
        double: [
            'Perfekt wurde das Jahr durch die Doppelkrone: {teamChampionName} sicherte sich auch die Konstrukteurswertung – Fahrer- und Teamtitel unter einem Dach.',
            'Auch bei den Konstrukteuren führte kein Weg an {teamChampionName} vorbei – das Team des Champions machte den Doppelerfolg perfekt.',
            'Der Arbeitgeber des Weltmeisters feierte gleich mit: {teamChampionName} gewann auch die Teamwertung – die Doppelkrone {klasseGen}.'
        ],
        separate: [
            'Bei den Konstrukteuren hatte derweil {teamChampionName} mit {teamChampionPoints} Punkten die Nase vorn.',
            'Die Teamwertung ging getrennte Wege: Dort setzte sich {teamChampionName} durch.',
            'Der Konstrukteurstitel landete bei {teamChampionName} – dieser Triumph blieb dem Team des Champions verwehrt.'
        ]
    },

    // Satz 5 (optional) — Todesfälle (nur State-Fakten, keine Ursachen erfinden)
    tragik: {
        one: [
            'Überschattet wurde das Jahr vom Tod von {deadName} ({deadTeam}), der beim {deadRace} ums Leben kam – {klasseNom} verneigte sich vor einem der Ihren.',
            'Doch die Saison hatte auch ihre dunkle Seite: Beim {deadRace} verlor {deadName} sein Leben – eine Lücke, die kein Ergebnis schließt.',
            'Aller sportliche Glanz verblasst neben dem Verlust von {deadName}, der beim {deadRace} tödlich verunglückte.'
        ],
        many: [
            'Es war zugleich ein schwarzes Jahr: {deadList} bezahlten ihren Sport mit dem Leben – {deadCount} Todesfälle, die schwer auf dieser Saison lasten.',
            'Doch der Preis war hoch: Mit {deadList} verlor {klasseNom} in diesem Jahr {deadCount} {fahrerPl}.',
            'Über allem liegt Trauer: {deadList} kehrten von ihren Einsätzen nicht zurück.'
        ]
    },

    // Schlusssatz (optional, nur wenn Satzbudget frei)
    closer: {
        normal: [
            'So endete ein Jahr, über das {presseNom} noch lange schreiben sollte.',
            'Es war eine Saison, die {publikum} so schnell nicht vergessen wird.',
            'Und so blickt {klasseNom} auf einen Jahrgang zurück, der Lust auf mehr macht.',
            'Der Vorhang fiel – und ließ ein Jahr zurück, das seinen Platz in den Annalen sicher hat.'
        ],
        tragic: [
            'Zwischen Triumph und Trauer bleibt {year} ein Jahr, das niemand {klasseIn} so schnell vergisst.',
            'So bleibt ein Jahrgang in Erinnerung, in dem Erfolg und Verlust so nah beieinanderlagen wie selten.',
            'Gefeiert wurde am Ende leise – zu präsent war, was diese Saison gekostet hatte.'
        ]
    }
};

// ---------------------------------------------------------------------------
// Helfer (präfix _recap*, kollisionsfrei zum Monolithen)
// ---------------------------------------------------------------------------
function _recapHash(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
}

function _recapRng(seed) {
    return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function _recapPick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

function _recapNum(n) {
    return (typeof n === 'number' && isFinite(n)) ? n.toLocaleString('de-DE') : '0';
}

// Fertige Nominalphrasen für Zahlwerte (Kasus-sicher, inkl. 0/1-Sonderfälle)
function _recapSiege(n, dativ) {
    if (n === 0) return dativ ? 'keinem einzigen Sieg' : 'kein einziger Sieg';
    if (n === 1) return dativ ? 'einem Sieg' : 'ein Sieg';
    return dativ ? `${n} Siegen` : `${n} Siege`;
}
// kasus: 'nom' | 'dat' | 'akk' — Templates nutzen {gapNom}/{gapDat}/{gapAkk}
function _recapGap(g, kasus) {
    if (g === 1) {
        return kasus === 'dat' ? 'einem einzigen Punkt'
             : kasus === 'akk' ? 'einen einzigen Punkt' : 'ein einziger Punkt';
    }
    return kasus === 'dat' ? `${_recapNum(g)} Punkten` : `${_recapNum(g)} Punkte`;
}

function _recapFill(tpl, tokens) {
    return tpl.replace(/\{(\w+)\}/g, (m, k) => (tokens[k] !== undefined ? tokens[k] : m));
}

// Namensliste "A, B und C" (max. 3 Namen, danach "und N weitere")
function _recapNameList(names) {
    const shown = names.slice(0, 3);
    const rest = names.length - shown.length;
    let out = shown.length > 1
        ? shown.slice(0, -1).join(', ') + ' und ' + shown[shown.length - 1]
        : (shown[0] || '');
    if (rest === 1) out = shown.join(', ') + ' und ein weiterer';
    else if (rest > 1) out = shown.join(', ') + ` und ${rest} weitere`;
    return out;
}

// ---------------------------------------------------------------------------
// Assembler — gibt fertigen deutschen Absatz (3–6 Sätze) zurück.
//
//   champion       { id, name, points, wins, poles, team, ... }  (Standings-Eintrag)
//   teamChampion   { id, name, points, ... }
//   driverStandings GAME_STATE.driverStandings (Objekt id→Eintrag)
//   teamStandings  GAME_STATE.teamStandings   (Objekt id→Eintrag)
//   deaths         GAME_STATE.seasonDeaths     (Array, darf leer/undefined sein)
//   year           GAME_STATE.currentYear
//   extra          optional: { raceCount, isRookieChampion }
//                  raceCount = GAME_STATE.races.length (schärft Dominanz/Pole-Checks)
//                  isRookieChampion = von Opus berechnet (siehe Spec §4) — Rookie-
//                  Erkennung bewusst NICHT hier, da careerScores bei geseedeten
//                  historischen Fahrern leer sein kann (falsche Rookies!).
// ---------------------------------------------------------------------------
function seasonRecapText(champion, teamChampion, driverStandings, teamStandings, deaths, year, extra) {
    if (!champion || !champion.name) return '';
    extra = extra || {};
    deaths = Array.isArray(deaths) ? deaths : [];
    const raceCount = extra.raceCount || 0;

    // --- abgeleitete Fakten (alles rein aus State) ---
    const sorted = Object.entries(driverStandings || {})
        .map(([id, s]) => ({ id, ...s }))
        .sort((a, b) => (b.points || 0) - (a.points || 0));
    const vize = (sorted.length > 1 && sorted[1].points > 0) ? sorted[1] : null;
    const gap = vize ? Math.round(((champion.points || 0) - vize.points) * 10) / 10 : 0;

    // Punkte für einen Sieg je Ära (Heuristik für "knapp"/"dominant")
    const winPts = year < 1961 ? 8 : year < 1991 ? 9 : year < 2010 ? 10 : 25;

    let cat = 'normal';
    if (vize && gap <= winPts) cat = 'knapp';
    else if ((raceCount > 0 && (champion.wins || 0) >= Math.ceil(raceCount * 0.5)) || gap >= 3 * winPts) cat = 'dominant';

    // Team-Rang des Champions in der Konstrukteurswertung
    const teamsSorted = Object.entries(teamStandings || {})
        .map(([id, s]) => ({ id, ...s }))
        .sort((a, b) => (b.points || 0) - (a.points || 0));
    const champTeamIdx = teamsSorted.findIndex(t => t.id === champion.team);
    const champTeamRank = champTeamIdx >= 0 ? champTeamIdx + 1 : 0;
    const champTeamName = champTeamIdx >= 0 ? teamsSorted[champTeamIdx].name : '';
    const isDouble = !!(teamChampion && champion.team && teamChampion.id === champion.team);

    // Sieg-Maximum eines anderen Fahrers
    let maxWinner = null;
    sorted.forEach(d => {
        if (d.id !== champion.id && (d.wins || 0) > (champion.wins || 0) &&
            (!maxWinner || d.wins > maxWinner.wins)) maxWinner = d;
    });

    // Pole-Dominanz: mind. halbe Saison (bzw. ≥6 ohne raceCount-Info)
    const poleKing = (champion.poles || 0) >= (raceCount > 0 ? Math.ceil(raceCount * 0.5) : 6);

    // --- deterministischer Zufall (Re-Render-stabil) ---
    const rng = _recapRng(_recapHash(`${year}|${champion.name}|${champion.points}|${champion.wins}`));

    // --- Tokens ---
    const era = RECAP_ERA_WORDS.find(e => year >= e.from && year <= e.to) || RECAP_ERA_WORDS[RECAP_ERA_WORDS.length - 1];
    const T = {
        year: String(year),
        champion: champion.name,
        points: _recapNum(champion.points || 0),
        siegeNom: _recapSiege(champion.wins || 0, false),
        siegeDat: _recapSiege(champion.wins || 0, true),
        poles: String(champion.poles || 0),
        vize: vize ? vize.name : '',
        vizePoints: vize ? _recapNum(vize.points) : '0',
        gapNom: _recapGap(gap, 'nom'),
        gapDat: _recapGap(gap, 'dat'),
        gapAkk: _recapGap(gap, 'akk'),
        teamChampionName: teamChampion ? teamChampion.name : '',
        teamChampionPoints: teamChampion ? _recapNum(teamChampion.points || 0) : '0',
        champTeam: champTeamName,
        champTeamRank: String(champTeamRank),
        maxWinner: maxWinner ? maxWinner.name : '',
        maxWinnerSiegeNom: maxWinner ? _recapSiege(maxWinner.wins, false) : '',
        deadName: deaths[0] ? deaths[0].name : '',
        deadTeam: deaths[0] ? (deaths[0].team || '?') : '',
        deadRace: deaths[0] ? (deaths[0].raceName || 'Rennwochenende') : '',
        deadList: _recapNameList(deaths.map(d => d.name)),
        deadCount: String(deaths.length),
        klasseNom: era.klasseNom, klasseGen: era.klasseGen, klasseIn: era.klasseIn,
        fahrerPl: era.fahrerPl, presseNom: era.presseNom, publikum: era.publikum
    };

    // --- Satz-Assembly (3–6 Sätze) ---
    const s = [];
    s.push(_recapFill(_recapPick(rng, RECAP_BANK.opener[cat]), T));
    if (vize) s.push(_recapFill(_recapPick(rng, RECAP_BANK.duell[cat]), T));

    // Sonderbedingung: max. EINE, Priorität Rookie > Underdog > Sieg-Kurioseum > Pole-König
    let special = null;
    if (extra.isRookieChampion === true) special = 'rookie';
    else if (!isDouble && champTeamRank >= 4) special = 'underdog';
    else if (maxWinner) special = 'mostWinsLost';
    else if (poleKing && cat !== 'dominant') special = 'poleKing';
    if (special) s.push(_recapFill(_recapPick(rng, RECAP_BANK.special[special]), T));

    if (teamChampion && teamChampion.name) {
        s.push(_recapFill(_recapPick(rng, RECAP_BANK.team[isDouble ? 'double' : 'separate']), T));
    }

    if (deaths.length > 0) {
        s.push(_recapFill(_recapPick(rng, RECAP_BANK.tragik[deaths.length === 1 ? 'one' : 'many']), T));
    }

    if (s.length < 6) {
        s.push(_recapFill(_recapPick(rng, RECAP_BANK.closer[deaths.length > 0 ? 'tragic' : 'normal']), T));
    }

    return s.join(' ');
}

// Node-Testbarkeit (im Browser-Monolith wirkungslos)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { seasonRecapText, RECAP_BANK, RECAP_ERA_WORDS };
}
