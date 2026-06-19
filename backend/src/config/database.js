/**
 * PayAgent Backend — In-Memory Data Store
 * 
 * For MVP, we use an in-memory store instead of PostgreSQL.
 * This keeps setup instant — no database server needed.
 * Data is seeded with mock agents on startup.
 */

import { v4 as uuidv4 } from "uuid";

// ── In-Memory Collections ───────────────────────────────────────

const users = new Map();
const agents = new Map();
const orders = new Map();
const upiPayments = new Map();

// ── Mock Agent Data ─────────────────────────────────────────────

const MOCK_AGENTS = [
  {
    id: uuidv4(),
    agentId: 1,
    walletAddress: "",  // Will be set after contract deployment
    name: "MarketSentiment Pro",
    description: "Real-time crypto market sentiment analysis using NLP. Analyzes Twitter, Reddit, and news sources to give you a bullish/bearish score with confidence level.",
    category: "Data Analysis",
    priceINR: 50,
    priceUSDC: 0.60,
    reputationScore: 4.7,
    tasksCompleted: 234,
    deliveryTime: "30 seconds",
    capabilities: ["NLP", "Crypto", "Real-time", "Sentiment"],
    agentURI: "https://api.marketsentiment.agent/analyze",
    isActive: true,
    image: "🔮",
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    agentId: 2,
    walletAddress: "",
    name: "TranslatorBot Elite",
    description: "AI-powered multilingual translation supporting 50+ languages. Preserves meaning, tone, and context for professional-quality translations.",
    category: "Translation",
    priceINR: 30,
    priceUSDC: 0.36,
    reputationScore: 4.5,
    tasksCompleted: 891,
    deliveryTime: "15 seconds",
    capabilities: ["Translation", "NLP", "Multi-language"],
    agentURI: "https://api.translatorbot.agent/translate",
    isActive: true,
    image: "🌐",
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    agentId: 3,
    walletAddress: "",
    name: "CodeReviewer AI",
    description: "Advanced code review agent that detects bugs, security vulnerabilities, performance issues, and suggests improvements. Supports 20+ languages.",
    category: "Code Review",
    priceINR: 100,
    priceUSDC: 1.20,
    reputationScore: 4.9,
    tasksCompleted: 156,
    deliveryTime: "1 minute",
    capabilities: ["Code Analysis", "Security", "Performance", "Bug Detection"],
    agentURI: "https://api.codereviewer.agent/review",
    isActive: true,
    image: "🔍",
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    agentId: 4,
    walletAddress: "",
    name: "DesignForge",
    description: "AI image generation for marketing, social media, and branding. Creates high-quality product mockups, banners, and social posts in seconds.",
    category: "Image Generation",
    priceINR: 20,
    priceUSDC: 0.24,
    reputationScore: 4.3,
    tasksCompleted: 567,
    deliveryTime: "20 seconds",
    capabilities: ["Image Gen", "Marketing", "Branding", "Social Media"],
    agentURI: "https://api.designforge.agent/generate",
    isActive: true,
    image: "🎨",
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    agentId: 5,
    walletAddress: "",
    name: "LegalSummarizer",
    description: "Summarizes complex legal documents into plain language. Extracts key clauses, obligations, deadlines, and risks in a digestible format.",
    category: "Data Analysis",
    priceINR: 40,
    priceUSDC: 0.48,
    reputationScore: 4.6,
    tasksCompleted: 89,
    deliveryTime: "45 seconds",
    capabilities: ["Legal", "NLP", "Summarization", "Document Analysis"],
    agentURI: "https://api.legalsummarizer.agent/summarize",
    isActive: true,
    image: "⚖️",
    createdAt: new Date().toISOString(),
  },
];

// ── Seed Data ───────────────────────────────────────────────────

function seedData() {
  MOCK_AGENTS.forEach((agent) => {
    agents.set(agent.id, agent);
  });
  console.log(`   📦 Seeded ${MOCK_AGENTS.length} mock agents`);
}

// ── CRUD Helpers ────────────────────────────────────────────────

// Users
function createUser(userData) {
  const user = {
    id: uuidv4(),
    ...userData,
    evmAddress: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
    createdAt: new Date().toISOString(),
  };
  users.set(user.id, user);
  return user;
}

function getUserByPhone(phone) {
  return Array.from(users.values()).find((u) => u.phone === phone);
}

function getUserById(id) {
  return users.get(id);
}

// Agents
function getAllAgents(filters = {}) {
  let result = Array.from(agents.values()).filter((a) => a.isActive);

  if (filters.category) {
    result = result.filter((a) => a.category.toLowerCase() === filters.category.toLowerCase());
  }
  if (filters.minPrice) {
    result = result.filter((a) => a.priceINR >= Number(filters.minPrice));
  }
  if (filters.maxPrice) {
    result = result.filter((a) => a.priceINR <= Number(filters.maxPrice));
  }
  if (filters.minRating) {
    result = result.filter((a) => a.reputationScore >= Number(filters.minRating));
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(
      (a) =>
        a.name.toLowerCase().includes(search) ||
        a.description.toLowerCase().includes(search) ||
        a.category.toLowerCase().includes(search)
    );
  }

  // Sort
  if (filters.sort === "price_asc") result.sort((a, b) => a.priceINR - b.priceINR);
  else if (filters.sort === "price_desc") result.sort((a, b) => b.priceINR - a.priceINR);
  else if (filters.sort === "rating") result.sort((a, b) => b.reputationScore - a.reputationScore);
  else if (filters.sort === "popular") result.sort((a, b) => b.tasksCompleted - a.tasksCompleted);

  return result;
}

function getAgentById(id) {
  return agents.get(id);
}

function getAgentByAgentId(agentId) {
  return Array.from(agents.values()).find((a) => a.agentId === Number(agentId));
}

// Orders
function createOrder(orderData) {
  const order = {
    id: uuidv4(),
    ...orderData,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  orders.set(order.id, order);
  return order;
}

function getOrderById(id) {
  return orders.get(id);
}

function getOrdersByUserId(userId) {
  return Array.from(orders.values()).filter((o) => o.userId === userId);
}

function updateOrder(id, updates) {
  const order = orders.get(id);
  if (!order) return null;
  const updated = { ...order, ...updates };
  orders.set(id, updated);
  return updated;
}

// UPI Payments
function createUPIPayment(paymentData) {
  const payment = {
    id: uuidv4(),
    ...paymentData,
    status: "created",
    createdAt: new Date().toISOString(),
  };
  upiPayments.set(payment.id, payment);
  return payment;
}

function getUPIPaymentById(id) {
  return upiPayments.get(id);
}

function updateUPIPayment(id, updates) {
  const payment = upiPayments.get(id);
  if (!payment) return null;
  const updated = { ...payment, ...updates };
  upiPayments.set(id, updated);
  return updated;
}

export {
  seedData,
  createUser,
  getUserByPhone,
  getUserById,
  getAllAgents,
  getAgentById,
  getAgentByAgentId,
  createOrder,
  getOrderById,
  getOrdersByUserId,
  updateOrder,
  createUPIPayment,
  getUPIPaymentById,
  updateUPIPayment,
  MOCK_AGENTS,
};
