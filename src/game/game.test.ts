// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { S, fresh, setState } from "../state";
import { tick, tickNate } from "./tick";
import { buyFavorFrom, useAbility } from "./actions";
import { arcAvailable, startArc } from "./arcs";
import { ARCS } from "../data/arcs";
import { STORY } from "../data/story";
import { choiceMult, choiceSucc, missionReward } from "../calc";
import { allyFree, allyHere, contactPrice, succChance } from "../calc";
import { fillBoard, resolveMission, startMission } from "./missions";
import { spawnBoss, strike } from "./bosses";
import { strikeDmg } from "../calc";
import { checkBurn } from "./heat";
import { BOSSES } from "../data/bosses";
import { EVENTS } from "../data/events";
import { MISSIONS } from "../data/missions";
import { merge } from "../state";
import { render } from "../ui/render";
import { MODALS, SECTIONS, buildLayout, panelHTML } from "../ui/panels";

beforeAll(() => {
  const html = readFileSync(resolve(__dirname, "../../index.html"), "utf8");
  document.body.innerHTML = html.split("<body>")[1].split("<script")[0];
  buildLayout(document.getElementById("sections")!, document.getElementById("toolbar")!);
});

beforeEach(() => { setState(fresh()); fillBoard(); });

describe("frienemies", () => {
  it("Seymour sells a favor and some gear, and the price climbs", () => {
    S.cash = 1e6; S.gens.inf = 20;
    const before = S.cash, junk = Object.values(S.junk).reduce((x, y) => x + y, 0);
    buyFavorFrom("seymour");
    expect(S.favors).toBe(1);
    expect(S.stats.seymourFavors).toBe(1);
    expect(Object.values(S.junk).reduce((x, y) => x + y, 0)).toBe(junk + 2);
    const second = S.cash;
    buyFavorFrom("seymour");
    expect(before - second).toBeLessThan(second - S.cash);
  });

  it("Simon sells a favor and lowers the Organization's attention", () => {
    S.cash = 1e6; S.gens.inf = 20; S.att = 50;
    buyFavorFrom("simon");
    expect(S.favors).toBe(1);
    expect(S.stats.simonFavors).toBe(1);
    expect(S.att).toBe(40);
  });

  it("each frienemy keeps their own price", () => {
    S.cash = 1e6; S.gens.inf = 20;
    buyFavorFrom("seymour"); buyFavorFrom("seymour");
    expect(contactPrice("simon")).toBeLessThan(contactPrice("seymour"));
  });

  it("does nothing if you can't afford them", () => {
    S.cash = 0;
    buyFavorFrom("seymour"); buyFavorFrom("simon");
    expect(S.favors).toBe(0);
  });
});

describe("story choices", () => {
  const idx = STORY.findIndex(b => b.t === "The Founder");

  it("a choice applies a permanent bonus", () => {
    S.gens.inf = 20;
    const before = choiceMult("inc");
    expect(before).toBe(1);
    S.choices[idx] = 0; // take his deal: +15% income, +20% attention
    expect(choiceMult("inc")).toBeCloseTo(1.15);
    expect(choiceMult("att")).toBeCloseTo(1.2);
  });

  it("choices are independent and can stack", () => {
    const carla = STORY.findIndex(b => b.t === "A Case Officer Named Carla");
    const burned = STORY.findIndex(b => b.t === "Another Burned Spy");
    const base = missionReward({ uid: 1, n: "t", dur: 1, succ: .5, heat: 1, rm: 1, fav: 1, ally: "sam", kid: false, send: false });
    S.choices[carla] = 0; S.choices[burned] = 0;
    expect(choiceSucc()).toBeCloseTo(0.05);
    const after = missionReward({ uid: 1, n: "t", dur: 1, succ: .5, heat: 1, rm: 1, fav: 1, ally: "sam", kid: false, send: false });
    expect(after / base).toBeCloseTo(1.15, 1);
  });
});

describe("case arcs", () => {
  it("are locked until you've earned enough", () => {
    expect(arcAvailable(ARCS[0])).toBe(false);
    S.life = ARCS[0].at;
    expect(arcAvailable(ARCS[0])).toBe(true);
  });

  it("advance one step per success and close with the last", () => {
    const a = ARCS[0];
    S.life = a.at; S.gens.inf = 10;
    for (let step = 0; step < a.steps.length; step++) {
      startArc(a.id);
      const m = S.active.find(x => x.arc?.id === a.id)!;
      expect(m.arc!.step).toBe(step);
      m.chance = 1;
      resolveMission(m);
    }
    expect(S.arcsDone[a.id]).toBe(true);
    expect(S.favors).toBeGreaterThanOrEqual(a.favors);
    expect(arcAvailable(a)).toBe(false);
  });

  it("a failed step doesn't advance the case", () => {
    const a = ARCS[0];
    S.life = a.at;
    startArc(a.id);
    const m = S.active[0];
    m.chance = 0;
    resolveMission(m);
    expect(S.arcStep[a.id] || 0).toBe(0);
    expect(arcAvailable(a)).toBe(true);
  });

  it("won't start while all three mission slots are busy", () => {
    S.life = ARCS[0].at;
    S.active = [1, 2, 3].map(n => ({ uid: n, n: "x", dur: 10, succ: .5, heat: 1, rm: 1, fav: 1, ally: "sam", kid: false, send: false, sent: null, left: 10, chance: .5, reward: 1 }));
    startArc(ARCS[0].id);
    expect(S.active.length).toBe(3);
  });
});

describe("Nate", () => {
  it("is only available when he hasn't wandered off", () => {
    S.allies.nate = true; S.nateAway = false;
    expect(allyHere("nate")).toBe(true);
    S.nateAway = true;
    expect(allyHere("nate")).toBe(false);
    expect(allyFree("nate")).toBe(false);
  });

  it("can't use his ability, or be sent on a mission, while away", () => {
    S.allies.nate = true; S.nateAway = true; S.cash = 0;
    useAbility("nate");
    expect(S.allyCd.nate || 0).toBe(0);
    const m = { uid: 1, n: "t", dur: 10, succ: 0.5, heat: 1, rm: 1, fav: 1, ally: "nate", kid: false, send: true };
    expect(succChance(m)).toBeCloseTo(0.5); // no +25% when he's gone
    S.nateAway = false;
    expect(succChance(m)).toBeCloseTo(0.75);
  });

  it("his ability pays out when he's around", () => {
    S.allies.nate = true; S.nateAway = false; S.gens.inf = 20;
    useAbility("nate");
    expect(S.allyCd.nate).toBeGreaterThan(0);
  });

  it("wanders off and comes back on his own", () => {
    S.allies.nate = true; S.nateAway = false; S.nateTimer = 0;
    tickNate(0.1);
    expect(S.nateAway).toBe(true);
    expect(S.nateTimer).toBeGreaterThan(40);
    S.nateTimer = 0;
    tickNate(0.1);
    expect(S.nateAway).toBe(false);
  });

  it("does nothing until he's hired", () => {
    S.nateTimer = 0;
    tickNate(1);
    expect(S.nateAway).toBe(false);
  });
});

describe("game loop (headless)", () => {
  it("earns money over time", () => {
    S.gens.inf = 20;
    for (let i = 0; i < 100; i++) tick(0.1);
    expect(S.cash).toBeGreaterThan(50);
  });

  it("burns you at 100% heat and halves your cash", () => {
    S.cash = 1000; S.heat = 100;
    checkBurn();
    expect(S.cash).toBe(500);
    expect(S.heat).toBe(30);
    expect(S.stats.burns).toBe(1);
  });

  it("a kid mission always pays out and counts toward the medal", () => {
    const kid = MISSIONS.find(m => m.kid)!;
    S.board = [{ uid: 99, n: kid.n, dur: 1, succ: kid.succ, heat: kid.heat, rm: kid.rm, fav: kid.fav, ally: kid.ally, kid: true, send: false }];
    startMission(99);
    for (let i = 0; i < 50; i++) { const m = S.active[0]; if (!m) break; resolveMission(m); }
    expect(S.stats.mDone).toBe(1);
    expect(S.stats.kidMissions).toBe(1);
    expect(S.favors).toBe(kid.fav);
    expect(S.stats.returned).toBeGreaterThan(0); // most of the fee went back to the client
  });

  it("a boss can be spawned, struck down, and counts as defeated", () => {
    S.life = 1e13; S.gens.inf = 5;
    spawnBoss();
    expect(S.boss).not.toBeNull();
    const id = S.boss!.id;
    S.boss!.hp = 1;
    strike();
    expect(S.boss).toBeNull();
    expect(S.bossKills[id]).toBe(1);
  });

  it("a strike takes a meaningful slice of any boss's health", () => {
    S.life = 1e13; S.gens.inf = 8;
    for (const b of BOSSES) {
      S.boss = { id: b.id, hp: 1000, max: 1000, left: 75 };
      expect(strikeDmg() / 1000, b.id).toBeGreaterThanOrEqual(0.02);
    }
    S.boss = null;
  });

  it("every boss mechanic runs for several seconds without error", () => {
    S.life = 1e13; S.gens.inf = 30; S.cash = 1e6;
    for (const b of BOSSES) {
      S.boss = { id: b.id, hp: 1e12, max: 1e12, left: 75 };
      for (let i = 0; i < 30; i++) tick(0.1);
      expect(S.boss?.id ?? b.id).toBe(b.id);
      S.boss = null; S.heat = 0; S.att = 0;
    }
  });

  it("every event option resolves to a message", () => {
    S.cash = 1e6; S.gens.inf = 5;
    for (const e of EVENTS) for (const [, run] of e.o) expect(typeof run()).toBe("string");
  });

  it("every card and pop-up renders without throwing", () => {
    S.life = 1e12; S.cash = 1e9;
    for (const [id] of [...SECTIONS, ...MODALS]) expect(() => panelHTML(id)).not.toThrow();
    expect(() => render()).not.toThrow();
    for (const [id] of SECTIONS) expect(document.getElementById("sec-" + id)!.innerHTML.length).toBeGreaterThan(0);
  });

  it("old saves load into the current shape", () => {
    const m = merge({ cash: 5 } as never);
    expect(m.board).toEqual([]);
    expect(m.stats.kidMissions).toBe(0);
  });
});
