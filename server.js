require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const getRawBody = require('raw-body'); // 👈 THIS is key

const app = express();

// ✅ Use express.json only for /generate-hmac
app.use('/generate-hmac', express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'HMAC API is live' });
});

// ✅ Razorpay-compatible HMAC generation (safe)
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

  console.log("------ HMAC DEBUG ------");
  console.log("Order ID:", order_id);
  console.log("Payment ID:", payment_id);
  console.log("Secret:", secret);
  console.log("Payload:", payload);
  console.log("Generated HMAC:", signature);
  console.log("------------------------");

  res.json({ signature });
});

// ✅ Razorpay Webhook route (use raw-body parsing)
app.post('/razorpay_webhook', async (req, res) => {
  try {
    const raw = await getRawBody(req);
    const data = JSON.parse(raw.toString()); // 🧠 This will now parse properly

    console.log("✅ Webhook Received:");
    console.log(data);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    res.status(400).send("Invalid payload");
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
