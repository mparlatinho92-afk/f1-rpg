param (
    [Parameter(Mandatory=$true)] [string]$NewVersion,
    [Parameter(Mandatory=$true)] [string]$CommitMsg,
    [Parameter(Mandatory=$false)] [string]$ChangelogPoints = ""
)

# 1. Aktuellste f1-rpg-v*.html finden
$OldFile = Get-ChildItem f1-rpg-v*.html | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$NewFileName = "f1-rpg-v$NewVersion.html"

if (-not $OldFile) { Write-Error "Keine f1-rpg-v*.html gefunden!"; return }

Write-Host "Upgrade: $($OldFile.Name) -> $NewFileName" -ForegroundColor Cyan

# 2. Neue Version durch Kopie erstellen
Copy-Item $OldFile.Name $NewFileName

# 3. Versionsnummer patchen (single- und double-quote-Varianten)
$Content = Get-Content $NewFileName -Raw -Encoding UTF8
$Content = $Content -replace "const VERSION = ['\`"][^'\`"]*['\`"];", "const VERSION = '$NewVersion';"
$Content = $Content -replace '<title>[^<]*</title>', "<title>F1 RPG v$NewVersion</title>"

# 4. Changelog patchen
if ($ChangelogPoints -ne "") {
    $Date = Get-Date -Format "dd.MM.yyyy"
    $BulletLines = $ChangelogPoints -split ";" | ForEach-Object {
        "                            <div>- $_</div>"
    }
    $BulletsJoined = $BulletLines -join "`r`n"

    $NewEntry = "<!-- CHANGELOG -->`r`n                            <div class=`"font-bold text-green-400`">v$NewVersion (aktuell) - $Date</div>`r`n$BulletsJoined"

    # Altes (aktuell)-Label auf grau setzen (PS 5.1 kompatibler Weg ohne ScriptBlock)
    $OldPattern = '(<div[^>]*>)(v[\d.]+ \(aktuell\))(</div>)'
    $OldMatch = [regex]::Match($Content, $OldPattern)
    if ($OldMatch.Success) {
        $OldLabel = $OldMatch.Value
        $NewLabel = $OldLabel -replace ' \(aktuell\)', '' -replace 'text-green-400', 'text-slate-400'
        $Content = $Content.Replace($OldLabel, $NewLabel)
    }

    # Neuen Eintrag einsetzen
    $Content = $Content -replace '<!-- CHANGELOG -->', $NewEntry
}

$Content | Set-Content $NewFileName -Encoding UTF8

# 5. index.html aktualisieren
Copy-Item $NewFileName index.html -Force
Write-Host "index.html aktualisiert" -ForegroundColor Cyan

# 6. Alte Datei ins Archiv verschieben
if (!(Test-Path "archive")) { New-Item -ItemType Directory -Path "archive" | Out-Null }
Move-Item $OldFile.Name "archive/" -Force
Write-Host "Archiviert: $($OldFile.Name)" -ForegroundColor Cyan

# 7. Git
git add $NewFileName index.html
git commit -m "v$NewVersion - $CommitMsg"
git push origin master

Write-Host "Fertig: v$NewVersion ist live!" -ForegroundColor Green
