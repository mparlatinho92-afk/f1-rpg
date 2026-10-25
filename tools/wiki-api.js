/**
 * wiki-api.js — gemeinsamer Abruf über die MediaWiki-API für die Rennkalender-Quellen
 * (wiki-nwm-holen.js: en.wikipedia, wiki-sportwagen-holen.js: de.wikipedia).
 *
 * Pakete mit mehreren Titeln je Abfrage, 1,5 s Pause je Paket. HTTP 429 (Drosselung): nach 30 s dasselbe
 * Paket noch einmal, höchstens 5 Versuche. Artikeltext in Paketen zu 10 holen: die API kürzt große
 * Antworten sonst still (Befund aus tools/wiki-rennberichte.js). Koordinaten nur mit colimit=max
 * vollständig (ohne: 10 je Abfrage).
 */
'use strict';
const pause = ms => new Promise(r => setTimeout(r, ms));
const KOPF = { headers: { 'User-Agent': 'F1-RPG-Rennkalender/1.0 (private Auswertung, Einzelprojekt)' } };
const TEXT = '&prop=revisions&rvprop=content&rvslots=main';
const KOORD = '&prop=coordinates&coprimary=primary&colimit=max';

function wikiApi(sprache, sichern) {
    const API = `https://${sprache}.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1`;
    // Ein Paket Titel abfragen; liefert Map ursprünglicher Titel → Seite (nach Normalisierung und Weiterleitung)
    async function paket(titel, prop) {
        const res = await fetch(API + prop + '&titles=' + encodeURIComponent(titel.join('|')), KOPF);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const j = await res.json();
        const seiten = new Map((j.query.pages || []).map(s => [s.title, s]));
        const ziel = t => {
            for (const n of (j.query.normalized || [])) if (n.from === t) t = n.to;
            for (const r of (j.query.redirects || [])) if (r.from === t) t = r.to;
            return t;
        };
        return new Map(titel.map(t => [t, seiten.get(ziel(t))]));
    }
    async function holeAlle(titel, groesse, prop, ablegen, name) {
        let versuche = 0;
        for (let i = 0; i < titel.length; i += groesse) {
            const teil = titel.slice(i, i + groesse);
            try { for (const [t, s] of await paket(teil, prop)) ablegen(t, s); }
            catch (e) {
                versuche++;
                console.log(name, 'Paket', i / groesse + 1, e.message, versuche < 5 ? '— neuer Versuch in 30 s' : '— übersprungen');
                if (versuche < 5) { i -= groesse; await pause(30000); } else versuche = 0;
                continue;
            }
            versuche = 0;
            sichern();
            console.log(name, Math.min(i + groesse, titel.length), '/', titel.length);
            await pause(1500);
        }
    }
    return { holeAlle };
}
const text = s => s && !s.missing && s.revisions ? s.revisions[0].slots.main.content : null;
const koord = s => { const c = s && s.coordinates && s.coordinates[0]; return c ? [c.lat, c.lon] : null; };

module.exports = { wikiApi, text, koord, TEXT, KOORD };
