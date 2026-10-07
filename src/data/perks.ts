import type { Dict, Perk, Recipe } from "../types";

export const PERKS: Perk[] = [
  {id:"cars",    name:"Reliable Getaway Car", desc:"+25% job pay per level"},
  {id:"insider", name:"Inside Source",        desc:"+3% mission success per level"},
  {id:"head",    name:"Cooler Head",          desc:"−5% heat gain per level"},
  {id:"friends", name:"Old Friends",          desc:"−3% operation prices per level"},
];
export const JUNK: Dict<string> = {tape:"Duct tape", wire:"Wire", bleach:"Bleach", micro:"Microwave"};
export const RECIPES: Recipe[] = [
  {id:"smoke", name:"Smoke Bomb",       desc:"Instantly −30 heat",              need:{bleach:1,tape:1}},
  {id:"jam",   name:"Door-Cam Jammer",  desc:"No heat gain for 45s",            need:{wire:2,tape:1}},
  {id:"boost", name:"Signal Booster",   desc:"Income ×2 for 30s",               need:{wire:2,micro:1}},
  {id:"jobs",  name:"Fake ID Kit",      desc:"Jobs ×4 for 30s",                 need:{tape:2,wire:1}},
];
export const FX_NAMES: Dict<string> = {jam:"Jammer",boost:"Booster ×2",jobs:"Fake IDs ×4",fast:"Fast Talk"};
