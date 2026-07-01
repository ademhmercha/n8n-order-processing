import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api/client';

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutProgress, setCheckoutProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  async function handleCheckout() {
    setCheckingOut(true);
    setError('');
    setResults([]);
    const total = items.length;
    setCheckoutProgress({ current: 0, total });
    const orderResults = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const res = await api.post('/api/orders', {
          productId: item.product.id,
          quantity: item.quantity,
        });
        orderResults.push({ success: true, product: item.product.name, data: res.data });
      } catch (err) {
        orderResults.push({
          success: false,
          product: item.product.name,
          error: err.response?.data?.message || 'Order failed',
        });
      }
      setCheckoutProgress({ current: i + 1, total });
      setResults([...orderResults]);
    }

    const allSuccess = orderResults.every((r) => r.success);
    if (allSuccess) {
      clearCart();
    }
    setCheckingOut(false);
  }

  if (items.length === 0 && !checkingOut) {
    return (
      <div className="page">
        <div className="page-header">
          <h2>Shopping Cart</h2>
        </div>
        <div className="empty-state">
          <div className="empty-icon">&#128722;</div>
          <h3>Your cart is empty</h3>
          <p>Browse our products and add items you like.</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      </div>
    );
  }

  const hasFailures = results.some((r) => !r.success);
  const allDone = results.length === items.length;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Shopping Cart ({items.length} item{items.length > 1 ? 's' : ''})</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.product.id} className="cart-item">
              <div className="cart-item-info">
                <div className="cart-item-color" style={{ background: getCategoryColor(item.product.name) }} />
                <div>
                  <h4>{item.product.name}</h4>
                  <p className="cart-item-price">${parseFloat(item.product.price).toFixed(2)}</p>
                </div>
              </div>
              <div className="cart-item-controls">
                <button
                  className="qty-btn"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  disabled={checkingOut || item.quantity <= 1}
                >
                  &minus;
                </button>
                <span className="qty-value">{item.quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  disabled={checkingOut || item.quantity >= item.product.stock_quantity}
                >
                  +
                </button>
                <button
                  className="btn-remove"
                  onClick={() => removeItem(item.product.id)}
                  disabled={checkingOut}
                >
                  &#10005;
                </button>
              </div>
              <div className="cart-item-total">
                ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}

          {results.length > 0 && (
            <div className="checkout-results">
              <h4>Order Results</h4>
              {results.map((r, idx) => (
                <div key={idx} className={`result-row ${r.success ? 'result-success' : 'result-fail'}`}>
                  <span>{r.product}</span>
                  <span>{r.success ? 'Confirmed' : r.error}</span>
                </div>
              ))}
              {allDone && !hasFailures && (
                <div className="result-all-success">
                  All orders placed successfully!
                  <button className="btn-primary" onClick={() => navigate('/orders')}>
                    View Orders
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span className="free">Free</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-row total">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          <button
            className="btn-checkout"
            onClick={handleCheckout}
            disabled={checkingOut || items.length === 0}
          >
            {checkingOut
              ? `Processing ${checkoutProgress.current}/${checkoutProgress.total}...`
              : 'Place All Orders'}
          </button>

          {checkingOut && (
            <div className="checkout-bar">
              <div
                className="checkout-bar-fill"
                style={{ width: `${(checkoutProgress.current / checkoutProgress.total) * 100}%` }}
              />
            </div>
          )}

          <button
            className="btn-clear"
            onClick={clearCart}
            disabled={checkingOut || items.length === 0}
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function getCategoryColor(name) {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
