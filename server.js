// Load environment variables
require('dotenv').config();

// Import modules
const express = require('express');
const crypto = require('crypto');

const app = express();

// ✅ Ensure Razorpay webhooks are parsed correctly as JSON
app.use(express.json({
  type: 'application/json',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString(); // Optional: store raw body if you need HMAC verification for webhook later
  }
}));

// ✅ Health check route (optional)
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'HMAC API is live' });
});

// ✅ Razorpay-compatible HMAC signature generation
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

  // 🧾 Debug logs
  console.log("------ HMAC DEBUG ------");
  console.log("Order ID:", order_id);
  console.log("Payment ID:", payment_id);
  console.log("Secret:", secret);
  console.log("Payload (order_id|payment_id):", payload);
  console.log("Generated HMAC:", signature);
  console.log("------------------------");

  res.json({ signature });
});

// Optional: Catch-all POST for debugging unexpected payloads
app.post('*', (req, res) => {
  console.log("🛑 Unknown POST received at wildcard route:", req.body);
  res.status(200).send('OK');
});

// ✅ Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
