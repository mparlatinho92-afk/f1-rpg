# Paket I – Ära-Vornamen aus Geburtsjahrgangs-Statistik

**Auftraggeber:** Opus (im Namen des Nutzers) · **Bearbeiter:** Fable · **Sprache:** Deutsch
**Datum:** 2026-07-17 · **Typ:** Daten-/Ableitungspaket (kein Text-Paket → `FABLE-GRUNDREGELN.md` gilt hier **nicht**)

> ### ⛔ HARTE GRENZE — du lieferst NUR Dateien
> **Schreibe ausschließlich in `fable-deliverables/paketI-aera-vornamen/`. Sonst nirgends.**
> **Opus committet UND baut ein — beides.** Du tust keins von beidem.
> **Verboten:** `index.html`, `data/*` (`names.js` ist GENERIERT), `build-names-v3.js`,
> `curated-base-v2.js`, andere `paket*`-Ordner, jedes `git`-Kommando, `./manage-v`.
> Wenn dein Ergebnis eine Code-Änderung nahelegt: **beschreib sie in der METHODIK, führ sie
> nicht aus.** Ein Einbau von dir würde nur Konflikte mit Opus' chirurgischen Edits erzeugen.

---

## Problem

Das `early`-Vornamen-Fenster ist kein dünner Pool, es ist ein **Stub**. Gemessen
(`analysis/scripts/nation-demand.js`-Methodik, effektive Größe = Simpson `1/Σp²`):

| Fenster | GER | GBR | typische Nation |
|---|---:|---:|---:|
| `early` | **16 Namen / eff 15** | **41 / eff 16** | **10 / eff 9** |
| `mid` | 532 / eff 207 | 591 / eff 206 | ~470 / eff ~170 |
| `modern` | 370 / eff 90 | 440 / eff 98 | ~335 / eff ~105 |

**32 von 33 ära-gesplitteten Nationen haben `early` eff < 25.** Ein niederländischer Fahrer
von 1955 zieht seinen Vornamen aus **zwölf**.

**Und das ist mechanisch unheilbar durch mehr Kaggle-Daten:**
1. Im Build gehen die Aggregat-Daten **nur nach `mid`** (+ gedeckelt via `modDup` nach `modern`).
   `early` bekommt **nie** etwas.
2. Der Laufzeit-Merge bestätigt es (`ensureNamePoolsMerged`, `index.html` ~L4991):
   *„first → Gewicht 1 nur an mid+modern"*. Die weight-1-Tails erreichen `early` nicht.
3. **Grundursache:** Die Kaggle-Quelle ist ein **Gegenwarts-Schnappschuss** (Facebook-abgeleitet).
   Darin stecken keine 1930er-Häufigkeiten. Nachnamen datieren kaum (Smith bleibt Smith),
   **Vornamen datieren hart** (Hans/Karl/Werner → Leon/Luca/Finn). `TOP_N 6000` bringt für
   `early` exakt **null**.

## Ziel

Die Vornamen-Verteilung der **fünf Split-Nationen** aus **Geburtsjahrgangs-Statistik**
ableiten — mit echten Gewichten, über die ganze Zeitachse.

**Nutzer-Vorgabe: der Pool soll ungefähr so groß bleiben wie heute** (GER ~530 Vornamen,
GBR ~590). Es geht um **richtige Verteilung je Ära**, nicht um mehr Namen.

## Scope

**IN — 5 Nationen** (das `ERA_SPLIT_KEEP`-Set, vom Nutzer bestätigt, s. `analysis/README.md`):
**GER, GBR, USA, FRA, ITA.** Nur bei ihnen ist der native Vornamen-Trendwandel wirklich auffällig.

**OUT — die anderen 28 Split-Nationen werden FLACHGELEGT** (Nutzer-Entscheidung 2026-07-17).
Sie ziehen künftig in allen Ären aus dem vollen tiefen Pool (statt aus 10–17 `early`-Namen).
Kauft bewusst **milden Anachronismus** ein — bei diesen Nationen datieren die Namen kaum,
das fällt nicht auf. **Das ist eine Build-Änderung (`ERA_SPLIT_KEEP` in `build-names-v3.js`)
und damit Opus-Seite — nicht deine Aufgabe.** Hier nur zur Einordnung erwähnt.

**Nicht Teil dieses Pakets:** Nachnamen (datieren kaum, Kaggle reicht), die Cap-/Vertiefungs-Frage
(`analysis/pyramid-300kart-nation-demand.md` §7/§9), Paket H (Pyramiden-Fluss).

---

## Deliverable 1 — Ära-Granularität: erst messen, dann festlegen

**Frage des Nutzers:** Reichen 3 Fenster? Wären **Jahrfünfte** (z. B. Geburtsjahrgang 1930–1935)
besser?

**Der Trade, den du auflösen sollst:** Bei festem Poolbudget macht jede zusätzliche Ära die
einzelne dünner. GER `mid` hat heute eff 207; auf 15 Jahrfünfte à ~35 Namen aufgeteilt wäre
jedes Fenster bei eff ~18 — **so dünn wie der `early`-Stub, den wir reparieren.** Namen
**überlappen** aber über Kohorten (Michael steht in 1965, 1970 *und* 1975), die Union bleibt
also klein — nur die *Speicherung* dupliziert.

**Miss die tatsächliche Umschlagsrate** (z. B. Overlap/Jaccard der Top-50 zwischen
Geburtsjahrgängen im Abstand 5/10/20 Jahren, je Nation) und **empfiehl begründet** eine der
beiden Bauformen:

- **A – Fenster** (Vorschlag: ~8 Jahrzehnt-Kohorten, Geburtsjahrgänge ~1925–2005).
  Passt zur bestehenden `early/mid/modern`-Struktur. Einfach, aber mit Fenster-Brüchen.
- **B – Kurve je Name** ⭐ (Vorschlag des Auftraggebers): `[peak, breite, amplitude]` — 3 Zahlen
  statt N Gewichten. **Stufenlose** Ära-Auflösung ohne Fenster-Bruch (ein 1949 Geborener
  bekommt keine andere Verteilung als ein 1951er), kompakter als jede Fensterung.
  Namenskurven sind real ungefähr unimodal (steigen, gipfeln, fallen). **Prüfe die Fit-Güte**
  und nenne die Ausreißer (Revivals wie „Emma"/„Ida" sind bimodal — wie viele Männernamen
  betrifft das wirklich?). Wenn der Fit schlecht ist: sag es und nimm A.

**Der Jahrgangs-Versatz ist Pflicht:** Ein Fahrer, der 1955 debütiert, ist ~1930 geboren.
Gebraucht wird die **Geburtsjahrgangs-Verteilung**, nicht „Namen der 1950er". Dieselbe
Debüt-Shift-Logik nutzt `nation-data/build-nation-freq.js` bereits (+20 J). Debütalter im
Spiel: Junior-Einstieg 17–20 (`_makeJuniorDriver`), F1 später → nenne den von dir gewählten
Versatz (ggf. als Streuung statt fixer Zahl) und begründe ihn.

## Deliverable 2 — Die Tabellen (5 Nationen)

Vornamen-Verteilung je Nation über die Zeitachse, in der aus D1 empfohlenen Bauform,
**männlich only** (das Spiel hat keine Fahrerinnen-Generierung).

**Budget: Union ≈ heutige Poolgröße** (GER ~530, GBR ~590, USA ~590, FRA ~550, ITA ~590).
Nicht aufblähen — falls deine Quelle mehr hergibt, kappen und die Kappungsregel dokumentieren.

**Option, die du bewerten sollst:** Die Geburtsjahrgangs-Daten sind für diese 5 Nationen
**besser als Kaggle** — auch für `mid`/`modern`. Kaggles „mid" ist in Wahrheit ein
Gegenwarts-Schnappschuss, der ins mittlere Fenster gelegt wurde. **Empfiehl, ob die 5
Nationen ihre Vornamen künftig KOMPLETT aus der Jahrgangsstatistik ziehen sollten**
(statt nur `early`). Wenn ja: dann liefert D2 die volle Zeitachse und Kaggle wird für
Vornamen dieser 5 Nationen abgelöst. Nachnamen bleiben in jedem Fall Kaggle.

## Deliverable 3 — Rang → Häufigkeit (der Deutschland-Fall)

**Erwartete Quellenlage** (bitte verifizieren, nicht ungeprüft übernehmen):

| Nation | Quelle | Erwartung |
|---|---|---|
| USA | SSA baby names | **volle Counts ab 1880** — Goldstandard |
| FRA | INSEE „fichier des prénoms" | **volle Counts ab ~1900** |
| GBR | ONS (England & Wales) | Counts, aber oft nur **Top-100** je Jahr; Schottland separat (NRS) |
| ITA | ISTAT | Counts, aber vermutlich erst ab ~1999 → ältere Jahrgänge dünn |
| **GER** | **kein amtliches Register** — Destatis erhebt es nicht; GfdS/beliebte-vornamen.de liefern **Ranglisten** | **Rang-only** |

**Nutzer-Intuition (und sie ist richtig):** *„man geht eben davon aus, dass in der BRD der
Platz-17-Name eine bestimmte Häufigkeit haben sollte."* Das ist ein **Zipf-Fit** — und das
Projekt hat den Präzedenzfall: `capacity-and-compression.md` §1 nutzt ihn für FR-Nachnamen
(s ≈ 0,469).

**Auftrag:** Rang→Häufigkeit **nicht nach Gefühl**, sondern den Zipf-Exponenten auf den
Nationen **kalibrieren, wo echte Counts existieren** (US/FR/GB), und ihn dann auf die
Rang-only-Quellen (GER, ggf. ITA-Frühjahrgänge) anwenden. **Prüfe, ob der Exponent über die
Ären stabil ist** (Vornamen-Konzentration hat real abgenommen: 1930 war „Hans" ein viel
größerer Anteil als „Leon" 2005 — wenn s driftet, muss er ära-abhängig sein).
Dokumentiere s je Nation/Ära + den Kalibrierungs-Beleg.

## Deliverable 4 — Größen- & Wirkungs-Report

- Union-Poolgröße je Nation **vorher/nachher** (Budget-Nachweis).
- **Effektive Größe (Simpson `1/Σp²`) je Ära vorher/nachher** — das ist das Erfolgsmaß,
  nicht die Rohzahl. `early` GER muss von eff 15 spürbar hoch.
- Bytes: was kostet die Bauform in `data/names.js`?
- Plausibilitätsprobe: Top-5 Männernamen je Nation für die Geburtsjahrgänge ~1930, ~1955,
  ~1980, ~2005 — zur Sichtprüfung durch den Nutzer.

---

## Gewünschtes Output-Format

Ordner: `fable-deliverables/paketI-aera-vornamen/`

1. **`era-first-names.js`** — die Tabellen aus D2, paste-fertiges JS-Objektliteral,
   inline-fähig. Struktur nach der in D1 empfohlenen Bauform; falls **B (Kurve)**:
   `{ NAT: { name: [peak, breite, amplitude], … } }` + der Auswerte-Helfer als Pseudocode
   (Opus gießt ihn in `pickPooledName`).
2. **`METHODIK.md`** — D1-Messung + Empfehlung mit Begründung, Jahrgangs-Versatz,
   Zipf-Exponenten je Nation/Ära + Kalibrierungsbeleg, Quellen-URLs, Kappungsregel.
3. **`REPORT.md`** — D4.

## Randbedingungen / Fallen

- **IOC-Codes** exakt: `GER, GBR, USA, FRA, ITA`.
- **`curated-base-v2.js` ist die Quelle der kuratierten Basis** und wird von
  `build-names-v3.js` gelesen. **Nicht** `data/names.js` editieren — das ist **generiert**
  („NIE von Hand editieren"). Dein Deliverable ist Eingabe für den Build, kein Endprodukt.
- **Regionen beachten:** Die 5 Nationen haben Regionen-Splits (GBR: 92 % Region 0 / 8 %
  südasiatisch; FRA, USA, ITA ähnlich). Die Jahrgangsstatistik ist **national**, kennt die
  Regionen nicht. Sag klar, ob deine Tabelle für Region 0 gilt oder für die Nation gesamt —
  ein Fehler hier verschiebt die Gewichte still.
- **⚠️ `banFirst` ist NICHT das Thema dieses Pakets — nicht „reparieren".**
  Nutzer-Klarstellung 2026-07-17: Das Ziel ist **nicht**, türkische Vornamen aus Deutschland
  zu unterdrücken, sondern **ethnisch-kulturelle Kohärenz von Vor- UND Nachname**:
  „Mohammed Schneider" und „Sven Dogan" sollen nicht entstehen — **„Mehmet Dogan" schon**,
  wenn die Quelle die Paarung belegt. Das ist Sache des **Regionen-Mechanismus** (eigenes
  Paket, s. u.), nicht deiner Ära-Tabellen.
  **Für dich heißt das:** Liefere die Jahrgangs-Verteilung so, wie die Quelle sie zeigt —
  inklusive Einwanderungsnamen in den späten Kohorten — und **melde deren Anteil je Kohorte
  separat**, damit das Regionen-Paket damit arbeiten kann. **Nichts filtern, nichts
  unterdrücken, `banFirst` nicht anfassen.**
- **Golfstaaten-Expats bleiben ausgeschlossen** (SAU/UAE/QAT via `foreCap0`/`surCap0`) —
  falls du darüber stolperst: **so gewollt, nicht melden als Fehler.** Begründung des Nutzers:
  Die Kaggle-Aggregate der Golfstaaten sind expat-dominiert (indisch/pakistanisch), und diese
  Bevölkerung stellt keine Motorsport-Fahrer — „ein indischer Bauarbeiter wird eher in der
  UAE League Fußball spielen als sich ein Kart leisten". Betrifft dieses Paket ohnehin nicht
  (nur GER/GBR/USA/FRA/ITA).
- **Männlich only.** Wo die Quelle beide Geschlechter führt: filtern und die Regel nennen
  (unisex-Namen sind der Grenzfall).
- **Zukunft nach ~2005:** Das Spiel läuft über den Datenhorizont hinaus (Debüts 2030+).
  Sag, wie die letzte Kohorte fortgeschrieben wird (einfrieren? extrapolieren?) — **nicht
  raten, sondern die Regel benennen.**
- **Prosa vermeiden.** Wie bei F/G/H: Tabellen + Skript + METHODIK.

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
