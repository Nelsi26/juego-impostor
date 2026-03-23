import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useGameStore } from "../store/useGameStore";
import { setupSocketListeners } from "./socket";

const SocketContext = createContext(null);

export { SocketContext };

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  const {
    roomCode,
    player,
    phase,
    setPhase,
  } = useGameStore();

  useEffect(() => {
    // 🔹 Crear socket con configuración mejorada
    const s = io("http://localhost:3000", {
      transports: ["websocket", "polling"], // fallback a polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: false, // reutilizar conexión existente
    });

    // 🔹 Setup listeners generales ANTES de conectar
    setupSocketListeners(s);

    // 🔹 Cuando se conecta
    s.on("connect", () => {
      console.log("🟢 Socket conectado:", s.id);
      setSocket(s);

      // 🔹 Si ya estaba en sala, sincronizar estado
      if (roomCode && player?.name) {
        s.emit("sync_state", {
          roomCode,
          playerName: player.name,
        });
      }
    });

    // 🔹 Cuando se desconecta
    s.on("disconnect", (reason) => {
      console.log("⚠️ Socket desconectado:", reason);
      setSocket(null);

      // Solo volver a home si no es una desconexión por reconexión
      if (reason !== "io client disconnect" && phase !== "home") {
        setPhase("home");
      }
    });

    // 🔹 Manejar errores de conexión
    s.on("connect_error", (error) => {
      console.error("❌ Error de conexión:", error.message);
    });

    // 🔹 Cleanup al desmontar
    return () => {
      s.removeAllListeners();
      s.disconnect();
    };
  }, []); // Sin dependencias para evitar reconexiones frecuentes

  // 🔹 Efecto separado para sincronización cuando cambia roomCode o player
  useEffect(() => {
    if (socket && socket.connected && roomCode && player?.name) {
      socket.emit("sync_state", {
        roomCode,
        playerName: player.name,
      });
    }
  }, [roomCode, player?.name]); // Removido socket de las dependencias

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
