// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { S, fresh, setState } from "../state";
import { milestones, tick, tickNate } from "./tick";
import { AWAY_CAP, catchUp, returnFromAway } from "./offline";
import { fmt, setScientific } from "../util";
import { portrait, portraitScope } from "../ui/portrait";
import { CONTACTS, contactFace, contactFor } from "../data/contacts";
import { tabTitle } from "../ui/render";
import { buyFavorFrom, buyReferral, buyUpg, hireAlly, prestige, useAbility } from "./actions";
import { arcAvailable, startArc } from "./arcs";
import { ARCS } from "../data/arcs";
import { STORY } from "../data/story";
import { attTier, choiceMult, choiceSucc, gripFixer, heatMult, incomeMult, missionReward } from "../calc";
import { allBeaten, checkEnding, newFixer, reduceGrip, simonTip, spawnErrand, tickOrg } from "./org";
import { FIXERS, FIXER_MAX_MULT, FIXER_MIN_MULT, rollFixer } from "../data/org";
import { bribeCost, bribeDrop } from "../calc";
import { buyGen, callNate, craft, payOffFixer, setCover, toggleAuto } from "./actions";
import { FX_NAMES, RECIPES } from "../data/perks";
import { GENS, OP_CAP } from "../data/ops";
import { MEDALS } from "../data/medals";
import { attGain, attNet, buyN, bulkCost, cover, heatFactors, heatGain, heatNet, recipeCash } from "../calc";
import { GRIP_PERKS, SEASON_GRIP, TIERS, handlerFor } from "../data/org";
import { OP_TIERS, UPGS } from "../data/upgrades";
import { COVERS } from "../data/covers";
import { ALLIES } from "../data/allies";
import { FAQ } from "../data/faq";
import { BOSS_FIRST, BOSS_GAP_MIN, BOSS_GAP_SPREAD, bossGapText, nextBossGap } from "../data/pacing";
import { loftBadges } from "../ui/badges";
import { clearNarration, narration, say, toast } from "../ui/fx";
import { dismissAllNotices, dismissNotice, initNotices, noticeCount, noticeOpen, setNoticeGate } from "../ui/notice";
import { showChoice, choiceBusy } from "../ui/choice";
import { CONTACT_CAP, allyFree, allyHere, contactPrice, favorsLeft, hangOutPrice, nextFavorIn, succChance } from "../calc";
import { DAY_MS, FAVORS_PER_DAY } from "../data/pacing";
import { FEE_CAP } from "../state";
import { formatWait } from "../util";
import { tickBusy } from "./tick";
import { inFlashback } from "../calc";
import { fillBoard, gatedEpReady, missionWeight, newMission, resolveMission, startMission } from "./missions";
import { actionBlock, bossAction, bossWeight, spawnBoss, tickBoss } from "./bosses";
import { awayWhy, bossDef, bossView, clickVal, tierDef } from "../calc";
import { spawnClient, spawnEvent } from "./events";
import { seasonOf } from "../data/missions";
import { EP_NOTES } from "../data/episodeNotes";
import { actionDmg, conChance, cps, genMult, referralCost, referralMult, upgradeUnlocked } from "../calc";
import { checkBurn } from "./heat";
import { BOSSES } from "../data/bosses";
import { EVENTS } from "../data/events";
import { MISSIONS, seasonsOpen } from "../data/missions";
import { clientCut, crewCut } from "../data/automation";
import { SAM_ACTS, SAM_ARC, SAM_ARC_ID } from "../data/samAxe";
import { earn, merge } from "../state";
import type { GameState } from "../types";
import { dockProgress, render, showModal } from "../ui/render";
import { menuNew } from "../ui/badges";
import { MENU, MODALS, SECTIONS, buildLayout, panelHTML, titleOf } from "../ui/panels";

beforeAll(() => {
  const html = readFileSync(resolve(__dirname, "../../index.html"), "utf8");
  document.body.innerHTML = html.split("<body>")[1].split("<script")[0];
  buildLayout(document.getElementById("sections")!, document.getElementById("toolbar")!);
  initNotices();
});

beforeEach(() => {
  setState(fresh()); fillBoard();
  document.getElementById("log")!.innerHTML = ""; // narration from one test shouldn't leak into the next
  clearNarration();
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
    expect(html).toContain("Sketch of carla");
    expect(html).not.toContain("Sketch of paxson"); // she doesn't turn up until Season 3
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
  it("sits right under the header, above the game, where it can't be scrolled past", () => {
    const header = document.querySelector("header")!, strip = document.getElementById("voiceover")!, main = document.querySelector("main")!;
    const follows = (a: Node, b: Node) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(header, strip)).toBe(true);
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

describe("Case encounters pause everything else", () => {
  afterEach(() => setNoticeGate(() => false));

  it("missions, Nate and the Organization's fixer wait while a boss is on", () => {
    S.board = []; fillBoard(); startMission(S.board[0].uid);
    const left = S.active[0].left;
    S.allies.nate = true; S.nateAway = false; S.nateTimer = 0.05;
    S.boss = { id: "paxson", hp: 1e15, max: 1e15, left: 60 };
    for (let i = 0; i < 20; i++) tick(0.1);
    expect(S.active[0].left).toBe(left);
    expect(S.nateTimer).toBeCloseTo(0.05, 5);
    S.boss = null;
    tick(1);
    expect(S.active[0].left).toBeLessThan(left);
  });

  it("other news waits behind the fight, and the boss's own arrival still shows", () => {
    setNoticeGate(() => !!S.boss);
    S.boss = { id: "paxson", hp: 1e15, max: 1e15, left: 60 };
    toast("A new season", "Season 4 is open");
    expect(noticeOpen()).toBe(false);
    toast("BOSS: Someone", "Here they come", "bad", true);
    expect(noticeOpen()).toBe(true);
    expect(document.getElementById("nT")!.textContent).toBe("BOSS: Someone");
    dismissNotice();
    expect(noticeOpen()).toBe(false); // the season news is still held
    S.boss = null;
    toast("It's over", "You won", "good");
    expect(noticeOpen()).toBe(true);
    expect(document.getElementById("nT")!.textContent).toBe("A new season");
  });
});

describe("Event options that need an ally", () => {
  const showFootballEvent = () => {
    const pool = EVENTS.filter(e => !e.needs || S.allies[e.needs]);
    const i = pool.findIndex(e => e.t === "A Friend's Friend");
    vi.spyOn(Math, "random").mockReturnValue((i + 0.5) / pool.length);
    spawnEvent();
    vi.restoreAllMocks();
    const labels = [...document.querySelectorAll<HTMLButtonElement>("#evtO button")].map(b => b.textContent);
    document.querySelector<HTMLButtonElement>("#evtO button")?.click(); // answer it so nothing is left open
    dismissAllNotices();
    return labels;
  };

  it("\"Bring Jesse in\" only shows once Jesse is on the crew", () => {
    expect(showFootballEvent()).not.toContain("Bring Jesse in");
    expect(showFootballEvent().length).toBeGreaterThanOrEqual(2);
  });

  it("and shows when he is", () => {
    S.allies.jesse = true;
    expect(showFootballEvent()).toContain("Bring Jesse in");
  });
});

describe("Ghosts From the Past", () => {
  const boss = (id: string) => BOSSES.find(b => b.id === id)!;

  it("Carla stays Carla until Season 3, then her fights are Ghosts From the Past", () => {
    S.life = 1e6;                       // Season 2
    expect(bossView(boss("carla")).n).toBe("Carla Baxter");
    expect(bossView(boss("carla")).intro).toMatch(/errand/i);
    S.life = 2e6;                       // Season 3 opens
    const v = bossView(boss("carla"));
    expect(v.n).toBe("Ghosts From the Past: Carla Baxter");
    expect(v.intro).toMatch(/recording of Carla/);
    expect(v.m).toEqual(boss("carla").m);   // same fight underneath
    expect(v.hpm).toBe(boss("carla").hpm);
    expect(v.mech).toContain(boss("carla").mech);
  });

  it("anyone the story has taken off the board turns into a ghost once their time has passed", () => {
    S.story = 0;
    const gone: [string, number][] = [["strickler", 4], ["gilroy", 4], ["brennen", 5], ["barrett", 5], ["anson", 6], ["vaughn", 6], ["card", 7], ["gray", 7], ["riley", 7], ["bly", 7]];
    const seasonStart = [0, 0, 1e5, 2e6, 3e7, 5e8, 8e9, 1e11];
    for (const [id, season] of gone) {
      S.life = seasonStart[season - 1] + 1;
      expect(bossView(boss(id)).n, `${id} before`).not.toContain("Ghosts From the Past");
      S.life = seasonStart[season];
      expect(bossView(boss(id)).n, `${id} after`).toBe(`Ghosts From the Past: ${boss(id).n}`);
    }
  });

  it("people who are still around are never ghosts", () => {
    S.life = 1e13; S.story = 99;
    for (const id of ["paxson", "larry", "oneill", "burke", "sonya", "kendrick"]) expect(bossView(boss(id)).n, id).toBe(boss(id).n);
  });

  it("Cowan, who dies in the first Season's story, is a ghost once that beat has passed", () => {
    S.life = 1e4; S.story = 0;
    expect(bossView(boss("cowan")).n).toBe("Phillip Cowan");
    S.story = STORY.findIndex(b => b.t === "The Man Who Burned You") + 1;
    expect(bossView(boss("cowan")).n).toBe("Ghosts From the Past: Phillip Cowan");
    expect(bossView(boss("cowan")).m).toContain("freeze");
  });

  it("the card, tab title, Rogues file and The List all use the ghost version", () => {
    S.life = 1e12;
    S.boss = { id: "carla", hp: 1e15, max: 1e15, left: 60 };
    expect(bossDef()!.n).toBe("Ghosts From the Past: Carla Baxter");
    expect(tabTitle()).toContain("Ghosts From the Past: Carla Baxter");
    S.bossKills.carla = 1;
    expect(panelHTML("rogue")).toContain("Ghosts From the Past: Carla Baxter");
    expect(panelHTML("rogue")).toContain("what they set in motion keeps turning up");
    S.bossKills.carla = 0; S.listKnown.carla = true;
    expect(panelHTML("list")).toContain("Carla Baxter");
    expect(panelHTML("list")).toContain("Gone, but not finished.");
  });

  it("winning uses ghost lines", () => {
    S.life = 1e12;
    S.boss = { id: "carla", hp: 0, max: 1e6, left: 60 };
    tickBoss(1);
    expect(document.getElementById("log")!.textContent).toMatch(/close the file on Carla Baxter for good/);
  });
});

describe("Nate's two looks", () => {
  it("his picture changes once he's back from Vegas", () => {
    S.nateStage = 0; portraitScope("t");
    const before = portrait("nate", 64);
    S.nateStage = 1; portraitScope("t");
    const after = portrait("nate", 64);
    expect(after).not.toBe(before);
    expect(after).toContain("Sketch of nate");
    S.nateStage = 0; portraitScope("t");
    expect(portrait("nate", 64)).toBe(before);
    S.nateStage = 3; portraitScope("t");
    expect(portrait("nate", 64)).toBe(after);
  });

  it("and the Crew pop-up shows whichever he is right now", () => {
    S.life = 1e12; S.allies.nate = true; S.nateStage = 0;
    const a = panelHTML("crew");
    S.nateStage = 1;
    const b = panelHTML("crew");
    expect(b).not.toBe(a);
  });
});

describe("Reinstating: preview, stats and Fiona's time off", () => {
  it("the Reinstate card previews the gain and the next point", () => {
    S.run = 3e8; S.cred = 2; S.stats.bestRun = 1e8;
    const html = panelHTML("rep");
    expect(html).toMatch(/Credibility: 2 now \(\+20% income\)/);
    expect(html).toContain("after");
    expect(html).toMatch(/Next Credibility point at/);
    expect(html).toContain("Your best run");
  });

  it("before you qualify it says how far there is to go", () => {
    S.run = 1e7;
    expect(panelHTML("rep")).toMatch(/Qualifies at \$100M this run/);
  });

  it("reinstating sends Fiona off for one to four hours, and she can't be sent on missions meanwhile", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    S.allies.fiona = true; S.run = 2e8; S.stats.bestRun = 0;
    prestige();
    expect(S.stats.bestRun).toBe(2e8);
    expect(S.fionaAway).toBeGreaterThanOrEqual(3600);
    expect(S.fionaAway).toBeLessThanOrEqual(14400);
    expect(awayWhy("fiona")!.short).toMatch(/on her own/);
    expect(allyHere("fiona")).toBe(false);
    S.fionaAway = 0;
    expect(allyHere("fiona")).toBe(true);
    vi.restoreAllMocks();
  });

  it("no Fiona, no disappearance", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    S.allies = {}; S.run = 2e8;
    prestige();
    expect(S.fionaAway).toBe(0);
    vi.restoreAllMocks();
  });

  it("the Stats card shows your totals", () => {
    S.stats.mDone = 12; S.stats.mFail = 3; S.stats.bestRun = 5e9; S.stats.longestAway = 7200;
    const html = panelHTML("stats");
    expect(html).toContain("12 / 3");
    expect(html).toContain("$5.00B");
    expect(html).toContain("Longest away");
    expect(html).toContain("2h");
  });
});

describe("The bottom bar, the menu and Settings", () => {
  it("the old toolbar and footer are gone, and the bar is there", () => {
    expect(document.getElementById("toolbar")).toBeNull();
    expect(document.querySelector(".foot")).toBeNull();
    for (const id of ["dock", "dockface", "docklv", "dockfill", "dockTop", "dockLog"]) expect(document.getElementById(id), id).not.toBeNull();
    expect(document.querySelector('.dock [data-modal="options"]')).not.toBeNull();
  });

  it("the menu lists the reference screens, and nothing from The Loft", () => {
    const html = panelHTML("options");
    for (const id of ["list", "file", "stats", "auto", "story", "rogue", "med", "rep", "faq", "settings"]) expect(html, id).toContain(`data-modal="${id}"`);
    for (const id of ["crew", "cov", "gad", "fav"]) expect(html, id).not.toContain(`data-modal="${id}"`);
    expect(MENU.every(id => titleOf(id).length > 0)).toBe(true);
  });

  it("Settings holds sound, pop-ups, number style and the save controls", () => {
    S.mute = false; S.popups = true; S.sci = false;
    const html = panelHTML("settings");
    for (const k of ["mute", "popups", "numfmt", "export", "import", "wipe"]) expect(html, k).toContain(`data-arg="${k}"`);
    expect(html).toContain('id="saveinfo"');
    S.mute = true; S.sci = true;
    const html2 = panelHTML("settings");
    expect(html2).toMatch(/Sound[\s\S]*Off/);
    expect(html2).toContain("Scientific");
  });

  it("the bar shows Credibility and progress toward the next point", () => {
    S.cred = 3; S.run = 5e7; render();
    expect(document.getElementById("docklv")!.textContent).toBe("Credibility 3 → 4");
    expect(document.getElementById("dockpct")!.textContent).toBe("50%");
    S.run = 2e8; render(); // worth 4 points now, so the next point would make 3 + 4 + 1
    expect(document.getElementById("docklv")!.textContent).toBe("Credibility 3 → 8");
    expect(+document.getElementById("dockpct")!.textContent!.replace("%", "")).toBeGreaterThan(0);
    expect(dockProgress().pct).toBeLessThanOrEqual(1);
  });
});

describe("Operations stop at 250", () => {
  const inf = () => GENS[0];

  it("one click never takes you past the cap, and a maxed operation can't be bought", () => {
    S.cash = 1e300; S.gens = { inf: 240 };
    S.buyAmt = 100;
    expect(buyN(inf())).toBe(10);
    buyGen("inf");
    expect(S.gens.inf).toBe(250);
    expect(buyN(inf())).toBe(0);
    const cash = S.cash;
    buyGen("inf");
    expect(S.gens.inf).toBe(250);
    expect(S.cash).toBe(cash);
  });

  it("Max stops at the cap too, and only pays for what it buys", () => {
    S.cash = 1e24; S.gens = { inf: 200 }; S.buyAmt = "max";
    expect(buyN(inf())).toBe(50);
    const before = S.cash, price = bulkCost(inf(), 50);
    buyGen("inf");
    expect(S.gens.inf).toBe(250);
    expect(Math.abs(before - S.cash - price) / price).toBeLessThan(1e-6);
  });

  it("the row says Maxed, and a saved game that already owns more keeps what it has", () => {
    S.life = 1e15; S.gens = { inf: 250 };
    expect(panelHTML("ops")).toContain("Maxed");
    S.gens = { inf: 300 };
    expect(buyN(inf())).toBe(0);
    expect(S.gens.inf).toBe(300);
  });

  it("every upgrade tier is reachable under the cap", () => {
    expect(Math.max(...OP_TIERS.map(t => t.owned))).toBeLessThanOrEqual(OP_CAP);
  });

  it("the Fully Staffed medal needs every operation at the cap", () => {
    const medal = MEDALS.find(m => m.n === "Fully Staffed")!;
    S.gens = Object.fromEntries(GENS.map(g => [g.id, OP_CAP - 1]));
    expect(medal.t(S)).toBe(false);
    S.gens = Object.fromEntries(GENS.map(g => [g.id, OP_CAP]));
    expect(medal.t(S)).toBe(true);
  });
});

describe("The Narrator pop-up", () => {
  it("shows what the narrator has said, newest first and bigger", () => {
    say("First thing."); say("Second thing."); say("Third thing.");
    const html = panelHTML("narrator");
    expect(html).toMatch(/nl-note now[^>]*><p>Third thing\./);
    expect(html.indexOf("Second thing.")).toBeLessThan(html.indexOf("First thing."));
    expect(html).toContain("The last 3 things");
  });

  it("colors each line by what it's about, and puts the episode on mission lines", () => {
    S.board = []; fillBoard();
    const t = MISSIONS.find(x => x.ep === "505")!;
    const m = { uid: 7001, n: t.n, dur: 1, succ: 1, heat: 1, rm: 1, fav: 1, ally: t.ally, kid: false, elder: false, send: false, ep: t.ep, epTitle: t.epTitle, sent: null, left: 0, chance: 1, reward: 100 };
    S.active = [m];
    resolveMission(m);
    const tags = narration().map(e => e.tag);
    expect(tags).toContain("mission");
    const withEp = narration().find(e => e.meta?.season === 5)!;
    expect(withEp.meta!.label).toBe("S5 · E5 · Square One");
    const html = panelHTML("narrator");
    expect(html).toContain("nl-mission");
    expect(html).toMatch(/nl-ep s5">S5 · E5 · Square One/);
    expect(html).toContain("Mission</span>");
  });

  it("failures, boss lines and crew lines get their own colors", () => {
    const t = MISSIONS.find(x => x.ep === "303")!;
    const m = { uid: 7002, n: t.n, dur: 1, succ: 0, heat: 1, rm: 1, fav: 1, ally: t.ally, kid: false, elder: false, send: false, ep: t.ep, epTitle: t.epTitle, sent: null, left: 0, chance: 0, reward: 100 };
    S.active = [m];
    resolveMission(m);
    S.allies.nate = true; S.nateAway = false; S.nateStage = 3; S.nateTimer = 0;
    tickNate(0.1);
    S.life = 1e13; spawnBoss();
    const tags = new Set(narration().map(e => e.tag));
    for (const k of ["fail", "crew", "boss"]) expect(tags.has(k as never), k).toBe(true);
    const html = panelHTML("narrator");
    for (const k of ["nl-fail", "nl-crew", "nl-boss"]) expect(html, k).toContain(k);
  });

  it("says so when there's nothing to read yet", () => {
    expect(panelHTML("narrator")).toMatch(/Nothing yet/);
  });

  it("opens as a pop-up titled Narrator", () => {
    showModal("narrator");
    expect(document.getElementById("modalTitle")!.textContent).toBe("Narrator");
    showModal(null);
  });
});

describe("Something new in the menu", () => {
  it("a save you're already playing starts with nothing marked new", () => {
    S.life = 1e12; S.story = 5; S.ach = ["a1", "a2"];
    expect(menuNew()).toEqual({});
    expect(S.seen.med).toBe(2);
  });

  it("a new medal, story beat or unlock lights up its screen, and opening it clears it", () => {
    menuNew();                       // sets the baseline
    S.ach = ["a1"]; S.story = 2;
    const n = menuNew();
    expect(n.med).toBe(1);
    expect(n.story).toBe(2);
    showModal("med");
    expect(menuNew().med).toBeUndefined();
    expect(menuNew().story).toBe(2); // the other one is still new
    showModal(null);
  });

  it("the menu button gets a dot, and the menu entries get NEW chips", () => {
    render();
    expect(document.getElementById("dockMenu")!.classList.contains("has-new")).toBe(false);
    S.ach = ["a1", "a2", "a3"];
    render();
    expect(document.getElementById("dockMenu")!.classList.contains("has-new")).toBe(true);
    expect(panelHTML("options")).toMatch(/Medals<span class="newchip">NEW/);
    showModal("med"); showModal(null); render();
    expect(document.getElementById("dockMenu")!.classList.contains("has-new")).toBe(false);
  });

  it("Reinstate lights up once when it first becomes possible", () => {
    S.run = 1e7; menuNew();
    S.run = 2e8;
    expect(menuNew().rep).toBe(1);
    showModal("rep"); showModal(null);
    expect(menuNew().rep).toBeUndefined();
    S.run = 0; menuNew();            // after a reset
    S.run = 3e8;
    expect(menuNew().rep).toBe(1);
  });
});

describe("Gadgets are worth making", () => {
  const stock = () => { S.junk = { tape: 20, wire: 20, bleach: 20, micro: 20 }; };

  it("the timed gadgets last minutes, not seconds", () => {
    stock();
    craft("jam"); craft("boost"); craft("jobs"); craft("fast"); craft("pay");
    expect(S.fx.jam).toBeGreaterThanOrEqual(180);
    expect(S.fx.boost).toBeGreaterThanOrEqual(120);
    expect(S.fx.jobs).toBeGreaterThanOrEqual(120);
    expect(S.fx.fast).toBeGreaterThanOrEqual(180);
    expect(S.fx.pay).toBeGreaterThanOrEqual(180);
  });

  it("Signal Booster triples income, Fake IDs multiply jobs by six, and the Paper Trail doubles mission pay", () => {
    S.gens.inf = 20;
    const income = cps(), job = clickVal(), pay = missionReward(S.board[0]);
    stock();
    craft("boost"); craft("jobs"); craft("pay");
    expect(cps()).toBeGreaterThan(income * 2.9);
    expect(clickVal()).toBeGreaterThan(job * 5.5);
    expect(missionReward(S.board[0])).toBeGreaterThan(pay * 1.9);
  });

  it("the Smoke Bomb also cools attention, and the Bug Sweeper takes 30 attention off", () => {
    stock(); S.heat = 60; S.att = 50;
    craft("smoke");
    expect(S.heat).toBe(30);
    expect(S.att).toBe(40);
    craft("sweep");
    expect(S.att).toBe(10);
  });

  it("every gadget has a name, a description and a price in junk", () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(7);
    for (const r of RECIPES) { expect(r.name.length).toBeGreaterThan(3); expect(r.desc.length).toBeGreaterThan(10); expect(Object.keys(r.need).length).toBeGreaterThan(0); }
  });

  it("a boss that strips boosts also strips the new ones", () => {
    stock(); craft("pay"); craft("fast");
    S.life = 1e13; S.boss = { id: "burke", hp: 1e15, max: 1e15, left: 60 };
    tickBoss(0.1);
    expect(S.fx.pay).toBe(0);
    expect(S.fx.fast).toBe(0);
  });

  it("the timers count down and the chips show their names", () => {
    stock(); craft("boost");
    expect(FX_NAMES.boost).toBe("Booster ×3");
    tick(10);
    expect(S.fx.boost).toBeLessThan(120);
  });
});

describe("The board favors this season's cases", () => {
  const draw = (n: number) => { const out: string[] = []; for (let i = 0; i < n; i++) { S.board = []; out.push(newMission().ep!); } return out; };
  const share = (eps: string[], season: number) => eps.filter(e => seasonOf(e) === season).length / eps.length;

  it("cases from the Season you're in come up far more than their fair share", () => {
    S.life = 5e8; // Season 5: 18 of the 80 open cases
    const fair = 18 / 80;
    expect(share(draw(1500), 5)).toBeGreaterThan(fair * 1.6);
  });

  it("episodes you haven't done come up before ones you have", () => {
    S.life = 5e8;
    for (const m of MISSIONS) if (seasonOf(m.ep!) < 5) S.episodesDone[m.ep!] = true;
    expect(share(draw(1000), 5)).toBeGreaterThan(0.7);
  });

  it("nothing on the board is ever repeated, and old seasons still show up now and then", () => {
    S.life = 5e8;
    S.board = []; fillBoard();
    expect(new Set(S.board.map(m => m.n)).size).toBe(3);
    expect(share(draw(1500), 1)).toBeGreaterThan(0.02);
  });

  it("the weight is highest for an unseen case in the current season", () => {
    S.life = 5e8;
    expect(missionWeight({ ep: "505" })).toBeGreaterThan(missionWeight({ ep: "205" }));
    S.episodesDone["505"] = true;
    expect(missionWeight({ ep: "505" })).toBeLessThan(missionWeight({ ep: "506" }));
  });
});

describe("The board when someone is away", () => {
  it("at most one of Nate's cases waits on the board while he's away", () => {
    S.allies.nate = true; S.nateAway = true; S.life = 1e12;
    for (let i = 0; i < 300; i++) {
      S.board = []; fillBoard();
      expect(S.board.filter(m => m.ally === "nate").length).toBeLessThanOrEqual(1);
      expect(S.board.length).toBe(3);
    }
  });

  it("when he wanders off, extra Nate cases already on the board are swapped for others", () => {
    S.life = 1e12; S.allies.nate = true; S.nateAway = false;
    const nateCases = MISSIONS.filter(m => m.ally === "nate").slice(0, 3);
    S.board = nateCases.map((t, i) => ({ uid: 9000 + i, n: t.n, dur: t.dur, succ: t.succ, heat: t.heat, rm: t.rm, fav: t.fav, ally: t.ally, kid: false, elder: false, send: false, ep: t.ep, epTitle: t.epTitle }));
    fillBoard();
    expect(S.board.filter(m => m.ally === "nate").length).toBe(3); // he's around: fine
    S.nateAway = true;
    fillBoard();
    expect(S.board.filter(m => m.ally === "nate").length).toBe(1);
    expect(S.board.length).toBe(3);
  });

  it("with him around, his cases come up as normal", () => {
    S.allies.nate = true; S.nateAway = false; S.life = 1e12;
    let most = 0;
    for (let i = 0; i < 3000; i++) { S.board = []; fillBoard(); most = Math.max(most, S.board.filter(m => m.ally === "nate").length); }
    expect(most).toBeGreaterThanOrEqual(2);
  });
});

describe("Nate's absences", () => {
  it("he's gone twenty minutes to an hour, not hours", () => {
    S.allies.nate = true; S.nateAway = false; S.nateTimer = 0;
    tickNate(0.1);
    expect(S.nateAway).toBe(true);
    expect(S.nateTimer).toBeGreaterThanOrEqual(1200);
    expect(S.nateTimer).toBeLessThanOrEqual(3600);
  });

  it("a save from when his trips were longer gets him home within the hour", () => {
    expect(merge({ nateAway: true, nateTimer: 9000 }).nateTimer).toBe(3600);
    expect(merge({ nateAway: true, nateTimer: 900 }).nateTimer).toBe(900);
    expect(merge({ nateAway: false, nateTimer: 900 }).nateTimer).toBe(900);
  });

  it("you can call him back for a favor, once", () => {
    S.allies.nate = true; S.nateAway = true; S.nateStage = 3; S.favors = 1;
    callNate();
    expect(S.nateAway).toBe(false);
    expect(S.favors).toBe(0);
    callNate();            // he's already here, and you're out of favors
    expect(S.favors).toBe(0);
  });

  it("it needs a favor, and the Crew card only offers it while he's away", () => {
    S.life = 1e12; S.allies.nate = true; S.nateStage = 3;
    S.nateAway = false; expect(panelHTML("crew")).not.toContain("Call him back");
    S.nateAway = true; S.favors = 0;
    expect(panelHTML("crew")).toMatch(/data-act="callnate" disabled/);
    S.favors = 2;
    expect(panelHTML("crew")).toMatch(/data-act="callnate" >Call him back/);
    callNate();
    expect(S.nateAway).toBe(false);
  });

  it("coming back this way still tells his story the first times", () => {
    S.allies.nate = true; S.nateAway = true; S.nateStage = 0; S.favors = 1;
    callNate();
    expect(S.nateStage).toBe(1);
    expect(document.getElementById("nT")!.textContent).toBe("Nate got married");
  });
});

describe("The heat and attention info view", () => {
  it("what it says matches what the game actually does each second", () => {
    S.gens = { inf: 50, tape: 30, sam: 20 }; S.heat = 40; S.att = 30;
    const net = heatNet(), anet = attNet();
    expect(net).toBeCloseTo(heatGain() - 1.2, 10);
    tick(1);
    expect(S.heat).toBeCloseTo(40 + net, 6);
    expect(S.att).toBeCloseTo(30 + anet, 2); // heat moved a hair during the second
  });

  it("lists the multipliers that apply, and leaves out the ones that don't", () => {
    S.upgs.h1 = true; S.allies.sam = true;
    const labels = heatFactors().map(f => f.label).join("|");
    expect(labels).toContain("Quiet Methods");
    expect(labels).toContain("Sam's perk");
    expect(labels).toContain("Cover:");
    expect(labels).toContain("Organization stage");
    expect(labels).not.toContain("Cooler Head");
    expect(heatMult()).toBeCloseTo(heatFactors().reduce((m, f) => m * f.v, 1), 10);
  });

  it("the Door-Cam Jammer shows up and stops heat gain", () => {
    S.gens = { inf: 50 }; S.fx.jam = 60;
    expect(heatMult()).toBe(0);
    expect(heatGain()).toBe(0);
    expect(panelHTML("heatinfo")).toContain("Door-Cam Jammer");
  });

  it("the page explains heat, attention, rates, and when you'd burn or get ambushed", () => {
    S.gens = { inf: 200, tape: 200, sam: 200, fi: 200, mad: 200 }; S.heat = 30; S.att = 40;
    const html = panelHTML("heatinfo");
    expect(html).toContain("Net heat");
    expect(html).toContain("Net attention");
    expect(html).toMatch(/[+−]\d+\.\d\d\/s/);
    expect(html).toMatch(/reach 100% heat \(a burn\) in about/);
    expect(html).toContain("What helps");
  });

  it("it says when you're cooling instead", () => {
    S.gens = {}; S.heat = 50; S.att = 20;
    expect(panelHTML("heatinfo")).toMatch(/You're cooling/);
  });

  it("the Loft has an info button on both bars", () => {
    expect(document.querySelectorAll('.infobtn[data-modal="heatinfo"]').length).toBe(2);
  });
});

describe("Crew abilities are worth the cooldown", () => {
  const gainFrom = (id: string): number => {
    S.gens = { inf: 60, tape: 30 }; S.allies[id] = true; S.cash = 0; S.allyCd = {};
    const before = S.cash; useAbility(id);
    return (S.cash - before) / cps();
  };

  it("Sam, Fiona and Barry hand over minutes of income, not seconds", () => {
    expect(gainFrom("sam")).toBeGreaterThanOrEqual(239);
    expect(gainFrom("fiona")).toBeGreaterThanOrEqual(419);
    expect(gainFrom("barry")).toBeGreaterThanOrEqual(299);
  });

  it("Jesse's Fast Talk lasts four minutes", () => {
    S.allies.jesse = true; S.allyCd = {};
    useAbility("jesse");
    expect(S.fx.fast).toBe(240);
  });

  it("the descriptions on the cards say how long and how much", () => {
    const d = (id: string) => ALLIES.find(a => a.id === id)!.abDesc;
    expect(d("sam")).toMatch(/4 minutes/);
    expect(d("fiona")).toMatch(/7 minutes/);
    expect(d("barry")).toMatch(/5 minutes/);
    expect(d("jesse")).toMatch(/4 minutes/);
    expect(d("nate")).toMatch(/10 minutes/);
  });
});

describe("Cover identities", () => {
  it("there are plenty, in the order they unlock, and each one is a trade-off", () => {
    expect(COVERS.length).toBeGreaterThanOrEqual(12);
    expect(COVERS.map(c => c.unlock)).toEqual([...COVERS.map(c => c.unlock)].sort((a, b) => a - b));
    expect(new Set(COVERS.map(c => c.id)).size).toBe(COVERS.length);
    for (const c of COVERS) {
      const ups = [c.job, c.inc, c.mis].some(v => v > 1), downs = [c.inc, c.mis].some(v => v < 1) || c.heat > 1;
      const quieter = c.heat < 1;
      expect(c.desc.length, c.name).toBeGreaterThan(8);
      if (c.id !== "con") expect(downs || quieter || ups, c.name).toBe(true);
      expect(c.job, c.name).toBeGreaterThan(0); expect(c.inc, c.name).toBeGreaterThan(0.5); expect(c.mis, c.name).toBeGreaterThan(0.5);
    }
  });

  it("a high-reward cover costs you in heat, and a quiet cover costs you in income", () => {
    for (const c of COVERS) {
      if (c.mis >= 1.4 || c.inc >= 1.4) expect(c.heat, c.name).toBeGreaterThanOrEqual(1);
      if (c.heat <= 0.6) expect(c.inc, c.name).toBeLessThan(1);
    }
  });

  it("only the ones you've earned can be picked", () => {
    S.life = 2e6; S.coverCd = 0; S.cover = "con";
    setCover("yacht");
    expect(S.cover).toBe("con");
    S.life = 2e7;
    setCover("yacht");
    expect(S.cover).toBe("yacht");
    expect(cover().mis).toBe(1.2);
  });
});

describe("Net heat and net attention bars", () => {
  it("each has its own bar under its meter, in the Loft", () => {
    for (const id of ["netheat", "netatt"]) {
      const el = document.getElementById(id)!;
      expect(el, id).not.toBeNull();
      expect(el.dataset.modal).toBe("heatinfo");
    }
    const heat = document.getElementById("heatbar")!, att = document.getElementById("attbar")!;
    const follows = (a: Node, b: Node) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(heat, document.getElementById("netheat")!)).toBe(true);
    expect(follows(att, document.getElementById("netatt")!)).toBe(true);
    expect(follows(document.getElementById("netheat")!, att)).toBe(true);
  });

  it("red and up when it's building, green and down when it's cooling", () => {
    S.gens = { inf: 400, tape: 300, sam: 200 }; S.heat = 50; S.att = 20;
    render();
    const h = document.getElementById("netheat")!;
    expect(h.classList.contains("up")).toBe(true);
    expect(document.getElementById("netheattxt")!.textContent).toMatch(/^▲ \+\d+\.\d\d\/s$/);
    expect(document.getElementById("netheatfill")!.style.left).toBe("50%");
    S.gens = {}; render();
    expect(h.classList.contains("down")).toBe(true);
    expect(h.classList.contains("up")).toBe(false);
    expect(document.getElementById("netheattxt")!.textContent).toMatch(/^▼ −1\.20\/s$/);
    expect(parseFloat(document.getElementById("netheatfill")!.style.left)).toBeLessThan(50);
  });

  it("attention shows its own rate", () => {
    S.gens = {}; S.heat = 80; render();
    const a = document.getElementById("netatt")!;
    expect(a.classList.contains("up")).toBe(true);
    S.heat = 0; render();
    expect(a.classList.contains("down")).toBe(true);
    expect(document.getElementById("netatttxt")!.textContent).toMatch(/^▼ −0\.20\/s$/);
  });
});

describe("The Submarine", () => {
  const stockSub = () => { S.junk = { tape: 20, wire: 20, bleach: 20, micro: 20 }; S.gens = { inf: 50, tape: 30 }; S.cash = 1e12; };

  it("is a rare gadget that costs a lot of junk and an hour of income", () => {
    const r = RECIPES.find(x => x.id === "sub")!;
    expect(r.rare).toBe(true);
    expect(Object.values(r.need).reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(40);
    S.gens = { inf: 50, tape: 30 };
    expect(recipeCash(r)).toBeGreaterThanOrEqual(cps() * 3600 * 0.99);
  });

  it("needs the cash as well as the junk", () => {
    stockSub(); S.cash = 10;
    craft("sub");
    expect(S.fx.sub || 0).toBe(0);
    expect(S.junk.tape).toBe(20);
    S.cash = 1e12;
    craft("sub");
    expect(S.fx.sub).toBe(21600);
    expect(S.cash).toBeLessThan(1e12);
    expect(S.junk.tape).toBe(5);
  });

  it("for six hours heat doesn't build and the Organization doesn't gain on you", () => {
    stockSub(); S.heat = 40; S.att = 40; craft("sub");
    expect(heatMult()).toBe(0);
    expect(heatGain()).toBe(0);
    expect(attGain()).toBe(0);
    tick(10);
    expect(S.heat).toBeLessThan(40);        // it still cools
    expect(S.att).toBeLessThanOrEqual(40);   // and attention doesn't climb
  });

  it("finishing a mission doesn't draw attention while you're under", () => {
    stockSub(); S.att = 10; craft("sub");
    const t = MISSIONS[0];
    const m = { uid: 7101, n: t.n, dur: 1, succ: 1, heat: 5, rm: 1, fav: 1, ally: t.ally, kid: false, elder: false, send: false, ep: t.ep, epTitle: t.epTitle, sent: null, left: 0, chance: 1, reward: 100 };
    S.active = [m]; resolveMission(m);
    expect(S.att).toBe(10);
  });

  it("only one at a time, and it runs down while you're away", () => {
    stockSub(); craft("sub");
    const junk = S.junk.tape; craft("sub");
    expect(S.junk.tape).toBe(junk);
    catchUp(3600);
    expect(S.fx.sub).toBeLessThan(21600 - 3000);
    expect(S.fx.sub).toBeGreaterThan(0);
  });

  it("the Gadgets card marks it RARE, and the chip counts in hours", () => {
    stockSub();
    const html = panelHTML("gad");
    expect(html).toContain("RARE");
    expect(html).toMatch(/Submarine[\s\S]*15 duct tape/);
    craft("sub"); render();
    expect(document.getElementById("fx")!.textContent).toMatch(/Submarine 5h 5\dm|Submarine 6h/);
    expect(panelHTML("heatinfo")).toContain("Submarine");
  });
});

describe("The stylesheet has rules for the pieces the game builds", () => {
  it("every class the interface relies on is styled", () => {
    const css = readFileSync("src/styles.css", "utf8");
    const needed = [
      "dock", "dockface", "dockbar", "dockbtn", "has-new", "newchip", "menugrid", "infobtn", "netbar", "nb-track", "nb-val",
      "narr", "nl", "nl-head", "nl-tag", "nl-ep", "nl-mission", "nl-fail", "nl-boss", "nl-crew", "nl-story", "rare", "drow", "dfile", "mishead", "portrait",
    ];
    for (const c of needed) expect(css, `.${c}`).toMatch(new RegExp(`\\.${c}[^a-zA-Z0-9_-]`));
  });
});

describe("The Fall of Sam Axe", () => {
  beforeEach(() => { S.episodesDone["516"] = true; }); // Beatriz has turned up
  const answer = (k = 0) => { document.querySelectorAll<HTMLButtonElement>("#evtO button")[k].click(); dismissAllNotices(); };
  const closeDialog = () => { const ok = document.querySelectorAll<HTMLButtonElement>("#evtO button"); if (ok.length) ok[0].click(); };

  /** Run the whole case: tell each act, win each step, win the showdown. */
  const playIt = () => {
    S.life = 5e8; S.allies.sam = true; S.gens.inf = 30; S.favors = 0;
    for (let step = 0; step < SAM_ARC.steps.length; step++) {
      dismissAllNotices(); // a pop-up on screen means you're not starting anything yet
      startArc("samfall");
      const st = SAM_ARC.steps[step];
      if (st.act !== undefined) { expect(document.getElementById("evtT")!.textContent, `act ${st.act}`).toContain("The Fall of Sam Axe"); answer(0); }
      if (st.boss) {
        expect(S.boss!.id).toBe("veracruz");
        S.boss!.hp = 0; tickBoss(0.1);
        expect(S.boss).toBeNull();
      } else {
        const m = S.active.find(x => x.arc?.id === "samfall")!;
        expect(m.arc!.step).toBe(step);
        m.chance = 1; resolveMission(m);
      }
    }
  };

  it("is a seven-step Open Case in four acts offered through an episode", () => {
    expect(SAM_ARC.steps.length).toBe(7);
    expect(SAM_ARC.steps.filter(s => s.act !== undefined).map(s => s.act)).toEqual([0, 1, 2, 3]);
    expect(SAM_ARC.steps[SAM_ARC.steps.length - 1].boss).toBe("veracruz");
    expect(SAM_ACTS.length).toBe(4);
    for (const act of SAM_ACTS) expect(act.options.length).toBe(2);
    S.life = 4e8; expect(arcAvailable(SAM_ARC)).toBe(true); // the episode is the gate, not the income
  });

  it("Sam offers it when Beatriz turns up in Depth Perception, or in Season 6 if you never see her", () => {
    S.episodesDone = {}; S.life = 5e8;
    expect(arcAvailable(SAM_ARC)).toBe(false);          // Season 5, but Beatriz hasn't shown up
    S.episodesDone["516"] = true;
    expect(arcAvailable(SAM_ARC)).toBe(true);
    S.episodesDone = {}; S.life = 8e9;                  // Season 6 opens: the fallback
    expect(arcAvailable(SAM_ARC)).toBe(true);
  });

  it("the offer is a pop-up, made once, and says it's about Beatriz when she's the reason", () => {
    S.episodesDone = {}; S.life = 5e8; S.samOffered = false;
    S.story = STORY.length; S.seasonOpen = 5; S.intel = 2; // no other pop-ups to get in the way
    dismissAllNotices();
    milestones();
    expect(S.samOffered).toBe(false);                   // not yet
    S.episodesDone["516"] = true;
    milestones();
    expect(S.samOffered).toBe(true);
    const seen: string[] = [];
    while (noticeOpen()) { seen.push(document.getElementById("nT")!.textContent + " " + document.getElementById("nM")!.textContent); dismissNotice(); }
    const all = seen.join(" | ");
    expect(all).toMatch(/Sam has a story/);
    expect(all).toMatch(/Beatriz/);
    dismissAllNotices();
    milestones();
    expect(noticeOpen()).toBe(false);                   // only once
  });

  it("Depth Perception stays off the board until every other Season 5 case is done", () => {
    S.life = 5e8; S.episodesDone = {};
    expect(gatedEpReady()).toBe(false);
    for (let i = 0; i < 200; i++) { S.board = []; S.active = []; fillBoard(); expect(S.board.some(m => m.ep === "516")).toBe(false); }
    for (const t of MISSIONS) if (t.ep && seasonOf(t.ep) === 5 && t.ep !== "516") S.episodesDone[t.ep] = true;
    expect(gatedEpReady()).toBe(true);
  });

  it("the game wears a flashback look, and the act pop-ups an inquiry look, while the case is on", () => {
    S.life = 5e8; dismissAllNotices();
    expect(inFlashback()).toBe(false);
    startArc("samfall");
    expect(document.getElementById("evtDlg")!.classList.contains("inquiry")).toBe(true);
    answer(0);
    expect(inFlashback()).toBe(true);
    render();
    expect(document.body.classList.contains("flashback")).toBe(true);
    S.active = []; S.arcStep[SAM_ARC_ID] = 0;
    render();
    expect(document.body.classList.contains("flashback")).toBe(false);
  });

  it("the Depth Perception mission is the one where Beatriz turns up", () => {
    const m = MISSIONS.find(x => x.ep === "516")!;
    expect(m.n).toMatch(/Sam's Old Friend/);
    expect(m.ally).toBe("sam");
  });

  it("each act opens with the Admiral's questions and a choice, and the mission starts after you answer", () => {
    S.life = 5e8;
    dismissAllNotices();
    startArc("samfall");
    expect(document.getElementById("evtT")!.textContent).toBe("The Fall of Sam Axe · Act One: The Window");
    expect(document.getElementById("evtD")!.textContent).toMatch(/Admiral Lawrence/);
    expect(S.active.length).toBe(0);               // not yet
    answer(1);
    expect(S.samChoices[0]).toBe(1);
    expect(S.active.length).toBe(1);
    expect(S.active[0].n).toContain("Make a Hasty Exit From Virginia");
  });

  it("how Sam tells it counts: it's remembered and changes your numbers", () => {
    S.life = 5e8; S.allies.sam = true;
    const inc = incomeMult();
    S.samChoices[2] = 1;                              // the show of force: +4% income
    expect(incomeMult()).toBeGreaterThan(inc * 1.03);
    S.favors = 0; S.arcStep.samfall = 6; S.samChoices = { 0: 0, 1: 0, 2: 1 };
    dismissAllNotices();
    startArc("samfall");
    answer(0);                                        // Beatriz's photographs: +8 favors
    expect(S.favors).toBeGreaterThanOrEqual(8);
  });

  it("the last step is a showdown with Commandante Veracruz, who never appears on his own", () => {
    S.life = 1e13; S.allies = {}; S.story = 99;
    for (let i = 0; i < 300; i++) { S.boss = null; spawnBoss(); expect(S.boss!.id).not.toBe("veracruz"); }
    S.boss = null;
    S.life = 5e8; S.arcStep.samfall = 6; S.samChoices = { 0: 0, 1: 0, 2: 0 };
    dismissAllNotices();
    startArc("samfall");
    answer(0);
    expect(S.boss!.id).toBe("veracruz");
    expect(S.boss!.arc).toEqual({ id: "samfall", step: 6 });
    expect(bossDef()!.flashback).toBe(true);
    expect(BOSSES.some(b => b.id === "veracruz")).toBe(false); // not on The List
  });

  it("losing the showdown leaves the case open to try again", () => {
    S.life = 5e8; S.arcStep.samfall = 6; S.samChoices = { 0: 0, 1: 0, 2: 0, 3: 0 };
    dismissAllNotices();
    startArc("samfall");
    S.boss!.left = 0; tickBoss(0.1);
    expect(S.boss).toBeNull();
    expect(S.arcsDone.samfall).toBeFalsy();
    expect(S.arcStep.samfall).toBe(6);
    dismissAllNotices();
    startArc("samfall");
    expect(S.boss!.id).toBe("veracruz");
  });

  it("closing it unlocks Chuck Finley, the La Barbilla medal and a sharper Sam", () => {
    const covers = () => COVERS.find(c => c.id === "chuck")!;
    S.life = 5e8; S.coverCd = 0; S.cover = "con";
    setCover("chuck");
    expect(S.cover).toBe("con");                      // locked until the case is closed
    expect(panelHTML("cov")).toContain("Close The Fall of Sam Axe");
    const heatBefore = heatMult(), medal = MEDALS.find(m => m.n === "La Barbilla")!;
    S.allies.sam = true;
    const sam0 = heatMult();
    expect(medal.t(S)).toBe(false);
    playIt();
    closeDialog();
    expect(S.arcsDone.samfall).toBe(true);
    expect(S.favors).toBeGreaterThanOrEqual(12);
    expect(medal.t(S)).toBe(true);
    setCover("chuck");
    expect(S.cover).toBe("chuck");
    expect(covers().heat).toBeLessThan(1);
    expect(heatMult()).toBeLessThan(sam0 * 0.95);       // Sam's perk went from -15% to -25%, plus the new cover
    expect(heatBefore).toBeGreaterThan(0);
    expect(panelHTML("crew")).toContain("La Barbilla");
  });

  it("Sam's ability pays 50% more and returns sooner once his story is told", () => {
    S.allies.sam = true; S.gens = { inf: 60, tape: 30 };
    S.cash = 0; S.allyCd = {}; useAbility("sam");
    const plain = S.cash, cdPlain = S.allyCd.sam;
    S.arcsDone.samfall = true; S.cash = 0; S.allyCd = {}; useAbility("sam");
    expect(S.cash).toBeGreaterThan(plain * 1.45);
    expect(S.allyCd.sam).toBeLessThan(cdPlain);
  });

  it("it stays through a Reinstate", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    S.run = 2e8; S.arcsDone.samfall = true; S.samChoices = { 0: 1, 1: 0 };
    prestige();
    expect(S.arcsDone.samfall).toBe(true);
    expect(S.samChoices).toEqual({ 0: 1, 1: 0 });
    vi.restoreAllMocks();
  });
});

describe("Crew events", () => {
  it("events about a crew member only come up once they're on the crew", () => {
    const gated = EVENTS.filter(e => e.needs);
    expect(gated.map(e => e.needs).sort()).toEqual(expect.arrayContaining(["nate", "sam", "barry", "madeline", "fiona", "jesse"]));
    S.allies = {};
    for (let i = 0; i < 400; i++) {
      const ev = EVENTS.filter(e => !e.needs || S.allies[e.needs]);
      expect(ev.every(e => !e.needs)).toBe(true);
    }
  });

  it("every option does something and says what happened", () => {
    S.cash = 1e12; S.allies = { nate: true, sam: true, barry: true, madeline: true, fiona: true, jesse: true };
    S.gens.inf = 20;
    for (const ev of EVENTS) {
      expect(ev.o.length, ev.t).toBeGreaterThanOrEqual(2);
      for (const [label, run] of ev.o) {
        const out = run();
        expect(typeof out, `${ev.t} / ${label}`).toBe("string");
        expect(out.length, `${ev.t} / ${label}`).toBeGreaterThan(15);
        expect(out, `${ev.t} / ${label}`).not.toMatch(/undefined|NaN/);
      }
    }
    expect(Number.isFinite(S.cash)).toBe(true);
  });

  it("hiring the stray informant gives you a Street Informant, not a random operation", () => {
    S.cash = 1e9; S.gens = { inf: 40 };
    const ev = EVENTS.find(e => e.t === "Stray Informant")!;
    const out = ev.o[0][1]();
    expect(out).toMatch(/Street Informant/);
    expect(S.gens.inf).toBe(42);
    expect(Object.keys(S.gens)).toEqual(["inf"]);
  });
});

describe("Automation", () => {
  it("needs the Credibility first, then favors to buy, then it switches freely", () => {
    S.favors = 500; S.cred = 1;
    toggleAuto("clients"); toggleAuto("crew");
    expect(S.auto).toEqual({ clients: false, crew: false });
    expect(S.favors).toBe(500);
    S.cred = 2;
    toggleAuto("clients");
    expect(S.auto.clients).toBe(true);
    expect(S.autoOwned.clients).toBe(true);
    expect(S.favors).toBe(500 - 30);
    toggleAuto("crew");                       // Credibility 3 needed
    expect(S.auto.crew).toBe(false);
    toggleAuto("clients");                    // off, and it costs nothing to switch
    expect(S.auto.clients).toBe(false);
    expect(S.favors).toBe(470);
    toggleAuto("clients");                    // back on, still free
    expect(S.auto.clients).toBe(true);
    expect(S.favors).toBe(470);
    S.cred = 3;
    toggleAuto("crew");
    expect(S.auto.crew).toBe(true);
    expect(S.favors).toBe(470 - 80);
  });

  it("can't be bought without the favors", () => {
    S.cred = 5; S.favors = 10;
    toggleAuto("clients");
    expect(S.autoOwned.clients).toBe(false);
    expect(S.favors).toBe(10);
  });

  it("the cut each use takes shrinks with Credibility, to a floor", () => {
    expect(clientCut(2)).toBeCloseTo(0.20);
    expect(clientCut(10)).toBeLessThan(clientCut(2));
    expect(clientCut(500)).toBeCloseTo(0.08);
    expect(crewCut(3)).toBeCloseTo(0.12);
    expect(crewCut(500)).toBeCloseTo(0.05);
    for (let c = 0; c < 40; c++) expect(clientCut(c + 1)).toBeLessThanOrEqual(clientCut(c));
  });

  it("the Automation card shows prices, cuts, what's locked and what's on", () => {
    S.cred = 2; S.favors = 100;
    let html = panelHTML("auto");
    expect(html).toContain("Buy for 30 favors");
    expect(html).toMatch(/One-time fee: 30 favors\. Then 20%/);
    expect(html).toMatch(/Unlocks at Credibility 3/);
    toggleAuto("clients");
    html = panelHTML("auto");
    expect(html).toMatch(/Auto-take clients[\s\S]*On/);
    expect(html).toContain("Turn off");
    expect(html).not.toMatch(/One-time fee: 30/);
  });

  it("an auto-taken client pays a cut less and doesn't interrupt you", () => {
    S.cred = 2; S.auto.clients = true; S.autoOwned.clients = true; S.cash = 0; S.gens.inf = 50;
    const before = S.stats.returned;
    spawnClient();
    expect(document.getElementById("evt")!.style.display).not.toBe("flex");
    expect(S.cash).toBeGreaterThan(0);
    expect(S.stats.returned).toBeGreaterThan(before);
    expect(document.getElementById("log")!.textContent).toMatch(/without breaking stride/);
  });

  it("with auto-send on, a mission asks the right crew member for help by itself, and they take a cut", () => {
    S.cred = 3; S.auto.crew = true; S.autoOwned.crew = true; S.allies.sam = true;
    S.board = []; fillBoard();
    const m = S.board.find(x => x.ally === "sam") ?? S.board[0];
    S.allies[m.ally] = true;
    startMission(m.uid);
    expect(S.active[0].sent).toBe(m.ally);
    expect(S.active[0].auto).toBe(true);
    const am = S.active[0]; am.chance = 1; am.reward = 10000;
    const before = S.stats.returned + S.cash;
    resolveMission(am);
    const gained = S.stats.returned + S.cash - before;
    expect(gained).toBeCloseTo(10000 * (1 - crewCut(3)), 3);
  });

  it("sending a crew member by hand doesn't cost a cut", () => {
    S.cred = 3; S.allies.sam = true; S.board = []; fillBoard();
    const m = S.board.find(x => x.ally === "sam") ?? S.board[0];
    S.allies[m.ally] = true; m.send = true;
    startMission(m.uid);
    expect(S.active[0].auto).toBe(false);
  });

  it("an old save without automation settings still loads", () => {
    const m = merge({ cash: 5 });
    expect(m.auto).toEqual({ clients: false, crew: false });
  });
});

describe("Fixer variety", () => {
  it("there are plenty of fixers, each with their own action and scene", () => {
    expect(FIXERS.length).toBeGreaterThanOrEqual(25);
    expect(new Set(FIXERS.map(f => f.name)).size).toBe(FIXERS.length);
    expect(new Set(FIXERS.map(f => f.act)).size).toBeGreaterThan(8);
    for (const f of FIXERS) { expect(f.line.length, f.name).toBeGreaterThan(20); expect(f.act.length).toBeGreaterThan(2); }
  });

  it("the same person never turns up twice in a row, or again within a few rolls", () => {
    let prev: string[] = [];
    for (let i = 0; i < 60; i++) {
      const f = rollFixer();
      expect(prev.slice(-5), `roll ${i}`).not.toContain(f.name);
      prev = [...prev, f.name];
    }
  });

  it("the button names the action, and paying off tells that fixer's story", () => {
    S.cash = 1e12; S.att = 60;
    S.fixer = { name: "Walt from customs", act: "Pay off", line: "Walt stamps the right forms and loses the wrong ones.", mult: 1, drop: 40, left: 60 };
    render();
    expect(document.getElementById("bribe")!.textContent).toMatch(/^Pay off Walt from customs/);
    S.fixer = { name: "Ray, the retired agent with a grudge", act: "Buy a drink for", line: "Ray hears you out.", mult: 1, drop: 40, left: 60 };
    render();
    expect(document.getElementById("bribe")!.textContent).toMatch(/^Buy a drink for Ray/);
    payOffFixer();
    expect(document.getElementById("log")!.textContent).toMatch(/Ray hears you out\. The Organization loses interest/);
  });
});

describe("Bosses turn up in the season they debut", () => {
  it("no boss is available before the season they first appear in the show", () => {
    // first appearance season per the show (Wikipedia's list of characters)
    const debut: Record<string, number> = { bly: 1, carla: 2, cowan: 1, paxson: 3, larry: 2, oneill: 3, brennen: 2, strickler: 3, gilroy: 3, barrett: 4, anson: 5, vaughn: 4, card: 6, gray: 6, riley: 6, burke: 7, sonya: 7, kendrick: 7 };
    expect(BOSSES.map(b => b.id).sort()).toEqual(Object.keys(debut).sort());
    for (const b of BOSSES) expect(seasonsOpen(b.at), b.n).toBeGreaterThanOrEqual(debut[b.id]);
  });

  it("the first bosses of a young game are Season 1 and 2 foes, never Paxson", () => {
    S.life = 1e5; S.allies = {};
    for (let i = 0; i < 200; i++) { S.boss = null; spawnBoss(); expect(["bly", "carla"]).toContain(S.boss!.id); }
  });
});

describe("A new Season, a new hold on you", () => {
  it("the Organization's grip starts over at 100% whenever a Season opens, with a word about who's after you", () => {
    S.life = 1e5; S.seasonOpen = 1; S.grip = 20;
    milestones();
    expect(S.seasonOpen).toBe(2);
    expect(S.grip).toBe(100);
    expect(document.getElementById("nM")!.textContent).toMatch(/grip on you starts over: Carla/);
  });

  it("mid-season, wins still wear it down and keep it down", () => {
    S.life = 1e5; S.seasonOpen = 2; S.grip = 60;
    milestones();
    expect(S.grip).toBe(60);
  });

  it("every Season has its own foe line", () => {
    for (let n = 2; n <= 7; n++) expect(SEASON_GRIP[n], `Season ${n}`).toBeTruthy();
  });
});

describe("Rogues unlock with the seasons, in reach of a normal game", () => {
  it("the whole List is reachable: the last Rogue appears well under a trillion", () => {
    expect(Math.max(...BOSSES.map(b => b.at))).toBeLessThan(1e12);
  });

  it("each Season brings its own foes, in order, and no Season is skipped", () => {
    const seasons = BOSSES.map(b => seasonsOpen(b.at));
    expect(seasons).toEqual([...seasons].sort((a, b) => a - b));
    for (let n = 1; n <= 7; n++) expect(seasons, `Season ${n}`).toContain(n);
  });

  it("a locked Rogue says which Season and how much", () => {
    S.life = 1e4;
    const html = panelHTML("rogue");
    expect(html).toMatch(/Season 2 · at \$100K/);
    expect(html).toMatch(/Season 7 · at \$/);
    expect(html).not.toMatch(/Appears at/);
  });
});

describe("Everyone on the List gets their turn", () => {
  const spawnMany = (n: number): string[] => { const out: string[] = []; for (let i = 0; i < n; i++) { S.boss = null; spawnBoss(); out.push(S.boss!.id); } S.boss = null; return out; };

  it("foes you haven't beaten are far likelier than ones you have", () => {
    S.life = 5e8; S.allies = {};
    const open = BOSSES.filter(b => S.life >= b.at && !b.needs); // O'Neill only comes for Fiona
    const beaten = open[0];
    S.bossKills[beaten.id] = 3;
    const ids = spawnMany(1500);
    expect(ids.filter(i => i === beaten.id).length / ids.length).toBeLessThan(1 / open.length);
    for (const b of open) expect(ids, b.id).toContain(b.id);
  });

  it("a ghost turns up like anyone else once the story has passed their time", () => {
    S.life = 5e8; S.allies = {};
    let seen = 0;
    for (let i = 0; i < 60; i++) { S.boss = null; spawnBoss(); if (S.boss!.id === "carla") { expect(bossDef()!.n).toBe("Ghosts From the Past: Carla Baxter"); seen++; } }
    expect(seen).toBeGreaterThan(0);
  });

  it("the weight prefers the current Season, and unbeaten over beaten", () => {
    S.life = 5e8;
    const carla = BOSSES.find(b => b.id === "carla")!, anson = BOSSES.find(b => b.id === "anson")!;
    expect(bossWeight(anson)).toBeGreaterThan(0);
    S.bossKills.carla = 1;
    expect(bossWeight(carla)).toBeLessThan(bossWeight({ ...carla, id: "x" }));
  });
});

describe("Late-story changes to bosses and the ending", () => {
  it("completing the List gives an epilogue pop-up with the crew, and it stays in the Case File", () => {
    for (const b of BOSSES) S.bossKills[b.id] = 1;
    checkEnding();
    const msg = document.getElementById("nM")!.textContent!;
    expect(document.getElementById("nT")!.textContent).toBe("The Burn Is Lifted");
    for (const who of ["Michael", "Fiona", "Sam", "Madeline", "Charlie"]) expect(msg).toContain(who);
    expect(msg).toMatch(/Miami never closes/);
    dismissAllNotices();
    expect(panelHTML("story")).toContain("The Burn Is Lifted");
    expect(panelHTML("story")).toContain("Charlie");
  });

  it("before the burn is lifted there's no epilogue", () => {
    expect(panelHTML("story")).not.toContain("The Burn Is Lifted");
  });
});

describe("Handlers follow the show", () => {
  it("Carla hands out errands only until her death in the Season 2 finale", () => {
    expect(handlerFor(1e5)).toBe("Carla");
    expect(handlerFor(1.4e6)).toBe("Carla");
    expect(handlerFor(2e6)).toBe("Management");
    expect(handlerFor(2e7)).toBe("Management");
    expect(handlerFor(5e7)).toBe("Vaughn");
    expect(handlerFor(2e10)).toBe("Tom Card");
  });
});

describe("Management", () => {
  it("is the top level of Organization attention, from 90%", () => {
    expect(TIERS.map(t => t.name)).toEqual(["Unnoticed", "Watched", "Hunted", "Wanted", "Management"]);
    S.att = 89; expect(tierDef().name).toBe("Wanted");
    S.att = 91; expect(tierDef().name).toBe("Management");
    expect(tierDef().heat).toBeGreaterThan(TIERS[3].heat);
    expect(tierDef().succ).toBeLessThan(TIERS[3].succ);
  });

  it("the helicopter offer is a story choice that comes after Carla's fall and before Season 3", () => {
    const i = STORY.findIndex(b => b.t === "There's the Door");
    expect(i).toBeGreaterThan(STORY.findIndex(b => b.t === "Lesser Evil"));
    expect(STORY[i].choice!.options.length).toBe(2);
    expect(STORY[i].at).toBeLessThan(2e6); // Season 3 opens at 2M
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
  const mult: Record<string, number> = { "": 1, K: 1e3, M: 1e6, B: 1e9, T: 1e12, Qa: 1e15, Qi: 1e18 };
  const costsOf = (html: string) => [...html.matchAll(/class="cost">\$([\d.]+)(K|M|B|T|Qa|Qi)?</g)].map(m => +m[1] * mult[m[2] ?? ""]);

  it("shows the cheapest available upgrades first, with the endless one in its place by price", () => {
    for (const life of [1e7, 1e9, 1e10, 1e11, 1e12, 1e14]) {
      setState(fresh()); S.life = life; S.referrals = 0;
      const html = panelHTML("upg");
      const costs = costsOf(html);
      expect(costs.length, `life ${life}`).toBeGreaterThan(1);
      expect(costs, `life ${life}`).toEqual([...costs].sort((a, b) => a - b));
    }
  });

  it("the endless upgrade really is mixed in, not tacked on the end", () => {
    setState(fresh()); S.life = 1e11;
    const html = panelHTML("upg");
    const at = html.indexOf("Satisfied Clients");
    expect(at).toBeGreaterThan(-1);
    expect(html.indexOf("Satisfied Clients", at) ).toBe(at);
    expect(at).toBeLessThan(html.lastIndexOf('class="cost"'));
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
    const order = ["Seymour Talbot", "Victor Stecker-Epps", "Barry Burkowski</b>", "Hire Sam Axe", "Hire Fiona Glenanne", "Hire Barry Burkowski", "Hire Nate Westen", "Hire Madeline Westen", "Hire Jesse Porter"].map(at);
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

  it("missions built around him can't be started while he's away", () => {
    S.allies.nate = true; S.nateAway = true;
    const m = { uid: 9001, n: "Help Nate", dur: 10, succ: 0.5, heat: 1, rm: 1, fav: 1, ally: "nate", kid: false, send: false };
    S.board = [m];
    expect(panelHTML("mis")).toMatch(/can't start without him/);
    expect(panelHTML("mis")).toMatch(/data-act="start" data-arg="9001" disabled/);
    startMission(9001);
    expect(S.active.length).toBe(0);
    expect(S.board.some(x => x.uid === 9001)).toBe(true);
    S.nateAway = false;
    startMission(9001);
    expect(S.active.length).toBe(1);
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
