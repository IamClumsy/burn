import type { Arc, Boss } from "../types";
import type { FlashbackAct, FlashbackDef } from "./flashbacks";

/**
 * Nigeria: the night Michael was burned, told to Sam at a bar with Sam's running commentary.
 * The outline comes from the Pilot: in Warri, Michael is a courier for a bribe from the oil companies to Boris, a wannabe
 * warlord whose men have been attacking offshore rigs. Calling to finish the wire transfer, he's told he's been burned.
 * Boris's men beat him, he lies his way up off the floor, gets away from two of them in a hotel bathroom, steals a
 * motorcycle, leads the chase into a crowded market, makes the airport and collapses on a plane. Everything is written
 * for the game in its own words; Sam's commentary is ours.
 */
export const NIGERIA_ID = "nigeria";

export const NIGERIA_ACTS: FlashbackAct[] = [
  {
    title: "Act One: The Drop",
    inquiry: "Sam leans on the bar. \"So, Mikey. Nigeria. The gun-running capital of Africa, the one place I'd never take a vacation, and you never told me what happened there?? Hey! Another mojito over here!\"",
    prompt: "He wants to know how the night started. You were carrying a bribe from the oil companies to a wannabe warlord named Boris, whose men had been hitting oil rigs. How does Michael tell it?",
    options: [
      { label: "Routine. A courier job and a bag of money", result: "Sam nods like a man who has heard the word \"routine\" before. \"Nothing in Warri is routine, Mikey.\" He's right, and the whole bar can tell.", fx: { succ: 0.03 } },
      { label: "Armed men on a street corner, and \"Mr. CIA\" the whole ride", result: "\"Mr. CIA,\" Sam repeats, delighted. \"Like it's a nickname. Did you at least tip?\" The bar wants to know what happened next.", fx: { att: -0.05 } },
    ],
  },
  {
    title: "Act Two: Boris",
    inquiry: "Sam holds up two fingers for the bartender. \"So you're on a hotel floor with a wannabe warlord who's out his bribe, holding a gun, and his guys are doing what guys like that do. Go on.\"",
    prompt: "How does Michael talk his way back onto his feet?",
    options: [
      { label: "Lie, with confidence: he knows where the money is", result: "\"That's the best lie I've ever heard,\" says Sam, \"and I've heard you lie to your mother.\" Michael talked his way into ten more minutes. That counts.", fx: { inc: 0.04 } },
      { label: "Say nothing, take it, and wait for a gap", result: "\"Patience,\" says Sam, \"is just fear that's good at its job.\" He doesn't know where he got that line either.", fx: { heat: -0.05 } },
    ],
  },
  {
    title: "Act Three: The Run",
    inquiry: "Sam sets his drink down, for once. \"And then the airport. Tell me about the market, Mikey. I want to hear about the market.\"",
    prompt: "How does Michael tell the chase?",
    options: [
      { label: "A motorcycle, a market, and a crowd that was armed", result: "\"In the gun-running capital of Africa,\" says Sam slowly, \"the crowd had guns. Of course the crowd had guns.\" He raises his glass to the crowd.", fx: { mis: 0.04 } },
      { label: "Running, mostly, and then the plane", result: "\"Business class,\" says Sam, \"I hope. Bigger seats if you start convulsing.\" The bar laughs. Michael, grudgingly, almost does too.", fx: { favors: 6 } },
    ],
  },
];

export const NIGERIA_BEATS: Record<number, FlashbackAct> = {
  1: {
    title: "Act One, Continued: The Call",
    inquiry: "Sam waves the bartender back. \"And then you call to finish the wire transfer. Tell me it doesn't go the way I think it goes.\"",
    prompt: "What does the man on the other end of the line say?",
    options: [
      { label: "Straight: a burn notice, and he's blacklisted", result: "Sam stops stirring his drink. \"That's it? In the middle of a wire transfer?\" \"In the middle of a wire transfer,\" you say. He puts the glass down, which for Sam is a sign of respect.", fx: { heat: -0.03 } },
      { label: "With a very long pause, and a sheepish laugh", result: "\"Take your time, Mikey. I've got all night and a tab.\" Michael laughed, sheepishly, at a man holding a gun. Sam asks whether that worked. It did not.", fx: { inc: 0.02 } },
    ],
  },
  3: {
    title: "Act Two, Continued: The Bathroom",
    inquiry: "Sam winces. \"Hold on. You told two armed guys you were going to be sick? In a hotel lobby?\"",
    prompt: "How does Michael tell what happened in the bathroom?",
    options: [
      { label: "Lots of hard surfaces, and he used all of them", result: "Sam looks at his glass, then at Michael's hands. \"Remind me never to be a bathroom,\" he says, quietly.", fx: { succ: 0.03 } },
      { label: "A very nice bathroom, really", result: "\"Mikey, you were in a bathroom.\" \"It was a very nice bathroom.\" Sam closes his eyes and lets that one go.", fx: { att: -0.03 } },
    ],
  },
};

const BORIS: Boss = {
  id: "boris", n: "Boris", title: "A wannabe warlord whose men have been attacking oil rigs, and who wants the money he was promised", at: 0, hpm: 2.2, m: ["rush"], flashback: true,
  mech: "Make it to the airport: the clock runs 50% faster, and his men are not slowing down.",
  intro: "Make it to the airport!!! Boris's men are on the road behind you, and the plane doesn't wait for anyone.",
  win: "The crowd in the market has its own opinions about armed men and a car. Michael gets to the airport, and onto a plane, before he passes out.",
  lose: "The cars close the gap. Michael finds a back road, and tries again.",
  file: "A self-styled warlord in southern Nigeria whose men had been attacking offshore oil rigs. The bribe that was meant to buy them off never arrived, because the man carrying it had just been burned. Michael's last memory of him is a gun and a demand for his money.",
};

export const NIGERIA_ARC: Arc = {
  id: NIGERIA_ID, title: "Nigeria", at: 2e4, ally: "sam", favors: 4, needsEp: "101", orSeason: 2,
  blurb: "Sam has been needling you for months. Tonight he's buying: a mojito, a barstool, and the whole story of the night Michael was burned in Nigeria, the gun-running capital of Africa, where nobody walks in unarmed.",
  epilogue: "Michael woke up in a Miami motel with no money, no job and a burn notice he had never been shown. Fiona was sitting on the end of the bed. Sam finishes his drink. \"Wait. Fiona was there? Mikey, the girl shows up and you still didn't call me?\" \"I couldn't call anyone.\" \"We are going to need another round.\"",
  steps: [
    { n: "Make the Drop", dur: 45, succ: 0.8, heat: 8, rm: 2.0, act: 0 },
    { n: "Take the Call", dur: 40, succ: 0.85, heat: 6, rm: 2.0 },
    { n: "Face Boris", dur: 55, succ: 0.7, heat: 14, rm: 3.0, act: 1 },
    { n: "Get Out Alive", dur: 50, succ: 0.72, heat: 12, rm: 3.2 },
    { n: "Make It to the Airport!!!", dur: 60, succ: 0.65, heat: 18, rm: 4.0, act: 2, boss: "boris" },
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
    scene: "The road to the airport is one long argument. Behind him, an engine, then two. Ahead, a market in full cry and a runway with a plane on it that he doesn't have a ticket for. His ribs have opinions. The plan is old and simple: be somewhere the other guys can't drive.",
    go: "Ride",
    result: "Michael rides.",
  },
  nod: {
    label: "Order Sam another mojito",
    title: "Another Mojito",
    text: "Sam raises two fingers at the bartender. The story goes down easier, and he stops interrupting for a whole minute (+8% on Step 1).",
    say: "Sam gets his mojito. The man makes noises of contentment and shuts up. It won't last.",
    succ: 0.08,
    portrait: "sam",
  },
  bosses: [BORIS],
  speed: 0.5,
  paper: false,
  menuId: "nigeria",
  menuTitle: "Nigeria",
  pausedTitle: "Michael is telling Sam about Nigeria.",
  pausedText: "Everything else waits: no new cases, no clients, no visitors, and your other jobs and the Organization hold still until he's finished the story.",
  offer: () => ({
    title: "Sam wants a story",
    text: "Sam has been needling you for a while. \"Nigeria, Mikey. The gun-running capital of Africa, and you never told me what happened.\" He's already ordered you a mojito. Nigeria is now an Open Case.",
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
