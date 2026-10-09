import { $ } from "./dom";
import { say, toast } from "./fx";
import { noticeOpen, pumpNotices } from "./notice";

let open = false;
/** A decision is on screen. */
export const choiceOpen = (): boolean => open;
/** A decision or a notification is on screen, so nothing new should open. */
export const choiceBusy = (): boolean => open || noticeOpen();

/**
 * Show a modal decision. Each option runs, returns a result message, and closes the dialog.
 * Used for random events and for story-beat choices.
 */
export interface ChoiceStyle {
  /** Index of the option to emphasize as the main action. */
  primary?: number;
  /** Large headline text, such as a payment amount. */
  big?: string;
  /** Use the teal "client at the door" look instead of the default. */
  client?: boolean;
}

export function showChoice(
  title: string,
  desc: string,
  options: [label: string, run: () => string][],
  onDone?: (result: string) => void,
  style: ChoiceStyle = {},
): void {
  open = true;
  $("evtT").textContent = title;
  $("evtD").textContent = desc;
  $("evtBig").textContent = style.big ?? "";
  $("evtDlg").classList.toggle("client", !!style.client);
  $("evtO").innerHTML = "";
  options.forEach(([label, run], i) => {
    const b = document.createElement("button");
    b.textContent = label;
    if (style.primary === i) b.className = "primary";
    b.onclick = () => {
      const result = run();
      say(result, "decision");
      toast(title, result);
      $("evt").style.display = "none";
      open = false;
      onDone?.(result);
      pumpNotices(); // anything that arrived while you were deciding can show now
    };
    $("evtO").appendChild(b);
  });
  $("evt").style.display = "flex";
}
