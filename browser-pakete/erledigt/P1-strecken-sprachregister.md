# Paket P1 (= Fable-Paket 8b): landestypische Strecken- und Rennnamen für 26 Nationen

Du arbeitest für ein Formel-1-Managerspiel (Browser, Deutsch, 1950 bis Zukunft). Du hast
**keinen** Zugriff auf das Projekt. Alles, was du brauchst, steht in dieser Datei. Frag
nicht nach dem Quellcode, er ist 3 MB groß und für diese Aufgabe unnötig.

## Worum es geht

Im Streckeneditor gibt es einen Zufalls-Button. Er wählt eine Nation, zieht einen echten
Ortsnamen `{loc}` aus einer Ortsdatenbank (GeoNames) und setzt ihn in zwei Muster ein:
ein **Streckenmuster** (`Autodromo di {loc}`) und ein **Rennmuster** (`Gran Premio di {loc}`).
Beide nutzen denselben Ort, damit Strecke und Rennen zusammenpassen.

30 Nationen haben ein eigenes Sprachregister. **26 Nationen** fallen noch auf ein
sprachneutrales Auffangregister `intl` zurück (`{loc} Circuit`, `Grand Prix of {loc}`).
Deine Aufgabe: für jede dieser 26 ein landestypisches Register bauen.

## Die 26 Nationen (IOC-Code, Beispielorte aus der Datenbank)

`k` = Kleinorte (für permanente Rennstrecken), `g` = Städte (für Stadtkurse).
Die Ortsnamen kommen **genau so** an, wie sie hier stehen, also teils ohne Diakritika.

| IOC | Land | Kleinorte (Beispiel) | Städte (Beispiel) |
|---|---|---|---|
| POL | Polen | Puławy, Wodzisław Śląski, Skierniewice | Warszawa, Kraków, Wrocław |
| ROU | Rumänien | Paşcani, Medgidia, Lugoj | Bucuresti, Iasi, Constanta |
| UKR | Ukraine | Horishni Plavni, Novovolynsk | Kyiv, Kharkiv, Odesa |
| GRE | Griechenland | Irákleio, Xánthi, Fylí | Athens, Thessaloníki, Pátra |
| SRB | Serbien | Zaječar, Trstenik, Sombor | Belgrade, Niš, Novi Sad |
| BUL | Bulgarien | Vratsa, Gabrovo, Kazanlak | Sofia, Plovdiv, Varna |
| EST | Estland | Pärnu, Kohtla-Järve, Viljandi | Tallinn, Tartu, Narva |
| NOR | Norwegen | Moss, Tromsø, Haugesund | Oslo, Bergen, Trondheim |
| DEN | Dänemark | Silkeborg, Hørsholm, Greve | København, Aarhus, Odense |
| IRL | Irland | Drogheda, Dundalk, Swords | Dublin, Cork, Limerick |
| LUX | Luxemburg | Dudelange, Belvaux, Schifflange | Luxembourg |
| CIV | Elfenbeinküste | Bonoua, Ouangolodougou | Abidjan, Abobo, Bouaké |
| MAR | Marokko | Jerada, Chefchaouen, Mrirt | Rabat, Fès, Tanger |
| KEN | Kenia | Habaswein, Molo, Moyale | Nairobi, Kakamega, Mombasa |
| EGY | Ägypten | Qillin, Mit Salsil | Cairo, Alexandria, Giza |
| SAU | Saudi-Arabien | Ranyah, Şafwá, Afif | Riyadh, Makkah, Madinah |
| ISR | Israel | Elad, Yavné, Ramat HaSharon | Jerusalem, Tel Aviv, Haifa |
| THA | Thailand | Chachoengsao, Cha-am, Pak Chong | Bangkok, Samut Prakan, Chon Buri |
| INA | Indonesien | Labuhan Deli, Gampengrejo | Jakarta, Kota Surabaya, Kota Bekasi |
| PHI | Philippinen | Cabiao, Morong, Consolacion | Quezon City, Davao, Caloocan |
| COL | Kolumbien | La Estrella, Samaniego, Plato | Bogotá, Cali, Medellín |
| VEN | Venezuela | Municipio Tovar, Palmira | Caracas, Maracaibo, Barquisimeto |
| CHI | Chile | Villarrica, Lota, Limache | Puente Alto, Maipú, Antofagasta |
| PER | Peru | Huancavelica, Centenario | Lima, El Callao, Arequipa |
| URU | Uruguay | Artigas, Mercedes, Durazno | Montevideo, Salto, Maldonado |
| ZIM | Simbabwe | Redcliff, Chiredzi, Hwange | Harare, Bulawayo, Chitungwiza |

## So sehen die vorhandenen Register aus (Vorbild für Format und Gewichte)

```js
// Eintrag = String ODER [muster, gewicht] ODER [muster, {e50:.., e62:.., e76:.., e94:.., e10:..}]
// String = Gewicht 5 in allen Ären. Objekt = Gewicht je Ära; fehlende Ära = 0 = ausgeblendet.
circuitPattern: {
  it: ['Autodromo di {loc}', ['Autodromo Nazionale {loc}', 4], 'Circuito di {loc}',
       ['Autodromo Internazionale {loc}', { e62: 1, e76: 2, e94: 3, e10: 3 }]],
  de: [['{loc}ring', 10], ['Motodrom {loc}', { e50: 3, e62: 4, e76: 4, e94: 2 }], 'Rennstrecke {loc}',
       ['{loc}-Schleife', { e50: 3, e62: 3, e76: 2 }], ['Motorsport-Arena {loc}', { e94: 1, e10: 3 }]],
  cz: ['Okruh {loc}', 'Autodrom {loc}'],
  se: ['{loc}banan', '{loc} Ring', 'Motorbana {loc}'],
  intl: [['{loc} Circuit', 10],
         ['{loc} International Circuit', { e50: 2, e62: 4, e76: 5, e94: 6, e10: 6 }],
         ['{loc} Raceway', 4],
         ['{loc} Autodrome', { e50: 3, e62: 3, e76: 2, e94: 1, e10: 1 }],
         ['{loc} Motor Racing Circuit', { e50: 3, e62: 2 }],
         ['{loc} Street Circuit', { e76: 3, e94: 3, e10: 4 }]]
},
racePattern: {
  it: [['Gran Premio di {loc}', 12], ['Coppa {loc}', { e50: 5, e62: 4, e76: 2, e94: 1 }],
       ['Trofeo {loc}', { e50: 4, e62: 3, e76: 1 }]],
  hu: ['{loc} Nagydíj', '{loc} Grand Prix'],
  intl: [['{loc} Grand Prix', 12], ['Grand Prix of {loc}', 6],
         ['{loc} Trophy', { e50: 4, e62: 3, e76: 1 }], ['{loc} Cup', { e50: 3, e62: 2, e76: 1 }]]
}
```

**Ären:** e50 = 1950–61 · e62 = 1962–75 · e76 = 1976–93 · e94 = 1994–2009 · e10 = 2010+

**Gemessene Leitplanken** (an 1.171 echten F1-Rennen, gelten für jedes neue Register):
- „Circuit" trägt die Streckennamen, von 45 % (50er) auf 71 % (heute).
- „International" steigt über die Jahrzehnte (1 % → 17 %).
- Stadtkurse („Street") gibt es erst **ab den 80ern**.
- „Park" fällt von 12 % auf 1 %, „Motor Racing Circuit" nur 50er/60er.
- Bei den Rennnamen dominiert „Grand Prix" in jeder Sprache (64 % in den 50ern, 92 % heute).
  Pokal-, Trophäen- und Coppa-Formen bleiben **klein** und **früh** (e50–e76).

## Regeln

1. **`{loc}` wird unverändert eingesetzt, immer im Nominativ.** Keine Muster, die eine
   Beugung des Ortsnamens verlangen. Beispiel Polen: `Grand Prix Warszawy` braucht den
   Genitiv, geht also nicht. `Tor {loc}` (wie Tor Poznań) geht. Genauso bei Slawisch,
   Griechisch, Finnisch-Ugrisch. Wenn die Landessprache fast immer beugt, nimm die
   invariante Form, die es real auch gibt (oft Englisch oder „Grand Prix {loc}").
2. **Real belegte Formen bevorzugen.** Es gibt in vielen dieser Länder echte Rennstrecken
   (Tor Poznań, Rudskogen, Jyllandsringen, Mondello Park, Auto24ring, Chang International
   Circuit, Sirkuit Sentul, Autódromo de Tocancipá, Donnybrook Park, Circuit Moulay El Hassan,
   Jeddah Corniche Circuit …). Leite die Muster aus ihnen ab, nicht aus dem Bauch.
   **Übernimm aber keine echten Streckennamen**, nur die Bauform (`{loc}ringen`, nicht „Jyllandsringen").
3. **Schrift:** lateinisch. Kein Kyrillisch, Griechisch, Arabisch, Hebräisch, Thai. Gängige
   Umschrift oder die englische bzw. französische Form, wie sie real an solchen Strecken steht.
4. **Ära beachten.** Viele dieser Länder hatten in den 50ern und 60ern keinen Motorsport,
   aber das Spiel zieht trotzdem Namen in jeder Ära. Die Muster müssen also 1955 genauso
   glaubwürdig klingen wie 2030. Moderne Wörter („Motorsport Park", „Arena") mit Ära-Gewicht erst spät.
5. **Stadtkurse markieren.** Das Spiel wählt bei einem Stadtkurs-Muster eine *Stadt* statt
   eines Kleinorts, und es erkennt das bisher am englischen Wort „Street". Hänge an jedes
   Stadtkurs-Muster in deiner Sprache den Kommentar `// STADT` an, etwa
   `['Circuito Callejero de {loc}', { e76: 2, e94: 3, e10: 3 }], // STADT`.
6. **Kein Sponsor-Präfix.** Sponsoren fügt das Spiel ab 1972 selbst hinzu.
7. **Umfang je Nation:** 3–6 Streckenmuster, 2–4 Rennmuster, mit Gewichten. Das
   Hauptmuster jeweils mit Gewicht 10 bzw. 12, wie oben.
8. **Nationen zusammenlegen ist erlaubt**, wenn sie sprachlich gleich ticken (z. B. ein
   gemeinsames Register `es_am` für COL/VEN/CHI/PER/URU), aber nur, wenn die Unterschiede
   wirklich klein sind. Sag dann, welche Nationen darauf zeigen.

## Rückgabe: genau eine Datei `paket8b-register.js`

```js
// Paket 8b – landestypische Sprachregister. Format wie CIRCUIT_NAME_POOLS.
const CIRCUIT_PATTERN_8B = {
  pl: [ ... ],
  // ...
};
const RACE_PATTERN_8B = {
  pl: [ ... ],
  // ...
};
// Welcher IOC-Code auf welches Register zeigt (neue Schlüssel frei wählbar, zwei Buchstaben
// oder sprechend wie es_am).
const CIRCUIT_NATION_KEY_8B = { POL: 'pl', /* ... alle 26 */ };
```

Darunter als Kommentarblock, kurz:
- je Nation ein Satz, **welche realen Strecken/Rennen** die Muster begründen,
- alle Stellen, an denen du unsicher bist (Grammatik, Umschrift), damit die Prüfung weiß, wo sie hinschauen muss,
- welche Nationen du zusammengelegt hast.

Arbeite die Nationen in Blöcken ab (erst Europa, dann Afrika/Nahost, dann Asien, dann
Südamerika) und zeig nach jedem Block kurz den Zwischenstand, bevor du weitermachst.
