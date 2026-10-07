import type { GameEvent } from "../types";
import { S, earn, payClient } from "../state";
import { cps, owned } from "../calc";
import { KEEP_RATE } from "../state";
import { GENS } from "./ops";
import { money, pick } from "../util";
import { shake } from "../ui/fx";

const att = (n: number) => { S.att = Math.min(100, S.att + n); };

/** Help a client: payout scaled to income, plus favors and heat. Kid cases never fail. */
function help(secs: number, fav: number, heat: number, line: string, kid = false): string {
  const fee = (cps() * secs + 100) / KEEP_RATE;
  payClient(fee);
  S.favors += fav;
  S.heat += heat;
  if (kid) S.stats.kidMissions++;
  return `${line} Paid ${money(fee)}. You keep what you need for expenses and the rest goes back to the people who needed it.`;
}

export const EVENTS: GameEvent[] = [
  {t:"Pulled Over", d:"A Miami cop taps your window. Your trunk is not boring.", o:[
    ["Slip him a bribe", () => { S.cash = Math.max(0, S.cash - cps() * 30 - 20); S.heat = Math.max(0, S.heat - 10); return "He forgets your face. It cost you."; }],
    ["Bluff your way out", () => { if (Math.random() < .6) { S.favors++; return "You sound like a man with nothing to hide. +1 favor."; } S.heat += 25; return "He doesn't buy it. Heat climbs."; }],
    ["Floor it", () => { S.heat += 30; shake(); return "You lose him in traffic, and your anonymity with him."; }]]},
  {t:"A Stranger's Offer", d:"A man in a linen suit offers cash for a job, no questions.", o:[
    ["Accept", () => { earn(cps() * 90 + 100); S.heat += 15; att(10); return "Easy money. The kind that comes back around."; }],
    ["Counter-offer", () => { if (Math.random() < .5) { earn(cps() * 150 + 150); return "He folds and pays more."; } S.heat += 20; return "He leaves angry. People notice."; }],
    ["Decline", () => "You watch him go. Nothing happens, which is its own kind of lucky."]]},
  {t:"Old Contact Calls", d:"A voice from your past wants twenty minutes of your time.", o:[
    ["Hear them out", () => { S.favors += 2; att(5); return "They owe you now. +2 favors."; }],
    ["Hang up", () => "Some doors stay closed for good reason."]]},
  {t:"Stray Informant", d:"A nervous kid says he has tips and no employer.", o:[
    ["Hire him", () => {
      const c = cps() * 20 + 20;
      if (S.cash < c) return "You can't afford him. He leaves.";
      S.cash -= c;
      const owns = GENS.filter(x => owned(x.id) > 0);
      const g = owns.length ? pick(owns) : GENS[0];
      S.gens[g.id] = owned(g.id) + 1;
      return "He's on the books. You gain a free " + g.name + ".";
    }],
    ["Send him away", () => "He shrugs and finds another buyer."]]},

  // ---- Episode-style cases: Michael helps people the system won't ----
  {t:"The Landlord's Favor", d:"Your landlord asks you to look into why one of his waitresses stopped showing up. She witnessed something she shouldn't have.", o:[
    ["Take the case yourself", () => help(60, 1, 8, "You find her, and then you find the dealer who scared her. Both problems get solved. +1 favor.")],
    ["Send Sam to talk to the dealer", () => help(40, 1, 3, "Sam buys a round, makes a few friendly threats, and the dealer finds a new bar.")]]},
  {t:"A Mother's Plea", d:"A woman begs you to find her son. The police say they're doing what they can. You have more than that.", o:[
    ["Take the case", () => help(80, 2, 10, "You find the boy before sundown. Kids are the one job that never goes wrong. +2 favors.", true)],
    ["Bring Fiona in", () => help(100, 2, 14, "Fiona's idea of subtlety is a locked door and a good fuse. The boy is home by dinner. +2 favors.", true)]]},
  {t:"A Con Artist's Victim", d:"One of your mother's friends was scammed and beaten up by a smooth talker. Madeline would like this handled.", o:[
    ["Out-con the con artist", () => help(55, 1, 5, "He never sees it coming. The money goes back to its owner, with interest.")],
    ["Let Madeline make a few calls", () => help(45, 1, 2, "Madeline works the phone tree. By morning the con man has been run out of town.")]]},
  {t:"Loan Sharks at the Door", d:"A cell-phone salesman invested in a fake nightclub, borrowed from the wrong people, and now they're at his door.", o:[
    ["Make the loan sharks go away", () => help(65, 1, 9, "You show the sharks why the salesman is not worth the trouble. He sends a thank-you fruit basket.")],
    ["Find the scammer who sold him the club", () => help(75, 2, 11, "Following the scam's money leads you to the real crook. The salesman gets his savings back. +2 favors.")]]},
  {t:"A Friend's Friend", d:"Sam says an old teammate has been framed as a dirty cop and needs help clearing his name. 'Free football tickets,' Sam adds.", o:[
    ["Dig into the case", () => help(70, 2, 8, "The cop was framed. The real culprit gets exposed. Sam gets his tickets. +2 favors.")],
    ["Bring Jesse in", () => help(80, 2, 10, "Jesse finds the paper trail. The cop gets his badge, and his name, back.")]]},
  {t:"A Father in Despair", d:"A man lost his savings on a 'miracle drug' for his sick son. He's out of options. You aren't.", o:[
    ["Get his money back", () => help(70, 2, 8, "The fake-drug ring folds fast. The boy gets his real treatment. Kids are the one job that never goes wrong. +2 favors.", true)],
    ["Expose the ring", () => help(90, 3, 14, "You take down the entire operation. The father gets everything back, and so do a dozen other families. +3 favors.", true)]]},
  {t:"Barry's Tip", d:"Barry calls. He heard something about a money trail running toward a boat in the harbor, and he thinks you'd like to know.", o:[
    ["Follow the trail", () => { att(4); return help(60, 1, 5, "The trail ends at a scam artist's yacht. You tell the right people and he goes away. +1 favor."); }],
    ["Tell him you owe him one", () => { S.favors++; return "Barry never forgets a favor, and you'll be glad of it later. +1 favor."; }]]},
];
