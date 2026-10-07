// src/pages/NotificationsPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useSocket } from "../context/SocketContext";

export default function NotificationsPage() {
  const { setUnreadNotifCount } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    setLoading(true);
    api.get("/notifications")
      .then(({ data }) => {
        setNotifications(data.data.notifications);
        setUnreadNotifCount(data.data.unread_count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
      setUnreadNotifCount(0);
    } catch (err) {}
  };

  return (
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
      <div className="container-sm">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">Stay updated on project proposals, hiring decisions, and team recruitment</p>
          </div>
          {notifications.some(n => n.is_read === 0) && (
            <button className="btn btn-outline btn-sm" onClick={handleMarkAllRead}>
              ✓ Mark All as Read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center" style={{ padding: 60 }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <div className="empty-state-title">No Notifications Yet</div>
            <div className="empty-state-desc">You'll receive notifications when clients view your proposals, message you, or accept team applications.</div>
          </div>
        ) : (
          <div>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notif-card ${notif.is_read === 0 ? "unread" : ""}`}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--gray-900)" }}>{notif.title}</h3>
                    <p style={{ fontSize: "0.9rem", color: "var(--gray-700)", margin: "4px 0" }}>{notif.message}</p>
                    <span style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {notif.link && (
                      <Link to={notif.link} className="btn btn-primary btn-sm" onClick={() => handleMarkRead(notif.id)}>
                        View →
                      </Link>
                    )}
                    {notif.is_read === 0 && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleMarkRead(notif.id)}>
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
