/** The gadget you just built, shown as a confirmation at the top of the Gadgets screen for a few seconds. */
interface Built { id: string; name: string; desc: string; at: number }
let last: Built | null = null;
const SHOW_MS = 4000;

export const flashBuilt = (id: string, name: string, desc: string): void => { last = { id, name, desc, at: Date.now() }; };
export const builtFlash = (): Built | null => (last && Date.now() - last.at < SHOW_MS ? last : null);
export const clearBuilt = (): void => { last = null; };
