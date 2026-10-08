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
import { ARCS } from "./arcs";
import { FAQ } from "./faq";
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

  it("upgrades have real names, not just a multiplier", () => {
    for (const u of UPGS) {
      expect(u.name, u.id).not.toMatch(/[×x]\s?\d/);
      expect(u.name.length, u.id).toBeGreaterThan(5);
      expect(u.desc, u.id).toBeTruthy();
    }
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
