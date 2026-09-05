param (
    [Parameter(Mandatory=$true)] [string]$NewVersion,
    [Parameter(Mandatory=$true)] [string]$CommitMsg,
    [Parameter(Mandatory=$false)] [string]$ChangelogPoints = ""
)

# 0. Zeichenkodierung pruefen (Riegel, v0.9.15.86)
# In data/seasons.js standen jahrelang "Pedro Rodriguez" und "Francois Mazet" als
# UTF-8-Bytes, die einmal als Latin-1 gelesen worden waren. Der Fehler ist still - das
# Spiel laeuft, nur der Name ist falsch - und wanderte ueber die Templates in jeden
# Spielstand. Ueber den Namen laeuft die histId-Aufloesung, deshalb bricht ein falscher
# Name mehr als nur die Anzeige. Ein Fund bricht die Auslieferung ab.
& node tools/check-encoding.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Abbruch: Zeichenkodierung reparieren, dann erneut ausfuehren." -ForegroundColor Red
    exit 1
}

# 1. Aktuellste f1-rpg-v*.html finden
$OldFile = Get-ChildItem f1-rpg-v*.html | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$NewFileName = "f1-rpg-v$NewVersion.html"

if (-not $OldFile) { Write-Error "Keine f1-rpg-v*.html gefunden!"; return }

Write-Host "Upgrade: $($OldFile.Name) -> $NewFileName" -ForegroundColor Cyan

# 2. Neue Version aus index.html erstellen (primaere Editierdatei)
Copy-Item index.html $NewFileName

# 2b. JS-Datendateien inlinieren (data/*.js -> Standalone-Monolith)
$Content = Get-Content $NewFileName -Raw -Encoding UTF8
$DataFiles = @("data/f1db.js", "data/hist.js", "data/seasons.js", "data/names.js", "data/era-first-names.js", "data/circuit-layouts.js", "data/presence.js", "data/guest-entries.js", "data/driver-starts.js", "data/venue-pull.js", "data/race-grid.js", "data/home-only.js", "data/places.js", "data/team-nations.js", "data/images.js")
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
    # ZEILENENDE WIE DIE DATEI, NICHT HART CRLF (v0.9.17.34)
    # Hier stand `r`n. Die Zielorte (index.html, Monolith) liegen im Arbeitsbaum als
    # LF vor, sobald ein Werkzeug sie geschrieben hat - der eingefuegte Changelog-Block
    # war damit der einzige CRLF-Teil einer sonst reinen LF-Datei. Mit jedem
    # Versionsschritt kamen ein paar Zeilen dazu (an einem Tag von 4 auf 9), und jedes
    # zeichengenaue Suchen-und-Ersetzen in index.html scheiterte an der Frage, welches
    # Zeilenende gerade gilt. Im Repo faellt das nicht auf: autocrlf=true streift die CR
    # beim Commit ohnehin ab. Das Problem lebt allein im Arbeitsbaum - also dort, wo
    # gearbeitet wird.
    $BulletsJoined = $BulletLines -join "`n"

    $NewEntry = "<!-- CHANGELOG -->`n                            <div class=`"font-bold text-green-400`">v$NewVersion (aktuell) - $Date</div>`n$BulletsJoined"

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

# 6a. Archiv beschneiden (Regel seit 2026-08-14, siehe CLAUDE.md "Archiv-Regel")
# archive/ war auf 496 Monolithen und 2,7 GB gewachsen, bei 1,4 GB freiem Platz.
# Gefahrlos, weil Schritt 7 jede Version COMMITTET, bevor Schritt 6 sie ins Archiv
# schiebt - alle alten Staende liegen in der GitHub-Historie.
# Zurueckholen:  node tools/restore-version.js <version>
$KeepInArchive = 10
$archivDateien = @(Get-ChildItem "archive/f1-rpg-v*.html" -ErrorAction SilentlyContinue)
if ($archivDateien.Count -gt $KeepInArchive) {
    # Die eingecheckten Ausnahmen (nie im Repo gelandete Staende) NIE anfassen.
    $verfolgt = @(git ls-files "archive/" | ForEach-Object { Split-Path $_ -Leaf })
    $sortiert = $archivDateien |
        Where-Object { $verfolgt -notcontains $_.Name } |
        Sort-Object @{ Expression = {
            $v = $_.Name -replace '^f1-rpg-v', '' -replace '\.html$', ''
            try { [version]$v } catch { [version]'0.0.0' }   # _pre u. a. ans Ende sortieren
        } }
    $wegzuwerfen = @($sortiert | Select-Object -SkipLast $KeepInArchive)
    foreach ($alt in $wegzuwerfen) {
        # Sicherung: nur loeschen, was nachweislich in der HISTORIE von origin/master
        # liegt. NICHT `cat-file -e origin/master:<datei>` benutzen - das prueft den
        # AKTUELLEN Stand, und dort ist die Datei ja laengst ins Archiv verschoben.
        $inHistorie = git log origin/master --format=%h -1 -- $alt.Name
        if ($inHistorie) { Remove-Item $alt.FullName -Force }
        else { Write-Warning "Archiv: $($alt.Name) ist NICHT auf origin/master - bleibt liegen." }
    }
    if ($wegzuwerfen.Count -gt 0) {
        Write-Host "Archiv beschnitten: $($wegzuwerfen.Count) alte Version(en) entfernt (letzte $KeepInArchive bleiben)" -ForegroundColor Cyan
    }
}

# 6b. Funktions-Index automatisch aktualisieren
if (Test-Path "update-functions-index.ps1") {
    ./update-functions-index.ps1
}

# 7. Git
git add $NewFileName index.html data/ schemas/functions.schema.json schemas/game-state.schema.json
# Die Werkzeuge selbst mitversionieren: manage-v.ps1 stand nicht in seiner eigenen Add-Liste,
# Aenderungen am Skript blieben dadurch lokal liegen und erreichten das Repo nie.
git add manage-v.ps1 update-functions-index.ps1 manage-v
# Archivierte Monolithen abmelden: Schritt 6 verschiebt die alte Version nach archive/ (gitignored),
# die Loeschung im Wurzelverzeichnis blieb aber ungestaged und sammelte sich Version fuer Version an
# (zuletzt neun offene Loeschungen ueber .31 bis .39). -u wirkt nur auf BEREITS GETRACKTE Dateien und
# ist per Pfadmuster eingegrenzt - so kann kein fremder Arbeitsstand einer Parallel-Session mitgehen.
git add -u -- "f1-rpg-v*.html"
git commit -m "v$NewVersion - $CommitMsg"
git push origin master

Write-Host "Fertig: v$NewVersion ist live!" -ForegroundColor Green
