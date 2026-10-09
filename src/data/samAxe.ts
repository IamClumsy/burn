import type { Arc, Boss, ChoiceFx } from "../types";

/**
 * The Fall of Sam Axe: the prequel movie, set in Colombia in 2005, as Sam tells it at a Navy inquiry.
 * It's a seven-step Open Case in four acts. Each act opens with Admiral Lawrence's questions and a choice about
 * how Sam tells it, and the last step is a showdown with the militia commander. Everything here is written
 * for the game from the film's story; none of it is quoted from the film.
 */
export const SAM_ARC_ID = "samfall";

export interface SamAct {
  title: string;
  /** Admiral Lawrence at the inquiry, setting up the act. */
  inquiry: string;
  prompt: string;
  options: { label: string; result: string; fx: ChoiceFx }[];
}

export const SAM_ACTS: SamAct[] = [
  {
    title: "Act One: The Window",
    inquiry: "Admiral Lawrence says this is an informal inquiry, then asks how a bedroom window and a borrowed belt come to be part of a military operation.",
    prompt: "Sam says he's getting to it. How does he tell the first part?",
    options: [
      { label: "Own it, with a joke", result: "The Admiral doesn't laugh. A junior officer almost does. Sam counts that as a win, and the room cools a little.", fx: { heat: -0.05 } },
      { label: "Blame Michael's advice", result: "Michael isn't in the room to defend himself, which makes it very satisfying. Word travels, and it pays off in a small way.", fx: { inc: 0.03 } },
    ],
  },
  {
    title: "Act Two: The Goat Farmers",
    inquiry: "The Admiral points out that Sam's report says a clinic was blown up with a bomb made from a defibrillator, and wants to know why anyone would do that.",
    prompt: "Sam leans in. What does he say about the clinic?",
    options: [
      { label: "It saved every patient inside", result: "Sam's version of the clinic is hard to argue with: everyone got out. The Organization pays a little less attention to a man with that story.", fx: { att: -0.1 } },
      { label: "Ben did most of the work", result: "Ben Delaney gets a good deal of credit, and a sympathetic nod from the Admiral. Credit like that pays forward, in better cases.", fx: { mis: 0.1 } },
    ],
  },
  {
    title: "Act Three: The Outpost",
    inquiry: "The Admiral says the villagers were nothing but goat herders with a nickname for Sam. Sam says that's exactly right, and asks if he may continue.",
    prompt: "He mentions the outpost and the satellite phone. How does he play the CIA men?",
    options: [
      { label: "A bluff, straight-faced", result: "Sam says he never raised his voice. Nobody believes him, but the plan worked, and your next jobs are easier for it.", fx: { succ: 0.03 } },
      { label: "A show of force, a few shots into the wall", result: "Sam says a warning shot is just a very loud sentence. The Admiral writes it down. It's the kind of story that gets around.", fx: { inc: 0.04 } },
    ],
  },
  {
    title: "Act Four: The Road",
    inquiry: "The Admiral says the story can only end one way: with a court-martial. Sam says he left one part out, in case the Admiral chose to do the honorable thing.",
    prompt: "A young woman, a borrowed camera, and a governor with powerful friends. Does Sam play his last card?",
    options: [
      { label: "Lay down Beatriz's photographs", result: "The pictures show the Governor and his friends being arrested. The Admiral goes very quiet, and the favors owed to you go up.", fx: { favors: 8 } },
      { label: "Accept whatever comes", result: "Sam says he'd do it all again, and the Admiral, to nobody's surprise, finds that more persuasive than any evidence. Your name is better for it.", fx: { inc: 0.05 } },
    ],
  },
];

/** The Open Case. The acts start at steps 0, 3, 5 and 6; the last step is the showdown. */
export const SAM_ARC: Arc = {
  id: SAM_ARC_ID, title: "The Fall of Sam Axe", at: 5e8, ally: "sam", favors: 12,
  // Beatriz, the girl from the movie, turns up in Depth Perception (Season 5, Episode 16). That's when Sam tells the story.
  needsEp: "516", orSeason: 6,
  blurb: "At a Navy inquiry in Bogotá, Sam Axe tells the story of the worst assignment of his career. It starts with a married woman, a bedroom window, and a pair of bright blue fatigues.",
  epilogue: "Sam's story is on the record. The clinic's patients are alive, the Governor is under arrest, a village of goat farmers has a nickname for the man with the chin, and Admiral Lawrence is still deciding whether he's allowed to enjoy it.",
  steps: [
    { n: "Make a Hasty Exit From Virginia", dur: 60, succ: 0.78, heat: 14, rm: 4.2, act: 0 },
    { n: "Warn a Clinic Nobody Will Evacuate", dur: 72, succ: 0.7, heat: 20, rm: 5.2 },
    { n: "Blow Up a Clinic to Save Its Patients", dur: 84, succ: 0.64, heat: 26, rm: 6.0 },
    { n: "Hide Among the Goat Farmers", dur: 70, succ: 0.7, heat: 18, rm: 5.4, act: 1 },
    { n: "Borrow the Enemy's Satellite Phone", dur: 76, succ: 0.64, heat: 24, rm: 6.0 },
    { n: "Take the CIA Outpost", dur: 90, succ: 0.6, heat: 28, rm: 6.6, act: 2 },
    { n: "Hold the Road Against Commandante Veracruz", dur: 90, succ: 0.6, heat: 30, rm: 7.0, act: 3, boss: "veracruz" },
  ],
};

/** The one-off boss of the flashback. He's never on the List and never turns up on his own. */
export const FLASHBACK_BOSSES: Boss[] = [
  {id: "veracruz", n: "Commandante Veracruz", title: "A militia commander on a governor's payroll, hunting a Navy man and a village of goat farmers", at: 5e8, hpm: 3.4, m: ["rush", "heat"], flashback: true,
   mech: "A convoy on a deadline: the clock runs 50% faster, and every hour he's on the road makes more noise.",
   intro: "Commandante Veracruz is coming down the mountain with every truck he can find, and he has a governor behind him. Sam has until the help arrives, a road, and a village that believes in him.",
   win: "The convoy stalls on the road, help arrives from the south, and Commandante Veracruz finds out what a goat farmer with a rifle and a grudge can do.",
   lose: "Veracruz gets through the road. Sam pulls everyone back, takes a breath, and plans another way to hold it.",
   file: "Colonel Veracruz led a local militia in Colombia and told the world a story: a clinic burned by terrorists who had kidnapped a Navy observer. The 'terrorists' were goat farmers, and the observer was Sam Axe. He answered to a governor who was on a cartel's payroll, and he was losing his patience with them both."},
];
