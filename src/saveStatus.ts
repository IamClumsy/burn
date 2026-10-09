/** What the save line says. Kept apart from the page so the Settings pop-up can show it whenever it's open. */
let text = "Autosaves every 2s";
let warn = false;
export const saveStatus = (): { text: string; warn: boolean } => ({ text, warn });
export function setSaveStatus(t: string, w = false): void {
  text = t; warn = w;
  const el = document.getElementById("saveinfo");
  if (el) { el.textContent = t; el.style.color = w ? "var(--gold)" : ""; }
}
