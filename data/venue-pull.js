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
        // 45 Strecken, Faktoren gekappt auf 0.55-1.5.
        const VENUE_PULL = {
            "adelaide":{"*":0.94,"1980":1.1,"1990":0.83},
            "aintree":{"*":0.7,"1950":0.59},
            "anderstorp":{"*":0.99,"1970":0.99},
            "bahrain":{"*":1.09,"2000":1.06},
            "brands-hatch":{"*":0.88,"1960":0.65,"1970":0.95,"1980":0.94},
            "bremgarten":{"*":1.04,"1950":1.04},
            "buenos-aires":{"*":0.82,"1950":0.67,"1970":0.8},
            "catalunya":{"*":1.07,"1990":1.15,"2000":1.02},
            "clermont-ferrand":{"*":0.97},
            "detroit":{"*":0.97,"1980":0.97},
            "dijon":{"*":0.95,"1970":0.9,"1980":1.01},
            "estoril":{"*":1.04,"1980":1.18,"1990":0.93},
            "hockenheimring":{"*":1.07,"1970":1.07,"1980":1.04,"1990":1.12,"2000":1.03},
            "hungaroring":{"*":1.09,"1980":1.08,"1990":1.14,"2000":1},
            "imola":{"*":0.86,"1980":0.83,"1990":0.76,"2000":1},
            "indianapolis":{"*":0.93,"2000":0.93},
            "interlagos":{"*":0.82,"1970":0.71,"1990":1.08,"2000":0.73},
            "jacarepagua":{"*":0.91,"1980":0.9},
            "jarama":{"*":1.03,"1970":1.08},
            "jerez":{"*":1.09,"1980":1.12,"1990":1.06},
            "kyalami":{"*":0.97,"1960":1.04,"1970":0.92,"1980":0.91},
            "long-beach":{"*":0.94,"1970":0.88,"1980":1.01},
            "magny-cours":{"*":0.98,"1990":0.87,"2000":1.09},
            "marina-bay":{"*":1.03},
            "melbourne":{"*":1.16,"2000":1.12},
            "mexico-city":{"*":1.05,"1960":1.01,"1980":1.15,"1990":1.24},
            "monaco":{"*":1.13,"1950":1.47,"1960":1.08,"1970":1.04,"1980":1.09,"1990":1.15,"2000":1.06},
            "montjuic":{"*":0.95,"1970":0.98},
            "montreal":{"*":1.08,"1980":1.01,"1990":1.12,"2000":1.07},
            "monza":{"*":1.02,"1950":1.25,"1960":1.21,"1970":1.06,"1980":0.92,"1990":0.61,"2000":0.92},
            "mosport":{"*":1.11,"1970":1.12},
            "nurburgring":{"*":1.19,"1950":1.3,"1960":1.5,"1970":1.05,"2000":0.9},
            "paul-ricard":{"*":0.88,"1970":0.96,"1980":0.78},
            "reims":{"*":1.1,"1950":1.06,"1960":1.18},
            "rouen":{"*":0.81,"1960":0.79},
            "sepang":{"*":1.1,"2000":1.11},
            "shanghai":{"*":1.05,"2000":1},
            "silverstone":{"*":0.9,"1950":0.69,"1960":0.66,"1970":0.98,"1980":0.91,"1990":1.02,"2000":1.09},
            "spa-francorchamps":{"*":0.96,"1950":0.75,"1960":1.01,"1980":0.97,"1990":1.03,"2000":0.99},
            "spielberg":{"*":1.06,"1970":1.05,"1980":1.04,"2000":1.13},
            "suzuka":{"*":0.9,"1990":0.78,"2000":0.89},
            "watkins-glen":{"*":0.94,"1960":0.74,"1970":1.1},
            "yas-marina":{"*":0.75},
            "zandvoort":{"*":1.04,"1950":0.91,"1960":0.95,"1970":1.11,"1980":1.15},
            "zolder":{"*":1.1,"1970":1.09,"1980":1.13}
        };

        // VENUE_REGION — nur die AUSSEREUROPAEISCHEN Strecken, grob nach Koordinaten.
        // Europa fehlt bewusst: „kein Eintrag" heisst „Europa, keine Reise".
        // Gebraucht fuer die Reise-Zurueckhaltung europaeischer Fahrer.
        const VENUE_REGION = { "adelaide":"AF","aida":"AS","austin":"NA","buddh":"AS","buenos-aires":"SA","caesars-palace":"NA","dallas":"NA","detroit":"NA","east-london":"AF","fuji":"AS","indianapolis":"NA","interlagos":"SA","jacarepagua":"SA","kyalami":"AF","las-vegas":"NA","long-beach":"NA","marina-bay":"AS","melbourne":"AF","mexico-city":"NA","miami":"NA","mont-tremblant":"NA","montreal":"NA","mosport":"NA","phoenix":"NA","riverside":"NA","sebring":"NA","sepang":"AS","shanghai":"AS","suzuka":"AS","watkins-glen":"NA","yeongam":"AS" };
