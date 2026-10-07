import type { Medal } from "../types";
import { ALLIES } from "./allies";
import { BOSSES } from "./bosses";
import { STORY } from "./story";
import { totalOps } from "../calc";

export const MEDALS: Medal[] = [
  {id:"a1", n:"First Job",        d:"Take a job",                 t:s=>s.stats.clicks>=1},
  {id:"a2", n:"Hustler",          d:"100 jobs",                   t:s=>s.stats.clicks>=100},
  {id:"a3", n:"Workaholic",       d:"1,000 jobs",                 t:s=>s.stats.clicks>=1000},
  {id:"a4", n:"Pocket Money",     d:"Earn $1K lifetime",          t:s=>s.life>=1e3},
  {id:"a5", n:"Millionaire",      d:"Earn $1M lifetime",          t:s=>s.life>=1e6},
  {id:"a6", n:"Billionaire",      d:"Earn $1B lifetime",          t:s=>s.life>=1e9},
  {id:"a7", n:"Burned (Again)",   d:"Get burned",                 t:s=>s.stats.burns>=1},
  {id:"a8", n:"Fireproof? No.",   d:"Get burned 5 times",         t:s=>s.stats.burns>=5},
  {id:"a9", n:"Small Business",   d:"Own 50 operations",          t:()=>totalOps()>=50},
  {id:"a10",n:"Empire",           d:"Own 200 operations",         t:()=>totalOps()>=200},
  {id:"a11",n:"On the Case",      d:"Complete a mission",         t:s=>s.stats.mDone>=1},
  {id:"a12",n:"Case Closer",      d:"Complete 10 missions",       t:s=>s.stats.mDone>=10},
  {id:"a13",n:"The Team",         d:"Hire every ally",            t:s=>ALLIES.every(a=>s.allies[a.id])},
  {id:"a14",n:"Reinstated",       d:"Get Reinstated once",        t:s=>s.stats.reinstated>=1},
  {id:"a15",n:"MacGyver Who?",    d:"Craft a gadget",             t:s=>s.stats.crafted>=1},
  {id:"a16",n:"Ambushed",         d:"Get ambushed by the Organization", t:s=>s.stats.ambush>=1},
  {id:"a17",n:"Case Closed",      d:"Finish the story",           t:s=>s.story>=STORY.length},
  {id:"a18",n:"Dodged a Bullet",  d:"Beat your first boss",       t:s=>Object.keys(s.bossKills).length>=1},
  {id:"a19",n:"Rogues' Gallery",  d:"Beat every boss",            t:s=>BOSSES.every(b=>s.bossKills[b.id])},
  {id:"a20",n:"Good Samaritan",   d:"Complete 5 missions that involve a kid", t:s=>s.stats.kidMissions>=5},
  {id:"a21",n:"Case Files",       d:"Take on 25 missions",        t:s=>s.stats.mDone+s.stats.mFail>=25},
];
