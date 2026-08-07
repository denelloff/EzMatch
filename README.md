# PPanel

Self-hosted control panel for Counter-Strike 2 dedicated servers and matches.

A server is registered once over SSH. The panel installs an agent on it, and from
then on everything happens through the agent: creating the CS2 container,
installing plugins, streaming the live console, and turning the game's log
output into structured events that drive the match state machine.

## How the pieces fit together

```
Browser ──HTTPS──> panel (Next.js) ──> MariaDB
                        │
                        ├──internal HTTP──> hub (Fastify + ws)
                        │                      ▲
                        │                      │ WSS, dialled by the agent
                        │                      │
                        └──SSE (live UI) ──────┤
                                               │
                                          agent (Node, in Docker)
                                               │ Docker Engine API
                                               ▼
                                       CS2 container
                                    ├─ stdin/stdout  → live console
                                    └─ HTTP log feed → game events
```

The agent always opens the connection. Game hosts therefore need no inbound
ports, and NAT or a restrictive firewall does not get in the way.

## Repository layout

| Path                 | What it is                                                   |
| -------------------- | ------------------------------------------------------------ |
| `apps/panel`         | Next.js UI and user-facing API                                |
| `apps/hub`           | Agent gateway: WebSocket server, command bus, event ingestion |
| `apps/agent`         | Agent that runs on each game host, shipped as a Docker image  |
| `packages/protocol`  | Zod schemas shared by panel, hub and agent                    |
| `packages/db`        | Prisma schema for MariaDB, client, secret encryption          |

## Requirements

- Node.js 20.11 or newer (developed on 24)
- pnpm 9
- Docker, for the MariaDB development container and for the game hosts
- A game host running Linux with at least 85 GB free disk. CS2 itself is
  about 60 GB; the rest covers plugins, demos and update headroom.

## Getting started

```bash
cp .env.example .env
# Fill in the two secrets:
#   openssl rand -base64 32   -> PPANEL_SECRET_KEY
#   openssl rand -base64 32   -> PPANEL_SESSION_SECRET

docker compose up -d mariadb
pnpm install
pnpm db:migrate
pnpm --filter @ppanel/panel exec node scripts/create-user.mjs   # first admin

pnpm dev:hub      # agent gateway on :4000
pnpm dev:panel    # UI on :3000
```

## Things worth knowing before you operate this

**CS2 updates break plugins.** Metamod and CounterStrikeSharp link against the
game binaries, and a Valve patch regularly leaves them failing to load. Plugin
versions are therefore pinned, never resolved as "latest", and the panel records
the Steam `buildid` that plugins were last verified against.

**Docker's restart policy is deliberately `no`.** The CS2 image runs SteamCMD on
every container start, so an unsupervised restart silently upgrades the game.
The agent supervises restarts instead, which keeps the panel in control of when
an update actually happens.

**The agent holds `/var/run/docker.sock`**, which is root-equivalent on the host.
It only accepts the fixed command vocabulary defined in `packages/protocol`;
there is no path for the panel to run arbitrary shell on a game host.

**SSH credentials are used once and discarded.** They are never written to the
database. After bootstrap the only credential is the agent token, stored as a
hash on the panel side.

**Roles are enforced on the server, not in the UI.** `VIEWER` can read;
`OPERATOR` can run matches and safe console commands; `ADMIN` can install
servers and plugins, restore rounds and remove instances. Commands that would
hand out power the panel is supposed to gate — `rcon_password`, `exec`,
`sv_cheats`, `changelevel` and friends — are either blocked outright or
restricted to admins, and every one that runs is written to the audit log.

**Secrets never appear in plaintext outside the process that needs them.** GSLT
tokens and passwords are encrypted with `PPANEL_SECRET_KEY` before they are
stored, decrypted only by the hub when it sends a command, and masked in the
agent's console output before it leaves the game host — so they cannot reach
the browser or the database in the clear.

**Valve's in-game `rcon` is broken.** The agent drives the server through the
container's stdin, which is the server operator console and has none of RCON's
restrictions. The optional `fake_rcon` plugin exists for human admins who want
to type commands from inside the game; the panel does not depend on it.
