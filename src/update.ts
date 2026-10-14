/**
 * Notices when a newer build has been deployed while this copy of the game is still running, which is what happens to an
 * installed app that was left in the background: it keeps running the code it started with until it's reloaded.
 */
const SCRIPT_RE = /\/assets\/index-[^"'\s>]+\.js/;

/** The built script this page is running, or "" in development (where there's nothing to compare). */
export function runningScript(doc: Document = document): string {
  for (const s of Array.from(doc.scripts)) {
    const m = s.src.match(SCRIPT_RE);
    if (m) return m[0];
  }
  return "";
}

/** Is the deployed page pointing at a different built script than the one running now? */
export async function newerBuildAvailable(fetcher: typeof fetch = fetch, running = runningScript()): Promise<boolean> {
  if (!running) return false;
  try {
    const res = await fetcher("/", { cache: "no-store" });
    if (!res.ok) return false;
    const m = (await res.text()).match(SCRIPT_RE);
    return !!m && m[0] !== running;
  } catch {
    return false; // offline or blocked: keep playing
  }
}
