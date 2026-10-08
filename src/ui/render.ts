import { S } from "../state";
import { bossDef, bribeCost, bribeDrop, clickVal, cover, cps, layAmt, tierDef } from "../calc";
import { FX_NAMES } from "../data/perks";
import { money } from "../util";
import type { CaseAction } from "../types";
import { CASE_ACTIONS, MAX_LEADS, ROTATING } from "../data/caseActions";
import { actionBlock } from "../game/bosses";
import { loftBadges } from "./badges";
import { portrait } from "./portrait";
import { $ } from "./dom";
import { setText } from "./fx";
import { SECTIONS, panelHTML, patchLive, resetLive, titleOf, type TabId } from "./panels";
import { layBlocked } from "../game/heat";

let openModal: TabId | null = null;
export function showModal(id: TabId | null): void {
  openModal = id;
  $("modal").classList.toggle("open", id !== null);
  if (id) $("modalTitle").textContent = titleOf(id);
  lastModal = "";
  render();
}

const last = new Map<string, string>();
let lastFx = "";
let faceFor = "";
let lastModal = "";

// ---- the rotating case tile: cycles through Michael's tools, skipping ones that aren't ready
const ROTATE_MS = 2200;
let rotIdx = 0, rotAt = 0, rotHover = false;

/** Move the tile on to the next tool that's ready (or just the next one, if none are). */
export function advanceCase(): void {
  rotAt = performance.now();
  for (let i = 1; i <= ROTATING.length; i++) {
    const n = (rotIdx + i) % ROTATING.length;
    if (!actionBlock(ROTATING[n])) { rotIdx = n; return; }
  }
  rotIdx = (rotIdx + 1) % ROTATING.length;
}

export function initCaseTile(): void {
  const t = document.getElementById("rottile");
  if (!t) return;
  t.addEventListener("mouseenter", () => { rotHover = true; });
  t.addEventListener("mouseleave", () => { rotHover = false; rotAt = performance.now(); });
}

function rotateCase(): void {
  const tile = document.getElementById("rottile") as HTMLButtonElement | null;
  if (!tile) return;
  const now = performance.now();
  const stuck = !!actionBlock(ROTATING[rotIdx]) && ROTATING.some(k => !actionBlock(k)); // current tool is cooling down, another is ready
  if ((!rotHover && now - rotAt >= ROTATE_MS) || (stuck && !rotHover)) advanceCase();
  const kind = ROTATING[rotIdx];
  if (tile.dataset.case !== kind) {
    tile.dataset.case = kind;
    tile.classList.remove("swap"); void tile.offsetWidth; tile.classList.add("swap");
  }
}

export function render(): void {
  setText($("cash"), money(S.cash));
  setText($("rate"), "+" + money(cps()) + "/s  ·  job: " + money(clickVal()));
  setText($("cred"), S.cred ? `Credibility ${S.cred} · ${cover().name} cover` : `${cover().name} cover`);
  const fx = Object.entries(S.fx).filter(([, v]) => v > 0)
    .map(([k, v]) => `<span class="chip">${FX_NAMES[k]} ${Math.ceil(v)}s</span>`).join("");
  if (fx !== lastFx) { $("fx").innerHTML = fx; lastFx = fx; }
  setText($("heatnum"), Math.floor(S.heat) + "%");
  $("heatbar").style.width = Math.min(100, S.heat) + "%";
  setText($("attnum"), `${Math.floor(S.att)}% · ${tierDef().name}`);
  setText($("gripnum"), Math.ceil(S.grip) + "%");
  $("gripbar").style.width = S.grip + "%";
  $("attbar").style.width = Math.min(100, S.att) + "%";
  setText($("lay"), S.layCd > 0 ? `Lay Low (${Math.ceil(S.layCd)}s)` : `Lay Low (−${layAmt()} heat)`);
  $<HTMLButtonElement>("lay").disabled = S.layCd > 0 || layBlocked();
  setText($("bribe"), `${S.fixer ? "Pay off " + S.fixer.name : "Pay Off a Fixer"} (${money(bribeCost())}, −${bribeDrop()})`);
  $<HTMLButtonElement>("bribe").disabled = S.cash < bribeCost();

  const jobBtn = $<HTMLButtonElement>("job");
  setText(jobBtn, S.busy ? `With ${S.busy.who} (${Math.ceil(S.busy.left)}s)` : "TAKE A JOB");
  jobBtn.disabled = !!S.busy;

  const badges = loftBadges();
  for (const id of ["crew", "cov", "gad", "fav"] as const) {
    const btn = $("lb-" + id);
    setText(btn.querySelector(".badge") as HTMLElement, badges[id].text);
    btn.classList.toggle("ready", badges[id].ready);
  }

  const bd = bossDef();
  $("bosscard").style.display = bd ? "block" : "none";
  if (bd && S.boss) {
    if (faceFor !== bd.id) { $("bossface").innerHTML = portrait(bd.id, 64); faceFor = bd.id; }
    setText($("bossname"), bd.n);
    setText($("bossmech"), bd.mech);
    $("bosshp").style.width = Math.max(0, S.boss.hp / S.boss.max * 100) + "%";
    setText($("bosshptxt"), `Their cover: ${Math.max(0, Math.round(S.boss.hp / S.boss.max * 100))}% intact`);
    setText($("bosstime"), Math.ceil(S.boss.left) + "s left");
    const leads = S.boss.leads || 0;
    setText($("bossleads"), "●".repeat(leads) + "○".repeat(MAX_LEADS - leads));
    rotateCase();
    document.querySelectorAll<HTMLButtonElement>("#bossacts [data-case]").forEach(btn => {
      const kind = btn.dataset.case as CaseAction, why = actionBlock(kind);
      const def = CASE_ACTIONS.find(a => a.id === kind)!, hint = def.hint;
      setText(btn.querySelector("b") as HTMLElement, def.name);
      btn.disabled = !!why;
      setText(btn.querySelector(".sub") as HTMLElement, why ?? hint);
    });
  }

  // Only touch a card's DOM when its structure changed; moving numbers are patched in place.
  resetLive();
  for (const [id] of SECTIONS) {
    const h = panelHTML(id);
    if (last.get(id) !== h) { $("sec-" + id).innerHTML = h; last.set(id, h); }
  }
  if (openModal) {
    const h = panelHTML(openModal);
    if (h !== lastModal) { $("modalBody").innerHTML = h; lastModal = h; }
  }
  patchLive(document);
}
