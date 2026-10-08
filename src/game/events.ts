import { S, KEEP_RATE, capFee, payClient } from "../state";
import { clickVal, cps, heatMult } from "../calc";
import { EVENTS } from "../data/events";
import { chime } from "../audio";
import { money, pick } from "../util";
import { choiceBusy, showChoice } from "../ui/choice";
import { render } from "../ui/render";
import { checkBurn } from "./heat";

export function spawnEvent(): void {
  if (choiceBusy() || S.boss) { setTimeout(spawnEvent, 15000); return; }
  const ev = pick(EVENTS);
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
  if (choiceBusy() || S.boss) { setTimeout(spawnClient, 20000); return; }
  const reward = Math.max(500, capFee((cps() * 45 + clickVal() * 10) / KEEP_RATE));
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
