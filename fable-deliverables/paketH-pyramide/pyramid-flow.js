// ============================================================================
// PYRAMID_FLOW — Ebenen-Skelett + Einsteiger-Raten je Ära (Paket H, D1+D2)
// GENERIERT von fable-deliverables/paketH-pyramide/derive-pyramid.js — NICHT von
// Hand editieren. Reproduktion: node derive-pyramid.js (Quellen: F1DB-JSON,
// MOTORSPORT_NATION_FREQ, index.html read-only). Methodik/Quellen-Tags: METHODIK.md.
// ============================================================================
// Felder je Ebene:
//   seats        Sitze gleichzeitig (real-aggregiert; Spiel darf eigene Grid-Größen skalieren,
//                die RATEN (tenure/promoteShare/freshShare) sind skalenfrei)
//   fieldOverlap true → Sitze > Fahrer (Kart: WM+EM = dasselbe ~Feld)
//   tenure       Ø Verweildauer in Jahren → Neuzugänge/Jahr = seats/tenure
//   promoteShare Anteil der ABGÄNGER, der aufsteigt (Rest verschwindet — Ursache egal)
//   freshShare   Anteil der NEUZUGÄNGE frisch aus der nicht-simulierten Masse
//   entryAge     Einstiegsalter-Spanne [von, bis]
//   src          'D' = F1DB-empirisch, 'A' = Flussbilanz-abgeleitet, 'S' = Schätzung
// F1-Zeile: empirisch aus F1DB (Road-F1, Indy raus, Zensur-korrigiert).
//   oneOffShare  Anteil Debütanten mit ≤3 GP-Starts (e50: Drehtür-Privatiers!)
const PYRAMID_FLOW = {
    meta: { generated: '2026-07-17', source: 'Paket H', eras: { e50:[1950,1961], e62:[1962,1975], e76:[1976,1993], e94:[1994,2009], e10:[2010,null] } },
    e50: {
        kart: null,
        f4: null,
        f3: { seats:60, fieldOverlap:false, tenure:2, promoteShare:0.15, freshShare:1, entryAge:[20,32], src:'S' /* 500cc-F3 (UK-lastig); kein Unterbau → fresh 1.0 */ },
        f2: { seats:60, fieldOverlap:false, tenure:2, promoteShare:0.3, freshShare:0.85, entryAge:[21,33], src:'S' /* F2 real groß (WM 1952/53 nach F2-Reglement) */ },
        f1: { seats:22.4, fieldOverlap:false, tenure:2, tenureMean:3, entriesPerYear:23.6, freshShare:0.65, oneOffShare:0.6, entryAge:[25,45], entryAgeMedian:33, src:'D' }
    },
    e62: {
        kart: { seats:60, fieldOverlap:true, tenure:2.5, promoteShare:0.15, freshShare:1, entryAge:[15,25], src:'S' /* CIK-WM ab 1964, auch Erwachsene (Peterson) */ },
        f4: { seats:150, fieldOverlap:false, tenure:1.5, promoteShare:0.28, freshShare:0.96, entryAge:[17,26], src:'S' /* hist. Formula Ford ab 1967 (Einstiegs-Formel) */ },
        f3: { seats:80, fieldOverlap:false, tenure:2, promoteShare:0.3, freshShare:0.3, entryAge:[18,28], src:'S' /* nationale F3s (GBR/FRA/ITA aggregiert) */ },
        f2: { seats:40, fieldOverlap:false, tenure:2, promoteShare:0.37, freshShare:0.4, entryAge:[19,30], src:'S' /* Euro-F2 ab 1967; F1-Piloten fuhren mit (Overlap nach oben) */ },
        f1: { seats:23.7, fieldOverlap:false, tenure:2, tenureMean:3.6, entriesPerYear:13.4, freshShare:0.45, oneOffShare:0.4, entryAge:[24,36], entryAgeMedian:29, src:'D' }
    },
    e76: {
        kart: { seats:100, fieldOverlap:true, tenure:2.5, promoteShare:0.3, freshShare:1, entryAge:[13,20], src:'S' /* Kart-Elite wird jünger (Senna/Prost-Generation) */ },
        f4: { seats:300, fieldOverlap:false, tenure:1.5, promoteShare:0.25, freshShare:0.94, entryAge:[16,22], src:'S' /* FF1600 + Formula Renault national aggregiert */ },
        f3: { seats:120, fieldOverlap:false, tenure:2, promoteShare:0.15, freshShare:0.15, entryAge:[17,24], src:'S' /* nationale F3s (D/GB/I/F) — breiteste F3-Ära */ },
        f2: { seats:26, fieldOverlap:false, tenure:2, promoteShare:0.45, freshShare:0.3, entryAge:[19,27], src:'S' /* Euro-F2 → ab 1985 Int. F3000 */ },
        f1: { seats:27.6, fieldOverlap:false, tenure:2.5, tenureMean:4.6, entriesPerYear:7.3, freshShare:0.2, oneOffShare:0.1, entryAge:[23,31], entryAgeMedian:27, src:'D' }
    },
    e94: {
        kart: { seats:130, fieldOverlap:true, tenure:2.5, promoteShare:0.35, freshShare:1, entryAge:[12,17], src:'S' /* CIK WM/EM + Junior-Klassen */ },
        f4: { seats:350, fieldOverlap:false, tenure:1.5, promoteShare:0.19, freshShare:0.92, entryAge:[15,19], src:'S' /* Formula Renault 2.0 / Formula BMW / nat. Serien */ },
        f3: { seats:100, fieldOverlap:false, tenure:2, promoteShare:0.2, freshShare:0.1, entryAge:[16,21], src:'S' /* F3-Euroserie + nationale F3s */ },
        f2: { seats:26, fieldOverlap:false, tenure:2, promoteShare:0.34, freshShare:0.25, entryAge:[18,24], src:'S' /* F3000 → ab 2005 GP2 */ },
        f1: { seats:21, fieldOverlap:false, tenure:3, tenureMean:4.8, entriesPerYear:4.9, freshShare:0.08, oneOffShare:0, entryAge:[21,29], entryAgeMedian:24, src:'D' }
    },
    e10: {
        kart: { seats:150, fieldOverlap:true, tenure:2.5, promoteShare:0.4, freshShare:1, entryAge:[12,16], src:'S' /* CIK OK/OKJ/KZ WM+EM — überlappende Felder, ~150 Fahrer */ },
        f4: { seats:420, fieldOverlap:false, tenure:1.5, promoteShare:0.06, freshShare:0.91, entryAge:[15,17], src:'S' /* ~15 nationale F4-Serien à ~28, geografisch getrennt */ },
        f3: { seats:30, fieldOverlap:false, tenure:1.7, promoteShare:0.55, freshShare:0.05, entryAge:[16,20], src:'S' /* eine FIA-F3; FRegional-Zwischenebene implizit in Raten */ },
        f2: { seats:22, fieldOverlap:false, tenure:2, promoteShare:0.3, freshShare:0.15, entryAge:[17,22], src:'S' /* eine FIA-F2 */ },
        f1: { seats:20.9, fieldOverlap:false, tenure:2, tenureMean:2.5, entriesPerYear:3.3, freshShare:0.02, oneOffShare:0.1, entryAge:[20,26], entryAgeMedian:23, src:'D' }
    },
};
