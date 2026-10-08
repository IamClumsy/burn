import type { Look } from "../ui/portrait";

const skin = { pale: "#f1d3b8", fair: "#ecc4a0", tan: "#d6a47a", olive: "#c9965f", brown: "#a8683f", deep: "#7a4a2c" };
const hair = {
  black: "#1b1320", dark: "#2f1d14", brown: "#5a3820", auburn: "#7a3320", blond: "#d9b25c",
  gray: "#a7a2b0", silver: "#cfc9d6", salt: "#8d889a",
};

/**
 * Who looks like what. These are original sketches built from each character's manner and style
 * (clothes, hair, attitude), keyed by the same ids the game uses for allies, contacts and bosses.
 */
export const LOOKS: Record<string, Look> = {
  // ---- the star
  michael: { skin: skin.tan, hair: "short", hairColor: hair.dark, facial: "stubble", glasses: "shades", outfit: "shirt", outfitColor: "#2d3a5a", accent: "#2ee6d6", bg: ["#ff7a59", "#7b2a6b"], mood: "calm" },

  // ---- crew
  sam: { skin: skin.tan, hair: "short", hairColor: hair.silver, glasses: "none", outfit: "hawaiian", outfitColor: "#1aa89c", accent: "#ff4fa3", bg: ["#2ee6d6", "#7b2a6b"], mood: "warm", face: 1.05 },
  fiona: { skin: skin.fair, hair: "long", hairColor: hair.auburn, outfit: "leather", outfitColor: "#1d1426", accent: "#ff4fa3", bg: ["#ff4fa3", "#3a0f4a"], mood: "sly", extras: ["lipstick"] },
  barry: { skin: skin.olive, hair: "receding", hairColor: hair.dark, facial: "stubble", glasses: "round", outfit: "shirt", outfitColor: "#c0562c", accent: "#ffd166", bg: ["#ffd166", "#7a3d6a"], mood: "worried", face: 1.05 },
  madeline: { skin: skin.pale, hair: "bob", hairColor: "#e0c27a", outfit: "cardigan", outfitColor: "#6c4f9e", accent: "#f4eef8", bg: ["#c23bff", "#3a0f4a"], mood: "stern", extras: ["cig", "lipstick"] },
  nate: { skin: skin.fair, hair: "tousled", hairColor: hair.brown, facial: "stubble", outfit: "coat", outfitColor: "#3b6e8f", accent: "#ffd166", bg: ["#2ee6d6", "#ff9a3c"], mood: "warm" },
  jesse: { skin: skin.tan, hair: "short", hairColor: hair.brown, outfit: "shirt", outfitColor: "#2f4f6f", accent: "#5fe59a", bg: ["#5fe59a", "#2a1a50"], mood: "calm" },

  // ---- frienemies
  seymour: { skin: skin.olive, hair: "wild", hairColor: "#4a3020", facial: "mustache", glasses: "shades", outfit: "blazer", outfitColor: "#8c2f6b", accent: "#ffd166", bg: ["#ffd166", "#c23bff"], mood: "warm", face: 1.05 },
  simon: { skin: skin.pale, hair: "buzz", hairColor: "#2a2230", facial: "stubble", outfit: "coat", outfitColor: "#262033", accent: "#7b5cff", bg: ["#7b5cff", "#150c20"], mood: "stern", extras: ["scar"] },

  // ---- the people who burned him
  paxson: { skin: "#b8774a", hair: "tied", hairColor: hair.black, outfit: "blazer", outfitColor: "#2d3a5a", accent: "#f4eef8", bg: ["#4aa3ff", "#1b1034"], mood: "stern", extras: ["badge"] },
  carla: { skin: skin.fair, hair: "long", hairColor: "#e2c36b", outfit: "suit", outfitColor: "#8c1d3f", accent: "#f4eef8", bg: ["#ff4d5e", "#3a0f4a"], mood: "sly", extras: ["lipstick"] },
  cowan: { skin: skin.pale, hair: "receding", hairColor: hair.gray, glasses: "round", outfit: "suit", outfitColor: "#3a3550", accent: "#b0b0c0", bg: ["#8a8aa0", "#2a1f3a"], mood: "worried" },
  larry: { skin: skin.tan, hair: "buzz", hairColor: "#bdb7c6", outfit: "coat", outfitColor: "#6a5a3a", accent: "#ffd166", bg: ["#ff9a3c", "#3a0f4a"], mood: "warm", face: 1.08, extras: ["scar"] },
  brennen: { skin: skin.pale, hair: "short", hairColor: hair.brown, glasses: "round", outfit: "shirt", outfitColor: "#2a5a6a", accent: "#2ee6d6", bg: ["#2ee6d6", "#1b1034"], mood: "sly" },
  strickler: { skin: skin.pale, hair: "slick", hairColor: hair.black, facial: "mustache", glasses: "square", outfit: "suit", outfitColor: "#1f2a44", accent: "#ffd166", bg: ["#ffd166", "#3a0f4a"], mood: "sly" },
  gilroy: { skin: skin.fair, hair: "slick", hairColor: hair.blond, facial: "stubble", outfit: "coat", outfitColor: "#201a2c", accent: "#ff4d5e", bg: ["#ff4d5e", "#150c20"], mood: "sly" },
  barrett: { skin: skin.tan, hair: "slick", hairColor: "#c9c5d2", outfit: "suit", outfitColor: "#16213a", accent: "#ffd166", bg: ["#4aa3ff", "#150c20"], mood: "stern", face: 1.06 },
  anson: { skin: skin.pale, hair: "receding", hairColor: "#9a95a6", glasses: "round", outfit: "cardigan", outfitColor: "#4a5a6a", accent: "#f4eef8", bg: ["#7b5cff", "#2a1f3a"], mood: "calm" },
  vaughn: { skin: skin.deep, hair: "bald", hairColor: hair.black, outfit: "suit", outfitColor: "#12203a", accent: "#ff4d5e", bg: ["#4aa3ff", "#150c20"], mood: "stern", extras: ["earpiece"] },
  card: { skin: skin.pale, hair: "short", hairColor: hair.salt, facial: "mustache", outfit: "suit", outfitColor: "#2d2a40", accent: "#ff9a3c", bg: ["#ff9a3c", "#2a1f3a"], mood: "sly", face: 1.04 },
  gray: { skin: skin.tan, hair: "buzz", hairColor: "#6b5a3a", facial: "stubble", outfit: "tactical", outfitColor: "#3a4a3a", accent: "#ffd166", bg: ["#5fe59a", "#150c20"], mood: "stern", extras: ["earpiece"] },
  riley: { skin: skin.brown, hair: "short", hairColor: hair.black, glasses: "square", outfit: "blazer", outfitColor: "#1f2a44", accent: "#f4eef8", bg: ["#ff4fa3", "#150c20"], mood: "calm" },
};
