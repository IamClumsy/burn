import { S } from "../state";
import { bossDef, bribeCost, clickVal, cover, cps, layAmt, strikeDmg, tierDef } from "../calc";
import { FX_NAMES } from "../data/perks";
import { fmt, money } from "../util";
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
let lastModal = "";

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
  setText($("bribe"), `Pay Off a Fixer (${money(bribeCost())}, −40)`);
  $<HTMLButtonElement>("bribe").disabled = S.cash < bribeCost();

  const bd = bossDef();
  $("bosscard").style.display = bd ? "block" : "none";
  if (bd && S.boss) {
    setText($("bossname"), bd.n);
    setText($("bossmech"), bd.mech);
    $("bosshp").style.width = Math.max(0, S.boss.hp / S.boss.max * 100) + "%";
    setText($("bosshptxt"), `${fmt(Math.max(0, S.boss.hp))} / ${fmt(S.boss.max)} health`);
    setText($("bosstime"), Math.ceil(S.boss.left) + "s left");
    setText($("strike"), `STRIKE (${fmt(strikeDmg())} dmg)`);
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
