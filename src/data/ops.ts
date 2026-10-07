import type { Gen } from "../types";

export const GENS: Gen[] = [
  {id:"inf",  name:"Street Informant",       desc:"Hears things. Sells them.",             base:15,     cps:0.5},
  {id:"tape", name:"Duct-Tape Gadgets",      desc:"Household items, weaponized. Also yields junk.", base:110, cps:3},
  {id:"sam",  name:"Sam's Barstool Network", desc:"Free mojitos, free intel.",             base:1200,   cps:16},
  {id:"fi",   name:"Fiona's Demolitions",    desc:"Problems become craters.",              base:13000,  cps:85},
  {id:"mad",  name:"Mom's Phone Tree",       desc:"Madeline knows everyone's business.",   base:140000, cps:470},
  {id:"safe", name:"Safehouse Network",      desc:"A couch in every zip code.",            base:1.5e6,  cps:2700},
  {id:"spook",name:"Spook Contacts",         desc:"Old friends with new agendas.",         base:2.2e7,  cps:16000},
  {id:"burn", name:"Burn-List Takedown",     desc:"Find who burned you. Return the favor.",base:3.5e8,  cps:110000},
];
