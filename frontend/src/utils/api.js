const API_BASE = 'http://localhost:3001/api';

export async function fetchAgents(filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${API_BASE}/agents?${params}`);
  return res.json();
}

export async function fetchAgent(id) {
  const res = await fetch(`${API_BASE}/agents/${id}`);
  return res.json();
}

export async function createOrder(data) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function simulatePayment(orderId) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/simulate-pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return res.json();
}

export async function verifyPayment(orderId, razorpayData) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(razorpayData),
  });
  return res.json();
}

export async function confirmOrder(orderId) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/confirm`, {
    method: 'POST',
  });
  return res.json();
}

export async function fetchOrder(orderId) {
  const res = await fetch(`${API_BASE}/orders/${orderId}`);
  return res.json();
}

export async function fetchOrders(userId = 'anonymous') {
  const res = await fetch(`${API_BASE}/orders?userId=${userId}`);
  return res.json();
}

export async function submitFeedback(orderId, data) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchPlatformInfo() {
  const res = await fetch(`${API_BASE}/info`);
  return res.json();
}

/**
 * Fetch platform config (Razorpay status, key, payment mode)
 */
export async function fetchConfig() {
  try {
    const res = await fetch(`${API_BASE}/config`);
    return res.json();
  } catch {
    return { razorpayConfigured: false, paymentMode: 'simulate' };
  }
}

/**
 * Open Razorpay Checkout and return a Promise
 * Resolves with { razorpay_payment_id, razorpay_order_id, razorpay_signature }
 * Rejects on user dismissal or failure
 */
export function openRazorpayCheckout({ razorpayKeyId, razorpayOrderId, amountINR, agentName, description }) {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay === 'undefined') {
      reject(new Error('Razorpay SDK not loaded. Check your internet connection.'));
      return;
    }

    const options = {
      key: razorpayKeyId,
      amount: Math.round(amountINR * 100), // paise
      currency: 'INR',
      name: 'PayAgent',
      description: description || `Pay ${agentName}`,
      order_id: razorpayOrderId,
      handler: function (response) {
        resolve({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: function () {
          reject(new Error('Payment cancelled by user'));
        },
        escape: true,
        animation: true,
      },
      prefill: {},
      theme: {
        color: '#6c5ce7',
        backdrop_color: 'rgba(0, 0, 0, 0.75)',
      },
      config: {
        display: {
          blocks: {
            utib: {
              name: 'Pay using UPI',
              instruments: [{ method: 'upi' }],
            },
            other: {
              name: 'Other Methods',
              instruments: [
                { method: 'card' },
                { method: 'netbanking' },
                { method: 'wallet' },
              ],
            },
          },
          sequence: ['block.utib', 'block.other'],
          preferences: {
            show_default_blocks: false,
          },
        },
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', function (response) {
      reject(new Error(response.error?.description || 'Payment failed'));
    });

    rzp.open();
  });
}

export function createWebSocket(orderId) {
  const ws = new WebSocket('ws://localhost:3001/ws');
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'subscribe', orderId }));
  };
  return ws;
}
