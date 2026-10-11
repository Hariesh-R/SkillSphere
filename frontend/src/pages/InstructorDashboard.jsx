// src/pages/InstructorDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Users,
  Edit3,
  Trash2,
  BookOpen,
  CheckCircle2,
  FileText,
  Star,
  Globe,
  MapPin,
  X,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "",
  skill_level: "beginner",
  mode: "online",
  price: "",
  capacity: "",
  schedule: "",
  meet_link: "",
  location: "",
  status: "published",
};

const CATEGORIES = [
  "Programming",
  "Design",
  "Business",
  "Marketing",
  "Music",
  "Photography",
  "Health",
  "Cooking",
  "Language",
  "Finance",
  "Science",
  "Art",
];

function WorkshopModal({ workshop, onClose, onSave }) {
  const [form, setForm] = useState(workshop || EMPTY_FORM);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? "Edit Workshop Details" : "Create New Workshop"}</div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          <form id="workshop-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Workshop Title *</label>
              <input
                className="form-input"
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. Master Modern Full-Stack Development with React & Node"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Curriculum Description *</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={form.description}
                onChange={set("description")}
                placeholder="Describe what students will learn, prerequisites, and workshop objectives…"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-select" value={form.category} onChange={set("category")} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
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
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={set("price")}
                  placeholder="0 for free"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Capacity (Max Seats) *</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={set("capacity")}
                  placeholder="Max participants"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Delivery Mode *</label>
                <select className="form-select" value={form.mode} onChange={set("mode")}>
                  <option value="online">Online Live Stream</option>
                  <option value="offline">In-Person Classroom</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Publication Status</label>
                <select className="form-select" value={form.status} onChange={set("status")}>
                  <option value="draft">Draft (Private)</option>
                  <option value="published">Published (Public)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Scheduled Date & Time</label>
              <input
                className="form-input"
                type="datetime-local"
                value={form.schedule?.slice(0, 16) || ""}
                onChange={set("schedule")}
              />
            </div>

            {form.mode === "online" && (
              <div className="form-group">
                <label className="form-label">Meeting URL (Google Meet, Zoom, etc.)</label>
                <input
                  className="form-input"
                  value={form.meet_link}
                  onChange={set("meet_link")}
                  placeholder="https://meet.google.com/abc-defg-hij"
                />
              </div>
            )}

            {form.mode === "offline" && (
              <div className="form-group">
                <label className="form-label">Classroom Location / Address</label>
                <input
                  className="form-input"
                  value={form.location}
                  onChange={set("location")}
                  placeholder="Building, room number, city address…"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Cover Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                className="form-input"
                onChange={(e) => setImage(e.target.files[0])}
              />
              <span className="form-hint">JPEG, PNG, or WebP · Max 10 MB</span>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="workshop-form" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Publish Workshop"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentsModal({ workshop, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/workshops/${workshop.id}/students`)
      .then((r) => setStudents(r.data.data.students || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [workshop.id]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Enrolled Students — {workshop.title}</div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="spinner-wrap" style={{ minHeight: 180 }}>
              <div className="spinner" />
            </div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users size={24} />
              </div>
              <h4 className="empty-state-title">No Students Enrolled Yet</h4>
              <p className="empty-state-desc">
                When students reserve seats for this workshop, their names and details will appear here.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Booked On</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.booking_id || i}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.email}</td>
                      <td>
                        <span className={`badge ${s.booking_status === "confirmed" ? "badge-success" : "badge-gray"}`}>
                          {s.booking_status}
                        </span>
                      </td>
                      <td>
                        {s.booking_date
                          ? new Date(s.booking_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
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
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InstructorDashboard() {
  const { user } = useAuth();

  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editWorkshop, setEditWorkshop] = useState(null);
  const [studWorkshop, setStudWorkshop] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const loadWorkshops = useCallback(async () => {
    setLoading(true);
    try {
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

  useEffect(() => {
    loadWorkshops();
  }, [loadWorkshops]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    setMsg({ type: "", text: "" });
    try {
      await api.delete(`/workshops/${id}`);
      setMsg({ type: "success", text: `"${title}" was deleted successfully.` });
      await loadWorkshops();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Delete failed." });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    setShowCreate(false);
    setEditWorkshop(null);
    setMsg({ type: "success", text: "Workshop saved successfully!" });
    await loadWorkshops();
  };

  const published = workshops.filter((w) => w.status === "published").length;

  return (
    <>
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar-title">Instructor Portal</div>
          <button className="sidebar-link active">
            <BookOpen size={16} />
            My Workshops
          </button>
          <button className="sidebar-link" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Create Workshop
          </button>
          <Link to="/profile" className="sidebar-link">
            <User size={16} />
            Profile & Credentials
          </Link>
        </aside>

        {/* Content */}
        <main className="dashboard-content">
          <div className="dashboard-welcome">
            <h1>Instructor Dashboard</h1>
            <p>Manage your curriculum, scheduled workshops, and enrolled students.</p>
          </div>

          {/* Stats */}
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-card-icon">
                <BookOpen size={20} />
              </div>
              <div className="stat-card-value">{workshops.length}</div>
              <div className="stat-card-label">Total Workshops Hosted</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: "var(--success-light)", color: "var(--success)" }}>
                <CheckCircle2 size={20} />
              </div>
              <div className="stat-card-value">{published}</div>
              <div className="stat-card-label">Active Published</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: "var(--brand-violet-light)", color: "var(--brand-violet)" }}>
                <FileText size={20} />
              </div>
              <div className="stat-card-value">{workshops.length - published}</div>
              <div className="stat-card-label">Drafts in Progress</div>
            </div>
          </div>

          {msg.text && (
            <div className={`alert alert-${msg.type}`} style={{ marginBottom: 20 }}>
              {msg.text}
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.25rem", color: "var(--gray-900)" }}>
              Hosted Workshops
            </h2>
            <button className="btn btn-primary flex gap-2" onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              Create Workshop
            </button>
          </div>

          {loading ? (
            <div className="spinner-wrap" style={{ minHeight: 240 }}>
              <div className="spinner" />
            </div>
          ) : workshops.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <BookOpen size={24} />
              </div>
              <h3 className="empty-state-title">No workshops created yet</h3>
              <p className="empty-state-desc">
                Share your skills with passionate learners by creating your first workshop today.
              </p>
              <button className="btn btn-primary btn-sm mt-4 flex gap-1" onClick={() => setShowCreate(true)} style={{ margin: "16px auto 0" }}>
                <Plus size={14} />
                Create First Workshop
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Delivery Mode</th>
                    <th>Fee</th>
                    <th>Remaining Seats</th>
                    <th>Status</th>
                    <th>Avg Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workshops.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <Link to={`/workshops/${w.id}`} style={{ fontWeight: 600, color: "var(--brand-primary)" }}>
                          {w.title}
                        </Link>
                      </td>
                      <td>{w.category}</td>
                      <td>
                        <span className={`badge ${w.mode === "online" ? "badge-primary" : "badge-gray"} flex gap-1`}>
                          {w.mode === "online" ? (
                            <>
                              <Globe size={11} />
                              Online
                            </>
                          ) : (
                            <>
                              <MapPin size={11} />
                              In-Person
                            </>
                          )}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {w.price === 0 ? <span style={{ color: "var(--success)" }}>Free</span> : `₹${Number(w.price).toLocaleString()}`}
                      </td>
                      <td>
                        <span
                          style={{
                            color:
                              w.remaining_seats === 0
                                ? "var(--error)"
                                : w.remaining_seats <= 5
                                ? "var(--warning)"
                                : "inherit",
                            fontWeight: 600,
                          }}
                        >
                          {w.remaining_seats}/{w.capacity}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            w.status === "published"
                              ? "badge-success"
                              : w.status === "draft"
                              ? "badge-warning"
                              : "badge-gray"
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td>
                        {w.avg_rating != null ? (
                          <span className="flex gap-1" style={{ alignItems: "center", fontWeight: 700, color: "#f59e0b" }}>
                            <Star size={13} fill="#f59e0b" color="#f59e0b" />
                            {w.avg_rating.toFixed(1)}
                          </span>
                        ) : (
                          <span style={{ color: "var(--gray-400)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-outline btn-sm flex gap-1"
                            onClick={() => setStudWorkshop(w)}
                            title="View Enrolled Students"
                            aria-label="View students"
                          >
                            <Users size={13} />
                            Students
                          </button>
                          <button
                            className="btn btn-outline btn-sm flex gap-1"
                            onClick={() => setEditWorkshop(w)}
                            title="Edit Workshop"
                            aria-label="Edit workshop"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: "var(--error-light)", color: "var(--error)", border: "1px solid var(--error-border)" }}
                            onClick={() => handleDelete(w.id, w.title)}
                            disabled={deletingId === w.id}
                            title="Delete Workshop"
                            aria-label="Delete workshop"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showCreate && <WorkshopModal onClose={() => setShowCreate(false)} onSave={handleSave} />}
      {editWorkshop && <WorkshopModal workshop={editWorkshop} onClose={() => setEditWorkshop(null)} onSave={handleSave} />}
      {studWorkshop && <StudentsModal workshop={studWorkshop} onClose={() => setStudWorkshop(null)} />}

      <Footer />
    </>
  );
}
