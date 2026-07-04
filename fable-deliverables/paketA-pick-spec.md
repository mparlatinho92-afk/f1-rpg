# Paket A — Pick-Spezifikation für `generateDriver` (Integration durch Opus)

Datenquelle: `fable-deliverables/paketA-name-pools.js` (`NAME_POOLS_BY_NATION`, `NATION_NAME_FALLBACK`).

## Zieh-Reihenfolge (ersetzt die Blöcke index.html:4688–4718)

1. **Nation** wie bisher: `nation = isIndyTeam ? 'USA' : pickNationByDecade(year)` — unverändert, VOR der Namenswahl ziehen (heute steht sie danach, Zeile 4721 → muss nach oben).
2. **Pool auflösen:** `pool = NAME_POOLS_BY_NATION[nation] || NAME_POOLS_BY_NATION[NATION_NAME_FALLBACK[nation] || 'INT']`.
3. **Region ziehen:** erst `regions` nach optionalem `minYear` filtern (`!r.minYear || year >= r.minYear`), dann gewichtete Auswahl nach `w` über die verbleibenden Regionen (Kumulativ-Schleife analog `pickNationByDecade` — implizite Renormierung, da über die gefilterte Summe gezogen wird). **Die Region wird genau EINMAL gezogen** — Vor- und Nachname kommen zwingend aus derselben Region (Kernregel: kein "Jacques Müller"). `minYear` bildet Diaspora-Regionen ab, die es früher nicht gab (z.B. GBR britisch-asiatisch ab 1995, RSA afrikanisch ab 1995).
4. **Ära-Fenster** aus dem Debütjahr: `era = year < 1975 ? 'early' : year < 2010 ? 'mid' : 'modern'`.
5. **Vorname:** `firstArr = Array.isArray(region.first) ? region.first : (region.first[era] || region.first.mid)`; dann `firstName = weightedPick(firstArr)` (bestehende Funktion, Zeile 4617).
6. **Nachname:** bestehende Dedup-Logik unverändert auf `region.last` anwenden (Filter gegen aktive Nachnamen 4705–4716, bei leerem Rest voller Regions-Pool), dann `weightedPick`.
7. **Indy-Sonderfall:** kann auf `NAME_POOLS_BY_NATION.USA` (mit `era`) umgestellt werden; der alte Spezial-Topf 4688–4701 entfällt dann.
8. `FIRST_NAMES_W`/`LAST_NAMES_W` bleiben als Not-Fallback im Code erhalten (falls Pool-Konstante fehlt), werden aber regulär nicht mehr gezogen.
9. **Raritäten-Schwänze (`NAME_TAILS_BY_NATION`) einmalig beim Init mergen** (nicht bei jedem Pick): für jeden Eintrag `{r, first, last}` alle `last`-Namen mit Gewicht 1 an `regions[r].last` anhängen; alle `first`-Namen mit Gewicht 1 **nur an die Fenster mid und modern** anhängen (bzw. ans flache Array, wenn die Region ära-flach ist). Grund: das Aggregat ist gegenwartslastig — ein 1955er-Deutscher darf nicht „Kevin" heißen. Die Tails liefern die Namensvielfalt (~2000 Gewicht-1-Namen), die Kern-Pools die Häufigkeitsstruktur.

## Fallback-Regel (pool-lose Nationen)
`NATION_NAME_FALLBACK` mappt auf den kulturell nächstverwandten Pool (z.B. `CHI→ARG`, `UKR→RUS`, `UAE→MAR`, `NOR→DEN`). Nationen ohne plausiblen Verwandten (KOR, TUR, GRE, Balkan …) gehen bewusst auf den neutralen `INT`-Topf — nie auf einen markant falschen. `pickNationByDecade` liefert ohnehin nur Nationen, für die dedizierte Pools existieren; die Map ist Zukunftssicherung.

## Gewichts-Kalibrierung per BigQuery-Rohdaten (DURCHGEFÜHRT — v2)
Die v2-Gewichte sind am echten Datensatz kalibriert (12,5 Mio. Vornamen- / 21,1 Mio. Nachnamen-Zeilen, per Streaming-Script auf Top-400 je Land aggregiert; Bucket-Formel: r = count/max je Land, `r≥0.5→5, ≥0.2→4, ≥0.08→3, ≥0.02→2, sonst 1`).

Kuratierte Korrekturen gegenüber den Rohdaten (bewusst, nicht versehentlich):
- **Weibliche Formen** entfernt (PL -ska, CZ -ová, RU -ова), **Akzent-Duplikate** zusammengelegt (ES/PT „Jose/José"), **RU kyrillisch→transliteriert**, **Diminutive** gestrichen (CZ „Honza/Jirka").
- **Expat-Rauschen** gefiltert, wo es kein plausibles Fahrerprofil ergibt (FI-Top-Nachnamen „Khan/Kumar/Ali" = App-Nutzer-Artefakt).
- **Diaspora als eigene Regionen mit `minYear`** übernommen, wo die Daten sie klar zeigen: GBR britisch-asiatisch (Khan = #8 in GB), FRA maghrebinisch/westafrikanisch, SUI portugiesisch, CAN südasiatisch/ostasiatisch, RSA afrikanisch (Ndlovu/Dlamini dominieren modern), EST russische Minderheit (ohne minYear — existiert seit jeher).
- Der Datensatz ist **gegenwartslastig** → kalibriert primär die mid/modern-Fenster; early-Fenster und Ära-Drift bleiben kuratiert.

**Ohne Datenbasis** (fehlen im Datensatz bzw. defekt kodiert): **AUS, NZL, THA, MON, VEN, ZIM, CHN** (nur englische Spitznamen in den Daten) und **MAR-Vornamen** (Mojibake) — wissensbasiert.

ISO-2 → IOC (Referenz): `GB→GBR, DE→GER, CH→SUI, JP→JPN, ES→ESP, NL→NED, DK→DEN, IE→IRL, PT→POR, ZA→RSA, US→USA, IT→ITA, FR→FRA, BR→BRA, AR→ARG, BE→BEL, AT→AUT, SE→SWE, FI→FIN, CA→CAN, MX→MEX, UY→URU, CO→COL, RU→RUS, PL→POL, CZ→CZE, HU→HUN, IN→IND, IL→ISR, MA→MAR, MY→MAS, ID→INA, CN→CHN, EE→EST`.
