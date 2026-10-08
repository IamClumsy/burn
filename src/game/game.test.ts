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
import { allBeaten, checkEnding, newFixer, reduceGrip, simonTip, spawnErrand, tickOrg } from "./org";
import { FIXER_MAX_MULT, FIXER_MIN_MULT, rollFixer } from "../data/org";
import { bribeCost, bribeDrop } from "../calc";
import { payOffFixer } from "./actions";
import { GRIP_PERKS, TIERS } from "../data/org";
import { FAQ } from "../data/faq";
import { BOSS_FIRST, BOSS_GAP_MIN, BOSS_GAP_SPREAD, bossGapText, nextBossGap } from "../data/pacing";
import { loftBadges } from "../ui/badges";
import { allyFree, allyHere, contactPrice, hangOutPrice, succChance } from "../calc";
import { tickBusy } from "./tick";
import { fillBoard, resolveMission, startMission } from "./missions";
import { actionBlock, bossAction, spawnBoss } from "./bosses";
import { spawnClient } from "./events";
import { seasonOf } from "../data/missions";
import { EP_NOTES } from "../data/episodeNotes";
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

beforeEach(() => {
  setState(fresh()); fillBoard();
  document.getElementById("log")!.innerHTML = ""; // narration from one test shouldn't leak into the next
});

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

  it("Seymour and Simon don't cost the same", () => {
    S.gens.inf = 20;
    expect(contactPrice("simon")).toBeGreaterThan(contactPrice("seymour")); // intel is higher stakes
  });

  it("each keeps their own price, and Simon's climbs faster", () => {
    S.cash = 1e9; S.gens.inf = 20;
    const s0 = contactPrice("seymour"), n0 = contactPrice("simon");
    buyFavorFrom("seymour");
    expect(contactPrice("seymour")).toBeGreaterThan(s0);
    expect(contactPrice("simon")).toBe(n0); // buying from Seymour doesn't move Simon's price
    buyFavorFrom("simon");
    expect(contactPrice("simon") / n0).toBeCloseTo(1.15);
    expect(contactPrice("seymour") / s0).toBeCloseTo(1.12);
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

describe("client at the door", () => {
  const buttons = () => [...document.querySelectorAll<HTMLButtonElement>("#evtO button")];

  it("is a prominent dialog with the pay up front and a clear main action", () => {
    S.gens.inf = 10;
    spawnClient();
    expect(document.getElementById("evt")!.style.display).toBe("flex");
    expect(document.getElementById("evtDlg")!.classList.contains("client")).toBe(true);
    expect(document.getElementById("evtT")!.textContent).toMatch(/client is at the door/i);
    expect(document.getElementById("evtBig")!.textContent).toMatch(/^\$/);
    expect(buttons().map(b => b.textContent)).toEqual(["Take the case", "Send them away"]);
    expect(buttons()[0].className).toBe("primary");
    buttons()[1].click();
  });

  it("taking the case pays you and adds a little heat", () => {
    S.gens.inf = 10;
    spawnClient();
    const cash = S.cash;
    buttons()[0].click();
    expect(S.cash).toBeGreaterThan(cash);
    expect(S.heat).toBeGreaterThan(0);
  });

  it("sending them away costs nothing", () => {
    S.gens.inf = 10;
    spawnClient();
    const cash = S.cash;
    buttons()[1].click();
    expect(S.cash).toBe(cash);
    expect(S.heat).toBe(0);
  });

  it("waits its turn instead of stacking on top of another decision", () => {
    spawnClient();
    const first = document.getElementById("evtT")!.textContent;
    spawnClient(); // would overwrite the open dialog if it didn't wait
    expect(document.getElementById("evtT")!.textContent).toBe(first);
    buttons()[1].click();
  });
});

describe("fixers", () => {
  it("every fixer asks something different, within sane bounds", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const f = rollFixer();
      expect(f.mult).toBeGreaterThanOrEqual(FIXER_MIN_MULT);
      expect(f.mult).toBeLessThanOrEqual(FIXER_MAX_MULT);
      expect(f.drop).toBeGreaterThanOrEqual(25);
      expect(f.drop).toBeLessThanOrEqual(56);
      seen.add(f.mult + ":" + f.drop);
    }
    expect(seen.size).toBeGreaterThan(50);
  });

  it("dearer fixers do more good on average", () => {
    let cheap = 0, dear = 0, nCheap = 0, nDear = 0;
    for (let i = 0; i < 2000; i++) {
      const f = rollFixer();
      if (f.mult < 1) { cheap += f.drop; nCheap++; } else { dear += f.drop; nDear++; }
    }
    expect(dear / nDear).toBeGreaterThan(cheap / nCheap);
  });

  it("the price depends on who's offering and how close the Organization is", () => {
    S.gens.inf = 20; S.att = 0;
    S.fixer = { name: "A", mult: 1, drop: 40, left: 60 };
    const base = bribeCost();
    S.fixer = { name: "B", mult: 1.5, drop: 40, left: 60 };
    expect(bribeCost()).toBeCloseTo(base * 1.5);
    S.fixer = { name: "A", mult: 1, drop: 40, left: 60 };
    S.att = 50;
    expect(bribeCost()).toBeCloseTo(base * 1.5);
    S.att = 100;
    expect(bribeCost()).toBeCloseTo(base * 2);
  });

  it("paying uses that fixer's reach, then someone new turns up", () => {
    S.gens.inf = 20; S.cash = 1e9; S.att = 80;
    const lou = { name: "Lou the bookie", mult: 1, drop: 33, left: 60 };
    S.fixer = lou;
    expect(bribeDrop()).toBe(33);
    payOffFixer();
    expect(S.att).toBe(47);
    expect(S.fixer).not.toBe(lou); // Lou's done; a different fixer is on offer now
    expect(S.fixer!.left).toBeGreaterThan(40);
  });

  it("fixers move on after a while", () => {
    newFixer();
    const first = S.fixer!;
    first.left = 0.5;
    tickOrg(1);
    expect(S.fixer).not.toBe(first);
    expect(S.fixer!.left).toBeGreaterThan(40);
  });
});

describe("Loft badges", () => {
  it("start quiet", () => {
    const b = loftBadges();
    expect(b.gad).toEqual({ text: "", ready: false });
    expect(b.fav).toEqual({ text: "", ready: false });
    expect(b.crew.ready).toBe(false);
  });

  it("gadgets show your parts and glow when you can craft something", () => {
    S.junk = { tape: 1, wire: 0, bleach: 1, micro: 0 }; // smoke bomb: 1 bleach + 1 tape
    expect(loftBadges().gad).toEqual({ text: "2 parts", ready: true });
    S.junk = { tape: 1, wire: 0, bleach: 0, micro: 0 };
    expect(loftBadges().gad).toEqual({ text: "1 part", ready: false });
  });

  it("favors show your count and glow when a perk is affordable", () => {
    S.favors = 1;
    expect(loftBadges().fav).toEqual({ text: "1", ready: false }); // cheapest perk costs 2
    S.favors = 5;
    expect(loftBadges().fav).toEqual({ text: "5", ready: true });
  });

  it("crew glows when an ally ability is ready, and not while Nate is away", () => {
    S.allies.sam = true;
    expect(loftBadges().crew).toEqual({ text: "1 ready", ready: true });
    S.allyCd.sam = 30;
    expect(loftBadges().crew.ready).toBe(false);
    S.allies.nate = true; S.nateAway = true;
    expect(loftBadges().crew.ready).toBe(false);
  });

  it("the buttons exist in the Loft and the old cards are gone from the grid", () => {
    for (const id of ["crew", "cov", "gad", "fav"]) expect(document.getElementById("lb-" + id), id).not.toBeNull();
    const cards = [...document.querySelectorAll("#sections .sec > h2")].map(h => h.textContent);
    expect(cards).toEqual(["Missions", "Upgrades", "Operations"]);
  });
});

describe("boss pacing", () => {
  it("the first boss waits six minutes", () => {
    expect(fresh().bossCd).toBe(BOSS_FIRST);
    expect(BOSS_FIRST).toBeGreaterThanOrEqual(360);
  });

  it("bosses are spaced seven to eleven minutes apart", () => {
    for (let i = 0; i < 200; i++) {
      const gap = nextBossGap();
      expect(gap).toBeGreaterThanOrEqual(BOSS_GAP_MIN);
      expect(gap).toBeLessThanOrEqual(BOSS_GAP_MIN + BOSS_GAP_SPREAD);
    }
    expect(bossGapText()).toBe("7 to 11 minutes");
  });

  it("winning or losing an encounter sets the next gap", () => {
    S.life = 1e13; S.gens.inf = 5;
    spawnBoss();
    S.boss!.hp = 1;
    bossAction("investigate");
    expect(S.boss).toBeNull();
    expect(S.bossCd).toBeGreaterThanOrEqual(BOSS_GAP_MIN);
    expect(S.bossCd).toBeLessThanOrEqual(BOSS_GAP_MIN + BOSS_GAP_SPREAD);

    spawnBoss();
    S.boss!.left = 0.01;
    tick(0.1); // the clock runs out
    expect(S.boss).toBeNull();
    expect(S.bossCd).toBeGreaterThanOrEqual(BOSS_GAP_MIN);
  });

  it("the FAQ and Rogues text quote the same gap", () => {
    expect(panelHTML("rogue")).toContain(bossGapText());
    expect(FAQ.flatMap(f => f.items).map(i => i.a()).join(" ")).toContain(bossGapText());
  });
});

describe("FAQ pop-up", () => {
  it("renders every question and a search box", () => {
    const html = panelHTML("faq");
    expect(html).toContain('id="faqSearch"');
    for (const sec of FAQ) for (const it of sec.items) expect(html).toContain(it.q);
  });
});

describe("Seymour wants company", () => {
  it("hanging out costs about half in cash", () => {
    S.gens.inf = 20;
    expect(hangOutPrice()).toBeCloseTo(contactPrice("seymour") * 0.55);
    expect(hangOutPrice()).toBeLessThan(contactPrice("seymour"));
  });

  it("spending the afternoon gets the favor and gear, and ties Michael up for a bit", () => {
    S.cash = 1e6; S.gens.inf = 20;
    const price = hangOutPrice();
    buyFavorFrom("seymour", "hangout");
    expect(S.favors).toBe(1);
    expect(S.cash).toBeCloseTo(1e6 - price);
    expect(S.busy?.who).toBe("Seymour");
    expect(S.busy!.left).toBeGreaterThanOrEqual(30);
    expect(S.busy!.left).toBeLessThanOrEqual(45);
    expect(Object.values(S.junk).reduce((a, b) => a + b, 0)).toBe(2);
  });

  it("can't spend two afternoons at once, but cash still works while busy", () => {
    S.cash = 1e6; S.gens.inf = 20;
    buyFavorFrom("seymour", "hangout");
    const favors = S.favors;
    buyFavorFrom("seymour", "hangout");
    expect(S.favors).toBe(favors);
    buyFavorFrom("seymour");
    expect(S.favors).toBe(favors + 1);
  });

  it("Michael is free again when the time is up", () => {
    S.busy = { who: "Seymour", left: 1 };
    tickBusy(0.5);
    expect(S.busy).not.toBeNull();
    tickBusy(1);
    expect(S.busy).toBeNull();
  });

  it("Simon never asks for company", () => {
    S.cash = 1e6; S.gens.inf = 20;
    buyFavorFrom("simon", "hangout"); // the option only exists for Seymour
    expect(S.busy).toBeNull();
  });

  it("the Take a Job button is disabled while he's busy", () => {
    S.busy = { who: "Seymour", left: 20 };
    render();
    const job = document.getElementById("job") as HTMLButtonElement;
    expect(job.disabled).toBe(true);
    expect(job.textContent).toMatch(/With Seymour/);
    S.busy = null;
    render();
    expect(job.disabled).toBe(false);
    expect(job.textContent).toBe("TAKE A JOB");
  });
});

describe("episode missions", () => {
  it("the board only offers seasons you've unlocked", () => {
    S.life = 0; S.board = [];
    for (let i = 0; i < 60; i++) { S.board = []; fillBoard(); for (const m of S.board) expect(seasonOf(m.ep!)).toBe(1); }
    S.life = 1e11;
    const seen = new Set<number>();
    for (let i = 0; i < 400; i++) { S.board = []; fillBoard(); S.board.forEach(m => seen.add(seasonOf(m.ep!))); }
    expect(seen.size).toBe(7);
  });

  it("tops the board back up by itself", () => {
    S.board = [];
    tick(1.1);
    expect(S.board.length).toBe(3);
  });

  it("never puts the same episode on the board twice", () => {
    S.life = 1e11;
    for (let i = 0; i < 100; i++) {
      S.board = []; fillBoard();
      expect(new Set(S.board.map(m => m.ep)).size).toBe(S.board.length);
    }
  });

  it("completing a mission marks the episode as worked", () => {
    S.life = 0; S.board = []; fillBoard();
    const m = S.board[0];
    startMission(m.uid);
    const run = S.active[0];
    expect(run.ep).toBe(m.ep);
    run.chance = 1;
    resolveMission(run);
    expect(S.episodesDone[m.ep!]).toBe(true);
  });

  it("failing a mission doesn't count it", () => {
    S.life = 0; S.board = []; fillBoard();
    const m = S.board[0];
    startMission(m.uid);
    S.active[0].chance = 0;
    resolveMission(S.active[0]);
    expect(S.episodesDone[m.ep!]).toBeUndefined();
  });

  it("opening a new season is announced once", () => {
    S.life = 3e6; S.seasonOpen = 1;
    tick(1.1);
    expect(S.seasonOpen).toBe(3);
    tick(1.1);
    expect(S.seasonOpen).toBe(3);
  });

  it("mission cards name the client and who you're up against", () => {
    S.life = 0;
    S.board = [{ uid: 1, n: "Clear a Caretaker Accused of Theft", dur: 54, succ: .8, heat: 5, rm: 1, fav: 1, ally: "sam", kid: false, send: false, ep: "101", epTitle: "Pilot" }];
    const html = panelHTML("mis");
    expect(html).toContain("Client: Javier");
    expect(html).toContain("Up against: Graham Pyne");
  });

  it("winning narrates the people, tells you the tip, and files it in the notebook", () => {
    S.life = 0; S.board = [{ uid: 1, n: "Clear a Caretaker Accused of Theft", dur: 1, succ: 1, heat: 1, rm: 1, fav: 1, ally: "sam", kid: false, send: false, ep: "101", epTitle: "Pilot" }];
    startMission(1);
    S.active[0].chance = 1;
    resolveMission(S.active[0]);
    const log = [...document.querySelectorAll("#log p")].map(p => p.textContent).join(" | ");
    expect(log).toContain("Spy tip: " + EP_NOTES["101"].tip);
    expect(log).toMatch(/Javier|Graham Pyne/);
    expect(panelHTML("story")).toContain("Spy notebook (1)");
    expect(panelHTML("story")).toContain(EP_NOTES["101"].tip);
  });

  it("losing narrates the villain getting away and gives no tip", () => {
    S.life = 0; S.board = [{ uid: 1, n: "Clear a Caretaker Accused of Theft", dur: 1, succ: 0, heat: 1, rm: 1, fav: 1, ally: "sam", kid: false, send: false, ep: "101", epTitle: "Pilot" }];
    startMission(1);
    S.active[0].chance = 0;
    resolveMission(S.active[0]);
    const log = [...document.querySelectorAll("#log p")].map(p => p.textContent).join(" | ");
    expect(log).toContain("Graham Pyne");
    expect(log).not.toContain("Spy tip");
    expect(panelHTML("story")).not.toContain("Spy notebook");
  });

  it("the Missions card shows the episode and your progress", () => {
    S.life = 0; S.board = []; fillBoard();
    const html = panelHTML("mis");
    expect(html).toMatch(/Season 1, Episode \d+/);
    expect(html).toContain("of 111");
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
