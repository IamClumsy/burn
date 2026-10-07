import type { Medal } from "../types";
import { ALLIES } from "./allies";
import { BOSSES } from "./bosses";
import { STORY } from "./story";
import { ARCS } from "./arcs";
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
  {id:"a22",n:"Giving Back",     d:"Return $100K to the people you help", t:s=>s.stats.returned>=1e5},
  {id:"a23",n:"A Real Hero",     d:"Return $1B to the people you help",   t:s=>s.stats.returned>=1e9},
  {id:"a24",n:"A Necessary Evil", d:"Buy 10 favors from your frienemies, Seymour and Simon", t:s=>s.stats.seymourFavors+s.stats.simonFavors>=10},
  {id:"a25",n:"Open and Shut",    d:"Close a multi-step case", t:s=>Object.keys(s.arcsDone).length>=1},
  {id:"a26",n:"Full Docket",      d:"Close every case", t:s=>ARCS.every(a=>s.arcsDone[a.id])},
  {id:"a27",n:"Slipping Away",    d:"Wear the Organization's grip down to 50%", t:s=>s.grip<=50},
  {id:"a28",n:"Clean Record",     d:"Complete the List and lift the burn", t:s=>s.cleanRecord},
  {id:"a29",n:"Handled",          d:"Take on 5 errands for a handler", t:s=>s.stats.errands>=5},
  {id:"a21",n:"Case Files",       d:"Take on 25 missions",        t:s=>s.stats.mDone+s.stats.mFail>=25},
];
