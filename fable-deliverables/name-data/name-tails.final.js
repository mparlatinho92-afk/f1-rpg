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
