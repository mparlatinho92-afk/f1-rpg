# F1 RPG – Elo & Pace-System Roadmap

**Ziel:** Fahrerpace empirisch aus echten Renndaten ableiten, von Wagenpace trennen,
und die Simulation dynamisch machen. Das ist das Kern-Gameplay-Problem.

Status: `○` = offen · `◑` = teilweise · `✓` = fertig

---

## Übersicht: Die vier Schichten

```
[0. Pre-1950 Anker]  manuelle Startwerte für ~15 Übergangsfahrer
     ↓
[1. Rohdaten]  formula1points.com (1950+) + goldenera.fi (1930–1949) → offline JSON
     ↓
[2. Elo-Skript]  Node.js: chronologische Elo-Berechnung (offline)
     ↓
[3. Pace-Mapping]  Elo → normalisierte Werte → SEASON_DATA aktualisieren
     ↓
[4. Spiel-Engine]  dynamische Team-/Fahrerpace, Alterskurve, DNF-System
```

---

## Phase 0 – Pre-1950 Datenbasis (1930–1949)

**Ziel:** Das Elo-System startet 1930 – alle Fahrer beginnen bei 1500 und bauen
ihr Rating organisch auf. Kein manuelles Anker-JSON nötig.

**Warum 1930 als Startpunkt:**
- Kein Fahrer aus der Pionierzeit (1894–1929) war noch 1950 WM-aktiv
- Ab 1930 fahren die direkten Vorläufer der WM-Generation (Fagioli, Chiron, Nuvolari...)
- Fagioli dominiert 1932–1935 → Elo wächst natürlich auf ~1650
- Farina debütiert 1937 → 13 Jahre Aufbau bis 1950
- Prince Bira debütiert ~1935 → keine manuelle Schätzung nötig
- Alle die erst nach 1930 debütieren: starten in ihrem Debütjahr mit 1500

**Einziger Sonderfall – Fangio:**
Dominierte 1947–1949 die *Argentine Temporada*, kam aber erst 1948 nach Europa.
Ohne argentinische Daten hätte er nur 2 Jahre Elo-Aufbau statt 8. Lösung: kleine
manuelle CSV für ~15 argentinische Rennen (1947–1949).

### 0a – Europäische GPs 1930–1949 scrapen
- `○` Skript `tests/scrape-goldenera.js` (Node + cheerio – statisches HTML, kein Playwright)
- `○` Quellen:
  - `https://www.goldenera.fi/gpw2.htm` (1919–1933)
  - `https://www.goldenera.fi/gpw3.htm` (1934–1949)
- `○` Pro Rennen extrahieren: Datum, Name, Sieger + verfügbare Platzierungen
- `○` Output: `tests/pre1950-data/europe-YYYY.json`
- **Hinweis:** goldenera.fi enthält oft nur Sieger + Top-3, keine vollständigen Grids.
  Für Multi-Gegner-Elo: vorhandene Platzierungen nutzen, fehlende ignorieren (K-Faktor
  entsprechend skalieren: weniger Duelle = kleineres K).

### 0a.1 – Offene Temporada-Slugs (4 unauflösbare Lokalfahrer)
Alle 4 haben nur 1 Renneinsatz und minimalen ELO-Einfluss.
Vorname recherchieren → in `SLUG_ALIASES` von `calculate-elo.js` eintragen.

| Slug | Name im Datensatz | Rennen | Jahr |
|---|---|---|---|
| `ncataudella` | "N.Cataudella" | 500 Millas de Rafaela, P9 | 1950 |
| `fpiombo` | "F.Piombo" | 500 Millas de Rafaela, P10 | 1950 |
| `valentin` | "Valentin" | Boa Vista, P2 | 1951 |
| `d-bazet` | "D. Bazet" | Gran Premio de Montevideo, P12 | 1952 |

---

### 0b – Argentine Temporada 1947–1949 (manuell, einmalig)
- `○` Datei `tests/pre1950-data/argentina-temporada.json` von Hand anlegen
- `○` ~15 Rennen, Fahrer: Fangio, Gonzalez, Galvez, Villoresi (als Europafahrer)
- `○` Quellen: Wikipedia-Seiten der einzelnen Temporada-Saisons
- `○` Gleiche JSON-Struktur wie Phase 1 (round, entries, pos, dnf)

### 0c – Elo-Berechnung für 1930–1949
- `○` `tests/calculate-elo.js` startet Schleife ab 1930 (vor der 1950-Schleife)
- `○` Alle Fahrer mit Debüt ≤ 1930 starten mit Elo 1500
- `○` Fahrer die später debütieren: erster Auftritt = Elo 1500
- `○` K-Faktor pre-1950: 20 statt 32/16 (weniger Rennen → langsamere Bewegung)
- `○` Kriegspause 1940–1946: Elo einfrieren (kein Abbau, kein Wachstum)
- `○` Output fließt direkt in Phase 2 als Startwerte für 1950

---

## Phase 1 – Datenbasis 1950+ (Offline, einmalig)

**Ziel:** Rohdaten von formula1points.com sauber und strukturiert lokal speichern.

### 1a – Playwright-Scraper
- `○` Node-Skript `tests/scrape-f1points.js` mit Playwright
- `○` Seiten die zu scrapen sind:
  - Saison-Ergebnisse (normalisierte Punkte, modernes 25-Pkt-System)
  - Head-to-Head Qualifying-Duelle (Teamkollegen-Vergleich, % Zeitabstand)
- `○` Pausen (5s pro Saison), robots.txt respektieren (`/ajax_*` gemieden)
- `○` Output pro Saison: `tests/f1points-data/YYYY.json`

### 1b – Datenstruktur pro Saison-JSON
```json
{
  "year": 1994,
  "races": [
    {
      "round": 1,
      "name": "Brazilian GP",
      "entries": [
        {
          "driver": "michael-schumacher",
          "team": "benetton",
          "pos": 1,
          "pts_normalized": 25,
          "dnf": false,
          "dnf_reason": null
        }
      ]
    }
  ],
  "quali_duels": [
    {
      "driver_a": "michael-schumacher",
      "driver_b": "johnny-herbert",
      "team": "benetton",
      "a_wins": 15,
      "b_wins": 1,
      "avg_gap_pct": 0.8
    }
  ]
}
```

### 1c – DNF-Klassifikation
- `○` Beim Scraping DNF-Grund aus der Tabelle extrahieren
- `○` Drei Kategorien:
  - `"tech"` – Motor, Getriebe, Hydraulik, Aufhängung → **Elo-neutral**
  - `"driver"` – Unfall, Abflug, Eigenkollision → **Elo-Malus**
  - `"collision"` – Fremdeinwirkung → **50% Malus**

---

## Phase 2 – Elo-Berechnung (Offline-Skript)

**Ziel:** Aus den Rohdaten ein chronologisches Elo-Rating für jeden Fahrer ableiten.

### 2a – Kern-Algorithmus (`tests/calculate-elo.js`)
- `○` Startjahr: 1950 (F1-Weltmeisterschaft) – pre-1950 optional später
- `○` Startwert: alle Fahrer beginnen mit Elo = 1500
- `○` Multi-Gegner-Format: 1 Rennen = N×(N-1)/2 implizite 1v1-Duelle
  - Fahrer auf Platz 5 schlägt alle hinter ihm, verliert gegen alle vor ihm
- `○` Update-Formel pro Duell:
  ```
  E = 1 / (1 + 10^((Rb - Ra) / 400))
  K = basis_K × dnf_faktor × feld_größen_faktor
  Ra_neu = Ra + K × (S - E)
  ```
- `○` K-Faktor je Kontext:
  - Quali-Teamduell: K=32 (reiner Fahrervergleich, kein Auto-Einfluss)
  - Renn-Ergebnis: K=16 (Auto mitverantwortlich)
  - DNF (Tech): K=0 (neutral)
  - DNF (Driver): K=16, S=0 (Malus)
  - DNF (Collision): K=8, S=0

### 2b – Elo-Trennung: Race-Elo vs. Quali-Elo
- `○` Zwei separate Elo-Werte pro Fahrer:
  - `race_elo` – aus Rennplatzierungen
  - `quali_elo` – aus Teamkollegen-Quali-Duellen
- `○` Kombiniert zu `driver_elo` = `race_elo * 0.5 + quali_elo * 0.5`
- Warum: Alesi hat schlechten Race-Elo (Technik-Ausfälle), aber guten Quali-Elo

### 2c – Output (`tests/elo_ratings.json`)
```json
{
  "jean-alesi": {
    "1989": { "race_elo": 1520, "quali_elo": 1590, "driver_elo": 1555, "age": 25 },
    "1994": { "race_elo": 1580, "quali_elo": 1660, "driver_elo": 1620, "age": 30 }
  }
}
```

---

## Phase 3 – Pace-Mapping

**Ziel:** Elo-Zahlen in das 1–100 Spielsystem übersetzen und SEASON_DATA erneuern.

### ⚠️ Kernproblem: ELO darf Pace nicht direkt ersetzen

**Warum das Gameplay-kritisch ist:**
ELO konvergiert erst nach vielen Rennen. Fahrer mit wenigen Einsätzen haben
artificell niedrige Werte – nicht weil sie schlecht sind, sondern weil das System
zu wenig Daten hat. Würde man ELO direkt als Pace nehmen:
- Einmal-Starter und DNF-Opfer landen fälschlicherweise bei ~58 Pace
- Etablierte Top-Fahrer akkumulieren ELO über Jahrzehnte → Pace driftet immer weiter
  auseinander → **Starke werden stärker, Schwache chancenlos → Gameplay kaputt**

**Gewählter Ansatz: Option B + C**

**Option B** – bereits implementiert: Grid-ELO (race K=16) + Teamkollegen-Quali-ELO (K=32)
kombiniert zu `driver_elo = race_elo × 0.5 + quali_elo × 0.5`. Quali ist per Definition
Teamkollegen-only → zieht den kombinierten Wert bereits in Richtung Auto-Trennung.

**Option C** – Post-hoc Auto-Normalisierung beim Pace-Mapping:
```
team_avg_elo[team][year] = Ø(driver_elo aller Teamkollegen im Jahr)
relative_elo[driver][year] = driver_elo[year] - team_avg_elo[team][year]
```
Schumacher 2002: driver_elo=1875, Barrichello=1720, team_avg=1797 → relative=+78
Hamilton 2019:   driver_elo=1985, Bottas=1750,     team_avg=1867 → relative=+118

Das relative Delta ist dann der **echte Fahreranteil** – unabhängig vom Auto.

**Komplette Mapping-Pipeline (Phase 3):**
```
// Schritt 1: relatives ELO berechnen
relative_elo = driver_elo - team_avg_elo

// Schritt 2: normalisieren auf 58–98
//   ELO_REL_MIN / ELO_REL_MAX = Perzentile 5% / 95% aller relativen Werte
elo_pace = ((relative_elo - ELO_REL_MIN) / (ELO_REL_MAX - ELO_REL_MIN)) × 40 + 58

// Schritt 3: Reliability-Dämpfung (Rookie-Schutz)
reliability = min(1.0, race_count / 20)
pace = elo_pace × reliability + team_avg_pace × (1 - reliability)

// Schritt 4: ELO-Velocity Bonus (Phase 2e)
trend_bonus = clamp((elo[year] - elo[year-2]) / MAX_VELOCITY, -0.05, +0.10)
pace = pace + trend_bonus × reliability
```

Effekt: Barrichello 2002 kommt nicht auf 58er-Pace nur weil er hinter Schumacher
fuhr – sein relatives Delta bestimmt seinen Platz in der 58–98-Skala.

**Noch offen:** Fahrer ohne Teamkollegen (Einzel-Einschreiber) → Saison-Ø als Fallback.

---

### 3a – Normalisierung (normalize-elo.js)
- `○` Skript `tests/normalize-elo.js`
- `○` Berechnet `relative_elo` pro Fahrer pro Jahr (driver_elo − team_avg_elo)
- `○` Normalisiert auf 58–98 via Perzentile 5%/95% des relativen ELO-Pools
- `○` Wendet Reliability-Dämpfung + Velocity-Bonus an
- `○` Output: `tests/pace_ratings.json` → { slug: { year: { pace, potential_pace } } }

### 3b – Alters-Kurve
- `○` Drei Phasen pro Fahrer:
  - **Aufbau** (< Zenit): `currentPace = potentialPace * (age / peak_age)^0.4`
  - **Zenit** (~28–32 je nach Fahrer): `currentPace ≈ potentialPace`
  - **Abbau** (> Zenit): `currentPace = potentialPace * (1 - abbau_rate * Jahre_nach_Zenit)`
    - Normalfahrer: 1.5%/Jahr; Alonso-Typ: 0.8%/Jahr

### 3c – Potential vs. Current
- `potentialPace` = bestes `relative_elo` des Fahrers über die gesamte Karriere (eingefroren)
- `currentPace` = saison-spezifischer Wert (relatives ELO + Alterskurve)
- SEASON_DATA erhält neue Spalte `potentialPace` neben `pace` (= currentPace)

### 3d – Team-Pace (carSpeed) aus ELO ableiten
- `○` `team_avg_elo[year]` bereits als Nebenprodukt von Option C berechnet
- `○` Normalisiert auf carSpeed-Skala → `team.carSpeed` pro Saison datenbasiert
- `○` Kein manuelles Schätzen mehr nötig

---

## Phase 4 – Spiel-Engine

**Ziel:** Das Gelernte ins laufende Spiel integrieren. Das ändert Gameplay direkt.

### 4a – currentPace pro Saison aktiv nutzen
- `○` `simulateRace` nutzt `driver.currentPace` statt `driver.pace`
- `○` `potentialPace` bleibt anzeigbar im Fahrerprofil (UI: "Potenzial")
- `○` Rohdiamant-Anzeige: `currentPace < potentialPace - 15` → Badge "Rohdiamant"

### 4b – Saisonübergang: Fahrer-Entwicklung
- `○` In `startNewSeason()` / `processSeasonTransition()`:
  ```
  delta = (potentialPace - currentPace) * lernrate
  currentPace += min(delta, MAX_GAIN_PER_SEASON)  // max +8 pro Saison
  wenn age > peak_age: currentPace -= abbau_rate   // max -4 pro Saison
  ```
- `○` Rohdiamanten (< 24 Jahre, großer gap): Lernrate 1.8×
- `○` Geringer Formzuwachs wenn Fahrer selten fährt (< 5 Rennen)

### 4c – Team-Pace: Jährlicher Chassis-Würfel
- `○` In `startNewSeason()` pro Team:
  ```
  würfel → Geniestreich (10%): +8 carSpeed
          Evolution   (70%): +1 bis +3 carSpeed
          Flop        (20%): -4 bis -8 carSpeed, reliability sinkt
  ```
- `○` Diminishing Returns: je höher carSpeed, desto kleiner max. Gewinn
  - carSpeed > 90: max +2 bei Geniestreich
  - carSpeed < 70: max +10 bei Geniestreich

### 4d – Regel-Reset (Era Reset)
- `○` Tabelle der Reset-Jahre (historisch und prozedural):
  ```js
  const ERA_RESETS = [1961, 1966, 1968, 1983, 1989, 1994, 1998, 2014, 2022];
  // ab 2022: alle 6±2 Jahre zufällig ein weiterer Reset
  ```
- `○` Bei Reset-Jahr: `team.carSpeed *= 0.8` für alle Teams → neu gewürfelt
- `○` Effekt: Dominanz-Teams verlieren Vorsprung, Karten neu gemischt

### 4e – Anti-Snowball
- `○` Aufhol-Bonus: Teams auf Platz 7–10 WM: Chassis-Würfel hat +10% Erfolgsbonus
- `○` Dominanz-Malus: Team gewinnt 3× WM in Folge: Würfel hat -15% Bonus
- `○` Strauchelnde Top-Teams (2× außerhalb Top-3): lösen "Nachwuchs-Modus" aus
  - Generiert 1–2 Rookie-Kandidaten mit `potentialPace 92–98`, `currentPace 58–64`

### 4f – DNF im Renn-Log speichern
- `○` `race.results` bekommt Feld `dnfReason: 'tech' | 'driver' | 'collision' | null`
- `○` Im Saisonverlauf (renderResultsMatrix): tech-DNF anders einfärben als Fahler-DNF
- `○` Basis für spätere Statistik: "Technik-Ausfälle pro Team"

### 4g – Adaptations-Malus für Quereinsteiger
- `○` Fahrer aus anderen Serien erhalten beim F1-Einstieg einen temporären Pace-Abzug
- `○` `adaptFactor` (0.65–0.97) multipliziert `currentPace` in Saison 1–2
- `○` Faktor wächst pro Saison bis 1.0 (Anpassung abgeschlossen)
- `○` Faktor ist zufällig innerhalb serienbezogener Bänder:
  ```
  Formel 2 / Formel 3:  0.92 ± 0.03  (technische Nähe, enge Varianz)
  IndyCar / Champ Car:  0.84 ± 0.06  (andere Reifenkonzepte, mittlere Varianz)
  WEC / GT / Sportwagen: 0.78 ± 0.10 (andere Fahrstrategie, breite Varianz)
  Tourenwagen (BTCC etc.): 0.72 ± 0.10
  Rally / TC:           0.65 ± 0.15  (komplett anderer Renntyp, größte Varianz)
  ```
- `○` Breite der Varianz ist faktisch begründet (technische Nähe), Mittelwert ist empirisch
  aus historischen Quereinsteigern kalibrierbar (Montoya, Bourdais, Andretti etc.)
- `○` Bewusste Entscheidung: Spekulation ist Gameplay – ein Rally-Star in F1 ist ein Gamble

---

## Phase 5 – Multi-Serien-Elo (Langfrist, nach v1.0)

**Ziel:** Jede simulierte Rennserie hat ihren eigenen Elo-Pool. Transfer zwischen Serien
wird über empirische Faktoren aus historischen Querfahrern kalibriert – kein manuelles Schätzen.

### Kernprinzip: Shared-Driver-Kalibrierung
- Fahrer die in zwei Serien aktiv waren = Kalibrierungsanker (wie FIDE-Normierung)
- `transfer_factor(A→B)` = Ø(Elo_B_Jahr1 / Elo_A_peak) über alle Querfahrer
- Breite der Verteilung = Varianz des `adaptFactor` in Phase 4g
- Je mehr Querfahrer, desto enger die Schätzung

### Warum nicht Wagenleistung als Proxy:
- Elo misst relative Performance (Fahrer vs. Feld), nicht absolute Rundenzeiten
- 170PS F4 vs. 1000PS F1: Fahreranteil am Duell-Ergebnis bleibt ähnlich
- Leistung wäre Proxy für das was Querfahrer-Daten direkt messen

### Abgrenzung: Multi-Serien-Simulation ≠ dieses Projekt
- Ferrari in F1 UND WEC gleichzeitig managen = anderes Spiel
- Phase 5 betrifft nur Elo-Transfer beim Serienwechsel, nicht parallele Simulation
- Turismo Carretera, Rally etc. bleiben außen (zu wenig F1-Overlap für valide Faktoren)

---

## Abhängigkeiten & Reihenfolge

```
Phase 0a (Temporada 1946–1952, teamdan.com) ✓ scraper fertig
Phase 0b (goldenera.fi 1930–1940)           ✓ scraper fertig
Phase 0c (silhouet.com 1946–1949)           ✓ scraper fertig
  └─→ Phase 2 (Elo-Berechnung)              ✓ calculate-elo.js fertig

Phase 1 (F1DB_RESULTS aus HTML, 1950–2024)  ✓ direkt eingebaut in Phase 2
  └─→ Phase 2                               ✓ elo_ratings.json erzeugt
        └─→ Phase 3 (Mapping, normalize-elo.js)
              └─→ Phase 4a+b (Fahrer-Entwicklung im Spiel)
              └─→ Phase 4c+d (Team-Chassis-Würfel + Era Reset)
              └─→ Phase 4g (Adaptations-Malus)

Phase 4e (Anti-Snowball) → unabhängig
Phase 4f (DNF-Log)       → unabhängig, kann sofort gebaut werden
Phase 5  (Multi-Serien)  → nach v1.0, eigenes Konzept
```

---

## DNF-Klassifikation (festgelegt)

| Status-String | Typ | Elo-Effekt |
|---|---|---|
| `Spun off`, `Spin off` | `driver` | K=16, S=0 |
| `Collision`, `Contact`, `Collided` | `collision` | K=8, S=0 |
| `Accident`, `Retired`, `Damage` | `unknown` | K=0 (neutral) |
| `Engine`, `Gearbox`, `Brake`, ... | `tech` | K=0 (neutral) |
| `Disqualified` | `dsq` | K=0 (ignoriert) |

**Begründung:** `Accident` ist ambig (Senna Imola 1994 = Lenkungsversagen; Schumacher
Silverstone 1999 = Bremsversagen). Lieber zu konservativ als Fahrer für Technikdefekte bestrafen.

**Kollisions-Strafe bei Massenkarambolagen (aktuell implementiert):**
```
K_collision = (K_RACE × 0.5) / Anzahl_Collision-DNFs_auf_derselben_Runde
```
Gruppierung nach `laps`-Feld (abgeschlossene Runden) – nicht nach Gesamtrennen,
damit zwei unabhängige Unfälle in Runde 1 und Runde 45 nicht gegenseitig gedämpft werden.
Beispiel Spa 1998, Runde 1: ~10 Kollisions-DNFs → K = 0.8 statt 8 pro Fahrer.

**Bekannte Schwäche:** Zwei Fahrer desselben Unfalls könnten minimal verschiedene
`laps`-Werte haben (einer rollte noch etwas weiter) → landen in verschiedenen Gruppen.
Selten, aber möglich. Alternativer Ansatz für später: Incident-IDs aus Quelldaten,
oder Zeitfenster-Clustering statt exakter Rundengleichheit.

---

## Phase 2g – DSQ-Klassifikation: Auto vs. Fahrer (offen)

**Problem:** F1DB setzt alle DSQs pauschal auf `posText: 'DSQ'` ohne Unterscheidung.
Dabei gibt es zwei fundamental verschiedene DSQ-Typen:

| Typ | Beispiel | Richtige ELO-Behandlung |
|-----|---------|------------------------|
| **Auto-DSQ** | Tyrrell 1984 (illegaler Tank), Vettel 2021 Ungarn (Kraftstoffmenge), Ferrari 1999 Malaysia (Bargeboards) | Neutral – wie tech-DNF, Fahrer trägt keine Schuld |
| **Fahrer-DSQ** | Senna 1989 Japan (Chicane abgekürzt, Wiedereinfahrt), Schumacher 1994 British GP (Einfahrt unter SC) | Malus – Fahrer-Entscheidung |

**Aktueller Zustand:** Alle DSQs neutral (K=0) – kein ELO-Update in irgendie Richtung.
Das ist für Auto-DSQs korrekt. Für Fahrer-DSQs zu nachsichtig, aber akzeptabler Kompromiss.

**Sonderfall Tyrrell 1984 (kritisch):**
F1DB hat die Original-Finishing-Positionen nicht gespeichert – nur `DSQ`.
Bellof hat alle 12 Rennen tatsächlich gefahren und wäre für sein ELO mit echten
Positionen bewertet worden. Die Daten sind verloren, kein ELO-Update möglich.
→ Originalpositionen aus Drittquelle nachladen (Jolpica, motorsport-reference.com)
und als Override-Datei `tests/pre1950-data/dsq-overrides.json` einspielen.

**Bekannte größere DSQ-Fälle in der F1-Geschichte:**

| Jahr | Fahrer/Team | Grund | Positionen verloren? |
|------|------------|-------|----------------------|
| 1984 | Tyrrell (Bellof, Brundle) | Illegaler Tank/Kraftstoff | Ja – alle 12 Rennen |
| 1989 | Senna, Japan | Wiedereinfahrt nach Abflug | Nein (P1 → DSQ) |
| 1994 | Schumacher, Großbrit. | Safety-Car-Verstoß | Nein (P1 → DSQ) |
| 1997 | Schumacher, gesamt | WM-DSQ (Jerez-Kollision) | Nein – Rennresultate intakt |
| 1999 | Ferrari, Malaysia | Illegale Bargeboards | Nein – nach Appeal reinstatiert |
| 2021 | Vettel, Ungarn | Kraftstoffmenge | Nein (P2 → DSQ) |

**Schumacher 1997:** Kein Problem – F1DB behält seine Rennresultate (P1, P2 etc.).
Nur die WM-Punkte wurden gestrichen. ELO korrekt.

**Priorität:** Niedrig – außer Tyrrell 1984. Tyrrell hat mittlere Priorität weil
Bellof ein Fahrer ist, dessen ELO uns konkret interessiert (Talent-Frage).

---

## Phase 2e – ELO-Velocity: Trend als Bewertungskriterium

**Problem:** ELO ist retrospektiv – Cévert und Bellof hatten kurze Karrieren,
daher niedrige absolute ELO-Werte, galten aber als Ausnahmetalente.

**Lösung:** ELO-Velocity als separater Wert, der beim Pace-Mapping addiert wird.

```
elo_velocity[driver][year] = elo[year] - elo[year - 2]   // 2-Jahres-Delta
trend_bonus  = clamp(elo_velocity / MAX_VELOCITY, -0.05, +0.10)
effective_pace = base_pace + trend_bonus * reliability_weight
```

- **Aufsteiger** (hohe positive Velocity): bis +10% auf effective_pace
- **Absteiger** (negative Velocity): bis -5% – sanfter Abbau
- **Reliability-Dämpfung:** Bellof mit 20 Rennen (reliability = 1.0) bekommt
  vollen Trend-Bonus, aber da er kaum aus Teamkollegen-Vergleich bewertet werden kann,
  bleibt sein ELO-Absolutwert niedrig → Bonus begrenzt sich selbst
- **ELO selbst bleibt unberührt** – nur das Mapping in Pace nutzt den Trend

**Konkretes Beispiel:**
- Cévert Ende 1972: ELO 1850, Velocity +180 → effective_pace ≈ wie ELO 1870
- Bellof Ende 1984: ELO 1780, Velocity +350 → effective_pace ≈ wie ELO 1815
- Fangio 1956: ELO 2100, Velocity +10 → kein nennenswerter Bonus

**Priorität:** Phase 3 (Pace-Mapping), im normalize-elo.js implementieren.

---

## Phase 2f – Rain-ELO: Positionsgewinn-Analyse in Nassrennen

> **STATUS: DEAKTIVIERT** – vorerst nicht implementiert. Idee dokumentiert, kein Code.

**Problem:** In Regenrennen scheiden viele Fahrer aus → kleines Zielfeld → weniger
ELO-Duelle → Senna/Bellof sammeln für denselben relativen Leistungsvorsprung
deutlich weniger ELO als in Trockenrennen. Ihr Regentalent bleibt im ELO unsichtbar.

**Warum deaktiviert:**
- `rain_delta = Ø(pos_trocken − pos_nass)` ist absolut → Hamilton (dominanter Mercedes)
  gewinnt trocken P1 und nass P1 → delta = 0, obwohl er im Regen gut ist.
- K×1.5 in Nassrennen belohnt dominante Fahrer kaum (erwartete Gewinnwahrscheinlichkeit
  bereits nahe 1 → ELO-Delta minimal) – das ist korrekt, aber schwer erklärbar.
- Richtige Lösung wäre **relative rain_delta**: Abweichung vom ELO-Erwartungswert in
  Nassrennen vs. Trockenrennen. Aufwändig, kein klarer Mehrwert für Version 1.0.

**Idee für später (Phase 3+):**
```
rain_delta_rel[driver] = Ø(actual_pos_wet - expected_pos_from_elo_wet)
                       - Ø(actual_pos_dry - expected_pos_from_elo_dry)
// positiv = überperformt ELO-Erwartung im Regen stärker als im Trockenen
```
- Senna 1984 Monaco: ELO erwartet P6, fährt P2 → delta_wet = −4 → rain_rel = stark positiv
- Hamilton 2016 Malaysia (Motor-DNF): kein Regen-Malus, weil Regen nicht Ursache
- Hamilton Normalsaison: gewinnt trocken und nass gleich → delta ≈ 0 → kein Kunstbonus

**WET_RACE_IDS** ist trotzdem eingebettet (für visuelle Markierung + zukünftige Nutzung).

**Implementiert (calculate-elo.js):**
In Regenrennen werden `driver`- und `collision`-DNFs **ELO-neutral** behandelt (kein Malus).
Spin/Kollision im Regen = Streckenbedingung, nicht reiner Fahrerfehler.
Tech-DNFs und DSQ bleiben unverändert.

---

## Phase 2f.2 – Regenwahrscheinlichkeit pro Rennen (Spiel-Integration)

**Ziel:** Jedes Rennen im Spiel bekommt eine `wetChance` (0.0–1.0):

| Fall | Quelle | wetChance |
|------|--------|-----------|
| Bekannt nasses Rennen (in wet-races.json) | Historisches Faktum | 1.0 |
| Bekannt trockenes Rennen (in wet-races.json, wet=false) | Historisches Faktum | 0.0 |
| Historisches Rennen ohne Wetterdaten | Klimadaten Ort + Monat | z.B. 0.35 |
| Zukünftiges Rennen | Klimadaten Ort + Monat | z.B. 0.28 |

**Datenquelle für Klimawahrscheinlichkeit:**
MitchellGleason-Repo enthält bereits OpenMeteo-Klimadaten für 44 F1-Strecken
(`Exported Weather Data/` – monatliche Niederschlagswahrscheinlichkeit pro Circuit).
→ Als `tests/circuit-rain-probability.json` herunterladen und ins Spiel einbetten.

**Implementierung in HTML:**
```js
const WET_RACE_IDS     = new Set([3, 7, 12, ...]);   // 158 bekannte Nass-Rennen
const DRY_RACE_IDS     = new Set([1, 2, 4, ...]);    // bekannte Trocken-Rennen (opt.)
const CIRCUIT_WET_PROB = { 'monaco': { 5: 0.38, 6: 0.31, ... }, ... };

function getRaceWetChance(raceId, circuitId, month) {
    if (WET_RACE_IDS.has(raceId))  return 1.0;
    if (DRY_RACE_IDS.has(raceId))  return 0.0;
    return CIRCUIT_WET_PROB[circuitId]?.[month] ?? 0.20;  // Fallback 20%
}
```

**⚠️ NICHT VERGESSEN:** Rennen ohne Wetterdaten und zukünftige Rennen
bekommen IMMER die standortbasierte Monats-Regenwahrscheinlichkeit – nie 0% default.

---

## Phase 2d – Inaktivitäts-Modellierung (Langfrist)

**Hintergrund:** ELO ist ein reiner Vergleichswert – Inaktivität macht einen Fahrer
nicht schlechter, sondern erhöht die *Unsicherheit* über sein aktuelles Niveau.
Das ELO selbst runterzusetzen wäre methodisch falsch.

**Richtige Lösung: Glicko-2**
Jeder Fahrer hat neben `race_elo` eine **Rating Deviation (RD)**:
- Aktiver Fahrer (viele Rennen): RD sinkt → Rating ist verlässlich
- Inaktiver Fahrer: RD steigt pro Jahr der Pause → wir wissen weniger sicher wo er steht
- Rückkehr nach langer Pause: erste Rennen bewegen Rating stärker (höheres effektives K)
- Effekt: Wimille 1946 nach 7 Jahren Kriegspause muss sich re-etablieren, ohne
  dass sein pre-war Rating künstlich abgewertet wird

**Pragmatischer Kompromiss (einfacher):**
Erhöhter K-Faktor für die ersten N Rennen nach einer Pause ≥ X Jahre:
```
COMEBACK_THRESHOLD = 3  // Jahre Pause
COMEBACK_RACES     = 5  // Rennen mit erhöhtem K
K_COMEBACK         = K_RACE * 2.0
```

**Priorität:** Nach Phase 3 (Pace-Mapping) – beeinflusst hauptsächlich
Fahrer mit Kriegspause (1940–1946) und Karriere-Pausen.

---

## Was NICHT gemacht wird (bewusste Vereinfachungen)

- **Kein Elo ab 1894**: Zu wenig Daten, zu viele Lücken, kein Mehrwert für 1950+-Simulation
- **Kein echtes Budget-System**: Wagen-WM-Platz als Proxy für Budget (weniger Datenpflege)
- **Kein Personal-System**: Newey/Chapman-Effekte nur als Zufalls-Bonus (kein Daten-Tracking)
- **Keine mentale Stärke als separater Wert**: Wird durch Konstanz + Regen abgedeckt
- **Keine Multi-Serien-Simulation**: Phase 5 nur für Elo-Transfer, nicht parallele Simulation

---

## Priorisierung für nächste Coding-Session

| Prio | Task | Aufwand | Status |
|------|------|---------|--------|
| 1 | Phase 0 – Temporada-Scraper (teamdan.com) | Klein | `○` |
| 2 | Phase 2 – DNF-Fix: Accident→neutral + Elo neu berechnen | Klein | `○` |
| 3 | Phase 3 – normalize-elo.js → SEASON_DATA pace-Werte | Mittel | `○` |
| 4 | Phase 3d – Team-Elo → carSpeed kalibrieren | Mittel | `○` |
| 5 | Phase 4f – DNF-Grund im Renn-Log (Spiel) | Klein | `○` |
| 6 | Phase 4a – currentPace in simulateRace nutzen | Klein | `○` |
| 7 | Phase 4b – Saisonübergang Fahrer-Entwicklung | Mittel | `○` |
| 8 | Phase 4c+d – Team-Chassis-Würfel + Era Reset | Mittel | `○` |
| 9 | Phase 4g – Adaptations-Malus implementieren | Klein | `○` |

→ Prio 1–2: Daten vervollständigen + Elo-Fix → saubere Basis
→ Prio 3–4: Pace-Werte ins Spiel bringen → direkter Gameplay-Impact
→ Prio 5–9: Spiel-Engine Phase 4 komplett

