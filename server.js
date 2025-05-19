
// Load environment variables require('dotenv").config();
// Import required modules
const express = require('express'); const crypto = require('crypto');
// Initialize Express app const app = express(); app.use(express.json());
// Health check route (optional) app.get('/', (req, res) => {
});
res.json({ status: 'ok', message: 'HMAC API is live" });
Razorpay-compatible HMAC generation
app.post('/generate-hmac', (req, res) => {
const { order_id, payment_id, secret } = req.body;
if (lorder_id || payment_id || !secret) {
}
return res.status(488).json({ error: 'Missing fields' });
// Razorpay format: order_id payment_id
//
Razorpay format: order_id payment_id
const payload = "${order_id}|${payment_id}`; const signature = crypto
.createHmac('sha256', secret)
.update(payload)
.digest('hex');
Add debug logs
console.log("------ HMAC DEBUG ------");
console.log("Order ID:", order_id);
console.log("Payment ID:", payment_id);
console.log("Secret:", secret);
console.log("Payload (order_id|payment_id):", payload);
console.log("Generated HMAC:", signature);
console.log("-
----");
res.json({ signature });
});
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log("Server running on port ${PORT}`);
});
