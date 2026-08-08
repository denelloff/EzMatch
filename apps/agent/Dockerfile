# Built from the repository root:
#   docker build -f apps/agent/Dockerfile -t ghcr.io/denelloff/ppanel-agent:0.1.0 .
FROM node:24-alpine AS build

RUN corepack enable

WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/protocol/package.json packages/protocol/
COPY apps/agent/package.json apps/agent/

RUN pnpm install --frozen-lockfile --filter @ppanel/agent... --filter @ppanel/protocol...

COPY packages/protocol packages/protocol
COPY apps/agent apps/agent

RUN pnpm --filter @ppanel/protocol build \
 && pnpm --filter @ppanel/agent build

FROM node:24-alpine AS runtime

# tini for PID 1; docker-cli for the one-shot swap helper container (same image,
# docker.sock only) so self-update never needs a second pull from Docker Hub.
RUN apk add --no-cache tini docker-cli \
 && addgroup -S ppanel && adduser -S -G ppanel ppanel

WORKDIR /app
COPY --from=build /repo/apps/agent/dist/agent.mjs ./agent.mjs

# /var/lib/ppanel holds the spool of events buffered while the hub is
# unreachable, so it is mounted as a volume by the bootstrap.
RUN mkdir -p /var/lib/ppanel && chown ppanel:ppanel /var/lib/ppanel
VOLUME ["/var/lib/ppanel"]

ENV NODE_ENV=production \
    PPANEL_STATE_DIR=/var/lib/ppanel

# Runs as root: the Docker socket is owned by root:docker, and the numeric gid
# of the docker group differs between host distributions, so dropping to a
# fixed uid here would break on half of them.
EXPOSE 8787

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "/app/agent.mjs"]
