// src/pages/MessagingInbox.jsx
import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function MessagingInbox() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId") || searchParams.get("user");

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);

  // New Chat modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userList, setUserList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [startingChatUserId, setStartingChatUserId] = useState(null);

  // Sidebar search filter
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper to get the other participant in a conversation
  const getOtherParticipant = (conv) => {
    if (!conv) return { name: "User" };
    const other = conv.participants?.find((p) => p.id !== user?.id);
    return other || { name: conv.title || "User" };
  };

  // Fetch conversation list
  const fetchConversations = async (autoSelectId = null) => {
    setLoadingConv(true);
    try {
      const { data } = await api.get("/messaging/conversations");
      const list = data.data.conversations || [];
      setConversations(list);

      if (autoSelectId) {
        const found = list.find((c) => c.id === autoSelectId);
        if (found) {
          handleSelectConv(found);
          return;
        }
      }

      if (list.length > 0 && !activeConv) {
        handleSelectConv(list[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoadingConv(false);
    }
  };

  // Start or open direct conversation with a specific user
  const handleStartDirectChat = async (targetId) => {
    if (!targetId || targetId === user?.id) return;
    setStartingChatUserId(targetId);
    try {
      const { data } = await api.post("/messaging/conversations/direct", {
        target_user_id: targetId,
      });
      const convId = data.data.conversation_id;

      // Re-fetch conversation list and select this conversation
      const convRes = await api.get("/messaging/conversations");
      const list = convRes.data.data.conversations || [];
      setConversations(list);

      const targetConv = list.find((c) => c.id === convId);
      if (targetConv) {
        handleSelectConv(targetConv);
      }
      setShowNewChatModal(false);
      setSearchParams({});
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start direct conversation.");
    } finally {
      setStartingChatUserId(null);
    }
  };

  // On mount or when query param changes, handle target user
  useEffect(() => {
    if (targetUserId) {
      handleStartDirectChat(targetUserId);
    } else {
      fetchConversations();
    }
  }, [targetUserId]);

  // Fetch community users when New Chat Modal is opened or query typed
  useEffect(() => {
    if (!showNewChatModal) return;
    const timer = setTimeout(() => {
      setLoadingUsers(true);
      api
        .get(`/users${userSearch.trim() ? `?search=${encodeURIComponent(userSearch.trim())}` : ""}`)
        .then(({ data }) => {
          setUserList(data.data?.users || []);
        })
        .catch(() => setUserList([]))
        .finally(() => setLoadingUsers(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [showNewChatModal, userSearch]);

  // Handle active conversation selection
  const handleSelectConv = (conv) => {
    if (activeConv && socket) {
      socket.emit("leave_conversation", activeConv.id);
    }
    setActiveConv(conv);
    setLoadingMsg(true);

    if (socket) {
      socket.emit("join_conversation", conv.id);
    }

    // Mark as read
    api.patch(`/messaging/conversations/${conv.id}/read`).catch(() => {});

    api
      .get(`/messaging/conversations/${conv.id}/messages`)
      .then(({ data }) => {
        setMessages(data.data.messages || []);
        setTimeout(scrollToBottom, 100);
        setTimeout(() => inputRef.current?.focus(), 150);
      })
      .catch(() => {})
      .finally(() => setLoadingMsg(false));
  };

  // Socket listener for live incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (activeConv && msg.conversation_id === activeConv.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 100);
      }
      // Refresh conversation list to update last message preview
      api.get("/messaging/conversations").then(({ data }) => {
        setConversations(data.data.conversations || []);
      }).catch(() => {});
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, activeConv]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv) return;

    const content = text;
    setText("");

    try {
      const { data } = await api.post(`/messaging/conversations/${activeConv.id}/messages`, {
        text: content,
      });

      // Optimistic append if not already handled by socket
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.data.message.id)) return prev;
        return [...prev, data.data.message];
      });
      setTimeout(scrollToBottom, 100);

      // Refresh conversations list to update preview and last message timestamp
      api.get("/messaging/conversations").then(({ data: cData }) => {
        setConversations(cData.data.conversations || []);
      }).catch(() => {});
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send message.");
    }
  };

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const other = getOtherParticipant(conv);
    return (
      other.name?.toLowerCase().includes(q) ||
      conv.title?.toLowerCase().includes(q) ||
      conv.last_message?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "20px 0 40px" }}>
      <div className="container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 className="page-title" style={{ fontSize: "1.5rem", margin: 0 }}>
            Messages & Communications
          </h1>
          <button
            id="btn-new-chat-top"
            className="btn btn-primary"
            onClick={() => { setShowNewChatModal(true); setUserSearch(""); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", fontSize: "0.9rem" }}
          >
            <span>✏️</span> New Chat
          </button>
        </div>

        <div className="messaging-container">
          {/* Sidebar */}
          <div className="conv-sidebar">
            <div className="conv-sidebar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span>Conversations</span>
                <span style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginLeft: 6, fontWeight: 500 }}>
                  ({conversations.length})
                </span>
              </div>
              <button
                id="btn-sidebar-new-chat"
                className="btn btn-primary btn-sm"
                onClick={() => { setShowNewChatModal(true); setUserSearch(""); }}
                style={{ padding: "4px 10px", fontSize: "0.78rem", borderRadius: "var(--radius-full)" }}
              >
                + New
              </button>
            </div>

            {/* Search filter in sidebar */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--gray-200)", background: "#fff" }}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: "6px 12px 6px 32px", fontSize: "0.85rem", height: 36, borderRadius: "var(--radius-full)" }}
                />
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem", opacity: 0.5 }}>
                  🔍
                </span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "var(--gray-400)", fontSize: "0.8rem" }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Conversation List */}
            <div className="conv-list">
              {loadingConv ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--gray-500)" }}>
                  Loading chats...
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: "36px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: "2.2rem", marginBottom: 12 }}>💬</div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--gray-800)" }}>
                    No active conversations yet
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginTop: 6, marginBottom: 18, lineHeight: 1.5 }}>
                    Connect and chat with workshop mentors, student peers, or freelance clients.
                  </p>
                  <button
                    id="btn-sidebar-start-chat-empty"
                    className="btn btn-primary btn-sm"
                    onClick={() => { setShowNewChatModal(true); setUserSearch(""); }}
                    style={{ borderRadius: "var(--radius-full)", padding: "8px 16px" }}
                  >
                    + Start a Conversation
                  </button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--gray-500)", fontSize: "0.85rem" }}>
                  No conversations match "{searchQuery}".
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const isSelected = activeConv?.id === conv.id;
                  return (
                    <div
                      key={conv.id}
                      className={`conv-item ${isSelected ? "active" : ""}`}
                      onClick={() => handleSelectConv(conv)}
                    >
                      <div className="navbar-avatar">
                        {other.name?.[0]?.toUpperCase() || "C"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "0.9rem", color: "var(--gray-900)" }}>
                            {other.name}
                          </strong>
                          {conv.unread_count > 0 && <span className="nav-badge">{conv.unread_count}</span>}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                          {conv.last_message || conv.title || "No messages yet"}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Pane */}
          <div className="chat-pane">
            {activeConv ? (
              <>
                <div className="chat-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="navbar-avatar">
                      {getOtherParticipant(activeConv).name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <strong style={{ fontSize: "1rem" }}>{getOtherParticipant(activeConv).name}</strong>
                        {getOtherParticipant(activeConv).role && (
                          <span
                            className={`badge ${getOtherParticipant(activeConv).role === "instructor" ? "badge-primary" : "badge-secondary"}`}
                            style={{ fontSize: "0.68rem", padding: "1px 6px" }}
                          >
                            {getOtherParticipant(activeConv).role}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>
                        {activeConv.type === "direct" ? "Direct Message" : activeConv.title || "Project Conversation"}
                      </div>
                    </div>
                  </div>

                  {getOtherParticipant(activeConv).id && (
                    <Link
                      to={`/users/${getOtherParticipant(activeConv).id}`}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: "0.78rem", padding: "4px 12px" }}
                    >
                      View Profile 👤
                    </Link>
                  )}
                </div>

                <div className="chat-messages">
                  {loadingMsg ? (
                    <div style={{ textAlign: "center", padding: 24, color: "var(--gray-500)" }}>
                      Loading message history...
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--gray-400)" }}>
                      <div style={{ fontSize: "2rem", marginBottom: 8 }}>👋</div>
                      <strong style={{ display: "block", color: "var(--gray-700)", marginBottom: 4 }}>
                        Say hello to {getOtherParticipant(activeConv).name}!
                      </strong>
                      <span style={{ fontSize: "0.85rem" }}>
                        Type a message below to start this conversation.
                      </span>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === user?.id;
                      return (
                        <div key={m.id} className={`chat-bubble ${isMe ? "sent" : "received"}`}>
                          {!isMe && (
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: 2 }}>
                              {m.sender_name}
                            </div>
                          )}
                          <div>{m.text}</div>
                          <div style={{ fontSize: "0.65rem", opacity: 0.75, textAlign: "right", marginTop: 4 }}>
                            {m.created_at
                              ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : ""}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-row" onSubmit={handleSendMessage}>
                  <input
                    ref={inputRef}
                    className="form-input"
                    placeholder={`Message ${getOtherParticipant(activeConv).name}...`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    style={{ borderRadius: "var(--radius-full)" }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ borderRadius: "var(--radius-full)", padding: "0 22px" }}>
                    Send 🚀
                  </button>
                </form>
              </>
            ) : (
              <div className="chat-empty-hero">
                <div className="chat-empty-icon">💬</div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--gray-900)", marginBottom: 8, fontFamily: "var(--font-display)" }}>
                  SkillSphere Messages & Chat
                </h2>
                <p style={{ color: "var(--gray-500)", maxWidth: 440, fontSize: "0.92rem", lineHeight: 1.6, marginBottom: 24 }}>
                  Connect and collaborate directly with workshop mentors, project partners, and freelance clients across our community.
                </p>
                <button
                  id="btn-start-chat-main-pane"
                  className="btn btn-primary btn-lg"
                  onClick={() => { setShowNewChatModal(true); setUserSearch(""); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: "var(--radius-full)", padding: "12px 28px" }}
                >
                  <span>✏️</span> Start a Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Start New Chat Modal ────────────────────────────────────── */}
      {showNewChatModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowNewChatModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div className="modal-title">Start a Conversation</div>
              <button className="modal-close" onClick={() => setShowNewChatModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ padding: 22 }}>
              {/* Search Input */}
              <div style={{ position: "relative", marginBottom: 18 }}>
                <input
                  id="input-user-search"
                  type="text"
                  className="form-input"
                  placeholder="Search community by name, email, or skill..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  autoFocus
                  style={{ paddingLeft: 38, height: 44, borderRadius: "var(--radius-full)" }}
                />
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "0.95rem", opacity: 0.5 }}>
                  🔍
                </span>
                {userSearch && (
                  <button
                    onClick={() => setUserSearch("")}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "var(--gray-400)", fontSize: "0.9rem" }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Members List */}
              <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4 }}>
                {loadingUsers ? (
                  <div style={{ textAlign: "center", padding: 36, color: "var(--gray-500)" }}>
                    Searching members...
                  </div>
                ) : userList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 36, color: "var(--gray-400)" }}>
                    No members found{userSearch ? ` matching "${userSearch}"` : ""}.
                  </div>
                ) : (
                  userList.map((u) => {
                    let skillsArray = [];
                    if (u.skills) {
                      try {
                        skillsArray = typeof u.skills === "string" && u.skills.startsWith("[")
                          ? JSON.parse(u.skills)
                          : u.skills.split(",");
                      } catch {
                        skillsArray = [u.skills];
                      }
                    }

                    return (
                      <div
                        key={u.id}
                        className="user-search-item"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          borderRadius: "var(--radius-md)",
                          background: "#fff",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                          <div className="navbar-avatar" style={{ width: 42, height: 42, fontSize: "1rem", flexShrink: 0 }}>
                            {u.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <strong style={{ fontSize: "0.92rem", color: "var(--gray-900)" }}>{u.name}</strong>
                              <span
                                className={`badge ${u.role === "instructor" ? "badge-primary" : "badge-secondary"}`}
                                style={{ fontSize: "0.68rem", padding: "1px 6px" }}
                              >
                                {u.role}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "var(--gray-500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                              {u.expertise || u.bio || u.email}
                            </div>
                            {skillsArray.length > 0 && (
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                                {skillsArray.slice(0, 3).map((sk, idx) => (
                                  <span key={idx} className="chip" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>
                                    {typeof sk === "string" ? sk.trim() : sk}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          className="btn btn-primary btn-sm"
                          disabled={startingChatUserId === u.id}
                          onClick={() => handleStartDirectChat(u.id)}
                          style={{ flexShrink: 0, marginLeft: 12, padding: "6px 14px", borderRadius: "var(--radius-full)" }}
                        >
                          {startingChatUserId === u.id ? "Connecting..." : "Chat 💬"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>
                {userList.length} member{userList.length === 1 ? "" : "s"} available
              </span>
              <button className="btn btn-outline btn-sm" onClick={() => setShowNewChatModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
