import { S } from "../state";
import {
  REINSTATE_MIN, allyAvailable, referralCost, referralMult, upgradeUnlocked, baseIncome, tierDef, allyFree, allyHere, bulkCost, buyN, cover, credGain, genMult, incomeMult, missionReward, owned, perk, perkCost,
  contactPrice, favorsLeft, hangOutPrice, nextFavorIn, succChance,
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
import { MISSIONS, epLabel, episodeOf, seasonOf, seasonsOpen } from "../data/missions";
import { EP_NOTES } from "../data/episodeNotes";
import { CASE_ACTIONS } from "../data/caseActions";
import { FAQ } from "../data/faq";
import { portrait } from "./portrait";
import { FAVORS_PER_DAY, bossGapText } from "../data/pacing";
import { DOSSIER, GRIP_PERKS } from "../data/org";
import { arcAvailable, arcStep } from "../game/arcs";
import { CONTACTS } from "../data/contacts";
import { fmt, formatWait, money } from "../util";

export type TabId = "faq" | "list" | "ops" | "upg" | "mis" | "crew" | "gad" | "cov" | "fav" | "rogue" | "story" | "med" | "rep";

/** Everyday play: always visible as cards. */
export const SECTIONS: [TabId, string][] = [
  ["mis", "Missions"], ["upg", "Upgrades"], ["ops", "Operations"],
];

/** Reference and rare screens: opened as pop-ups from the toolbar. */
export const MODALS: [TabId, string][] = [
  ["crew", "Crew"], ["cov", "Covers"], ["gad", "Gadgets"], ["fav", "Favors"],
  ["list", "The List"], ["story", "Case File"], ["rogue", "Rogues"], ["med", "Medals"], ["rep", "Reinstate"], ["faq", "FAQ"],
];

/** These open from buttons in The Loft card, so they're left off the toolbar. */
const LOFT_ONLY: TabId[] = ["crew", "cov", "gad", "fav"];

export const titleOf = (id: TabId): string => [...SECTIONS, ...MODALS].find(([i]) => i === id)![1];

/** Build the static card shells, the toolbar and the case-action buttons once at startup. */
export function buildLayout(host: HTMLElement, toolbar: HTMLElement, actions?: HTMLElement | null): void {
  if (actions) {
    const tile = (a: (typeof CASE_ACTIONS)[number], extra = "") =>
      `<button data-case="${a.id}"${extra}><b>${a.name}</b><span class="sub">${a.hint}</span></button>`;
    // The tools Michael rotates through share one tile; Spring the Trap keeps its own button.
    actions.innerHTML = tile(CASE_ACTIONS[0], ' id="rottile"') + tile(CASE_ACTIONS.find(a => a.id === "trap")!);
  }
  host.innerHTML = SECTIONS.map(([id, t]) =>
    `<div class="card sec sec-${id}"><h2>${t}</h2><div class="secbody" id="sec-${id}"></div></div>`).join("");
  toolbar.innerHTML = MODALS.filter(([id]) => !LOFT_ONLY.includes(id))
    .map(([id, t]) => `<button data-modal="${id}">${t}</button>`).join("");
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
    h += item("gen", g.id, S.cash >= c, g.name, `${g.desc} · ${fmt(g.cps * genMult(g.id) * incomeMult())}/s each`,
      costAndOwn(`${n > 1 ? "×" + n + " · " : ""}${money(c)}`, owned(g.id)));
  });
  return h;
}

function upgrades(): string {
  const open = UPGS.filter(u => !S.upgs[u.id] && upgradeUnlocked(u));
  const av = open.filter(u => S.life >= u.cost * 0.3).slice(0, 9);
  let h = av.map(u => item("upg", u.id, S.cash >= u.cost, u.name, u.desc, `<div class="cost">${money(u.cost)}</div>`)).join("");

  // The one that never runs out.
  if (S.life >= referralCost() * REFERRAL.unlockFraction) {
    h += item("referral", "x", S.cash >= referralCost(), `${REFERRAL.name} (level ${S.referrals})`,
      `Each level makes all income ×${REFERRAL.gain}. Now ×${referralMult().toFixed(2)}. You can always buy another.`,
      `<div class="cost">${money(referralCost())}</div>`);
  }

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
  let h = `<div class="small" style="margin-bottom:6px">Case files: <b style="color:var(--text)">${done} of ${MISSIONS.length}</b> episodes · Season ${seasonsOpen(S.life)} cases open</div>
    <div class="small" style="margin-bottom:8px">Up to 3 missions at once (${S.active.length}/3). Clients pay well. Michael keeps what he needs for expenses and hands the rest back. Ask an ally for help for +25% success (or +1 favor on cases that can't fail). They're busy until it ends.</div>`;
  const open = ARCS.filter(arcAvailable);
  if (open.length) {
    h += `<h2>Open Cases</h2>` + open.map(a => {
      const k = arcStep(a), st = a.steps[k];
      return `<div class="box"><b>${a.title}</b> <span class="chip">Step ${k + 1} of ${a.steps.length}</span>
        <div class="small">${a.blurb}</div>
        <div class="small" style="color:var(--text)">Next: ${st.n} · ${st.dur}s · +${st.heat} heat${S.allies[a.ally] ? "" : ""}</div>
        <div class="btns"><button data-act="arc" data-arg="${a.id}" ${S.active.length >= 3 ? "disabled" : ""}>Start this step</button></div></div>`;
    }).join("");
  }
  if (S.active.length) {
    h += `<h2 style="margin-top:12px">In Progress</h2>` + S.active.map(m => `<div class="box"><div class="row"><b>${m.n}</b><span class="small">${lv("t" + m.uid, `${Math.ceil(m.left)}s · ${Math.round(m.chance * 100)}%`)}</span></div>
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
      : !allyHere(m.ally) ? `${first} has wandered off` : "";
    return `<div class="box"><b>${m.n}${m.kid ? ' <span class="chip">Never fails</span>' : ""}${m.ep && S.episodesDone[m.ep] ? ' <span class="chip">Seen</span>' : ""}</b>${m.ep ? `<div class="small" style="margin-bottom:2px">${epLabel(m.ep, m.epTitle || "")}</div>` : ""}${castLine(m.ep)}<div class="small" style="margin-top:2px">${Math.round(succChance(m) * 100)}% success · ${m.dur}s · pays ${money(missionReward(m))} · +${m.fav} favor · +${m.heat} heat</div>
      ${why ? `<div class="small" style="margin-top:4px;color:var(--gold)">${why}</div>` : ""}
      <div class="btns">${S.allies[m.ally] ? `<button class="${m.send && free ? "on" : ""}" data-act="send" data-arg="${m.uid}" ${free ? "" : "disabled"}>${m.send && free ? "☑" : "☐"} Ask ${first} for help (${m.kid ? "+1 favor" : "+25%"})</button>` : ""}
      <button data-act="start" data-arg="${m.uid}" ${S.active.length >= 3 ? "disabled" : ""}>Start mission</button></div></div>`;
  }).join("");
  return h;
}

/** "3 of 4 left today", or when they'll deal again. */
function favorStatus(id: "seymour" | "simon"): string {
  const left = favorsLeft(id);
  return left > 0 ? `${left} of ${FAVORS_PER_DAY} left today` : `Tapped out for today. Back in ${formatWait(nextFavorIn(id))}`;
}

function contactItems(): string {
  return CONTACTS.map(c => item("contact", c.id, S.cash >= contactPrice(c.id) && favorsLeft(c.id) > 0, `${c.name}: ${c.kind}`,
    `${c.pitch} ${favorStatus(c.id)}.${S.allies.barry ? " Barry negotiates 25% off." : ""}`,
    `<div class="cost">${money(contactPrice(c.id))}</div>`, "", portrait(c.id, 44))).join("") +
    item("hangout", "seymour", !S.busy && S.cash >= hangOutPrice() && favorsLeft("seymour") > 0, "Seymour Talbot: Spend the afternoon",
      "He'd sooner be paid in company: he wants you to teach him a move, or come see something he's proud of. About half the cash, but Michael's tied up for 30 to 45 seconds and can't take jobs. Counts toward his daily limit.",
      `<div class="cost">${money(hangOutPrice())}</div>`, "", portrait("seymour", 44));
}

function crew(): string {
  const contact = CONTACTS.map(c => `<div class="box"><div class="who">${portrait(c.id, 64)}<div><div class="row"><b>${c.name}</b><span class="small">Frienemy: ${c.kind.toLowerCase()}</span></div>
    <div class="small">${c.bio}</div>
    <div class="btns"><button data-act="contact" data-arg="${c.id}" ${S.cash >= contactPrice(c.id) && favorsLeft(c.id) > 0 ? "" : "disabled"}>Buy a favor — ${money(contactPrice(c.id))}</button>
    ${c.id === "seymour" ? `<button data-act="hangout" data-arg="seymour" ${!S.busy && S.cash >= hangOutPrice() && favorsLeft("seymour") > 0 ? "" : "disabled"}>Spend the afternoon — ${money(hangOutPrice())}</button>` : ""}</div>
    <div class="small" style="margin-top:4px">${favorStatus(c.id)}</div></div></div></div>`).join("");
  return contact + ALLIES.map(a => {
    if (!S.allies[a.id] && !allyAvailable(a.debut)) {
      return item("hire", a.id, false, a.name, `${a.bio} Doesn't join the story until Season ${a.debut}.`, `<div class="small">Season ${a.debut}</div>`, "", portrait(a.id, 48, false));
    }
    if (!S.allies[a.id]) return item("hire", a.id, S.cash >= a.cost, "Hire " + a.name, `${a.bio} Perk: ${a.perk}`, `<div class="cost">${money(a.cost)}</div>`, "", portrait(a.id, 48));
    const cd = Math.ceil(S.allyCd[a.id] || 0), busy = S.active.some(m => m.sent === a.id), here = allyHere(a.id);
    const status = !here ? "Wandered off. No idea when he'll be back" : busy ? "On a mission" : "Available";
    return `<div class="box"${here ? "" : ' style="opacity:.6"'}><div class="who">${portrait(a.id, 64)}<div><div class="row"><b>${a.name}</b><span class="small">${status}</span></div>
      <div class="small">${a.bio}</div><div class="small">Perk: ${a.perk}</div>
      <div class="btns"><button data-act="ability" data-arg="${a.id}" ${cd > 0 || !here ? "disabled" : ""}>${a.ab} — ${!here ? "Away" : cd > 0 ? lv("cd" + a.id, cd + "s") : "Ready"}</button></div>
      <div class="small" style="margin-top:4px">${a.abDesc}</div></div></div></div>`;
  }).join("");
}

function gadgets(): string {
  let h = `<div class="small">Junk drops from jobs and Duct-Tape Gadgets.</div><div style="margin:8px 0 12px">` +
    Object.entries(JUNK).map(([k, n]) => `<span class="chip">${n}: ${S.junk[k]}</span>`).join("") + `</div>`;
  h += RECIPES.map(r => {
    const ok = Object.entries(r.need).every(([k, v]) => S.junk[k] >= v);
    return item("craft", r.id, ok, r.name, r.desc, `<span class="small">${Object.entries(r.need).map(([k, v]) => v + " " + JUNK[k].toLowerCase()).join(", ")}</span>`);
  }).join("");
  return h;
}

function covers(): string {
  return `<div class="small" style="margin-bottom:8px">Change cover anytime (20s between changes${S.coverCd > 0 ? `, ${lv("cvcd", Math.ceil(S.coverCd) + "s")} left` : ""}).</div>` +
    COVERS.map(c => {
      const locked = S.life < c.unlock;
      return item("cover", c.id, !locked && cover().id !== c.id && S.coverCd <= 0, c.name, c.desc,
        locked ? `<span class="small">Unlocks at ${money(c.unlock)}</span>` : (S.cover === c.id ? '<span class="cost">Active</span>' : ""),
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
  return `<div class="small" style="margin-bottom:8px">Bosses turn up about every ${bossGapText()}. Outmaneuver each one once for a permanent +3% income. Next one in about ${Math.ceil(Math.max(0, S.bossCd) / 60)} min.</div>` +
    BOSSES.map(b => {
      const open = S.life >= b.at, k = S.bossKills[b.id] || 0;
      return `<div class="box" style="${open ? "" : "opacity:.5"}"><div class="who">${portrait(b.id, 56, open)}<div><div class="row"><b>${open ? b.n : "???"}</b><span class="small">${open ? "Outmaneuvered " + k + "×" : "Appears at " + money(b.at) + " lifetime"}</span></div>
        ${open ? `<div class="small">${b.title}</div><div class="small" style="color:var(--gold)">${b.mech}</div>
          ${k > 0 ? `<div class="small" style="margin-top:6px;color:var(--text)"><b>File:</b> ${b.file}</div>` : `<div class="small" style="margin-top:6px">Outmaneuver them once to open their file.</div>`}` : ""}</div></div></div>`;
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
  return empty + beats + cases + next + notebook;
}

function medals(): string {
  const st = S.stats, t = Math.floor(st.time / 60);
  return `<div class="grid">` + MEDALS.map(a => `<div class="medal ${S.ach.includes(a.id) ? "got" : ""}"><b>${a.n}</b>${a.d}</div>`).join("") + `</div>
    <p class="small">Each medal gives +2% income. ${S.ach.length}/${MEDALS.length} earned.</p>
    <p class="small">Jobs ${st.clicks} · Burns ${st.burns} · Missions won ${st.mDone}/lost ${st.mFail} · Returned to clients ${money(st.returned)} · Kid cases ${st.kidMissions} · Ambushes ${st.ambush} · Gadgets ${st.crafted} · Lifetime ${money(S.life)} · Played ${t} min</p>`;
}

function reinstate(): string {
  const g = credGain();
  return `<p class="small">Call in the favor that gets you reinstated. You reset cash, ops, upgrades and missions. You keep perks, medals, story and covers, and your allies too, except anyone who joined late in the story (like Jesse), who you hire again.</p>
    <p>${g >= 1 ? `Reset for <b style="color:var(--gold)">+${g} Credibility</b> (each point +10% income, forever) and +${g} favors.` : `Earn ${money(REINSTATE_MIN)} in a single run to qualify (${money(S.run)} so far).`}</p>
    <div class="btns"><button data-act="prestige" ${g < 1 ? "disabled" : ""}>Get Reinstated</button></div>`;
}

function theList(): string {
  const next = GRIP_PERKS.find(p => S.grip > p.at);
  let h = `<div class="small" style="margin-bottom:8px">The Organization burned you, and they still hold a grip on you. Wins wear it down: missions, bosses, closed cases, and dealing with handlers on your own terms.</div>
    <div class="box"><div class="row"><b>Their grip on you</b><span class="small">${Math.ceil(S.grip)}%</span></div>
      <div class="bar"><i style="width:${S.grip}%;background:linear-gradient(90deg,var(--sea),#7b5cff)"></i></div>
      ${GRIP_PERKS.map(p => `<div class="small" style="color:${S.grip <= p.at ? "var(--gold)" : "var(--dim)"}">${S.grip <= p.at ? "✓" : "○"} At ${p.at}%: ${p.name}, ${p.desc}</div>`).join("")}
      ${next ? `<div class="small" style="margin-top:4px">Next perk at ${next.at}%.</div>` : ""}</div>`;

  const beaten = BOSSES.filter(b => S.bossKills[b.id]).length;
  h += `<h2 style="margin-top:12px">The List (${beaten}/${BOSSES.length} crossed off)</h2>`;
  h += BOSSES.map(b => {
    const done = S.bossKills[b.id], known = S.listKnown[b.id];
    const status = done ? "Crossed off" : known ? "Known, not yet faced" : "Unknown";
    return `<div class="row small" style="padding:3px 0;${done ? "color:var(--gold)" : known ? "color:var(--text)" : "color:var(--dim)"}"><span style="display:flex;align-items:center;gap:8px">${portrait(b.id, 30, !!(known || done))}${done ? "✓ " : "○ "}${known || done ? b.n : "??????"}</span><span>${status}</span></div>`;
  }).join("");
  h += S.cleanRecord
    ? `<div class="box" style="margin-top:8px;border-color:var(--gold)"><b>The burn is lifted.</b><div class="small" style="color:var(--text)">Every name is crossed off. You're clear, and your income is up 25% for good.</div></div>`
    : `<div class="small" style="margin-top:6px">Beat each of them to cross them off. Simon sometimes passes you a name. Finish the List to lift the burn.</div>`;

  const t = tierDef();
  h += `<h2 style="margin-top:14px">Your file</h2><div class="small" style="margin-bottom:4px">Right now they have you as: <b style="color:var(--text)">${t.name}</b>. ${t.note}</div>`;
  h += DOSSIER.map(d => S.attPeak >= d.peak
    ? `<div class="dossier">${d.text}</div>`
    : `<div class="dossier redacted">████████ ████ ██████ (reached at ${d.peak}% attention)</div>`).join("");
  return h;
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
  ops, upg: upgrades, mis: missions, crew, gad: gadgets, cov: covers, fav: favors, rogue: rogues, story, med: medals, rep: reinstate,
};

export const panelHTML = (tab: TabId): string => VIEWS[tab]();
