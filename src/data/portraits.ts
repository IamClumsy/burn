import type { Look } from "../ui/portrait";

/**
 * Who looks like what. Each is an original illustration drawn from how the character looks on screen:
 * hair, build, skin tone, beard, glasses and usual clothes. Keyed by the same ids the game uses for
 * allies, contacts and bosses. Olivia Riley is the one exception: there's no reference photo for her
 * on the wiki, so hers is drawn from her role.
 */
export const LOOKS: Record<string, Look> = {
  // ---- the star: lean, angular, short dark hair, a khaki polo
  michael: { skin: "#e2b48c", hair: "short", hairColor: "#2a1d16", jaw: "square", face: 0.97, outfit: "polo", outfitColor: "#cdbb9a", accent: "#8a7a5c", bg: ["#ff7a59", "#7b2a6b"], mood: "calm" },

  // ---- crew
  // Sam: swept-back salt-and-pepper hair, a gray goatee, a cream floral shirt and a gold chain
  sam: { skin: "#d6a47a", hair: "swept", hairColor: "#5d5864", facial: "goatee", facialColor: "#9a96a4", jaw: "square", face: 1.04, age: 1, outfit: "hawaiian", outfitColor: "#efe2c6", accent: "#8a5a3a", extras: ["chain"], bg: ["#2ee6d6", "#7b2a6b"], mood: "sly" },
  // Fiona: long honey-brown hair and a narrow face
  fiona: { skin: "#ecc4a0", hair: "long", hairColor: "#b08a5e", jaw: "narrow", face: 0.95, outfit: "leather", outfitColor: "#2a1e2e", accent: "#8e5bd6", bg: ["#ff4fa3", "#3a0f4a"], mood: "warm" },
  // Barry: short salt-and-pepper hair, a goatee, dark aviators, an earring, a cream jacket over a striped shirt
  barry: { skin: "#c9965f", hair: "short", hairColor: "#5a565f", facial: "goatee", facialColor: "#6c6872", glasses: "aviator", jaw: "round", face: 1.06, age: 1, outfit: "blazer", outfitColor: "#d9ccb4", accent: "#3a8f86", extras: ["earring"], bg: ["#ffd166", "#7a3d6a"], mood: "calm" },
  // Madeline: short curly blond hair, big hoop earrings, and a black top
  madeline: { skin: "#f1d3b8", hair: "curly", hairColor: "#e8d28c", jaw: "round", age: 2, outfit: "cardigan", outfitColor: "#1d1a24", accent: "#f4eef8", extras: ["hoops", "lipstick"], bg: ["#c23bff", "#3a0f4a"], mood: "warm" },
  // Nate: short dark hair, clean-shaven, a black blazer over an open white shirt
  nate: { skin: "#e8bd96", hair: "tousled", hairColor: "#2c1f19", jaw: "narrow", outfit: "blazer", outfitColor: "#16151c", accent: "#f4eef8", bg: ["#2ee6d6", "#ff9a3c"], mood: "warm" },
  // Jesse: a nearly shaved head, a strong jaw, an orange-striped shirt
  jesse: { skin: "#d9ac86", hair: "buzz", hairColor: "#4a3a2e", jaw: "square", face: 1.08, outfit: "shirt", outfitColor: "#e9906a", accent: "#f6e0d0", stripes: "#f6e0d0", bg: ["#5fe59a", "#2a1a50"], mood: "calm" },

  // ---- frienemies
  // Seymour: wild dark curls, a full dark beard, big intense eyes, an earring, a white open shirt
  seymour: { skin: "#c9966a", hair: "wild", hairColor: "#3a2417", facial: "beard", facialColor: "#2a1710", jaw: "round", face: 1.0, outfit: "shirt", outfitColor: "#eee6d6", accent: "#ffd166", extras: ["earring"], bg: ["#ffd166", "#c23bff"], mood: "worried" },
  // Simon: short brown hair, stubble, a smirk, a dark open-collar shirt
  simon: { skin: "#e6bd9a", hair: "short", hairColor: "#4a3426", facial: "stubble", jaw: "square", outfit: "shirt", outfitColor: "#3b3a42", accent: "#7b5cff", bg: ["#7b5cff", "#150c20"], mood: "sly" },

  // ---- the people who burned him
  // Paxson: dark hair pulled sleekly back, a navy blazer over a white blouse, a badge
  paxson: { skin: "#dcb08a", hair: "tied", hairColor: "#2a1e1a", jaw: "narrow", outfit: "blazer", outfitColor: "#1f2a4a", accent: "#f4eef8", extras: ["badge"], bg: ["#4aa3ff", "#1b1034"], mood: "stern" },
  // Carla: long straight honey-blond hair, a white jacket over a dark top, a cold stare
  carla: { skin: "#f1cfae", hair: "long", hairColor: "#c9a066", jaw: "narrow", outfit: "blazer", outfitColor: "#efeae4", accent: "#4a3f46", bg: ["#ff4d5e", "#3a0f4a"], mood: "stern" },
  // Cowan: balding with gray sides, a salt-and-pepper beard, a dark blazer over an open white shirt
  cowan: { skin: "#e3bf9e", hair: "receding", hairColor: "#8d889a", facial: "beard", facialColor: "#7c7886", jaw: "round", face: 1.08, age: 2, outfit: "blazer", outfitColor: "#1b2238", accent: "#f4eef8", bg: ["#8a8aa0", "#2a1f3a"], mood: "worried" },
  // Larry: swept-back brown-gray hair, a weathered grin, a tan blazer over a light blue shirt
  larry: { skin: "#cf9a6e", hair: "swept", hairColor: "#6a5a52", jaw: "square", face: 1.04, age: 2, outfit: "blazer", outfitColor: "#b99a73", accent: "#8fb4d6", bg: ["#ff9a3c", "#3a0f4a"], mood: "warm" },
  // Brennen: light gray-blond hair, clean-shaven and pale, a gray suit with a gray-green tie
  brennen: { skin: "#efd2b6", hair: "short", hairColor: "#b9b3a4", jaw: "narrow", face: 0.98, age: 1, outfit: "suit", outfitColor: "#7d7b86", accent: "#9aa38a", bg: ["#2ee6d6", "#1b1034"], mood: "worried" },
  // Strickler: thick dark hair, aviators, a pink striped shirt open at the collar
  strickler: { skin: "#d4a47c", hair: "tousled", hairColor: "#3a2a20", glasses: "aviator", jaw: "narrow", outfit: "shirt", outfitColor: "#e17fb8", accent: "#fbe7f2", stripes: "#fbe7f2", bg: ["#ffd166", "#3a0f4a"], mood: "sly" },
  // O'Neill: short dark hair, dark stubble, dark sunglasses, a black shirt and a chain, a hard stare
  oneill: { skin: "#d7ac86", hair: "short", hairColor: "#1f1814", facial: "stubble", facialColor: "#3a2c24", glasses: "shades", jaw: "square", age: 1, outfit: "shirt", outfitColor: "#17151a", accent: "#2a2630", extras: ["chain"], bg: ["#2fbf71", "#150c20"], mood: "stern" },
  // Pearce: dark brown hair worn down and parted, a gray blazer over a dark top, a level stare
  pearce: { skin: "#e6bd9c", hair: "long", hairColor: "#3a2a22", jaw: "narrow", outfit: "blazer", outfitColor: "#8d8f98", accent: "#1d1a24", bg: ["#4aa3ff", "#2a1a50"], mood: "stern" },
  // Victor: thinning light-brown hair, light stubble, a patterned open-collar shirt, a cold hard stare
  victor: { skin: "#e3bd9a", hair: "receding", hairColor: "#8a6a4a", facial: "stubble", facialColor: "#a58b68", jaw: "narrow", face: 0.98, outfit: "shirt", outfitColor: "#7d86b8", accent: "#d09ab8", stripes: "#d09ab8", bg: ["#8a8aa0", "#150c20"], mood: "stern" },
  // Gilroy: short tousled dark hair, a self-satisfied smirk, a cream blazer over a white shirt
  gilroy: { skin: "#ecc6a2", hair: "tousled", hairColor: "#3b2a22", jaw: "square", outfit: "blazer", outfitColor: "#dcc79c", accent: "#f4eef8", bg: ["#ff4d5e", "#150c20"], mood: "sly" },
  // Barrett: combed dark-gray hair, a ruddy weathered face, a dark suit with a red tie
  barrett: { skin: "#d9a384", hair: "short", hairColor: "#5b4c46", jaw: "square", face: 1.08, age: 2, outfit: "suit", outfitColor: "#171826", accent: "#7a1d2a", bg: ["#4aa3ff", "#150c20"], mood: "stern" },
  // Anson: tousled ginger hair, a ginger mustache, tinted glasses, a pale blue shirt under a dark vest
  anson: { skin: "#e8c4a0", hair: "tousled", hairColor: "#d99a5a", facial: "mustache", facialColor: "#c98a52", glasses: "square", tint: "#7a5a3a", jaw: "narrow", age: 2, outfit: "vest", outfitColor: "#23232e", accent: "#a9c4e8", bg: ["#7b5cff", "#2a1f3a"], mood: "warm" },
  // Vaughn: bald, dark sunglasses, a gray blazer over an orange polo, a knowing smile
  vaughn: { skin: "#7a4a2c", hair: "bald", hairColor: "#1b1320", glasses: "shades", jaw: "round", face: 1.1, age: 1, outfit: "blazer", outfitColor: "#a9a6ad", accent: "#e8a44a", bg: ["#4aa3ff", "#150c20"], mood: "warm" },
  // Card: thin swept sandy-gray hair, a lined tan face, a white shirt with the sleeves rolled
  card: { skin: "#dcae8c", hair: "short", hairColor: "#a89a82", jaw: "square", age: 2, outfit: "shirt", outfitColor: "#f1eeea", accent: "#cfc9c0", bg: ["#ff9a3c", "#2a1f3a"], mood: "stern" },
  // Gray: messy sandy hair, stubble, a black leather vest over a dark shirt
  gray: { skin: "#d9ac84", hair: "tousled", hairColor: "#9a7a4a", facial: "stubble", facialColor: "#7a5a34", jaw: "narrow", age: 1, outfit: "leather", outfitColor: "#17141c", accent: "#2a2430", bg: ["#5fe59a", "#150c20"], mood: "stern" },
  // Riley: drawn from her role (a sharp, observant CIA officer); the wiki has no reference photo for her
  riley: { skin: "#8a5230", hair: "short", hairColor: "#1b1320", glasses: "square", jaw: "narrow", outfit: "blazer", outfitColor: "#1f2a44", accent: "#f4eef8", bg: ["#ff4fa3", "#150c20"], mood: "calm" },
};
