// Load environment variables
require('dotenv').config();

const express = require('express');
const crypto = require('crypto');

const app = express();

// ✅ Accept JSON body from Bubble (including secret)
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'HMAC API is live' });
});

// ✅ HMAC generation from Bubble input
app.post('/generate-hmac', (req, res) => {
  const { order_id, payment_id, secret } = req.body;

  if (!order_id || !payment_id || !secret) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const payload = `${order_id}|${payment_id}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Debug output
  console.log("------ HMAC DEBUG ------");
  console.log("Order ID:", order_id);
  console.log("Payment ID:", payment_id);
  console.log("Secret:", secret);
  console.log("Payload:", payload);
  console.log("Generated HMAC:", signature);
  console.log("------------------------");

  res.json({ signature });
});

// Optional: webhook handler if needed
app.post('/razorpay_webhook', (req, res) => {
  console.log("Webhook received:", req.body);
  res.status(200).send("Webhook received");
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
