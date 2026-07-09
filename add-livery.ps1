# add-livery.ps1 – Livery-Eintrag(e) in TEAM_COLORS_RANGES einfügen
# Einzeln:  ./add-livery -Team 'JOR' -From 1998 -To 1999 -Colors '#FFD100,#FFD100,#111111' -Comment 'B&H Gelb'
# Batch:    ./add-livery -BatchFile liveries-todo.json
# Preview:  ./add-livery -BatchFile liveries-todo.json -DryRun

param(
    [string]$Team      = "",
    [int]   $From      = 0,
    [int]   $To        = 0,
    [string]$Colors    = "",   # kommagetrennte Hex-Codes: '#CC0000,#CC0000,#FFFFFF'
    [string]$Comment   = "",
    [string]$BatchFile = "",
    [switch]$DryRun
)

$htmlFile = Join-Path $PSScriptRoot "index.html"

# ── Hilfsfunktionen ──────────────────────────────────────────────────────────

function Find-RangesBounds ([string[]]$lines) {
    $start = -1; $end = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match 'const TEAM_COLORS_RANGES\s*=\s*\[') { $start = $i }
        if ($start -ge 0 -and $i -gt $start -and $lines[$i] -match '^\s+\];\s*$') { $end = $i; break }
    }
    return $start, $end
}

function Parse-Entries ([string[]]$lines, [int]$start, [int]$end) {
    $entries = @()
    for ($i = $start + 1; $i -lt $end; $i++) {
        if ($lines[$i] -match '^\s+\[(\d{4}),\s*(\d{4}),\s*''([A-Z0-9]+)''') {
            $entries += [pscustomobject]@{ Line=$i; From=[int]$Matches[1]; To=[int]$Matches[2]; Team=$Matches[3] }
        }
    }
    return $entries
}

function Find-Conflicts ($entries, [string]$team, [int]$from, [int]$to) {
    $entries | Where-Object { $_.Team -eq $team -and -not ($to -lt $_.From -or $from -gt $_.To) }
}

function Format-Entry ([string]$team, [int]$from, [int]$to, [string[]]$colorArr, [string]$comment) {
    $hexList  = $colorArr | ForEach-Object { "'$($_.Trim())'" }
    $colStr   = "[" + ($hexList -join ', ') + "]"
    $core     = "            [$from, $to, '$team', $colStr],"
    if ($comment) { return "$($core.PadRight(60)) // $comment" }
    return $core
}

# ── Kern-Logik ───────────────────────────────────────────────────────────────

function Add-Entry ([string[]]$lines, [string]$team, [int]$from, [int]$to, [string[]]$colorArr, [string]$comment) {

    $start, $end = Find-RangesBounds $lines
    if ($start -lt 0 -or $end -lt 0) { Write-Error "TEAM_COLORS_RANGES nicht gefunden."; return $null }

    $entries   = Parse-Entries $lines $start $end
    $conflicts = Find-Conflicts $entries $team $from $to

    if ($conflicts) {
        Write-Host "  [KONFLIKT] $team $from-$to" -ForegroundColor Red
        foreach ($c in $conflicts) {
            Write-Host "    Zeile $($c.Line+1): [$($c.From), $($c.To), '$($c.Team)', ...]" -ForegroundColor Yellow
        }
        return $null
    }

    # Einfügeposition: nach letztem Eintrag dieses Teams; sonst direkt vor schließendes ];
    $teamEntries  = $entries | Where-Object { $_.Team -eq $team }
    $insertAfter  = if ($teamEntries.Count -gt 0) { ($teamEntries | Sort-Object Line)[-1].Line } else { $end - 1 }

    $newLine = Format-Entry $team $from $to $colorArr $comment
    Write-Host "  [OK] $newLine" -ForegroundColor Green

    if ($DryRun) { return $lines }   # keine Datei-Änderung

    $list = [System.Collections.Generic.List[string]]$lines
    $list.Insert($insertAfter + 1, $newLine)
    return $list.ToArray()
}

# ── Entry-Point ──────────────────────────────────────────────────────────────

$lines    = [System.IO.File]::ReadAllLines($htmlFile)
$modified = $false

if ($BatchFile) {
    if (-not (Test-Path $BatchFile)) { Write-Error "Datei nicht gefunden: $BatchFile"; exit 1 }
    $batch = Get-Content $BatchFile -Raw | ConvertFrom-Json

    foreach ($e in $batch) {
        if ($e.done) { continue }
        Write-Host ""
        Write-Host "=== $($e.team)  $($e.from)–$($e.to) ===" -ForegroundColor Cyan

        # colors als Array oder kommagetrennte Strings akzeptieren
        $colorArr = if ($e.colors -is [array]) { $e.colors } else { $e.colors -split ',' }

        $result = Add-Entry $lines $e.team $e.from $e.to $colorArr $e.comment
        if ($null -ne $result) {
            $lines = $result
            if (-not $DryRun) { $e.done = $true }
            $modified = $true
        }
    }

    if ($modified -and -not $DryRun) {
        $batch | ConvertTo-Json -Depth 4 | Set-Content $BatchFile -Encoding UTF8
        Write-Host "`nliveries-todo.json: erledigte Einträge als done=true markiert." -ForegroundColor DarkGray
    }

} elseif ($Team -and $From -and $To -and $Colors) {
    Write-Host ""
    Write-Host "=== $Team  $From–$To ===" -ForegroundColor Cyan
    $colorArr = $Colors -split ','
    $result   = Add-Entry $lines $Team $From $To $colorArr $Comment
    if ($null -ne $result) { $lines = $result; $modified = $true }

} else {
    Write-Host @"

add-livery.ps1 – Livery-Ranges in TEAM_COLORS_RANGES einfügen

EINZELN:
  ./add-livery -Team 'FER' -From 1996 -To 1999 -Colors '#CC0000,#CC0000,#FFFFFF' -Comment 'Marlboro Rot'

BATCH (liveries-todo.json):
  ./add-livery -BatchFile liveries-todo.json
  ./add-livery -BatchFile liveries-todo.json -DryRun   ← nur Vorschau

FARB-FORMAT:
  1 Farbe  → solid: '#CC0000'
  2 Farben → 50/50: '#CC0000,#FFFFFF'
  3 Farben → je 1/3: '#CC0000,#CC0000,#FFFFFF'  (erste 2x = 2/3)

"@
    exit 0
}

if ($modified -and -not $DryRun) {
    [System.IO.File]::WriteAllLines($htmlFile, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Host "`nindex.html aktualisiert." -ForegroundColor Green
} elseif ($DryRun) {
    Write-Host "`n[DryRun] Keine Datei geschrieben." -ForegroundColor DarkYellow
}
