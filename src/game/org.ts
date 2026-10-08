import { S, KEEP_RATE, capFee, payClient } from "../state";
import { attTier, cps } from "../calc";
import { BOSSES } from "../data/bosses";
import { ERRANDS, GRIP_PERKS, TIERS, TIER_DOWN, TIER_UP, handlerFor, rollFixer } from "../data/org";
import { chime } from "../audio";
import { money, pick } from "../util";
import { say, toast } from "../ui/fx";
import { choiceBusy, showChoice } from "../ui/choice";
import { render } from "../ui/render";
import { checkBurn } from "./heat";

// ---- attention stages ----
let lastTier = 0;
/** Call after loading a save so the current stage isn't announced as news. */
export const syncTier = (): void => { lastTier = attTier(); };

/** Fixers come and go: when one moves on, another turns up asking something different. */
export function newFixer(): void { S.fixer = rollFixer(); }

/** Track the attention peak (fills in their dossier), the fixer on offer, and narrate stage changes. */
export function tickOrg(dt = 0): void {
  if (S.att > S.attPeak) S.attPeak = S.att;
  if (!S.fixer) newFixer();
  else { S.fixer.left -= dt; if (S.fixer.left <= 0) newFixer(); }
  const t = attTier();
  if (t === lastTier) return;
  const up = t > lastTier;
  const lines = (up ? TIER_UP : TIER_DOWN)[t];
  if (lines) say(pick(lines));
  if (up) toast("The Organization: " + TIERS[t].name, TIERS[t].note, "bad");
  lastTier = t;
}

// ---- their grip on you ----
/** Wear down the Organization's grip, announcing any perk you cross. */
export function reduceGrip(n: number): void {
  const before = S.grip;
  S.grip = Math.max(0, S.grip - n);
  for (const p of GRIP_PERKS) {
    if (before > p.at && S.grip <= p.at) {
      chime();
      toast("Their grip slips: " + p.name, p.desc, "good");
      say(`The Organization's hold on you loosens. ${p.name}: ${p.desc.toLowerCase()}.`);
    }
  }
}

// ---- the List ----
export const allBeaten = (): boolean => BOSSES.every(b => S.bossKills[b.id]);

export function learnName(id: string): void {
  if (S.listKnown[id]) return;
  const b = BOSSES.find(x => x.id === id);
  if (!b) return;
  S.listKnown[id] = true;
  toast("A name on the List", b.n, "story");
}

/** Simon sometimes passes you a name you haven't learned yet. */
export function simonTip(): void {
  const unknown = BOSSES.filter(b => !S.listKnown[b.id]);
  if (!unknown.length || Math.random() > 0.3) return;
  const b = pick(unknown);
  learnName(b.id);
  say(`Simon slides you a name on a napkin: ${b.n}. He doesn't say how he knows.`);
}

/** Every name crossed off: the burn is lifted. */
export function checkEnding(): void {
  if (S.cleanRecord || !allBeaten()) return;
  S.cleanRecord = true;
  S.favors += 15;
  chime();
  toast("The List is complete", "The burn is lifted. +15 favors and +25% income, forever.");
  say("You cross out the last name. The phone doesn't ring. For the first time in a long time, nobody is watching. Miami still has problems, though, and so do the people in it.");
}

// ---- handler errands ----
export function scheduleErrand(ms?: number): void {
  const wait = Math.max(90000, 240000 - S.att * 1500) + Math.random() * 60000;
  setTimeout(spawnErrand, ms ?? wait);
}

export function spawnErrand(): void {
  // Only once they're watching, and never over another decision.
  if (S.att < TIERS[1].min || choiceBusy()) { scheduleErrand(45000); return; }
  const e = pick(ERRANDS), who = handlerFor(S.life);
  const fee = capFee((cps() * 200 + 500) / KEEP_RATE);
  showChoice(
    `${who} has a job`,
    `${who} sends word through a middleman: ${e.n}. ${e.d} It pays ${money(fee)}.`,
    [
      ["Do the job as asked", () => {
        payClient(fee); S.favors += 2; S.att = Math.min(100, S.att + 10); S.stats.errands++;
        return `You do it clean. ${who} pays ${money(fee)} and remembers you were useful. They also remember where you live.`;
      }],
      ["Do it your own way", () => {
        S.stats.errands++;
        if (Math.random() < 0.5) {
          payClient(fee * 1.2); S.favors += 2; S.att = Math.max(0, S.att - 5); reduceGrip(3);
          return `It works, and you leave ${who} with less leverage than before. Paid ${money(fee * 1.2)}.`;
        }
        S.heat += 20; S.att = Math.min(100, S.att + 8);
        return `${who} finds out. They're not pleased, and your heat shows it.`;
      }],
      ["Refuse", () => {
        S.heat += 10; S.att = Math.min(100, S.att + 5); S.favors += 1;
        return `${who} doesn't take it well. You walk away your own man. +1 favor.`;
      }],
    ],
    () => { checkBurn(); render(); scheduleErrand(); },
  );
}
