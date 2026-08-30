# Fable-Deliverables — Master-Index

**Stand: 2026-08-30.** Alle Erzähl-Pakete (1–8) und Daten-Pakete (H/I/J) sind geliefert UND
opusseitig eingebaut. Dieser Index ist Archiv + Restliste; Details zu den Einbauten stehen in
den Projekt-Memos (MEMORY.md).

**Fable-Session-Start (Ritual):**
> „Fable-Session: Lies `FABLE-GRUNDREGELN.md` und `paketN-*/SPEC.md`, dann liefere das Deliverable."

Jede SPEC beginnt mit einem ⚠️-Block, der die 3 Kern-Verbote wiederholt – aber die
vollständigen Regeln stehen nur in **`FABLE-GRUNDREGELN.md`** (immer zuerst lesen).

## Grundlage
- **`FABLE-GRUNDREGELN.md`** — 8 verbindliche Regeln für ALLE Text-Pakete. Gilt über jedem Delta.

## Die 8 Erzähl-Pakete — alle ✅ geliefert + eingebaut

| # | Paket | Spec | Eingebaut |
|---|-------|------|-----------|
| 1 | Live-Ticker-Kommentar | `paket1-live-kommentar/SPEC.md` | ✅ **v0.9.14.69** (`live-commentary-bank.js` → `liveLine`; BANDEIRADA-Sieger-Zeile bewusst behalten, Nutzer-Entscheidung 2026-07-12). **Bank verdoppelt v0.9.17.26** (390 → 650 Zeilen: pit/overtake/dnf je 25, start/finish je 12 pro Ära; death bewusst bei 6) |
| 2 | Fahrer-Kurzbiografien | `paket2-fahrer-bios/SPEC.md` | ✅ **v0.9.14.69** (`driver-bio-bank.js` → 📝-Kurzporträt-Card, nur generierte Fahrer). **Bank verdoppelt v0.9.17.27** (217 → 434 Zeilen: kern 10, farbe 12 → 120 Kombinationen je Archetyp×Ära) |
| 3 | Karriere-Bogen beim Rücktritt | `paket3-karriere-bogen/SPEC.md` | ✅ **v0.9.14.69** (Werdegang-Satz in `obituaryText`, nur mode 'retire') |
| 4 | Saison-Vorschau | `paket4-saison-vorschau/SPEC.md` | ✅ **v0.9.14.69** (`preview-bank.js` → 🔮-Card in `showOffSeasonModal`). **Bank erweitert v0.9.17.30** (48 → 80 Zeilen, alle Pools auf 10) |
| 5 | Rivalitäts-/Duell-Texte | `paket5-rivalitaeten/SPEC.md` | ✅ **v0.9.14.69** (`rivalry-bank.js` → ⚔️-Duell-Card im Profil, nur aktive Fahrer). **Bank erweitert v0.9.17.30** (100 → 160 Zeilen, alle Pools auf 8) |
| 6 | Fiktive Team- & Sponsornamen | `paket6-team-sponsor-namen/SPEC.md` | ✅ **v0.9.14.68** (`team-name-pools.js` → Team-Generator + Grid-Fill-Button) |
| 7 | Qualitatives Tuning (Audit) | `paket7-tuning/SPEC.md` | ✅ **v0.9.14.63/.64** (H1–H4, M1–M7, N1–N4, N6 eingespielt; N5 in keinem Fix-Commit — ob bewusste Auslassung, ist nicht dokumentiert) |
| 8 | Fiktive Strecken- & Rennnamen | `paket8-strecken/SPEC.md` | ✅ **v0.9.14.65** (`circuit-name-pools.js` → Streckeneditor + Zufalls-Button) |

## Daten-/Ableitungspakete (kein Text → `FABLE-GRUNDREGELN.md` gilt dort NICHT)

| Paket | Brief | Status |
|-------|-------|--------|
| H | Nachwuchs-Pyramide | `paketH-pyramide/BRIEF.md` — ✅ geliefert (Commit 8147c89), **Stufe 1 eingebaut v0.9.14.79** (`pickNationIntake` + `PYRAMID_NATION_LADDER`). **Stufe 2/3 (F4 + Kart als echte Ebenen) bewusst vertagt** — s. Restliste. |
| I | Ära-Vornamen (Geburtsjahrgänge) | `paketI-aera-vornamen/BRIEF.md` — ✅ **eingebaut v0.9.14.82** (Gauß-Kurven GER/GBR/USA/FRA/ITA), Nachträge .84/.85/.87/.89 (Trim, F1-Generator, ITA-Vertiefung, RSA/ZIM-Kurvenleihe). |
| J | Ethnisch-kulturelle Regionen | `paketJ-ethno-regionen/BRIEF.md` — ✅ **eingebaut v0.9.14.80**, Ausbau-Wellen .81/.83/.86 + Welle 4/4b (RSA). |

## Offene Reste (Stand 2026-08-30)

1. **Paket H Stufe 2/3:** F4 (~15 Serien) + Kart-WM/EM als echte, browsebare Ebenen.
   Reihenfolge-Regel: Namens-Pool-Vertiefung VOR Seed-Regen-Stufe 4
   (Rezept: `name-data/analysis/pyramid-300kart-nation-demand.md`, Blob-Umbau als Schritt 0).
2. **Paket I:** Kaggle-Ablösung offen; bekannte Grenzen: ITA vor 1999 kuratiert, GBR ohne Schottland.
3. **Paket J:** Cape-Coloured-Anteil RSA r0 18,9 % (zu hoch).
4. ~~**Paket C (Alt-Paket):** Obituary-Text fehlt noch im Nekrolog-Tab~~ — **eingebaut v0.9.17.31** (`_necroObit`, gleiche Regeneration wie Off-Season-Modal). Bank zuvor erweitert v0.9.17.29 (174 → 256 Zeilen).
5. **Paket 7:** Fix N5 nicht auffindbar — bei Gelegenheit gegen `paket7-tuning/REPORT.md` prüfen.

## Frühere Pakete (bereits eingebaut)
`paketA-*` Namens-Pools, `paketB-*` Saison-Rückblick, `paketC-*` Nachrufe, `paketD-validierung`,
`paketE-validierung`, `paketF-nation-smoothing`, `paketG-driver-market`, `name-data/`, `nation-data/`
— siehe MEMORY.md / die jeweiligen Projekt-Memos.
Bank-Erweiterungen v0.9.17.30: `paketB` RECAP_BANK 95 → 156 Zeilen (opener/duell/special/team auf 10, tragik 8, closer 10).
