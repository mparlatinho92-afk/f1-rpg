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

# 2. Neue Version aus index.html erstellen (primaere Editierdatei)
Copy-Item index.html $NewFileName

# 2b. JS-Datendateien inlinieren (data/*.js -> Standalone-Monolith)
$Content = Get-Content $NewFileName -Raw -Encoding UTF8
$DataFiles = @("data/f1db.js", "data/hist.js", "data/seasons.js")
foreach ($jsFile in $DataFiles) {
    if (Test-Path $jsFile) {
        $JsContent = Get-Content $jsFile -Raw -Encoding UTF8
        $placeholder = "    <script src=`"$jsFile`"></script>"
        $inlined = "    <script>`n$JsContent`n    </script>"
        $Content = $Content.Replace($placeholder, $inlined)
        Write-Host "Inliniert: $jsFile" -ForegroundColor Cyan
    } else {
        Write-Warning "FEHLER: $jsFile nicht gefunden - Monolith unvollstaendig!"
    }
}
$Content | Set-Content $NewFileName -Encoding UTF8

# 3. Versionsnummer patchen (single- und double-quote-Varianten)
$Content = Get-Content $NewFileName -Raw -Encoding UTF8
$Content = $Content -replace "const VERSION = ['\`"][^'\`"]*['\`"];", "const VERSION = '$NewVersion';"
$Content = $Content -replace '<title>[^<]*</title>', "<title>F1 RPG v$NewVersion</title>"

# 4. Changelog patchen
if ($ChangelogPoints -ne "") {
    $Date = Get-Date -Format "dd.MM.yyyy"
    $BulletLines = $ChangelogPoints -split ";" | ForEach-Object {
        "                            <div>&#8226; $_</div>"
    }
    $BulletsJoined = $BulletLines -join "`r`n"

    $NewEntry = "<!-- CHANGELOG -->`r`n                            <div class=`"font-bold text-green-400`">v$NewVersion (aktuell) - $Date</div>`r`n$BulletsJoined"

    # Alle bisherigen gruenen (aktuell)-Zeilen auf grau ohne (aktuell)
    $OldPattern = '<div class="font-bold text-green-400">(v[\d.]+\s+\(aktuell\)[^<]*)</div>'
    while ($true) {
        $m = [regex]::Match($Content, $OldPattern)
        if (-not $m.Success) { break }
        $inner = $m.Groups[1].Value -replace ' \(aktuell\)', ''
        $replacement = '<div class="font-bold text-slate-400">' + $inner + '</div>'
        $Content = $Content.Substring(0, $m.Index) + $replacement + $Content.Substring($m.Index + $m.Length)
    }

    # Neuen Eintrag einsetzen
    $Content = $Content -replace '<!-- CHANGELOG -->', $NewEntry
}

$Content | Set-Content $NewFileName -Encoding UTF8

# 5. index.html: Versionsnummer + Changelog aktualisieren (NICHT die inlinierte Daten-Version!)
$IndexContent = Get-Content index.html -Raw -Encoding UTF8
$IndexContent = $IndexContent -replace "const VERSION = ['\`"][^'\`"]*['\`"];", "const VERSION = '$NewVersion';"
$IndexContent = $IndexContent -replace '<title>[^<]*</title>', "<title>F1 RPG v$NewVersion</title>"
if ($ChangelogPoints -ne "") {
    $OldPattern2 = '<div class="font-bold text-green-400">(v[\d.]+\s+\(aktuell\)[^<]*)</div>'
    while ($true) {
        $m2 = [regex]::Match($IndexContent, $OldPattern2)
        if (-not $m2.Success) { break }
        $inner2 = $m2.Groups[1].Value -replace ' \(aktuell\)', ''
        $replacement2 = '<div class="font-bold text-slate-400">' + $inner2 + '</div>'
        $IndexContent = $IndexContent.Substring(0, $m2.Index) + $replacement2 + $IndexContent.Substring($m2.Index + $m2.Length)
    }
    $IndexContent = $IndexContent -replace '<!-- CHANGELOG -->', $NewEntry
}
# Temp-Datei + umbenennen: umgeht Defender/Indexer-Lock auf index.html
$TempIndex = "index.html.tmp"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText([System.IO.Path]::GetFullPath($TempIndex), $IndexContent, $utf8NoBom)
$indexWritten = $false
for ($attempt = 1; $attempt -le 10; $attempt++) {
    try {
        Move-Item $TempIndex index.html -Force -ErrorAction Stop
        Write-Host "index.html Version aktualisiert (src-Tags bleiben erhalten)" -ForegroundColor Cyan
        $indexWritten = $true
        break
    } catch {
        if ($attempt -eq 10) {
            Write-Warning "index.html gesperrt nach 10 Versuchen: $($_.Exception.Message)"
            Remove-Item $TempIndex -ErrorAction SilentlyContinue
        } else {
            Start-Sleep -Milliseconds (500 * $attempt)
        }
    }
}
if (-not $indexWritten) { Write-Warning "index.html manuell auf v$NewVersion setzen!" }

# 6. Alte Datei ins Archiv verschieben (nur wenn andere Version)
if (!(Test-Path "archive")) { New-Item -ItemType Directory -Path "archive" | Out-Null }
if ($OldFile.Name -ne $NewFileName) {
    Move-Item $OldFile.Name "archive/" -Force
    Write-Host "Archiviert: $($OldFile.Name)" -ForegroundColor Cyan
} else {
    Write-Host "Gleiche Version – kein Archiv-Schritt" -ForegroundColor Yellow
}

# 6b. Funktions-Index automatisch aktualisieren
if (Test-Path "update-functions-index.ps1") {
    ./update-functions-index.ps1
}

# 7. Git
git add $NewFileName index.html data/ schemas/functions.schema.json schemas/game-state.schema.json
git commit -m "v$NewVersion - $CommitMsg"
git push origin master

Write-Host "Fertig: v$NewVersion ist live!" -ForegroundColor Green
