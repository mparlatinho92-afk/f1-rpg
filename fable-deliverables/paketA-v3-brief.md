# Paket A v3 — Namens-Datenausbau (Brief für Fable)

## Kontext — was seit v2 passiert ist
- Deine Pools (Paket A v2) sind **integriert & live** (v0.9.14.32). `generateDriver` **und** die
  Junior-Welt (F3/F2, später Kart-Serien) ziehen Namen über `pickPooledName(nation, year)`:
  Vor+Nachname aus **derselben Region**, ära-sensibel, `minYear`-Diaspora, Nachnamen-Dedup.
- **Laufzeit-Quelle ist jetzt `data/names.js`** — NICHT mehr `fable-deliverables/paketA-name-pools.js`.
  Änderungen MÜSSEN in `data/names.js` landen; `manage-v` inliniert nur `data/*.js` in den Monolithen.
  Die Deliverable-Kopie ist ab deiner ersten Änderung veraltet (bewusst syncen oder ignorieren).

## Ziel (Nutzer-Vision)
Die **Namenswelt = Galaxie**, die Motorsport-Praxis des Spiels nur die **Erde**:
F1 → mehrere F4/F3/F2-Serien → Masse an Kart-Serien, unbekannte Fluktuation pro Saison.
Über Jahrzehnte und tausende Fahrer soll die Namensvielfalt von der Realität ununterscheidbar sein —
**bevor Duplikate auftreten, sind die „Erdlinge" (Fahrer) längst durch.** Der Long-Tail muss
praktisch unerschöpflich wirken.

## Aufgabe
1. **Volle Datenlast integrieren.** Nimm die kompletten BigQuery-Aggregate (Top-400+ Vor- UND
   Nachnamen je Nation, `fable-deliverables/name-data/`), nicht nur die kuratierte Spitze.
   Größenbudget: `data/names.js` darf auf **~200–400 KB** wachsen (heute 76 KB) — ein Bruchteil des
   5,5-MB-Monolithen. **Keine MB.** Falls nötig: Namen nach Häufigkeit absteigend sortiert,
   Gewicht aus Rang/Count statt der 5 groben Buckets.
2. **Echte Häufigkeit aus der count-Spalte nutzen.** `weightedPick` und `pickNameRegion` summieren
   **beliebige positive Gewichte** — du bist NICHT auf 1–5 beschränkt. Setz die normalisierten echten
   Counts direkt als Gewicht ein (Promille oder log-skaliert). Die letzte count-Spalte ist die
   ära-unabhängige Häufigkeits-Wahrheit.
3. **Gegen die Realität kalibrieren.** Ist-Zustand klumpt: ~32 „Smith", 16 „Johnson", nur 1 „Müller"
   über 1000 Saisons. Teils real (Smith = #1 in GBR *und* USA, spannt 400 M+ Anglophone; Müller nur
   GER + teilt den Kopf mit Schmidt; GER wird von `pickNationByDecade` seltener gezogen). Entscheide
   bewusst, wie hart der Kopf klumpen darf — Stellschraube ist der **Gewichts-Exponent**, nicht die
   Datenmenge. Ziel: realistische Relationen im Kopf, Vielfalt im Tail.
4. **Kleine Nationen füllen:** AUS, NZL, THA, MON, VEN, ZIM, CHN und MAR-Vornamen — soweit Daten
   existieren, sonst wissensbasiert erweitern (heute teils <15 Nachnamen → zu schnell erschöpft).
5. **Schema strikt erhalten** (die Integration hängt exakt daran — nichts umbenennen/umstrukturieren):
   - `NAME_POOLS_BY_NATION[IOC] = { regions: [ { w, minYear?, first: [[n,g],…] | {early,mid,modern}, last: [[n,g],…] } ] }`
   - `NATION_NAME_FALLBACK[IOC] = IOC` — pool-lose Nation → kulturell nächster Pool; nie markant falsch, sonst `'INT'`
   - `NAME_TAILS_BY_NATION[IOC] = [ { r, first:[…], last:[…] } ]` — Merge: `last` → `regions[r].last` (Gewicht 1); `first` → NUR mid+modern
   - Ära-Fenster: early <1975, mid 1975–2009, modern ≥2010. **early bleibt kuratiert** (Datensatz gegenwartslastig).
   - **Kernregel bleibt:** Vor+Nachname aus DERSELBEN Region (kein „Jacques Müller").
6. **Validierungs-Loop:** Im Spiel gibt es jetzt `exportNameStats(samples, year, download)`
   (Browser-Konsole) → pro Nation die **tatsächliche** Namens-Häufigkeit als JSON + `_nations`-Frequenz.
   Nutze es nach deinem Ausbau, um die reale Ausgabe zu prüfen: Kopf-Klumpung, Tail-Abdeckung,
   Smith:Müller-Ratio. (Aufruf z.B. `exportNameStats(20000, 2024, true)` lädt eine JSON-Datei.)

## Zusatzaufgabe — Nationen-Frequenz datengetrieben aus großem Motorsport-Pool
Getrennt von den Namen: **wie oft stellt welche Nationalität einen Fahrer** — je Ära.

**Leitprinzip (der Kern der Aufgabe):** Diese Verteilung darf NICHT aus kleinen Stichproben oder
Einzelbeobachtungen kommen. F1 pro Dekade sind nur ~100–135 Fahrer — da verzerrt jeder Einzelne
(Rikky von Opel/Liechtenstein 1973 macht LIE zu „2 % der 70er"; Albon allein = THA 5 % in den 2020ern).
Nur ein **großer Pool** (zehntausende Fahrer) glättet das automatisch und liefert die echte nationale
Motorsport-Dichte. Bestimme die Verteilung **datengetrieben, nie per Hand/Auge** — genau wie die Namen.

- **Quelle:** ein großer Motorsport-Fahrer-Datensatz über ALLE Serien und Ären, mit Nationalität
  (Driver-Database-Klasse ~100k+ Fahrer, Wikipedia-„Rennfahrer nach Nation"-Kategorien o.ä.). Groß
  genug, dass Einzelfälle im Rauschen verschwinden. Beschaffung ist ein externer/BigQuery-/Scrape-Job
  wie bei den Namen — es gibt KEINE brauchbaren Motorsport-Nationalitätsdaten im Repo.
- **KRITISCHE Abgrenzung:** NICHT die Namens-/Bevölkerungs-BigQuery als Quelle recyceln. Bevölkerung ≠
  Motorsport — sonst dominieren China/Indien durch schiere Einwohnerzahl trotz fehlender Renntradition.
  Es braucht **Motorsport-Beteiligung**, eine andere Datenquelle als die Namen.
- **Ergebnis:** eine robuste **Nationen-Verteilung je Ära (Dekade)**, aus der F1 und Junior nur
  **gefilterte Ausschnitte** sind (Selektion nach oben = Trichter). Keine handgepflegten Nationen-Listen
  je Ebene mehr — eine Datenbasis, mehrere Ausschnitte.
- **Zielstrukturen:** ersetzt langfristig `DECADE_NATION_POOLS` (index.html, F1-Ebene) UND speist die
  Junior-Welt (`JUNIOR_NATIONS`, aktuell 15 Nationen gleichgewichtet). Konkretes Format (Ära × Nation ×
  Gewicht) mit Opus bei der Integration klären.

**Interim-Hinweis:** Opus hat `DECADE_NATION_POOLS` 2000–2020 aus SEASON_DATA notdürftig kalibriert
(EST-Zähl-Artefakt entfernt) — aber das ist selbst nur kleine F1-Stichprobe = **Interim, keine
Referenz-Wahrheit**. Es fliegt raus, sobald deine große Datenlage steht.

## Nicht dein Scope
- Code / Pick-Logik (`generateDriver`, `pickPooledName`, `ensureNamePoolsMerged`, `pickNameRegion`) — Opus.
- Integration der fertigen Nationen-Verteilung in die index.html-Strukturen — Opus (du lieferst die Daten).
- In-Game-Nationenstatistik-Panel — Opus-Folgeschritt NACH dir.
