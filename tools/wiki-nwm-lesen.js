/**
 * wiki-nwm-lesen.js — liest Wikitext der Formel-1-Nicht-WM-Rennen (geteilt von wiki-nwm-holen.js und
 * build-rennkalender.js). Zwei Tabellen: Saisonübersicht und Ergebnis im Rennbericht.
 */
'use strict';

const MONATE = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9,
    october: 10, november: 11, december: 12 };

// Oberste Ebene: Trennzeichen außerhalb von [[…]] und {{…}} finden
function teileOben(s, trenner) {
    const teile = []; let tiefe = 0, start = 0;
    for (let i = 0; i < s.length; i++) {
        const zwei = s.substr(i, 2);
        if (zwei === '[[' || zwei === '{{') { tiefe++; i++; continue; }
        if ((zwei === ']]' || zwei === '}}') && tiefe) { tiefe--; i++; continue; }
        if (!tiefe && s.startsWith(trenner, i)) { teile.push(s.slice(start, i)); start = i + trenner.length; i += trenner.length - 1; }
    }
    teile.push(s.slice(start));
    return teile;
}
// Zelle "attr | inhalt" → { attr, inhalt }
function zelle(roh) {
    const t = teileOben(roh, '|');
    if (t.length > 1 && /^\s*(?:[a-z-]+\s*=|nowrap\s*$)/i.test(t[0])) return { attr: t[0], inhalt: t.slice(1).join('|').trim() };
    return { attr: '', inhalt: roh.trim() };
}
const links = s => [...s.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g)].map(m => ({ ziel: m[1].trim(), text: (m[2] || m[1]).trim() }));
// Wikitext → Klartext: Vorlagen raus (dts/sortname auflösen), Links → Anzeigetext, Ref/HTML raus
function klar(s) {
    s = s.replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, '').replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '').replace(/<br\s*\/?>/g, ' ');
    s = s.replace(/\{\{\s*dts\s*\|\s*(\d{4})\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})[^}]*\}\}/gi, '$3 #$2 $1');
    s = s.replace(/\{\{\s*sortname\s*\|([^|}]+)\|([^|}]+)[^}]*\}\}/gi, '$1 $2');
    let alt;
    do { alt = s; s = s.replace(/\{\{[^{}]*\}\}/g, ''); } while (s !== alt);
    s = s.replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1').replace(/<[^>]+>/g, '').replace(/'''?/g, '');
    return s.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

// Tabelle → Zeilen aus Zellen; rowspan wird auf die Folgezeilen verteilt. Kopfzellen (!) markiert.
function tabelle(w) {
    const zeilen = [], offen = [];                 // offen[spalte] = { zelle, rest }
    for (const block of w.split(/\n\|-[^\n]*/).slice(0)) {
        const zellen = [];
        for (const zeile of block.split('\n')) {
            const m = zeile.match(/^\s*([|!])(.*)$/);
            if (!m || /^\s*\{\|/.test(zeile) || /^\s*\|\}/.test(zeile) || /^\s*\|\+/.test(zeile)) {
                if (zellen.length && zeile.trim() && !/^\s*[{|]/.test(zeile)) zellen[zellen.length - 1].roh += '\n' + zeile;
                continue;
            }
            for (const teil of teileOben(m[2], m[1] === '!' ? '!!' : '||').flatMap(t => m[1] === '!' ? teileOben(t, '||') : [t]))
                zellen.push({ kopf: m[1] === '!', roh: teil });
        }
        if (!zellen.length) continue;
        const reihe = [];
        let k = 0;
        const fuelle = () => { while (offen[reihe.length] && offen[reihe.length].rest > 0) { reihe.push(offen[reihe.length].z); offen[reihe.length - 1].rest--; } };
        for (const z of zellen) {
            fuelle();
            const { attr, inhalt } = zelle(z.roh);
            const c = { kopf: z.kopf, attr, inhalt };
            const rs = +((attr.match(/rowspan\s*=\s*"?(\d+)/i) || [])[1] || 1);
            if (rs > 1) offen[reihe.length] = { z: c, rest: rs - 1 };
            reihe.push(c);
            const cs = +((attr.match(/colspan\s*=\s*"?(\d+)/i) || [])[1] || 1);
            for (let i = 1; i < cs; i++) reihe.push(c);
            k++;
        }
        fuelle();
        zeilen.push(reihe);
    }
    return zeilen;
}
// Alle {| … |} eines Textstücks (ohne Verschachtelung)
const tabellen = s => [...s.matchAll(/\{\|[\s\S]*?\n\|\}/g)].map(m => m[0]);

// Alle Abschnitte, deren Überschrift passt, jeweils bis zur nächsten Überschrift gleicher oder höherer Ebene.
// Mehrere nötig: 1951 heißt der erste Treffer "Pre-season non-championship races" (ohne Tabelle).
function abschnitte(w, titelRe) {
    const kopf = [...w.matchAll(/\n(={2,6})\s*([^=\n]+?)\s*\1[ \t]*(?=\n)/g)];
    return kopf.map((m, i) => {
        if (!titelRe.test(m[2])) return null;
        const ende = kopf.slice(i + 1).find(n => n[1].length <= m[1].length);
        return w.slice(m.index + m[0].length, ende ? ende.index : w.length);
    }).filter(x => x !== null);
}
const abschnitt = (w, titelRe) => { const a = abschnitte(w, titelRe); return a.length ? a.join('\n') : null; };

function datum(text, jahr) {
    const t = klar(text).toLowerCase();
    let m = t.match(/(\d{1,2})\s*#(\d{1,2})/);
    if (m) return `${jahr}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
    m = t.match(/(\d{1,2})\s+([a-z]+)/) || t.match(/([a-z]+)\s+(\d{1,2})/);
    if (!m) return null;
    const [tag, mon] = /^\d/.test(m[1]) ? [m[1], m[2]] : [m[2], m[1]];
    const mo = MONATE[mon] || MONATE[Object.keys(MONATE).find(k => k.startsWith(mon.slice(0, 3)))];
    return mo ? `${jahr}-${String(mo).padStart(2, '0')}-${String(tag).padStart(2, '0')}` : null;
}

// Saisonartikel → [{ name, ort, ortText, datum, bericht, sieger }]
function saisonZeilen(w, jahr) {
    const ab = abschnitt(w, /non-championship/i);
    if (!ab) return [];
    const aus = [], gesehen = new Set();
    for (const t of tabellen(ab)) {
        const z = tabelle(t), kopf = z.find(r => r.every(c => c.kopf));
        if (!kopf) continue;
        const spalte = re => kopf.findIndex(c => re.test(klar(c.inhalt)));
        const sName = spalte(/race|event|name/i), sOrt = spalte(/circuit|venue|track|location/i), sDatum = spalte(/date/i);
        const sSieger = spalte(/winn/i), sBericht = spalte(/report/i);
        if (sName < 0 || sDatum < 0) continue;
        for (const r of z) {
            if (r === kopf || r.every(c => c.kopf) || r.length <= Math.max(sName, sDatum)) continue;
            const d = datum(r[sDatum].inhalt, jahr);
            if (!d) continue;
            const ortL = sOrt >= 0 && r[sOrt] ? links(r[sOrt].inhalt)[0] : null;
            const berichtL = [sBericht, sName].filter(i => i >= 0 && r[i]).flatMap(i => links(r[i].inhalt))
                .find(l => /^\d{4} /.test(l.ziel));
            const schluessel = d + klar(r[sName].inhalt);
            if (gesehen.has(schluessel)) continue;
            gesehen.add(schluessel);
            aus.push({ name: klar(r[sName].inhalt).replace(/^[IVXLC]+\s+/, ''), ort: ortL ? ortL.ziel : null,
                ortText: sOrt >= 0 && r[sOrt] ? klar(r[sOrt].inhalt) : '', datum: d, bericht: berichtL ? berichtL.ziel : null,
                sieger: sSieger >= 0 && r[sSieger] ? klar(r[sSieger].inhalt) : '' });
        }
    }
    return aus;
}

// Positionstext auf F1DB-Kürzel
function position(s) {
    const t = klar(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (/^\d+$/.test(t)) return t;
    if (/^(RET|DNF)/.test(t)) return 'DNF';
    return { NC: 'NC', DNS: 'DNS', DNQ: 'DNQ', DNPQ: 'DNPQ', DSQ: 'DSQ', DQ: 'DSQ', DNA: 'DNA', WD: 'DNA', EX: 'DSQ', NS: 'DNS', NQ: 'DNQ' }[t] || t;
}
// Rennbericht → { ort, feld: [{ pos, fahrer, fahrerZiel, team }] } — alle Ergebnistabellen (Rennen, DNQ, DNA)
function berichtFeld(w) {
    const info = (w.match(/\|\s*Location\s*=([^\n]*)/i) || [])[1] || '';
    const ab = abschnitt(w, /^(results?|classification|race classification|race results?|race)$/i) || '';
    const feld = [];
    for (const t of tabellen(ab)) {
        const z = tabelle(t), kopf = z.find(r => r.length > 2 && r.filter(c => c.kopf).length >= 3);
        if (!kopf) continue;
        const spalte = re => kopf.findIndex(c => re.test(klar(c.inhalt)));
        const sPos = spalte(/^pos/i), sFahrer = spalte(/driver/i);
        const sTeam = [spalte(/constructor|car/i), spalte(/entrant|team/i)].find(i => i >= 0);
        if (sFahrer < 0) continue;
        for (const r of z) {
            if (r === kopf || !r[sFahrer] || r[sFahrer].kopf) continue;
            const l = links(r[sFahrer].inhalt)[0], name = klar(r[sFahrer].inhalt);
            if (!name || /source|note|fastest lap/i.test(name)) continue;
            const pos = sPos >= 0 && r[sPos] ? position(r[sPos].inhalt) : '';
            feld.push({ pos, fahrer: l ? l.text : name, fahrerZiel: l ? l.ziel : null,
                team: sTeam !== undefined && r[sTeam] ? klar(r[sTeam].inhalt) : '' });
        }
    }
    const ortL = links(info)[0];
    return { ort: ortL ? ortL.ziel : null, feld };
}

module.exports = { saisonZeilen, berichtFeld, klar, links, tabelle, abschnitt };
