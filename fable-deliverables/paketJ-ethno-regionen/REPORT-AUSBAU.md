# Paket J AUSBAU — REPORT (Wirkung)

**Referenzlauf:** `run-ausbau.txt` (`node classify-forenames.js`, Seed 42, deterministisch).
Einheit überall: **gewichtete Ziehmasse, „1 von N Fahrern"** (Brief-Methode).

## §1 GRE — Nachnamen-Bereinigung (D1, Hauptaufgabe)

| | ALT (= Live v0.9.14.81) | NEU |
|---|---|---|
| Namen / eff | 1009 / **368** | 483 / **303** |
| griechisch männlich (-s/-ou) | 51,3 % | **100,0 %** |
| nicht -s/-ou (albanisch/südasiat./türkisch/weibl./Junk) | **43,9 %** (1 von 2) | 0,0 % |
| Vorname-als-Nachname (-s) | 3,1 % (1 von 32) | 0,0 % |
| weibliche -ou-Paarform | 1,3 % (1 von 76) | 0,0 % |
| fremd/Junk mit -s/-ou (Chris/Waqas/Bains/Jones/Cavus …) | 0,4 % | 0,0 % |

**Prüfstein D1e — Pool gesund:** 483 Namen, eff 303 (Ausgang 1009/368).
44 % Fremdmasse gehen, eff sinkt nur um 18 % — der Brief-Befund „Bereinigung
kostet keine Vielfalt" bestätigt. Albanische Nachnamen: vorher **1 von 24**
(Brief) → jetzt **0**.

**GRE-Vornamen (D1c):** 456 Namen / eff 162 → **161 / eff 95**; entfernte
30,8 % Masse = albanisch/pakistanisch/türkisch/anglo/Greeklish (METHODIK §2.4).
eff 95 ist realistisch, nicht dünn: reale griechische Männer-Vornamen sind
extrem kopflastig (Giorgos/Dimitris/Nikos/Kostas decken real >20 % ab);
zum Vergleich: RSA r1 eff 29, FIN r1 eff 24.

## §2 CAN — r2-Split (D2)

**„Sandeep Tsang":** Live-Pool 3,64 % aller CAN-Fahrer = **1 von 27** (Brief)
· Emulator-ALT 1 von 33 → **NEU 0,00 %** (per Konstruktion: kein Vorname
und Nachname teilen r2×r3; --dbg2-Zerlegung: r2 saF 69,6 %/eaL 0,0 %,
r3 saF 0,0 %/eaL 100,0 %).

| Region | eff Vornamen ALT→NEU | Pool ALT→NEU |
|---|---|---|
| r0 anglophon (w 0.55) | 189 → 167 | 450 → 389 |
| r1 Québec (w 0.33) | 23 → 50 | 30 → 79 |
| r2 südasiatisch (w 0.07, ab 1990) | 14 → 23 | 27 → 59 |
| **r3 ostasiatisch (w 0.05, ab 1990) NEU** | 0 → **30** | 0 → **47** |

Ostasiatische Vornamen von 0 % Ziehmasse auf eine volle Region (47 Namen):
westliche Rufnamen geteilt `[0,3]`/`[0,1,3]` + kuratierter Kopf, Pinyin bewusst
selten (METHODIK §3.2, Anker Samantha Tan). Nachlese-Leaks geschlossen:
`Shaikh:962` u. a. südasiatisch → r2, `Lo/Lai/Tam/Kwan` u. a. HK-kantonesisch
→ r3 (METHODIK §3.1).

## §3 Sichtprobe (15 Vollnamen je geänderter Region, Seed 42)

**GRE r0** — Thanos Kritikos · Babis Papachristou · Andreas Tsekouras ·
Argiris Konstantopoulos · Vangelis Lazarou · Ilias Kyriakopoulos · Iasonas
Grigoriadis · Manolis Sideris · Andreas Tzimas · Xristos Stergiou · Babis
Chronopoulos · Thodoris Stefanakis · Argiris Spiliopoulos · Vagelis Chatzis ·
Georgios Papoutsis

**CAN r2 (südasiatisch, ab 1990)** — Anil Mohammad · Amit Thind · Kevin Patel ·
Gaurav Singh · Ahmed Hasan · Hassan Reddy · Raj Gandhi · Mohamed Bal · Ahmad
Sidhu · Kevin Dhillon · Gurpreet Singh · Justin Sidhu · Muhammad Kumar ·
Ahmad Mistry

**CAN r3 (ostasiatisch, ab 1990, NEU)** — Kai Chau · Danny Wong · Simon Song ·
Ryan Kang · Benjamin Lau · Alvin Tse · Anthony Nguyen · Robert Chow · Calvin
Wang · Jonathan Chan · Anthony Han · Alex Tam · Joel Yuen · Jonathan Wang ·
Erik Wang

(Übrige Regionen unverändert plausibel — voller Lauf in `run-ausbau.txt`.)

## §4 Negativprobe — 37/37 bestanden (Welle-1-Proben 25/25 unberührt)

| Probe | Soll | Ist |
|---|---|---|
| GRE „Nikos Hoxhaj" / „Dimitris Malaj" / „Giorgos Shahzad" / „Kostas Pappa" | unziehbar | ✅ ∅ |
| GRE „Giorgos Papadopoulos" / „Nikos Georgiou" | ziehbar | ✅ r0 |
| CAN „Sandeep Tsang" / „Anil Phan" / „Wei Dhillon" | unziehbar | ✅ r2×r3 = ∅ |
| CAN „Sandeep Singh" / „Kevin Tsang" | ziehbar | ✅ r2 / r3 |
| BEL „Mohamed Peeters" (D3-Doku) | unziehbar | ✅ Filter |
| Welle 1 (Sven Dogan, Jacques Müller, Jacques Peeters, …) | wie gehabt | ✅ 25/25 |

## §5 BEL r2 — begraben (D3)

Kein Fahrer mit BEL-Lizenz und Maghreb-Hintergrund belegbar; die real
existierenden Fahrer der Szene (Taoufik, Benyahia, Zanfari) starten unter
**MAR**-Lizenz und werden im Spiel bereits von der MAR-Namenswelt abgedeckt.
Filter bleibt — Begründungskette METHODIK-AUSBAU §4. **Punkt zu.**

## §6 Einbau-Checkliste (Opus)

1. **Automatisch** beim nächsten `node build-names-v3.js`: GRE-Bans
   (`BAN_FIRST.GRE`/`BAN_LAST_ADD.GRE`), CAN-Routen (`ROUTE_FIRST.CAN`,
   `ROUTE_LAST_ADD.CAN`), r3-Region (`NEW_REGIONS.CAN`-push), Gewichte
   (`WEIGHT_PROPOSALS.CAN`).
2. **Drei manuelle Build-Edits** (Kopf `region-defs.js`, sonst Split wirkungslos):
   (a) `CFG.CAN.route`: `[SOUTH_ASIAN|EAST_ASIAN → 2]` → `[SOUTH_ASIAN,2],[EAST_ASIAN,3]`
   (b) `OPS.CAN.move.last`: `Lau/Cheng/Chung` 2→3
   (c) `REGION_PATCHES`-Wiring-Schleife (3 Zeilen, nach NEW_REGIONS-push, vor WEIGHT_PROPOSALS)
3. Regressionscheck: `node classify-forenames.js` → Negativprobe **37/37**,
   Ausgabe gegen `run-ausbau.txt` diffen.
