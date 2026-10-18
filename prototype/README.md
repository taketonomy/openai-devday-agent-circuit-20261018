# Agent Circuit Prototype

A browser prototype based on the cinematic v3 specification, using Three.js
for the race viewport and a canvas fallback.

The race cars use Akari's glTF 2.0 model from `assets/roadster.glb` in the
3D/WebGL viewport. `assets/roadster-top.webp` provides the 2D fallback.

## Run

```bash
cd prototype
npm install
./start-secure.sh
```

Open `http://localhost:4173`.

## Modes

- **Local agents:** Two independent deterministic control loops race automatically. Their strategies, decisions, laps, speed, and confidence appear live.
- **Computer use:** Large semantic buttons expose steering, throttle, and braking for each car. This gives a browser agent a visible action surface without embedding credentials in the client.

## Playable Waiting interaction

Each agent card exposes its recent action, next intent, confidence, and current human input. A spectator can send one of three lightweight nudges without taking direct control:

- **Encourage** — gives the agent a short confidence and pace boost.
- **Drive safer** — temporarily favors controlled cornering.
- **Try another strategy** — switches the racing line and helps recover from the scripted low-grip moment.

The input is queued until a safe point, visibly acknowledged, incorporated into behavior, and then the agent continues autonomously. In local-agent mode, Agent B encounters a low-grip event during the first lap to make this loop easy to demonstrate.

This first vertical slice is browser-local. A server-authoritative shared race room is still required before a human dashboard and multiple OpenAI-hosted browser sessions can observe and modify the same race state.

## Agents API integration boundary

The official OpenAI computer-use flow runs in an OpenAI-hosted browser. A server creates and follows an Agents API session; the agent receives `{ "type": "computer_use" }`, and the environment enables an OpenAI-hosted desktop. The hosted browser can then open this prototype and use its controls.

Do not put `OPENAI_API_KEY` in this frontend. Add a server-side session launcher only after the key and accessible deployment URL are available.

The secure launcher reads `openai-devday-hackathon-20261018` from macOS Keychain and passes it only to the Node server process.

For live hosted computer-use sessions, provide a public HTTPS deployment URL:

```bash
PUBLIC_PROTOTYPE_URL="https://your-public-demo.example" ./start-secure.sh
```

The server refuses localhost targets because an OpenAI-hosted browser cannot reach them. It creates one session for Agent A and one for Agent B, and origin approval is restricted to the configured target origin.

Official guide: https://developers.openai.com/api/docs/guides/agents-api/tools/computer-use

