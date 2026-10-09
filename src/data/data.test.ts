import { describe, expect, it } from "vitest";
import { GENS } from "./ops";
import { UPGS } from "./upgrades";
import { ALLIES } from "./allies";
import { MISSIONS, SEASON_UNLOCK, epLabel, missionUnlocked, seasonOf } from "./missions";
import { BOSSES } from "./bosses";
import { COVERS } from "./covers";
import { STORY } from "./story";
import { MEDALS } from "./medals";
import { RECIPES, JUNK, PERKS } from "./perks";
import { EVENTS } from "./events";
import { OP_TIERS, REFERRAL } from "./upgrades";
import { ARCS } from "./arcs";
import { FAQ } from "./faq";
import { EP_NOTES, outcomeLine } from "./episodeNotes";
import { ABILITIES } from "../game/abilities";

const unique = (a: string[]) => new Set(a).size === a.length;

describe("data integrity", () => {
  it("has unique ids", () => {
    expect(unique(GENS.map(g => g.id))).toBe(true);
    expect(unique(UPGS.map(u => u.id))).toBe(true);
    expect(unique(ALLIES.map(a => a.id))).toBe(true);
    expect(unique(BOSSES.map(b => b.id))).toBe(true);
    expect(unique(COVERS.map(c => c.id))).toBe(true);
    expect(unique(MEDALS.map(m => m.id))).toBe(true);
    expect(unique(PERKS.map(p => p.id))).toBe(true);
    expect(unique(MISSIONS.map(m => m.n))).toBe(true);
  });

  it("there is exactly one mission for every episode of the show", () => {
    const perSeason: Record<number, number> = {};
    for (const m of MISSIONS) perSeason[seasonOf(m.ep!)] = (perSeason[seasonOf(m.ep!)] || 0) + 1;
    // 12 + 16 + 16 + 18 + 18 + 18 + 13 = 111 episodes
    expect(perSeason).toEqual({ 1: 12, 2: 16, 3: 16, 4: 18, 5: 18, 6: 18, 7: 13 });
    expect(MISSIONS.length).toBe(111);
    expect(unique(MISSIONS.map(m => m.ep!))).toBe(true);
    for (const m of MISSIONS) expect(m.epTitle, m.ep).toBeTruthy();
  });

  it("every episode has notes: a spy tip, and at least one person to name", () => {
    for (const m of MISSIONS) {
      const n = EP_NOTES[m.ep!];
      expect(n, m.ep).toBeTruthy();
      expect(n.tip.length, m.ep).toBeGreaterThan(25);
      expect(n.tip.length, m.ep).toBeLessThan(140);
    }
    expect(Object.keys(EP_NOTES).sort()).toEqual(MISSIONS.map(m => m.ep!).sort());
    expect(unique(Object.values(EP_NOTES).map(n => n.tip))).toBe(true);
  });

  it("Harlan, who bailed Michael out of jail, is in the Season 3 premiere", () => {
    const n = EP_NOTES["301"];
    expect(n.client).toBe("Marta");
    expect(n.friend?.name).toBe("Harlan");
    expect(n.friend?.role).toBe("Bailed you out of jail");
    expect(n.friend?.win).toContain("Harlan");
  });

  it("dozens of episodes name a friend who helps, each with a name and a role", () => {
    const withFriend = Object.entries(EP_NOTES).filter(([, n]) => n.friend);
    expect(withFriend.length).toBeGreaterThanOrEqual(30);
    for (const [ep, n] of withFriend) {
      expect(n.friend!.name.length, ep).toBeGreaterThan(2);
      expect(n.friend!.role.length, ep).toBeGreaterThan(8);
      expect(n.friend!.role.length, ep).toBeLessThan(60);
    }
  });

  it("friends who are also on the crew only turn up once they've joined the show", () => {
    for (const [ep, n] of Object.entries(EP_NOTES)) {
      const crew = ALLIES.find(a => n.friend && a.name.split(" ")[0] === n.friend.name);
      if (crew?.debutEp) expect(+ep, `${crew.name} in ${ep}`).toBeGreaterThanOrEqual(+crew.debutEp);
    }
  });

  it("the helpers match the episodes they belong to", () => {
    expect(EP_NOTES["101"].friend?.name).toBe("Barry");
    expect(EP_NOTES["207"].friend?.name).toBe("Seymour");
    expect(EP_NOTES["307"].friend?.name).toBe("Diego Garza");
    expect(EP_NOTES["501"].friend?.name).toBe("Max");
    expect(EP_NOTES["603"].friend?.name).toBe("Ayn");
    expect(EP_NOTES["711"].friend?.name).toBe("Strong");
  });

  it("the stolen-ledger case is credited to the thief who took it", () => {
    expect(EP_NOTES["308"].client).toBe("Barry");
    expect(EP_NOTES["308"].villain).toBe("Natalie Rice");
  });

  it("outcome narration names the people involved", () => {
    const first = <T,>(a: readonly T[]) => a[0];
    const both = { client: "Javier", villain: "Graham Pyne", tip: "x" };
    expect(outcomeLine(both, true, first)).toContain("Javier");
    expect(outcomeLine(both, true, first)).toContain("Graham Pyne");
    expect(outcomeLine(both, false, first)).toContain("Graham Pyne");
    expect(outcomeLine({ client: "Cara", tip: "x" }, true, first)).toContain("Cara");
    expect(outcomeLine({ villain: "Simon", tip: "x" }, false, first)).toContain("Simon");
    expect(outcomeLine({ tip: "x" }, true, first)).toBeNull();
    expect(outcomeLine(undefined, true, first)).toBeNull();
    const harlan = { client: "Marta", villain: "Rufino Cortez", friend: { name: "Harlan", role: "Bailed you out of jail", win: "Harlan gets his favor, and you're square." }, tip: "x" };
    const lines = [0, 1, 2, 3].map(i => outcomeLine(harlan, true, a => a[i]));
    expect(lines).toContain("Harlan gets his favor, and you're square.");
    // a friend with no line of their own gets a plain thank-you
    const plain = { client: "Jimmy", friend: { name: "Max", role: "Your handler" }, tip: "x" };
    expect([0, 1, 2].map(i => outcomeLine(plain, true, a => a[i]))).toContain("Max is glad you came through.");
    // a friend alone still gets a line, and nothing on a loss
    expect(outcomeLine({ friend: { name: "Max", role: "Your handler" }, tip: "x" }, true, a => a[0])).toBe("Max is glad you came through.");
    expect(outcomeLine({ friend: { name: "Max", role: "Your handler" }, tip: "x" }, false, a => a[0])).toBeNull();
  });

  it("episode credits read naturally", () => {
    expect(epLabel("203", "Trust Me")).toBe("Season 2, Episode 3: Trust Me");
    expect(epLabel("713", "Reckoning")).toBe("Season 7, Episode 13: Reckoning");
  });

  it("seasons unlock in order, and season 1 is open from the start", () => {
    expect(SEASON_UNLOCK.length).toBe(7);
    expect(SEASON_UNLOCK[0]).toBe(0);
    for (let i = 1; i < SEASON_UNLOCK.length; i++) expect(SEASON_UNLOCK[i]).toBeGreaterThan(SEASON_UNLOCK[i - 1]);
    const first = MISSIONS.filter(m => missionUnlocked(m, 0));
    expect(first.length).toBe(12);
    expect(first.every(m => seasonOf(m.ep!) === 1)).toBe(true);
  });

  it("Michael only does good: no mission is framed as helping the wrong people", () => {
    for (const m of MISSIONS) {
      expect(m.n, m.n).not.toMatch(/launder|frame a|dirty|steal from|rob a/i);
    }
  });

  it("harder episodes pay more, and kid cases are never the long shots", () => {
    const avg = (season: number) => {
      const ms = MISSIONS.filter(m => seasonOf(m.ep!) === season);
      return ms.reduce((a, m) => a + m.rm, 0) / ms.length;
    };
    expect(avg(7)).toBeGreaterThan(avg(1));
    expect(avg(4)).toBeGreaterThan(avg(2));
  });

  it("upgrades have real names, not just a multiplier", () => {
    for (const u of UPGS) {
      expect(u.name, u.id).not.toMatch(/[×x]\s?\d/);
      expect(u.name.length, u.id).toBeGreaterThan(5);
      expect(u.desc, u.id).toBeTruthy();
    }
  });

  it("you never ask someone for help finding or rescuing themselves", () => {
    const names: Record<string, string> = { sam: "Sam", fiona: "Fiona", nate: "Nate", jesse: "Jesse", barry: "Barry", madeline: "Madeline" };
    const bad = (text: string, ally: string) => new RegExp(`(find|finding|looking for|locate|track down|search for)\\b[^,]*\\b${names[ally]}\\b`, "i").test(text);
    for (const m of MISSIONS) expect(bad(m.n, m.ally), m.n).toBe(false);
    for (const a of ARCS) for (const st of a.steps) expect(bad(st.n, a.ally), `${a.title}: ${st.n}`).toBe(false);
  });

  it("every mission names a real ally", () => {
    const ids = new Set(ALLIES.map(a => a.id));
    for (const m of MISSIONS) expect(ids.has(m.ally), m.n).toBe(true);
  });

  it("kid missions are guaranteed; everything else can fail", () => {
    for (const m of MISSIONS) {
      if (m.kid) expect(m.succ, m.n).toBe(1);
      else expect(m.succ, m.n).toBeLessThan(1);
    }
    expect(MISSIONS.filter(m => m.kid).length).toBeGreaterThanOrEqual(5);
  });

  it("every operation has six tiers of upgrades that unlock as you own more of it", () => {
    expect(OP_TIERS.length).toBe(6);
    for (const g of GENS) {
      const tiers = UPGS.filter(u => u.needs?.gen === g.id).sort((a, b) => a.needs!.owned - b.needs!.owned);
      expect(tiers.length, g.id).toBe(6);
      expect(tiers.map(t => t.needs!.owned), g.id).toEqual(OP_TIERS.map(t => t.owned));
      for (let i = 1; i < tiers.length; i++) expect(tiers[i].cost, g.id).toBeGreaterThan(tiers[i - 1].cost);
      for (const t of tiers) { expect(t.g).toBe(g.id); expect(t.kind).toBe("gen"); expect(t.m).toBeGreaterThanOrEqual(2); }
    }
    expect(UPGS.length).toBeGreaterThanOrEqual(60);
    expect(unique(UPGS.map(u => u.id))).toBe(true);
    expect(unique(UPGS.map(u => u.name))).toBe(true);
  });

  it("the endless upgrade is real: it has a price that rises and a gain that compounds", () => {
    expect(REFERRAL.gain).toBeGreaterThan(1);
    expect(REFERRAL.growth).toBeGreaterThan(REFERRAL.gain); // it gets steadily dearer, so it's a sink and not a trivial loop
  });

  it("upgrades are listed in order of cost", () => {
    const costs = UPGS.map(u => u.cost);
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
  });

  it("the crew is listed in order of cost", () => {
    const costs = ALLIES.map(a => a.cost);
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
    expect(ALLIES.map(a => a.id)).toEqual(["sam", "fiona", "barry", "nate", "madeline", "jesse"]);
  });

  it("no ally appears in an episode before they joined the show", () => {
    const withDebut = ALLIES.filter(a => a.debutEp);
    expect(withDebut.map(a => a.id)).toContain("jesse");
    for (const a of withDebut) {
      for (const m of MISSIONS.filter(x => x.ally === a.id)) {
        expect(+m.ep!, `${a.name} in ${m.n}`).toBeGreaterThanOrEqual(+a.debutEp!);
      }
      for (const arc of ARCS.filter(x => x.ally === a.id)) {
        expect(arc.at, `${a.name} in ${arc.title}`).toBeGreaterThanOrEqual(SEASON_UNLOCK[a.debut! - 1]);
      }
    }
  });

  it("Jesse debuts in Season 4, Episode 2", () => {
    const jesse = ALLIES.find(a => a.id === "jesse")!;
    expect(jesse.debut).toBe(4);
    expect(jesse.debutEp).toBe("402");
    expect(MISSIONS.filter(m => m.ally === "jesse").length).toBeGreaterThanOrEqual(10);
  });

  it("Madeline costs more than Barry, who helps from the start", () => {
    const cost = (id: string) => ALLIES.find(a => a.id === id)!.cost;
    expect(cost("madeline")).toBeGreaterThan(cost("barry"));
  });

  it("Madeline only gets missions with kids or older folks", () => {
    const hers = MISSIONS.filter(m => m.ally === "madeline");
    expect(hers.length).toBeGreaterThanOrEqual(8);
    for (const m of hers) expect(m.kid || m.elder, m.n).toBeTruthy();
    for (const a of ARCS) expect(a.ally, a.id).not.toBe("madeline");
    expect(MISSIONS.filter(m => m.elder).length).toBeGreaterThanOrEqual(3);
  });

  it("women on the crew are flagged so game text uses the right pronouns", () => {
    const she = ALLIES.filter(a => a.she).map(a => a.id).sort();
    expect(she).toEqual(["fiona", "madeline"]);
  });

  it("every ally has an ability implementation", () => {
    for (const a of ALLIES) expect(typeof ABILITIES[a.id], a.id).toBe("function");
  });

  it("upgrades reference real operations", () => {
    const gens = new Set(GENS.map(g => g.id));
    for (const u of UPGS) if (u.kind === "gen") expect(gens.has(u.g!), u.id).toBe(true);
  });

  it("recipes only use known junk", () => {
    for (const r of RECIPES) for (const k of Object.keys(r.need)) expect(JUNK[k], r.id).toBeTruthy();
  });

  it("story and bosses unlock in ascending order", () => {
    for (let i = 1; i < STORY.length; i++) expect(STORY[i].at).toBeGreaterThan(STORY[i - 1].at);
    for (let i = 1; i < GENS.length; i++) expect(GENS[i].base).toBeGreaterThan(GENS[i - 1].base);
  });

  it("the FAQ is complete and mentions the live numbers", () => {
    const items = FAQ.flatMap(s => s.items);
    expect(items.length).toBeGreaterThanOrEqual(20);
    expect(unique(items.map(i => i.q))).toBe(true);
    for (const it of items) expect(it.a().length, it.q).toBeGreaterThan(40);
    const all = items.map(i => i.a()).join(" ");
    expect(all).toContain("$100M");       // Reinstate threshold, pulled from the code
    expect(all).toContain("Wanted");      // attention stages
    expect(all).toContain("at 75%");     // grip perks
  });

  it("every boss has a character file", () => {
    for (const b of BOSSES) expect(b.file.length, b.id).toBeGreaterThan(80);
  });

  it("story choices are real decisions with two options each", () => {
    const withChoice = STORY.filter(b => b.choice);
    expect(withChoice.length).toBeGreaterThanOrEqual(3);
    for (const b of withChoice) {
      expect(b.choice!.options.length, b.t).toBe(2);
      for (const o of b.choice!.options) expect(Object.keys(o.fx).length, o.label).toBeGreaterThan(0);
    }
  });

  it("case arcs are well formed", () => {
    const allies = new Set(ALLIES.map(a => a.id));
    expect(unique(ARCS.map(a => a.id))).toBe(true);
    for (const a of ARCS) {
      expect(allies.has(a.ally), a.id).toBe(true);
      expect(a.steps.length, a.id).toBeGreaterThanOrEqual(3);
      for (const st of a.steps) expect(st.succ, a.id).toBeLessThan(1);
    }
  });

  it("every event offers at least two choices", () => {
    for (const e of EVENTS) expect(e.o.length, e.t).toBeGreaterThanOrEqual(2);
  });
});
