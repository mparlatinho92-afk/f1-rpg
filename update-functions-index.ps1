# update-functions-index.ps1
$SchemaPath = "schemas/functions.schema.json"

# Indizierte Quellen. index.html steht ZUERST und bleibt die Leitdatei: dort
# gefundene Funktionen bekommen kein "file"-Feld, ihre Zeilennummern gelten
# wie bisher fuer index.html. Alles andere wird mit "file" markiert.
# Nicht dabei: zielflagge/three.min.js (Fremdcode, minifiziert - eine Zeile
# mit tausenden Treffern) und test-*.js (Werkzeug, wie tests/ im Hauptprojekt).
$Quellen = @(
    "index.html",
    "zielflagge/index.html",
    "zielflagge/wagen.js",
    "zielflagge/colors.js",
    "zielflagge/build-colors.js"
)

# WICHTIG: explizit UTF-8 lesen, sonst liest Windows PowerShell 5.1 (via manage-v/powershell.exe)
# die Datei als ANSI -> Umlaute (z.B. "ergaenzen") werden bei jedem Lauf zu Mojibake aufgeblaeht.
$Schema = (Get-Content $SchemaPath -Raw -Encoding UTF8) | ConvertFrom-Json

$Inhalte = @{}
foreach ($Q in $Quellen) {
    if (Test-Path $Q) {
        $Inhalte[$Q] = Get-Content $Q -Encoding UTF8
        Write-Host ("Scanne {0} ({1} Zeilen)..." -f $Q, $Inhalte[$Q].Count) -ForegroundColor Cyan
    } else {
        Write-Host "WARN: $Q nicht gefunden, uebersprungen" -ForegroundColor Yellow
    }
}

# Catch: function foo(   /   const foo = function(   /   const foo = (   /   const foo = async (
function Get-FuncPattern([string]$Name) {
    return "(function\s+$Name\s*\(|const\s+$Name\s*=\s*(async\s+)?(function|\())"
}

$IndexedFunctions = @{}
foreach ($Category in $Schema.PSObject.Properties.Name) {
    if ($Category -like '$*') { continue }
    foreach ($Function in $Schema.$Category.PSObject.Properties.Name) {
        $Pattern = Get-FuncPattern $Function
        foreach ($Q in $Quellen) {
            if (-not $Inhalte.ContainsKey($Q)) { continue }
            $Match = $Inhalte[$Q] | Select-String -Pattern $Pattern | Select-Object -First 1
            if ($Match) {
                $Schema.$Category.$Function.line = $Match.LineNumber
                if ($Q -ne "index.html") {
                    $Schema.$Category.$Function | Add-Member -NotePropertyName "file" -NotePropertyValue $Q -Force
                }
                $IndexedFunctions[$Function] = $true
                break   # erste Quelle gewinnt, index.html zuerst
            }
        }
    }
}

# Suche nach verwaisten Funktionen (nicht im Index)
# Nur Top-Level-Funktionen: max 10 Leerzeichen Einrueckung (schliesst Inner-Helpers aus)
# Mindestlaenge 4 Zeichen (schliesst k, t, aR, etc. aus)
$TopLevel = "(^ {0,10}function\s+([a-zA-Z0-9_]+)\s*\(|^ {0,10}const\s+([a-zA-Z0-9_]+)\s*=\s*(async\s+)?(function|\())"
$Missing = @()
$MissingFile = @{}
foreach ($Q in $Quellen) {
    if (-not $Inhalte.ContainsKey($Q)) { continue }
    $Gefunden = $Inhalte[$Q] | Select-String -Pattern $TopLevel | ForEach-Object {
        if ($_.Matches.Groups[2].Value) {
            $_.Matches.Groups[2].Value          # echtes "function foo("
        } elseif ($_.Matches.Groups[3].Value) {
            # "const foo = (" trifft sonst JEDEN Ternaer und jede geklammerte
            # Zuweisung (const haupt = (farben && farben[0]) || ...). Nur als
            # Funktion zaehlen, wenn in derselben Zeile auch ein Pfeil steht.
            if ($_.Line -match "const\s+" + [regex]::Escape($_.Matches.Groups[3].Value) + "\s*=\s*(async\s+)?function" -or $_.Line -match "=>") {
                $_.Matches.Groups[3].Value
            }
        }
    } | Where-Object { $_ -and $_.Length -ge 4 }
    foreach ($F in $Gefunden) {
        if ($IndexedFunctions.ContainsKey($F)) { continue }
        if ($MissingFile.ContainsKey($F)) { continue }
        $MissingFile[$F] = $Q
        $Missing += $F
    }
}

if ($Missing.Count -gt 0) {
    Write-Host "WARN: $($Missing.Count) Funktionen fehlen im Index - werden eingetragen:" -ForegroundColor Yellow

    # Sicherstellen dass "uncategorized" existiert
    if (-not ($Schema.PSObject.Properties.Name -contains "uncategorized")) {
        $Schema | Add-Member -NotePropertyName "uncategorized" -NotePropertyValue ([PSCustomObject]@{})
    }

    foreach ($FuncName in $Missing) {
        $Q = $MissingFile[$FuncName]
        $LineMatch = $Inhalte[$Q] | Select-String -Pattern (Get-FuncPattern $FuncName) | Select-Object -First 1
        $LineNum = if ($LineMatch) { $LineMatch.LineNumber } else { 0 }

        $Entry = [PSCustomObject]@{ line = $LineNum; desc = "TODO: Beschreibung ergaenzen" }
        if ($Q -ne "index.html") {
            $Entry | Add-Member -NotePropertyName "file" -NotePropertyValue $Q
        }
        $Schema.uncategorized | Add-Member -NotePropertyName $FuncName -NotePropertyValue $Entry -Force
        Write-Host ("  + {0} ({1}:{2})" -f $FuncName, $Q, $LineNum) -ForegroundColor Gray
    }
} else {
    Write-Host "OK: Alle Funktionen im Index erfasst." -ForegroundColor Green
}

# UTF-8 OHNE BOM schreiben (.NET), damit Folge-Laeufe die Datei sauber wieder einlesen
$Json = $Schema | ConvertTo-Json -Depth 10
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $SchemaPath).Path, $Json, $Utf8NoBom)

# ConvertTo-Json formatiert je nach PowerShell-Version UNTERSCHIEDLICH: 5.1 (das
# manage-v ueber powershell.exe startet) richtet die Schluessel spaltenweise aus,
# 7 nimmt zwei Leerzeichen. Ohne Nachformatierung schreibt jeder Wechsel die
# ganze Datei um - 5000 Zeilen Diff fuer eine geaenderte Zeilennummer.
# node vereinheitlicht auf zwei Leerzeichen und LF (.gitattributes: eol=lf).
$Node = Get-Command node -ErrorAction SilentlyContinue
if ($Node) {
    & node "tools/format-schema-json.js" $SchemaPath
    Write-Host "Format vereinheitlicht (tools/format-schema-json.js)." -ForegroundColor DarkGray
} else {
    Write-Host "WARN: node nicht gefunden - JSON-Format haengt an der PowerShell-Version." -ForegroundColor Yellow
}
Write-Host "functions.schema.json aktualisiert!" -ForegroundColor Green
