# Paket J WELLE 3 — REPORT (Globalisierung + USA/SWE/ZIM + Kurven-Integration)

**Datum:** 2026-07-18 · **Referenzlauf:** `run-welle3.txt` (Seed 42, deterministisch, Negativprobe **52/52**).
Nutzer-Auftrag: Ethnien-Regeln globalisieren statt Land für Land; Apartheid-Gate RSA/ZIM;
ISR-Fund „Daniel Khaled". Einheit: gewichtete Ziehmasse im gebauten Pool („1 von N").

## §1 Globale Vornamen-Klassen (`global-first-filters.js`)

5 Klassen (ARABIC, TURKISH, SOUTH_ASIAN, EAST_ASIAN_PINYIN, HISPANIC) + Nativ-Karte
(EGY/MAR/Golf/TUR/INA/MAS arabisch; IND südasiatisch; Latein-Amerika+ESP/POR hispanisch …).
**Guard-Mechanik:** Klassen-Name wird je Nation nur gebannt, wenn sie ihn **nicht routet**
und er nicht nativ ist — GBR routet Mohammed weiter nach r1, DEN bannt ihn; **kein
Listen-Flickenteppich mehr.** Kollisions-Disziplin: Sami/Elias/Armin/Dino/Denis/Bo/Kai/
Haris/Esteban/Diego/Cristian/Eduardo/Fernando stehen in **keiner** Klasse (nativ-europäisch).

| Nation | Fremd-Vornamen vorher | nachher |
|---|---|---|
| DEN | **9,4 % (1 von 11)** | 0,07 % |
| AUT | 8,0 % (1:13) | 0,69 % (Rest bosnisch-österr. — reale Community, Armin bleibt korrekt) |
| SWE | 6,9 % (1:14) | 0,00 % (arabisch gebannt, ex-jugoslawisch → r1) |
| NED | 4,6 % (1:22) | 0,04 % |
| NOR | 3,4 % (1:30, Varianten-Löcher) | 0,00 % |

## §2 Neue Regionen

| Region | w / minYear | Anker | Wirkung |
|---|---|---|---|
| **USA r1 hispanisch** | 0.12 / — | Almirola, Pedregon (NHRA) | „Carlos Anderson" (war **1 von 11**) strukturell 0; „Kyle Gonzalez" bleibt (Shared-Route + r1-Anglo-Kopf); Kaggle-Gewichte unverändert, Census-Dämpfung bleibt. Nachlese: **~150 hispanische Nachnamen, die HISPANIC nicht kannte** (Cruz 90.877!, Romero, Castro, Fernandez, Gonzales, Garza …) in `USA_HISP_LAST_ADD`; PT-Diaspora (Gomes/Fernandes/Dias) bewusst anglo-gepaart belassen |
| **SWE r1 ex-jugoslawisch** | 0.03 / 2015 | **Dino Beganovic** (Ferrari-Junior, schwed. Lizenz) | -ić/-ović-Nachnamen aus dem BALKAN-Ban in die Route gelöst (Build-Edit e); „Dino Begović" ziehbar, „Dino Andersson"/„Erik Begovic" nicht |
| **ZIM r1 schwarz-simbabwisch** | 0.12 / 1995 | Axcil Jefferies (GP2/F2) | Rhodesien-Pool bleibt bis 1995 korrekt weiß (Apartheid-Analog), danach Shona/Ndebele kuratiert (Moyo/Ncube/Sibanda + Tapiwa/Tendai/Tinashe) |

## §3 Apartheid-Gate RSA + ISR-Fix

- **RSA:** r2-Gate (minYear 1995) existierte, aber **~80 afrikanische Vornamen + 2 Nachnamen
  lagen ungeroutet im r0-TAIL** — „Mbongeni Smith" war 1962 ziehbar. Routen-Listen erweitert
  → r0-Tail sauber (biblische Namen Abraham/Ephraim bleiben bewusst r0: Afrikaaner-Tradition).
- **ISR (Nutzer-Fund „Daniel Khaled"):** Ban listete Khalil, nicht Khaled — **1 von 9**
  ISR-Fahrern trug einen arabischen Nachnamen (10,5 %, 55 Namen). `BAN_LAST_ADD.ISR` mit
  voller Messliste → 0. NICHT gebannt (jüdisch-israelisch): Abutbul, Assaf, Sabag, Habib,
  Mualem; Vornamen Rami/Sami bleiben (auch hebräisch/finnisch). Bestand: Filter, keine Region.
  ⚠ Bestehende Spielstände behalten generierte Namen — der Fix wirkt auf neue Fahrer.

## §4 Kurven-Integration (kritischster Fund der Welle)

Die Paket-I-Kurven (`era-first-names.js`) sind **national** — Einwanderer-Vornamen enthalten
(Header dort: „Routing → Paket J"). Zur Laufzeit zog Region 0 aus der Kurve **am Pool-Routing
vorbei**: „Mehmet Schneider" und „Carlos Faure" lebten seit v0.9.14.82 wieder.
Fix: `ERA_FIRST_EXCLUDE` in `index.html` (GENERIERT von `gen-era-curve-excludes.js` =
Kurvennamen ∩ (exklusiv geroutet ∪ effektiv gebannt); GBR 40, GER 45, ITA 35, FRA 56, USA 32),
`eraFirstArr` filtert damit. **Geteilte Namen (Michael/Brandon/Kyle) bleiben in der Kurve.**
Nebenbefund dabei: 3 Klassen-Kollisionen gefixt (Esteban=Ocon!, Diego/Cristian/Eduardo/
Fernando italienisch-geteilt; GBR-Route beanspruchte Jay/Kian/Rohan exklusiv → jetzt [0,1]).

## §5 Regressionscheck

`classify-forenames.js`: USA/SWE + Guard + Dämpfung emuliert, Negativprobe **52/52**
(Welle 1+2 unverändert grün), eingefroren in `run-welle3.txt`. Rebuild: 675 KB, 0 Warnungen.
Nach Kurven-/Routen-Änderungen: `node gen-era-curve-excludes.js` neu laufen lassen →
Konstante in index.html ersetzen.
