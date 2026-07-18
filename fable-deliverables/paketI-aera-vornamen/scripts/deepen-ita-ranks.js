#!/usr/bin/env node
// Paket I — Nachtrag (2026-07-18): ITA-Dekadenlisten 50 → ~120 Namen vertiefen.
//
// PROBLEM: ita-decade-ranks.json hatte nur die Top-50 je Dekade (Union: 113
// Namen) → ITA blieb als einzige Nation deutlich unter Budget (407/590) und
// die Frühjahrgänge sind dünn (eff 27 bei ~1930 ggü. USA eff 51).
// LÖSUNG: kuratierte Tail-Ränge 51–~120 je Dekade, gleiche Anker wie die
// Top-50 (Living-Population-Liste, De Felice, ISTAT-1999-Endpunkt), aber
// gröbere Genauigkeit (±15 Ränge statt ±5 — Tail-Anteile sind klein, der
// Kurven-Fit glättet). Die Top-50 bleiben BYTE-IDENTISCH erhalten.
//
// Kurations-Leitlinien je Ära:
//  - Klassiker mit langem Atem (Carmine/Ciro/Cosimo/Vito/Donato/Saverio …)
//    ziehen sich als Süd-Sockel durch ALLE Dekaden im Tail.
//  - Umbertinisch/Risorgimento (Ottorino, Oreste, Achille, Ulisse, Spartaco,
//    Otello, Duilio) nur früh; Guerrino/Gastone/Libero 1910er–30er.
//  - Gian-/Pier-Komposita (Gianni, Giampiero, Pierluigi, Pierpaolo …)
//    ab den 1930ern, Gipfel 1940er–60er; Gianmarco/Gianmaria erst 70er+.
//  - Moden-Vorläufer tauchen eine Dekade vor ihrem Top-50-Einstieg im Tail
//    auf (Andrea/Luca/Fabio in den 1950ern, Davide/Matteo in den 1960ern).
//  - Anglo-/Import-Moden (Alex, Denis, Thomas, Michael, Kevin, Omar …) erst
//    1970er-Tail, breiter 80er/90er — werden NICHT gefiltert (nationale
//    Statistik-Logik; Routing/Ban übernimmt ERA_FIRST_EXCLUDE, Welle 3).
//
// Aufruf: node deepen-ita-ranks.js  → überschreibt ../data/ita-decade-ranks.json
// Danach: node derive-era-first-names.js (Kurven) + gen-era-curve-excludes.js.
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'data', 'ita-decade-ranks.json');
const j = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const EXT = {
  1900: [
    'Alfonso', 'Agostino', 'Adolfo', 'Arnaldo', 'Aristide', 'Ferruccio', 'Camillo',
    'Carmelo', 'Carmine', 'Ciro', 'Corrado', 'Cosimo', 'Gerardo', 'Donato', 'Biagio',
    'Vito', 'Nunzio', 'Alessandro', 'Sebastiano', 'Filippo', 'Lorenzo', 'Bernardo',
    'Battista', 'Benedetto', 'Bartolomeo', 'Gaspare', 'Girolamo', 'Gioacchino',
    'Guglielmo', 'Gustavo', 'Goffredo', 'Gregorio', 'Ignazio', 'Leopoldo', 'Lodovico',
    'Lucio', 'Marino', 'Martino', 'Natale', 'Nazzareno', 'Orazio', 'Orlando',
    'Osvaldo', 'Ottavio', 'Ottorino', 'Primo', 'Quinto', 'Raimondo', 'Remo',
    'Riccardo', 'Rinaldo', 'Rodolfo', 'Romeo', 'Romolo', 'Rosario', 'Ruggero',
    'Sante', 'Saverio', 'Secondo', 'Serafino', 'Severino', 'Teodoro', 'Tommaso',
    'Tullio', 'Ulisse', 'Valentino', 'Virgilio', 'Ercole', 'Fortunato', 'Felice'
  ],
  1910: [
    'Alfonso', 'Agostino', 'Carmelo', 'Carmine', 'Ciro', 'Corrado', 'Cosimo',
    'Gerardo', 'Donato', 'Biagio', 'Vito', 'Nunzio', 'Alessandro', 'Sebastiano',
    'Filippo', 'Lorenzo', 'Ferruccio', 'Adolfo', 'Arnaldo', 'Aristide', 'Camillo',
    'Bernardo', 'Battista', 'Benedetto', 'Gaspare', 'Girolamo', 'Gioacchino',
    'Guglielmo', 'Gustavo', 'Ignazio', 'Lucio', 'Martino', 'Natale', 'Nazzareno',
    'Orazio', 'Orlando', 'Osvaldo', 'Ottavio', 'Ottorino', 'Primo', 'Raimondo',
    'Remo', 'Riccardo', 'Rinaldo', 'Rodolfo', 'Romeo', 'Romolo', 'Rosario',
    'Ruggero', 'Sante', 'Saverio', 'Secondo', 'Serafino', 'Severino', 'Teodoro',
    'Tommaso', 'Tullio', 'Valentino', 'Virgilio', 'Ercole', 'Fortunato', 'Felice',
    'Fausto', 'Ezio', 'Livio', 'Lino', 'Nello', 'Otello', 'Duilio', 'Spartaco'
  ],
  1920: [
    'Alfonso', 'Carmelo', 'Carmine', 'Ciro', 'Cosimo', 'Gerardo', 'Donato',
    'Biagio', 'Vito', 'Nunzio', 'Alessandro', 'Sebastiano', 'Filippo', 'Lorenzo',
    'Corrado', 'Agostino', 'Lucio', 'Livio', 'Lino', 'Nello', 'Fausto', 'Ezio',
    'Ennio', 'Fulvio', 'Flavio', 'Tullio', 'Riccardo', 'Rosario', 'Ruggero',
    'Saverio', 'Sante', 'Severino', 'Serafino', 'Teodoro', 'Tommaso', 'Natale',
    'Nazzareno', 'Orazio', 'Orlando', 'Osvaldo', 'Ottorino', 'Primo', 'Raimondo',
    'Remo', 'Rinaldo', 'Rodolfo', 'Romeo', 'Romolo', 'Valentino', 'Virgilio',
    'Ercole', 'Fortunato', 'Felice', 'Gastone', 'Germano', 'Gilberto', 'Giuliano',
    'Guerrino', 'Ilario', 'Ivo', 'Lamberto', 'Leandro', 'Libero', 'Manlio',
    'Mariano', 'Martino', 'Nevio', 'Oreste', 'Otello', 'Duilio'
  ],
  1930: [
    'Alfonso', 'Carmelo', 'Carmine', 'Ciro', 'Cosimo', 'Gerardo', 'Donato',
    'Biagio', 'Vito', 'Nunzio', 'Alessandro', 'Sebastiano', 'Filippo', 'Lorenzo',
    'Corrado', 'Lucio', 'Livio', 'Lino', 'Nello', 'Fausto', 'Ezio', 'Ennio',
    'Fulvio', 'Flavio', 'Tullio', 'Riccardo', 'Rosario', 'Ruggero', 'Saverio',
    'Severino', 'Serafino', 'Tommaso', 'Natale', 'Nazzareno', 'Orazio', 'Orlando',
    'Osvaldo', 'Ottavio', 'Primo', 'Raimondo', 'Remo', 'Rinaldo', 'Rodolfo',
    'Romeo', 'Romolo', 'Valentino', 'Virgilio', 'Ercole', 'Fortunato', 'Felice',
    'Gastone', 'Germano', 'Giuliano', 'Guerrino', 'Ilario', 'Ivo', 'Lamberto',
    'Leandro', 'Libero', 'Manlio', 'Mariano', 'Nevio', 'Piero', 'Pierluigi',
    'Gianni', 'Danilo', 'Dario', 'Arrigo', 'Oreste', 'Ferruccio'
  ],
  1940: [
    'Piero', 'Gianni', 'Pierluigi', 'Giampiero', 'Gianpaolo', 'Gianluigi',
    'Danilo', 'Dario', 'Alfonso', 'Carmelo', 'Carmine', 'Ciro', 'Cosimo',
    'Gerardo', 'Donato', 'Biagio', 'Vito', 'Nunzio', 'Alessandro', 'Sebastiano',
    'Filippo', 'Lorenzo', 'Corrado', 'Lucio', 'Livio', 'Lino', 'Fausto', 'Ezio',
    'Ennio', 'Fulvio', 'Flavio', 'Tullio', 'Riccardo', 'Rosario', 'Ruggero',
    'Saverio', 'Severino', 'Tommaso', 'Natale', 'Orazio', 'Orlando', 'Osvaldo',
    'Ottavio', 'Primo', 'Raimondo', 'Remo', 'Rinaldo', 'Rodolfo', 'Romeo',
    'Valentino', 'Virgilio', 'Felice', 'Germano', 'Giuliano', 'Ilario', 'Ivo',
    'Leandro', 'Mariano', 'Marino', 'Nevio', 'Oscar', 'Mirco', 'Ivano', 'Loris',
    'Moreno', 'Sandro', 'Adriano', 'Antonino', 'Agostino', 'Italo'
  ],
  1950: [
    'Adriano', 'Sandro', 'Piero', 'Gianni', 'Pierluigi', 'Giampiero', 'Gianpaolo',
    'Gianluigi', 'Pierpaolo', 'Piergiorgio', 'Pierangelo', 'Danilo', 'Fabrizio',
    'Fabio', 'Andrea', 'Alessandro', 'Luca', 'Daniele', 'Diego', 'Corrado',
    'Riccardo', 'Tiziano', 'Valerio', 'Valter', 'Oscar', 'Ivano', 'Ivan', 'Mirco',
    'Moreno', 'Loris', 'Lucio', 'Livio', 'Lino', 'Fausto', 'Ezio', 'Ennio',
    'Fulvio', 'Flavio', 'Tullio', 'Rosario', 'Ruggero', 'Saverio', 'Sebastiano',
    'Filippo', 'Lorenzo', 'Tommaso', 'Osvaldo', 'Ottavio', 'Remo', 'Rinaldo',
    'Romeo', 'Valentino', 'Felice', 'Germano', 'Giuliano', 'Ivo', 'Leandro',
    'Mariano', 'Marino', 'Nevio', 'Alfonso', 'Carmelo', 'Carmine', 'Ciro',
    'Cosimo', 'Gerardo', 'Donato', 'Biagio', 'Vito', 'Antonino'
  ],
  1960: [
    'Davide', 'Emanuele', 'Federico', 'Alessio', 'Matteo', 'Filippo', 'Giacomo',
    'Gabriele', 'Cristian', 'Christian', 'Manuel', 'Mirko', 'Ivan', 'Emiliano',
    'Fabiano', 'Patrizio', 'Pierluigi', 'Pierpaolo', 'Piergiorgio', 'Pierangelo',
    'Piercarlo', 'Giampiero', 'Gianpaolo', 'Gianluigi', 'Gianni', 'Piero',
    'Adriano', 'Danilo', 'Tiziano', 'Valerio', 'Valter', 'Oscar', 'Renato',
    'Aldo', 'Enzo', 'Marcello', 'Renzo', 'Gianfranco', 'Giancarlo', 'Umberto',
    'Giacinto', 'Rocco', 'Gennaro', 'Raffaele', 'Vittorio', 'Guido', 'Silvano',
    'Romano', 'Fernando', 'Elio', 'Alfonso', 'Carmelo', 'Carmine', 'Ciro',
    'Cosimo', 'Gerardo', 'Donato', 'Biagio', 'Vito', 'Antonino', 'Rosario',
    'Saverio', 'Sebastiano', 'Lorenzo', 'Tommaso', 'Flavio', 'Fulvio', 'Lucio',
    'Ruggero', 'Mariano'
  ],
  1970: [
    'Nicolò', 'Jacopo', 'Mattia', 'Tommaso', 'Edoardo', 'Lorenzo', 'Leonardo',
    'Samuele', 'Cristiano', 'Emiliano', 'Fabiano', 'Damiano', 'Moreno', 'Loris',
    'Ivano', 'Oscar', 'Patrizio', 'Tiziano', 'Valerio', 'Walter', 'Gianni',
    'Gianpaolo', 'Giampiero', 'Gianluigi', 'Gianmarco', 'Pierluigi', 'Pierpaolo',
    'Pierangelo', 'Piergiorgio', 'Pierfrancesco', 'Adriano', 'Danilo', 'Sandro',
    'Piero', 'Corrado', 'Flavio', 'Fulvio', 'Marcello', 'Renato', 'Renzo', 'Enzo',
    'Aldo', 'Bruno', 'Franco', 'Luciano', 'Giancarlo', 'Gianfranco', 'Umberto',
    'Raffaele', 'Vittorio', 'Gaetano', 'Pasquale', 'Rocco', 'Gennaro', 'Alfonso',
    'Carmelo', 'Carmine', 'Ciro', 'Cosimo', 'Gerardo', 'Donato', 'Biagio', 'Vito',
    'Antonino', 'Rosario', 'Saverio', 'Sebastiano', 'Marino', 'Alex', 'Denis'
  ],
  1980: [
    'Lorenzo', 'Leonardo', 'Elia', 'Cristiano', 'Gianmarco', 'Gianmaria',
    'Gianluigi', 'Gianpaolo', 'Pierluigi', 'Pierpaolo', 'Pierfrancesco',
    'Damiano', 'Emiliano', 'Fabiano', 'Alex', 'Denis', 'Dennis', 'Thomas',
    'Michael', 'Jonathan', 'Nicholas', 'Patrick', 'Kevin', 'Omar', 'Oscar',
    'Ruben', 'Loris', 'Moreno', 'Ivano', 'Tiziano', 'Valerio', 'Flavio', 'Dario',
    'Fabrizio', 'Corrado', 'Marcello', 'Sergio', 'Giorgio', 'Mauro', 'Enzo',
    'Franco', 'Luciano', 'Bruno', 'Renato', 'Giancarlo', 'Gianfranco', 'Umberto',
    'Raffaele', 'Vittorio', 'Gaetano', 'Pasquale', 'Rocco', 'Gennaro', 'Carmine',
    'Ciro', 'Alfonso', 'Carmelo', 'Cosimo', 'Gerardo', 'Donato', 'Biagio', 'Vito',
    'Antonino', 'Rosario', 'Saverio', 'Sebastiano', 'Marino', 'Mariano', 'Walter',
    'Massimo'
  ],
  1990: [
    'Gianmarco', 'Gianmaria', 'Pierluigi', 'Pierpaolo', 'Damiano', 'Emiliano',
    'Alex', 'Denis', 'Dennis', 'Thomas', 'Michael', 'Jonathan', 'Nicholas',
    'Patrick', 'Kevin', 'Omar', 'Ruben', 'Samuel', 'Daniel', 'Gioele', 'Giulio',
    'Giorgio', 'Dario', 'Fabrizio', 'Flavio', 'Valerio', 'Massimo',
    'Massimiliano', 'Maurizio', 'Roberto', 'Claudio', 'Sergio', 'Mauro',
    'Marcello', 'Enzo', 'Franco', 'Bruno', 'Luciano', 'Umberto', 'Raffaele',
    'Vittorio', 'Gaetano', 'Pasquale', 'Rocco', 'Gennaro', 'Carmine', 'Ciro',
    'Alfonso', 'Carmelo', 'Cosimo', 'Gerardo', 'Donato', 'Biagio', 'Vito',
    'Antonino', 'Rosario', 'Saverio', 'Sebastiano', 'Mariano', 'Loris', 'Moreno',
    'Tiziano', 'Oscar', 'Ivano', 'Walter', 'Fabiano', 'Gregorio', 'Cesare',
    'Achille', 'Santo'
  ]
};

let unionBefore = new Set(), unionAfter = new Set();
for (const dec of Object.keys(EXT)) {
  const base = j[dec];
  if (!base || base.length !== 50) throw new Error(`Dekade ${dec}: erwartet 50 Basis-Namen, gefunden ${base && base.length}`);
  base.forEach(n => unionBefore.add(n));
  const seen = new Set(base);
  for (const n of EXT[dec]) {
    if (seen.has(n)) throw new Error(`Dekade ${dec}: Duplikat "${n}"`);
    seen.add(n);
  }
  j[dec] = base.concat(EXT[dec]);
  j[dec].forEach(n => unionAfter.add(n));
  console.log(`${dec}: 50 + ${EXT[dec].length} = ${j[dec].length}`);
}

j._meta.tail = 'Ränge 51–~120 je Dekade nachkuratiert (2026-07-18, deepen-ita-ranks.js): ' +
  'gleiche Anker wie die Top-50, Genauigkeit dort aber nur ±15 Ränge (Tail-Anteile ' +
  'sind klein, der Kurven-Fit glättet). Top-50 unverändert. Süd-Klassiker als ' +
  'Dauer-Sockel, Umbertinisches nur früh, Gian-/Pier-Komposita ab 1930er, ' +
  'Anglo-Moden ab 1970er-Tail (Routing/Ban → ERA_FIRST_EXCLUDE, Welle 3).';

fs.writeFileSync(FILE, JSON.stringify(j, null, 1) + '\n');
console.log(`Union kuratiert: ${unionBefore.size} → ${unionAfter.size}`);
console.log(`-> ${FILE}`);
