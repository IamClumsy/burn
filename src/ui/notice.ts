import { $ } from "./dom";
import { choiceOpen } from "./choice";

export type NoticeKind = "gold" | "good" | "bad" | "story";
interface Notice { title: string; msg: string; kind: NoticeKind }

const queue: Notice[] = [];
let showing = false;

/** True while a notification is on screen. Decisions wait their turn behind it. */
export const noticeOpen = (): boolean => showing;
/** How many are waiting, including the one on screen. */
export const noticeCount = (): number => queue.length;

/** Queue a notification. It pops up in the middle of the screen and stays until accepted. */
export function notify(title: string, msg: string, kind: NoticeKind = "gold"): void {
  queue.push({ title, msg, kind });
  if (showing) paintCount(); // more arrived while one is up: keep the count honest
  pumpNotices();
}

/** Show the next notification, unless one is already up or a decision is being made. */
export function pumpNotices(): void {
  if (showing || !queue.length || choiceOpen()) return;
  const n = queue[0];
  showing = true;
  $("nT").textContent = n.title;
  $("nM").textContent = n.msg;
  $("ndlg").className = "ndlg " + n.kind;
  paintCount();
  $("notice").style.display = "flex";
  ($("nOk") as HTMLButtonElement).focus();
}

function paintCount(): void {
  const more = queue.length - 1;
  $("nCount").textContent = more > 0 ? `${more} more waiting` : "";
  $("nAll").style.display = more > 0 ? "" : "none";
}

/** Accept the current notification and move on to the next. */
export function dismissNotice(): void {
  if (!showing) return;
  queue.shift();
  showing = false;
  $("notice").style.display = "none";
  pumpNotices();
}

export function dismissAllNotices(): void {
  queue.length = 0;
  showing = false;
  $("notice").style.display = "none";
}

export function initNotices(): void {
  $("nOk").addEventListener("click", dismissNotice);
  $("nAll").addEventListener("click", dismissAllNotices);
  // Enter, Space or Escape accepts it. Capture phase, so Escape doesn't also close a pop-up behind it.
  document.addEventListener("keydown", e => {
    if (!showing) return;
    if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      dismissNotice();
    }
  }, true);
}
