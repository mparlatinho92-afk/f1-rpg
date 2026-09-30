// ─────────────────────────────────────────────────────────────────────────────
// Fahrer-Slot für den Ticker: {driver}
//
// Prinzip
//   {leader}  = Zeile setzt den Führenden voraus ("führt", "an der Spitze", "vorn").
//               Immer der Führende.
//   {driver}  = Zeile passt auf jeden Fahrer. Der Code wählt pro Aufruf EINEN von
//               sechs Fahrern nach festen Gewichten. Die Textquellen (auch Fremd-KIs)
//               müssen dafür nichts wissen: das Filter-Skript stellt die Zeilen um.
//
// Rollen (Werte = Fahrername oder null, wenn die Rolle gerade nicht vergeben ist)
//   leader       aktuell Führender im Rennen
//   champion     amtierender Weltmeister; hat jemand den Titel in dieser Saison schon
//                vorzeitig entschieden, ist er dieser Fahrer
//   champLeader  aktueller Meisterschaftsführender
//   pole         Polesitter dieses Rennens
//   pace1, pace2 die zwei besten WEITEREN Fahrer nach aktuellem Tempo, also die besten
//                zwei, die nicht schon leader, champion, champLeader oder pole sind
//
// Regel
//   Der Führende bekommt mindestens 50 % der {driver}-Nennungen. Da {leader}-Zeilen
//   immer den Führenden nennen, liegt sein Anteil an ALLEN Namensnennungen ebenfalls
//   bei mindestens 50 %. Die restlichen 50 % teilen sich die vergebenen Rollen gleich.
//   Ist dieselbe Person in mehreren Rollen, addieren sich ihre Gewichte.
//   Fehlt eine Rolle (z. B. 1950: kein Weltmeister), verteilen sich die übrigen 50 %
//   nur auf die vergebenen Rollen. Fehlen alle, bleibt es beim Führenden.
// ─────────────────────────────────────────────────────────────────────────────

const DRIVER_SLOT_LEADER_MIN = 0.5;                       // Anteil des Führenden
const DRIVER_SLOT_OTHER_ROLES = ['champion', 'champLeader', 'pole', 'pace1', 'pace2'];

function pickDriverSlot(roles, rnd = Math.random) {
  const weights = new Map();                              // Name -> Gewicht
  const add = (name, w) => { if (name) weights.set(name, (weights.get(name) || 0) + w); };

  add(roles.leader, DRIVER_SLOT_LEADER_MIN);
  const others = DRIVER_SLOT_OTHER_ROLES.map(k => roles[k]).filter(Boolean);
  const restShare = 1 - DRIVER_SLOT_LEADER_MIN;
  others.forEach(name => add(name, restShare / others.length));

  const total = [...weights.values()].reduce((a, b) => a + b, 0);
  let r = rnd() * total;
  for (const [name, w] of weights) { r -= w; if (r < 0) return name; }
  return roles.leader;                                    // Sicherheitsnetz
}

// Einbau: an der Stelle, wo der Ticker seine Platzhalter ersetzt.
// {driver} pro Zeile EINMAL würfeln, damit ein doppeltes {driver} denselben Namen ergibt.
//
//   const driver = line.includes('{driver}') ? pickDriverSlot(ctx.roles) : null;
//   text = line.replaceAll('{leader}', ctx.roles.leader)
//              .replaceAll('{driver}', driver);
//
// Zeilen mit {driver} nur verwenden, wenn ctx.roles.leader gesetzt ist (wie bisher bei {leader}).

if (typeof module !== 'undefined') module.exports = { pickDriverSlot };
