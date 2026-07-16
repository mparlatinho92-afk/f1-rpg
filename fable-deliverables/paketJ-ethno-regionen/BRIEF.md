# Paket J – Ethnisch-kulturelle Regionen (Vor-/Nachnamen-Kohärenz)

**Auftraggeber:** Opus (im Namen des Nutzers) · **Bearbeiter:** Fable · **Sprache:** Deutsch
**Datum:** 2026-07-17 · **Typ:** Daten-/Klassifikationspaket (kein Text-Paket → `FABLE-GRUNDREGELN.md` gilt hier **nicht**)

> ### ⛔ HARTE GRENZE — du lieferst NUR Dateien
> **Schreibe ausschließlich in `fable-deliverables/paketJ-ethno-regionen/`. Sonst nirgends.**
> **Opus committet UND baut ein — beides.** Du tust keins von beidem.
> **Verboten:** `index.html`, `data/*` (`names.js` ist GENERIERT), `build-names-v3.js`,
> `curated-base-v2.js`, andere `paket*`-Ordner, jedes `git`-Kommando, `./manage-v`.
> Wenn dein Ergebnis eine Code-Änderung nahelegt (z. B. `routeFirst`/`routeLast` trennen,
> Caps pro Region): **beschreib sie in der METHODIK, führ sie nicht aus.** Ein Einbau von dir
> würde nur Konflikte mit Opus' chirurgischen Edits erzeugen.

---

## Das Ziel in einem Satz

**„Mohammed Schneider" und „Sven Dogan" dürfen nicht entstehen — „Mehmet Dogan" schon,
wenn die Quelle die Paarung belegt.** Ebenso: kein „Jacques Müller", kein „Matthias Depardieu".

## Was bereits funktioniert (nicht kaputt machen)

Der **Regionen-Mechanismus** löst das Problem im Prinzip schon. `pickNameRegion` wählt eine
Region, dann kommen **Vor- und Nachname aus derselben Region**. Code-Kommentar in
`_makeJuniorDriver`: *„kein 'Jacques Müller': Vor+Nachname stammen aus derselben Region der
Nation"*. Belegt durch den Ist-Stand:

- **BEL** R0 (55 %, wallonisch): Jean/Pierre/Georges + Dupont/Dubois/Lambert ·
  R1 (45 %, flämisch): Jos/Herman/Frans + Peeters/Janssens/Maes ✅ kohärent
- **SUI** R0 deutsch · R1 französisch · R2 italienisch · R3 portugiesisch (`minYear: 2000`) ✅
- **CAN** R0 englisch · R1 Québec · R2 südasiatisch (`minYear: 2000`) ✅

**`minYear` je Region existiert** („Region existiert erst ab diesem Debütjahr") und löst die
Einwanderungs-Zeitachse.

## Das Problem: die Routing-Regexe sind NACHNAMEN-Muster

`cfg.route` wird in `processNation` auf **beide** Arten angewandt
(`for (const kind of ['last','first'])` → `if (re.test(e.name)) e.r = ri`). Die Muster sind aber
Nachnamen-Muster: `/^(Van|Vande|Peeters|Claes|…)/`, `/^(Favre|Rochat|Bonvin|…)$/`,
`/^(Bernasconi|Rossi|Bianchi|…)$/`. **Ein Vorname wie „Jos", „Claude" oder „Gianni" matcht
keines davon → `e.r = 0`.**

**Folge: Die gesamte Daten-Vornamensmasse landet in Region 0.** Die Minderheitsregionen behalten
nur ihre ~9–32 **kuratierten** Vornamen:

| Region | Gewicht | Vornamen | Nachnamen |
|---|---:|---:|---:|
| BEL R0 (wallonisch) | 55 % | 476 | 728 |
| **BEL R1 (flämisch)** | **45 %** | **32** | 307 |
| SUI R0 (deutsch) | 52 % | 482 | 940 |
| **SUI R1 (französisch)** | **31 %** | **20** | **34** |
| **SUI R2 (italienisch)** | **11 %** | **9** | **11** |
| SUI R3 (portugiesisch) | 6 % | 6 | 60 |
| CAN R0 (englisch) | 55 % | 452 | 850 |
| **CAN R1 (Québec)** | **33 %** | **28** | 81 |
| CAN R2 (südasiatisch) | 12 % | 27 | 111 |

**Ein italienischsprachiger Schweizer zieht aus 9 Vornamen und 11 Nachnamen** — schlimmer als
der `early`-Stub, der gerade in v0.9.14.78 repariert wurde, und er trifft 11 % aller Schweizer
**in allen Ären**. Messbarer Beleg: BEL-Vornamen liegen bei **eff 65** gegen
**eff_Bevölkerung 367** (9× zu konzentriert) — siehe
`name-data/analysis/pyramid-300kart-nation-demand.md` §4.

**Mit mehr Kaggle-Daten NICHT lösbar:** Die Quelle ist **national**. Die BE-Daten mischen
flämisch und wallonisch ohne Marker, die CH-Daten deutsch/französisch/italienisch.
**Die Namen müssen klassifiziert werden** — das ist der Kern dieses Pakets.

---

## Deliverable 1 — Vornamen-Klassifikation je Region

Für jede Nation mit Regionen: **die Vornamen der Kaggle-Quelle den Regionen zuordnen.**
Output pro Nation: Regex-/Listen-Router für **Vornamen**, analog zu den bestehenden
Nachnamen-Routern (`cfg.route`).

**Zwei Sorten Region — sauber unterscheiden:**

- **(a) Interne Sprachregionen** (nativ, **kein `minYear`**): BEL flämisch/wallonisch,
  SUI deutsch/französisch/italienisch, CAN englisch/Québec, ESP kastilisch/katalanisch/baskisch,
  RSA afrikaans/englisch/Bantu. Diese Regionen existieren **seit jeher** — ein 1950er-Belgier
  kann flämisch sein.
- **(b) Einwanderungsregionen** (**`minYear` Pflicht**): GBR südasiatisch, FRA Maghreb,
  SUI portugiesisch (heute 2000), CAN südasiatisch (heute 2000), GER türkisch (existiert noch
  nicht, s. D2). **Nenne für jede ein begründetes `minYear`** — nicht das Zuwanderungsjahr,
  sondern das **Debütjahr der ersten im Land geborenen Generation** (Gastarbeiter ab ~1961
  → Kinder debütieren ab ~1985).

**Belegpflicht (Nutzer-Vorgabe):** *„Mohammed Dogan möglich, falls die Quelle es nachweist."*
Eine Vorname-Region-Zuordnung braucht einen Beleg (Sprachraum-Statistik, regionale
Namensverteilung, Etymologie). **Wo du rätst: kennzeichnen.** Lieber eine ehrlich markierte
Unsicherheit als eine erfundene Zuordnung.

## Deliverable 2 — `banFirst` → `route` (der Deutschland-Fall)

**`banFirst` ist das falsche Werkzeug.** `GER` hat in `build-names-v3.js` ein `banFirst` mit
türkischen Vornamen (Ali/Mehmet/Mustafa/…) — es **unterdrückt** statt zu **trennen**. Ergebnis:
Deutschland hat gar keine türkisch-deutsche Region, obwohl das die größte Einwanderungsgruppe
ist. Frankreich macht es richtig vor:

```js
FRA: { route: [[ARABIC_MAGHREB, 1], [/^(Mohamed|Mehdi|Karim|Yanis|…)$/, 1]] }
```
→ arabische **Nachnamen UND Vornamen** gemeinsam nach Region 1.

**Auftrag:** Für GER (und jede andere Nation, die statt Routing bannt) den äquivalenten
`route` + Regionsdefinition liefern: Vornamensatz, Nachnamensatz, Gewicht, `minYear`.
**Prüfe alle `banFirst`/`banLast`-Einträge** und sag, welche eigentlich Routen sein müssten
und welche echte Filter bleiben (z. B. `GIVEN_AS_SURNAME` = Datenmüll, bleibt Filter).

## Deliverable 3 — Regionsgewichte prüfen

Die Gewichte sind Hand-Setzungen und teils zweifelhaft. **BEL R0 (wallonisch) = 55 % gegen
R1 (flämisch) = 45 %** — Belgien ist real ~58 % flämisch / ~32 % wallonisch. Ist die Umkehrung
Absicht (Motorsport-Gewichtung: Spa/Wallonie, historische Fahrer) oder ein Fehler?

**Auftrag:** Gewichte je Region **belegt** vorschlagen. Erlaubt und erwünscht ist eine
**motorsport-gewichtete** statt bevölkerungs-gewichtete Verteilung — aber **dann sag es und
belege sie** (z. B. Herkunft realer belgischer/schweizerischer Fahrer aus F1DB). Ära-Abhängigkeit
ist zulässig (Wallonie war früh dominanter, Flandern später).

## Deliverable 4 — Wirkungs-Report

- **Effektive Größe (Simpson `1/Σp²`) je Region vorher/nachher** — das ist das Erfolgsmaß.
  SUI R2 muss von eff ~9 spürbar hoch.
- Vollname-Sichtprobe: 15 Namen je Region und Nation, für die Ären ~1955 / ~1985 / ~2015,
  zur Nutzer-Sichtprüfung.
- **Negativprobe:** Beleg, dass „Jacques Müller", „Sven Dogan", „Mohammed Schneider",
  „Matthias Depardieu" nach deiner Zuordnung **nicht** ziehbar sind.

---

## Gewünschtes Output-Format

Ordner: `fable-deliverables/paketJ-ethno-regionen/`

1. **`region-routes.js`** — die Router aus D1/D2, paste-fertig, in der bestehenden
   `cfg.route`-Struktur (`[[regex, regionIndex], …]`), **getrennt nach `routeFirst` und
   `routeLast`** falls du eine Trennung brauchst (dann sag es — Opus muss `processNation`
   dafür anpassen, das ist eine kleine Build-Änderung).
2. **`region-defs.js`** — Regionsdefinitionen aus D2/D3: Gewicht, `minYear`, kuratierte
   Basis-Namen je Region.
3. **`METHODIK.md`** — Klassifikations-Grundlage je Nation, Belege, Unsicherheits-Kennzeichnung,
   `minYear`-Begründungen, Gewichts-Belege.
4. **`REPORT.md`** — D4.

## Randbedingungen / Fallen

- **Golfstaaten-Expats bleiben ausgeschlossen** (SAU/UAE/QAT via `foreCap0`/`surCap0`).
  **So gewollt — nicht als Fehler melden, nicht „reparieren".** Nutzer-Begründung: Die
  Kaggle-Aggregate der Golfstaaten sind expat-dominiert (indisch/pakistanisch, „Md"/„Khan"),
  und diese Bevölkerung stellt keine Motorsport-Fahrer: *„Ein indischer Bauarbeiter wird eher
  in der UAE League Fußball spielen als sich ein Kart leisten."* Die Golf-Nationen bleiben
  bei ihren kuratierten arabischen Namen. **Das ist die Regel für Einwanderungsregionen
  generell: sie kommen nur ins Feld, wenn die Gruppe realistisch Motorsport betreibt** —
  Einwanderung allein reicht nicht, es braucht die soziale Schicht dazu.
- **`data/names.js` ist GENERIERT** — „NIE von Hand editieren". Deine Deliverables sind
  Eingabe für `build-names-v3.js` / `curated-base-v2.js`, kein Endprodukt.
- **Ära-Split-Stand (v0.9.14.78):** Nur **GER/GBR/USA/FRA/ITA** haben noch
  `first: {early, mid, modern}`; alle anderen sind **flach** (`ERA_SPLIT_KEEP`). Deine
  Vornamen-Router müssen mit **beiden** Formen funktionieren.
- **Reihenfolge im Build:** `route` wird **vor** der Torso/Tail-Verteilung angewandt — die
  Caps (`CLASSES`) gelten **pro Nation**, nicht pro Region. Eine Region mit 45 % Gewicht bekommt
  also nicht automatisch 45 % der Namen. **Prüfe, ob die Caps pro Region aufgeteilt werden
  müssen** — wenn ja, sag es, das ist eine Build-Änderung für Opus.
- **Nicht Teil dieses Pakets:** Ära-Vornamen (**Paket I**), Pyramiden-Fluss (**Paket H**),
  die Cap-/Vertiefungsfrage (`analysis/pyramid-300kart-nation-demand.md` §7/§9).
- **Prosa vermeiden.** Wie F/G/H/I: Tabellen + Router + METHODIK.

---

## Lieferung, Committen, Grenzen (gilt für dieses Paket)

**Du lieferst nur Dateien in diesen Ordner. Du committest NICHT.**
`manage-v` erfasst `fable-deliverables/` nicht — **Opus schiebt nach deiner Lieferung einen
Sync-Commit nach** (Hausregel 5b) und baut das Deliverable danach ein. Kein `git`-Kommando
von dir nötig.

**Nicht anfassen:**
- `index.html` — Opus-Gebiet (der Einbau ist eine separate, chirurgische Aufgabe).
- `data/names.js` — **GENERIERT** von `build-names-v3.js`, „NIE von Hand editieren".
- `data/f1db.js`, `data/seasons.js`, `data/hist.js` — Datenquellen, nur lesen.
- Andere `paket*`-Ordner.

**Fleißarbeit gehört in ein Skript, nicht in Handarbeit.** Präzedenz: Paket F lieferte
`derive-smoothed-pools.js`, Paket G `derive-market-corpus.js` — jeweils Skript **+** Ergebnis
**+** METHODIK. Wenn deine Aufgabe hunderte Namen/Zeilen sortiert: schreib den Klassifikator,
lass ihn laufen, liefere beides. Ein reproduzierbares Skript schlägt eine handkuratierte Liste,
weil Opus es nach einer Quellen-Änderung neu laufen lassen kann.

**Perfektion ist nicht das Ziel** (Nutzer-Vorgabe): „nichts kann/muss 100 % perfekt sein".
Plausibel schlägt perfekt (vgl. `CLAUDE.md`: *„plausibel vor perfekt"*). Wo du unsicher bist:
**kennzeichnen und weitermachen** — eine ehrlich markierte Schätzung ist brauchbar, eine
unmarkierte Erfindung nicht.
