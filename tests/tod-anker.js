#!/usr/bin/env node
/**
 * tod-anker.js — Kandidaten für die realen Todes-Anker AUSSERHALB der WM.
 *
 * F1DB kennt Todesdaten, aber keine Ursachen. Das Skript listet Fahrer, die zwischen
 * ihrem ersten WM-Einsatz und dem letzten Einsatz + 1 Jahr gestorben sind, ohne die
 * WM-Toten (reasonRetired „Fatal …"), getrennt nach F1-Fahrern und reinen
 * Indy-500-Fahrern (1950–60), mit Namen je Dekade.
 * ⚠ Das ist eine OBERGRENZE: Krankheit, Straßen- und Flugunfälle stecken mit drin und
 *   müssen von Hand abgezogen werden. Die Zuordnung vom 23.09.2026 steht mit Namen in
 *   BEFUNDE.md („Todesfälle je Ebene neu abgeglichen") und liefert die Anker in
 *   tests/death-era-mc.js (F1 außerhalb 12/13/7/4, Indy außerhalb ~22).
 *
 * Aufruf: node tests/tod-anker.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const DB = path.join(__dirname, '..', 'f1db-json-splitted');
const L = f => JSON.parse(fs.readFileSync(path.join(DB, f), 'utf8'));
const fahrer = L('f1db-drivers.json'), rr = L('f1db-races-race-results.json'), races = L('f1db-races.json');
const indy = new Set(races.filter(x => x.circuitId === 'indianapolis' && x.year <= 1960).map(x => x.id));

const jahre = {}, nurIndy = {};
for (const x of rr) {
    const j = jahre[x.driverId] = jahre[x.driverId] || { min: 9999, max: 0 };
    j.min = Math.min(j.min, x.year); j.max = Math.max(j.max, x.year);
    if (!indy.has(x.raceId)) nurIndy[x.driverId] = false;
    else if (nurIndy[x.driverId] === undefined) nurIndy[x.driverId] = true;
}
const wmTot = new Set(rr.filter(x => /^fatal/i.test(x.reasonRetired || '')).map(x => x.driverId));
const namen = { f1: {}, indy: {} };
for (const d of fahrer) {
    if (!d.dateOfDeath || !jahre[d.id]) continue;
    const y = +d.dateOfDeath.slice(0, 4), j = jahre[d.id];
    if (y < j.min || y > j.max + 1 || wmTot.has(d.id)) continue;
    const k = nurIndy[d.id] ? 'indy' : 'f1', dek = Math.floor(y / 10) * 10;
    (namen[k][dek] = namen[k][dek] || []).push(d.name + ' ' + d.dateOfDeath);
}
for (const k of ['f1', 'indy']) {
    console.log(k === 'f1' ? '\nF1-Fahrer (ohne WM-Tote):' : '\nReine Indy-500-Fahrer:');
    for (const [dek, l] of Object.entries(namen[k])) console.log('  ' + dek + 'er (' + l.length + '): ' + l.join(', '));
}
