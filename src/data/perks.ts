import type { Dict, Perk, Recipe } from "../types";

export const PERKS: Perk[] = [
  {id:"cars",    name:"Reliable Getaway Car", desc:"+25% job pay per level"},
  {id:"insider", name:"Inside Source",        desc:"+3% mission success per level"},
  {id:"head",    name:"Cooler Head",          desc:"−5% heat gain per level"},
  {id:"friends", name:"Old Friends",          desc:"−3% operation prices per level"},
];
export const JUNK: Dict<string> = {tape:"Duct tape", wire:"Wire", bleach:"Bleach", micro:"Microwave"};
export const RECIPES: Recipe[] = [
  {id:"smoke",  name:"Smoke Bomb",          desc:"Instantly −30 heat and −10 attention",              need:{bleach:1,tape:1}},
  {id:"sweep",  name:"Bug Sweeper",         desc:"Instantly −30 Organization attention",              need:{micro:2,bleach:1}},
  {id:"jam",    name:"Door-Cam Jammer",     desc:"No heat gain for 3 minutes",                        need:{wire:2,tape:1}},
  {id:"boost",  name:"Signal Booster",      desc:"Income ×3 for 2 minutes",                           need:{wire:2,micro:1}},
  {id:"jobs",   name:"Fake ID Kit",         desc:"Jobs ×6 for 2 minutes",                             need:{tape:2,wire:1}},
  {id:"fast",   name:"Burner Phone Bundle", desc:"Missions run twice as fast for 3 minutes",          need:{wire:1,micro:1,tape:1}},
  {id:"pay",    name:"Forged Paper Trail",  desc:"Missions pay ×2 for 3 minutes",                     need:{tape:2,bleach:1,micro:1}},
];
export const FX_NAMES: Dict<string> = {jam:"Jammer",boost:"Booster ×3",jobs:"Fake IDs ×6",fast:"Fast Talk",pay:"Paper Trail ×2"};
