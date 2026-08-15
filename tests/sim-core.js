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
            if (k === 'style')     return new Proxy({}, { get:(_, sk) => typeof sk === 'symbol' ? undefined : () => {}, set:()=>true });
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
    // Monolith bevorzugen (hat data/*.js inline) – index.html nutzt externe <script src>
    const files = fs.readdirSync(dir).filter(f => /^f1-rpg-v[\d.]+\.html$/.test(f)).sort();
    if (files.length) return path.join(dir, files[files.length - 1]);
    // Fallback: index.html (nur wenn kein Monolith vorhanden)
    const idx = path.join(dir, 'index.html');
    if (fs.existsSync(idx)) return idx;
    throw new Error('Keine f1-rpg-v*.html Datei gefunden!');
}

// Baut den Monolith-Quelltext in-memory aus index.html + data/*.js (wie manage-v),
// ohne eine Datei zu schreiben. Für MC-Tests gegen UNCOMMITTETE index.html-Änderungen.
// Aktivierung via Env SIMCORE_FROM_INDEX=1.
function buildSourceFromIndex() {
    const dir = path.join(__dirname, '..');
    let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    // Muss mit $DataFiles in manage-v.ps1 übereinstimmen. Fehlt hier eine Datei, ist ihre
    // Konstante in ALLEN sim-core-Tests undefiniert — inklusive der Messskripte, mit denen
    // die Abnahme läuft. (data/presence.js ab v0.9.15.81: TEAM_PRESENCE für den L1-Hebel.)
    for (const jsFile of ['data/f1db.js', 'data/hist.js', 'data/seasons.js', 'data/names.js',
                          'data/era-first-names.js', 'data/circuit-layouts.js', 'data/presence.js',
                          'data/guest-entries.js', 'data/driver-starts.js',
                          'data/venue-pull.js']) {
        const placeholder = `    <script src="${jsFile}"></script>`;
        const js = fs.readFileSync(path.join(dir, jsFile), 'utf8');
        html = html.replace(placeholder, `    <script>\n${js}\n    </script>`);
    }
    return html;
}

let _cachedCtx = null;

function getContext() {
    if (_cachedCtx) return _cachedCtx;

    let html;
    if (process.env.SIMCORE_FROM_INDEX === '1') {
        console.log('[sim-core] Lade: index.html + data/*.js (in-memory inlined, uncommittet) ...');
        html = buildSourceFromIndex();
    } else {
        const htmlPath = findHtmlFile();
        console.log(`[sim-core] Lade: ${path.basename(htmlPath)} ...`);
        html = fs.readFileSync(htmlPath, 'utf8');
    }
    // Alle inline <script>...</script>-Blöcke extrahieren und zusammenführen
    // (Monolith hat mehrere Blöcke: f1db, hist, seasons, main)
    const scriptBlocks = [];
    const re = /<script>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = re.exec(html)) !== null) scriptBlocks.push(m[1]);
    const script = scriptBlocks.join('\n');

    // `let` → `var` für extern sichtbare Globals
    // Außerdem: Balancing-Parameter durch SIM_CONFIG ersetzen (index.html bleibt unverändert)
    const patchedScript = script
        .replace(/\blet\s+GAME_STATE\s*=/, 'var GAME_STATE =')
        // SIM_CONFIG-Block am Anfang injizieren (wird durch Replace-Kette danach genutzt)
        .replace(
            /\bconst\s+VERSION\s*=\s*'[^']*';/,
            m => m + '\nvar SIM_CONFIG = {' +
                'qualiPaceWeight:0.45,qualiCarWeight:0.30,qualiVarianceBase:3,' +
                'trainVarianceBase:5,raceBadDayMin:15,raceBadDayRange:20,' +
                'privateerActivityMult:1.0,rainProbability:0.15,' +
                'paceRaceWeight:0.35,carSpeedRaceWeight:0.25,' +
                'experienceWeight:0.15,strategyWeight:0.10,rainWeight:0.20,dnfMultiplier:1.0};'
        )
        // Qualifying-Varianz
        .replace(
            /const _qHalfVar = 3 \+ \(100 - _qConsVal\) \* 0\.07;/,
            'const _qHalfVar = SIM_CONFIG.qualiVarianceBase + (100 - _qConsVal) * 0.07;'
        )
        // Training-Varianz
        .replace(
            /const _halfVar = 5 \+ \(100 - _consVal\) \* 0\.09;[^\n]*/,
            'const _halfVar = SIM_CONFIG.trainVarianceBase + (100 - _consVal) * 0.09;'
        )
        // Race bad-day Strafe
        .replace(
            /performance -= 15 \+ Math\.random\(\) \* 20;/,
            'performance -= SIM_CONFIG.raceBadDayMin + Math.random() * SIM_CONFIG.raceBadDayRange;'
        )
        // Privateer activityRate
        .replace(
            /eraBase \+ \(Math\.random\(\) \* 0\.20 - 0\.10\)/,
            'eraBase * SIM_CONFIG.privateerActivityMult + (Math.random() * 0.20 - 0.10)'
        )
        // Pace-Gewicht Rennen
        .replace(/_effPace \* 0\.35/, '_effPace * SIM_CONFIG.paceRaceWeight')
        // CarSpeed-Gewicht Rennen
        .replace(/_effCarSpeed \* 0\.25/, '_effCarSpeed * SIM_CONFIG.carSpeedRaceWeight')
        // Erfahrungs-Gewicht
        .replace(/driver\.experience \* 0\.15/g, 'driver.experience * SIM_CONFIG.experienceWeight')
        // Strategie-Gewicht (Rennen + Quali + Training)
        .replace(/team\.strategy \* 0\.1(?!\d)/g, 'team.strategy * SIM_CONFIG.strategyWeight')
        // Regen-Gewicht (Rennen + Quali)
        .replace(/driver\.rain \* 0\.2(?!\d)/g, 'driver.rain * SIM_CONFIG.rainWeight')
        // DNF-Multiplikator (Rennen)
        .replace(
            /const _multiplier = \(GAME_STATE\.dnfRate \?\? 100\) \/ 100;/,
            'const _multiplier = (GAME_STATE.dnfRate ?? 100) / 100 * (SIM_CONFIG.dnfMultiplier ?? 1.0);'
        )
        // DNF-Multiplikator (Qualifying-Runden)
        .replace(
            /const _mult2 = \(GAME_STATE\.dnfRate \?\? 100\) \/ 100;/,
            'const _mult2 = (GAME_STATE.dnfRate ?? 100) / 100 * (SIM_CONFIG.dnfMultiplier ?? 1.0);'
        );

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

let _simConfigDefaults = null;

/**
 * Wie getContext(), aber überschreibt SIM_CONFIG mit den übergebenen Werten.
 * Setzt vorher auf Defaults zurück – sicher für mehrere Aufrufe mit verschiedenen Configs.
 */
function getContextWithConfig(config = {}) {
    const ctx = getContext();
    if (!_simConfigDefaults) {
        _simConfigDefaults = { ...ctx.SIM_CONFIG };
    }
    // Erst zurücksetzen, dann überschreiben
    Object.assign(ctx.SIM_CONFIG, _simConfigDefaults, config);
    return ctx;
}

module.exports = { getContext, getContextWithConfig };
