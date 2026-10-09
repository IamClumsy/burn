import { describe, expect, it, vi } from "vitest";

// These tests are about the drawn sketches, whatever photos happen to be in the assets folder.
vi.mock("../data/photos", () => ({ PHOTOS: {} }));
import { LOOKS } from "../data/portraits";
import { ALLIES } from "../data/allies";
import { BOSSES } from "../data/bosses";
import { CONTACTS } from "../data/contacts";
import { portrait, portraitScope, portraitSVG, shade, silhouetteSVG } from "./portrait";

describe("character sketches", () => {
  it("every ally, contact and boss has a portrait, and so does Michael", () => {
    const ids = [...ALLIES.map(a => a.id), ...CONTACTS.map(c => c.id), ...BOSSES.map(b => b.id), "michael", "victor", "pearce", "natelv", "veracruz"];
    for (const id of ids) expect(LOOKS[id], id).toBeTruthy();
    expect(Object.keys(LOOKS).sort()).toEqual([...new Set(ids)].sort());
  });

  it("every portrait is a well-formed SVG", () => {
    for (const [id, look] of Object.entries(LOOKS)) {
      const svg = portraitSVG(look, id);
      expect(svg.startsWith("<svg"), id).toBe(true);
      expect(svg.trim().endsWith("</svg>"), id).toBe(true);
      expect(svg).toContain('viewBox="0 0 100 100"');
      expect(svg).toContain(`aria-label="${id}"`);
      expect(svg).not.toMatch(/undefined|NaN/);
      expect((svg.match(/<svg/g) || []).length, id).toBe(1);
    }
  });

  it("no two characters look alike", () => {
    const sigs = Object.values(LOOKS).map(l => JSON.stringify(l));
    expect(new Set(sigs).size).toBe(sigs.length);
    const svgs = Object.values(LOOKS).map(l => portraitSVG(l));
    expect(new Set(svgs).size).toBe(svgs.length);
  });

  it("the look matches the character, as seen on screen", () => {
    expect(LOOKS.sam.outfit).toBe("hawaiian");
    expect(LOOKS.sam.extras).toContain("chain");
    expect(LOOKS.sam.facial).toBe("goatee");
    expect(LOOKS.barry.glasses).toBe("aviator");
    expect(LOOKS.barry.facial).toBe("goatee");
    expect(LOOKS.seymour.facial).toBe("beard");
    expect(LOOKS.seymour.hair).toBe("wild");
    expect(LOOKS.madeline.extras).toContain("hoops");
    expect(LOOKS.madeline.hair).toBe("curly");
    expect(LOOKS.paxson.extras).toContain("badge");
    expect(LOOKS.fiona.hair).toBe("long");
    expect(LOOKS.vaughn.hair).toBe("bald");
    expect(LOOKS.vaughn.glasses).toBe("shades");
    expect(LOOKS.strickler.stripes).toBeTruthy();
    expect(LOOKS.jesse.hair).toBe("buzz");
    expect(LOOKS.anson.tint).toBeTruthy();
    expect(LOOKS.cowan.facial).toBe("beard");
  });

  it("older characters look older", () => {
    for (const id of ["cowan", "larry", "barrett", "card", "madeline", "anson"]) expect(LOOKS[id].age, id).toBe(2);
    for (const id of ["michael", "nate", "jesse"]) expect(LOOKS[id].age ?? 0, id).toBe(0);
    expect(portraitSVG(LOOKS.cowan)).not.toBe(portraitSVG({ ...LOOKS.cowan, age: 0 }));
  });

  it("the new drawing features all draw something", () => {
    const base = { ...LOOKS.michael };
    const plain = portraitSVG(base);
    for (const change of [
      { jaw: "narrow" as const }, { jaw: "round" as const }, { glasses: "aviator" as const }, { glasses: "round" as const },
      { facial: "beard" as const }, { stripes: "#ffffff", outfit: "shirt" as const }, { outfit: "vest" as const },
      { extras: ["hoops" as const] }, { extras: ["earring" as const] }, { extras: ["chain" as const] }, { hair: "swept" as const },
    ]) {
      expect(portraitSVG({ ...base, ...change }), JSON.stringify(change)).not.toBe(plain);
    }
  });

  it("every portrait's gradient and clip ids are unique, so sketches never clash on one page", () => {
    const ids = Object.values(LOOKS).flatMap(l => [...portraitSVG(l).matchAll(/id="((?:bg|sh|body)-[a-z0-9]+)"/g)].map(m => m[1]));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("women are drawn with hair that suits them", () => {
    for (const id of ["fiona", "madeline", "carla", "paxson", "riley"]) {
      expect(["long", "bob", "tied", "short", "ponytail", "curly"], id).toContain(LOOKS[id].hair);
    }
  });

  it("silhouettes hide the face of someone you haven't met", () => {
    const s = silhouetteSVG("Unknown");
    expect(s).toContain("?");
    expect(s).not.toContain("#ecc4a0"); // no skin tone
  });

  it("the same face shown twice on one page never shares ids, but re-rendering a panel is stable", () => {
    portraitScope("rogue");
    const html = portrait("brennen", 56) + portrait("brennen", 56);
    portraitScope("list");
    const other = portrait("brennen", 56);
    const ids = [...(html + other).matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
    expect(ids.length).toBeGreaterThan(10);
    expect(new Set(ids).size).toBe(ids.length);
    // every reference points at an id that exists
    for (const m of (html + other).matchAll(/url\(#([^)]+)\)/g)) expect(ids, m[1]).toContain(m[1]);
    portraitScope("rogue");
    expect(portrait("brennen", 56) + portrait("brennen", 56)).toBe(html);
  });

  it("portrait() sizes the sketch, caches it, and falls back to a silhouette", () => {
    portraitScope("t");
    const a = portrait("sam", 64);
    expect(a).toContain("width:64px");
    expect(a).toContain("Sketch of sam");
    portraitScope("t");
    expect(portrait("sam", 64)).toBe(a); // the same place on the page gives the same markup
    expect(portrait("sam", 30, false)).toContain("Someone you haven't met");
    expect(portrait("sam", 30, false)).not.toContain("Sketch of sam");
    expect(portrait("nobody-here")).toContain("Unknown");
  });

  it("shade() darkens and lightens a color", () => {
    expect(shade("#808080", -0.5)).toBe("#404040");
    expect(shade("#000000", 0.5)).toBe("#808080");
    expect(shade("#ffffff", -1)).toBe("#000000");
  });
});
