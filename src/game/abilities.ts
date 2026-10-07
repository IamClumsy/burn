import { S, earn } from "../state";
import { cps } from "../calc";
import { say } from "../ui/fx";
import { beep } from "../audio";
import { shake } from "../ui/fx";

/** Ally ability effects, keyed by ally id. */
export const ABILITIES: Record<string, () => void> = {
  sam: () => earn(cps() * 60 + 50),
  fiona: () => { earn(cps() * 120 + 100); S.heat += 15; shake(); beep(90, 0.4, "sawtooth", 0.08, -50); },
  madeline: () => { S.heat = Math.max(0, S.heat - 50); S.att = Math.max(0, S.att - 30); },
  jesse: () => { S.fx.fast = 60; },
  // Nate is unpredictable: usually a windfall, sometimes a mess.
  nate: () => {
    const r = Math.random();
    if (r < 0.5) { earn(cps() * 180 + 150); S.heat = Math.max(0, S.heat - 20); say("Nate's idea works. Wildly well. Nobody is more surprised than Nate."); }
    else if (r < 0.85) { earn(cps() * 60 + 50); say("Nate's plan mostly works. There's a story about it, and he'll tell it a lot."); }
    else { S.heat += 20; S.cash = Math.max(0, S.cash - cps() * 20); say("Nate's big idea involves a borrowed boat. It does not end well."); }
  },
  barry: () => { earn(cps() * 90 + 100); S.heat = Math.max(0, S.heat - 25); },
};
