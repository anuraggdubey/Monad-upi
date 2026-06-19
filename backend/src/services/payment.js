/**
 * PayAgent — Simulated UPI Payment Service
 * 
 * For MVP: Generates realistic-looking payment data but doesn't
 * actually process real money. The "Simulate Payment" button on
 * the frontend triggers the confirmation webhook.
 * 
 * For Production: Replace with Razorpay integration.
 */

import { v4 as uuidv4 } from "uuid";

// Fixed conversion rate for MVP (1 USDC = 83 INR)
const INR_TO_USDC_RATE = Number(process.env.INR_TO_USDC_RATE) || 83;

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

/**
 * Generate a mock UPI payment link and QR data
 * In production, this would call Razorpay's API
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
 * In production, this would be triggered by Razorpay webhook
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
};
