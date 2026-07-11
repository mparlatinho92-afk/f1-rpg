// ============================================================================
// Paket 1 — Live-Ticker-Kommentar-Bank (Fable-Deliverable, 2026-07-10)
// ============================================================================
// Inline-fähig (Grundregel 4): direkt in index.html einbetten, KEIN data/*.js.
//
// Struktur: LIVE_COMMENTARY[event][register] = [Templates]
//   Events:   start / pit / overtake / dnf_mechanical / dnf_accident / death / finish
//   Register: e50 (1950–61) / e62 (1962–75) / e76 (1976–93) / e94 (1994–2009) / e10 (2010+)
//
// Slots je Event (NUR diese, SPEC §1):
//   start:          {fieldSize} {totalLaps}
//   pit:            {driver} {team} {lap} {totalLaps} {pos}
//   overtake:       {driver} {victim} {lap} {pos}
//   dnf_mechanical: {driver} {team} {lap} {reason} {pos}
//   dnf_accident:   {driver} {team} {lap} {reason} {pos}
//   death:          {driver} {team} {lap}
//   finish:         {driver} {team}
//
// {reason} = fertiges DEUTSCHES Nomen aus der Opus-Map (artikel-frei einsetzbar:
//   „– {reason}.", „mit {reason}", „{reason} bei {driver}"). Die Map muss deshalb
//   Komposita liefern („Motorschaden", „Elektrikdefekt"), NIE Phrasen mit Artikel.
//
// Kein Seeding nötig (SPEC §0): Ticker ist ephemer → Math.random genügt.
// Emojis sind Teil der Templates (konsistent zum Ist-Stil: 🔧 ⚡ ❌ 💀 🏁).
//
// Fakten-Leitplanken, die in JEDER Zeile eingehalten sind (SPEC §5):
//   – keine Wertungs-/Titel-/Souveränitäts-Aussagen (Endergebnis unbekannt)
//   – Positionen nur über {pos} („aktuell P{pos}"), nie „geht in Führung"
//   – dnf_*: nur der übergebene {reason}, keine erfundene Schadensart/Ursache,
//     kein Ort („Bremszone", „Kiesbett"), keine Schuldzuweisung
//   – dnf_accident: NIE „unverletzt ausgestiegen" o.ä. — das death-Event kann
//     unmittelbar danach feuern!
//   – death: nüchtern, keine Ursache, keine medizinischen Details (SPEC §4)
// ============================================================================

const LIVE_COMMENTARY = {

    // ── START — 1× pro Rennen ──────────────────────────────────────────────
    start: {
        e50: [
            '🏁 Die Flagge fällt! {fieldSize} Piloten stürzen sich in die erste Kurve – {totalLaps} Runden liegen vor ihnen.',
            '🏁 Der Grand Prix ist eröffnet! {fieldSize} Wagen donnern von der Startlinie.',
            '🏁 Start frei! Über {totalLaps} Runden wird heute um Ruhm und Ehre gefahren.',
            '🏁 Die Motoren brüllen auf – das Feld von {fieldSize} Wagen setzt sich in Bewegung!',
            '🏁 Es ist soweit: {fieldSize} tapfere Piloten nehmen die {totalLaps} Runden in Angriff.',
            '🏁 Mit ohrenbetäubendem Donner rollt das Feld an – der große Preis über {totalLaps} Runden hat begonnen!',
            '🏁 Startschuss! Staub, Lärm und {fieldSize} Wagen im Kampf um die erste Kurve.',
            '🏁 Das Rennen ist gestartet – {totalLaps} Runden Prüfung für Mensch und Maschine.'
        ],
        e62: [
            '🏁 Start! {fieldSize} Fahrer gehen auf die {totalLaps} Runden.',
            '🏁 Die Flagge fällt – das Feld von {fieldSize} Wagen ist unterwegs!',
            '🏁 Sauberer Ablauf beim Losfahren – vor den Fahrern liegen {totalLaps} Runden.',
            '🏁 Das Feld hat sich in Bewegung gesetzt – {fieldSize} Wagen im Getümmel der ersten Runde.',
            '🏁 Der Grand Prix läuft! {totalLaps} Runden stehen auf dem Programm.',
            '🏁 Los geht es – {fieldSize} Fahrer, {totalLaps} Runden, alles offen.',
            '🏁 Start zum Grand Prix – die erste Kurve verlangt gleich volle Konzentration.',
            '🏁 Die Startflagge ist gefallen – {fieldSize} Fahrer im Kampf um die ersten Meter.'
        ],
        e76: [
            '🏁 Start! {fieldSize} Autos jagen in die erste Kurve!',
            '🏁 Grün! Das Feld schießt davon – {totalLaps} Runden liegen vor uns.',
            '🏁 Das Feld ist weg! {fieldSize} Autos im Pulk Richtung erste Kurve – enger geht es kaum.',
            '🏁 Start frei zum großen Preis – {fieldSize} Autos, {totalLaps} Runden, volle Attacke!',
            '🏁 Und sie sind unterwegs! Die erste Runde von {totalLaps} läuft.',
            '🏁 Turbulente erste Meter – {fieldSize} Autos kämpfen um jede Lücke!',
            '🏁 Es ist angerichtet: {totalLaps} Runden Renn-Action ab jetzt!',
            '🏁 Los geht’s! Das Feld von {fieldSize} Autos stürmt davon.'
        ],
        e94: [
            '🏁 Die Lichter erlöschen – Start zum Grand Prix! {fieldSize} Autos auf {totalLaps} Runden.',
            '🏁 Start! Das Feld biegt in die erste Runde von {totalLaps} ein.',
            '🏁 Es ist los! {fieldSize} Autos, {totalLaps} Runden – die Strategie-Schlacht beginnt.',
            '🏁 Lichter aus und los! Die Jagd über {totalLaps} Runden ist eröffnet.',
            '🏁 Der Grand Prix rollt – {fieldSize} Autos im Kampf um Position.',
            '🏁 Start in den Renntag: {totalLaps} Runden, alles ist möglich.',
            '🏁 Die Startaufstellung löst sich auf – ab jetzt zählt nur noch Pace.',
            '🏁 Rennstart! {fieldSize} Autos – und {totalLaps} Runden, in denen alles passieren kann.'
        ],
        e10: [
            '🏁 Lights out! {fieldSize} Autos gehen auf die {totalLaps} Runden.',
            '🏁 Und los! Das Feld schiebt sich durch die ersten Kurven – {totalLaps} Runden ab jetzt.',
            '🏁 Start! {fieldSize} Autos, {totalLaps} Runden – Showtime.',
            '🏁 Es ist gestartet! Erste Runde von {totalLaps} läuft.',
            '🏁 Go, go, go! {fieldSize} Autos im Sprint zur ersten Kurve.',
            '🏁 Die Lichter sind aus – das Rennen über {totalLaps} Runden läuft!',
            '🏁 Rennstart! Jetzt zählt es – {totalLaps} Runden bis zur Zielflagge.',
            '🏁 Los geht’s: {fieldSize} Autos jagen in Runde 1 von {totalLaps}.'
        ]
    },

    // ── PIT — feuert oft ───────────────────────────────────────────────────
    pit: {
        e50: [
            '🔧 Runde {lap}: {driver} steuert die Box an – die Mechaniker eilen an den Wagen.',
            '🔧 Runde {lap}: Boxenhalt bei {team} – {driver} rollt an die Werksbox.',
            '🔧 Runde {lap}: {driver} hält an der Box – frische Reifen für die nächste Etappe.',
            '🔧 Runde {lap}: Halt für {driver}! Die {team}-Mannschaft arbeitet mit fliegenden Händen.',
            '🔧 Runde {lap}: {driver} kommt herein – ein Boxenhalt in alter Manier, jede Sekunde zählt auch hier.',
            '🔧 Runde {lap}: Die Box ruft – {driver} unterbricht seine Fahrt für frischen Gummi.',
            '🔧 Runde {lap}: Werkstatt-Dienst für {driver} – die {team}-Mechaniker legen Hand an.',
            '🔧 Runde {lap}: {driver} biegt zur Box ab – das Feld zieht derweil vorüber.',
            '🔧 Runde {lap}: Boxenhalt {driver} – aktuell Platz {pos}, gleich geht die Jagd weiter.',
            '🔧 Runde {lap}: {driver} an der Box – Männer, Werkzeug, Eile.',
            '🔧 Runde {lap}: Frischer Gummi für {driver} – dann wieder hinaus ins Getümmel.',
            '🔧 Runde {lap}: Boxenhalt bei {team} – {driver} verliert Zeit, gewinnt aber Reifen.',
            '🔧 Runde {lap}: {driver} macht Station an der Box – aktuell Platz {pos}.',
            '🔧 Runde {lap}: Halt bei {team}! {driver} lässt nacharbeiten und kehrt zurück auf die Bahn.'
        ],
        e62: [
            '🔧 Runde {lap}: {driver} kommt an die Box – die {team}-Crew wartet schon.',
            '🔧 Runde {lap}: Boxenstopp für {driver} – Routinearbeit der Mechaniker.',
            '🔧 Runde {lap}: {driver} biegt in die Boxengasse ein – frische Reifen sind fällig.',
            '🔧 Runde {lap}: Stopp bei {team}: {driver} steht – gleich geht es weiter.',
            '🔧 Runde {lap}: Die Box winkt {driver} herein – Service am Wagen.',
            '🔧 Runde {lap}: {driver} unterbricht die Fahrt – Boxenstopp, aktuell Platz {pos}.',
            '🔧 Runde {lap}: Arbeit für die {team}-Mannschaft – {driver} steht an der Box.',
            '🔧 Runde {lap}: {driver} holt sich neue Reifen ab – dann zurück ins Rennen.',
            '🔧 Runde {lap}: Boxenstopp {driver} – die Uhr läuft unbarmherzig weiter.',
            '🔧 Runde {lap}: Kurzer Halt für {driver} – die Mechaniker geben ihr Bestes.',
            '🔧 Runde {lap}: {driver} an der Box – jede Sekunde kostet Meter auf der Strecke.',
            '🔧 Runde {lap}: Reifenwechsel bei {driver} – {team} schickt ihn wieder hinaus.',
            '🔧 Runde {lap}: {driver} rollt zur Box – im Rennen über {totalLaps} Runden will so ein Halt gut gewählt sein.',
            '🔧 Runde {lap}: Halt an der Box – {driver} vertraut auf seine Crew.'
        ],
        e76: [
            '🔧 Runde {lap}: {driver} kommt rein! Die {team}-Crew springt über die Mauer.',
            '🔧 Runde {lap}: Boxenstopp {driver} – Schlagschrauber kreischen, dann Vollgas!',
            '🔧 Runde {lap}: {driver} in der Box – frische Reifen, neue Chance.',
            '🔧 Runde {lap}: Stopp bei {team}! {driver} steht, die Crew arbeitet auf Hochtouren.',
            '🔧 Runde {lap}: {driver} biegt an die Box ab – jetzt muss jeder Handgriff sitzen!',
            '🔧 Runde {lap}: Reifenwechsel für {driver} – aktuell Platz {pos}.',
            '🔧 Runde {lap}: Die Box hat {driver} reingeholt – Service in Sekunden.',
            '🔧 Runde {lap}: {driver} an der Box – die Konkurrenz zieht draußen vorbei.',
            '🔧 Runde {lap}: Boxenstopp! {driver} setzt auf frischen Gummi.',
            '🔧 Runde {lap}: {team} holt {driver} an die Box – mutiger Zeitpunkt oder Pflichtstopp? Wir werden es sehen.',
            '🔧 Runde {lap}: {driver} steht in der Box – die Sekunden fühlen sich an wie Minuten.',
            '🔧 Runde {lap}: Frische Walzen für {driver}!',
            '🔧 Runde {lap}: {driver} zum Service – die {team}-Jungs machen Tempo.',
            '🔧 Runde {lap}: Stopp für {driver} – und wieder raus in den Verkehr!'
        ],
        e94: [
            '🔧 Runde {lap}: {driver} kommt an die Box – die {team}-Crew steht bereit.',
            '🔧 Runde {lap}: Boxenstopp {driver} – Standardprogramm bei {team}.',
            '🔧 Runde {lap}: {driver} in der Boxengasse – jetzt entscheidet die Strategie.',
            '🔧 Runde {lap}: Stopp für {driver} – frische Reifen im Kampf um jede Zehntel.',
            '🔧 Runde {lap}: {team} ruft {driver} herein – Strategie-Schach in der Boxengasse.',
            '🔧 Runde {lap}: {driver} biegt ab zum Service – aktuell P{pos}.',
            '🔧 Runde {lap}: Boxenstopp! {driver} vertraut auf den Plan seiner Ingenieure.',
            '🔧 Runde {lap}: {driver} steht – Sekunden, die sich später auszahlen sollen.',
            '🔧 Runde {lap}: Reifenwechsel bei {driver} – die Stoppuhr ist gnadenlos.',
            '🔧 Runde {lap}: {driver} an der Box – in Runde {lap} von {totalLaps} ein spannender Zeitpunkt.',
            '🔧 Runde {lap}: Service für {driver} – die {team}-Crew arbeitet im Akkord.',
            '🔧 Runde {lap}: Box frei für {driver} – rein, Reifen, raus.',
            '🔧 Runde {lap}: {driver} holt neuen Gummi – das Rennen wird auch am Kommandostand entschieden.',
            '🔧 Runde {lap}: Stopp {driver} – jetzt zählt jeder Handgriff.'
        ],
        e10: [
            '🔧 Runde {lap}: Box, Box! {driver} kommt rein.',
            '🔧 Runde {lap}: {driver} in der Box – die {team}-Crew übernimmt.',
            '🔧 Runde {lap}: Stopp für {driver} – frische Reifen, neues Spiel.',
            '🔧 Runde {lap}: {driver} biegt in die Boxengasse ab – aktuell P{pos}.',
            '🔧 Runde {lap}: Boxenstopp {driver} – das Strategie-Duell nimmt Fahrt auf.',
            '🔧 Runde {lap}: {driver} steht – Reifen drauf und wieder raus!',
            '🔧 Runde {lap}: Pit-Stopp bei {team} – {driver} wechselt auf frischen Gummi.',
            '🔧 Runde {lap}: {driver} kommt zum Service – Timing ist hier alles.',
            '🔧 Runde {lap}: Stopp! {driver} und {team} ziehen ihre Strategie durch.',
            '🔧 Runde {lap}: {driver} in der Box – Runde {lap} von {totalLaps}, interessanter Call.',
            '🔧 Runde {lap}: Reifenwechsel {driver} – jede Zehntel in der Gasse zählt.',
            '🔧 Runde {lap}: {driver} rollt durch die Boxengasse – gleich geht die Jagd weiter.',
            '🔧 Runde {lap}: Boxenstopp für {driver} – die Crew von {team} ist dran.',
            '🔧 Runde {lap}: {driver} holt sich neue Reifen – Attacke im nächsten Stint?'
        ]
    },

    // ── OVERTAKE — feuert oft ──────────────────────────────────────────────
    overtake: {
        e50: [
            '⚡ Runde {lap}: {driver} zieht an {victim} vorbei – ein Manöver voller Wagemut!',
            '⚡ Runde {lap}: {driver} bezwingt {victim} im Zweikampf – das Publikum an der Strecke jubelt.',
            '⚡ Runde {lap}: Kühn! {driver} schiebt sich an {victim} vorbei.',
            '⚡ Runde {lap}: {driver} lässt {victim} hinter sich – nun Platz {pos}.',
            '⚡ Runde {lap}: Rad an Rad – dann ist es entschieden: {driver} vor {victim}!',
            '⚡ Runde {lap}: {driver} setzt sich gegen {victim} durch – großer Sport!',
            '⚡ Runde {lap}: Ein Duell der Tapferen – {driver} behält gegen {victim} die Oberhand.',
            '⚡ Runde {lap}: {driver} geht vorbei an {victim} – die Zuschauer erheben sich von den Plätzen!',
            '⚡ Runde {lap}: {victim} muss {driver} ziehen lassen – Positionswechsel, Platz {pos}.',
            '⚡ Runde {lap}: Attacke von {driver}! {victim} kann sich nicht wehren.',
            '⚡ Runde {lap}: {driver} nutzt seine Chance und überholt {victim} – beherzt gefahren!',
            '⚡ Runde {lap}: Vorbei! {driver} übernimmt die Position von {victim} – Platz {pos}.',
            '⚡ Runde {lap}: {driver} ringt {victim} nieder – Zweikampf nach alter Schule.',
            '⚡ Runde {lap}: Mutprobe bestanden: {driver} ist an {victim} vorbei.'
        ],
        e62: [
            '⚡ Runde {lap}: {driver} überholt {victim} – sauber gemacht.',
            '⚡ Runde {lap}: {driver} findet die Lücke und geht an {victim} vorbei.',
            '⚡ Runde {lap}: Positionswechsel: {driver} nun vor {victim}, Platz {pos}.',
            '⚡ Runde {lap}: {driver} setzt das Manöver gegen {victim} – kontrolliert und entschlossen.',
            '⚡ Runde {lap}: {victim} hat das Nachsehen – {driver} zieht vorbei.',
            '⚡ Runde {lap}: Schöner Zweikampf – am Ende hat {driver} gegen {victim} die Nase vorn.',
            '⚡ Runde {lap}: {driver} kämpft sich an {victim} vorbei – Platz {pos} für ihn.',
            '⚡ Runde {lap}: {driver} zieht am Wagen von {victim} vorbei – ohne Berührung, mit Nachdruck.',
            '⚡ Runde {lap}: {driver} nimmt {victim} die Position ab.',
            '⚡ Runde {lap}: {victim} muss {driver} passieren lassen.',
            '⚡ Runde {lap}: Gutes Tempo von {driver} – {victim} ist geschlagen.',
            '⚡ Runde {lap}: {driver} macht den entscheidenden Schritt – vorbei an {victim}.',
            '⚡ Runde {lap}: Da war die Lücke! {driver} überholt {victim} und liegt auf Platz {pos}.',
            '⚡ Runde {lap}: {driver} erhöht das Tempo und lässt {victim} hinter sich.'
        ],
        e76: [
            '⚡ Runde {lap}: {driver} attackiert und kassiert {victim}!',
            '⚡ Runde {lap}: Was für ein Manöver! {driver} geht an {victim} vorbei.',
            '⚡ Runde {lap}: {driver} schnappt sich {victim} – jetzt Platz {pos}!',
            '⚡ Runde {lap}: {victim} wehrt sich, aber {driver} ist durch!',
            '⚡ Runde {lap}: Sehenswert! {driver} bezwingt {victim} im Zweikampf!',
            '⚡ Runde {lap}: {driver} lässt {victim} stehen – starke Vorstellung!',
            '⚡ Runde {lap}: Harter, fairer Kampf – {driver} setzt sich gegen {victim} durch.',
            '⚡ Runde {lap}: {driver} übernimmt Platz {pos} – {victim} hat das Nachsehen.',
            '⚡ Runde {lap}: Da geht die Tür auf – {driver} schlüpft an {victim} vorbei!',
            '⚡ Runde {lap}: {driver} macht kurzen Prozess mit {victim}.',
            '⚡ Runde {lap}: {victim} unter Druck – und {driver} nutzt die Gelegenheit eiskalt!',
            '⚡ Runde {lap}: Überholmanöver {driver}! {victim} muss sich hinten anstellen.',
            '⚡ Runde {lap}: {driver} ist der Schnellere – vorbei an {victim}, weiter geht die Jagd!',
            '⚡ Runde {lap}: Position getauscht: {driver} vor {victim} – das Publikum tobt!'
        ],
        e94: [
            '⚡ Runde {lap}: {driver} geht an {victim} vorbei – sauber platziert.',
            '⚡ Runde {lap}: {driver} erwischt {victim} – Positionsgewinn, P{pos}.',
            '⚡ Runde {lap}: Druckphase beendet – {driver} ist an {victim} vorbei.',
            '⚡ Runde {lap}: {driver} setzt sich gegen {victim} durch – die Pace stimmt.',
            '⚡ Runde {lap}: {victim} verliert die Position an {driver}.',
            '⚡ Runde {lap}: Präzise Attacke – {driver} überholt {victim}.',
            '⚡ Runde {lap}: {driver} nutzt den Schwung und schiebt sich an {victim} vorbei.',
            '⚡ Runde {lap}: Zweikampf entschieden: {driver} vor {victim}, P{pos}.',
            '⚡ Runde {lap}: {driver} macht Ernst – {victim} kann nicht kontern.',
            '⚡ Runde {lap}: Überholmanöver! {driver} zieht an {victim} vorbei.',
            '⚡ Runde {lap}: {driver} bringt das Manöver gegen {victim} sicher zu Ende.',
            '⚡ Runde {lap}: {victim} in der Defensive – und {driver} schlägt zu.',
            '⚡ Runde {lap}: Klasse Timing: {driver} kassiert {victim}.',
            '⚡ Runde {lap}: {driver} arbeitet sich vor – {victim} abgehakt, jetzt P{pos}.'
        ],
        e10: [
            '⚡ Runde {lap}: {driver} schnappt sich {victim} – jetzt P{pos}!',
            '⚡ Runde {lap}: Starker Move! {driver} geht an {victim} vorbei.',
            '⚡ Runde {lap}: {driver} erledigt das gegen {victim} – Positionsgewinn!',
            '⚡ Runde {lap}: {victim} kann nichts machen – {driver} ist durch!',
            '⚡ Runde {lap}: {driver} holt sich P{pos} – vorbei an {victim}.',
            '⚡ Runde {lap}: Überholmanöver {driver}! {victim} muss abreißen lassen.',
            '⚡ Runde {lap}: {driver} mit dem besseren Tempo – {victim} ist fällig.',
            '⚡ Runde {lap}: Sauber durchgezogen: {driver} überholt {victim}.',
            '⚡ Runde {lap}: {driver} attackiert – und der Move gegen {victim} sitzt!',
            '⚡ Runde {lap}: {victim} verteidigt hart, aber {driver} bleibt dran und geht vorbei!',
            '⚡ Runde {lap}: Da ist die Lücke – {driver} taucht durch, {victim} geschlagen!',
            '⚡ Runde {lap}: {driver} lässt {victim} hinter sich – auf zur nächsten Aufgabe.',
            '⚡ Runde {lap}: Klasse Racing! {driver} setzt sich gegen {victim} durch.',
            '⚡ Runde {lap}: {driver} zieht vorbei – {victim} hat keine Antwort.'
        ]
    },

    // ── DNF MECHANICAL — je Register: 7 mit {reason}, 7 ohne ───────────────
    dnf_mechanical: {
        e50: [
            '❌ Runde {lap}: {reason} am Wagen von {driver} – das Rennen ist für ihn zu Ende.',
            '❌ Runde {lap}: {driver} rollt aus – {reason}. Ein bitterer Moment für {team}.',
            '❌ Runde {lap}: Die Technik streikt: {reason} zwingt {driver} zur Aufgabe.',
            '❌ Runde {lap}: Aus für {driver} – {reason}. So grausam kann dieser Sport sein.',
            '❌ Runde {lap}: {driver} stellt seinen Wagen ab – die Diagnose lautet {reason}.',
            '❌ Runde {lap}: {reason}! {driver} muss den Kampf aufgeben – von Platz {pos} aus dem Rennen.',
            '❌ Runde {lap}: Das Material hält nicht: {reason} beendet die Fahrt von {driver}.',
            '❌ Runde {lap}: {driver} bleibt liegen – der Wagen will nicht mehr.',
            '❌ Runde {lap}: Aus und vorbei für {driver} – die Maschine versagt ihren Dienst.',
            '❌ Runde {lap}: {driver} rollt langsam aus – ein Defekt beendet seinen Grand Prix.',
            '❌ Runde {lap}: Bittere Aufgabe: {driver} stellt den {team}-Wagen ab.',
            '❌ Runde {lap}: Der Wagen von {driver} gibt den Geist auf – das Rennen ist gelaufen.',
            '❌ Runde {lap}: Technisches K.o. für {driver} – auf Platz {pos} liegend ist Schluss.',
            '❌ Runde {lap}: {driver} scheidet aus – Mensch stark, Maschine schwach.'
        ],
        e62: [
            '❌ Runde {lap}: {reason} bei {driver} – Aufgabe.',
            '❌ Runde {lap}: {driver} ist draußen – {reason} am {team}-Wagen.',
            '❌ Runde {lap}: {reason} stoppt {driver} – das war es für heute.',
            '❌ Runde {lap}: {driver} muss abstellen – die Ursache: {reason}.',
            '❌ Runde {lap}: Defekt bei {driver}: {reason}. Die Box kann nichts mehr tun.',
            '❌ Runde {lap}: {reason} – und {driver} verliert alle Chancen in diesem Rennen.',
            '❌ Runde {lap}: {driver} rollt an die Seite – {reason}, Rennende.',
            '❌ Runde {lap}: {driver} scheidet mit technischem Defekt aus.',
            '❌ Runde {lap}: Der Wagen von {driver} streikt – Aufgabe.',
            '❌ Runde {lap}: {driver} bleibt stehen – das Material hat nicht gehalten.',
            '❌ Runde {lap}: Aus für {driver} – die Technik spielt nicht mehr mit.',
            '❌ Runde {lap}: {driver} stellt den Wagen ab – bitter für die {team}-Mannschaft.',
            '❌ Runde {lap}: Defekt bei {driver} – aus Platz {pos} heraus ist Schluss.',
            '❌ Runde {lap}: {driver} ist raus – wieder fordert die Technik ihren Tribut.'
        ],
        e76: [
            '❌ Runde {lap}: {reason} bei {driver}! Das Rennen ist für ihn gelaufen.',
            '❌ Runde {lap}: {driver} rollt aus – {reason}. Frust pur bei {team}.',
            '❌ Runde {lap}: Die Technik sagt Nein: {reason} wirft {driver} aus dem Rennen.',
            '❌ Runde {lap}: {reason} – Aus für {driver}, der Wagen steht.',
            '❌ Runde {lap}: {driver} ist draußen! {reason} am {team}-Renner.',
            '❌ Runde {lap}: Bitter! {reason} stoppt {driver} auf Platz {pos}.',
            '❌ Runde {lap}: {driver} muss aufgeben – {reason}. Mehr war heute nicht drin.',
            '❌ Runde {lap}: {driver} bleibt liegen – Defekt! Das war es.',
            '❌ Runde {lap}: Aus für {driver} – die Technik hat den Dienst quittiert.',
            '❌ Runde {lap}: {driver} stellt die Maschine ab – wieder ein Opfer der Materialschlacht.',
            '❌ Runde {lap}: Der {team}-Renner von {driver} steht – Rennende!',
            '❌ Runde {lap}: {driver} raus! Von Platz {pos} direkt ins Aus – Technik-K.o.',
            '❌ Runde {lap}: Nichts geht mehr bei {driver} – Aufgabe.',
            '❌ Runde {lap}: {driver} parkt den Wagen an der Seite – bitterer Tag für {team}.'
        ],
        e94: [
            '❌ Runde {lap}: {reason} bei {driver} – Aufgabe.',
            '❌ Runde {lap}: {driver} ist raus – {reason}. Die Ingenieure können nur noch zuschauen.',
            '❌ Runde {lap}: {reason} beendet das Rennen von {driver} – bitter für {team}.',
            '❌ Runde {lap}: Technischer Defekt: {reason} – {driver} stellt ab.',
            '❌ Runde {lap}: {driver} rollt aus – Diagnose {reason}.',
            '❌ Runde {lap}: {reason} auf P{pos} – für {driver} ist das Rennen vorbei.',
            '❌ Runde {lap}: Aus für {driver}: {reason} – die Punkte sind weg.',
            '❌ Runde {lap}: {driver} scheidet aus – technischer Defekt.',
            '❌ Runde {lap}: Das Auto von {driver} streikt – Rennende.',
            '❌ Runde {lap}: {driver} muss den Wagen abstellen – die Technik macht nicht mehr mit.',
            '❌ Runde {lap}: Defekt bei {driver} – von P{pos} aus dem Rennen.',
            '❌ Runde {lap}: {driver} wird langsamer und stellt ab – das war es für heute.',
            '❌ Runde {lap}: Wieder Technik-Pech: {driver} ist draußen.',
            '❌ Runde {lap}: Für {driver} ist Schluss – das Material hat versagt.'
        ],
        e10: [
            '❌ Runde {lap}: {reason} bei {driver} – das Auto steht, das Rennen ist vorbei.',
            '❌ Runde {lap}: {driver} ist raus – {reason}. Riesenfrust bei {team}.',
            '❌ Runde {lap}: {reason}! {driver} muss abstellen.',
            '❌ Runde {lap}: Bitteres Aus für {driver} – {reason}.',
            '❌ Runde {lap}: Das Auto von {driver} streikt – {reason}.',
            '❌ Runde {lap}: {reason} auf P{pos} – so schnell ist ein Rennen vorbei.',
            '❌ Runde {lap}: DNF für {driver} – {reason}.',
            '❌ Runde {lap}: {driver} stellt das Auto ab – technischer Defekt.',
            '❌ Runde {lap}: Aus für {driver} – die Technik streikt.',
            '❌ Runde {lap}: {driver} ist draußen – bitterer Moment für die {team}-Garage.',
            '❌ Runde {lap}: Defekt! {driver} verliert alles – P{pos} ist Geschichte.',
            '❌ Runde {lap}: Rennende für {driver} – das Auto macht nicht mehr mit.',
            '❌ Runde {lap}: {driver} rollt aus – null Weiterfahrt, null Punkte.',
            '❌ Runde {lap}: Technisches K.o. für {driver} – mitten im Rennen ist Schluss.'
        ]
    },

    // ── DNF ACCIDENT — je Register: 7 mit {reason}, 7 ohne ─────────────────
    // Darf dramatischer sein, aber: NIE Verletzung/Wohlbefinden andeuten
    // (weder „verletzt" noch „unverletzt" — death-Event kann folgen!)
    dnf_accident: {
        e50: [
            '❌ Runde {lap}: {reason} bei {driver} – der Wagen steht abseits der Bahn.',
            '❌ Runde {lap}: {driver} kommt von der Bahn ab – {reason}, das Rennen ist zu Ende.',
            '❌ Runde {lap}: Schreckmoment: {reason} bei {driver} – er scheidet aus.',
            '❌ Runde {lap}: {reason}! Für {driver} ist der Grand Prix beendet.',
            '❌ Runde {lap}: {driver} verliert den Wagen – {reason} beendet seine Fahrt.',
            '❌ Runde {lap}: {reason} auf Platz {pos} – {driver} ist aus dem Rennen.',
            '❌ Runde {lap}: Die Bahn fordert ihren Tribut: {reason} bei {driver}.',
            '❌ Runde {lap}: {driver} fliegt von der Bahn – Rennende.',
            '❌ Runde {lap}: Zwischenfall! {driver} kann die Fahrt nicht fortsetzen.',
            '❌ Runde {lap}: {driver} rutscht von der Piste – der Wagen bleibt stehen, das Rennen ist vorbei.',
            '❌ Runde {lap}: Der Wagen von {driver} steht abseits der Bahn – Aufgabe.',
            '❌ Runde {lap}: Ein Zwischenfall beendet die Fahrt von {driver}.',
            '❌ Runde {lap}: Aus auf Platz {pos}: {driver} ist von der Bahn.',
            '❌ Runde {lap}: Jähes Ende für {driver} – das Rennen ist vorzeitig vorbei.'
        ],
        e62: [
            '❌ Runde {lap}: {reason} bei {driver} – das Rennen ist für ihn beendet.',
            '❌ Runde {lap}: {driver} scheidet nach {reason} aus.',
            '❌ Runde {lap}: {reason} – {driver} kann nicht weiterfahren.',
            '❌ Runde {lap}: Zwischenfall für {driver}: {reason}, Aufgabe.',
            '❌ Runde {lap}: {driver} ist draußen – {reason}, der Wagen steht.',
            '❌ Runde {lap}: {reason} auf Platz {pos} – bitteres Ende für {driver}.',
            '❌ Runde {lap}: Das Rennen von {driver} endet abrupt – {reason}.',
            '❌ Runde {lap}: {driver} kommt von der Strecke ab – Rennende.',
            '❌ Runde {lap}: Zwischenfall bei {driver} – er stellt den Wagen ab.',
            '❌ Runde {lap}: Unfall! {driver} ist aus dem Rennen.',
            '❌ Runde {lap}: {driver} bleibt neben der Strecke stehen – Aufgabe nach Zwischenfall.',
            '❌ Runde {lap}: Aus für {driver} – der Wagen ist zu stark beschädigt.',
            '❌ Runde {lap}: {driver} ist von der Bahn – aus Platz {pos} heraus endet sein Rennen.',
            '❌ Runde {lap}: Schrecksekunde – für {driver} geht es nicht weiter.'
        ],
        e76: [
            '❌ Runde {lap}: {reason}! {driver} ist raus!',
            '❌ Runde {lap}: {driver} fliegt ab – {reason}! Das Rennen ist gelaufen.',
            '❌ Runde {lap}: {reason} bei {driver} – der {team}-Renner steht!',
            '❌ Runde {lap}: Drama! {reason} beendet das Rennen von {driver}.',
            '❌ Runde {lap}: {driver} auf Platz {pos} – dann {reason}, dann Stillstand.',
            '❌ Runde {lap}: {reason} – und {driver} kann nur noch zuschauen.',
            '❌ Runde {lap}: Aus und vorbei: {reason} bei {driver}.',
            '❌ Runde {lap}: Unfall! {driver} ist draußen – das Auto steht.',
            '❌ Runde {lap}: {driver} kracht raus – Rennende!',
            '❌ Runde {lap}: Wilde Szene – {driver} kommt nicht mehr zurück ins Rennen.',
            '❌ Runde {lap}: Das Rennen spuckt {driver} aus – Unfall, Aufgabe.',
            '❌ Runde {lap}: Der Wagen von {driver} ist hinüber – Unfall!',
            '❌ Runde {lap}: Aus auf Platz {pos}! {driver} scheidet nach Unfall aus.',
            '❌ Runde {lap}: Schock für {team}: {driver} ist abgeflogen – Rennende.'
        ],
        e94: [
            '❌ Runde {lap}: {reason} bei {driver} – das Rennen ist vorbei.',
            '❌ Runde {lap}: {driver} ist raus – {reason}.',
            '❌ Runde {lap}: {reason}! {driver} kann nicht weiterfahren.',
            '❌ Runde {lap}: Rennende für {driver}: {reason} auf P{pos}.',
            '❌ Runde {lap}: {reason} – {driver} stellt den beschädigten Wagen ab.',
            '❌ Runde {lap}: Bitter für {team}: {reason} bei {driver}.',
            '❌ Runde {lap}: {driver} fällt aus – {reason} beendet alle Hoffnungen.',
            '❌ Runde {lap}: Unfall von {driver} – das Rennen ist für ihn beendet.',
            '❌ Runde {lap}: {driver} ist draußen – zu viel Schaden am Auto.',
            '❌ Runde {lap}: Zwischenfall! {driver} scheidet aus.',
            '❌ Runde {lap}: {driver} verliert P{pos} auf die harte Tour – Unfall, Rennende.',
            '❌ Runde {lap}: Das Auto von {driver} steht – Unfall, Aufgabe.',
            '❌ Runde {lap}: Rennen beendet: {driver} kommt nach einem Zwischenfall nicht mehr weiter.',
            '❌ Runde {lap}: {driver} rutscht ins Aus – bittere Szene für {team}.'
        ],
        e10: [
            '❌ Runde {lap}: {reason} bei {driver} – Rennen vorbei!',
            '❌ Runde {lap}: {driver} ist raus – {reason}.',
            '❌ Runde {lap}: {reason}! Das war es für {driver}.',
            '❌ Runde {lap}: Drama um {driver}: {reason} auf P{pos}.',
            '❌ Runde {lap}: {reason} – {driver} parkt das Auto unfreiwillig.',
            '❌ Runde {lap}: Riesen-Ärger bei {team}: {reason} bei {driver}.',
            '❌ Runde {lap}: DNF für {driver} – {reason}.',
            '❌ Runde {lap}: Unfall! {driver} ist aus dem Rennen.',
            '❌ Runde {lap}: {driver} fliegt ab – das Auto ist zu beschädigt, um weiterzufahren.',
            '❌ Runde {lap}: Crash-Alarm: {driver} kommt nicht mehr zurück auf die Strecke.',
            '❌ Runde {lap}: {driver} verliert P{pos} in einer Sekunde – Unfall, Rennende.',
            '❌ Runde {lap}: Bitteres Bild für {team}: das Auto von {driver} steht.',
            '❌ Runde {lap}: {driver} ist draußen – Zwischenfall, Aufgabe.',
            '❌ Runde {lap}: Rennende für {driver} – so schnell kann es gehen.'
        ]
    },

    // ── DEATH — nüchtern, ära-arm, keine Ursache, kein Kitsch (SPEC §4) ────
    death: {
        e50: [
            '💀 Runde {lap}: {driver} ist tödlich verunglückt.',
            '💀 Runde {lap}: Furchtbare Nachricht von der Strecke: {driver} ist tödlich verunglückt.',
            '💀 Runde {lap}: {driver} hat den Unfall nicht überlebt. Der Rennsport hält inne.',
            '💀 Runde {lap}: Tragödie: {driver} ist bei einem Unfall ums Leben gekommen.',
            '💀 Runde {lap}: Das Schlimmste ist eingetreten – {driver} ist tot.',
            '💀 Runde {lap}: {driver} verunglückt tödlich. Die Zeitnahme tritt in den Hintergrund.'
        ],
        e62: [
            '💀 Runde {lap}: {driver} ist tödlich verunglückt.',
            '💀 Runde {lap}: Schwarze Nachricht: {driver} hat den Unfall nicht überlebt.',
            '💀 Runde {lap}: {driver} ist bei einem Unfall ums Leben gekommen.',
            '💀 Runde {lap}: Tragischer Tag – {driver} ist tot.',
            '💀 Runde {lap}: Das Fahrerlager erhält die schlimmstmögliche Nachricht: {driver} ist tot.',
            '💀 Runde {lap}: {driver} verunglückt tödlich – die Gedanken sind bei seinen Angehörigen.'
        ],
        e76: [
            '💀 Runde {lap}: {driver} ist tödlich verunglückt.',
            '💀 Runde {lap}: Furchtbare Gewissheit: {driver} hat den Unfall nicht überlebt.',
            '💀 Runde {lap}: {driver} ist bei einem Unfall ums Leben gekommen. Alles andere ist jetzt Nebensache.',
            '💀 Runde {lap}: Tragödie an der Strecke – {driver} ist tot.',
            '💀 Runde {lap}: Die Nachricht, die niemand hören wollte: {driver} ist tot.',
            '💀 Runde {lap}: {driver} verunglückt tödlich – Stille über der Strecke.'
        ],
        e94: [
            '💀 Runde {lap}: {driver} ist tödlich verunglückt.',
            '💀 Runde {lap}: Traurige Gewissheit: {driver} hat den Unfall nicht überlebt.',
            '💀 Runde {lap}: {driver} ist bei einem Unfall ums Leben gekommen.',
            '💀 Runde {lap}: Schwärzester Moment des Tages – {driver} ist tot.',
            '💀 Runde {lap}: {driver} verunglückt tödlich. Die Gedanken sind bei Familie und Team.',
            '💀 Runde {lap}: Es gibt keine schonende Formulierung: {driver} ist tot.'
        ],
        e10: [
            '💀 Runde {lap}: {driver} ist tödlich verunglückt.',
            '💀 Runde {lap}: Traurige Gewissheit: {driver} hat den Unfall nicht überlebt.',
            '💀 Runde {lap}: {driver} ist bei einem Unfall ums Leben gekommen.',
            '💀 Runde {lap}: Furchtbare Nachricht: {driver} ist tot.',
            '💀 Runde {lap}: {driver} verunglückt tödlich – die Gedanken sind bei den Angehörigen und bei {team}.',
            '💀 Runde {lap}: Ein schwarzer Tag: {driver} ist tot.'
        ]
    },

    // ── FINISH — 1× pro Rennen; keine Souveränitäts-Aussagen (kein margin) ─
    finish: {
        e50: [
            '🏁 Zielflagge! {driver} gewinnt den Grand Prix für {team}!',
            '🏁 Sieg für {driver}! Der {team}-Pilot überquert die Ziellinie als Erster.',
            '🏁 {driver} vollendet ein großes Rennen – der Sieg gehört ihm und {team}!',
            '🏁 Triumph für {driver}! Die Zuschauer feiern den Sieger des Tages.',
            '🏁 Die karierte Flagge fällt für {driver} – ein Sieg für die Chronik von {team}.',
            '🏁 {driver} siegt! Hut ab vor dieser Leistung.',
            '🏁 Der Lorbeer des Tages gehört {driver} – {team} jubelt.',
            '🏁 Ziel! {driver} gewinnt – Motorsport, wie er im Buche steht.'
        ],
        e62: [
            '🏁 Zielflagge: {driver} gewinnt für {team}!',
            '🏁 Sieg für {driver} – eine reife Leistung.',
            '🏁 {driver} überquert die Linie als Erster – Jubel bei {team}.',
            '🏁 Das Rennen ist entschieden: {driver} heißt der Sieger.',
            '🏁 {driver} gewinnt den Grand Prix – Glückwunsch an Fahrer und {team}.',
            '🏁 Karierte Flagge – und {driver} ist der Mann des Tages.',
            '🏁 Sieg! {driver} bringt den {team}-Wagen als Ersten nach Hause.',
            '🏁 {driver} macht den Sieg perfekt – ein Erfolg für {team}.'
        ],
        e76: [
            '🏁 Zielflagge! {driver} gewinnt – Riesenjubel bei {team}!',
            '🏁 Sieg für {driver}! Was für ein Rennen!',
            '🏁 {driver} holt sich den Sieg – die {team}-Box steht Kopf!',
            '🏁 Da ist die karierte Flagge – {driver} gewinnt den Grand Prix!',
            '🏁 Ganz oben: {driver}! Ein Triumph, der sich gewaschen hat.',
            '🏁 {driver} fährt als Erster über die Linie – Sieg für {team}!',
            '🏁 Gänsehaut an der Strecke: {driver} gewinnt!',
            '🏁 Der Sieg geht an {driver} – Champagner für {team}!'
        ],
        e94: [
            '🏁 Zielflagge: Sieg für {driver} und {team}!',
            '🏁 {driver} gewinnt den Grand Prix – Jubel an der {team}-Box.',
            '🏁 P1 für {driver} – die Arbeit des ganzen Teams zahlt sich aus.',
            '🏁 Sieg! {driver} bringt es ins Ziel – {team} feiert.',
            '🏁 Die karierte Flagge fällt: {driver} heißt der Sieger.',
            '🏁 {driver} kreuzt die Linie als Erster – ein perfekter Renntag für {team}.',
            '🏁 Das Ziel! {driver} gewinnt – Glückwunsch!',
            '🏁 Sieg für {driver} – dieser Grand Prix gehört ihm.'
        ],
        e10: [
            '🏁 Zielflagge! {driver} gewinnt das Rennen – großer Jubel bei {team}!',
            '🏁 P1! {driver} holt den Sieg!',
            '🏁 {driver} gewinnt! Die {team}-Garage explodiert vor Freude!',
            '🏁 Karierte Flagge – der Sieg geht an {driver}!',
            '🏁 Was für ein Tag für {team}: {driver} gewinnt den Grand Prix!',
            '🏁 {driver} bringt es nach Hause – Sieg!',
            '🏁 Ziel! {driver} steht ganz oben – Glückwunsch an {team}.',
            '🏁 Sieg für {driver}! {team} darf feiern.'
        ]
    }
};

// ============================================================================
// Optionaler Picker (Referenz-Implementierung — Opus darf ersetzen, SPEC §6.3)
// ============================================================================
// - Register-Bänder identisch zu RECAP_ERA_WORDS (Paket B/C): 1962/1976/1994/2010
// - Slot-Filter: Templates, deren Slots im ctx fehlen (z.B. {reason} nicht in
//   der Map), fallen automatisch raus → generische Zeile wird gezogen
// - Anti-Monotonie (Grundregel 6): nie zweimal hintereinander dieselbe Zeile
//   pro Event; kein Seeding (Ticker ist ephemer, SPEC §0)
// ============================================================================
const _LIVE_ERA_KEY = (year) =>
    year < 1962 ? 'e50' : year < 1976 ? 'e62' : year < 1994 ? 'e76' : year < 2010 ? 'e94' : 'e10';

const _liveLastPick = {};
function liveLine(event, ctx) {
    ctx = ctx || {};
    const pools = LIVE_COMMENTARY[event];
    if (!pools) return '';
    const pool = pools[_LIVE_ERA_KEY(ctx.year || 2000)] || pools.e10;
    // Nur Templates, deren Slots alle im ctx belegt sind
    let usable = pool.filter(t => !(t.match(/\{(\w+)\}/g) || []).some(s => {
        const k = s.slice(1, -1);
        return ctx[k] === undefined || ctx[k] === null || ctx[k] === '';
    }));
    if (!usable.length) usable = pool;
    if (usable.length > 1 && _liveLastPick[event] !== undefined) {
        usable = usable.filter(t => t !== _liveLastPick[event]);
    }
    const tpl = usable[Math.floor(Math.random() * usable.length)];
    _liveLastPick[event] = tpl;
    return tpl.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] ?? ''));
}

// ============================================================================
// ENTWURF: reason-Map (Opus-Vorarbeit §6.1 — hier nur die SPRACHE als Vorschlag)
// ============================================================================
// Anforderung an jede Übersetzung: artikel-freies Nominal, das in „– {reason}.",
// „mit {reason}", „{reason} bei {driver}" und „nach {reason}" trägt.
// Deckt alle Tokens aus den 4 Ära-Pools (L9764–9767) + Accident-Pool (L9760) ab.
//
// const DNF_REASON_DE = {
//   // mechanisch (alle Ären)
//   'Engine':'Motorschaden',        'Gearbox':'Getriebeschaden',
//   'Overheating':'Überhitzung',    'Oil pressure':'Öldruckverlust',
//   'Fuel system':'Benzinsystem-Defekt', 'Suspension':'Aufhängungsschaden',
//   'Halfshaft':'Halbwellenbruch',  'Magneto':'Magnetzünder-Defekt',
//   'Rear axle':'Hinterachsschaden','Brakes':'Bremsdefekt',
//   'Throttle':'Gasgestänge-Defekt','Oil leak':'Ölleck',
//   'Valve':'Ventilschaden',        'Clutch':'Kupplungsschaden',
//   'Driveshaft':'Antriebswellenbruch', 'Electrical':'Elektrikdefekt',
//   'Wheel':'Radschaden',           'Transmission':'Antriebsdefekt',
//   'Water leak':'Wasserleck',      'Fire':'Feuer',
//   'Hydraulics':'Hydraulikdefekt', 'Turbo':'Turboschaden',
//   'Wheel failure':'Radschaden',   'Fuel pressure':'Benzindruckverlust',
//   'MGU-K':'MGU-K-Defekt',         'Power unit':'Power-Unit-Defekt',
//   'Cooling':'Kühlungsproblem',    'Battery':'Batterie-Defekt',
//   // accident
//   'Accident':'Unfall', 'Collision':'Kollision', 'Spin':'Dreher',
//   'Off track':'Abflug', 'Crash':'schwerer Abflug'
// };
// ============================================================================

// ============================================================================
// Mini-Testfälle (SPEC §7) — je Event 1 Beispiel in e50 + e10
// ============================================================================
// start     e50  ctx {fieldSize:20, totalLaps:60}
//   → „🏁 Die Flagge fällt! 20 Piloten stürzen sich in die erste Kurve – 60 Runden liegen vor ihnen."
// start     e10  ctx {fieldSize:20, totalLaps:57}
//   → „🏁 Lights out! 20 Autos gehen auf die 57 Runden."
// pit       e50  ctx {driver:'Fangio', team:'Maserati', lap:31, totalLaps:80, pos:2}
//   → „🔧 Runde 31: Halt für Fangio! Die Maserati-Mannschaft arbeitet mit fliegenden Händen."
// pit       e10  ctx {driver:'Hamilton', team:'Mercedes', lap:22, totalLaps:57, pos:3}
//   → „🔧 Runde 22: Box, Box! Hamilton kommt rein."
// overtake  e50  ctx {driver:'Moss', victim:'Farina', lap:12, pos:4}
//   → „⚡ Runde 12: Moss lässt Farina hinter sich – nun P4."
// overtake  e10  ctx {driver:'Verstappen', victim:'Norris', lap:34, pos:2}
//   → „⚡ Runde 34: Verstappen schnappt sich Norris – jetzt P2!"
// dnf_mech  e50  ctx {driver:'Hawthorn', team:'Ferrari', lap:44, reason:'Magnetzünder-Defekt', pos:5}
//   → „❌ Runde 44: Magnetzünder-Defekt am Wagen von Hawthorn – das Rennen ist für ihn zu Ende."
// dnf_mech  e10  ctx {driver:'Alonso', team:'Aston Martin', lap:18, reason:'Power-Unit-Defekt', pos:8}
//   → „❌ Runde 18: Power-Unit-Defekt bei Alonso – das Auto steht, das Rennen ist vorbei."
// dnf_mech  e10  OHNE reason (Map-Miss) ctx {driver:'Alonso', team:'Aston Martin', lap:18, pos:8}
//   → „❌ Runde 18: Alonso ist draußen – bitterer Moment für die Aston Martin-Garage."
// dnf_acc   e50  ctx {driver:'Collins', team:'Ferrari', lap:9, reason:'Dreher', pos:6}
//   → „❌ Runde 9: Dreher bei Collins – der Wagen steht abseits der Bahn."
// dnf_acc   e10  ctx {driver:'Russell', team:'Mercedes', lap:41, reason:'Kollision', pos:5}
//   → „❌ Runde 41: Kollision bei Russell – Rennen vorbei!"
// death     e50  ctx {driver:'Portago', team:'Ferrari', lap:27}
//   → „💀 Runde 27: Portago hat den Unfall nicht überlebt. Der Rennsport hält inne."
// death     e10  ctx {driver:'Bianchi', team:'Marussia', lap:43}
//   → „💀 Runde 43: Bianchi ist tödlich verunglückt."
// finish    e50  ctx {driver:'Ascari', team:'Ferrari'}
//   → „🏁 Zielflagge! Ascari gewinnt den Grand Prix für Ferrari!"
// finish    e10  ctx {driver:'Leclerc', team:'Ferrari'}
//   → „🏁 P1! Leclerc holt den Sieg!"
// ============================================================================
