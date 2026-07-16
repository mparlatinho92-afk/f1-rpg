# Fable-Deliverables — Master-Index

**Fable-Session-Start (Ritual):**
> „Fable-Session: Lies `FABLE-GRUNDREGELN.md` und `paketN-*/SPEC.md`, dann liefere das Deliverable."

Jede SPEC beginnt mit einem ⚠️-Block, der die 3 Kern-Verbote wiederholt – aber die
vollständigen Regeln stehen nur in **`FABLE-GRUNDREGELN.md`** (immer zuerst lesen).

## Grundlage
- **`FABLE-GRUNDREGELN.md`** — 8 verbindliche Regeln für ALLE Text-Pakete. Gilt über jedem Delta.

## Die 7 Erzähl-Pakete

| # | Paket | Spec | Status / Voraussetzung |
|---|-------|------|------------------------|
| 1 | Live-Ticker-Kommentar | `paket1-live-kommentar/SPEC.md` | ✅ **GELIEFERT** (`live-commentary-bank.js`, 2026-07-10, 390 Zeilen validiert) — **Opus-Einbau offen** (reason-Map, 6 addLiveEvent-Tauschstellen; Easter-Egg L9829 = Nutzer-Entscheidung!) |
| 2 | Fahrer-Kurzbiografien (generierte) | `paket2-fahrer-bios/SPEC.md` | ✅ **GELIEFERT** (`driver-bio-bank.js`, 2026-07-10, 217 Zeilen + Assembler, validiert; 7. Archetyp `kaempfer` + **verbindliche Kaliber-Leitplanken** im Header) — **Opus-Einbau offen** (archetype-Klassifikator MUSS Kaliber-Schwellen einhalten, IOC→nationAdj-Map, Profil-Card) |
| 3 | Karriere-Bogen beim Rücktritt | `paket3-karriere-bogen/SPEC.md` | ✅ **GELIEFERT** (`DELIVERABLE.md`, 2026-07-10) — **Opus-Einbau offen** (Slot-Builder + Einhängen, s. Deliverable §A) |
| 4 | Saison-Vorschau | `paket4-saison-vorschau/SPEC.md` | ✅ **GELIEFERT** (`preview-bank.js`, 2026-07-10, 48 Zeilen + `PREVIEW_ERA_WORDS` + Assembler, validiert) — **Opus-Einbau offen** (Favoriten-/Rookie-/Wechsel-Selektoren, 🔮-Card in showOffSeasonModal) |
| 5 | Rivalitäts-/Duell-Texte | `paket5-rivalitaeten/SPEC.md` | ✅ **GELIEFERT komplett A+B** (`rivalry-bank.js`, 2026-07-11, 100 Zeilen: eng/dominanz/augenhoehe/fehde × 5 Register + Assembler, paar-symmetrisch validiert) — **Opus-Einbau offen** (Rivalen-Selektor, h2hText-Builder, Profil-Card) |
| 6 | Fiktive Team- & Sponsornamen | `paket6-team-sponsor-namen/SPEC.md` | ✅ **GELIEFERT** (`team-name-pools.js`, 2026-07-11, 113 Bausteine: 9 Nationen-Patterns mit {name}-Slot + Sponsoren je Ära + Standalone, Kollisions-geprüft) — **Opus-Einbau offen** (Interim-Liste ~L9470 ablösen, Komponierer, IOC→Key-Map) |
| 7 | Qualitatives Tuning (Audit) | `paket7-tuning/SPEC.md` | ✅ **GELIEFERT** (`REPORT.md`, 2026-07-11, erweiterter Scope: alle 7 Bänke) — 4×HOCH (2 Genus-Bugs OBIT, 1 Genus-Bug RECAP-e50, 1 Lore-Fakten-Leck Hailwood) + 7×MITTEL + 8×NIEDRIG, Ersatz paste-fertig — **Opus-Einspielung offen** (Reihenfolge im Report) |
| 8 | Fiktive Strecken- & Rennnamen | `paket8-strecken/SPEC.md` (Fable-Entwurf, Nutzer-Idee 2026-07-11) | ✅ **GELIEFERT v2** (`circuit-name-pools.js`, 375 Bausteine: Orte + Strecken-/Rennnamen-Patterns × **30 Nationen, KEIN generic**; Ära-Mix „früher lokalisiert/Sponsor ab e76", Sponsor-Reuse aus Paket 6, kollisionsgeprüft; optionale Generator-Filter: Länder-Gewichtung + Saison-Ausschluss, SPEC §2b) — **⚠️ Opus-Feature ZUERST: Streckeneditor + Zufalls-Button** (SPEC §0) |

**ALLE 8 PAKETE ✅ GELIEFERT (2026-07-11).** Offen ist nur noch die **Opus-Seite**: (1) Paket-7-Fixes H1–H3 + M1 (M1 VOR dem Paket-1-Einbau!), (2) die 6 Einbauten (1/2/3/4/5/6 — Klassifikatoren, Maps, Verdrahtung, je Schema/Changelog/manage-v), (3) für Paket 8 zuerst das Streckeneditor-Feature (Nutzer-Entscheidung).

## Daten-/Ableitungspakete (kein Text → `FABLE-GRUNDREGELN.md` gilt dort NICHT)

| Paket | Brief | Status |
|-------|-------|--------|
| H | Nachwuchs-Pyramide (Fluss-Parameter & Trichter-Validierung) | `paketH-pyramide/BRIEF.md` — 📤 **BEAUFTRAGT** (2026-07-16), Fable-Lieferung offen. Leitet Verweildauern/Beförderungsquoten je Ebene+Ära, Intake-Nationenverteilung (Basis statt F1-Spitze) und die nationsspezifische Nicht-Beförderungsquote ab; Validierung = `DECADE_NATION_POOLS` muss hinten herausfallen. **Quereinstiege/fremde Serien/Namens-Caps ausdrücklich ausgeschlossen.** |
| J | Ethnisch-kulturelle Regionen (Vor-/Nachnamen-Kohärenz) | `paketJ-ethno-regionen/BRIEF.md` — 📤 **BEAUFTRAGT** (2026-07-17), Fable-Lieferung offen. „Mohammed Schneider"/„Sven Dogan"/„Jacques Müller" verhindern — **Kohärenz funktioniert schon** (Regionen ziehen Vor+Nachname gemeinsam), aber die `route`-Regexe sind **Nachnamen-Muster** → alle Daten-Vornamen landen in Region 0, Minderheitsregionen verhungern (**SUI R2 italienisch: 9 Vornamen/11 Nachnamen bei 11 % Gewicht**; BEL R1 32; CAN R1 28). Kaggle ist national → Namen müssen **klassifiziert** werden. Dazu: `banFirst`→`route` (GER hat keine türkische Region), Regionsgewichte belegen (BEL 55/45 wallonisch/flämisch vs. real ~32/58?). Golf-Expats bleiben ausgeschlossen. |
| I | Ära-Vornamen aus Geburtsjahrgangs-Statistik | `paketI-aera-vornamen/BRIEF.md` — 📤 **BEAUFTRAGT** (2026-07-17), Fable-Lieferung offen. Repariert den `early`-Stub (32 von 33 Split-Nationen haben eff < 25; GER 16 Namen/eff 15) für **GER/GBR/USA/FRA/ITA** aus SSA/INSEE/ONS/GfdS-Jahrgangsdaten. Kaggle kann das prinzipiell nicht (Gegenwarts-Schnappschuss). Ära-Granularität = Fable-Messung (Fenster vs. Kurve `[peak,breite,amplitude]`); GER ist Rang-only → **Zipf auf US/FR/GB eichen**. Budget: Poolgröße wie heute. **Die anderen 28 werden flachgelegt = Opus-Seite.** |

## Frühere Pakete (bereits eingebaut)
`paketA-*` Namens-Pools, `paketB-*` Saison-Rückblick, `paketC-*` Nachrufe, `paketD-validierung`,
`paketE-validierung`, `paketF-nation-smoothing`, `paketG-driver-market`, `name-data/`, `nation-data/`
— siehe MEMORY.md / die jeweiligen Projekt-Memos.
