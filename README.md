# AnyClaw

> Access your local AI agent from anywhere.

AnyClaw is a lightweight web frontend that connects to your local AI agent through a secure cloud relay. No port forwarding, no VPN, no complex setup — just a key.

```
curl -sL anyclaw.sh | bash
```

## How It Works

```
  Browser (anyclaw.sh / anyclaw.dev)
           │
           ▼
     Cloud Relay (ClawKey auth)
           │
           ▼
     anyclaw-bridge (sidecar)
           │
           ▼
     Local Agent (paeanclaw / zeroclaw / openclaw / any OpenAI-compatible)
```

1. **Get a ClawKey** — generate a guest key instantly or sign in for a persistent one.
2. **Run the bridge** — the bridge connects your local agent to the relay with zero changes to the agent itself.
3. **Open `anyclaw.sh`** — you're connected from any device.

## Quick Install

The one-line installer detects your local agent, installs the bridge, generates a key, and opens the web UI:

```bash
curl -sL anyclaw.sh | bash
```

**What it does:**
- Detects running agents (paeanclaw, zeroclaw, openclaw, OpenAI-compatible)
- Installs `anyclaw-bridge` via npm
- Generates a guest ClawKey (24h TTL)
- Starts the bridge in background
- Opens `anyclaw.sh?claw_key=<your-key>` in the browser

## Manual Setup

### 1. Start your local agent

```bash
paeanclaw          # default port 3007
# or
zeroclaw           # default port 42617
# or any OpenAI-compatible server
```

### 2. Get a ClawKey

Visit [anyclaw.sh](https://anyclaw.sh) and type `guest` in the terminal, or use the web UI to generate one.

### 3. Run the bridge

```bash
npx anyclaw-bridge -g http://localhost:3007 -k ck_g_your_key_here
```

Bridge options:

| Flag | Description | Default |
|------|-------------|---------|
| `-g, --gateway` | Local agent URL | `http://localhost:3007` |
| `-t, --type` | Gateway type: `claw`, `openai` | `claw` |
| `-k, --key` | ClawKey for relay auth | (required) |
| `-s, --service` | Relay service URL | `https://api.paean.ai` |

Environment variables: `CLAW_KEY`, `GATEWAY_URL`, `ANYCLAW_SERVICE_URL`.

## Two Modes

| Mode | URL | Description |
|------|-----|-------------|
| **Shell** | `anyclaw.sh` | Terminal-style interface. Dark, monospace, retro. |
| **Dev** | `anyclaw.dev` | Modern chat interface. Light/dark theme, rich rendering. |

Override during development: `http://localhost:5173?mode=shell` or `?mode=dev`.

## ClawKey

ClawKeys authenticate and route messages between the web UI and your local agent.

| Type | Prefix | TTL | Auth Required |
|------|--------|-----|---------------|
| Guest | `ck_g_` | 24h | No |
| Persistent | `ck_p_` | None | Google / Apple / Paean |

### Cross-Device Access

Share your ClawKey across devices:

- **Copy key** — reveal the full key in the web UI and copy it.
- **Share URL** — generate a link like `anyclaw.sh?claw_key=ck_...` that auto-connects.
- **QR code** — scan from your phone to connect instantly (generated client-side, keys never leave your device).
- **Account sync** — sign in for persistent keys that sync across all devices.

### Shell Commands

```
guest             Generate a temporary guest key
connect [key]     Connect using a ClawKey
disconnect        Disconnect from local agent
refresh           Regenerate key (persistent keys, requires auth)
share             Show share URL for cross-device access
install           Show one-line install command
status            Show connection status
key               Show current ClawKey
clear             Clear terminal
help              Show all commands
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  anyclaw (web frontend)                                 │
│  React 19 · Vite · Tailwind v4 · TypeScript             │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐                      │
│  │ ShellPage   │  │ DevPage      │                      │
│  │ (terminal)  │  │ (chat UI)    │                      │
│  └──────┬──────┘  └──────┬───────┘                      │
│         └────────┬───────┘                              │
│                  ▼                                       │
│          lib/api.ts (REST + SSE)                        │
└──────────────────┬──────────────────────────────────────┘
                   │ X-Claw-Key
                   ▼
          Cloud Relay (zero-api)
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│  anyclaw-bridge (Node.js sidecar)                        │
│                                                          │
│  Polls relay → Claims requests → Forwards to gateway     │
│  Pushes SSE events back → Completes requests             │
│                                                          │
│  Adapters: claw (paeanclaw/zeroclaw), openai             │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
          Local AI Agent (any port, any framework)
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Bridge Development

```bash
cd bridge
npm install
npm run build   # compiles src/ → dist/
npm run dev     # build + run
```

### Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Relay API endpoint | `http://localhost:4777` |

### Local Testing

For full end-to-end testing without the production relay:

```bash
# Terminal 1: Start the local test relay
cd ../anyclaw-service && npm run dev

# Terminal 2: Start your local agent
paeanclaw

# Terminal 3: Start the web frontend
cd anyclaw && npm run dev

# Terminal 4: Run the bridge
cd anyclaw/bridge && node dist/index.js -k <your-key>
```

Or simply:
```bash
ANYCLAW_SERVICE_URL=http://localhost:4777 ANYCLAW_WEB_URL=http://localhost:5173 bash public/install.sh
```

## Security

- **ClawKey routing** — keys contain a routing ID that directs traffic to your bridge instance. The relay never sees your agent's internal state.
- **No agent modification** — the bridge is a standalone sidecar. Your agent code is untouched.
- **Guest key expiry** — guest keys auto-expire after 24 hours.
- **Rate limiting** — relay enforces per-key rate limits (20 req/min, 3 concurrent).
- **QR codes** — generated entirely client-side. Keys never leave your browser.
- **HTTPS** — all relay communication is over TLS.

## Tech Stack

- [React 19](https://react.dev) + [Vite](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev)
- [TypeScript](https://www.typescriptlang.org)

## License

[MIT](LICENSE)
