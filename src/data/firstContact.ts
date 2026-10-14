import type { Arc } from "../types";
import type { FlashbackAct, FlashbackDef } from "./flashbacks";

/**
 * First Contact: how Michael met Fiona, told at the bar on Jesse's birthday with Sam and Jesse listening. Michael starts,
 * Fiona takes over, and every question offers the same moment twice: Michael's version, which is smooth and a little
 * fuzzy, and Fiona's, which is what happened. The outline comes from the third A New Day comic (Dublin and Belfast,
 * 2003: a bug in a snow globe, photographs of a robbery, a warehouse job, a firefight at a farm). Everything is written
 * for the game in its own words.
 */
export const FIRSTCONTACT_ID = "firstcontact";

export const FIRSTCONTACT_ACTS: FlashbackAct[] = [
  {
    title: "Act One: The Snow Globe",
    inquiry: "Jesse raises a glass. \"Happy birthday to me, so tell me a story. How did you two actually meet?\" Michael leans back. Fiona, two stools down, is already smiling like she knows how this goes.",
    prompt: "Dublin, 2003. Michael was a CIA operative sent to get close to a gun dealer's circle, and Fiona's flat was the way in. How does the story start?",
    options: [
      { label: "Michael: a clean entry and a quiet bug in a snow globe", result: "\"Textbook,\" says Michael. Sam nods. Jesse nods. Fiona lets him have it for almost four seconds. \"He was in my flat,\" she says, \"holding a snow globe.\"", fx: { succ: 0.03 } },
      { label: "Fiona: caught him at it, and the gun was in his face", result: "\"He's leaving out the part where I had him at the end of a barrel,\" says Fiona. \"It was a very good bug, though,\" Michael says, and she has to admit it.", fx: { att: -0.05 } },
    ],
  },
  {
    title: "Act Two: Leverage",
    inquiry: "Sam signals for a second round. \"Okay, so she catches you. And you don't leave, you don't get shot. How does that work, Mikey?\"",
    prompt: "A woman who just caught a spy in her flat has a crew and a robbery planned. What does Michael do with that?",
    options: [
      { label: "Michael: he made her an offer, and she took it", result: "\"An arrangement,\" says Michael. \"Photographs,\" says Fiona. \"He took photographs of my friends mid-job and then called it an arrangement.\" Jesse laughs so hard he has to put his drink down.", fx: { inc: 0.04 } },
      { label: "Fiona: he had the pictures, and she let him think that was enough", result: "\"I was already thinking about the money,\" says Fiona, \"and the man he wanted. I just let him believe he was in charge.\" Michael doesn't argue, which for Michael is a statement.", fx: { heat: -0.05 } },
    ],
  },
  {
    title: "Act Three: War Zone",
    inquiry: "Sam sets his glass down. \"There's a car in this story, isn't there? There is always a car in your stories.\" Fiona's eyes light up. Michael closes his.",
    prompt: "A farm outside Belfast, a deal gone wrong, and a very old sedan. How does it end?",
    options: [
      { label: "Michael: a controlled exit, one clean jump", result: "\"Controlled,\" says Fiona. \"It was a car, Michael. It flew. It wasn't built to fly. Nobody planned that.\" Michael looks at the ceiling. \"It landed fine,\" he says.", fx: { mis: 0.04 } },
      { label: "Fiona: make it up as you go, and go faster", result: "\"We didn't have a plan,\" says Fiona, \"and that's why it worked.\" Jesse raises his glass. Sam raises two. Michael, finally, almost admits it.", fx: { favors: 6 } },
    ],
  },
];

export const FIRSTCONTACT_BEATS: Record<number, FlashbackAct> = {
  1: {
    title: "Act One, Continued: The Offer",
    inquiry: "Jesse leans in. \"Wait, so she's got a gun on you and you're in her flat. What do you say?\"",
    prompt: "How does Michael tell the next ten seconds?",
    options: [
      { label: "Michael: calmly, with a plan", result: "\"I'd say I stayed calm,\" says Michael. \"You said 'hello,'\" says Fiona. \"Very calmly. In the wrong accent.\" Sam tries to cough and fails.", fx: { heat: -0.03 } },
      { label: "Fiona: he stood there and let her talk", result: "\"I did most of the talking,\" says Fiona. \"He had a lot of the right instincts. Not many of the right answers.\" Michael nods once. It's fair.", fx: { inc: 0.02 } },
    ],
  },
  3: {
    title: "Act Two, Continued: The Warehouse",
    inquiry: "Sam's eyebrows go up. \"And now you're working together, in a warehouse, on the same side. Tell me about that part. I want the details.\"",
    prompt: "How does the warehouse job go in the telling?",
    options: [
      { label: "Michael: textbook, quiet and clean", result: "\"Quiet,\" says Sam. \"Clean,\" says Jesse. \"There was gas,\" says Fiona, \"and a lot of containers, and it was neither quiet nor clean.\" Michael looks pained, in a very fond way.", fx: { succ: 0.03 } },
      { label: "Fiona: the gas, the container, and a lot of luck", result: "\"The plan was to get inside a container,\" says Fiona. \"The luck was that it was the right one.\" Michael finishes the thought: \"Mostly the right one.\"", fx: { att: -0.03 } },
    ],
  },
};

export const FIRSTCONTACT_ARC: Arc = {
  id: FIRSTCONTACT_ID, title: "First Contact", at: 3e8, ally: "fiona", favors: 4, needsEp: "402", orSeason: 5,
  blurb: "It's Jesse's birthday. Sam is buying, Jesse wants a story, and Fiona has a feeling about how Michael tells it. Dublin, 2003: the first time you met, and what happened on the job that sealed it.",
  epilogue: "That night in the story, Michael finally told her the truth about what he was and what he'd done. Fiona said they had fundamental differences, and thanked him for it anyway. Sam taps the bar. \"That's the nicest thing I've ever heard you say, Mikey.\" \"Don't tell anyone,\" says Michael. Jesse is already telling everyone.",
  steps: [
    { n: "The Snow Globe", dur: 45, succ: 0.8, heat: 8, rm: 2.0, act: 0 },
    { n: "The Offer", dur: 40, succ: 0.85, heat: 6, rm: 2.0 },
    { n: "Leverage", dur: 55, succ: 0.72, heat: 12, rm: 3.0, act: 1 },
    { n: "The Warehouse", dur: 50, succ: 0.72, heat: 12, rm: 3.2 },
    { n: "War Zone", dur: 60, succ: 0.65, heat: 18, rm: 4.0, act: 2 },
  ],
};

export const FIRSTCONTACT_FLASHBACK: FlashbackDef = {
  id: FIRSTCONTACT_ID,
  title: "First Contact",
  teller: "Michael",
  arc: FIRSTCONTACT_ARC,
  acts: FIRSTCONTACT_ACTS,
  beats: FIRSTCONTACT_BEATS,
  nod: {
    label: "Let Fiona finish the story",
    title: "Fiona Takes Over",
    text: "Fiona takes the glass out of Michael's hand and starts at the beginning. The start goes better when someone who was there is telling it (+8% on Step 1).",
    say: "\"Let me,\" says Fiona. Michael lets her. Jesse looks like he's won something.",
    succ: 0.08,
    portrait: "fiona",
  },
  bosses: [],
  speed: 0.5,
  paper: false,
  menuId: FIRSTCONTACT_ID,
  menuTitle: "First Contact",
  pausedTitle: "Michael and Fiona are telling Sam and Jesse how they met.",
  pausedText: "Everything else waits: no new cases, no clients, no visitors, and your other jobs and the Organization hold still until the story is told.",
  offer: () => ({
    title: "Jesse wants a story",
    text: "It's Jesse's birthday, and he has one request: how did Michael and Fiona actually meet? Sam is already buying a round, and Fiona is already smiling. First Contact is now an Open Case.",
    say: "Jesse slides a glass across the bar. \"Come on. All of it.\"",
  }),
  replay: {
    title: "Michael and Fiona tell it again",
    text: "Jesse is already topping up glasses. \"Dublin, 2003. From the beginning.\" Everything else waits until you're done, and this time the story can go differently. The favors and the medal were yours the first time.",
    say: "Sam settles in. Fiona settles in a little closer to Michael.",
  },
  retry: step => ({
    title: "Fiona interrupts",
    text: `Fiona puts her glass down. "No, no. That isn't how it went. Back up to \\"${step}\\", Michael." The step is yours to try again, and it won't open with a new question.`,
  }),
  replayHelp: "Everything else waits while you tell it, and your answers can change. The favors and the medal were yours the first time.",
};
