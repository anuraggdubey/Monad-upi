/**
 * PayAgent Backend — Main Server
 * 
 * Express.js API server with WebSocket support for real-time updates.
 * Connects to Monad testnet for on-chain escrow operations.
 */

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";

import { seedData } from "./config/database.js";
import { loadContracts } from "./config/blockchain.js";
import { initRazorpay, isRazorpayConfigured } from "./services/payment.js";
import agentRoutes from "./routes/agents.js";
import orderRoutes, { setBroadcast } from "./routes/orders.js";
import webhookRoutes, { setWebhookBroadcast } from "./routes/webhook.js";

dotenv.config({ path: "../.env" });

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

// Raw body for Razorpay webhook signature verification
app.use("/api/razorpay/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (!req.path.includes("health")) {
      console.log(`   ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ── WebSocket Server ────────────────────────────────────────────

const wss = new WebSocketServer({ server, path: "/ws" });
const subscriptions = new Map(); // orderId -> Set<ws>

wss.on("connection", (ws) => {
  console.log("🔌 WebSocket client connected");

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === "subscribe" && msg.orderId) {
        if (!subscriptions.has(msg.orderId)) {
          subscriptions.set(msg.orderId, new Set());
        }
        subscriptions.get(msg.orderId).add(ws);
        ws.send(JSON.stringify({ type: "subscribed", orderId: msg.orderId }));
        console.log(`   📡 Client subscribed to order: ${msg.orderId}`);
      }
    } catch (err) {
      // Ignore invalid messages
    }
  });

  ws.on("close", () => {
    // Clean up subscriptions
    for (const [orderId, clients] of subscriptions) {
      clients.delete(ws);
      if (clients.size === 0) subscriptions.delete(orderId);
    }
  });
});

// Broadcast function for order updates
function broadcastToOrder(orderId, data) {
  const clients = subscriptions.get(orderId);
  if (clients) {
    const message = JSON.stringify(data);
    for (const ws of clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    }
  }
}

setBroadcast(broadcastToOrder);
setWebhookBroadcast(broadcastToOrder);

// ── API Routes ──────────────────────────────────────────────────

app.use("/api/agents", agentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/razorpay", webhookRoutes);

// Config endpoint — exposes Razorpay status to frontend (no secrets!)
app.get("/api/config", (req, res) => {
  const razorpayConfigured = isRazorpayConfigured();
  res.json({
    razorpayConfigured,
    razorpayKeyId: razorpayConfigured ? process.env.RAZORPAY_KEY_ID : null,
    paymentMode: razorpayConfigured ? "razorpay" : "simulate",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "PayAgent Backend",
    version: "1.0.0-mvp",
    timestamp: new Date().toISOString(),
    blockchain: {
      network: "Monad Testnet",
      chainId: 10143,
      rpc: process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz/",
    },
  });
});

// Platform info
app.get("/api/info", (req, res) => {
  res.json({
    name: "PayAgent",
    tagline: "UPI-to-Agent Bridge on Monad",
    description: "Pay AI agents with UPI. No crypto knowledge required.",
    features: [
      "Pay via GPay, PhonePe, Paytm",
      "On-chain escrow on Monad",
      "ERC-8004 agent identity",
      "Real-time order tracking",
      "Dispute protection",
    ],
    conversionRate: {
      inrPerUsdc: Number(process.env.INR_TO_USDC_RATE) || 83,
      currency: "INR/USDC",
      note: "Fixed rate for MVP",
    },
    monad: {
      network: "Testnet",
      chainId: 10143,
      explorer: "https://testnet.monadexplorer.com/",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("💥 Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// ── Startup ─────────────────────────────────────────────────────

async function start() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║           PayAgent — UPI to Agent Bridge                ║");
  console.log("║                  Monad Testnet MVP                      ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // Seed mock data
  console.log("📦 Initializing data store...");
  seedData();

  // Load blockchain contracts
  console.log("\n⛓️  Loading blockchain contracts...");
  loadContracts();

  // Initialize Razorpay
  console.log("\n💳 Initializing payment gateway...");
  await initRazorpay();

  // Start server
  server.listen(PORT, () => {
    const mode = isRazorpayConfigured() ? "RAZORPAY (Real Payments)" : "SIMULATE (Demo Mode)";
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`   📡 WebSocket at ws://localhost:${PORT}/ws`);
    console.log(`   💳 Payment mode: ${mode}`);
    console.log(`   📋 API docs: http://localhost:${PORT}/api/health\n`);
    console.log("   Routes:");
    console.log("   GET  /api/config                  - Payment config");
    console.log("   GET  /api/agents                  - List agents");
    console.log("   GET  /api/agents/:id              - Agent details");
    console.log("   POST /api/orders                  - Create order");
    console.log("   POST /api/orders/:id/verify-payment - Verify Razorpay payment");
    console.log("   POST /api/orders/:id/simulate-pay - Simulate UPI payment");
    console.log("   POST /api/orders/:id/confirm      - Confirm & release");
    console.log("   GET  /api/orders/:id              - Order status");
    console.log("   POST /api/razorpay/webhook        - Razorpay webhook");
    console.log("");
  });
}

start().catch(console.error);
