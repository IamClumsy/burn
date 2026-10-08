import type { Upgrade } from "../types";
import { GENS } from "./ops";

const HAND_MADE: Upgrade[] = [
  {id:"u1", name:"Better Cover Story",   desc:"Jobs pay ×2",              cost:100,   kind:"click", m:2},
  {id:"g1", name:"Prepaid Burners",      desc:"Informants ×2",            cost:500,   kind:"gen", g:"inf",  m:2},
  {id:"u2", name:"Fake Credentials",     desc:"Jobs pay ×3",              cost:2500,  kind:"click", m:3},
  {id:"g2", name:"Bigger Roll of Tape",  desc:"Gadgets ×2",               cost:3000,  kind:"gen", g:"tape", m:2},
  {id:"h1", name:"Quiet Methods",        desc:"Heat gain −40%",           cost:20000, kind:"heat"},
  {id:"g3", name:"Bar Tab on the House", desc:"Sam's network ×2",         cost:25000, kind:"gen", g:"sam",  m:2},
  {id:"a1", name:"Word Gets Around",      desc:"Everyone's heard of you. All income ×1.5",          cost:50000, kind:"all", m:1.5},
  {id:"u3", name:"Network of Clients",   desc:"Jobs pay ×5",              cost:90000, kind:"click", m:5},
  {id:"h2", name:"Fiona Cleans Up",      desc:"Lay Low removes 60 heat",  cost:150000,kind:"lay"},
  {id:"g4", name:"Shaped Charges",       desc:"Fiona's demolitions ×2",   cost:260000,kind:"gen", g:"fi",   m:2},
  {id:"h3", name:"Hands-Off Handler",    desc:"Auto Lay Low at 90% heat", cost:800000,kind:"auto"},
  {id:"g5", name:"Family Dinner Rota",   desc:"Phone tree ×2",            cost:2.8e6, kind:"gen", g:"mad",  m:2},
  {id:"a2", name:"Michael's Rolodex",     desc:"A name for every problem. All income ×2",         cost:5e6,   kind:"all", m:2},
  {id:"g6", name:"Couch Upgrades",       desc:"Safehouses ×2",            cost:3e7,   kind:"gen", g:"safe", m:2},
  {id:"g7", name:"Deep Cover Moles",     desc:"Spook contacts ×2",        cost:4e8,   kind:"gen", g:"spook",m:2},
  {id:"a3", name:"A Name People Trust",  desc:"Clients come to you. All income ×3",         cost:6e8,   kind:"all", m:3},
];

// ---- Operation tiers: as you own more of an operation, it can be trained up, again and again ----
const OP_NAMES: Record<string, string> = {
  inf: "Informants", tape: "Gadgets", sam: "Barstool Network", fi: "Demolitions",
  mad: "Phone Tree", safe: "Safehouses", spook: "Spook Contacts", burn: "Takedown Teams",
};
const TIER_NAMES = ["Trained", "Seasoned", "Veteran", "Elite", "Legendary", "Mythic"];
/** Own at least `owned` of an operation to be offered a boost of ×`m`. */
export const OP_TIERS = [
  { owned: 10, m: 2 }, { owned: 25, m: 2 }, { owned: 50, m: 3 },
  { owned: 100, m: 3 }, { owned: 150, m: 5 }, { owned: 200, m: 5 },
];

const TIERED: Upgrade[] = GENS.flatMap(g => OP_TIERS.map((t, i): Upgrade => ({
  id: `t-${g.id}-${i}`,
  name: `${TIER_NAMES[i]} ${OP_NAMES[g.id]}`,
  desc: `${OP_NAMES[g.id]} ×${t.m}. Unlocks when you own ${t.owned}.`,
  // Roughly ten times what one more of that operation costs by then: worth it, but not free.
  cost: Math.round(g.base * Math.pow(1.15, t.owned) * 10),
  kind: "gen", g: g.id, m: t.m, needs: { gen: g.id, owned: t.owned },
})));

/** Every upgrade, cheapest first: it's the order the Upgrades card shows. */
export const UPGS: Upgrade[] = [...HAND_MADE, ...TIERED].sort((a, b) => a.cost - b.cost);

// ---- The endless one: it can always be bought again ----
export const REFERRAL = {
  name: "Satisfied Clients Refer Friends",
  /** Each level multiplies all income by this. */
  gain: 1.1,
  /** Offered once your lifetime earnings reach this fraction of its next price. */
  unlockFraction: 0.3,
  firstCost: 2e8,
  growth: 2.4,
};
