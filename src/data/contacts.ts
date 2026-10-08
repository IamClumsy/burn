import type { Contact } from "../types";

/**
 * Frienemies: not crew, and not exactly friends. Michael avoids them and keeps their numbers anyway.
 * Each sells a different kind of necessary favor.
 */
export const CONTACTS: Contact[] = [
  {id:"seymour", name:"Seymour Talbot", kind:"Hardware favors",
   bio:"An eccentric Romanian-born arms dealer in Miami. Overenthusiastic about the spy trade and exhausting to deal with, but his knowledge and contacts are worth more than his habits cost. A friend, in the way that matters. A necessary evil.",
   pitch:"Gets you gear: +1 favor and a couple of useful parts. Dealing with him draws a little Organization attention. Never more than $100K, and only four favors a day."},
  {id:"simon", name:"Simon Escher", kind:"Intel favors",
   bio:"A former Organization assassin who turned on his own bosses and kept the receipts. Brilliant, volatile, and fixated on the people who burned you. Dangerous to know, and he knows everything. A friend, when it suits you both. A necessary evil.",
   pitch:"Gets you intel: +1 favor and the Organization loses interest in you. He's unpredictable and sometimes goes off script. Never more than $100K, and only four favors a day."},
];

/**
 * What Seymour wants instead of full price: time with Michael. Each is a little odd, and he's thrilled.
 * `lines` are what happens; he always wants one more story.
 */
export const SEYMOUR_HANGOUTS: { ask: string; story: string }[] = [
  {ask: "teach him how to kick a door in properly", story: "Seymour wants to learn the door kick. He's loud about it, and it takes eleven tries. He insists on a handshake afterward."},
  {ask: "walk him through how you tail someone", story: "Seymour has opinions about how to follow a man down a street. Most of them involve a hat. You gently talk him out of the hat."},
  {ask: "come see his new storage unit", story: "Seymour's storage unit is full of things he's very proud of. You nod at every one. Some of them are legal."},
  {ask: "be his plus-one at a very strange party", story: "The party has a theme. Seymour is the only one who understands it. You leave with a business card for a man named Dmitri."},
  {ask: "teach him a few 'spy moves' for the mirror", story: "Seymour practices the spin-and-draw in your loft. The lamp does not survive. He says it's worth it."},
];
