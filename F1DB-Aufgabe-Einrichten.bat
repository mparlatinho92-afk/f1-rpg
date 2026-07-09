@echo off
echo F1DB Update-Aufgabe wird eingerichtet...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0register-f1db-task.ps1"

echo.
if %errorlevel% == 0 (
    echo ERFOLGREICH! Aufgabe laeuft jeden Montag um 08:00 Uhr.
) else (
    echo FEHLER beim Einrichten - siehe rote Meldung oben.
)
echo.
pause
