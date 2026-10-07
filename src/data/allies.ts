import type { Ally } from "../types";

// Ability effects live in game/abilities.ts so this file stays pure data.
export const ALLIES: Ally[] = [
  {id:"sam", name:"Sam Axe", cost:5000,
   bio:"Retired Navy SEAL, Michael's best friend, and a man who loves a free drink.",
   perk:"Heat gain −15%", ab:"Free Mojito Tab", abDesc:"Instantly gain 60s of income", cd:90},
  {id:"fiona", name:"Fiona Glenanne", cost:50000,
   bio:"Michael's on-and-off partner, a former IRA operative who solves problems with explosives.",
   perk:"Jobs pay ×1.5", ab:"Blow Something Up", abDesc:"Gain 120s of income, +15 heat", cd:120},
  {id:"madeline", name:"Madeline Westen", cost:400000,
   bio:"Michael's mother. Chain-smoking, sharp, and always three phone calls ahead.",
   perk:"Lay Low cools down twice as fast; auto Lay Low at 95% heat",
   ab:"Family Dinner", abDesc:"−50 heat, −30 Organization attention", cd:100},
  {id:"jesse", name:"Jesse Porter", cost:3e6,
   bio:"A former counterintelligence agent who got burned himself and now works with Michael.",
   perk:"+10% mission success", ab:"Fast Talk", abDesc:"Missions run 2× faster for 60s", cd:150},
  {id:"barry", name:"Barry Burkowski", cost:1e6,
   bio:"Miami's money launderer, the Yellow Pages for criminals. He always takes Michael's call.",
   perk:"Fixer payoffs cost 50% less; Simon's favor prices −25%",
   ab:"Follow the Money", abDesc:"Barry traces a payoff to a crook: gain 90s of income and −25 heat", cd:110},
];
