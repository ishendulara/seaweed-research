import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5001";

let socket;

export function getSocket() {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"]
  });
  return socket;
}

export { SOCKET_URL };
