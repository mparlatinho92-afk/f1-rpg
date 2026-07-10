# Paket 7 — Delta-Spec: Qualitatives Tuning der bestehenden Text-Bänke

> **⚠️ ZUERST LESEN:** `fable-deliverables/FABLE-GRUNDREGELN.md` (alle 8 Regeln). Kern-Verbote, die hier gelten – egal was unten steht:
> 1. **NIE reale Erfolge/Fakten** (Titel, Siege, echte Karriere/Unfälle) – die Sim-Zeitlinie weicht ab.
> 2. **Ära-Register** e50/e62/e76/e94/e10 – Ton pro Dekade, kein Einheitston.
> 3. **0 Bytes gespeicherter Text** – nur Pools/Assembler, Regeneration zur Laufzeit; Sprache Deutsch.

> Baut auf `fable-deliverables/FABLE-GRUNDREGELN.md` auf.
> **Anderer Typ:** kein Generierungs-Paket, sondern ein **Audit/Review** (wie Paket D/E).
> Fable urteilt, Opus setzt um.

**Deliverable:** `paket7-tuning/REPORT.md` — priorisierte Liste tonaler/grammatischer
Befunde **mit paste-fertigen Ersatz-Varianten**. Fable ändert **keinen** Code.

## 0. Warum Fable hier den Mehrwert bringt
Das ist *Urteil über Sprache bei Skalierung* — genau Fables Stärke und Opus' Schwäche:
Register-Brüche, Monotonie und Ton-Ausreißer über hunderte Phrasen erkennen.

## 1. Zu prüfende Bänke (Opus stellt die Quell-Ausschnitte bereit)
| Bank | Ort (Stand jetzt) |
|------|-------------------|
| `RECAP_BANK` (Rückblick) | index.html ~L10526 |
| `DRIVER_LORE` (238 Epitheta) | ~L10893 |
| `OBIT_BANK` (Nachruf/Abschied) | ~L11147 |
| `LIVE_COMMENTARY` (Paket 1) | nach Einbau |
| `PREVIEW_BANK` (Paket 4) | nach Einbau |
- Opus liefert die Pools als Text (kein Fable-Zugriff auf die 1,4MB-HTML nötig).

## 2. Prüfkriterien (Checkliste je Phrase)
1. **Ära-Konsistenz:** sitzt die Phrase im richtigen Register (kein e10-Ton in e50)?
2. **Ton-Ausreißer:** Kitsch, Pathos-Brüche, unpassende Flapsigkeit (v.a. `death`/Nachruf).
3. **Monotonie:** zu ähnliche Varianten im selben Pool → Vielfalt-Lücke benennen.
4. **Fakten-Leck (Grundregel 2):** implizite reale Erfolge/Umstände?
5. **Grammatik-Slots (Grundregel 5):** Kasus-/Verb-Kongruenz-Risiken bei Zahl-Tokens.

## 3. Report-Format (pro Befund)
- **Bank / Pool / Kategorie / Register**, betroffene Phrase (Zitat).
- **Kriterium** (1–5 oben) + kurze Begründung.
- **Ersatz-Vorschlag** paste-fertig (gleiche Slots, gleiche grammatische Rollen).
- **Schweregrad** (hoch = Fakten-Leck/Grammatik-Bruch; mittel = Register; niedrig = Politur).

## 4. Leitplanke
Vorschläge müssen **dieselben Slots und Slot-Rollen** behalten (sonst bricht der Assembler).
Keine neuen Tokens erfinden, ohne sie als „braucht Opus-Support" zu markieren.

## 5. Opus-Nacharbeit
Genehmigte Ersatz-Varianten einspielen (Bank-Quelle + Inline synchron, s. Paket-B-Regel 5b),
Node-Test, Schema/Changelog/manage-v. Fable committet nichts.
