import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/useGameStore";
import PlayerList from "../components/PlayerList";
import Rules from "../components/Rules";
import { useSocket } from "../socket/useSocket";
import { useTheme } from "../hooks/useTheme";

export default function Lobby() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { css, emojis } = useTheme();

  const { roomCode, player, setPlayers, setPlayer, players } = useGameStore();
  const [hasJoined, setHasJoined] = useState(false);
  const [numImpostors, setNumImpostors] = useState(1);

  // Calcular opciones válidas de impostores según el número de jugadores
  const getValidImpostorOptions = () => {
    const totalPlayers = players ? players.length : 0;
    const maxImpostors = Math.max(1, Math.floor((totalPlayers - 1) / 2)); // Máximo: mitad - 1
    const options = [];
    
    for (let i = 1; i <= Math.min(3, maxImpostors); i++) {
      options.push(i);
    }
    
    return options;
  };

  // ==============================
  // 🔹 Proteger Lobby: solo si hay roomCode y player.name
  // ==============================
  useEffect(() => {
    if (!roomCode || !player?.name) {
      navigate("/");
    }
  }, [roomCode, player?.name, navigate]);

  // ==============================
  // 🔹 Listener de update_players
  // ==============================
  useEffect(() => {
    if (!socket) return;

    const handleUpdatePlayers = (updatedPlayers) => {
      console.log("👥 Lobby recibió update_players:", updatedPlayers);
      setPlayers(updatedPlayers);

      // 🔥 Buscarme por socketId (más seguro que por nombre)
      const me = updatedPlayers.find((p) => p.socketId === socket.id);
      
      console.log("👤 Jugador encontrado en update_players:", me);

      if (me) {
        // Usar getState para obtener el estado actual y evitar race conditions
        const currentState = useGameStore.getState();
        
        setPlayer({
          ...currentState.player,
          playerId: me.playerId,
          isHost: me.isHost,
          // Mantener el nombre del estado actual o del backend
          name: currentState.player.name || me.name,
        });
      }
    };

    socket.on("update_players", handleUpdatePlayers);

    // Debug conexión
    socket.on("connect", () => {
      console.log("🟢 Conectado al servidor:", socket.id);
    });

    return () => {
      socket.off("update_players", handleUpdatePlayers);
    };
  }, [socket, setPlayers]); // Removido setPlayer para evitar bucle

  // ==============================
  // 🔹 Emitir join_room (solo una vez)
  // ==============================
  useEffect(() => {
    if (!socket) return;
    if (!roomCode || !player?.name) return;
    if (hasJoined) return; // Evitar múltiples emisiones

    console.log("🟡 Emitiendo join_room con:", { roomCode, playerName: player.name });

    socket.emit("join_room", {
      roomCode,
      playerName: player.name,
    });
    
    setHasJoined(true);
  }, [socket, roomCode, hasJoined]);

  // ==============================
  // 🔹 Iniciar juego (solo host)
  // ==============================
  function handleStart() {
    if (!socket) return;

    // Validar que haya suficientes jugadores
    const totalPlayers = players ? players.length : 0;
    const minPlayersNeeded = numImpostors + 2; // Al menos 2 civiles + impostores
    
    if (totalPlayers < minPlayersNeeded) {
      alert(`Se necesitan al menos ${minPlayersNeeded} jugadores para ${numImpostors} impostor${numImpostors === 1 ? '' : 'es'}. Actualmente hay ${totalPlayers} jugadores.`);
      return;
    }

    socket.emit("start_game", {
      roomCode,
      numImpostors,
    });
  }

  // ==============================
  // 🔹 UI
  // ==============================
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${css.background}`}>
      <div className={`w-full max-w-xl p-8 ${css.card} border-2 ${css.border} rounded-xl shadow-lg`}>
        <h2 className={`text-2xl font-bold mb-4 ${css.text}`}>
          {emojis.host} Sala: {roomCode}
        </h2>

        <PlayerList />

        {/* Selector de impostores (solo host) */}
        {player?.isHost && (
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${css.text}`}>
              Número de Impostores:
            </label>
            <div className="flex gap-2">
              {getValidImpostorOptions().map(option => (
                <button
                  key={option}
                  onClick={() => setNumImpostors(option)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    numImpostors === option
                      ? `${css.primary} ${css.text}`
                      : `${css.background} ${css.text} border ${css.border} hover:opacity-80`
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {players && players.length < 3 && (
              <p className={`text-xs mt-2 ${css.text} opacity-75`}>
                Se necesitan al menos 3 jugadores para iniciar
              </p>
            )}
            {players && players.length < numImpostors + 2 && (
              <p className={`text-xs mt-2 ${css.text} opacity-75`}>
                Se necesitan {numImpostors + 2} jugadores para {numImpostors} impostor{numImpostors === 1 ? '' : 'es'}
              </p>
            )}
          </div>
        )}

        {player?.isHost && (
          <button
            className={`w-full mt-6 p-3 rounded-lg font-bold ${css.primary} ${css.primaryHover} ${css.text} transition transform hover:scale-105`}
            onClick={handleStart}
          >
            {emojis.create} Iniciar Juego ({numImpostors} {numImpostors === 1 ? 'Impostor' : 'Impostores'})
          </button>
        )}
      </div>
      
      <Rules />
    </div>
  );
}







