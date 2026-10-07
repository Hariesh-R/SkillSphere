/**
 * src/context/SocketContext.jsx
 * Socket.IO connection manager for real-time messaging & live notifications
 */

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect socket with JWT auth
    const s = io("/", {
      auth: { token },
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      console.log("[Socket] Connected to server");
    });

    s.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    s.on("disconnect", () => {
      console.log("[Socket] Disconnected from server");
    });

    s.on("notification", () => {
      setUnreadNotifCount((prev) => prev + 1);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, unreadNotifCount, setUnreadNotifCount }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext) || {};
}
