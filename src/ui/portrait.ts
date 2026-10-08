import { LOOKS } from "../data/portraits";
import { PHOTOS } from "../data/photos";

/**
 * Character portraits: original stylized illustrations drawn as SVG from a set of traits.
 * They're drawn from how each character looks on screen (hair, build, clothes, manner) with shaded faces,
 * layered hair and fabric folds. They aren't photographs, and nothing is traced from anyone's face.
 */
export type Hair =
  | "bald" | "receding" | "buzz" | "short" | "slick" | "swept" | "tousled" | "curly" | "wild"
  | "bob" | "long" | "ponytail" | "tied";
export type Outfit = "suit" | "hawaiian" | "leather" | "blazer" | "cardigan" | "tactical" | "shirt" | "coat" | "vest" | "polo";
export type Mood = "calm" | "stern" | "warm" | "sly" | "worried";
export type FacialHair = "none" | "stubble" | "mustache" | "goatee" | "beard";
export type Glasses = "none" | "round" | "square" | "shades" | "aviator";
export type Jaw = "round" | "square" | "narrow";
export type Extra = "cig" | "scar" | "badge" | "earpiece" | "lipstick" | "hoops" | "earring" | "chain" | "lashes";

export interface Look {
  skin: string;
  hair: Hair;
  hairColor: string;
  /** Face width, 0.9 slim to 1.1 broad. */
  face?: number;
  jaw?: Jaw;
  /** 0 young, 1 weathered, 2 old: adds lines to the face. */
  age?: 0 | 1 | 2;
  facial?: FacialHair;
  /** Beard color, when it isn't the same as the hair (for example a gray beard on dark hair). */
  facialColor?: string;
  glasses?: Glasses;
  /** Lens color for tinted glasses. */
  tint?: string;
  /** Iris color. Brown if not given. */
  eyeColor?: string;
  outfit: Outfit;
  outfitColor: string;
  accent: string;
  /** Stripe color for striped shirts. */
  stripes?: string;
  bg: [string, string];
  mood: Mood;
  extras?: Extra[];
}

const INK = "#12051c";

function toRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const hex2 = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");

/** Darken (negative) or lighten (positive) a #rrggbb color. */
export function shade(hex: string, amt: number): string {
  const [r, g, b] = toRgb(hex);
  const f = (c: number) => (amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  return "#" + [r, g, b].map(c => hex2(f(c))).join("");
}

/** Blend two colors: t=0 is `a`, t=1 is `b`. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = toRgb(a), [br, bg, bb] = toRgb(b);
  return "#" + [ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t].map(hex2).join("");
}

/** A short stable id for a look, so inline SVGs on the same page never share gradient or clip ids. */
function uid(l: Look): string {
  let h = 5381;
  const s = JSON.stringify(l);
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

// Eyebrow endpoints [x1,y1,x2,y2] for left and right, by mood.
const BROWS: Record<Mood, [number[], number[]]> = {
  calm:    [[36.5, 36.6, 47, 36.4], [53, 36.4, 63.5, 36.6]],
  stern:   [[36.5, 34.8, 47, 38.2], [53, 38.2, 63.5, 34.8]],
  warm:    [[36.5, 36.6, 47, 35.2], [53, 35.2, 63.5, 36.6]],
  sly:     [[36.5, 36.8, 47, 37.6], [53, 33.6, 63.5, 35]],
  worried: [[36.5, 38.2, 47, 34.6], [53, 34.6, 63.5, 38.2]],
};

/** The head's outline: a full oval, a square jaw that still tapers to the chin, or a narrow pointed chin. */
function headPath(rx: number, jaw: Jaw): string {
  const L = 50 - rx, R = 50 + rx;
  if (jaw === "square") return `M${L + 0.8} 40 Q${L - 0.2} 21 50 20.5 Q${R + 0.2} 21 ${R - 0.8} 40 Q${R + 0.6} 51 ${R - 2.2} 59 Q${R - 4} 66 ${R - 11} 68.2 Q50 70.4 ${L + 11} 68.2 Q${L + 4} 66 ${L + 2.2} 59 Q${L - 0.6} 51 ${L + 0.8} 40 Z`;
  if (jaw === "narrow") return `M${L + 0.8} 41 Q${L - 0.2} 21 50 20.5 Q${R + 0.2} 21 ${R - 0.8} 41 Q${R + 0.2} 51 ${R - 3} 59 Q${R - 8} 67 50 71.5 Q${L + 8} 67 ${L + 3} 59 Q${L - 0.2} 51 ${L + 0.8} 41 Z`;
  return `M${L + 0.6} 41 Q${L - 0.4} 21 50 20.5 Q${R + 0.4} 21 ${R - 0.6} 41 Q${R + 1.2} 53 ${R - 3.6} 61 Q${R - 8} 68.6 50 70.2 Q${L + 8} 68.6 ${L + 3.6} 61 Q${L - 1.2} 53 ${L + 0.6} 41 Z`;
}

const BODY = "M4 100 Q5 80 20 74.5 Q34 71 40.5 66 L59.5 66 Q66 71 80 74.5 Q95 80 96 100 Z";

/** A tapered, arched eyebrow, thicker in the middle and fine at the ends. */
function brow(x1: number, y1: number, x2: number, y2: number, t: number): string {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return `M${x1} ${y1} Q${mx} ${my - t * 1.5} ${x2} ${y2} Q${mx} ${my - t * 0.1} ${x1} ${y1}Z`;
}

/** An eyebrow built from individual hairs over a soft base, so it reads as hair rather than a painted bar. */
function browHair(b: number[], t: number, color: string, edge: string): string {
  const [x1, y1, x2, y2] = b, mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - t * 0.75;
  const at = (u: number): [number, number] => [(1 - u) * (1 - u) * x1 + 2 * (1 - u) * u * mx + u * u * x2, (1 - u) * (1 - u) * y1 + 2 * (1 - u) * u * my + u * u * y2];
  const dir = x2 > x1 ? 1 : -1;
  let hairs = "";
  for (let i = 0; i < 11; i++) {
    const u = i / 10, [x, y] = at(u), [nx, ny] = at(Math.min(1, u + 0.12));
    const j = ((i * 5) % 7) / 7 - 0.5, len = 1.6 + t * 0.4;
    hairs += `M${(x - dir * 0.3).toFixed(2)} ${(y + 0.5 + j * t * 0.8).toFixed(2)} L${(nx + dir * len * 0.3).toFixed(2)} ${(ny - 0.9 + j * 0.4).toFixed(2)} `;
  }
  return `<path d="${brow(x1, y1, x2, y2, t)}" fill="${color}" opacity=".62"/><path d="${hairs}" stroke="${edge}" stroke-opacity=".5" stroke-width=".45" stroke-linecap="round" fill="none"/><path d="${hairs}" stroke="${color}" stroke-width=".4" stroke-linecap="round" fill="none" transform="translate(0 -.2)"/>`;
}

// ---------------------------------------------------------------- hair

function hairBack(l: Look, edge: string): string {
  const c = l.hairColor, dark = shade(c, -0.25);
  const st = `stroke="${edge}" stroke-opacity=".5" stroke-width="1" stroke-linejoin="round"`;
  switch (l.hair) {
    case "bob": return `<path d="M27 40 Q27 14 50 14 Q73 14 73 40 L73 64 Q70 70 64 66 L36 66 Q30 70 27 64 Z" fill="${c}" ${st}/><path d="M27 52 L27 64 Q30 70 36 66 L34 54Z M73 52 L73 64 Q70 70 64 66 L66 54Z" fill="${dark}" opacity=".5"/>`;
    case "long": return `<path d="M26 40 Q26 12 50 12 Q74 12 74 40 L79 78 Q60 70 50 72 Q40 70 21 78 Z" fill="${c}" ${st}/><path d="M26 50 L22 77 Q32 72 38 72 L32 52Z M74 50 L78 77 Q68 72 62 72 L68 52Z" fill="${dark}" opacity=".45"/><path d="M30 46 Q27 62 25 74 M70 46 Q73 62 75 74" stroke="${shade(c, 0.3)}" stroke-opacity=".5" stroke-width="1" fill="none"/>`;
    case "ponytail": return `<ellipse cx="75" cy="42" rx="6" ry="15" fill="${c}" ${st}/>`;
    case "tied": return `<circle cx="50" cy="13" r="8" fill="${c}" ${st}/><path d="M45 11 Q50 8 55 11" stroke="${shade(c, 0.3)}" stroke-opacity=".5" stroke-width="1" fill="none"/>`;
    case "wild": return `<circle cx="28" cy="32" r="12" fill="${c}"/><circle cx="72" cy="32" r="12" fill="${c}"/><circle cx="50" cy="18" r="14" fill="${c}"/><circle cx="24" cy="48" r="10" fill="${c}"/><circle cx="76" cy="48" r="10" fill="${c}"/><circle cx="30" cy="62" r="8" fill="${c}"/><circle cx="70" cy="62" r="8" fill="${c}"/>` +
      `<g fill="none" stroke="${dark}" stroke-opacity=".55" stroke-width="1.2" stroke-linecap="round"><path d="M22 28 Q26 24 30 28 M70 28 Q74 24 78 28 M44 14 Q50 10 56 14 M18 46 Q22 42 26 46 M74 46 Q78 42 82 46 M26 62 Q30 58 34 62 M66 62 Q70 58 74 62"/></g>` +
      `<g fill="none" stroke="${shade(c, 0.3)}" stroke-opacity=".45" stroke-width="1" stroke-linecap="round"><path d="M24 26 Q28 22 32 26 M68 26 Q72 22 76 26 M46 12 Q52 9 58 13"/></g>`;
    default: return "";
  }
}

function hairFront(l: Look, edge: string): string {
  const c = l.hairColor, dark = shade(c, -0.28), light = shade(c, 0.32);
  const st = `stroke="${edge}" stroke-width=".8" stroke-opacity=".32" stroke-linejoin="round"`;
  /** Fine strands that follow the shape: dark ones for depth, light ones for the sheen. */
  const strands = (dk: string[], lt: string[]) =>
    `<g fill="none" stroke-linecap="round"><path d="${dk.join(" ")}" stroke="${dark}" stroke-opacity=".5" stroke-width="1"/><path d="${lt.join(" ")}" stroke="${light}" stroke-opacity=".55" stroke-width="1.1"/></g>`;
  // long hair falls in two curtains from a center part, instead of a single band across the forehead
  const fringe = `<path d="M50 20.5 Q31 20 29.5 44 Q33 33 46 29.5 Q49.5 27 50 20.5Z" fill="${c}" ${st}/><path d="M50 20.5 Q69 20 70.5 44 Q67 33 54 29.5 Q50.5 27 50 20.5Z" fill="${c}" ${st}/>`;
  switch (l.hair) {
    case "bald": return `<ellipse cx="44" cy="25.5" rx="7" ry="3.2" fill="#fff" opacity=".26"/><ellipse cx="44" cy="25" rx="3" ry="1.2" fill="#fff" opacity=".3"/>`;
    case "receding": return `<path d="M30 44 Q28 30 36 25 Q33 34 34.5 44Z" fill="${c}" ${st}/><path d="M70 44 Q72 30 64 25 Q67 34 65.5 44Z" fill="${c}" ${st}/><ellipse cx="46" cy="25" rx="7" ry="3" fill="#fff" opacity=".24"/>`;
    case "buzz": return `<path d="M30 42 Q30 20 50 20 Q70 20 70 42 Q66 30 50 28 Q34 30 30 42Z" fill="${c}" ${st}/>` + strands(["M34 30 Q38 24 46 22", "M54 22 Q64 24 67 32"], ["M38 25 Q47 21 56 22"]);
    case "short": return `<path d="M29 44 Q27 18 50 17 Q73 18 71 44 Q68 30 58 28 Q42 34 32 32 Q30 36 29 44Z" fill="${c}" ${st}/>` + strands(["M31 38 Q31 26 40 21", "M60 24 Q69 28 70 38", "M44 30 Q52 26 60 27"], ["M36 25 Q46 19 58 21", "M44 22 Q54 20 64 25"]);
    case "slick": return `<path d="M29 42 Q28 17 50 16 Q72 17 71 42 Q64 26 50 25 Q36 26 29 42Z" fill="${c}" ${st}/>` + strands(["M31 38 Q31 24 42 19", "M60 21 Q69 26 70 38"], ["M36 24 Q50 17 66 24", "M40 21 Q52 17 62 21", "M34 29 Q50 22 68 30"]);
    case "swept": return `<path d="M27 46 L29 54 L32 46 Z" fill="${c}"/><path d="M73 46 L71 54 L68 46 Z" fill="${c}"/><path d="M28 44 Q24 17 50 15 Q77 17 72 44 Q71 32 62 27 Q48 23 36 33 Q30 38 28 44Z" fill="${c}" ${st}/>` + strands(["M30 40 Q28 24 40 18", "M62 22 Q72 28 71 40", "M38 32 Q48 26 60 28"], ["M34 24 Q48 16 66 24", "M38 29 Q50 22 66 27", "M42 21 Q54 16 66 20"]);
    case "tousled": return `<path d="M29 44 Q26 20 40 16 L42 21 L47 14 L52 20 L58 14 L60 21 Q74 22 71 44 Q68 30 58 29 Q44 33 32 31 Q30 36 29 44Z" fill="${c}" ${st}/>` + strands(["M31 38 Q29 26 38 19", "M60 24 Q70 28 70 38", "M44 28 Q52 25 60 27"], ["M37 21 L45 17", "M50 19 L56 16", "M62 23 Q68 24 70 30"]);
    case "curly": return ["34,28", "42,22", "50,20", "58,22", "66,28", "30,38", "70,38", "38,32", "62,32"].map(p => { const [x, y] = p.split(","); return `<circle cx="${x}" cy="${y}" r="8" fill="${c}" ${st}/>`; }).join("") +
      `<g fill="none" stroke="${dark}" stroke-opacity=".5" stroke-width="1" stroke-linecap="round"><path d="M30 26 Q34 22 38 26 M46 18 Q50 15 54 18 M60 26 Q64 22 68 26 M26 38 Q30 34 34 38 M66 38 Q70 34 74 38"/></g>` +
      `<g fill="none" stroke="${light}" stroke-opacity=".6" stroke-width="1.1" stroke-linecap="round"><path d="M36 22 Q40 19 44 22 M54 22 Q58 19 62 22 M40 29 Q44 26 48 29"/></g>`;
    case "wild": return `<path d="M29 40 Q32 20 50 20 Q68 20 71 40 Q64 28 50 28 Q36 28 29 40Z" fill="${c}" ${st}/>` + strands(["M33 32 Q36 24 44 21", "M58 22 Q66 26 69 34"], ["M36 24 Q50 17 64 24", "M42 21 Q54 18 62 22"]);
    case "bob": case "long": return fringe + strands(["M32 38 Q35 28 45 25", "M55 25 Q65 28 68 38"], ["M33 32 Q38 25 47 23", "M53 23 Q62 25 67 32"]);
    case "ponytail": return `<path d="M29 44 Q27 18 50 17 Q73 18 71 44 Q68 30 58 28 Q42 34 32 32 Q30 36 29 44Z" fill="${c}" ${st}/>` + strands(["M31 38 Q31 26 40 21"], ["M36 25 Q46 19 58 21"]);
    case "tied": return `<path d="M30 42 Q30 20 50 20 Q70 20 70 42 Q64 28 50 27 Q36 28 30 42Z" fill="${c}" ${st}/>` + strands(["M33 36 Q34 26 44 22", "M58 23 Q66 26 68 34"], ["M38 23 Q50 18 62 23", "M36 28 Q50 22 66 28"]);
  }
}

// ---------------------------------------------------------------- clothes

function outfitSVG(l: Look, id: string): string {
  return softenLines(outfitRaw(l, id));
}

/** Thick cartoon outlines become fine, translucent edges. */
function softenLines(svg: string): string {
  return svg.replace(/stroke-width="(1\.[2-9]|2\.2)"/g, 'stroke-opacity=".5" stroke-width="1"');
}

function outfitRaw(l: Look, id: string): string {
  const o = l.outfitColor, a = l.accent, skinShade = shade(l.skin, -0.14);
  const edge = shade(o, -0.62);
  const body = `<path d="${BODY}" fill="url(#cloth-${id})" stroke="${edge}" stroke-width="1.8" stroke-linejoin="round"/>`;
  // soft folds and a shadow where the collar meets the neck
  const folds = `<path d="M18 92 Q22 84 28 78 M82 92 Q78 84 72 78 M44 98 Q42 88 44 80 M56 98 Q58 88 56 80" stroke="${edge}" stroke-opacity=".28" stroke-width="1.2" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="70.5" rx="14" ry="4.5" fill="${INK}" opacity=".22"/>`;
  const stripes = l.stripes
    ? `<g clip-path="url(#body-${id})" stroke="${l.stripes}" stroke-width="2" opacity=".55">${Array.from({ length: 14 }, (_, i) => `<path d="M${10 + i * 6.4} 66 L${10 + i * 6.4} 100"/>`).join("")}</g>`
    : "";
  switch (l.outfit) {
    case "suit":
      return body + folds + `<path d="M40 68 L50 86 L60 68Z" fill="#f4eef8" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/><path d="M48 73 L52 73 L53 91 L50 96 L47 91Z" fill="${a}" stroke="${shade(a, -0.6)}" stroke-width="1.4" stroke-linejoin="round"/><path d="M34 68 L44 90 M66 68 L56 90" stroke="${edge}" stroke-width="1.8" fill="none"/>`;
    case "hawaiian":
      return body + `<path d="M40 67 L50 86 L60 67Z" fill="${skinShade}" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/>` +
        [[18, 82], [26, 92], [74, 84], [82, 94], [64, 96], [36, 96], [12, 96], [88, 84], [22, 74], [78, 74]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.8" transform="rotate(${i * 37} ${x} ${y})" fill="${a}" opacity=".85"/>`).join("") +
        folds + `<path d="M34 67 L42 80 M66 67 L58 80" stroke="${edge}" stroke-width="1.8" fill="none"/>`;
    case "leather":
      return body + folds + `<path d="M40 67 L50 82 L60 67Z" fill="${a}" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/><path d="M50 82 L50 100" stroke="${edge}" stroke-width="1.8"/><path d="M36 68 L44 80 L36 84 M64 68 L56 80 L64 84" stroke="${edge}" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M20 86 Q26 80 32 84 M80 86 Q74 80 68 84" stroke="#fff" stroke-opacity=".12" stroke-width="2" fill="none"/>`;
    case "blazer":
      return body + folds + `<path d="M38 67 L50 90 L62 67Z" fill="${a}" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/><path d="M33 68 L45 94 M67 68 L55 94" stroke="${edge}" stroke-width="1.8" fill="none"/>`;
    case "cardigan":
      return body + folds + `<path d="M40 67 L50 84 L60 67Z" fill="${a}" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/><path d="M50 84 L50 100" stroke="${edge}" stroke-width="1.8"/>` +
        [88, 94].map(y => `<circle cx="47" cy="${y}" r="1.5" fill="${edge}"/>`).join("");
    case "tactical":
      return body + `<path d="M26 72 L34 100 M74 72 L66 100 M40 80 L60 80 M40 90 L60 90" stroke="${edge}" stroke-width="2.2" fill="none"/><rect x="42" y="82" width="7" height="6" rx="1" fill="${a}" stroke="${edge}" stroke-width="1.3"/><rect x="52" y="82" width="7" height="6" rx="1" fill="${a}" stroke="${edge}" stroke-width="1.3"/>`;
    case "shirt":
      return body + stripes + folds + `<path d="M38 67 L47 80 L50 70 L53 80 L62 67Z" fill="${shade(o, 0.35)}" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/><path d="M50 80 L50 100" stroke="${edge}" stroke-width="1.5"/><circle cx="50" cy="88" r="1.2" fill="${edge}"/>`;
    case "polo":
      return body + folds + `<path d="M40 67 L50 80 L60 67Z" fill="${skinShade}" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/><path d="M36 67 L47 71 L49 82 L40 74Z M64 67 L53 71 L51 82 L60 74Z" fill="${shade(o, 0.2)}" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="50" cy="84" r="1.2" fill="${edge}"/><circle cx="50" cy="90" r="1.2" fill="${edge}"/>`;
    case "vest":
      return `<path d="${BODY}" fill="${a}" stroke="${edge}" stroke-width="1.8" stroke-linejoin="round"/><path d="M38 67 L47 80 L50 70 L53 80 L62 67Z" fill="${shade(a, 0.3)}" stroke="${edge}" stroke-width="1.4" stroke-linejoin="round"/><path d="M30 68 L44 76 L43 100 L12 100 Q14 78 30 68Z M70 68 L56 76 L57 100 L88 100 Q86 78 70 68Z" fill="${o}" stroke="${edge}" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="50" cy="70.5" rx="14" ry="4.5" fill="${INK}" opacity=".2"/>`;
    case "coat":
      return body + folds + `<path d="M34 67 L50 94 L66 67" fill="${shade(o, 0.12)}" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/><path d="M42 67 L50 78 L58 67" fill="${a}" stroke="${edge}" stroke-width="1.4" stroke-linejoin="round"/>`;
  }
}

// ---------------------------------------------------------------- face details

function glassesSVG(l: Look): string {
  const gl = l.glasses ?? "none";
  const lens = l.tint ? `fill="${l.tint}" fill-opacity=".62"` : `fill="#fff" fill-opacity=".1"`;
  const frame = `stroke="#1c1426" stroke-width="1.8"`;
  const glare = `<path d="M38 40 L42 39 M56 40 L60 39" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"/>`;
  if (gl === "shades") return `<path d="M33.5 38.5 L66.5 38.5 L64.5 47 Q58 49.5 55 46 L52 41 L48 41 L45 46 Q42 49.5 35.5 47Z" fill="#0b0610" ${frame} stroke-linejoin="round"/><path d="M36 40 L44 39.5 M56 39.5 L64 40" stroke="#fff" stroke-opacity=".4" stroke-width="1.4" stroke-linecap="round"/>`;
  if (gl === "aviator") return `<path d="M35 38 L49 38 Q49.5 47 42 49.8 Q35 48.4 35 38Z M51 38 L65 38 Q65 48.4 58 49.8 Q50.5 47 51 38Z" fill="#171020" fill-opacity=".9" ${frame} stroke-linejoin="round"/><path d="M49 39.5 L51 39.5 M35 39 L31 39.4 M65 39 L69 39.4" ${frame} fill="none"/>${glare}<path d="M38 46 Q42 48 46 45 M54 45 Q58 48 62 46" stroke="#fff" stroke-opacity=".12" stroke-width="1" fill="none"/>`;
  if (gl === "round") return `<circle cx="43" cy="42" r="7" ${lens} ${frame}/><circle cx="57" cy="42" r="7" ${lens} ${frame}/><path d="M36 41 L31 40 M64 41 L69 40" ${frame}/>${glare}`;
  if (gl === "square") return `<rect x="35" y="37" width="14" height="10" rx="2.4" ${lens} ${frame}/><rect x="51" y="37" width="14" height="10" rx="2.4" ${lens} ${frame}/><path d="M49 41 L51 41 M35 40 L31 39 M65 40 L69 39" ${frame}/>${glare}`;
  return "";
}

function facialSVG(l: Look, id: string): string {
  const raw = facialRaw(l, id);
  return raw ? `<g filter="url(#hair-${id})">${raw.replace(/stroke-width="1\.[25]"/g, 'stroke-opacity=".3" stroke-width=".7"')}</g>` : "";
}

function facialRaw(l: Look, id: string): string {
  const fc = l.facialColor ?? l.hairColor, edge = shade(fc, -0.6);
  switch (l.facial ?? "none") {
    case "stubble": return `<path d="M33 49 Q35 66 50 68 Q65 66 67 49 Q64 58 50 60 Q36 58 33 49Z" fill="url(#stub-${id})" opacity=".85"/><path d="M42 54.5 Q50 51.5 58 54.5 Q54 56.5 50 55.6 Q46 56.5 42 54.5Z" fill="${fc}" opacity=".3"/>`;
    case "mustache": return `<path d="M41 55 Q45 51.4 50 53.4 Q55 51.4 59 55 Q55 60 50 57.4 Q45 60 41 55Z" fill="${fc}" stroke="${edge}" stroke-width="1.2" stroke-linejoin="round"/><path d="M44 54.6 Q47 53.4 49 54.4 M51 54.4 Q53 53.4 56 54.6" stroke="${shade(fc, 0.3)}" stroke-opacity=".5" stroke-width=".8" fill="none"/>`;
    case "goatee": return `<path d="M33 49 Q35 64 50 66 Q65 64 67 49 Q64 58 50 60 Q36 58 33 49Z" fill="url(#stub-${id})" opacity=".55"/><path d="M45 61 Q50 72.5 55 61 Q50 64 45 61Z" fill="${fc}" stroke="${edge}" stroke-width="1.2" stroke-linejoin="round"/><path d="M41 55 Q45 51.6 50 53.6 Q55 51.6 59 55 Q55 59 50 57.4 Q45 59 41 55Z" fill="${fc}" stroke="${edge}" stroke-width="1" stroke-linejoin="round"/>`;
    case "beard": return `<path d="M31 47 Q31 71 50 73.5 Q69 71 69 47 Q64 62 50 63 Q36 62 31 47Z" fill="${fc}" stroke="${edge}" stroke-width="1.5" stroke-linejoin="round"/><path d="M33 52 Q36 66 46 70 M67 52 Q64 66 54 70 M44 64 Q50 68 56 64" stroke="${shade(fc, 0.3)}" stroke-opacity=".45" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M41 55 Q45 51.6 50 53.6 Q55 51.6 59 55 Q55 59.6 50 57.4 Q45 59.6 41 55Z" fill="${fc}" stroke="${edge}" stroke-width="1.1" stroke-linejoin="round"/>`;
    default: return "";
  }
}

/** Lines that show a lived-in face. */
function ageSVG(age: number, line: string): string {
  if (!age) return "";
  let d = "M41 29 Q50 27 59 29 M43 54 Q41 58 43 62 M57 54 Q59 58 57 62";
  if (age >= 2) d += " M43 25.5 Q50 24 57 25.5 M33 42 L36 41 M33 45 L36 45 M67 42 L64 41 M67 45 L64 45 M38 46.5 Q43 48.5 47 46.5 M53 46.5 Q57 48.5 62 46.5";
  return `<path d="${d}" stroke="${line}" stroke-opacity=".32" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
}

function mouthSVG(l: Look): string {
  return mouthRaw(l).replace(/stroke-width="1\.2"/g, 'stroke-opacity=".7" stroke-width=".9"');
}

function mouthRaw(l: Look): string {
  const skinDark = shade(l.skin, -0.62);
  const lip = (l.extras ?? []).includes("lipstick");
  const lips = lip ? "#c4264f" : mix(l.skin, "#a8484f", 0.5);
  const lipLow = lip ? "#d83a62" : mix(l.skin, "#b8555c", 0.42);
  const line = lip ? "#7c1030" : skinDark;
  switch (l.mood) {
    case "warm":
      return `<path d="M43.2 57.4 Q50 63.6 56.8 57.4 Q50 59.6 43.2 57.4Z" fill="#f7f1e8" stroke="${line}" stroke-width="1" stroke-linejoin="round"/><path d="M43 57.2 Q47 56 50 57 Q53 56 57 57.2 Q50 59.4 43 57.2Z" fill="${lips}"/><path d="M44.4 59.6 Q50 63.8 55.6 59.6 Q50 62 44.4 59.6Z" fill="${lipLow}"/><path d="M42.4 56.6 Q43 57.6 43.4 57.4 M57.6 56.6 Q57 57.6 56.6 57.4" stroke="${line}" stroke-width="1" fill="none" stroke-linecap="round"/>`;
    case "stern":
      return `<path d="M43.6 59 Q47 58 50 58.6 Q53 58 56.4 59 Q53 60 50 59.8 Q47 60 43.6 59Z" fill="${lips}"/><path d="M44.6 59.8 Q50 62.2 55.4 59.8 Q50 61 44.6 59.8Z" fill="${lipLow}"/><path d="M43.4 59 Q50 60.6 56.6 59 M43 59.6 L42.4 60.8 M57 59.6 L57.6 60.8" stroke="${line}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    case "sly":
      return `<path d="M43.6 59.6 Q47 58.6 50 59 Q53 58.2 57.4 57 Q54 60.4 50 60.4 Q46.5 60.6 43.6 59.6Z" fill="${lips}"/><path d="M45 60.4 Q50 63 55 59.8 Q50 61.4 45 60.4Z" fill="${lipLow}"/><path d="M43.4 59.6 Q50 61.2 57.6 57 M57.6 57 Q58.6 56.2 58.8 55.6" stroke="${line}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    case "worried":
      return `<path d="M44 60.6 Q47 58.6 50 59.2 Q53 58.6 56 60.6 Q53 59.8 50 60 Q47 59.8 44 60.6Z" fill="${lips}"/><path d="M45 61.2 Q50 63.2 55 61.2 Q50 62 45 61.2Z" fill="${lipLow}"/><path d="M43.6 60.8 Q50 57.6 56.4 60.8" stroke="${line}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    default:
      return `<path d="M43.4 58.6 Q47 57 50 58 Q53 57 56.6 58.6 Q53 59.8 50 59.6 Q47 59.8 43.4 58.6Z" fill="${lips}"/><path d="M44.6 59.6 Q50 63 55.4 59.6 Q50 61.2 44.6 59.6Z" fill="${lipLow}"/><path d="M43.4 58.6 Q50 60.4 56.6 58.6" stroke="${line}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  }
}

function extrasSVG(l: Look, rx: number): string {
  const ex = l.extras ?? [];
  const earL = 50 - rx, earR = 50 + rx;
  return (ex.includes("scar") ? `<path d="M61 44 L65 52" stroke="#fff" stroke-opacity=".5" stroke-width="1.4" stroke-linecap="round"/><path d="M61.5 46.5 L64 46 M63 49.5 L65.5 49" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>` : "") +
    (ex.includes("cig") ? `<path d="M57 59 L72 55" stroke="#f4eef8" stroke-width="2.4" stroke-linecap="round"/><path d="M72 55 L74 54.5" stroke="#ff8a1f" stroke-width="2.4" stroke-linecap="round"/><path d="M76 52 Q80 48 77 44 Q75 40 79 37" stroke="#fff" stroke-opacity=".45" stroke-width="1.4" fill="none"/>` : "") +
    (ex.includes("badge") ? `<path d="M64 76 L72 76 L72 84 L68 88 L64 84Z" fill="#ffd166" stroke="#8a6a1a" stroke-width="1.3" stroke-linejoin="round"/><circle cx="68" cy="81" r="1.6" fill="#c89a2a"/>` : "") +
    (ex.includes("earpiece") ? `<circle cx="${earL + 1.5}" cy="47" r="2.2" fill="#0b0610" stroke="${INK}" stroke-width="1"/><path d="M${earL + 1.5} 49 Q${earL - 2} 60 ${earL + 6} 70" stroke="#0b0610" stroke-width="1.4" fill="none"/>` : "") +
    (ex.includes("hoops") ? `<circle cx="${earL}" cy="54" r="5.5" fill="none" stroke="#dfe3ee" stroke-width="2"/><circle cx="${earR}" cy="54" r="5.5" fill="none" stroke="#dfe3ee" stroke-width="2"/><path d="M${earL - 4} 52 A5.5 5.5 0 0 0 ${earL - 2} 58 M${earR + 4} 52 A5.5 5.5 0 0 1 ${earR + 2} 58" stroke="#8a90a0" stroke-width=".8" fill="none"/>` : "") +
    (ex.includes("earring") ? `<circle cx="${earL}" cy="51" r="1.9" fill="#ffd166" stroke="#8a6a1a" stroke-width="1"/>` : "") +
    (ex.includes("chain") ? `<path d="M41 69 Q50 80 59 69" stroke="#ffd166" stroke-width="1.8" fill="none"/><circle cx="50" cy="78.5" r="1.8" fill="#ffd166" stroke="#8a6a1a" stroke-width=".8"/>` : "");
}

// ---------------------------------------------------------------- the portrait

/** Build the portrait's SVG markup (no size set; the wrapper sizes it). */
export function portraitSVG(l: Look, label = "Character portrait"): string {
  const rx = 19 * (l.face ?? 1);
  const jaw = l.jaw ?? "round";
  const id = uid(l);
  const head = headPath(rx, jaw);
  const skin = l.skin;
  const skinShade = shade(skin, -0.16);
  const skinLine = shade(skin, -0.62);
  const skinDeep = shade(skin, -0.42);
  const hairEdge = shade(l.hairColor, -0.66);
  const [lb, rb] = BROWS[l.mood];
  const hc = l.hairColor === "#f4eef8" ? "#9a8fa8" : l.hairColor;
  const age = l.age ?? 0;
  const bt = 1.1 + age * 0.22;
  const lids = l.mood === "sly" || l.mood === "stern";
  const ex = l.extras ?? [];
  const lashes = ex.includes("lashes");
  const iris = l.eyeColor ?? "#5a3d2b";
  const noEyes = l.glasses === "shades" || l.glasses === "aviator";
  const top = lids ? 39.6 : 38.7, bot = lids ? 44.6 : 45.4;
  const eyeL = `M38.6 42.4 Q43 ${top} 47.4 42.2 Q43 ${bot} 38.6 42.4Z`;
  const eyeR = `M52.6 42.2 Q57 ${top} 61.4 42.4 Q57 ${bot} 52.6 42.2Z`;
  const L = 50 - rx, R = 50 + rx;

  // eyes: shaded whites, a ringed iris with a pupil and two catchlights, a lid crease and a soft shadow under the lid
  const eye = (cx: number, clip: string, d: string) =>
    `<path d="${d}" fill="url(#sc-${id})"/>` +
    `<g clip-path="url(#${clip}-${id})"><circle cx="${cx}" cy="42.2" r="2.9" fill="url(#ir-${id})"/><circle cx="${cx}" cy="42.2" r="2.9" fill="none" stroke="${shade(iris, -0.6)}" stroke-width=".7" opacity=".8"/><circle cx="${cx}" cy="42.2" r="1.15" fill="${INK}"/><circle cx="${cx + 0.9}" cy="41.3" r=".75" fill="#fff" opacity=".95"/><circle cx="${cx - 0.9}" cy="43.2" r=".35" fill="#fff" opacity=".5"/><path d="M${cx - 6} 39.6 H${cx + 6} V41.7 H${cx - 6}Z" fill="${INK}" opacity=".24"/></g>`;
  const eyes = noEyes ? "" :
    eye(43.4, "eL", eyeL) + eye(57.4, "eR", eyeR) +
    `<path d="M38.2 42.5 Q43 ${top - 0.6} 47.8 42.3 M52.2 42.3 Q57 ${top - 0.6} 61.8 42.5" stroke="${lashes ? INK : shade(skin, -0.7)}" stroke-width="${lashes ? 1.9 : 1.25}" fill="none" stroke-linecap="round"/>` +
    `<path d="M37.2 40.6 Q43 ${top - 2.6} 48.6 40.4 M51.4 40.4 Q57 ${top - 2.6} 62.8 40.6" stroke="${skinLine}" stroke-opacity=".38" stroke-width=".8" fill="none" stroke-linecap="round"/>` +
    (lashes ? `<path d="M38.4 42.2 L36.8 40.8 M61.6 42.2 L63.2 40.8" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>` : "") +
    `<path d="M39.8 43.9 Q43 45.4 46.4 43.9 M53.6 43.9 Q57 45.4 60.2 43.9" stroke="${skinLine}" stroke-opacity=".3" stroke-width=".8" fill="none" stroke-linecap="round"/>`;

  // light comes from the upper left: the far side of the face falls into shadow
  const shadows =
    `<ellipse cx="${R + 1}" cy="46" rx="9" ry="27" fill="${INK}" opacity=".3"/>` +
    `<ellipse cx="${L - 1}" cy="48" rx="4" ry="22" fill="${INK}" opacity=".1"/>` +
    `<ellipse cx="50" cy="71" rx="${rx * 0.9}" ry="7" fill="${INK}" opacity=".26"/>` +
    `<ellipse cx="50" cy="26" rx="${rx * 0.95}" ry="5.5" fill="${INK}" opacity=".2"/>` +
    `<ellipse cx="43" cy="41.4" rx="6.8" ry="3.8" fill="${skinDeep}" opacity=".3"/><ellipse cx="57" cy="41.4" rx="6.8" ry="3.8" fill="${skinDeep}" opacity=".34"/>` +
    `<path d="M51.2 42 Q54.2 48 54 52.4 Q56 52.6 57.6 51.6 Q55.4 45.6 52.6 41Z" fill="${skinDeep}" opacity=".28"/>` +
    `<ellipse cx="50" cy="54.6" rx="4.2" ry="1.5" fill="${skinDeep}" opacity=".34"/>` +
    `<ellipse cx="50" cy="63.6" rx="5.2" ry="1.7" fill="${skinDeep}" opacity=".28"/>` +
    `<ellipse cx="${L + 5}" cy="56" rx="3.5" ry="9" fill="${skinDeep}" opacity=".16"/><ellipse cx="${R - 5}" cy="56" rx="3.5" ry="9" fill="${skinDeep}" opacity=".24"/>`;
  const lights =
    `<ellipse cx="44" cy="29.5" rx="11" ry="4.6" fill="#fff" opacity=".2"/>` +
    `<ellipse cx="38.6" cy="49.6" rx="5.6" ry="3.2" fill="#fff" opacity=".15"/><ellipse cx="61.4" cy="49.6" rx="5" ry="3" fill="#fff" opacity=".07"/>` +
    `<ellipse cx="48.8" cy="44.6" rx="1.4" ry="6.4" fill="#fff" opacity=".2"/>` +
    `<ellipse cx="49.6" cy="51.2" rx="2.4" ry="1.5" fill="#fff" opacity=".3"/>` +
    `<ellipse cx="49" cy="64.8" rx="5" ry="2.2" fill="#fff" opacity=".12"/>` +
    `<ellipse cx="41.5" cy="53" rx="5" ry="3.2" fill="#ff7a7a" opacity=".12"/><ellipse cx="58.5" cy="53" rx="5" ry="3.2" fill="#ff7a7a" opacity=".1"/>`;

  return `<svg viewBox="0 0 100 100" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${l.bg[0]}"/><stop offset="1" stop-color="${l.bg[1]}"/></linearGradient>
<radialGradient id="glow-${id}" cx=".5" cy=".38" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="vig-${id}" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
<radialGradient id="sk-${id}" cx=".4" cy=".34" r=".8"><stop offset="0" stop-color="${shade(skin, 0.1)}"/><stop offset=".6" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin, -0.12)}"/></radialGradient>
<radialGradient id="sc-${id}" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#fbf8f3"/><stop offset=".7" stop-color="#eee6de"/><stop offset="1" stop-color="#cfc4bb"/></radialGradient>
<radialGradient id="ir-${id}" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="${shade(iris, 0.4)}"/><stop offset=".55" stop-color="${iris}"/><stop offset="1" stop-color="${shade(iris, -0.5)}"/></radialGradient>
<linearGradient id="cloth-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(l.outfitColor, 0.14)}"/><stop offset="1" stop-color="${shade(l.outfitColor, -0.26)}"/></linearGradient>
<linearGradient id="neck-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(skin, -0.42)}"/><stop offset=".5" stop-color="${skinShade}"/><stop offset="1" stop-color="${shade(skin, -0.1)}"/></linearGradient>
<pattern id="stub-${id}" width="1.7" height="1.7" patternUnits="userSpaceOnUse"><circle cx=".5" cy=".5" r=".32" fill="${l.facialColor ?? l.hairColor}"/><circle cx="1.3" cy="1.3" r=".3" fill="${l.facialColor ?? l.hairColor}"/></pattern>
<clipPath id="body-${id}"><path d="${BODY}"/></clipPath>
<clipPath id="head-${id}"><path d="${head}"/></clipPath>
<clipPath id="frame-${id}"><rect width="100" height="100" rx="14"/></clipPath>
<clipPath id="eL-${id}"><path d="${eyeL}"/></clipPath><clipPath id="eR-${id}"><path d="${eyeR}"/></clipPath>
<filter id="b3-${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="b2-${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="b1-${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".9"/></filter>
<filter id="pore-${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .25  0 0 0 0 .12  0 0 0 0 .08  0 0 0 1.1 -.42"/></filter>
<filter id="grain-${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 -.18"/></filter>
<filter id="weave-${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".55 .9" numOctaves="2" seed="2"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 -.45"/></filter>
<filter id="hair-${id}" x="-5%" y="-5%" width="110%" height="110%">
<feTurbulence type="fractalNoise" baseFrequency=".8 .07" numOctaves="2" seed="7" result="t"/>
<feColorMatrix in="t" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.25" result="dk"/>
<feComposite in="dk" in2="SourceAlpha" operator="in" result="d"/>
<feColorMatrix in="t" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.2 -1.35" result="lt"/>
<feComposite in="lt" in2="SourceAlpha" operator="in" result="h"/>
<feComponentTransfer in="d" result="d2"><feFuncA type="linear" slope=".45"/></feComponentTransfer>
<feComponentTransfer in="h" result="h2"><feFuncA type="linear" slope=".2"/></feComponentTransfer>
<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="d2"/><feMergeNode in="h2"/></feMerge>
</filter>
</defs>
<rect width="100" height="100" rx="14" fill="url(#bg-${id})"/>
<ellipse cx="50" cy="42" rx="40" ry="42" fill="url(#glow-${id})"/>
<g filter="url(#b3-${id})" fill="#fff"><circle cx="14" cy="20" r="9" opacity=".16"/><circle cx="88" cy="28" r="7" opacity=".13"/><circle cx="84" cy="10" r="4" opacity=".16"/><circle cx="10" cy="62" r="6" opacity=".1"/></g>
<g filter="url(#hair-${id})">${hairBack(l, hairEdge)}</g>
<path d="M42 58 L58 58 L58 72 Q50 76 42 72Z" fill="url(#neck-${id})" stroke="${skinLine}" stroke-opacity=".4" stroke-width="1" stroke-linejoin="round"/>
${outfitSVG(l, id)}
<g clip-path="url(#body-${id})"><rect width="100" height="100" fill="#000" filter="url(#weave-${id})" opacity=".1"/><g filter="url(#b3-${id})"><ellipse cx="82" cy="86" rx="16" ry="22" fill="${INK}" opacity=".3"/><ellipse cx="50" cy="71" rx="13" ry="5" fill="${INK}" opacity=".35"/></g></g>
<ellipse cx="${L + 0.4}" cy="47.5" rx="3.1" ry="5" fill="${skin}" stroke="${skinLine}" stroke-opacity=".4" stroke-width="1"/><ellipse cx="${R - 0.4}" cy="47.5" rx="3.1" ry="5" fill="${skin}" stroke="${skinLine}" stroke-opacity=".4" stroke-width="1"/>
<ellipse cx="${R - 0.4}" cy="47.5" rx="3.1" ry="5" fill="${INK}" opacity=".22"/><ellipse cx="${L + 0.4}" cy="47.5" rx="3.1" ry="5" fill="${shade(skin, -0.2)}" opacity=".25"/>
<path d="M${L - 0.9} 45.2 Q${L + 1.3} 44.4 ${L + 1.4} 47.4 Q${L + 1.3} 50 ${L - 0.2} 51 M${R + 0.9} 45.2 Q${R - 1.3} 44.4 ${R - 1.4} 47.4 Q${R - 1.3} 50 ${R + 0.2} 51" stroke="${skinLine}" stroke-opacity=".5" stroke-width=".8" fill="none" stroke-linecap="round"/>
<path d="${head}" fill="url(#sk-${id})" stroke="${skinLine}" stroke-opacity=".42" stroke-width="1" stroke-linejoin="round"/>
<g clip-path="url(#head-${id})">
<g filter="url(#b2-${id})">${shadows}</g>
<g filter="url(#b1-${id})">${lights}</g>
<rect width="100" height="100" fill="#000" filter="url(#pore-${id})" opacity=".22"/>
</g>
<path d="M45.6 52.8 Q47.6 55.2 50 53.9 Q52.4 55.2 54.4 52.8" stroke="${skinLine}" stroke-opacity=".55" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M46.2 51.4 Q44.8 53.6 47 54.7 M53.8 51.4 Q55.2 53.6 53 54.7 M47.7 41.5 Q47 47 46.4 50.6" stroke="${skinLine}" stroke-opacity=".28" stroke-width=".8" fill="none" stroke-linecap="round"/><ellipse cx="47.6" cy="53.3" rx="1.2" ry=".7" fill="${INK}" opacity=".3"/><ellipse cx="52.4" cy="53.3" rx="1.2" ry=".7" fill="${INK}" opacity=".3"/>
${ageSVG(age, skinLine)}
${facialSVG(l, id)}
<g filter="url(#hair-${id})">${hairFront(l, hairEdge)}</g>
${browHair(lb, bt, hc, hairEdge)}${browHair(rb, bt, hc, hairEdge)}
${eyes}${glassesSVG(l)}
${mouthSVG(l)}<ellipse cx="50" cy="56.7" rx="3" ry=".9" fill="${INK}" opacity=".1"/><ellipse cx="50.4" cy="60.9" rx="2.6" ry=".7" fill="#fff" opacity=".2"/>
${extrasSVG(l, rx)}
<g clip-path="url(#frame-${id})"><rect width="100" height="100" fill="url(#vig-${id})"/><rect width="100" height="100" fill="#000" filter="url(#grain-${id})" opacity=".16"/></g>
</svg>`;
}

/** A faceless stand-in for someone you haven't met yet. */
export function silhouetteSVG(label = "Unknown"): string {
  return `<svg viewBox="0 0 100 100" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">
<rect width="100" height="100" rx="14" fill="#241833"/>
<path d="M8 100 Q10 72 34 67 L66 67 Q90 72 92 100Z" fill="#150c20" stroke="#3f2a57" stroke-width="2"/>
<rect x="42" y="58" width="16" height="14" rx="4" fill="#150c20" stroke="#3f2a57" stroke-width="2"/>
<ellipse cx="50" cy="44" rx="19" ry="23" fill="#150c20" stroke="#3f2a57" stroke-width="2"/>
<text x="50" y="52" text-anchor="middle" font-size="26" font-weight="700" fill="#3f2a57" font-family="sans-serif">?</text>
</svg>`;
}

// ---- ready-made portraits for the game's characters ----
const cache = new Map<string, { svg: string; base: string }>();

/**
 * Gradient and clip ids have to be unique on the whole page: if two copies of the same face share ids and
 * the first one is hidden (a closed card, say), the browser can't resolve them and the face turns dark.
 * So every portrait gets ids that depend on where it is: a name for the panel it's in, plus its position
 * within it. The same panel always produces the same ids, so re-rendering doesn't churn the page.
 */
let scope = "x", slot = 0;
export function portraitScope(name: string): void { scope = name; slot = 0; }

/** An inline portrait for a character id, or a silhouette if we don't have one. `known: false` hides the face. */
export function portrait(id: string, px = 56, known = true, label?: string): string {
  const key = `${id}:${known}`;
  let entry = cache.get(key);
  if (!entry) {
    const look = LOOKS[id];
    const svg = known && look ? portraitSVG(look, label || `Sketch of ${id}`) : silhouetteSVG(known ? "Unknown" : "Someone you haven't met");
    entry = { svg, base: known && look ? uid(look) : "" };
    cache.set(key, entry);
  }
  const photo = known ? PHOTOS[id] : undefined;
  if (photo) return `<span class="portrait photo" style="width:${px}px;height:${px}px"><img src="${photo}" alt="${label || `Sketch of ${id}`}" width="${px}" height="${px}" loading="lazy" decoding="async"></span>`;
  const suffix = `${scope}${slot++}`;
  const svg = entry.base ? entry.svg.replace(new RegExp(`-${entry.base}(?=["')])`, "g"), `-${entry.base}${suffix}`) : entry.svg;
  return `<span class="portrait" style="width:${px}px;height:${px}px">${svg}</span>`;
}
