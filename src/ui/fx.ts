import { $ } from "./dom";
import { S } from "../state";
import { notify, type NoticeKind } from "./notice";

let freshTimer: ReturnType<typeof setTimeout> | undefined;

/** What kind of thing the narrator is talking about, for color in the Narrator pop-up. */
export type NarrationTag = "note" | "mission" | "fail" | "boss" | "heat" | "org" | "crew" | "story" | "quote" | "away" | "client" | "deal" | "decision";
/** Where it happened: an episode label and its Season, for missions and cases. */
export interface NarrationMeta { label?: string; season?: number; name?: string }
export interface NarrationEntry { text: string; tag: NarrationTag; meta?: NarrationMeta }

/** Everything the narrator has said, newest first, for the Narrator pop-up. */
const history: NarrationEntry[] = [];
export const narration = (): readonly NarrationEntry[] => history;
export const narrationLines = (): readonly string[] => history.map(h => h.text);
export const clearNarration = (): void => { history.length = 0; };

/** Narrate a line: it goes to the top of the history and into the strip under the header. */
export function say(t: string, tag: NarrationTag = "note", meta?: NarrationMeta): void {
  const log = $("log");
  const p = document.createElement("p");
  p.textContent = t;
  log.prepend(p);
  while (log.children.length > 40) log.lastChild!.remove();
  history.unshift({ text: t, tag, meta });
  if (history.length > 150) history.length = 150;

  $("vo-latest").textContent = t;
  const summary = $("voiceover").querySelector("summary")!;
  summary.classList.add("fresh");
  clearTimeout(freshTimer);
  freshTimer = setTimeout(() => summary.classList.remove("fresh"), 1400);
}


/**
 * Tell the player something. Everything pops up in the middle of the screen until they accept it.
 * (If they've turned pop-ups off, it slides into the corner for a few seconds instead.)
 */
export function toast(title: string, msg = "", kind: NoticeKind = "gold", urgent = false): void {
  if (!S.popups) { cornerToast(title, msg); return; }
  notify(title, msg, kind, urgent);
}

function cornerToast(title: string, msg: string): void {
  const d = document.createElement("div");
  d.className = "toast";
  const b = document.createElement("b");
  b.textContent = title;
  d.append(b, document.createTextNode(msg));
  $("toasts").appendChild(d);
  setTimeout(() => d.remove(), 5000);
}

export function shake(): void {
  document.body.classList.remove("shake");
  void document.body.offsetWidth;
  document.body.classList.add("shake");
}

export function floatText(txt: string, x: number, y: number): void {
  const e = document.createElement("div");
  e.className = "float";
  e.textContent = txt;
  e.style.left = x + "px";
  e.style.top = y + "px";
  document.body.appendChild(e);
  setTimeout(() => e.remove(), 900);
}

/** Full-screen red banner for burns and ambushes. */
export function flashBanner(word: string, sub: string): void {
  const el = $("burned");
  $("burnedTxt").innerHTML = `${word}<small>${sub}</small>`;
  el.style.display = "flex";
  setTimeout(() => (el.style.display = "none"), 1500);
}

/** Brief flash on the boss card so every strike is visibly felt. */
export function hitBoss(): void {
  const el = $("bosscard");
  el.classList.remove("hit");
  void el.offsetWidth;
  el.classList.add("hit");
}

/** Set text only when it changed, so buttons aren't rebuilt under the player's cursor. */
export function setText(el: HTMLElement, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}
