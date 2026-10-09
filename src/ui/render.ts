import { S } from "../state";
import { REINSTATE_MIN, attNet, inFlashback, bossDef, bribeCost, bribeDrop, clickVal, cover, cps, credGain, heatNet, layAmt, tierDef } from "../calc";
import { FX_NAMES } from "../data/perks";
import { formatWait, money } from "../util";
import type { CaseAction } from "../types";
import { CASE_ACTIONS, MAX_LEADS, ROTATING } from "../data/caseActions";
import { actionBlock } from "../game/bosses";
import { loftBadges, markSeen, menuNew } from "./badges";
import { noticeOpen } from "./notice";
import { choiceOpen } from "./choice";
import { portrait, portraitScope } from "./portrait";
import { $ } from "./dom";
import { setText } from "./fx";
import { SECTIONS, panelHTML, patchLive, resetLive, titleOf, type TabId } from "./panels";
import { layBlocked } from "../game/heat";

let openModal: TabId | null = null;
export function showModal(id: TabId | null): void {
  openModal = id;
  $("modal").classList.toggle("open", id !== null);
  if (id) { $("modalTitle").textContent = titleOf(id); markSeen(id); }
  lastModal = "";
  render();
}

const last = new Map<string, string>();
let lastFx = "";
let faceFor = "";
let lastModal = "";

// ---- the case tile: stays on a tool while it's ready, and after you use it moves on to the next ready one in order,
// so over a fight you see every tool rather than the same couple. Spring the Trap has its own button.
let caseIdx = 0;
function pickCase(): CaseAction {
  if (!actionBlock(ROTATING[caseIdx])) return ROTATING[caseIdx];
  for (let i = 1; i < ROTATING.length; i++) {
    const n = (caseIdx + i) % ROTATING.length;
    if (!actionBlock(ROTATING[n])) { caseIdx = n; return ROTATING[n]; }
  }
  // nothing ready: show the one closest to being ready
  const cds = ROTATING.map((k, n) => [n, S.boss?.cd?.[k] || 0] as const).filter(([n, c]) => c > 0 && actionBlock(ROTATING[n])?.startsWith("Ready in"));
  cds.sort((x, y) => x[1] - y[1]);
  if (cds.length) caseIdx = cds[0][0];
  return ROTATING[caseIdx];
}

function updateCaseTile(): void {
  const tile = document.getElementById("rottile") as HTMLButtonElement | null;
  if (tile) tile.dataset.case = pickCase();
}

// ---- the tab title doubles as a status line, since an idle game mostly lives in a background tab
let lastTitle = "";
/** What the browser tab should say right now. */
export function tabTitle(): string {
  if (S.boss) return `(!) Case: ${bossDef()?.n ?? "encounter"} · ${Math.ceil(S.boss.left)}s`;
  if (noticeOpen() || choiceOpen()) return "(!) News waiting · Burned";
  return `${money(S.cash)} · Burned: Miami Idle`;
}

let titleAt = 0;
function paintTitle(): void {
  const t = tabTitle(), now = Date.now();
  // The cash figure changes every tick, so the plain title is refreshed once a second; alerts show at once.
  if (t !== lastTitle && (t.startsWith("(!)") !== lastTitle.startsWith("(!)") || now - titleAt >= 1000)) {
    document.title = t; lastTitle = t; titleAt = now;
  }
}

/** The bottom bar: Credibility, and how far this run is toward the next point. */
export function dockProgress(): { label: string; pct: number } {
  const g = credGain();
  // "Credibility 1 → 5": what you'd have if you reinstated once this run reaches the next point
  const label = `Credibility ${S.cred} → ${S.cred + g + 1}`;
  if (S.run < REINSTATE_MIN) return { label, pct: Math.min(1, S.run / REINSTATE_MIN) };
  const lo = g * g * 1e7, hi = (g + 1) * (g + 1) * 1e7;
  return { label, pct: Math.max(0, Math.min(1, (S.run - lo) / (hi - lo))) };
}

/** The dot on the menu button, and a NEW chip on each menu entry that has something new. */
function paintMenuNew(): void {
  const n = menuNew(), any = Object.keys(n).length > 0;
  $("dockMenu").classList.toggle("has-new", any);
  $("dockMenu").setAttribute("aria-label", any ? "Menu: something new" : "Menu");
}

/**
 * A little two-way bar under heat and attention: red out to the right when it's building, green out to the left
 * when it's cooling. `scale` is how many points per second fills a whole side.
 */
const netCache = new Map<string, string>();
function paintNet(id: string, net: number, scale: number): void {
  const flat = Math.abs(net) < 0.005;
  const txt = flat ? "steady" : `${net > 0 ? "▲ +" : "▼ −"}${Math.abs(net).toFixed(2)}/s`;
  const half = Math.min(1, Math.abs(net) / scale) * 50;
  const key = txt + half.toFixed(1);
  if (netCache.get(id) === key) return;
  netCache.set(id, key);
  const el = $(id), fill = $(id + "fill");
  setText($(id + "txt"), txt);
  el.classList.toggle("up", net > 0.005);
  el.classList.toggle("down", net < -0.005);
  fill.style.width = half + "%";
  fill.style.left = net >= 0 ? "50%" : `${50 - half}%`;
}

function paintDock(): void {
  paintNet("netheat", heatNet(), 4);
  paintNet("netatt", attNet(), 0.5);
  paintMenuNew();
  const d = dockProgress(), pct = Math.round(d.pct * 100);
  setText($("docklv"), d.label);
  setText($("dockpct"), pct + "%");
  $("dockfill").style.width = pct + "%";
}

export function render(): void {
  if (openModal) markSeen(openModal); // anything that turns up while you're looking at a screen is already seen
  document.body.classList.toggle("flashback", inFlashback());
  paintTitle();
  paintDock();
  setText($("cash"), money(S.cash));
  setText($("rate"), "+" + money(cps()) + "/s  ·  job: " + money(clickVal()));
  setText($("cred"), S.cred ? `Credibility ${S.cred} · ${cover().name} cover` : `${cover().name} cover`);
  const fx = Object.entries(S.fx).filter(([, v]) => v > 0)
    .map(([k, v]) => `<span class="chip">${FX_NAMES[k]} ${v >= 120 ? formatWait(v * 1000) : Math.ceil(v) + "s"}</span>`).join("");
  if (fx !== lastFx) { $("fx").innerHTML = fx; lastFx = fx; }
  setText($("heatnum"), Math.floor(S.heat) + "%");
  $("heatbar").style.width = Math.min(100, S.heat) + "%";
  setText($("attnum"), `${Math.floor(S.att)}% · ${tierDef().name}`);
  setText($("gripnum"), Math.ceil(S.grip) + "%");
  $("gripbar").style.width = S.grip + "%";
  $("attbar").style.width = Math.min(100, S.att) + "%";
  setText($("lay"), S.layCd > 0 ? `Lay Low (${Math.ceil(S.layCd)}s)` : `Lay Low (−${layAmt()} heat)`);
  $<HTMLButtonElement>("lay").disabled = S.layCd > 0 || layBlocked();
  setText($("bribe"), `${S.fixer ? (S.fixer.act ?? "Pay off") + " " + S.fixer.name : "Pay Off a Fixer"} (${money(bribeCost())}, −${bribeDrop()})`);
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
    if (faceFor !== bd.id) { portraitScope("boss"); $("bossface").innerHTML = portrait(bd.id, 64); faceFor = bd.id; }
    setText($("bossname"), bd.n);
    setText($("bossmech"), bd.mech);
    $("bosshp").style.width = Math.max(0, S.boss.hp / S.boss.max * 100) + "%";
    setText($("bosshptxt"), `Their cover: ${Math.max(0, Math.round(S.boss.hp / S.boss.max * 100))}% intact`);
    setText($("bosstime"), Math.ceil(S.boss.left) + "s left");
    const leads = S.boss.leads || 0;
    setText($("bossleads"), "●".repeat(leads) + "○".repeat(MAX_LEADS - leads));
    updateCaseTile();
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
    if (h !== lastModal) {
      // keep your place while a pop-up (the narrator, say) gets new lines
      const dlg = document.querySelector<HTMLElement>(".mdlg"), top = dlg?.scrollTop ?? 0;
      $("modalBody").innerHTML = h; lastModal = h;
      if (dlg) dlg.scrollTop = top;
    }
  }
  patchLive(document);
}
