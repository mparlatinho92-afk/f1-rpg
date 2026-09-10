/**
 * test-auswahl.js — steht bei einer Lieferung nur das qualifizierte Feld zur Wahl?
 *
 *   node zielflagge/test-auswahl.js
 *
 * Wer im Rennen sitzt, ist bei einer Lieferung laengst entschieden: das RPG hat
 * Training, Qualifying und Rennen in einem Zug gerechnet, bevor ZIELFLAGGE
 * startet. Zur Auswahl duerfen deshalb NUR die Qualifizierten stehen - einen
 * Nichtqualifizierten zu fahren hiesse, ein Rennen zu fahren, das es nie gab.
 *
 * Frueher liess ZIELFLAGGE aus dem ganzen Kader waehlen und schob einen
 * Nichtqualifizierten notfalls auf den letzten Startplatz (state.playerWasDnq).
 * Das ist ohne Lieferung richtig (dort wuerfelt ZIELFLAGGE das Qualifying selbst)
 * und MIT Lieferung falsch.
 */
'use strict';
process.env.SIMCORE_FROM_INDEX = '1';
const path = require('path');

(async () => {
    const { getContext } = require('../tests/sim-core');
    const ctx = getContext();
    ctx.initFromYear(1988);
    const lief = ctx.window.baueZielflaggeLieferung(0);
    const rennen = JSON.parse(lief.text.split('\n').filter(Boolean)[2]);
    const starter = rennen.results.length;

    const { chromium } = require('playwright');
    const b = await chromium.launch();
    const p = await b.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file:///' + path.join(__dirname, 'index.html').replace(/\\/g, '/'),
        { waitUntil: 'load' });
    await p.waitForTimeout(900);

    const r = await p.evaluate(txt => {
        applyImportResult(parseImportedText(txt));
        const sel = document.getElementById('player-select');
        const optionen = [...sel.options].map(o => o.value);
        const texte = [...sel.options].slice(0, 3).map(o => o.textContent);
        const hint = document.getElementById('player-select-hint').textContent;
        const drin = new Set((state.lieferung.results || []).map(x => x.driver));
        const nichtQualiInListe = optionen.filter(id => !drin.has(id)).length;
        const dnqId = DRIVERS.map(d => d.id).find(id => !drin.has(id));
        let abgelehnt = null;
        if (dnqId) {
            state.playerDriverId = dnqId;
            state.grid = null;
            try { startRace(); } catch (e) { }
            abgelehnt = !state.grid;
        }
        return {
            anzahl: optionen.length, nichtQualiInListe, hint, texte,
            dnqVersuch: !!dnqId, abgelehnt, gesamtKader: DRIVERS.length
        };
    }, lief.text);
    await b.close();

    console.log('Starter laut Lieferung : ' + starter);
    console.log('Kader gesamt           : ' + r.gesamtKader);
    console.log('Auswahl zeigt          : ' + r.anzahl + ' Fahrer');
    console.log('davon nicht qualifiz.  : ' + r.nichtQualiInListe);
    console.log('Hinweis                : ' + r.hint);
    console.log('erste Eintraege        : ' + r.texte.join('  |  '));
    console.log('DNQ-Fahrer abgelehnt   : ' + (r.dnqVersuch ? (r.abgelehnt ? 'ja' : 'NEIN') : 'kein DNQ vorhanden'));
    console.log('Skriptfehler           : ' + (errs.length ? errs.join(' | ') : 'keine'));

    const gut = r.nichtQualiInListe === 0 && r.anzahl === starter
        && (!r.dnqVersuch || r.abgelehnt) && !errs.length;
    console.log('');
    console.log(gut
        ? 'GRUEN - nur qualifizierte Fahrer stehen zur Wahl.'
        : 'FEHLGESCHLAGEN');
    process.exit(gut ? 0 : 1);
})();
