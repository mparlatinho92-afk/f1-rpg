// Namens-Pools Welle 7 (2026-10-04): MLT, LUX, ISL, ANG. Vorher ITA, BEL, SWE bzw. POR.
// Quelle: BigQuery-/Kaggle-Rohdaten, aggregiert mit
//   node aggregate-names.js <forenames.csv> w7_fore_agg.csv   M 800  MT,LU,IS,AO
//   node aggregate-names.js <forenames.csv> w7_fore_f_agg.csv F 800  (dito)
//   node aggregate-names.js <surnames.csv>  w7_sur_agg.csv  ALL 2000 (dito)
// Alle vier mit Geschlechtsangabe, 100 % lateinisch. Befunde: BEFUNDE.md 04.10.2026. Rohnamen nie ausgeben.
'use strict';

const key = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const SHORT = /^.{1,2}$/;

// Zuwanderer, die keine eigene Region bekommen (Südasien, Ostasien, Philippinen, Nahost, Balkan, Polen/Baltikum)
const FOREIGN_LAST = /^(Khan|Kumar|Singh|Patel|Sharma|Shah|Hussain|Ahmed|Ali|Mohamed|Mohammed|Hassan|Ibrahim|Omar|Kim|Lee|Wang|Li|Zhang|Liu|Chen|Yang|Huang|Zhao|Wu|Zhou|Xu|Nguyen|Tran)$|(ić|ic|ović|ovic|ević|evic|ski|ska|wski|wska|cki|cka|enko|chuk|ova|eva|aite|iene|ienė|aitė)$/;
const JUNK_LAST = /^(Lux|Diallo|Traore|Traoré|Kone|Koné|Camara|Bah|Barry|Malta|Gozo|Valletta|Luxembourg|Luxemburg|Letzebuerg|Lëtzebuerg|Iceland|Island|Ísland|Reykjavik|Reykjavík|Angola|Luanda|Benguela|Huambo|Love|King|Queen|Prince|Princess|Boy|Baby|Jr|Junior|Official|Oficial|Music|Dj|Mc|Pro|Bae|Da|De|Do|Dos|Das|Del|La|Le|Van|Von)$/i;

// ── LUX: luxemburgisch/französisch/deutsch r0, portugiesisch r1 ─────────────
// Nutzer-Entscheid 04.10.2026: Portugiesen (25 % der Nachnamen im Datensatz, größte Minderheit, Zuwanderung ab den 1960ern)
// als kleine eigene Region ~10 % — Vor- UND Nachname portugiesisch, unter dem Bevölkerungsanteil (Motorsport-Zugang).
const PT_LAST = /^(Lima|Morais|Cruz|Delgado|Moura|Furtado|Semedo|Tavares|Lobo|Cabral|Rosa|Fortes|Spencer|Silva|Da Silva|Santos|Dos Santos|Ferreira|Pereira|Oliveira|De Oliveira|Costa|Da Costa|Rodrigues|Martins|Sousa|De Sousa|Fernandes|Gomes|Lopes|Ribeiro|Gonçalves|Goncalves|Marques|Carvalho|Almeida|Pinto|Alves|Dias|Teixeira|Correia|Mendes|Moreira|Soares|Nunes|Cardoso|Rocha|Monteiro|Machado|Fonseca|Barbosa|Coelho|Cunha|Vieira|Neves|Freitas|Matos|Reis|Antunes|Tavares|Azevedo|Barros|Borges|Brito|Castro|Duarte|Faria|Fernandes|Figueiredo|Henriques|Lourenço|Loureiro|Magalhães|Miranda|Mota|Nogueira|Paiva|Pires|Quintas|Rebelo|Sá|Salgado|Sampaio|Simões|Simoes|Vaz|Batista|Baptista|Amaral|Andrade|Araújo|Araujo|Branco|Campos|Esteves|Gaspar|Guerreiro|Jesus|De Jesus|Leite|Macedo|Moura|Pacheco|Pinheiro|Ramos|Valente|Ventura|Xavier)$/;
const PT_FIRST = /^(João|Joao|José|Jose|Tiago|Rui|Nuno|Paulo|Luís|Luis|Miguel|Filipe|Sérgio|Sergio|Vítor|Vitor|Fernando|Manuel|António|Antonio|Jorge|Diogo|Fábio|Fabio|Pedro|Carlos|Ricardo|Joaquim|Francisco|Mário|Mario|Rafael|Hélder|Helder|Marco|Gonçalo|Goncalo|Rúben|Ruben|Bruno|Hugo|Nelson|Armando|Albino|Américo|Alberto|Abílio|Adriano|Agostinho|Alexandre|Alfredo|Álvaro|Artur|Augusto|Avelino|Bernardino|Celestino|Domingos|Duarte|Eduardo|Emanuel|Fausto|Feliciano|Fernão|Gil|Horácio|Humberto|Ilídio|Jaime|Júlio|Leonel|Lino|Marcelo|Mauro|Norberto|Octávio|Orlando|Raul|Renato|Rodrigo|Rogério|Sandro|Silvino|Telmo|Valter|Vasco)$/;
// Luxemburgisch-französisch geteilt (Daniel, David, Marc): bleiben r0, nicht r1 (r1 nur eindeutig Portugiesisches)

// ── ISL ─────────────────────────────────────────────────────────────────────
// Vatersnamen statt Familiennamen: Nachname = Vorname des Vaters + -son (Männer). Datensatz führt ASCII- und
// isländische Schreibung nebeneinander (Gudmundsson / Guðmundsson) → ein Schlüssel (ð=d, þ=th, æ=ae, ö=o),
// Anzeige isländisch. Positiv-Regel: Nachname endet auf -son oder ist einer der wenigen Familiennamen.
const isKey = s => key(s.replace(/[ðÐ]/g, 'd').replace(/þ/g, 'th').replace(/Þ/g, 'Th').replace(/æ/g, 'ae').replace(/Æ/g, 'Ae').replace(/ö/g, 'o').replace(/Ö/g, 'O'));
const isPrefer = n => /[ðþæöáéíóúýÐÞÆÖÁÉÍÓÚÝ]/.test(n) ? 1 : 0;
const IS_FAMILY = /^(Thors|Thorarensen|Blöndal|Blondal|Hafstein|Briem|Thoroddsen|Zoëga|Zoega|Hansen|Olsen|Jensen|Möller|Moller|Nordal|Kvaran|Laxness|Thorlacius|Bachmann|Benediktsson)$/;
const isNotPatronym = { test: n => !/son$/.test(n) && !IS_FAMILY.test(n) };

// ── MLT ─────────────────────────────────────────────────────────────────────
// Maltesische Nachnamen (Borg, Camilleri, Vella, Farrugia, Zammit) — viele italienischen Ursprungs, daher keine
// Italien-Sperre. Zuwanderer (Briten, Filipinos, Südasiaten, Nahost, Balkan) über FOREIGN_LAST und die globale Guard.
const MT_NOT_LAST = /^(Santos|Reyes|Cruz|Bautista|Dela Cruz|Garcia|Mendoza|Ramos|Gonzales|Smith|Jones|Williams|Brown|Taylor|Davies|Wilson|Evans|Thomas|Johnson|Roberts|Walker|Wright|Robinson|Thompson|White|Hughes|Edwards|Green|Hall|Wood|Harris|Lewis|Martin|Jackson|Clarke|Clark|Turner|Hill|Scott|Cooper|Morris|Ward|Moore|King|Watson|Baker|Harrison|Morgan|Patel|Young|Allen|Mitchell|James|Anderson|Phillips|Lee|Bell|Parker|Davis|Rossi|Russo|Ferrari|Esposito|Bianchi|Romano|Colombo|Ricci|Marino|Greco|Bruno|Gallo|Conti|De Luca|Mancini|Costa|Giordano|Rizzo|Lombardi|Moretti)$/;

// ── ANG ─────────────────────────────────────────────────────────────────────
// Portugiesische Namen (Silva, João) sind in Angola einheimisch, dazu Bantu-Nachnamen (Kiala, Mbala, Chipenda).
// Zuwanderer: chinesische Vertragsarbeiter, Südasiaten (FOREIGN_LAST/Guard).

const CFG = {
    MLT: { iso:'MT', cls:'small', givenRatio:1, banLast:[SHORT, FOREIGN_LAST, JUNK_LAST, MT_NOT_LAST] },
    LUX: { iso:'LU', cls:'small', givenRatio:1,
           route:[[PT_LAST, 1]], routeFirst:[[PT_FIRST, 1]],
           banLast:[SHORT, FOREIGN_LAST, JUNK_LAST], banFirst:[/^(Mohamed|Mohammed|Ali|Ahmed)$/] },
    ISL: { iso:'IS', cls:'tiny', mkey: isKey, prefer: isPrefer, givenRatio:1, foreignFirstIso:['PL', 'LT'],
           banLast:[SHORT, FOREIGN_LAST, JUNK_LAST, isNotPatronym, /dott(i|í)r$|dóttir$/] },
    ANG: { iso:'AO', cls:'small', givenRatio:1, banLast:[SHORT, FOREIGN_LAST, JUNK_LAST] }
};

const POOLS = {
    MLT: { regions: [ { w:1, first: [['Joseph',5],['John',4],['Mario',4],['Charles',3],['Paul',3],['Anthony',3],['Carmel',3],['Emanuel',3],['Mark',3],['Kurt',2],['Clayton',2],['Jean',2]], last: [] } ] },
    // Luxemburger ~47 % der Einwohner, Portugiesen ~15 % — Region r1 bewusst darunter (Nutzer-Entscheid)
    LUX: { regions: [
        { w:0.9, first: [['Jean',4],['Marc',4],['Paul',3],['Jos',3],['Jang',3],['Gilles',3],['Pol',2],['Romain',3],['Claude',3],['Yves',2],['Tom',3],['Luc',2]], last: [] },
        { w:0.1, first: [['João',4],['José',4],['Tiago',3],['Rui',3],['Nuno',3],['Paulo',3],['Ricardo',2],['Filipe',2],['Sérgio',2],['Vítor',2]],
          last: [['Da Silva',4],['Dos Santos',4],['Ferreira',3],['Pereira',3],['Rodrigues',3],['Fernandes',2],['Martins',2],['Gomes',2],['Lopes',2],['Teixeira',2]] }
    ] },
    ISL: { regions: [ { w:1, first: [['Jón',5],['Sigurður',4],['Guðmundur',4],['Gunnar',4],['Ólafur',3],['Einar',3],['Kristján',3],['Magnús',3],['Stefán',3],['Jóhann',3],['Björn',2],['Helgi',2]],
        last: [['Jónsson',5],['Sigurðsson',4],['Guðmundsson',4],['Gunnarsson',3],['Ólafsson',3],['Einarsson',3],['Kristjánsson',3],['Magnússon',3],['Stefánsson',2],['Jóhannsson',2]] } ] },
    ANG: { regions: [ { w:1, first: [['João',5],['Manuel',4],['António',4],['José',4],['Domingos',3],['Francisco',3],['Pedro',3],['Paulo',3],['Mateus',3],['Adilson',2],['Edson',2],['Kiala',1]], last: [] } ] }
};

const OPS = {};

module.exports = { CFG, POOLS, OPS };
