/** Everything about the Organization: how closely they watch you, how tight their grip is, what they know. */

export interface Tier { name: string; min: number; heat: number; succ: number; note: string }

/** Named stages of Organization attention. Higher stages make heat build faster and missions riskier. */
export const TIERS: Tier[] = [
  {name:"Unnoticed", min:0,  heat:1,   succ:0,     note:"They don't know you exist."},
  {name:"Watched",   min:20, heat:1.1, succ:0,     note:"Someone is keeping tabs. Heat builds 10% faster."},
  {name:"Hunted",    min:45, heat:1.2, succ:-0.05, note:"Agents are asking about you. Heat builds 20% faster and missions are 5% less likely to succeed."},
  {name:"Wanted",    min:70, heat:1.3, succ:-0.10, note:"They're moving on you. Heat builds 30% faster and missions are 10% less likely to succeed."},
];

/** Narration when attention crosses into a new stage (index matches TIERS). */
export const TIER_UP: Record<number, string[]> = {
  1: ["A car you've seen before is parked outside again. It's probably nothing.",
      "Your phone clicks twice when you answer. Someone is listening."],
  2: ["Two men in good suits ask the doorman about you. They're not selling anything.",
      "Your name comes up in a room you've never been in. That's how it starts."],
  3: ["They've stopped hiding. The car outside has a radio and no plates.",
      "It's no longer about whether they know you. It's about when they move."],
};
export const TIER_DOWN: Record<number, string[]> = {
  0: ["The cars are gone. Whatever they were looking for, they've found it somewhere else."],
  1: ["The men in suits stop coming around. You can breathe, mostly."],
  2: ["They pull back from the door. Still watching, but they've lost the urgency."],
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
export const DOSSIER: { peak: number; text: string }[] = [
  {peak:0,  text:"Subject: Michael Westen. Status: burned."},
  {peak:20, text:"Address on file: a loft in Miami."},
  {peak:45, text:"Known associates: Sam Axe, Fiona Glenanne, Madeline Westen."},
  {peak:70, text:"Pressure points: everyone he loves."},
  {peak:95, text:"Recommendation: deal with him permanently."},
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
