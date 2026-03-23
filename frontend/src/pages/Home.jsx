import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, connectRoom } from "../api/rooms";
import { useSocket } from "../socket/useSocket";
import { useGameStore } from "../store/useGameStore";
import { useTheme } from "../hooks/useTheme";

export default function Home() {
  const navigate = useNavigate();
  const socket = useSocket();
  const setPlayer = useGameStore((s) => s.setPlayer);
  const setRoom = useGameStore((s) => s.setRoom);
  const { css, emojis } = useTheme();

  const [mode, setMode] = useState("virtual");
  const [theme, setTheme] = useState("unisex");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  async function handleCreate() {
    if (!name.trim()) {
      alert("Por favor ingresa tu nombre");
      return;
    }

    const res = await createRoom({
      host_name: name,
      mode,
      theme,
    });

    if (!res.success) {
      alert(res.error || "Error al crear la sala");
      return;
    }

    console.log("🏠 Sala creada exitosamente:", res);
    console.log("🏠 Guardando en store:", { roomCode: res.code, mode, theme });

    setRoom({ roomCode: res.code, mode, theme });
    setPlayer({ playerId: null, name, isHost: true });
    navigate("/lobby");
  }

  async function handleJoin() {
    if (!name.trim() || !roomCode.trim()) {
      alert("Por favor ingresa tu nombre y el código de sala");
      return;
    }

    console.log("🔗 Enviando petición de unirse:", { playerName: name, roomCode });

    const res = await connectRoom(roomCode);

    if (!res.success) {
      alert(res.error || "Error al unirse a la sala");
      return;
    }

    console.log("🔗 Unirse a sala exitoso:", res);
    console.log("🏠 Guardando en store:", { roomCode: res.code, mode: res.mode, theme: res.theme });

    setRoom({ roomCode: res.code, mode: res.mode, theme: res.theme });
    setPlayer({ playerId: null, name, isHost: false });
    navigate("/lobby");
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${css.background}`}>
      <div className={`max-w-md w-full p-8 ${css.card} border-2 ${css.border} rounded-xl shadow-lg`}>
        <h1 className={`text-4xl font-bold text-center mb-8 ${css.text}`}>
        Impostor Game
        </h1>

        <div className="space-y-6">
          <div>
            <label className={`block mb-2 ${css.text}`}>Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-3 rounded-lg ${css.background} ${css.border} ${css.text} border-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className={`block mb-2 ${css.text}`}>Modo de juego</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className={`w-full p-3 rounded-lg ${css.background} ${css.border} ${css.text} border-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="virtual">Virtual</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>

          <div>
            <label className={`block mb-2 ${css.text}`}>Tema</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className={`w-full p-3 rounded-lg ${css.background} ${css.border} ${css.text} border-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="female">{emojis.female} Femenino</option>
              <option value="male">{emojis.male} Masculino</option>
              <option value="unisex">{emojis.unisex} Unisex</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleCreate}
              className={`flex-1 p-4 rounded-lg font-bold ${css.primary} ${css.primaryHover} ${css.text} transition transform hover:scale-105`}
            >
              {emojis.create} Crear Sala
            </button>
          </div>

          <div>
            <label className={`block mb-2 ${css.text}`}>Código de Sala</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className={`w-full p-3 rounded-lg ${css.background} ${css.border} ${css.text} border-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              maxLength={6}
              placeholder="Código de 6 letras"
            />
          </div>

          <button
            onClick={handleJoin}
            className={`w-full p-4 rounded-lg font-bold ${css.secondary} ${css.secondaryHover} ${css.text} transition transform hover:scale-105`}
          >
            {emojis.join} Unirse a Sala
          </button>
        </div>
      </div>
    </div>
  );
}
