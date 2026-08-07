export interface BootstrapScriptOptions {
  serverId: string;
  agentToken: string;
  hubUrl: string;
  agentImage: string;
  containerName: string;
  network: string;
  /** Refuse to continue below this much free space on the Docker data root. */
  minFreeBytes: number;
  /** Port the agent listens on inside the `ppanel` network for CS2 log posts. */
  logPort: number;
  stateVolume: string;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * The script is piped to `bash -s` over stdin rather than passed as an argument,
 * so the agent token never appears in the remote process list or in any shell
 * history. It is written to a root-only env file and handed to Docker from
 * there for the same reason.
 *
 * Every step is idempotent: re-running the bootstrap on an already configured
 * host is the normal way to repair or upgrade an agent.
 */
export function buildBootstrapScript(options: BootstrapScriptOptions): string {
  const {
    serverId,
    agentToken,
    hubUrl,
    agentImage,
    containerName,
    network,
    minFreeBytes,
    logPort,
    stateVolume,
  } = options;

  return `#!/usr/bin/env bash
set -euo pipefail

say() { printf '::ppanel::%s::%s\\n' "$1" "$2"; }

# --- privilege -------------------------------------------------------------
if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
elif command -v sudo >/dev/null 2>&1; then
  SUDO="sudo -n"
  if ! $SUDO true >/dev/null 2>&1; then
    say error "Passwordless sudo is required for the bootstrap user."
    exit 20
  fi
else
  say error "Bootstrap must run as root or as a user with passwordless sudo."
  exit 20
fi

# --- platform --------------------------------------------------------------
say phase preflight
OS="$(uname -s)"
if [ "$OS" != "Linux" ]; then
  say error "Only Linux hosts are supported, found: $OS"
  exit 21
fi

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64|aarch64|arm64) ;;
  *) say error "Unsupported architecture: $ARCH"; exit 22 ;;
esac

DISTRO="unknown"
DISTRO_VERSION=""
if [ -r /etc/os-release ]; then
  . /etc/os-release
  DISTRO="\${ID:-unknown}"
  DISTRO_VERSION="\${VERSION_ID:-}"
fi
KERNEL="$(uname -r)"
say info "host=$(hostname) distro=\${DISTRO}\${DISTRO_VERSION:+ \${DISTRO_VERSION}} arch=\${ARCH} kernel=\${KERNEL}"

# --- docker ----------------------------------------------------------------
say phase docker
if command -v docker >/dev/null 2>&1 && $SUDO docker info >/dev/null 2>&1; then
  say info "docker present: $($SUDO docker version --format '{{.Server.Version}}' 2>/dev/null || echo unknown)"
else
  say info "Docker not usable, installing via get.docker.com"
  if ! command -v curl >/dev/null 2>&1; then
    if command -v apt-get >/dev/null 2>&1; then
      $SUDO env DEBIAN_FRONTEND=noninteractive apt-get update -qq
      $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl ca-certificates
    elif command -v dnf >/dev/null 2>&1; then
      $SUDO dnf install -y -q curl ca-certificates
    else
      say error "Neither curl nor a supported package manager (apt-get, dnf) is available."
      exit 23
    fi
  fi
  curl -fsSL https://get.docker.com -o /tmp/ppanel-get-docker.sh
  $SUDO sh /tmp/ppanel-get-docker.sh >/dev/null
  rm -f /tmp/ppanel-get-docker.sh
  $SUDO systemctl enable --now docker >/dev/null 2>&1 || true
  if ! $SUDO docker info >/dev/null 2>&1; then
    say error "Docker installed but the daemon is not responding."
    exit 24
  fi
  say info "docker installed: $($SUDO docker version --format '{{.Server.Version}}')"
fi

# --- disk ------------------------------------------------------------------
say phase disk
DOCKER_ROOT="$($SUDO docker info --format '{{.DockerRootDir}}' 2>/dev/null || echo /var/lib/docker)"
[ -d "$DOCKER_ROOT" ] || DOCKER_ROOT=/var/lib
FREE_BYTES="$(df -PB1 "$DOCKER_ROOT" | awk 'NR==2 {print $4}')"
say info "docker_root=$DOCKER_ROOT free_bytes=$FREE_BYTES"
if [ "\${FREE_BYTES:-0}" -lt ${minFreeBytes} ]; then
  say error "Not enough free disk on $DOCKER_ROOT: $FREE_BYTES bytes available, ${minFreeBytes} required. CS2 alone is about 60 GB."
  exit 25
fi

# --- network ---------------------------------------------------------------
say phase network
if ! $SUDO docker network inspect ${shellQuote(network)} >/dev/null 2>&1; then
  $SUDO docker network create ${shellQuote(network)} >/dev/null
  say info "created docker network ${network}"
else
  say info "docker network ${network} already exists"
fi

# --- credentials -----------------------------------------------------------
say phase credentials
$SUDO install -d -m 0700 /etc/ppanel
$SUDO install -m 0600 /dev/null /etc/ppanel/agent.env
$SUDO tee /etc/ppanel/agent.env >/dev/null <<'PPANEL_ENV_EOF'
PPANEL_SERVER_ID=${serverId}
PPANEL_AGENT_TOKEN=${agentToken}
PPANEL_HUB_URL=${hubUrl}
PPANEL_NETWORK=${network}
PPANEL_LOG_PORT=${logPort}
PPANEL_AGENT_HOST=${containerName}
PPANEL_ENV_EOF
say info "wrote /etc/ppanel/agent.env (0600, root only)"

# --- agent -----------------------------------------------------------------
say phase agent
$SUDO docker volume inspect ${shellQuote(stateVolume)} >/dev/null 2>&1 || \
  $SUDO docker volume create ${shellQuote(stateVolume)} >/dev/null

say info "pulling ${agentImage}"
if ! PULL_OUT="$($SUDO docker pull ${shellQuote(agentImage)} 2>&1)"; then
  say error "Failed to pull agent image ${agentImage}: $(printf '%s' "$PULL_OUT" | tr '\\n' ' ')"
  exit 27
fi
say info "image ready: ${agentImage}"

if $SUDO docker container inspect ${shellQuote(containerName)} >/dev/null 2>&1; then
  say info "removing previous agent container"
  $SUDO docker rm -f ${shellQuote(containerName)} >/dev/null
fi

if ! RUN_OUT="$($SUDO docker run -d \\
  --name ${shellQuote(containerName)} \\
  --restart unless-stopped \\
  --network ${shellQuote(network)} \\
  --env-file /etc/ppanel/agent.env \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  -v /:/host:ro \\
  -v ${shellQuote(stateVolume)}:/var/lib/ppanel \\
  --label ppanel.role=agent \\
  ${shellQuote(agentImage)} 2>&1)"; then
  say error "Failed to start agent container: $(printf '%s' "$RUN_OUT" | tr '\\n' ' ')"
  exit 28
fi

sleep 3
STATE="$($SUDO docker inspect -f '{{.State.Status}}' ${shellQuote(containerName)})"
if [ "$STATE" != "running" ]; then
  say error "Agent container is $STATE. Last output: $($SUDO docker logs --tail 20 ${shellQuote(containerName)} 2>&1 | tr '\\n' ' ')"
  exit 26
fi

say info "agent dials hub at ${hubUrl}"
AGENT_LOG="$($SUDO docker logs --tail 30 ${shellQuote(containerName)} 2>&1 | tr '\\n' ' ' || true)"
if [ -n "$AGENT_LOG" ]; then
  say info "agent logs: $AGENT_LOG"
fi

say phase done
say info "agent running, waiting for it to connect back to the hub"
say result "{\\"dockerRoot\\":\\"$DOCKER_ROOT\\",\\"freeBytes\\":$FREE_BYTES,\\"arch\\":\\"$ARCH\\",\\"distro\\":\\"$DISTRO\\"}"
`;
}
