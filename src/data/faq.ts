import { REINSTATE_MIN } from "../calc";
import { GRIP_PERKS, TIERS } from "./org";
import { BOSSES } from "./bosses";
import { COVERS } from "./covers";
import { money } from "../util";
import { bossGapText } from "./pacing";

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
     a: () => "They set how many of an operation you buy per click. Each purchase raises that operation's price by 15%, so the row shows the total for the batch. Max buys as many as your cash covers. You can own up to 250 of any one operation: the last boost upgrade is at 200, so every bonus is reachable, and once an operation is maxed its row says so."},
    {q: "What do Upgrades do?",
     a: () => "Most are one-time buys: some multiply job pay, some boost all income, and a few help with heat. Every operation also has six tiers of upgrades that unlock as you own more of it (10, 25, 50, 100, 150 and 200). And \"Satisfied Clients Refer Friends\" can be bought again and again, so there's always something to spend on. They reset when you Reinstate."},
  ]},
  {title: "Heat and the Organization", items: [
    {q: "What is heat?",
     a: () => "Heat is how much attention your activity draws. Jobs, operations and missions raise it. At 100% you're burned again: you lose half your cash and heat drops back to 30. Lay Low cuts it, and Madeline or the Hands-Off Handler upgrade can do it for you."},
    {q: "What is the Organization's attention?",
     a: () => `It's how closely the people who burned you are watching. It has ${TIERS.length} stages: ${TIERS.map(t => `${t.name} (${t.min}%+)`).join(", ")}. Higher stages make heat build faster and missions riskier. At 100% you're ambushed: you lose a quarter of your cash and your missions fall apart. Paying off a fixer, Madeline's Family Dinner and your intel contact's favors bring it down.`},
    {q: "Who is Management?",
     a: () => "The Organization's top figure: a humorless old man who arrived by helicopter at the end of Season 2 and offered Michael Carla's job. He isn't the whole Organization, just the man at the top. At 90% attention you've caught his personal interest: that's the Management stage, with heat building 40% faster and missions 15% less likely to succeed. The story also gives you his offer as a choice when you reach the end of Season 2."},
    {q: "Why does the fixer's price keep changing?",
     a: () => "Fixers come and go. Each one who turns up has their own price and their own reach: some are cheap and do a little, some are pricey and do a lot, and now and then you'll get lucky. They move on after a minute or so, and once you pay one, a different one takes their place. Prices also climb the closer the Organization is to you, so it's cheaper to deal with them early. Barry and a loosened grip bring prices down."},
    {q: "What's \"Their grip on you\"?",
     a: () => `A bar that starts at 100% and drops as you win: missions, boss encounters, closed cases, and outsmarting handlers. Someone new is always after Michael, so it starts over at 100% every time a new Season opens, and you earn the perks again. At each stage it grants a perk: ${GRIP_PERKS.map(p => `at ${p.at}%, ${p.desc.toLowerCase()}`).join("; ")}.`},
    {q: "What are handler errands?",
     a: () => "Once the Organization is watching, a handler sends you a job. You can do it as asked (big pay, more attention), do it your own way (a gamble that can loosen their grip or backfire), or refuse (some heat, but you stay your own man). Who calls follows the show: Carla at first, then Management himself after her fall, then Vaughn, and finally Tom Card."},
    {q: "What's The List?",
     a: () => `The people who helped burn you. Outmaneuvering a boss crosses their name off, and your intel contact sometimes passes you one early. Cross off all ${BOSSES.length} to lift the burn for good: favors and +25% income.`},
  ]},
  {title: "Missions and your crew", items: [
    {q: "What do the numbers on a mission mean?",
     a: () => "On a running mission, the seconds are how long until it finishes and the percentage is its chance to succeed. That chance is locked in when you start. If it fails, you take extra heat and get nothing."},
    {q: "Why can't I ask an ally for help on a mission?",
     a: () => "The mission card says why. They're either not hired yet (hire them from Crew), already helping with another mission, or, for Nate, wandered off. An ally can only help with one mission at a time, and the case missions ask theirs for help automatically. A mission built around someone, like the ones about Nate or Fiona, can't be started at all while they're away: Nate has wandered off, or Fiona is still recovering from being taken. Do something else and come back."},
    {q: "Where do the missions come from?",
     a: () => "Every mission is adapted from an episode of the show, and the board shows which one. Season 1 cases are open from the start, and later seasons open as you earn more, so the cases get bigger as Michael's reputation grows. The Missions card keeps count of how many episodes you've worked. The board favors episodes you haven't done yet, and cases from the Season you're in turn up most often, so each Season is possible to finish."},
    {q: "Who are the faces?",
     a: () => "The people from the show, shown as pictures. They appear in Crew, Rogues, The List and boss encounters. Someone you haven't met yet is a ? silhouette until you do. Nate has two pictures: the one you start with, and a new one after he comes back from Vegas with Ruth."},
    {q: "What's the spy notebook?",
     a: () => "Each episode's mission has a spy tip attached. Complete the mission and the tip goes into your Spy notebook, at the bottom of the Case File. Mission cards also name the client and who you're up against, and the narration mentions them when you win or lose."},
    {q: "Why do missions with kids never fail?",
     a: () => "It's Michael's rule. Anything involving a kid always succeeds, no matter how hot things are. Those missions are marked \"Never fails.\" Asking an ally to help on one earns an extra favor, since better odds wouldn't help."},
    {q: "Why can't I hire Jesse yet?",
     a: () => "Characters only join when they join the show. Jesse first turns up in Season 4, so he can't be hired, and won't appear on missions, until Season 4 cases open. His missions are all from the episodes he's actually in.",
    },
    {q: "What does Madeline help with?",
     a: () => "Michael doesn't ask his mother for help until Season 3, and she isn't part of the spy business or cheap to bring in. On missions she only helps with cases involving kids or older folks, and those cases show her as the one to ask. Her other perks, a faster Lay Low and automatic Lay Low at 95% heat, work all the time."},
    {q: "Who is Nate, and why does he keep disappearing?",
     a: () => "Michael's younger brother: a reformed gambler and con man who runs a limo company, hotwires cars better than Michael does, and lives in Michael's shadow. He's charming and about as reliable as Miami weather, so he wanders off (to Vegas, to meetings, to wherever the plan is) for hours at a time and returns on his own schedule. His first few returns follow the show: a surprise Vegas bride, a baby, a hard season. While he's around you get +15% income and his Big Idea ability (a gamble). While he's away neither works, and you can't send him on missions."},
    {q: "Who are Seymour and my intel contact?",
     a: () => "Frienemies, not crew. Michael avoids them and keeps their numbers anyway. Seymour Talbot sells hardware favors: +1 favor and some gadget parts. He'd sooner be paid in company, so you can pay full price or about half and spend the afternoon with him, which ties Michael up for 30 to 45 seconds. Your intel contact (Victor, then Simon, then Pearce) sells intel favors: +1 favor and less Organization attention, with a risk he goes off script, and he's the pricier of the two. Prices rise with every favor and reset when you Reinstate, but they never go past $100K: Michael doesn't have that kind of money. Each of them will only sell you four favors in any 24 hours of real time, so they stay a treat. The limit carries over when you Reinstate. The intel contact changes with the story: Victor Stecker-Epps at the start, Simon Escher once Season 3 opens (Victor is gone by the Season 2 finale), and Dani Pearce after Simon dies in Season 7 (episode 11, Tipping Point). They all sell the same intel favors."},
    {q: "What are favors for?",
     a: () => "Spend them on permanent perks in the Favors pop-up (a button in The Loft), or call one in during a boss encounter. You earn favors from missions, cases, story beats and boss wins, and you can buy them from Seymour, your intel contact and Barry. Barry gets you a discount on those, and he sells favors himself, whether or not you've hired him: cheaper than the frienemies, with a little heat scrubbed off, and four a day."},
    {q: "What are Gadgets and junk?",
     a: () => "Taking jobs and owning Duct-Tape Gadgets drops junk: tape, wire, bleach and microwaves. Spend it to craft one-off gadgets: a smoke bomb or a bug sweeper for instant relief, a jammer, signal booster, fake ID kit, burner phones or a forged paper trail for a few minutes of a big boost, or spend it on a gadget during a boss encounter. Two or three gadgets in a row can change a whole stretch of play."},
    {q: "What do Covers do?",
     a: () => `Your cover changes how you earn. ${covers()}. Open Covers from The Loft; you can switch every 20 seconds once a cover is unlocked.`},
  ]},
  {title: "Bosses, cases and the story", items: [
    {q: "How do boss encounters work?",
     a: () => `A boss appears about every ${bossGapText()}. You're not fighting, you're outmaneuvering them: the bar is their cover, and your network wears it down on its own. The big tile in the case card always offers whichever of your tools is ready, and moves on to the next when you use it: Play an Angle (builds a lead), Stake Out the Place (two leads), Go Undercover (cools heat), Call in the Crew (someone around helps), Run a Con (a risky big hit), then Improvise a Gadget and Call In a Favor, which cost resources. Spring the Trap has its own button and spends your leads for the biggest hit. If the clock runs out they get away: you lose some cash and take heat. While a case is on, everything else holds still: missions stop their clocks, Nate stays put, new clients and errands wait, and news pop-ups queue up until it's over.`},
    {q: "Why is Fiona gone during one of the fights?",
     a: () => "That's Thomas O'Neill, an Irish terrorist with a grudge who kidnaps Fiona. He only shows up if Fiona is on your crew. While he has her, her income bonus and her ability are off, heat climbs and the clock runs faster. Beat him and she's free right away (+2 bonus favors). Lose, and she stays away for 10 minutes."},
    {q: "Why is Carla's fight called \"Carla's Last Orders\"?",
     a: () => "Carla dies in the Season 2 finale, but the errands, accounts and threats she set up kept running. Once the story passes that point, her fight becomes her Last Orders: the same boss, with a dead woman's schedule still ticking. She stays on The List as Carla Baxter until you cross her off. Cowan and Anson work the same way: once the story shows what happened to them, their fights become what they left behind, Cowan's Unfinished Sentence and Anson's Contingencies."},
    {q: "What are Open Cases?",
     a: () => "Multi-step missions at the top of the Missions card, adapted from big episodes. Finish every step to close the case: it writes a Case File epilogue, pays favors, and weakens the Organization. A failed step can be retried."},
    {q: "What do story choices do?",
     a: () => "A few Case File moments ask you to decide. Each choice gives a permanent bonus, such as more income, safer missions, or less attention, and the Case File records what you picked."},
  ]},
  {title: "Progress and saving", items: [
    {q: "What is Automation?",
     a: () => "Chores the game will do for you once you've earned enough Credibility from Reinstating. Auto-take clients (Credibility 2) takes a client's case without a pop-up, for a bit less pay. Auto-send crew (Credibility 3) asks the right crew member for help on every mission you start, if they're around and free. Switch each on or off in the Automation pop-up."},
    {q: "What's on the Stats card?",
     a: () => "Your totals across every run: time played, income, missions won and lost, bosses beaten, your best single run, and how long you've been away at most. The Reinstate pop-up also previews what a reset would give you and when your next Credibility point arrives, and tells you if Fiona will go off for a while (she does, after every reinstatement, for one to four hours)."},
    {q: "What happens when the List is complete?",
     a: () => "When you cross off the last name, the burn is lifted: +15 favors and +25% income for good. You get a short epilogue with Michael, Fiona, Sam, Madeline and Nate's son Charlie, and it's saved at the bottom of the Case File. The game keeps going: Miami never closes."},
    {q: "What's the bar at the bottom of the screen?",
     a: () => "Michael's face (tap it for his file), your Credibility, and how far this run is toward the next point. \"Credibility 2 → 8\" means you have 2 now and would have 8 if you reinstated once the bar fills. The buttons on the right take you back to the top, open the Narrator in a pop-up so you can read everything it has said, and open the menu (every reference screen, plus Settings for sound, pop-ups, number style and saves)."},
    {q: "What does Reinstate do?",
     a: () => `Once you've earned ${money(REINSTATE_MIN)} in a single run, you can reset in exchange for permanent Credibility. Each point is +10% income and job pay, and also raises your odd-jobs trickle. You keep your crew, perks, medals, boss wins, the Case File, your choices and where Nate's story stands. The exception is anyone who joins late in the show, like Madeline and Jesse: you hire them again. Cash, operations, upgrades, missions and heat reset. Fiona goes off on her own for one to four hours after every reinstatement, and her missions and income bonus wait until she's back.`},
    {q: "What are medals?",
     a: () => "Achievements. Each one gives +2% income, forever. The Medals pop-up shows which you have and what's left."},
    {q: "What's Michael's File?",
     a: () => "The Organization's dossier on you, in its own pop-up. The more attention you draw, the more of it they fill in: his name and status first, then his old job, his address, his associates, the people he loves, and finally what they recommend. The file never shrinks, even when your attention drops."},
    {q: "Does the game earn while I'm away?",
     a: () => "Yes, at the full rate for up to 24 hours at a time, whether the tab is closed or just in the background. Missions finish, cooldowns run down, and heat and attention cool off. Bosses never show up while you're gone, and Nate can still wander off and come back. When you return after more than a minute, one Welcome back card sums up the time away, what you earned and which missions finished."},
    {q: "Where is my save, and how do I move it?",
     a: () => "In your browser, saved every couple of seconds. It's tied to the site's address, so a different browser or device starts fresh. Open the menu (the button at the bottom right), then Settings, and use Export save to copy a code, and Import save on the other side. Private windows and cleared site data can lose it, so after a couple of hours of play the game reminds you once to back it up."},
    {q: "Why does the browser tab show money and warnings?",
     a: () => "The tab title is a status line for when the game is in a background tab. Normally it shows your cash. It switches to \"(!) Case\" with the boss's name and time left during an encounter, and to \"(!) News waiting\" when a pop-up needs you."},
    {q: "Why do big numbers show as 1.23e9?",
     a: () => "Numbers use letters (K, M, B, T and onward) and switch to scientific form once they get truly huge. \"Big numbers\" in Settings switches everything to scientific notation if you prefer. It only changes how numbers look, never the game."},
    {q: "Can I start over?",
     a: () => "Wipe save in Settings (menu, bottom right) clears everything and reloads. It can't be undone, so export first if you might want it back."},
  ]},
];
