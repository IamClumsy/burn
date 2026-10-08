/**
 * Chores the game will do for you once you've earned enough Credibility (from Reinstating).
 * Each carries a small cost so doing it by hand is still worth it sometimes.
 */
export interface AutoDef { id: "clients" | "crew"; name: string; need: number; desc: string; cost: string }

export const AUTOS: AutoDef[] = [
  {id: "clients", name: "Auto-take clients", need: 2,
   desc: "When a client comes to the door, you take the case without stopping what you're doing.",
   cost: "Pays 15% less than doing it yourself."},
  {id: "crew", name: "Auto-send crew", need: 3,
   desc: "Every mission you start automatically asks the right crew member for help, if they're around and free.",
   cost: "Nobody to blame but you if they're busy elsewhere."},
];

/** Fee multiplier on a case taken automatically. */
export const AUTO_CLIENT_CUT = 0.85;
