import { S, earn } from "../state";
import { cps } from "../calc";
import { say } from "../ui/fx";
import { beep } from "../audio";
import { shake } from "../ui/fx";
import { pick } from "../util";
import { BOSSES } from "../data/bosses";
import { learnName } from "./org";

/** Ally ability effects, keyed by ally id. */
export const ABILITIES: Record<string, () => void> = {
  sam: () => earn(cps() * 60 + 50),
  fiona: () => { earn(cps() * 120 + 100); S.heat += 15; shake(); beep(90, 0.4, "sawtooth", 0.08, -50); },
  madeline: () => { S.heat = Math.max(0, S.heat - 50); S.att = Math.max(0, S.att - 30); },
  jesse: () => { S.fx.fast = 60; },
  diego: () => {
    const unknown = BOSSES.filter(b => !S.listKnown[b.id]);
    S.att = Math.max(0, S.att - (unknown.length ? 15 : 30));
    if (unknown.length) {
      const b = pick(unknown);
      learnName(b.id);
      say(`Diego pulls a file at the airport office and slides you a name: ${b.n}. "You didn't get this from me."`);
    } else say("Diego has nothing new on the List, so he quietly makes your file a little thinner.");
  },
  pearce: () => {
    S.heat = Math.max(0, S.heat - 40);
    if (S.boss) S.boss.left += 20;
    say("Pearce flashes a badge, mentions a warrant, and the problem decides it's not worth the paperwork.");
  },
  // Nate is unpredictable: usually a windfall, sometimes a mess.
  nate: () => {
    const r = Math.random();
    if (r < 0.5) { earn(cps() * 180 + 150); S.heat = Math.max(0, S.heat - 20); say(pick(["Nate's idea works. Wildly well. Nobody is more surprised than Nate.","Nate hotwires exactly the right limo at exactly the right moment. It's the one thing he does better than Michael, and he says so.","Nate talks a loan shark into a payment plan. For the loan shark."])); }
    else if (r < 0.85) { earn(cps() * 60 + 50); say(pick(["Nate's plan mostly works. There's a story about it, and he'll tell it a lot.","Nate gets the door open, the guard distracted and the pizza delivered, in that order. Nobody asked about the pizza."])); }
    else { S.heat += 20; S.cash = Math.max(0, S.cash - cps() * 20); say(pick(["Nate's big idea involves a borrowed boat. It does not end well.","Nate \"just talks\" to the wrong guy. Michael hears about it from the guy."])); }
  },
  barry: () => { earn(cps() * 90 + 100); S.heat = Math.max(0, S.heat - 25); },
};
