// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { S, fresh, setState } from "../state";
import { tick, tickNate } from "./tick";
import { buyFavorFrom, useAbility } from "./actions";
import { arcAvailable, startArc } from "./arcs";
import { ARCS } from "../data/arcs";
import { STORY } from "../data/story";
import { attTier, choiceMult, choiceSucc, gripFixer, heatMult, incomeMult, missionReward } from "../calc";
import { allBeaten, checkEnding, reduceGrip, simonTip, spawnErrand } from "./org";
import { GRIP_PERKS, TIERS } from "../data/org";
import { allyFree, allyHere, contactPrice, succChance } from "../calc";
import { fillBoard, resolveMission, startMission } from "./missions";
import { actionBlock, bossAction, spawnBoss } from "./bosses";
import { actionDmg, conChance } from "../calc";
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

describe("the Organization", () => {
  afterEach(() => vi.restoreAllMocks());

  it("attention has named stages that make things harder", () => {
    S.att = 0; expect(attTier()).toBe(0);
    const calm = heatMult();
    S.att = 25; expect(attTier()).toBe(1);
    S.att = 50; expect(attTier()).toBe(2);
    S.att = 80; expect(attTier()).toBe(3);
    expect(heatMult()).toBeCloseTo(calm * 1.3);
    const m = { uid: 1, n: "t", dur: 1, succ: .5, heat: 1, rm: 1, fav: 1, ally: "sam", kid: false, send: false };
    expect(succChance(m)).toBeCloseTo(0.4);
    // kids stay guaranteed no matter how hot it is
    expect(succChance({ ...m, kid: true })).toBe(1);
  });

  it("wearing down their grip unlocks permanent perks", () => {
    S.gens.inf = 20;
    const base = incomeMult();
    reduceGrip(30); // 70: Rattled
    expect(S.grip).toBe(70);
    expect(incomeMult()).toBeCloseTo(base * 1.05);
    reduceGrip(50); // 20: past Losing Hold
    expect(gripFixer()).toBe(0.5);
    reduceGrip(500);
    expect(S.grip).toBe(0); // never below zero
  });

  it("winning a boss crosses a name off the List and loosens their grip", () => {
    S.life = 1e13; S.gens.inf = 5;
    spawnBoss();
    const id = S.boss!.id;
    S.boss!.hp = 1;
    bossAction("investigate");
    expect(S.listKnown[id]).toBe(true);
    expect(S.grip).toBe(95);
  });

  it("Simon sometimes passes you a name", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    simonTip();
    expect(Object.keys(S.listKnown).length).toBe(1);
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    simonTip();
    expect(Object.keys(S.listKnown).length).toBe(1);
  });

  it("completing the List lifts the burn once", () => {
    S.gens.inf = 20;
    for (const b of BOSSES) S.bossKills[b.id] = 1;
    const before = incomeMult(); // already includes the per-boss bonuses
    expect(allBeaten()).toBe(true);
    checkEnding();
    expect(S.cleanRecord).toBe(true);
    expect(S.favors).toBe(15);
    expect(incomeMult()).toBeCloseTo(before * 1.25);
    checkEnding();
    expect(S.favors).toBe(15);
  });

  it("handlers only call once they're watching, and you can refuse", () => {
    S.att = 5; S.gens.inf = 10;
    spawnErrand();
    expect(document.getElementById("evt")!.style.display).not.toBe("flex");
    S.att = 30;
    spawnErrand();
    expect(document.getElementById("evt")!.style.display).toBe("flex");
    const buttons = [...document.querySelectorAll<HTMLButtonElement>("#evtO button")];
    expect(buttons.map(b => b.textContent)).toContain("Refuse");
    buttons.find(b => b.textContent === "Refuse")!.click();
    expect(S.favors).toBe(1);
    expect(S.att).toBe(35);
  });

  it("doing the job as asked pays well but raises attention", () => {
    S.att = 30; S.gens.inf = 10;
    spawnErrand();
    const cash = S.cash;
    [...document.querySelectorAll<HTMLButtonElement>("#evtO button")].find(b => b.textContent === "Do the job as asked")!.click();
    expect(S.cash).toBeGreaterThan(cash);
    expect(S.att).toBe(40);
    expect(S.stats.errands).toBe(1);
  });

  it("data is ordered sensibly", () => {
    for (let i = 1; i < TIERS.length; i++) expect(TIERS[i].min).toBeGreaterThan(TIERS[i - 1].min);
    for (let i = 1; i < GRIP_PERKS.length; i++) expect(GRIP_PERKS[i].at).toBeLessThan(GRIP_PERKS[i - 1].at);
  });
});

describe("pronouns on the mission board", () => {
  it("says 'her' for Fiona and Madeline and 'him' for the men", () => {
    for (const [ally, word] of [["fiona", "her"], ["madeline", "her"], ["sam", "him"], ["jesse", "him"], ["barry", "him"]]) {
      S.allies = {};
      S.board = [{ uid: 1, n: "t", dur: 10, succ: .5, heat: 1, rm: 1, fav: 1, ally, kid: false, send: false }];
      S.life = 1e6;
      const text = panelHTML("mis");
      expect(text, ally).toContain(`to send ${word} (+25%)`);
    }
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
    bossAction("investigate");
    expect(S.boss).toBeNull();
    expect(S.bossKills[id]).toBe(1);
  });

  it("every case action makes real progress against any boss", () => {
    S.life = 1e13; S.gens.inf = 8;
    for (const b of BOSSES) {
      S.boss = { id: b.id, hp: 1000, max: 1000, left: 75 };
      expect(actionDmg(0.03) / 1000, b.id).toBeGreaterThanOrEqual(0.01);
      expect(actionDmg(0.2) / 1000, b.id).toBeGreaterThan(actionDmg(0.03) / 1000);
    }
    S.boss = null;
  });

  describe("case actions", () => {
    const setup = () => { S.life = 1e13; S.gens.inf = 8; S.boss = { id: "paxson", hp: 1e6, max: 1e6, left: 75 }; };

    it("working the angle builds leads, up to five", () => {
      setup();
      for (let i = 0; i < 8; i++) { bossAction("investigate"); S.boss!.cd!.investigate = 0; }
      expect(S.boss!.leads).toBe(5);
    });

    it("springing the trap needs 3 leads, spends them, and hits harder with more", () => {
      setup();
      expect(actionBlock("trap")).toMatch(/3 leads/);
      S.boss!.leads = 3;
      const before = S.boss!.hp;
      bossAction("trap");
      const threeLeads = before - S.boss!.hp;
      expect(S.boss!.leads).toBe(0);
      S.boss!.hp = before; S.boss!.cd = {}; S.boss!.leads = 5;
      bossAction("trap");
      expect(before - S.boss!.hp).toBeGreaterThan(threeLeads);
    });

    it("a con can land or blow up", () => {
      setup();
      vi.spyOn(Math, "random").mockReturnValue(0.01);
      const hp = S.boss!.hp;
      bossAction("con");
      expect(S.boss!.hp).toBeLessThan(hp);
      S.boss!.cd = {}; S.heat = 0;
      vi.spyOn(Math, "random").mockReturnValue(0.99);
      const hp2 = S.boss!.hp;
      bossAction("con");
      expect(S.boss!.hp).toBe(hp2);
      expect(S.heat).toBeGreaterThan(0);
      expect(conChance()).toBeLessThanOrEqual(0.95);
      vi.restoreAllMocks();
    });

    it("gadgets and favors cost something real", () => {
      setup();
      expect(actionBlock("gadget")).toMatch(/wire/);
      expect(actionBlock("favor")).toMatch(/favor/);
      S.junk.wire = 1; S.junk.tape = 1; S.favors = 1;
      bossAction("gadget"); bossAction("favor");
      expect(S.junk.wire).toBe(0);
      expect(S.junk.tape).toBe(0);
      expect(S.favors).toBe(0);
    });

    it("actions go on cooldown", () => {
      setup();
      bossAction("investigate");
      expect(actionBlock("investigate")).toMatch(/Ready in/);
      const leads = S.boss!.leads;
      bossAction("investigate");
      expect(S.boss!.leads).toBe(leads);
    });
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
