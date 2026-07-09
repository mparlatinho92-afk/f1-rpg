# update-functions-index.ps1
$SchemaPath = "schemas/functions.schema.json"
# index.html ist die Entwicklungsdatei mit <script src="data/..."> - Zeilennummern gelten fuer index.html
# WICHTIG: explizit UTF-8 lesen, sonst liest Windows PowerShell 5.1 (via manage-v/powershell.exe)
# die Datei als ANSI -> Umlaute (z.B. "ergaenzen") werden bei jedem Lauf zu Mojibake aufgeblaeht.
$Schema = (Get-Content $SchemaPath -Raw -Encoding UTF8) | ConvertFrom-Json
$HtmlContent = Get-Content "index.html" -Encoding UTF8

Write-Host "Scanne index.html..." -ForegroundColor Cyan

$IndexedFunctions = @()
foreach ($Category in $Schema.PSObject.Properties.Name) {
    if ($Category -like '$*') { continue }
    foreach ($Function in $Schema.$Category.PSObject.Properties.Name) {
        # Catch: function foo(   /   const foo = function(   /   const foo = (   /   const foo = async (
        $Pattern = "(function\s+$Function\s*\(|const\s+$Function\s*=\s*(async\s+)?(function|\())"
        $Match = $HtmlContent | Select-String -Pattern $Pattern | Select-Object -First 1
        if ($Match) {
            $Schema.$Category.$Function.line = $Match.LineNumber
            $IndexedFunctions += $Function
        }
    }
}

# Suche nach verwaisten Funktionen (nicht im Index)
# Nur Top-Level-Funktionen: max 10 Leerzeichen Einrückung (schließt Inner-Helpers aus)
# Mindestlänge 4 Zeichen (schließt k, t, aR, etc. aus)
$AllFunctionsInHtml = $HtmlContent | Select-String -Pattern "(^ {0,10}function\s+([a-zA-Z0-9_]+)\s*\(|^ {0,10}const\s+([a-zA-Z0-9_]+)\s*=\s*(async\s+)?(function|\())" | ForEach-Object {
    if ($_.Matches.Groups[2].Value) { $_.Matches.Groups[2].Value }
    elseif ($_.Matches.Groups[3].Value) { $_.Matches.Groups[3].Value }
} | Where-Object { $_ -and $_.Length -ge 4 }

$Missing = $AllFunctionsInHtml | Where-Object { $IndexedFunctions -notcontains $_ }

if ($Missing) {
    Write-Host "WARN: $($Missing.Count) Funktionen fehlen im Index - werden eingetragen:" -ForegroundColor Yellow

    # Sicherstellen dass "uncategorized" existiert
    if (-not ($Schema.PSObject.Properties.Name -contains "uncategorized")) {
        $Schema | Add-Member -NotePropertyName "uncategorized" -NotePropertyValue ([PSCustomObject]@{})
    }

    foreach ($FuncName in $Missing) {
        $LineMatch = $HtmlContent | Select-String -Pattern "(function\s+$FuncName\s*\(|const\s+$FuncName\s*=\s*(async\s+)?(function|\())" | Select-Object -First 1
        $LineNum = if ($LineMatch) { $LineMatch.LineNumber } else { 0 }

        $Entry = [PSCustomObject]@{ line = $LineNum; desc = "TODO: Beschreibung ergaenzen" }
        $Schema.uncategorized | Add-Member -NotePropertyName $FuncName -NotePropertyValue $Entry -Force
        Write-Host "  + $FuncName (Zeile $LineNum)" -ForegroundColor Gray
    }
} else {
    Write-Host "OK: Alle Funktionen im Index erfasst." -ForegroundColor Green
}

# UTF-8 OHNE BOM schreiben (.NET), damit Folge-Laeufe die Datei sauber wieder einlesen
$Json = $Schema | ConvertTo-Json -Depth 10
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $SchemaPath).Path, $Json, $Utf8NoBom)
Write-Host "functions.schema.json aktualisiert!" -ForegroundColor Green
