const crypto = require('crypto');

fastify.post('/generate-hmac', async (request, reply) => {
  const { order_id, payment_id } = request.body;
  const secret = process.env.RAZORPAY_SECRET;

  if (!order_id || !payment_id || !secret) {
    return reply.code(400).send({ error: 'Missing fields' });
  }

  // ✅ Razorpay requires payment_id first, then order_id
  const generated_signature = crypto
    .createHmac('sha256', secret)
    .update(`${payment_id}|${order_id}`)  // FIXED: swapped order
    .digest('hex');

  return reply.send({ signature: generated_signature });
});

