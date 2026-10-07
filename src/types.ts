export type Dict<T> = Record<string, T>;

export interface Gen { id: string; name: string; desc: string; base: number; cps: number }

export type UpgKind = "click" | "gen" | "all" | "heat" | "lay" | "auto";
export interface Upgrade { id: string; name: string; desc: string; cost: number; kind: UpgKind; m?: number; g?: string }

export interface Ally {
  id: string; name: string; bio: string; cost: number; perk: string;
  ab: string; abDesc: string; cd: number;
  /** Unreliable ally who comes and goes on his own schedule. */
  flaky?: boolean;
}

export interface MissionTpl {
  n: string; dur: number; succ: number; heat: number; rm: number; fav: number; ally: string; kid?: boolean;
}
export interface Mission {
  uid: number; n: string; dur: number; succ: number; heat: number; rm: number; fav: number;
  ally: string; kid: boolean; send: boolean;
}
export interface ActiveMission extends Mission { sent: string | null; left: number; chance: number; reward: number }

export interface Cover { id: string; name: string; desc: string; job: number; inc: number; heat: number; mis: number; unlock: number }

export type BossTag = "heat" | "att" | "steal" | "heal" | "fx" | "freeze" | "weak" | "rush" | "nolay";
export interface Boss {
  id: string; n: string; title: string; at: number; hpm: number; m: BossTag[]; mech: string; intro: string;
}
export interface ActiveBoss { id: string; hp: number; max: number; left: number }

/** A frienemy: not crew, sells a specific kind of necessary favor for cash. */
export interface Contact { id: "seymour" | "simon"; name: string; kind: string; bio: string; pitch: string }

export interface Perk { id: string; name: string; desc: string }
export interface Recipe { id: string; name: string; desc: string; need: Dict<number> }
export interface StoryBeat { at: number; t: string; fav: number; x: string }
export interface Medal { id: string; n: string; d: string; t: (s: GameState) => boolean }
export interface GameEvent { t: string; d: string; o: [label: string, run: () => string][] }

export interface Stats {
  clicks: number; burns: number; mDone: number; mFail: number; crafted: number;
  ambush: number; reinstated: number; time: number; kidMissions: number;
  /** Favors bought from Seymour, across all runs. */
  seymourFavors: number; simonFavors: number;
  /** Total client money Michael handed back instead of keeping. */
  returned: number;
}

export interface GameState {
  cash: number; life: number; run: number; heat: number; att: number;
  gens: Dict<number>; upgs: Dict<boolean>; cred: number; last: number; layCd: number;
  favors: number; perks: Dict<number>; allies: Dict<boolean>; allyCd: Dict<number>; fx: Dict<number>;
  junk: Dict<number>;
  cover: string; coverCd: number; board: Mission[]; active: ActiveMission[]; uid: number;
  story: number; ach: string[]; stats: Stats;
  buyAmt: 1 | 10 | "max"; mute: boolean; seymourBought: number; simonBought: number;
  /** Nate wanders off and returns on a random timer. */
  nateAway: boolean; nateTimer: number;
  boss: ActiveBoss | null; bossCd: number; bossKills: Dict<number>;
}
