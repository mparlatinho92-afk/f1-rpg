// ============================================================================
// FABLE PAKET C — Nachrufe & Abschiede (Phrasen-Banken + Assembler)
// ============================================================================
// KEIN Runtime-LLM: zwei Phrasen-Register (NACHRUF = Tod, würdevoll;
// ABSCHIED = Rücktritt, warm/ehrend) + kuratierte Lore-Epitheta für reale
// Fahrer. obituaryText() montiert deterministisch 2–3 deutsche Sätze.
//
// ABHÄNGIGKEITEN (bei Integration bereits inline vorhanden, Paket B):
//   _recapHash, _recapRng, _recapPick, _recapFill, RECAP_ERA_WORDS
//   → Node-Test: Paket-B-Exporte vorher an globalThis hängen.
//
// LORE-LEITPLANKE (wichtigste Regel dieses Pakets):
//   Epitheta beschreiben NUR Herkunft, Fahrstil, Charakter oder etablierte
//   Spitznamen — NIEMALS reale Erfolge/Titel/Siege. Grund: Die Sim-Karriere
//   weicht von der Realität ab (Fangio kann im Sim 1952 titellos sterben;
//   "fünffacher Weltmeister" wäre dann falsch). Erfolge kommen ausschließlich
//   aus dem Sim-State (allTimeStATS). Bei Erweiterung der Tabelle einhalten!
//   Grammatik: Epitheta sind maskuline/neutrale NOMINATIV-Appositionen;
//   {nameE}-Templates führen den Namen ausschließlich als Satz-SUBJEKT.
//
// FIKTIVE/GENERIERTE Fahrer (drv.histId == null bzw. gen-/jw-Präfix):
//   bekommen NIE Lore — nur die generischen, rein state-basierten Bausteine.
// ============================================================================

// ---------------------------------------------------------------------------
// Lore-Epitheta realer Fahrer. Key = normalisierter Name (Kleinbuchstaben,
// Akzente entfernt, Nicht-Alphanumerik → '-'), NICHT der histId-Slug —
// dadurch robust gegen Slug-Konventionen. Lookup nur wenn isReal.
// ---------------------------------------------------------------------------
const DRIVER_LORE = {
    // ── 1950er ──────────────────────────────────────────────────────────
    'juan-manuel-fangio':    'der Maestro aus Balcarce',
    'alberto-ascari':        'der methodische Mailänder',
    'nino-farina':           'der Turiner mit dem berühmten gestreckten Fahrstil',
    'giuseppe-farina':       'der Turiner mit dem berühmten gestreckten Fahrstil',
    'stirling-moss':         'der ewige Gentleman-Racer',
    'mike-hawthorn':         'der Mann mit der Fliege',
    'peter-collins':         'der großherzige Engländer',
    'jean-behra':            'der unbeugsame Kämpfer aus Nizza',
    'luigi-musso':           'der stolze Römer',
    'eugenio-castellotti':   'der feurige Lombarde',
    'alfonso-de-portago':    'der Abenteurer aus altem spanischen Adel',
    'jose-froilan-gonzalez': 'der bullige Argentinier',
    'maurice-trintignant':   'der unverwüstliche Winzer aus der Provence',
    'tony-brooks':           'der stille Zahnarzt mit dem feinen Strich',
    'luigi-fagioli':         'der Altmeister aus den Abruzzen',
    'luigi-villoresi':       'der Mentor aus Mailand',
    'piero-taruffi':         'der silberhaarige Ingenieur aus Rom',
    'onofre-marimon':        'der treue Schützling Fangios',
    'felice-bonetto':        'der unverwüstliche "Pirat"',
    'harry-schell':          'der lebenslustige Amerikaner aus Paris',
    'stuart-lewis-evans':    'der zierliche Londoner',
    'phil-hill':             'der nachdenkliche Kalifornier',
    'wolfgang-von-trips':    'der rheinische Graf',
    'jo-bonnier':            'der bärtige Schwede',
    // ── 1960er ──────────────────────────────────────────────────────────
    'jim-clark':             'der stille Schäfersohn aus den schottischen Borders',
    'graham-hill':           'der zähe Londoner mit dem berühmten Schnurrbart',
    'john-surtees':          'der Grenzgänger zwischen zwei und vier Rädern',
    'jack-brabham':          'der wortkarge Australier',
    'bruce-mclaren':         'der freundliche Konstrukteur aus Auckland',
    'dan-gurney':            'der Gentleman aus Kalifornien',
    'lorenzo-bandini':       'der warmherzige Italiener',
    'jochen-rindt':          'der kompromisslose Stilist aus Graz',
    'jo-siffert':            'der unermüdliche Kämpfer aus Fribourg',
    'pedro-rodriguez':       'der furchtlose Mexikaner',
    'ricardo-rodriguez':     'das früh gereifte Wunderkind aus Mexiko-Stadt',
    'francois-cevert':       'der elegante Franzose mit den blauen Augen',
    'piers-courage':         'der Brauerei-Erbe mit dem großen Herzen',
    'richie-ginther':        'der akribische Entwickler aus Kalifornien',
    'denny-hulme':           'der wortkarge "Bär" aus Neuseeland',
    'chris-amon':            'der feinfühlige Neuseeländer',
    'jackie-stewart':        'der akribische Schotte und Vorkämpfer der Sicherheit',
    'innes-ireland':         'der schillernde Haudegen aus Schottland',
    'mike-hailwood':         'der Motorrad-Champion auf vier Rädern',
    // ── 1970er ──────────────────────────────────────────────────────────
    'niki-lauda':            'der unbeirrbare Rechner aus Wien',
    'james-hunt':            'der ungezähmte Freigeist',
    'emerson-fittipaldi':    'der kühle Kopf aus São Paulo',
    'ronnie-peterson':       'der fliegende Schwede mit dem spektakulären Strich',
    'patrick-depailler':     'der ewige Junge aus der Auvergne',
    'tom-pryce':             'der stille Waliser',
    'roger-williamson':      'das große Versprechen aus Leicestershire',
    'vittorio-brambilla':    'der "Gorilla von Monza"',
    'clay-regazzoni':        'der Lebemann aus dem Tessin',
    'jacky-ickx':            'der Stilist aus Brüssel',
    'mario-andretti':        'der Weltenbummler aus Montona',
    'jody-scheckter':        'der ungestüme Südafrikaner',
    'peter-revson':          'der Erbe, der lieber Rennfahrer war',
    'mark-donohue':          'der Ingenieur unter den Rennfahrern',
    'carlos-pace':           'der elegante Paulista',
    'carlos-reutemann':      'der grüblerische Mann aus Santa Fe',
    'alan-jones':            'der raubeinige Australier',
    // ── 1980er ──────────────────────────────────────────────────────────
    'gilles-villeneuve':     'der kompromisslose Québécois',
    'didier-pironi':         'der kühle Pariser',
    'alain-prost':           'der "Professor" aus Saint-Chamond',
    'nelson-piquet':         'der verschmitzte Carioca',
    'nigel-mansell':         'der Kämpfer mit dem berühmten Schnauzbart',
    'keke-rosberg':          'der unerschrockene Finne',
    'elio-de-angelis':       'der Pianist unter den Rennfahrern',
    'riccardo-paletti':      'der stille Mailänder',
    'stefan-bellof':         'das ungestüme Jahrhunderttalent aus Gießen',
    'manfred-winkelhock':    'der bodenständige Schwabe',
    'michele-alboreto':      'der feinsinnige Mailänder',
    'gerhard-berger':        'der Spaßvogel aus Tirol',
    'jacques-laffite':       'der ewig lächelnde Franzose',
    'riccardo-patrese':      'der elegante Paduaner',
    'rene-arnoux':           'der furchtlose Grenobler',
    'patrick-tambay':        'der feine Pariser',
    'derek-warwick':         'der bodenständige Engländer',
    'andrea-de-cesaris':     'der ungestüme Römer',
    // ── 1990er ──────────────────────────────────────────────────────────
    'ayrton-senna':          'der besessene Perfektionist aus São Paulo',
    'roland-ratzenberger':   'der Spätberufene aus Salzburg',
    'michael-schumacher':    'der unermüdliche Arbeiter aus Kerpen',
    'mika-hakkinen':         'der fliegende Finne',
    'damon-hill':            'der nachdenkliche Londoner',
    'jacques-villeneuve':    'der eigenwillige Kanadier',
    'jean-alesi':            'der Instinktfahrer aus Avignon',
    'heinz-harald-frentzen': 'der sensible Techniker aus Mönchengladbach',
    'rubens-barrichello':    'der gefühlvolle Paulista',
    'eddie-irvine':          'der schlagfertige Nordire',
    'david-coulthard':       'der grundsolide Schotte',
    'johnny-herbert':        'der unverwüstliche Optimist aus Essex',
    'olivier-panis':         'der stille Südfranzose',
    'giancarlo-fisichella':  'der sanfte Römer',
    'ralf-schumacher':       'der jüngere der Schumacher-Brüder',
    // ── 2000er ──────────────────────────────────────────────────────────
    'fernando-alonso':       'der unbeugsame Asturier',
    'kimi-raikkonen':        'der wortkarge "Iceman"',
    'juan-pablo-montoya':    'der ungestüme Kolumbianer',
    'felipe-massa':          'der herzliche Paulista',
    'jenson-button':         'der Gentleman aus Somerset',
    'mark-webber':           'der geradlinige Australier',
    'robert-kubica':         'der stille Kämpfer aus Krakau',
    'jarno-trulli':          'der Feingeist aus den Abruzzen',
    // ── 2010er+ ─────────────────────────────────────────────────────────
    'sebastian-vettel':      'der detailversessene Heppenheimer',
    'lewis-hamilton':        'der unbeirrbare Junge aus Stevenage',
    'nico-rosberg':          'der analytische Kopf aus Wiesbaden',
    'daniel-ricciardo':      'der Dauergrinser aus Perth',
    'max-verstappen':        'der kompromisslose Limburger',
    'valtteri-bottas':       'der stoische Finne',
    'sergio-perez':          'der geduldige Mann aus Guadalajara',
    'jules-bianchi':         'das große Versprechen aus Nizza',
    'charles-leclerc':       'der Junge aus Monte Carlo',
    'lando-norris':          'der aufgeweckte Bristoler',
    'george-russell':        'der akribische Mann aus King’s Lynn',
    'carlos-sainz':          'der Sohn des Rallye-Champions',
    'esteban-ocon':          'der zähe Normanne',
    'pierre-gasly':          'der Kämpfer aus Rouen',
    'oscar-piastri':         'der kühle Melbourner',
    'nico-hulkenberg':       'der schlagfertige Emsländer',
    'kevin-magnussen':       'der kantige Däne',
    'romain-grosjean':       'der wandlungsfähige Genfer',
    'lance-stroll':          'der stille Kanadier',
    'alexander-albon':       'der freundliche Londoner Thailänder',
    'yuki-tsunoda':          'der Feuerkopf aus Sagamihara'
};

// ---------------------------------------------------------------------------
// Phrasen-Banken. {nameE} = Name ggf. mit Lore-Apposition (NUR Subjekt-
// Position!); {name} = Name pur (kasus-frei einsetzbar); {bilanz} = Zahlen-
// Aufzählung in Ziffern (kasus-invariant); Ära-Tokens wie Paket B.
// ---------------------------------------------------------------------------
const OBIT_BANK = {
    nachruf: {
        open: {
            champion: [
                '{nameE} ist tot. {klasseNom} verliert einen seiner ganz Großen.',
                'Mit {name} verliert der Rennsport einen Champion, der seiner Zeit den Stempel aufdrückte.',
                '{nameE} wird nie wieder ein Lenkrad in die Hand nehmen – ein Verlust, der weit über den Sport hinausreicht.',
                'Der Tod von {name} reißt eine Lücke, die keine Wertung der Welt schließen kann.'
            ],
            talent: [
                '{nameE} starb, bevor seine Geschichte richtig beginnen konnte.',
                'Mit {name} verliert {klasseNom} eines seiner größten Versprechen – niemand wird je erfahren, wie weit ihn sein Talent getragen hätte.',
                'So jung, so schnell, so früh gegangen: {nameE} hinterlässt die bitterste aller Fragen – was wäre gewesen?',
                'Das Schicksal gab {name} nicht die Zeit, die sein Können verdient hätte.'
            ],
            star: [
                '{nameE} ist nicht mehr – ein Fahrer, der an seinen besten Tagen jeden schlagen konnte.',
                'Mit {name} verliert das Fahrerlager einen der Besten seiner Generation.',
                '{nameE} hinterlässt eine Lücke im Feld – und eine größere daneben.',
                'Der Tod von {name} trifft {klasseNom} mitten ins Herz.'
            ],
            backmarker: [
                '{nameE} gewann nie ein Rennen – und hatte doch den Respekt aller, die je gegen ihn fuhren.',
                'Kein Titel, kein Siegerkranz: {nameE} stand für die stille Hingabe derer, die diesen Sport am Laufen halten.',
                'Mit {name} verliert das Feld einen seiner Unermüdlichen – einen, der nie aufgab, auch wenn vorne andere fuhren.'
            ],
            generic: [
                'Der Tod von {name} legt sich wie ein Schatten über das Fahrerlager.',
                '{nameE} wird in keiner Startaufstellung mehr stehen – die Lücke bleibt.',
                'Mit {name} verliert der Sport einen der Seinen – zu früh, wie immer.'
            ]
        },
        stats: [
            'Es bleiben {bilanz} – und die Erinnerung an weit mehr.',
            'In den Statistiken stehen {bilanz}; was er den Menschen um ihn war, steht nirgends.',
            'Die Bücher verzeichnen {bilanz}.',
            '{bilanz} – nüchterne Zahlen für ein Leben mit Vollgas.'
        ],
        close: [
            '{klasseNom} verneigt sich.',
            'An den Strecken werden die Fahnen auf halbmast wehen.',
            'Das Fahrerlager trauert – und fährt weiter, wie es immer fährt.',
            'Es wird stiller sein {klasseIn}, wenn die Motoren das nächste Mal starten.',
            'Sein Name bleibt – in den Listen und in den Köpfen.',
            'Beim nächsten Start wird eine Schweigeminute mehr sagen als jedes Wort.',
            'Der Sport geht weiter – ärmer als zuvor.',
            'Es gibt Verluste, die keine Saison heilt.'
        ]
    },
    abschied: {
        open: {
            champion: [
                '{nameE} macht Schluss – und geht, wie es nur wenigen vergönnt ist: aus freien Stücken.',
                'Mit dem Titel in der Vita verabschiedet sich {name} von der großen Bühne.',
                '{nameE} tritt ab – ein Champion verlässt die Bühne aufrecht.'
            ],
            talent: [
                '{nameE} hört auf, lange bevor jemand damit gerechnet hätte.',
                'Der Rücktritt von {name} kommt früh – manchmal ist der Mut zum Aufhören der größte.'
            ],
            star: [
                '{nameE} nimmt den Helm ab – nach Jahren, in denen er zu den Besten gehörte.',
                'Das Feld verliert mit {name} einen seiner Schnellsten – diesmal an das Leben nach dem Sport.',
                '{nameE} sagt leise Lebewohl – die Zeiten, in denen er vorne mitfuhr, vergisst hier niemand.'
            ],
            backmarker: [
                '{nameE} beendet seine Laufbahn – ohne Siege, aber mit dem Respekt des gesamten Fahrerlagers.',
                'Nach all den Jahren im Feld verabschiedet sich {name} – so, wie er gefahren ist: ohne großes Aufheben.'
            ],
            gaveup: [
                '{nameE} hat genug – manchmal ist Aufhören die ehrlichste Entscheidung.',
                'Ohne großes Abschiedsspiel räumt {name} sein Cockpit.',
                '{nameE} zieht einen Schlussstrich – der Antrieb war aufgebraucht, der Stolz ist geblieben.'
            ],
            generic: [
                '{nameE} hängt den Helm an den Nagel.',
                'Für {name} ist Schluss – der Sport zieht weiter, der Dank bleibt.',
                '{nameE} verabschiedet sich aus dem Grand-Prix-Zirkus.',
                'Ohne Getöse, ohne große Bühne: {nameE} tritt ab.',
                'Für {name} endet, was ihn ein Fahrerleben lang getragen hat.'
            ]
        },
        stats: [
            'Zurück bleiben {bilanz} – und unzählige Geschichten.',
            'Am Ende stehen {bilanz}.',
            'Seine Bilanz: {bilanz}.',
            'Was bleibt: {bilanz}.',
            'Die Zahlen: {bilanz}. Die Geschichten dahinter erzählen andere weiter.'
        ],
        close: [
            'Man wird ihn {klasseIn} vermissen.',
            'Die Startaufstellung wird ohne ihn ein Stück ärmer sein.',
            'Was bleibt, ist Dankbarkeit.',
            'Die Boxengasse verliert ein vertrautes Gesicht.',
            'Sein Platz im Fahrerlager bleibt unbesetzt – der in den Erinnerungen nicht.',
            'Es ist ein Abschied ohne Bitterkeit – so, wie ihn sich jeder wünscht.',
            'Der Sport behält ihn als einen der Seinen in Erinnerung.',
            'Und irgendwann, bei irgendeinem Rennen, wird jemand fragen: Weißt du noch?',
            'Das Fahrerlager verliert einen, der dazugehörte.',
            'Nun beginnt das Leben nach dem Rennsport.',
            'Der Helm ruht – die Erinnerungen nicht.',
            'Auch das gehört zum Rennsport: der Moment, in dem einer geht.'
        ]
    }
};

// ---------------------------------------------------------------------------
// Helfer
// ---------------------------------------------------------------------------

// Namens-Normalisierung für den Lore-Lookup ("José Froilán González" →
// "jose-froilan-gonzalez") — robust gegen Akzente/Schreibvarianten.
function _obitNameKey(name) {
    return String(name || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Real vs. generiert: reale Fahrer tragen einen histId-Slug; generierte haben
// histId null bzw. Laufzeit-IDs mit gen-/jw/reserve-Präfix. Lore NUR bei real.
function _obitIsReal(drv) {
    if (!drv || !drv.histId) return false;
    return !/^(gen-|jw|reserve-)/.test(String(drv.histId));
}

// Bilanz-Aufzählung in ZIFFERN (kasus-invariant: "verzeichnen 1 Sieg" und
// "Es bleiben 1 Sieg, ..." funktionieren beide). Max. 3 Bausteine.
function _obitBilanz(stats) {
    if (!stats) return '';
    const parts = [];
    const starts = stats.races || 0, wins = stats.wins || 0,
          podiums = stats.podiums || 0, titles = stats.championships || 0;
    if (starts > 0) parts.push(`${starts} ${starts === 1 ? 'Grand-Prix-Start' : 'Grand-Prix-Starts'}`);
    if (wins > 0) parts.push(`${wins} ${wins === 1 ? 'Sieg' : 'Siege'}`);
    else if (podiums > 0) parts.push(`${podiums} ${podiums === 1 ? 'Podestplatz' : 'Podestplätze'}`);
    if (titles > 0) parts.push(`${titles} WM-Titel`);
    if (parts.length === 0) return '';
    return parts.length > 1
        ? parts.slice(0, -1).join(', ') + ' und ' + parts[parts.length - 1]
        : parts[0];
}

// ---------------------------------------------------------------------------
// Assembler — 2–3 deutsche Sätze, deterministisch (Seed mode|name|year).
//
//   name   Anzeigename (aus seasonDeaths-/seasonRetirements-Eintrag)
//   drv    GAME_STATE-Fahrer-Objekt oder null (→ generisch, keine Lore)
//   stats  allTimeStATS.drivers[histId||id] oder null (→ kein Bilanz-Satz)
//   year   GAME_STATE.currentYear (Ära-Ton + Alters-/Talent-Check)
//   mode   'death' | 'retire'
//   ctx    optional: { age, retireType: 'age'|'gaveup' }
// ---------------------------------------------------------------------------
function obituaryText(name, drv, stats, year, mode, ctx) {
    if (!name) return '';
    ctx = ctx || {};
    const bank = OBIT_BANK[mode === 'retire' ? 'abschied' : 'nachruf'];

    // Kategorie rein aus Sim-State
    const titles = (stats && stats.championships) || 0;
    const wins = (stats && stats.wins) || 0;
    const podiums = (stats && stats.podiums) || 0;
    const starts = (stats && stats.races) || (drv && drv.starts) || 0;
    const age = ctx.age || (drv && drv.birthYear ? year - drv.birthYear : null);

    let cat = 'generic';
    if (titles > 0) cat = 'champion';
    else if (mode !== 'retire' && age !== null && age <= 25) cat = 'talent';
    else if (wins > 0 || podiums >= 3) cat = 'star';
    else if (starts >= 50) cat = 'backmarker';
    // Rücktritt "aufgegeben": eigener Ton, sofern kein Champion/Star
    if (mode === 'retire' && ctx.retireType === 'gaveup' && cat !== 'champion' && cat !== 'star') {
        cat = 'gaveup';
    }
    const pool = bank.open[cat] || bank.open.generic;

    // Lore nur für reale Fahrer (generierte: histId null / gen-Präfix)
    const lore = _obitIsReal(drv) ? DRIVER_LORE[_obitNameKey(name)] : null;

    const rng = _recapRng(_recapHash(`${mode}|${name}|${year}`));
    const era = RECAP_ERA_WORDS.find(e => year >= e.from && year <= e.to)
        || RECAP_ERA_WORDS[RECAP_ERA_WORDS.length - 1];
    const T = {
        name: name,
        nameE: lore ? `${name}, ${lore},` : name,
        bilanz: _obitBilanz(stats),
        klasseNom: era.klasseNom, klasseGen: era.klasseGen, klasseIn: era.klasseIn,
        fahrerPl: era.fahrerPl
    };

    // Satzanfang groß (Tokens wie {klasseNom}='die Formel 1' können vorn stehen)
    const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    const s = [];
    s.push(cap(_recapFill(_recapPick(rng, pool), T)));
    if (T.bilanz) s.push(cap(_recapFill(_recapPick(rng, bank.stats), T)));
    s.push(cap(_recapFill(_recapPick(rng, bank.close), T)));
    return s.join(' ');
}

// Node-Testbarkeit (im Browser-Monolith wirkungslos)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { obituaryText, OBIT_BANK, DRIVER_LORE, _obitNameKey, _obitIsReal, _obitBilanz };
}
