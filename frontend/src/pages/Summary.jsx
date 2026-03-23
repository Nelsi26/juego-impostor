import { useGameStore } from "../store/useGameStore";
import { useSocket } from "../socket/useSocket";
import PlayerList from "../components/PlayerList";
import EliminationAnimation from "../components/EliminationAnimation";
import SuddenDeathAnimation from "../components/SuddenDeathAnimation";
import ChaosVictoryAnimation from "../components/ChaosVictoryAnimation";
import { useTheme } from "../hooks/useTheme";

export default function Summary() {
  console.log("🎯 SUMMARY COMPONENT - RENDERIZANDO");
  const socket = useSocket();
  const { eliminated, players, roomCode, player, phase } = useGameStore();
  const { css, emojis } = useTheme();

  console.log("🔍 Debug Summary:", { phase, player, isHost: player?.isHost, roomCode });

  // Determinar ganadores
  function getWinners() {
    if (!players || players.length === 0) return [];
    
    const alivePlayers = players.filter(p => p.alive);
    const impostors = alivePlayers.filter(p => p.role === 'impostor');
    const civils = alivePlayers.filter(p => p.role === 'civil');
    
    // Victoria del caos: 1v1 o sudden death
    if (alivePlayers.length === 2 && impostors.length === 1 && civils.length === 1) {
      return [...impostors, ...civils]; // Ambos ganan en el caos
    }
    
    if (eliminated && eliminated.byChaos && alivePlayers.length <= 1) {
      return alivePlayers; // Los sobrevivientes del caos
    }
    
    // Victoria normal
    if (impostors.length === 0) {
      return civils; // Victoria civil
    }
    
    if (impostors.length >= civils.length) {
      return impostors; // Victoria impostor
    }
    
    return []; // Sin ganadores definidos
  }

  const winners = getWinners();

  // Determinar tipo de victoria para el estilo
  function getWinnerType() {
    if (!winners || winners.length === 0) return null;
    
    const hasImpostor = winners.some(w => w.role === 'impostor');
    const hasCivil = winners.some(w => w.role === 'civil');
    
    if (hasImpostor && hasCivil) {
      return { text: "El Caos", color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500" };
    }
    
    if (hasImpostor) {
      return { text: "Impostores", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500" };
    }
    
    return { text: "Civiles", color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500" };
  }

  const winnerType = getWinnerType();

  function handleNextRound() {
    console.log("🔄 Iniciando siguiente ronda:", { roomCode, player, isHost: player?.isHost });
    
    if (!player?.isHost) {
      console.log("❌ Solo el host puede iniciar la siguiente ronda");
      alert('Solo el host puede iniciar la siguiente ronda');
      return;
    }
    
    console.log("🔄 Enviando next_round:", { roomCode, numImpostors: 1 });
    socket.emit("next_round", {
      roomCode,
      numImpostors: 1,
    });
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${css.background} ${css.text}`}>
      {/* Animaciones superpuestas */}
      <EliminationAnimation />
      <SuddenDeathAnimation />
      <ChaosVictoryAnimation />
      
      <div className="w-full max-w-4xl p-8 bg-white/10 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center">Resumen de Ronda</h2>

        {/* Ganadores de la ronda */}
        {winners && winners.length > 0 && winnerType && (
          <div className={`mb-6 p-6 rounded-lg ${winnerType.bg} border-2 ${winnerType.border}`}>
            <p className="text-2xl mb-3">
              Ganador: <span className={`font-bold ${winnerType.color}`}>{winnerType.text}</span>
            </p>
          </div>
        )}

        {/* Jugador eliminado */}
        {eliminated && (
          <div className="mb-6 p-6 bg-red-900/30 rounded-lg border-2 border-red-500">
            <h3 className="text-xl font-bold mb-3 text-red-300">Jugador Eliminado</h3>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-white">{eliminated.name}</span>
                <div className="flex items-center mt-2 space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    eliminated.role === 'impostor' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-blue-600 text-white'
                  }`}>
                    {eliminated.role === 'impostor' ? '👹 IMPOSTOR' : '👤 CIVIL'}
                  </span>
                  <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">
                    {eliminated.alive ? '🟢 Vivo' : '💀 Muerto'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista detallada de jugadores */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold mb-4 text-center">Estado de Todos los Jugadores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players && players.length > 0 ? (
              players.map((p) => (
                <div 
                  key={p.playerId}
                  className={`p-4 rounded-lg border-2 ${
                    !p.alive 
                      ? 'bg-gray-800 border-gray-600 opacity-75' 
                      : p.role === 'impostor'
                        ? 'bg-red-900/30 border-red-600'
                        : 'bg-blue-900/30 border-blue-600'
                  }`}
                >
                <div className="space-y-2">
                  {/* Nombre y estado */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">{p.name}</span>
                    <div className="flex items-center space-x-2">
                      {p.isHost && (
                        <span className="px-2 py-1 bg-yellow-600 rounded-full text-xs">👑 HOST</span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        p.role === 'impostor' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-blue-600 text-white'
                      }`}>
                        {p.role === 'impostor' ? '👹' : '👤'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        p.alive 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-600 text-white'
                      }`}>
                        {p.alive ? '🟢' : '💀'}
                      </span>
                    </div>
                  </div>

                  {/* Rol */}
                  <div className="text-sm">
                    <span className="text-gray-400">Rol: </span>
                    <span className={`font-bold ${
                      p.role === 'impostor' ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {p.role === 'impostor' ? 'IMPOSTOR' : 'CIVIL'}
                    </span>
                  </div>

                  {/* Palabra (solo para civiles) */}
                  {p.role === 'civil' && (
                    <div className="text-sm">
                      <span className="text-gray-400">Palabra: </span>
                      <span className="font-mono bg-gray-700 px-2 py-1 rounded text-green-400">
                        {p.word || '???'}
                      </span>
                    </div>
                  )}

                  {/* Estado de voto */}
                  {p.hasVoted && (
                    <div className="text-xs text-yellow-400">
                      ✅ Ya votó esta ronda
                    </div>
                  )}
                </div>
              </div>
            ))) : (
              <div className="col-span-full text-center py-8">
                <p className={`${css.text} opacity-75`}>
                  {players ? 'No hay jugadores en esta partida' : 'Cargando jugadores...'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Botones de control */}
        <div className="mt-8 text-center space-y-3">
          <button
            className={`px-4 py-2 ${css.primary} ${css.primaryHover} ${css.text} rounded-lg font-bold text-sm transition transform hover:scale-105 shadow-lg ${
              !player?.isHost ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
            }`}
            onClick={() => {
              console.log("🔍 Click en siguiente ronda:", { player, roomCode });
              handleNextRound();
            }}
            disabled={!player?.isHost}
          >
            Siguiente Ronda {player?.isHost ? '' : '(Solo Host)'}
          </button>
          
          <button
            className={`px-4 py-2 ${css.secondary} ${css.secondaryHover} ${css.text} text-sm font-medium rounded-lg transition transform hover:scale-105 shadow-lg ${
              !player?.isHost ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
            }`}
            onClick={() => {
              console.log("🔍 Click en terminar juego:", { player, roomCode });
              if (!player?.isHost) {
                alert('Solo el host puede terminar el juego');
                return;
              }
              if (confirm('¿Estás seguro de que quieres terminar el juego?')) {
                socket.emit('end_game', { roomCode });
              }
            }}
            disabled={!player?.isHost}
          >
            Terminar Juego {player?.isHost ? '' : '(Solo Host)'}
          </button>
        </div>
      </div>
    </div>
  );
}


