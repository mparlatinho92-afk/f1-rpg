// Kurationspass über name-tails.out.js → name-tails.final.js
// Alle Eingriffe sind hier explizit dokumentiert (drop / move / rename) und reproduzierbar.
const fs = require('fs');
const src = fs.readFileSync('name-tails.out.js', 'utf8');
const TAILS = eval(src.replace('const NAME_TAILS_BY_NATION =', '(') .replace(/;\s*$/, ')'));

// Akzent-Reparatur (Datensatz ist teils ASCII-degradiert)
const ACCENT = {
    // Spanisch (ESP/MEX/COL/URU/USA-Hispanic bleiben ASCII-tolerant, aber Pools nutzen Akzente)
    'Gutierrez':'Gutiérrez','Ramirez':'Ramírez','Jimenez':'Jiménez','Nuñez':'Núñez','Mendez':'Méndez','Marquez':'Márquez','Cortes':'Cortés','Leon':'León','Duran':'Durán','Gimenez':'Giménez','Chavez':'Chávez','Guzman':'Guzmán','Juarez':'Juárez','Velazquez':'Velázquez','Velasquez':'Velásquez','Alvarez':'Álvarez','Vasquez':'Vásquez','Hernandez':'Hernández','Gonzalez':'González','Perez':'Pérez','Sanchez':'Sánchez','Garcia':'García','Martinez':'Martínez','Lopez':'López','Rodriguez':'Rodríguez','Gomez':'Gómez','Diaz':'Díaz','Suarez':'Suárez','Mejia':'Mejía','Cardenas':'Cárdenas','Rincon':'Rincón','Rios':'Ríos','Cesar':'César','Ivan':'Iván','Raul':'Raúl','Jesus':'Jesús','Andres':'Andrés','Agustin':'Agustín','Oscar':'Óscar','Victor':'Víctor','Angel':'Ángel','Fabian':'Fabián','Jose Luis':'José Luis','Jose Manuel':'José Manuel','Jose Maria':'José María','Miguel Angel':'Miguel Ángel','Martin':'Martín','Ruben':'Rubén','Sebastian':'Sebastián',
    // Französisch
    'Frederic':'Frédéric','Jerome':'Jérôme','Mickael':'Mickaël','Gerard':'Gérard','Francois':'François','Clement':'Clément','Noel':'Noël','Benoit':'Benoît','Andre':'André','Rene':'René','Eric':'Éric','Stephane':'Stéphane','Cedric':'Cédric','Lefevre':'Lefèvre',
    // Italienisch (ASCII-Apostrophe)
    'Dangelo':"D'Angelo",'Damico':"D'Amico",'Dagostino':"D'Agostino",
    // Irisch
    'Oreilly':"O'Reilly",'Oconnell':"O'Connell",'Mcgrath':'McGrath',
    // Russisch (Translit-Angleichung an Pool-Stil)
    'Grigorev':'Grigoriev','Vasilii':'Vasili','Anatolii':'Anatoli'
};
// Kontext-sensible Ausnahmen: in DE/AT/CH/NL/DK/SWE ist "Martin" etc. KEIN Spanisch → keine Akzente
const NO_ACCENT_NATIONS = new Set(['GER','AUT','SUI','NED','DEN','SWE','GBR','IRL','CZE','POL','HUN','EST','FIN','JPN','RUS','ISR','IND','MAS','INA','MAR','CAN','AUS','NZL']);
const ES_ONLY = new Set(['Martin','Ruben','Sebastian','Leon','Duran','Victor','Oscar','Angel','Ivan','Fabian']); // nur in Hispano-Nationen anfassen
const FR_NATIONS = new Set(['FRA','BEL','SUI','CAN','MON']);
const FR_ONLY = new Set(['Frederic','Jerome','Mickael','Gerard','Francois','Clement','Noel','Benoit','Andre','Rene','Eric','Stephane','Cedric','Lefevre']);

function fixName(nat, n) {
    if (!(n in ACCENT)) return n;
    if (ES_ONLY.has(n) && (NO_ACCENT_NATIONS.has(nat) || FR_NATIONS.has(nat))) return n;
    if (FR_ONLY.has(n) && !FR_NATIONS.has(nat) && nat !== 'GER') return n; // André/René auch in GER
    if (FR_ONLY.has(n) && nat === 'GER' && !['Andre','Rene'].includes(n)) return n;
    return ACCENT[n];
}

// OPS je Nation: drop = raus, move = Namen in andere Region-Nr. verschieben
const OPS = {
    GBR: { drop: { last: ['Louise'] } },
    GER: { drop: { first: ['Ali'], last: ['Can','Mueller'] } },
    ITA: { drop: { last: ['Giuseppe','Mauro','Salvatore','Marco','Francesco','Luca','Simone'] } },
    FRA: { drop: { last: ['Ben','Lou','Bou'] },
           move: { last: { 'Ndiaye':1,'Diaby':1,'Diarra':1,'Benoit':0 }, first: { 'Benjamin':0 } } },
    BRA: { drop: { last: ['Cristina','Aparecida','Junior','Neto','Filho','Felipe','Lucas','Alexandre','Roberto','Augusto','Paula','De Souza','De Oliveira'] } },
    JPN: { drop: { first: ['Marcelo','Roberto','Jorge'] } },
    ESP: { drop: { first: ['Mohamed','Javi','Rafa','Fran','Manolo'], last: ['Garcia Garcia'] },
           move: { first: { 'Joan':1 } } },
    BEL: { drop: { first: ['Mohamed','Ali'], last: ['Ben','Vdb'] },
           move: { last: { 'Desmet':1,'Devos':1,'Lemmens':1,'Dhondt':1,'Wauters':1,'Smet':1,'Declercq':1,'Baert':1,'Lambrechts':1,'Lauwers':1,'Bosmans':1,'Christiaens':1,'Pieters':1,'Cornelis':1,'Timmermans':1,'Janssen':1,'Jansen':1 },
                   first: { 'Eddy':1,'Danny':1,'Tim':1 } } },
    SUI: { drop: { first: ['Carlos','Ali'], last: ['Bajrami','Ramadani','Fernandez','Schmidt'] },
           move: { first: { 'Antonio':2,'Philippe':1 } } },
    SWE: { drop: { first: ['Ali'] } },
    DEN: { drop: { first: ['Ali'] } },
    CAN: { move: { last: { 'Lau':2,'Cheng':2,'Chung':2,'Saini':2,'Randhawa':2,'Mann':2 } },
           drop: { last: ['Kaur'] } },
    RSA: { drop: { last: ['Precious'] },
           move: { first: { 'Thabiso':2,'Lucky':2,'Mandla':2,'Thapelo':2,'Vusi':2,'Sbusiso':2,'Sanele':2 },
                   last: { 'Moyo':2,'Baloyi':2,'Sibiya':2,'Chauke':2,'Mazibuko':2,'Cele':2,'Mathebula':2,'Molefe':2,'Sibanda':2,'Maluleke':2,'Motaung':2,'Moloi':2,'Zungu':2,'Zondi':2,'Hadebe':2,'Vilakazi':2,'Xaba':2,'Van Wyk':1 } } },
    IRL: { drop: { last: ['Obrien','Oconnor','Osullivan','O Connor','O Brien','O Sullivan','Oneill'] } },
    RUS: { drop: { first: ['Aleksandr','Dmitrii','Evgenii','Aleksei','Maksim','Yurii','Sergey','Vitalii','Andrey'],
                   last: ['Magomedov','Aliev','Ibragimov','Akhmedov','Mamedov','Karimov','Gadzhiev','Yusupov','Abdullaev','Kurbanov','Shevchenko','Bondarenko','Kovalenko','Kravchenko','Tkachenko','Kim','Elena','Natalya','Tatyana','Sergeevich','Sergeevna','Aleksandrovich','Aleksandrovna','Vladimirovich','Aleksandr','Sergei','Vasilev'] } },
    POL: { drop: { first: ['Tomek','Bartek','Kuba','Wojtek'] } },
    CZE: { drop: { first: ['Honza','Jirka','Ondra','Vojta','Kuba','Jarda'],
                   last: ['Petr','Pavel','Jan','Novakova','Novotna'] } },
    HUN: { drop: { first: ['Nagy'],
                   last: ['László','Tamás','Gábor','Péter','Zoltán','Balázs','Attila','Sándor','István','Zsolt','János','Dávid','József','Csaba','Ferenc','András','Ádám','Máté','Tibor','Bálint','György','Gergely','Imre','Pál','Dániel','Andrea','Katalin','Éva','Judit'] } },
    ISR: { drop: { first: ['Mohammad','Mohamad'],
                   last: ['Mohammad','Awad','Abed','Amer','Saleh','Nassar','Salah','Hamdan','Khateeb','Israel','Moshe'] } },
    IND: { drop: { first: ['Mohd'], last: ['Kumari'] } },
    MAS: { drop: { first: ['Mohd','Muhd','Mohamad','Muhamad','Abdul','Mohammad','Wan','Tan','Lee'],
                   last: ['Mohd','Raj'] },
           move: { last: { 'Yee':1 } } },
    INA: { drop: { first: ['Mas','Abdul'], last: ['Sari','Dewi','Putri','Wati','Lestari'] } },
    EST: { drop: { first: ['Alex'], last: ['Ivanova','Smirnova','Petrova','Kuznetsova','Vassiljeva','Pavlova'] },
           move: { first: { 'Denis':1,'Viktor':1 }, last: { 'Hein':0 } } },
    MAR: { drop: { last: ['Med','Raja','Malak','Fleur','Khadija','Fatima','Mks','Agadir','Widadi','Nour','Rajawi'] } }
};

const out = {};
for (const [nat, regions] of Object.entries(TAILS)) {
    const ops = OPS[nat] || {};
    const byR = new Map();
    const put = (r, kind, name) => { if (!byR.has(r)) byR.set(r, { first: [], last: [] }); byR.get(r)[kind].push(name); };
    for (const reg of regions) {
        for (const kind of ['first', 'last']) {
            for (const raw of reg[kind]) {
                if (ops.drop?.[kind]?.includes(raw)) continue;
                const target = ops.move?.[kind]?.[raw] !== undefined ? ops.move[kind][raw] : reg.r;
                put(target, kind, fixName(nat, raw));
            }
        }
    }
    out[nat] = [...byR.entries()].sort((a, b) => a[0] - b[0])
        .map(([r, d]) => ({ r, first: d.first, last: d.last }))
        .filter(e => e.first.length || e.last.length);
}

let js = '// ── Raritäten-Schwänze (implizit Gewicht 1) ─────────────────────────────\n';
js += '// Aus dem BigQuery-Aggregat extrahiert (extract-tails.js) und kuratiert\n';
js += '// (curate-tails.js: weibliche Formen, Diminutive, Kulturfremdes, Akzente).\n';
js += '// r = Region-Index in NAME_POOLS_BY_NATION[nat].regions.\n';
js += '// Merge-Regel (Integration): last → an regions[r].last anhängen (Gewicht 1);\n';
js += '// first → NUR an mid+modern-Fenster anhängen (Datensatz ist gegenwartslastig,\n';
js += '// sonst hieße ein 1955er-Deutscher "Kevin"). Bei ära-flachem first-Array: direkt anhängen.\n';
js += 'const NAME_TAILS_BY_NATION = {\n';
let total = 0;
for (const [nat, regions] of Object.entries(out)) {
    js += `    ${nat}: [\n`;
    for (const e of regions) {
        total += e.first.length + e.last.length;
        js += `        { r: ${e.r}, first: ${JSON.stringify(e.first)},\n          last: ${JSON.stringify(e.last)} },\n`;
    }
    js += '    ],\n';
}
js += '};\n';
fs.writeFileSync('name-tails.final.js', js);
console.log('Kuratiert:', Object.keys(out).length, 'Nationen,', total, 'Tail-Namen → name-tails.final.js');
