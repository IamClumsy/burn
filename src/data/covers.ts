import type { Cover } from "../types";

export const COVERS: Cover[] = [
  {id:"con",  name:"Contractor",  desc:"Jobs ×1.3",                       job:1.3,inc:1,  heat:1,  mis:1,   unlock:0},
  {id:"tour", name:"Tourist",     desc:"Heat −30%, income ×0.9",          job:1,  inc:.9, heat:.7, mis:1,   unlock:1e4},
  {id:"jour", name:"Journalist",  desc:"Mission rewards ×1.5, income ×0.9",job:1, inc:.9, heat:1,  mis:1.5, unlock:1e5},
  {id:"arms", name:"Arms Dealer", desc:"Income ×1.4, heat +40%",          job:1,  inc:1.4,heat:1.4,mis:1,   unlock:1e6},
];
