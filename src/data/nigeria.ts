import type { Arc, Boss } from "../types";
import type { FlashbackAct, FlashbackDef } from "./flashbacks";

/**
 * Nigeria: the night Michael was burned, told to Sam at a bar with Sam's running commentary.
 * What the show gives us is short: Michael was paying off a warlord, his CIA contact said the mission was off and he'd been
 * burned, the warlord beat him badly, he got to an airport, and he woke up in Miami with nothing. Everything between those
 * points is written for the game.
 */
export const NIGERIA_ID = "nigeria";

export const NIGERIA_ACTS: FlashbackAct[] = [
  {
    title: "Act One: The Drop",
    inquiry: "Sam leans on the bar. \"So, Mikey. Nigeria. You never told me what happened in Nigeria?? Hey! Another mojito over here!\"",
    prompt: "He wants to know how the night started. How does Michael tell the job?",
    options: [
      { label: "Routine. A payoff and a handshake", result: "Sam nods like a man who has heard the word \"routine\" before. \"Nothing in Nigeria is routine, Mikey.\" He's right, and the whole bar can tell.", fx: { succ: 0.03 } },
      { label: "Admit he had a bad feeling", result: "\"You had a bad feeling and you went anyway?\" Sam is delighted. \"That's the most Michael thing I've ever heard.\" He buys the next round.", fx: { att: -0.05 } },
    ],
  },
  {
    title: "Act Two: The Warlord",
    inquiry: "Sam holds up two fingers for the bartender. \"So you're standing there with a warlord who's out a lot of money and has no reason to like you. Go on.\"",
    prompt: "How does Michael handle the man he came to pay?",
    options: [
      { label: "Talk fast, and promise anything", result: "Sam grins. \"I'd have done the same, except louder.\" Michael talked his way into ten more minutes. That counts.", fx: { inc: 0.04 } },
      { label: "Say nothing and wait for an opening", result: "\"Patience,\" says Sam, \"is just fear that's good at its job.\" He doesn't know where he got that line either.", fx: { heat: -0.05 } },
    ],
  },
  {
    title: "Act Three: The Run",
    inquiry: "Sam sets his drink down, for once. \"And then the airport. Mikey, tell me you made it to the airport.\"",
    prompt: "How does Michael tell the last stretch?",
    options: [
      { label: "A car, a ditch, and a lot of luck", result: "\"A ditch,\" Sam repeats, delighted. \"The man who finds a way out of everything, and it's a ditch.\" He raises his glass to the ditch.", fx: { mis: 0.04 } },
      { label: "Running, mostly", result: "\"Running,\" says Sam. \"Brave man. I'd have bought a plane.\" The bar laughs. Michael, grudgingly, almost does too.", fx: { favors: 6 } },
    ],
  },
];

export const NIGERIA_BEATS: Record<number, FlashbackAct> = {
  1: {
    title: "Act One, Continued: The Call",
    inquiry: "Sam waves the bartender back. \"And then the phone rings. Of course the phone rings.\"",
    prompt: "What does Michael say his contact told him?",
    options: [
      { label: "Straight: the mission was off, and so was he", result: "Sam stops stirring his drink. \"That's it? Just like that?\" \"Just like that,\" you say. He puts the glass down, which for Sam is a sign of respect.", fx: { heat: -0.03 } },
      { label: "With a very long pause", result: "\"Take your time, Mikey. I've got all night and a tab.\" The pause works. The bar leans in.", fx: { inc: 0.02 } },
    ],
  },
  3: {
    title: "Act Two, Continued: Get Out Alive",
    inquiry: "Sam winces. \"The warlord. He wasn't happy about the money, was he?\"",
    prompt: "How bad does Michael say it got?",
    options: [
      { label: "Not that bad", result: "\"Mikey, you were in a ditch.\" \"It was a very nice ditch.\" Sam closes his eyes and lets that one go.", fx: { att: -0.03 } },
      { label: "Exactly as bad as it was", result: "Sam is quiet for a second, which almost never happens. Then he slides a fresh glass across the bar. \"Drink that. It's on me.\"", fx: { succ: 0.03 } },
    ],
  },
};

const WARLORD: Boss = {
  id: "warlord", n: "The Warlord", title: "A Nigerian warlord who paid for a deal that never happened and wants it back from the man in front of him", at: 0, hpm: 2.2, m: ["rush"], flashback: true,
  mech: "Make it to the airport: the clock runs 50% faster, and he is not slowing down.",
  intro: "Make it to the airport!!! The warlord's trucks are on the road behind you, and the plane doesn't wait for anyone.",
  win: "Michael makes the airport, a plane, and a seat with a poor view. He passes out before takeoff and wakes up in Miami.",
  lose: "The trucks close the gap. Michael finds a way across a field and tries again.",
  file: "A Nigerian warlord who was promised a payment that never arrived. He was paid in promises by a man who had already been burned, and he took it out on the man who was there. Little is known about him; he never gave his name to someone he was about to beat.",
};

export const NIGERIA_ARC: Arc = {
  id: NIGERIA_ID, title: "Nigeria", at: 2e4, ally: "sam", favors: 4, needsEp: "101", orSeason: 2,
  blurb: "Sam has been needling you for months. Tonight he's buying: a mojito, a barstool, and the whole story of the night Michael was burned in Nigeria.",
  epilogue: "Michael woke up in Miami with no money, no job and a burn notice he had never been shown. Sam finishes his drink. \"So that's the whole story?\" \"That's the whole story.\" \"Mikey. We are going to need another round.\"",
  steps: [
    { n: "Make the Drop", dur: 45, succ: 0.8, heat: 8, rm: 2.0, act: 0 },
    { n: "Take the Call", dur: 40, succ: 0.85, heat: 6, rm: 2.0 },
    { n: "Face the Warlord", dur: 55, succ: 0.7, heat: 14, rm: 3.0, act: 1 },
    { n: "Get Out Alive", dur: 50, succ: 0.72, heat: 12, rm: 3.2 },
    { n: "Make It to the Airport!!!", dur: 60, succ: 0.65, heat: 18, rm: 4.0, act: 2, boss: "warlord" },
  ],
};

export const NIGERIA_FLASHBACK: FlashbackDef = {
  id: NIGERIA_ID,
  title: "Nigeria",
  teller: "Michael",
  arc: NIGERIA_ARC,
  acts: NIGERIA_ACTS,
  beats: NIGERIA_BEATS,
  bridge: {
    title: "The Last Mile",
    scene: "The road runs straight to the airport, and not one thing on it is on Michael's side. Behind him, engines. Ahead, a runway with a plane on it that he doesn't have a ticket for. His ribs have opinions. The only plan left is the oldest one.",
    go: "Run",
    result: "Michael runs.",
  },
  nod: {
    label: "Order Sam another mojito",
    title: "Another Mojito",
    text: "Sam raises two fingers at the bartender. The story goes down easier, and he stops interrupting for a whole minute (+8% on Step 1).",
    say: "Sam gets his mojito. The man makes noises of contentment and shuts up. It won't last.",
    succ: 0.08,
    portrait: "sam",
  },
  bosses: [WARLORD],
  speed: 0.5,
  paper: false,
  menuId: "nigeria",
  menuTitle: "Nigeria",
  pausedTitle: "Michael is telling Sam about Nigeria.",
  pausedText: "Everything else waits: no new cases, no clients, no visitors, and your other jobs and the Organization hold still until he's finished the story.",
  offer: () => ({
    title: "Sam wants a story",
    text: "Sam has been needling you for a while. \"Nigeria, Mikey. You never told me what happened in Nigeria.\" He's already ordered you a mojito. Nigeria is now an Open Case.",
    say: "Sam pushes a mojito across the bar and raises an eyebrow. \"Go on.\"",
  }),
  replay: {
    title: "Michael tells it again",
    text: "Sam is already waving at the bartender. \"Nigeria, Mikey. From the top.\" Everything else waits until you're done, and this time you can tell it differently. The favors and the medal were yours the first time.",
    say: "Sam settles in. He's been waiting for the second telling.",
  },
  retry: step => ({
    title: "Sam interrupts",
    text: `Sam puts his drink down. "Wait, wait. You skipped a part. Back up to \\"${step}\\", Mikey." The step is yours to try again, and it won't open with a new question.`,
  }),
  replayHelp: "Everything else waits while you tell it, and your answers can change. The favors and the medal were yours the first time.",
};
