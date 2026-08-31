# Paket 7 — Tuning-Audit der Text-Bänke (Fable, 2026-07-11)

**Scope (erweitert, Nutzer-Entscheid):** 7 Bänke — `RECAP_BANK` (~L10594), `DRIVER_LORE`
(~L10961, 238 Einträge), `OBIT_BANK` (~L11215), `LIVE_COMMENTARY` (Paket 1, 390 Z.),
`PREVIEW_BANK` (Paket 4, 48 Z.), `DRIVER_BIO_BANK` (Paket 2, 217 Z.), `werdegang`-Bank
(Paket 3). Kriterien 1–5 aus SPEC §2. **Fable ändert nichts — Einbau = Opus (SPEC §5),
Bank-Quelle + Inline synchron halten.**

**Bilanz: 4 × HOCH · 7 × MITTEL · 8 × NIEDRIG.** Ersatz-Vorschläge sind paste-fertig,
Slots und Slot-Rollen unverändert (SPEC §4).

---

## HOCH (Grammatik-Bruch / Fakten-Leck)

### H1 — OBIT_BANK · nachruf.open.champion · Zeile 1 — Genus-Bruch bei femininem {klasseNom}
> „{nameE} ist tot. {klasseNom} verliert **einen seiner ganz Großen**."

**Kriterium 5.** `{klasseNom}` ist in 4 von 5 Ären **feminin** („die Formel 1", „die
Königsklasse") → „Die Formel 1 verliert einen *seiner* ganz Großen" ist falsch; korrekt
nur in e50 („der Grand-Prix-Sport"). Possessiv muss genus-frei werden:
```
'{nameE} ist tot. {klasseNom} verliert einen der ganz Großen.'
```

### H2 — OBIT_BANK · nachruf.open.talent · Zeile 2 — gleicher Genus-Bruch
> „Mit {name} verliert {klasseNom} **eines seiner größten Versprechen** – niemand wird je erfahren, wie weit ihn sein Talent getragen hätte."

**Kriterium 5.** Wie H1. Ersatz bindet das Possessiv an den (immer maskulinen) Fahrer:
```
'Mit {name} verliert {klasseNom} eines der größten Versprechen seiner Generation – niemand wird je erfahren, wie weit ihn sein Talent getragen hätte.'
```

### H3 — RECAP_BANK · tragik.one · Zeile 1 — Spiegelbild-Bug in e50
> „… – {klasseNom} verneigte sich **vor einem der Ihren**."

**Kriterium 5.** Umgekehrter Fall zu H1: „der Ihren" stimmt für die femininen Ären,
bricht aber in e50 („der Grand-Prix-Sport … einem der *Ihren*" → müsste „Seinen" sein).
Ersatz mit festem neutralem Subjekt (löst zugleich die {klasseNom}-Häufung im tragik-Pool):
```
'Überschattet wurde das Jahr vom Tod von {deadName} ({deadTeam}), der beim {deadRace} ums Leben kam – das Fahrerlager verneigte sich vor einem der Seinen.'
```

### H4 — DRIVER_LORE · `mike-hailwood` — Fakten-Leck: realer Titel
> „der **Motorrad-Champion** auf vier Rädern"

**Kriterium 4 / Lore-Leitplanke** („NIEMALS reale Erfolge/Titel"). Der kuratierte Bestand
löst denselben Fall bei Surtees vorbildlich („der Grenzgänger zwischen zwei und vier
Rädern" — kein Titelwort); Hailwood ist der eine Ausrutscher. Ersatz (Stil-Lob statt Titel):
```
'mike-hailwood':         'der Zweirad-Virtuose auf vier Rädern',
```

---

## MITTEL (Register / Ton / Monotonie)

### M1 — LIVE_COMMENTARY · systematisch — „P{pos}"-Sprech in e50/e62/e76 (Selbst-Befund)
**Kriterium 1.** „P4"-Notation ist modernes Broadcast-Deutsch — in Zeilen der Register
e50/e62/e76 ein Anachronismus. **Betroffen (17 Zeilen):**
- e50: pit #9/#13 · overtake #4/#9/#12 · dnf_mech #6/#13 · dnf_acc #6/#13
- e62: pit #6 · overtake #3/#7/#13 · dnf_mech #13 · dnf_acc #6/#13
- e76: pit #6 · overtake #3/#8 · dnf_mech #6/#12 · dnf_acc #5/#13 · finish #5

**Ersatzregel (direkte Substring-Substitution, Grammatik geprüft):** in allen
e50/e62/e76-Zeilen `P{pos}` → `Platz {pos}` („nun Platz {pos}", „von Platz {pos} aus dem
Rennen", „auf Platz {pos} liegend" — alle tragen). **Zwei Sonderfälle ausformuliert:**
```
e76 finish #5:  '🏁 Ganz oben: {driver}! Ein Triumph, der sich gewaschen hat.'
e76 overtake #3: '⚡ Runde {lap}: {driver} schnappt sich {victim} – jetzt Platz {pos}!'
```
e94/e10 behalten `P{pos}` (dort korrektes Register).

### M2 — RECAP_BANK · special.rookie · Zeile 3 — „Rookie" ära-geteilt
> „**Ein Rookie** als Weltmeister – {champion} verwandelte sein Debütjahr in einen Triumphzug."

**Kriterium 1.** Der special-Pool ist ära-geteilt; „Rookie" in einem 1950er-Rückblick ist
ein Registerbruch (Paket 4 nutzt deshalb {neulingSg}: „Rookie" erst ab e94). Die 4
Nachbarzeilen sagen korrekt „Neuling". Ersatz:
```
'Ein Neuling als Weltmeister – {champion} verwandelte sein Debütjahr in einen Triumphzug.'
```

### M3 — RECAP_BANK · special.poleKing — „Samstag" ×3 (Monotonie + Sachrisiko)
**Kriterien 3 + 4.** 3 von 5 Zeilen hängen am Samstag-Motiv („Auch samstags", „schneller
war samstags keiner", „Der Samstag gehörte fast immer ihm") — monoton, und Qualifyings
liegen nicht durchgehend samstags (Indy!). Zwei Ersetzungen, eine Samstag-Zeile bleibt:
```
#1: 'Auch über eine Runde war {champion} das Maß aller Dinge: {poles} Pole-Positions unterstreichen die Vormachtstellung.'
#5: 'Die erste Startposition gehörte fast immer ihm: {poles} Pole-Positions stehen {year} hinter dem Namen {champion}.'
```

### M4 — DRIVER_LORE — Adjektiv-Monotonie bei 238 Einträgen
**Kriterium 3.** Frequenz-Zählung der Charakter-Adjektive:

| Adjektiv | Anzahl | | Adjektiv | Anzahl |
|---|---|---|---|---|
| still | **14** | | zäh | 5 |
| freundlich | 7 | | wortkarg | 4 |
| ungestüm | 7 | | unermüdlich / unverwüstlich / furchtlos / elegant / bodenständig | je 4 |

„Still" trägt 6 % des Bestands; in den 1970ern stehen Pryce/Stommelen/Koinigg direkt
nebeneinander — sterben zwei davon in derselben Sim-Saison, klingen die Nachrufe wie
kopiert. **10 paste-fertige Ersatz-Epitheta** (gleiche Rolle: maskuline Nominativ-
Apposition, nur Herkunft/Charakter):
```
'rolf-stommelen':        'der sachliche Kölner',
'helmuth-koinigg':       'der zurückhaltende Wiener',
'riccardo-paletti':      'der schüchterne Mailänder',
'karl-wendlinger':       'der gelassene Tiroler',
'lance-stroll':          'der verschlossene Kanadier',
'pascal-wehrlein':       'der ernste Schwabe aus Sigmaringen',
'stoffel-vandoorne':     'der bedachte Flame aus Kortrijk',
'olivier-panis':         'der unaufgeregte Südfranzose',
'antonio-giovinazzi':    'der sonnige Apulier',
'juan-pablo-montoya':    'der angriffslustige Kolumbianer',
```
(reduziert „still" 14→6, „freundlich" 7→6, „ungestüm" 7→6; ikonische Fälle wie
„der stille Schäfersohn" Clark bleiben unangetastet.)

### M5 — DRIVER_LORE — Karriere-Rollen-Epitheta kollidieren mit der Sim (Grundregel 2)
**Kriterium 4.** „Karriere-Verläufe" sind laut Grundregel 2 verboten — die Sim vergibt
Cockpits anders. Zwei Einträge behaupten reale Karriere-Rollen **innerhalb** der
Sim-Zeitachse:
> `luca-badoer`: „der **ewige Testfahrer** aus Montebelluna" — ein Sim-Badoer mit Rennsiegen macht den Nachruf absurd.
> `consalvo-sanesi`: „der **treue Alfa-Testfahrer**" — Team-Bindung, die die Sim nicht garantiert.

```
'luca-badoer':           'der loyale Mann aus Montebelluna',
'consalvo-sanesi':       'der pflichtbewusste Toskaner',
```
(Abgegrenzt: `hermann-lang` „Silberpfeil-Veteran" ist **vor** 1950 verankert — die Sim
beginnt 1950, kein Widerspruch möglich → bleibt.)

### M6 — DRIVER_BIO_BANK · allrounder e10 · Zeile 3 — Regen-Überclaim (Selbst-Befund)
> „kein One-Trick-Pony: {name} kann Qualifying, Rennen, **Regen** und Reifen."

**Kriterium 4 / Kaliber-Leitplanke.** Der allrounder-Archetyp garantiert *ausgewogen*,
nicht *regenstark* — genau der Überclaim-Typ, den die Kaliber-Regel (Nutzer-Vorgabe
2026-07-10) verbietet. Ersatz ohne Disziplin-Aufzählung:
```
'kein One-Trick-Pony: {name} nimmt jede Aufgabe eines Rennwochenendes an.'
```

### M7 — RECAP_BANK · opener.knapp #6 + duell.knapp #2 — Hyperbel vs. Kategorie-Schwelle
> „**Wimpernschlag-Finale** {year}: … – **knapper geht es kaum**." / „…verlor den Titel … **um Haaresbreite**…"

**Kriterium 2.** Die knapp-Kategorie greift bis `gap ≤ winPts` — in e10 sind das **25
Punkte** (ein voller Sieg). „Wimpernschlag"/„Haaresbreite" bei 25 Punkten Abstand wirkt
deplatziert. **Option A** (nur Sprache, empfohlen):
```
opener.knapp #6: 'Enger Titelkampf bis zur letzten Wertung: {champion} schlug {vize} {year} um {gapAkk}.'
duell.knapp #2:  '{vize} verlor den Titel nicht durch Schwäche, sondern in einem Duell, das kaum enger hätte geführt werden können – ein Jahrgang, der beiden zur Ehre gereicht.'
```
**Option B (braucht Opus-Support):** Unterschwelle `gap ≤ winPts/2` für die zwei
Extrem-Zeilen — dann dürfen die Originale bleiben.

---

## NIEDRIG (Politur / Prüfaufträge)

### N1 — RECAP_BANK · duell.normal — „Dahinter…" ×3
Zeilen 3/4/5 eröffnen gleichförmig („komplettierte…"/„Dahinter reihte sich"/„Dahinter
sicherte sich"). Ersatz für #5:
```
'Platz zwei der Wertung ging mit {vizePoints} Punkten an {vize}.'
```

### N2 — RECAP_BANK · opener.normal · Zeile 4 — Dominanz-Rhetorik im normal-Pool
> „{champion} hieß der Mann, **an dem {year} kein Weg vorbeiführte**…"
Das ist dominant-Sprache; der normal-Pool umfasst auch Titel mit Mittel-Abstand.
```
'{champion} hieß der Mann, der {year} am Ende die Nase vorn hatte: Der Titel ging mit {siegeDat} an ihn.'
```

### N3 — PREVIEW_BANK · wechsel · Zeile 5 — „Tapetenwechsel" flapsig für e50 (Selbst-Befund)
Der Pool ist ära-geteilt; „Tapetenwechsel zündet" ist für 1950er-Ton zu salopp.
```
'ob die neue Umgebung zündet? {wechselName} versucht sein Glück ab sofort bei {wechselTeam}.'
```

### N4 — Paket 3 · werdegang.champion.ohneZenit · Zeile 4 — „kam als Unbekannter" (Selbst-Befund)
Werdegang gilt auch für **reale** Rücktreter — wer als bekannter Name in die Sim kam,
„kam" nicht als Unbekannter.
```
'den Weg vom Herausforderer zum Champion hat er vollendet – {seasonsText}.'
```

### N5 — LIVE_COMMENTARY · pit — {pos}-Semantik ungeklärt (Prüfauftrag an Opus)
Die pit-Zeilen sagen bewusst „aktuell Platz {pos}" — Opus muss beim Einbau festlegen, ob
`pos` die Position **vor** oder **nach** dem Stopp ist, und ggf. die Übergabe anpassen.
Kein Textfehler; Definitionslücke im Interface.

> **✅ ERLEDIGT v0.9.17.34.** `{pos}` ist die Position **beim Reinkommen** (Stand der letzten
> abgeschlossenen Runde): `idx` stammt aus der Sortierung der Vorrunde, die 22 s des Stopps
> fließen erst danach in `p.totalTime` und damit in die Neusortierung am Rundenende. Alle
> pit-Zeilen formulieren genau das („aktuell P{pos}", „von P{pos} an die Box") — keine
> Übergabe-Änderung nötig, Definition als Kommentar an der Aufrufstelle festgeschrieben.

### N6 — DRIVER_LORE — „das große Versprechen" doppelt
`roger-williamson` und `jules-bianchi` tragen wortgleich „das große Versprechen aus …"
(dazu nah: Brise „das strahlende Talent"). Verschiedene Ären → Kollision unwahrscheinlich;
optional:
```
'jules-bianchi':         'die stille Hoffnung aus Nizza',
```

### N7 — RECAP_BANK · tragik — {deadRace}-Kasus (Prüfauftrag an Opus)
Alle one-Zeilen bauen „beim {deadRace}". Mit englischen F1DB-Namen („Indianapolis 500",
„British Grand Prix") trägt das; sollte je ein deutsches „Großer Preis von …" durchrutschen,
bricht der Kasus („beim Großer Preis" ✗). Einmalig das raceName-Format verifizieren.

> **✅ BESTÄTIGT + BEHOBEN v0.9.17.34.** Der Bruch war **real erreichbar**, an drei Stellen —
> alle drei deutsch, Fremdsprachiges trägt als unflektierter Eigenname:
> 1. `NONWM_F1_VENUES` enthält **„Testfahrt"** (Femininum) → „beim Testfahrt" ✗. Der
>    wahrscheinlichste Pfad, denn Tode außerhalb der WM brauchen keinen Streckeneditor.
> 2. Streckeneditor/Zufallsgenerator (Paket 8), `racePattern.de/at/ch`: „Großer Preis von X"
>    → „beim Großer Preis" ✗. Das Editor-Eingabefeld schlägt diesen Namen sogar wörtlich vor.
> 3. Ebenso `racePattern.de`: „Internationales X-Rennen" → „beim Internationales …" ✗.
>
> Kette: `race.name` → `seasonDeaths.raceName` → `{deadRace}`. Häufigkeit: `tragik.one` greift
> nur bei **genau einem** Todesfall der Saison (sonst `many` mit reiner Namensliste); im
> 20-Saison-Testsave trat das 1× auf und traf zufällig einen tragenden Namen.
>
> **Fix nach Spec §5b.2** (Kasus-Tokens kommen fertig vom Assembler, wie `{gapDat}`):
> neue Hilfsfunktion `_recapRaceBei(name)` + Token `{deadRaceBei}`; alle 8 `tragik.one`-Zeilen
> nutzen jetzt ausschließlich dieses Token. Zwei satzinitiale „Beim {deadRace}"-Zeilen wurden
> umgebaut, weil `seasonRecapText` **nicht** kapitalisiert (`s.join(' ')`) — das Token steht
> nie am Satzanfang. Die Akkusativ-Zeile („überlebte den {deadRace} nicht") wurde auf
> „kehrte {deadRaceBei} nicht zurück" umgestellt. Verifiziert: 18 reale Namensquellen ×
> alle 8 Varianten, kein Kasusbruch; Deliverable und Inline-Kopie liefern identischen Text.

### N8 — RECAP_BANK · opener.dominant — theoretischer 0-Siege-Fall (Prüfauftrag an Opus)
Die dominant-Kategorie ist auch über die Gap-Route (≥ 3 Siegwerte) erreichbar. Mit 0
Siegen ergäbe {siegeDat} „mit **keinem einzigen Sieg** … beherrschte er die Saison nach
Belieben" — grammatisch korrekt, inhaltlich komisch. Praktisch kaum erreichbar; ein
Guard (`wins === 0` → normal-Pool) kostet eine Zeile.

> **✅ ERLEDIGT v0.9.17.35.** Guard wie vorgeschlagen, direkt nach der Kategorie-Wahl:
> `if (cat === 'dominant' && !((champion.wins || 0) > 0)) cat = 'normal';`
> Betroffen wären **8 der 10** dominant-Zeilen gewesen (die zwei ohne `{siegeNom}`/`{siegeDat}`
> hätten getragen). Verifiziert: siegloser Champion mit 85 Punkten Vorsprung zieht jetzt
> „sicherte sich mit keinem einzigen Sieg und 90 Punkten die Krone" — korrekt und ohne
> Dominanz-Behauptung; ein echter Dominator (14 Siege) bleibt unverändert im dominant-Pool.
> Nebeneffekt: In dieser Konstellation greift meist der `mostWinsLost`-Satz („Rennen gewinnt
> man mit Tempo, Titel mit Beständigkeit") — er beschreibt den Fall von selbst treffend.

---

## Geprüft und NICHT beanstandet (Auszug)
- **OBIT_BANK abschied** (alle 6 Kategorien + stats/close): register-sauber, Kategorien
  state-verifiziert („gewann nie ein Rennen" nur bei wins===0 ✓), {bilanz} kasus-invariant ✓.
- **death-Pools** (Paket 1) konsistent zum Paket-C-Nachruf-Ton; keine Ursachen, kein Kitsch.
- **DRIVER_LORE Fakten-Hygiene** sonst vorbildlich (Nicknames sauber zitiert, Familien-
  Herkunft statt Erfolge: „Sohn des Rallye-Champions" = Herkunft ✓, Surtees-Muster ✓).
- **PREVIEW_BANK** Hedging lückenlos; {rookieList}-Kasus-Gotcha bereits im Header dokumentiert.
- **RECAP tragik/closer.tragic**: Ton nüchtern-würdevoll, keine erfundenen Ursachen ✓.

## Empfohlene Opus-Einbau-Reihenfolge
1. **H1–H3** (Genus-Bugs — live sichtbar in jedem Nachruf/Rückblick der e62–e10 bzw. e50)
2. **H4 + M5** (Lore-Zeilen, 3 Ersetzungen in einer Map)
3. **M1** (17 Substitutionen in der Paket-1-Bank — VOR dem Paket-1-Einbau erledigen, dann
   ist es ein reiner Datei-Edit ohne Inline-Sync)
4. **M2–M4, M6–M7, N1–N4, N6** (Politur in einem Rutsch)
5. **N5/N7/N8** (Prüfaufträge, kein Text-Edit)

Danach: Node-Tests der betroffenen Bänke, Schema/Changelog/manage-v (Hotfix, additiv).
Paket-B-Regel 5b beachten: Bank-Quelle in `fable-deliverables/` und Inline-Kopie in
`index.html` synchron ändern.
