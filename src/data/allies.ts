import type { Ally } from "../types";

// Ability effects live in game/abilities.ts so this file stays pure data.
// Keep this list in order of cost: it's the order the Crew pop-up shows.
export const ALLIES: Ally[] = [
  {id:"sam", name:"Sam Axe", cost:5000,
   bio:"Retired Navy SEAL, Michael's best friend, and a man who loves a free drink.",
   perk:"Heat gain −15%", ab:"Free Mojito Tab", abDesc:"Instantly gain 4 minutes of income", cd:90},
  {id:"fiona", name:"Fiona Glenanne", cost:50000, she: true,
   bio:"Michael's on-and-off partner, a former IRA operative who solves problems with explosives.",
   perk:"Jobs pay ×1.5", ab:"Blow Something Up", abDesc:"Gain 7 minutes of income, +15 heat", cd:120},
  {id:"barry", name:"Barry Burkowski", cost:1e6,
   bio:"Miami's money launderer, the Yellow Pages for criminals. He always takes Michael's call.",
   perk:"Fixer payoffs cost 50% less; favor prices from your frienemies −25%. He also sells favors, whether or not he's hired.",
   ab:"Follow the Money", abDesc:"Barry traces a payoff to a crook: gain 5 minutes of income and −25 heat", cd:110},
  {id:"nate", name:"Nate Westen", cost:1.1e6, flaky: true,
   bio:"Michael's younger brother. A reformed gambler and con man turned limo-company owner: charming, well-meaning, a champion hotwirer, and about as reliable as Miami weather. He lives in his big brother's shadow and would still take a bullet for him.",
   perk:"+15% income while he's around. He comes and goes, so don't count on him.",
   ab:"Nate's Big Idea", abDesc:"A gamble: usually a windfall (10 minutes of income), sometimes a mess. Only when he's around.", cd:130},
  {id:"madeline", name:"Madeline Westen", cost:2.4e6, she: true, debut: 3, debutEp: "302",
   bio:"Michael's mother. Sharp, chain-smoking, and not part of the spy business, but she'll always come through for a child or an older neighbor in need.",
   perk:"On missions she only helps with kids and older folks. Lay Low cools down twice as fast; auto Lay Low at 95% heat.",
   ab:"Family Dinner", abDesc:"−50 heat, −30 Organization attention", cd:100},
  {id:"jesse", name:"Jesse Porter", cost:3e6, debut: 4, debutEp: "402", gateEp: true,
   bio:"A former counterintelligence agent who got burned himself and now works with Michael.",
   perk:"+10% mission success", ab:"Fast Talk", abDesc:"Missions run 2× faster for 4 minutes", cd:150},
];
