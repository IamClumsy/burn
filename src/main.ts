import "./styles.css";
import { S, earn } from "./state";
import { clickVal, heatMult } from "./calc";
import { pick, money } from "./util";
import { QUOTES } from "./data/text";
import { $ } from "./ui/dom";
import { floatText, say, toast } from "./ui/fx";
import { render, showModal } from "./ui/render";
import { buildLayout, type TabId } from "./ui/panels";
import { beep } from "./audio";
import { loadGame, save, wipeSave, exportSave, importSave } from "./persist";
import { tick } from "./game/tick";
import { checkBurn, layLow } from "./game/heat";
import { fillBoard, startMission } from "./game/missions";
import { strike } from "./game/bosses";
import { scheduleClient, scheduleEvent } from "./game/events";
import * as A from "./game/actions";

// ---- card clicks (delegated on mousedown, since cards re-render constantly)
const ACT: Record<string, (arg: string) => void> = {
  amt: a => { S.buyAmt = a === "max" ? "max" : (+a as 1 | 10); },
  gen: A.buyGen, upg: A.buyUpg, hire: A.hireAlly, ability: A.useAbility,
  cover: A.setCover, perk: A.buyPerk, contact: A.buyFavorFrom, craft: A.craft,
  start: a => startMission(+a), prestige: () => A.prestige(), send: a => A.toggleSend(+a),
};
const onAct = (e: MouseEvent) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>("[data-act]");
  if (!t || t.classList.contains("no") || (t as HTMLButtonElement).disabled) return;
  e.preventDefault();
  ACT[t.dataset.act!](t.dataset.arg!);
  render();
};
buildLayout($("sections"), $("toolbar"));
$("sections").addEventListener("mousedown", onAct);
$("modalBody").addEventListener("mousedown", onAct);

// ---- pop-ups
$("toolbar").addEventListener("click", e => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("[data-modal]");
  if (b) showModal(b.dataset.modal as TabId);
});
$("modalClose").addEventListener("click", () => showModal(null));
$("modal").addEventListener("mousedown", e => { if (e.target === $("modal")) showModal(null); });
document.addEventListener("keydown", e => { if (e.key === "Escape") showModal(null); });

// ---- always-on controls
$("job").addEventListener("click", e => {
  const v = clickVal();
  earn(v); S.heat += 4 * heatMult(); S.stats.clicks++;
  if (Math.random() < 0.15) S.junk[pick(Object.keys(S.junk))]++;
  floatText("+" + money(v), e.clientX - 20, e.clientY - 20);
  beep(500 + Math.random() * 120, 0.05, "square", 0.025);
  checkBurn(); render();
});
$("lay").addEventListener("click", () => { layLow(); render(); });
$("bribe").addEventListener("click", () => { A.payOffFixer(); render(); });
$("strike").addEventListener("click", e => { strike(e.clientX, e.clientY); render(); });

// ---- footer
const syncMute = () => { $("mute").textContent = "sound: " + (S.mute ? "off" : "on"); };
$("mute").addEventListener("click", () => { S.mute = !S.mute; syncMute(); });
$("wipe").addEventListener("click", () => { if (confirm("Wipe your save and start over?")) wipeSave(); });
$("export").addEventListener("click", exportSave);
$("import").addEventListener("click", () => {
  const c = prompt("Paste your save code:");
  if (!c) return;
  if (importSave(c)) { fillBoard(); toast("Save imported"); syncMute(); render(); }
  else alert("That code didn't work.");
});

// ---- boot
loadGame();
fillBoard();
syncMute();
say("Burned. No cash, no credit, no agency. Time to take a job.");
scheduleClient();
scheduleEvent();
render();

let last = Date.now();
setInterval(() => {
  const now = Date.now(), dt = Math.min(1, (now - last) / 1000);
  last = now;
  tick(dt);
  render();
}, 100);

setInterval(save, 2000);
window.addEventListener("beforeunload", save);
window.addEventListener("pagehide", save);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
setInterval(() => say(pick(QUOTES)), 35000);

// Dev-only console hook for manual testing (stripped from production builds).
if (import.meta.env.DEV) {
  import("./game/bosses").then(b => {
    Object.assign(window, { __burn: { get S() { return S; }, spawnBoss: b.spawnBoss, tick, render } });
  });
}
