#!/usr/bin/env node
// update-f1db.js – lädt neuestes f1db-json-splitted.zip und f1db-sql-mysql.zip von GitHub und entpackt sie

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_URL = 'https://api.github.com/repos/f1db/f1db/releases/latest';
const ASSETS = [
  { name: 'f1db-json-splitted.zip', dir: 'f1db-json-splitted' },
  { name: 'f1db-sql-mysql.zip',     dir: 'f1db-sql-mysql' }
];
const VERSION_FILE = path.join(__dirname, 'f1db-version.txt');
const LOG_FILE     = path.join(__dirname, 'f1db-update.log');

// --- Logging ---
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

// --- HTTP GET (folgt Weiterleitungen, prüft Status) ---
function get(url) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    https.get(
      { hostname: opts.hostname, path: opts.pathname + opts.search,
        headers: { 'User-Agent': 'f1-rpg-updater', 'Accept': 'application/vnd.github+json' } },
      res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          res.resume();
          return resolve(get(res.headers.location));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} bei ${url}`));
        }
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      }
    ).on('error', reject);
  });
}

// --- Datei herunterladen (folgt Weiterleitungen, prüft Status) ---
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const req = https.get(
      { hostname: opts.hostname, path: opts.pathname + opts.search,
        headers: { 'User-Agent': 'f1-rpg-updater' } },
      res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          res.resume();
          return resolve(download(res.headers.location, dest));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} beim Download von ${url}`));
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
        file.on('error', err => { try { fs.unlinkSync(dest); } catch (_) {} reject(err); });
      }
    );
    req.on('error', err => { try { fs.unlinkSync(dest); } catch (_) {} reject(err); });
  });
}

// --- Zielordner sauber leeren (verhindert Lock-/Reste-Probleme beim Entpacken) ---
function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

// --- ZIP entpacken via PowerShell, mit stderr-Logging ---
function unzip(zipPath, targetDir) {
  // Single-Quotes im Pfad gegen PowerShell-Injection escapen
  const psPath   = zipPath.replace(/'/g, "''");
  const psTarget = targetDir.replace(/'/g, "''");
  const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '${psPath}' -DestinationPath '${psTarget}' -Force"`;
  try {
    execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    const stderr = (err.stderr || '').toString().trim();
    const stdout = (err.stdout || '').toString().trim();
    const detail = stderr || stdout || err.message;
    throw new Error(detail);
  }
}

(async () => {
  const FORCE = process.argv.includes('--force');
  log(`=== F1DB Update gestartet${FORCE ? ' (--force)' : ''} ===`);

  // 1. Aktuelle Release-Info von GitHub holen
  log('Lade Release-Info von GitHub...');
  let release;
  try {
    release = JSON.parse(await get(API_URL));
  } catch (err) {
    log(`FEHLER beim Abrufen der Release-Info: ${err.message}`);
    process.exit(1);
  }

  const neueVersion = release.tag_name;
  log(`Neueste Version auf GitHub: ${neueVersion} (${release.published_at?.slice(0, 10)})`);

  // 2. Versionsvergleich – bereits aktuell? (mit --force ueberspringen)
  let lokaleVersion = '';
  if (fs.existsSync(VERSION_FILE)) {
    lokaleVersion = fs.readFileSync(VERSION_FILE, 'utf8').trim();
  }
  log(`Lokal installierte Version: ${lokaleVersion || '(keine)'}`);

  if (lokaleVersion === neueVersion && !FORCE) {
    log('Bereits aktuell – kein Download nötig.');
    log('=== Fertig ===');
    return;
  }
  if (lokaleVersion === neueVersion && FORCE) {
    log('Versionen identisch, aber --force aktiv → Download wird trotzdem durchgefuehrt.');
  }

  // 3. Assets herunterladen und entpacken
  let alleErfolgreich = true;

  for (const asset of ASSETS) {
    const assetInfo = release.assets.find(a => a.name === asset.name);
    if (!assetInfo) {
      log(`WARNUNG: Asset "${asset.name}" nicht in diesem Release gefunden – übersprungen.`);
      alleErfolgreich = false;
      continue;
    }

    const zipPath   = path.join(__dirname, asset.name);
    const targetDir = path.join(__dirname, asset.dir);

    // Download
    log(`Lade herunter: ${asset.name}...`);
    try {
      await download(assetInfo.browser_download_url, zipPath);
      log(`Gespeichert: ${zipPath}`);
    } catch (err) {
      log(`FEHLER beim Download von ${asset.name}: ${err.message}`);
      alleErfolgreich = false;
      continue;
    }

    // Zielordner leeren (verhindert Locks/Reste)
    try {
      cleanDir(targetDir);
    } catch (err) {
      log(`FEHLER beim Leeren von ${targetDir}: ${err.message}`);
      log('  Tipp: Ist eine Datei in dem Ordner gerade in Benutzung (Editor, DB-Tool, Browser)?');
      alleErfolgreich = false;
      continue;
    }

    // Entpacken
    log(`Entpacke nach ${targetDir}...`);
    try {
      unzip(zipPath, targetDir);
      log(`Entpackt: ${asset.dir}`);
      try { fs.unlinkSync(zipPath); log(`ZIP gelöscht: ${asset.name}`); }
      catch (e) { log(`WARNUNG: ZIP konnte nicht gelöscht werden: ${e.message}`); }
    } catch (err) {
      log(`FEHLER beim Entpacken von ${asset.name}: ${err.message}`);
      log(`  ZIP bleibt erhalten für späteren Retry: ${zipPath}`);
      alleErfolgreich = false;
    }
  }

  // 4. Version nur speichern, wenn ALLES geklappt hat
  if (alleErfolgreich) {
    fs.writeFileSync(VERSION_FILE, neueVersion, 'utf8');
    log(`Version gespeichert: ${neueVersion}`);
    log('=== Update abgeschlossen ===');
  } else {
    log(`Update unvollständig – Version NICHT gespeichert (bleibt: ${lokaleVersion || '(keine)'}).`);
    log('=== Beendet mit Fehlern ===');
    process.exit(2);
  }

})().catch(err => {
  log(`UNERWARTETER FEHLER: ${err.message}`);
  process.exit(1);
});
