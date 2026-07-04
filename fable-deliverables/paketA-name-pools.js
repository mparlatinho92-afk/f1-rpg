// ============================================================================
// PAKET A — NAME_POOLS_BY_NATION (Fable-Deliverable, v2 — datenkalibriert)
// Nationskorrekte, regionskohärente, ära-sensible Namens-Pools.
// NUR DATEN — kein Laufzeit-Code. Integration (generateDriver-Umbau) macht Opus.
//
// v2: Gewichte kalibriert am BigQuery-Namens-Datensatz (12,5 Mio. Vornamen- /
// 21,1 Mio. Nachnamen-Zeilen, aggregiert auf Top-400 je Land). Kuratiert wurden:
// weibliche Formen (PL/CZ/RU), Akzent-Duplikate (ES/PT), Expat-Rauschen (FI/CH),
// Kyrillisch→Transliteration (RU), Sprachregions-Zuordnung (CH/BE/CA) und
// Ära-Fenster (Datensatz ist gegenwartslastig → kalibriert primär mid/modern).
// OHNE Datenbasis (fehlen im Datensatz bzw. unbrauchbar kodiert): AUS, NZL, THA,
// MON, VEN, ZIM, CHN, MAR-Vornamen — diese bleiben wissensbasiert.
//
// Schema pro Nation (IOC-Code, identisch zu DECADE_NATION_POOLS):
//   { regions: [ { w: <Regionsgewicht, Summe ~1>,
//                  minYear: <optional: Region existiert erst ab diesem Debütjahr>,
//                  first: [[name,gewicht],...]                      // ära-stabil, ODER
//                  first: { early:[...], mid:[...], modern:[...] }, // ära-sensibel
//                  last:  [[name,gewicht],...] } ] }
// Gewichte: 5 = Allerweltsname, 3 = mittel, 1 = selten/markant.
// Ära-Fenster (Debütjahr des Fahrers): early < 1975, mid 1975–2009, modern >= 2010.
// KERNREGEL: Vor- UND Nachname kommen immer aus DERSELBEN Region (kein "Jacques Müller").
// Pick-Spezifikation + Fallback-Regeln: siehe paketA-pick-spec.md
// ============================================================================

const NAME_POOLS_BY_NATION = {

    // ── Großbritannien (+ britisch-asiatische Region ab 1995, Daten: Khan #8) ──
    GBR: { regions: [
        { w: 0.92,
          first: {
              early:  [['John',5],['Peter',5],['Tony',4],['Mike',4],['Brian',4],['David',4],['Alan',3],['Roy',3],['Ken',3],['Geoff',3],['Ian',3],['Trevor',2],['Cliff',2],['Reg',1],['Archie',1],['Innes',1]],
              mid:    [['David',5],['Paul',5],['Mark',5],['James',4],['Andrew',4],['Richard',4],['Martin',4],['Chris',4],['Stephen',4],['Simon',4],['Gary',3],['Lee',3],['Nigel',3],['Jamie',3],['Johnny',2],['Damon',2]],
              modern: [['Jack',5],['Tom',5],['Ben',5],['Oliver',5],['Harry',5],['Charlie',4],['Will',4],['Josh',4],['Alex',4],['George',4],['Jake',4],['Dan',4],['Ryan',4],['Sam',4],['Callum',3],['Ollie',3]]
          },
          last: [['Smith',5],['Jones',5],['Taylor',4],['Brown',4],['Wilson',4],['Davies',4],['Evans',4],['Walker',4],['Thompson',4],['Roberts',4],['Wright',4],['Hughes',4],['Robinson',4],['White',4],['Green',3],['Wood',3],['Clarke',3],['Edwards',3],['Lewis',3],['Jackson',3],['Cooper',3],['Marshall',3],['Bell',3],['Hill',3],['Watson',3],['Stewart',3],['Hamilton',2],['Hunt',2],['Palmer',2],['Fletcher',2],['Chapman',2],['Herbert',2],['Blundell',1],['Warwick',1]] },
        { w: 0.08, minYear: 1995, // britisch-asiatisch
          first: [['Imran',3],['Jay',3],['Aman',2],['Zain',2],['Aryan',2],['Dev',2],['Kian',2],['Amir',2]],
          last:  [['Khan',4],['Patel',4],['Ahmed',3],['Singh',3],['Ali',3],['Hussain',3],['Shah',3],['Sharma',2]] }
    ] },

    // ── Deutschland ─────────────────────────────────────────────────
    GER: { regions: [ { w: 1,
        first: {
            early:  [['Hans',5],['Karl',4],['Wolfgang',4],['Heinz',4],['Klaus',4],['Jürgen',4],['Günther',3],['Manfred',3],['Dieter',3],['Helmut',3],['Werner',3],['Kurt',3],['Rolf',3],['Gerhard',3],['Willi',2],['Egon',1]],
            mid:    [['Michael',5],['Thomas',5],['Andreas',5],['Christian',5],['Stefan',5],['Frank',5],['Markus',4],['Martin',4],['Sebastian',4],['Alexander',4],['Sven',4],['Marcel',4],['Matthias',4],['Patrick',4],['Tobias',4],['Oliver',4],['Dirk',4],['Ralf',4],['Marco',4],['Dennis',4],['Jörg',3],['Uwe',3],['Timo',2],['Heinz-Harald',1]],
            modern: [['Max',5],['Leon',5],['Jonas',5],['Lukas',5],['Paul',4],['Luca',4],['Finn',4],['Noah',4],['Felix',4],['David',4],['Tim',4],['Niklas',4],['Julian',4],['Elias',4],['Florian',4],['Moritz',3],['Mick',1]]
        },
        last: [['Müller',5],['Schmidt',5],['Schneider',4],['Fischer',4],['Meyer',4],['Weber',4],['Schulz',4],['Wagner',4],['Becker',4],['Hoffmann',4],['Richter',4],['Koch',4],['Bauer',4],['Klein',4],['Wolf',3],['Schäfer',3],['Schröder',3],['Neumann',3],['Schwarz',3],['Krüger',3],['Lange',3],['Braun',3],['Zimmermann',3],['Krause',3],['Lehmann',3],['Hartmann',3],['Werner',3],['Lang',3],['Vogel',3],['Berger',3],['Winkler',2],['Kaufmann',2],['Brandt',2],['Stuck',1]]
    } ] },

    // ── Italien ─────────────────────────────────────────────────────
    ITA: { regions: [ { w: 1,
        first: {
            early:  [['Luigi',5],['Giuseppe',5],['Franco',4],['Carlo',4],['Giovanni',4],['Alberto',3],['Giorgio',3],['Vittorio',3],['Bruno',3],['Sergio',3],['Umberto',3],['Piero',3],['Nino',2],['Gino',2],['Renato',2],['Aldo',2],['Enzo',2]],
            mid:    [['Andrea',5],['Marco',5],['Luca',5],['Francesco',5],['Antonio',5],['Alessandro',5],['Stefano',5],['Roberto',5],['Paolo',5],['Giovanni',4],['Michele',4],['Salvatore',4],['Vincenzo',4],['Fabio',4],['Mario',4],['Massimo',4],['Daniele',4],['Angelo',4],['Claudio',4],['Maurizio',4],['Riccardo',4],['Nicola',4],['Gabriele',3],['Emanuele',3],['Ivan',3],['Pierluigi',2]],
            modern: [['Matteo',5],['Lorenzo',5],['Francesco',5],['Leonardo',4],['Alessio',4],['Davide',4],['Antonio',4],['Federico',4],['Gabriele',4],['Simone',4],['Mattia',4],['Tommaso',3],['Riccardo',3],['Edoardo',3],['Giacomo',3],['Kimi',1]]
        },
        last: [['Rossi',5],['Russo',5],['Esposito',5],['Romano',4],['Ferrari',4],['Marino',4],['Bianchi',4],['Greco',4],['Giordano',4],['De Luca',4],['Gallo',4],['Rizzo',4],['Ricci',4],['Caruso',4],['Costa',4],['Ferrara',4],['Santoro',4],['Leone',4],['Colombo',3],['Vitale',3],['Mancini',3],['Conti',3],['Lombardi',3],['Amato',3],['Conte',3],['Moretti',3],['Barbieri',2],['Fontana',2],['Coppola',2],['Villa',2],['Martini',2],['Pagani',1],['Nannini',1]]
    } ] },

    // ── Frankreich (+ maghrebinisch/westafrikanische Region ab 1995) ──
    FRA: { regions: [
        { w: 0.90,
          first: {
              early:  [['Jean',5],['Pierre',5],['Maurice',4],['André',4],['Robert',4],['Jacques',4],['Henri',4],['François',4],['Louis',3],['Guy',3],['Marcel',3],['Bernard',3],['Georges',3],['Claude',3],['Yves',2],['Jo',1]],
              mid:    [['Nicolas',5],['Julien',5],['Philippe',5],['Christophe',5],['Laurent',5],['Alexandre',5],['Olivier',5],['Éric',5],['Pascal',5],['Thierry',5],['Vincent',5],['Guillaume',5],['Patrick',5],['Stéphane',4],['Sébastien',4],['Franck',4],['Alain',4],['Anthony',4],['Antoine',4],['Didier',3],['Jean-Pierre',3],['René',2]],
              modern: [['Hugo',5],['Lucas',5],['Arthur',5],['Maxime',5],['Romain',5],['Paul',4],['Victor',4],['Jules',4],['Léo',4],['Nathan',4],['Enzo',4],['Antoine',4],['Théo',4],['Pierre',4],['Clément',3],['Esteban',2]]
          },
          last: [['Martin',5],['Bernard',4],['Dubois',4],['Thomas',4],['Petit',4],['Durand',4],['Richard',4],['Robert',4],['Simon',4],['Laurent',4],['Michel',4],['Leroy',4],['Moreau',4],['Lefebvre',4],['Vincent',4],['Bertrand',4],['Roux',3],['Fournier',3],['Girard',3],['Morel',3],['Mercier',3],['Blanc',3],['Garnier',3],['Lemaire',3],['Marchand',3],['Chevalier',2],['Renard',2],['Beaumont',2],['Vasseur',2],['Perrot',2],['Delacroix',1],['Arnoux',1]] },
        { w: 0.10, minYear: 1995, // maghrebinisch/westafrikanisch (Daten: Mohamed #23, Diallo/Camara Top-30)
          first: [['Mehdi',3],['Karim',3],['Mohamed',3],['Yanis',3],['Rayan',3],['Sami',2],['Bilal',2],['Ibrahim',2]],
          last:  [['Benali',3],['Diallo',3],['Traoré',3],['Saidi',2],['Cherif',2],['Haddad',2],['Camara',2],['Keita',2],['Sylla',2],['Cissé',2]] }
    ] },

    // ── USA (Schmelztiegel; Hispanic-Anteil modern stark — Daten: Jose #1) ──
    USA: { regions: [ { w: 1,
        first: {
            early:  [['Bill',5],['Jim',5],['Bob',5],['Jack',4],['Dan',4],['Sam',3],['Tony',3],['Eddie',3],['Johnny',3],['Don',3],['Chuck',2],['Gene',2],['Lee',2],['Richie',2],['Walt',1],['Rodger',1]],
            mid:    [['Michael',5],['John',5],['David',5],['Chris',4],['Mark',4],['Scott',4],['Jeff',4],['Brian',4],['Kevin',4],['Eric',4],['Anthony',4],['Jason',4],['Ryan',3],['Josh',3],['Justin',3],['Brad',3],['Kyle',3],['Danny',3],['Casey',2],['Chad',2]],
            modern: [['Tyler',4],['Austin',4],['Mason',4],['Ethan',4],['Jake',4],['Zach',4],['Connor',4],['Dylan',4],['Liam',4],['Noah',4],['José',3],['Juan',3],['Carlos',3],['Luis',3],['Chase',3],['Cole',3],['Logan',3],['Colton',3],['Hunter',3],['Josef',1]]
        },
        last: [['Smith',5],['Johnson',5],['Williams',4],['Brown',4],['Jones',4],['Garcia',4],['Miller',4],['Davis',4],['Wilson',4],['Anderson',4],['Taylor',4],['Moore',4],['Martinez',3],['Hernandez',3],['Rodriguez',3],['Lopez',3],['Jackson',3],['White',3],['Harris',3],['Thompson',3],['Robinson',3],['Clark',3],['Lewis',3],['Walker',3],['Hall',3],['Carter',3],['Rivera',2],['Young',2],['Allen',2],['Lee',2],['Mitchell',2],['Parker',2],['Turner',2],['Nguyen',1],['Patel',1]]
    } ] },

    // ── Brasilien ───────────────────────────────────────────────────
    BRA: { regions: [ { w: 1,
        first: {
            early:  [['José',5],['Carlos',5],['Luiz',4],['Antônio',4],['Francisco',4],['Paulo',4],['Roberto',4],['Sérgio',3],['Marcos',3],['Fernando',3],['Ricardo',3],['Nelson',2],['Wilson',2],['Chico',2],['Emerson',1],['Ayrton',1]],
            mid:    [['Marcos',5],['Carlos',5],['Paulo',5],['Marcelo',5],['Bruno',5],['Felipe',5],['Rodrigo',5],['Eduardo',5],['André',4],['Gustavo',4],['Thiago',4],['Ricardo',4],['Fernando',4],['Leandro',4],['Anderson',4],['Diego',4],['Luciano',3],['Maurício',3],['Cristiano',3],['Rubens',2],['Tarso',1]],
            modern: [['Gabriel',5],['Lucas',5],['Pedro',5],['Rafael',5],['Matheus',5],['João',5],['Enzo',4],['Felipe',4],['Guilherme',4],['Arthur',4],['Miguel',4],['Caio',3],['Vinícius',3],['Davi',3],['Bernardo',3],['Heitor',2]]
        },
        last: [['Silva',5],['Santos',5],['Oliveira',4],['Souza',4],['Lima',4],['Alves',4],['Rodrigues',4],['Sousa',4],['Ferreira',4],['Pereira',4],['Costa',3],['Gomes',3],['Martins',3],['Soares',3],['Ribeiro',3],['Fernandes',3],['Nascimento',3],['Lopes',3],['Carvalho',3],['Almeida',3],['Vieira',3],['Araújo',3],['Barbosa',3],['Rocha',3],['Andrade',3],['Dias',3],['Cardoso',3],['Nunes',2],['Freitas',2],['Moraes',2],['Teixeira',2],['Camargo',2],['Duarte',2],['Fonseca',2],['Diniz',1]]
    } ] },

    // ── Japan (Ausgabe-Format: Vorname Nachname, z.B. "Kenji Sato") ──
    JPN: { regions: [ { w: 1,
        first: {
            early:  [['Hiroshi',4],['Kenji',3],['Akira',3],['Masahiro',3],['Takao',2],['Osamu',2],['Yoshio',2],['Shigeru',2],['Kazuyoshi',2],['Noritake',1],['Kunimitsu',1],['Tetsu',1]],
            mid:    [['Takashi',5],['Yusuke',4],['Daisuke',4],['Satoshi',4],['Hiroyuki',4],['Hiroki',4],['Ryo',4],['Atsushi',4],['Makoto',4],['Takahiro',4],['Naoki',4],['Takuya',4],['Koji',4],['Jun',3],['Ken',3],['Keisuke',3],['Yuji',3],['Tatsuya',3],['Takayuki',3],['Shinji',3],['Hideki',3],['Masanori',2],['Satoru',2],['Ukyo',1],['Toranosuke',1]],
            modern: [['Yuki',4],['Yuta',4],['Ren',4],['Haruto',4],['Sota',4],['Riku',4],['Yuto',4],['Kaito',4],['Takumi',3],['Kazuki',3],['Sho',3],['Kenta',3],['Daiki',3],['Ayumu',2],['Naoya',2],['Kamui',1],['Ritomo',1]]
        },
        last: [['Sato',5],['Suzuki',5],['Takahashi',5],['Tanaka',5],['Watanabe',5],['Ito',5],['Yamamoto',5],['Nakamura',5],['Kobayashi',5],['Saito',5],['Kato',4],['Yoshida',4],['Yamada',4],['Sasaki',4],['Matsumoto',4],['Inoue',4],['Kimura',4],['Hayashi',4],['Yamaguchi',4],['Shimizu',4],['Mori',4],['Abe',4],['Ikeda',4],['Hashimoto',4],['Yamashita',4],['Maeda',4],['Sakamoto',4],['Matsuda',3],['Fujita',2],['Ogawa',2],['Okada',2],['Murakami',2],['Nakajima',2],['Hoshino',1]]
    } ] },

    // ── Argentinien ─────────────────────────────────────────────────
    ARG: { regions: [ { w: 1,
        first: {
            early:  [['Juan',5],['Carlos',5],['José',4],['Roberto',4],['Jorge',4],['Oscar',3],['Alberto',3],['Ricardo',3],['Alejandro',3],['Miguel',3],['Raúl',3],['Néstor',2],['Rodolfo',2],['Onofre',1],['Froilán',1],['Clemar',1]],
            mid:    [['Juan',5],['Carlos',5],['Jorge',5],['Pablo',5],['Diego',5],['Marcelo',5],['Alejandro',5],['Gustavo',5],['Cristian',5],['Daniel',5],['Sebastián',4],['Matías',4],['Nicolás',4],['Martín',4],['Lucas',4],['Sergio',4],['Javier',4],['Fernando',4],['Ariel',4],['Agustín',4],['Esteban',3],['Federico',3],['Gonzalo',3],['Facundo',3],['Franco',3],['Gastón',2]],
            modern: [['Mateo',4],['Santiago',4],['Tomás',4],['Benjamín',3],['Joaquín',3],['Bautista',3],['Lautaro',3],['Thiago',3],['Franco',3],['Felipe',3],['Juan Manuel',2],['Valentino',2],['Bruno',2],['Máximo',2],['Ciro',1]]
        },
        last: [['González',5],['Rodríguez',5],['Gómez',5],['López',5],['Fernández',5],['Martínez',5],['Díaz',5],['Pérez',5],['Romero',5],['García',4],['Sánchez',4],['Sosa',4],['Torres',4],['Flores',4],['Álvarez',4],['Ramírez',4],['Acosta',4],['Rojas',4],['Benítez',4],['Ruiz',4],['Medina',4],['Castro',4],['Herrera',4],['Suárez',4],['Giménez',4],['Ledesma',1],['Zunino',1],['Traverso',1]]
    } ] },

    // ── Spanien (3 Regionen: Kastilisch/allgemein, Katalanisch, Baskisch) ──
    ESP: { regions: [
        { w: 0.80,
          first: {
              early:  [['José',5],['Antonio',5],['Francisco',5],['Manuel',4],['Luis',4],['Juan',4],['Pedro',4],['Miguel',4],['Carlos',4],['Rafael',3],['Ángel',3],['Alfonso',2],['Emilio',2],['Vicente',2],['Paco',2],['Joaquín',2]],
              mid:    [['Javier',5],['David',5],['Carlos',5],['Daniel',4],['Sergio',4],['Fernando',4],['Jorge',4],['Alberto',4],['Ángel',4],['Alejandro',4],['Rafael',4],['Óscar',4],['Iván',4],['Raúl',4],['Diego',4],['José Luis',3],['José Antonio',3],['Rubén',3],['Álvaro',3],['Adrián',3],['Jaime',2],['Gonzalo',2]],
              modern: [['Alejandro',4],['Pablo',4],['Hugo',4],['Martín',4],['Lucas',4],['Diego',4],['Mario',3],['Marcos',3],['Adrián',3],['Álex',3],['Manuel',3],['Leo',2],['Bruno',2],['Izan',2],['Nico',2],['Pepe',1]]
          },
          last: [['García',5],['Rodríguez',5],['López',5],['Martínez',5],['González',5],['Fernández',5],['Sánchez',5],['Pérez',5],['Gómez',4],['Martín',4],['Ruiz',4],['Moreno',4],['Jiménez',4],['Hernández',4],['Díaz',4],['Muñoz',4],['Romero',4],['Álvarez',4],['Torres',3],['Alonso',3],['Navarro',3],['Ramos',3],['Gil',2],['Vázquez',2],['Serrano',2],['Molina',2],['Sainz',1],['Gené',1]] },
        { w: 0.13, // Katalonien
          first: [['Jordi',4],['Marc',4],['Xavi',3],['Gerard',3],['Arnau',3],['Pau',3],['Oriol',2],['Aleix',2],['Pol',2],['Roger',2]],
          last:  [['Puig',3],['Vila',3],['Serra',3],['Ferrer',3],['Roca',3],['Soler',3],['Font',2],['Bosch',2],['Mas',2],['Casals',2]] },
        { w: 0.07, // Baskenland
          first: [['Mikel',4],['Iker',4],['Ander',3],['Unai',3],['Aitor',3],['Jon',3],['Asier',2],['Gorka',2]],
          last:  [['Etxeberria',3],['Agirre',3],['Ibarra',3],['Zubizarreta',2],['Urrutia',2],['Garmendia',2],['Mendizabal',2],['Otegi',1]] }
    ] },

    // ── Niederlande ─────────────────────────────────────────────────
    NED: { regions: [ { w: 1,
        first: {
            early:  [['Jan',5],['Henk',4],['Piet',3],['Kees',3],['Wim',3],['Theo',3],['Bert',3],['Cor',2],['Jaap',2],['Dries',1],['Carel',1],['Gijs',1]],
            mid:    [['Jeroen',4],['Mark',4],['Rob',4],['Dennis',4],['Marcel',4],['Paul',4],['Johan',4],['Patrick',4],['Frank',4],['Bart',4],['Marco',4],['Bas',4],['Erik',4],['Martijn',4],['Sander',4],['Robert',3],['Richard',3],['Tim',3],['Ronald',3],['Willem',3],['Tom',3],['Jos',2],['Christijan',1]],
            modern: [['Daan',4],['Sem',4],['Lars',4],['Max',4],['Luuk',4],['Thijs',3],['Sven',3],['Finn',3],['Milan',3],['Bram',3],['Niek',2],['Joris',2],['Rik',2],['Teun',2]]
        },
        last: [['Jansen',5],['De Jong',5],['De Vries',5],['Van den Berg',5],['Bakker',5],['Van Dijk',5],['Visser',5],['Smit',5],['Meijer',4],['Mulder',4],['De Boer',4],['De Groot',4],['Bos',4],['Vos',4],['Peters',4],['Hendriks',4],['Dekker',4],['Brouwer',4],['Van Leeuwen',4],['De Wit',4],['Smits',4],['Dijkstra',4],['De Graaf',3],['Van der Meer',3],['Van der Linden',3],['De Haan',3],['Kok',3],['Kuipers',2],['Willems',2],['Hoekstra',2],['Koopman',2],['Lammers',1]]
    } ] },

    // ── Belgien (2 Regionen: Wallonie/frankophon, Flandern) ─────────
    BEL: { regions: [
        { w: 0.55, // frankophon
          first: {
              early:  [['Jean',4],['Pierre',4],['Paul',3],['Georges',3],['André',3],['Olivier',3],['Alain',3],['Lucien',2],['Willy',2],['Jacky',2]],
              mid:    [['Michel',4],['Philippe',4],['Nicolas',4],['Christophe',4],['Olivier',4],['Éric',4],['Alain',4],['Vincent',4],['Kevin',4],['David',4],['Thierry',3],['Laurent',3],['Marc',3],['Bertrand',2]],
              modern: [['Lucas',4],['Hugo',4],['Noah',4],['Louis',4],['Arthur',4],['Nathan',3],['Théo',3],['Maxime',3]]
          },
          last: [['Dupont',4],['Dubois',4],['Lambert',4],['Leroy',3],['Simon',3],['Denis',3],['Lejeune',3],['Martin',3],['Collard',2],['Gérard',2],['Charlier',2],['Renard',2],['Georges',2],['Massart',1]] },
        { w: 0.45, // Flandern
          first: {
              early:  [['Jos',3],['Herman',3],['Frans',3],['Marcel',3],['Luc',3],['Jef',2],['Willy',2],['Hugo',2]],
              mid:    [['Tom',4],['Bart',4],['Jan',4],['Peter',4],['Johan',4],['Dirk',4],['Steven',4],['Koen',3],['Kris',3],['Wim',3],['Geert',3],['Stijn',3]],
              modern: [['Arne',3],['Wout',3],['Lars',3],['Milan',3],['Seppe',2],['Senne',2],['Thibo',2],['Stoffel',1]]
          },
          last: [['Peeters',5],['Janssens',5],['Maes',5],['Jacobs',5],['Mertens',5],['Willems',4],['Claes',4],['Wouters',4],['Goossens',4],['Vermeulen',4],['De Smet',4],['Hermans',4],['Pauwels',4],['Aerts',3],['Michiels',3],['Martens',3],['Smets',3],['De Vos',3],['Claeys',3],['Van Damme',2],['Segers',2]] }
    ] },

    // ── Schweiz (4 Regionen: DE / FR / IT / portugiesische Diaspora ab 2000) ──
    // Daten-Befund: Silva/Santos/Ferreira in den CH-Top-6 — grösste Einwanderergruppe.
    SUI: { regions: [
        { w: 0.52, // Deutschschweiz
          first: {
              early:  [['Hans',4],['Peter',4],['Kurt',3],['Heinz',3],['Bruno',3],['Ernst',3],['Walter',3],['Rudolf',2],['Fritz',2],['Jo',1]],
              mid:    [['Daniel',4],['Thomas',4],['Michael',4],['Patrick',4],['Stefan',4],['Markus',4],['Andreas',4],['Marcel',3],['Urs',3],['Martin',3],['Pascal',3],['Adrian',3],['Simon',3],['Roger',2],['Beat',2],['Reto',2]],
              modern: [['Luca',4],['Nico',3],['Jan',3],['Noah',3],['Fabio',3],['Joel',3],['Levin',2],['Silvan',2]]
          },
          last: [['Müller',5],['Meier',5],['Schmid',5],['Keller',4],['Weber',4],['Schneider',4],['Huber',4],['Steiner',4],['Gerber',4],['Brunner',4],['Frei',4],['Baumann',4],['Moser',3],['Fischer',3],['Zürcher',2],['Bühler',2],['Widmer',2]] },
        { w: 0.31, // Romandie
          first: {
              early:  [['Claude',3],['Michel',3],['Jean',3],['Pierre',3],['André',3],['Joseph',2]],
              mid:    [['Alain',3],['Olivier',3],['Laurent',3],['Sébastien',3],['Nicolas',3],['Didier',2],['Cédric',2]],
              modern: [['Romain',3],['Louis',3],['Hugo',3],['Nathan',3],['Gabriel',3],['Théo',2]]
          },
          last: [['Favre',3],['Girard',3],['Martin',3],['Rochat',2],['Bonvin',2],['Chevalley',2],['Duc',2],['Rossier',2],['Perret',2],['Monnier',2],['Grandjean',2],['Berney',1]] },
        { w: 0.11, // italienische Schweiz (Tessin)
          first: [['Gianni',3],['Marco',3],['Alberto',3],['Franco',3],['Matteo',3],['Luca',3],['Loris',2],['Alessio',2]],
          last:  [['Bernasconi',3],['Rossi',3],['Bianchi',2],['Ferrari',2],['Fontana',2],['Galli',2],['Crivelli',1],['Pedrazzini',1]] },
        { w: 0.06, minYear: 2000, // portugiesische Diaspora
          first: [['Bruno',3],['Tiago',3],['Ricardo',3],['Fábio',3],['Diogo',2],['Nuno',2]],
          last:  [['Silva',4],['Santos',4],['Ferreira',3],['Pereira',3],['Rodrigues',3],['Costa',3],['Lopes',2],['Martins',2]] }
    ] },

    // ── Österreich ──────────────────────────────────────────────────
    AUT: { regions: [ { w: 1,
        first: {
            early:  [['Hans',4],['Karl',4],['Franz',4],['Helmut',3],['Dieter',3],['Kurt',3],['Harald',3],['Gerhard',3],['Josef',3],['Johann',3],['Otto',2],['Rupert',2],['Jochen',2],['Niki',1]],
            mid:    [['Michael',5],['Thomas',5],['Christian',5],['Andreas',5],['Markus',5],['Martin',5],['Stefan',5],['Peter',5],['Franz',4],['Wolfgang',4],['Gerhard',4],['Christoph',4],['Patrick',4],['Alexander',4],['Manuel',4],['Mario',4],['Robert',4],['Manfred',4],['Bernhard',3],['Roland',3],['Norbert',2]],
            modern: [['Lukas',4],['Felix',4],['David',4],['Maximilian',4],['Leon',4],['Florian',4],['Dominik',4],['Tobias',3],['Simon',3],['Paul',3],['Jakob',3],['Elias',3],['Fabian',3],['Julian',3]]
        },
        last: [['Gruber',5],['Huber',5],['Bauer',5],['Müller',5],['Wagner',5],['Steiner',5],['Moser',5],['Berger',5],['Pichler',5],['Hofer',5],['Mayer',5],['Leitner',5],['Eder',5],['Fuchs',5],['Maier',4],['Winkler',4],['Fischer',4],['Schmid',4],['Schwarz',4],['Schneider',4],['Weber',4],['Egger',4],['Reiter',4],['Mayr',4],['Brunner',3],['Lang',3],['Lechner',1],['Stohr',1]]
    } ] },

    // ── Schweden ────────────────────────────────────────────────────
    SWE: { regions: [ { w: 1,
        first: {
            early:  [['Lars',4],['Gunnar',3],['Bengt',3],['Lennart',3],['Sven',3],['Bo',3],['Erik',3],['Torsten',2],['Åke',2],['Ulf',2],['Nils',2],['Ronnie',1]],
            mid:    [['Johan',5],['Anders',5],['Peter',5],['Fredrik',5],['Magnus',5],['Mikael',5],['Andreas',5],['Jonas',5],['Martin',5],['Stefan',5],['Daniel',5],['Henrik',4],['Erik',4],['Per',4],['Thomas',4],['Mattias',4],['Mats',4],['Patrik',4],['Marcus',4],['Björn',4],['Joakim',3],['Niclas',3],['Tomas',3],['Kenny',2]],
            modern: [['Oscar',4],['William',4],['Elias',4],['Lucas',4],['Emil',4],['Hugo',3],['Liam',3],['Noah',3],['Viktor',3],['Isak',3],['Felix',3],['Marcus',3]]
        },
        last: [['Andersson',5],['Johansson',5],['Nilsson',5],['Karlsson',5],['Larsson',5],['Eriksson',5],['Persson',4],['Svensson',4],['Olsson',4],['Gustafsson',4],['Pettersson',4],['Jonsson',4],['Carlsson',4],['Jansson',3],['Hansson',3],['Bengtsson',3],['Lindberg',3],['Lindgren',3],['Magnusson',3],['Jönsson',3],['Lindström',3],['Lundberg',3],['Lindqvist',2],['Berg',2],['Lundgren',2],['Axelsson',2],['Holm',2],['Ekström',1],['Brack',1]]
    } ] },

    // ── Finnland (2 Regionen: finnisch, finnlandschwedisch – à la Rosberg) ──
    FIN: { regions: [
        { w: 0.90,
          first: {
              early:  [['Timo',3],['Juhani',3],['Kari',3],['Matti',3],['Pentti',2],['Hannu',2],['Mauri',2],['Esko',2],['Seppo',2],['Leo',2],['Keijo',1]],
              mid:    [['Mikko',5],['Juha',5],['Antti',5],['Mika',5],['Ville',5],['Janne',5],['Jari',5],['Sami',5],['Jani',5],['Jukka',5],['Matti',4],['Marko',4],['Teemu',4],['Pekka',4],['Petri',4],['Toni',4],['Jussi',4],['Ari',4],['Markku',3],['Timo',3],['Hannu',3],['Joni',3],['Kimi',1]],
              modern: [['Elias',4],['Aleksi',4],['Niko',4],['Onni',3],['Eino',3],['Leevi',3],['Oskari',3],['Väinö',2],['Juuso',2],['Eemil',2],['Miika',2],['Valtteri',1]]
          },
          last: [['Virtanen',5],['Korhonen',5],['Nieminen',5],['Mäkinen',5],['Mäkelä',5],['Laine',5],['Koskinen',5],['Heikkinen',5],['Hämäläinen',5],['Lehtonen',5],['Järvinen',5],['Lehtinen',5],['Saarinen',5],['Salminen',4],['Niemi',4],['Heikkilä',4],['Heinonen',4],['Salonen',4],['Kinnunen',4],['Salo',4],['Jokinen',4],['Rantanen',4],['Tuominen',4],['Mattila',4],['Turunen',4],['Karjalainen',4],['Aaltonen',2],['Lehto',2],['Ahonen',2],['Kanerva',1]] },
        { w: 0.10, // finnlandschwedisch
          first: [['Marcus',3],['Henrik',3],['Axel',3],['Oscar',3],['Emil',3],['Kim',2],['Kevin',2],['Niclas',2]],
          last:  [['Lindström',3],['Nyman',3],['Johansson',3],['Holmberg',2],['Backman',2],['Sundqvist',2],['Westerlund',2],['Blomqvist',2]] }
    ] },

    // ── Dänemark ────────────────────────────────────────────────────
    DEN: { regions: [ { w: 1,
        first: {
            early:  [['Jens',3],['Ole',3],['Per',3],['Niels',3],['Erik',3],['Henning',2],['Kurt',2],['Poul',2],['Bent',2],['Tom',2]],
            mid:    [['Michael',5],['Thomas',5],['Peter',5],['Martin',5],['Henrik',5],['Lars',5],['Christian',5],['Morten',5],['Jesper',5],['Søren',5],['Anders',5],['Jan',5],['Kim',4],['Jacob',4],['Kasper',4],['Claus',4],['Per',4],['Jens',4],['Daniel',3],['Nicolas',2]],
            modern: [['Frederik',4],['William',4],['Oscar',4],['Emil',4],['Magnus',4],['Oliver',4],['Christian',4],['Mads',4],['Rasmus',4],['Mikkel',4],['Jonas',4],['Simon',3],['Malthe',3],['Victor',3],['Noah',3],['Kevin',2]]
        },
        last: [['Nielsen',5],['Jensen',5],['Hansen',5],['Andersen',5],['Pedersen',5],['Larsen',4],['Christensen',4],['Sørensen',4],['Rasmussen',4],['Jørgensen',4],['Petersen',4],['Madsen',4],['Kristensen',4],['Olsen',4],['Thomsen',3],['Christiansen',3],['Møller',3],['Poulsen',3],['Johansen',3],['Knudsen',3],['Mortensen',3],['Jakobsen',2],['Mikkelsen',2],['Lund',2],['Vinther',1],['Lundgaard',1]]
    } ] },

    // ── Australien (keine Datenbasis — wissensbasiert) ──────────────
    AUS: { regions: [ { w: 1,
        first: {
            early:  [['Jack',4],['Frank',3],['Alan',3],['Ken',3],['Ron',3],['Bill',3],['Paul',3],['Keith',2],['Doug',2],['Les',2],['Tim',2],['Vern',1]],
            mid:    [['Mark',4],['David',4],['Daniel',4],['James',4],['Michael',4],['Craig',3],['Wayne',3],['Brett',3],['Shane',3],['Jason',3],['Ryan',3],['Scott',3],['Cameron',3],['Troy',2]],
            modern: [['Jack',4],['Oscar',4],['Liam',4],['Noah',3],['Lachlan',3],['Cooper',3],['Riley',3],['Ethan',3],['Harrison',3],['Mitch',3],['Hunter',2],['Flynn',2],['Kai',2],['Broc',1]]
        },
        last: [['Smith',5],['Jones',4],['Williams',4],['Brown',4],['Wilson',4],['Taylor',4],['Johnson',3],['White',3],['Martin',3],['Anderson',3],['Thompson',3],['Walker',3],['Kelly',3],['Murphy',3],['Campbell',3],['Harvey',2],['Mitchell',2],['Stewart',2],['Ryan',2],['McLaughlin',2],['O\'Brien',2],['Hartley',1],['Longhurst',1]]
    } ] },

    // ── Neuseeland (keine Datenbasis — wissensbasiert) ──────────────
    NZL: { regions: [ { w: 1,
        first: {
            early:  [['Chris',3],['Graham',2],['Tony',2],['Ross',2],['Graeme',2],['Ian',2],['Bob',2],['Bruce',2],['Howden',1],['Denny',1]],
            mid:    [['Scott',3],['Craig',3],['Greg',3],['Simon',3],['Andrew',3],['Matthew',3],['Daniel',3],['Mark',3],['Shane',2],['Brendon',2]],
            modern: [['Liam',3],['Callum',3],['Oliver',3],['Ryan',3],['Marcus',2],['Hunter',2],['Mitchell',2],['Louis',2],['Flynn',2],['Jaxon',1]]
        },
        last: [['Smith',4],['Wilson',3],['Williams',3],['Brown',3],['Taylor',3],['Anderson',3],['Walker',3],['Clark',3],['Thomas',2],['Harris',2],['Scott',2],['Mitchell',2],['Campbell',2],['Stewart',2],['McKenzie',2],['McRae',1],['O\'Sullivan',1],['Amon',1]]
    } ] },

    // ── Kanada (3 Regionen: anglophon, Québec, Neukanadier ab 2000) ──
    // Daten-Befund: Singh/Patel/Lee/Wong/Khan dominieren die modernen CA-Nachnamen.
    CAN: { regions: [
        { w: 0.55,
          first: {
              early:  [['John',4],['George',3],['Peter',3],['Bill',3],['David',3],['Al',2],['Ron',2],['Eppie',1]],
              mid:    [['David',4],['Michael',4],['Mike',4],['Chris',4],['Kevin',4],['Ryan',4],['Andrew',4],['Jason',4],['Mark',4],['Scott',3],['Paul',3],['Greg',3],['Matt',3],['Justin',3],['Brian',3],['Adam',3]],
              modern: [['Liam',3],['Ethan',3],['Owen',3],['Noah',3],['Jacob',3],['Lucas',3],['Tyler',3],['Lance',1]]
          },
          last: [['Smith',4],['Brown',4],['Wilson',3],['Campbell',3],['Stewart',3],['MacDonald',3],['Taylor',3],['Anderson',3],['Johnson',3],['Williams',3],['Scott',2],['Ross',2],['Murray',2],['Fraser',2],['Graham',2],['Hill',2]] },
        { w: 0.33, // Québec
          first: {
              early:  [['Jean',3],['Claude',3],['Jacques',3],['Marcel',2],['Richard',2],['Gilles',2]],
              mid:    [['Patrick',3],['Alexandre',3],['Éric',3],['Stéphane',3],['Mathieu',3],['Sylvain',2]],
              modern: [['Félix',3],['Olivier',3],['Nathan',3],['Samuel',3],['Xavier',2],['Émile',2]]
          },
          last: [['Tremblay',4],['Gagnon',3],['Roy',3],['Côté',3],['Bouchard',3],['Gauthier',3],['Morin',2],['Lavoie',2],['Fortin',2],['Bergeron',2],['Pelletier',2],['Villeneuve',1]] },
        { w: 0.12, minYear: 2000, // Neukanadier (südasiatisch/ostasiatisch)
          first: [['Ryan',3],['Justin',3],['Kevin',3],['Daniel',3],['Arjun',3],['Raj',2],['Vikram',2],['Nikhil',2]],
          last:  [['Singh',4],['Patel',4],['Gill',3],['Sharma',3],['Khan',3],['Sandhu',3],['Wong',3],['Chan',3],['Lee',3],['Sidhu',2],['Dhaliwal',2],['Brar',2],['Nguyen',2],['Kim',2]] }
    ] },

    // ── Mexiko ──────────────────────────────────────────────────────
    MEX: { regions: [ { w: 1,
        first: {
            early:  [['José',4],['Juan',4],['Carlos',4],['Pedro',3],['Ricardo',3],['Miguel',3],['Jesús',3],['Roberto',3],['Guillermo',2],['Rodolfo',2],['Héctor',2],['Moisés',1]],
            mid:    [['José',5],['Juan',5],['Luis',5],['Carlos',5],['Jesús',5],['Jorge',5],['Alejandro',5],['Miguel',5],['Ángel',5],['Manuel',4],['Eduardo',4],['Fernando',4],['Francisco',4],['Antonio',4],['Javier',4],['Ricardo',4],['Óscar',4],['Pedro',4],['Víctor',4],['Roberto',4],['Alberto',4],['Mario',4],['Sergio',4],['Gerardo',2],['Arturo',2]],
            modern: [['Santiago',4],['Diego',4],['Mateo',4],['Sebastián',4],['Emiliano',3],['Leonardo',3],['Andrés',3],['Daniel',3],['Alexis',2],['Patricio',2],['Emilio',2],['Sergio',2]]
        },
        last: [['Hernández',5],['García',5],['Martínez',5],['López',5],['González',5],['Rodríguez',5],['Pérez',5],['Sánchez',4],['Ramírez',4],['Flores',4],['Torres',4],['Cruz',4],['Morales',4],['Reyes',4],['Gómez',4],['Mendoza',4],['Vázquez',4],['Díaz',4],['Castillo',4],['Ruiz',4],['Aguilar',4],['Ortiz',3],['Jiménez',3],['Gutiérrez',3],['Rojas',2],['Guerrero',2],['Solórzano',1],['Rebaque',1]]
    } ] },

    // ── Südafrika (3 Regionen: anglophon, Afrikaans, afrikanisch ab 1995) ──
    // Daten-Befund: Ndlovu/Dlamini/Khumalo/Nkosi dominieren die modernen ZA-Namen.
    RSA: { regions: [
        { w: 0.40,
          first: {
              early:  [['Tony',3],['Peter',3],['John',3],['Dave',3],['Ian',3],['Neville',2],['Doug',2],['Trevor',2],['Basil',1],['Paddy',1]],
              mid:    [['Gary',3],['Craig',3],['Kevin',3],['Mark',3],['Wayne',2],['Shaun',2],['Brad',2],['Grant',2]],
              modern: [['Kyle',3],['Dylan',3],['Joshua',3],['Matthew',3],['Liam',3],['Jordan',2],['Ethan',2],['Callan',1]]
          },
          last: [['Smith',4],['Brown',3],['Taylor',3],['Wilson',3],['Bennett',2],['Reed',2],['Duncan',2],['Scott',2],['Watson',2],['Harris',2],['Clarke',2],['Foster',2],['Nash',1]] },
        { w: 0.30, // Afrikaans
          first: {
              early:  [['Piet',3],['Johan',3],['Willem',3],['Jan',3],['Hennie',2],['Koos',2],['Danie',2],['Gert',2]],
              mid:    [['Pieter',3],['Jaco',3],['André',3],['Johan',3],['Riaan',2],['Christo',2],['Deon',2],['Ruan',2]],
              modern: [['Ruan',2],['Heinrich',2],['Stefan',2],['Charl',2],['Kyle',2],['Divan',1],['Janco',1],['Wikus',1]]
          },
          last: [['Van der Merwe',4],['Botha',4],['Pretorius',3],['Venter',3],['Du Plessis',3],['Fourie',3],['Nel',3],['Coetzee',3],['Steyn',3],['De Villiers',3],['Kruger',3],['Joubert',2],['Marais',2],['Swanepoel',2],['Viljoen',2],['Du Toit',2]] },
        { w: 0.30, minYear: 1995, // afrikanisch (Zulu/Xhosa/Sotho u.a.)
          first: [['Thabo',5],['Sipho',4],['Bongani',4],['Tshepo',3],['Thabang',3],['Themba',3],['Mpho',3],['Sandile',3],['Siyabonga',3],['Tebogo',3],['Sibusiso',3],['Xolani',2],['Andile',2],['Thulani',2]],
          last:  [['Ndlovu',5],['Dlamini',5],['Khumalo',4],['Nkosi',4],['Mokoena',4],['Sithole',4],['Mkhize',4],['Mahlangu',3],['Zulu',3],['Ngcobo',3],['Mthembu',3],['Dube',3],['Gumede',3],['Khoza',3],['Buthelezi',3],['Ngwenya',3],['Mofokeng',3],['Mbatha',2],['Mhlongo',2]] }
    ] },

    // ── Simbabwe/Rhodesien (60er-Ära; keine Datenbasis) ─────────────
    ZIM: { regions: [ { w: 1,
        first: [['John',3],['Mike',3],['Peter',3],['Sam',2],['Clive',2],['Ray',2],['Ian',2],['Gary',2],['Doug',2],['Brendan',1]],
        last:  [['Smith',3],['Walker',2],['Brown',2],['Fraser',2],['Campbell',2],['Watson',2],['Henderson',2],['Marshall',2],['Reid',2],['Currie',1]]
    } ] },

    // ── Irland ──────────────────────────────────────────────────────
    IRL: { regions: [ { w: 1,
        first: {
            early:  [['Patrick',4],['Michael',4],['John',4],['Seán',3],['Joe',2],['Tommy',2],['Derek',2],['Brendan',2],['Eamonn',2],['Paddy',2]],
            mid:    [['John',5],['David',5],['Michael',5],['Paul',5],['James',4],['Sean',4],['Mark',4],['Brian',4],['Stephen',4],['Kevin',4],['Conor',4],['Shane',4],['Patrick',4],['Martin',4],['Alan',4],['Niall',3],['Liam',3],['Ciarán',3],['Damien',2],['Gary',2]],
            modern: [['Jack',4],['Conor',3],['Cian',3],['Darragh',3],['Seán',3],['Liam',3],['Adam',3],['Daniel',3],['Fionn',2],['Oisín',2]]
        },
        last: [['Murphy',5],['Kelly',5],['Byrne',5],['Ryan',5],['Walsh',5],['Doyle',4],['O\'Brien',4],['Lynch',4],['O\'Connor',4],['Dunne',4],['Murray',4],['McCarthy',4],['Brennan',4],['Daly',4],['Burke',4],['Nolan',4],['O\'Sullivan',4],['Kennedy',4],['Farrell',4],['O\'Neill',4],['Quinn',4],['Carroll',4],['Power',3],['Kavanagh',3],['Gallagher',3],['Fitzgerald',3],['Moore',2],['Flanagan',2],['Watt',1]]
    } ] },

    // ── Portugal ────────────────────────────────────────────────────
    POR: { regions: [ { w: 1,
        first: {
            early:  [['José',5],['António',4],['Manuel',4],['Carlos',4],['Mário',3],['Fernando',3],['Francisco',3],['Joaquim',2],['Américo',1],['Nuno',2]],
            mid:    [['Pedro',5],['João',5],['Carlos',5],['Paulo',5],['Ricardo',5],['Rui',5],['Nuno',5],['Miguel',5],['Tiago',5],['Luís',5],['Bruno',4],['Diogo',4],['Jorge',4],['André',4],['Filipe',4],['Hugo',4],['Daniel',4],['Duarte',2]],
            modern: [['João',4],['Tomás',4],['Francisco',4],['Rodrigo',4],['Afonso',3],['Martim',3],['Santiago',3],['Diogo',3],['Gonçalo',3],['Guilherme',3],['Vasco',2],['Salvador',2]]
        },
        last: [['Silva',5],['Santos',5],['Ferreira',5],['Pereira',5],['Oliveira',4],['Costa',4],['Rodrigues',4],['Martins',4],['Sousa',4],['Fernandes',4],['Gomes',4],['Lopes',4],['Ribeiro',4],['Gonçalves',4],['Marques',4],['Carvalho',4],['Almeida',4],['Pinto',4],['Alves',4],['Dias',4],['Teixeira',4],['Correia',3],['Mendes',3],['Moreira',3],['Soares',3],['Monteiro',2],['Lacerda',1],['Chaves',1]]
    } ] },

    // ── Monaco (2 Regionen; keine Datenbasis) ───────────────────────
    MON: { regions: [
        { w: 0.70,
          first: [['Louis',4],['Arthur',4],['Charles',3],['Olivier',3],['Hugo',3],['Jules',3],['Léo',3],['Maxime',3],['Antoine',3],['Théo',3]],
          last:  [['Blanc',3],['Fontaine',2],['Aubert',2],['Roux',2],['Marchand',2],['Perrin',2],['Girard',2],['Masson',2],['Rey',2],['Barral',1],['Leclerc',1]] },
        { w: 0.30,
          first: [['Marco',3],['Luca',3],['Matteo',3],['Andrea',3],['Stefano',2]],
          last:  [['Grimaldi',3],['Rossi',3],['Marchetti',2],['Bianchi',2],['Ferraro',2]] }
    ] },

    // ── Uruguay ─────────────────────────────────────────────────────
    URU: { regions: [ { w: 1,
        first: [['Carlos',5],['Juan',5],['Daniel',5],['Pablo',5],['Luis',5],['Jorge',5],['Diego',5],['Marcelo',5],['Fernando',5],['José',5],['Martín',5],['Alejandro',5],['Santiago',5],['Gustavo',4],['Matías',4],['Eduardo',4],['Nicolás',4],['Julio',4],['Gabriel',4],['Andrés',4],['Sebastián',4],['Gonzalo',4],['Óscar',3],['Federico',3]],
        last:  [['Rodríguez',5],['González',5],['Martínez',4],['Silva',4],['Fernández',4],['Pérez',4],['García',4],['López',4],['Sosa',4],['Pereira',4],['Olivera',4],['Díaz',4],['Ferreira',4],['Acosta',4],['Suárez',4],['Gómez',4],['Álvarez',4],['Cabrera',4],['Núñez',3],['Correa',3],['Machado',3],['Cardozo',2],['Techera',1]]
    } ] },

    // ── Venezuela (keine Datenbasis — wissensbasiert) ───────────────
    VEN: { regions: [ { w: 1,
        first: {
            early:  [['José',4],['Luis',4],['Carlos',4],['Rafael',3],['Miguel',3],['Jesús',3],['Alejandro',3],['Ricardo',3],['Pedro',2],['Ramón',2]],
            mid:    [['José',4],['Luis',4],['Carlos',3],['Alejandro',3],['Rafael',3],['Ernesto',2],['Óscar',2],['Enrique',2],['Johnny',1],['Giancarlo',1]],
            modern: [['Sebastián',3],['Santiago',3],['Diego',3],['Gabriel',3],['Daniel',3],['Samuel',2],['Adrián',2],['Jesús',2],['Andrés',2],['Manuel',2]]
        },
        last: [['González',4],['Rodríguez',4],['García',4],['Pérez',3],['Hernández',3],['Martínez',3],['Rojas',3],['Blanco',2],['Salazar',2],['Medina',2],['Rivas',2],['Mendoza',2],['Chacón',1],['Torrealba',1]]
    } ] },

    // ── Kolumbien ───────────────────────────────────────────────────
    COL: { regions: [ { w: 1,
        first: {
            early:  [['Juan',4],['Carlos',4],['José',4],['Ricardo',3],['Andrés',3],['Óscar',3],['Roberto',2],['Germán',2],['Álvaro',2],['Camilo',3]],
            mid:    [['Andrés',5],['Juan',5],['Carlos',5],['José',5],['Luis',5],['Jorge',5],['David',4],['Diego',4],['Camilo',4],['Cristian',4],['Alejandro',4],['Óscar',4],['Javier',4],['Miguel',4],['Fernando',4],['Julián',4],['Mauricio',4],['Jairo',4],['William',3],['Juan Pablo',2]],
            modern: [['Sebastián',4],['Santiago',4],['Nicolás',3],['Daniel',3],['Mateo',3],['Samuel',2],['Tomás',2],['Alejandro',3],['David',3],['Emiliano',2]]
        },
        last: [['Rodríguez',5],['López',5],['Gómez',5],['Martínez',5],['García',5],['Pérez',5],['Sánchez',5],['Hernández',5],['González',5],['Ramírez',5],['Díaz',5],['Torres',5],['Rojas',4],['Moreno',4],['Vargas',4],['Muñoz',4],['Ortiz',4],['Castro',4],['Valencia',4],['Quintero',4],['Jiménez',4],['Ruiz',4],['Romero',4],['Gutiérrez',4],['Morales',4],['Restrepo',2],['Ospina',2],['Montoya',1]]
    } ] },

    // ── Russland (transliteriert, Format "Vorname Nachname") ────────
    RUS: { regions: [ { w: 1,
        first: {
            early:  [['Sergei',4],['Vladimir',4],['Andrei',4],['Nikolai',3],['Viktor',3],['Yuri',3],['Boris',2],['Oleg',3],['Igor',3],['Mikhail',4]],
            mid:    [['Alexander',5],['Sergei',5],['Andrei',5],['Alexei',5],['Dmitri',5],['Evgeni',4],['Vladimir',4],['Maxim',4],['Ivan',4],['Igor',4],['Nikolai',4],['Denis',4],['Mikhail',4],['Oleg',4],['Roman',4],['Pavel',4],['Anton',3],['Vitali',3],['Ruslan',3],['Vadim',3],['Yuri',3],['Viktor',3]],
            modern: [['Artem',4],['Maxim',4],['Ivan',4],['Alexander',4],['Kirill',3],['Nikita',3],['Egor',3],['Roman',3],['Ilya',3],['Timur',2],['Matvei',2],['Fedor',2],['Daniil',2]]
        },
        last: [['Ivanov',5],['Smirnov',5],['Kuznetsov',4],['Popov',4],['Petrov',4],['Vasiliev',4],['Sokolov',4],['Volkov',4],['Novikov',4],['Morozov',4],['Lebedev',3],['Kozlov',3],['Pavlov',3],['Orlov',3],['Fedorov',3],['Andreev',3],['Alekseev',3],['Makarov',2],['Nikitin',2],['Zaitsev',2],['Sidorov',2],['Egorov',2],['Belov',2]]
    } ] },

    // ── Polen ───────────────────────────────────────────────────────
    POL: { regions: [ { w: 1,
        first: {
            early:  [['Jan',4],['Andrzej',3],['Krzysztof',4],['Marek',3],['Tomasz',3],['Piotr',4],['Stanisław',2],['Zbigniew',2],['Tadeusz',2],['Ryszard',2]],
            mid:    [['Piotr',5],['Marcin',5],['Krzysztof',5],['Paweł',5],['Tomasz',5],['Michał',5],['Łukasz',5],['Andrzej',5],['Marek',5],['Grzegorz',5],['Adam',5],['Mariusz',4],['Kamil',4],['Robert',4],['Rafał',4],['Jacek',4],['Maciej',4],['Damian',4],['Artur',4],['Dariusz',4],['Sebastian',4],['Dawid',4]],
            modern: [['Jakub',4],['Kacper',4],['Mateusz',4],['Szymon',3],['Filip',3],['Bartosz',3],['Kamil',3],['Aleksander',3],['Antoni',3],['Wojciech',2]]
        },
        last: [['Nowak',5],['Kowalski',4],['Wiśniewski',4],['Wójcik',4],['Kowalczyk',4],['Kamiński',4],['Lewandowski',4],['Zieliński',4],['Szymański',4],['Woźniak',4],['Dąbrowski',4],['Mazur',4],['Kaczmarek',4],['Krawczyk',4],['Wieczorek',3],['Król',3],['Zając',3],['Sikora',3],['Adamczyk',3],['Dudek',3],['Wróbel',3],['Pawlak',3],['Walczak',3],['Michalak',3],['Piotrowski',2],['Grabowski',2],['Jankowski',2]]
    } ] },

    // ── Tschechien ──────────────────────────────────────────────────
    CZE: { regions: [ { w: 1,
        first: {
            early:  [['Jan',4],['Petr',4],['Jiří',4],['Josef',3],['Václav',3],['Karel',3],['Miroslav',3],['František',2],['Zdeněk',2],['Ladislav',2]],
            mid:    [['Petr',5],['Martin',5],['Jan',5],['Tomáš',5],['Pavel',5],['Michal',5],['Jiří',5],['David',4],['Jakub',4],['Lukáš',4],['Josef',4],['Roman',4],['Milan',4],['Jaroslav',4],['Marek',4],['Radek',4],['Karel',4],['Miroslav',4],['Daniel',4],['Aleš',2]],
            modern: [['Jakub',4],['Adam',4],['Lukáš',4],['David',4],['Ondřej',3],['Matyáš',3],['Filip',3],['Vojtěch',3],['Daniel',3],['Marek',3]]
        },
        last: [['Novák',5],['Svoboda',5],['Novotný',5],['Dvořák',5],['Černý',4],['Procházka',4],['Kučera',4],['Veselý',4],['Horák',4],['Němec',4],['Marek',4],['Pokorný',4],['Král',4],['Krejčí',4],['Hájek',4],['Pospíšil',2],['Beneš',2],['Fiala',2],['Sedláček',2],['Urban',2]]
    } ] },

    // ── Ungarn (westliche Namensreihenfolge, wie im Motorsport üblich) ──
    HUN: { regions: [ { w: 1,
        first: {
            early:  [['László',3],['Zoltán',3],['István',3],['Ferenc',3],['János',3],['Gábor',3],['Attila',3],['Sándor',2],['József',3],['Károly',2]],
            mid:    [['László',5],['Gábor',5],['Zoltán',5],['Attila',5],['Tamás',5],['Péter',5],['István',5],['Zsolt',5],['János',5],['Csaba',5],['Ferenc',5],['József',5],['Balázs',5],['Tibor',4],['Sándor',4],['András',4],['Norbert',4],['Krisztián',4],['György',4],['Róbert',4]],
            modern: [['Bence',4],['Máté',4],['Ádám',4],['Dávid',4],['Dániel',4],['Levente',3],['Dominik',3],['Márk',3],['Balázs',3],['Milán',2],['Zalán',2]]
        },
        last: [['Nagy',5],['Kovács',5],['Tóth',5],['Szabó',5],['Horváth',5],['Kiss',5],['Varga',5],['Molnár',4],['Németh',4],['Farkas',4],['Balogh',4],['Papp',4],['Takács',3],['Juhász',3],['Simon',3],['Fekete',3],['Mészáros',2],['Bíró',1]]
    } ] },

    // ── Indien (2 Regionen: Nord, Süd) ──────────────────────────────
    IND: { regions: [
        { w: 0.60, // Nordindien (inkl. muslimischer/Sikh-Namen)
          first: [['Rahul',5],['Ajay',4],['Sanjay',4],['Sunil',4],['Raj',4],['Rajesh',4],['Deepak',4],['Ravi',4],['Amit',4],['Vijay',4],['Manoj',3],['Rakesh',3],['Rohit',3],['Santosh',3],['Ramesh',3],['Ashok',3],['Manish',3],['Vishal',3],['Akash',3],['Sandeep',3],['Arjun',3],['Karan',3],['Vikram',3],['Aditya',3],['Imran',2]],
          last:  [['Kumar',5],['Singh',5],['Sharma',4],['Khan',4],['Yadav',4],['Patel',3],['Das',3],['Gupta',3],['Thakur',3],['Verma',3],['Mehta',3],['Joshi',3],['Ali',2],['Ansari',2],['Mishra',2],['Chauhan',2],['Choudhary',2],['Rana',2],['Kapoor',2],['Malhotra',2],['Bhatia',2]] },
        { w: 0.40, // Südindien
          first: [['Arjun',3],['Karthik',3],['Vijay',3],['Ashwin',3],['Anand',3],['Suresh',3],['Pradeep',2],['Hari',2],['Kiran',2],['Ram',2]],
          last:  [['Reddy',3],['Nair',3],['Menon',3],['Rao',3],['Iyer',2],['Krishnan',2],['Subramaniam',2],['Pillai',2],['Naidu',2],['Karthikeyan',1]] }
    ] },

    // ── Israel ──────────────────────────────────────────────────────
    ISR: { regions: [ { w: 1,
        first: {
            early:  [['David',4],['Moshe',3],['Yossi',3],['Avi',3],['Dan',3],['Uri',3],['Gil',2],['Eyal',2],['Ronen',2],['Chanoch',1]],
            mid:    [['David',4],['Daniel',4],['Avi',4],['Moshe',4],['Yossi',3],['Eli',3],['Guy',3],['Lior',3],['Roy',3],['Tomer',3],['Alon',2],['Eyal',2],['Oren',2],['Nir',2]],
            modern: [['Daniel',4],['Ariel',3],['Itay',3],['Noam',3],['Omer',3],['Yonatan',3],['Roy',3],['Tomer',3],['Ido',2],['Alon',2]]
        },
        last: [['Cohen',5],['Levi',5],['Levy',4],['Mizrahi',3],['Peretz',3],['Friedman',3],['Katz',3],['Biton',3],['Dahan',3],['Avraham',2],['Azoulay',2],['Amar',2],['Ohayon',2],['Shapiro',2],['Ben-David',2],['Malka',2],['Ohana',2],['Nissany',1]]
    } ] },

    // ── Thailand (keine Datenbasis — wissensbasiert) ────────────────
    THA: { regions: [ { w: 1,
        first: [['Somchai',3],['Nattapong',2],['Thanapat',2],['Chai',2],['Anan',2],['Prasit',2],['Kittipol',1],['Pasin',1],['Chayapol',1],['Niran',1],['Alex',1],['Sandy',1]],
        last:  [['Srisawat',2],['Chaiyasit',2],['Rattanakul',2],['Charoensuk',2],['Wongsawat',2],['Sukhum',1],['Kasemsarn',1],['Phromsawan',1],['Bhirombhakdi',1],['Vorachart',1]]
    } ] },

    // ── Marokko (Vornamen-Daten defekt kodiert → wissensbasiert; dient
    //    zugleich als arabischer Regions-Fallback) ─────────────────────
    MAR: { regions: [ { w: 1,
        first: [['Mohammed',4],['Ahmed',3],['Hassan',3],['Karim',3],['Youssef',3],['Omar',3],['Mehdi',3],['Rachid',2],['Samir',2],['Driss',1]],
        last:  [['Alaoui',3],['Benani',2],['El Fassi',2],['Tazi',2],['Benjelloun',2],['El Amrani',2],['Berrada',2],['Idrissi',2],['Alami',2],['Chraibi',1],['Ouazzani',1]]
    } ] },

    // ── Malaysia (2 Regionen: malaiisch, chinesisch-malaysisch) ─────
    MAS: { regions: [
        { w: 0.55, // malaiisch
          first: [['Ahmad',3],['Hafiz',3],['Danial',3],['Khairul',3],['Amirul',3],['Aiman',2],['Syafiq',2],['Nabil',2],['Faris',2],['Amir',2],['Azlan',2],['Izzat',1]],
          last:  [['Ismail',4],['Hassan',4],['Abdullah',4],['Rahman',4],['Ibrahim',4],['Othman',3],['Aziz',3],['Yusof',2],['Omar',2],['Zainal',2],['Hashim',2],['Salleh',2]] },
        { w: 0.45, // chinesisch-malaysisch
          first: [['Alex',3],['Daniel',3],['Kevin',2],['Marcus',2],['Adrian',2],['Nicholas',2],['Wei Ming',2],['Jian Hao',1],['Wei Jie',1],['Brendan',1]],
          last:  [['Tan',5],['Lee',5],['Lim',5],['Wong',5],['Ng',5],['Chong',4],['Chan',4],['Chin',4],['Ong',4],['Yap',4],['Yong',3],['Teo',2],['Goh',2],['Yoong',1]] }
    ] },

    // ── Indonesien ──────────────────────────────────────────────────
    INA: { regions: [ { w: 1,
        first: {
            early:  [['Agus',4],['Budi',4],['Bambang',4],['Eko',3],['Iwan',3],['Hendra',3],['Herman',3],['Rudy',3],['Eddy',3],['Imam',2]],
            mid:    [['Agus',4],['Budi',3],['Hendra',3],['Indra',3],['Andi',3],['Agung',3],['Adi',3],['Wahyu',3],['Eko',3],['Dimas',2],['Fajar',2],['Arya',2]],
            modern: [['Rizky',3],['Aditya',3],['Kevin',2],['Daniel',2],['Dimas',2],['Fajar',2],['Putra',2],['Arya',2],['Bagus',1],['Presly',1]]
        },
        last: [['Wijaya',5],['Gunawan',5],['Setiawan',5],['Santoso',5],['Kurniawan',4],['Susanto',4],['Putra',4],['Hidayat',4],['Wibowo',4],['Nugroho',4],['Saputra',4],['Hartono',4],['Chandra',3],['Halim',3],['Siregar',3],['Salim',3],['Pratama',3],['Kusuma',2],['Widjaja',2],['Tanuwidjaja',1]]
    } ] },

    // ── China (Daten unbrauchbar: englische Spitznamen → wissensbasiert;
    //    Ausgabe westlich gedreht: "Guanyu Zhou"-Stil) ──────────────────
    CHN: { regions: [ { w: 1,
        first: [['Wei',3],['Hao',3],['Kai',3],['Yifan',3],['Ming',2],['Jian',2],['Zihan',2],['Junjie',2],['Bo',2],['Rui',2],['Yuhang',2],['Chenglong',1]],
        last:  [['Wang',5],['Li',5],['Zhang',5],['Liu',4],['Chen',4],['Yang',4],['Zhao',3],['Huang',3],['Zhou',3],['Wu',3],['Xu',3],['Sun',3],['Ma',2],['Zhu',2],['Lin',2],['Guo',2]]
    } ] },

    // ── Estland (2 Regionen: estnisch, russische Minderheit — Daten-Befund:
    //    Aleksandr/Sergei/Ivanov in den EE-Tops) ─────────────────────────
    EST: { regions: [
        { w: 0.75,
          first: [['Martin',4],['Kristjan',4],['Siim',4],['Margus',4],['Andres',4],['Sander',4],['Karl',3],['Markus',3],['Rasmus',3],['Marko',3],['Taavi',3],['Kevin',2],['Sten',2],['Robin',2],['Oliver',2],['Jüri',2],['Ralf',2]],
          last:  [['Tamm',5],['Saar',5],['Kask',5],['Sepp',5],['Mägi',5],['Kukk',4],['Rebane',4],['Ilves',4],['Oja',4],['Koppel',4],['Lepik',4],['Karu',3],['Luik',3],['Kivi',3],['Mets',3],['Kuusk',3],['Peterson',3],['Pärn',3],['Kaasik',2],['Liiv',2],['Ots',2],['Vaher',1]] },
        { w: 0.25, // russischsprachige Minderheit
          first: [['Aleksandr',4],['Sergei',4],['Andrei',4],['Dmitri',4],['Aleksei',4],['Vladimir',3],['Igor',3],['Roman',3],['Oleg',3],['Artur',3],['Maksim',3],['Jevgeni',3],['Pavel',2],['Anton',2]],
          last:  [['Ivanov',4],['Smirnov',3],['Petrov',3],['Kuznetsov',3],['Popov',3],['Volkov',2],['Sokolov',2],['Fjodorov',2],['Nikitin',2],['Orlov',2]] }
    ] },

    // ── INT: neutraler Not-Fallback (international mobile Racing-Namen) ──
    // Greift NUR, wenn eine Nation weder einen Pool noch einen Eintrag in
    // NATION_NAME_FALLBACK hat. Bewusst blass gehalten, keine starke Kulturmarkierung.
    INT: { regions: [ { w: 1,
        first: [['Alex',4],['Daniel',4],['David',4],['Max',3],['Leo',3],['Tom',3],['Sam',3],['Adam',3],['Ben',3],['Marco',2],['Robin',2],['Nico',2]],
        last:  [['Martin',3],['Silva',3],['Costa',3],['Marino',2],['Berg',2],['Novak',2],['Kova',1],['Renner',1],['Sander',2],['Roman',2],['Vidal',2],['Moor',1]]
    } ] }
};

// ── Fallback-Map: pool-lose Nation → kulturell nächstverwandter Pool ──
// Regel: NIE der kulturell falsche Pool. Wenn kein plausibler Verwandter
// existiert (z.B. Korea, Türkei, Griechenland), lieber der neutrale INT-Topf
// als ein markant falscher ("Hans Schmidt" für einen Kirgisen).
const NATION_NAME_FALLBACK = {
    // Lateinamerika (spanischsprachig) → Kolumbien/Argentinien
    'CHI':'ARG','PER':'COL','ECU':'COL','BOL':'COL','PAR':'ARG','CRC':'MEX','GUA':'MEX','PAN':'COL','DOM':'COL','PUR':'MEX','CUB':'MEX',
    // Ex-UdSSR slawisch → Russland; Baltikum → Estland
    'UKR':'RUS','BLR':'RUS','KAZ':'RUS','LAT':'EST','LTU':'EST',
    // Zentralasien/Kaukasus: bewusst NICHT Russland (eigene Namenskultur) → INT
    'KGZ':'INT','UZB':'INT','TJK':'INT','TKM':'INT','AZE':'INT','ARM':'INT','GEO':'INT',
    // Mitteleuropa
    'SVK':'CZE','SLO':'CZE','LUX':'BEL','LIE':'SUI','AND':'ESP','SMR':'ITA','MLT':'ITA',
    // Balkan: keine passenden Pools → INT (eigener südslawischer Pool wäre Folge-Paket)
    'CRO':'INT','SRB':'INT','BIH':'INT','MKD':'INT','MNE':'INT','ALB':'INT','BUL':'INT','ROU':'INT','GRE':'INT','TUR':'INT',
    // Skandinavien-Rest
    'NOR':'DEN','ISL':'SWE',
    // Arabischer Raum → Marokko-Pool (arabische Namen)
    'UAE':'MAR','KSA':'MAR','BRN':'MAR','QAT':'MAR','KUW':'MAR','LBN':'MAR','EGY':'MAR','TUN':'MAR','ALG':'MAR','JOR':'MAR','IRQ':'MAR','LBA':'MAR',
    // Süd-/Südostasien
    'PAK':'IND','BAN':'IND','SRI':'IND','NEP':'IND','SGP':'CHN','HKG':'CHN','TPE':'CHN','MAC':'CHN','PHI':'MEX','VIE':'INT','KOR':'INT',
    // Afrika (anglophon, kolonialgeprägte Rennszene) → RSA; sonst INT
    'KEN':'RSA','NGR':'INT','GHA':'INT','SEN':'FRA','CIV':'FRA','ANG':'POR','MOZ':'POR'
};

// ── Raritäten-Schwänze (implizit Gewicht 1) ─────────────────────────────
// Aus dem BigQuery-Aggregat extrahiert (extract-tails.js) und kuratiert
// (curate-tails.js: weibliche Formen, Diminutive, Kulturfremdes, Akzente).
// r = Region-Index in NAME_POOLS_BY_NATION[nat].regions.
// Merge-Regel (Integration): last → an regions[r].last anhängen (Gewicht 1);
// first → NUR an mid+modern-Fenster anhängen (Datensatz ist gegenwartslastig,
// sonst hieße ein 1955er-Deutscher "Kevin"). Bei ära-flachem first-Array: direkt anhängen.
const NAME_TAILS_BY_NATION = {
    GBR: [
        { r: 0, first: ["Michael","Daniel","Adam","Steve","Andy","Robert","Dave","Joe","Matthew","Matt","Luke","Kevin","Craig","Steven","Scott","Liam","Darren","Jason","Nick","Neil","Stuart","Rob","Colin","Thomas","Lewis"],
          last: ["Williams","Johnson","James","Hall","Harris","Scott","Clark","King","Moore","Turner","Ward","Morgan","Morris","Anderson","Campbell","Young","Harrison","Baker","Allen","Mitchell","Phillips","Davis","Miller","Parker","Price","Shaw","Simpson","Collins","Murray","Carter","Richardson","Cook","Bailey","Gray","Griffiths","Adams","Graham","Richards","Ellis","Cox","Foster","Rose","Robertson","Wilkinson","Russell","Mason","Reid","Matthews","Powell","Rogers","Gibson","Mills","Webb","Owen","Thomson","Holmes","Knight","Barnes","Harvey","Hunter","Stevens","Lloyd","Jenkins","Johnston","Fisher","Butler","Fox","Dixon","Grant","Ross","Pearson","Barker","Andrews","Bradley","Elliott","Kennedy","Reynolds","West","Henderson"] },
    ],
    GER: [
        { r: 0, first: ["Daniel","Peter","Jens","Jan","Bernd","Kevin","Mario","Robert","Sascha","Christoph","Alex","Stephan","Steffen","André","Philipp","Marc","Nico","René","Torsten","Maik","Dominik","Heiko","Holger","Manuel"],
          last: ["Meier","Schmitz","Schulze","Hofmann","Schmitt","König","Peters","Maier","Kaiser","Herrmann","Köhler","Walter","Fuchs","Mayer","Scholz","Möller","Schmid","Schubert","Friedrich","Huber","Weiß","Lorenz","Franke","Engel","Winter","Günther","Hahn","Keller","Beck","Albrecht","Baumann","Sommer","Ludwig","Roth","Otto","Schumacher","Schuster","Paul","Heinrich","Seidel","Hansen","Kraus","Vogt","Graf","Böhm","Schreiber","Voigt","Jäger","Groß","Krämer","Dietrich","Bergmann","Wolff","Horn","Pohl","Jansen","Seifert","Kühn","Schulte","Franz","Lindner","Arnold","Maus","Busch","Haas","Beyer","Ernst","Schumann","Wenzel","Ziegler","Ritter","Petersen","Sauer","Jahn","Berg","Rose","Hermann","Pfeiffer"] },
    ],
    ITA: [
        { r: 0, first: ["Domenico","Mauro","Pietro","Gianluca","Pasquale","Gianni","Fabrizio","Enrico","Raffaele","Filippo","Luciano","Cristian","Massimiliano","Gaetano","Dario","Diego","Alex","Vito","Christian","Mirko","Carmine","Manuel","Ciro","Giancarlo","Marcello"],
          last: ["Bruno","D'Angelo","Longo","Messina","Lombardo","Gentile","Parisi","Fiore","Bianco","Palumbo","De Rosa","Serra","Rinaldi","Ferraro","Grasso","Caputo","Martino","Sorrentino","Barone","Carbone","Basile","Pellegrino","Sanna","D'Amico","De Santis","Romeo","Pagano","Orlando","Ruggiero","Testa","Mariani","De Angelis","Martinelli","Piras","Rosa","Marini","Fusco","Ferri","Morelli","Napoli","D'Agostino","Stella","Catalano","Palmieri","De Simone","Garofalo","Farina","Calabrese","Galli","Mazza","Napolitano","Silvestri","Pinna","Cirillo","Marchetti","Battaglia","Pepe","Costanzo","Valente","Monti","Grimaldi","Pellegrini","Pace","Perrone","Melis","Monaco","Arena","Aiello","Volpe","Viola","Carta","Ferro","Guerra"] },
    ],
    FRA: [
        { r: 0, first: ["David","Thomas","Michel","Kevin","Christian","Daniel","Bruno","Quentin","Mathieu","Florian","Alexis","Marc","Alex","Damien","Arnaud","Frédéric","Dominique","Sylvain","Jérôme","Valentin","Jonathan","Mickaël","Adrien","Fabrice","Benjamin"],
          last: ["Dupont","Nicolas","Legrand","Lambert","Pierre","Muller","Rousseau","Fontaine","Fernandez","Bonnet","Mathieu","Henry","Lucas","Duval","Gauthier","Philippe","Lefèvre","Roussel","Faure","Gautier","Masson","Dumont","Meyer","Joly","Boyer","Rose","Dufour","Caron","Louis","François","Arnaud","Meunier","Leroux","Guillaume","Roy","Brunet","Barbier","Vidal","Brun","Blanchard","Schmitt","Clément","Noël","Dupuis","Lemoine","Gaillard","Leclerc","Giraud","Renaud","Charles","Gérard","Paul","Aubert","Rey","Carpentier","Alexandre","Roche","Picard","Leclercq","Bourgeois","Fabre","Lacroix","Dumas","Lecomte","Hubert","Deschamps","Berger","Rolland","Cohen","Benoît"] },
        { r: 1, first: [],
          last: ["Ndiaye","Diaby","Diarra","Toure","Coulibaly","Fofana","Sow"] },
    ],
    USA: [
        { r: 0, first: ["Daniel","James","Alex","Mike","Robert","Jorge","Miguel","Joe","Jesús","Andrew","Richard","Paul","William","Víctor","Manuel","Antonio","Jonathan","Joseph","Brandon","Matt","Steve","Ángel","Mario","Francisco","Óscar"],
          last: ["González","Pérez","Sánchez","Ramírez","Flores","Torres","Cruz","Gómez","Díaz","Reyes","Morales","Ortiz","Ramos","Mendoza","Castillo","Gutiérrez","Ruiz","Álvarez","Jiménez","Aguilar","Castro","Chávez","Romero","Singh","Herrera","Vásquez","Méndez","Moreno","Vargas","Medina","Guzmán","Fernandez","King","Santos","Vazquez","Mejía","Alvarado","Silva","Salazar","Green","Soto","Scott","James","Gonzales","Contreras","Rojas","Wright","Khan","Estrada","Hill","Kim","Nelson","Guerrero","Ortega","Maldonado","Delgado","Ríos","Adams","Vega","Garza","Sandoval","Santiago","Campbell","Luna","Acosta","Dominguez","Juárez","Espinoza","Molina","Baker","Valdez","Roberts","Cabrera","Edwards","Joseph","Ayala","Munoz","Rose","Evans","Fuentes","Miranda","Avila","Campos","Love","Stewart","Escobar","Figueroa","Shah","Rivas","Márquez"] },
    ],
    BRA: [
        { r: 0, first: ["Daniel","Leonardo","Junior","Alexandre","Fabio","Edson","Adriano","Alex","Marcio","Tiago","Douglas","Mateus","Víctor","Henrique","Renato","Vitor","Samuel","Luis","Ronaldo","Robson","Jefferson","Jorge","Claudio","Igor","Manoel"],
          last: ["Da Silva","Gonçalves","Mendes","Marques","Dos Santos","Batista","Melo","Machado","Santana","Moreira","Moura","Ramos","Medeiros","Bezerra","Borges","Morais","Barros","Brito","Monteiro","Pinheiro","Castro","Farias","Rosa","Dantas","Miranda","Cavalcante","Nogueira","Reis","Tavares","Campos","Silveira","Cruz","Leite","Viana","García","Maia","Xavier","Sales","Queiroz","Macedo","Amorim","Mello","Vasconcelos","Coelho","Siqueira","Cordeiro","Cunha","Azevedo","Aguiar","Albuquerque","Alencar","Pires","Felix","Matos","Paiva","Menezes","Correia","Sampaio","Maciel","Amaral","Torres","Neves","França","Braga","Jesús","Freire","Antunes"] },
    ],
    JPN: [
        { r: 0, first: ["Takeshi","Masaki","Hiroaki","Kentaro","Kohei","Masato","Koichi","Tomohiro","Ryota","Masayuki","Tetsuya","Yasuhiro","Yuya","Kenichi","Kazuhiro","Kei","Shinya","Toru","Masashi","Yuichi","Tsuyoshi","Ryosuke"],
          last: ["Ono","Ishikawa","Aoki","Ishii","Sakai","Ueda","Hasegawa","Nakagawa","Nakano","Kondo","Fujii","Okamoto","Endo","Nishimura","Goto","Takeda","Arai","Takeuchi","Yamazaki","Miura","Fukuda","Tamura","Nakayama","Morita","Harada","Ota","Honda","Wada","Kikuchi","Kaneko","Miyamoto","Hara","Kojima","Miyazaki","Yokoyama","Shimada","Ishida","Shibata","Fujiwara","Masuda","Uchida","Ando","Fujimoto","Hirano","Higa","Ueno","Hirata","Hamada","Taniguchi","Matsui","Kawamura","Maruyama","Noguchi","Murata","Mizuno","Kinoshita","Nagai","Takagi","Kawai","Imai","Matsuo","Kubota","Koyama","Sakurai","Nagata","Takano","Iwasaki","Yamanaka","Yano","Kubo","Fukushima","Takada","Kawasaki","Sano","Uehara","Seki","Sugiyama","Yasuda","Nomura","Nishida"] },
    ],
    ESP: [
        { r: 0, first: ["Jesús","José Manuel","Juan Carlos","Víctor","Miguel Ángel","Roberto","Enrique","Eduardo","Andrés","Dani","Ramon","Cristian","Juan Antonio","Francisco Javier","Ricardo","Julio","Toni","José María","Santiago"],
          last: ["Gutiérrez","Morales","Ramírez","Castro","Blanco","Dominguez","Ortega","Ortiz","Delgado","Santos","Castillo","Medina","Rubio","Flores","Suárez","Marin","Cruz","Reyes","Sanz","Guerrero","Garrido","Herrera","Lozano","Cortés","Iglesias","Vargas","Cabrera","Santana","Peña","Cano","Campos","Vega","Méndez","Gallego","Silva","Aguilar","Núñez","Fuentes","Carrasco","Vidal","Caballero","Rojas","Prieto","Santiago","Montero","Mendoza","Mora","Hidalgo","Carmona","Nieto","Arias","León","Márquez","Lorenzo","Rivera","Soto","Calvo","Pascual","Giménez","Heredia","Herrero","Vera","Gallardo","Madrid","Lara","Velasco","Rivas","Franco","Camacho","Bravo","Crespo","Parra","Espinosa","Pastor","Vicente","Salazar","Durán","Pardo","Montes"] },
        { r: 1, first: ["Joan"],
          last: [] },
    ],
    NED: [
        { r: 0, first: ["Peter","Hans","John","Martin","Rick","Kevin","Gerard","Mike","Michel","Frans","Nick","Niels","Roy","Michael","Danny"],
          last: ["Janssen","Jacobs","Vermeulen","De Bruin","Schouten","Van Den Heuvel","Van Der Veen","Van Beek","Van Den Broek","Verhoeven","Maas","Koster","Prins","Van Vliet","De Bruijn","Blom","Van Dam","Huisman","Van Der Heijden","Post","Peeters","Van Veen","Kuiper","Kramer","Boer","Veenstra","De Jonge","Scholten","Martens","Groen","Vink","Van Der Wal","Koning","Gerritsen","Postma","De Ruiter","Bosch","Jonker","Willemsen","Van Wijk","Timmermans","Evers","Van Den Brink","De Vos","Schipper","Van Loon","Smeets","Driessen","De Lange","Roos"] },
    ],
    BEL: [
        { r: 0, first: ["Patrick","Thomas","Michael","Daniel","Pascal","Julien","Jonathan","Guy","Christian","Yves"],
          last: ["Dumont","Leclercq","Petit","Mathieu","Bertrand","Lemaire"] },
        { r: 1, first: ["Eddy","Danny","Tim"],
          last: ["Janssen","Desmet","Devos","Lemmens","Dhondt","Wauters","Smet","Declercq","Timmermans","Cornelis","Baert","Lambrechts","Lauwers","Jansen","Bosmans","Christiaens","Pieters","Stevens","Hendrickx","De Clercq","Van Den Broeck","De Backer","Van De Velde","Coppens","Verhoeven","Cools","Thys","De Smedt","Lenaerts","De Wilde","De Cock","De Meyer","Verstraete","Vandenberghe","Verheyen","Geerts","De Ridder","De Pauw","Bogaert","Verbeke","Vermeiren","Van Den Bossche"] },
    ],
    SUI: [
        { r: 0, first: ["David","Christian","Manuel","Marc","Kevin","Mario","Roland","Alex","Fabian","Rolf","Lukas"],
          last: ["Meyer","Zimmermann","Graf","Wyss","Berger","Roth","Baumgartner","Studer","Suter","Kaufmann","Bachmann","Bucher","Kunz","Hofer","Lehmann","Marti","Koch","Christen","Frey","Lüthi","Egli","Maurer","Schweizer","Gasser","Pfister","Wenger","Fuchs","Arnold","Koller","Kohler","Burri","Stalder","Wüthrich","Egger","Leuenberger","Furrer","Hug","Hofmann","Bieri","Tanner","Blaser","Wagner","Hess","Hunziker","Hauser","Vogel"] },
        { r: 1, first: ["Philippe"],
          last: [] },
        { r: 2, first: ["Antonio"],
          last: [] },
    ],
    AUT: [
        { r: 0, first: ["Daniel","Walter","Philipp","Herbert","Johannes","Jürgen","Matthias","Werner","Hannes","Sebastian","Marcel","Gerald","Rene","Alex","Georg"],
          last: ["Baumgartner","Wallner","Schmidt","Wolf","Auer","Wimmer","Ebner","Aigner","Haas","Binder","Koller","Holzer","Lehner","Schuster","Koch","Lackner","Graf","Wieser","Kaiser","Haider","Weiss","Strasser","Mair","König","Hauser","Krenn","Winter","Horvath","Kaufmann","Stadler","Kogler","Fink","Posch","Riegler","Karner","Rainer","Kern","Hackl","Maurer","Ortner","Fritz","Schwaiger","Resch","Seidl","Schober","Riedl","Neubauer","Strobl","Klein","Hofbauer"] },
    ],
    SWE: [
        { r: 0, first: ["David","Jan","Robert","Niklas","Alexander","Håkan","Simon","Hans","Christer","Tobias","Christian","Michael","Göran","Tommy"],
          last: ["Gustavsson","Olofsson","Bergström","Petersson","Berglund","Sandberg","Forsberg","Mattsson","Sjöberg","Engström","Fredriksson","Bergman","Ericsson","Eklund","Henriksson","Samuelsson","Lind","Danielsson","Holmberg","Nyström","Nyberg","Lundqvist","Gunnarsson","Söderberg","Lundström","Håkansson","Johnsson","Jakobsson","Sandström","Björk","Nordström","Berggren","Eliasson","Isaksson","Arvidsson","Ohlsson","Fransson","Björklund","Jacobsson","Holmgren","Mårtensson","Sundberg","Åberg","Ström","Hedlund","Wikström","Dahlberg","Hellström","Söderström","Hermansson"] },
    ],
    FIN: [
        { r: 0, first: ["Markus","Tomi","Joonas","Heikki","Juho","Tuomas","Pasi","Harri","Tommi","Lauri","Henri","Tero","Olli","Jaakko","Kimmo"],
          last: ["Laitinen","Lahtinen","Savolainen","Ojala","Kallio","Leppänen","Koivisto","Hakala","Anttila","Manninen","Pitkänen","Väisänen","Laaksonen","Leinonen","Miettinen","Hiltunen","Laakso","Toivonen","Hirvonen","Aalto","Rantala","Räsänen","Nurmi","Peltonen","Mustonen","Seppälä","Saari","Niemelä","Pulkkinen","Moilanen","Hänninen","Lahti","Koskela","Salmi","Kemppainen","Lappalainen","Kettunen","Ahola","Seppänen","Aho","Kauppinen","Halonen","Partanen","Ikonen","Peltola","Huttunen","Suominen","Pesonen","Mikkonen","Oksanen"] },
    ],
    DEN: [
        { r: 0, first: ["Andreas","Brian","Mathias","John","Jakob","Carsten","Lasse","Torben","Allan","Kenneth","Jørgen","Kristian","Flemming","Dennis"],
          last: ["Jacobsen","Holm","Olesen","Frederiksen","Schmidt","Laursen","Henriksen","Eriksen","Clausen","Simonsen","Østergaard","Kristiansen","Vestergaard","Svendsen","Iversen","Kjær","Andreasen","Dahl","Nissen","Nørgaard","Søndergaard","Friis","Jeppesen","Jespersen","Jessen","Frandsen","Jepsen","Mogensen","Bruun","Lauridsen","Winther","Bach","Carlsen","Bertelsen","Toft","Krogh","Lassen","Berg","Brandt","Ravn","Bech","Lind","Christoffersen","Gregersen","Holst","Nygaard","Bang","Johnsen","Juul","Kjeldsen"] },
    ],
    CAN: [
        { r: 0, first: ["Alex","James","Robert","Steve","Matthew","Dave","Nick","Jeff","Tony","Joe","Jonathan","Anthony","Kyle","Sam"],
          last: ["Jones","Miller","James","Thompson","Joseph","White","Young","King","Robinson","Reid","Rose","Clarke","Walker","Davis","Moore","Lewis","Wright","Jackson","Paul","John","Green","Clark","Mitchell","Peters","Kelly","Murphy"] },
        { r: 2, first: ["Ali"],
          last: ["Lau","Mann","Cheng","Saini","Chung","Randhawa","Wang","Chen","Zhang","Dhillon","Lam","Grewal","Tran","Shah","Leung","Kumar","Cheung","Yang","Huang","Ahmad","Tang","Chow","Park"] },
    ],
    MEX: [
        { r: 0, first: ["David","César","Armando","Martín","Alex","Omar","Alfredo","Edgar","Raúl","José Luis","Enrique","Iván","Rafael","Julio","Gabriel"],
          last: ["Rivera","Romero","Moreno","Ramos","Medina","Álvarez","Herrera","Méndez","Castro","Chávez","Luna","Contreras","Juárez","Salazar","Vargas","Muñoz","Estrada","Ortega","Dominguez","Soto","Guzmán","Alvarado","Lara","Espinoza","Vega","Carrillo","Velázquez","Gonzales","Sandoval","Cervantes","Avila","Ríos","Valdez","Ibarra","Delgado","Solis","Campos","Acosta","Silva","Santiago","Valenzuela","Cortés","Bautista","Márquez","Santos","Camacho","Rosas","Robles","Fernandez","Miranda"] },
    ],
    RSA: [
        { r: 0, first: ["David","Michael","Daniel","Patrick","Joseph","Chris","James","Paul"],
          last: ["Jacobs","Naidoo","Williams","Govender","Pillay","Adams","Abrahams","Davids"] },
        { r: 1, first: [],
          last: ["Van Wyk","Louw","Smit","Meyer"] },
        { r: 2, first: ["Thabiso","Lucky","Mandla","Thapelo","Vusi","Sbusiso","Sanele"],
          last: ["Moyo","Baloyi","Sibiya","Chauke","Mazibuko","Cele","Mathebula","Molefe","Sibanda","Maluleke","Motaung","Moloi","Zungu","Zondi","Hadebe","Vilakazi","Xaba","Zwane","Ncube","Radebe","Tshabalala","Ntuli","Mthethwa","Nxumalo","Maseko","Mabaso","Ngubane","Ngobeni","Mtshali","Mchunu","Mkhwanazi","Phiri","Mnguni","Mnisi","Dladla","Hlongwane","Nkuna"] },
    ],
    IRL: [
        { r: 0, first: ["Peter","Tom","Pat","Thomas","Robert","Tony","Eoin","Darren","Noel","Declan","Andrew","Anthony","Barry","Jason","Keith"],
          last: ["Smith","Flynn","Collins","Connolly","Whelan","Reilly","Doherty","Duffy","Clarke","Kenny","Brady","Healy","Keane","Moran","O'Reilly","Fitzpatrick","Maher","Hayes","Ward","Roche","Browne","Foley","McGrath","Casey","Buckley","Hughes","Hogan","Sweeney","Maguire","Cullen","Delaney","Butler","Smyth","White","Keogh","Egan","O'Connell","Cunningham","Hickey","Lyons","Higgins","Sheridan","Mooney"] },
    ],
    POR: [
        { r: 0, first: ["Vitor","David","Marco","Rafael","Alexandre","Eduardo","Nelson","Rubén","Fábio","Sérgio","Helder","Henrique","Bernardo","Gabriel","Leandro"],
          last: ["Vieira","Cardoso","Nunes","Duarte","Rocha","Coelho","Reis","Neves","Freitas","Cruz","Cunha","Machado","Pires","Fonseca","Tavares","Barbosa","Lima","Matos","Antunes","Castro","Andrade","Figueiredo","Azevedo","Faria","Lourenço","Barros","Filipe","Morais","Pinheiro","Abreu","Batista","Henriques","Mota","Jesús","Afonso","Simões","Guerreiro","Rosa","Brito","Nogueira","Borges","Melo","Araújo","Esteves","Magalhães","Maia","Baptista","Moura","Neto","Amaral"] },
    ],
    COL: [
        { r: 0, first: ["Jhon","Alexander","Manuel","Alex","Felipe","Jaime","Juan Carlos","Edwin","Jesús","Pedro","Wilson","Víctor","Brayan","César","Fabián"],
          last: ["Álvarez","Herrera","Suárez","Giraldo","Castillo","Arias","Rivera","Cardona","Marin","Zapata","Medina","Osorio","Mendoza","Peña","Parra","Guerrero","Salazar","Mejía","Cárdenas","Florez","Jaramillo","Mosquera","Acosta","Londoño","Correa","Reyes","Cruz","Ramos","Molina","Cortés","Ortega","Mora","Escobar","Vásquez","Contreras","Ríos","Velásquez","Guzmán","Agudelo","Sierra","Rincón","Méndez","Castañeda","Lozano","Silva","Henao","Gonzales","Fernandez","Castaño","Orozco"] },
    ],
    RUS: [
        { r: 0, first: ["Konstantin","Vyacheslav","Vasili","Anatoli","Artur","Vlad"],
          last: ["Sergeev","Mikhailov","Romanov","Nikolaev","Stepanov","Zakharov","Semenov","Kot","Maksimov","Isaev","Yakovlev","Aleksandrov","Grigoriev","Frolov","Nazarov","Borisov","Antonov","Kuzmin","Dmitriev","Medvedev","Mironov","Tarasov","Zhukov"] },
    ],
    POL: [
        { r: 0, first: ["Daniel","Patryk","Karol","Adrian","Janusz","Jerzy","Dominik","Krystian","Jarosław","Arkadiusz","Roman"],
          last: ["Szewczyk","Wilk","Stępień","Baran","Marciniak","Duda","Pietrzak","Lis","Kot","Wojciechowski","Kubiak","Kwiatkowski","Mazurek","Bąk","Kozłowski","Włodarczyk","Janik","Kowal","Krupa","Sobczak","Szulc","Michalski","Kołodziej","Marek","Maj","Szymczak","Polak","Nowakowski","Kaźmierczak","Kaczmarczyk","Mucha","Kania","Kowalik","Kozak","Szczepaniak","Wawrzyniak","Nowicki","Mróz","Jarosz","Jaworski","Pawłowski","Błaszczyk","Sowa","Majewski","Markiewicz","Urbaniak","Kruk","Malinowski","Stankiewicz","Olszewski"] },
    ],
    CZE: [
        { r: 0, first: ["Patrik","Vladimír","Dominik","Libor","Robert","Stanislav","Matěj","Radim","Ivan"],
          last: ["Zeman","Jelínek","Růžička","Kolář","Doležal","Čermák","Moravec","Kadlec","Soukup","Musil","Kříž","Malý","Vaněk","Holub","Šimek","Blažek","Kratochvíl","Vlček","Polák","Janda","Štěpánek","Šťastný","Valenta","Bartoš","Kopecký","Navrátil","Mareš","Čech","Mašek","Staněk","Mach","Sýkora","Kovář","Vacek","Bláha","Toman","Matoušek","Strnad","Vávra","Beran","Říha","Tichý","Havel","Dostál","Dušek"] },
    ],
    HUN: [
        { r: 0, first: ["Imre","Gergő","Roland","Gergely","Szabolcs","Lajos","Gyula","Ákos","Viktor","Bálint","Miklós","Béla","Mihály","Richárd"],
          last: ["Lakatos","Kis","Szilágyi","Rácz","Kocsis","Török","Szűcs","Oláh","Fodor","Magyar","Gál","Fehér","Szalai","Antal","Sipos","Pintér","Katona","Király","Jakab","Boros","Somogyi"] },
    ],
    URU: [
        { r: 0, first: ["Javier","Miguel","Sergio","Lucas","Rodrigo","Mario","Agustín","Facundo","Leonardo","Roberto"],
          last: ["Hernández","Castro","De Los Santos","Moreira","Rivero","Méndez","Sánchez","Morales","Pereyra","Silvera","Silveira","Viera","Pintos","Romero","Ramos","Alvez","Torres","Da Silva","Duarte","Medina","Ramírez","Delgado","Gutiérrez","Larrosa","Santos","Benitez","Piriz","Costa","Barboza","Lima"] },
    ],
    ISR: [
        { r: 0, first: ["Michael","Alex","Tal","Amit","Idan","Yuval","Rami","Shay"],
          last: ["Bar","Tal","Yosef","Mor","Vaknin","Golan","Hadad","Levin","Azulay","Shalom","Edri","Alon","Segal","Gabay","Hazan","Elbaz","Aharon","Dayan","Chen"] },
    ],
    IND: [
        { r: 0, first: ["Raju","Anil","Sonu","Mukesh","Dinesh","Pankaj","Suraj","Mahesh","Sachin"],
          last: ["Raj","Roy","Rajput","Shaikh","Sahu","Alam","Parmar","Mondal","Pandey","Pal","Shah","Saini","Ram","Jain","Prajapati","Rathod","Tiwari","Soni","Sarkar","Mandal","Malik","Ahmad","Meena","Solanki","Chaudhary","Hussain","Jadhav"] },
        { r: 1, first: [],
          last: ["Patil","Nayak"] },
    ],
    MAS: [
        { r: 0, first: ["Muhammad"],
          last: ["Mohamad","Man","Zakaria","Ramli","Din","Nizam","Azmi","Sulaiman","Aiman","Firdaus","Rahim","Hakim","Hafiz","Ishak","Anuar"] },
        { r: 1, first: [],
          last: ["Yee","Low","Wan","Leong","Liew","Lai","Ling","Lau","Chai","Loh","Chew","Ooi","Chua"] },
    ],
    INA: [
        { r: 0, first: ["Muhammad","Ahmad","Achmad","David","Edy","Ali","Andy","Benny"],
          last: ["Tan","Lim","Lie","Lee","Ahmad","Irawan","Iskandar","Arifin","Prasetyo","Hadi","Purnomo","Budiman","Wahyudi","Chen","Jaya","Yusuf","Hermawan","Anwar","Widodo","Sutanto","Susilo","Muhammad","Maulana","Yanto","Rahman"] },
    ],
    EST: [
        { r: 0, first: ["Tanel","Priit","Mihkel","Marek","Toomas","Madis","Indrek"],
          last: ["Olen","Jõgi","Põder","Toom","Kütt","Lepp","Raudsepp","Laur","Raud","Leppik","Männik","Jakobson","Sild","Kallas","Paju","Teder","Lõhmus","Sarapuu","Kuusik","Nõmm","Tamme","Johanson","Lember","Hein"] },
        { r: 1, first: ["Viktor","Denis"],
          last: [] },
    ],
    MAR: [
        { r: 0, first: [],
          last: ["Ayoub","Hamza","Hicham","Khalid","Amin","Hamid","Yassine","Rifi","Tanjawi"] },
    ],
};

// Node/Build-Kontext optional exportierbar (im Browser-Monolith ohne Wirkung):
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NAME_POOLS_BY_NATION, NATION_NAME_FALLBACK, NAME_TAILS_BY_NATION };
}
