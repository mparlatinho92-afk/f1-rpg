# Browser-Pakete — Arbeit für claude.ai ohne Projektzugriff

Entstanden 28.09.2026 für die Lücke bis Mittwoch 11:00 (Wochenlimit zurückgesetzt, Setup-PC
tagsüber nicht erreichbar). Jedes Paket ist **eine einzige Datei** und enthält alles, was
Browser-Claude braucht: Regeln, Code-Ausschnitte, Schnittstelle, Rückgabeformat.
**Der Monolith und `index.html` werden nie hochgeladen.**

## Ablauf

1. Google Drive → `Meine Ablage/F1 RPG Browser-Pakete/` → Paketdatei in claude.ai anhängen
   (oder öffnen und den Text kopieren). Ablage-Ordner für Rückläufe: `eingang/` daneben.
2. In einem **neuen** Chat einfügen, dazu ein Satz: „Arbeite dieses Paket ab."
3. Browser-Claude liefert am Ende **eine** Datei (Name steht im Paket). Die speichern
   oder den Chat-Link aufheben.
4. Abends am PC: Datei nach `browser-pakete/eingang/` legen und Claude Code sagen
   „baue Paket Px ein". Den Einbau (Verdrahtung, Schema, Test, `manage-v`) macht Claude Code.

## Die Pakete

| Paket | Art | Aufwand | Braucht dich? |
|---|---|---|---|
| **P1** Strecken-Sprachregister (Fable 8b) | reine Sprache, 26 Nationen | ~1 Fenster | nein |
| **P2** Ticker: Regen + rote Flagge (Fable 1b) | reine Sprache, 6 neue Events | ~1 Fenster | nein |
| **P3** Bewertungssystem: Entscheidungsvorlage | Konzept im Dialog | ~½–1 Fenster | **ja**, du entscheidest |
| **P4** Konflikt-Textbank | reine Sprache | ~½ Fenster | erst **nach P3** |

P1 und P2 sind unabhängig voneinander und können parallel in zwei Chats laufen.

## Warum gerade diese

Alle vier brauchen **kein** Projektwissen, das nicht in der Datei steht. Die Zahlenseite
(Wahrscheinlichkeiten, Balancing, Engine) bleibt bei Claude Code, weil sie Messungen
gegen F1DB braucht, und die gehen nur am PC. Browser-Claude liefert, was es besser
kann als eine Messung: Sprache und Konzept.

## Nach dem Einbau

Paketdatei nach `browser-pakete/erledigt/` verschieben und in
`fable-deliverables/README.md` eintragen (P1 = Paket 8b, P2 = Paket 1b).
