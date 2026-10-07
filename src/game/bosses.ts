import { S, earn } from "../state";
import { bossDef, bossHP, cps, heatMult, strikeDmg } from "../calc";
import { BOSSES } from "../data/bosses";
import { beep, chime } from "../audio";
import { money, pick } from "../util";
import { floatText, hitBoss, say, shake, toast } from "../ui/fx";
import { fmt } from "../util";
import { checkBurn } from "./heat";
import { learnName, reduceGrip } from "./org";

export function spawnBoss(): void {
  const pool = BOSSES.filter(b => S.life >= b.at);
  if (!pool.length) { S.bossCd = 60; return; }
  const b = pick(pool), max = bossHP(b);
  S.boss = { id: b.id, hp: max, max, left: 75 };
  shake(); beep(100, 0.5, "sawtooth", 0.08, -40);
  toast("BOSS: " + b.n, b.title);
  say(b.intro);
}

export function winBoss(): void {
  const b = bossDef()!;
  const reward = cps() * 200 * b.hpm + 500, fav = Math.ceil(2 * b.hpm);
  const first = !S.bossKills[b.id];
  earn(reward); S.favors += fav; S.bossKills[b.id] = (S.bossKills[b.id] || 0) + 1;
  learnName(b.id); reduceGrip(5);
  S.boss = null; S.bossCd = 240 + Math.random() * 180;
  chime();
  toast(b.n + " defeated", `+${money(reward)}, +${fav} favors${first ? " · first win: +3% income forever" : ""}`);
  say(b.n + " walks away with nothing, which is the best outcome you can ask for.");
}

export function loseBoss(): void {
  const b = bossDef()!;
  S.cash *= 0.92; S.heat += 15; S.att = Math.min(99, S.att + 20);
  S.boss = null; S.bossCd = 240 + Math.random() * 180;
  beep(130, 0.4, "sawtooth", 0.06, -50);
  toast(b.n + " got away", "−8% cash, extra heat and attention.");
  say(b.n + " slips out with what they came for. You'll see them again.");
}

export function strike(x?: number, y?: number): void {
  if (!S.boss) return;
  const dmg = strikeDmg();
  S.boss.hp -= dmg;
  hitBoss();
  if (x !== undefined && y !== undefined) floatText("-" + fmt(dmg), x - 16, y - 24);
  S.heat += 2 * heatMult();
  beep(220, 0.05, "sawtooth", 0.04);
  checkBurn();
  if (S.boss && S.boss.hp <= 0) winBoss();
}

/** Per-tick boss behavior: passive damage plus the boss's mechanic tags. */
export function tickBoss(dt: number): void {
  if (!S.boss) {
    S.bossCd -= dt;
    if (S.bossCd <= 0) spawnBoss();
    return;
  }
  const b = S.boss, m = bossDef()!.m, has = (t: (typeof m)[number]) => m.includes(t);
  b.hp -= cps() * (has("weak") ? 0.5 : 1.5) * dt;
  b.left -= dt * (has("rush") ? 1.5 : 1);
  const mult = has("heat") && has("att") ? 0.6 : 1;
  if (has("heat")) S.heat += 1.5 * mult * heatMult() * dt;
  if (has("att")) S.att = Math.min(100, S.att + 1.2 * mult * dt);
  if (has("steal")) S.cash = Math.max(0, S.cash - S.cash * 0.008 * dt);
  if (has("heal")) b.hp = Math.min(b.max, b.hp + b.max * 0.015 * dt);
  if (has("fx")) { S.fx.boost = 0; S.fx.jobs = 0; S.fx.jam = 0; }
  if (has("freeze")) for (const k in S.allyCd) if (S.allyCd[k] > 0) S.allyCd[k] += dt;
  if (b.hp <= 0) winBoss();
  else if (b.left <= 0) loseBoss();
}
