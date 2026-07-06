# PAKET E – Historische Daten-Validierung SEASON_DATA (1950–1991)

**Erstellt:** 2026-07-06 (Fable-Session) · **Status:** Faktencheck abgeschlossen, Einbau = Opus
**Methodik:** `tests/compare-season-data-vs-f1db.js` (neu, gespeichert) vergleicht SEASON_DATA-Fahrer-Slots
gegen reale Cockpit-Zahlen aus `tests/cockpit-summary.csv` / `cockpit-analysis.csv` (F1DB, grid-basiert,
Indy-bereinigt). Jeder Kandidat wurde zusätzlich rennen-genau gegen die F1DB-Fahrerlisten und echtes
F1-Wissen geprüft. Volle Rohliste: `tests/season-data-deviations.csv` (247 Zeilen – die meisten davon
sind bewusste Design-Entscheidungen bei Werksteams mit vielen Privatiers und KEINE Fehler).

**Scope-Kriterium:** Nur Fälle, in denen das Spiel *gleichzeitige* Cockpits falsch modelliert:
(a) 1-Cockpit-Teams mit ≥2 SD-Slots, (b) SD=1 obwohl real 2+ Stamm-Cockpits.

---

## A. Korrektur-Tabelle – SEHR SICHER (sofort einbaubar)

### A1. Fahrer-Verschiebungen (reparieren zwei Teams gleichzeitig)

| Jahr | Team | Feld | ist | soll | Begründung |
|---|---|---|---|---|---|
| 1954 | Lancia / Ferrari | d | LAN: nur Villoresi; Ascari @ FER | **Ascari FER → LAN** (Lancia = Ascari + Villoresi) | Ascari war 1954 Lancia-Vertragsfahrer; D50-Debüt Spanien-GP mit Ascari (Pole!) + Villoresi. Sein Ferrari-Einsatz war ein einzelnes Gastrennen. Ferrari behält 10 Fahrer. |
| 1966 | Honda / Cooper | d | HON: nur Bucknum; Ginther @ COO | **Ginther COO → HON** (Honda = Ginther + Bucknum) | Ginther war Hondas Nr. 1 ab Monza 1966 (P4 Mexiko). Real 2 Honda-Cockpits (USA/Mexiko). Bonus: Cooper 6→5 = exakt F1DB-Max. |
| 1975 | Surtees / Lotus | d | SUR: nur Dave Morgan; Watson @ LOT | **Watson LOT → SUR, Morgan streichen** (Surtees = 1 Slot Watson) | Watson fuhr die GESAMTE Saison 1975 für Surtees; sein Lotus-Einsatz war 1 Rennen (US-GP-Aushilfe). Morgan fuhr nur den Britischen GP. SD hat die Gewichtung exakt verkehrt. |
| 1981 | March / Ensign | d | MAR: nur Daly; ENS: Surer + Salazar + Londoño | **Salazar ENS → MAR** (March = Daly + Salazar; Ensign = 1 Slot Surer), **Londoño streichen** | March fuhr Anfang 1981 mit 2 Autos (Daly + Salazar); Salazar wechselte erst Mitte Saison zu Ensign (1 Auto). Londoño bekam nie eine Superlizenz, kein einziger Rennstart. |
| 1985 | Toleman / Osella | d | TOL: nur Fabi; OSE: Ghinzani + Rothengatter | **Ghinzani OSE → TOL** (Toleman = Fabi + Ghinzani; Osella = 1 Slot Rothengatter) | Toleman setzte ab Deutschland-GP ein 2. Auto für Ghinzani ein (F1DB max=2); Osella fuhr immer nur 1 Auto (Ghinzani 1. Hälfte, Rothengatter 2. Hälfte). |
| 1990 | Eurobrun / Benetton | d | EUR: nur Langes; BEN: Piquet + Nannini + Moreno (3!) | **Moreno BEN → EUR** (Eurobrun = Moreno + Langes; Benetton = 2 Slots) | Moreno fuhr Eurobrun R1–14 (einziger, der sich je qualifizierte); Benetton erst die letzten 2 Rennen nach Nanninis Heli-Unfall. Benetton hatte real nie 3 gleichzeitige Cockpits. |

### A2. Klare Streichungen – Fahrer war real NIE Rennstarter des Teams

| Jahr | Team | Feld | ist | soll | Begründung |
|---|---|---|---|---|---|
| 1956 | Vanwall | d | nur **Colin Chapman** (!) | Chapman **ersetzen** durch Stammfahrer → s. B1 | Chapman versuchte sich nur im Training zum Frankreich-GP 1956 im Vanwall (Kollision mit Teamkollege, nie gestartet). Als Saison-Fahrer historisch unhaltbar – der Lotus-Gründer fuhr nie ein F1-Rennen. |
| 1981 | Ensign | d | Londoño als 3. Slot | streichen | Nie gestartet (Superlizenz verweigert, nur Training Brasilien). Bereits in A1 enthalten. |

### A3. 1-Cockpit-Teams: SD-Slots auf 1 reduzieren (Fahrer rotierte sich real EIN Auto)

| Jahr | Team | Feld | ist (SD-Slots) | soll (behalten) | Begründung |
|---|---|---|---|---|---|
| 1952 | Alta | d | 2 (G. Whitehead, P. Whitehead) | 1 – **Graham Whitehead** | Je 1 Einzel-Einsatz (Peter: Frankreich, Graham: England), nie 2 Altas gleichzeitig. Graham = das „eigentliche" Alta-Auto; Peter fuhr primär Privat-Ferrari. |
| 1952 | Aston Butterworth | d | 2 (Aston, Montgomerie-Charrington) | 1 – **Bill Aston** | Aston (Team-Eigner) 3 Einsätze, M-C nur Spa. Nie 2 Autos. |
| 1959 | Behra-Porsche | d | 2 (Behra, de Filippis) | 1 – **Jean Behra** | Nur 1 Auto existierte (RSK-Special). De Filippis: 1 DNQ Monaco. Behra = Namensgeber/Eigner. (Randnotiz: real war Behra bis Mitte '59 Ferrari-Werksfahrer – SD-Design setzt ihn bewusst hier, ok.) |
| 1960 | Behra-Porsche | d | 2 (Gamble, Gregory) | 1 – **Masten Gregory** | 1 Auto; Gregory startete Argentinien (Grid 16), Gamble nur Monza. |
| 1962 | Emeryson | d | 2 (Seidel, Settember) | 1 – **Tony Settember** | 1 Auto; Settember 2 Starts (England, Italien), Seidel 1 (Zandvoort). |
| 1970 | De Tomaso | d | 3 (Schenken, Redman, Courage) | 1 – **Piers Courage** | Frank Williams' EIN 505-Chassis: Courage R1–5 (†Zandvoort), Redman 2 Rennen Ersatz, Schenken Rest. Nie 2 Autos. |
| 1974 | Ensign | d | 2 (Schuppan, Wilds) | 1 – **Vern Schuppan** | 1 Auto; Schuppan Großteil der Saison, Wilds nur Saisonende. |
| 1974 | Hesketh | d | 2 (Hunt, I. Scheckter) | 1 – **James Hunt** | Hunt fuhr alles; Ian Scheckter nur 1 Gaststart im 2. Auto (Österreich). F1DB: 13 von 14 Rennen 1 Cockpit. |
| 1975 | BRM | d | 2 (Evans, Wilds) | 1 – **Bob Evans** | Stanley-BRM, 1 Auto: Wilds 2 Rennen, Evans Rest. |
| 1975 | Fittipaldi | d | 2 (W. Fittipaldi, Merzario) | 1 – **Wilson Fittipaldi** | Copersucar, 1 Auto: Wilson 13 Rennen, Merzario nur Monza-Vertretung. |
| 1975 | Maki | d | 2 (Trimmer, Fushida) | 1 – **Tony Trimmer** | 1 Auto, ausschließlich DNQs (Fushida 2, Trimmer 3 Versuche). |
| 1976 | Ensign | d | 3 (Amon, Ickx, Binder) | 1 – **Chris Amon** | 1 Auto: Amon Großteil, Ickx danach, Binder nur Japan. |
| 1977 | BRM | d | 4 (Pilette, Andersson, Perkins, Edwards) | 1 – **Larry Perkins** | 1 Auto (P207), 4 Fahrer nacheinander. Perkins fuhr die Saison-Starts. Der Memo-„kritischste Fall". |
| 1978 | Hesketh | d | 2 (Galica, Cheever) | 1 – **Divina Galica** | 1 Auto (308E), nur DNQs; Galica Saisonstart, Cheever 1 Versuch. |
| 1979 | Ensign | d | 3 (Gaillard, Daly, Surer) | 1 – **Derek Daly** | 1 Auto: Daly → Gaillard → Surer nacheinander. |
| 1979 | Fittipaldi | d | 2 (E. Fittipaldi, Ribeiro) | 1 – **Emerson Fittipaldi** | Emerson fuhr die Saison; Ribeiro nur DNQ-Versuche am Saisonende. |
| 1979 | Wolf | d | 2 (Hunt, Rosberg) | 1 – **Keke Rosberg** | 1 Auto: Hunt R1–7 (Rücktritt nach Monaco), Rosberg Rest (mehr Rennen). |
| 1981 | ATS | d | 2 (Borgudd, Lammers) | 1 – **Slim Borgudd** | 1 Auto: Lammers Saisonstart (DNQs), Borgudd Rest (WM-Punkt Silverstone). |
| 1982 | Theodore | d | 3 (Daly, Byrne, Lammers) | 1 – **Derek Daly** | 1 Auto: Daly R1–4 (dann real zu Williams), Lammers/Byrne danach. Daly behalten – Williams-SD ist mit Rosberg+Reutemann schon voll. |
| 1984 | Spirit | d | 2 (Baldi, Rothengatter) | 1 – **Mauro Baldi** | 1 Auto: Baldi/Rothengatter nacheinander. |
| 1985 | Zakspeed | d | 2 (Palmer, Danner) | 1 – **Jonathan Palmer** | 1 Auto (nur Europa-Rennen); Danner nur 2 Vertretungs-Einsätze. |
| 1987 | AGS | d | 2 (Fabre, Moreno) | 1 – **Pascal Fabre** | 1 Auto: Fabre R1–11, Moreno letzte 2 Rennen. |
| 1989 | Eurobrun | d | 2 (Foitek, Larrauri) | 1 – **Gregor Foitek** | 1 Auto: Foitek Großteil (DNPQ-Serie), Larrauri Saisonende. |
| 1990 | Life | d | 2 (Giacomelli, G. Brabham) | 1 – **Bruno Giacomelli** | 1 Auto (W12-Desaster): Brabham 2 Versuche, Giacomelli Rest – alle DNPQ. |
| 1991 | Coloni | d | 2 (Chaves, Hattori) | 1 – **Pedro Chaves** | 1 Auto: Chaves R1–13, Hattori letzte 2 – alle DNPQ. |

---

## B. Korrektur-Tabelle – MITTLERE SICHERHEIT (Design-Entscheidung nötig)

| Jahr | Team | Feld | ist | soll | Begründung |
|---|---|---|---|---|---|
| B1: 1956 | Vanwall (+ Bugatti) | d/t | VAN: nur Chapman; Schell @ MAS; Trintignant @ BUG (Bugattis einziger Fahrer) | **Schell MAS → VAN** + **Trintignant BUG → VAN**, Chapman raus; **Bugatti-Team ganz streichen** | Schell + Trintignant waren die Vanwall-Stammfahrer 1956 (F1DB: konstant 2–3 Cockpits). Bugatti T251 fuhr real nur 1 einziges Rennen (Frankreich, Trintignant). Konsequenz: Bugatti verschwindet aus 1956 – historisch vertretbar, aber Geschmacksfrage. Minimal-Variante: nur Schell MAS→VAN (Vanwall dann 1 statt real 2–3). |
| B2: 1955 | Vanwall | d | 1 (Ken Wharton); Schell @ FER | **Schell FER → VAN** (Vanwall = Wharton + Schell) | England + Monza 1955: 2 Vanwalls (Wharton + Schell). Schells Ferrari-Bindung 1955 war marginal; Ferrari behält 9 Fahrer. Nur „mittel", weil Vanwall die 1. Saisonhälfte tatsächlich 1 Auto (Hawthorn) einsetzte. |
| B3: 1965 | LDS | d | 3 (Pretorius, Tingle, Serrurier) | 2 – **Tingle + Serrurier**, Pretorius streichen | Nur 1 WM-Rennen (Südafrika-GP). Tingle + Serrurier starteten, Pretorius scheiterte an der Quali. F1DB-Grid-Daten hier lückenhaft (nur 1 Grid-Slot erfasst), daher mittel statt hoch. |

---

## C. Geprüfte NICHT-Fälle (keine Korrektur – bitte im Memo als erledigt markieren)

| Jahr | Team | Verdacht | Befund |
|---|---|---|---|
| 1966 | McLaren | SD=1, F1DB max=2 | Das „2. Cockpit" in Spa ist **Phil Hills Kamera-Auto** für den Spielfilm *Grand Prix* – kein echter Renneinsatz. SD=1 (Bruce) ist korrekt. |
| 1957 | Connaught | SD=1, F1DB=2 (Monaco) | 2. Monaco-Fahrer war Stuart Lewis-Evans – der ist in SD korrekt bei Vanwall (Stammplatz nach Connaught-Rückzug im Mai '57). Duplikat vermeiden, SD=1 (Bueb) belassen. |
| 1959 | Kurtis Kraft | SD=13, F1DB=1 | Indy-Roster (Indy 500 zählte 1950–60 zur WM); Cockpit-Analyse ist Indy-bereinigt. Kein F1-Fall. |
| 1952/53 | Simca Gordini vs. Gordini | „SD zu wenig" | Mapping-Artefakt: SD führt bewusst ZWEI Teams (Werks-Gordini T16 + private Simca-Gordini T15), F1DB nur einen Konstrukteur. Kein Fehler. |
| 1950–60 | Maserati/Cooper/Lotus etc. mit SD ≫ F1DB-Max | 200+ Rohtreffer | Bewusste Design-Entscheidung: SD listet Saison-Gesamtkader inkl. Privatiers, nicht gleichzeitige Cockpits. NICHT anfassen. |

---

## D. Hinweise für den Opus-Einbau

1. **Reihenfolge:** A1 zuerst (Verschiebungen), dann A2/A3 (Streichungen), dann B nach Rückfrage beim Nutzer (v.a. B1 Bugatti-Streichung).
2. **Ripple-Check nach Streichungen:** Gestrichene Fahrer (z.B. Lammers 1981/82, Hunt 1979, Ickx 1976) verschwinden ggf. komplett aus dem Jahres-Grid – gewollt, aber `initReservePool`/Nachrücker-Logik einmal gegenprüfen.
3. **Team-Slots (`t`) bleiben unverändert** – nur `d`-Einträge ändern sich; Ausnahme B1 (Bugatti-Team-Zeile).
4. **Randnotiz Nation:** Viele der behaltenen Fahrer tragen 🏁-Platzhalter statt echter Nation (Perkins=AUS, Daly=IRL, Surer=SUI, Fabre=FRA, Ginther=USA, Amon=NZL …). Falls gewünscht, separater Mini-Task – nicht Teil dieser Tabelle.
5. **Regressionstest:** `node tests/compare-season-data-vs-f1db.js` – nach Einbau sollten alle A-Fälle aus der Filterliste (max=1 & SD≥2 bzw. SD=1 & max≥2) verschwinden, außer den dokumentierten Nicht-Fällen (McLaren 66, Connaught 57, Kurtis Kraft 59).
