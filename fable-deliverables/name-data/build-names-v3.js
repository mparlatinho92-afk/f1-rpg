// ============================================================================
// build-names-v3.js — Paket A v3: volle BigQuery-Datenlast → data/names.js
//
// Eingaben (alle in diesem Ordner):
//   curated-base-v2.js  – eingefrorene v2-Kuration (NIE data/names.js lesen —
//                         sonst wäre der Build nicht idempotent!)
//   fore_agg.csv        – Top-400 männliche Vornamen je Land (country,name,count)
//   sur_agg.csv         – Top-400 Nachnamen je Land
// Ausgaben:
//   ../../data/names.js     – Laufzeit-Quelle (manage-v inliniert sie)
//   names-v3-review.txt     – Review: Köpfe, Zähler, Warnungen je Nation
//
// Gewichts-Modell (Kern von v3):
//   w = max(1, round(100 * (count/maxCount)^ALPHA)) mit ALPHA = 0.6
//   Begründung (analyze-weights.js): linear (α=1) überzeichnet den Kopf, weil
//   die Top-400-Trunkierung die fehlende Tail-Masse dem Kopf zuschlägt
//   (Smith wäre 3,6 % st. real ~1,3 %). α=0.6 reproduziert die realen
//   Bevölkerungsanteile im Kopf (Smith ≈1,4 %, Müller ≈1,5 %) und lässt den
//   Long-Tail leben. ALPHA ist DIE Stellschraube für Kopf-Klumpung.
//
// Ära-Regeln (Datensatz ist gegenwarts-/erwachsenenlastig):
//   early  (<1975)      – bleibt komplett kuratiert, kein Daten-Merge
//   mid    (1975–2009)  – volle Datenlast (≙ heutige Erwachsene = Mid-Ära-Debütanten)
//   modern (≥2010)      – kuratierter Kopf dominiert; Datenmasse gedeckelt
//                         (MODERN_CAP), damit kein 2020er-Rookie "Norbert" häuft
//   Nachnamen           – ära-stabil, volle Datenlast
//   Kuratierte Namen, die in den Daten vorkommen → echtes Daten-Gewicht
//   (Anzeigeform bleibt die kuratierte, z.B. Akzente). Kuratierte ohne
//   Datenbeleg → BUCKET-Mapping (altes 1–5 auf neue Skala).
//
// Sonderkorrekturen (dokumentiert, datenbegründet):
//   USA: Datensatz ist hispanisch verzerrt (Garcia #1 mit 250k vs. Smith 177k;
//        US-Census 2010: Smith 2,44M > Garcia 1,17M). Korrekturfaktor
//        = CensusRatio/DatenRatio ≈ 0,34 auf HISPANIC-Namen (sur & fore).
//   RUS: Datensatz-Transliterationsstil (Aleksandr/Sergey) wird auf den
//        Pool-Stil (Alexander/Sergei) UMBENANNT und die Counts gemerged
//        (v2 hatte sie verworfen → Gewichtsverlust).
//   Neu mit Datenbasis: ARG (v2-Auslassung), NOR, GRE, TUR, KOR (Bonus —
//        bisher nur Fallback DEN/INT; Junior-Welt/Galaxie profitiert direkt).
//   Ohne Datenbasis (wissensbasiert erweitert): AUS/NZL/ZIM (+GB-Datenleihe),
//        VEN (+CO-Datenleihe), THA, MON, CHN, MAR-Vornamen.
//
// Aufruf: node build-names-v3.js   (aus fable-deliverables/name-data/)
// ============================================================================
'use strict';
const fs = require('fs');
const BASE = require('./curated-base-v2.js');

const ALPHA = 0.6, SCALE = 100, MODERN_CAP = 14;
// Kuratierte Namen ohne Datenbeleg: 1–5-Bucket → neue Skala (log-artig, s. analyze-weights)
const BUCKET = { 5: 90, 4: 45, 3: 26, 2: 12, 1: 2 };
// Größenklassen: [surTotal, foreTotal, surTorso, foreTorso, modernDup]
// Torso → Pool (echte Gewichte), Rest bis Total → Tails (Gewicht 1).
// modernDup: wie viele Fore-Torso-Namen zusätzlich (gedeckelt) ins modern-Fenster.
const CLASSES = {
    // v4 (Variante B) – Kapazität für Jahrhunderte × dichte Lokalszenen. Torso = gewichteter
    // Kopf (Ära-Kopf bleibt via curated-base geschützt), Masse in kompakte weight-1-Tails.
    big:   { sur: 1500, fore: 600, surT: 450, foreT: 260, modDup: 120 },
    mid:   { sur: 1000, fore: 450, surT: 340, foreT: 210, modDup: 90 },
    small: { sur:  600, fore: 320, surT: 240, foreT: 150, modDup: 60 }
};

// ── Transliteration & Basis-Filter (aus extract-tails.js portiert) ─────────
const CYR = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'i','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' };
function translit(s) {
    let out = '';
    for (const ch of s) {
        const lo = ch.toLowerCase();
        if (CYR[lo] !== undefined) { const t = CYR[lo]; out += (ch === lo) ? t : (t.charAt(0).toUpperCase() + t.slice(1)); }
        else out += ch;
    }
    return out;
}
const hasCyrillic = s => /[Ѐ-ӿ]/.test(s);
const isLatinName = s => /^[A-Za-zÀ-ÖØ-öø-ÿĀ-žŁłŚśŹźŻżĆćŃńĄąĘęİıĞğŞş][A-Za-zÀ-ÖØ-öø-ÿĀ-žŁłŚśŹźŻżĆćŃńĄąĘęİıĞğŞş' -]+$/.test(s);
const key = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ── Kulturfremd-Filter (aus extract-tails.js, unverändert) ──────────────────
const SOUTH_ASIAN = /^(Khan|Patel|Singh|Kaur|Ali|Ahmed|Ahmad|Hussain|Hussein|Shah|Sharma|Kumar|Begum|Bibi|Akhtar|Iqbal|Mahmood|Aslam|Raja|Mistry|Chowdhury|Choudhury|Miah|Uddin|Rahman|Rehman|Islam|Mohammed|Mohamed|Mohammad|Muhammad|Mahmoud|Syed|Sheikh|Malik|Javed|Anwar|Bashir|Yousaf|Gill|Sandhu|Sidhu|Dhaliwal|Brar|Grewal|Dhillon|Bhatti|Chaudhry|Mirza|Abbas|Raza|Riaz|Ashraf|Akram|Saleem|Nazir|Ramzan|Younis|Aziz|Karim|Rashid|Hamid|Amin|Haq|Sultan|Tariq|Zaman|Qureshi|Ansari|Siddiqui|Kapoor|Mehta|Gupta|Verma|Reddy|Nair|Rao|Das|Devi|Yadav|Kumari|Gujjar|Jutt|Butt|Arain|Baig|Cheema|Warraich|Bajwa|Virk|Gondal|Sahi|Sial|Chaudhary|Chauhan)$/i;
const EAST_ASIAN = /^(Nguyen|Tran|Le|Pham|Hoang|Vu|Dang|Bui|Do|Ho|Ngo|Duong|Kim|Park|Choi|Jung|Kang|Cho|Yoon|Jang|Lim|Han|Oh|Shin|Kwon|Wang|Li|Zhang|Liu|Chen|Yang|Zhao|Huang|Zhou|Wu|Xu|Sun|Ma|Zhu|Lin|Guo|Wong|Chan|Cheung|Lam|Leung|Tang|Yeung|Ng|Chow|Tan|Lee|Teo|Goh|Yap|Ong)$/i;
const ARABIC_MAGHREB = /^(Benali|Ben[ -]?[A-Z]?[a-z]+|El[ -][A-Z][a-z]+|Al[ -][A-Z][a-z]+|Haddad|Saidi|Cherif|Bouazza|Bouzid|Hamdi|Trabelsi|Gharbi|Mansouri|Amrani|Alaoui|Idrissi|Tazi|Fassi|Berrada|Diallo|Camara|Traore|Traoré|Keita|Cisse|Cissé|Sylla|Toure|Touré|Konate|Konaté|Coulibaly|Sow|Ba|Bah|Barry|Balde|Kone|Koné|Sissoko|Fofana|Doumbia|Sanogo|Ouattara|Drame|Dramé|Kaba|Sacko|Samake|Dembele|Dembélé)$/i;
const TURKISH = /^(Yilmaz|Yılmaz|Kaya|Demir|Sahin|Şahin|Celik|Çelik|Yildiz|Yıldız|Yildirim|Yıldırım|Ozturk|Öztürk|Aydin|Aydın|Ozdemir|Özdemir|Arslan|Dogan|Doğan|Kilic|Kılıç|Aslan|Cetin|Çetin|Kara|Koc|Koç|Kurt|Ozkan|Özkan|Simsek|Şimşek|Polat|Erdogan|Erdoğan|Yalcin|Yalçın|Gunes|Güneş|Bulut|Tas|Taş|Caliskan|Çalışkan|Turan|Tekin|Aktas|Aktaş|Unal|Ünal|Avci|Avcı|Sen|Şen|Acar|Guler|Güler|Erdem|Ates|Ateş)$/i;
const BALKAN = /(ić|ic|ovic|ović|evic|ević|inac|adzic|adžić|oski|evski|ovski|iu|escu|eanu|oglu|oğlu)$|^(Krasniqi|Gashi|Berisha|Shala|Hoxha|Kelmendi|Morina|Bytyqi|Zeka|Rama|Dervishi|Marku|Gjoka|Leka|Prela)$/i;
const SLAVIC_EAST = /(ov|ev|in|yn|enko|chuk|shvili|adze|yan|ian)$/;
// Für FRA/CAN: OHNE -in/-yn/-ian (Martin, Morin, Perrin, Potvin … sind legitim französisch)
const SLAVIC_NARROW = /(ov|ev|enko|chuk|shvili|adze)$/;
const IBERIAN_PT = /^(Silva|Santos|Ferreira|Pereira|Oliveira|Costa|Rodrigues|Martins|Sousa|Souza|Fernandes|Gomes|Lopes|Ribeiro|Gonçalves|Goncalves|Marques|Carvalho|Almeida|Pinto|Alves|Dias|Teixeira|Correia|Mendes|Moreira|Soares|Da Silva|Dos Santos|De Sousa|Nunes|Freitas|Cardoso|Rocha|Barbosa|Cruz|Neves|Coelho|Cunha|Vieira|Monteiro|Batista|Fonseca|Machado|Da Costa|Reis|Antunes|Matos|Fereira|Miranda|Nogueira|Ramos|Tavares|Azevedo|Barros|Borges|Brito|Cavalcante|Castro|Duarte|Farias|Andrade|Araujo|Araújo|Assis|Aguiar|Abreu|Amorim|Anjos|Amaral)$/i;
const HISPANIC = /^(Garcia|García|Rodriguez|Rodríguez|Martinez|Martínez|Lopez|López|Gonzalez|González|Hernandez|Hernández|Perez|Pérez|Sanchez|Sánchez|Ramirez|Ramírez|Torres|Flores|Rivera|Gomez|Gómez|Diaz|Díaz|Reyes|Morales|Ortiz|Gutierrez|Gutiérrez|Chavez|Chávez|Ramos|Ruiz|Mendoza|Alvarez|Álvarez|Castillo|Jimenez|Jiménez|Vasquez|Vásquez|Vazquez|Vázquez|Moreno|Herrera|Medina|Aguilar|Vargas|Guzman|Guzmán|Mendez|Méndez|Munoz|Muñoz|Rojas|Salazar|Contreras|Suarez|Suárez|Delgado|Pena|Peña|Rios|Ríos|Cabrera|Campos|Vega|Fuentes|Carrillo|Leon|León|Santiago|Dominguez|Domínguez|Maldonado|Espinoza|Valdez|Juarez|Juárez|Molina|Acosta|Ayala|Zamora|Villarreal|Trevino|Treviño|Cortez|Cortés|Soto|Serrano|Solis|Solís|Rosales|Estrada|Zuniga|Zúñiga|Nunez|Núñez|Ochoa|Cardenas|Cárdenas|Navarro|Padilla|Barrera|Camacho|Cervantes|Marquez|Márquez|Escobar|Galvan|Galván|Velasquez|Velásquez|Velazquez|Velázquez|Ibarra|Cisneros|Bautista|Meza|Villanueva|Orozco|Avila|Ávila|Robles|Sandoval|Bravo|Lara|Cano|Quintero|Bermudez|Bermúdez|Osorio|Valencia|Franco|Guerrero|Paredes|Bustamante|Ponce|Salinas|Arroyo|Montoya|Palacios|Zapata|Miranda|Mora|Rincon|Rincón|Uribe|Restrepo|Ospina|Giraldo|Cardona|Correa|Betancur|Zuluaga|Arango|Bedoya|Agudelo|Henao|Sierra|Villa|Gallego|Montes)$/i;
const NORDIC_FOREIGN = new RegExp(SOUTH_ASIAN.source + '|' + EAST_ASIAN.source + '|' + ARABIC_MAGHREB.source + '|' + TURKISH.source + '|' + BALKAN.source, 'i');
const GIVEN_AS_SURNAME = /^(Maria|Jose|José|Juan|Ana|Luis|Luiz|Carlos|Jorge|Pedro|Paulo|Henrique|Antonio|António|Miguel|Manuel|Francisco|Fernando|Ricardo|Eduardo|Daniel|Rafael|Gabriel|Marcos|Mohamed|Ahmed|Ali|Hassan|Omar|Ibrahim|Said|Rachid|Karim|Amine|Youssef|Aziz|Kamal|Adam|Peter|Hans|Johan|Anna|Marie|Jean|Michel|Andre|André|Bernard|Claude|Laurent|Pascal|Christian|Martin|Thomas|Simon|David|Vincent|Robert|Richard|Denis|Georges|Antoine|Julien|Olivier|Rene|René|Roger|Alain|Marcel|Franck|Frank)$/i;
// Weibliche griechische Nachnamensformen (Genitiv-Paare: -poulos→-poulou usw.)
const GREEK_FEMALE = /(opoulou|poulou|idou|iadou|adou|aki)$/i;
// Hispanische US-Vornamen (für Census-Korrektur)
const US_HISP_FIRST = /^(Jose|Juan|Carlos|Luis|Miguel|Jorge|Jesus|Pedro|Rafael|Alejandro|Fernando|Ricardo|Roberto|Eduardo|Javier|Sergio|Alberto|Mario|Manuel|Francisco|Antonio|Angel|Andres|Julio|Ruben|Armando|Enrique|Gerardo|Salvador|Arturo|Alfredo|Ramon|Raul|Cesar|Hector|Oscar|Omar|Pablo|Jaime|Gustavo|Guillermo|Felipe|Rodrigo|Emilio|Ernesto|Diego|Santiago|Cristian|Alfonso|Ignacio|Rodolfo|Adolfo|Humberto|Gilberto|Osvaldo|Marcelo|Mauricio|Esteban|Federico|Gonzalo|Rigoberto|Efrain|Ismael|Israel|Ivan|Joaquin|Leonel|Lorenzo|Marco Antonio|Juan Carlos|Jose Luis)$/i;
// US-Census 2010: Smith 2.442.977, Garcia 1.166.120 → Soll-Ratio Garcia/Smith 0,477.
// Datensatz: Garcia 250.895, Smith 177.637 → Ist-Ratio 1,412. Korrektur = Soll/Ist.
const US_HISP_DAMP = (1166120 / 2442977) / (250895 / 177637); // ≈ 0,338

// ── Akzent-/Stil-Reparatur (aus curate-tails.js portiert + erweitert) ───────
const ACCENT = {
    'Gutierrez':'Gutiérrez','Ramirez':'Ramírez','Jimenez':'Jiménez','Nuñez':'Núñez','Nunez':'Núñez','Mendez':'Méndez','Marquez':'Márquez','Cortes':'Cortés','Leon':'León','Duran':'Durán','Gimenez':'Giménez','Chavez':'Chávez','Guzman':'Guzmán','Juarez':'Juárez','Velazquez':'Velázquez','Velasquez':'Velásquez','Alvarez':'Álvarez','Vasquez':'Vásquez','Hernandez':'Hernández','Gonzalez':'González','Perez':'Pérez','Sanchez':'Sánchez','Garcia':'García','Martinez':'Martínez','Lopez':'López','Rodriguez':'Rodríguez','Gomez':'Gómez','Diaz':'Díaz','Suarez':'Suárez','Mejia':'Mejía','Cardenas':'Cárdenas','Rincon':'Rincón','Rios':'Ríos','Munoz':'Muñoz','Pena':'Peña','Ibanez':'Ibáñez','Fernandez':'Fernández','Cesar':'César','Ivan':'Iván','Raul':'Raúl','Jesus':'Jesús','Andres':'Andrés','Agustin':'Agustín','Oscar':'Óscar','Victor':'Víctor','Angel':'Ángel','Fabian':'Fabián','Jose Luis':'José Luis','Jose Manuel':'José Manuel','Jose Maria':'José María','Miguel Angel':'Miguel Ángel','Martin':'Martín','Ruben':'Rubén','Sebastian':'Sebastián','Jose':'José','Joaquin':'Joaquín','Adrian':'Adrián','Julian':'Julián','Hector':'Héctor','Ramon':'Ramón','Simon':'Simón','Tomas':'Tomás','Nicolas':'Nicolás','Matias':'Matías','Gaston':'Gastón',
    'Frederic':'Frédéric','Jerome':'Jérôme','Mickael':'Mickaël','Gerard':'Gérard','Francois':'François','Clement':'Clément','Noel':'Noël','Benoit':'Benoît','Andre':'André','Rene':'René','Eric':'Éric','Stephane':'Stéphane','Cedric':'Cédric','Lefevre':'Lefèvre','Sebastien':'Sébastien','Jeremy':'Jérémy','Theo':'Théo','Leo':'Léo',
    'Dangelo':"D'Angelo",'Damico':"D'Amico",'Dagostino':"D'Agostino",
    'Oreilly':"O'Reilly",'Oconnell':"O'Connell",'Mcgrath':'McGrath',
    'Grigorev':'Grigoriev','Vasilii':'Vasili','Anatolii':'Anatoli',
    'Mueller':'Müller','Schaefer':'Schäfer','Koenig':'König','Jaeger':'Jäger','Krueger':'Krüger','Schroeder':'Schröder',
    'Goncalves':'Gonçalves','Araujo':'Araújo','Conceicao':'Conceição','Simoes':'Simões','Goncalo':'Gonçalo','Joao':'João','Antonio':'Antônio'
};
// Kontext-Regeln: wo Akzent-Reparatur NICHT greifen darf (portiert)
const NO_ACCENT_NATIONS = new Set(['GER','AUT','SUI','NED','DEN','SWE','GBR','IRL','CZE','POL','HUN','EST','FIN','JPN','RUS','ISR','IND','MAS','INA','MAR','CAN','AUS','NZL','NOR','GRE','TUR','KOR','USA']);
const ES_ONLY = new Set(['Martin','Ruben','Sebastian','Leon','Duran','Victor','Oscar','Angel','Ivan','Fabian','Simon','Adrian','Julian','Jose','Tomas','Nicolas','Cesar','Ramon']);
const FR_NATIONS = new Set(['FRA','BEL','SUI','CAN','MON']);
const FR_ONLY = new Set(['Frederic','Jerome','Mickael','Gerard','Francois','Clement','Noel','Benoit','Andre','Rene','Eric','Stephane','Cedric','Lefevre','Sebastien','Jeremy','Theo','Leo']);
const DE_ONLY = new Set(['Mueller','Schaefer','Koenig','Jaeger','Krueger','Schroeder']);
const PT_NATIONS = new Set(['POR','BRA']);
const PT_ONLY = new Set(['Goncalves','Araujo','Conceicao','Simoes','Goncalo','Joao','Antonio']);
function fixName(nat, n) {
    if (!(n in ACCENT)) return n;
    if (ES_ONLY.has(n) && (NO_ACCENT_NATIONS.has(nat) || FR_NATIONS.has(nat))) return n;
    if (FR_ONLY.has(n) && !FR_NATIONS.has(nat) && nat !== 'GER') return n;
    if (FR_ONLY.has(n) && nat === 'GER' && !['Andre','Rene'].includes(n)) return n;
    if (DE_ONLY.has(n) && !['GER','AUT','SUI'].includes(nat)) return n;
    if (PT_ONLY.has(n) && !PT_NATIONS.has(nat)) return n;
    if (n === 'Antonio' && nat !== 'BRA') return n; // Antônio nur BRA; POR nutzt António via Pool
    return ACCENT[n];
}

// ── Nation-Konfiguration ────────────────────────────────────────────────────
// iso, cls (Größenklasse), route [regex → regionIdx], banFirst/banLast,
// translit, rename {von:zu} (Stil-Angleichung, Counts werden gemerged)
const CFG = {
    GBR: { iso:'GB', cls:'big', route:[[SOUTH_ASIAN,1]], banLast:[EAST_ASIAN,ARABIC_MAGHREB,TURKISH,BALKAN,SLAVIC_EAST,IBERIAN_PT,HISPANIC,/^(Murphy|Kelly|Walsh|Byrne|Doyle|Ryan|O'|Mc|Mac)/] },
    GER: { iso:'DE', cls:'big', banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST,/ski$|cki$/], banFirst:[/^(Ali|Mehmet|Mustafa|Murat|Ahmet|Hasan|Hüseyin|Ibrahim|Mohammed|Mohammad|Muhammed|Ahmad|Omar|Osman|Emre|Can|Cem|Deniz|Kadir|Kemal|Yusuf|Halil|Süleyman|Ismail|Recep|Fatih|Serkan|Erkan|Metin|Sinan|Volkan|Hakan|Burak|Baris|Onur|Ugur|Cengiz|Orhan|Adem|Aydin|Bülent|Dursun|Erdal|Ferhat|Gökhan|Harun|Ilhan|Kenan|Levent|Mesut|Nuri|Ramazan|Salih|Tarkan|Yasin|Zeki)$/i] },
    ITA: { iso:'IT', cls:'big', banLast:[NORDIC_FOREIGN,HISPANIC,IBERIAN_PT] },
    FRA: { iso:'FR', cls:'big', route:[[ARABIC_MAGHREB,1],[/^(Mohamed|Mehdi|Karim|Yanis|Rayan|Sami|Bilal|Ibrahim|Mamadou|Moussa|Amine|Hamza|Sofiane|Youssef|Abdoulaye|Ousmane|Yassine|Rachid|Farid|Nabil|Malik|Idriss|Souleymane)$/i,1]], banLast:[SOUTH_ASIAN,EAST_ASIAN,TURKISH,BALKAN,IBERIAN_PT,HISPANIC,SLAVIC_NARROW] },
    // USA-Dämpfungen (Census-verankert): Hispanic s.o.; Südasiatisch massiv verzerrt
    // (Patel: Daten 93k/Smith 177k = 0,52 — Census 230k/2,44M = 0,094 → ~0,25);
    // Ostasiatisch fast korrekt (Nguyen Census-Ratio 0,179 vs. Daten 0,183 → 0,85).
    // Zusätzlich philippinisch verzerrte Namen (Cruz: Daten 91k = 12× Census-Ratio) → 0,1
    USA: { iso:'US', cls:'big', dampLast:[[/^(Cruz|Santos|De La Cruz|Dela Cruz|Bautista|Villanueva|Ocampo|Aquino|Manalo)$/i,0.1],[HISPANIC,US_HISP_DAMP],[SOUTH_ASIAN,0.25],[EAST_ASIAN,0.85]], dampFirst:[[US_HISP_FIRST,US_HISP_DAMP]] },
    BRA: { iso:'BR', cls:'big', banLast:[NORDIC_FOREIGN] },
    JPN: { iso:'JP', cls:'big', banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC], banFirst:[/^(Ricardo|Carlos|Jose|Juan|Luis|Marcos|Paulo|Pedro|Antonio|Daniel|David|Michael|John|Kevin|Alex|Eric|Jun Ho|Min)$/i] },
    ESP: { iso:'ES', cls:'big', route:[[/^(Puig|Vila|Serra|Ferrer|Roca|Soler|Font|Bosch|Mas|Casals|Pujol|Rovira|Sala|Torrent|Riera|Grau|Camps|Comas|Vives|Prat|Ripoll|Batlle|Segarra|Codina)$/,1],[/^(Etxeberria|Agirre|Aguirre|Ibarra|Zubizarreta|Urrutia|Garmendia|Mendizabal|Otegi|Goikoetxea|Zabala|Aranburu|Elorza|Iturbe|Arrieta|Lasa|Zubiri|Etxarri|Olaizola|Larranaga|Larrañaga)$/,2]], banLast:[NORDIC_FOREIGN] },
    ARG: { iso:'AR', cls:'mid' }, // v2-Auslassung — Daten sind sauber (González/Gómez-Kopf)
    NED: { iso:'NL', cls:'mid', banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC] },
    BEL: { iso:'BE', cls:'mid', route:[[/^(Van|Vande|Vander|De [A-Z]|D'|Ver[a-z]|Claes|Peeters|Janssens|Maes|Mertens|Willems|Wouters|Goossens|Pauwels|Aerts|Michiels|Smets|Martens|Segers|Hendrickx|Vervoort|Vandenberghe|Vanden|Bogaert|Bogaerts|Cools|Coppens|Daems|Dierckx|Geerts|Hermans|Jacobs|Lenaerts|Luyten|Moons|Naessens|Nys|Pittoors|Raes|Roggeman|Smolders|Stevens|Swinnen|Thys|Tielemans|Torfs|Truyens|Verheyen|Verhoeven|Vermeiren|Verstraete|Vos|Wuyts)/,1]], banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC] },
    SUI: { iso:'CH', cls:'mid', route:[[/^(Favre|Rochat|Bonvin|Chevalley|Duc|Rossier|Perret|Monnier|Grandjean|Berney|Pittet|Bovay|Cornuz|Curdy|Dubuis|Fardel|Gaillard|Genoud|Jaquier|Maillard|Mermoud|Nicollier|Pasche|Rappaz|Rochaix|Savary|Tissot|Vuille|Berthoud|Besson|Bovet|Chappuis|Cretton|Delaloye|Ducret|Dupertuis|Emery|Gross|Magnin|Marclay|Michellod|Morand|Pellaud|Praz|Quennoz|Rausis|Roduit|Terrettaz|Vouillamoz|Aubert|Badan|Blanc|Bourgeois|Braillard|Buffat|Chapuis|Cherpillod|Corboz|Cosandey|Delessert|Desmeules|Gillieron|Jaccard|Jaccoud|Longchamp|Mercier|Meylan|Nicole|Paccaud|Panchaud|Regamey|Vallotton|Vulliamy)$/,1],[/^(Bernasconi|Rossi|Bianchi|Ferrari|Fontana|Galli|Crivelli|Pedrazzini|Albertini|Beretta|Bettosini|Bianda|Bomio|Cattaneo|Colombo|Delco|Delcò|Foletti|Genazzi|Gianinazzi|Guidotti|Lepori|Lucchini|Mazzoleni|Molteni|Mombelli|Pagani|Pedretti|Pellegrini|Piattini|Poretti|Quadri|Realini|Regazzoni|Rezzonico|Riva|Robbiani|Sala|Solari|Storni|Taddei|Vanoni|Vassalli|Zanetti|Zanini)$/,2],[IBERIAN_PT,3]], banLast:[SOUTH_ASIAN,EAST_ASIAN,ARABIC_MAGHREB,TURKISH,BALKAN,SLAVIC_EAST,HISPANIC] },
    AUT: { iso:'AT', cls:'mid', banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,/ski$|cki$|ic$|ić$/] },
    SWE: { iso:'SE', cls:'mid', banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST] },
    FIN: { iso:'FI', cls:'mid', route:[[/(berg|ström|strom|holm|qvist|kvist|lund|gren|blad|felt|man|sson|stedt|näs|vik|by|backa|fors)$/,1]], banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST] },
    DEN: { iso:'DK', cls:'mid', banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST] },
    NOR: { iso:'NO', cls:'mid', banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST], banFirst:[/^(Mohammed|Mohamed|Muhammad|Ahmed|Ali|Omar|Hassan|Ibrahim|Abdul|Mustafa)$/i] },
    CAN: { iso:'CA', cls:'mid', route:[[/^(Tremblay|Gagnon|Roy|Côté|Cote|Bouchard|Gauthier|Morin|Lavoie|Fortin|Bergeron|Pelletier|Villeneuve|Leblanc|Belanger|Bélanger|Levesque|Lévesque|Girard|Simard|Boucher|Caron|Beaulieu|Cloutier|Dubé|Dube|Poirier|Fournier|Lapointe|Leclerc|Lefebvre|Poulin|Thibault|Nadeau|Martel|Mercier|Bédard|Bedard|Grenier|Lessard|Bernier|Savard|Gagné|Gagne|Ouellet|Paquette|Desjardins|Demers|Perreault|Boudreau|Couture|Laflamme|Larouche|Lachance|Vachon|Dionne|Gosselin|Turcotte|Rioux|Bilodeau|Dufour|Tessier|Lemieux|Charbonneau|Brisson|Beaudoin|Deschamps|Dupuis|Fontaine|Gendron|Giroux|Houle|Labelle|Lacroix|Lambert|Langlois|Lapierre|Larose|Legault|Lemay|Marcoux|Ménard|Menard|Michaud|Moreau|Paradis|Parent|Plante|Proulx|Renaud|Robitaille|Séguin|Seguin|St-Pierre|Therrien|Trudeau|Vaillancourt)$/,1],[new RegExp(SOUTH_ASIAN.source+'|'+EAST_ASIAN.source,'i'),2]], banLast:[ARABIC_MAGHREB,TURKISH,BALKAN,SLAVIC_NARROW,IBERIAN_PT,HISPANIC] },
    MEX: { iso:'MX', cls:'mid' },
    RSA: { iso:'ZA', cls:'mid', route:[[/^(Van |Van[dr]|Du |Le Roux|De [A-Z]|Botha|Pretorius|Venter|Fourie|Nel|Coetzee|Steyn|Kruger|Joubert|Marais|Swanepoel|Viljoen|Vorster|Erasmus|Bezuidenhout|Oosthuizen|Potgieter|Grobler|Meiring|Snyman|Strydom|Uys|Visagie|Wessels|Barnard|Bester|Boshoff|Bosman|Brits|Burger|Claassen|Conradie|Cronje|Engelbrecht|Ferreira|Havenga|Heyns|Jansen|Jordaan|Kotze|Lombard|Lotter|Louw|Malan|Marx|Meyer|Muller|Naude|Olivier|Prinsloo|Rossouw|Scheepers|Schoeman|Smit|Steenkamp|Terblanche|Theron|Truter|Vermaak|Vermeulen)$/,1],[/^(N[dgkctz]|M[bcdfgkhlmnpstv]h?|Dl|Kh[ou]|Zul|Zw|Ts|Hl|X[hou]|S[ei]th|Gum|Bu|Mo[kf]|Ma[bhs]|Ra[md]|Se[bk]|Le[bkt]|Ph|Th[ae]m|Nx|Nq|Gc|Mc[au])/,2]], banLast:[SOUTH_ASIAN,EAST_ASIAN,IBERIAN_PT,HISPANIC] },
    IRL: { iso:'IE', cls:'mid', banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST] },
    POR: { iso:'PT', cls:'mid', banLast:[NORDIC_FOREIGN,HISPANIC] },
    COL: { iso:'CO', cls:'mid' },
    RUS: { iso:'RU', cls:'mid', translit:true, banLast:[/(ova|eva|ina|yna|aya)$/i], banFirst:[/(a|ya)$/i],
           rename:{ 'Aleksandr':'Alexander','Sergey':'Sergei','Dmitrii':'Dmitri','Dmitriy':'Dmitri','Dmitry':'Dmitri','Evgenii':'Evgeni','Evgeniy':'Evgeni','Evgeny':'Evgeni','Aleksei':'Alexei','Aleksey':'Alexei','Alexey':'Alexei','Yurii':'Yuri','Yuriy':'Yuri','Yury':'Yuri','Andrey':'Andrei','Maksim':'Maxim','Vitalii':'Vitali','Vitaliy':'Vitali','Vitaly':'Vitali','Nikolay':'Nikolai','Georgii':'Georgi','Georgiy':'Georgi','Valerii':'Valeri','Valeriy':'Valeri','Valery':'Valeri','Anatoliy':'Anatoli','Anatoly':'Anatoli','Grigorii':'Grigori','Grigoriy':'Grigori' } },
    POL: { iso:'PL', cls:'mid', banLast:[/(ska|cka|zka)$/i,NORDIC_FOREIGN] },
    CZE: { iso:'CZ', cls:'mid', banLast:[/(ová|á)$/,NORDIC_FOREIGN] },
    HUN: { iso:'HU', cls:'mid', banLast:[NORDIC_FOREIGN] },
    GRE: { iso:'GR', cls:'mid', banLast:[NORDIC_FOREIGN,GREEK_FEMALE,IBERIAN_PT,HISPANIC,/^(Papa|Mustafa|Ahmet|Mehmet|Hasan|Osman|Hussein|Ali Osman|Huseyin|Hüseyin|Ismail|Ramadan|Nikos|Dimitris|Giorgos|Kostas|Giannis|Christos|Vasilis|Vassilis|Panagiotis|Stavros|Michalis|Antonis|Georgios|Konstantinos|Dimitrios|Ioannis|Nikolaos|George|Christo)$/i], banFirst:[/^(Mohamed|Mohammed|Muhammad|Ali|Ahmed|Ahmad|Hassan|Hussein|Omar|George|John|Peter|Mike|Maria)$/i] },
    TUR: { iso:'TR', cls:'mid', banLast:[SOUTH_ASIAN,EAST_ASIAN,IBERIAN_PT,HISPANIC,SLAVIC_EAST] }, // fore_agg hat keine TR-Vornamen → kuratierte Fenster
    URU: { iso:'UY', cls:'small' },
    ISR: { iso:'IL', cls:'small', banLast:[/^(Mohammed|Mohamed|Muhammad|Ahmad|Ahmed|Ali|Mahmoud|Hassan|Khalil|Ibrahim|Omar|Mansour|Taha|Odeh|Salame|Salameh|Jaber|Khoury|Haddad|Srour|Zoabi|Agbaria|Kanaan|Masarwa|Watad|Abu[ -])/i], banFirst:[/^(Mohammed|Mohamed|Muhammad|Ahmad|Ahmed|Ali|Mahmoud|Hassan|Omar|Ibrahim|Khalil|Yousef|Mustafa|Adham|Amir)$/i] },
    IND: { iso:'IN', cls:'small', route:[[/^(Reddy|Nair|Menon|Rao|Iyer|Iyengar|Krishnan|Pillai|Naidu|Naicker|Gowda|Shetty|Hegde|Kamath|Bhat|Nayak|Acharya|Adiga|Kulkarni|Deshpande|Joshi|Patil|Chari|Raman|Rajan|Srinivasan|Subramanian|Subramaniam|Venkatesh|Ramachandran|Balasubramanian|Natarajan|Sundaram|Swamy|Murthy|Murty|Chandran|Menen|Varma|Warrier|Kurup|Panicker|Namboothiri)$/,1]] },
    MAS: { iso:'MY', cls:'small', route:[[/^(Tan|Lee|Lim|Wong|Ng|Chan|Chong|Chin|Ong|Yap|Yong|Teo|Goh|Ho|Chua|Khoo|Toh|Sim|Foo|Gan|Low|Loh|Koh|Tay|Seah|Chew|Cheng|Chia|Yeo|Ang|Oh|Soh|Neo|Kwek|Leong|Liew|Ling|Loke|Mah|Mok|Pang|Phang|Poh|Quah|See|Seow|Sia|Siow|Soo|Tee|Ting|Tong|Wan[g]?|Wee|Yam|Yeap|Yen|Yip|Chai|Chang|Chee|Cheah|Cheok|Chiam|Chiew|Chik|Choo|Chow|Choy|Chu|Chung|Eng|Fong|Fung|Gooi|Heng|Hii|Hoo|Kam|Kang|Kee|Khaw|Khor|Kong|Koo|Kuan|Kwan|Lai|Lam|Lau|Law|Leow|Loo|Lua|Lye|Ma|Nga|Ngu|Oon|Ooi|Ow|Pua|Puah|Saw|Sng|Soong|Su|Sua|Tam|Tang|Tham|Thoo|Tiong|Voon|Wu|Yau|Yew|Yii|Yu|Yuen)$/,1]], banLast:[SOUTH_ASIAN] },
    INA: { iso:'ID', cls:'small' },
    KOR: { iso:'KR', cls:'small', foreCap0:true }, // KR-Vornamen sind Hangul → kuratiert (romanisiert)
    EST: { iso:'EE', cls:'small', route:[[/(ov|ev|in|yn|enko|chuk)$|^(Ivanov|Smirnov|Petrov|Kuznetsov|Popov|Volkov|Sokolov|Nikitin|Orlov|Fjodorov|Fyodorov|Vassiljev|Vasiljev|Aleksejev|Andrejev|Sergejev|Mihhailov|Pavlov|Bogdanov|Stepanov|Semjonov|Tarassov|Kolesnik)/,1]], banLast:[/(ova|eva|ina|yna|aya)$/i], banFirst:[/^(Aleksandr|Sergei|Andrei|Dmitri|Aleksei|Vladimir|Igor|Roman|Oleg|Artur|Maksim|Jevgeni|Pavel|Anton|Nikolai|Aleksander|Sander)$/] },
    MAR: { iso:'MA', cls:'small', foreCap0:true, banLast:[/^(El|Ben|Da|De|Ell|Kech|Wac|None|Ced|Dh|Df|Eh|Ef|Jef|Simo|Fati|Abdo|Amine|Said|Rachid|Hassan|Ahmed|Ali|Youssef|Aziz|Karim|Kamal|Adam|Mohamed)$/i] }
};

// ── Kurationspass (aus curate-tails.js portiert, wirkt jetzt auf die Masse) ──
const OPS = {
    GBR: { drop: { last: ['Louise'] } },
    GER: { drop: { first: ['Ali'], last: ['Can'] } },
    ITA: { drop: { last: ['Giuseppe','Mauro','Salvatore','Marco','Francesco','Luca','Simone'] } },
    FRA: { drop: { last: ['Ben','Lou','Bou'] },
           move: { last: { 'Ndiaye':1,'Diaby':1,'Diarra':1,'Benoit':0 }, first: { 'Benjamin':0 } } },
    BRA: { drop: { last: ['Cristina','Aparecida','Junior','Neto','Filho','Felipe','Lucas','Alexandre','Roberto','Augusto','Paula','De Souza','De Oliveira'] } },
    JPN: { drop: { first: ['Marcelo','Roberto','Jorge'] } },
    ESP: { drop: { first: ['Mohamed','Javi','Rafa','Fran','Manolo','Pepe','Paco','Curro','Quique','Chema'], last: ['Garcia Garcia'] },
           move: { first: { 'Joan':1,'Jordi':1,'Marc':1,'Xavi':1,'Pau':1,'Oriol':1,'Mikel':2,'Iker':2,'Ander':2,'Unai':2,'Aitor':2,'Asier':2,'Gorka':2 } } },
    BEL: { drop: { first: ['Mohamed','Ali'], last: ['Ben','Vdb'] },
           move: { last: { 'Desmet':1,'Devos':1,'Lemmens':1,'Dhondt':1,'Wauters':1,'Smet':1,'Declercq':1,'Baert':1,'Lambrechts':1,'Lauwers':1,'Bosmans':1,'Christiaens':1,'Pieters':1,'Cornelis':1,'Timmermans':1,'Janssen':1,'Jansen':1 },
                   first: { 'Eddy':1,'Danny':1,'Tim':1,'Tom':1,'Bart':1,'Jan':1,'Koen':1,'Kris':1,'Wim':1,'Geert':1,'Stijn':1,'Dirk':1,'Steven':1 } } },
    SUI: { drop: { first: ['Carlos','Ali'], last: ['Bajrami','Ramadani','Fernandez','Schmidt'] },
           move: { first: { 'Antonio':2,'Philippe':1,'Alain':1,'Olivier':1,'Laurent':1,'Nicolas':1,'Cédric':1,'Cedric':1,'Didier':1,'Romain':1,'Hugo':1,'Nathan':1,'Gabriel':1,'Bruno':3,'Tiago':3,'Ricardo':3,'Nuno':3,'Diogo':3 } } },
    SWE: { drop: { first: ['Ali'] } },
    DEN: { drop: { first: ['Ali'] } },
    NOR: { drop: { first: ['Thomas Andre'] } },
    CAN: { move: { last: { 'Lau':2,'Cheng':2,'Chung':2,'Saini':2,'Randhawa':2,'Mann':2 },
                   first: { 'Jean':1,'Claude':1,'Jacques':1,'Gilles':1,'Marcel':1,'Alexandre':1,'Mathieu':1,'Sylvain':1,'Xavier':1,'Olivier':1,'Samuel':1,'Guillaume':1,'Francois':1,'Frédéric':1,'Frederic':1,'Pascal':1,'Rejean':1,'Réjean':1,'Yves':1,'Andre':1,'Luc':1,'Pierre':1,'Michel':1,'Denis':1,'Martin':1,'Stephane':1,'Stéphane':1,'Éric':1 } } },
    RSA: { drop: { last: ['Precious'] },
           move: { first: { 'Thabiso':2,'Lucky':2,'Mandla':2,'Thapelo':2,'Vusi':2,'Sbusiso':2,'Sanele':2,'Thabo':2,'Sipho':2,'Bongani':2,'Tshepo':2,'Themba':2,'Sibusiso':2,'Xolani':2,'Andile':2,'Thulani':2,'Kagiso':2,'Lebogang':2,'Katlego':2,'Tumelo':2,'Karabo':2,'Lesego':2,'Neo':2,'Kabelo':2,'Oupa':2,'Solomon':2,'Moses':2,'Enoch':2,'Piet':1,'Johan':1,'Willem':1,'Jan':1,'Hennie':1,'Koos':1,'Danie':1,'Gert':1,'Pieter':1,'Jaco':1,'Riaan':1,'Christo':1,'Deon':1,'Ruan':1,'Heinrich':1,'Charl':1,'Divan':1,'Janco':1,'Wikus':1,'Hendrik':1,'Francois':1,'Wian':1,'Tiaan':1,'Johannes':1,'Stephanus':1,'Cornelius':1 },
                   last: { 'Moyo':2,'Baloyi':2,'Sibiya':2,'Chauke':2,'Mazibuko':2,'Cele':2,'Mathebula':2,'Molefe':2,'Sibanda':2,'Maluleke':2,'Motaung':2,'Moloi':2,'Zungu':2,'Zondi':2,'Hadebe':2,'Vilakazi':2,'Xaba':2,'Van Wyk':1 } } },
    IRL: { drop: { last: ['Obrien','Oconnor','Osullivan','O Connor','O Brien','O Sullivan','Oneill'] } },
    RUS: { drop: { last: ['Magomedov','Aliev','Ibragimov','Akhmedov','Mamedov','Karimov','Gadzhiev','Yusupov','Abdullaev','Kurbanov','Shevchenko','Bondarenko','Kovalenko','Kravchenko','Tkachenko','Kim','Elena','Natalya','Tatyana','Sergeevich','Sergeevna','Aleksandrovich','Aleksandrovna','Vladimirovich','Aleksandr','Sergei','Vasilev'] } },
    POL: { drop: { first: ['Tomek','Bartek','Kuba','Wojtek'] } },
    CZE: { drop: { first: ['Honza','Jirka','Ondra','Vojta','Kuba','Jarda'], last: ['Petr','Pavel','Jan','Novakova','Novotna'] } },
    HUN: { drop: { first: ['Nagy'], last: ['László','Tamás','Gábor','Péter','Zoltán','Balázs','Attila','Sándor','István','Zsolt','János','Dávid','József','Csaba','Ferenc','András','Ádám','Máté','Tibor','Bálint','György','Gergely','Imre','Pál','Dániel','Andrea','Katalin','Éva','Judit'] } },
    GRE: { drop: { first: ['Kostas Alt'], last: ['Ali Khan'] } },
    ISR: { drop: { first: ['Mohammad','Mohamad'], last: ['Mohammad','Awad','Abed','Amer','Saleh','Nassar','Salah','Hamdan','Khateeb','Israel','Moshe'] } },
    IND: { drop: { first: ['Mohd'], last: ['Kumari'] } },
    MAS: { drop: { first: ['Mohd','Muhd','Mohamad','Muhamad','Abdul','Mohammad','Wan','Tan','Lee'], last: ['Mohd','Raj'] },
           move: { last: { 'Yee':1 } } },
    INA: { drop: { first: ['Mas','Abdul'], last: ['Sari','Dewi','Putri','Wati','Lestari'] } },
    EST: { drop: { first: ['Alex'], last: ['Ivanova','Smirnova','Petrova','Kuznetsova','Vassiljeva','Pavlova','Olen','Kadri','Kristi'] },
           move: { first: { 'Denis':1,'Viktor':1 }, last: { 'Hein':0 } } },
    MAR: { drop: { last: ['Med','Raja','Malak','Fleur','Khadija','Fatima','Mks','Agadir','Widadi','Nour','Rajawi'] } }
};

// ── Neue Pool-Skelette (Bonus-Nationen mit Datenbasis) ──────────────────────
// Vornamen-Fenster kuratiert (Ära-Wissen), Nachnamen kommen komplett aus den Daten.
const NEW_POOLS = {
    // Norwegen (bisher Fallback DEN — eigene Namenswelt, Daten sauber: Hansen/Olsen-Kopf)
    NOR: { regions: [ { w: 1,
        first: {
            early:  [['Ole',4],['Per',4],['Kjell',4],['Odd',3],['Arne',3],['Knut',3],['Gunnar',3],['Leif',3],['Rolf',2],['Einar',2],['Ivar',2],['Reidar',1]],
            mid:    [['Lars',4],['Morten',4],['Espen',4],['Geir',4],['Terje',4],['Rune',4],['Bjørn',4],['Erik',4],['Thomas',4],['Tor',3],['Frode',3],['Kjetil',3],['Trond',3],['Stig',3],['Roger',3],['Petter',3],['Henrik',3],['Marius',3],['Kristian',3],['Anders',3]],
            modern: [['Emil',4],['Sander',4],['Markus',4],['Jonas',4],['Mathias',4],['Magnus',4],['Oskar',3],['Sebastian',3],['Oliver',3],['Filip',3],['Noah',3],['Dennis',2],['Sondre',2],['Aksel',2],['Eirik',2],['Theodor',2]]
        },
        last: [] } ] },
    // Griechenland (bisher INT — Daten nach Expat-/Frauenform-Filter brauchbar)
    GRE: { regions: [ { w: 1,
        first: [['Giorgos',5],['Dimitris',5],['Nikos',5],['Kostas',4],['Giannis',4],['Panagiotis',4],['Vassilis',3],['Christos',3],['Alexandros',3],['Stavros',2],['Michalis',3],['Thanasis',2],['Spyros',2],['Antonis',3]],
        last:  [['Papadopoulos',4],['Papadakis',3],['Oikonomou',3],['Georgiou',3],['Dimitriou',3],['Nikolaou',3],['Vlachos',2],['Makris',2],['Alexiou',2]] } ] },
    // Türkei (bisher INT — Nachnamen-Daten korrekt akzentuiert; Vornamen kuratiert, fore_agg leer)
    TUR: { regions: [ { w: 1,
        first: {
            early:  [['Mehmet',4],['Ahmet',4],['Mustafa',4],['Ali',3],['Hasan',3],['Hüseyin',3],['İbrahim',3],['Osman',2],['Süleyman',2],['Kemal',2],['Orhan',2],['Erol',2]],
            mid:    [['Murat',4],['Emre',4],['Hakan',4],['Gökhan',3],['Serkan',3],['Volkan',3],['Tolga',3],['Burak',3],['Onur',3],['Özgür',3],['Cem',3],['Barış',3],['Serdar',3],['Selçuk',2],['Erhan',2],['Tayfun',2],['Kenan',2],['Levent',2]],
            modern: [['Arda',4],['Mert',4],['Can',4],['Kerem',4],['Ege',3],['Deniz',3],['Efe',3],['Emir',3],['Yiğit',3],['Alp',2],['Berkay',2],['Kuzey',1],['Çınar',1],['Ayaz',1]]
        },
        last: [] } ] },
    // Südkorea (bisher INT — Nachnamen-Daten latein (Kim/Lee/Park), Vornamen romanisiert kuratiert)
    KOR: { regions: [ { w: 1,
        first: [['Min-jun',3],['Seo-jun',3],['Do-yun',3],['Ji-ho',3],['Ha-jun',3],['Ji-hoon',3],['Min-seok',3],['Hyun-woo',3],['Dong-hyun',3],['Sung-min',3],['Jun-seo',2],['Jae-hyun',2],['Woo-jin',2],['Joon-ho',2],['Young-ho',2],['Sang-hoon',2],['Seung-hyun',2],['Jin-woo',2],['Tae-yang',1],['Kyung-min',1]],
        last:  [] } ] }
};

// ── Wissensbasierte Erweiterungen (Nationen OHNE Datenbasis; kuratierte Skala 1–3) ──
// Werden an die bestehenden kuratierten Arrays angehängt (Dedup per key).
const KNOWLEDGE = {
    THA: { r: 0,
        first: [['Somsak',2],['Sompong',2],['Prasert',2],['Suchart',2],['Wichai',2],['Narong',2],['Manop',2],['Anucha',2],['Chaiwat',2],['Sakda',2],['Sombat',2],['Thawatchai',2],['Wirot',1],['Kriangkrai',1],['Suthep',1],['Boonmee',1],['Kamon',1],['Teerapat',1],['Thanawat',1],['Sarawut',1]],
        last:  [['Yoovidhya',1],['Srivaddhanaprabha',1],['Kittikachorn',1],['Sathienthirakul',1],['Suksawat',1],['Jaroensuk',1],['Boonsong',1],['Thongsuk',1],['Chaiprasit',1],['Ruangroj',1],['Saengchan',1],['Prasertsri',1],['Wattanakul',1],['Siriwan',1],['Klomchit',1]] },
    MON: [
        { r: 0,
          first: [['Raphaël',2],['Mathis',2],['Baptiste',2],['Romain',2],['Alexandre',2],['Nicolas',2],['Julien',2],['Sacha',1],['Côme',1],['Aurélien',1]],
          last:  [['Médecin',2],['Crovetto',2],['Gastaud',2],['Boisson',2],['Palmaro',1],['Notari',2],['Marsan',1],['Vatrican',1],['Bellando',1],['Marquet',1],['Gamba',1],['Solamito',1]] },
        { r: 1,
          first: [['Alessandro',2],['Lorenzo',2],['Giulio',1],['Edoardo',1]],
          last:  [['Ricci',2],['Conti',1],['Romano',1],['Vitale',1],['Massa',1]] }
    ],
    CHN: { r: 0,
        first: [['Haoran',2],['Zihao',2],['Jiahao',2],['Zeyu',2],['Yichen',2],['Boyuan',1],['Zhihao',2],['Junhao',1],['Yuxuan',2],['Zhenyu',2],['Sicheng',1],['Weijie',1],['Zhiqiang',1],['Xiaolong',1],['Wenbo',1],['Peng',2],['Lei',2],['Tao',2],['Chao',2],['Jun',2],['Qiang',1],['Bin',1],['Feng',1],['Gang',1],['Guanyu',1]],
        last:  [['He',3],['Gao',3],['Luo',3],['Zheng',3],['Liang',3],['Xie',2],['Tang',2],['Deng',2],['Han',2],['Feng',2],['Cao',2],['Peng',2],['Zeng',2],['Xiao',2],['Tian',2],['Dong',2],['Pan',2],['Yuan',2],['Cai',2],['Jiang',2],['Yu',2],['Du',2],['Ye',2],['Cheng',2],['Wei',2],['Su',2],['Lu',2],['Ding',1],['Ren',1],['Fang',1],['Shen',1],['Qin',1],['Kong',1],['Xue',1],['Hou',1],['Shao',1]] },
    MAR: { r: 0,
        first: [['Amine',2],['Hamza',2],['Anas',2],['Zakaria',2],['Ayoub',2],['Bilal',2],['Ilyas',2],['Reda',2],['Othmane',2],['Soufiane',2],['Nabil',1],['Tarik',1],['Hicham',1],['Abdellah',1],['Yassine',2],['Walid',1],['Khalid',1],['Adil',1],['Mounir',1],['Fouad',1]],
        last:  [] },
    ZIM: { r: 0,
        first: [['Colin',1],['Trevor',1],['Neil',1],['Rod',1],['Bruce',1],['Keith',1],['Des',1],['Basil',1]],
        last:  [] }
};

// ── Daten-Leihe für Nationen ohne eigenen Datensatz (→ Gewicht-1-Tails) ─────
// Kulturell begründet: AUS/NZL/ZIM-Namensstock ist anglo-keltisch (GB+IE),
// VEN-Namensstock ist der gleiche spanische wie CO (minus Antioquia-Marker).
const BORROW = [
    { nat:'AUS', iso:'GB', r:0, sur:120, fore:40, bans:[SOUTH_ASIAN,EAST_ASIAN,ARABIC_MAGHREB,TURKISH,BALKAN,SLAVIC_EAST,IBERIAN_PT,HISPANIC] },
    { nat:'AUS', iso:'IE', r:0, sur:30,  fore:0,  bans:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST] },
    { nat:'NZL', iso:'GB', r:0, sur:80,  fore:30, bans:[SOUTH_ASIAN,EAST_ASIAN,ARABIC_MAGHREB,TURKISH,BALKAN,SLAVIC_EAST,IBERIAN_PT,HISPANIC] },
    { nat:'NZL', iso:'IE', r:0, sur:20,  fore:0,  bans:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST] },
    { nat:'ZIM', iso:'GB', r:0, sur:60,  fore:0,  bans:[SOUTH_ASIAN,EAST_ASIAN,ARABIC_MAGHREB,TURKISH,BALKAN,SLAVIC_EAST,IBERIAN_PT,HISPANIC] },
    { nat:'VEN', iso:'CO', r:0, sur:100, fore:40, bans:[NORDIC_FOREIGN,/^(Restrepo|Ospina|Zuluaga|Bedoya|Agudelo|Henao|Arango|Betancur|Giraldo|Cardona|Montoya|Echeverri|Mejia|Mejía)$/] }
];

// ============================================================================
// Pipeline
// ============================================================================
const readAgg = (file) => {
    const by = new Map();
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/^([A-Z]{2}),"(.*)",(\d+)$/);
        if (!m) continue;
        if (!by.has(m[1])) by.set(m[1], []);
        by.get(m[1]).push([m[2], parseInt(m[3], 10)]);
    }
    return by;
};
const foreBy = readAgg('fore_agg.csv');
const surBy = readAgg('sur_agg.csv');

const deepCopy = o => JSON.parse(JSON.stringify(o));
const POOLS = deepCopy(BASE.NAME_POOLS_BY_NATION);
const FALLBACK = deepCopy(BASE.NATION_NAME_FALLBACK);
const TAILS = {}; // wird komplett neu erzeugt

// Neue Pools einhängen, Fallback-Einträge der neuen Nationen entfernen
for (const [nat, pool] of Object.entries(NEW_POOLS)) POOLS[nat] = deepCopy(pool);
for (const nat of Object.keys(NEW_POOLS)) delete FALLBACK[nat];

// Wissens-Erweiterungen anhängen (Dedup gegen Bestand)
function appendKnowledge(nat, spec) {
    const region = POOLS[nat].regions[spec.r];
    const haveL = new Set(region.last.map(e => key(e[0])));
    for (const [n, w] of (spec.last || [])) if (!haveL.has(key(n))) { region.last.push([n, w]); haveL.add(key(n)); }
    const firstArrs = Array.isArray(region.first) ? [region.first] : [region.first.mid, region.first.modern];
    // flach: direkt; Fenster: mid+modern (Erweiterungen sind gegenwartsnah kuratiert)
    for (const arr of firstArrs) {
        const have = new Set(arr.map(e => key(e[0])));
        for (const [n, w] of (spec.first || [])) if (!have.has(key(n))) { arr.push([n, w]); have.add(key(n)); }
    }
}
for (const [nat, spec] of Object.entries(KNOWLEDGE)) {
    for (const s of Array.isArray(spec) ? spec : [spec]) appendKnowledge(nat, s);
}

// Kern: eine Nation+Art (first/last) aus den Daten mergen
const report = [];
function processNation(nat, cfg) {
    const cls = CLASSES[cfg.cls];
    const ops = OPS[nat] || {};
    const pool = POOLS[nat];
    const natReport = { nat, sur: 0, fore: 0, tailsSur: 0, tailsFore: 0, notes: [] };
    // Kuratierte Nachnamen-Keys: schützen legitime Nachnamen (FRA Martin/Bernard/
    // Thomas…) vor dem GIVEN_AS_SURNAME-Filter, damit sie ihr Datengewicht bekommen.
    const curatedLastKeys = new Set();
    for (const r of pool.regions) for (const [n] of r.last) curatedLastKeys.add(key(n));

    for (const kind of ['last', 'first']) {
        const raw = kind === 'last' ? surBy.get(cfg.iso) : foreBy.get(cfg.iso);
        if (!raw || (kind === 'first' && cfg.foreCap0)) continue;
        const bans = (kind === 'first' ? cfg.banFirst : cfg.banLast) || [];
        const damps = (kind === 'first' ? cfg.dampFirst : cfg.dampLast) || [];
        const drops = new Set((ops.drop && ops.drop[kind]) || []);
        const moves = (ops.move && ops.move[kind]) || {};

        // 1) Normalisieren (translit → rename → Akzent), Counts auf Key mergen
        const merged = new Map(); // key → {name, count}
        for (let [name, count] of raw) {
            name = name.trim();
            if (cfg.translit && hasCyrillic(name)) name = translit(name);
            if (hasCyrillic(name) || !isLatinName(name) || name.length < 3) continue;
            // Junk-Filter (v4): kein Vokal → Daten-Artefakt/Abkürzung (z.B. "Dbs", "Xzy")
            if (!/[aeiouyàâäáéèêëíïîóôöúùûüøåÿ]/i.test(name)) continue;
            if (cfg.rename && cfg.rename[name]) name = cfg.rename[name];
            name = fixName(nat, name);
            if (name !== name.charAt(0).toUpperCase() + name.slice(1) && !/^(De |Da |Van |Von |El |Le |La |Du |O'|Mc|Mac|St-)/.test(name)) continue;
            if (drops.has(name)) continue;
            // Kuratierte Nachnamen sind gegen Filter/Bans immun (sie sollen ihr
            // echtes Datengewicht bekommen — z.B. FRA Martin trotz -in-Endung)
            const curatedProtected = kind === 'last' && curatedLastKeys.has(key(name));
            if (kind === 'last' && GIVEN_AS_SURNAME.test(name) && !curatedProtected) continue;
            if (!curatedProtected && bans.some(b => b.test(name))) continue;
            for (const [re, f] of damps) if (re.test(name)) { count = Math.round(count * f); break; }
            const k = key(name);
            if (merged.has(k)) merged.get(k).count += count;
            else merged.set(k, { name, count });
        }
        const list = [...merged.values()].sort((a, b) => b.count - a.count);
        if (!list.length) { natReport.notes.push(`KEINE Daten für ${kind}!`); continue; }

        // 2) Gewichte
        const maxC = list[0].count;
        for (const e of list) e.w = Math.max(1, Math.round(SCALE * Math.pow(e.count / maxC, ALPHA)));

        // 3) Routing in Regionen
        for (const e of list) {
            e.r = 0;
            if (cfg.route) for (const [re, ri] of cfg.route) { if (re.test(e.name)) { e.r = ri; break; } }
            if (moves[e.name] !== undefined) e.r = moves[e.name];
            if (!pool.regions[e.r]) e.r = 0;
        }

        // 4) Kuratierte Treffer: echtes Datengewicht setzen (Anzeigeform kuratiert),
        //    Nicht-Treffer im kuratierten Pool: BUCKET-Mapping.
        //    early-Fenster bleibt UNANGETASTET.
        const dataByKey = new Map(list.map(e => [key(e.name), e]));
        const usedKeys = new Set();
        for (const region of pool.regions) {
            const targets = kind === 'last' ? [{ arr: region.last, mode: 'full' }]
                : Array.isArray(region.first) ? [{ arr: region.first, mode: 'full' }]
                : [{ arr: region.first.mid, mode: 'full' }, { arr: region.first.modern, mode: 'bucket-only' }];
            for (const t of targets) {
                if (!t.arr) continue;
                for (const entry of t.arr) {
                    const d = dataByKey.get(key(entry[0]));
                    if (d && t.mode === 'full') { entry[1] = d.w; usedKeys.add(key(entry[0])); }
                    else entry[1] = BUCKET[entry[1]] || entry[1]; // 1–5 → neue Skala
                }
            }
            // early: Original-Gewichte zurück? Nein — early ist eigenständiges Array,
            // Skala dort egal. Aber Konsistenz: early bleibt 1–5 (unangetastet, s.u.)
        }
        // modern-kuratierte Namen zählen als "verbraucht", wenn sie AUCH in mid stehen —
        // sonst dürfen sie unten als Masse (gedeckelt) ins modern-Fenster zurückkehren.

        // 5) Masse in Pools + Tails verteilen
        const totalCap = kind === 'last' ? cls.sur : cls.fore;
        const torsoCap = kind === 'last' ? cls.surT : cls.foreT;
        let placed = 0, torso = 0;
        const tailsByR = new Map();
        for (const e of list) {
            if (placed >= totalCap) break;
            if (usedKeys.has(key(e.name))) continue; // schon als kuratierter Treffer drin
            const region = pool.regions[e.r];
            if (kind === 'last') {
                const have = new Set(region.last.map(x => key(x[0])));
                if (have.has(key(e.name))) continue;
                if (torso < torsoCap) { region.last.push([e.name, e.w]); torso++; }
                else { if (!tailsByR.has(e.r)) tailsByR.set(e.r, { first: [], last: [] }); tailsByR.get(e.r).last.push(e.name); natReport.tailsSur++; }
            } else {
                if (Array.isArray(region.first)) {
                    const have = new Set(region.first.map(x => key(x[0])));
                    if (have.has(key(e.name))) continue;
                    if (torso < torsoCap) { region.first.push([e.name, e.w]); torso++; }
                    else { if (!tailsByR.has(e.r)) tailsByR.set(e.r, { first: [], last: [] }); tailsByR.get(e.r).first.push(e.name); natReport.tailsFore++; }
                } else {
                    const haveMid = new Set(region.first.mid.map(x => key(x[0])));
                    if (haveMid.has(key(e.name))) continue;
                    if (torso < torsoCap) {
                        region.first.mid.push([e.name, e.w]);
                        // Top-Masse zusätzlich (gedeckelt) ins modern-Fenster – Vielfalt ohne Ära-Bruch
                        if (torso < cls.modDup) {
                            const haveMod = new Set(region.first.modern.map(x => key(x[0])));
                            if (!haveMod.has(key(e.name))) region.first.modern.push([e.name, Math.min(e.w, MODERN_CAP)]);
                        }
                        torso++;
                    } else { if (!tailsByR.has(e.r)) tailsByR.set(e.r, { first: [], last: [] }); tailsByR.get(e.r).first.push(e.name); natReport.tailsFore++; }
                }
            }
            placed++;
            if (kind === 'last') natReport.sur++; else natReport.fore++;
        }
        if (tailsByR.size) {
            if (!TAILS[nat]) TAILS[nat] = [];
            for (const [r, d] of [...tailsByR.entries()].sort((a, b) => a[0] - b[0])) {
                let slot = TAILS[nat].find(t => t.r === r);
                if (!slot) { slot = { r, first: [], last: [] }; TAILS[nat].push(slot); }
                slot.first.push(...d.first); slot.last.push(...d.last);
            }
        }
    }
    report.push(natReport);
}

for (const [nat, cfg] of Object.entries(CFG)) processNation(nat, cfg);

// ── Daten-Leihe → Gewicht-1-Tails ───────────────────────────────────────────
for (const b of BORROW) {
    const pool = POOLS[b.nat];
    const existing = { first: new Set(), last: new Set() };
    for (const r of pool.regions) {
        for (const [n] of r.last) existing.last.add(key(n));
        const fa = Array.isArray(r.first) ? r.first : [...r.first.early, ...r.first.mid, ...r.first.modern];
        for (const [n] of fa) existing.first.add(key(n));
    }
    for (const t of (TAILS[b.nat] || [])) {
        for (const n of t.first) existing.first.add(key(n));
        for (const n of t.last) existing.last.add(key(n));
    }
    if (!TAILS[b.nat]) TAILS[b.nat] = [];
    let slot = TAILS[b.nat].find(t => t.r === b.r);
    if (!slot) { slot = { r: b.r, first: [], last: [] }; TAILS[b.nat].push(slot); }
    for (const [kind, cap, src] of [['last', b.sur, surBy.get(b.iso)], ['first', b.fore, foreBy.get(b.iso)]]) {
        if (!cap || !src) continue;
        let placed = 0;
        for (const [rawName] of src) {
            if (placed >= cap) break;
            const name = fixName(b.nat, rawName.trim()); // Akzent-Reparatur (VEN: López statt Lopez)
            if (hasCyrillic(name) || !isLatinName(name) || name.length < 3) continue;
            if (kind === 'last' && GIVEN_AS_SURNAME.test(name)) continue;
            if (b.bans.some(re => re.test(name))) continue;
            const k = key(name);
            if (existing[kind].has(k)) continue;
            existing[kind].add(k);
            slot[kind].push(name);
            placed++;
        }
    }
}

// ============================================================================
// Validierung (Schema-Asserts) + Serialisierung
// ============================================================================
let warnings = [];
for (const [nat, pool] of Object.entries(POOLS)) {
    if (!pool.regions || !pool.regions.length) { warnings.push(`${nat}: keine Regionen!`); continue; }
    for (let i = 0; i < pool.regions.length; i++) {
        const r = pool.regions[i];
        if (typeof r.w !== 'number') warnings.push(`${nat} r${i}: w fehlt`);
        if (!r.last || !r.last.length) warnings.push(`${nat} r${i}: last leer`);
        const firstArrs = Array.isArray(r.first) ? { flat: r.first } : r.first;
        for (const [win, arr] of Object.entries(firstArrs)) {
            if (!arr || !arr.length) { warnings.push(`${nat} r${i} first.${win} leer`); continue; }
            const seen = new Set();
            for (const e of arr) {
                if (!Array.isArray(e) || typeof e[0] !== 'string' || typeof e[1] !== 'number' || e[1] < 1) warnings.push(`${nat} r${i} first.${win}: kaputter Eintrag ${JSON.stringify(e)}`);
                if (seen.has(e[0])) warnings.push(`${nat} r${i} first.${win}: Duplikat ${e[0]}`);
                seen.add(e[0]);
            }
        }
        const seenL = new Set();
        for (const e of (r.last || [])) {
            if (!Array.isArray(e) || typeof e[0] !== 'string' || typeof e[1] !== 'number' || e[1] < 1) warnings.push(`${nat} r${i} last: kaputter Eintrag ${JSON.stringify(e)}`);
            if (seenL.has(e[0])) warnings.push(`${nat} r${i} last: Duplikat ${e[0]}`);
            seenL.add(e[0]);
        }
    }
}
for (const [nat, tails] of Object.entries(TAILS)) {
    for (const t of tails) if (!POOLS[nat].regions[t.r]) warnings.push(`${nat} Tail r${t.r}: Region existiert nicht`);
}

// Serialisierung: kompakt, Zeilen ~150 Zeichen
const q = s => JSON.stringify(s).replace(/"/g, "'").includes("\\'") ? JSON.stringify(s) : `'${s.replace(/'/g, "\\'")}'`;
function serPairs(arr, indent) {
    const parts = arr.map(([n, w]) => `[${q(n)},${w}]`);
    const lines = [];
    let cur = '';
    for (const p of parts) {
        if (cur && (cur.length + p.length) > 150) { lines.push(cur + ','); cur = ''; }
        cur += (cur ? ',' : '') + p;
    }
    if (cur) lines.push(cur);
    return lines.map(l => indent + l).join('\n');
}
function serNames(arr, indent) {
    const parts = arr.map(n => q(n));
    const lines = [];
    let cur = '';
    for (const p of parts) {
        if (cur && (cur.length + p.length) > 150) { lines.push(cur + ','); cur = ''; }
        cur += (cur ? ',' : '') + p;
    }
    if (cur) lines.push(cur);
    return lines.map(l => indent + l).join('\n');
}

let out = `// ============================================================================
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
`;

for (const [nat, pool] of Object.entries(POOLS)) {
    out += `\n    // ── ${nat} ──\n    ${nat}: { regions: [\n`;
    const regionStrs = pool.regions.map(r => {
        let s = `        { w: ${r.w}`;
        if (r.minYear) s += `, minYear: ${r.minYear}`;
        s += ',\n';
        if (Array.isArray(r.first)) {
            s += `          first: [\n${serPairs(r.first, '            ')}\n          ],\n`;
        } else {
            s += '          first: {\n';
            for (const win of ['early', 'mid', 'modern']) {
                if (!r.first[win]) continue;
                s += `            ${win}: [\n${serPairs(r.first[win], '              ')}\n            ],\n`;
            }
            s = s.replace(/,\n$/, '\n');
            s += '          },\n';
        }
        s += `          last: [\n${serPairs(r.last, '            ')}\n          ] }`;
        return s;
    });
    out += regionStrs.join(',\n') + '\n    ] },\n';
}
out += `};

// ── Fallback-Map: pool-lose Nation → kulturell nächstverwandter Pool ──
// (v3: NOR/GRE/TUR/KOR haben jetzt eigene Pools und sind hier raus)
const NATION_NAME_FALLBACK = {
${(() => { const es = Object.entries(FALLBACK).map(([k, v]) => `'${k}':'${v}'`); const lines = []; for (let i = 0; i < es.length; i += 10) lines.push('    ' + es.slice(i, i + 10).join(',')); return lines.join(',\n'); })()}
};

// ── Raritäten-Schwänze (implizit Gewicht 1) ─────────────────────────────
// v3: tiefe Daten-Raritäten jenseits der Pool-Torsi + Daten-Leihe für
// AUS/NZL/ZIM (GB/IE-Namensstock) und VEN (CO-Namensstock).
// r = Region-Index in NAME_POOLS_BY_NATION[nat].regions.
// Merge-Regel (Integration): last → an regions[r].last anhängen (Gewicht 1);
// first → NUR an mid+modern-Fenster anhängen (Datensatz ist gegenwartslastig,
// sonst hieße ein 1955er-Deutscher "Kevin"). Bei ära-flachem first-Array: direkt anhängen.
const NAME_TAILS_BY_NATION = {
`;
for (const [nat, tails] of Object.entries(TAILS)) {
    out += `    ${nat}: [\n`;
    for (const t of tails) {
        if (!t.first.length && !t.last.length) continue;
        out += `        { r: ${t.r},\n`;
        out += `          first: [\n${t.first.length ? serNames(t.first, '            ') : '            '}\n          ],\n`;
        out += `          last: [\n${t.last.length ? serNames(t.last, '            ') : '            '}\n          ] },\n`;
    }
    out += '    ],\n';
}
out += `};

// Node/Build-Kontext optional exportierbar (im Browser-Monolith ohne Wirkung):
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NAME_POOLS_BY_NATION, NATION_NAME_FALLBACK, NAME_TAILS_BY_NATION };
}
`;

fs.writeFileSync('../../data/names.js', out);

// Review-Datei
let rev = `Paket A v3 — Build-Review (${new Date().toISOString().slice(0, 10)})\nALPHA=${ALPHA} SCALE=${SCALE} MODERN_CAP=${MODERN_CAP} US_HISP_DAMP=${US_HISP_DAMP.toFixed(3)}\n\n`;
for (const r of report) {
    rev += `${r.nat}: +${r.sur} last / +${r.fore} first in Pools; Tails: ${r.tailsSur} last / ${r.tailsFore} first ${r.notes.length ? '⚠ ' + r.notes.join('; ') : ''}\n`;
}
rev += '\n— Köpfe (Top-8 last je Nation nach Merge) —\n';
for (const [nat, pool] of Object.entries(POOLS)) {
    const all = [];
    for (const r of pool.regions) for (const [n, w] of r.last) all.push([n, w, r.w]);
    all.sort((a, b) => b[1] - a[1]);
    rev += `${nat}: ${all.slice(0, 8).map(e => `${e[0]}:${e[1]}`).join(', ')}\n`;
}
rev += `\nWarnungen (${warnings.length}):\n${warnings.join('\n') || '(keine)'}\n`;
fs.writeFileSync('names-v3-review.txt', rev);

const kb = (fs.statSync('../../data/names.js').size / 1024).toFixed(0);
let totalEntries = 0;
for (const pool of Object.values(POOLS)) for (const r of pool.regions) {
    totalEntries += r.last.length;
    totalEntries += Array.isArray(r.first) ? r.first.length : r.first.early.length + r.first.mid.length + r.first.modern.length;
}
let tailEntries = 0;
for (const tails of Object.values(TAILS)) for (const t of tails) tailEntries += t.first.length + t.last.length;
console.log(`OK — data/names.js: ${kb} KB | Pool-Einträge: ${totalEntries} | Tail-Namen: ${tailEntries} | Warnungen: ${warnings.length}`);
if (warnings.length) console.log(warnings.slice(0, 20).join('\n'));
