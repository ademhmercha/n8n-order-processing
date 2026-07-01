import { useState, useEffect } from 'react';
import api from '../api/client';

export default function NotificationDropdown({ onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/notifications').then((res) => {
      const all = res.data.data || [];
      setNotifications(all.slice(0, 5));
      onUnreadChange(all.filter((n) => !n.is_read).length);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function markRead(id) {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      api.get('/api/notifications').then((res) => {
        const all = res.data.data || [];
        onUnreadChange(all.filter((n) => !n.is_read).length);
      }).catch(() => {});
    } catch {}
  }

  return (
    <div className="notification-dropdown">
      <div className="dropdown-header">Notifications</div>
      {loading ? (
        <div className="dropdown-item">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="dropdown-item">No notifications</div>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            className={`dropdown-item ${!n.is_read ? 'unread' : ''}`}
            onClick={() => markRead(n.id)}
          >
            {n.message}
          </div>
        ))
      )}
    </div>
  );
}
