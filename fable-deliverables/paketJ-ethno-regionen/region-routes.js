// ============================================================================
// Paket J — region-routes.js: Vornamen-Router je Ethno-Region (D1 + D2)
//
// EINBAU (Opus, build-names-v3.js):
//   1. NEU: `routeFirst` in CFG je Nation — wird in processNation Schritt 3
//      NUR auf kind==='first' angewandt. `route` gilt ab dann NUR noch für
//      kind==='last' (die bisherige Doppel-Anwendung war der Bug: Nachnamen-
//      Regexe matchen keine Vornamen → alles fiel in Region 0).
//        const routes = kind === 'first' ? cfg.routeFirst : cfg.route;
//   2. NEU: Ziel darf ein ARRAY sein ([regex, [0,1]]) = "geteilter Name":
//      der Eintrag wird in JEDE genannte Region kopiert (gleiches Gewicht).
//      Begründung: "Kevin"/"Thomas"/"David" sind in Flandern UND Wallonie
//      belegt — Einfach-Zuordnung würde die Minderheitsregion künstlich
//      verarmen. Implementierung in Schritt 3/5:
//        e.r = ziel;  // int ODER int[]
//        // Schritt 5: für Arrays je Region eine Kopie pushen; zählt 1× für
//        // placed/torso (sonst frisst Duplikation die Caps).
//   3. Erster Regex-Treffer gewinnt (wie bisher). OPS.move gewinnt über
//      routeFirst (wie bisher — moves laufen NACH route).
//   4. banFirst-Änderungen (D2): siehe BAN_FIRST unten — ersetzt die
//      bisherigen banFirst der genannten Nationen komplett.
//   5. GER: ROUTE_LAST_ADD.GER an cfg.route anfügen UND in banLast
//      NORDIC_FOREIGN durch NORDIC_FOREIGN_OHNE_TUERKISCH ersetzen
//      (sonst frisst der Ban die türkischen Nachnamen, bevor die Route greift).
//
// KLASSIFIKATIONS-BELEG: METHODIK.md §2 (je Nation: Quelle der Zuordnung,
// Unsicherheiten mit ⚠ markiert). Gegen fore_agg.csv (600 Namen/Land)
// verifiziert via classify-forenames.js (gleicher Ordner).
// ============================================================================
'use strict';

// ── GER: türkisch-deutsche Vornamen (Daten: 53 Treffer in DE-Top-600,
//    Ali #45 … Ilhan #561). Ersetzt das bisherige banFirst (unterdrücken → trennen).
//    NICHT enthalten: Mohammed/Mohammad/Ahmad/Omar (arabische, nicht türkische
//    Formen — bleiben Filter, s. BAN_FIRST.GER und METHODIK §3.1).
const GER_TURKISH_FIRST = /^(Ali|Mehmet|Mustafa|Murat|Ahmet|Hasan|Hüseyin|Ibrahim|İbrahim|Muhammed|Osman|Emre|Can|Cem|Deniz|Kadir|Kemal|Yusuf|Halil|Süleyman|Ismail|İsmail|Recep|Fatih|Serkan|Erkan|Metin|Sinan|Volkan|Hakan|Burak|Baris|Barış|Onur|Ugur|Uğur|Cengiz|Orhan|Adem|Aydin|Aydın|Bülent|Dursun|Erdal|Ferhat|Gökhan|Harun|Ilhan|İlhan|Kenan|Levent|Mesut|Nuri|Ramazan|Salih|Tarkan|Yasin|Zeki|Tolga|Emrah|Erol|Selim|Taner|Tuncay|Umut|Yavuz|Alper|Berkay|Caner|Ercan|Ergün|Fikret|Furkan|Güven|Kaan|Mert|Oguz|Oğuz|Özcan|Özgür|Sedat|Sefa|Semih|Tamer|Tayfun|Ufuk|Veli|Yakup|Yilmaz|Savas|Savaş|Suat|Şahin|Sahin|Cemal|Cemil|Coskun|Coşkun|Devrim|Dogan|Doğan|Ender|Engin|Ensar|Efe|Eren|Arda|Yiğit|Yigit|Berat|Emir|Talha|Bilal|Cihan|Serdar|Tuncer|Burhan|Bayram-?\w*|Turgay|Turgut|Vedat|Yücel|Yucel|Erhan|Selçuk|Selcuk|Tayfun|Ozan|Görkem|Gorkem|Berkant|Doruk|Alperen)$/i;

// ── GER: türkische Nachnamen → Region 1 (Daten: Yilmaz DE-#43 mit 4724,
//    40 Treffer in DE-Top-1500). Identisch mit dem bestehenden TURKISH-Regex
//    aus build-names-v3.js — dort aus banLast (via NORDIC_FOREIGN) LÖSEN.
const GER_TURKISH_LAST = /^(Yilmaz|Yılmaz|Kaya|Demir|Sahin|Şahin|Celik|Çelik|Yildiz|Yıldız|Yildirim|Yıldırım|Ozturk|Öztürk|Aydin|Aydın|Ozdemir|Özdemir|Arslan|Dogan|Doğan|Kilic|Kılıç|Aslan|Cetin|Çetin|Kara|Koc|Koç|Kurt|Ozkan|Özkan|Simsek|Şimşek|Polat|Erdogan|Erdoğan|Yalcin|Yalçın|Gunes|Günes|Güneş|Bulut|Tas|Taş|Caliskan|Çalışkan|Turan|Tekin|Aktas|Aktaş|Unal|Ünal|Avci|Avcı|Sen|Şen|Acar|Guler|Güler|Erdem|Ates|Ateş|Korkmaz|Özer|Ozer|Karaca|Toprak|Yücel|Yucel|Sönmez|Sonmez|Duman|Aksoy|Bozkurt|Keskin|Kaplan|Öz|Uçar|Ucar|Ekinci|Erturk|Ertürk|Sari|Sarı|Uzun|Yavuz|Bal|Bayram|Sezer|Gül|Gul|Özcan|Ozcan|Yüksel|Yuksel|Yigit|Yiğit|Yasar|Yaşar|Demirci|Altun|Demirel|Eren|Güngör|Gungor|Akin|Akın|Yaman|Alkan|Erol|Isik|Işık|Gündüz|Gunduz|Aksu|Cetinkaya|Çetinkaya|Karatas|Karataş|Dursun|Karaman|Akbulut|Karabulut|Karakaya|Aydemir|Durmaz|Topal|Gök|Gok|Bayrak|Usta|Duran|Elmas|Tanriverdi|Kocak|Koçak|Colak|Çolak|Kilinc|Kılınç|Baran|Inan|İnan|Soylu|Turk|Türk|Yeniceri|Öcal|Ocal)$/i;
// ⚠ Kaplan (dt.-jüdisch UND türkisch) und Duran (spanisch UND türkisch) sind ambig —
//   in den DE-Daten dominiert die türkische Lesart (Rang 562/1171), daher → r1.
//   -oglu-Namen (Eroglu #1385) fallen weiter dem BALKAN-Ban zum Opfer (Ban läuft vor
//   Route) — hingenommen: gedroppt ist besser als falsch platziert.

// ── FRA R1 (maghrebinisch/westafrikanisch): bestehende 23er-Route + alle in
//    FR-Top-600 belegten arabischen/westafrikanischen Vornamen (Sichtung 2026-07-17;
//    Samir #144 … Nadir #508). Yanis/Yannis: in FR-Kontext algerisch-kabylisch belegt.
const FRA_ARAB_WAF_FIRST = /^(Mohamed|Mohammed|Mehdi|Karim|Yanis|Yannis|Rayan|Sami|Samy|Bilal|Bilel|Ibrahim|Mamadou|Moussa|Amine|Amin|Hamza|Sofiane|Youssef|Youcef|Abdoulaye|Ousmane|Oumar|Yassine|Yacine|Rachid|Farid|Nabil|Malik|Idriss|Driss|Souleymane|Ahmed|Ali|Omar|Hassan|Said|Abdel\w*|Samir|Kamel|Kamal|Walid|Mourad|Aziz|Hakim|Salim|Hamid|Mustapha|Adel|Hicham|Hichem|Kader|Khalid|Khaled|Younes|Djamel|Salah|Mounir|Nassim|Anis|Abdou|Nordine|Reda|Amar|Habib|Fouad|Ismael|Ismail|Jamel|Jamal|Zakaria|Issa|Ilyes|Ilias|Tarek|Tarik|Abdallah|Samba|Mahmoud|Fares|Issam|Moh|Moha|Rabah|Nadir|Mamou|Boubacar|Aboubacar|Sekou|Sékou|Cheikh|Seydou|Bakary|Lamine|Adama|Tidiane|Demba|Alioune|Modou|Sidi|Brahim|Aissa|Aïssa|Majid|Mejdi|Rafik|Riad|Ryad|Sabri|Slimane|Soufiane|Toufik|Wahid|Yazid|Zine|Zoheir|Noureddine|Lakhdar|Larbi|Madani|Mokhtar|Marouane|Ayoub|Anas|Wassim|Nail|Naïl|Imad|Adil|Elias)$/i;

// ── GBR R1 (britisch-südasiatisch): Daten GB-Top-600 (Ali #93, Mohammed #96,
//    Abdul #138 …) + gängige Sikh-/Hindu-/pakistanische Formen aus der Tail-Masse.
const GBR_SOUTH_ASIAN_FIRST = /^(Mohammed|Mohamed|Muhammad|Mohammad|Ali|Ahmed|Ahmad|Abdul\w*|Imran|Hassan|Hussain|Omar|Umar|Usman|Raj|Amir|Aamir|Raja|Khalid|Hamza|Bilal|Asif|Amit|Tariq|Ravi|Shahid|Sajid|Rizwan|Kamran|Adil|Zain|Zayn|Waqar|Wasim|Arjun|Sanjay|Anil|Deepak|Rakesh|Vijay|Kiran|Sandeep|Gurpreet|Harpreet|Jaspreet|Manpreet|Amandeep|Navdeep|Sukhdev|Baljit|Kuldip|Rajinder|Surinder|Harjinder|Jagdish|Ashok|Dinesh|Ramesh|Suresh|Mahesh|Rajesh|Naveed|Nadeem|Salman|Yasir|Zahid|Farhan|Irfan|Aziz|Azhar|Haroon|Junaid|Kashif|Nasir|Qasim|Saqib|Shakeel|Sohail|Tahir|Wajid|Zafar|Zeeshan|Aryan|Dev|Kian|Aman|Jay|Rohan|Krish|Arun|Vinod|Vivek|Nikhil|Rahul|Pritam|Baldev|Harvinder|Jasvir|Kulwinder|Parminder|Ranjit|Satnam|Sukhwinder|Talvinder)$/i;

// ── BEL: dreiteilig — distinkt wallonisch/frankophon (R0), distinkt flämisch (R1),
//    geteilt [0,1]. Quelle: BE-Top-600 gesichtet; Zuordnung nach Namensform
//    (frz. vs. ndl. Form), Detailbelege METHODIK §2.1.
const BEL_FR_FIRST = /^(Jean|Jean-\w+|Michel|Philippe|Nicolas|Christophe|Olivier|Alain|Pierre|Pascal|Julien|Laurent|Thierry|Maxime|Didier|Louis|Arnaud|Jacques|Bernard|Alexandre|Serge|Cedric|Cédric|Antoine|Quentin|Xavier|Mathieu|Frederic|Frédéric|Guillaume|Dominique|Sebastien|Sébastien|François|Francois|Gilles|Nathan|Fabrice|Benoit|Benoît|Romain|Claude|Denis|André|Andre|Yves|Théo|Theo|Damien|Etienne|Étienne|Gauthier|Amaury|Renaud|Baptiste|Corentin|Florent|Florian|Fabien|Aurélien|Aurelien|Stéphane|Stephane|Loïc|Loic|Cyril|Gaël|Gael|Jérôme|Jerome|Ludovic|Émile|Emile|Gérard|Gerard|Fernand|Gaston|Hervé|Herve|Raphaël|Raphael|Tanguy|Thibault|Thibaut|Valentin|Adrien|Grégory|Geoffrey|Geoffroy|Vivien|Léon|Leon|Lionel|Marius|Gustave|Hubert|Ghislain|Firmin|Achille|Edmond|Aimé|Aime|Anatole|Arsène|Arsene|Clément|Clement|Lucien|Auguste|Eugène|Eugene|Félicien|Felicien|Octave|Oscar|Jules|Hugues|Basile|Timéo|Timeo|Eliott|Sacha|Noé|Noe|Mael|Maël|Evan|Ethan|Tiago)$/i;
const BEL_FL_FIRST = /^(Jan|Bart|Dirk|Johan|Steven|Wim|Geert|Koen|Eddy|Stijn|Pieter|Kristof|Kris|Jeroen|Sven|Kurt|Filip|Bert|Ronny|Maarten|Jens|Bram|Hans|Niels|Wouter|Davy|Glenn|Jos|Lieven|Frederik|Jurgen|Jürgen|Bjorn|Björn|Ruben|Rudi|Dries|Dieter|Jef|Joris|Ludo|Gert|Marnix|Wannes|Ward|Senne|Seppe|Lowie|Wout|Arne|Stan|Staf|Rik|Piet|Frans|Herman|Willem|Werner|Tuur|Brecht|Maxim|Robbe|Lander|Jelle|Sander|Toon|Tijs|Thijs|Gunther|Günther|Kobe|Lennert|Tom|Peter|Danny|Nick|Kenny|Andy|Gunter|Guido|Marnick|Bavo|Cas|Daan|Emiel|Ferre|Gilles-?Jan|Ivo|Jonas|Joost|Jorne|Kasper|Kjell|Lars|Lennart|Lorenz|Michiel|Milan|Niel|Raf|Ramses|Robrecht|Siebe|Simon-?Pieter|Stef|Tibo|Thibo|Vic|Victor-?Jan|Warre|Wesley|Yentl|Sepp|Kamiel|Miel|Leander|Xander|Yorbe|Cedrik)$/i;
const BEL_SHARED_FIRST = /^(Marc|Patrick|David|Kevin|Thomas|Luc|Tim|Eric|Erik|Michael|Vincent|Daniel|Paul|Jonathan|Christian|Frank|Simon|Alex|Chris|Benjamin|Robin|Bruno|Dylan|Anthony|Steve|Sam|Nico|Robert|Willy|Mario|John|Dimitri|Ben|Roger|Mike|Lucas|Francis|Stefan|Martin|Gregory|Yannick|Freddy|Marcel|Hugo|Tony|Jo|Mathias|Matthias|Jimmy|Guy|Noah|Arthur|Alexis|Axel|Brian|Bryan|Cameron|Dean|Dennis|Diego|Elias|Emma?nuel|Enzo|Ian|Igor|Ilias|Jason|Jordan|Jordy|Joshua|Julian|Kenneth|Kevin|Kyle|Liam|Logan|Lucas|Manuel|Mats|Mauro|Nolan|Olivier-?Jan|Oscar|Owen|Randy|Remco|Ricky|Ronald|Ryan|Samuel|Sean|Stephan|Terry|Timothy|Tommy|Vince|Wesley|Yannis|Younes)$/i;

// ── SUI: vierteilig + drei Shared-Klassen. Quelle: CH-Top-600 gesichtet.
//    ⚠ Marco/Luca/Fabio/Sandro/Dario sind in der Deutschschweiz Modenamen
//    (Odermatt, Hänni, Cologna) → geteilt [0,2], NICHT exklusiv Tessin.
const SUI_FR_FIRST = /^(Michel|Philippe|Alain|Olivier|Laurent|Nicolas|Cédric|Cedric|Didier|Romain|Julien|Christophe|Pierre|Yves|Thierry|Claude|Jean|Jean-\w+|Sébastien|Sebastien|Stéphane|Stephane|Nathan|Théo|Theo|Alexandre|Sylvain|Loïc|Loic|Gaël|Gael|Damien|Baptiste|Frédéric|Frederic|Ludovic|Jérôme|Jerome|Gilles|Blaise|Xavier|Guillaume|Antoine|Arnaud|Benoit|Benoît|Cyril|Fabrice|Grégory|Gregory|Hervé|Herve|Lionel|Maxime|Mickaël|Mickael|Quentin|Thibault|Thibaut|Valentin|Yann|Yvan|Steve|Jonathan|Anthony|Bastien|Célien|Celien|Dylan|Florent|Gaétan|Gaetan|Geoffrey|Guy|Hughes|Hugues|Jacques|Jordan|Kilian?|Ken|Lucien|Marius|Mathieu|Matthieu|Noé|Noe|Norbert|Régis|Regis|Serge|Vivien|Aurèle|Aurele|Aurélien|Aurelien|Emile|Émile|André|Andre|René|Rene|Denis|Bernard|Gérard|Gerard|Roland|Georges|Henri|Louis|Armand|Edouard|Édouard|Ernest|Fernand|Gustave|Léon|Leon|Marcel-?Ange|Maurice|Raymond|Robert-?Louis)$/i;
const SUI_IT_FIRST = /^(Antonio|Giuseppe|Francesco|Alessandro|Claudio|Roberto|Salvatore|Stefano|Michele|Giovanni|Angelo|Davide|Nicola|Franco|Mauro|Luigi|Paolo|Matteo|Gianni|Loris|Alessio|Massimo|Fabrizio|Gianluca|Gian-?\w*|Mattia|Nicolò|Nicolo|Gabriele|Simone|Pietro|Carlo|Sergio|Andrea|Emilio|Enzo|Ezio|Fausto|Federico|Fulvio|Giacomo|Giordano|Giorgio|Giulio|Graziano|Ivano|Lorenzo|Luciano|Marcello|Mario|Maurizio|Mirko|Moreno|Nando|Oreste|Orlando|Osvaldo|Ottavio|Pierino|Pierluigi|Raffaele|Renato|Renzo|Riccardo|Rocco|Romano|Rosario|Sandro-?\w+|Saverio|Silvio|Tiziano|Tullio|Ugo|Umberto|Valerio|Vincenzo|Vito|Vittorio|Aldo|Alfio|Alfredo|Amedeo|Attilio|Bruno-?\w+|Cesare|Corrado|Cosimo|Dante|Dino|Domenico|Donato|Edoardo|Elio|Emanuele|Ennio|Erminio|Ernesto|Ettore|Flavio|Gaetano|Gennaro|Gerardo|Germano|Gilberto|Gino|Girolamo|Guido|Italo|Leonardo|Livio|Marino|Michelangelo|Nino|Nunzio|Orazio|Paride|Pasquale|Patrizio|Primo|Quinto|Remigio|Rodolfo|Romeo|Ruggero|Sabato|Salvo|Santo|Saul|Sebastiano|Secondo|Serafino|Settimo|Severino|Silvano|Stelio|Teodoro|Tommaso|Ubaldo|Valentino|Virgilio)$/i;
const SUI_PT_FIRST = /^(Tiago|Nuno|Diogo|Rui|João|Joao|Filipe|Duarte|Vasco|Afonso|Paulo|Pedro|Ricardo-?\w+|Gonçalo|Goncalo|Henrique|Vitor|Vítor|Joaquim|Amândio|Amandio|Belmiro|Custódio|Custodio|Domingos|Fernando-?José|Hélder|Helder|Leandro|Márcio|Marcio|Nelson|Rúben|Telmo|Valter|Wilson|Américo|Americo|Ângelo|Anselmo|Armindo|Artur|Aurélio|Avelino|Baltasar|Bento|Camilo|Cândido|Candido|Celso|Cristiano|Delfim|Dinis|Elísio|Elisio|Eusébio|Eusebio|Evaristo|Faustino|Feliciano|Firmino|Florindo|Fortunato|Frederico|Gaspar|Gilberto-?\w+|Gustavo|Heitor|Hermínio|Herminio|Hilário|Hilario|Horácio|Horacio|Humberto|Ilídio|Ilidio|Inácio|Inacio|Isidro|Jaime-?\w+|Jorge-?Miguel|Justino|Ladislau|Laurindo|Leonel|Lourenço|Lourenco|Manuel-?\w+|Marcelino|Martinho|Matias|Maximino|Norberto|Olívio|Olivio|Onofre|Orlando-?\w+|Óscar-?\w+|Patrício|Patricio|Plácido|Placido|Prazeres|Quintino|Raul|Reinaldo|Renato|Rogério|Rogerio|Rosário|Rosario|Rufino|Salvador|Samuel-?\w+|Saúl|Serafim|Silvério|Silverio|Silvino|Teodósio|Teodosio|Teófilo|Teofilo|Tomás|Tomé|Tome|Valdemar|Valentim|Ventura|Vicente|Virgílio|Virgilio|Vitorino|Xavier-?\w+|Zeferino)$/i;
const SUI_SHARED_DE_FR = /^(Pascal|Marcel|Raphael|Raphaël|Yannick|Vincent|Eric|Éric|Denis-?\w*|Gabriel|Samuel|Robin|Joël|Joel|Kevin|Alain-?\w+)$/i;
const SUI_SHARED_DE_IT = /^(Marco|Luca|Fabio|Sandro|Dario|Nino-?\w+|Reto-?\w+|Remo|Silvan-?o?|Elia|Nevio|Livio-?\w+|Timo-?\w+|Diego|Ivan|Toni)$/i;
const SUI_SHARED_ALL = /^(David|Michael|Patrick|Daniel|Thomas|Simon|Alex|Nico|Jonas|Manuel|Oliver|Dominik|Dominic|Roman|Adrian|Fabian|Florian|Leo|Leon|Julian|Tim|Tom|Max|Nils|Sascha|Sven|Chris|Christian|Martin|Stefan-?\w*|Benjamin|Jan|Lukas|Lucas|Matthias|Mathias|Mike|Andy|Sebastian|Tobias|Philipp|Felix|Noah|Elias|Levin|Nevin|Andrin|Laurin|Jannik|Yanik|Janick|Sandro-?\w+)$/i;

// ── CAN: distinkt Québec (R1), Neukanadier — AUSBAU 2026-07-17: r2 aufgespalten
//    in r2 südasiatisch / r3 ostasiatisch (BRIEF-AUSBAU D2: 1 von 27 CAN-Fahrern
//    hieß „Sandeep Tsang"). Prinzip: frz. Schreibform → R1 (Marc/Mark, Nicolas/
//    Nicholas, Denis/Dennis, Philippe/Philip trennen die Regionen sauber).
const CAN_QC_FIRST = /^(Jean|Jean-\w+|Marc-\w+|Pierre-\w+|Louis-\w+|Charles-\w+|Claude|Jacques|Gilles|Marcel|Alexandre|Mathieu|Sylvain|Guillaume|François|Francois|Frédéric|Frederic|Pascal|Réjean|Rejean|Yves|Luc|Pierre|Michel|Denis|Stéphane|Stephane|Éric|Sébastien|Sebastien|Benoit|Benoît|Ghislain|Gaétan|Gaetan|Fernand|Normand|Gérard|Gerard|Maxime|Étienne|Etienne|Félix|Émile|Emile|Alexis|Cédric|Cedric|Patrice|Rémi|Remi|Rémy|Remy|Serge|Antoine|Hugo|Thierry|René|Rene|André|Andre|Yvan|Roch|Fabien|Julien|Nicolas|Philippe|Christophe|Jérémie|Jeremie|Jérôme|Jerome|Olivier|Marc|Mathis|Thomas-?\w+|Raphaël|Raphael|Léo|Leo|Loïc|Loic|Yannick|Vincent-?\w+|Xavier|Sacha|Samu?el-?\w+|Tristan|Zachary-?\w+|Dominique|Bernard|Bertrand|Bruno|Camille|Armand|Aurèle|Aurele|Conrad|Damien|Delphis|Donat|Edgar|Edmond|Eugène|Eugene|Ferdinand|Florent|Gaston|Georges|Guy|Henri|Hervé|Herve|Honoré|Honore|Jocelyn|Laurent|Lionel|Ludovic|Marius|Maurice|Napoléon|Napoleon|Octave|Onésime|Onesime|Ovila|Philémon|Philemon|Placide|Réal|Real|Rodrigue|Roland|Romain|Rosaire|Théo|Theo|Ulric|Wilfrid|Zéphirin|Zephirin|Mathias-?\w+|Alain|Didier|Fabrice|Gaël|Gael|Steeve)$/i;
// AUSBAU (ersetzt CAN_NEW_FIRST): südasiatisch → r2. Die 9 Pinyin-Tokens
// (Wei/Jun/Ming/Feng/Hao/Jin/Cheng/Yong/Xin) sind raus — sie hatten 0 % Ziehmasse
// (kommen in den CA-Vornamendaten nicht vor) und gehören zu r3.
const CAN_SA_FIRST = /^(Mohamed|Mohammed|Mohammad|Muhammad|Ali|Ahmed|Ahmad|Omar|Hassan|Hussein|Amir|Syed|Raj|Arjun|Vikram|Nikhil|Rohan|Sanjay|Amit|Anil|Rahul|Karan|Aryan|Krish|Gurpreet|Harpreet|Jaspreet|Manpreet|Amandeep|Navdeep|Sandeep|Rajesh|Suresh|Ramesh|Deepak|Vijay|Ravi|Kiran|Bilal|Hamza|Usman|Imran|Tariq|Khalid|Zain|Karim|Samir|Rashid|Faisal|Waleed|Yusuf|Ibrahim|Mustafa|Abdullah|Abdul\w*|Harsh|Aditya|Akshay|Ankit|Gaurav|Kunal|Manish|Mayank|Neeraj|Piyush|Pranav|Rohit|Sahil|Siddharth|Varun|Vishal|Jaswinder|Kulwinder|Parminder|Ranjit|Sukhwinder|Baljit|Davinder|Gurdeep|Harjit|Iqbal|Kirpal|Mohinder|Rajinder|Surinder)$/i;
// AUSBAU: ostasiatische Vornamen r3 — zwei Sorten:
// (a) Pinyin/Kantonesisch/Viet/Koreanisch (1,5. Generation; in den CA-Daten
//     praktisch masselos → wirken nur über den kuratierten r3-Kopf, region-defs.js);
const CAN_EA_PINYIN_FIRST = /^(Wei|Jun|Ming|Feng|Hao|Jin|Cheng|Yong|Xin|Kai|Tao|Lei|Peng|Minh|Duc|Jae|Dong-?\w*|Ho-?\w+)$/i;
// (b) HK-typische westliche Rufnamen (2. Generation; Daten-Realität wie MAS_CN_FIRST:
//     chinesisch-kanadische Fahrer heißen Kevin/Jason, nicht Xiu) → GETEILT [0,3],
//     denn dieselben Namen sind legitim anglo. Disjunkt zu CAN_SHARED_FIRST halten!
const CAN_EA_WESTERN_FIRST = /^(Kelvin|Alvin|Calvin|Wilson|Winston|Desmond|Edmund|Melvin|Elvin|Terence|Stanley|Nelson|Raymond|Sunny|Jacky|Hank)$/i;
// AUSBAU: [0,1] → [0,1,3] — die internationale Restmasse (David/Kevin/Justin …)
// ist anglo UND franko UND ostasiatisch-kanadisch belegt (Bsp. Samantha Tan,
// chinesisch-kanadische GT-Fahrerin — westlicher Rufname). NICHT r2: dessen
// Daten-Vornamensmasse ist zu 69 % südasiatisch, der westliche Anteil kommt
// dort aus dem kuratierten Kopf (Ryan/Justin/Kevin/Daniel, bleibt).
const CAN_SHARED_FIRST = /^(Martin|Simon|David|Daniel|Samuel|Gabriel|Nathan|Vincent|Patrick|Eric|Erik|Felix|Dominic|Robert|Richard|Charles|Victor|Jonathan|Kevin|Anthony|Benjamin|Christian|Noah|Liam-?\w*|Lucas|Alex|Adam|Marco?us|Justin|Joel|Olivier-?\w+|William|Zachary|Jacob|Tommy|Steve|Danny|Dave|Mario|Bruno|Denis-?\w+|Michael-?\w+)$/i;

// ── ESP: Katalanisch (R1), Baskisch (R2). Distinkte Sprachformen — die
//    kastilische Parallelform bleibt R0 (Jordi/Jorge, Josep/José, Albert/Alberto).
const ESP_CAT_FIRST = /^(Jordi|Joan|Josep|Marc|Xavi|Sergi|Gerard|Arnau|Pau|Oriol|Aleix|Pol|Roger|Albert|Miquel|Manel|Jaume|Quim|Biel|Cesc|Martí|Marti|Ferran|Nil|Guillem|Genís|Genis|Roc|Ot|Lluís|Lluis|Ricard|Vicent|Oleguer|Jofre|Ponç|Ponc|Bernat|Blai|Bonaventura|Eudald|Grau|Ignasi|Isidre|Jacint|Narcís|Narcis|Nofre|Pere|Rafel|Salvador-?\w+|Sergi-?\w+|Vicenç|Vicenc|Aniol|Blai|Eloi|Iu|Jan-?\w+|Lluc|Magí|Magi|Marçal|Marcal|Ori|Quirze|Roald|Teo-?\w+)$/i;
const ESP_BAS_FIRST = /^(Mikel|Iker|Ander|Unai|Aitor|Asier|Gorka|Jon|Ion|Iñaki|Inaki|Iñigo|Inigo|Eneko|Ibai|Oier|Julen|Beñat|Benat|Gaizka|Urko|Koldo|Imanol|Aritz|Xabier|Andoni|Josu|Danel|Unax|Markel|Ekain|Haritz|Hodei|Peio|Patxi|Gotzon|Aimar|Alaitz|Ekaitz|Endika|Erik-?\w+|Garikoitz|Harkaitz|Hegoi|Ianire|Igotz|Iban|Ihintza|Iñar|Izei|Kepa|Lander-?\w+|Luken|Manex|Odei|Oihan|Oinatz|Ugaitz|Xanti|Zigor|Zuhaitz|Aritza|Bittor|Eñaut|Enaut|Gaizko|Iraitz|Joanes|Txomin)$/i;

// ── RSA: Afrikaans (R1), afrikanisch (R2, minYear 1995) inkl. der distinkt
//    schwarz-südafrikanischen englischen Tugendnamen (Lucky/Gift/Prince …).
//    ⚠ KEINE generischen Präfix-Regexe (Th-, M-): "Thomas"/"Martin" wären
//    Beifang — nur belegte Namen + enge Präfixe.
const RSA_AF_FIRST = /^(Johan|Pieter|Piet|Willem|Jan|Hennie|Koos|Danie|Gert|Jaco|Riaan|Christo|Deon|Ruan|Heinrich|Charl|Divan|Janco|Wikus|Hendrik|Francois|François|Wian|Tiaan|Johannes|Stephanus|Cornelius|Andries|Frans|Dawie|Fanie|Sarel|Tinus|Wynand|Schalk|Abrie|Barend|Jacques|Andre|André|Nico|Leon|Louis|Kobus|Gerhard|Gideon|Hannes|Hansie|Herman-?\w*|Jannie|Japie|Lodewyk|Lourens|Marthinus|Nicolaas|Ockert|Petrus|Phillipus|Rudi|Rudolf|Sakkie|Servaas|Theuns|Thys|Wessel|Attie|Bennie|Boeta|Braam|Buks|Cobus|Corne|Corné|Dirk-?\w*|Driekus|Etienne-?\w*|Faan|Flip|Gawie|Giel|Hein|Henning-?\w*|Izak|Jurie|Kallie|Karel|Lukas-?\w+|Manie|Naas|Neels|Niekie|Okkie|Paulus|Pikkie|Ras|Roelof|Schoeman|Stoffel|Tertius|Vlam|Wouter-?\w*|Wynie)$/i;
const RSA_ZU_FIRST = /^(Thabo|Tshepo|Bongani|Lebohang|Olwethu|Thami|Nkanyiso|Bonga|Mpendulo|Letlhogonolo|Ayabonga|Lesiba|Thabang|Sipho|Thabiso|Mpho|Themba|Sandile|Siyabonga|Tebogo|Sibusiso|Xolani|Andile|Thulani|Mandla|Thapelo|Vusi|Sbusiso|Sanele|Nhlanhla|Ayanda|Simphiwe|Thato|Sabelo|Nkosinathi|Tumelo|Njabulo|Sizwe|Katlego|Sfiso|Kabelo|Sello|Musa|Sihle|Karabo|Mxolisi|Teboho|Mduduzi|Sifiso|Bheki|Kagiso|Jabulani|Nkululeko|Sphamandla|Neo|Itumeleng|Lindokuhle|Lebogang|Dumisani|Senzo|Thokozani|Ntokozo|Mlungisi|Sthembiso|Phumlani|Philani|Thando|Nathi|Anele|Ndumiso|Mthokozisi|Sakhile|Luyanda|Sphiwe|Bonginkosi|Siya|Lucky|Gift|Prince|Innocent|Given|Justice|Blessing|Wiseman|Goodwill|Welcome|Mzwandile|Bhekani|Bandile|Lwazi|Melusi|Mfundo|Minenhle|Mpumelelo|Msizi|Muzi|Mzukisi|Nceba|Nkosana|Nqobile|Ntando|Phila|Phumelele|Qiniso|Sanele-?\w*|Sazi|Sechaba|Senzeni|Simo|Sinethemba|Siphelele|Siphesihle|Siphiwe|Sizwe-?\w*|Skhumbuzo|Solly|Songezo|Thamsanqa|Thembinkosi|Vukani|Vuyani|Wandile|Xolile|Zamokuhle|Zenzele|Zolani|Zwelethu|Bafana|Bhekizizwe|Dingane|Fikile|Gugulethu|Hlengiwe|Jabu|Khaya|Khulekani|Lindani|Lungelo|Makhosi|Mangaliso|Mzwakhe|Ndabenhle|Nhlakanipho|Nyiko|Rethabile|Sandi|Sbonelo|Sicelo|Sindiso|Siphamandla|Thulasizwe|Velaphi|Vusumuzi|Zakhele|Bongane|Ofentse|Luthando|Nkosi|Mdu|Lebo|Obakeng|Banele|Mbongeni|Mbuso|Ntuthuko|Aphiwe|Mahlatse|Bulelani|Asanda|Katleho|Lindo|Luvuyo|Mondli|Mojalefa|Abongile|Boitumelo|Sivuyile|Kgomotso|Kgotso|Menzi|Spha|Tshidiso|Akhona|Thembelani|Mbulelo|Zweli|Lwando|Zama|Lethabo|Syanda|Kgothatso|Lefa|Yanga|Unathi|Mongezi|Manqoba|Lungisani|Mashudu|Tebza|Khutso|Loyiso|Mthoko|Mncedisi|Mohau|Nduduzo|Fana|Lungile|Nkosikhona|Mzamo|Bongumusa|Kamohelo|Buhle|Luzuko|Lonwabo|Thuso|Tshegofatso|Olebogeng|Smanga|Xolisa|Lihle|Lubabalo|Thulane|Lesedi|Monde|Tsepo|Athenkosi|Zuko|Malibongwe|Odwa|Zola|Sandiso|Sbongiseni|Sibongiseni|Luvo|Aviwe|Tinashe|Lovemore|Fortune|Wonder)$/i;
// ⚠ WELLE-3-NACHLESE (Apartheid-Gate, 2026-07-18): die 80 Namen ab |Bongane sind
// die komplette afrikanische Restmasse aus dem r0-TAIL des gebauten Pools —
// „Mbongeni Smith" war 1962 ziehbar, weil die explizite Liste sie verfehlte
// (r2-minYear 1995 = Apartheid-Gate greift nur, wenn die Route trifft).
// Biblische Namen (Abraham/Ephraim/Abram/Samson) bleiben bewusst r0 —
// Afrikaaner-Namenstradition, in der Apartheid-Ära weiß belegt.

// ⚠ WELLE-4 (2026-07-18): Die Welle-3-Nachlese oben war eine EXPLIZITE Liste und
// hat erneut 13 Namen verfehlt (Thabani, Samkelo, Tshepiso, Siyanda, Kamogelo,
// Syabonga, Vuyo, Sbu, Tshepang, Siyabulela, Collen, Lerato, Sibusiso-Varianten)
// = 8,0 % der r0-Vornamen-Ziehungen. Messung: ein RSA-Fahrer von 1962 war mit
// ~1:12 „Samkelo Molepo" — das Apartheid-Gate (r2 minYear 1995) lief ins Leere.
//
// LEHRE: Allowlist-Regex gegen eine offene Datenmasse verliert dieses Rennen
// strukturell. Deshalb hier eine MORPHOLOGIE-Regel als Auffangnetz. Sie greift
// nur auf Nguni/Sotho-Silbenanfänge, die in englischen ODER afrikaansen Namen
// nicht vorkommen können (Konsonantencluster wie Tsh-/Nhl-/Mkh-/Zw-/Ngc-).
// Kuratierte r0-Namen sind ban-immun, das Netz sieht nur die Daten-Tails.
// Bewusst NICHT drin: Th- (Thomas), Si- (Simon), Ma-/Mo- (Martin/Morne),
// Le- (Leon), Ka- (Karel) — dort wäre die Kollision mit r0 garantiert.
const RSA_ZU_FIRST_STRUCT = /^(Tsh|Nhl|Mkh|Mth|Ngc|Nqo|Nkw|Nkos|Mzw|Sph|Sbo|Sbu|Zwe|Xol|Vuy|Luy|Ndu|Dlam|Hlo|Mdu|Mpu|Nts|Ntu|Qin|Sikh|Siy|Thok|Zam|Zol|Bhek|Kgo|Kga|Mah|Mash|Lera|Kamo|Samk|Syab|Thab(?:an|en))\w*$/i;

// ── FIN: finnlandschwedisch (R1). ⚠ Konservativ: nur klar schwedische Formen;
//    Emil/Elias/Otto/Joel sind (auch) finnische Modenamen → R0/geteilt.
const FIN_SV_FIRST = /^(Johan|Niklas|Mikael|Kristian|Christoffer|Kristoffer|Fredrik|Henrik|Patrik|Anders|Kaj|Kim|Kenneth|Björn|Bjorn|Axel|Oscar|Marcus|Sebastian|Jan|Jens|Gustav|Gustaf|Alexander-?\w*|Robin-?\w+|Andreas-?\w+|Carl|Carl-\w+|Christer|Christian-?\w+|Claes|Dan-?\w+|Erik-?\w+|Gunnar-?\w+|Göran|Goran|Hans-?\w+|Håkan|Hakan-?\w*|Ingmar|Ingvar|Jarl|Joakim-?\w+|John-?Erik|Jonas-?\w+|Karl-\w+|Kjell|Klas|Krister|Lars-\w+|Leif-?\w+|Lennart-?\w*|Magnus-?\w+|Mats-?\w+|Nils-\w+|Olof|Ove|Per-\w+|Pontus|Ragnar|Rickard|Roald|Roger-?\w+|Rolf-?\w+|Rune-?\w*|Staffan|Stefan-?\w+|Stig|Sten|Sture|Sven-\w+|Tage|Tor-?\w+|Torbjörn|Torbjorn|Ulf-?\w*|Valdemar|Vidar|Viking|Wilhelm|Yngve|Åke|Ake)$/i;
const FIN_SHARED_FIRST = /^(Emil|Kevin|Elias-?\w+|Robin|Benjamin|Daniel-?\w*|Anton-?\w*|Oliver-?\w*|William-?\w*|Max-?\w*|Leo-?\w+|Niclas)$/i;

// ── IND: Süd (R1), pan-indisch geteilt [0,1]. ⚠ HOHE Unsicherheit — Sanskrit-
//    Namen sind gesamtindisch; nur dravidisch markierte Formen sind sicher Süd.
const IND_SOUTH_FIRST = /^(Karthik|Kartik|Karthikeyan|Senthil|Saravanan|Balaji|Venkat\w*|Srinivas\w*|Subram\w*|Murug\w*|Ganesan|Kannan|Muthu\w*|Selva\w*|Palani\w*|Arumugam|Ramasamy|Anoop|Sreejith|Unni|Gopan|Rajan|Raman|Chandran|Krishnan|Sundar\w*|Shankar|Sankar|Mani(?:kandan)?|Vignesh|Vijayan|Prasad|Naveen|Nagaraj\w*|Raghavendra|Girish|Harish|Mahadev\w*|Basavaraj|Siddaramaiah|Chandrasekhar\w*|Jayakumar|Kumaravel|Loganathan|Madhavan|Natarajan|Pandiyan|Perumal|Ragunath\w*|Sakthivel|Sathish|Sathya\w*|Shanmugam|Sivakumar|Sridhar|Srikanth|Subbu|Sudhakar|Suriya|Tamilselvan|Thangaraj|Vasanth\w*|Veerappan|Velmurugan|Venu|Yuvaraj|Dhanush|Surya|Karuppasamy|Ilango|Ezhil\w*|Kumaresan|Marimuthu|Panneerselvam|Ravichandran|Renganathan|Saminathan|Thirumal\w*|Udhaya\w*|Valluvan)$/i;
const IND_SHARED_FIRST = /^(Suresh|Ramesh|Dinesh|Mahesh|Ganesh|Prakash|Krishna|Ravi|Kumar|Kiran|Arun|Vijay|Anand|Ashwin|Gopal|Hari|Mohan|Murali|Raghav|Raju|Ram|Sai|Santosh|Satish|Sanjay-?\w+|Shiva?|Sridhar-?\w+|Vasu|Venkatesh-?\w+|Vinay|Vishnu)$/i;

// ── MAS: malaiisch (R0, Muster), chinesisch-malaysisch (R1 = westliche Rufnamen,
//    Daten-Realität: Kelvin/Jason/Steven sind in MY chinesische Rufnamen).
const MAS_MALAY_FIRST = /^(Mo?hd|Muham?m?ad|Muhd|Mohama?d|Ahmad|Abdul\w*|Amirul|Khairul|Zul\w*|Aiman|Hafiz\w*|Saiful|Firdaus|Azman|Faizal|Shahrul|Azmi|Afiq|Alif|Syafiq|Faiz|Arif+|Ismail|Azlan|Rizal|Hairul|Nazri|Zainal|Rosli|Kamal|Amir|Adam|Adib|Aidil|Akmal|Amin\w*|Anuar|Ashraf|Asyraf|Azhar|Azizul|Azrul|Badrul|Danial|Danish|Fahmi|Faisal|Farhan|Fauzi|Fitri|Hadi|Haikal|Hakim\w*|Halim|Hamzah|Hanif|Haris|Harith|Hasan|Hassan|Haziq|Helmi|Hisham|Idris|Ikhwan|Ilham|Imran|Iqbal|Irfan|Izzat|Jamal\w*|Johari|Kamarul\w*|Latif|Lokman|Luqman|Mahathir|Mansor|Mat|Mazlan|Megat|Mustafa|Nabil|Najib|Naim|Nasir|Nazmi|Nizam|Noor\w*|Nor\w*|Omar|Osman|Othman|Putra|Qayyum|Rahim|Rahman|Ramli|Rashid|Razak|Ridhwan|Ridzuan|Roslan|Sabri|Salleh|Shafiq|Shah|Shahir|Shahril|Shamsul|Sharif\w*|Sufian|Sulaiman|Syahmi|Syahir|Syed|Taufik|Taufiq|Umar|Wan|Yusof|Yusoff|Yusri|Zack?ry|Zaid\w*|Zaki\w*|Zamri|Zulkifli)$/,      // ohne /i: malaiische Namen sind in den Daten sauber kapitalisiert
      MAS_CN_FIRST = /^(Kelvin|Jason|Steven|Andy|Alex|Alvin|Alan|Andrew|Jeff|Nick|Ben|Joseph|Eddy|Jay|Albert|David|John|Sam|Jack|James|Joe|Kenny|Ken|Vincent|Eric|Michael|Marcus|Nicholas|Ivan|Jimmy|Johnny|Tony|Peter|Paul|Richard|Ryan|Sean|Aaron|Bryan|Calvin|Chris\w*|Darren|Dennis|Desmond|Edwin|Eugene|Gary|Henry|Jeffrey|Jerry|Joshua|Justin|Keith|Leon|Louis|Melvin|Nelson|Patrick|Raymond|Ronald|Samuel|Shaun|Simon|Stanley|Terence|Thomas|Timothy|Victor|William|Zachary|Daniel|Kevin|Benjamin|Brandon|Brian|Danny|Derek|Dylan|Edmund|Edward|Elvin|Ernest|Felix|Francis|Frankie|Frederick|George|Gerald|Gordon|Harold|Herman|Howard|Hugo|Ian|Isaac|Jacky|Jeremy|Joel|Jonathan|Jordan|Junior|Lawrence|Lester|Lionel|Lucas|Malcolm|Mark|Martin|Matthew|Maurice|Max|Mervyn|Milton|Morgan|Nigel|Norman|Oliver|Oscar|Philip|Randy|Robert|Rodney|Roger|Ronnie|Roy|Russell|Scott|Stephen|Stewart|Stuart|Sunny|Sydney|Terry|Tommy|Vernon|Wilfred|Willie|Wilson|Winston)$/i;

// ── EST: russischsprachige Minderheit (R1). Ersetzt das bisherige banFirst
//    (D2: unterdrücken → trennen; die Region existiert seit je → KEIN minYear).
//    Estnische Schreibformen (Aleksander/Sander/Andres/Jüri) bleiben R0.
const EST_RU_FIRST = /^(Aleksandr|Alexandr|Deniss|Sergei|Sergey|Andrei|Andrey|Aleksei|Aleksey|Alexey|Vladimir|Dmitri|Dmitriy|Dmitry|Igor|Oleg|Maksim|Maxim|Pavel|Jevgeni|Jevgeny|Evgeni|Anton|Viktor|Denis|Nikita|Mihhail|Mikhail|Kirill|Ilja|Ilya|Vitali|Vitaly|Artjom|Artyom|Artem|Nikolai|Nikolay|Ivan|Vadim|Eduard|Konstantin|Ruslan|Juri|Jüri-?\w+|Boriss?|Valeri|Valery|Gennadi|Gennady|Stanislav|Vjatšeslav|Vjatseslav|Vyacheslav|Slava|Fjodor|Fyodor|Grigori|Grigory|Jaroslav|Yaroslav|Leonid|Semjon|Semyon|Stepan|Timofei|Timofey|Vassili|Vasili|Vasily|Vladislav|Roman|Filipp|Georgi|Georgy|Danil|Daniil|Dmitrijs?|Jegor|Yegor|Matvei|Matvey|Miron|Nazar|Rodion|Rustam|Savva|Tihhon|Timur|Vsevolod|Zahhar)$/;

// ── NACHNAMEN-Zusatzrouten (Leckage-Fix; per Sichtung der Top-Aggregate belegt) ──
// BEL: flämische Nachnamen ohne Van-/De-/Ver-Präfix, die die bestehende Route
// nicht fängt (Nijs #61ff der ungerouteten Masse → landeten alle wallonisch).
const BEL_FL_LAST_ADD = /^(Thijs|Bauwens|Moens|Heylen|Gielen|Goethals|Lievens|Ceulemans|Nijs|Cuypers|Matthys|Roels|Somers|Andries|Declerck|Dewulf|Jans|Smeets|Decock|Claus|Leemans|Huysmans|Coenen|Baeyens|Deckers|Smits|Geens|Engelen|Sterckx|Houben|Engels|Dierickx|Peters|Simons|Joris|Callens|Mortier|Mahieu|Beckers|Laeremans|Dewaele|Tack|Verbruggen|Vergauwen|Theys|Bollen|Helsen|Cornelissen|Maertens|Moors|Bogers|Bosch|Brouwers|Bruynseels|Buyens|Buysse|Casteels|Colpaert|Daelemans|Dhaenens|Dhaene|Gys|Gyssels|Haesaert|Kerremans|Lambrecht|Lodewijckx|Meeus|Mommens|Nuyts|Opdebeeck|Pelgrims|Poot|Roosen|Schellekens|Schoeters|Sels|Stroobants|Teugels|Uyttendaele|Vercammen|Wijnants|Wynants)$/;
// ⚠ Callens/Mortier/Mahieu/Beckers sind west-/grenzflämisch mit wallonischem
//   Vorkommen — flämische Lesart dominiert (Kennzeichnung METHODIK §2.1).
// CAN — AUSBAU: die alte gemischte Liste CAN_ASIAN_LAST_ADD (alles → r2) ist in
// zwei Ziel-Listen aufgespalten. Zusammen decken sie exakt die alte Menge ab.
// (a) südasiatisch → r2 (Sikh-Namen Fraser Valley/Surrey + bengalisch + AUSBAU-
//     Nachlese der CA-Top-Daten: Shaikh (Variante von Sheikh, 962!), Sangha,
//     Rana, Joshi, Desai, Gandhi, Kahlon, Aujla, Prasad (indo-karibisch:
//     Persaud), Alam/Hasan (bengalisch), Dsouza (goanisch-indisch)):
const CAN_SA_LAST_ADD = /^(Rai|Bains|Chahal|Sekhon|Johal|Toor|Deol|Bhullar|Basra|Sran|Bal|Uppal|Purewal|Pannu|Nijjar|Mangat|Hundal|Hayer|Gosal|Garcha|Dhindsa|Atwal|Bassi|Khela|Sohi|Islam|Uddin|Hossain|Saha|Sarkar|Dey|Nath|Jain|Aulakh|Minhas|Arora|Thind|Shaikh|Shaik|Sheik|Persaud|Parmar|Sahota|Sangha|Rana|Joshi|Desai|Gandhi|Kahlon|Aujla|Prasad|Alam|Hasan|Dsouza|D'Souza)$/;
// (b) ostasiatisch → r3 (kantonesisch/Mandarin/vietnamesisch, ausserhalb
//     EAST_ASIAN + AUSBAU-Nachlese: Lo/Lai/Tam/Kwan/Chau/Yan/Kwok/Fong/Chin/
//     Chong/Hui/Yip — HK-kantonesische CA-Topnamen, landeten anglo):
const CAN_EA_LAST_ADD = /^(Yu|Chang|Chu|Fung|Yuen|Liang|Chiu|Ly|Tsang|Hu|Truong|Mak|Woo|Yee|Tse|Luu|Trinh|Phan|Cai|Vo|Vu|Tong|Huynh|Shen|Song|Cao|Deng|Xie|Zeng|Zheng|Gao|Luo|Tian|Yuan|Pan|Jiang|Du|Ye|Su|Lu|Ding|Ren|Fang|Qin|Xue|Hou|Shao|Lo|Lai|Tam|Kwan|Chau|Yan|Kwok|Fong|Chin|Chong|Hui|Yip)$/;
// Alte kombinierte Liste bleibt für Doku/Tests exportiert (DEPRECATED, ungenutzt im Build):
const CAN_ASIAN_LAST_ADD = new RegExp(CAN_SA_LAST_ADD.source.slice(0, -2) + '|' + CAN_EA_LAST_ADD.source.slice(2));
// RSA: Bantu-Nachnamen, die die Präfix-Heuristik verfehlt (Makhanya = M-a-k,
// das Muster prüft M+Konsonant; Shabalala/Zuma/Kunene … Top-150 ungeroutet).
const RSA_ZU_LAST_ADD = /^(Langa|Shabangu|Shabalala|Shezi|Shongwe|Shange|Shandu|Majola|Kekana|Kunene|Modise|Zuma|Mudau|Khanyile|Nhlapo|Simelane|Banda|Malatji|Nyathi|Skosana|Mathe|Mohlala|Kubheka|Thwala|Zondo|Nene|Sibisi|Bhengu|Matlala|Duma|Malinga|Biyela|Magagula|Luthuli|Mogale|Motloung|Mulaudzi|Maphumulo|Madonsela|Mohale|Tau|Madlala|Makhanya|Sibeko|Dhlamini|Ledwaba|Sambo|Mavuso|Thabethe|Miya|Zitha|Makhubela|Magwaza|Mosia|Moloto|Gwala|Myeni|Qwabe|Maake|Maduna|Skhosana|Sibanyoni|Rikhotso|Zama|Moeketsi|Makhubele|Maphosa|Malope|Manana|Kgomo|Kganyago|Lekota|Mailula|Makgoba|Maponya|Masango|Maseko|Masilela|Masondo|Mathonsi|Mayisela|Mazila|Mbeki|Mgidi|Mnguni|Mnisi|Radebe|Ramaphosa|Rikhoto|Selepe|Senosi|Shivambu|Sithebe|Ndlela|Nxumalo|Mthiyane|Msimango|Ngubane|Mashaba|Motsepe|Tembe|Maleka|Makola|Zikhali|Lukhele|Thabede|Thebe)$/;
// Welle-3-Nachlese: Thabede/Thebe standen im r0-TAIL (Apartheid-Gate-Leak).
// SUI: portugiesische Nachnamen ausserhalb von IBERIAN_PT (Pires/Lima standen
// in den CH-Daten und landeten Deutschschweiz → „Ben Pires" in r0).
const SUI_PT_LAST_ADD = /^(Pires|Lima|Morais|Magalhães|Magalhaes|Henriques|Guerreiro|Salgado|Valente|Vaz|Ramalho|Furtado|Cabral|Camacho|Faria|Gaspar|Leal|Macedo|Maia|Matias|Melo|Mota|Moura|Pacheco|Paiva|Pinheiro|Queiroz|Rebelo|Sequeira|Silveira|Simao|Simão|Vicente|Baptista|Esteves|Figueiredo|Freire|Garcia-?Portug\w*|Loureiro|Louro|Neto|Padrão|Padrao|Peixoto|Resende|Sa|Sá|Salvador|Sampaio|Santana|Torres-?\w+|Varela)$/;
// ⚠ WELLE 4 (2026-07-18): Bantu-NACHnamen im r0-Tail = 17,6 % der Ziehungen.
// Die bestehende Präfix-Heuristik in build-names-v3.js (CFG.RSA.route[1]) deckt
// nur Mo[kf]/Ma[bhs] ab und verfehlte die ganzen Mal-/Map-/Mat-/Mam-/Mak-Familien
// (Maluleka, Maphanga, Matlou, Mamabolo, Makhoba, Molepo, Tladi, Pule …).
// Sichtbar wurde es erst im echten Spiellauf: „Andy Tladi", Südafrika 1962.
//
// Struktur-Netz: Sotho/Nguni-Nachnamen enden praktisch immer auf einen Vokal,
// afrikaanse fast nie (Malan/Maritz/Mouton/Moolman = -n/-z/-n/-n). Genau das
// trennt die beiden Familien trotz gleicher Anfangssilbe.
// Negativ-Lookahead nur für anglo-Namen, die zufällig auf Vokal enden.
// Zweiter Zweig: Sotho-Namen auf -ng/-tse/-tso (Moeng, Monareng, Motsoeneng),
// die trotz Bantu-Struktur konsonantisch enden.
const RSA_ZU_LAST_STRUCT = /^(?!(Moore|Munro|Milne|Meade|Malone|More|Moosa|Marie|Mare|Mabe|Monroe|Moule|Mode|Male|Mole|Mule|Manning|Morning|Mustang|Lansing)$)(Ma|Mo|Me|Mi|Mu|Le|Se|Ra|Tl|Th|Kh|Ph|Ts|Si|Zo|Lu|Bu|Ku|Pu|Mm|Nt|Nd|Ng)[a-z]+([aeiou]|ng|tse|tso)$/;

// Afrikaanse Namen auf Vokal-Endung — müssen VOR dem Struktur-Netz greifen,
// sonst zieht sie die Morphologie-Regel fälschlich nach r2.
const RSA_AF_LAST_STRUCT_KEEP = /^(Lubbe|Matthee|Mouton|Moolman|Maritz|Labuschagne|Nienaber|Coetzee|Kotze|Cronje|Naude|Fouche|Fouché|Steenkampe|Bothma|Wiese|Le Roux|Roode|Grobbelaar|Swanepoele)$/;

// RSA: Afrikaans-Nachnamen ausserhalb der bestehenden Liste (Pienaar/Cloete …).
const RSA_AF_LAST_ADD = /^(Cloete|Booysen|Swart|Pienaar|Pieterse|Pietersen|Beukes|Visser|Groenewald|Basson|Barnardt|Blignaut|Bothma|Breytenbach|Cilliers|De Beer|De Bruyn|De Klerk|De Kock|De Lange|De Wet|Delport|Dreyer|Du Preez|Du Randt|Eloff|Els|Fouche|Fuchs|Geldenhuys|Greyling|Grove|Hattingh|Heunis|Human|Jacobsz|Janse Van Rensburg|Jonker|Kirsten|Koekemoer|Labuschagne|Landman|Le Grange|Liebenberg|Maree|Meintjies|Mostert|Myburgh|Nortje|Odendaal|Oberholzer|Opperman|Pelser|Pienke|Pretorius-?\w*|Raubenheimer|Redelinghuys|Roux|Schutte|Slabbert|Smuts|Stander|Steynberg|Swiegers|Taljaard|Van Rensburg|Venter-?\w*|Verster|Victor|Wilken|Wolmarans)$/;

// ── GRE (AUSBAU D1): 43,9 % der Nachnamen-Ziehmasse war kein Griechisch ──────
// Griechische Männer-Familiennamen enden praktisch immer auf -s oder -ou
// (Nominativ -os/-as/-is/-es bzw. eingefrorener Genitiv -ou). Der STRUKTUR-Ban
// dreht die Beweislast um: statt Fremdes aufzuzählen (die §5.3-Falle), wird
// alles verworfen, was der griechischen Morphologie nicht folgt. Gegen die
// VOLLE Datenmasse geprüft (nicht nur Kopf — §5.1): die Nicht-s/-ou-Masse ist
// zu >99 % albanisch/südasiatisch/türkisch/weiblich/Junk, kein legitimer
// griechischer Männer-Nachname verliert (Belege METHODIK-AUSBAU §2).
const GRE_STRUCT_LAST = /^(?!.*(?:s|ou)$).*$/i;
// -s/-ou-Fremdkörper (Volldurchsicht der 501 Überlebenden; Cavus=Çavuş türkisch,
// Bains Sikh, Kots/Papadopoylos Artefakte):
const GRE_FOREIGN_SOU_LAST = /^(Chris|Ilyas|Waqas|Younas|Bains|Jones|Cavus|Kots|Papadopoylos)$/i;
// Vornamen-als-Nachname, Fortführung der bestehenden GRE-banLast-Liste
// (Nikos|Dimitris|… bleibt im Build bestehen; hier die -s-Formen, die sie
// nicht abdeckt). ⚠ Panos/Manos/Stathis/Kosmas/Ilias/Loukas sind AUCH als
// echte Nachnamen belegt — für Konsistenz mit der bestehenden Liste gebannt,
// kostet zusammen ~1 % Ziehmasse (METHODIK-AUSBAU §2.3).
const GRE_GIVEN_LAST = /^(Andreas|Alexandros|Petros|Stelios|Thanasis|Thanassis|Spiros|Spyros|Marios|Aris|Takis|Sakis|Tasos|Tassos|Vaggelis|Athanasios|Theodoros|Kyriakos|Stefanos|Nikolas|Aggelos|Manolis|Manos|Ilias|Loukas|Stathis|Kosmas|Pantelis|Sotiris|Fotis|Panos|Mykonos|Xristos|Mixalis|Stratos|Zisis|Savvas|Vasilios)$/i;
// Weibliche -ou-Paarformen: die männliche -s/-os-Form steht im Pool daneben
// (Vlachos→Vlachou, Kontos→Kontou …). NUR gepaarte Fälle — patronymische
// Männer-Genitive (Georgiou/Nikolaou/Ioannou/Stamou/Palaiologou) bleiben,
// Grenze dokumentiert METHODIK-AUSBAU §2.2:
const GRE_FEMALE_OU_LAST = /^(Vlachou|Kontou|Spanou|Roussou|Kritikou|Katsarou|Zervou|Florou|Drakou|Liakou|Nakou|Orfanou|Nomikou|Komninou|Moschou|Kokkinou|Papadatou|Rizou|Manou|Thanou|Exarchou|Kourou)$/i;

// GRE-Vornamen (D1c): dieselbe Struktur-Logik — griechische Männer-Vornamen
// enden auf -s (Nominativ). Whitelist der belegten Ausnahmen (biblische Formen
// Emmanouil/Michail/Rafail; Μιχαήλ mit Gewicht 12 in den GR-Daten).
const GRE_STRUCT_FIRST = /^(?!(?:Emmanouil|Michail|Rafail)$)(?!.*s$).*$/i;
// -s-Fremdkörper: pakistanisch (Waqas/Abbas/Awais), albanisch (Elvis/Ervis/
// Fatos/Aleks), anglo/franko (Chris/James/Denis/Nicolas/Harris):
const GRE_FOREIGN_S_FIRST = /^(Waqas|Abbas|Awais|Anas|Ilyas|Younas|Idris|Chris|James|Denis|Dennis|Nicolas|Nicholas|Harris|Elvis|Ervis|Aleks|Fatos)$/i;
// Greeklish-Tastatur-Artefakte (w=ω, h=η, mp=μπ, u=υ, gg-Fehler): die korrekte
// Form steht jeweils mit höherem Gewicht im Pool (Giorgos 73 vs Giwrgos 28):
const GRE_GREEKLISH_FIRST = /^(Giwrgos|Kwstas|Kwnstantinos|Xrhstos|Giannhs|Mixalhs|Panagiwths|Panagiwtis|Hlias|Mpampis|Stauros|Baggelis|Agelos|Labros)$/i;

// ── WELLE 3 (2026-07-18): USA r1 hispanisch + SWE r1 ex-jugoslawisch ─────────
// USA: Kopie von US_HISP_FIRST (build-names-v3.js, Damping-Klasse) MINUS der
// mehrdeutigen Namen, die NICHT r1-exklusiv sein dürfen: Mario (Andretti!),
// Antonio (italo-amerikanisch), Ivan (slawisch-amerik.), Oscar (anglo/skand.),
// Omar (Omar Bradley), Israel (jüdisch-amerik.) → die wandern in die
// Shared-Klasse [0,1]. „José/Juan/Carlos" bleiben r1-exklusiv.
const USA_HISP_R1_FIRST = /^(Jose|Juan|Carlos|Luis|Miguel|Jorge|Jesus|Pedro|Rafael|Alejandro|Fernando|Ricardo|Roberto|Eduardo|Javier|Sergio|Alberto|Manuel|Francisco|Angel|Andres|Julio|Ruben|Armando|Enrique|Gerardo|Salvador|Arturo|Alfredo|Ramon|Raul|Cesar|Hector|Pablo|Jaime|Gustavo|Guillermo|Felipe|Rodrigo|Emilio|Ernesto|Diego|Santiago|Cristian|Alfonso|Ignacio|Rodolfo|Adolfo|Humberto|Gilberto|Osvaldo|Marcelo|Mauricio|Esteban|Federico|Gonzalo|Rigoberto|Efrain|Joaquin|Leonel|Lorenzo|Marcos|Fidel|Marco Antonio|Juan Carlos|Jose Luis)$/i;
// Anglo-Kern + die 6 Mehrdeutigen: geteilt [0,1] — 2./3.-Generation-Hispanics
// tragen überwiegend Anglo-Rufnamen („Kyle Gonzalez" ist der Real-Normalfall,
// Anker Aric Almirola = „Aric"). NICHT die volle Restmasse teilen: r1 soll
// hispanisch DOMINIERT bleiben (~60/40), sonst verwässert die Region.
const USA_SHARED_FIRST = /^(Michael|David|Daniel|Anthony|Christopher|Chris|Alex|Alexander|Eric|Erik|Andrew|Andy|Danny|Johnny|Jimmy|Bobby|Ricky|Richard|Robert|Adrian|Marcus|Victor|Vincent|Frank|Frankie|Tony|Joe|Joey|George|Steven|Steve|Brandon|Kevin|Brian|Ryan|Jesse|Jason|Aaron|Adam|Nick|Nicholas|Sam|Sammy|Freddy|Eddie|Ray|Raymond|Rudy|Leo|Gabriel|Sebastian|Julian|Martin|Kyle|Tyler|Austin|Cody|Dylan|Justin|Jordan|Josh|Joshua|Matt|Matthew|Mike|Mario|Antonio|Ivan|Oscar|Omar|Israel|Edgar|Marco|Edwin|Christian)$/i;
// USA-NACHNAMEN: Build-Edit (d) — CFG.USA.route = [[HISPANIC, 1]] mit der
// BESTEHENDEN Build-Konstante (hier nicht dupliziert, 150-Namen-Regex).
// Die Census-Dämpfung bleibt unverändert (wirkt auf Gewichte, Route auf Region).
// DAZU die Nachlese der vollen US-Datenmasse (Top-1500!): 140 hispanische
// Namen, die HISPANIC nicht kennt — angeführt von Cruz (90.877!), Fernandez,
// Santos, Alvarado, Gonzales (Variante), Ortega, Garza (Texas-Kernname).
// Filipino-Namen (Cruz/Santos/De La Cruz) bleiben zusätzlich 0.1-gedämpft;
// portugiesische Diaspora (Gomes/Fernandes/Dias/Lopes/Alves/Matos/Rodrigues)
// bleibt BEWUSST r0 — Portugiesisch-Amerikaner sind anglo-integriert, und
// „Kevin Gomes" ist korrekt; ebenso Anglo-Beifang (Haynes/Graves/Davies) und
// Marino (italienisch) nicht enthalten.
const USA_HISP_LAST_ADD = /^(Cruz|Fernandez|Fernández|Santos|Alvarado|Gonzales|Gonsalez|Ortega|Garza|Rivas|Pineda|Arias|Guerra|Sosa|Salas|Cortes|Benitez|Benítez|Lozano|Melendez|Meléndez|Zavala|Macias|Macías|Valenzuela|Mercado|Marin|Marín|De Leon|De León|Deleon|Rosas|De La Cruz|Dela Cruz|Murillo|Velez|Vélez|Gallegos|Villegas|Huerta|Cuevas|Paz|Nuñez|Barajas|Cantu|Cantú|Barrios|Baez|Báez|Cordova|Córdova|Castellanos|Villalobos|Avalos|Esparza|Velasco|Enriquez|Enríquez|Nieves|Jaramillo|Granados|Canales|Quiroz|Segura|Solano|Saenz|Sáenz|Gamez|Gámez|Burgos|Olivares|Linares|De Jesus|De Jesús|Valdes|Valdés|De La Rosa|Aviles|Avilés|Galvez|Gálvez|Henriquez|Henríquez|Tellez|Téllez|Godinez|Godínez|Ojeda|Benavides|Vela|Casillas|Quinones|Quiñones|Yanez|Yáñez|Barrientos|Rodas|Venegas|Muniz|Muñiz|Villatoro|Jaimes|Valadez|Resendiz|Casas|De La Torre|Caceres|Cáceres|Ornelas|Martines|Frias|Frías|Valladares|Ordonez|Ordoñez|Angeles|Balderas|Ceballos|Cazares|Torrez|Taveras|Covarrubias|Ceja|Estevez|Estévez|Farias|Farías|Mireles|Tavarez|De Los Santos|Matias|Matías|Alvarenga|Sanches|Larios|Olivas|Bustos|Peres|Hernandes|Briones|Nevarez|Ramires|Turcios|Arenas|Corrales|Paez|Páez|Cavazos|Berrios|Berríos|Ontiveros|Perales|Iglesias|Menendez|Menéndez|Alaniz|Cifuentes|Narvaez|Narváez|Baca|Mares|Funes|Ybarra|Mazariegos|Recinos|Valles|Castro|Romero|Luna|Duran|Durán|Calderon|Calderón|Guevara|Portillo|Beltran|Beltrán|Acevedo|Orellana|Trujillo|Peralta|Colon|Colón|Castaneda|Castañeda|Salgado|Alfaro|Medrano|Parra|Lugo|Galindo|Vera|Caballero|Aguilera|Gallardo|Carranza|Reyna|Zepeda|Hurtado|Cordero|Quintana|Arevalo|Arévalo|Carmona|Olvera|Brito|Hidalgo|Chacon|Chacón|Marroquin|Marroquín|Soriano|Batista|Quezada|Saucedo|Coronado|Aleman|Alemán|Becerra|Corona|Argueta|Mejia|Mejía|Santana|Rubio|Rangel|Tapia|Trejo|Arellano|Mata|Escobedo|Montero|Nieto|Arredondo|Mena|Prado|Rosado|Tejada|Arteaga|Magana|Magaña|Renteria|Rentería|Lucero|Saldana|Saldaña|Najera|Nájera|Alarcon|Alarcón|Serna|Zambrano|Toledo|Barragan|Barragán|Saavedra|Marrero|Sotelo|Arriaga|Giron|Girón|Tejeda|Urbina|Prieto|Aquino|Figueroa|Gamboa|Ulloa)$/i;
// Batch 2 (Scan 3, -ia/-ra/-o/-on-Endungen): Castro (47.631!) und Romero
// (46.655!) führten; ambige bleiben draußen (Moran irisch, Roman/Barron/
// Ventura/Bello/Mota anglo/italienisch/portugiesisch-geteilt).

// SWE: bosnisch/ex-jugoslawisch → r1 (Anker Dino Beganovic). ⚠ Viele dieser
// Vornamen sind AUCH türkisch/arabisch (Adnan/Emir/Kenan/Tarik) — die globale
// Filter-Guard (global-first-filters.js) nimmt geroutete Namen automatisch vom
// Ban aus, darum dürfen sie hier stehen, ohne DEN/NED/AUT aufzureißen.
const SWE_EXYU_FIRST = /^(Dino|Armin|Edin|Emir|Adnan|Amar|Amer|Amel|Almir|Adis|Haris|Kenan|Tarik|Mirza|Damir|Semir|Senad|Eldar|Jasmin|Zlatan|Elvir|Mirsad|Nedim|Sanel|Ermin|Adin|Ajdin|Alen|Emin|Muamer|Nermin|Edvin-?Bego\w*)$/i;
// Nachnamen: -ović/-ević voll, dazu kurze -ić/-ic-Formen. Generisches ic$ ist
// in SCHWEDEN sicher (kein nativer Nachname endet -ic; theoretischer Beifang
// „Eric" als Nachname kommt in den SE-Top-Daten nicht vor — geprüft).
// Ban-Freigabe: Build-Edit (e) — SWE-banLast BALKAN → BALKAN_SWE_REST
// (albanische Liste + escu/eanu/oglu/oski bleiben gebannt, Ban lief vor Route).
const SWE_EXYU_LAST = /(ović|ovic|ević|evic|ić|ic)$/i;

// ============================================================================
// EXPORT — Struktur wie cfg.route: [[regex, ziel], …]; ziel int ODER int[]
// (int[] = Kopie in jede genannte Region, s. Kopfkommentar Punkt 2).
// Erster Treffer gewinnt; kein Treffer → Region 0 (wie bisher).
// ============================================================================
const ROUTE_FIRST = {
    GER: [[GER_TURKISH_FIRST, 1]],                       // Region 1 = NEU, s. region-defs.js
    // WELLE 3: Jay/Kian/Rohan/Aman/Dev sind AUCH anglo Top-Namen — die Welle-1-
    // Route beanspruchte sie r1-exklusiv, was sie aus der GBR-Kurve verbannt
    // hätte („Jay Watson" unziehbar). Geteilt [0,1] VOR der Südasien-Route.
    GBR: [[/^(Jay|Kian|Rohan|Aman|Dev)$/i, [0, 1]], [GBR_SOUTH_ASIAN_FIRST, 1]],
    FRA: [[FRA_ARAB_WAF_FIRST, 1]],
    BEL: [[BEL_FL_FIRST, 1], [BEL_FR_FIRST, 0], [BEL_SHARED_FIRST, [0, 1]], [/^/, [0, 1]]],
    //   ^ BEL-Default = geteilt: unklassifizierte Restmasse ist international
    //     (beide Landesteile nutzen sie). Distinkte Formen sind oben abgefangen.
    SUI: [[SUI_PT_FIRST, 3], [SUI_IT_FIRST, 2], [SUI_FR_FIRST, 1],
          [SUI_SHARED_DE_FR, [0, 1]], [SUI_SHARED_DE_IT, [0, 2]], [SUI_SHARED_ALL, [0, 1, 2]]],
    //   ^ SUI-Default = 0 (Deutschschweiz): unklassifizierte Restmasse der
    //     CH-Daten ist überwiegend alemannisch.
    // AUSBAU: r2/r3-Split. Reihenfolge wichtig (erster Treffer gewinnt):
    // distinkt südasiatisch → 2, Pinyin → 3, HK-westlich → [0,3], Québec → 1,
    // internationale Restmasse → [0,1,3].
    CAN: [[CAN_SA_FIRST, 2], [CAN_EA_PINYIN_FIRST, 3], [CAN_EA_WESTERN_FIRST, [0, 3]],
          [CAN_QC_FIRST, 1], [CAN_SHARED_FIRST, [0, 1, 3]]],
    ESP: [[ESP_BAS_FIRST, 2], [ESP_CAT_FIRST, 1]],
    RSA: [[RSA_ZU_FIRST, 2], [RSA_ZU_FIRST_STRUCT, 2], [RSA_AF_FIRST, 1]],
    FIN: [[FIN_SV_FIRST, 1], [FIN_SHARED_FIRST, [0, 1]]],
    IND: [[IND_SOUTH_FIRST, 1], [IND_SHARED_FIRST, [0, 1]]],
    MAS: [[MAS_CN_FIRST, 1], [MAS_MALAY_FIRST, 0]],
    EST: [[EST_RU_FIRST, 1]],
    // WELLE 3:
    USA: [[USA_HISP_R1_FIRST, 1], [USA_SHARED_FIRST, [0, 1]]],
    SWE: [[SWE_EXYU_FIRST, 1]]
};

// D2: banFirst-ERSATZ. Nationen hier ersetzen ihr bisheriges banFirst komplett;
// was hier steht, bleibt ECHTER Filter (kein Routing) — Begründung METHODIK §3.
const BAN_FIRST = {
    // GER: arabische (nicht türkische) Formen — Gruppe (syrisch/libanesisch) hat
    // keine Region (Motorsport-Beleg fehlt, Einwanderung zu jung für minYear<2035).
    GER: [/^(Mohammed|Mohammad|Mohamed|Ahmad|Omar|Abdul\w*|Mahmoud|Khalil|Hassan|Hussein|Khaled|Walid|Samir|Tarek|Youssef|Yousef)$/i],
    // FRA: türkische Diaspora-Namen (Mehmet steht auf FR-Rang 302!) — keine
    // FRA-Region, Gruppe ohne Motorsport-Beleg. Dazu iberische Formen (Pedro
    // FR-belegt via portugiesische Diaspora — 1,5 Mio., aber ohne eigene Region;
    // Filter verhindert „Pedro Faure"). (Maghreb/Westafrika wird geroutet.)
    FRA: [/^(Mehmet|Ahmet|Mustafa|Murat|Hasan|Hüseyin|Emre|Hakan|Serkan)$/i,
          /^(Pedro|Carlos|Jose|José|Antonio|Manuel|Luis|Miguel|Fernando|Paulo|Joao|João|Tiago|Diego|Juan|Pablo|Sergio|Ricardo|Joaquim|Rui|Nuno)$/],
    // BEL: maghrebinische Namen — BEL hat (noch) keine Einwanderungsregion.
    // Option „BEL R2 maghrebinisch (minYear 1990, w 0.04)" in METHODIK §3.2 —
    // Motorsport-Beleg fehlt derzeit → Filter, Nutzer entscheidet.
    BEL: [/^(Mohamed|Mohammed|Muhammad|Ahmed|Ali|Abdel\w*|Karim|Rachid|Said|Youssef|Hassan|Mustafa|Ismail|Hamza|Bilal|Mehdi|Samir|Khalid|Omar|Yassine|Sofiane|Nordine|Farid|Jamal|Tarik|Anass?|Ayoub|Soufiane|Zakaria|Nabil|Adil|Redouane|Younes|Mounir|Hicham|Aziz|Brahim|Driss|Fouad|Hakim|Ilias|Imad|Issam|Kamal|Mourad|Othman|Rida|Salah|Walid)$/i,
          // spanische Diaspora-Vornamen in den BE-Daten (keine Region): „Juan Smits" verhindern
          /^(Juan|Carlos|Jose|José|Pedro|Luis|Miguel|Fernando|Diego|Manuel)$/],
    // SUI: spanische Formen (Gruppe kleiner als die portugiesische, keine Region;
    // portugiesisch-ambige Formen wie Pedro/Jorge/Francisco werden nach R3 geroutet).
    SUI: [/^(Carlos|Jose|José|Luis|Fernando|Javier|Miguel-?Angel|Juan|Manolo|Paco|Pepe|Alejandro|Andres|Andrés)$/i],
    // MAS: indisch-malaysische Namen — keine Region (analog Golf-Regel:
    // Gruppe ohne Motorsport-Basis in MY-Kartszene schwach belegt) ⚠ Schätzung.
    // Dazu: chinesische NACHNAMEN-Tokens als Vorname (MY-Datenformat „Lim Wei
    // Ming" → erster Token = Familienname) + Junk (Man/Lan/Boy/Are/Abe/Zam)
    // + Nur (weiblicher Namensbestandteil).
    MAS: [/^(Kumar|Ravi|Raja|Muniandy|Suresh|Ramesh|Rajesh|Ganesh|Murali|Bala|Prakash|Sivakumar|Krishnan|Segar|Maniam|Siva|Ram)$/i,
          /^(Lim|Wong|Chong|Chan|Chin|Ong|Yong|Yap|Leong|Goh|Low|Lai|Liew|Che|Pak|Teh|Ooi|Yee|Gan|Toh|Sim|Foo|Koh|Tay|Chew|Yeo|Ang|Soh|Khoo|Chua|Kok|Ling|Lau|Loh|Chai|Man|Lan|Boy|Are|Abe|Zam|Nur|Abd)$/],
    // FIN: NEU — bisher gar kein banFirst: „Muhammad Virtanen" war möglich.
    // Somalisch/arabische Diaspora (Md #71, Muhammad #75, Ali #88 der FI-Daten)
    // ohne Region: zu jung (Zuzug ab ~1990 → Debüts ~2015+), Motorsport-Beleg fehlt.
    FIN: [/^(Muhammad|Mohamed|Mohammad|Mohammed|Ali|Ahmed|Ahmad|Ibrahim|Hassan|Hussein|Omar|Abdi|Abdullahi|Mustafa|Ram|Md|Suresh|Rajesh|Ramesh|Kumar|Raj|Sanjay|Amit|Anil|Deepak|Vijay|Ravi|Arun|Krishna|Rahul|Sunil|Ashok|Manoj|Rakesh)$/i],
    // CAN: hispanische Vornamen — banLast filtert HISPANIC bereits, der
    // Vornamen-Ban stellt Kohärenz her („Carlos Liang"/„Luis Johnson" verhindern).
    CAN: [/^(Carlos|Jose|José|Juan|Luis|Pedro|Miguel|Fernando|Diego|Jorge|Ricardo|Roberto)$/],
    // ESP: maghrebinische Vornamen (Mohamed #65 der ES-Daten via OPS gedroppt,
    // die übrigen fehlten) — keine ESP-Einwanderungsregion (⚠ Option offen).
    ESP: [/^(Ahmed|Karim|Said|Rachid|Youssef|Hamid|Hassan|Ali|Mustafa|Mohammed|Muhammad|Omar|Bilal|Hamza)$/i,
          // Kosenamen (Fortführung der OPS-Drops Javi/Rafa/Paco …): formelle Form gewinnt
          /^(Kiko|Toño|Adri|Nacho|Manu|Santi|Edu|Juanjo|Juanma|Lolo|Tono|Chema|Quique|Curro)$/],
    // RSA: weiblich lesbare Daten-Vornamen (Linda ist in ZA ein männlicher
    // Zulu-Name, liest sich im Spiel aber weiblich → raus; dito Pretty/Portia).
    RSA: [/^(Linda|Pretty|Portia|Precious|Beauty)$/i,
          // WELLE 4: spanische Akutformen aus dem ZA-Datensatz (Simón, Víctor,
          // Martín, León, Óscar, Iván, Adrián, Julián) = 4,4 % der r0-Ziehungen.
          // Kein RSA-Beleg, keine Region → echter Filter statt Routing.
          // NUR á/í/ó/ú/ñ — é bleibt zu, sonst fiele André (Afrikaans, r1) mit.
          /[áíóúñÁÍÓÚÑ]/],
    // EST: banFirst ENTFÄLLT ersatzlos (russische Namen werden jetzt geroutet).
    EST: [],
    // GRE (AUSBAU D1c): ERSETZT das bisherige banFirst aus build-names-v3.js
    // (Mohamed|…|George|John|Peter|Mike|Maria — alles non-s, vom Struktur-Ban
    // abgedeckt). Kein Routing: Albaner/Pakistanis in GR haben keine
    // Motorsport-Region (D1d, Golf-Regel), die Muslim-Minderheit Thrakiens
    // ebenso wenig — Filter, nicht Region.
    GRE: [GRE_STRUCT_FIRST, GRE_FOREIGN_S_FIRST, GRE_GREEKLISH_FIRST]
};

// NEU: Nachnamen-Zusatz-Bans (Mechanik wie banLast, in NEUER Konfiguration
// an cfg.banLast anhängen). Junk + regionslose Gruppen.
const BAN_LAST_ADD = {
    // türkische Vornamen als Nachname = Datenartefakt (echte türk. Nachnamen
    // dieser Form sind selten; „Peter Hasan" verhindert)
    GER: [/^(Hasan|Mehmet|Mustafa|Osman|Murat|Ahmet|Yusuf|Ismail)$/i],
    // Junk in BE-Daten (Bxl/Bruxelles = Ortskürzel, Marc/Maria = Vornamen, Momo)
    BEL: [/^(Bxl|Bruxelles|Marc|Maria|Momo|Man)$/i],
    // weibliche südasiatische Formen (Begum/Bibi nur Frauen, Kaur = Sikh-Frauen)
    GBR: [/^(Begum|Bibi|Kaur)$/i],
    // + Ann/Anne/Elizabeth/Dawn (weibl. Daten-Artefakte), Canada/Mac (Junk),
    //   Abdi (somalisch — keine Region, landete anglo)  [AUSBAU-Nachlese]
    CAN: [/^(Begum|Bibi|Kaur|Ann|Anne|Elizabeth|Dawn|Canada|Mac|Abdi)$/i],
    // SA-indische Gemeinschaft (Durban) ohne Region (analog Golf-Regel) +
    // Junk/Vornamen-als-Nachname der ZA-Daten
    RSA: [/^(Naidoo|Govender|Pillay|Moodley|Chetty|Padayachee|Maharaj)$/i,
          // + Katlego/Bongani/Kagiso/Bongi (Vornamen-als-Nachname, Welle-3-Nachlese r0-TAIL)
          /^(Gift|Thabo|Lucky|Thando|Junior|Angel|Pretty|Portia|Lerato|Rose|Sam|John|Jack|Moses|Sello|Prince|Sthole|Maria|Ali|Beauty|Elizabeth|Christina|Grace|Joyce|Happy|Katlego|Bongani|Kagiso|Bongi)$/i,
          // WELLE 4: weitere Vornamen-als-Nachname aus dem r0-Tail. Teils weiblich
          // (Minnie/Lucia/Lulu/Martha/Monica/Mary), teils Nguni-Vornamen
          // (Musa/Sipho/Thato/Thulani/Zodwa) — als Nachname in JEDER Region Junk.
          // NICHT drin: Lucas/Marcus/Maxwell/Moss/May — echte englische Nachnamen.
          /^(Mike|Minnie|Lucia|Lulu|Martha|Monica|Mary|Musa|Sipho|Siya|Sizwe|Sihle|Simphiwe|Siyabonga|Thabiso|Thandi|Thato|Thapelo|Thulani|Thuli|Zodwa|Lesego|Lunga|Mandla|Sibusiso|Thandeka|Thabang|Promise)$/i,
          // WELLE 4: „Tugendnamen" der ZA-Daten — im südafrikanischen Englisch als
          // VORname vergeben (Innocent Chukwuma-Typ), nie als Nachname.
          /^(Innocent|Hope|Queen|Blessing|Fortune|Faith|Patience|Given|Zandile|Nomsa|Justice|Wiseman|Welcome|Goodwill|Lovemore|Charity|Comfort|Princess|Wonder)$/i,
          // WELLE 4: dieselbe Allowlist-Lücke wie oben, nur als Nachname —
          // Martín/Ángel/Simón/Víctor = 3,0 % der r0-Nachnamen. Spanische
          // Akutformen haben in keiner der drei RSA-Regionen einen Beleg.
          // é bleibt erlaubt (Fouché, Théron = hugenottisch-afrikaans).
          /[áíóúñÁÍÓÚÑ]/],
    // MY-Junk (Man/Lan/Keong/Hong/Ming = Namensbestandteile, Jack/Rock/Love/
    // Hidayah = Artefakte) + Hossain (bengalische Gastarbeiter, keine Region)
    MAS: [/^(Man|Lan|Keong|Hong|Jack|Rock|Amira|Boy|Long|Anak|Ming|Wai|Love|Hidayah|Hossain|Seng|Rai|Husna|Sam|Chandran|Muniandy|Subramaniam)$/i],
    // albanische Nachnamen ausserhalb des BALKAN-Regex (CH-Daten: Hoti u.a.) —
    // Empfehlung: global in BALKAN ergänzen, hier als SUI-Ban geliefert
    // Nachtrag Opus 2026-07-17 (Paket-J-Ausbau): Thaqi/Maliqi/Idrizi/Kabashi/Ahmetaj/Rexhaj
    // fehlten in der Liste — zusammen 1:396 der CH-Nachnamen-Ziehmasse (gemessen am gebauten
    // Pool). Der von METHODIK §3.3 empfohlene GLOBALE BALKAN-Ausbau wurde dagegen VERWORFEN:
    // Gewinn AUT 1:1913, GER 1:1602, SWE 1:6003, DEN/FRA null — und Hasani/Ismaili/Osmani/
    // Ademi/Selimi sind albanisch UND arabisch (MAR: Ismaili 2546, Hasani 1374 = echte Namen).
    SUI: [/^(Hoti|Zeqiri|Rexhepi|Ademi|Selimi|Osmani|Shabani|Bytyci|Bytyçi|Halimi|Kastrati|Elezi|Ismaili|Salihu|Hasani|Emini|Zymeri|Abazi|Krasniqi-?\w*|Jashari|Kryeziu|Limani|Musliu|Ramadani-?\w*|Rushiti|Sadiku|Sejdiu|Shaqiri|Veseli|Thaqi|Maliqi|Idrizi|Kabashi|Ahmetaj|Rexhaj)$/i,
          // eritreisch/äthiopische Namen (CH-Daten, keine Region)
          /^(Kidane|Tesfay|Tesfaye|Berhane|Gebre\w*|Haile\w*|Weldu|Yohannes|Tewelde)$/i],
    // GRE (AUSBAU D1): wird an das bestehende banLast ANGEHÄNGT (NORDIC_FOREIGN,
    // GREEK_FEMALE, IBERIAN_PT, HISPANIC + Nikos|Dimitris|…-Liste bleiben).
    // Wirkung: 43,9 % → ~1 % Fremdmasse, Pool bleibt gesund (REPORT-AUSBAU §1).
    GRE: [GRE_STRUCT_LAST, GRE_FOREIGN_SOU_LAST, GRE_GIVEN_LAST, GRE_FEMALE_OU_LAST],
    // ISR (WELLE 3, Nutzer-Fund „Daniel Khaled" im Spielstand): der bestehende
    // Ban listet Khalil, aber nicht Khaled — insgesamt trugen 1 von 9 ISR-
    // Fahrern einen arabischen Nachnamen (10,5 % Ziehmasse, 55 Namen; volle
    // Messung gegen den gebauten Pool). Bestandsentscheidung bleibt: arabisch-
    // israelische Namen sind Filter, keine Region (kein Motorsport-Anker).
    // BEWUSST NICHT gebannt (auch jüdisch-israelisch): Abutbul (marokkanisch-
    // jüdisch), Assaf (hebräisch), Sabag/Habib/Mualem (mizrachisch).
    ISR: [/^(Yousef|Naser|Shaheen|Diab|Haj|Khaled|Khatib|Nasser|Masri|Younis|Saad|Halabi|Samara|Hamed|Abu|Hammad|Kabha|Badran|Sultan|Zoubi|Amara|Azzam|Ghanem|Othman|Safadi|Mustafa|Rayan|Yassin|Hussein|Shalabi|Egbaria|Zidan|Hijazi|Jabareen|Sawaed|Fares|Shibli|Bakri|Ismail|Farah|Bishara|Shehadeh|Wattad|Jubran|Rabah|Mahajna|Sarsour|Daoud|Asfour|Zaher)$/i]
};

// Nachnamen-Routen ERGÄNZEN (an cfg.route anfügen; GER hatte bisher keine route).
// WICHTIG GER: banLast muss TURKISH freigeben (s. Kopf, Punkt 5).
const ROUTE_LAST_ADD = {
    GER: [[GER_TURKISH_LAST, 1]],
    BEL: [[BEL_FL_LAST_ADD, 1]],
    // AUSBAU: gesplittet (alt: [[CAN_ASIAN_LAST_ADD, 2]])
    CAN: [[CAN_SA_LAST_ADD, 2], [CAN_EA_LAST_ADD, 3]],
    // Reihenfolge kritisch: die beiden Allowlists zuerst, das Struktur-Netz zuletzt —
    // so gewinnen bekannte afrikaanse Namen (Lubbe, Matthee) vor der Morphologie.
    RSA: [[RSA_AF_LAST_ADD, 1], [RSA_AF_LAST_STRUCT_KEEP, 1], [RSA_ZU_LAST_ADD, 2], [RSA_ZU_LAST_STRUCT, 2]],
    SUI: [[SUI_PT_LAST_ADD, 3]],
    // WELLE 3: SWE ex-jugoslawische Nachnamen → r1 (braucht Build-Edit e,
    // sonst frisst der BALKAN-Ban sie vor der Route)
    SWE: [[SWE_EXYU_LAST, 1]],
    // WELLE 3: USA-Nachlese — hängt hinter CFG.USA.route [[HISPANIC,1]] (Edit d)
    USA: [[USA_HISP_LAST_ADD, 1]],
    // chinesische Nachnamen ausserhalb der bestehenden MAS-Route („Roslan Cheong")
    MAS: [[/^(Cheong|Teh|Chen|Yow|Chng|Chuah|Khaw|Hui|Beh|Peng|Siew|Yow|Chng)$/, 1]]
};

// AUSBAU — ⛳ PFLICHT-BUILD-EDIT (a): CFG.CAN.route in build-names-v3.js hat als
// zweiten Eintrag den KOMBINIERTEN Regex [SOUTH_ASIAN|EAST_ASIAN → 2]. Da der
// erste Treffer gewinnt, wäre der Split oben wirkungslos, solange dieser Eintrag
// steht. Opus ersetzt ihn durch die zwei getrennten Einträge (SOUTH_ASIAN/
// EAST_ASIAN sind die Build-Konstanten):
//   alt:  [new RegExp(SOUTH_ASIAN.source+'|'+EAST_ASIAN.source,'i'), 2]
//   neu:  [SOUTH_ASIAN, 2], [EAST_ASIAN, 3]
// Dokumentiert als Datenobjekt für den Regressionscheck:
const ROUTE_LAST_REPLACE_NOTE = { CAN: 'CFG.route Eintrag 2 splitten: [SOUTH_ASIAN,2],[EAST_ASIAN,3]' };

module.exports = {
    ROUTE_FIRST, BAN_FIRST, ROUTE_LAST_ADD, BAN_LAST_ADD, ROUTE_LAST_REPLACE_NOTE,
    BEL_FL_LAST_ADD, CAN_ASIAN_LAST_ADD, RSA_ZU_LAST_ADD, RSA_AF_LAST_ADD, SUI_PT_LAST_ADD,
    // AUSBAU (CAN-Split + GRE):
    CAN_SA_LAST_ADD, CAN_EA_LAST_ADD, CAN_SA_FIRST, CAN_EA_PINYIN_FIRST, CAN_EA_WESTERN_FIRST,
    GRE_STRUCT_LAST, GRE_FOREIGN_SOU_LAST, GRE_GIVEN_LAST, GRE_FEMALE_OU_LAST,
    GRE_STRUCT_FIRST, GRE_FOREIGN_S_FIRST, GRE_GREEKLISH_FIRST,
    // WELLE 3 (USA/SWE-Split):
    USA_HISP_R1_FIRST, USA_SHARED_FIRST, USA_HISP_LAST_ADD, SWE_EXYU_FIRST, SWE_EXYU_LAST,
    // Für Tests/Doku:
    GER_TURKISH_FIRST, GER_TURKISH_LAST, FRA_ARAB_WAF_FIRST, GBR_SOUTH_ASIAN_FIRST,
    BEL_FR_FIRST, BEL_FL_FIRST, BEL_SHARED_FIRST,
    SUI_FR_FIRST, SUI_IT_FIRST, SUI_PT_FIRST, SUI_SHARED_DE_FR, SUI_SHARED_DE_IT, SUI_SHARED_ALL,
    CAN_QC_FIRST, CAN_SHARED_FIRST,
    ESP_CAT_FIRST, ESP_BAS_FIRST, RSA_AF_FIRST, RSA_ZU_FIRST,
    FIN_SV_FIRST, FIN_SHARED_FIRST, IND_SOUTH_FIRST, IND_SHARED_FIRST,
    MAS_MALAY_FIRST, MAS_CN_FIRST, EST_RU_FIRST
};
