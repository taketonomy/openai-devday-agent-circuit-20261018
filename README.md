# Agent Circuit

OpenAI DevDay Hackathon project — October 18, 2026.

Two autonomous agents compete on the same circuit. Each agent observes the browser, decides how to drive, and operates its own car through computer-use controls.

A complementary HCI prototype explores human presence during autonomous work. Instead of waiting silently or supervising every step, people receive meaningful live progress and can ask, react, or give lightweight guidance while the agent continues toward the goal.

## Team

- Taketo — concept, product direction, and pitch
- Takao Ken ([@takaoken](https://x.com/takaoken)) — AI/data engineering and initial prototype
- akari ([@Rijikai_](https://x.com/Rijikai_)) — AR, engineering, and HCI

## Working prototype

```bash
cd prototype
./start-secure.sh
```

Open <http://127.0.0.1:4173>.

The local-agent mode works without API calls. Live OpenAI-hosted computer-use agents require:

1. An OpenAI API key stored in macOS Keychain under `openai-devday-hackathon-20261018`.
2. A public HTTPS deployment URL supplied as `PUBLIC_PROTOTYPE_URL`.

```bash
PUBLIC_PROTOTYPE_URL="https://your-public-demo.example" ./start-secure.sh
```

Never place an API key in browser code, source files, commits, or logs.

## Motion concept

The team's presentation concept was inspired by [Tesla's October 2026 Roadster event post](https://x.com/Tesla/status/2110976226084970849): a theatrical night arena, an illuminated curved ramp, airborne vehicle motion, vapor, and dramatic red-and-white lighting. We translated that sense of spectacle into an arena where two AI agents visibly perceive, decide, and race.

The `concept-video/` directory contains the original cinematic key art, reproducible render scripts, and three video iterations. The event is a creative reference only; the project is independent of Tesla, and its visuals use original assets without Tesla branding, source imagery, or vehicle designs.

## Documentation

- [Concept sheet — Playable Waiting](concept-sheet.md)
- [Team and prototype context](knowledge/team-and-prototype-2026-10-18.md)
- [OpenAI Agents API computer use](https://developers.openai.com/api/docs/guides/agents-api/tools/computer-use)

