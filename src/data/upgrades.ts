import type { Upgrade } from "../types";

export const UPGS: Upgrade[] = [
  {id:"u1", name:"Better Cover Story",   desc:"Jobs pay ×2",              cost:100,   kind:"click", m:2},
  {id:"u2", name:"Fake Credentials",     desc:"Jobs pay ×3",              cost:2500,  kind:"click", m:3},
  {id:"u3", name:"Network of Clients",   desc:"Jobs pay ×5",              cost:90000, kind:"click", m:5},
  {id:"g1", name:"Prepaid Burners",      desc:"Informants ×2",            cost:500,   kind:"gen", g:"inf",  m:2},
  {id:"g2", name:"Bigger Roll of Tape",  desc:"Gadgets ×2",               cost:3000,  kind:"gen", g:"tape", m:2},
  {id:"g3", name:"Bar Tab on the House", desc:"Sam's network ×2",         cost:25000, kind:"gen", g:"sam",  m:2},
  {id:"g4", name:"Shaped Charges",       desc:"Fiona's demolitions ×2",   cost:260000,kind:"gen", g:"fi",   m:2},
  {id:"g5", name:"Family Dinner Rota",   desc:"Phone tree ×2",            cost:2.8e6, kind:"gen", g:"mad",  m:2},
  {id:"g6", name:"Couch Upgrades",       desc:"Safehouses ×2",            cost:3e7,   kind:"gen", g:"safe", m:2},
  {id:"g7", name:"Deep Cover Moles",     desc:"Spook contacts ×2",        cost:4e8,   kind:"gen", g:"spook",m:2},
  {id:"a1", name:"Word Gets Around",      desc:"Everyone's heard of you. All income ×1.5",          cost:50000, kind:"all", m:1.5},
  {id:"a2", name:"Michael's Rolodex",     desc:"A name for every problem. All income ×2",         cost:5e6,   kind:"all", m:2},
  {id:"a3", name:"A Name People Trust",  desc:"Clients come to you. All income ×3",         cost:6e8,   kind:"all", m:3},
  {id:"h1", name:"Quiet Methods",        desc:"Heat gain −40%",           cost:20000, kind:"heat"},
  {id:"h2", name:"Fiona Cleans Up",      desc:"Lay Low removes 60 heat",  cost:150000,kind:"lay"},
  {id:"h3", name:"Hands-Off Handler",    desc:"Auto Lay Low at 90% heat", cost:800000,kind:"auto"},
];
