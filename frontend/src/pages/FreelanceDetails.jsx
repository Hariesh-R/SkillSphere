// src/pages/FreelanceDetails.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function FreelanceDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Proposal Form
  const [propForm, setPropForm] = useState({
    cover_letter: "",
    proposed_price: "",
    estimated_delivery_time: ""
  });
  const [propLoading, setPropLoading] = useState(false);
  const [propMsg, setPropMsg] = useState({ type: "", text: "" });

  // Submission Form (Freelancer)
  const [subForm, setSubForm] = useState({ description: "" });
  const [subLoading, setSubLoading] = useState(false);

  // Revision Form (Client)
  const [revFeedback, setRevFeedback] = useState("");
  const [revLoading, setRevLoading] = useState(false);

  // Review Form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchProjectDetails = () => {
    setLoading(true);
    api.get(`/freelance/projects/${id}`)
      .then(({ data }) => {
        setData(data.data);
        if (data.data.project.min_budget) {
          setPropForm((prev) => ({ ...prev, proposed_price: data.data.project.min_budget }));
        }
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load project details."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  if (loading) {
    return <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>Loading project details...</div>;
  }

  if (error || !data) {
    return (
      <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2>Project Not Found</h2>
        <p className="text-muted mt-4">{error}</p>
        <Link to="/freelance" className="btn btn-primary mt-4">Back to Marketplace</Link>
      </div>
    );
  }

  const { project, submissions, reviews } = data;
  const isClient = user && user.id === project.client_id;
  const isAssignedFreelancer = user && user.id === project.freelancer_id;

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    setPropLoading(true);
    setPropMsg({ type: "", text: "" });
    try {
      await api.post(`/freelance/projects/${project.id}/proposals`, propForm);
      setPropMsg({ type: "success", text: "Proposal submitted successfully!" });
      fetchProjectDetails();
    } catch (err) {
      setPropMsg({ type: "error", text: err.response?.data?.message || "Failed to submit proposal." });
    } finally {
      setPropLoading(false);
    }
  };

  const handleWorkSubmit = async (e) => {
    e.preventDefault();
    setSubLoading(true);
    try {
      await api.post(`/freelance/projects/${project.id}/submissions`, subForm);
      alert("Work submitted for client review!");
      fetchProjectDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit work.");
    } finally {
      setSubLoading(false);
    }
  };

  const handleClientAction = async (action) => {
    setRevLoading(true);
    try {
      await api.patch(`/freelance/projects/${project.id}/complete`, {
        action,
        feedback: action === "REVISION" ? revFeedback : undefined
      });
      alert(action === "ACCEPT" ? "Project completed!" : "Revision requested.");
      fetchProjectDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
    } finally {
      setRevLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    try {
      await api.post(`/freelance/projects/${project.id}/reviews`, { rating, comment });
      alert("Review submitted successfully!");
      fetchProjectDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "40px 0 80px" }}>
      <div className="container">
        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
          {/* Left Column: Details */}
          <div>
            <div className="card" style={{ marginBottom: 32 }}>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className="badge badge-primary">{project.category}</span>
                  <span className={`badge ${project.status === "OPEN" ? "badge-success" : project.status === "IN_PROGRESS" ? "badge-warning" : "badge-secondary"}`}>
                    {project.status}
                  </span>
                </div>

                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", marginBottom: 16 }}>
                  {project.title}
                </h1>

                <p style={{ color: "var(--gray-700)", lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: 24 }}>
                  {project.description}
                </p>

                {project.skills_required && (
                  <div style={{ marginBottom: 24 }}>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 8 }}>Required Skills</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {project.skills_required.replace(/[[\]"]/g, "").split(",").map((s, i) => (
                        <span key={i} className="chip">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, borderTop: "1px solid var(--gray-200)", paddingTop: 16 }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--gray-500)", display: "block" }}>BUDGET</span>
                    <strong style={{ fontSize: "1.1rem" }}>₹{project.min_budget} {project.max_budget ? `- ₹${project.max_budget}` : ""}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--gray-500)", display: "block" }}>({project.budget_type})</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--gray-500)", display: "block" }}>ESTIMATED DURATION</span>
                    <strong>{project.estimated_duration || "Flexible"}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--gray-500)", display: "block" }}>EXPERIENCE LEVEL</span>
                    <strong style={{ textTransform: "capitalize" }}>{project.experience_level}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Submissions Section */}
            {submissions?.length > 0 && (
              <div className="card" style={{ marginBottom: 32 }}>
                <div className="card-body">
                  <h3 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 16 }}>Work Submissions</h3>
                  {submissions.map((sub) => (
                    <div key={sub.id} style={{ borderBottom: "1px solid var(--gray-200)", paddingBottom: 16, marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong>Submission by {sub.freelancer_name}</strong>
                        <span className={`badge ${sub.status === "ACCEPTED" ? "badge-success" : sub.status === "REVISION_REQUESTED" ? "badge-danger" : "badge-warning"}`}>
                          {sub.status}
                        </span>
                      </div>
                      <p style={{ margin: "8px 0", color: "var(--gray-700)" }}>{sub.description}</p>
                      {sub.feedback && (
                        <div className="alert alert-error" style={{ marginTop: 8 }}>
                          <strong>Revision Feedback:</strong> {sub.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proposal Submission Form (Freelancer) */}
            {user && !isClient && project.status === "OPEN" && (
              <div className="card" style={{ marginBottom: 32 }}>
                <div className="card-body">
                  <h3 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 16 }}>Submit Proposal</h3>
                  {propMsg.text && <div className={`alert alert-${propMsg.type}`} style={{ marginBottom: 16 }}>{propMsg.text}</div>}
                  <form onSubmit={handleProposalSubmit}>
                    <div className="form-group">
                      <label className="form-label">Cover Letter</label>
                      <textarea
                        className="form-textarea"
                        rows={5}
                        placeholder="Explain why you are the best fit for this project, your relevant experience, and approach..."
                        value={propForm.cover_letter}
                        onChange={(e) => setPropForm({ ...propForm, cover_letter: e.target.value })}
                        required
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label">Proposed Price (₹)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={propForm.proposed_price}
                          onChange={(e) => setPropForm({ ...propForm, proposed_price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Estimated Delivery Time</label>
                        <input
                          className="form-input"
                          placeholder="e.g. 5 Days, 2 Weeks"
                          value={propForm.estimated_delivery_time}
                          onChange={(e) => setPropForm({ ...propForm, estimated_delivery_time: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={propLoading}>
                      {propLoading ? "Submitting..." : "Submit Proposal"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Work Submission Form (Assigned Freelancer) */}
            {isAssignedFreelancer && (project.status === "IN_PROGRESS" || project.status === "SUBMITTED") && (
              <div className="card" style={{ marginBottom: 32 }}>
                <div className="card-body">
                  <h3 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 16 }}>Submit Work for Review</h3>
                  <form onSubmit={handleWorkSubmit}>
                    <div className="form-group">
                      <label className="form-label">Submission Details & Deliverables Link</label>
                      <textarea
                        className="form-textarea"
                        rows={4}
                        placeholder="Provide details about completed work, repository links, or preview URLs..."
                        value={subForm.description}
                        onChange={(e) => setSubForm({ description: e.target.value })}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-success" disabled={subLoading}>
                      {subLoading ? "Submitting..." : "Submit Completed Work"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Client Action Box */}
            {isClient && project.status === "SUBMITTED" && (
              <div className="card" style={{ marginBottom: 32, borderColor: "var(--brand-primary)" }}>
                <div className="card-body">
                  <h3 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 12 }}>Review Submitted Work</h3>
                  <p style={{ color: "var(--gray-600)", marginBottom: 16 }}>
                    The hired freelancer has submitted work for your review. Accept to complete project or request revisions.
                  </p>

                  <div className="form-group">
                    <label className="form-label">Revision Feedback (if requesting changes)</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="Specify requested changes..."
                      value={revFeedback}
                      onChange={(e) => setRevFeedback(e.target.value)}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <button className="btn btn-success" onClick={() => handleClientAction("ACCEPT")} disabled={revLoading}>
                      ✓ Accept Work & Complete Project
                    </button>
                    <button className="btn btn-danger" onClick={() => handleClientAction("REVISION")} disabled={revLoading}>
                      ↺ Request Revisions
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Review Form (Completed Project) */}
            {user && (isClient || isAssignedFreelancer) && project.status === "COMPLETED" && (
              <div className="card" style={{ marginBottom: 32 }}>
                <div className="card-body">
                  <h3 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: 16 }}>Leave a Review</h3>
                  <form onSubmit={handleReviewSubmit}>
                    <div className="form-group">
                      <label className="form-label">Rating (1 to 5 Stars)</label>
                      <select className="form-select" value={rating} onChange={(e) => setRating(e.target.value)}>
                        <option value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                        <option value="4">⭐⭐⭐⭐ (4 - Very Good)</option>
                        <option value="3">⭐⭐⭐ (3 - Average)</option>
                        <option value="2">⭐⭐ (2 - Below Average)</option>
                        <option value="1">⭐ (1 - Poor)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Comment</label>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        placeholder="Share your experience working on this project..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={reviewLoading}>
                      Submit Review
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Client Info */}
          <div>
            <div className="card">
              <div className="card-body">
                <h4 style={{ fontWeight: 800, fontSize: "1rem", marginBottom: 16 }}>About Client</h4>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div className="navbar-avatar">
                    {project.client_name?.[0]?.toUpperCase() || "C"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{project.client_name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>⭐ {project.client_rating || 0} rating</div>
                  </div>
                </div>

                <Link to={`/users/${project.client_id}`} className="btn btn-outline btn-sm btn-full" style={{ marginBottom: 12 }}>
                  View Client Profile 👤
                </Link>

                {user && !isClient && (
                  <Link to={`/messages?userId=${project.client_id}`} className="btn btn-primary btn-sm btn-full" style={{ marginBottom: 12 }}>
                    💬 Message Client
                  </Link>
                )}

                {isClient && (
                  <Link to="/freelance/my-projects" className="btn btn-primary btn-sm btn-full">
                    Manage Proposals ({project.proposals_count})
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
