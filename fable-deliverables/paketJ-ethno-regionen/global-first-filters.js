// ============================================================================
// Paket J WELLE 3 — global-first-filters.js: GLOBALE Vornamen-Ethnien-Klassen
//
// IDEE (Nutzer-Vorgabe 2026-07-18): Ethnien-Regeln nicht mehr je Land pflegen
// (banFirst-Flickenteppich: FIN hatte einen, NED/AUT/DEN gar keinen, NOR einen
// mit Schreibvarianten-Löchern), sondern EINMAL als Klassen definieren und
// überall anwenden — wie EGY/MAR denselben arabischen Namensstock nutzen.
//
// MECHANIK — die Guard löst das Ban-vor-Route-Problem (§5.2-Falle) generisch:
//   Ein Klassen-Name wird in Nation X NUR gebannt, wenn X ihn nicht routet.
//   makeFirstGuard(nat, routeFirst) liefert ein { test() }-Objekt (Duck-Typing,
//   bans.some(b => b.test(n)) akzeptiert es):
//     test(n) = Klasse trifft n  UND  keine routeFirst-Regex von X trifft n
//   → GBR darf „Mohammed" weiter nach r1 routen, DEN bannt ihn; SWE routet
//   „Adnan/Emir/Kenan" nach r1 (ex-jugoslawisch), DEN/NED/AUT bannen sie.
//   Kein Listen-Abgleich von Hand, keine Doppelpflege.
//
// EINBAU (Build-Edit f, build-names-v3.js — NACH dem Paket-J-Wiring, damit
// routeFirst gesetzt ist):
//   const GF = require('../paketJ-ethno-regionen/global-first-filters.js');
//   for (const [nat, cfg] of Object.entries(CFG)) {
//       const guard = GF.makeFirstGuard(nat, cfg.routeFirst);
//       if (guard) cfg.banFirst = [...(cfg.banFirst || []), guard];
//   }
// Bestehende nations-spezifische banFirst (JPN westlich, ESP Kosenamen,
// RSA weiblich, GRE strukturell …) bleiben UNBERÜHRT — die Guard ergänzt nur.
//
// KOLLISIONS-DISZIPLIN (teuer gelernt, §5.3): Namen, die AUCH europäisch-nativ
// sind, stehen in KEINER Klasse: Sami (finnisch!), Elias (dt./nord. modern!),
// Armin (deutsch), Dino (italienisch), Denis (französisch), Bo (dänisch),
// Kai (norddeutsch), Haris/Charis (griechisch), Isa (nordisch), Aryan, Mario/
// Antonio/Sergio/Roberto/Alberto/Manuel/Ruben (italienisch/deutsch/nordisch).
// Ambige Ex-Jugo-Namen (Adnan/Emir/Tarik/Kenan/Emin) stehen BEWUSST in den
// Klassen — die SWE-Route nimmt sie dort aus, überall sonst sind sie
// muslimisch-gelesene Fremdkörper (Messbasis: DEN 1:11, AUT 1:13, NED 1:22).
// ============================================================================
'use strict';
const RR = require('./region-routes.js');

const FIRST_CLASSES = {
    // Arabisch/muslimisch (inkl. somalisch/maghrebinisch; Varianten-vollständig —
    // NORs alter banFirst scheiterte an Mohammad/Ahmad/Mohamad/Hussein/Mahmoud):
    ARABIC: /^(Moham+ed|Moham+ad|Muham+ad|Muham+ed|Mohamad|Muhamed|Md|Ahmed|Ahmad|Ahmet-?Ali|Ali|Omar|Umar|Osman|Othman|Hassan|Hasan|Hussein|Hussain|Husein|Ibrahim|Brahim|Mustafa|Mostafa|Moustafa|Mustapha|Mahmoud|Mahmud|Mehmood|Youssef|Yousef|Yusuf|Youcef|Yussef|Khalid|Khaled|Khalil|Karim|Kareem|Rachid|Rashid|Said|Saeed|Sayed|Samir|Bilal|Bilel|Hamza|Amir|Ameer|Aziz|Abdul\w*|Abdel\w*|Abdullah|Abdullahi|Abdi|Abdirahman|Walid|Waleed|Tarek|Tareq|Tarik|Tariq|Jamal|Jamel|Nabil|Hicham|Hisham|Younes|Younis|Yunus|Yassine|Yassin|Yasin|Zakaria|Zakariya|Ayoub|Ayub|Oussama|Osama|Usama|Soufiane|Sofiane|Sufyan|Ismail|Ismael|Imad|Anouar|Anwar|Noureddine|Nordin|Nourdine|Mourad|Murad|Fouad|Fuad|Habib|Hakim|Salah|Salim|Selim|Adel|Amin|Amine|Faisal|Feysal|Fahad|Fahd|Majid|Majed|Nasser|Nasir|Saad|Bashir|Bachir|Idris|Idriss|Ilyas|Musa|Moussa|Mousa|Issa|Mehdi|Mahdi|Reda|Rida|Ashraf|Adnan|Ramadan|Sulaiman|Suleiman|Souleymane|Hamid|Emir|Kenan|Mahamed|Liban|Ayan|Yonis|Farah|Guled|Zainab|Fadi|Bashar|Firas|Wissam|Nizar|Samer|Sameer|Rakan|Marwan|Ihab|Iyad)$/i,
    // (Fadi/Bashar/Firas/Wissam/Nizar: ISR-Fund „Daniel Khaled" — levantinische
    //  Vornamen ohne Euro-Kollision. Rami/Sami fehlen BEWUSST: auch jüdisch-
    //  israelisch bzw. finnisch.)
    // Türkisch: identische Klasse wie die GER-Route (dort r1, überall sonst Ban):
    TURKISH: RR.GER_TURKISH_FIRST,
    // Südasiatisch (Sikh/Hindu/pakistanisch/bengalisch):
    SOUTH_ASIAN: /^(Sandeep|Gurpreet|Harpreet|Jaspreet|Manpreet|Amandeep|Navdeep|Kulwinder|Jaswinder|Parminder|Rajinder|Surinder|Baljit|Ranjit|Davinder|Gurdeep|Harjit|Mohinder|Sukhwinder|Rahul|Amit|Vijay|Ravi|Raj|Arjun|Vikram|Nikhil|Rohan|Sanjay|Rajesh|Suresh|Ramesh|Deepak|Kiran|Karan|Krish|Aditya|Akshay|Ankit|Gaurav|Kunal|Manish|Rohit|Sahil|Siddharth|Varun|Vishal|Anil|Ashok|Dinesh|Mahesh|Ganesh|Prakash|Krishna|Kumar|Arun|Anand|Gopal|Hari|Mohan|Murali|Santosh|Satish|Vinay|Vishnu|Imran|Naveed|Nadeem|Salman|Yasir|Zahid|Farhan|Irfan|Kashif|Qasim|Saqib|Shakeel|Sohail|Tahir|Wajid|Zafar|Zeeshan|Shahid|Shahzad|Waqas|Younas|Awais|Adeel|Amjad|Arshad|Asif|Aslam|Atif|Azhar|Babar|Ghulam|Haroon|Junaid|Kamran|Mudassar|Mazhar|Mohsin|Naeem|Qaisar|Rizwan|Sajid|Sajjad|Shoaib|Tanveer|Usman|Waseem|Zaheer|Zubair|Zain|Syed)$/i,
    // Ostasiatisch (Pinyin/kantonesisch/vietnamesisch/koreanisch romanisiert).
    // OHNE Bo/Kai/Long/Min (nordisch/deutsch-kollidierend):
    EAST_ASIAN_PINYIN: /^(Wei|Jun|Ming|Feng|Hao|Jin|Cheng|Yong|Xin|Lei|Tao|Peng|Jian|Gang|Qiang|Zhiqiang|Xiaolong|Haoran|Zihao|Jiahao|Zeyu|Yichen|Zhenyu|Yuxuan|Minh|Duc|Quang|Tuan|Huy|Khanh|Jae|Min-?[Jj]\w+|Seung\w*|Hyun\w*|Dong-?[Hh]\w+|Sung\w*)$/,
    // Distinkt spanisch (OHNE italienisch/portugiesisch/deutsch/französisch-
    // geteilte Formen — Sergio/Roberto/Alberto/Antonio/Mario/Manuel/Ruben/
    // Emilio fehlen bewusst; NACHTRÄGLICH ebenfalls raus: Esteban (Ocon!),
    // Diego (Demme), Cristian (ital. Schreibform), Eduardo (De Filippo),
    // Fernando (ital. real) — die Kurven-Exclude-Generierung hätte sie sonst
    // aus den GER/ITA/FRA-Kurven verbannt. USA routet sie weiter nach r1
    // (USA_HISP_R1_FIRST ist unabhängig von dieser Klasse).
    // 2026-07-18 (ITA-Tail-Vertiefung): Osvaldo (Bagnoli), Gustavo (Thöni) und
    // unakzentuiertes Raul (Bova) ebenfalls raus — italienisch-nativ, standen
    // in den vertieften ITA-Kurven; „Raúl" mit Akzent bleibt distinkt spanisch.
    HISPANIC: /^(Jose|José|Juan|Carlos|Luis|Miguel|Jorge|Jesus|Jesús|Pedro|Alejandro|Javier|Ricardo|Francisco|Angel|Ángel|Andres|Andrés|Julio|Enrique|Salvador|Ramon|Ramón|Raúl|Cesar|César|Hector|Héctor|Pablo|Jaime|Guillermo|Felipe|Rodrigo|Santiago|Ignacio|Joaquin|Joaquín|Gonzalo|Marcelo|Mauricio|Humberto|Juan Carlos|Jose Luis|José Luis|Paco|Pepe|Manolo|Juanjo|Juanma)$/
};

// Nationen, für die eine Klasse NATIV ist (kein Ban — der eigene Namensstock):
const NATIVE_FIRST_CLASSES = {
    ARABIC: ['EGY', 'MAR', 'SAU', 'UAE', 'QAT', 'INA', 'MAS', 'TUR'],
    TURKISH: ['TUR'],
    SOUTH_ASIAN: ['IND'],
    EAST_ASIAN_PINYIN: ['CHN', 'KOR'],
    HISPANIC: ['ESP', 'MEX', 'ARG', 'COL', 'VEN', 'CHI', 'PER', 'URU', 'BRA', 'POR']
};
// (ISR bewusst NICHT nativ-arabisch: arabisch-israelische Namen sind dort per
// Bestandskonfiguration ausgeschlossen — die Guard bestätigt das nur.)

function makeFirstGuard(nat, routeFirst) {
    const classes = Object.entries(FIRST_CLASSES)
        .filter(([cls]) => !(NATIVE_FIRST_CLASSES[cls] || []).includes(nat))
        .map(([, re]) => re);
    if (!classes.length) return null;
    const routes = (routeFirst || []).map(r => r[0]);
    return {
        guardFor: nat, // Debug-Marker
        test: n => classes.some(re => re.test(n)) && !routes.some(re => re.test(n))
    };
}

module.exports = { FIRST_CLASSES, NATIVE_FIRST_CLASSES, makeFirstGuard };
