/* Gemeinsame Hilfen fuer die ZIELFLAGGE-Tests.
 *
 * FESTER ZUFALLSSAMEN
 * Die Tests tasteten bisher ZUFAELLIGE Rennen ab: in einem Lauf begegnen sich
 * zwei Wagen, im naechsten nicht, und dieselbe Pruefung war mal gruen und mal
 * rot. Das ist kein wackelnder Code, sondern eine wackelnde Stichprobe - und
 * die Versuchung, dagegen die Schwellen zu lockern, waere genau der falsche
 * Weg gewesen.
 *
 * Deshalb wird Math.random im Browser durch einen Generator mit festem Samen
 * ersetzt, BEVOR die Seite laedt (addInitScript laeuft vor jedem Skript der
 * Seite, auch nach page.reload). Damit faehrt jeder Lauf dasselbe Rennen, und
 * eine rote Pruefung heisst wirklich, dass sich etwas geaendert hat.
 *
 * Der Generator ist mulberry32: winzig, gut genug fuer Tests, und vor allem
 * ueberall identisch reproduzierbar.
 *
 * Fuer eine Verteilungsmessung (wie viele Rennen sehen anders aus?) nimmt man
 * verschiedene Samen - nicht den Zufall zurueck.
 */

/** Haengt einen festen Zufallssamen an die Seite. Vor page.goto aufrufen. */
async function festerZufall(page, samen) {
    await page.addInitScript((s) => {
        let a = s >>> 0;
        Math.random = function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }, samen >>> 0);
}

module.exports = { festerZufall };
