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
// ═══ WELLE 3 (2026-07-18): USA r1 hispanisch · SWE r1 ex-jugoslawisch · ZIM r1 ═══
//
// USA r1: „Carlos Anderson" traf 1 von 11 US-Fahrern (hisp. Vorname × anglo
//   Nachname, Zufallsprodukt im Ein-Topf). KEIN minYear — Hispanics sind seit
//   jeher da; Motorsport-Anker Aric Almirola (NASCAR), Pedregon-Brüder (NHRA).
//   w 0.12 ≈ gemessener Census-gedämpfter Nachnamen-Anteil (12,3 %).
//   Anglo-Rufnamen bleiben via Shared-Route [0,1] ziehbar („Kyle Gonzalez" =
//   häufigster Real-Fall der 2./3. Generation).
// SWE r1: Anker Dino Beganovic (Ferrari-Junior, schwedische Lizenz). Bosnien-
//   Flüchtlinge 1992–95 → in Schweden geborene Generation debütiert ab ~2015.
//   w 0.03 (~2 % Bevölkerung ex-jugoslawisch, Motorsport-Anker rechtfertigt
//   leichte Übergewichtung). Nachnamen kommen per Route aus dem BALKAN-Ban
//   frei (Build-Edit e — Ban lief vor Route). ABGRENZUNG: der VERWORFENE
//   Global-BALKAN-Ban (§4 BRIEF-AUSBAU) war ein Ban für 20 Nationen ohne
//   Anker — dies ist eine Region für EINE Nation MIT Anker.
// ZIM r1: Rhodesien-Pool war komplett weiß (GB-Leihe) — korrekt für die
//   Kolonial-/UDI-Ära, aber nach 1980 fehlte die schwarze Mehrheit völlig.
//   Anker Axcil Jefferies (schwarzer Simbabwer, GP2/F2 2010er). minYear 1995
//   (Unabhängigkeit 1980 + Mittelschichts-Aufbau → Debüts ab Mitte 90er),
//   w 0.12 (aspirational-fair wie RSA r2; Grids blieben weiß-dominiert).
//   Kuratiert (Shona/Ndebele) — ZIM hat keine Datenbasis.
const NEW_REGIONS = {
    // WELLE 4 (2026-07-18): RSA r3 — kapmalaiisch / Cape Coloured, minYear 1995.
    // Vornamen sind bewusst afrikaans-/englischsprachig, NICHT Nguni: die Gruppe
    // spricht Afrikaans bzw. Englisch als Erstsprache. Deshalb eine eigene Region
    // statt die Namen nach r2 (Zulu/Xhosa/Sotho) zu schieben — „Thabo Plaatjies"
    // wäre genauso falsch wie „Christopher Plaatjies" im Jahr 1962.
    // Der kapmalaiisch-muslimische Anteil (Mogamat, Achmat, Yusuf, Faried) ist
    // Teil derselben Gruppe und hier mit drin.
    RSA: {
        w: 0.05, minYear: 1995,
        first: [
            ['Ashley', 3], ['Wayne', 3], ['Chad', 3], ['Denzil', 2], ['Bradley', 3], ['Shaun', 3],
            ['Clint', 2], ['Jerome', 2], ['Randall', 2], ['Ashwin', 2], ['Ricardo', 2], ['Lee', 2],
            ['Damian', 2], ['Marlon', 2], ['Quinton', 2], ['Garth', 2], ['Byron', 2], ['Kurt', 2],
            ['Dean', 2], ['Ryan', 3], ['Craig', 2], ['Warren', 2], ['Rowan', 1], ['Delano', 1],
            ['Cheslin', 1], ['Juan', 1], ['Elton', 1], ['Keegan', 2], ['Devon', 2],
            // kapmalaiisch-muslimisch
            ['Mogamat', 2], ['Achmat', 2], ['Yusuf', 2], ['Faried', 1], ['Riedwaan', 1],
            ['Nazeem', 1], ['Shafiek', 1], ['Igshaan', 1], ['Tauriq', 1]
        ],
        last: [
            ['Hendricks', 4], ['Fortuin', 3], ['Arendse', 3], ['September', 3], ['Plaatjies', 3],
            ['Witbooi', 2], ['Cupido', 2], ['Malgas', 2], ['Julies', 2], ['Damons', 2],
            ['Adonis', 2], ['Afrika', 2], ['Baartman', 2], ['Maarman', 2], ['Sampson', 2],
            ['Appolis', 1], ['Kleinsmit', 1], ['Windvogel', 1], ['Klaasen', 1], ['Rooi', 1],
            ['October', 1], ['Januarie', 1], ['Februarie', 1], ['Plaatje', 1], ['Hendrikse', 1]
        ]
    },
    USA: {
        w: 0.12, // hispanisch — KEIN minYear
        // Anglo-Kopf (Michael…Tyler) bewusst mit drin: 2./3. Generation trägt
        // überwiegend Anglo-Rufnamen — r1 heißt „hispanische FAMILIEN", nicht
        // „spanische Vornamen". Dieselben Namen bleiben auch in r0 (geteilt).
        first: [
            ['José', 3], ['Juan', 3], ['Carlos', 3], ['Luis', 2], ['Miguel', 2], ['Jorge', 2],
            ['Ricardo', 2], ['Roberto', 2], ['Javier', 2], ['Sergio', 2], ['Rafael', 1], ['Pedro', 1],
            ['Alejandro', 1], ['Fernando', 1], ['Hector', 1], ['Cesar', 1], ['Ruben', 1], ['Raul', 1],
            ['Michael', 3], ['David', 3], ['Chris', 2], ['Kevin', 2], ['Eric', 2], ['Anthony', 2],
            ['Ryan', 2], ['Kyle', 2], ['Danny', 2], ['Justin', 2], ['Tyler', 2], ['Austin', 1],
            ['Dylan', 1], ['Brandon', 1]
        ],
        last: [
            ['Garcia', 4], ['Rodriguez', 4], ['Martinez', 4], ['Hernandez', 3], ['Lopez', 3],
            ['Gonzalez', 3], ['Perez', 3], ['Sanchez', 3], ['Ramirez', 2], ['Torres', 2],
            ['Flores', 2], ['Rivera', 2], ['Gomez', 2], ['Diaz', 2], ['Cruz', 1], ['Reyes', 1],
            ['Morales', 1], ['Gutierrez', 1], ['Ortiz', 1], ['Chavez', 1], ['Ruiz', 1], ['Mendoza', 1]
        ]
    },
    SWE: {
        w: 0.03, minYear: 2015, // ex-jugoslawisch (bosnisch dominiert)
        first: [
            ['Dino', 3], ['Armin', 3], ['Edin', 2], ['Emir', 2], ['Adnan', 2], ['Amar', 2],
            ['Almir', 2], ['Adis', 2], ['Haris', 2], ['Kenan', 2], ['Tarik', 1], ['Mirza', 1],
            ['Damir', 1], ['Semir', 1], ['Senad', 1], ['Eldar', 1], ['Jasmin', 1], ['Zlatan', 1]
        ],
        last: [
            ['Begović', 3], ['Hodžić', 3], ['Hadžić', 2], ['Delić', 2], ['Mujić', 2], ['Alić', 2],
            ['Salihović', 2], ['Ibrahimović', 2], ['Kovačević', 2], ['Mehmedović', 1], ['Softić', 1],
            ['Halilović', 1], ['Omerović', 1], ['Suljić', 1], ['Zukić', 1], ['Ahmetović', 1]
        ]
    },
    ZIM: {
        w: 0.12, minYear: 1995, // schwarz-simbabwisch (Shona/Ndebele)
        first: [
            ['Tapiwa', 3], ['Tendai', 3], ['Tinashe', 3], ['Farai', 2], ['Tafadzwa', 2],
            ['Kudakwashe', 2], ['Takudzwa', 2], ['Tawanda', 2], ['Munyaradzi', 1], ['Simba', 2],
            ['Panashe', 1], ['Anesu', 1], ['Munashe', 1], ['Nyasha', 1], ['Tanaka', 1], ['Blessing', 1]
        ],
        last: [
            ['Moyo', 3], ['Ncube', 3], ['Sibanda', 3], ['Dube', 3], ['Ndlovu', 2], ['Nkomo', 2],
            ['Mpofu', 2], ['Mhlanga', 2], ['Masuku', 1], ['Gumbo', 1], ['Shumba', 1], ['Marufu', 1],
            ['Mutasa', 1], ['Makoni', 1], ['Chiweshe', 1], ['Mawere', 1], ['Nyoni', 1], ['Phiri', 1]
        ]
    },
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
    },
    // WELLE 3 — USA r0: kuratierte hispanische Köpfe ziehen nach r1 um
    // (Kuration schlägt Route — ohne Patch blieben José/Garcia in r0 und
    // „Carlos Anderson" ziehbar). modern-Fenster minus José/Juan/Carlos/Luis,
    // last minus Garcia/Martinez/Hernandez/Rodriguez/Lopez/Rivera (alle stehen
    // in NEW_REGIONS.USA.last). Nguyen/Patel bleiben bewusst r0: Anglo-Vorname
    // + asiatischer Nachname ist der reale 2.-Generations-Normalfall, und
    // asiatische VORNAMEN existieren in den US-Daten praktisch nicht.
    USA: {
        0: {
            first: {
                early:  [['Bill',5],['Jim',5],['Bob',5],['Jack',4],['Dan',4],['Sam',3],['Tony',3],['Eddie',3],['Johnny',3],['Don',3],['Chuck',2],['Gene',2],['Lee',2],['Richie',2],['Walt',1],['Rodger',1]],
                mid:    [['Michael',5],['John',5],['David',5],['Chris',4],['Mark',4],['Scott',4],['Jeff',4],['Brian',4],['Kevin',4],['Eric',4],['Anthony',4],['Jason',4],['Ryan',3],['Josh',3],['Justin',3],['Brad',3],['Kyle',3],['Danny',3],['Casey',2],['Chad',2]],
                modern: [['Tyler',4],['Austin',4],['Mason',4],['Ethan',4],['Jake',4],['Zach',4],['Connor',4],['Dylan',4],['Liam',4],['Noah',4],['Chase',3],['Cole',3],['Logan',3],['Colton',3],['Hunter',3],['Josef',1]]
            },
            last: [['Smith',5],['Johnson',5],['Williams',4],['Brown',4],['Jones',4],['Miller',4],['Davis',4],['Wilson',4],['Anderson',4],['Taylor',4],['Moore',4],['Jackson',3],['White',3],['Harris',3],['Thompson',3],['Robinson',3],['Clark',3],['Lewis',3],['Walker',3],['Hall',3],['Carter',3],['Young',2],['Allen',2],['Lee',2],['Mitchell',2],['Parker',2],['Turner',2],['Nguyen',1],['Patel',1]]
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
    // WELLE 4 (2026-07-18): r3 kapmalaiisch/Cape Coloured ergänzt, minYear 1995.
    // Die Namen (Plaatjies, Arendse, Cupido, Fortuin, September, Witbooi …) lagen
    // bis dahin ungegated in r0 = 7,8 % der Ziehungen → „Christopher Plaatjies"
    // war 1962 ziehbar. In der Apartheid-Ära war der Rundstreckensport für
    // Coloured-Fahrer genauso verschlossen wie für schwarze, also dasselbe Gate.
    // 0.05 statt Bevölkerungsanteil (8,9 %): dieselbe Motorsport-Untergewichtung
    // wie bei r2, plus die mehrdeutigen Namen bleiben in r0 (s.u.) und tragen
    // faktisch einen Teil dieser Gruppe schon.
    RSA: { action: 'change', w: [0.43, 0.33, 0.19, 0.05], wAlt: [0.45, 0.35, 0.20],
        beleg: 'R2 (afrikanisch) 30 % überzeichnet die Motorsport-Realität: SA-Rundstrecken-Grids sind auch ' +
               'nach 1995 mehrheitlich weiß; schwarze Fahrer existieren (Gugu Zulu, Tschops Sipuka) aber als ' +
               'Minderheit. 19 % bleibt aspirational-fair, 43/33 spiegelt anglo/afrikaans-Rennszene (Scheckter×2 ' +
               'anglo; van der Merwe, Niemann afrikaans). R3 Coloured 5 % — Kapstadt-Kartszene belegt ' +
               '(Killarney), aber keine F1-Präzedenz.' },
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
               'bisher per banFirst unterdrückt statt getrennt (D2-Kernfall).' },
    // ── WELLE 3 (2026-07-18) ──
    USA: { action: 'change', w: [0.88, 0.12], wAlt: [1.0],
        beleg: 'Neue Region 1 hispanisch (s. NEW_REGIONS.USA) — 12,3 % Census-gedämpfte Nachnamen-Masse; ' +
               '„Carlos Anderson" traf 1:11 im Ein-Topf. Anker Almirola/Pedregon. Kein minYear.' },
    SWE: { action: 'change', w: [0.97, 0.03], wAlt: [1.0],
        beleg: 'Neue Region 1 ex-jugoslawisch (s. NEW_REGIONS.SWE) — Anker Dino Beganovic (Ferrari-Junior, ' +
               'schwed. Lizenz); ~2 % Bevölkerung, minYear 2015 (Flüchtlinge 1992–95 → 2. Gen).' },
    ZIM: { action: 'change', w: [0.88, 0.12], wAlt: [1.0],
        beleg: 'Neue Region 1 schwarz-simbabwisch (s. NEW_REGIONS.ZIM) — Rhodesien-Ära korrekt weiß ' +
               '(Apartheid-Analog), ab 1995 Anker Axcil Jefferies. Aspirational-fair wie RSA r2.' }
};

module.exports = { NEW_REGIONS, WEIGHT_PROPOSALS, REGION_PATCHES };
