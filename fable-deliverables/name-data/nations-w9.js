// Namens-Pools Welle 9 (2026-10-04): IRI, OMA, JAM, CYP, ESA (Kaggle) + BAR, SEY, RWA (worldnames.xyz).
// Länder, die in der Wikidata-Rundstreckenzählung (ohne Rallye) vorkommen, aber noch keine Namen hatten — erst mit
// Namen nimmt build-nation-extra.js sie in die Nationen-Auswahl auf. Fahrer (Debüt 1950–2030): Iran 6, Oman 3,
// Jamaika 3, El Salvador 3, Barbados 2, Seychellen 2, Zypern 1, Ruanda 1.
// Kaggle:      node aggregate-names.js <roh.csv> w9_*.csv M|F|ALL 800|2000 IR,OM,JM,CY,SV
// worldnames:  node w8-quellen/worldnames-scrape2.js https://worldnames.xyz/most-common-…-in-<land>/ 30 w9-quellen/…
//              (Barbados: nur Nachnamen; El Salvador: Vornamen fehlen dort → Kaggle)
// Befunde: BEFUNDE.md 04.10.2026 (6). Rohnamen nie ausgeben (API-Inhaltsfilter).
'use strict';

const fs = require('fs');
const W5 = require('./nations-w5.js');
const key = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const SHORT = /^.{1,2}$/;
const DIR = __dirname + '/w9-quellen/';
const read = f => fs.readFileSync(DIR + f, 'utf8').split('\n').filter(Boolean).map(l => l.split('\t')).map(p => ({ name: p[1].trim(), c: +p[2] }));
const weigh = list => { const max = Math.max(...list.map(e => e.c)); return list.map(e => [e.name, Math.max(1, Math.round(100 * Math.pow(e.c / max, 0.6)))]); };

const SOUTH_ASIAN_LAST = /^(Singh|Kaur|Kumar|Khan|Patel|Sharma|Shah|Das|Raj|Rana|Ali|Ahmed|Hussain|Hossain|Islam|Uddin|Alam|Rahman|Miah|Mia|Begum|Iqbal|Malik|Chaudhry|Yadav|Gupta|Thapa|Gurung|Tamang|Rai|Magar|Shrestha|Babu|Nair|Pillai|Perera|Fernando|Silva)$/;
const BRIT_LAST = /^(Smith|Jones|Williams|Brown|Taylor|Davies|Wilson|Evans|Thomas|Johnson|Roberts|Walker|Wright|Robinson|Thompson|White|Hughes|Edwards|Green|Hall|Wood|Harris|Lewis|Martin|Jackson|Clarke|Clark|Turner|Hill|Scott|Cooper|Morris|Ward|Moore|King|Watson|Baker|Harrison|Morgan|Young|Allen|Mitchell|James|Anderson|Phillips|Bell|Parker|Davis|Miller|Murphy|Kelly)$/;
const SLAVIC_LAST = /(ova|eva|ov|ev|enko|chuk|ina|ski|ska|ić|ic)$/;

// ── IRI ─────────────────────────────────────────────────────────────────────
// Persisch, 84 % der Vornamen lateinisch (Rest persische Schrift → fällt weg). ⚠ Unter den IR-Vornamen stehen
// tschechische (Petr, Jan, Pavel, Jakub) — vermutlich ein Länderkürzel-Fehler im Datensatz → foreignFirstIso CZ/SK.
// Nachnamen-Kopf sauber (Ahmadi, Mohammadi, Karimi, Hosseini, Rezaei).
const IRI_JUNK = /^(Iran|Irani|Tehran|Persian|Pars|Mr|Dr|Eng|Seyed|Sayed|Seyyed|Mir|Haj|Hadj|Shah|Khan)$/;
// ⚠ foreignFirstIso reicht NICHT: der tschechische Block im IR-Aggregat ist so groß, dass Petr/Jan dort häufiger stehen
// als im CZ-Aggregat, und auch Nachnamen (Novák, Nováková) sind betroffen. Gemessen 04.10.2026 → harte Sperre: alles,
// was im CZ- oder SK-Aggregat (fore_agg/sur_agg) überhaupt vorkommt. Persische Namen stehen dort nicht.
let _cz = null;
function czNames() {
    if (_cz) return _cz;
    _cz = new Set();
    for (const f of ['fore_agg.csv', 'sur_agg.csv'])
        for (const l of fs.readFileSync(__dirname + '/' + f, 'utf8').split('\n')) { const m = l.match(/^(CZ|SK),"(.*)",\d+$/); if (m) _cz.add(key(m[2].trim())); }
    return _cz;
}
const czech = { test: n => czNames().has(key(n)) || /(ová|ák|ík|ský|ský|ný|čka|ček)$/.test(n) };

// ── OMA ─────────────────────────────────────────────────────────────────────
// Wie BRN/KUW (Welle 5): Kopf voller Gastarbeiter (Kumar, Islam, Singh, Rajesh, Raju) → Vornamen kuratiert (foreCap0),
// Nachnamen aus den Daten nur in der Golf-Form Al-… (Albalushi → Al-Balushi).

// ── JAM ─────────────────────────────────────────────────────────────────────
// Anglo-karibisch, sauber. Dancehall-/Social-Media-Wörter raus.
const JAM_JUNK = /^(Unruly|Junior|Jnr|Yardie|Jamaica|Kingston|Gaza|Boss|Don|General|Prince|King|Rasta|Gully|Dj|Selecta|Bwoy|Badman|Shotta)$/;

// ── CYP ─────────────────────────────────────────────────────────────────────
// Griechisch-zypriotisch (Georgiou, Ioannou, Charalambous; zypriotische Schreibung Nicos/Costas). Zuwanderer
// (Südasien, Briten, Osteuropa) raus. Michael/Savva/Christofi sind echte zypriotische Familiennamen.
const GREEK_FEMALE = /(opoulou|poulou|idou|iadou|adou)$/;

// ── ESA ─────────────────────────────────────────────────────────────────────
// Kaggle dünn (208 Vor-/354 Nachnamen-Zeilen) → aufgefüllt aus GUA (Nachbar, gleicher Namensraum), eigene ≥ 65 %.

const CFG = {
    IRI: { iso:'IR', cls:'small', givenRatio:1, foreignFirstIso:['CZ', 'SK'],
           banLast:[SHORT, IRI_JUNK, SOUTH_ASIAN_LAST, BRIT_LAST, SLAVIC_LAST, czech], banFirst:[IRI_JUNK, czech] },
    OMA: { iso:'OM', cls:'small', norm: W5.GULF.gulfNorm, foreCap0:true, banLast:[...W5.GULF.baseLast, W5.GULF.notAlForm] },
    JAM: { iso:'JM', cls:'small', givenRatio:1, banLast:[SHORT, JAM_JUNK, SOUTH_ASIAN_LAST], banFirst:[JAM_JUNK] },
    CYP: { iso:'CY', cls:'small', givenRatio:1, banLast:[SHORT, SOUTH_ASIAN_LAST, BRIT_LAST, SLAVIC_LAST, GREEK_FEMALE, /^(Cyprus|Kypros|Limassol|Nicosia|Larnaca|Paphos)$/] },
    ESA: { iso:'SV', cls:'tiny', givenRatio:1, banLast:[SHORT, /^(El Salvador|Salvador|San Salvador)$/], banFirst:[/^(Maria|María)$/] }
};

// ── worldnames-Pools ────────────────────────────────────────────────────────
// RWA: Kinyarwanda-Namen sind persönlich, nicht Familiennamen; Uw-/Umu-/Ing-Namen überwiegend weiblich (Uwimana,
// Ingabire, Umutoni) → raus. Vornamen französisch-christlich (Jean, Innocent, Aimable, Theogene).
const RWA_FEMALE = /^(Uw|Umu|Ing|Kayitesi|Mbabazi|Uwera|Mukamana|Mukandayisenga|Nyiransabimana)/;
const sey = { first: weigh(read('worldnames-sey-fore.tsv')), last: weigh(read('worldnames-sey-sur.tsv')) };
const rwa = { first: weigh(read('worldnames-rwa-fore.tsv')), last: weigh(read('worldnames-rwa-sur.tsv').filter(e => !RWA_FEMALE.test(e.name) && !/^(Jean|Marie|Pierre|Paul)$/.test(e.name))) };

const POOLS = {
    IRI: { regions: [ { w:1, first: [['Mohammad',5],['Ali',5],['Reza',4],['Hossein',4],['Amir',4],['Mehdi',3],['Hamid',3],['Saeed',3],['Majid',3],['Hassan',3],['Behnam',2],['Farhad',2]], last: [] } ] },
    OMA: { regions: [ { w:1,
        first: [['Mohammed',5],['Ahmed',4],['Ali',4],['Said',4],['Salim',4],['Khalid',3],['Abdullah',3],['Hamad',3],['Sultan',3],['Nasser',3],['Saif',3],['Hilal',2],
                ['Talal',2],['Faisal',2],['Yousuf',2],['Ibrahim',2],['Juma',2],['Musallam',2],['Rashid',2],['Hamood',2],['Badr',2],['Mazin',2],['Haitham',2],['Ahmad',2]],
        last: [['Al-Balushi',3],['Al-Harthy',3],['Al-Busaidi',3],['Al-Rawahi',2],['Al-Hinai',2],['Al-Maskari',2],['Al-Saadi',2],['Al-Kindi',2],['Al-Shukaili',2],['Al-Amri',2],['Al-Habsi',2],['Al-Riyami',2]] } ] },
    JAM: { regions: [ { w:1, first: [['Michael',4],['Andre',4],['Anthony',4],['Richard',3],['Dwayne',3],['Kemar',3],['Omar',3],['Ricardo',3],['Jermaine',3],['Damion',2],['Marlon',2],['Rohan',2]], last: [] } ] },
    CYP: { regions: [ { w:1, first: [['Andreas',5],['Georgios',4],['Christos',4],['Marios',4],['Michalis',3],['Costas',3],['Nicos',3],['Demetris',3],['Stelios',3],['Savvas',3],['Kyriacos',2],['Panayiotis',2]],
        last: [['Michael',3],['Savva',2],['Christofi',2]] } ] },
    ESA: { regions: [ { w:1, first: [['José',5],['Carlos',4],['Luis',4],['Juan',4],['Roberto',3],['Óscar',3],['Mario',3],['Nelson',3],['Mauricio',3],['Ernesto',3],['Rafael',2],['Josué',2]], last: [] } ] },
    // BAR: worldnames hat nur Nachnamen (Alleyne, Brathwaite, Forde) → Vornamen im Build aus JAM (anglo-karibisch)
    BAR: { regions: [ { w:1, first: [['John',1]], last: weigh(read('worldnames-bar-sur.tsv')) } ] },
    SEY: { regions: [ { w:1, first: sey.first, last: sey.last } ] },
    RWA: { regions: [ { w:1, first: rwa.first, last: rwa.last } ] }
};

// Im Build nach processNation: Vornamen-Kopie und Auffüllen (Mechanik wie Welle 8)
const COPY = [ { nat: 'BAR', ri: 0, kind: 'first', donor: ['JAM', 0] } ];
const SUPPLEMENT = [
    { nat: 'ESA', ri: 0, kind: 'last',  donor: ['GUA', 0], f: 0.5 },
    { nat: 'ESA', ri: 0, kind: 'first', donor: ['GUA', 0], f: 0.5 }
];
// worldnames-Nachnamen El Salvador als zweite Quelle für ESA: im Build vor dem Auffüllen eingemischt (gleiche Skala)
const ESA_WN_LAST = weigh(read('worldnames-esa-sur.tsv'));

module.exports = { CFG, POOLS, OPS: {}, COPY, SUPPLEMENT, ESA_WN_LAST };
