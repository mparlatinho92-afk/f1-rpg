// Extrahiert Raritäten-Schwänze (Gewicht-1-Namen) aus den Aggregaten,
// regionstreu und gefiltert. Erzeugt:
//   name-tails-review.txt  – Kurations-Ansicht pro Nation/Region
//   name-tails.out.js      – fertiger NAME_TAILS_BY_NATION-Block
// Aufruf (aus fable-deliverables/name-data/): node extract-tails.js
const fs = require('fs');
const { NAME_POOLS_BY_NATION } = require('../paketA-name-pools.js');

// ── RU-Transliteration (vereinfachtes BGN/PCGN) ──
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
const isLatinName = s => /^[A-Za-zÀ-ÖØ-öø-ÿĀ-žŁłŚśŹźŻżĆćŃńĄąĘę][A-Za-zÀ-ÖØ-öø-ÿĀ-žŁłŚśŹźŻżĆćŃńĄąĘę' -]+$/.test(s);
const key = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Kulturfremde Namen (Expat-/Migrations-Rauschen) – global gebannt außer wo geroutet
const SOUTH_ASIAN = /^(Khan|Patel|Singh|Kaur|Ali|Ahmed|Ahmad|Hussain|Hussein|Shah|Sharma|Kumar|Begum|Bibi|Akhtar|Iqbal|Mahmood|Aslam|Raja|Mistry|Chowdhury|Choudhury|Miah|Uddin|Rahman|Rehman|Islam|Mohammed|Mohamed|Mohammad|Muhammad|Mahmoud|Syed|Sheikh|Malik|Javed|Anwar|Bashir|Yousaf|Gill|Sandhu|Sidhu|Dhaliwal|Brar|Grewal|Dhillon|Bhatti|Chaudhry|Mirza|Abbas|Raza|Riaz|Ashraf|Akram|Saleem|Nazir|Ramzan|Younis|Aziz|Karim|Rashid|Hamid|Amin|Haq|Sultan|Tariq|Zaman|Qureshi|Ansari|Siddiqui|Kapoor|Mehta|Gupta|Verma|Reddy|Nair|Rao|Das|Devi|Yadav|Kumari)$/i;
const EAST_ASIAN = /^(Nguyen|Tran|Le|Pham|Hoang|Vu|Dang|Bui|Do|Ho|Ngo|Duong|Kim|Park|Choi|Jung|Kang|Cho|Yoon|Jang|Lim|Han|Oh|Shin|Kwon|Wang|Li|Zhang|Liu|Chen|Yang|Zhao|Huang|Zhou|Wu|Xu|Sun|Ma|Zhu|Lin|Guo|Wong|Chan|Cheung|Lam|Leung|Tang|Yeung|Ng|Chow|Tan|Lee|Teo|Goh|Yap|Ong)$/i;
const ARABIC_MAGHREB = /^(Benali|Ben[ -]?[A-Z]?[a-z]+|El[ -][A-Z][a-z]+|Al[ -][A-Z][a-z]+|Haddad|Saidi|Cherif|Bouazza|Bouzid|Hamdi|Trabelsi|Gharbi|Mansouri|Amrani|Alaoui|Idrissi|Tazi|Fassi|Berrada|Diallo|Camara|Traore|Traoré|Keita|Cisse|Cissé|Sylla|Toure|Touré|Konate|Konaté|Coulibaly|Sow|Ba|Bah|Barry|Balde|Kone|Koné|Sissoko|Fofana|Doumbia|Sanogo|Ouattara|Drame|Dramé|Kaba|Sacko|Samake|Dembele|Dembélé)$/i;
const TURKISH = /^(Yilmaz|Yılmaz|Kaya|Demir|Sahin|Şahin|Celik|Çelik|Yildiz|Yıldız|Yildirim|Yıldırım|Ozturk|Öztürk|Aydin|Aydın|Ozdemir|Özdemir|Arslan|Dogan|Doğan|Kilic|Kılıç|Aslan|Cetin|Çetin|Kara|Koc|Koç|Kurt|Ozkan|Özkan|Simsek|Şimşek|Polat|Erdogan|Erdoğan|Yalcin|Yalçın|Gunes|Güneş|Bulut|Tas|Taş|Caliskan|Çalışkan|Turan|Tekin|Aktas|Aktaş|Unal|Ünal|Avci|Avcı|Sen|Şen|Acar|Guler|Güler|Erdem|Ates|Ateş)$/i;
const BALKAN = /(ić|ic|ovic|ović|evic|ević|inac|adzic|adžić|oski|evski|ovski|iu|escu|eanu|oglu|oğlu)$|^(Krasniqi|Gashi|Berisha|Shala|Hoxha|Kelmendi|Morina|Bytyqi|Zeka|Rama|Dervishi|Marku|Gjoka|Leka|Prela)$/i;
const SLAVIC_EAST = /(ov|ev|in|yn|enko|chuk|shvili|adze|yan|ian)$/;
const IBERIAN_PT = /^(Silva|Santos|Ferreira|Pereira|Oliveira|Costa|Rodrigues|Martins|Sousa|Souza|Fernandes|Gomes|Lopes|Ribeiro|Gonçalves|Goncalves|Marques|Carvalho|Almeida|Pinto|Alves|Dias|Teixeira|Correia|Mendes|Moreira|Soares|Da Silva|Dos Santos|De Sousa|Nunes|Freitas|Cardoso|Rocha|Barbosa|Cruz|Neves|Coelho|Cunha|Vieira|Monteiro|Batista|Fonseca|Machado|Da Costa|Reis|Antunes|Matos|Fereira|Miranda|Nogueira|Ramos|Tavares|Azevedo|Barros|Borges|Brito|Cavalcante|Castro|Duarte|Farias|Andrade|Araujo|Araújo|Assis|Aguiar|Abreu|Amorim|Anjos|Amaral)$/i;
const HISPANIC = /^(Garcia|García|Rodriguez|Rodríguez|Martinez|Martínez|Lopez|López|Gonzalez|González|Hernandez|Hernández|Perez|Pérez|Sanchez|Sánchez|Ramirez|Ramírez|Torres|Flores|Rivera|Gomez|Gómez|Diaz|Díaz|Reyes|Morales|Ortiz|Gutierrez|Gutiérrez|Chavez|Chávez|Ramos|Ruiz|Mendoza|Alvarez|Álvarez|Castillo|Jimenez|Jiménez|Vasquez|Vásquez|Vazquez|Vázquez|Moreno|Herrera|Medina|Aguilar|Vargas|Guzman|Guzmán|Mendez|Méndez|Munoz|Muñoz|Rojas|Salazar|Contreras|Suarez|Suárez|Delgado|Pena|Peña|Rios|Ríos|Cabrera|Campos|Vega|Fuentes|Carrillo|Leon|León|Santiago|Dominguez|Domínguez|Maldonado|Espinoza|Valdez|Juarez|Juárez|Molina|Acosta|Ayala|Zamora|Villarreal|Trevino|Treviño|Cortez|Cortés|Soto|Serrano|Solis|Solís|Rosales|Estrada|Zuniga|Zúñiga|Nunez|Núñez|Ochoa|Cardenas|Cárdenas|Navarro|Padilla|Barrera|Camacho|Cervantes|Marquez|Márquez|Escobar|Galvan|Galván|Velasquez|Velásquez|Velazquez|Velázquez|Ibarra|Cisneros|Bautista|Meza|Villanueva|Orozco|Avila|Ávila|Robles|Sandoval|Bravo|Lara|Cano|Quintero|Bermudez|Bermúdez|Osorio|Valencia|Franco|Guerrero|Paredes|Bustamante|Ponce|Salinas|Arroyo|Montoya|Palacios|Zapata|Miranda|Mora|Rincon|Rincón|Uribe|Restrepo|Ospina|Giraldo|Cardona|Correa|Betancur|Zuluaga|Arango|Bedoya|Agudelo|Henao|Sierra|Villa|Gallego|Montes)$/i;
const NORDIC_FOREIGN = new RegExp(SOUTH_ASIAN.source + '|' + EAST_ASIAN.source + '|' + ARABIC_MAGHREB.source + '|' + TURKISH.source + '|' + BALKAN.source, 'i');
const GIVEN_AS_SURNAME = /^(Maria|Jose|José|Juan|Ana|Luis|Luiz|Carlos|Jorge|Pedro|Paulo|Henrique|Antonio|António|Miguel|Manuel|Francisco|Fernando|Ricardo|Eduardo|Daniel|Rafael|Gabriel|Marcos|Mohamed|Ahmed|Ali|Hassan|Omar|Ibrahim|Said|Rachid|Karim|Amine|Youssef|Aziz|Kamal|Adam|Peter|Hans|Johan|Anna|Marie|Jean|Michel|Andre|André|Bernard|Claude|Laurent|Pascal|Christian|Martin|Thomas|Simon|David|Vincent|Robert|Richard|Denis|Georges|Antoine|Julien|Olivier|Rene|René|Roger|Alain|Marcel|Franck|Frank)$/i;

// pro Nation: iso, Tiers, Bans zusätzlich zu global, Routing [regex → regionIndex]
// route: erste passende Regel gewinnt; default r:0. banFirst/banLast: zusätzliche Filter.
const CFG = {
    GBR: { iso:'GB', last:80, first:25, route:[[SOUTH_ASIAN,1]], banLast:[EAST_ASIAN,ARABIC_MAGHREB,TURKISH,BALKAN,SLAVIC_EAST,IBERIAN_PT,HISPANIC,/^(Murphy|Kelly|Walsh|Byrne|Doyle|Ryan|O'|Mc|Mac)/] },
    GER: { iso:'DE', last:80, first:25, banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST,/ski$|cki$/] },
    ITA: { iso:'IT', last:80, first:25, banLast:[NORDIC_FOREIGN,HISPANIC,IBERIAN_PT] },
    FRA: { iso:'FR', last:80, first:25, route:[[ARABIC_MAGHREB,1]], banLast:[SOUTH_ASIAN,EAST_ASIAN,TURKISH,BALKAN,IBERIAN_PT,HISPANIC,SLAVIC_EAST] },
    USA: { iso:'US', last:90, first:25 }, // Schmelztiegel: alles plausibel
    BRA: { iso:'BR', last:80, first:25, banLast:[NORDIC_FOREIGN] },
    JPN: { iso:'JP', last:80, first:25, banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,/^[A-Z][a-z]+$/.source ? null : null].filter(Boolean), banFirst:[/^(Ricardo|Carlos|Jose|Juan|Luis|Marcos|Paulo|Pedro|Antonio|Daniel|David|Michael|John|Kevin|Alex|Eric|Jun Ho|Min)$/i] },
    ESP: { iso:'ES', last:80, first:25, route:[[/^(Puig|Vila|Serra|Ferrer|Roca|Soler|Font|Bosch|Mas|Casals|Pujol|Rovira|Sala|Torrent|Costa i|Riera|Padro|Padró|Estev|Catala|Català|Grau|Camps|Comas|Vives|Prat|Ripoll|Batlle|Segarra|Codina)$/,1],[/^(Etxeberria|Agirre|Aguirre|Ibarra|Zubizarreta|Urrutia|Garmendia|Mendizabal|Otegi|Goikoetxea|Zabala|Aranburu|Elorza|Iturbe|Arrieta|Lasa|Zubiri|Etxarri|Olaizola|Larranaga|Larrañaga)$/,2]], banLast:[NORDIC_FOREIGN] },
    NED: { iso:'NL', last:50, first:15, banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC] },
    BEL: { iso:'BE', last:50, first:15, route:[[/^(Van|Vande|Vander|De [A-Z]|D'|Ver[a-z]|Claes|Peeters|Janssens|Maes|Mertens|Willems|Wouters|Goossens|Pauwels|Aerts|Michiels|Smets|Martens|Segers|Hendrickx|Vervoort|Vandenberghe|Vanden|Bogaert|Bogaerts|Cools|Coppens|Daems|Dierckx|Geerts|Hermans|Jacobs|Lenaerts|Luyten|Moons|Naessens|Nys|Pittoors|Raes|Roggeman|Smolders|Stevens|Swinnen|Thys|Tielemans|Torfs|Truyens|Van [A-Z]|Verheyen|Verhoeven|Vermeiren|Verstraete|Vos|Wuyts)/,1]], banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC] },
    SUI: { iso:'CH', last:50, first:15, route:[[/^(Favre|Rochat|Bonvin|Chevalley|Duc|Rossier|Perret|Monnier|Grandjean|Berney|Pittet|Bovay|Cornuz|Curdy|Dubuis|Fardel|Gaillard|Genoud|Jaquier|Maillard|Mermoud|Nicollier|Pasche|Rappaz|Rochaix|Savary|Tissot|Vuille|Berthoud|Besson|Bovet|Chappuis|Cretton|Delaloye|Ducret|Dupertuis|Emery|Gross|Magnin|Marclay|Michellod|Morand|Pellaud|Praz|Quennoz|Rausis|Roduit|Terrettaz|Vouillamoz|Aubert|Badan|Blanc|Bourgeois|Braillard|Buffat|Chapuis|Cherpillod|Corboz|Cosandey|Delessert|Desmeules|Gilliéron|Gillieron|Jaccard|Jaccoud|Longchamp|Martin|Mercier|Meylan|Nicole|Paccaud|Panchaud|Pittet|Regamey|Rochat|Vallotton|Vulliamy)$/,1],[/^(Bernasconi|Rossi|Bianchi|Ferrari|Fontana|Galli|Crivelli|Pedrazzini|Albertini|Beretta|Bettosini|Bianda|Bomio|Cattaneo|Colombo|Delcò|Delco|Ferrari|Foletti|Genazzi|Gianinazzi|Guidotti|Lepori|Lucchini|Mazzoleni|Molteni|Mombelli|Pagani|Pedretti|Pellegrini|Piattini|Poretti|Quadri|Realini|Regazzoni|Rezzonico|Riva|Robbiani|Sala|Solari|Storni|Taddei|Vanoni|Vassalli|Zanetti|Zanini)$/,2]], banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC] },
    AUT: { iso:'AT', last:50, first:15, banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,/ski$|cki$|ic$|ić$/] },
    SWE: { iso:'SE', last:50, first:15, banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST] },
    FIN: { iso:'FI', last:50, first:15, route:[[/(berg|ström|strom|holm|qvist|kvist|lund|gren|blad|felt|man|sson|stedt|näs|vik|by|backa|fors)$/,1]], banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST] },
    DEN: { iso:'DK', last:50, first:15, banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST] },
    CAN: { iso:'CA', last:50, first:15, route:[[/^(Tremblay|Gagnon|Roy|Côté|Cote|Bouchard|Gauthier|Morin|Lavoie|Fortin|Bergeron|Pelletier|Villeneuve|Leblanc|Belanger|Bélanger|Levesque|Lévesque|Girard|Simard|Boucher|Caron|Beaulieu|Cloutier|Dubé|Dube|Poirier|Fournier|Lapointe|Leclerc|Lefebvre|Poulin|Thibault|Nadeau|Martel|Mercier|Bédard|Bedard|Grenier|Lessard|Bernier|Richard|Savard|Gagné|Gagne|Ouellet|Paquette|Desjardins|Demers|Perreault|Boudreau|Couture|Laflamme|Larouche|Lachance|Vachon|Dionne|Gosselin|Turcotte|Rioux|Bilodeau|Dufour|Tessier|Lemieux|Charbonneau|Brisson|Beaudoin|Deschamps|Dupuis|Fontaine|Gendron|Giroux|Houle|Labelle|Lacroix|Lambert|Langlois|Lapierre|Larose|Legault|Lemay|Marcoux|Ménard|Menard|Michaud|Moreau|Paradis|Parent|Plante|Proulx|Renaud|Robitaille|Séguin|Seguin|St-Pierre|Therrien|Trudeau|Vaillancourt)$/,1],[new RegExp(SOUTH_ASIAN.source+'|'+EAST_ASIAN.source,'i'),2]], banLast:[ARABIC_MAGHREB,TURKISH,BALKAN,SLAVIC_EAST,IBERIAN_PT,HISPANIC] },
    MEX: { iso:'MX', last:50, first:15 },
    RSA: { iso:'ZA', last:50, first:15, route:[[/^(Van |Van[dr]|Du |Le Roux|De [A-Z]|Botha|Pretorius|Venter|Fourie|Nel|Coetzee|Steyn|Kruger|Joubert|Marais|Swanepoel|Viljoen|Vorster|Erasmus|Bezuidenhout|Oosthuizen|Potgieter|Grobler|Meiring|Snyman|Strydom|Uys|Visagie|Wessels|Barnard|Bester|Boshoff|Bosman|Brits|Burger|Claassen|Conradie|Cronje|Engelbrecht|Ferreira|Havenga|Heyns|Jansen|Jordaan|Kotze|Lombard|Lotter|Louw|Malan|Marx|Meyer|Muller|Naude|Olivier|Prinsloo|Rossouw|Scheepers|Schoeman|Smit|Steenkamp|Terblanche|Theron|Truter|Vermaak|Vermeulen)$/,1],[/^(N[dgkctz]|M[bcdfgkhlmnpstv]h?|Dl|Kh[ou]|Zul|Zw|Ts|Hl|X[hou]|S[ei]th|Gum|Bu|Mo[kf]|Ma[bhs]|Ra[md]|Se[bk]|Le[bkt]|Ph|Th[ae]m|Nx|Nq|Gc|Mc[au])/,2]], banLast:[SOUTH_ASIAN,EAST_ASIAN,IBERIAN_PT,HISPANIC] },
    IRL: { iso:'IE', last:50, first:15, banLast:[NORDIC_FOREIGN,IBERIAN_PT,HISPANIC,SLAVIC_EAST] },
    POR: { iso:'PT', last:50, first:15, banLast:[NORDIC_FOREIGN,HISPANIC] },
    COL: { iso:'CO', last:50, first:15 },
    RUS: { iso:'RU', last:50, first:15, translit:true, banLast:[/(ova|eva|ina|yna|aya)$/i], banFirst:[/(a|ya)$/i] },
    POL: { iso:'PL', last:50, first:15, banLast:[/(ska|cka|zka)$/i,NORDIC_FOREIGN] },
    CZE: { iso:'CZ', last:50, first:15, banLast:[/(ová|á)$/,NORDIC_FOREIGN] },
    HUN: { iso:'HU', last:50, first:15, banLast:[NORDIC_FOREIGN] },
    URU: { iso:'UY', last:30, first:10 },
    ISR: { iso:'IL', last:30, first:10, banLast:[/^(Mohammed|Mohamed|Muhammad|Ahmad|Ahmed|Ali|Mahmoud|Hassan|Khalil|Ibrahim|Omar|Mansour|Taha|Odeh|Salame|Salameh|Jaber|Khoury|Haddad|Srour|Zoabi|Agbaria|Kanaan|Masarwa|Watad|Abu[ -])/i], banFirst:[/^(Mohammed|Mohamed|Muhammad|Ahmad|Ahmed|Ali|Mahmoud|Hassan|Omar|Ibrahim|Khalil|Yousef|Mustafa|Adham|Amir)$/i] },
    IND: { iso:'IN', last:30, first:10, route:[[/^(Reddy|Nair|Menon|Rao|Iyer|Iyengar|Krishnan|Pillai|Naidu|Naicker|Gowda|Shetty|Hegde|Kamath|Bhat|Nayak|Acharya|Adiga|Kulkarni|Deshpande|Joshi|Patil|Chari|Raman|Rajan|Srinivasan|Subramanian|Subramaniam|Venkatesh|Ramachandran|Balasubramanian|Natarajan|Sundaram|Swamy|Murthy|Murty|Chandran|Menen|Varma|Warrier|Kurup|Panicker|Namboothiri)$/,1]] },
    MAS: { iso:'MY', last:30, first:10, route:[[/^(Tan|Lee|Lim|Wong|Ng|Chan|Chong|Chin|Ong|Yap|Yong|Teo|Goh|Ho|Chua|Khoo|Toh|Sim|Foo|Gan|Low|Loh|Koh|Tay|Seah|Chew|Cheng|Chia|Yeo|Ang|Oh|Soh|Neo|Kwek|Leong|Liew|Ling|Loke|Mah|Mok|Pang|Phang|Poh|Quah|See|Seow|Sia|Siow|Soo|Tee|Ting|Tong|Wan[g]?|Wee|Yam|Yeap|Yen|Yip|Chai|Chang|Chee|Cheah|Cheok|Chew|Chiam|Chiew|Chik|Choo|Chow|Choy|Chu|Chung|Eng|Fong|Fung|Gooi|Heng|Hii|Hoo|Kam|Kang|Kee|Khaw|Khor|Kong|Koo|Kuan|Kwan|Lai|Lam|Lau|Law|Leow|Loo|Lua|Lye|Ma|Nga|Ngu|Oon|Ooi|Ow|Pua|Puah|Saw|Sng|Soong|Su|Sua|Tam|Tang|Tham|Thoo|Tiong|Voon|Wu|Yau|Yew|Yii|Yu|Yuen)$/,1]], banLast:[SOUTH_ASIAN] },
    INA: { iso:'ID', last:30, first:10 },
    EST: { iso:'EE', last:30, first:10, route:[[/(ov|ev|in|yn|enko|chuk)$|^(Ivanov|Smirnov|Petrov|Kuznetsov|Popov|Volkov|Sokolov|Nikitin|Orlov|Fjodorov|Fyodorov|Vassiljev|Vasiljev|Aleksejev|Andrejev|Sergejev|Mihhailov|Pavlov|Bogdanov|Stepanov|Semjonov|Tarassov|Kolesnik)/,1]], banFirst:[/^(Aleksandr|Sergei|Andrei|Dmitri|Aleksei|Vladimir|Igor|Roman|Oleg|Artur|Maksim|Jevgeni|Pavel|Anton|Nikolai|Aleksander|Sander)$/] },
    MAR: { iso:'MA', last:20, first:0, banLast:[/^(El|Ben|Da|De|Ell|Kech|Wac|None|Ced|Dh|Df|Eh|Ef|Jef|Simo|Fati|Abdo|Amine|Said|Rachid|Hassan|Ahmed|Ali|Youssef|Aziz|Karim|Kamal|Adam|Mohamed)$/i] }
};

const readAgg = (file) => {
    const by = new Map();
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/^([A-Z]{2}),"(.*)",(\d+)$/);
        if (!m) continue;
        if (!by.has(m[1])) by.set(m[1], []);
        by.get(m[1]).push(m[2]);
    }
    return by;
};
const foreBy = readAgg('fore_agg.csv');
const surBy = readAgg('sur_agg.csv');

// vorhandene Pool-Namen je Nation (deaccented-lowercase)
function poolKeys(nat, kind) {
    const s = new Set();
    for (const r of NAME_POOLS_BY_NATION[nat].regions) {
        const src = kind === 'first' ? (Array.isArray(r.first) ? r.first : [...(r.first.early||[]),...(r.first.mid||[]),...(r.first.modern||[])]) : r.last;
        for (const [n] of src) s.add(key(n));
    }
    return s;
}

function extract(nat, cfg, kind, list, n) {
    if (!list || n === 0) return [];
    const existing = poolKeys(nat, kind);
    const seen = new Set();
    const bans = (kind === 'first' ? cfg.banFirst : cfg.banLast) || [];
    const out = []; // [{name, r}]
    for (let raw of list) {
        if (out.length >= n) break;
        let name = raw.trim();
        if (cfg.translit && hasCyrillic(name)) name = translit(name);
        if (hasCyrillic(name) || !isLatinName(name) || name.length < 3) continue;
        // Titlecase erzwingen (Datensatz ist sauber, aber sicher ist sicher)
        if (name !== name.charAt(0).toUpperCase() + name.slice(1) && !/^(De |Da |Van |Von |El |Le |La |Du |O'|Mc|Mac|St-)/.test(name)) continue;
        const k = key(name);
        if (existing.has(k) || seen.has(k)) continue;
        if (kind === 'last' && GIVEN_AS_SURNAME.test(name)) continue;
        if (bans.some(b => b.test(name))) continue;
        let r = 0;
        if (cfg.route) for (const [re, ri] of cfg.route) { if (re.test(name)) { r = ri; break; } }
        seen.add(k);
        out.push({ name, r });
    }
    return out;
}

let review = '', js = '// Raritäten-Schwänze (implizit Gewicht 1) — von extract-tails.js erzeugt, danach kuratiert.\n// Merge-Regel: Integration hängt first an mid+modern (bzw. flaches Array) und last an region r an.\nconst NAME_TAILS_BY_NATION = {\n';
for (const [nat, cfg] of Object.entries(CFG)) {
    const firsts = extract(nat, cfg, 'first', foreBy.get(cfg.iso), cfg.first);
    const lasts = extract(nat, cfg, 'last', surBy.get(cfg.iso), cfg.last);
    const regions = new Map();
    for (const { name, r } of firsts) { if (!regions.has(r)) regions.set(r, { first: [], last: [] }); regions.get(r).first.push(name); }
    for (const { name, r } of lasts) { if (!regions.has(r)) regions.set(r, { first: [], last: [] }); regions.get(r).last.push(name); }
    review += `\n### ${nat}\n`;
    js += `    ${nat}: [\n`;
    for (const [r, d] of [...regions.entries()].sort((a, b) => a[0] - b[0])) {
        review += `  [r${r}] first(${d.first.length}): ${d.first.join(', ')}\n  [r${r}] last(${d.last.length}): ${d.last.join(', ')}\n`;
        js += `        { r: ${r}, first: ${JSON.stringify(d.first)}, last: ${JSON.stringify(d.last)} },\n`;
    }
    js += '    ],\n';
}
js += '};\n';
fs.writeFileSync('name-tails-review.txt', review);
fs.writeFileSync('name-tails.out.js', js);
console.log('OK — Review:', review.length, 'Zeichen | JS:', js.length, 'Zeichen');
