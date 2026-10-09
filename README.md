# Burned: Miami Idle

An idle game about a burned spy rebuilding his life in Miami. Take jobs, build a network, run missions with your crew, manage heat, and outlast the people who burned you.

Built with Vite and TypeScript. No framework, no runtime dependencies.

## Develop

    npm install
    npm run dev        # http://localhost:5173
    npm test           # data integrity, math, and a headless run of the game loop
    npm run build      # typecheck + production build into dist/

## Layout

    src/
      main.ts          entry point and event wiring
      state.ts         game state, save-shape merging
      calc.ts          income, heat, prices, success odds (pure, tested)
      persist.ts       saving, loading, offline earnings, import/export
      data/            ops, upgrades, allies, missions, bosses, story, medals, events...
      game/            tick loop, missions, bosses, actions, events, ally abilities
      ui/              rendering, panels, effects
    *.test.ts          vitest suites next to the code they cover

Adding content is mostly editing files in `src/data/`. `src/data/data.test.ts` checks that ids are unique, every mission names a real ally, kid missions always succeed, and so on.

## Deploy
Import the repo on Vercel. The preset is detected as **Vite** (`vercel.json` sets the build and output directory). Every push to `main` redeploys.

Progress is saved in the browser. Use *Export save* / *Import save* in Settings (the menu button at the bottom right) to move it between browsers.
