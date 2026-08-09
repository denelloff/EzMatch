# eZ-Match agent

Game-host agent for eZ-Match. It runs on each CS2 server host (Docker), dials the
hub over WebSocket, manages CS2 containers via the Docker Engine API, streams
console output, and turns game log lines into structured events.

Published image (GHCR):

```text
ghcr.io/denelloff/ez-agent:latest
```

Built by [`.github/workflows/publish-agent.yml`](.github/workflows/publish-agent.yml).

## Layout

| Path                | What it is                                      |
| ------------------- | ----------------------------------------------- |
| `apps/agent`        | Agent runtime, shipped as the `ez-agent` image  |
| `packages/protocol` | Shared Zod schemas (commands, events, messages) |
| `plugins/ez-csay`   | Optional CounterStrikeSharp chat plugin         |

## Requirements

- Node.js 20.11 or newer
- pnpm 9
- Docker (to build/run the agent image)

## Develop locally

```bash
pnpm install
pnpm --filter @ppanel/protocol build
pnpm dev:agent
```

Required env when running the agent:

| Variable             | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `PPANEL_SERVER_ID`   | Server id assigned by the control plane      |
| `PPANEL_AGENT_TOKEN` | Agent auth token                             |
| `PPANEL_HUB_URL`     | Hub WebSocket URL (`ws://` or `wss://`)      |

Optional: `PPANEL_NETWORK`, `PPANEL_LOG_PORT`, `PPANEL_AGENT_HOST`,
`PPANEL_STATE_DIR`, `PPANEL_CS2_IMAGE`, reconnect backoff knobs.

## Build the image

From the repository root:

```bash
docker build -f apps/agent/Dockerfile -t ghcr.io/denelloff/ez-agent:0.1.0 .
```
