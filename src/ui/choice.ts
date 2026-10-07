import { $ } from "./dom";
import { say, toast } from "./fx";

let open = false;
export const choiceBusy = (): boolean => open;

/**
 * Show a modal decision. Each option runs, returns a result message, and closes the dialog.
 * Used for random events and for story-beat choices.
 */
export function showChoice(
  title: string,
  desc: string,
  options: [label: string, run: () => string][],
  onDone?: (result: string) => void,
): void {
  open = true;
  $("evtT").textContent = title;
  $("evtD").textContent = desc;
  $("evtO").innerHTML = "";
  for (const [label, run] of options) {
    const b = document.createElement("button");
    b.textContent = label;
    b.onclick = () => {
      const result = run();
      say(result);
      toast(title, result);
      $("evt").style.display = "none";
      open = false;
      onDone?.(result);
    };
    $("evtO").appendChild(b);
  }
  $("evt").style.display = "flex";
}
