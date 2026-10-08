export type Dict<T> = Record<string, T>;

export interface Gen { id: string; name: string; desc: string; base: number; cps: number }

export type UpgKind = "click" | "gen" | "all" | "heat" | "lay" | "auto";
export interface Upgrade { id: string; name: string; desc: string; cost: number; kind: UpgKind; m?: number; g?: string }

export interface Ally {
  id: string; name: string; bio: string; cost: number; perk: string;
  ab: string; abDesc: string; cd: number;
  /** Unreliable ally who comes and goes on his own schedule. */
  flaky?: boolean;
  /** Uses she/her pronouns in game text. */
  she?: boolean;
  /** The show season they first appear in. They can't be hired before it opens. */
  debut?: number;
  /** The episode code (season x 100 + episode) they first appear in. Their missions never come earlier. */
  debutEp?: string;
}

export interface MissionTpl {
  n: string; dur: number; succ: number; heat: number; rm: number; fav: number; ally: string; kid?: boolean;
  /** The episode this mission is adapted from: code (season x 100 + episode) and title. */
  ep?: string; epTitle?: string;
  /** The people helped are older folks. Madeline only works cases with kids or older folks. */
  elder?: boolean;
}
export interface Mission {
  uid: number; n: string; dur: number; succ: number; heat: number; rm: number; fav: number;
  ally: string; kid: boolean; send: boolean;
  /** Set when this mission is one step of a multi-step case. */
  arc?: { id: string; step: number };
  ep?: string; epTitle?: string;
  elder?: boolean;
}
export interface ActiveMission extends Mission { sent: string | null; left: number; chance: number; reward: number }

export interface Cover { id: string; name: string; desc: string; job: number; inc: number; heat: number; mis: number; unlock: number }

export type BossTag = "heat" | "att" | "steal" | "heal" | "fx" | "freeze" | "weak" | "rush" | "nolay";
export interface Boss {
  id: string; n: string; title: string; at: number; hpm: number; m: BossTag[]; mech: string; intro: string;
  /** Character file, unlocked by beating them once. */
  file: string;
}
/** An encounter in progress. hp is how much of their cover is still intact. */
export interface ActiveBoss {
  id: string; hp: number; max: number; left: number;
  /** Leads gathered by investigating; spent when you spring the trap. */
  leads?: number;
  /** Seconds until each action is ready again. */
  cd?: Dict<number>;
}
export type CaseAction = "investigate" | "con" | "gadget" | "favor" | "trap";

/** A frienemy: not crew, sells a specific kind of necessary favor for cash. */
export interface Contact { id: "seymour" | "simon"; name: string; kind: string; bio: string; pitch: string }

/** The fixer currently on offer: a different price and result each time one turns up. */
export interface FixerQuote {
  name: string;
  /** Price multiplier (cheaper or pricier than the going rate). */
  mult: number;
  /** How much Organization attention they can take off. */
  drop: number;
  /** Seconds until this fixer moves on and another shows up. */
  left: number;
}

export interface Perk { id: string; name: string; desc: string }
export interface Recipe { id: string; name: string; desc: string; need: Dict<number> }
/** Permanent bonuses a story choice can grant. Values are fractions: inc 0.1 means +10% income. */
export interface ChoiceFx { inc?: number; heat?: number; att?: number; mis?: number; succ?: number; favors?: number }
export interface StoryChoice {
  prompt: string;
  options: { label: string; result: string; fx: ChoiceFx }[];
}
export interface StoryBeat { at: number; t: string; fav: number; x: string; choice?: StoryChoice }

/** A multi-step case built from a story-heavy episode. Finish every step to close it. */
export interface Arc {
  id: string; title: string; at: number; ally: string; blurb: string; epilogue: string; favors: number;
  steps: { n: string; dur: number; succ: number; heat: number; rm: number }[];
}
export interface Medal { id: string; n: string; d: string; t: (s: GameState) => boolean }
export interface GameEvent { t: string; d: string; o: [label: string, run: () => string][] }

export interface Stats {
  clicks: number; burns: number; mDone: number; mFail: number; crafted: number;
  ambush: number; reinstated: number; time: number; kidMissions: number;
  /** Favors bought from Seymour, across all runs. */
  seymourFavors: number; simonFavors: number; errands: number;
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
  buyAmt: 1 | 10 | 100 | "max"; mute: boolean; seymourBought: number; simonBought: number;
  /** Nate wanders off and returns on a random timer. */
  nateAway: boolean; nateTimer: number;
  /** The Organization's grip on you: starts at 100 and is worn down by wins. */
  grip: number;
  /** Names of people on the List that you know about (from wins or Simon's tips). */
  listKnown: Dict<boolean>;
  /** Highest Organization attention ever reached, which fills in their dossier on you. */
  attPeak: number;
  /** True once the List is complete and the burn is lifted. */
  cleanRecord: boolean;
  /** The fixer currently offering a payoff. */
  fixer: FixerQuote | null;
  /** Episodes whose mission you've completed, by code. */
  episodesDone: Dict<boolean>;
  /** Highest season of cases announced as open. */
  seasonOpen: number;
  /** Michael is tied up with someone (like Seymour) and can't take jobs for a bit. */
  busy: { who: string; left: number } | null;
  /** Story choices: beat index -> option index. */
  choices: Dict<number>;
  /** Multi-step cases: current step per arc, and which are closed. */
  arcStep: Dict<number>; arcsDone: Dict<boolean>;
  boss: ActiveBoss | null; bossCd: number; bossKills: Dict<number>;
}
