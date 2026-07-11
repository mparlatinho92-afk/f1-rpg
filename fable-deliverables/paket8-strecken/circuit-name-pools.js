// ============================================================================
// Paket 8 — Fiktive Strecken- & Rennnamen (Fable-Deliverable, 2026-07-11, v2)
// ============================================================================
// Inline-fähig (Grundregel 4). Schwester-Paket zu Paket 6 — greift erst, wenn
// Opus den Streckeneditor + Zufalls-Button gebaut hat (SPEC §0).
//
// v2 (Nutzer-Vorgabe): KEIN generic-Fallback („Arcade-Rennspiel") — 30 echte
// Nationen-Pools, jede Neuanlage klingt nativ. IOC→Key-Map:
//   ITA→it GBR→gb FRA→fr GER→de USA→us JPN→jp BRA→br ESP→es AUT→at SUI→ch
//   BEL→be NED→nl POR→pt SWE→se FIN→fi HUN→hu CZE→cz RUS→ru TUR→tr RSA→za
//   ARG→ar MEX→mx CAN→ca AUS→au NZL→nz CHN→cn KOR→kr IND→in MAS→my UAE→ae
// Nation OHNE Pool → Generator zieht eine NEUE Nation (Re-Roll, gewichtet) —
// niemals einen fremdsprachigen Pool leihen. Mikrostaaten (MON, SGP) vom
// Generator AUSSCHLIESSEN: dort fahren reale Stadtkurse, ein Fiktiv-Ort wäre
// unglaubwürdig.
//
// ⚙️ OPUS-FILTER (Nutzer-Vorgabe, optional beim Generator):
//   1. GEWICHTUNG der Länder — z.B. über den Motorsport-Frequenz-Trichter
//      (pickNationMotorsport) oder eine eigene Strecken-Gewichtstabelle
//      (Rennland ≠ Fahrerland: Kalender-Historie gewichtet anders).
//   2. AUSSCHLUSS bereits verwendeter Länder/Grand Prix der AKTUELLEN Saison:
//      kein zweiter „Großer Preis von X" im selben Kalender; optional ganze
//      Nation sperren, wenn sie schon einen Lauf hat.
//
// KOHÄRENZ-REGEL: Strecken- und Rennname einer Neuanlage ziehen DENSELBEN
// {loc} — „Falkenriedring" richtet den „Großen Preis von Falkenried" aus.
//
// ÄRA-MIX (Nutzer-Vorgabe: „damals eher lokalisiert"):
//   e50/e62  NUR lokalisierte racePattern, NIE Sponsor-Präfix.
//   e76      lokalisiert, ~30 % mit '{sponsor} '-Präfix.
//   e94      ~50 % Sponsor-Präfix, generisch-korporative Formen nehmen zu.
//   e10      Sponsor-Präfix Standard (~70 %).
//   Sponsor-Quelle: TEAM_NAME_POOLS.sponsorTitle (Paket 6).
//
// GRAMMATIK-SCHUTZ: Für fi/cz/hu sind nur genitiv-freie Rennnamen-Formen
// gewählt (finnische/tschechische/ungarische Genitive flektieren den
// Ortsnamen — das kann kein Template leisten).
//
// FIKTIVITÄT: Alle Orte erfunden, nativ-plausibel; reale Motorsport-Orte und
// belastete Namen gemieden; Kollisions-Check gehört zur Validierung.
// Era-Hinweise: (e50+) = früh-typisch, (mod) = eher ab e94 — optional.
// ============================================================================

const CIRCUIT_NAME_POOLS = {

    // ── Fiktive Ortsnamen je Nation ({loc}-Füllung) ─────────────────────────
    place: {
        it: ['Valdano', 'Montefiore', 'Castelrosso', 'San Verino', 'Lagoscuro',
             'Torrelunga', 'Vallechiara', 'Montaverde', 'Rovalta', 'Pievalta'],
        gb: ['Kingsmoor', 'Draycott', 'Feltonbury', 'Alderfield', 'Wexcombe',
             'Harrowdale', 'Stanmere', 'Copperton', 'Ashwell Heath', 'Norbury Down'],
        fr: ['Valmont', 'Beaurivage', 'Roche-Noire', 'Vireloup', 'Charmes-sur-Loire',
             'Montbrison-le-Haut', 'Sainte-Claire', 'Lac-Argent', 'Fontaubert', 'Prévalon'],
        de: ['Falkenried', 'Lindenfeld', 'Hohenfeld', 'Grünbach', 'Adlersheim',
             'Steinfurth', 'Waldkron', 'Silberhausen', 'Ebenrode', 'Kranichtal'],
        us: ['Redstone', 'Twin Buttes', 'Copper Flats', 'Lakeport', 'Dry Creek',
             'Fairhaven', 'Bluff City', 'Cedar Ridge', 'Stonewall', 'Prairie Bend'],
        jp: ['Kazemura', 'Hoshizaki', 'Minamigaoka', 'Tsukihara', 'Okabayashi',
             'Harukawa', 'Shirotani', 'Nagisano', 'Yamaseki', 'Kurosawa-ko'],
        br: ['Vale Verde', 'Santa Elisa', 'Porto Azul', 'Ribeirão Alto', 'Boa Vista do Sul',
             'Campo Dourado', 'Serra Clara', 'Lagoa Funda', 'Monte Alegre do Norte', 'Cruzeiro Velho'],
        es: ['Valdemora', 'Torrealta', 'Puerto Lindo', 'San Cebrián', 'Fuentelsol',
             'Miravalles', 'Casaroja', 'Alcorbes', 'Peñablanca', 'Villaverde de Arriba'],
        at: ['Almried', 'Steinwang', 'Zellmoos', 'Traunfeld', 'Murwald', 'Kirchleiten'],
        ch: ['Neuenwil', 'Lindenmoos', 'Valclair', 'Sernatal', 'Hochwil', 'Montfleuri'],
        be: ['Westerlinde', 'Bosduin', 'Vielrode', 'Hameau-du-Lac', 'Sint-Goriks', 'Ardevaux'],
        nl: ['Westerduin', 'Leeuwenmeer', 'Kolkwijk', 'Bronsloot', 'Havezande', 'Vlasdonk'],
        pt: ['Vila Serena', 'Alto do Sol', 'São Faustino', 'Miradouro', 'Vale Sereno', 'Cabo Sereno'],
        se: ['Granlunda', 'Norrsjö', 'Ekvalla', 'Lindtorp', 'Silverfors', 'Havsbyn'],
        fi: ['Korpivaara', 'Sinisalmi', 'Virtalahti', 'Kuusiranta', 'Peltokoski', 'Ilvesjärvi'],
        hu: ['Zöldhalom', 'Napvölgy', 'Kisberek', 'Fehérpuszta', 'Szélmajor', 'Aranyliget'],
        cz: ['Jestřebník', 'Modravka', 'Lipová Hora', 'Zelenov', 'Habrovec', 'Stříbrník'],
        ru: ['Beloretschje', 'Kamengrad', 'Orlowka', 'Tichaja Reka', 'Krasnolessje', 'Sinjaja Gora'],
        tr: ['Denizova', 'Yeşilkaya', 'Aytepe', 'Kartalca', 'Günova', 'Tuzlukale'],
        za: ['Duinekloof', 'Vaalberg', 'Silwerkruin', 'Elandsvlakte', 'Môreson', 'Karookrans'],
        ar: ['Villa Esperanza', 'Monte Claro', 'San Edelmiro', 'El Mirasol', 'Estancia del Sur', 'Alto Pampero'],
        mx: ['San Bernal', 'Valle Escondido', 'Piedras Altas', 'El Roble Viejo', 'Lomas del Águila', 'Cerro Dorado'],
        ca: ['Maplebrook', 'Baie-Claire', 'Whitepine', 'Fort Alder', 'Lac Bernier', 'Granite Bay'],
        au: ['Warrandale', 'Silvergum', 'Bindarra', 'Wattle Creek', 'Marralong', 'Currawong Downs'],
        nz: ['Aldermere', 'Glenorrin', 'Fernbrook', 'Seacliff Downs', 'Broadmere', 'Harringvale'],
        cn: ['Yunhu', 'Jinshawan', 'Baiyunling', 'Shitanhe', 'Luyuan', 'Tianmawan'],
        kr: ['Hanuiri', 'Dallaegol', 'Sinpyeongho', 'Gureumsan', 'Songdam-ri', 'Baekhasan'],
        in: ['Kesargarh', 'Suryavan', 'Chandravati', 'Veerapalli', 'Mohanpura', 'Tejgarh'],
        my: ['Teluk Sena', 'Sungai Emas', 'Bukit Delima', 'Lembah Jati', 'Tanjung Mas', 'Padang Seri'],
        ae: ['Wadi Sarab', 'Ras Al Noor', 'Al Nokhba', 'Jazirat Al Fajr', 'Bandar Al Shams', 'Madinat Al Sahwa']
    },

    // ── Strecken-Muster je Nation (Templates, genau 1× {loc}) ───────────────
    circuitPattern: {
        it: ['Autodromo di {loc}', 'Autodromo Nazionale {loc}', 'Circuito di {loc}',
             'Autodromo Internazionale {loc}' /* (mod) */],
        gb: ['{loc} Circuit', '{loc} Park Circuit', '{loc} Aerodrome Circuit' /* (e50+) */,
             '{loc} International Circuit' /* (mod) */, '{loc} Racing Circuit'],
        fr: ['Circuit de {loc}', 'Autodrome de {loc}', 'Circuit International de {loc}' /* (mod) */,
             'Circuit des Collines de {loc}'],
        de: ['{loc}ring', 'Motodrom {loc}', 'Rennstrecke {loc}',
             '{loc}-Schleife' /* (e50+) */, 'Motorsport-Arena {loc}' /* (mod) */],
        us: ['{loc} Speedway', '{loc} Raceway', '{loc} Motor Speedway',
             '{loc} International Raceway' /* (mod) */, '{loc} Road Course'],
        jp: ['{loc} Circuit', '{loc} Speedway', '{loc} International Circuit' /* (mod) */,
             '{loc} Highland Circuit'],
        br: ['Autódromo de {loc}', 'Circuito {loc}', 'Autódromo Internacional de {loc}' /* (mod) */],
        es: ['Circuito de {loc}', 'Autódromo {loc}', 'Circuito Permanente de {loc}' /* (mod) */],
        at: ['{loc}ring', 'Motorsportpark {loc}', 'Rennstrecke {loc}'],
        ch: ['Rundstrecke {loc}', 'Circuit de {loc}', '{loc}-Kurs'],
        be: ['Circuit de {loc}', 'Circuit van {loc}', 'Omloop van {loc}'],
        nl: ['Circuit {loc}', 'Circuit van {loc}', 'Racebaan {loc}'],
        pt: ['Circuito de {loc}', 'Autódromo de {loc}', 'Circuito Internacional de {loc}' /* (mod) */],
        se: ['{loc}banan', '{loc} Ring', 'Motorbana {loc}'],
        fi: ['{loc} Ring', '{loc} Circuit', 'Moottorirata {loc}'],
        hu: ['{loc}ring', 'Versenypálya {loc}'],
        cz: ['Okruh {loc}', 'Autodrom {loc}'],
        ru: ['{loc} Ring', 'Autodrom {loc}'],
        tr: ['{loc} Park', '{loc} Circuit'],
        za: ['{loc} Circuit', '{loc} Raceway', '{loc} Grand Prix Circuit'],
        ar: ['Autódromo de {loc}', 'Autódromo Municipal de {loc}', 'Circuito {loc}'],
        mx: ['Autódromo de {loc}', 'Autódromo Internacional de {loc}' /* (mod) */, 'Circuito {loc}'],
        ca: ['{loc} Circuit', 'Circuit de {loc}', '{loc} Motorsport Park' /* (mod) */],
        au: ['{loc} Raceway', '{loc} International Raceway', '{loc} Circuit'],
        nz: ['{loc} Circuit', '{loc} Raceway', '{loc} Motor Racing Circuit'],
        cn: ['{loc} International Circuit' /* (mod) */, '{loc} Circuit'],
        kr: ['{loc} International Circuit' /* (mod) */, '{loc} Speedway'],
        in: ['{loc} International Circuit' /* (mod) */, '{loc} Racing Circuit'],
        my: ['{loc} International Circuit' /* (mod) */, '{loc} Circuit'],
        ae: ['{loc} Autodrome', '{loc} International Circuit' /* (mod) */, '{loc} Circuit']
    },

    // ── Rennnamen-Muster je Nation (lokalisiert; Templates, genau 1× {loc}) ─
    // Sponsor-Komposition (nur e76+): '{sponsor} ' + gefülltes Muster.
    racePattern: {
        it: ['Gran Premio di {loc}', 'Coppa {loc}', 'Trofeo {loc}' /* (e50+) */],
        gb: ['{loc} Grand Prix', '{loc} Trophy' /* (e50+) */, '{loc} Gold Cup' /* (e50+) */,
             'International {loc} Trophy' /* (e50+) */],
        fr: ['Grand Prix de {loc}', 'Coupe de {loc}' /* (e50+) */, 'Grand Prix Automobile de {loc}' /* (e50+) */],
        de: ['Großer Preis von {loc}', 'Internationales {loc}-Rennen' /* (e50+) */, '{loc}-Pokal' /* (e50+) */],
        us: ['{loc} Grand Prix', '{loc} 200' /* (e50+, Ovale/Meilenrennen) */,
             '{loc} Classic', '{loc} Trophy Race' /* (e50+) */],
        jp: ['{loc} Grand Prix', '{loc} Trophy'],
        br: ['Grande Prêmio de {loc}', 'Copa {loc}'],
        es: ['Gran Premio de {loc}', 'Copa de {loc}' /* (e50+) */],
        at: ['Großer Preis von {loc}', 'Flugplatzrennen {loc}' /* (e50+) */, '{loc}-Pokal' /* (e50+) */],
        ch: ['Großer Preis von {loc}', 'Grand Prix de {loc}', 'Preis von {loc}' /* (e50+) */],
        be: ['Grand Prix de {loc}', 'Grote Prijs van {loc}', 'Coupe de {loc}' /* (e50+) */],
        nl: ['Grote Prijs van {loc}', '{loc} Grand Prix'],
        pt: ['Grande Prémio de {loc}', 'Taça de {loc}' /* (e50+) */],
        se: ['{loc} Grand Prix', '{loc}loppet' /* (e50+) */],
        fi: ['{loc} Grand Prix', '{loc}-ajot' /* (e50+) */],
        hu: ['{loc} Nagydíj', '{loc} Grand Prix'],
        cz: ['Grand Prix {loc}', '{loc} Grand Prix'],
        ru: ['Grand Prix {loc}', '{loc} Grand Prix'],
        tr: ['{loc} Grand Prix', 'Grand Prix of {loc}'],
        za: ['{loc} Grand Prix', '{loc} Trophy' /* (e50+) */],
        ar: ['Gran Premio de {loc}', 'Copa {loc}' /* (e50+) */, 'Premio {loc}' /* (e50+) */],
        mx: ['Gran Premio de {loc}', 'Copa {loc}'],
        ca: ['{loc} Grand Prix', 'Grand Prix de {loc}'],
        au: ['{loc} Grand Prix', '{loc} 100' /* (e50+) */, '{loc} Cup'],
        nz: ['{loc} Grand Prix', '{loc} Trophy' /* (e50+) */],
        cn: ['{loc} Grand Prix', 'Grand Prix of {loc}'],
        kr: ['{loc} Grand Prix', 'Grand Prix of {loc}'],
        in: ['{loc} Grand Prix', 'Grand Prix of {loc}'],
        my: ['{loc} Grand Prix', 'Grand Prix of {loc}'],
        ae: ['{loc} Grand Prix', 'Grand Prix of {loc}']
    }
};

// ============================================================================
// Testfälle (SPEC §6) — Strecke + Rennen aus DEMSELBEN {loc}
// ============================================================================
// IT e50: „Autodromo Nazionale Valdano"      + „Gran Premio di Valdano"
//         „Circuito di Montefiore"           + „Coppa Montefiore"
// IT e10: „Autodromo Internazionale Torrelunga" + „Quantix Gran Premio di Torrelunga"
// DE e50: „Falkenriedring"                   + „Großer Preis von Falkenried"
//         „Lindenfeld-Schleife"              + „Internationales Lindenfeld-Rennen"
// DE e10: „Motorsport-Arena Silberhausen"    + „Volteon Großer Preis von Silberhausen"
// GB e50: „Kingsmoor Aerodrome Circuit"      + „Kingsmoor Trophy"
// GB e10: „Feltonbury International Circuit" + „Skyre Feltonbury Grand Prix"
// US e50: „Redstone Speedway"                + „Redstone 200"
// US e10: „Lakeport International Raceway"   + „Cortexa Lakeport Grand Prix"
// AT e50: „Flugplatzrennen Steinwang"        auf der „Rennstrecke Steinwang"
// SE e62: „Granlundaloppet"                  auf der „Granlundabanan"
// AE e10: „Nexora Wadi Sarab Grand Prix"     auf dem „Wadi Sarab Autodrome"
// ============================================================================
