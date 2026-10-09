import { S, SAVE_KEY, fresh, merge, setState } from "./state";
import { returnFromAway } from "./game/offline";
import { setSaveStatus } from "./saveStatus";
import type { GameState } from "./types";

// Saves to localStorage, sessionStorage and window.name; the newest copy wins on load.
// window.name survives reloads even where localStorage is blocked (previews, data: pages).
const WN = "BMI2:";
let noSave = false;

export function save(): void {
  if (noSave) return;
  S.last = Date.now();
  let j: string;
  try { j = JSON.stringify(S); } catch { return; }
  let ls = false, ss = false, wn = false;
  try { localStorage.setItem(SAVE_KEY, j); ls = localStorage.getItem(SAVE_KEY) === j; } catch { /* blocked */ }
  try { sessionStorage.setItem(SAVE_KEY, j); ss = true; } catch { /* blocked */ }
  try { window.name = WN + j; wn = true; } catch { /* blocked */ }
  const t = new Date().toLocaleTimeString();
  setSaveStatus(
    ls ? `Saved ${t}`
      : ss || wn ? `Saved ${t} (temporary only: open the game in a normal browser tab for a permanent save, or use export)`
      : "Could not save: use export save",
    !ls);
}

export function readSave(): Partial<GameState> | null {
  const raws: (string | null)[] = [];
  try { raws.push(localStorage.getItem(SAVE_KEY)); } catch { /* blocked */ }
  try { raws.push(sessionStorage.getItem(SAVE_KEY)); } catch { /* blocked */ }
  try { if (window.name.startsWith(WN)) raws.push(window.name.slice(WN.length)); } catch { /* blocked */ }
  let best: Partial<GameState> | null = null;
  for (const r of raws) {
    if (!r) continue;
    try {
      const o = JSON.parse(r) as Partial<GameState>;
      if (!best || (o.last || 0) > (best.last || 0)) best = o;
    } catch { /* corrupt copy, skip */ }
  }
  return best;
}

/** Load the newest save and catch up on the time you were away. */
export function loadGame(): void {
  const saved = readSave();
  if (!saved) { setState(fresh()); return; }
  setState(merge(saved));
  const away = (Date.now() - S.last) / 1000;
  if (away > 30) returnFromAway(away);
}

export function wipeSave(): void {
  noSave = true;
  try { localStorage.removeItem(SAVE_KEY); } catch { /* blocked */ }
  try { sessionStorage.removeItem(SAVE_KEY); } catch { /* blocked */ }
  try { window.name = ""; } catch { /* blocked */ }
  location.reload();
}

export function exportSave(): void {
  save();
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
  const copy = navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject();
  copy.then(() => setSaveStatus("Save copied to clipboard")).catch(() => prompt("Copy your save code:", code));
}

export function importSave(code: string): boolean {
  try {
    setState(merge(JSON.parse(decodeURIComponent(escape(atob(code.trim()))))));
    save();
    return true;
  } catch { return false; }
}
