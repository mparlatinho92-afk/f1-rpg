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

## Zusatzaufgabe — Nationen-Frequenz für die Junior/Kart-Ebene
Getrennt von den Namen gibt es die Frage, **wie oft welche Nationalität** einen Fahrer stellt.
- **F1-Ebene ist bereits erledigt (Opus):** `DECADE_NATION_POOLS` (index.html) — die modernen Dekaden
  (2000/2010/2020) wurden aus SEASON_DATA-Fahrer-Nationalitäten neu aggregiert (F1-realistisch:
  GBR 17 %, GER 4,9 %, EST-Spike weg). Das ist die **F1-Spitze** und bewusst eng.
- **Deine Aufgabe = die breite Basis unten:** F1 ist nur ~15 Nationen. Karts/F4/F3 haben eine viel
  **breitere** Nationen-Vielfalt (Nordeuropa, Osteuropa, Asien, kleine Nationen). Liefere eine
  **breite Nationen-Frequenz-Verteilung für die Junior-Ebene** (aus europäischer Kart-/Open-Wheeler-
  Historie, soweit Datenquelle beschaffbar — analog zu deinem Namens-BigQuery-Ansatz). Ziel: die
  Junior-Welt (`JUNIOR_NATIONS` in index.html, aktuell 15 Nationen gleichgewichtet) bekommt eine
  realistische, breite Verteilung, die sich Richtung F1 verengt (Trichter). Quelle klären: es gibt
  KEINE Kart-Nationalitätsdaten im Repo — das ist ein externer/BigQuery-Job wie bei den Namen.

## Nicht dein Scope
- Code / Pick-Logik (`generateDriver`, `pickPooledName`, `ensureNamePoolsMerged`, `pickNameRegion`) — Opus.
- F1-Ebene `DECADE_NATION_POOLS` (2000–2020 bereits Opus-erledigt) — nur die **Junior/Kart-Basis** ist deins.
- In-Game-Nationenstatistik-Panel — Opus-Folgeschritt NACH dir.
