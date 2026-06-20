/**
 * PayAgent — Order Routes
 * 
 * POST /api/orders                  - Create a new order (generates UPI payment or Razorpay order)
 * GET  /api/orders                  - List user's orders
 * GET  /api/orders/:id              - Get order details
 * POST /api/orders/:id/simulate-pay - Simulate UPI payment (fallback/demo mode)
 * POST /api/orders/:id/verify-payment - Verify Razorpay payment (real mode)
 * POST /api/orders/:id/confirm      - Confirm delivery & release payment
 * POST /api/orders/:id/dispute      - Raise a dispute
 * POST /api/orders/:id/feedback     - Submit feedback/rating
 */

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getAgentByAgentId, createOrder, getOrderById, getOrdersByUserId, updateOrder } from "../config/database.js";
import { generateUPIPayment, simulatePaymentConfirmation, inrToUsdc, isRazorpayConfigured, createRazorpayOrder, verifyRazorpayPaymentSignature } from "../services/payment.js";
import { createOnChainEscrow, releaseOnChainPayment, submitMockDelivery, getOnChainEscrow } from "../services/escrow.js";

const router = Router();

// In-memory WebSocket broadcast function (set by server)
let broadcastFn = null;
export function setBroadcast(fn) {
  broadcastFn = fn;
}

function broadcast(orderId, event, data) {
  if (broadcastFn) {
    broadcastFn(orderId, { type: event, orderId, ...data, timestamp: new Date().toISOString() });
  }
}

/**
 * POST /api/orders
 * Create a new order — Razorpay (real) or simulated payment
 */
router.post("/", async (req, res) => {
  try {
    const { agentId, taskDescription, deadline } = req.body;

    if (!agentId || !taskDescription) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: agentId, taskDescription",
      });
    }

    // Find agent
    const agent = getAgentByAgentId(agentId);
    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    const useRazorpay = isRazorpayConfigured();

    if (useRazorpay) {
      // ── Real Razorpay Mode ──────────────────────────────────
      // Create internal order first (to get the ID for receipt)
      const order = createOrder({
        userId: req.body.userId || "anonymous",
        agentId: agent.agentId,
        agentName: agent.name,
        agentImage: agent.image,
        agentCategory: agent.category,
        taskDescription,
        amountINR: agent.priceINR,
        amountUSDC: agent.priceUSDC,
        platformFeeUSDC: Number((agent.priceUSDC * 0.025).toFixed(6)),
        upiTransactionId: null,
        razorpayOrderId: null, // Will be set below
        payment: null,
        escrowId: null,
        txHashes: {},
        deliveryURI: null,
        rating: null,
        feedback: null,
        deadline: deadline || "24h",
        statusHistory: [
          { status: "pending", timestamp: new Date().toISOString(), note: "Order created, awaiting Razorpay payment" },
        ],
      });

      // Create Razorpay order
      const rzpOrder = await createRazorpayOrder(agent.priceINR, order.id, agent.name);

      // Update our order with the Razorpay order ID
      updateOrder(order.id, { razorpayOrderId: rzpOrder.id });

      console.log(`📦 Order created (Razorpay): ${order.id} | Razorpay: ${rzpOrder.id} | ₹${agent.priceINR}`);

      res.status(201).json({
        success: true,
        data: {
          orderId: order.id,
          mode: "razorpay",
          agent: {
            id: agent.agentId,
            name: agent.name,
            image: agent.image,
          },
          amountINR: agent.priceINR,
          amountUSDC: agent.priceUSDC,
          razorpayOrderId: rzpOrder.id,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
          status: "pending",
        },
      });
    } else {
      // ── Simulate Mode (Fallback) ────────────────────────────
      const payment = generateUPIPayment(null, agent.priceINR, agent.name);

      const order = createOrder({
        userId: req.body.userId || "anonymous",
        agentId: agent.agentId,
        agentName: agent.name,
        agentImage: agent.image,
        agentCategory: agent.category,
        taskDescription,
        amountINR: agent.priceINR,
        amountUSDC: agent.priceUSDC,
        platformFeeUSDC: Number((agent.priceUSDC * 0.025).toFixed(6)),
        upiTransactionId: payment.upiTransactionId,
        payment,
        escrowId: null,
        txHashes: {},
        deliveryURI: null,
        rating: null,
        feedback: null,
        deadline: deadline || "24h",
        statusHistory: [
          { status: "pending", timestamp: new Date().toISOString(), note: "Order created, awaiting UPI payment" },
        ],
      });

      console.log(`📦 Order created (simulate): ${order.id} | Agent: ${agent.name} | ₹${agent.priceINR}`);

      res.status(201).json({
        success: true,
        data: {
          orderId: order.id,
          mode: "simulate",
          agent: {
            id: agent.agentId,
            name: agent.name,
            image: agent.image,
          },
          amountINR: agent.priceINR,
          amountUSDC: agent.priceUSDC,
          payment: {
            upiTransactionId: payment.upiTransactionId,
            upiLink: payment.upiLink,
            qrData: payment.qrData,
            merchantVPA: payment.merchantVPA,
            supportedApps: payment.supportedApps,
            conversionRate: payment.conversionRate,
          },
          status: "pending",
        },
      });
    }
  } catch (err) {
    console.error("❌ Order creation failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/orders/:id/verify-payment
 * Verify Razorpay payment after checkout completes on frontend
 */
router.post("/:id/verify-payment", async (req, res) => {
  try {
    const order = getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Missing required Razorpay fields: razorpay_order_id, razorpay_payment_id, razorpay_signature",
      });
    }

    // Verify the payment signature
    const isValid = verifyRazorpayPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      console.warn(`❌ Payment signature verification failed for order ${order.id}`);
      return res.status(400).json({ success: false, error: "Payment signature verification failed" });
    }

    console.log(`✅ Payment verified: ${razorpay_payment_id} for order ${order.id}`);

    // Update order status
    updateOrder(order.id, {
      status: "paid",
      upiTransactionId: razorpay_payment_id,
      paymentConfirmation: {
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpaySignature: razorpay_signature,
        confirmedAt: new Date().toISOString(),
        method: "razorpay",
      },
      statusHistory: [
        ...order.statusHistory,
        { status: "paid", timestamp: new Date().toISOString(), note: "Razorpay payment verified" },
      ],
    });

    broadcast(order.id, "order.status_update", { status: "paid" });

    // Create on-chain escrow
    console.log(`⛓️  Creating escrow on Monad for order ${order.id}...`);
    const userAddress = req.body.userAddress || "0x0000000000000000000000000000000000000001";

    const escrowResult = await createOnChainEscrow(
      userAddress,
      order.agentId,
      order.amountUSDC,
      order.taskDescription,
      razorpay_payment_id
    );

    updateOrder(order.id, {
      status: "escrowed",
      escrowId: escrowResult.escrowId,
      txHashes: {
        ...order.txHashes,
        createEscrow: escrowResult.createTxHash,
        fundEscrow: escrowResult.fundTxHash,
      },
      onChain: escrowResult.onChain,
      statusHistory: [
        ...getOrderById(order.id).statusHistory,
        {
          status: "escrowed",
          timestamp: new Date().toISOString(),
          note: `Funds escrowed on Monad${escrowResult.onChain ? "" : " (mock)"}`,
          txHash: escrowResult.fundTxHash,
        },
      ],
    });

    broadcast(order.id, "order.status_update", { status: "escrowed", txHash: escrowResult.fundTxHash });

    // Auto-simulate agent work
    setTimeout(async () => {
      const currentOrder = getOrderById(order.id);
      if (currentOrder && currentOrder.status === "escrowed") {
        updateOrder(order.id, {
          status: "in_progress",
          statusHistory: [
            ...currentOrder.statusHistory,
            { status: "in_progress", timestamp: new Date().toISOString(), note: "Agent started working" },
          ],
        });
        broadcast(order.id, "order.status_update", { status: "in_progress" });

        setTimeout(async () => {
          const updatedOrder = getOrderById(order.id);
          if (updatedOrder && updatedOrder.status === "in_progress") {
            const delivery = await submitMockDelivery(updatedOrder.escrowId);
            updateOrder(order.id, {
              status: "delivered",
              deliveryURI: delivery.deliveryURI,
              txHashes: { ...updatedOrder.txHashes, delivery: delivery.txHash },
              deliveredAt: new Date().toISOString(),
              deliveryResult: generateMockDeliveryResult(updatedOrder.agentCategory, updatedOrder.taskDescription),
              statusHistory: [
                ...updatedOrder.statusHistory,
                {
                  status: "delivered",
                  timestamp: new Date().toISOString(),
                  note: "Agent delivered result",
                  txHash: delivery.txHash,
                },
              ],
            });
            broadcast(order.id, "order.status_update", { status: "delivered", deliveryURI: delivery.deliveryURI });
          }
        }, 5000);
      }
    }, 2000);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        status: "escrowed",
        escrowId: escrowResult.escrowId,
        onChain: escrowResult.onChain,
        txHashes: {
          createEscrow: escrowResult.createTxHash,
          fundEscrow: escrowResult.fundTxHash,
        },
        message: "Razorpay payment verified → Funds escrowed on Monad. Agent will begin shortly.",
      },
    });
  } catch (err) {
    console.error("❌ Payment verification failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/orders/:id/simulate-pay
 * Simulate UPI payment confirmation (fallback/demo mode)
 */
router.post("/:id/simulate-pay", async (req, res) => {
  try {
    const order = getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ success: false, error: `Order is already ${order.status}` });
    }

    // Simulate payment confirmation
    const confirmation = simulatePaymentConfirmation(order.upiTransactionId);
    console.log(`💰 UPI Payment simulated: ${order.upiTransactionId}`);

    // Update order status
    updateOrder(order.id, {
      status: "paid",
      paymentConfirmation: confirmation,
      statusHistory: [
        ...order.statusHistory,
        { status: "paid", timestamp: new Date().toISOString(), note: "UPI payment confirmed (simulated)" },
      ],
    });

    broadcast(order.id, "order.status_update", { status: "paid" });

    // Create on-chain escrow
    console.log(`⛓️  Creating escrow on Monad for order ${order.id}...`);
    const userAddress = req.body.userAddress || "0x0000000000000000000000000000000000000001";
    
    const escrowResult = await createOnChainEscrow(
      userAddress,
      order.agentId,
      order.amountUSDC,
      order.taskDescription,
      order.upiTransactionId
    );

    updateOrder(order.id, {
      status: "escrowed",
      escrowId: escrowResult.escrowId,
      txHashes: {
        ...order.txHashes,
        createEscrow: escrowResult.createTxHash,
        fundEscrow: escrowResult.fundTxHash,
      },
      onChain: escrowResult.onChain,
      statusHistory: [
        ...getOrderById(order.id).statusHistory,
        {
          status: "escrowed",
          timestamp: new Date().toISOString(),
          note: `Funds escrowed on Monad${escrowResult.onChain ? "" : " (mock)"}`,
          txHash: escrowResult.fundTxHash,
        },
      ],
    });

    broadcast(order.id, "order.status_update", { status: "escrowed", txHash: escrowResult.fundTxHash });

    // Auto-simulate agent picking up the work after 2 seconds
    setTimeout(async () => {
      const currentOrder = getOrderById(order.id);
      if (currentOrder && currentOrder.status === "escrowed") {
        updateOrder(order.id, {
          status: "in_progress",
          statusHistory: [
            ...currentOrder.statusHistory,
            { status: "in_progress", timestamp: new Date().toISOString(), note: "Agent started working" },
          ],
        });
        broadcast(order.id, "order.status_update", { status: "in_progress" });

        // Auto-simulate delivery after 5 more seconds
        setTimeout(async () => {
          const updatedOrder = getOrderById(order.id);
          if (updatedOrder && updatedOrder.status === "in_progress") {
            const delivery = await submitMockDelivery(updatedOrder.escrowId);
            
            updateOrder(order.id, {
              status: "delivered",
              deliveryURI: delivery.deliveryURI,
              txHashes: { ...updatedOrder.txHashes, delivery: delivery.txHash },
              deliveredAt: new Date().toISOString(),
              deliveryResult: generateMockDeliveryResult(updatedOrder.agentCategory, updatedOrder.taskDescription),
              statusHistory: [
                ...updatedOrder.statusHistory,
                {
                  status: "delivered",
                  timestamp: new Date().toISOString(),
                  note: "Agent delivered result",
                  txHash: delivery.txHash,
                },
              ],
            });
            broadcast(order.id, "order.status_update", { status: "delivered", deliveryURI: delivery.deliveryURI });
          }
        }, 5000);
      }
    }, 2000);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        status: "escrowed",
        escrowId: escrowResult.escrowId,
        onChain: escrowResult.onChain,
        txHashes: {
          createEscrow: escrowResult.createTxHash,
          fundEscrow: escrowResult.fundTxHash,
        },
        message: "UPI payment confirmed → Funds escrowed on Monad. Agent will begin shortly.",
      },
    });
  } catch (err) {
    console.error("❌ Payment simulation failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/orders/:id/confirm
 * User confirms delivery — releases payment to agent
 */
router.post("/:id/confirm", async (req, res) => {
  try {
    const order = getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({ success: false, error: "Order not in delivered status" });
    }

    // Release payment on-chain
    const releaseResult = await releaseOnChainPayment(order.escrowId);

    updateOrder(order.id, {
      status: "completed",
      txHashes: { ...order.txHashes, releasePayment: releaseResult.txHash },
      completedAt: new Date().toISOString(),
      statusHistory: [
        ...order.statusHistory,
        {
          status: "completed",
          timestamp: new Date().toISOString(),
          note: "Payment released to agent",
          txHash: releaseResult.txHash,
        },
      ],
    });

    broadcast(order.id, "order.status_update", { status: "completed", txHash: releaseResult.txHash });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        status: "completed",
        txHash: releaseResult.txHash,
        message: "Payment released to agent. Thank you!",
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/orders/:id/dispute
 * User raises a dispute
 */
router.post("/:id/dispute", async (req, res) => {
  try {
    const order = getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, error: "Reason is required" });
    }

    updateOrder(order.id, {
      status: "disputed",
      disputeReason: reason,
      statusHistory: [
        ...order.statusHistory,
        { status: "disputed", timestamp: new Date().toISOString(), note: `Dispute raised: ${reason}` },
      ],
    });

    broadcast(order.id, "order.status_update", { status: "disputed" });

    res.json({
      success: true,
      data: { orderId: order.id, status: "disputed", message: "Dispute raised. Admin will review within 24 hours." },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/orders/:id/feedback
 * Submit rating and feedback
 */
router.post("/:id/feedback", (req, res) => {
  try {
    const order = getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const { rating, comment, tags } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: "Rating must be between 1 and 5" });
    }

    updateOrder(order.id, {
      rating,
      feedback: comment || "",
      feedbackTags: tags || [],
    });

    res.json({
      success: true,
      data: { orderId: order.id, rating, message: "Feedback submitted. Thank you!" },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/orders
 * List all orders (optionally filter by userId)
 */
router.get("/", (req, res) => {
  try {
    const userId = req.query.userId || "anonymous";
    const userOrders = getOrdersByUserId(userId);
    res.json({ success: true, data: userOrders, total: userOrders.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/orders/:id
 * Get order details including status history
 */
router.get("/:id", (req, res) => {
  try {
    const order = getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Generate mock delivery results based on agent category
 */
function generateMockDeliveryResult(category, taskDescription) {
  const results = {
    "Data Analysis": {
      type: "report",
      title: "Market Sentiment Analysis Report",
      summary: `Analysis completed for: "${taskDescription.substring(0, 100)}"`,
      data: {
        overallSentiment: "Bullish",
        confidenceScore: 78.5,
        sources: ["Twitter (245 posts)", "Reddit (89 threads)", "CoinDesk (12 articles)"],
        keyInsights: [
          "Strong positive momentum detected across social platforms",
          "Institutional interest signals growing",
          "Technical indicators suggest upward trend",
        ],
        recommendation: "Moderate Buy — Consider dollar-cost averaging",
      },
    },
    "Translation": {
      type: "translation",
      title: "Translation Complete",
      summary: `Translation completed for: "${taskDescription.substring(0, 100)}"`,
      data: {
        sourceLanguage: "English",
        targetLanguage: "Hindi",
        wordCount: 350,
        qualityScore: 96.2,
        translatedText: "यह एक नमूना अनुवाद है जो एजेंट द्वारा पूरा किया गया।",
      },
    },
    "Code Review": {
      type: "code_review",
      title: "Code Review Report",
      summary: `Code review completed for: "${taskDescription.substring(0, 100)}"`,
      data: {
        filesReviewed: 12,
        issuesFound: 3,
        severity: { critical: 0, high: 1, medium: 1, low: 1 },
        issues: [
          { severity: "high", file: "auth.js", line: 42, message: "Potential SQL injection vulnerability" },
          { severity: "medium", file: "utils.js", line: 88, message: "Unhandled promise rejection" },
          { severity: "low", file: "index.js", line: 15, message: "Unused import detected" },
        ],
        recommendation: "Fix the high-severity issue before deploying to production.",
      },
    },
    "Image Generation": {
      type: "image",
      title: "Image Generated",
      summary: `Image created for: "${taskDescription.substring(0, 100)}"`,
      data: {
        resolution: "1024x1024",
        format: "PNG",
        style: "Modern, clean design",
        imageUrl: "https://placehold.co/1024x1024/6c5ce7/ffffff?text=Generated+Image",
      },
    },
  };

  return results[category] || {
    type: "general",
    title: "Task Completed",
    summary: `Task completed: "${taskDescription.substring(0, 100)}"`,
    data: { message: "The agent has completed your task. Results are available for download." },
  };
}

export default router;
