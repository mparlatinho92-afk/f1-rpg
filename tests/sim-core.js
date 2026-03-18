/**
 * sim-core.js
 * Lädt den echten Spielcode aus der HTML-Datei in einen Node-VM-Kontext.
 * Browser-APIs werden als Stubs bereitgestellt.
 * Einmalig laden, dann wiederverwendbar.
 */
'use strict';
const fs   = require('fs');
const vm   = require('vm');
const path = require('path');

// ── Browser-Stubs ─────────────────────────────────────────────────────────
function makeFakeElement() {
    return new Proxy({}, {
        get(_, k) {
            if (k === 'style')     return new Proxy({}, { get:()=>'', set:()=>true });
            if (k === 'classList') return { add:()=>{}, remove:()=>{}, toggle:()=>{}, contains:()=>false };
            if (k === 'dataset')   return {};
            if (['innerHTML','textContent','value','src','href','className','id'].includes(k)) return '';
            if (k === 'querySelectorAll') return ()=>[];
            if (k === 'querySelector')   return ()=>null;
            if (k === 'children')        return [];
            if (k === 'childNodes')      return [];
            if (k === 'offsetWidth')     return 800;
            return ()=>{};
        },
        set() { return true; }
    });
}

function createBrowserStubs() {
    const storage = {};
    const localStorage = {
        getItem:    (k)    => storage[k] ?? null,
        setItem:    (k, v) => { storage[k] = String(v); },
        removeItem: (k)    => { delete storage[k]; },
    };

    const fakeEl = makeFakeElement();
    const document = {
        getElementById:      ()  => makeFakeElement(),
        querySelector:       ()  => makeFakeElement(),   // null würde .addEventListener() crashen
        querySelectorAll:    ()  => [],
        addEventListener:    ()  => {},   // verhindert DOMContentLoaded
        createElement:       ()  => makeFakeElement(),
        createElementNS:     ()  => makeFakeElement(),
        body:  fakeEl,
        head:  fakeEl,
        documentElement: fakeEl,
        URL:      '',
        location: { href: '', search: '', hash: '', pathname: '/' },
        readyState: 'complete',
    };

    const window = {
        addEventListener:    ()  => {},
        removeEventListener: ()  => {},
        localStorage,
        location: { href: '', search: '' },
        innerWidth:  1280,
        innerHeight: 800,
        history: { pushState: ()=>{} },
        matchMedia: ()=> ({ matches: false, addListener: ()=>{} }),
        requestAnimationFrame: (fn) => {},
    };

    // Spielcode-Logs unterdrücken (nur Fehler durchlassen)
    const silentConsole = {
        log:   ()=>{},
        warn:  ()=>{},
        info:  ()=>{},
        error: (...a) => console.error(...a),
        group: ()=>{}, groupEnd: ()=>{}, groupCollapsed: ()=>{},
        table: ()=>{}, time: ()=>{}, timeEnd: ()=>{},
    };

    return {
        document, window, localStorage, console: silentConsole,
        Math, JSON, Date, Array, Object, String, Number, Boolean, RegExp,
        parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent,
        setTimeout: ()=>{}, setInterval: ()=>{}, clearTimeout: ()=>{}, clearInterval: ()=>{},
        alert: ()=>{}, confirm: ()=>true, prompt: ()=>null,
        fetch: ()=> Promise.resolve({ ok: true, json: ()=>Promise.resolve({}) }),
        Promise,
        IntersectionObserver: class { observe(){} unobserve(){} disconnect(){} },
        MutationObserver:     class { observe(){} disconnect(){} },
        performance: { now: ()=> Date.now() },
        navigator: { userAgent: 'Node.js', platform: 'Win32', language: 'de', onLine: true },
        location:  { href: '', search: '', hash: '', pathname: '/', hostname: 'localhost', protocol: 'http:', assign: ()=>{}, replace: ()=>{} },
        // Wird vom Skript befüllt:
        GAME_STATE: undefined,
    };
}

// ── HTML-Skript laden ─────────────────────────────────────────────────────
function findHtmlFile() {
    const dir = path.join(__dirname, '..');
    const file = fs.readdirSync(dir).find(f => /^f1-rpg-v[\d.]+\.html$/.test(f));
    if (!file) throw new Error('Keine f1-rpg-v*.html Datei gefunden!');
    return path.join(dir, file);
}

let _cachedCtx = null;

function getContext() {
    if (_cachedCtx) return _cachedCtx;

    const htmlPath = findHtmlFile();
    console.log(`[sim-core] Lade: ${path.basename(htmlPath)} ...`);
    const html   = fs.readFileSync(htmlPath, 'utf8');
    const start  = html.indexOf('<script>') + 8;
    const end    = html.lastIndexOf('</script>');
    const script = html.slice(start, end);

    // `let GAME_STATE` → `var GAME_STATE` damit ctx.GAME_STATE von außen sichtbar ist
    const patchedScript = script.replace(/\blet\s+GAME_STATE\s*=/, 'var GAME_STATE =');

    const ctx = createBrowserStubs();
    try {
        vm.runInNewContext(patchedScript, ctx, { timeout: 30000 });
    } catch(e) {
        // Initialisierungsfehler durch fehlende DOM-Events sind ok –
        // solange simulateRace UND SEASON_DATA verfügbar sind.
        if (typeof ctx.simulateRace !== 'function') throw e;
        if (typeof ctx.SEASON_DATA === 'undefined') {
            console.error('[sim-core] VM-Abbruch vor SEASON_DATA:', e.message);
            console.error('[sim-core] Stack:', e.stack);
            throw new Error('SEASON_DATA nicht initialisiert. Browser-Stub lückenhaft – siehe Fehler oben.');
        }
        // Nicht-kritische Fehler (z.B. DOMContentLoaded-Handler) – ignorieren
    }

    console.log(`[sim-core] Geladen. simulateRace: ${typeof ctx.simulateRace}, SEASON_DATA: ${typeof ctx.SEASON_DATA}`);
    _cachedCtx = ctx;
    return ctx;
}

module.exports = { getContext };
