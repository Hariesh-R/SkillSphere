// src/pages/NotificationsPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  ArrowRight,
} from "lucide-react";
import api from "../api/axios";
import { useSocket } from "../context/SocketContext";
import Footer from "../components/Footer";

export default function NotificationsPage() {
  const { setUnreadNotifCount } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    setLoading(true);
    api
      .get("/notifications")
      .then(({ data }) => {
        setNotifications(data.data.notifications || []);
        setUnreadNotifCount(data.data.unread_count || 0);
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
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(notifications.map((n) => ({ ...n, is_read: 1 })));
      setUnreadNotifCount(0);
    } catch (err) {}
  };

  const hasUnread = notifications.some((n) => n.is_read === 0);

  return (
    <>
      <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
        <div className="container-sm">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div className="badge badge-primary mb-2">Activity Stream</div>
              <h1 className="page-title">Notifications</h1>
              <p className="page-subtitle">
                Updates on project bids, client actions, workshop bookings, and team invitations
              </p>
            </div>
            {hasUnread && (
              <button className="btn btn-outline btn-sm flex gap-1" onClick={handleMarkAllRead}>
                <CheckCheck size={15} />
                Mark All as Read
              </button>
            )}
          </div>

          {loading ? (
            <div className="spinner-wrap" style={{ minHeight: 240 }}>
              <div className="spinner" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Bell size={24} />
              </div>
              <h2 className="empty-state-title">No Notifications Yet</h2>
              <p className="empty-state-desc">
                When clients view your proposals, message you, or accept team applications, you will receive updates here.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-card ${notif.is_read === 0 ? "unread" : ""}`}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--gray-900)", margin: 0 }}>
                          {notif.title}
                        </h3>
                        {notif.is_read === 0 && (
                          <span className="badge badge-primary" style={{ fontSize: "0.68rem" }}>
                            New
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.875rem", color: "var(--gray-700)", margin: "4px 0 8px", lineHeight: 1.5 }}>
                        {notif.message}
                      </p>
                      <div className="flex gap-1" style={{ alignItems: "center", fontSize: "0.75rem", color: "var(--gray-400)" }}>
                        <Clock size={12} />
                        <span>{new Date(notif.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      {notif.link && (
                        <Link
                          to={notif.link}
                          className="btn btn-primary btn-sm flex gap-1"
                          onClick={() => handleMarkRead(notif.id)}
                        >
                          View
                          <ArrowRight size={13} />
                        </Link>
                      )}
                      {notif.is_read === 0 && (
                        <button
                          className="btn btn-outline btn-sm flex gap-1"
                          onClick={() => handleMarkRead(notif.id)}
                          aria-label="Mark notification as read"
                        >
                          <Check size={14} />
                          Read
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
      <Footer />
    </>
  );
}
