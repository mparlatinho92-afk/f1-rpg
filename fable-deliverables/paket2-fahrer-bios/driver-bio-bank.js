// ============================================================================
// Paket 2 — Kurzbiografien für GENERIERTE Fahrer (Fable-Deliverable, 2026-07-10)
// ============================================================================
// Inline-fähig (Grundregel 4): direkt in index.html einbetten, KEIN data/*.js.
// NUR für generierte Fahrer (_obitIsReal(drv)===false) — reale Fahrer haben
// DRIVER_LORE (Paket C), keine Duplikation (SPEC §0).
//
// Struktur (bewusste Verfeinerung der SPEC-Skizze, Begründung unten):
//   DRIVER_BIO_BANK.kern[archetype][register]  = [5 Varianten]   ← Satz 1, ära-spezifisch
//   DRIVER_BIO_BANK.farbe[archetype]           = [6 Varianten]   ← Satz 2, ära-NEUTRAL
//
// Warum der Split: Viele generierte Fahrer teilen denselben Archetyp × dieselbe
// Ära. 5 Komplett-Bios → 2 Fahrer hätten mit p=1/5 dieselbe Bio. Kern×Farbe →
// ~30 Kombinationen pro Archetyp×Ära (Grundregel 6). Die farbe-Pools sind dafür
// streng ära-neutral formuliert (kein Technik-/Broadcast-Vokabular) — gleiches
// Muster wie die geteilten stats/close-Pools der OBIT_BANK.
//
// Slot-Kontrakt (verbindlich für die Opus-Map, SPEC §2 + Grundregel 5):
//   {name}      Anzeigename, nie dekliniert
//   {nationAdj} VOLLSTÄNDIGE Nominativ-NP mit kleingeschriebenem Artikel
//               („der Brasilianer", „der Monegasse"). Templates deklinieren sie
//               NIE, stellen NIE Artikel/Adjektive davor („ein junger der …" ✗).
//               Satzanfang: der Assembler kapitalisiert das erste Zeichen.
//   {ageText}   von der SPEC angeboten, hier BEWUSST UNGENUTZT: Das Alter steckt
//               implizit im Archetyp (rohdiamant=jung, routinier=alt) — so kann
//               nie ein leerer Alters-Slot eine Zeile zerstören.
//
// Alters-Stimmigkeit (SPEC §3) liegt beim Opus-Klassifikator: rohdiamant-Pools
// setzen „jung + wenige Starts" voraus, routinier-Pools „erfahren + älter" —
// der Klassifikator darf diese Keys nur passend vergeben.
//
// ────────────────────────────────────────────────────────────────────────────
// KALIBER-LEITPLANKEN (VERBINDLICH für den Opus-Klassifikator — Nutzer-Vorgabe
// 2026-07-10): Die Pools loben in FELD-Relation. Ein Archetyp darf nur vergeben
// werden, wenn der Fahrer die Feld-Schwelle wirklich erreicht — ein mittel-
// mäßiger Fahrer darf NIE eine Tempo-/Klasse-Lob-Zeile bekommen:
//
//   draufgaenger  pace DEUTLICH über Feld-Schnitt (Richtwert: oberes Viertel
//                 des Felds) UND consistency deutlich darunter. „Nur gut"
//                 reicht NICHT — die Zeilen behaupten Ausnahme-Speed
//                 („ans Limit prügelt", „Mega-Speed", „reine Pace unbestritten").
//   regenmeister  rain deutlich über EIGENEM Schnitt UND über Feld-Schnitt —
//                 die Zeilen behaupten Feld-Stärke bei Nässe („zu den
//                 Stärksten im Feld").
//   metronom      consistency deutlich über Feld-Schnitt, pace nicht deutlich
//                 unter Feld-Schnitt — die Zeilen loben nur Konstanz, nie Speed.
//   rohdiamant    jung + wenige Starts + potentialPace deutlich über Feld-Schnitt.
//   routinier     hohe experience + älter + Gesamtniveau ≥ Feld-Schnitt
//                 (alternde Hinterfeld-Veteranen → kaempfer, die Zeilen
//                 behaupten „das Tempo kaum berührt").
//   allrounder    ausgewogen UND Gesamtniveau ≈ Feld-Schnitt oder darüber —
//                 die Zeilen behaupten „keine Schwäche / überall konkurrenzfähig".
//   kaempfer      ALLES darunter: Mittelfeld-/Hinterfeld-Kaliber ohne Spezial-
//                 stärke. Ehrlicher Respekt-Ton (Backmarker-Register wie in
//                 OBIT_BANK) OHNE jedes Tempo-/Klasse-Lob. → Der korrekte
//                 Archetyp für schwache generierte Fahrer; der Code-Fallback
//                 allrounder ist NUR für Klassifikator-Ausfälle gedacht.
// ────────────────────────────────────────────────────────────────────────────
//
// Determinismus (SPEC §4): Seed aus drv.id — Bio bleibt bei jedem Profil-Aufruf
// identisch. Referenz-Assembler unten nutzt _recapRng/_recapHash wie Paket B/C.
// ============================================================================

const DRIVER_BIO_BANK = {

    kern: {
        // ── REGENMEISTER — rain deutlich über eigenem Schnitt ──────────────
        regenmeister: {
            e50: [
                '{nationAdj}, der aufblüht, wenn der Regen über die Bahn peitscht – dann fährt {name} in einer eigenen Welt.',
                'wenn andere Piloten den Himmel fürchten, sucht {name} ihn – ein Fahrer für die nassen Tage.',
                '{nationAdj} mit einem seltenen Gespür für nasse Fahrbahn – je tückischer die Bedingungen, desto ruhiger seine Hand.',
                'im Trockenen ein solider Pilot, im Regen ein Gegner, den niemand gern im Rückspiegel sieht: {name}.',
                'man sagt, {name} höre den Regen gern auf dem Helm trommeln – auf rutschiger Bahn wächst dieser Pilot über sich hinaus.'
            ],
            e62: [
                '{nationAdj}, dessen Stärke mit jedem Regentropfen wächst – {name} gehört das nasse Element.',
                'ein Fahrer mit feinem Gefühl für wenig Grip: im Regen ist {name} in seinem Element.',
                'wenn die Bahn nass wird, beginnt seine Zeit: {name}, Spezialist für schwierige Verhältnisse.',
                '{nationAdj} mit ruhigem Gasfuß, wenn es glatt wird – Regenrennen sind seine Bühne.',
                'die Kollegen respektieren {name} bei jedem Wetter – bei Nässe fürchten sie ihn.'
            ],
            e76: [
                'wenn der Regen kommt, gehen die Blicke zu {name} – der Mann für die nassen Tage.',
                '{nationAdj}, der bei Nässe eine Klasse für sich sein kann – Aquaplaning scheint für ihn nicht zu existieren.',
                'im Trockenen ein solider Racer, im Regen ein Spektakel: {name}.',
                'grauer Himmel, glänzender Asphalt – beste Voraussetzungen für {name}.',
                '{name} und der Regen – eine Beziehung, von der andere Fahrer nur träumen können.'
            ],
            e94: [
                'die Stoppuhr kennt sein Geheimnis: sobald die Strecke nass ist, fährt {name} über seinem sonstigen Niveau.',
                '{nationAdj} mit außergewöhnlichem Gefühl für Grip – Regenrennen sind die Spezialität von {name}.',
                'wenn die Intermediates aufgezogen werden, steigt sein Aktienkurs: {name} liebt die Nässe.',
                'im Regen relativiert sich Material – und genau dann schlägt die Stunde von {name}.',
                'nasse Strecke, schlechte Sicht, wandernde Bremspunkte – Bedingungen, in denen {name} erst richtig aufwacht.'
            ],
            e10: [
                'Regenwarnung? Für {name} ist das eine Einladung – bei Nässe zählt er zu den Stärksten im Feld.',
                '{nationAdj}, der im Regen konstant liefert, wenn andere schwimmen: {name}.',
                'wenn der Regenradar anschlägt, lohnt der Blick auf {name} – Regen-Spezialist durch und durch.',
                'volle Gischt, kaum Sicht – und {name} mittendrin in seinem Element.',
                'die Ingenieure wissen: sobald es regnet, kommt der Speed von {name} von ganz allein.'
            ]
        },

        // ── METRONOM — hohe consistency, mittlere pace ─────────────────────
        metronom: {
            e50: [
                '{nationAdj}, der Runde um Runde wie mit dem Lineal gezogen fährt – {name}, die Verlässlichkeit in Person.',
                'kein Draufgänger, kein Hasardeur – {name} bringt den Wagen mit eiserner Gleichmäßigkeit über die Distanz.',
                'seine Rundenzeiten gleichen einander wie Perlen an der Schnur: {name} fährt mit der Ruhe eines Uhrwerks.',
                '{name} gewinnt keinen Schönheitspreis für Spektakel – dafür weiß man immer, woran man mit ihm ist.',
                'ein Pilot der leisen Präzision: {name} macht wenig Fehler und noch weniger Aufhebens darum.'
            ],
            e62: [
                '{nationAdj} mit der Präzision eines Uhrmachers – {name} liefert Runde für Runde dieselbe Zeit.',
                'was ihm an letzter Schärfe fehlt, macht {name} mit seltener Konstanz wett – schwache Tage sind bei ihm die Ausnahme.',
                'die Mechaniker lieben ihn: {name} bringt das Material heil und die Zeiten stabil nach Hause.',
                '{name} fährt unauffällig – und genau das ist seine Stärke.',
                'kein Mann der großen Geste: {name} sammelt seine Meter mit stiller Zuverlässigkeit.'
            ],
            e76: [
                'während andere die Schlagzeilen suchen, sammelt {name} Rundenzeiten wie ein Metronom – tack, tack, tack.',
                '{nationAdj}, auf den Verlass ist: {name} fährt keine Fabelzeiten, aber auch kaum Fehler.',
                'im Zeittraining unauffällig, im Rennen unbestechlich – {name} ist die Sorte Fahrer, die Teams ruhig schlafen lässt.',
                '{name} liefert ab – nicht spektakulär, aber Woche für Woche.',
                'sein Fahrstil hat den Puls eines Schlafwandlers – und genau deshalb funktioniert er: {name}.'
            ],
            e94: [
                'die Telemetrie von {name} sieht aus wie kopiert: Runde für Runde nahezu identisch – Konstanz als Markenzeichen.',
                '{nationAdj}, der über eine Renndistanz kaum Zeit liegen lässt – {name} fährt mit Rennintelligenz statt Risiko.',
                'kein Fahrer für die Highlight-Rolle, aber einer für die Punktetabelle: {name} minimiert Fehler wie nur wenige.',
                '{name} fährt das Rennen wie ein Ingenieur: sauber, geplant, wiederholbar.',
                'die Strategen wissen, was sie an ihm haben: {name} setzt jeden Plan präzise um.'
            ],
            e10: [
                'Metronom-Modus: {name} klickt seine Runden ab, als wäre Reifenmanagement ein Kinderspiel.',
                '{nationAdj} mit maximaler Wiederholgenauigkeit – die Longruns von {name} sind das ruhige Rückgrat jedes Rennwochenendes.',
                'keine wilden Ausschläge, keine unnötigen Risiken: {name} liefert, was das Team einplant.',
                '{name} ist der Fahrer, dessen Rundenzeiten man stapeln kann – Konstanz pur.',
                'im Qualifying selten die Schlagzeile, im Rennen selten ein Fehler: {name}.'
            ]
        },

        // ── DRAUFGAENGER — hohe pace, niedrige consistency ─────────────────
        draufgaenger: {
            e50: [
                '{nationAdj} mit schwerem Gasfuß und leichtem Herzen – {name} kennt nur eine Richtung: nach vorn.',
                'Vorsicht ist ein Wort, das {name} nur vom Hörensagen kennt – ein Pilot wie aus den wilden Anfangstagen des Sports.',
                'sein Mut ist größer als jede Kurve – {name} fährt, als gäbe es kein Morgen.',
                '{name} verlangt seinem Wagen alles ab – und manchmal mehr, als der Wagen geben kann.',
                'das Publikum liebt ihn, die Mechaniker fürchten seine Rechnungen: {name}, ein Mann des vollen Risikos.'
            ],
            e62: [
                '{nationAdj}, der schneller fährt, als es die Vernunft empfiehlt – {name} war nie ein Freund halber Sachen.',
                'zwischen Brillanz und Bruchlandung liegt bei {name} oft nur eine Kurve – langweilig wird es mit ihm nie.',
                '{name} hat Tempo im Überfluss – nur mit dem Zähmen steht er auf Kriegsfuß.',
                'ein Fahrer, der jede Lücke nimmt, auch die, die keine ist: {name}.',
                'sein Talent stand nie in Frage, seine Selbstbeherrschung schon: {name} fährt am Limit – und gern darüber.'
            ],
            e76: [
                'Vollgas oder gar nicht: {name} kennt kein Mittelmaß – jede Runde ein Drahtseilakt.',
                '{nationAdj}, der das Auto ans Limit prügelt – spektakulär, kompromisslos, unberechenbar: {name}.',
                '{name} fährt wie entfesselt – an guten Tagen unwiderstehlich, an schlechten unhaltbar.',
                'die Fans lieben {name} für genau das, was seinen Mechanikern graue Haare beschert: null Respekt vor dem Limit.',
                'wo andere lupfen, bleibt {name} drauf – ein Mann, der jedes Rennen zur Mutprobe macht.'
            ],
            e94: [
                'maximale Attacke als Grundeinstellung: {name} kennt im Datenblatt nur eine Spalte – Vollgas.',
                '{nationAdj} mit brutaler Grundschnelligkeit und einem Hang zum Übermut – {name} eben.',
                'die reine Pace von {name} ist unbestritten – die Frage ist nur, in welcher Reihenfolge Glanztat und Fehler kommen.',
                '{name} fährt jede Runde wie eine Qualifying-Runde – mit allen Konsequenzen.',
                'Risikomanagement ist für {name} ein Fremdwort – Geschwindigkeit nicht.'
            ],
            e10: [
                'Full Attack, immer: {name} fährt, als hätte jemand den Risiko-Regler abgerissen.',
                '{nationAdj} mit Mega-Speed und kurzer Zündschnur – {name} liefert Highlights in beide Richtungen.',
                'jede Runde ein Statement: {name} kennt kein Taktieren – nur Attacke.',
                'für {name} ist das Limit keine Grenze, sondern eine Einladung.',
                'schnell, mutig, manchmal zu viel von beidem: {name}.'
            ]
        },

        // ── ROHDIAMANT — jung, wenige Starts, hohes Potenzial ──────────────
        rohdiamant: {
            e50: [
                '{nationAdj}, jung an Jahren und reich an Talent – über {name} spricht man im Fahrerlager schon jetzt.',
                'noch trägt seine Fahrweise die Spuren der Lehrjahre, doch das Talent von {name} ist unübersehbar.',
                'die alten Hasen beobachten ihn genau: {name} hat das gewisse Etwas, das man nicht lernen kann.',
                'so jung, so schnell – {name} steht erst am Anfang, und schon horcht die Konkurrenz auf.',
                'man muss kein Prophet sein, um {name} eine große Zukunft vorherzusagen – wenn er die Geduld aufbringt, sie zu erreichen.'
            ],
            e62: [
                '{nationAdj} mit rohem, ungeschliffenem Talent – {name} braucht nur noch Zeit und Kilometer.',
                'jung, hungrig, lernwillig: {name} gilt vielen im Fahrerlager als kommender Mann.',
                'noch fehlt die Erfahrung, doch die Anlagen von {name} sind erstklassig.',
                'die Rundenzeiten sind noch unstet, das Talent ist es nicht: {name}.',
                '{name} fährt erst seit kurzem in dieser Klasse – und wirkt doch, als gehöre er längst hierher.'
            ],
            e76: [
                'ein Youngster mit Feuer: {name} hat mehr Talent als Starts – noch.',
                'die Teams tuscheln längst über {name} – der nächste große Name?',
                'jung, schnell, unerschrocken: {name} bringt alles mit – jetzt fehlt nur die Routine.',
                '{nationAdj}, der noch grün hinter den Ohren, aber giftig auf der Stoppuhr ist: {name}.',
                'rohes Talent trifft jugendlichen Übermut – {name} ist einer für die Zukunft, vielleicht schon für morgen.'
            ],
            e94: [
                'die Daten sind eindeutig: {name} bringt Grundspeed mit, den man nicht trainieren kann – der Rest ist Arbeit.',
                'ein Rohdiamant im besten Wortsinn: {name} glänzt schon, geschliffen wird noch.',
                'jung und noch unfertig – aber die schnellen Runden von {name} lassen aufhorchen.',
                '{nationAdj}, in den Beobachter große Erwartungen setzen: {name} gilt als Investition in die Zukunft.',
                'das Paket ist noch nicht komplett, die Basis umso vielversprechender: {name}.'
            ],
            e10: [
                'Rookie-Vibes, große Zukunft: {name} bringt genau die Art Speed mit, die man nicht kaufen kann.',
                'jung, furchtlos und lernschnell – {name} steht auf jeder Beobachtungsliste im Paddock.',
                'das Talent ist offensichtlich, die Feinarbeit läuft: {name} ist eine Aktie mit Potenzial.',
                '{nationAdj} mit hohem Potenzial und wenig Kilometern – {name} sammelt gerade das Einzige, was ihm fehlt: Erfahrung.',
                'noch nicht das fertige Produkt – aber {name} zeigt jetzt schon Momente, die man nicht lehren kann.'
            ]
        },

        // ── ROUTINIER — hohe experience, älter ─────────────────────────────
        routinier: {
            e50: [
                '{nationAdj} der alten Schule – {name} hat mehr Rennkilometer hinter sich als mancher Konkurrent Lebensjahre.',
                'kaum eine Situation, die {name} nicht schon erlebt hätte – Erfahrung ist seine schärfste Waffe.',
                'die Jungen drängen – doch {name} weiß Dinge über das Rennfahren, die in keinem Lehrbuch stehen.',
                'ein Veteran mit wachem Blick: {name} plant seine Duelle, bevor sie beginnen.',
                '{name} gehört zum Inventar des Fahrerlagers – und wird nur von denen unterschätzt, die allein auf das Alter schauen.'
            ],
            e62: [
                'Erfahrung, gepaart mit kühlem Kopf: {name} weiß in jeder Rennsituation, was zu tun ist.',
                '{nationAdj} mit vielen Jahren im Cockpit – {name} kennt die Tricks, die auf keiner Stoppuhr erscheinen.',
                'das Alter hat ihm nichts genommen außer Illusionen: {name} fährt klug, abwartend, effektiv.',
                'die Jungen sind schneller nervös als er müde: {name}, ein Mann der ruhigen Routine.',
                '{name} braucht keine Heldentaten mehr – er braucht nur die richtige Gelegenheit.'
            ],
            e76: [
                'ein alter Fuchs im Feld: {name} riecht Chancen, bevor sie entstehen.',
                '{nationAdj} mit reichlich Kilometern auf dem Buckel – {name} fährt mit dem Kopf, nicht mit dem Ego.',
                'abgezockt im besten Sinne: {name} lässt sich von niemandem aus der Ruhe bringen.',
                'die wilde Zeit ist vorbei, die schnelle nicht: {name} setzt seine Erfahrung wie ein Werkzeug ein.',
                '{name} kennt jeden Trick im Buch – und ein paar, die nie hineingeschrieben wurden.'
            ],
            e94: [
                'Erfahrung als Wettbewerbsvorteil: {name} liest Rennen wie andere die Boxentafel.',
                '{nationAdj}, der schon alles gesehen hat – {name} bleibt cool, wenn es hektisch wird.',
                'die Reflexe mögen nicht mehr die eines Zwanzigjährigen sein – das Rennhirn von {name} ist schärfer denn je.',
                '{name} kompensiert mit Klugheit, was die Jahre kosten – ein Profi durch und durch.',
                'kein spektakulärer, aber ein kompletter Fahrer: {name} weiß immer, wo die Punkte liegen.'
            ],
            e10: [
                'der Routinier im Feld: {name} hat für jede Rennsituation ein fertiges Programm im Kopf.',
                '{nationAdj} mit jahrelanger Erfahrung – {name} macht die Dinge nicht schneller, sondern richtiger.',
                'Erfahrung schlägt Übermut: {name} bleibt gelassen, wo Jüngere überziehen.',
                '{name} kennt jede Strecke, jede Situation, jeden Trick – das Alter ist sein Werkzeugkasten.',
                'am Funk die Ruhe selbst, auf der Strecke berechenbar stark: {name}.'
            ]
        },

        // ── ALLROUNDER — ausgewogen (Fallback) ─────────────────────────────
        allrounder: {
            e50: [
                'ein Pilot ohne offene Flanke: {name} beherrscht sein Handwerk in allen Lagen.',
                '{nationAdj}, der auf jeder Bahn und bei jedem Wetter seinen Mann steht: {name}.',
                'weder Draufgänger noch Zauderer – {name} ist ein Rennfahrer aus einem Guss.',
                '{name} hat von allem genug und von nichts zu wenig – ein verlässlicher Allrounder.',
                'kein Spezialist, sondern ein Komplettpaket: {name} fährt solide durch alle Prüfungen.'
            ],
            e62: [
                'ausgewogen in allen Disziplinen: {name} hat keine Paradedisziplin – und keine Schwachstelle.',
                '{nationAdj} mit einem runden Gesamtpaket – {name} passt sich jeder Aufgabe an.',
                '{name} ist die Sorte Fahrer, die jedes Team gebrauchen kann: flexibel, solide, unkompliziert.',
                'kein Extrem, nirgends: {name} fährt ausgewogen und lässt wenig anbrennen.',
                'was {name} anpackt, macht er ordentlich – ein Fahrer der guten Mitte.'
            ],
            e76: [
                'ein Allrounder, wie er im Buche steht: {name} liefert auf jedem Streckentyp ab.',
                '{nationAdj} ohne Schwachpunkt im Repertoire – {name} ist überall gut, wenn auch nirgends unschlagbar.',
                '{name} kann schnell und kann konstant – je nachdem, was der Tag verlangt.',
                'solide Basis, breites Können: {name} muss sich vor keiner Aufgabe verstecken.',
                'die Mischung stimmt: {name} vereint Tempo, Übersicht und Nervenstärke zu einem stabilen Paket.'
            ],
            e94: [
                'das Datenblatt zeigt keine Ausreißer – nach oben wie nach unten: {name}, der Allrounder.',
                '{nationAdj} mit ausgeglichenem Profil – {name} ist auf jedem Streckentyp konkurrenzfähig.',
                'kein Spezialist, aber überall verwendbar: {name} ist die flexible Antwort auf jede Aufgabenstellung.',
                '{name} bringt ein komplettes Skillset mit – die Summe ist besser als jeder Einzelwert.',
                'verlässlich in der Breite: {name} liefert auf jedem Terrain solide Arbeit ab.'
            ],
            e10: [
                'kompletter Fahrer, kompletter Werkzeugkasten: {name} hat auf jede Frage eine Antwort.',
                '{nationAdj} mit ausgewogenem Profil – {name} performt auf jedem Streckentyp stabil.',
                'kein One-Trick-Pony: {name} nimmt jede Aufgabe eines Rennwochenendes an.',
                '{name} ist der Fahrer für alle Fälle – flexibel, stabil, unterschätzt.',
                'die Stärke von {name} ist, dass er keine Schwäche hat – zumindest keine, die man ausnutzen könnte.'
            ]
        },

        // ── KAEMPFER — Mittelfeld/Hinterfeld ohne Spezialstärke ────────────
        // Ehrlicher Respekt-Ton, KEIN Tempo-/Klasse-Lob (Kaliber-Leitplanke!)
        kaempfer: {
            e50: [
                'ein ehrlicher Arbeiter des Grand-Prix-Sports: {name} kämpft meist abseits des Rampenlichts – und kämpft doch immer.',
                '{nationAdj}, der keine Wunder verspricht: {name} fährt, was Wagen und Tag hergeben.',
                'die großen Schlagzeilen schreiben andere – {name} füllt derweil das Feld mit anständiger Arbeit.',
                'kein Star, kein Held der Chroniken: {name} gehört zu jenen, die diesen Sport am Laufen halten.',
                '{name} weiß um seine Grenzen – und begegnet ihnen mit einer Beharrlichkeit, die Respekt verdient.'
            ],
            e62: [
                'ein Mann aus dem Maschinenraum des Feldes: {name} fährt seine Rennen ohne Getöse.',
                '{nationAdj} ohne große Ansprüche auf Ruhm – {name} nimmt die Aufgaben, wie sie kommen.',
                'nicht jeder kann um Siege fahren – {name} füllt seine Rolle mit Anstand aus.',
                'kein Anwärter auf die großen Pokale, aber einer, der jede Runde ernst nimmt: {name}.',
                '{name} wird selten gefeiert und nie belächelt – Respekt verdient man sich auch weiter hinten.'
            ],
            e76: [
                'kein Kandidat für die Titelseiten: {name} verrichtet seine Arbeit dort, wo die Kameras selten hinschwenken.',
                '{nationAdj} mit begrenzten Mitteln und unbegrenztem Willen – {name} gibt nicht auf.',
                '{name} kämpft mehr mit dem Feld als um den Sieg – und bleibt trotzdem jede Woche dran.',
                'einer für die harten Meter: {name} fährt Rennen, die keine Pokale bringen, aber Charakter zeigen.',
                'zwischen Hoffen und Durchhalten: {name} kennt die zähe Seite dieses Sports besser als die glänzende.'
            ],
            e94: [
                'im Datenblatt kein Ausreißer nach oben – aber {name} bringt etwas mit, das dort nicht steht: Beharrlichkeit.',
                '{nationAdj}, der um jede Position kämpfen muss – {name} arbeitet unverdrossen an jedem Prozentpunkt.',
                'die Punkte hängen für ihn höher als für andere – {name} springt trotzdem jedes Wochenende.',
                'kein Highlight-Fahrer, kein Verzweifelter: {name} macht aus wenig Möglichkeiten ein ordentliches Handwerk.',
                '{name} gehört zu den Unauffälligen des Feldes – hartnäckig, geduldig, unbeirrbar.'
            ],
            e10: [
                'kein Fahrer für die Highlight-Reels – aber {name} bringt jede Woche vollen Einsatz.',
                '{nationAdj}, der ohne Vorschusslorbeeren auskommt: {name} definiert sich über Arbeit, nicht über Ansprüche.',
                'im Rampenlicht stehen andere – {name} kämpft derweil um jede einzelne Position.',
                'das Paket hat Grenzen, der Einsatz nicht: {name}.',
                '{name} wird keine Rekorde brechen – aber unterschätzen sollte man seinen Biss nicht.'
            ]
        }
    },

    // ── FARBE — Satz 2, ÄRA-NEUTRAL (kein Technik-/Broadcast-Vokabular!) ───
    farbe: {
        regenmeister: [
            'wenn die ersten Tropfen fallen, wird aus Respekt Vorfreude.',
            'sein Gefühl für wenig Haftung ist die Art Talent, die man hat oder nie bekommt.',
            'bei Nässe fährt er Linien, die sonst niemand sieht.',
            'schlechtes Wetter ist für ihn kein Risiko, sondern ein Verbündeter.',
            'je schwieriger die Bedingungen, desto kürzer wird die Liste seiner Gegner.',
            'was andere Fahrer Glückssache nennen, nennt er Handwerk.'
        ],
        metronom: [
            'seine größte Stärke sieht man erst in der Summe der Runden.',
            'er sammelt keine Schlagzeilen – er sammelt Zielankünfte.',
            'Fehler sind bei ihm nicht ausgeschlossen, aber selten genug, um aufzufallen.',
            'wer ihn schlagen will, muss es über die volle Distanz tun – Momente reichen nicht.',
            'er ist selten der Schnellste einer Runde – und oft der Stabilste eines Rennens.',
            'Aufregung ist für ihn ein Fremdwort, Präzision Muttersprache.'
        ],
        draufgaenger: [
            'sein Stil kennt keine halben Sachen – bewundert und gefürchtet zugleich.',
            'zwischen seinem besten und seinem schlechtesten Tag liegt ein ganzes Starterfeld.',
            'er fährt jede Runde, als wäre sie die letzte des Rennens.',
            'sicher ist bei ihm nur eines: langweilig wird es nie.',
            'sein Mut öffnet Türen, die seine Geduld gelegentlich wieder zuschlägt.',
            'man kann ihm vieles vorwerfen, aber niemals, dass er es nicht versucht hätte.'
        ],
        rohdiamant: [
            'was ihm an Erfahrung fehlt, ersetzt er vorerst mit Instinkt.',
            'die Lernkurve zeigt steil nach oben – die Frage ist nur, wie weit.',
            'noch macht er Fehler eines Anfängers – und Runden eines Könners.',
            'sein Name fällt immer öfter, wenn über die Zukunft gesprochen wird.',
            'die Anlagen sind da; jetzt entscheidet sich, was daraus wird.',
            'jeder Start bringt ihn näher an das, was in ihm steckt.'
        ],
        routinier: [
            'er hat gelernt, dass Rennen selten in der ersten Kurve gewonnen, aber oft dort verloren werden.',
            'seine Erfahrung ist die Art Vorsprung, die keine Stoppuhr misst.',
            'wo andere reagieren, hat er längst geplant.',
            'die Jahre haben sein Tempo kaum berührt – und sein Urteilsvermögen geschärft.',
            'er kennt seine Grenzen so genau, dass er sie selten braucht.',
            'Nervosität hat er irgendwann abgelegt wie einen alten Handschuh.'
        ],
        allrounder: [
            'seine Vielseitigkeit macht ihn für jedes Team zur einfachen Entscheidung.',
            'er hat keine Lieblingsbedingungen – und genau das ist der Punkt.',
            'wo immer man ihn einsetzt, kommt Brauchbares zurück.',
            'seine Stärke liegt nicht im Extrem, sondern im Zusammenspiel.',
            'unterschätzt wird er nur von denen, die noch nicht gegen ihn gefahren sind.',
            'er löst Aufgaben, statt Geschichten zu produzieren.'
        ],
        kaempfer: [
            'er weiß, dass nicht jeder Sonntag ein Feiertag ist – und fährt trotzdem jeden.',
            'sein Ehrgeiz fragt nicht nach den Erfolgsaussichten.',
            'wer weiter hinten kämpft, kämpft oft am härtesten.',
            'er nimmt, was das Rennen ihm lässt, und macht das Beste daraus.',
            'Aufgeben steht nicht in seinem Wortschatz – ganz gleich, wo er startet.',
            'sein Beitrag steht in keiner Siegerliste – im Fahrerlager kennt man ihn trotzdem.'
        ]
    }
};

// ============================================================================
// Referenz-Assembler (SPEC-Deliverable) — nutzt die Paket-B/C-Helfer
// (_recapRng/_recapHash/_recapPick/_recapFill) aus index.html.
//
//   drv  Fahrer-Objekt (drv.id → Seed, drv.name → {name})
//   ctx  { archetype, nationAdj, year }  ← Opus-Klassifikator + IOC-Map
//
// Deterministisch pro Fahrer (Seed 'bio|'+drv.id): Profil-Aufrufe liefern
// immer dieselbe Bio. Templates ohne verfügbare Slots (z.B. {nationAdj}
// fehlt in der Map) werden VOR dem Pick gefiltert → nie ein leerer Slot,
// Determinismus bleibt erhalten (Filter ist selbst deterministisch).
// ============================================================================
function generatedDriverBio(drv, ctx) {
    if (!drv || !drv.name) return '';
    ctx = ctx || {};
    const arch = DRIVER_BIO_BANK.kern[ctx.archetype] ? ctx.archetype : 'allrounder';
    const year = ctx.year || (typeof GAME_STATE !== 'undefined' ? GAME_STATE.currentYear : 2000);
    const era = year < 1962 ? 'e50' : year < 1976 ? 'e62' : year < 1994 ? 'e76' : year < 2010 ? 'e94' : 'e10';
    const T = { name: drv.name, nationAdj: ctx.nationAdj || '' };

    const avail = (pool) => {
        const ok = pool.filter(t => !(t.match(/\{(\w+)\}/g) || []).some(s => !T[s.slice(1, -1)]));
        return ok.length ? ok : pool;
    };
    const rng = _recapRng(_recapHash('bio|' + (drv.id || drv.name)));
    const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

    return cap(_recapFill(_recapPick(rng, avail(DRIVER_BIO_BANK.kern[arch][era])), T)) + ' '
         + cap(_recapFill(_recapPick(rng, avail(DRIVER_BIO_BANK.farbe[arch])), T));
}

// ============================================================================
// Testfälle (SPEC §6) — je Archetyp 1 Bio in e50 + e10 (Kern #1 + Farbe #1),
// Slots: {name}='Silva', {nationAdj}='der Brasilianer'
// ============================================================================
// regenmeister e50 → „Der Brasilianer, der aufblüht, wenn der Regen über die
//   Bahn peitscht – dann fährt Silva in einer eigenen Welt. Wenn die ersten
//   Tropfen fallen, wird aus Respekt Vorfreude."
// regenmeister e10 → „Regenwarnung? Für Silva ist das eine Einladung – bei
//   Nässe zählt er zu den Stärksten im Feld. Wenn die ersten Tropfen fallen,
//   wird aus Respekt Vorfreude."
// metronom e50 → „Der Brasilianer, der Runde um Runde wie mit dem Lineal
//   gezogen fährt – Silva, die Verlässlichkeit in Person. Seine größte Stärke
//   sieht man erst in der Summe der Runden."
// metronom e10 → „Metronom-Modus: Silva klickt seine Runden ab, als wäre
//   Reifenmanagement ein Kinderspiel. Seine größte Stärke sieht man erst in
//   der Summe der Runden."
// draufgaenger e50 → „Der Brasilianer mit schwerem Gasfuß und leichtem Herzen
//   – Silva kennt nur eine Richtung: nach vorn. Sein Stil kennt keine halben
//   Sachen – bewundert und gefürchtet zugleich."
// draufgaenger e10 → „Full Attack, immer: Silva fährt, als hätte jemand den
//   Risiko-Regler abgerissen. Sein Stil kennt keine halben Sachen – bewundert
//   und gefürchtet zugleich."
// rohdiamant e50 → „Der Brasilianer, jung an Jahren und reich an Talent –
//   über Silva spricht man im Fahrerlager schon jetzt. Was ihm an Erfahrung
//   fehlt, ersetzt er vorerst mit Instinkt."
// rohdiamant e10 → „Rookie-Vibes, große Zukunft: Silva bringt genau die Art
//   Speed mit, die man nicht kaufen kann. Was ihm an Erfahrung fehlt, ersetzt
//   er vorerst mit Instinkt."
// routinier e50 → „Der Brasilianer der alten Schule – Silva hat mehr
//   Rennkilometer hinter sich als mancher Konkurrent Lebensjahre. Er hat
//   gelernt, dass Rennen selten in der ersten Kurve gewonnen, aber oft dort
//   verloren werden."
// routinier e10 → „Der Routinier im Feld: Silva hat für jede Rennsituation
//   ein fertiges Programm im Kopf. Er hat gelernt, dass Rennen selten in der
//   ersten Kurve gewonnen, aber oft dort verloren werden."
// allrounder e50 → „Ein Pilot ohne offene Flanke: Silva beherrscht sein
//   Handwerk in allen Lagen. Seine Vielseitigkeit macht ihn für jedes Team
//   zur einfachen Entscheidung."
// allrounder e10 → „Kompletter Fahrer, kompletter Werkzeugkasten: Silva hat
//   auf jede Frage eine Antwort. Seine Vielseitigkeit macht ihn für jedes
//   Team zur einfachen Entscheidung."
// kaempfer e50 → „Ein ehrlicher Arbeiter des Grand-Prix-Sports: Silva kämpft
//   meist abseits des Rampenlichts – und kämpft doch immer. Er weiß, dass
//   nicht jeder Sonntag ein Feiertag ist – und fährt trotzdem jeden."
// kaempfer e10 → „Kein Fahrer für die Highlight-Reels – aber Silva bringt
//   jede Woche vollen Einsatz. Er weiß, dass nicht jeder Sonntag ein
//   Feiertag ist – und fährt trotzdem jeden."
// ============================================================================
