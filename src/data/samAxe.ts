import type { Arc, Boss, ChoiceFx } from "../types";
import type { FlashbackAct, FlashbackDef } from "./flashbacks";

/**
 * The Fall of Sam Axe: the prequel movie, set in Colombia in 2005, as Sam tells it at a Navy inquiry.
 * It's a seven-step Open Case in four acts. Each act opens with Admiral Lawrence's questions and a choice about
 * how Sam tells it, and the last step is a showdown with the militia commander. Everything here is written
 * for the game from the film's story; none of it is quoted from the film.
 */
export const SAM_ARC_ID = "samfall";

/** Admiral Lawrence at the inquiry sets up each act. */
export type SamAct = FlashbackAct;

export const SAM_ACTS: SamAct[] = [
  {
    title: "Act One: The Window",
    inquiry: "Admiral Lawrence says this is an informal inquiry, then asks how a bedroom window and a belt left behind come to be part of a military operation.",
    prompt: "Sam says he's getting to it. How does he tell the first part?",
    options: [
      { label: "Own it, with a joke", result: "The Admiral doesn't laugh. A junior officer almost does. Sam counts that as a win, and the room cools a little.", fx: { heat: -0.05 } },
      { label: "Admit Michael had it right", result: "Michael isn't in the room to say \"I told you so\", which is the only reason Sam can say it first. He told him to confess before the wife did. Word travels, and it pays off in a small way.", fx: { inc: 0.03 } },
    ],
  },
  {
    title: "Act Two: The Goat Farmers",
    inquiry: "The Admiral points out that Sam's report says a clinic was blown up with a bomb made from a defibrillator, and wants to know why anyone would do that.",
    prompt: "Sam leans in. What does he say about the clinic?",
    options: [
      { label: "It saved every patient: they were on the trucks", result: "Sam's version of the clinic is hard to argue with: everyone got out. The Organization pays a little less attention to a man with that story.", fx: { att: -0.1 } },
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

/** The beat between Act Four's answer and the showdown: the road empties and the engines get louder. */
export const SAM_BRIDGE = {
  title: "The Road",
  scene: "The sound reaches the village before the trucks do: engines, far off and coming fast. The goat farmers have taken their places, the clinic is a long way behind them, and Sam stands in the middle of a dirt road with no plan he'd admit to in front of an Admiral. Commandante Veracruz is coming down the mountain with every truck he can find.",
  go: "Hold the road",
};

/** The steps between acts: the Admiral cuts in, and Sam answers. Smaller choices than the acts, with smaller effects. */
export const SAM_BEATS: Record<number, { title: string; inquiry: string; prompt: string; options: { label: string; result: string; fx: ChoiceFx }[] }> = {
  1: {
    title: "Act One, Continued: The Clinic",
    inquiry: "The Admiral says the report mentions a clinic in a small town with a good deal of fear and very little help.",
    prompt: "He asks what Sam thought he could do about it. How did Sam get the word out?",
    options: [
      { label: "Door to door, politely", result: "The Admiral notes that Sam is, if nothing else, polite. A little goodwill follows you around.", fx: { att: -0.05 } },
      { label: "With a megaphone", result: "Everyone in the district heard it, including a few people who'll pay for the information later.", fx: { inc: 0.02 } },
    ],
  },
  2: {
    title: "Act One, Continued: The Clinic Again",
    inquiry: "The Admiral puts down his pen. Nobody would leave the clinic, he says.",
    prompt: "So how did Sam make sure the patients were safe? Who gets the credit?",
    options: [
      { label: "The plan did, mostly", result: "Sam says he never doubted it. The Admiral doubts it enough for both of them, then writes \"successful\" anyway.", fx: { succ: 0.02 } },
      { label: "The clinic's own staff", result: "The nurses get a mention, and the Admiral looks up for the first time. A good word travels.", fx: { mis: 0.05 } },
    ],
  },
  4: {
    title: "Act Two, Continued: The Satellite Phone",
    inquiry: "The Admiral says there is a note in the file about a stolen satellite phone, and he would very much like Sam to account for it.",
    prompt: "How does Sam say he came by it?",
    options: [
      { label: "He asked nicely first", result: "He did not, but he says he did, and the Admiral lets it go. Fewer people are looking at you.", fx: { heat: -0.03 } },
      { label: "He stole it, and he's sorry", result: "\"Sorry\" is a strong word. The Admiral writes down \"regrets\", then underlines \"phone\".", fx: { inc: 0.02 } },
    ],
  },
};

/** The Open Case. The acts start at steps 0, 3, 5 and 6; the last step is the showdown. */
export const SAM_ARC: Arc = {
  id: SAM_ARC_ID, title: "The Fall of Sam Axe", at: 0, ally: "sam", favors: 12,
  // Beatriz, the girl from the movie, turns up in Depth Perception (Season 5, Episode 16). That's when Sam tells the story.
  needsEp: "516", orSeason: 6,
  blurb: "At a Navy inquiry in Bogotá, Sam Axe tells the story of the worst assignment of his career. It starts with a married woman, a bedroom window, and a pair of bright blue fatigues.",
  epilogue: "Sam's story is on the record. The clinic's patients are alive, the Governor is under arrest, a village of goat farmers has a nickname for the man with the chin, and Admiral Lawrence, who was never going to enjoy this, has agreed to an honorable discharge, a first-class ticket and one ice-cold beer.",
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
   win: "The convoy stalls on the road. When the helicopters rise behind Sam, Commandante Veracruz pulls a knife and finds out what a Navy SEAL can do in a stand-up fight. It takes one punch.",
   lose: "Veracruz gets through the road. Sam pulls everyone back, takes a breath, and plans another way to hold it.",
   file: "Colonel Veracruz led a local militia in Colombia and told the world a story: a clinic burned by terrorists who had kidnapped a Navy observer. The 'terrorists' were goat farmers, and the observer was Sam Axe. He answered to a governor who was on a cartel's payroll, and he was losing his patience with them both."},
];

/** Sam remembers the bowling alley (Michael's cameo in the movie), a small nod before Act One. */
export const BOWLING = {
  title: "The Bowling Alley",
  text: "Before any of it, Sam remembers a bowling alley and a younger, scruffier Michael (Sam calls him Mike), back from a mission and in town for a few days, who told him to confess to the Admiral before the wife did. Sam pointed out that Michael had dated exactly one woman, and she was a psycho. Michael was right. A good friend's advice makes the first step a little easier, even when you ignored it (+8% on Step 1).",
  say: "Sam stares at a bowling ball and remembers Michael's advice. He'd have been better off taking any of it.",
  succ: 0.08,
};

/** The Fall of Sam Axe as a registered flashback. */
export const SAM_FLASHBACK: FlashbackDef = {
  id: SAM_ARC_ID,
  title: "The Fall of Sam Axe",
  teller: "Sam",
  arc: SAM_ARC,
  acts: SAM_ACTS,
  beats: SAM_BEATS,
  bridge: { ...SAM_BRIDGE, result: "Sam holds the road." },
  nod: { label: "Remember Mike at the bowling alley", portrait: "michaelpre", ...BOWLING },
  bosses: FLASHBACK_BOSSES,
  speed: 0.5,
  paper: true,
  menuId: "fosa",
  menuTitle: "The Fall of Sam Axe",
  pausedTitle: "Sam is telling his story.",
  pausedText: "Everything else waits: no new cases, no clients, no visitors, and your other jobs and the Organization hold still until he finishes.",
  offer: s => (s.episodesDone["516"]
    ? { title: "Sam has a story", text: "Beatriz is safe, and Sam goes quiet in the way he does when a name from long ago turns up. \"I met her in Colombia,\" he says. \"Pull up a chair. It's the worst assignment of my career, and I'm going to tell you all of it.\" The Fall of Sam Axe is now an Open Case.", say: "Sam clears his throat. This is going to take a while, and he's ordering a drink first." }
    : { title: "Sam has a story", text: "Sam has been saving a story for a long time. \"Colombia, 2005,\" he says. \"Pull up a chair.\" The Fall of Sam Axe is now an Open Case.", say: "Sam clears his throat. This is going to take a while, and he's ordering a drink first." }),
  replay: {
    title: "Sam tells it again",
    text: "\"Colombia, 2005,\" says Sam, and orders a drink. Everything else waits until he's done. The Fall of Sam Axe is an Open Case again, and this time you can answer the Admiral differently. The favors and prizes were yours the first time.",
    say: "Sam clears his throat. He's been waiting for someone to ask.",
  },
  retry: step => ({
    title: "The Admiral isn't convinced",
    text: `"That isn't how I read the report, Commander. Take it from \"${step}\" again." The step is yours to try again, and it won't open with a new question.`,
  }),
  replayHelp: "Everything else waits while Sam tells it, and your answers can change. The favors, the medal and the cover were yours the first time.",
};
