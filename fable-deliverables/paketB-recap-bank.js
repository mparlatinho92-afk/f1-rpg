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

    // Satz 1 — Eröffnung, nach Titelkampf-Kategorie
    opener: {
        dominant: [
            '{champion} ließ {year} keinen Zweifel aufkommen: Mit {siegeDat} und {points} Punkten beherrschte er die Saison nach Belieben.',
            'Die Saison {year} trug eine einzige Handschrift – die von {champion}, der dem Jahr {klasseIn} mit {siegeDat} seinen Stempel aufdrückte.',
            'Selten war ein Titel so ungefährdet: {champion} fuhr {year} in einer eigenen Liga und krönte sich mit {points} Punkten zum Weltmeister.',
            '{year} gab es an {champion} kein Vorbeikommen: {siegeNom}, {points} Punkte – die Konkurrenz fuhr hinterher.',
            'Was {champion} {year} zeigte, war Dominanz in Reinform: {siegeNom}, {points} Punkte, keine offenen Fragen.',
            'Man wird die Saison {year} als Ein-Mann-Vorstellung in Erinnerung behalten: {champion} thronte mit {points} Punkten und {siegeDat} über dem Feld.',
            'Die Frage der Saison {year} lautete früh nicht mehr ob, sondern nur noch wann: {champion} machte den Titel mit {siegeDat} zur Formsache.',
            '{champion} gegen den Rest – auf diese Formel ließ sich das Jahr {year} bringen, und die {points} Punkte des Champions sprechen für sich.',
            'Rückblickend war die Saison {year} ein Monolog: {champion} diktierte das Geschehen mit {siegeDat} und {points} Punkten.',
            'Wer {year} nach Spannung an der Spitze suchte, suchte vergebens – {champion} enteilte dem Feld mit {siegeDat}.'
        ],
        knapp: [
            'Einen engeren Ausgang hätte sich {klasseNom} kaum ausdenken können: Am Ende der Saison {year} betrug der Abstand zwischen {champion} und {vize} gerade einmal {gapAkk}.',
            'Die Saison {year} wurde zum Nervenspiel – erst ganz am Ende sicherte sich {champion} den Titel, mit {gapDat} Vorsprung vor {vize}.',
            'Bis zuletzt blieb der Titelkampf {year} offen, dann hatte {champion} das bessere Ende für sich: {gapNom} Vorsprung auf {vize} – mehr nicht.',
            '{year} lieferten sich {champion} und {vize} ein Duell auf Augenhöhe, das {champion} um {gapAkk} für sich entschied.',
            'Am Ende entschieden Nuancen: {champion} rettete {year} einen Vorsprung von {gapDat} auf {vize} ins Ziel und ist Weltmeister.',
            'Enger Titelkampf bis zur letzten Wertung: {champion} schlug {vize} {year} um {gapAkk}.',
            'Die Saison {year} hielt die Spannung bis zur allerletzten Wertung: {champion} setzte sich mit {gapDat} Vorsprung gegen {vize} durch.',
            'Wer {year} wegsah, hat Geschichte verpasst: {champion} entschied eines der engsten Titelrennen {klasseGen} um {gapAkk} gegen {vize} für sich.',
            'Die Entscheidung {year} fiel erst, als niemand mehr rechnen mochte: {champion} hielt {vize} um {gapAkk} nieder.',
            'Zwei Namen, ein Wimpernschlag: Am Ende der Saison {year} betrug der Abstand zwischen {champion} und {vize} nur {gapAkk}.'
        ],
        normal: [
            '{champion} sicherte sich {year} mit {points} Punkten und {siegeDat} den Fahrertitel.',
            'Die Weltmeisterschaft des Jahres {year} ging an {champion}, der sich mit {siegeDat} und konstanten Resultaten durchsetzte.',
            'Am Ende einer intensiven Saison {year} stand {champion} als verdienter Champion fest – {points} Punkte, {siegeNom}.',
            '{champion} hieß der Mann, der {year} am Ende die Nase vorn hatte: Der Titel ging mit {siegeDat} an ihn.',
            'Mit {siegeDat} und {points} Punkten kürte sich {champion} {year} zum Weltmeister {klasseGen}.',
            'Die Saison {year} fand in {champion} ihren verdienten Weltmeister – {points} Punkte, {siegeNom}.',
            'Am Ende des Jahres {year} stand {champion} dort, wo alle hinwollten: ganz oben, mit {points} Punkten und {siegeDat}.',
            'Solide, schnell, verdient: {champion} sicherte sich {year} mit {siegeDat} und {points} Punkten die Krone {klasseGen}.',
            'Es war keine Saison der Superlative, aber eine mit einem verdienten Champion: {champion} holte {year} den Titel mit {points} Punkten.',
            'Die Bilanz des Jahres {year}: ein Weltmeister namens {champion}, {siegeNom}, {points} Punkte – und wenig Grund zur Debatte.'
        ]
    },

    // Satz 2 — Duell/Vize, nach Titelkampf-Kategorie (entfällt ohne Vize)

    // Satz 2 — Duell/Vize, nach Titelkampf-Kategorie (entfällt ohne Vize)
    duell: {
        dominant: [
            'Dahinter blieb {vize} als bester Verfolger chancenlos – der Rückstand von {gapDat} spricht eine deutliche Sprache.',
            '{vize} wurde Vize-Weltmeister, doch die Lücke von {gapDat} ließ nie echte Spannung aufkommen.',
            'Die Vize-Weltmeisterschaft ging an {vize}, der dem Dominator über weite Strecken nur hinterherfahren konnte.',
            'Bester der Geschlagenen: {vize}, der mit {vizePoints} Punkten immerhin den Rest des Feldes hinter sich hielt.',
            'Dass {vize} mit {vizePoints} Punkten Vize-Weltmeister wurde, verdient Respekt – am Ausgang des Jahres änderte es nichts.',
            'Hinter dem Überflieger sammelte {vize} ein, was übrig blieb: Rang zwei, mit {gapDat} Rückstand.',
            'Die Rolle des ersten Verfolgers blieb {vize} – mit {gapDat} Rückstand mehr Statist als Rivale.',
            '{vize} tat, was möglich war – gegen diese Übermacht war Rang zwei das höchste der Gefühle.',
            'Zweiter wurde {vize} – in jedem anderen Jahr vielleicht mehr, in diesem chancenlos.',
            'Am Abstand gibt es nichts zu deuteln: {vize} lag mit {gapDat} zurück – Welten, in Punkten gemessen.'
        ],
        knapp: [
            'Für {vize} bleibt die bittere Rolle des geschlagenen Helden – kaum je war ein Vize-Weltmeister so nah dran.',
            '{vize} verlor den Titel nicht durch Schwäche, sondern in einem Duell, das kaum enger hätte geführt werden können – ein Jahrgang, der beiden zur Ehre gereicht.',
            'So kurz vor dem Ziel gescheitert: {vize} wird den Winter mit der Frage verbringen, wo die entscheidenden Punkte liegen blieben.',
            'Auf der anderen Seite stand {vize}, der mit {vizePoints} Punkten alles gegeben hatte – und dem am Ende fast nichts fehlte.',
            'Und {vize}? Er geht als tragischer Zweiter in die Bücher ein – näher dran war selten jemand.',
            'Für {vize} war es die Saison der Beinahe-Krönung – bitterer kann sich Rang zwei kaum anfühlen.',
            '{vize} hat diese Saison mitgeschrieben wie kaum ein Zweiter – nur das letzte Kapitel gehörte einem anderen.',
            'Der Unterlegene verdient eine eigene Zeile: {vize} machte diesen Titelkampf zu dem, was er war.',
            'Zwischen Ruhm und Rang zwei lag fast nichts – {vize} wird diese Saison dennoch als verlorene erinnern.',
            'Selten stand ein Zweiter einem Champion so wenig nach: {vize} beendete das Jahr mit {vizePoints} Punkten.'
        ],
        normal: [
            'Rang zwei ging an {vize}, der mit {vizePoints} Punkten der beständigste Herausforderer war.',
            'Als Vize-Weltmeister behauptete sich {vize}, ohne den Champion je ernsthaft in Bedrängnis zu bringen.',
            '{vize} komplettierte als Zweiter das Spitzenduo, {gapAkk} hinter dem Champion.',
            'Dahinter reihte sich {vize} als Vize-Weltmeister ein – respektabel, aber ohne echten Zugriff auf die Krone.',
            'Platz zwei der Wertung ging mit {vizePoints} Punkten an {vize}.',
            'Die Rolle des ersten Verfolgers übernahm {vize} – beständig genug für Rang zwei, zu wenig für mehr.',
            'Hinter dem Champion sicherte sich {vize} mit {vizePoints} Punkten den zweiten Rang.',
            'Der stärkste Verfolger hieß {vize} – konstant genug für Platz zwei.',
            '{vize} hielt die Verfolgung am Leben, ohne je ganz heranzukommen – Rang zwei mit {vizePoints} Punkten.',
            'In der Rolle des ersten Jägers etablierte sich {vize} – am Ende blieb der Ehrenplatz.'
        ]
    },

    // Satz 3 (optional, max. einer) — Sonderbedingungen

    // Satz 3 (optional, max. einer) — Sonderbedingungen
    special: {
        rookie: [
            'Dass ausgerechnet ein Mann in seinem ersten Jahr die etablierte Garde düpierte, machte den Titel umso bemerkenswerter – ein Durchbruch, wie ihn {klasseNom} nur selten erlebt.',
            'Es war der Durchbruch eines Neulings: In seiner ersten Saison ließ {champion} sämtlichen Routiniers das Nachsehen.',
            'Ein Neuling als Weltmeister – {champion} verwandelte sein Debütjahr in einen Triumphzug.',
            'Und das im ersten Anlauf: {champion} brauchte keine Lehrjahre, er machte sein Debütjahr gleich zum Meisterjahr.',
            'Die etablierten {fahrerPl} mussten sich von einem Neuling zeigen lassen, wo es langgeht – ein Debüt für die Geschichtsbücher.',
            'Kein Respekt vor Namen, kein Respekt vor Hierarchien: {champion} wurde im ersten Jahr gleich Weltmeister.',
            'Das Drehbuch sah anders aus – dann kam ein Debütant: {champion} krönte sein erstes Jahr mit dem Titel.',
            'Die alte Garde staunte, {presseNom} überschlug sich: Ein Neuling namens {champion} griff nach der Krone – und bekam sie.',
            'Erstes Jahr, erster Titel: Was {champion} gelang, gelingt sonst kaum jemandem.',
            'Wer den Namen {champion} vor der Saison nicht kannte, kennt ihn jetzt – Weltmeister im Debütjahr.'
        ],
        underdog: [
            'Die eigentliche Sensation lieferte das Material: {champTeam} beendete die Konstrukteurswertung nur auf Rang {champTeamRank} – den Fahrertitel holte {champion} trotzdem.',
            'Dass der Titel ausgerechnet in ein Team der zweiten Reihe wanderte – {champTeam}, nur Rang {champTeamRank} bei den Konstrukteuren –, gab der Saison ihre eigene Note.',
            '{champion} schlug mit unterlegenem Gerät zu: Sein Team {champTeam} kam in der Konstrukteurswertung nicht über Rang {champTeamRank} hinaus.',
            'Das Auto war es jedenfalls nicht: {champTeam} landete bei den Konstrukteuren nur auf Rang {champTeamRank} – dieser Titel war das Werk des Fahrers.',
            'Wer wissen will, was ein Fahrer ausmachen kann, schaue auf Rang {champTeamRank} von {champTeam} in der Teamwertung – und dann auf den Weltmeister {champion}.',
            'Der Titel entstand gegen die Logik der Teamwertung: {champTeam} wurde dort nur Rang {champTeamRank} – vorn stand trotzdem {champion}.',
            'Es war kein Titel des Materials: {champion} holte die Krone, während {champTeam} in der Konstrukteurswertung auf Rang {champTeamRank} hängen blieb.',
            'Selten klafften Fahrer- und Teamleistung so auseinander: {champion} Weltmeister, {champTeam} nur Rang {champTeamRank}.',
            'Die Zahlen erzählen von einem Kraftakt: Rang {champTeamRank} für {champTeam} – und ganz oben trotzdem {champion}.',
            'Titel gegen die Verhältnisse: {champion} bog die Möglichkeiten von {champTeam} (Rang {champTeamRank}) zur Weltmeisterschaft zurecht.'
        ],
        mostWinsLost: [
            'Kurios: Die meisten Saisonsiege feierte mit {maxWinner} ein anderer ({maxWinnerSiegeNom}) – am Ende zählte die Konstanz von {champion}.',
            'Der siegreichste Mann des Jahres hieß {maxWinner} ({maxWinnerSiegeNom}), doch die Krone trug am Ende der beständigere {champion}.',
            '{maxWinner} gewann mehr Rennen als jeder andere – Weltmeister aber wurde {champion}: ein Sieg der Regelmäßigkeit über den Glanz.',
            'Sieger des Jahres: {maxWinner} ({maxWinnerSiegeNom}). Weltmeister des Jahres: {champion}. Manchmal sind das zwei verschiedene Geschichten.',
            'Dass {maxWinner} häufiger gewann und der Titel trotzdem an {champion} ging, wird {klasseIn} noch lange Gesprächsstoff liefern.',
            'Die Siegerliste des Jahres führte {maxWinner} an ({maxWinnerSiegeNom}) – in die Weltmeisterliste trug sich {champion} ein.',
            'Am häufigsten jubelte {maxWinner} ({maxWinnerSiegeNom}) – am längsten jubelt {champion}.',
            'Wer nur sonntags zusah, hielt {maxWinner} für den Besten – die Gesamtwertung sah {champion} vorn.',
            'Das Paradox des Jahres: {maxWinner} sammelte die Siege ({maxWinnerSiegeNom}), {champion} sammelte den Titel.',
            'Rennen gewinnt man mit Tempo, Titel mit Beständigkeit – {maxWinner} bewies das eine, {champion} das andere.'
        ],
        poleKing: [
            'Auch über eine Runde war {champion} das Maß aller Dinge: {poles} Pole-Positions unterstreichen die Vormachtstellung.',
            'Dazu kam rohe Geschwindigkeit: {poles} Pole-Positions machten {champion} auch zum König des Qualifyings.',
            'Im Qualifying regierte {champion} mit {poles} Pole-Positions fast nach Belieben.',
            'Eine Randnotiz mit Gewicht: {poles} Pole-Positions gingen an {champion} – schneller war samstags keiner.',
            'Die erste Startposition gehörte fast immer ihm: {poles} Pole-Positions stehen {year} hinter dem Namen {champion}.',
            'Samstags war die Sache meist früh entschieden: {poles} Pole-Positions für {champion}.',
            'Der Startplatz ganz vorn wurde beinahe sein Stammplatz: {champion} holte {poles} Poles.',
            'Auch die reine Rundenzeit gehörte {champion}: {poles} Pole-Positions in einem Jahr.',
            'Wo die Uhr allein entscheidet, war er am besten: {poles} Poles für {champion}.',
            'Die erste Reihe war fest vergeben: {poles} Pole-Positions gingen an {champion}.'
        ]
    },

    // Satz 4 — Konstrukteurswertung

    // Satz 4 — Konstrukteurswertung
    team: {
        double: [
            'Perfekt wurde das Jahr durch die Doppelkrone: {teamChampionName} sicherte sich auch die Konstrukteurswertung – Fahrer- und Teamtitel unter einem Dach.',
            'Auch bei den Konstrukteuren führte kein Weg an {teamChampionName} vorbei – das Team des Champions machte den Doppelerfolg perfekt.',
            'Der Arbeitgeber des Weltmeisters feierte gleich mit: {teamChampionName} gewann auch die Teamwertung – die Doppelkrone {klasseGen}.',
            'Und weil ein Titel offenbar nicht genug war, holte {teamChampionName} auch noch die Konstrukteurswertung – ein Jahr wie aus einem Guss.',
            'Fahrertitel und Teamtitel unter demselben Dach: {teamChampionName} räumte {year} beides ab.',
            'Die Teamwertung machte das Bild komplett: {teamChampionName} holte auch den Konstrukteurstitel – alles in einer Hand.',
            'Doppelter Lohn für eine dominante Mannschaft: {teamChampionName} gewann beide Wertungen des Jahres.',
            'Auch die Konstrukteurskrone blieb im Haus des Champions: {teamChampionName} vollendete das perfekte Jahr.',
            'Fahrer vorn, Team vorn: {teamChampionName} ließ {year} nichts anbrennen.',
            'Wenn alles zusammenläuft, sieht es so aus: {teamChampionName} feierte Fahrer- und Teamtitel im selben Jahr.'
        ],
        separate: [
            'Bei den Konstrukteuren hatte derweil {teamChampionName} mit {teamChampionPoints} Punkten die Nase vorn.',
            'Die Teamwertung ging getrennte Wege: Dort setzte sich {teamChampionName} durch.',
            'Der Konstrukteurstitel landete bei {teamChampionName} – dieser Triumph blieb dem Team des Champions verwehrt.',
            'Ein Trostpflaster für die Konkurrenz gab es in der Teamwertung: Dort triumphierte {teamChampionName}.',
            'Die Konstrukteurskrone nahm derweil einen anderen Weg – sie ging mit {teamChampionPoints} Punkten an {teamChampionName}.',
            'In der Teamwertung hieß der Sieger dagegen {teamChampionName} – die Titel verteilten sich auf zwei Lager.',
            'Die Konstrukteure krönten einen anderen: {teamChampionName} holte sich die Teamwertung mit {teamChampionPoints} Punkten.',
            'Getrennte Feiern: Der Fahrertitel ging an den Champion, die Teamwertung an {teamChampionName}.',
            'Bei den Konstrukteuren behielt {teamChampionName} das letzte Wort.',
            'Die Mannschaftswertung erzählte ihre eigene Geschichte – mit {teamChampionName} als Sieger.'
        ]
    },

    // Satz 5 (optional) — Todesfälle (nur State-Fakten, keine Ursachen erfinden)

    // Satz 5 (optional) — Todesfälle (nur State-Fakten, keine Ursachen erfinden)
    tragik: {
        one: [
            'Überschattet wurde das Jahr vom Tod von {deadName} ({deadTeam}), der {deadRaceBei} ums Leben kam – das Fahrerlager verneigte sich vor einem der Seinen.',
            'Doch die Saison hatte auch ihre dunkle Seite: {deadName} verlor {deadRaceBei} sein Leben – eine Lücke, die kein Ergebnis schließt.',
            'Aller sportliche Glanz verblasst neben dem Verlust von {deadName}, der {deadRaceBei} tödlich verunglückte.',
            'Und doch fällt ein Schatten über alle Zahlen dieses Jahres: {deadName} ({deadTeam}) verlor {deadRaceBei} sein Leben.',
            'Die Saison forderte ihren Preis: {deadName} starb {deadRaceBei} – das Fahrerlager verlor eines seiner Gesichter.',
            'Und dann war da der Tag, der alles relativierte: {deadName} ({deadTeam}) kam {deadRaceBei} ums Leben.',
            'Neben allen Wertungen steht ein Name, der bleibt: {deadName}, tödlich verunglückt {deadRaceBei}.',
            'Der Sport nahm sich in diesem Jahr einen der Seinen: {deadName} kehrte {deadRaceBei} nicht zurück.'
        ],
        many: [
            'Es war zugleich ein schwarzes Jahr: {deadList} bezahlten ihren Sport mit dem Leben – {deadCount} Todesfälle, die schwer auf dieser Saison lasten.',
            'Doch der Preis war hoch: Mit {deadList} verlor {klasseNom} in diesem Jahr {deadCount} {fahrerPl}.',
            'Über allem liegt Trauer: {deadList} kehrten von ihren Einsätzen nicht zurück.',
            'Die dunkle Bilanz dieses Jahres wiegt schwerer als jede Wertung: {deadList} verloren ihr Leben.',
            'Kein Rückblick ohne Trauer: {deadCount} {fahrerPl} – {deadList} – kehrten in diesem Jahr nicht zurück.',
            'Die Jahresbilanz trägt Trauerränder: {deadList} kamen in dieser Saison ums Leben.',
            'Was dieses Jahr kostete, steht in keiner Punktetabelle: {deadCount} {fahrerPl} – {deadList} – kehrten nicht heim.',
            'Hinter den Feierlichkeiten steht eine bittere Liste: {deadList}.'
        ]
    },

    // Schlusssatz (optional, nur wenn Satzbudget frei)

    // Schlusssatz (optional, nur wenn Satzbudget frei)
    closer: {
        normal: [
            'So endete ein Jahr, über das {presseNom} noch lange schreiben sollte.',
            'Es war eine Saison, die {publikum} so schnell nicht vergessen wird.',
            'Und so blickt {klasseNom} auf einen Jahrgang zurück, der Lust auf mehr macht.',
            'Der Vorhang fiel – und ließ ein Jahr zurück, das seinen Platz in den Annalen sicher hat.',
            'Bleibt die Frage, wer diese Messlatte im kommenden Jahr höher legen will.',
            'Die Motoren schweigen – die Debatten {klasseGen} beginnen jetzt erst richtig.',
            'Abgerechnet ist: Jetzt beginnt das Warten auf den ersten Start des neuen Jahres.',
            'Ein Jahrgang geht zu den Akten – vergessen wird er deshalb nicht.',
            'Was dieses Jahr versprochen hat, muss das nächste erst einmal halten.',
            'Die Zielflagge des Jahres ist gefallen – die Startflagge des nächsten wartet schon.'
        ],
        tragic: [
            'Zwischen Triumph und Trauer bleibt {year} ein Jahr, das niemand {klasseIn} so schnell vergisst.',
            'So bleibt ein Jahrgang in Erinnerung, in dem Erfolg und Verlust so nah beieinanderlagen wie selten.',
            'Gefeiert wurde am Ende leise – zu präsent war, was diese Saison gekostet hatte.',
            'Die Pokale sind verteilt, die Wunden nicht verheilt – dieses Jahr hinterlässt beides.',
            'Was bleibt, ist ein Jahrgang mit zwei Gesichtern: einem strahlenden und einem stillen.',
            'Man wird die Sieger dieses Jahres feiern – und die Fehlenden nicht vergessen.',
            'Am Ende bleibt ein Jahr, das Größe zeigte – und ihren Preis.',
            'Dieser Jahrgang wird gefeiert und betrauert werden – beides zu Recht.',
            'Die Chronik dieses Jahres kennt helle und dunkle Seiten – überblättern lässt sich keine.',
            'Zwischen Podien und Nachrufen lag {year} manchmal nur eine Woche – auch das gehört zur Wahrheit dieses Sports.'
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

// {deadRaceBei} — fertige Praepositionalphrase statt "beim {deadRace}" (Paket-7-Report N7).
// Die Namensquellen liefern durchweg den NOMINATIV, und nur die deutschen brechen:
//   F1DB-Kalender  "British Grand Prix"        -> "beim …"            traegt (Eigenname)
//   NONWM_F1_VENUES "Testfahrt"                -> "beim Testfahrt"    falsch (Femininum)
//   Streckeneditor "Grosser Preis von X"       -> flektiert im Dativ  "Grossen Preis"
//                  "Internationales X-Rennen"  -> "Internationalen X-Rennen"
// Fremdsprachiges bleibt bewusst unflektiert ("beim Gran Premio di X" ist korrekt).
// Das Token steht NIE am Satzanfang — seasonRecapText kapitalisiert nicht (s.join).
function _recapRaceBei(name) {
    const n = String(name || '').trim();
    if (!n) return 'beim Rennwochenende';
    if (/^(Testfahrt|Trainingsfahrt|Probefahrt)\b/.test(n)) return 'bei der ' + n;
    return 'beim ' + n
        .replace(/^Großer\s+Preis\b/, 'Großen Preis')
        .replace(/^Internationales\b/, 'Internationalen');
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
    // N8 (Paket-7-Report): Die Punkte-Route (gap >= 3*winPts) ist auch OHNE einen
    // einzigen Sieg erreichbar — 8 der 10 dominant-Zeilen setzen aber {siegeDat}/
    // {siegeNom} ein und behaupteten dann "mit keinem einzigen Sieg beherrschte er
    // die Saison nach Belieben". Ein siegloser Champion ist nie dominant, egal wie
    // gross sein Vorsprung ist; der normal-Pool traegt den Fall sprachlich sauber.
    if (cat === 'dominant' && !((champion.wins || 0) > 0)) cat = 'normal';

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
        // führendes Jahr im Rennnamen strippen ("1951 Indianapolis 500" → "beim Indianapolis 500")
        deadRace: deaths[0] ? (deaths[0].raceName || 'Rennwochenende').replace(/^\d{4}\s+/, '') : '',
        // N7: Kasus-sichere Praepositionalphrase — die tragik.one-Zeilen nutzen NUR diese,
        // nie "beim {deadRace}" (deutsche Veranstaltungsnamen stehen im Nominativ).
        deadRaceBei: deaths[0] ? _recapRaceBei((deaths[0].raceName || 'Rennwochenende').replace(/^\d{4}\s+/, '')) : '',
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
    module.exports = { seasonRecapText, RECAP_BANK, RECAP_ERA_WORDS,
        _recapHash, _recapRng, _recapPick, _recapNum, _recapFill, _recapRaceBei };
}
