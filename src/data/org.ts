import type { FixerQuote } from "../types";

/** Everything about the Organization: how closely they watch you, how tight their grip is, what they know. */

export interface Tier { name: string; min: number; heat: number; succ: number; note: string }

/** Named stages of Organization attention. Higher stages make heat build faster and missions riskier. */
export const TIERS: Tier[] = [
  {name:"Unnoticed", min:0,  heat:1,   succ:0,     note:"They don't know you exist."},
  {name:"Watched",   min:20, heat:1.1, succ:0,     note:"Someone is keeping tabs. Heat builds 10% faster."},
  {name:"Hunted",    min:45, heat:1.2, succ:-0.05, note:"Agents are asking about you. Heat builds 20% faster and missions are 5% less likely to succeed."},
  {name:"Wanted",    min:70, heat:1.3, succ:-0.10, note:"They're moving on you. Heat builds 30% faster and missions are 10% less likely to succeed."},
  {name:"Management", min:90, heat:1.4, succ:-0.15, note:"The man at the top has taken a personal interest. Heat builds 40% faster and missions are 15% less likely to succeed."},
];

/** Narration when attention crosses into a new stage (index matches TIERS). */
export const TIER_UP: Record<number, string[]> = {
  1: ["A car you've seen before is parked outside again. It's probably nothing.",
      "Your phone clicks twice when you answer. Someone is listening."],
  2: ["Two men in good suits ask the doorman about you. They're not selling anything.",
      "Your name comes up in a room you've never been in. That's how it starts."],
  3: ["They've stopped hiding. The car outside has a radio and no plates.",
      "It's no longer about whether they know you. It's about when they move."],
  4: ["A helicopter circles the loft twice and heads out over the water. It's a polite hello.",
      "An envelope arrives with your old sunglasses in it. 'We never stopped watching,' says the note. There's no return address."],
};
export const TIER_DOWN: Record<number, string[]> = {
  0: ["The cars are gone. Whatever they were looking for, they've found it somewhere else."],
  1: ["The men in suits stop coming around. You can breathe, mostly."],
  2: ["They pull back from the door. Still watching, but they've lost the urgency."],
  3: ["The helicopter doesn't come back. For now, the old man has other business."],
};

/** The Organization's grip on you starts at 100 and is worn down by wins. Milestones grant permanent perks. */
export interface GripPerk { at: number; name: string; desc: string; inc?: number; att?: number; fixer?: number }
export const GRIP_PERKS: GripPerk[] = [
  {at:75, name:"Rattled",      desc:"+5% income", inc:0.05},
  {at:50, name:"Slipping",     desc:"Organization attention builds 10% slower", att:-0.1},
  {at:25, name:"Losing Hold",  desc:"Fixer payoffs cost half", fixer:0.5},
  {at:0,  name:"Cut Loose",    desc:"+10% income", inc:0.1},
];

/** Someone new is always after Michael: each Season the Organization's grip on you starts over, with a new hand on the leash. */
export const SEASON_GRIP: Record<number, string> = {
  2: "Carla Baxter has her hooks in you now, and she's brought deadlines.",
  3: "Carla's gone, but Management never stops. A detective, an old mentor with a bomb, and a man called Brennen are all circling.",
  4: "A new handler arrives with a tactical team and a list with your name at the top.",
  5: "Anson Fullerton has plans for you, and plans behind his plans.",
  6: "Tom Card pulls strings you didn't know were attached, and Olivia Riley is coming for you.",
  7: "The CIA, a criminal syndicate and a man with a grudge: everyone wants a piece of Michael.",
};

/** What the Organization has on you, revealed as their attention peaks. */
export const DOSSIER: { peak: number; label: string; text: string }[] = [
  {peak:0,  label:"Subject",            text:"Michael Westen"},
  {peak:0,  label:"Status",             text:"Burned"},
  {peak:10, label:"Former Occupation",  text:"Intelligence Operative"},
  {peak:20, label:"Address on File",    text:"A loft in Miami"},
  {peak:45, label:"Known Associates",   text:"Sam Axe, Fiona Glenanne, Madeline Westen"},
  {peak:70, label:"Pressure Points",    text:"Everyone he loves"},
  {peak:95, label:"Recommendation",     text:"Deal with him permanently"},
];

/** Who hands you an errand depends on how far you've come. */
export function handlerFor(life: number): string {
  if (life < 1.5e6) return "Carla"; // she dies in the Season 2 finale, the same story beat as "Lesser Evil"
  if (life < 3e7) return "Management"; // Season 3: the old man himself, since there's no one between Carla and Vaughn
  if (life < 1e10) return "Vaughn";
  return "Tom Card";
}

export interface Errand { n: string; d: string }
export const ERRANDS: Errand[] = [
  {n:"Track down a missing courier", d:"They've lost a courier and a package. They'd like both back before anyone asks questions."},
  {n:"Retrieve a device from an embassy party", d:"A party, a guest list and a device that shouldn't be there. They need someone who can blend in."},
  {n:"Keep an eye on a man for a week", d:"A quiet watch job on someone they're curious about. No contact, no trouble, no excuses."},
  {n:"Escort a witness out of the city", d:"A frightened witness needs to leave Miami before dawn. They'd rather it wasn't official."},
];

// ---- fixers ----

/**
 * Everyone who might smooth things over. `act` is what you do for them (it reads "Pay off Walt from customs"),
 * `line` is what happens after, so each one feels like a little scene instead of the same envelope.
 */
export interface FixerKind { name: string; act: string; line: string }
export const FIXERS: FixerKind[] = [
  {name: "Eddie from the docks", act: "Pay off", line: "Eddie makes a manifest go missing and a crate disappear."},
  {name: "Walt from customs", act: "Pay off", line: "Walt stamps the right forms and loses the wrong ones."},
  {name: "Marisol at the courthouse", act: "Pay off", line: "Marisol misfiles a warrant in a way that looks like an accident."},
  {name: "Lou the bookie", act: "Settle a debt with", line: "Lou rewrites a few debts so somebody important forgets they were watching you."},
  {name: "Ray, the retired agent with a grudge", act: "Buy a drink for", line: "Ray hears you out and calls three old friends who still owe him."},
  {name: "Dee, the night manager", act: "Tip", line: "Dee wipes a week of hotel security footage."},
  {name: "Nico, a fixer's cousin", act: "Pay off", line: "Nico isn't as good as his cousin, but he knows who is."},
  {name: "Priya, a lawyer who owes Sam", act: "Hire", line: "Priya files three motions before lunch and an injunction before dinner."},
  {name: "Hector the tow-truck driver", act: "Tip", line: "Hector hauls a certain car to a lot where no camera looks."},
  {name: "Candace in records", act: "Slip an envelope to", line: "Candace deletes a name from a list and a list from a drawer."},
  {name: "Father Mike, who hears a lot", act: "Make a donation to", line: "Father Mike says a prayer and then makes exactly one phone call."},
  {name: "Big Tony at the car wash", act: "Pay off", line: "Tony says the car wash has always been closed on Tuesdays. Nobody argues."},
  {name: "Dr. Fenn, a surgeon who doesn't ask", act: "Send a gift to", line: "Dr. Fenn has a sudden memory lapse about a certain patient."},
  {name: "a bartender on South Beach", act: "Overtip", line: "The bartender remembers that nobody ever sat at that table, and never will."},
  {name: "Jorge the locksmith", act: "Pay off", line: "Jorge swears that lock was always broken."},
  {name: "Rita, a former Organization accountant", act: "Hire", line: "Rita moves a few numbers around, and a few heads turn the other way."},
  {name: "Sal at the airport", act: "Pay off", line: "Sal checks a passenger list and, on reflection, doesn't see your name."},
  {name: "a bail bondsman with a long memory", act: "Hire", line: "The bondsman knows who needs a favor and who is about to."},
  {name: "Gus the taxi dispatcher", act: "Tip", line: "Gus sends every cab on the east side the wrong way for an hour."},
  {name: "a cousin of Barry's at the bank", act: "Pay off", line: "Barry's cousin finds a clerical error that happens to bury three transactions."},
  {name: "Mrs. Dunleavy, a judge's secretary", act: "Send flowers to", line: "Mrs. Dunleavy mentions to the judge that it would be a bother, and it goes away."},
  {name: "Frankie from the phone company", act: "Pay off", line: "Frankie finds that a number never existed, and a tap never got approved."},
  {name: "a TSA supervisor who hates his boss", act: "Buy a round for", line: "The supervisor happily loses some paperwork to spite his boss."},
  {name: "Yolanda at the DMV", act: "Pay off", line: "Yolanda gives a plate a brand-new history and no questions."},
  {name: "Sergeant Cruz, who's retiring soon", act: "Buy dinner for", line: "Sergeant Cruz decides some reports aren't worth his last six weeks."},
  {name: "an ex-NSA clerk named Pat", act: "Hire", line: "Pat is very good at making a lot of data suddenly unavailable."},
  {name: "the harbormaster", act: "Pay off", line: "The harbormaster has no record of a certain boat leaving or arriving."},
  {name: "a hotel concierge who sees everything", act: "Overtip", line: "The concierge keeps a guest book that very politely forgets you."},
  {name: "Mr. Okafor, a notary with no scruples", act: "Pay off", line: "Mr. Okafor notarizes a story that's much better than the real one."},
  {name: "Bea at the wire-transfer desk", act: "Slip an envelope to", line: "Bea sends a payment on a very long route that no one will follow."},
];
export const FIXER_MIN_MULT = 0.6;
export const FIXER_MAX_MULT = 1.8;

/**
 * A fixer turns up with their own price and their own reach. Dearer fixers tend to do more good,
 * but there's luck in it: a cheap one is sometimes great, and a pricey one sometimes isn't.
 */
const recentFixers: string[] = [];
export function rollFixer(rand: () => number = Math.random): FixerQuote {
  const mult = FIXER_MIN_MULT + rand() * (FIXER_MAX_MULT - FIXER_MIN_MULT);
  const quality = (mult - FIXER_MIN_MULT) / (FIXER_MAX_MULT - FIXER_MIN_MULT);
  const drop = Math.round(25 + quality * 25 + rand() * 6);
  // never the same few people twice running
  let kind = FIXERS[Math.floor(rand() * FIXERS.length)];
  for (let i = 0; i < 20 && recentFixers.includes(kind.name); i++) kind = FIXERS[Math.floor(rand() * FIXERS.length)];
  recentFixers.push(kind.name);
  if (recentFixers.length > 8) recentFixers.shift();
  return {
    name: kind.name, act: kind.act, line: kind.line,
    mult: Math.round(mult * 100) / 100,
    drop,
    left: 45 + rand() * 45,
  };
}
