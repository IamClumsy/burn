import { S, KEEP_RATE, capFee, payClient } from "../state";
import { clickVal, cps, heatMult, inFlashback } from "../calc";
import { EVENTS } from "../data/events";
import { clientCut } from "../data/automation";
import { chime } from "../audio";
import { money, pick } from "../util";
import { choiceBusy, showChoice } from "../ui/choice";
import { render } from "../ui/render";
import { say as sayTag } from "../ui/fx";
import { checkBurn } from "./heat";
const say = (t: string): void => sayTag(t, "client");

export function spawnEvent(): void {
  if (choiceBusy() || S.boss || inFlashback()) { setTimeout(spawnEvent, 15000); return; }
  const ev = pick(EVENTS.filter(e => !e.needs || S.allies[e.needs]));
  const options = ev.o.filter(([, , needs]) => !needs || S.allies[needs]).map(([label, run]) => [label, run] as [string, () => string]);
  showChoice(ev.t, ev.d, options, () => { checkBurn(); render(); scheduleEvent(); });
}

export function scheduleEvent(): void { setTimeout(spawnEvent, 70000 + Math.random() * 60000); }

// ---- "a client is at the door": a prominent pop-up with the pay front and center
const CLIENTS = [
  "A woman in a hurry says the police won't help. She doesn't have long.",
  "A man in a rumpled suit says he's run out of people to ask. Someone gave him your name.",
  "A nervous couple stands in the doorway holding a folder. They've tried everyone else.",
  "A teenager you've never met says her brother is in trouble, and she's saved up what she can.",
  "An old neighbor knocks twice. He doesn't ask for much. He never does.",
];

export function scheduleClient(): void { setTimeout(spawnClient, 45000 + Math.random() * 60000); }

export function spawnClient(): void {
  if (choiceBusy() || S.boss || inFlashback()) { setTimeout(spawnClient, 20000); return; }
  const reward = Math.max(500, capFee((cps() * 45 + clickVal() * 10) / KEEP_RATE));
  if (S.auto.clients && S.cred >= 2) { // auto-take clients: the case is handled without a pop-up, for a little less
    const cut = clientCut(S.cred), fee = reward * (1 - cut);
    payClient(fee); S.heat += 10 * heatMult();
    say(`A client comes to the door. You take the case without breaking stride. ${money(fee)} on the books after the ${Math.round(cut * 100)}% it costs you to not stop, and expenses covered.`);
    checkBurn(); render(); scheduleClient();
    return;
  }
  chime();
  showChoice(
    "📞 A client is at the door",
    pick(CLIENTS),
    [
      ["Take the case", () => {
        const { keep } = payClient(reward); S.heat += 10 * heatMult();
        return `The client pays ${money(reward)}. After expenses, the rest goes back to the people who need it, and ${money(keep)} lands in your account. Taking cases draws a little heat.`;
      }],
      ["Send them away", () => "You point them toward someone who can help. They thank you anyway."],
    ],
    () => { checkBurn(); render(); scheduleClient(); },
    { primary: 0, big: money(reward), client: true },
  );
}
