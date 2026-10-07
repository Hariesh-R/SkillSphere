// src/pages/MessagingInbox.jsx
import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function MessagingInbox() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch conversation list
  const fetchConversations = () => {
    setLoadingConv(true);
    api.get("/messaging/conversations")
      .then(({ data }) => {
        setConversations(data.data.conversations);
        if (data.data.conversations.length > 0 && !activeConv) {
          handleSelectConv(data.data.conversations[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingConv(false));
  };

  useEffect(() => {
    fetchConversations();
  }, []);

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

    api.get(`/messaging/conversations/${conv.id}/messages`)
      .then(({ data }) => {
        setMessages(data.data.messages);
        setTimeout(scrollToBottom, 100);
      })
      .catch(() => {})
      .finally(() => setLoadingMsg(false));
  };

  // Socket listener for live incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (activeConv && msg.conversation_id === activeConv.id) {
        setMessages((prev) => [...prev, msg]);
        setTimeout(scrollToBottom, 100);
      }
      // Refresh conversation list to update last message
      fetchConversations();
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
        text: content
      });

      // Optimistic append if not already handled by socket
      setMessages((prev) => {
        if (prev.some(m => m.id === data.data.message.id)) return prev;
        return [...prev, data.data.message];
      });
      setTimeout(scrollToBottom, 100);
      fetchConversations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send message.");
    }
  };

  const getOtherParticipant = (conv) => {
    return conv.participants?.find((p) => p.id !== user.id) || { name: conv.title || "User" };
  };

  return (
    <div style={{ minHeight: "calc(100vh - var(--nav-height))", background: "var(--gray-50)", padding: "20px 0 40px" }}>
      <div className="container">
        <h1 className="page-title mb-4" style={{ fontSize: "1.5rem" }}>Messages & Communications</h1>

        <div className="messaging-container">
          {/* Sidebar */}
          <div className="conv-sidebar">
            <div className="conv-sidebar-header">
              Conversations ({conversations.length})
            </div>
            <div className="conv-list">
              {loadingConv ? (
                <div style={{ padding: 20, textAlign: "center" }}>Loading chats...</div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "var(--gray-500)" }}>
                  No active conversations yet.
                </div>
              ) : (
                conversations.map((conv) => {
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
                          <strong style={{ fontSize: "0.9rem", color: "var(--gray-900)" }}>{other.name}</strong>
                          {conv.unread_count > 0 && <span className="nav-badge">{conv.unread_count}</span>}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                  <div>
                    <strong style={{ fontSize: "1rem" }}>{getOtherParticipant(activeConv).name}</strong>
                    <div style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>{activeConv.title || "Direct Message"}</div>
                  </div>
                </div>

                <div className="chat-messages">
                  {loadingMsg ? (
                    <div style={{ textAlign: "center", padding: 20 }}>Loading history...</div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}>
                      Start the conversation by sending a message below!
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === user.id;
                      return (
                        <div key={m.id} className={`chat-bubble ${isMe ? "sent" : "received"}`}>
                          {!isMe && <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: 2 }}>{m.sender_name}</div>}
                          <div>{m.text}</div>
                          <div style={{ fontSize: "0.65rem", opacity: 0.7, textAlign: "right", marginTop: 4 }}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-row" onSubmit={handleSendMessage}>
                  <input
                    className="form-input"
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary">
                    Send 🚀
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--gray-400)" }}>
                Select a conversation to start chatting.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
