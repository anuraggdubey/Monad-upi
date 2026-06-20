/**
 * PayAgent — Razorpay Webhook Routes
 * 
 * POST /api/razorpay/webhook — Receives Razorpay payment events
 * 
 * Events handled:
 * - payment.captured  → Mark order as paid, create on-chain escrow
 * - payment.failed    → Mark order as payment_failed
 * - payment.dispute.created → Mark order as disputed
 */

import { Router } from "express";
import { getOrderByRazorpayOrderId, updateOrder, getOrderById } from "../config/database.js";
import { verifyRazorpayWebhookSignature } from "../services/payment.js";
import { createOnChainEscrow, submitMockDelivery } from "../services/escrow.js";

const router = Router();

// In-memory broadcast function (set by server)
let broadcastFn = null;
export function setWebhookBroadcast(fn) {
  broadcastFn = fn;
}

function broadcast(orderId, event, data) {
  if (broadcastFn) {
    broadcastFn(orderId, { type: event, orderId, ...data, timestamp: new Date().toISOString() });
  }
}

/**
 * POST /api/razorpay/webhook
 * 
 * IMPORTANT: This route must receive the raw request body (not parsed JSON)
 * for signature verification. The server must set up express.raw() for this path.
 */
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
      console.warn("⚠️  Webhook received without signature header");
      return res.status(400).json({ error: "Missing signature" });
    }

    // Verify webhook signature
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.warn("❌ Webhook signature verification failed");
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Parse the event
    const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const eventType = event.event;
    const payload = event.payload;

    console.log(`📨 Razorpay webhook: ${eventType}`);

    switch (eventType) {
      case "payment.captured": {
        await handlePaymentCaptured(payload);
        break;
      }
      case "payment.failed": {
        await handlePaymentFailed(payload);
        break;
      }
      case "payment.dispute.created": {
        await handleDisputeCreated(payload);
        break;
      }
      default: {
        console.log(`   ℹ️  Unhandled webhook event: ${eventType}`);
      }
    }

    // Always respond 200 to Razorpay (even for unhandled events)
    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    // Still return 200 to prevent Razorpay from retrying
    res.status(200).json({ status: "error", message: err.message });
  }
});

/**
 * Handle payment.captured event
 * Payment has been successfully captured — create escrow
 */
async function handlePaymentCaptured(payload) {
  const payment = payload.payment?.entity;
  if (!payment) return;

  const razorpayOrderId = payment.order_id;
  const razorpayPaymentId = payment.id;

  console.log(`   💰 Payment captured: ${razorpayPaymentId} for order: ${razorpayOrderId}`);

  // Find our internal order
  const order = getOrderByRazorpayOrderId(razorpayOrderId);
  if (!order) {
    console.warn(`   ⚠️  No matching order found for Razorpay order: ${razorpayOrderId}`);
    return;
  }

  if (order.status !== "pending") {
    console.log(`   ℹ️  Order ${order.id} already processed (status: ${order.status})`);
    return;
  }

  // Update order to paid
  updateOrder(order.id, {
    status: "paid",
    paymentConfirmation: {
      razorpayPaymentId,
      razorpayOrderId,
      method: payment.method,
      bank: payment.bank || payment.wallet || "N/A",
      email: payment.email,
      contact: payment.contact,
      confirmedAt: new Date().toISOString(),
    },
    statusHistory: [
      ...order.statusHistory,
      {
        status: "paid",
        timestamp: new Date().toISOString(),
        note: `Payment confirmed via Razorpay (${payment.method})`,
      },
    ],
  });

  broadcast(order.id, "order.status_update", { status: "paid" });

  // Create on-chain escrow
  console.log(`   ⛓️  Creating escrow on Monad for order ${order.id}...`);
  try {
    const userAddress = "0x0000000000000000000000000000000000000001";

    const escrowResult = await createOnChainEscrow(
      userAddress,
      order.agentId,
      order.amountUSDC,
      order.taskDescription,
      razorpayPaymentId // Use Razorpay payment ID as the UPI transaction reference
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

    broadcast(order.id, "order.status_update", {
      status: "escrowed",
      txHash: escrowResult.fundTxHash,
    });

    // Auto-simulate agent pickup after 2 seconds
    autoSimulateAgentWork(order.id);
  } catch (err) {
    console.error(`   ❌ Escrow creation failed for order ${order.id}:`, err);
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payload) {
  const payment = payload.payment?.entity;
  if (!payment) return;

  const razorpayOrderId = payment.order_id;
  console.log(`   ❌ Payment failed for Razorpay order: ${razorpayOrderId}`);

  const order = getOrderByRazorpayOrderId(razorpayOrderId);
  if (!order) return;

  updateOrder(order.id, {
    status: "payment_failed",
    statusHistory: [
      ...order.statusHistory,
      {
        status: "payment_failed",
        timestamp: new Date().toISOString(),
        note: `Payment failed: ${payment.error_description || "Unknown error"}`,
      },
    ],
  });

  broadcast(order.id, "order.status_update", { status: "payment_failed" });
}

/**
 * Handle payment.dispute.created event
 */
async function handleDisputeCreated(payload) {
  const dispute = payload.dispute?.entity;
  if (!dispute) return;

  const razorpayPaymentId = dispute.payment_id;
  console.log(`   ⚖️  Dispute created for payment: ${razorpayPaymentId}`);

  // Find order by payment ID (search through all orders)
  // For now, log it — would need a payment-to-order lookup in production
}

/**
 * Auto-simulate agent work (same behavior as simulate-pay flow)
 */
function autoSimulateAgentWork(orderId) {
  setTimeout(async () => {
    const currentOrder = getOrderById(orderId);
    if (currentOrder && currentOrder.status === "escrowed") {
      updateOrder(orderId, {
        status: "in_progress",
        statusHistory: [
          ...currentOrder.statusHistory,
          { status: "in_progress", timestamp: new Date().toISOString(), note: "Agent started working" },
        ],
      });
      broadcast(orderId, "order.status_update", { status: "in_progress" });

      // Auto-simulate delivery after 5 seconds
      setTimeout(async () => {
        const updatedOrder = getOrderById(orderId);
        if (updatedOrder && updatedOrder.status === "in_progress") {
          try {
            const delivery = await submitMockDelivery(updatedOrder.escrowId);
            updateOrder(orderId, {
              status: "delivered",
              deliveryURI: delivery.deliveryURI,
              txHashes: { ...updatedOrder.txHashes, delivery: delivery.txHash },
              deliveredAt: new Date().toISOString(),
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
            broadcast(orderId, "order.status_update", {
              status: "delivered",
              deliveryURI: delivery.deliveryURI,
            });
          } catch (err) {
            console.error(`❌ Auto-delivery failed for order ${orderId}:`, err);
          }
        }
      }, 5000);
    }
  }, 2000);
}

export default router;
