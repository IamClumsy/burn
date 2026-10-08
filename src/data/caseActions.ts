import type { CaseAction } from "../types";

export interface CaseActionDef {
  id: CaseAction; name: string; hint: string;
  /** Seconds before it can be used again. */
  cd: number;
  /** Narration, picked at random when it works. */
  lines: string[];
}

export const MAX_LEADS = 5;
export const TRAP_MIN_LEADS = 3;

/** What Michael does on a case. Nobody gets punched; people get outmaneuvered. */
export const CASE_ACTIONS: CaseActionDef[] = [
  {id:"investigate", name:"Work the Angle", hint:"Dig into their story. Builds a lead.", cd:0.6,
   lines:["A phone record, a receipt, a parking stub. Something doesn't add up.",
          "You watch from across the street and write down what they do when they think no one's looking.",
          "A name comes up twice. That's a lead."]},
  {id:"con", name:"Run a Con", hint:"Bluff your way in. Risky, but it lands.", cd:4,
   lines:["You walk in like you belong there, and nobody questions it.",
          "A borrowed badge, a confident smile, and a story with just enough truth in it.",
          "They believe every word, which tells you exactly what they're hiding."]},
  {id:"gadget", name:"Improvise a Gadget", hint:"Spend a wire and some tape on something clever.", cd:7,
   lines:["Wire, tape and a phone battery. It shouldn't work. It works.",
          "You rig a quick tap out of household parts and it picks up everything.",
          "Duct tape fixes almost anything. This time, it catches a confession."]},
  {id:"favor", name:"Call In a Favor", hint:"Costs 1 favor. Someone owes you.", cd:12,
   lines:["A call, a name and an old debt. The right door opens.",
          "Someone you helped years ago picks up on the first ring.",
          "You spend a favor and get an answer you couldn't have found alone."]},
  {id:"trap", name:"Spring the Trap", hint:"Lay your leads on the table. Needs 3.", cd:3,
   lines:["You lay everything out, one lead at a time. They stop talking.",
          "The pieces were there all along. You just had to put them in order.",
          "You finish the sentence for them. They don't argue."]},
];
