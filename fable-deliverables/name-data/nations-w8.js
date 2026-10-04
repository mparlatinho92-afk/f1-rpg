// Namens-Pools Welle 8 (2026-10-04): KGZ, UZB, TJK, ARM, BIH, MKD, MNE, VIE. Vorher alle auf INT (12 Namen).
// Keines der acht Länder steht im Kaggle-Datensatz → Quelle worldnames.xyz (wie ROU, 02.10.2026):
//   node w8-quellen/worldnames-scrape2.js https://worldnames.xyz/most-common-names-in-<land>/male/ 30 w8-quellen/worldnames-<x>-fore.tsv
//   node w8-quellen/worldnames-scrape2.js https://worldnames.xyz/most-common-surnames-in-<land>/   30 w8-quellen/worldnames-<x>-sur.tsv
//   (Bosnien heißt dort "bosnia"; www.worldnames.xyz antwortet nicht, nur ohne www)
// Geschlecht: node gender-ref.js w8_gender_ref.csv RU,UA,TR,AZ,KZ,RS,HR,SI,BG,AL,GE,US,GB,FR w8-quellen/*-fore.tsv
// Gewichte wie überall: w = round(100 · (Träger/max)^0.6) je Region. Kein Daten-Merge im Build (fertige Pools wie ROU).
// Russische Minderheiten (KGZ r1, UZB r1) = RUS-Pool, im Build nach processNation kopiert (Nutzer-Regel wie GER r1 = TUR).
// Befunde: BEFUNDE.md 04.10.2026 (4). Rohnamen nie ausgeben (API-Inhaltsfilter).
'use strict';

const fs = require('fs');
const key = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const DIR = __dirname + '/w8-quellen/';
const read = f => fs.readFileSync(DIR + f, 'utf8').split('\n').filter(Boolean).map(l => l.split('\t')).map(p => ({ name: p[1].trim(), c: +p[2], alt: (p[3] || '').trim() }));

let _ref = null;
function maleOk(n) {
    if (!_ref) {
        _ref = new Map();
        for (const l of fs.readFileSync(__dirname + '/w8_gender_ref.csv', 'utf8').split('\n').slice(1)) {
            const m = l.match(/^"(.*)",(\d+),(\d+)$/); if (m) _ref.set(m[1], [+m[2], +m[3]]);
        }
    }
    const r = _ref.get(key(n));
    return !r || r[1] <= r[0];   // unbekannt = Quelle sagt „male" → behalten; nur überwiegend weibliche Belege fliegen
}
const weigh = list => {
    const max = Math.max(...list.map(e => e.c));
    return list.map(e => [e.name, Math.max(1, Math.round(100 * Math.pow(e.c / max, 0.6)))]);
};
// Zusammenführen gleicher Namen (z. B. nach Faltung weiblich → männlich)
const merge = list => {
    const m = new Map();
    for (const e of list) { const k = key(e.name); const h = m.get(k); if (h) h.c += e.c; else m.set(k, { ...e }); }
    return [...m.values()].sort((a, b) => b.c - a.c);
};

// Russische Vornamen (inkl. der verballhornten Umschriften Alyeksandr/Syergyei/Andryei der UZB-Liste) → RUS-Region
const RUS_FIRST = /^(Aleksandr|Alexander|Alyeksandr|Sergey|Sergei|Syergyei|Vladimir|Nikolay|Nikolai|Viktor|Andrey|Andrei|Andryei|Anatoliy|Yuriy|Yurii|Aleksey|Alexei|Evgeniy|Yevgeniy|Dmitriy|Dmitry|Igor|Oleg|Ivan|Mikhail|Pavel|Vasiliy|Gennadiy|Valeriy|Vitaliy|Konstantin|Boris|Maksim|Roman|Denis|Artem|Artyom|Vadim|Vyacheslav|Leonid|Yuri|Petr|Pyotr|Grigoriy|Stanislav|Valentin|Eduard|Fedor|Fyodor|Georgiy|Ilya|Kirill|Mikhail|Yaroslav|Arkadiy|Semen|Semyon|Egor|Yegor|Nikita|Anton|Valery|Vitaly|Gennady|Anatoly|Evgeny|Alexey)$/;

// ── Zentralasien: KGZ / UZB / TJK ─────────────────────────────────────────────
// Nachnamen stehen bei worldnames in der WEIBLICHEN Form (Ismailova); die Zweitform ist die männliche.
function centralAsia(tag, opts) {
    const fore = read(`worldnames-${tag}-fore.tsv`)
        .filter(e => !RUS_FIRST.test(e.name) && !opts.banFirst.test(e.name) && maleOk(e.name));
    const sur = merge(read(`worldnames-${tag}-sur.tsv`).map(e => {
        let n = e.name;
        if (/(ova|eva)$/.test(n)) n = (e.alt && /(ov|ev)$/.test(e.alt)) ? e.alt : n.slice(0, -1);
        n = n.replace(/([bcdfghjklmnpqrstvwxz])ye/g, '$1e');    // Umschrift-Artefakt Akhmyedov → Akhmedov
        return { ...e, name: n };
    }).filter(e => !opts.banLast.test(e.name)));
    return { first: weigh(merge(fore.map(e => ({ ...e, name: e.name.replace(/([bcdfghjklmnpqrstvwxz])ye/g, '$1e') })))), last: weigh(sur) };
}
const KGZ = centralAsia('kgz', { banFirst: /^(Uulu|Kyzy|Bakha)$/, banLast: /^(Kim|Taalaybek|Li|Pak|Tsoy)$/ });
const UZB = centralAsia('uzb', { banFirst: /^(Uulu|Kyzy)$/, banLast: /^(Kim|Li|Pak|Tsoy)$/ });
const TJK = centralAsia('tjk', { banFirst: /^(Bakha|Uulu|Kyzy)$/, banLast: /^(Kim)$/ });

// ── ARM ─────────────────────────────────────────────────────────────────────
// Sauber (Grigoryan/Sargsyan-Kopf, -yan unisex). Frauennamen in der Männerliste über die Referenz + Liste.
const ARM_FEMALE = /^(Alvard|Nune|Anahit|Gayane|Lusine|Karine|Ani|Mariam|Hasmik|Armine|Narine|Susanna|Anna|Marine|Tatevik|Lilit|Gohar|Ruzanna|Siranush|Astghik|Arpine|Mane|Hripsime|Seda|Zara|Margarita|Svetlana|Kristine|Elen|Nelli|Ruzan|Varduhi|Anush|Liana|Diana|Milena|Sona|Nara|Emma|Satenik|Knarik|Shushan|Shushanik|Ashkhen|Zaruhi|Hermine|Heghine|Inga|Gayaneh|Nvard|Tamara|Lena|Laura|Lilia|Mery|Marina|Rita|Irina|Elena|Olga|Natalya|Kristina|Yelena|Gayane)$/;
const ARM = {
    first: weigh(read('worldnames-arm-fore.tsv').filter(e => !ARM_FEMALE.test(e.name) && maleOk(e.name))),
    last: weigh(read('worldnames-arm-sur.tsv'))
};

// ── BIH: bosniakisch r0 / serbisch r1 / kroatisch r2 ──────────────────────────
// Zensus 2013: Bosniaken 50 %, Serben 31 %, Kroaten 15 %. Vor- UND Nachname aus derselben Gruppe (sonst „Nikola Hodžić").
const MUSLIM_FIRST = /^(Ibrahim|Mustafa|Hasan|Mehmed|Muhamed|Muhammed|Mohamed|Alija|Osman|Husein|Ismet|Omer|Mirsad|Mujo|Sulejman|Salih|Suad|Senad|Edin|Admir|Nermin|Emir|Haris|Adnan|Kenan|Elvir|Jasmin|Almir|Sead|Fikret|Safet|Nihad|Asim|Fadil|Ramiz|Enver|Izet|Hamdija|Huso|Hamza|Meho|Suljo|Ibro|Ćamil|Šefik|Šemsudin|Zijad|Ahmed|Ahmet|Avdo|Adem|Ago|Bajro|Bego|Besim|Dževad|Džemal|Edis|Elvis|Emin|Enes|Ermin|Esad|Fahrudin|Faruk|Fuad|Hajro|Halil|Hamid|Hasib|Hazim|Hidajet|Hilmo|Hrustem|Hurem|Idriz|Ilijaz|Irfan|Ismail|Izudin|Jusuf|Kasim|Mahmut|Medo|Mehmedalija|Midhat|Mirza|Muamer|Muharem|Mujaga|Munib|Murat|Mursel|Mustafa|Nedžad|Nezir|Nijaz|Omer|Osmo|Redžep|Rešad|Rifat|Sabahudin|Sabit|Sadik|Safet|Said|Samir|Sanel|Sejo|Selim|Selmo|Semir|Šaban|Šerif|Smail|Sulejman|Tarik|Vahid|Zaim|Zuhdija|Zulfo|Almin|Amar|Amel|Amer|Anel|Armin|Benjamin|Dino|Eldin|Eldar|Emrah|Ervin|Hamdo|Harun|Jasko|Kemal|Mehdija|Mirnes|Nedim|Nihad|Sanjin|Zlatan|Adis|Alen|Belmin|Damir|Ensar|Erdin|Mensur|Nermin|Rasim|Refik|Ešref|Fehim|Galib|Hakija|Hilmija|Ferid|Atif|Asmir|Avdija|Džafer|Ekrem|Elmir|Fikret|Izet|Mesud|Muhidin|Nusret|Ragib|Šefket|Sefer|Šemso|Teufik|Vehbija|Zahid|Zijo)$/;
const CROAT_FIRST = /^(Ivan|Anto|Ante|Jozo|Ivo|Ivica|Mato|Marijan|Stjepan|Franjo|Josip|Tomislav|Mario|Pero|Mijo|Luka|Marinko|Zvonko|Ljubo|Vinko|Krunoslav|Dario|Davor|Krešimir|Mladen|Zdravko|Drago|Dragan|Ilija|Nikola|Marko|Petar|Željko|Božo|Ferdo|Frano|Jakov|Jure|Kristijan|Mirko|Niko|Perica|Stipe|Stipo|Šimun|Tihomir|Zoran|Vlado|Vjekoslav|Zlatko|Zvonimir|Branimir|Damir|Dalibor|Dražen|Igor|Ivano|Jadranko|Josko|Marin|Mate|Matija|Miro|Robert|Slavko|Tomo|Toni|Velimir|Ante|Jozo)$/;
// Rein kroatisch (katholisch) — der Rest der CROAT_FIRST-Liste ist serbisch-kroatisch geteilt
const CROAT_ONLY_FIRST = /^(Ivan|Anto|Ante|Jozo|Ivo|Ivica|Mato|Marijan|Stjepan|Franjo|Josip|Tomislav|Pero|Mijo|Marinko|Vinko|Krunoslav|Krešimir|Božo|Ferdo|Frano|Jakov|Jure|Perica|Stipe|Stipo|Šimun|Vjekoslav|Zvonimir|Branimir|Josko|Mate|Matija|Tomo)$/;
const BOSNIAK_LAST = /^(Hodžić|Hadžić|Halilović|Delić|Bašić|Avdić|Begić|Ramić|Alić|Imamović|Karić|Dedić|Selimović|Smajić|Spahić|Bošnjak|Mehmedović|Hasanović|Ibrahimović|Omerović|Muratović|Husić|Mujić|Suljić|Hasić|Salihović|Hukić|Kadić|Mešić|Mustafić|Osmanović|Pašić|Softić|Šehić|Zukić|Ahmetović|Ademović|Beganović|Ćatić|Čaušević|Dizdarević|Đulić|Hajdarević|Hamzić|Isaković|Jusić|Kurtović|Ljubović|Mehić|Memić|Muhić|Musić|Nuhanović|Ramović|Sarajlić|Šabić|Šahinović|Tahirović|Zahirović|Zulić|Bećirović|Delalić|Džafić|Fejzić|Grabovica|Hodžić|Huskić|Ibišević|Jahić|Junuzović|Kovač|Mahmutović|Mujkić|Omanović|Rizvanović|Sejdić|Sinanović|Topić|Zekić|Hrustić|Ibrić|Ćosić|Šuljić|Hamzić|Kahrović|Mušić|Ahmić)$/;
const CROAT_LAST = /^(Marić|Tomić|Perić|Božić|Filipović|Jurić|Šimić|Matić|Lovrić|Pavić|Barišić|Zovko|Bošnjak|Ćorić|Grgić|Kordić|Lasić|Ljubić|Mandić|Martinović|Matković|Prskalo|Rajič|Šarić|Topić|Vidović|Zelenika|Anić|Begić|Čolak|Dodig|Galić|Ivanković|Jelić|Knezović|Kožul|Lučić|Marijanović|Marković|Mikulić|Ostojić|Pejić|Rozić|Soldo|Stojić|Tolj|Vasilj|Vukadin|Zadro|Brkić|Babić|Kovačević|Knežević|Vuković)$/;
// Serbisch-kroatisch geteilte Familiennamen (beide Gruppen)
const SHARED_SC_LAST = /^(Kovačević|Knežević|Vuković|Babić|Marković|Brkić|Vidović|Topić|Martinović|Božić)$/;
function balkan(tag, banLastExtra) {
    const fore = read(`worldnames-${tag}-fore.tsv`).filter(e => maleOk(e.name));
    const sur = read(`worldnames-${tag}-sur.tsv`).filter(e => !(banLastExtra && banLastExtra.test(e.name)));
    return { fore, sur };
}
const bih = balkan('bih');
const BIH = { regions: [
    { w: 0.52, first: weigh(bih.fore.filter(e => MUSLIM_FIRST.test(e.name))), last: weigh(bih.sur.filter(e => BOSNIAK_LAST.test(e.name) && !CROAT_LAST.test(e.name))) },
    { w: 0.32, first: weigh(bih.fore.filter(e => !MUSLIM_FIRST.test(e.name) && !CROAT_ONLY_FIRST.test(e.name))),
              last: weigh(bih.sur.filter(e => !BOSNIAK_LAST.test(e.name) && (!CROAT_LAST.test(e.name) || SHARED_SC_LAST.test(e.name)))) },
    { w: 0.16, first: weigh(bih.fore.filter(e => CROAT_FIRST.test(e.name))),
              last: weigh(bih.sur.filter(e => CROAT_LAST.test(e.name) && !BOSNIAK_LAST.test(e.name) || SHARED_SC_LAST.test(e.name))) }
] };

// ── MKD: mazedonisch r0 / albanisch(-muslimisch) r1 ──────────────────────────
// Zensus 2021: Mazedonier 58 %, Albaner 24 %, Türken 4 %. Weibliche Formen -ska/-ova/-eva → männlich gefaltet.
const ALB_MUSLIM_FIRST = new RegExp(MUSLIM_FIRST.source.slice(0, -2) + '|Abedin|Bejadin|Nuredin|Zuhdi|Sefer|Fikri|Hajredin|Kemal|Nedžat|Rušid|Seljam|Šaćir|Arben|Bekim|Ilir|Agim|Fatmir|Besnik|Driton|Afrim|Blerim|Burim|Bujar|Fadil|Fisnik|Gentian|Jeton|Kujtim|Lulzim|Mentor|Muhamed|Naser|Nexhat|Qenan|Rexhep|Sami|Shaban|Shefqet|Shkelzen|Skender|Taulant|Xhevdet|Zijadin|Daut|Bajram|Abdula|Abdulah|Ajet|Avni|Bekir|Dzemail|Ejup|Fejzi|Ferid|Hajrula|Hamdi|Ilmi|Isen|Islam|Jakup|Jonuz|Lutfi|Malik|Memet|Metin|Musa|Nazim|Nevzat|Orhan|Ramadan|Recep|Remzi|Rufat|Sabri|Sadri|Selam|Selman|Sevdail|Shefket|Sulejman|Talat|Veli|Xhemail|Zeqir|Zekir|Zija|Arif|Abdulla|Adnan|Agron|Albert|Ardian|Arsim|Avdil|Bardhyl|Bashkim|Behar|Bekim|Besim|Dashmir|Durim|Elmi|Ermal|Fatos|Florim|Gazmend|Halim|Hysen|Ibrahim|Idriz|Iljaz|Ismet|Izet|Kadri|Lavdrim|Mevlan|Mirsim|Muamet|Nijazi|Qamil|Rami|Refik|Rifat|Sabedin|Safet|Selim|Shpend|Valon|Vehbi|Visar|Xhemal|Zenun)$');
// ⚠ -i allein traf auch das mazedonische -ski (Stojanovski landete albanisch) → -ski ausgenommen
const ALB_LAST = /^(?!.*ski$).*(i|aj)$|^(Šabani|Redžepi|Sulejmani|Ibraimi|Osmani|Asani|Ramadani|Bajrami|Ademi|Memeti|Iseni|Jakupi|Rushiti|Saliu|Sadiku|Idrizi|Selmani|Emini|Bislimi|Zeqiri|Rexhepi|Shabani|Sejdini|Mustafa|Xhaferi|Aliu|Ismaili|Imeri|Halili|Avdiu|Daku|Kurtishi|Dauti|Ahmeti|Zendeli|Veliu|Mehmeti|Bexheti|Ajdini|Fejzulai|Abazi|Mamuti|Limani|Musliu|Hasani|Iljazi|Kadriu|Murati|Ramani|Selimi|Shaqiri|Jashari|Kamberi|Arifi|Beqiri)$/;
const mkdFold = n => n.replace(/ska$/, 'ski').replace(/ova$/, 'ov').replace(/eva$/, 'ev');
const mkd = balkan('mkd');
mkd.fore = mkd.fore.filter(e => !/(ov|ev|ski|ska)$/.test(e.name));   // Nachnamen in der Vornamenliste (Borisov)
const mkdSur = merge(mkd.sur.map(e => ({ ...e, name: mkdFold(e.name) })));
const MKD = { regions: [
    { w: 0.7, first: weigh(mkd.fore.filter(e => !ALB_MUSLIM_FIRST.test(e.name))), last: weigh(mkdSur.filter(e => !ALB_LAST.test(e.name))) },
    { w: 0.3, first: weigh(mkd.fore.filter(e => ALB_MUSLIM_FIRST.test(e.name))), last: weigh(mkdSur.filter(e => ALB_LAST.test(e.name))) }
] };

// ── MNE: montenegrinisch/serbisch r0 / bosniakisch-albanisch r1 ──────────────
// Zensus 2011: Montenegriner 45 %, Serben 29 %, Bosniaken 9 %, Albaner 5 %. Dj → Đ wie SRB.
const djFix = n => n.replace(/^Dj/, 'Đ').replace(/dj/g, 'đ');
const MNE_MUSLIM_LAST = /^(Kalač|Murić|Hadžić|Ramović|Škrijelj|Nurković|Agović|Adrović|Dautović|Šabotić|Ćorović|Hasanović|Mujević|Omerović|Halilović|Mehović|Međedović|Kastratović|Radončić|Kurpejović|Begović|Ćatović|Musić|Husović|Osmanović|Avdić|Duraković|Sinanović|Sijarić|Redžović|Šabanović|Ibrahimović|Skenderović|Ahmetović|Muković|Sabović|Hamidović|Tahirović|Bećirović|Kurtagić|Spahić|Demirović|Turković|Adžović|Suljević|Seferović|Ljuca|Fetahović|Bihorac|Bajrović|Mahmutović|Mekić|Biševac|Hajrović|Gutić|Rebronja|Kurtanović|Kadić|Mulić|Selimović|Kurtović|Musović|Mujović|Kasumović|Ličina|Kuč|Kurti|Camaj|Đokaj|Gjokaj|Lulgjuraj|Nikaj|Ivezaj|Dedvukaj|Ljuljđuraj|Hoti|Gjonaj)$|aj$/;
const mne = balkan('mne');
const mneFore = merge(mne.fore.map(e => ({ ...e, name: djFix(e.name) })));
const mneSur = merge(mne.sur.map(e => ({ ...e, name: djFix(e.name) })));
const MNE = { regions: [
    { w: 0.86, first: weigh(mneFore.filter(e => !ALB_MUSLIM_FIRST.test(e.name))), last: weigh(mneSur.filter(e => !MNE_MUSLIM_LAST.test(e.name) && !BOSNIAK_LAST.test(e.name))) },
    // Nur 5 bosniakisch-albanische Familiennamen unter den MNE-Top-100 → ergänzt um die bosniakischen aus BIH (Sandžak,
    // gleicher Namensraum), mit halbem Gewicht, damit die montenegrinischen Belege vorn bleiben
    { w: 0.14, first: weigh(mneFore.filter(e => ALB_MUSLIM_FIRST.test(e.name))),
      last: (() => {
          const own = weigh(mneSur.filter(e => MNE_MUSLIM_LAST.test(e.name) || BOSNIAK_LAST.test(e.name)));
          const have = new Set(own.map(e => key(e[0])));
          const add = BIH.regions[0].last.filter(e => !have.has(key(e[0]))).map(([n, w]) => [n, Math.max(1, Math.round(w / 2))]);
          return own.concat(add);
      })() }
] };

// ── VIE ─────────────────────────────────────────────────────────────────────
// Internationale ASCII-Form wie im Datensatz (Nguyen). Vorname = Rufname (letzte Silbe), westliche Reihenfolge wie
// bei vietnamesischen Fahrern im Ausland. Zwischennamen (Van, Duc) und Familiennamen im Vornamenfeld raus; Rufnamen
// im Nachnamenfeld und Abgeschnittenes (Nguye, Inh) raus.
const VIE_SUR_SET = new Set(read('worldnames-vie-sur.tsv').map(e => e.name));
const VIE_NOT_FIRST = /^(Huu|Ba|Cong|Quoc|Xuan|Hoang|Duong|Truong|Lam|O|Ong|Ta|Ho|Van|Thi|Nguyen|Tran|Le|Pham|Vu|Phan|Bui|Vo|Huynh|Do|Ngo|Dang|Ha|Mai|Dinh|Trinh|Cao|Luong|Dao|Doan|Ly|Luu|Chu|To|Thai|La|Chau|Ma|Vuong)$/;
const VIE_NOT_LAST = /^(Ba|Trung|Xuan|Quoc|Huu|Cong|Bao|Gia|Phuong|Thu|Lan|Linh|Hoa|Thuy|Huong|Hanh|Hien|Trang|Nhung|Yen|Hue|Mai Anh|O|Anh|Thanh|Van|Minh|Ngoc|Tuan|Hong|Inh|Nguye|Ang|Thi|Duc|Hai|Long|Hung|Nam|Quang|Tu|Vi|Kim|Son)$/;
const VIE = {
    first: weigh(read('worldnames-vie-fore.tsv').filter(e => !VIE_NOT_FIRST.test(e.name) && e.name.length > 1 && maleOk(e.name))),
    last: weigh(read('worldnames-vie-sur.tsv').filter(e => !VIE_NOT_LAST.test(e.name)))
};
void VIE_SUR_SET;

// ── Pools ────────────────────────────────────────────────────────────────────
// KGZ: Kirgisen + Usbeken ~89 %, Russen 5 % (Zensus 2022); UZB: Russen ~2 %. r1 wird im Build durch den RUS-Pool ersetzt.
const RUS_PLACEHOLDER = { first: [['Alexander', 1]], last: [['Ivanov', 1]] };
const POOLS = {
    KGZ: { regions: [ { w: 0.94, first: KGZ.first, last: KGZ.last }, { w: 0.06, ...RUS_PLACEHOLDER } ] },
    UZB: { regions: [ { w: 0.97, first: UZB.first, last: UZB.last }, { w: 0.03, ...RUS_PLACEHOLDER } ] },
    TJK: { regions: [ { w: 1, first: TJK.first, last: TJK.last } ] },
    ARM: { regions: [ { w: 1, first: ARM.first, last: ARM.last } ] },
    BIH, MKD, MNE,
    VIE: { regions: [ { w: 1, first: VIE.first, last: VIE.last } ] }
};
// Diese Regionen bekommen im Build den RUS-Pool (Vor- + Nachnamen + Schwanz)
const RUS_COPY = [['KGZ', 1], ['UZB', 1]];

// Auffüllen kleiner Regionen aus Nachbar-Pools (Nutzer-Entscheid 04.10.2026): worldnames liefert nur die Rangliste
// (16–50 Nachnamen je Region). Der Build hängt nach processNation die Namen des Gebers an, Gewicht × f (eigene vorn).
// filter: nur Geber-Namen, die den Ausdruck erfüllen (Zentralasien: arabisch-persische Stämme, keine kasachischen).
const CA_STEM = /^(Abdu|Abdy|Ali|Akhme|Akhma|Karim|Rakh|Rasul|Said|Sharip|Usman|Umar|Yusup|Ibragim|Ismail|Kasym|Khasan|Khusain|Murad|Nazar|Rashid|Safar|Sultan|Nabi|Salim|Kadyr|Khalil|Aziz|Akbar|Amir|Tursun|Musa|Isa|Mamat|Mamed|Osman|Yunus|Yakub|Khamid|Khakim|Sabir|Zakir|Mirza|Nurmat|Sadyk|Bakir|Tagir|Ergash|Kurban|Sobir|Davlat|Abdula|Iskand|Mukhamed|Khaid|Shakir)/;
const SUPPLEMENT = [
    { nat: 'MKD', ri: 1, kind: 'last',  donor: ['ALB', 0], f: 0.5 },          // albanisch: 16 → + Albanien
    { nat: 'MKD', ri: 1, kind: 'first', donor: ['ALB', 0], f: 0.5 },
    { nat: 'BIH', ri: 2, kind: 'last',  donor: ['CRO', 0], f: 0.5 },          // kroatisch: 22 → + Kroatien
    { nat: 'BIH', ri: 2, kind: 'first', donor: ['CRO', 0], f: 0.5 },
    { nat: 'BIH', ri: 1, kind: 'last',  donor: ['SRB', 0], f: 0.5 },          // serbisch: 50 → + Serbien
    { nat: 'KGZ', ri: 0, kind: 'last',  donor: ['KAZ', 0], f: 0.4 },          // kirgisisch: 46 → + Kasachstan (verwandt, -bekov/-baev)
    { nat: 'UZB', ri: 0, kind: 'last',  donor: ['KAZ', 0], f: 0.3, filter: CA_STEM },
    { nat: 'TJK', ri: 0, kind: 'last',  donor: ['KAZ', 0], f: 0.3, filter: CA_STEM }
];
// Bosniakisch: kein Geber-Pool → die gepflegte Liste echter bosniakischer Familiennamen (BOSNIAK_LAST), Gewicht 1
const bihHave = new Set(BIH.regions[0].last.map(e => key(e[0])));
for (const n of BOSNIAK_LAST.source.replace(/^\^\(|\)\$$/g, '').split('|')) if (!bihHave.has(key(n))) { BIH.regions[0].last.push([n, 1]); bihHave.add(key(n)); }

module.exports = { POOLS, RUS_COPY, SUPPLEMENT };
