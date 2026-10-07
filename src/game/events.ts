import { S, KEEP_RATE, payClient } from "../state";
import { clickVal, cps, heatMult } from "../calc";
import { EVENTS } from "../data/events";
import { chime } from "../audio";
import { money, pick } from "../util";
import { $ } from "../ui/dom";
import { say } from "../ui/fx";
import { choiceBusy, showChoice } from "../ui/choice";
import { render } from "../ui/render";
import { checkBurn } from "./heat";

export function spawnEvent(): void {
  if (choiceBusy()) { scheduleEvent(); return; }
  const ev = pick(EVENTS);
  showChoice(ev.t, ev.d, ev.o, () => { checkBurn(); render(); scheduleEvent(); });
}

export function scheduleEvent(): void { setTimeout(spawnEvent, 70000 + Math.random() * 60000); }

// ---- "a client is at the door" popup
let clientTimer: ReturnType<typeof setTimeout> | undefined;

export function scheduleClient(): void { setTimeout(spawnClient, 45000 + Math.random() * 60000); }

function spawnClient(): void {
  const reward = Math.max(500, (cps() * 45 + clickVal() * 10) / KEEP_RATE), el = $("client");
  el.style.display = "block";
  el.textContent = `📞 A client is at the door! Pays ${money(reward)}`;
  const done = () => { el.style.display = "none"; clearTimeout(clientTimer); el.onclick = null; scheduleClient(); };
  el.onclick = () => {
    payClient(reward); S.heat += 10 * heatMult();
    say("The client's problem is yours now. You keep what you need for expenses and the rest goes back to the people who need it.");
    chime(); checkBurn(); done(); render();
  };
  clientTimer = setTimeout(done, 12000);
}
