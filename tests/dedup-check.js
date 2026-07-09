/**
 * dedup-check.js
 * Findet potenzielle Duplikat-Slugs in den pre-1950-Scraped-Daten.
 *
 * Strategie:
 *   1. Alle Slugs + Originalnamen sammeln (mit Auftrittsfrequenz)
 *   2. Kurze Slugs (einzelnes Wort ODER Initial-Nachname) gegen vollständige matchen
 *   3. Fuzzy-Match (Levenshtein ≤ 2) als Fallback
 *   4. Vorschläge nach Confidence sortieren ausgeben
 *
 * Ausführen: node tests/dedup-check.js
 * Bestätigte Aliases → in SLUG_ALIASES von scrape-goldenera-full.js + calculate-elo.js eintragen
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const PRE50_DIR = path.join(__dirname, 'pre1950-data');

// ── Levenshtein-Distanz ───────────────────────────────────────────────────
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({length: m+1}, (_, i) =>
        Array.from({length: n+1}, (_, j) => i === 0 ? j : j === 0 ? i : 0)
    );
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i-1] === b[j-1]
                ? dp[i-1][j-1]
                : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
}

// ── Daten laden ───────────────────────────────────────────────────────────
function loadAllSlugs() {
    const slugMeta = new Map(); // slug -> { names: Set, count: int, sources: Set }

    for (let y = 1930; y <= 1949; y++) {
        for (const prefix of ['full', 'silhouet', 'temporada']) {
            const fp = path.join(PRE50_DIR, `${prefix}-${y}.json`);
            if (!fs.existsSync(fp)) continue;
            const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
            for (const race of data.races) {
                for (const e of (race.entries || [])) {
                    if (!e.driverSlug) continue;
                    if (!slugMeta.has(e.driverSlug)) {
                        slugMeta.set(e.driverSlug, { names: new Set(), count: 0, sources: new Set() });
                    }
                    const m = slugMeta.get(e.driverSlug);
                    m.names.add(e.driver);
                    m.count++;
                    m.sources.add(prefix);
                }
            }
        }
    }
    return slugMeta;
}

// ── Slug-Analyse ──────────────────────────────────────────────────────────
function classifySlug(slug) {
    const parts = slug.split('-');
    if (parts.length === 1) return { type: 'lastname', lastname: slug, initial: null };
    if (parts.length === 2 && parts[0].length === 1) return { type: 'initial', lastname: parts[1], initial: parts[0] };
    // Mehr als 2 Teile oder 2 Teile ohne Initial-Muster → vollständig
    return { type: 'full', lastname: parts[parts.length - 1], initial: parts[0][0] };
}

// ── Matching ─────────────────────────────────────────────────────────────
function findCandidates(shortSlug, shortClass, allFull) {
    const candidates = [];

    for (const fullSlug of allFull) {
        const fullClass = classifySlug(fullSlug);

        // 1. Exakter Nachname-Match
        if (fullClass.lastname === shortClass.lastname) {
            let confidence = 80;
            // Initial stimmt auch überein → noch sicherer
            if (shortClass.initial && fullClass.initial === shortClass.initial) confidence = 95;
            else if (shortClass.initial && fullClass.initial !== shortClass.initial) confidence = 30; // Initial-Konflikt → unwahrscheinlich
            candidates.push({ slug: fullSlug, confidence, reason: 'lastname-match' });
            continue;
        }

        // 2. Nachname ist Suffix des vollständigen Slugs
        if (fullSlug.endsWith('-' + shortClass.lastname)) {
            let confidence = 75;
            if (shortClass.initial && fullSlug.split('-')[0][0] === shortClass.initial) confidence = 93;
            candidates.push({ slug: fullSlug, confidence, reason: 'suffix-match' });
            continue;
        }

        // 3. Fuzzy auf Nachname (Levenshtein ≤ 2, min. 4 Zeichen)
        if (shortClass.lastname.length >= 4) {
            const dist = levenshtein(shortClass.lastname, fullClass.lastname);
            if (dist === 1) {
                const confidence = shortClass.initial && fullClass.initial === shortClass.initial ? 60 : 40;
                candidates.push({ slug: fullSlug, confidence, reason: `fuzzy-lev${dist}` });
            }
        }
    }

    // Besten Kandidaten zuerst
    return candidates.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

// ── Hauptprogramm ─────────────────────────────────────────────────────────
function main() {
    console.log('Lade pre-1950 Daten …\n');
    const slugMeta = loadAllSlugs();

    // Trennen in kurze (potenzielle Duplikate) und vollständige
    const shortSlugs = [];
    const fullSlugs  = [];

    for (const [slug] of slugMeta) {
        const cls = classifySlug(slug);
        if (cls.type === 'full') fullSlugs.push(slug);
        else shortSlugs.push(slug);
    }

    console.log(`Vollständige Slugs: ${fullSlugs.length}`);
    console.log(`Kurze/Abgekürzte Slugs: ${shortSlugs.length}`);
    console.log(`\n${'─'.repeat(70)}`);

    const proposals = [];

    for (const short of shortSlugs) {
        const meta  = slugMeta.get(short);
        const cls   = classifySlug(short);
        const candidates = findCandidates(short, cls, fullSlugs);

        if (candidates.length === 0) continue;

        // Nur ausgeben wenn bester Kandidat ≥ 50% Confidence
        if (candidates[0].confidence < 50) continue;

        proposals.push({
            short,
            names: [...meta.names],
            count: meta.count,
            sources: [...meta.sources],
            candidates,
        });
    }

    // Sortieren: höchste Confidence zuerst, dann nach Häufigkeit
    proposals.sort((a, b) =>
        b.candidates[0].confidence - a.candidates[0].confidence ||
        b.count - a.count
    );

    // Ausgabe
    const high   = proposals.filter(p => p.candidates[0].confidence >= 80);
    const medium = proposals.filter(p => p.candidates[0].confidence >= 60 && p.candidates[0].confidence < 80);
    const low    = proposals.filter(p => p.candidates[0].confidence < 60);

    function printGroup(label, list) {
        if (list.length === 0) return;
        console.log(`\n${label} (${list.length})`);
        console.log('─'.repeat(70));
        for (const p of list) {
            const nameStr = p.names.map(n => `"${n}"`).join(', ');
            console.log(`  ${p.short.padEnd(30)} (${p.count}×, src: ${p.sources.join('+')})`);
            console.log(`    Originalname(n): ${nameStr}`);
            for (const c of p.candidates) {
                const marker = c === p.candidates[0] ? '→' : '  ';
                console.log(`    ${marker} [${String(c.confidence).padStart(3)}%] ${c.slug}  (${c.reason})`);
            }
        }
    }

    printGroup('HOCH (≥ 80% – wahrscheinlich dasselbe)', high);
    printGroup('MITTEL (60–79% – prüfen)', medium);
    printGroup('NIEDRIG (50–59% – unklar)', low);

    // Keine Kandidaten gefunden
    const unmatched = shortSlugs.filter(s => !proposals.find(p => p.short === s));
    if (unmatched.length > 0) {
        console.log(`\nOHNE KANDIDATEN (${unmatched.length}) – wahrscheinlich echte Einzelspieler oder sehr seltene Namen`);
        console.log('─'.repeat(70));
        unmatched.forEach(s => {
            const meta = slugMeta.get(s);
            const nameStr = [...meta.names].map(n => `"${n}"`).join(', ');
            console.log(`  ${s.padEnd(30)} (${meta.count}×) → ${nameStr}`);
        });
    }

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`Gesamt: ${proposals.length} Vorschläge (${high.length} hoch, ${medium.length} mittel, ${low.length} niedrig)`);
    console.log(`Keine Kandidaten: ${unmatched.length}`);
    console.log('\nBestätigte Aliases → SLUG_ALIASES in scrape-goldenera-full.js + calculate-elo.js eintragen');
}

main();
