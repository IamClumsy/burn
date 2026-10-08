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
  if (life < 2e7) return "Carla";
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

const FIXER_NAMES = [
  "Eddie from the docks", "Walt from customs", "Marisol at the courthouse", "Lou the bookie",
  "Ray, the retired agent with a grudge", "Dee, the night manager", "Nico, a fixer's cousin", "Priya, a lawyer who owes Sam",
];
export const FIXER_MIN_MULT = 0.6;
export const FIXER_MAX_MULT = 1.8;

/**
 * A fixer turns up with their own price and their own reach. Dearer fixers tend to do more good,
 * but there's luck in it: a cheap one is sometimes great, and a pricey one sometimes isn't.
 */
export function rollFixer(rand: () => number = Math.random): FixerQuote {
  const mult = FIXER_MIN_MULT + rand() * (FIXER_MAX_MULT - FIXER_MIN_MULT);
  const quality = (mult - FIXER_MIN_MULT) / (FIXER_MAX_MULT - FIXER_MIN_MULT);
  const drop = Math.round(25 + quality * 25 + rand() * 6);
  return {
    name: FIXER_NAMES[Math.floor(rand() * FIXER_NAMES.length)],
    mult: Math.round(mult * 100) / 100,
    drop,
    left: 45 + rand() * 45,
  };
}
