#!/bin/sh
# Paket I — Rohdaten-Beschaffung (einmalig, ~50 MB entpackt).
# Ziel-Verzeichnis als Argument, Default: ./raw
# Die Roh-Dateien werden NICHT eingecheckt — eingecheckt sind nur die
# kompakten Kohorten-JSONs in ../data/ (erzeugt von build-cohorts.js).
set -e
RAW="${1:-./raw}"
mkdir -p "$RAW"
cd "$RAW"

# USA — SSA baby names, volle Counts 1880–2020 (>=5 Träger/Jahr).
# Original https://www.ssa.gov/oact/babynames/names.zip blockt curl (Akamai);
# Mirror: hackerb9/ssa-baby-names (Format: Name,Sex,Count,Year)
curl -sL -o ssa-alldata.txt "https://raw.githubusercontent.com/hackerb9/ssa-baby-names/main/alldata.txt"

# FRA — INSEE "fichier des prénoms" nat2022, volle Counts 1900–2022
# (sexe;preusuel;annais;nombre — inkl. _PRENOMS_RARES-Aggregat)
curl -sL -A "Mozilla/5.0" -o insee.zip "https://www.insee.fr/fr/statistiques/fichier/7633685/nat2022_csv.zip"
powershell.exe -NoProfile -Command "Expand-Archive -Force insee.zip insee" 2>/dev/null || unzip -o insee.zip -d insee

# GBR — ONS England & Wales via ukbabynames-Paket (mine-cetinkaya-rundel):
#  - volle Counts 1996–2020 (year,sex,name,n,rank,nation)
#  - historische Top-100-Ränge 1904–1994 (dekadisch, rank-only)
curl -sL -o ukbabynames.csv "https://raw.githubusercontent.com/mine-cetinkaya-rundel/ukbabynames/master/data-raw/ukbabynames/ukbabynames.csv"
curl -sL -o uk-rankings.csv "https://raw.githubusercontent.com/mine-cetinkaya-rundel/ukbabynames/master/data-raw/ewbabynames/rankings.csv"

# ITA — ISTAT "Contanomi" nati-Webservice (JSONP), Top-300/Jahr, 1999–2024.
# (Endpunkt aus dem offiziellen Widget https://www.istat.it/dati/calcolatori/contanomi/)
# Manche Jahre deckeln serverseitig (2018/2019: max ~230, 2021: max ~100) →
# Limit-Fallback-Kaskade; Antwort "callback();" (11 Bytes) = Fehlschlag.
mkdir -p istat
for y in $(seq 1999 2024); do
  for l in 300 230 100; do
    curl -sL -A "Mozilla/5.0" -o "istat/ita-$y.json" \
      "https://www.istat.it/wp-content/themes/EGPbs5-child/contanomi/nati/index2022.php?type=list&limit=$l&year=$y&callback=cb"
    [ "$(wc -c < "istat/ita-$y.json")" -gt 1000 ] && break
    sleep 1
  done
  sleep 0.5
done

# GER — beliebte-vornamen.de Dekaden-Seiten (Rang-only, kein amtliches Register).
# Seiten-IDs siehe parse-ger-decades.js (PAGES); Beispiel:
for d in "3747-1900er" "3752-1910er" "3764-1920er" "3766-1930er" "3768-1940er" \
         "3770-1950er" "3772-1960er" "3774-1970er" "3776-1980er" "3778-1990er" \
         "3780-2000er" "26104-2010er"; do
  y=$(echo "$d" | grep -oE '[0-9]{4}er')
  curl -sL -A "Mozilla/5.0" -o "ger-$y.html" "https://www.beliebte-vornamen.de/$d-jahre.htm"
  sleep 1
done

echo "OK -> $RAW"
