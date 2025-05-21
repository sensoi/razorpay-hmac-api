// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const crypto = require('crypto');
const axios = require('axios'); // for calling Bubble

// Initialize Express app
const app = express();
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'HMAC API is live' });
});

// ✅ Razorpay-compatible HMAC generation (existing route)
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
  console.log("Payload (order_id|payment_id):", payload);
  console.log("Generated HMAC:", signature);
  console.log("------------------------");

  res.json({ signature });
});

// ✅ NEW: Razorpay webhook verification
app.post('/rzp-webhook', (req, res) => {
  const razorpaySignature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_SECRET;
  const body = JSON.stringify(req.body); // stringified for HMAC

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  console.log("------ WEBHOOK DEBUG ------");
  console.log("Received Signature:", razorpaySignature);
  console.log("Expected Signature:", expectedSignature);
  console.log("----------------------------");

  if (razorpaySignature === expectedSignature) {
    const event = req.body.event;
    const payment = req.body.payload?.payment?.entity || {};

    const dataToSend = {
      payment_id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount,
      status: event === 'payment.captured' ? 'success' : 'failure'
    };

    axios.post('https://www.app.nox.today/version-728j5/api/1.1/wf/verify-from-render', dataToSend)
      .then(() => {
        res.json({ status: "forwarded to Bubble", result: dataToSend });
      })
      .catch(err => {
        console.error("Bubble API error:", err.message);
        res.status(500).json({ error: "Failed to notify Bubble" });
      });

  } else {
    res.status(401).json({ error: "Invalid Razorpay signature" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
