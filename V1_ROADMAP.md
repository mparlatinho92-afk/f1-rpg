# F1 RPG – v1.0 Voraussetzungen

**1.0.0 wird erst vergeben wenn alle Punkte 🟢 sind.**
Status: 🔴 = offen · 🟡 = teilweise · 🟢 = fertig

---

## Balance & Gameplay
- 🟡 **Top-Team-Dominanz brechen** – Wagen kann von Saison zu Saison besser/schlechter werden; seltene Extremfälle; Fahrer-Formschwäche (je länger desto unwahrscheinlicher)
- 🟢 **Historisch korrekte Fahrer-Paces** – junger Alonso bei Minardi zu stark; Current Pace ≠ Potential Pace bei Jungen; Rohdiamanten: schnelleres Wachstum, Potential-Cap bis halber Altersschnitt
- 🟡 **Historisch korrekte Team-Paces** – harmoniert mit Fahrerpaces; Ziel: Minardi 2001 kommt selten in Punkte
- 🟡 **Rohdiamanten-Buff** – sollen sich lohnen, derzeit zu oft unten durch; Status nur bis halber Altersschnitt möglich
- 🔴 **Funktionierendes Bewertungssystem** – aktuell defekt: Schumacher im AGS bekommt schlechtere Bewertung als ein Teamkollege der ständig in der Vorqualifikation scheitert; Kernproblem: Bewertung ignoriert Auto-Kontext
  - Fahrer schöpft Auto-Pace voll aus → Plus (Deckel des Autos wird erreicht)
  - Fahrer bleibt unter der Auto-Pace → Minus (Wagen wird nicht ausgenutzt)
  - Vergleichsbasis muss auto-adjustiert sein: Leistung relativ zu carSpeed, nicht relativ zum Feld
  - DNQ/DNP-Teamkollege darf nicht als Nullwert in Bewertung eingehen → Fallback auf carSpeed-Erwartung
  - Teamkollegen-Vergleich bleibt wichtigste Metrik, aber nur wenn Teamkollege qualifiziert fährt
  - **Erwartungs-System:** je besser das Auto/Team, desto höher die Erwartung – Überperformance wird belohnt, Unterperformance bestraft
    - Erwartungsbasis: Team-Durchschnittsplatzierung der letzten 1–3 Jahre (offen: Gewichtung; letztes Jahr vs. gleitender Schnitt)
    - Perzentil des Teams im Feld bestimmt die Erwartungshöhe (Top-Team: Siege erwartet; Backmarker: Punktefahrt = Überperformance)
    - Noch nicht durchdacht: wie stark soll Überperformance die Bewertung heben vs. wie stark bestraft Unterperformance
- 🔴 **Konstanz als eigener Faktor** – empirisch aus F1DB abgeleitet (dnf_rate + pos_stddev), nicht manuell geschätzt
  - Direkt im Signing-System verwendbar: Teams mit Titelambition gewichten hoch, Entwicklungsteams weniger
  - Ob ein Team Konstanz beachtet ist nicht fix – hängt von Team-Typ, Saison-Situation, Budget ab
  - Erklärt warum Berger nie WM wurde trotz hoher pace (schnell aber inkonstant)

## Reservefahrer & Pool
- 🔴 **Werksfahrer vs. Privateer-System** *(optional post-release)* – Typ-Feld `'W'`/`'P'`/`'G'` in SEASON_DATA; Werksfahrer immer gemeldet, Privateers sporadisch (Eintrittswkeit pro Rennen), Gastfahrer 1–3 Rennen; era-basiertes Sitzlimit pro Werksteam (1950s: 4, 1960s–70s: 3, 1980s+: 2); ersetzt Grid-Füller (Option B)
- 🟡 **Entlassene Fahrer 5 Jahre als Free Agent** im Pool; Rückkehr-Wahrscheinlichkeit schrumpft exponentiell
- 🟡 **Fixer Fahrer-Pool für erfundene Fahrer** – vorhersehbarer Nachwuchs; Fallback = großer Reservepool
- 🟡 **Historische Saison-Fahrer** in eigenem Tab der Reservefahrer-Liste; chronologisch erste 2; bei echtem 1-Auto-Team kein Generieren

## Saison-Optionen (einstellbar vor jeder Saison)
- 🟡 **Ab 1983: max. 2 Fahrer** (Option) – chronologisch erste 2; Spiel fragt ob 2. Fahrer für neue Saisons dazukommen soll
- 🟡 **Grid-Begrenzung** (Option) – historische Startfeld-Größe; Rest durch Quali / Pre-Quali
- 🔴 **Neue hist. Fahrer zur Reserveliste** (Option) – 2. Frage ob einsetzen; Mittelfeld 25%/Backmarker 75%-Regel; zukünftige-Fahrer-Tab einbeziehen
- 🟢 **Ersatzfahrer aus Reserveliste** (Option) – auch entlassene Free Agents möglich
- 🟡 **Mid-Season Entlassungen** (Option) – bei extrem schlechter Leistung; Top→Mittelfeld/Back, Mittelfeld→Back/weg; automatischer Tausch; "ganz weg" = Rookie-Ersatz
- 🟡 **Historisches Kommen/Gehen der Teams** (Option) – Team ersetzt anderes, übernimmt Verträge + Wagen
- 🔴 **Lokalmatadoren-Teams** (Option) – epochenbedingter Prozentsatz; Fahrer-Konstrukteurseigentümer wechseln nie (sonst löst sich Team auf)

## Features
- 🔴 **Non-Championship-Rennen** – frühe Saisons nicht zu kurz; auch tödlich; im Kalender filterbar (alle/Championship/Non-Championship); farblich unterschieden
- 🟡 **Jahreskalender** – anstehende Rennen mit Uhrzeit; Zeitkonflikte untereinander
- 🟡 **AAA/USAC-Saison** – separates parallel laufendes Feld; Indy-Statistiken geteilt; höhere Todesrate als F1
- 🔴 **Verletzungs-System** – Rückkehrgarantie, Ersatzfahrer-Kaskade, historische Wahrscheinlichkeit, Formschwäche nach Rückkehr, Bewertung eingefroren (UI-Markierung), Rücktrittsneigung steigt
- 🔴 **Anpassungsfähigkeit** – F1-Wagen (Hamilton/Ferrari), Formelwagen (Andretti), Open-Wheeler (Surtees)
- 🔴 **Alle manuellen Teamwechsel** – jeder Fahrer zu jeder Zeit versetzbar
- 🔴 **Saubere Löschfunktion** – Rennen/Saison zurücksetzen inkl. Tod, Wechsel, Ergebnisse, All-Time-Stats
- 🟡 **Erste simulierte Saison** – alle Fahrerbewegungen (inkl. Altersrücktritte) müssen sofort beim Saisonstart greifen; fehlt derzeit

## UI & Bugs
- 🟡 **Alle UI-Bug-Fixes** – laufend abarbeiten, kein spezifischer Stand definiert
