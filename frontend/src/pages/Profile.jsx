// src/pages/Profile.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form,    setForm]    = useState({ name: user?.name || "", bio: user?.bio || "" });
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState({ type: "", text: "" });

  // Password change
  const [pwForm,   setPwForm]   = useState({ current: "", next: "", confirm: "" });
  const [pwLoading,setPwLoading]= useState(false);
  const [pwMsg,    setPwMsg]    = useState({ type: "", text: "" });

  const set  = (k) => (e) => setForm((f)   => ({ ...f, [k]: e.target.value }));
  const setPw = (k) => (e) => setPwForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setMsg({ type:"error", text:"Name is required." }); return; }
    setLoading(true);
    setMsg({ type:"", text:"" });
    try {
      const { data } = await api.put("/auth/me", { name: form.name, bio: form.bio });
      // The backend doesn't have PUT /auth/me yet — for now we just update locally
      updateUser({ ...user, name: form.name, bio: form.bio });
      setMsg({ type:"success", text:"Profile updated successfully!" });
    } catch (err) {
      // If endpoint doesn't exist, still update locally
      updateUser({ ...user, name: form.name, bio: form.bio });
      setMsg({ type:"success", text:"Profile updated locally." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
      <div className="container-sm">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-large">
            {user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="profile-name">{user?.name}</div>
            <div className="profile-role">
              <span className={`badge ${user?.role==="instructor"?"badge-primary":"badge-success"}`}>
                {user?.role === "instructor" ? "👨‍🏫 Instructor" : "🎓 Student"}
              </span>
            </div>
            <div className="profile-email">{user?.email}</div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="card" style={{ marginBottom:24 }}>
          <div className="card-body">
            <h2 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1.1rem", marginBottom:20, color:"var(--gray-900)" }}>
              Edit Profile
            </h2>
            {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Your full name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  value={user?.email || ""}
                  disabled
                  style={{ background:"var(--gray-50)", cursor:"not-allowed" }}
                />
                <div className="form-hint">Email cannot be changed.</div>
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  className="form-textarea"
                  value={form.bio}
                  onChange={set("bio")}
                  placeholder="Tell others about yourself…"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving…" : "Save Changes"}
              </button>
            </form>
          </div>
        </div>

        {/* Account Info */}
        <div className="card">
          <div className="card-body">
            <h2 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1.1rem", marginBottom:20, color:"var(--gray-900)" }}>
              Account Information
            </h2>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                ["👤 Role", user?.role === "instructor" ? "Instructor" : "Student"],
                ["📧 Email", user?.email],
                ["🆔 User ID", user?.id?.slice(0,8) + "…"],
              ].map(([label, value]) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid var(--gray-100)" }}>
                  <span style={{ fontWeight:600, fontSize:"0.875rem", color:"var(--gray-700)" }}>{label}</span>
                  <span style={{ fontSize:"0.875rem", color:"var(--gray-500)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
