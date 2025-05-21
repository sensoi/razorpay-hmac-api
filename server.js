// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

// Initialize Express app
const app = express();

// ✅ Use raw body ONLY for Razorpay webhook (must come BEFORE express.json)
app.use('/rzp-webhook', express.raw({ type: 'application/json' }));

// ✅ Use JSON body for all other routes
app.use(express.json());

// ✅ Health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'HMAC API is live' });
});

// ✅ Frontend: Generate HMAC signature for manual verification
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

// ✅ Razorpay webhook endpoint
app.post('/rzp-webhook', (req, res) => {
  const secret = process.env.RAZORPAY_SECRET;
  const receivedSignature = req.headers['x-razorpay-signature'];
  const rawBody = req.body.toString(); // Raw body is needed

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  console.log("------ WEBHOOK DEBUG ------");
  console.log("Received Signature:", receivedSignature);
  console.log("Expected Signature:", expectedSignature);
  console.log("----------------------------");

  if (receivedSignature === expectedSignature) {
    const jsonBody = JSON.parse(rawBody);
    const event = jsonBody.event;
    const payment = jsonBody.payload?.payment?.entity || {};

    const dataToSend = {
      payment_id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount,
      status: event === 'payment.captured' ? 'success' : 'failure'
    };

    axios.post(
      'https://www.app.nox.today/version-728j5/api/1.1/wf/verify-from-render',
      dataToSend,
      {
        headers: {
          'Authorization': `Bearer ${process.env.BUBBLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )
    .then(() => {
      console.log("✅ Webhook forwarded to Bubble:", dataToSend);
      res.json({ status: "Webhook forwarded to Bubble", result: dataToSend });
    })
    .catch(err => {
      console.error("❌ Failed to call Bubble API:", err.response?.data || err.message);
      res.status(500).json({ error: "Bubble call failed" });
    });

  } else {
    console.warn("❌ Signature mismatch — webhook rejected.");
    res.status(401).json({ error: "Invalid Razorpay signature" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
