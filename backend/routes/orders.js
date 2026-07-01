const express = require('express');
const axios = require('axios');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Valid productId and quantity are required' });
    }

    const product = await pool.query('SELECT id, price, stock_quantity FROM products WHERE id = $1', [productId]);
    if (product.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const order = await pool.query(
      "INSERT INTO orders (customer_id, product_id, quantity, status) VALUES ($1, $2, $3, 'pending') RETURNING id, status, created_at",
      [req.user.id, productId, quantity]
    );

    const newOrder = order.rows[0];

    try {
      const n8nResponse = await axios.post(
        process.env.N8N_WEBHOOK_URL,
        {
          orderId: newOrder.id,
          customerId: req.user.id,
          productId,
          quantity,
        },
        { timeout: 30000 }
      );

      res.json({
        success: true,
        data: n8nResponse.data,
        message: 'Order submitted for processing',
      });
    } catch (n8nErr) {
      if (n8nErr.response && n8nErr.response.data) {
        return res.status(500).json({
          success: false,
          message: n8nErr.response.data.message || 'Order processing failed',
        });
      }
      console.error('n8n webhook error:', n8nErr.message);
      res.status(500).json({ success: false, message: 'Order processing service unavailable' });
    }
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.quantity, o.status, o.created_at,
              p.name AS product_name, p.price AS product_price
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error('Orders fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

module.exports = router;
