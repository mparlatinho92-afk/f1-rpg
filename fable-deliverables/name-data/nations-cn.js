// Namens-Pool CHN aus Daten (2026-10-03). Vorher rein kuratiert: 37 Vor-/52 Nachnamen.
// Quelle: BigQuery-/Kaggle-Rohdaten, tief aggregiert (CN liegt in fore_agg nur mit Top-600 vor, dort
// fast nur englische Rufnamen):
//   node aggregate-names.js <forenames.csv> cn_fore_agg.csv M 6000 CN
//   node aggregate-names.js <surnames.csv>  cn_sur_agg.csv ALL 3000 CN
// Schriftzeichen-Namen → Pinyin über cn-hanzi-pinyin.json (einmalig erzeugt mit pinyin-pro, s. BEFUNDE.md).
//
// POSITIV-PRÜFUNG statt Sperrlisten (Nutzer-Entscheid 03.10.2026): der Datensatz stammt aus Social-Media-
// Profilen und enthält Spitznamen und Schimpfwörter. Ein Name kommt nur durch, wenn er aus erlaubten
// Bausteinen besteht — Vorname: 1–2 Silben aus NAME_SYL; Nachname: aus CN_SURNAMES; englisch: EN_GIVEN.
// Die Daten liefern nur noch die Häufigkeiten. Rohnamen werden nie ausgegeben (API-Inhaltsfilter).
// Nutzer-Entscheid: überwiegend Pinyin (~90 %), englische Rufnamen als Farbe (~10 %).
'use strict';

const fs = require('fs');

// Übliche Silben männlicher Vornamen (ohne Silben, die fast nur in Schimpf- oder Kosewörtern stehen)
const NAME_SYL = new Set(('an ang ao bai bao bei ben bin bing bo cai can chang chao chen cheng chi chong chu chuan chun cong da dai dan de deng di dian ding dong du duan en fa fan fang fei feng fu gang gao ge geng gong guan guang gui guo hai han hang hao he heng hong hu hua huai huan huang hui huo ji jia jian jiang jie jin jing jiong jiu ju jue jun kai kang ke kun kuo lai lan lang le lei li lian liang lin ling liu long lu lun luo man mao meng miao min ming mo mu nan ning nuo ou pan pei peng ping pu qi qian qiang qiao qin qing qiu quan qun ran ren rong ru rui run ruo sen shan shang shao shen sheng shi shou shu shuai shuang shun shuo si song su sui sun tai tan tang tao teng tian ting tong tuo wan wang wei wen wu xi xia xian xiang xiao xin xing xiong xu xuan xue xun ya yan yang yao ye yi yin ying yong you yu yuan yue yun ze zeng zhan zhang zhao zhe zhen zheng zhi zhong zhou zhu zhuo zi zong zu zun zuo').split(' '));
// Zerlegung in Silben (längste zuerst): 1 oder 2 Silben, alle aus NAME_SYL
function sylSplit(s) {
    s = s.toLowerCase();
    if (NAME_SYL.has(s)) return [s];
    for (let i = Math.min(6, s.length - 1); i >= 1; i--) {
        const a = s.slice(0, i), b = s.slice(i);
        if (NAME_SYL.has(a) && NAME_SYL.has(b)) return [a, b];
    }
    return null;
}
const isPinyinGiven = n => /^[A-Z][a-z]+$/.test(n) && !!sylSplit(n) && !/^(\w+)\1$/i.test(n);   // keine Verdopplung (Kosenamen)

// Englische Rufnamen: feste Liste, sonst nichts Englisches
const EN_GIVEN = /^(Jack|Jason|Kevin|David|Michael|Eric|Alex|Andy|Tony|John|Leo|Peter|James|Frank|Daniel|Steven|Allen|Sam|Jerry|William|Vincent|Jacky|Simon|Chris|Mark|Bruce|Richard|Alan|Henry|Jimmy|Ken|Ben|Paul|Tom|Victor|Ryan|Aaron|Nick|Jeff|Gary|Charles|Leon|Kelvin|Edward|Thomas|Robert|Martin|Ray|Roy|George|Sean|Owen|Luke|Andrew|Joseph|Stephen|Patrick|Raymond|Terry|Larry|Dennis|Eddie|Felix|Oscar|Max|Harry|Louis|Albert|Arthur|Hugo|Ivan|Justin|Kenny|Jackson|Benjamin|Samuel|Lucas)$/;

// Häufige chinesische Familiennamen (Pinyin; Lü für 吕/闾), dazu die geläufigen zweisilbigen
const CN_SURNAMES = new Set(('Wang Li Zhang Liu Chen Yang Huang Zhao Wu Zhou Xu Sun Ma Zhu Hu Guo He Gao Lin Luo Zheng Liang Xie Song Tang Han Feng Deng Cao Peng Zeng Xiao Tian Dong Yuan Pan Yu Jiang Cai Du Ye Cheng Su Wei Lü Ding Ren Shen Yao Lu Cui Zhong Tan Fan Jin Shi Liao Jia Xia Fu Fang Bai Zou Meng Xiong Qin Qiu Yin Xue Yan Duan Lei Hou Long Tao Gu Mao Hao Gong Shao Wan Qian Dai Mo Kong Xiang Chang Wen Kang Niu Hong Xing Qi Gan Ji Zhan An Huo Pang Ruan Guan Bao Yi Kou Zhuang Shang Mu Ou Bian Geng Ni Ning Lan Shan Xin Rong Tong Zhai Lian Yue Mi Ai Bi Qu Che Chai Chu Dang Diao Gui Hua Jing Ju Kuang Leng Liu Lou Luan Man Miao Mou Nie Pei Pu Rao Sang Sha Shu Si Tu Wo Xi Xian Xuan Yong You Zang Zhen Zhuo Zong Zuo Ba Bo Bu Cen Chi Chong Da Dou Fei Ge Gou Heng Hui Kan Ke Lang Le Ling Mei Nan Nong Qiao Quan Ran Rui Sheng Shou Shuang Teng Tie Weng Wu Xun Yan Yuan Yun Zan Zhan Ouyang Sima Zhuge Shangguan Situ Dongfang Murong Huangfu Linghu Xiahou Zhangsun Yuwen Gongsun Duanmu').split(' '));
CN_SURNAMES.delete('Gou'); CN_SURNAMES.delete('Sha');   // als Wort anstößig — echte, aber seltene Namen bleiben draußen

let _map = null;
function hanziMap() {
    if (!_map) _map = JSON.parse(fs.readFileSync(__dirname + '/cn-hanzi-pinyin.json', 'utf8'));
    return _map;
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function cnNorm(n, kind) {
    if (/[一-鿿]/.test(n)) {
        const p = hanziMap()[kind === 'last' ? 'last' : 'first'][n];
        if (!p) return n;   // bleibt Schriftzeichen → fällt im Latin-Filter weg
        n = p;
    }
    n = n.replace(/v/g, 'ü');
    if (kind === 'last') n = n.replace(/^(Lv|Lyu|Lu:)$/i, 'Lü');
    return cap(n.toLowerCase());
}

const ONE_SYL = { test: n => /^[A-Z][a-z]+$/.test(n) && NAME_SYL.has(n.toLowerCase()) };
const EN_F = +(process.env.CN_EN_F || 0.05), ONE_F = +(process.env.CN_ONE_F || 0.28);

const CFG = {
    CHN: { iso:'CN', cls:'big', norm: cnNorm,
           // surRatio: Nachnamen im Vornamenfeld (Chen, Wang, Zhang) raus. Einsilbige Vornamen sind im Datensatz
           // meist Bruchstücke zweisilbiger → gedämpft. Faktoren gemessen auf ~10 % englisch / ~15 % einsilbig (BEFUNDE.md).
           surRatio:3,
           dampFirst:[[EN_GIVEN, EN_F], [ONE_SYL, ONE_F]],
           banLast:[{ test: n => !CN_SURNAMES.has(n) }],
           banFirst:[{ test: n => !(isPinyinGiven(n) || EN_GIVEN.test(n)) }] }
};

module.exports = { CFG, NAME_SYL, sylSplit, isPinyinGiven, CN_SURNAMES, EN_GIVEN };
