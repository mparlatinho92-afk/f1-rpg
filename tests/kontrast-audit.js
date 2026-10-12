/**
 * kontrast-audit.js — misst die Lesbarkeit JEDES sichtbaren Textes im echten Browser.
 *
 *   node tests/kontrast-audit.js [--themes dark,slate] [--jahr 1975] [--rennen 4] [--alle]
 *
 * Laeuft alle Themes x {Desktop 1366, Handy 390} x alle Tabs/Unter-Tabs + die wichtigsten
 * Modals ab. Fuer jedes Element mit eigenem Textknoten:
 *   Vordergrund = computed color (Alpha x Opacity-Kette der Vorfahren)
 *   Hintergrund = Hintergrundschichten der Vorfahren, ueber Weiss komponiert
 *                 (Verlauf: schlechteste der beteiligten Farben; Bild: uebersprungen)
 * Schwelle WCAG AA: 4,5:1, grosse Schrift (>=24px oder >=18,66px fett) 3:1.
 * Ausgabe: Fehler gruppiert nach Farbpaar+Herkunft, mit Ansicht und Textprobe.
 * --alle zeigt jede Gruppe, sonst die 60 haeufigsten.
 */
const { chromium } = require('playwright');
const path = require('path');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
// --datei: anderen Stand im Projektordner messen (data/*.js muessen relativ erreichbar sein)
const HTML = 'file:///' + path.join(__dirname, '..', arg('datei', 'index.html')).replace(/\\/g, '/');
const THEMES = (arg('themes', 'modern,dark,slate,amber,racing,indigo,bordeaux')).split(',');
const JAHR = parseInt(arg('jahr', '1975'));
const RENNEN = parseInt(arg('rennen', '4'));
const ALLE = process.argv.includes('--alle');
const VIEWPORTS = [{ name: 'desktop', width: 1366, height: 900 }, { name: 'handy', width: 390, height: 844 }];

const ANSICHTEN = [
    ['overview', null], ['standings', "setStandingsSubTab('drivers')"], ['standings', "setStandingsSubTab('teams')"],
    ['standings', "setStandingsSubTab('matrix')"], ['races', null],
    ...['drivers', 'teams', 'champions', 'circuits', 'gps', 'transfers', 'necrology', 'records', 'nations']
        .map(s => ['stATS', `setStATSSubTab('${s}')`]),
    ['handbook', null], ['roadmap', null], ['settings', null],
    ...['season', 'alltime', 'circuits', 'editor'].map(s => ['junior', `juniorSubTab('${s}')`]),
    // [tab, aktion, name, aufraeumen] - Umschalter nach der Messung zuruecksetzen, sonst kippen sie je Theme
    ['overview', "GAME_STATE.reservePoolCollapsed = false; renderContent()", 'Reserve-Pool', "GAME_STATE.reservePoolCollapsed = true"],
    ['overview', "toggleGridEditor()", 'Grid-Editor', "resetPendingEdits()"],
    ['races', "toggleCalendarEditMode()", 'Kalender-Editor', "toggleCalendarEditMode()"],
    ['overview', "toggleDebugLog()", 'Debug-Log', "toggleDebugLog()"]
];
const MODALS = [
    ['Fahrerprofil', "await openDriverProfile(GAME_STATE.drivers[0].id)", 'driverProfileModal'],
    ['Teamprofil', "await openTeamProfile(GAME_STATE.teams[0].id)", 'teamProfileModal'],
    ['Renndetail', "showRaceDetail(0)", 'raceDetailModal'],
    ['Rennmodus', "simulateNextRace()", 'raceModeModal'],
    ['Changelog', "openChangelog()", 'changelog-modal'],
    ['Reset-Center', "openResetCenter()", 'resetCenterModal'],
    ['Datensatz-Manager', "openDatasetManager()", 'datasetManagerModal'],
    ['Streckenprofil', "openGameCircuitProfile(GAME_STATE.races[0].circuitId)", 'circuitGPProfileModal'],
    ['Saisonende', "showSeasonEndModal()", 'seasonEndModal'],
    // Ticker zuletzt: oeffnet nur und taktet ein paar Runden, schliesst NICHT (closeLiveRace wuerde werten)
    ['Live-Ticker', "GAME_STATE.liveTickerMode = true; window.startLiveRace(GAME_STATE.currentRace, false); window.startRaceSimulation(); for (let i = 0; i < 15; i++) simulateLap(); toggleLivePause()", 'liveTickerModal']
];

// Laeuft im Browser: sammelt alle Texte unter Kontrastschwelle
function messe(wurzelId) {
    const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null;
        const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
    const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
        return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const over = (top, bot) => { const a = top[3]; return [0, 1, 2].map(i => top[i] * a + bot[i] * (1 - a)).concat(1); };
    const hex = c => '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    const sig = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id;
        const cl = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3); if (cl.length) s += '.' + cl.join('.');
        const st = el.getAttribute('style') || ''; const col = st.match(/(^|;|\s)(color|opacity)\s*:[^;]+/g);
        if (col) s += ' [' + col.map(x => x.replace(/^[;\s]+/, '').trim()).join(';') + ']'; return s; };

    const out = [];
    const walker = document.createTreeWalker((wurzelId && document.getElementById(wurzelId)) || document.body, NodeFilter.SHOW_TEXT);
    const gesehen = new Set();
    let n;
    while ((n = walker.nextNode())) {
        if (!n.nodeValue.trim() || /^[\s\p{Extended_Pictographic}️‍·•|\/–—-]+$/u.test(n.nodeValue)) continue;
        const el = n.parentElement; if (!el || gesehen.has(el)) continue; gesehen.add(el);
        if (['SCRIPT', 'STYLE', 'OPTION', 'NOSCRIPT'].includes(el.tagName)) continue;
        const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility !== 'visible' || el.closest('[style*="display: none"],[style*="display:none"]')) continue;
        if (el.closest('svg')) continue;
        let fg = parse(cs.color); if (!fg) continue;
        // Opacity-Kette + Hintergrundschichten einsammeln
        let op = 1, layers = [], bild = false, verlauf = [];
        for (let a = el; a; a = a.parentElement) {
            const s = getComputedStyle(a);
            if (s.display === 'none') { op = -1; break; }
            op *= parseFloat(s.opacity);
            const bi = s.backgroundImage;
            if (bi && bi !== 'none' && !verlauf.length && !bild) {
                if (/url\(/.test(bi)) bild = true;
                else { verlauf = (bi.match(/rgba?\([^)]+\)/g) || []).map(parse).filter(Boolean); }
            }
            const bc = parse(s.backgroundColor); if (bc && bc[3] > 0) { layers.push(bc); if (bc[3] >= 1) break; }
        }
        if (op <= 0.05 || bild) continue;
        let bg = [255, 255, 255, 1];
        for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
        const bgs = verlauf.length ? verlauf.map(v => over(v, bg)) : [bg];
        fg = [fg[0], fg[1], fg[2], fg[3] * op];
        let schlecht = null;
        for (const b of bgs) { const f = over(fg, b), cr = ratio(f, b); if (!schlecht || cr < schlecht.cr) schlecht = { cr, f, b }; }
        const px = parseFloat(cs.fontSize), fett = parseInt(cs.fontWeight) >= 700;
        const soll = (px >= 24 || (px >= 18.66 && fett)) ? 3 : 4.5;
        if (schlecht.cr < soll) {
            // Herkunft: naechster Vorfahr mit eigener Farb-/Opacity-Angabe
            let quelle = el;
            for (let a = el; a && a !== document.body; a = a.parentElement) {
                if (/(^|;)\s*(color|opacity)\s*:/.test(a.getAttribute('style') || '') || /text-|opacity/.test(a.getAttribute('class') || '')) { quelle = a; break; }
            }
            out.push({ cr: +schlecht.cr.toFixed(2), soll, fg: hex(schlecht.f), bg: hex(schlecht.b), roh: cs.color, op: +op.toFixed(2),
                el: sig(el), quelle: quelle === el ? '' : sig(quelle), text: n.nodeValue.trim().slice(0, 40), px });
        }
    }
    return out;
}

(async () => {
    const browser = await chromium.launch();
    const gruppen = new Map();
    const fehlerLog = [];
    for (const vp of VIEWPORTS) {
        const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
        page.on('pageerror', e => fehlerLog.push(vp.name + ': ' + e.message));
        page.on('dialog', d => d.dismiss().catch(() => {}));
        await page.goto(HTML, { waitUntil: 'load' });
        await page.waitForTimeout(2500);
        await page.evaluate(({ jahr, rennen }) => {
            window.alert = () => {}; window.confirm = () => true;
            // Messfalle: body hat transition auf color - sonst misst man Zwischenfarben beim Theme-Wechsel
            const st = document.createElement('style'); st.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.head.appendChild(st);
            initFromYear(jahr);
            for (let i = 0; i < rennen; i++) { try { selectRaceMode('classic'); } catch (e) {} }
            document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
            renderAll();
        }, { jahr: JAHR, rennen: RENNEN });

        for (const theme of THEMES) {
            const sammle = (ansicht, liste) => { for (const f of liste) {
                const key = [f.fg, f.bg, f.quelle || f.el].join('|');
                if (!gruppen.has(key)) gruppen.set(key, { ...f, n: 0, themes: new Set(), vps: new Set(), ansichten: new Set() });
                const g = gruppen.get(key); g.n++; g.themes.add(theme); g.vps.add(vp.name); g.ansichten.add(ansicht);
                if (f.cr < g.cr) Object.assign(g, { cr: f.cr, text: f.text });
            } };
            for (const [tab, sub, name, zurueck] of ANSICHTEN) {
                const res = await page.evaluate(({ theme, tab, sub, zurueck, messeSrc }) => {
                    document.querySelectorAll('.modal-overlay,#changelog-modal').forEach(m => m.style.display = 'none');
                    GAME_STATE.theme = theme; document.documentElement.setAttribute('data-theme', theme);
                    try { switchTab(tab); if (sub) eval(sub); } catch (e) { return { err: e.message }; }
                    const liste = eval('(' + messeSrc + ')')();
                    try { if (zurueck) eval(zurueck); } catch (e) {}
                    return { liste };
                }, { theme, tab, sub, zurueck, messeSrc: messe.toString() });
                const label = name || (tab + (sub ? ':' + sub.match(/'(\w+)'/)[1] : ''));
                if (res.err) fehlerLog.push(`${vp.name}/${theme}/${label}: ${res.err}`); else sammle(label, res.liste);
            }
            for (const [name, open, id] of MODALS) {
                const res = await page.evaluate(async ({ open, id, messeSrc }) => {
                    document.querySelectorAll('.modal-overlay,#changelog-modal').forEach(m => m.style.display = 'none');
                    try { await eval('(async () => { ' + open + ' })()'); } catch (e) { return { err: e.message }; }
                    await new Promise(r => setTimeout(r, 150));
                    const m = document.getElementById(id); if (!m || m.style.display === 'none') return { err: 'nicht offen' };
                    const alle = eval("(" + messeSrc + ")")(id);
                    return { liste: alle };
                }, { open, id, messeSrc: messe.toString() });
                if (res.err) fehlerLog.push(`${vp.name}/${theme}/${name}: ${res.err}`); else sammle('modal:' + name, res.liste);
            }
        }
        await page.close();
    }
    await browser.close();

    const liste = [...gruppen.values()].sort((a, b) => (b.n * (b.soll - b.cr)) - (a.n * (a.soll - a.cr)));
    console.log(`=== Kontrast-Audit: ${liste.length} Problemgruppen, ${liste.reduce((s, g) => s + g.n, 0)} Textstellen ===\n`);
    for (const g of (ALLE ? liste : liste.slice(0, 60))) {
        console.log(`${g.cr.toFixed(2)}/${g.soll}  ${g.fg} auf ${g.bg}  n=${g.n}  op=${g.op}  [${[...g.themes].join(',')}] [${[...g.vps].join(',')}]`);
        console.log(`   ${g.quelle || g.el}${g.quelle ? '  >  ' + g.el : ''}`);
        console.log(`   "${g.text}"  in ${[...g.ansichten].slice(0, 4).join(', ')}${g.ansichten.size > 4 ? ' …' : ''}`);
    }
    if (fehlerLog.length) console.log('\nHinweise:\n  ' + [...new Set(fehlerLog)].slice(0, 30).join('\n  '));
})();
