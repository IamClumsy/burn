import { S } from "../state";
import { bossDef, layAmt, layCdMax } from "../calc";
import { LINES } from "../data/text";
import { beep } from "../audio";
import { pick } from "../util";
import { flashBanner, say as sayTag, shake } from "../ui/fx";
import { fillBoard } from "./missions";
const say = (t: string): void => sayTag(t, "heat");

export const layBlocked = (): boolean => !!S.boss && !!bossDef()?.m.includes("nolay");

export function layLow(): void {
  if (S.layCd > 0 || layBlocked()) return;
  S.heat = Math.max(0, S.heat - layAmt());
  S.layCd = layCdMax();
  say("You swap cars twice and eat lunch somewhere with no windows. Heat drops.");
}

export function checkBurn(): void {
  if (S.heat < 100) return;
  S.cash *= 0.5; S.heat = 30; S.layCd = 0; S.stats.burns++;
  flashBanner("BURNED", "Half your cash is gone. Heat reset. Walk it off.");
  shake(); beep(150, 0.6, "sawtooth", 0.08, -100);
  say(pick(LINES.burn));
}

export function checkAmbush(): void {
  if (S.att < 100) return;
  S.cash *= 0.75; S.att = 35; S.active = []; S.stats.ambush++;
  fillBoard();
  flashBanner("AMBUSHED", "A quarter of your cash is gone and your missions fell apart.");
  shake(); beep(110, 0.7, "sawtooth", 0.08, -60);
  say(pick(LINES.ambush));
}
