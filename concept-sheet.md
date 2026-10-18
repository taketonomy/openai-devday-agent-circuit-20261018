# Agent Circuit — Concept Sheet

> OpenAI DevDay Hackathon · October 18, 2026

## One-line concept

**Agent Circuit transforms the latency of autonomous agents from dead waiting time into a live, visible, and lightly interactive experience.**

## The problem

Agents can pursue complex goals autonomously, but completion takes time. Humans are usually left with two unsatisfying choices:

- wait passively without knowing whether meaningful progress is happening; or
- supervise every step, removing the benefit of autonomy.

Silent waiting feels boring and unreal. Constant supervision feels like work.

## Core insight — Playable Waiting

Waiting itself can become the experience when ongoing agent activity is embodied as visible motion.

In Agent Circuit, the vehicles keep moving because OpenAI Agents API computer-use agents are continuously observing, deciding, and operating the controls. Their uncertainty, mistakes, adaptation, and recovery unfold in front of the human rather than disappearing behind a progress indicator.

> The human is neither absent nor driving every move. They are an engaged spectator who can influence the process without taking it over.

## Experience loop

```text
Agent observes → decides → drives → struggles → adapts → advances
                         ↑
        Human watches, understands, and lightly interacts
```

The interface should provide:

- **Visible progress:** continuous vehicle motion and live state changes.
- **Readable intent:** what the agent just did, what it is trying next, and why.
- **Meaningful milestones:** laps, position, recovery, and goal completion.
- **Lightweight interaction:** ask, react, encourage, constrain, or redirect.
- **Acknowledgement:** show when the agent receives and incorporates human input.
- **Autonomous continuity:** keep the agent moving unless pausing is necessary.

## Why vehicles

Vehicles make abstract agent behavior spatial, continuous, and emotionally legible:

- Movement proves that work is happening now.
- A shared circuit makes progress and comparison immediately understandable.
- Mistakes and recovery create suspense instead of appearing as hidden latency.
- Two agents reveal different strategies through behavior, not explanation.
- The finish line gives autonomous work a concrete completion condition.

## Prototype combination

### Autonomous race

Takao Ken's prototype uses the OpenAI Agents API with computer use. Two agents independently perceive the same browser environment and drive separate cars around a circuit.

### Human presence layer

Akari's HCI prototype keeps the human meaningfully present during autonomous work. People receive understandable live status and can interact at selected moments without micromanaging the full process.

Together, the prototypes turn agent execution into a shared live event.

## Presentation direction

The visual atmosphere was inspired by [Tesla's October 2026 Roadster event post](https://x.com/Tesla/status/2110976226084970849): a dark arena, illuminated track, dramatic motion, vapor, and high-contrast lighting. Agent Circuit uses that sense of spectacle to make agent behavior visible and memorable.

The project is independent of Tesla. All visual assets are original and exclude Tesla branding, source imagery, and vehicle designs.

## Demo moment

1. Two computer-use agents start driving.
2. Their status and next intentions remain visible while the vehicles move.
3. One agent encounters difficulty or falls behind.
4. A human gives a lightweight nudge without taking direct control.
5. The agent acknowledges the input, adapts, and continues.
6. The audience sees both genuine autonomy and meaningful human presence.

## 30-second pitch

Agents take time to finish real work. Today, that leaves us staring at a loading screen—or supervising every step. Agent Circuit introduces **Playable Waiting**. Two OpenAI computer-use agents continuously drive vehicles around a shared circuit while we see their status, intent, mistakes, and recovery. A human can ask, react, or give a lightweight nudge without taking over. We turn agent latency from dead waiting time into a live, interactive experience.

## Success criteria

- A viewer can tell that both cars are controlled by independent agents.
- Progress remains understandable without exposing raw reasoning traces.
- Human interaction changes the experience without becoming continuous control.
- Agent acknowledgement and adaptation are visible.
- Waiting feels engaging because the work is demonstrably unfolding in real time.
