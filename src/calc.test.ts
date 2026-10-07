import { beforeEach, describe, expect, it } from "vitest";
import { fresh, merge, setState, S } from "./state";
import { bulkCost, clickVal, cps, credGain, heatMult, incomeMult, maxAfford, owned, succChance } from "./calc";
import { GENS } from "./data/ops";
import { fmt, money } from "./util";
import type { Mission } from "./types";

const mission = (over: Partial<Mission> = {}): Mission => ({
  uid: 1, n: "t", dur: 30, succ: 0.8, heat: 5, rm: 1, fav: 1, ally: "sam", kid: false, send: false, ...over,
});

beforeEach(() => setState(fresh()));

describe("economy", () => {
  it("starts with no income and a $1 click", () => {
    expect(cps()).toBe(0);
    expect(incomeMult()).toBeCloseTo(1);
    expect(clickVal()).toBeCloseTo(1.3); // contractor cover
  });

  it("income scales with owned operations", () => {
    S.gens.inf = 10;
    expect(cps()).toBeCloseTo(10 * 0.5);
  });

  it("bulk cost is the sum of the individual prices", () => {
    S.gens.inf = 3;
    const g = GENS[0];
    let sum = 0;
    for (let i = 0; i < 5; i++) sum += g.base * Math.pow(1.15, 3 + i);
    expect(bulkCost(g, 5)).toBeCloseTo(sum, 6);
  });

  it("maxAfford never exceeds what the cash covers", () => {
    S.cash = 5000;
    const n = maxAfford(GENS[0]);
    expect(bulkCost(GENS[0], n)).toBeLessThanOrEqual(5000);
    expect(bulkCost(GENS[0], n + 1)).toBeGreaterThan(5000);
  });

  it("credibility grows with the square root of the run", () => {
    S.run = 4e6;
    expect(credGain()).toBe(2);
    S.run = 5e5;
    expect(credGain()).toBe(0);
  });

  it("Sam trims heat gain by 15%", () => {
    const base = heatMult();
    S.allies.sam = true;
    expect(heatMult()).toBeCloseTo(base * 0.85);
  });

  it("jammer stops heat entirely", () => {
    S.fx.jam = 10;
    expect(heatMult()).toBe(0);
  });
});

describe("missions", () => {
  it("never fail when a kid is involved", () => {
    expect(succChance(mission({ kid: true, succ: 1 }))).toBe(1);
    expect(succChance(mission({ kid: true, succ: 0.2 }))).toBe(1);
  });

  it("an available ally adds 25% and success is capped at 97%", () => {
    S.allies.sam = true;
    expect(succChance(mission({ send: true }))).toBeCloseTo(0.97);
    expect(succChance(mission({ succ: 0.5, send: true }))).toBeCloseTo(0.75);
  });
});

describe("saves", () => {
  it("merge fills in fields missing from old saves", () => {
    const old = { cash: 123, stats: { clicks: 9 } } as unknown as Parameters<typeof merge>[0];
    const m = merge(old);
    expect(m.cash).toBe(123);
    expect(m.stats.clicks).toBe(9);
    expect(m.stats.kidMissions).toBe(0);
    expect(m.junk.wire).toBe(0);
    expect(m.bossKills).toEqual({});
  });
});

describe("formatting", () => {
  it("abbreviates large numbers", () => {
    expect(fmt(999)).toBe("999");
    expect(fmt(1500)).toBe("1.50K");
    expect(money(2.5e9)).toBe("$2.50B");
    expect(owned("nope")).toBe(0);
  });
});
