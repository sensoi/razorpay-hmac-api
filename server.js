require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

app.post('/generate-hmac', (req, res) => {
  const { order_id, payment_id } = req.body;
  const secret = process.env.RAZORPAY_SECRET;

  if (!order_id || !payment_id || !secret) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const generated_signature = crypto
    .createHmac('sha256', secret)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');

  res.json({ signature: generated_signature });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
