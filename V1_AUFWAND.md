# F1 RPG – Aufwands-Check v1.0 Features

Skala: S = Stunden · M = halber Tag · L = 1–2 Tage · XL = mehrere Tage

| #   | Feature                                      | Aufwand | Begründung |
|-----|----------------------------------------------|---------|------------|
| A3  | UI-Bug-Fixes                                 | S–M     | laufend, je nach Bug |
| A4  | Bewertungssystem                             | L       | neues Scoring mit Teamstärke, Kollegen, Formaufschwung – Sheet 2 noch unvollständig |
| A5  | Top-Team-Dominanz brechen                    | M       | Pace-Variation zwischen Saisons + Formschwäche-Malus – überschaubar, System existiert |
| A10 | Entlassene 5 Jahre Free Agent                | M       | Pool-System existiert, braucht Zeitstempel + Verfall-Logik |
| A11 | Grid-Begrenzung + Pre-Quali                  | L       | Pre-Quali ist komplett neu, historische Startfeld-Größen nötig |
| A12 | Ab 1983 max. 2 Fahrer + eigener Reservetab   | L       | Saisonstart-Dialog + Datenbasis der hist. Fahrerlisten |
| A16 | Neue hist. Fahrer zu Reserveliste (2-Fragen) | M       | Dialog existiert halb, Rookie-Zuordnung anpassen |
| A20 | Ersatzfahrer aus Reserveliste                | M       | Option einbauen, Free-Agent-Wahrscheinlichkeitsformel |
| A22 | Manueller Teamwechsel für jeden Fahrer       | M       | UI + Transfer-Logik, grundsätzlich schon vorhanden |
| A23 | Non-Championship-Rennen                      | XL      | neue Renn-Kategorie quer durch Simulation, Kalender, Statistiken, Todesrate |
| A26 | Jahreskalender mit Uhrzeit                   | M       | neuer Tab, Uhrzeit-Daten aus F1DB?, Zeitkonflikt-Anzeige |
| A29 | Rohdiamanten-Buff                            | S       | Pace-Wachstums-Formel anpassen, eng mit A35 verknüpft |
| A31 | Mid-Season Entlassungen                      | L       | neue Trigger-Logik, automatischer Team-Tausch, Rookie-Ersatz |
| A35 | Historisch korrekte Fahrer-Paces             | XL      | betrifft SEASON_DATA für hunderte Fahrer, Current vs. Potential-System redesignen |
| A42 | Historisch korrekte Team-Paces               | L       | muss mit A35 harmonieren, kann nicht unabhängig gemacht werden |
| A44 | Kommen/Gehen der Teams                       | XL      | Team-Übernahme mit Vertrags- und Wagen-Transfer – fundamentale Saisonstart-Logik |
| A47 | Lokalmatadoren-Teams                         | L       | Nationalitäts-Einschränkung pro Team + Eigentümer-Logik |
| A51 | AAA/USAC-Saison                              | XL      | quasi ein zweites Spiel-Modul parallel zu F1 |
| A55 | Verletzungs-System                           | XL      | komplexestes Feature: Rückkehr, Kaskade, Bewertungsfreeze, UI-Markierung, Dauer |
| A63 | Anpassungsfähigkeit (Hamilton/Andretti/Surtees) | L    | neue Fahrer-Attribute, Pace-Formel-Erweiterung |
| A67 | Saubere Löschfunktion                        | L       | Cascade-Delete über Tod, Wechsel, Ergebnisse, All-Time-Stats |
| A74 | Fixer Pool für erfundene Fahrer              | M       | vordefinierbarer Nachwuchs-Pool, Fallback existiert |

## Zusammenfassung

- **S** (Stunden):      1 – A29
- **M** (halber Tag):   7 – A3, A5, A10, A16, A20, A22, A26, A74
- **L** (1–2 Tage):     8 – A4, A11, A12, A31, A42, A47, A63, A67
- **XL** (mehrere Tage): 5 – A23, A35, A44, A51, A55

## Hinweise

- A35 und A42 (Paces) sind voneinander abhängig – sinnvoll zusammen angehen
- A29 (Rohdiamanten) ist technisch klein, aber konzeptuell Teil von A35
- A55 (Verletzungen) ist das komplexeste Einzel-Feature
- A51 (USAC) ist optional und kann lange warten ohne andere Features zu blockieren
- A23 (Non-Championship) beeinflusst viele Stellen – früh planen, später einbauen
