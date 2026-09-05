/**
 * build-f1-logos.js — erzeugt aus den Original-SVGs in tools/f1-logos/ den
 * JS-Block F1_LOGOS + getF1LogoHtml() zum Einfügen in index.html.
 *
 * Warum aufbereiten und nicht 1:1 einbetten:
 *  - Beide Adobe-Exporte bringen einen <style>-Block mit Klasse ".st0" mit,
 *    aber mit UNTERSCHIEDLICHER Farbe (#fff bzw. #FFD800). Inline nebeneinander
 *    im selben Dokument gewinnt der letzte Block global — das 1985er Logo würde
 *    gelb. Klassen werden deshalb zu direkten fill-Attributen aufgelöst.
 *  - Schwarze Flächen werden zu currentColor, damit das Logo der Textfarbe des
 *    Themes folgt (das Flying One ist schwarz-rot und verschwände sonst im Dark-Theme).
 *    NUR beim Flying One und der FIA-Marke — beim 2018er erben die Pfade ihr Rot
 *    von der Elterngruppe, da würde currentColor die Farbe zerstören.
 *
 * Aufruf: node tools/build-f1-logos.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'f1-logos');
const OUT = path.join(SRC, 'f1-logos.generated.js');

// class -> fill je Datei (aus dem jeweiligen <style>-Block)
const CLASS_FILL = {
    'f1-1985.svg': { st0: '#fff', st1: '#0856a0' },
    'fia-wm.svg':  { st0: '#FFD800' }
};
// Pfade ohne eigenes fill sind hier wirklich schwarz (erben nichts von einem <g>)
const IMPLICIT_BLACK = new Set(['fia-wm.svg']);

function prepare(file) {
    let s = fs.readFileSync(path.join(SRC, file), 'utf8');

    s = s.replace(/<\?xml[\s\S]*?\?>/g, '');
    s = s.replace(/<!--[\s\S]*?-->/g, '');
    s = s.replace(/<metadata[\s\S]*?<\/metadata>/g, '');
    s = s.replace(/<style[\s\S]*?<\/style>/g, '');
    s = s.replace(/<defs\s*>\s*<\/defs>/g, '');

    // Klassen auflösen (siehe Kopfkommentar: .st0 kollidiert zwischen den Dateien)
    const map = CLASS_FILL[file];
    if (map) {
        s = s.replace(/class="([^"]+)"/g, (m, cls) => {
            const fill = map[cls.trim()];
            return fill ? 'fill="' + fill + '"' : '';
        });
    }

    // Schwarz -> currentColor
    s = s.replace(/fill="#000000"/g, 'fill="currentColor"').replace(/fill="#000"/g, 'fill="currentColor"');
    if (IMPLICIT_BLACK.has(file)) {
        s = s.replace(/<(path|polygon|rect)((?![^>]*(?:fill=|class=))[^>]*?)(\/?)>/g,
            (m, tag, attrs, slash) => '<' + tag + attrs + ' fill="currentColor"' + slash + '>');
    }

    // Attribute, die im Dokument stören oder die Größe festnageln
    s = s.replace(/\s(id|xmlns:(?!svg)\w+|xml:space|enable-background|data-name)="[^"]*"/g, '');
    s = s.replace(/<svg([^>]*?)\s(width|height)="[^"]*"/g, '<svg$1');
    s = s.replace(/<svg([^>]*?)\s(width|height)="[^"]*"/g, '<svg$1');

    s = s.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
    return s;
}

/**
 * Das 1985er Original ist ein Banner im Verhaeltnis 12,8:1 und frisst als Einzeiler
 * ein Drittel der Titelzeile. Es besteht aus vier Top-Level-<g> (in Dokumentreihenfolge:
 * FORMULA ONE, WORLD CHAMPIONSHIP, FIA, Emblem — per getBBox vermessen, siehe unten).
 * Die Kompaktfassung setzt FORMULA ONE unter die erste Zeile:
 *      [Emblem] FIA WORLD CHAMPIONSHIP
 *              FORMULA ONE
 * Ergebnis 573x188 statt 1131x88, also 3:1 statt 12,8:1.
 */
const G_BOXES = [        // x/Breite der vier Gruppen im Original
    { name: 'FORMULA ONE',       x: 558.3, w: 572.5 },
    { name: 'WORLD CHAMPIONSHIP', x: 260.7, w: 289.2 },
    { name: 'FIA',                x: 101.4, w: 143.5 },
    { name: 'Emblem',             x: 0,     w: 88.4 }
];
const ROW1_W = 549.9;    // Emblem + FIA + WORLD CHAMPIONSHIP
const ROW2_Y = 100;      // Grundlinie der zweiten Zeile
const TOTAL_W = 572.5, TOTAL_H = 188;

function compact1985(svg) {
    const shiftRow1 = ((TOTAL_W - ROW1_W) / 2).toFixed(1);   // erste Zeile mittig ueber FORMULA ONE
    let depth = 0, gIndex = 0, out = '', i = 0;
    while (i < svg.length) {
        if (svg.startsWith('</g>', i)) { depth--; out += '</g>'; i += 4; continue; }
        if (svg.startsWith('<g', i)) {
            const end = svg.indexOf('>', i);
            let tag = svg.slice(i, end + 1);
            if (depth === 0) {
                const t = gIndex === 0
                    ? 'translate(' + (-G_BOXES[0].x).toFixed(1) + ',' + ROW2_Y + ')'
                    : 'translate(' + shiftRow1 + ',0)';
                tag = tag.replace(/^<g/, '<g transform="' + t + '"');
                gIndex++;
            }
            if (!tag.endsWith('/>')) depth++;
            out += tag; i = end + 1; continue;
        }
        out += svg[i]; i++;
    }
    if (gIndex !== 4) throw new Error('Erwartet 4 Top-Level-Gruppen, gefunden: ' + gIndex);
    return out.replace(/viewBox="[^"]*"/, 'viewBox="0 0 ' + TOTAL_W + ' ' + TOTAL_H + '"');
}

const logos = {
    l1985: compact1985(prepare('f1-1985.svg')),
    lfia:  prepare('fia-wm.svg'),
    l1994: prepare('f1-1994.svg'),
    l2018: prepare('f1-2018.svg')
};

// Höhenfaktor: die FIA-Marke ist hochkant (345x373), sie braucht mehr Höhe als
// die drei Querformate, um überhaupt als Zeichen erkennbar zu sein.
const block = `
        // === F1-LOGO (epochengerecht) ===
        // Echte Marken (Quelle Logopedia, wie TEAM_LOGOS), inline statt per URL,
        // damit der Monolith offline funktioniert. Schwarz ist currentColor, das
        // Logo folgt also der Textfarbe des Themes.
        // Zeitraeume laut Logopedia:
        //   1950-1984  keine Marke ueberliefert ("Missing logo")
        //   1985-1986  Schriftzug "FIA World Championship Formula One"
        //   1986-1993  FIA-Weltmeisterschaftsmarke (lief real bis 2002 parallel)
        //   1994-2017  Flying One (Carter Wong Design)
        //   ab 2018    aktuelles Logo (Wieden+Kennedy, 26.11.2017 Abu Dhabi)
        const F1_LOGOS = {
            l1985: '${logos.l1985.replace(/'/g, "\\'")}',
            lfia: '${logos.lfia.replace(/'/g, "\\'")}',
            l1994: '${logos.l1994.replace(/'/g, "\\'")}',
            l2018: '${logos.l2018.replace(/'/g, "\\'")}'
        };
        // Vor 1985 gab es keine Marke. 'l1985' = aeltestes Logo rueckwirkend zeigen,
        // null = in diesen Jahren gar kein Logo (dann bleibt nur die Landesflagge).
        const F1_LOGO_PRE1985 = 'l1985';
        const F1_LOGO_HEIGHTS = { l1985: 1.5, lfia: 1.3, l1994: 1, l2018: 1 };

        function getF1LogoKey(year) {
            const y = parseInt(year, 10) || 0;
            if (y >= 2018) return 'l2018';
            if (y >= 1994) return 'l1994';
            if (y >= 1986) return 'lfia';
            if (y >= 1985) return 'l1985';
            return F1_LOGO_PRE1985;
        }

        // Liefert das Logo des Jahres als Inline-SVG. height in px (Standard 22 =
        // Zeilenhoehe einer .text-xl-Ueberschrift). Ohne Treffer leerer String,
        // damit der Aufrufer nichts weiter pruefen muss.
        function getF1LogoHtml(year, height) {
            const key = getF1LogoKey(year);
            if (!key || !F1_LOGOS[key]) return '';
            const h = Math.round((height || 22) * (F1_LOGO_HEIGHTS[key] || 1));
            return F1_LOGOS[key].replace('<svg',
                '<svg style="height:' + h + 'px;width:auto;vertical-align:-3px;flex:none;" role="img" aria-label="Formel 1"');
        }

        // Statische Ueberschriften im Markup koennen kein Jahr kennen, weil sie vor
        // dem Spielstand existieren. Sie tragen stattdessen <span data-f1-logo="22">,
        // das hier zentral gefuellt wird (Aufruf in renderAll) - so bleibt ein
        // einziger Ort, an dem das Logo der laufenden Saison gesetzt wird.
        function refreshF1LogoSlots(year) {
            const y = year || (typeof GAME_STATE !== 'undefined' ? GAME_STATE.currentYear : null);
            document.querySelectorAll('[data-f1-logo]').forEach(el => {
                el.innerHTML = getF1LogoHtml(y, parseInt(el.getAttribute('data-f1-logo'), 10) || 22);
            });
        }
`;

fs.writeFileSync(OUT, block, 'utf8');
const kb = n => (Buffer.byteLength(n, 'utf8') / 1024).toFixed(1) + ' KB';
console.log('Logos aufbereitet:');
Object.entries(logos).forEach(([k, v]) => console.log('  ' + k.padEnd(7) + kb(v)));
console.log('Block gesamt: ' + kb(block) + '  ->  ' + path.relative(process.cwd(), OUT));
