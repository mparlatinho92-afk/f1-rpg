// ============================================================================
// Paket J — region-defs.js: Regionsdefinitionen (D2) + Gewichts-Vorschläge (D3)
//
// EINBAU (Opus):
//   1. NEW_REGIONS.GER → als regions[1] an POOLS.GER anhängen (curated-base-v2.js
//      bleibt unangetastet — Anhängen im Build wie NEW_POOLS/KNOWLEDGE, ODER
//      direkt in curated-base-v2.js §GER; beides funktioniert, Build-Anhang ist
//      idempotenter). regions[0].w von 1 auf 0.96 senken.
//   2. WEIGHT_PROPOSALS: nur RSA + IND sind ÄNDERUNGEN, Rest ist bestätigter
//      Ist-Stand (Beleg je Zeile; Langfassung METHODIK §4).
//   3. EST: banFirst ersatzlos streichen (region-routes.js BAN_FIRST.EST = []),
//      Route EST_RU_FIRST → 1 übernimmt die Trennung. KEIN minYear (die
//      russischsprachige Minderheit ist alteingesessen, kein Einwanderungs-Gate).
// ============================================================================
'use strict';

// ── GER Region 1: türkisch-deutsch (D2 — ersetzt das banFirst-Unterdrücken) ──
// w: 0.04        — türkeistämmige Männer ≈ 4–5 % der Geburtsjahrgänge 1985–2010;
//                  Motorsport-Beteiligung leicht unterdurchschnittlich (Kart-Kosten,
//                  soziale Schichtung der Gastarbeiter-Generationen) → 0.04 statt 0.05.
//                  ⚠ Schätzung — kein prominenter deutsch-türkischer Formelfahrer
//                  als Anker (Kartszene/Slalom belegt Teilnahme, DMSB-Lizenzen).
// minYear: 1985  — Anwerbeabkommen 1961; erste in DE geborene Generation
//                  (Jahrgänge ~1963+) debütiert ab ~1985 (Debütalter ~20–22).
// Gewichte: an DE-Datenränge angelehnt (Ali #45 → 4; Mehmet #85 → 4; … Skala 1–5,
// der Build mappt via BUCKET und ersetzt Daten-Treffer durch echte Daten-Gewichte).
// Anzeigeform: türkische Orthographie (İ/ı/ğ/ş) NUR wo die Daten sie belegen —
// die DE-Daten schreiben überwiegend deutsch-tastaturiert (Yilmaz 4724 vs.
// Yılmaz 605) → Kuration folgt der häufigeren Form, GER steht in NO_ACCENT_NATIONS.
const NEW_REGIONS = {
    GER: {
        w: 0.04, minYear: 1985, // türkisch-deutsch
        first: [
            ['Ali', 4], ['Mehmet', 4], ['Mustafa', 4], ['Ahmet', 3], ['Hasan', 3], ['Murat', 3],
            ['Ibrahim', 3], ['Hüseyin', 3], ['Ismail', 3], ['Hakan', 3], ['Yusuf', 3], ['Deniz', 3],
            ['Emre', 3], ['Can', 3], ['Osman', 2], ['Fatih', 2], ['Metin', 2], ['Orhan', 2],
            ['Serkan', 2], ['Halil', 2], ['Kemal', 2], ['Burak', 2], ['Cem', 2], ['Kenan', 2],
            ['Gökhan', 2], ['Onur', 2], ['Mesut', 2], ['Volkan', 2], ['Baris', 1], ['Levent', 1],
            ['Tolga', 1], ['Kaan', 1], ['Mert', 1], ['Arda', 1], ['Efe', 1], ['Eren', 1]
        ],
        last: [
            ['Yilmaz', 4], ['Kaya', 4], ['Demir', 4], ['Yildirim', 3], ['Yildiz', 3], ['Celik', 3],
            ['Sahin', 3], ['Aydin', 3], ['Öztürk', 3], ['Arslan', 3], ['Dogan', 3], ['Özdemir', 3],
            ['Aslan', 2], ['Kara', 2], ['Kilic', 2], ['Kurt', 2], ['Polat', 2], ['Cetin', 2],
            ['Koc', 2], ['Sen', 2], ['Özkan', 2], ['Erdogan', 2], ['Bulut', 2], ['Simsek', 2],
            ['Acar', 1], ['Ünal', 1], ['Yalcin', 1], ['Turan', 1], ['Aktas', 1], ['Ates', 1],
            ['Tekin', 1], ['Güler', 1], ['Erdem', 1], ['Avci', 1], ['Uzun', 1], ['Bayram', 1]
        ]
    }
};

// ── D3: Regionsgewichte — Vorschlag + Beleg (Kurzform; METHODIK §4 = Langform) ──
// action: 'keep' = Ist-Stand bestätigt | 'change' = Änderung vorgeschlagen
const WEIGHT_PROPOSALS = {
    BEL: { action: 'keep', w: [0.55, 0.45],
        beleg: 'Motorsport-gewichtet BESTÄTIGT (Umkehrung der Bevölkerung ~32%W/58%F ist Absicht-kompatibel): ' +
               'F1-Historie massiv frankophon (Ickx, Boutsen, Gendebien, Frère, Mairesse, Pilette×2, Nève, ' +
               "d'Ambrosio, van de Poele ≈ 75–80 % der ~23 BEL-F1-Fahrer) vs. flämische Moderne (Vandoorne, " +
               'Kart-Hochburg Genk). 55/45 = fairer Kompromiss beider Epochen.' },
    SUI: { action: 'keep', w: [0.52, 0.31, 0.11, 0.06],
        beleg: 'Romandie+Tessin (42 %) bewusst über Bevölkerung (~31 %): 6 der ~10 CH-F1-Fahrer sind ' +
               'romand/tessinisch (Regazzoni TI, Moser TI, Siffert FR, de Graffenried VD, Buemi VD, Grosjean GE) ' +
               'gegen Surer BS, Foitek ZH. R3 portugiesisch 0.06 ≈ Bevölkerungsanteil (~3 %) ×2 — vertretbar, Diaspora jung.' },
    CAN: { action: 'keep', w: [0.55, 0.33, 0.12],
        beleg: 'Québec 33 % > Bevölkerung 22 % ist motorsport-belegt: Villeneuve×2, Carpentier, Tagliani = ' +
               'Mehrheit der CAN-F1/Champcar-Fahrer; anglo: Stroll (Montréal, anglophon), Latifi (Toronto).' },
    ESP: { action: 'keep', w: [0.80, 0.13, 0.07],
        beleg: 'Katalonien 13 % ≈ Bevölkerung (16 %), Motorsport-Kern Barcelona (Gené×2, de la Rosa, Alguersuari) ' +
               'stützt eher mehr; Baskenland 7 % ≥ Bevölkerung (5 %) — ohne prominenten Fahrer-Anker, ⚠ Setzung ok.' },
    FIN: { action: 'keep', w: [0.90, 0.10],
        beleg: 'Finnlandschweden 10 % = 2× Bevölkerungsanteil (5,2 %) — exakt der F1-Befund: ' +
               'Rosberg (Keke+Nico Wurzeln) von ~9 FIN-F1-Fahrern; bereits korrekt motorsport-gewichtet.' },
    GBR: { action: 'keep', w: [0.92, 0.08],
        beleg: 'Britisch-asiatisch 8 % ≈ Bevölkerung England 2021 (~9 %); Motorsport-Anker existiert ' +
               '(Enaam Ahmed, brit.-pakistanisch, F3-Champion 2017), Kart-Beteiligung wachsend. minYear 1995 plausibel ' +
               '(Haupteinwanderung 1960er–70er → 2. Generation debütiert ~1985–95).' },
    FRA: { action: 'keep', w: [0.90, 0.10],
        beleg: 'Maghreb/Westafrika 10 %: Anker Isack Hadjar (algerischstämmig, F1 2025) + Kart-Basis Banlieue; ' +
               'minYear 1995 passt (Hauptzuzug 1960er–70er, 2. Generation debütiert ab ~1990ern).' },
    RSA: { action: 'change', w: [0.45, 0.35, 0.20], wAlt: [0.40, 0.30, 0.30],
        beleg: 'R2 (afrikanisch) 30 % überzeichnet die Motorsport-Realität: SA-Rundstrecken-Grids sind auch ' +
               'nach 1995 mehrheitlich weiß; schwarze Fahrer existieren (Gugu Zulu, Tschops Sipuka) aber als ' +
               'Minderheit. 20 % bleibt aspirational-fair, 45/35 spiegelt anglo/afrikaans-Rennszene (Scheckter×2 ' +
               'anglo; van der Merwe, Niemann afrikaans).' },
    IND: { action: 'change', w: [0.50, 0.50], wAlt: [0.60, 0.40],
        beleg: 'Indiens Motorsport-Kernland ist der SÜDEN (Chennai/Coimbatore: MMRT, Kari Speedway): ' +
               'BEIDE indischen F1-Fahrer sind Südinder (Karthikeyan/Coimbatore, Chandhok/Chennai). ' +
               'Bevölkerung wäre 60/40 Nord — Motorsport-Gewichtung dreht auf 50/50.' },
    MAS: { action: 'keep', w: [0.55, 0.45],
        beleg: 'Chinesisch-malaysisch 45 % > Bevölkerung (~23 %) ist motorsport-korrekt: einziger MY-F1-Fahrer ' +
               'Alex Yoong ist chinesischstämmig; Kart-/GT-Szene chinesisch dominiert (Kaufkraft).' },
    EST: { action: 'keep', w: [0.75, 0.25],
        beleg: 'Russischsprachige ~24 % der Bevölkerung = 0.25 exakt; ⚠ Motorsport-Beleg dünn ' +
               '(est. Fahrer dominieren: Märtin, Vips, Aron), aber Junior-Breite rechtfertigt Bevölkerungsanker.' },
    GER: { action: 'change', w: [0.96, 0.04], wAlt: [1.0],
        beleg: 'Neue Region 1 türkisch-deutsch (s. NEW_REGIONS.GER) — größte Einwanderungsgruppe, ' +
               'bisher per banFirst unterdrückt statt getrennt (D2-Kernfall).' }
};

module.exports = { NEW_REGIONS, WEIGHT_PROPOSALS };
