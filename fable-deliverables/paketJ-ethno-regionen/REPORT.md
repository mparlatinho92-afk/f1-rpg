# Paket J — REPORT (D4): Wirkung der Vornamen-Klassifikation

Reproduzieren: `node classify-forenames.js` (aus diesem Ordner; Ausgabe deterministisch, seed 42).
Alle Zahlen/Namen aus dem finalen Lauf 2026-07-17. ALT = Ist-Stand v0.9.14.79 (Nachnamen-Regexe
auf Vornamen angewandt, banFirst unterdrückt), NEU = `region-routes.js` + `region-defs.js`.

## §1 Effektive Größe (Simpson 1/Σp²) je Region — das Erfolgsmaß

| Nation | Region | eff ALT | eff NEU | Faktor | Pool ALT | Pool NEU |
|---|---|---:|---:|---:|---:|---:|
| GBR | r0 britisch | 206 | 202 | — | 568 | 539 |
| GBR | r1 südasiatisch (1995+) | 13 | **21** | 1,6× | 25 | 54 |
| GER | r0 deutsch | 220 | 213 | — | 533 | 500 |
| GER | **r1 türkisch-dt. (1985+) NEU** | 0 | **39** | neu | 0 | 74 |
| FRA | r0 französisch | 233 | 205 | — | 529 | 430 |
| FRA | r1 maghreb/westafr. (1995+) | 17 | **50** | 2,9× | 23 | 99 |
| ESP | r0 kastilisch | 178 | 158 | — | 526 | 466 |
| ESP | r1 katalanisch | 9 | **21** | 2,3× | 11 | 32 |
| ESP | r2 baskisch | 7 | **17** | 2,4× | 8 | 23 |
| BEL | r0 wallonisch/frankophon | 220 | 172 | — | 476 | 413 |
| BEL | **r1 flämisch** | **25** | **176** | **7,0×** | 32 | 406 |
| SUI | r0 Deutschschweiz | 208 | 135 | — | 482 | 348 |
| SUI | r1 Romandie | 18 | **86** | 4,8× | 20 | 120 |
| SUI | **r2 Tessin** | **7** | **69** | **9,9×** | 9 | 109 |
| SUI | r3 portugiesisch (2000+) | 5 | **14** | 2,8× | 6 | 21 |
| CAN | r0 anglophon | 189 | 168 | — | 450 | 391 |
| CAN | r1 Québec | 23 | **51** | 2,2× | 30 | 79 |
| CAN | r2 Neukanadier (2000+) | 14 | **23** | 1,6× | 27 | 59 |
| RSA | r0 anglophon | 187 | 133 | — | 403 | 347 |
| RSA | r1 Afrikaans | 20 | **29** | 1,5× | 26 | 42 |
| RSA | r2 afrikanisch (1995+) | 46 | **89** | 1,9× | 83 | 123 |
| FIN | r0 finnisch | 189 | 177 | — | 489 | 470 |
| FIN | r1 finnlandschwedisch | 7 | **24** | 3,4× | 12 | 37 |
| IND | r0 Nord | 157 | 153 | — | 342 | 329 |
| IND | r1 Süd | 8 | **27** | 3,4× | 13 | 42 |
| MAS | r0 malaiisch | 134 | 99 | — | 305 | 257 |
| MAS | r1 chinesisch-malays. | 20 | **55** | 2,8× | 37 | 85 |
| EST | r0 estnisch | 149 | 126 | — | 324 | 291 |
| EST | r1 russischsprachig | 19 | **39** | 2,1× | 27 | 60 |

**Lesart:** Die Brief-Zielfälle sind erledigt — **SUI r2 (italienische Schweiz): eff 7 → 69**
(Pool 9 → 109 Vornamen), BEL flämisch 25 → 176 (der 45-%-Landesteil zog bisher aus 32 Vornamen).
Die r0-Rückgänge sind gewollt: das ist genau die Masse, die vorher fälschlich in Region 0 klumpte.
Kein r0 fällt unter eff 99 — bei den Regionsgewichten (r0 ≥ 0.4) bleibt die Kapazität pro Region
weit über dem Bedarf der Pyramide (Referenz: `analysis/pyramid-300kart-nation-demand.md` §4).

## §2 Sichtprobe — 15 Vollnamen je Region (verbatim aus dem finalen Lauf, seed 42)

Ären-Hinweis: Pools sind seit v0.9.14.78 für 23/28 Nationen **ära-flach** → dieselbe Ziehung gilt
für ~1955/~1985/~2015; Regionen mit `minYear` existieren in früheren Ären **gar nicht** (Gate in
Klammern — das ist die Ära-Differenzierung dieses Pakets). GER/GBR/FRA behalten ihre Ära-Fenster
(Paket I); die Router sind fenster-agnostisch.

**GBR r0** (w 0.92, alle Ären): Patrick Ferguson · Morgan Law · Gary Bates · Dan Hammond · Hugh Watts · Josh Beattie · Eric Powell · Johnny Reed · Louis Gilbert · John Berry · Alistair Evans · Bob Brown · Jake Roberts · Lee Brookes · Jonathan Taylor
**GBR r1** (w 0.08, ab 1995 → nur ~2015): Zain Islam · Abdul Ahmad · Ali Hussain · Imran Khan · Muhammad Rahman · Dev Miah · Aryan Singh · Hassan Islam · Abdul Ahmed · Amir Singh · Jay Kumar · Mohamed Malik · Sanjay Khan · Kamran Hussain · Tahir Patel
**GER r0** (w 0.96): Christian Schmidt · Jan Beckmann · Christopher Weidner · Michael Albert · Hans-Joachim Roth · Lothar Schmitt · Carsten Wahl · Stefan Jakobi · Joachim Junge · Marc Scherer · Peter Sturm · Mick Hess · David Miller · Tony Kluge · Kristian Reimer
**GER r1 NEU** (w 0.04, ab 1985 → ~1985/~2015): Emre Koc · Ibrahim Demir · Volkan Öztürk · Eren Yavuz · Mehmet Kilic · Bilal Yildirim · Bayram Yildiz · Baris Turan · Hasan Aslan · Ahmet Acar · Ismail Celik · Cem Bozkurt · Ismail Avci · Yusuf Yildirim · Sinan Dogan
**FRA r0** (w 0.90): Pierre Raynaud · Florent Bastien · Ryan Faure · Yannick Albert · Stéphane Simon · Martin Brunel · Nathan Blanchard · Michel Petit · Anthony Paoli · Matthieu Da Rocha · Vincent Clement · Patrice Gaillard · Cedric Jacques · Benjamin Verdier · Quentin Dumas
**FRA r1** (w 0.10, ab 1995): Nassim Sylla · Youssef Diarra · Hassan Diaby · Ali Sylla · Rachid Sylla · Samy Camara · Sami Drame · Amine Traoré · Amine Diallo · Hamza Haddad · Mamadou Cissé · Hamid Dembele · Khalid Ndiaye · Rayan Kone · Farid Konate
**ESP r0** (w 0.80): Isidoro Miranda · Ángel Lopez Perez · Leonardo Morales · Álex Varela · Costel Bernal · Justo Toro · Pascual González · Luis Navarro · Francisco Javier Lazaro · Florin Torres Garcia · Michael Ballesteros · Saul Cobos · Borja Duran · Andres Bello · Juan Luis Duran
**ESP r1** (w 0.13): Marti Casals · Oriol Grau · Marc Roca · Jordi Vila · Sergi Riera · Marti Pujol · Joan Riera · Marc Ferrer · Marc Puig · Pau Soler · Albert Riera · Pere Sala · Xavi Casals · Josep Soler · Joan Soler
**ESP r2** (w 0.07): Jon Agirre · Aitor Etxeberria · Gorka Agirre · Gorka Zubizarreta · Iñigo Agirre · Iker Etxeberria · Iker Aguirre · Mikel Mendizabal · Asier Ibarra · Iker Mendizabal · Mikel Agirre · Unai Garmendia · Iñaki Etxeberria · Patxi Garmendia · Iñigo Mendizabal
**BEL r0** (w 0.55): Guillaume Adams · Mathieu Lefevre · Philippe Charlier · Willy Thiry · Jason Piron · Stefan Durant · Paul Philippe · Didier Moreau · Joel Michaux · Nathan Noppe · Gianni Henry · Xavier Dumoulin · Jean-Claude Etienne · Martin Pollet · Guy Daniels
**BEL r1** (w 0.45): Charles Van Den Bergh · Axel Luyten · Yannick Van Loo · Edwin Joris · Benjamin Somers · Marco Helsen · Robert Vandenbroucke · Robin De Jonghe · Rudy Lambrechts · Wouter Bollen · Ludo Dewaele · William Smets · Simon Moors · Mike Cools · Jordan Sterckx
**SUI r0** (w 0.52): Franz Trachsel · Urs Brand · Ben Bischof · Robert Gerber · Mike Gfeller · Rafael Flückiger · Raphael Bauer · Dani Stadelmann · Bruno Suter · Thomas Meyer · Alex Mäder · Steven Häfliger · Daniel Schmid · Luca Stöckli · Luca Rieder
**SUI r1** (w 0.31): Vincent Maillard · Damien Bonvin · Laurent Monnier · Christian Duc · René Martin · Frédéric Rossier · Alexandre Perret · Sébastien Pittet · Leo Maillard · Nicolas Favre · Jean Rochat · Christian Martin · Nils Perret · Yann Rochat · Chris Favre
**SUI r2** (w 0.11): Stefano Galli · Roman Rossi · Lucas Ferrari · Christian Bernasconi · Michele Bianchi · Vincenzo Galli · Tobias Crivelli · Antonio Bernasconi · Jonas Fontana · Manuel Fontana · Alex Bernasconi · Sascha Ferrari · Jonas Rossi · Lorenzo Ferrari · Tim Bernasconi
**SUI r3** (w 0.06, ab 2000): Leandro Dos Santos · Fábio Santos · Fábio Rocha · Filipe Oliveira · Vitor Marques · Tiago Moreira · Pedro Costa · Vitor Ferreira · Tiago Cabral · Ricardo Alves · Pedro Mendes · Pedro Vieira · Tiago Nogueira · Vitor Ribeiro · Ricardo Carvalho
**CAN r0** (w 0.55): Antonio Ryan · Bob Murphy · Jack Campbell · Tommy Kennedy · Stephen Murphy · Jack Stewart · Henry Anderson · Roy Maclean · Darren Stone · Ron Thomson · Charles Ward · Andy Hunter · Tim Michael · George Hunt · John Dixon
**CAN r1** (w 0.33): Mathieu Pelletier · Joel Couture · Alex Beaulieu · Serge Belanger · Marcel Boucher · Martin Belanger · William Dubé · Alexandre Lambert · Andre Lacroix · Leo Levesque · Jean Boudreau · Richard Poirier · Martin Lefebvre · Christian Beaulieu · Philippe Simard
**CAN r2** (w 0.12, ab 2000): Anil Shen · Sandeep Han · Sandeep Truong · Kevin Gill · Gaurav Singh · Ahmed Cho · Hassan Deol · Raj Zheng · Mohamed Islam · Ahmad Brar · Kevin Grewal · Amir Patel · Justin Dhaliwal · Muhammad Grewal · Muhammad Pannu
**RSA r0** (w 0.40, Vorschlag 0.45): Eric Van Tonder · Stanley Smith · Nicholas Goosen · George Roberts · Sean Thusi · Sam Shai · Eugene Fortuin · Jonathan Jonas · Brendon Van Zyl · Calvin Clarke · Marius Charles · Steven Cupido · Theo Jackson · Nelson Van Zyl · Yusuf Hendricks
**RSA r1** (w 0.30, Vorschlag 0.35): Jacques Beukes · Charl Strydom · Johannes Janse Van Rensburg · Louis Van der Merwe · Johan Du Plessis · Kobus Van der Merwe · Johan Le Roux · Johan Pietersen · Johannes Van der Merwe · Riaan Basson · Jaco De Villiers · Frans Visser · Johan Du Preez · Kyle Schoeman · Kyle Cloete
**RSA r2** (w 0.30, Vorschlag 0.20, ab 1995): Bheki Vilakazi · Bheki Moyo · Sandile Maphumulo · Phumlani Cele · Thembinkosi Rikhotso · Sizwe Mathe · Nhlanhla Magagula · Nhlakanipho Mokone · Thokozani Motaung · Wandile Ndaba · Siphiwe Tshabalala · Siyabonga Ngobeni · Khulekani Nkomo · Bonga Dlamini · Lindokuhle Kubheka
**FIN r0** (w 0.90): Juri Peltonen · Otso Laakso · Jesper Seppänen · Risto Rajala · Petri Salmi · Jesper Eskola · Valtteri Saarela · Tuomas Rautiainen · Jukka Räisänen · Tommy Repo · Aki Kari · Jyrki Puhakka · Jouni Voutilainen · Jere Lepistö · Rasmus Kumpulainen
**FIN r1** (w 0.10): Daniel Holmberg · Marcus Nylund · Niklas Lindholm · Marcus Johansson · Johan Blomqvist · Henrik Andersson · Sebastian Johansson · Sebastian Backman · Mikael Lindfors · Niklas Lindholm · Patrik Andersson · Oliver Nyman · Kim Lindholm · Benjamin Forsman · Fredrik Andersson
**IND r0** (w 0.60, Vorschlag 0.50): Ashok Vaghela · Kamlesh Kushwah · Sai Biswas · Krishna Mehta · Atul Kalita · Ashok Kumar · Samir Yadav · Vicky Dubey · Dipak Jangra · Arvind Bharti · Mohan Mittal · Rinku Khan · Vikram Manna · Sagar Sarma · Bharat Paul
**IND r1** (w 0.40, Vorschlag 0.50): Raju Iyer · Raju Patil · Harish Varma · Hari Patil · Ganesh Pillai · Gopal Patil · Dinesh Raman · Pradeep Subramaniam · Karthik Menon · Karthik Menon · Raju Nayak · Arun Subramaniam · Raju Raman · Gopal Subramaniam · Raju Nayak
**MAS r0** (w 0.55): Firdaus Mokhtar · Ali Salleh · Yusri Musa · Amir Siva · Danial San · Sham Othman · Zamri Izzati · Mat Tai · Adam Dewi · Roslan Rizal · Ahmad Haikal · Khairul Ariffin · Anuar Zulkifli · Ahmad Bakri · Kamarul Yusoff
**MAS r1** (w 0.45): Brendan Ng · Jacky Heng · Johnny Lam · Calvin Chan · Ben Chai · Thomas Ng · Alex Law · Patrick Soh · Jack Lim · Alex Kee · Nick Tang · Adrian Tang · Jacky Heng · Alex Law · Jack Loh
**EST r0** (w 0.75): Alexander Ilves · Indrek Tasane · Nick Lääts · Priit Kask · Henry Sepp · Reimo Järv · Rivo Suvi · Raivo Kaasik · Meelis Johanson · Andres Täht · Rain Kolk · Hendrik Õun · Andres Mark · Hannes Tallinn · Jaan Tuul
**EST r1** (w 0.25): Vladimir Vassiljev · Andrei Romanov · Aleksei Volkov · Vitali Morozov · Mihhail Vassiljev · Jevgeni Orlov · Pavel Jegorov · Sergei Morozov · Nikolai Kovalenko · Alexey Aleksandrov · Viktor Semjonov · Dmitri Lebedev · Nikolai Vassiljev · Aleksei Kalinin · Maxim Lebedev

Bekannte Restfehler in der Probe (ehrlich, s. METHODIK §6): RSA r0 „Sean Thusi"/„Sam Shai"
(Bantu-Tail-Leckage), MAS r0 „Amir Siva"/„Mat Tai"/„Adam Dewi" (der MY-Nachnamen-Tail ist tief
gemischt — Empfehlung: MAS-Tail enger cappen oder hinnehmen), BEL r0 „Gianni Henry" (italo-belgische
Vornamen ohne Region — real belegt: Lucien **Bianchi**). Alle drei Klassen sind Randmasse mit
Gewicht 1.

## §3 Negativprobe — 25/25 bestanden

„Nicht ziehbar" = Vor- und Nachname haben nach der Klassifikation **keine gemeinsame Region**
(∩ = ∅). Kursive Zeilen sind Positiv-Gegenproben (legitime Paarungen müssen ziehbar bleiben).

| Nation | Paarung | first → | last → | Ergebnis |
|---|---|---|---|---|
| GER | **Sven Dogan** | r0 | r1 | nicht ziehbar ✅ |
| GER | **Mohammed Schneider** | ∅ (gebannt) | r0 | nicht ziehbar ✅ |
| GER | Mehmet Schneider | r1 | r0 | nicht ziehbar ✅ |
| GER | *Mehmet Dogan* | r1 | r1 | **ziehbar** ✅ — Nutzer-Vorgabe erfüllt: Quelle belegt beide (Mehmet DE-#85, Dogan DE-#144) |
| GER | *Sven Schneider* | r0 | r0 | ziehbar ✅ |
| SUI | **Jacques Müller** | r1 | r0 | nicht ziehbar ✅ |
| SUI | Gianni Favre | r2 | r1 | nicht ziehbar ✅ |
| SUI | Tiago Müller | r3 | r0 | nicht ziehbar ✅ |
| SUI | *Urs Müller* | r0 | r0 | ziehbar ✅ |
| SUI | *Gianni Bernasconi* | r2 | r2 | ziehbar ✅ |
| BEL | **Jacques Peeters** | r0 | r1 | nicht ziehbar ✅ |
| BEL | Jos Dupont | r1 | r0 | nicht ziehbar ✅ |
| BEL | *Jos Peeters* | r1 | r1 | ziehbar ✅ |
| CAN | Gilles Singh | r1 | r2 | nicht ziehbar ✅ |
| CAN | *Gilles Tremblay* | r1 | r1 | ziehbar ✅ |
| ESP | Jordi Etxeberria | r1 | r2 | nicht ziehbar ✅ |
| ESP | Mikel Puig | r2 | r1 | nicht ziehbar ✅ |
| ESP | *Jordi Puig* | r1 | r1 | ziehbar ✅ |
| FRA | **Matthias Depardieu** | r0 | ∅ (nicht im Pool) | nicht ziehbar ✅ |
| FRA | Mohamed Martin | r1 | r0 | nicht ziehbar ✅ |
| FRA | *Mohamed Benali* | r1 | r1 | ziehbar ✅ |
| GBR | Mohammed Smith | r1 | r0 | nicht ziehbar ✅ |
| GBR | *Mohammed Khan* | r1 | r1 | ziehbar ✅ |
| EST | Sergei Tamm | r1 | r0 | nicht ziehbar ✅ |
| EST | *Sergei Ivanov* | r1 | r1 | ziehbar ✅ |

Anmerkung „Matthias Depardieu": Depardieu steht nicht in den FR-Tops → Fall gegenstandslos.
„Matthias" selbst ist FR-datenbelegt (elsässisch) und bleibt korrekt in r0.

## §4 Fazit + Einbau-Checkliste für Opus

**Ziel erreicht:** „Mohammed Schneider", „Sven Dogan", „Jacques Müller" sind strukturell nicht
mehr ziehbar; „Mehmet Doğan" ist es (datenbelegt). Alle Minderheitsregionen ziehen aus
klassifizierter Datenmasse statt aus 6–32 kuratierten Namen.

1. `region-routes.js`: `ROUTE_FIRST` / `BAN_FIRST` / `ROUTE_LAST_ADD` / `BAN_LAST_ADD` einbauen — Mechanik: METHODIK §1 (Punkte 1–6 + 8; Kernänderung: `routeFirst` nur für Vornamen, Array-Ziele = Kopie in mehrere Regionen, Kopie zählt 1× gegen Caps).
2. `region-defs.js`: `NEW_REGIONS.GER` anhängen (r0.w → 0.96); Gewichts-Änderungen **RSA 0.45/0.35/0.20** und **IND 0.50/0.50** (alle übrigen Gewichte bestätigt — keine Änderung).
3. Build laufen lassen, `names-v3-review.txt` gegensichten; danach `node classify-forenames.js` als Regressionscheck (Negativprobe muss 25/25 bleiben).
4. Optionen (Nutzer-Entscheid, bewusst NICHT eingebaut): BEL r2 maghrebinisch (minYear 1990, w 0.04) · CAN-r2-Split süd/ost · BALKAN-Regex global um die Hoti-Liste ergänzen · EST minYear 1965 · MAS-Tail enger cappen.
