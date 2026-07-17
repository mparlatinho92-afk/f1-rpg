// ============================================================================
// Paket J — classify-forenames.js: Klassifikator + Wirkungs-Messung (D4)
//
// Emuliert die Vornamen-/Nachnamen-Pipeline aus build-names-v3.js für die
// 12 Regionen-Nationen, einmal mit ALTEM Routing (cfg.route auf beide Arten,
// banFirst unterdrückt) und einmal mit NEUEM (ROUTE_FIRST/BAN_FIRST/
// ROUTE_LAST_ADD aus region-routes.js, GER-Region aus region-defs.js).
//
// Aufruf:  node classify-forenames.js            → Wirkungs-Report (REPORT.md-Basis)
//          node classify-forenames.js --debug NAT → Top-40 Default-Region-Namen
//                                                   (Leckage-Sichtung beim Iterieren)
//
// Bewusste Vereinfachungen ggü. dem echten Build (dokumentiert METHODIK §5):
//  - Ära-Fenster flachgelegt (Union) — auch für GER/GBR/FRA (ERA_SPLIT_KEEP);
//    die eff-Messung gilt „über alle Ären", Paket I regelt die Fenster.
//  - fixName/ACCENT-Reparatur weggelassen (key() matcht akzent-insensitiv,
//    betrifft nur die Anzeigeform, nicht die Zuordnung).
//  - USA-Dämpfungen irrelevant (USA nicht im Scope).
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const BASE = require('../name-data/curated-base-v2.js');
const RR = require('./region-routes.js');
const RD = require('./region-defs.js');

const ALPHA = 0.6, SCALE = 100;
const BUCKET = { 5: 90, 4: 45, 3: 26, 2: 12, 1: 2 };
const CLASSES = {
    big:   { sur: 1500, fore: 600, surT: 450, foreT: 260 },
    mid:   { sur: 1000, fore: 450, surT: 340, foreT: 210 },
    small: { sur:  600, fore: 320, surT: 240, foreT: 150 }
};
const hasCyrillic = s => /[Ѐ-ӿ]/.test(s);
const isLatinName = s => /^[A-Za-zÀ-ÖØ-öø-ÿĀ-žŁłŚśŹźŻżĆćŃńĄąĘęİıĞğŞş][A-Za-zÀ-ÖØ-öø-ÿĀ-žŁłŚśŹźŻżĆćŃńĄąĘęİıĞğŞş' -]+$/.test(s);
const key = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ── Kulturfremd-Regexe (Kopie build-names-v3.js Stand v0.9.14.79, gekürzt auf Scope) ──
const SOUTH_ASIAN = /^(Khan|Patel|Singh|Kaur|Ali|Ahmed|Ahmad|Hussain|Hussein|Shah|Sharma|Kumar|Begum|Bibi|Akhtar|Iqbal|Mahmood|Aslam|Raja|Mistry|Chowdhury|Choudhury|Miah|Uddin|Rahman|Rehman|Islam|Mohammed|Mohamed|Mohammad|Muhammad|Mahmoud|Syed|Sheikh|Malik|Javed|Anwar|Bashir|Yousaf|Gill|Sandhu|Sidhu|Dhaliwal|Brar|Grewal|Dhillon|Bhatti|Chaudhry|Mirza|Abbas|Raza|Riaz|Ashraf|Akram|Saleem|Nazir|Ramzan|Younis|Aziz|Karim|Rashid|Hamid|Amin|Haq|Sultan|Tariq|Zaman|Qureshi|Ansari|Siddiqui|Kapoor|Mehta|Gupta|Verma|Reddy|Nair|Rao|Das|Devi|Yadav|Kumari|Gujjar|Jutt|Butt|Arain|Baig|Cheema|Warraich|Bajwa|Virk|Gondal|Sahi|Sial|Chaudhary|Chauhan)$/i;
const EAST_ASIAN = /^(Nguyen|Tran|Le|Pham|Hoang|Vu|Dang|Bui|Do|Ho|Ngo|Duong|Kim|Park|Choi|Jung|Kang|Cho|Yoon|Jang|Lim|Han|Oh|Shin|Kwon|Wang|Li|Zhang|Liu|Chen|Yang|Zhao|Huang|Zhou|Wu|Xu|Sun|Ma|Zhu|Lin|Guo|Wong|Chan|Cheung|Lam|Leung|Tang|Yeung|Ng|Chow|Tan|Lee|Teo|Goh|Yap|Ong)$/i;
const ARABIC_MAGHREB = /^(Benali|Ben[ -]?[A-Z]?[a-z]+|El[ -][A-Z][a-z]+|Al[ -][A-Z][a-z]+|Haddad|Saidi|Cherif|Bouazza|Bouzid|Hamdi|Trabelsi|Gharbi|Mansouri|Amrani|Alaoui|Idrissi|Tazi|Fassi|Berrada|Diallo|Camara|Traore|Traoré|Keita|Cisse|Cissé|Sylla|Toure|Touré|Konate|Konaté|Coulibaly|Sow|Ba|Bah|Barry|Balde|Kone|Koné|Sissoko|Fofana|Doumbia|Sanogo|Ouattara|Drame|Dramé|Kaba|Sacko|Samake|Dembele|Dembélé)$/i;
const TURKISH = /^(Yilmaz|Yılmaz|Kaya|Demir|Sahin|Şahin|Celik|Çelik|Yildiz|Yıldız|Yildirim|Yıldırım|Ozturk|Öztürk|Aydin|Aydın|Ozdemir|Özdemir|Arslan|Dogan|Doğan|Kilic|Kılıç|Aslan|Cetin|Çetin|Kara|Koc|Koç|Kurt|Ozkan|Özkan|Simsek|Şimşek|Polat|Erdogan|Erdoğan|Yalcin|Yalçın|Gunes|Güneş|Bulut|Tas|Taş|Caliskan|Çalışkan|Turan|Tekin|Aktas|Aktaş|Unal|Ünal|Avci|Avcı|Sen|Şen|Acar|Guler|Güler|Erdem|Ates|Ateş)$/i;
const BALKAN = /(ić|ic|ovic|ović|evic|ević|inac|adzic|adžić|oski|evski|ovski|iu|escu|eanu|oglu|oğlu)$|^(Krasniqi|Gashi|Berisha|Shala|Hoxha|Kelmendi|Morina|Bytyqi|Zeka|Rama|Dervishi|Marku|Gjoka|Leka|Prela)$/i;
const SLAVIC_EAST = /(ov|ev|in|yn|enko|chuk|shvili|adze|yan|ian)$/;
const SLAVIC_NARROW = /(ov|ev|enko|chuk|shvili|adze)$/;
// AUSBAU: GRE im Scope (Kopie build-names-v3.js Stand v0.9.14.81)
const GREEK_FEMALE = /(opoulou|poulou|idou|iadou|adou|aki)$/i;
const IBERIAN_PT = /^(Silva|Santos|Ferreira|Pereira|Oliveira|Costa|Rodrigues|Martins|Sousa|Souza|Fernandes|Gomes|Lopes|Ribeiro|Gonçalves|Goncalves|Marques|Carvalho|Almeida|Pinto|Alves|Dias|Teixeira|Correia|Mendes|Moreira|Soares|Da Silva|Dos Santos|De Sousa|Nunes|Freitas|Cardoso|Rocha|Barbosa|Cruz|Neves|Coelho|Cunha|Vieira|Monteiro|Batista|Fonseca|Machado|Da Costa|Reis|Antunes|Matos|Fereira|Miranda|Nogueira|Ramos|Tavares|Azevedo|Barros|Borges|Brito|Cavalcante|Castro|Duarte|Farias|Andrade|Araujo|Araújo|Assis|Aguiar|Abreu|Amorim|Anjos|Amaral)$/i;
const HISPANIC = /^(Garcia|García|Rodriguez|Rodríguez|Martinez|Martínez|Lopez|López|Gonzalez|González|Hernandez|Hernández|Perez|Pérez|Sanchez|Sánchez|Ramirez|Ramírez|Torres|Flores|Rivera|Gomez|Gómez|Diaz|Díaz|Reyes|Morales|Ortiz|Gutierrez|Gutiérrez|Chavez|Chávez|Ramos|Ruiz|Mendoza|Alvarez|Álvarez|Castillo|Jimenez|Jiménez|Vasquez|Vásquez|Vazquez|Vázquez|Moreno|Herrera|Medina|Aguilar|Vargas|Guzman|Guzmán|Mendez|Méndez|Munoz|Muñoz|Rojas|Salazar|Contreras|Suarez|Suárez|Delgado|Pena|Peña|Rios|Ríos|Cabrera|Campos|Vega|Fuentes|Carrillo|Leon|León|Santiago|Dominguez|Domínguez|Maldonado|Espinoza|Valdez|Juarez|Juárez|Molina|Acosta|Ayala|Zamora|Villarreal|Trevino|Treviño|Cortez|Cortés|Soto|Serrano|Solis|Solís|Rosales|Estrada|Zuniga|Zúñiga|Nunez|Núñez|Ochoa|Cardenas|Cárdenas|Navarro|Padilla|Barrera|Camacho|Cervantes|Marquez|Márquez|Escobar|Galvan|Galván|Velasquez|Velásquez|Velazquez|Velázquez|Ibarra|Cisneros|Bautista|Meza|Villanueva|Orozco|Avila|Ávila|Robles|Sandoval|Bravo|Lara|Cano|Quintero|Bermudez|Bermúdez|Osorio|Valencia|Franco|Guerrero|Paredes|Bustamante|Ponce|Salinas|Arroyo|Montoya|Palacios|Zapata|Miranda|Mora|Rincon|Rincón|Uribe|Restrepo|Ospina|Giraldo|Cardona|Correa|Betancur|Zuluaga|Arango|Bedoya|Agudelo|Henao|Sierra|Villa|Gallego|Montes)$/i;
const NORDIC_FOREIGN = new RegExp(SOUTH_ASIAN.source + '|' + EAST_ASIAN.source + '|' + ARABIC_MAGHREB.source + '|' + TURKISH.source + '|' + BALKAN.source, 'i');
// GER neu: NORDIC_FOREIGN ohne TURKISH (Route übernimmt die Türkisch-Trennung)
const NORDIC_FOREIGN_NO_TR = new RegExp(SOUTH_ASIAN.source + '|' + EAST_ASIAN.source + '|' + ARABIC_MAGHREB.source + '|' + BALKAN.source, 'i');
const GIVEN_AS_SURNAME = /^(Maria|Jose|José|Juan|Ana|Luis|Luiz|Carlos|Jorge|Pedro|Paulo|Henrique|Antonio|António|Miguel|Manuel|Francisco|Fernando|Ricardo|Eduardo|Daniel|Rafael|Gabriel|Marcos|Mohamed|Ahmed|Ali|Hassan|Omar|Ibrahim|Said|Rachid|Karim|Amine|Youssef|Aziz|Kamal|Adam|Peter|Hans|Johan|Anna|Marie|Jean|Michel|Andre|André|Bernard|Claude|Laurent|Pascal|Christian|Martin|Thomas|Simon|David|Vincent|Robert|Richard|Denis|Georges|Antoine|Julien|Olivier|Rene|René|Roger|Alain|Marcel|Franck|Frank)$/i;

// ── CFG-Kopie (nur Scope-Nationen; Quelle build-names-v3.js v0.9.14.79) ──────
const CFG = {
    GBR: { iso:'GB', cls:'big', route:[[SOUTH_ASIAN,1]], banLast:[EAST_ASIAN,ARABIC_MAGHREB,TURKISH,BALKAN,SLAVIC_EAST,IBERIAN_PT,HISPANIC,/^(Murphy|Kelly|Walsh|Byrne|Doyle|Ryan|O'|Mc|Mac)/] },
    GER: { iso:'DE', cls:'big', banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST,/ski$|cki$/], banFirst:[/^(Ali|Mehmet|Mustafa|Murat|Ahmet|Hasan|Hüseyin|Ibrahim|Mohammed|Mohammad|Muhammed|Ahmad|Omar|Osman|Emre|Can|Cem|Deniz|Kadir|Kemal|Yusuf|Halil|Süleyman|Ismail|Recep|Fatih|Serkan|Erkan|Metin|Sinan|Volkan|Hakan|Burak|Baris|Onur|Ugur|Cengiz|Orhan|Adem|Aydin|Bülent|Dursun|Erdal|Ferhat|Gökhan|Harun|Ilhan|Kenan|Levent|Mesut|Nuri|Ramazan|Salih|Tarkan|Yasin|Zeki)$/i] },
    FRA: { iso:'FR', cls:'big', route:[[ARABIC_MAGHREB,1],[/^(Mohamed|Mehdi|Karim|Yanis|Rayan|Sami|Bilal|Ibrahim|Mamadou|Moussa|Amine|Hamza|Sofiane|Youssef|Abdoulaye|Ousmane|Yassine|Rachid|Farid|Nabil|Malik|Idriss|Souleymane)$/i,1]], banLast:[SOUTH_ASIAN,EAST_ASIAN,TURKISH,BALKAN,IBERIAN_PT,HISPANIC,SLAVIC_NARROW] },
    ESP: { iso:'ES', cls:'big', route:[[/^(Puig|Vila|Serra|Ferrer|Roca|Soler|Font|Bosch|Mas|Casals|Pujol|Rovira|Sala|Torrent|Riera|Grau|Camps|Comas|Vives|Prat|Ripoll|Batlle|Segarra|Codina)$/,1],[/^(Etxeberria|Agirre|Aguirre|Ibarra|Zubizarreta|Urrutia|Garmendia|Mendizabal|Otegi|Goikoetxea|Zabala|Aranburu|Elorza|Iturbe|Arrieta|Lasa|Zubiri|Etxarri|Olaizola|Larranaga|Larrañaga)$/,2]], banLast:[NORDIC_FOREIGN] },
    BEL: { iso:'BE', cls:'mid', route:[[/^(Van|Vande|Vander|De [A-Z]|D'|Ver[a-z]|Claes|Peeters|Janssens|Maes|Mertens|Willems|Wouters|Goossens|Pauwels|Aerts|Michiels|Smets|Martens|Segers|Hendrickx|Vervoort|Vandenberghe|Vanden|Bogaert|Bogaerts|Cools|Coppens|Daems|Dierckx|Geerts|Hermans|Jacobs|Lenaerts|Luyten|Moons|Naessens|Nys|Pittoors|Raes|Roggeman|Smolders|Stevens|Swinnen|Thys|Tielemans|Torfs|Truyens|Verheyen|Verhoeven|Vermeiren|Verstraete|Vos|Wuyts)/,1]], banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC] },
    SUI: { iso:'CH', cls:'mid', route:[[/^(Favre|Rochat|Bonvin|Chevalley|Duc|Rossier|Perret|Monnier|Grandjean|Berney|Pittet|Bovay|Cornuz|Curdy|Dubuis|Fardel|Gaillard|Genoud|Jaquier|Maillard|Mermoud|Nicollier|Pasche|Rappaz|Rochaix|Savary|Tissot|Vuille|Berthoud|Besson|Bovet|Chappuis|Cretton|Delaloye|Ducret|Dupertuis|Emery|Gross|Magnin|Marclay|Michellod|Morand|Pellaud|Praz|Quennoz|Rausis|Roduit|Terrettaz|Vouillamoz|Aubert|Badan|Blanc|Bourgeois|Braillard|Buffat|Chapuis|Cherpillod|Corboz|Cosandey|Delessert|Desmeules|Gillieron|Jaccard|Jaccoud|Longchamp|Mercier|Meylan|Nicole|Paccaud|Panchaud|Regamey|Vallotton|Vulliamy)$/,1],[/^(Bernasconi|Rossi|Bianchi|Ferrari|Fontana|Galli|Crivelli|Pedrazzini|Albertini|Beretta|Bettosini|Bianda|Bomio|Cattaneo|Colombo|Delco|Delcò|Foletti|Genazzi|Gianinazzi|Guidotti|Lepori|Lucchini|Mazzoleni|Molteni|Mombelli|Pagani|Pedretti|Pellegrini|Piattini|Poretti|Quadri|Realini|Regazzoni|Rezzonico|Riva|Robbiani|Sala|Solari|Storni|Taddei|Vanoni|Vassalli|Zanetti|Zanini)$/,2],[IBERIAN_PT,3]], banLast:[SOUTH_ASIAN,EAST_ASIAN,ARABIC_MAGHREB,TURKISH,BALKAN,SLAVIC_EAST,HISPANIC] },
    CAN: { iso:'CA', cls:'mid', route:[[/^(Tremblay|Gagnon|Roy|Côté|Cote|Bouchard|Gauthier|Morin|Lavoie|Fortin|Bergeron|Pelletier|Villeneuve|Leblanc|Belanger|Bélanger|Levesque|Lévesque|Girard|Simard|Boucher|Caron|Beaulieu|Cloutier|Dubé|Dube|Poirier|Fournier|Lapointe|Leclerc|Lefebvre|Poulin|Thibault|Nadeau|Martel|Mercier|Bédard|Bedard|Grenier|Lessard|Bernier|Savard|Gagné|Gagne|Ouellet|Paquette|Desjardins|Demers|Perreault|Boudreau|Couture|Laflamme|Larouche|Lachance|Vachon|Dionne|Gosselin|Turcotte|Rioux|Bilodeau|Dufour|Tessier|Lemieux|Charbonneau|Brisson|Beaudoin|Deschamps|Dupuis|Fontaine|Gendron|Giroux|Houle|Labelle|Lacroix|Lambert|Langlois|Lapierre|Larose|Legault|Lemay|Marcoux|Ménard|Menard|Michaud|Moreau|Paradis|Parent|Plante|Proulx|Renaud|Robitaille|Séguin|Seguin|St-Pierre|Therrien|Trudeau|Vaillancourt)$/,1],[new RegExp(SOUTH_ASIAN.source+'|'+EAST_ASIAN.source,'i'),2]], banLast:[ARABIC_MAGHREB,TURKISH,BALKAN,SLAVIC_NARROW,IBERIAN_PT,HISPANIC] },
    RSA: { iso:'ZA', cls:'mid', route:[[/^(Van |Van[dr]|Du |Le Roux|De [A-Z]|Botha|Pretorius|Venter|Fourie|Nel|Coetzee|Steyn|Kruger|Joubert|Marais|Swanepoel|Viljoen|Vorster|Erasmus|Bezuidenhout|Oosthuizen|Potgieter|Grobler|Meiring|Snyman|Strydom|Uys|Visagie|Wessels|Barnard|Bester|Boshoff|Bosman|Brits|Burger|Claassen|Conradie|Cronje|Engelbrecht|Ferreira|Havenga|Heyns|Jansen|Jordaan|Kotze|Lombard|Lotter|Louw|Malan|Marx|Meyer|Muller|Naude|Olivier|Prinsloo|Rossouw|Scheepers|Schoeman|Smit|Steenkamp|Terblanche|Theron|Truter|Vermaak|Vermeulen)$/,1],[/^(N[dgkctz]|M[bcdfgkhlmnpstv]h?|Dl|Kh[ou]|Zul|Zw|Ts|Hl|X[hou]|S[ei]th|Gum|Bu|Mo[kf]|Ma[bhs]|Ra[md]|Se[bk]|Le[bkt]|Ph|Th[ae]m|Nx|Nq|Gc|Mc[au])/,2]], banLast:[SOUTH_ASIAN,EAST_ASIAN,IBERIAN_PT,HISPANIC] },
    FIN: { iso:'FI', cls:'mid', route:[[/(berg|ström|strom|holm|qvist|kvist|lund|gren|blad|felt|man|sson|stedt|näs|vik|by|backa|fors)$/,1]], banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST] },
    IND: { iso:'IN', cls:'small', route:[[/^(Reddy|Nair|Menon|Rao|Iyer|Iyengar|Krishnan|Pillai|Naidu|Naicker|Gowda|Shetty|Hegde|Kamath|Bhat|Nayak|Acharya|Adiga|Kulkarni|Deshpande|Joshi|Patil|Chari|Raman|Rajan|Srinivasan|Subramanian|Subramaniam|Venkatesh|Ramachandran|Balasubramanian|Natarajan|Sundaram|Swamy|Murthy|Murty|Chandran|Menen|Varma|Warrier|Kurup|Panicker|Namboothiri)$/,1]] },
    MAS: { iso:'MY', cls:'small', route:[[/^(Tan|Lee|Lim|Wong|Ng|Chan|Chong|Chin|Ong|Yap|Yong|Teo|Goh|Ho|Chua|Khoo|Toh|Sim|Foo|Gan|Low|Loh|Koh|Tay|Seah|Chew|Cheng|Chia|Yeo|Ang|Oh|Soh|Neo|Kwek|Leong|Liew|Ling|Loke|Mah|Mok|Pang|Phang|Poh|Quah|See|Seow|Sia|Siow|Soo|Tee|Ting|Tong|Wan[g]?|Wee|Yam|Yeap|Yen|Yip|Chai|Chang|Chee|Cheah|Cheok|Chiam|Chiew|Chik|Choo|Chow|Choy|Chu|Chung|Eng|Fong|Fung|Gooi|Heng|Hii|Hoo|Kam|Kang|Kee|Khaw|Khor|Kong|Koo|Kuan|Kwan|Lai|Lam|Lau|Law|Leow|Loo|Lua|Lye|Ma|Nga|Ngu|Oon|Ooi|Ow|Pua|Puah|Saw|Sng|Soong|Su|Sua|Tam|Tang|Tham|Thoo|Tiong|Voon|Wu|Yau|Yew|Yii|Yu|Yuen)$/,1]], banLast:[SOUTH_ASIAN] },
    EST: { iso:'EE', cls:'small', route:[[/(ov|ev|in|yn|enko|chuk)$|^(Ivanov|Smirnov|Petrov|Kuznetsov|Popov|Volkov|Sokolov|Nikitin|Orlov|Fjodorov|Fyodorov|Vassiljev|Vasiljev|Aleksejev|Andrejev|Sergejev|Mihhailov|Pavlov|Bogdanov|Stepanov|Semjonov|Tarassov|Kolesnik)/,1]], banLast:[/(ova|eva|ina|yna|aya)$/i], banFirst:[/^(Aleksandr|Sergei|Andrei|Dmitri|Aleksei|Vladimir|Igor|Roman|Oleg|Artur|Maksim|Jevgeni|Pavel|Anton|Nikolai|Aleksander|Sander)$/] },
    // AUSBAU: GRE (Kopie build-names-v3.js v0.9.14.81 — 'old' = Live-Stand;
    // 'new' zieht BAN_FIRST.GRE/BAN_LAST_ADD.GRE aus region-routes.js).
    GRE: { iso:'GR', cls:'mid', banLast:[NORDIC_FOREIGN,GREEK_FEMALE,IBERIAN_PT,HISPANIC,/^(Papa|Mustafa|Ahmet|Mehmet|Hasan|Osman|Hussein|Ali Osman|Huseyin|Hüseyin|Ismail|Ramadan|Nikos|Dimitris|Giorgos|Kostas|Giannis|Christos|Vasilis|Vassilis|Panagiotis|Stavros|Michalis|Antonis|Georgios|Konstantinos|Dimitrios|Ioannis|Nikolaos|George|Christo)$/i], banFirst:[/^(Mohamed|Mohammed|Muhammad|Ali|Ahmed|Ahmad|Hassan|Hussein|Omar|George|John|Peter|Mike|Maria)$/i] }
};

// AUSBAU: GRE-Pool-Skelett (Kopie build-names-v3.js NEW_POOLS.GRE — GRE steht
// nicht in curated-base-v2.js, der Build hängt den Pool selbst ein).
const POOL_EXTRA = {
    GRE: { regions: [ { w: 1,
        first: [['Giorgos',5],['Dimitris',5],['Nikos',5],['Kostas',4],['Giannis',4],['Panagiotis',4],['Vassilis',3],['Christos',3],['Alexandros',3],['Stavros',2],['Michalis',3],['Thanasis',2],['Spyros',2],['Antonis',3]],
        last:  [['Papadopoulos',4],['Papadakis',3],['Oikonomou',3],['Georgiou',3],['Dimitriou',3],['Nikolaou',3],['Vlachos',2],['Makris',2],['Alexiou',2]] } ] }
};

// ── OPS-Kopie (nur Scope; drops/moves wirken in ALT und NEU identisch) ───────
const OPS = {
    GBR: { drop: { last: ['Louise'] } },
    GER: { drop: { first: ['Ali'], last: ['Can'] } }, // drop first:'Ali' nur ALT — NEU routet Ali → r1 (s.u.)
    FRA: { drop: { last: ['Ben','Lou','Bou'] }, move: { last: { 'Ndiaye':1,'Diaby':1,'Diarra':1,'Benoit':0 }, first: { 'Benjamin':0 } } },
    ESP: { drop: { first: ['Mohamed','Javi','Rafa','Fran','Manolo','Pepe','Paco','Curro','Quique','Chema'], last: ['Garcia Garcia'] },
           move: { first: { 'Joan':1,'Jordi':1,'Marc':1,'Xavi':1,'Pau':1,'Oriol':1,'Mikel':2,'Iker':2,'Ander':2,'Unai':2,'Aitor':2,'Asier':2,'Gorka':2 } } },
    BEL: { drop: { first: ['Mohamed','Ali'], last: ['Ben','Vdb'] },
           move: { last: { 'Desmet':1,'Devos':1,'Lemmens':1,'Dhondt':1,'Wauters':1,'Smet':1,'Declercq':1,'Baert':1,'Lambrechts':1,'Lauwers':1,'Bosmans':1,'Christiaens':1,'Pieters':1,'Cornelis':1,'Timmermans':1,'Janssen':1,'Jansen':1 },
                   first: { 'Eddy':1,'Danny':1,'Tim':1,'Tom':1,'Bart':1,'Jan':1,'Koen':1,'Kris':1,'Wim':1,'Geert':1,'Stijn':1,'Dirk':1,'Steven':1 } } },
    SUI: { drop: { first: ['Carlos','Ali'], last: ['Bajrami','Ramadani','Fernandez','Schmidt'] },
           move: { first: { 'Antonio':2,'Philippe':1,'Alain':1,'Olivier':1,'Laurent':1,'Nicolas':1,'Cédric':1,'Cedric':1,'Didier':1,'Romain':1,'Hugo':1,'Nathan':1,'Gabriel':1,'Bruno':3,'Tiago':3,'Ricardo':3,'Nuno':3,'Diogo':3 } } },
    CAN: { move: { last: { 'Lau':2,'Cheng':2,'Chung':2,'Saini':2,'Randhawa':2,'Mann':2 },
                   first: { 'Jean':1,'Claude':1,'Jacques':1,'Gilles':1,'Marcel':1,'Alexandre':1,'Mathieu':1,'Sylvain':1,'Xavier':1,'Olivier':1,'Samuel':1,'Guillaume':1,'Francois':1,'Frédéric':1,'Frederic':1,'Pascal':1,'Rejean':1,'Réjean':1,'Yves':1,'Andre':1,'Luc':1,'Pierre':1,'Michel':1,'Denis':1,'Martin':1,'Stephane':1,'Stéphane':1,'Éric':1 } } },
    RSA: { drop: { last: ['Precious'] },
           move: { first: { 'Thabiso':2,'Lucky':2,'Mandla':2,'Thapelo':2,'Vusi':2,'Sbusiso':2,'Sanele':2,'Thabo':2,'Sipho':2,'Bongani':2,'Tshepo':2,'Themba':2,'Sibusiso':2,'Xolani':2,'Andile':2,'Thulani':2,'Kagiso':2,'Lebogang':2,'Katlego':2,'Tumelo':2,'Karabo':2,'Lesego':2,'Neo':2,'Kabelo':2,'Oupa':2,'Solomon':2,'Moses':2,'Enoch':2,'Piet':1,'Johan':1,'Willem':1,'Jan':1,'Hennie':1,'Koos':1,'Danie':1,'Gert':1,'Pieter':1,'Jaco':1,'Riaan':1,'Christo':1,'Deon':1,'Ruan':1,'Heinrich':1,'Charl':1,'Divan':1,'Janco':1,'Wikus':1,'Hendrik':1,'Francois':1,'Wian':1,'Tiaan':1,'Johannes':1,'Stephanus':1,'Cornelius':1 },
                   last: { 'Moyo':2,'Baloyi':2,'Sibiya':2,'Chauke':2,'Mazibuko':2,'Cele':2,'Mathebula':2,'Molefe':2,'Sibanda':2,'Maluleke':2,'Motaung':2,'Moloi':2,'Zungu':2,'Zondi':2,'Hadebe':2,'Vilakazi':2,'Xaba':2,'Van Wyk':1 } } },
    IND: { drop: { first: ['Mohd'], last: ['Kumari'] } },
    MAS: { drop: { first: ['Mohd','Muhd','Mohamad','Muhamad','Abdul','Mohammad','Wan','Tan','Lee'], last: ['Mohd','Raj'] }, move: { last: { 'Yee':1 } } },
    EST: { drop: { first: ['Alex'], last: ['Ivanova','Smirnova','Petrova','Kuznetsova','Vassiljeva','Pavlova','Olen','Kadri','Kristi'] },
           move: { first: { 'Denis':1,'Viktor':1 }, last: { 'Hein':0 } } },
    GRE: { drop: { first: ['Kostas Alt'], last: ['Ali Khan'] } }
};
const SCOPE = Object.keys(CFG);

// ── Aggregat lesen ───────────────────────────────────────────────────────────
const readAgg = (file) => {
    const by = new Map();
    for (const line of fs.readFileSync(path.join(__dirname, '..', 'name-data', file), 'utf8').split('\n')) {
        const m = line.match(/^([A-Z]{2}),"(.*)",(\d+)$/);
        if (!m) continue;
        if (!by.has(m[1])) by.set(m[1], []);
        by.get(m[1]).push([m[2], parseInt(m[3], 10)]);
    }
    return by;
};
const foreBy = readAgg('fore_agg.csv');
const surBy = readAgg('sur_agg.csv');
const deep = o => JSON.parse(JSON.stringify(o));

// Kuratierte Pools: first-Fenster flachlegen (Union, max Gewicht)
function flatPool(nat, withNew) {
    const pool = deep(BASE.NAME_POOLS_BY_NATION[nat] || POOL_EXTRA[nat]);
    if (nat === 'GER' && withNew) { pool.regions[0].w = 0.96; pool.regions.push(deep(RD.NEW_REGIONS.GER)); }
    // AUSBAU: CAN-Split — emuliert NEW_REGIONS.CAN (push r3) + REGION_PATCHES
    // (r2 südasiatisch, minYear 1990) + WEIGHT_PROPOSALS.CAN (0.55/0.33/0.07/0.05)
    if (nat === 'CAN' && withNew) {
        pool.regions.push(deep(RD.NEW_REGIONS.CAN));
        Object.assign(pool.regions[2], deep(RD.REGION_PATCHES.CAN[2]));
        RD.WEIGHT_PROPOSALS.CAN.w.forEach((w, i) => { pool.regions[i].w = w; });
    }
    for (const r of pool.regions) {
        if (r.first && !Array.isArray(r.first)) {
            const merged = new Map();
            for (const win of ['early', 'mid', 'modern'])
                for (const [n, w] of (r.first[win] || [])) {
                    const k = key(n);
                    if (!merged.has(k) || w > merged.get(k)[1]) merged.set(k, [n, w]);
                }
            r.first = [...merged.values()];
        }
    }
    return pool;
}

// ── Pipeline (eine Nation, ein Modus) → { regions: [{first:[[n,w]..], last:[[n,w]..]}] } ──
function build(nat, mode) {
    const cfg = CFG[nat], cls = CLASSES[cfg.cls], ops = OPS[nat] || {};
    const pool = flatPool(nat, mode === 'new');
    const diag = { defaultR0: [] };
    const curatedLastKeys = new Set();
    for (const r of pool.regions) for (const [n] of r.last) curatedLastKeys.add(key(n));

    for (const kind of ['last', 'first']) {
        const raw = kind === 'last' ? surBy.get(cfg.iso) : foreBy.get(cfg.iso);
        if (!raw) continue;
        let bans = (kind === 'first' ? cfg.banFirst : cfg.banLast) || [];
        if (mode === 'new' && kind === 'first' && RR.BAN_FIRST[nat] !== undefined) bans = RR.BAN_FIRST[nat];
        if (mode === 'new' && kind === 'last' && nat === 'GER')
            bans = [NORDIC_FOREIGN_NO_TR, IBERIAN_PT, HISPANIC, SLAVIC_EAST, /ski$|cki$/];
        if (mode === 'new' && kind === 'last' && RR.BAN_LAST_ADD[nat]) bans = bans.concat(RR.BAN_LAST_ADD[nat]);
        let drops = new Set((ops.drop && ops.drop[kind]) || []);
        if (mode === 'new' && nat === 'GER' && kind === 'first') drops = new Set(); // Ali wird geroutet, nicht gedroppt
        let moves = (ops.move && ops.move[kind]) || {};
        // AUSBAU: emuliert Build-Edit (b) — ostasiatische Moves r2 → r3
        if (mode === 'new' && nat === 'CAN' && kind === 'last')
            moves = Object.assign({}, moves, { Lau: 3, Cheng: 3, Chung: 3 });

        let routes;
        if (kind === 'last') routes = (cfg.route || []).concat(mode === 'new' ? (RR.ROUTE_LAST_ADD[nat] || []) : []);
        else routes = mode === 'new' ? (RR.ROUTE_FIRST[nat] || []) : (cfg.route || []); // ALT: Nachnamen-Regexe auf Vornamen (der Ist-Bug)
        // AUSBAU: emuliert Build-Edit (a) — kombinierten CAN-Eintrag [SA|EA → 2]
        // durch getrennte Einträge ersetzen (erster Treffer gewinnt!)
        if (mode === 'new' && nat === 'CAN' && kind === 'last')
            routes = [cfg.route[0], [SOUTH_ASIAN, 2], [EAST_ASIAN, 3]].concat(RR.ROUTE_LAST_ADD.CAN);

        const merged = new Map();
        for (let [name, count] of raw) {
            name = name.trim();
            if (hasCyrillic(name) || !isLatinName(name) || name.length < 3) continue;
            if (!/[aeiouyàâäáéèêëíïîóôöúùûüøåÿ]/i.test(name)) continue;
            if (name !== name.charAt(0).toUpperCase() + name.slice(1) && !/^(De |Da |Van |Von |El |Le |La |Du |O'|Mc|Mac|St-)/.test(name)) continue;
            if (drops.has(name)) continue;
            const curatedProtected = kind === 'last' && curatedLastKeys.has(key(name));
            if (kind === 'last' && GIVEN_AS_SURNAME.test(name) && !curatedProtected) continue;
            if (!curatedProtected && bans.some(b => b.test(name))) continue;
            const k = key(name);
            if (merged.has(k)) merged.get(k).count += count;
            else merged.set(k, { name, count });
        }
        const list = [...merged.values()].sort((a, b) => b.count - a.count);
        if (!list.length) continue;
        const maxC = list[0].count;
        for (const e of list) e.w = Math.max(1, Math.round(SCALE * Math.pow(e.count / maxC, ALPHA)));

        for (const e of list) {
            e.r = 0; e.matched = false;
            for (const [re, ri] of routes) { if (re.test(e.name)) { e.r = ri; e.matched = true; break; } }
            if (moves[e.name] !== undefined) { e.r = moves[e.name]; e.matched = true; }
            if (!Array.isArray(e.r) && !pool.regions[e.r]) e.r = 0;
            if (kind === 'first' && !e.matched && mode === 'new') diag.defaultR0.push([e.name, e.count]);
        }

        // kuratierte Treffer → Datengewicht; Rest → BUCKET
        const dataByKey = new Map(list.map(e => [key(e.name), e]));
        const usedKeys = new Set();
        for (const region of pool.regions) {
            const arr = kind === 'last' ? region.last : region.first;
            for (const entry of arr) {
                const d = dataByKey.get(key(entry[0]));
                if (d) { entry[1] = d.w; usedKeys.add(key(entry[0])); }
                else entry[1] = BUCKET[entry[1]] || entry[1];
            }
        }

        // Masse verteilen (Shared zählt 1× für placed/torso — Cap-Empfehlung METHODIK §6)
        const totalCap = kind === 'last' ? cls.sur : cls.fore;
        const torsoCap = kind === 'last' ? cls.surT : cls.foreT;
        let placed = 0, torso = 0;
        for (const e of list) {
            if (placed >= totalCap) break;
            if (usedKeys.has(key(e.name))) continue;
            const targets = Array.isArray(e.r) ? e.r : [e.r];
            const isTorso = torso < torsoCap;
            let pushedAny = false;
            for (const t of targets) {
                const region = pool.regions[t];
                if (!region) continue;
                const arr = kind === 'last' ? region.last : region.first;
                if (arr.some(x => key(x[0]) === key(e.name))) continue;
                arr.push([e.name, isTorso ? e.w : 1]); // Tail = Gewicht 1, gleiche Region
                pushedAny = true;
            }
            if (pushedAny) { placed++; if (isTorso) torso++; }
        }
    }
    return { pool, diag };
}

// ── Simpson-Effektivgröße ────────────────────────────────────────────────────
const eff = arr => {
    const tot = arr.reduce((s, [, w]) => s + w, 0);
    if (!tot) return 0;
    return Math.round(1 / arr.reduce((s, [, w]) => s + (w / tot) ** 2, 0));
};

// ── Seeded RNG + gewichtete Ziehung für die Sichtprobe ───────────────────────
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function pick(arr, rnd) {
    const tot = arr.reduce((s, [, w]) => s + w, 0);
    let x = rnd() * tot;
    for (const [n, w] of arr) { x -= w; if (x <= 0) return n; }
    return arr[arr.length - 1][0];
}

// ── Lauf ─────────────────────────────────────────────────────────────────────
const debugNat = process.argv.includes('--debug') ? process.argv[process.argv.indexOf('--debug') + 1] : null;
const results = {};
for (const nat of SCOPE) results[nat] = { old: build(nat, 'old'), neu: build(nat, 'new') };

if (debugNat) {
    const d = results[debugNat].neu.diag.defaultR0.slice(0, 60);
    console.log(`${debugNat}: Top-60 Vornamen ohne expliziten Route-Treffer (→ Default):`);
    console.log(d.map(([n, c]) => `${n}(${c})`).join(', '));
    process.exit(0);
}

console.log('== D4.1 Effektive Größe (Simpson 1/Σp²) je Region: Vornamen ALT → NEU ==');
console.log('Nation  Region                     effALT  effNEU   poolALT poolNEU');
const REGION_LABELS = {
    GBR: ['britisch', 'südasiatisch (1995+)'], GER: ['deutsch', 'türkisch-dt. (1985+) NEU'],
    FRA: ['französisch', 'maghreb/westafr. (1995+)'], ESP: ['kastilisch', 'katalanisch', 'baskisch'],
    BEL: ['wallonisch/frankophon', 'flämisch'], SUI: ['Deutschschweiz', 'Romandie', 'Tessin', 'portugiesisch (2000+)'],
    CAN: ['anglophon', 'Québec', 'südasiat. (1990+)', 'ostasiat. (1990+) NEU'], RSA: ['anglophon', 'Afrikaans', 'afrikanisch (1995+)'],
    FIN: ['finnisch', 'finnlandschwedisch'], IND: ['Nord', 'Süd'], MAS: ['malaiisch', 'chinesisch-malays.'],
    EST: ['estnisch', 'russischsprachig'], GRE: ['griechisch']
};
for (const nat of SCOPE) {
    const o = results[nat].old.pool, n = results[nat].neu.pool;
    for (let i = 0; i < n.regions.length; i++) {
        const ro = o.regions[i], rn = n.regions[i];
        const eo = ro ? eff(ro.first) : 0, en = eff(rn.first);
        const po = ro ? ro.first.length : 0, pn = rn.first.length;
        console.log(`${nat.padEnd(7)} r${i} ${String(REGION_LABELS[nat][i] || '').padEnd(24)} ${String(eo).padStart(6)} ${String(en).padStart(7)} ${String(po).padStart(8)} ${String(pn).padStart(7)}`);
    }
}

// ── AUSBAU D1/D2-Messung: Klassen-Ziehmasse (Pool+Tails vereint, „1 von N") ──
console.log('\n== AUSBAU: GRE-Nachnamen-Klassen (Ziehmasse ALT → NEU) ==');
const GRE_CLS = [
    ['griechisch männl. (-s/-ou)', n => /(s|ou)$/i.test(n) && !RR.GRE_FOREIGN_SOU_LAST.test(n) && !RR.GRE_GIVEN_LAST.test(n) && !RR.GRE_FEMALE_OU_LAST.test(n)],
    ['weibl. -ou-Paarform', n => RR.GRE_FEMALE_OU_LAST.test(n)],
    ['Vorname-als-Nachname (-s)', n => RR.GRE_GIVEN_LAST.test(n)],
    ['fremd/Junk (-s/-ou)', n => RR.GRE_FOREIGN_SOU_LAST.test(n)],
    ['nicht -s/-ou (alb./südasiat./türk./weibl./Junk)', n => !/(s|ou)$/i.test(n)]
];
for (const mode of ['old', 'neu']) {
    const arr = results.GRE[mode].pool.regions[0].last;
    const tot = arr.reduce((s, [, w]) => s + w, 0);
    const parts = GRE_CLS.map(([label, fn]) => {
        const m = arr.filter(([n]) => fn(n)).reduce((s, [, w]) => s + w, 0);
        return `${label}: ${(100 * m / tot).toFixed(1)}%${m ? ` (1 von ${Math.round(tot / m)})` : ''}`;
    });
    console.log(`${mode === 'old' ? 'ALT' : 'NEU'} (${arr.length} Namen, eff ${eff(arr)}): ${parts.join(' · ')}`);
}
console.log('\n== AUSBAU: CAN r2/r3 — „Sandeep Tsang"-Wahrscheinlichkeit ==');
{
    // Mess-Regex sauber verankert (^…$) — unverankerte Fragmente würden
    // Substrings matchen („Kelly" ⊃ „Ly", „Hunter" ⊃ „Hu") und die Messung verzerren.
    const SA_F = RR.CAN_SA_FIRST,
          EA_L = new RegExp('^(' + EAST_ASIAN.source.slice(2, -2) + '|' + RR.CAN_EA_LAST_ADD.source.slice(2, -2) + '|Lau|Cheng|Chung)$', 'i');
    for (const mode of ['old', 'neu']) {
        const regs = results.CAN[mode].pool.regions;
        let p = 0;
        for (let i = 0; i < regs.length; i++) {
            const f = regs[i].first, l = regs[i].last;
            const ft = f.reduce((s, [, w]) => s + w, 0), lt = l.reduce((s, [, w]) => s + w, 0);
            if (!ft || !lt) continue;
            const sa = f.filter(([n]) => SA_F.test(n)).reduce((s, [, w]) => s + w, 0) / ft;
            const ea = l.filter(([n]) => EA_L.test(n)).reduce((s, [, w]) => s + w, 0) / lt;
            p += regs[i].w * sa * ea;
        }
        console.log(`${mode === 'old' ? 'ALT' : 'NEU'}: P(südasiat. Vorname × ostasiat. Nachname) = ${(100 * p).toFixed(2)} % aller CAN-Fahrer${p > 0 ? ' = 1 von ' + Math.round(1 / p) : ''}`);
        if (process.argv.includes('--dbg2')) {
            const regs2 = results.CAN[mode].pool.regions;
            regs2.forEach((r, i) => {
                const ft = r.first.reduce((s, [, w]) => s + w, 0), lt = r.last.reduce((s, [, w]) => s + w, 0);
                const saN = r.first.filter(([n]) => SA_F.test(n)), eaN = r.last.filter(([n]) => EA_L.test(n));
                const sa = saN.reduce((s, [, w]) => s + w, 0) / (ft || 1), ea = eaN.reduce((s, [, w]) => s + w, 0) / (lt || 1);
                console.log(` ${mode} r${i}: w=${r.w} saF=${(100 * sa).toFixed(1)}% [${saN.slice(0, 8).map(x => x[0] + ':' + x[1]).join(',')}] eaL=${(100 * ea).toFixed(1)}% [${eaN.slice(0, 8).map(x => x[0] + ':' + x[1]).join(',')}]`);
            });
        }
    }
}

// ── D4.2 Sichtprobe: 15 Vollnamen je Region (Ären via minYear-Gate) ──────────
console.log('\n== D4.2 Sichtprobe (seed 42; Region existiert in Ära? minYear-Gate) ==');
const rnd = mulberry32(42);
for (const nat of SCOPE) {
    const pool = results[nat].neu.pool;
    for (let i = 0; i < pool.regions.length; i++) {
        const r = pool.regions[i];
        const eras = [1955, 1985, 2015].filter(y => !r.minYear || y >= r.minYear);
        const gate = r.minYear ? ` [ab ${r.minYear} — Ären ${eras.join('/') || 'keine'}]` : '';
        const names = [];
        for (let k = 0; k < 15; k++) names.push(`${pick(r.first, rnd)} ${pick(r.last, rnd)}`);
        console.log(`\n${nat} r${i} (${REGION_LABELS[nat][i]}, w=${r.w})${gate}:\n  ${names.slice(0, 8).join(' · ')}\n  ${names.slice(8).join(' · ')}`);
    }
}

// ── D4.3 Negativprobe: verbotene Paarungen dürfen KEINE gemeinsame Region haben ──
console.log('\n== D4.3 Negativprobe (∅ = keine gemeinsame Region → nicht ziehbar) ==');
function regionsOf(nat, name, kind) {
    const pool = results[nat].neu.pool, out = [];
    pool.regions.forEach((r, i) => {
        const arr = kind === 'first' ? r.first : r.last;
        if (arr.some(x => key(x[0]) === key(name))) out.push(i);
    });
    return out;
}
const PROBES = [
    ['GER', 'Sven', 'Dogan', false], ['GER', 'Mohammed', 'Schneider', false], ['GER', 'Mehmet', 'Schneider', false],
    ['GER', 'Mehmet', 'Dogan', true], ['GER', 'Sven', 'Schneider', true],
    ['SUI', 'Jacques', 'Müller', false], ['SUI', 'Gianni', 'Favre', false], ['SUI', 'Tiago', 'Müller', false],
    ['SUI', 'Urs', 'Müller', true], ['SUI', 'Gianni', 'Bernasconi', true],
    ['BEL', 'Jacques', 'Peeters', false], ['BEL', 'Jos', 'Dupont', false], ['BEL', 'Jos', 'Peeters', true],
    ['CAN', 'Gilles', 'Singh', false], ['CAN', 'Gilles', 'Tremblay', true],
    ['ESP', 'Jordi', 'Etxeberria', false], ['ESP', 'Mikel', 'Puig', false], ['ESP', 'Jordi', 'Puig', true],
    ['FRA', 'Matthias', 'Depardieu', false], ['FRA', 'Mohamed', 'Martin', false], ['FRA', 'Mohamed', 'Benali', true],
    ['GBR', 'Mohammed', 'Smith', false], ['GBR', 'Mohammed', 'Khan', true],
    ['EST', 'Sergei', 'Tamm', false], ['EST', 'Sergei', 'Ivanov', true],
    // AUSBAU (BRIEF-AUSBAU §7 Prüfstein):
    ['GRE', 'Nikos', 'Hoxhaj', false], ['GRE', 'Dimitris', 'Malaj', false],
    ['GRE', 'Giorgos', 'Shahzad', false], ['GRE', 'Kostas', 'Pappa', false],
    ['GRE', 'Giorgos', 'Papadopoulos', true], ['GRE', 'Nikos', 'Georgiou', true],
    ['CAN', 'Sandeep', 'Tsang', false], ['CAN', 'Anil', 'Phan', false],
    ['CAN', 'Wei', 'Dhillon', false],
    ['CAN', 'Sandeep', 'Singh', true], ['CAN', 'Kevin', 'Tsang', true],
    // D3: BEL r2 maghrebinisch BEGRABEN (Filter bleibt — Doku-Probe):
    ['BEL', 'Mohamed', 'Peeters', false]
];
let fails = 0;
for (const [nat, f, l, wanted] of PROBES) {
    const rf = regionsOf(nat, f, 'first'), rl = regionsOf(nat, l, 'last');
    const inter = rf.filter(x => rl.includes(x));
    const drawable = inter.length > 0;
    const ok = drawable === wanted;
    if (!ok) fails++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${nat} "${f} ${l}": first→r[${rf}] last→r[${rl}] ∩=[${inter}] ` +
        `${drawable ? 'ZIEHBAR' : 'nicht ziehbar'} (Soll: ${wanted ? 'ziehbar' : 'nicht ziehbar'})`);
}
console.log(fails ? `\n${fails} FEHLER` : '\nAlle Negativ-/Positivproben bestanden.');
