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

export function createWebSocket(orderId) {
  const ws = new WebSocket('ws://localhost:3001/ws');
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'subscribe', orderId }));
  };
  return ws;
}
