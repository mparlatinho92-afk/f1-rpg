# Paket 2 — Delta-Spec: Kurzbiografien für GENERIERTE Fahrer

> Baut auf `fable-deliverables/FABLE-GRUNDREGELN.md` auf.

**Deliverable:** `paket2-fahrer-bios/driver-bio-bank.js` — `DRIVER_BIO_BANK` (Pools je
Archetyp × Ära) + Assembler `generatedDriverBio(drv, ctx)`. Deterministische Montage,
2–3 deutsche Sätze.

## 0. Abgrenzung zu Paket C
**Nur generierte Fahrer** (`histId===null` bzw. gen-Präfix). Reale Fahrer haben schon
`DRIVER_LORE`-Epitheta (Paket C) — die NICHT duplizieren. Opus ruft die Bio nur, wenn
`_obitIsReal(drv)===false`.

## 1. Kein `style`-Feld — Charakter wird aus dem Skill-Vektor abgeleitet
Das Driver-Objekt hat **keinen** Persönlichkeits-/Stil-Wert. Verfügbar (aus
`driver-objects.schema.json`): `nation`, `birthYear`→Alter, `debutYear`, `pace`, `rain`,
`consistency`, `experience`, `reputation`, `starts`, `year`. Charakter darf **nur** aus
diesem Vektor + Nation + Ära kommen — nichts erfunden.

**Opus** berechnet daraus einen `archetype`-Key und übergibt ihn; Fable strukturiert die
Pools nach diesen Keys (finale Schwellen legt Opus fest):

| archetype        | grobe Signatur |
|------------------|----------------|
| `regenmeister`   | `rain` deutlich über eigenem Schnitt |
| `metronom`       | hohe `consistency`, mittlere `pace` |
| `draufgaenger`   | hohe `pace`, niedrige `consistency` |
| `rohdiamant`     | jung + hohes `potentialPace`, wenige `starts` |
| `routinier`      | hohe `experience`, älter |
| `allrounder`     | ausgewogen (Fallback) |

## 2. Slots
`{name}`, `{nationAdj}` (deutsches Nationsadjektiv-Nomen, z.B. „der Brasilianer" — **Opus
liefert** aus IOC-Code), `{age}` (nur als fertige Phrase `{ageText}` falls verwendet — s.
Grundregel 5). Keine nackten Zahlen mit Verb-Kongruenz.

## 3. Mengen & Ton
- **6 Archetypen × 5 Register × je 5–6 Varianten.**
- Ton: **charakterisierend, nicht biografisch** — kein erfundener Werdegang, keine
  Ergebnisse, keine Heimatstadt-Details. „Ein {nationAdj}, der im Regen aufblüht" ✓;
  „gewann die Formel 3" ✗ (die Sim hat keine solche Historie für ihn).
- Alters-Stimmigkeit: `rohdiamant`/`talent`-Ton nie für einen 35-Jährigen.

## 4. Determinismus
**Stabil pro Fahrer** (anders als Paket 1): Opus seedet den Pick aus `drv.id`, damit die
Bio bei jedem Profil-Aufruf identisch bleibt. Fable liefert nur die Pools; das Seeding
macht der Assembler wie in Paket B/C (`_recapRng`/`_recapHash`).

## 5. Opus-Vorarbeiten
1. `archetype`-Klassifikator (Skill-Schwellen relativ zum Feld-Schnitt der Ära).
2. IOC→`{nationAdj}`-Map (deutsches Nationsadjektiv-Nomen).
3. Einbau-Ort: Fahrer-Profil-Card (nahe/statt der Skill-Anzeige für generierte Fahrer).
4. `functions.schema.json` (`generatedDriverBio`), Changelog, manage-v (Hotfix, additiv).

## 6. Testfälle (Fable liefert je 1 Beispiel)
Pro Archetyp 1 Bio in 2 Registern (e50 + e10), mit gefüllten Slots, damit Opus Ton +
Alters-/Nation-Passung prüfen kann.
