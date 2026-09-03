/**
 * livery-server.js – winziger Speicher-Dienst für die Teamfarben-Werkstatt.
 *
 *   node tools/livery-server.js
 *
 * Läuft neben `npx serve` und nimmt nur eines entgegen: den Arbeitsstand der
 * Werkstatt, damit der „Speichern"-Knopf die Datei im Projekt überschreibt,
 * statt sie in den Download-Ordner zu legen.
 *
 * Bewusst eng gehalten:
 *   - hört NUR auf 127.0.0.1, nie im Netz erreichbar
 *   - schreibt NUR die unten fest eingetragenen Dateien in tools/quellen/
 *     (kein Pfad aus der Anfrage, keine Verzeichniswechsel)
 *   - nimmt nur JSON, prüft es vor dem Schreiben
 *   - legt vor jedem Überschreiben eine .bak-Kopie an
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'tools', 'quellen');
const PORT = Number(process.env.LIVERY_PORT || 3011);

// Der einzige erlaubte Satz Ziele. Ein Name aus der Anfrage wird NIE zum Pfad.
const TARGETS = {
    work: { file: 'livery-work.json', check: d => d && typeof d === 'object' && d.cells },
    todo: { file: 'liveries-todo.json', dir: ROOT, check: d => Array.isArray(d) }
};

function send(res, code, obj) {
    const body = JSON.stringify(obj);
    res.writeHead(code, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
    });
    res.end(body);
}

const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204, {});

    if (req.method === 'GET' && req.url === '/ping') {
        return send(res, 200, { ok: true, service: 'livery-save', port: PORT });
    }

    const m = /^\/save\/(\w+)$/.exec(req.url || '');
    if (req.method !== 'POST' || !m) return send(res, 404, { error: 'unbekannter Aufruf' });

    const target = TARGETS[m[1]];
    if (!target) return send(res, 400, { error: 'unbekanntes Ziel' });

    let body = '';
    let tooBig = false;
    req.on('data', chunk => {
        body += chunk;
        if (body.length > 40 * 1024 * 1024) { tooBig = true; req.destroy(); }
    });
    req.on('end', () => {
        if (tooBig) return send(res, 413, { error: 'zu groß' });
        let data;
        try { data = JSON.parse(body); }
        catch (e) { return send(res, 400, { error: 'kein gültiges JSON: ' + e.message }); }
        if (!target.check(data)) return send(res, 400, { error: 'Inhalt passt nicht zum Ziel' });

        const dir = target.dir || OUT_DIR;
        const dest = path.join(dir, target.file);
        try {
            fs.mkdirSync(dir, { recursive: true });
            // Vor dem Überschreiben eine Kopie – ein Fehlklick soll nicht
            // die Arbeit von Wochen kosten.
            if (fs.existsSync(dest)) fs.copyFileSync(dest, dest + '.bak');
            fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf8');
        } catch (err) {
            return send(res, 500, { error: err.message });
        }
        const rel = path.relative(ROOT, dest).replace(/\\/g, '/');
        console.log(new Date().toISOString().slice(11, 19) + '  gespeichert: ' + rel +
            '  (' + (fs.statSync(dest).size / 1024).toFixed(0) + ' KB)');
        send(res, 200, { ok: true, file: rel, size: fs.statSync(dest).size });
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log('Speicher-Dienst der Teamfarben-Werkstatt');
    console.log('  http://127.0.0.1:' + PORT + '  (nur lokal)');
    console.log('  schreibt: tools/quellen/livery-work.json, liveries-todo.json');
    console.log('  beenden mit Strg+C');
});
server.on('error', err => {
    console.error(err.code === 'EADDRINUSE'
        ? 'Port ' + PORT + ' ist belegt – läuft der Dienst schon?'
        : 'Fehler: ' + err.message);
    process.exit(1);
});
