/**
 * wiki-f2-lesen.js — liest die en.wikipedia-Saisonartikel der Formel 2 ("1960 Formula Two season",
 * "<Jahr> European Formula Two Championship" 1967–84) für rennkalender.html. Rennartikel gibt es fast keine,
 * das Feld kommt aus dem Saisonartikel selbst:
 *   - Kalender (Date | Circuit/Track | Winner): Läufe in Rundenfolge.
 *   - Ergebnismatrix (Driver | <Runden> | Pts): 1967, 1977–84 Platz/Ret/DNS je Runde; 1982–84 "Complete overview"
 *     mit zwei Spalten je Runde (Startplatz, Ergebnis) → die zweite. 1960, 1968–76 nur Punkte → "teilgenommen" ('').
 *   - "Teams and drivers" (Driver | Rounds, 1967–72, 1982–84): gemeldete Runden ohne Ergebnis (''), bringt 1967
 *     die nicht punktberechtigten "graded drivers" (Rindt, Clark …) zurück.
 *   - "Non-championship race results": Läufe ohne EM-Status, nur Sieger.
 */
'use strict';
const { saisonZeilen, klar, links, tabelle, tabellen, datum, position } = require('./wiki-nwm-lesen.js');

const kopfZeile = z => z.find(r => r.filter(c => c.kopf).length >= 3);
const spalteIn = (kopf, re) => kopf.findIndex(c => re.test(klar(c.inhalt)));
const person = zelle => { const l = links(zelle)[0], t = klar(zelle); return t ? { fahrer: l ? l.text : t, fahrerZiel: l ? l.ziel : null } : null; };
const KEINE_RUNDE = /^(pos\.?|place|driver|name|team|entrant|chassis|engine|car\(?s?\)?|tyres?|nat\.?|pts|points|total( points)?|no\.?)$/i;

// "1, 3, 4-5, 9" / "1–3" / "All" → Rundennummern
function runden(text, anzahl) {
    const t = klar(text);
    if (/^all$/i.test(t)) return Array.from({ length: anzahl }, (_, i) => i + 1);
    return [...t.matchAll(/(\d+)\s*(?:[–-]\s*(\d+))?/g)].flatMap(m => { const a = +m[1], b = +(m[2] || m[1]); return Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i); });
}

function zeilenF2(w, jahr, log = []) {
    // Abschnitt "Non-championship" ausschneiden (1980 steht er vor der Ergebnismatrix)
    let em = w;
    const nc = w.match(/\n(=+)\s*Non-championship[^\n]*\n/i);
    if (nc) {
        const rest = w.slice(nc.index + nc[0].length), naechste = rest.search(new RegExp(`\\n={2,${nc[1].length}}[^=]`));
        em = w.slice(0, nc.index) + (naechste >= 0 ? rest.slice(naechste) : '');
    }
    const alle = tabellen(em).map(tabelle);

    // Kalender
    let rennen = [];
    for (const z of alle) {
        const k = kopfZeile(z);
        if (!k) continue;
        const sD = spalteIn(k, /^date$/i), sO = spalteIn(k, /circuit|track/i), sW = spalteIn(k, /^(winner|winning driver|race winner)$/i);
        if (sD < 0 || sO < 0 || sW < 0) continue;
        const sN = spalteIn(k, /^(race|name|official name)$/i);
        for (const r of z) {
            // Abgesagte Läufe (Vallelunga 1972, Zolder 1976) haben keine Rundennummer in der Matrix
            if (r === k || !r[sD] || r[sD].kopf || r.some(c => /^cancell?ed$/i.test(klar(c.inhalt)))) continue;
            const d = datum(r[sD].inhalt, jahr);
            if (!d) continue;
            const ortL = links(r[sO].inhalt)[0], ortText = klar(r[sO].inhalt);
            // Rennartikel ("[[1967 Guards 100|Result]]", Pau 1972–75 in der Streckenzelle), selten
            const berichtL = r.flatMap(c => links(c.inhalt)).find(l => /^\d{4} /.test(l.ziel) && !/championship|season/i.test(l.ziel));
            rennen.push({ name: ((sN >= 0 && r[sN] ? klar(r[sN].inhalt) : '') || ortText).trim(), ort: ortL ? ortL.ziel : ortText, ortText, datum: d,
                bis: null, bericht: berichtL ? berichtL.ziel : null, sieger: r[sW] ? r[sW].inhalt : '', feld: [] });
        }
        if (rennen.length) break;
    }
    // Läufe ohne EM-Status; ‡/† sind Fußnoten (gemischte F1/F2-Felder)
    const ohneEM = () => saisonZeilen(w, jahr).map(z => ({ ...z, name: z.name.replace(/[\s‡†*]+$/, ''), nichtEM: true }));
    if (!rennen.length) { log.push(`${jahr}: kein Kalender`); return ohneEM(); }

    // Ergebnismatrix: Übersicht mit Spaltenpaaren vor Platz-Matrix vor Punkte-Matrix
    const kandidaten = [];
    for (const z of alle) {
        const k = kopfZeile(z);
        if (!k) continue;
        const sF = spalteIn(k, /^(driver|name)$/i);
        if (sF < 0) continue;
        let rs = k.map((c, i) => i).filter(i => i > sF && !KEINE_RUNDE.test(klar(k[i].inhalt)));
        const paare = rs.length === 2 * rennen.length && rs.every((i, n) => n % 2 === 0 || klar(k[i].inhalt) === klar(k[rs[n - 1]].inhalt));
        if (paare) rs = rs.filter((_, n) => n % 2 === 1);
        if (rs.length !== rennen.length) { if (rs.length > 2) log.push(`${jahr}: Matrix mit ${rs.length} Runden, Kalender ${rennen.length}`); continue; }
        const zeilen = z.filter(r => r !== k && r[sF] && !r[sF].kopf && klar(r[sF].inhalt));
        const platz = zeilen.some(r => rs.some(i => r[i] && /^(Ret|R|DNS|DNQ|NC|DSQ|EX|DNPQ)$/i.test(klar(r[i].inhalt).split(/\s/)[0])));
        kandidaten.push({ zeilen, rs, sF, sT: spalteIn(k, /^(team|entrant)$/i), rang: paare ? 0 : platz ? 1 : 2, platz });
    }
    kandidaten.sort((a, b) => a.rang - b.rang || b.zeilen.length - a.zeilen.length);
    const m = kandidaten[0];
    if (m) for (const r of m.zeilen) {
        const p = person(r[m.sF].inhalt);
        if (!p) continue;
        const team = m.sT >= 0 && r[m.sT] ? klar(r[m.sT].inhalt) : '';
        m.rs.forEach((i, n) => {
            const t = r[i] ? klar(r[i].inhalt).split(/\s/)[0].replace(/[()]/g, '') : '';
            if (!t || /^[-–—]$/.test(t)) return;
            const pos = !m.platz ? (/^\d+$/.test(t) && +t > 0 ? '' : null) : t === 'R' ? 'DNF' : position(t);
            if (pos !== null && (pos === '' || /^(\d+|DNF|DNS|DNQ|DNPQ|NC|DSQ|DNA)$/.test(pos))) rennen[n].feld.push({ pos, ...p, team });
        });
    }
    else log.push(`${jahr}: keine Ergebnismatrix`);

    // Gemeldete Runden
    for (const z of alle) {
        const k = kopfZeile(z);
        if (!k) continue;
        const sF = spalteIn(k, /^drivers?$/i), sR = spalteIn(k, /^rounds?$/i), sT = spalteIn(k, /^(entrant|team)$/i);
        if (sF < 0 || sR < 0) continue;
        for (const r of z) {
            if (r === k || !r[sF] || !r[sR] || r[sF].kopf) continue;
            const p = person(r[sF].inhalt);
            if (!p) continue;
            for (const n of runden(r[sR].inhalt, rennen.length)) if (rennen[n - 1])
                rennen[n - 1].feld.push({ pos: '', ...p, team: sT >= 0 && r[sT] ? klar(r[sT].inhalt.split(/<br\s*\/?>/i)[0]) : '' });
        }
    }

    // Sieger aus dem Kalender, falls die Matrix ihn nicht führt (graded drivers, Punkte-Jahre)
    for (const r of rennen) {
        const s = person(r.sieger);
        if (s && !r.feld.some(e => e.pos === '1')) r.feld.push({ pos: '1', ...s, team: '' });
        r.sieger = s ? s.fahrer : '';
    }
    return [...rennen, ...ohneEM()];
}

module.exports = { zeilenF2, runden };
