// ============================================================================
// Paket 6 — Fiktive Team- & Sponsornamen (Fable-Deliverable, 2026-07-11)
// ============================================================================
// Inline-fähig (Grundregel 4). Löst die Interim-Bausteine _RANDOM_TEAM_BASE/
// _RANDOM_TEAM_SUFFIX (~L9470) im Zufallsteam-Button ab; derselbe Pool dient
// einem künftigen generateTeam()/Privateer-Generator (SPEC §0 Stufe 1).
//
// STRUKTUR-ENTSCHEIDUNG (Abweichung von der SPEC-Skizze, nötig):
// Die SPEC nennt „constructorSuffix", listet aber Präfix-Muster („Écurie …",
// „Automobili …"). Deshalb sind die Einträge TEMPLATES mit {name}-Slot —
// der Komponierer füllt den Gründer-Nachnamen ein, die Position ist frei:
//   'Écurie {name}'  →  „Écurie Marchand"
//   '{name} Racing'  →  „Hartley Racing"
//
// NATIONSKOHÄRENZ (Leitplanke §3, konsistent zu Paket A):
// Pool-Key ← IOC-Code: ITA→it, GBR→gb, FRA→fr, GER→de, USA→us, JPN→jp,
// BRA→br, ESP→es, alles andere→generic. Der Gründer-Nachname kommt aus dem
// nationsgleichen data/names.js-Pool (Paket A) — Name und Muster passen dann
// zusammen („Écurie Marchand", nie „Écurie Yamamoto").
//
// FIKTIVITÄT (Leitplanke §3): Keine realen Rennställe/Sponsoren; bewusst
// gemieden wurden reale Team-Assoziationen (Shadow, Arrows, Stratos, Mirage,
// TRD …). Erfundene Markenwörter können zufällig entfernten Echt-Marken
// ähneln — Opus macht vor Einbau einen kurzen Kollisions-Check gegen
// bekannte Motorsport-Namen (nur diese sind die Verwechslungs-Messlatte).
//
// 0 Bytes gespeicherter Text gilt hier NICHT als Regenerations-Pflicht:
// Der generierte Name wird Teil des Team-Objekts (wie bei Fahrernamen aus
// Paket A) — die Pools selbst sind der statische Baustein.
// ============================================================================

const TEAM_NAME_POOLS = {

    // ── Konstrukteurs-Templates je Nation ({name} = Gründer-Nachname) ───────
    constructorPattern: {
        it: [
            'Scuderia {name}', 'Automobili {name}', '{name} Corse',
            'Squadra Corse {name}', 'Officine {name}', '{name} Competizione',
            '{name} Motori', 'Fratelli {name}'
        ],
        gb: [
            '{name} Racing', '{name} Engineering', '{name} Motorsport',
            '{name} Grand Prix', '{name} Racing Organisation', '{name} Cars',
            'Team {name}', '{name} Autosport'
        ],
        fr: [
            'Écurie {name}', 'Automobiles {name}', 'Équipe {name}',
            '{name} Compétition', '{name} Sport Automobile', '{name} Course'
        ],
        de: [
            '{name} Motorsport', '{name} Rennsport', 'Rennstall {name}',
            'Team {name}', '{name} Racing', '{name} Automobiltechnik'
        ],
        us: [
            '{name} Racing', '{name} Racing Enterprises', '{name} Motorsports',
            'Team {name}', '{name} Special', '{name} Speed Equipment'
        ],
        jp: [
            'Team {name}', '{name} Racing', '{name} Motorsports',
            '{name} Racing Project', '{name} Technica'
        ],
        br: [
            'Equipe {name}', '{name} Racing', 'Escuderia {name}',
            'Team {name}', '{name} Competições'
        ],
        es: [
            'Escudería {name}', 'Automóviles {name}', '{name} Competición',
            'Equipo {name}', '{name} Racing'
        ],
        generic: [
            '{name} Racing', 'Team {name}', '{name} Grand Prix',
            '{name} Motorsport', '{name} Autosport', '{name} International'
        ]
    },

    // ── Fiktive Titelsponsoren je Ära (Präfix vor den Teamnamen) ────────────
    // e50 bewusst LEER (SPEC §1: vor der Sponsor-Ära keine Titelsponsoren);
    // e62 dünn (die Praxis begann erst Ende der 60er) — Mix-Empfehlung unten.
    sponsorTitle: {
        e50: [],
        e62: ['Aurora Oil', 'Blue Crest', 'Vandermeer', 'Regatta'],
        e76: ['Corsaro', 'Silverline', 'Blue Panther', 'Royal Falcon',
              'Petrolux', 'Antares', 'Gran Oro', 'Meridiana'],
        e94: ['Digitron', 'Teleon', 'Helion', 'Omnitex',
              'Solaron', 'Maxvolt', 'Vertex Systems', 'Cobalt Telecom'],
        e10: ['Nexora', 'Veltra', 'Quantix', 'Volteon',
              'Skyre', 'Cortexa', 'Lumeon', 'Zephyra']
    },

    // ── Komplette Fantasienamen je Ära (ohne Gründer, nations-neutral) ──────
    standaloneNames: {
        e50: ['Scuderia Aquila', 'Écurie Azur', 'Atlas Grand Prix',
              'Meridian Motors', 'Vanguard Racing', 'Leone Corse'],
        e62: ['Kestrel Racing', 'Condor Grand Prix', 'Aurora Racing Team',
              'Delta Sport', 'Écurie Griffon', 'Tempesta Corse'],
        e76: ['Talon Racing', 'Polaris Grand Prix', 'Boreas Racing',
              'Vulkan Grand Prix', 'Sirius Racing Team', 'Grandezza Corse'],
        e94: ['Apex Grand Prix', 'Sapphire Racing', 'Centurion Grand Prix',
              'Meteor Grand Prix', 'Zenith Grand Prix', 'Nordwind Racing'],
        e10: ['Hyperion Racing', 'Vortex Grand Prix', 'Aeon Grand Prix',
              'Pulsar F1 Team', 'Kinetiq Racing', 'Astera F1 Team']
    }
};

// ============================================================================
// Komponier-Empfehlung (Sprache/Anmutung — die LOGIK baut Opus, SPEC §4):
//
//   Ära   Gründer+Pattern   davon mit Sponsor-Präfix   Standalone
//   e50        85 %                  0 %                  15 %
//   e62        75 %                ~10 %                  15 %
//   e76        60 %                ~45 %                  20 %
//   e94        55 %                ~55 %                  25 %
//   e10        50 %                ~60 %                  30 %
//
//   Sponsor-Komposition: '{sponsor} {teamName}' — bei langen Ergebnissen
//   (> ~28 Zeichen) besser Kurzform '{sponsor} {name} Racing'.
//   Der Gründer-Nachname kommt IMMER aus dem nationsgleichen Paket-A-Pool;
//   bei generic-Nationen einen international neutralen Namen ziehen.
// ============================================================================

// ============================================================================
// Testfälle (SPEC §5) — je 3 komponierte Namen für IT/GB/FR/DE in 2 Ären
// (Gründer-Namen beispielhaft aus den Paket-A-Pools der jeweiligen Nation)
// ============================================================================
// IT e50: „Scuderia Moretti" · „Automobili Castellani" · „Officine Rovelli"
// IT e10: „Moretti Corse" · „Quantix Scuderia Bandini" · „Astera F1 Team"
// GB e50: „Whitmore Racing Organisation" · „Ashcroft Grand Prix" · „Team Kendall"
// GB e10: „Hartley Motorsport" · „Nexora Hartley Racing" · „Vortex Grand Prix"
// FR e50: „Écurie Marchand" · „Automobiles Duval" · „Équipe Lefevre"
// FR e10: „Marchand Compétition" · „Lumeon Écurie Chastain" · „Aeon Grand Prix"
// DE e50: „Rennstall Brandt" · „Kessler Rennsport" · „Team Vogel"
// DE e10: „Brandt Motorsport" · „Cortexa Brandt Racing" · „Volteon Kessler Racing"
// ============================================================================
