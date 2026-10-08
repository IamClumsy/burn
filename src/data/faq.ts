import { REINSTATE_MIN } from "../calc";
import { GRIP_PERKS, TIERS } from "./org";
import { COVERS } from "./covers";
import { money } from "../util";

export interface FaqItem { q: string; a: () => string }
export interface FaqSection { title: string; items: FaqItem[] }

const covers = () => COVERS.map(c => `${c.name}: ${c.desc}`).join("; ");

/**
 * Answers are functions so numbers (thresholds, stages, perks) come from the same data the game uses
 * and can't drift out of date.
 */
export const FAQ: FaqSection[] = [
  {title: "The basics", items: [
    {q: "What am I supposed to be doing?",
     a: () => "You're Michael Westen, a spy who was burned and dumped in Miami with nothing. Take jobs, build a network that earns for you, help people who need it, and outmaneuver the people who burned you. The Case File tells the story as you earn."},
    {q: "How do I make money?",
     a: () => "Five ways: click Take a Job; odd jobs give you a small trickle even with nothing running; Operations earn passively; missions and cases pay when they finish; and the occasional client knocks at the door. Boss encounters pay well too."},
    {q: "Why does a mission say \"pays $50K\" but my cash goes up less?",
     a: () => "Clients pay the full fee, and Michael keeps what he needs for expenses and returns the rest to the people who needed it. The Medals pop-up tracks how much you've given back."},
    {q: "What do Buy ×1, ×10, ×100 and Max do?",
     a: () => "They set how many of an operation you buy per click. Each purchase raises that operation's price by 15%, so the row shows the total for the batch. Max buys as many as your cash covers."},
    {q: "What do Upgrades do?",
     a: () => "They're one-time buys. Some multiply job pay, some boost one operation, some boost all income, and a few help with heat. They reset when you Reinstate."},
  ]},
  {title: "Heat and the Organization", items: [
    {q: "What is heat?",
     a: () => "Heat is how much attention your activity draws. Jobs, operations and missions raise it. At 100% you're burned again: you lose half your cash and heat drops back to 30. Lay Low cuts it, and Madeline or the Hands-Off Handler upgrade can do it for you."},
    {q: "What is the Organization's attention?",
     a: () => `It's how closely the people who burned you are watching. It has four stages: ${TIERS.map(t => `${t.name} (${t.min}%+)`).join(", ")}. Higher stages make heat build faster and missions riskier. At 100% you're ambushed: you lose a quarter of your cash and your missions fall apart. Pay Off a Fixer, Madeline's Family Dinner and Simon's intel favors bring it down.`},
    {q: "What's \"Their grip on you\"?",
     a: () => `A bar that starts at 100% and drops as you win: missions, boss encounters, closed cases, and outsmarting handlers. It grants permanent perks: ${GRIP_PERKS.map(p => `at ${p.at}%, ${p.desc.toLowerCase()}`).join("; ")}.`},
    {q: "What are handler errands?",
     a: () => "Once the Organization is watching, a handler sends you a job. You can do it as asked (big pay, more attention), do it your own way (a gamble that can loosen their grip or backfire), or refuse (some heat, but you stay your own man)."},
    {q: "What's The List?",
     a: () => "The people who helped burn you. Outmaneuvering a boss crosses their name off, and Simon sometimes passes you one early. Cross off all thirteen to lift the burn for good: favors and +25% income."},
  ]},
  {title: "Missions and your crew", items: [
    {q: "What do the numbers on a mission mean?",
     a: () => "On a running mission, the seconds are how long until it finishes and the percentage is its chance to succeed. That chance is locked in when you start. If it fails, you take extra heat and get nothing."},
    {q: "Why can't I send an ally on a mission?",
     a: () => "The mission card says why. They're either not hired yet (hire them from Crew), already out on another mission, or, for Nate, wandered off. An ally can only be on one mission at a time, and the case missions send theirs in automatically."},
    {q: "Why do missions with kids never fail?",
     a: () => "It's Michael's rule. Anything involving a kid always succeeds, no matter how hot things are. Those missions are marked \"Never fails.\""},
    {q: "Who is Nate, and why does he keep disappearing?",
     a: () => "Michael's younger brother. He's charming and about as reliable as Miami weather, so he wanders off and returns on his own schedule. While he's around you get +15% income and his Big Idea ability (a gamble). While he's away neither works, and you can't send him on missions."},
    {q: "Who are Seymour and Simon?",
     a: () => "Frienemies, not crew. Michael avoids them and keeps their numbers anyway. Seymour Talbot sells hardware favors: +1 favor and some gadget parts. Simon Escher sells intel favors: +1 favor and less Organization attention, with a risk he goes off script. Prices rise with every favor and reset when you Reinstate."},
    {q: "What are favors for?",
     a: () => "Spend them on permanent perks in the Favors card, or call one in during a boss encounter. You earn favors from missions, cases, story beats and boss wins, and you can buy them from Seymour and Simon. Barry gets you a discount on those."},
    {q: "What are Gadgets and junk?",
     a: () => "Taking jobs and owning Duct-Tape Gadgets drops junk: tape, wire, bleach and microwaves. Spend it to craft one-off boosts such as a smoke bomb or a jammer, or on a gadget during a boss encounter."},
    {q: "What do Covers do?",
     a: () => `Your cover changes how you earn. ${covers()}. Open Covers from The Loft; you can switch every 20 seconds once a cover is unlocked.`},
  ]},
  {title: "Bosses, cases and the story", items: [
    {q: "How do boss encounters work?",
     a: () => "A boss appears every few minutes. You're not fighting, you're outmaneuvering them: the bar is their cover, and your network wears it down on its own. Work the Angle builds leads, Run a Con is a risky big hit, a Gadget or a Favor costs resources, and Spring the Trap spends your leads for the biggest hit. If the clock runs out they get away: you lose some cash and take heat."},
    {q: "What are Open Cases?",
     a: () => "Multi-step missions at the top of the Missions card, adapted from big episodes. Finish every step to close the case: it writes a Case File epilogue, pays favors, and weakens the Organization. A failed step can be retried."},
    {q: "What do story choices do?",
     a: () => "A few Case File moments ask you to decide. Each choice gives a permanent bonus, such as more income, safer missions, or less attention, and the Case File records what you picked."},
  ]},
  {title: "Progress and saving", items: [
    {q: "What does Reinstate do?",
     a: () => `Once you've earned ${money(REINSTATE_MIN)} in a single run, you can reset in exchange for permanent Credibility. Each point is +10% income and job pay, and also raises your odd-jobs trickle. You keep allies, perks, medals, boss wins, the Case File and your choices. Cash, operations, upgrades, missions and heat reset.`},
    {q: "What are medals?",
     a: () => "Achievements. Each one gives +2% income, forever. The Medals pop-up shows which you have and what's left."},
    {q: "Does the game earn while I'm away?",
     a: () => "Yes, at half rate for up to eight hours. Running missions finish, and heat and attention cool off."},
    {q: "Where is my save, and how do I move it?",
     a: () => "In your browser, saved every couple of seconds. It's tied to the site's address, so a different browser or device starts fresh. Use export save in the footer to copy a code, and import save on the other side. Private windows and cleared site data can lose it."},
    {q: "Can I start over?",
     a: () => "Wipe save in the footer clears everything and reloads. It can't be undone, so export first if you might want it back."},
  ]},
];
