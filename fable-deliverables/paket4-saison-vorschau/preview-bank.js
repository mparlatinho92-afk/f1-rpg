// ============================================================================
// Paket 4 — Erzählte Saison-Vorschau (Fable-Deliverable, 2026-07-10)
// ============================================================================
// Inline-fähig (Grundregel 4): direkt in index.html einbetten, KEIN data/*.js.
// Spiegelbild zu Paket B: Ära-Register über TOKENS (wie RECAP_BANK), nicht über
// getrennte e50/e10-Pools — SPEC §6 verlangt explizit die Wiederverwendung der
// Paket-B-Wortlisten (RECAP_ERA_WORDS) plus vorschau-spezifische Ergänzungen.
//
// HEDGING-LEITPLANKE (SPEC §4, in JEDER Zeile eingehalten): Die Vorschau läuft
// VOR dem ersten Rennen. Alles spekulativ („gilt als", „dürfte", „Papierform",
// „wenn die Vorzeichen nicht täuschen") — NIE Ergebnis-Behauptungen. Der
// Verteidiger-Slot behauptet keine Favoritenrolle (das ist der Favorit-Slot:
// Titelverteidiger ≠ zwingend Favorit!).
//
// Slots (Opus liefert, alles aus State VOR der Saison):
//   {champion}      Name des Titelverteidigers (Vorsaison-P1)
//   {favorit}       Name Favorit 1 (reputation × team.speed)
//   {favoritTeam}   Teamname Favorit 1
//   {favorit2}      Name Favorit 2 (optional → duo-Pool)
//   {rookieList}    fertige Liste via _recapNameList („A, B und C"). ACHTUNG:
//                   der Helfer liefert „… und ein weiterer" im NOMINATIV —
//                   {rookieList} deshalb NUR nominativisch verwenden, nie
//                   hinter Präpositionen („mit {rookieList}" ✗)
//   {wechselName}   markanter Teamwechsel: Fahrer
//   {wechselTeam}   markanter Teamwechsel: NEUES Team
//   {year}          Saisonjahr
//   + Paket-B-Tokens: {klasseNom/Gen/In} {fahrerPl} {presseNom} {publikum}
//   + NEU (PREVIEW_ERA_WORDS): {auftakt} {neulingSg} {neulingPl}
//
// Grammatik-Rollen der neuen Tokens (Grundregel 5):
//   {auftakt}   Präpositionalphrase, satz-initial oder mittig verwendbar
//               (KEIN Nebensatz!). Nur im closer-Pool eingesetzt, damit die
//               Phrase nie doppelt im selben Absatz auftaucht.
//   {neulingSg} maskulines Nomen ohne Artikel („Neuling"/„Rookie") — Templates
//               setzen Artikel/Kasus selbst („ein {neulingSg}", „den {neulingSg}").
//   {neulingPl} Plural-Nomen ohne Artikel.
// ============================================================================

// Vorschau-spezifische Ära-Wörter — Ergänzung zu RECAP_ERA_WORDS (SPEC §6).
// Bänder identisch: 1950/1962/1976/1994/2010.
const PREVIEW_ERA_WORDS = [
    { from: 1950, to: 1961,
      auftakt: 'vor der ersten Startaufstellung des Jahres',
      neulingSg: 'Neuling', neulingPl: 'Neulinge' },
    { from: 1962, to: 1975,
      auftakt: 'zum Auftakt der neuen Saison',
      neulingSg: 'Neuling', neulingPl: 'Neulinge' },
    { from: 1976, to: 1993,
      auftakt: 'vor dem ersten Startschuss des Jahres',
      neulingSg: 'Neuling', neulingPl: 'Neulinge' },
    { from: 1994, to: 2009,
      auftakt: 'zum Saisonauftakt',
      neulingSg: 'Rookie', neulingPl: 'Rookies' },
    { from: 2010, to: 9999,
      auftakt: 'vor dem ersten Lights-out des Jahres',
      neulingSg: 'Rookie', neulingPl: 'Rookies' }
];

const PREVIEW_BANK = {

    // Satz 1 — Titelverteidiger (behauptet NIE die Favoritenrolle)
    verteidiger: [
        '{champion} geht als Titelverteidiger in die Saison {year} – und als Gejagter des gesamten Feldes.',
        'alle Augen richten sich auf {champion}: Der Champion führt das Feld als Titelverteidiger ins neue Jahr.',
        'die Krone {klasseGen} liegt bei {champion} – nun beginnt die Verteidigung.',
        '{champion} übernimmt die Rolle des Gejagten – Titelverteidigung gilt als die schwerste aller Übungen.',
        'der Maßstab heißt auch {year} zunächst {champion} – bis das Feld das Gegenteil beweist.',
        'mit dem Titel im Rücken startet {champion} ins neue Jahr – wohl wissend, dass nun alle an ihm Maß nehmen.',
        'vor dem ersten Kräftemessen stellt sich vor allem eine Frage: Kann {champion} seinen Titel verteidigen?',
        'Titelverteidiger {champion} eröffnet das Jahr mit dem größten Ziel: den Coup zu wiederholen.'
    ],

    // Satz 2 — Favorit(en), drei Fälle
    favorit: {
        // Favorit ≠ Titelverteidiger
        herausforderer: [
            'in der Favoritenrolle sehen viele allerdings {favorit} – das {favoritTeam}-Paket gilt als Maßstab der Winterarbeit.',
            '{favorit} gilt als erster Anwärter des neuen Jahres – die Papierform spricht für ihn und {favoritTeam}.',
            'wenn die Vorzeichen nicht täuschen, führt der Weg zum Titel {year} über {favorit} und {favoritTeam}.',
            'die Rolle des Gejagten könnte schnell wechseln: {favorit} gilt vielen als der Mann der Stunde.',
            '{presseNom} handelt vor allem einen Namen als Titelkandidaten: {favorit}.',
            'stark eingeschätzt wird {favorit} – bei {favoritTeam} deutet vieles auf ein konkurrenzfähiges Jahr.',
            'auf dem Papier bringt {favorit} das stärkste Gesamtpaket mit – doch Papier hat noch kein Rennen gewonnen.'
        ],
        // Favorit == Titelverteidiger (kein „X verteidigt, Favorit ist X"-Doppel)
        verteidigerFavorit: [
            'und die Vorzeichen sprechen erneut für ihn: {favorit} gilt auch {year} als der Mann, den es zu schlagen gilt.',
            'wer ihn entthronen will, braucht ein großes Jahr: {favorit} geht auch diesmal als Favorit ins Rennen um die Krone.',
            'die Konkurrenz sucht noch nach Antworten – die Favoritenrolle liegt erneut bei {favorit}.',
            'auch die neue Saison beginnt mit einer alten Gewissheit: An {favorit} führt der Weg nur vorbei, wenn alles zusammenpasst.',
            '{presseNom} sieht ihn erneut vorn: {favorit} vereint Fahrer und Material weiterhin am überzeugendsten.'
        ],
        // zwei Favoriten
        duo: [
            'als erste Anwärter gelten {favorit} und {favorit2} – zwei Namen, ein Ziel.',
            'die Favoritenfrage hat {year} zwei Antworten: {favorit} oder {favorit2}.',
            '{favorit} und {favorit2} gehen mit den besten Vorzeichen ins Jahr – und das Feld dazwischen wittert seine Chance.',
            'zwei Lager, zwei Hoffnungen: {favorit} und {favorit2} gelten als die Männer, die den Ton angeben dürften.',
            'wenn die Einschätzungen stimmen, läuft es {year} auf ein Duell hinaus: {favorit} gegen {favorit2}.'
        ]
    },

    // Satz 3a — Aufsteiger/Rookies (falls vorhanden); KEIN Talent-Lob für
    // Unbekannte — nur „muss sich zeigen"-Ton (Kaliber-Lehre aus Paket 2)
    rookie: {
        one: [
            'frisches Blut {klasseIn}: {rookieList} wagt in diesem Jahr den Sprung ins Feld.',
            'mit {rookieList} steht ein {neulingSg} am Start – was in ihm steckt, wird sich zeigen müssen.',
            '{rookieList} startet in seine erste Saison – jedes Debüt beginnt bei null.',
            'ein neues Gesicht im Feld: {rookieList} bestreitet sein erstes Jahr {klasseIn}.',
            'auch {year} wagt sich ein {neulingSg} ins Haifischbecken: {rookieList}.'
        ],
        many: [
            'gleich mehrere {neulingPl} wagen den Sprung: {rookieList} bestreiten ihr erstes Jahr {klasseIn}.',
            'das Feld bekommt frisches Blut: {rookieList} stehen vor ihrer Debüt-Saison.',
            'neue Namen, unbeschriebene Blätter: {rookieList} beginnen das Abenteuer {klasseIn}.',
            '{rookieList} – die {neulingPl} des Jahrgangs {year} müssen sich erst beweisen.',
            'die nächste Generation klopft an: {rookieList} debütieren in diesem Jahr.'
        ]
    },

    // Satz 3b — markanter Teamwechsel (falls vorhanden)
    wechsel: [
        'für Gesprächsstoff sorgt der Wechsel von {wechselName} zu {wechselTeam} – neue Farben, neue Erwartungen.',
        '{wechselName} fährt in diesem Jahr für {wechselTeam} – eine Verbindung, die neugierig macht.',
        'der prominenteste Umzug des Winters: {wechselName} startet fortan für {wechselTeam}.',
        'neues Kapitel für {wechselName}: Bei {wechselTeam} will er sich neu beweisen.',
        'ob der Tapetenwechsel zündet? {wechselName} versucht sein Glück ab sofort bei {wechselTeam}.',
        'die Boxengasse hat ein neues Gesprächsthema: {wechselName} in Diensten von {wechselTeam}.'
    ],

    // Schluss — offene Frage/Ausblick ({auftakt} lebt NUR hier)
    closer: [
        'die Antworten gibt wie immer nur die Strecke – {auftakt} beginnt die Suche.',
        'ob Favoriten oder {neulingPl}: Abgerechnet wird am Saisonende.',
        'die Prognosen sind geschrieben, die Wahrheit fährt auf der Strecke: {klasseNom} startet in ein neues Kapitel.',
        'noch ist alles Theorie – {auftakt} wird aus Papierform Wirklichkeit.',
        '{publikum} darf sich auf Antworten freuen – die Fragen liefert das neue Jahr von ganz allein.',
        'eine lange Saison liegt voraus, und sie hat noch jede Vorhersage auf die Probe gestellt.',
        'sicher ist nur eines: Auch dieses Jahr wird seine Geschichten schreiben.'
    ]
};

// ============================================================================
// Referenz-Assembler (SPEC-Deliverable) — analog seasonRecapText, nutzt die
// index.html-Helfer _recapRng/_recapHash/_recapPick/_recapFill/_recapNameList
// und RECAP_ERA_WORDS (~L10565).
//
//   ctx = {
//     year,                                  // neues Saisonjahr
//     champion: { name } | null,             // Vorsaison-P1 (null: allererste Saison)
//     favorits: [{ name, team }, ...],       // 1–2, von Opus (reputation × speed)
//     rookies:  ['Name', ...],               // Debütanten der Saison
//     wechsel:  { name, team } | null        // markantester Teamwechsel (neues Team)
//   }
//
// Satzfolge (SPEC §3): verteidiger → favorit → EIN Sonderbedingungs-Satz →
// closer = 3–4 Sätze (mit duo/verteidigerFavorit-Weiche gegen Dopplungen).
// „Max. EIN Sonderbedingungs-Satz": bei Rookie UND Wechsel gewinnt der
// Wechsel (seltener = pointierter) — Priorität ist Opus-Entscheidung, hier
// nur Referenz. Deterministisch: Seed preview|year|champion|favorit (§5).
// ============================================================================
function seasonPreviewText(ctx) {
    ctx = ctx || {};
    const year = ctx.year || 0;
    const champion = ctx.champion && ctx.champion.name ? ctx.champion : null;
    const favs = Array.isArray(ctx.favorits) ? ctx.favorits.filter(f => f && f.name) : [];
    const rookies = Array.isArray(ctx.rookies) ? ctx.rookies.filter(Boolean) : [];
    const wechsel = ctx.wechsel && ctx.wechsel.name && ctx.wechsel.team ? ctx.wechsel : null;
    if (!champion && !favs.length) return '';

    const era = RECAP_ERA_WORDS.find(e => year >= e.from && year <= e.to)
        || RECAP_ERA_WORDS[RECAP_ERA_WORDS.length - 1];
    const pEra = PREVIEW_ERA_WORDS.find(e => year >= e.from && year <= e.to)
        || PREVIEW_ERA_WORDS[PREVIEW_ERA_WORDS.length - 1];

    const T = {
        year: String(year),
        champion: champion ? champion.name : '',
        favorit: favs[0] ? favs[0].name : '',
        favoritTeam: favs[0] ? (favs[0].team || '') : '',
        favorit2: favs[1] ? favs[1].name : '',
        rookieList: _recapNameList(rookies),
        wechselName: wechsel ? wechsel.name : '',
        wechselTeam: wechsel ? wechsel.team : '',
        klasseNom: era.klasseNom, klasseGen: era.klasseGen, klasseIn: era.klasseIn,
        fahrerPl: era.fahrerPl, presseNom: era.presseNom, publikum: era.publikum,
        auftakt: pEra.auftakt, neulingSg: pEra.neulingSg, neulingPl: pEra.neulingPl
    };

    const rng = _recapRng(_recapHash(`preview|${year}|${T.champion}|${T.favorit}`));
    const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    const s = [];

    if (champion) s.push(cap(_recapFill(_recapPick(rng, PREVIEW_BANK.verteidiger), T)));

    if (favs.length) {
        const fPool = favs.length > 1 ? PREVIEW_BANK.favorit.duo
            : (champion && favs[0].name === champion.name) ? PREVIEW_BANK.favorit.verteidigerFavorit
            : PREVIEW_BANK.favorit.herausforderer;
        s.push(cap(_recapFill(_recapPick(rng, fPool), T)));
    }

    // Max. EIN Sonderbedingungs-Satz (SPEC §3) — Priorität: Wechsel > Rookie
    if (wechsel) s.push(cap(_recapFill(_recapPick(rng, PREVIEW_BANK.wechsel), T)));
    else if (rookies.length) {
        s.push(cap(_recapFill(_recapPick(rng, PREVIEW_BANK.rookie[rookies.length === 1 ? 'one' : 'many']), T)));
    }

    s.push(cap(_recapFill(_recapPick(rng, PREVIEW_BANK.closer), T)));
    return s.join(' ');
}

// ============================================================================
// Testfälle (SPEC §8) — Verteidiger + Favorit + Rookie, e50 + e10
// ============================================================================
// e50 (1954; Champion Ascari, Favorit Fangio/Mercedes, Rookie Moss):
//   „Ascari geht als Titelverteidiger in die Saison 1954 – und als Gejagter
//   des gesamten Feldes. Fangio gilt als erster Anwärter des neuen Jahres –
//   die Papierform spricht für ihn und Mercedes. Ein neues Gesicht im Feld:
//   Moss bestreitet sein erstes Jahr im Grand-Prix-Sport. Noch ist alles
//   Theorie – vor der ersten Startaufstellung des Jahres wird aus Papierform
//   Wirklichkeit."
// e10 (2024; Champion = Favorit Verstappen, Rookie Antonelli):
//   „Alle Augen richten sich auf Verstappen: Der Champion führt das Feld als
//   Titelverteidiger ins neue Jahr. Und die Vorzeichen sprechen erneut für
//   ihn: Verstappen gilt auch 2024 als der Mann, den es zu schlagen gilt.
//   Antonelli startet in seine erste Saison – jedes Debüt beginnt bei null.
//   Die Antworten gibt wie immer nur die Strecke – vor dem ersten Lights-out
//   des Jahres beginnt die Suche."
// ============================================================================
