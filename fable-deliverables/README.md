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
| 5 | Rivalitäts-/Duell-Texte | `paket5-rivalitaeten/SPEC.md` | Stufe A sofort; **5-B nutzt `getH2HHistory` (v0.9.14.62 gebaut ✓)** |
| 6 | Fiktive Team- & Sponsornamen | `paket6-team-sponsor-namen/SPEC.md` | **Zufallsteam-Button v0.9.14.62 gebaut ✓** – Pools lösen Interim-Liste ab |
| 7 | Qualitatives Tuning (Audit) | `paket7-tuning/SPEC.md` | zuletzt (auditiert 1 & 4) |

**Reihenfolge:** 1–4 ✅ alle geliefert → **7 als nächstes** (auditiert 1 & 4) → 5-B/6 (Feature-Blocker sind seit v0.9.14.62 weg).

## Frühere Pakete (bereits eingebaut)
`paketA-*` Namens-Pools, `paketB-*` Saison-Rückblick, `paketC-*` Nachrufe, `paketD-validierung`,
`paketE-validierung`, `paketF-nation-smoothing`, `paketG-driver-market`, `name-data/`, `nation-data/`
— siehe MEMORY.md / die jeweiligen Projekt-Memos.
