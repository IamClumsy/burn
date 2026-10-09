import { S } from "../state";
import { allyHere, perk, perkCost } from "../calc";
import { ALLIES } from "../data/allies";
import { PERKS, RECIPES } from "../data/perks";
import { BOSSES } from "../data/bosses";
import { AUTOS } from "../data/automation";
import { DOSSIER } from "../data/org";
import { credGain } from "../calc";
import type { TabId } from "./panels";

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

/** What counts as "everything there is to see" on each menu screen right now. A bigger number means something new. */
function menuCounts(): Partial<Record<TabId, number>> {
  const open = BOSSES.filter(b => S.life >= b.at).length, beaten = BOSSES.filter(b => S.bossKills[b.id]).length;
  return {
    story: S.story + Object.keys(S.arcsDone).length,
    rogue: open + beaten,
    list: Object.keys(S.listKnown).length + beaten,
    med: S.ach.length,
    auto: AUTOS.filter(a => S.cred >= a.need).length,
    file: DOSSIER.filter(d => S.attPeak >= d.peak).length,
    rep: credGain() >= 1 ? 1 : 0,
  };
}

/**
 * Which menu screens have something you haven't looked at yet. The first time a game checks, it sets
 * the baseline instead (nothing is "new" in a save you've already been playing), and it only ever
 * counts things that appear after that.
 */
export function menuNew(): Partial<Record<TabId, number>> {
  const out: Partial<Record<TabId, number>> = {};
  const cur = menuCounts();
  for (const [id, n] of Object.entries(cur) as [TabId, number][]) {
    const seen = S.seen[id];
    if (seen === undefined || n < seen) S.seen[id] = n; // first look, or it reset (a new run)
    else if (n > seen) out[id] = n - seen;
  }
  return out;
}

/** You've looked: whatever is there now stops counting as new. */
export function markSeen(id: TabId): void {
  const n = menuCounts()[id];
  if (n !== undefined) S.seen[id] = n;
}
