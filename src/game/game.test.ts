// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { S, fresh, setState } from "../state";
import { milestones, tick, tickNate } from "./tick";
import { AWAY_CAP, catchUp, returnFromAway } from "./offline";
import { fmt, setScientific } from "../util";
import { CONTACTS, contactFace, contactFor } from "../data/contacts";
import { tabTitle } from "../ui/render";
import { buyFavorFrom, buyReferral, buyUpg, hireAlly, prestige, useAbility } from "./actions";
import { arcAvailable, startArc } from "./arcs";
import { ARCS } from "../data/arcs";
import { STORY } from "../data/story";
import { attTier, choiceMult, choiceSucc, gripFixer, heatMult, incomeMult, missionReward } from "../calc";
import { allBeaten, checkEnding, newFixer, reduceGrip, simonTip, spawnErrand, tickOrg } from "./org";
import { FIXER_MAX_MULT, FIXER_MIN_MULT, rollFixer } from "../data/org";
import { bribeCost, bribeDrop } from "../calc";
import { payOffFixer } from "./actions";
import { GRIP_PERKS, TIERS } from "../data/org";
import { UPGS } from "../data/upgrades";
import { FAQ } from "../data/faq";
import { BOSS_FIRST, BOSS_GAP_MIN, BOSS_GAP_SPREAD, bossGapText, nextBossGap } from "../data/pacing";
import { loftBadges } from "../ui/badges";
import { say, toast } from "../ui/fx";
import { dismissAllNotices, dismissNotice, initNotices, noticeCount, noticeOpen } from "../ui/notice";
import { showChoice, choiceBusy } from "../ui/choice";
import { CONTACT_CAP, allyFree, allyHere, contactPrice, favorsLeft, hangOutPrice, nextFavorIn, succChance } from "../calc";
import { DAY_MS, FAVORS_PER_DAY } from "../data/pacing";
import { FEE_CAP } from "../state";
import { formatWait } from "../util";
import { tickBusy } from "./tick";
import { fillBoard, resolveMission, startMission } from "./missions";
import { actionBlock, bossAction, spawnBoss, tickBoss } from "./bosses";
import { awayWhy, clickVal } from "../calc";
import { spawnClient } from "./events";
import { seasonOf } from "../data/missions";
import { EP_NOTES } from "../data/episodeNotes";
import { actionDmg, conChance, cps, genMult, referralCost, referralMult, upgradeUnlocked } from "../calc";
import { checkBurn } from "./heat";
import { BOSSES } from "../data/bosses";
import { EVENTS } from "../data/events";
import { MISSIONS } from "../data/missions";
import { earn, merge } from "../state";
import type { GameState } from "../types";
import { render } from "../ui/render";
import { MODALS, SECTIONS, buildLayout, panelHTML } from "../ui/panels";

beforeAll(() => {
  const html = readFileSync(resolve(__dirname, "../../index.html"), "utf8");
  document.body.innerHTML = html.split("<body>")[1].split("<script")[0];
  buildLayout(document.getElementById("sections")!, document.getElementById("toolbar")!);
  initNotices();
});

beforeEach(() => {
  setState(fresh()); fillBoard();
  document.getElementById("log")!.innerHTML = ""; // narration from one test shouldn't leak into the next
  dismissAllNotices(); // nor should a notification left on screen
  document.getElementById("toasts")!.innerHTML = "";
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
      expect(text, ally).toContain(`to ask ${word} for help (+25%)`);
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

describe("allies on kid missions", () => {
  const kidMission = { uid: 1, n: "t", dur: 1, succ: 1, heat: 1, rm: 1, fav: 1, ally: "madeline", kid: true, send: true };

  it("asking an ally for help earns a favor, since better odds would do nothing", () => {
    S.allies.madeline = true; S.life = 1e6; S.board = [{ ...kidMission }];
    startMission(1);
    expect(S.active[0].sent).toBe("madeline");
    resolveMission(S.active[0]);
    expect(S.favors).toBe(2); // 1 from the mission, 1 for asking her
  });

  it("without an ally there's no bonus favor", () => {
    S.allies.madeline = true; S.life = 1e6; S.board = [{ ...kidMission, send: false }];
    startMission(1);
    resolveMission(S.active[0]);
    expect(S.favors).toBe(1);
  });

  it("the card says +1 favor instead of +25% on a case that can't fail", () => {
    S.allies.madeline = true; S.life = 1e6; S.board = [{ ...kidMission }];
    expect(panelHTML("mis")).toContain("Ask Madeline for help (+1 favor)");
    S.board = [{ ...kidMission, kid: false, succ: .7 }];
    expect(panelHTML("mis")).toContain("Ask Madeline for help (+25%)");
  });

  it("older-folk missions carry through to the board", () => {
    S.life = 1e12; let sawElder = false;
    for (let i = 0; i < 400 && !sawElder; i++) { S.board = []; fillBoard(); sawElder = S.board.some(m => m.elder); }
    expect(sawElder).toBe(true);
  });
});

describe("Jesse joins in Season 4", () => {
  it("can't be hired before his season opens, however rich you are", () => {
    S.cash = 1e12; S.life = 1e6; // only seasons 1 and 2 are open
    hireAlly("jesse");
    expect(S.allies.jesse).toBeUndefined();
    expect(S.cash).toBe(1e12);
  });

  it("can be hired once Season 4 opens", () => {
    S.cash = 1e12; S.life = 3e7; // Season 4's threshold
    hireAlly("jesse");
    expect(S.allies.jesse).toBe(true);
  });

  it("the crew list says when he joins, and doesn't offer to hire him early", () => {
    S.cash = 1e12; S.life = 1e6;
    const html = panelHTML("crew");
    expect(html).toContain("until Season 4");
    expect(html).not.toContain("Hire Jesse Porter");
    S.life = 3e7;
    expect(panelHTML("crew")).toContain("Hire Jesse Porter");
  });

  it("the board never offers Jesse before his first episode", () => {
    S.life = 1e12;
    for (let i = 0; i < 300; i++) {
      S.board = []; fillBoard();
      for (const m of S.board) if (m.ally === "jesse") expect(+m.ep!).toBeGreaterThanOrEqual(402);
    }
  });
});

describe("notifications", () => {
  const shown = () => document.getElementById("notice")!.style.display === "flex";
  const title = () => document.getElementById("nT")!.textContent;

  it("pop up in the middle of the screen and stay until accepted", () => {
    toast("Medal: Hustler", "100 jobs");
    expect(shown()).toBe(true);
    expect(title()).toBe("Medal: Hustler");
    expect(document.getElementById("nM")!.textContent).toBe("100 jobs");
    expect(noticeOpen()).toBe(true);
    // nothing times it out
    tick(1);
    expect(shown()).toBe(true);
    document.getElementById("nOk")!.click();
    expect(shown()).toBe(false);
    expect(noticeOpen()).toBe(false);
  });

  it("queue up one at a time, in order", () => {
    toast("First", "a"); toast("Second", "b"); toast("Third", "c");
    expect(title()).toBe("First");
    expect(noticeCount()).toBe(3);
    expect(document.getElementById("nCount")!.textContent).toBe("2 more waiting");
    dismissNotice();
    expect(title()).toBe("Second");
    dismissNotice();
    expect(title()).toBe("Third");
    expect(document.getElementById("nCount")!.textContent).toBe("");
    dismissNotice();
    expect(shown()).toBe(false);
  });

  it("can all be dismissed at once", () => {
    toast("One", ""); toast("Two", ""); toast("Three", "");
    document.getElementById("nAll")!.click();
    expect(shown()).toBe(false);
    expect(noticeCount()).toBe(0);
  });

  it("are colored by what kind of news they are", () => {
    toast("Good", "", "good");
    expect(document.getElementById("ndlg")!.className).toContain("good");
    dismissNotice();
    toast("Bad", "", "bad");
    expect(document.getElementById("ndlg")!.className).toContain("bad");
    dismissNotice();
    toast("Plain", "");
    expect(document.getElementById("ndlg")!.className).toBe("ndlg gold");
  });

  it("everything pops up in the middle, including small news like Nate coming back", () => {
    toast("Nate's back", "He's around again.");
    expect(shown()).toBe(true);
    expect(title()).toBe("Nate's back");
    expect(document.querySelectorAll("#toasts .toast").length).toBe(0); // nothing is tucked away in the corner
  });

  it("Nate wandering off and coming back both pop up", () => {
    S.allies.nate = true; S.nateAway = false; S.nateTimer = 0; S.nateStage = 3;
    tickNate(0.1);
    expect(shown()).toBe(true);
    expect(title()).toBe("Nate wandered off");
    dismissNotice();
    S.nateTimer = 0;
    tickNate(0.1);
    expect(title()).toBe("Nate's back");
  });

  it("Nate's first returns follow the show: a bride, a baby, then a hard season, once each", () => {
    S.allies.nate = true; S.nateAway = true; S.nateStage = 0;
    const titles: string[] = [];
    for (let i = 0; i < 3; i++) {
      S.nateAway = true; S.nateTimer = 0;
      tickNate(0.1);
      titles.push(title());
      dismissNotice();
    }
    expect(titles).toEqual(["Nate got married", "Nate has news", "Nate needs a minute"]);
    expect(S.nateStage).toBe(3);
    S.nateAway = true; S.nateTimer = 0;
    tickNate(0.1);
    expect(title()).toBe("Nate's back");
  });

  it("go back to corner toasts if you turn pop-ups off", () => {
    S.popups = false;
    toast("Medal: Hustler", "100 jobs");
    expect(shown()).toBe(false);
    expect(document.querySelectorAll("#toasts .toast").length).toBe(1);
    S.popups = true;
  });

  it("Enter, Space and Escape all accept it, and Escape doesn't close anything behind it", () => {
    for (const key of ["Enter", " ", "Escape"]) {
      toast("Hey", "");
      document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
      expect(shown(), key).toBe(false);
    }
  });

  it("ignore keys when nothing is showing", () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(shown()).toBe(false);
  });

  it("wait while you're making a decision, then show", () => {
    showChoice("A decision", "What do you do?", [["Do it", () => "Done."]]);
    toast("Mission complete", "Nice.");
    expect(shown()).toBe(false); // would have covered the decision
    expect(noticeCount()).toBe(1);
    (document.querySelector("#evtO button") as HTMLButtonElement).click();
    expect(shown()).toBe(true);
    expect(title()).toBe("Mission complete");
  });

  it("hold back new decisions while one is showing", () => {
    toast("Heads up", "");
    expect(choiceBusy()).toBe(true);
    dismissNotice();
    expect(choiceBusy()).toBe(false);
  });

  it("a decision's result pops up after you choose, so you see what happened", () => {
    showChoice("Pulled Over", "A cop taps your window.", [["Bluff", () => "He buys it."]]);
    (document.querySelector("#evtO button") as HTMLButtonElement).click();
    expect(shown()).toBe(true);
    expect(title()).toBe("Pulled Over");
    expect(document.getElementById("nM")!.textContent).toBe("He buys it.");
    expect(document.querySelectorAll("#toasts .toast").length).toBe(0);
  });

  it("the pop-ups setting survives Reinstate", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    S.popups = false; S.run = 2e8;
    prestige();
    expect(S.stats.reinstated).toBe(1);
    expect(S.popups).toBe(false);
    vi.restoreAllMocks();
  });
});

describe("sketches around the game", () => {
  it("the Crew pop-up shows a portrait for every contact and ally", () => {
    S.life = 1e12; S.allies.sam = true;
    const html = panelHTML("crew");
    for (const id of ["seymour", "victor", "sam", "fiona", "barry", "madeline", "nate", "jesse"]) {
      expect(html, id).toContain(`Sketch of ${id}`);
    }
  });

  it("an ally who hasn't joined the story yet is a silhouette", () => {
    S.life = 1e6; // before Season 4
    const html = panelHTML("crew");
    expect(html).not.toContain("Sketch of jesse");
    expect(html).toContain("Someone you haven't met");
  });

  it("Rogues shows faces for the people you've met and silhouettes for the rest", () => {
    S.life = 1e6; // only the early bosses are open
    const html = panelHTML("rogue");
    expect(html).toContain("Sketch of paxson");
    expect(html).not.toContain("Sketch of riley");
  });

  it("The List only reveals the faces of names you know", () => {
    S.life = 1e12;
    let html = panelHTML("list");
    expect(html).not.toContain("Sketch of paxson");
    S.listKnown.paxson = true; S.bossKills.carla = 1;
    html = panelHTML("list");
    expect(html).toContain("Sketch of paxson");
    expect(html).toContain("Sketch of carla");
    expect(html).not.toContain("Sketch of riley");
  });

  it("Michael is in The Loft, and the boss gets a face while you work the case", () => {
    expect(document.getElementById("loftface")).not.toBeNull();
    S.life = 1e13; S.gens.inf = 5;
    spawnBoss();
    render();
    expect(document.getElementById("bossface")!.innerHTML).toContain(`Sketch of ${S.boss!.id}`);
  });
});

describe("narration strip", () => {
  it("sits right under the toolbar, above the game, where it can't be scrolled past", () => {
    const toolbar = document.getElementById("toolbar")!, strip = document.getElementById("voiceover")!, main = document.querySelector("main")!;
    const follows = (a: Node, b: Node) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(toolbar, strip)).toBe(true);
    expect(follows(strip, main)).toBe(true);
    expect([...document.querySelectorAll(".card h2")].map(h => h.textContent)).not.toContain("Narration");
  });

  it("always shows the latest line, and keeps the history newest first", () => {
    say("First thing happened.");
    say("Second thing happened.");
    expect(document.getElementById("vo-latest")!.textContent).toBe("Second thing happened.");
    const lines = [...document.querySelectorAll("#log p")].map(p => p.textContent);
    expect(lines.slice(0, 2)).toEqual(["Second thing happened.", "First thing happened."]);
  });

  it("flashes when something new is said, so you notice", () => {
    say("Something new.");
    expect(document.querySelector("#voiceover summary")!.classList.contains("fresh")).toBe(true);
  });

  it("keeps only the last 40 lines of history", () => {
    for (let i = 0; i < 60; i++) say("line " + i);
    expect(document.querySelectorAll("#log p").length).toBe(40);
    expect(document.getElementById("vo-latest")!.textContent).toBe("line 59");
  });
});

describe("upgrades never run out", () => {
  it("an operation tier only appears once you own enough of it", () => {
    const tier = UPGS.find(u => u.id === "t-inf-0")!; // needs 10 Street Informants
    S.gens.inf = 9;
    expect(upgradeUnlocked(tier)).toBe(false);
    S.gens.inf = 10;
    expect(upgradeUnlocked(tier)).toBe(true);
  });

  it("buying a tier multiplies that operation's income", () => {
    S.gens.inf = 10; S.cash = 1e12; S.life = 1e12;
    const before = cps();
    buyUpg("t-inf-0");
    expect(S.upgs["t-inf-0"]).toBe(true);
    expect(genMult("inf")).toBe(2);
    expect(cps()).toBeGreaterThan(before * 1.5);
  });

  it("the card offers tiers as you grow, and they don't show before you qualify", () => {
    S.life = 1e12; S.gens.inf = 5;
    expect(panelHTML("upg")).not.toContain("Trained Informants");
    S.gens.inf = 12;
    expect(panelHTML("upg")).toContain("Trained Informants");
  });

  it("the endless upgrade can be bought again and again, each time dearer and stronger", () => {
    S.cash = 1e18; S.life = 1e12; S.gens.inf = 50;
    const costs: number[] = [], incomes: number[] = [];
    for (let i = 0; i < 6; i++) { costs.push(referralCost()); incomes.push(cps()); buyReferral(); }
    expect(S.referrals).toBe(6);
    for (let i = 1; i < costs.length; i++) { expect(costs[i]).toBeGreaterThan(costs[i - 1]); expect(incomes[i]).toBeGreaterThan(incomes[i - 1]); }
    expect(referralMult()).toBeCloseTo(Math.pow(1.1, 6));
  });

  it("can't be bought without the cash", () => {
    S.cash = 10;
    buyReferral();
    expect(S.referrals).toBe(0);
    expect(S.cash).toBe(10);
  });

  it("even after you've bought every other upgrade, the card still has something to spend on", () => {
    S.life = 1e15; S.cash = 1e15;
    for (const u of UPGS) S.upgs[u.id] = true;
    const html = panelHTML("upg");
    expect(html).toContain("Satisfied Clients Refer Friends");
    expect(html).not.toContain("Nothing new right now");
  });

  it("when nothing is available yet, it says what's coming instead of leaving a dead end", () => {
    S.life = 0;
    const html = panelHTML("upg");
    expect(html).toContain("Nothing new right now. Next up:");
    expect(html).toContain("Better Cover Story");
    expect(html).toMatch(/lifetime earnings/);
    S.life = 1e12; S.gens.inf = 0; for (const u of UPGS) if (!u.needs) S.upgs[u.id] = true;
    S.referrals = 0; S.life = 1; // nothing visible: the hint should name a tier and what it needs
    expect(panelHTML("upg")).toMatch(/Next up: <b[^>]*>[^<]+<\/b> (once you own|at )/);
  });

  it("Reinstating drops Jesse (he debuts in Season 4) but keeps the early crew", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    S.run = 2e8; S.life = 2e8; S.allies.sam = true; S.allies.jesse = true;
    prestige();
    expect(S.allies.sam).toBe(true);
    expect(S.allies.jesse).toBeFalsy();
    vi.restoreAllMocks();
  });

  it("the endless upgrade resets with the rest when you Reinstate", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    S.run = 2e8; S.referrals = 5;
    prestige();
    expect(S.referrals).toBe(0);
    vi.restoreAllMocks();
  });
});

describe("Barry sells favors", () => {
  it("from the very start, hired or not, at his own price, with a daily limit and no self-discount", () => {
    S.cash = 1e9; S.favors = 0; S.heat = 50;
    expect(S.allies.barry).toBeFalsy();
    const price = contactPrice("barry");
    buyFavorFrom("barry");
    expect(S.favors).toBe(1);
    expect(S.heat).toBe(42);
    expect(S.cash).toBeCloseTo(1e9 - price, 3);
    expect(S.stats.barryFavors).toBe(1);
    S.allies.barry = true;
    expect(contactPrice("barry")).toBeGreaterThan(0);
    for (let i = 0; i < 6; i++) buyFavorFrom("barry");
    expect(S.favors).toBe(4); // four a day, hired or not
    expect(favorsLeft("barry")).toBe(0);
  });

  it("is listed in Favors and Crew whether or not he's hired, and can still be hired", () => {
    S.life = 1e12;
    expect(panelHTML("fav")).toContain("Money favors");
    expect(panelHTML("crew")).toMatch(/data-act="contact" data-arg="barry"/);
    expect(panelHTML("crew")).toContain("Hire Barry Burkowski");
    S.allies.barry = true;
    expect(panelHTML("fav")).toContain("Money favors");
    expect(panelHTML("crew")).not.toContain("Hire Barry Burkowski");
  });

  it("an old save without Barry's favor log still loads", () => {
    const m = merge({ favorLog: { seymour: [1], simon: [] } as unknown as GameState["favorLog"] });
    expect(m.favorLog.barry).toEqual([]);
    expect(m.favorLog.seymour).toEqual([1]);
  });
});

describe("Idle while away", () => {
  it("earns at the full rate while you're gone, capped at a day", () => {
    S.gens.inf = 5;
    const base = cps(), before = S.cash;
    const e = catchUp(3600);
    expect(e).toBeCloseTo(base * 3600, 5);
    expect(S.cash - before).toBeCloseTo(base * 3600, 5);
    const c = cps(), b2 = S.cash;
    catchUp(AWAY_CAP * 10);
    expect(S.cash - b2).toBeCloseTo(c * AWAY_CAP, 3);
  });

  it("finishes missions that would have ended, cools cooldowns, and never starts a boss", () => {
    S.allyCd.sam = 500; S.layCd = 90; S.bossCd = 100; S.boss = null;
    S.board = []; fillBoard();
    startMission(S.board[0].uid);
    expect(S.active.length).toBe(1);
    catchUp(7200);
    expect(S.active.length).toBe(0);
    expect(S.allyCd.sam).toBe(0);
    expect(S.layCd).toBe(0);
    expect(S.boss).toBeNull();
    expect(S.bossCd).toBeGreaterThanOrEqual(30);
  });
});

describe("Away card, tab title and number safety", () => {
  it("a long absence is summed up in one card, not a pile of pop-ups", () => {
    S.gens.inf = 5; S.board = []; fillBoard(); startMission(S.board[0].uid);
    returnFromAway(7200);
    expect(noticeCount()).toBe(1);
    expect(document.getElementById("nT")!.textContent).toMatch(/Welcome back/);
    expect(document.getElementById("nM")!.textContent).toMatch(/earned \$/);
    expect(document.getElementById("nM")!.textContent).toMatch(/mission/);
  });

  it("a short gap catches up quietly", () => {
    returnFromAway(10);
    expect(noticeCount()).toBe(0);
  });

  it("the tab title shows cash, and flags a case or waiting news", () => {
    S.cash = 1500; S.boss = null; dismissAllNotices();
    expect(tabTitle()).toMatch(/^\$1\.50K · Burned/);
    S.boss = { id: "paxson", hp: 1, max: 1, left: 42 };
    expect(tabTitle()).toMatch(/^\(!\) Case: Detective Paxson · 42s/);
    S.boss = null;
    toast("Hello", "there");
    expect(tabTitle()).toMatch(/^\(!\) News waiting/);
  });

  it("numbers stay finite and readable at any size", () => {
    expect(fmt(NaN)).toBe("0");
    expect(fmt(1e30)).toBe("1.00No");
    expect(fmt(1e30)).toMatch(/^\d/);
    expect(fmt(1e40)).toBe("1.00e40");
    setScientific(true);
    expect(fmt(2.5e9)).toBe("2.50e9");
    setScientific(false);
    expect(fmt(2.5e9)).toBe("2.50B");
    earn(NaN); earn(Infinity); earn(-5);
    expect(Number.isFinite(S.cash)).toBe(true);
    S.cash = 1e299; earn(1e299); earn(1e299);
    expect(S.cash).toBeLessThanOrEqual(1e300);
  });

  it("a damaged save can't put NaN into the game", () => {
    const m = merge({ cash: NaN, life: Infinity, heat: "oops" as unknown as number });
    expect(m.cash).toBe(0);
    expect(m.life).toBeLessThanOrEqual(1e300);
    expect(m.heat).toBe(0);
  });
});

describe("The intel contact: Victor, then Simon, then Pearce", () => {
  const simon = () => CONTACTS.find(c => c.id === "simon")!;

  it("shows the right person for each stage", () => {
    expect(contactFor(simon(), 0).name).toBe("Victor Stecker-Epps");
    expect(contactFor(simon(), 1).name).toBe("Simon Escher");
    expect(contactFor(simon(), 2).name).toBe("Dani Pearce");
    expect(contactFace("simon", 0)).toBe("victor");
    expect(contactFace("simon", 1)).toBe("simon");
    expect(contactFace("simon", 2)).toBe("pearce");
    expect(contactFace("seymour", 2)).toBe("seymour");
  });

  it("starts with Victor, hands over to Simon in Season 3, and to Pearce after Tipping Point", () => {
    milestones();
    expect(S.intel).toBe(0);
    expect(panelHTML("fav")).toContain("Victor Stecker-Epps");
    S.seasonOpen = 3;
    milestones();
    expect(S.intel).toBe(1);
    expect(panelHTML("fav")).toContain("Simon Escher");
    S.episodesDone["711"] = true;
    milestones();
    expect(S.intel).toBe(2);
    expect(panelHTML("fav")).toContain("Dani Pearce");
    expect(panelHTML("fav")).not.toContain("Simon Escher");
    S.cash = 1e9; S.favors = 0;
    buyFavorFrom("simon");
    expect(S.favors).toBe(1);
  });

  it("Reinstating keeps the story: Simon doesn't come back after he's gone", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    S.intel = 2; S.run = 2e8;
    prestige();
    expect(S.intel).toBe(2);
    vi.restoreAllMocks();
  });
});

describe("Backup nudge", () => {
  it("reminds you once after a couple of hours, and not again after Reinstating", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    S.stats.time = 7300; milestones();
    expect(S.backupNudged).toBe(true);
    dismissAllNotices();
    S.run = 2e8; prestige();
    expect(S.backupNudged).toBe(true);
    vi.restoreAllMocks();
  });
});

describe("Upgrades card order", () => {
  it("shows the cheapest available upgrades first", () => {
    S.life = 1e9;
    const html = panelHTML("upg");
    const costs = [...html.matchAll(/class="cost">\$([\d.]+)([KMB]?)</g)].map(m => +m[1] * ({ "": 1, K: 1e3, M: 1e6, B: 1e9 } as Record<string, number>)[m[2]]);
    expect(costs.length).toBeGreaterThan(3);
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
  });
});

describe("asking allies for help, not sending them", () => {
  const card = { uid: 1, n: "t", dur: 10, succ: .7, heat: 1, rm: 1, fav: 1, ally: "sam", kid: false, send: false };

  it("the button asks for help", () => {
    S.allies.sam = true; S.life = 1e6; S.board = [{ ...card }];
    const html = panelHTML("mis");
    expect(html).toContain("Ask Sam for help (+25%)");
    expect(html).not.toMatch(/>[^<]*Send Sam/);
  });

  it("a busy ally is described as helping, not as being out", () => {
    S.allies.sam = true; S.life = 1e6;
    S.board = [{ ...card, uid: 1, send: true }, { ...card, uid: 2, n: "other" }];
    startMission(1);
    const html = panelHTML("mis");
    expect(html).toContain("Sam Axe is helping");
    expect(html).toMatch(/Sam is helping with ".*", free in/);
    expect(html).not.toContain("is out");
  });

  it("an ally who isn't hired yet is something you can recruit", () => {
    S.allies = {}; S.life = 1e6; S.board = [{ ...card }];
    expect(panelHTML("mis")).toContain("Hire Sam in Crew to ask him for help (+25%)");
  });
});

describe("Crew pop-up order", () => {
  it("lists allies cheapest first, after the frienemies", () => {
    S.life = 1e12;
    const html = panelHTML("crew");
    const at = (name: string) => html.indexOf(name);
    const order = ["Seymour Talbot", "Victor Stecker-Epps", "Barry Burkowski</b>", "Hire Sam Axe", "Hire Fiona Glenanne", "Hire Barry Burkowski", "Hire Madeline Westen", "Hire Nate Westen", "Hire Jesse Porter"].map(at);
    expect(order.every(i => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

describe("FAQ pop-up", () => {
  it("renders every question and a search box", () => {
    const html = panelHTML("faq");
    expect(html).toContain('id="faqSearch"');
    for (const sec of FAQ) for (const it of sec.items) expect(html).toContain(it.q);
  });
});

describe("fees stay believable late in the game", () => {
  it("the client at the door never asks for millions", () => {
    S.gens.inf = 1e9;
    spawnClient();
    const text = document.getElementById("evtBig")!.textContent!;
    expect(text).toMatch(/^\$\d+(\.\d+)?K$/);
    (document.querySelectorAll<HTMLButtonElement>("#evtO button")[1]).click();
  });

  it("neither do the episode-style cases or handler errands", () => {
    S.gens.inf = 1e9; S.att = 30;
    spawnErrand();
    expect(document.getElementById("evtD")!.textContent).toMatch(/It pays \$\d+(\.\d+)?K\./);
    (document.querySelectorAll<HTMLButtonElement>("#evtO button")[2]).click();
    const help = EVENTS.find(e => e.t === "A Mother's Plea")!;
    const before = S.stats.returned;
    help.o[0][1]();
    expect(S.stats.returned - before).toBeLessThan(FEE_CAP);
  });

  it("mission cards show thousands, not billions, with a huge network", () => {
    S.gens.inf = 1e9; S.life = 1e12;
    const html = panelHTML("mis");
    for (const m of html.matchAll(/pays \$([\d.]+)([KMB])/g)) expect(m[2], m[0]).toBe("K");
  });
});

describe("the daily limit on frienemy favors", () => {
  const rich = () => { S.cash = 1e12; S.gens.inf = 20; };

  it("each frienemy sells four favors a day, then they're tapped out", () => {
    rich();
    expect(FAVORS_PER_DAY).toBe(4);
    for (let i = 0; i < 4; i++) buyFavorFrom("seymour");
    expect(S.favors).toBe(4);
    expect(favorsLeft("seymour")).toBe(0);
    buyFavorFrom("seymour"); // a fifth, refused
    expect(S.favors).toBe(4);
  });

  it("counts down as you buy", () => {
    rich();
    expect(favorsLeft("simon")).toBe(4);
    buyFavorFrom("simon");
    expect(favorsLeft("simon")).toBe(3);
    buyFavorFrom("simon");
    expect(favorsLeft("simon")).toBe(2);
  });

  it("Seymour and Simon keep separate limits", () => {
    rich();
    for (let i = 0; i < 4; i++) buyFavorFrom("seymour");
    expect(favorsLeft("simon")).toBe(4);
    buyFavorFrom("simon");
    expect(S.favors).toBe(5);
  });

  it("spending the afternoon with Seymour counts toward his limit", () => {
    rich();
    for (let i = 0; i < 4; i++) { S.busy = null; buyFavorFrom("seymour", "hangout"); }
    expect(favorsLeft("seymour")).toBe(0);
    S.busy = null;
    buyFavorFrom("seymour", "hangout");
    expect(S.favors).toBe(4);
  });

  it("a favor comes back after 24 hours, and not before", () => {
    const now = Date.now();
    S.favorLog.seymour = [now - 23 * 3600e3, now - 10 * 3600e3, now - 5 * 3600e3, now - 1 * 3600e3];
    expect(favorsLeft("seymour", now)).toBe(0);
    // the oldest was 23 hours ago, so it frees up in an hour
    expect(nextFavorIn("seymour", now)).toBeCloseTo(3600e3, -3);
    expect(favorsLeft("seymour", now + 3601e3)).toBe(1);
    expect(nextFavorIn("seymour", now + 3601e3)).toBe(0);
    // the second-oldest (10 hours ago) frees up 14 hours from now, so two are back by then
    expect(favorsLeft("seymour", now + 14.1 * 3600e3)).toBe(2);
    // and a full day on, all of them are
    expect(favorsLeft("seymour", now + DAY_MS + 3600e3)).toBe(4);
  });

  it("old purchases don't pile up in your save", () => {
    rich();
    S.favorLog.seymour = [Date.now() - 3 * DAY_MS, Date.now() - 2 * DAY_MS];
    buyFavorFrom("seymour");
    expect(S.favorLog.seymour.length).toBe(1);
  });

  it("the limit survives Reinstate, so it can't be dodged", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    rich(); S.run = 2e8;
    for (let i = 0; i < 4; i++) buyFavorFrom("seymour");
    prestige();
    expect(S.stats.reinstated).toBe(1);
    expect(favorsLeft("seymour")).toBe(0);
    vi.restoreAllMocks();
  });

  it("the Favors pop-up and Crew card say how many are left, and disable buying when none are", () => {
    rich(); S.life = 1e12;
    expect(panelHTML("fav")).toContain("4 of 4 left today");
    buyFavorFrom("simon");
    expect(panelHTML("fav")).toContain("3 of 4 left today");
    for (let i = 0; i < 3; i++) buyFavorFrom("simon");
    const fav = panelHTML("fav"), crew = panelHTML("crew");
    expect(fav).toContain("Tapped out for today. Back in");
    expect(crew).toContain("Tapped out for today. Back in");
    expect(crew).toMatch(/data-act="contact" data-arg="simon" disabled/);
    expect(crew).not.toMatch(/data-act="contact" data-arg="seymour" disabled/);
  });

  it("waiting times read naturally", () => {
    expect(formatWait(30_000)).toBe("30s");
    expect(formatWait(42 * 60_000)).toBe("42m");
    expect(formatWait(5 * 3600_000 + 12 * 60_000)).toBe("5h 12m");
    expect(formatWait(3 * 3600_000)).toBe("3h");
    expect(formatWait(0)).toBe("1s");
  });
});

describe("what Michael can afford to pay frienemies", () => {
  it("favors never cost more than $100K, however rich you get", () => {
    S.gens.inf = 1e9; // an absurd income
    expect(contactPrice("seymour")).toBe(CONTACT_CAP);
    expect(contactPrice("simon")).toBe(CONTACT_CAP);
    S.seymourBought = 40; S.simonBought = 40;
    expect(contactPrice("seymour")).toBe(CONTACT_CAP);
    expect(contactPrice("simon")).toBe(CONTACT_CAP);
  });

  it("Barry still gets his discount off the capped price", () => {
    S.gens.inf = 1e9; S.allies.barry = true;
    expect(contactPrice("seymour")).toBe(CONTACT_CAP * 0.75);
  });

  it("spending the afternoon with Seymour is never more than about half that", () => {
    S.gens.inf = 1e9;
    expect(hangOutPrice()).toBeCloseTo(CONTACT_CAP * 0.55);
    expect(hangOutPrice()).toBeLessThan(CONTACT_CAP);
  });

  it("early on, prices are unchanged and still climb with each favor", () => {
    S.gens.inf = 20; S.cash = 1e6;
    const before = contactPrice("seymour");
    expect(before).toBeLessThan(CONTACT_CAP);
    buyFavorFrom("seymour");
    expect(contactPrice("seymour")).toBeGreaterThan(before);
  });

  it("the Favors pop-up never shows a price over $100K", () => {
    S.gens.inf = 1e9; S.life = 1e12;
    const html = panelHTML("fav");
    expect(html).not.toMatch(/\$\d+(\.\d+)?M/); // no millions in the frienemy rows
    expect(html).toContain("$100K");
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

  it("cards for other episodes name their helpers too", () => {
    S.life = 1e12;
    const card = (ep: string, epTitle: string) => ({ uid: 1, n: "t", dur: 10, succ: .5, heat: 1, rm: 1, fav: 1, ally: "sam", kid: false, send: false, ep, epTitle });
    S.board = [card("207", "Rough Seas")];
    expect(panelHTML("mis")).toContain("Arms dealer who helped trace the rifle: Seymour");
    S.board = [card("501", "Company Man")];
    expect(panelHTML("mis")).toContain("Your new CIA handler: Max");
    S.board = [card("202", "Turn and Burn")];
    expect(panelHTML("mis")).toContain("Your money launderer: Barry");
  });

  it("the card for Friends and Family names the friend who bailed you out", () => {
    S.life = 5e6;
    S.board = [{ uid: 1, n: "Pay Back an Old Friend's Favor Without Getting Hurt", dur: 54, succ: .8, heat: 5, rm: 1, fav: 1, ally: "sam", kid: false, send: false, ep: "301", epTitle: "Friends and Family" }];
    const html = panelHTML("mis");
    expect(html).toContain("Client: Marta");
    expect(html).toContain("Up against: Rufino Cortez");
    expect(html).toContain("Bailed you out of jail: Harlan");
  });

  it("winning narrates the people, tells you the tip, and files it in the notebook", () => {
    S.life = 0; S.board = [{ uid: 1, n: "Clear a Caretaker Accused of Theft", dur: 1, succ: 1, heat: 1, rm: 1, fav: 1, ally: "sam", kid: false, send: false, ep: "101", epTitle: "Pilot" }];
    startMission(1);
    S.active[0].chance = 1;
    resolveMission(S.active[0]);
    const log = [...document.querySelectorAll("#log p")].map(p => p.textContent).join(" | ");
    expect(log).toContain("Spy tip: " + EP_NOTES["101"].tip);
    expect(log).toMatch(/Javier|Graham Pyne|Barry/); // the client, the villain, or (now and then) the friend who helped
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

  describe("Thomas O'Neill takes Fiona", () => {
    it("only shows up if Fiona is on the crew", () => {
      S.life = 1e13;
      const only = BOSSES.filter(b => b.needs);
      expect(only.map(b => b.id)).toEqual(["oneill"]);
      S.allies = {};
      for (let i = 0; i < 200; i++) { S.boss = null; spawnBoss(); expect(S.boss!.id).not.toBe("oneill"); }
    });

    it("while he has her, her perks and abilities are gone; losing keeps her away a while", () => {
      S.life = 1e13; S.allies.fiona = true;
      const withFiona = clickVal();
      expect(allyHere("fiona")).toBe(true);
      S.boss = { id: "oneill", hp: 1e6, max: 1e6, left: 75 };
      expect(allyHere("fiona")).toBe(false);
      expect(clickVal()).toBeLessThan(withFiona);
      expect(awayWhy("fiona")!.short).toMatch(/taken/);
      S.boss.left = 0; S.heat = 0;
      tickBoss(0.1);
      expect(S.boss).toBeNull();
      expect(S.fionaAway).toBeGreaterThan(500);
      expect(allyHere("fiona")).toBe(false);
      S.bossCd = 1e9; // no new boss while we wait
      tickBoss(700);
      expect(allyHere("fiona")).toBe(true);
    });

    it("beating him frees her right away and pays two bonus favors", () => {
      S.life = 1e13; S.allies.fiona = true; S.favors = 0;
      S.boss = { id: "oneill", hp: 0, max: 1e6, left: 75 };
      tickBoss(1);
      expect(S.boss).toBeNull();
      expect(S.fionaAway).toBe(0);
      expect(allyHere("fiona")).toBe(true);
      expect(S.favors).toBeGreaterThanOrEqual(2);
    });
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

    it("stake out builds two leads, going undercover cools heat, and the crew needs someone around", () => {
      setup();
      bossAction("stakeout");
      expect(S.boss!.leads).toBe(2);
      S.heat = 30; bossAction("cover");
      expect(S.heat).toBeLessThan(30);
      expect(actionBlock("crew")).toMatch(/crew/i);
      S.allies.sam = true;
      expect(actionBlock("crew")).toBeNull();
      const hp = S.boss!.hp;
      bossAction("crew");
      expect(S.boss!.hp).toBeLessThan(hp);
      expect(actionBlock("crew")).toMatch(/Ready in/);
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
