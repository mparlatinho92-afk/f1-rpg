// ============================================================================
// PAKET A — NAME_POOLS_BY_NATION (Fable-Deliverable, v3 — volle Datenlast)
// Nationskorrekte, regionskohärente, ära-sensible Namens-Pools.
// NUR DATEN — kein Laufzeit-Code. GENERIERT von
// fable-deliverables/name-data/build-names-v3.js — NICHT von Hand editieren,
// sondern das Build-Skript anpassen und neu laufen lassen!
//
// v3: Volle BigQuery-Datenlast (Top-400 je Land, 12,5M Vor-/21,1M Nachnamen-
// Zeilen). Gewichte = echte Häufigkeiten: w = round(100·(count/max)^0.6),
// Exponent 0,6 kompensiert die Top-400-Trunkierung (Kopf-Anteile ≈ reale
// Bevölkerungsanteile: Smith ≈1,4% GBR-Pool, Müller ≈1,5% GER-Pool).
// US-Census-Korrektur der Hispanic-Verzerrung; RUS-Stil-Merge; neu mit Daten:
// ARG, NOR, GRE, TUR, KOR. Wissensbasiert gefüllt: AUS/NZL/ZIM (+GB/IE-Leihe),
// VEN (+CO-Leihe), THA, MON, CHN, MAR-Vornamen.
//
// Schema pro Nation (IOC-Code) — UNVERÄNDERT ggü. v2:
//   { regions: [ { w: <Regionsgewicht, Summe ~1>,
//                  minYear: <optional: Region existiert erst ab diesem Debütjahr>,
//                  first: [[name,gewicht],...]                      // ära-stabil, ODER
//                  first: { early:[...], mid:[...], modern:[...] }, // ära-sensibel
//                  last:  [[name,gewicht],...] } ] }
// Gewichte: beliebige positive Zahlen (weightedPick normalisiert). Skala:
// ~100 = häufigster Name, 1 = Rarität. early-Fenster: kuratierte 1–5-Skala
// (eigenständiges Array — nur die Relation innerhalb des Fensters zählt).
// Ära-Fenster (Debütjahr): early < 1975, mid 1975–2009, modern >= 2010.
// modern: kuratierter Kopf dominiert, Datenmasse gedeckelt (Datensatz ist
// erwachsenenlastig — sonst hieße jeder 2020er-Rookie "Norbert").
// KERNREGEL: Vor- UND Nachname kommen immer aus DERSELBEN Region.
// ============================================================================

const NAME_POOLS_BY_NATION = {

    // ── GBR ──
    GBR: { regions: [
        { w: 0.92,
          first: {
            early: [
              ['John',5],['Peter',5],['Tony',4],['Mike',4],['Brian',4],['David',4],['Alan',3],['Roy',3],['Ken',3],['Geoff',3],['Ian',3],['Trevor',2],['Cliff',2],
              ['Reg',1],['Archie',1],['Innes',1]
            ],
            mid: [
              ['David',100],['Paul',99],['Mark',87],['James',91],['Andrew',69],['Richard',63],['Martin',51],['Chris',82],['Stephen',57],['Simon',54],['Gary',50],
              ['Lee',54],['Nigel',27],['Jamie',51],['Johnny',14],['Damon',12],['John',99],['Michael',75],['Tom',65],['Peter',64],['Jack',63],['Daniel',62],['Ben',62],
              ['Adam',61],['Steve',60],['Ian',59],['Andy',57],['Alex',56],['Sam',56],['Robert',56],['Ryan',54],['Dave',53],['Joe',51],['Alan',50],['Matthew',50],
              ['Matt',49],['Luke',49],['Kevin',48],['Tony',48],['George',47],['Dan',46],['Craig',46],['Mike',46],['Steven',45],['Josh',45],['Scott',44],['Liam',44],
              ['Darren',43],['Jason',43],['Nick',43],['Neil',42],['Brian',42],['Stuart',42],['Rob',40],['Harry',40],['Colin',39],['Thomas',39],['Lewis',39],
              ['Jordan',38],['Sean',38],['Anthony',38],['Danny',38],['Jake',37],['Graham',37],['Nathan',36],['Charlie',36],['Phil',36],['Callum',35],['William',34],
              ['Aaron',34],['Keith',34],['Dean',34],['Tim',33],['Christopher',32],['Jonathan',32],['Connor',32],['Will',31],['Shaun',30],['Carl',29],['Adrian',29],
              ['Barry',29],['Jim',29],['Wayne',29],['Jon',29],['Philip',29],['Terry',29],['Ross',29],['Kieran',29],['Kyle',29],['Billy',28],['Gareth',28],['Bob',27],
              ['Ashley',26],['Patrick',26],['Joshua',25],['Joseph',25],['Pete',24],['Oliver',24],['Derek',24],['Mick',24],['Max',24],['Cameron',24],['Shane',23],
              ['Gavin',23],['Dylan',22],['Karl',22],['Marc',21],['Trevor',21],['Roger',21],['Reece',20],['Bill',20],['Gordon',20],['Owen',20],['Jacob',20],['Ray',20],
              ['Tommy',20],['Roy',20],['Jonny',20],['Edward',20],['Samuel',20],['Bradley',20],['Rhys',20],['Frank',19],['Greg',19],['Brandon',19],['Henry',19],
              ['Louis',19],['Ken',19],['Malcolm',19],['Jimmy',19],['Allan',18],['Charles',18],['Marcus',18],['Ethan',18],['Ollie',18],['Jeff',18],['Abdul',18],
              ['Ricky',18],['Iain',18],['Justin',18],['Geoff',18],['Dale',17],['Conor',17],['Russell',17],['Leon',17],['Tyler',17],['Robin',17],['Eddie',17],
              ['Alfie',17],['Dominic',17],['Grant',17],['Toby',16],['Graeme',16],['Stewart',16],['Eric',16],['Clive',16],['Nicholas',16],['Garry',16],
              ['Alexander',16],['Robbie',16],['Brad',16],['Raymond',16]
            ],
            modern: [
              ['Jack',90],['Tom',90],['Ben',90],['Oliver',90],['Harry',90],['Charlie',45],['Will',45],['Josh',45],['Alex',45],['George',45],['Jake',45],['Dan',45],
              ['Ryan',45],['Sam',45],['Callum',26],['Ollie',26],['John',14],['Michael',14],['Peter',14],['Daniel',14],['Adam',14],['Steve',14],['Ian',14],['Andy',14],
              ['Robert',14],['Dave',14],['Joe',14],['Alan',14],['Matthew',14],['Matt',14],['Luke',14],['Kevin',14],['Tony',14],['Craig',14],['Mike',14],['Steven',14],
              ['Scott',14],['Liam',14],['Darren',14],['Jason',14],['Nick',14],['Neil',14],['Brian',14],['Stuart',14],['Rob',14],['Colin',14],['Thomas',14],
              ['Lewis',14],['Jordan',14],['Sean',14],['Anthony',14],['Danny',14],['Graham',14],['Nathan',14],['Phil',14],['William',14],['Aaron',14],['Keith',14],
              ['Dean',14],['Tim',14],['Christopher',14],['Jonathan',14],['Connor',14],['Shaun',14],['Carl',14],['Adrian',14],['Barry',14],['Jim',14],['Wayne',14],
              ['Jon',14],['Philip',14],['Terry',14],['Ross',14],['Kieran',14],['Kyle',14],['Billy',14],['Gareth',14],['Bob',14],['Ashley',14],['Patrick',14],
              ['Joshua',14]
            ]
          },
          last: [
            ['Smith',100],['Jones',82],['Taylor',59],['Brown',61],['Wilson',50],['Davies',52],['Evans',46],['Walker',40],['Thompson',40],['Roberts',42],
            ['Wright',39],['Hughes',38],['Robinson',39],['White',39],['Green',37],['Wood',35],['Clarke',36],['Edwards',37],['Lewis',36],['Jackson',36],
            ['Cooper',33],['Marshall',26],['Bell',29],['Hill',33],['Watson',32],['Stewart',29],['Hamilton',21],['Hunt',22],['Palmer',22],['Fletcher',20],
            ['Chapman',23],['Herbert',12],['Blundell',2],['Warwick',2],['Williams',64],['Johnson',44],['James',36],['Hall',36],['Harris',35],['Scott',35],
            ['Clark',34],['King',34],['Moore',34],['Turner',34],['Ward',33],['Morgan',32],['Morris',32],['Anderson',31],['Campbell',31],['Young',31],
            ['Harrison',31],['Baker',30],['Allen',30],['Mitchell',30],['Phillips',29],['Davis',29],['Miller',29],['Parker',28],['Price',28],['Shaw',28],
            ['Simpson',27],['Collins',27],['Murray',27],['Carter',27],['Richardson',27],['Cook',26],['Bailey',26],['Gray',26],['Griffiths',26],['Adams',26],
            ['Graham',25],['Richards',25],['Ellis',24],['Cox',24],['Foster',24],['Rose',24],['Robertson',23],['Wilkinson',23],['Russell',23],['Mason',23],
            ['Reid',23],['Matthews',23],['Powell',23],['Rogers',23],['Gibson',22],['Mills',22],['Webb',22],['Owen',22],['Thomson',22],['Holmes',22],['Knight',22],
            ['Barnes',22],['Harvey',21],['Hunter',21],['Stevens',21],['Lloyd',21],['Jenkins',21],['Johnston',21],['Fisher',21],['Butler',21],['Fox',21],
            ['Dixon',21],['Grant',21],['Ross',20],['Pearson',20],['Barker',20],['Andrews',20],['Bradley',20],['Elliott',20],['Kennedy',20],['Reynolds',20],
            ['West',20],['Henderson',20],['Armstrong',19],['Howard',19],['Burns',19],['Ford',19],['Oneill',19],['Day',19],['Saunders',19],['Brooks',19],
            ['Lawrence',19],['Cole',18],['Dawson',18],['Payne',18],['Obrien',18],['Morrison',18],['May',18],['Woods',18],['Williamson',18],['Black',18],
            ['Pearce',18],['Davidson',18],['Atkinson',18],['Spencer',18],['Burton',18],['Wallace',18],['Hart',18],['Quinn',18],['Gordon',18],['Francis',18],
            ['Dunn',17],['Ball',17],['Perry',17],['George',17],['Hayes',17],['Ferguson',17],['Booth',17],['Stevenson',17],['Wells',17],['John',17],['Webster',17],
            ['Page',17],['Porter',17],['Carr',17],['Cunningham',17],['Hudson',17],['Berry',17],['Watts',17],['Oliver',17],['Stone',17],['Riley',17],['Lowe',17],
            ['Rees',17],['Dean',16],['Barrett',16],['Newman',16],['Kerr',16],['Holland',16],['Fraser',16],['Marsh',16],['Nelson',16],['Gregory',16],['Reed',16],
            ['Gallagher',16],['Harper',16],['Gardner',16],['Jordan',16],['Bird',16],['Newton',16],['Lane',16],['Hawkins',16],['Higgins',16],['Alexander',15],
            ['Harding',15],['Parsons',15],['Shepherd',15],['Cooke',15],['Bates',15],['Duncan',15],['Long',15],['Douglas',15],['Burgess',15],['Nicholson',15],
            ['Cross',15],['Cameron',15],['Chambers',15],['Doherty',15],['Freeman',15],['Robson',15],['Bishop',15],['Walton',15],['Parry',15],['Lynch',15],
            ['Oconnor',15],['Warren',15],['Curtis',15],['Sharp',15],['Yates',15],['Hardy',15],['Coleman',15],['Paterson',14],['Crawford',14],['Osborne',14],
            ['Hopkins',14],['Nicholls',14],['Baxter',14],['Moss',14],['Sutton',14],['Donnelly',14],['Allan',14],['Burke',14],['Potter',14],['Hodgson',14],
            ['Craig',14],['Duffy',14],['Willis',14],['Hutchinson',14],['Mann',14],['Watkins',14],['Lawson',14],['Patterson',14],['Todd',14],['Arnold',14],
            ['Buckley',14],['Henry',14],['Blake',14],['Hewitt',14],['Kay',14],['Gilbert',14],['Slater',14],['Stephenson',14],['Pritchard',14],['Miles',14],
            ['Rowe',14],['Wheeler',14],['Walters',14],['Jane',13],['Hammond',13],['Banks',13],['Sullivan',13],['Stephens',13],['Bond',13],['Peters',13],
            ['Barber',13],['Paul',13],['Read',13],['Barton',13],['Frost',13],['Lambert',13],['Nash',13],['Middleton',13],['Kemp',13],['Boyle',13]
          ] },
        { w: 0.08, minYear: 1995,
          first: [
            ['Imran',12],['Jay',30],['Aman',12],['Zain',12],['Aryan',12],['Dev',12],['Kian',8],['Amir',10],['Ali',26],['Mohammed',25],['Muhammad',18],['Ahmed',17]
          ],
          last: [
            ['Khan',46],['Patel',39],['Ahmed',36],['Singh',36],['Ali',39],['Hussain',32],['Shah',21],['Sharma',15],['Gill',19],['Kaur',18],['Rahman',17],
            ['Miah',17],['Begum',17],['Kumar',16],['Malik',14],['Mahmood',14],['Mohammed',14],['Iqbal',13]
          ] }
    ] },

    // ── GER ──
    GER: { regions: [
        { w: 1,
          first: {
            early: [
              ['Hans',5],['Karl',4],['Wolfgang',4],['Heinz',4],['Klaus',4],['Jürgen',4],['Günther',3],['Manfred',3],['Dieter',3],['Helmut',3],['Werner',3],['Kurt',3],
              ['Rolf',3],['Gerhard',3],['Willi',2],['Egon',1]
            ],
            mid: [
              ['Michael',100],['Thomas',94],['Andreas',85],['Christian',82],['Stefan',71],['Frank',67],['Markus',62],['Martin',60],['Sebastian',54],['Alexander',54],
              ['Sven',53],['Marcel',52],['Matthias',51],['Patrick',50],['Tobias',49],['Oliver',44],['Dirk',47],['Ralf',46],['Marco',48],['Dennis',43],['Jörg',43],
              ['Uwe',47],['Timo',28],['Heinz-Harald',2],['Daniel',70],['Peter',68],['Jens',49],['Jürgen',48],['André',47],['Florian',46],['Jan',46],['Klaus',45],
              ['Wolfgang',45],['René',44],['Bernd',43],['Kevin',43],['Mario',42],['David',42],['Robert',41],['Sascha',41],['Christoph',38],['Alex',38],['Stephan',37],
              ['Steffen',37],['Max',36],['Tim',36],['Philipp',35],['Marc',35],['Nico',35],['Dieter',34],['Manfred',34],['Torsten',34],['Maik',33],['Dominik',33],
              ['Heiko',33],['Holger',33],['Manuel',32],['Chris',32],['Mike',32],['Kai',32],['Rainer',32],['Thorsten',32],['Fabian',32],['Lars',31],['Lukas',31],
              ['Felix',30],['Marcus',30],['Benjamin',30],['Hans',30],['Paul',30],['Tom',29],['Carsten',29],['Werner',29],['Johannes',29],['Ronny',28],['Pascal',28],
              ['Volker',28],['Roland',28],['Simon',27],['Norbert',27],['Julian',27],['Olaf',26],['Helmut',26],['Harald',26],['Ingo',26],['Joachim',25],['Björn',25],
              ['Jonas',25],['Mathias',24],['Gerhard',24],['Axel',24],['Horst',24],['Karsten',24],['Andy',23],['Leon',23],['Marvin',23],['Rolf',23],['Udo',23],
              ['Georg',23],['Günter',23],['Gerd',22],['Nils',22],['Detlef',22],['Christopher',22],['Heinz',22],['Enrico',22],['Robin',22],['Niklas',22],
              ['Maximilian',21],['Josef',21],['Franz',21],['Steven',21],['Bernhard',21],['Ulrich',21],['Jochen',20],['Justin',20],['Walter',20],['Mark',19],
              ['Denis',19],['Herbert',19],['Mirko',19],['Eric',19],['Toni',19],['Guido',19],['Dietmar',19],['Marko',19],['Richard',19],['Adrian',19],['Karl',18],
              ['Lutz',18],['Marius',18],['Reinhard',18],['Luca',18],['Achim',18],['Karl-Heinz',17],['Moritz',17],['Armin',17],['Roman',17],['Erik',17],['Reiner',17],
              ['Danny',17],['Lothar',17],['Steve',16],['Lucas',16],['Hendrik',16],['Ben',16],['Tino',16],['Antonio',16],['Willi',16],['Hermann',16],['Nick',16],
              ['Tobi',16],['Bastian',15],['Johann',15],['Hartmut',15],['Siegfried',15],['Mohamed',15],['Rüdiger',15],['John',15],['Anton',15],['Kay',15],['Ralph',15],
              ['Ahmed',15],['Rico',15],['Viktor',14],['Philip',14],['Alfred',14],['Kurt',14],['Maurice',14],['Juergen',14],['Wilfried',14],['Giuseppe',14],
              ['Silvio',14],['Hannes',14]
            ],
            modern: [
              ['Max',90],['Leon',90],['Jonas',90],['Lukas',90],['Paul',45],['Luca',45],['Finn',45],['Noah',45],['Felix',45],['David',45],['Tim',45],['Niklas',45],
              ['Julian',45],['Elias',45],['Florian',45],['Moritz',26],['Mick',2],['Daniel',14],['Peter',14],['Jens',14],['Jürgen',14],['André',14],['Jan',14],
              ['Klaus',14],['Wolfgang',14],['René',14],['Bernd',14],['Kevin',14],['Mario',14],['Robert',14],['Sascha',14],['Christoph',14],['Alex',14],['Stephan',14],
              ['Steffen',14],['Philipp',14],['Marc',14],['Nico',14],['Dieter',14],['Manfred',14],['Torsten',14],['Maik',14],['Dominik',14],['Heiko',14],['Holger',14],
              ['Manuel',14],['Chris',14],['Mike',14],['Kai',14],['Rainer',14],['Thorsten',14],['Fabian',14],['Lars',14],['Marcus',14],['Benjamin',14],['Hans',14],
              ['Tom',14],['Carsten',14],['Werner',14],['Johannes',14],['Ronny',14],['Pascal',14],['Volker',14],['Roland',14],['Simon',14],['Norbert',14],['Olaf',14],
              ['Helmut',14],['Harald',14],['Ingo',14],['Joachim',14],['Björn',14],['Mathias',14],['Gerhard',14],['Axel',14],['Horst',14],['Karsten',14],['Andy',14],
              ['Marvin',14],['Rolf',14],['Udo',14],['Georg',14],['Günter',14],['Gerd',14],['Nils',14],['Detlef',14],['Christopher',14]
            ]
          },
          last: [
            ['Müller',100],['Schmidt',80],['Schneider',56],['Fischer',50],['Meyer',47],['Weber',46],['Schulz',46],['Wagner',45],['Becker',42],['Hoffmann',42],
            ['Richter',41],['Koch',38],['Bauer',37],['Klein',36],['Wolf',36],['Schäfer',38],['Schröder',34],['Neumann',34],['Schwarz',32],['Krüger',31],
            ['Lange',31],['Braun',31],['Zimmermann',30],['Krause',30],['Lehmann',30],['Hartmann',29],['Werner',30],['Lang',24],['Vogel',22],['Berger',24],
            ['Winkler',23],['Kaufmann',15],['Brandt',20],['Stuck',2],['Meier',34],['Schmitz',30],['Schulze',29],['Hofmann',29],['Schmitt',28],['König',27],
            ['Peters',27],['Maier',27],['Kaiser',27],['Herrmann',26],['Krämer',26],['Köhler',26],['Walter',26],['Kühn',26],['Fuchs',25],['Mayer',25],['Scholz',25],
            ['Möller',24],['Schmid',24],['Schubert',24],['Friedrich',23],['Huber',23],['Weiß',23],['Lorenz',22],['Franke',22],['Engel',22],['Winter',22],
            ['Günther',22],['Hahn',22],['Keller',22],['Beck',21],['Albrecht',21],['Baumann',21],['Sommer',21],['Ludwig',21],['Roth',21],['Otto',20],
            ['Schumacher',20],['Schuster',20],['Paul',19],['Heinrich',19],['Seidel',19],['Hansen',19],['Kraus',19],['Vogt',19],['Graf',19],['Böhm',19],
            ['Schreiber',19],['Voigt',18],['Jäger',18],['Groß',18],['Dietrich',18],['Bergmann',18],['Wolff',18],['Horn',18],['Pohl',18],['Jansen',18],
            ['Seifert',17],['Schulte',17],['Franz',17],['Lindner',17],['Arnold',17],['Maus',17],['Busch',17],['Haas',17],['Beyer',17],['Ernst',17],['Schumann',16],
            ['Wenzel',16],['Ziegler',16],['Ritter',16],['Petersen',16],['Sauer',16],['Jahn',16],['Berg',16],['Rose',16],['Hermann',16],['Pfeiffer',16],['Weiss',16],
            ['Reinhardt',16],['Riedel',16],['Kruse',16],['Wilhelm',16],['Arndt',16],['Lenz',16],['Fiedler',16],['Haase',16],['Hübner',15],['Nagel',15],['Nowak',15],
            ['Grimm',15],['Walther',15],['Thiele',15],['Langer',15],['Kern',15],['Barth',15],['Hoppe',15],['Zimmer',15],['Thiel',15],['Ott',15],['Sander',15],
            ['Mann',15],['Förster',15],['Bock',15],['Böttcher',15],['Mohr',14],['Kraft',14],['Kunze',14],['Stephan',14],['Schramm',14],['Marx',14],['Fröhlich',14],
            ['Reuter',14],['Witt',14],['Miller',14],['Fritz',14],['John',14],['Herzog',14],['Schilling',14],['Schindler',14],['Hesse',14],['Behrens',14],
            ['Götz',14],['Janssen',14],['Eckert',14],['Rudolph',14],['Schultz',14],['Heinz',14],['May',14],['Ebert',14],['Michael',13],['Beckmann',13],['Kunz',13],
            ['Baum',13],['Naumann',13],['Ulrich',13],['Bachmann',13],['Klaus',13],['Böhme',13],['Wegner',13],['Urban',13],['Blum',13],['Wendt',13],['Bayer',13],
            ['Bach',13],['Lutz',13],['Büttner',13],['Steiner',13],['Voß',13],['Breuer',13],['Anders',13],['Kirchner',13],['Brand',13],['Bruns',13],['Stark',13],
            ['Schütz',13],['Wolter',13],['Gerlach',13],['Ullrich',13],['Stahl',13],['Hirsch',13],['Gärtner',12],['Mai',12],['Frey',12],['Gruber',12],['Heller',12],
            ['Schiller',12],['Menzel',12],['Reichert',12],['Buchholz',12],['Mustafa',12],['Jakob',12],['Reimann',12],['Hinz',12],['Brinkmann',12],['Noack',12],
            ['Seitz',12],['Maurer',12],['Siebert',12],['Kurz',12],['Hennig',12],['Hildebrandt',12],['Fink',12],['Schröter',12],['Dietz',12],['Döring',12],
            ['Rohde',12],['Scherer',12],['Smith',12],['Moser',12],['Schenk',12],['Gross',12],['Henning',12],['Körner',12],['Bär',12],['Unger',12],['Philipp',12],
            ['Erdmann',12],['Sturm',12],['Freitag',12],['Bartsch',12],['Hasan',12],['Brunner',12],['Wilke',12],['Meißner',12],['Gül',12],['Linke',12],
            ['Schlüter',12],['Steffen',12],['Hammer',12],['Engelhardt',12],['Martens',11],['Ackermann',11],['Reich',11],['Krebs',11],['Gebhardt',11],
            ['Westphal',11],['Nickel',11],['Schlegel',11],['Rieger',11],['Wirth',11],['Ahrens',11],['Binder',11],['Geiger',11],['Schwab',11],['Heinze',11],
            ['Holz',11],['Will',11],['Blume',11],['Mertens',11],['Berndt',11],['Funk',11],['Witte',11],['Conrad',11],['Pfeifer',11],['Esser',11],['Schön',11],
            ['Bischoff',11],['Kohl',11],['Brückner',11]
          ] }
    ] },

    // ── ITA ──
    ITA: { regions: [
        { w: 1,
          first: {
            early: [
              ['Luigi',5],['Giuseppe',5],['Franco',4],['Carlo',4],['Giovanni',4],['Alberto',3],['Giorgio',3],['Vittorio',3],['Bruno',3],['Sergio',3],['Umberto',3],
              ['Piero',3],['Nino',2],['Gino',2],['Renato',2],['Aldo',2],['Enzo',2]
            ],
            mid: [
              ['Andrea',94],['Marco',95],['Luca',78],['Francesco',99],['Antonio',96],['Alessandro',80],['Stefano',67],['Roberto',69],['Paolo',66],['Giovanni',75],
              ['Michele',65],['Salvatore',63],['Vincenzo',59],['Fabio',59],['Mario',59],['Massimo',58],['Daniele',55],['Angelo',53],['Claudio',48],['Maurizio',48],
              ['Riccardo',44],['Nicola',52],['Gabriele',42],['Emanuele',37],['Ivan',27],['Pierluigi',14],['Giuseppe',100],['Davide',60],['Matteo',60],['Luigi',59],
              ['Simone',56],['Lorenzo',50],['Domenico',47],['Franco',46],['Alberto',43],['Mauro',43],['Alessio',42],['Carlo',42],['Pietro',42],['Federico',41],
              ['Gianluca',41],['Giorgio',40],['Pasquale',39],['Gianni',39],['Fabrizio',38],['Enrico',37],['Mattia',37],['Raffaele',37],['Sergio',36],['Filippo',36],
              ['Giacomo',33],['Enzo',33],['Luciano',32],['Cristian',32],['Leonardo',32],['Massimiliano',31],['Gaetano',31],['Bruno',29],['Dario',29],['Diego',29],
              ['Alex',28],['Vito',28],['Christian',27],['Mirko',27],['Carmine',27],['Manuel',27],['Tommaso',26],['Ciro',26],['Piero',26],['Giancarlo',26],
              ['Marcello',25],['Vittorio',25],['Danilo',24],['Rosario',24],['Valerio',24],['Giulio',24],['Gennaro',24],['Carmelo',24],['Rocco',23],['Antonino',23],
              ['Aldo',23],['Gianfranco',23],['Sandro',23],['Renato',23],['Salvo',23],['Samuele',22],['Edoardo',21],['Daniel',21],['Pino',21],['Umberto',21],
              ['Alfredo',21],['Mimmo',21],['Giuliano',20],['Adriano',20],['Alfonso',20],['Nino',20],['Walter',20],['Peppe',19],['Gino',19],['Flavio',19],['Guido',19],
              ['Nicolò',19],['Mohamed',18],['Cosimo',18],['Donato',18],['Sebastiano',18],['Tony',18],['Armando',18],['Jacopo',17],['Michael',17],['Emilio',17],
              ['David',17],['Silvio',17],['Damiano',17],['Omar',16],['Corrado',16],['Cesare',16],['Antonello',16],['Dino',16],['Saverio',16],['Gerardo',16],
              ['Tiziano',16],['Cristiano',16],['Eugenio',16],['Thomas',15],['Lucio',15],['Max',15],['Felice',15],['Mirco',15],['Biagio',15],['Agostino',15],
              ['Lino',15],['Loris',15],['Denis',15],['Silvano',14],['Nico',14],['Graziano',14],['Emiliano',14],['Ahmed',14],['Kevin',14],['Fausto',14],['Renzo',14],
              ['Gigi',14],['Leo',14],['Tonino',14],['Nunzio',14],['Valentino',13],['Ernesto',13],['Rino',13],['Elio',13],['Ivano',13],['Fernando',13],['Ale',13],
              ['Ignazio',13],['Moreno',13],['Ugo',13],['Gianmarco',13],['Ettore',12],['Gabriel',12],['Mariano',12],['Elia',12],['Fulvio',12],['Ferdinando',12],
              ['Valter',12],['Ali',12],['Orazio',12],['Santo',12],['Ezio',11],['Samuel',11],['Alfio',11],['Patrizio',11],['Pippo',11],['Giampiero',11],
              ['Calogero',11],['Pierpaolo',11],['Óscar',11]
            ],
            modern: [
              ['Matteo',90],['Lorenzo',90],['Francesco',90],['Leonardo',45],['Alessio',45],['Davide',45],['Antonio',45],['Federico',45],['Gabriele',45],['Simone',45],
              ['Mattia',45],['Tommaso',26],['Riccardo',26],['Edoardo',26],['Giacomo',26],['Kimi',2],['Giuseppe',14],['Luigi',14],['Domenico',14],['Franco',14],
              ['Alberto',14],['Mauro',14],['Carlo',14],['Pietro',14],['Gianluca',14],['Giorgio',14],['Pasquale',14],['Gianni',14],['Fabrizio',14],['Enrico',14],
              ['Raffaele',14],['Sergio',14],['Filippo',14],['Enzo',14],['Luciano',14],['Cristian',14],['Massimiliano',14],['Gaetano',14],['Bruno',14],['Dario',14],
              ['Diego',14],['Alex',14],['Vito',14],['Christian',14],['Mirko',14],['Carmine',14],['Manuel',14],['Ciro',14],['Piero',14],['Giancarlo',14],
              ['Marcello',14],['Vittorio',14],['Danilo',14],['Rosario',14],['Valerio',14],['Giulio',14],['Gennaro',14],['Carmelo',14],['Rocco',14],['Antonino',14],
              ['Aldo',14],['Gianfranco',14],['Sandro',14],['Renato',14],['Salvo',14],['Samuele',14],['Daniel',14],['Pino',14],['Umberto',14],['Alfredo',14],
              ['Mimmo',14],['Giuliano',14],['Adriano',14],['Alfonso',14],['Nino',14],['Walter',14],['Peppe',14],['Gino',14],['Flavio',14],['Guido',14],['Nicolò',14],
              ['Mohamed',14],['Cosimo',14],['Donato',14],['Sebastiano',14]
            ]
          },
          last: [
            ['Rossi',100],['Russo',89],['Esposito',85],['Romano',59],['Ferrari',51],['Marino',51],['Bianchi',48],['Greco',48],['Giordano',46],['De Luca',45],
            ['Gallo',45],['Rizzo',44],['Ricci',42],['Caruso',41],['Costa',41],['Ferrara',40],['Santoro',40],['Leone',39],['Colombo',38],['Vitale',38],
            ['Mancini',38],['Conti',37],['Lombardi',37],['Amato',37],['Conte',36],['Moretti',32],['Barbieri',30],['Fontana',33],['Coppola',38],['Villa',25],
            ['Martini',30],['Pagani',17],['Nannini',2],['Bruno',48],['D\'Angelo',37],['Longo',36],['Messina',36],['Lombardo',35],['Gentile',35],['Parisi',35],
            ['Fiore',35],['Bianco',35],['Palumbo',34],['De Rosa',34],['Serra',34],['Rinaldi',34],['Ferraro',32],['Grasso',32],['Caputo',32],['Martino',32],
            ['Sorrentino',32],['Barone',32],['Carbone',31],['Basile',31],['Pellegrino',31],['Sanna',31],['D\'Amico',30],['De Santis',30],['Romeo',30],['Pagano',30],
            ['Orlando',30],['Ruggiero',30],['Testa',29],['Mariani',29],['De Angelis',29],['Martinelli',29],['Piras',29],['Rosa',28],['Marini',28],['Fusco',28],
            ['Ferri',28],['Morelli',28],['Napoli',28],['D\'Agostino',28],['Stella',28],['Catalano',28],['Palmieri',28],['De Simone',28],['Garofalo',28],
            ['Farina',27],['Calabrese',27],['Galli',27],['Mazza',27],['Napolitano',27],['Silvestri',27],['Pinna',26],['Cirillo',26],['Marchetti',26],
            ['Battaglia',26],['Pepe',26],['Costanzo',26],['Valente',26],['Monti',26],['Grimaldi',26],['Pellegrini',26],['Pace',26],['Perrone',26],['Melis',26],
            ['Monaco',26],['Arena',26],['Aiello',25],['Volpe',25],['Viola',25],['Carta',25],['Ferro',25],['Guerra',25],['Salerno',25],['Mele',25],['Rizzi',25],
            ['Ferrante',25],['Neri',25],['Palma',25],['Piccolo',25],['Milano',25],['Fabbri',25],['Giovanni',25],['Gatti',25],['Dambrosio',25],['Mancuso',25],
            ['Grassi',25],['Valentini',25],['Leo',24],['Giuliani',24],['Dalessandro',24],['Ventura',24],['Spina',24],['Sala',24],['Marchese',24],['Pastore',24],
            ['Pugliese',24],['Bevilacqua',24],['Roberto',24],['Manca',24],['Meloni',24],['Marra',24],['Palermo',24],['Izzo',23],['Spinelli',23],['Capasso',23],
            ['Guarino',23],['Daniele',23],['Piazza',23],['Roma',23],['Grillo',23],['Valenti',23],['Forte',23],['Natale',23],['Rossetti',23],['Andrea',23],
            ['Riccio',23],['Stefano',23],['Oliva',23],['De Marco',23],['Bernardi',23],['Di Stefano',23],['Gargiulo',23],['Rubino',23],['Guida',22],['Cavallo',22],
            ['Falcone',22],['Diana',22],['Sacco',22],['Elena',22],['Giuliano',22],['Pisano',22],['Moro',22],['Albanese',22],['Leonardi',22],['Castelli',22],
            ['Marinelli',22],['Olivieri',22],['Bellini',22],['Gagliardi',22],['Costantini',22],['Mura',22],['Lorusso',22],['Borrelli',22],['Poli',21],
            ['Cozzolino',21],['Bruni',21],['Ruggeri',21],['Costantino',21],['Tarantino',21],['Paolo',21],['Cavallaro',21],['Gatto',21],['Ndiaye',21],['La Rosa',21],
            ['Graziano',21],['Mosca',21],['Ferretti',21],['Fazio',21],['Massa',21],['Ranieri',21],['Barbato',21],['Falco',21],['Vinci',21],['Riva',21],
            ['Maggio',21],['Proietti',21],['De Martino',21],['Catania',21],['Fortunato',21],['Iorio',20],['Santini',20],['Vitali',20],['Alessandro',20],
            ['Genovese',20],['Tedesco',20],['Rocco',20],['Bella',20],['Basso',20],['Lupo',20],['Manzo',20],['Federico',20],['Vaccaro',20],['Giorgi',20],
            ['Dandrea',20],['Antonelli',20],['Marotta',20],['Lai',20],['Donati',20],['Milani',20],['Hossain',20],['Ricciardi',20],['Damato',20],['Colucci',20],
            ['Cosentino',20],['Vincenzo',20],['Pappalardo',20],['Donato',20],['Villani',20],['Abate',20],['Vitiello',20],['Alfano',20],['Scognamiglio',20],
            ['Cocco',20],['Cattaneo',20],['Diop',20],['Giannini',20],['Angelini',20],['Giglio',20],['Landi',20],['Colella',20],['Bosco',20],['Toscano',20],
            ['Liguori',19],['Castaldo',19],['Gabriele',19],['Puglisi',19],['Motta',19],['Nigro',19],['Di Martino',19],['Valentino',19],['Sartori',19],['Bello',19],
            ['Verde',19],['Mantovani',19],['Marchi',19],['Montanari',19],['Mario',19],['Massaro',19],['Maggi',19],['Capuano',19],['Perna',19],['Nardi',19],
            ['Delia',19],['Clemente',19],['Grossi',19],['Trovato',19],['Berti',19],['Pesce',19],['Leoni',19]
          ] }
    ] },

    // ── FRA ──
    FRA: { regions: [
        { w: 0.9,
          first: {
            early: [
              ['Jean',5],['Pierre',5],['Maurice',4],['André',4],['Robert',4],['Jacques',4],['Henri',4],['François',4],['Louis',3],['Guy',3],['Marcel',3],
              ['Bernard',3],['Georges',3],['Claude',3],['Yves',2],['Jo',1]
            ],
            mid: [
              ['Nicolas',100],['Julien',92],['Philippe',90],['Christophe',89],['Laurent',80],['Alexandre',76],['Olivier',73],['Éric',79],['Pascal',71],['Thierry',71],
              ['Vincent',70],['Guillaume',73],['Patrick',76],['Stéphane',81],['Sébastien',84],['Franck',61],['Alain',76],['Anthony',69],['Antoine',67],['Didier',57],
              ['Jean-Pierre',31],['René',28],['David',94],['Thomas',86],['Pierre',83],['Michel',81],['Kevin',77],['Romain',71],['Frédéric',71],['Maxime',70],
              ['Jean',67],['Jérôme',65],['Christian',63],['Daniel',62],['Bruno',61],['Jérémy',61],['Cédric',60],['Quentin',59],['François',59],['Mathieu',58],
              ['Florian',57],['Benjamin',56],['Lucas',56],['Mickaël',56],['Clément',56],['Alexis',56],['Marc',55],['Alex',55],['Damien',54],['Bernard',54],
              ['Paul',53],['Arnaud',52],['Hugo',51],['Dominique',50],['Théo',50],['Sylvain',50],['Gérard',50],['Valentin',49],['Jonathan',49],['Adrien',48],
              ['Fabrice',48],['Claude',48],['Fabien',48],['Loic',47],['Jacques',47],['Benoît',47],['Ludovic',46],['Dylan',46],['Cyril',45],['Louis',45],['Gilles',45],
              ['Ali',44],['Hervé',43],['Tony',42],['Xavier',42],['Serge',42],['Yann',42],['Jordan',41],['Denis',41],['Patrice',41],['André',41],['Enzo',41],
              ['Aurélien',40],['Ahmed',40],['Matthieu',39],['Baptiste',39],['Emmanuel',39],['Jose',39],['Raphael',39],['Rémi',39],['Gregory',38],['Fred',37],
              ['Yannick',37],['Yves',37],['Victor',37],['Tom',37],['Léo',37],['Arthur',37],['Joel',36],['Guy',36],['Axel',36],['Simon',36],['Lionel',36],
              ['Charles',35],['Samuel',35],['Florent',34],['Michael',34],['Corentin',34],['William',34],['Robert',34],['Jean Pierre',34],['Nathan',34],['Francis',33],
              ['Richard',33],['Max',32],['Remy',32],['Bastien',32],['Thibault',31],['Gaetan',30],['Nico',30],['Jean Claude',30],['Abdel',30],['Steven',30],
              ['Chris',30],['Georges',30],['Momo',30],['Gabriel',29],['Luc',29],['Yoann',29],['Manu',28],['Jimmy',28],['Martin',28],['Samir',28],['John',28],
              ['Bertrand',28],['Ben',27],['Manuel',27],['Seb',27],['Christopher',27],['Said',27],['Roger',27],['Dimitri',27],['Jules',26],['Henri',26],
              ['Jean-Luc',26],['Joseph',26],['Antonio',26],['Jean-Claude',26],['Robin',26],['Regis',26],['Maxence',25],['Mathis',25],['Sam',25],['Jacky',25],
              ['Thibaut',25],['Bryan',25],['Tristan',25],['Etienne',25],['Dorian',24],['Jean Luc',24],['Mohammed',24],['Adam',24],['Kamel',24],['Geoffrey',24],
              ['Marcel',24],['Jean-Marc',24],['Carlos',24],['Morgan',24]
            ],
            modern: [
              ['Hugo',90],['Lucas',90],['Arthur',90],['Maxime',90],['Romain',90],['Paul',45],['Victor',45],['Jules',45],['Léo',45],['Nathan',45],['Enzo',45],
              ['Antoine',45],['Théo',45],['Pierre',45],['Clément',26],['Esteban',12],['David',14],['Thomas',14],['Michel',14],['Kevin',14],['Frédéric',14],
              ['Jean',14],['Jérôme',14],['Christian',14],['Daniel',14],['Bruno',14],['Jérémy',14],['Cédric',14],['Quentin',14],['François',14],['Mathieu',14],
              ['Florian',14],['Benjamin',14],['Mickaël',14],['Alexis',14],['Marc',14],['Alex',14],['Damien',14],['Bernard',14],['Arnaud',14],['Dominique',14],
              ['Sylvain',14],['Gérard',14],['Valentin',14],['Jonathan',14],['Adrien',14],['Fabrice',14],['Claude',14],['Fabien',14],['Loic',14],['Jacques',14],
              ['Benoît',14],['Ludovic',14],['Dylan',14],['Cyril',14],['Louis',14],['Gilles',14],['Ali',14],['Hervé',14],['Tony',14],['Xavier',14],['Serge',14],
              ['Yann',14],['Jordan',14],['Denis',14],['Patrice',14],['André',14],['Aurélien',14],['Ahmed',14],['Matthieu',14],['Baptiste',14],['Emmanuel',14],
              ['Jose',14],['Raphael',14],['Rémi',14],['Gregory',14],['Fred',14],['Yannick',14],['Yves',14],['Tom',14],['Joel',14],['Guy',14],['Axel',14],['Simon',14]
            ]
          },
          last: [
            ['Martin',100],['Bernard',63],['Dubois',62],['Thomas',61],['Petit',60],['Durand',58],['Richard',57],['Robert',55],['Simon',54],['Laurent',57],
            ['Michel',58],['Leroy',53],['Moreau',53],['Lefebvre',53],['Vincent',45],['Bertrand',44],['Roux',41],['Fournier',43],['Girard',41],['Morel',42],
            ['Mercier',40],['Blanc',40],['Garnier',39],['Lemaire',36],['Marchand',35],['Chevalier',39],['Renard',33],['Beaumont',12],['Vasseur',28],['Perrot',22],
            ['Delacroix',2],['Arnoux',2],['Dupont',59],['François',46],['Nicolas',44],['Legrand',43],['Lambert',43],['Pierre',42],['Muller',42],['Rousseau',41],
            ['Fontaine',41],['Fernández',39],['Clément',39],['Bonnet',39],['Mathieu',39],['Henry',38],['Lucas',38],['Duval',38],['Perrin',37],['Gauthier',37],
            ['Philippe',37],['Lefèvre',37],['Roussel',37],['Robin',36],['Faure',36],['Morin',36],['Gautier',36],['Masson',35],['Dumont',35],['Meyer',34],
            ['Joly',34],['Boyer',34],['Rose',34],['Dufour',34],['Caron',34],['Louis',34],['Arnaud',33],['Meunier',33],['Guerin',33],['Leroux',32],['Guillaume',32],
            ['Roy',32],['Brunet',32],['Barbier',32],['Vidal',32],['Brun',32],['Blanchard',31],['Schmitt',31],['Colin',31],['Benoît',31],['Noël',31],['Dupuis',31],
            ['Lemoine',30],['Gaillard',30],['Leclerc',30],['Giraud',30],['Renaud',30],['Charles',30],['Gérard',30],['Paul',29],['Aubert',29],['Rey',29],
            ['Carpentier',29],['Alexandre',29],['Roche',29],['Picard',29],['Leclercq',29],['Bourgeois',29],['Fabre',29],['Lacroix',29],['Dumas',29],['Lecomte',28],
            ['Hubert',28],['Deschamps',27],['Berger',27],['Rolland',27],['Cohen',27],['Line',27],['Klein',27],['France',26],['Smith',26],['Moulin',26],
            ['Bertin',26],['Sam',26],['Diop',26],['Fleury',26],['Guillot',26],['Aubry',26],['Baron',25],['Dupuy',25],['Momo',25],['Maillard',25],['Royer',25],
            ['Schneider',25],['Didier',25],['Renault',25],['Huet',25],['Guyot',25],['Leblanc',25],['Coco',25],['Lie',25],['Langlois',24],['Jacquet',24],
            ['Boucher',24],['Germain',24],['Christophe',24],['Charpentier',24],['Poirier',24],['Dia',24],['Cousin',24],['Amg',24],['Jacques',24],['Lebrun',24],
            ['Marchal',24],['Joseph',24],['Marty',24],['Boulanger',24],['Thierry',24],['Collet',24],['Bailly',24],['Bouvier',23],['Riviere',23],['Paris',23],
            ['Millet',23],['Marin',23],['Remy',23],['De Oliveira',23],['Marc',23],['Rossi',23],['Monnier',23],['Weber',23],['Poulain',23],['Jacob',23],
            ['Etienne',22],['Pelletier',22],['Man',22],['Carlier',22],['Breton',22],['Albert',22],['Bel',22],['Le Gall',22],['Perrier',22],['Mallet',22],
            ['Gilles',22],['Gilbert',22],['Delattre',22],['Tessier',22],['Bruno',22],['Alex',22],['Chevallier',22],['Cordier',22],['Hamon',22],['Besson',22],
            ['Lejeune',22],['Sauvage',22],['Collin',22],['Lemaitre',21],['Delaunay',21],['Michaud',21],['Lesage',21],['Valentin',21],['Marion',21],['Lamy',21],
            ['Perret',21],['Mary',21],['Giménez',21],['Lili',21],['Maurice',21],['Guichard',21],['Chauvin',21],['Le Roux',21],['Le Goff',21],['Humbert',21],
            ['Levy',21],['Lenoir',21],['Pasquier',21],['Gillet',21],['Pons',20],['New',20],['Leduc',20],['Pires',20],['Diakite',20],['Leger',20],['Martel',20],
            ['Weiss',20],['Voisin',20],['Loulou',20],['Briand',20],['Mendy',20],['Hardy',20],['Launay',20],['Blondel',20],['Sarah',20],['Camus',20],['Prevost',20],
            ['Boubou',20],['James',20],['Besnard',20],['Romain',20],['Payet',20],['Qlf',20],['Lacoste',20],['Diawara',20],['Guy',19],['Bouchet',19],['Mas',19],
            ['Pichon',19],['Gros',19],['Thibault',19],['Bigot',19],['Laporte',19],['Anne',19],['Duhamel',19],['Guillet',19],['Ollivier',19],['Raymond',19],
            ['Buisson',19],['Evrard',19],['Sidibe',19],['Coste',19],['Colas',19],['Menard',19],['Reynaud',19],['Delorme',19],['Courtois',19],['Allard',19],
            ['Devaux',19]
          ] },
        { w: 0.1, minYear: 1995,
          first: [
            ['Mehdi',37],['Karim',43],['Mohamed',67],['Yanis',28],['Rayan',22],['Sami',22],['Bilal',16],['Ibrahim',21],['Rachid',29],['Amine',29],['Sofiane',25],
            ['Moussa',24]
          ],
          last: [
            ['Benali',26],['Diallo',56],['Traoré',46],['Saidi',12],['Cherif',12],['Haddad',19],['Camara',47],['Keita',27],['Sylla',31],['Cissé',29],['Ndiaye',33],
            ['Toure',32],['Coulibaly',31],['Fofana',31],['Diaby',31],['Diarra',29],['Sow',28],['Bah',25],['Sissoko',24],['Barry',23],['Drame',22],['Moussa',21],
            ['Konate',21],['Kone',21],['Sacko',20]
          ] }
    ] },

    // ── USA ──
    USA: { regions: [
        { w: 1,
          first: {
            early: [
              ['Bill',5],['Jim',5],['Bob',5],['Jack',4],['Dan',4],['Sam',3],['Tony',3],['Eddie',3],['Johnny',3],['Don',3],['Chuck',2],['Gene',2],['Lee',2],
              ['Richie',2],['Walt',1],['Rodger',1]
            ],
            mid: [
              ['Michael',95],['John',94],['David',100],['Chris',72],['Mark',58],['Scott',44],['Jeff',44],['Brian',57],['Kevin',63],['Eric',53],['Anthony',57],
              ['Jason',55],['Ryan',51],['Josh',41],['Justin',47],['Brad',23],['Kyle',35],['Danny',34],['Casey',14],['Chad',22],['Daniel',73],['James',70],['Alex',70],
              ['Mike',68],['Robert',68],['Jose',67],['Joe',55],['Jesús',53],['Andrew',52],['Richard',50],['Paul',49],['William',49],['Victor',49],['Jonathan',48],
              ['Joseph',48],['Tony',47],['Brandon',47],['Matt',47],['Steve',46],['Juan',46],['Matthew',45],['Nick',44],['Christopher',43],['Steven',42],['Carlos',41],
              ['Luis',40],['Thomas',40],['Adam',40],['Joshua',39],['Jay',39],['Frank',39],['Martin',38],['Jim',38],['George',38],['Aaron',38],['Tim',38],['Tom',38],
              ['Héctor',38],['Dan',37],['Charles',37],['Patrick',37],['Jacob',37],['Sam',36],['Tyler',36],['Peter',36],['Christian',35],['Ben',35],['Bill',35],
              ['Bob',35],['Sean',35],['Joel',35],['Gabriel',34],['Raúl',34],['Bryan',34],['Gary',34],['Greg',33],['Jack',33],['Adrian',32],['Stephen',32],
              ['Jeremy',32],['Larry',32],['Samuel',32],['Dave',32],['Edgar',31],['Jesse',31],['Jerry',31],['Jorge',30],['Alexander',30],['Jake',30],['Rick',30],
              ['Andy',30],['Jordan',30],['Nathan',29],['Miguel',29],['Andrés',29],['Austin',29],['Jon',29],['Johnny',29],['Keith',28],['Henry',28],['Jimmy',28],
              ['Marco',28],['Edward',28],['Alan',28],['Randy',28],['Dennis',27],['Rob',27],['Edwin',27],['Shawn',26],['Eddie',26],['Ron',26],['Ray',26],
              ['Jeffrey',26],['Kenneth',26],['Manuel',26],['Will',26],['Antonio',25],['Don',25],['Ken',25],['Benjamin',25],['Bobby',25],['Marcos',25],['Nicholas',25],
              ['Leo',24],['Roger',24],['Angel',24],['Max',24],['Mario',24],['Hugo',24],['Timothy',24],['Travis',24],['Cody',24],['Francisco',24],['Dylan',24],
              ['Ali',24],['Ronald',24],['Terry',24],['Erick',24],['Isaac',24],['Oscar',23],['Joey',23],['Zach',23],['Walter',23],['Junior',23],['Billy',23],
              ['Rene',23],['Todd',23],['Craig',23],['Pedro',23],['Julian',23],['Javier',23],['Erik',23],['Nelson',23],['Ricky',23],['Donald',22],['Marcus',22],
              ['Derek',22],['Ian',22],['Raymond',22],['Felix',22],['Charlie',22],['Tommy',22],['Doug',21],['Marvin',21],['Jared',21],['Bruce',21],['Albert',21],
              ['Fernando',21],['Fred',21],['Wayne',21]
            ],
            modern: [
              ['Tyler',45],['Austin',45],['Mason',45],['Ethan',45],['Jake',45],['Zach',45],['Connor',45],['Dylan',45],['Liam',45],['Noah',45],['José',26],['Juan',26],
              ['Carlos',26],['Luis',26],['Chase',26],['Cole',26],['Logan',26],['Colton',26],['Hunter',26],['Josef',2],['Daniel',14],['James',14],['Alex',14],
              ['Mike',14],['Robert',14],['Joe',14],['Jesús',14],['Andrew',14],['Richard',14],['Paul',14],['William',14],['Victor',14],['Jonathan',14],['Joseph',14],
              ['Tony',14],['Brandon',14],['Matt',14],['Steve',14],['Matthew',14],['Nick',14],['Christopher',14],['Steven',14],['Thomas',14],['Adam',14],['Joshua',14],
              ['Jay',14],['Frank',14],['Martin',14],['Jim',14],['George',14],['Aaron',14],['Tim',14],['Tom',14],['Héctor',14],['Dan',14],['Charles',14],
              ['Patrick',14],['Jacob',14],['Sam',14],['Peter',14],['Christian',14],['Ben',14],['Bill',14],['Bob',14],['Sean',14],['Joel',14],['Gabriel',14],
              ['Raúl',14],['Bryan',14],['Gary',14],['Greg',14],['Jack',14],['Adrian',14],['Stephen',14],['Jeremy',14],['Larry',14],['Samuel',14],['Dave',14],
              ['Edgar',14],['Jesse',14],['Jerry',14],['Jorge',14],['Alexander',14],['Rick',14],['Andy',14],['Jordan',14],['Nathan',14],['Miguel',14],['Andrés',14],
              ['Jon',14],['Johnny',14],['Keith',14],['Henry',14]
            ]
          },
          last: [
            ['Smith',100],['Johnson',86],['Williams',79],['Brown',73],['Jones',75],['Garcia',66],['Miller',55],['Davis',58],['Wilson',48],['Anderson',47],
            ['Taylor',47],['Moore',44],['Martinez',62],['Hernandez',65],['Rodriguez',63],['Lopez',63],['Jackson',50],['White',43],['Harris',43],['Thompson',42],
            ['Robinson',39],['Clark',36],['Lewis',40],['Walker',38],['Hall',34],['Carter',32],['Rivera',34],['Young',36],['Allen',36],['Lee',53],['Mitchell',31],
            ['Parker',29],['Turner',28],['Nguyen',33],['Patel',30],['González',56],['Pérez',52],['Sánchez',46],['Castro',45],['Romero',45],['Ramírez',44],
            ['Fernández',40],['King',39],['Mejía',38],['Flores',37],['Alvarado',37],['Silva',37],['Torres',36],['Green',36],['Scott',35],['James',35],['Gómez',35],
            ['Gonzales',34],['Díaz',34],['Wright',34],['Reyes',34],['Hill',33],['Nelson',33],['Ortega',33],['Adams',32],['Garza',32],['Morales',32],['Campbell',31],
            ['Luna',31],['Kim',30],['Baker',30],['Roberts',29],['Edwards',29],['Joseph',29],['Rose',29],['Evans',29],['Ortiz',29],['Love',28],['Stewart',28],
            ['Figueroa',28],['Rivas',28],['Ramos',28],['Phillips',28],['Collins',27],['Morris',27],['Mendoza',27],['Bell',27],['Castillo',26],['Pineda',26],
            ['Gutiérrez',26],['Morgan',26],['Ruiz',26],['Murphy',26],['Rogers',26],['Álvarez',26],['Jiménez',25],['Cooper',25],['Alexander',25],['Kelly',25],
            ['Peterson',25],['Bailey',25],['Santana',25],['Duran',25],['Cook',25],['Ross',24],['Aguirre',24],['Richardson',24],['Howard',24],['Arias',24],
            ['Brooks',24],['Calderon',24],['Gray',24],['Aguilar',24],['Chávez',24],['Bonilla',24],['Watson',24],['Guerra',23],['Jordan',23],['Reed',23],
            ['Pacheco',23],['Sosa',23],['Bennett',23],['Ward',23],['Chen',23],['Sanders',23],['Washington',22],['Andrade',22],['Herrera',22],['Vásquez',22],
            ['Coleman',22],['Méndez',22],['Foster',22],['Wood',22],['Price',22],['Moreno',22],['Lynn',22],['Jenkins',22],['Black',22],['Powell',22],['Butler',22],
            ['Cox',22],['Vargas',22],['Henderson',22],['Barnes',22],['Gordon',22],['Henry',22],['Medina',22],['Guzmán',22],['Nicole',22],['Perry',21],['Wang',21],
            ['Long',21],['Salas',21],['Hughes',21],['Russell',21],['Guevara',21],['Benitez',21],['Portillo',21],['Cole',21],['Sullivan',21],['Roman',21],
            ['Simmons',21],['West',21],['Graham',21],['Wallace',21],['Hamilton',21],['George',21],['Ford',20],['Lozano',20],['Rosario',20],['Vazquez',20],
            ['Patterson',20],['Wong',20],['Woods',20],['Tran',20],['Melendez',20],['Zavala',20],['Fisher',20],['Myers',20],['Murray',20],['Ellis',20],
            ['Marshall',20],['Grant',20],['Rubio',20],['Beltran',20],['Amaya',20],['Bryant',20],['Rangel',20],['Griffin',20],['Tapia',20],['Ann',19],['Paul',19],
            ['Harrison',19],['Hayes',19],['Reynolds',19],['Singh',19],['Muñoz',19],['Macias',19],['Hunter',19],['Ray',19],['Freeman',19],['John',19],['Acevedo',19],
            ['Kennedy',19],['Stevens',19],['Valenzuela',19],['Orellana',19],['Mercado',19],['Marin',19],['Ventura',19],['Salazar',19],['Charles',19],['Chan',19],
            ['Mcdonald',19],['De Leon',19],['Trujillo',19],['Cohen',19],['Rosas',19],['Gibson',19],['Moran',19],['Ryan',19],['Stone',19],['Soto',19],['Peña',19],
            ['Rocha',19],['Blanco',19],['Wells',19],['Peralta',19],['Elizabeth',19],['Murillo',19],['Dixon',19],['Colon',18],['Porter',18],['Duarte',18],
            ['Velez',18],['Palmer',18],['Pierre',18],['Shaw',18],['Tucker',18],['Gallegos',18],['Owens',18],['Mason',18],['Castaneda',18],['Trejo',18],['Banks',18],
            ['Arellano',18],['Simpson',18],['Holmes',18],['Salgado',18],['Contreras',18],['Rojas',18],['Núñez',18],['Crawford',18],['Villegas',18],['Daniels',18],
            ['Huerta',18],['Olson',18],['Mata',18],['Reid',18],['Fox',18],['Nava',17],['Lucas',17],['Estrada',17],['Alfaro',17],['Robertson',17],['Lawrence',17],
            ['Richards',17],['Webb',17],['Liu',17],['Knight',17],['Guerrero',17],['Mills',17],['Burns',17],['Park',17],['Maldonado',17],['Delgado',17],
            ['Matthews',17],['Warren',17],['Corona',17],['Cuevas',17]
          ] }
    ] },

    // ── BRA ──
    BRA: { regions: [
        { w: 1,
          first: {
            early: [
              ['José',5],['Carlos',5],['Luiz',4],['Antônio',4],['Francisco',4],['Paulo',4],['Roberto',4],['Sérgio',3],['Marcos',3],['Fernando',3],['Ricardo',3],
              ['Nelson',2],['Wilson',2],['Chico',2],['Emerson',1],['Ayrton',1]
            ],
            mid: [
              ['Marcos',81],['Carlos',80],['Paulo',79],['Marcelo',66],['Bruno',69],['Felipe',65],['Rodrigo',64],['Eduardo',65],['André',58],['Gustavo',57],
              ['Thiago',57],['Ricardo',55],['Fernando',62],['Leandro',58],['Anderson',60],['Diego',54],['Luciano',42],['Maurício',33],['Cristiano',32],['Rubens',17],
              ['Tarso',2],['José',100],['João',97],['Lucas',95],['Antônio',79],['Francisco',79],['Gabriel',77],['Rafael',73],['Pedro',73],['Daniel',65],
              ['Matheus',65],['Luiz',62],['Junior',59],['Guilherme',57],['Fabio',56],['Leonardo',54],['Marcio',51],['Alexandre',50],['Vinicius',47],['Edson',47],
              ['Adriano',47],['Alex',47],['Roberto',46],['Tiago',45],['Douglas',43],['Mateus',42],['Víctor',42],['Henrique',42],['Sergio',41],['Renato',40],
              ['Claudio',39],['Luis',39],['Vitor',38],['Rogerio',37],['Samuel',37],['Ronaldo',36],['Robson',35],['Jefferson',35],['Jorge',35],['Flavio',35],
              ['Julio',34],['Igor',34],['Cicero',34],['Manoel',34],['Jean',33],['Danilo',33],['Wellington',33],['David',32],['Luan',32],['Emerson',31],['Wesley',31],
              ['Renan',31],['Raimundo',31],['Davi',30],['Willian',30],['Jonas',29],['Alan',29],['William',29],['Fabiano',29],['Reginaldo',29],['Jeferson',29],
              ['Caio',28],['Wagner',28],['Arthur',28],['Gilberto',28],['Juliano',28],['Everton',27],['Mario',27],['Diogo',27],['Fabricio',27],['Gilmar',26],
              ['Alisson',26],['Sandro',26],['Leo',26],['Miguel',26],['César',25],['Valdir',25],['Wilson',25],['Adilson',25],['Alessandro',25],['Maicon',25],
              ['Jonathan',24],['Elias',24],['João Paulo',24],['Iván',24],['Evandro',24],['Cleiton',24],['Jackson',24],['Ademir',24],['Gilson',23],['Jair',23],
              ['Joel',23],['Pablo',22],['Nelson',22],['Vanderlei',22],['Edilson',22],['Mauro',22],['Sebastião',21],['Valmir',21],['Erick',21],['Jose Carlos',21],
              ['Murilo',21],['Marco',20],['Allan',20],['Silvio',20],['Emanuel',20],['Celso',20],['Geraldo',20],['Augusto',20],['Israel',20],['Moises',19],['Neto',19],
              ['Valdecir',19],['Jailson',19],['Vagner',19],['Kauan',19],['Nilson',19],['Michel',19],['Yuri',19],['Ruan',19],['Hugo',19],['Luiz Carlos',19],
              ['Ismael',18],['Claudinei',18],['Charles',18],['Maycon',18],['Cleber',18],['Breno',18],['Nicolás',18],['Gerson',18],['Italo',18],['João Vitor',18],
              ['Reinaldo',18],['Sidnei',17],['Ailton',17],['Geovane',17],['Joaquim',17],['Claudemir',17],['Jhonatan',17],['Filipe',17],['Damião',17],['Osmar',17],
              ['Edmilson',17],['Denilson',17],['Eder',17],['Patrick',17],['Kauã',17],['Helio',17],['Marlon',17],['Alberto',17],['Ramón',16]
            ],
            modern: [
              ['Gabriel',90],['Lucas',90],['Pedro',90],['Rafael',90],['Matheus',90],['João',90],['Enzo',45],['Felipe',45],['Guilherme',45],['Arthur',45],
              ['Miguel',45],['Caio',26],['Vinícius',26],['Davi',26],['Bernardo',26],['Heitor',12],['José',14],['Antônio',14],['Francisco',14],['Daniel',14],
              ['Luiz',14],['Junior',14],['Fabio',14],['Leonardo',14],['Marcio',14],['Alexandre',14],['Edson',14],['Adriano',14],['Alex',14],['Roberto',14],
              ['Tiago',14],['Douglas',14],['Mateus',14],['Víctor',14],['Henrique',14],['Sergio',14],['Renato',14],['Claudio',14],['Luis',14],['Vitor',14],
              ['Rogerio',14],['Samuel',14],['Ronaldo',14],['Robson',14],['Jefferson',14],['Jorge',14],['Flavio',14],['Julio',14],['Igor',14],['Cicero',14],
              ['Manoel',14],['Jean',14],['Danilo',14],['Wellington',14],['David',14],['Luan',14],['Emerson',14],['Wesley',14],['Renan',14],['Raimundo',14],
              ['Willian',14],['Jonas',14],['Alan',14],['William',14],['Fabiano',14],['Reginaldo',14],['Jeferson',14],['Wagner',14],['Gilberto',14],['Juliano',14],
              ['Everton',14],['Mario',14],['Diogo',14],['Fabricio',14],['Gilmar',14],['Alisson',14],['Sandro',14],['Leo',14],['César',14],['Valdir',14],['Wilson',14],
              ['Adilson',14],['Alessandro',14],['Maicon',14]
            ]
          },
          last: [
            ['Silva',100],['Santos',73],['Oliveira',61],['Souza',50],['Lima',50],['Alves',49],['Rodrigues',47],['Sousa',43],['Ferreira',43],['Pereira',42],
            ['Costa',33],['Gomes',38],['Martins',31],['Soares',30],['Ribeiro',30],['Fernandes',29],['Nascimento',28],['Lopes',27],['Carvalho',27],['Almeida',27],
            ['Vieira',26],['Araújo',35],['Barbosa',25],['Rocha',24],['Andrade',23],['Dias',21],['Cardoso',20],['Nunes',22],['Freitas',22],['Moraes',15],
            ['Teixeira',16],['Camargo',11],['Duarte',15],['Fonseca',9],['Diniz',8],['Da Silva',26],['Gonçalves',23],['Mendes',21],['Marques',21],['Dos Santos',20],
            ['Batista',20],['Melo',20],['Machado',19],['Santana',19],['Moreira',19],['Moura',19],['Ramos',18],['Medeiros',18],['Bezerra',17],['Borges',17],
            ['Morais',16],['Barros',16],['Brito',16],['Monteiro',15],['Pinheiro',15],['Castro',15],['Farias',15],['Rosa',15],['Dantas',14],['Miranda',14],
            ['Cavalcante',14],['Nogueira',14],['Reis',14],['Tavares',13],['Campos',13],['Silveira',13],['Antônio',13],['Cruz',13],['Leite',13],['Viana',13],
            ['García',13],['Maia',13],['Felix',12],['Xavier',12],['Sales',12],['Queiroz',12],['Macedo',12],['Amorim',12],['Mello',11],['França',11],
            ['Vasconcelos',11],['Correa',11],['Coelho',11],['Siqueira',11],['Cordeiro',11],['Cunha',11],['Azevedo',11],['Vitoria',11],['Aguiar',11],
            ['Albuquerque',11],['César',11],['Alencar',11],['Pires',11],['Matos',11],['Paiva',11],['Menezes',11],['Correia',11],['Sampaio',11],['Maciel',11],
            ['Amaral',10],['Torres',10],['Neves',10],['Braga',10],['Magalhães',10],['Jesús',10],['Freire',10],['Guimarães',10],['Antunes',10],['Feitosa',10],
            ['Leal',10],['Bueno',9],['Mota',9],['Víctor',9],['Santiago',9],['Chaves',9],['Carneiro',9],['Lemos',9],['Cabral',9],['Mesquita',9],['Guedes',9],
            ['Abreu',9],['Lira',9],['Matías',9],['Vitor',8],['Lucia',8],['Vinicius',8],['Barreto',8],['Júnior',8],['De Lima',8],['Fernanda',8],['Prado',8],
            ['Beatriz',8],['Vicente',8],['Pacheco',8],['Eduarda',8],['Marinho',8],['Pontes',8],['Regina',8],['Leandro',7],['Lourenço',7],['Muniz',7],['Padilha',7],
            ['Sena',7],['Caetano',7],['Bernardo',7],['Kelly',7],['Holanda',7],['Arruda',7],['Assis',7],['Mendonça',7],['De Jesus',7],['Mariano',7],['Saraiva',7],
            ['Dutra',7],['Pinto',7],['Luz',7],['Guilherme',7],['Lacerda',7],['Chagas',7],['Fagundes',7],['De Paula',7],['Nobre',7],['Alcantara',7],['Aquino',7],
            ['Paulino',7],['Caroline',7],['Ferraz',7],['Figueiredo',7],['Matheus',7],['Bastos',7],['Candido',7],['Passos',7],['Franco',6],['Domingos',6],
            ['Bruno',6],['Lins',6],['Conceição',6],['Pessoa',6],['Vargas',6],['Mattos',6],['Rodrigo',6],['Clara',6],['Furtado',6],['Manoel',6],['Coutinho',6],
            ['Paz',6],['Luiza',6],['Cavalcanti',6],['Linhares',6],['Teles',6],['Mateus',6],['Galdino',6],['Trindade',6],['Gustavo',6],['Damasceno',6],['Helena',6],
            ['Braz',6],['Brandão',6],['Vidal',6],['Pedroso',6],['Veras',6],['Borba',6],['Lucena',6],['De Sousa',6],['Peixoto',6],['Aparecido',6],['Vaz',6],
            ['Alberto',6],['Domingues',6],['Carla',6],['Carolina',6],['Elias',6],['Barboza',6],['Anjos',6],['Oliver',5],['Marcelino',5],['Adriano',5],['Sillva',5],
            ['Bandeira',5],['Goulart',5],['Galvão',5],['Motta',5],['Da Rosa',5],['Santtos',5],['Faria',5],['Da Costa',5],['Pimentel',5],['Fatima',5],
            ['Evangelista',5],['Pjl',5],['Lisboa',5],['Bittencourt',5],['Bispo',5],['Douglas',5],['Inacio',5],['Porto',5],['Peres',5],['Sabino',5],['Salles',5],
            ['Becker',5],['Portela',5],['Moreno',5],['Barroso',5],['Meneses',5],['Veloso',5],['Tomaz',5],['Carmo',5],['Rabelo',5],['Schneider',5],
            ['Pereira Da Silva',5],['Messias',5],['Muller',5],['Sergio',5],['Sanches',5],['Rezende',5],['Lara',5],['Flores',5],['Amaro',5],['Guerra',5],
            ['Ferrari',5],['Mara',5],['Camilo',5],['Siilva',5],['Veiga',5],['Lino',5],['Lemes',5],['Gonzaga',5],['Serafim',5],['Avelino',5],['Raquel',5],
            ['Faustino',5],['Marcelo',5],['Leonardo',5],['Firmino',5],['Ventura',5]
          ] }
    ] },

    // ── JPN ──
    JPN: { regions: [
        { w: 1,
          first: {
            early: [
              ['Hiroshi',4],['Kenji',3],['Akira',3],['Masahiro',3],['Takao',2],['Osamu',2],['Yoshio',2],['Shigeru',2],['Kazuyoshi',2],['Noritake',1],['Kunimitsu',1],
              ['Tetsu',1]
            ],
            mid: [
              ['Takashi',100],['Yusuke',85],['Daisuke',82],['Satoshi',79],['Hiroyuki',79],['Hiroki',75],['Ryo',75],['Atsushi',73],['Makoto',71],['Takahiro',69],
              ['Naoki',68],['Takuya',69],['Koji',71],['Jun',69],['Ken',69],['Keisuke',62],['Yuji',61],['Tatsuya',59],['Takayuki',57],['Shinji',45],['Hideki',51],
              ['Masanori',37],['Satoru',40],['Ukyo',2],['Toranosuke',2],['Hiroshi',97],['Yuki',86],['Kenji',81],['Akira',80],['Takeshi',80],['Masahiro',70],
              ['Yuta',63],['Masaki',59],['Kazuki',54],['Hiroaki',53],['Kentaro',52],['Kohei',52],['Masato',51],['Koichi',51],['Kenta',50],['Tomohiro',50],
              ['Ryota',49],['Takumi',49],['Masayuki',49],['Tetsuya',48],['Yasuhiro',48],['Yuya',48],['Kenichi',48],['Kazuhiro',48],['Kei',48],['Shinya',47],
              ['Toru',47],['Masashi',47],['Yuichi',47],['Tsuyoshi',47],['Ryosuke',46],['Akihiro',46],['Hiro',46],['Shota',46],['Yutaka',45],['Yoshihiro',45],
              ['Mohamed',45],['Kazuya',45],['Daiki',45],['Shinichi',45],['Shingo',45],['Eduardo',45],['Sergio',44],['Ali',44],['Fernando',44],['Yosuke',44],
              ['Muhammad',44],['Kosuke',43],['Fabio',43],['Osamu',42],['Keita',42],['Shunsuke',42],['Mario',41],['Hitoshi',41],['Sho',40],['Minoru',40],['Eiji',40],
              ['Marcio',39],['Naoya',39],['Edson',39],['Wataru',39],['Tomoyuki',39],['Rafael',39],['Shin',39],['Hideaki',39],['Tomoya',38],['Bruno',38],['Koki',38],
              ['Kazuo',38],['Shun',38],['Shohei',38],['Junichi',37],['Yohei',37],['Naoto',37],['Shogo',37],['Yoshiaki',37],['Taro',37],['Alexandre',37],
              ['Tadashi',37],['Rodrigo',36],['Lucas',36],['Kiyoshi',36],['Kota',36],['Seiji',36],['Hayato',36],['Toshiyuki',35],['Masaya',35],['Kotaro',35],
              ['Yoshinori',35],['Yoshiyuki',34],['Masaru',34],['James',34],['Shintaro',34],['Takuma',34],['Hideyuki',34],['Manabu',33],['Daichi',33],['Khan',33],
              ['Tomoki',33],['Hideo',33],['Hajime',33],['Takao',33],['Masaaki',33],['Toshio',33],['Yuto',33],['Yoshiki',32],['Akio',32],['Takanori',32],
              ['Yasushi',32],['William',32],['Shigeru',32],['Kensuke',32],['Anderson',32],['Chris',31],['Tsutomu',31],['Yoshio',31],['Julio',31],['Thiago',31],
              ['Yukio',31],['Victor',31],['Kento',31],['Masahiko',31],['Gabriel',31],['Yoshitaka',31],['Nobuyuki',31],['Takaaki',31],['Shuhei',31],['Hirokazu',31],
              ['Yuichiro',30],['Taku',30],['Nelson',30],['Hirofumi',30],['Kazuma',30],['Luiz',30],['Yoichi',30],['Andre',30],['Taichi',30],['Masatoshi',30],
              ['Masao',30],['Ryuji',30],['Claudio',30],['Yuuki',30],['Toshihiro',29],['Yoshi',29],['Keiichi',29],['Yasuyuki',29],['Kazunori',29],['Taiki',29],
              ['Andrew',29],['Toshiaki',29]
            ],
            modern: [
              ['Yuki',45],['Yuta',45],['Ren',45],['Haruto',45],['Sota',45],['Riku',45],['Yuto',45],['Kaito',45],['Takumi',26],['Kazuki',26],['Sho',26],['Kenta',26],
              ['Daiki',26],['Ayumu',12],['Naoya',12],['Kamui',2],['Ritomo',2],['Hiroshi',14],['Kenji',14],['Akira',14],['Takeshi',14],['Masahiro',14],['Masaki',14],
              ['Hiroaki',14],['Kentaro',14],['Kohei',14],['Masato',14],['Koichi',14],['Tomohiro',14],['Ryota',14],['Masayuki',14],['Tetsuya',14],['Yasuhiro',14],
              ['Yuya',14],['Kenichi',14],['Kazuhiro',14],['Kei',14],['Shinya',14],['Toru',14],['Masashi',14],['Yuichi',14],['Tsuyoshi',14],['Ryosuke',14],
              ['Akihiro',14],['Hiro',14],['Shota',14],['Yutaka',14],['Yoshihiro',14],['Mohamed',14],['Kazuya',14],['Shinichi',14],['Shingo',14],['Eduardo',14],
              ['Sergio',14],['Ali',14],['Fernando',14],['Yosuke',14],['Muhammad',14],['Kosuke',14],['Fabio',14],['Osamu',14],['Keita',14],['Shunsuke',14],
              ['Mario',14],['Hitoshi',14],['Minoru',14],['Eiji',14],['Marcio',14],['Edson',14],['Wataru',14],['Tomoyuki',14],['Rafael',14],['Shin',14],['Hideaki',14],
              ['Tomoya',14],['Bruno',14],['Koki',14],['Kazuo',14],['Shun',14],['Shohei',14],['Junichi',14],['Yohei',14],['Naoto',14],['Shogo',14],['Yoshiaki',14],
              ['Taro',14],['Alexandre',14],['Tadashi',14],['Rodrigo',14]
            ]
          },
          last: [
            ['Sato',99],['Suzuki',100],['Takahashi',84],['Tanaka',92],['Watanabe',85],['Ito',73],['Yamamoto',79],['Nakamura',78],['Kobayashi',72],['Saito',68],
            ['Kato',65],['Yoshida',63],['Yamada',65],['Sasaki',53],['Matsumoto',56],['Inoue',57],['Kimura',54],['Hayashi',55],['Yamaguchi',53],['Shimizu',50],
            ['Mori',49],['Abe',48],['Ikeda',47],['Hashimoto',47],['Yamashita',43],['Maeda',43],['Sakamoto',43],['Matsuda',36],['Fujita',40],['Ogawa',42],
            ['Okada',42],['Murakami',41],['Nakajima',35],['Hoshino',23],['Ono',42],['Ishikawa',42],['Aoki',42],['Ishii',41],['Sakai',41],['Ueda',40],
            ['Hasegawa',40],['Nakagawa',38],['Nakano',38],['Kondo',38],['Fujii',38],['Okamoto',38],['Endo',37],['Nishimura',37],['Goto',37],['Takeda',37],
            ['Arai',36],['Takeuchi',36],['Yamazaki',36],['Miura',36],['Fukuda',36],['Tamura',35],['Nakayama',35],['Morita',35],['Harada',35],['Ota',35],
            ['Honda',34],['Wada',34],['Kikuchi',34],['Kaneko',33],['Miyamoto',33],['Hara',32],['Kojima',32],['Miyazaki',32],['Yokoyama',31],['Shimada',31],
            ['Ishida',31],['Shibata',31],['Fujiwara',31],['Masuda',31],['Uchida',30],['Ando',30],['Fujimoto',30],['Hirano',29],['Higa',29],['Ueno',29],
            ['Hirata',29],['Hamada',28],['Taniguchi',28],['Matsui',28],['Kawamura',28],['Maruyama',28],['Noguchi',28],['Murata',28],['Mizuno',28],['Kinoshita',28],
            ['Nagai',28],['Takagi',27],['Kawai',27],['Imai',27],['Matsuo',27],['Kubota',27],['Koyama',27],['Sakurai',27],['Nagata',27],['Takano',27],['Iwasaki',27],
            ['Yamanaka',27],['Yano',27],['Kubo',26],['Fukushima',26],['Takada',26],['Kawasaki',26],['Sano',26],['Uehara',26],['Seki',26],['Sugiyama',26],
            ['Yasuda',26],['Nomura',26],['Nishida',26],['Sugimoto',26],['Nakashima',25],['Koga',25],['Yoshikawa',25],['Kawakami',25],['Nishikawa',25],
            ['Hattori',25],['Nakanishi',25],['Hirose',25],['Kitamura',25],['Akiyama',25],['Thapa',25],['Adachi',25],['Shrestha',25],['Yoshimura',25],['Oda',24],
            ['Tsuji',24],['Araki',24],['Matsuoka',24],['Morimoto',24],['Kudo',24],['Komatsu',24],['Ishihara',24],['Onishi',24],['Chiba',24],['Iwata',24],
            ['Furukawa',24],['Otsuka',24],['Noda',24],['Yoshioka',24],['Ichikawa',24],['Asano',23],['Igarashi',23],['Kawashima',23],['Katayama',23],['Oshiro',23],
            ['Koike',23],['Matsuura',23],['Tsuchiya',23],['Tanabe',23],['Ogata',23],['Ohashi',23],['Ozawa',23],['Baba',23],['Higuchi',23],['Yuki',23],['Iida',23],
            ['Kawaguchi',22],['Yamasaki',22],['Iwamoto',22],['Kawano',22],['Nishi',22],['Tomita',22],['Yamauchi',22],['Hori',22],['Taguchi',22],['Minami',22],
            ['Shinohara',22],['Hayakawa',22],['Kodama',22],['Matsunaga',22],['Sugawara',22],['Miki',22],['Oshima',22],['Matsushita',21],['Nakata',21],
            ['Takayama',21],['Kitagawa',21],['Nishiyama',21],['Matsumura',21],['Nakao',21],['Perera',21],['Sawada',21],['Uemura',21],['Kuroda',21],['Miyata',21],
            ['Sakata',21],['Sakaguchi',21],['Yokota',21],['Okumura',21],['Ozaki',21],['Naito',20],['Shiraishi',20],['Hirai',20],['Oyama',20],['Mochizuki',20],
            ['Konishi',20],['Nagano',20],['Oka',20],['Ishibashi',20],['Yagi',20],['Okuda',20],['Otani',20],['Doi',20],['Makino',20],['Miyake',20],['Ogura',20],
            ['Okubo',20],['Smith',20],['Okazaki',20],['Okamura',20],['Yoshino',20],['Kawamoto',19],['Imamura',19],['Narita',19],['Amano',19],['Kurihara',19],
            ['Kono',19],['Izumi',19],['Arakaki',19],['Koizumi',19],['Kataoka',19],['Matsubara',19],['Rana',19],['Kumagai',19],['Nakai',19],['Tani',19],['Nagao',19],
            ['Uchiyama',19],['Asai',19],['Gurung',18],['Sapkota',18],['Higashi',18],['Azuma',18],['Sekiguchi',18],['Omori',18],['Sakuma',18],['Tsukamoto',18],
            ['Hirayama',18],['Konno',18],['Bhandari',18],['Shoji',18],['Nakazawa',18],['Kamiya',18],['Sonoda',18],['Kanda',18],['Aoyama',18],['Furuya',18],
            ['Fukui',18],['Terada',18],['Inagaki',17],['Tashiro',17],['Nemoto',17],['Sugiura',17],['Morishita',17],['Kawabata',17],['Rawat',17],['Miyoshi',17],
            ['Kanno',17],['Oikawa',17],['Ohara',17],['Nakahara',17],['Naka',17],['Okabe',17],['Murayama',17],['Kanashiro',17],['Toda',17],['Shibuya',17],
            ['Yamakawa',17],['Lama',17]
          ] }
    ] },

    // ── ARG ──
    ARG: { regions: [
        { w: 1,
          first: {
            early: [
              ['Juan',5],['Carlos',5],['José',4],['Roberto',4],['Jorge',4],['Oscar',3],['Alberto',3],['Ricardo',3],['Alejandro',3],['Miguel',3],['Raúl',3],
              ['Néstor',2],['Rodolfo',2],['Onofre',1],['Froilán',1],['Clemar',1]
            ],
            mid: [
              ['Juan',100],['Carlos',94],['Jorge',83],['Pablo',76],['Diego',71],['Marcelo',71],['Alejandro',68],['Gustavo',68],['Cristian',67],['Daniel',87],
              ['Sebastián',51],['Matías',68],['Nicolás',59],['Martín',68],['Lucas',66],['Sergio',63],['Javier',58],['Fernando',58],['Ariel',58],['Agustín',53],
              ['Esteban',37],['Federico',38],['Gonzalo',39],['Facundo',39],['Franco',52],['Gastón',40],['José',82],['Luis',74],['Miguel',61],['Gabriel',59],
              ['Roberto',56],['Mario',56],['Óscar',54],['Eduardo',54],['Ricardo',52],['Walter',50],['Alberto',50],['Rubén',49],['Ezequiel',49],['Hugo',49],
              ['Claudio',48],['Marcos',47],['Raúl',47],['David',46],['Héctor',46],['Juan Carlos',46],['Santiago',45],['Andrés',45],['Julio',45],['Fabián',44],
              ['Rodrigo',43],['Víctor',43],['Adrián',43],['Dario',43],['Pedro',42],['Mariano',41],['Ramón',41],['Ángel',41],['Guillermo',40],['Francisco',40],
              ['César',38],['Lautaro',38],['Leandro',38],['Damian',37],['Hernan',37],['Antonio',37],['Maxi',37],['Tomás',37],['Nico',36],['Nahuel',36],['Luciano',36],
              ['Omar',36],['Leonardo',35],['Iván',35],['José Luis',35],['Leo',35],['Manuel',34],['Nestor',34],['Joaquín',33],['Mauro',33],['Alfredo',32],
              ['Miguel Ángel',32],['German',31],['Emanuel',31],['Horacio',31],['Maximiliano',30],['Mauricio',30],['Ale',30],['Alan',30],['Julián',30],['Alexis',30],
              ['Thiago',28],['Ignacio',28],['Kevin',28],['Enrique',28],['Osvaldo',27],['Jesús',27],['Brian',27],['Ramiro',26],['Fede',26],['Mateo',26],['Axel',25],
              ['Alex',25],['Emiliano',25],['Enzo',25],['Bruno',24],['Braian',24],['Facu',24],['Jonathan',24],['Nacho',23],['Benjamin',23],['Rodolfo',23],['Elias',23],
              ['Gerardo',23],['Leonel',23],['Carlos Alberto',23],['Nelson',22],['Rafael',22],['Ernesto',21],['Seba',21],['Santi',21],['Juan Jose',21],
              ['Juan Pablo',20],['Juan Manuel',20],['Christian',20],['Joel',20],['Edgardo',20],['Emilio',19],['Luis Alberto',19],['Orlando',19],['Armando',19],
              ['Norberto',19],['Felipe',19],['Abel',19],['Patricio',18],['Dylan',18],['Valentin',18],['Agus',18],['Dani',18],['Fran',18],['Anibal',18],['Aldo',18],
              ['Alejo',18],['Jonatan',18],['Mati',17],['Dante',17]
            ],
            modern: [
              ['Mateo',45],['Santiago',45],['Tomás',45],['Benjamín',26],['Joaquín',26],['Bautista',26],['Lautaro',26],['Thiago',26],['Franco',26],['Felipe',26],
              ['Juan Manuel',12],['Valentino',12],['Bruno',12],['Máximo',12],['Ciro',2],['José',14],['Luis',14],['Miguel',14],['Gabriel',14],['Roberto',14],
              ['Mario',14],['Óscar',14],['Eduardo',14],['Ricardo',14],['Walter',14],['Alberto',14],['Rubén',14],['Ezequiel',14],['Hugo',14],['Claudio',14],
              ['Marcos',14],['Raúl',14],['David',14],['Héctor',14],['Juan Carlos',14],['Andrés',14],['Julio',14],['Fabián',14],['Rodrigo',14],['Víctor',14],
              ['Adrián',14],['Dario',14],['Pedro',14],['Mariano',14],['Ramón',14],['Ángel',14],['Guillermo',14],['Francisco',14],['César',14],['Leandro',14],
              ['Damian',14],['Hernan',14],['Antonio',14],['Maxi',14],['Nico',14],['Nahuel',14],['Luciano',14],['Omar',14],['Leonardo',14],['Iván',14],
              ['José Luis',14],['Leo',14],['Manuel',14],['Nestor',14],['Mauro',14],['Alfredo',14],['Miguel Ángel',14],['German',14],['Emanuel',14],['Horacio',14],
              ['Maximiliano',14]
            ]
          },
          last: [
            ['González',100],['Rodríguez',89],['Gómez',90],['López',90],['Fernández',81],['Martínez',79],['Díaz',76],['Pérez',74],['Romero',64],['García',63],
            ['Sánchez',64],['Sosa',54],['Torres',52],['Flores',49],['Álvarez',46],['Ramírez',49],['Acosta',46],['Rojas',46],['Benítez',48],['Ruiz',44],
            ['Medina',42],['Castro',42],['Herrera',42],['Suárez',44],['Giménez',43],['Ledesma',34],['Zunino',2],['Traverso',2],['Gutiérrez',42],['Aguirre',40],
            ['Luna',39],['Pereyra',39],['Molina',39],['Silva',38],['Ortiz',38],['Castillo',37],['Morales',37],['Ríos',36],['Cabrera',36],['Moreno',36],['Godoy',35],
            ['Núñez',34],['Vera',34],['Vega',34],['Peralta',34],['Villalba',33],['Juárez',33],['Carrizo',33],['Quiroga',33],['Ferreyra',32],['Caceres',32],
            ['Paz',32],['Vargas',32],['Muñoz',32],['Cardozo',31],['Ramos',31],['Dominguez',30],['Coronel',30],['Ojeda',30],['Arias',30],['Mendoza',30],
            ['Guzmán',29],['Miranda',29],['Maldonado',29],['Navarro',29],['Ponce',29],['Gonzales',29],['Figueroa',28],['Cruz',28],['Aguero',28],['Rivero',28],
            ['Correa',28],['Méndez',27],['Vazquez',27],['Ayala',27],['Duarte',27],['Mansilla',27],['Escobar',27],['Barrios',26],['Acuña',26],['Lucero',26],
            ['Farias',26],['Cordoba',26],['Paez',26],['Avila',26],['Blanco',26],['Leiva',25],['Franco',25],['Campos',25],['Bustos',25],['Soto',25],['Soria',25],
            ['Chávez',25],['Bravo',25],['Hernández',24],['Maidana',24],['Roldan',24],['Contreras',24],['Toledo',24],['Martín',24],['Aguilar',23],['Moyano',23],
            ['Baez',23],['Gallardo',23],['Arce',23],['Olivera',23],['Valdez',23],['Montenegro',22],['Ibarra',22],['Vallejos',22],['Delgado',22],['Santillan',22],
            ['Acevedo',21],['Sandoval',21],['Aranda',21],['Mamani',21],['Oviedo',21],['Ibañez',21],['Paredes',21],['Velázquez',21],['Ortega',21],['Mercado',21],
            ['Reyes',21],['Leguizamon',21],['Salinas',20],['Zarate',20],['Heredia',20],['Jiménez',20],['Segovia',20],['Alegre',20],['Caballero',20],['Zapata',20],
            ['Coria',20],['Albornoz',20],['Lescano',20],['Rosales',20],['Veron',20],['Gauna',19],['Pereira',19],['Palacios',19],['Márquez',19],['Zalazar',19],
            ['Barrera',19],['Barrionuevo',19],['Galvan',19],['Altamirano',19],['Aquino',19],['Cabral',19],['Cejas',19],['Quintana',19],['Cortez',19],
            ['Bustamante',19],['Jara',19],['Varela',19],['Tapia',19],['Avalos',19],['Burgos',19],['Aguilera',18],['Orellana',18],['Atr',18],['Guerrero',18],
            ['Fuentes',18],['Garay',18],['Salas',18],['Quinteros',18],['Pacheco',18],['Rivas',18],['Ferreira',18],['Alonso',18],['Ocampo',17],['Monzon',17],
            ['Romano',17],['Galeano',17],['Valenzuela',17],['Videla',17],['Funes',17],['Lezcano',17],['Robles',17],['Brizuela',17],['Carabajal',17],['Maciel',17],
            ['Meza',17],['Reynoso',17],['Alarcon',17],['Cuello',17],['Saavedra',16],['Oliva',16],['Robledo',16],['Bazan',16],['Gerez',16],['Villegas',16],
            ['Nieto',16],['Espinoza',16],['Galarza',16],['Ceballos',16],['Andrada',16],['Almada',16],['Sotelo',16],['Vergara',16],['Serrano',16],['Miño',16],
            ['Barreto',16],['Salazar',16],['Peña',16],['Villarreal',16],['Escudero',16],['Solis',15],['Espindola',15]
          ] }
    ] },

    // ── ESP ──
    ESP: { regions: [
        { w: 0.8,
          first: {
            early: [
              ['José',5],['Antonio',5],['Francisco',5],['Manuel',4],['Luis',4],['Juan',4],['Pedro',4],['Miguel',4],['Carlos',4],['Rafael',3],['Ángel',3],
              ['Alfonso',2],['Emilio',2],['Vicente',2],['Paco',2],['Joaquín',2]
            ],
            mid: [
              ['Javier',68],['David',76],['Carlos',69],['Daniel',52],['Sergio',52],['Fernando',47],['Jorge',48],['Alberto',48],['Ángel',50],['Alejandro',46],
              ['Rafael',42],['Óscar',40],['Iván',42],['Raúl',43],['Diego',40],['José Luis',47],['José Antonio',47],['Rubén',39],['Álvaro',39],['Adrián',39],
              ['Jaime',28],['Gonzalo',21],['José',100],['Antonio',91],['Juan',77],['Manuel',76],['Francisco',66],['Jesús',60],['Miguel',60],['Pedro',55],['Luis',53],
              ['Pablo',47],['José Manuel',42],['Víctor',41],['Miguel Ángel',39],['Alex',38],['Juan Carlos',36],['Andrés',36],['Ramón',33],['Roberto',33],['Mario',32],
              ['Enrique',32],['Vicente',31],['Eduardo',30],['José María',30],['Dani',29],['Joaquín',29],['Cristian',29],['Marcos',28],['Alfonso',28],
              ['Juan Antonio',28],['Francisco Javier',28],['Ricardo',27],['Juan Jose',27],['Julio',26],['Toni',26],['Emilio',25],['Santiago',25],['Juan Manuel',23],
              ['Gabriel',23],['Ismael',22],['Julián',22],['Salvador',22],['César',22],['Guillermo',22],['Tomás',22],['Josep',21],['Agustín',21],['Felix',21],
              ['Nacho',20],['Albert',20],['Samuel',20],['Ignacio',19],['Héctor',19],['Alfredo',19],['Jonathan',18],['Borja',18],['Juanjo',18],['Jose Miguel',18],
              ['Manu',18],['Felipe',18],['Martín',18],['Mariano',17],['Sebastián',17],['Francisco Jose',17],['Santi',17],['Hugo',16],['Domingo',16],['Christian',16],
              ['Sergi',16],['Nicolás',16],['Jose Carlos',16],['Jaume',15],['Xavier',15],['Kevin',15],['Esteban',15],['Omar',15],['Cristobal',15],['Jose Ramon',15],
              ['Juanma',15],['Rodrigo',15],['Arturo',14],['Abel',14],['German',14],['Edu',14],['Isaac',14],['Iñaki',14],['Marco',14],['Joel',13],['Miquel',13],
              ['Lucas',13],['Lorenzo',13],['Ahmed',13],['Gustavo',13],['Juan Luis',13],['Israel',13],['Jose Angel',13],['Luis Miguel',12],['Manel',12],['Ernesto',12],
              ['Said',12],['Aaron',12],['Carles',12],['Eugenio',12],['Moises',12],['Salva',12],['Tony',12],['Rachid',12],['Pere',12],['Adolfo',12],
              ['Juan Francisco',12],['Eric',12],['Gregorio',11],['Kike',11],['Lluis',11],['Ali',11],['Francesc',11],['Gerardo',11],['Iñigo',11],['Robert',11],
              ['Valentin',11],['Carmelo',11],['Eloy',11],['Isidro',11],['Juan Miguel',10],['Benito',10],['Abraham',10],['Kiko',10],['Edgar',10],['Alexis',10],
              ['Armando',10],['Juan Pedro',10],['Pascual',10],['Ferran',10],['Hassan',10],['Bernardo',10],['Bruno',10],['Alexander',10],['Adri',10],['Enric',10],
              ['Federico',10],['Moha',10],['John',10],['Florin',9],['Adrià',9],['Yeray',9],['Jairo',9],['Jonatan',9],['Richard',9],['Youssef',9],['Victor Manuel',9]
            ],
            modern: [
              ['Alejandro',45],['Pablo',45],['Hugo',45],['Martín',45],['Lucas',45],['Diego',45],['Mario',26],['Marcos',26],['Adrián',26],['Álex',26],['Manuel',26],
              ['Leo',12],['Bruno',12],['Izan',12],['Nico',12],['Pepe',2],['José',14],['Antonio',14],['Juan',14],['Francisco',14],['Jesús',14],['Miguel',14],
              ['Pedro',14],['Luis',14],['José Manuel',14],['Víctor',14],['Miguel Ángel',14],['Juan Carlos',14],['Andrés',14],['Ramón',14],['Roberto',14],
              ['Enrique',14],['Vicente',14],['Eduardo',14],['José María',14],['Dani',14],['Joaquín',14],['Cristian',14],['Alfonso',14],['Juan Antonio',14],
              ['Francisco Javier',14],['Ricardo',14],['Juan Jose',14],['Julio',14],['Toni',14],['Emilio',14],['Santiago',14],['Juan Manuel',14],['Gabriel',14],
              ['Ismael',14],['Julián',14],['Salvador',14],['César',14],['Guillermo',14],['Tomás',14],['Josep',14],['Agustín',14],['Felix',14],['Nacho',14],
              ['Albert',14],['Samuel',14],['Ignacio',14],['Héctor',14],['Alfredo',14],['Jonathan',14],['Borja',14],['Juanjo',14],['Jose Miguel',14],['Manu',14],
              ['Felipe',14],['Mariano',14],['Sebastián',14],['Francisco Jose',14],['Santi',14],['Domingo',14],['Christian',14],['Sergi',14],['Nicolás',14],
              ['Jose Carlos',14],['Jaume',14],['Xavier',14],['Kevin',14],['Esteban',14],['Omar',14],['Cristobal',14],['Jose Ramon',14],['Juanma',14],['Rodrigo',14]
            ]
          },
          last: [
            ['García',100],['Rodríguez',80],['López',79],['Martínez',75],['González',77],['Fernández',77],['Sánchez',75],['Pérez',73],['Gómez',55],['Martín',54],
            ['Ruiz',44],['Moreno',44],['Jiménez',50],['Hernández',47],['Díaz',43],['Muñoz',38],['Romero',36],['Álvarez',38],['Torres',32],['Alonso',31],
            ['Navarro',30],['Ramos',28],['Gil',23],['Vázquez',26],['Serrano',25],['Molina',25],['Sainz',2],['Gené',2],['Gutiérrez',32],['Ramírez',30],
            ['Dominguez',28],['Morales',26],['Suárez',25],['Castro',25],['Blanco',24],['Ortega',23],['Ortiz',23],['Delgado',23],['Marin',23],['Santos',22],
            ['Castillo',22],['Medina',22],['Rubio',22],['Cortés',21],['Flores',21],['Méndez',20],['Cruz',20],['Reyes',20],['Sanz',20],['Núñez',20],['Guerrero',20],
            ['Garrido',19],['Herrera',19],['Lozano',19],['León',19],['Iglesias',18],['Vargas',18],['Márquez',18],['Cabrera',18],['Santana',18],['Peña',18],
            ['Cano',18],['Campos',17],['Vega',17],['Gallego',17],['Silva',17],['Aguilar',17],['Fuentes',17],['Carrasco',17],['Vidal',16],['Caballero',16],
            ['Rojas',16],['Prieto',16],['Santiago',16],['Montero',16],['Mendoza',16],['Mora',16],['Hidalgo',15],['Carmona',15],['Nieto',15],['Arias',15],
            ['Lorenzo',15],['Rivera',15],['Soto',15],['Calvo',15],['Pascual',15],['Giménez',14],['Heredia',14],['Herrero',14],['Vera',14],['Gallardo',14],
            ['Madrid',14],['Lara',14],['Velasco',14],['Rivas',13],['Franco',13],['Camacho',13],['Bravo',13],['Crespo',13],['Parra',13],['Espinosa',13],
            ['Pastor',13],['Vicente',13],['Salazar',13],['Durán',13],['Pardo',13],['Montes',13],['Roman',13],['Miranda',13],['Moya',13],['Contreras',13],
            ['Diez',13],['Valencia',13],['Palacios',13],['Merino',12],['Rey',12],['Acosta',12],['Esteban',12],['Pereira',12],['Carrillo',12],['Luna',12],
            ['Segura',12],['Sierra',12],['Lopez Lopez',12],['Robles',12],['Ríos',12],['Arroyo',12],['Luque',12],['Izquierdo',12],['Soriano',12],['Bernal',12],
            ['Garcia Lopez',12],['Ibañez',12],['Redondo',12],['Guerra',12],['Padilla',12],['Aguilera',12],['Mateo',11],['De La Torre',11],['Casado',11],
            ['Escobar',11],['Fernandez Fernandez',11],['De La Cruz',11],['Valero',11],['Lopez Garcia',11],['Pacheco',11],['Costa',11],['De La Fuente',11],
            ['Bueno',11],['Saez',11],['Garcia Martinez',11],['Perez Perez',11],['Garcia Sanchez',11],['Martinez Martinez',11],['Otero',11],['Martinez Garcia',11],
            ['Garcia Gonzalez',11],['Maldonado',11],['Salas',11],['Hurtado',11],['Trujillo',11],['Sanchez Garcia',11],['Garcia Fernandez',11],['Rivero',11],
            ['Casas',11],['Rodriguez Rodriguez',11],['Escudero',11],['Varela',11],['Quintana',11],['Montoya',11],['Fernandez Garcia',11],['Garcia Rodriguez',11],
            ['Fdez',11],['Rodriguez Garcia',11],['Macias',11],['Gonzalez Garcia',11],['Sanchez Sanchez',11],['Amador',10],['Perez Garcia',10],['Conde',10],
            ['Garcia Perez',10],['Gracia',10],['Gonzalez Gonzalez',10],['Mateos',10],['Manzano',10],['Aparicio',10],['Guzmán',10],['Villar',10],['Gonzales',10],
            ['Rico',10],['Aranda',10],['Paredes',10],['Villanueva',10],['Ponce',10],['Jurado',10],['Abad',10],['Zamora',10],['Avila',10],['Plaza',10],['Rosa',10],
            ['Cuevas',10],['García García',10],['Bautista',10],['Valverde',10],['Murillo',10],['Pons',10],['Mesa',10],['Rueda',10],['Ndiaye',10],['Sevilla',10],
            ['Valle',10],['Galan',10],['Marti',9],['Ballesteros',9],['Villa',9],['Oliva',9],['Exposito',9],['Diop',9],['Bermudez',9],['Castaño',9],['Salvador',9],
            ['Andrés',9],['Calderon',9],['Guillen',9],['De La Rosa',9],['Paz',9],['Sancho',9],['Alba',9],['Roldan',9],['Pineda',9],['Cuesta',9],['Mena',9],
            ['Ángel',9],['Cuenca',9],['Ros',9],['Beltran',9],['Villalba',9],['Estevez',9],['Ferreira',9],['Sosa',9],['Bermejo',9],['Burgos',9],['Barrera',9],
            ['Lucas',9],['Linares',9],['Santamaria',9],['Cordero',9],['Blasco',9],['Martos',9],['Collado',9],['Zapata',9],['Rodriguez Gonzalez',9],['Toledo',9],
            ['Naranjo',9],['Lorente',9],['Ayala',9],['Quesada',9],['Galvez',9],['Gonzalez Rodriguez',9],['Arenas',9],['Navas',9],['Soria',9],['Pozo',9],
            ['Vallejo',9],['Reina',9],['Rodrigo',9],['Ojeda',9]
          ] },
        { w: 0.13,
          first: [
            ['Jordi',34],['Marc',24],['Xavi',16],['Gerard',12],['Arnau',9],['Pau',14],['Oriol',10],['Aleix',8],['Pol',10],['Roger',11],['Joan',26]
          ],
          last: [
            ['Puig',9],['Vila',11],['Serra',10],['Ferrer',15],['Roca',10],['Soler',13],['Font',12],['Bosch',12],['Mas',9],['Casals',12]
          ] },
        { w: 0.07,
          first: [
            ['Mikel',15],['Iker',14],['Ander',9],['Unai',10],['Aitor',19],['Jon',13],['Asier',11],['Gorka',9]
          ],
          last: [
            ['Etxeberria',26],['Agirre',26],['Ibarra',26],['Zubizarreta',12],['Urrutia',12],['Garmendia',12],['Mendizabal',12],['Otegi',2],['Aguirre',9]
          ] }
    ] },

    // ── NED ──
    NED: { regions: [
        { w: 1,
          first: {
            early: [
              ['Jan',5],['Henk',4],['Piet',3],['Kees',3],['Wim',3],['Theo',3],['Bert',3],['Cor',2],['Jaap',2],['Dries',1],['Carel',1],['Gijs',1]
            ],
            mid: [
              ['Jeroen',60],['Mark',54],['Rob',59],['Dennis',54],['Marcel',53],['Paul',53],['Johan',52],['Patrick',51],['Frank',51],['Bart',49],['Marco',48],
              ['Bas',48],['Erik',48],['Martijn',47],['Sander',43],['Robert',46],['Richard',49],['Tim',46],['Ronald',43],['Willem',45],['Tom',44],['Jos',40],
              ['Christijan',2],['Jan',100],['Peter',83],['Hans',70],['Henk',70],['John',58],['Rene',50],['Wim',50],['Martin',45],['Bert',43],['Kees',43],['Rick',42],
              ['Kevin',42],['Gerard',42],['Mike',41],['Michel',41],['Frans',40],['Nick',40],['Niels',40],['Roy',39],['Andre',39],['Piet',39],['Michael',39],
              ['Theo',39],['Danny',38],['Stefan',38],['Pieter',38],['Robin',37],['Thomas',37],['Ron',37],['Daniel',37],['Marc',37],['Daan',36],['Ton',36],
              ['Chris',36],['Ruud',36],['Edwin',36],['Maarten',35],['Eric',35],['Bram',35],['Ben',34],['Alex',34],['Wouter',34],['Joost',33],['Jaap',33],
              ['Jeffrey',33],['Gerrit',32],['Harry',32],['Max',32],['Ali',32],['Arjan',32],['Erwin',31],['Remco',31],['David',31],['Vincent',30],['Mohamed',30],
              ['Thijs',30],['Leo',30],['Fred',30],['Lars',30],['Nico',30],['Jasper',30],['Herman',30],['Koen',30],['Dirk',30],['Ruben',30],['Cor',29],['Joop',29],
              ['Wesley',28],['Leon',28],['Dick',28],['Albert',27],['Roel',27],['Jack',27],['Cees',27],['Jelle',26],['Jordy',26],['Maurice',26],['Michiel',26],
              ['Arie',26],['Bob',26],['Klaas',26],['Raymond',25],['Dave',25],['Joey',25],['Geert',25],['Pascal',25],['Sven',25],['Gijs',25],['Jesse',25],['Sam',24],
              ['Luuk',24],['Rik',24],['Gert',24],['Sjoerd',23],['Simon',23],['Ricardo',23],['Steven',22],['Pim',22],['Joris',22],['Ahmed',22],['Mustafa',22],
              ['Justin',22],['Dylan',21],['Stijn',21],['Matthijs',21],['Niek',21],['Alexander',21],['Arno',21],['Stephan',21],['Brian',21],['Mohammed',20],
              ['Anton',20],['Luc',20],['Menno',20],['Bjorn',20],['Ramon',19],['Lucas',19],['Sebastiaan',19],['Joep',19],['Damian',19]
            ],
            modern: [
              ['Daan',45],['Sem',45],['Lars',45],['Max',45],['Luuk',45],['Thijs',26],['Sven',26],['Finn',26],['Milan',26],['Bram',26],['Niek',12],['Joris',12],
              ['Rik',12],['Teun',12],['Jan',14],['Peter',14],['Hans',14],['Henk',14],['John',14],['Rene',14],['Wim',14],['Martin',14],['Bert',14],['Kees',14],
              ['Rick',14],['Kevin',14],['Gerard',14],['Mike',14],['Michel',14],['Frans',14],['Nick',14],['Niels',14],['Roy',14],['Andre',14],['Piet',14],
              ['Michael',14],['Theo',14],['Danny',14],['Stefan',14],['Pieter',14],['Robin',14],['Thomas',14],['Ron',14],['Daniel',14],['Marc',14],['Ton',14],
              ['Chris',14],['Ruud',14],['Edwin',14],['Maarten',14],['Eric',14],['Ben',14],['Alex',14],['Wouter',14],['Joost',14],['Jaap',14],['Jeffrey',14],
              ['Gerrit',14],['Harry',14],['Ali',14],['Arjan',14],['Erwin',14],['Remco',14],['David',14],['Vincent',14],['Mohamed',14],['Leo',14],['Fred',14],
              ['Nico',14]
            ]
          },
          last: [
            ['Jansen',100],['De Jong',96],['De Vries',89],['Van den Berg',72],['Bakker',77],['Van Dijk',75],['Visser',71],['Smit',67],['Meijer',60],['Mulder',60],
            ['De Boer',60],['De Groot',58],['Bos',60],['Vos',54],['Peters',55],['Hendriks',55],['Dekker',50],['Brouwer',47],['Van Leeuwen',47],['De Wit',47],
            ['Smits',45],['Dijkstra',45],['De Graaf',43],['Van der Meer',39],['Van der Linden',38],['De Haan',40],['Kok',42],['Kuipers',34],['Willems',37],
            ['Hoekstra',35],['Koopman',24],['Lammers',22],['Janssen',79],['Jacobs',42],['Vermeulen',42],['De Bruin',38],['Schouten',37],['Van Den Heuvel',37],
            ['Van Der Veen',37],['Van Beek',36],['Van Den Broek',36],['Verhoeven',36],['Maas',36],['Koster',35],['Prins',35],['Van Vliet',35],['De Bruijn',34],
            ['Blom',34],['Van Dam',34],['Huisman',34],['Van Der Heijden',33],['Post',33],['Peeters',33],['Van Veen',33],['Kuiper',33],['Kramer',32],['Boer',32],
            ['Veenstra',32],['De Jonge',32],['Scholten',32],['Martens',31],['Groen',31],['Vink',30],['Van Der Wal',30],['Koning',30],['Gerritsen',30],['Postma',30],
            ['De Ruiter',30],['Bosch',30],['Jonker',30],['Willemsen',29],['Van Wijk',29],['Timmermans',29],['Evers',29],['Van Den Brink',29],['De Vos',29],
            ['Schipper',28],['Van Loon',28],['Smeets',28],['Driessen',28],['De Lange',28],['Roos',28],['Groot',28],['Sanders',28],['Hermans',28],['Hofman',28],
            ['De Koning',28],['Van Doorn',28],['Wolters',27],['Verbeek',27],['Bosman',27],['Van Der Laan',27],['Van De Ven',27],['Molenaar',27],['Van Dongen',27],
            ['De Leeuw',27],['Kroon',27],['Mol',27],['Stam',26],['Muller',26],['Timmer',26],['Klein',26],['Kuijpers',25],['Van Den Bosch',25],['Wouters',25],
            ['Van Der Velden',25],['Verhagen',25],['Van Der Horst',25],['Vonk',25],['De Haas',24],['Schaap',24],['Stevens',24],['Vermeer',24],['Groeneveld',24],
            ['Pronk',24],['Van Der Meulen',24],['Gerrits',24],['Snijders',24],['Dekkers',24],['Boon',24],['Versteeg',24],['Klaassen',24],['Zijlstra',24],
            ['Simons',23],['De Rooij',23],['Van Rijn',23],['Bosma',23],['Damen',23],['Jager',23],['Van Es',23],['Otten',23],['Aarts',23],['Smith',23],
            ['Cornelissen',23],['Bouwman',23],['Blok',22],['Rutten',22],['De Jager',22],['Franken',22],['Roelofs',22],['Bouman',22],['Derks',22],
            ['Van Der Velde',22],['Verhoef',22],['Verweij',22],['Van Schaik',22],['Teunissen',22],['Derksen',22],['Zwart',22],['Arts',22],['Faber',22],
            ['Boersma',22],['Goossens',22],['Schuurman',22],['Thijssen',22],['Baas',21],['Hoek',21],['Geurts',21],['Joosten',21],['Van Eijk',21],['Brink',21],
            ['Venema',21],['Pieters',21],['Dijk',21],['Jan',21],['Van Os',21],['Visscher',21],['Van Der Heide',21],['Berg',20],['Van Rooij',20],['Wessels',20],
            ['Brouwers',20],['Baars',20],['Kersten',20],['Wiersma',20],['Timmerman',20],['Van Gils',20],['Kamphuis',20],['Amsterdam',20],['Arends',20],
            ['Vissers',20],['Van Dalen',20],['Hartman',20],['Tromp',20],['Buijs',19],['Van Den Akker',19],['Keizer',19],['Konings',19],['Rietveld',19],['Knol',19],
            ['Smulders',19],['Terpstra',19],['Brand',19],['Vis',19],['Pol',19],['Boonstra',19],['Van Der Plas',19],['Schepers',19],['Van Lieshout',19],
            ['Van Essen',19],['Van Eck',19],['Klomp',19],['Ruiter',19],['Brands',19],['Schut',19],['Bijl',19],['Van Rooijen',19],['Berends',19],
            ['Van Der Steen',19],['Hoogendoorn',19],['Bouma',19],['Feenstra',19]
          ] }
    ] },

    // ── BEL ──
    BEL: { regions: [
        { w: 0.55,
          first: {
            early: [
              ['Jean',4],['Pierre',4],['Paul',3],['Georges',3],['André',3],['Olivier',3],['Alain',3],['Lucien',2],['Willy',2],['Jacky',2]
            ],
            mid: [
              ['Michel',79],['Philippe',79],['Nicolas',74],['Christophe',73],['Olivier',72],['Éric',71],['Alain',70],['Vincent',64],['Kevin',86],['David',90],
              ['Thierry',54],['Laurent',56],['Marc',100],['Bertrand',18],['Patrick',94],['Thomas',84],['Luc',84],['Michael',77],['Pierre',64],['Daniel',62],
              ['Pascal',62],['Jean',61],['Julien',61],['Paul',59],['Frédéric',59],['Jonathan',58],['Cédric',58],['Sébastien',57],['Guy',56],['Christian',55],
              ['Maxime',53],['André',53],['Yves',53],['François',52],['Didier',51],['Frank',51],['Pieter',50],['Simon',50],['Alex',49],['Chris',48],['Kristof',48],
              ['Benjamin',47],['Robin',47],['Bruno',47],['Jonas',47],['Louis',47],['Ahmed',47],['Dylan',46],['Anthony',46],['Gregory',46],['Steve',46],['Sam',46],
              ['Nico',46],['Stéphane',45],['Jeroen',45],['Sven',45],['Robert',45],['Kurt',45],['Nick',44],['Filip',44],['Willy',44],['Arnaud',43],['Rudy',43],
              ['Mario',43],['Jacques',43],['Bert',43],['Bernard',43],['Alexandre',43],['Dimitri',42],['John',42],['Serge',42],['Andy',42],['Benoît',42],
              ['Antoine',42],['Ben',42],['Ronny',42],['Quentin',42],['Roger',41],['Xavier',41],['Maarten',41],['Jens',40],['Mathieu',40],['Jérôme',40],['Jérémy',40],
              ['Mike',40],['Bram',40],['Lucas',40],['Guillaume',40],['Hans',39],['Dominique',39],['Francis',39],['Niels',39],['Stefan',39],['Mohammed',39],
              ['Martin',39],['Erik',39],['Wouter',39],['Davy',39],['Glenn',39],['Jos',38],['Yannick',38],['Freddy',38],['Abdel',38],['Jurgen',38],['Marcel',38],
              ['Bjorn',37],['Ruben',37],['Hugo',37],['Gilles',36],['Tony',36],['Nathan',36],['Karim',36],['Rudi',36],['Rachid',36],['Fabrice',36],['Loïc',35],
              ['Dries',35],['Mathias',35],['Said',35],['Dieter',35],['Romain',35],['Claude',35],['Raphael',34],['Matthias',34],['René',34],['Youssef',34],
              ['Jean-Pierre',34],['Denis',34],['Kenny',34],['Jimmy',34],['Geoffrey',34]
            ],
            modern: [
              ['Lucas',45],['Hugo',45],['Noah',45],['Louis',45],['Arthur',45],['Nathan',26],['Théo',26],['Maxime',26],['Patrick',14],['Thomas',14],['Luc',14],
              ['Michael',14],['Pierre',14],['Daniel',14],['Pascal',14],['Jean',14],['Julien',14],['Paul',14],['Frédéric',14],['Jonathan',14],['Cédric',14],
              ['Sébastien',14],['Guy',14],['Christian',14],['André',14],['Yves',14],['François',14],['Didier',14],['Frank',14],['Pieter',14],['Simon',14],['Alex',14],
              ['Chris',14],['Kristof',14],['Benjamin',14],['Robin',14],['Bruno',14],['Jonas',14],['Ahmed',14],['Dylan',14],['Anthony',14],['Gregory',14],['Steve',14],
              ['Sam',14],['Nico',14],['Stéphane',14],['Jeroen',14],['Sven',14],['Robert',14],['Kurt',14],['Nick',14],['Filip',14],['Willy',14],['Arnaud',14],
              ['Rudy',14],['Mario',14],['Jacques',14],['Bert',14],['Bernard',14],['Alexandre',14],['Dimitri',14],['John',14],['Serge',14]
            ]
          },
          last: [
            ['Dupont',55],['Dubois',61],['Lambert',54],['Leroy',41],['Simon',45],['Denis',42],['Lejeune',38],['Martin',50],['Collard',31],['Gérard',43],
            ['Charlier',34],['Renard',39],['Georges',25],['Massart',25],['François',46],['Dumont',42],['Noël',39],['Leclercq',39],['Petit',38],['Mathieu',37],
            ['Bertrand',35],['Lemaire',35],['Thijs',34],['Bauwens',34],['Moens',34],['Beckers',34],['Deprez',34],['Legrand',34],['Simons',33],['Lefebvre',33],
            ['Evrard',33],['Fontaine',33],['Carlier',33],['Heylen',32],['Gielen',32],['Louis',32],['Jacques',32],['Goethals',32],['Bxl',31],['Thiry',31],
            ['Henry',31],['Lievens',31],['Ceulemans',31],['Nijs',31],['Callens',31],['Marchal',30],['Cuypers',30],['Pierre',30],['Moreau',30],['Delvaux',30],
            ['Mortier',29],['Peters',29],['Mahieu',29],['Matthys',29],['Guillaume',29],['Herman',29],['Parmentier',29],['Roels',29],['Somers',29],['Andries',29],
            ['Declerck',29],['Dewulf',28],['Jans',28],['Smeets',28],['Decock',28],['Bastin',28],['Claus',28],['Leemans',28],['Nicolas',28],['Huysmans',28],
            ['Lefèvre',28],['Coenen',28],['Hubert',28],['Baeyens',28],['Deckers',28],['Servais',27],['Smits',27],['Rousseau',27],['Remy',27],['Geens',27],
            ['Toussaint',27],['Engelen',27],['Descamps',27],['Joris',27],['Bruxelles',27],['Sterckx',27],['Houben',27],['Marc',27],['Engels',27],['Gillet',26],
            ['Dierickx',26],['Huybrechts',26],['Collin',26],['Temmerman',26],['Schepers',26],['Philippe',26],['Maertens',26],['Lebrun',26]
          ] },
        { w: 0.45,
          first: {
            early: [
              ['Jos',3],['Herman',3],['Frans',3],['Marcel',3],['Luc',3],['Jef',2],['Willy',2],['Hugo',2]
            ],
            mid: [
              ['Tom',83],['Bart',79],['Jan',82],['Peter',80],['Johan',69],['Dirk',69],['Steven',63],['Koen',56],['Kris',46],['Wim',59],['Geert',57],['Stijn',52],
              ['Eddy',55],['Danny',54],['Tim',52]
            ],
            modern: [
              ['Arne',26],['Wout',26],['Lars',26],['Milan',26],['Seppe',12],['Senne',12],['Thibo',12],['Stoffel',2],['Eddy',14],['Danny',14],['Tim',14]
            ]
          },
          last: [
            ['Peeters',100],['Janssens',93],['Maes',86],['Jacobs',74],['Mertens',70],['Willems',69],['Claes',66],['Wouters',64],['Goossens',62],['Vermeulen',58],
            ['De Smet',57],['Hermans',56],['Pauwels',56],['Aerts',55],['Michiels',52],['Martens',51],['Smets',51],['De Vos',49],['Claeys',48],['Van Damme',47],
            ['Segers',44],['Janssen',49],['Desmet',49],['Devos',47],['Stevens',47],['Hendrickx',46],['De Clercq',46],['Lemmens',45],['Dhondt',44],
            ['Van Den Broeck',44],['De Backer',44],['Van De Velde',43],['Coppens',42],['Verhoeven',41],['Wauters',40],['Cools',40],['Smet',39],['Thys',39],
            ['Declercq',39],['Timmermans',37],['De Smedt',37],['Lenaerts',37],['De Wilde',37],['Cornelis',37],['De Cock',37],['De Meyer',37],['Baert',37],
            ['Verstraete',37],['Lambrechts',37],['Vandenberghe',37],['Verheyen',36],['Lauwers',36],['Geerts',36],['De Ridder',36],['De Pauw',36],['Jansen',35],
            ['Bosmans',35],['Bogaert',35],['Christiaens',35],['Verbeke',35],['Vermeiren',35],['Van Den Bossche',35],['Pieters',35],['Verlinden',35],
            ['Claessens',34],['Verschueren',33],['Verstraeten',33],['Wuyts',33],['Vermeersch',33],['Van Dyck',33],['Bogaerts',33],['Vandamme',32],['De Groote',32],
            ['Vandevelde',31],['Verhaeghe',31],['Van Hoof',31],['Dierckx',31],['Verhelst',30],['De Bruyn',30],['Van Hecke',30],['Van Den Bergh',30],['Luyten',30],
            ['Van Acker',30],['De Witte',30],['Nys',29],['Daems',29],['Vervoort',29],['Verhaegen',29],['De Coninck',29],['Raes',29],['Vercammen',29],
            ['De Coster',29],['De Bruyne',29],['Verhulst',29],['Verbruggen',29],['Van Hove',29],['Vanneste',29],['De Bock',29],['Vandewalle',28],['De Winter',28],
            ['Verdonck',28],['Vercauteren',28],['De Decker',28],['Swinnen',28],['Vanhove',28],['Vercruysse',28],['Van Den Berghe',28],['De Wolf',28],
            ['Verbeeck',28],['Vos',27],['De Clerck',27],['Moons',27],['Verheyden',27],['Van Goethem',27],['Van Daele',27],['De Keyser',26],['De Wit',26]
          ] }
    ] },

    // ── SUI ──
    SUI: { regions: [
        { w: 0.52,
          first: {
            early: [
              ['Hans',4],['Peter',4],['Kurt',3],['Heinz',3],['Bruno',3],['Ernst',3],['Walter',3],['Rudolf',2],['Fritz',2],['Jo',1]
            ],
            mid: [
              ['Daniel',100],['Thomas',83],['Michael',77],['Patrick',74],['Stefan',69],['Markus',64],['Andreas',62],['Marcel',54],['Urs',50],['Martin',69],
              ['Pascal',61],['Adrian',44],['Simon',56],['Roger',51],['Beat',44],['Reto',43],['Peter',76],['David',73],['Christian',73],['Manuel',57],['Marc',56],
              ['Jose',54],['René',50],['André',50],['Kevin',48],['Mario',48],['Roland',47],['Michel',47],['Alex',47],['Fabian',44],['Hans',43],['Joel',42],
              ['Rolf',42],['Lukas',42],['Sandro',41],['Christoph',41],['Giuseppe',41],['Samuel',40],['Florian',40],['Raphael',40],['Walter',38],['Philipp',38],
              ['Jan',38],['Matthias',37],['Roman',37],['Luis',37],['Claudio',37],['Robert',37],['Dominik',36],['Oliver',36],['Pedro',36],['Paulo',36],['Paul',35],
              ['Roberto',35],['Alexandre',34],['Mike',34],['Joao',34],['Stephan',34],['Ivan',34],['Éric',33],['Benjamin',33],['Heinz',33],['Kurt',33],['Tobias',33],
              ['Francesco',33],['Julien',33],['Christophe',33],['Sven',32],['Miguel',32],['Stéphane',32],['Dario',32],['Werner',32],['Alessandro',32],['Pierre',32],
              ['Fernando',31],['Yves',31],['Jonas',31],['Max',31],['Andrea',30],['Nico',30],['Alexander',30],['Remo',30],['Jürg',30],['Vincent',30],['Jorge',30],
              ['Robin',29],['Thierry',29],['Nicola',29],['Chris',29],['Sergio',28],['Toni',28],['Andy',28],['Sascha',28],['Giovanni',28],['John',27],['Jonathan',27],
              ['Angelo',27],['Claude',26],['Davide',26],['Sebastian',26],['Denis',26],['Frédéric',26],['Salvatore',26],['François',26],['Stefano',26],['Tim',26],
              ['Yannick',26],['Felix',25],['Michele',25],['Tom',25],['Rafael',25],['Jérôme',25],['Rui',25],['Richard',25],['Lucas',25],['Mehmet',24],['Dominic',24],
              ['Filipe',24],['Jean',24],['Diego',24],['Mohamed',24],['Mathias',24],['Steve',24],['Hanspeter',24],['Dani',24],['Léo',23],['Ruedi',23],['Patrik',23],
              ['Francisco',23],['Mauro',23],['Franz',23],['Mustafa',23]
            ],
            modern: [
              ['Luca',45],['Nico',26],['Jan',26],['Noah',26],['Fabio',26],['Joel',26],['Levin',12],['Silvan',12],['Peter',14],['David',14],['Christian',14],
              ['Manuel',14],['Marc',14],['Jose',14],['René',14],['André',14],['Kevin',14],['Mario',14],['Roland',14],['Michel',14],['Alex',14],['Fabian',14],
              ['Hans',14],['Rolf',14],['Lukas',14],['Sandro',14],['Christoph',14],['Giuseppe',14],['Samuel',14],['Florian',14],['Raphael',14],['Walter',14],
              ['Philipp',14],['Matthias',14],['Roman',14],['Luis',14],['Claudio',14],['Robert',14],['Dominik',14],['Oliver',14],['Pedro',14],['Paulo',14],['Paul',14],
              ['Roberto',14],['Alexandre',14],['Mike',14],['Joao',14],['Stephan',14],['Ivan',14],['Éric',14],['Benjamin',14],['Heinz',14],['Kurt',14],['Tobias',14],
              ['Francesco',14],['Julien',14],['Christophe',14],['Sven',14],['Miguel',14],['Stéphane',14],['Dario',14],['Werner',14],['Alessandro',14],['Pierre',14]
            ]
          },
          last: [
            ['Müller',100],['Meier',75],['Schmid',65],['Keller',55],['Weber',51],['Schneider',51],['Huber',46],['Steiner',47],['Gerber',43],['Brunner',42],
            ['Frei',42],['Baumann',41],['Moser',40],['Fischer',44],['Zürcher',27],['Bühler',31],['Widmer',40],['Meyer',49],['Zimmermann',40],['Graf',39],
            ['Wyss',38],['Berger',37],['Roth',37],['Baumgartner',35],['Studer',34],['Suter',34],['Kaufmann',34],['Bachmann',33],['Bucher',33],['Kunz',33],
            ['Hofer',32],['Lehmann',32],['Marti',31],['Koch',31],['Christen',29],['Frey',29],['Lüthi',29],['Egli',29],['Maurer',28],['Schweizer',28],['Gasser',28],
            ['Pfister',28],['Wenger',27],['Fuchs',27],['Arnold',27],['Koller',27],['Kohler',27],['Burri',27],['Stalder',27],['Wüthrich',26],['Egger',26],
            ['Fernández',26],['Leuenberger',25],['Furrer',25],['Hug',25],['Hofmann',25],['Bieri',25],['Tanner',25],['Blaser',25],['Wagner',25],['Hess',24],
            ['Hunziker',24],['Hauser',24],['Vogel',24],['Sutter',24],['Rey',24],['Vogt',24],['Ammann',24],['Hartmann',23],['Lang',23],['Rexhepi',23],['Mustafa',23],
            ['Schwarz',23],['Shabani',23],['Zbinden',23],['Zaugg',23],['Sommer',23],['Rüegg',22],['Siegenthaler',22],['Hasler',22],['Schär',22],['Senn',22],
            ['Scheidegger',22],['Weiss',22],['Stucki',22],['Fankhauser',22],['Schenk',21],['Scherrer',21],['Schuler',21],['Michael',21],['Osmani',21],['Imhof',21],
            ['Portmann',21],['Gisler',21],['Wolf',21],['Beck',21],['Flückiger',21],['Odermatt',21],['Schwab',21],['Lima',21],['Ademi',21],['Walter',21],['Jost',20],
            ['Ackermann',20],['Seiler',20],['Schumacher',20],['Giger',20],['Liechti',20],['Bruno',20],['Zehnder',20],['Schaller',20],['Meister',20],['Walker',20],
            ['Staub',20],['Weibel',20],['Kastrati',20],['Wittwer',20],['Küng',20],['Schärer',19],['Hofstetter',19],['Marco',19],['Stocker',19],['Russo',19],
            ['Kuhn',19],['Haas',19],['Marty',19],['Herzog',19],['Schnyder',19],['Smith',19],['Steiger',19],['Hasani',19],['Kaiser',19],['Hoti',19],['Tobler',19],
            ['Grob',19],['Ulrich',19],['Stadelmann',19],['Sulejmani',18],['Gloor',18],['Kessler',18],['Bosshard',18],['Lutz',18],['Bolliger',18],['Locher',18],
            ['Lüscher',18],['Stutz',18],['Selimi',18],['Bischof',18],['Stettler',18],['Pires',18],['Hostettler',18],['Ziegler',18],['Sieber',18],['Walther',18],
            ['Rohner',18],['Braun',18],['Stauffer',18]
          ] },
        { w: 0.31,
          first: {
            early: [
              ['Claude',3],['Michel',3],['Jean',3],['Pierre',3],['André',3],['Joseph',2]
            ],
            mid: [
              ['Alain',37],['Olivier',36],['Laurent',31],['Sébastien',32],['Nicolas',49],['Didier',20],['Cédric',35],['Philippe',42],['Gabriel',30],['Hugo',26]
            ],
            modern: [
              ['Romain',26],['Louis',26],['Hugo',26],['Nathan',26],['Gabriel',26],['Théo',12],['Philippe',14]
            ]
          },
          last: [
            ['Favre',27],['Girard',26],['Martin',38],['Rochat',19],['Bonvin',12],['Chevalley',12],['Duc',12],['Rossier',16],['Perret',12],['Monnier',12],
            ['Grandjean',12],['Berney',2],['Blanc',19],['Pittet',18]
          ] },
        { w: 0.11,
          first: [
            ['Gianni',19],['Marco',79],['Alberto',21],['Franco',24],['Matteo',23],['Luca',52],['Loris',20],['Alessio',18],['Antonio',59]
          ],
          last: [
            ['Bernasconi',21],['Rossi',25],['Bianchi',18],['Ferrari',19],['Fontana',17],['Galli',12],['Crivelli',2],['Pedrazzini',2]
          ] },
        { w: 0.06, minYear: 2000,
          first: [
            ['Bruno',58],['Tiago',26],['Ricardo',32],['Fábio',43],['Diogo',19],['Nuno',24]
          ],
          last: [
            ['Silva',69],['Santos',61],['Ferreira',60],['Pereira',57],['Rodrigues',49],['Costa',48],['Lopes',42],['Martins',41],['Oliveira',47],['Fernandes',45],
            ['Da Silva',43],['Pinto',41],['Ribeiro',40],['Gomes',40],['Gonçalves',37],['Teixeira',37],['Marques',37],['Alves',36],['Almeida',35],['Sousa',34],
            ['Carvalho',33],['Dias',32],['Monteiro',30],['Dos Santos',30],['Cardoso',29],['Mendes',29],['Soares',28],['Moreira',27],['Correia',27],['Vieira',25],
            ['Duarte',24],['Machado',23],['Rocha',23],['Castro',22],['Cruz',22],['Da Costa',21],['Nunes',20],['Fonseca',20],['Coelho',20],['Barbosa',19],
            ['Reis',19],['Tavares',18],['Cunha',18],['Neves',18],['Freitas',18],['Batista',18]
          ] }
    ] },

    // ── AUT ──
    AUT: { regions: [
        { w: 1,
          first: {
            early: [
              ['Hans',4],['Karl',4],['Franz',4],['Helmut',3],['Dieter',3],['Kurt',3],['Harald',3],['Gerhard',3],['Josef',3],['Johann',3],['Otto',2],['Rupert',2],
              ['Jochen',2],['Niki',1]
            ],
            mid: [
              ['Michael',100],['Thomas',99],['Christian',96],['Andreas',90],['Markus',87],['Martin',84],['Stefan',83],['Peter',76],['Franz',69],['Wolfgang',63],
              ['Gerhard',63],['Christoph',62],['Patrick',62],['Alexander',61],['Manuel',60],['Mario',60],['Robert',59],['Manfred',54],['Bernhard',48],['Roland',40],
              ['Norbert',27],['Daniel',76],['Josef',61],['Lukas',57],['Florian',57],['Dominik',52],['David',51],['Johann',49],['Walter',47],['Philipp',47],
              ['Karl',46],['Herbert',46],['Rene',45],['Helmut',45],['Harald',44],['Johannes',44],['Jürgen',42],['Matthias',42],['Werner',41],['Hannes',41],
              ['Sebastian',40],['Marcel',40],['Gerald',40],['Alex',39],['Georg',39],['Klaus',38],['Marco',36],['Kevin',36],['Fabian',35],['Roman',35],['Simon',35],
              ['Ali',34],['Hans',33],['Günter',33],['Erich',33],['Reinhard',32],['Tobias',32],['Paul',32],['Alfred',32],['Julian',32],['Max',31],['Kurt',31],
              ['Günther',31],['Anton',30],['Oliver',29],['Richard',29],['Rudolf',29],['Erwin',29],['Benjamin',29],['Heinz',28],['Ernst',27],['Jakob',27],
              ['Mathias',26],['Hermann',26],['Bernd',25],['Mustafa',25],['Felix',25],['Chris',24],['Alois',24],['Maximilian',24],['Christopher',24],['Raphael',24],
              ['Hubert',24],['Mehmet',24],['Stephan',23],['Sascha',22],['Nico',22],['Armin',22],['Jan',22],['Dietmar',22],['Marko',21],['Siegfried',21],['Gernot',21],
              ['Fritz',20],['Andi',20],['Horst',20],['Rainer',20],['Dragan',20],['Hasan',20],['Friedrich',20],['Tom',20],['Dieter',19],['Ahmet',19],['Gregor',19],
              ['Mike',19],['Elias',19],['Clemens',19],['Pascal',19],['Gottfried',19],['Ewald',18],['Rudi',18],['Philip',18],['Ivan',18],['Murat',17],['Andre',17],
              ['Flo',17],['Adrian',17],['Gabriel',17],['Leopold',17],['Leo',17],['Goran',17],['Niklas',17],['Ibrahim',17],['Marc',17],['Albert',16],['Willi',16],
              ['Zoran',16],['Michi',16],['Dejan',16],['Ahmed',16],['Otto',16],['Toni',16],['Ahmad',16],['Jonas',16],['Dominic',16],['Luca',16],['Leon',15],
              ['Wilhelm',15],['Moritz',15],['Mohammad',15],['Denis',15]
            ],
            modern: [
              ['Lukas',45],['Felix',45],['David',45],['Maximilian',45],['Leon',45],['Florian',45],['Dominik',45],['Tobias',26],['Simon',26],['Paul',26],['Jakob',26],
              ['Elias',26],['Fabian',26],['Julian',26],['Daniel',14],['Josef',14],['Johann',14],['Walter',14],['Philipp',14],['Karl',14],['Herbert',14],['Rene',14],
              ['Helmut',14],['Harald',14],['Johannes',14],['Jürgen',14],['Matthias',14],['Werner',14],['Hannes',14],['Sebastian',14],['Marcel',14],['Gerald',14],
              ['Alex',14],['Georg',14],['Klaus',14],['Marco',14],['Kevin',14],['Roman',14],['Ali',14],['Hans',14],['Günter',14],['Erich',14],['Reinhard',14],
              ['Alfred',14],['Max',14],['Kurt',14],['Günther',14],['Anton',14],['Oliver',14],['Richard',14],['Rudolf',14],['Erwin',14],['Benjamin',14],['Heinz',14],
              ['Ernst',14],['Mathias',14],['Hermann',14],['Bernd',14],['Mustafa',14],['Chris',14],['Alois',14],['Christopher',14]
            ]
          },
          last: [
            ['Gruber',100],['Huber',98],['Bauer',88],['Müller',84],['Wagner',81],['Steiner',79],['Moser',78],['Berger',78],['Pichler',78],['Hofer',75],['Mayer',73],
            ['Leitner',71],['Eder',69],['Fuchs',67],['Maier',72],['Winkler',64],['Fischer',63],['Schmid',62],['Schwarz',60],['Schneider',60],['Weber',60],
            ['Egger',59],['Reiter',58],['Mayr',57],['Brunner',56],['Lang',54],['Lechner',55],['Stohr',2],['Baumgartner',55],['Wallner',55],['Schmidt',55],
            ['Wolf',55],['Auer',53],['Wimmer',50],['Ebner',50],['Aigner',50],['Haas',50],['Binder',50],['Koller',48],['Holzer',46],['Lehner',45],['Schuster',45],
            ['Koch',44],['Lackner',44],['Graf',43],['Wieser',43],['Kaiser',43],['Haider',43],['Weiss',43],['Strasser',43],['Mair',41],['König',41],['Hauser',40],
            ['Krenn',40],['Winter',40],['Horvath',40],['Kaufmann',40],['Stadler',40],['Kogler',40],['Fink',39],['Posch',39],['Riegler',39],['Karner',39],
            ['Rainer',39],['Kern',38],['Hackl',38],['Maurer',37],['Ortner',37],['Fritz',37],['Schwaiger',37],['Resch',37],['Seidl',37],['Schober',37],['Riedl',36],
            ['Neubauer',36],['Strobl',36],['Klein',36],['Hofbauer',36],['Böhm',36],['Schweiger',35],['Reisinger',35],['Mayrhofer',35],['Sommer',35],['Grabner',34],
            ['Hofmann',34],['Thaler',34],['Jäger',34],['Hartl',34],['Brandstätter',33],['Unger',33],['Friedl',33],['Kainz',32],['Pirker',32],['Hoffmann',32],
            ['Baumann',32],['Hager',32],['Walter',32],['Weiß',31],['Lindner',31],['Müllner',31],['Herzog',31],['Kurz',31],['Bruckner',31],['Kofler',30],
            ['Zauner',30],['Höller',30],['Krammer',30],['Mandl',30],['Zimmermann',30],['Haslinger',29],['Hammer',29],['Angerer',29],['Schwab',29],['Rauch',29],
            ['Konrad',29],['Pfeiffer',29],['Ecker',29],['Wiesinger',29],['Franz',28],['Steininger',28],['Stangl',28],['Stocker',28],['Meier',28],['Köck',28],
            ['Plank',28],['Novak',28],['Zach',27],['Karl',27],['Rieger',27],['Brugger',27],['Rieder',27],['Huemer',27],['Hafner',27],['Braun',27],['Richter',27],
            ['Brandl',27],['Gasser',27],['Grill',27],['Bacher',27],['Fellner',27],['Putz',27],['Fasching',26],['Gassner',26],['Roth',26],['Steindl',26],['Wurm',26],
            ['Hahn',26],['Knapp',26],['Hauer',26],['Pfeifer',26],['Brandstetter',26],['Lorenz',26],['Stefan',26],['Mayerhofer',26],['Werner',25],['Holzinger',25],
            ['Hutter',25],['Mader',25],['Haller',25],['Hermann',25],['Rath',25],['Bischof',25],['Sturm',25],['Zechner',25],['Feichtinger',25],['Stöckl',25],
            ['Leitgeb',25],['Nagy',25],['Oswald',25],['Neuhold',25],['Ertl',25],['Burger',25],['Bichler',25],['Ofner',24],['Thurner',24],['Prinz',24],
            ['Kastner',24],['Can',24],['Messner',24],['Hartmann',24],['Kreuzer',24],['Stockinger',24],['Haberl',24],['Schauer',24],['Burgstaller',24],
            ['Fröhlich',24],['Bayer',24],['Rauter',24],['Kraus',24],['Bernhard',24],['Knoll',24],['Platzer',23],['Kerschbaumer',23],['Wien',23],['Walch',23],
            ['Michael',23],['Windisch',23],['Edlinger',23],['Singer',23],['Hölzl',23],['Meyer',23],['Ziegler',23],['Schlager',23],['Schreiner',23],['Stöger',23],
            ['Schweighofer',23],['Frühwirth',23],['Neumann',23]
          ] }
    ] },

    // ── SWE ──
    SWE: { regions: [
        { w: 1,
          first: {
            early: [
              ['Lars',4],['Gunnar',3],['Bengt',3],['Lennart',3],['Sven',3],['Bo',3],['Erik',3],['Torsten',2],['Åke',2],['Ulf',2],['Nils',2],['Ronnie',1]
            ],
            mid: [
              ['Johan',100],['Anders',94],['Peter',87],['Fredrik',83],['Magnus',74],['Mikael',73],['Andreas',72],['Jonas',71],['Martin',68],['Stefan',67],
              ['Daniel',82],['Henrik',60],['Erik',66],['Per',62],['Thomas',60],['Mattias',58],['Mats',57],['Patrik',54],['Marcus',54],['Björn',52],['Joakim',49],
              ['Niclas',30],['Tomas',44],['Kenny',10],['Lars',67],['David',56],['Jan',54],['Robert',51],['Niklas',49],['Alexander',47],['Håkan',47],['Simon',46],
              ['Hans',46],['Christer',44],['Tobias',44],['Göran',43],['Christian',43],['Ulf',43],['Michael',42],['Emil',42],['Tommy',41],['Anton',40],['Robin',40],
              ['Adam',38],['Sebastian',38],['Bengt',37],['Roger',37],['Leif',36],['Jesper',36],['Lennart',36],['Jörgen',34],['Oscar',34],['Gustav',34],['Ahmad',33],
              ['John',33],['Linus',33],['Markus',33],['Viktor',32],['Carl',32],['Ahmed',32],['Filip',32],['Jimmy',31],['Oskar',30],['Jonathan',30],['Ola',30],
              ['Kjell',30],['Mohammed',30],['Christoffer',30],['Mathias',30],['Rickard',30],['Pontus',30],['Jens',29],['Victor',29],['Mohammad',29],['Gunnar',29],
              ['Joel',29],['Richard',28],['Mohamed',28],['Elias',28],['Kenneth',28],['Olle',28],['Tony',28],['William',28],['Dennis',27],['Alex',27],['Rasmus',27],
              ['Jakob',26],['Claes',26],['Axel',26],['Max',26],['Torbjörn',26],['Philip',26],['Kent',26],['Rolf',26],['Dan',26],['Jacob',25],['Nils',25],['Pär',24],
              ['Kalle',24],['Samuel',24],['Eric',24],['Staffan',24],['Janne',24],['Johannes',24],['Sven',24],['Lasse',24],['Micke',23],['Karl',23],['Omar',23],
              ['Hassan',23],['Åke',23],['Gabriel',23],['Albin',22],['Kim',22],['Nicklas',22],['Kristoffer',22],['Mohamad',22],['Hampus',22],['André',22],
              ['Petter',21],['Oliver',21],['Kevin',21],['Felix',21],['Conny',21],['Roland',21],['Kristian',21],['Ibrahim',21],['Pelle',20],['Olof',20],['Mustafa',20],
              ['Hugo',20],['Rikard',20],['Amir',20],['Johnny',20],['Bertil',19],['Tom',19],['Krister',19],['Pierre',19],['Tim',19],['Calle',19],['Urban',19],
              ['Arne',19],['Ingemar',19],['Gustaf',18]
            ],
            modern: [
              ['Oscar',45],['William',45],['Elias',45],['Lucas',45],['Emil',45],['Hugo',26],['Liam',26],['Noah',26],['Viktor',26],['Isak',26],['Felix',26],
              ['Marcus',26],['Lars',14],['David',14],['Jan',14],['Robert',14],['Niklas',14],['Alexander',14],['Håkan',14],['Simon',14],['Hans',14],['Christer',14],
              ['Tobias',14],['Göran',14],['Christian',14],['Ulf',14],['Michael',14],['Tommy',14],['Anton',14],['Robin',14],['Adam',14],['Sebastian',14],['Bengt',14],
              ['Roger',14],['Leif',14],['Jesper',14],['Lennart',14],['Jörgen',14],['Gustav',14],['Ahmad',14],['John',14],['Linus',14],['Markus',14],['Carl',14],
              ['Ahmed',14],['Filip',14],['Jimmy',14],['Oskar',14],['Jonathan',14],['Ola',14],['Kjell',14],['Mohammed',14],['Christoffer',14],['Mathias',14],
              ['Rickard',14],['Pontus',14],['Jens',14],['Victor',14],['Mohammad',14],['Gunnar',14],['Joel',14],['Richard',14],['Mohamed',14],['Kenneth',14],
              ['Olle',14],['Tony',14],['Dennis',14]
            ]
          },
          last: [
            ['Andersson',100],['Johansson',99],['Nilsson',80],['Karlsson',74],['Larsson',68],['Eriksson',68],['Persson',60],['Svensson',59],['Olsson',58],
            ['Gustafsson',44],['Pettersson',44],['Jonsson',54],['Carlsson',41],['Jansson',37],['Hansson',37],['Bengtsson',32],['Lindberg',31],['Lindgren',28],
            ['Magnusson',28],['Jönsson',54],['Lindström',28],['Lundberg',28],['Lindqvist',22],['Berg',25],['Lundgren',26],['Axelsson',24],['Holm',21],
            ['Ekström',17],['Brack',2],['Gustavsson',28],['Olofsson',27],['Bergström',26],['Petersson',26],['Berglund',25],['Sandberg',23],['Forsberg',23],
            ['Mattsson',23],['Sjöberg',22],['Engström',22],['Fredriksson',21],['Bergman',21],['Ericsson',21],['Eklund',21],['Henriksson',21],['Samuelsson',20],
            ['Lind',20],['Danielsson',20],['Holmberg',20],['Nyström',20],['Nyberg',20],['Lundqvist',20],['Gunnarsson',20],['Söderberg',20],['Lundström',19],
            ['Håkansson',19],['Johnsson',19],['Jakobsson',18],['Sandström',18],['Björk',18],['Nordström',18],['Berggren',18],['Eliasson',18],['Isaksson',18],
            ['Arvidsson',18],['Ohlsson',18],['Fransson',18],['Björklund',18],['Jacobsson',18],['Holmgren',18],['Mårtensson',17],['Sundberg',17],['Åberg',17],
            ['Ström',17],['Hedlund',17],['Wikström',17],['Dahlberg',16],['Hellström',16],['Söderström',16],['Hermansson',16],['Åström',16],['Norberg',16],
            ['Lindholm',16],['Öberg',16],['Falk',16],['Dahl',16],['Blomqvist',15],['Sjögren',15],['Sundström',15],['Abrahamsson',15],['Nyman',15],['Backman',15],
            ['Ekman',15],['Strömberg',15],['Martinsson',15],['Månsson',15],['Palm',15],['Wiklund',15],['Löfgren',15],['Sjöström',15],['Åkesson',15],['Blom',15],
            ['Ivarsson',14],['Hallberg',14],['Borg',14],['Lindblom',14],['Boström',14],['Lindahl',14],['Möller',14],['Hedberg',14],['Claesson',14],['Göransson',14],
            ['Andreasson',14],['Friberg',14],['Jensen',14],['Lindh',14],['Englund',14],['Josefsson',14],['Bäckström',14],['Nygren',14],['Abdi',14],['Bergqvist',14],
            ['Stenberg',14],['Höglund',14],['Roos',14],['Hansen',14],['Jonasson',14],['Strandberg',13],['Strand',13],['Holmström',13],['Börjesson',13],
            ['Söderlund',13],['Lund',13],['Rosén',13],['Edlund',13],['Davidsson',13],['Ottosson',13],['Öhman',13],['Malm',13],['Adolfsson',13],['Dahlgren',13],
            ['Skoglund',13],['Björkman',13],['Erlandsson',13],['Ericson',13],['Lilja',13],['Högberg',13],['Sundqvist',13],['Hanna',12],['Moberg',12],
            ['Holmqvist',12],['Lundmark',12],['Westman',12],['Linder',12],['Westerlund',12],['Haglund',12],['Blomberg',12],['Lindén',12],['Osman',12],
            ['Dahlström',12],['Ahmadi',12],['Lindell',12],['Alm',12],['Hedman',12],['Wiberg',12],['Hedström',12],['Lindblad',12],['Östlund',12],['Nielsen',12],
            ['Westerberg',12],['Ståhl',12],['Johnson',12],['Marklund',12],['Ljungberg',12],['Aronsson',11],['Knutsson',11],['Johannesson',11],['Näslund',11],
            ['Norman',11],['Ljung',11],['Ekberg',11],['Pedersen',11],['Paulsson',11],['Issa',11],['Norén',11],['Malmberg',11],['Hagström',11],['Asplund',11],
            ['Boman',11],['Carlson',11],['Grahn',11],['Ågren',11],['Franzén',11],['Wahlström',11],['Ahlström',11],['Sköld',10],['Hellberg',10],['Olausson',10],
            ['Hägglund',10],['Hall',10],['Westberg',10],['Mohammadi',10],['Brandt',10],['Edström',10],['Forslund',10],['Byström',10],['Green',10],['Nordlund',10],
            ['Pålsson',10],['Granberg',10]
          ] }
    ] },

    // ── FIN ──
    FIN: { regions: [
        { w: 0.9,
          first: {
            early: [
              ['Timo',3],['Juhani',3],['Kari',3],['Matti',3],['Pentti',2],['Hannu',2],['Mauri',2],['Esko',2],['Seppo',2],['Leo',2],['Keijo',1]
            ],
            mid: [
              ['Mikko',100],['Juha',96],['Antti',92],['Mika',91],['Ville',91],['Janne',88],['Jari',88],['Sami',86],['Jani',80],['Jukka',80],['Matti',79],['Marko',78],
              ['Teemu',76],['Pekka',74],['Petri',73],['Toni',68],['Jussi',67],['Ari',66],['Markku',65],['Timo',89],['Hannu',63],['Joni',64],['Kimi',14],['Kari',76],
              ['Niko',68],['Markus',63],['Aleksi',62],['Tomi',62],['Joonas',62],['Heikki',61],['Juho',61],['Tuomas',61],['Pasi',61],['Harri',58],['Tommi',58],
              ['Lauri',58],['Henri',56],['Tero',55],['Olli',55],['Jaakko',54],['Kimmo',53],['Jesse',53],['Jouni',52],['Seppo',51],['Jarmo',50],['Jere',50],
              ['Vesa',50],['Eetu',49],['Jarkko',48],['Juuso',48],['Kalle',48],['Arto',48],['Esa',47],['Eero',44],['Mikael',44],['Joona',44],['Risto',44],
              ['Matías',43],['Riku',43],['Arttu',42],['Jorma',42],['Valtteri',40],['Ilkka',40],['Aki',40],['Santeri',40],['Miika',40],['Juhani',39],['Jarno',39],
              ['Tapio',39],['Pertti',39],['Samuli',39],['Erkki',38],['Tuomo',37],['Oskari',36],['Petteri',36],['Muhammad',36],['Jyrki',36],['Niklas',35],['Jouko',35],
              ['Simo',35],['Roope',34],['Pentti',34],['Raimo',34],['Joel',34],['Lasse',33],['Reijo',33],['Otto',33],['Martti',32],['Ali',32],['Kai',32],['Anssi',32],
              ['Atte',31],['Esko',30],['Elias',30],['Daniel',30],['Pauli',30],['Leevi',30],['Jan',30],['Samu',29],['Miikka',28],['Sakari',28],['Paavo',28],
              ['Rasmus',28],['Anton',27],['Jyri',27],['Saku',27],['Miro',27],['Tapani',27],['Kristian',27],['Tuukka',27],['Topi',26],['Keijo',26],['Lassi',26],
              ['Ossi',26],['Rami',26],['Jonne',26],['Veikko',26],['Tatu',26],['Roni',26],['Patrik',25],['Eemeli',25],['Veeti',25],['Peter',24],['Ismo',24],
              ['Samuel',24],['Johannes',24],['Konsta',24],['Leo',23],['Alex',23],['Mohammed',23],['Ahmed',23],['Henry',23],['Mauri',23],['Vili',23],['Abdul',23],
              ['Tony',23],['Iiro',22],['Johan',22],['Tom',22],['Nico',22],['Sebastian',22],['Mohamed',21],['Onni',21]
            ],
            modern: [
              ['Elias',45],['Aleksi',45],['Niko',45],['Onni',26],['Eino',26],['Leevi',26],['Oskari',26],['Väinö',12],['Juuso',12],['Eemil',12],['Miika',12],
              ['Valtteri',2],['Kari',14],['Markus',14],['Tomi',14],['Joonas',14],['Heikki',14],['Juho',14],['Tuomas',14],['Pasi',14],['Harri',14],['Tommi',14],
              ['Lauri',14],['Henri',14],['Tero',14],['Olli',14],['Jaakko',14],['Kimmo',14],['Jesse',14],['Jouni',14],['Seppo',14],['Jarmo',14],['Jere',14],
              ['Vesa',14],['Eetu',14],['Jarkko',14],['Kalle',14],['Arto',14],['Esa',14],['Eero',14],['Mikael',14],['Joona',14],['Risto',14],['Matías',14],['Riku',14],
              ['Arttu',14],['Jorma',14],['Ilkka',14],['Aki',14],['Santeri',14],['Juhani',14],['Jarno',14],['Tapio',14],['Pertti',14],['Samuli',14],['Erkki',14],
              ['Tuomo',14],['Petteri',14],['Muhammad',14],['Jyrki',14],['Niklas',14],['Jouko',14],['Simo',14],['Roope',14],['Pentti',14],['Raimo',14]
            ]
          },
          last: [
            ['Virtanen',100],['Korhonen',98],['Nieminen',96],['Mäkinen',94],['Mäkelä',90],['Laine',87],['Koskinen',86],['Heikkinen',86],['Hämäläinen',85],
            ['Lehtonen',82],['Järvinen',82],['Lehtinen',81],['Saarinen',80],['Salminen',78],['Niemi',78],['Heikkilä',77],['Heinonen',76],['Salonen',76],
            ['Kinnunen',75],['Salo',74],['Jokinen',71],['Rantanen',71],['Tuominen',71],['Mattila',70],['Turunen',70],['Karjalainen',70],['Aaltonen',62],
            ['Lehto',57],['Ahonen',63],['Kanerva',31],['Laitinen',69],['Lahtinen',65],['Savolainen',65],['Ojala',64],['Kallio',64],['Leppänen',63],['Koivisto',61],
            ['Hakala',61],['Anttila',61],['Manninen',61],['Pitkänen',60],['Väisänen',60],['Laaksonen',60],['Leinonen',59],['Miettinen',59],['Hiltunen',59],
            ['Laakso',59],['Toivonen',58],['Hirvonen',57],['Aalto',57],['Rantala',56],['Räsänen',56],['Nurmi',56],['Peltonen',55],['Mustonen',55],['Seppälä',55],
            ['Saari',55],['Niemelä',55],['Pulkkinen',54],['Moilanen',54],['Hänninen',54],['Lahti',54],['Koskela',53],['Salmi',53],['Kemppainen',53],
            ['Lappalainen',52],['Kettunen',52],['Ahola',52],['Seppänen',52],['Aho',52],['Kauppinen',52],['Halonen',52],['Partanen',51],['Ikonen',51],['Peltola',50],
            ['Huttunen',50],['Suominen',50],['Pesonen',50],['Mikkonen',50],['Oksanen',50],['Vainio',49],['Koponen',49],['Vuorinen',49],['Mikkola',49],
            ['Niskanen',48],['Heiskanen',48],['Kärkkäinen',48],['Mäki',47],['Rissanen',47],['Honkanen',47],['Nurminen',47],['Harju',47],['Karppinen',46],
            ['Rajala',46],['Kangas',46],['Määttä',46],['Immonen',46],['Heino',46],['Kokkonen',45],['Leino',45],['Laukkanen',45],['Keränen',45],['Paananen',44],
            ['Juntunen',44],['Uusitalo',44],['Jääskeläinen',44],['Hartikainen',44],['Laurila',44],['Mäenpää',43],['Ruotsalainen',43],['Viitanen',43],
            ['Parviainen',43],['Rautiainen',43],['Tikkanen',43],['Ranta',42],['Leskinen',42],['Salmela',42],['Kokko',42],['Tamminen',42],['Toivanen',42],
            ['Kuusisto',42],['Nevalainen',41],['Hietala',41],['Hyvärinen',41],['Korpela',41],['Makkonen',41],['Holopainen',41],['Martikainen',41],['Häkkinen',41],
            ['Jokela',41],['Nykänen',40],['Jaakkola',40],['Hakkarainen',40],['Karvonen',40],['Pasanen',40],['Saarela',40],['Karhu',40],['Lindroos',40],
            ['Kukkonen',40],['Härkönen',40],['Rautio',39],['Tiainen',39],['Autio',39],['Virta',39],['Sillanpää',39],['Jussila',39],['Kosonen',39],['Hyvönen',39],
            ['Rinne',38],['Kujala',38],['Kivelä',38],['Väänänen',38],['Lampinen',37],['Timonen',37],['Nissinen',37],['Kuusela',37],['Valtonen',37],['Laakkonen',37],
            ['Räisänen',37],['Tolonen',37],['Huhtala',36],['Hokkanen',36],['Malinen',36],['Kolehmainen',36],['Koistinen',36],['Lepistö',36],['Koivunen',35],
            ['Eskelinen',35],['Kulmala',35],['Pelkonen',35],['Nousiainen',35],['Marttila',35],['Koivula',35],['Asikainen',35],['Vartiainen',35],['Hautala',35],
            ['Helenius',34],['Ketola',34],['Takala',34],['Haapala',34],['Hyttinen',34],['Kumpulainen',34],['Eskola',34],['Järvenpää',34],['Voutilainen',34],
            ['Viljanen',34],['Liimatainen',34],['Pietilä',34],['Komulainen',33],['Luukkonen',33],['Tuovinen',33],['Luoma',33],['Lehtimäki',33],['Vuori',33],
            ['Ronkainen',33],['Liukkonen',33],['Repo',33],['Paavola',33],['Riikonen',33],['Penttinen',33],['Kyllönen',33],['Tolvanen',33],['Haavisto',33]
          ] },
        { w: 0.1,
          first: [
            ['Marcus',14],['Henrik',25],['Axel',12],['Oscar',14],['Emil',21],['Kim',29],['Kevin',12],['Niclas',10]
          ],
          last: [
            ['Lindström',42],['Nyman',47],['Johansson',46],['Holmberg',28],['Backman',30],['Sundqvist',12],['Westerlund',25],['Blomqvist',29],['Lindholm',48],
            ['Karlsson',38],['Lindqvist',38],['Andersson',37],['Lindberg',35],['Eriksson',35],['Eklund',33]
          ] }
    ] },

    // ── DEN ──
    DEN: { regions: [
        { w: 1,
          first: {
            early: [
              ['Jens',3],['Ole',3],['Per',3],['Niels',3],['Erik',3],['Henning',2],['Kurt',2],['Poul',2],['Bent',2],['Tom',2]
            ],
            mid: [
              ['Michael',100],['Thomas',99],['Peter',99],['Martin',92],['Henrik',91],['Lars',90],['Christian',87],['Morten',87],['Jesper',85],['Søren',84],
              ['Anders',82],['Jan',76],['Kim',72],['Jacob',63],['Kasper',61],['Claus',60],['Per',60],['Jens',68],['Daniel',62],['Nicolas',15],['Mads',74],
              ['Rasmus',74],['Mikkel',67],['Jonas',62],['Simon',60],['Andreas',58],['Ole',58],['Frederik',57],['Brian',56],['Mathias',55],['Niels',53],['John',53],
              ['Jakob',53],['Carsten',52],['Lasse',51],['Torben',51],['Emil',51],['Allan',51],['Kenneth',51],['René',50],['Jørgen',50],['Kristian',49],['Erik',47],
              ['Flemming',46],['Dennis',43],['Casper',43],['Sebastian',43],['Alexander',42],['Hans',41],['Oliver',40],['Tobias',40],['Steen',40],['Nicolai',39],
              ['Ahmad',39],['Bjarne',38],['David',38],['Jeppe',37],['Nikolaj',37],['Patrick',37],['Frank',37],['Bent',36],['Klaus',36],['Finn',36],['Magnus',35],
              ['Poul',35],['Benjamin',35],['Henning',34],['Mark',33],['Mogens',32],['Mohammed',32],['Tommy',32],['Johnny',32],['Rune',32],['Karsten',32],
              ['Mohammad',32],['Leif',31],['Dan',31],['Stefan',31],['Kurt',30],['Steffen',30],['Alex',30],['Mustafa',29],['Nicklas',29],['Christoffer',28],
              ['Ahmed',28],['Philip',28],['Mikael',28],['Adam',27],['Marcus',27],['Mohamed',27],['Tom',27],['Victor',27],['Preben',26],['Mike',26],['Ulrik',26],
              ['Palle',25],['Troels',25],['Johan',25],['Hassan',24],['Mohamad',24],['Jonathan',24],['Ibrahim',24],['Benny',24],['Arne',24],['Jørn',24],['Bjørn',23],
              ['Robert',23],['Lucas',23],['Kristoffer',23],['Omar',23],['Mehmet',23],['Svend',23],['Stig',23],['Knud',23],['Gert',23],['Gustav',22],['Chris',22],
              ['Kevin',22],['William',21],['Johannes',21],['Sune',21],['Kent',20],['Mahmoud',20],['Lukas',20],['Anton',20],['Marc',20],['Ivan',20],['Nick',20],
              ['Tim',20],['Esben',20],['Jimmy',20],['Keld',20],['Nicolaj',19],['Niklas',19],['Kaj',19],['Max',19],['Christopher',18],['Kjeld',18],['Asger',18],
              ['Jon',18]
            ],
            modern: [
              ['Frederik',45],['William',45],['Oscar',45],['Emil',45],['Magnus',45],['Oliver',45],['Christian',45],['Mads',45],['Rasmus',45],['Mikkel',45],
              ['Jonas',45],['Simon',26],['Malthe',26],['Victor',26],['Noah',26],['Kevin',12],['Andreas',14],['Ole',14],['Brian',14],['Mathias',14],['Niels',14],
              ['John',14],['Jakob',14],['Carsten',14],['Lasse',14],['Torben',14],['Allan',14],['Kenneth',14],['René',14],['Jørgen',14],['Kristian',14],['Erik',14],
              ['Flemming',14],['Dennis',14],['Casper',14],['Sebastian',14],['Alexander',14],['Hans',14],['Tobias',14],['Steen',14],['Nicolai',14],['Ahmad',14],
              ['Bjarne',14],['David',14],['Jeppe',14],['Nikolaj',14],['Patrick',14],['Frank',14],['Bent',14],['Klaus',14],['Finn',14],['Poul',14],['Benjamin',14],
              ['Henning',14],['Mark',14],['Mogens',14],['Mohammed',14],['Tommy',14],['Johnny',14],['Rune',14],['Karsten',14],['Mohammad',14],['Leif',14],['Dan',14],
              ['Stefan',14],['Kurt',14],['Steffen',14]
            ]
          },
          last: [
            ['Nielsen',100],['Jensen',99],['Hansen',94],['Andersen',79],['Pedersen',75],['Larsen',65],['Christensen',64],['Sørensen',61],['Rasmussen',57],
            ['Jørgensen',53],['Petersen',50],['Madsen',46],['Kristensen',43],['Olsen',39],['Thomsen',37],['Christiansen',33],['Møller',33],['Poulsen',32],
            ['Johansen',30],['Knudsen',30],['Mortensen',29],['Jakobsen',28],['Mikkelsen',26],['Lund',25],['Vinther',9],['Lundgaard',2],['Jacobsen',28],['Holm',24],
            ['Olesen',24],['Frederiksen',24],['Schmidt',23],['Laursen',21],['Henriksen',21],['Eriksen',20],['Clausen',19],['Simonsen',19],['Østergaard',18],
            ['Kristiansen',18],['Vestergaard',17],['Svendsen',17],['Iversen',17],['Kjær',17],['Andreasen',17],['Dahl',16],['Nissen',16],['Nørgaard',16],
            ['Søndergaard',15],['Friis',15],['Jeppesen',15],['Jespersen',15],['Jessen',15],['Frandsen',15],['Jepsen',14],['Mogensen',14],['Bruun',14],
            ['Lauridsen',14],['Winther',14],['Bach',14],['Carlsen',13],['Bertelsen',13],['Toft',13],['Krogh',13],['Lassen',12],['Berg',12],['Brandt',12],
            ['Ravn',12],['Bech',12],['Lind',12],['Christoffersen',12],['Gregersen',11],['Holst',11],['Nygaard',11],['Bang',11],['Johnsen',11],['Juul',11],
            ['Kjeldsen',11],['Damgaard',11],['Bak',11],['Steffensen',11],['Hedegaard',11],['Schou',10],['Andresen',10],['Dam',10],['Bjerregaard',10],['Søgaard',10],
            ['Kruse',10],['Overgaard',10],['Sommer',10],['Aagaard',10],['Danielsen',10],['Lorenzen',10],['Mathiesen',10],['Schultz',10],['Nilsson',10],
            ['Bundgaard',10],['Munk',10],['Koch',10],['Juhl',10],['Lauritsen',10],['Beck',10],['Fischer',10],['Bonde',10],['Osman',9],['Thorsen',9],['Lange',9],
            ['Riis',9],['Meyer',9],['Hjorth',9],['Thygesen',9],['Hald',9],['Hermansen',9],['Bjerre',9],['Gade',9],['Paulsen',9],['Kjærgaard',9],['Hoffmann',9],
            ['Johannsen',9],['Lorentzen',9],['Svensson',9],['Lykke',8],['Dalsgaard',8],['Davidsen',8],['Storm',8],['Andersson',8],['Mathiasen',8],['Kirkegaard',8],
            ['Karlsen',8],['Carstensen',8],['Smith',8],['Klausen',8],['Lauritzen',8],['Bisgaard',8],['Villadsen',8],['Kristoffersen',8],['Frost',8],['Schrøder',8],
            ['Skovgaard',8],['Kragh',8],['Mohamad',8],['Abdi',8],['Kofoed',8],['Justesen',8],['Bay',8],['Khalil',8],['Persson',8],['Hasan',8],['Ibsen',8],
            ['Hougaard',8],['Müller',8],['Johansson',8],['Ismail',7],['Mustafa',7],['Dalgaard',7],['Krog',7],['Thøgersen',7],['Leth',7],['Buch',7],['Mølgaard',7],
            ['Eskildsen',7],['Munch',7],['Thorup',7],['Wagner',7],['Michelsen',7],['Lindberg',7],['Rahbek',7],['Berthelsen',7],['Brix',7],['Andreassen',7],
            ['Johannesen',7],['Sloth',7],['Due',7],['Asmussen',7],['Hammer',7],['Greve',7],['Issa',7],['Thomassen',7],['Haugaard',7],['Rask',7],['Saleh',7],
            ['Bjerg',7],['Henningsen',7],['Kirk',7],['Westergaard',7],['Hartmann',7],['Gram',7],['Nicolaisen',7],['Fisker',7],['Enevoldsen',7],['Brodersen',7],
            ['Borup',7],['Marcussen',7],['Bjørn',7],['Michaelsen',7],['Hemmingsen',6],['Jønsson',6],['Korsgaard',6],['Thrane',6],['Svane',6],['Markussen',6],
            ['Laugesen',6],['Sand',6],['Olsson',6],['Dinesen',6],['Sonne',6],['Nedergaard',6],['Ipsen',6]
          ] }
    ] },

    // ── AUS ──
    AUS: { regions: [
        { w: 1,
          first: {
            early: [
              ['Jack',4],['Frank',3],['Alan',3],['Ken',3],['Ron',3],['Bill',3],['Paul',3],['Keith',2],['Doug',2],['Les',2],['Tim',2],['Vern',1]
            ],
            mid: [
              ['Mark',4],['David',4],['Daniel',4],['James',4],['Michael',4],['Craig',3],['Wayne',3],['Brett',3],['Shane',3],['Jason',3],['Ryan',3],['Scott',3],
              ['Cameron',3],['Troy',2]
            ],
            modern: [
              ['Jack',4],['Oscar',4],['Liam',4],['Noah',3],['Lachlan',3],['Cooper',3],['Riley',3],['Ethan',3],['Harrison',3],['Mitch',3],['Hunter',2],['Flynn',2],
              ['Kai',2],['Broc',1]
            ]
          },
          last: [
            ['Smith',5],['Jones',4],['Williams',4],['Brown',4],['Wilson',4],['Taylor',4],['Johnson',3],['White',3],['Martin',3],['Anderson',3],['Thompson',3],
            ['Walker',3],['Kelly',3],['Murphy',3],['Campbell',3],['Harvey',2],['Mitchell',2],['Stewart',2],['Ryan',2],['McLaughlin',2],['O\'Brien',2],['Hartley',1],
            ['Longhurst',1]
          ] }
    ] },

    // ── NZL ──
    NZL: { regions: [
        { w: 1,
          first: {
            early: [
              ['Chris',3],['Graham',2],['Tony',2],['Ross',2],['Graeme',2],['Ian',2],['Bob',2],['Bruce',2],['Howden',1],['Denny',1]
            ],
            mid: [
              ['Scott',3],['Craig',3],['Greg',3],['Simon',3],['Andrew',3],['Matthew',3],['Daniel',3],['Mark',3],['Shane',2],['Brendon',2]
            ],
            modern: [
              ['Liam',3],['Callum',3],['Oliver',3],['Ryan',3],['Marcus',2],['Hunter',2],['Mitchell',2],['Louis',2],['Flynn',2],['Jaxon',1]
            ]
          },
          last: [
            ['Smith',4],['Wilson',3],['Williams',3],['Brown',3],['Taylor',3],['Anderson',3],['Walker',3],['Clark',3],['Thomas',2],['Harris',2],['Scott',2],
            ['Mitchell',2],['Campbell',2],['Stewart',2],['McKenzie',2],['McRae',1],['O\'Sullivan',1],['Amon',1]
          ] }
    ] },

    // ── CAN ──
    CAN: { regions: [
        { w: 0.55,
          first: {
            early: [
              ['John',4],['George',3],['Peter',3],['Bill',3],['David',3],['Al',2],['Ron',2],['Eppie',1]
            ],
            mid: [
              ['David',100],['Michael',95],['Mike',85],['Chris',85],['Kevin',76],['Ryan',75],['Andrew',76],['Jason',71],['Mark',70],['Scott',50],['Paul',72],
              ['Greg',40],['Matt',58],['Justin',57],['Brian',56],['Adam',60],['John',96],['Alex',74],['James',68],['Peter',65],['Robert',61],['Steve',60],
              ['Matthew',58],['Richard',56],['Dave',55],['Nick',54],['Jeff',54],['Tony',53],['Joe',52],['Jonathan',52],['Anthony',51],['Kyle',51],['Sam',51],
              ['Dan',48],['Jordan',47],['Tyler',46],['Sean',46],['Rob',46],['Josh',45],['Steven',45],['Brandon',45],['George',45],['Ben',44],['Joseph',44],['Jay',43],
              ['William',43],['Stephen',43],['Aaron',41],['Thomas',41],['Simon',41],['Tim',41],['Tom',40],['Christopher',40],['Ken',40],['Frank',39],['Ian',39],
              ['Bob',39],['Nathan',38],['Shawn',38],['Marc',38],['Jim',38],['Jack',38],['Gary',38],['Andy',37],['Brad',37],['Carlos',36],['Jérémy',36],['Derek',36],
              ['Christian',36],['Danny',35],['Bill',35],['Joshua',35],['Jacob',35],['André',34],['Charles',34],['Rick',34],['Mario',34],['Trevor',34],['Jesse',34],
              ['Victor',33],['Jose',33],['Ron',32],['Dylan',32],['Colin',32],['Gabriel',32],['Omar',32],['Joel',32],['Vincent',32],['Jake',32],['Nicholas',31],
              ['Jamie',31],['Craig',30],['Don',30],['Wayne',30],['Adrian',30],['Alexander',30],['Jon',30],['Shane',29],['Alan',29],['Terry',29],['Bryan',29],
              ['Darren',29],['Doug',28],['Henry',28],['Luis',28],['Jimmy',28],['Max',28],['Nicolas',28],['Johnny',28],['Keith',28],['Francis',27],['Evan',27],
              ['Dennis',27],['Raymond',27],['Juan',27],['Marco',27],['Randy',27],['Harry',27],['Lucas',26],['Luke',26],['Cody',26],['Ray',26],['Roger',26],
              ['Neil',26]
            ],
            modern: [
              ['Liam',26],['Ethan',26],['Owen',26],['Noah',26],['Jacob',26],['Lucas',26],['Tyler',26],['Lance',2],['John',14],['Alex',14],['James',14],['Peter',14],
              ['Robert',14],['Steve',14],['Matthew',14],['Richard',14],['Dave',14],['Nick',14],['Jeff',14],['Tony',14],['Joe',14],['Jonathan',14],['Anthony',14],
              ['Kyle',14],['Sam',14],['Dan',14],['Jordan',14],['Sean',14],['Rob',14],['Josh',14],['Steven',14],['Brandon',14],['George',14],['Ben',14],['Joseph',14],
              ['Jay',14],['William',14],['Stephen',14],['Aaron',14],['Thomas',14],['Simon',14],['Tim',14],['Tom',14],['Christopher',14],['Ken',14],['Frank',14],
              ['Ian',14],['Bob',14],['Nathan',14],['Shawn',14],['Marc',14],['Jim',14],['Jack',14],['Gary',14],['Andy',14],['Brad',14],['Carlos',14],['Jérémy',14],
              ['Derek',14],['Christian',14],['Danny',14],['Bill',14],['Joshua',14]
            ]
          },
          last: [
            ['Smith',66],['Brown',47],['Wilson',35],['Campbell',32],['Stewart',25],['MacDonald',28],['Taylor',32],['Anderson',31],['Johnson',40],['Williams',39],
            ['Scott',27],['Ross',22],['Murray',20],['Fraser',19],['Graham',20],['Hill',19],['Jones',36],['Miller',30],['James',30],['Thompson',30],['Joseph',29],
            ['White',28],['Young',27],['King',26],['Robinson',25],['Reid',25],['Rose',25],['Clarke',25],['Walker',24],['Davis',24],['Moore',24],['Lewis',24],
            ['Wright',23],['Jackson',23],['Paul',23],['John',22],['Green',22],['Clark',21],['Mitchell',21],['Peters',21],['Kelly',21],['Murphy',21],['Harris',21],
            ['Johnston',20],['Mcdonald',20],['Grant',20],['Edwards',20],['Bell',20],['Roberts',20],['Hall',20],['Chang',20],['Allen',20],['George',20],['Baker',20],
            ['Lai',20],['Watson',19],['Elizabeth',19],['Rai',19],['Adams',19],['Tam',19],['Friesen',19],['Alexander',19],['Bains',19],['Chahal',19],['Francis',19],
            ['Wood',19],['Lynn',19],['Charles',19],['Gordon',18],['Morris',18],['Hamilton',18],['Kennedy',18],['Henry',18],['Arora',18],['Evans',18],['Nelson',18],
            ['Morgan',18],['Phillips',18],['Chu',18],['Robertson',18],['Cooper',18],['Marshall',17],['Sekhon',17],['Morrison',17],['Turner',17],['Simpson',17],
            ['Persaud',17],['Gray',17],['Pierre',17],['Black',17],['Wiebe',17],['Cameron',17],['Bailey',17],['Collins',17],['Mclean',17],['Carter',17],['Ryan',16],
            ['Anne',16],['Shaw',16],['Russell',16],['Parmar',16],['Armstrong',16],['Fung',16],['Parker',16],['Ferguson',16],['Johal',16],['Cook',16],['Klassen',16],
            ['Hunter',16],['Ward',16],['Huynh',16],['Ann',16],['Liang',15],['Toor',15],['Richards',15],['Law',15],['Harrison',15],['Kwan',15],['Foster',15],
            ['Davidson',15],['Richardson',15],['Lawrence',15],['Deol',15],['Sahota',15],['Love',15],['Bhullar',15],['Hughes',15],['Elliott',15],['Gibson',15],
            ['Tsang',15],['Ellis',15],['Fernández',15],['Rogers',15],['Douglas',14],['Dyck',14],['Sangha',14],['Walsh',14],['Davies',14],['Henderson',14],
            ['Landry',14],['Rana',14],['Fisher',14],['Truong',14],['Brooks',14],['Chau',14],['Dsouza',14]
          ] },
        { w: 0.33,
          first: {
            early: [
              ['Jean',3],['Claude',3],['Jacques',3],['Marcel',2],['Richard',2],['Gilles',2]
            ],
            mid: [
              ['Patrick',53],['Alexandre',27],['Éric',61],['Stéphane',25],['Mathieu',26],['Sylvain',21],['Martin',41],['Michel',33],['Samuel',33],['Pierre',32],
              ['Jean',29]
            ],
            modern: [
              ['Félix',26],['Olivier',26],['Nathan',26],['Samuel',26],['Xavier',12],['Émile',12],['Martin',14]
            ]
          },
          last: [
            ['Tremblay',25],['Gagnon',21],['Roy',26],['Côté',19],['Bouchard',16],['Gauthier',19],['Morin',17],['Lavoie',15],['Fortin',14],['Bergeron',14],
            ['Pelletier',15],['Villeneuve',2],['Leblanc',20],['Poirier',14],['Boucher',14]
          ] },
        { w: 0.12, minYear: 2000,
          first: [
            ['Ryan',75],['Justin',57],['Kevin',76],['Daniel',79],['Arjun',26],['Raj',24],['Vikram',12],['Nikhil',12],['Ali',53],['Mohamed',38],['Ahmed',37],
            ['Mohammad',32],['Mohammed',29],['Muhammad',29],['Ahmad',28]
          ],
          last: [
            ['Singh',100],['Patel',70],['Gill',57],['Sharma',45],['Khan',56],['Sandhu',43],['Wong',55],['Chan',52],['Lee',65],['Sidhu',40],['Dhaliwal',35],
            ['Brar',35],['Nguyen',43],['Kim',36],['Kaur',51],['Wang',40],['Chen',40],['Zhang',35],['Dhillon',34],['Lam',32],['Grewal',31],['Tran',31],['Shah',30],
            ['Leung',30],['Kumar',30],['Cheung',26],['Yang',26],['Huang',26],['Lau',26],['Lin',24],['Mann',24],['Ahmad',23],['Tang',23],['Cheng',22],['Chow',22],
            ['Saini',22],['Park',21],['Chung',21],['Randhawa',21],['Malik',20],['Hussain',19],['Kang',19],['Tan',19],['Cheema',18],['Mohammed',18],['Zhou',18],
            ['Choi',18],['Gupta',18],['Sun',18],['Zhao',17],['Lim',17],['Virk',17],['Yeung',17],['Rahman',16],['Pham',16],['Syed',16],['Bajwa',16],['Verma',15],
            ['Zhu',15],['Mehta',14],['Bhatti',14]
          ] }
    ] },

    // ── MEX ──
    MEX: { regions: [
        { w: 1,
          first: {
            early: [
              ['José',4],['Juan',4],['Carlos',4],['Pedro',3],['Ricardo',3],['Miguel',3],['Jesús',3],['Roberto',3],['Guillermo',2],['Rodolfo',2],['Héctor',2],
              ['Moisés',1]
            ],
            mid: [
              ['José',100],['Juan',87],['Luis',86],['Carlos',85],['Jesús',83],['Jorge',70],['Alejandro',67],['Miguel',62],['Ángel',65],['Manuel',60],['Eduardo',59],
              ['Fernando',58],['Francisco',57],['Antonio',57],['Javier',56],['Ricardo',51],['Óscar',49],['Pedro',49],['Víctor',52],['Roberto',48],['Alberto',48],
              ['Mario',48],['Sergio',46],['Gerardo',45],['Arturo',44],['Daniel',64],['David',53],['César',47],['Martín',45],['José Luis',44],['Raúl',43],
              ['Armando',42],['Alex',42],['Héctor',42],['Omar',41],['Iván',40],['Diego',40],['Alfredo',40],['Edgar',40],['Enrique',39],['Adrián',38],['Rafael',37],
              ['Andrés',37],['Julio',36],['Gabriel',36],['Juan Carlos',35],['Pablo',34],['Gustavo',33],['Jaime',32],['Rubén',32],['Miguel Ángel',31],['Hugo',31],
              ['Marco',31],['Guillermo',31],['Alexis',30],['Ramón',30],['Alan',30],['Felipe',30],['Erick',30],['Jonathan',30],['Cristian',29],['Rodrigo',29],
              ['Salvador',29],['Israel',28],['Ernesto',28],['Saul',28],['Kevin',27],['Marcos',27],['Joel',27],['Josue',26],['Santiago',26],['Emmanuel',26],
              ['Alfonso',26],['Mauricio',25],['Abraham',25],['Leonardo',25],['Ismael',24],['Samuel',24],['Rodolfo',23],['Christian',23],['Rogelio',22],
              ['Gilberto',22],['Humberto',22],['Uriel',22],['Esteban',22],['Brayan',22],['Juan Manuel',21],['Beto',21],['Marco Antonio',21],['Jose Antonio',21],
              ['Agustín',21],['Sebastián',21],['José Manuel',21],['Pepe',21],['Lalo',20],['Ulises',20],['Rene',20],['Ignacio',20],['Abel',19],['Leo',19],['Axel',19],
              ['Brandon',19],['Vicente',19],['Alonso',19],['Noe',19],['Ramiro',19],['Isaac',19],['Julián',19],['Moises',18],['Emilio',18],['Erik',18],
              ['Francisco Javier',18],['Alvaro',18],['Adan',18],['Adolfo',17],['Fabián',17],['Paco',17],['Octavio',17],['Alexander',17],['Aldo',17],['Efrain',17],
              ['Aaron',17],['Tony',17],['Tomás',17],['Edwin',16],['Orlando',16],['German',16],['Julio Cesar',16],['Gonzalo',16],['Charly',16],['Felix',16],
              ['Luis Alberto',16],['Osvaldo',16],['Toño',16],['Elias',16],['Bryan',16],['Emiliano',16],['Guadalupe',16],['Juan Pablo',15],['Juan Jose',15],
              ['Leonel',15],['Victor Manuel',15],['Fer',15],['Misael',15],['Benjamin',15]
            ],
            modern: [
              ['Santiago',45],['Diego',45],['Mateo',45],['Sebastián',45],['Emiliano',26],['Leonardo',26],['Andrés',26],['Daniel',26],['Alexis',12],['Patricio',12],
              ['Emilio',12],['Sergio',12],['David',14],['César',14],['Martín',14],['José Luis',14],['Raúl',14],['Armando',14],['Alex',14],['Héctor',14],['Omar',14],
              ['Iván',14],['Alfredo',14],['Edgar',14],['Enrique',14],['Adrián',14],['Rafael',14],['Julio',14],['Gabriel',14],['Juan Carlos',14],['Pablo',14],
              ['Gustavo',14],['Jaime',14],['Rubén',14],['Miguel Ángel',14],['Hugo',14],['Marco',14],['Guillermo',14],['Ramón',14],['Alan',14],['Felipe',14],
              ['Erick',14],['Jonathan',14],['Cristian',14],['Rodrigo',14],['Salvador',14],['Israel',14],['Ernesto',14],['Saul',14],['Kevin',14],['Marcos',14],
              ['Joel',14],['Josue',14],['Emmanuel',14],['Alfonso',14],['Mauricio',14],['Abraham',14],['Ismael',14],['Samuel',14],['Rodolfo',14],['Christian',14],
              ['Rogelio',14],['Gilberto',14],['Humberto',14],['Uriel',14],['Esteban',14]
            ]
          },
          last: [
            ['Hernández',100],['García',85],['Martínez',82],['López',80],['González',70],['Rodríguez',69],['Pérez',65],['Sánchez',64],['Ramírez',59],['Flores',50],
            ['Torres',45],['Cruz',43],['Morales',43],['Reyes',42],['Gómez',45],['Mendoza',38],['Vázquez',41],['Díaz',39],['Castillo',35],['Ruiz',34],['Aguilar',34],
            ['Ortiz',33],['Jiménez',38],['Gutiérrez',37],['Rojas',25],['Guerrero',23],['Solórzano',2],['Rebaque',2],['Rivera',32],['Romero',32],['Moreno',31],
            ['Álvarez',31],['Méndez',31],['Chávez',30],['Ramos',30],['Medina',29],['Juárez',29],['Herrera',29],['Castro',28],['Luna',27],['Guzmán',27],
            ['Contreras',26],['Dominguez',26],['Salazar',26],['Vargas',25],['Muñoz',25],['Estrada',24],['Ortega',24],['Soto',23],['Velázquez',23],['Alvarado',22],
            ['Fernández',22],['Lara',22],['Espinoza',22],['Vega',22],['Carrillo',21],['Márquez',21],['Cortés',21],['Gonzales',20],['Sandoval',20],['León',20],
            ['Cervantes',20],['Avila',20],['Ríos',20],['Valdez',20],['Ibarra',20],['Delgado',19],['Solis',19],['Campos',19],['Acosta',19],['Silva',19],
            ['Santiago',19],['Valenzuela',19],['Bautista',19],['Santos',19],['Camacho',18],['Rosas',18],['Robles',18],['Miranda',18],['Maldonado',18],['Molina',17],
            ['Navarro',17],['Salas',17],['Pacheco',17],['Rosales',17],['Nava',17],['Peña',17],['Valencia',17],['Ochoa',17],['Cabrera',17],['Aguirre',17],
            ['Núñez',16],['Rangel',16],['De La Cruz',16],['Fuentes',16],['Mejía',16],['Meza',16],['Trejo',16],['Mora',16],['Padilla',16],['Castañeda',16],
            ['Huerta',16],['Beltran',16],['Ayala',16],['Arellano',15],['Zamora',15],['Olvera',15],['Orozco',15],['Andrade',15],['Villa',15],['Sosa',15],
            ['Montes',15],['Tapia',15],['Cárdenas',15],['Durán',15],['Zavala',15],['Corona',14],['Palacios',14],['Cortez',14],['Salinas',14],['Villanueva',14],
            ['Serrano',14],['Figueroa',14],['Macias',14],['Villegas',14],['Ponce',14],['Lozano',14],['Zuñiga',14],['Gallegos',14],['Quintero',14],['Franco',14],
            ['Vásquez',13],['Espinosa',13],['Trujillo',13],['Rocha',13],['Galindo',13],['Suárez',13],['Barrera',13],['Alonso',13],['Bernal',13],['Parra',13],
            ['Leyva',13],['Esquivel',13],['Montoya',13],['Escobar',13],['Calderon',13],['Galvan',13],['Marin',13],['Rivas',13],['Carmona',13],['Rubio',13],
            ['Felix',12],['Bravo',12],['Esparza',12],['Pineda',12],['Cuevas',12],['Cano',12],['Mata',12],['Mtz',12],['Duarte',12],['Arias',12],['Garza',12],
            ['Cisneros',12],['Guevara',12],['Peralta',11],['Osorio',11],['Villalobos',11],['Gallardo',11],['Salgado',11],['Zapata',11],['Montiel',11],
            ['Murillo',11],['Saucedo',11],['Martines',11],['Lugo',11],['Tovar',11],['Sanches',11],['Avalos',11],['Hernandes',11],['Benitez',11],['Quiroz',11],
            ['Vera',11],['Resendiz',11],['De La Rosa',11],['Cordova',11],['Velasco',11],['Tellez',10],['Roman',10],['Olivares',10],['Leal',10],['Santana',10],
            ['Zepeda',10],['Zarate',10],['Enriquez',10],['Escobedo',10],['Arroyo',10],['Ángel',10],['Guerra',10],['Barajas',10],['Villarreal',10],['Navarrete',10],
            ['Reyna',10],['Medrano',10],['Chan',10],['Blanco',10],['Paredes',10],['Segura',10],['Armenta',10]
          ] }
    ] },

    // ── RSA ──
    RSA: { regions: [
        { w: 0.4,
          first: {
            early: [
              ['Tony',3],['Peter',3],['John',3],['Dave',3],['Ian',3],['Neville',2],['Doug',2],['Trevor',2],['Basil',1],['Paddy',1]
            ],
            mid: [
              ['Gary',22],['Craig',30],['Kevin',39],['Mark',42],['Wayne',34],['Shaun',41],['Brad',12],['Grant',23],['John',83],['David',80],['Michael',72],
              ['Peter',68],['Daniel',60],['Patrick',60],['Joseph',60],['Chris',60],['James',58],['Paul',56],['Simón',54],['George',53],['Nhlanhla',53],['Ayanda',53],
              ['Simphiwe',52],['Thato',52],['Richard',51],['Sabelo',51],['Samuel',51],['Njabulo',51],['Charles',50],['Sizwe',50],['Mike',50],['Andrew',49],
              ['William',49],['Prince',49],['Sfiso',49],['Brian',48],['Thomas',48],['Gift',48],['Víctor',47],['Martín',47],['Isaac',47],['Sello',47],['Musa',47],
              ['Sihle',46],['Vincent',45],['Sam',44],['Mxolisi',44],['Teboho',44],['Emmanuel',43],['Robert',43],['Eric',42],['Sifiso',42],['Alex',42],['Bheki',42],
              ['Godfrey',40],['Jacques',40],['Steven',40],['Jabulani',39],['Jason',39],['Christopher',39],['Sphamandla',39],['Lucas',39],['Itumeleng',39],
              ['Lindokuhle',39],['Dumisani',38],['León',38],['Innocent',38],['Senzo',38],['Thokozani',38],['Frans',37],['Sthembiso',37],['Jonathan',36],['Joe',36],
              ['Edward',36],['Louis',36],['Thando',36],['Ben',35],['Given',35],['Nathi',35],['Raymond',35],['Kenneth',35],['Anele',35],['Lawrence',35],['Ernest',35],
              ['Siya',34],['Andries',34],['Junior',34],['Justin',34],['Nico',34],['Stephen',34],['Anthony',34],['Jacob',34],['Frank',33],['Alfred',33],['Sakhile',33],
              ['Luyanda',33],['Sphiwe',33],['Linda',33],['Albert',33]
            ],
            modern: [
              ['Kyle',26],['Dylan',26],['Joshua',26],['Matthew',26],['Liam',26],['Jordan',12],['Ethan',12],['Callan',2],['John',14],['David',14],['Michael',14],
              ['Peter',14],['Daniel',14],['Patrick',14],['Joseph',14],['Chris',14],['James',14],['Paul',14],['Simón',14],['George',14],['Nhlanhla',14],['Ayanda',14],
              ['Simphiwe',14],['Thato',14],['Richard',14],['Sabelo',14],['Samuel',14],['Njabulo',14],['Charles',14],['Sizwe',14],['Mike',14],['Andrew',14],
              ['William',14],['Prince',14],['Sfiso',14],['Brian',14],['Thomas',14],['Gift',14],['Víctor',14],['Martín',14],['Isaac',14],['Sello',14],['Musa',14],
              ['Sihle',14],['Vincent',14],['Sam',14],['Mxolisi',14],['Teboho',14],['Emmanuel',14],['Robert',14],['Eric',14],['Sifiso',14]
            ]
          },
          last: [
            ['Smith',60],['Brown',30],['Taylor',17],['Wilson',21],['Bennett',12],['Reed',12],['Duncan',12],['Scott',12],['Watson',12],['Harris',12],['Clarke',12],
            ['Foster',12],['Nash',2],['Jacobs',56],['Naidoo',53],['Williams',52],['Govender',46],['Pillay',46],['Adams',44],['Abrahams',37],['Davids',36],
            ['Van Zyl',33],['Langa',33],['Hendricks',33],['Shabangu',32],['Majola',32],['Kekana',32],['Petersen',31],['Kunene',31],['Modise',31],['Cloete',31],
            ['Booysen',31],['Shabalala',31],['Zuma',31],['Moodley',31],['Johnson',31],['Van Niekerk',30],['Daniels',30],['Mudau',30],['Khanyile',30],['Shezi',29],
            ['Nhlapo',29],['Simelane',28],['Banda',28],['Joseph',28],['Swart',28],['Malatji',28],['Shongwe',28],['Van Rooyen',27],['James',27],['Chetty',27],
            ['King',27],['Nyathi',27],['Skosana',26],['Mathe',26],['Mohlala',26],['Kubheka',26],['Thwala',26],['Martín',26],['Zondo',25],['Nene',25],['John',25],
            ['Sibisi',25],['Bhengu',25],['Matlala',25],['Jones',25],['Duma',25],['Malinga',24],['Moses',24],['Biyela',24],['Magagula',24],['Luthuli',24],
            ['Mogale',24],['Pienaar',24],['Isaacs',24],['Du Preez',24],['De Beer',24],['Skhosana',24],['Motloung',24],['Shange',24],['Visser',24],['Mulaudzi',24],
            ['George',24],['Maphumulo',23],['Gift',23],['Madonsela',23],['Mohale',23],['Tau',23],['Madlala',23],['Makhanya',23],['Van Der Westhuizen',23],
            ['Fortuin',23],['Sibeko',23],['Lerato',23],['Sthole',23],['Pieterse',23],['Van Rensburg',23],['Van Heerden',22],['Dhlamini',22],['Portia',22],
            ['Ledwaba',22]
          ] },
        { w: 0.3,
          first: {
            early: [
              ['Piet',3],['Johan',3],['Willem',3],['Jan',3],['Hennie',2],['Koos',2],['Danie',2],['Gert',2]
            ],
            mid: [
              ['Pieter',48],['Jaco',40],['André',51],['Johan',69],['Riaan',33],['Christo',28],['Deon',36],['Ruan',23],['Johannes',50],['Jan',46],['Francois',36],
              ['Willem',33]
            ],
            modern: [
              ['Ruan',12],['Heinrich',12],['Stefan',12],['Charl',12],['Kyle',12],['Divan',2],['Janco',2],['Wikus',2],['Johannes',14],['Jan',14]
            ]
          },
          last: [
            ['Van der Merwe',39],['Botha',51],['Pretorius',40],['Venter',37],['Du Plessis',37],['Fourie',37],['Nel',39],['Coetzee',39],['Steyn',29],
            ['De Villiers',19],['Kruger',35],['Joubert',28],['Marais',27],['Swanepoel',28],['Viljoen',26],['Du Toit',30],['Van Wyk',44],['Louw',36],['Smit',36],
            ['Meyer',33],['Erasmus',33],['Muller',28],['Engelbrecht',28],['Jansen',27],['Potgieter',27],['Le Roux',27],['Strydom',26],['Oosthuizen',26],
            ['Barnard',24],['Jordaan',24],['Bezuidenhout',24],['Prinsloo',22]
          ] },
        { w: 0.3, minYear: 1995,
          first: [
            ['Thabo',100],['Sipho',76],['Bongani',81],['Tshepo',83],['Thabang',78],['Themba',69],['Mpho',71],['Sandile',69],['Siyabonga',68],['Tebogo',64],
            ['Sibusiso',63],['Xolani',63],['Andile',60],['Thulani',59],['Thabiso',76],['Lucky',71],['Mandla',57],['Thapelo',57],['Vusi',57],['Sbusiso',56],
            ['Sanele',55],['Nkosinathi',51],['Tumelo',51],['Moses',49],['Katlego',49],['Kabelo',49],['Karabo',46],['Mduduzi',43],['Kagiso',41],['Nkululeko',39],
            ['Neo',39],['Lebogang',38],['Ntokozo',37],['Mlungisi',37],['Phumlani',36],['Philani',36],['Phillip',35],['Ndumiso',34],['Mthokozisi',33]
          ],
          last: [
            ['Ndlovu',100],['Dlamini',91],['Khumalo',87],['Nkosi',82],['Mokoena',70],['Sithole',67],['Mkhize',67],['Mahlangu',63],['Zulu',62],['Ngcobo',60],
            ['Mthembu',59],['Dube',59],['Gumede',56],['Khoza',55],['Buthelezi',51],['Ngwenya',51],['Mofokeng',51],['Mbatha',50],['Mhlongo',50],['Moyo',49],
            ['Baloyi',48],['Zwane',48],['Ncube',48],['Radebe',47],['Tshabalala',46],['Sibiya',45],['Chauke',45],['Mazibuko',45],['Ntuli',45],['Mthethwa',44],
            ['Nxumalo',44],['Cele',44],['Mathebula',43],['Maseko',42],['Mabaso',40],['Molefe',40],['Ngubane',40],['Ngobeni',39],['Sibanda',39],['Mtshali',38],
            ['Maluleke',37],['Motaung',37],['Moloi',37],['Mchunu',36],['Mkhwanazi',36],['Phiri',36],['Mnguni',35],['Mnisi',35],['Zungu',35],['Dladla',34],
            ['Zondi',34],['Hlongwane',34],['Hadebe',34],['Nkuna',34],['Vilakazi',33],['Xaba',33],['Hlatshwayo',32],['Mhlanga',32],['Mdluli',31],['Mlambo',31],
            ['Mbhele',30],['Xulu',30],['Mashaba',30],['Nkomo',29],['Ndaba',29],['Mabuza',29],['Masuku',28],['Ngema',28],['Masango',27],['Mabunda',27],
            ['Khuzwayo',27],['Msomi',27],['Ntombela',27],['Mokwena',27],['Tsotetsi',27],['Mpho',27],['Mpofu',25],['Mabena',25],['Mthombeni',25],['Mngomezulu',25],
            ['Masilela',24],['Msibi',24],['Mashego',24],['Ndou',24],['Ndlela',24],['Ngobese',24],['Hlophe',23],['Ntshangase',23],['Mabasa',23],['Nzimande',23],
            ['Mkhabela',23],['Ndebele',22],['Khosa',22],['Mncube',22],['Mbele',22]
          ] }
    ] },

    // ── ZIM ──
    ZIM: { regions: [
        { w: 1,
          first: [
            ['John',3],['Mike',3],['Peter',3],['Sam',2],['Clive',2],['Ray',2],['Ian',2],['Gary',2],['Doug',2],['Brendan',1],['Colin',1],['Trevor',1],['Neil',1],
            ['Rod',1],['Bruce',1],['Keith',1],['Des',1],['Basil',1]
          ],
          last: [
            ['Smith',3],['Walker',2],['Brown',2],['Fraser',2],['Campbell',2],['Watson',2],['Henderson',2],['Marshall',2],['Reid',2],['Currie',1]
          ] }
    ] },

    // ── IRL ──
    IRL: { regions: [
        { w: 1,
          first: {
            early: [
              ['Patrick',4],['Michael',4],['John',4],['Seán',3],['Joe',2],['Tommy',2],['Derek',2],['Brendan',2],['Eamonn',2],['Paddy',2]
            ],
            mid: [
              ['John',100],['David',73],['Michael',72],['Paul',71],['James',61],['Sean',65],['Mark',57],['Brian',54],['Stephen',53],['Kevin',51],['Conor',50],
              ['Shane',49],['Patrick',48],['Martin',47],['Alan',46],['Niall',37],['Liam',41],['Ciarán',35],['Damien',26],['Gary',32],['Peter',44],['Joe',42],
              ['Tom',41],['Jack',40],['Daniel',39],['Pat',38],['Thomas',38],['Brendan',36],['Robert',35],['Adam',35],['Tony',35],['Eoin',34],['Paddy',34],
              ['Darren',34],['Noel',33],['Declan',33],['Andrew',33],['Anthony',33],['Barry',31],['Jason',31],['Keith',31],['Aaron',31],['Chris',30],['Kieran',30],
              ['Colm',29],['Ian',29],['Richard',28],['Gerard',28],['Jamie',28],['Derek',28],['Cian',28],['Luke',28],['Dave',28],['Ryan',28],['Aidan',27],['Gerry',27],
              ['Seamus',27],['Philip',27],['Dylan',27],['Jim',26],['Ronan',26],['Mike',26],['Darragh',25],['Tommy',25],['Alex',25],['Denis',24],['Adrian',24],
              ['Frank',24],['Colin',24],['William',24],['Ben',24],['Mick',24],['Gavin',24],['Cathal',24],['Donal',23],['Matthew',23],['Eddie',22],['Padraig',22],
              ['Dean',22],['Joseph',21],['Dermot',21],['Eamonn',21],['Ray',21],['Dan',21],['Johnny',20],['Jonathan',20],['Andy',20],['Danny',20],['Ger',20],
              ['Jimmy',20],['Rory',20],['Simon',20],['Christopher',19],['Neil',19],['Karl',19],['Ross',19],['Billy',19],['Lee',19],['Sam',18],['Graham',18],
              ['Cormac',18],['Craig',18],['Oisin',18],['Evan',18],['Steven',18],['Eoghan',18],['Rob',18],['George',18],['Ken',17],['Tim',17],['Micheal',17],
              ['Owen',17],['Robbie',17],['Eamon',17],['Nathan',16],['Vincent',16],['Tomas',16],['Eric',16],['Jordan',16],['Josh',16],['Trevor',16],['Hugh',15],
              ['Enda',15],['Eugene',15],['Harry',15],['Bernard',15],['Charlie',15],['Fergal',15],['Francis',15],['Damian',15],['Steve',15],['Richie',15],['Terry',15],
              ['Jake',15],['Edward',15],['Wayne',14],['Greg',14],['Kyle',14],['Killian',14],['Diarmuid',14]
            ],
            modern: [
              ['Jack',45],['Conor',26],['Cian',26],['Darragh',26],['Seán',26],['Liam',26],['Adam',26],['Daniel',26],['Fionn',12],['Oisín',12],['Peter',14],['Joe',14],
              ['Tom',14],['Pat',14],['Thomas',14],['Brendan',14],['Robert',14],['Tony',14],['Eoin',14],['Paddy',14],['Darren',14],['Noel',14],['Declan',14],
              ['Andrew',14],['Anthony',14],['Barry',14],['Jason',14],['Keith',14],['Aaron',14],['Chris',14],['Kieran',14],['Colm',14],['Ian',14],['Richard',14],
              ['Gerard',14],['Jamie',14],['Derek',14],['Luke',14],['Dave',14],['Ryan',14],['Aidan',14],['Gerry',14],['Seamus',14],['Philip',14],['Dylan',14],
              ['Jim',14],['Ronan',14],['Mike',14],['Tommy',14],['Alex',14],['Denis',14],['Adrian',14],['Frank',14],['Colin',14],['William',14],['Ben',14],['Mick',14],
              ['Gavin',14],['Cathal',14],['Donal',14],['Matthew',14],['Eddie',14],['Padraig',14],['Dean',14],['Joseph',14]
            ]
          },
          last: [
            ['Murphy',100],['Kelly',87],['Byrne',79],['Ryan',74],['Walsh',73],['Doyle',61],['O\'Brien',45],['Lynch',50],['O\'Connor',45],['Dunne',48],['Murray',47],
            ['McCarthy',46],['Brennan',46],['Daly',45],['Burke',44],['Nolan',44],['O\'Sullivan',45],['Kennedy',43],['Farrell',42],['O\'Neill',45],['Quinn',40],
            ['Carroll',40],['Power',41],['Kavanagh',41],['Gallagher',40],['Fitzgerald',39],['Moore',36],['Flanagan',25],['Watt',2],['Smith',50],['Flynn',39],
            ['Collins',39],['Connolly',38],['Whelan',38],['Reilly',37],['Doherty',37],['Duffy',37],['Clarke',37],['Kenny',36],['Brady',36],['Healy',35],
            ['Keane',34],['Moran',34],['O\'Reilly',34],['Fitzpatrick',33],['Maher',33],['Hayes',33],['Ward',33],['Roche',32],['Browne',32],['Foley',32],
            ['McGrath',31],['Casey',31],['Buckley',31],['Hughes',31],['Hogan',30],['Sweeney',30],['Maguire',30],['Cullen',30],['Delaney',29],['Butler',29],
            ['Smyth',29],['White',29],['Keogh',28],['Egan',28],['O\'Connell',27],['Cunningham',27],['Hickey',27],['Lyons',27],['Higgins',27],['Sheridan',27],
            ['Mooney',27],['Sheehan',26],['Curran',26],['Molloy',26],['Jones',26],['Cahill',26],['Sullivan',26],['King',26],['O Neill',26],['Barrett',26],
            ['Odonnell',26],['Boyle',26],['Moloney',26],['Kearney',26],['Fox',26],['Mccormack',25],['Corcoran',25],['Dempsey',25],['Oshea',25],['Donnelly',25],
            ['Hennessy',25],['Mcmahon',25],['Crowley',25],['Malone',25],['Lawlor',24],['Conway',24],['Phelan',24],['Dowling',24],['Oleary',24],['Carey',24],
            ['Costello',24],['Joyce',23],['Duggan',23],['Redmond',23],['Campbell',23],['Kinsella',23],['Mckenna',23],['Mcdonnell',22],['Mcdonagh',22],['Connor',22],
            ['Dolan',22],['Cleary',22],['O Reilly',22],['Cummins',22],['Morrissey',22],['Okeeffe',22],['Coleman',22],['Mahon',22],['Kelleher',22],['Keating',22],
            ['Long',22],['Coughlan',21],['Conroy',21],['Fleming',21],['Gleeson',21],['Rooney',21],['Greene',21],['Mcnamara',21],['Dillon',21],['Reynolds',21],
            ['Mccabe',21],['Doran',21],['Finnegan',21],['Finn',21],['Forde',21],['Breen',20],['Leonard',20],['O Connell',20],['Heffernan',20],['Madden',20],
            ['Hurley',20],['Cassidy',20],['Williams',20],['Coffey',20],['Kirwan',20],['Morris',20],['Orourke',20],['Otoole',20],['Jordan',20],['Clancy',20],
            ['Mulligan',20],['Kiely',20],['Kane',20],['Mcdermott',19],['Callaghan',19],['Woods',19],['Keenan',19],['Ocallaghan',19],['Cooney',19],['Gorman',19],
            ['Brown',19],['Wilson',19],['Bourke',19],['O Shea',19],['Leahy',19],['Hegarty',19],['Hynes',19],['Reid',19],['Russell',19],['Coyle',18],['Omahony',18],
            ['O Leary',18],['Geraghty',18],['Dalton',18],['Morgan',18],['Farrelly',18],['Wall',18],['Thompson',18],['Mcdonald',18],['Monaghan',18],['O Donnell',18],
            ['Davis',18],['Fagan',18],['Harrington',18],['Brien',18],['Odonovan',18],['Allen',18],['Mchugh',18],['Odonoghue',18],['Fahy',18],['Quigley',18],
            ['Flood',18],['Donovan',18],['Meehan',18],['Keegan',18],['Mullen',18],['Kearns',18],['Carr',18],['Odwyer',17],['Mitchell',17],['Mc Carthy',17],
            ['Conlon',17],['Darcy',17],['Noonan',17],['Mcevoy',17],['Dwyer',17],['Burns',17],['O Mahony',17]
          ] }
    ] },

    // ── POR ──
    POR: { regions: [
        { w: 1,
          first: {
            early: [
              ['José',5],['António',4],['Manuel',4],['Carlos',4],['Mário',3],['Fernando',3],['Francisco',3],['Joaquim',2],['Américo',1],['Nuno',2]
            ],
            mid: [
              ['Pedro',83],['João',100],['Carlos',65],['Paulo',65],['Ricardo',61],['Rui',61],['Nuno',59],['Miguel',59],['Tiago',58],['Luís',68],['Bruno',53],
              ['Diogo',52],['Jorge',49],['André',52],['Filipe',41],['Hugo',38],['Daniel',39],['Duarte',20],['José',74],['Antonio',65],['Francisco',46],['Manuel',45],
              ['Fernando',43],['Gonçalo',39],['Vitor',38],['Sérgio',35],['David',33],['Fábio',33],['Marco',33],['Rodrigo',32],['Mário',32],['Joaquim',30],
              ['Rafael',29],['Alexandre',29],['Rubén',28],['Eduardo',26],['Nelson',26],['Helder',26],['Tomás',24],['Guilherme',23],['Henrique',22],['Afonso',22],
              ['Vasco',21],['Bernardo',20],['Claudio',17],['Gabriel',17],['Leandro',16],['Artur',16],['Renato',16],['Marcio',16],['Víctor',15],['Alberto',15],
              ['Armando',15],['Emanuel',15],['Joel',15],['Samuel',14],['Ivo',14],['Marcelo',14],['César',14],['Julio',14],['Flávio',14],['João Pedro',14],
              ['Simão',13],['Rogério',13],['Leonardo',13],['Alvaro',13],['Martim',13],['Domingos',13],['José Carlos',13],['Gustavo',13],['Edgar',13],['Frederico',12],
              ['Alex',12],['Cristiano',12],['Roberto',12],['José Manuel',12],['Telmo',12],['Lucas',12],['Marcos',12],['Jaime',12],['Augusto',12],['Raúl',11],
              ['Angelo',11],['Orlando',11],['Adriano',11],['Dinis',11],['Igor',10],['João Paulo',10],['Sandro',10],['Alfredo',10],['Agostinho',10],['Mauro',10],
              ['Valter',10],['Gil',9],['Americo',9],['Iván',9],['José Luis',9],['Leonel',9],['Humberto',9],['Manel',8],['Micael',8],['Abilio',8],['Luis Miguel',8],
              ['Adelino',8],['Óscar',8],['Hélio',8],['Abel',8],['Tony',8],['José António',8],['Armindo',8],['Rafa',8],['João Carlos',7],['Lourenço',7],
              ['Luis Filipe',7],['Dário',7],['Celso',7],['Salvador',7],['Wilson',7],['Anibal',7],['Gilberto',7],['Arlindo',7],['José Pedro',7],['Mateus',7],
              ['Xavier',7],['Sebastião',7],['Lino',6],['Luciano',6],['Rodolfo',6],['Vicente',6],['Avelino',6],['Ernesto',6],['Albino',6],['Pedro Miguel',6],
              ['Luiz',6],['Arnaldo',6],['Felipe',6],['Davide',6],['Norberto',6]
            ],
            modern: [
              ['João',45],['Tomás',45],['Francisco',45],['Rodrigo',45],['Afonso',26],['Martim',26],['Santiago',26],['Diogo',26],['Gonçalo',26],['Guilherme',26],
              ['Vasco',12],['Salvador',12],['José',14],['Antonio',14],['Manuel',14],['Fernando',14],['Vitor',14],['Sérgio',14],['David',14],['Fábio',14],['Marco',14],
              ['Mário',14],['Joaquim',14],['Rafael',14],['Alexandre',14],['Rubén',14],['Eduardo',14],['Nelson',14],['Helder',14],['Henrique',14],['Bernardo',14],
              ['Claudio',14],['Gabriel',14],['Leandro',14],['Artur',14],['Renato',14],['Marcio',14],['Víctor',14],['Alberto',14],['Armando',14],['Emanuel',14],
              ['Joel',14],['Samuel',14],['Ivo',14],['Marcelo',14],['César',14],['Julio',14],['Flávio',14],['João Pedro',14],['Simão',13],['Rogério',13],
              ['Leonardo',13],['Alvaro',13],['Domingos',13],['José Carlos',13],['Gustavo',13],['Edgar',13],['Frederico',12],['Alex',12],['Cristiano',12],
              ['Roberto',12],['José Manuel',12],['Telmo',12],['Lucas',12]
            ]
          },
          last: [
            ['Silva',100],['Santos',82],['Ferreira',70],['Pereira',67],['Oliveira',61],['Costa',60],['Rodrigues',58],['Martins',56],['Sousa',53],['Fernandes',52],
            ['Gomes',49],['Lopes',48],['Ribeiro',47],['Gonçalves',50],['Marques',45],['Carvalho',45],['Almeida',44],['Pinto',43],['Alves',43],['Dias',40],
            ['Teixeira',39],['Correia',36],['Mendes',36],['Moreira',35],['Soares',34],['Monteiro',34],['Lacerda',2],['Chaves',8],['Vieira',34],['Cardoso',33],
            ['Nunes',32],['Duarte',32],['Rocha',31],['Coelho',28],['Reis',28],['Neves',27],['Freitas',27],['Cruz',27],['Cunha',27],['Machado',26],['Pires',26],
            ['Fonseca',26],['Tavares',25],['Barbosa',25],['Araújo',25],['Lima',25],['Matos',24],['Simões',24],['Antunes',24],['Castro',23],['Andrade',22],
            ['Lourenço',22],['Figueiredo',22],['Azevedo',22],['Magalhães',21],['Faria',20],['Barros',20],['Filipe',19],['Morais',19],['Pinheiro',19],['Abreu',19],
            ['Batista',19],['Henriques',19],['Mota',19],['Jesús',19],['Afonso',19],['Guerreiro',18],['Rosa',18],['Brito',18],['Nogueira',18],['Borges',18],
            ['Melo',18],['Esteves',17],['Maia',16],['Baptista',16],['Moura',16],['Neto',16],['Amaral',16],['Gouveia',15],['Nascimento',15],['Valente',15],
            ['Sofia',15],['Leite',15],['Vaz',15],['Branco',15],['Gaspar',14],['Pacheco',14],['Alexandre',14],['Loureiro',14],['Pinho',14],['Vicente',14],
            ['Leal',14],['Macedo',14],['Cabral',14],['Amorim',13],['Guimarães',13],['Filipa',13],['Matías',13],['Couto',13],['Bastos',13],['Paiva',13],
            ['Guedes',13],['Rebelo',13],['Mateus',13],['Carneiro',12],['Da Silva',12],['Peixoto',12],['Domingues',12],['Sequeira',12],['Saraiva',12],
            ['Cordeiro',12],['Leitão',12],['Sampaio',12],['Caetano',12],['Lemos',12],['Conceição',12],['Bernardo',12],['Aguiar',12],['Ventura',11],['Morgado',11],
            ['Coutinho',11],['Mendonça',11],['Mesquita',11],['Guerra',11],['Madeira',11],['Vasconcelos',11],['Alexandra',11],['Ramalho',11],['Godinho',11],
            ['Souza',11],['João',11],['Félix',11],['Pimenta',11],['Brandão',11],['Viegas',11],['Serra',10],['Graça',10],['Domingos',10],['Trindade',10],
            ['Veiga',10],['Raposo',10],['Varela',10],['Palma',10],['Dinis',10],['Pina',10],['Martinho',10],['Figueira',10],['Carmo',10],['Medeiros',10],
            ['Braga',10],['Roque',10],['Inácio',10],['Carreira',10],['Viana',10],['Lucas',10],['Pais',10],['Freire',10],['Cerqueira',9],['Diogo',9],['Amaro',9],
            ['Barata',9],['Xavier',9],['Tomás',9],['Caldeira',9],['Gil',9],['Marinho',9],['Barroso',9],['Queirós',9],['Salgado',9],['Vale',9],['Augusto',9],
            ['Brás',9],['Cristina',9],['Nobre',9],['Luz',9],['Isabel',9],['Veloso',9],['Albuquerque',9],['Lobo',9],['Silveira',9],['Semedo',9],['Santana',9],
            ['Teles',9],['Ferraz',8],['Fontes',8],['Patricio',8],['Botelho',8],['Barreto',8],['Resende',8],['Pimentel',8],['Dos Santos',8],['Furtado',8],
            ['Meireles',8],['Silvestre',8],['Bessa',8],['De Sousa',8],['Pestana',8],['Rita',8],['Pedrosa',8],['Abrantes',8],['Agostinho',8],['Rosário',8],
            ['Sobral',8],['Luís',8],['Farinha',8],['Calado',7],['Salvador',7],['Grilo',7]
          ] }
    ] },

    // ── MON ──
    MON: { regions: [
        { w: 0.7,
          first: [
            ['Louis',4],['Arthur',4],['Charles',3],['Olivier',3],['Hugo',3],['Jules',3],['Léo',3],['Maxime',3],['Antoine',3],['Théo',3],['Raphaël',2],['Mathis',2],
            ['Baptiste',2],['Romain',2],['Alexandre',2],['Nicolas',2],['Julien',2],['Sacha',1],['Côme',1],['Aurélien',1]
          ],
          last: [
            ['Blanc',3],['Fontaine',2],['Aubert',2],['Roux',2],['Marchand',2],['Perrin',2],['Girard',2],['Masson',2],['Rey',2],['Barral',1],['Leclerc',1],
            ['Médecin',2],['Crovetto',2],['Gastaud',2],['Boisson',2],['Palmaro',1],['Notari',2],['Marsan',1],['Vatrican',1],['Bellando',1],['Marquet',1],
            ['Gamba',1],['Solamito',1]
          ] },
        { w: 0.3,
          first: [
            ['Marco',3],['Luca',3],['Matteo',3],['Andrea',3],['Stefano',2],['Alessandro',2],['Lorenzo',2],['Giulio',1],['Edoardo',1]
          ],
          last: [
            ['Grimaldi',3],['Rossi',3],['Marchetti',2],['Bianchi',2],['Ferraro',2],['Ricci',2],['Conti',1],['Romano',1],['Vitale',1],['Massa',1]
          ] }
    ] },

    // ── URU ──
    URU: { regions: [
        { w: 1,
          first: [
            ['Carlos',100],['Juan',96],['Daniel',92],['Pablo',92],['Luis',89],['Jorge',87],['Diego',85],['Marcelo',76],['Fernando',76],['José',84],['Martín',83],
            ['Alejandro',70],['Santiago',69],['Gustavo',68],['Matías',71],['Eduardo',65],['Nicolás',75],['Julio',63],['Gabriel',62],['Andrés',70],['Sebastián',67],
            ['Gonzalo',58],['Óscar',46],['Federico',55],['Javier',61],['Miguel',60],['Agustín',60],['Sergio',57],['Lucas',56],['Rodrigo',56],['Mario',55],
            ['Fabián',53],['Rubén',51],['Alvaro',51],['Facundo',51],['Leonardo',50],['Roberto',50],['Marcos',49],['Cristian',48],['Bruno',47],['Walter',47],
            ['Franco',46],['Ricardo',46],['Richard',46],['Hugo',45],['Gastón',44],['Mauricio',43],['Joaquín',41],['Nico',41],['Víctor',40],['Adrián',40],
            ['Alberto',39],['Héctor',39],['Nahuel',39],['Pedro',39],['Gerardo',38],['Enrique',38],['Raúl',37],['Guillermo',37],['Ignacio',37],['Damian',37],
            ['Esteban',36],['César',35],['Manuel',35],['Dario',35],['Nestor',35],['Jonathan',35],['Nacho',35],['Mateo',34],['Nelson',34],['Maxi',33],
            ['Francisco',33],['José Luis',33],['German',33],['Rafael',32],['Ángel',32],['Seba',32],['Christian',32],['Claudio',32],['Leandro',31],['Mathias',31],
            ['Alfredo',31],['Washington',31],['Kevin',31],['Mauro',31],['Leo',31],['Ezequiel',30],['Emiliano',30],['Juan Carlos',30],['Ariel',30],['Antonio',30],
            ['Alexis',30],['Fede',30],['David',29],['Maximiliano',29],['Robert',29],['Alex',28],['Wilson',28],['Santi',28],['Luciano',28],['Facu',28],['Brian',27],
            ['Ramón',27],['Iván',26]
          ],
          last: [
            ['Rodríguez',100],['González',78],['Martínez',66],['Silva',54],['Fernández',60],['Pérez',57],['García',53],['López',52],['Sosa',46],['Pereira',46],
            ['Olivera',42],['Díaz',44],['Ferreira',39],['Acosta',38],['Suárez',41],['Gómez',41],['Álvarez',37],['Cabrera',36],['Núñez',37],['Correa',34],
            ['Machado',32],['Cardozo',30],['Techera',21],['Hernández',38],['Sánchez',32],['Méndez',31],['Castro',30],['De Los Santos',29],['Moreira',29],
            ['Rivero',29],['Morales',28],['Pereyra',27],['Silvera',27],['Silveira',27],['Viera',26],['Pintos',26],['Romero',26],['Ramos',25],['Gutiérrez',24],
            ['Ramírez',24],['De Leon',24],['Alvez',24],['Torres',23],['Da Silva',23],['Duarte',22],['Medina',22],['Delgado',22],['Vazquez',21],['Larrosa',20],
            ['Santos',20],['Márquez',20],['Benitez',20],['Piriz',20],['Costa',19],['Barboza',19],['Lima',19],['Giménez',19],['Rocha',19],['Reyes',18],
            ['Barrios',18],['Perdomo',18],['Flores',18],['Curbelo',18],['Dos Santos',17],['Alonso',17],['Ruiz',17],['Araujo',17],['Blanco',17],['Varela',16],
            ['Barreto',16],['Caceres',16],['Ortiz',16],['Castillo',16],['Peña',16],['Manya',16],['Bolso',16],['Fagundez',16],['Soria',16],['Vidal',16],['Lemos',16],
            ['Moreno',16],['Santana',16],['Acuña',15],['Molina',15],['Borges',15],['Da Rosa',15],['Muñoz',15],['Dominguez',14],['Bentancor',14],['Caballero',14],
            ['Franco',14],['Montero',14],['Velázquez',14],['Carballo',14],['Fleitas',14],['Vera',14],['Godoy',14],['Gonzales',14],['Aguirre',14],['Almeida',14],
            ['Rosa',13],['Paz',13],['Britos',13],['Quintana',13],['Bonilla',13],['Vargas',13],['Cuello',13],['Ríos',13],['Guerra',13],['Miranda',13],['Vega',13],
            ['Rojas',13],['Herrera',13],['Antunez',13],['Maciel',13],['Farias',12],['Cruz',12],['Muniz',12],['Sena',12],['Caraballo',12],['Arias',12],
            ['Umpierrez',12],['Tejera',12],['Souza',12],['Peñarol',12],['Rey',12],['Rosas',12],['Peralta',12],['Alves',12],['Leal',12],['Batista',12],
            ['Aguilar',12],['Furtado',11],['Aguiar',11],['Fuentes',11],['Leites',11],['Corbo',11],['Melo',11],['Maldonado',11],['Acevedo',11],['Camejo',11],
            ['Ribeiro',11],['Bueno',11]
          ] }
    ] },

    // ── VEN ──
    VEN: { regions: [
        { w: 1,
          first: {
            early: [
              ['José',4],['Luis',4],['Carlos',4],['Rafael',3],['Miguel',3],['Jesús',3],['Alejandro',3],['Ricardo',3],['Pedro',2],['Ramón',2]
            ],
            mid: [
              ['José',4],['Luis',4],['Carlos',3],['Alejandro',3],['Rafael',3],['Ernesto',2],['Óscar',2],['Enrique',2],['Johnny',1],['Giancarlo',1]
            ],
            modern: [
              ['Sebastián',3],['Santiago',3],['Diego',3],['Gabriel',3],['Daniel',3],['Samuel',2],['Adrián',2],['Jesús',2],['Andrés',2],['Manuel',2]
            ]
          },
          last: [
            ['González',4],['Rodríguez',4],['García',4],['Pérez',3],['Hernández',3],['Martínez',3],['Rojas',3],['Blanco',2],['Salazar',2],['Medina',2],['Rivas',2],
            ['Mendoza',2],['Chacón',1],['Torrealba',1]
          ] }
    ] },

    // ── COL ──
    COL: { regions: [
        { w: 1,
          first: {
            early: [
              ['Juan',4],['Carlos',4],['José',4],['Ricardo',3],['Andrés',3],['Óscar',3],['Roberto',2],['Germán',2],['Álvaro',2],['Camilo',3]
            ],
            mid: [
              ['Andrés',100],['Juan',90],['Carlos',90],['José',87],['Luis',78],['Jorge',62],['David',59],['Diego',58],['Camilo',57],['Cristian',53],['Alejandro',53],
              ['Óscar',51],['Javier',50],['Miguel',47],['Fernando',46],['Julián',45],['Mauricio',41],['Jairo',39],['William',39],['Juan Pablo',26],['Daniel',64],
              ['Sebastián',58],['Jhon',55],['Santiago',55],['Alexander',47],['Jesús',42],['Manuel',40],['Alex',39],['Felipe',39],['Jaime',39],['Juan Carlos',39],
              ['Edwin',38],['Víctor',37],['César',37],['Fabián',37],['Pedro',36],['Wilson',36],['Brayan',35],['Ricardo',35],['Alvaro',35],['Nicolás',34],
              ['Nelson',34],['Kevin',34],['Gustavo',33],['Sergio',32],['Rafael',32],['Eduardo',32],['Orlando',32],['Héctor',32],['Leonardo',31],['Alberto',31],
              ['Esteban',31],['Iván',31],['Julio',30],['Mario',30],['Edgar',30],['Juan David',30],['Omar',30],['Antonio',29],['Samuel',28],['German',28],['Fredy',28],
              ['Johan',27],['John',27],['Francisco',27],['Gabriel',27],['Henry',27],['Ángel',26],['Guillermo',26],['Yeison',26],['Jhonatan',26],['Pablo',25],
              ['Anderson',25],['Stiven',25],['Jonathan',24],['Jhon Jairo',24],['Fabio',24],['Hernan',23],['Mateo',23],['Alfonso',23],['Luis Fernando',23],
              ['José Luis',23],['Andres Felipe',23],['Hernando',23],['Armando',22],['Rodrigo',22],['Wilmer',22],['Juan Camilo',22],['Alexis',22],['Miguel Ángel',21],
              ['Raúl',21],['Duvan',21],['Dario',21],['Hugo',21],['Alfredo',20],['Juan Jose',20],['Carlos Alberto',20],['Robinson',20],['Humberto',20],['Albeiro',20],
              ['Luis Alberto',20],['Elkin',20],['Rubén',20],['Luis Carlos',20],['Maicol',19],['Roberto',19],['Enrique',19],['Ferney',19],['Luis Eduardo',19],
              ['Alejo',19],['Carlos Andres',19],['Steven',19],['Yesid',19],['Edison',18],['Marlon',18],['Jeison',18],['Edinson',18],['Martín',18],['Adrián',18],
              ['Ramiro',17],['Freddy',17],['Harold',17],['Gerardo',17],['Arley',17],['Jair',17],['Nestor',17],['James',17],['Sebas',17],['Walter',16],
              ['Juan Diego',16],['Jhoan',16],['Danilo',16],['Milton',16],['Junior',16],['Julio Cesar',16],['Gilberto',16],['Marcos',16],['Arturo',16],['Richard',16],
              ['Juan Manuel',16]
            ],
            modern: [
              ['Sebastián',45],['Santiago',45],['Nicolás',26],['Daniel',26],['Mateo',26],['Samuel',12],['Tomás',12],['Alejandro',26],['David',26],['Emiliano',12],
              ['Jhon',14],['Alexander',14],['Jesús',14],['Manuel',14],['Alex',14],['Felipe',14],['Jaime',14],['Juan Carlos',14],['Edwin',14],['Víctor',14],
              ['César',14],['Fabián',14],['Pedro',14],['Wilson',14],['Brayan',14],['Ricardo',14],['Alvaro',14],['Nelson',14],['Kevin',14],['Gustavo',14],
              ['Sergio',14],['Rafael',14],['Eduardo',14],['Orlando',14],['Héctor',14],['Leonardo',14],['Alberto',14],['Esteban',14],['Iván',14],['Julio',14],
              ['Mario',14],['Edgar',14],['Juan David',14],['Omar',14],['Antonio',14],['German',14],['Fredy',14],['Johan',14],['John',14],['Francisco',14],
              ['Gabriel',14],['Henry',14],['Ángel',14],['Guillermo',14],['Yeison',14],['Jhonatan',14],['Pablo',14],['Anderson',14],['Stiven',14],['Jonathan',14],
              ['Jhon Jairo',14],['Fabio',14],['Hernan',14],['Alfonso',14]
            ]
          },
          last: [
            ['Rodríguez',100],['López',88],['Gómez',85],['Martínez',84],['García',81],['Pérez',77],['Sánchez',76],['Hernández',75],['González',75],['Ramírez',72],
            ['Díaz',67],['Torres',62],['Rojas',58],['Moreno',55],['Vargas',54],['Muñoz',53],['Ortiz',52],['Castro',51],['Valencia',47],['Quintero',46],
            ['Jiménez',52],['Ruiz',46],['Romero',45],['Gutiérrez',51],['Morales',45],['Restrepo',38],['Ospina',32],['Montoya',35],['Álvarez',47],['Suárez',47],
            ['Herrera',44],['Giraldo',41],['Castillo',41],['Arias',39],['Rivera',39],['Cardona',38],['Cárdenas',38],['Marin',37],['Zapata',37],['Medina',37],
            ['Osorio',37],['Mendoza',36],['Peña',36],['Parra',36],['Guerrero',36],['Salazar',35],['Mejía',35],['Florez',34],['Guzmán',34],['Jaramillo',34],
            ['Rincón',33],['Mosquera',33],['Acosta',33],['Londoño',32],['Correa',32],['Reyes',32],['Cruz',32],['Ramos',32],['Molina',32],['Fernández',32],
            ['Cortés',32],['Ortega',32],['Garzon',31],['Mora',31],['Escobar',31],['Vásquez',30],['Contreras',30],['Ríos',30],['Velásquez',30],['Agudelo',30],
            ['Sierra',29],['Méndez',29],['Castañeda',28],['Lozano',28],['Silva',28],['Henao',28],['Gonzales',28],['Castaño',28],['Orozco',28],['Caicedo',28],
            ['Arango',27],['Beltran',27],['Hurtado',27],['Velez',27],['León',27],['Delgado',27],['Vega',27],['Franco',26],['Bedoya',26],['Bernal',26],['Pineda',26],
            ['Carvajal',26],['Murillo',26],['Calderon',25],['Acevedo',25],['Trujillo',25],['Soto',24],['Patiño',24],['Avila',24],['Duque',24],['Cano',24],
            ['Buitrago',24],['Vanegas',23],['Sandoval',23],['Barrera',23],['Aguirre',23],['Duarte',23],['Gallego',23],['Forero',23],['Camacho',23],['Gil',22],
            ['Durán',22],['Palacios',22],['Vergara',22],['Cordoba',22],['Padilla',22],['Zambrano',22],['Villa',22],['Sarmiento',22],['Carrillo',21],['Uribe',21],
            ['Hoyos',21],['Ocampo',21],['Navarro',21],['Daza',21],['Tovar',21],['Pacheco',21],['Benavides',21],['Toro',21],['Amaya',21],['Ochoa',21],['Paez',21],
            ['Bermudez',21],['Blanco',21],['Narvaez',21],['Serna',21],['Espinosa',20],['Camargo',20],['Palacio',20],['Alzate',20],['Bonilla',20],['Ariza',20],
            ['Pinzon',20],['Barrios',20],['Perdomo',20],['Montes',20],['Ardila',20],['Gaviria',20],['Castellanos',20],['Cifuentes',19],['Niño',19],['Galvis',19],
            ['Monsalve',19],['Mesa',19],['Arboleda',19],['Aguilar',19],['Rueda',19],['Zuluaga',19],['Andrés',19],['Estrada',19],['Luna',19],['Guerra',19],
            ['Guevara',19],['Arenas',19],['Fonseca',18],['Meneses',18],['Ordoñez',18],['Arevalo',18],['Pulido',18],['Fuentes',18],['Márquez',18],['Ayala',18],
            ['Loaiza',18],['Velasco',18],['Galindo',18],['Jaimes',18],['Andrade',18],['Miranda',18],['Solano',18],['Betancur',18],['Prieto',18],['Sepulveda',17],
            ['Salcedo',17],['Cabrera',17],['Murcia',17],['Angulo',17],['Mercado',17],['Galeano',17],['Pardo',17],['Bolaños',17],['Alvarado',17],['Arrieta',17],
            ['Sanabria',17],['Núñez',17],['Figueroa',17],['Becerra',17],['Roa',17],['Serrano',17],['Carmona',17],['Villegas',17],['Rivas',17],['Bautista',17],
            ['Vera',17],['Triana',17],['Maldonado',17],['Villamizar',17],['Pinto',17],['Santos',17]
          ] }
    ] },

    // ── RUS ──
    RUS: { regions: [
        { w: 1,
          first: {
            early: [
              ['Sergei',4],['Vladimir',4],['Andrei',4],['Nikolai',3],['Viktor',3],['Yuri',3],['Boris',2],['Oleg',3],['Igor',3],['Mikhail',4]
            ],
            mid: [
              ['Alexander',100],['Sergei',99],['Andrei',83],['Alexei',82],['Dmitri',73],['Evgeni',61],['Vladimir',60],['Maxim',54],['Ivan',55],['Igor',49],
              ['Nikolai',47],['Denis',50],['Mikhail',45],['Oleg',45],['Roman',45],['Pavel',43],['Anton',41],['Vitali',33],['Ruslan',40],['Vadim',31],['Yuri',38],
              ['Viktor',38],['Artem',47],['Kirill',36],['Konstantin',30],['Vlad',29],['Egor',28],['Artur',28],['Vyacheslav',27],['Anatoli',27],['Danil',25],
              ['Vasili',25],['Valeri',25],['Vladislav',24],['Maks',23],['Alex',23],['Timur',22],['Alexandr',22],['Daniil',22],['Magomed',20],['Rustam',20],
              ['Petr',19],['Stanislav',18],['Marat',18],['Ali',18],['Eduard',17],['Boris',16],['Stas',16],['Leonid',16],['Islam',15],['Shamil',15],['Aleks',15],
              ['Gennadii',15],['Albert',14],['Yaroslav',14],['Semen',14],['Georgi',13],['David',13],['Grigori',13],['Fedor',13],['Stepan',13],['Arsen',13],
              ['Murad',13],['Max',12],['Valentin',12],['Aslan',12],['Rinat',12],['Gleb',12],['Adam',12],['Azamat',11],['Akhmed',11],['Mark',11],['Ildar',11],
              ['Said',11],['Ramil',11],['Rasul',11],['Alik',10],['Amir',10],['Damir',10],['Bogdan',10],['Mihail',10],['Matvei',10],['Armen',10],['Den',9],['Murat',9],
              ['Ibragim',9],['Andrew',9],['Timofei',9],['Lev',9],['Zaur',9],['Renat',9],['Ramazan',8],['Alisher',8],['Robert',8],['Karen',8],['Muslim',8],['Nik',8],
              ['Umar',8],['Arsenii',8],['Mansur',8],['Aziz',8],['Radik',8],['Arkadii',8],['Mukhammad',8],['Vitalik',7],['Anvar',7],['Alan',7],['Eldar',7],
              ['Victor',7],['Ilyas',7],['Ilnur',7],['Aidar',7],['Arman',7],['Kamil',7],['Airat',7],['Rashid',7],['Yan',7],['Bek',7],['Artyom',7],['Almaz',7],
              ['Azat',7],['Edik',6],['Zakhar',6],['Evgen',6],['Marsel',6],['German',6],['Bulat',6],['Sherzod',6],['Emil',6],['Michael',6],['Khasan',6],['Nail',6],
              ['Dinar',6],['Abdul',6],['Ismail',6],['Eugene',6],['Gadzhi',6],['Rodion',6],['Muhammad',6],['Serzh',6],['Vasily',5],['John',5]
            ],
            modern: [
              ['Artem',45],['Maxim',45],['Ivan',45],['Alexander',45],['Kirill',26],['Nikita',26],['Egor',26],['Roman',26],['Ilya',26],['Timur',12],['Matvei',12],
              ['Fedor',12],['Daniil',12],['Konstantin',14],['Vlad',14],['Artur',14],['Vyacheslav',14],['Anatoli',14],['Danil',14],['Vasili',14],['Valeri',14],
              ['Vladislav',14],['Maks',14],['Alex',14],['Alexandr',14],['Magomed',14],['Rustam',14],['Petr',14],['Stanislav',14],['Marat',14],['Ali',14],
              ['Eduard',14],['Boris',14],['Stas',14],['Leonid',14],['Islam',14],['Shamil',14],['Aleks',14],['Gennadii',14],['Albert',14],['Yaroslav',14],['Semen',14],
              ['Georgi',13],['David',13],['Grigori',13],['Stepan',13],['Arsen',13],['Murad',13],['Max',12],['Valentin',12],['Aslan',12],['Rinat',12],['Gleb',12],
              ['Adam',12],['Azamat',11],['Akhmed',11],['Mark',11],['Ildar',11],['Said',11],['Ramil',11],['Rasul',11],['Alik',10],['Amir',10],['Damir',10],
              ['Bogdan',10],['Mihail',10]
            ]
          },
          last: [
            ['Ivanov',100],['Smirnov',48],['Kuznetsov',49],['Popov',47],['Petrov',62],['Vasiliev',45],['Sokolov',29],['Volkov',38],['Novikov',29],['Morozov',29],
            ['Lebedev',22],['Kozlov',25],['Pavlov',30],['Orlov',25],['Fedorov',30],['Andreev',31],['Alekseev',29],['Makarov',28],['Nikitin',25],['Zaitsev',25],
            ['Sidorov',21],['Egorov',28],['Belov',23],['Semenov',31],['Sergeev',30],['Mikhailov',30],['Romanov',29],['Nikolaev',28],['Stepanov',27],['Zakharov',26],
            ['Grigoryan',26],['Alexander',25],['Kot',25],['Maksimov',25],['Isaev',24],['Yakovlev',24],['Aleksandrov',24],['Grigoriev',23],['Frolov',23],
            ['Nazarov',23],['Borisov',23],['Antonov',23],['Kuzmin',22],['Dmitriev',22],['Medvedev',21],['Mironov',21],['Tarasov',21],['Zhukov',21],
            ['Vladimirovna',20],['Matveev',20],['Melnikov',20],['Gasanov',20],['Sorokin',20],['Olga',20],['Sharipov',20],['Savchenko',20],['Filippov',19],
            ['Ilin',19],['Polyakov',19],['Danilov',19],['Boiko',19],['Ismailov',19],['Solovev',19],['Bogdanov',19],['Vlasov',19],['Kotov',19],['Chernov',19],
            ['Denisov',19],['Marchenko',19],['Musaev',19],['Andrei',19],['Fomin',19],['Ramazanov',19],['Karpov',19],['Dmitri',19],['Gusev',19],['Kolesnikov',19],
            ['Vorobev',18],['Khasanov',18],['Davydov',18],['Svetlana',18],['Timofeev',18],['Alexei',18],['Arutyunyan',18],['Osipov',18],['Baranov',18],
            ['Abramov',18],['Kovalev',18],['Kiselev',18],['Kulikov',18],['Goncharov',18],['Kazakov',18],['Belyi',18],['Yuliya',18],['Titov',18],['Saidov',18],
            ['Shcherbakov',17],['Guseinov',17],['Afanasev',17],['Gavrilov',17],['Chernykh',17],['Kalinin',17],['Belyaev',17],['Efimov',17],['Rakhimov',17],
            ['Fedotov',17],['Rudenko',17],['Omarov',17],['Tikhonov',16],['Gerasimov',16],['Markov',16],['Nikolaevich',16],['Ponomarev',16],['Suleimanov',16],
            ['Anastasiya',16],['Konovalov',16],['Komarov',16],['Volk',16],['Korolev',16],['Ermakov',16],['Petrenko',16],['Vladimir',16],['Efremov',16],
            ['Lysenko',16],['Martynov',16],['Maltsev',15],['Bykov',15],['Umarov',15],['Gorbunov',15],['Klimenko',15],['Naumov',15],['Pavlenko',15],['Sidorenko',15],
            ['Petrosyan',15],['Potapov',15],['Lis',15],['Romanenko',15],['Melnik',15],['Filatov',15],['Evgeni',15],['Nikolaevna',15],['Mariya',15],['Trofimov',15],
            ['Vasilenko',15],['Krylov',15],['Gromov',15],['Kirillov',15],['Ovchinnikov',15],['Sultanov',15],['Khachatryan',15],['Zhuravlev',15],['Akopyan',15],
            ['Emelyanov',15],['Savelev',15],['Nevazhno',15],['Klimov',15],['Nikiforov',15],['Levchenko',14],['Makhmudov',14],['Karpenko',14],['Viktorovna',14],
            ['Vinogradov',14],['Lazarev',14],['Knyazev',14],['Viktorovich',14],['Pupkin',14],['Maslov',14],['Voronin',14],['Anisimov',14],['Safarov',14],
            ['Fomenko',14],['Khakimov',14],['Arkhipov',14],['Andreevna',14],['Kalashnikov',14]
          ] }
    ] },

    // ── POL ──
    POL: { regions: [
        { w: 1,
          first: {
            early: [
              ['Jan',4],['Andrzej',3],['Krzysztof',4],['Marek',3],['Tomasz',3],['Piotr',4],['Stanisław',2],['Zbigniew',2],['Tadeusz',2],['Ryszard',2]
            ],
            mid: [
              ['Piotr',100],['Marcin',95],['Krzysztof',90],['Paweł',86],['Tomasz',85],['Michał',85],['Łukasz',80],['Andrzej',77],['Marek',73],['Grzegorz',70],
              ['Adam',70],['Mariusz',65],['Kamil',62],['Robert',60],['Rafał',59],['Jacek',56],['Maciej',54],['Damian',52],['Artur',51],['Dariusz',50],
              ['Sebastian',49],['Dawid',56],['Mateusz',77],['Jan',49],['Jakub',49],['Daniel',48],['Patryk',47],['Wojciech',46],['Karol',43],['Adrian',43],
              ['Szymon',42],['Zbigniew',41],['Janusz',41],['Bartosz',38],['Jerzy',37],['Kacper',36],['Dominik',35],['Ryszard',35],['Krystian',34],['Jarosław',33],
              ['Arkadiusz',32],['Roman',32],['Przemek',31],['Przemysław',31],['Konrad',31],['Leszek',31],['Sławomir',30],['Pawel',30],['Maciek',29],['Darek',29],
              ['Tadeusz',29],['Filip',29],['Stanisław',29],['Jarek',28],['Mirosław',28],['Bogdan',26],['Krzysiek',26],['Waldemar',26],['Michal',25],['Henryk',25],
              ['Piotrek',25],['Hubert',24],['Józef',24],['Bartłomiej',24],['Arek',23],['Marian',23],['Radosław',23],['Mikołaj',23],['Radek',23],['Rafal',22],
              ['Wiktor',22],['Wiesław',22],['Aleksander',21],['Sławek',21],['Lukasz',21],['Kazimierz',20],['Mirek',20],['Igor',19],['Oskar',18],['Sylwester',18],
              ['Ireneusz',18],['Norbert',17],['Zbyszek',17],['Edward',16],['Cezary',16],['Zdzisław',16],['Witold',16],['Stefan',15],['Bogusław',15],['Stanislaw',15],
              ['Błażej',15],['Miłosz',14],['Antoni',14],['Marcel',14],['Emil',14],['Grzesiek',13],['Eugeniusz',13],['Zygmunt',13],['Janek',13],['Zenon',13],
              ['Mieczysław',12],['Jaroslaw',12],['Miroslaw',12],['Wieslaw',12],['Slawek',11],['Czesław',11],['Włodzimierz',11],['Slawomir',11],['Eryk',11],
              ['Alan',11],['Waldek',11],['Jurek',11],['Irek',11],['Lech',10],['Remigiusz',10],['Władysław',10],['Franciszek',10],['Maks',10],['Franek',10],
              ['Oliwier',10],['Olek',10],['Albert',9],['Seweryn',9],['Przemyslaw',9],['Nikodem',9],['Maksymilian',9],['Tom',9],['Alex',9],['Fabian',9],['Gabriel',9],
              ['Zdzislaw',9],['Antek',9],['Martin',8],['Gracjan',8],['Denis',8],['Szczepan',8],['Tobiasz',8],['Bernard',8],['Witek',8],['Max',8],['Lucjan',8],
              ['Ernest',8]
            ],
            modern: [
              ['Jakub',45],['Kacper',45],['Mateusz',45],['Szymon',26],['Filip',26],['Bartosz',26],['Kamil',26],['Aleksander',26],['Antoni',26],['Wojciech',12],
              ['Jan',14],['Daniel',14],['Patryk',14],['Karol',14],['Adrian',14],['Zbigniew',14],['Janusz',14],['Jerzy',14],['Dominik',14],['Ryszard',14],
              ['Krystian',14],['Jarosław',14],['Arkadiusz',14],['Roman',14],['Przemek',14],['Przemysław',14],['Konrad',14],['Leszek',14],['Sławomir',14],['Pawel',14],
              ['Maciek',14],['Darek',14],['Tadeusz',14],['Stanisław',14],['Jarek',14],['Mirosław',14],['Bogdan',14],['Krzysiek',14],['Waldemar',14],['Michal',14],
              ['Henryk',14],['Piotrek',14],['Hubert',14],['Józef',14],['Bartłomiej',14],['Arek',14],['Marian',14],['Radosław',14],['Mikołaj',14],['Radek',14],
              ['Rafal',14],['Wiktor',14],['Wiesław',14],['Sławek',14],['Lukasz',14],['Kazimierz',14],['Mirek',14],['Igor',14],['Oskar',14],['Sylwester',14],
              ['Ireneusz',14],['Norbert',14]
            ]
          },
          last: [
            ['Nowak',100],['Kowalski',60],['Wiśniewski',35],['Wójcik',51],['Kowalczyk',51],['Kamiński',29],['Lewandowski',32],['Zieliński',33],['Szymański',27],
            ['Woźniak',47],['Dąbrowski',26],['Mazur',43],['Kaczmarek',42],['Krawczyk',40],['Wieczorek',36],['Król',35],['Zając',34],['Sikora',33],['Adamczyk',33],
            ['Dudek',33],['Wróbel',32],['Pawlak',32],['Walczak',32],['Michalak',30],['Piotrowski',25],['Grabowski',23],['Jankowski',28],['Szewczyk',30],['Wilk',30],
            ['Stępień',30],['Baran',29],['Marciniak',29],['Duda',29],['Pietrzak',29],['Lis',29],['Kot',27],['Wojciechowski',27],['Kubiak',27],['Kwiatkowski',26],
            ['Mazurek',26],['Bąk',26],['Kozłowski',26],['Włodarczyk',25],['Janik',25],['Kowal',25],['Krupa',25],['Sobczak',25],['Szulc',24],['Michalski',24],
            ['Kołodziej',24],['Marek',24],['Maj',24],['Szymczak',23],['Polak',23],['Nowakowski',23],['Kaźmierczak',23],['Kaczmarczyk',23],['Mucha',23],['Kania',23],
            ['Kowalik',23],['Kozak',23],['Szczepaniak',23],['Wawrzyniak',22],['Nowicki',22],['Mróz',22],['Jarosz',22],['Jaworski',22],['Pawłowski',22],
            ['Błaszczyk',21],['Sowa',21],['Majewski',21],['Markiewicz',21],['Urbaniak',21],['Kruk',21],['Malinowski',21],['Stankiewicz',21],['Olszewski',21],
            ['Tomczyk',21],['Pawlik',21],['Tomczak',21],['Klimek',21],['Stasiak',20],['Witkowski',20],['Mikołajczyk',20],['Kurek',20],['Bednarek',20],['Musiał',20],
            ['Tomaszewski',20],['Gajda',20],['Piątek',20],['Kasprzak',20],['Zięba',20],['Ratajczak',20],['Kołodziejczyk',20],['Jabłoński',20],['Rutkowski',19],
            ['Ostrowski',19],['Żak',19],['Cieślak',19],['Łuczak',19],['Michalik',19],['Majchrzak',19],['Skiba',19],['Górski',19],['Kozioł',19],['Olejnik',19],
            ['Konieczny',19],['Wrona',19],['Jakubowski',19],['Wójtowicz',19],['Socha',19],['Mazurkiewicz',19],['Madej',19],['Urban',18],['Olejniczak',18],
            ['Kopeć',18],['Sadowski',18],['Bednarz',18],['Zawadzki',18],['Kasprzyk',18],['Sroka',18],['Owczarek',18],['Maciejewski',18],['Leśniak',18],['Rybak',17],
            ['Bednarczyk',17],['Grzelak',17],['Borkowski',17],['Zalewski',17],['Sawicki',17],['Chmielewski',17],['Wróblewski',17],['Chmiel',17],['Czaja',17],
            ['Wysocki',17],['Jóźwiak',17],['Rak',17],['Witek',17],['Marzec',17],['Matusiak',17],['Domagała',17],['Sobczyk',17],['Pająk',17],['Kucharski',17],
            ['Kaczor',17],['Czajka',17],['Stachowiak',17],['Paluch',17],['Czarnecki',17],['Lech',16],['Czech',16],['Świątek',16],['Pluta',16],['Zych',16],
            ['Jasiński',16],['Zawada',16],['Klimczak',16],['Kalinowski',16],['Marszałek',16],['Ptak',16],['Turek',16],['Adamski',16],['Laskowski',16],
            ['Bieniek',16],['Stefaniak',16],['Marczak',16],['Banach',16],['Zakrzewski',16],['Mika',16],['Łukasik',16],['Serafin',16],['Krawiec',16],['Sikorski',16],
            ['Pietrzyk',16],['Kujawa',15],['Bartkowiak',15],['Sokołowski',15],['Skrzypczak',15],['Panek',15],['Białek',15],['Przybysz',15],['Andrzejewski',15],
            ['Makowski',15],['Augustyniak',15],['Góra',15],['Skowron',15],['Konieczna',15],['Przybylski',15],['Gil',15],['Borowski',15],['Graczyk',15],['Drozd',15],
            ['Niemiec',15],['Mielczarek',15],['Kuś',15],['Kwiecień',15],['Krajewski',15],['Nowacki',15],['Szczepański',15],['Przybyła',15],['Kos',15],['Kozieł',15],
            ['Małek',15],['Gawron',15],['Żurek',15],['Gajewski',15],['Matysiak',15]
          ] }
    ] },

    // ── CZE ──
    CZE: { regions: [
        { w: 1,
          first: {
            early: [
              ['Jan',4],['Petr',4],['Jiří',4],['Josef',3],['Václav',3],['Karel',3],['Miroslav',3],['František',2],['Zdeněk',2],['Ladislav',2]
            ],
            mid: [
              ['Petr',100],['Martin',91],['Jan',83],['Tomáš',86],['Pavel',76],['Michal',72],['Jiří',76],['David',61],['Jakub',56],['Lukáš',63],['Josef',47],
              ['Roman',47],['Milan',46],['Jaroslav',46],['Marek',45],['Radek',44],['Karel',42],['Miroslav',42],['Daniel',40],['Aleš',29],['Zdeněk',46],['Ondřej',39],
              ['Václav',38],['Filip',37],['Adam',34],['Vladimír',33],['František',31],['Patrik',28],['Ladislav',27],['Dominik',27],['Matěj',26],['Libor',25],
              ['Robert',23],['Stanislav',23],['Radim',22],['Ivan',22],['Luboš',22],['Vojtěch',22],['Mirek',20],['Richard',19],['Miloš',19],['Štěpán',19],
              ['Antonín',18],['Kamil',18],['Michael',17],['Jaromír',17],['Míra',17],['Vašek',16],['Pepa',16],['Ivo',16],['Dušan',16],['Vít',15],['Vlastimil',15],
              ['Jindřich',15],['Tom',15],['Luděk',15],['Viktor',15],['Dan',15],['Zbyněk',15],['Lubomír',15],['Miloslav',14],['Marcel',14],['Šimon',14],['Peter',13],
              ['Standa',13],['Láďa',13],['Rudolf',13],['René',13],['Matyáš',12],['Rostislav',12],['Marian',12],['Oldřich',12],['Dalibor',12],['Kryštof',11],
              ['Denis',11],['Alex',11],['Igor',10],['Robin',10],['Vladislav',10],['Fanda',10],['Štefan',10],['Bohumil',10],['Tonda',9],['Franta',9],['Radovan',9],
              ['Erik',9],['Leoš',9],['Vláďa',9],['Tadeáš',9],['Alexandr',9],['Jozef',9],['Vítek',9],['Jára',9],['Honzík',8],['Mára',8],['Vítězslav',8],['Jindra',8],
              ['Péťa',8],['Venca',8],['Jenda',8],['Eduard',8],['Rosťa',8],['Mates',8],['Andrej',8],['Emil',7],['Samuel',7],['Zdenda',7],['Hynek',7],['Matouš',7],
              ['Radomír',7],['Víťa',7],['Vasyl',7],['Luky',7],['Bohuslav',7],['Alexander',7],['Olda',7],['Max',7],['Pája',7],['Maty',7],['John',7],['Thomas',6],
              ['Vilém',6],['Jarek',6],['Ruda',6],['Sebastian',6],['Jonáš',6],['Ludvík',6],['George',6],['Otakar',6],['Tony',6],['Přemysl',6],['Vratislav',6],
              ['Dave',6],['Ota',6],['Kristian',6],['Anton',6],['Johny',6],['Boris',6],['Oliver',6],['Alois',6]
            ],
            modern: [
              ['Jakub',45],['Adam',45],['Lukáš',45],['David',45],['Ondřej',26],['Matyáš',26],['Filip',26],['Vojtěch',26],['Daniel',26],['Marek',26],['Zdeněk',14],
              ['Václav',14],['Vladimír',14],['František',14],['Patrik',14],['Ladislav',14],['Dominik',14],['Matěj',14],['Libor',14],['Robert',14],['Stanislav',14],
              ['Radim',14],['Ivan',14],['Luboš',14],['Mirek',14],['Richard',14],['Miloš',14],['Štěpán',14],['Antonín',14],['Kamil',14],['Michael',14],['Jaromír',14],
              ['Míra',14],['Vašek',14],['Pepa',14],['Ivo',14],['Dušan',14],['Vít',14],['Vlastimil',14],['Jindřich',14],['Tom',14],['Luděk',14],['Viktor',14],
              ['Dan',14],['Zbyněk',14],['Lubomír',14],['Miloslav',14],['Marcel',14],['Šimon',14],['Peter',13],['Standa',13],['Láďa',13],['Rudolf',13],['René',13],
              ['Rostislav',12],['Marian',12],['Oldřich',12],['Dalibor',12],['Kryštof',11],['Denis',11],['Alex',11],['Igor',10],['Robin',10],['Vladislav',10],
              ['Fanda',10]
            ]
          },
          last: [
            ['Novák',100],['Svoboda',71],['Novotný',72],['Dvořák',65],['Černý',58],['Procházka',53],['Kučera',47],['Veselý',48],['Horák',39],['Němec',39],
            ['Marek',44],['Pokorný',37],['Král',37],['Krejčí',41],['Hájek',36],['Pospíšil',35],['Beneš',37],['Fiala',38],['Sedláček',33],['Urban',35],['Zeman',37],
            ['Jelínek',34],['Růžička',34],['Kolář',33],['Doležal',33],['Čermák',32],['Müller',32],['Moravec',31],['Kadlec',30],['Soukup',30],['Musil',30],
            ['Kříž',30],['Malý',29],['Vaněk',29],['Holub',29],['Šimek',29],['Blažek',29],['Kratochvíl',29],['Vlček',28],['Polák',28],['Janda',28],['Štěpánek',28],
            ['Šťastný',28],['Valenta',28],['Bartoš',28],['Kopecký',28],['Navrátil',28],['Mareš',27],['Čech',27],['Mašek',27],['Staněk',27],['Mach',27],
            ['Sýkora',26],['Kovář',26],['Vacek',26],['Bláha',26],['Toman',26],['Matoušek',26],['Strnad',26],['Vávra',25],['Beran',25],['Říha',25],['Tichý',25],
            ['Havel',25],['Dostál',25],['Dušek',25],['Konečný',25],['Kraus',25],['Bureš',24],['Hruška',24],['Hrubý',24],['Prokop',24],['Kočí',24],['Liška',24],
            ['Tůma',24],['Ševčík',24],['Havlíček',24],['Kohout',23],['Richter',23],['Svobodova',23],['Němeček',23],['Bárta',23],['Pavlík',23],['Stejskal',23],
            ['Šmíd',23],['Ježek',23],['Vítek',23],['Nový',23],['Žák',23],['Filip',23],['Vlk',23],['Fišer',23],['Jaroš',22],['Kašpar',22],['Šulc',22],['Michal',22],
            ['Beránek',22],['Slavík',22],['Švec',22],['Macháček',22],['Bednář',22],['Vrba',22],['Brož',22],['Matějka',22],['Horáček',22],['Tesař',21],['Bílek',21],
            ['Pešek',21],['Volf',21],['Suchý',21],['Sedlák',21],['Zelenka',21],['Brabec',21],['Linhart',20],['Souček',20],['Adamec',20],['Klíma',20],
            ['Janoušek',20],['Kubíček',20],['Straka',20],['Janeček',20],['Tomášek',20],['Macek',20],['Turek',20],['Kozák',20],['Čížek',20],['Kubík',20],
            ['Pavelka',20],['Červenka',20],['Zapletal',19],['Pavlíček',19],['Jedlička',19],['Havelka',19],['Trnka',19],['Wolf',19],['Váňa',19],['Burian',19],
            ['Kroupa',19],['Špaček',19],['Šindelář',19],['Tomáš',19],['Holý',19],['Hrdlička',19],['Daněk',19],['Karel',19],['Urbánek',18],['Dohnal',18],
            ['Málek',18],['Gregor',18],['Janků',18],['Přibyl',18],['Lukáš',18],['Havlík',18],['Hlaváček',18],['Vlach',18],['Hladík',18],['Nosek',18],['Smetana',18],
            ['Štěpán',18],['Mrázek',18],['Stehlík',18],['Jana',18],['Majer',18],['Šíma',18],['Bauer',18],['Vesela',18],['Šrámek',18],['Jeřábek',18],['Kovařík',18],
            ['Dvorakova',18],['Švarc',18],['Krátký',18],['Martínek',18],['Dlouhý',18],['Holeček',18],['Adámek',18],['Prokeš',17],['Michálek',17],['Jiří',17],
            ['Nova',17],['Lukeš',17],['Koudelka',17],['Březina',17],['Jindra',17],['Červený',17],['Hošek',17],['Nováček',17]
          ] }
    ] },

    // ── HUN ──
    HUN: { regions: [
        { w: 1,
          first: {
            early: [
              ['László',3],['Zoltán',3],['István',3],['Ferenc',3],['János',3],['Gábor',3],['Attila',3],['Sándor',2],['József',3],['Károly',2]
            ],
            mid: [
              ['László',100],['Gábor',96],['Zoltán',96],['Attila',86],['Tamás',89],['Péter',92],['István',87],['Zsolt',75],['János',71],['Csaba',64],['Ferenc',63],
              ['József',71],['Balázs',65],['Tibor',58],['Sándor',63],['András',62],['Norbert',47],['Krisztián',49],['György',45],['Róbert',50],['Dávid',57],
              ['Ádám',57],['Dániel',51],['Bence',48],['Máté',43],['Imre',41],['Gergő',40],['Roland',38],['Ákos',38],['Gergely',38],['Márk',38],['Szabolcs',38],
              ['Lajos',37],['Bálint',36],['Miklós',36],['Gyula',35],['Viktor',35],['Béla',34],['Károly',34],['Richárd',33],['Mihály',31],['Levente',29],['Márton',28],
              ['Kristóf',27],['Kovács',26],['Martin',25],['Pál',25],['Szabó',24],['Tóth',24],['Árpád',24],['Patrik',23],['Horváth',23],['Antal',23],['Géza',22],
              ['Szilárd',20],['Alex',20],['Milán',20],['Áron',20],['Marcell',20],['Kiss',20],['Dani',19],['Barnabás',19],['Dominik',19],['Mátyás',18],['Varga',18],
              ['Erik',18],['Laci',18],['Olivér',17],['Endre',17],['Zsombor',17],['Zoli',16],['Kornél',16],['Kálmán',16],['Benjamin',16],['Molnár',15],['Dénes',15],
              ['Németh',15],['Jenő',15],['Botond',15],['Nándor',14],['Tomi',14],['Benedek',14],['Adrián',14],['Peti',14],['Ernő',13],['Balogh',13],['Marci',13],
              ['Barna',13],['Farkas',13],['Norbi',12],['Ottó',12],['Vilmos',12],['Simon',12],['Iván',11],['Kevin',11],['Dezső',11],['Andor',11],['Jani',10],
              ['Arnold',10],['Ricsi',10],['Papp',10],['Ervin',10],['Takács',10],['Bertalan',10],['Szilveszter',10],['Tibi',10],['Sanyi',10],['Soma',10],['Albert',10],
              ['Andris',10],['Ali',10],['Csongor',9],['Robi',9],['Márió',9],['Gyuri',9],['Zalán',9],['Rudolf',9],['Zsolti',9],['Fekete',9],['Ábel',9],['Juhász',9],
              ['Donát',9],['Csabi',9],['Alexander',9],['Henrik',8],['Lakatos',8],['Győző',8],['Misi',8],['Lóránt',8],['Bendegúz',8],['Józsi',8],['Domonkos',8],
              ['Vince',8],['Mészáros',8],['Feri',8],['Kis',8],['Márkó',8],['John',8],['Krisztofer',8],['Emil',7]
            ],
            modern: [
              ['Bence',45],['Máté',45],['Ádám',45],['Dávid',45],['Dániel',45],['Levente',26],['Dominik',26],['Márk',26],['Balázs',26],['Milán',12],['Zalán',12],
              ['Imre',14],['Gergő',14],['Roland',14],['Ákos',14],['Gergely',14],['Szabolcs',14],['Lajos',14],['Bálint',14],['Miklós',14],['Gyula',14],['Viktor',14],
              ['Béla',14],['Károly',14],['Richárd',14],['Mihály',14],['Márton',14],['Kristóf',14],['Kovács',14],['Martin',14],['Pál',14],['Szabó',14],['Tóth',14],
              ['Árpád',14],['Patrik',14],['Horváth',14],['Antal',14],['Géza',14],['Szilárd',14],['Alex',14],['Áron',14],['Marcell',14],['Kiss',14],['Dani',14],
              ['Barnabás',14],['Mátyás',14],['Varga',14],['Erik',14],['Laci',14],['Olivér',14],['Endre',14],['Zsombor',14],['Zoli',14],['Kornél',14],['Kálmán',14],
              ['Benjamin',14],['Molnár',14],['Dénes',14],['Németh',14],['Jenő',14],['Botond',14],['Nándor',14]
            ]
          },
          last: [
            ['Nagy',100],['Kovács',95],['Tóth',92],['Szabó',90],['Horváth',87],['Kiss',74],['Varga',70],['Molnár',60],['Németh',57],['Farkas',50],['Balogh',47],
            ['Papp',39],['Takács',40],['Juhász',37],['Simon',33],['Fekete',31],['Mészáros',31],['Bíró',26],['Lakatos',30],['Szilágyi',29],['Szűcs',29],['Rácz',29],
            ['Kis',28],['Oláh',27],['Márton',26],['Kocsis',25],['Török',25],['Fodor',24],['Magyar',24],['Gál',24],['Fehér',23],['Hegedűs',23],['Szalai',23],
            ['Antal',23],['Sipos',22],['Pintér',22],['Katona',22],['Hajdu',21],['Király',21],['Jakab',21],['Boros',21],['Somogyi',20],['Fülöp',20],['Krisztián',20],
            ['Fazekas',20],['Kelemen',20],['Krisztina',19],['Lukács',19],['Vincze',19],['Norbert',19],['Gulyás',18],['Veres',18],['Vass',18],['Orosz',18],
            ['Balog',18],['Székely',18],['Deák',18],['Lengyel',18],['Pap',18],['Budai',18],['Vörös',18],['Major',17],['Zsuzsanna',17],['Erika',17],['Miklós',17],
            ['Róbert',17],['Lajos',17],['Illés',17],['Mária',17],['Ildikó',17],['Ágnes',17],['Nemes',16],['Roland',16],['Fábián',16],['Kozma',16],['Szőke',16],
            ['Barna',16],['Váradi',16],['Halász',16],['Mihály',16],['Mónika',16],['Bognár',16],['Kerekes',16],['Virág',16],['Anita',16],['Bogdán',16],
            ['Szilvia',16],['Márk',16],['Gergő',16],['Vajda',15],['Bakos',15],['Orbán',15],['Gabriella',15],['Pásztor',15],['Soós',15],['Szabolcs',15],
            ['Viktor',15],['Szekeres',15],['Bodnár',15],['Balla',15],['Gáspár',15],['Dobos',15],['Eszter',15],['Mezei',15],['Novák',14],['Barta',14],['Pataki',14],
            ['Sebestyén',14],['Csonka',14],['Orsós',14],['Borbély',14],['Kálmán',14],['Károly',14],['Végh',14],['Erdei',14],['Demeter',14],['Faragó',14],['Kun',14],
            ['Cseh',14],['Ákos',14],['Hegyi',14],['Kertész',14],['Dudás',14],['Dóra',14],['Lőrincz',14],['Erdélyi',14],['Kardos',14],['Vida',13],['Szántó',13],
            ['Viktória',13],['Huszár',13],['Szigeti',13],['Gyula',13],['Ács',13],['Győri',13],['Szász',13],['Rózsa',13],['Anikó',13],['Schmidt',13],['Erzsébet',13],
            ['Herczeg',13],['Müller',13],['Berta',13],['Richárd',13],['Béla',13],['Szalay',12],['Lázár',12],['Alexandra',12],['Seres',12],['Melinda',12],
            ['Mátyás',12],['Ferenczi',12],['Edit',12],['Laszlo',12],['Kalmár',12],['Szegedi',12],['Baranyai',12],['Fejes',12],['Szabados',12],['Kurucz',12],
            ['Koncz',12],['Csilla',12],['Csizmadia',12],['Bódi',12],['Kulcsár',12],['Tímea',12],['Kristóf',12],['Kósa',12],['Mayer',12],['Kecskés',12],
            ['Márkus',12],['Dénes',12],['Gaál',12],['Baranyi',12],['Béres',12],['Jónás',12],['Vas',12],['Pető',11],['Dani',11],['Levente',11],['Szakács',11],
            ['Nikolett',11],['Kollár',11],['Gabor',11],['Ambrus',11],['Tünde',11],['Barbara',11],['Bartha',11],['Albert',11],['Kádár',11],['Szatmári',11],
            ['Polgár',11],['Kata',11],['Márta',11],['Berki',11],['Adrienn',11],['Császár',11],['Urbán',11]
          ] }
    ] },

    // ── IND ──
    IND: { regions: [
        { w: 0.6,
          first: [
            ['Rahul',100],['Ajay',76],['Sanjay',75],['Sunil',75],['Raj',73],['Rajesh',72],['Deepak',71],['Ravi',71],['Amit',70],['Vijay',68],['Manoj',66],
            ['Rakesh',65],['Rohit',64],['Santosh',62],['Ramesh',57],['Ashok',55],['Manish',53],['Vishal',52],['Akash',52],['Sandeep',52],['Arjun',39],['Karan',37],
            ['Vikram',30],['Aditya',32],['Imran',33],['Raju',70],['Anil',67],['Sonu',64],['Mukesh',63],['Dinesh',56],['Pankaj',53],['Suraj',53],['Mahesh',52],
            ['Sachin',50],['Vinod',48],['Ganesh',48],['Arun',47],['Prakash',47],['Abhishek',47],['Raja',46],['Kumar',46],['Krishna',45],['Sagar',45],['Ankit',44],
            ['Shubham',44],['Chandan',43],['Ashish',43],['Pawan',41],['Vikash',40],['Prince',39],['Sumit',39],['Aman',39],['Jitendra',39],['Akshay',38],
            ['Naresh',37],['Satish',37],['Sahil',37],['Vikas',37],['Yogesh',37],['Gopal',36],['Abdul',36],['Dilip',36],['Umesh',35],['Vivek',35],['Mohan',34],
            ['Arvind',34],['Vicky',34],['Bharat',34],['Gaurav',34],['Pintu',34],['Prem',33],['Mohit',33],['Pramod',33],['Sameer',33],['Nitin',32],['Bablu',32],
            ['Sunny',32],['Shivam',32],['Dipak',32],['Kamal',31],['Naveen',31],['Prashant',31],['Kamlesh',31],['Jay',30],['Mahendra',30],['Nilesh',30],
            ['Shankar',30],['Mohammad',30],['Govind',30],['Praveen',29],['Nikhil',29],['Rajkumar',29],['Sandip',29],['Ajit',29],['Dharmendra',29],['Monu',29],
            ['Babu',29],['Vinay',28],['Harish',28],['Pappu',28],['Ranjeet',28],['Salman',28],['Shiva',28],['Pravin',28],['Rajendra',28]
          ],
          last: [
            ['Kumar',100],['Singh',64],['Sharma',44],['Khan',52],['Yadav',42],['Patel',37],['Das',34],['Gupta',27],['Thakur',24],['Verma',20],['Mehta',9],
            ['Joshi',10],['Ali',26],['Ansari',24],['Mishra',18],['Chauhan',19],['Choudhary',16],['Rana',15],['Kapoor',5],['Malhotra',4],['Bhatia',4],['Raj',30],
            ['Roy',24],['Rajput',22],['Shaikh',21],['Sahu',18],['Alam',17],['Parmar',15],['Mondal',15],['Pandey',15],['Pal',15],['Shah',15],['Saini',15],['Ram',14],
            ['Jain',14],['Prajapati',14],['Rathod',14],['Tiwari',14],['Soni',13],['Sarkar',13],['Mandal',13],['Malik',13],['Ahmad',13],['Meena',12],['Solanki',12],
            ['Chaudhary',12],['Hussain',12],['Jadhav',12],['Ghosh',12],['Jha',12],['Pawar',12],['Bhai',12],['Islam',12],['Devi',12],['Prasad',12],['Raja',11],
            ['Kashyap',11],['Saha',11],['Biswas',11],['Rawat',11],['Behera',11],['Pradhan',11],['Thakor',11],['Ray',11],['Sahoo',11],['Rai',10],['Babu',10],
            ['Paul',10],['Nath',10],['Naik',10],['Sinha',10],['Jaiswal',10],['Shinde',10],['Dey',10],['Dutta',9],['Rathore',9],['Agarwal',9],['Paswan',9],
            ['Barman',9],['Gurjar',9],['Lal',9],['Sah',9],['Kushwaha',9],['Pandit',9],['Chouhan',9],['Shukla',9],['Prakash',9],['Sen',9],['Goswami',8],['Pathan',8],
            ['Raju',8],['Chavan',8],['Dubey',8],['Gogoi',8],['Chaudhari',8],['Kamble',8],['Qureshi',8],['Rani',8],['Maurya',8],['Gautam',8],['Vishwakarma',8],
            ['Mali',8],['Bhardwaj',8],['Panchal',8],['Rahman',7],['Sheikh',7],['Mahato',7],['King',7],['Mahto',7],['More',7],['Kalita',7],['Chakraborty',7],
            ['Vijay',7],['Patra',7],['Giri',7],['Debnath',7],['Gaikwad',7],['Pathak',7],['Sagar',7],['Uddin',7],['Agrawal',7],['Ravi',7],['Negi',7],['Desai',7],
            ['Raza',7],['Nishad',7],['Kumawat',7],['Mani',7],['Vasava',7],['Ranjan',7],['Shaw',7],['Krishna',7],['Chand',7],['Kaur',7],['Sahani',7],['Deka',7],
            ['Sonu',7]
          ] },
        { w: 0.4,
          first: [
            ['Arjun',39],['Karthik',18],['Vijay',68],['Ashwin',26],['Anand',35],['Suresh',56],['Pradeep',39],['Hari',25],['Kiran',30],['Ram',47]
          ],
          last: [
            ['Reddy',11],['Nair',26],['Menon',26],['Rao',8],['Iyer',12],['Krishnan',12],['Subramaniam',12],['Pillai',12],['Naidu',4],['Karthikeyan',2],['Patil',20],
            ['Nayak',14],['Gowda',8],['Varma',7]
          ] }
    ] },

    // ── ISR ──
    ISR: { regions: [
        { w: 1,
          first: {
            early: [
              ['David',4],['Moshe',3],['Yossi',3],['Avi',3],['Dan',3],['Uri',3],['Gil',2],['Eyal',2],['Ronen',2],['Chanoch',1]
            ],
            mid: [
              ['David',100],['Daniel',99],['Avi',85],['Moshe',77],['Yossi',61],['Eli',69],['Guy',74],['Lior',68],['Roy',46],['Tomer',67],['Alon',62],['Eyal',61],
              ['Oren',48],['Nir',59],['Michael',78],['Alex',72],['Tal',68],['Amit',65],['Omer',65],['Idan',61],['Yuval',61],['Rami',59],['Shay',59],['Ben',59],
              ['Adam',58],['Ron',57],['Ido',56],['Noam',55],['Matan',55],['Itay',54],['Gal',54],['Abed',53],['Khaled',52],['Ori',52],['Yaniv',51],['Asaf',51],
              ['Ariel',50],['Abo',50],['Elad',50],['Dor',50],['Abu',50],['Shlomi',50],['Omri',50],['Ameer',50],['Haim',50],['Alaa',49],['Yosef',48],['Eran',47],
              ['Nadav',47],['Ilan',47],['Dan',47],['Igor',47],['Maor',46],['Gil',45],['Meir',45],['Aviv',45],['Kobi',45],['Yair',44],['Bar',43],['Fadi',43],
              ['Ofir',43],['Yoav',43],['Ran',43],['Boris',42],['Sami',42],['Yonatan',42],['Samer',42],['Ofer',42],['Israel',41],['Shai',41],['Ronen',41],
              ['Shahar',41],['Adi',41],['Shimon',41],['Yaron',40],['Erez',39],['Amer',39],['Alexander',39],['Yosi',39],['Doron',39],['Uri',39],['Vladimir',39],
              ['Itzik',38],['Yoni',38],['Anas',38],['Dima',38],['Tom',38],['Osama',37],['Moti',37],['Mhmd',36],['Sergey',36],['Yazan',36],['Oleg',36],['Shlomo',36]
            ],
            modern: [
              ['Daniel',45],['Ariel',26],['Itay',26],['Noam',26],['Omer',26],['Yonatan',26],['Roy',26],['Tomer',26],['Ido',12],['Alon',12],['Michael',14],['Alex',14],
              ['Tal',14],['Amit',14],['Idan',14],['Yuval',14],['Rami',14],['Shay',14],['Ben',14],['Adam',14],['Ron',14],['Matan',14],['Gal',14],['Abed',14],
              ['Khaled',14],['Ori',14],['Yaniv',14],['Asaf',14],['Abo',14],['Elad',14],['Dor',14],['Abu',14],['Shlomi',14],['Omri',14],['Ameer',14],['Haim',14],
              ['Alaa',14],['Yosef',14],['Eran',14],['Nadav',14],['Ilan',14],['Dan',14],['Igor',14],['Maor',14],['Gil',14]
            ]
          },
          last: [
            ['Cohen',100],['Levi',57],['Levy',44],['Mizrahi',29],['Peretz',27],['Friedman',14],['Katz',25],['Biton',27],['Dahan',30],['Avraham',24],['Azoulay',12],
            ['Amar',27],['Ohayon',21],['Shapiro',12],['Ben-David',12],['Malka',25],['Ohana',19],['Nissany',2],['Bar',26],['Tal',26],['Yosef',24],['Mor',24],
            ['Vaknin',23],['Golan',23],['Hadad',23],['Levin',21],['Azulay',20],['Shalom',20],['Edri',20],['Alon',20],['Segal',19],['Gabay',19],['Hazan',19],
            ['Elbaz',19],['Aharon',19],['Dayan',18],['Chen',18],['Gal',18],['Shemesh',18],['Ashkenazi',18],['Salem',17],['Raz',17],['Zohar',17],['Lev',17],
            ['Yousef',17],['Shitrit',17],['Naser',17],['Salman',17],['Ben David',17],['Harel',17],['Shaheen',17],['Koren',17],['Maman',17],['Lavi',17],
            ['Sharon',17],['Sabag',17],['Hasan',17],['Diab',17],['Amir',16],['Issa',16],['Shapira',16],['Weiss',16],['Ezra',16],['Haim',16],['Haj',16],['Klein',16],
            ['Oren',16],['Khaled',16],['Barak',16],['Bader',16],['Shalev',16],['Feldman',16],['Solomon',16],['Rubin',16],['Khatib',15],['Pérez',15],['Atias',15],
            ['Baruch',15],['Schwartz',15],['Ziv',15],['Assi',15],['Nasser',15],['Bitton',15],['Mohamad',15],['Meir',15],['Hamad',15],['Fridman',15],['Masri',15],
            ['Shahar',15],['Mousa',15],['Davidov',15],['Elias',15],['Eliyahu',15],['Kadosh',14],['Sela',14],['Peled',14],['Jamal',14],['Younis',14],['Dadon',14],
            ['Saad',14],['Najjar',14],['Kaplan',14],['Sharabi',14],['Mizrachi',14],['Awwad',14],['Halabi',14],['Amsalem',14],['Abramov',14],['Israeli',14],
            ['Goldberg',14],['Turgeman',14],['Nahum',14],['Peleg',14],['Ovadia',14],['Samara',14],['Hamed',14],['Sasson',14],['Hen',14],['Bachar',14],['Abu',13],
            ['Amro',13],['Nagar',13],['Shaked',13],['Keren',13],['Kogan',13],['Goldstein',13],['Hammad',13],['Kabha',13],['Segev',13],['Aviv',13],['Dagan',13],
            ['Maimon',13],['Yehuda',13],['Miller',13],['Shmuel',13],['Paz',13],['Morad',13],['Ron',13]
          ] }
    ] },

    // ── THA ──
    THA: { regions: [
        { w: 1,
          first: [
            ['Somchai',3],['Nattapong',2],['Thanapat',2],['Chai',2],['Anan',2],['Prasit',2],['Kittipol',1],['Pasin',1],['Chayapol',1],['Niran',1],['Alex',1],
            ['Sandy',1],['Somsak',2],['Sompong',2],['Prasert',2],['Suchart',2],['Wichai',2],['Narong',2],['Manop',2],['Anucha',2],['Chaiwat',2],['Sakda',2],
            ['Sombat',2],['Thawatchai',2],['Wirot',1],['Kriangkrai',1],['Suthep',1],['Boonmee',1],['Kamon',1],['Teerapat',1],['Thanawat',1],['Sarawut',1]
          ],
          last: [
            ['Srisawat',2],['Chaiyasit',2],['Rattanakul',2],['Charoensuk',2],['Wongsawat',2],['Sukhum',1],['Kasemsarn',1],['Phromsawan',1],['Bhirombhakdi',1],
            ['Vorachart',1],['Yoovidhya',1],['Srivaddhanaprabha',1],['Kittikachorn',1],['Sathienthirakul',1],['Suksawat',1],['Jaroensuk',1],['Boonsong',1],
            ['Thongsuk',1],['Chaiprasit',1],['Ruangroj',1],['Saengchan',1],['Prasertsri',1],['Wattanakul',1],['Siriwan',1],['Klomchit',1]
          ] }
    ] },

    // ── MAR ──
    MAR: { regions: [
        { w: 1,
          first: [
            ['Mohammed',4],['Ahmed',3],['Hassan',3],['Karim',3],['Youssef',3],['Omar',3],['Mehdi',3],['Rachid',2],['Samir',2],['Driss',1],['Amine',2],['Hamza',2],
            ['Anas',2],['Zakaria',2],['Ayoub',2],['Bilal',2],['Ilyas',2],['Reda',2],['Othmane',2],['Soufiane',2],['Nabil',1],['Tarik',1],['Hicham',1],
            ['Abdellah',1],['Yassine',2],['Walid',1],['Khalid',1],['Adil',1],['Mounir',1],['Fouad',1]
          ],
          last: [
            ['Alaoui',100],['Benani',47],['El Fassi',12],['Tazi',85],['Benjelloun',12],['El Amrani',31],['Berrada',44],['Idrissi',82],['Alami',83],['Chraibi',2],
            ['Ouazzani',2],['Ayoub',81],['Hamza',80],['Hicham',79],['Khalid',78],['Amin',75],['Hamid',70],['Yassine',70],['Rifi',69],['Tanjawi',69],['Brahim',68],
            ['Madrid',68],['Jamal',63],['Zahra',62],['Tanger',62],['Tahiri',61],['Sara',61],['Salma',61],['Rayan',61],['Maroc',58],['Mohammed',58],['Adil',57],
            ['Amal',57],['Abdou',56],['Yassin',56],['Rami',56],['Naji',56],['Fes',56],['Saad',55],['Male',55],['Mohamad',54],['Salhi',54],['Ahmad',54],['Sabir',52],
            ['Salah',52],['Aya',52],['Ddg',52],['Nada',52],['Amrani',52],['Bilal',52],['Rida',51],['Samir',51],['Hiba',51],['Farah',51],['Yahya',50],['Amir',50],
            ['Casa',50],['Bennani',50],['Saidi',50],['Nador',50],['Soso',50],['Jawad',50],['Chakir',49],['Anas',49],['Nabil',49],['Oujda',49],['Zaki',49],
            ['Flour',48],['Hajar',48],['Mehdi',48],['Rajawiya',47],['Zwina',47],['Filali',47],['Imane',47],['Mustapha',47],['Sami',47],['Amira',46],['Dahbi',46],
            ['Anwar',46],['Rif',46],['Khalil',46],['Madridi',45],['Sarita',45],['Zizo',45],['Amina',45],['Maryam',45],['Hanan',45],['Reda',45],['Driss',45],
            ['Solo',44],['Walid',44],['Koko',44],['Sabri',44],['Alawi',44],['Salim',44],['Hafid',44],['Achraf',43],['Slimani',42],['Tarik',42],['Ait',42],
            ['Radi',42],['Zakaria',42],['El Idrissi',42],['Kawtar',42],['Karam',42],['Daoudi',41],['Siham',41],['Fathi',41],['Hakim',41],['Marwa',41],['Bnani',41],
            ['Bel',40],['Amazigh',40],['Oussama',40],['Bakkali',40],['Morad',40],['Ismail',40],['Jalal',40],['Hajji',40],['Rca',39],['Talbi',39],['Mostafa',39],
            ['Abdellah',39],['Sahara',39],['Nizar',39],['Bou',39],['Ahlam',39],['Ayman',38],['Houda',38],['Moha',38],['Nouri',38]
          ] }
    ] },

    // ── MAS ──
    MAS: { regions: [
        { w: 0.55,
          first: [
            ['Ahmad',65],['Hafiz',28],['Danial',17],['Khairul',41],['Amirul',37],['Aiman',30],['Syafiq',22],['Nabil',11],['Faris',16],['Amir',34],['Azlan',19],
            ['Izzat',13],['Muhammad',100],['Mat',33],['Zul',31],['Adam',31],['John',30],['Putra',27],['Shah',27],['Ismail',27],['Ali',27],['Saiful',26],
            ['Firdaus',26],['Azman',26],['David',26],['Man',25],['Sam',25],['Faizal',24],['Jack',24],['Jason',23],['Shahrul',23],['Azmi',23],['Syed',23],['Abu',22],
            ['Andy',22],['Afiq',22],['Alif',22],['Nur',22],['Steven',22],['Faiz',22],['James',21],['Arif',21],['Joe',21],['Raja',21],['Kelvin',21],['Kamal',21],
            ['Peter',21],['Rosli',21],['Azhar',21],['Amin',20],['Michael',20],['Eric',20],['Vincent',20],['Abdullah',20],['Nik',20],['Alan',20],['Roslan',20],
            ['Din',19],['Rizal',19],['Anuar',19],['Zulkifli',19],['Akmal',19],['Jimmy',19],['Nizam',19],['Kenny',19],['Haziq',18],['Ibrahim',18],['Alvin',18],
            ['Irfan',18],['Nor',18],['Abd',18],['Pak',18],['William',18],['Adi',17],['Zainal',17],['Ken',17],['Zack',17],['Suhaimi',17],['Sham',17],['Simon',17],
            ['Danny',17],['Lan',17],['Nazri',16],['Aidil',16]
          ],
          last: [
            ['Ismail',71],['Hassan',42],['Abdullah',62],['Rahman',42],['Ibrahim',50],['Othman',41],['Aziz',41],['Yusof',37],['Omar',35],['Zainal',27],['Hashim',38],
            ['Salleh',32],['Mohamad',39],['Man',39],['Zakaria',36],['Ramli',34],['Din',34],['Nizam',32],['Azmi',30],['Sulaiman',30],['Aiman',29],['Firdaus',29],
            ['Rahim',29],['Hakim',29],['Hafiz',29],['Ishak',28],['Anuar',27],['Harun',27],['Azman',27],['Yusoff',27],['Hamzah',27],['Osman',27],['Teh',27],
            ['Chen',26],['Abu Bakar',26],['Hasan',26],['Razak',25],['Idris',25],['Lan',25],['Rosli',25],['Nasir',25],['Nordin',25],['Lin',25],['Daud',25],
            ['Awang',24],['Jaafar',24],['Razali',24],['Amir',24],['Halim',24],['Mat',24],['Azhar',24],['Nor',23],['Teoh',23],['Putra',23],['Hussin',23],
            ['Yahya',23],['Saad',23],['Hong',23],['Alias',23],['Ain',22],['Musa',22],['Ariffin',22],['Bakar',22],['Haikal',22],['Zulkifli',22],['Hossain',22],
            ['Sam',22],['Wahab',21],['Zul',21],['Cheong',21],['Roslan',21],['Rizal',21],['Mamat',21],['Arif',21],['Akmal',20],['Nur',20],['Wei',20],['Syafiq',20],
            ['Wati',20],['Faiz',20],['John',20],['Faizal',20],['Mansor',20],['Noor',20],['Min',20],['Fauzi',19],['Hakimi',19],['Yan',19],['Joe',19],['Ghazali',19],
            ['Aisyah',19],['Ina',19],['Danial',19],['Iman',19],['Isa',19],['Muhamad',19]
          ] },
        { w: 0.45,
          first: [
            ['Alex',29],['Daniel',25],['Kevin',15],['Marcus',10],['Adrian',12],['Nicholas',14],['Wei Ming',12],['Jian Hao',2],['Wei Jie',2],['Brendan',2],
            ['Lim',36],['Wong',32],['Chong',24],['Chan',21],['Chin',18],['Ong',18],['Yong',18],['Yap',18]
          ],
          last: [
            ['Tan',100],['Lee',96],['Lim',90],['Wong',80],['Ng',90],['Chong',57],['Chan',52],['Chin',44],['Ong',44],['Yap',43],['Yong',39],['Teo',24],['Goh',37],
            ['Yoong',2],['Low',37],['Wan',36],['Leong',36],['Liew',35],['Lai',34],['Ling',32],['Lau',31],['Chai',30],['Loh',29],['Chew',28],['Ooi',28],['Yee',28],
            ['Chua',27],['Ang',27],['Gan',25],['Tang',25],['Kong',24],['Chia',24],['Chang',24],['Tee',24],['Koh',24],['Sim',23],['Ting',22],['Khoo',22],
            ['Cheng',22],['Foo',22],['Choo',22],['Loo',21],['Fong',21],['Heng',20],['Pang',20],['Tay',20],['Cheah',20],['Chee',20],['Law',20],['Lam',19]
          ] }
    ] },

    // ── INA ──
    INA: { regions: [
        { w: 1,
          first: {
            early: [
              ['Agus',4],['Budi',4],['Bambang',4],['Eko',3],['Iwan',3],['Hendra',3],['Herman',3],['Rudy',3],['Eddy',3],['Imam',2]
            ],
            mid: [
              ['Agus',100],['Budi',74],['Hendra',60],['Indra',55],['Andi',62],['Agung',50],['Adi',49],['Wahyu',41],['Eko',55],['Dimas',26],['Fajar',30],['Arya',21],
              ['Muhammad',98],['Bambang',72],['Ahmad',70],['Iwan',57],['Rudy',55],['Achmad',50],['Eddy',49],['David',46],['Herman',45],['Edy',43],['Ali',43],
              ['Andy',42],['Daniel',41],['Imam',41],['Benny',40],['Herry',40],['Irwan',40],['Ferry',40],['Yudi',40],['Hadi',40],['Arief',39],['Heru',39],['Ade',39],
              ['Rudi',39],['Edi',39],['Arif',39],['Anton',39],['Andreas',38],['Muhamad',38],['Joko',38],['Erwin',38],['Dwi',37],['Ari',37],['Harry',37],['Ricky',37],
              ['Andri',37],['Michael',36],['Gunawan',36],['Teguh',36],['Nur',36],['Tri',36],['Henry',35],['Asep',35],['Tony',35],['Johan',34],['Denny',33],
              ['Chandra',33],['Andre',33],['John',33],['Bayu',33],['Ivan',33],['Putra',32],['Teddy',32],['Surya',32],['Heri',32],['Dedy',32],['Tommy',31],
              ['Mohammad',31],['William',31],['Wawan',30],['Kevin',30],['Jimmy',30],['Yohanes',30],['Alex',30],['Antonius',30],['Yusuf',30],['Slamet',30],
              ['Ronny',30],['Hari',30],['Dedi',30],['Hasan',30],['Hendri',29],['Roy',29],['Aditya',29],['Hery',29],['Djoko',29],['Edwin',28],['Aris',28],['Reza',28],
              ['Ridwan',28]
            ],
            modern: [
              ['Rizky',26],['Aditya',26],['Kevin',12],['Daniel',12],['Dimas',12],['Fajar',12],['Putra',12],['Arya',12],['Bagus',2],['Presly',2],['Muhammad',14],
              ['Bambang',14],['Ahmad',14],['Iwan',14],['Rudy',14],['Achmad',14],['Eddy',14],['David',14],['Herman',14],['Edy',14],['Ali',14],['Andy',14],['Imam',14],
              ['Benny',14],['Herry',14],['Irwan',14],['Ferry',14],['Yudi',14],['Hadi',14],['Arief',14],['Heru',14],['Ade',14],['Rudi',14],['Edi',14],['Arif',14],
              ['Anton',14],['Andreas',14],['Muhamad',14],['Joko',14],['Erwin',14],['Dwi',14],['Ari',14],['Harry',14],['Ricky',14],['Andri',14],['Michael',14],
              ['Gunawan',14],['Teguh',14],['Nur',14]
            ]
          },
          last: [
            ['Wijaya',100],['Gunawan',94],['Setiawan',81],['Santoso',78],['Kurniawan',72],['Susanto',61],['Putra',61],['Hidayat',61],['Wibowo',57],['Nugroho',54],
            ['Saputra',51],['Hartono',50],['Chandra',63],['Halim',64],['Siregar',44],['Salim',43],['Pratama',41],['Kusuma',42],['Widjaja',59],['Tanuwidjaja',2],
            ['Tan',71],['Lim',61],['Lie',56],['Lee',43],['Ahmad',43],['Irawan',42],['Iskandar',41],['Arifin',41],['Prasetyo',40],['Hadi',39],['Purnomo',38],
            ['Budiman',38],['Wahyudi',38],['Chen',38],['Jaya',37],['Yusuf',37],['Hermawan',37],['Anwar',37],['Widodo',37],['Sutanto',36],['Susilo',36],
            ['Muhammad',36],['Maulana',36],['Yanto',35],['Rahman',35],['Utomo',35],['Nugraha',35],['Susanti',34],['Darmawan',34],['Tjandra',34],['Hasan',33],
            ['Handayani',33],['Wong',33],['Adi',33],['Purwanto',32],['Surya',32],['Lubis',32],['Hartanto',32],['Huang',32],['Rahayu',31],['Budi',31],['Hakim',31],
            ['Nasution',31],['Rusli',31],['Simanjuntak',30],['Rahardjo',30],['Ong',30],['Sanjaya',30],['Liem',29],['Ang',29],['Ramadhan',29],['Abdullah',29],
            ['Effendi',29],['Rachman',29],['Winata',29],['Yanti',29],['Haryanto',29],['Setiadi',28],['Lesmana',28],['Anto',28],['Sinaga',28],['Astuti',27],
            ['Permana',27],['Mulyadi',27],['Wahyuni',27],['Hendra',27],['Harahap',27],['Handoko',27],['Ismail',27],['Firmansyah',26],['Wibisono',26],['Santosa',26],
            ['Kurnia',26],['Agustina',26],['Pratiwi',26],['Akbar',26],['Wirawan',26],['Aja',26],['Rizal',26],['Fauzi',26],['Prabowo',26],['Sugianto',26],
            ['Chan',26],['Sugiarto',26],['Tobing',26],['Utama',25],['Purnama',25],['Indra',25],['Wulandari',25],['Achmad',25],['Wicaksono',25],['Kosasih',25],
            ['Utami',24],['Yulianto',24],['Hamid',24],['Lukman',24],['Agus',24],['Kartika',24],['Chang',24],['Tambunan',24],['Syah',24],['Purba',24],['Tarigan',24],
            ['Arief',24],['Setiawati',24],['Amin',24],['Ginting',24],['Candra',24],['Siahaan',24],['Effendy',23],['Damayanti',23],['Siswanto',23],['Suryadi',23],
            ['Pramono',23],['Ridwan',23],['Aditya',23],['Tea',23],['Cahyadi',23],['Prasetya',23],['Wardhana',23]
          ] }
    ] },

    // ── CHN ──
    CHN: { regions: [
        { w: 1,
          first: [
            ['Wei',3],['Hao',3],['Kai',3],['Yifan',3],['Ming',2],['Jian',2],['Zihan',2],['Junjie',2],['Bo',2],['Rui',2],['Yuhang',2],['Chenglong',1],['Haoran',2],
            ['Zihao',2],['Jiahao',2],['Zeyu',2],['Yichen',2],['Boyuan',1],['Zhihao',2],['Junhao',1],['Yuxuan',2],['Zhenyu',2],['Sicheng',1],['Weijie',1],
            ['Zhiqiang',1],['Xiaolong',1],['Wenbo',1],['Peng',2],['Lei',2],['Tao',2],['Chao',2],['Jun',2],['Qiang',1],['Bin',1],['Feng',1],['Gang',1],['Guanyu',1]
          ],
          last: [
            ['Wang',5],['Li',5],['Zhang',5],['Liu',4],['Chen',4],['Yang',4],['Zhao',3],['Huang',3],['Zhou',3],['Wu',3],['Xu',3],['Sun',3],['Ma',2],['Zhu',2],
            ['Lin',2],['Guo',2],['He',3],['Gao',3],['Luo',3],['Zheng',3],['Liang',3],['Xie',2],['Tang',2],['Deng',2],['Han',2],['Feng',2],['Cao',2],['Peng',2],
            ['Zeng',2],['Xiao',2],['Tian',2],['Dong',2],['Pan',2],['Yuan',2],['Cai',2],['Jiang',2],['Yu',2],['Du',2],['Ye',2],['Cheng',2],['Wei',2],['Su',2],
            ['Lu',2],['Ding',1],['Ren',1],['Fang',1],['Shen',1],['Qin',1],['Kong',1],['Xue',1],['Hou',1],['Shao',1]
          ] }
    ] },

    // ── EST ──
    EST: { regions: [
        { w: 0.75,
          first: [
            ['Martin',100],['Kristjan',78],['Siim',67],['Margus',66],['Andres',65],['Sander',45],['Karl',59],['Markus',41],['Rasmus',44],['Marko',66],['Taavi',58],
            ['Kevin',49],['Sten',40],['Robin',25],['Oliver',45],['Jüri',66],['Ralf',14],['Tanel',55],['Priit',55],['Mart',54],['Mihkel',54],['Marek',53],
            ['Toomas',53],['Madis',53],['Indrek',51],['Nikita',50],['Lauri',50],['Mihhail',48],['Kaspar',47],['Robert',46],['Kirill',46],['Rauno',46],['Tarmo',46],
            ['Ilja',46],['Vitali',46],['Artjom',45],['Silver',45],['Ivan',45],['Vadim',45],['Kristo',44],['Mark',44],['Erik',44],['Meelis',44],['Sergey',44],
            ['Alexander',43],['Janek',42],['Jaanus',42],['Andrey',42],['Eduard',42],['Andrus',41],['Jaan',41],['Raido',41],['Rainer',40],['Peeter',40],
            ['Ruslan',40],['Mikk',39],['Aivar',39],['Daniel',39],['Urmas',39],['Vladislav',39],['Risto',38],['Kaarel',38],['Raúl',37],['Tõnis',37],['Kaido',37],
            ['Valeri',37],['Sven',37],['Rene',36],['Erki',36],['Allan',36],['Daniil',36],['Deniss',35],['Janar',35],['Henri',34],['Marten',34],['Andre',33],
            ['Stanislav',33],['Alexey',32],['Tõnu',32],['Dmitry',32],['Veiko',32],['Anatoli',31],['Riho',31],['Janno',31],['Andreas',31],['Ragnar',31],['Tiit',31],
            ['Rando',31],['Vlad',31],['Ivar',31],['Jan',31],['Hendrik',30],['Rait',30]
          ],
          last: [
            ['Tamm',100],['Saar',81],['Kask',75],['Sepp',73],['Mägi',70],['Kukk',64],['Rebane',59],['Ilves',57],['Oja',54],['Koppel',53],['Lepik',51],['Karu',52],
            ['Luik',50],['Kivi',50],['Mets',47],['Kuusk',45],['Peterson',49],['Pärn',48],['Kaasik',47],['Liiv',46],['Ots',44],['Vaher',43],['Jõgi',43],['Põder',42],
            ['Toom',42],['Kütt',42],['Lepp',41],['Raudsepp',41],['Laur',41],['Raud',40],['Leppik',40],['Männik',40],['Jakobson',39],['Sild',39],['Kallas',39],
            ['Hein',39],['Paju',39],['Teder',39],['Lõhmus',39],['Sarapuu',38],['Kuusik',38],['Nõmm',38],['Tamme',38],['Johanson',36],['Lember',36],['Laas',36],
            ['Kõiv',36],['Orav',36],['Kull',36],['Kala',36],['Mitt',35],['Kase',35],['Pihlak',35],['Kangur',35],['Puusepp',35],['Järv',34],['Roos',34],['Mänd',33],
            ['Hunt',33],['Mölder',33],['Palm',33],['Pärna',33],['Tomson',33],['Valk',33],['Laane',33],['Allik',32],['Valge',32],['Aas',32],['Adamson',32],
            ['Rätsep',32],['Rand',32],['Põld',31],['Tali',31],['Roots',31],['Kalda',31],['Lind',30],['Koort',30],['Parts',30],['Kruus',29],['Saks',29],
            ['Jürgenson',29],['Aus',29],['Järve',29],['Kallaste',29],['Liiva',29],['Väli',29],['Uibo',29],['Lill',29],['Rüütel',29],['Mõttus',28],['Sikk',28],
            ['Veski',28],['Rohtla',28],['Post',28],['Vahter',28],['Vahtra',28],['Ott',28],['Pruul',28],['Aavik',28],['Miller',28],['Mäe',28],['Pukk',27],
            ['Tuisk',27],['Männiste',27],['Kikas',27],['Vaino',27],['Juhanson',27],['Must',27],['Toots',27],['Tilk',27],['Mikk',27],['Martinson',26],
            ['Tõnisson',26],['Tammik',26],['Kokk',26],['Taal',26],['Varik',26],['Kurvits',26],['Toome',26],['Õun',26],['Kuus',26],['Maripuu',26],['Kolk',26],
            ['Jürgens',26],['Erik',26],['Toomsalu',26],['Raja',26],['Singh',25],['Tomingas',25],['Tallinn',25],['Unt',25],['Paas',25],['Täht',25]
          ] },
        { w: 0.25,
          first: [
            ['Aleksandr',45],['Sergei',45],['Andrei',45],['Dmitri',45],['Aleksei',45],['Vladimir',26],['Igor',26],['Roman',26],['Oleg',26],['Artur',26],
            ['Maksim',26],['Jevgeni',26],['Pavel',12],['Anton',12],['Viktor',55],['Denis',52],['Konstantin',41],['Rain',35]
          ],
          last: [
            ['Ivanov',70],['Smirnov',43],['Petrov',41],['Kuznetsov',34],['Popov',29],['Volkov',30],['Sokolov',29],['Fjodorov',27],['Nikitin',19],['Orlov',25],
            ['Mihhailov',32],['Vassiljev',32],['Lebedev',29],['Pavlov',28],['Jakovlev',27],['Nikolajev',27],['Stepanov',27],['Aleksejev',27],['Morozov',26]
          ] }
    ] },

    // ── INT ──
    INT: { regions: [
        { w: 1,
          first: [
            ['Alex',4],['Daniel',4],['David',4],['Max',3],['Leo',3],['Tom',3],['Sam',3],['Adam',3],['Ben',3],['Marco',2],['Robin',2],['Nico',2]
          ],
          last: [
            ['Martin',3],['Silva',3],['Costa',3],['Marino',2],['Berg',2],['Novak',2],['Kova',1],['Renner',1],['Sander',2],['Roman',2],['Vidal',2],['Moor',1]
          ] }
    ] },

    // ── NOR ──
    NOR: { regions: [
        { w: 1,
          first: {
            early: [
              ['Ole',4],['Per',4],['Kjell',4],['Odd',3],['Arne',3],['Knut',3],['Gunnar',3],['Leif',3],['Rolf',2],['Einar',2],['Ivar',2],['Reidar',1]
            ],
            mid: [
              ['Lars',88],['Morten',91],['Espen',74],['Geir',76],['Terje',76],['Rune',77],['Bjørn',89],['Erik',81],['Thomas',100],['Tor',57],['Frode',58],
              ['Kjetil',60],['Trond',70],['Stig',47],['Roger',46],['Petter',57],['Henrik',61],['Marius',71],['Kristian',70],['Anders',84],['Jan',87],['Andreas',86],
              ['Martin',85],['Daniel',82],['Per',76],['Christian',74],['Ole',74],['Stian',72],['Fredrik',69],['Knut',68],['Øyvind',67],['Magnus',66],['Eirik',66],
              ['Arne',62],['Tore',61],['Kjell',61],['Svein',61],['Jonas',60],['Tom',59],['John',58],['Jørgen',57],['Øystein',56],['Alexander',56],['Kenneth',56],
              ['Jon',54],['Harald',53],['Håkon',53],['Robert',53],['Kristoffer',52],['Tommy',52],['Frank',51],['Håvard',51],['Hans',51],['Pål',50],['Steinar',50],
              ['Vidar',50],['Gunnar',49],['Helge',49],['Arild',49],['Olav',48],['Kim',48],['Simen',48],['Eivind',47],['David',46],['Vegard',46],['Michael',46],
              ['Sindre',45],['Sondre',44],['Rolf',44],['Odd',44],['André',44],['Joakim',44],['Erlend',43],['Dag',43],['Einar',43],['Ola',42],['Stein',42],
              ['Mathias',42],['Sebastian',41],['Johan',41],['Mats',40],['Aleksander',39],['Lasse',39],['Nils',39],['Ronny',38],['Peter',38],['Mohammad',38],
              ['Jarle',38],['Emil',38],['Jostein',38],['Ahmad',38],['Roy',37],['Adrian',37],['Even',37],['Simon',37],['Magne',37],['Jens',37],['Henning',37],
              ['Markus',37],['Roar',36],['Robin',36],['Egil',36],['Ivar',36],['Torbjørn',36],['Atle',35],['Leif',35],['Christoffer',35],['Sverre',34],['Adam',34],
              ['Jørn',34],['Joachim',34],['Benjamin',34],['Bjørnar',33],['Ove',33],['Kåre',33],['Johannes',33],['Sigurd',32],['Tobias',32],['Marcus',32],
              ['Erling',32],['Alex',32],['Johnny',32],['Richard',31],['Paul',31],['Sander',31],['Glenn',30],['Thor',30],['Asbjørn',30],['Ståle',29],['Tomas',29],
              ['Torstein',29],['Ørjan',29],['Christopher',29],['Steffen',29],['Reidar',29],['Mads',29],['Arve',29],['Arvid',29],['Christer',29],['Chris',29]
            ],
            modern: [
              ['Emil',45],['Sander',45],['Markus',45],['Jonas',45],['Mathias',45],['Magnus',45],['Oskar',26],['Sebastian',26],['Oliver',26],['Filip',26],['Noah',26],
              ['Dennis',12],['Sondre',12],['Aksel',12],['Eirik',12],['Theodor',12],['Jan',14],['Andreas',14],['Martin',14],['Daniel',14],['Per',14],['Christian',14],
              ['Ole',14],['Stian',14],['Fredrik',14],['Knut',14],['Øyvind',14],['Arne',14],['Tore',14],['Kjell',14],['Svein',14],['Tom',14],['John',14],['Jørgen',14],
              ['Øystein',14],['Alexander',14],['Kenneth',14],['Jon',14],['Harald',14],['Håkon',14],['Robert',14],['Kristoffer',14],['Tommy',14],['Frank',14],
              ['Håvard',14],['Hans',14],['Pål',14],['Steinar',14],['Vidar',14],['Gunnar',14],['Helge',14],['Arild',14],['Olav',14],['Kim',14],['Simen',14],
              ['Eivind',14],['David',14],['Vegard',14],['Michael',14],['Sindre',14],['Rolf',14],['Odd',14],['André',14],['Joakim',14],['Erlend',14],['Dag',14],
              ['Einar',14],['Ola',14],['Stein',14],['Johan',14]
            ]
          },
          last: [
            ['Hansen',100],['Olsen',95],['Johansen',93],['Andersen',83],['Larsen',81],['Pedersen',78],['Nilsen',74],['Kristiansen',62],['Jensen',60],['Johnsen',58],
            ['Karlsen',56],['Berg',55],['Eriksen',54],['Pettersen',53],['Haugen',47],['Hagen',45],['Johannessen',45],['Jacobsen',44],['Dahl',43],['Andreassen',42],
            ['Lund',42],['Halvorsen',40],['Jørgensen',40],['Solberg',40],['Henriksen',39],['Sørensen',39],['Strand',38],['Gundersen',37],['Moen',37],
            ['Jakobsen',37],['Eide',36],['Svendsen',36],['Iversen',36],['Bakke',34],['Paulsen',33],['Rasmussen',33],['Bakken',33],['Martinsen',33],['Knutsen',33],
            ['Kristoffersen',33],['Lie',33],['Solheim',31],['Moe',31],['Kristensen',31],['Lunde',31],['Christensen',31],['Lien',31],['Berge',31],['Mathisen',30],
            ['Amundsen',30],['Hauge',30],['Knudsen',30],['Nielsen',30],['Holm',30],['Fredriksen',30],['Andresen',29],['Evensen',28],['Myhre',28],['Sivertsen',28],
            ['Aas',28],['Danielsen',27],['Haugland',27],['Arnesen',27],['Sandvik',27],['Hanssen',27],['Nygård',27],['Ellingsen',27],['Abdi',27],['Simonsen',26],
            ['Vik',26],['Berntsen',26],['Sæther',26],['Thorsen',25],['Rønning',25],['Haug',25],['Thomassen',25],['Næss',25],['Ruud',25],['Birkeland',24],
            ['Christiansen',24],['Brekke',24],['Myklebust',24],['Smith',23],['Aasen',23],['Gulbrandsen',23],['Mikkelsen',23],['Jenssen',23],['Strøm',23],
            ['Antonsen',23],['Helland',23],['Ødegård',23],['Bjerke',23],['Isaksen',23],['Johansson',23],['Edvardsen',23],['Abrahamsen',23],['Nygaard',22],
            ['Tangen',22],['Eliassen',22],['Madsen',21],['Osman',21],['Aune',21],['Gjerde',21],['Andersson',21],['Bøe',21],['Thoresen',21],['Helgesen',21],
            ['Steen',21],['Sunde',21],['Wold',20],['Mortensen',20],['Torgersen',20],['Hermansen',20],['Tveit',20],['Foss',20],['Carlsen',20],['Dale',20],
            ['Hovland',20],['Mikalsen',19],['Jansen',19],['Eilertsen',19],['Dahle',19],['Hoff',19],['Magnussen',19],['Sætre',19],['Wilhelmsen',19],['Nilssen',19],
            ['Engen',19],['Solli',19],['Bjørnstad',19],['Lorentzen',19],['Bråthen',18],['Gustavsen',18],['Hoel',18],['Sveen',18],['Gabrielsen',18],['Hammer',18],
            ['Samuelsen',18],['Haaland',18],['Engebretsen',18],['Sand',18],['Fossum',18],['Ødegaard',18],['Ingebrigtsen',18],['Stokke',18],['Sandnes',18],
            ['Berger',17],['Larsson',17],['Holmen',17],['Nordby',17],['Monsen',17],['Fjeld',17],['Eriksson',17],['Torp',17],['Ludvigsen',17],['Håland',17],
            ['Eikeland',17],['Sørlie',17],['Løken',17],['Solbakken',17],['Lind',17],['Petersen',17],['Møller',16],['Ismail',16],['Bye',16],['Meyer',16],
            ['Karlsson',16],['Breivik',16],['Egeland',16],['Yusuf',16],['Wiik',16],['Tønnessen',16],['Teigen',16],['Bråten',16],['Johannesen',16],['Solvang',16],
            ['Sandberg',16],['Syversen',16],['Hasan',16],['Johnson',16]
          ] }
    ] },

    // ── GRE ──
    GRE: { regions: [
        { w: 1,
          first: [
            ['Giorgos',73],['Dimitris',100],['Nikos',95],['Kostas',77],['Giannis',76],['Panagiotis',54],['Vassilis',23],['Christos',52],['Alexandros',46],
            ['Stavros',33],['Michalis',25],['Thanasis',32],['Spyros',29],['Antonis',44],['Konstantinos',56],['Vasilis',54],['Panos',45],['Andreas',44],
            ['Ioannis',39],['Petros',36],['Stelios',36],['Spiros',36],['Xristos',35],['Ilias',35],['Tasos',35],['Chris',33],['Georgios',32],['Manos',32],
            ['Manolis',32],['Marios',31],['Stefanos',30],['Nick',29],['Dimitrios',29],['Thanos',29],['Aris',29],['Sotiris',28],['Giwrgos',28],['Sakis',28],
            ['Fotis',28],['Lefteris',26],['Vaggelis',25],['Thomas',25],['Aggelos',25],['Yiannis',25],['Makis',25],['Mixalis',24],['Alex',24],['Nikolaos',24],
            ['Michael',24],['Thodoris',23],['Apostolos',23],['Nikolas',23],['Takis',22],['Pavlos',22],['Vagelis',22],['Alexis',22],['Yannis',22],['Leonidas',21],
            ['Pantelis',21],['Akis',20],['Kwstas',20],['Stathis',20],['Babis',20],['Theodoros',20],['Rana',20],['Mohammad',19],['Malik',19],['Costas',18],
            ['Grigoris',18],['Imran',18],['Vangelis',18],['Bill',18],['Savvas',18],['Stratos',17],['Anastasios',17],['Kyriakos',17],['Mehmet',17],['Mustafa',17],
            ['Abdul',17],['Apostolis',17],['Ahmet',17],['Angelos',17],['Dionisis',17],['Stamatis',17],['Raja',17],['Athanasios',17],['Alexander',16],['Markos',16],
            ['Basilis',16],['Lazaros',16],['Ilir',16],['Paris',16],['Arben',16],['Niko',16],['Altin',15],['Evangelos',15],['Haris',15],['Filippos',15],
            ['Giannhs',15],['Amir',15],['Elias',15],['Bilal',15],['Xaris',14],['Jim',14],['Irfan',14],['Anestis',14],['Fanis',14],['Jani',14],['Usman',14],
            ['Constantinos',14],['Antonios',13],['Asif',13],['Artur',13],['Ibrahim',13],['Themis',13],['Nektarios',13],['Hlias',13],['Adnan',13],['Theodore',13],
            ['Mario',13],['Huseyin',13],['Kostis',13],['Shahid',13],['Tassos',13],['Vasileios',13],['Dimos',13],['Orestis',13],['Dritan',13],['Loukas',12],
            ['David',12],['Albert',12],['Andrea',12],['Daniel',12],['Nasir',12]
          ],
          last: [
            ['Papadopoulos',100],['Papadakis',41],['Oikonomou',41],['Georgiou',51],['Dimitriou',40],['Nikolaou',46],['Vlachos',33],['Makris',36],['Alexiou',27],
            ['Pappas',51],['Papageorgiou',51],['Papaioannou',43],['Papadimitriou',43],['Pappa',41],['Cela',40],['Georgiadis',39],['Ioannou',38],['Ioannidis',38],
            ['Kola',38],['Mehar',38],['Antoniou',38],['Karagiannis',37],['Molla',37],['Papanikolaou',36],['Konstantinidis',36],['Athanasiou',36],['Nikolaidis',35],
            ['Markou',34],['Shahzad',34],['Papas',34],['Pap',33],['Ullah',33],['Rana',32],['Lleshi',32],['Jani',31],['Hossain',31],['Christodoulou',31],
            ['Prifti',31],['Theodorou',31],['Elezi',31],['Vasileiou',30],['Dimitriadis',30],['Hysa',30],['Anastasiou',30],['Muca',30],['Toska',30],
            ['Giannopoulos',30],['Halil',29],['Jaan',29],['Lazaridis',29],['Imran',29],['Konstantinou',29],['Dimou',29],['Mehmood',29],['Makri',28],['Stergiou',28],
            ['Dimopoulos',28],['Shehu',28],['Petrou',28],['Karagianni',28],['Sali',27],['Panagiotopoulos',27],['Kurti',27],['Memet',27],['Koci',27],['Pavlidis',27],
            ['Theodoridis',27],['Politis',27],['Nikolopoulos',27],['Eleni',27],['Papazoglou',26],['Mughal',26],['Meta',26],['Tarar',26],['Sinani',26],
            ['Papakonstantinou',26],['Kontos',26],['Triantafyllou',26],['Mema',26],['Lika',26],['Petropoulos',26],['Papathanasiou',26],['Antonopoulos',26],
            ['Balla',26],['Panagopoulos',25],['Giannakopoulos',25],['Vlachou',25],['Gjoni',25],['John',25],['Hoxhaj',25],['Gega',25],['Awan',25],['Spanos',25],
            ['Alexopoulos',25],['Anagnostou',25],['Iliopoulos',25],['Anagnostopoulos',25],['Tafa',25],['Nika',25],['Michailidis',25],['Gjini',25],['Stefanou',25],
            ['Antoniadis',25],['Petridis',25],['Sula',25],['Stavrou',25],['Maher',25],['Christou',25],['Raptis',24],['Grigoriadis',24],['Arif',24],['Chris',24],
            ['Anastasiadis',24],['Katerina',24],['Amet',24],['Stefanidis',24],['Ivanova',24],['Galanis',24],['Iliadis',24],['Panos',24],['Sarris',23],
            ['Andreou',23],['Pavlou',23],['Apostolidis',23],['Roussos',23],['Kritikos',23],['Samara',23],['Pepa',23],['Apostolou',23],['Lamprou',23],['Tabaku',23],
            ['Mavridis',23],['Christopoulos',23],['Bardhi',23],['Smith',23],['Paraskevopoulos',23],['Manolis',23],['Afzal',23],['Apostolopoulos',23],
            ['Fotiadis',23],['Stavropoulos',22],['Asif',22],['Kostopoulos',22],['Samaras',22],['Diamantis',22],['Saab',22],['Panagiotidis',22],['Hamza',22],
            ['Nawaz',22],['Pantazis',22],['Manos',22],['Chasan',22],['Sotiriou',22],['Savvidis',22],['Bilal',22],['Petrakis',22],['Sotiropoulos',22],['Karras',22],
            ['Vasiliadis',22],['Baba',22],['Arvanitis',22],['Ahmadi',22],['Elena',22],['Panou',22],['Salih',21],['Triantafillou',21],['Rajpoot',21],['Economou',21],
            ['Sideris',21],['Aliaj',21],['Vasilakis',21],['Murati',21],['Efstathiou',21],['Filippou',21],['Arapi',21],['Prenga',21],['Ranjha',21],['Margaritis',21],
            ['Sofia',21],['Angelopoulos',21],['Kyriakou',21],['Andreas',21],['Ndoj',21],['Duka',21],['Vasiliou',21],['Rigas',20],['Nikou',20],['Arshad',20],
            ['Nadeem',20]
          ] }
    ] },

    // ── TUR ──
    TUR: { regions: [
        { w: 1,
          first: {
            early: [
              ['Mehmet',4],['Ahmet',4],['Mustafa',4],['Ali',3],['Hasan',3],['Hüseyin',3],['İbrahim',3],['Osman',2],['Süleyman',2],['Kemal',2],['Orhan',2],['Erol',2]
            ],
            mid: [
              ['Murat',4],['Emre',4],['Hakan',4],['Gökhan',3],['Serkan',3],['Volkan',3],['Tolga',3],['Burak',3],['Onur',3],['Özgür',3],['Cem',3],['Barış',3],
              ['Serdar',3],['Selçuk',2],['Erhan',2],['Tayfun',2],['Kenan',2],['Levent',2]
            ],
            modern: [
              ['Arda',4],['Mert',4],['Can',4],['Kerem',4],['Ege',3],['Deniz',3],['Efe',3],['Emir',3],['Yiğit',3],['Alp',2],['Berkay',2],['Kuzey',1],['Çınar',1],
              ['Ayaz',1]
            ]
          },
          last: [
            ['Yılmaz',100],['Kaya',97],['Demir',91],['Çelik',79],['Can',78],['Öztürk',72],['Yıldız',72],['Özdemir',67],['Aydın',67],['Yıldırım',66],['Arslan',64],
            ['Doğan',63],['Aslan',59],['Kara',57],['Kılıç',51],['Yilmaz',49],['Kurt',48],['Koç',48],['Gül',46],['Korkmaz',45],['Polat',44],['Özkan',42],
            ['Şimşek',42],['Şen',41],['Güneş',41],['Bulut',41],['Yavuz',41],['Güler',41],['Acar',41],['Erdoğan',41],['Deniz',40],['Aktaş',40],['Ateş',40],
            ['Bozkurt',38],['Turan',38],['Özcan',38],['Taş',37],['Çakır',37],['Kaplan',36],['Coşkun',35],['Uzun',34],['Aksoy',34],['Yiğit',34],['Yildiz',33],
            ['Işık',33],['Karaca',33],['Yalçın',32],['Özer',32],['Ünal',32],['Genç',32],['Sarı',31],['Demirci',31],['Duman',31],['Bayram',31],['Avcı',31],
            ['Ceylan',31],['Köse',31],['Yaşar',30],['Erdem',30],['Yaman',30],['Mutlu',29],['Kartal',29],['Çiçek',29],['Kahraman',29],['Yildirim',29],['Yüksel',29],
            ['Karataş',29],['Sönmez',28],['Eren',28],['Uysal',28],['Aksu',27],['Altun',27],['Demirel',27],['Güngör',27],['Çakmak',26],['Çoban',26],['Akın',26],
            ['Aydemir',26],['Gümüş',26],['Karakaya',26],['Türk',26],['Karaman',26],['Güzel',25],['Küçük',25],['Çalışkan',25],['Uçar',25],['Gündüz',25],['Güven',25],
            ['Erol',25],['Alkan',25],['Çınar',25],['Toprak',24],['Tosun',24],['Gök',24],['Çolak',24],['Koçak',24],['Çetinkaya',24],['Ince',24],['Akkaya',24],
            ['Duran',24],['Nur',24],['Cengiz',23],['Mert',23],['Dönmez',23],['Karabulut',23],['Durmaz',23],['Akbulut',23],['Dursun',23],['Özen',23],['Uslu',23],
            ['Tunç',23],['Bal',22],['Kılınç',22],['Topal',22],['Topcu',22],['Efe',22],['Koca',22],['Baş',22],['Usta',22],['Çiftçi',22],['Keleş',22],['Bayrak',22],
            ['Soylu',21],['Türkmen',21],['Bayraktar',21],['Vural',21],['Balcı',21],['Albayrak',21],['Sezer',21],['Yazıcı',21],['Akar',21],['Durmuş',21],
            ['Güney',21],['Karakuş',21],['Çevik',21],['Sağlam',21],['Ekinci',21],['Akgün',21],['Akyol',21],['Ayaz',20],['Ünlü',20],['Baran',20],['Fidan',20],
            ['Sert',20],['Özçelik',20],['Yücel',20],['Demirtaş',20],['Aras',20],['Karagöz',20],['Akbaş',20],['Çelebi',20],['Orhan',20],['Akgül',20],['Şentürk',20],
            ['Gürbüz',19],['Şeker',19],['Kalkan',19],['Bektaş',19],['Turgut',19],['Ercan',19],['Karakaş',19],['Özmen',19],['Dinç',19],['Gündoğdu',19],['Ersoy',19],
            ['Güner',19],['Aydoğan',19],['Özbek',19],['Eroğlu',18],['Esen',18],['Karadeniz',18],['Gezer',18],['Dağ',18],['Temel',18],['Ayhan',18],['Özel',18],
            ['Budak',18],['Ergün',18],['Akyüz',18],['Tuna',17]
          ] }
    ] },

    // ── KOR ──
    KOR: { regions: [
        { w: 1,
          first: [
            ['Min-jun',3],['Seo-jun',3],['Do-yun',3],['Ji-ho',3],['Ha-jun',3],['Ji-hoon',3],['Min-seok',3],['Hyun-woo',3],['Dong-hyun',3],['Sung-min',3],
            ['Jun-seo',2],['Jae-hyun',2],['Woo-jin',2],['Joon-ho',2],['Young-ho',2],['Sang-hoon',2],['Seung-hyun',2],['Jin-woo',2],['Tae-yang',1],['Kyung-min',1]
          ],
          last: [
            ['Kim',100],['Lee',86],['Park',56],['Choi',36],['Cho',27],['Kang',27],['Jung',26],['Shin',25],['Han',22],['Jang',21],['Song',20],['Lim',20],
            ['Jeong',20],['Kwon',20],['Hong',19],['Seo',19],['Hwang',18],['Yoon',18],['Yang',16],['Jeon',14],['Son',14],['Moon',14],['Yoo',13],['Yun',13],
            ['Ahn',13],['Bae',12],['Ryu',12],['Nam',12],['Chung',11],['Baek',11],['Min',10],['Chang',9],['Jin',9],['Woo',9],['Jun',8],['Kwak',8],['Koo',8],
            ['Cha',8],['Heo',8],['Shim',7],['You',7],['Joo',7],['Chun',7],['Byun',7],['Won',7],['Sung',7],['Roh',6],['Chae',6],['Klm',6],['Bang',6],['Hyun',6],
            ['Yeo',6],['Youn',6],['Noh',6],['Sim',5],['Kong',5],['Huh',5],['Yim',5],['Suh',5],['Koh',5],['Choe',5],['Ham',5],['Mun',5],['Nguyen',5],['Sun',5],
            ['Eom',5],['Seong',5],['Sohn',4],['Seok',4],['Sin',4],['Joung',4],['Rhee',4],['Back',4],['Cheon',4],['Jee',4],['Pyo',3],['Wang',3],['Hur',3],['Choo',3],
            ['Man',3],['Bak',3],['Pak',3],['Chong',3],['Her',3],['Chu',3],['Cheong',3],['Yeon',3],['Joe',3],['Paek',3],['Bong',3],['Yeom',3],['Kil',3],['Jeung',3],
            ['Ban',3],['Seol',3],['Young',3],['Shon',2],['Tak',2],['Sarah',2],['Gwak',2],['Gong',2],['Gil',2],['Paik',2],['Youm',2],['Byeon',2],['Yuk',2],
            ['Gwon',2],['Kyung',2],['Chol',2],['Saputra',2],['Ryoo',2],['Rim',2],['Kook',2],['Maeng',2],['Ann',2],['Jeun',2],['Baik',2],['Myung',2],['Pang',2],
            ['Sari',2]
          ] }
    ] },
};

// ── Fallback-Map: pool-lose Nation → kulturell nächstverwandter Pool ──
// (v3: NOR/GRE/TUR/KOR haben jetzt eigene Pools und sind hier raus)
const NATION_NAME_FALLBACK = {
    'CHI':'ARG','PER':'COL','ECU':'COL','BOL':'COL','PAR':'ARG','CRC':'MEX','GUA':'MEX','PAN':'COL','DOM':'COL','PUR':'MEX',
    'CUB':'MEX','UKR':'RUS','BLR':'RUS','KAZ':'RUS','LAT':'EST','LTU':'EST','KGZ':'INT','UZB':'INT','TJK':'INT','TKM':'INT',
    'AZE':'INT','ARM':'INT','GEO':'INT','SVK':'CZE','SLO':'CZE','LUX':'BEL','LIE':'SUI','AND':'ESP','SMR':'ITA','MLT':'ITA',
    'CRO':'INT','SRB':'INT','BIH':'INT','MKD':'INT','MNE':'INT','ALB':'INT','BUL':'INT','ROU':'INT','ISL':'SWE','UAE':'MAR',
    'KSA':'MAR','BRN':'MAR','QAT':'MAR','KUW':'MAR','LBN':'MAR','EGY':'MAR','TUN':'MAR','ALG':'MAR','JOR':'MAR','IRQ':'MAR',
    'LBA':'MAR','PAK':'IND','BAN':'IND','SRI':'IND','NEP':'IND','SGP':'CHN','HKG':'CHN','TPE':'CHN','MAC':'CHN','PHI':'MEX',
    'VIE':'INT','KEN':'RSA','NGR':'INT','GHA':'INT','SEN':'FRA','CIV':'FRA','ANG':'POR','MOZ':'POR'
};

// ── Raritäten-Schwänze (implizit Gewicht 1) ─────────────────────────────
// v3: tiefe Daten-Raritäten jenseits der Pool-Torsi + Daten-Leihe für
// AUS/NZL/ZIM (GB/IE-Namensstock) und VEN (CO-Namensstock).
// r = Region-Index in NAME_POOLS_BY_NATION[nat].regions.
// Merge-Regel (Integration): last → an regions[r].last anhängen (Gewicht 1);
// first → NUR an mid+modern-Fenster anhängen (Datensatz ist gegenwartslastig,
// sonst hieße ein 1955er-Deutscher "Kevin"). Bei ära-flachem first-Array: direkt anhängen.
const NAME_TAILS_BY_NATION = {
    GBR: [
        { r: 0,
          first: [
            'Duncan','Joel','Martyn','Matty','Damian','Benjamin','Kev','Kenny','Christian','Dennis','Bobby','Rich','Marcin','Aidan','Julian','Antony','Ash',
            'Elliot','Glenn','Rory','Bryan','Declan','Phillip','Fred','Harvey','Stefan','Piotr','Glen','Kenneth','Calum','Jeremy','Les','Ron','Brendan','Sebastian',
            'Leo','Niall','Paddy','Ivan','Victor','Alistair','Guy','Tomasz','Ste','Dom','Rick','Brett','Hassan','Lloyd','Ronnie','Morgan','Omar','Kris','Warren',
            'Fraser','Arthur','Norman','Carlos','Mikey','Hugh','Mathew','Douglas','Krzysztof','Gabriel','Zak','Don','Bruce','Kai','Lawrence','Marius','Isaac',
            'Antonio','Curtis','Mitchell','Francis','Lucas','Damien','Leigh','Marek','Vincent','Elliott','Corey','Howard','Gerry','Harrison','Taylor','Archie',
            'Oscar'
          ],
          last: [
            'Fleming','Clayton','Sinclair','Carroll','Jennings','Morton','Boyd','Stokes','Greenwood','Tucker','Lucas','French','Barnett','Stanley','Law','Holt',
            'Woodward','Fowler','Norman','Jarvis','Whitehead','Preston','Lamb','Love','Poole','Daniels','Bruce','Flynn','Farrell','Smart','Simmons','Gibbs',
            'Brennan','Kirk','Connolly','Heath','Smyth','Barlow','Thornton','Hartley','Millar','Joseph','Knowles','Reilly','Parkinson','Burrows','Davison',
            'Dickson','Hayward','Sanders','Field','Connor','Steele','Norris','Leigh','Noble','Townsend','Kent','Ashton','Vaughan','Owens','Davey','Holden',
            'Tomlinson','Johnstone','Dale','Skinner','Reeves','Briggs','Brady','Fuller','Rhodes','Odonnell','Bolton','Dickinson','Abbott','Glover','Moran','Thorpe'
          ] },
        { r: 1,
          first: [
            'Mohamed','Mohammad'
          ],
          last: [
            'Ahmad','Islam','Akhtar'
          ] },
    ],
    GER: [
        { r: 0,
          first: [
            'Andi','Harry','Dominic','Eugen','Waldemar','Henry','Günther','Rudolf','Norman','Micha','Claus','Rudi','Ronald','Michel','Pierre','Benny','Joerg',
            'Artur','Flo','Henning','Jakob','Heinrich','Hans-Jürgen','Leo','Hubert','Albert','Mohamad','Sandro','Sergej','Erwin','Ivan','Basti','Fred','Adam',
            'Gregor','Jannik','Fritz','Boris','Malte','Tony','Erich','Hassan','Benedikt','Sören','Uli','Raphael','Tommy','Roberto','Arne','Reinhold','Abdullah',
            'Angelo','Maxi','Francesco','Eduard','Jörn','Ricardo','Salvatore','Ömer','Gerald','Wilhelm','Bruno','Niko','Denny','Matze','Henrik','Torben','Ulf',
            'Ludwig','Dustin','Burkhard','Mirco','Marek','Falk','Friedrich','Hans-Peter','Ernst','Luis','Nicolas','Adnan','Fabio','Igor','Amir','Otto','Sami',
            'Phil','Konstantin','Gabriel','Elias','Jason'
          ],
          last: [
            'Keil','Heine','Lemke','Kopp','Jordan','Karl','Jacob','Löffler','Adler','Fuhrmann','Marquardt','Münch','Wiese','Kremer','Decker','Göbel','Fricke',
            'Rothe','Voss','Harms','Hamann','Jan','Neubauer','Link','Lindemann','Hanke','Kluge','Herbst','Held','Korkmaz','Baier','Köster','Henke','Haupt','Konrad',
            'Funke','Kirsch','Janßen'
          ] },
    ],
    ITA: [
        { r: 0,
          first: [
            'Attilio','Marino','Nicolás','Amedeo','Nello','Ciccio','Nicholas','William','Florin','Adrián','Gianluigi','Vasile','Beppe','Niccolò','Arturo','Augusto',
            'Igor','Martino','Natale','Andrei','Said','Guglielmo','Giampaolo','Lello','Giordano','Livio','Robert','Ionut','Simo','Benedetto','Toni','Aniello',
            'Marius','Gaspare','Michelangelo','Anthony','Mihai','Aurelio','Costantino','Roby','Patrick','Marian','Ion','Romano','Jonathan','Rodolfo','Nando',
            'Italo','Yuri','Eduardo','Rachid','Gian','Gianpaolo','Egidio','Remo','Stefan','Romeo','Hassan','Ennio','Mohammed','Eros','Karim','Gregorio','Gio',
            'John','Gioacchino','Pier','Manuele','Dennis','Luis','Emanuel','Martín','Carlos','Youssef','Ivo','Víctor','Mino','Orlando','Aziz','Ermanno','Dante',
            'Paul','George','Gianpiero','Osvaldo','Santino','Gilberto','Genny','Ludovico','Ruggero'
          ],
          last: [
            'Guidi','Rosati','Albano','Di Mauro','Biondi','Baldi','Rota','Bucci','Di Marco','Alberti','Molinari','Massimo','Grieco','Cavaliere','Michele','Cuomo',
            'Gioia','Rosso','Giorgio','Schiavone','Rossini','Vacca','Belli','Pozzi','Agostini','Bassi','Locatelli','Bianchini','Zito','Simonetti','Serafini',
            'Rocca','Lanza','Cortese','Scala','Abbate','Spada','Orlandi','Miceli','Del Prete','Bernardini','Capone','Mari','Papa','Luciano','Donofrio','Negri',
            'Carboni','Randazzo','Giusti','Adamo','Fiorentino','Zanetti','Luongo','Riccardi','Pucci','Pasquale','Turco','Buono','Ceccarelli','Brunetti','Venturini',
            'Di Pietro','Fabio','Grande','Corrado','Cioffi','Manfredi','Di Benedetto','Elia','Berardi','Filippi','Murgia','Cristina','Granata','Luciani','Luigi',
            'La Rocca','Torre','Domenico','Brambilla','Di Maio','Cipriani','Loi','Pisani','Panico','Di Lorenzo','Cossu','Sanfilippo','Manna','Santi','De Stefano',
            'Masi','Annunziata','Porcu','Durante','Trevisan','Dauria','Quaranta','Angelo'
          ] },
    ],
    FRA: [
        { r: 0,
          first: [
            'Erwan','Greg','Omar','Jason','Brice','Gilbert','Jean Michel','Ludo','Steve','Johan','Jean-Michel','Marco','Maurice','Roland','Jean Marc','Eddy',
            'Teddy','Hassan','Jean Paul','Jérémie','Yohan','Mathias','Flo','Brahim','Mike','Walid','Cyrille','Mourad','James','Yohann','Jean Louis','Alan',
            'Jean-François','Aziz','Allan','Samy','Hakim','Jean-Louis','Edouard','Killian','Jean-Paul','Mario','Charly','Salim','Dany','Miguel','Raymond','Hamid',
            'Tanguy','Jack','Rudy','Jean-Marie','Renaud','Albert','Jean Marie','Johnny','Lucien','Jean-Baptiste','Aymeric','Paulo','Lilian','Yacine','Mustapha',
            'Adel','Martial','Jean-Philippe','Brandon','Sacha','Luis','Yoan','Pedro','Gael','Hicham','Kader','Willy','Hubert','Ryan','Lorenzo','Alban','Romuald',
            'Camille','Moha','Freddy'
          ],
          last: [
            'Guilbert','Vaillant','Coulon','Chou','Lolo','Gaudin','Leveque','Del','Legros','Abdou','Blin','Herve','Charrier','Joubert','Guillon'
          ] },
        { r: 1,
          first: [
            'Mamadou','Youssef','Farid','Nabil','Yassine','Hamza','Malik'
          ],
          last: [
            
          ] },
    ],
    USA: [
        { r: 0,
          first: [
            'Gregory','Roberto','Marc','Shane','Andre','Alejandro','Luke','Ricardo','Josue','Orlando','Saul','Kenny','Carl','Lee','Ethan','Evan','Sebastian',
            'Eduardo','Corey','Cameron','Emmanuel','Abel','Rafael','Alexis','Vincent','Mohamed','Sergio','Julio','Roy','Ahmed','Douglas','Omar','Cesar','Nate',
            'Drew','Troy','Santos','Dustin','Noah','Abraham','Leonardo','Allen','Rolando','Brett','José Luis','Ramiro','Lucas','Caleb','Derrick','Phillip',
            'Zachary','Rich','Chuck','Rudy','Trevor','Blake','Louis','Elias','Alberto','Logan','Philip','Manny','Phil','Freddy','Willie','Jaime','Mohammed',
            'Rogelio','Seth','Armando','Noe','Jean','Alvaro','Moises','Tomas','Devin','Nicolas','Curtis','Rodney','Melvin','Hunter','Xavier','Brent','Pete',
            'Taylor','Harry','Arthur','Ralph','Vicente','Alfredo'
          ],
          last: [
            'Boyd','Hunt','Ríos','Zhang','Spencer','Paz','Medrano','Cruz','Dunn','Hawkins','Lemus','Vega','Davila','Sandoval','Bernal','Armstrong','Ferguson',
            'Parra','Payne','Franklin','Hansen','Lane','Santiago','Barajas','Andrews','Rice','Hicks','Gardner','Lugo','Stephens','Angel','Cantu','Meyer','Acosta',
            'Dominguez','Juárez','Espinoza','Molina','Yang','Valdez','Cabrera','Ayala','Fuentes','Miranda','Avila','Campos','Lin','Escobar','Márquez','Khan','Leon',
            'Padilla','Lara','Navarro','Cortez','Carrillo','Velásquez','Solis','Ochoa','Rosales','Robles','Salinas','Serrano','Cárdenas','Cervantes','Suárez',
            'Shah','Valencia','Orozco','Franco','Velázquez','Camacho','Barrera','Mora','Ibarra','Cortés','Zamora','Villa','Montoya','Meza','Palacios','Villarreal',
            'Ponce','Kumar','Montes','Santos','Zuniga','Bravo','Quintero','Kaur','Cisneros','Galvan','Osorio','Arroyo','Cardona','Sharma','Cano','Reddy','Gill',
            'Bautista'
          ] },
    ],
    BRA: [
        { r: 0,
          first: [
            'Beto','Nilton','Denis','Elton','Josué','Alexsandro','Raphael','Sidney','Vilmar','Kaio','Milton','Michael','Ezequiel','Odair','Airton','Jairo','Valter',
            'Juninho','Wanderson','Edvaldo','Raúl','Osvaldo','Cristian','Everaldo','Moacir','Orlando','Lukas','Valdemir','João Pedro','Kleber','Ryan','Vicente',
            'Romario','Artur','Walter','Gilvan','Edivaldo','Maria','Natan','Richard','Kaique','Alison','Nathan','Roger','Jaime','Vilson','Josimar','Natanael',
            'Juan','Ivo','Rodolfo','Arnaldo','Carlos Eduardo','Ivanildo','Weslley','Celio','John','Jardel','Almir','Nivaldo','Severino','Marcus','Iago','Isaac',
            'Isaias','Angelo','Giovani','Higor','Washington','João Victor','George','Aparecido','Otavio','Ademar','Enzo','Deivid','Manuel','Agnaldo','Chico','Gean',
            'Paulinho','Dirceu','Domingos','Pedro Henrique','Cleverson','Ederson','Eric','Maciel','Lindomar','Juárez'
          ],
          last: [
            'Godoy','Schmidt','Anderson','Fontenele','Ramalho','Luciano','Silvestre','Couto','Da Cruz','Santo','Patricia','Gabriela','Nonato','Gama','Teodoro',
            'Bonfim','Francisca','Ribas','Hugo','Aragão','Cardozo','Gouveia','Cezar','Olivera','Sobral','Socorro','Paes','Emanuel','Diego','Rufino','Paixão',
            'Do Nascimento','Do Carmo','Novaes','De Almeida','Alves Da Silva','Claudia','Dos Anjos','Rossi','Da Luz','Julia','Ferreira Da Silva','Sobrinho','Roque',
            'Custodio','Fontes','Brasil','Branco','Bernardes','Neres','Davi','Mafra','Honorato','Silvia','Salvador','Alex','Luna','Ríos','Valentim','João','Flor',
            'Saldanha','Ximenes','Justino','Roberta','Assunção','Varela','Hoffmann','Avila','Novais','Meira','Dourado','Simões','Wagner','Bitencourt','Smith'
          ] },
    ],
    JPN: [
        { r: 0,
          first: [
            'Hisashi','Felipe','Hikaru','Isao','Masakazu','Cesar','Junya','Ichiro','Gustavo','Ryohei','Renato','Taka','Hiroto','Hirotaka','Kengo','Mark','Joe',
            'Leandro','Richard','Shoji','Mike','Tom','Leonardo','Kazuyuki','Kai','Takafumi','Akihiko','Mohammad','Paul','Shuichi','Toshiki','Diego','Kazuhiko',
            'Tomoaki','Tony','Junior','Keiji','Mauricio','Naoyuki','Yasuo','Masa','Alberto','Abdul','Peter','Marco','Mitsuhiro','Masayoshi','Kazu','Noboru',
            'Shinichiro','Robert','Susumu','Tsubasa','Mitsuru','Sam','Yuma','Masataka','Ryuichi','Kaoru','Miguel','Nobuhiro','Tetsuo','Masafumi','Ahmed','Shuji',
            'Shinsuke','Takeo','Yukihiro','Shigeki','Kyohei','Milton','Yutaro','Kaito','Yoshikazu','Oscar','Hironori','Mauro','Ahmad','Sato','Katsuya','Kazuaki',
            'Dai','Noriyuki','Leo','Jason','Malik','Junji','Toshi','Guilherme','Nobuo'
          ],
          last: [
            'Ohno','Kai','Tada','Oishi','Hirota','Kishimoto','Hayashida','Tajima','Yamane','Okawa','Enomoto','Tsuda','Mizutani','Sekine','Miyashita','Iwai',
            'Matsuzaki','Shirai','Hata','Uno','Kano','Shimabukuro','Eguchi','Lima','Fukumoto','Taira','Tsutsumi','Usui','Osawa','Moriyama','Murai','Chang','Kandel',
            'Kanazawa','Iijima','Ide','Muto','Moriya','Morikawa','Maekawa','Satou','Toyama','Ogasawara','Homma','Horiuchi','Matsuyama','Hagiwara','Okuyama',
            'Mikami','Muramatsu','Shima','Oki'
          ] },
    ],
    ESP: [
        { r: 0,
          first: [
            'Guillem','Marcelo','Dario','Mateo','Elias','Nico','Guille','Mohammed','Leo','Francis','Claudio','Karim','Damian','Adam','Eduard','Alonso','Paul',
            'Jose Francisco','Matías','Khalid','Aziz','Leonardo','Fermin','Aurelio','Jose Ignacio','Lolo','Blas','Oliver','Michael','Jacinto','Ion','Frank',
            'Marius','Pep','Benjamin','Igor','Vicent','Hicham','Andreu','Julen','Antonio Jesus','Antoni','Marian','Roman','Joseba','Hamid','Saul','Vasile',
            'Jose Vicente','Peter','Erik','Tito','Antonio Jose','Jose Javier','Toño','Juan Ramon','Santos','Mamadou','Rober','Josue','Jacobo','Xabier','Ramiro',
            'George','Fabián','Justo','Eusebio','Gines','Fco Javier','Mihai','Juan Pablo','Josu','Ricard','Simón','Fer','Francisco Manuel','Brian','Andoni',
            'Ezequiel','Mustapha','Hamza','Sebas','Fidel','Ionut','Abdel','Amador','Josep Maria','Bryan','Mauricio','Marcelino'
          ],
          last: [
            'Quintero','Barroso','Rojo','Galindo','España','Bonilla','Lopez Martinez','Barcelona','Martinez Lopez','Correa','Rodriguez Fernandez','Cabello','Marco',
            'Pulido','Fernandez Gonzalez','Saavedra','Salinas','Duarte','Polo','Mata','Pinto','Del Rio','Simón','Gonzalez Fernandez','Caro','Oliver','Mar','Gimeno',
            'Sanchez Lopez','Fernandez Lopez','Zambrano','Villegas','Aguado','Ordoñez','Domingo','Lopez Sanchez','Asensio','Alarcon','Menendez','Smith',
            'Fernandez Rodriguez','Martin Martin','Lopez Fernandez','Rodriguez Perez','Escribano','Leal','Lopez Rodriguez','Vásquez','Cardona','Castellano',
            'Rodriguez Lopez','Barrios','Palma','Lopez Perez','Amaya','Carrera','Martinez Sanchez','Mejía','Da Silva','Garcia Martin','Millan','Peralta','Tomás',
            'Alvarado','Perez Rodriguez','Andrade','Gonzalez Perez','Carbonell','Salgado','Martin Garcia','Caceres','Calero','Ventura'
          ] },
    ],
    ARG: [
        { r: 0,
          first: [
            'Beto','Exequiel','Santino','Fabio','Maximo','Marco','Ismael','Roman','Tobias','Lucho','Rolando','Fer','Samuel','Gonza','Bautista','Tito','Uriel',
            'Fabricio','Edgar','Manu','Adolfo','Javi','Benja','Guille','Vicente','Silvio','Emmanuel','Alexander','Felix','Julio Cesar','Lucio','Ema','Ulises',
            'Roque','Pepe','Augusto','Carlitos','Luca','Lorenzo','Guido','Edu','Rene','Jorge Luis','Lisandro','Jeremias','Richard','Victor Hugo','Gaby','Alvaro',
            'Charly','Humberto','Ian','Juan Cruz','Lauty','Arturo','Domingo','Tiago','José María','Santy','Paulo'
          ],
          last: [
            'Nieva','Ochoa','Almiron','Santos','Guevara','Vidal','Rossi','Arguello','Gallo','Lujan','Escalante','Villagra','Bogado','Guerra','Ruiz Diaz','Calderon',
            'Amaya','Barraza','Mora','Espinosa','Salvatierra','Frias','Cano','Araujo','Quispe','Montiel','Rivera','Gil','Britez','Palacio','Esquivel','Tello',
            'Barrientos','Vásquez','Villanueva','Ezequiel','Riquelme','Roman','Quiroz','Gomes','Costa','Montero','Rolon','Portillo','Machado','Luque','Olmos',
            'Olmedo','Pintos','Durán','Amarilla','Alderete','Centurion','Saucedo','Carrasco','Palavecino','Torrez','Cuevas','Marin','Villa','Argañaraz','Sanabria',
            'Moya','Zabala','Parra','Rey','Pinto','Jaime','Britos','Cantero','Iglesias','Quevedo','Moreira','Basualdo','León','Alfonso','Ferrari','Rocha','Alcaraz',
            'Prieto'
          ] },
    ],
    NED: [
        { r: 0,
          first: [
            'Stan','William','Arnold','Mario','Maikel','Harm','Mehmet','Frits','Floris','Teun','Ger','Karel','Roland','Laurens','Arjen','Sjaak','Stef','Guus',
            'Timo','Jacob','Ivo','Guido','Coen','Julian','Henri','Melvin','Johnny','Rens','Harrie','Hugo','Koos','Sem','Eddy','Twan','Wilco','Evert','Job','Huub',
            'Rutger','Louis','Omar','Jim','Hendrik','Arthur','Adam','Christian','Christiaan','Toon','Jurgen','Hassan','Barry','George','Henry','Milan','Aad',
            'Gerben','Glenn','Jordi','Casper','Freek'
          ],
          last: [
            'Koopmans','Kooistra','Van Driel','Van Der Werf','Boers','Swinkels','Boom','Van Zanten','Veldman','De Ridder','Martina','Heemskerk','Ben','Nieuwenhuis',
            'Stolk','Veen','De Jongh','Veldhuis','Albers','Nijland','Brinkman','Love','Bergsma','Drost','Nijenhuis','Van Den Bos','De Waal','Schutte','Fransen',
            'Bouwmeester','Van Berkel','Theunissen','Reinders','Hoogeveen','Man','Van Der Ploeg','Nijhuis','Van Rossum','Keijzer','Wolf','Dam','Den Hartog',
            'Van Vugt','Willemse','Schippers','Heijnen','Leenders','Van Hoof','Klaver','De Ruijter','Van Velzen','Hendriksen','Schreurs','Lamers','Mulders','Kool',
            'Veerman','Verschoor','Wagenaar','Jong','Jonkers','Van De Pol','Van Der Zee','Wijnen','Van Duijn','Verheijen','Steenbergen','Van Der Linde','Bruinsma',
            'Kamp','De Wilde','Kroes','Lubbers','Manders','De Visser','De Laat','Valk','Meijers','Van Bergen','Franssen'
          ] },
    ],
    BEL: [
        { r: 0,
          first: [
            'Jef','Joris','Jose','Hassan','Ludo','Michiel','Arthur','Jelle','Georges','Jordan','Johnny','Guido','Samuel','Damien','Victor','Jason','Frederik',
            'Gert','Adrien','Marco','Bryan','Florian','Mustafa','Benny','Stefaan','Walter','Axel','Omar','William','Ivan','Joseph','Henri','Jordy','Adam','Antonio',
            'Stef','Alexander','Ibrahim','Albert','Ludovic','Arne','Roland','Sander','Mehdi','Erwin','Charles','Wesley','Lorenzo','Fabian','Maxim','Max','Samir',
            'Emmanuel','Hamza','Bilal','Rik','Karel','Mehmet','Robbe','Giovanni'
          ],
          last: [
            'Meeus','Goffin','Reynders','Goris','Cornet','Lacroix','Luyckx','Meert','Fernández','Roland','Jan','Bekaert','Boonen','Driesen','Eeckhout','Piette',
            'Vaes','Daniels','Bollen','Lecomte','Marien','Dujardin','Nuyts','Libert','Debruyne','Schmitz','Decoster','Bracke','Michaux','Helsen','Dewaele','Ooms',
            'Desmedt','Lambrecht','Baeten','Paul','Bourgeois','Vranken','Patrick','Jacob','Heymans','Huyghe','Meunier','Blomme','Gilles','Lucas','Callewaert','Bou',
            'Poncelet','Gilson','Hardy','Boone','Leys','Vrancken','Rose','Cuvelier'
          ] },
        { r: 1,
          first: [
            
          ],
          last: [
            'Vanhoutte','De Boeck','Van Den Eynde','Vandeputte','De Waele','Van Den Bosch','Vandendriessche','De Moor','Vandaele','Vermeire','Van Den Brande',
            'De Schepper','De Laet','Vandenbussche','Torfs','Vandenbroucke','De Jonghe','Van Looy','De Bie','De Greef','Verbist','De Paepe','Van Camp','Verelst'
          ] },
    ],
    SUI: [
        { r: 0,
          first: [
            'Paolo','Victor','Valentin','Dominique','Ernst','Luigi','Frank','Lars','Fritz','Bernard','Silvan','Noah','Daniele','Albert','Hasan','Julian','Ahmed',
            'Ueli','Josef','Mark','Renato','Ramon','Massimo','Tony','Vincenzo','Guillaume','Yann','Anthony','Bernhard','Ibrahim','Carlo','Guido','Marko','Vitor',
            'Flavio','Fabrice','Erich','Domenico','Serge','Antoine','Jacques','Dylan','Juan','Damien','Sami','Maxime','Jean-Pierre','Ruben','Silvio','Armin',
            'Steven','Jörg','Andi','Ivo','Louis','Cyril','Omar','Mathieu','Lorenzo'
          ],
          last: [
            'Steffen','Schmutz','Mathys','Stefan','Lanz','Glauser','Graber','Röthlisberger','Eichenberger','Patrick','Reber','Zwahlen','Betschart','Krebs','Bader',
            'Willi','Haller','Rosa','Aebi','Bauer','Nussbaumer','Kuster','Siegrist','Wicki','Jakob','Jashari','Blum','Ahmeti','Rohrer','Sigrist','Eugster',
            'Friedli','Probst','Aeschlimann','Ismaili','Jenni','Steinmann','Sadiku','Romano','Dubois','Mehmeti','Ryser','Merz','Jäger','Thaqi','Clerc','Wehrli',
            'Wirth','Mathis','Ott','Häfliger','Heiniger','Fässler','Käser','Hirschi','Winkler','Bühlmann','Ritter','Figueiredo','Stöckli','Ibrahimi','Brügger',
            'Wirz','Ernst','Burkhalter','Schaub','Trachsel','Erni','Imeri','Kern','Forster','Eberle','Bigler'
          ] },
        { r: 1,
          first: [
            'Romain'
          ],
          last: [
            'Gross'
          ] },
        { r: 3,
          first: [
            
          ],
          last: [
            'Borges','Matos','Andrade','Antunes','Azevedo','Araujo'
          ] },
    ],
    AUT: [
        { r: 0,
          first: [
            'Ronald','Patrik','Samuel','Marcus','Sandro','Reinhold','Joachim','Mohamed','Ferdinand','Aleksandar','Yusuf','Maxi','Emanuel','Nikola','Andy',
            'Valentin','Milan','Ismail','Emre','Harry','Rupert','Eduard','Amir','Osman','Sepp','Lucas','Hüseyin','Lorenz','Mark','Ludwig','Sasa','Raimund','Jörg',
            'Bruno','Heinrich','Christof','Ramazan','Joe','Frank','Fabio','Marvin','Danijel','Adnan','Viktor','Konrad','Abdullah','Benedikt','Adam','Dennis','Gerd',
            'Fatih','John','Robin','Adem','Eric','Sven','Arnold','Ömer','Ralf','Zeljko'
          ],
          last: [
            'Peer','Weinberger','Ernst','Pucher','Unterberger','Friedrich','Raab','Scheiber','Wurzer','Schütz','Maierhofer','Reiterer','Ahmadi','Brandner',
            'Deutsch','Stark','Schöpf','Langer','Wachter','Trummer','Leeb','Kröll','Renner','Schaffer','Sailer','Nagl','Varga','Geisler','Dorner','Schatz','Paul',
            'Aichinger','Pilz','Ritter','Lenz','Neuwirth','Vogl','Steger','Mühlbacher','Geiger','Rauscher','Gross','Reindl','Sattler','Hödl','Herbst','Artner',
            'Beck','Höfler','Schuh','Siegl','Schranz','Bader','Dietrich','Nowak','Markus','Schmied','Pühringer','Kiss','Andreas','Wechselberger','Harrer','Eberl',
            'Holzmann','Lamprecht','Schlögl','Spitzer','Burtscher','Schindler','Stern','Kellner','Moosbrugger','Humer','Eberharter','Schulz','Steurer','Gmeiner',
            'Steinberger','Weidinger','Reichl'
          ] },
    ],
    SWE: [
        { r: 0,
          first: [
            'Paul','Benny','Ludvig','Ronny','Mahmoud','Josef','Stig','George','Patrick','Isak','Lucas','Christopher','Klas','Leo','Lukas','Morgan','Sam','Jonny',
            'Jonatan','Ove','Benjamin','Hussein','Reza','Mårten','Khaled','Sami','Joachim','Bosse','Sören','Adrian','Jocke','Arvid','Hasse','Samir','Jim','Peder',
            'Jon','Ivan','Sten','Börje','Hasan','Hannes','Hamid','Fadi','Jerry','Abdi','Måns','Carlos','Kurt','Abdullah','Patric','Adnan','Fabian','Ted','Rune',
            'Said','Ingvar','Frank','Jack','Örjan'
          ],
          last: [
            'Lundh','Törnqvist','Malmström','Hagberg','Dahlqvist','Forsman','Frisk','Österberg','Wahlberg','Rydberg','Berntsson','Fors','Ismail','Nord','Kjellberg',
            'Peterson','Ljunggren','Wilhelmsson','Östman','Anderson','Lövgren','Hasan','Almqvist','Hosseini','Lundkvist','Svärd','Skoog','Backlund','Sjöblom',
            'Lindmark','Hjelm','Hellgren','Hjalmarsson','Simonsson','Lindkvist','Ahlgren','Hagman','Sjöholm','Lantz','Lindvall','Hallgren','Ahlberg','Wall',
            'Viklund','Alexandersson','Svedberg','Rosengren','Lennartsson','Nordqvist','Svanberg','Oscarsson','Bertilsson','Bergkvist','Sjöstrand','Karlström',
            'Alfredsson','Ekholm','Hellman','Smith','Broberg','Nylander','Palmqvist','Andersen','Gustafson','Lundquist','Augustsson','Yousef','Åkerlund','Krantz',
            'Jafari','Hammar','Brännström','Nordgren','Salomonsson','Saleh','Lindquist','Wennberg','Sjölund','Ekstrand','Malmgren'
          ] },
    ],
    FIN: [
        { r: 0,
          first: [
            'Asko','Rauno','Aapo','Mohammad','Julius','Robert','Sauli','Akseli','Jami','Jimi','Santtu','Aaro','Aku','Perttu','Miska','Max','Olavi','Thomas','Teppo',
            'Antero','Ilari','Veli-Matti','Christian','Panu','Niilo','Kalevi','Sampo','Erik','Jonas','Pyry','Kasper','Aatu','Robin','Ilpo','Veijo','Miko','Topias',
            'Tino','Oliver','Tarmo','Taneli','Alexander','John','Eemil','Teuvo','Eino','Osmo','Juha-Pekka','Juha-Matti','Kaj','Lari','Benjamin','Tomas','Pete',
            'Martin','Viljami','Anders','Kauko','Severi','Karri'
          ],
          last: [
            'Viitala','Penttilä','Hautamäki','Ollila','Auvinen','Huotari','Suomalainen','Juvonen','Myllymäki','Karttunen','Suhonen','Kivimäki','Huovinen',
            'Hietanen','Eronen','Saastamoinen','Nuutinen','Pennanen','Perälä','Lehtola','Kainulainen','Pakarinen','Keskinen','Silvennoinen','Jalonen','Välimäki',
            'Tuomi','Lähteenmäki','Markkanen','Helminen','Ollikainen','Halme','Ylitalo','Hannula','Taskinen','Matikainen','Kantola','Holm','Sipilä','Kuosmanen',
            'Alatalo','Rintala','Meriläinen','Laiho','Mäntylä','Kähkönen','Kortelainen','Kivistö','Soininen','Tervo','Erkkilä','Turpeinen','Matilainen','Haapanen',
            'Rauhala','Kuisma','Kurki','Pääkkönen','Ojanen','Kiviniemi','Pajunen','Lassila','Tanskanen','Peltoniemi','Kankaanpää','Puustinen','Piirainen',
            'Rytkönen','Hytönen','Väyrynen','Pohjola','Alam','Taipale','Haataja'
          ] },
        { r: 1,
          first: [
            
          ],
          last: [
            'Lindfors','Lindgren','Nylund','Gustafsson','Nyberg','Henriksson'
          ] },
    ],
    DEN: [
        { r: 0,
          first: [
            'Hasan','Khaled','Bjarke','Joachim','Paul','Peder','Jack','Danny','Marco','Marius','Carl','Uffe','Bilal','Hussein','Erling','Sami','Ove','Thor','Jimmi',
            'Oscar','Ahmet','Abdullah','Osman','Tonny','Abdul','Jannik','André','Theis','Amir','Muhammad','Elias','Asbjørn','Adnan','Karl','Ismail','Malthe',
            'Murat','Viktor','Jes','Noah','Yusuf','Ronni','Adrian','Phillip','Nikolai','Markus','Joakim','Janus','Sven','Malik','Rolf','Nils','Poul Erik','Malte',
            'Samir','Abu','Niclas','Hamza','Steven','Albert'
          ],
          last: [
            'Rohde','Buhl','Clemmensen','Birch','Laustsen','Birk','Hjort','Kjærsgaard','Højgaard','Høyer','Damsgaard','Villumsen','Svenningsen','Nikolajsen',
            'Thuesen','Storgaard','Torp','Bruhn','Matthiesen','Graversen','Daugaard','Fabricius','Albertsen','Pihl','Stokholm','Axelsen','Steen','Wulff','Kofod',
            'Therkildsen','Sander','Sorensen','Dall','Busk','Larsson','Ebbesen','Lynge','Boesen','Hviid','Albrechtsen','Meldgaard','Isaksen','Ottesen','Falk',
            'Elkjær','Ottosen','Duus','Høgh','Fuglsang','Kronborg','Høj','Pallesen','Mørch','Skou','Mansour','Jan','Bloch','Boysen','Erichsen','Rømer','Rose',
            'Weber','Krarup','Magnussen','Boye','Johannessen','Ahmadi','Vester','Brink','Dupont','Sari','Korkmaz','Borg','Holmgaard','Skaarup','Karlsson','Green',
            'Mørk','Callesen','Abildgaard'
          ] },
    ],
    NOR: [
        { r: 0,
          first: [
            'Audun','Kai','Bård','Trygve','Finn','Kevin','Karl','Raymond','Runar','William','Bjarne','Inge','Patrick','Alf','Piotr','Truls','Torgeir','Stefan',
            'Øivind','Oddvar','Jakob','Mohamad','Marcin','Elias','Mikael','Ruben','Tony','Cato','Ragnar','Sven','Peder','Jacob','Tomasz','Tormod','Krzysztof',
            'Herman','Ketil','Jonathan','Haakon','Endre','Jonny','Dan','Jan Erik','Carl','Kurt','Preben','Åge','Amir','Gaute','Bendik','Nicolai','Halvor','Nikolai',
            'Bjarte','Abdi','Are','Yngve','James','Jesper','Kent'
          ],
          last: [
            'Kolstad','Tollefsen','Fosse','Langeland','Kvam','Nilsson','Helle','Jonassen','Sletten','Gran','Sande','Hamre','Dalen','Fjeldstad','Holen','Kleven',
            'Farah','Jama','Haga','Viken','Aamodt','Stene','Borgen','Rønningen','Skaar','Lindberg','Ness','Øien','Arntzen','Borge','Tvedt','Aase','Ottesen',
            'Hetland','Ahmadi','Brevik','Enger','Skoglund','Haugan','Bjelland','Mathiesen','Arntsen','Solem','Norheim','Grande','Nordli','Husby','Haile','Salvesen',
            'Braathen','Kvamme','Syvertsen','Kleppe','Riise','Børresen','Finstad','Stenberg','Vold','Løkken','Tekle','Røed','Markussen','Haraldsen','Reitan',
            'Normann','Waage','Ellefsen','Espeland','Gjertsen','Nordvik','Simensen','Vatne','Olsson','Nikolaisen','Abdullahi','Farstad','Nesse','Holst','Bergersen',
            'Mæland'
          ] },
    ],
    CAN: [
        { r: 0,
          first: [
            'François','Bruce','Hassan','Benjamin','Alain','Chad','Phil','Cameron','Amir','Travis','Philip','Ivan','Antonio','Liam','Edward','Allan','Will',
            'Jeffrey','Brent','Connor','Austin','Gurpreet','Jerry','Brett','Joey','Fred','Ethan','Sébastien','Dean','Larry','Abdul','Aman','Léo','Curtis','Jorge',
            'Bobby','Sunny','Philippe','Maxime','Louis','Todd','Brendan','Carl','Albert','Miguel','Corey','Cory','Barry','Ricardo','Noah','Julian','Karan','Ricky',
            'Guy','Gordon','Emmanuel'
          ],
          last: [
            'Hanna','Michael','Canada','Shaikh','Thomson','Kay','Nicole','Mckenzie','Schmidt','Mackenzie','Wallace','Harvey','Obrien','Joshi','Man','Cohen',
            'Mcleod','Palmer','Mills','Mak','Cole','Jiang','Neufeld','Zheng','Patterson','May','Yan','Mckay','Tse','Penner','Sam','Andrews','Stevens','Wall','Dee',
            'Fox','Jay','Long','Mason','Kwok','Crawford','Song','Kerr','Perry','Burke','Dixon','Bee','Matthews','Price','Mangat','Duncan','Hunt','Thind','Tong',
            'Fong','Knight','Fehr','Desai','Chin','Powell','Abraham','Uppal','Gandhi','Chong'
          ] },
        { r: 1,
          first: [
            'Denis','Claude','Luc'
          ],
          last: [
            'Fournier','Beaulieu','Girard','Simard','Lefebvre','Lambert','Lapointe'
          ] },
        { r: 2,
          first: [
            'Syed'
          ],
          last: [
            'Han','Siddiqui','Chowdhury','Reddy','Qureshi','Sheikh','Chauhan','Cho','Ngo'
          ] },
    ],
    MEX: [
        { r: 0,
          first: [
            'Joaquín','Rolando','Raymundo','Lorenzo','Luis Angel','Juan Antonio','Chuy','Fidel','Emanuel','Roman','Isidro','Rigoberto','Bernardo','Jorge Luis',
            'Nicolás','Oswaldo','Rafa','Santos','Gael','Heriberto','Benito','Irving','Gregorio','Junior','Valentin','Fredy','Max','Ezequiel','Luis Fernando',
            'Jose Angel','Luis Enrique','Genaro','Efren','Mariano','Isaias','Federico','Damian','Jair','Nestor','Pancho','Mauro','Kike','Mike','Frank','Aurelio',
            'Ariel','Jose Guadalupe','Cruz','Dany','Jairo','Jose Alfredo','Brian','Eric','Mateo','Jose Alberto','Carlos Alberto','Joseluis','Jose Juan','Lucio',
            'Yahir'
          ],
          last: [
            'Castellanos','Coronado','Saldaña','Ojeda','Hdz','Amador','Osuna','Balderas','Caballero','Aguilera','Davila','Uribe','Solano','Magaña','Rico','Gamez',
            'Piña','Escalante','Romo','Gil','De Jesus','Bonilla','Arriaga','Nieto','Montero','Pech','Angeles','Arredondo','Acevedo','Mercado','Palma','Varela',
            'Carrasco','Bustamante','Guillen','Montalvo','Granados','Baez','Islas','Becerra','Najera','Ventura','Quintana','Arreola','Rodrigues','Jaramillo',
            'Gamboa','Yañez','Ocampo','De Leon','Barrios','Alfaro','Sierra','Barraza','Portillo','Gaytan','Carrera','Carbajal','Arteaga','Ontiveros','Vidal',
            'Del Angel','Monroy','Hurtado','Melendez','Anaya','Cota','Venegas','Barron','Renteria','Toledo','Valle','Olivas','Escamilla','Alberto','Alarcon','Arce',
            'Carranza','Ramires','Alejandro'
          ] },
    ],
    RSA: [
        { r: 0,
          first: [
            'Jack','Nelson','Justice','Bonginkosi','Calvin','Donald','Brandon','Trevor','Henry','Jabu','Thabani','Eugene','Samkelo','Marius','Solly','Elias',
            'Steve','Aubrey','Siyanda','Kamogelo','Nicholas','Collen','Sbonelo','Syabonga','Ryan','Lerato','Joshua','Bafana','Muzi','Vuyo','Sbu','Ashley','Pule',
            'Stanley','Mzwandile','Shane','Lehlohonolo','Wandile','Amos','Siphiwe','Jimmy','Kyle','Walter','Jerry','Koketso','Willie','Skhumbuzo','Ronald',
            'Zakhele','Ricardo','Kobus','Lungelo'
          ],
          last: [
            'Sambo','Beukes','Arendse','Sibanyoni','Prince','Mavuso','Swartz','Thabethe','Thabo','Jack','September','Miya','Shandu','Pretty','Johannes','Zitha',
            'Ángel','Makhubela','Magwaza','Pietersen','Van Der Walt','Naicker','Mosia','Moloto','Sello','Junior','Lucky','Gwala','Solomons','Myeni','Qwabe',
            'Thando','Van Staden','Basson','Maake','Jackson','Maduna','Rose','Sam','Lewis','Groenewald','Plaatjies','Jantjies','Samuel','Twala','Maluleka'
          ] },
        { r: 1,
          first: [
            'Piet'
          ],
          last: [
            'Grobler','Bester','Snyman','Rossouw','Scheepers','Visagie','Burger','Kotze','Steenkamp','Schoeman'
          ] },
        { r: 2,
          first: [
            'Tshepiso','Lebohang','Solomon','Thami','Lesego','Thembinkosi','Tshepang'
          ],
          last: [
            'Nkabinde','Mpanza','Ngwane','Ngidi','Mdlalose','Mbambo','Mdletshe','Mphahlele','Ngomane','Mashele','Mbali','Masemola','Mvelase','Mlangeni','Masondo',
            'Letsoalo','Nzama','Lebo','Msimango','Ndwandwe','Mtsweni','Phakathi','Mokone','Themba'
          ] },
    ],
    IRL: [
        { r: 0,
          first: [
            'Kenneth','Marcin','Des','Maurice','Bryan','Raymond','Matt','Bob','Jay','Shaun','Piotr','Gareth','Jerry','Oliver','Cillian','Willie','Christy','Tomasz',
            'Nigel','Mikey','Bill','Ivan','Emmet','Krzysztof','Justin','Larry','Scott','Tadhg','Leo','Fergus','Joey','Stuart','Bobby','Marc','Gearoid','Nick',
            'Gabriel','Glenn','Padraic','Phil','Will','Glen','Dominic','Daragh','Henry','Carl','Ollie','Don','Leon','Fintan','Pawel','Garry','Victor','Shay',
            'Lorcan','Roy','Grzegorz','Ali','Gordon','Marcus'
          ],
          last: [
            'Dooley','Kehoe','Lennon','Bradley','Mulcahy','Mcgovern','Fogarty','Twomey','Horgan','Boland','Treacy','Grant','O Callaghan','Mccann','Glynn',
            'Corrigan','Regan','Purcell','Tierney','Murtagh','Kiernan','Gannon','Horan','Nugent','Gibbons','Rogers','Shanahan','Harte','Cotter','Hanley','Donohoe',
            'Taylor','Johnson','Johnston','Wallace','Odriscoll','O Donovan','Bolger','Scanlon','Scully','Fallon','Hannon','Connors','Hyland','Lane','O Keeffe',
            'Flaherty','Matthews','Naughton','Connell','Slattery','Lawless','Downey','Ahern','Behan','Robinson','Donoghue','Cox','Mcguinness','Gray','Mannion',
            'Quinlan','Graham','Prendergast','Gaffney','Moriarty','Jackson','Fitzsimons','O Donoghue','Mahony','Carolan','Omalley','Ennis','Young','Mullins',
            'Crowe','Clifford','Geoghegan','Feeney','Quirke'
          ] },
    ],
    POR: [
        { r: 0,
          first: [
            'Mauricio','Hernani','Leo','Toze','Carlos Alberto','Gui','Paulo Jorge','Diego','Patrick','Amadeu','Martinho','Michael','Horacio','Eugenio','Valdemar',
            'Moises','Toni','Eurico','António José','Serafim','Rui Pedro','Jacinto','Thiago','José Maria','Carlos Manuel','Octavio','Ismael','John','Fred','Kevin',
            'Diamantino','Amandio','Antonio Manuel','Nando','Virgilio','Nuno Miguel','Osvaldo','Quim','Amilcar','Junior','Romeu','Santiago','Beto','Armenio',
            'Ramiro','Maria','Ilidio','Silvio','Silva','Dani','Aurelio','Adérito','Matheus','Milton','Edson','Nelio','João Miguel','Acacio','Albano','Santos'
          ],
          last: [
            'Pontes','Rego','Mestre','Gama','Paulino','Portugal','Faustino','Fialho','Louro','Candeias','Anjos','Salgueiro','Paula','Coimbra','Catarino','Sanches',
            'Parreira','Simão','Novais','Jacinto','Menezes','Romão','Castanheira','Barradas','Rosado','Vilela','Raquel','Dantas','Moutinho','Fidalgo','Horta',
            'Tomé','Braz','Passos','Jardim','Vitorino','Madureira','Margarida','Raimundo','Moniz','Belo','Quaresma','Da Costa','Alberto','Cabrita','Tiago','Caeiro',
            'Catarina','Cavaco','Seabra','Vidal','Peres','De Oliveira','Bernardino','Assunção','Junior','Fortes','Pedroso','Lisboa','Conde','Amado','Joaquim',
            'Portela','Aleixo','Meneses','Marcelino','Aires','Seixas','Pessoa','Carrilho','Quintas','Maciel','Clemente','Mira','Gameiro','Lino','De Almeida',
            'Paixão','Queiroz','Ferro'
          ] },
    ],
    COL: [
        { r: 0,
          first: [
            'Alirio','Juan Esteban','Wilmar','Gonzalo','Jorge Luis','Juan Sebastian','Jhon Fredy','Libardo','Jefferson','Jaider','Leo','Giovanny','Alonso','Darwin',
            'Jhonny','Edward','Christian','Marco','Michael','Ernesto','Ronald','Ever','Jimmy','Rodolfo','Brandon','Eduar','Bryan','Leonel','Oswaldo','Carlos Mario',
            'Ruben Dario','Jeferson','Didier','Franklin','Pipe','Adolfo','Carlos Arturo','Estiven','Efrain','Edilberto','Frank','Mauro','Luis Miguel','Juan Felipe',
            'Dairo','Tomás','Cristhian','Yeferson','Jeisson','Diego Fernando','Bernardo','Reinaldo','Ramón','Luis Alfonso','Erick','Uriel','José Manuel','Willian',
            'Eliecer','John Jairo'
          ],
          last: [
            'Nieto','Benitez','Naranjo','Bravo','Polo','Montenegro','Meza','Caro','Salas','Posada','Melo','Lara','Ceballos','Fajardo','Campo','Leal','Ángel',
            'Espitia','Bohorquez','Rosero','Quiroga','Caballero','Chávez','Bustamante','Rendon','Barreto','Alarcon','Rico','Salgado','Quiñones','Castrillon',
            'Cuellar','Oviedo','Vallejo','Rubio','Barbosa','Saavedra','Prada','Montaño','Yepes','Velandia','Urrego','Rangel','Zuñiga','Flores','Ballesteros',
            'Pedraza','Aristizabal','Tamayo','Montero','Cantillo','Paz','Salamanca','Bejarano','Garces','Botero','Cardozo','Tabares','Taborda','Gamboa',
            'Valderrama','Olaya','Carreño','Chaparro','Martines','Monroy','Berrio','Bolivar','Villamil','Avendaño','Bustos','Aldana','Dominguez','Burbano',
            'Rodrigues','Alfonso','Pabon','Obando','Segura','Santana'
          ] },
    ],
    RUS: [
        { r: 0,
          first: [
            'Ravil','Rustem','Daniel','Rafael','Sultan','Sanek','Alim','Yakov','Ainur','Kurban','Nick','Erik','Shukhrat','Ilshat','Serg','Ramzan','Anzor','Dimon',
            'Vasiliy','Tolik','Khabib','Nurik','Arslan','George','Tagir','Garik','Ashot','Ilnar','Ahmed','Samir','Dilshod','Slavik','Dzhon','Salavat','Malik',
            'Makhmud','Filipp','Mike','Arthur','Alikhan','Yusup','Magamed','Ilgiz','Omar','Artemii','Sardor','Svyatoslav','Samvel','Ulugbek','Karim','Gasan',
            'Farkhod','Yarik','Tigran','Farid','Ivanov','Tim','Rail','Edgar','Farrukh'
          ],
          last: [
            
          ] },
    ],
    POL: [
        { r: 0,
          first: [
            'David','Czarek','Sylwek','Kris','Romek','Leon','Romuald','Radoslaw','Boguslaw','Kornel','Jędrzej','Wacław','Julian','Olaf','Borys','Czeslaw','Michael',
            'Seba','Mar','Mati','Mieczyslaw','Klaudiusz','Mario','Józek','Ariel','John','Lukas','Ivan','Mikolaj','Krzyś','Kajetan','Wiesiek','Joachim','Aleks',
            'Staszek','Kazik','Edmund','Oleksandr','Jasiek','Mietek','Oleg','Wladyslaw','Gerard','Bogumił','Bronisław','Alek','Tymoteusz','Bart','Bolesław','Peter',
            'Pan','Wlodzimierz','Rysiek','Amadeusz','Zenek','Roland','Dorian','Alfred','Włodek','Juliusz'
          ],
          last: [
            'Zaremba','Kula','Janus','Kowalewski','Kulik','Sienkiewicz','Kulesza','Wasilewski','Banaś','Urbański','Czyż','Głowacki','Jurek','Kaleta','Maćkowiak',
            'Markowski','Janiak','Baranowski','Gawlik','Cichoń','Chojnacki','Górka','Siwek','Kucharczyk','Filipiak','Kubik','Kacprzak','Hajduk','Szostak',
            'Walkowiak','Rzepka','Śliwa','Mikołajczak','Antczak','Janusz','Słowik','Szczepanik','Kubica','Cieślik','Malec','Janas','Bartczak','Konopka','Grzyb',
            'Lach','Brzozowski','Ziółkowski','Borek','Górecki','Nawrot','Kmiecik','Wolski','Kłos','Nowaczyk','Wolny','Buczek','Skrzypek','Stec','Biernat',
            'Stańczyk','Ciesielski','Szymczyk','Grzegorczyk','Janicki','Kostrzewa','Młynarczyk','Czajkowski','Witczak','Lena','Pietras','Banasiak','Dobosz','Kuc',
            'Wnuk','Szczygieł','Kasia','Białas','Piasecki','Juszczak','Kisiel'
          ] },
    ],
    CZE: [
        { r: 0,
          first: [
            'Lumír','Slávek','Míla','Juraj','Tibor','Nikolas','Míša','Bronislav','Jura','Vlasta','Oleg','Mario','Kája','Mike','Evžen','Vasil','Otto','Tobiáš',
            'Bohdan','Radoslav','Bob','Danny','Gabriel','Adrian','Bedřich','Alan','Paul','Albert','Karlos','Patrick','Marťas','Břetislav','Mikuláš','Pavol',
            'Jáchym','Maxim','Svatopluk','Milda','Artur','Arnošt','Jiřík','Tomík','Kevin','Sam','Andrey','Pepe','Mark','Ruslan','Pepino','Sergey','Marty','Nikita',
            'Leo','Eda','Julius','Andrei','Venda','Mojmír','Nicolas','Luke'
          ],
          last: [
            
          ] },
    ],
    HUN: [
        { r: 0,
          first: [
            'Miki','Szabi','Tivadar','Thomas','Szilágyi','Imi','George','Szűcs','Kocsis','Magyar','Fehér','Noel','Mohamed','Rácz','Ahmed','Pisti','Elek','Ágoston',
            'Gál','Jakab','Hegedűs','Oláh','Török','Joci','Levi','Renátó','Bíró','Boldizsár','Michael','Sipos','Illés','Pintér','Hunor','Beni','Zsigmond','Király',
            'Ede','Valentin','Elemér','Fodor','Gabi','Lukács','Gusztáv','Pista','Mohammad','Stefan','Gellért','Rajmund','Fülöp','Kelemen','Ambrus','Tom','Gáspár',
            'Fábián','Flórián','Ármin','Sebestyén','Roli','Katona','Szalai'
          ],
          last: [
            'Józsa','Patrik','Borsos','Sárközi','Edina','Erdős','Puskás','Galambos','Zsuzsa','Réka','Vivien','Mester','Jenei','Ilona','Tar','Angyal','Rita','Bakó',
            'Benkő','Hajnal','Ferencz','Boda','Radics','Fenyvesi','Lovas','Renáta','Lévai','Pusztai','Balazs','Csontos','Torma','Barabás','Gyarmati','Elek','Bodor',
            'Keresztes','Földi','Sandor','Sebők','Beáta','Pálfi','Bokor','Bernadett','Orsolya','Majoros','Beke','Istvan','Enikő','Szarka','Vigh','Kárpáti','Zoltan',
            'Tamas','Bodó','Brigitta','Zsófia','Csordás','Bakonyi','Asztalos','Gombos','Csapó','Kinga','Csorba','Petra','Veronika','Anett','Jozsef','Bán',
            'Bereczki','Sánta','Botos','Havasi','Sallai','Salamon','Kónya','Madarász','Nyári','Ágoston','Laczkó','Lendvai'
          ] },
    ],
    GRE: [
        { r: 0,
          first: [
            'Kiriakos','Paul','Teo','Artan','Agron','Singh','Michail','Gezim','Gerasimos','Lampros','Tolis','Miltos','Stergios','Hasan','Harry','Nadeem','Vladimir',
            'Gregory','Faisal','Ismail','Eduart','Besnik','Alkis','Waqas','Elton','Sami','Arjan','Iraklis','Toni','Periklis','Sokratis','Antreas','Robert','Alekos',
            'Sokol','Edmond','Kostantinos','Nasos','Viktor','Harris','Mihalis','Shahbaz','Naveed','Argiris','Dimitri','Petrit','Theo','Xrhstos','Yasir','Tony',
            'Leonard','Mpampis','Achilleas','Astrit','Shahzad','Stauros','Mian','Odysseas','Miri','Mirza'
          ],
          last: [
            'Munda','Dimas','Stathopoulos','Emin','Stamatiou','Bushi','Alla','Serif','Farooq','Kollias','Katsaros','Beqiri','Yusuf','Bregu','Noor','Bali',
            'Diamantopoulos','Georgopoulos','Biba','Kapa','Kalogeropoulos','Vasilopoulos','Mylonas','Theodoropoulos','Halili','Panagiotou','Jatt','Avramidis',
            'Irfan','Alexandros','Nikolli','Malaj','Lazarou','Mouratidis','Usman','Rizos','Daskalakis','Prendi','Kontou','Afghan','Marinos','Rajput','Doukas',
            'Sideri','Rapti','Karra','Lamaj','Bekir','Athanasiadis','Kontogiannis','Kanellopoulos','Anastasopoulos','Karaj','Sulaj','Chatzis','Spanou','Kosmidis',
            'Giannoulis','Ilias','Mohammadi','Sakellariou','Moraitis','Sidiropoulos','Lena','Hasa','Kasa','Michalopoulos','Rani','Michael','Deli','Georgakopoulos',
            'Roussou','Spyropoulos','Stamou','Gjata','Ghumman','Vasileiadis','Aslanidis','Kokkinos','Deda'
          ] },
    ],
    TUR: [
        { r: 0,
          first: [
            
          ],
          last: [
            'Sarıkaya','Karahan','Gökçe','Günay','Karadağ','Taşkın','Boz','Akman','Oğuz','Atalay','Akdeniz','Akdemir','Poyraz','Kandemir','Aygün','Uğur','Tuncer',
            'Altay','Gün','Atmaca','Turhan','Bingöl','Taşdemir','Aydoğdu','Sevinç','Erkan','Sevim','Kilic','Açıkgöz','Solmaz','Gür','Pehlivan','Çam','Kuru',
            'Akpınar','Ipek','Öner','Kutlu','Çağlar','Altın','Akkuş','Alp','Eser','Inan','Bolat','Sari','Koyuncu','Şener','Akçay','Sever','Parlak','Avci','Kuş',
            'Gedik','Ilhan','Şengül','Çakar','Uyar','Çimen','Soydan','Ertürk','Murat','Baba','Bakır','Varol','Emre','Oral','Başaran','Akay','Eker','Ahmet','Mercan',
            'Yüce','Demircan','Yeşil','Durak','Keser','Savaş','Bülbül','Karakoç'
          ] },
    ],
    URU: [
        { r: 0,
          first: [
            'Ale','Maicol','Felipe','Jesús','Enzo','Omar','Alexander','Fabricio','Rodolfo','Horacio','Emanuel','Milton','Ernesto','Braian','Lautaro','William',
            'Ramiro','Heber','Edgardo','Thiago','Alan','Tomás','Danilo','Luis Alberto','Ismael','Anibal','Anthony','Valentin','Hernan','Fabio'
          ],
          last: [
            'Camacho','Figueroa','Espinosa','De Souza','Rivas','Clavijo','Ferrari','Mora','Iglesias','Cabral','Pacheco','Ledesma','Toledo','Villalba','Ojeda',
            'Lorenzo','Mederos','Davila','Amaral','Mesa','Luzardo','Fontes','Da Costa','Colman','Bentancur','Rosano','Guerrero','Escobar','Valdez','Quiroga',
            'Ayala','Sequeira','Amaro','Pirez','Conde','Mello','Carrasco','Figueredo','Ibarra','Rodrigues','Maidana','Ocampo','Almada','Mendoza','Trinidad',
            'Burgos','Falero','Gallo','Dutra','Abreu'
          ] },
    ],
    ISR: [
        { r: 0,
          first: [
            'Ohad','Tamir','Gilad','Eitan','Itamar','Ofek','Majd','Roi','Ayman','Mark','Ziv','Shadi','Roni','Tamer','Niv','Mahmod','Ashraf','Roman','Yakov','Saleh',
            'Hamza','Hasan','Netanel','Sharon','Dror','Liran','Eliran','Sagi','Yehuda','Barak'
          ],
          last: [
            'Swisa','Naim','Dror','Natsheh','Stern','Aharoni','Jbareen','Michaeli','Abbas','Moyal','Badran','Avital','Tamir','Sultan','Harush','Regev','Sofer',
            'Tamimi','Zedan','Essa','Elimelech','Zoubi','Hadar','Shani','Amara','Erez','Asulin','Abo','Grinberg','Goren','Azzam','Ghanem','Yaseen','Mosa','Nir',
            'Abdallah','Rahamim','Greenberg','Goldman','Mhamed','Avitan','King','Dvir','Shamir','Pinto','Sapir'
          ] },
    ],
    IND: [
        { r: 0,
          first: [
            'Patel','Kuldeep','Yash','Ranjit','Amar','Munna','Subhash','Kishan','Sanjeev','Avinash','Shyam','Dev','Neeraj','Suman','Mani','Harsh','Shiv','Vishnu',
            'Pavan','Roshan','Narendra','Sanju','Kishor','Laxman','Rohan','Saurabh','Himanshu','Gautam','Abhi','Kunal'
          ],
          last: [
            'Sing','Rahul','Jena','Kadam','Majhi','Saikia','Srivastava','Suresh','Bhagat','Vaghela','Borah','Ramesh','Anand','Makwana','Mallick','Bharti','Jat',
            'Arya','Boro','Raut','Priya','Arora','Sardar','Tomar','Mehra','Garg','Bhatt','Swain','Sarma','Koli','Panda','Rajpoot','Upadhyay','Suthar','Halder',
            'Bisht','Laskar','Rajesh','Molla','Saifi','Ahir','Shaik','Khatun','Chandra','Gujjar','Thapa','Goyal','Tripathi','Rajak'
          ] },
        { r: 1,
          first: [
            
          ],
          last: [
            'Bhat'
          ] },
    ],
    MAS: [
        { r: 0,
          first: [
            'Mazlan','Aziz','Haikal','Farid','Andrew','Raymond','Zamri','Kumar','Farhan','Mohamed','Tony','Azrul','Boy','Jeff','Siva','Ramli','Nick','Nasir',
            'Fauzi','Jamal','Jacky','Zakaria','Danish','Ben','Rahman','Richard','Imran'
          ],
          last: [
            'Subramaniam','Abd Rahman','Iskandar','Adnan','Yeoh','Nazri','Johari','Sham','Mustafa','Asyraf','Naim','Fitri','Hidayah','Haziq','Salim','Mokhtar',
            'Abdul Rahman','Farhan','Irfan','Tamang','Jusoh','Afiq','Khalid','King','Ani','Sha','Husin','Kok','Aini','Suhaimi','Yunus','Mie','Mazlan','Jamil',
            'Lina','Kassim','Lay','Zaini','Yusuf','Zamri','Amirul','Soon','Majid','Hadi','Krishnan','Fahmi','Ghani'
          ] },
        { r: 1,
          first: [
            'Leong','Goh','Low'
          ],
          last: [
            'Chow','Chung','Khor'
          ] },
    ],
    INA: [
        { r: 0,
          first: [
            'Robert','Hartono','Abu','Bang','Richard','Hendry','Steven','Samuel','Dede','Eka','Willy','Rahmat','Faisal','Sigit','Arie','Hendro','Bagus','Ryan',
            'Made','Lukman','Albert','Mohamad','Kang','Firman','Moch','Alexander','Dicky','Angga','Rizal','Robby'
          ],
          last: [
            'Kho','Yani','Liu','Nur','Sutrisno','Mulyana','Anggraini','Agung','Sihombing','Aulia','Setyawan','Wahyu','Firdaus','Wang','Pribadi','Raharjo','Sofyan',
            'Sitorus','Hutabarat','Mulyono','Abidin','Herman','Sulaiman','Pasaribu','Sembiring','Hariyanto','Kusnadi','Bachtiar','Ayu','Riyanto','Cahyono',
            'Ningsih','Hermanto','Dwi','Yono','Silalahi','Herawati','Nurdin','Ling','Umar','Saleh','Noor','Usman','Situmorang','Satria','Andriani','Yap','Bali',
            'Andi','Basuki'
          ] },
    ],
    KOR: [
        { r: 0,
          first: [
            
          ],
          last: [
            'Jay','James','Suk','Goo','Eum','Pratama','Doo','Gim','Siregar','Mok','Chai','King','Kurniawan','Rhie','Kwag','Hoon','Sam','Kye','Yook','Nah',
            'Nguyenthi','Sheen','Chi','Ryan','Rla','Kweon','Leem','Wati','Putri','Dewi','Hee','Paul','Love','Gang','Eun','Lyu','Kum','Corp','Rizky','Jack','Art',
            'Kuk','Korea','Tea','Elizabeth','Dong','Chin','Young Jae','Devi','Bark'
          ] },
    ],
    EST: [
        { r: 0,
          first: [
            'Ivo','Gert','Dima','Hannes','Joosep','Argo','Roland','Alar','Mario','Ott','Egert','Joonas','Timo','Kert','Tauri','Raivo','Alexandr','Allar','Aleks',
            'Kalle','Mati','Paul','Erkki','Henry','Mattias','Kaur','Maxim'
          ],
          last: [
            'Kurg','Kärner','Sarv','Kaur','Võsu','Soosaar','Aru','Kesküla','Annus','Arro','Smith','Hansen','Lauri','Viira','Sokk','Kalmus','Aun','Kirss','Susi',
            'Abel','Kangro','Jõesaar','Liivak','Liivamägi','Silm','Saul','Lipp','Lehtla','Jalakas','Kikkas','Maasik','Schmidt','Hendrikson','Sirel','Saare','Nurk',
            'Lehtmets','Randmaa','Tooming','Lumiste','Anderson'
          ] },
        { r: 1,
          first: [
            'Rein','Kalev','Ain'
          ],
          last: [
            'Kovalenko','Maksimov','Novikov','Jegorov','Andrejev','Antonov','Semjonov','Makarov','Filippov'
          ] },
    ],
    MAR: [
        { r: 0,
          first: [
            
          ],
          last: [
            'Nassiri','Badr','Mansouri','Zin','Taha','Hasan','Mounir','Salam','Hayat','Salmi','Fadili','Imad','Lokita','Khan','Nasiri','Safi','Mamaha','Mourad',
            'Raji','Saber','Ikram','Rachidi','Crayzi','Omari','Marwan','Tanjawiya','Samira','Banani','Chahid','Rafik','Karima','Fadil','Rochdi','Farid','Lahlou',
            'Aicha','Hanane','Lotfi','Younes','El Alaoui','Nadia','Warda','Youness','Tetouani','Momo','Amzil','Wardi','Ilham','Nor','Barca'
          ] },
    ],
    AUS: [
        { r: 0,
          first: [
            'John','Chris','Andrew','Tom','Peter','Richard','Ben','Adam','Steve','Ian','Andy','Stephen','Alex','Sam','Robert','Simon','Dave','Joe','Jamie','Gary',
            'Matthew','Matt','Luke','Tony','George','Dan','Mike','Steven','Josh','Darren','Nick','Neil','Stuart','Rob','Harry','Thomas','Lewis','Jordan','Sean',
            'Anthony'
          ],
          last: [
            'Davies','Evans','Roberts','Robinson','Wright','Hughes','Green','Edwards','James','Lewis','Jackson','Clarke','Hall','Harris','Scott','Wood','Clark',
            'King','Moore','Turner','Hill','Ward','Cooper','Morgan','Morris','Watson','Young','Harrison','Baker','Allen','Bell','Phillips','Davis','Miller',
            'Parker','Price','Shaw','Simpson','Collins','Murray','Carter','Richardson','Cook','Marshall','Bailey','Gray','Griffiths','Adams','Graham','Richards',
            'Louise','Ellis','Cox','Foster','Rose','Robertson','Wilkinson','Russell','Mason','Reid','Chapman','Matthews','Powell','Rogers','Gibson','Mills','Webb',
            'Owen','Palmer','Thomson','Holmes','Knight','Barnes','Hunt','Hunter','Stevens','Lloyd','Jenkins','Johnston','Fisher','Hamilton','Butler','Fox','Dixon',
            'Grant','Walsh','Ross','Pearson','Barker','Andrews','Fletcher','Bradley','Elliott','Kennedy','Reynolds','West','Henderson','Armstrong','Howard','Burns',
            'Mcdonald','Ford','Oneill','Day','Saunders','Brooks','Lawrence','Cole','Dawson','Payne','Obrien','Morrison','May','Woods','Williamson','Black','Pearce',
            'Davidson','Atkinson','Spencer','Byrne','Doyle','Lynch','Oconnor','Dunne','Mccarthy','Brennan','Daly','Burke','Nolan','Osullivan','Farrell','Power',
            'Kavanagh','Quinn','Carroll','Gallagher','Flynn','Fitzgerald','O Connor','Connolly','Whelan','O Brien','Reilly','Doherty','Duffy','Kenny','Brady',
            'O Sullivan','Healy'
          ] },
    ],
    NZL: [
        { r: 0,
          first: [
            'David','Paul','John','James','Michael','Tom','Peter','Richard','Jack','Ben','Adam','Steve','Andy','Stephen','Alex','Sam','Robert','Dave','Joe','Jamie',
            'Gary','Alan','Matt','Luke','George','Dan','Mike','Steven','Josh','Darren'
          ],
          last: [
            'Jones','Davies','Evans','Johnson','Roberts','Thompson','Robinson','Wright','White','Hughes','Green','Edwards','James','Lewis','Jackson','Clarke',
            'Hall','Wood','King','Moore','Turner','Hill','Ward','Cooper','Morgan','Morris','Kelly','Watson','Young','Harrison','Baker','Allen','Bell','Phillips',
            'Davis','Miller','Murphy','Parker','Price','Shaw','Simpson','Collins','Murray','Carter','Richardson','Cook','Marshall','Bailey','Gray','Griffiths',
            'Adams','Graham','Richards','Louise','Ellis','Cox','Foster','Rose','Robertson','Wilkinson','Russell','Mason','Reid','Chapman','Matthews','Powell',
            'Rogers','Gibson','Mills','Webb','Owen','Palmer','Thomson','Holmes','Knight','Barnes','Hunt','Harvey','Hunter','Stevens','Byrne','Walsh','Doyle',
            'Obrien','Lynch','Oconnor','Dunne','Mccarthy','Brennan','Daly','Burke','Nolan','Osullivan','Kennedy','Farrell','Oneill','Power','Kavanagh','Quinn',
            'Carroll'
          ] },
    ],
    ZIM: [
        { r: 0,
          first: [
            
          ],
          last: [
            'Jones','Williams','Taylor','Davies','Wilson','Evans','Johnson','Roberts','Thompson','Robinson','Wright','White','Hughes','Green','Martín','Edwards',
            'James','Lewis','Jackson','Clarke','Hall','Harris','Scott','Wood','Clark','King','Moore','Turner','Hill','Ward','Cooper','Morgan','Morris','Kelly',
            'Anderson','Young','Harrison','Baker','Allen','Mitchell','Bell','Phillips','Davis','Miller','Murphy','Stewart','Parker','Price','Shaw','Simpson',
            'Collins','Murray','Carter','Richardson','Cook','Bailey','Gray','Griffiths','Adams','Graham'
          ] },
    ],
    VEN: [
        { r: 0,
          first: [
            'Juan','Jorge','David','Camilo','Jhon','Cristian','Javier','Alexander','Fernando','Julián','Mauricio','Jairo','William','Alex','Felipe','Jaime',
            'Juan Carlos','Edwin','Wilson','Víctor','Brayan','César','Fabián','Nelson','Kevin','Gustavo','Alvaro','Sergio','Eduardo','Orlando','Leonardo','Alberto',
            'Esteban','Julio','Mario','Edgar','Nicolás','Juan David','Omar','Héctor'
          ],
          last: [
            'López','Gómez','Sánchez','Ramírez','Díaz','Torres','Moreno','Vargas','Muñoz','Ortiz','Castro','Valencia','Quintero','Jiménez','Ruiz','Romero',
            'Gutiérrez','Morales','Álvarez','Herrera','Suárez','Castillo','Arias','Rivera','Marin','Zapata','Osorio','Peña','Parra','Guerrero','Cárdenas','Florez',
            'Jaramillo','Mosquera','Acosta','Londoño','Correa','Reyes','Cruz','Ramos','Molina','Cortés','Ortega','Mora','Escobar','Vásquez','Contreras','Ríos',
            'Velásquez','Guzmán','Sierra','Rincón','Méndez','Castañeda','Lozano','Silva','Gonzales','Fernández','Castaño','Orozco','Garzon','Caicedo','Beltran',
            'Hurtado','Velez','León','Delgado','Vega','Franco','Bernal','Pineda','Carvajal','Murillo','Calderon','Acevedo','Trujillo','Soto','Patiño','Avila',
            'Duque','Cano','Buitrago','Vanegas','Sandoval','Barrera','Aguirre','Duarte','Gallego','Forero','Camacho','Gil','Durán','Palacios','Vergara','Cordoba',
            'Padilla','Zambrano','Villa','Sarmiento','Carrillo'
          ] },
    ],
};

// Node/Build-Kontext optional exportierbar (im Browser-Monolith ohne Wirkung):
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NAME_POOLS_BY_NATION, NATION_NAME_FALLBACK, NAME_TAILS_BY_NATION };
}
