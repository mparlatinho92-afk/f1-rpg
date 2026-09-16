#!/usr/bin/env node
/**
 * befund-inventur.js — Stop-Hook fuer die Befund-Inventur (CLAUDE.md).
 *
 * Erinnert am Ende eines Tasks daran, gemessene Befunde INS REPO zu schreiben
 * statt nur in die Memory und die Commit-Nachricht. Nutzer-Ruege 16.09.2026:
 * „ja, all deine befunde über die memory hinaus notieren."
 *
 * Feuert bewusst NICHT bei jedem Stop — das waere Laerm und wuerde ignoriert.
 * Bedingung:
 *   in tests/ liegt uncommittete Arbeit   (= es wurde gemessen oder ein
 *                                            Messwerkzeug angefasst)
 *   UND keine der Befund-Dateien ist angefasst
 *                                          (= der Befund steht nirgends)
 *
 * Trifft damit genau den Moment vor dem Commit. Wer die Doku mitschreibt,
 * sieht die Meldung nie.
 *
 * ⚠ tests/output/ steht in .gitignore und taucht in `git status` nicht auf —
 *   die Bedingung haengt an den Werkzeugen (tests/*.js), nicht an den
 *   Messergebnissen.
 *
 * Gibt JSON auf stdout aus (systemMessage) oder gar nichts. Scheitert immer
 * still: ein Hook, der einen Task abbricht, ist schlimmer als ein vergessener
 * Eintrag.
 */
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function git(args) {
    return execSync('git ' + args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
}

try {
    const werkzeuge = git('status --porcelain -- tests/');
    if (!werkzeuge) process.exit(0);

    // Jeder dieser Orte zaehlt als „Befund notiert" — BEFUNDE.md ist der
    // Normalfall, CLAUDE.md nur fuer Regel/Zielwert, tests/README.md fuer die
    // Werkzeug-Benutzung.
    const doku = git('status --porcelain -- BEFUNDE.md CLAUDE.md tests/README.md zielflagge/BEFUNDE.md');
    if (doku) process.exit(0);   // Doku wurde mitgeschrieben, alles gut

    const zeilen = werkzeuge.split('\n').slice(0, 4).map(z => '  ' + z.trim());
    const mehr = werkzeuge.split('\n').length > 4 ? '\n  …' : '';

    console.log(JSON.stringify({
        systemMessage:
            'Befund-Inventur (CLAUDE.md): in tests/ liegt Arbeit, aber CLAUDE.md und '
            + 'tests/README.md sind unberuehrt:\n' + zeilen.join('\n') + mehr
            + '\n\nWurde gemessen? Dann gehoeren Zahl, Messfalle und '
            + 'NEGATIVERGEBNIS ins Repo — nicht nur in die Memory und die '
            + 'Commit-Nachricht. Ein Negativergebnis spart beim naechsten Mal '
            + 'einen ganzen Anlauf.'
    }));
} catch (e) {
    // kein Git-Repo, Git fehlt, sonstiger Fehler → still beenden
}
