# Agent Circuit

OpenAI DevDay Hackathon project — October 18, 2026.

Two autonomous agents compete on the same circuit. Each agent observes the browser, decides how to drive, and operates its own car through computer-use controls.

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

The `concept-video/` directory contains the original cinematic key art, reproducible render scripts, and three video iterations. The visuals use original assets and do not include Tesla branding or source imagery.

## Documentation

- [Team and prototype context](knowledge/team-and-prototype-2026-10-18.md)
- [OpenAI Agents API computer use](https://developers.openai.com/api/docs/guides/agents-api/tools/computer-use)

