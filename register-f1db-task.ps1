# Einmalig als Administrator ausführen via F1DB-Aufgabe-Einrichten.bat

# Node.js automatisch finden (kompatibel mit PowerShell 5)
$NodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($NodeCmd) {
    $NodePath = $NodeCmd.Source
} else {
    $NodePath = $null
}

if (-not $NodePath) {
    $candidates = @(
        'C:\Program Files\nodejs\node.exe',
        'C:\Program Files (x86)\nodejs\node.exe',
        "$env:APPDATA\nvm\current\node.exe",
        "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $NodePath = $c; break }
    }
}

if (-not $NodePath) {
    Write-Error 'Node.js nicht gefunden! Bitte Node.js installieren.'
    exit 1
}

Write-Host "Verwende Node.js: $NodePath" -ForegroundColor Cyan

$action = New-ScheduledTaskAction `
    -Execute $NodePath `
    -Argument '"C:\Users\lyric\Documents\F1 RPG HTML\update-f1db.js"' `
    -WorkingDirectory 'C:\Users\lyric\Documents\F1 RPG HTML'

$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At '08:00'

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName 'F1DB Update' `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description 'Laedt woechentlich die neueste f1db-Daten von GitHub (JSON + MySQL)' `
    -Force

Write-Host 'Aufgabe F1DB Update registriert - laeuft jeden Montag um 08:00 Uhr.' -ForegroundColor Green
Write-Host 'Logs: C:\Users\lyric\Documents\F1 RPG HTML\f1db-update.log' -ForegroundColor Yellow
