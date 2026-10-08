import { S, earn } from "../state";
import { choiceMult, cps, gripAtt, heatMult, owned } from "../calc";
import { checkEnding, tickOrg } from "./org";
import { GENS } from "../data/ops";
import { STORY } from "../data/story";
import { MEDALS } from "../data/medals";
import { chime } from "../audio";
import { pick } from "../util";
import { say, toast } from "../ui/fx";
import { LINES } from "../data/text";
import { choiceBusy, showChoice } from "../ui/choice";
import { checkAmbush, checkBurn, layLow } from "./heat";
import { resolveMission } from "./missions";
import { tickBoss } from "./bosses";

let sec = 0;

export function milestones(): void {
  checkEnding();
  while (S.story < STORY.length && S.life >= STORY[S.story].at) {
    const i = S.story, s = STORY[i];
    // A decision needs the dialog free; try again next second if something else is open.
    if (s.choice && choiceBusy()) break;
    S.story++; S.favors += s.fav;
    toast("Case File: " + s.t, s.x.slice(0, 90) + "… (+" + s.fav + " favors)");
    say(s.x); chime();
    if (s.choice) {
      showChoice(s.t, s.choice.prompt, s.choice.options.map((o, k): [string, () => string] => [o.label, () => {
        S.choices[i] = k;
        if (o.fx.favors) S.favors += o.fx.favors;
        return o.result;
      }]));
    }
  }
  for (const a of MEDALS) {
    if (!S.ach.includes(a.id) && a.t(S)) {
      S.ach.push(a.id);
      toast("Medal: " + a.n, a.d); chime();
    }
  }
}

/** Nate wanders off and wanders back on a random timer, because it's Nate. */
export function tickNate(dt: number): void {
  if (!S.allies.nate) return;
  S.nateTimer -= dt;
  if (S.nateTimer > 0) return;
  S.nateAway = !S.nateAway;
  S.nateTimer = S.nateAway ? 45 + Math.random() * 105 : 60 + Math.random() * 120;
  const line = pick(S.nateAway ? LINES.nateAway : LINES.nateBack);
  toast(S.nateAway ? "Nate wandered off" : "Nate's back", line);
  say(line);
}

export function tick(dt: number): void {
  earn(cps() * dt);
  S.stats.time += dt;

  const ops = GENS.reduce((a, g, i) => a + owned(g.id) * (1 + i * 0.3), 0);
  S.heat = Math.max(0, S.heat + (ops * 0.012 * heatMult() - 1.2) * dt);
  S.att = Math.max(0, Math.min(100, S.att + ((0.05 + S.heat * 0.004) * choiceMult("att") * gripAtt() - (S.heat < 20 ? 0.25 : 0)) * dt));

  if (S.layCd > 0) S.layCd = Math.max(0, S.layCd - dt);
  if (S.coverCd > 0) S.coverCd = Math.max(0, S.coverCd - dt);
  for (const k in S.fx) if (S.fx[k] > 0) S.fx[k] = Math.max(0, S.fx[k] - dt);
  for (const k in S.allyCd) if (S.allyCd[k] > 0) S.allyCd[k] = Math.max(0, S.allyCd[k] - dt);

  const speed = S.fx.fast > 0 ? 2 : 1;
  for (const m of [...S.active]) { m.left -= dt * speed; if (m.left <= 0) resolveMission(m); }

  if (Math.random() < Math.min(0.02, owned("tape") * 0.0004)) S.junk[pick(Object.keys(S.junk))]++;

  tickBoss(dt);
  tickNate(dt);
  tickOrg(dt);

  if (S.upgs.h3 && S.heat >= 90) layLow();
  if (S.allies.madeline && S.heat >= 95) layLow();
  checkBurn(); checkAmbush();

  sec += dt;
  if (sec >= 1) { sec = 0; milestones(); }
}
