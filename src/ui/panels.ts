import { S } from "../state";
import {
  allyFree, allyHere, bulkCost, buyN, cover, credGain, genMult, incomeMult, missionReward, owned, perk, perkCost,
  simonPrice, succChance,
} from "../calc";
import { GENS } from "../data/ops";
import { UPGS } from "../data/upgrades";
import { ALLIES } from "../data/allies";
import { COVERS } from "../data/covers";
import { BOSSES } from "../data/bosses";
import { PERKS, JUNK, RECIPES } from "../data/perks";
import { STORY } from "../data/story";
import { MEDALS } from "../data/medals";
import { fmt, money } from "../util";

export type TabId = "ops" | "upg" | "mis" | "crew" | "gad" | "cov" | "fav" | "rogue" | "story" | "med" | "rep";

/** Everyday play: always visible as cards. */
export const SECTIONS: [TabId, string][] = [
  ["ops", "Operations"], ["mis", "Missions"], ["upg", "Upgrades"], ["crew", "Crew"],
  ["gad", "Gadgets"], ["cov", "Covers"], ["fav", "Favors"],
];

/** Reference and rare screens: opened as pop-ups from the toolbar. */
export const MODALS: [TabId, string][] = [
  ["story", "Case File"], ["rogue", "Rogues"], ["med", "Medals"], ["rep", "Reinstate"],
];

export const titleOf = (id: TabId): string => [...SECTIONS, ...MODALS].find(([i]) => i === id)![1];

/** Build the static card shells and the toolbar once at startup. */
export function buildLayout(host: HTMLElement, toolbar: HTMLElement): void {
  host.innerHTML = SECTIONS.map(([id, t]) =>
    `<div class="card sec sec-${id}"><h2>${t}</h2><div class="secbody" id="sec-${id}"></div></div>`).join("");
  toolbar.innerHTML = MODALS.map(([id, t]) => `<button data-modal="${id}">${t}</button>`).join("");
}

function item(act: string, arg: string | number, can: boolean, title: string, desc: string, right: string, cls = ""): string {
  return `<div class="item ${can ? "can" : "no"} ${cls}" data-act="${act}" data-arg="${arg}">
    <div><b>${title}</b><span>${desc}</span></div><div style="text-align:right">${right}</div></div>`;
}

const costAndOwn = (cost: string, own: string | number) =>
  `<div style="display:flex;gap:12px;align-items:center"><div class="cost">${cost}</div><div class="own">${own}</div></div>`;

function ops(): string {
  let h = `<div class="tabs">` + ([1, 10, "max"] as const).map(a =>
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
  const av = UPGS.filter(u => !S.upgs[u.id] && S.life >= u.cost * 0.3).slice(0, 9);
  if (!av.length) return '<div class="small">Nothing on the table yet. Keep earning.</div>';
  return av.map(u => item("upg", u.id, S.cash >= u.cost, u.name, u.desc, `<div class="cost">${money(u.cost)}</div>`)).join("");
}

function missions(): string {
  let h = `<div class="small" style="margin-bottom:8px">Up to 3 missions at once (${S.active.length}/3). Clients pay well. Michael keeps what he needs for expenses and hands the rest back. Send an ally for +25% success, but they're busy until it ends.</div>`;
  if (S.active.length) {
    h += `<h2>In Progress</h2>` + S.active.map(m => `<div class="box"><div class="row"><b>${m.n}</b><span class="small">${Math.ceil(m.left)}s · ${Math.round(m.chance * 100)}%</span></div>
      <div class="bar"><i class="mbar" style="width:${(1 - m.left / m.dur) * 100}%"></i></div>
      <span class="small">Pays ${money(m.reward)} · +${m.fav} favor${m.sent ? " · " + ALLIES.find(a => a.id === m.sent)!.name + " is out" : ""}</span></div>`).join("");
  }
  h += `<h2 style="margin-top:12px">Board</h2>`;
  h += S.board.map(m => {
    const al = ALLIES.find(a => a.id === m.ally)!, free = allyFree(m.ally);
    return `<div class="box"><b>${m.n}${m.kid ? ' <span class="chip">Never fails</span>' : ""}</b><div class="small">${Math.round(succChance(m) * 100)}% success · ${m.dur}s · pays ${money(missionReward(m))} · +${m.fav} favor · +${m.heat} heat</div>
      <div class="btns">${S.allies[m.ally] ? `<button class="${m.send && free ? "on" : ""}" data-act="send" data-arg="${m.uid}" ${free ? "" : "disabled"}>${m.send && free ? "☑" : "☐"} Send ${al.name.split(" ")[0]} (+25%)${free ? "" : " — busy"}</button>` : ""}
      <button data-act="start" data-arg="${m.uid}" ${S.active.length >= 3 ? "disabled" : ""}>Start mission</button></div></div>`;
  }).join("");
  return h;
}

function crew(): string {
  return ALLIES.map(a => {
    if (!S.allies[a.id]) return item("hire", a.id, S.cash >= a.cost, "Hire " + a.name, `${a.bio} Perk: ${a.perk}`, `<div class="cost">${money(a.cost)}</div>`);
    const cd = Math.ceil(S.allyCd[a.id] || 0), busy = S.active.some(m => m.sent === a.id), here = allyHere(a.id);
    const status = !here ? "Wandered off. No idea when he'll be back" : busy ? "On a mission" : "Available";
    return `<div class="box"${here ? "" : ' style="opacity:.6"'}><div class="row"><b>${a.name}</b><span class="small">${status}</span></div>
      <div class="small">${a.bio}</div><div class="small">Perk: ${a.perk}</div>
      <div class="btns"><button data-act="ability" data-arg="${a.id}" ${cd > 0 || !here ? "disabled" : ""}>${a.ab} — ${!here ? "Away" : cd > 0 ? cd + "s" : "Ready"}</button></div>
      <div class="small" style="margin-top:4px">${a.abDesc}</div></div>`;
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
  return `<div class="small" style="margin-bottom:8px">Change cover anytime (20s between changes${S.coverCd > 0 ? `, ${Math.ceil(S.coverCd)}s left` : ""}).</div>` +
    COVERS.map(c => {
      const locked = S.life < c.unlock;
      return item("cover", c.id, !locked && cover().id !== c.id && S.coverCd <= 0, c.name, c.desc,
        locked ? `<span class="small">Unlocks at ${money(c.unlock)}</span>` : (S.cover === c.id ? '<span class="cost">Active</span>' : ""),
        S.cover === c.id ? "on" : "");
    }).join("");
}

function favors(): string {
  return `<div class="small" style="margin-bottom:8px">Favors: <b style="color:var(--gold)">${S.favors}</b>. Perks last through every reinstatement.</div>` +
    item("simon", "x", S.cash >= simonPrice(), "Buy a favor from Simon",
      `Simon Escher, once the Organization's best assassin, now a reluctant ally. A necessary evil: he gets things done, and he always names a price. It rises with each favor (resets on reinstatement), and dealing with him draws a little Organization attention.${S.allies.barry ? " Barry negotiates 25% off." : ""}`,
      `<div class="cost">${money(simonPrice())}</div>`) +
    PERKS.map(p => item("perk", p.id, perk(p.id) < 10 && S.favors >= perkCost(p.id), p.name, p.desc,
      costAndOwn(perk(p.id) >= 10 ? "MAX" : perkCost(p.id) + " fav", perk(p.id)))).join("");
}

function rogues(): string {
  return `<div class="small" style="margin-bottom:8px">Bosses turn up every few minutes. Beat each one once for a permanent +3% income. Next one in about ${Math.ceil(Math.max(0, S.bossCd) / 60)} min.</div>` +
    BOSSES.map(b => {
      const open = S.life >= b.at, k = S.bossKills[b.id] || 0;
      return `<div class="box" style="${open ? "" : "opacity:.5"}"><div class="row"><b>${open ? b.n : "???"}</b><span class="small">${open ? "Defeated " + k + "×" : "Appears at " + money(b.at) + " lifetime"}</span></div>
        ${open ? `<div class="small">${b.title}</div><div class="small" style="color:var(--gold)">${b.mech}</div>` : ""}</div>`;
    }).join("");
}

function story(): string {
  let h = STORY.slice(0, S.story).map((s, i) => `<div class="box"><b>${i + 1}. ${s.t}</b><div class="small" style="font-size:13px;color:var(--text)">${s.x}</div></div>`).join("");
  if (S.story < STORY.length) h += `<div class="small">Next lead at ${money(STORY[S.story].at)} lifetime earnings.</div>`;
  else h += `<div class="small">The file is closed. The game isn't. Keep stacking.</div>`;
  return h || '<div class="small">Nothing yet. Earn some money and the story finds you.</div>';
}

function medals(): string {
  const st = S.stats, t = Math.floor(st.time / 60);
  return `<div class="grid">` + MEDALS.map(a => `<div class="medal ${S.ach.includes(a.id) ? "got" : ""}"><b>${a.n}</b>${a.d}</div>`).join("") + `</div>
    <p class="small">Each medal gives +2% income. ${S.ach.length}/${MEDALS.length} earned.</p>
    <p class="small">Jobs ${st.clicks} · Burns ${st.burns} · Missions won ${st.mDone}/lost ${st.mFail} · Returned to clients ${money(st.returned)} · Kid cases ${st.kidMissions} · Ambushes ${st.ambush} · Gadgets ${st.crafted} · Lifetime ${money(S.life)} · Played ${t} min</p>`;
}

function reinstate(): string {
  const g = credGain();
  return `<p class="small">Call in the favor that gets you reinstated. You reset cash, ops, upgrades and missions. You keep allies, perks, medals, story and covers.</p>
    <p>${g >= 1 ? `Reset for <b style="color:var(--gold)">+${g} Credibility</b> (each point +10% income, forever) and +${g} favors.` : `Earn $1M this run to qualify (${money(S.run)} so far).`}</p>
    <div class="btns"><button data-act="prestige" ${g < 1 ? "disabled" : ""}>Get Reinstated</button></div>`;
}

const VIEWS: Record<TabId, () => string> = {
  ops, upg: upgrades, mis: missions, crew, gad: gadgets, cov: covers, fav: favors, rogue: rogues, story, med: medals, rep: reinstate,
};

export const panelHTML = (tab: TabId): string => VIEWS[tab]();
