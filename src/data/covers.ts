import type { Cover } from "../types";

/**
 * Michael's identities. Each one trades something for something: jobs, income, mission pay, or how loud you are.
 * Listed in the order they unlock (lifetime earnings).
 */
export const COVERS: Cover[] = [
  {id:"con",   name:"Contractor",         desc:"Jobs ×1.3",                          job:1.3,inc:1,   heat:1,   mis:1,   unlock:0},
  {id:"chuck", name:"Chuck Finley",       desc:"Sam's old alias. Jobs ×1.4, income ×1.2, mission rewards ×1.2, heat −10%", job:1.4,inc:1.2, heat:.9,  mis:1.2, unlock:0, arc:"samfall"},
  {id:"tour",  name:"Tourist",            desc:"Heat −30%, income ×0.9",             job:1,  inc:.9,  heat:.7,  mis:1,   unlock:1e4},
  {id:"limo",  name:"Limo Driver",        desc:"Jobs ×1.6, heat +10%",               job:1.6,inc:1,   heat:1.1, mis:1,   unlock:5e4},
  {id:"jour",  name:"Journalist",         desc:"Mission rewards ×1.5, income ×0.9",  job:1,  inc:.9,  heat:1,   mis:1.5, unlock:1e5},
  {id:"arms",  name:"Arms Dealer",        desc:"Income ×1.4, heat +40%",             job:1,  inc:1.4, heat:1.4, mis:1,   unlock:1e6},
  {id:"yacht", name:"Yacht Broker",       desc:"Income ×1.25, mission rewards ×1.2", job:1,  inc:1.25,heat:1,   mis:1.2, unlock:1e7},
  {id:"agent", name:"Real Estate Agent",  desc:"Heat −20%, income ×1.15",            job:1,  inc:1.15,heat:.8,  mis:1,   unlock:5e7},
  {id:"guard", name:"Private Security",   desc:"Mission rewards ×1.4, heat +15%",    job:1,  inc:1,   heat:1.15,mis:1.4, unlock:2e8},
  {id:"conc",  name:"Hotel Concierge",    desc:"Heat −40%, income ×0.85",            job:1,  inc:.85, heat:.6,  mis:1,   unlock:1e9},
  {id:"chef",  name:"Restaurateur",       desc:"Income ×1.5, mission rewards ×0.9",  job:1,  inc:1.5, heat:1,   mis:.9,  unlock:5e9},
  {id:"dip",   name:"Retired Diplomat",   desc:"Jobs ×1.8, heat −15%",               job:1.8,inc:1,   heat:.85, mis:1,   unlock:3e10},
  {id:"art",   name:"Art Dealer",         desc:"Income ×1.6, heat +30%",             job:1,  inc:1.6, heat:1.3, mis:1,   unlock:2e11},
  {id:"law",   name:"Defense Attorney",   desc:"Mission rewards ×2, heat +50%",      job:1,  inc:1,   heat:1.5, mis:2,   unlock:1e12},
];
