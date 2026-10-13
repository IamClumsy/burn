/**
 * A hidden developer menu for the person who owns the game. It stays out of the save (so exporting a save never
 * carries it) and out of sight until Settings' title is tapped seven times. It's a convenience, not security:
 * the game runs entirely in the browser, so anyone who reads the code could do the same.
 */
const KEY = "burned_dev_v1";
type DevState = { unlocked: boolean; funds: boolean };
let state: DevState = { unlocked: false, funds: false };

try { const raw = localStorage.getItem(KEY); if (raw) state = { ...state, ...(JSON.parse(raw) as Partial<DevState>) }; } catch { /* blocked or empty */ }

const persist = (): void => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* blocked */ } };

export const devUnlocked = (): boolean => state.unlocked;
export const devFundsOn = (): boolean => state.unlocked && state.funds;
export function unlockDev(): void { state.unlocked = true; persist(); }
export function lockDev(): void { state = { unlocked: false, funds: false }; persist(); }
export function setDevFunds(on: boolean): void { state.funds = on; persist(); }
/** For tests: forget everything without touching storage. */
export function resetDevForTests(): void { state = { unlocked: false, funds: false }; }
