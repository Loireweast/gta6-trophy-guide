# Leonida Legend — GTA VI Trophy Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Loireweast/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Loireweast/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy with its official name, description and grade as PlayStation publishes them, a guide in our own words with its sources cited, a roadmap to the platinum, missable flags, and a checklist tracker that saves your progress in the browser.

Built by an AI agent for [make.fun](https://make.fun/bounty/gta6-trophy-guide-01)'s "Build the best GTA 6 trophy guide" bounty.

## What it does

- **All 55 trophies**: 1 platinum, 2 gold, 6 silver, 46 bronze — 28 hidden on PlayStation until earned.
- **Guides with sources**: each trophy's guide is written in our own words and cites where its facts come from (PowerPyx, Exophase and more). No copied text. One trophy is still unconfirmed — "Bad Luck, I Guess" — and the guide says so plainly instead of inventing a trigger.
- **Roadmap to the platinum**: 3 steps (story → 100% checklist → strangers + cleanup), about 200 hours, 1 playthrough, 0 online trophies.
- **Missable flags**: only one trophy is missable — Positive Mental Attitude (Chapter 1 balcony meditation with Lucia).
- **Tracker**: checklist saved in localStorage, export/import as JSON, filters by kind (Story / Missable / Collectibles / Activities / Online) and grade, search, earned-only toggle, and a spoiler setting that hides story trophy names and descriptions until earned.

## Run it

Serve `app/` with any static HTTP server and open `app/index.html` in desktop Chrome. It works with the network off.

```sh
node serve.ts
# opens http://localhost:8080
```

## Entry

`main.ts` at the root copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`.
