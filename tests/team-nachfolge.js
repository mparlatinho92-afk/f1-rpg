/**
 * team-nachfolge.js — Umbenennungen realer Konstrukteure (F1DB-IDs), 28.09.2026
 *
 * Im Spiel behaelt ein umbenanntes Team seine ID (CONSTRUCTOR_SUCCESSION in index.html), in F1DB
 * ist BAR→Honda ein Konstrukteurswechsel. Reale Messungen, die Teamwechsel zaehlen, muessen die
 * Paare als dasselbe Team werten — sonst zaehlt die Realitaet Umbenennungen als Wechsel.
 * Genutzt von markt-real.js und markt-ab.js. Liste parallel zu CONSTRUCTOR_SUCCESSION halten.
 */
'use strict';
const NACHFOLGE = new Set(('tyrrell>bar bar>honda honda>brawn brawn>mercedes jordan>midland midland>spyker spyker>force-india ' +
    'force-india>racing-point racing-point>aston-martin stewart>jaguar jaguar>red-bull minardi>toro-rosso toro-rosso>alphatauri ' +
    'alphatauri>rb rb>racing-bulls toleman>benetton benetton>renault renault>lotus-f1 lotus-f1>renault renault>alpine ' +
    'sauber>bmw-sauber bmw-sauber>sauber sauber>alfa-romeo alfa-romeo>kick-sauber ligier>prost osella>fondmetal ' +
    'virgin>marussia marussia>manor arrows>footwork footwork>arrows march>leyton-house leyton-house>march lotus-racing>caterham').split(' '));
const gleichesTeam = (alt, neu) => alt === neu || NACHFOLGE.has(alt + '>' + neu);
module.exports = { NACHFOLGE, gleichesTeam };
