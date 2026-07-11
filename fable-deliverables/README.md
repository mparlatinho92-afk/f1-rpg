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
| 6 | Fiktive Team- & Sponsornamen | `paket6-team-sponsor-namen/SPEC.md` | **Zufallsteam-Button v0.9.14.62 gebaut ✓** – Pools lösen Interim-Liste ab |
| 7 | Qualitatives Tuning (Audit) | `paket7-tuning/SPEC.md` | ✅ **GELIEFERT** (`REPORT.md`, 2026-07-11, erweiterter Scope: alle 7 Bänke) — 4×HOCH (2 Genus-Bugs OBIT, 1 Genus-Bug RECAP-e50, 1 Lore-Fakten-Leck Hailwood) + 7×MITTEL + 8×NIEDRIG, Ersatz paste-fertig — **Opus-Einspielung offen** (Reihenfolge im Report) |

**Reihenfolge:** 1–5 + 7 ✅ geliefert → **nur noch Paket 6 offen**. Opus-Seite: erst Paket-7-Fixes H1–H3 + M1 (vor Paket-1-Einbau!), dann die 5 Einbauten.

## Frühere Pakete (bereits eingebaut)
`paketA-*` Namens-Pools, `paketB-*` Saison-Rückblick, `paketC-*` Nachrufe, `paketD-validierung`,
`paketE-validierung`, `paketF-nation-smoothing`, `paketG-driver-market`, `name-data/`, `nation-data/`
— siehe MEMORY.md / die jeweiligen Projekt-Memos.
