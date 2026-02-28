import requests
import re
import random
import time

# --- DIE NAMENS-WHITELIST (aus den ChatGPT-Konzepten) ---
PREFIX_WHITELIST = {"da", "de", "del", "della", "di", "van", "von", "der", 
                    "bin", "binti", "ibn", "al", "el", "la", "le", "mac", "mc", "st.", "saint"}

def split_name(full_name):
    """Trennt Vor- und Nachname von rechts nach links und beachtet Whitelist-Zusätze."""
    tokens = full_name.split()
    if len(tokens) < 2:
        return full_name, "" # Mononyme (sollten durch Filter eh fliegen)
    
    last_name_tokens = [tokens[-1]]
    first_name_tokens = tokens[:-1]
    
    # Prüfen, ob das Wort davor ein Prefix aus der Whitelist ist (z.B. "von", "de la")
    while first_name_tokens and first_name_tokens[-1].lower() in PREFIX_WHITELIST:
        last_name_tokens.insert(0, first_name_tokens.pop())
        
    # Sonderfall: "de la" (zwei Präfixe hintereinander)
    while first_name_tokens and first_name_tokens[-1].lower() in PREFIX_WHITELIST:
        last_name_tokens.insert(0, first_name_tokens.pop())

    first_name = " ".join(first_name_tokens)
    last_name = " ".join(last_name_tokens)
    
    return first_name, last_name

def clean_html(raw_html):
    """Entfernt HTML-Tags aus einem String."""
    cleanr = re.compile('<.*?>')
    return re.sub(cleanr, '', raw_html)

def get_real_name_from_lead(extract_html):
    """Sucht den ersten fettgedruckten Text im Wikipedia-Lead-Satz (Bürgerlicher Name)."""
    # Finde alles zwischen <b> und </b>
    bold_matches = re.findall(r'<b>(.*?)</b>', extract_html)
    
    if not bold_matches:
        return None
        
    # Nehmen wir den ersten fetten String (das ist die redaktionelle Wikipedia-Regel für den echten Namen)
    real_name = clean_html(bold_matches[0]).strip()
    
    # Filtern: Mononyme oder Namen mit Zahlen/Sonderzeichen fliegen raus
    if len(real_name.split()) < 2:
        return None
    if re.search(r'\d', real_name) or "@" in real_name or "!" in real_name:
        return None
        
    return real_name

def scrape_wikipedia_category(category_name, limit=50):
    """Zieht Personen aus einer Wikipedia-Kategorie und extrahiert bürgerliche Namen."""
    print(f"-> Sauge Daten aus Wikipedia: {category_name} (Max {limit} Personen)...")
    
    url = "https://en.wikipedia.org/w/api.php"
    
    # NEU: Das Namensschild für den Wikipedia-Türsteher!
    headers = {
        "User-Agent": "F1SimulatorProject/1.0 (Privates Hobby-Projekt)"
    }
    
    # 1. Schritt: Hole die Seiten-Titel aus der Kategorie
    params_cat = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": category_name,
        "cmlimit": limit,
        "cmtype": "page",
        "format": "json"
    }
    
    # Mit headers=headers geben wir unseren Ausweis ab
    response = requests.get(url, params=params_cat, headers=headers)
    
    if response.status_code != 200:
        print(f"Fehler bei der Verbindung: Status {response.status_code}")
        return [], []
        
    pages = response.json().get("query", {}).get("categorymembers", [])
    
    if not pages:
        print("Kategorie nicht gefunden oder leer!")
        return [], []

    titles = [p["title"] for p in pages if not p["title"].startswith("List of")]
    
    first_names_pool = []
    last_names_pool = []
    
    # 2. Schritt: Hole den Lead-Satz (Intro) für diese Seiten
    print(f"-> Analysiere {len(titles)} Lead-Sätze auf echte bürgerliche Namen...")
    
    # API erlaubt max 20 Titel pro Request bei Extrakten
    for i in range(0, len(titles), 20):
        batch_titles = titles[i:i+20]
        params_extract = {
            "action": "query",
            "prop": "extracts",
            "exintro": 1, # Nur das Intro
            "titles": "|".join(batch_titles),
            "format": "json"
        }
        
        # Auch hier den Ausweis vorzeigen!
        res_ext = requests.get(url, params=params_extract, headers=headers).json()
        pages_ext = res_ext.get("query", {}).get("pages", {})
        
        for page_id, page_data in pages_ext.items():
            extract = page_data.get("extract", "")
            if not extract:
                continue
                
            # Künstlernamen-Filter: Hol den echten Namen!
            real_name = get_real_name_from_lead(extract)
            
            if real_name:
                first, last = split_name(real_name)
                if first and last:
                    first_names_pool.append(first)
                    last_names_pool.append(last)
                    
        time.sleep(0.5) # Sei nett zu den Wikipedia-Servern
        
    return first_names_pool, last_names_pool


# =========================================================
# DEIN MANUELLER TESTBEREICH
# =========================================================
if __name__ == "__main__":
    print("\n--- MASCHINE 2: WIKIPEDIA STAUBSAUGER TEST ---")
    
    # Du kannst hier die Kategorie ändern, z.B.:
    # "Category:Italian_racing_drivers"
    # "Category:German_male_actors"
    # "Category:Argentine_sportspeople"
    
    TEST_KATEGORIE = "Category:Italian_racing_drivers"
    ANZAHL_ZU_SAUGEN = 50 # Für einen schnellen Test reichen 50.
    TEST_JAHR = 1963
    
    # 1. Staubsauger anwerfen
    vornamen, nachnamen = scrape_wikipedia_category(TEST_KATEGORIE, limit=ANZAHL_ZU_SAUGEN)
    
    print("\n--- ERGEBNISSE AUS WIKIPEDIA ---")
    print(f"Gefundene Vornamen: {len(vornamen)} (z.B. {', '.join(vornamen[:3])}...)")
    print(f"Gefundene Nachnamen: {len(nachnamen)} (z.B. {', '.join(nachnamen[:3])}...)\n")
    
    # 2. Den Würfel rollen (Simulation)
    if vornamen and nachnamen:
        print(f"🎲 WÜRFLE EINEN FAHRER FÜR DAS JAHR {TEST_JAHR}:")
        
        # Simuliere 3 Test-Ziehungen
        for i in range(3):
            gewuerfelter_vorname = random.choice(vornamen)
            gewuerfelter_nachname = random.choice(nachnamen)
            print(f"Fahrer {i+1}: {gewuerfelter_vorname} {gewuerfelter_nachname}")
    else:
        print("Es konnten keine verwertbaren Namen gefunden werden.")