#!/usr/bin/env node
/**
 * spiegel-fixes.js — FIXES_OFFEN.md als Google-Doc nach Drive spiegeln.
 *
 * Die Markdown-Datei im Projekt ist die Quelle. Drive bekommt bei jeder
 * Aenderung ein NEUES Google-Doc (Ordner „F1 RPG HTML"), das alte wandert in
 * den Papierkorb. Nutzer-Entscheid 11.10.2026: Doc mit Farben statt .md-Datei
 * mit festem Link — der Link aendert sich also bei jeder Spiegelung.
 *
 * Warum ein neues Doc statt Update: der Drive-Connector kann Inhalte nicht
 * ersetzen (nur Titel/Ordner), und ein Skript hat keinen Zugang zur Google-API.
 * Hochladen kann deshalb nur Claude ueber den Connector; dieses Skript bereitet
 * das HTML vor und merkt sich, welcher Stand zuletzt gespiegelt wurde.
 *
 *   node tools/spiegel-fixes.js            Status: ist Drive aktuell? Link des aktuellen Docs
 *   node tools/spiegel-fixes.js --html     HTML fuer den Upload erzeugen, Pfad ausgeben
 *   node tools/spiegel-fixes.js --fertig <docId>   neuen Stand nach dem Upload eintragen
 *   node tools/spiegel-fixes.js --hook     Stop-Hook (.claude/settings.json)
 *
 * ⚠ 4-Byte-Emoji (🟡 usw.) zerfallen beim Drive-Import zu „ð¡" — gemessen
 *   11.10.2026. Zeichen aus der Basisebene (✅ ❌ ❔ ◐) kommen heil an. Die
 *   Umwandlung ersetzt 🟡 deshalb durch ◐ und warnt bei weiteren.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const QUELLE = path.join(ROOT, 'FIXES_OFFEN.md');
const STAND = path.join(__dirname, 'fixes-spiegel.json');
const HTML_ZIEL = path.join(os.tmpdir(), 'fixes-offen-spiegel.html');
const DRIVE_ORDNER = '1umDNWql2RPEHJ5HbXp1H1Hzl815UTt8b';   // „F1 RPG HTML"
const TITEL = 'F1 RPG Fixes – Ist-Stand';

const hashVon = text => crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
const leseStand = () => { try { return JSON.parse(fs.readFileSync(STAND, 'utf8')); } catch (e) { return {}; } };
const docLink = id => `https://docs.google.com/document/d/${id}/edit`;

// ---------------------------------------------------------------- Markdown → HTML
const FARBE = { '✅': '#137333', '◐': '#b06000', '❌': '#c5221f', '❔': '#5f6368', '❓': '#5f6368' };

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function inline(text) {
    const codes = [];
    let s = text.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
    s = esc(s);
    s = s.replace(/&lt;(https?:\/\/[^&\s]+)&gt;/g, '<a href="$1">$1</a>');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');
    s = s.replace(/[✅◐❌❔❓]/g, z => `<span style="color:${FARBE[z]};font-weight:bold">${z}</span>`);
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<span style="font-family:Consolas,monospace;color:#555">${esc(codes[i])}</span>`);
}

function zuHtml(md) {
    const zeilen = md.replace(/\r/g, '').replace(/🟡/g, '◐').split('\n');
    const out = [];
    const listen = [];          // Einrueckungs-Stapel offener <ul>
    let absatz = [];
    let tabelle = null;

    const absatzZu = () => { if (absatz.length) { out.push('<p>' + inline(absatz.join(' ')) + '</p>'); absatz = []; } };
    const listenZu = (bis = -1) => { while (listen.length && listen[listen.length - 1] > bis) { out.push('</li></ul>'); listen.pop(); } };
    const tabelleZu = () => {
        if (!tabelle) return;
        const zelle = (t, kopf) => `<td style="border:1px solid #ccc;padding:4px;vertical-align:top">${kopf ? '<b>' + inline(t) + '</b>' : inline(t)}</td>`;
        out.push('<table style="border-collapse:collapse">'
            + tabelle.map((r, i) => '<tr>' + r.map(t => zelle(t, i === 0)).join('') + '</tr>').join('')
            + '</table>');
        tabelle = null;
    };

    for (const roh of zeilen) {
        const z = roh.trimEnd();
        if (/^\|/.test(z.trim())) {
            absatzZu(); listenZu();
            if (/^\|[\s|:-]+\|$/.test(z.trim())) continue;     // Trennzeile
            (tabelle = tabelle || []).push(z.trim().replace(/^\||\|$/g, '').split('|').map(t => t.trim()));
            continue;
        }
        tabelleZu();
        const h = z.match(/^(#{1,4})\s+(.*)$/);
        const li = z.match(/^(\s*)[-*]\s+(.*)$/);
        if (!z.trim()) { absatzZu(); if (!listen.length) continue; continue; }
        if (h) { absatzZu(); listenZu(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
        if (/^---+$/.test(z.trim())) { absatzZu(); listenZu(); out.push('<hr>'); continue; }
        if (li) {
            absatzZu();
            const tiefe = li[1].length;
            if (!listen.length || tiefe > listen[listen.length - 1]) { out.push('<ul><li>'); listen.push(tiefe); }
            else { listenZu(tiefe); out.push('</li><li>'); }
            out.push(inline(li[2]));
            continue;
        }
        if (listen.length && /^\s+/.test(roh)) { out.push(' ' + inline(z.trim())); continue; }   // Fortsetzungszeile
        listenZu();
        absatz.push(z.trim());
    }
    absatzZu(); listenZu(); tabelleZu();
    return '<html><head><meta charset="utf-8"></head><body>\n' + out.join('\n') + '\n</body></html>\n';
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
                reason: 'FIXES_OFFEN.md wurde geaendert und ist noch nicht nach Drive gespiegelt. '
                    + 'Ablauf: (1) `node tools/spiegel-fixes.js --html` ausfuehren, (2) die erzeugte HTML-Datei '
                    + 'mit Google Drive create_file hochladen (contentMimeType text/html, '
                    + `parentId ${DRIVE_ORDNER}, Titel „${TITEL} <Datum>"), `
                    + '(3) den Inhalt des neuen Docs kurz pruefen, '
                    + (stand.docId ? `(4) altes Doc ${stand.docId} mit trash_file in den Papierkorb, ` : '')
                    + '(5) `node tools/spiegel-fixes.js --fertig <neue docId>`, (6) dem Nutzer den neuen Link nennen.'
            }));
        } catch (e) { /* still */ }
    });
} else if (arg === '--html') {
    const md = fs.readFileSync(QUELLE, 'utf8');
    const html = zuHtml(md);
    const rest = html.match(/[\u{10000}-\u{10FFFF}]/gu);
    fs.writeFileSync(HTML_ZIEL, html, 'utf8');
    const stand = leseStand();
    console.log('HTML:      ' + HTML_ZIEL + '  (' + html.length + ' Zeichen)');
    console.log('Titel:     ' + TITEL + ' ' + new Date().toLocaleDateString('de-DE'));
    console.log('Ordner:    ' + DRIVE_ORDNER);
    console.log('Altes Doc: ' + (stand.docId || '(keins)'));
    if (rest) console.log('⚠ 4-Byte-Zeichen zerfallen beim Import: ' + [...new Set(rest)].join(' '));
} else if (arg === '--fertig') {
    const id = process.argv[3];
    if (!id) { console.error('Aufruf: --fertig <docId>'); process.exit(1); }
    const stand = {
        docId: id,
        link: docLink(id),
        hash: hashVon(fs.readFileSync(QUELLE, 'utf8')),
        gespiegelt: new Date().toISOString()
    };
    fs.writeFileSync(STAND, JSON.stringify(stand, null, 2) + '\n', 'utf8');
    console.log('Eingetragen: ' + stand.link);
} else {
    const stand = leseStand();
    const aktuell = hashVon(fs.readFileSync(QUELLE, 'utf8')) === stand.hash;
    console.log(aktuell ? '✅ Drive ist aktuell.' : '❌ FIXES_OFFEN.md wurde seit der letzten Spiegelung geändert.');
    if (stand.link) console.log('Aktuelles Doc: ' + stand.link + '  (gespiegelt ' + stand.gespiegelt + ')');
    if (!aktuell) console.log('Spiegeln kann nur Claude (Drive-Connector) — der Stop-Hook stößt das am Ende der nächsten Antwort an,'
        + '\noder sag einfach „spiegeln".');
}
