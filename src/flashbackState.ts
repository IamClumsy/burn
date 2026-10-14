import { S } from "./state";
import type { FlashbackState } from "./types";

/**
 * Where a flashback keeps what it needs in the save: the answers you gave, whether it's been offered, and whether it's
 * being replayed. The Fall of Sam Axe keeps using the three fields saves already have; any other flashback lives in S.fb.
 */
export function fbState(id: string): FlashbackState {
  if (id === "samfall") {
    return {
      get choices() { return S.samChoices; }, set choices(v) { S.samChoices = v; },
      get offered() { return S.samOffered; }, set offered(v) { S.samOffered = v; },
      get replay() { return S.samReplay; }, set replay(v) { S.samReplay = v; },
    };
  }
  return (S.fb[id] ??= { choices: {}, offered: false, replay: false });
}
