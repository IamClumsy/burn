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
 * The intel contact changes with the story, in the one slot (the id stays "simon" so old saves line up):
 * Victor Stecker-Epps early on, until the Season 2 finale; Simon Escher from Season 3 (he turns up in
 * "Devil You Know") until his death in Season 7 ("Tipping Point"); then Dani Pearce, writing from Mumbai.
 */
export const INTEL_STAGES = { victor: 0, simon: 1, pearce: 2 } as const;

const VICTOR_CONTACT: Contact = {
  id:"simon", name:"Victor Stecker-Epps", kind:"Intel favors",
  bio:"A burned CIA officer who wound up working Miami for the Organization, and who says he's your wrangler. He plays chess with a gun under the table. He's cold, clever and dangerous, and he knows exactly who has been pulling your strings. A friend only in the sense that you want him where you can see him. A necessary evil.",
  pitch:"Gets you intel: +1 favor and the Organization loses interest in you. He's unpredictable and sometimes goes off script. Never more than $100K, and only four favors a day.",
};
const PEARCE_CONTACT: Contact = {
  id:"simon", name:"Dani Pearce", kind:"Intel favors",
  bio:"The CIA officer who came to Miami to find a killer and stayed to keep Michael honest. Transferred to a quiet post in Mumbai, she still picks up when he calls, and she still knows who's looking for you. A friend, on her terms.",
  pitch:"Gets you intel: +1 favor and the Organization loses interest in you. She's steadier than the others were, and only occasionally pulls rank. Never more than $100K, and only four favors a day.",
};

/** The intel contact as the game should show them right now. */
export const contactFor = (c: Contact, stage: number): Contact =>
  c.id !== "simon" ? c : stage <= 0 ? VICTOR_CONTACT : stage === 1 ? c : PEARCE_CONTACT;
/** Whose face goes with the contact. */
export const contactFace = (id: string, stage: number): string =>
  id !== "simon" ? id : stage <= 0 ? "victor" : stage === 1 ? "simon" : "pearce";

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
