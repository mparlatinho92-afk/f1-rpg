#!/usr/bin/env python3
"""
F2/F3 Fahrerfoto-Recherche für F1-RPG-Simulator
=================================================
Prüft für jeden Fahrernamen zuverlässig:
  1) Gibt es einen Wikidata-Eintrag?
  2) Hat dieser ein Bild (Property P18)?
  3) Falls nicht: Fallback über die Wikipedia REST-API (page/summary -> thumbnail)
  4) Falls auch das fehlschlägt: Fallback über Commons-Kategorie-Suche
     (deckt Fälle ab, in denen das Foto nur in einer Jahres-Unterkategorie
     liegt und nicht als Wikidata-P18 hinterlegt ist)

Output: fahrerfotos_ergebnis.csv + fahrerfotos_ergebnis.json

WICHTIG (Lizenz):
- Alle gefundenen Bilder sind Wikimedia-Commons-Dateien, i.d.R. CC-BY-SA
  oder CC0/PD. Für die Nutzung im Spiel (auch privat) empfiehlt sich ein
  kleiner Credit-Hinweis (Autor + Lizenz), das Skript schreibt dafür die
  "license" und "author" Felder mit, wo die API sie liefert.
- KEINE Nutzung von Getty/Motorsport-Images/Autosport-Fotos -> diese sind
  urheberrechtlich geschützt und nicht zum Scrapen freigegeben.

Nutzung:
    pip install requests --break-system-packages
    python3 f2_f3_fahrerfotos_check.py

Rate-Limit-Etikette: ~3 req/s, klarer User-Agent (siehe HEADERS unten).
Bei sehr vielen Namen ruhig HEADERS['User-Agent'] mit echter Kontakt-Info anpassen.
"""

import csv
import json
import time
import sys
from urllib.parse import quote

try:
    import requests
except ImportError:
    print("Bitte zuerst installieren: pip install requests --break-system-packages")
    sys.exit(1)

HEADERS = {
    "User-Agent": "F1RPG-Simulator-Fahrerfoto-Recherche/1.0 (privates Fanprojekt; kontakt@example.com)"
}

WIKIDATA_API = "https://www.wikidata.org/w/api.php"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
WIKIPEDIA_REST = "https://en.wikipedia.org/api/rest_v1/page/summary/"

DRIVERS = [
    # --- Ursprüngliche Liste (75) ---
    "Rafael Villagómez", "Josh Mason", "Kaylen Frederick", "Caio Collet",
    "Joshua Dufek", "Luke Browning", "Piotr Wiśnicki", "Michael Shin",
    "Roman Bilinski", "Jehan Daruvala", "Juan Manuel Correa", "Clément Novalak",
    "Colton Herta", "Cian Shields", "Kush Maini", "Nicola Marinangeli",
    "Tim Tramnitz", "Fernando Barrichello", "Tasanapol Inthraphuvasak",
    "Niels Koolen", "Javier Sagrera", "Nico Varrone", "Frederik Vesti",
    "Tommy Smith", "Théo Pourchaire", "Dino Beganovic", "Leonardo Fornaroli",
    "Oliver Goethe", "Ayumu Iwasa", "Brad Benavides", "Dennis Hauger",
    "José Garfias", "Amaury Cordeel", "Paul Aron", "Hugh Barter", "Jonny Edgar",
    "Ricardo Escotto", "Charlie Wurz", "Hunter Yeany", "Rafael Câmara",
    "Sebastián Montoya", "Arthur Leclerc", "Victor Martins", "John Bennett",
    "Christian Mansell", "Zak O'Sullivan", "Grégoire Saucy", "Sophia Flörsch",
    "Alex Dunne", "Ido Cohen", "Francesco Simonazzi", "Joshua Dürksen",
    "Mari Boya", "Taylor Barnard", "Laurens van Hoepen", "Pepe Martí",
    "Enzo Fittipaldi", "Sami Meguetounif", "Jin Nakamura", "Joseph Loake",
    "Ritomo Miyata", "Alex García", "Noel León", "Roman Staněk",
    "Santiago Ramos", "Richard Verschoor", "Zane Maloney", "Oliver Gray",
    "Patrick Heuzenroeder", "Max Esterson", "James Hedley", "Matías Zagazeta",
    "Roberto Faria", "Gabriele Minì", "Jak Crawford",

    # --- Nachtrag: fehlende 2025/2026 F2+F3 Rookies (Diff gegen offizielle Grids) ---
    "Nikola Tsolov", "Martinius Stenshorne", "Arvid Lindblad", "James Wharton",
    "Théophile Naël", "Ugo Ugochukwu", "Noah Strømsted", "Freddie Slater",
    "Matteo De Palo", "Mattia Colnaghi", "Tuukka Taponen", "Alessandro Giusti",
    "Taito Kato", "Maciej Gładysz", "Kanato Le", "Hiyu Yamakoshi",
    "Enzo Deligny", "Bruno del Pino", "Pedro Clerot", "Brando Badoer",
    "Christian Ho", "Louis Sharp", "Fionn McLaughlin", "Yevan David",
    "Nicola Lacorte", "Nandhavud Bhirombhakdi", "Gerrard Xie",

    # --- Nachtrag: fehlende Fahrer aus 2022er-Grids + weitere 2025er-Lücken ---
    "Marcus Armstrong", "Jüri Vips", "Olli Caldwell", "Jake Hughes",
    "Callum Voisin", "Ivan Domingues",

    # --- Nachtrag: weitere Vollzeit/Mehrfach-Renn-Fahrer 2022-2023, kein Einzelstart, kein F1 ---
    "Marino Sato", "Cem Bölükbaşı", "Roy Nissany", "David Beckmann",
    "Tatiana Calderón", "Nazim Azman", "David Vidales", "William Alatalo",
    "Enzo Trulli", "Reece Ushijima", "Federico Malvestiti", "Ralph Boschung",
    "Nikita Bedrin", "Kacper Sztuka", "Carl Bennett",
]

# Dedup, falls ein Name versehentlich doppelt eingetragen wurde
DRIVERS = list(dict.fromkeys(DRIVERS))


def wikidata_search(name):
    params = {
        "action": "wbsearchentities", "search": name, "language": "en",
        "format": "json", "limit": 3,
    }
    r = requests.get(WIKIDATA_API, params=params, headers=HEADERS, timeout=10)
    r.raise_for_status()
    results = r.json().get("search", [])
    for res in results:
        desc = (res.get("description") or "").lower()
        if any(k in desc for k in ["racing driver", "formula", "rennfahrer", "kart"]):
            return res["id"]
    return results[0]["id"] if results else None


def wikidata_get_image(qid):
    params = {
        "action": "wbgetclaims", "entity": qid, "property": "P18",
        "format": "json",
    }
    r = requests.get(WIKIDATA_API, params=params, headers=HEADERS, timeout=10)
    r.raise_for_status()
    claims = r.json().get("claims", {}).get("P18", [])
    if claims:
        return claims[0]["mainsnak"]["datavalue"]["value"]
    return None


def commons_file_info(filename):
    params = {
        "action": "query", "titles": f"File:{filename}", "prop": "imageinfo",
        "iiprop": "url|extmetadata", "format": "json",
    }
    r = requests.get(COMMONS_API, params=params, headers=HEADERS, timeout=10)
    r.raise_for_status()
    pages = r.json().get("query", {}).get("pages", {})
    for p in pages.values():
        info = p.get("imageinfo", [{}])[0]
        meta = info.get("extmetadata", {})
        return {
            "url": info.get("url"),
            "license": meta.get("LicenseShortName", {}).get("value", "unbekannt"),
            "author": meta.get("Artist", {}).get("value", "unbekannt"),
        }
    return {}


def wikipedia_thumbnail(name):
    url = WIKIPEDIA_REST + quote(name.replace(" ", "_"))
    r = requests.get(url, headers=HEADERS, timeout=10)
    if r.status_code == 200:
        data = r.json()
        thumb = data.get("thumbnail", {}).get("source")
        if thumb:
            return thumb
    return None


def commons_category_fallback(name):
    """Sucht Dateien direkt in der Commons-Kategorie des Fahrers (inkl. Jahres-Unterkategorien)."""
    params = {
        "action": "query", "list": "search",
        "srsearch": f'incategory:"{name}"', "srnamespace": 6,  # NS 6 = File
        "format": "json", "srlimit": 1,
    }
    r = requests.get(COMMONS_API, params=params, headers=HEADERS, timeout=10)
    if r.status_code == 200:
        results = r.json().get("query", {}).get("search", [])
        if results:
            return "https://commons.wikimedia.org/wiki/" + quote(results[0]["title"])
    return None


def check_driver(name):
    result = {"name": name, "found": False, "image_url": None,
              "license": None, "author": None, "source": None}
    try:
        qid = wikidata_search(name)
        if qid:
            result["wikidata_qid"] = qid
            filename = wikidata_get_image(qid)
            if filename:
                info = commons_file_info(filename)
                result.update({
                    "found": True,
                    "image_url": info.get("url"),
                    "license": info.get("license"),
                    "author": info.get("author"),
                    "source": "wikidata_P18",
                })
                return result

        thumb = wikipedia_thumbnail(name)
        if thumb:
            result.update({"found": True, "image_url": thumb, "source": "wikipedia_thumbnail"})
            return result

        cat_hit = commons_category_fallback(name)
        if cat_hit:
            result.update({"found": True, "image_url": cat_hit, "source": "commons_category_search"})
            return result

    except requests.RequestException as e:
        result["error"] = str(e)

    return result


def main():
    results = []
    for i, name in enumerate(DRIVERS, 1):
        print(f"[{i}/{len(DRIVERS)}] Prüfe: {name} ...", end=" ")
        res = check_driver(name)
        print("✅ gefunden" if res["found"] else "❌ FEHLT")
        results.append(res)
        time.sleep(0.4)  # Etikette: nicht zu schnell anfragen

    with open("fahrerfotos_ergebnis.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    with open("fahrerfotos_ergebnis.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "name", "found", "image_url", "license", "author", "source", "wikidata_qid"
        ])
        writer.writeheader()
        for r in results:
            writer.writerow({k: r.get(k, "") for k in writer.fieldnames})

    missing = [r["name"] for r in results if not r["found"]]
    print("\n=== ZUSAMMENFASSUNG ===")
    print(f"Gefunden: {len(results) - len(missing)} / {len(results)}")
    if missing:
        print("Fehlende Fotos (manuell nachrecherchieren oder Platzhalter nutzen):")
        for m in missing:
            print(f"  - {m}")


if __name__ == "__main__":
    main()
