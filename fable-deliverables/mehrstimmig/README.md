# Mehrstimmige Textbanken: Fremd-KIs für alle Fable-Satzbanken

## Für dich: zwei Schritte

1. **Briefing schicken:** Datei aus `briefings/` öffnen (eine je Pool, z. B. `ticker.pit.md`),
   bei Ticker/Bio/Duell die Ära im Auftragskasten eintragen, ganz in einen **neuen** Chat bei
   Gemini, ChatGPT, Kimi … kopieren. Rückblick, Vorschau, Nachruf, Abschied: nichts ändern.
2. **Antworten zurückbringen:** in den Claude-Code-Chat kopieren, mit KI-Name und Pool/Ära
   dazu – oder als `kandidaten/<pool>_<ära>/<ki>.txt` ablegen.

Alles Weitere (Filter, Lesung, Einbau, Test, `manage-v`-Vorschlag) macht Claude Code.

---

## Für Claude Code: Werkzeuge und Hintergrund

Das Verfahren aus Paket 1b (`rain_arrives` e76, fünf Fremd-KIs) gilt jetzt für **jede**
Satzbank des Spiels. Begründung und Regeln gegen Stil-Dominanz:
`browser-pakete/erledigt/P2-ergebnis/KONZEPT-mehrstimmige-textbanken.md`.

## Was abgedeckt ist (83 Pools)

| Gruppe | Bank in `index.html` | Paket | Ära-Achse | Pools |
|---|---|---|---|---|
| `ticker.*` | `LIVE_COMMENTARY` | 1 + 1b | ja (je Pool) | start, pit, overtake, dnf_mechanical, dnf_accident, death, finish, wet_start, rain_arrives, track_drying, red_flag, red_flag_wet, restart_new, restart_resume |
| `rueckblick.*` | `RECAP_BANK` | B | zeitlos | opener/duell (dominant, knapp, normal), special (rookie, underdog, mostWinsLost, poleKing), team, tragik, closer |
| `vorschau.*` | `PREVIEW_BANK` | 4 | zeitlos | verteidiger, favorit (3), rookie (2), wechsel, closer |
| `nachruf.*` | `OBIT_BANK.nachruf` | C | zeitlos | open je Kategorie (5), stats, close |
| `abschied.*` | `OBIT_BANK.abschied` | C + 3 | zeitlos | open je Kategorie (6), werdegang je Kategorie × mit/ohne Zenit (12), stats, close |
| `bio.*` | `DRIVER_BIO_BANK` | 2 | kern: ja, farbe: zeitlos | kern + farbe je Archetyp (7) |
| `duell.*` | `RIVALRY_BANK` | 5 | ja | eng, dominanz, augenhoehe, fehde |

**Nicht übertragen:** Paket 6 (Team-/Sponsornamen) und Paket 8/8b (Strecken- und Rennnamen).
Das sind Namensbaukästen mit gemessenen Gewichten, keine Sätze; dort gibt es keinen Stil zu
mischen. Paket P4 (Konflikt-Textbank) existiert im Spiel noch nicht; wenn es kommt, braucht es
nur Einträge in `pools.py`.

## Ablauf (Claude Code)

```
python filter_kandidaten.py --liste                       # alle Pools, Ären, Bestand je Ära
python briefing.py --pool ticker.pit --era e76            # -> briefings/ticker.pit_e76.md
```

1. **Briefing** schickt der Nutzer (s. oben). `briefing.py --alle` erzeugt `briefings/` neu,
   nach jeder Änderung an `pools.py`.
2. **Antworten**, die im Chat kommen, als `kandidaten/<pool>_<ära>/<ki>.txt` ablegen
   (zeitlose Pools: `kandidaten/<pool>/`).
   Das Kürzel ist die erste Buchstabenfolge des Dateinamens: `Qwen3.7-plus.txt` → `qwen`.
   Claude ist eine Quelle wie jede andere (`claude.txt`).
3. **Filter:** `python filter_kandidaten.py --pool ticker.pit --era e76`
   → `ergebnis/<pool>_<ära>/` mit `report_*.txt`, `survivors_*.tsv`, `auswahl_*.js`.
4. **Agenten-Lesung:** Claude Code liest `survivors_*.tsv` und schreibt Streichungen nach
   `kandidaten/<pool>_<ära>/streichungen.txt` (`kimi:14  Grund`). Nur Regelbruch, Ära-Fehler,
   Grammatik – nie Geschmack. Dann Schritt 3 wiederholen.
5. **Einbau:** `auswahl_*.js` enthält nur die **neuen** Zeilen; sie werden an das Ende des
   bestehenden Arrays gehängt (Pfad steht in der ersten Zeile der Datei).

## Unterschiede zum ersten Lauf (P2)

| | P2 (`browser-pakete/erledigt/P2-ergebnis/`) | hier |
|---|---|---|
| Pools | 7 Regen-/Flaggen-Pools fest im Skript | 83 Pools in `pools.py` |
| Bestand | Claude-Zeilen aus einer Paket-JS als Quelle „claude“ | direkt aus `index.html` (`bestand.js`); **bleibt vollständig**, neue Zeilen werden nur gegen ihn auf Ähnlichkeit geprüft |
| Ausgabe | ganzes Array | nur neue Zeilen zum Anhängen |
| Ära | immer Pflicht | zeitlose Pools ohne `--era`; zeitgebundene Wörter werden dort markiert |
| Briefing | von Hand je Paket | `briefing.py` je Pool, nur die Platzhalter, die das Spiel wirklich übergibt |
| Fahrer-Slot `{leader}`→`{driver}` | alle Pools mit `{leader}` | nur wo das Spiel `{driver}` auch übergibt (bisher `rain_arrives`); sonst wären die Zeilen nie belegbar |

## Die Prüfregeln sind gegen den Bestand kalibriert

```
python filter_kandidaten.py --kalibrieren
```

prüft alle Bestandszeilen gegen die eigenen Regeln. **Stand 01.10.2026: 2.167 Zeilen, 0 abgelehnt.**
Wer eine Regel in `pools.py` verschärft, lässt das danach laufen. Ablehnungen im Bestand heißen:
Regel zu scharf **oder** Bestandszeile bricht eine Regel – beides vor dem Einsatz klären.

Die erste Fassung lehnte **214** Bestandszeilen ab. Die Ursachen sind Messfallen, die bei jeder
neuen Regel wieder zuschnappen:

- **Ziffern in Platzhalternamen:** `{favorit2}` und `{h2hText}` zählten als „Ziffer im Text“
  (der größte Posten). Regeln laufen deshalb nur über den Text **ohne** Platzhalter.
- **Teilwörter:** `Rache` traf „Sp**rache**“, `Panne` traf „s**panne**nd“, `Sauber` (Teamname)
  traf das Adjektiv am Satzanfang. Wortgrenzen setzen, Alltagswörter nicht in die Namensliste.
- **Verneinungen:** „gewann nie ein Rennen“, „kein Kandidat für die Pole“, „ohne Berührung“
  sind zulässig. Erfolgs- und Kontaktwörter werden deshalb nur **markiert**, nicht abgelehnt;
  hart abgelehnt werden nur Wörter, die in keiner Verneinung sinnvoll sind (Todesumstände,
  Lebenslauf).
- **Bekannte Vorgeschichte:** In der Vorschau ist „Titelverteidiger“ und „erneut“ beim
  Vorjahresmeister wahr, beim Neuling „erstmals“. Das Verbot „keine Vorgeschichte“ gilt nur
  dort, wo das Spiel sie nicht kennt.
- **Feste Ziffern:** „P1“ im Zielpool und „Runde 1“ im Startpool sind immer wahr und erlaubt.

## Regressionsprüfung

Mit den echten P2-Antworten (`browser-pakete/erledigt/kandidaten/rain_arrives_e76/`, 19
Streichungen) liefert das neue Skript 178 Zeilen aus fünf Quellen (je 18–21 %), 52 `{leader}`
und 36 `{driver}`. P2 hatte 177 Fremdzeilen. Gegen den heutigen Bestand (185 Zeilen) fallen
alle Kandidaten als „zu nah am Bestand“ heraus – richtig, sie sind ja schon drin.

## Dateien

| Datei | Zweck |
|---|---|
| `pools.py` | Pool-Register: Platzhalter mit Bedeutung und Beispiel, Ären, Regeln je Pool |
| `filter_kandidaten.py` | Stufe 1, Auswahl, `--liste`, `--kalibrieren` |
| `briefing.py` | Briefing je Pool (`--alle` erzeugt `briefings/` neu) |
| `bestand.js` | liest einen Pool aus `index.html` (braucht `node`) |
| `briefings/` | fertige Briefings, eins je Pool |

Nur Python-Standardbibliothek; auf diesem PC `python` (3.12), nicht `py` (zeigt auf ein
gelöschtes 3.13). Konsolenausgabe mit Umlauten: `PYTHONIOENCODING=utf8` in Git Bash.
