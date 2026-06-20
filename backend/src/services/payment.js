/**
 * PayAgent — Payment Service
 * 
 * Supports two modes:
 * 1. Razorpay (real payments) — when RAZORPAY_KEY_ID + SECRET are set
 * 2. Simulated (demo mode) — fallback when keys are not configured
 */

import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

// Fixed conversion rate for MVP (1 USDC = 83 INR)
const INR_TO_USDC_RATE = Number(process.env.INR_TO_USDC_RATE) || 83;

// ── Razorpay SDK (lazy init) ────────────────────────────────────

let razorpayInstance = null;


/**
 * Check if Razorpay is configured with valid keys
 */
function isRazorpayConfigured() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return !!(keyId && keySecret && keyId.startsWith("rzp_"));
}

/**
 * Initialize Razorpay SDK — call once at startup
 */
async function initRazorpay() {
  if (!isRazorpayConfigured()) {
    console.log("⚠️  Razorpay keys not configured — running in simulate mode");
    return false;
  }

  try {
    const Razorpay = (await import("razorpay")).default;
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay SDK initialized successfully");
    return true;
  } catch (err) {
    console.error("❌ Failed to initialize Razorpay:", err.message);
    return false;
  }
}

/**
 * Create a real Razorpay order
 * @param {number} amountINR - Amount in INR
 * @param {string} internalOrderId - Our internal order ID (for receipt)
 * @param {string} agentName - Agent name for payment description
 * @returns {Object} Razorpay order object
 */
async function createRazorpayOrder(amountINR, internalOrderId, agentName) {
  if (!razorpayInstance) {
    throw new Error("Razorpay SDK not initialized");
  }

  const options = {
    amount: Math.round(amountINR * 100), // Razorpay expects amount in paise
    currency: "INR",
    receipt: internalOrderId,
    notes: {
      agent_name: agentName,
      platform: "PayAgent",
      internal_order_id: internalOrderId,
    },
  };

  const order = await razorpayInstance.orders.create(options);
  console.log(`💳 Razorpay order created: ${order.id} | ₹${amountINR}`);
  return order;
}

/**
 * Verify Razorpay payment signature (for checkout callback verification)
 * Uses HMAC SHA256 to verify: razorpay_order_id + "|" + razorpay_payment_id
 */
function verifyRazorpayPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error("RAZORPAY_KEY_SECRET not configured");

  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  return expectedSignature === razorpaySignature;
}

/**
 * Verify Razorpay webhook signature
 * Uses HMAC SHA256 with RAZORPAY_WEBHOOK_SECRET
 */
function verifyRazorpayWebhookSignature(body, signature) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("RAZORPAY_WEBHOOK_SECRET not configured");

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}

// ── Currency Conversion ─────────────────────────────────────────

/**
 * Convert INR to USDC
 */
function inrToUsdc(inrAmount) {
  return Number((inrAmount / INR_TO_USDC_RATE).toFixed(6));
}

/**
 * Convert USDC to INR
 */
function usdcToInr(usdcAmount) {
  return Number((usdcAmount * INR_TO_USDC_RATE).toFixed(2));
}

// ── Simulated Payment (Fallback) ────────────────────────────────

/**
 * Generate a mock UPI payment link and QR data
 * Used when Razorpay is not configured
 */
function generateUPIPayment(orderId, amountINR, agentName) {
  const upiTransactionId = `PAY_${uuidv4().replace(/-/g, "").substring(0, 16).toUpperCase()}`;
  const merchantVPA = "payagent@monad";

  return {
    upiTransactionId,
    amountINR,
    amountUSDC: inrToUsdc(amountINR),
    merchantVPA,
    // UPI deep link format (would work with real VPA)
    upiLink: `upi://pay?pa=${merchantVPA}&pn=PayAgent&am=${amountINR}&cu=INR&tn=Pay+${encodeURIComponent(agentName)}+via+PayAgent&tr=${upiTransactionId}`,
    // QR code data (frontend will render this as QR)
    qrData: `upi://pay?pa=${merchantVPA}&pn=PayAgent&am=${amountINR}&cu=INR&tn=Pay+${encodeURIComponent(agentName)}&tr=${upiTransactionId}`,
    status: "created",
    supportedApps: [
      { name: "Google Pay", icon: "gpay", scheme: "tez://upi" },
      { name: "PhonePe", icon: "phonepe", scheme: "phonepe://pay" },
      { name: "Paytm", icon: "paytm", scheme: "paytmmp://pay" },
      { name: "BHIM", icon: "bhim", scheme: "bhim://pay" },
    ],
    conversionRate: INR_TO_USDC_RATE,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Simulate UPI payment confirmation
 * Used when Razorpay is not configured
 */
function simulatePaymentConfirmation(upiTransactionId) {
  return {
    upiTransactionId,
    status: "confirmed",
    razorpayPaymentId: `rzp_sim_${uuidv4().substring(0, 12)}`,
    razorpayOrderId: `order_sim_${uuidv4().substring(0, 12)}`,
    confirmedAt: new Date().toISOString(),
    method: "upi",
    bank: "SIMULATED",
  };
}

export {
  inrToUsdc,
  usdcToInr,
  generateUPIPayment,
  simulatePaymentConfirmation,
  INR_TO_USDC_RATE,
  isRazorpayConfigured,
  initRazorpay,
  createRazorpayOrder,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
};
