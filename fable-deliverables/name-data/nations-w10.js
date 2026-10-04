// Namens-Pools Welle 10 (2026-10-04): 15 Nationen, die bisher einen GEBORGTEN Pool nutzten und tatsächlich erzeugt
// werden (Paket-H-Tabellen bzw. data/nation-extra.js): UKR, BLR (vorher RUS), KEN (RSA), SEN, CIV (FRA), PAK, SRI (IND),
// LAT (LTU), SVK (CZE), SMR (ITA), PAR (ARG), DOM (COL), CUB (MEX), MOZ (POR), LIE (SUI).
// Keines im Kaggle-Datensatz → worldnames.xyz (w10-quellen/, Abruf mit w8-quellen/worldnames-scrape2.js).
//   Männliche Vornamen über …/most-common-names-in-<land>/male/; für SRI/PAR/DOM/CUB/MOZ/LIE gibt es nur die
//   gemischte Liste …/most-common-names-in-<land>/ → Geschlecht über w10_gender_ref.csv
//   (node gender-ref.js w10_gender_ref.csv ES,MX,AR,CO,PE,CL,PT,BR,DE,AT,CH,IT,FR,BE,GB,US,IN,RU,PL w10-quellen/*-fore.tsv).
// Fertige Pools ohne Daten-Merge (wie Welle 8). Befunde: BEFUNDE.md 04.10.2026 (8). Rohnamen nie ausgeben.
'use strict';

const fs = require('fs');
const key = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const DIR = __dirname + '/w10-quellen/';
// worldnames-Einträge teils URL-kodiert ("de+La+Cruz", "Pe%C3%B1a")
const dec = s => { try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { return s; } };
const read = f => fs.readFileSync(DIR + f, 'utf8').split('\n').filter(Boolean).map(l => l.split('\t'))
    .map(p => ({ name: dec(p[1].trim()), c: +p[2], alt: dec((p[3] || '').trim()) }));
const merge = list => { const m = new Map(); for (const e of list) { const k = key(e.name); const h = m.get(k); if (h) h.c += e.c; else m.set(k, { ...e }); } return [...m.values()].sort((a, b) => b.c - a.c); };
const weigh = list => { const max = Math.max(...list.map(e => e.c)); return list.map(e => [e.name, Math.max(1, Math.round(100 * Math.pow(e.c / max, 0.6)))]); };

let _ref = null;
function femaleRef(n) {   // true = in der Referenz überwiegend weiblich
    if (!_ref) { _ref = new Map(); for (const l of fs.readFileSync(__dirname + '/w10_gender_ref.csv', 'utf8').split('\n').slice(1)) { const m = l.match(/^"(.*)",(\d+),(\d+)$/); if (m) _ref.set(m[1], [+m[2], +m[3]]); } }
    const r = _ref.get(key(n)); return !!r && r[1] > r[0];
}
// männliche Form aus der Zweitform (Іванова/Іванов, Vargová/Varga), sonst Endungsregel
const maleSur = (e, rule) => ({ ...e, name: (e.alt && rule.test(e.name)) ? e.alt : e.name });

// ── UKR: kyrillisch → amtliche Pass-Umschrift (KMU 2010): Oleksandr, Serhii, Dmytro, Yevhen; Melnyk, Shevchenko ──
const UK = { 'а':'a','б':'b','в':'v','г':'h','ґ':'g','д':'d','е':'e','є':'ie','ж':'zh','з':'z','и':'y','і':'i','ї':'i','й':'i','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ь':'','ю':'iu','я':'ia',"'":'','’':'','ʼ':'' };
const UK_INIT = { 'є':'ye','ї':'yi','й':'y','ю':'yu','я':'ya' };
function ukTranslit(s) {
    if (!/[Ѐ-ӿ]/.test(s)) return s;
    s = s.toLowerCase().replace(/зг/g, 'zgh');
    let out = '';
    [...s].forEach((ch, i) => { out += (i === 0 && UK_INIT[ch]) ? UK_INIT[ch] : (UK[ch] !== undefined ? UK[ch] : ch); });
    return cap(out);
}
const UKR = {
    first: weigh(merge(read('worldnames-ukr-fore.tsv').map(e => ({ ...e, name: ukTranslit(e.name) })))),
    last: weigh(merge(read('worldnames-ukr-sur.tsv').map(e => maleSur(e, /(ова|ева|єва|іна|ська|цька)$/)).map(e => ({ ...e, name: ukTranslit(e.name) }))))
};

// ── BLR: Russisch in Latein, Social-Media-Kosenamen; Schreibung wie RUS-Pool (Alexander, Sergei, Dmitri) ──
const BLR_NICK = /^(Dima|Sasha|Zhenya|Pasha|Vlad|Vova|Kolya|Misha|Lesha|Lyosha|Seryozha|Sergo|Tolik|Vitya|Slava|Kostya|Tema|Artem4ik|Max|Alex|Andrei Dima|Stas|Yura|Valera|Dimon|Sanya|Igorek|Vanya|Petya|Grisha|Zhora|Nikitos|Kirya|Vadik|Edik|Toha|Tyoma|Lyokha)$/;
const RU_STYLE = { Aleksandr:'Alexander', Sergey:'Sergei', Andrey:'Andrei', Dmitry:'Dmitri', Dmitriy:'Dmitri', Alexey:'Alexei', Aleksey:'Alexei', Maksim:'Maxim', Evgeny:'Evgeni', Evgeniy:'Evgeni', Nikolay:'Nikolai', Yuriy:'Yuri', Yury:'Yuri', Vitaliy:'Vitali', Vitaly:'Vitali', Valeriy:'Valeri', Anatoliy:'Anatoli', Artyom:'Artem', Gennadiy:'Gennadi', Vasiliy:'Vasili', Georgiy:'Georgi', Grigoriy:'Grigori' };
const BLR = {
    first: weigh(merge(read('worldnames-blr-fore.tsv').filter(e => !BLR_NICK.test(e.name) && !/(ukha|ushka|yusha|yukha|ichka|onka)$/.test(e.name) && !femaleRef(e.name)).map(e => ({ ...e, name: RU_STYLE[e.name] || e.name })))),
    last: weigh(merge(read('worldnames-blr-sur.tsv').map(e => maleSur(e, /(ova|eva|ina|aya|kaya)$/))))
};

// ── KEN: christlich-englische Vornamen + Luo/Kikuyu/Luhya/Kalenjin-Nachnamen r0; muslimische Küste/Somali r1 ──
// Frauennamen im Nachnamenfeld: Luo A- (Atieno, Akinyi, Achieng, Adhiambo), Kikuyu (Wanjiku, Wambui, Njeri, Muthoni, Wairimu)
const KEN_FEMALE = /^(Atieno|Akinyi|Achieng|Adhiambo|Awino|Anyango|Auma|Akoth|Wanjiku|Wambui|Njeri|Muthoni|Wairimu|Wanjiru|Nyambura|Waithera|Wangari|Wangui|Njoki|Chebet|Jepkosgei|Jeptoo|Jepchirchir|Nekesa|Nafula|Nanjala|Mwende|Mumbua|Kanini|Faith|Mercy|Grace|Ann|Mary|Jane|Esther)$/;
const MUSLIM_FIRST = /^(Mohamed|Mohammed|Muhammad|Ibrahim|Abdi|Ali|Hassan|Hussein|Omar|Abdullahi|Ahmed|Yusuf|Osman|Abdirahman|Abdikadir|Salim|Said|Juma|Rashid|Bashir|Ismail|Adan|Hamisi|Abdalla|Abdallah|Musa|Issa|Hussein|Mahmoud|Idris|Yussuf|Mustafa|Khalid|Abubakar|Hamza|Bakari|Athman|Swaleh)$/;
const MUSLIM_LAST = /^(Mohamed|Ali|Hassan|Abdi|Ahmed|Hussein|Omar|Abdullahi|Ibrahim|Yusuf|Osman|Juma|Salim|Said|Adan|Bakari|Hamisi|Rashid|Abdalla|Abdallah|Musa|Issa|Ismail|Mohammed|Bashir|Khamis|Athman|Swaleh|Mwinyi|Barre|Farah|Warsame|Noor|Gedi|Dahir|Hirsi|Aden|Keinan|Mahamud|Guyo|Wario|Dido|Galgallo|Abdirahman|Shariff)$/;
const kenF = read('worldnames-ken-fore.tsv').filter(e => !femaleRef(e.name) && !KEN_FEMALE.test(e.name));
const kenL = read('worldnames-ken-sur.tsv').filter(e => !KEN_FEMALE.test(e.name));
const KEN = { regions: [
    { w: 0.89, first: weigh(kenF.filter(e => !MUSLIM_FIRST.test(e.name))), last: weigh(kenL.filter(e => !MUSLIM_LAST.test(e.name))) },
    { w: 0.11, first: weigh(kenF.filter(e => MUSLIM_FIRST.test(e.name))), last: weigh(kenL.filter(e => MUSLIM_LAST.test(e.name))) }
] };

// ── SEN ─────────────────────────────────────────────────────────────────────
const SEN = { first: weigh(read('worldnames-sen-fore.tsv').filter(e => !femaleRef(e.name) && !/^(Papa|Pape|El|Elhadji|El Hadji|Serigne|Mor|Mame)$/.test(e.name))),
              last: weigh(read('worldnames-sen-sur.tsv')) };

// ── CIV: Akan/Süden r0 (Koffi Kouassi), Mande/Senufo/Norden r1 (Moussa Ouattara) ──
// Akan-Wochentagsnamen stehen als Vor- UND Nachname (Koffi Kouassi). „Bi" = Namensbestandteil (Bété/Gouro) → raus.
const CIV_NORTH_LAST = /^(Bakayoko|Hien|Kone|Koné|Ouattara|Coulibaly|Traore|Traoré|Toure|Touré|Bamba|Fofana|Diomande|Konate|Konaté|Doumbia|Sanogo|Cisse|Cissé|Soro|Silue|Yeo|Coulibali|Diabate|Diabaté|Dosso|Sangare|Sangaré|Camara|Kamagate|Kamagaté|Dembele|Dembélé|Diarrassouba|Meite|Méité|Sylla|Diakite|Diakité|Fadiga|Keita|Sidibe|Sidibé|Ballo|Tuo|Soumahoro|Cherif|Chérif|Karamoko|Kante|Kanté|Diaby|Sorho|Ouedraogo|Ouédraogo|Sawadogo|Diallo|Barry|Sow)$/;
const CIV_SOUTH_FIRST = /^(Koffi|Kouassi|Yao|Kouame|Kouamé|Kouadio|N'Guessan|Kouakou|Konan|N'Goran|N'Dri|Kouao|Amani|Akissi|Kra|Assi|Brou|Kobenan|Aka|Ahoua|Kacou|Ehui|Assoumou|Adou|Kanga|Tano|Yapi|Kossonou|Ekra|Kadjo|Jean|Pierre|Paul|Joseph|Emmanuel|Serge|Didier|Christian|Patrick|Eric|Hervé|Herve|Arnaud|Yves|Olivier|Franck|Marc|Thierry|Alain|Michel|Francis|Guy|Bernard|Fabrice|Roland|Augustin|Gervais|Firmin|Desire|Désiré|Ange|Florent|Stephane|Stéphane|Romaric|Cedric|Cédric|Kevin|Junior|Jacques|Claude|Alexandre|Martial|Constant|Edmond|Lambert|Sylvain|Venance|Bertin|Valentin|Maurice|Rodrigue|Landry)$/;
// Norden = muslimische Vornamen (globale ARABIC-Klasse) + Mande/Senufo-Liste; ALLES andere Süden (französisch-christlich
// und Akan). Vorher umgekehrt: nur die Südliste nach r0 → Serge/Didier landeten im Norden (r0 nur 44 Vornamen).
const ARABIC = require('../paketJ-ethno-regionen/global-first-filters.js').FIRST_CLASSES.ARABIC;
const CIV_NORTH_FIRST = /^(Zie|Zié|Mamadou|Adama|Moussa|Souleymane|Abdoulaye|Brahima|Daouda|Siaka|Yacouba|Bakary|Yaya|Seydou|Drissa|Abou|Sie|Amadou|Lassina|Issouf|Lamine|Sekou|Inza|Losseni|Zoumana|Dramane|Fousseni|Moustapha|Oumar|Idrissa|Aboubakar|Salif|Sidiki|Tiemoko|Tiémoko|Nouhoun|Ousmane|Bourahima|Aboudramane|Kassoum|Soumaila|Mory|Sory|Karamoko|Mamadi|Bakari|Fode|Fodé|Ibrahima|Kalilou|Lacina|Nanga|Navigue|Ouattara|Siaka|Soungalo|Tidiane|Vafing|Yssouf|Zana)$/;
const civNorth = n => ARABIC.test(n) || CIV_NORTH_FIRST.test(n);
const civF = read('worldnames-civ-fore.tsv').filter(e => !femaleRef(e.name) && !/^(Bi|Kan)$/.test(e.name) && !CIV_NORTH_LAST.test(e.name));   // nördliche Familiennamen im Vornamenfeld raus
const civL = read('worldnames-civ-sur.tsv');
const CIV = { regions: [
    { w: 0.55, first: weigh(civF.filter(e => !civNorth(e.name))), last: weigh(civL.filter(e => !CIV_NORTH_LAST.test(e.name))) },
    { w: 0.45, first: weigh(civF.filter(e => civNorth(e.name))), last: weigh(civL.filter(e => CIV_NORTH_LAST.test(e.name))) }
] };

// ── PAK: Namensbestandteile als eigener Vorname (Abdul, Ghulam, Allah) raus; Bibi/Begum = weiblich ──
const PAK_PART = /^(Abdul|Ghulam|Syed|Allah|Ullah|Haji|Muhammad Ali|Shah|Din|Mian|Malik|Chaudhry|Rana|Raja|Hafiz|Qazi|Sheikh|Mir|Pir|Sardar|Khawaja|Mohammad|Muhammad)$/;
const PAK_FEMALE_LAST = /^(Bibi|Begum|Khatoon|Khatun|Parveen|Akhtar Bibi|Kausar|Fatima|Nasreen|Shaheen)$/;
const pakF = read('worldnames-pak-fore.tsv').filter(e => !femaleRef(e.name));
const pakFirstCount = new Map(pakF.map(e => [key(e.name), e.c]));
const PAK = {
    // Muhammad/Mohammad sind fast immer erster Bestandteil (Muhammad Imran) → nur gedämpft, nicht als Vornamen-Kopf
    first: weigh(pakF.map(e => /^(Muhammad|Mohammad)$/.test(e.name) ? { ...e, c: e.c * 0.1 } : e).filter(e => !/^(Abdul|Ghulam|Syed|Allah|Ullah|Haji|Shah|Din|Mian|Malik|Rana|Raja|Hafiz|Qazi|Sheikh|Mir|Pir|Sardar|Khawaja)$/.test(e.name))),
    // Nachname, der als Vorname häufiger belegt ist, raus (sonst „Javed Javed") — echte Familien-/Stammesnamen bleiben
    last: weigh(read('worldnames-pak-sur.tsv').filter(e => !PAK_FEMALE_LAST.test(e.name) && !/^(Allah|Ullah|Din|Bakhash|Khaw|Muhammad|Mohammad)$/.test(e.name)
        && (/^(Khan|Ali|Hussain|Ahmad|Ahmed|Shah|Hassan|Abbas|Iqbal|Akhtar)$/.test(e.name) || !(pakFirstCount.get(key(e.name)) > e.c))))
};
void PAK_PART;

// ── LAT: lettisch r0 / russischstämmig r1 (in lettischer Form: Aleksandrs Ivanovs) ──
// Quelle ohne Diakritika und mit weiblichen Nachnamen → auf männlich gefaltet; häufige Namen bekommen die amtliche Form.
const latFold = n => n.replace(/ina$/, 'ins').replace(/one$/, 'ons').replace(/ite$/, 'itis').replace(/ode$/, 'odis')
    .replace(/ova$/, 'ovs').replace(/eva$/, 'evs').replace(/ska$/, 'skis').replace(/ola$/, 'ols').replace(/ane$/, 'ans').replace(/ere$/, 'eris');
const LAT_DIAC = { Janis:'Jānis', Peteris:'Pēteris', Maris:'Māris', Karlis:'Kārlis', Gunars:'Gunārs', Martins:'Mārtiņš', Krisjanis:'Krišjānis', Arturs:'Artūrs', Juris:'Juris',
    Berzins:'Bērziņš', Kalnins:'Kalniņš', Ozolins:'Ozoliņš', Liepins:'Liepiņš', Krumins:'Krūmiņš', Zarins:'Zariņš', Eglitis:'Eglītis', Rudzitis:'Rudzītis', Kalejs:'Kalējs',
    Jansons:'Jansons', Ozols:'Ozols', Balodis:'Balodis', Andersons:'Andersons', Dreimanis:'Dreimanis', Petersons:'Pētersons', Vitols:'Vītols', Lacis:'Lācis',
    Sprogis:'Sproģis', Kalvins:'Kalviņš', Klavins:'Kļaviņš', Silins:'Siliņš', Lapins:'Lapiņš', Grinbergs:'Grīnbergs', Strazdins:'Strazdiņš', Vanags:'Vanags' };
const LAT_RU_FIRST = /^(Aleksandrs|Vladimirs|Nikolajs|Viktors|Ivans|Sergejs|Anatolijs|Jurijs|Andrejs|Mihails|Valerijs|Vasilijs|Igors|Jevgenijs|Aleksejs|Antons|Dmitrijs|Olegs|Pavels|Genadijs|Vitalijs|Konstantins|Maksims|Romans|Deniss|Vadims|Vjačeslavs|Vjaceslavs|Leonids|Borisss|Boriss|Grigorijs|Artjoms|Kirils|Iļja|Ilja|Stanislavs|Valentins|Eduards|Georgijs|Vladislavs|Nikita|Timurs|Ruslans|Arkādijs|Arkadijs|Semjons|Fjodors|Pjotrs|Jakovs|Aleksandr|Sergej)$/;
const LAT_RU_LAST = /(ovs|evs|ins)$|^(Ivanovs|Petrovs|Vasiljevs|Smirnovs|Kuznecovs|Popovs|Sokolovs|Fjodorovs|Mihailovs|Novikovs|Morozovs|Volkovs|Pavlovs|Semjonovs|Jakovļevs|Jakovlevs|Nikolajevs|Aleksejevs|Andrejevs|Sergejevs|Kozlovs|Lebedevs|Orlovs|Jegorovs)$/;
const latF = merge(read('worldnames-lat-fore.tsv').filter(e => !femaleRef(e.name)).map(e => ({ ...e, name: LAT_DIAC[e.name] || e.name })));
const latL = merge(read('worldnames-lat-sur.tsv').map(e => ({ ...e, name: latFold(e.name) })).map(e => ({ ...e, name: LAT_DIAC[e.name] || e.name })));
// Russisch: -ovs/-evs; lettisches -iņš/-ins (Bērziņš) ist KEIN Russisch → nach der Diakritik-Rückführung prüfen
const latIsRu = n => /(ovs|evs)$/.test(n) || (LAT_RU_LAST.test(n) && !/(iņš|ņš)$/.test(n) && /(ovs|evs)$/.test(n));
const LAT = { regions: [
    { w: 0.75, first: weigh(latF.filter(e => !LAT_RU_FIRST.test(e.name))), last: weigh(latL.filter(e => !latIsRu(e.name))) },
    { w: 0.25, first: weigh(latF.filter(e => LAT_RU_FIRST.test(e.name))), last: weigh(latL.filter(e => latIsRu(e.name))) }
] };

// ── SVK: männliche Form aus der Zweitform (Vargová/Varga). Ungarische Namen (Varga, Tóth) sind auch slowakisch häufig. ──
const SVK = { first: weigh(read('worldnames-svk-fore.tsv').filter(e => !femaleRef(e.name))),
              last: weigh(merge(read('worldnames-svk-sur.tsv').map(e => maleSur(e, /(ová|á)$/)))) };

// ── SMR: Bruchstücke (Pier, Gian, „Rag." = ragioniere) raus ──
const SMR = { first: weigh(read('worldnames-smr-fore.tsv').filter(e => !/^(Pier|Gian|Rag|Geom|Ing|Dott|Avv|Don|Gianluca Pier)$/.test(e.name) && !femaleRef(e.name))),
              last: weigh(read('worldnames-smr-sur.tsv')) };

// ── SRI: singhalesisch r0 / muslimisch (Moors) r1. Gemischte Liste → weibliche Endungen + Referenz ──
const SRI_FEMALE = /(ni|thi|shi|ari|ani|eshi|ushi|ini|mali|kanthi|wathi|latha|sha)$|^(Fathima|Fathimah|Kumari|Nadeesha|Chathurika|Shanika|Nadeeka|Inoka|Iresha|Udeshika|Kaushalya|Wasana|Dinusha|Anusha|Nilmini|Damayanthi|Ishara|Sachini|Piumi|Upeksha|Hiruni|Sewwandi|Chamari|Thilini|Gayani|Nisansala|Lakmali|Madusha|Shashika|Dilrukshi|Mariya|Mary|Rizana|Sithy|Sithi|Ayesha|Aysha)$/;
const SRI_MUSLIM_FIRST = /^(Mohamed|Mohammed|Muhammad|Ahamed|Ahmed|Abdul|Mohamad|Rizwan|Rifkhan|Fazil|Riyas|Nawas|Imran|Irfan|Ismail|Ibrahim|Rafeek|Rasheed|Hanifa|Najeeb|Faiz|Fairooz|Rimzan|Rishard|Ashraff|Ansar)$/;
const SRI_MUSLIM_LAST = /^(Mohamed|Ahamed|Mohammed|Ahmed|Ismail|Ibrahim|Hassan|Cader|Marikar|Lebbe|Rahuman|Rahman|Hameed|Haniffa|Careem|Rasheed|Jaleel|Hussain|Mohideen|Sheriff|Abdeen|Cassim|Saleem|Faleel|Jabir|Ali)$/;
const sriF = read('worldnames-sri-fore.tsv').filter(e => !femaleRef(e.name) && !SRI_FEMALE.test(e.name));
const sriL = read('worldnames-sri-sur.tsv');
// Muslimische Region (Moors, ~10 %): worldnames-Kopf hat nur 3 Vor-/4 Nachnamen → kuratiert ergänzt (Gewicht 1–3)
const SRI_MOOR_FIRST = [['Rizwan',3],['Fazil',3],['Riyas',3],['Nawas',2],['Imran',3],['Irfan',2],['Ismail',2],['Ibrahim',2],['Rafeek',2],['Rasheed',2],['Najeeb',2],['Fairooz',2],['Rimzan',2],['Rishard',2],['Ashraff',2],['Ansar',2],['Azam',2],['Hilmy',2],['Nizam',2],['Fawzan',1]];
const SRI_MOOR_LAST = [['Cader',3],['Marikar',3],['Lebbe',3],['Rahuman',3],['Hameed',3],['Haniffa',2],['Careem',2],['Rasheed',2],['Jaleel',2],['Mohideen',2],['Sheriff',2],['Abdeen',2],['Cassim',2],['Saleem',2],['Faleel',2],['Ismail',2],['Ibrahim',2],['Hassan',2]];
const addTo = (arr, extra) => { const h = new Set(arr.map(e => key(e[0]))); for (const e of extra) if (!h.has(key(e[0]))) arr.push(e); return arr; };
const SRI = { regions: [
    { w: 0.9, first: weigh(sriF.filter(e => !SRI_MUSLIM_FIRST.test(e.name))), last: weigh(sriL.filter(e => !SRI_MUSLIM_LAST.test(e.name))) },
    { w: 0.1, first: addTo(weigh(sriF.filter(e => SRI_MUSLIM_FIRST.test(e.name))), SRI_MOOR_FIRST.map(([n, w]) => [n, w * 15])),
              last: addTo(weigh(sriL.filter(e => SRI_MUSLIM_LAST.test(e.name))), SRI_MOOR_LAST.map(([n, w]) => [n, w * 15])) }
] };

// ── PAR / DOM / CUB / MOZ / LIE ─────────────────────────────────────────────
// PAR: Vornamenliste unbrauchbar (seltene/alte/weibliche Namen) → Vornamen im Build aus ARG (vorheriger Rückfall)
// DOM: gemischte Liste → Referenz; Altagracia/Mercedes/Rosario u. a. sind weiblich
const ES_FEMALE = /^(Maria|María|Ana|Carmen|Rosa|Juana|Altagracia|Mercedes|Rosario|Luz|Ramona|Angela|Ángela|Francisca|Josefa|Margarita|Antonia|Teresa|Isabel|Dolores|Gloria|Esperanza|Milagros|Yolanda|Miriam|Elena|Cristina|Patricia|Martha|Marta|Juana|Leonor|Belkis|Yanet|Yaneth|Yudelka|Yokasta|Yocasta|Mayra|Yesenia|Ysabel|Isabel|Daysi|Deysi|Fior|Fiordaliza|Altagracia)$/;
const DOM = { first: weigh(read('worldnames-dom-fore.tsv').filter(e => !femaleRef(e.name) && !ES_FEMALE.test(e.name))),
              last: weigh(read('worldnames-dom-sur.tsv')) };
// CUB: worldnames hat nur einen Vornamen → kuratierter Kopf (spanisch + die typisch kubanischen Y-Namen der Jahrgänge 1970–2000)
const CUB = { first: [['José',5],['Carlos',4],['Luis',4],['Jorge',4],['Juan',4],['Alejandro',3],['Yoandy',3],['Yasmany',3],['Yoel',3],['Yunior',3],['Yordanis',3],['Osmany',3],
                      ['Lázaro',3],['Raúl',3],['Ernesto',3],['Pedro',3],['Roberto',3],['Ángel',3],['Yosvany',2],['Yuniel',2],['Reinier',2],['Dairon',2],['Leonel',2],['Orlando',2],
                      ['Rafael',2],['Miguel',2],['Alberto',2],['Manuel',2],['Alexei',2],['Yanier',2],['Frank',2],['Yoandri',2],['Yusniel',2],['Arián',2],['Adrián',2],['Rolando',2]],
              last: weigh(read('worldnames-cub-sur.tsv')) };
// MOZ: Akzentmüll der Quelle (Sántos, Rodriguês, Mária) zurück; Junior/Manuel/António im Nachnamenfeld raus
const mozFix = n => ({ 'Sántos':'Santos', 'Rodriguês':'Rodrigues', 'Mária':'Maria', 'Joao':'João' })[n] || n;
const MOZ = { first: weigh(merge(read('worldnames-moz-fore.tsv').map(e => ({ ...e, name: mozFix(e.name) })).filter(e => !femaleRef(e.name) && !ES_FEMALE.test(e.name)))),
              last: weigh(merge(read('worldnames-moz-sur.tsv').map(e => ({ ...e, name: mozFix(e.name) })).filter(e => !/^(Junior|Júnior|Manuel|António|Antonio|Domingos|José|Jose|Pedro|Paulo|Carlos)$/.test(e.name)))) };
// LIE: gemischte Liste (Maria, Monika, Andrea …) → Referenz; „Andrea" ist im deutschsprachigen Raum weiblich
const LIE = { first: weigh(read('worldnames-lie-fore.tsv').filter(e => !femaleRef(e.name) && !/^(Andrea|Maria|Monika|Karin|Barbara|Ursula|Elisabeth|Brigitte|Claudia|Silvia|Rita|Erika|Sandra|Doris|Cornelia|Daniela|Petra|Christine|Ruth|Susanne|Yvonne|Nicole|Marianne|Renate)$/.test(e.name))),
              last: weigh(read('worldnames-lie-sur.tsv')) };

const one = p => ({ regions: [{ w: 1, first: p.first, last: p.last }] });
const POOLS = {
    UKR: one(UKR), BLR: one(BLR), KEN, SEN: one(SEN), CIV, PAK: one(PAK), LAT, SVK: one(SVK), SMR: one(SMR), SRI,
    PAR: { regions: [{ w: 1, first: [['Juan', 1]], last: weigh(read('worldnames-par-sur.tsv')) }] },
    DOM: one(DOM), CUB: one(CUB), MOZ: one(MOZ), LIE: one(LIE)
};
// Im Build nach processNation (Mechanik W9.COPY): PAR-Vornamen = ARG-Pool
const COPY = [ { nat: 'PAR', ri: 0, kind: 'first', donor: ['ARG', 0] } ];

module.exports = { POOLS, COPY };
