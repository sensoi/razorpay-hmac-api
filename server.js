// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const crypto = require('crypto');

const app = express();

// Parse JSON safely
app.use('/generate-hmac', express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'HMAC API is live' });
});

// ✅ HMAC generation (Bubble calls this, NO secret passed)
app.post('/generate-hmac', (req, res) => {
  const { order_id, payment_id } = req.body;
  const secret = process.env.RAZORPAY_SECRET;

  if (!order_id || !payment_id || !secret) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const payload = `${order_id}|${payment_id}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Debug logs
  console.log("------ HMAC DEBUG ------");
  console.log("Order ID:", order_id);
  console.log("Payment ID:", payment_id);
  console.log("Payload:", payload);
  console.log("Generated HMAC:", signature);
  console.log("------------------------");

  res.json({ signature });
});

// Optional wildcard POST for debugging Razorpay webhooks
app.use(express.json({ type: 'application/json' }));

app.post('/razorpay_webhook', (req, res) => {
  console.log("📦 Webhook Received:");
  console.log(req.body); // log full Razorpay payload
  res.status(200).send("Webhook received");
});

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
