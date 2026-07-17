# Paket J – AUSBAU (Welle 2): Griechenland + CAN-Split + Restoptionen

**Auftraggeber:** Opus (im Namen des Nutzers) · **Bearbeiter:** Fable · **Sprache:** Deutsch
**Datum:** 2026-07-17 · **Typ:** Daten-/Klassifikationspaket (kein Text-Paket → `FABLE-GRUNDREGELN.md` gilt hier **nicht**)
**Voraussetzung:** Lies zuerst `BRIEF.md`, `METHODIK.md`, `REPORT.md` (Welle 1) — die gelten weiter.

> ### ⛔ HARTE GRENZE — du lieferst NUR Dateien
> **Schreibe ausschließlich in `fable-deliverables/paketJ-ethno-regionen/`. Sonst nirgends.**
> **Opus committet UND baut ein — beides.** Du tust keins von beidem.
> **Verboten:** `index.html`, `data/*` (`names.js` ist GENERIERT — **lesen ja, schreiben nie**),
> `build-names-v3.js`, `curated-base-v2.js`, andere `paket*`-Ordner, jedes `git`-Kommando, `./manage-v`.
> **`fable-deliverables/paketI-aera-vornamen/` ist TABU** — daran arbeitet parallel eine andere
> Session. Nicht lesen-und-drauf-aufbauen, nicht anfassen.
> Wenn dein Ergebnis eine Code-Änderung nahelegt: **beschreib sie in der METHODIK, führ sie nicht aus.**

---

## Kontext: Welle 1 ist eingebaut

Paket J ist seit **v0.9.14.80** live (Commits `64d2599` + `485fca2`). Der Vornamen-Router läuft für
12 Nationen, GER hat seine türkisch-deutsche Region, RSA/IND haben die neuen Gewichte.
26 von 29 Regionen treffen `REPORT.md` §1 exakt. **Deine Welle-1-Arbeit ist bestätigt — hier geht
es nur um das, was danach übrig blieb bzw. beim Einbau auffiel.**

Zwei Dinge haben sich am Fundament geändert, auf denen du aufsetzt:

1. **`build-names-v3.js` importiert `region-routes.js` und `region-defs.js` jetzt direkt**
   (`require('../paketJ-ethno-regionen/region-routes.js')`). Deine Dateien sind **Laufzeit-Quelle**,
   keine Vorlage zum Abtippen. → **Export-Struktur unbedingt beibehalten**
   (`ROUTE_FIRST`, `BAN_FIRST`, `ROUTE_LAST_ADD`, `BAN_LAST_ADD` + die Einzel-Regexe).
   Was du hier lieferst, wirkt nach dem nächsten Build sofort.
2. **`classify-forenames.js` bleibt der Regressionscheck** und liest dieselben Dateien.
   Die Negativprobe muss am Ende **≥ 25/25** stehen (gern mehr Fälle).

### Was Opus beim Einbau selbst geändert hat (nicht nochmal machen)
- `BAN_LAST_ADD.SUI`: `Thaqi|Maliqi|Idrizi|Kabashi|Ahmetaj|Rexhaj` **ergänzt** (deine albanische
  Liste hatte sie nicht; zusammen 1:396 der CH-Ziehmasse).
- `GER.banLast`: `SLAVIC_EAST` → **`SLAVIC_NARROW`** und `/ski$|cki$/` gestrichen. Grund: die
  `-in$`-Branch verbannte **Klein (DE-Rang 14!), Stein (70), Hein, Lein**, der `ski`-Ban verbannte
  Kowalski/Kaminski/Grabowski/Jankowski (ruhrpott-deutsch). Nebeneffekt: türkische `-in`-Namen
  (Şahin/Aydin/Çetin/Yalçın/Keskin/Akin) werden jetzt korrekt nach r1 **geroutet**.
- `OPS.GER.drop.last`: `Tin`/`Rin` (Artefakte).

---

## ⛳ Die Mess-Methode, die alles entschieden hat (bitte übernehmen)

Welle 1 hat gegen **Rohdaten-Counts** argumentiert. Beim Einbau hat sich gezeigt: das führt in die
Irre. Entscheidend ist die **gewichtete Ziehmasse im GEBAUTEN Pool** — also
`data/names.js` lesen, Pool **und** Tails (Gewicht 1) mergen, mit dem Regionsgewicht `r.w`
multiplizieren und fragen: *„1 von wie vielen Fahrern dieser Nation?"*

Erst dadurch kippten zwei Empfehlungen (s. §4) und wurde Griechenland sichtbar.
**Jede Behauptung in deinem Report bitte in dieser Einheit belegen, nicht in Rohcounts.**

---

## Deliverable 1 (HAUPTAUFGABE) — Griechenland: der Pool ist zu ~44 % kein Griechisch

Gemessen am gebauten Pool (1009 Nachnamen, eff 368 — **der Pool ist gesund, Bereinigung kostet
keine Vielfalt**): **43,9 % der Ziehmasse hat keine griechische Endung.** Griechische Männer-
Familiennamen enden praktisch immer auf `-s` oder `-ou`.

| Klasse | Namen | Ziehmasse | Beispiele (Gewicht) |
|---|---:|---:|---|
| südasiatisch (PK/BD) | 16 | 4,4 % | `Mehar:38 Shahzad:34 Ullah:33 Rana:32 Hossain:31 Mughal:26 Tarar:26 Awan:25` |
| albanisch **+ griech. Weibformen** | 319 | 25,6 % | `Cela:40 Kola:38 Molla:37 Lleshi:32 Prifti:31 Hysa:30` / `Pappa:41 Makri:28 Karagianni:28` |
| Rest (türkisch, Junk, PK) | 176 | 14,0 % | `Pap:33 Halil:29 Jaan:29 Memet:27 John:25 Afzal Asif Bilal` |

`Cela`, `Kola`, `Molla` stehen mit Gewicht 37–40 **direkt hinter `Papadopoulos:100`** — das ist
Kopf-Verunreinigung, kein Tail-Rauschen. Albanische Nachnamen treffen heute **1 von 24**
griechischen Fahrern (deine Welle-1-Liste fängt davon nur 6 von 20 Namen).

**Zwei belegte Ursachen:**
1. `GREEK_FEMALE` = `/(opoulou|poulou|idou|iadou|adou|aki)$/` verfehlt die **Genitiv-Kurzformen**:
   `Pappas→Pappa`, `Makris→Makri`, `Karagiannis→Karagianni`. Das ist die produktivste Weibform
   überhaupt (männlich `-is`→weiblich `-i`, `-as`→`-a`).
2. `SOUTH_ASIAN` kennt die **pakistanischen** Namen nicht (`Shahzad/Ullah/Rana/Mughal/Tarar/Awan/
   Hossain/Afzal/Asif`). Griechenland hat eine große pakistanisch-bangladeschische Gemeinde.

**Deine Aufgabe:**
- **D1a** — Klassifiziere die GR-Nachnamenmasse sauber: griechisch (männlich) / griechisch (weiblich,
  → Ban) / albanisch (→ Ban) / südasiatisch (→ Ban) / türkisch / Junk. **Vorsicht mit `-ou`:**
  `Georgiou/Nikolaou/Ioannou/Dimitriou` sind **legitime männliche** Namen (zypriotisch-patronymisch),
  nicht Weibformen — nur `-opoulou/-poulou` u. ä. sind weiblich. Diese Grenze sauber ziehen.
- **D1b** — Liefere `BAN_LAST_ADD.GRE` (bzw. eine präzisere `GREEK_FEMALE`-Nachfolgeform, dann als
  Vorschlag in der METHODIK beschreiben, **nicht** in `build-names-v3.js` einbauen).
- **D1c** — Prüfe die GR-**Vornamen** mit derselben Brille (`banFirst.GRE` existiert bereits) —
  `Eleni:27` steht als *Nachname* im Pool, also ist dort auch etwas schief.
- **D1d** — **Keine griechisch-albanische Region.** Es gibt keinen Motorsport-Anker (Golf-Regel aus
  Welle 1 gilt: Einwanderung allein reicht nicht, es braucht die soziale Schicht). Filter, nicht Region.
  Falls du einen Anker **findest**, belege ihn — dann diskutieren wir.
- **D1e** — Nachweis, dass der GRE-Pool nach der Bereinigung gesund bleibt (Namenszahl + eff).

---

## Deliverable 2 — CAN r2 aufspalten (deine „Option" ist ein echter Fehler)

Du hast den Split als *„Option, kein Muss"* markiert. Die Messung sagt etwas anderes:

```
CAN r2 (w=0.12): Vornamen 69,0 % südasiatisch · 0,0 % ostasiatisch · 31,0 % übrige
                 Nachnamen 44,0 % ostasiatisch · 56,0 % südasiatisch/übrig
→ P(südasiat. Vorname × ostasiat. Nachname) = 30,4 % der r2-Fahrer
→ 3,64 % ALLER CAN-Fahrer = 1 in 27 heißt „Sandeep Tsang"
```

Das ist dieselbe Größenordnung wie „Jacques Peeters", den Welle 1 abgeschafft hat. Bemerkenswert:
**ostasiatische Vornamen haben 0 % Ziehmasse** (Wei/Jun/Ming aus `CAN_NEW_FIRST` kommen in den
Daten nicht an) — r2 ist faktisch eine südasiatische Region mit 44 % chinesischen Nachnamen drin.

**Aufgabe:** r2 (südasiatisch) / r3 (ostasiatisch) trennen — Gewichte, `minYear` je Region
(⚠ die Sikh-Community in BC existiert seit ~1905, die chinesische seit dem Eisenbahnbau — beide
älter als das aktuelle `minYear: 2000`; belegen und ggf. korrigieren), Vor- **und** Nachnamen-Routen.
Das 0-%-Problem der ostasiatischen Vornamen mitlösen (kuratierter Kopf nötig? Pinyin-Rufnamen?).

---

## Deliverable 3 — BEL r2 „maghrebinisch": belegen oder begraben

Du hast sie offengelassen („kein belgisch-maghrebinischer Motorsport-Anker bekannt"), aktuell
greift der Filter `BAN_FIRST.BEL`. **Entscheide es mit Belegen**, nicht nach Gefühl: Gibt es
belgisch-marokkanische/-türkische Fahrer in Kart/F4/GT (Belgien ist Kart-Land, Genk)? Wenn ja:
Region mit `w` + `minYear` + Belegzeile. Wenn nein: Filter bleibt, **einmal sauber begründet**,
und der Punkt ist für immer zu.

---

## §4 GESCHLOSSEN — nicht nochmal aufmachen (mit Messung widerlegt)

Diese drei standen in `REPORT.md` §4 als Optionen. Opus hat sie gemessen und **verworfen**.
Bitte nicht erneut vorschlagen; wenn du sie doch für nötig hältst, brauchst du eine Zahl in
„1 von wie vielen Fahrern"-Einheit, die diese hier schlägt:

| Option | Messung | Urteil |
|---|---|---|
| **BALKAN + Hoti-Liste global** | Gewinn: AUT 1:1913 · GER 1:1602 · SWE 1:6003 · DEN/FRA **null**. Risiko: `Hasani/Ismaili/Osmani/Ademi/Selimi` sind albanisch **und** arabisch — in MAR sind `Ismaili (2546)`/`Hasani (1374)` **echte Namen**; dass MAR heute nicht betroffen ist, ist Zufall (MAR nutzt `BALKAN` nicht). | **verworfen** — 20 Nationen Risiko für 1:1600. Stattdessen die 6 fehlenden Namen lokal in `BAN_LAST_ADD.SUI` (erledigt). |
| **MAS-Tail enger cappen** (`sur` 600→400) | r0 hat **1,4 %** Fremdkörper (`Wati:20 Kok:17 Krishnan:17`, Rest Gewicht-1-Tails) = ~0,8 % der MAS-Fahrer. r1 ist zu 93,4 % chinesisch = sauber. | **verworfen** — Rauschen. Ein Cap-Schnitt kostet mehr Vielfalt als er Kohärenz bringt. |
| **EST `minYear 1965`** | Deine eigene Welle-1-Begründung trägt: die russische Gemeinde ist alteingesessen (Narva vor 1940), die Junior-Welt startet 1950 = sowjetisches Estland. Kein Einwanderungs-Gate nötig. | **verworfen** — Bestand bestätigt. |

---

## §5 Randbedingungen / Fallen (aus dem Einbau gelernt — teuer bezahlt)

1. **Kuratierte Nachnamen sind ban-immun** (`curatedProtected` in `processNation`) — und das
   **maskiert zu grobe Bans**: `Klein`/`Nowak` überlebten den kaputten GER-Ban nur, weil sie in
   `curated-base-v2.js` stehen, `Stein`/`Hein` nicht. **→ Ein Ban-Regex ist NIE über den Top-Kopf
   prüfbar, immer nur über die volle Datenmasse.** Das ist vermutlich auch der Grund, warum GRE
   so lange durchrutschte.
2. **Bans laufen in Schritt 1, Routen erst in Schritt 3** → ein Ban frisst Namen, bevor eine Route
   sie einsammeln kann. Bei jeder neuen Route prüfen, ob ein Ban davorsteht (GER/TURKISH war genau das).
3. **Suffix-Heuristiken sind gefährlich.** Ein Versuch mit `-lli/-lla/-zi/-i` für Albanisch riss
   sofort `Willi`, `Künzi`, `Menzi` (schweizerdeutsch), `Martinelli` und ausgerechnet **`Galli`**
   (kuratiert im Tessin-Pool!) mit; `-aj` kollidiert mit arabisch `Faraj`. **Explizite Namenslisten
   sind hier der einzig sichere Weg** — deine Welle-1-Methode war richtig, nur zu kurz.
4. `key()` merged `ı`/`i` **nicht** (`Yilmaz` ≠ `Yılmaz`) — beide Schreibungen listen.
5. Ambige Namen immer **im Kontext der Nation** entscheiden, nie global (s. `Hasani` MAR vs. CH).

---

## §6 Gewünschtes Output-Format

In `fable-deliverables/paketJ-ethno-regionen/`:

| Datei | Inhalt |
|---|---|
| `region-routes.js` | **erweitern** (nicht neu anlegen): `BAN_LAST_ADD.GRE`, `ROUTE_FIRST.CAN` neu, ggf. `BAN_FIRST.GRE`. Export-Struktur beibehalten! |
| `region-defs.js` | **erweitern**: CAN-Regionen (r2/r3) + Gewichte/`minYear`, ggf. BEL r2 |
| `classify-forenames.js` | **erweitern**: GRE + CAN-Split messen, Negativprobe ausbauen (≥25/25, neue Fälle: „Sandeep Tsang" unziehbar, „Nikos Hoxhaj" unziehbar) |
| `METHODIK-AUSBAU.md` | Klassifikations-Belege je Nation, Unsicherheiten mit ⚠, **Code-Änderungen beschreiben statt ausführen** |
| `REPORT-AUSBAU.md` | Wirkung in **„1 von wie vielen Fahrern"** (§ Mess-Methode) + Sichtprobe 15 Vollnamen je geänderter Region + eff vorher/nachher + Negativprobe-Tabelle |
| `run-ausbau.txt` | eingefrorene Referenz-Ausgabe des finalen Laufs |

**Reproduzierbar + deterministisch** (Seed 42), wie Welle 1.

## §7 Prüfstein

Am Ende muss gelten — und im Report belegt sein:
- „Nikos Hoxhaj", „Dimitris Malaj", „Giorgos Shahzad", „Kostas Pappa" (Weibform) **nicht ziehbar**
- „Sandeep Tsang", „Anil Phan" **nicht ziehbar** · „Sandeep Singh", „Kevin Tsang" **ziehbar**
- GRE-Pool nach Bereinigung: Namenszahl + eff belegt gesund (Ausgangswert: 1009 Namen, eff 368)
- Welle-1-Negativprobe **weiterhin 25/25**
