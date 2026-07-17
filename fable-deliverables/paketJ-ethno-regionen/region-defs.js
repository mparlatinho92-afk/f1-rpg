// ============================================================================
// Paket J — region-defs.js: Regionsdefinitionen (D2) + Gewichts-Vorschläge (D3)
//
// EINBAU (Opus):
//   1. NEW_REGIONS.GER → als regions[1] an POOLS.GER anhängen (curated-base-v2.js
//      bleibt unangetastet — Anhängen im Build wie NEW_POOLS/KNOWLEDGE, ODER
//      direkt in curated-base-v2.js §GER; beides funktioniert, Build-Anhang ist
//      idempotenter). regions[0].w von 1 auf 0.96 senken.
//      [ERLEDIGT v0.9.14.80 — build-names-v3.js Z.371 pusht NEW_REGIONS generisch,
//       CAN r3 (AUSBAU) läuft über dieselbe Schleife automatisch mit.]
//   2. WEIGHT_PROPOSALS: nur RSA + IND sind ÄNDERUNGEN, Rest ist bestätigter
//      Ist-Stand (Beleg je Zeile; Langfassung METHODIK §4). [CAN jetzt 'change' — AUSBAU]
//   3. EST: banFirst ersatzlos streichen (region-routes.js BAN_FIRST.EST = []),
//      Route EST_RU_FIRST → 1 übernimmt die Trennung. KEIN minYear (die
//      russischsprachige Minderheit ist alteingesessen, kein Einwanderungs-Gate).
//
// EINBAU AUSBAU 2026-07-17 (Opus) — DREI Build-Edits nötig, sonst wirkungslos:
//   (a) CFG.CAN.route: kombinierten Eintrag [SOUTH_ASIAN|EAST_ASIAN → 2]
//       durch [SOUTH_ASIAN, 2], [EAST_ASIAN, 3] ersetzen (region-routes.js
//       ROUTE_LAST_REPLACE_NOTE — erster Treffer gewinnt, sonst frisst der
//       Kombi-Regex alles nach r2).
//   (b) OPS.CAN.move.last: 'Lau':2,'Cheng':2,'Chung':2 → jeweils :3 ändern
//       (Saini/Randhawa/Mann bleiben :2). Moves gewinnen über Routen.
//   (c) NEUE Wiring-Schleife für REGION_PATCHES (nach der NEW_REGIONS-Schleife,
//       vor WEIGHT_PROPOSALS):
//         for (const [nat, patches] of Object.entries(JDEFS.REGION_PATCHES || {}))
//             for (const [ri, patch] of Object.entries(patches))
//                 Object.assign(POOLS[nat].regions[ri], deepCopy(patch));
//   Reihenfolge im Build: NEW_REGIONS-push → REGION_PATCHES → WEIGHT_PROPOSALS
//   (der Längen-Check der Gewichts-Schleife verlangt 4 CAN-Regionen).
//   GRE braucht KEINEN Build-Edit — BAN_FIRST.GRE/BAN_LAST_ADD.GRE laufen über
//   die bestehende Paket-J-Verdrahtung.
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
// ── CAN Region 3: ostasiatisch-kanadisch (AUSBAU D2 — Split von r2) ─────────
// w: 0.05        — Chinesisch (4,7 %) + Koreanisch/Vietnamesisch (~1,5 %) der
//                  Bevölkerung (Census 2021), Motorsport-Anker: Samantha Tan
//                  (chinesisch-kanadische GT-Fahrerin/Teamgründerin ST Racing).
// minYear: 1990  — Gemeinden seit dem Eisenbahnbau (1880er), aber Head Tax 1885
//                  + Exclusion Act 1923–47 hielten sie klein; Motorsport-fähige
//                  Mittelschicht in Breite erst mit Punktesystem 1967 + Hongkong-
//                  Welle der 1970er/80er → deren in Kanada geborene Kinder
//                  debütieren ab ~1990 (Korrektur des zu späten minYear 2000).
// Vornamen: westliche Rufnamen sind die Daten-Realität der 2. Generation
// (das 0-%-Problem der Pinyin-Namen ist KEIN Datenfehler); der kuratierte Kopf
// unten hält zusätzlich eine kleine 1,5.-Generation-Präsenz (Wei/Ming/Minh/Jae).
const NEW_REGIONS = {
    CAN: {
        w: 0.05, minYear: 1990, // ostasiatisch-kanadisch (r3)
        first: [
            ['Kevin', 3], ['Jason', 3], ['Eric', 3], ['Andrew', 2], ['Brian', 2], ['Victor', 2],
            ['Ryan', 2], ['Justin', 2], ['Brandon', 2], ['Kelvin', 2], ['Alvin', 1], ['Wilson', 1],
            ['Wei', 1], ['Jun', 1], ['Ming', 1], ['Kai', 1], ['Minh', 1], ['Jae', 1]
        ],
        last: [
            ['Wong', 3], ['Chan', 3], ['Lee', 3], ['Li', 3], ['Chen', 2], ['Wang', 2],
            ['Zhang', 2], ['Liu', 2], ['Cheung', 2], ['Lam', 2], ['Nguyen', 2], ['Tran', 2],
            ['Kim', 2], ['Park', 1], ['Tsang', 1], ['Yuen', 1]
        ]
    },
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

// ── AUSBAU: Patches auf BESTEHENDE Regionen (Wiring-Schleife s. Kopf, Edit c) ──
// CAN r2 wird rein südasiatisch: minYear 2000→1990 (Sikh-Gemeinde BC seit 1905,
// Continuous-Journey-Sperre 1908–47 hielt sie klein; Punktesystem 1967 +
// Prosperität der 1970er/80er (Transport/Handel Surrey/Brampton) → in Kanada
// geborene Generation debütiert ab ~1990). Kuratierte first bleiben unverändert
// (Ryan/Justin/Kevin/Daniel/Arjun/Raj/Vikram/Nikhil — 2.-Generation-Mix ist
// datenreal); last verliert die ostasiatischen Köpfe an r3 (Wong/Chan/Lee/
// Nguyen/Kim), Rest unverändert.
const REGION_PATCHES = {
    CAN: {
        2: {
            minYear: 1990,
            last: [
                ['Singh', 4], ['Patel', 4], ['Gill', 3], ['Sharma', 3], ['Khan', 3], ['Sandhu', 3],
                ['Sidhu', 2], ['Dhaliwal', 2], ['Brar', 2]
            ]
        }
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
    // AUSBAU: 'keep' [0.55,0.33,0.12] → 'change' (r2-Split). r0/r1 unangetastet;
    // r2 0.12 wird 0.07 südasiatisch + 0.05 ostasiatisch (Census 2021: 2,6 Mio.
    // Südasiaten (7,1 %) vs. 1,7 Mio. Chinesen + Koreaner/Vietnamesen (~6 %);
    // Motorsport neutral bis leicht ostasiatisch (Samantha Tan) → Census-Ratio).
    CAN: { action: 'change', w: [0.55, 0.33, 0.07, 0.05], wAlt: [0.55, 0.33, 0.12],
        beleg: 'Québec 33 % > Bevölkerung 22 % ist motorsport-belegt: Villeneuve×2, Carpentier, Tagliani = ' +
               'Mehrheit der CAN-F1/Champcar-Fahrer; anglo: Stroll (Montréal, anglophon), Latifi (Toronto). ' +
               'AUSBAU: r2-Split 0.07/0.05 nach Census-Verhältnis Südasiaten:Ostasiaten ≈ 7:6.' },
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

module.exports = { NEW_REGIONS, WEIGHT_PROPOSALS, REGION_PATCHES };
