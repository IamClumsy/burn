import { S, earn } from "../state";
import { devFundsOn } from "../dev";
import { MADELINE_DEATH_EP, NATE_DEATH_EP, madelineDies, nateDies } from "./nate";
import { attNet, cps, heatNet, inFlashback, openSeasons, owned, seasonLeft, waitingOn } from "../calc";
import { checkEnding, tickOrg } from "./org";
import { STORY } from "../data/story";
import { SEASON_GRIP } from "../data/org";
import { FLASHBACKS } from "../data/flashbacks";
import { fbState } from "../flashbackState";
import { arcAvailable } from "./arcs";
import { MEDALS } from "../data/medals";
import { chime } from "../audio";
import { pick } from "../util";
import { say as sayTag, toast } from "../ui/fx";
import { LINES, NATE_BEATS } from "../data/text";
import { choiceBusy, showChoice } from "../ui/choice";
import { checkAmbush, checkBurn, layLow } from "./heat";
import { fillBoard, resolveMission } from "./missions";
import { tickBoss } from "./bosses";
const say = (t: string): void => sayTag(t, "story");

let sec = 0;
const DEV_FUNDS = 1e18;

export function milestones(): void {
  checkEnding();
  fillBoard(); // the board is never left short, whatever happened to it
  if (S.intel < 1 && S.seasonOpen >= 3) {
    S.intel = 1;
    toast("Victor is gone", "Victor Stecker-Epps died on that boat, shot by Carla's sniper. Carla didn't survive the night either: Fiona got to her first. You get a new number for the same kind of favors: Simon Escher, a man you'd rather not need and who knows everything about the Organization.", "story");
    say("Victor's line goes silent. A few days later, an unfamiliar number calls. \"We should talk,\" says Simon.");
  }
  if (S.intel < 2 && S.episodesDone["711"]) {
    S.intel = 2;
    toast("Simon is gone", "Michael had to end it, and he didn't like it. Simon Escher is dead, and his number goes dead with him. Dani Pearce, now at a quiet post in Mumbai, quietly offers to take his place: same kind of favors, steadier hands.", "story");
    say("Simon's number is disconnected. A few days later, a message from Mumbai: \"If you need something, you know who to call.\"");
  }
  for (const f of FLASHBACKS) { // a flashback's teller offers it once its conditions are met
    const fb = fbState(f.id);
    if (!fb.offered && arcAvailable(f.arc) && S.seasonOpen >= (f.arc.season ?? 0)) { // after the Season's own card
      fb.offered = true;
      const o = f.offer(S);
      toast(o.title, o.text, "story");
      say(o.say);
    }
  }
  if (!S.madelineGone && S.episodesDone[MADELINE_DEATH_EP]) madelineDies(); // "Reckoning" is done
  if (!S.nateGone && S.episodesDone[NATE_DEATH_EP]) nateDies(); // "Shock Wave" is done: Nate's last scene
  if (!S.backupNudged && S.stats.time >= 7200) {
    S.backupNudged = true;
    toast("Back up your save", "Your game lives in this browser only. Use export at the bottom of the page to keep a copy, just in case.");
  }
  const waiting = waitingOn();
  if (waiting && !S.seen["wait" + waiting]) { // earned the next Season but haven't seen everything yet: say so once
    S.seen["wait" + waiting] = 1;
    toast(`Season ${waiting + 1} is waiting`, `You've earned it, but it opens once you've done every Season ${waiting} case (${seasonLeft(waiting)} left). Those cases will turn up more often now.`, "story");
  }
  const open = openSeasons();
  if (open > S.seasonOpen) {
    S.seasonOpen = open;
    // someone new is always after Michael: their grip on you starts over
    S.grip = 100;
    const foe = SEASON_GRIP[open] ?? "Someone new has your number.";
    toast(`Season ${open} cases are open`, `New clients are knocking, and the cases are getting bigger.\n\nTheir grip on you starts over: ${foe}`, "story");
    if (open === 6) toast("Season 6", "With Fiona in prison after turning herself in, Michael hasn't left the loft in days. The phone rings, and the crew is trying to keep things moving without her.", "story");
    say(`Word spreads. Season ${open} cases start turning up on your board.`);
    chime();
  }
  while (S.story < STORY.length && S.life >= STORY[S.story].at) {
    const i = S.story, s = STORY[i];
    // A decision needs the dialog free; try again next second if something else is open.
    if (s.choice && (choiceBusy() || S.boss)) break;
    S.story++; S.favors += s.fav;
    toast("Case File: " + s.t, s.x + " (+" + s.fav + " favors)", "story"); // the whole entry, not a clipped start
    say(s.x); chime();
    if (s.choice) {
      showChoice(s.t, s.choice.prompt, s.choice.options.map((o, k): [string, () => string] => [o.label, () => {
        S.choices[i] = k;
        if (o.fx.favors) S.favors += o.fx.favors;
        return o.result;
      }]));
    }
  }
  for (const a of MEDALS) {
    if (!S.ach.includes(a.id) && a.t(S)) {
      S.ach.push(a.id);
      toast("Medal: " + a.n, a.d); chime();
    }
  }
}

/** Seymour finally lets Michael go. */
export function tickBusy(dt: number): void {
  if (!S.busy) return;
  S.busy.left -= dt;
  if (S.busy.left > 0) return;
  const who = S.busy.who;
  S.busy = null;
  sayTag(`${who} finally lets you go. You've lost an afternoon, but you've got a favor and, somehow, a new handshake.`, "deal");
}

/** Nate comes back: his next story beat the first few times, otherwise a line about it. */
export function nateReturns(): void {
  S.nateAway = false;
  S.nateTimer = 600 + Math.random() * 900;
  if (S.nateStage < NATE_BEATS.length) {
    const beat = NATE_BEATS[S.nateStage++];
    toast(beat.title, beat.text);
    sayTag(beat.text, "crew");
    return;
  }
  const line = pick(LINES.nateBack);
  toast("Nate's back", line);
  sayTag(line, "crew");
}

/** Nate wanders off and wanders back on a random timer (20 to 60 minutes away), because it's Nate. */
export function tickNate(dt: number): void {
  if (!S.allies.nate) return;
  S.nateTimer -= dt;
  if (S.nateTimer > 0) return;
  if (S.nateAway) { nateReturns(); return; }
  S.nateAway = true;
  S.nateTimer = 1200 + Math.random() * 2400;
  const line = pick([...LINES.nateAway, ...(S.nateStage === 1 ? LINES.nateAwayVegas : []), ...(S.nateStage >= 2 ? LINES.nateAwayHome : [])]);
  toast("Nate wandered off", line);
  sayTag(line, "crew");
}

export function tick(dt: number): void {
  if (devFundsOn() && S.cash < DEV_FUNDS) S.cash = DEV_FUNDS; // the hidden developer switch: spendable cash, but lifetime earnings and unlocks untouched
  earn(cps() * dt);
  S.stats.time += dt;

  S.heat = Math.max(0, S.heat + heatNet() * dt);
  S.att = Math.max(0, Math.min(100, S.att + attNet() * dt));

  if (S.cleanRecord) { S.heat = 0; S.att = 0; } // the burn is lifted: heat and the Organization's attention stop for good
  if (S.layCd > 0) S.layCd = Math.max(0, S.layCd - dt);
  if (S.coverCd > 0) S.coverCd = Math.max(0, S.coverCd - dt);
  for (const k in S.fx) if (S.fx[k] > 0) S.fx[k] = Math.max(0, S.fx[k] - dt);
  for (const k in S.allyCd) if (S.allyCd[k] > 0) S.allyCd[k] = Math.max(0, S.allyCd[k] - dt);

  const flash = inFlashback(); // while Sam tells his story, everything else waits
  const speed = S.fx.fast > 0 ? 2 : 1;
  if (!S.boss) for (const m of [...S.active]) { if (!m.arc && flash) continue;  m.left -= dt * speed; if (m.left <= 0) resolveMission(m); } // missions wait while a case encounter is on

  if (Math.random() < Math.min(0.02, owned("tape") * 0.0004)) S.junk[pick(Object.keys(S.junk))]++;

  tickBoss(dt);
  if (!S.boss && !flash) { tickNate(dt); tickBusy(dt); } // Nate, and afternoons with Seymour, wait too
  tickOrg(S.boss || flash ? 0 : dt);

  if (S.upgs.h3 && S.heat >= 90) layLow();
  if (S.allies.madeline && S.heat >= 95) layLow();
  checkBurn(); checkAmbush();

  sec += dt;
  if (sec >= 1) { sec = 0; milestones(); }
}
