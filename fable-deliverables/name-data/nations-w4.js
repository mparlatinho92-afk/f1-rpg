// Namens-Pools Welle 4 (2026-10-03): HKG, MAC, TPE, SGP, KAZ, BAN.
// Vorher: HKG/MAC/TPE/SGP → CHN (Pinyin passt nicht: Chan/Wong statt Chen/Wang), KAZ → RUS, BAN → IND.
// Quelle: BigQuery-/Kaggle-Rohdaten, aggregiert mit
//   node aggregate-names.js <roh.csv> w4_*.csv M|F|ALL 600|1500 HK,TW,SG,MO,KZ,BD
// Eingebunden von build-names-v3.js (CFG / NEW_POOLS / OPS). Befunde: BEFUNDE.md 03.10.2026 (3).
// Nutzer-Entscheide 03.10.2026: chinesische Länder = Mischung englischer und chinesischer Vornamen
// (englische überwiegen wie im Datensatz); Kasachstan in Pass-Umschrift (Bauyrzhan, Akhmetov).
'use strict';

const fs = require('fs');
const GF = require('../paketJ-ethno-regionen/global-first-filters.js');
const key = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const SHORT = /^.{1,2}$/;
const ONE = /^.$/;   // chinesische Nachnamen sind oft zweibuchstabig (Ng, Ho, Li, Lo, Wu)

// ── Chinesisch (HKG/MAC/TPE/SGP) ────────────────────────────────────────────
// Eine romanisierte Silbe (Wade-Giles, kantonesisch, Hokkien, Pinyin): Anlaut + 1–3 Vokale + Auslaut.
// Trifft Chan, Wong, Hsieh, Cheung, Kwok, Chow — nicht Formosa, Putri, Smith.
const CN_SYL = /^(?:ts|tz|hs|ch|sh|zh|kw|gw|ng|ph|th|kh|[bpmfdtnlgkhjqxrzcsyw])?[aeiouy]{1,3}(?:ng|n|m|h|k|p|t|w)?$/i;
// Englische Kurznamen, die zufällig wie eine Silbe aussehen
const EN_SHORT = /^(Ken|Ben|Sam|Joe|Joey|Leo|Ray|Tim|Jay|Roy|Dan|Don|Tom|Jim|Ian|Ron|Sean|Guy|Ted|Jon|Lou|Kay|Jan)$/;
// Einzelsilben als Vorname sind im Datensatz Bruchstücke zweisilbiger Namen (Ming, Wai, Kit) oder
// Nachnamen im Vornamenfeld (Chan, Tan, Lim) → gesperrt. Zweisilbig wird zu "Ka-chun" (wie KOR "Min-jun").
const cnSingleFirst = { test: n => CN_SYL.test(n) && !EN_SHORT.test(n) };
function cnJoin(n) {
    const p = n.split(' ');
    if (p.length === 2 && p.every(x => CN_SYL.test(x))) return cap(p[0].toLowerCase()) + '-' + p[1].toLowerCase();
    return n;
}
const CN_NOT_SURNAME = /^(Nguyen|Nguyễn|Tran|Trần|Pham|Phạm|Le|Lê|Hoang|Vu|Phan|Dang|Bui|Ngo|Duong|Ly|Huynh|Vo|Cuong|Quyen|Hoan|Tho|Thanh|Minh|Tuan|Duc|Anh|Linh|Thi|Van|Nhu|Kyaw|Kim|Park|King|Queen|Cat|New|Dia|Tea|Won|Con|Jan|Sg|Hk|Mo|Tw|Wan Chai)$/;
const cnLastShape = { test: n => !CN_SYL.test(n) };   // Nachname muss EINE Silbe sein

// Taiwan: chinesische Vornamen stehen nur in Schriftzeichen im Datensatz → Wade-Giles wie im Reisepass
// (家豪 → Chia-hao). Nur die belegten Zeichen; unbekannte Zeichen = Name fällt weg (kein Raten).
const TW_WG = { '家':'chia','豪':'hao','俊':'chun','傑':'chieh','杰':'chieh','建':'chien','宏':'hung','志':'chih','明':'ming','偉':'wei',
    '冠':'kuan','廷':'ting','宇':'yu','宗':'tsung','翰':'han','強':'chiang','成':'cheng','彥':'yen','凱':'kai','文':'wen','柏':'po',
    '信':'hsin','彬':'pin','良':'liang','賢':'hsien','國':'kuo','華':'hua','哲':'che','銘':'ming','中':'chung','仁':'jen','翔':'hsiang',
    '龍':'lung','子':'tzu','德':'te','鴻':'hung','忠':'chung','輝':'hui','瑋':'wei','遠':'yuan','榮':'jung','憲':'hsien','博':'po',
    '承':'cheng','恩':'en','興':'hsing','祥':'hsiang','嘉':'chia','世':'shih','昌':'chang','霖':'lin','智':'chih','誠':'cheng','雄':'hsiung',
    '倫':'lun','正':'cheng','金':'chin','慶':'ching','毅':'yi','男':'nan','軒':'hsuan','維':'wei','育':'yu','政':'cheng','威':'wei',
    '昱':'yu','士':'shih','英':'ying','斌':'pin','勳':'hsun','鎮':'chen','安':'an','義':'yi','永':'yung','啟':'chi','達':'ta','耀':'yao',
    '秉':'ping','欽':'chin','立':'li','峰':'feng','瑞':'jui','睿':'jui','平':'ping','振':'chen','泰':'tai','清':'ching','源':'yuan','弘':'hung',
    '浩':'hao','翊':'yi','廣':'kuang','彰':'chang','佑':'yu','祐':'yu','昇':'sheng','聖':'sheng','勝':'sheng','健':'chien','峻':'chun',
    '駿':'chun','裕':'yu','銓':'chuan','泓':'hung','培':'pei','光':'kuang','亮':'liang','進':'chin','雲':'yun','鑫':'hsin','新':'hsin',
    '天':'tien','益':'yi','逸':'yi','奕':'yi','漢':'han','晉':'chin','佳':'chia','琦':'chi','祺':'chi','麒':'chi','賓':'pin','鵬':'peng',
    '晨':'chen','辰':'chen','宸':'chen','祖':'tsu','崇':'chung','敬':'ching','萬':'wan','坤':'kun','昆':'kun','錦':'chin','富':'fu',
    '福':'fu','順':'shun','茂':'mao','隆':'lung','盛':'sheng','武':'wu','煌':'huang','皓':'hao','程':'cheng','晟':'sheng','恆':'heng',
    '修':'hsiu','民':'min','昭':'chao','振':'chen','玉':'yu','山':'shan','川':'chuan','傳':'chuan','元':'yuan','銘':'ming','凡':'fan',
    '至':'chih','治':'chih','致':'chih','騰':'teng','宣':'hsuan','璋':'chang','緯':'wei','煒':'wei','郁':'yu','欣':'hsin','炫':'hsuan' };
// Umschriften englischer Namen (大衛 = David, 凱文 = Kevin, 傑克 = Jack) und Kosenamen (小明, 東東)
const TW_CHAR_DROP = /^(大衛|凱文|傑克|東東|小明|小宇|小寶|小龍|阿明|阿豪|安迪|麥克|彼得|約翰|湯姆|艾倫|史蒂芬)$/;
function twFirst(n, kind) {
    if (kind !== 'first') return n;
    if (/[一-鿿]/.test(n)) {
        const ch = [...n];
        if (ch.length !== 2 || TW_CHAR_DROP.test(n) || ch.some(c => !TW_WG[c])) return n;   // bleibt Schriftzeichen → fällt im Latin-Filter weg
        return cap(TW_WG[ch[0]]) + '-' + TW_WG[ch[1]];
    }
    return cnJoin(n);
}
const hkFirst = (n, kind) => kind === 'first' ? cnJoin(n) : n;
// Zweisilbige chinesische Vornamen sind im Datensatz unterbelegt (Social-Media-Quelle: dort steht der
// englische Rufname, der chinesische nur im Pass). Faktor auf die Zählung → Anteil ~25–35 % am Gewicht.
const CN_BOOST = f => [[/-/, f]];
// Wanderarbeiter in Taiwan (Indonesien) und Singapur (Bangladesch, Myanmar) — nicht die Bevölkerung
const MIGRANT_FIRST = /^(Rajib|Babul|Shohel|Raden|Nur|Alamgir|Abul|Abdur|Akash|Kabir|Sheikh|Fish|Putra|Mas|Agus|Budi|Eko|Joko|Dedi|Andi|Wahyu|Rizki|Aung|Kyaw|Zaw|Min Min|Htet|Myo|Thant|Phyo|Hein|Win|Soe|Sumon|Rubel|Saiful|Masud|Mamun|Monir|Shamim|Rasel|Sohel|Jahangir|Mizanur|Habibur|Sk|Md|Kamrul|Nazmul|Shahin|Rana|Hossain|Islam|Alamin|Sujon|Rony|Liton|Ripon|Jewel)$/;

// SGP: drei Bevölkerungsgruppen, Malaien und Inder ohne Familiennamen im europäischen Sinn
// (Vatersname als Nachname: Muhammad Hafiz Ismail → "Ismail", Suresh Kumar → "Kumar").
const SG_MALAY_LAST = /^(Ahmad|Ismail|Abdullah|Ibrahim|Hassan|Hussain|Hussein|Osman|Othman|Rahim|Rahman|Mohamed|Mohammed|Mohamad|Muhammad|Ali|Yusof|Yusoff|Salleh|Hamid|Rashid|Aziz|Karim|Jaafar|Idris|Omar|Hashim|Kassim|Kasim|Sulaiman|Zainal|Ariffin|Arifin|Mahmud|Mahmood|Hamzah|Ishak|Yaacob|Yaakob|Musa|Noor|Bakar|Rahmat|Saad|Said|Salim|Latif|Majid|Jamil|Johari|Zakaria|Daud|Haron|Harun|Sharif|Shariff|Ramli|Rosli|Razak|Samad|Yahya|Yunos|Yunus|Halim|Jalil|Kamal|Kamaruddin|Hakim|Taib|Amin|Ghani|Hamdan|Hanafi|Mansor|Mokhtar|Rauf|Sani|Tahir|Zulkifli|Azman|Rizal|Firdaus|Hafiz|Faizal|Azhar|Sabri|Shukor|Suhaimi|Talib|Wahab|Zainudin|Selamat|Sapari|Supaat|Jumaat|Bahari|Marican|Maricar|Abdul Rahman|Abu Bakar)$/;
const SG_INDIAN_LAST = /^(Kumar|Raj|Raja|Rajan|Rajah|Muthu|Murugan|Samy|Sami|Kannan|Ramesh|Suresh|Selvam|Krishnan|Nathan|Bala|Siva|Mani|Ravi|Ram|Rama|Raju|Pillai|Nair|Menon|Singh|Gill|Sandhu|Dhillon|Vel|Velu|Sekar|Saravanan|Pandi|Pandian|Babu|Ganesan|Ganesh|Prakash|Arumugam|Subramaniam|Subramanian|Rajendran|Ramasamy|Govindasamy|Naidu|Shanmugam|Chandran|Perumal|Kumaran|Rao|Iyer|Pandiyan|Kalai|Selvaraj|Rajoo|Ramu|Muniandy|Veerasamy|Palaniappan|Thangaraj|Kannu|Gopal|Anand|Mohan|Moorthy|Murthy)$/;
const SG_BURMESE_LAST = /^(Aung|Kyaw|Zaw|Win|Oo|Soe|Thu|Tun|Naing|Htet|Myint|Hlaing|Thant|Thein|Htun|Maung|Nyein|Phyo|Paing|Hein|Moe|Lwin|Khin|Thet|Zin|San|Lay|Myo|Tint|Swe|Htay|Wai|Yan)$/;
const SG_NOT_LAST = /^(Khan|Mia|Miah|Islam|Hossain|Uddin|Alam|Ahmed|Hasan|Begum|Akter|Chowdhury|Haque|Hoque|Kabir|Sarker|Mamun|Rana|Kaur|Das|Sharma|Gupta|Love|Singapore|Sg|John|King|Kim|Park|Lee Kuan)$/;
// Auffangroute für englische Vornamen (Chinesen + Inder) — darf KEINE Klassen-Namen (arabisch,
// südasiatisch …) treffen, sonst nimmt die globale Guard sie aus und "Abul Tan" entsteht in r0.
const SG_OTHER_FIRST = { test: n => !/-/.test(n) && !Object.values(GF.FIRST_CLASSES).some(re => re.test(n)) };
const SG_CHINESE_LAST = { test: n => CN_SYL.test(n) && !SG_BURMESE_LAST.test(n) && !CN_NOT_SURNAME.test(n) };
const sgLastBan = { test: n => SG_NOT_LAST.test(n) || SG_BURMESE_LAST.test(n) || (!SG_MALAY_LAST.test(n) && !SG_INDIAN_LAST.test(n) && !SG_CHINESE_LAST.test(n)) };
const SG_MALAY_FIRST = /^(Muhammad|Muhd|Mohd|Mohamad|Mohammad|Mohamed|Mohammed|Ahmad|Abdul\w*|Nur|Noor|Hafiz|Haziq|Syafiq|Syahmi|Faiz|Firdaus|Faizal|Fadzil|Azman|Azhar|Rizal|Zulkifli|Hakim|Iskandar|Ridzuan|Shahrul|Hairul|Khairul|Azlan|Hisham|Ismail|Zainal|Haikal|Danial|Irfan|Amirul|Aiman|Hazim|Afiq|Izzat|Luqman|Hilmi|Shafiq|Sufian|Rosli|Ramli|Rahmat|Sulaiman|Yusof|Hamzah|Faris|Amir|Ali|Hassan|Ibrahim|Osman|Rashid|Razak|Rahim|Salleh|Saiful|Fauzi|Hamid|Hanif|Jamal|Kamal|Rizwan|Shahril|Syed|Taufik|Zaki|Zul|Imran|Adam|Arif|Hafiz|Ikhwan|Nazri|Norman|Roslan|Safuan|Shahidan|Sharif|Suhaimi|Yazid|Zaini|Zainudin|Zulfadli|Zulhilmi|Fadli|Hadi|Ilham|Iqbal|Ridhwan|Ridwan|Taufiq|Aidil|Akmal|Asyraf|Azri|Fakhrul|Hakimi|Harith|Hazwan|Izwan|Khalid|Mazlan|Nasir|Rusli)$/;
const SG_INDIAN_FIRST = /^(Raja|Mani|Siva|Suresh|Bala|Kumar|Muthu|Ramesh|Raj|Senthil|Muru|Naga|Raman|Shanmugam|Chinna|Praba|Santhosh|Moorthy|Karthick|Mathi|Deva|Sundar|Mahesh|Balu|Gopal|Saravanan|Ravi|Vijay|Selva|Ram|Karthik|Kannan|Arun|Murugan|Rajesh|Palani|Raju|Selvam|Sathish|Mohan|Sakthi|Pandi|Arul|Prakash|Samy|Veera|Anbu|Ganesh|Vinoth|Rama|Sankar|Thiru|Ganesan|Anand|Krishna|Dinesh|Babu|Murugesan|Karthi|Gopal|Kumaran|Prem|Rajan|Vasu|Velu|Elango|Kalai|Mahesh|Naveen|Pradeep|Praveen|Raghu|Rajkumar|Ramu|Sanjay|Saran|Sekar|Shankar|Sundar|Surya|Thamil|Vikram|Vimal|Yogesh|Balu|Chandran|Devan|Gunasekaran|Jaya|Kathir|Manoj|Nathan|Partha|Ravindran|Sasi|Siva\w+|Subra\w*|Thanga\w*|Velmurugan|Venkat\w*|Harish|Hari|Jagan|Kishore|Logesh|Madhan|Nirmal|Prabhu|Rajiv|Rakesh|Sathiya|Senthil\w*|Sridhar|Sudhakar|Suren|Tamil\w*)$/;

// ── KAZ ─────────────────────────────────────────────────────────────────────
// Datensatz zu ~85 % kyrillisch. Pass-Umschrift (Nutzer-Entscheid): ж = zh, х = kh, ш = sh, й = i,
// anlautendes е = ye (Yerlan, Yerzhan); kasachische Sonderbuchstaben ә/ғ/қ/ң/ө/ұ/ү/һ/і auf die Grundform.
const KZ_CYR = { 'а':'a','ә':'a','б':'b','в':'v','г':'g','ғ':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'i','к':'k','қ':'k',
    'л':'l','м':'m','н':'n','ң':'ng','о':'o','ө':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ұ':'u','ү':'u','ф':'f','х':'kh','һ':'h',
    'ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','і':'i','ь':'','э':'e','ю':'yu','я':'ya' };
function kzTranslit(n) {
    n = n.toLowerCase().replace(/ий$/, 'и').replace(/ый$/, 'ы').replace(/^е/, 'йе').replace(/([аәеиоөуұүыіэюя])е/g, '$1йе');
    return cap([...n].map(c => KZ_CYR[c] !== undefined ? KZ_CYR[c] : c).join('').replace(/^i(?=e)/, 'y').replace(/([aeiouy])ie/g, '$1ye'));
}
// Russische Namen im russischen Pool-Stil (wie RUS rename): Yevgeni → Evgeni, Aleksandr → Alexander
const KZ_RENAME = { Aleksandr:'Alexander', Alexandr:'Alexander', Sergey:'Sergei', Aleksei:'Alexei', Aleksey:'Alexei', Alexey:'Alexei', Maksim:'Maxim',
    Yevgeni:'Evgeni', Evgeniy:'Evgeni', Evgeny:'Evgeni', Dmitriy:'Dmitri', Dmitry:'Dmitri', Yuriy:'Yuri', Yury:'Yuri', Andrey:'Andrei',
    Vitaliy:'Vitali', Vitaly:'Vitali', Nikolay:'Nikolai', Valeriy:'Valeri', Valery:'Valeri', Anatoliy:'Anatoli', Anatoly:'Anatoli',
    Gennadiy:'Gennadi', Vasiliy:'Vasili', Georgiy:'Georgi', Grigoriy:'Grigori', Yegor:'Egor', Artyom:'Artem', Baurzhan:'Bauyrzhan',
    Tsoy:'Tsoi', Choi:'Tsoi' };
function kzNorm(n, kind) {
    if (/[Ѐ-ӿ]/.test(n)) n = kzTranslit(n);
    // Frauenformen auf die Männerform zählen (Akhmetova → Akhmetov): sonst halbiert sich jeder Name
    if (kind === 'last') n = n.replace(/(ov|ev|in)a$/, '$1').replace(/(ova|eva)$/, m => m.slice(0, 2));
    return n;
}
const kzKey = n => key(n).replace(/^ye/, 'e').replace(/y/g, 'i').replace(/ii/g, 'i').replace(/aui(?=[^aeiou])/, 'au');
const KZ_RUS_FIRST = /^(Alexander|Sergei|Andrei|Vladimir|Evgeni|Alexei|Dmitri|Nikolai|Viktor|Igor|Ivan|Maxim|Oleg|Yuri|Vitali|Denis|Roman|Mikhail|Pavel|Anatoli|Vasili|Artem|Konstantin|Vadim|Valeri|Gennadi|Vyacheslav|Leonid|Anton|Kirill|Ilya|Stanislav|Valentin|Boris|Pyotr|Petr|Grigori|Fyodor|Yaroslav|Arkadi|Eduard|Georgi|Vladislav|Nikita|Egor|Daniil|Semyon|Timofei|Matvei|Lev|Gleb|Bogdan|Taras|Vitaliy|Mikhail|Aleksei|Danil|Evgeni|Ilia|Yakov|Efim|Emil|Robert|Erik|Alexandr)$/;
const KZ_SHARED_FIRST = /^(Ruslan|Timur|Artur|Marat|Rinat|Damir|Rustam|Eldar|Arsen|Renat|Ravil|Ilyas|Ilias)$/;
const KZ_JUNK_FIRST = /^(Valera|Serega|Seryoga|Stas|Yura|Rus|Dimash|Zhenya|Dima|Nurik|Sasha|Vova|Kz|Null|Baha|Bakha|Sanya|Zhenya|Kolya|Misha|Seryozha|Lesha|Tolik|Slava|Vitya|Edik|Alik|Aidosik|Azik|Erik[a-z])$/;
// Koreanische Minderheit (Koryo-saram) trägt russische Vornamen → Region 1 mit den Russen
const KZ_KOREAN = /^(Kim|Li|Pak|Tsoi|Ten|Kan|Tyan|Shin|Nam|Khvan|Ogai|Tskhai|Yugai|Pai|Ni|Tsai|Khegai|Khan Ir|Lim|Sim|Kogai|Yun)$/;
const KZ_UKR = /(enko|chuk|ko|uk|yuk)$/;
// Russische Nachnamen = im RU-Aggregat belegt, minus turksprachige/muslimische Stämme (Akhmetov, Aliev
// stehen dort auch, sind in Kasachstan aber kasachisch).
const KZ_MUSLIM_STEM = /^(Akhmet|Akhmed|Akhmad|Omar|Ali|Ibragim|Isa|Karim|Sultan|Yusup|Abdul|Abdrakh|Musa|Ismail|Rakhim|Rakhman|Sadyk|Kasym|Asan|Magomed|Gadzh|Gasan|Gusein|Mamed|Kurban|Rasul|Rashid|Nurgali|Sharip|Mukhamed|Murat|Bek|Vali|Khasan|Said|Safar|Nazar|Usman|Osman|Yunus|Sabir|Kadyr|Zakir|Umar|Amir|Akhat|Arslan|Kerim|Mirza|Mustaf|Tagir|Ramazan|Shamil|Ilyas|Idris|Iskander|Yakub|Davlet|Khalil|Salim|Aziz|Khamid|Gabdul|Galim|Nurul|Shakir|Tahir|Bakir|Iman|Ibra|Eset|Erlan|Serik|Kairat|Talgat|Kanat|Askar|Nurlan|Zhan|Bolat|Nur|Kalie|Iskak|Sulei|Ospan|Smagul|Zhuma|Tuleg|Abish|Mukan|Kusain|Aubakir|Zhunus|Sarsen|Utegen|Zhakup|Rakhmet|Zhusup|Mukash|Syzdyk|Serikbay|Ilyasov|Kasen|Musin|Sarsenbay|Ibrayev|Ibraev)/;
// Dieselbe Sperre auf dem Schlüssel (y → i): sonst trifft kasachisch Kasymov das russisch-tatarische Kasimov
const KZ_MUSLIM_KEY = /^(akhm|omar|ali|ibra|isa|isma|karim|sultan|iusu|abdu|abdr|musa|rakh|sadik|kasim|asan|magom|gadzh|gasan|gusein|mame|kurban|rasul|rashid|nurg|sharip|mukham|murat|bek|vali|khasan|said|safar|nazar|usman|osman|iunus|sabir|kadir|zakir|umar|amir|akhat|arslan|kerim|mirz|mustaf|tagir|ramaz|shamil|ilias|idris|iskand|iakub|davlet|khalil|salim|aziz|khamid|gabd|galim|gali|nurul|shakir|takhir|bakir|iman|eset|kair|talg|kanat|askar|nurlan|zhan|bolat|nur|kali|iskak|sulei|ospan|smag|zhuma|tuleg|abish|mukan|kusain|khusain|aubak|zhunus|sarsen|uteg|zhakup|zhusup|mukash|sizdik|kasen|musin|iuldash|malik|kamal|nabi|tursun|islam|akim|makhm|khair|mansur|sharaf|fazl|khabib|gaini|garip|sagit|faiz|ismag|karam|alim|raim|ergash|tokhtar|abil|abdi|niiaz|tair|sabit|iakup|baim|baik|khak|abdur|shakh|khodzh|kholmat|rakhmon|saidov|sobir|tashk|iuldosh|valiev|mamad|mukhit|nasir|nasib|rafik|rauf|razak|samat|sarim|shaim|shaik|zairov|zhalil|zhumag)/;
let _kzRu = null;
function kzRussian() {
    if (_kzRu) return _kzRu;
    _kzRu = new Set();
    for (const line of fs.readFileSync(__dirname + '/sur_agg.csv', 'utf8').split('\n')) {
        const m = line.match(/^RU,"(.*)",\d+$/);
        if (!m) continue;
        const n = kzNorm(m[1].trim(), 'last');
        if (KZ_MUSLIM_STEM.test(n) || KZ_MUSLIM_KEY.test(kzKey(n)) || /(ullin|ulin|din|zade)$/.test(n)) continue;
        _kzRu.add(kzKey(n));
    }
    return _kzRu;
}
const kzRussianLast = { test: n => KZ_UKR.test(n) || kzRussian().has(kzKey(n)) };
const KZ_NOT_SURNAME = /^(Kz|Kaz|Astana|Almaty|Kazakhstan|Qazaqstan|Null|Zh|Zhan|Khan|Bek|Nur|Ali|Aman|Bakha|Baha|Shymkent|Karaganda|Aktobe|Pavlodar|Taraz|Miller|Shmidt|Schmidt)$/;

// ── BAN ─────────────────────────────────────────────────────────────────────
// Muslimische Mehrheit (~91 %), Hindu-Minderheit (~8 %: Das, Roy, Saha). "Md" ist die übliche
// Abkürzung von Mohammad vor dem eigentlichen Namen (Md Rasel) → Präfix weg, sonst hieße jeder dritte
// Fahrer Mohammad. Bengalische Schrift fällt im Latin-Filter weg.
function bdNorm(n, kind) {
    if (kind !== 'first') return n.replace(/^Chy$/, 'Chowdhury');
    n = n.replace(/^(Md\.?|Mohammad|Mohammed|Muhammad|Mohd|Sk|Sheikh|Syed|Kazi|Engr|Mst|Mir|S M|A K M|Abu) (?=[A-Z])/, '');
    return n.replace(/^Al (?=[A-Z])/, 'Al-');
}
const BD_JUNK_FIRST = /^(Md|Sk|Kazi|Syed|Al|Mh|Hm|Ar|Ak|Sa|Ab|Ma|Sh|Rs|Rk|Ah|Cr|Rj|Engr|Prince|Mst|Abu|Abdul|Abdus|Abdur|Abul|Mir|Gazi|Sheikh|Shah|Nil|Mohammod|Mohd|Muhd|Mr|Dr|Islam|Khan|Hossain|Ahmed|Chowdhury|Rahman|Alam|Akter|Uddin|Miah|Sarker|Das|Roy|.*\s.*)$/;
const BD_HINDU_FIRST = /^(Uttam|Sanjoy|Sanjay|Prodip|Pradip|Ratan|Bijoy|Tapan|Subrata|Prosenjit|Bikash|Sajal|Gobinda|Sukanta|Partha|Debashish|Debasish|Dipankar|Pranab|Shuvankar|Sourav|Amit|Rahul|Liton|Litton|Utpal|Nitai|Swapan|Shyamal|Ashim|Kanai|Nikhil|Tushar|Mithun|Shanto|Rajib|Rajesh|Ramesh|Dipu|Dip|Pintu|Bappa|Biplob|Bishwajit|Biswajit|Arup|Tanmoy|Tonmoy|Pritom|Pranto|Shuvro|Sumit|Sujit|Ajoy|Ashok|Dilip|Gautam|Gopal|Haradhan|Jibon|Kajol|Kamal Das|Krishna|Mrinal|Narayan|Nirmal|Nitish|Pankaj|Pijush|Pinaki|Prabir|Prasanta|Prosanto|Rakesh|Ranjit|Robin Das|Samir Das|Sanjib|Santosh|Shankar|Shyam|Sudip|Sujan|Sukumar|Sunil|Surajit|Suvo|Tarun|Tirtha|Ujjal|Uzzal|Avijit|Abhijit|Anup|Anupam|Apurba|Arijit|Badal|Bimal|Chandan|Debu|Dulal|Goutam|Hiron|Joydeb|Kartik|Kishore|Monoj|Nayan|Palash|Polash|Pradeep|Proshanto|Raju Das|Sagar|Shubho|Sobuj|Subir|Supan|Tapas)$/;
const BD_SHARED_FIRST = /^(Joy|Shuvo|Rony|Ripon|Sumon|Suman|Raju|Babu|Robin|Akash|Sagor|Anik|Tuhin|Bappy|Jewel|Milon|Shimul|Noyon|Rana|Sohag|Shohag|Jony|Tutul|Munna|Manik|Ratul)$/;
const BD_HINDU_LAST = /^(Das|Roy|Saha|Paul|Pal|Dey|De|Ghosh|Barua|Chakraborty|Chakrabarty|Dutta|Datta|Sen|Kar|Bhattacharjee|Bhattacharya|Nath|Debnath|Shil|Sil|Mitra|Banik|Kundu|Halder|Sutradhar|Podder|Poddar|Bose|Basak|Karmakar|Pramanik|Sarma|Acharjee|Rudra|Dhar|Guha|Malakar|Biswas|Mazumder|Majumder|Kumar|Chakma|Tripura|Marma)$/;
const BD_SHARED_LAST = /^(Sarker|Sarkar|Mondal|Mandal|Chowdhury|Talukder|Mollick|Mallick|Bepari|Howlader|Hawlader|Munshi)$/;
const BD_FEMALE_LAST = /^(Akter|Aktar|Akther|Akhter|Akhtar|Begum|Sultana|Jahan|Jannat|Moni|Mim|Khatun|Nahar|Parvin|Parveen|Yasmin|Ferdousi|Ara|Banu|Rani|Bibi|Khanam|Nesa|Nessa|Nisa|Lata|Shirin|Nasrin|Rumi|Priya|Tisha|Mitu|Tania|Shila|Lima|Sumi|Riya|Pakhi|Shathi|Bristy|Brishti|Nodi|Puja)$/;
// Rufnamen (daknam) im Nachnamenfeld — givenRatio fängt sie nicht, weil dort meist "Md Sumon" steht
const BD_NICK_LAST = /^(Rabby|Dipu|Rayhan|Raihan|Sohag|Shohag|Sohan|Sumon|Suman|Akash|Rasel|Joy|Rubel|Emon|Rony|Shuvo|Rakib|Raju|Hridoy|Ridoy|Babu|Sohel|Shipon|Apu|Liza|Jui|Tanha|Sathi|Afroz|Sifat|Shaon|Sagor|Ripon|Liton|Jony|Munna|Bappy|Tuhin|Shanto|Milon|Polash|Palash|Rocky|Sakib|Tamim|Siam|Nayan|Noyon|Sabbir|Shakil|Rifat|Fahim|Arif|Masum|Tanvir|Imran|Shamim|Jewel|Sujon|Sojib|Sajib|Robin|Rahul|Mithun|Anik|Abir|Ovi|Riyad|Rabbi|Shawon|Rajib|Biplob)$/;
const BD_NOT_SURNAME = /^(Mon|Bd|Bangladesh|Dhaka|Chittagong|Sylhet|Love|Boy|Pagol|Raj|Kumar Das|Md|Mia|Mohammad|Mohammed|Muhammad|Prince|King|Hero|Bhai|Vai|Khan Bd|Sk|Sheikh|Syed|Kazi|Al|Abdullah Al)$/;

// ── CFG-Einträge (Felder wie in build-names-v3.js) ──────────────────────────
const CFG = {
    HKG: { iso:'HK', cls:'small', norm: hkFirst, givenRatio:1, surRatio:3, dampFirst: CN_BOOST(4),
           banLast:[ONE, cnLastShape, CN_NOT_SURNAME], banFirst:[cnSingleFirst, MIGRANT_FIRST] },
    MAC: { iso:'MO', cls:'tiny', norm: hkFirst, givenRatio:1, surRatio:3, dampFirst: CN_BOOST(7),
           banLast:[ONE, cnLastShape, CN_NOT_SURNAME], banFirst:[cnSingleFirst, MIGRANT_FIRST] },
    TPE: { iso:'TW', cls:'small', norm: twFirst, givenRatio:1, surRatio:3, dampFirst: CN_BOOST(3),
           banLast:[ONE, cnLastShape, CN_NOT_SURNAME, /^(Formosa|Taiwan|Taipei)$/], banFirst:[cnSingleFirst, MIGRANT_FIRST] },
    SGP: { iso:'SG', cls:'mid', norm: hkFirst, givenRatio:1, surRatio:3,
           rename:{ Muhd:'Muhammad', Mohd:'Muhammad', Mohamad:'Muhammad' },
           route:[[SG_MALAY_LAST, 1], [SG_INDIAN_LAST, 2]],
           // Englische Vornamen tragen Chinesen UND (seltener) Inder
           routeFirst:[[SG_MALAY_FIRST, 1], [SG_INDIAN_FIRST, 2], [/-/, 0], [SG_OTHER_FIRST, [0, 2], { 2: 0.15 }]],
           dampFirst:[[/^(Muhammad|Mohamed|Mohammad|Mohammed)$/, 0.5]],
           banLast:[ONE, sgLastBan], banFirst:[cnSingleFirst, MIGRANT_FIRST, /^(Abdul|Syed|Sheikh|Md)$/] },
    KAZ: { iso:'KZ', cls:'small', norm: kzNorm, rename: KZ_RENAME, mkey: kzKey, givenRatio:1,
           route:[[KZ_KOREAN, 1], [kzRussianLast, 1]],
           routeFirst:[[KZ_RUS_FIRST, 1], [KZ_SHARED_FIRST, [0, 1], { 1: 0.35 }]],
           banLast:[/^.{1,1}$/, KZ_NOT_SURNAME, /(kyzy|qyzy|ovna|evna|ovich|evich)$/i, /-/], banFirst:[KZ_JUNK_FIRST, /-/] },
    BAN: { iso:'BD', cls:'small', norm: bdNorm, givenRatio:1,
           rename:{ Mohammod:'Mohammad', Hossen:'Hossain', Hossin:'Hossain', Hossan:'Hossain', Hosen:'Hossain', Alom:'Alam', Ahamed:'Ahmed', Rahaman:'Rahman', Mahamud:'Mahmud', Ahammed:'Ahmed', Ahmod:'Ahmed', Ahamad:'Ahmed', Miha:'Miah', Mia:'Miah' },
           dampFirst:[[/^(Mohammad|Mohammed|Muhammad)$/, 0.15]],
           route:[[BD_HINDU_LAST, 1], [BD_SHARED_LAST, [0, 1], { 1: 0.4 }]],
           routeFirst:[[BD_HINDU_FIRST, 1], [BD_SHARED_FIRST, [0, 1], { 1: 0.4 }]],
           banLast:[SHORT, BD_FEMALE_LAST, BD_NICK_LAST, BD_NOT_SURNAME, /\s/], banFirst:[BD_JUNK_FIRST] }
};

// ── Pool-Skelette: kuratierter Kopf (Gewichte 1–5 → BUCKET bzw. echtes Datengewicht bei Treffer) ──
const POOLS = {
    HKG: { regions: [ { w:1,
        first: [['Ka-chun',4],['Chi-wai',4],['Wai-man',3],['Chi-keung',3],['Kwok-wai',3],['Ka-ho',3],['Chun-kit',3],['Ho-yin',2],['Tai-man',2],['Kam-hung',2]],
        last:  [] } ] },
    MAC: { regions: [ { w:1,
        first: [['Ka-hou',4],['Ka-chon',3],['Chi-hou',3],['Chi-kin',3],['Chon-kit',3],['Chi-keong',2],['Wai-hong',2],['Ka-seng',2],['Chi-meng',2],['Wai-kit',2]],
        last:  [] } ] },
    TPE: { regions: [ { w:1,
        first: [['Chia-hao',4],['Chun-chieh',4],['Chien-hung',3],['Chih-hao',3],['Chih-ming',3],['Chih-wei',3],['Kuan-ting',3],['Kuan-yu',3],['Tsung-han',2],['Cheng-han',2]],
        last:  [] } ] },
    // SGP: chinesische Vornamen sind im Datensatz NICHT belegt (nur englische) → kuratierter Kopf, Hokkien/Teochew-Umschrift.
    // Gewichte 5/4 (= 90/45): sonst gehen 30 kuratierte Namen unter ~180 Datennamen auf 9 % Anteil unter (gemessen).
    SGP: { regions: [
        { w:0.74,
          first: [['Wei-ming',5],['Jun-jie',5],['Wei-jie',5],['Zhi-hao',5],['Kok-leong',5],['Chee-keong',5],['Boon-huat',5],['Teck-seng',5],['Wee-kiat',5],['Kian-wee',5],
                  ['Guo-liang',5],['Jian-hong',5],['Yong-sheng',5],['Kah-wai',5],['Choon-hock',5],['Beng-hock',5],['Kim-seng',5],['Swee-heng',5],['Hong-wei',5],['Jia-hao',5],
                  ['Zhi-wei',4],['Kai-xiang',4],['Jun-wei',4],['Wen-jie',4],['Chee-meng',4],['Kok-wah',4],['Ah-seng',4],['Boon-keng',4],['Eng-soon',4],['Chin-wee',4]],
          last:  [] },
        { w:0.14,
          first: [['Muhammad',4],['Ahmad',3],['Hafiz',3],['Firdaus',3],['Faizal',3],['Azman',2],['Rizal',2],['Iskandar',2],['Syafiq',2],['Haziq',2],['Khairul',2],['Zulkifli',2]],
          last:  [['Ismail',4],['Ahmad',4],['Abdullah',3],['Ibrahim',3],['Osman',3],['Rahim',3],['Salleh',2],['Yusof',2],['Hassan',2],['Hamid',2],['Jaafar',2],['Rahman',2]] },
        { w:0.12,
          first: [['Suresh',3],['Ramesh',3],['Rajesh',3],['Kumar',3],['Arun',2],['Vijay',2],['Ravi',2],['Senthil',2],['Saravanan',2],['Ganesh',2],['Prakash',2],['Karthik',2]],
          last:  [['Kumar',4],['Raj',3],['Krishnan',3],['Pillai',2],['Nair',2],['Singh',3],['Subramaniam',2],['Rajendran',2],['Chandran',2],['Ramasamy',2]] }
    ] },
    // Kasachen ~70 %, Russen/Ukrainer/Koreaner/Deutsche ~30 % (Volkszählung 2021: Kasachen 70,4 %, Russen 15,5 %)
    KAZ: { regions: [
        { w:0.72,
          first: [['Nurlan',4],['Yerlan',4],['Azamat',4],['Serik',4],['Kairat',3],['Talgat',3],['Yerzhan',3],['Bauyrzhan',3],['Kanat',3],['Daniyar',3],['Nursultan',2],['Askar',2]],
          last:  [] },
        { w:0.28,
          first: [['Alexander',4],['Sergei',4],['Andrei',3],['Vladimir',3],['Evgeni',3],['Dmitri',3],['Alexei',2],['Nikolai',2],['Viktor',2],['Igor',2]],
          last:  [['Kim',3],['Li',3],['Pak',3],['Tsoi',2],['Ten',2],['Kan',1],['Tyan',1],['Shin',1],['Nam',1]] }
    ] },
    BAN: { regions: [
        { w:0.9,
          first: [['Tamim',3],['Shakib',3],['Mushfiqur',3],['Mahmudullah',2],['Mominul',2],['Taskin',2],['Mustafizur',2],['Mehedi',3],['Nazmul',3],['Saiful',3],['Ariful',2],['Rafiqul',2]],
          // echte Nachnamen, die GIVEN_AS_SURNAME (global) sonst sperrt — Ahmed ist Rang 2 — kuratiert = filterimmun
          last:  [['Ahmed',5],['Ali',3],['Hassan',2],['Karim',2],['Kamal',2]] },
        { w:0.1,
          first: [['Sanjoy',3],['Subrata',3],['Dipankar',2],['Prosenjit',2],['Partha',2],['Sourav',2],['Liton',2],['Bikash',2],['Tapan',2],['Uttam',2]],
          last:  [['Das',4],['Roy',4],['Saha',3],['Biswas',3],['Paul',3],['Dey',2],['Ghosh',2],['Barua',2],['Chakraborty',2],['Dutta',2],['Sen',2],['Debnath',2]] }
    ] }
};

const OPS = {};

module.exports = { CFG, POOLS, OPS };
