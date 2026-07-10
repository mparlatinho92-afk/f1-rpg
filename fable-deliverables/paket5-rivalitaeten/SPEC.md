# Paket 5 — Delta-Spec: Rivalitäts-/Duell-Texte

> Baut auf `fable-deliverables/FABLE-GRUNDREGELN.md` auf.

**Deliverable:** `paket5-rivalitaeten/rivalry-bank.js` — `RIVALRY_BANK` (Pools je
Duell-Typ × Ära) + Assembler `rivalryText(drv, rival, ctx)`. 1–2 deutsche Sätze.

## 0. Datengrundlage — WICHTIGE Einschränkung
Das Driver-Objekt hat `h2hSeason = { rW, rL, qW, qL, _year }` — **nur saisonweise**
(Teamkollegen-Duell des laufenden Jahres, s. `updateDriverReputations` ~L12456). Ein
**mehrjähriges** Rivalitäts-Gedächtnis existiert NICHT.

→ Zwei Ausbaustufen:
- **Stufe A (sofort machbar):** Teamkollegen-Duell **dieser Saison** aus `h2hSeason`.
- **Stufe B (braucht Opus-Feature zuerst):** Jahres-übergreifende Fehde — Opus muss H2H
  erst über Saisons **aggregieren** (neues Feld oder aus `careerScores`). Ohne diese
  Aggregation kein Multi-Jahres-Pool ansprechen.

## 1. Duell-Typen (Pool-Keys)
| Key         | Bedingung (Opus wählt) |
|-------------|------------------------|
| `eng`       | ausgeglichenes H2H (z.B. Differenz ≤2 bei ≥6 Duellen) |
| `dominanz`  | klar einseitig (ein Fahrer deutlich vorn) |
| `augenhoehe`| beide hohe `reputation` + nah in der WM (Topfahrer-Duell) |
| `fehde`     | **Stufe B** — mehrjährig, nur mit Aggregation |

## 2. Slots
`{driver}`, `{rival}` (fertige Namen, nicht deklinieren), `{h2hText}` (**fertige Phrase**,
Opus baut, z.B. „12:8 in den Rennen" / „in Qualifying und Rennen knapp vorn"), `{seasons}`
nur als `{seasonsText}` in Stufe B.

## 3. Leitplanke
- Der Text beschreibt **ausschließlich das sportliche Duell** aus den echten H2H-Zahlen —
  **keine erfundene Feindschaft**, keine off-track-Dramen, keine Zitate, keine reale
  Historie (Senna/Prost etc.) (Grundregel 2). `{h2hText}` muss zu den State-Zahlen passen.
- Neutral gegenüber beiden Fahrern, außer der Typ (`dominanz`) impliziert eine Richtung.

## 4. Einbau-Ort & Determinismus
Fahrer-Profil, nahe der Ansehen-Card (`reputation`-Bereich). Geseedet aus
`driverId|rivalId|year` → stabil pro Profil-Aufruf.

## 5. Mengen
`eng`, `dominanz`, `augenhoehe` × 5 Register × je 5–6 Varianten. `fehde` erst wenn Stufe B
steht.

## 6. Opus-Vorarbeiten
1. **Rivalen-Selektor:** Teamkollege mit meisten H2H-Duellen (Stufe A) bzw. nächster
   WM-/Reputations-Nachbar; `{h2hText}` formatieren.
2. **Nur für Stufe B:** H2H-Aggregation über Saisons (Feature-Entscheidung mit dem Nutzer).
3. `rivalryText` + Profil-Card, Schema/Changelog/manage-v.

## 7. Testfälle (Fable liefert)
Je Typ (eng/dominanz/augenhoehe) 1 Beispiel in e76 + e10 mit gefülltem `{h2hText}`.
