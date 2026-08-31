# Prompt zum Weitergeben: Vermischte Spielstände

Unverändert in ein anderes Claude-Code-Projekt kippbar. Nennt keine Dateinamen, keine
Versionsnummern und keine projektspezifischen Begriffe — nur Muster, die in jedem Projekt
mit dauerhaftem Speicher gleich aussehen.

---

Zwei Dinge, unabhängig voneinander.

## 1. Prüfen, ob mehrere Spielstände sich vermischen können

Dieses Projekt speichert dauerhaft — IndexedDB, localStorage, Dateien, egal was. Prüfe
folgende fünf Fragen und antworte mit Fakten aus dem Code, nicht mit Einschätzungen.

**a) Trägt jeder gespeicherte Datensatz die Identität des Spielstands, der ihn geschrieben
hat?** Der typische Fehler: der Schlüssel ist eine reine Fachgröße — Saison, Spieltag,
Jahr, Runde. Zwei Durchläufe schreiben dann unter denselben Schlüssel, und der zweite
liest, was der erste hinterlassen hat. Zeig mir den Schlüssel jedes Stores.

**b) Was passiert beim „Neues Spiel"?** Such alle Einstiegspunkte, die ein neues Spiel
beginnen — es sind fast immer mehr als einer (Neustart, Jahr wählen, Vorlage wechseln,
Notfall-Pfad beim Laden). Prüfe für **jeden** einzeln, ob er den dauerhaften Speicher
wirklich leert oder nur den Zustand im Arbeitsspeicher zurücksetzt. Ein `state = []`
löscht nichts auf der Platte.

**c) Gibt es eine Merkliste „schon gespeichert"?** Viele Projekte führen eine Menge von
Schlüsseln, die bereits geschrieben wurden, um doppelte Schreibvorgänge zu sparen.
Überlebt diese Liste den Start eines neuen Spiels, dann schreibt das neue Spiel seine
Daten **gar nicht** — und der Leser bekommt weiterhin die alten. Das ist die perfideste
Variante, weil nichts abstürzt und nichts leer ist.

**d) Gibt es einen Split zwischen „leichten" und „schweren" Feldern?** Wenn Übersichten
getrennt von Details gespeichert werden, kann eine Hälfte aus dem alten Spiel kommen und
die andere aus dem neuen. Prüfe, ob ein Nachlade-Pfad fehlende leichte Felder aus dem
Arbeitsspeicher ergänzt — dann entsteht ein Zwitter: aktuelle Tabelle über fremden
Ergebnissen.

**e) Der Auto-Save.** Prüfe, ob er schreiben kann, während im Vordergrund ein **anderer**
Spielstand geladen ist. Richtig ist: der Auto-Save gehört zu genau einem Spielstand und
schreibt erst wieder, wenn dieser Spielstand auch geladen ist. Ein Auto-Save, der im
Hintergrund weiterläuft, während der Nutzer etwas anderes geöffnet hat, überschreibt
fremde Daten.

Zeig mir zu jedem Punkt die Fundstelle. Erst danach reden wir über Änderungen.

## 2. Wenn ein behobener Fehler zurückkommt

Diese Regel in die CLAUDE.md aufnehmen:

---
### Ein „behobener" Fehler, der wiederkommt, ist meist alter Datenbestand

Meldet der Nutzer, ein bereits behobener Fehler sei zurück — besonders in einem **neu
angelegten** Spielstand —, dann **zuerst die Daten prüfen, nicht die Logik.**

Der Reflex, den Code erneut zu lesen, ist fast immer falsch. Häufiger ist: der Speicher
enthält noch Datensätze aus einem früheren Durchlauf, und die Anzeige serviert sie
weiterhin. Der Fix greift, er kommt nur nicht zum Zug.

**Wie man das in Minuten statt in Tagen feststellt:** Tragen die erzeugten Kennungen einen
Zeitstempel (viele Generatoren bauen `Date.now()` ein), dann verrät ein Blick auf die
Kennungen eines Datensatzes, **welcher Durchlauf ihn geschrieben hat**. Liegen in einem
Spielstand mehrere Zeitstempel-Generationen nebeneinander, ist die Sache entschieden,
bevor man eine einzige Zeile Logik gelesen hat.

**Nie ohne Beleg entwarnen.** „Sollte jetzt gehen" ist keine Aussage. Entweder man kann
zeigen, aus welchem Durchlauf ein Datensatz stammt, oder man weiß es nicht.

**Alte Spielstände heilt ein Quell-Fix nicht.** Wer an der Quelle repariert, repariert
neue Daten. Für bestehende Stände braucht es entweder eine Auflösung bei der Anzeige oder
die klare Ansage an den Nutzer, dass dieser Stand betroffen bleibt.
---

## Was uns das gekostet hat

Über eine Woche Fehlersuche an der falschen Stelle, bis die Sitzung entnervt abgebrochen
wurde. Der Nutzer legte extra einen **neuen** Spielstand an und die Fehler waren immer
noch da — was jeden Verdacht auf die Logik lenkte. Tatsächlich war der dauerhafte Speicher
nie geleert worden: Eine Merkliste „schon gespeichert" überlebte den Neustart, das neue
Spiel schrieb seine Jahre deshalb gar nicht erst, und ein Nachlade-Pfad ergänzte die
fehlenden Übersichtsdaten aus dem Arbeitsspeicher. Ergebnis: die Tabelle des neuen Spiels
über den Ergebnissen des alten.

Am Ende standen in **einem** Spielstand Daten aus **drei** verschiedenen Durchläufen. Zu
sehen war das an den Zeitstempeln in den Kennungen — drei Generationen, sauber getrennt
nach Zeitspannen. Diese eine Abfrage hätte die Woche gespart.

Die dauerhafte Lösung war zweiteilig, und beide Teile werden gebraucht:

1. **Beim Start eines neuen Spiels wirklich leeren** — an *allen* Einstiegspunkten, und
   auch die Merklisten im Arbeitsspeicher zurücksetzen, nicht nur die Stores.
2. **Jeder Datensatz bekommt beim Schreiben die Kennung seines Spielstands**, und beim
   Lesen wird danach gefiltert. Damit kann selbst ein übersehener Rest nicht mehr in einen
   fremden Spielstand durchschlagen. Der Gürtel allein genügt nicht, es braucht auch die
   Hosenträger.
