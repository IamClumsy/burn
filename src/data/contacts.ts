import type { Contact } from "../types";

/**
 * Frienemies: not crew, and not exactly friends. Michael avoids them and keeps their numbers anyway.
 * Each sells a different kind of necessary favor.
 */
export const CONTACTS: Contact[] = [
  {id:"seymour", name:"Seymour Talbot", kind:"Hardware favors",
   bio:"An eccentric Romanian-born arms dealer in Miami. Overenthusiastic about the spy trade and exhausting to deal with, but his knowledge and contacts are worth more than his habits cost. A friend, in the way that matters. A necessary evil.",
   pitch:"Gets you gear: +1 favor and a couple of useful parts. Dealing with him draws a little Organization attention."},
  {id:"simon", name:"Simon Escher", kind:"Intel favors",
   bio:"A former Organization assassin who turned on his own bosses and kept the receipts. Brilliant, volatile, and fixated on the people who burned you. Dangerous to know, and he knows everything. A friend, when it suits you both. A necessary evil.",
   pitch:"Gets you intel: +1 favor and the Organization loses interest in you. He's unpredictable and sometimes goes off script."},
];
