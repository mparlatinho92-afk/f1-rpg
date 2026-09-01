# Paket 3 — Deliverable: Karriere-Bogen beim Rücktritt (Werdegang-Satz)

Fable liefert **nur Sprache**: den neuen Pool `OBIT_BANK.abschied.werdegang` + optionale
`close`-Erweiterung. Kein neuer Assembler, kein Seeding-Eingriff. Einbau +
`{seasonsText}`/`{peakText}`-Builder = Opus.

---

## A. Slot-Kontrakt (verbindlich für Opus — danach die Builder bauen)

Zwei neue Slots. Damit die Templates unten grammatikalisch tragen, müssen die Builder
**exakt diese Form** liefern (Grundregel 5 — Kasus/Rolle kommt fertig aus dem Builder):

| Slot | Rolle | Form (kleingeschrieben, Assembler kapitalisiert am Satzanfang selbst) | Beispiele |
|---|---|---|---|
| `{seasonsText}` | temporale Adverbialphrase (`nach` + Dativ) | **immer** „nach … Jahren …", Zahl als **Zahlwort** („zwölf", nicht „12") | „nach zwölf Jahren im Feld", „nach acht Jahren im Cockpit", „nach über einem Jahrzehnt an der Strecke" |
| `{peakText}` | **prädikatives Nominal** (Nominativ), muss hinter „war er ___" und hinter Doppelpunkt/Gedankenstrich stehen können | reine Nominalphrase, **ohne eigene Zeitangabe** und **kein** „mit …"-Beginn | „Vizemeister", „ein mehrfacher Rennsieger", „ein verlässlicher Punktesammler", „ein Podestkandidat", „ein Siegkandidat" |

**Warum `{peakText}` zeitfrei sein muss** (Fable-Grammatik-Entscheidung, Grundregel 5):
Die Templates setzen die zeitliche Rahmung selbst („in seinen besten Jahren war er ___",
„zeitweise war er ___"). Ein Zenit-Text mit eigener Zeitangabe würde doppeln:
„in seinen besten Jahren war er *in seiner stärksten Saison* Vizemeister" ← kaputt.
Auch der SPEC-Beispielsatz „mit Rennsiegen in mehreren Jahren" (mit-Phrase) trägt nicht
hinter „war er ___" — bitte als Nominal bauen: „ein mehrfacher Rennsieger".

### Struktur: zwei Unterpools je Kategorie (statt flacher Liste)

Abweichung von der SPEC-Skizze (`champion:[...]`), **bewusst und nötig**: `{peakText}` kann
leer sein (kein klarer Zenit, SPEC §1). Ein flacher Pool würde dann ein `{peakText}`-Template
mit leerem Slot ziehen → „… war er ." (kaputt). Deshalb pro Kategorie:

```
werdegang.<cat> = { mitZenit:[…nutzt {peakText}…], ohneZenit:[…nur {seasonsText}…] }
```

Opus-Auswahl (grammatiksicher, deterministisch — nutzt das bestehende `rng`):

```js
// im Assembler (~L11460), NACH s.push(open...), VOR dem stats-Push:
if (T.seasonsText) {                       // Werdegang nur wenn Debütjahr bekannt
  const wg = bank.werdegang[cat] || bank.werdegang.generic;
  const wpool = (T.peakText && wg.mitZenit.length)
    ? wg.mitZenit.concat(wg.ohneZenit)     // Zenit vorhanden → beide erlaubt
    : wg.ohneZenit;                        // kein Zenit → nur span-Only
  s.push(cap(_recapFill(_recapPick(rng, wpool), T)));
}
```

`T.seasonsText`/`T.peakText` ins Token-Objekt `T` (~L11449) aufnehmen; `''` wenn nicht
berechenbar. Kategorien wie im Assembler: `champion / star / backmarker / gaveup / generic`
(`talent` wird in `retire` nie vergeben — L11434 verlangt `mode !== 'retire'`; Pool liegt
nur zur Robustheit bei).

Hinweis Determinismus: Der zusätzliche `rng`-Zug zwischen `open` und `stats` verschiebt
die `stats`/`close`-Auswahl gegenüber dem alten Code — pro Seed weiterhin stabil (Re-Render
identisch, SPEC §4), nur nicht identisch mit v0.9.14.62-Texten. Unkritisch (0 Bytes Save).

Verwendbare Bestands-Tokens im Werdegang: `{name}`, `{klasseNom/Gen/In}`, `{fahrerPl}`.
`{nameE}` (Lore) bewusst **nicht** — der `open`-Satz hat das Epitheton schon gesetzt,
Wiederholung wäre Kitsch. Werdegang nutzt schlicht „er".

---

## B. Paste-fertige Bank

```js
// An OBIT_BANK.abschied anhängen (Geschwister von open/stats/close):
OBIT_BANK.abschied.werdegang = {
  champion: {
    mitZenit: [
      '{seasonsText} tritt ein Meister ab – einer, der über Jahre {peakText} war.',
      'Der Weg vom Debüt bis zum Titel war weit: über weite Strecken war er {peakText}.',
      'Ehe die Krone kam, war er {peakText} – {seasonsText} endet diese Laufbahn.',
      'Zwischen erstem und letztem Start lag ein weiter Weg: streckenweise war er {peakText}, am Ende ein Champion.',
      'Man vergisst über dem Titel leicht die Jahre davor, in denen er {peakText} war – nun, {seasonsText}, ist beides Geschichte.',
      'Der Titel war das Ziel, der Weg dorthin die Geschichte: über Jahre war er {peakText}.',
      'Ein Champion fällt nicht vom Himmel: lange war er {peakText}, ehe die Krone kam.',
      'Lange bevor der Titel kam, war er {peakText} – {seasonsText} endet der ganze Weg.',
      'Die Krone steht am Ende einer Reihe, die früh begann: schon damals war er {peakText}.',
      'Nicht der Titel allein trägt diese Laufbahn – über weite Strecken war er {peakText}.'
    ],
    ohneZenit: [
      '{seasonsText} verlässt ein Champion das Feld, das er lange prägte.',
      'Vom ersten Start bis zum Titel: {seasonsText} schließt sich ein großer Kreis.',
      'Was als Neulingssaison begann, endet {seasonsText} mit dem Nimbus eines Meisters.',
      'den Weg vom Herausforderer zum Champion hat er vollendet – {seasonsText}.',
      '{seasonsText} legt ein Weltmeister den Helm ab – der Weg dorthin war das eigentliche Denkmal.',
      'Am Anfang stand ein Name unter vielen – am Ende steht ein Meister: {seasonsText} schließt sich der Bogen.',
      '{seasonsText} geht die Ära eines Champions still zu Ende.',
      'Ein Meister geht, und mit ihm ein Maßstab, an dem sich das Feld lange gemessen hat – {seasonsText}.',
      '{seasonsText} endet die Laufbahn eines Champions – das Feld wird sich neu sortieren müssen.',
      'Er hat dem Titel ein Gesicht gegeben; {seasonsText} gibt er das Cockpit zurück.'
    ]
  },
  star: {
    mitZenit: [
      '{seasonsText} geht einer der Schnellen – in seinen besten Jahren war er {peakText}.',
      'Sein Weg kannte klare Höhepunkte: zeitweise war er {peakText}.',
      'Ehe die Jahre ihren Tribut forderten, war er {peakText} – nun, {seasonsText}, ist Schluss.',
      'Der Bogen dieser Laufbahn spannte sich weit – an seinem höchsten Punkt war er {peakText}.',
      '{seasonsText} endet ein Weg, auf dessen Höhe er {peakText} war.',
      'Die Erinnerung sortiert gnädig – hängen bleibt die Zeit, in der er {peakText} war.',
      'Es gab eine Zeit, da war er {peakText} – {seasonsText} ist auch sie vorüber.',
      'Wer die Spitze suchte, fand ihn dort: über Jahre war er {peakText}.',
      'Die Spitze verliert einen, der auf seiner Höhe {peakText} war – {seasonsText}.',
      'Die schnellen Jahre sind gezählt – in ihnen war er {peakText}.'
    ],
    ohneZenit: [
      '{seasonsText} nimmt ein vertrautes Gesicht der Spitzengruppe den Helm ab.',
      'Vom hoffnungsvollen Debüt bis heute reicht sein Weg – {seasonsText} endet er.',
      '{seasonsText} verliert die vordere Region des Feldes einen ihrer Stammgäste.',
      'Er gehörte so lange zum Bild an der Spitze, dass man es für selbstverständlich hielt – {seasonsText} ist damit Schluss.',
      'Er kam als Herausforderer und geht als feste Größe – {seasonsText}.',
      '{seasonsText} verabschiedet sich einer, dessen Name lange vorn mitspielte.',
      '{seasonsText} tritt einer ab, der die Spitze über Jahre mitbestimmt hat.',
      'Sein Weg führte früh nach vorn und blieb dort lange – {seasonsText} endet er.',
      'Man musste ihn nicht suchen, er war meist vorn zu finden – {seasonsText} nicht mehr.',
      '{seasonsText} schließt sich eine Laufbahn, die das Feld an der Spitze mitgeprägt hat.'
    ]
  },
  backmarker: {
    mitZenit: [
      '{seasonsText} tritt einer ab, der selten vorn, aber immer dabei war – in seinen besten Momenten war er {peakText}.',
      'Große Schlagzeilen blieben aus, doch in seinen stärksten Rennen war er {peakText}.',
      '{seasonsText} endet eine Laufbahn der leisen Art – ihr bestes Kapitel: {peakText}.',
      'Wer genau hinsah, fand die Glanzpunkte dieser Jahre: zwischenzeitlich war er {peakText}.',
      'Auch eine leise Laufbahn hat ihre helle Stelle: eine Zeit lang war er {peakText}.',
      '{seasonsText} endet ein Weg ohne Podestglanz – doch es gab die Tage, an denen er {peakText} war.',
      '{seasonsText} endet ein Weg, der öfter hinten als vorn verlief – und doch war er zeitweise {peakText}.',
      'Der Blick auf die Ergebnislisten täuscht: es gab Tage, da war er {peakText}.',
      'Zwischen all den Rennen im Hintergrund steht ein heller Punkt: damals war er {peakText}.',
      '{seasonsText} tritt einer ab, den man leicht übersieht – zu Unrecht, denn einmal war er {peakText}.'
    ],
    ohneZenit: [
      '{seasonsText} verabschiedet sich einer der Unermüdlichen des Mittelfelds.',
      'Vom ersten bis zum letzten Start blieb er sich treu – {seasonsText} ist die Fahrt vorbei.',
      'Ausdauer statt Schlagzeilen – {seasonsText} endet ein ehrliches Fahrerleben.',
      'Er war da, Jahr für Jahr, Startaufstellung für Startaufstellung – {seasonsText} endet diese Beständigkeit.',
      'Kein Pokal erzählt von diesen Jahren – erzählen werden trotzdem viele davon: {seasonsText} ist Schluss.',
      'Er hat dem Feld nie gefehlt, weil er immer da war – {seasonsText} ändert sich das.',
      '{seasonsText} endet eine Laufbahn, die vom Durchhalten erzählt, nicht vom Triumph.',
      'Er hat mehr Rennen beendet, als man ihm zugetraut hätte – {seasonsText} ist sein letztes gefahren.',
      'Das Feld braucht auch die, die einfach da sind – {seasonsText} fehlt einer davon.',
      'Sein Platz war weiter hinten, seine Verlässlichkeit weit vorn – {seasonsText} endet beides.'
    ]
  },
  talent: {
    mitZenit: [
      '{seasonsText} ist überraschend früh Schluss – dabei war er {peakText}.',
      'Kaum entfaltet, schon vorbei: in seiner besten Phase war er {peakText}.',
      'In guten Momenten war er {peakText} – {seasonsText} endet die Laufbahn zu früh.',
      'Die Anlage war unübersehbar – schon früh war er {peakText}.',
      'Der Bogen blieb kurz, doch er hatte seinen Scheitel: zeitweise war er {peakText}.',
      'So schnell die Laufbahn endete – zwischendurch war er bereits {peakText}.',
      '{seasonsText} bricht ein Weg ab, der eben erst Fahrt aufnahm – schon da war er {peakText}.',
      'Der Anfang versprach viel und hielt kurz Wort: früh war er {peakText}.',
      'Es blieb bei einem Aufblitzen – doch in diesem Moment war er {peakText}.',
      'Für ein ganzes Fahrerleben reichte die Zeit nicht, für einen Höhepunkt schon: er war {peakText}.'
    ],
    ohneZenit: [
      '{seasonsText} geht ein Talent, dessen Geschichte kaum begonnen hatte.',
      'Der Weg war kurz, aber vielversprechend – {seasonsText} endet er schon wieder.',
      '{seasonsText} verliert das Feld ein Versprechen, das unerfüllt bleibt.',
      'Was dieser Laufbahn fehlte, war nicht Können, sondern Zeit – {seasonsText} ist sie vorbei.',
      'Zwischen Ankunft und Abschied lag kaum ein Wimpernschlag – {seasonsText} ist es vorbei.',
      '{seasonsText} bleibt vor allem eines zurück: die Ahnung, was möglich gewesen wäre.',
      '{seasonsText} endet eine Laufbahn, die vor allem aus Anfang bestand.',
      'Er hatte das Cockpit kaum erobert, da gab er es schon wieder ab – {seasonsText}.',
      '{seasonsText} tritt einer ab, dessen Bestes das Feld nie zu sehen bekam.',
      'Der Weg brach ab, ehe er seine Richtung gefunden hatte – {seasonsText} ist er zu Ende.'
    ]
  },
  generic: {
    mitZenit: [
      '{seasonsText} endet eine Laufbahn, die ihre Kapitel hatte – das beste: {peakText}.',
      'Ganz ohne Glanz war der Weg nicht: eine Zeit lang war er {peakText}.',
      '{seasonsText} geht einer, der an guten Tagen {peakText} war.',
      'Zwischen Debüt und Abschied lag ein ganzes Fahrerleben – auf dessen Höhe war er {peakText}.',
      'Jede Laufbahn hat ihre beste Zeit – in seiner war er {peakText}.',
      '{seasonsText} endet ein Weg mit Höhen und Tälern – ganz oben war er {peakText}.',
      '{seasonsText} endet ein Fahrerleben mit einer hellen Stelle: eine Zeit lang war er {peakText}.',
      'Nicht jede Laufbahn führt nach ganz oben – diese kam immerhin so weit, dass er {peakText} war.',
      'Was bleibt, ist die beste Phase dieser Jahre, in der er {peakText} war.',
      'Der Weg hatte seine Steigung: an ihrem Ende war er {peakText}.'
    ],
    ohneZenit: [
      '{seasonsText} schließt sich ein weiteres Kapitel des Fahrerlagers.',
      'Vom Debüt bis heute war er Teil des Feldes – {seasonsText} ist damit Schluss.',
      '{seasonsText} verabschiedet sich ein Name, der viele Rennsonntage begleitet hat.',
      'Sein erster Start liegt lange zurück – nun, {seasonsText}, ist sein letzter gefahren.',
      'Viele Starts, viele Sonntage, ein Ende: {seasonsText} ist es soweit.',
      'Die Jahre im Feld haben Spuren hinterlassen – gute wie harte; {seasonsText} endet der Weg.',
      '{seasonsText} endet ein Weg ohne großen Nachhall – und doch war er einer von ihnen.',
      'Er gehörte zum Feld, so lange, dass es ohne ihn ungewohnt sein wird – {seasonsText}.',
      '{seasonsText} verabschiedet sich einer, der seine Rennen gefahren ist und dabei nie auffiel.',
      'Kein großer Bogen, eher eine gerade Linie – {seasonsText} endet sie.'
    ]
  },
  gaveup: {
    mitZenit: [
      '{seasonsText} zieht er den Schlussstrich – dabei war er einst {peakText}.',
      'Es gab bessere Zeiten, in denen er {peakText} war – doch der Antrieb schwand.',
      'Einst war er {peakText} – geblieben ist die Müdigkeit, und {seasonsText} ist Schluss.',
      'Wer nur das Ende sieht, unterschätzt den Anfang: es gab Jahre, da war er {peakText}.',
      'Dass er einmal {peakText} war, macht den leisen Abgang nicht leichter.',
      'Die besten Tage lagen zurück – damals, als er {peakText} war; {seasonsText} lässt er los.',
      'Er war einmal {peakText} – am Ende zählte nur noch, dass es genug war.',
      '{seasonsText} steigt er aus, und kaum jemand erinnert sich noch daran, dass er {peakText} war.',
      'Zwischen der Zeit, in der er {peakText} war, und diesem Abschied liegen zu viele zähe Jahre.',
      'Der Anfang war stark – damals war er {peakText}; das Ende ist leise.'
    ],
    ohneZenit: [
      '{seasonsText} räumt er das Cockpit – ohne Groll, aber ohne Kraft für ein weiteres Jahr.',
      '{seasonsText} war die Kraft aufgebraucht – er geht.',
      'Ohne großen Abgang, nur leise, geht er – {seasonsText} ist der Traum auserzählt.',
      'Irgendwann wog jedes Rennwochenende schwerer als das davor – {seasonsText} legt er die Last ab.',
      'Irgendwann fährt die Lust nicht mehr mit – {seasonsText} steigt er aus.',
      'Der Tank war leer, im übertragenen Sinn – {seasonsText} ist die Fahrt zu Ende.',
      '{seasonsText} gibt er auf, ohne dass es ein einzelnes Rennen dazu gebraucht hätte.',
      'Es gab keinen Bruch, nur ein langsames Nachlassen – {seasonsText} ist Schluss.',
      'Er hat nicht verloren, er hat aufgehört – {seasonsText} ist der Unterschied egal.',
      '{seasonsText} endet ein Weg, der zuletzt nur noch Pflicht war.'
    ]
  }
};
```

### B2. Optionale `close`-Erweiterung (SPEC §Deliverable: „optional reichere close-Varianten")

An `OBIT_BANK.abschied.close` **anhängen** (bestehende 19 bleiben). Ära- und
kategorieneutral (der Pool ist geteilt), passend zum würdevollen Register:

```js
// an OBIT_BANK.abschied.close anhängen:
'Was er dem Sport gegeben hat, steht in keiner Wertung.',
'Ein Cockpit wird frei – die Geschichten daraus bleiben.',
'Wo immer künftig über alte Rennen gesprochen wird, fährt er mit.',
'Die Saisons kommen und gehen – mancher Name bleibt hängen. Seiner gehört dazu.',
'Von nun an gehören die Rennsonntage ihm allein.',
'Abschiede wie dieser erinnern daran, wie schnell die Jahre an der Strecke vergehen.'
```

---

## C. Testfälle (SPEC §6 — montiert: `open → WERDEGANG → stats → close`)

Nur der Werdegang-Satz gezeigt, je Kategorie einmal **mit** und einmal **ohne** `{peakText}`.
Slot-Werte: `{seasonsText}` = „nach zwölf Jahren im Feld" (talent/gaveup: „nach drei/acht
Jahren im Feld"), `{peakText}` = „Vizemeister" bzw. kategoriegerecht.

| Kat. | mit Zenit | ohne Zenit (peakText leer) |
|---|---|---|
| champion | „Ehe die Krone kam, war er Vizemeister – nach zwölf Jahren im Feld endet diese Laufbahn." | „Nach zwölf Jahren im Feld verlässt ein Champion das Feld, das er lange prägte." |
| star | „Sein Weg kannte klare Höhepunkte: zeitweise war er ein Siegkandidat." | „Nach zwölf Jahren im Feld verliert die vordere Region des Feldes einen ihrer Stammgäste." |
| backmarker | „Große Schlagzeilen blieben aus, doch in seinen stärksten Rennen war er ein verlässlicher Punktesammler." | „Ausdauer statt Schlagzeilen – nach zwölf Jahren im Feld endet ein ehrliches Fahrerleben." |
| talent | „Nach drei Jahren im Feld ist überraschend früh Schluss – dabei war er ein Podestkandidat." | „Nach drei Jahren im Feld geht ein Talent, dessen Geschichte kaum begonnen hatte." |
| generic | „Nach zwölf Jahren im Feld geht einer, der an guten Tagen ein Punktekandidat war." | „Nach zwölf Jahren im Feld schließt sich ein weiteres Kapitel des Fahrerlagers." |
| gaveup | „Nach acht Jahren im Feld zieht er den Schlussstrich – dabei war er einst ein Podestkandidat." | „Nach acht Jahren im Feld war die Kraft aufgebraucht – er geht." |

Alle „ohne Zenit"-Zeilen enthalten **kein** `{peakText}` → tragen auch bei leerem Zenit
(Grundregel 5, SPEC §6). Kurzkarrieren ohne Debütjahr → `{seasonsText}` leer → Werdegang
entfällt komplett, `obituaryText` bleibt bei open→stats→close (SPEC §2).

---

## D. Grundregel-Check
- **§2 keine realen Fakten:** `{peakText}` nur aus `careerScores`, `{seasonsText}` nur aus
  `debutYear`/`year` — beides Sim. Templates behaupten keine echten Titel/Siege.
- **§3 Ära-Register:** Ton über `{klasseNom/In}`-Tokens (wie Bestands-`abschied`); alle
  Zeilen ära-neutral formuliert (kein Funk/TV-Vokabular — Pool ist dekadenübergreifend).
- **§5 Grammatik:** Kasus fertig im Slot; kein nacktes Zahlwort + „Jahr(e)" im Template;
  `{peakText}` als invariantes, **zeitfreies** Nominal; Eigenname im Werdegang nur als „er".
- **§6 Volumen:** 8–10 Varianten je Kategorie (4–5 je Unterpool) + 6 neue `close`.
- **§7 tonneutral / §8 0 Bytes:** kein `{nameE}` doppelt; Text zur Laufzeit regeneriert.
