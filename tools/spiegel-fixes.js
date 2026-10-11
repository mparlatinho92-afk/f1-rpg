#!/usr/bin/env node
/**
 * spiegel-fixes.js — FIXES_OFFEN.md als Google Sheet nach Drive spiegeln.
 *
 * Die Markdown-Datei im Projekt ist die Quelle. Drive haelt EIN festes Sheet
 * („F1 RPG Fixes – Ist-Stand", Ordner „F1 RPG HTML"), das bei jeder Aenderung
 * in place ueberschrieben wird — der Link bleibt gleich (Nutzer-Entscheid
 * 11.10.2026, vorher: jedes Mal ein neues Google-Doc).
 *
 *   Blatt „Fixes"    (sheetId 0): Status · Bereich · Punkt · Beleg — eine Zeile je Punkt
 *   Blatt „Konzepte" (sheetId 1): Thema · Text — Unterpunkte und Absaetze (lange Konzepttexte)
 *
 * Schreiben kann nur Claude ueber den Sheets-Connector; dieses Skript erzeugt
 * die Zellwerte und merkt sich den gespiegelten Stand. Formatierung (Statusfarben,
 * Filter, Spaltenbreiten) liegt fest im Sheet und wird nicht neu geschrieben.
 *
 *   node tools/spiegel-fixes.js            Status: ist das Sheet aktuell? Link
 *   node tools/spiegel-fixes.js --zeilen   Werte fuer batch_clear_values + update_values erzeugen, Pfad ausgeben
 *   node tools/spiegel-fixes.js --fertig [sheetId]   gespiegelten Stand eintragen
 *   node tools/spiegel-fixes.js --hook     Stop-Hook (.claude/settings.json)
 *
 * ⚠ Der Connector kennt kein valueInputOption=RAW: update_values parst wie die
 *   Oberflaeche („0.9.21.3" → Datum). Deshalb jede Zelle mit fuehrendem Apostroph.
 *   (updateCells mit stringValue ginge auch, ist aber doppelt so gross: 30 statt 15 KB.)
 * ⚠ 4-Byte-Emoji (🟡) wurden schon beim Doc-Import zerlegt; 🟡 wird zu ◐.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const QUELLE = path.join(ROOT, 'FIXES_OFFEN.md');
const STAND = path.join(__dirname, 'fixes-spiegel.json');
const ZIEL = path.join(os.tmpdir(), 'fixes-offen-werte.json');
const BLATT = { fixes: 0, konzepte: 1 };
const LEER_BIS = 1000;                       // so weit wird vor dem Schreiben geleert

const hashVon = text => crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
const leseStand = () => { try { return JSON.parse(fs.readFileSync(STAND, 'utf8')); } catch (e) { return {}; } };
const sheetLink = id => `https://docs.google.com/spreadsheets/d/${id}/edit`;

// ---------------------------------------------------------------- Markdown → Zeilen
const STATUS = /^([✅◐❌❔❓])\s*/;
const STATUS_FOLGE = ['❌', '◐', '❔', '–', '✅'];
const VERSION = /v\d+\.\d+\.\d+(?:\.\d+)?/g;
// Kurzname eines Punkts fuer die Thema-Spalte: bis zum ersten Doppelpunkt/Klammer, an Wortgrenze gekuerzt
const kurzVon = punkt => {
    const k = punkt.replace(/[:(—].*$/, '').trim();
    return k.length <= 50 ? k : k.slice(0, 50).replace(/\s+\S*$/, '') + ' …';
};

function klartext(s) {
    return s.replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1$2')
        .replace(/<(https?:\/\/[^>\s]+)>/g, '$1')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1 ($2)')
        .replace(/\s+/g, ' ').trim();
}

function zuZeilen(md) {
    const fixes = [];        // [status, bereich, punkt, beleg]
    const konzepte = [];     // [thema, text]
    let gruppe = '';         // Status der ##-Gruppe
    let bereich = 'Allgemein';
    let eltern = null;       // letzte Fixes-Zeile (fuer Unterpunkte)
    let block = null;        // offener Eintrag {art, tiefe, text}
    let erledigtTabelle = false;

    const thema = () => bereich + (eltern ? ' – ' + eltern.kurz : '');
    const zu = () => {
        if (!block) return;
        const text = klartext(block.text);
        if (block.art === 'absatz') {
            konzepte.push([bereich, text]);
            // offener Bereich, der nur als Absatz beschrieben ist (Fahrer-Stats): eigene Fixes-Zeile
            if (gruppe === '❌' && !fixes.some(f => f[1] === bereich))
                fixes.push(['❌', bereich, kurzVon(text) + '  → Details: Blatt Konzepte', '']);
        }
        else if (block.tiefe > 0 || !gruppe) konzepte.push([block.tiefe > 0 ? thema() : bereich, text]);
        else {
            const m = text.match(STATUS);
            const status = m ? m[1].replace('❓', '❔') : (gruppe === '◐' ? '–' : gruppe || '–');
            const punkt = m ? text.slice(m[0].length) : text;
            const beleg = [...new Set(punkt.match(VERSION) || [])].join(', ');
            const zeile = [status, bereich, punkt, beleg];
            fixes.push(zeile);
            eltern = { zeile, kurz: kurzVon(punkt) };
        }
        block = null;
    };

    for (const roh of md.replace(/\r/g, '').replace(/🟡/g, '◐').split('\n')) {
        const z = roh.trimEnd();
        const h = z.match(/^(#{2,3})\s+(.*)$/);
        if (h) {
            zu(); eltern = null; erledigtTabelle = false;
            const titel = klartext(h[2]);
            if (h[1] === '##') {
                const m = titel.match(STATUS);
                gruppe = m ? m[1] : '';
                bereich = m ? titel.slice(m[0].length) : titel;
                erledigtTabelle = gruppe === '✅';
            } else bereich = titel;
            continue;
        }
        if (/^\|/.test(z.trim())) {
            zu();
            if (/^\|[\s|:-]+\|$/.test(z.trim())) continue;
            const zellen = z.trim().replace(/^\||\|$/g, '').split('|').map(t => klartext(t));
            if (zellen[0] === 'Doc-Punkt') continue;            // Kopfzeile
            if (erledigtTabelle) fixes.push(['✅', 'Erledigt', zellen[0], zellen[1] || '']);
            continue;
        }
        if (!z.trim() || /^---+$/.test(z.trim()) || /^#\s/.test(z)) { zu(); continue; }
        const li = z.match(/^(\s*)[-*]\s+(.*)$/);
        if (li) { zu(); block = { art: 'punkt', tiefe: li[1].length, text: li[2] }; continue; }
        if (block && (block.art === 'absatz' || /^\s+/.test(roh))) { block.text += ' ' + z.trim(); continue; }
        zu(); block = { art: 'absatz', text: z.trim() };
    }
    zu();
    // Unterpunkte zeigen auf das Konzepte-Blatt
    const mitKonzept = new Set(konzepte.map(k => k[0]));
    for (const f of fixes) {
        if (mitKonzept.has(f[1] + ' – ' + kurzVon(f[2]))) f[2] += '  → Details: Blatt Konzepte';
    }
    // Default-Sortierung nach Status (Nutzer-Wunsch 11.10.2026): Sortieren im Sheet ist einmalig und
    // geht bei jeder Spiegelung verloren, deshalb hier. Stabil: innerhalb eines Status bleibt die Listenfolge.
    const rang = s => { const i = STATUS_FOLGE.indexOf(s); return i < 0 ? STATUS_FOLGE.length : i; };
    fixes.sort((a, b) => rang(a[0]) - rang(b[0]));
    return { fixes, konzepte };
}

// ---------------------------------------------------------------- Werte
// Fuehrender Apostroph: Sheets speichert den Rest als Text, ohne ihn als Zahl/Datum/Formel zu lesen.
const alsText = rows => rows.map(r => r.map(t => t === '' ? '' : "'" + t));

function werte({ fixes, konzepte }) {
    return {
        leeren: ['Fixes!A2:D' + LEER_BIS, 'Konzepte!A2:B' + LEER_BIS],
        fixes: { range: 'Fixes!A1', values: alsText([['Status', 'Bereich', 'Punkt', 'Beleg / Version'], ...fixes]) },
        konzepte: { range: 'Konzepte!A1', values: alsText([['Thema', 'Text'], ...konzepte]) }
    };
}

// ---------------------------------------------------------------- Modi
const arg = process.argv[2] || '';

if (arg === '--hook') {
    // Stop-Hook: scheitert immer still — ein Hook, der einen Task abbricht,
    // ist schlimmer als eine verspaetete Spiegelung.
    let ein = '';
    process.stdin.on('data', c => ein += c);
    process.stdin.on('end', () => {
        try {
            const daten = ein ? JSON.parse(ein) : {};
            if (daten.stop_hook_active) return;               // keine Schleife
            const stand = leseStand();
            if (hashVon(fs.readFileSync(QUELLE, 'utf8')) === stand.hash) return;
            console.log(JSON.stringify({
                decision: 'block',
                reason: 'FIXES_OFFEN.md wurde geaendert und ist noch nicht ins Google Sheet gespiegelt. '
                    + 'Ablauf: (1) `node tools/spiegel-fixes.js --zeilen` ausfuehren, (2) im Sheet '
                    + `${stand.sheetId || '<sheetId>'} mit Google Sheets batch_clear_values die Bereiche "leeren" leeren, `
                    + 'dann update_values mit "fixes" und "konzepte" aus der erzeugten Datei, '
                    + '(3) mit get_values Fixes!A1:D5 und Konzepte!A1:B3 kurz pruefen, '
                    + '(4) `node tools/spiegel-fixes.js --fertig`, (5) dem Nutzer sagen, dass der Link gleich bleibt.'
            }));
        } catch (e) { /* still */ }
    });
} else if (arg === '--zeilen') {
    const daten = zuZeilen(fs.readFileSync(QUELLE, 'utf8'));
    const req = werte(daten);
    fs.writeFileSync(ZIEL, JSON.stringify(req), 'utf8');
    const rest = JSON.stringify(req).match(/[\u{10000}-\u{10FFFF}]/gu);
    console.log('Werte:     ' + ZIEL + '  (' + daten.fixes.length + ' Fixes, ' + daten.konzepte.length + ' Konzept-Zeilen)');
    console.log('Sheet:     ' + (leseStand().sheetId || '(noch keins)'));
    if (process.argv.includes('--zeigen')) {
        for (const f of daten.fixes) console.log(f.join(' | '));
        console.log('---');
        for (const k of daten.konzepte) console.log(k.join(' | '));
    }
    if (rest) console.log('⚠ 4-Byte-Zeichen: ' + [...new Set(rest)].join(' '));
} else if (arg === '--fertig') {
    const alt = leseStand();
    const id = process.argv[3] || alt.sheetId;
    if (!id) { console.error('Aufruf: --fertig <sheetId>'); process.exit(1); }
    const stand = {
        sheetId: id,
        link: sheetLink(id),
        hash: hashVon(fs.readFileSync(QUELLE, 'utf8')),
        gespiegelt: new Date().toISOString()
    };
    fs.writeFileSync(STAND, JSON.stringify(stand, null, 2) + '\n', 'utf8');
    console.log('Eingetragen: ' + stand.link);
} else {
    const stand = leseStand();
    const aktuell = hashVon(fs.readFileSync(QUELLE, 'utf8')) === stand.hash;
    console.log(aktuell ? '✅ Sheet ist aktuell.' : '❌ FIXES_OFFEN.md wurde seit der letzten Spiegelung geändert.');
    if (stand.link) console.log('Sheet: ' + stand.link + '  (gespiegelt ' + stand.gespiegelt + ')');
    if (!aktuell) console.log('Spiegeln kann nur Claude (Sheets-Connector) — der Stop-Hook stößt das am Ende der nächsten Antwort an,'
        + '\noder sag einfach „spiegeln".');
}
