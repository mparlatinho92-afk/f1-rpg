// Paket 1b – Ticker: Regen und rote Flagge. Wird in LIVE_COMMENTARY eingehängt.
// Platzhalter: {lap} {leader} {totalLaps} {fieldSize} – nie gebeugt, nie mit Genitiv-s.
// Jeder Pool enthält Zeilen mit nur {lap} bzw. nur einem Teil der Platzhalter,
// damit das Spiel immer etwas belegen kann.
const LIVE_COMMENTARY_1B = {

  // ── wet_start: {fieldSize}, {totalLaps} – je Ära 2 ohne, 2 nur fieldSize, 2 nur totalLaps, 2 beide ──
  wet_start: {
    e50: [
      '🌧️ Der Himmel hat entschieden: Die Bahn liegt nass, und das Feld muss sich dem Wetter stellen.',
      '🌧️ Regenschwere Luft über der Strecke – heute wiegt der Mut ebenso schwer wie der Motor.',
      '🌧️ {fieldSize} Wagen stehen auf glänzender Bahn – ein Grand Prix im Zeichen des Wassers.',
      '🌧️ {fieldSize} Piloten wagen sich auf die nasse Bahn, und Beherrschung wird mehr gelten als Kraft.',
      '🌧️ {totalLaps} Runden auf nasser Fahrbahn – eine Prüfung für Mann und Maschine.',
      '🌧️ Über {totalLaps} Runden bleibt die Bahn ein glatter, tückischer Gegner.',
      '🌧️ {fieldSize} Wagen, {totalLaps} Runden, und über allem ein nasser Himmel – so beginnt dieser Grand Prix.',
      '🌧️ Das Feld von {fieldSize} Wagen geht auf die weite Reise über {totalLaps} Runden, auf einer Bahn, die vor Nässe glänzt.'
    ],
    e62: [
      '🌧️ Nasse Bahn zum Start: Das Rennen wird unter schwierigen Bedingungen ausgetragen.',
      '🌧️ Die Strecke ist von Beginn an nass, die Fahrer haben wenig Haftung zu erwarten.',
      '🌧️ {fieldSize} Wagen im Regenrennen – Haftung und Fingerspitzengefühl sind gefragt.',
      '🌧️ Für alle {fieldSize} Fahrer beginnt das Rennen auf nasser Bahn.',
      '🌧️ Auf nasser Bahn stehen {totalLaps} Runden bevor – Geduld und Kontrolle zählen.',
      '🌧️ {totalLaps} Runden bei Nässe – Konzentration wird über die gesamte Distanz verlangt.',
      '🌧️ {fieldSize} Wagen, {totalLaps} Runden, eine durchgehend nasse Bahn – ein Rennen der Vorsicht.',
      '🌧️ Ein Regenrennen: {fieldSize} Wagen gehen auf die Distanz von {totalLaps} Runden.'
    ],
    e76: [
      '🌧️ Regenrennen! Die Bahn ist klatschnass, das wird eine Rutschpartie.',
      '🌧️ Wasser auf der Strecke, Gischt in der Luft – das Feld fährt ins Ungewisse.',
      '🌧️ {fieldSize} Autos, eine nasse Piste – jetzt wird es wild!',
      '🌧️ Alle {fieldSize} Wagen kämpfen mit dem Wasser – kaum Grip, viel Risiko.',
      '🌧️ {totalLaps} Runden im Nassen – das ist Schwerstarbeit!',
      '🌧️ {totalLaps} Runden auf schmieriger Piste, da ist echte Fahrkunst gefragt.',
      '🌧️ {fieldSize} Wagen, {totalLaps} Runden, nasse Piste – Nervenkitzel pur!',
      '🌧️ Regenschlacht: {fieldSize} Autos, {totalLaps} Runden, und die Piste bleibt nass!'
    ],
    e94: [
      '🌧️ Nasses Rennen von Beginn an – Reifenwahl und Fahrzeugabstimmung stehen im Fokus.',
      '🌧️ Die Strecke ist durchgehend nass, Aquaplaning lauert in jeder Kurve.',
      '🌧️ {fieldSize} Fahrzeuge im Regen – der Grip bleibt das große Thema.',
      '🌧️ {fieldSize} Wagen auf nasser Piste – Traktion und Fingerspitzengefühl zählen.',
      '🌧️ {totalLaps} Runden bei Nässe – die Reifen werden über die Distanz gefordert.',
      '🌧️ Über {totalLaps} Runden bleibt die Strecke nass, Gischt und Sichtweite werden zum Thema.',
      '🌧️ {fieldSize} Fahrzeuge, {totalLaps} Runden, nasse Piste – ein technisch anspruchsvolles Rennen.',
      '🌧️ Regenrennen: {fieldSize} Autos gehen auf {totalLaps} Runden, Setup und Reifenwahl sind jetzt alles.'
    ],
    e10: [
      '🌧️ Nasses Rennen von Anfang an – hier ist alles möglich!',
      '🌧️ Die Bahn ist nass, die Gischt fliegt – das wird ein Kraftakt für alle.',
      '🌧️ {fieldSize} Autos im Regen – jetzt zählt jede Entscheidung!',
      '🌧️ Alle {fieldSize} Fahrzeuge fahren im Nassen – das kann jederzeit kippen.',
      '🌧️ {totalLaps} Runden auf nasser Strecke – das wird lang und wild!',
      '🌧️ {totalLaps} Runden im Nassen, hier ist volle Konzentration gefragt.',
      '🌧️ {fieldSize} Autos, {totalLaps} Runden, nasse Strecke – das verspricht Spektakel!',
      '🌧️ Regenrennen! {fieldSize} Fahrzeuge, {totalLaps} Runden – und die Piste bleibt nass.'
    ]
  },

  // ── rain_arrives: {lap}, {leader} – je Ära 4 nur lap, 4 lap + leader ──
  rain_arrives: {
    e50: [
      '🌧️ Runde {lap}: Dunkle Wolken öffnen sich – die ersten Tropfen fallen auf die Bahn.',
      '🌧️ Runde {lap}: Der Regen setzt ein, und mit ihm wird die Prüfung härter.',
      '🌧️ Runde {lap}: Ein Schauer geht über der Strecke nieder, die Bahn beginnt zu glänzen.',
      '🌧️ Runde {lap}: Wetterumschwung! Das Wasser legt sich auf die Fahrbahn.',
      '🌧️ Runde {lap}: {leader} führt das Feld in den einsetzenden Regen.',
      '🌧️ Runde {lap}: Regen fällt, an der Spitze liegt {leader} – nun wird sich Können zeigen.',
      '🌧️ Runde {lap}: Der Himmel öffnet seine Schleusen, und {leader} führt durch das Nass.',
      '🌧️ Runde {lap}: Mit dem Regen beginnt ein neuer Kampf – an der Spitze: {leader}.'
    ],
    e62: [
      '🌧️ Runde {lap}: Regen setzt ein, die Strecke wird zusehends nass.',
      '🌧️ Runde {lap}: Die ersten Tropfen fallen, die Bahn verliert an Haftung.',
      '🌧️ Runde {lap}: Es beginnt zu regnen – die Fahrer müssen ihre Linie neu finden.',
      '🌧️ Runde {lap}: Ein Regenschauer zieht auf, die Bedingungen ändern sich.',
      '🌧️ Runde {lap}: Regen setzt ein, {leader} führt das Feld an.',
      '🌧️ Runde {lap}: Die Strecke wird nass, an der Spitze liegt {leader}.',
      '🌧️ Runde {lap}: Wetterwechsel – {leader} führt das Rennen nun auf feuchter Bahn.',
      '🌧️ Runde {lap}: Es regnet, und {leader} führt das Feld in die schwierigeren Bedingungen.'
    ],
    e76: [
      '🌧️ Runde {lap}: Jetzt regnet es! Die Piste wird rutschig.',
      '🌧️ Runde {lap}: Regen! Die Strecke wird nass, das Feld muss reagieren.',
      '🌧️ Runde {lap}: Erst ein paar Tropfen, dann mehr – es regnet!',
      '🌧️ Runde {lap}: Wetterumschwung! Das Rennen bekommt eine neue Wendung.',
      '🌧️ Runde {lap}: Regen setzt ein – {leader} führt, und die Piste wird glatt!',
      '🌧️ Runde {lap}: Es regnet! An der Spitze: {leader}.',
      '🌧️ Runde {lap}: Nasse Piste, neue Lage – {leader} führt das Feld an.',
      '🌧️ Runde {lap}: Regen auf der Strecke, und {leader} liegt vorn – jetzt wird es spannend!'
    ],
    e94: [
      '🌧️ Runde {lap}: Der Regen setzt ein, der Grip lässt nach.',
      '🌧️ Runde {lap}: Erste Tropfen auf der Strecke – die Frage nach den Reifen stellt sich.',
      '🌧️ Runde {lap}: Es beginnt zu regnen, die Bedingungen kippen.',
      '🌧️ Runde {lap}: Regenfront über der Strecke – die Bahn wird zunehmend nass.',
      '🌧️ Runde {lap}: {leader} führt, während der Regen einsetzt und der Grip merklich sinkt.',
      '🌧️ Runde {lap}: Die Strecke wird nass – an der Spitze liegt {leader}.',
      '🌧️ Runde {lap}: Wetterumschwung, und {leader} führt in die feuchten Bedingungen.',
      '🌧️ Runde {lap}: Regen zieht auf, vorn liegt {leader} – die Reifenwahl wird zum Thema.'
    ],
    e10: [
      '🌧️ Runde {lap}: Es fängt an zu regnen!',
      '🌧️ Runde {lap}: Regen setzt ein – jetzt wird es knifflig.',
      '🌧️ Runde {lap}: Die ersten Tropfen fallen, und die Strecke wird rutschig.',
      '🌧️ Runde {lap}: Wetterumschwung! Der Regen ist da.',
      '🌧️ Runde {lap}: Regen! {leader} führt das Feld in die nassen Bedingungen.',
      '🌧️ Runde {lap}: Der Regen setzt ein, an der Spitze liegt {leader}.',
      '🌧️ Runde {lap}: Jetzt wird es nass – {leader} führt, und die Strecke wird glatt.',
      '🌧️ Runde {lap}: Regen auf der Strecke, {leader} vorne – das kann alles verändern!'
    ]
  },

  // ── track_drying: {lap}, {leader} – je Ära 4 nur lap, 4 lap + leader ──
  track_drying: {
    e50: [
      '☀️ Runde {lap}: Die Wolken reißen auf, die Bahn beginnt langsam abzutrocknen.',
      '☀️ Runde {lap}: Ein erster Sonnenstrahl fällt auf die Strecke, das Wasser weicht.',
      '☀️ Runde {lap}: Der Regen hat nachgelassen, die Fahrbahn wird zusehends trockener.',
      '☀️ Runde {lap}: Die Bahn trocknet, eine helle Spur zeichnet sich ab.',
      '☀️ Runde {lap}: Die Bahn trocknet ab, und {leader} führt das Feld in bessere Bedingungen.',
      '☀️ Runde {lap}: Die Sonne bricht durch, an der Spitze liegt {leader}.',
      '☀️ Runde {lap}: Das Wasser verschwindet von der Strecke – an der Spitze: {leader}.',
      '☀️ Runde {lap}: Der Himmel klärt sich, und {leader} führt das Feld über die abtrocknende Bahn.'
    ],
    e62: [
      '☀️ Runde {lap}: Die Strecke trocknet ab, die Haftung nimmt wieder zu.',
      '☀️ Runde {lap}: Der Regen hat aufgehört, die Bahn wird zunehmend trocken.',
      '☀️ Runde {lap}: Es klart auf – auf der Ideallinie zeigt sich die erste trockene Spur.',
      '☀️ Runde {lap}: Die Bedingungen bessern sich, die Fahrbahn trocknet.',
      '☀️ Runde {lap}: Die Strecke trocknet ab, {leader} führt das Feld an.',
      '☀️ Runde {lap}: Der Regen lässt nach, an der Spitze liegt {leader}.',
      '☀️ Runde {lap}: Die Sonne setzt sich durch – {leader} führt auf abtrocknender Bahn.',
      '☀️ Runde {lap}: Die Nässe weicht von der Strecke, {leader} liegt vorn.'
    ],
    e76: [
      '☀️ Runde {lap}: Die Sonne kommt raus, die Piste trocknet ab!',
      '☀️ Runde {lap}: Es hört auf zu regnen – die Strecke wird griffiger.',
      '☀️ Runde {lap}: Eine trockene Linie zeichnet sich ab, das ändert einiges.',
      '☀️ Runde {lap}: Der Regen ist durch, jetzt trocknet die Bahn.',
      '☀️ Runde {lap}: Die Piste trocknet, und {leader} führt das Feld an.',
      '☀️ Runde {lap}: Sonne statt Regen – {leader} liegt vorn!',
      '☀️ Runde {lap}: Abtrocknende Strecke, {leader} an der Spitze – jetzt wird es spannend.',
      '☀️ Runde {lap}: Das Wasser verschwindet, vorne fährt {leader}.'
    ],
    e94: [
      '☀️ Runde {lap}: Die Strecke trocknet ab, die Ideallinie wird trocken.',
      '☀️ Runde {lap}: Der Regen hat aufgehört, der Grip kehrt zurück.',
      '☀️ Runde {lap}: Die Bahn trocknet, und die Reifenfrage stellt sich neu.',
      '☀️ Runde {lap}: Erste trockene Bereiche auf der Strecke, die Bedingungen werden besser.',
      '☀️ Runde {lap}: Die Strecke trocknet ab, vorn liegt {leader}, und die Ideallinie ist schon trocken.',
      '☀️ Runde {lap}: Der Grip kehrt zurück, an der Spitze liegt {leader}.',
      '☀️ Runde {lap}: Abtrocknende Bahn, {leader} vorn – die Reifenwahl rückt in den Fokus.',
      '☀️ Runde {lap}: Die Nässe verschwindet, und {leader} führt in die besseren Bedingungen.'
    ],
    e10: [
      '☀️ Runde {lap}: Die Strecke trocknet ab!',
      '☀️ Runde {lap}: Der Regen hört auf, die Ideallinie wird trocken.',
      '☀️ Runde {lap}: Die Sonne kommt raus – jetzt wird die Reifenfrage spannend!',
      '☀️ Runde {lap}: Es trocknet ab, die Bedingungen ändern sich schon wieder.',
      '☀️ Runde {lap}: Die Strecke trocknet, {leader} führt das Feld an.',
      '☀️ Runde {lap}: Der Regen ist vorbei, vorn liegt {leader}.',
      '☀️ Runde {lap}: Abtrocknende Piste, {leader} an der Spitze – das kann jetzt kippen!',
      '☀️ Runde {lap}: Trockene Linie in Sicht, {leader} führt.'
    ]
  },

  // ── red_flag: Grund UNBEKANNT – keine Ursache nennen. e62 gilt nur 1970–75 ──
  red_flag: {
    e62: [
      '🟥 Runde {lap}: Die rote Flagge wird gezeigt, das Rennen ist unterbrochen.',
      '🟥 Runde {lap}: Unterbrechung – die Rennleitung hat das Rennen angehalten.',
      '🟥 Runde {lap}: Das Rennen wird vorübergehend unterbrochen.',
      '🟥 Runde {lap}: Rote Flagge – für den Moment ruht das Rennen.',
      '🟥 Runde {lap}: Rote Flagge, das Rennen ist unterbrochen, {leader} lag zuletzt in Führung.',
      '🟥 Runde {lap}: Unterbrechung des Rennens, die Führung hatte {leader}.',
      '🟥 Runde {lap}: Das Rennen ruht – zum Zeitpunkt der Unterbrechung führte {leader}.',
      '🟥 Runde {lap}: Die rote Flagge weht, {leader} war in Führung.'
    ],
    e76: [
      '🟥 Runde {lap}: Rote Flagge! Das Rennen ist unterbrochen.',
      '🟥 Runde {lap}: Stopp! Die Rennleitung schwenkt die rote Flagge.',
      '🟥 Runde {lap}: Unterbrechung – vorerst steht das Rennen.',
      '🟥 Runde {lap}: Rot! Das Rennen wird gestoppt.',
      '🟥 Runde {lap}: Rote Flagge! {leader} führte, als das Rennen gestoppt wurde.',
      '🟥 Runde {lap}: Unterbrechung! Vorne lag {leader}.',
      '🟥 Runde {lap}: Das Rennen steht – {leader} war in Führung.',
      '🟥 Runde {lap}: Schluss für den Moment! {leader} lag an der Spitze.'
    ],
    e94: [
      '🟥 Runde {lap}: Rote Flagge – das Rennen ist unterbrochen.',
      '🟥 Runde {lap}: Die Rennleitung zeigt Rot, das Rennen wird gestoppt.',
      '🟥 Runde {lap}: Unterbrechung! Das Rennen ruht vorerst.',
      '🟥 Runde {lap}: Rot auf allen Signalen – das Rennen ist gestoppt.',
      '🟥 Runde {lap}: Rote Flagge! Bis zur Unterbrechung führte {leader}.',
      '🟥 Runde {lap}: Das Rennen ist unterbrochen, {leader} lag an der Spitze.',
      '🟥 Runde {lap}: Rot! {leader} war in Führung, als das Rennen gestoppt wurde.',
      '🟥 Runde {lap}: Unterbrechung – die Führung hatte zuletzt {leader}.'
    ],
    e10: [
      '🟥 Runde {lap}: Rote Flagge! Jetzt steht das Rennen.',
      '🟥 Runde {lap}: Rot – das Rennen ist angehalten!',
      '🟥 Runde {lap}: Unterbrechung – die Rennleitung greift ein.',
      '🟥 Runde {lap}: Das Rennen steht – rote Flagge!',
      '🟥 Runde {lap}: Rote Flagge! {leader} führte zuletzt das Feld an.',
      '🟥 Runde {lap}: Das Rennen ist unterbrochen, vorne lag {leader}.',
      '🟥 Runde {lap}: Rot – und {leader} liegt in Führung, als alles stoppt.',
      '🟥 Runde {lap}: Stopp! {leader} war der Führende, als die rote Flagge kam.'
    ]
  },

  // ── red_flag_wet: nur bei nassem Rennen – Wetter darf genannt werden ──
  red_flag_wet: {
    e62: [
      '🟥 Runde {lap}: Bei nasser Bahn wird die rote Flagge gezeigt, das Rennen ist unterbrochen.',
      '🟥 Runde {lap}: Unterbrechung im Regenrennen – die Rennleitung hält das Rennen an.',
      '🟥 Runde {lap}: Rote Flagge auf nasser Strecke, das Rennen ruht.',
      '🟥 Runde {lap}: Das Regenrennen wird vorübergehend unterbrochen.',
      '🟥 Runde {lap}: Rote Flagge im Regen, {leader} lag in Führung.',
      '🟥 Runde {lap}: Auf nasser Bahn wird unterbrochen, die Spitze hielt {leader}.',
      '🟥 Runde {lap}: Das Rennen ruht bei Nässe – zuletzt führte {leader}.',
      '🟥 Runde {lap}: Unterbrechung im Regen, {leader} war in Führung.'
    ],
    e76: [
      '🟥 Runde {lap}: Rote Flagge im Regen! Das Rennen ist gestoppt.',
      '🟥 Runde {lap}: Bei diesem Wetter wird das Rennen unterbrochen – rot!',
      '🟥 Runde {lap}: Nasse Piste, rote Flagge – das Rennen steht.',
      '🟥 Runde {lap}: Stopp im Regen, die Rennleitung zeigt Rot!',
      '🟥 Runde {lap}: Rote Flagge im Regen! {leader} führte, als das Rennen gestoppt wurde.',
      '🟥 Runde {lap}: Unterbrechung auf nasser Piste – vorne lag {leader}.',
      '🟥 Runde {lap}: Das Rennen steht im Regen, {leader} war in Führung.',
      '🟥 Runde {lap}: Rot bei Nässe! {leader} lag an der Spitze.'
    ],
    e94: [
      '🟥 Runde {lap}: Rote Flagge bei nasser Strecke – das Rennen ist unterbrochen.',
      '🟥 Runde {lap}: Unterbrechung im Regenrennen, das Rennen ruht.',
      '🟥 Runde {lap}: Rot auf nasser Piste – das Rennen wird gestoppt.',
      '🟥 Runde {lap}: Bei diesen Bedingungen zeigt die Rennleitung die rote Flagge.',
      '🟥 Runde {lap}: Rote Flagge im Regen, bis dahin führte {leader}.',
      '🟥 Runde {lap}: Das Rennen ist bei Nässe unterbrochen, {leader} lag vorn.',
      '🟥 Runde {lap}: Rot im Regenrennen – die Führung hatte {leader}.',
      '🟥 Runde {lap}: Unterbrechung auf nasser Strecke, {leader} war in Führung.'
    ],
    e10: [
      '🟥 Runde {lap}: Rote Flagge im Regen! Das Rennen ist unterbrochen.',
      '🟥 Runde {lap}: Rot bei Nässe – das Rennen wird gestoppt!',
      '🟥 Runde {lap}: Bei diesen Bedingungen ist Schluss für den Moment – rote Flagge.',
      '🟥 Runde {lap}: Das Regenrennen steht, die Rennleitung zeigt Rot.',
      '🟥 Runde {lap}: Rote Flagge im Regen! {leader} führte zuletzt das Feld an.',
      '🟥 Runde {lap}: Unterbrechung auf nasser Strecke, vorne lag {leader}.',
      '🟥 Runde {lap}: Rot im Nassen – {leader} war der Führende.',
      '🟥 Runde {lap}: Stopp bei Regen! {leader} lag an der Spitze, als es rot wurde.'
    ]
  },

  // ── restart_new (vor 2000): Neustart. Keine Aussage über Wertung. je Ära 3 nur lap, 3 mit totalLaps ──
  restart_new: {
    e62: [
      '🟢 Runde {lap}: Das Rennen wird neu gestartet, das Feld formiert sich für den zweiten Start.',
      '🟢 Runde {lap}: Die Unterbrechung ist vorüber, ein Neustart wird angesetzt.',
      '🟢 Runde {lap}: Neustart – die Wagen gehen erneut an den Start.',
      '🟢 Runde {lap} von {totalLaps}: Der Neustart erfolgt, das Rennen beginnt von Neuem.',
      '🟢 Runde {lap}: Neustart auf der Bahn – das Rennen über {totalLaps} Runden geht in seine zweite Phase.',
      '🟢 Nach der Unterbrechung geht es neu los – Runde {lap} von {totalLaps}.'
    ],
    e76: [
      '🟢 Runde {lap}: Neustart! Das Feld steht wieder bereit.',
      '🟢 Runde {lap}: Die Ampel kommt noch einmal – es geht von vorn los!',
      '🟢 Runde {lap}: Das Rennen wird neu gestartet, die Motoren heulen auf.',
      '🟢 Runde {lap} von {totalLaps}: Neustart, und alle wollen jetzt nach vorn!',
      '🟢 Runde {lap}: Zweiter Start, {totalLaps} Runden im Blick – es geht wieder los!',
      '🟢 Neustart nach der Unterbrechung – Runde {lap} von {totalLaps}.'
    ],
    e94: [
      '🟢 Runde {lap}: Das Rennen wird neu gestartet, das Feld nimmt die Startaufstellung ein.',
      '🟢 Runde {lap}: Neustart – die Ampel geht ein zweites Mal aus.',
      '🟢 Runde {lap}: Die Unterbrechung ist beendet, es folgt ein Neustart.',
      '🟢 Runde {lap} von {totalLaps}: Neustart, das Rennen beginnt erneut.',
      '🟢 Runde {lap}: Zweiter Start, die Distanz von {totalLaps} Runden bleibt im Blick.',
      '🟢 Nach der roten Flagge geht es neu los – Runde {lap} von {totalLaps}.'
    ]
  },

  // ── restart_resume (ab 2000): Fortsetzung. Reifen, Zusammenschieben, Chance – kein Profiteur ──
  restart_resume: {
    e94: [
      '🟢 Runde {lap}: Das Rennen wird fortgesetzt, die Abstände sind gelöscht und das Feld steht dicht beisammen.',
      '🟢 Runde {lap}: Fortsetzung! Neue Reifen gibt es frei, das Feld ist zusammengeschoben.',
      '🟢 Runde {lap}: Weiter geht es, mit gelöschten Abständen und neuer Chance für die Verfolger.',
      '🟢 Runde {lap}: Fortsetzung mit {leader} an der Spitze – die Verfolger sind ganz dicht dran.',
      '🟢 Runde {lap}: Das Feld ist zusammengerückt, {leader} führt, und alle Reifen dürfen neu aufgezogen werden.',
      '🟢 Runde {lap}: Weiter im Rennen, {leader} vorn – die Abstände sind auf null gesetzt.'
    ],
    e10: [
      '🟢 Runde {lap}: Weiter geht es! Die Abstände sind gelöscht, das Feld steht dicht beisammen.',
      '🟢 Runde {lap}: Das Rennen wird fortgesetzt, neue Reifen gibt es frei!',
      '🟢 Runde {lap}: Fortsetzung – das Feld ist zusammengeschoben, und die Verfolger haben ihre Chance.',
      '🟢 Runde {lap}: Weiter im Rennen, {leader} an der Spitze, alle dicht dahinter!',
      '🟢 Runde {lap}: Fortsetzung mit {leader} vorn – frische Reifen und ein enges Feld, das wird wild!',
      '🟢 Runde {lap}: Es geht weiter, {leader} führt, und die Abstände sind weg.'
    ]
  }
};

/*
  KOMMENTAR – wo ich unsicher war

  Grammatik:
  - {leader} steht immer als Subjekt („{leader} führt“) oder mit unveränderlichem Bezug
    („die Führung hatte {leader}“, „vorne lag {leader}“). Nirgends Genitiv-s.
  - {fieldSize} / {totalLaps} stehen als Ziffer vor „Wagen/Fahrer/Autos/Fahrzeuge“ bzw. „Runden“.
    Bei totalLaps = 1 oder fieldSize = 1 wäre der Plural falsch – im Spiel unrealistisch.
  - restart_new nutzt „Runde {lap} von {totalLaps}“, das ist immer wahr und sagt nichts
    über die Distanz nach dem Neustart.

  Ton:
  - e62 bei red_flag ist nur 1970–75 aktiv, deshalb bewusst nüchtern; kein TV-Ton.
  - e94 deckt 1994–2009 ab: „Reifenwahl / Grip / Ideallinie“ passt über die ganze Spanne,
    aber „Setup“ und „Aquaplaning“ klingen eher nach der zweiten Hälfte.
  - e10-Zeilen wie „das kann alles verändern“ sind typisch Broadcast, aber leicht wertend.

  Bewusst NICHT gesagt:
  - Keine Ursache der roten Flagge (kein Unfall, Öl, Feuer, Trümmer, Streckenbegrenzung).
  - Bei red_flag_wet wird das Wetter nur als Kulisse genannt, nicht als Auslöser.
  - Bei restart_new nichts zu Wertung, Punkten oder Addition.
  - Bei restart_resume kein Profiteur: nur Reifen, Zusammenschieben, neue Chance für Verfolger.
  - Bei wet_start nicht behauptet, dass es gerade regnet, nur dass die Bahn nass ist.
*/
