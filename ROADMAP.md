# Burned: Miami Idle: ideas for later

Things that would make the game better but aren't built yet. Roughly in the order I'd do them.

## 1. Light automation, unlocked with progress

Idle games reward you for not clicking. Tie a few chores to Credibility or favors so each Reinstate unlocks something besides a percentage.

- **Auto-take clients:** a "client at the door" is accepted on its own (pays the usual fee, draws the usual heat).
- **Auto-send crew:** missions go out with the best-fit ally on their own, when one is free.
- **Auto-start missions:** keep the board working while you're away. Needs a rule for which ones (best odds? cheapest heat?).
- **Auto-Lay-Low at a threshold you choose.** Madeline and one upgrade already do it at 95%; make the number adjustable.
- Each should have an off switch, and probably a small cost (income, or a cut of the fee) so manual play stays worth it.

Do this after a balance pass, since automation changes how fast everything else goes.

## 2. A Stats card

A pop-up from the toolbar with the numbers players like to compare:

- Time played, lifetime income, income per second right now.
- Missions won and lost, bosses beaten (and which ones), favors earned and spent.
- Best run so far, and this run against it, which makes Reinstate feel like a decision.
- Longest time away, biggest single payout.

Most of it is already in `S.stats`. It mainly needs a panel and a few extra counters (best run, longest absence).

## 3. A Reinstate preview

Say what the reset would give you before you do it:

- Credibility and favors gained now, and the income bonus that means.
- What you keep and what you lose (the pop-up already explains this).
- How far to the next Credibility point, and roughly how long that takes at the current rate.
- A gentle "you'll earn more by waiting" hint when the next point is close.

## 4. Smaller ideas

- **Real portraits:** the drawn sketches are as lifelike as vector art gets. For true realism, drop images named after each character's id (`michael.webp`, `sam.jpg`, ...) into `src/assets/portraits/` and the game uses them instead of the drawings, falling back to the sketch for anyone without a file. Nate has a second image, `natelv`, that replaces `nate` once he's back from Vegas (if there's no `natelv` file, the `nate` picture stays). Only use images you have the rights to.
- **Share preview image:** the page has Open Graph tags but no picture. A 1200×630 PNG (the header art with the title) would make links look right in chats.
- **Browser notifications:** an opt-in "a boss is at the door" alert when the tab is in the background. The tab title already flags it.
- **Cloud save or a short save code:** export works, but a long base64 string is awkward on a phone.
- **More cast:** Ruth and Charlie (Nate's family) as flavor somewhere; Diego Garza (Season 3 CIA contact, dies in 309) and Max (Season 5) as non-crew flavor; more one-episode villains as Rogues if they're disruptive enough, as Thomas O'Neill is.
- **Sound pass:** a few more cues (boss arrives, mission paid, welcome back) and a volume slider rather than on/off.
- **Reduced-motion setting:** skip the pop and shake animations for people who want it quieter.
- **Tablet check:** phone width and desktop are checked; the in-between widths haven't had a proper look.
- **Balance pass after a long playthrough:** several Reinstates in, check boss timing, favor prices and how fast the late seasons open.

## 5. Second pass: what would make it feel finished

**Before launch (small, worth doing)**
- **Real-device playtest:** phone and tablet widths, a long session, and a couple of Reinstates. Watch Vercel's INP numbers after each deploy.
- **Accessibility pass:** keyboard focus for pop-ups and the case tile, a reduced-motion setting, and checking contrast on the dimmed cards.
- **Share image:** a 1200×630 preview for links, using the header art and the photos.

**An ending that lands**
- **Burn lifted screen:** crossing off everyone on The List sets a flag and a +25% bonus, but there's no moment. A short epilogue card (Michael, Fiona, Sam, Madeline, Nate's kid) and a "keep playing" button would give the run a finish.
- **Late-story deaths:** Nate's Season 6 fate, Anson's end and Cowan's death could use the same "after the story beat" treatment that Carla now has, as quiet in-game moments rather than missing characters.

**More to do mid-game**
- **Automation unlocks** (auto-take clients, auto-send crew), tied to Credibility.
- **Stats card** and a **Reinstate preview**, so resets feel like decisions.
- **Photos on mission cards:** show the client and the villain next to each episode mission, using the portraits already in the game.
- **More random events:** Nate's excuses, Madeline's phone tree, a Sam story, a Barry rate-card moment. Each is a few lines of text.

**Nice to have**
- **Install as an app** (works offline, home-screen icon) and a **sound pass** with a volume slider.
- **Seasonal flavor:** a one-line recap card when each new Season opens.

## Done recently, for reference

Full-rate offline progress (24 h cap), a "Welcome back" summary card, a live tab title, number safety (finite totals, a scientific-notation switch, sanitized saves), a backup reminder, Barry selling favors, Victor then Simon then Pearce as the intel contact, Thomas O'Neill as a Rogue, staged Nate story beats, Michael's File, the rotating-to-ready case tile, and the header skyline.
