declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;
declare const __APP_BUILT__: string;

/** What build is running: the version, the commit it came from, and when it was built. */
export const APP_VERSION = typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "dev";
export const APP_COMMIT = typeof __APP_COMMIT__ === "string" ? __APP_COMMIT__ : "local";
export const APP_BUILT = typeof __APP_BUILT__ === "string" ? __APP_BUILT__ : "";

export function versionLine(): string {
  const d = APP_BUILT ? new Date(APP_BUILT) : null;
  const when = d && !isNaN(+d) ? d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
  return `v${APP_VERSION} · ${APP_COMMIT}${when ? ` · built ${when}` : ""}`;
}
