import { describe, expect, it } from "vitest";
import { LOOKS } from "../data/portraits";
import { ALLIES } from "../data/allies";
import { BOSSES } from "../data/bosses";
import { CONTACTS } from "../data/contacts";
import { portrait, portraitSVG, shade, silhouetteSVG } from "./portrait";

describe("character sketches", () => {
  it("every ally, contact and boss has a portrait, and so does Michael", () => {
    const ids = [...ALLIES.map(a => a.id), ...CONTACTS.map(c => c.id), ...BOSSES.map(b => b.id), "michael"];
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

  it("the look matches the character: Sam's shirt, Madeline's cigarette, Seymour's shades", () => {
    expect(LOOKS.sam.outfit).toBe("hawaiian");
    expect(LOOKS.madeline.extras).toContain("cig");
    expect(LOOKS.seymour.glasses).toBe("shades");
    expect(LOOKS.paxson.extras).toContain("badge");
    expect(LOOKS.fiona.outfit).toBe("leather");
    expect(LOOKS.michael.glasses).toBe("shades");
    expect(portraitSVG(LOOKS.madeline)).toContain("#ff8a1f"); // the cigarette's glowing tip
  });

  it("women and men are drawn with the right styling", () => {
    for (const id of ["fiona", "madeline", "carla", "paxson", "riley"]) {
      const l = LOOKS[id];
      expect(["long", "bob", "tied", "short", "ponytail"], id).toContain(l.hair);
    }
  });

  it("silhouettes hide the face of someone you haven't met", () => {
    const s = silhouetteSVG("Unknown");
    expect(s).toContain("?");
    expect(s).not.toContain("#ecc4a0"); // no skin tone
  });

  it("portrait() sizes the sketch, caches it, and falls back to a silhouette", () => {
    const a = portrait("sam", 64);
    expect(a).toContain("width:64px");
    expect(a).toContain("Sketch of sam");
    expect(portrait("sam", 64)).toBe(a);
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
