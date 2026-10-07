import { S, earn } from "../state";
import { clickVal, cps, heatMult } from "../calc";
import { EVENTS } from "../data/events";
import { chime } from "../audio";
import { money, pick } from "../util";
import { $ } from "../ui/dom";
import { say, toast } from "../ui/fx";
import { render } from "../ui/render";
import { checkBurn } from "./heat";

let evtOpen = false;

export function spawnEvent(): void {
  if (evtOpen) { scheduleEvent(); return; }
  const ev = pick(EVENTS);
  evtOpen = true;
  $("evtT").textContent = ev.t;
  $("evtD").textContent = ev.d;
  $("evtO").innerHTML = "";
  for (const [label, run] of ev.o) {
    const b = document.createElement("button");
    b.textContent = label;
    b.onclick = () => {
      const r = run();
      say(r); toast(ev.t, r);
      $("evt").style.display = "none";
      evtOpen = false;
      checkBurn(); render(); scheduleEvent();
    };
    $("evtO").appendChild(b);
  }
  $("evt").style.display = "flex";
}

export function scheduleEvent(): void { setTimeout(spawnEvent, 70000 + Math.random() * 60000); }

// ---- "a client is at the door" popup
let clientTimer: ReturnType<typeof setTimeout> | undefined;

export function scheduleClient(): void { setTimeout(spawnClient, 45000 + Math.random() * 60000); }

function spawnClient(): void {
  const reward = Math.max(50, cps() * 45 + clickVal() * 10), el = $("client");
  el.style.display = "block";
  el.textContent = `📞 A client is at the door! Take the case (+${money(reward)})`;
  const done = () => { el.style.display = "none"; clearTimeout(clientTimer); el.onclick = null; scheduleClient(); };
  el.onclick = () => {
    earn(reward); S.heat += 10 * heatMult();
    say("The client's problem is yours now. So is their money.");
    chime(); checkBurn(); done(); render();
  };
  clientTimer = setTimeout(done, 12000);
}
