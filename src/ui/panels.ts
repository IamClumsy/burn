import { S } from "../state";
import type { ContactId } from "../types";
import {
  REINSTATE_MIN, allyAvailable, referralCost, referralMult, upgradeUnlocked, baseIncome, tierDef, allyFree, allyHere, awayWhy, bossView, bulkCost, cps, buyN, cover, credGain, genMult, incomeMult, missionReward, owned, perk, perkCost,
  contactPrice, favorsLeft, hangOutPrice, nextFavorIn, succChance,
  samSharp, grossLife, openSeasons, seasonLeft, waitingOn, inFlashback, slotOpen, wouldBeHelped, SOLO_SLOTS, HELP_SLOTS, recipeCash, HEAT_COOLING, attCooling, attGain, attNet, bossDef, choiceMult, gripAtt, heatFactors, heatGain, heatMult, heatNet, opsNoise,
} from "../calc";
import { GENS } from "../data/ops";
import { REFERRAL, UPGS } from "../data/upgrades";
import { ALLIES } from "../data/allies";
import { COVERS } from "../data/covers";
import { BOSSES } from "../data/bosses";
import { PERKS, JUNK, RECIPES } from "../data/perks";
import { STORY } from "../data/story";
import { MEDALS } from "../data/medals";
import { ARCS } from "../data/arcs";
import { MISSIONS, SEASON_UNLOCK, epLabel, episodeOf, seasonOf, seasonsOpen } from "../data/missions";
import { EP_NOTES } from "../data/episodeNotes";
import { CASE_ACTIONS } from "../data/caseActions";
import { FAQ } from "../data/faq";
import { portrait, portraitScope } from "./portrait";
import { FAVORS_PER_DAY, bossGapText } from "../data/pacing";
import { DOSSIER, GRIP_PERKS } from "../data/org";
import { arcAvailable, arcStep, stepDur } from "../game/arcs";
import { FLASHBACK_BOSSES, SAM_ACTS, SAM_ARC, SAM_BEATS, SAM_ARC_ID } from "../data/samAxe";
import { CONTACTS, contactFace, contactFor } from "../data/contacts";
import { fmt, formatWait, money } from "../util";
import { AUTOS, autoCut } from "../data/automation";
import { saveStatus } from "../saveStatus";
import { menuNew } from "./badges";
import { narration, type NarrationEntry, type NarrationTag } from "./fx";
import { EPILOGUE, EPILOGUE_CLOSE, EPILOGUE_TITLE } from "../data/epilogue";

export type TabId = "faq" | "list" | "ops" | "upg" | "mis" | "crew" | "gad" | "cov" | "fav" | "rogue" | "story" | "file" | "stats" | "auto" | "options" | "settings" | "narrator" | "heatinfo" | "med" | "rep" | "fosa";

/** Everyday play: always visible as cards. */
export const SECTIONS: [TabId, string][] = [
  ["mis", "Missions"], ["upg", "Upgrades"], ["ops", "Operations"],
];

/** Reference and rare screens: opened as pop-ups from the menu. */
export const MODALS: [TabId, string][] = [
  ["crew", "Crew"], ["cov", "Covers"], ["gad", "Gadgets"], ["fav", "Favors"],
  ["list", "The List"], ["file", "Michael's File"], ["stats", "Stats"], ["auto", "Automation"], ["story", "Case File"], ["rogue", "Rogues"], ["med", "Medals"], ["rep", "Reinstate"], ["faq", "FAQ"],
  ["options", "Menu"], ["settings", "Settings"], ["fosa", "The Fall of Sam Axe"], ["narrator", "Narrator"], ["heatinfo", "Heat and Attention"],
];

/** What the menu button offers. Crew, Covers, Gadgets and Favors stay in The Loft, so they aren't here. */
export const MENU: TabId[] = ["list", "file", "stats", "auto", "story", "rogue", "med", "rep", "faq", "fosa", "settings"];



export const titleOf = (id: TabId): string => [...SECTIONS, ...MODALS].find(([i]) => i === id)![1];

/** Build the static card shells and the case-action buttons once at startup. */
export function buildLayout(host: HTMLElement, _toolbar?: HTMLElement | null, actions?: HTMLElement | null): void {
  if (actions) {
    const tile = (a: (typeof CASE_ACTIONS)[number], extra = "") =>
      `<button data-case="${a.id}"${extra}><b>${a.name}</b><span class="sub">${a.hint}</span></button>`;
    // The tools Michael rotates through share one tile; Spring the Trap keeps its own button.
    actions.innerHTML = tile(CASE_ACTIONS[0], ' id="rottile"') + tile(CASE_ACTIONS.find(a => a.id === "trap")!);
  }
  host.innerHTML = SECTIONS.map(([id, t]) =>
    `<div class="card sec sec-${id}"><h2>${t}</h2><div class="secbody" id="sec-${id}"></div></div>`).join("");
}

// ---- live values ----
// Countdowns and progress bars change every tick. Rebuilding a whole card for that is wasteful and
// can stall taps on slower devices, so those values are written into placeholders in place instead.
const liveText = new Map<string, string>();
const liveBars = new Map<string, number>();
export function resetLive(): void { liveText.clear(); liveBars.clear(); }
/** A text placeholder whose content is patched in place each tick. */
const lv = (id: string, text: string): string => { liveText.set(id, text); return `<span data-live="${id}"></span>`; };
/** Attributes for a progress bar whose width is patched in place each tick. */
const lvBar = (id: string, pct: number): string => { liveBars.set(id, pct); return `data-bar="${id}" style="width:0%"`; };
export function patchLive(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>("[data-live]").forEach(el => {
    const t = liveText.get(el.dataset.live!);
    if (t !== undefined && el.textContent !== t) el.textContent = t;
  });
  root.querySelectorAll<HTMLElement>("[data-bar]").forEach(el => {
    const p = liveBars.get(el.dataset.bar!);
    if (p === undefined) return;
    const w = p + "%";
    if (el.style.width !== w) el.style.width = w;
  });
}

/** "Client: Javier · Up against: Graham Pyne", for whichever of the two the episode has. */
function castLine(ep: string | undefined): string {
  const n = ep ? EP_NOTES[ep] : undefined;
  if (!n) return "";
  const bits = [n.client && `Client: ${n.client}`, n.villain && `Up against: ${n.villain}`, n.friend && `${n.friend.role}: ${n.friend.name}`].filter(Boolean);
  return bits.length ? `<div class="small" style="color:var(--text)">${bits.join(" · ")}</div>` : "";
}

function item(act: string, arg: string | number, can: boolean, title: string, desc: string, right: string, cls = "", lead = ""): string {
  const left = `<div><b>${title}</b><span>${desc}</span></div>`;
  return `<div class="item ${can ? "can" : "no"} ${cls}" data-act="${act}" data-arg="${arg}">
    ${lead ? `<div class="who">${lead}${left}</div>` : left}<div style="text-align:right">${right}</div></div>`;
}

const costAndOwn = (cost: string, own: string | number) =>
  `<div style="display:flex;gap:12px;align-items:center"><div class="cost">${cost}</div><div class="own">${own}</div></div>`;

function ops(): string {
  let h = `<div class="small" style="margin-bottom:8px">Odd jobs bring in ${money(baseIncome())}/s on their own, even with nothing running. Operations add to that.</div><div class="tabs">` + ([1, 10, 100, "max"] as const).map(a =>
    `<button class="tab ${S.buyAmt === a ? "active" : ""}" data-act="amt" data-arg="${a}">Buy ${a === "max" ? "max" : "×" + a}</button>`).join("") + `</div>`;
  GENS.forEach((g, i) => {
    if (i > 0 && S.life < GENS[i - 1].base * 0.5 && !owned(g.id)) return;
    const n = buyN(g), c = bulkCost(g, n);
    h += item("gen", g.id, n > 0 && S.cash >= c, g.name, `${g.desc} · ${fmt(g.cps * genMult(g.id) * incomeMult())}/s each`,
      costAndOwn(n === 0 ? "Maxed" : `${n > 1 ? "×" + n + " · " : ""}${money(c)}`, n === 0 ? `${owned(g.id)} (max)` : owned(g.id)));
  });
  return h;
}

function upgrades(): string {
  const open = UPGS.filter(u => !S.upgs[u.id] && upgradeUnlocked(u));
  const av = open.filter(u => S.life >= u.cost * 0.3).slice(0, 9);
  const rows = av.map(u => ({ cost: u.cost, html: item("upg", u.id, S.cash >= u.cost, u.name, u.desc, `<div class="cost">${money(u.cost)}</div>`) }));

  // The one that never runs out sits in the list at its price, like everything else.
  if (S.life >= referralCost() * REFERRAL.unlockFraction) {
    rows.push({ cost: referralCost(), html: item("referral", "x", S.cash >= referralCost(), `${REFERRAL.name} (level ${S.referrals})`,
      `Each level makes all income ×${REFERRAL.gain}. Now ×${referralMult().toFixed(2)}. You can always buy another.`,
      `<div class="cost">${money(referralCost())}</div>`) });
  }
  const h = rows.sort((x, y) => x.cost - y.cost).map(r => r.html).join("");

  // Nothing available? Say what's coming, so the card is never a dead end.
  if (!h) {
    const next = UPGS.filter(u => !S.upgs[u.id])
      .map(u => ({ u, why: !upgradeUnlocked(u) ? `once you own ${u.needs!.owned} ${GENS.find(g => g.id === u.needs!.gen)!.name}` : `at ${money(u.cost * 0.3)} lifetime earnings` }))
      .sort((x, y) => x.u.cost - y.u.cost)[0];
    return next
      ? `<div class="small">Nothing new right now. Next up: <b style="color:var(--text)">${next.u.name}</b> ${next.why}.</div>`
      : `<div class="small">Nothing new right now. Keep earning.</div>`;
  }
  return h;
}

function missions(): string {
  const done = Object.keys(S.episodesDone).length;
  let h = `<div class="small mishead">Case files: <b style="color:var(--text)">${done} of ${MISSIONS.length}</b> episodes · Season ${openSeasons()} cases open</div>
    <div class="small" style="margin-bottom:8px">Up to 3 missions at once, plus a fourth slot that only takes a case an ally is helping with (${S.active.length}/${SOLO_SLOTS + HELP_SLOTS}). Clients pay well. Michael keeps what he needs for expenses and hands the rest back. Ask an ally for help for +25% success (or +1 favor on cases that can't fail). They're busy until it ends.</div>`;
  const open = ARCS.filter(arcAvailable);
  if (waitingOn()) h += `<div class="box" style="border-color:var(--gold)"><b>Season ${waitingOn() + 1} is waiting.</b> <div class="small">You've earned enough, but it opens once you've done every Season ${waitingOn()} case (${seasonLeft(waitingOn())} left). Those are turning up more often now. Look for the ones without a Seen tag.</div></div>`;
  if (inFlashback()) h += `<div class="box"><b>Sam is telling his story.</b> <div class="small">Everything else waits: no new cases, no clients, no visitors, and your other jobs and the Organization hold still until he finishes.</div></div>`;
  if (open.length) {
    h += `<h2>Open Cases</h2>` + open.map(a => {
      const k = arcStep(a), st = a.steps[k];
      return `<div class="box"><b>${a.title}</b> <span class="chip">Step ${k + 1} of ${a.steps.length}</span>
        <div class="small">${a.blurb}</div>
        <div class="small" style="color:var(--text)">Next: ${st.n} · ${stepDur(a, st.dur)}s · +${st.heat} heat${S.allies[a.ally] ? "" : ""}</div>
        <div class="btns"><button data-act="arc" data-arg="${a.id}" ${slotOpen(allyFree(a.ally)) ? "" : "disabled"}>Start this step</button>${a.id === SAM_ARC_ID && k === 0 && !S.samChoices.bowling ? `<span class="small" style="display:inline-flex;align-items:center;gap:6px">${portrait("michaelpre", 28)}<button data-act="bowling">Remember Mike at the bowling alley</button></span>` : ""}</div></div>`;
    }).join("");
  }
  if (S.active.length) {
    h += `<h2 style="margin-top:12px">In Progress</h2>` + S.active.map(m => `<div class="box"><div class="row"><b>${m.n}${m.kid ? ' <span class="chip">Never fails</span>' : ""}${m.ep && S.episodesDone[m.ep] ? ' <span class="chip">Seen</span>' : ""}</b><span class="small">${lv("t" + m.uid, `${Math.ceil(m.left)}s · ${Math.round(m.chance * 100)}%`)}</span></div>
      ${m.ep ? `<div class="small">${epLabel(m.ep, m.epTitle || "")}</div>` : ""}${castLine(m.ep)}
      <div class="bar"><i class="mbar" ${lvBar("b" + m.uid, (1 - m.left / m.dur) * 100)}></i></div>
      <span class="small">Pays ${money(m.reward)} · +${m.fav} favor${m.sent ? " · " + ALLIES.find(a => a.id === m.sent)!.name + " is helping" : ""}</span></div>`).join("");
  }
  h += `<h2 style="margin-top:12px">Board</h2>`;
  h += S.board.map(m => {
    const al = ALLIES.find(a => a.id === m.ally)!, free = allyFree(m.ally), first = al.name.split(" ")[0];
    const out = S.active.find(a => a.sent === m.ally);
    // Say exactly why the ally can't go, so a greyed-out button is never a mystery.
    const why = !S.allies[m.ally] ? `Hire ${first} in Crew to ask ${al.she ? "her" : "him"} for help (${m.kid ? "+1 favor" : "+25%"})`
      : out ? `${first} is helping with "${out.n}", free in ${lv("w" + m.uid, Math.ceil(out.left) + "s")}`
      : !allyHere(m.ally) ? `${first} ${awayWhy(m.ally)?.short ?? "is away"}. This one can't start without ${al.she ? "her" : "him"}.` : "";
    const blocked = !!awayWhy(m.ally);
    return `<div class="box"><b>${m.n}${m.kid ? ' <span class="chip">Never fails</span>' : ""}${m.ep && S.episodesDone[m.ep] ? ' <span class="chip">Seen</span>' : ""}</b>${m.ep ? `<div class="small" style="margin-bottom:2px">${epLabel(m.ep, m.epTitle || "")}</div>` : ""}${castLine(m.ep)}<div class="small" style="margin-top:2px">${Math.round(succChance(m) * 100)}% success · ${m.dur}s · pays ${money(missionReward(m))} · +${m.fav} favor · +${m.heat} heat</div>
      ${why ? `<div class="small" style="margin-top:4px;color:var(--gold)">${why}</div>` : ""}
      <div class="btns">${S.allies[m.ally] ? `<button class="${m.send && free ? "on" : ""}" data-act="send" data-arg="${m.uid}" ${free ? "" : "disabled"}>${m.send && free ? "☑" : "☐"} Ask ${first} for help (${m.kid ? "+1 favor" : "+25%"})</button>` : ""}
      <button data-act="start" data-arg="${m.uid}" ${!slotOpen(wouldBeHelped(m)) || blocked || inFlashback() ? "disabled" : ""}>Start mission</button></div></div>`;
  }).join("");
  return h;
}

/** "3 of 4 left today", or when they'll deal again. */
function favorStatus(id: ContactId): string {
  const left = favorsLeft(id);
  return left > 0 ? `${left} of ${FAVORS_PER_DAY} left today` : `Tapped out for today. Back in ${formatWait(nextFavorIn(id))}`;
}

function contactItems(): string {
  return CONTACTS.map(c0 => { const c = contactFor(c0, S.intel); return item("contact", c.id, S.cash >= contactPrice(c.id) && favorsLeft(c.id) > 0, `${c.name}: ${c.kind}`,
    `${c.pitch} ${favorStatus(c.id)}.${S.allies.barry && c.id !== "barry" ? " Barry negotiates 25% off." : ""}`,
    `<div class="cost">${money(contactPrice(c.id))}</div>`, "", portrait(contactFace(c.id, S.intel), 44)); }).join("") +
    item("hangout", "seymour", !S.busy && S.cash >= hangOutPrice() && favorsLeft("seymour") > 0, "Seymour Talbot: Spend the afternoon",
      "He'd sooner be paid in company: he wants you to teach him a move, or come see something he's proud of. About half the cash, but Michael's tied up for 30 to 45 seconds and can't take jobs. Counts toward his daily limit.",
      `<div class="cost">${money(hangOutPrice())}</div>`, "", portrait("seymour", 44));
}

function crew(): string {
  const contact = CONTACTS.map(c0 => { const c = contactFor(c0, S.intel); return `<div class="box"><div class="who">${portrait(contactFace(c.id, S.intel), 64)}<div><div class="row"><b>${c.name}</b><span class="small">Frienemy: ${c.kind.toLowerCase()}</span></div>
    <div class="small">${c.bio}</div>
    <div class="btns"><button data-act="contact" data-arg="${c.id}" ${S.cash >= contactPrice(c.id) && favorsLeft(c.id) > 0 ? "" : "disabled"}>Buy a favor — ${money(contactPrice(c.id))}</button>
    ${c.id === "seymour" ? `<button data-act="hangout" data-arg="seymour" ${!S.busy && S.cash >= hangOutPrice() && favorsLeft("seymour") > 0 ? "" : "disabled"}>Spend the afternoon — ${money(hangOutPrice())}</button>` : ""}</div>
    <div class="small" style="margin-top:4px">${favorStatus(c.id)}</div></div></div></div>`; }).join("");
  return contact + ALLIES.map(a => {
    if (!S.allies[a.id] && a.gateEp && a.debutEp && !S.episodesDone[a.debutEp]) { // not met yet: no name, no story spoilers
      return item("hire", a.id, false, "?????", "Someone you haven't met yet. They'll show up when the story gets there.", `<div class="small">?????</div>`, "", portrait(a.id, 48, false));
    }
    if (!S.allies[a.id] && !allyAvailable(a)) {
      return item("hire", a.id, false, a.name, `${a.bio} Doesn't join the story until Season ${a.debut}.`, `<div class="small">Season ${a.debut}</div>`, "", portrait(a.id, 48, false));
    }
    if (!S.allies[a.id]) return item("hire", a.id, S.cash >= a.cost, "Hire " + a.name, `${a.bio} Perk: ${a.perk}`, `<div class="cost">${money(a.cost)}</div>`, "", portrait(a.id, 48));
    const cd = Math.ceil(S.allyCd[a.id] || 0), busy = S.active.some(m => m.sent === a.id), here = allyHere(a.id);
    const status = !here ? (awayWhy(a.id)?.long ?? "Away") : busy ? "On a mission" : "Available";
    return `<div class="box"${here ? "" : ' style="opacity:.6"'}><div class="who">${portrait(a.id, 64)}<div><div class="row"><b>${a.name}</b><span class="small">${status}</span></div>
      <div class="small">${a.bio}</div><div class="small">Perk: ${a.perk}</div>
      <div class="btns"><button data-act="ability" data-arg="${a.id}" ${cd > 0 || !here ? "disabled" : ""}>${a.ab} — ${!here ? "Away" : cd > 0 ? lv("cd" + a.id, cd + "s") : "Ready"}</button>
      ${a.id === "sam" && samSharp() ? `<div class="small" style="margin-top:4px;color:var(--gold)">La Barbilla: heat −25%, and his ability pays 50% more and comes back a third sooner.</div>` : ""}
      ${a.id === "nate" && !here && S.nateAway ? `<button data-act="callnate" ${S.favors >= 1 ? "" : "disabled"}>Call him back — 1 favor</button>` : ""}</div>
      <div class="small" style="margin-top:4px">${a.abDesc}</div></div></div></div>`;
  }).join("");
}

function gadgets(): string {
  let h = `<div class="small">Junk drops from jobs and Duct-Tape Gadgets.</div><div style="margin:8px 0 12px">` +
    Object.entries(JUNK).map(([k, n]) => `<span class="chip">${n}: ${S.junk[k]}</span>`).join("") + `</div>`;
  h += RECIPES.map(r => {
    const cash = recipeCash(r), under = r.id === "sub" && S.fx.sub > 0;
    const ok = Object.entries(r.need).every(([k, v]) => S.junk[k] >= v) && S.cash >= cash && !under;
    const price = Object.entries(r.need).map(([k, v]) => v + " " + JUNK[k].toLowerCase()).join(", ") + (cash ? ` + ${money(cash)}` : "");
    const title = r.rare ? `${r.name} <span class="chip rare">RARE</span>` : r.name;
    return item("craft", r.id, ok, title, under ? `${r.desc} (active: ${formatWait(S.fx.sub * 1000)} left)` : r.desc, `<span class="small">${price}</span>`, r.rare ? "rare" : "");
  }).join("");
  return h;
}

function covers(): string {
  return `<div class="small" style="margin-bottom:8px">Change cover anytime (20s between changes${S.coverCd > 0 ? `, ${lv("cvcd", Math.ceil(S.coverCd) + "s")} left` : ""}).</div>` +
    COVERS.map(c => {
      const locked = S.life < c.unlock || !!(c.arc && !S.arcsDone[c.arc]);
      return item("cover", c.id, !locked && cover().id !== c.id && S.coverCd <= 0, c.name, c.desc,
        locked ? `<span class="small">${c.arc ? "Close The Fall of Sam Axe" : "Unlocks at " + money(c.unlock)}</span>` : (S.cover === c.id ? '<span class="cost">Active</span>' : ""),
        S.cover === c.id ? "on" : "");
    }).join("");
}

function favors(): string {
  return `<div class="small" style="margin-bottom:8px">Favors: <b style="color:var(--gold)">${S.favors}</b>. Perks last through every reinstatement.</div>` +
    contactItems() +
    PERKS.map(p => item("perk", p.id, perk(p.id) < 10 && S.favors >= perkCost(p.id), p.name, p.desc,
      costAndOwn(perk(p.id) >= 10 ? "MAX" : perkCost(p.id) + " fav", perk(p.id)))).join("");
}

function rogues(): string {
  return `<div class="small" style="margin-bottom:8px">Bosses turn up about every ${bossGapText()}, in the order of The List. Outmaneuver each one once for a permanent +3% income. Foes turn up as your full earnings (the whole fee, not just Michael's 10%) reach their amount. Next one in about ${Math.ceil(Math.max(0, S.bossCd) / 60)} min.</div>` +
    BOSSES.map(b0 => {
      const b = bossView(b0), open = grossLife() >= b.at, k = S.bossKills[b.id] || 0;
      return `<div class="box" style="${open ? "" : "opacity:.5"}"><div class="who">${portrait(b.id, 56, open)}<div><div class="row"><b>${open ? b.n : "???"}</b><span class="small">${open ? "Outmaneuvered " + k + "×" : `Season ${seasonsOpen(b.at)} · at ${money(b.at)}`}</span></div>
        ${open ? `<div class="small">${b.title}</div><div class="small" style="color:var(--gold)">${b.mech}</div>
          ${k > 0 ? `<div class="small" style="margin-top:6px;color:var(--text)"><b>File:</b> ${b.file}</div>` : `<div class="small" style="margin-top:6px">Outmaneuver them once to open their file.</div>`}` : ""}</div></div></div>`;
    }).join("") + flashbackRogues();
}

/** Have you opened The Fall of Sam Axe (started it, or finished it)? Its foe stays hidden until then. */
const samStarted = (): boolean => (S.arcStep[SAM_ARC_ID] || 0) > 0 || !!S.arcsDone[SAM_ARC_ID] || S.samReplay || !!S.active.some(m => m.arc?.id === SAM_ARC_ID);

/** The one-off foes of Sam's flashback. They're not on The List and never turn up on their own, but they get a place here. */
function flashbackRogues(): string {
  if (!samStarted()) return ""; // hidden until you open The Fall of Sam Axe
  return `<h2 style="margin-top:14px">The Fall of Sam Axe</h2>` + FLASHBACK_BOSSES.map(b => {
    const done = !!S.arcsDone[SAM_ARC_ID];
    return `<div class="box" style="border-color:var(--gold);${done ? "" : "opacity:.6"}"><div class="who">${portrait(b.id, 56, done)}<div><div class="row"><b>${done ? b.n : "???"}</b><span class="small">${done ? "Beaten, once and for all" : "Waiting in Sam's story"}</span></div>
      ${done ? `<div class="small">${b.title}</div><div class="small" style="color:var(--gold)">He never turns up again: he belongs to The Fall of Sam Axe, not to The List.</div>
        <div class="small" style="margin-top:6px;color:var(--text)"><b>File:</b> ${b.file}</div>` : `<div class="small" style="margin-top:6px">Someone from a story Sam hasn't finished telling yet.</div>`}</div></div></div>`;
  }).join("");
}

function story(): string {
  const beats = STORY.slice(0, S.story).map((s, i) => {
    const k = S.choices[i], pick = s.choice && k !== undefined ? s.choice.options[k] : null;
    return `<div class="box"><b>${i + 1}. ${s.t}</b><div class="small" style="font-size:13px;color:var(--text)">${s.x}</div>
      ${pick ? `<div class="small" style="margin-top:6px;color:var(--gold)">You chose: ${pick.label}. ${pick.result}</div>` : ""}</div>`;
  }).join("");

  const closed = ARCS.filter(a => S.arcsDone[a.id]);
  const cases = closed.length
    ? `<h2 style="margin-top:12px">Closed Cases</h2>` + closed.map(a =>
        `<div class="box"><b>${a.title}</b><div class="small" style="font-size:13px;color:var(--text)">${a.epilogue}</div></div>`).join("")
    : "";

  const tips = Object.keys(S.episodesDone).sort().filter(k => EP_NOTES[k]);
  const notebook = tips.length
    ? `<h2 style="margin-top:12px">Spy notebook (${tips.length})</h2>` + tips.map(k =>
        `<div class="box"><div class="small">Season ${seasonOf(k)}, Episode ${episodeOf(k)}</div><div class="small" style="font-size:13px;color:var(--text)">${EP_NOTES[k].tip}</div></div>`).join("")
    : "";

  const next = S.story < STORY.length
    ? `<div class="small">Next lead at ${money(STORY[S.story].at)} lifetime earnings.</div>`
    : `<div class="small">The file is closed. The game isn't. Keep stacking.</div>`;

  const empty = !beats ? `<div class="small">Nothing yet. Earn some money and the story finds you.</div>` : "";
  const epilogue = S.cleanRecord
    ? `<h2 style="margin-top:12px">${EPILOGUE_TITLE}</h2>` + EPILOGUE.map(e => `<div class="box"><b>${e.who}</b><div class="small" style="font-size:13px;color:var(--text)">${e.text}</div></div>`).join("") + `<div class="small" style="margin:6px 0 10px">${EPILOGUE_CLOSE}</div>`
    : "";
  return empty + beats + cases + epilogue + next + notebook;
}

function medals(): string {
  const st = S.stats, t = Math.floor(st.time / 60);
  return `<div class="grid">` + MEDALS.map(a => `<div class="medal ${S.ach.includes(a.id) ? "got" : ""}"><b>${a.n}</b>${a.d}</div>`).join("") + `</div>
    <p class="small">Each medal gives +2% income. ${S.ach.length}/${MEDALS.length} earned.</p>
    <p class="small">Jobs ${st.clicks} · Burns ${st.burns} · Missions won ${st.mDone}/lost ${st.mFail} · Returned to clients ${money(st.returned)} · Kid cases ${st.kidMissions} · Ambushes ${st.ambush} · Gadgets ${st.crafted} · Lifetime take ${money(S.life)} · Lifetime earnings (full fees) ${money(grossLife())} · Played ${t} min</p>`;
}

function automation(): string {
  const rows = AUTOS.map(a => {
    const open = S.cred >= a.need, owned = !!S.autoOwned[a.id], on = !!S.auto[a.id];
    const cut = Math.round(autoCut(a.id, S.cred) * 100);
    const cost = owned
      ? `Costs you ${cut}% of the ${a.id === "clients" ? "fee" : "mission pay"} each time it works, and less with every Credibility point.`
      : `One-time fee: ${a.fee} favors. Then ${cut}% of the ${a.id === "clients" ? "fee" : "mission pay"} each time it works, and less with every Credibility point.`;
    const state = !open ? `Unlocks at Credibility ${a.need}` : !owned ? "Not bought yet" : on ? "On" : "Off";
    const button = !open ? `Needs Credibility ${a.need} (you have ${S.cred})` : !owned ? `Buy for ${a.fee} favors${S.favors < a.fee ? ` (you have ${S.favors})` : ""}` : on ? "Turn off" : "Turn on";
    const can = open && (owned || S.favors >= a.fee);
    return `<div class="box"><div class="row"><b>${a.name}</b><span class="small">${state}</span></div>
      <div class="small">${a.desc}</div><div class="small" style="margin-top:3px;color:var(--gold)">${cost}</div>
      <div class="btns"><button data-act="auto" data-arg="${a.id}" ${can ? "" : "disabled"}>${button}</button></div></div>`;
  }).join("");
  return `<div class="small" style="margin-bottom:8px">Credibility from Reinstating unlocks help with the chores. Each one costs favors to buy, and takes a cut when it works. Switch them on or off any time once they're yours.</div>${rows}`;
}

/** "+0.42/s" or "−0.80/s". */
const perSec = (n: number): string => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}/s`;

/** How heat and the Organization's attention move, and exactly why, so the numbers are never a mystery. */
function heatInfo(): string {
  const noise = opsNoise(), factors = heatFactors(), jam = S.fx.jam > 0 || S.fx.sub > 0;
  const hm = heatMult(), gain = heatGain(), net = heatNet();
  const heatEta = net > 0 ? `At this rate you reach 100% heat (a burn) in about ${formatWait((100 - S.heat) / net * 1000)}.`
    : S.heat > 0 ? `You're cooling, and heat hits zero in about ${formatWait(S.heat / -net * 1000)}.` : "You're at zero and staying there.";
  const row = (label: string, value: string, note = "") => `<div class="drow"><span class="dlabel">${label}</span><span class="dtext">${value}${note ? ` <span class="small">${note}</span>` : ""}</span></div>`;
  const heatRows = [
    row("Your operations", `${fmt(noise)} noise × 0.012 = ${perSec(noise * 0.012)}`, "each operation you own, the later ones louder"),
    ...factors.map(f => row(f.label, `×${f.v.toFixed(2)}`)),
    jam ? row("Door-Cam Jammer", `heat gain stopped for ${Math.ceil(S.fx.jam)}s`) : "",
    S.fx.sub > 0 ? row("Submarine", `nothing builds for ${formatWait(S.fx.sub * 1000)}`, "heat and attention both stand still") : "",
    row("Heat built", `${perSec(gain)}`, jam ? "" : `(×${hm.toFixed(2)} in all)`),
    row("Cooling", perSec(-HEAT_COOLING), "the world forgets a little every second"),
    row("Net heat", `<b style="color:${net > 0 ? "var(--bad)" : "var(--sea)"}">${perSec(net)}</b>`),
  ].join("");
  const ag = attGain(), ac = attCooling(), an = attNet();
  const attEta = an > 0 ? `At this rate attention reaches 100% (an ambush) in about ${formatWait((100 - S.att) / an * 1000)}.`
    : S.att > 0 ? `It's falling, and reaches zero in about ${formatWait(S.att / -an * 1000)}.` : "It's at zero and staying there.";
  const cm = choiceMult("att"), gm = gripAtt();
  const attRows = [
    row("Base", "+0.05/s", "they're always a little curious"),
    row("Your heat", `${S.heat.toFixed(0)}% × 0.004 = ${perSec(S.heat * 0.004)}`, "the hotter you are, the more they notice"),
    cm !== 1 ? row("Your story choices", `×${cm.toFixed(2)}`) : "",
    gm !== 1 ? row("Their grip on you", `×${gm.toFixed(2)}`, "loosening it slows them") : "",
    row("Attention built", perSec(ag)),
    row("Lying low", ac ? perSec(-ac) : "none", ac ? "heat is under 20%, so they lose interest" : "only while heat is under 20%"),
    row("Net attention", `<b style="color:${an > 0 ? "var(--bad)" : "var(--sea)"}">${perSec(an)}</b>`),
  ].join("");
  const boss = S.boss ? `<div class="small" style="margin-top:8px;color:var(--gold)">A case is on right now, and it changes this: ${bossDef()?.mech ?? ""}</div>` : "";
  return `<div class="small" style="margin-bottom:8px">Heat is how loud you are right now. The Organization's attention is how closely they're watching. They feed each other: heat builds attention, and each attention stage makes your operations build heat faster.</div>
    <h2>Heat: ${S.heat.toFixed(0)}%</h2><div class="dfile">${heatRows}</div><div class="small" style="margin:6px 0 12px">${heatEta}</div>
    <h2>The Organization's attention: ${S.att.toFixed(0)}% (${tierDef().name})</h2><div class="dfile">${attRows}</div><div class="small" style="margin:6px 0 12px">${attEta}</div>
    ${boss}
    <h2>What helps</h2>
    <ul class="small" style="margin:6px 0 0 16px;padding:0;color:var(--text)">
      <li>Lay Low: knocks heat down at once.</li>
      <li>Quiet Methods, Cooler Head, a quieter cover, and Sam: all slow how fast heat builds.</li>
      <li>Hands-Off Handler upgrade (and Madeline): lay low for you at 90% and 95%.</li>
      <li>Door-Cam Jammer gadget: no heat gain for three minutes.</li>
      <li>A fixer, Madeline's Family Dinner or a Bug Sweeper: take attention off directly.</li>
      <li>Wearing down their grip: it makes attention build slower.</li>
    </ul>`;
}

/** What each kind of line is called in the Narrator pop-up (blank means it's just narration). */
const NARR_TAGS: Record<NarrationTag, string> = {
  note: "", quote: "", mission: "Mission", fail: "Setback", boss: "Case", heat: "Heat", org: "Organization",
  crew: "Crew", story: "Story", away: "While you were away", client: "Client", deal: "Deal", decision: "Decision",
};

/** The narrator's history in a pop-up: bigger type, colored by what it's about, with the episode on mission lines. */
function narrator(): string {
  const lines = narration();
  if (!lines.length) return `<div class="small">Nothing yet. The narrator is waiting for something to happen.</div>`;
  const one = (e: NarrationEntry, i: number) => {
    const label = NARR_TAGS[e.tag], season = e.meta?.season;
    const chips = (label ? `<span class="nl-tag">${label}</span>` : "") + (e.meta?.label ? `<span class="nl-ep${season ? " s" + season : ""}">${e.meta.label}</span>` : "");
    return `<div class="nl nl-${e.tag}${i === 0 ? " now" : ""}${season ? " s" + season : ""}">${chips ? `<div class="nl-head">${chips}</div>` : ""}<p>${e.text}</p></div>`;
  };
  return `<div class="narr">${lines.map(one).join("")}</div>
    <div class="small" style="margin-top:8px">The last ${lines.length} things the narrator said, newest at the top.</div>`;
}

/** The menu behind the hamburger button. */
function options(): string {
  const fresh = menuNew();
  return `<div class="menugrid">${MENU.filter(id => id !== "fosa" || S.arcsDone[SAM_ARC_ID]).map(id => `<button data-modal="${id}">${titleOf(id)}${fresh[id] ? `<span class="newchip">NEW</span>` : ""}</button>`).join("")}</div>`;
}

/** Sam's story, once it's been told: how you told it, and a way to hear it again. Only in the menu after it's closed. */
function fosa(): string {
  const a = SAM_ARC;
  const told = SAM_ACTS.map((act, i) => {
    const k = S.samChoices[i], o = k !== undefined ? act.options[k] : null;
    return `<div class="box"><b>${act.title}</b>${o ? `<div class="small" style="color:var(--gold)">You told it: ${o.label}</div><div class="small" style="color:var(--text)">${o.result}</div>` : `<div class="small">Not yet answered this time.</div>`}</div>`;
  }).join("");
  const asides = Object.entries(SAM_BEATS).map(([step, beat]) => {
    const k = S.samChoices["beat" + step], o = k ? beat.options[k - 1] : null;
    return o ? `<div class="small" style="margin-top:4px"><b>${beat.title.replace(/^.*?: /, "")}:</b> ${o.label}. <span style="color:var(--dim)">${o.result}</span></div>` : "";
  }).join("");
  const again = S.samReplay
    ? `<div class="small" style="margin-top:8px">Sam is telling it again. Look for it under Open Cases.</div>`
    : `<div class="btns"><button data-act="replay" ${S.boss || S.active.length ? "disabled" : ""}>Hear it again</button></div>
       <div class="small" style="margin-top:6px">${S.boss || S.active.length ? "Finish what's running first. " : ""}Everything else waits while Sam tells it, and your answers can change. The favors, the medal and the cover were yours the first time.</div>`;
  return `<div class="small" style="margin-bottom:8px">${a.epilogue}</div><h2>How you told it</h2>${told}${asides ? `<div class="box"><b>And in between</b>${asides}</div>` : ""}${again}`;
}

/** Sound, saves and the other switches that used to live in the footer. */
function settings(): string {
  const row = (label: string, state: string, act: string) => `<div class="drow"><span class="dlabel">${label}</span><span class="dtext"><button data-act="setting" data-arg="${act}">${state}</button></span></div>`;
  const st = saveStatus();
  return `<div class="dfile">
    ${row("Sound", S.mute ? "Off" : "On", "mute")}
    ${row("Pop-ups", S.popups ? "On, in the middle of the screen" : "Off, small corner notes instead", "popups")}
    ${row("Big numbers", S.sci ? "Scientific (1.23e9)" : "Letters (1.23B)", "numfmt")}
  </div>
  <h2 style="margin-top:14px">Your save</h2>
  <div class="small" id="saveinfo" style="margin-bottom:8px${st.warn ? ";color:var(--gold)" : ""}">${st.text}</div>
  <div class="btns"><button data-act="setting" data-arg="export">Export save</button><button data-act="setting" data-arg="import">Import save</button><button data-act="setting" data-arg="wipe">Wipe save</button></div>
  <div class="small" style="margin-top:8px">The game saves itself every couple of seconds, in this browser. Export gives you a code to move it somewhere else.</div>`;
}

function reinstate(): string {
  const g = credGain(), c = cps();
  const keep = `You reset cash, ops, upgrades and missions. You keep perks, medals, story and covers, and your allies too, except anyone who joined late in the story (like Madeline and Jesse), who you hire again.`;
  const after = S.cred + g;
  // the next Credibility point arrives when this run's earnings reach (g + 1)^2 x 10M
  const nextAt = Math.max(REINSTATE_MIN, (g + 1) ** 2 * 1e7), left = Math.max(0, nextAt - S.run);
  const eta = c > 0 ? ` At ${money(c)}/s that's about ${formatWait(left / c * 1000)}.` : "";
  const fi = S.allies.fiona ? `<li>Fiona disappears for one to four hours after each reinstatement. Her missions wait, and so does her income bonus.</li>` : "";
  const preview = `<div class="box" style="margin:8px 0"><b>The preview</b>
    <ul class="small" style="margin:6px 0 0 16px;padding:0;color:var(--text)">
      <li>Credibility: ${S.cred} now (+${S.cred * 10}% income) → <b>${after}</b> after (+${after * 10}% income).</li>
      <li>Favors: +${g}.</li>
      <li>This run so far: ${money(S.run)}${S.stats.bestRun ? `. Your best run: ${money(S.stats.bestRun)}` : ""}.</li>
      <li>${g >= 1 ? `Next Credibility point at ${money(nextAt)} this run: ${money(left)} to go.${eta}` : `Qualifies at ${money(REINSTATE_MIN)} this run: ${money(Math.max(0, REINSTATE_MIN - S.run))} to go.${eta}`}</li>
      ${fi}
    </ul>
    ${g >= 1 && left < nextAt * 0.1 ? `<div class="small" style="margin-top:6px;color:var(--gold)">Another point is close. You'll earn more by waiting a little.</div>` : ""}</div>`;
  return `<p class="small">Call in the favor that gets you reinstated. ${keep}</p>
    <p>${g >= 1 ? `Reset for <b style="color:var(--gold)">+${g} Credibility</b> (each point +10% income, forever) and +${g} favors.` : `Earn ${money(REINSTATE_MIN)} in a single run to qualify (${money(S.run)} so far).`}</p>
    ${preview}
    <div class="btns"><button data-act="prestige" ${g < 1 ? "disabled" : ""}>Get Reinstated</button></div>`;
}

/** The numbers worth comparing between runs. */
function statsView(): string {
  const st = S.stats;
  const row = (label: string, value: string) => `<div class="drow"><span class="dlabel">${label}</span><span class="dtext">${value}</span></div>`;
  const wins = Object.values(S.bossKills).reduce((a, n) => a + n, 0);
  const boss = BOSSES.filter(b => S.bossKills[b.id]).length;
  const favorsBought = st.seymourFavors + st.simonFavors + st.barryFavors;
  return `<div class="small" style="margin-bottom:8px">Everything you've done, across every run.</div>
    <div class="dfile">
      ${row("Time played", formatWait(st.time * 1000))}
      ${row("Earned, all runs", money(S.life))}
      ${row("This run", money(S.run))}
      ${row("Best single run", money(st.bestRun))}
      ${row("Income right now", money(cps()) + "/s")}
      ${row("Credibility", `${S.cred} (+${S.cred * 10}% income)`)}
      ${row("Reinstated", String(st.reinstated))}
      ${row("Missions won / lost", `${st.mDone} / ${st.mFail}`)}
      ${row("Case files seen", `${Object.keys(S.episodesDone).length} of ${MISSIONS.length}`)}
      ${row("Kid cases (never fail)", String(st.kidMissions))}
      ${row("Handed back to people who needed it", money(st.returned))}
      ${row("Rogues beaten", `${boss} of ${BOSSES.length} (${wins} wins in all)`)}
      ${row("Burns / ambushes", `${st.burns} / ${st.ambush}`)}
      ${row("Handler errands", String(st.errands))}
      ${row("Favors bought", String(favorsBought))}
      ${row("Gadgets crafted", String(st.crafted))}
      ${row("Medals", `${S.ach.length} of ${MEDALS.length}`)}
      ${row("Longest away", st.longestAway ? formatWait(st.longestAway * 1000) : "none yet")}
    </div>`;
}

function theList(): string {
  const next = GRIP_PERKS.find(p => S.grip > p.at);
  let h = `<div class="small" style="margin-bottom:8px">The Organization burned you, and they still hold a grip on you. Wins wear it down: missions, bosses, closed cases, and dealing with handlers on your own terms. When a new Season opens, someone new is after you and it starts over at 100%.</div>
    <div class="box"><div class="row"><b>Their grip on you</b><span class="small">${Math.ceil(S.grip)}%</span></div>
      <div class="bar"><i style="width:${S.grip}%;background:linear-gradient(90deg,var(--sea),#7b5cff)"></i></div>
      ${GRIP_PERKS.map(p => `<div class="small" style="color:${S.grip <= p.at ? "var(--gold)" : "var(--dim)"}">${S.grip <= p.at ? "✓" : "○"} At ${p.at}%: ${p.name}, ${p.desc}</div>`).join("")}
      ${next ? `<div class="small" style="margin-top:4px">Next perk at ${next.at}%.</div>` : ""}</div>`;

  const beaten = BOSSES.filter(b => S.bossKills[b.id]).length;
  h += `<h2 style="margin-top:12px">The List (${beaten}/${BOSSES.length} crossed off)</h2>`;
  h += BOSSES.map(b => {
    const done = S.bossKills[b.id], known = S.listKnown[b.id];
    const note = bossView(b).listNote;
    const status = done ? "Crossed off" : known ? "Known, not yet faced" + (note ? `. ${note}` : "") : "Unknown";
    return `<div class="row small" style="padding:3px 0;${done ? "color:var(--gold)" : known ? "color:var(--text)" : "color:var(--dim)"}"><span style="display:flex;align-items:center;gap:8px">${portrait(b.id, 30, !!(known || done))}${done ? "✓ " : "○ "}${known || done ? b.n : "??????"}</span><span>${status}</span></div>`;
  }).join("");
  if (samStarted()) { // the flashback's one-off foe, noted beside the List but never counted on it
    const done = !!S.arcsDone[SAM_ARC_ID];
    h += `<div class="small" style="margin-top:10px;color:var(--dim)">The Fall of Sam Axe:</div>` + FLASHBACK_BOSSES.map(b =>
      `<div class="row small" style="padding:3px 0;${done ? "color:var(--gold)" : "color:var(--dim)"}"><span style="display:flex;align-items:center;gap:8px">${portrait(b.id, 30, done)}${done ? "✓ " : "○ "}${done ? b.n : "??????"}</span><span>${done ? "Beaten in Sam's story" : "Waiting in Sam's story"}</span></div>`).join("");
  }
  h += S.cleanRecord
    ? `<div class="box" style="margin-top:8px;border-color:var(--gold)"><b>The burn is lifted.</b><div class="small" style="color:var(--text)">Every name is crossed off. You're clear, and your income is up 25% for good.</div></div>`
    : `<div class="small" style="margin-top:6px">Beat each of them to cross them off. Your intel contact sometimes passes you a name. Finish the List to lift the burn.</div>`;

  return h;
}

/** Michael's file as the Organization keeps it. More of it fills in as their attention on you peaks. */
/** The next thing to unlock of each kind, by lifetime earnings, with how long it takes at the current rate. */
function nextUnlocks(): { what: string; name: string; at: number; have: number; right?: string }[] {
  const out: { what: string; name: string; at: number; have: number; right?: string }[] = [];
  const season = SEASON_UNLOCK.findIndex(t => t > S.life);
  if (waitingOn()) out.push({ what: "Season", name: `Season ${waitingOn() + 1} cases (finish Season ${waitingOn()}: ${seasonLeft(waitingOn())} left)`, at: SEASON_UNLOCK[waitingOn()], have: S.life, right: `${seasonLeft(waitingOn())} cases to go` });
  else if (season > 0) out.push({ what: "Season", name: `Season ${season + 1} cases`, at: SEASON_UNLOCK[season], have: S.life });
  const foe = BOSSES.filter(b => b.at > grossLife()).sort((a, b) => a.at - b.at)[0];
  if (foe) out.push({ what: "Rogue", name: "A new foe, Season " + seasonsOpen(foe.at), at: foe.at, have: grossLife() });
  const cover = COVERS.filter(c => !c.arc && c.unlock > S.life).sort((a, b) => a.unlock - b.unlock)[0];
  if (cover) out.push({ what: "Cover", name: cover.name, at: cover.unlock, have: S.life });
  if (S.story < STORY.length) out.push({ what: "Story", name: "The next Case File lead", at: STORY[S.story].at, have: S.life });
  return out;
}

function file(): string {
  const t = tierDef();
  const rate = cps();
  const lifetime = `<div class="box"><div class="row"><b>Lifetime earnings</b><span class="small" style="color:var(--gold)">${money(grossLife())}</span></div>
    <div class="row small"><span>Michael's take (10%)</span><span>${money(S.life)}</span></div>
    ${nextUnlocks().map(u => `<div class="row small" style="padding:2px 0"><span>${u.what}: ${u.name}</span><span>${u.right ?? `${money(u.at)}${rate > 0 ? ` · about ${formatWait(Math.max(0, (u.at - u.have) / rate) * 1000)}` : ""}`}</span></div>`).join("")}
    <div class="small" style="margin-top:4px;color:var(--dim)">Lifetime earnings are the full fees, including what you hand back, and they open the foes on The List. Michael's take opens Seasons, covers and story leads. Both keep counting across Reinstates. The waits assume your income stays where it is now, so they only get shorter as you grow.</div></div>`;
  // Where they have you right now sits in the file itself, between Status and Former Occupation.
  const standing = `<div class="drow"><span class="dlabel">Organization Status</span><span class="dtext"><b>${t.name}</b>. ${t.note}</span></div>`;
  const rows = DOSSIER.map(d => (S.attPeak >= d.peak
    ? `<div class="drow"><span class="dlabel">${d.label}</span><span class="dtext">${d.text}</span></div>`
    : `<div class="drow redacted"><span class="dlabel">██████ ████</span><span class="dtext">████████ ██████ <span class="small">(Reached at ${d.peak}% attention)</span></span></div>`) + (d.label === "Status" ? standing : "")).join("");
  const learned = DOSSIER.filter(d => S.attPeak >= d.peak).length;
  return `<div class="filehead"><div class="who">${portrait("michael", 72)}<div><div class="dstamp">Burned</div>
      <div class="small">Organization file, ${learned} of ${DOSSIER.length} entries filled in</div></div></div></div>
    <div class="dfile">${rows}</div>
    <div class="small" style="margin-top:8px">The more attention you draw from the Organization, the more of this they fill in. The file doesn't shrink, even when your attention drops.</div>
    <h2 style="margin-top:14px">Earnings</h2>${lifetime}`;
}

function faq(): string {
  return `<input id="faqSearch" type="search" placeholder="Search the FAQ" aria-label="Search the FAQ"
      style="width:100%;margin-bottom:10px;padding:8px 10px;border-radius:8px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font:inherit">` +
    FAQ.map(sec => `<h2 class="faqsec" style="margin-top:12px">${sec.title}</h2>` +
      sec.items.map(it => `<details class="faqitem"><summary>${it.q}</summary><div class="faqa">${it.a()}</div></details>`).join("")).join("") +
    `<div class="small" id="faqNone" style="display:none;margin-top:8px">No matches. Try a different word.</div>`;
}

const VIEWS: Record<TabId, () => string> = {
  faq,
  list: theList,
  ops, upg: upgrades, mis: missions, crew, gad: gadgets, cov: covers, fav: favors, rogue: rogues, file, stats: statsView, auto: automation, options, settings, fosa, narrator, heatinfo: heatInfo, story, med: medals, rep: reinstate,
};

export const panelHTML = (tab: TabId): string => { portraitScope(tab); return VIEWS[tab](); };
