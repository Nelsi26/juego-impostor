import { useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { useSocket } from "../socket/useSocket";
import { useTheme } from "../hooks/useTheme";

export default function Chat() {
  const socket = useSocket();
  const { messages, roomCode } = useGameStore();
  const { css, emojis } = useTheme();
  const [msg, setMsg] = useState("");

  function send() {
    if (!msg.trim()) return;
    socket.emit("send_message", { roomCode, message: msg });
    setMsg("");
  }

  return (
    <div className={`p-4 ${css.card} rounded-lg border ${css.border}`}>
      <h3 className={`font-semibold mb-3 ${css.text}`}> Chat</h3>

      <div className={`h-40 overflow-y-auto ${css.background} rounded p-2 mb-3`}>
        {messages.map((m, i) => (
          <div key={i} className="mb-2">
            <span className={`font-bold ${css.text}`}>{m.playerName}: </span>
            <span className={`${css.text}`}>{m.message}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className={`flex-1 p-2 rounded ${css.background} border-2 border-black focus:outline-none focus:ring-2 focus:ring-black ${css.text}`}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escribe un mensaje..."
        />
        <button className={`p-2 rounded ${css.primary} ${css.primaryHover} ${css.text} font-medium`} onClick={send}>
          Enviar
        </button>
      </div>
    </div>
  );
}


