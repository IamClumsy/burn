// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { S, fresh, setState } from "../state";
import { ROTATING } from "../data/caseActions";
import { actionBlock, bossAction, tickBoss } from "./bosses";
import { BOSSES } from "../data/bosses";
import { bossHP } from "../calc";

/** A player who taps the big tile as fast as it allows (and Spring the Trap whenever it's ready) should see every tool. */
function playFight(clickEvery: number): { counts: Record<string, number>; seconds: number; won: boolean } {
  setState(fresh());
  S.life = 1e10; S.gens = { inf: 60, tape: 50, sam: 40, fi: 30 }; S.allies = { sam: true, fiona: true };
  S.favors = 3; S.junk = { tape: 9, wire: 9, bleach: 9, micro: 9 };
  const b = BOSSES.find(x => x.id === "larry")!;
  S.boss = { id: b.id, hp: bossHP(b), max: bossHP(b), left: 75 };
  const counts: Record<string, number> = {};
  let idx = 0, t = 0;
  const pick = () => {
    if (!actionBlock(ROTATING[idx])) return ROTATING[idx];
    for (let i = 1; i < ROTATING.length; i++) { const n = (idx + i) % ROTATING.length; if (!actionBlock(ROTATING[n])) { idx = n; return ROTATING[n]; } }
    return null;
  };
  while (S.boss && t < 120) {
    if ((S.boss.leads || 0) >= 3 && !actionBlock("trap")) { bossAction("trap"); counts.trap = (counts.trap || 0) + 1; }
    else { const k = pick(); if (k) { bossAction(k); counts[k] = (counts[k] || 0) + 1; } }
    for (let i = 0; i < clickEvery * 10 && S.boss; i++) { tickBoss(0.1); t += 0.1; }
  }
  return { counts, seconds: t, won: !S.boss };
}

describe("case encounters stay varied", () => {
  it("tapping as fast as possible still uses most of the tools, not just Play an Angle", () => {
    document.body.innerHTML = readFileSync("index.html", "utf8").match(/<body[^>]*>([\s\S]*)<\/body>/)![1].replace(/<script[\s\S]*?<\/script>/g, "");
    for (const every of [0.7, 1.5]) {
      const { counts, won } = playFight(every);
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      expect(won).toBe(true);
      expect((counts.investigate || 0) / total, `every ${every}s`).toBeLessThan(0.3);
      expect(Object.keys(counts).length, `every ${every}s`).toBeGreaterThanOrEqual(6);
    }
  });

  it("and fights aren't over in a flash: tens of seconds, not a few", () => {
    const { seconds } = playFight(0.7);
    expect(seconds).toBeGreaterThan(8);
  });
});
