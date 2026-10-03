// Namens-Pools Welle 3 (2026-10-03): ALB, GEO, AZE, TKM, NGR, GHA.
// Vorher alle sechs auf dem Not-Fallback INT (12 Namen). Quelle: BigQuery-/Kaggle-Rohdaten,
// aggregiert mit  node aggregate-names.js <roh.csv> w3_*.csv M|F|ALL 600|1500 AL,AZ,GE,TM,NG,GH
// Eingebunden von build-names-v3.js (CFG / NEW_POOLS / OPS). Befunde: BEFUNDE.md 03.10.2026 (2).
'use strict';

const key = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const SHORT = /^.{1,3}$/;

// ── ALB ─────────────────────────────────────────────────────────────────────
// Aggregat sauber (Hoxha/Shehu/Marku-Kopf). Störer: Städte als Nachnamen (Vlore 829, Fier 703,
// Durres 691, "Albania" 632) und Frauennamen (Ana 911 → givenRatio).
const ALB_NICK_FIRST = /^(Beni|Juli|Besi|Miri|Eri|Edi|Albi|Ardi|Geni|Jani|Tani|Joni|Luli|Soni|Cimi|Meti|Kevi|Cuni|Koli|Tomi|Roni|Deni|Reni|Dori|Visi|Niku|Ladi|Keli|Ledi|Arti|Kleo|Gazi|Eno|Eni|Ani|Rei|Ari|Ben|Nik|Tan|Alex|Eli|Adi|Kristi|Xhoni|Lali|Leli|Beti|Pali|Bledi|Titi|Turi|Rimi|Doni|Loni|Bosi|Vini|Mir|Fred|Endi|Enri)$/;
const ALB_PLACES = /^(Vlor[eë]|Vlora|Fier|Fieri|Durr[eë]s|Durresi|Albania|Shqip[eë]ria|Tiran[eë]|Tirana|Elbasan|Elbasani|Kor[cç][eë]|Kor[cç]a|Shkod[eë]r|Shkodra|Berat|Berati|Lushnj[eë]|Kavaj[eë]|Sarand[eë]|Kuk[eë]s|Lezh[eë]|Pogradec|Gjirokast[eë]r|Kosova|Kosovo|Prishtina|Tropoja|Dibra|Mati|Puka|Mirdita)$/i;

// ── GEO ─────────────────────────────────────────────────────────────────────
// Drei Schreibungen nebeneinander: georgische Schrift (ბერიძე), nationale Umschrift (Kvaratskhelia)
// und Chat-Latein (Kvaracxelia: x=ხ kh, c=ც ts, w=წ ts, q=ქ k). Alles auf die nationale Umschrift.
const GEO_SCRIPT = { 'ა':'a','ბ':'b','გ':'g','დ':'d','ე':'e','ვ':'v','ზ':'z','თ':'t','ი':'i','კ':'k','ლ':'l','მ':'m','ნ':'n','ო':'o','პ':'p','ჟ':'zh','რ':'r','ს':'s','ტ':'t','უ':'u','ფ':'p','ქ':'k','ღ':'gh','ყ':'q','შ':'sh','ჩ':'ch','ც':'ts','ძ':'dz','წ':'ts','ჭ':'ch','ხ':'kh','ჯ':'j','ჰ':'h' };
function geoNorm(n) {
    if (/[Ⴀ-ჿ]/.test(n)) return cap([...n].map(ch => GEO_SCRIPT[ch] !== undefined ? GEO_SCRIPT[ch] : ch).join(''));
    n = n.replace(/^Alex/, 'Aleks');
    return n.replace(/x/g, 'kh').replace(/X/g, 'Kh').replace(/w/g, 'ts').replace(/W/g, 'Ts')
            .replace(/c(?!h)/g, 'ts').replace(/C(?!h)/g, 'Ts').replace(/q/g, 'k').replace(/Q/g, 'K');
}
// Kosenamen → Passform (Dato = Davit, Gio = Giorgi …); ohne das stünde "Dato Beridze" neben "Davit Beridze".
const GEO_RENAME = { Dato:'Davit', David:'Davit', Gio:'Giorgi', George:'Giorgi', Goga:'Giorgi', Zura:'Zurab', Avto:'Avtandil',
    Tengo:'Tengiz', Temo:'Temur', Temuri:'Temur', Beso:'Besarion', Lado:'Vladimer', Vano:'Ivane', Misha:'Mikheil',
    Levani:'Levan', Zviadi:'Zviad', Merabi:'Merab', Ramazi:'Ramaz', Nikusha:'Nika', Vakho:'Vakhtang', Soso:'Ioseb',
    Alex:'Aleksandre', Aleks:'Aleksandre', Aleksi:'Aleksandre', Alekso:'Aleksandre', Lekso:'Aleksandre', Aleksander:'Aleksandre', Aleksandr:'Aleksandre',
    Roma:'Roman', Gogi:'Giorgi', Geo:'Giorgi', Guga:'Giorgi', Gigi:'Giorgi', Gaga:'Giorgi', Gega:'Giorgi', Gegi:'Giorgi', Georgi:'Giorgi',
    Tazo:'Tamaz', Bachuki:'Bachana', Bacho:'Bachana', Bachi:'Bachana', Bacha:'Bachana', Kote:'Konstantine', Konstantin:'Konstantine',
    Misho:'Mikheil', Mishka:'Mikheil', Mishiko:'Mikheil', Mikho:'Mikheil', Mikhail:'Mikheil', Michael:'Mikheil',
    Achi:'Archil', Achiko:'Archil', Nodo:'Nodar', Nodiko:'Nodar', Zuka:'Zurab', Zuri:'Zurab', Zuriko:'Zurab',
    Shotiko:'Shota', Dito:'Davit', Dati:'Davit', Datuna:'Davit', Data:'Davit', Nugo:'Nugzar', Giviko:'Givi', Kako:'Kakha',
    Amiko:'Amiran', Otiko:'Otar', Mamu:'Mamuka', Vako:'Vakhtang', Vaso:'Vasil', Vasiko:'Vasil', Vaska:'Vasil', Vasili:'Vasil',
    Zaali:'Zaal', Iura:'Iuri', Ruslani:'Ruslan', Zauri:'Zaur', Omari:'Omar', Eldari:'Eldar', Joni:'Jondo', Gabriel:'Gabriel', Daniel:'Daniel' };
const geoKey = n => key(n).replace(/([^aeiou])i$/, '$1');
const geoPrefer = n => /[aeiou]$/.test(n) ? 0 : 1;
// Armenisch, russisch, türkisch-aserbaidschanisch, weiblich, Kosenamen ohne Passform, Müll
const GEO_FOREIGN_FIRST = /^(Armen|Artur|Karen|Ashot|Samvel|Aram|Arman|Suren|Levon|Ruben|Garik|Rafo|Arsen|Edgar|Gagik|Tigran|Vardan|Hovhannes|Mirza|Serkhan|Elkhan|Tseyhun|Ilkar|Elvar|Kheyal|Faik|Zamir|Ravil|Ramin|Ramini|Muradi|Murad|Ramo|Tsavid|Nitsat|Semur|Oruts|Tsingiz|Eltsin|Oleg|Olegi|Vova|Sergey|Sergei|Igor|Andrei|Vadim|Boris|Maksim|Vladimir|Sasha|Sashka|Grisha|Vitali|Denis|Lev|Anton|Martin|John|Robert|Roberti|Roland|Rolandi|Albert|Eduard|Erik|Romeo|Jimi|Tom|Simon|Karlo|Leo|Mari|Mariam|Nino|Natia|Ana|Ani|Nana|Nini|Keti|Lela|Maka|Lika|Shako|Rezi|Leri|Alika|Edo|Tato|Ako|Toko|Koka|Jeko|Juba|Rauli|Guka|Toka|Vato|Guro|Murka|Abo|Buba|Zvio|Pasa|Gari|Avejis|Sukho|Maradi|Gaukmda|Utsnobi|Gaukmebulia|Gauk|Gau|Georgia|Nitsk|Geno|Jano|Niko|Nik|Mate|Gizo|Iago|Ilo|Dachi|Jambuli|Jambul)$/;
const GEO_NOT_SURNAME = /^(Georgia|Sakartvelo|Tbilisi|Batumi|Kutaisi|Rustavi|Gori|Zugdidi|Poti|Ucnobi|Gaukmda|Gio|Giorgi|Nika|Nino|Mari|Mariami|Nini|Ana|Ani|Eka|Tamar|Tamari|Natia|Salome|Sopo|Davit|Levan|Irakli|Luka)$/;

// ── AZE ─────────────────────────────────────────────────────────────────────
// Nutzer-Entscheid 03.10.2026: offizielles Alphabet (Məmmədov, Əliyev, Hüseynov).
// Im Aggregat stehen vier Formen je Name: Chat-Latein ə→e (Memmedov 2251), russisch (Mamedov 883),
// Pass-Form ə→a (Mammadov 407), offiziell (Məmmədov 313). mkey legt sie auf ein Skelett zusammen,
// prefer zeigt die offizielle Form, finalize repariert die Fälle ohne offizielle Variante über Wortstämme.
function azeSkeleton(s) {
    s = s.toLowerCase().replace(/ə/g, 'e').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.replace(/dzh/g, 'c').replace(/kh/g, 'x').replace(/gh/g, 'g').replace(/zh/g, 'j').replace(/sh/g, 's')
            .replace(/ch/g, 'c').replace(/j/g, 'c').replace(/[qhx]/g, 'g').replace(/a/g, 'e').replace(/y/g, 'i')
            .replace(/k/g, 'g').replace(/([aeiou])iev$/, '$1ev').replace(/(.)\1+/g, '$1');   // Askerov=Əsgərov, Abdullaev=Abdullayev
}
const AZE_OFFICIAL = /[əƏüÜöÖıİşŞçÇğĞ]/;
const azePrefer = n => (AZE_OFFICIAL.test(n) ? 2 : 0) + (/(kh|sh|ch|zh|dzh|ts)/i.test(n) ? 0 : 1);
// Wortstämme für Namen, deren offizielle Form im Datensatz fehlt (Chat-Latein schreibt ə als e).
const AZE_ROOTS = [
    [/^Memmed|^Mammad|^Mamed/, 'Məmməd'], [/^Hesen|^Hasan|^Gasan/, 'Həsən'], [/^Huseyn|^Guseyn/, 'Hüseyn'],
    [/^Ehmed|^Ahmad/, 'Əhməd'], [/^Eli(?=[yzvlm])|^Ali(?=yev|zade)/, 'Əli'], [/^Kerim/, 'Kərim'], [/^Cefer|^Jafar|^Dzhafar/, 'Cəfər'],
    [/^Veli(?=[yl])/, 'Vəli'], [/^Rehim|^Ragim/, 'Rəhim'], [/^Xelil|^Khalil/, 'Xəlil'], [/^Sefer/, 'Səfər'], [/^Esger|^Asgar/, 'Əsgər'],
    [/^Rustem|^Rustam/, 'Rüstəm'], [/^Ismayil|^Ismail/, 'İsmayıl'], [/^Ibrahim/, 'İbrahim'], [/^Isa(?=yev)/, 'İsa'],
    [/^Qasim|^Gasim|^Kasum/, 'Qasım'], [/^Kazim/, 'Kazım'], [/^Sadiq|^Sadyg/, 'Sadıq'], [/^Tagi/, 'Tağı'], [/^Nagi/, 'Nağı'],
    [/^Agayev|^Aghayev/, 'Ağayev'], [/^Bagir/, 'Bağır'], [/^Haci|^Gadzhi/, 'Hacı'], [/^Meherrem|^Magerram/, 'Məhərrəm'],
    [/^Esed|^Asad/, 'Əsəd'], [/^Eziz|^Aziz(?=ov)/, 'Əziz'], [/^Elekber|^Alekper/, 'Ələkbər'], [/^Semed|^Samed/, 'Səməd'],
    [/^Nebi/, 'Nəbi'], [/^Mirze/, 'Mirzə'], [/^Necef|^Nadzhaf/, 'Nəcəf'], [/^Isgender|^Iskender/, 'İsgəndər'], [/^Iman(?=ov|li)/, 'İman'],
    [/^Emir(?=ov|li)/, 'Əmir'], [/^Asker|^Alesker/, m => m === 'Asker' ? 'Əsgər' : 'Ələsgər'], [/^Nezer/, 'Nəzər'], [/^Ferzeli/, 'Fərzəli'],
    [/^Serif/, 'Şərif'], [/^Mursel/, 'Mürsəl'], [/^Nifteli/, 'Niftəli'], [/^Mesim/, 'Məsim'], [/^Qedim/, 'Qədim'], [/^Hemze/, 'Həmzə'],
    [/^Qerib/, 'Qərib'], [/^Fetulla/, 'Fətulla'], [/^Mecid/, 'Məcid'], [/^Receb/, 'Rəcəb'], [/^Selim(?=ov|li)/, 'Səlim'],
    [/zade$/, 'zadə'], [/^Abbasov/, 'Abbasov'],
    // Vornamen (ganze Wörter)
    [/^Eli$/, 'Əli'], [/^Ferid$/, 'Fərid'], [/^Resad$/, 'Rəşad'], [/^Kenan$/, 'Kənan'], [/^Elsen$/, 'Elşən'], [/^Azer$/, 'Azər'],
    [/^Ilkin$/, 'İlkin'], [/^Ilqar$/, 'İlqar'], [/^Rovsen$/, 'Rövşən'], [/^Perviz$/, 'Pərviz'], [/^Sahin$/, 'Şahin'], [/^Ilham$/, 'İlham'],
    [/^Rufet$/, 'Rüfət'], [/^Elsad$/, 'Elşad'], [/^Xeyal$/, 'Xəyal'], [/^Senan$/, 'Sənan'], [/^Mehemmed$/, 'Məhəmməd'],
    [/^Behruz$/, 'Bəhruz'], [/^Sebuhi$/, 'Səbuhi'], [/^Ulvi$/, 'Ülvi'], [/^Vusal$/, 'Vüsal'], [/^Vuqar$/, 'Vüqar'], [/^Elcin$/, 'Elçin'],
    [/^Aydin$/, 'Aydın'], [/^Sahib$/, 'Sahib'], [/^Elnur$/, 'Elnur'], [/^Huseyn$/, 'Hüseyn'], [/^Hesen$/, 'Həsən'], [/^Taleh$/, 'Taleh'],
    [/^Elxan$/, 'Elxan'], [/^Mehman$/, 'Mehman'], [/^Ayxan$/, 'Ayxan'], [/^Rovshan$/, 'Rövşən'], [/^Orkhan$/, 'Orxan'], [/^Vugar$/, 'Vüqar']
];
// Offizielle Stämme aus dem Datensatz selbst: jede AZ-Zeile mit ə/ü/ö/ı/ş/ç/ğ liefert ihr Skelett → Form.
// Damit wird "Hebibov" zu "Həbibov", sobald irgendwo "Həbib" oder "Həbibov" belegt ist.
let _azeStems = null;
function azeStems() {
    if (_azeStems) return _azeStems;
    _azeStems = new Map();
    const dir = __dirname + '/';
    for (const file of ['w3_fore_agg.csv', 'w3_sur_agg.csv']) {
        for (const line of require('fs').readFileSync(dir + file, 'utf8').split('\n')) {
            const m = line.match(/^AZ,"(.*)",(\d+)$/);
            if (!m || !AZE_OFFICIAL.test(m[1]) || /[^A-Za-zəƏüÜöÖıİşŞçÇğĞ]/.test(m[1])) continue;
            const stem = m[1].replace(/(iyev|yev|ov|ev|li|lı|lu|lü|zadə)$/, '');
            if (stem.length < 3) continue;
            const k = azeSkeleton(stem), have = _azeStems.get(k);
            if (!have || have.c < +m[2]) _azeStems.set(k, { n: stem, c: +m[2] });
        }
    }
    return _azeStems;
}
const AZE_ROOTS_PREFIX = [
    [/^Mirze/, 'Mirzə'], [/^Ferhad/, 'Fərhad'], [/^Serxan/, 'Sərxan'], [/^Bextiyar/, 'Bəxtiyar'], [/^Pervin/, 'Pərvin'],
    [/^Babek/, 'Babək'], [/^Celal/, 'Cəlal'], [/^Ömer/, 'Ömər'], [/^Neriman/, 'Nəriman'], [/^Sefi(?=[yz])/, 'Səfi'],
    [/^Ehed/, 'Əhəd'], [/^Merdan/, 'Mərdan'], [/^Sireli/, 'Şirəli'], [/^Penah/, 'Pənah'], [/^Rehman/, 'Rəhman'],
    [/^Letif/, 'Lətif'], [/^Medet/, 'Mədət'], [/^Gozel/, 'Gözəl'], [/^Gul(?=[aeəm])/, 'Gül'], [/^Mensim/, 'Mənsim'],
    [/^Baxseli/, 'Baxşəli'], [/^Resul/, 'Rəsul'], [/^Bagir/, 'Bağır'], [/^Nagi/, 'Nağı'], [/^Hemid/, 'Həmid'],
    [/^Resid/, 'Rəşid'], [/^Elsever/, 'Elsevər'], [/^Efqan/, 'Əfqan'], [/^Xeqani/, 'Xaqani'], [/^Tebriz/, 'Təbriz'],
    [/^Sexavet/, 'Səxavət'], [/^Xeyyam/, 'Xəyyam'], [/^Ekber/, 'Əkbər'], [/^Heyder/, 'Heydər'], [/^Sehriyar/, 'Şəhriyar'],
    [/^Mezahir/, 'Məzahir'], [/^Cavansir/, 'Cavanşir'], [/^Hebib/, 'Həbib'], [/^Fexri/, 'Fəxri'], [/^Punhan/, 'Pünhan'],
    [/^Deyanet/, 'Dəyanət'], [/^Ferrux/, 'Fərrux'], [/^Evez/, 'Əvəz'], [/^Metleb/, 'Mətləb'], [/^Edalet/, 'Ədalət'],
    [/^Elesger/, 'Ələsgər'], [/^Esqin/, 'Əşqin'], [/^Qudret/, 'Qüdrət'], [/^Kerem/, 'Kərəm'], [/^Qismet/, 'Qismət'],
    [/^Xezer/, 'Xəzər'], [/^Sahmar/, 'Şahmar'], [/^Nesib/, 'Nəsib'], [/^Ugur/, 'Uğur'], [/^Umud/, 'Ümid'], [/^Nesimi/, 'Nəsimi'],
    [/^Musviq/, 'Müşviq'], [/^Musfiq/, 'Müşfiq'], [/^Fizuli/, 'Füzuli'], [/^Yalcin/, 'Yalçın'], [/^Tenha/, 'Tənha'], [/^Nemet/, 'Nemət']
];
function azeFinalize(n) {
    // immer sicher: Endung -zade, Anlaut Aga-/Sixi-/Dadas-, Stamm hesen im Kompositum
    n = n.replace(/zade$/, 'zadə').replace(/^Aga(?=[vlbsyc])/, 'Ağa').replace(/^Sixi/, 'Şıxı').replace(/^Dadas/, 'Dadaş').replace(/hesen/, 'həsən').replace(/memmed/, 'məmməd');
    // ASCII-Stämme am Wortanfang dürfen auch in teilweise offiziellen Namen greifen (Mirzezadə → Mirzəzadə)
    for (const [re, to] of AZE_ROOTS_PREFIX) if (re.test(n)) { n = n.replace(re, to); break; }
    if (AZE_OFFICIAL.test(n)) return n;
    const sm = /^(.*?)(iyev|yev|ov|ev|li|lı|lu|lü|zadə|zade)?$/.exec(n);
    const hit = sm[1].length >= 3 && azeStems().get(azeSkeleton(sm[1]));
    if (hit) return hit.n + (sm[2] || '');
    for (const [re, to] of AZE_ROOTS) if (re.test(n)) return n.replace(re, to);
    return n;
}

// ── TKM ─────────────────────────────────────────────────────────────────────
// Datensatz dünn (Serdar 156) und halb kyrillisch. Umschrift ins turkmenische Latein (в = w,
// ш = ş, ч = ç, ж = j, й = ý), russische Endung -ov → -ow (Atayev 46 + Atayew 55 = ein Name).
const TKM_CYR = { 'а':'a','б':'b','в':'w','г':'g','д':'d','е':'e','ё':'ýo','ж':'j','з':'z','и':'i','й':'ý','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'s','ч':'ç','ш':'ş','щ':'ş','ъ':'','ы':'y','ь':'','э':'e','ю':'ýu','я':'ýa' };
function tkmNorm(n) {
    if (/[Ѐ-ӿ]/.test(n)) n = cap([...n.toLowerCase()].map(ch => TKM_CYR[ch] !== undefined ? TKM_CYR[ch] : ch).join(''));
    return n.replace(/v/g, 'w').replace(/V/g, 'W').replace(/sh/g, 'ş').replace(/Sh/g, 'Ş').replace(/ch/g, 'ç').replace(/Ch/g, 'Ç')
            .replace(/^Kh/, 'H').replace(/kh/g, 'h').replace(/^Dj/, 'J').replace(/dj/g, 'j')
            .replace(/^Guse[ýy]n/, 'Hüseýn').replace(/^Gasan/, 'Hasan').replace(/Ibragim/, 'Ibrahim').replace(/^Gaji|^Gajy/, 'Hajy');
}
// Kurbanow/Gurbanow, Mamedow/Mammedow, Ataew/Atayew, Çaryyew/Çaryew = je ein Name
const tkmKey = n => key(n).replace(/^k/, 'g').replace(/(.)\1+/g, '$1').replace(/([aeiou])e(wa?)$/, '$1ye$2');
const tkmPrefer = n => (/^G/.test(n) ? 1 : 0) + (/[ýäöüňşçž]/.test(n) ? 1 : 0) + (/yy|ýe|aye|iye/.test(n) ? 1 : 0);
const TKM_RUSSIAN_FIRST = /^(Serge|Aleksan|Andre|Ewgen|Jewgen|Ýewgen|Wladim|Aleksej|Alekse|Dmitr|Igor|Oleg|Nikola|Pawel|Mihail|Iwan|Ýuri|Yuri|Wiktor|Konstan|Wasil|Anatol|Gennad|Walen|Roman$|Maksim$|Denis$|Artem|Artýom|Wadim|Wital|Stanislaw|Ýaroslaw|Ilýa$|Kirill|Mikhail|Pëtr|Pýotr|Boris$|Leonid|Grigor|Fýodor|Fedor|Artur$|Eldar$|Dima$|Anton$|Wlad|Mişa$|Ýura$|Alex$|Wýaçeslaw|Eduard$|Arsen$|Maks$|Nurik$|Dawid$|Marat$|Saşa$|Zaur$|Samir$)/;

// ── NGR ─────────────────────────────────────────────────────────────────────
// Drei Namenswelten nebeneinander: Hausa-Fulani (Norden, muslimisch; Nachname oft = Vatersname:
// Ahmed Musa, Shehu Abdullahi), Yoruba (Südwesten, christlich UND muslimisch), Igbo (Südosten),
// dazu Efik/Ibibio/Edo im Süden. Ohne Regionen entstünde "Chinedu Abubakar".
// Die Nachnamen-Spitze des Aggregats ist voller Vornamen (Ibrahim 58644, Emmanuel 42463, John 35222,
// Sunday 32682) → givenRatio + Konsonanten-Regel (englische Vornamen enden fast nie auf Vokal).
const NG_HAUSA = /^(Ibrahim|Abubakar|Abdullahi|Musa|Umar|Usman|Yusuf|Bello|Adamu|Aliyu|Lawal|Sani|Haruna|Yakubu|Garba|Idris|Mustapha|Suleiman|Sulaiman|Shehu|Yahaya|Isah?|Hassan|Aminu|Danjuma|Mohammed|Muhammad|Muhammed|Ahmad|Ahmed|Ali|Abdul\w*|Audu|Saleh|Sule|Bukar|Magaji|Yau|Sabo|Inuwa|Tanko|Bako|Sambo|Bawa|Imam|Yaro|Sale|Galadima|Waziri|Mamman|Sarki|Buba|Yunus|Ladan|Hussaini?|Yakub|Shuaib|Liman|Bature|Tahir|Ahmadu|Alkali|Madaki|Said|Abdu|Isyaku|Maina|Balarabe|Kano|Gana|Auta|Modu|Bulama|Goni|Wada|Badamasi|Danlami|Tanimu|Zubair|Hashim|Salisu|Saidu|Nuhu|Jibrin|Jibril|Dauda|Gambo|Kabir|Nasir|Bashir|Rabiu|Babangida|Mahmud|Abba|Alhassan|Abdulkadir|Abdulrahman|Lawan|Kyari|Mohammad|Saad|Saeed|Hamza|Habib|Ismail|Ishaq|Yusufu|Dahiru|Bala|Baba|Shuaibu|Salihu|Ayuba|Yunusa|Kaka|Malami|Jega|Babayo|Barde|Chiroma|Mukaila|Shitu|Makama|Khalifa|Sidi|Yakasai|Kawu|Amadu)$/;
const NG_IGBO = /(kw|nw|chukwu|^Nn|^Nw|^Ch[iu]|^Eze|^Ezi|^Ug|^Uch|^Ib[eo]|^Ihe|^Iwu|^Obi|^Ony|^Ndu|^Ok(afor|eke|oro|oye|onkwo|oli|olie|olo|orie|ereke|ere|ezie|oh|pala|para|eagu|ani|ocha|ike|ika|odili|udo|ey|euzu|wu)$|^Anya|^Anye|^Ozo|^Uzo|^Uzor|^Mba|^Mbah|^Nduka)|^(Kalu|Amadi|Njoku|Orji|Opara|Madu|Maduka|Dike|Duru|Uba|Ubah|Agu|Agwu|Egwu|Eke|Ekeh|Ike|Igwe|Ilo|Onu|Onah|Onoja|Onuh|Oji|Odo|Odoh|Ede|Edeh|Ene|Eneh|Ude|Udeh|Udoka|Ugwu|Umeh|Ume|Asogwa|Offor|Ojukwu|Azubuike|Alozie|Iheanacho|Ejiofor|Emenike|Anene|Aneke|Anozie|Ogbonna|Ogbonnaya|Ogbu|Ogbodo|Ogu|Ogah|Uchendu|Ukaegbu|Agbo|Agada|Idoko|Abah|Ameh|Attah|Ojo?ma|Odeh|Ozor|Ezugwu|Azuka|Adiele|Omeje|Ngene|Akpa)$/;
const NG_SOUTH = /^(Akpan|Bassey|Okon|Udoh|Udo|Udofia|Udom|Essien|Esien|Edet|Edem|Eff\w+|Etim|Etuk|Umoh|Umoren|Inyang|Asuquo|Ekanem|Ekpo|Ekpe|Ekpenyong|Ekong|Eyo|Archibong|Ukpong|Ukpe|Obot|Ita|Otu|Odey|Ogar|Osagie|Omoruyi|Odion|Igbinedion|Osayande|Edosomwan|Iyamu|Aigbe|Ossai|Efe|Oghene\w*|Ibanga|Akpabio|Antai|Offiong|Nsikak)$/;
// Christlicher Middle Belt und englisch-generisch: kein eindeutiger Regions-Partner → gesperrt
const NG_NOT_SURNAME = /^(Bulus|Ishaya|Yohanna|Pam|Gyang|Dung|Bitrus|Luka|Yusufu|George|Luke|Jude|Mike|Joe|Jesse|Grace|Dave|Steve|Eddie|Charlie|Rose|Prince|Nice|Gold|King|Kings|Best|Victory|Diamond|Bliss|Boss|Man|Jnr|Junior|Frosh|Babs|Ade|Ola|Engr|Itz|Lee|Jay|Kay|Tom|Jack|Noah|Lawrence|Love|Fortune|Ezekiel|Chuks|Igbo|Clement|Vincent|Stanley|Innocent|Augustine|Lucky)$/;
const ngLastBan = { test: n => NG_NOT_SURNAME.test(n) || (!/[aeiou]$/i.test(n) && !NG_HAUSA.test(n) && !NG_IGBO.test(n) && !NG_SOUTH.test(n)) };

const NG_PAN_ISLAMIC_FIRST = /^(Muhammad|Muhammed|Mohammed|Mohammad|Ibrahim|Yusuf|Umar|Ahmad|Ahmed|Ali|Hassan|Mustapha|Ismail|Abdulw*|Sulaiman|Suleiman|Hamza|Idris|Musa)$/;
const NG_HAUSA_FIRST = /^(Abba|Ismail|Abubakar|Abdullahi|Abdul\w*|Aliyu|Aminu|Sani|Adamu|Auwal\w*|Kabiru?|Haruna|Yahaya|Salisu|Nura|Bashir|Lawal|Bello|Idris|Umar|Usman|Musa|Yusuf|Ibrahim|Isah?|Yakubu|Sulaiman|Suleiman|Shehu|Rabiu|Nasiru?|Jamilu|Sadiq|Murtala|Mubarak|Hamza|Anas|Bala|Hussaini|Garba|Sanusi|Ibraheem|Abu|Shuaibu|Abbas|Babangida|Ayuba|Salihu|Saidu|Nuhu|Buhari|Muhd|Mukhtar|Dahiru|Lawan|Ishaq|Mahmud|Hamisu|Yunusa|Jibrin|Nafiu|Alhassan|Danjuma|Sunusi|Mohammad|Samaila|Mustapha|Ahmad|Ahmed|Hassan|Muhammad|Muhammed|Mohammed|Ali|Umaru|Usman|Habibu|Kabir|Bilyaminu|Zakari|Tijjani|Muazu|Hadi)$/;
const NG_YORUBA_FIRST = /^(Femi|Babatunde|Tunde|Segun|Kayode|Adewale|Adekunle|Kehinde|Adeyemi|Gbenga|Idowu|Ademola|Olawale|Adeniyi|Afolabi|Jimoh|Akeem|Olanrewaju|Ayodele|Olalekan|Kazeem|Kolawole|Wasiu|Olusegun|Olatunji|Opeyemi|Oluwafemi|Lukman|Oluwaseun|Olayinka|Adeleke|Abayomi|Temitope|Rasheed|Ayodeji|Jamiu|Olajide|Kunle|Lateef|Hammed|Owolabi|Nurudeen|Olufemi|Abdulazeez|Bamidele|Olamilekan|Tajudeen|Olumide|Wale|Fatai|Abiola|Seun|Akinola|Olamide|Bolaji|Oladele|Ayomide|Azeez|Saheed|Taiwo|Abiodun|Adebayo|Ayo|Dayo|Tope|Yemi|Sola|Bayo|Lekan|Ade\w+|Olu\w+|Ola\w+|Ayo\w+|Oluwa\w+|Akin\w+|Babaj\w+|Oyin\w+|Ibukun\w*|Toyin|Tobi|Damilola|Busayo|Sodiq|Ganiyu|Rilwan|Muritala|Ismaila|Adisa|Alabi)$/;
const NG_IGBO_FIRST = /^(Emeka|Chinedu|Ifeanyi|Uche\w*|Ikechukwu|Obinna|Chidi|Ugochukwu|Okechukwu|Nnamdi|Chukwudi|Chijioke|Kelechi|Chima|Chigozie|Ebuka|Chukwuemeka|Ikenna|Ndubuisi|Onyeka|Chibuike|Tochukwu|Chukwuma|Chinonso|Ekene|Ejike|Arinze|Chibuzo\w*|Nonso|Kenechukwu|Chidiebere|Chidera|Obiora|Uzoma|Chiemeka|Amaechi|Somtochukwu|Chinemerem|Chisom|Chukwuebuka|Ifeanyichukwu|Nnaemeka|Obumneme|Oluchukwu|Onyekachi|Onyebuchi|Izuchukwu|Kingsley|Chika|Chike|Chinweuba|Ozioma|Okwudili|Azubuike|Chukwunonso)$/;
const NG_SOUTH_FIRST = /^(Effiong|Etim|Edet|Ekpo|Okon|Bassey|Akpan|Nsikak|Ubong|Aniekan|Itoro|Idongesit|Emem|Imoh|Ime|Kufre|Mfon|Osagie|Osaze|Osas|Efosa|Ehis|Ese|Oghenekaro|Oghenetega|Ovie|Tega|Ejiro|Kesiena|Onome|Efe)$/;
// Kosenamen/Titel/Müll in der Vornamen-Spitze (Itz 13631, Engr = Ingenieur, Alhaji = Mekka-Pilger)
const WA_JUNK_FIRST = /^(Itz|Engr|Young|Don|Emma|Chris|Mike|Tony|Ben|Sam|Joe|Kenny|Steve|Fred|Alex|Sunny|Iyke|Chuks|Real|Brah|Bra|King|Ras|De|Kay|Jay|Rich|Richie|Danny|Dan|Andy|Kobby|Sammy|Paa|Papa|Mallam|Alhaji|Baba|Gh|Naa|Abu|Muhd|Dr|Pst|Pastor|Barr|Hon|Mr|Bro|Lil|Big|Mc|Dj|Jnr|Junior|Promise|Precious|Favour|Destiny|Blessing|Gift|Success|Godspower|Goodluck)$/;
const WA_RENAME = { Micheal:'Michael', Mathew:'Matthew', Austine:'Austin', Rapheal:'Raphael', Isreal:'Israel', Fredrick:'Frederick', Enock:'Enoch' };

// ── GHA ─────────────────────────────────────────────────────────────────────
// Akan/Ga/Ewe im Süden (Mensah, Owusu, Boateng; Wochentagsnamen Kofi/Kwame/Yaw), muslimischer Norden
// (Alhassan, Iddrisu, Fuseini). Viele Fante-Familien tragen englische Nachnamen seit dem 18. Jh.
// (Arthur, Hammond, Mills, Bruce, Aggrey) — die bleiben; englischer Rest und Spitznamen fliegen.
const GH_NORTH = /^(Mohammed|Muhammed|Mohamed|Muhammad|Ibrahim|Alhassan|Musah?|Yakubu|Seidu|Issah|Issaka|Salifu|Abdullah|Abdallah|Abdulai|Abdul\w*|Karim|Zakari|Zakaria|Suleman|Sulemana|Moro|Bukari|Abukari|Abubakari|Abubakar|Rahman|Gariba|Latif|Mahama|Iddrisu|Fuseini|Amadu|Osman|Mumuni|Haruna|Yahaya|Awudu|Sumaila|Shaibu|Inusah|Alidu|Tahiru|Adamu|Mustapha|Hamza|Rashid|Razak|Abass|Bashiru|Issahaku|Mahamadu|Yussif|Yusif|Wahab|Salam|Usman|Umar|Dauda|Sule|Awal|Aziz|Malik|Ali|Ahmed|Hassan|Maiga|Azumah|Adongo|Awuni|Dery|Ziblim|Mahami|Musa|Salim|Majid|Rufai|Ishaq|Hardi|Hamdia|Abdullai|Abdulrahman)$/;
const GH_NOT_SURNAME = /^(Gh|Ghana|Love|Junior|Jnr|Sam|Boy|Man|Bwoy|Kay|Gee|Bee|Dee|Pee|Boss|General|Reigns|Bills|Blinks|Gold|Stone|Wood|Black|White|Sterling|Carter|Nash|Parker|Coleman|Barnes|Lee|Taylor|Walker|Moore|Scott|Morgan|Jackson|Anderson|Wilson|Smith|Williams|Johnson|Brown|Thompson|Lawson|Benson|Daniels|Morrison|Hanson|Addison|Berry|Wan|Bae|Boat|Mens|Wale|Papabi|Nhyira|Sika|Dufie|Adoma|Pokua|Owusua|Ama|Serwaa|Serwaah|Real|Prince|King|Kwame|Kofi|Yaw|Kwaku|Kwabena|Kwadwo|Kwasi|Kojo|Kweku|Kwesi|Kobina|Nana|Papa|Paa|Lyrical|Kamara|Barry)$/;
// Akan-Frauennamen enden auf -waa/-maa/-iaa (Serwaa, Agyeiwaa, Boatemaa) — Amankwaa ist männlich
const ghFemale = { test: n => /(w|m|i|u)aah?$/.test(n) && !/^Amankwaa$/.test(n) };
const GH_NORTH_FIRST = new RegExp(GH_NORTH.source.replace(/\|Maiga\|Azumah\|Adongo\|Awuni\|Dery\|Ziblim\|Mahami/, ''));

// ── CFG-Einträge (Felder wie in build-names-v3.js) ──────────────────────────
const CFG = {
    ALB: { iso:'AL', cls:'small', preferDiacritic:true, givenRatio:1, banLast:[SHORT, ALB_PLACES], banFirst:[ALB_NICK_FIRST] },
    GEO: { iso:'GE', cls:'small', norm: geoNorm, rename: GEO_RENAME, mkey: geoKey, prefer: geoPrefer, givenRatio:1, foreignFirstIso:['AZ'],
           banLast:[SHORT, /^(?!.*[aeiou]$)/, /(ova|eva|ina|yeva)$/, GEO_NOT_SURNAME],
           banFirst:[/^(Dima|Maxo|Makho|Giga|Ika)$/, GEO_FOREIGN_FIRST] },
    AZE: { iso:'AZ', cls:'small', translit:true, norm: n => n.replace(/w/g, 'ş').replace(/W/g, 'Ş'), mkey: azeSkeleton, prefer: azePrefer, finalize: azeFinalize, givenRatio:1,
           banFirst:[/^(Prosta|Alik|Azik|Edik|Isi|Aga|Maqa|Roma|Niko|Miri|Baba|Qara|Arzu|Elton|Rafael|Roman|Ramo|Vova|Sasha)$/],
           banLast:[SHORT, /(ova|eva|yeva|iyeva|ovа)$/i, /^(Azerbaijan|Azerbaycan|Baku|Baki|Bakı|Gence|Gəncə|Sumqayit|Sumqayıt|Khan|Xan)$/i, /(kh|sh|ch|zh)/, /-/, /^(?!.*(ov|ev|li|lı|lu|lü|zadə|zade)$)/] },
    TKM: { iso:'TM', cls:'micro', norm: tkmNorm, mkey: tkmKey, prefer: tkmPrefer, givenRatio:1,
           banLast:[SHORT, /(owa|ewa|ýewa|ova|eva|ina)$/i, /^(Turkmen|Türkmen|Turkmenistan|Ashgabat|Aşgabat|Gul|Han|Soltan|Iwanow|Deniz)$/i, /(ýan|yan|ian)$/],
           rename:{ Murat:'Myrat', Murad:'Myrat' },
           banFirst:[TKM_RUSSIAN_FIRST] },
    NGR: { iso:'NG', cls:'mid', rename: WA_RENAME, givenRatio:1, surRatio:2.5,
           route:[[NG_SOUTH, 3], [NG_HAUSA, 1], [NG_IGBO, 2]],
           // Christliche Vornamen teilen sich Yoruba/Igbo/Süden; muslimische auch Yoruba (≈ die Hälfte der Yoruba ist muslimisch)
           routeFirst:[[NG_YORUBA_FIRST, 0], [NG_IGBO_FIRST, 2], [NG_SOUTH_FIRST, 3], [NG_PAN_ISLAMIC_FIRST, [1, 0], { 0: 0.2 }], [NG_HAUSA_FIRST, 1], [/./, [0, 2, 3]]],
           banLast:[SHORT, ngLastBan], banFirst:[WA_JUNK_FIRST] },
    GHA: { iso:'GH', cls:'mid', rename: WA_RENAME, givenRatio:1, surRatio:1.5,
           route:[[GH_NORTH, 1]], routeFirst:[[GH_NORTH_FIRST, 1]],
           banLast:[SHORT, GH_NOT_SURNAME, ghFemale], banFirst:[WA_JUNK_FIRST] }
};

// ── Pool-Skelette: kuratierter Kopf (Gewichte 1–5 → BUCKET bzw. echtes Datengewicht bei Treffer) ──
const POOLS = {
    ALB: { regions: [ { w:1,
        first: [['Ilir',5],['Arben',5],['Agim',4],['Gëzim',4],['Fatmir',4],['Bujar',3],['Sokol',3],['Artan',3],['Besnik',3],['Agron',3],['Edmond',2],['Petrit',2],['Kujtim',2],['Dritan',2]],
        last:  [] } ] },
    GEO: { regions: [ { w:1,
        first: [['Giorgi',5],['Davit',5],['Levan',4],['Irakli',4],['Zurab',4],['Nika',3],['Lasha',3],['Mamuka',3],['Gocha',2],['Zaza',2],['Shota',2],['Merab',2],['Tengiz',2],['Vakhtang',2]],
        last:  [] } ] },
    AZE: { regions: [ { w:1,
        first: [['Əli',5],['Elnur',4],['Orxan',4],['Tural',4],['Vüqar',4],['Rəşad',3],['Elçin',3],['Kənan',3],['Fərid',3],['Murad',3],['Ramin',3],['Cavid',2],['İlham',2],['Rövşən',2]],
        last:  [] } ] },
    TKM: { regions: [ { w:1,
        first: [['Serdar',5],['Merdan',4],['Arslan',4],['Maksat',4],['Batyr',3],['Myrat',3],['Azat',3],['Mekan',3],['Eziz',2],['Bayram',2],['Döwran',2],['Begenç',2],['Meýlis',2],['Döwlet',2]],
        last:  [] } ] },
    // Gewichte grob nach Bevölkerungsanteil (Hausa-Fulani ~30 %, Yoruba ~21 %, Igbo ~18 %, Süden ~10 %)
    // auf die drei bzw. vier Pools verteilt — Yoruba höher, weil r0 auch die gemischten Formen trägt.
    NGR: { regions: [
        { w:0.36, first: [['Oluwaseun',3],['Babatunde',3],['Olumide',3],['Adewale',3],['Segun',3],['Femi',3]], last: [] },
        { w:0.30, first: [['Abubakar',4],['Ibrahim',4],['Musa',3],['Aliyu',3],['Abdullahi',3],['Usman',3]],
          // Hausa-Patronyme sind echte Nachnamen (Ahmed Musa, Shehu Abdullahi) — kuratiert = immun gegen givenRatio
          last: [['Ibrahim',5],['Abubakar',5],['Abdullahi',4],['Musa',4],['Umar',4],['Usman',4],['Yusuf',4],['Bello',4],['Adamu',3],['Aliyu',3],['Lawal',3],['Sani',3],['Haruna',3],['Yakubu',3],['Garba',3],['Idris',3],['Mustapha',3],['Suleiman',3],['Shehu',3],['Yahaya',2],['Isah',2],['Hassan',2],['Aminu',2],['Mohammed',3],['Muhammad',3],['Ahmed',2],['Danjuma',2],['Dauda',2]] },
        { w:0.24, first: [['Chinedu',3],['Emeka',3],['Obinna',3],['Ikechukwu',3],['Nnamdi',3],['Chukwuemeka',2]], last: [] },
        { w:0.10, first: [['Effiong',2],['Etim',2],['Ubong',2],['Osagie',2]], last: [] }
    ] },
    GHA: { regions: [
        { w:0.80, first: [['Kofi',4],['Kwame',4],['Kwabena',3],['Kwaku',3],['Yaw',3],['Kwadwo',3],['Kwasi',3],['Kojo',2]], last: [] },
        { w:0.20, first: [['Alhassan',3],['Abdul',3],['Iddrisu',3],['Fuseini',2],['Mohammed',3],['Ibrahim',3]],
          last: [['Mohammed',5],['Ibrahim',4],['Alhassan',4],['Musah',3],['Yakubu',3],['Seidu',3],['Issah',3],['Salifu',3],['Iddrisu',3],['Fuseini',3],['Abubakari',2],['Mahama',2],['Abdulai',2],['Sulemana',2],['Haruna',2],['Osman',2],['Mumuni',2],['Yahaya',2],['Amadu',2]] }
    ] }
};

const OPS = {
    ALB: { drop: { last: ['Ana','Ela','Lila','Biba'] } },
    GHA: { drop: { last: ['Owusu Ansah','Osei Bonsu','Adu Gyamfi'] } }
};

module.exports = { CFG, POOLS, OPS };
