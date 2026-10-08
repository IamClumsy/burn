import { LOOKS } from "../data/portraits";

/**
 * Character sketches: original stylized portraits drawn as SVG from a handful of traits.
 * They're illustrations drawn from how each character looks on screen (hair, build, clothes, manner),
 * in one bold style. They aren't photographs, and nothing is traced from anyone's face.
 */
export type Hair =
  | "bald" | "receding" | "buzz" | "short" | "slick" | "swept" | "tousled" | "curly" | "wild"
  | "bob" | "long" | "ponytail" | "tied";
export type Outfit = "suit" | "hawaiian" | "leather" | "blazer" | "cardigan" | "tactical" | "shirt" | "coat" | "vest" | "polo";
export type Mood = "calm" | "stern" | "warm" | "sly" | "worried";
export type FacialHair = "none" | "stubble" | "mustache" | "goatee" | "beard";
export type Glasses = "none" | "round" | "square" | "shades" | "aviator";
export type Jaw = "round" | "square" | "narrow";
export type Extra = "cig" | "scar" | "badge" | "earpiece" | "lipstick" | "hoops" | "earring" | "chain";

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

/** Darken (negative) or lighten (positive) a #rrggbb color. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
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
  calm:    [[37, 36, 46, 36], [54, 36, 63, 36]],
  stern:   [[37, 34, 46, 38], [54, 38, 63, 34]],
  warm:    [[37, 36, 46, 34.5], [54, 34.5, 63, 36]],
  sly:     [[37, 36, 46, 37], [54, 33, 63, 34.5]],
  worried: [[37, 38, 46, 34], [54, 34, 63, 38]],
};

const MOUTH: Record<Mood, string> = {
  calm: "M44 58 Q50 60 56 58",
  stern: "M45 59 L55 59",
  warm: "M43 57 Q50 64 57 57",
  sly: "M44 59 Q52 62 57 56",
  worried: "M45 61 Q50 57 55 61",
};

/** The head's outline: a soft oval, a square jaw, or a narrow pointed chin. */
function headPath(rx: number, jaw: Jaw): string {
  const L = 50 - rx, R = 50 + rx;
  if (jaw === "square") return `M${L} 40 Q${L} 21 50 21 Q${R} 21 ${R} 40 L${R - 0.5} 55 Q${R - 2} 67 ${R - 10} 67 L${L + 10} 67 Q${L + 2} 67 ${L + 0.5} 55 Z`;
  if (jaw === "narrow") return `M${L} 41 Q${L} 21 50 21 Q${R} 21 ${R} 41 Q${R - 1} 57 50 69 Q${L + 1} 57 ${L} 41 Z`;
  return `M${L} 44 A${rx} 23 0 1 1 ${R} 44 A${rx} 23 0 1 1 ${L} 44 Z`;
}

const BODY = "M6 100 Q8 72 34 67 L66 67 Q92 72 94 100 Z";

function hairBack(l: Look): string {
  const c = l.hairColor;
  const st = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"`;
  switch (l.hair) {
    case "bob": return `<path d="M27 40 Q27 14 50 14 Q73 14 73 40 L73 64 Q70 70 64 66 L36 66 Q30 70 27 64 Z" fill="${c}" ${st}/>`;
    case "long": return `<path d="M26 40 Q26 12 50 12 Q74 12 74 40 L79 78 Q60 70 50 72 Q40 70 21 78 Z" fill="${c}" ${st}/>`;
    case "ponytail": return `<ellipse cx="75" cy="42" rx="6" ry="15" fill="${c}" ${st}/>`;
    case "tied": return `<circle cx="50" cy="13" r="8" fill="${c}" ${st}/>`;
    case "wild": return `<circle cx="28" cy="32" r="12" fill="${c}"/><circle cx="72" cy="32" r="12" fill="${c}"/><circle cx="50" cy="18" r="14" fill="${c}"/><circle cx="24" cy="48" r="10" fill="${c}"/><circle cx="76" cy="48" r="10" fill="${c}"/><circle cx="30" cy="62" r="8" fill="${c}"/><circle cx="70" cy="62" r="8" fill="${c}"/>`;
    default: return "";
  }
}

function hairFront(l: Look): string {
  const c = l.hairColor, st = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"`;
  const hi = (d: string) => `<path d="${d}" stroke="#fff" stroke-opacity=".28" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  const fringe = `<path d="M30 40 Q34 22 50 22 Q66 22 70 40 Q60 30 50 31 Q40 30 30 40Z" fill="${c}" ${st}/>`;
  switch (l.hair) {
    case "bald": return `<ellipse cx="44" cy="26" rx="7" ry="3.5" fill="#fff" opacity=".24"/>`;
    case "receding": return `<path d="M30 44 Q28 30 36 25 Q33 34 34.5 44Z" fill="${c}" ${st}/><path d="M70 44 Q72 30 64 25 Q67 34 65.5 44Z" fill="${c}" ${st}/><ellipse cx="46" cy="25" rx="7" ry="3" fill="#fff" opacity=".22"/>`;
    case "buzz": return `<path d="M30 42 Q30 20 50 20 Q70 20 70 42 Q66 30 50 28 Q34 30 30 42Z" fill="${c}" ${st}/>`;
    case "short": return `<path d="M29 44 Q27 18 50 17 Q73 18 71 44 Q68 30 58 28 Q42 34 32 32 Q30 36 29 44Z" fill="${c}" ${st}/>` + hi("M36 24 Q46 19 58 21");
    case "slick": return `<path d="M29 42 Q28 17 50 16 Q72 17 71 42 Q64 26 50 25 Q36 26 29 42Z" fill="${c}" ${st}/>` + hi("M38 22 Q50 18 62 23");
    case "swept": return `<path d="M27 46 L29 54 L32 46 Z" fill="${c}"/><path d="M73 46 L71 54 L68 46 Z" fill="${c}"/><path d="M28 44 Q24 17 50 15 Q77 17 72 44 Q71 32 62 27 Q48 23 36 33 Q30 38 28 44Z" fill="${c}" ${st}/>` + hi("M34 24 Q48 17 66 24") + hi("M40 28 Q50 24 62 28");
    case "tousled": return `<path d="M29 44 Q26 20 40 16 L42 21 L47 14 L52 20 L58 14 L60 21 Q74 22 71 44 Q68 30 58 29 Q44 33 32 31 Q30 36 29 44Z" fill="${c}" ${st}/>` + hi("M38 22 L46 19");
    case "curly": return ["34,28", "42,22", "50,20", "58,22", "66,28", "30,38", "70,38", "38,32", "62,32"].map(p => { const [x, y] = p.split(","); return `<circle cx="${x}" cy="${y}" r="8" fill="${c}" ${st}/>`; }).join("");
    case "wild": return `<path d="M29 40 Q32 20 50 20 Q68 20 71 40 Q64 28 50 28 Q36 28 29 40Z" fill="${c}" ${st}/>` + hi("M36 24 Q50 18 64 24");
    case "bob": case "long": return fringe + hi("M36 28 Q50 22 64 28");
    case "ponytail": return `<path d="M29 44 Q27 18 50 17 Q73 18 71 44 Q68 30 58 28 Q42 34 32 32 Q30 36 29 44Z" fill="${c}" ${st}/>`;
    case "tied": return `<path d="M30 42 Q30 20 50 20 Q70 20 70 42 Q64 28 50 27 Q36 28 30 42Z" fill="${c}" ${st}/>` + hi("M38 23 Q50 19 62 23");
  }
}

function outfitSVG(l: Look, id: string): string {
  const o = l.outfitColor, a = l.accent, skinShade = shade(l.skin, -0.12);
  const body = `<path d="${BODY}" fill="${o}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
  const hatch = `<path d="M14 94 L22 80 M20 96 L28 82 M86 94 L78 80 M80 96 L72 82" stroke="${INK}" stroke-opacity=".22" stroke-width="1.4"/>`;
  const stripes = l.stripes
    ? `<g clip-path="url(#body-${id})" stroke="${l.stripes}" stroke-width="2.2" opacity=".6">${Array.from({ length: 14 }, (_, i) => `<path d="M${10 + i * 6.4} 66 L${10 + i * 6.4} 100"/>`).join("")}</g>`
    : "";
  switch (l.outfit) {
    case "suit":
      return body + hatch + `<path d="M40 68 L50 86 L60 68Z" fill="#f4eef8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M48 73 L52 73 L53 91 L50 96 L47 91Z" fill="${a}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M34 68 L44 90 M66 68 L56 90" stroke="${INK}" stroke-width="2" fill="none"/>`;
    case "hawaiian":
      return body + `<path d="M40 67 L50 86 L60 67Z" fill="${skinShade}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
        [[18, 82], [26, 92], [74, 84], [82, 94], [64, 96], [36, 96], [12, 96], [88, 84], [22, 74], [78, 74]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.8" transform="rotate(${i * 37} ${x} ${y})" fill="${a}" opacity=".9"/>`).join("") +
        `<path d="M34 67 L42 80 M66 67 L58 80" stroke="${INK}" stroke-width="2" fill="none"/>`;
    case "leather":
      return body + hatch + `<path d="M40 67 L50 82 L60 67Z" fill="${a}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M50 82 L50 100" stroke="${INK}" stroke-width="2"/><path d="M36 68 L44 80 L36 84 M64 68 L56 80 L64 84" stroke="${INK}" stroke-width="2" fill="none" stroke-linejoin="round"/>`;
    case "blazer":
      return body + hatch + `<path d="M38 67 L50 90 L62 67Z" fill="${a}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M33 68 L45 94 M67 68 L55 94" stroke="${INK}" stroke-width="2" fill="none"/>`;
    case "cardigan":
      return body + `<path d="M40 67 L50 84 L60 67Z" fill="${a}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M50 84 L50 100" stroke="${INK}" stroke-width="2"/>` +
        [88, 94].map(y => `<circle cx="47" cy="${y}" r="1.6" fill="${INK}"/>`).join("");
    case "tactical":
      return body + `<path d="M26 72 L34 100 M74 72 L66 100 M40 80 L60 80 M40 90 L60 90" stroke="${INK}" stroke-width="2.4" fill="none"/><rect x="42" y="82" width="7" height="6" rx="1" fill="${a}" stroke="${INK}" stroke-width="1.4"/><rect x="52" y="82" width="7" height="6" rx="1" fill="${a}" stroke="${INK}" stroke-width="1.4"/>`;
    case "shirt":
      return body + stripes + hatch + `<path d="M38 67 L47 80 L50 70 L53 80 L62 67Z" fill="${shade(o, 0.35)}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M50 80 L50 100" stroke="${INK}" stroke-width="1.8"/><circle cx="50" cy="88" r="1.3" fill="${INK}"/>`;
    case "polo":
      return body + hatch + `<path d="M40 67 L50 80 L60 67Z" fill="${skinShade}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M36 67 L47 71 L49 82 L40 74Z M64 67 L53 71 L51 82 L60 74Z" fill="${shade(o, 0.2)}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="84" r="1.3" fill="${INK}"/><circle cx="50" cy="90" r="1.3" fill="${INK}"/>`;
    case "vest":
      return `<path d="${BODY}" fill="${a}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M38 67 L47 80 L50 70 L53 80 L62 67Z" fill="${shade(a, 0.3)}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M30 68 L44 76 L43 100 L12 100 Q14 78 30 68Z M70 68 L56 76 L57 100 L88 100 Q86 78 70 68Z" fill="${o}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`;
    case "coat":
      return body + hatch + `<path d="M34 67 L50 94 L66 67" fill="${shade(o, 0.12)}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M42 67 L50 78 L58 67" fill="${a}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
  }
}

function glassesSVG(l: Look): string {
  const gl = l.glasses ?? "none";
  const lens = l.tint ? `fill="${l.tint}" fill-opacity=".6"` : `fill="#fff" fill-opacity=".12"`;
  if (gl === "shades") return `<path d="M34 38 L66 38 L64 47 Q58 49 55 46 L52 41 L48 41 L45 46 Q42 49 36 47Z" fill="#0b0610" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M38 40 L44 40 M56 40 L62 40" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/>`;
  if (gl === "aviator") return `<path d="M35 38 L49 38 Q49 47 42 49.5 Q35 48 35 38Z M51 38 L65 38 Q65 48 58 49.5 Q51 47 51 38Z" fill="#171020" fill-opacity=".92" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M49 39.5 L51 39.5 M35 39 L31 39 M65 39 L69 39" stroke="${INK}" stroke-width="1.8"/><path d="M38 40 L43 40 M55 40 L60 40" stroke="#fff" stroke-opacity=".35" stroke-width="1.3"/>`;
  if (gl === "round") return `<circle cx="43" cy="42" r="7" ${lens} stroke="${INK}" stroke-width="2"/><circle cx="57" cy="42" r="7" ${lens} stroke="${INK}" stroke-width="2"/><path d="M36 41 L31 40 M64 41 L69 40" stroke="${INK}" stroke-width="2"/>`;
  if (gl === "square") return `<rect x="35" y="37" width="14" height="10" rx="2" ${lens} stroke="${INK}" stroke-width="2"/><rect x="51" y="37" width="14" height="10" rx="2" ${lens} stroke="${INK}" stroke-width="2"/><path d="M49 41 L51 41 M35 40 L31 39 M65 40 L69 39" stroke="${INK}" stroke-width="2"/>`;
  return "";
}

function facialSVG(l: Look): string {
  const fc = l.facialColor ?? l.hairColor;
  switch (l.facial ?? "none") {
    case "stubble": return `<path d="M33 50 Q36 66 50 68 Q64 66 67 50 Q64 58 50 60 Q36 58 33 50Z" fill="${fc}" opacity=".34"/>`;
    case "mustache": return `<path d="M41 55 Q50 51 59 55 Q54 60 50 57 Q46 60 41 55Z" fill="${fc}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
    case "goatee": return `<path d="M45 61 Q50 72 55 61 Q50 64 45 61Z" fill="${fc}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M42 55 Q50 52 58 55 Q54 58 50 57 Q46 58 42 55Z" fill="${fc}"/><path d="M33 50 Q36 64 50 66 Q64 64 67 50 Q64 58 50 60 Q36 58 33 50Z" fill="${fc}" opacity=".25"/>`;
    case "beard": return `<path d="M31 48 Q32 70 50 73 Q68 70 69 48 Q64 62 50 63 Q36 62 31 48Z" fill="${fc}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M41 55 Q50 51 59 55 Q54 60 50 57 Q46 60 41 55Z" fill="${fc}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
    default: return "";
  }
}

/** Lines that show a lived-in face. */
function ageSVG(age: number): string {
  if (!age) return "";
  let d = "M41 29 Q50 27 59 29 M43 54 Q41 58 43 62 M57 54 Q59 58 57 62";
  if (age >= 2) d += " M43 25.5 Q50 24 57 25.5 M33 42 L36 41 M33 45 L36 45 M67 42 L64 41 M67 45 L64 45 M38 46.5 Q43 48.5 47 46.5 M53 46.5 Q57 48.5 62 46.5";
  return `<path d="${d}" stroke="${INK}" stroke-opacity=".22" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
}

function extrasSVG(l: Look, rx: number): string {
  const ex = l.extras ?? [];
  const earL = 50 - rx, earR = 50 + rx;
  return (ex.includes("scar") ? `<path d="M61 44 L65 52" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/><path d="M61.5 46.5 L64 46 M63 49.5 L65.5 49" stroke="#fff" stroke-opacity=".4" stroke-width="1"/>` : "") +
    (ex.includes("cig") ? `<path d="M57 59 L72 55" stroke="#f4eef8" stroke-width="2.4" stroke-linecap="round"/><path d="M72 55 L74 54.5" stroke="#ff8a1f" stroke-width="2.4" stroke-linecap="round"/><path d="M76 52 Q80 48 77 44 Q75 40 79 37" stroke="#fff" stroke-opacity=".45" stroke-width="1.4" fill="none"/>` : "") +
    (ex.includes("badge") ? `<path d="M64 76 L72 76 L72 84 L68 88 L64 84Z" fill="#ffd166" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>` : "") +
    (ex.includes("earpiece") ? `<circle cx="${earL + 1.5}" cy="47" r="2.2" fill="#0b0610" stroke="${INK}" stroke-width="1"/><path d="M${earL + 1.5} 49 Q${earL - 2} 60 ${earL + 6} 70" stroke="#0b0610" stroke-width="1.4" fill="none"/>` : "") +
    (ex.includes("hoops") ? `<circle cx="${earL}" cy="54" r="5.5" fill="none" stroke="#dfe3ee" stroke-width="2"/><circle cx="${earR}" cy="54" r="5.5" fill="none" stroke="#dfe3ee" stroke-width="2"/>` : "") +
    (ex.includes("earring") ? `<circle cx="${earL}" cy="51" r="1.9" fill="#ffd166" stroke="${INK}" stroke-width="1"/>` : "") +
    (ex.includes("chain") ? `<path d="M41 69 Q50 80 59 69" stroke="#ffd166" stroke-width="1.8" fill="none"/><circle cx="50" cy="78.5" r="1.8" fill="#ffd166"/>` : "");
}

/** Build the portrait's SVG markup (no size set; the wrapper sizes it). */
export function portraitSVG(l: Look, label = "Character sketch"): string {
  const rx = 19 * (l.face ?? 1);
  const jaw = l.jaw ?? "round";
  const id = uid(l);
  const head = headPath(rx, jaw);
  const skinShade = shade(l.skin, -0.14);
  const [lb, rb] = BROWS[l.mood];
  const hc = l.hairColor === "#f4eef8" ? "#9a8fa8" : l.hairColor;
  const lip = (l.extras ?? []).includes("lipstick");
  const age = l.age ?? 0;
  const browW = 2.6 + age * 0.4;
  const lids = l.mood === "sly" || l.mood === "stern";
  const eyes = l.glasses === "shades" || l.glasses === "aviator" ? "" :
    `<ellipse cx="43" cy="42" rx="3.4" ry="${lids ? 2 : 2.6}" fill="#fff" opacity=".92"/><ellipse cx="57" cy="42" rx="3.4" ry="${lids ? 2 : 2.6}" fill="#fff" opacity=".92"/>` +
    `<circle cx="43.4" cy="42.2" r="1.8" fill="${INK}"/><circle cx="57.4" cy="42.2" r="1.8" fill="${INK}"/>` +
    (lids ? `<path d="M39.6 41 Q43 39 46.4 41 M53.6 41 Q57 39 60.4 41" stroke="${INK}" stroke-width="1.5" fill="none" stroke-linecap="round"/>` : "");

  return `<svg viewBox="0 0 100 100" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="bg-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${l.bg[0]}"/><stop offset="1" stop-color="${l.bg[1]}"/></linearGradient>
<linearGradient id="sh-${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${INK}" stop-opacity="0"/><stop offset=".5" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity=".26"/></linearGradient>
<clipPath id="body-${id}"><path d="${BODY}"/></clipPath>
</defs>
<rect width="100" height="100" rx="14" fill="url(#bg-${id})"/>
<g opacity=".12" stroke="#fff" stroke-width="1.2"><path d="M0 20 L20 0 M0 40 L40 0 M0 60 L60 0 M0 80 L80 0"/></g>
${hairBack(l)}
<rect x="42" y="58" width="16" height="14" rx="4" fill="${skinShade}" stroke="${INK}" stroke-width="2.2"/>
${outfitSVG(l, id)}
<circle cx="${50 - rx}" cy="47" r="4" fill="${l.skin}" stroke="${INK}" stroke-width="2.2"/><circle cx="${50 + rx}" cy="47" r="4" fill="${l.skin}" stroke="${INK}" stroke-width="2.2"/>
<path d="${head}" fill="${l.skin}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
<path d="${head}" fill="url(#sh-${id})"/>
<ellipse cx="42" cy="52" rx="5" ry="3" fill="#ff6b6b" opacity=".13"/><ellipse cx="58" cy="52" rx="5" ry="3" fill="#ff6b6b" opacity=".13"/>
<ellipse cx="50" cy="62" rx="${rx * 0.7}" ry="5" fill="${skinShade}" opacity=".26"/>
${ageSVG(age)}
${facialSVG(l)}
${hairFront(l)}
<path d="M${lb[0]} ${lb[1]} L${lb[2]} ${lb[3]} M${rb[0]} ${rb[1]} L${rb[2]} ${rb[3]}" stroke="${hc}" stroke-width="${browW}" stroke-linecap="round"/>
<path d="M${lb[0]} ${lb[1]} L${lb[2]} ${lb[3]} M${rb[0]} ${rb[1]} L${rb[2]} ${rb[3]}" stroke="${INK}" stroke-opacity=".35" stroke-width="1" stroke-linecap="round"/>
${eyes}${glassesSVG(l)}
<path d="M50 44 L48 52 Q50 54 52 52" stroke="${INK}" stroke-opacity=".6" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${MOUTH[l.mood]}" stroke="${lip ? "#d6244f" : INK}" stroke-width="${lip ? 3 : 2}" fill="none" stroke-linecap="round"/>
${extrasSVG(l, rx)}
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
const cache = new Map<string, string>();

/** An inline portrait for a character id, or a silhouette if we don't have one. `known: false` hides the face. */
export function portrait(id: string, px = 56, known = true, label?: string): string {
  const key = `${id}:${known}`;
  let svg = cache.get(key);
  if (!svg) {
    const look = LOOKS[id];
    svg = known && look ? portraitSVG(look, label || `Sketch of ${id}`) : silhouetteSVG(known ? "Unknown" : "Someone you haven't met");
    cache.set(key, svg);
  }
  return `<span class="portrait" style="width:${px}px;height:${px}px">${svg}</span>`;
}
