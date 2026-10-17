// Fiktive Karriere: jede Zeile ein Sonderfall für teamNamensFeld / renderTeamNameColored
const { createRequire } = require('module');
const req = createRequire(__filename);
const { chromium } = req('playwright');
const OUT = require('path').join(__dirname, '..', 'screenshots') + '/';

// [Jahr, teamId, Anzeigename, Sonderfall, künstliche Farben (optional)]
const FAELLE = [
    [1973, 'lotus', 'Lotus', 'Schwarz/Gold (JPS) – Schwarz auf Schwarz im dunklen Theme'],
    [1975, 'tyrrell', 'Tyrrell', 'Dunkelblau'],
    [1988, 'mclaren', 'McLaren', 'Marlboro'],
    [1995, 'williams', 'Williams', 'nur EINE Farbe hinterlegt'],
    [1996, 'mclaren', 'McLaren', 'Weiß/Weiß/Rot – Weiß auf Weiß im hellen Theme'],
    [1998, 'jordan', 'Jordan', 'Gelb – Weiß wäre unlesbar'],
    [2000, 'mclaren', 'McLaren', 'Silber/Silber/Schwarz – zwei identische Farben'],
    [2004, 'ferrari', 'Ferrari', 'Rot'],
    [2010, 'test-a', 'Testteam Ganzschwarz', 'künstlich: nur #000000', ['#000000']],
    [2011, 'test-b', 'Testteam Ganzweiß', 'künstlich: nur #FFFFFF', ['#FFFFFF']],
    [2012, 'test-c', 'Testteam Zwilling', 'künstlich: zwei identische Dunkelblau', ['#003366', '#003366']],
    [2013, 'test-d', 'Testteam Hellgrau', 'künstlich: #E8E8E8 + #F0F0F0', ['#E8E8E8', '#F0F0F0']],
    [2014, 'test-e', 'Testteam Dunkel-Paar', 'künstlich: #111111 + #1A1A2E (Rand ohne passende Zweitfarbe)', ['#111111', '#1A1A2E']],
    [2015, 'test-f', 'Frank Williams Racing Cars Ltd. Langname', 'überlanger Name', ['#FFFFFF', '#1A3C8C']],
    [2016, 'test-g', 'Unbekannt', 'keine Farbe (#888) → grau', ['#888888']],
    [2017, 'test-h', 'Kaputte Farbe', 'ungültiger Farbwert „red"', ['red']],
];

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
    const fehler = [];
    page.on('pageerror', e => fehler.push(e.message));
    page.on('dialog', d => d.dismiss().catch(() => {}));
    await page.goto('file:///' + require('path').join(__dirname, '..', 'index.html').replace(/\\/g, '/'), { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
        const st = document.createElement('style'); st.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.head.appendChild(st);
        initFromYear(2006);
        document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
        renderAll();
    });
    for (const theme of ['dark', 'modern']) {
        const log = await page.evaluate(({ theme, FAELLE }) => {
            GAME_STATE.theme = theme; document.documentElement.setAttribute('data-theme', theme);
            const echt = window.__echtGTC || (window.__echtGTC = getTeamColors);
            const kuenstlich = {}; FAELLE.forEach(f => { if (f[4]) kuenstlich[f[1]] = f[4]; });
            window.getTeamColors = (id, y, b) => kuenstlich[id] || echt(id, y, b);
            const zeilen = FAELLE.map(([j, id, name, fall]) => {
                const cols = getTeamColors(id, j);
                // Matrix-Pfad nachgestellt (wie Zeile mit teamColorStyle): flex:0 1 auto
                const tc = cols[0] || '#888';
                const style = (tc === '#888888' || tc === '#888') ? 'color:var(--text-muted);font-weight:bold' : (teamNamensFeld(cols) || `color:${lesbareTextfarbe(tc)};font-weight:bold`);
                return `<div style="display:flex;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid var(--border-color, #333)">
                    <span style="width:44px;font-weight:bold;color:var(--text-primary)">${j}</span>
                    <span style="width:130px;display:flex;min-width:0"><span style="flex:0 1 auto;min-width:0;font-size:0.7rem;${style};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</span></span>
                    <span style="width:150px">${renderTeamNameColored(name, id, j)}</span>
                    <span style="flex:1;font-size:0.7rem;color:var(--text-secondary)">${fall} · <code>${cols.join(' ')}</code></span></div>`;
            }).join('');
            let box = document.getElementById('__feldtest');
            if (!box) { box = document.createElement('div'); box.id = '__feldtest'; document.body.prepend(box); }
            box.className = 'bg-card rounded-lg';
            box.style.cssText = 'position:relative;z-index:99999;padding:16px;margin:8px;background:var(--bg-card)';
            box.innerHTML = `<h4 class="font-bold mb-2" style="color:var(--text-primary)">Fiktive Karriere · Theme ${theme}</h4>
                <div style="display:flex;gap:10px;font-size:0.65rem;color:var(--text-secondary);padding-bottom:4px"><span style="width:44px">Jahr</span><span style="width:130px">Matrix</span><span style="width:150px">Tabellen-Name</span><span>Fall · Teamfarben</span></div>${zeilen}`;
            window.scrollTo(0, 0);
            return FAELLE.map(f => f[0] + ' ' + f[1] + ': ' + teamNamensFeld(getTeamColors(f[1], f[0]))).join('\n');
        }, { theme, FAELLE });
        if (theme === 'dark') console.log(log);
        await (await page.$('#__feldtest')).screenshot({ path: `${OUT}teamfeld-karriere-${theme}.png` });
    }
    if (fehler.length) console.log('pageerror:', fehler.slice(0, 5));
    await browser.close();
})();
