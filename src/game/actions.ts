import { S } from "../state";
import { fresh, setState } from "../state";
import {
  allyHere, bribeCost, bribeDrop, bulkCost, buyN, contactPrice, credGain, hangOutPrice, owned, perk, perkCost,
} from "../calc";
import { GENS } from "../data/ops";
import { UPGS } from "../data/upgrades";
import { ALLIES } from "../data/allies";
import { COVERS } from "../data/covers";
import { RECIPES } from "../data/perks";
import { LINES } from "../data/text";
import { beep, chime } from "../audio";
import { pick } from "../util";
import { say, toast } from "../ui/fx";
import { ABILITIES } from "./abilities";
import { checkBurn } from "./heat";
import { newFixer, simonTip } from "./org";
import { SEYMOUR_HANGOUTS } from "../data/contacts";
import { allyAvailable } from "../calc";
import { fillBoard, startMission } from "./missions";

export function buyGen(id: string): void {
  const g = GENS.find(x => x.id === id)!, n = buyN(g), c = bulkCost(g, n);
  if (S.cash < c) return;
  const before = owned(id);
  S.cash -= c; S.gens[id] = before + n;
  beep(660, 0.07, "triangle", 0.05);
  if ([10, 25, 50, 100, 150].some(m => before < m && before + n >= m)) say(pick(LINES.big));
}

export function buyUpg(id: string): void {
  const u = UPGS.find(x => x.id === id)!;
  if (S.upgs[id] || S.cash < u.cost) return;
  S.cash -= u.cost; S.upgs[id] = true;
  say("Acquired: " + u.name + ".");
  beep(780, 0.1, "triangle", 0.05);
}

export function hireAlly(id: string): void {
  const a = ALLIES.find(x => x.id === id)!;
  if (S.allies[id] || S.cash < a.cost || !allyAvailable(a.debut)) return;
  S.cash -= a.cost; S.allies[id] = true;
  chime(); toast(a.name + " joins you", a.perk);
  say(a.name + " is on the team. Try not to get them killed.");
}

export function useAbility(id: string): void {
  const a = ALLIES.find(x => x.id === id)!;
  if (!allyHere(id) || (S.allyCd[id] || 0) > 0) return;
  ABILITIES[id]();
  S.allyCd[id] = a.cd;
  chime(); checkBurn();
}

export function setCover(id: string): void {
  const c = COVERS.find(x => x.id === id)!;
  if (S.cover === id || S.life < c.unlock || S.coverCd > 0) return;
  S.cover = id; S.coverCd = 20;
  say("New name, new wardrobe. You're " + c.name.toLowerCase() + " now.");
}

export function buyPerk(id: string): void {
  const c = perkCost(id);
  if (perk(id) >= 10 || S.favors < c) return;
  S.favors -= c; S.perks[id] = perk(id) + 1;
  beep(700, 0.1, "triangle", 0.05);
}

export function craft(id: string): void {
  const r = RECIPES.find(x => x.id === id)!;
  if (!Object.entries(r.need).every(([k, v]) => S.junk[k] >= v)) return;
  for (const [k, v] of Object.entries(r.need)) S.junk[k] -= v;
  if (id === "smoke") S.heat = Math.max(0, S.heat - 30);
  if (id === "jam") S.fx.jam = 45;
  if (id === "boost") S.fx.boost = 30;
  if (id === "jobs") S.fx.jobs = 30;
  S.stats.crafted++;
  chime(); say("Held together with tape and optimism. It works.");
}

const SEYMOUR_LINES = [
  "Seymour talks for ten minutes about destiny, then names a price. The gear is worth it. Barely.",
  "Seymour is thrilled to be involved. He's always thrilled. That's what makes him dangerous, and useful.",
  "Seymour never works for free, and he is never boring. Necessary, and best kept at arm's length.",
];
const SIMON_LINES = [
  "Simon hands over a name and a warning in the same breath. The intel is good. So is the warning.",
  "Simon knows how the Organization thinks because he used to be it. You pay him and try not to think about that.",
  "Simon smiles, and the favor is yours. Necessary, and worth keeping where you can see him.",
];

/**
 * Buy a favor from a frienemy. Seymour sells hardware, and would sooner be paid in company: pass
 * "hangout" to pay about half in cash and spend the afternoon with him. Simon sells intel, with a volatile streak.
 */
export function buyFavorFrom(id: string, mode: "cash" | "hangout" = "cash"): void {
  if (id !== "seymour" && id !== "simon") return;
  const hang = id === "seymour" && mode === "hangout";
  if (hang && S.busy) return; // already tied up with someone
  const c = hang ? hangOutPrice() : contactPrice(id);
  if (S.cash < c) return;
  S.cash -= c; S.favors++;
  beep(300, 0.1, "triangle", 0.05);
  if (id === "seymour") {
    S.seymourBought++; S.stats.seymourFavors++;
    S.att = Math.min(100, S.att + 3);
    for (let i = 0; i < 2; i++) S.junk[pick(Object.keys(S.junk))]++;
    if (hang) {
      const h = pick(SEYMOUR_HANGOUTS);
      S.busy = { who: "Seymour", left: 30 + Math.random() * 15 };
      say(h.story);
    } else say(pick(SEYMOUR_LINES));
  } else {
    S.simonBought++; S.stats.simonFavors++;
    simonTip();
    S.att = Math.max(0, S.att - 10);
    if (Math.random() < 0.2) { S.heat += 15; say("Simon goes off script and does something loud. The intel was good. The heat is real."); }
    else say(pick(SIMON_LINES));
  }
}

export function payOffFixer(): void {
  const c = bribeCost();
  if (S.cash < c) return;
  const who = S.fixer?.name ?? "A fixer", drop = bribeDrop();
  S.cash -= c; S.att = Math.max(0, S.att - drop);
  say(`${who} takes the envelope and makes some calls. The Organization loses interest, by about ${drop} points, for now.`);
  newFixer(); // that fixer's done; someone else will be along with a different price
}

export function prestige(): void {
  const gain = credGain();
  if (gain < 1) return;
  if (!confirm(`Get reinstated? You reset cash, ops, upgrades and missions, but gain ${gain} Credibility (+${gain * 10}% income) and ${gain} favors. Allies, perks, medals and story are kept.`)) return;
  const keep = {
    cred: S.cred + gain, life: S.life, favors: S.favors + gain, perks: S.perks, allies: S.allies, ach: S.ach,
    stats: S.stats, story: S.story, cover: S.cover, mute: S.mute, popups: S.popups, buyAmt: S.buyAmt, bossKills: S.bossKills,
    choices: S.choices, arcStep: S.arcStep, arcsDone: S.arcsDone,
    grip: S.grip, listKnown: S.listKnown, attPeak: S.attPeak, cleanRecord: S.cleanRecord,
    episodesDone: S.episodesDone, seasonOpen: S.seasonOpen,
  };
  setState(Object.assign(fresh(), keep));
  S.stats.reinstated++;
  fillBoard();
  say(pick(LINES.prest)); toast("Reinstated", "+" + gain + " Credibility");
}

export const toggleSend = (uid: number): void => {
  const m = S.board.find(x => x.uid === uid);
  if (m) m.send = !m.send;
};
export { startMission };
