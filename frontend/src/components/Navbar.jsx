import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/client';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    api.get('/api/notifications').then((res) => {
      const notifications = res.data.data || [];
      setUnreadCount(notifications.filter((n) => !n.is_read).length);
    }).catch(() => {});
  }, [user]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/products" className="nav-brand">
          <span className="brand-icon">&#9733;</span> ShopFlow
        </Link>

        <div className="nav-links">
          <Link to="/products" className="nav-link">Products</Link>
          <Link to="/orders" className="nav-link">Orders</Link>
        </div>

        <div className="nav-right">
          <Link to="/cart" className="cart-btn">
            <span className="cart-icon">&#128722;</span>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          <div className="notification-bell" ref={bellRef}>
            <button className="bell-btn" onClick={() => setShowNotifications(!showNotifications)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
            {showNotifications && (
              <NotificationDropdown
                onClose={() => setShowNotifications(false)}
                onUnreadChange={setUnreadCount}
              />
            )}
          </div>

          <div className="user-menu">
            <span className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</span>
            <span className="user-name">{user?.name}</span>
          </div>

          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
