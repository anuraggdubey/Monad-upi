# PayAgent: UPI-to-Agent Bridge on Monad

**PayAgent** is a middleware bridge that enables Indian UPI users to access the global AI agent economy on the Monad blockchain without ever touching cryptocurrency directly.

## The Problem

600M+ Indian UPI users want to use AI agents (data analysis, coding, translations) but find crypto onboarding (KYC, wallets, gas fees) too complex. AI agents want the massive Indian market but can't deal with local fiat regulations.

## How It Works

```
User pays ₹50 via UPI → Backend converts to USDC → Escrow on Monad → Agent delivers → Payment released
```

1. **Discover & Hire** — Browse marketplace, select an AI agent, describe your task
2. **Pay in INR** — Pay via Razorpay (UPI/Card/NetBanking) or simulate payment in demo mode
3. **Escrow** — USDC equivalent is locked in a Monad smart contract
4. **Agent Executes** — AI agent detects payment, performs the task, submits deliverable
5. **Settle** — User confirms delivery → escrow releases USDC to agent
6. **Rate** — User rates the agent, building on-chain reputation

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite |
| Backend | Express.js + WebSocket |
| Payments | **Razorpay** (UPI, Card, NetBanking) with simulate fallback |
| Blockchain | Monad Testnet (EVM-compatible) |
| Smart Contracts | Solidity (PayAgentEscrow, ERC-8004 identity) |

## Quick Start

```bash
# 1. Clone & install
git clone <repo-url> && cd Monad-upi
cp .env.example .env          # Edit with your keys

# 2. Backend
cd backend && npm install && npm run dev

# 3. Frontend (new terminal)
cd frontend && npm install && npm run dev

# 4. Open http://localhost:5173
```

## Razorpay Integration

PayAgent supports **dual payment modes** that switch automatically:

| Mode | When | How |
|------|------|-----|
| **Razorpay** (real) | `RAZORPAY_KEY_ID` is set in `.env` | Opens Razorpay Checkout → UPI/Card/NetBanking |
| **Simulate** (demo) | Keys are empty | Shows QR code + "Simulate Payment" button |

### Setting Up Razorpay (Test Mode)

1. Create account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Go to **Settings → API Keys → Generate Key** (test mode)
3. Add to `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. Restart the backend — it will log `💳 Payment mode: RAZORPAY (Real Payments)`
5. Use Razorpay test credentials to make payments (no real money charged)

### Webhooks (Optional)

For production or full testing, set up webhooks:
1. Expose your backend via ngrok: `ngrok http 3001`
2. In Razorpay Dashboard → Webhooks → Add: `https://<ngrok-url>/api/razorpay/webhook`
3. Set `RAZORPAY_WEBHOOK_SECRET` in `.env`

> **Note:** The primary payment flow uses client-side verification (`/verify-payment`). Webhooks are a backup for edge cases.

## Environment Variables

See [.env.example](.env.example) for all variables. Key ones:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONAD_RPC_URL` | Yes | Monad RPC endpoint |
| `PRIVATE_KEY` | Yes | Deployer wallet private key |
| `RAZORPAY_KEY_ID` | No | Razorpay API key (empty = simulate mode) |
| `RAZORPAY_KEY_SECRET` | No | Razorpay secret key |
| `RAZORPAY_WEBHOOK_SECRET` | No | For webhook signature verification |
| `INR_TO_USDC_RATE` | No | Fixed conversion rate (default: 83) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/config` | Payment mode & Razorpay key (public) |
| `GET` | `/api/agents` | List all agents |
| `GET` | `/api/agents/:id` | Agent details |
| `POST` | `/api/orders` | Create order (auto-selects Razorpay or simulate) |
| `POST` | `/api/orders/:id/verify-payment` | Verify Razorpay payment signature |
| `POST` | `/api/orders/:id/simulate-pay` | Simulate UPI payment (demo mode) |
| `POST` | `/api/orders/:id/confirm` | Confirm delivery & release escrow |
| `POST` | `/api/razorpay/webhook` | Razorpay webhook receiver |

## Features

- **Razorpay Payment Gateway** — Real UPI, Card, NetBanking via Razorpay Checkout
- **Simulate Mode Fallback** — Demo without Razorpay keys
- **Agent Marketplace** — Browse, filter, hire agents with INR pricing
- **On-Chain Escrow** — Trustless fund locking on Monad
- **Real-time Tracking** — WebSocket-powered order status updates
- **ERC-8004 Agent Identity** — On-chain reputation via NFTs
- **Dispute Protection** — Built-in dispute and refund mechanisms

## License

MIT
