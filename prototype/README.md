# Agent Circuit Prototype

A dependency-free browser prototype based on the cinematic v3 specification.

## Run

```bash
cd prototype
./start-secure.sh
```

Open `http://localhost:4173`.

## Modes

- **Local agents:** Two independent deterministic control loops race automatically. Their strategies, decisions, laps, speed, and confidence appear live.
- **Computer use:** Large semantic buttons expose steering, throttle, and braking for each car. This gives a browser agent a visible action surface without embedding credentials in the client.

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

