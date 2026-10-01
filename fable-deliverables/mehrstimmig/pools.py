# -*- coding: utf-8 -*-
"""
Pool-Register für mehrstimmige Textbanken (alle Fable-Satzbanken des Spiels).

EINZIGE Stelle, an der Pools beschrieben werden. filter_kandidaten.py prüft danach,
briefing.py baut daraus das Briefing für Fremd-KIs. Neuer Pool = neuer Eintrag hier.

Aufbau:
  GROUPS[g]  gemeinsame Einstellungen einer Bank (Quelle in index.html, Ära-Achse, Emoji,
             Längen, Platzhalter-Bedeutungen, Regeln für das Briefing)
  POOLS[id]  ein Pool: Pfad in der Bank, Platzhalter, Pflicht-Platzhalter, Ären,
             wann er erscheint, Zusatzregel, Ablehn-/Warn-Regex

Die Regex-Listen lehnen nur ab, was das Spiel NICHT übergibt (erfundene Ursache, Titel,
Ergebnis). Geschmack wird nie geprüft (KONZEPT-mehrstimmige-textbanken.md).
Kalibriert gegen den Bestand: `python filter_kandidaten.py --kalibrieren` muss für jeden
Pool 0 Ablehnungen im Bestand zeigen, sonst ist eine Regel zu scharf.
"""

ERAS = {
    "e50": ("1950–1961", "heroisch, formell, Grand-Prix-Pathos"),
    "e62": ("1962–1975", "klassisch, sachlich-respektvoll"),
    "e76": ("1976–1993", "TV-Zeitalter, griffiger"),
    "e94": ("1994–2009", "modern, technisch"),
    "e10": ("ab 2010", "heutiges Broadcast-Deutsch, schnell"),
}
ALL_ERAS = list(ERAS)

# ───────────────────────── gemeinsame Regex-Bausteine ─────────────────────────
CAUSE = (r"Unfall|Unfälle|Crash|Kollision|Zusammenstoß|Zusammenprall|Öl\b|Ölspur|Feuer|Brand|"
         r"Flammen|Trümmer|Wrack|Unglück|Abflug|abgeflogen|Defekt|Streckenbegrenzung|Kiesbett|"
         r"Leitplanke|Barriere|Verletz|Rettung|Sanitäter|Arzt|Krankenwagen|Sicherheitsgründen|"
         r"Gefahr|Zwischenfall|Vorfall")
WEATHER = r"Regen|nass|Nässe|Wetter|Gischt|Schauer|Tropfen"
SCORING = r"Punkte|Wertung|Addition|addiert|halbe|zählt|gewertet"
PROFIT = r"profitier|Vorteil|Nachteil|zugute|Gewinner|Verlierer"
TITLE = r"Weltmeister|WM-Titel|\bTitel|Meisterschaft|Champion|Krone"
INJURY = (r"verletz|Arzt|Ärzte|Krankenwagen|Sanitäter|Hospital|Krankenhaus|bewusstlos|"
          r"eingeklemmt|leblos|\btot\b|\bTod\b|stirbt|gestorben")
ACCIDENT = (r"Unfall|Crash|abgeflogen|Abflug|fliegt ab|Leitplanke|Mauer|Kiesbett|Dreher|"
            r"dreht sich|Kollision|Reifenstapel|Streckenbegrenzung|Barriere|Einschlag")
MECHANIC = (r"Motor|Getriebe|Kupplung|Aufhängung|Bremse|Elektrik|Öldruck|Kühler|Benzinpumpe|"
            r"Zündung|Turbo|Hydraulik|Defekt|Antrieb|Radlager|Lenkung")
DEATH_DETAIL = (r"Feuer|Flammen|brennt|verbrannt|Krankenhaus|Hospital|Arzt|Ärzte|bewusstlos|"
                r"Verletzung|eingeklemmt|Genick|Kopf|Schuld|kämpfte|Blut")
WIN_CLAIM = r"\bSieg|gewann|gewonnen|Rennsieger|Podest|Pokal|Triumph"
FORECAST_CLAIM = (r"\bwird (er |sie )?(Weltmeister|Meister|Champion|gewinnen|siegen|dominieren)|"
                  r"\bgewinnt\b|\bholt (er |sich )?den Titel|steht (schon )?fest|sicherer Sieger|"
                  r"hat gewonnen|\bsiegte\b")
FEUD = r"\bHass|\bhasst|\bFeind|\bZoff|beleidig|\bRache\b|\bsagte\b|\bsagt\b|\bmeinte\b|Interview|[„“\"]"
FEUD_WARN = r"\bStreit\b|Krieg|Fehde"
# Biografie hart nur bei eindeutigen Lebenslauf-Wörtern; Erfolgswörter nur markieren,
# weil Verneinungen und Bilder zulässig sind („kein Kandidat für die Pole“, „Meister der nassen Bahn“)
BIOGRAPHY = (r"\bgewann|Titelgewinn|Formel ?[2-5]|\bF[2-5]\b|\bKart(sport|bahn)?\b|Heimat|geboren|"
             r"\bVater\b|\bMutter\b|Familie|Bruder|Schwester|Ehefrau")
BIO_WARN = r"\bSieg|\bTitel|Meister|Champion|\bPole\b|Podest"
FIRST_TIME = r"erste[nrms]? (WM-)?Titel|erstmals|zum (ersten|zweiten|dritten) Mal|\berneut\b|Titelverteidig"

# echte Namen/Orte/Teams: Spiel-Geschichte weicht von der echten ab
REAL = (r"Senna|Prost|Schumacher|Hamilton|Verstappen|Lauda|Fangio|Vettel|Alonso|Räikkönen|"
        r"Ascari|Moss|Clark|Stewart|Fittipaldi|Piquet|Mansell|Häkkinen|Rindt|Surtees|Hawthorn|"
        r"Farina|Hunt|Villeneuve|Leclerc|Norris|Rosberg|"
        r"Ferrari|McLaren|Mercedes|Williams|Lotus|Brabham|Tyrrell|Benetton|Renault|Red Bull|"
        r"Maserati|Alfa Romeo|"          # nicht "Sauber": normales Adjektiv am Satzanfang
        r"Monza|Spa|Silverstone|Monaco|Imola|Suzuka|Nürburgring|Hockenheim|Interlagos|Zandvoort|"
        r"Indianapolis|Le Mans")

# Ära-Warnungen: nur Lesehinweis, keine Ablehnung
ERA_WARN = {
    "e50": r"Boxenfunk|Funk\b|Telemetrie|Intermediate|Inters\b|DRS|Safety|Setup|Aquaplaning|Grip\b|Traktion|Ampel|Reifenstrategie|TV|Fernseh|Kamera|Rookie",
    "e62": r"Boxenfunk|Telemetrie|Intermediate|Inters\b|DRS|Safety|Setup|Grip\b|Ampel|Rookie",
    "e76": r"Telemetrie|DRS|Inters\b|Intermediate|Full Wet|Safety|Broadcast",
    "e94": r"DRS|Full Wet|Inters\b|Broadcast",
    "e10": r"$^",
}
# Pools ohne Ära-Achse erscheinen in ALLEN Epochen: zeitgebundene Wörter nur markieren
TIMELESS_WARN = (r"Boxenfunk|Funk\b|Telemetrie|DRS|Safety|TV|Fernseh|Bildschirm|Kamera|Social|"
                 r"Internet|online|Livestream|Rookie|Lights|Broadcast|Simulator|Daten|Hybrid|Turbo")
SLANG_OLD = r"krass|geil|mega|Hammer|Kracher|abgefahren|Action|cool"

# Fahrer-Slot: Zeilen, die nur für den FÜHRENDEN gelten, bleiben {leader}
LEADER_BOUND = (r"[Ff]ühr|Spitze|\bvorn\w*|Referenz|Takt an|Tempo vorgibt|zeigt die Richtung|"
                r"behält oben|selbst \{leader\}|Vorsprung|Nase|voran|dahinter")

# ───────────────────────── Gruppen (je Bank) ─────────────────────────
TICKER_PH = {
    "lap":       ("aktuelle Runde (Zahl)", "34", "„Runde {lap}:“ oder „in Runde {lap}“"),
    "totalLaps": ("Renndistanz in Runden (Zahl)", "70", "„über {totalLaps} Runden“"),
    "fieldSize": ("Anzahl Fahrzeuge im Feld (Zahl)", "22", "„{fieldSize} Wagen“"),
    "driver":    ("Name des betroffenen Fahrers", "Paul Hartmann", "Subjekt oder unveränderliches Objekt"),
    "victim":    ("Name des überholten Fahrers", "Luca Ferri", "unveränderliches Objekt"),
    "team":      ("Teamname", "Arden", "„das {team}-Team“, „bei {team}“; nie gebeugt"),
    "pos":       ("Position (Zahl)", "4", "„P{pos}“ oder „auf Platz {pos}“"),
    "reason":    ("Ausfallgrund als fertiges deutsches Nomen", "Getriebeschaden", "als Nominal: „– {reason}.“"),
    "leader":    ("Name des aktuell Führenden", "Paul Hartmann", "Subjekt oder unveränderliches Objekt"),
}
RECAP_PH = {
    "year":       ("Saisonjahr", "1978", "„{year}“ ohne Artikel oder „das Jahr {year}“"),
    "champion":   ("Name des Weltmeisters", "Paul Hartmann", "Name, nicht beugen"),
    "points":     ("Punkte des Weltmeisters (Zahl)", "48", "„{points} Punkte(n)“"),
    "siegeNom":   ("Siege, fertig im Nominativ", "sechs Siege / ein Sieg / kein einziger Sieg", "nur als Subjekt/Nominativ"),
    "siegeDat":   ("Siege, fertig im Dativ", "sechs Siegen / einem Sieg", "nur nach „mit“, „nach“, „von“"),
    "poles":      ("Pole-Positions des Weltmeisters (Zahl)", "7", "„{poles} Pole-Positions“"),
    "vize":       ("Name des Vizemeisters", "Luca Ferri", "Name"),
    "vizePoints": ("Punkte des Vizemeisters (Zahl)", "45", "„{vizePoints} Punkte(n)“"),
    "gapNom":     ("Abstand, fertig im Nominativ", "drei Punkte / ein einziger Punkt", "„{gapNom} Vorsprung“"),
    "gapDat":     ("Abstand, fertig im Dativ", "drei Punkten / einem einzigen Punkt", "„mit {gapDat}“"),
    "gapAkk":     ("Abstand, fertig im Akkusativ", "drei Punkte / einen einzigen Punkt", "„um {gapAkk}“"),
    "teamChampionName":   ("Name des Konstrukteursmeisters", "Arden", "Name"),
    "teamChampionPoints": ("Punkte des Konstrukteursmeisters (Zahl)", "86", "„{teamChampionPoints} Punkte(n)“"),
    "champTeam":     ("Team des Weltmeisters", "Arden", "Name"),
    "champTeamRank": ("Rang dieses Teams in der Konstrukteurswertung (Zahl)", "5", "„Rang {champTeamRank}“"),
    "maxWinner":     ("Fahrer mit den meisten Siegen (nicht Meister)", "Luca Ferri", "Name"),
    "maxWinnerSiegeNom": ("dessen Siege, fertig im Nominativ", "fünf Siege", "Nominativ"),
    "deadName":   ("Name des tödlich verunglückten Fahrers", "Hans Brenner", "Name"),
    "deadTeam":   ("sein Team", "Arden", "Name"),
    "deadRaceBei":("fertige Präpositionalphrase zum Rennen", "beim Großen Preis von Belgien", "steht nie am Satzanfang"),
    "deadList":   ("Namensliste mehrerer Verstorbener", "Hans Brenner und Luca Ferri", "Aufzählung"),
    "deadCount":  ("Anzahl Verstorbener (Zahl)", "2", "selten nötig"),
    "klasseNom":  ("Name der Rennklasse, Nominativ Singular", "die Formel 1 / die Königsklasse / der Grand-Prix-Sport", "nur Subjekt"),
    "klasseGen":  ("Rennklasse im Genitiv", "der Formel 1 / des Grand-Prix-Sports", "nur Genitiv-Attribut"),
    "klasseIn":   ("Rennklasse als fertige Präpositionalphrase", "in der Formel 1 / im Grand-Prix-Sport", "fertig, kein „in“ davor"),
    "fahrerPl":   ("Fahrer, Plural-Nomen", "Fahrer / Piloten", "Plural"),
    "presseNom":  ("Presse, Nominativ Singular", "die Fachpresse / die Presse", "nur Subjekt"),
    "publikum":   ("Publikum, Nominativ Singular", "das Publikum / die Fangemeinde", "nur Subjekt"),
    # Vorschau
    "favorit":     ("Name des Favoriten", "Luca Ferri", "Name"),
    "favoritTeam": ("Team des Favoriten", "Arden", "Name"),
    "favorit2":    ("zweiter Favorit", "Paul Hartmann", "Name"),
    "rookieList":  ("Name(n) der Neulinge", "Tom Weller / Tom Weller und Jan Roos", "Aufzählung"),
    "wechselName": ("Name des Fahrers mit markantem Teamwechsel", "Paul Hartmann", "Name"),
    "wechselTeam": ("sein neues Team", "Arden", "Name"),
    "auftakt":     ("Zeitangabe zum Saisonstart, fertig", "zum Saisonauftakt / vor dem ersten Startschuss des Jahres", "adverbial"),
    "neulingSg":   ("Neuling, Singular", "Neuling / Rookie", "Nomen"),
    "neulingPl":   ("Neulinge, Plural", "Neulinge / Rookies", "Nomen"),
}
OBIT_PH = {
    "name":    ("Name des Fahrers", "Hans Brenner", "Name, kasusfrei"),
    "nameE":   ("Name mit Beinamen und Komma", "Hans Brenner, der stille Schotte,", "NUR als Subjekt, direkt gefolgt vom Verb (Komma ist schon drin)"),
    "bilanz":  ("Karrierebilanz als Aufzählung mit Ziffern", "84 Grand-Prix-Starts, 3 Siege und 1 WM-Titel", "nur als Aufzählung einbetten"),
    "klasseNom": RECAP_PH["klasseNom"], "klasseGen": RECAP_PH["klasseGen"],
    "klasseIn": RECAP_PH["klasseIn"], "fahrerPl": RECAP_PH["fahrerPl"],
    "seasonsText": ("Dauer der Laufbahn als fertige Zeitangabe", "nach zwölf Jahren im Feld / nach nur einer Saison im Cockpit", "adverbial; am Satzanfang folgt das Verb (V2)"),
    "peakText":    ("Höhepunkt als fertiges Prädikatsnomen", "ein Titelanwärter / ein Rennsieger / ein Podestkandidat", "nur nach „war er“ o. Ä."),
}
BIO_PH = {
    "name":      ("Name des Fahrers", "Tom Weller", "Name"),
    "nationAdj": ("Herkunft als Nomen MIT Artikel, Nominativ", "der Brasilianer / der Finne", "nur Subjekt; fehlt manchmal → auch Zeilen ohne"),
}
RIVAL_PH = {
    "driver":      ("Name des ersten Fahrers (bei Dominanz: der Überlegene)", "Paul Hartmann", "Name"),
    "rival":       ("Name des Gegenübers", "Luca Ferri", "Name"),
    "h2hText":     ("Duellstand als fertige Phrase", "12:8 in den Rennen / nur drei Punkte Abstand in der Wertung", "als Einschub oder nach Doppelpunkt"),
    "seasonsText": ("Dauer, fertig", "über vier gemeinsame Jahre", "adverbial"),
}

GROUPS = {
    "ticker": dict(
        bank="LIVE_COMMENTARY", era=True, emoji=True, cap=True, min_len=18, max_len=170, warn_len=130,
        minsingle=4, ph=TICKER_PH, reject=TITLE,
        titel="Ticker-Texte für ein Formel-1-Managerspiel",
        worum=("Ein Browser-Managerspiel (Deutsch, Formel 1 von 1950 bis in die Zukunft) spielt Rennen "
               "Runde für Runde als **Live-Ticker** ab. Die Meldungen stammen aus einer Textbank: je "
               "Ereignis und je Ära ein Pool von Satzvorlagen mit Platzhaltern. Du schreibst neue "
               "Vorlagen für einen Pool. Wann sie im Rennen erscheinen, entscheidet das Spiel."),
        form="eine Meldung, ein bis zwei kurze Sätze",
        regeln=[
            "**Nichts über Titel oder Wertung.** Der Ticker läuft mitten im Rennen und kennt das Ende nicht.",
            "**Ein Emoji am Anfang** (steht unten beim Pool), danach der Satz.",
            "**Mischung der Platzhalter:** Etwa ein Drittel der Zeilen soll höchstens **einen** Platzhalter "
            "enthalten, weil das Spiel Zeilen überspringt, deren Platzhalter es gerade nicht belegen kann.",
            "Schreibe Runden immer mit „**in** Runde {lap}“ oder „Runde {lap}:“, nie „auf Runde“, „zur Runde“ oder „mit Runde“.",
        ]),
    "rueckblick": dict(
        bank="RECAP_BANK", era=False, emoji=False, cap=False, min_len=30, max_len=200, warn_len=170,
        minsingle=0, ph=RECAP_PH,
        titel="Sätze für den Saison-Rückblick eines Formel-1-Managerspiels",
        worum=("Ein Browser-Managerspiel (Deutsch, Formel 1 von 1950 bis in die Zukunft) erzählt am Ende "
               "jeder Saison einen kurzen **Rückblick** aus vier bis sechs Sätzen. Jeder Satz stammt aus "
               "einem Pool von Vorlagen mit Platzhaltern; das Spiel setzt Namen und Zahlen ein und "
               "reiht die Sätze aneinander. Du schreibst neue Vorlagen für einen Pool."),
        form="ein Satz, der in einem Zeitungsrückblick stehen könnte",
        regeln=[
            "**Satzanfang großgeschrieben.** Das Spiel korrigiert den Anfang hier nicht. Ein Platzhalter "
            "darf vorn stehen, wenn er ein Name oder eine Zahl ist ({champion}, {vize}, {year} …), nie "
            "{klasseNom}, {presseNom}, {publikum} oder {deadRaceBei}.",
            "**Keine Vorgeschichte.** Das Spiel weiß nicht, ob es der erste oder fünfte Titel ist: "
            "kein „erstmals“, „erneut“, „Titelverteidigung“, „zum zweiten Mal“.",
        ]),
    "vorschau": dict(
        bank="PREVIEW_BANK", era=False, emoji=False, cap=True, min_len=30, max_len=180, warn_len=150,
        minsingle=0, ph=RECAP_PH,
        titel="Sätze für die Saison-Vorschau eines Formel-1-Managerspiels",
        worum=("Ein Browser-Managerspiel (Deutsch, Formel 1 von 1950 bis in die Zukunft) zeigt **vor** "
               "jeder Saison eine kurze **Vorschau** aus vier bis sechs Sätzen. Jeder Satz stammt aus "
               "einem Pool von Vorlagen mit Platzhaltern. Du schreibst neue Vorlagen für einen Pool."),
        form="ein Satz, spekulativ wie eine Saisonprognose",
        regeln=[
            "**Es ist eine Prognose.** Kein Rennen ist gefahren. Durchgehend vorsichtig formulieren "
            "(„gilt als“, „dürfte“, „muss beweisen“), nie Ergebnisse behaupten („wird Meister“, „gewinnt“).",
            "Platzhalter dürfen am Satzanfang stehen.",
        ]),
    "nachruf": dict(
        bank="OBIT_BANK", era=False, emoji=False, cap=True, min_len=18, max_len=170, warn_len=140,
        minsingle=0, ph=OBIT_PH,
        titel="Sätze für Nachrufe in einem Formel-1-Managerspiel",
        worum=("Ein Browser-Managerspiel (Deutsch, Formel 1 von 1950 bis in die Zukunft) würdigt Fahrer, die "
               "im Spiel tödlich verunglücken, mit einem kurzen **Nachruf** aus drei Sätzen (Eröffnung, "
               "Bilanz, Schluss). Jeder Satz stammt aus einem Pool von Vorlagen mit Platzhaltern. Du "
               "schreibst neue Vorlagen für einen Pool."),
        form="ein Satz, würdevoll und nüchtern, ohne Kitsch",
        regeln=[
            "**Keine Todesumstände.** Kein Feuer, keine Verletzung, kein Krankenhaus, keine Schuld. "
            "Das Spiel kennt nur, dass der Fahrer gestorben ist.",
            "Der Fahrer ist männlich („er“, „sein“). Platzhalter dürfen am Satzanfang stehen.",
        ]),
    "abschied": dict(
        bank="OBIT_BANK", era=False, emoji=False, cap=True, min_len=18, max_len=170, warn_len=140,
        minsingle=0, ph=OBIT_PH,
        titel="Sätze für Karriere-Abschiede in einem Formel-1-Managerspiel",
        worum=("Ein Browser-Managerspiel (Deutsch, Formel 1 von 1950 bis in die Zukunft) verabschiedet "
               "Fahrer, die ihre Laufbahn beenden, mit einem kurzen **Abschiedstext** aus drei bis vier "
               "Sätzen (Eröffnung, Werdegang, Bilanz, Schluss). Jeder Satz stammt aus einem Pool von "
               "Vorlagen mit Platzhaltern. Du schreibst neue Vorlagen für einen Pool."),
        form="ein Satz, warm und würdevoll, ohne Kitsch",
        regeln=[
            "Der Fahrer lebt und tritt zurück: nichts, was nach Tod oder Unglück klingt.",
            "Der Fahrer ist männlich („er“, „sein“). Platzhalter dürfen am Satzanfang stehen.",
        ]),
    "bio": dict(
        bank="DRIVER_BIO_BANK", era=None, emoji=False, cap=True, min_len=18, max_len=170, warn_len=140,
        minsingle=0, ph=BIO_PH,
        titel="Sätze für Fahrer-Kurzporträts in einem Formel-1-Managerspiel",
        worum=("Ein Browser-Managerspiel (Deutsch, Formel 1 von 1950 bis in die Zukunft) zeigt für "
               "**erfundene** Fahrer ein Kurzporträt aus zwei Sätzen. Der Charakter ergibt sich aus den "
               "Fähigkeitswerten des Fahrers (ein „Archetyp“). Jeder Satz stammt aus einem Pool von "
               "Vorlagen. Du schreibst neue Vorlagen für einen Pool."),
        form="ein Satz, charakterisierend, nicht biografisch",
        regeln=[
            "**Charakter, keine Lebensgeschichte.** Keine Erfolge, keine Rennserien, keine Heimatstadt, "
            "keine Familie. Der Fahrer hat im Spiel keine Vorgeschichte.",
            "Der Fahrer ist männlich („er“, „sein“). Platzhalter dürfen am Satzanfang stehen.",
        ]),
    "duell": dict(
        bank="RIVALRY_BANK", era=True, emoji=False, cap=True, min_len=30, max_len=180, warn_len=150,
        minsingle=0, ph=RIVAL_PH,
        titel="Sätze über sportliche Duelle in einem Formel-1-Managerspiel",
        worum=("Ein Browser-Managerspiel (Deutsch, Formel 1 von 1950 bis in die Zukunft) beschreibt im "
               "Fahrerprofil das markanteste **sportliche Duell** eines Fahrers in einem Satz. Die Grundlage "
               "sind echte Zahlen aus dem Spiel (Duellstand). Du schreibst neue Vorlagen für einen Pool."),
        form="ein bis zwei Sätze",
        regeln=[
            "**Nur das sportliche Duell.** Keine Feindschaft, kein Streit, keine Zitate, keine Dramen "
            "abseits der Strecke.",
            "Platzhalter dürfen am Satzanfang stehen.",
        ]),
}

# ───────────────────────── Pools ─────────────────────────
POOLS = {}

def _p(pid, group, path, ph, wann, zusatz="", reject="", warn="", need=(), eras=None, emoji=None,
       driver_slot=False, digits_ok=""):
    POOLS[pid] = dict(group=group, path=path, ph=set(ph), need=set(need), wann=wann, zusatz=zusatz,
                      reject=reject, warn=warn, eras=eras, emoji=emoji, driver_slot=driver_slot,
                      digits_ok=digits_ok)

E_ALL = ALL_ERAS
# Ticker: Rennen
_p("ticker.start", "ticker", "start", {"fieldSize", "totalLaps"}, "Rennstart (Ampel/Fahne, das Feld setzt sich in Bewegung)",
   "kein Wetter (dafür gibt es einen eigenen Pool), niemand führt schon", reject=WEATHER, emoji="🏁",
   digits_ok=r"Runde 1\b|Kurve 1\b")
_p("ticker.pit", "ticker", "pit", {"lap", "driver", "team", "pos", "totalLaps"}, "ein Fahrer fährt an die Box",
   "keinen Grund für den Stopp erfinden (kein Schaden, keine Strafe); {pos} ist die Position beim Hereinkommen",
   reject=r"Schaden|Defekt|Strafe|Plattfuß|\bPanne|kaputt|Problem", emoji="🔧")
_p("ticker.overtake", "ticker", "overtake", {"lap", "driver", "victim", "pos"}, "ein Fahrer überholt einen anderen",
   "nicht behaupten, dass er die Führung übernimmt; keine Berührung oder Kollision erfinden",
   reject=r"Führung|an die Spitze|übernimmt die Spitze|führt jetzt|Leader|Kollision",
   warn=r"Berührung|touchiert|Kontakt", need={"driver"}, emoji="⚡")
_p("ticker.dnf_mechanical", "ticker", "dnf_mechanical", {"lap", "reason", "driver", "team", "pos"},
   "Ausfall durch technischen Defekt",
   "nur den übergebenen {reason} nennen, keinen anderen Schaden; kein Unfall; etwa die Hälfte der Zeilen ohne {reason}",
   reject=ACCIDENT + "|" + INJURY, emoji="❌")
_p("ticker.dnf_accident", "ticker", "dnf_accident", {"lap", "reason", "driver", "team", "pos"},
   "Ausfall durch Unfall oder Abflug",
   "keine technische Ursache; keine Verletzung andeuten (Tod ist ein eigenes Ereignis); etwa die Hälfte der Zeilen ohne {reason}",
   reject=MECHANIC + "|" + INJURY, emoji="❌")
_p("ticker.death", "ticker", "death", {"lap", "driver", "team"}, "tödlicher Unfall eines Fahrers",
   "nüchtern und respektvoll, kein Pathos; keine Umstände, keine medizinischen Details, keine Schuld",
   reject=DEATH_DETAIL, need={"driver"}, emoji="💀")
_p("ticker.finish", "ticker", "finish", {"driver", "team"}, "der Sieger fährt über die Ziellinie",
   "kein „ungefährdet“, „dominant“, „souverän“: der Abstand ist unbekannt",
   reject=r"ungefährdet|dominant|souverän|überlegen|Start-Ziel|Vorsprung|deutlich", need={"driver"}, emoji="🏁",
   digits_ok=r"\bP1\b")
# Ticker: Regen und rote Flagge (Paket 1b)
_p("ticker.wet_start", "ticker", "wet_start", {"fieldSize", "totalLaps"},
   "Start bei durchgehend nassem Rennen, direkt nach der Startmeldung",
   "nur sagen, dass die Bahn nass ist; nicht behaupten, dass es gerade regnet", emoji="🌧️")
_p("ticker.rain_arrives", "ticker", "rain_arrives", {"lap", "leader"}, "Regen setzt im laufenden Rennen ein",
   "kein Boxenstopp, keine Reifenwahl als Tatsache behaupten; niemand „profitiert“; keine Intensität, "
   "keine Ausdehnung, keine Orte, kein Zustand des Führenden, keine Duelle",
   emoji="🌧️", driver_slot=True)
_p("ticker.track_drying", "ticker", "track_drying", {"lap", "leader"}, "die Strecke trocknet ab",
   "keine Behauptung über Reifenwechsel", emoji="☀️")
_p("ticker.red_flag", "ticker", "red_flag", {"lap", "leader"}, "Rennunterbrechung, **Grund unbekannt**",
   "**keine** Ursache (kein Unfall, Öl, Feuer, Trümmer, Sicherheit) und **kein Wetter**",
   reject=CAUSE + "|" + WEATHER, eras=["e62", "e76", "e94", "e10"], emoji="🟥")
_p("ticker.red_flag_wet", "ticker", "red_flag_wet", {"lap", "leader"}, "Unterbrechung bei nassem Rennen",
   "Wetter darf als Kulisse genannt werden, sonst keine Ursache",
   reject=CAUSE, eras=["e62", "e76", "e94", "e10"], emoji="🟥")
_p("ticker.restart_new", "ticker", "restart_new", {"lap", "totalLaps"}, "Wiederaufnahme vor 2000: Neustart",
   "nichts zu Wertung, Punkten, Addition", reject=SCORING, eras=["e62", "e76", "e94"], emoji="🟢")
_p("ticker.restart_resume", "ticker", "restart_resume", {"lap", "leader"},
   "Wiederaufnahme ab 2000: Fortsetzung, Abstände gelöscht, Feld dicht, neue Reifen frei",
   "darf Reifen, Zusammenschieben, neue Chance für Verfolger nennen, aber **nicht** behaupten, dass jemand profitiert",
   reject=PROFIT, eras=["e94", "e10"], emoji="🟢")

# Saison-Rückblick (Paket B)
_R = "rueckblick"
_p("rueckblick.opener.dominant", _R, "opener.dominant", {"champion", "year", "siegeDat", "siegeNom", "points", "klasseIn", "klasseGen", "klasseNom"},
   "Eröffnungssatz: der Weltmeister hat die Saison klar beherrscht", "", reject=FIRST_TIME, need={"champion"})
_p("rueckblick.opener.knapp", _R, "opener.knapp", {"champion", "vize", "year", "gapNom", "gapDat", "gapAkk", "klasseNom", "klasseGen", "klasseIn"},
   "Eröffnungssatz: der Titel wurde knapp entschieden", "Abstand nur über {gapNom}/{gapDat}/{gapAkk}", reject=FIRST_TIME, need={"champion"})
_p("rueckblick.opener.normal", _R, "opener.normal", {"champion", "year", "points", "siegeDat", "siegeNom", "klasseGen", "klasseIn", "klasseNom"},
   "Eröffnungssatz: ein gewöhnlich entschiedener Titel", "", reject=FIRST_TIME, need={"champion"})
_p("rueckblick.duell.dominant", _R, "duell.dominant", {"vize", "vizePoints", "gapDat", "gapAkk", "gapNom"},
   "Satz über den Vizemeister, wenn der Meister weit vorn lag", "", reject=FIRST_TIME, need={"vize"})
_p("rueckblick.duell.knapp", _R, "duell.knapp", {"vize", "vizePoints"},
   "Satz über den Vizemeister nach knappem Titelkampf", "", reject=FIRST_TIME, need={"vize"})
_p("rueckblick.duell.normal", _R, "duell.normal", {"vize", "vizePoints", "gapAkk", "gapDat", "gapNom"},
   "Satz über den Vizemeister im Normalfall", "", reject=FIRST_TIME, need={"vize"})
_p("rueckblick.special.rookie", _R, "special.rookie", {"champion", "klasseNom", "fahrerPl", "presseNom", "klasseIn"},
   "Sonderfall: der Weltmeister ist ein Neuling in seiner ersten Saison", "")
_p("rueckblick.special.underdog", _R, "special.underdog", {"champion", "champTeam", "champTeamRank"},
   "Sonderfall: Meister mit einem Team, das in der Konstrukteurswertung nur Rang vier oder schlechter war",
   "", reject=FIRST_TIME)
_p("rueckblick.special.mostWinsLost", _R, "special.mostWinsLost", {"champion", "maxWinner", "maxWinnerSiegeNom", "klasseIn"},
   "Sonderfall: ein anderer Fahrer hat mehr Rennen gewonnen als der Meister", "", reject=FIRST_TIME, need={"maxWinner"})
_p("rueckblick.special.poleKing", _R, "special.poleKing", {"champion", "poles", "year"},
   "Sonderfall: der Meister stand in mindestens der Hälfte der Rennen auf der Pole-Position", "", reject=FIRST_TIME, need={"champion"})
_p("rueckblick.team.double", _R, "team.double", {"teamChampionName", "klasseGen", "year", "teamChampionPoints"},
   "Konstrukteurstitel ging an das Team des Fahrer-Weltmeisters (Doppelkrone)", "", reject=FIRST_TIME, need={"teamChampionName"})
_p("rueckblick.team.separate", _R, "team.separate", {"teamChampionName", "teamChampionPoints", "klasseGen"},
   "Konstrukteurstitel ging an ein anderes Team als das des Fahrer-Weltmeisters", "", reject=FIRST_TIME, need={"teamChampionName"})
_p("rueckblick.tragik.one", _R, "tragik.one", {"deadName", "deadTeam", "deadRaceBei", "klasseNom", "klasseIn"},
   "ein Fahrer ist in dieser Saison tödlich verunglückt",
   "keine Todesumstände, keine Ursache; das Rennen nur über {deadRaceBei}",
   reject=DEATH_DETAIL, warn=r"Unfall|Crash", need={"deadName"})
_p("rueckblick.tragik.many", _R, "tragik.many", {"deadList", "deadCount", "klasseNom", "fahrerPl", "klasseIn"},
   "mehrere Fahrer sind in dieser Saison tödlich verunglückt", "keine Todesumstände, keine Ursache",
   reject=DEATH_DETAIL, warn=r"Unfall|Crash", need={"deadList"})
_p("rueckblick.closer.normal", _R, "closer.normal", {"presseNom", "publikum", "klasseNom", "klasseGen", "year", "fahrerPl"},
   "Schlusssatz einer Saison ohne Todesfall", "", reject=FIRST_TIME)
_p("rueckblick.closer.tragic", _R, "closer.tragic", {"year", "klasseIn", "klasseNom", "klasseGen"},
   "Schlusssatz einer Saison mit Todesfall", "gedämpft, keine Umstände", reject=DEATH_DETAIL)

# Saison-Vorschau (Paket 4)
_V = "vorschau"
_VREJ = FORECAST_CLAIM + "|" + FIRST_TIME     # Vorgeschichte unbekannt
_VREJ_BEKANNT = FORECAST_CLAIM                # Titelverteidiger/Debütant: diese Vorgeschichte stimmt
_p("vorschau.verteidiger", _V, "verteidiger", {"champion", "year", "klasseGen", "klasseIn"},
   "Satz über den Titelverteidiger (Meister des Vorjahres) vor der neuen Saison", "", reject=_VREJ_BEKANNT, need={"champion"})
_p("vorschau.favorit.herausforderer", _V, "favorit.herausforderer", {"favorit", "favoritTeam", "year", "presseNom"},
   "Satz über den Favoriten, der NICHT Titelverteidiger ist", "", reject=_VREJ, need={"favorit"})
_p("vorschau.favorit.verteidigerFavorit", _V, "favorit.verteidigerFavorit", {"favorit", "year", "presseNom"},
   "der Titelverteidiger ist zugleich der Favorit", "", reject=_VREJ_BEKANNT, need={"favorit"})
_p("vorschau.favorit.duo", _V, "favorit.duo", {"favorit", "favorit2", "year", "presseNom"},
   "zwei Favoriten gelten als gleich stark", "beide gleich behandeln", reject=_VREJ, need={"favorit", "favorit2"})
_p("vorschau.rookie.one", _V, "rookie.one", {"rookieList", "neulingSg", "klasseIn", "year"},
   "ein Neuling debütiert in dieser Saison", "nichts über seine Vorgeschichte", reject=_VREJ_BEKANNT, need={"rookieList"})
_p("vorschau.rookie.many", _V, "rookie.many", {"rookieList", "neulingPl", "klasseIn", "year"},
   "mehrere Neulinge debütieren in dieser Saison", "nichts über ihre Vorgeschichte", reject=_VREJ_BEKANNT, need={"rookieList"})
_p("vorschau.wechsel", _V, "wechsel", {"wechselName", "wechselTeam"},
   "ein bekannter Fahrer startet für ein neues Team", "kein Grund für den Wechsel erfinden", reject=_VREJ, need={"wechselName"})
_p("vorschau.closer", _V, "closer", {"auftakt", "neulingPl", "klasseNom", "publikum", "presseNom", "year"},
   "Schlusssatz der Vorschau: Ausblick, offene Frage", "", reject=_VREJ)

# Nachruf (Paket C) – Fahrer ist tödlich verunglückt
_N = "nachruf"
_CAT = {
    "champion":   "war mindestens einmal Weltmeister",
    "talent":     "war höchstens 25 Jahre alt (vielleicht mit Erfolgen, vielleicht ohne)",
    "star":       "hat Rennen gewonnen oder mindestens drei Podestplätze erreicht",
    "backmarker": "fuhr mindestens 50 Rennen, ohne Sieg und mit höchstens zwei Podestplätzen",
    "generic":    "über seine Erfolge ist nichts bekannt",
    "gaveup":     "gibt vorzeitig auf, weil ihm die Kraft oder der Wille fehlt (nicht aus Altersgründen)",
}
_NO_WIN = TITLE + "|" + WIN_CLAIM
# Erfolgswörter nur markieren, nie ablehnen: Verneinungen sind zulässig („gewann nie ein Rennen“)
def _erfolg_warn(cat):
    return {"champion": "", "star": TITLE, "talent": _NO_WIN}.get(cat, _NO_WIN)

for cat in ("champion", "talent", "star", "backmarker", "generic"):
    _p("nachruf.open." + cat, _N, "nachruf.open." + cat, {"name", "nameE", "klasseNom", "klasseGen", "klasseIn"},
       "Eröffnungssatz des Nachrufs. Der Fahrer " + _CAT[cat] + ".",
       "{nameE} nur als Subjekt; Zeilen mit {name} und mit {nameE} mischen",
       reject=DEATH_DETAIL, warn=_erfolg_warn(cat))
_p("nachruf.stats", _N, "nachruf.stats", {"bilanz"}, "Satz, der die Karrierebilanz des Verstorbenen nennt",
   "{bilanz} genau einmal, als Aufzählung", reject=DEATH_DETAIL, need={"bilanz"})
_p("nachruf.close", _N, "nachruf.close", {"klasseNom", "klasseIn", "klasseGen", "fahrerPl"},
   "Schlusssatz des Nachrufs", "passt zu jedem Verstorbenen, ob Meister oder Hinterbänkler",
   reject=DEATH_DETAIL, warn=_NO_WIN)

# Abschied (Paket C + Werdegang Paket 3) – Fahrer tritt zurück
_A = "abschied"
for cat in ("champion", "talent", "star", "backmarker", "gaveup", "generic"):
    _p("abschied.open." + cat, _A, "abschied.open." + cat, {"name", "nameE", "klasseIn"},
       "Eröffnungssatz des Abschieds. Der Fahrer " + _CAT[cat] + ".",
       "{nameE} nur als Subjekt; Zeilen mit {name} und mit {nameE} mischen",
       reject=INJURY, warn=_erfolg_warn(cat))
    for z in ("mitZenit", "ohneZenit"):
        ph = {"seasonsText", "peakText"} if z == "mitZenit" else {"seasonsText"}
        _p("abschied.werdegang.%s.%s" % (cat, z), _A, "abschied.werdegang.%s.%s" % (cat, z), ph,
           "Werdegang-Satz zwischen Eröffnung und Bilanz. Der Fahrer " + _CAT[cat] + ". "
           + ("Sein Höhepunkt ist bekannt ({peakText})." if z == "mitZenit"
              else "Ein klarer Höhepunkt ist NICHT bekannt; der Satz erscheint auch neben Fahrern mit Höhepunkt."),
           "erzählt den Bogen vom Debüt bis heute; " + ("{peakText} genau einmal" if z == "mitZenit" else "kein {peakText}"),
           reject=INJURY, warn=_erfolg_warn(cat), need={"peakText"} if z == "mitZenit" else ())
_p("abschied.stats", _A, "abschied.stats", {"bilanz"}, "Satz, der die Karrierebilanz des Zurückgetretenen nennt",
   "{bilanz} genau einmal, als Aufzählung", reject=INJURY, need={"bilanz"})
_p("abschied.close", _A, "abschied.close", {"klasseIn", "klasseNom", "fahrerPl"}, "Schlusssatz des Abschieds",
   "passt zu jedem Zurückgetretenen, ob Meister oder Hinterbänkler", reject=INJURY, warn=_NO_WIN)

# Fahrer-Kurzporträt (Paket 2) – nur erfundene Fahrer
_ARCH = {
    "regenmeister": "im Regen deutlich stärker als sonst",
    "metronom":     "sehr konstant, mittleres Tempo",
    "draufgaenger": "sehr schnell, aber unbeständig",
    "rohdiamant":   "jung, großes Potenzial, wenige Rennen (nie für einen Älteren schreiben)",
    "routinier":    "erfahren und älter",
    "allrounder":   "ausgewogen, ohne Schwäche",
    "kaempfer":     "Mittel- oder Hinterfeld ohne besondere Stärke, aber mit Biss (nicht kleinreden, nicht überhöhen)",
}
for a, sig in _ARCH.items():
    _p("bio.kern." + a, "bio", "kern." + a, {"name", "nationAdj"},
       "erster Satz des Porträts. Archetyp „%s“: %s." % (a, sig),
       "etwa die Hälfte der Zeilen mit {nationAdj}, der Rest nur mit {name} oder ohne Platzhalter",
       reject=BIOGRAPHY, warn=BIO_WARN, eras=E_ALL)
    _p("bio.farbe." + a, "bio", "farbe." + a, set(),
       "zweiter Satz des Porträts, ohne Namen (mit „er“/„sein“). Archetyp „%s“: %s." % (a, sig),
       "keine Platzhalter; zeitlos, weil er in jeder Epoche erscheint", reject=BIOGRAPHY, warn=BIO_WARN, eras=[])

# Duelle (Paket 5)
_DT = {
    "eng":        ("Teamkollegen-Duell dieser Saison, ausgeglichen", "neutral gegenüber beiden"),
    "dominanz":   ("Teamkollegen-Duell dieser Saison, klar einseitig: {driver} ist vorn", "{driver} ist immer der Überlegene"),
    "augenhoehe": ("zwei Spitzenfahrer, nah beieinander in der WM-Wertung (nicht unbedingt im selben Team)",
                   "{h2hText} ist hier ein Wertungsabstand („nur drei Punkte Abstand in der Wertung“, „punktgleich in der Wertung“)"),
    "fehde":      ("Duell über mehrere Jahre", "{seasonsText} nennt die Dauer; trotzdem nur Sport, keine Feindschaft"),
}
for t, (wann, zus) in _DT.items():
    ph = {"driver", "rival", "h2hText"} | ({"seasonsText"} if t == "fehde" else set())
    _p("duell." + t, "duell", t, ph, wann, zus, reject=FEUD, warn=FEUD_WARN)


def group_of(pid):
    return GROUPS[POOLS[pid]["group"]]

def eras_of(pid):
    """Ären eines Pools. [] = Pool ohne Ära-Achse (zeitlos)."""
    p, g = POOLS[pid], group_of(pid)
    if p["eras"] is not None:
        return p["eras"]
    return ALL_ERAS if g["era"] else []

def bank_path(pid, era=None):
    p, g = POOLS[pid], group_of(pid)
    return g["bank"] + "." + p["path"] + ("." + era if era else "")

def ph_info(pid, name):
    return group_of(pid)["ph"].get(name, ("", "", ""))
