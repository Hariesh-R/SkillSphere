// src/pages/InstructorDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = {
  title: "", description: "", category: "", skill_level: "beginner",
  mode: "online", price: "", capacity: "", schedule: "",
  meet_link: "", location: "", status: "published",
};

const CATEGORIES = [
  "Programming","Design","Business","Marketing","Music",
  "Photography","Health","Cooking","Language","Finance","Science","Art",
];

function WorkshopModal({ workshop, onClose, onSave }) {
  const [form,    setForm]    = useState(workshop || EMPTY_FORM);
  const [image,   setImage]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const isEdit = Boolean(workshop?.id);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title || !form.category || !form.mode || form.price === "" || !form.capacity) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v !== undefined && v !== null && fd.append(k, v));
      if (image) fd.append("image", image);

      if (isEdit) {
        await api.put(`/workshops/${workshop.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/workshops", fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save workshop.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? "Edit Workshop" : "Create New Workshop"}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form id="workshop-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={set("title")} placeholder="Workshop title" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={set("description")} placeholder="Describe what students will learn…" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-select" value={form.category} onChange={set("category")}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Skill Level</label>
                <select className="form-select" value={form.skill_level} onChange={set("skill_level")}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price (₹) *</label>
                <input className="form-input" type="number" min="0" value={form.price} onChange={set("price")} placeholder="0 for free" />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity *</label>
                <input className="form-input" type="number" min="1" value={form.capacity} onChange={set("capacity")} placeholder="Max seats" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mode *</label>
                <select className="form-select" value={form.mode} onChange={set("mode")}>
                  <option value="online">🌐 Online</option>
                  <option value="offline">📍 Offline</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={set("status")}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Schedule</label>
              <input className="form-input" type="datetime-local" value={form.schedule?.slice(0,16) || ""} onChange={set("schedule")} />
            </div>
            {form.mode === "online" && (
              <div className="form-group">
                <label className="form-label">Meet Link</label>
                <input className="form-input" value={form.meet_link} onChange={set("meet_link")} placeholder="https://meet.google.com/…" />
              </div>
            )}
            {form.mode === "offline" && (
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={form.location} onChange={set("location")} placeholder="Venue address" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Cover Image</label>
              <input type="file" accept="image/*" className="form-input" onChange={(e) => setImage(e.target.files[0])} />
              <div className="form-hint">JPEG, PNG or WebP · Max 10 MB</div>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            type="submit"
            form="workshop-form"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Workshop"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentsModal({ workshop, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get(`/workshops/${workshop.id}/students`)
       .then((r) => setStudents(r.data.data.students || []))
       .catch(() => setStudents([]))
       .finally(() => setLoading(false));
  }, [workshop.id]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Students — {workshop.title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No students yet</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Name</th><th>Email</th><th>Status</th><th>Booked On</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.booking_id || i}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight:600 }}>{s.name}</td>
                      <td>{s.email}</td>
                      <td>
                        <span className={`badge ${s.booking_status==="confirmed"?"badge-success":"badge-gray"}`}>
                          {s.booking_status}
                        </span>
                      </td>
                      <td>
                        {s.booking_date
                          ? new Date(s.booking_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function InstructorDashboard() {
  const { user } = useAuth();

  const [workshops,    setWorkshops]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showCreate,   setShowCreate]   = useState(false);
  const [editWorkshop, setEditWorkshop] = useState(null);
  const [studWorkshop, setStudWorkshop] = useState(null);
  const [deletingId,   setDeletingId]   = useState(null);
  const [msg,          setMsg]          = useState({ type:"", text:"" });

  const loadWorkshops = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all workshops from all pages; filter to instructor's own
      const { data } = await api.get("/workshops?limit=50&sort=newest");
      const all = data.data.items || [];
      const mine = all.filter((w) => w.instructor_id === user?.id);
      setWorkshops(mine);
    } catch {
      setWorkshops([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadWorkshops(); }, [loadWorkshops]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    setMsg({ type:"", text:"" });
    try {
      await api.delete(`/workshops/${id}`);
      setMsg({ type:"success", text:`"${title}" deleted.` });
      await loadWorkshops();
    } catch (err) {
      setMsg({ type:"error", text: err.response?.data?.message || "Delete failed." });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    setShowCreate(false);
    setEditWorkshop(null);
    setMsg({ type:"success", text:"Workshop saved successfully!" });
    await loadWorkshops();
  };

  const published = workshops.filter(w=>w.status==="published").length;
  const totalStudents = 0; // We'd need a separate call; keeping it simple

  return (
    <>
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar-title">Instructor</div>
          <button className="sidebar-link active">🏫 My Workshops</button>
          <button className="sidebar-link" onClick={() => setShowCreate(true)}>➕ Create Workshop</button>
          <Link to="/profile" className="sidebar-link">👤 Profile</Link>
        </aside>

        {/* Content */}
        <div className="dashboard-content">
          <div className="dashboard-welcome">
            <h1>Instructor Dashboard 🏫</h1>
            <p>Manage your workshops and students from here.</p>
          </div>

          {/* Stats */}
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-card-icon">🏫</div>
              <div className="stat-card-value">{workshops.length}</div>
              <div className="stat-card-label">Total Workshops</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">🟢</div>
              <div className="stat-card-value">{published}</div>
              <div className="stat-card-label">Published</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">📝</div>
              <div className="stat-card-value">{workshops.length - published}</div>
              <div className="stat-card-label">Drafts</div>
            </div>
          </div>

          {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

          {/* Header row */}
          <div className="workshop-header-actions" style={{ marginBottom:20 }}>
            <h2 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1.2rem", flex:1 }}>
              My Workshops
            </h2>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              ➕ Create Workshop
            </button>
          </div>

          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : workshops.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏫</div>
              <div className="empty-state-title">No workshops yet</div>
              <div className="empty-state-desc">Create your first workshop and start teaching!</div>
              <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => setShowCreate(true)}>
                Create Workshop
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Mode</th>
                    <th>Price</th>
                    <th>Seats Left</th>
                    <th>Status</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workshops.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <Link to={`/workshops/${w.id}`} style={{ fontWeight:600, color:"var(--brand-primary)" }}>
                          {w.title}
                        </Link>
                      </td>
                      <td>{w.category}</td>
                      <td>
                        <span className={`badge ${w.mode==="online"?"badge-primary":"badge-gray"}`}>
                          {w.mode==="online"?"🌐 Online":"📍 Offline"}
                        </span>
                      </td>
                      <td style={{ fontWeight:600 }}>{w.price===0?"Free":`₹${w.price}`}</td>
                      <td>
                        <span style={{ color: w.remaining_seats===0?"var(--error)":w.remaining_seats<=5?"var(--warning)":"inherit", fontWeight:600 }}>
                          {w.remaining_seats}/{w.capacity}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          w.status==="published"?"badge-success":
                          w.status==="draft"?"badge-warning":
                          w.status==="cancelled"?"badge-error":"badge-gray"
                        }`}>{w.status}</span>
                      </td>
                      <td>
                        {w.avg_rating != null ? (
                          <span style={{ fontWeight:700, color:"#f59e0b" }}>★ {w.avg_rating.toFixed(1)}</span>
                        ) : "—"}
                      </td>
                      <td>
                        <div style={{ display:"flex", gap:6 }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setStudWorkshop(w)}
                            title="View students"
                          >👥</button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setEditWorkshop(w)}
                            title="Edit"
                          >✏️</button>
                          <button
                            className="btn btn-sm"
                            style={{ background:"var(--error-light)", color:"var(--error)", border:"1px solid #fecaca" }}
                            onClick={() => handleDelete(w.id, w.title)}
                            disabled={deletingId === w.id}
                            title="Delete"
                          >
                            {deletingId===w.id?"…":"🗑️"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreate    && <WorkshopModal onClose={() => setShowCreate(false)} onSave={handleSave} />}
      {editWorkshop  && <WorkshopModal workshop={editWorkshop} onClose={() => setEditWorkshop(null)} onSave={handleSave} />}
      {studWorkshop  && <StudentsModal workshop={studWorkshop} onClose={() => setStudWorkshop(null)} />}
    </>
  );
}
