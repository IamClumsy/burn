import { describe, expect, it, vi } from "vitest";

vi.mock("../data/photos", () => ({ PHOTOS: { unknown: "/q.webp", sam: "/sam.webp" } }));

import { portrait, portraitScope } from "./portrait";

describe("the ? picture", () => {
  it("is used for anyone you haven't met, and met characters still use their own photo", () => {
    portraitScope("t");
    const hidden = portrait("sam", 40, false);
    expect(hidden).toContain('src="/q.webp"');
    expect(hidden).toContain("Someone you haven't met");
    expect(hidden).not.toContain("/sam.webp");
    expect(portrait("sam", 40, true)).toContain('src="/sam.webp"');
  });
});
