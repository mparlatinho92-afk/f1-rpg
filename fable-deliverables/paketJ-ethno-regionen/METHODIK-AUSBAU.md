# Paket J AUSBAU — METHODIK (Welle 2: GRE + CAN-Split + BEL-Entscheid)

**Bearbeiter:** Fable · **Datum:** 2026-07-17 · Ergänzt `METHODIK.md` (Welle 1), ersetzt nichts.

## §1 Mess-Methode (Brief-Vorgabe übernommen)

Jede Zahl in Report/Methodik ist **gewichtete Ziehmasse**, nicht Rohcount:
Pool **und** Tails (Gewicht 1) vereint, mit Regionsgewicht `r.w` multipliziert,
Einheit **„1 von N Fahrern dieser Nation"**.

| Quelle | Rolle |
|---|---|
| `data/names.js` (gebaut, v0.9.14.81) | **IST-Referenz**: GRE 1009 Nachnamen / eff 368 / 43,9 % fremd; CAN „Sandeep Tsang" 1 von 27 — reproduziert die Brief-Zahlen exakt |
| `classify-forenames.js` (erweitert) | **Vorher/Nachher-Emulator** (Pipeline-Kopie). `old` = Stand vor Paket J Welle 1 (für GRE identisch mit Live — GRE war in Welle 1 nicht im Scope), `neu` = Welle 1 + AUSBAU |

⚠ Eigene Falle beim Messen gefunden: unverankerte Regex-Fragmente in einer
Mess-Alternation matchen Substrings („Kelly" ⊃ „Ly", „Hunter" ⊃ „Hu") und
erfanden 0,6 % Restfehler. Messregexe **immer `^(…)$`-verankern** (Fix in
`classify-forenames.js`, Kommentar an Ort).

## §2 GRE — Klassifikation der Nachnamenmasse (D1a/D1b)

### 2.1 Struktur-Regel statt Fremd-Aufzählung

Griechische Männer-Familiennamen enden praktisch ausnahmslos auf **-s**
(Nominative -os/-as/-is/-es/-ous) oder **-ou** (eingefrorener Genitiv).
`GRE_STRUCT_LAST = /^(?!.*(?:s|ou)$).*$/i` verwirft alles andere.

Warum das **keine** §5.3-Suffix-Falle ist: Die Welle-1-Lektion betraf **positive
Fremd-Suffixe** (-lli riss Willi/Galli mit). Hier ist die Regel ein **negatives
Struktur-Whitelisting der Zielsprache** — Kollateral wäre ein legitimer
griechischer Name ohne -s/-ou. Gegen die **volle Datenmasse** geprüft (§5.1,
1009 Namen): Die Nicht-s/-ou-Klasse (43,9 % Masse, 508 Namen) enthält
ausschließlich albanisch (`Cela/Kola/Molla/Lleshi/Hysa/Shehu/Hoxhaj…`),
pakistanisch/bengalisch (`Mehar/Shahzad/Ullah/Hossain/Mughal/Tarar/Awan…`),
türkisch/pomakisch (`Halil/Memet/Amet/Chasan/Serif/Emin…`), griechisch-weibliche
Kurzformen (`Pappa/Makri/Karagianni…`, s. 2.2) und Junk (`Pap/Jaan/John/Smith/
Saab/Eleni/Katerina/Ivanova`). **Kein einziger legitimer griechischer
Männer-Nachname verliert.** (Bekannte theoretische Ausnahme: zypriotische
Genitive auf -a/-i wie *Papacosta/Christofi* — in den **GR**-Daten nicht
vertreten, Zypern ist eine andere Quelle. Hingenommen.)

### 2.2 Die -ou-Grenze (Brief-Warnung D1a)

**-ou ist männlich-legitim**, wenn der Stamm ein **Vorname** ist (patronymischer
Genitiv): `Georgiou, Nikolaou, Ioannou, Dimitriou, Markou, Stavrou, Stamou,
Panagiotou, Lazarou, Kyriakou, Palaiologou, Kalogirou …` — bleiben alle.
**-ou ist die Frauenform**, wenn der Stamm ein **Nachname** ist, dessen
männliche -s-Form **im selben Pool daneben steht** (Ehefrau/Tochter trägt den
Genitiv des Familiennamens): `Vlachos→Vlachou, Kontos→Kontou, Spanos→Spanou,
Roussos→Roussou, Kritikos→Kritikou …` — nur diese **22 gepaarten Fälle** stehen
in `GRE_FEMALE_OU_LAST`. ⚠ `Thanou/Exarchou/Kourou` sind ambig (auch als
eingefrorene Genitive belegt), alle Gewicht 1 → mitgebannt, Kosten ~0.

**`GREEK_FEMALE` (D1b) bleibt unverändert.** Kein präziserer Regex nötig:
die produktiven Kurz-Frauenformen (-is→-i, -as→-a) enden nicht auf -s/-ou und
fallen dem Struktur-Ban zu; die -ou-Frauenformen sind nur über die
**Paar-Evidenz** entscheidbar, nicht über Suffixe — ein `-akou/-atou$`-Ausbau
würde z. B. das legitime patronymische `Kyriakou` (Gewicht 21) töten. Explizite
Liste schlägt Regex, exakt die Welle-1-Lektion.

### 2.3 Vorname-als-Nachname (-s-Klasse, 3,1 % Masse)

Fortführung der bestehenden Build-Liste (`Nikos|Dimitris|Giorgos|…`):
`GRE_GIVEN_LAST` bannt die 38 -s-Formen, die sie nicht abdeckt (`Chris:24,
Panos:24, Manolis:23, Manos:22, Andreas:21, Alexandros:20, Ilias:19, …,
Mykonos:17` (Inselname)). ⚠ `Panos/Manos/Stathis/Kosmas/Ilias/Loukas/Zisis`
sind **auch** als echte Familiennamen belegt — für Konsistenz mit der
bestehenden Liste trotzdem gebannt; Kosten zusammen ≈ 1,4 % Ziehmasse bei
eff 303 Rest — verschmerzbar, unmarkierte Halb-Vornamen wären teurer.

### 2.4 GRE-Vornamen (D1c)

Gleiche Morphologie: griechische Männer-Vornamen enden auf **-s**. Datenbefund
(456 Namen, 30,8 % Masse ohne -s): albanisch (`Ilir/Arben/Altin/Dritan/Agron/
Gezim/Besnik/Sokol/…`), pakistanisch (`Mohammad/Imran/Usman/Shahid/…`),
türkisch (`Mehmet/Mustafa/Ahmet/…`), anglo (`Nick/Alex/Bill/Jim/…`),
albanisch-orthodoxe Formen griechischer Namen (`Petro/Spiro/Kristo/Jorgo/
Andon/Vasil/Kosta`). `GRE_STRUCT_FIRST` bannt Nicht-s mit **Whitelist**
`Emmanouil|Michail|Rafail` (biblische Nominative ohne -s; Michail Gewicht 12).
Dazu explizit: **-s-Fremdkörper** (`Waqas:11, Abbas, Awais, Elvis/Ervis/Fatos/
Aleks` (albanisch!), `Chris/James/Denis/Nicolas/Harris`) und
**Greeklish-Tastatur-Artefakte** (`Giwrgos:28` (ω→w), `Kwstas:20, Xrhstos,
Giannhs, Mixalhs, Hlias` (η→h), `Mpampis:20` (μπ), `Stauros` (υ→u), `Baggelis/
Agelos/Labros`) — die korrekte Form steht jeweils mit höherem Gewicht im Pool
(`Giorgos:73, Christos:52, Babis:20, Stavros:33`). X-für-Chi-Formen
(`Xristos:35, Xaris:14`) bleiben — reale Transliterationsvariante, kein Junk.
`Eleni:27` stand als **Nachname** im Pool (Brief D1c) → Struktur-Ban erledigt
das; als Vorname kommt Eleni (weiblich) gar nicht vor.

### 2.5 D1d — keine griechisch-albanische Region

Kein Motorsport-Anker gefunden: kein albanischstämmiger Fahrer mit
GR-Lizenz in Kart/Formel-Ergebnislisten bekannt; die albanische Community
in GR (Arbeitsmigration ab 1991) hat keine dokumentierte Kart-Präsenz
(Golf-Regel: Einwanderung ≠ Motorsport-Schicht). Ebenso die muslimische
Minderheit Thrakiens. → **Filter, nicht Region.**

## §3 CAN — r2-Split (D2)

### 3.1 Routen & Listen

* Nachnamen: `SOUTH_ASIAN → 2`, `EAST_ASIAN → 3` (Build-Edit a) +
  `CAN_SA_LAST_ADD → 2` / `CAN_EA_LAST_ADD → 3` (Split der alten Kombi-Liste).
  **Nachlese der vollen CA-Datenmasse** (Lehre §5.1): `Shaikh:962`
  (Schreibvariante von Sheikh — „Tom Shaikh" stand in der ersten Sichtprobe!),
  `Sangha/Rana/Joshi/Desai/Gandhi/Kahlon/Aujla/Sahota/Parmar/Prasad/Persaud`
  (indo-karibisch)/`Alam/Hasan/Dsouza` → r2; `Lo:1814, Lai:1741, Tam:1676,
  Kwan:1147, Chau/Yan/Kwok/Fong/Chin/Chong/Hui/Yip` (HK-kantonesisch) → r3.
  `Law` bleibt bewusst anglo (ambig, anglo-dominant). Junk/regionslos in
  `BAN_LAST_ADD.CAN` ergänzt: `Elizabeth/Dawn/Canada/Mac/Abdi` (somalisch,
  keine Region).
* Vornamen: `CAN_SA_FIRST → 2` (alte Liste minus Pinyin-Tokens),
  `CAN_EA_PINYIN_FIRST → 3`, `CAN_EA_WESTERN_FIRST → [0,3]` (Kelvin/Alvin/
  Wilson/Winston — HK-typisch UND anglo), `CAN_SHARED_FIRST → [0,1,3]`.
* Moves (Build-Edit b): `Lau/Cheng/Chung` 2→**3**; `Saini/Randhawa/Mann`
  bleiben 2.

### 3.2 Das 0-%-Problem der ostasiatischen Vornamen

**Kein Datenfehler**: 2.-Generation-Ostasiaten in Kanada tragen westliche
Rufnamen (Anker: **Samantha Tan**, chinesisch-kanadische GT-Fahrerin und
Teamgründerin ST Racing — nicht „Xiu Tan"). Lösung dreiteilig: geteilte
westliche Masse (`[0,3]`/`[0,1,3]`), r3-kuratierter Kopf mit westlichen
Rufnamen (Kevin/Jason/Eric …) und **kleiner** kuratierter 1,5.-Generation-Rest
(`Wei/Jun/Ming/Kai/Minh/Jae`, Gewicht 1 — Pinyin bleibt selten, wie real).

### 3.3 minYear 2000 → 1990 (beide Regionen)

Brief-Einwand bestätigt, aber Gates bleiben nötig: Sikh-Gemeinde BC ab 1905,
chinesische ab den 1880ern (Eisenbahn) — doch Continuous-Journey-Verordnung
1908, Head Tax 1885 und Exclusion Act 1923–47 hielten beide klein und arm
(Sägewerk/Wäscherei-Schicht, keine Kart-Ökonomie). Motorsport-fähige Breite
erst mit dem **Punktesystem 1967** + HK-Welle der 1970er/80er → deren **in
Kanada geborene Kinder** debütieren ab ~1990 (Formel „Debütjahr der ersten im
Land geborenen Generation" der tragenden Welle, nicht der Pioniere).
Samantha Tan (Jg. ~1997, Debüt ~2015) liegt bequem im Gate.

### 3.4 Gewichte 0.12 → 0.07 + 0.05

Census 2021: Südasiaten 2,6 Mio. (7,1 %) vs. Chinesen 1,7 Mio. + Koreaner/
Vietnamesen ≈ 6 % → Verhältnis ≈ 7:6 auf die bestehenden 0.12 verteilt.
r0/r1 unangetastet. Motorsport-Evidenz zu dünn für eine Abweichung vom
Bevölkerungsanker (⚠ Setzung).

### 3.5 Einbau-Mechanik

Automatisch über bestehende Verdrahtung: `ROUTE_FIRST.CAN`, `ROUTE_LAST_ADD.CAN`,
`BAN_LAST_ADD.CAN`, `NEW_REGIONS.CAN` (push als r3), `WEIGHT_PROPOSALS.CAN`.
**Drei manuelle Build-Edits (a/b/c)** — vollständig im Kopf von `region-defs.js`
beschrieben, (a) zusätzlich als `ROUTE_LAST_REPLACE_NOTE` exportiert. Ohne (a)
ist der Split wirkungslos (Kombi-Regex gewinnt per erster Treffer).

## §4 BEL r2 „maghrebinisch" — BEGRABEN (D3)

Suchergebnis (EN + NL, Kart/F4/GT): **kein Fahrer mit BEL-Lizenz und
Maghreb-Hintergrund** auffindbar. Die maghrebinischstämmigen Fahrer im
belgisch-nahen Raum fahren alle unter **marokkanischer Lizenz**: Sami Taoufik
(OK-Europameister 2017, Kart-Laufbahn u. a. in Belgien), Michaël Benyahia
(belgische Mutter, marokkanischer Vater — startet für **MAR**), Suleiman/Sofia
Zanfari (MAR). Im Spiel ist Nation = Lizenz — diese Gruppe erscheint also
bereits korrekt über die **MAR**-Namenswelt. Belgisch-marokkanische Jugendliche
ohne Lizenzwechsel haben keinen belegten Kart-Fußabdruck (Golf-Regel).
→ `BAN_FIRST.BEL`-Filter bleibt, **Punkt endgültig zu.** (Doku-Probe
„Mohamed Peeters" unziehbar in der Negativprobe verankert.)

## §5 Emulator-Vereinfachungen

Wie Welle 1 (METHODIK §5: Ära-Fenster flachgelegt, fixName weggelassen) plus:
Emulator-`old` für CAN = Stand **vor** Welle 1 (der Live-Zwischenstand
v0.9.14.81 ist per `data/names.js`-Messung im Report separat ausgewiesen);
GRE-Poolskelett als dokumentierte Kopie aus `build-names-v3.js NEW_POOLS`
(GRE steht nicht in `curated-base-v2.js`). Debug: `node classify-forenames.js
--dbg2` zerlegt die CAN-Wahrscheinlichkeit je Region.
