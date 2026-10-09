import "./styles.css";
import { S, earn } from "./state";
import { clickVal, heatMult } from "./calc";
import { pick, money, setScientific } from "./util";
import { QUOTES } from "./data/text";
import { $ } from "./ui/dom";
import { floatText, say, toast } from "./ui/fx";
import { render, showModal } from "./ui/render";
import { returnFromAway } from "./game/offline";
import { initNotices, setNoticeGate } from "./ui/notice";
import { portrait, portraitScope } from "./ui/portrait";
import { buildLayout, type TabId } from "./ui/panels";
import { beep } from "./audio";
import { loadGame, save, wipeSave, exportSave, importSave } from "./persist";
import { tick } from "./game/tick";
import { checkBurn, layLow } from "./game/heat";
import { fillBoard, startMission } from "./game/missions";
import { startArc } from "./game/arcs";
import { bossAction } from "./game/bosses";
import type { CaseAction } from "./types";
import { scheduleClient, scheduleEvent } from "./game/events";
import { scheduleErrand, syncTier } from "./game/org";
import * as A from "./game/actions";

// ---- card clicks (delegated on mousedown, since cards re-render constantly)
const ACT: Record<string, (arg: string) => void> = {
  amt: a => { S.buyAmt = a === "max" ? "max" : (+a as 1 | 10 | 100); },
  gen: A.buyGen, upg: A.buyUpg, referral: () => A.buyReferral(), hire: A.hireAlly, ability: A.useAbility,
  cover: A.setCover, auto: A.toggleAuto, perk: A.buyPerk, contact: a => A.buyFavorFrom(a), hangout: () => A.buyFavorFrom("seymour", "hangout"), craft: A.craft,
  start: a => startMission(+a), arc: a => startArc(a), prestige: () => A.prestige(), send: a => A.toggleSend(+a),
  setting: a => setting(a),
};

/** The switches in Settings: sound, pop-ups, number style, and saves. */
function setting(what: string): void {
  if (what === "mute") S.mute = !S.mute;
  else if (what === "popups") S.popups = !S.popups;
  else if (what === "numfmt") { S.sci = !S.sci; setScientific(S.sci); }
  else if (what === "export") exportSave();
  else if (what === "wipe") { if (confirm("Wipe your save and start over?")) wipeSave(); }
  else if (what === "import") {
    const c = prompt("Paste your save code:");
    if (!c) return;
    if (importSave(c)) { fillBoard(); setScientific(S.sci); toast("Save imported", "Your game is loaded.", "good"); }
    else alert("That code didn't work.");
  }
}
const onAct = (e: MouseEvent) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>("[data-act]");
  if (!t || t.classList.contains("no") || (t as HTMLButtonElement).disabled) return;
  e.preventDefault();
  ACT[t.dataset.act!](t.dataset.arg!);
  render();
};
buildLayout($("sections"), null, $("bossacts"));
$("sections").addEventListener("mousedown", onAct);
$("modalBody").addEventListener("mousedown", onAct);

// ---- pop-ups
// Pop-ups open from the menu button and from the buttons inside The Loft.
document.addEventListener("click", e => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("[data-modal]");
  if (b) showModal(b.dataset.modal as TabId);
});
$("modalClose").addEventListener("click", () => showModal(null));

// FAQ search: hide questions that don't match, and sections left empty.
$("modalBody").addEventListener("input", e => {
  const t = e.target as HTMLInputElement;
  if (t.id !== "faqSearch") return;
  const term = t.value.trim().toLowerCase();
  const items = [...$("modalBody").querySelectorAll<HTMLElement>(".faqitem")];
  let shown = 0;
  for (const it of items) {
    const hit = !term || (it.textContent || "").toLowerCase().includes(term);
    it.style.display = hit ? "" : "none";
    if (term && hit) (it as HTMLDetailsElement).open = true;
    if (hit) shown++;
  }
  $("modalBody").querySelectorAll<HTMLElement>(".faqsec").forEach(h => {
    let n = h.nextElementSibling, any = false;
    while (n && n.classList.contains("faqitem")) { if ((n as HTMLElement).style.display !== "none") any = true; n = n.nextElementSibling; }
    h.style.display = any ? "" : "none";
  });
  $("faqNone").style.display = shown ? "none" : "block";
});
$("modal").addEventListener("mousedown", e => { if (e.target === $("modal")) showModal(null); });
document.addEventListener("keydown", e => { if (e.key === "Escape") showModal(null); });

// ---- always-on controls
$("job").addEventListener("click", e => {
  if (S.busy) return;
  const v = clickVal();
  earn(v); S.heat += 4 * heatMult(); S.stats.clicks++;
  if (Math.random() < 0.15) S.junk[pick(Object.keys(S.junk))]++;
  floatText("+" + money(v), e.clientX - 20, e.clientY - 20);
  beep(500 + Math.random() * 120, 0.05, "square", 0.025);
  checkBurn(); render();
});
$("lay").addEventListener("click", () => { layLow(); render(); });
$("bribe").addEventListener("click", () => { A.payOffFixer(); render(); });
$("bossacts").addEventListener("click", e => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-case]");
  if (!b || b.disabled) return;
  bossAction(b.dataset.case as CaseAction, e.clientX, e.clientY);
  render();
});

// ---- the dock: back to top, narration, and the settings that used to live in the footer
$("dockTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
$("dockLog").addEventListener("click", () => {
  const vo = $("voiceover") as HTMLDetailsElement;
  vo.open = !vo.open;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ---- boot
initNotices();
setNoticeGate(() => !!S.boss); // nothing else interrupts a case encounter
portraitScope("loft"); $("loftface").innerHTML = portrait("michael", 54);
loadGame();
fillBoard();
setScientific(S.sci);
portraitScope("dock"); $("dockface").innerHTML = portrait("michael", 56);
say("Burned. No cash, no credit, no agency. Time to take a job.");
scheduleClient();
scheduleEvent();
scheduleErrand();
syncTier();
render();

let last = Date.now();
setInterval(() => {
  const now = Date.now(), gap = (now - last) / 1000;
  last = now;
  // A throttled background tab or a sleeping laptop leaves a long gap: catch up on all of it, not just a second.
  if (gap > 2) returnFromAway(gap); else tick(gap);
  render();
}, 100);

setInterval(save, 2000);
window.addEventListener("beforeunload", save);
window.addEventListener("pagehide", save);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
setInterval(() => say(pick(QUOTES)), 35000);

// Dev-only console hook for manual testing (stripped from production builds).
if (import.meta.env.DEV) {
  Promise.all([import("./game/bosses"), import("./game/org"), import("./game/events")]).then(([b, o, ev]) => {
    Object.assign(window, { __burn: { get S() { return S; }, spawnBoss: b.spawnBoss, spawnErrand: o.spawnErrand, spawnClient: ev.spawnClient, tick, render } });
  });
}
