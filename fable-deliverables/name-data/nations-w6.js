// Namens-Pools Welle 6 (2026-10-03): CRC, GUA, PAN, ECU, BOL, PUR, PHI. Vorher MEX bzw. COL.
// Quelle: BigQuery-/Kaggle-Rohdaten, aggregiert mit
//   node aggregate-names.js <forenames.csv> w6_fore_agg.csv   M 800  CR,GT,PA,EC,BO,PR,PH
//   node aggregate-names.js <forenames.csv> w6_fore_f_agg.csv F 800  (dito)
//   node aggregate-names.js <surnames.csv>  w6_sur_agg.csv  ALL 2000 (dito)
// Alle sieben mit Geschlechtsangabe und 100 % lateinisch (anders als Welle 5). Befunde: BEFUNDE.md 03.10.2026 (6).
// Rohnamen nie ausgeben (API-Inhaltsfilter).
'use strict';

const SHORT = /^.{1,2}$/;

// Spanischsprachig: Gastarbeiter/Fremde praktisch nur Nachbarländer (spanisch) → kaum Sperren nötig
const FOREIGN_LAST = /^(Khan|Kumar|Singh|Patel|Sharma|Ali|Ahmed|Mohamed|Kim|Lee|Wang|Li|Chen|Zhang|Liu|Nguyen|Smith|Johnson|Williams|Brown|Jones|Miller|Davis|Wilson|Taylor|Anderson|Thomas|Jackson|White|Harris|Martin|Thompson|Moore|Clark|Lewis|Walker|Young|Allen|King|Wright|Scott|Green|Baker|Adams|Hill)$/;
// Social-Media-Wörter, Orte, Titel im Nachnamenfeld
const JUNK_LAST = /^(Costa Rica|Guatemala|Panama|Panamá|Ecuador|Bolivia|Puerto Rico|Boricua|Philippines|Pilipinas|Pinoy|Manila|Cebu|Davao|Quito|Guayaquil|La Paz|Santa Cruz|Cochabamba|San Jose|San José|Tica|Tico|Chapin|Chapina|Love|Lover|Boy|Girl|Baby|King|Queen|Prince|Princess|Angel|Bebe|Bb|Jr|Junior|Ii|Iii|Official|Oficial|Music|Dj|Mc|Pro|Bae|Loves|Forever|Uno|Dos|Del|De|La|Las|Los|Y|Delos|Delas)$/i;
// Spanische Doppel-Vornamen sind echt (Juan Carlos, José Luis); einzelnes Maria/María ist weiblich
const ES_FIRST_BAN = /^(Maria|María|Ana|Jose Maria|José María)$/;

// ── PHI ─────────────────────────────────────────────────────────────────────
// Spanische Nachnamen (Santos, Reyes, Cruz, Bautista — Clavería-Katalog 1849), dazu tagalische (Macaraeg,
// Dimaculangan); Vornamen gemischt englisch/spanisch. Filipino-Kosenamen und Kreativschreibungen gesperrt.
const PH_NICK_FIRST = /^(Jun|Junjun|Jojo|Bong|Dodong|Boy|Jay|Jayjay|Nonoy|Totoy|Toto|Dong|Ronron|Bebot|Bobby|Jhun|Jhon|Jhay|Jhayr|Mhark|Rhon|Kuya|Bro|Pare|Lodi|Idol|Papa|Daddy|Jhonny|Jhoy|Jeje)$|^(Jh|Mh|Kh|Rh)[a-z]/;
// Chinesisch-philippinische Familien (Tan, Lim, Sy) sind echt, aber ~1–2 % und bilden mit Pedro/Rodel keine stimmigen Paare → raus
const PH_NOT_LAST = /^(Tan|Lim|Sy|Co|Ong|Go|Uy|Chua|Yap|Ang|Chan|Ng|Lao|Que|Tiu|Dy)$/;

const CFG = {
    CRC: { iso:'CR', cls:'small', givenRatio:1, banLast:[SHORT, FOREIGN_LAST, JUNK_LAST], banFirst:[ES_FIRST_BAN] },
    GUA: { iso:'GT', cls:'small', givenRatio:1, banLast:[SHORT, FOREIGN_LAST, JUNK_LAST], banFirst:[ES_FIRST_BAN] },
    PAN: { iso:'PA', cls:'small', givenRatio:1, banLast:[SHORT, FOREIGN_LAST, JUNK_LAST], banFirst:[ES_FIRST_BAN] },
    ECU: { iso:'EC', cls:'small', givenRatio:1, banLast:[SHORT, FOREIGN_LAST, JUNK_LAST], banFirst:[ES_FIRST_BAN] },
    BOL: { iso:'BO', cls:'small', givenRatio:1, banLast:[SHORT, FOREIGN_LAST, JUNK_LAST], banFirst:[ES_FIRST_BAN] },
    PUR: { iso:'PR', cls:'tiny',  givenRatio:1, banLast:[SHORT, FOREIGN_LAST, JUNK_LAST], banFirst:[ES_FIRST_BAN] },
    // finalize: fixName akzentuiert García/López auch hier (NO_ACCENT_NATIONS greift nur für ES_ONLY) — Filipinos schreiben ohne; ñ bleibt
    PHI: { iso:'PH', cls:'small', givenRatio:1, finalize: n => n.replace(/[áéíóúÁÉÍÓÚ]/g, c => c.normalize('NFD')[0]), banLast:[SHORT, FOREIGN_LAST, JUNK_LAST, PH_NOT_LAST], banFirst:[ES_FIRST_BAN, PH_NICK_FIRST] }
};

// ── Pool-Skelette: kleiner kuratierter Kopf, Daten füllen den Rest ──────────
const POOLS = {
    CRC: { regions: [ { w:1, first: [['José',5],['Carlos',4],['Luis',4],['Juan',4],['Jorge',3],['Esteban',3],['Andrés',3],['Mario',3],['Alejandro',3],['Gerardo',2],['Randall',2],['Minor',2]], last: [] } ] },
    GUA: { regions: [ { w:1, first: [['José',5],['Juan',4],['Carlos',4],['Luis',4],['Mario',3],['Jorge',3],['Byron',3],['Edgar',3],['Marvin',3],['Erick',2],['Otto',2],['Hugo',2]], last: [] } ] },
    PAN: { regions: [ { w:1, first: [['José',5],['Luis',4],['Carlos',4],['Juan',4],['Jorge',3],['Roberto',3],['Ricardo',3],['Rubén',3],['Eduardo',3],['Omar',2],['Abdiel',2],['Edwin',2]], last: [] } ] },
    ECU: { regions: [ { w:1, first: [['José',5],['Luis',4],['Carlos',4],['Juan',4],['Jorge',3],['Fernando',3],['Diego',3],['Andrés',3],['Pablo',3],['Xavier',2],['Byron',2],['Wilson',2]], last: [] } ] },
    // Bolivien: Quechua/Aymara-Nachnamen kommen mit den Daten (Quispe, Mamani, Condori, Choque)
    BOL: { regions: [ { w:1, first: [['Juan',5],['José',4],['Luis',4],['Carlos',4],['Jorge',3],['Marco',3],['Mario',3],['Fernando',3],['Freddy',3],['Wilmer',2],['Limbert',2],['Edwin',2]], last: [] } ] },
    PUR: { regions: [ { w:1, first: [['José',5],['Luis',4],['Carlos',4],['Juan',4],['Ángel',3],['Jorge',3],['Héctor',3],['Rafael',3],['Pedro',2],['Javier',2],['Edwin',2],['Ramón',2]], last: [] } ] },
    PHI: { regions: [ { w:1, first: [['Jose',4],['Juan',3],['Mark',4],['John',4],['Michael',3],['Rodel',3],['Ramon',3],['Antonio',3],['Rogelio',2],['Ronaldo',2],['Danilo',2],['Romeo',2]], last: [] } ] }
};

const OPS = {};

module.exports = { CFG, POOLS, OPS };
