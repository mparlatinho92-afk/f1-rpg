# Paket 6 — Delta-Spec: Fiktive Team- & Sponsornamen

> Baut auf `fable-deliverables/FABLE-GRUNDREGELN.md` auf.

**Deliverable:** `paket6-team-sponsor-namen/team-name-pools.js` — nationskohärente
Konstrukteurs- + Sponsor-Namensbausteine je Ära, analog `data/names.js`.

## 0. ⚠️ ABHÄNGIGKEIT — Opus-Feature MUSS zuerst existieren
Es gibt **keine Team-Generierung** im Code (`grep generateTeam/createTeam/privateer` =
leer). Teams stammen ausschließlich aus SEASON_DATA-Templates. Fables Namenspool ist
**wirkungslos**, bis Opus einen Generator baut. Reihenfolge deshalb:
1. **Opus-Feature (Code, NICHT Fable):** ein `generateTeam(year, nation)` /
   Privateer-Entry-Generator inkl. Einhängen in den Grid-Fill bei dünnem Feld + Balancing
   (car speed / reliability der neuen Rennställe). Feature-Entscheidung mit dem Nutzer.
2. **Erst danach** greift dieses Fable-Deliverable.
→ Paket 6 ist damit **niedrigere Priorität** als 1–5 & 7.

## 1. Fable-Deliverable (unabhängig von Stufe 1 schreibbar)
Bausteine, aus denen der Generator Namen komponiert:
- **Konstrukteur:** Gründer-Nachname (aus `data/names.js` ziehbar) + ära-/nation-typischer
  Suffix. Pools je Nation/Ära: z.B. IT „Automobili …/Corse", GB „… Racing/Engineering",
  FR „Écurie …", DE „… Motorsport/Rennsport". Plus vereinzelt neutrale Fantasienamen.
- **Sponsor-Titel (optional, ära-abhängig):** e50 meist **ohne** Titelsponsor; ab e76
  fiktive Marken-Muster (Tabak-/Öl-/Elektronik-Anmutung, **erfunden**); e10 korporativ.

## 2. Slots / Struktur
```js
TEAM_NAME_POOLS = {
  constructorSuffix: { it:[...], gb:[...], fr:[...], de:[...], generic:[...] },
  sponsorTitle:      { e50:[], e62:[...], e76:[...], e94:[...], e10:[...] },
  standaloneNames:   { e50:[...], ... }   // komplette Fantasienamen
};
```

## 3. Leitplanke — Marken-/Echtnamen-Verbot
**Keine realen Team- oder Sponsornamen** (Ferrari, McLaren, Marlboro, Martini …) — alles
muss klar **fiktiv** sein (Trademark + Verwechslung mit echten Rennställen vermeiden).
Nationskohärenz wie bei den Fahrernamen (Grundregel-Konsistenz mit Paket A).

## 4. Opus-Vorarbeiten
1. **Zuerst** das Generator-Feature (s. §0) — sonst kein Andockpunkt.
2. Danach Pools inline + Komponier-Logik (Gründer-Name + Suffix + optional Sponsor).
3. Schema/Changelog/manage-v.

## 5. Testfälle (Fable liefert)
Je 3 komponierte Beispielnamen für IT/GB/FR/DE in 2 Ären, damit Opus Morphologie +
Fiktivität prüfen kann.
