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
 * Simon dies in Season 7 ("Tipping Point"). After that, his slot is taken by Dani Pearce, who passes
 * intel from her post in Mumbai: the same favors, a steadier hand. (The id stays "simon" so saves still line up.)
 */
export const PEARCE_CONTACT: Contact = {
  id:"simon", name:"Dani Pearce", kind:"Intel favors",
  bio:"The CIA officer who came to Miami to find a killer and stayed to keep Michael honest. Transferred to a quiet post in Mumbai, she still picks up when he calls, and she still knows who's looking for you. A friend, on her terms.",
  pitch:"Gets you intel: +1 favor and the Organization loses interest in you. She's steadier than Simon was, and only occasionally pulls rank. Never more than $100K, and only four favors a day.",
};

/** The contact as the game should show them right now (Pearce, once Simon is gone). */
export const contactFor = (c: Contact, simonEnded: boolean): Contact => (c.id === "simon" && simonEnded ? PEARCE_CONTACT : c);
/** Whose face goes with the contact. */
export const contactFace = (id: string, simonEnded: boolean): string => (id === "simon" && simonEnded ? "pearce" : id);

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
