# Paket G – Driver-Market-Realismus-Korpus

**Auftraggeber:** Opus (im Namen des Nutzers) · **Bearbeiter:** Fable · **Sprache:** Deutsch

## Zweck

Punkt 2 des Gameplay-Umbaus (Champion→Backmarker verhindern, Rookie→Top-3 verhindern, Reputations-System) soll **auf echten Daten fußen** statt auf Hand-Konstanten. Dieses Paket liefert drei Datentabellen, die Opus in Spiel-Logik gießt.

## Deliverable 1 — Rookie-bei-Top-3 Whitelist („Freifahrtschein-Liste")

**Regel im Spiel:** Generierte/simulierte Rookies dürfen **nie** in einem Top-3-Team debütieren. Der historische Seed bleibt unangetastet (echte Fahrer kommen aus SEASON_DATA). Trotzdem brauchen wir die Liste der **echten Fälle**, in denen ein Fahrer seine **Rookie-Saison** bei einem Team begann, das **in der Vorsaison Top-3 der Konstrukteurs-WM** war — als optionalen Whitelist-Override und zur Kalibrierung, wie selten das real ist.

Für jeden Fall:

| Fahrer | Debütjahr | Team | Konstrukteurs-Rang des Teams in der **Vorsaison** |
|---|---|---|---|

**Wichtig:**
- **Antonelli-Korrektur beachten:** Mercedes war 2024 auf **P4** → unter der strikten „Top-3-Vorsaison"-Regel qualifiziert sich Antonelli **nicht**. Hamilton 2007 (McLaren war 2006 P2/P3-nah) qualifiziert sich. **Grenzfälle P4–P5 bitte separat listen**, damit der Nutzer selbst entscheidet, wie großzügig die Grenze gezogen wird.
- **Ära-Hinweis:** Vor ~1958 ist „Konstrukteurs-WM" fuzzy (erst ab 1958). Fälle davor separat / mit Vorbehalt markieren — in den 1950ern ist der Begriff „Top-3-Team" ohnehin kaum sinnvoll.
- Definition „Rookie" = erste WM-Saison des Fahrers (nicht einzelne Gaststarts davor). Grenzfälle (Teil-Saison-Debüts, Ersatz-Einsätze) kennzeichnen.

## Deliverable 2 — Basisrate: Champion → schlechteres Auto

**Frage:** Wie oft wechselte ein **amtierender Weltmeister** in der Folgesaison (Jahr N+1) in materiell schlechteres Gerät?

Auswertung über alle WDC-Champions (ab 1958, wo Konstrukteurs-WM existiert):
- Anteil, der in N+1 bei einem **Top-3-Auto** blieb,
- Anteil, der ins **Mittelfeld** (Rang 4 bis ~70 %) rutschte,
- Anteil, der zum **Backmarker** rutschte.

Wo möglich unterscheiden: *freiwilliger* Wechsel (z. B. Projekt-Wette) vs. *unfreiwillig* (Team brach ein). Ziel: eine **Retention-Wahrscheinlichkeit** kalibrieren („ein Titelverteidiger rutscht mit p ≈ X nie unter Mittelfeld").

Output: kleine Tabelle + 2–3 Sätze Einordnung.

## Deliverable 3 — Erwartungskurve (Basis für `rel_score` / Reputation)

**Kernstück.** Damit das Spiel „Überperformance" messen kann, braucht es eine **Erwartung**: Welches Renn-Ergebnis ist bei einem Auto von Konstrukteurs-Rang R normal?

Aus echten Renn-Ergebnissen (Datenbasis: F1DB, so weit zurück wie sinnvoll — mind. 1990–2024, gerne mehr) je **Konstrukteurs-WM-Rang des Teams** die **Verteilung der Ziel-Platzierungen seiner Fahrer** ableiten:

| Konstrukteurs-Rang (Saison) | Median-Zielposition | P25 | P75 | mittlere Punkte/Rennen |
|---|---|---|---|---|

- Rang 1 → typische Fahrer-Zielposition ~1–4, Rang 10 → ~15–18 usw.
- Diese Kurve erlaubt Opus: `overperformance = erwartete_position(carRank) − tatsächliche_position`. Positiv = Fahrer holt mehr aus dem Auto → Reputationsgewinn.
- Zusätzlich, falls machbar: **Teamkollegen-Delta** — wie groß ist real die typische Ergebnis-Differenz zwischen den zwei Fahrern desselben Autos? (Kalibriert, wie stark „vs. Teamkollege" in die Reputation einfließen darf, ohne dass ein starker Teamkollege den anderen unfair abwertet.)

## Gewünschtes Output-Format

Ordner: `fable-deliverables/paketG-driver-market/`

1. **`REPORT.md`** — die drei Tabellen + je 2–4 Sätze Einordnung, plus eine **Empfehlung**, welche Konstanten Opus daraus ableiten sollte (Retention-Schwelle, Erwartungs-Lookup als Array, Whitelist).
2. **`whitelist-rookies-top3.json`** — maschinenlesbar: `[{driver, debutYear, team, prevSeasonConstructorRank, borderline:bool, preConstructorsEra:bool}]`.
3. **`expectation-curve.json`** — maschinenlesbar: `[{carRank, medianPos, p25, p75, avgPoints}]`, sowie optional `teammateDelta`.

## Randbedingungen

- Quellenbasis nennen (F1DB-Stand/Jahr). Reproduzierbarkeit vor Perfektion.
- Keine Spiel-Code-Änderungen — reine Daten/Analyse. Einbau macht Opus.
- Wo Daten dünn/uneindeutig sind: lieber markieren als glätten (der Nutzer entscheidet Grenzfälle selbst).
