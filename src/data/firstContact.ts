import type { Arc } from "../types";
import type { FlashbackAct, FlashbackDef } from "./flashbacks";

/**
 * First Contact: how Michael met Fiona, told at the start of Season 6. Fiona has turned herself in and is in prison,
 * Michael has barely left the loft, and Sam and Jesse (on Jesse's birthday) drag him out to a bar and ask for the story.
 * Every question offers the same moment twice: Michael's version, which is smooth and a little fuzzy, and Fiona's,
 * as Michael remembers her telling it (and, now and then, as she says it herself on a prison call). The outline comes
 * from the third A New Day comic (Dublin and Belfast, 2003: a bug in a snow globe, photographs of a robbery, a
 * warehouse job, a firefight at a farm). Everything is written for the game in its own words.
 */
export const FIRSTCONTACT_ID = "firstcontact";

export const FIRSTCONTACT_ACTS: FlashbackAct[] = [
  {
    title: "Act One: The Snow Globe",
    inquiry: "Jesse raises a glass. \"Happy birthday to me, so I get a story. How did you two actually meet?\" Michael looks at the empty stool beside him, the one she'd have taken, and starts to talk anyway.",
    prompt: "Dublin, 2003. Michael was a CIA operative sent to get close to a gun dealer's circle, and Fiona's flat was the way in. How does the story start?",
    options: [
      { label: "Michael: a clean entry and a quiet bug in a snow globe", result: "\"Textbook,\" says Michael. Sam nods. Jesse nods. Then Michael stops, and almost smiles. \"She'd say I was in her flat, holding a snow globe.\" Nobody says anything. Everyone smiles into their drink.", fx: { succ: 0.03 } },
      { label: "Fiona: the way she tells it, with a gun in his face", result: "\"She'd leave in the part where she has me at the end of a barrel,\" says Michael, and does her accent badly enough that Jesse laughs out loud. \"It was a very good bug, though.\" He means it.", fx: { att: -0.05 } },
    ],
  },
  {
    title: "Act Two: Leverage",
    inquiry: "Sam signals for a second round. \"Okay, so she catches you. And you don't leave, you don't get shot. How does that work, Mikey?\"",
    prompt: "A woman who just caught a spy in her flat has a crew and a robbery planned. What does Michael do with that?",
    options: [
      { label: "Michael: he made her an offer, and she took it", result: "\"An arrangement,\" says Michael. Then, in a quieter voice: \"'Photographs,' she'd say. 'He took photographs of my friends mid-job and called it an arrangement.'\" Jesse laughs so hard he has to put his drink down. Sam does not.", fx: { inc: 0.04 } },
      { label: "Fiona: he had the pictures, and she let him think that was enough", result: "\"She was already thinking about the money,\" says Michael, \"and the man I wanted. She let me believe I was in charge.\" He turns the glass in his hand. \"I'd like to tell her she did a good job. She'd know.\"", fx: { heat: -0.05 } },
    ],
  },
  {
    title: "Act Three: War Zone",
    inquiry: "Sam sets his glass down. \"There's a car in this story, isn't there? There is always a car in your stories.\" Michael closes his eyes, and Jesse's phone buzzes: a call from the prison, forwarded to the bar.",
    prompt: "A farm outside Belfast, a deal gone wrong, and a very old sedan. How does it end?",
    options: [
      { label: "Michael: a controlled exit, one clean jump", result: "\"Controlled,\" says a voice from the phone on the bar. \"It was a car, Michael. It flew. It wasn't built to fly. Nobody planned that.\" Michael looks at the ceiling. \"It landed fine,\" he says. Jesse holds the phone up higher so everybody can hear.", fx: { mis: 0.04 } },
      { label: "Fiona: no plan at all, and go faster", result: "\"We didn't have a plan,\" says Fiona, on the phone, \"and that's why it worked.\" Jesse raises his glass at the phone. Sam raises two. Michael, finally, admits it. She hears him do it.", fx: { favors: 6 } },
    ],
  },
];

export const FIRSTCONTACT_BEATS: Record<number, FlashbackAct> = {
  1: {
    title: "Act One, Continued: The Offer",
    inquiry: "Jesse leans in. \"Wait, so she's got a gun on you and you're in her flat. What do you say?\"",
    prompt: "How does Michael tell the next ten seconds?",
    options: [
      { label: "Michael: calmly, with a plan", result: "\"I'd say I stayed calm,\" says Michael. \"She'd say I said 'hello,'\" he adds, \"very calmly, in the wrong accent.\" Sam tries to cough and fails.", fx: { heat: -0.03 } },
      { label: "Fiona: he stood there and let her talk", result: "\"She did most of the talking,\" says Michael. \"I had a lot of the right instincts. Not many of the right answers.\" He nods once. It's fair.", fx: { inc: 0.02 } },
    ],
  },
  3: {
    title: "Act Two, Continued: The Warehouse",
    inquiry: "Sam's eyebrows go up. \"And now you're working together, in a warehouse, on the same side. Tell me about that part. I want the details.\"",
    prompt: "How does the warehouse job go in the telling?",
    options: [
      { label: "Michael: textbook, quiet and clean", result: "\"Quiet,\" says Sam. \"Clean,\" says Jesse. \"There was gas,\" says Michael, \"and a lot of containers, and it was neither.\" He looks pained, in a very fond way.", fx: { succ: 0.03 } },
      { label: "Fiona: the gas, the container, and a lot of luck", result: "\"The plan was to get inside a container,\" says Michael. \"The luck was that it was the right one.\" A pause. \"Mostly the right one.\" She'd have said exactly that.", fx: { att: -0.03 } },
    ],
  },
};

export const FIRSTCONTACT_ARC: Arc = {
  id: FIRSTCONTACT_ID, title: "First Contact", at: 8e9, ally: "fiona", favors: 4, needsEp: "601", orSeason: 6,
  blurb: "Fiona is in prison and Michael hasn't left the loft in days. It's Jesse's birthday, so Sam and Jesse haul him to a bar and ask for one story: Dublin, 2003, the first time he met her, and what happened on the job that sealed it.",
  epilogue: "That night in the story, Michael finally told her the truth about what he was and what he'd done. Fiona said they had fundamental differences, and thanked him for it anyway. Sam taps the bar. \"That's the nicest thing I've ever heard you say, Mikey.\" \"Don't tell her,\" says Michael. Jesse is already writing it down so he can.",
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
    label: "Call Fiona",
    title: "A Call From Prison",
    text: "Michael steps outside and makes the one call he gets. Fiona tells him which part to start with. The start goes better when someone who was there is steering it (+8% on Step 1).",
    say: "\"Start with the snow globe,\" says Fiona. Michael nods at the phone, as if she could see him.",
    succ: 0.08,
    portrait: "fiona",
  },
  bosses: [],
  speed: 0.5,
  paper: false,
  menuId: FIRSTCONTACT_ID,
  menuTitle: "First Contact",
  pausedTitle: "Michael is telling Sam and Jesse how he met Fiona.",
  pausedText: "Everything else waits: no new cases, no clients, no visitors, and your other jobs and the Organization hold still until the story is told.",
  offer: () => ({
    title: "Jesse wants a story",
    text: "Fiona is in prison, and Michael hasn't left the loft in days. Sam and Jesse haul him out for Jesse's birthday and ask for one thing: how did Michael and Fiona actually meet? First Contact is now an Open Case.",
    say: "Jesse slides a glass across the bar. \"Come on. All of it.\"",
  }),
  replay: {
    title: "Michael tells it again",
    text: "Jesse is already topping up glasses. \"Dublin, 2003. From the beginning.\" Everything else waits until you're done, and this time the story can go differently. The favors and the medal were yours the first time.",
    say: "Sam settles in. Michael looks at the empty stool again, and starts.",
  },
  retry: step => ({
    title: "Michael corrects himself",
    text: `Michael puts his glass down. "No. That isn't how it went. Back up to \\"${step}\\"." The step is yours to try again, and it won't open with a new question.`,
  }),
  replayHelp: "Everything else waits while you tell it, and your answers can change. The favors and the medal were yours the first time.",
};
