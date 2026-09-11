/* Vereinheitlicht ein Schema-JSON auf zwei Leerzeichen Einrueckung und LF.
 *
 *   node tools/format-schema-json.js schemas/functions.schema.json
 *
 * Warum: ConvertTo-Json formatiert je nach PowerShell-Version unterschiedlich.
 * 5.1 (das manage-v ueber powershell.exe startet) richtet die Schluessel
 * spaltenweise aus, 7 nimmt zwei Leerzeichen. Ohne diesen Schritt schreibt
 * jeder Wechsel zwischen beiden die ganze Datei um - 5000 Zeilen Diff fuer
 * eine geaenderte Zeilennummer. LF, weil .gitattributes eol=lf vorgibt.
 */
const fs = require('fs');
const ziel = process.argv[2];
if (!ziel) { console.error('Pfad fehlt.'); process.exit(1); }
const obj = JSON.parse(fs.readFileSync(ziel, 'utf8'));
const txt = JSON.stringify(obj, null, 2).split('\r\n').join('\n') + '\n';
fs.writeFileSync(ziel, txt, 'utf8');
