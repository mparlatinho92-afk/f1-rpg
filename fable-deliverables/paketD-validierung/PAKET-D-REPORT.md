# PAKET-D-REPORT — Realismus-QA Mega-Sim (v0.9.14.44)

**Datengrundlage:**
- Lauf 1: Neues Spiel 1950, 76 Saisons (1950–2025), deathRealism 100, juniorMode 'world' → `megasim-qa.json`
- Lauf 2: Neues Spiel 2001, 10 Saisons (2001–2010), deathRealism 0 (Tode aus), juniorMode 'off' → `megasim-qa_2001.json`
- Aggregation: `analyze-qa.js` → `analysis-1950.txt` / `analysis-2001.txt`

**Rolle laut Übergabe:** Nur Urteil (plausibel / unplausibel + Begründung + reale Anker). Keine Code-Fixes — Umsetzung macht Opus.

---

## Gesamturteil

Die Sim trifft die **großen Formen** überraschend gut: Die richtigen Namen werden Champions, Dynastie-Längen, Champion-Alter im Schnitt, Punkteniveaus je Ära, Rookie-Seltenheit und die DNF-Kurvenform über 75 Jahre sind glaubwürdig. **Das Kernproblem ist die Team-Hierarchie unterhalb von Platz ~5:** Backmarker sind systematisch viel zu stark (Roadmap-Verdacht „Minardi 2001" wird drastisch bestätigt), und Team-Stärke schwankt von Jahr zu Jahr um Beträge, die es in der realen F1 nur als Jahrzehnt-Ausnahme gibt. Dazu zwei Zeitachsen-Probleme: historische Fahrer altern zu langsam (Schumacher holt mit 40/41 Titel), und tödliche Unfälle verteilen sich falsch über die Ären (moderne Ära viel zu tödlich, Frühzeit eher zu harmlos).

---

## 🔴 HOCH — Backmarker massiv überkalibriert (Roadmap-Anker bestätigt)

**Befund (Sim):**
- Lauf 2 (2001er-Anker): Minardi 2001 **13 Punkte / 6 Punkte-Finishes** — real: **0 Punkte**. Danach eskaliert es: 2003 WM-Sechster mit 2 Siegen, 2004 WM-Zweiter (116 P), **2005 Konstrukteurs-Weltmeister (183 P) mit Fahrer-Champion Alonso**.
- Lauf 2: **100 %** der Teams im unteren WM-Drittel holen Punkte (Ø 6,2 Punkte-Finishes/Saison). Lauf 1: 70 % (Ø 3,5) — real lag diese Quote in Top-6/Top-8-Punktesystem-Ären eher bei 15–25 %.
- Lauf 1: Zakspeed 1987–89 WM-Platz 4/3/4 mit Siegen (real: **2 Punkte in 5 Jahren Existenz**), Caterham 2014 WM-Vierter mit 4 Siegen (real: **0 Punkte je**, 2010–14), HRT 2011 mit 115 P (real: 0 Punkte je), Minardi 1993 stellt mit Villeneuve den **Fahrer-Weltmeister**.

**Warum unrealistisch:** Die reale F1 hat eine steile, zähe Leistungspyramide. Minardi hat in 21 Saisonen (340 GPs) **38 Punkte gesamt** geholt, bestes Jahr 6 Punkte, 12 punktelose Saisons. Die reale 2001er-Tabelle unten: Prost 4, Arrows 1, Minardi 0 — gegen Ferrari 179. Backmarker-Siege gab es zwischen 1980 und 2020 praktisch nicht (kein Team aus dem unteren WM-Drittel hat in dieser Zeit ein Rennen gewonnen; selbst Sensationssiege wie Monza 2020 kamen aus dem Mittelfeld).

**Beobachtetes Muster (Urteil, kein Fix):** Backmarker steigen v. a. dann auf, wenn ein künftiger Star dort sitzt und bleibt — Alonso trägt Minardi 2001→2005 zum Titel, Villeneuve macht Minardi 1993 zum Vize-Team. Die Team-Stärke scheint dem Fahrer-Elo zu folgen, statt dass das Auto den Fahrer deckelt. Real gilt das Gegenteil: Alonso holte im Minardi 2001 exakt 0 Punkte und wurde erst im Renault Champion — **der Wagen ist die Obergrenze, nicht der Fahrer der Unterbau.**

**Kalibrier-Anker für Opus:**
| Team | Real | Sim (schlimmster Fall) |
|---|---|---|
| Minardi 1985–2005 | 38 P gesamt, nie >6 P/Jahr, 2001: 0 P | 2005: Team-WM, 183 P |
| Zakspeed 1985–89 | 2 P gesamt | 1988: WM-3. mit Sieg |
| Osella 1980–90 | ~5 P gesamt | 1983: WM-4., 28 P |
| Caterham/HRT 2010–14 | 0 P (beide, je gesamt) | Caterham 2014: WM-4., 4 Siege |
| Arrows 1978–2002 | ~160 P, **nie ein Sieg** in 382 GPs, bestes Jahr WM-4. | 1990: Konstrukteurs-Weltmeister |
| Realer Punkte-Gradient 2001 | Ferrari 179 → Sauber 21 → Prost 4 → Arrows 1 → Minardi 0 | Sim-Tail viel zu flach |

---

## 🔴 HOCH — Team-Stärke-Volatilität: Sprünge, die real Jahrzehnt-Ausnahmen sind

**Befund (Sim, Lauf 1):** Arrows 1988 #17 → 1989 #3 → 1990 **Team-Weltmeister**; Arrows 1999 #11 (1 P) → 2000 #2 (102 P); McLaren 2002 #1 → 2004 #8 → 2007 #1; BAR gewinnt 2005 ein Rennen als WM-Neunter; Haas siegt 2023 als WM-Letzter; Ferrari pendelt 1979 #4 → 1980 #11 → 1986 #3 → 1988 #8.

**Warum unrealistisch:** Reale Team-Ränge bewegen sich typischerweise ±1–2 Plätze pro Jahr. Sprünge vom Tabellenende an die Spitze gab es in 75 Jahren real fast nie — Brawn 2009 (aus Honda #9 → Titel) ist **die** berühmte Ausnahme und beruhte auf einem Reglement-Umbruch. In der Sim passiert Brawn-2009 mehrfach pro Jahrzehnt, auch mitten in stabilen Reglement-Phasen. Ein Letzter, der ein Rennen gewinnt (Haas 2023), ist seit den 1950ern real nicht vorgekommen.

**Kalibrier-Anker:** Rang-Delta pro Jahr real: Median ±1, 95%-Perzentil ±3; >5 Plätze Aufstieg nur bei Reglement-Reset (2009, 2014, 2022) und auch dann nur je 1 Team.

---

## 🔴 HOCH — Alters-Decline historischer Fahrer zu schwach

**Befund (Sim):** Lauf 2: Michael Schumacher wird 2007, 2009 und 2010 Champion — mit **38, 40 und 41** (7 Titel 2001–2010). Lauf 1: Graham Hill Champion 1970 mit 41; Häkkinen Champion 2003 mit 35 (real: Karriereende 2001); Damon Hill 1996 mit 36 (real korrekt! — als Einziger dieser Liste plausibel).

**Warum unrealistisch:** Der älteste Weltmeister seit 1967 war 39 (Graham Hill 1968, Mansell 1992). Real fällt die Spitzen-Pace ab ~34–36 spürbar: Schumachers Comeback 2010–12 (41–43) brachte ein einziges Podium. Ein 40-Jähriger, der in der Rundenzeit-sensibelsten Ära (2000er) die WM gewinnt, widerspricht allem seit Fangio (46, 1957 — vor-moderner Sonderfall, als Erfahrung Reifen-/Materialmanagement überwog).

**Kalibrier-Anker:** Titel-Wahrscheinlichkeit nach Alter real (seit 1968): 23–31 = Normalfall, 32–36 = möglich aber abnehmend, 37+ = **0 Titel in 57 Jahren**. Sim-Lauf 2 hat allein 3 Titel im Bereich 38–41.

---

## 🔴 HOCH — Todesfälle: falsche Ära-Verteilung (zu sicher früh, zu tödlich modern)

**Befund (Sim, Lauf 1, deathRealism 100):** 2000er: **4 tödliche Rennunfälle, 6 Saison-Tote** — darunter Alonso (†22, 2003), Webber (†26, 2002), Fisichella (†28, 2001). Dagegen 1950er/60er zusammen nur 13 Saison-Tote und 9 tödliche Unfälle. 2010er/20er: 0 ✓.

**Warum unrealistisch:** Real starben zwischen 1995 und 2014 **null** F1-Fahrer an Rennwochenenden (Bianchi 2014/15 als einziger seither). Die Sim-2000er sind damit tödlicher als die realen 1980er. Umgekehrt waren die realen 1950er/60er deutlich tödlicher als die Sim: ~25–30 Fahrer-Tote in F1-Kontext (inkl. Training/Indy) in diesen zwei Dekaden, Sim: 13. Die Kurve ist zu flach — sie müsste von ~1,5 Toten/Jahr (50er/60er) über ~1/Jahr (70er) und ~0,3 (80er) auf ~0 (ab 1995) fallen.

**Kalibrier-Anker:** Reale F1-Fahrer-Tote je Dekade (Rennen+Training, ohne Indy): 50er ~11, 60er ~12, 70er ~10, 80er 4, 90er 2 (beide 1994), 2000er 0, 2010er 1.

---

## 🟡 MITTEL — Titel-Konzentration: McLaren-Übermacht, BRM-Dynastie

**Befund (Sim, Lauf 1):** McLaren **24 von 76** Team-Titeln (u. a. 1979–2009 fast durchgehend Spitzenteam), BRM 10 Titel (real: 1), Ferrari nur 13 in Phasen, in denen real die Hybrid-Ära Mercedes gehört hätte. Längste Team-Serie 6 ✓ (real-plausibel, Ferrari 1999–2004).

**Warum unrealistisch:** Real hält Ferrari mit 16 Titeln in 75 Jahren den Rekord (~21 %); Sim-McLaren liegt bei 32 %. Einzelne Dynastien sind okay — dass **dasselbe** Team über vier Jahrzehnte immer wieder oben ist, ohne je lange Krisen (real: McLaren 1994–97 sieglos, 2013–20 sieglos), fehlt als Muster. Emergente Abweichung von der Realgeschichte ist erwünscht („emergent vor gescriptet"), aber die Konzentration übersteigt das realistische Maß.

**Kalibrier-Anker:** Max. realer Titelanteil eines Teams: 21 % (Ferrari). Reale Team-Krisenzyklen: jedes Top-Team hatte pro 40 Jahre mindestens eine ≥5-jährige sieglose Phase.

---

## 🟡 MITTEL — Transfer-Plausibilität: Spitzenfahrer ins untere Drittel

**Befund (Sim):** Alonso wechselt 2005 **als amtierender Champion** zum WM-Neunten (Lauf 2); WM-P4 Laine → Minardi (Letzter), WM-P5 Laurent (McLaren) → AGS (#16/18), WM-P4 Barrichello → Arrows (Letzter, als „lateral" deklariert). Champion-Wechsel gesamt aber selten und meist zu Top-Teams ✓ (Prost→Arrows-#3, Verstappen→McLaren-#1 sind intern konsistent).

**Warum unrealistisch:** Real wechseln Fahrer aus den WM-Top-6 praktisch nie freiwillig ins untere Drittel — sie gehen lateral oder abwärts ins **Mittelfeld** (Alonso→Alpine, Vettel→Aston Martin, Hamilton→Ferrari). Ein Champion beim Tabellen-Neunten gab es nie; das Nächste daran war Hamilton→Mercedes 2013 (#5-Team) — und das galt als Schock.

**Kalibrier-Anker:** Zielteam-Rang realer Top-6-Wechsler seit 1980: fast ausschließlich Rang 1–7; unteres Drittel nur bei Karriere-Ausklang (>35) oder Bezahlfahrer-Konstellation.

---

## 🟡 MITTEL — Nationen: Unknown-Flut in den 50ern, GBR-Übergewicht, moderne Streuung

**Befund (Sim, Lauf 1):**
- **41,6 % aller 1950er-Grid-Slots haben Nation „🏁"** (unbekannt) — Datenlücke, die jede Ära-Aussage für die Frühzeit verwässert (vermutlich Indy-Kontingent ohne gesetzte Nation).
- Unter den bekannten: GBR:ITA = 11,0 % : 4,9 % in den 50ern, dazu **5 britische Fahrertitel 1954–1960 durch generierte Fahrer** (Page, Gray, Dixon). Real war die frühe Dekade italienisch-argentinisch geprägt (Ascari, Fangio, Farina); der erste britische Titel kam erst 1958.
- 2020er: SUI 8,3 %, ISR 5,0 %, USA 10 % — die Post-Template-Welt streut stark in F1-untypische Nationen; GBR nur 7,5 % (real 2020er: ~15 %, dazu ESP/NED-Gewicht).
- Emoji- vs. IOC-Kodierung gemischt („🇬🇧" bei historischen, „GBR" bei generierten Fahrern) — erschwert jede Nationen-Statistik (betrifft auch das 🌍-Panel).

**Warum unrealistisch:** Nationen-Frequenz je Ära war Kern von Paket A — für 2000er+ sitzt sie gut (Lauf 2: GER/BRA/ITA-Spitze plausibel für 2001 ✓). Die 50er-Generierten ziehen aber erkennbar aus einem zu britischen Pool, und nach Template-Horizont (2025+) fehlt der Anker Richtung real existierender F1-Nationen-Verteilung.

---

## 🟢 NIEDRIG — DNF moderne Ära leicht zu hoch; historische Team-Lebenszyklen

- DNF-Ära-Form stimmt insgesamt (50er 44,7 %, 60er 48,1 %, 80er 47,3 % — alle nah an real). Moderne Ära etwas zu ausfallreich: 2010er Ø 20,5 % (real ~12 %), 2020er 14,9 % (real ~8–9 %), 1990er 46,3 % (real ~35–40 %).
- Maserati gewinnt Team-WM 1959/60 (Werksausstieg real Ende 1957), Connaught-Titel 1956 (real chronisch klammer Privatier). Als emergente Alternativgeschichte vertretbar — auffällig ist nur, dass sterbende Teams bis zu ihrem Template-Ende konkurrenzfähig bleiben, statt auszurollen.

---

## ✅ Was plausibel ist (positiver Maßstab — bitte nicht „mitfixen")

1. **Die richtigen Namen gewinnen:** Ascari, Stewart, Lauda, Prost, Senna, Schumacher, Häkkinen, Vettel, Hamilton, Verstappen dominieren ihre korrekten Ären; Lauf 2 trifft 2001–2004 (Schumacher/Ferrari-Dominanz, 2002: 126 P/12 Siege ≈ real 144 P/11 Siege) bemerkenswert genau.
2. **Champion-Profil:** Ø-Alter 29,6 (real ~29), Team-Rang des Champions 79 % #1 / 17 % #2 / 4 % #3–4 (real fast identisch — Rosberg 1982 aus #4-Team existiert als reale Entsprechung).
3. **Rookie-Champions selten** (2 in 76 Jahren) ✓.
4. **Punkteniveaus je Punktesystem-Ära** stimmen (42 P 1960, 70 P 1970, 93 P 1983, 272 P 2010, 444 P 2023 — alle im realen Korridor).
5. **Dynastie-Längen** (max. 4 Fahrer-, 6 Team-Titel in Serie) ✓ real gedeckt (Vettel 4, Ferrari 6, Mercedes 8 als Ober-Anker).
6. **Rücktrittsalter** Median 33, Hauptmasse 30–39 ✓ (realer Schnitt letzter GP ~33–35).
7. **Fahrer-Titelrekorde:** 7 als Maximum (Stewart, Hamilton) — deckungsgleich mit realem Rekord.

---

## Verknüpfung zur Roadmap (V1_ROADMAP.md)

Der Punkt **„Minardi 2001 kommt selten in Punkte"** ist bestätigt und untertreibt: Es geht nicht nur um Phase 4b-SD-Anker für PACE_RATINGS-lose Teams, sondern um drei sich verstärkende Effekte — (a) SEASON_DATA-Backmarker-Werte zu hoch (Roadmap-Analyse ✓), (b) Star-Fahrer ziehen ihr Backmarker-Team per Elo hoch statt vom Auto gedeckelt zu werden, (c) Jahres-Volatilität lässt Backmarker zusätzlich nach oben würfeln. Als Regressionstest nach jedem Fix eignet sich exakt Lauf 2: **Neues Spiel 2001, 5 Saisons → Minardi soll 0–4 P/Jahr holen, Arrows 0–2 P, Ferrari/McLaren/Williams die Titel unter sich ausmachen, kein Team-Rang-Sprung >3 Plätze.**

*Erstellt von Fable (Paket D), 2026-07-06. Nur Urteil — keine Code-Änderungen vorgenommen.*
