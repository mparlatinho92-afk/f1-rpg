// Paket 8b – landestypische Sprachregister. Format wie CIRCUIT_NAME_POOLS.
// Eintrag = String ODER [muster, gewicht] ODER [muster, {e50,e62,e76,e94,e10}]
// Stadtkurs-Muster sind mit // STADT markiert.

const CIRCUIT_PATTERN_8B = {
  // ===== EUROPA =====
  pl: [['Tor {loc}', 10],
       ['Tor Wyścigowy {loc}', { e50: 4, e62: 4, e76: 3, e94: 2, e10: 1 }],
       ['Autodrom {loc}', { e62: 2, e76: 4, e94: 5, e10: 5 }],
       ['{loc} Ring', { e94: 2, e10: 4 }],
       ['Tor Uliczny {loc}', { e76: 2, e94: 2, e10: 3 }]], // STADT
  ro: [['Circuitul {loc}', 10],
       ['Autodromul {loc}', { e62: 2, e76: 3, e94: 3, e10: 2 }],
       ['{loc} Ring', { e94: 3, e10: 5 }],
       ['{loc} Motor Park', { e10: 3 }],
       ['Circuitul Stradal {loc}', { e76: 2, e94: 3, e10: 3 }]], // STADT
  ua: [['Avtodrom {loc}', 10],
       ['Trasa {loc}', { e50: 4, e62: 4, e76: 3, e94: 1 }],
       ['{loc} Ring', { e94: 3, e10: 5 }],
       ['{loc} Circuit', { e94: 3, e10: 4 }],
       ['{loc} City Circuit', { e76: 1, e94: 2, e10: 3 }]], // STADT
  gr: [['{loc} Circuit', 10],
       ['{loc} Racing Circuit', { e62: 3, e76: 4, e94: 5, e10: 4 }],
       ['{loc} Autodrome', { e50: 3, e62: 3, e76: 2, e94: 1 }],
       ['{loc} Motor Racing Circuit', { e50: 3, e62: 2 }],
       ['{loc} Street Circuit', { e76: 2, e94: 3, e10: 4 }]], // STADT
  rs: [['Staza {loc}', 10],
       ['Automotodrom {loc}', { e50: 4, e62: 6, e76: 6, e94: 4, e10: 3 }],
       ['Autodrom {loc}', { e76: 3, e94: 5, e10: 6 }],
       ['{loc} Ring', { e94: 2, e10: 3 }],
       ['Gradska Staza {loc}', { e76: 2, e94: 2, e10: 3 }]], // STADT
  bg: [['Pista {loc}', 10],
       ['Avtodrom {loc}', { e62: 3, e76: 4, e94: 4, e10: 3 }],
       ['{loc} Ring', { e94: 2, e10: 4 }],
       ['Gradska Pista {loc}', { e76: 2, e94: 2, e10: 3 }]], // STADT
  ee: [['{loc} Ring', 10],
       ['{loc} Circuit', { e94: 3, e10: 4 }],
       ['{loc} Racing Park', { e10: 2 }],
       ['{loc} Street Circuit', { e76: 2, e94: 2, e10: 3 }]], // STADT
  no: [['{loc}banen', 10],
       ['{loc} Ring', { e62: 2, e76: 3, e94: 3, e10: 3 }],
       ['{loc} Motorsenter', { e76: 3, e94: 5, e10: 5 }],
       ['{loc} Motorpark', { e94: 2, e10: 4 }],
       ['{loc} Raceway', { e94: 1, e10: 3 }],
       ['{loc} Gatebane', { e76: 1, e94: 2, e10: 3 }]], // STADT
  dk: [['{loc}ringen', 10],
       ['{loc} Park', { e50: 5, e62: 5, e76: 4, e94: 3, e10: 2 }],
       ['{loc} Ring', { e62: 2, e76: 3, e94: 3, e10: 3 }],
       ['Ring {loc}', { e94: 3, e10: 4 }],
       ['{loc} Street Circuit', { e76: 1, e94: 2, e10: 3 }]], // STADT
  ie: [['{loc} Circuit', 10],
       ['{loc} Park', { e50: 8, e62: 8, e76: 6, e94: 5, e10: 4 }],
       ['{loc} Road Circuit', { e50: 4, e62: 3, e76: 2 }],
       ['{loc} Motor Racing Circuit', { e50: 3, e62: 2 }],
       ['{loc} International Raceway', { e94: 2, e10: 3 }],
       ['{loc} Street Circuit', { e76: 2, e94: 2, e10: 3 }]], // STADT
  lu: [['Circuit de {loc}', 10],
       ['Circuit {loc}', 5],
       ['{loc}ring', { e50: 3, e62: 3, e76: 2 }],
       ['Circuit Urbain de {loc}', { e76: 2, e94: 3, e10: 3 }]], // STADT

  // ===== AFRIKA / NAHOST =====
  fr_af: [['Circuit de {loc}', 10],
          ['Circuit Routier de {loc}', { e50: 3, e62: 2 }],
          ['Autodrome de {loc}', { e50: 3, e62: 4, e76: 3, e94: 2, e10: 1 }],
          ['Circuit International de {loc}', { e76: 2, e94: 4, e10: 5 }],
          ['Circuit Urbain de {loc}', { e76: 2, e94: 3, e10: 4 }]], // STADT
  en_af: [['{loc} Circuit', 10],
          ['{loc} Park', { e50: 6, e62: 6, e76: 4, e94: 2, e10: 1 }],
          ['{loc} Motor Racing Circuit', { e50: 3, e62: 2 }],
          ['{loc} Raceway', { e76: 2, e94: 3, e10: 4 }],
          ['{loc} International Circuit', { e76: 2, e94: 4, e10: 5 }],
          ['{loc} Street Circuit', { e76: 2, e94: 2, e10: 3 }]], // STADT
  eg: [['{loc} Circuit', 10],
       ['Circuit de {loc}', { e50: 4, e62: 3, e76: 1 }],
       ['{loc} Motor Racing Circuit', { e50: 2, e62: 2 }],
       ['{loc} International Circuit', { e76: 2, e94: 4, e10: 5 }],
       ['{loc} Street Circuit', { e76: 2, e94: 2, e10: 3 }]], // STADT
  sa: [['{loc} Circuit', 10],
       ['{loc} Autodrome', { e50: 3, e62: 3, e76: 2 }],
       ['{loc} International Circuit', { e76: 2, e94: 4, e10: 6 }],
       ['{loc} Motorsport Park', { e10: 3 }],
       ['{loc} Speed Park', { e10: 2 }],
       ['{loc} Street Circuit', { e76: 1, e94: 2, e10: 4 }]], // STADT
  il: [['{loc} Circuit', 10],
       ['Maslul {loc}', { e50: 4, e62: 4, e76: 3, e94: 2, e10: 1 }],
       ['{loc} Motorsport Park', { e10: 3 }],
       ['{loc} Street Circuit', { e76: 1, e94: 2, e10: 3 }]], // STADT

  // ===== ASIEN =====
  th: [['{loc} Circuit', 10],
       ['{loc} International Circuit', { e76: 2, e94: 4, e10: 6 }],
       ['Sanam Khaeng {loc}', { e50: 3, e62: 3, e76: 2, e94: 1 }],
       ['{loc} Speedway', { e76: 1, e94: 2, e10: 2 }],
       ['{loc} Street Circuit', { e76: 2, e94: 3, e10: 3 }]], // STADT
  id: [['Sirkuit {loc}', 10],
       ['Sirkuit Internasional {loc}', { e76: 2, e94: 4, e10: 5 }],
       ['Sirkuit Balap {loc}', { e50: 3, e62: 3, e76: 2 }],
       ['{loc} International Circuit', { e94: 2, e10: 3 }],
       ['Sirkuit Jalan Raya {loc}', { e76: 1, e94: 2, e10: 3 }]], // STADT
  ph: [['{loc} Circuit', 10],
       ['{loc} Race Track', { e50: 3, e62: 3, e76: 2 }],
       ['{loc} Racing Circuit', { e76: 3, e94: 4, e10: 4 }],
       ['{loc} International Speedway', { e94: 3, e10: 4 }],
       ['{loc} International Raceway', { e94: 2, e10: 3 }],
       ['{loc} Street Circuit', { e76: 2, e94: 2, e10: 3 }]], // STADT

  // ===== SÜDAMERIKA =====
  es_am: [['Autódromo de {loc}', 10],
          ['Autódromo {loc}', 4],
          ['Circuito de {loc}', 5],
          ['Autódromo Municipal de {loc}', { e50: 3, e62: 3, e76: 2 }],
          ['Autódromo Internacional de {loc}', { e62: 2, e76: 4, e94: 5, e10: 6 }],
          ['Circuito Callejero de {loc}', { e76: 2, e94: 3, e10: 3 }]], // STADT
};

const RACE_PATTERN_8B = {
  // ===== EUROPA =====
  pl: [['{loc} Grand Prix', 12], ['Grand Prix {loc}', 8],
       ['Kryterium {loc}', { e50: 3, e62: 2, e76: 1 }]],
  ro: [['{loc} Grand Prix', 12], ['Grand Prix {loc}', 6],
       ['Trofeul {loc}', { e50: 4, e62: 3, e76: 2 }],
       ['Cupa {loc}', { e50: 3, e62: 2, e76: 1 }]],
  ua: [['{loc} Grand Prix', 12], ['Grand Prix {loc}', 6]],
  gr: [['{loc} Grand Prix', 12], ['Grand Prix of {loc}', 4],
       ['{loc} Trophy', { e50: 3, e62: 2, e76: 1 }]],
  rs: [['Grand Prix {loc}', 12], ['{loc} Grand Prix', 6],
       ['Kup {loc}', { e50: 3, e62: 2, e76: 1 }]],
  bg: [['Golyamata nagrada na {loc}', 12],
       ['{loc} Grand Prix', { e94: 4, e10: 6 }],
       ['Kupa na {loc}', { e50: 4, e62: 3, e76: 2 }]],
  ee: [['{loc} Grand Prix', 12], ['Grand Prix {loc}', 5]],
  no: [['{loc} Grand Prix', 12],
       ['{loc}-løpet', { e50: 4, e62: 3, e76: 2 }],
       ['{loc} Pokalløp', { e50: 3, e62: 2, e76: 1 }]],
  dk: [['{loc} Grand Prix', 12], ['Grand Prix {loc}', 4],
       ['{loc}-løbet', { e50: 4, e62: 3, e76: 2 }]],
  ie: [['{loc} Grand Prix', 12],
       ['{loc} Trophy', { e50: 5, e62: 4, e76: 2 }],
       ['{loc} Cup', { e50: 3, e62: 2, e76: 1 }]],
  lu: [['Grand Prix de {loc}', 12], ['Grand Prix {loc}', 4],
       ['Coupe de {loc}', { e50: 4, e62: 3, e76: 1 }]],

  // ===== AFRIKA / NAHOST =====
  fr_af: [['Grand Prix de {loc}', 12],
          ['Coupe de {loc}', { e50: 4, e62: 3, e76: 1 }],
          ['Trophée de {loc}', { e50: 3, e62: 2, e76: 1 }]],
  en_af: [['{loc} Grand Prix', 12],
          ['{loc} Trophy', { e50: 4, e62: 3, e76: 1 }],
          ['{loc} Cup', { e50: 3, e62: 2, e76: 1 }]],
  eg: [['{loc} Grand Prix', 12],
       ['Grand Prix de {loc}', { e50: 4, e62: 3, e76: 1 }],
       ['{loc} Cup', { e50: 3, e62: 2, e76: 1 }]],
  sa: [['{loc} Grand Prix', 12],
       ['{loc} Cup', { e50: 3, e62: 2, e76: 1 }]],
  il: [['{loc} Grand Prix', 12], ['Grand Prix {loc}', 4]],

  // ===== ASIEN =====
  th: [['{loc} Grand Prix', 12],
       ['{loc} Trophy', { e50: 3, e62: 2, e76: 1 }],
       ['{loc} Speed Festival', { e10: 2 }]],
  id: [['Grand Prix {loc}', 12], ['{loc} Grand Prix', 4],
       ['Piala {loc}', { e50: 4, e62: 3, e76: 2 }]],
  ph: [['{loc} Grand Prix', 12],
       ['{loc} Trophy', { e50: 3, e62: 2, e76: 1 }],
       ['{loc} Cup', { e50: 3, e62: 2, e76: 1 }]],

  // ===== SÜDAMERIKA =====
  es_am: [['Gran Premio de {loc}', 12],
          ['Gran Premio Ciudad de {loc}', { e50: 3, e62: 3, e76: 2, e94: 1 }],
          ['Copa {loc}', { e50: 4, e62: 3, e76: 1 }]],
};

// Welcher IOC-Code auf welches Register zeigt: 26 Nationen -> 18 Register.
const CIRCUIT_NATION_KEY_8B = {
  POL: 'pl', ROU: 'ro', UKR: 'ua', GRE: 'gr', SRB: 'rs', BUL: 'bg', EST: 'ee',
  NOR: 'no', DEN: 'dk', IRL: 'ie', LUX: 'lu',
  CIV: 'fr_af', MAR: 'fr_af', KEN: 'en_af', ZIM: 'en_af',
  EGY: 'eg', SAU: 'sa', ISR: 'il',
  THA: 'th', INA: 'id', PHI: 'ph',
  COL: 'es_am', VEN: 'es_am', CHI: 'es_am', PER: 'es_am', URU: 'es_am',
};

/* =====================================================================
   BEGRÜNDUNG JE NATION (reale Vorbilder, nur Bauform übernommen)
   ---------------------------------------------------------------------
   POL  Tor Poznań, Tor Łódź, Autodrom Jastrząb; Silesia Ring (modern).
   ROU  Transilvania Motor Ring, Motor Park Romania, Bucharest Ring (Stadtkurs 2007/08).
   UKR  Avtodrom Chaika (Kyjiw), sowjetische „Avtodrom"-Tradition.
   GRE  Serres Racing Circuit (englisch beschildert); griech. Form braucht Genitiv.
   SRB  Jugoslawische Bauform (Automotodrom Grobnik), GP Belgrad 1939.
   BUL  Pista Drakon; „Golyamata nagrada na" = GP-Form, Bulgarisch ohne Kasus.
   EST  Auto24ring, Audru ring, Pirita-Kose ring.
   NOR  Rudskogen Motorsenter, Vålerbanen, Gardermoen Motorpark, Arctic Circle Raceway.
   DEN  Jyllandsringen, Padborg Park, Ring Djursland, Roskilde Ring.
   IRL  Mondello Park, Phoenix Park, Dundrod (Road Circuit), Leinster Trophy.
   LUX  Französisch als Hauptsprache, deutsches „-ring" nur früh.
   CIV/MAR  Circuit d'Ain-Diab (GP du Maroc 1958), GP d'Agadir, Circuit Moulay El Hassan.
   KEN/ZIM  Rhodesian GP, Kumalo Circuit, Donnybrook Park; Kenia gleiche brit. Bauform.
   EGY  Englisch, frühe frankophone Schicht (50er/60er).
   SAU  Jeddah Corniche Circuit, Reem International Circuit, Dirab Motorsport Park, Qiddiya.
   ISR  Englisch; Jerusalem F1-Showfahrten 2011–13 als Stadtveranstaltung.
   THA  Chang International Circuit, Bira Circuit, Thailand Circuit, Bang Saen Street Circuit.
   INA  Sirkuit Sentul (Internasional), Sirkuit Ancol, Mandalika; „Grand Prix Indonesia".
   PHI  Clark Int. Speedway, Batangas Racing Circuit, Subic Int. Raceway, Carmona Race Track.
   COL/VEN/CHI/PER/URU  Tocancipá, Turagua, Pancho Pepe Croquer, Las Vizcachas, Codegua,
        La Chutana, Santa Rosa, El Pinar; Stadtkurse Los Próceres, Piriápolis, Punta del Este.

   ZUSAMMENGELEGT
   ---------------------------------------------------------------------
   fr_af  <- CIV, MAR
   en_af  <- KEN, ZIM
   es_am  <- COL, VEN, CHI, PER, URU

   NÖTIGE NACHBEARBEITUNG IM CODE (bitte beim Einbau lösen)
   ---------------------------------------------------------------------
   1. Präfixe vor dem Einsetzen entfernen: /^Kota / (INA), /^Municipio / (VEN).
   2. Französische Elision (lu, fr_af, eg): „de " vor Vokal/stummem h -> „d'"
      (Circuit d'Esch, Grand Prix d'Abidjan, Circuit d'Agadir).
   3. Spanisch (es_am): „de El " -> „del " (Autódromo del Callao).
   4. Komposita (no: {loc}banen, dk: {loc}ringen, lu: {loc}ring): bei mehrteiligen
      Ortsnamen (Leerzeichen im loc) auf ein anderes Muster ausweichen.

   UNSICHERHEITEN (hier bitte prüfen)
   ---------------------------------------------------------------------
   - POL „Tor Uliczny {loc}": Polnisch sagt meist „tor uliczny w …" (Lokativ).
   - POL „Kryterium {loc}", SRB „Kup {loc}": Bei Städten ist Genitiv üblicher; schwach gewichtet.
   - UKR „Trasa {loc}", NOR „{loc} Gatebane", NOR „{loc} Pokalløp": nicht als Strecken-/
     Rennname belegt, nur sprachlich plausibel.
   - EST „{loc} Ring": Estnisch verlangt eigentlich Genitiv (Tallinna ring); die
     englisch gelesene Form umgeht das, klingt aber leicht nach Marke.
   - IRL „Park": bewusst über der Leitplanke (irische Tradition).
   - ISR „Maslul {loc}": grammatisch sauber (Constructus unverändert), aber nicht
     als lateinische Streckenbezeichnung belegt.
   - THA „Sanam Khaeng {loc}" (RTGS): Lokalfarbe, nicht beschildert belegt.
   - THA „{loc} Speedway": dünn belegt (eher Kart/Drag).
   - INA „Sirkuit Jalan Raya {loc}": korrekt, offiziell aber englisch „Street Circuit".
   - es_am „Autódromo Municipal de {loc}": v. a. argentinisch belegt.
   - es_am „Copa {loc}": bei Städten ist „Copa Ciudad de …" häufiger.
   - EGY/CIV frühe Ären: Rennbetrieb vor Ort kaum belegt, Plausibilitätsannahme.
   - Leitplanke „Street erst ab e76" durchgehalten, obwohl VEN (Los Próceres 1955–57)
     eine belegbare frühe Ausnahme wäre.
   - Bewusst weggelassen: arabisch „Halbat {loc}", Swahili-Formen (nicht beschildert belegt).
   ===================================================================== */
