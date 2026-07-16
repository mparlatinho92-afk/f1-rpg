# Paket H – Die Nachwuchs-Pyramide (Fluss-Parameter & Trichter-Validierung)

**Auftraggeber:** Opus (im Namen des Nutzers) · **Bearbeiter:** Fable · **Sprache:** Deutsch
**Datum:** 2026-07-16 · **Typ:** Daten-/Ableitungspaket (kein Text-Paket → `FABLE-GRUNDREGELN.md` gilt hier **nicht**, die sind für Erzähl-Bänke)

> ### ⛔ HARTE GRENZE — du lieferst NUR Dateien
> **Schreibe ausschließlich in `fable-deliverables/paketH-pyramide/`. Sonst nirgends.**
> **Opus committet UND baut ein — beides.** Du tust keins von beidem.
> **Verboten:** `index.html`, `data/*` (`names.js` ist GENERIERT), `build-names-v3.js`,
> andere `paket*`-Ordner, jedes `git`-Kommando, `./manage-v`.
> Wenn dein Ergebnis eine Code-Änderung nahelegt: **beschreib sie in der METHODIK, führ sie
> nicht aus.** Ein Einbau von dir würde nur Konflikte mit Opus' chirurgischen Edits erzeugen.

---

## Problem

Die Junior-Welt endet nach unten bei **F3** (`JUNIOR_SERIES_DEFS` hat genau zwei Einträge:
`f3`, `f2`). Darunter existiert nichts. Damit fehlt dem Spiel die halbe Erzählung — der
Nutzer will **Kart-Supertalente sehen, bei denen sich die Spreu vom Weizen trennt**, und
eine Herkunfts-Historie („war früher im Kart und sonstwo").

Schwerer wiegt ein **struktureller Fehler**: Die Nationen-Verteilung läuft **rückwärts**.
`_makeJuniorDriver` zieht über `pickNationMotorsport(year, true)` aus
`MOTORSPORT_NATION_BLEND` — laut Code-Kommentar „50 % Motorsport-Welt-Frequenz
(12.207 Wikidata-Auto-Rennfahrer) + 50 % `DECADE_NATION_POOLS`". **Beides sind
Überlebenden-Verteilungen**: Wikidata-Rennfahrer sind Leute mit Enzyklopädie-Eintrag,
`DECADE_NATION_POOLS` ist die F1-Spitze. Das Spiel nimmt also eine Verteilung von der
**Spitze** und wendet sie an der **Basis** an.

Der Nutzer formuliert es als Bildungs-Trichter: *Kindergarten → Grundschule → Ausbildung →
Universität → Professur. Der Abfluss der Irrelevanten ist die Mehrheit.* Man kann die
Kindergarten-Population nicht aus der Professoren-Population ableiten.

**Beweis, wie kaputt das ist:** `MOTORSPORT_NATION_BLEND[2020]` gibt MON = 1,54 %.
Hochgerechnet auf eine volle Pyramide wären das ~175 gleichzeitige monegassische
Kartfahrer. Monaco hat 39.000 Einwohner. Das Modell behauptet, ~6 % aller Monegassen der
Geschichte wären Rennfahrer. Monaco **produziert** keine Karter — es **importiert** fertige
F1-Fahrer aus Steuergründen. Dasselbe, abgeschwächt, bei THA (Albon ist britisch-thailändisch
aufgewachsen). Umgekehrt sind AUS/USA/JPN/NZL/RSA/ARG auf Kart-Ebene **unterrepräsentiert**,
weil ihre Mehrheit in eigene Welten (Supercars, IndyCar, Super Formula) abfließt und nie
Richtung F1 läuft.

Der einzige heutige Ansatz dagegen ist `dampUSA: w *= 0.5` — ein hartcodierter Faktor
direkt in `pickNationMotorsport`.

## Ziel

Die **Fluss-Parameter der Pyramide** aus echten Daten ableiten, sodass Opus sie vorwärts
simulieren kann — und der Trichter hinten die beobachtete F1-Verteilung **reproduziert**.

Die Architektur-Entscheidung des Nutzers steht bereits fest (**nicht neu verhandeln**):

- **Population** (echte Fahrer-Objekte, browsebar): **F1, F2, F3, F4 (~15 Serien), Kart-WM/EM
  (eine Handvoll, überlappende Felder)**.
- **Verteilung** (keine Objekte, nur eine Rate): die **unübersichtliche Masse weiterer
  Kart-Serien** darunter. Sie wird nie simuliert, liefert aber Einsteiger nach oben.

## Ausdrücklich NICHT Teil dieses Pakets

- **Quereinstiege / Rückfluss** (Villeneuve, Herta, Montoya) und **Abfluss nach der F1**
  (Grosjean, Mick, Le Mans/WEC). Der Nutzer: *„Quereinstiege sind generell zu früh für das
  Spiel. Wichtig ist erstmal die Pyramide selbst funktionieren lassen."* **Nicht modellieren,
  nicht vorschlagen.**
- **Fremde Serien simulieren** (IndyCar, Super Formula, Supercars, GT/Tourenwagen). Existieren
  nicht und sollen nicht entstehen. Ihr Effekt darf **nur** implizit über die
  Nicht-Beförderungsquote erscheinen (s. Deliverable 3).
- **Namens-Pools / Caps.** Erledigt sich durch die Architektur-Entscheidung (Auslastung fällt
  von 319 % auf 18 %) — `data/names.js` bleibt unangetastet. Nicht anfassen.
- **`dampUSA`.** Nicht ändern, nicht entfernen. Es wird später von Deliverable 3 abgelöst —
  aber das entscheidet Opus/Nutzer, nicht dieses Paket. (Hinweis: Paket F hatte eine
  USA-Dämpfung ausdrücklich gesperrt, weil der Nutzer sie zurückgezogen hatte. Diese Sperre
  gilt weiterhin für Ad-hoc-Dämpfer; Deliverable 3 ist **kein** Dämpfer, sondern eine
  abgeleitete Quote.)

---

## Deliverable 1 — Ebenen-Skelett: Sitze, Verweildauer, Beförderungsquote

Je Ebene (**Kart-WM/EM, F4, F3, F2, F1**) und je Ära (mind. die 5 Register e50/e62/e76/e94/e10,
gern feiner):

| Ebene | Sitze gleichzeitig | Ø Verweildauer (Jahre) | Anteil, der **aufsteigt** | Anteil, der **verschwindet** |
|---|---:|---:|---:|---:|

- „Verschwindet" = alles Nicht-Aufsteigen zusammen (aufhören, GT/Tourenwagen, fremde Welt).
  **Nicht auftrennen** — die Ursache ist für die Pyramide irrelevant, nur die Rate zählt.
- **Ära-Abhängigkeit ist Pflicht.** Die 1950er hatten keine F4/Kart-Leiter; die Pyramide ist
  ein Nachkriegs-Konstrukt, das erst ab ~1980/1990 die heutige Form hat. Wo eine Ebene in
  einer Ära nicht existiert: explizit `null`, nicht raten.
- **Einstiegsalter** je Ebene mit angeben (Spanne), das Spiel braucht es für `_makeJuniorDriver`.

**Meine Schätzungen als Startpunkt — bitte ersetzen, nicht übernehmen:**
F1 26 Sitze / 8,0 J · F2 22 / 2,0 · F3 30 / 2,0 · F4 420 (15×28) / 1,5 · Kart-WM/EM 150 / 3,0;
Beförderungsquote pauschal 50 %.

## Deliverable 2 — Rate frischer Einsteiger je Ebene

Wie viele Neuzugänge einer Ebene kommen **von unten befördert**, wie viele **frisch** aus der
nicht-simulierten Masse?

**Kontext — der strukturelle Fund, den du prüfen und korrigieren sollst:** Mit meinen
Schätzwerten braucht F4 **280 Neuzugänge/Jahr** (420 Sitze ÷ 1,5 J), das Kart-Elitefeld gibt
aber nur ~50 Abgänge/Jahr her, davon ~25 aufsteigend. Daraus folgt: **~91 % der
F4-Neuzugänge kommen frisch aus der unübersichtlichen Kart-Masse, nicht aus der Kart-Elite.**
Das Elitefeld ist um Faktor ~3 zu klein, um 15 F4-Serien zu füttern — was zur Realität passt
(nationale F4-Serien werden von *nationalem* Kartsport gespeist, nicht von der CIK-FIA-Elite).

**Diese 91 % hängen direkt an der 50-%-Beförderungsquote und sind daher der wackeligste Wert
im ganzen Modell.** Bei 70 % statt 50 % verschiebt sich das Bild deutlich. Prüfe die Zahl —
sie entscheidet, wie groß die unsichtbare Basis sein muss.

Ebenso wichtig, weil es den Trichter nach oben schließt: mit meinen Werten erzeugen **F3 und
F1 null frische Fahrer** — alle kommen von unten. Bitte bestätigen oder widerlegen.

## Deliverable 3 — Intake-Nationenverteilung + nationsspezifische Beförderungsquote

**Der Kern des Pakets.** Zwei Tabellen:

**3a) Intake-Verteilung** — die Nationen-Verteilung der **frischen Einsteiger** (also an der
Basis, F4/Kart), je Dekade 1950–2020. Getrieben von **Bevölkerung × Motorsport-Kultur ×
Wohlstand**, *nicht* von F1-Erfolg. Monaco muss hier faktisch verschwinden (≈ Einwohnerzahl),
AUS/USA/JPN/NZL/RSA/ARG müssen deutlich **über** ihrem F1-Anteil liegen.

**3b) Nationsspezifische Beförderungsquote** — der Anteil je Nation, der von Ebene zu Ebene
**nicht** aufsteigt. Hier steckt der Abfluss implizit: Ein Australier hat Supercars als
Alternative, ein Finne oder Niederländer hat keine — er muss die europäische Leiter nehmen
oder aufhören. **Das ist eine Tabelle, keine Mechanik** — genau deshalb ist es kein
„Quereinstieg" und bleibt im Scope.

## Deliverable 4 — Validierung: fällt `DECADE_NATION_POOLS` hinten heraus?

Der harte Test: **Intake (3a) × Beförderungsquoten (3b) über alle Ebenen muss oben die
beobachtete F1-Verteilung ergeben.** Liefere den Vergleich je Dekade und Nation
(Modell vs. `DECADE_NATION_POOLS`), mit Fehlermaß.

**Präzedenzfall im Projekt:** Genau dieser Mechanismus wurde für Indy schon einmal von Hand
angewandt — USA fiel in den 1950ern von 34,8 % auf 7,2 %, sobald man die eigene Welt abzog
(`project_indy_crossover`, v0.9.14.38). Das ist derselbe Effekt, nur bisher einmalig und
manuell statt generell modelliert. Dein Modell muss dieses Ergebnis **reproduzieren** — wenn
es das nicht tut, stimmt etwas nicht.

---

## Datenlage — ehrlich: das Meiste liegt NICHT lokal

| Quelle | Enthält | Für dieses Paket |
|---|---|---|
| `data/f1db.js` (3,6 MB) | **Nur F1** (+ Indy). `PACE_RATINGS` je Fahrer/Jahr. **0 Treffer** für formula-2/3/4/karting | F1-Verweildauern ✅, sonst nichts |
| `fable-deliverables/nation-data/wikidata-cardrivers-raw.json` | **Nur Aggregat**: Land × Geburtsdekade × Anzahl (12.207 Fahrer). Keine Karrieredaten | Grobe Nationen-Frequenz, **keine** Verweildauern |
| `fable-deliverables/nation-data/nation-frequency-by-decade.js` | `MOTORSPORT_NATION_FREQ` (counts + shares je Debüt-Dekade) | Ausgangspunkt für 3a — aber **Überlebenden-Bias beachten!** |

**→ F4/F3/Kart-Verweildauern und Beförderungsquoten musst du extern beschaffen**
(Serien-Ergebnislisten, Fahrer-Datenbanken, CIK-FIA/ASN-Lizenzstatistiken für 3a).
**Wenn eine Zahl nicht belegbar ist: als Schätzung kennzeichnen und die Unsicherheit
angeben — nicht als Datum ausgeben.** Lieber eine ehrlich markierte Spanne als eine
erfundene Präzision.

**Warnung zu `MOTORSPORT_NATION_FREQ` als Basis für 3a:** Es ist selbst schon eine
Überlebenden-Verteilung (Wikidata = Leute mit Eintrag). Es ist ein **Korrektiv-Ausgangspunkt**,
nicht die Intake-Verteilung. Wer es ungefiltert als Basis nimmt, hat den Fehler nur verschoben.

## Gewünschtes Output-Format

Ordner: `fable-deliverables/paketH-pyramide/`

1. **`pyramid-flow.js`** — Ebenen-Skelett (D1) + Einsteiger-Raten (D2) als paste-fertiges
   JS-Objektliteral, inline-fähig (kein neues `data/*.js` — wird wie
   `MOTORSPORT_NATION_BLEND` direkt in `index.html` eingebettet). Ära-gestaffelt.
2. **`intake-nation-shares.js`** — D3a, Struktur analog `MOTORSPORT_NATION_BLEND`
   (`YYYY: { NAT:wert, ... }`, Summe 1.0), IOC-Codes **exakt** wie bestehend.
3. **`promotion-rates.js`** — D3b, je Nation (+ Ebene, falls nötig).
4. **`METHODIK.md`** — Quellen je Zahl, Ableitungsweg, **Unsicherheits-Kennzeichnung**,
   Validierungstabelle aus D4 (Modell vs. `DECADE_NATION_POOLS` je Dekade/Nation + Fehlermaß).

## Randbedingungen / Fallen

- **IOC-Codes** exakt wie bestehend (GBR, GER, USA, THA, RSA, MON …). Keine neuen Schreibweisen.
  Alle Nationen aus `MOTORSPORT_NATION_BLEND` müssen in 3a vorkommen — auch MON, wenn dann
  mit ~0. **Floor-Regel aus Paket F beachten:** kein Wert exakt 0 (ε ≈ 0.002), sonst
  verschwindet die Nation aus der Ziehung.
- **`MODERN_ONLY_NATIONS`** (Golf/Ägypten, erst ab Dekade 2000) muss respektiert bleiben.
- **Die Pyramide ist ein Nachkriegs-Konstrukt.** In den 1950/60ern gab es keine F4-Leiter —
  Fahrer kamen aus Sportwagen, Motorrädern, dem Nichts. Ein Modell, das 1955 eine
  Kart→F4→F3→F2→F1-Leiter unterstellt, ist falsch. Das ist genau der „Rest des Chaos der
  1960er", den der Nutzer erwähnt hat: **dort ist der Trichter kein Trichter.** Ära-Struktur
  ist deshalb Pflicht, nicht Kür.
- **Überlappung bei Kart:** Kart-WM und -EM sind dieselben ~150 Fahrer, nicht 5 × 40 separate
  Felder. Bei F4 sind die 15 Serien geografisch weitgehend getrennt (mit etwas Überlappung).
  Bitte je Ebene angeben, ob Sitze = Fahrer oder Sitze > Fahrer.
- **Prosa vermeiden.** Wie bei F/G: Tabellen + Skript + METHODIK, nichts, was Opus erst
  zerlegen muss.

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
