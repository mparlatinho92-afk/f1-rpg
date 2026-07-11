// ============================================================================
// Paket 5 — Rivalitäts-/Duell-Texte inkl. Stufe B (Fable-Deliverable, 2026-07-11)
// ============================================================================
// Inline-fähig (Grundregel 4): direkt in index.html einbetten, KEIN data/*.js.
// Stufe A (eng/dominanz aus h2hSeason, augenhoehe aus reputation+WM) UND
// Stufe B (fehde aus getH2HHistory ~L8525, seit v0.9.14.62 verfügbar).
//
// Slot-Kontrakt (verbindlich für die Opus-Builder, Grundregel 5):
//   {driver}/{rival}  fertige Namen, NIE deklinieren.
//                     dominanz: {driver} ist IMMER der Führende — Opus tauscht
//                     beim Aufruf, egal auf wessen Profil die Card steht.
//   {h2hText}         fertige NOMINALPHRASE MIT ZAHLEN. Muss in genau drei
//                     Rahmen tragen (nur diese kommen in den Templates vor):
//                       a) nach Doppelpunkt/Gedankenstrich:  „– {h2hText}."
//                       b) „steht es {h2hText}"
//                       c) „mit {h2hText}"
//                     ✓ „9:9 in den Rennen", „12:3 in den Rennen", „28:25 in
//                        den Rennen", „nur vier Punkte Abstand in der Wertung"
//                     ✗ „in Qualifying und Rennen knapp vorn" (das SPEC-
//                        Beispiel ist KEIN Nominal — nicht bauen; gleiche
//                        Lehre wie {peakText} in Paket 3).
//                     augenhoehe (teamübergreifend, kein H2H-Store!): Opus
//                     baut {h2hText} aus der WM-Wertung (Abstands-Nominal).
//   {seasonsText}     NUR fehde: fertige Adverbialphrase im Akkusativ nach
//                     „über": „über drei gemeinsame Jahre" (Zahlwort, wie
//                     Paket 3). Quelle: getH2HHistory().seasons.
//
// Leitplanken (SPEC §3, in jeder Zeile eingehalten): NUR das sportliche Duell
// aus den State-Zahlen — keine erfundene Feindschaft, keine Off-Track-Dramen,
// keine Zitate, keine reale Historie. Saison läuft → keine Ausgangs-/Titel-
// Behauptungen. eng/augenhoehe/fehde neutral; nur dominanz hat Richtung.
//
// Determinismus (SPEC §4): Seed PAAR-symmetrisch (sortierte IDs) — beide
// Profile zeigen denselben Text. Referenz-Assembler unten.
// ============================================================================

const RIVALRY_BANK = {

    // ── ENG — ausgeglichenes Teamkollegen-Duell (Diff ≤2 bei ≥6 Duellen) ────
    eng: {
        e50: [
            'zwischen {driver} und {rival} passt kein Blatt Papier – {h2hText}, und niemand vermag zu sagen, wer am Ende vorn liegt.',
            'das teaminterne Duell zwischen {driver} und {rival} hält die Mannschaft in Atem: {h2hText}.',
            '{driver} gegen {rival} – ein Kräftemessen auf des Messers Schneide: {h2hText}.',
            'im eigenen Lager tobt der engste Kampf: {driver} und {rival} trennt fast nichts – {h2hText}.',
            'wenn zwei Piloten desselben Stalls sich nichts schenken, schaut das ganze Fahrerlager hin: {h2hText} zwischen {driver} und {rival}.'
        ],
        e62: [
            'das Duell zwischen {driver} und {rival} ist so eng, wie es teamintern nur sein kann: {h2hText}.',
            '{driver} und {rival} nehmen sich kaum etwas – {h2hText}.',
            'stallintern geht es eng zu: zwischen {driver} und {rival} steht es {h2hText}.',
            'kaum ein Wochenende, an dem zwischen {driver} und {rival} nicht neu gemischt wird – {h2hText}.',
            'die vielleicht engste Messlatte liegt im eigenen Team: {driver} gegen {rival}, {h2hText}.'
        ],
        e76: [
            'Stallduell auf Augenhöhe: {driver} gegen {rival} – {h2hText}, enger geht es kaum.',
            'im Team wird nichts verschenkt: {driver} und {rival} trennt so gut wie nichts – {h2hText}.',
            '{driver} oder {rival}? Die Frage stellt sich jedes Wochenende neu – {h2hText}.',
            'die Box hat ihr eigenes Duell: {driver} gegen {rival}, aktuell {h2hText}.',
            'wer die beiden vergleichen will, braucht die Lupe: {h2hText} zwischen {driver} und {rival}.'
        ],
        e94: [
            'das teaminterne Duell ist statistisch ein Patt: {driver} gegen {rival}, {h2hText}.',
            '{driver} und {rival} liefern sich ein Duell auf Messers Schneide – {h2hText}.',
            'die Datenlage zwischen {driver} und {rival} ist so ausgeglichen wie selten: {h2hText}.',
            'im Team entscheidet aktuell die Tagesform: zwischen {driver} und {rival} steht es {h2hText}.',
            'kein klarer Erster im eigenen Haus: {driver} und {rival} trennt fast nichts – {h2hText}.'
        ],
        e10: [
            'teamintern herrscht Patt-Stimmung: {driver} vs. {rival} – {h2hText}.',
            'das engste Duell fährt im selben Auto: {driver} gegen {rival}, {h2hText}.',
            '{driver} und {rival} schenken sich nichts – {h2hText}, Ausgang offen.',
            'Stallduell mit offenem Visier: zwischen {driver} und {rival} steht es {h2hText}.',
            'wer hier die Team-Hierarchie sucht, sucht vergebens: {driver} gegen {rival}, {h2hText}.'
        ]
    },

    // ── DOMINANZ — {driver} = der Führende (Kontrakt oben!) ─────────────────
    dominanz: {
        e50: [
            'im teaminternen Vergleich gibt {driver} den Ton an: {h2hText} gegen {rival} – die Bilanz spricht eine deutliche Sprache.',
            'das Stallduell hat einen klaren Herrn: {driver} hält {rival} mit {h2hText} auf Distanz.',
            'zwischen {driver} und {rival} ist die Rangordnung derzeit eindeutig – {h2hText}.',
            '{rival} beißt sich am eigenen Teamkollegen die Zähne aus: {driver} führt das Duell mit {h2hText} an.',
            'wer wissen will, wer im Team den Maßstab setzt, schaue auf die Bilanz: {driver} vor {rival}, {h2hText}.'
        ],
        e62: [
            'das teaminterne Duell verläuft einseitig: {driver} führt gegen {rival} mit {h2hText}.',
            '{driver} hat die Verhältnisse im Team geklärt – {h2hText} gegen {rival}.',
            'gegen den eigenen Teamkollegen findet {rival} derzeit kein Mittel: {driver} liegt mit {h2hText} vorn.',
            'die Bilanz lässt wenig Raum für Diskussionen: {driver} gegen {rival}, {h2hText}.',
            'im direkten Vergleich hat {driver} klar die Oberhand – {h2hText}.'
        ],
        e76: [
            'klare Ansage im eigenen Team: {driver} distanziert {rival} mit {h2hText}.',
            'das Stallduell? Momentan keines: {driver} dominiert gegen {rival} – {h2hText}.',
            '{rival} kommt an seinem Teamkollegen einfach nicht vorbei: {h2hText} für {driver}.',
            'im Team gibt es derzeit nur eine Richtung – {driver} vor {rival}, {h2hText}.',
            'die nackten Zahlen sind deutlich: {driver} führt das interne Duell mit {h2hText} an.'
        ],
        e94: [
            'die Statistik im Teamduell ist eindeutig: {driver} führt gegen {rival} mit {h2hText}.',
            '{driver} hat das interne Duell klar im Griff – {h2hText} gegen {rival}.',
            'für {rival} ist der eigene Teamkollege derzeit die höchste Hürde: {h2hText} für {driver}.',
            'wer die Team-Hierarchie sucht, findet sie in der Bilanz: {driver} vor {rival}, {h2hText}.',
            'im direkten Vergleich setzt {driver} derzeit den Maßstab: {h2hText}.'
        ],
        e10: [
            'das Teamduell hat eine klare Nummer eins: {driver} führt gegen {rival} mit {h2hText}.',
            '{driver} dominiert den internen Vergleich – {h2hText} gegen {rival}.',
            'Benchmark im eigenen Haus: an {driver} ist für {rival} derzeit kein Vorbeikommen – {h2hText}.',
            'die Zahlen im Stallduell sprechen für sich: {driver} vor {rival}, {h2hText}.',
            '{rival} sucht noch nach Antworten auf den Mann in der anderen Garagenhälfte: {h2hText} für {driver}.'
        ]
    },

    // ── AUGENHOEHE — Topfahrer-Duell, teamübergreifend ──────────────────────
    // ({h2hText} = WM-Abstands-Nominal, s. Kontrakt — es gibt keinen H2H-Store
    //  für Nicht-Teamkollegen!)
    augenhoehe: {
        e50: [
            '{driver} und {rival} – zwei Namen, die derzeit über den anderen stehen und einander nichts schenken: {h2hText}.',
            'wenn {driver} und {rival} aufeinandertreffen, hält der Grand-Prix-Sport den Atem an – {h2hText}.',
            'ein Duell, wie es das Publikum liebt: {driver} gegen {rival}, Größe gegen Größe – {h2hText}.',
            'die Ehre der Ersten wird derzeit zwischen {driver} und {rival} verhandelt – {h2hText}.',
            '{driver} oder {rival}? An dieser Frage scheiden sich derzeit die Geister an den Strecken – {h2hText}.'
        ],
        e62: [
            'das Duell der Besten: {driver} gegen {rival} – {h2hText}.',
            '{driver} und {rival} fahren derzeit in einer eigenen Sphäre – und gegeneinander: {h2hText}.',
            'zwei Spitzenfahrer, ein Ziel: zwischen {driver} und {rival} entscheidet sich derzeit vieles – {h2hText}.',
            'wo {driver} ist, ist {rival} selten weit – {h2hText}.',
            'die Saison hat ihr großes Duell gefunden: {driver} gegen {rival}, {h2hText}.'
        ],
        e76: [
            'das große Duell dieser Tage: {driver} gegen {rival} – {h2hText}.',
            '{driver} und {rival} liefern sich einen Schlagabtausch der Extraklasse: {h2hText}.',
            'zwei Alphatiere, eine Spitze: {driver} gegen {rival} elektrisiert das Publikum – {h2hText}.',
            'wenn diese beiden auf derselben Strecke stehen, gibt es keine Nebenschauplätze: {driver} gegen {rival}, {h2hText}.',
            'die Frage des Jahres lautet {driver} oder {rival} – {h2hText}.'
        ],
        e94: [
            'das Topduell der Saison: {driver} gegen {rival} – {h2hText}.',
            '{driver} und {rival} trennen Nuancen, keine Klassen: {h2hText}.',
            'zwei Fahrer definieren derzeit die Spitze – {driver} und {rival}, {h2hText}.',
            'im Kampf um die Spitze schenken sich {driver} und {rival} nichts – {h2hText}.',
            'die Bestenliste hat aktuell zwei Namen: {driver} und {rival} – {h2hText}.'
        ],
        e10: [
            'das Duell, auf das alle schauen: {driver} gegen {rival} – {h2hText}.',
            '{driver} vs. {rival} ist DAS Duell dieser Saison – {h2hText}.',
            'zwei Ausnahmekönner, kaum Luft dazwischen: {driver} und {rival}, {h2hText}.',
            'Spitzenkampf pur: {driver} gegen {rival} – {h2hText}.',
            'wenn {driver} und {rival} aufeinandertreffen, wird jedes Duell zum Hauptereignis – {h2hText}.'
        ]
    },

    // ── FEHDE — Stufe B: mehrjähriges Teamkollegen-Duell (getH2HHistory) ────
    // Richtungs-neutral (die Zahlen in {h2hText} sprechen); „dieselbe Box" ist
    // korrekt — der H2H-Store existiert nur für Teamkollegen-Paare.
    fehde: {
        e50: [
            'was {driver} und {rival} verbindet, ist mehr als eine Saison: {seasonsText} messen sich die beiden nun schon – {h2hText}.',
            'dieses Duell hat Geschichte: {driver} und {rival} kennen einander {seasonsText} – die Bilanz: {h2hText}.',
            'alte Bekannte: {seasonsText} teilen sich {driver} und {rival} nun schon dieselbe Box – {h2hText}.',
            'manche Duelle überdauern die Jahre: {driver} gegen {rival}, ausgetragen {seasonsText} – {h2hText}.',
            'im Fahrerlager kennt man dieses Kräftemessen längst: {driver} und {rival}, Seite an Seite und doch gegeneinander, {seasonsText} – {h2hText}.'
        ],
        e62: [
            'das Duell {driver} gegen {rival} läuft nun schon {seasonsText} – {h2hText}.',
            'zwei, die sich kennen wie sonst niemand im Feld: {driver} und {rival}, Teamkollegen {seasonsText} – {h2hText}.',
            'aus Rennen wurde Routine, aus Routine Rivalität: {driver} und {rival} messen sich {seasonsText} – {h2hText}.',
            'die Akte {driver} gegen {rival} füllt sich {seasonsText}: {h2hText}.',
            'kaum ein internes Duell hat mehr Kapitel: {driver} und {rival}, {seasonsText} – {h2hText}.'
        ],
        e76: [
            'diese Rivalität hat Patina: {driver} gegen {rival}, {seasonsText} – {h2hText}.',
            '{seasonsText} teilen sich {driver} und {rival} nun schon die Garage – der Zwischenstand: {h2hText}.',
            'was als Stallduell begann, ist längst ein Dauerbrenner: {driver} gegen {rival}, {seasonsText} – {h2hText}.',
            'im Team kennt jeder diese Konstellation: {driver} und {rival}, aneinander gemessen {seasonsText} – {h2hText}.',
            'zwei Teamkollegen, eine lange Geschichte: {seasonsText} läuft dieses Duell nun – {h2hText}.'
        ],
        e94: [
            'dieses Duell hat eine eigene Statistik-Seite verdient: {driver} gegen {rival}, {seasonsText} – {h2hText}.',
            'die Langzeit-Bilanz spricht Bände: {driver} und {rival} messen sich {seasonsText} – {h2hText}.',
            'kaum zwei Fahrer kennen die Daten des anderen besser: {driver} und {rival}, Teamkollegen {seasonsText} – {h2hText}.',
            'ein Duell mit Historie: {seasonsText} vergleichen sich {driver} und {rival} nun im selben Material – {h2hText}.',
            'im Archiv dieses Teams füllt das Duell zwischen {driver} und {rival} ganze Ordner: {seasonsText}, {h2hText}.'
        ],
        e10: [
            'dieses Stallduell ist ein Dauerbrenner: {driver} gegen {rival}, {seasonsText} – {h2hText}.',
            '{driver} und {rival} kennen jede Stärke und jede Schwäche des anderen – {seasonsText} im selben Team, {h2hText}.',
            'die Langzeit-Rivalität im eigenen Haus: {seasonsText} messen sich {driver} und {rival} nun schon – {h2hText}.',
            'kaum ein Duell hat mehr Datenpunkte: {driver} gegen {rival}, {seasonsText} – {h2hText}.',
            'manche Paarungen halten länger als andere: {driver} und {rival}, {seasonsText} – {h2hText}.'
        ]
    }
};

// ============================================================================
// Referenz-Assembler (SPEC-Deliverable) — nutzt _recapRng/_recapHash/_recapPick/
// _recapFill aus index.html. Gibt EINE fertige Zeile (1–2 Sätze) zurück.
//
//   drv/rival  Fahrer-Objekte ({id}, {name}); bei dominanz ist drv der Führende
//   ctx = { type: 'eng'|'dominanz'|'augenhoehe'|'fehde',
//           h2hText, seasonsText (nur fehde), year }
//
// Seed PAAR-symmetrisch: 'rivalry|' + sortierte IDs + '|' + year → das Duell
// liest sich auf beiden Profilen identisch (SPEC §4).
// fehde ohne {seasonsText} → automatischer Fallback auf 'eng' (nie Leer-Slot).
// ============================================================================
function rivalryText(drv, rival, ctx) {
    if (!drv || !rival || !drv.name || !rival.name) return '';
    ctx = ctx || {};
    let type = RIVALRY_BANK[ctx.type] ? ctx.type : 'eng';
    if (type === 'fehde' && !ctx.seasonsText) type = 'eng';
    if (!ctx.h2hText) return '';   // ohne Zahlen-Phrase keine Aussage (Leitplanke §3)

    const year = ctx.year || (typeof GAME_STATE !== 'undefined' ? GAME_STATE.currentYear : 2000);
    const era = year < 1962 ? 'e50' : year < 1976 ? 'e62' : year < 1994 ? 'e76' : year < 2010 ? 'e94' : 'e10';

    const idA = String(drv.id), idB = String(rival.id);
    const pairKey = idA < idB ? idA + '|' + idB : idB + '|' + idA;
    const rng = _recapRng(_recapHash(`rivalry|${pairKey}|${year}`));
    const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

    const T = {
        driver: drv.name, rival: rival.name,
        h2hText: ctx.h2hText, seasonsText: ctx.seasonsText || ''
    };
    return cap(_recapFill(_recapPick(rng, RIVALRY_BANK[type][era]), T));
}

// ============================================================================
// Testfälle (SPEC §7) — je Typ e76 + e10, {h2hText} typgerecht gefüllt
// ============================================================================
// eng        e76  h2hText='7:6 in den Rennen'
//   → „Stallduell auf Augenhöhe: Keller gegen Roth – 7:6 in den Rennen, enger geht es kaum."
// eng        e10  h2hText='9:9 in den Rennen'
//   → „Teamintern herrscht Patt-Stimmung: Keller vs. Roth – 9:9 in den Rennen."
// dominanz   e76  h2hText='11:2 in den Rennen'   (Keller = Führender)
//   → „Klare Ansage im eigenen Team: Keller distanziert Roth mit 11:2 in den Rennen."
// dominanz   e10  h2hText='14:3 im Qualifying'
//   → „Das Teamduell hat eine klare Nummer eins: Keller führt gegen Roth mit 14:3 im Qualifying."
// augenhoehe e76  h2hText='nur vier Punkte Abstand in der Wertung'
//   → „Das große Duell dieser Tage: Keller gegen Roth – nur vier Punkte Abstand in der Wertung."
// augenhoehe e10  h2hText='nur zwei Punkte Abstand in der Wertung'
//   → „Das Duell, auf das alle schauen: Keller gegen Roth – nur zwei Punkte Abstand in der Wertung."
// fehde      e76  h2hText='28:25 in den Rennen', seasonsText='über drei gemeinsame Jahre'
//   → „Diese Rivalität hat Patina: Keller gegen Roth, über drei gemeinsame Jahre – 28:25 in den Rennen."
// fehde      e10  h2hText='31:29 in den Rennen', seasonsText='über vier gemeinsame Jahre'
//   → „Dieses Stallduell ist ein Dauerbrenner: Keller gegen Roth, über vier gemeinsame Jahre – 31:29 in den Rennen."
// ============================================================================
