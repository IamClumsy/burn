/**
 * Chores the game will do for you once you've earned enough Credibility (from Reinstating).
 * They're worth having and they cost something: a one-time fee in favors to buy, and a cut each time they work
 * that shrinks as your Credibility grows, so doing it by hand is still worth it now and then.
 */
export interface AutoDef { id: "clients" | "crew"; name: string; need: number; fee: number; desc: string }

export const AUTOS: AutoDef[] = [
  {id: "clients", name: "Auto-take clients", need: 2, fee: 30,
   desc: "When a client comes to the door, you take the case without stopping what you're doing."},
  {id: "crew", name: "Auto-send crew", need: 3, fee: 80,
   desc: "Every mission you start automatically asks the right crew member for help, if they're around and free."},
];

/** The share of a client's fee that an automatic case costs you: 20% at Credibility 2, down a little with each point, never under 8%. */
export const clientCut = (cred: number): number => Math.max(0.08, 0.20 - 0.015 * Math.max(0, cred - 2));
/** The share of a mission's pay your crew skims when you send them automatically: 12% at Credibility 3, never under 5%. */
export const crewCut = (cred: number): number => Math.max(0.05, 0.12 - 0.01 * Math.max(0, cred - 3));

/** What each automation's per-use cut is right now, for the card. */
export const autoCut = (id: AutoDef["id"], cred: number): number => (id === "clients" ? clientCut(cred) : crewCut(cred));
