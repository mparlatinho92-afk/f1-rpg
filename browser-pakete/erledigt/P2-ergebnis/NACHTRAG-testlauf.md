# Nachtrag zum Testlauf (28./29.09.2026)

Zwei Punkte fehlten in der ursprünglichen Zusammenfassung und standen nur im Chat,
nicht in `KONZEPT-mehrstimmige-textbanken.md`. Hier nachgetragen:

1. **Der Filter war vor dem echten Testlauf nur mit selbst erfundenen Testzeilen
   geprüft**, nicht mit tatsächlichen Fremd-KI-Antworten. Der Testlauf mit den fünf
   echten Antworten (ChatGPT, Gemini, Kimi, Mistral, Qwen) war der erste Durchlauf
   mit echten Daten.

2. **`{leader}` und `{driver}` schließen sich in derselben Zeile gegenseitig aus.**
   Eine Zeile setzt entweder den Führenden voraus (dann `{leader}`) oder nicht
   (dann `{driver}`), nie beides. Das erzwingt die Regel `LEADER_BOUND` im Skript
   (`filter_kandidaten.py`): Sie lehnt `{driver}` in Zeilen ab, die „führt",
   „Spitze", „vorn" o. Ä. enthalten.
