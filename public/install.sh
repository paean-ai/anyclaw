#!/usr/bin/env bash
# AnyClaw — one-line installer
# Usage: curl -sL anyclaw.sh | bash
#
# Env overrides:
#   ANYCLAW_SERVICE_URL  Relay API (default: https://api.paean.ai)
#   ANYCLAW_WEB_URL      Web UI   (default: https://anyclaw.sh)
#   GATEWAY_URL          Local agent gateway override
#   GATEWAY_TYPE         Gateway type override (claw|openai)
set -euo pipefail

# ── Colors ──────────────────────────────────────────────
R='\033[0;31m' G='\033[0;32m' Y='\033[0;33m' C='\033[0;36m'
B='\033[1m' D='\033[0m'

info()  { printf "${C}▸${D} %s\n" "$*"; }
ok()    { printf "${G}✓${D} %s\n" "$*"; }
warn()  { printf "${Y}!${D} %s\n" "$*"; }
fail()  { printf "${R}✗${D} %s\n" "$*"; exit 1; }

# ── Banner ──────────────────────────────────────────────
printf "\n${C}"
cat << 'LOGO'
   ▄▀█ █▄░█ █▄█ █▀▀ █░░ ▄▀█ █░█░█
   █▀█ █░▀█ ░█░ █▄▄ █▄▄ █▀█ ▀▄▀▄▀
LOGO
printf "${D}\n"
echo "  Access your local AI agent from anywhere."
echo ""

# ── Defaults ────────────────────────────────────────────
SERVICE_URL="${ANYCLAW_SERVICE_URL:-https://api.paean.ai}"
WEB_URL="${ANYCLAW_WEB_URL:-https://anyclaw.sh}"

# ── OS detection ────────────────────────────────────────
OS="$(uname -s)"
ARCH="$(uname -m)"
info "System: $OS $ARCH"

open_url() {
  case "$OS" in
    Darwin) open "$1" 2>/dev/null ;;
    Linux)  xdg-open "$1" 2>/dev/null || true ;;
    *)      warn "Open this URL manually: $1" ;;
  esac
}

# ── Dependency check ────────────────────────────────────
command -v node  >/dev/null 2>&1 || fail "Node.js is required. Install it from https://nodejs.org"
command -v npm   >/dev/null 2>&1 || fail "npm is required. Install Node.js from https://nodejs.org"
command -v curl  >/dev/null 2>&1 || fail "curl is required."

NODE_V="$(node -v)"
info "Node.js $NODE_V"

# ── Detect local agents ────────────────────────────────
DETECTED_GW=""
DETECTED_TYPE=""

detect_agent() {
  local name="$1" port="$2" type="$3"
  if command -v "$name" >/dev/null 2>&1; then
    info "Found $name ($(command -v "$name"))"
    if curl -sf "http://localhost:$port/health" >/dev/null 2>&1 || \
       curl -sf "http://localhost:$port/" >/dev/null 2>&1; then
      ok "$name is running on port $port"
      if [ -z "$DETECTED_GW" ]; then
        DETECTED_GW="http://localhost:$port"
        DETECTED_TYPE="$type"
      fi
    else
      warn "$name found but not running on port $port"
    fi
  fi
}

detect_agent "0claw"      3007  "claw"
detect_agent "paeanclaw"  3007  "claw"
detect_agent "zeroclaw"   42617 "claw"
detect_agent "openclaw"   3007  "claw"

# Also check common OpenAI-compatible ports
for port in 1234 8080 11434; do
  if curl -sf "http://localhost:$port/v1/models" >/dev/null 2>&1; then
    ok "OpenAI-compatible server on port $port"
    if [ -z "$DETECTED_GW" ]; then
      DETECTED_GW="http://localhost:$port"
      DETECTED_TYPE="openai"
    fi
  fi
done

GATEWAY="${GATEWAY_URL:-${DETECTED_GW:-http://localhost:3007}}"
GW_TYPE="${GATEWAY_TYPE:-${DETECTED_TYPE:-claw}}"
info "Gateway: $GATEWAY ($GW_TYPE)"

# ── Install / update anyclaw CLI ──────────────────────
info "Installing anyclaw CLI (latest)..."
npm install -g anyclaw@latest 2>/dev/null || \
  npm install -g anyclaw@latest
ok "anyclaw CLI ready ($(anyclaw --version 2>/dev/null || echo 'installed'))"

# ── Generate guest ClawKey ──────────────────────────────
info "Generating guest ClawKey..."
KEY_RESPONSE=$(curl -sf -X POST "$SERVICE_URL/claw/key/guest" \
  -H "Content-Type: application/json" 2>&1) || \
  fail "Could not reach AnyClaw service at $SERVICE_URL. Is the server running?"

CLAW_KEY=$(echo "$KEY_RESPONSE" | grep -o '"key":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -z "$CLAW_KEY" ] && fail "Failed to parse ClawKey from service response"
ok "ClawKey: $CLAW_KEY"
echo ""
printf "  ${B}Your ClawKey:${D} ${C}$CLAW_KEY${D}\n"
echo "  This guest key expires in 24 hours."
echo ""

# ── Start bridge in background ──────────────────────────
info "Starting anyclaw bridge..."
anyclaw bridge \
  --gateway "$GATEWAY" \
  --type "$GW_TYPE" \
  --key "$CLAW_KEY" \
  --service "$SERVICE_URL" &
BRIDGE_PID=$!

sleep 1
if kill -0 "$BRIDGE_PID" 2>/dev/null; then
  ok "Bridge running (PID $BRIDGE_PID)"
else
  warn "Bridge may have failed to start. Check your agent at $GATEWAY"
fi

# ── Open web UI ─────────────────────────────────────────
CONNECT_URL="${WEB_URL}?claw_key=${CLAW_KEY}"
info "Opening AnyClaw web UI..."
open_url "$CONNECT_URL"

# ── Summary ─────────────────────────────────────────────
echo ""
printf "  ${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${D}\n"
printf "  ${B}AnyClaw is ready!${D}\n"
echo ""
printf "  Web UI:   ${C}${CONNECT_URL}${D}\n"
printf "  Bridge:   ${C}PID $BRIDGE_PID${D}\n"
printf "  Gateway:  ${C}$GATEWAY ($GW_TYPE)${D}\n"
printf "  Key:      ${C}$CLAW_KEY${D}\n"
echo ""
echo "  To stop the bridge: kill $BRIDGE_PID"
  echo "  To reconnect later: anyclaw bridge -g $GATEWAY -k $CLAW_KEY"
printf "  ${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${D}\n"
echo ""

wait "$BRIDGE_PID" 2>/dev/null || true
