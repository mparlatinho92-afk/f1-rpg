// Namens-Pools Welle 5 (2026-10-03): TUN, ALG, LBA, IRQ, JOR, LBN, BRN, KUW. Vorher alle auf MAR.
// Quelle: BigQuery-/Kaggle-Rohdaten, aggregiert mit
//   node aggregate-names.js <forenames.csv> w5_fore_agg.csv   M   800  TN,DZ,LY,IQ,JO,LB,BH,KW
//   node aggregate-names.js <forenames.csv> w5_fore_f_agg.csv F   800  (dito)
//   node aggregate-names.js <forenames.csv> w5_fore_u_agg.csv ALL 1200 TN,DZ,LY,LB,BH   (dort KEIN Geschlecht im Datensatz)
//   node aggregate-names.js <surnames.csv>  w5_sur_agg.csv    ALL 2000 (dito)
//   node gender-ref.js → w5_gender_ref.csv (M/F je Name aus Ländern MIT Angabe)
// Eingebunden von build-names-v3.js. Befunde: BEFUNDE.md 03.10.2026 (5). Rohnamen nie ausgeben (API-Inhaltsfilter).
//
// Schreibweise bleibt die des Landes: Maghreb französisch geprägt (Mohamed, Mehdi, Ben Salah), Irak/Jordanien/Golf
// englisch geprägt (Mohammed, Ahmad, Al-Mutairi), Libanon gemischt (Mohamad, Georges, El Khoury).
// Arabische Schrift (Irak 84 %, Libyen 79 %, Jordanien 63 % der Träger) fällt weg: ohne Vokalzeichen nicht
// verlässlich umschreibbar (محمد = "Mhmd"). Der lateinische Rest reicht für die Gewichte.
'use strict';

const fs = require('fs');
const key = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const SHORT = /^.{1,2}$/;

// ── Geschlecht für TN/DZ/LY/LB/BH (Datensatz ohne Angabe) ──────────────────
// Nur überwiegend männlich belegte Namen (M >= 2·F in der Referenz); unbekannte fallen weg (je Land 1–3 % des Gewichts).
let _ref = null;
function genderRef() {
    if (_ref) return _ref;
    _ref = new Map();
    for (const l of fs.readFileSync(__dirname + '/w5_gender_ref.csv', 'utf8').split('\n').slice(1)) {
        const m = l.match(/^"(.*)",(\d+),(\d+)$/);
        if (m) _ref.set(m[1], [+m[2], +m[3]]);
    }
    return _ref;
}
// Nachname, der anderswo häufiger als VORNAME belegt ist (m+w) als hier als Nachname → Kose-/Rufname im
// Nachnamenfeld (Facebook). Strukturelle Regel statt endloser Einzelsperren; echte Vatersnamen sind kuratiert geschützt.
let _sur = null;
function surCount(iso, n) {
    if (!_sur) {
        _sur = new Map();
        for (const l of fs.readFileSync(__dirname + '/w5_sur_agg.csv', 'utf8').split('\n')) {
            const m = l.match(/^([A-Z]{2}),"(.*)",(\d+)$/);
            if (m) { const k = m[1] + ':' + key(m[2].trim()); _sur.set(k, (_sur.get(k) || 0) + +m[3]); }
        }
    }
    return _sur.get(iso + ':' + key(n)) || 0;
}
const givenElsewhere = iso => ({ test: n => { const r = genderRef().get(key(n)); return !!r && (r[0] + r[1]) > surCount(iso, n); } });
const notMale = { test: n => { const r = genderRef().get(key(n)); return !r || r[0] < 2 * r[1]; } };

// ── Gemeinsame Sperren ──────────────────────────────────────────────────────
// Gastarbeiter (Südasien, Philippinen, Sri Lanka, Nepal) und westliche Nachnamen — Golfstaaten ~20 % der Träger
const EXPAT_LAST = /^(Khan|Kumar|Singh|Patel|Sharma|Nair|Pillai|Menon|Reddy|Das|Shaikh|Sheikh|Hossain|Islam|Uddin|Miah|Begum|Iqbal|Raza|Butt|Chaudhry|Akhtar|Bibi|Mathew|Varghese|Abraham|Jacob|Philip|Kurian|Cherian|Babu|Raj|Rao|Gupta|Verma|Yadav|Joshi|Mehta|Shah|Gill|Ansari|Siddiqui|Qureshi|Mirza|Baig|Santos|Cruz|Reyes|Garcia|Ramos|Mendoza|Bautista|Dela Cruz|Gonzales|Torres|Flores|Villanueva|Aquino|Castillo|Rivera|Lopez|Perez|Fernandez|Silva|Fernando|Perera|Silva|De Silva|Gurung|Tamang|Thapa|Rai|Rana|Magar|Shrestha|Kc|Bk|Smith|Johnson|Williams|Brown|Jones|Miller|Davis|Wilson|Taylor|Anderson|Jackson|White|Martin|Thompson|Moore|Clark|Lewis|Walker|Hall|Allen|Young|King|Wright|Scott|Green|Baker|Adams|Nelson|Hill|Campbell|Mitchell|Roberts|Carter|Phillips|Evans|Turner|Parker|Collins|Edwards|Stewart|Morris|Murphy|Cook|Rogers|Morgan|Cooper|Peterson|Kelly|Howard|Ward|Cox|Richardson|Wood|Watson|Brooks|Bennett|Gray|James|Hughes|Price|Myers|Long|Foster|Sanders|Ross|Powell|Sullivan|Russell|Perry|Butler|Barnes|Fisher|Henderson|Coleman|Simmons|Patterson|Jordan|Reynolds|Hamilton|Graham|Kim|Lee|Wang|Li|Chen|Nguyen|Tran)$/;
const PLACES_LAST = /^(Tunis|Tunisie|Tunisia|Sfax|Sousse|Bizerte|Gabes|Kairouan|Algerie|Algeria|Alger|Oran|Constantine|Annaba|Setif|Blida|Bejaia|Tizi|Libya|Libia|Tripoli|Benghazi|Misrata|Iraq|Baghdad|Basra|Mosul|Erbil|Kurdistan|Jordan|Amman|Irbid|Zarqa|Aqaba|Lebanon|Liban|Beirut|Beyrouth|Tripoli|Saida|Bahrain|Manama|Kuwait|Q8|Dz|Tn|Ly|Iq|Jo|Lb|Bh|Kw)$/i;
// Nachgemessen 03.10.2026: Muster statt Einzelnamen (Kumari/Kumara/Chandran rutschten durch), dazu die von fixName
// akzentuierten spanischen Formen (López ≠ Lopez — die Akzent-Reparatur läuft VOR den Sperren).
const EXPAT_PATTERN_LAST = /(kumar|kumari|kumara|kumare|chandra|chandran|kutty|samy|swamy|ppan|ttan|deep|nair)$|^(López|Fernández|Pérez|Gómez|González|Rodríguez|Martínez|Sánchez|Hernández|Díaz|Ramírez|Gutiérrez|Álvarez|Jiménez)$/i;
const EXPAT_PATTERN_FIRST = /(esh|deep|preet|jit|inder|ndra|kumar)$|^(Mohd|Md|Muhd)$/i;
// Unisex, im arabischen Raum überwiegend weiblich (Referenz F > M); Kcha = kurdisch „Mädchen"
const FEMALE_EXTRA = /^(Noor|Nour|Rana|Safaa|Kcha|Atheer)$/;
// Bruchstücke/Abkürzungen im Vornamenfeld (Abo/Abou = „Vater von …", Med = Mohamed) und Gastarbeiter-Rufnamen
const JUNK_FIRST = /^(Abo|Abou|Abu|Abd|Med|Mhd|Kura|Shaik|Shaikh|Raju|Raja|Babu|Love|Prince|King|Boss|Dz|Simo)$/;
// Westliche Rufnamen: in den Golfstaaten fast nur Gastarbeiter (Inder, Filipinos) — im Libanon christlich-arabisch (dort erlaubt)
const WESTERN_FIRST = /^(John|Joseph|George|Thomas|Mathew|Matthew|Jose|Mark|Michael|David|Peter|Paul|James|Robert|William|Richard|Charles|Daniel|Anthony|Tony|Steven|Kevin|Brian|Jason|Eric|Alex|Andrew|Ryan|Jacob|Philip|Simon|Samuel|Benjamin|Christopher|Chris|Vincent|Martin|Francis|Antony|Sunny|Shibu|Biju|Jijo|Jojo|Rey|Mike|Jun|Mohan|Joy|Jimmy|Johnny|Rajan)$/;
// Arabische Vornamen, die die globale SOUTH_ASIAN-Klasse mitführt (Salman, Yasir …) — hier nativ, daher
// als Route freigestellt (die Guard nimmt Geroutetes aus)
const ARAB_SA_OK = /^(Salman|Yasir|Yaser|Yasser|Tahir|Taher|Zubair|Zuhair|Haroon|Harun|Haroun|Irfan|Imran|Omran|Kamran|Sajid|Adeel|Adil|Naeem|Naim|Nadeem|Nadim|Waseem|Wasim|Zahid|Zaher|Zaheer|Atif|Atef|Asif|Arshad|Mohsin|Mohsen|Amjad|Azhar|Mazhar|Qasim|Kassem|Kasem|Rizwan|Redwan|Ridwan|Zain|Zein|Shahid|Shaheed|Junaid|Tanveer|Zafar|Saqib|Shakeel|Shakil|Sohail|Suhail|Naveed|Nawaf|Faisal|Faysal)$/;

// Echte Nachnamen, die die globale GIVEN_AS_SURNAME-Liste sperrt (Vatersname als Familienname) — kuratiert = filterimmun
const PATRO = (...names) => names.map(n => [n, 2]);

// Al-Präfix (Golf/Irak/Jordanien): "Al Mutairi" / "al-mutairi" / "Almutairi" → "Al-Mutairi"
function alHyphen(n) {
    let m = n.match(/^(?:Al|AL|al)[ -]([A-Za-z]{3,})$/);
    if (m) return 'Al-' + m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    m = n.match(/^Al((?!ex|i)[a-z]{4,})$/);   // zusammengeschrieben (Almutairi, Alqattan, Alasfoor)
    if (m) return 'Al-' + m[1].charAt(0).toUpperCase() + m[1].slice(1);
    return n;
}
const gulfNorm = (n, kind) => kind === 'last' ? alHyphen(n) : n;
// Libanon: "El Khoury" / "El-Khoury" / "Elkhoury" auf "El Khoury"
function lbNorm(n, kind) {
    if (kind !== 'last') return n;
    const m = n.match(/^(?:El|EL|el)[ -]([A-Za-z]{3,})$/);
    return m ? 'El ' + m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() : n;
}

// ── LBN: muslimisch r0 / christlich r1 ──────────────────────────────────────
const LB_CHR_FIRST = /^(Georges|George|Elie|Elias|Charbel|Joseph|Pierre|Antoine|Tony|Michel|Marc|Paul|Jean|Johnny|Roy|Ralph|Chadi|Joe|Nicolas|Simon|Toni|Maroun|Boutros|Hanna|Fady|Rony|Roger|Robert|Raymond|Pascal|Patrick|Philippe|Christian|Edmond|Edgard|Emile|Fadi Elias|Jihad|Rabih|Sami|Tanios|Youssef|Jad|Karl|Charles|Gilbert|Camille|Nadim|Wadih|Assaad|Gebran|Gibran|Naji|Nabil|Chafic|Michael|Mario|Marwan|Elio|Anthony|Peter|David|John|William|Rudy|Steve|Ziad)$/;
// sowohl christlich als auch muslimisch belegt → beide Regionen (christlich gedämpft, weil r1 sonst überläuft)
const LB_SHARED_FIRST = /^(Fadi|Rami|Ziad|Walid|Nabil|Bassam|Fouad|Karim|Samir|Jad|Rabih|Jihad|Wissam|Imad|Marwan|Ghassan|Hani|Nader|Hadi|Ramzi|Ramez|Wael|Bilal|Tarek|Khalil|Salim|Selim|Youssef|Sami|Naji|Nadim|Riad|Raed|Mazen|Majed|Habib|Nassib|Chadi|Shadi|Mounir|Bachir|Kamal|Adel|Amine)$/;
const LB_CHR_LAST = /^(El Khoury|Khoury|Haddad|El Haddad|Gemayel|Aoun|Saade|Abi [A-Z]\w+|Abou [A-Z]\w+|Abi\w+|Hanna|Boutros|Sfeir|Frangieh|Chamoun|Karam|Daher|Azar|Tannous|Sleiman|Rizk|Maalouf|Eid|Chidiac|Geagea|Akiki|Kassis|Feghali|Hayek|Sarkis|Bassil|Moussa|Nakhle|Nakhleh|Salameh|Semaan|Saliba|Matta|Chahine|Chalhoub|Nasr|Yammine|Khalife|Khalifeh|Chedid|Rahme|Fares|Gerges|Georges|Nehme|Noujaim|Nader|Antoun|Tabet|Ghanem|Harb|Massoud|Raad|Abboud|Khoueiry|Bitar|Zakhour|Hajj|El Hajj|Chemaly|Tohme|Tawk|Kfoury|Lahoud|Maroun|Mikhael|Sabbagh|Sawaya|Wakim|Youssef|Zgheib|Zoghbi|Dagher|Nassif|Merhi|Kanaan|Saad|Mansour|Nassar|Khalil|Haddad)$/;
const LB_SHARED_LAST = /^(Saad|Mansour|Nassar|Khalil|Haddad|Fares|Harb|Nasr|Ghanem|Massoud|Raad|Hajj|El Hajj|Nader|Youssef|Moussa|Kanaan|Merhi|Daher)$/;

// ── IRQ: arabisch r0 / kurdisch r1 ──────────────────────────────────────────
const KURD_FIRST = /^(Karwan|Rebwar|Hawre|Hawri|Kawa|Shwan|Shvan|Hemin|Zana|Aram|Saman|Soran|Hiwa|Bahoz|Sherzad|Azad|Bryar|Goran|Rekar|Sardar|Dilshad|Hoshyar|Hogr|Hardi|Hersh|Kardo|Kurdo|Rawand|Rebin|Rezan|Sirwan|Sarwar|Diyar|Dlshad|Dler|Dilan|Ako|Baran|Barzan|Bewar|Botan|Dana|Darbaz|Halo|Hezha|Hemn|Hunar|Kamaran|Karzan|Lawk|Nawzad|Nechirvan|Pishtiwan|Rawa|Rebaz|Rizgar|Sakar|Shakhawan|Shirwan|Shorsh|Siamand|Sipan|Sirwan|Sorran|Twana|Yad|Zirak|Zryan|Kosrat|Kosar|Hawkar|Hawar|Ari|Arez|Avesta|Bakhtiyar|Bakhtiar|Barham|Dara|Delshad|Farhad|Hamza Kak|Jalal|Kak\w*|Mariwan|Najmadin|Omed|Peshawa|Qadir|Ranj|Rasti|Sabah|Salar|Shaho|Shko|Sherwan|Wrya|Zhyar)$/;
const KURD_LAST = /^(Barzani|Talabani|Zebari|Doski|Kurdi|Hawrami|Jaff|Mamand|Zibari|Surchi|Herki|Mizuri|Goran|Sindi|Duhoki|Hawleri|Sulaimani|Kirkuki|Rawanduzi|Baban|Bradost|Shingali|Barwari|Faqe|Faqi|Kaka|Kakai|Shex|Sheikhani|Pishdari|Dzayi|Hamawandi|Balisani|Bapir|Khoshnaw|Akrayi|Amedi|Atrushi|Bamarni|Berwari|Dizayee|Garmiani|Hasani|Karadaghi|Koyi|Qaradaghi|Rozhbayani|Salihi|Shwani|Zaxoyi|Zakhoyi)$/;
// Sunnitische Vaters-/Familiennamen bei Arabern UND Kurden
const IQ_SHARED_LAST = /^(Ahmed|Mohammed|Mohammad|Mohamed|Omar|Abdullah|Ibrahim|Mustafa|Othman|Osman|Rashid|Hama|Hamad|Aziz|Karim|Kareem|Qadir|Abdulrahman|Ismail|Salih|Saleh|Rasul|Rasool|Mahmood|Mahmoud|Hussein|Hassan|Ali|Khalid|Majeed|Jalal)$/;
const IQ_SHARED_FIRST = /^(Ahmed|Mohammed|Muhammad|Mohammad|Omar|Abdullah|Ibrahim|Mustafa|Othman|Osman|Rashid|Hama|Karim|Kareem|Ismail|Salih|Saleh|Rasul|Mahmood|Khalid|Hamza|Yousif|Yusuf|Bilal|Sami|Hassan|Hussein|Ali|Kamal|Jamal|Nawzad|Sabah|Farhad|Qadir|Jalal)$/;

// ── CFG-Einträge (Felder wie in build-names-v3.js) ──────────────────────────
// Facebook-Profile: Lieblingsverein, Marke, Stadt oder Titel im Nachnamenfeld (Algerien/Tunesien besonders)
const JUNK_LAST = /^(Chinwi|Kabyle|La Brune|Bel|Bba|Mahbola|Mahboula|Mkalcha|Taqana|Ail|Abd|Qween|Cool|Flower|Sweet|London|Jijel|Batna|Ski|Diallo|Traore|Traoré|Keita|Coulibaly|Konate|Balde|Sow|Al-Amgir|Al-Auddin|Al-Amin|Madrid|Real|Barca|Barcelona|Milano|Milan|Juve|Juventus|Arsenal|Chelsea|Liverpool|Mca|Usma|Jsk|Mco|Crb|Esm|Est|Css|Ess|Ca|Mosta|Lacoste|Queen|King|Prince|Princess|Love|Boss|Star|Officiel|Official|Pro|Style|Mc|Dj|Ben|Bou|El|Al|Abo|Abou|Abu|Aliraqi|Al-Iraqi|Iraqi|Libya|Tounsi|Dzair|Akter|Mia|Alam|Rahman|Baloch|Malik|Faruk|Basha|Shaik|Raju|Patidar|Ansari)$/i;
const baseLast = [SHORT, JUNK_LAST, EXPAT_LAST, EXPAT_PATTERN_LAST, PLACES_LAST, /(ova|eva|ian|yan)$/];
const baseFirst = [EXPAT_PATTERN_FIRST, FEMALE_EXTRA, JUNK_FIRST];
// BRN/KUW: Staatsbürger sind Minderheit (KW ~30 %, BH ~45 %) — der Datensatz ist dort überwiegend Gastarbeiter.
// Wie SAU/UAE/QAT: Vornamen nur kuratiert (foreCap0), Nachnamen aus den Daten NUR in der Golf-Form Al-… (Positiv-Regel).
const notAlForm = { test: n => !/^Al-[A-Z][a-z]{2,}$/.test(n) };
// Maghreb-Kosenamen im Nachnamenfeld: Verkleinerungsendungen (-cha/-oucha/-icha/-ouna), Silbenverdopplung (Dido, Zizo),
// französische Artikel/Wörter (Le Roi, Lartist), Fremdbuchstaben (Barça)
const MAGHREB_NICK = { test: n => /(cha|ouna)$/.test(n) || /^(\w{1,2})\1/i.test(n) || /^([bcdfghjklmnpqrstvwxyz])[aeiou]\1[aeiou]$/i.test(n) || /^(Le|La|Les) /.test(n) || /[çñ]/.test(n)
    || /^(Solo|Dadi|Eddine|Maryoul|Dido|Madridi|Dou|Lartist|Benz|Lakamora|Laklas|Bibicha|Nani|Rose|Koko|Bob|Ski|Blanche|Noir|Maryoula|Maryouma|Top|Usmh|Chawi|Sba|Polo|Mahboul|Alg)$/.test(n) };
// Sahel-Durchreisende in Libyen (Mali, Niger, Guinea) und Ortsnamen/Wörter
const SAHEL_LAST = /^(Niger|Dembele|Dembélé|Sissoko|Maiga|Maïga|Adamou|Toure|Touré|Cisse|Cissé|Kone|Koné|Bah|Barry|Camara|Sylla|Fofana|Nice|Top|Derna|Jado|Misurata|Misrata|Sirt|Zawia|Zawiya|Sabha|Zliten|Tobruk)$/;
// Kurdische Herkunfts- und Familiennamen in kurdischer Schreibung (x = kh) → kurdische Region
const KURD_FORM_LAST = /[xX]|^(Zangana|Harki|Jaf|Duski|Gardi|Karkuki|Hawlery|Hawlere|Slemani|Slemany|Kurdi|Rozhbayani)$/;
const CFG = {
    TUN: { iso:'TN', cls:'small', givenRatio:1, banLast:[...baseLast, givenElsewhere('TN'), MAGHREB_NICK], banFirst:[notMale, WESTERN_FIRST, ...baseFirst], routeFirst:[[ARAB_SA_OK, 0]] },
    // ALG: Datensatz am stärksten verunreinigt → kleinste Klasse (der Schwanz ist ungeprüfbar), Kosenamen-Muster gesperrt
    ALG: { iso:'DZ', cls:'tiny',  givenRatio:1, banLast:[...baseLast, givenElsewhere('DZ'), MAGHREB_NICK, /^(Mino|Tito|Nino|Amino|Torino|Zino)$/], banFirst:[notMale, WESTERN_FIRST, ...baseFirst], routeFirst:[[ARAB_SA_OK, 0]] },
    LBA: { iso:'LY', cls:'small', norm: gulfNorm, givenRatio:1, banLast:[...baseLast, givenElsewhere('LY'), SAHEL_LAST], banFirst:[notMale, WESTERN_FIRST, ...baseFirst], routeFirst:[[ARAB_SA_OK, 0]] },
    JOR: { iso:'JO', cls:'small', norm: gulfNorm, givenRatio:1, banLast:[...baseLast], banFirst:[WESTERN_FIRST, ...baseFirst], routeFirst:[[ARAB_SA_OK, 0]] },
    BRN: { iso:'BH', cls:'small', norm: gulfNorm, foreCap0:true, banLast:[...baseLast, notAlForm] },
    KUW: { iso:'KW', cls:'small', norm: gulfNorm, foreCap0:true, banLast:[...baseLast, notAlForm] },
    IRQ: { iso:'IQ', cls:'mid', norm: gulfNorm, givenRatio:1,
           // KEIN givenElsewhere: im Irak sind Vatersnamen echte Familiennamen (Osman, Jalal, Mahmood) — die Regel fraß sie
           route:[[KURD_LAST, 1], [KURD_FORM_LAST, 1], [IQ_SHARED_LAST, [0, 1], { 1: 0.6 }]],
           routeFirst:[[KURD_FIRST, 1], [IQ_SHARED_FIRST, [0, 1], { 1: 0.6 }], [ARAB_SA_OK, 0]],
           banLast:[...baseLast, /^(Gull|Xan|Can|Xam|Kurdish|Sport|Rash|Salh|Jan|Tanya|Koye|Zaxo|Ranya|Sha|Rose|Max)$/], banFirst:[WESTERN_FIRST, ...baseFirst] },
    LBN: { iso:'LB', cls:'small', norm: lbNorm, givenRatio:1,
           route:[[LB_SHARED_LAST, [0, 1], { 1: 0.6 }], [LB_CHR_LAST, 1]],
           routeFirst:[[LB_SHARED_FIRST, [0, 1], { 1: 0.5 }], [LB_CHR_FIRST, 1], [ARAB_SA_OK, 0]],
           banLast:[...baseLast], banFirst:[notMale, ...baseFirst] }
};

// ── Pool-Skelette ───────────────────────────────────────────────────────────
const POOLS = {
    TUN: { regions: [ { w:1, first: [['Mohamed',5],['Ahmed',4],['Ali',4],['Mehdi',3],['Karim',3],['Sami',3],['Hichem',3],['Walid',3],['Nabil',3],['Aymen',3],['Bilel',2],['Yassine',2]],
        last: PATRO('Mohamed','Ali','Ahmed','Hassen','Said','Karim','Aziz','Kamal') } ] },
    ALG: { regions: [ { w:1, first: [['Mohamed',5],['Ahmed',4],['Karim',4],['Sofiane',3],['Yacine',3],['Amine',3],['Riad',3],['Djamel',3],['Nassim',3],['Rachid',3],['Mourad',2],['Fethi',2]],
        last: PATRO('Mohamed','Ali','Ahmed','Said','Rachid','Karim','Aziz','Kamal') } ] },
    LBA: { regions: [ { w:1, first: [['Mohammed',5],['Ahmed',4],['Ali',4],['Abdulrahman',3],['Omar',3],['Khaled',3],['Mustafa',3],['Salem',3],['Ibrahim',3],['Mahmoud',2],['Hamza',2],['Osama',2]],
        last: PATRO('Mohammed','Ali','Ahmed','Hassan','Ibrahim','Omar','Said','Aziz') } ] },
    JOR: { regions: [ { w:1, first: [['Mohammad',5],['Ahmad',4],['Omar',4],['Khaled',3],['Ali',3],['Yazan',3],['Hamza',3],['Mahmoud',3],['Laith',3],['Odai',2],['Zaid',2],['Rami',2]],
        last: PATRO('Ahmad','Ali','Hassan','Ibrahim','Omar','Said','Karim','Aziz') } ] },
    BRN: { regions: [ { w:1, first: [['Mohammed',5],['Ahmed',4],['Ali',4],['Hussain',3],['Hasan',3],['Abdulla',3],['Salman',3],['Khalid',3],['Yousif',3],['Jasim',2],['Isa',2],['Hamad',2],
            ['Ebrahim',3],['Mahmood',3],['Sayed',3],['Jaffar',2],['Abbas',2],['Rashid',2],['Nasser',2],['Faisal',2],['Mohamed',3],['Fawaz',2],['Adel',2],['Saleh',2],['Waleed',2],['Hamza',2],['Majed',2],['Mubarak',2],['Sultan',2],['Fahad',2],['Hesham',2],['Redha',1]],
        last: [['Al-Khalifa',2],['Al-Dosari',2],['Al-Mannai',2],['Al-Zayani',2],['Al-Sayed',2],...PATRO('Ali','Ahmed','Hassan','Ibrahim','Omar','Said','Aziz')] } ] },
    KUW: { regions: [ { w:1, first: [['Mohammad',5],['Ahmad',4],['Abdullah',4],['Ali',3],['Fahad',3],['Khaled',3],['Saud',3],['Nasser',3],['Faisal',3],['Bader',3],['Talal',2],['Mishal',2],
            ['Abdulaziz',3],['Abdulrahman',3],['Yousef',3],['Hamad',2],['Sultan',2],['Salem',2],['Saad',2],['Mubarak',2],['Nawaf',2],['Turki',2],['Meshari',2],['Hamoud',2],['Fawaz',2],['Jassim',2],['Bandar',2],['Hussain',2],['Omar',2],['Waleed',2],['Majed',2],['Dhari',1]],
        last: [['Al-Mutairi',3],['Al-Ajmi',3],['Al-Enezi',3],['Al-Rashidi',2],['Al-Azmi',2],['Al-Shammari',2],['Al-Otaibi',2],['Al-Kandari',2],...PATRO('Ali','Ahmad','Hassan','Ibrahim','Omar','Aziz')] } ] },
    IRQ: { regions: [
        { w:0.82, first: [['Mohammed',5],['Ahmed',4],['Ali',4],['Hussein',4],['Mustafa',3],['Haider',3],['Abbas',3],['Omar',3],['Hassan',3],['Muntadher',2],['Karrar',2],['Zaid',2]],
          last: PATRO('Ali','Ahmed','Hassan','Ibrahim','Omar','Said','Karim','Aziz') },
        { w:0.18, first: [['Karwan',3],['Rebwar',3],['Hawre',3],['Shwan',3],['Hemin',3],['Zana',2],['Aram',2],['Soran',2],['Hiwa',2],['Azad',2],['Goran',2],['Bryar',2]],
          last: [['Barzani',2],['Talabani',2],['Zebari',2],['Doski',2],['Kurdi',2],['Hawrami',2],['Jaff',2],['Mamand',1]] }
    ] },
    // Christen ~32 % (Schätzungen 2020er), Drusen tragen arabische Namen beider Lager → r0
    LBN: { regions: [
        { w:0.66, first: [['Mohamad',5],['Ahmad',4],['Ali',4],['Hussein',3],['Hassan',3],['Omar',3],['Khaled',3],['Bilal',3],['Mahmoud',2],['Mustafa',2],['Abbas',2],['Hadi',2]],
          last: PATRO('Ali','Hassan','Ibrahim','Omar','Said','Karim') },
        { w:0.34, first: [['Georges',5],['Elie',5],['Charbel',4],['Joseph',4],['Pierre',3],['Antoine',3],['Michel',3],['Tony',3],['Marc',3],['Rabih',2],['Jad',2],['Nicolas',2]],
          last: [['El Khoury',4],['Haddad',3],['Gemayel',2],['Aoun',2],['Saade',2],['Karam',2],['Sfeir',2],['Hanna',2],['Boutros',2],['Rizk',2],['Maalouf',2],['Nakhle',1]] }
    ] }
};

const OPS = {};

// Bausteine für spätere Golf-Nationen (Welle 9: OMA)
module.exports = { CFG, POOLS, OPS, GULF: { gulfNorm, notAlForm, baseLast, baseFirst } };
