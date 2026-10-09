import type { Arc } from "../types";

// Multi-step cases adapted from the show's bigger story episodes. Each step is a mission;
// closing the last one writes a Case File epilogue and pays a favor bonus.
export const ARCS: Arc[] = [
  {id:"looseends", title:"Loose Ends", at:3e4, ally:"fiona", favors:3,
   blurb:"Sam's job with a woman and her partner went bad, and he's in the hands of heroin smugglers. Government agents are also looking for you.",
   epilogue:"Sam is home, annoyed, and already complaining about the coffee. Somewhere in a government office, a file about you gets thicker.",
   steps:[
     {n:"Find Where Sam Is Being Held", dur:40, succ:.85, heat:6,  rm:1.6},
     {n:"Hit the Smugglers' Boat",      dur:55, succ:.75, heat:14, rm:2.4},
     {n:"Get Sam Home",                 dur:50, succ:.8,  heat:10, rm:2.8},
   ]},
  {id:"nateark", title:"Brotherly Love", at:5e5, ally:"nate", favors:3,
   blurb:"Nate has a job. It involves drugs, a deal and a plan that does not sound like a plan. Naturally, he's in over his head.",
   epilogue:"Nate is safe. He says he had it under control. Madeline lets him say it.",
   steps:[
     {n:"Meet Nate's Contact",        dur:40, succ:.8,  heat:8,  rm:1.8},
     {n:"Break Up the Deal",          dur:55, succ:.7,  heat:16, rm:2.6},
     {n:"Bring Nate Home in One Piece", dur:50, succ:.75, heat:10, rm:3.0},
   ]},
  {id:"lesserevil", title:"Lesser Evil", at:2e6, ally:"fiona", favors:5,
   blurb:"Carla's secrets are about to come out, and she knows it. A houseboat, a hostage and a deadline are all in play.",
   epilogue:"The Organization's case officer is gone. The Organization isn't. But for one night, you can sleep.",
   steps:[
     {n:"Expose What Carla Has Been Hiding", dur:50, succ:.8,  heat:10, rm:2.4},
     {n:"Set the Trap",                      dur:65, succ:.7,  heat:18, rm:3.4},
     {n:"Walk Away From the Houseboat",      dur:70, succ:.65, heat:22, rm:4.4},
   ]},
  {id:"devilyouknow", title:"Devil You Know", at:2e8, ally:"sam", favors:5,
   blurb:"A dangerous prisoner escapes, and he has Michael's name on a very long list. Finding him is the easy part.",
   epilogue:"The man who wrote the list is back in play, and he's more useful than anyone is comfortable admitting.",
   steps:[
     {n:"Track the Escaped Prisoner",  dur:55, succ:.75, heat:12, rm:3.0},
     {n:"Work Out His Plan",           dur:60, succ:.7,  heat:14, rm:3.8},
     {n:"Stop It Before It Starts",    dur:75, succ:.65, heat:24, rm:5.2},
   ]},
  {id:"laststand", title:"Last Stand", at:8e9, ally:"sam", favors:8,
   blurb:"A tactical team is closing in, and the only place left to hold is an unfinished construction site. Your whole crew is in the line of fire.",
   epilogue:"You walk out. Not everyone does so cleanly, but everyone who matters does. Someone is going to pay for the construction site.",
   steps:[
     {n:"Get Everyone to the Site",   dur:60, succ:.7,  heat:18, rm:4.4},
     {n:"Hold the Line",              dur:75, succ:.65, heat:26, rm:5.6},
     {n:"Make It Out Alive",          dur:80, succ:.6,  heat:30, rm:7.0},
   ]},
];
