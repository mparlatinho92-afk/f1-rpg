        // VENUE_PULL — wie stark eine Strecke AUSWAERTIGE Teilzeit-Melder anzieht.
        // GENERIERT von tools/build-venue-pull.js — NICHT von Hand editieren.
        //
        // 1.0 = Saisondurchschnitt. Der Nuerburgring zog 1,4-mal so viele Gastmelder wie
        // ein Durchschnittsrennen, Rouen nur 0,6-mal. Damit entsteht die Streuung der
        // Meldelisten ueber die Strecken — und mit ihr die DNQ, die nur dort auftreten,
        // wo besonders viele melden.
        //
        // ⚠ Der HEIMRENNEN-Sog steckt NICHT drin (Landsleute sind herausgerechnet). Den
        //   hat das Spiel schon in _homePullWeight; beides zusammen zu messen haette die
        //   britischen Rennen doppelt gewichtet (Aintree schien 1,28 statt echter 0,71).
        // Aufbau: circuitId -> { "1950": Faktor, "1960": ..., "*": Mittel als Rueckfall }.
        // Nach DEKADEN gestaffelt, weil sich der Sog stark verschob: Watkins Glen 0,64
        // in den 1960ern (Ueberseereise) gegen 1,29 in den 1970ern.
        // Ab 1980 gilt ueberall 1.0 — dort sind Teilzeit-Melder so selten (3-13 % der
        // Meldungen), dass jeder Faktor Rauschen waere; die Streuung stimmt dort schon.
        // 31 Strecken, Faktoren gekappt auf 0.55-1.5.
        const VENUE_PULL = {
            "aintree":{"*":0.71,"1950":0.6},
            "anderstorp":{"*":0.83,"1970":0.83},
            "brands-hatch":{"*":0.93,"1960":0.76,"1970":0.93,"1980":1.06},
            "bremgarten":{"*":1.03,"1950":1.03},
            "buenos-aires":{"*":0.83,"1950":0.71,"1970":0.83},
            "clermont-ferrand":{"*":1.03},
            "dijon":{"*":0.84,"1970":0.86},
            "estoril":{"*":1.07},
            "hockenheimring":{"*":1.03,"1970":1.11,"1980":0.93},
            "imola":{"*":0.87,"1980":0.8},
            "interlagos":{"*":0.84,"1970":0.67},
            "jacarepagua":{"*":1.15,"1980":1.09},
            "jarama":{"*":0.89,"1970":0.96},
            "kyalami":{"*":0.98,"1960":1.34,"1970":0.84,"1980":1.05},
            "long-beach":{"*":0.83,"1970":0.72},
            "mexico-city":{"*":0.87,"1960":0.92},
            "monaco":{"*":1.17,"1950":1.5,"1960":1.15,"1970":0.99,"1980":1.06},
            "montjuic":{"*":0.79,"1970":0.86},
            "montreal":{"*":1.23,"1980":1.1},
            "monza":{"*":1.18,"1950":1.26,"1960":1.32,"1970":1.17,"1980":0.96},
            "mosport":{"*":1.2,"1970":1.25},
            "nurburgring":{"*":1.37,"1950":1.33,"1960":1.5,"1970":0.99},
            "paul-ricard":{"*":0.86,"1970":0.86,"1980":0.87},
            "reims":{"*":1.14,"1950":1.09,"1960":1.23},
            "rouen":{"*":0.59,"1960":0.55},
            "silverstone":{"*":0.77,"1950":0.65,"1960":0.69,"1970":0.92},
            "spa-francorchamps":{"*":0.83,"1950":0.67,"1960":0.93},
            "spielberg":{"*":1.03,"1970":1.07,"1980":0.91},
            "watkins-glen":{"*":0.99,"1960":0.64,"1970":1.29},
            "zandvoort":{"*":0.96,"1950":0.82,"1960":0.81,"1970":1.14,"1980":1.1},
            "zolder":{"*":1.07,"1970":1.05,"1980":1.12}
        };
