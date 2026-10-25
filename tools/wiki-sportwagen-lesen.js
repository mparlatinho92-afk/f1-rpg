/**
 * wiki-sportwagen-lesen.js — liest de.wikipedia-Artikel der Sportwagen-WM (1953–1985) für rennkalender.html.
 * Gemeinsame Wikitext-Helfer kommen aus wiki-nwm-lesen.js.
 *
 * Saisonartikel "Sportwagen-Weltmeisterschaft <Jahr>", Abschnitt "Rennkalender": Datum ("3. – 4. Februar"),
 * Rennname mit Link auf den Bericht, Strecke in Klammern, Gesamtsieger.
 * Rennbericht: Abschnitt "Ergebnisse" mit "Schlussklassement" (Zwischenzeilen "Ausgefallen", "Nicht gestartet" …)
 * und "Nur in der Meldeliste" (= DNA). Mehrere Fahrer je Wagen in einer Zelle, getrennt durch <br>.
 */
'use strict';
const { klar, links, tabelle, tabellen, abschnitte, teileOben } = require('./wiki-nwm-lesen.js');

const MONATE = { januar: 1, jänner: 1, februar: 2, märz: 3, april: 4, mai: 5, juni: 6, juli: 7, august: 8, september: 9,
    oktober: 10, november: 11, dezember: 12 };
const monat = w => { const k = Object.keys(MONATE).find(m => m.startsWith(w.toLowerCase().replace('.', '').slice(0, 3))); return k ? MONATE[k] : null; };
const iso = (j, m, t) => `${j}-${String(m).padStart(2, '0')}-${String(t).padStart(2, '0')}`;

// "11. – 12. Juni" → { datum: 11.6., bis: 12.6. }; "30. April – 1. Mai"; "23. Januar"
function datumDe(text, jahr) {
    const teile = [...klar(text).matchAll(/(\d{1,2})\.\s*([A-Za-zäÄ]+\.?)?/g)].map(m => [+m[1], m[2] ? monat(m[2]) : null]);
    if (!teile.length) return null;
    const letzterMonat = [...teile].reverse().find(t => t[1]);
    if (!letzterMonat) return null;
    const [t1, m1] = teile[0], [t2, m2] = teile[teile.length - 1];
    const von = iso(jahr, m1 || letzterMonat[1], t1), bis = iso(jahr, m2 || letzterMonat[1], t2);
    return { datum: von, bis: bis > von ? bis : null };
}

// Saisonartikel → [{ name, bericht, ort, ortText, datum, bis, sieger }]
function saisonZeilenDe(w, jahr) {
    const aus = [], gesehen = new Set();
    for (const ab of abschnitte(w, /^Rennkalender/i)) for (const t of tabellen(ab)) {
        const z = tabelle(t), kopf = z.find(r => r.length > 2 && r.every(c => c.kopf));
        if (!kopf) continue;
        const spalte = re => kopf.findIndex(c => re.test(klar(c.inhalt)));
        const sDatum = spalte(/datum/i), sRennen = spalte(/rennname|rennen/i), sSieger = spalte(/sieger/i);
        if (sDatum < 0 || sRennen < 0) continue;
        for (const r of z) {
            if (r === kopf || r.every(c => c.kopf) || !r[sDatum] || !r[sRennen]) continue;
            const d = datumDe(r[sDatum].inhalt, jahr);
            if (!d) continue;
            const l = links(r[sRennen].inhalt);
            const bericht = l.find(x => /\d{4}/.test(x.ziel));
            const klammer = (r[sRennen].inhalt.match(/\(([^()]*(?:\[\[[^\]]*\]\][^()]*)*)\)\s*$/) || [])[1] || '';
            const ortL = links(klammer)[0] || l.find(x => x !== bericht);
            const name = klar(teileOben(r[sRennen].inhalt, '<br')[0]).replace(/\s*\(.*$/, '');
            if (gesehen.has(d.datum + name)) continue;
            gesehen.add(d.datum + name);
            // Ohne Link (Strecke weiter oben schon verlinkt) gilt der Text als Artikeltitel; bei Streckenrennen
            // ("Brescia – Rom – Brescia") der Startort
            const ortText = klar(klammer) || (ortL ? ortL.text : '');
            aus.push({ name, bericht: bericht ? bericht.ziel : null, ort: ortL ? ortL.ziel : (ortText.split(/\s+[–-]\s+|-(?=[A-Z])/)[0] || null),
                ortText, ...d, sieger: sSieger >= 0 && r[sSieger] ? r[sSieger].inhalt : '' });
        }
    }
    return aus;
}

// Zwischenzeile im Schlussklassement → Status für die folgenden Zeilen
function statusAus(text) {
    const t = text.toLowerCase();
    if (/nicht gestartet|nicht angetreten/.test(t)) return 'DNS';
    if (/nicht qualifiziert|nicht vorqualifiziert/.test(t)) return 'DNQ';
    if (/disqualifiziert/.test(t)) return 'DSQ';
    if (/nicht klassiert|nicht klassifiziert|nicht gewertet/.test(t)) return 'NC';
    if (/ausgefallen|ausfall/.test(t)) return 'DNF';
    if (/reserve|meldeliste|zurückgezogen/.test(t)) return 'DNA';
    return null;
}
// Fahrerzelle → [{ fahrer, fahrerZiel }] (mehrere Fahrer je Wagen)
function fahrerAus(zelle) {
    return zelle.split(/<br\s*\/?>/i).map(teil => {
        const l = links(teil)[0], name = klar(teil);
        // Platzhalter für unbekannte Fahrer ("XXX", Rallye Wiesbaden 1963; "N. N.") sind keine Person
        return name && !/^(x{2,}|n\.?\s*n\.?|unbekannt|\?+)$/i.test(name) ?{ fahrer: l ? l.text : name, fahrerZiel: l ? l.ziel : null } : null;
    }).filter(Boolean);
}
// Rennbericht → { ort, feld: [{ pos, fahrer, fahrerZiel, team }] }
function berichtFeldDe(w) {
    const feld = [];
    const unter = [...w.matchAll(/\n(={2,4})\s*([^=\n]+?)\s*\1[ \t]*(?=\n)/g)];
    const ueberschriftVor = i => { let h = ''; for (const m of unter) if (m.index < i) h = m[2]; return h; };
    // Teils fehlt die Klammer "Ergebnisse"; die Unterabschnitte liegen sonst darin → jede Tabelle nur einmal
    const gelesen = new Set();
    for (const ab of abschnitte(w, /^(Ergebnisse?|Schlussklassement|Nur in der Meldeliste)$/i)) {
        const start = w.indexOf(ab);
        for (const t of tabellen(ab)) {
            const stelle = start + ab.indexOf(t);
            if (gelesen.has(stelle)) continue;
            gelesen.add(stelle);
            const titel = ueberschriftVor(stelle);
            if (/klassensieger|index|cup|wertung|nationen|renndaten/i.test(titel)) continue;
            const z = tabelle(t), kopf = z.find(r => r.length > 2 && r.filter(c => c.kopf).length >= 3);
            if (!kopf) continue;
            const spalte = re => kopf.findIndex(c => re.test(klar(c.inhalt)));
            const sPos = spalte(/^pos/i), sFahrer = spalte(/fahrer|pilot/i), sTeam = spalte(/team|bewerber/i);
            if (sFahrer < 0) continue;
            let status = /meldeliste/i.test(titel) ? 'DNA' : null;
            for (const r of z) {
                if (r === kopf) continue;
                if (r.every(c => c.kopf)) { const s = statusAus(klar(r[0].inhalt)); if (s) status = s; continue; }
                if (!r[sFahrer]) continue;
                const posText = sPos >= 0 && r[sPos] ? klar(r[sPos].inhalt) : '';
                const pos = status || (/^\d+$/.test(posText) ? posText : statusAus(posText) || '');
                const team = sTeam >= 0 && r[sTeam] ? klar(r[sTeam].inhalt) : '';
                for (const f of fahrerAus(r[sFahrer].inhalt)) feld.push({ pos, ...f, team });
            }
        }
    }
    const info = (w.match(/\|\s*(?:Strecke|Rennstrecke|Ort)\s*=([^\n]*)/i) || [])[1] || '';
    const ortL = links(info)[0];
    return { ort: ortL ? ortL.ziel : null, feld };
}

module.exports = { saisonZeilenDe, berichtFeldDe, datumDe };
