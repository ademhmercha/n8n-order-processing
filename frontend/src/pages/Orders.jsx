import { useState, useEffect } from 'react';
import api from '../api/client';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/orders').then((res) => {
      setOrders(res.data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function statusBadgeClass(status) {
    switch (status) {
      case 'confirmed': return 'badge-green';
      case 'pending': return 'badge-yellow';
      case 'failed': return 'badge-red';
      default: return 'badge-gray';
    }
  }

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="page">
      <h2>My Orders</h2>

      {orders.length === 0 ? (
        <p>No orders yet. <a href="/products">Browse products</a> to place your first order.</p>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.product_name}</td>
                <td>{order.quantity}</td>
                <td>${(parseFloat(order.product_price) * order.quantity).toFixed(2)}</td>
                <td>
                  <span className={`badge ${statusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
