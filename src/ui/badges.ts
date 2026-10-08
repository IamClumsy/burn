import { S } from "../state";
import { allyHere, perk, perkCost } from "../calc";
import { ALLIES } from "../data/allies";
import { PERKS, RECIPES } from "../data/perks";

export interface Badge { text: string; ready: boolean }

/**
 * Live counts for the buttons in The Loft, so Crew, Gadgets and Favors are never out of sight or mind.
 * `ready` means there's something worth doing right now.
 */
export function loftBadges(): { crew: Badge; gad: Badge; fav: Badge; cov: Badge } {
  const abilitiesReady = ALLIES.filter(a => allyHere(a.id) && !(S.allyCd[a.id] > 0)).length;
  const parts = Object.values(S.junk).reduce((a, b) => a + b, 0);
  const canCraft = RECIPES.some(r => Object.entries(r.need).every(([k, v]) => S.junk[k] >= v));
  const canBuyPerk = PERKS.some(p => perk(p.id) < 10 && S.favors >= perkCost(p.id));
  return {
    crew: { text: abilitiesReady ? `${abilitiesReady} ready` : "", ready: abilitiesReady > 0 },
    gad: { text: parts ? `${parts} ${parts === 1 ? "part" : "parts"}` : "", ready: canCraft },
    fav: { text: S.favors ? String(S.favors) : "", ready: canBuyPerk },
    cov: { text: "", ready: false },
  };
}
