import { describe, expect, it } from "vitest";
import { GENS } from "./ops";
import { UPGS } from "./upgrades";
import { ALLIES } from "./allies";
import { MISSIONS } from "./missions";
import { BOSSES } from "./bosses";
import { COVERS } from "./covers";
import { STORY } from "./story";
import { MEDALS } from "./medals";
import { RECIPES, JUNK, PERKS } from "./perks";
import { EVENTS } from "./events";
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

  it("every event offers at least two choices", () => {
    for (const e of EVENTS) expect(e.o.length, e.t).toBeGreaterThanOrEqual(2);
  });
});
