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
  {id:"stakeout", name:"Stake Out the Place", hint:"Sit tight and watch. Builds two leads.", cd:10,
   lines:["Six hours in a parked car with bad coffee. They finally do something stupid.",
          "You note the deliveries, the visitors and the one light that never goes off.",
          "People tell you everything if you just sit still long enough."]},
  {id:"cover", name:"Go Undercover", hint:"Wear a new face. Cools the heat and chips at their cover.", cd:8,
   lines:["A new hat, a new accent, a clipboard. Nobody looks at the guy with the clipboard.",
          "You walk in as the inspector they were dreading. Nobody asks for ID.",
          "Different name, different story, same easy smile. The heat fades."]},
  {id:"crew", name:"Call in the Crew", hint:"Someone from your crew lends a hand. Needs one who's around.", cd:9,
   lines:["Your crew gets to work."]},
  {id:"trap", name:"Spring the Trap", hint:"Lay your leads on the table. Needs 3.", cd:3,
   lines:["You lay everything out, one lead at a time. They stop talking.",
          "The pieces were there all along. You just had to put them in order.",
          "You finish the sentence for them. They don't argue."]},
];

/** What each crew member does when you call them in on a case. */
export const CREW_LINES: Record<string, string[]> = {
  sam: ["Sam strikes up a conversation with their driver. Forty minutes later he knows everything, and so does the driver's mother.",
        "Sam orders a mojito and wins their security guard's trust before the ice melts."],
  fiona: ["Fiona makes a very loud scene by the front door. Everyone watches her. No one watches you.",
          "Fiona walks in, says three words and a door that was locked is suddenly open."],
  barry: ["Barry makes a few calls and some money quietly changes hands. Their accounts feel strangely lighter.",
          "Barry looks up their whole financial life in an afternoon and names a price, which is a lot."],
  madeline: ["Madeline invites them in for coffee. By the second cup they've confessed to things they didn't know they'd done.",
             "Madeline asks them a few friendly questions. Moms are the best interrogators in the business."],
  nate: ["Nate hotwires their car \"just to see,\" and the glove box turns out to be very useful.",
         "Nate talks to the one guy you told him not to. It somehow works."],
  diego: ["Diego checks a database he isn't supposed to touch and reads you a name off the screen. Then he deletes his search history.",
          "Diego flashes an agency badge at the airport office. A closed door opens, and so does a file."],
  pearce: ["Pearce makes one call and a very official-looking person asks them to step into a room.",
           "Pearce arrives with a warrant, a thin smile and zero patience. They talk."],
  jesse: ["Jesse sits next to their guy at the bar. Two beers later, he knows the shift schedule and the safe code.",
          "Jesse plays the rookie fed with perfect confidence and the right amount of nerves."],
};

/**
 * The tools the case card's main tile offers, in priority order: the first one that's ready is shown.
 * Free ones come first so a quick tap never spends a favor or gadget parts by accident. Spring the Trap has its own button.
 */
export const ROTATING: CaseAction[] = ["investigate", "stakeout", "cover", "crew", "con", "gadget", "favor"];
