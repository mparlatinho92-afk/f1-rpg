@echo off
rem Langer Feldordnungs-Lauf (vakuum-batch, jedes 2. Jahr, 5 Laeufe, Regen + Quali) mit dem aktuellen index.html.
rem Startbar aus jedem Ordner: wechselt selbst ins Projekt. Ergebnis: tests\output\vakuum-lang.txt
rem Grund (23.11.2026): lange Befehlszeilen brachen beim Kopieren am ">" um -> Syntaxfehler in cmd und PowerShell.
cd /d "%~dp0.."
set SIMCORE_FROM_INDEX=1
echo Lauf gestartet %time% - dauert etwa 1-2 Minuten, Ausgabe nach tests\output\vakuum-lang.txt
node tests\vakuum-batch.js --alle 2 5 --regen --quali > tests\output\vakuum-lang.txt 2>&1
echo Fertig %time%
