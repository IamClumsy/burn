import { S, earn } from "../state";
import { actionDmg, allyHere, bossDef, bossHP, bossView, conChance, cps, heatMult, grossLife, inFlashback } from "../calc";
import { CASE_ACTIONS, CREW_LINES, MAX_LEADS, TRAP_MIN_LEADS } from "../data/caseActions";
import type { Boss, CaseAction } from "../types";
import { seasonsOpen } from "../data/missions";
import { BOSSES } from "../data/bosses";
import { beep, chime } from "../audio";
import { fmt, money, pick, weightedPick } from "../util";
import { floatText, hitBoss, say as sayTag, shake, toast } from "../ui/fx";
import { checkBurn } from "./heat";
import { learnName, reduceGrip } from "./org";
import { nextBossGap } from "../data/pacing";
import { FLASHBACK_BOSSES } from "../data/samAxe";
import { advanceArc } from "./arcs";
const say = (t: string): void => sayTag(t, "boss");

/**
 * Who turns up next. Someone you haven't outmaneuvered yet is far more likely than someone you have, and
 * foes from the Season you're in come first, so everyone on the List gets their turn.
 */
export function bossWeight(b: Boss): number {
  return (S.bossKills[b.id] ? 1 : 6) * (seasonsOpen(b.at) === seasonsOpen(S.life) ? 2 : 1);
}

export function spawnBoss(): void {
  const pool = BOSSES.filter(b => grossLife() >= b.at && (!b.needs || S.allies[b.needs]));
  if (!pool.length) { S.bossCd = 60; return; }
  const b = bossView(weightedPick(pool, bossWeight)), max = bossHP(b);
  S.boss = { id: b.id, hp: max, max, left: 75 };
  shake(); beep(100, 0.5, "sawtooth", 0.08, -40);
  toast("BOSS: " + b.n, b.title, "bad", true);
  say(b.intro);
}

/** A showdown that's a step of an Open Case (Veracruz in the flashback). It never turns up on its own. */
export function startFlashbackBoss(id: string, arc: string, step: number): void {
  const b = FLASHBACK_BOSSES.find(x => x.id === id);
  if (!b || S.boss) return;
  const max = bossHP(b);
  S.boss = { id: b.id, hp: max, max, left: 90, arc: { id: arc, step } };
  shake(); beep(100, 0.5, "sawtooth", 0.08, -40);
  toast("SHOWDOWN: " + b.n, b.title, "bad", true);
  say(b.intro);
}

export function winBoss(): void {
  const b = bossDef()!, arc = S.boss?.arc;
  if (b.flashback) { // not on the List: pay out, and the case moves on
    const reward = cps() * 200 * b.hpm + 500, fav = S.samReplay ? 0 : Math.ceil(2 * b.hpm);
    earn(reward); S.favors += fav;
    S.boss = null; S.bossCd = nextBossGap();
    chime();
    toast(b.n + " outmaneuvered", `+${money(reward)}${fav ? `, +${fav} favors` : ""}`, "good");
    say(b.win ?? b.n + " is beaten.");
    if (arc) advanceArc(arc.id, arc.step);
    return;
  }
  const reward = cps() * 200 * b.hpm + 500, fav = Math.ceil(2 * b.hpm);
  const first = !S.bossKills[b.id];
  earn(reward); S.favors += fav; S.bossKills[b.id] = (S.bossKills[b.id] || 0) + 1;
  learnName(b.id); reduceGrip(5);
  S.boss = null; S.bossCd = nextBossGap();
  chime();
  toast(b.n + " outmaneuvered", `+${money(reward)}, +${fav} favors${first ? " · first win: +3% income forever" : ""}`, "good");
  if (b.m.includes("snatch")) {
    S.favors += 2;
    toast("Fiona's free", "She's furious, grateful, and has a few things to say to him first. +2 favors.", "good");
    say("Fiona walks out on her own two feet and takes a moment with Thomas O'Neill. Then she asks what took so long.");
  } else say(b.win ?? b.n + " walks away with nothing, which is the best outcome you can ask for.");
}

export function loseBoss(): void {
  const b = bossDef()!;
  S.cash *= 0.92; S.heat += 15; S.att = Math.min(99, S.att + 20);
  if (b.m.includes("snatch")) { S.fionaAway = 600; S.fionaWhy = "taken"; }
  S.boss = null; S.bossCd = nextBossGap();
  beep(130, 0.4, "sawtooth", 0.06, -50);
  toast(b.n + " got away", b.m.includes("snatch") ? "−8% cash, extra heat and attention. Fiona is gone for 10 minutes." : "−8% cash, extra heat and attention.", "bad");
  say(b.m.includes("snatch") ? b.n + " vanishes with Fiona. She'll find her own way out, and it will not be gentle." : b.lose ?? b.n + " slips out with what they came for. You'll see them again.");
}

const def = (k: CaseAction) => CASE_ACTIONS.find(x => x.id === k)!;

/** Crew members who can lend a hand right now. */
const crewHere = (): string[] => Object.keys(CREW_LINES).filter(allyHere);

/** Why an action can't be used right now, or null if it's ready. */
export function actionBlock(kind: CaseAction): string | null {
  const b = S.boss;
  if (!b) return "No case in progress";
  const cd = b.cd?.[kind] || 0;
  if (cd > 0) return `Ready in ${Math.ceil(cd)}s`;
  if (kind === "gadget" && (S.junk.wire < 1 || S.junk.tape < 1)) return "Needs 1 wire and 1 tape";
  if (kind === "favor" && S.favors < 1) return "Needs 1 favor";
  if (kind === "crew" && !crewHere().length) return "Nobody from your crew is around";
  if (kind === "trap" && (b.leads || 0) < TRAP_MIN_LEADS) return `Needs ${TRAP_MIN_LEADS} leads`;
  return null;
}

/** Take an action against the case. Each one works the boss's cover differently. */
export function bossAction(kind: CaseAction, x?: number, y?: number): void {
  const b = S.boss;
  if (!b || actionBlock(kind)) return;
  b.leads = b.leads || 0;
  b.cd = b.cd || {};
  let dmg = 0, label = "";

  if (kind === "investigate") {
    dmg = actionDmg(0.03);
    b.leads = Math.min(MAX_LEADS, b.leads + 1);
    S.heat += 1 * heatMult();
    label = "+1 lead";
  } else if (kind === "con") {
    if (Math.random() < conChance()) { dmg = actionDmg(0.1); label = "-" + fmt(dmg); }
    else {
      S.heat += 8 * heatMult(); S.att = Math.min(100, S.att + 2);
      say("They see through it. Not every con lands, and this one cost you some heat.");
      label = "Blown";
    }
  } else if (kind === "gadget") {
    S.junk.wire--; S.junk.tape--;
    dmg = actionDmg(0.12);
  } else if (kind === "favor") {
    S.favors--;
    dmg = actionDmg(0.2);
  } else if (kind === "stakeout") {
    dmg = actionDmg(0.02);
    b.leads = Math.min(MAX_LEADS, b.leads + 2);
    label = "+2 leads";
  } else if (kind === "cover") {
    dmg = actionDmg(0.06);
    S.heat = Math.max(0, S.heat - 6);
  } else if (kind === "crew") {
    dmg = actionDmg(0.15);
    const who = pick(crewHere());
    say(pick(CREW_LINES[who]));
  } else {
    dmg = actionDmg(0.1 * b.leads);
    b.leads = 0;
    S.heat += 3 * heatMult();
  }

  if (dmg > 0) {
    b.hp -= dmg;
    if (kind !== "investigate" && kind !== "stakeout") label = "-" + fmt(dmg);
    if (kind !== "crew") say(pick(def(kind).lines));
  }
  b.cd[kind] = def(kind).cd;
  hitBoss();
  if (x !== undefined && y !== undefined && label) floatText(label, x - 16, y - 24);
  beep(kind === "con" && !dmg ? 140 : 320, 0.05, kind === "con" && !dmg ? "sawtooth" : "triangle", 0.04);
  checkBurn();
  if (S.boss && S.boss.hp <= 0) winBoss();
}

/** Per-tick boss behavior: passive damage plus the boss's mechanic tags. */
export function tickBoss(dt: number): void {
  if (S.fionaAway > 0) S.fionaAway = Math.max(0, S.fionaAway - dt);
  if (!S.boss) {
    if (inFlashback()) return; // no one else turns up while Sam is telling his story
    S.bossCd -= dt;
    if (S.bossCd <= 0) spawnBoss();
    return;
  }
  const b = S.boss;
  if (b.cd) for (const k in b.cd) if (b.cd[k] > 0) b.cd[k] = Math.max(0, b.cd[k] - dt);
  const def = bossDef()!, m = def.m, has = (t: (typeof m)[number]) => m.includes(t);
  if (def.lines && Math.random() < dt / 22) say(pick(def.lines)); // now and then, the fight gets a bit of color
  b.hp -= cps() * (has("weak") ? 0.5 : 1.5) * dt;
  b.left -= dt * (has("rush") ? 1.5 : 1);
  const mult = has("heat") && has("att") ? 0.6 : 1;
  if (has("heat")) S.heat += 1.5 * mult * heatMult() * dt;
  if (has("att")) S.att = Math.min(100, S.att + 1.2 * mult * dt);
  if (has("steal")) S.cash = Math.max(0, S.cash - S.cash * 0.008 * dt);
  if (has("heal")) b.hp = Math.min(b.max, b.hp + b.max * 0.015 * dt);
  if (has("fx")) { S.fx.boost = 0; S.fx.jobs = 0; S.fx.jam = 0; S.fx.pay = 0; S.fx.fast = 0; }
  if (has("freeze")) for (const k in S.allyCd) if (S.allyCd[k] > 0) S.allyCd[k] += dt;
  if (b.hp <= 0) winBoss();
  else if (b.left <= 0) loseBoss();
}
