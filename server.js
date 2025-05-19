// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const crypto = require('crypto');
const app = express();

// 🔧 Ensure proper parsing of application/json content
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString(); // Save raw body if needed
  }
}));

// Health check route (optional)
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'HMAC API is live' });
});

// ✅ Razorpay-compatible HMAC generation
app.post('/generate-hmac', (req, res) => {
  const { order_id, payment_id, secret } = req.body;

  if (!order_id || !payment_id || !secret) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Razorpay format: order_id|payment_id
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

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
