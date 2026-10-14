import type { Arc, Boss, ChoiceFx, GameState } from "../types";
import { SAM_FLASHBACK } from "./samAxe";

/**
 * A flashback is an Open Case told by someone in the crew: an inquiry-style frame, a choice before each act, short
 * cards between them, an optional showdown, its own look while it runs, and a replay page in the menu. Each one is
 * data here; the engine in game/arcs.ts, the pause, the menu page and the Rogues and List sections all read this list,
 * so adding another is writing its text and registering it below.
 */
export interface FlashbackOption { label: string; result: string; fx: ChoiceFx }
/** A card with a question before a step: two answers, each with a small permanent effect. */
export interface FlashbackAct { title: string; inquiry: string; prompt: string; options: FlashbackOption[] }
export type FlashbackBeat = FlashbackAct;

export interface FlashbackDef {
  /** Also the id of its Open Case, and its key in the save. */
  id: string;
  title: string;
  /** Who tells it, for the notes that say so ("Sam is telling his story"). */
  teller: string;
  arc: Arc;
  /** The cards that open the steps with an `act` index. */
  acts: FlashbackAct[];
  /** The cards before steps with no act, keyed by step number. */
  beats: Record<number, FlashbackBeat>;
  /** An optional scene between the last answer and a showdown step. */
  bridge?: { title: string; scene: string; go: string; result: string };
  /** An optional once-only nod before step one, with a button on the case card. */
  nod?: { label: string; title: string; text: string; say: string; succ: number; portrait?: string };
  /** Foes that only exist inside it (never on The List). */
  bosses: Boss[];
  /** Multiplies how long each step takes: everything else is paused while it runs. */
  speed: number;
  /** The menu page. */
  menuId: string;
  menuTitle: string;
  /** The note on the Missions card while it's running. */
  pausedTitle: string;
  pausedText: string;
  /** What's said when it's offered, once its conditions are met. */
  offer: (s: GameState) => { title: string; text: string; say: string };
  /** What's said when it's replayed. */
  replay: { title: string; text: string; say: string };
  /** What a failed step says. */
  retry: (stepName: string) => { title: string; text: string };
  /** What the replay page tells a player who's about to start over. */
  replayHelp: string;
  /** Said when the showdown starts a second time in a replay (nothing to add by default). */
  bossLine?: string;
}

export const FLASHBACKS: FlashbackDef[] = [SAM_FLASHBACK];

export const flashbackById = (id: string): FlashbackDef | undefined => FLASHBACKS.find(f => f.id === id);
