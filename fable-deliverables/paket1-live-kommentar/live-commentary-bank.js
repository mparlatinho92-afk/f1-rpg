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
            '🏁 Das Rennen ist gestartet – {totalLaps} Runden Prüfung für Mensch und Maschine.',
            '🏁 Der Starter senkt die Flagge – {fieldSize} Wagen stürmen davon!',
            '🏁 Ein Donnergrollen aus {fieldSize} Motoren – der Grand Prix über {totalLaps} Runden läuft!',
            '🏁 Die große Prüfung beginnt – {totalLaps} Runden zwischen Ruhm und Kummer.',
            '🏁 Das Feld springt der ersten Kurve entgegen – möge der Beste siegen!'
        ],
        e62: [
            '🏁 Start! {fieldSize} Fahrer gehen auf die {totalLaps} Runden.',
            '🏁 Die Flagge fällt – das Feld von {fieldSize} Wagen ist unterwegs!',
            '🏁 Sauberer Ablauf beim Losfahren – vor den Fahrern liegen {totalLaps} Runden.',
            '🏁 Das Feld hat sich in Bewegung gesetzt – {fieldSize} Wagen im Getümmel der ersten Runde.',
            '🏁 Der Grand Prix läuft! {totalLaps} Runden stehen auf dem Programm.',
            '🏁 Los geht es – {fieldSize} Fahrer, {totalLaps} Runden, alles offen.',
            '🏁 Start zum Grand Prix – die erste Kurve verlangt gleich volle Konzentration.',
            '🏁 Die Startflagge ist gefallen – {fieldSize} Fahrer im Kampf um die ersten Meter.',
            '🏁 Flagge unten – {fieldSize} Wagen sortieren sich in die erste Kurve.',
            '🏁 Der Start ist geglückt – {totalLaps} Runden Arbeit liegen vor dem Feld.',
            '🏁 Alle {fieldSize} Wagen sind auf dem Weg – das Rennen läuft.',
            '🏁 Runde 1 von {totalLaps} – jetzt zeigt sich, wer seine Hausaufgaben gemacht hat.'
        ],
        e76: [
            '🏁 Start! {fieldSize} Autos jagen in die erste Kurve!',
            '🏁 Grün! Das Feld schießt davon – {totalLaps} Runden liegen vor uns.',
            '🏁 Das Feld ist weg! {fieldSize} Autos im Pulk Richtung erste Kurve – enger geht es kaum.',
            '🏁 Start frei zum großen Preis – {fieldSize} Autos, {totalLaps} Runden, volle Attacke!',
            '🏁 Und sie sind unterwegs! Die erste Runde von {totalLaps} läuft.',
            '🏁 Turbulente erste Meter – {fieldSize} Autos kämpfen um jede Lücke!',
            '🏁 Es ist angerichtet: {totalLaps} Runden Renn-Action ab jetzt!',
            '🏁 Los geht’s! Das Feld von {fieldSize} Autos stürmt davon.',
            '🏁 Startgetümmel! {fieldSize} Autos, eine Kurve – das kann eng werden!',
            '🏁 Sie stürmen auf die erste Kurve zu – Ellbogen raus, das Rennen läuft!',
            '🏁 {totalLaps} Runden Vollgas – ab genau jetzt!',
            '🏁 Die Meute ist los – {fieldSize} Autos im Höllentempo Richtung Kurve eins!'
        ],
        e94: [
            '🏁 Die Lichter erlöschen – Start zum Grand Prix! {fieldSize} Autos auf {totalLaps} Runden.',
            '🏁 Start! Das Feld biegt in die erste Runde von {totalLaps} ein.',
            '🏁 Es ist los! {fieldSize} Autos, {totalLaps} Runden – die Strategie-Schlacht beginnt.',
            '🏁 Lichter aus und los! Die Jagd über {totalLaps} Runden ist eröffnet.',
            '🏁 Der Grand Prix rollt – {fieldSize} Autos im Kampf um Position.',
            '🏁 Start in den Renntag: {totalLaps} Runden, alles ist möglich.',
            '🏁 Die Startaufstellung löst sich auf – ab jetzt zählt nur noch Pace.',
            '🏁 Rennstart! {fieldSize} Autos – und {totalLaps} Runden, in denen alles passieren kann.',
            '🏁 Die Ampel schaltet auf Grün – das Rennen über {totalLaps} Runden läuft.',
            '🏁 Start! {fieldSize} Autos durch Kurve eins – jetzt beginnt das Schachspiel über {totalLaps} Runden.',
            '🏁 Das Feld ist unterwegs – die erste von {totalLaps} Runden läuft.',
            '🏁 Los geht es – {fieldSize} Autos und ein Ziel.'
        ],
        e10: [
            '🏁 Lights out! {fieldSize} Autos gehen auf die {totalLaps} Runden.',
            '🏁 Und los! Das Feld schiebt sich durch die ersten Kurven – {totalLaps} Runden ab jetzt.',
            '🏁 Start! {fieldSize} Autos, {totalLaps} Runden – Showtime.',
            '🏁 Es ist gestartet! Erste Runde von {totalLaps} läuft.',
            '🏁 Go, go, go! {fieldSize} Autos im Sprint zur ersten Kurve.',
            '🏁 Die Lichter sind aus – das Rennen über {totalLaps} Runden läuft!',
            '🏁 Rennstart! Jetzt zählt es – {totalLaps} Runden bis zur Zielflagge.',
            '🏁 Los geht’s: {fieldSize} Autos jagen in Runde 1 von {totalLaps}.',
            '🏁 Fünf rote Lichter... und aus! {fieldSize} Autos stürmen los.',
            '🏁 Sauber durch Kurve eins – {totalLaps} Runden, es kann alles passieren.',
            '🏁 Start! Positionskämpfe überall – das wird ein Ritt über {totalLaps} Runden.',
            '🏁 Und ab! {fieldSize} Autos im Verdrängungswettbewerb Richtung erste Kurve.'
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
            '🔧 Runde {lap}: Halt bei {team}! {driver} lässt nacharbeiten und kehrt zurück auf die Bahn.',
            '🔧 Runde {lap}: {driver} rollt an die Boxenmauer – Kanister, Reifen, Muskelkraft.',
            '🔧 Runde {lap}: Halt bei {team} – die Mechaniker in Öl und Eile.',
            '🔧 Runde {lap}: {driver} lässt den Wagen durchsehen – dann zurück auf die Bahn.',
            '🔧 Runde {lap}: Boxenhalt für {driver} – Handarbeit gegen die Uhr.',
            '🔧 Runde {lap}: {driver} steht an der Box – das Publikum reckt die Hälse.',
            '🔧 Runde {lap}: Die {team}-Mannschaft empfängt {driver} – frischer Gummi, neuer Mut.',
            '🔧 Runde {lap}: {driver} unterbricht die Hatz – Station an der Werksbox.',
            '🔧 Runde {lap}: Reifen und ein Schluck Benzin – {driver} macht Halt.',
            '🔧 Runde {lap} von {totalLaps}: Boxenhalt für {driver}.',
            '🔧 Runde {lap}: Platz {pos} zum Zeitpunkt des Halts – {driver} vertraut auf seine Mannschaft.',
            '🔧 Runde {lap}: {driver} winkt der Box zu und biegt ein – Dienst am Wagen.'
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
            '🔧 Runde {lap}: Halt an der Box – {driver} vertraut auf seine Crew.',
            '🔧 Runde {lap}: {driver} meldet sich an der Box – die Crew ist vorbereitet.',
            '🔧 Runde {lap}: Planmäßiger Halt für {driver} – {team} arbeitet konzentriert.',
            '🔧 Runde {lap}: {driver} rollt in die Gasse – Reifen wechseln, weiterfahren.',
            '🔧 Runde {lap}: Boxenstopp: {driver} steht, die Handgriffe sitzen.',
            '🔧 Runde {lap}: {driver} holt sich frischen Gummi – Platz {pos} zum Zeitpunkt des Stopps.',
            '🔧 Runde {lap}: Kein Drama, nur Arbeit: {driver} an der {team}-Box.',
            '🔧 Runde {lap}: {driver} macht Halt – die Mechaniker verlieren keine Zeit.',
            '🔧 Runde {lap}: Service für {driver} – dann wieder hinaus auf den Kurs.',
            '🔧 Runde {lap}: {driver} biegt ab zur Box – Fahrer und Crew im Zusammenspiel.',
            '🔧 Runde {lap} von {totalLaps}: {driver} nutzt den Moment für seinen Stopp.',
            '🔧 Runde {lap}: Die {team}-Box winkt {driver} herein – alles nach Plan.'
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
            '🔧 Runde {lap}: Stopp für {driver} – und wieder raus in den Verkehr!',
            '🔧 Runde {lap}: Boxenstopp {driver}! Reifen ab, Reifen drauf, weg ist er!',
            '🔧 Runde {lap}: {driver} kommt rein – hektisches Treiben an der {team}-Box!',
            '🔧 Runde {lap}: Die Crew wartet schon mit den Walzen – {driver} steht keine Sekunde länger als nötig.',
            '🔧 Runde {lap}: {driver} in der Gasse – jetzt bloß keinen Fehler!',
            '🔧 Runde {lap}: Stopp! Vier neue Reifen für {driver} – und raus!',
            '🔧 Runde {lap}: {team} ruft, {driver} kommt – Boxenstopp unter Hochspannung.',
            '🔧 Runde {lap}: {driver} verliert Sekunden, hofft auf Runden – frischer Gummi ist montiert.',
            '🔧 Runde {lap}: Kommando Boxenstopp – {driver} liefert den Wagen ab, aktuell Platz {pos}.',
            '🔧 Runde {lap}: Punktlandung vor der Crew – {driver} steht!',
            '🔧 Runde {lap}: {driver} zum Reifenwechsel – die Meute draußen fährt weiter.',
            '🔧 Runde {lap} von {totalLaps}: {driver} setzt auf einen frischen Satz – mutiges Timing?'
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
            '🔧 Runde {lap}: Stopp {driver} – jetzt zählt jeder Handgriff.',
            '🔧 Runde {lap}: {driver} folgt dem Kommando aus der Box – Stopp und Reifenwechsel.',
            '🔧 Runde {lap}: Undercut oder Pflichtstopp? {driver} ist jedenfalls drin.',
            '🔧 Runde {lap}: {team} zieht den Stopp durch – {driver} steht nur wenige Sekunden.',
            '🔧 Runde {lap}: {driver} in der Gasse – die Rechenspiele am Kommandostand laufen.',
            '🔧 Runde {lap}: Frische Reifen für {driver} – P{pos} beim Reinkommen.',
            '🔧 Runde {lap}: {driver} vertraut dem Plan – Boxenstopp nach Drehbuch.',
            '🔧 Runde {lap}: Alle Handgriffe sitzen – {driver} ist schon wieder unterwegs.',
            '🔧 Runde {lap} von {totalLaps}: {driver} stoppt – jetzt muss die Rechnung aufgehen.',
            '🔧 Runde {lap}: Boxenfunk, Einlenken, Stillstand – Stopp für {driver}.',
            '🔧 Runde {lap}: {team} wechselt bei {driver} auf frischen Gummi – sauber abgewickelt.',
            '🔧 Runde {lap}: {driver} opfert Zeit für frische Reifen – die Rechnung folgt später.'
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
            '🔧 Runde {lap}: {driver} holt sich neue Reifen – Attacke im nächsten Stint?',
            '🔧 Runde {lap}: „Box, box!" – {driver} bestätigt und kommt rein.',
            '🔧 Runde {lap}: {driver} rollt an die Marke – die Crew liefert ab.',
            '🔧 Runde {lap}: {driver} in der Box – Reifen drauf, Ampel grün, go!',
            '🔧 Runde {lap}: Stopp bei {team} – {driver} verliert kaum Zeit.',
            '🔧 Runde {lap}: {driver} zieht in die Gasse – das Strategie-Rennen läuft parallel.',
            '🔧 Runde {lap}: Frischer Satz für {driver} – jetzt bitte freie Strecke.',
            '🔧 Runde {lap} von {totalLaps}: {driver} stoppt – interessantes Fenster.',
            '🔧 Runde {lap}: {driver} kommt von P{pos} an die Box – der Rest ist Mathematik.',
            '🔧 Runde {lap}: Boxenstopp {driver} – die Crew von {team} im Sekundentakt.',
            '🔧 Runde {lap}: Kurz stehen, lange profitieren? {driver} holt neue Reifen.',
            '🔧 Runde {lap}: {driver} taucht in die Boxengasse ein – gleich geht es weiter.'
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
            '⚡ Runde {lap}: Mutprobe bestanden: {driver} ist an {victim} vorbei.',
            '⚡ Runde {lap}: {driver} wirft seinen Wagen neben den von {victim} – und ist vorbei!',
            '⚡ Runde {lap}: Welch ein Schauspiel! {driver} bezwingt {victim} in offener Fahrt.',
            '⚡ Runde {lap}: {driver} presst sich an {victim} vorbei – ein Manöver für die Geschichtsbücher.',
            '⚡ Runde {lap}: Der Kampfgeist siegt: {driver} lässt {victim} keine Wahl.',
            '⚡ Runde {lap}: {driver} stellt sich {victim} – und geht als Sieger aus dem Duell hervor.',
            '⚡ Runde {lap}: Bravourstück von {driver}! {victim} ist überholt, Platz {pos} erobert.',
            '⚡ Runde {lap}: {victim} verteidigt mit allem, was er hat – doch {driver} ist nicht aufzuhalten.',
            '⚡ Runde {lap}: Herz und Verstand in einer Kurve: {driver} überwindet {victim}.',
            '⚡ Runde {lap}: Die Tribünen beben – {driver} hat {victim} niedergerungen!',
            '⚡ Runde {lap}: {driver} zwingt seinen Wagen an {victim} vorbei – Platz {pos} ist der Lohn.',
            '⚡ Runde {lap}: Ein Wimpernschlag entscheidet – {driver} vor {victim}!'
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
            '⚡ Runde {lap}: {driver} erhöht das Tempo und lässt {victim} hinter sich.',
            '⚡ Runde {lap}: {driver} macht es besser als {victim} – Positionswechsel.',
            '⚡ Runde {lap}: Ruhig und bestimmt: {driver} überholt {victim}.',
            '⚡ Runde {lap}: {driver} stellt {victim} und zieht vorbei – Platz {pos}.',
            '⚡ Runde {lap}: {victim} lässt eine Lücke – {driver} bedankt sich.',
            '⚡ Runde {lap}: Feine Klinge statt Brechstange: {driver} geht an {victim} vorbei.',
            '⚡ Runde {lap}: {driver} hat den besseren Rhythmus und passiert {victim}.',
            '⚡ Runde {lap}: Das Duell geht an {driver} – {victim} muss sich einreihen.',
            '⚡ Runde {lap}: {driver} bleibt hartnäckig – und ist schließlich an {victim} vorbei.',
            '⚡ Runde {lap}: Sauberer Positionswechsel – {driver} übernimmt Platz {pos} von {victim}.',
            '⚡ Runde {lap}: {victim} kann das Tempo nicht halten – {driver} zieht vorbei.',
            '⚡ Runde {lap}: Geduld zahlt sich aus: {driver} findet den Weg an {victim} vorbei.'
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
            '⚡ Runde {lap}: Position getauscht: {driver} vor {victim} – das Publikum tobt!',
            '⚡ Runde {lap}: Spät gebremst, viel gewonnen – {driver} taucht innen auf und {victim} ist geschlagen!',
            '⚡ Runde {lap}: {driver} riecht die Chance – und schnappt zu! {victim} überholt.',
            '⚡ Runde {lap}: Rad an Rad durch die Kurve – dann ist {driver} vorbei an {victim}!',
            '⚡ Runde {lap}: {victim} macht die Tür zu – {driver} findet trotzdem einen Weg!',
            '⚡ Runde {lap}: Herrliches Duell! Am Ende heißt es: {driver} vor {victim}.',
            '⚡ Runde {lap}: Nicht mit der Brechstange, sondern mit Köpfchen – {driver} kassiert {victim}, Platz {pos}!',
            '⚡ Runde {lap}: Jetzt gibt es kein Halten mehr – {driver} stürmt an {victim} vorbei!',
            '⚡ Runde {lap}: {victim} rutscht einen Meter zu weit – {driver} sagt danke!',
            '⚡ Runde {lap}: Showtime! {driver} zeigt {victim} die Auspuffrohre.',
            '⚡ Runde {lap}: Das war Racing! {driver} bezwingt {victim} – Platz {pos}!',
            '⚡ Runde {lap}: {driver} bleibt einfach dran – und zack, {victim} ist durchgereicht!'
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
            '⚡ Runde {lap}: {driver} arbeitet sich vor – {victim} abgehakt, jetzt P{pos}.',
            '⚡ Runde {lap}: {driver} bereitet das Manöver über mehrere Kurven vor – und vollendet gegen {victim}.',
            '⚡ Runde {lap}: Später Bremspunkt, sauberer Ausgang: {driver} überholt {victim}.',
            '⚡ Runde {lap}: {victim} kommt schlecht aus der Kurve – {driver} zieht vorbei.',
            '⚡ Runde {lap}: {driver} macht den Unterschied über die Bremse – {victim} überholt, P{pos}.',
            '⚡ Runde {lap}: Kühl analysiert, präzise ausgeführt – {driver} kassiert {victim}.',
            '⚡ Runde {lap}: {driver} setzt den Wagen millimetergenau – {victim} hat keine Chance.',
            '⚡ Runde {lap}: Der Druck war zu groß – {victim} muss {driver} passieren lassen.',
            '⚡ Runde {lap}: {driver} gewinnt das Positionsspiel gegen {victim} – P{pos}.',
            '⚡ Runde {lap}: Kein Risiko, volle Wirkung: {driver} geht kontrolliert an {victim} vorbei.',
            '⚡ Runde {lap}: {driver} ist in dieser Phase klar schneller – {victim} kann nur zusehen.',
            '⚡ Runde {lap}: Lehrbuch-Manöver: {driver} vorbei an {victim}.'
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
            '⚡ Runde {lap}: {driver} zieht vorbei – {victim} hat keine Antwort.',
            '⚡ Runde {lap}: {driver} schickt es rein – {victim} kann nur zuschauen!',
            '⚡ Runde {lap}: Move des Tages? {driver} gegen {victim} – stark!',
            '⚡ Runde {lap}: {victim} verteidigt innen – {driver} kontert außen und ist durch!',
            '⚡ Runde {lap}: Eiskalt: {driver} bremst später und holt sich {victim}.',
            '⚡ Runde {lap}: {driver} mit dem Überschuss – easy vorbei an {victim}.',
            '⚡ Runde {lap}: Side by side – und {driver} behält die Nase vorn! {victim} geschlagen.',
            '⚡ Runde {lap}: {driver} packt den Move gegen {victim} aus – P{pos}!',
            '⚡ Runde {lap}: Keine Diskussion: {driver} ist vorbei an {victim}.',
            '⚡ Runde {lap}: {victim} rutscht weit – {driver} nimmt das Geschenk an.',
            '⚡ Runde {lap}: {driver} zieht das Ding durch – {victim} überholt!',
            '⚡ Runde {lap}: Läuft bei {driver} – {victim} eingesammelt, weiter geht’s.'
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
            '❌ Runde {lap}: {driver} scheidet aus – Mensch stark, Maschine schwach.',
            '❌ Runde {lap}: {reason} – der Wagen von {driver} verstummt.',
            '❌ Runde {lap}: {reason} am {team}-Wagen – {driver} bleibt am Streckenrand zurück.',
            '❌ Runde {lap}: Die Maschine von {driver} gibt auf – {reason}.',
            '❌ Runde {lap}: {driver} klettert aus dem Wagen – die Technik hat entschieden.',
            '❌ Runde {lap}: Von Platz {pos} ins Aus – das Material lässt {driver} im Stich.',
            '❌ Runde {lap}: Stiller Abgang: {driver} rollt aus, der Kampf ist vorüber.',
            '❌ Runde {lap}: Bitternis bei {team} – der Wagen von {driver} steht still.',
            '❌ Runde {lap}: {reason} bei {driver} – der Mensch machtlos gegen die Maschine.',
            '❌ Runde {lap}: Das Feld verliert einen Kämpfer – {driver} scheidet mit Defekt aus.',
            '❌ Runde {lap}: {driver} bringt den Wagen an den Rand – weiter geht es nicht.',
            '❌ Runde {lap}: {reason} nach hartem Einsatz – {driver} muss den Grand Prix aufgeben.'
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
            '❌ Runde {lap}: {driver} ist raus – wieder fordert die Technik ihren Tribut.',
            '❌ Runde {lap}: {reason} – {driver} rollt leise aus.',
            '❌ Runde {lap}: {driver} meldet Probleme – kurz darauf steht der Wagen: {reason}.',
            '❌ Runde {lap}: Die {team}-Box streicht einen Namen – {driver} ist mit Defekt draußen.',
            '❌ Runde {lap}: {driver} stellt ab – die Technik gibt keine Antworten mehr.',
            '❌ Runde {lap}: {reason} am Wagen von {driver} – nüchternes Rennende.',
            '❌ Runde {lap}: Von Platz {pos} an den Streckenrand – {driver} scheidet aus.',
            '❌ Runde {lap}: Kein Lärm, kein Vortrieb – {driver} ist stehen geblieben.',
            '❌ Runde {lap}: {driver} beendet das Rennen unfreiwillig – {reason}.',
            '❌ Runde {lap}: Das Material entscheidet gegen {driver} – Aufgabe.',
            '❌ Runde {lap}: {reason} – für {driver} und {team} ist der Tag gelaufen.',
            '❌ Runde {lap}: {driver} zieht den Wagen von der Ideallinie und steigt aus.'
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
            '❌ Runde {lap}: {driver} parkt den Wagen an der Seite – bitterer Tag für {team}.',
            '❌ Runde {lap}: {reason}! Der {team}-Renner von {driver} verabschiedet sich.',
            '❌ Runde {lap}: {driver} wird langsamer... und langsamer... und steht! {reason}.',
            '❌ Runde {lap}: Technik-Drama bei {team} – {driver} ist raus!',
            '❌ Runde {lap}: Aus heiterem Himmel – {driver} rollt aus, Rennende!',
            '❌ Runde {lap}: {reason} – und alle Mühe von {driver} ist dahin.',
            '❌ Runde {lap}: {driver} kämpft mit dem Wagen – vergebens. Aufgabe!',
            '❌ Runde {lap}: Platz {pos} verpufft im Nichts – Defekt bei {driver}!',
            '❌ Runde {lap}: {reason} bei {driver} – ein Raunen geht durch die Reihen.',
            '❌ Runde {lap}: Wieder erwischt es einen – {driver} stellt den Wagen ab.',
            '❌ Runde {lap}: Keine Chance auf Rettung – {driver} parkt den {team}-Renner.',
            '❌ Runde {lap}: {reason} – {driver} verliert nicht den Mut, aber das Rennen.'
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
            '❌ Runde {lap}: Für {driver} ist Schluss – das Material hat versagt.',
            '❌ Runde {lap}: {reason} – {driver} rollt aus, das Rennen läuft ohne ihn weiter.',
            '❌ Runde {lap}: {driver} meldet per Funk: nichts geht mehr – {reason}.',
            '❌ Runde {lap}: Rückschlag für {team} – {driver} ist mit Defekt raus.',
            '❌ Runde {lap}: {reason} bei {driver} auf P{pos} – die Strategie ist Makulatur.',
            '❌ Runde {lap}: {driver} bringt den Wagen noch von der Linie – dann ist Schluss.',
            '❌ Runde {lap}: Stillstand statt Zielflagge – {driver} scheidet aus.',
            '❌ Runde {lap}: {reason} – {driver} und {team} bleibt nur die Fehleranalyse.',
            '❌ Runde {lap}: Das Rennen endet in der Garage – {driver} ist draußen.',
            '❌ Runde {lap}: {driver} wird vom eigenen Auto im Stich gelassen – Aufgabe.',
            '❌ Runde {lap}: {reason} bei {driver} – kein Weiterkommen, keine Punkte.',
            '❌ Runde {lap}: Kalte Dusche für {team}: {driver} parkt den Wagen – Defekt.'
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
            '❌ Runde {lap}: Technisches K.o. für {driver} – mitten im Rennen ist Schluss.',
            '❌ Runde {lap}: {reason} – {driver} rollt aus, Race over.',
            '❌ Runde {lap}: {driver} meldet sich ab – {reason}. Gar nicht gut für {team}.',
            '❌ Runde {lap}: Alarm bei {team} – und dann der Stillstand: {driver} ist raus.',
            '❌ Runde {lap}: {reason} bei {driver} – das Auto sagt einfach Nein.',
            '❌ Runde {lap}: {driver} stellt ab – Kopfschütteln in der {team}-Garage.',
            '❌ Runde {lap}: Von P{pos} in die Garage – {driver} ist draußen.',
            '❌ Runde {lap}: {reason} – {driver} parkt das Auto am Streckenrand.',
            '❌ Runde {lap}: Nichts geht mehr: DNF {driver}.',
            '❌ Runde {lap}: {driver} rollt aus – die Antwort gibt es erst in der Garage.',
            '❌ Runde {lap}: {reason} – bitterer Nuller für {driver}.',
            '❌ Runde {lap}: Auto kaputt, Rennen vorbei – {driver} steigt aus.'
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
            '❌ Runde {lap}: Jähes Ende für {driver} – das Rennen ist vorzeitig vorbei.',
            '❌ Runde {lap}: {reason} – der Wagen von {driver} rührt sich nicht mehr.',
            '❌ Runde {lap}: {driver} verliert die Herrschaft über den Wagen – das Rennen ist zu Ende.',
            '❌ Runde {lap}: Ein Raunen an der Strecke – {driver} ist ausgeschieden.',
            '❌ Runde {lap}: {reason} bei {driver} – der Wagen trägt zu viele Blessuren davon.',
            '❌ Runde {lap}: Die Tücke der Bahn – {driver} rutscht ins Aus.',
            '❌ Runde {lap}: {driver} kehrt nicht mehr auf die Bahn zurück – Aufgabe nach Zwischenfall.',
            '❌ Runde {lap}: Von Platz {pos} ins Abseits – {driver} scheidet aus.',
            '❌ Runde {lap}: {reason} – {driver} bleibt zurück, das Feld zieht weiter.',
            '❌ Runde {lap}: Ein Ausrutscher mit Folgen – {driver} muss den Grand Prix beenden.',
            '❌ Runde {lap}: Der Wagen von {driver} landet neben der Bahn – es geht nicht weiter.',
            '❌ Runde {lap}: {reason} – das Rennen von {driver} ist dahin.'
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
            '❌ Runde {lap}: Schrecksekunde – für {driver} geht es nicht weiter.',
            '❌ Runde {lap}: {reason} – {driver} stellt den lädierten Wagen ab.',
            '❌ Runde {lap}: {driver} gerät von der Strecke – zurück geht es nicht mehr.',
            '❌ Runde {lap}: Der Wagen von {driver} steht im Aus – Rennende.',
            '❌ Runde {lap}: {reason} bei {driver} – die Fahrt endet abrupt.',
            '❌ Runde {lap}: {driver} verliert den Wagen – zu viel Schaden für eine Weiterfahrt.',
            '❌ Runde {lap}: Ein Moment genügt – {driver} ist draußen.',
            '❌ Runde {lap}: Von Platz {pos} von der Strecke – bitter für {driver} und {team}.',
            '❌ Runde {lap}: {reason} – {driver} bleibt abseits der Strecke stehen.',
            '❌ Runde {lap}: {driver} kommt nicht mehr zurück auf den Kurs – Aufgabe.',
            '❌ Runde {lap}: Der Zwischenfall kostet {driver} alle Chancen – Rennende.',
            '❌ Runde {lap}: {reason} – die {team}-Mannschaft kann nur noch aufräumen.'
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
            '❌ Runde {lap}: Schock für {team}: {driver} ist abgeflogen – Rennende.',
            '❌ Runde {lap}: {driver} fliegt raus – da geht nichts mehr!',
            '❌ Runde {lap}: {reason}! Der {team}-Renner ist hinüber, {driver} ist raus.',
            '❌ Runde {lap}: Querfeldein statt Ideallinie – {driver} scheidet aus!',
            '❌ Runde {lap}: {reason} bei {driver} – der Renner ist nicht mehr zu gebrauchen.',
            '❌ Runde {lap}: Wilde Fahrt ins Nichts – {driver} ist raus aus dem Rennen!',
            '❌ Runde {lap}: Da hilft kein Schrauben mehr – Unfall, {driver} ist draußen.',
            '❌ Runde {lap}: Platz {pos} dahin – {driver} parkt unfreiwillig im Aus.',
            '❌ Runde {lap}: {reason} – die Zuschauer halten den Atem an, {driver} ist raus.',
            '❌ Runde {lap}: Aus der Traum – {driver} steht im Aus, Rennende!',
            '❌ Runde {lap}: Schreck in der {team}-Box – {driver} kommt nicht mehr zurück.',
            '❌ Runde {lap}: {reason} – wilde Szenen, am Ende steht {driver} ohne Rennen da.'
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
            '❌ Runde {lap}: {driver} rutscht ins Aus – bittere Szene für {team}.',
            '❌ Runde {lap}: {reason} – das Rennen von {driver} endet auf der Stelle.',
            '❌ Runde {lap}: {driver} verliert den Wagen – hier endet sein Arbeitstag.',
            '❌ Runde {lap}: Racing-Zwischenfall – {driver} ist draußen.',
            '❌ Runde {lap}: {reason} bei {driver} – der Wagen ist zu stark beschädigt.',
            '❌ Runde {lap}: {driver} kommt von der Linie ab – Aufgabe.',
            '❌ Runde {lap}: Aus auf P{pos} – {driver} kann den Wagen nicht mehr zurückbringen.',
            '❌ Runde {lap}: {reason} – hartes Ende für {driver} und {team}.',
            '❌ Runde {lap}: {driver} rollt beschädigt aus – dieses Rennen ist Geschichte.',
            '❌ Runde {lap}: Der Unfall beendet alle Planspiele – {driver} scheidet aus.',
            '❌ Runde {lap}: {reason} auf P{pos} – für {driver} ist hier Endstation.',
            '❌ Runde {lap}: Bittere Bilder für {team}: der Wagen von {driver} steht im Aus.'
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
            '❌ Runde {lap}: Rennende für {driver} – so schnell kann es gehen.',
            '❌ Runde {lap}: Kein Weiterkommen für {driver} – Rennen gelaufen!',
            '❌ Runde {lap}: {reason}! {driver} kommt da nicht mehr raus – DNF.',
            '❌ Runde {lap}: Replays laufen – Fakt ist: {driver} ist draußen.',
            '❌ Runde {lap}: {reason} bei {driver} – das Auto ist durch.',
            '❌ Runde {lap}: {driver} verliert es – und P{pos} gleich mit. Rennende.',
            '❌ Runde {lap}: Einmal zu weit – {driver} ist raus, das Auto steht.',
            '❌ Runde {lap}: {reason} – {team} bleibt nur der Frust, {driver} ist raus.',
            '❌ Runde {lap}: So war das nicht geplant – {driver} scheidet nach Unfall aus.',
            '❌ Runde {lap}: {driver} parkt im Aus – bittere Szene für {team}.',
            '❌ Runde {lap}: Der Wagen von {driver} ist hin – hier geht heute nichts mehr.',
            '❌ Runde {lap}: {reason} – und für {driver} ist dieser Renntag beendet.'
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
            '🏁 Ziel! {driver} gewinnt – Motorsport, wie er im Buche steht.',
            '🏁 Die karierte Flagge! {driver} führt den {team}-Wagen als Ersten über die Linie.',
            '🏁 Sieg für {driver}! Blumen und Lorbeer warten auf den Helden des Tages.',
            '🏁 {driver} hat es vollbracht – der Grand Prix gehört ihm!',
            '🏁 Am Ende steht ein Name über allen: {driver}!'
        ],
        e62: [
            '🏁 Zielflagge: {driver} gewinnt für {team}!',
            '🏁 Sieg für {driver} – eine reife Leistung.',
            '🏁 {driver} überquert die Linie als Erster – Jubel bei {team}.',
            '🏁 Das Rennen ist entschieden: {driver} heißt der Sieger.',
            '🏁 {driver} gewinnt den Grand Prix – Glückwunsch an Fahrer und {team}.',
            '🏁 Karierte Flagge – und {driver} ist der Mann des Tages.',
            '🏁 Sieg! {driver} bringt den {team}-Wagen als Ersten nach Hause.',
            '🏁 {driver} macht den Sieg perfekt – ein Erfolg für {team}.',
            '🏁 {driver} sieht die Zielflagge als Erster – eine reife Vorstellung.',
            '🏁 Der Sieg geht an {driver} – saubere Arbeit von Fahrer und {team}.',
            '🏁 Zielflagge für {driver} – die Mannschaft von {team} applaudiert an der Mauer.',
            '🏁 {driver} beendet das Rennen an der Spitze – Glückwunsch!'
        ],
        e76: [
            '🏁 Zielflagge! {driver} gewinnt – Riesenjubel bei {team}!',
            '🏁 Sieg für {driver}! Was für ein Rennen!',
            '🏁 {driver} holt sich den Sieg – die {team}-Box steht Kopf!',
            '🏁 Da ist die karierte Flagge – {driver} gewinnt den Grand Prix!',
            '🏁 Ganz oben: {driver}! Ein Triumph, der sich gewaschen hat.',
            '🏁 {driver} fährt als Erster über die Linie – Sieg für {team}!',
            '🏁 Gänsehaut an der Strecke: {driver} gewinnt!',
            '🏁 Der Sieg geht an {driver} – Champagner für {team}!',
            '🏁 Da ist das Ziel – und da ist der Sieger: {driver}!',
            '🏁 Arme hoch bei {team} – {driver} gewinnt diesen Grand Prix!',
            '🏁 {driver} kommt, sieht die Flagge – Sieg! Die Box flippt aus!',
            '🏁 Feierabend – und ganz vorne steht {driver}! {team} jubelt.'
        ],
        e94: [
            '🏁 Zielflagge: Sieg für {driver} und {team}!',
            '🏁 {driver} gewinnt den Grand Prix – Jubel an der {team}-Box.',
            '🏁 P1 für {driver} – die Arbeit des ganzen Teams zahlt sich aus.',
            '🏁 Sieg! {driver} bringt es ins Ziel – {team} feiert.',
            '🏁 Die karierte Flagge fällt: {driver} heißt der Sieger.',
            '🏁 {driver} kreuzt die Linie als Erster – ein perfekter Renntag für {team}.',
            '🏁 Das Ziel! {driver} gewinnt – Glückwunsch!',
            '🏁 Sieg für {driver} – dieser Grand Prix gehört ihm.',
            '🏁 Zielflagge – {driver} macht den Sieg für {team} perfekt.',
            '🏁 P1 {driver}! Am Kommandostand von {team} fallen sich alle in die Arme.',
            '🏁 Das Rennen ist beendet – der Sieg gehört {driver}.',
            '🏁 Karierte Flagge: {driver} holt den Sieg – starke Teamleistung von {team}.'
        ],
        e10: [
            '🏁 Zielflagge! {driver} gewinnt das Rennen – großer Jubel bei {team}!',
            '🏁 P1! {driver} holt den Sieg!',
            '🏁 {driver} gewinnt! Die {team}-Garage explodiert vor Freude!',
            '🏁 Karierte Flagge – der Sieg geht an {driver}!',
            '🏁 Was für ein Tag für {team}: {driver} gewinnt den Grand Prix!',
            '🏁 {driver} bringt es nach Hause – Sieg!',
            '🏁 Ziel! {driver} steht ganz oben – Glückwunsch an {team}.',
            '🏁 Sieg für {driver}! {team} darf feiern.',
            '🏁 {driver} gewinnt! Jubelschreie im {team}-Funk!',
            '🏁 Zielflagge – dieser Sieg geht an {driver}!',
            '🏁 P1! {driver} liefert – und {team} feiert.',
            '🏁 Das war’s – {driver} bringt den Sieg über die Linie!'
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
