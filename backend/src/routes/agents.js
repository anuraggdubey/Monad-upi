/**
 * PayAgent — Agent Routes
 * 
 * GET  /api/agents          - List all agents (with filters)
 * GET  /api/agents/:id      - Get agent details
 * POST /api/agents/register - Register a new agent
 */

import { Router } from "express";
import { getAllAgents, getAgentById, getAgentByAgentId, MOCK_AGENTS } from "../config/database.js";

const router = Router();

/**
 * GET /api/agents
 * List all active agents with optional filters
 * 
 * Query params:
 *   category  - Filter by category (e.g., "Data Analysis")
 *   minPrice  - Minimum price in INR
 *   maxPrice  - Maximum price in INR
 *   minRating - Minimum reputation score
 *   search    - Search by name, description, or category
 *   sort      - Sort by: price_asc, price_desc, rating, popular
 */
router.get("/", (req, res) => {
  try {
    const agents = getAllAgents(req.query);
    res.json({
      success: true,
      data: agents,
      total: agents.length,
      filters: {
        categories: [...new Set(MOCK_AGENTS.map((a) => a.category))],
        priceRange: {
          min: Math.min(...MOCK_AGENTS.map((a) => a.priceINR)),
          max: Math.max(...MOCK_AGENTS.map((a) => a.priceINR)),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/agents/:id
 * Get detailed info for a specific agent
 */
router.get("/:id", (req, res) => {
  try {
    // Try by UUID first, then by agentId (numeric)
    let agent = getAgentById(req.params.id);
    if (!agent) {
      agent = getAgentByAgentId(req.params.id);
    }

    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    res.json({ success: true, data: agent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/agents/register
 * Register a new agent (MVP: adds to in-memory store)
 */
router.post("/register", (req, res) => {
  try {
    const { name, description, category, priceINR, capabilities, walletAddress } = req.body;

    if (!name || !description || !priceINR) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, description, priceINR",
      });
    }

    // For MVP, add to the in-memory store
    // In production, this would mint an ERC-8004 NFT on-chain
    const agent = {
      id: crypto.randomUUID(),
      agentId: MOCK_AGENTS.length + 1,
      walletAddress: walletAddress || "",
      name,
      description,
      category: category || "General",
      priceINR: Number(priceINR),
      priceUSDC: Number((Number(priceINR) / 83).toFixed(6)),
      reputationScore: 0,
      tasksCompleted: 0,
      deliveryTime: "Varies",
      capabilities: capabilities || [],
      isActive: true,
      image: "🤖",
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      data: agent,
      message: "Agent registered successfully (MVP mode - not yet on-chain)",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
