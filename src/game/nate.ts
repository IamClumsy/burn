import { S } from "../state";
import { toast, say as sayTag } from "../ui/fx";

/** The Season 6 episode where Nate dies: "Shock Wave" (6x06). */
export const NATE_DEATH_EP = "606";

/**
 * Nate's last scene. It plays once, after you've done "Shock Wave": three quiet cards, then he's gone from the crew, and
 * what he gave you stays as a small permanent bonus.
 */
export function nateDies(): void {
  if (S.nateGone) return;
  S.nateGone = true;
  delete S.allies.nate;
  S.nateAway = false;
  for (const m of S.active) if (m.sent === "nate") m.sent = null;
  toast("Atlantic City",
    "Michael lost his temper and sent Nate away, sick of cleaning up after him. Nate went. Then the phone rang, and Michael told him he was the closest man to Anson in the whole city. Nate did what he'd been trying to do for years: he got the job done.",
    "story");
  toast("One Shot",
    "The shot came from a long way off, and it was meant for someone else. It went through Anson and kept going. Nate was thirty-eight.",
    "story");
  toast("Nate Westen",
    "Michael's younger brother. A gambler, a con man, a limo-company owner and a father. He lived in Michael's shadow his whole life and, at the end, stood in front of him. His first word was \"juice\". Michael never let him forget it.\n\nWhat he gave you stays: +5% income, for good.",
    "story");
  sayTag("Nate's chair is empty. Madeline keeps his coat on the hook. Michael doesn't say anything, which is how you know.", "story");
}

/** The series finale, "Reckoning" (7x13): where Madeline gives everything for her boys. */
export const MADELINE_DEATH_EP = "713";

/** Madeline's last scene: three quiet cards, then she's gone from the crew, and her Lay Low advice stays. */
export function madelineDies(): void {
  if (S.madelineGone) return;
  S.madelineGone = true;
  delete S.allies.madeline;
  for (const m of S.active) if (m.sent === "madeline") m.sent = null;
  toast("The Reckoning",
    "James Kendrick's men had Michael and Fiona cornered, with Charlie and everyone Michael loved in the middle of it. Madeline did what she had done her whole life: she decided what she would not let happen.",
    "story");
  toast("For My Boys",
    "She had a cigarette in one hand and something far worse in the other. \"This one's for my boys,\" she said. Then she made sure nobody else would be hurt.",
    "story");
  toast("Madeline Westen",
    "Michael's mother. Sharp, chain-smoking and nosy, and the first person to open a door for anyone in need: a neighbor's kid, a stray, a son who'd been away too long. She was seventy-one. The kettle is still on in her kitchen.\n\nWhat she gave you stays: Lay Low always cools down twice as fast.",
    "story");
  sayTag("Michael's mother's chair is empty. Her coat is on the hook, and nobody moves it.", "story");
}
