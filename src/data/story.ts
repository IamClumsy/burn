import type { StoryBeat } from "../types";

// Beats follow the show's arc, in order. Each unlocks at a lifetime-earnings milestone.
export const STORY: StoryBeat[] = [
  {at:1e3,   fav:1,  t:"Dumped in Miami",
   x:"You were burned on a job in Nigeria and left in Miami with no money, no credit and no agency. The first door you knock on is your mother's."},
  {at:2.5e4, fav:2,  t:"The Man Who Burned You",
   x:"Phillip Cowan was ordered to burn you. He says the reason is bigger than either of you. Before he can explain, a sniper makes sure he never will."},
  {at:2e5,   fav:2,  t:"A Case Officer Named Carla",
   x:"A woman named Carla tells you she's from the Organization, and that she ordered your burn so she could use you. Now she hands you errands, and every one comes with a threat to someone you love.",
   choice:{
     prompt:"Carla offers to keep you alive if you run her errands. How do you play it?",
     options:[
       {label:"Play along and take notes", result:"You run her errands and watch everything. Some of those notes will matter. Rewards from your cases grow.", fx:{mis:0.15}},
       {label:"Stall and stay out of sight", result:"You become hard to find. Carla gets impatient, but so do the people watching her. Your heat gain drops.", fx:{heat:-0.1}},
     ]}},
  {at:1.5e6, fav:3,  t:"Lesser Evil",
   x:"You find out what Carla did to the man who went rogue. You set her up to be undone by her own bosses. She sees it coming. Fiona gets there first."},
  {at:1.8e6, fav:3,  t:"There's the Door",
   x:"After Carla and Victor go down, a helicopter lands at the docks. A humorless old man the Organization calls Management flies you out over the ocean and offers you Carla's old job. When you hesitate, he opens the hatch.",
   choice:{
     prompt:"Management offers you Carla's job, thirty feet above the water, with the hatch open. What do you do?",
     options:[
       {label:"Take the offer", result:"He's pleased. You get money and protection, and a leash. Income rises, and so does the Organization's interest.", fx:{inc:0.1, att:0.15}},
       {label:"Take the door", result:"You jump. The water is cold and the swim is long, but you owe them nothing. Heat gain drops, and word of the jump earns you some respect.", fx:{heat:-0.05, favors:3}},
     ]}},
  {at:1e7,   fav:3,  t:"Detective on Your Tail",
   x:"A Miami detective notices the pattern around you, Fiona and Sam. She's not a spy. She's a cop with a case, and she's patient. You give her one of Miami's worst men to get her off your back.",
   choice:{
     prompt:"A Miami detective is closing in. She's not a spy, just a cop with a case. What do you give her?",
     options:[
       {label:"Hand her one of Miami's worst men", result:"She gets her arrest and leaves you alone, mostly. Heat gain drops a little, and you earn some goodwill.", fx:{heat:-0.05, favors:4}},
       {label:"Stay out of her way", result:"You keep a low profile and give her nothing. The Organization notices you less.", fx:{att:-0.15}},
     ]}},
  {at:6e7,   fav:4,  t:"Agents, Brokers and Psychopaths",
   x:"A broker offers you contacts for a price. Then he's gone, and someone far worse arrives to 'clean things up'. The method looks like a list of unsolved crimes."},
  {at:3e8,   fav:4,  t:"Simon's Bible",
   x:"The Organization's best assassin went rogue and wrote down every member in a book code. A CEO with an army wants it. You'd like to stay alive and know the names."},
  {at:2e9,   fav:5,  t:"Another Burned Spy",
   x:"A counterintelligence agent turns up as burned as you. You help him because it's right and because he's good. Soon he's not leaving.",
   choice:{
     prompt:"A counterintelligence agent is burned too, and he's good. How do you want to work with him?",
     options:[
       {label:"Bring him onto the team", result:"He's in. Your missions go smoother with another professional around.", fx:{succ:0.05}},
       {label:"Help him from a distance", result:"You keep your options open. Money from your network comes in a little easier.", fx:{inc:0.05}},
     ]}},
  {at:1.2e10,fav:5,  t:"The NOC List",
   x:"A list of everyone who helped burn you exists, and everyone wants it. A rogue arms dealer gets there first. So does your old mentor, who loves a good bonfire."},
  {at:6e10,  fav:6,  t:"The Founder",
   x:"The man you thought was a helpless hostage is the Organization's founder. He frames Fiona and says he'll lift the burn if you do him a favor. He's the first liar who's ever made you feel like a student.",
   choice:{
     prompt:"The man behind the Organization offers to lift the burn if you do him a favor. What do you tell him?",
     options:[
       {label:"Take his deal", result:"The money flows and the doors open. So does his attention on you. Income rises, and so does the Organization's interest.", fx:{inc:0.15, att:0.2}},
       {label:"Refuse", result:"He doesn't take it well. But your friends do, and word travels. You earn favors and the Organization pays less attention.", fx:{favors:8, att:-0.1}},
     ]}},
  {at:2.5e11,fav:6,  t:"Brothers and Strings",
   x:"Your brother is caught in the crossfire of a shot meant for someone else. He walks away shaken and, for once, not joking about it. The orders came from the man who taught you everything. You suspect it before you can prove it."},
  {at:7e11,  fav:8,  t:"The Mentor's Last Lesson",
   x:"Your mentor sends you and your team to Panama on a mission he calls routine. It's built to fail. You come back anyway, and he doesn't get another chance."},
  {at:2e12,  fav:8,  t:"Hunted by the Best",
   x:"A senior counterintelligence officer is assigned to take you down. She notices small details and hits where it hurts. You stay a step ahead and don't enjoy it."},
  {at:6e12,  fav:12, t:"Clean Slate",
   x:"The file is rewritten. The burn notice is gone, or close enough. Miami still has problems, and your phone is already ringing."},
];
