// export-cockpits-excel.js
// Exportiert cockpit-summary.csv, cockpit-analysis.csv und die
// "Fahrer mit eigenem Chassis"-Liste als Excel-Datei (3 Tabellenblätter).
'use strict';
const fs   = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// ── Hilfsfunktionen ──────────────────────────────────────────────────────────
function readCsv(file) {
    const lines = fs.readFileSync(path.join(__dirname, file), 'utf8').split('\n');
    const header = parseCsvLine(lines[0]);
    const rows = lines.slice(1).filter(l => l.trim()).map(parseCsvLine);
    return { header, rows };
}

function parseCsvLine(line) {
    // Einfacher CSV-Parser: erkennt "..." Felder mit Kommas
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"' && !inQ) { inQ = true; }
        else if (c === '"' && inQ) { inQ = false; }
        else if (c === ',' && !inQ) { result.push(cur); cur = ''; }
        else cur += c;
    }
    result.push(cur);
    return result;
}

function sheetFromHeaderRows(header, rows) {
    return XLSX.utils.aoa_to_sheet([header, ...rows]);
}

// ── 1. Summary-Sheet ─────────────────────────────────────────────────────────
const summary = readCsv('cockpit-summary.csv');

// ── 2. Detail-Sheet ──────────────────────────────────────────────────────────
const detail = readCsv('cockpit-analysis.csv');

// ── 3. Fahrer-mit-eigenem-Chassis-Sheet ─────────────────────────────────────
// Quellen: Spreadsheet-Tabelle "Fahrer mit eigenem Chassis mit endlosem Vertrag"
// Spalte C = Situation (bestimmt ob der Vertrag "endlos" ist und wer fährt)
// Typen:
//   IDENTITY  = Fahrer IST der Konstrukteur – Konstrukteur endet mit Fahrer
//   FOUNDER   = Fahrer gründete das Team, Team überlebt Karriereende/Tod
//   HEIR      = Sohn/Nachfolger des Gründers – kein eigenes Chassis, aber fester Platz
//   UNCERTAIN = historisch unklar (Sheet-Notiz: "nicht sicher")

const identityHeader = [
    'Konstrukteur',
    'Fahrer (Gründer)',
    'Typ',
    'Vertrag',
    'Notiz',
    'Im Code? (CONSTRUCTOR_IDENTITY_DRIVERS / DIES_WITH_FOUNDER)',
];

const identityRows = [
    // ── IDENTITY: Fahrer = Konstrukteur, verschwindet mit ihm ─────────────
    ['Bellasi',          'Silvio Moser',       'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', 'eigener Wagen für sich alleine',                          '✓ CONSTRUCTOR_IDENTITY_DRIVERS'],
    ['LEC',              'David Purley',        'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', 'eigener Wagen für sich alleine',                          '✓ CONSTRUCTOR_IDENTITY_DRIVERS'],
    ['Apollon',          'Loris Kessel',        'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', 'eigener Wagen für sich alleine',                          '✓ CONSTRUCTOR_IDENTITY_DRIVERS'],
    ['Alfa Special',     'Peter de Klerk',      'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', 'eigener Wagen für sich alleine',                          '✓ CONSTRUCTOR_IDENTITY_DRIVERS'],
    ['Merzario',         'Arturo Merzario',     'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', 'eigener Wagen; in F2 gilt Regel nicht mehr',              '✓ CONSTRUCTOR_IDENTITY_DRIVERS'],
    ['JBW',              'Brian Naylor',        'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', 'eigener Wagen für sich alleine',                          '✗ FEHLT in CONSTRUCTOR_IDENTITY_DRIVERS'],
    ['Greifzu',          'Dora Greifzu',        'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', 'eigener Wagen für sich alleine (einzige Frau)',            '✗ FEHLT in CONSTRUCTOR_IDENTITY_DRIVERS'],
    ['McGuire',          'Brian McGuire',       'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', 'eigener Wagen für sich alleine',                          '✗ FEHLT in CONSTRUCTOR_IDENTITY_DRIVERS'],
    ['Stebro',           'Peter Broeker',       'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', 'eigener Wagen für sich alleine',                          '✗ FEHLT in CONSTRUCTOR_IDENTITY_DRIVERS'],
    ['Behra-Porsche',    'Jean Behra',          'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', 'nicht sicher – fuhr selbst auch für Ferrari',             '✗ nicht im Code'],
    ['Amon',             'Chris Amon',          'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', '',                                                         '✗ nicht im Code (NAT: NZL)'],
    ['Scirocco',         'Tony Settember',      'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', 'nicht sicher',                                             '✗ nicht im Code'],
    ['Emeryson',         'Paul Emery',          'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', '',                                                         '✗ nicht im Code'],
    ['Aston Butterworth','Bill Aston',          'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', '',                                                         '✗ nicht im Code'],
    ['Klodwig',          'Ernst Klodwig',       'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', '',                                                         '✗ nicht im Code'],
    ['Veritas',          'Ernst Loof',          'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', 'Loof selbst nur 1× dabei; Team nie fremde Fahrer',        '✗ nicht im Code'],
    ['Scarab',           'Lance Reventlow',     'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', '',                                                         '✗ nicht im Code (NAT: USA)'],
    ['LDS',              'Doug Serrurier',      'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', '1 Rennen fuhr er mit Token statt LDS',                     '✗ nicht im Code (LDS hat NAT: RSA)'],
    ['Gilby',            'Keith Greene',        'IDENTITY', 'endlos – Cockpit stirbt mit Fahrer', 'Sohn des Besitzers; fuhr nur für Gilby',                   '✗ nicht im Code'],

    // ── FOUNDER: Team überlebt Karriereende/Tod des Gründers ─────────────
    ['Brabham',          'Jack Brabham',        'FOUNDER',  'endlos – Team bleibt nach Karriereende/Tod', 'Konstrukteur bleibt bestehen',                     '– (kein Eintrag nötig)'],
    ['Surtees',          'John Surtees',        'FOUNDER',  'endlos – Team bleibt nach Karriereende/Tod', 'Konstrukteur bleibt bestehen',                     '– (kein Eintrag nötig)'],
    ['McLaren',          'Bruce McLaren',       'FOUNDER',  'endlos – Team bleibt nach Karriereende/Tod', 'Konstrukteur bleibt bestehen',                     '– (kein Eintrag nötig)'],
    ['Eagle',            'Dan Gurney',          'FOUNDER',  'endlos – Team bleibt nach Karriereende/Tod', 'All American Racers',                               '– (kein Eintrag nötig)'],
    ['Embassy Hill',     'Graham Hill',         'FOUNDER',  'endlos – Team bleibt nach Karriereende/Tod', '',                                                  '– (kein Eintrag nötig)'],
    ['Fittipaldi',       'Emerson + Wilson Fittipaldi', 'FOUNDER', 'endlos – Team bleibt', 'beide Brüder involviert; schwierig', '– (kein Eintrag nötig)'],
    ['Rebaque',          'Hector Rebaque',      'FOUNDER',  'endlos – Konstrukteur endet mit Fahrer',     'hatte Karriere außerhalb des eigenen Teams',        '✓ CONSTRUCTOR_DIES_WITH_FOUNDER'],

    // ── HEIR: Sohn/Nachfolger ─────────────────────────────────────────────
    ['Aston Martin',     'Lance Stroll',        'HEIR',     'endlos – Sohn des Besitzers',                'Lawrence Stroll = Eigentümer; Lance = Pflichtfahrer','– (moderner Fall, kein hist. Code)'],
];

const identitySheet = sheetFromHeaderRows(identityHeader, identityRows);

// Spaltenbreiten setzen
identitySheet['!cols'] = [
    { wch: 18 }, // Konstrukteur
    { wch: 26 }, // Fahrer
    { wch: 12 }, // Typ
    { wch: 38 }, // Vertrag
    { wch: 45 }, // Notiz
    { wch: 45 }, // Im Code
];

// Spaltenbreiten für Summary und Detail
summary.rows = summary.rows.map(r => {
    // Numerische Felder konvertieren
    return r.map((v, i) => {
        if (i >= 1 && i <= 7) return isNaN(+v) ? v : +v;
        return v;
    });
});
detail.rows = detail.rows.map(r => {
    return r.map((v, i) => {
        if (i >= 1 && i <= 7) return isNaN(+v) ? v : +v;
        return v;
    });
});

const summarySheet = sheetFromHeaderRows(summary.header, summary.rows);
summarySheet['!cols'] = [
    { wch: 25 }, // constructor
    { wch: 6  }, // year
    { wch: 8  }, // n_races
    { wch: 13 }, // min_cockpits
    { wch: 13 }, // max_cockpits
    { wch: 12 }, // avg_cockpits
    { wch: 12 }, // seat_changes
    { wch: 12 }, // driver_fluct
    { wch: 80 }, // detail
];

const detailSheet = sheetFromHeaderRows(detail.header, detail.rows);
detailSheet['!cols'] = [
    { wch: 25 }, // constructor
    { wch: 6  }, // year
    { wch: 7  }, // round
    { wch: 8  }, // race_id
    { wch: 50 }, // race_name
    { wch: 8  }, // is_indy
    { wch: 10 }, // cockpits
    { wch: 10 }, // n_drivers
    { wch: 60 }, // drivers
    { wch: 30 }, // grid_positions
];

// ── 4. Einsatz-Summary-Sheet (aus entrant-summary.csv) ───────────────────────
const entrantSummary = readCsv('entrant-summary.csv');
entrantSummary.rows = entrantSummary.rows.map(r =>
    r.map((v, i) => (i >= 2 && i <= 6) ? (isNaN(+v) ? v : +v) : v)
);
const entrantSummarySheet = sheetFromHeaderRows(entrantSummary.header, entrantSummary.rows);
entrantSummarySheet['!cols'] = [
    { wch: 25 }, // constructor
    { wch: 6  }, // year
    { wch: 8  }, // n_races
    { wch: 13 }, // min_entries
    { wch: 13 }, // max_entries
    { wch: 12 }, // avg_entries
    { wch: 14 }, // entry_changes
    { wch: 80 }, // detail
];

// ── 5. Einsatz-Detail-Sheet (aus entrant-analysis.csv) ───────────────────────
const entrantDetail = readCsv('entrant-analysis.csv');
entrantDetail.rows = entrantDetail.rows.map(r =>
    r.map((v, i) => (i >= 2 && i <= 5) ? (isNaN(+v) ? v : +v) : v)
);
const entrantDetailSheet = sheetFromHeaderRows(entrantDetail.header, entrantDetail.rows);
entrantDetailSheet['!cols'] = [
    { wch: 25 }, // constructor
    { wch: 6  }, // year
    { wch: 7  }, // round
    { wch: 8  }, // race_id
    { wch: 55 }, // race_name
    { wch: 10 }, // n_entries
    { wch: 80 }, // drivers
];

// ── Workbook zusammenbauen ───────────────────────────────────────────────────
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, identitySheet,       'Fahrer-Chassis-Liste');
XLSX.utils.book_append_sheet(wb, summarySheet,        'Cockpit-Summary');
XLSX.utils.book_append_sheet(wb, detailSheet,         'Cockpit-Detail');
XLSX.utils.book_append_sheet(wb, entrantSummarySheet, 'Einsatz-Summary');
XLSX.utils.book_append_sheet(wb, entrantDetailSheet,  'Einsatz-Detail');

const outPath = path.join(__dirname, 'cockpit-analyse.xlsx');
XLSX.writeFile(wb, outPath);
console.log('Gespeichert: ' + outPath);
console.log('Sheets: Fahrer-Chassis-Liste | Cockpit-Summary | Cockpit-Detail | Einsatz-Summary | Einsatz-Detail');
