# Paket P4: Textbank Konflikt und Chassis-Flucht

**Erst nach P3.** Am besten im **selben Chat** wie P3 weiterarbeiten. Dann kennst du
die Entscheidungen schon. In einem neuen Chat: `bewertung-entscheidungen.md` mit einfügen.

Du arbeitest für ein Formel-1-Managerspiel (Browser, Deutsch, 1950 bis Zukunft). Du hast
keinen Zugriff auf den Code. Du lieferst **nur Sprache**: Textbausteine, die das Spiel
einsetzt, wenn die Simulation den Fall von selbst erzeugt.

## Grundregeln (verbindlich)

1. **Passiv.** Der Text beschreibt, was passiert ist, und greift nie ein.
2. **Nie echte Erfolge oder Fakten.** Die Spielgeschichte weicht von der echten ab. Ein
   echter Weltmeister kann im Spiel sieglos sein. Also keine Titel, Siegzahlen, echten
   Streitigkeiten oder Zitate. Nur Charakter, Ära und Temperament. Alles Zahlenhafte kommt
   aus den Platzhaltern.
3. **Keine Ursache erfinden**, die das Spiel nicht übergibt. Wenn nur „Teamduell verloren"
   bekannt ist, dann kein „nach dem Streit um die Stallorder in Monza".
4. **Ära-Register:**
   - **e50** 1950–61: heroisch, formell
   - **e62** 1962–75: klassisch, sachlich-respektvoll
   - **e76** 1976–93: TV-Zeitalter, griffiger
   - **e94** 1994–2009: modern, technisch
   - **e10** 2010+: heutiges Broadcast-Deutsch
5. **Platzhalter nicht beugen:** `{driver}`, `{mate}`, `{team}`, `{newTeam}` sind fertige
   Namen. Satzbau so, dass sie unverändert passen (kein Genitiv-s: „der Wagen von
   {team}", nicht „{team}s Wagen").
6. **Tonneutral, wo ein Baustein mehrfach verwendet wird.** Wenn eine Zeile sowohl für
   einen Wechsel nach oben als auch nach unten passen muss, darf sie keinen davon
   voraussetzen.
7. **0 Bytes im Spielstand.** Der Text wird zur Laufzeit neu gebaut. Also nur die
   Platzhalter unten, keine Erinnerung an frühere Saisons.

## Ereignisse — Vorschlag, maßgeblich ist P3

Übernimm die Ereignisliste, die P3 im Abschnitt „Ereignisse, die Texte brauchen" festgelegt
hat. Hat P3 nichts dazu gesagt, gilt dieser Vorschlag:

| Schlüssel | Wann | Platzhalter |
|---|---|---|
| `konflikt_kollege` | Streit zwischen Teamkollegen, beginnt | `{driver}`, `{mate}`, `{team}`, `{year}` |
| `konflikt_team` | Fahrer liegt mit dem Team über Kreuz | `{driver}`, `{team}`, `{year}` |
| `konflikt_ende_wechsel` | Konflikt endet, weil einer geht | `{driver}`, `{team}`, `{newTeam}` |
| `flucht_chassis` | Fahrer verlässt ein abgestürztes Team | `{driver}`, `{team}`, `{newTeam}`, `{year}` |
| `flucht_ins_leere` | Fahrer ist geflüchtet und sitzt wieder in einem langsamen Auto | `{driver}`, `{newTeam}` |
| `ansehen_schlaegt_form` | Ein Team holt ihn trotz schwacher Saison, weil sein Ruf trägt | `{driver}`, `{newTeam}` |

**Wo die Texte stehen:** eine Zeile in der Transfer-Chronik und in den Meldungen zum
Saisonende. Also **eine Zeile, höchstens ~140 Zeichen**, kein Absatz.

## Mengen

8 Zeilen je Ereignis und Ära. Ereignisse, die in einer Ära kaum vorkommen können, dürfen
weniger haben. Sag, welche das sind und warum.

## Rückgabe: genau eine Datei `paket-konflikt-bank.js`

```js
// Paket P4 – Konflikt und Chassis-Flucht. Eine Zeile je Eintrag, Platzhalter in {}.
const KONFLIKT_BANK = {
  konflikt_kollege: { e50: [...], e62: [...], e76: [...], e94: [...], e10: [...] },
  // ...
};
```

Darunter ein Kommentarblock: welche Zeilen grammatisch heikel sind und wo die
Ereignisliste von P3 abweicht.
