# Paket J — METHODIK: Vornamen-Klassifikation je Ethno-Region

**Dateien:** `region-routes.js` (Router D1/D2) · `region-defs.js` (GER-Region + Gewichte D2/D3) ·
`classify-forenames.js` (Klassifikator/Messung, reproduzierbar) · `REPORT.md` (Wirkung D4)
**Quelle:** ausschließlich `../name-data/fore_agg.csv` (600 Vornamen/Land) und `sur_agg.csv`
(1500 Nachnamen/Land) — die vorsortierten Kaggle-Aggregate. Die 608-MB-Rohdateien wurden
**nicht** benötigt (die Aggregate decken die volle Build-Kapazität ab: CLASSES big = 600 fore).

---

## §1 Mechanik — was Opus in `build-names-v3.js` ändern muss

| # | Änderung | Wo | Aufwand |
|---|---|---|---|
| 1 | **`routeFirst`** je Nation: wird in `processNation` Schritt 3 nur auf `kind==='first'` angewandt; `cfg.route` gilt nur noch für `'last'` | Schritt 3: `const routes = kind==='first' ? cfg.routeFirst : cfg.route;` | 1 Zeile + CFG-Einträge |
| 2 | **Array-Ziele** `[regex, [0,1]]` = Eintrag in jede genannte Region kopieren („geteilter Name"). Kopien zählen **1×** für `placed`/`torso` (sonst frisst Duplikation die Caps) | Schritt 3/5 | ~10 Zeilen (Muster: `classify-forenames.js` Z. „Masse verteilen") |
| 3 | **`BAN_FIRST`** ersetzt `banFirst` der Nationen GER/FRA/BEL/SUI/MAS/FIN/CAN/ESP/RSA/EST komplett (EST: leer) | CFG | Copy-Paste |
| 4 | **`BAN_LAST_ADD`** an `banLast` anhängen (GER/BEL/GBR/CAN/RSA/MAS/SUI) | CFG | Copy-Paste |
| 5 | **`ROUTE_LAST_ADD`** an `cfg.route` anhängen (GER/BEL/CAN/RSA/SUI/MAS) | CFG | Copy-Paste |
| 6 | **GER banLast:** `NORDIC_FOREIGN` → Komposit **ohne TURKISH** (sonst frisst der Ban die türkischen Nachnamen vor der Route). `NORDIC_FOREIGN_NO_TR = SOUTH_ASIAN+EAST_ASIAN+ARABIC_MAGHREB+BALKAN` | Regex-Kopf | 1 Konstante |
| 7 | **GER Region 1** anhängen (`region-defs.js NEW_REGIONS.GER`), `regions[0].w` 1 → 0.96 | POOLS/curated-base | s. region-defs.js Kopf |
| 8 | OPS-Sonderfall: `OPS.GER.drop.first = ['Ali']` **entfernen** (Ali wird jetzt geroutet, nicht gedroppt) | OPS | 1 Eintrag |

Reihenfolge unverändert: Bans laufen in Schritt 1 (vor der Route), `OPS.move` gewinnt über die Route.
**Folge:** gebannte Namen erreichen die Route nie — deshalb sind z. B. türkische **-oglu**-Nachnamen
in GER weiterhin weg (BALKAN-Ban), statt in Region 1 zu landen. Hingenommen: gedroppt > falsch platziert.

### Caps pro Region (Prüfauftrag aus dem Brief)
**Kein Cap-Split nötig.** Da die Route **vor** der Torso/Tail-Verteilung läuft, bekommt jede Region
ihren Anteil an Torso **und** Tails automatisch (BEL r1: 406 Vornamen, SUI r2: 109 — s. REPORT §1).
Bedingung ist nur Mechanik-Punkt 2: geteilte Namen zählen 1× gegen die Caps — sonst halbiert der
BEL-Default `[0,1]` die effektive Nationskapazität.

---

## §2 Klassifikations-Grundlage je Nation (D1)

Prinzip überall: **distinkte Sprachform entscheidet** (Jordi/Jorge, Marc/Mark, Denis/Dennis,
Nicolas/Nicholas, Aleksandr/Aleksander). Wo beide Landesteile einen Namen nachweislich nutzen →
**geteilt** (Array-Ziel). Erster Regex-Treffer gewinnt; kein Treffer → Default.

| Nation | Router | Prinzip + Beleg | Default | Unsicherheit |
|---|---|---|---|---|
| **BEL** | `BEL_FL_FIRST`→1, `BEL_FR_FIRST`→0, `BEL_SHARED`→[0,1] | ndl. Form (Jan/Bart/Wouter/Stijn) vs. frz. Form (Jean-*/Philippe/Olivier); geteilt = internationale Masse (Kevin BE-#4, David #3 — in beiden Landesteilen belegt) | **[0,1] geteilt** — Restmasse ist international | ⚠ Guy/Hugo/Yves in beiden Teilen (Verhofstadt/Claus sind Flamen) → geteilt |
| **SUI** | PT→3, IT→2, FR→1, geteilt DE-FR / DE-IT / alle | Sprachform; **Marco/Luca/Fabio/Sandro/Dario = [0,2]**, weil in der Deutschschweiz Modenamen (Odermatt, Hänni, Cologna) — NICHT exklusiv Tessin | 0 (alemannische Restmasse) | ⚠ Andrea→2 (in DE-CH weiblich, in TI männlich) |
| **CAN** | NEW→2, QC→1, geteilt→[0,1] | frz. Schreibform → Québec (Marc CA-#63 vs. Mark #13 trennt sauber; Denis/Dennis, Philippe/Philip); Bindestrich-Muster `Jean-/Marc-/Pierre-` | 0 (anglo) | ⚠ Martin/Simon/David gleichgeschrieben → geteilt |
| **ESP** | BAS→2, CAT→1 | katalanische Eigenform (Jordi ES-#34, Joan, Josep, Xavi, Sergi, Pau) vs. baskische (Mikel, Iker, Aitor, Unai — alle in ES-Top-150 belegt); kastilische Parallelform bleibt r0 | 0 | Ion→2 (baskisch), obwohl auch rumänisch |
| **RSA** | ZU→2, AF→1 | Afrikaans-Formen (Johan/Pieter/Riaan/Jaco …) aus OPS-Bestand + Erweiterung; Bantu-Namen als **explizite Liste** aus ZA-Top-600 (Thabo #1!, Tshepo #2, Bongani #4) + schwarz-südafrikanische Tugendnamen (Lucky/Gift/Prince/Innocent — ZA-datenbelegt) | 0 (anglo) | ⚠ KEINE Präfix-Regexe (Th-/M- fingen „Thomas"/„Martin"); Rest-Leckage bleibt (s. §6) |
| **GBR** | SA→1 | GB-Daten: Ali #93, Mohammed #96, Abdul #138 … + Sikh-Formen (-preet, -inder) + Hindu-Formen (Rajesh/Deepak/…) | 0 | ⚠ r1 mischt muslimisch/Sikh/hindu — real so (brit. Südasiaten), Paarungen wie „Sanjay Khan" existieren real |
| **FRA** | ARAB/WAF→1 | bestehende 23er-Route + **alle** in FR-Top-600 belegten Formen (Samir #144 … Nadir #508, Sichtung 2026-07-17) + westafrikanisch (Mamadou, Boubacar, Adama) | 0 | Yanis/Yannis → 1 (in FR kabylisch-algerisch dominiert) |
| **FIN** | SV→1, geteilt→[0,1] | klar schwedische Formen (Johan, Niklas, Kaj, Kristian, `Karl-*`-Komposita); **konservativ**, da Emil/Elias/Otto (auch) finnische Modenamen | 0 | ⚠ Marcus/Oscar mit c → 1 (finn. Schreibung wäre Markus/Oskari) — Faustregel, nicht exakt |
| **IND** | Süd→1, pan-indisch→[0,1] | dravidisch markierte Formen (Karthik, Senthil, Saravanan, Venkat-, Subram-, Murug-) → Süd; Sanskrit-Allerweltsnamen (Suresh/Ramesh/Krishna/Kumar) → geteilt | 0 (Nord) | ⚠⚠ HOCH — Sanskrit-Namen sind gesamtindisch; Zuordnung ist Näherung. Patil (Route-Bestand r1) ist eigentlich Maharashtra/West |
| **MAS** | CN→1 (westl. Rufnamen), MALAY→0 | Datenrealität: chinesische Malaysier führen westliche Rufnamen (Kelvin/Jason/Alvin — MY-Top-60); malaiisch = arabisch-malaiische Muster (Mohd/Khairul/Amirul) | 0 | ⚠ Pinyin-Rufnamen (Wei Ming) nicht abbildbar → nur Junk-gefiltert |
| **EST** | RU→1 | russische Transliterationsformen (Aleksandr EE-#1!, Sergei #2, Dmitri, Jevgeni, estn.-russische Doppelkonsonanz Mihhail/Deniss) vs. estnische Eigenformen (Aleksander/Sander/Andres/Jüri → 0) | 0 | Roman/Artur → 1 bzw. geteilt — in EE beide Gemeinschaften |
| **GER** | TR→1 (NEU) | die 53 türkischen Vornamen der DE-Top-600 (Ali #45 … Ilhan #561) + gängige Formen darunter (Kaan/Mert/Arda) | 0 | Abgrenzung türkisch vs. arabisch: s. §3.1 |

**Nicht klassifiziert:** MON (keine Datenquelle, rein kuratiert — Regionen funktionieren dort schon).

### minYear-Begründungen (Einwanderungsregionen, D1b)

| Region | minYear | Begründung (Debüt der ersten im Land geborenen Generation) |
|---|---|---|
| GBR r1 südasiatisch | 1995 (Bestand) | Haupteinwanderung 1960er/70er → Jahrgänge ~1965–75 → Debüts ~1985–95. Bestand plausibel, **keine Änderung**. |
| FRA r1 maghreb/westafr. | 1995 (Bestand) | Hauptzuzug 1960er/70er, 2. Generation debütiert ab ~1990ern. **Keine Änderung.** |
| SUI r3 portugiesisch | 2000 (Bestand) | Zuzug 1980er/90er → 2. Generation ab ~2005; 2000 minimal früh, vertretbar. **Keine Änderung.** |
| CAN r2 Neukanadier | 2000 (Bestand) | Punktesystem-Einwanderung ab ~1970 → 2. Gen. ab ~1995. ⚠ Sikh-Community in BC existiert seit ~1905 — 1990 wäre vertretbar; 2000 bleibt ok. **Keine Änderung.** |
| **GER r1 türkisch (NEU)** | **1985** | Anwerbeabkommen 1961 → erste in DE geborene Jahrgänge ~1963+ → Debüts (20–22 J.) ab ~1985. |
| RSA r2 afrikanisch | 1995 (Bestand) | Kein Geburts-, sondern **Zugangs**-Gate: Ende der Apartheid 1994. **Keine Änderung.** |
| EST r1 russischsprachig | **keins** (Bestand) | Interne Minderheit: russische Gemeinde existierte schon vor 1940 (Narva); ab 1945 massiv. Spiel-Junior-Welt beginnt 1950 = sowjetisches Estland → kein Gate nötig. (Option minYear 1965 falls die frühe Quote stört.) |

---

## §3 banFirst/banLast-Audit (D2)

### 3.1 Umgewandelt: Ban → Route
| Nation | vorher | nachher |
|---|---|---|
| **GER** banFirst (54 türk. Namen) | unterdrückt | `GER_TURKISH_FIRST` → r1 + `GER_TURKISH_LAST` → r1. **Grenzfall:** Mohammed/Mohammad/Mohamed/Ahmad/Omar/Hassan/Hussein etc. sind **arabische** (nicht türkische) Formen — Träger (syrisch/libanesisch, Zuzug 2015) debütieren erst ~2035 → bleiben **Filter**. Muhammed/İbrahim (türkische Schreibungen) → r1. |
| **EST** banFirst (17 russ. Namen) | unterdrückt | `EST_RU_FIRST` → r1, banFirst **entfällt ersatzlos**. Der klarste D2-Fall: die Region existierte längst (w 0.25), bekam aber keine Daten-Vornamen. |
| GER OPS `drop.first: ['Ali']` | gedroppt | geroutet → r1 (OPS-Eintrag entfernen, §1 Punkt 8) |

### 3.2 Bleiben Filter (mit Begründung — Golf-Regel: Region nur bei realistischer Motorsport-Basis)
| Nation | Filter | Warum kein Routing |
|---|---|---|
| BEL | maghrebinische Vornamen (erweitert) | Große Community (Brüssel), aber **kein** belgisch-maghrebinischer Motorsport-Anker bekannt. **Option für den Nutzer:** BEL r2 „maghrebinisch" (minYear 1990, w 0.04) analog FRA wäre technisch trivial — Entscheidung offen gelassen. |
| BEL | spanische Vornamen (NEU) | Diaspora ohne Region — verhindert „Juan Smits". |
| FRA | türkische Vornamen (NEU: Mehmet FR-#302!) | türkische Diaspora in FR ohne Motorsport-Beleg, keine Region. |
| FRA | iberische Vornamen (NEU) | 1,5 Mio. portugiesischstämmige, aber keine FRA-Region → verhindert „Pedro Faure". (Option analog SUI r3 denkbar; Motorsport-Beleg fehlt.) |
| SUI | spanische Vornamen (statt drop Carlos) | span. Gruppe (~1 %) deutlich kleiner als die portugiesische (die r3 hat); ambige Formen (Pedro/Paulo/Jorge/Francisco) → r3 geroutet. |
| FIN | arabisch/somalisch + südasiatisch (**NEU — vorher gar kein banFirst: „Muhammad Virtanen" war baubar!**) | Zuzug ab ~1990, Debüts ab ~2015, kein Motorsport-Beleg. |
| CAN | hispanische Vornamen (NEU) | banLast filtert HISPANIC bereits — Vornamen-Ban stellt Symmetrie her. |
| ESP | maghrebinische Vornamen (NEU) + Kosenamen (Kiko/Nacho/…, Fortführung der OPS-Drops) | keine ESP-Einwanderungsregion (⚠ Option offen); formelle Namensform gewinnt. |
| RSA | Linda/Pretty/Portia/Precious/Beauty (NEU) | Linda ist in ZA ein **männlicher** Zulu-Name, liest sich im Spiel aber weiblich. |
| RSA | SA-indische Nachnamen (Naidoo/Govender/Pillay/…, NEU) | Durban-Community ohne Motorsport-Region (⚠ real gäbe es Anker, z. B. Kart-Szene — bewusst konservativ). |
| NOR/GRE/ISR/JPN/RUS/EGY/MAR banFirst, GIVEN_AS_SURNAME, weibl. Formen (RUS/CZE/EST/GRE) | unverändert | echte Filter: Datenmüll, weibliche Formen, bzw. bewusste Design-Entscheidungen (ISR analog Golf). |
| MAS | indisch-malaysische Namen | ⚠ Schätzung per Golf-Regel; dazu NEU: Nachnamen-Tokens als Vorname (MY-Datenformat „Lim Wei Ming") + Junk. |

### 3.3 Nebenbefunde (Nachnamen-Seite, beim Klassifizieren gefunden)
- **GBR/CAN:** Begum/Bibi/Kaur sind **weibliche** südasiatische Formen → `BAN_LAST_ADD` („Jay Begum" war ziehbar).
- **BEL:** bestehende Flamen-Route (Van-/De-/Ver-Präfixe) verfehlt präfixlose flämische Nachnamen (Nijs, Coenen, Smeets, Goethals, …) → `BEL_FL_LAST_ADD` (60+ Namen aus BE-Top-Masse gesichtet). ⚠ Callens/Mortier/Mahieu/Beckers grenzflämisch.
- **CAN:** EAST_ASIAN/SOUTH_ASIAN verfehlen Fung/Yuen/Liang/Chu/Johal/Bains/… → `CAN_ASIAN_LAST_ADD`.
- **RSA:** Bantu-Präfixregex prüft nur den 2. Buchstaben (Makhanya/Magwaza/Shabalala/Zuma fielen durch) → `RSA_ZU_LAST_ADD` + `RSA_AF_LAST_ADD` (Pienaar/Cloete/Swart …).
- **SUI:** IBERIAN_PT verfehlt Pires/Lima → `SUI_PT_LAST_ADD`; albanische (Hoti/…) und eritreische (Kidane/…) Namen fielen durch BALKAN → `BAN_LAST_ADD.SUI`. **Empfehlung:** die Hoti-Liste global in BALKAN ergänzen (betrifft auch GER/AUT/SWE-Bans).
- **GER:** TURKISH-Regex deckte nur ~60 % der türkischen DE-Nachnamen (Durmaz/Yüksel/Aksu/… fehlten) → in `GER_TURKISH_LAST` ergänzt (40 → ~110 Formen). Yilmaz(4724)/Yılmaz(605) werden von `key()` **nicht** gemerged (ı ≠ i nach NFD) — beide Schreibungen im Regex.
- Junk-Drops: BEL (Bxl/Bruxelles/Momo/Man), MAS (Keong/Hong/Jack/Rock/Love/…), RSA (Vornamen-als-Nachname Gift/Thabo/Lucky/…), CAN (Ann/Anne).

---

## §4 Regionsgewichte (D3) — Kurzfassung, Details in `region-defs.js`

| Nation | Ist | Vorschlag | Kern-Beleg |
|---|---|---|---|
| BEL | 0.55/0.45 | **behalten** | F1-Historie ~75–80 % frankophon (Ickx, Boutsen, Gendebien, Frère, Mairesse, Pilette×2, Nève, d'Ambrosio, van de Poele) vs. flämische Moderne (Vandoorne, Kart-Hochburg Genk). Die Bevölkerungs-„Umkehrung" (real 58 % fl.) ist also motorsport-gewichtete Absicht — bestätigt. |
| SUI | 0.52/0.31/0.11/0.06 | **behalten** | 6 von ~10 CH-F1-Fahrern romand/tessinisch (Regazzoni, Moser, Siffert, de Graffenried, Buemi, Grosjean). |
| CAN | 0.55/0.33/0.12 | **behalten** | Villeneuve×2, Carpentier, Tagliani = Québec; Stroll/Latifi anglo. |
| ESP | 0.80/0.13/0.07 | **behalten** | Motorsport-Kern Barcelona (Gené×2, de la Rosa, Alguersuari). |
| FIN | 0.90/0.10 | **behalten** | Rosberg (finnlandschwedisch) von ~9 FIN-F1-Fahrern ≈ 10 % — schon korrekt 2× über Bevölkerung. |
| GBR | 0.92/0.08 | **behalten** | ~9 % Bevölkerung England; Anker Enaam Ahmed (F3-Champion 2017). |
| FRA | 0.90/0.10 | **behalten** | Anker Isack Hadjar (F1 2025, algerischstämmig). |
| **RSA** | 0.40/0.30/0.30 | **0.45/0.35/0.20** | r2 30 % überzeichnet die Grids (auch nach 1995 mehrheitlich weiß; schwarze Anker existieren: Gugu Zulu, Tschops Sipuka → 20 % aspirational-fair). |
| **IND** | 0.60/0.40 | **0.50/0.50** | Motorsport-Kernland ist der Süden (Chennai/Coimbatore; **beide** IND-F1-Fahrer: Karthikeyan, Chandhok). |
| MAS | 0.55/0.45 | **behalten** | einziger MY-F1-Fahrer Alex Yoong = chinesischstämmig. |
| EST | 0.75/0.25 | **behalten** | = Bevölkerungsanteil (~24 %); ⚠ Motorsport-Beleg dünn. |
| **GER** | 1.0 | **0.96/0.04 (r1 NEU)** | türkeistämmige ≈ 4–5 % der Jahrgänge 1985–2010, Motorsport-Beteiligung leicht darunter; ⚠ kein prominenter Formel-Anker. |

---

## §5 Mess-Vereinfachungen (`classify-forenames.js` vs. echter Build)
1. Ära-Fenster flachgelegt (Union) — auch für die 5 ERA_SPLIT_KEEP-Nationen; eff gilt „über alle Ären". Paket I regelt die Fenster, die Router sind fenster-agnostisch (reine Namens-Muster) und funktionieren mit beiden Formen.
2. `fixName`/ACCENT-Reparatur weggelassen — `key()` matcht akzent-insensitiv, betrifft nur Anzeigeformen.
3. USA-Dämpfungen irrelevant (USA nicht im Scope — eine Region).

## §6 Bekannte Grenzen (ehrlich markiert)
- **CAN r2** mischt süd- und ostasiatisch in einer Region („Anil Phan", „Sandeep Tsang" ziehbar). Real selten, aber nicht absurd; sauberer wäre ein Split in r2/r3 — **Option**, kein Muss.
- **GBR r1** mischt muslimisch/Sikh/hindu — entspricht der realen Sammelkategorie „British Asian"; „Sanjay Khan" existiert real als Name.
- **RSA r0** behält Rest-Leckage einzelner Bantu-Nachnamen aus der tiefen ZA-Masse (Top-1500 enthält hunderte; Listen decken die häufigsten ~150). Wirkung: vereinzelte anglo-Vorname+Bantu-Nachname-Paare — post-1994 nicht unplausibel.
- **SUI r2** erhält über die geteilte Klasse `[0,1,2]` auch deutsch-internationale Vornamen („Tim Bernasconi") — im modernen Tessin real belegbar, in den 1950ern leicht anachronistisch (dort greift aber ohnehin der kuratierte Ära-Kopf).
- **IND** Nord/Süd ist die unsicherste Klassifikation des Pakets (⚠⚠) — Sanskrit-Namen sind gesamtindisch; die geteilte Klasse fängt das teilweise ab.
- **MAS**: chinesische Pinyin-Rufnamen sind aus den Daten nicht rekonstruierbar; r1 lebt von westlichen Rufnamen (real dominant) + kuratiertem Bestand. Zusätzlich ist der MY-**Nachnamen**-Tail tief gemischt (Namensbestandteile statt Familiennamen: Siva/Tai/Dewi tauchen als „Nachnamen" auf) — die Ban-Listen fangen die häufigsten, Randmasse bleibt. Option: MAS-Tail enger cappen (`sur` 600 → ~400).
- `run-final.txt` = eingefrorene Referenz-Ausgabe des finalen Laufs (Regressionsvergleich nach Einbau).
