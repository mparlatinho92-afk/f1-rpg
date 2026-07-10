# Fable-Grundregeln — verbindlich für ALLE Erzähl-/Text-Pakete

Dieses Dokument gilt für jedes Fable-Paket in diesem Projekt (Recap, Nachrufe,
Live-Kommentar, Bios, Karriere-Bögen, Rivalitäten, Vorschau …). Ein paket-eigener
Spec liefert nur noch das **Delta**: Kontextfelder, Kategorien, Mengen, Fallstricke.
Die folgenden acht Regeln stehen darüber und werden im Delta NICHT wiederholt.

---

## 1. Passiv & deterministisch — nie aktiv in die Sim eingreifen
Fable liefert **Lookup-/Phrasen-Bänke**, keinen Steuerungs-Code. Der Text greift nur,
wenn die Simulations-Engine den Fall **emergent** erzeugt (Fahrer stirbt, überholt,
wird Meister …). Nichts wird geskriptet, nichts wird herbeigeführt. Eine Bank darf das
Ergebnis eines Rennens/einer Saison niemals verändern — sie beschreibt nur, was ohnehin
passiert ist.

## 2. NIE reale Erfolge oder Fakten behaupten  ← häufigster Fehler
Die Sim-Zeitlinie weicht von der echten Historie ab. Ein real 7-facher Weltmeister kann
in der Sim sieglos bleiben. Deshalb: **nur Herkunft, Fahrstil, Charakter, Ära, Temperament.**
Verboten sind reale Titel, Siegzahlen, Todesumstände, Karriere-Verläufe, „sein erster Sieg",
„nach seinem Unfall in …". Alles Zahlenhafte/Statistische kommt **ausschließlich** aus den
State-Feldern, die der Delta-Spec benennt. Erfinde nie eine Ursache, die der State nicht
hergibt (z.B. bei einem Ausfall keine Schadensart behaupten, die nicht übergeben wurde).

## 3. Ära-Register statt Einheitston
Der Ton muss zur Dekade passen. Verwende dieselben fünf Register wie Paket B/C:
- **e50** 1950–1961 — heroisch, formell, Grand-Prix-Pathos
- **e62** 1962–1975 — klassisch, sachlich-respektvoll
- **e76** 1976–1993 — TV-Zeitalter, griffiger
- **e94** 1994–2009 — modern, technisch
- **e10** 2010+ — heutiges Broadcast-Deutsch, schneller

Ein 2010er-Satz darf nicht in einem 1955er-Rennen erscheinen und umgekehrt.

## 4. Reine Datenstruktur, paste-fertig
Liefere JS-Objekte/Arrays (Phrasen-Pools, Register-Wortlisten, ggf. ein Assembler), **inline-fähig**
(kein neues `data/*.js` — wird wie `MOTORSPORT_NATION_BLEND` direkt in `index.html` eingebettet).
Keine Prosa-Absätze, die Opus erst zerlegen muss. Platzhalter-Slots klar und einheitlich
benannt: `{driver}`, `{team}`, `{victim}`, `{lap}`, `{year}` usw. — der Delta-Spec legt die
exakte Slot-Liste je Paket fest.

## 5. Grammatik-Disziplin bei Slots (Deutsch)
- **Kasus-Tokens nie mischen.** Zahl-/Nominalphrasen kommen fertig im richtigen Kasus vom
  Assembler (`{gapAkk}`, `{siegeDat}` …), nie nackte Zahl + „Sieg(e)" im Template selbst bilden.
- **Verb-Kongruenz-Fallen** vermeiden: keine Konstruktionen, deren Verb-Numerus vom Zahlwert
  abhängt („trennte(n) …") — auf invariante Formen umbauen.
- **Ära-Wort-Tokens** haben feste grammatische Rollen (Subjekt/Genitiv/Präpositionalphrase);
  der Delta-Spec kommentiert sie. Neue Phrasen müssen die Rolle respektieren.
- Eigennamen (`{driver}`, `{victim}`) nicht deklinieren — Templates so bauen, dass der Name
  im Nominativ oder als unveränderliches Objekt steht.

## 6. Volumen gegen Monotonie
Je häufiger ein Baustein feuert, desto mehr Varianten braucht er. Der Delta-Spec nennt pro
Kategorie eine Mindestzahl. Optional Gewichte für seltene/pointierte Varianten. Zwei
aufeinanderfolgende identische Zeilen sollen unwahrscheinlich sein.

## 7. Deutsch — und tonneutral wo nötig
Spielsprache ist Deutsch. Bausteine, die in mehreren Kontexten wiederverwendet werden
(z.B. ein Fahrer-Epitheton für **Tod UND Abschied**), müssen in allen davon funktionieren —
also keine Formulierung, die nur zu einem der Fälle passt (Paket-C-Lehre).

## 8. Speicher: 0 Bytes gespeicherter Text
Text wird zur **Laufzeit** aus leichten State-Feldern regeneriert, nicht im Save abgelegt.
Fable nutzt nur die Kontextfelder, die der Delta-Spec als „verfügbar" markiert. Wenn ein
Paket dennoch determinismus-pflichtig ist (z.B. Recap muss beim Re-Render identisch bleiben),
sagt das der Delta-Spec — sonst genügt einfacher Zufall.

---

### Aufgabenteilung (zur Erinnerung)
- **Opus** definiert das Interface (verfügbare State-/Event-Felder, Slot-Namen, Einbau-Ort),
  liefert nötige Übersetzungs-/Hilfsmaps und verdrahtet die Bank chirurgisch.
- **Fable** füllt ausschließlich die **Sprache** (Pools, Register, Varianz, Ton).
- **Nicht an Fable:** Zahlen-Kalibrierung, Sim-Balancing, Nationen-Frequenz-Mathematik,
  alles mit statistischen Ankern.
