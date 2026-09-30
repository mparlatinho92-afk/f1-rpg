# Konzept: Mehrstimmige Textbanken mit stilneutralem Qualitätsfilter

**Entstanden:** 28.09.2026, beim Paket P2 (Ticker Regen und rote Flagge).
**Gilt für:** jedes Paket, das viele Sätze, Meldungen oder Textvarianten erzeugt, also alle
Fable-Pakete, deren Ergebnis Sprache ist (z. B. P1 Strecken-Sprachregister, P4
Konflikt-Textbank, künftige Ticker- oder Kommentar-Pools).

## Ziel

1. **Viel Abwechslung** über eine Saison, ohne dass sich Formulierungen wiederholen.
2. **Verschiedene Schreibstile** in einem Pool, statt eines Einheitstons.
3. **Qualitätsfilter durch den Projekt-Agenten** (Claude Code), der Regelbrüche und
   Ära-Fehler entfernt, **ohne dass ein Stil verloren geht** und ohne dass Claudes
   eigener Stil den Pool dominiert.

## Warum überhaupt mehrere Stimmen

Ein einzelnes Modell wiederholt seine Muster: gleiche Satzeinstiege, gleiche
Rhythmen, Gedankenstriche, Ausrufezeichen. Das lässt sich innerhalb desselben Modells
kaum abstellen. Fremde Modelle haben eigene Handschriften. Die Mischung bringt die
Vielfalt, die ein Modell allein nicht liefert.

## Der Ablauf

1. **Briefing:** `P2-fremd-ki-briefing.md` in mehrere Fremd-KIs kopieren (Auftragskasten
   oben anpassen). Das Briefing enthält **keine** Claude-Zeilen, damit keine Stilansteckung
   entsteht. Gleiches Briefing für alle.
2. **Kandidaten ablegen:** je KI eine Datei `kandidaten/<pool>_<ära>/<name>.txt`.
3. **Stufe 1, Skript:** `filter_kandidaten.py` prüft nur harte Regeln (siehe unten).
4. **Stufe 2, Agent liest:** Der Agent liest `survivors_*.tsv` und streicht nur nach den
   Streichgründen unten. Streichungen als `<quelle>:<zeilennr>  Grund` in eine Datei,
   das Skript erneut mit `--streichen` laufen lassen.
5. **Auswahl:** Das Skript wählt Round-Robin über alle Quellen (Claude ist eine Quelle
   unter mehreren) und schreibt `auswahl_<pool>_<ära>.js` mit Quellenkommentar je Zeile.
6. **Einbau:** Claude Code fügt den Array in die Textbank ein, macht Test und `manage-v`.

## Die Regeln gegen Stil-Dominanz (verbindlich)

- **Der Filter kennt keinen Geschmack.** Er lehnt nur ab: falsche/gebeugte Platzhalter,
  Ziffern, verbotene Inhalte (Ursache, Wertung, Profiteur, echte Namen), Länge, Duplikate.
- **Der Agent streicht nur aus diesen Gründen:** (a) Regelbruch, den das Skript nicht
  erkennt (erfundene Ursache, Behauptung über Wertung), (b) Ära-Fehler (Anachronismus,
  falsches Register), (c) Grammatik, die den Platzhalter verbiegt. **Nie** wegen
  „klingt nicht wie mein Stil", „zu wild", „zu nüchtern".
- **Auswahl abwechselnd:** Jede Quelle kommt reihum dran. Claudes Anteil ist damit
  nicht größer als der jeder anderen Quelle.
- **Gleiche Deckel für alle:** Dieselbe Satzeröffnung höchstens 2-mal je Quelle. Das
  gilt auch für Claude, dessen Wiederholungen so nicht durchschlagen.
- **Ähnlichkeit wird reihum aufgelöst:** Bei fast gleichen Zeilen bleibt die, die zuerst
  an der Reihe war, und die Reihenfolge rotiert. Die kleinste Quelle beginnt.
- **Kein Stil geht verloren:** Jede Quelle mit Überlebenden bekommt mindestens eine
  Zeile ins Ergebnis, sobald das Ziel größer ist als die Zahl der Quellen (außer alle ihre
  Zeilen sind Dubletten bereits gewählter Zeilen).
- **Dominanz sichtbar machen:** Der Report zeigt Anteil je Quelle und einen
  Stilfingerabdruck (Länge, Anteil `!`, `?`, Gedankenstrich, häufigste Anfänge). Er
  dient nur der Kontrolle und lehnt nichts ab.
- **Warnungen sind keine Ablehnungen:** Anachronismus-Verdacht und „Register zu locker"
  werden nur markiert. Der Agent entscheidet beim Lesen.

## Umfang: kein Limit von 30

Mehr Zeilen sind mehr Vielfalt. `--n 0` (Standard) übernimmt alle nicht doppelten Zeilen. Die
Auswahl nach Quellen wirkt dann vor allem bei Dubletten, und der Report zeigt weiterhin
den Anteil je Quelle. Platzbedarf im Code ist ein eigenes Thema und hier nicht entscheidend.
Einen festen Umfang gibt es nur über `--n`, wenn ein Paket ausdrücklich eine Grenze braucht.

## Fahrer-Slot: nicht nur der Führende

Ereignisse sollen nicht immer nur den Führenden nennen. Deshalb gibt es zwei Platzhalter:

- `{leader}`: Zeile setzt den Führenden voraus („führt", „an der Spitze", „vorn").
- `{driver}`: Zeile passt auf jeden Fahrer. Der **Code** wählt pro Aufruf einen von sechs:
  Führender, amtierender Weltmeister (auch wer den Titel schon vorzeitig entschieden hat),
  Meisterschaftsführender, Polesitter, die zwei besten weiteren Fahrer nach aktuellem Tempo.
  Der Führende bekommt mindestens 50 % der Nennungen, der Rest verteilt sich gleich
  (Code: `fahrer-slot-snippet.js`).

Die Textquellen müssen nichts ersetzen: Sie schreiben weiter `{leader}`. Das Skript wandelt
jede Zeile, die den Führenden nicht voraussetzt, automatisch in `{driver}` um, und lehnt
`{driver}` in Zeilen ab, die „führt/Spitze/vorn" enthalten. Im Auswahl-JS steht am Ende
jeder Zeile `[L]` (leader-gebunden) oder `[D]` (fahrer-neutral).

Testlauf rain_arrives e76: 55 Zeilen `[L]`, 36 Zeilen `[D]`. Damit liegt der Führende bei
etwa 80 % der Nennungen. Wer mehr Namensvielfalt will, braucht mehr `[D]`-Zeilen, also im
Briefing mehr Sätze, die den Fahrer nur beschreiben und nicht als Führenden voraussetzen.

## Auf ein anderes Paket übertragen

1. In `filter_kandidaten.py` **einen Eintrag in `POOLS`** ergänzen: Emoji, erlaubte
   Platzhalter, ein Regex für verbotene Inhalte des Pools. Bei neuem Zeitschema die
   Ären in `ERA_WARN` anpassen. Die Logik bleibt unverändert.
2. Das Briefing als Vorlage nehmen: Auftragskasten, harte Regeln, Platzhalter-Tabelle,
   Pool-Beschreibung und Zusatzregel des neuen Pools austauschen. Der Satz „Schreibe in
   deinem eigenen Ton" und das Ausgabeformat bleiben.
3. Zuerst **einen Pool als Test** fahren. Erst wenn Ausfallquote und Neuheit stimmen,
   die restlichen Pools nachziehen.

**Nicht übertragbar:** Pakete, deren Ergebnis Zahlen, Logik oder Wahrscheinlichkeiten sind
(Balancing, Engine). Dort gibt es nichts, was sich stilistisch mischen ließe.

## Grenzen (ehrlich)

- Die Ähnlichkeitsprüfung ist rein wortbasiert. Inhaltlich gleiche Aussagen in anderen
  Worten erkennt sie nicht, das muss der Agent beim Lesen sehen.
- Die Liste echter Namen ist eine Sperrliste und nie vollständig. Der Agent liest
  trotzdem auf erfundene Personen, Rennen, Ereignisse.
- Ära-Warnlisten sind Stichproben. Sie ersetzen nicht das Lesen auf Ton und Wortmaterial.
- Ob eine bestimmte Fremd-KI überhaupt brauchbar ist, zeigt erst der Testlauf. Die
  Auswahl der KIs ist nicht festgelegt. Die Vergleichsblogs sind keine unabhängigen Tests.
- Was du in ein Fremdmodell kopierst, geht an dessen Anbieter. Das Briefing enthält
  deshalb kein Projektwissen außer dem, was für den Pool nötig ist.

## Erkenntnisse aus dem ersten Testlauf (rain_arrives, e76, 5 Fremd-KIs)

- **Harte Regeln:** 0 von 199 Fremdzeilen abgelehnt. Alle fünf haben Platzhalter, Ziffern und
  Namen sauber eingehalten. Der mechanische Filter ist nötig, fängt bei guten Modellen aber wenig.
- **Die Agenten-Lesung hat 19 Zeilen gestrichen (ca. 10 %)**, alle wegen Regel 1 (erfundene
  Intensität, Ausdehnung, Orte, Duelle, Zustände des Führenden), Grammatik ("auf Runde") oder
  Ära ("Curbs"). Das sind genau die Fehler, die ein Skript nicht sieht. Sie stehen jetzt im
  Briefing, damit der nächste Durchlauf weniger davon produziert.
- **Stilfingerabdruck:** Die Stimmen unterscheiden sich messbar (Länge, `!`, Gedankenstrich).
  Claude fiel mit 87 % Ausrufezeichen auf, die Fremdquellen lagen bei 0 bis 12 %. Das bestätigt
  die Ausgangsannahme: Claudes Zeilen wiederholen ihr Muster.
- **Auswahl-Logik nachgebessert:** Bei begrenztem Ziel gleicher Anteil je Quelle (exakt ±1)
  und Mischung mit und ohne Namen (Ziel 50 %), damit nicht eine Quelle oder ein Zeilentyp überwiegt.
- **Übertragen auf andere Pakete:** Die Streichgründe der Agenten-Lesung (Intensität, Ort,
  Zustand, Ära, Grammatik) gehören in jedes Briefing als „Regel 2", weil sie überall gelten,
  wo das Spiel nur wenige Werte übergibt.

## Dateien

| Datei | Zweck |
|---|---|
| `P2-fremd-ki-briefing.md` | Briefing zum Kopieren in jede Fremd-KI |
| `filter_kandidaten.py` | Stufe 1 (harte Regeln) und Auswahl ohne Dominanz |
| `paket1b-ticker-wetter.js` | Claudes Quelle (wird vom Skript per `--claude-js` gelesen) |
| `fahrer-slot-snippet.js` | Code-Variable `{driver}`: gewichtete Fahrerauswahl (Führender ≥ 50 %) |
| `ergebnis_rain_arrives_e76/` | erster Testlauf: Kandidaten, Streichungen, Report, Auswahl |
