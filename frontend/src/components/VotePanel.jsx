import { useGameStore } from "../store/useGameStore";
import { useSocket } from "../socket/useSocket";
import { useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme";

export default function VotePanel() {
  const socket = useSocket();
  const { players, player, roomCode } = useGameStore();
  const { css, emojis } = useTheme();
  const [votes, setVotes] = useState({});

  // Calcular votos cuando cambian los jugadores
  useEffect(() => {
    // Contar votos actuales
    const voteCount = {};
    if (players && Array.isArray(players)) {
      players.forEach(p => {
        if (p.hasVoted && p.votedFor) {
          voteCount[p.votedFor] = (voteCount[p.votedFor] || 0) + 1;
        }
      });
    }
    setVotes(voteCount);
  }, [players]);

  function vote(votedPlayerId) {
    console.log("🗳️ Votando por:", votedPlayerId);
    socket.emit("vote", { roomCode, votedPlayerId });
  }

  const availablePlayers = players && Array.isArray(players) 
    ? players.filter((p) => p.alive && p.playerId !== player?.playerId)
    : [];
  const alivePlayers = players && Array.isArray(players) 
    ? players.filter(p => p.alive)
    : [];
  const votedCount = players && Array.isArray(players) 
    ? players.filter(p => p.alive && p.hasVoted).length
    : 0;

  return (
    <div className={`p-4 ${css.card} rounded-lg border ${css.border}`}>
      <h3 className={`font-semibold mb-3 ${css.text}`}>{emojis.vote} Votar</h3>
      
      {/* Progreso de votación */}
      <div className="mb-4 text-sm">
        <p className={`${css.text} opacity-70`}>
          {votedCount}/{alivePlayers.length} han votado
        </p>
        <div className={`w-full ${css.background} rounded-full h-1.5 mt-1`}>
          <div 
            className={`${css.primary} h-1.5 rounded-full transition-all`}
            style={{ width: `${(votedCount / alivePlayers.length) * 100}%` }}
          />
        </div>
      </div>

      {player?.hasVoted ? (
        <p className={`text-green-600 mb-3 text-sm font-medium`}>✅ Ya has votado</p>
      ) : availablePlayers.length === 0 ? (
        <p className={`${css.text} opacity-60 text-sm`}>No hay jugadores disponibles</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {availablePlayers.map((p) => (
            <button
              key={p.playerId}
              className={`p-2 rounded font-medium transition ${css.primary} ${css.primaryHover} ${css.text} border ${css.border} relative`}
              onClick={() => vote(p.playerId)}
              disabled={player?.hasVoted}
            >
              <span>{p.name}</span>
              {votes[p.playerId] && (
                <span className={`absolute -top-1 -right-1 ${css.accent} text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-xs`}>
                  {votes[p.playerId]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lista de quién ya votó */}
      {votedCount > 0 && (
        <div className="mt-4 text-sm">
          <p className={`${css.text} opacity-70 mb-2`}>Han votado:</p>
          <div className="flex flex-wrap gap-1">
            {players && Array.isArray(players) && players.filter(p => p.alive && p.hasVoted).map(p => (
              <span key={p.playerId} className={`${css.background} px-2 py-1 rounded text-xs ${css.text} opacity-80`}>
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

