/**
 * namen-anzeige.js — Wächter für kaputte Vornamen (Befund 12.11.2026).
 *
 *   node tests/namen-anzeige.js
 *
 * (1) Daten: data/era-first-names.js und data/names.js enthalten keine Vornamen mit
 *     Anführungszeichen, Schluss-Apostroph oder kleinem Anfangsbuchstaben (Ursache damals:
 *     ukbabynames-CSV-Quotes → `"nathan"`, ISTAT-Apostroph → `Nicolo'`, DOM-Zusatz „de Jesus").
 * (2) Browser: Alt-Namen aus bestehenden Spielständen werden nur in der ANZEIGE korrigiert
 *     (nameAnzeigeFix + MutationObserver) — in der Hauptansicht und in einem nachträglich
 *     eingefügten Modal; der Text im Spielstand-Objekt bleibt unverändert. Kein pageerror.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const HTML = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');
const SCHLECHT = /^["'“”„]|["'“”]$|^[a-zà-ÿ]|^\s|\s$/;

let fail = 0;
const ok = (bed, txt) => { console.log((bed ? 'OK   ' : 'FEHL ') + txt); if (!bed) fail++; };

// (1) Daten
{
    const ctx = {}; vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/era-first-names.js'), 'utf8') + ';this.E=ERA_FIRST_NAMES;', ctx);
    const bad = [];
    for (const [nat, o] of Object.entries(ctx.E)) for (const k of Object.keys(o)) if (SCHLECHT.test(k)) bad.push(nat + ':' + k);
    ok(!bad.length, `Ära-Vornamen ohne Quotes/Apostroph/Kleinschreibung (${bad.length}${bad.length ? ': ' + bad.slice(0, 8).join(', ') : ''})`);
}
{
    const ctx = {}; vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/names.js'), 'utf8') + ';this.P=NAME_POOLS_BY_NATION;this.T=NAME_TAILS_BY_NATION;', ctx);
    const bad = [];
    for (const [nat, p] of Object.entries(ctx.P)) for (const r of p.regions || []) {
        const f = Array.isArray(r.first) ? r.first : Object.values(r.first).flat();
        for (const [n] of f) if (SCHLECHT.test(n)) bad.push(nat + ':' + n);
    }
    for (const [nat, ts] of Object.entries(ctx.T)) for (const t of ts) for (const n of t.first || []) if (SCHLECHT.test(n)) bad.push(nat + ':' + n);
    ok(!bad.length, `Namens-Pools: Vornamen sauber (${bad.length}${bad.length ? ': ' + bad.slice(0, 8).join(', ') : ''})`);
}

// (2) Browser
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const fehler = [];
    page.on('pageerror', e => fehler.push(e.message));
    await page.goto(HTML, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const r = await page.evaluate(async () => {
        const warte = () => new Promise(res => setTimeout(res, 50));
        const d = (GAME_STATE.drivers || [])[0];
        const altName = d ? d.name : null;
        if (d) d.name = '"nathan" George';
        const main = document.getElementById('content') || document.body;
        const a = document.createElement('div');
        a.innerHTML = '<span class="driver-link">' + (d ? d.name : '"nathan" George') + '</span> · <b>Nicolo\' Rossi</b>';
        main.appendChild(a);
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
        modal.innerHTML = '<div>"nathaniel" Smith, "nate" Fox, Giosue\' Verdi, Niccolo\' Bianchi, Gabriel de Jesus</div>';
        await warte();
        const out = { haupt: a.textContent, modal: modal.textContent, gespeichert: d ? d.name : null,
                      version: document.getElementById('versionDisplay')?.textContent || '' };
        a.remove(); modal.remove(); if (d) d.name = altName;
        return out;
    });
    ok(r.haupt === 'Nathan George · Nicolò Rossi', `Hauptansicht: ${JSON.stringify(r.haupt)}`);
    ok(r.modal === 'Nathaniel Smith, Nate Fox, Giosuè Verdi, Niccolò Bianchi, Gabriel de Jesus', `Modal: ${JSON.stringify(r.modal)}`);
    ok(r.gespeichert === null || r.gespeichert === '"nathan" George', `Spielstand unverändert: ${JSON.stringify(r.gespeichert)}`);
    ok(!/v0\.6\.8/.test(r.version), `Haupt-Skript gestartet (Version ${r.version.trim()})`);
    ok(!fehler.length, `pageerror: ${fehler.length ? fehler.join(' | ') : 'keine'}`);
    await browser.close();
    console.log(fail ? `\n${fail} Prüfung(en) fehlgeschlagen` : '\nalle Prüfungen bestanden');
    process.exit(fail ? 1 : 0);
})();
