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
    'karl-kling':            'der disziplinierte Werksfahrer aus Gießen',
    'hans-herrmann':         'der ewig freundliche Stuttgarter',
    'hermann-lang':          'der Silberpfeil-Veteran aus Bad Cannstatt',
    'louis-chiron':          'der Grandseigneur aus Monaco',
    'philippe-etancelin':    'der Veteran mit der verkehrt herum getragenen Mütze',
    'louis-rosier':          'der beharrliche Auvergnat',
    'robert-manzon':         'der stille Marseiller',
    'birabongse-bhanudej':   'der rennfahrende Prinz aus Siam',
    'emmanuel-de-graffenried': 'der freundliche Schweizer Baron',
    'paul-frere':            'der schreibende Rennfahrer aus Brüssel',
    'olivier-gendebien':     'der Gentleman aus dem belgischen Adel',
    'roy-salvadori':         'der Londoner mit italienischen Wurzeln',
    'ken-wharton':           'der Allrounder aus den Midlands',
    'umberto-maglioli':      'der sanfte Piemonteser',
    'chico-landi':           'der Vorreiter aus São Paulo',
    'reg-parnell':           'der bodenständige Farmer aus Derby',
    'raymond-sommer':        'der unermüdliche "Cœur de Lion"',
    'hans-stuck':            'der alte "Bergkönig"',
    'tony-rolt':             'der erfinderische Kriegsheld',
    'consalvo-sanesi':       'der treue Alfa-Testfahrer',
    // ── Indianapolis (1950–60) ──────────────────────────────────────────
    'bill-vukovich':         'der eisenharte Mann aus Fresno',
    'tony-bettenhausen':     'der unermüdliche Farmer aus Illinois',
    'jimmy-bryan':           'der zigarrenkauende Haudegen aus Phoenix',
    'bob-sweikert':          'der ernsthafte Kalifornier',
    'pat-o-connor':          'der freundliche Mann aus Indiana',
    'sam-hanks':             'der geduldige Routinier aus Ohio',
    'rodger-ward':           'der abgeklärte Taktiker aus Kansas',
    'jim-rathmann':          'der wortkarge Kalifornier',
    'johnnie-parsons':       'der frühere Vaudeville-Junge aus Los Angeles',
    'troy-ruttman':          'das jugendliche Kraftpaket aus Oklahoma',
    'lee-wallard':           'der zähe Mann aus Schenectady',
    'mauri-rose':            'der akribische Ingenieur mit dem Schnurrbart',
    'bill-holland':          'der frühere Rollschuh-Profi aus Philadelphia',
    'jack-mcgrath':          'der Hot-Rodder aus Los Angeles',
    'manny-ayulo':           'der stille Sohn peruanischer Einwanderer',
    'eddie-sachs':           'der "Clown Prince" der Ovale',
    'jerry-unser':           'der Älteste des Unser-Clans',
    'walt-faulkner':         'das "Little Dynamo" aus Kalifornien',
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
    'mike-spence':           'der bescheidene Perfektionist aus Croydon',
    'ludovico-scarfiotti':   'der Spross der Fiat-Dynastie',
    'willy-mairesse':        'der wilde Wallone',
    'carel-godin-de-beaufort': 'der joviale niederländische Edelmann',
    'jo-schlesser':          'der Spätberufene aus Madagaskar',
    'giancarlo-baghetti':    'der elegante Mailänder',
    'lucien-bianchi':        'der Wahl-Belgier aus Mailand',
    'masten-gregory':        'der kurzsichtige Draufgänger aus Kansas City',
    'chris-bristow':         'der ungestüme junge Londoner',
    'alan-stacey':           'der tapfere Mann aus Essex',
    'jean-pierre-beltoise':  'der zähe Pariser',
    'henri-pescarolo':       'der bärtige Pariser',
    'johnny-servoz-gavin':   'der blonde Bohemien aus Grenoble',
    'peter-gethin':          'der quirlige Mann aus Surrey',
    'trevor-taylor':         'der Yorkshireman im gelben Helm',
    'gerhard-mitter':        'der Bergspezialist aus dem Schwabenland',
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
    'john-watson':           'der besonnene Belfaster',
    'jochen-mass':           'der frühere Seemann aus Dorfen',
    'hans-joachim-stuck':    'der lange, lebensfrohe Bayer',
    'rolf-stommelen':        'der stille Kölner',
    'harald-ertl':           'der bärtige Journalist aus Zell am See',
    'gunnar-nilsson':        'der tapfere Schwede aus Helsingborg',
    'tony-brise':            'das strahlende Talent aus Kent',
    'arturo-merzario':       'der kleine Mann mit dem Cowboyhut',
    'jean-pierre-jarier':    'der ungestüme Pariser',
    'jean-pierre-jabouille': 'der Ingenieur-Pilot aus Paris',
    'helmuth-koinigg':       'der stille Wiener',
    'david-purley':          'der furchtlose Ex-Fallschirmjäger aus Bognor Regis',
    'wilson-fittipaldi':     'der ältere der Fittipaldi-Brüder',
    'bruno-giacomelli':      'der joviale Mann aus Brescia',
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
    'eddie-cheever':         'der Amerikaner aus Rom',
    'martin-brundle':        'der zähe Racer aus Norfolk',
    'jonathan-palmer':       'der promovierte Mediziner im Cockpit',
    'stefan-johansson':      'der freundliche Schwede aus Växjö',
    'thierry-boutsen':       'der sanfte Brüsseler',
    'alessandro-nannini':    'der Espresso-Erbe aus Siena',
    'ivan-capelli':          'der herzliche Mailänder',
    'pierluigi-martini':     'der beharrliche Mann aus Lugo',
    'satoru-nakajima':       'der Wegbereiter aus Okazaki',
    'marc-surer':            'der besonnene Basler',
    'jo-gartner':            'der eigenwillige Wiener',
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
    'alex-zanardi':          'der unverwüstliche Lebenskünstler aus Bologna',
    'ukyo-katayama':         'der kleine Kämpfer aus Tokio',
    'mika-salo':             'der trockene Finne aus Helsinki',
    'alexander-wurz':        'der lange Österreicher mit den zweifarbigen Schuhen',
    'jos-verstappen':        'der ungestüme Mann aus Montfort',
    'nick-heidfeld':         'der stille "Quick Nick"',
    'jj-lehto':              'der schnelle Finne aus Espoo',
    'karl-wendlinger':       'der stille Tiroler',
    'luca-badoer':           'der ewige Testfahrer aus Montebelluna',
    'jan-magnussen':         'das Naturtalent aus Roskilde',
    'mark-blundell':         'der kernige Mann aus Barnet',
    'taki-inoue':            'der Kultfahrer aus Kobe',
    // ── 2000er ──────────────────────────────────────────────────────────
    'fernando-alonso':       'der unbeugsame Asturier',
    'kimi-raikkonen':        'der wortkarge "Iceman"',
    'juan-pablo-montoya':    'der ungestüme Kolumbianer',
    'felipe-massa':          'der herzliche Paulista',
    'jenson-button':         'der Gentleman aus Somerset',
    'mark-webber':           'der geradlinige Australier',
    'robert-kubica':         'der stille Kämpfer aus Krakau',
    'jarno-trulli':          'der Feingeist aus den Abruzzen',
    'takuma-sato':           'der furchtlose Publikumsliebling aus Tokio',
    'timo-glock':            'der bodenständige Odenwälder',
    'sebastien-bourdais':    'der Mann aus Le Mans',
    'heikki-kovalainen':     'der freundliche Finne aus Suomussalmi',
    'vitaly-petrov':         'der Pionier aus Wyborg',
    'pastor-maldonado':      'der unberechenbare Venezolaner',
    'kamui-kobayashi':       'der Überholkünstler aus Amagasaki',
    'bruno-senna':           'der höfliche Paulista',
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
    'yuki-tsunoda':          'der Feuerkopf aus Sagamihara',
    'daniil-kvyat':          'der "Torpedo" aus Ufa',
    'stoffel-vandoorne':     'der stille Flame aus Kortrijk',
    'antonio-giovinazzi':    'der freundliche Apulier',
    'marcus-ericsson':       'der beharrliche Schwede aus Kumla',
    'mick-schumacher':       'der höfliche junge Mann aus dem Hause Schumacher',
    'guanyu-zhou':           'der Pionier aus Shanghai',
    'nyck-de-vries':         'der vielseitige Friese',
    'liam-lawson':           'der hartnäckige Neuseeländer',
    'franco-colapinto':      'der aufgeweckte Argentinier aus Pilar',
    'kimi-antonelli':        'das junge Ausnahmetalent aus Bologna',
    'gabriel-bortoleto':     'der ehrgeizige Paulista',
    'isack-hadjar':          'der quirlige Pariser',
    'oliver-bearman':        'der unerschrockene Junge aus Essex',
    'brendon-hartley':       'der ausdauernde Neuseeländer',
    'pascal-wehrlein':       'der stille Schwabe aus Sigmaringen',
    'paul-di-resta':         'der nüchterne Schotte aus West Lothian',
    'jean-eric-vergne':      'der nachdenkliche Pariser'
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
                'Der Tod von {name} reißt eine Lücke, die keine Wertung der Welt schließen kann.',
                '{nameE} ist tot – und mit ihm geht ein Stück {klasseGen}.',
                'Es gibt Nachrichten, die das Fahrerlager verstummen lassen. Der Tod von {name} ist eine davon.',
                'Ein Weltmeister ist gefallen: {nameE} wird {klasseIn} für immer fehlen.'
            ],
            talent: [
                '{nameE} starb, bevor seine Geschichte richtig beginnen konnte.',
                'Mit {name} verliert {klasseNom} eines seiner größten Versprechen – niemand wird je erfahren, wie weit ihn sein Talent getragen hätte.',
                'So jung, so schnell, so früh gegangen: {nameE} hinterlässt die bitterste aller Fragen – was wäre gewesen?',
                'Das Schicksal gab {name} nicht die Zeit, die sein Können verdient hätte.',
                'Er kam, um Geschichte zu schreiben – die Zeit dafür wurde {name} nicht gegeben.',
                '{nameE} war die Zukunft – nun ist er Vergangenheit, viel zu früh.',
                'Manche Karrieren enden, bevor sie richtig beginnen: {nameE} wurde mitten aus dem Aufstieg gerissen.'
            ],
            star: [
                '{nameE} ist nicht mehr – ein Fahrer, der an seinen besten Tagen jeden schlagen konnte.',
                'Mit {name} verliert das Fahrerlager einen der Besten seiner Generation.',
                '{nameE} hinterlässt eine Lücke im Feld – und eine größere daneben.',
                'Der Tod von {name} trifft {klasseNom} mitten ins Herz.',
                '{nameE} fuhr um Siege – nun fährt das Feld ohne ihn, und es ist ein ärmeres Feld.',
                'Wieder hat der Sport einen seiner Schnellsten genommen: {name} ist tot.',
                'Die Nachricht traf das Fahrerlager wie ein Schlag: {nameE} ist nicht mehr.'
            ],
            backmarker: [
                '{nameE} gewann nie ein Rennen – und hatte doch den Respekt aller, die je gegen ihn fuhren.',
                'Kein Titel, kein Siegerkranz: {nameE} stand für die stille Hingabe derer, die diesen Sport am Laufen halten.',
                'Mit {name} verliert das Feld einen seiner Unermüdlichen – einen, der nie aufgab, auch wenn vorne andere fuhren.',
                'Nicht jeder Held steht auf dem Podium: {nameE} war einer von denen, die trotzdem jeden Sonntag alles gaben.',
                '{nameE} fuhr meist abseits des Rampenlichts – vermisst wird er von allen.',
                'Die großen Schlagzeilen gehörten anderen – der Respekt des Feldes gehörte {name}.'
            ],
            generic: [
                'Der Tod von {name} legt sich wie ein Schatten über das Fahrerlager.',
                '{nameE} wird in keiner Startaufstellung mehr stehen – die Lücke bleibt.',
                'Mit {name} verliert der Sport einen der Seinen – zu früh, wie immer.',
                'Wieder trauert der Rennsport: {nameE} ist tot.',
                'Das Fahrerlager verliert {name} – und mit ihm eines seiner vertrauten Gesichter.',
                'Eine Nachricht, die niemand lesen wollte: {nameE} ist tot.'
            ]
        },
        stats: [
            'Es bleiben {bilanz} – und die Erinnerung an weit mehr.',
            'In den Statistiken stehen {bilanz}; was er den Menschen um ihn war, steht nirgends.',
            'Die Bücher verzeichnen {bilanz}.',
            '{bilanz} – nüchterne Zahlen für ein Leben mit Vollgas.',
            'Was bleibt, sind {bilanz} – und Lücken, die keine Zahl beschreibt.',
            'Die Chronik notiert {bilanz}. Der Rest ist Erinnerung.',
            'In den Listen stehen ab heute nur noch Zahlen: {bilanz}.',
            'Hinter dem Namen stehen von nun an feste Zahlen: {bilanz}. Davor stand ein Leben.'
        ],
        close: [
            '{klasseNom} verneigt sich.',
            'An den Strecken werden die Fahnen auf halbmast wehen.',
            'Das Fahrerlager trauert – und fährt weiter, wie es immer fährt.',
            'Es wird stiller sein {klasseIn}, wenn die Motoren das nächste Mal starten.',
            'Sein Name bleibt – in den Listen und in den Köpfen.',
            'Beim nächsten Start wird eine Schweigeminute mehr sagen als jedes Wort.',
            'Der Sport geht weiter – ärmer als zuvor.',
            'Es gibt Verluste, die keine Saison heilt.',
            'Die Motoren werden wieder starten – eine vertraute Stimme im Fahrerlager aber fehlt für immer.',
            'Wo er stand, bleibt in der Boxengasse ein leerer Platz.',
            'Der Kalender fährt weiter – die Gedanken bleiben bei ihm.',
            'Manche Runden enden nicht an der Ziellinie.',
            'Wer ihn fahren sah, wird ihn nicht vergessen.',
            'Auf den Tribünen wird sein Name noch lange fallen.'
        ]
    },
    abschied: {
        open: {
            champion: [
                '{nameE} macht Schluss – und geht, wie es nur wenigen vergönnt ist: aus freien Stücken.',
                'Mit dem Titel in der Vita verabschiedet sich {name} von der großen Bühne.',
                '{nameE} tritt ab – ein Champion verlässt die Bühne aufrecht.',
                '{nameE} verlässt die Bühne, die er mitgeprägt hat – erhobenen Hauptes.',
                'Der Abschied eines Champions hat sein eigenes Gewicht: {nameE} beendet seine Karriere.',
                'Was für eine Laufbahn da zu Ende geht: {nameE} steigt zum letzten Mal aus.'
            ],
            talent: [
                '{nameE} hört auf, lange bevor jemand damit gerechnet hätte.',
                'Der Rücktritt von {name} kommt früh – manchmal ist der Mut zum Aufhören der größte.',
                '{nameE} geht, während andere noch auf seine besten Jahre warteten.',
                'Kaum angekommen, schon wieder fort: {nameE} beendet seine Laufbahn überraschend früh.',
                'Nicht jedes Versprechen wird eingelöst: {nameE} hört auf, bevor seine Karriere ihren Zenit fand.'
            ],
            star: [
                '{nameE} nimmt den Helm ab – nach Jahren, in denen er zu den Besten gehörte.',
                'Das Feld verliert mit {name} einen seiner Schnellsten – diesmal an das Leben nach dem Sport.',
                '{nameE} sagt leise Lebewohl – die Zeiten, in denen er vorne mitfuhr, vergisst hier niemand.',
                'Das Feld verliert Tempo: {nameE} beendet seine Karriere.',
                'Nach Jahren in der Spitzengruppe zieht sich {name} zurück – der Sport verliert einen Maßstab.',
                '{nameE} tritt ab, solange ihn alle so in Erinnerung haben, wie er war: verdammt schnell.'
            ],
            backmarker: [
                '{nameE} beendet seine Laufbahn – ohne Siege, aber mit dem Respekt des gesamten Fahrerlagers.',
                'Nach all den Jahren im Feld verabschiedet sich {name} – so, wie er gefahren ist: ohne großes Aufheben.',
                'Keine Schlagzeilen, keine Denkmäler – nur Jahre voller ehrlicher Arbeit: {nameE} tritt zurück.',
                '{nameE} verlässt das Fahrerlager durch den Seiteneingang – so bescheiden, wie er gekommen ist.',
                'Das Feld verliert keinen Sieger, aber ein Stück Rückgrat: {nameE} hört auf.'
            ],
            gaveup: [
                '{nameE} hat genug – manchmal ist Aufhören die ehrlichste Entscheidung.',
                'Ohne großes Abschiedsspiel räumt {name} sein Cockpit.',
                '{nameE} zieht einen Schlussstrich – der Antrieb war aufgebraucht, der Stolz ist geblieben.',
                'Irgendwann geht die Rechnung nicht mehr auf: {nameE} zieht die Konsequenz und hört auf.',
                'Kein Feuerwerk, keine Ehrenrunde: {nameE} geht leise – und vermutlich erleichtert.',
                'Der Traum trug nicht mehr: {nameE} beendet seine Karriere.'
            ],
            generic: [
                '{nameE} hängt den Helm an den Nagel.',
                'Für {name} ist Schluss – der Sport zieht weiter, der Dank bleibt.',
                '{nameE} verabschiedet sich aus dem Grand-Prix-Zirkus.',
                'Ohne Getöse, ohne große Bühne: {nameE} tritt ab.',
                'Für {name} endet, was ihn ein Fahrerleben lang getragen hat.',
                'Wieder verabschiedet sich ein vertrautes Gesicht: {nameE} beendet seine Laufbahn.',
                'Die Startaufstellung wird sich neu sortieren – ohne {name}.',
                '{nameE} zieht den Schlussstrich unter ein Fahrerleben.'
            ]
        },
        stats: [
            'Zurück bleiben {bilanz} – und unzählige Geschichten.',
            'Am Ende stehen {bilanz}.',
            'Seine Bilanz: {bilanz}.',
            'Was bleibt: {bilanz}.',
            'Die Zahlen: {bilanz}. Die Geschichten dahinter erzählen andere weiter.',
            'In der Chronik stehen nun endgültige Zahlen: {bilanz}.',
            '{bilanz} – so liest sich diese Karriere in Zahlen.',
            'Unterm Strich stehen Zahlen, die bleiben: {bilanz}.',
            'Mitnehmen darf er {bilanz} – und alles, was sich nicht zählen lässt.'
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
            'Auch das gehört zum Rennsport: der Moment, in dem einer geht.',
            'Die Türen der Boxengasse stehen ihm immer offen.',
            'Man geht nicht wirklich – man kommt nur nicht mehr zum Start.',
            'Der Rennsport vergisst schnell, heißt es. Bei ihm wird es dauern.',
            'Irgendwo wird er zuschauen – und die Hände werden nach einem Lenkrad greifen wollen.',
            'Zum letzten Mal Helm ab – und Applaus.',
            'Die Stoppuhr läuft weiter, nur nicht mehr für ihn.'
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
