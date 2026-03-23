import { useState, useEffect } from 'react';
import { useSocket } from '../socket/useSocket';
import { useGameStore } from '../store/useGameStore';

export default function SuddenDeathAnimation() {
  const socket = useSocket();
  const { players, player, roomCode } = useGameStore();
  const [showSuddenDeath, setShowSuddenDeath] = useState(false);
  const [suddenDeathData, setSuddenDeathData] = useState(null);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    if (!socket) return; // Verificar que socket no sea null
    
    const handleSuddenDeath = (data) => {
      console.log('🔥 Sudden death recibido:', data);
      setSuddenDeathData(data);
      setShowSuddenDeath(true);
      setVoted(false); // Resetear voto al iniciar sudden death
    };

    socket.on('sudden_death_round', handleSuddenDeath);
    
    return () => {
      if (socket) {
        socket.off('sudden_death_round', handleSuddenDeath);
      }
    };
  }, [socket]);

  useEffect(() => {
    // Actualizar estado de voto cuando cambian los jugadores
    if (showSuddenDeath && player) {
      setVoted(player.hasVoted);
      
      // Si todos los sospechosos han votado, cerrar la animación
      const aliveSuspects = suddenDeathData?.suspects?.filter(s => s.alive) || [];
      const votedSuspects = aliveSuspects.filter(s => s.hasVoted);
      
      if (aliveSuspects.length > 0 && votedSuspects.length === aliveSuspects.length) {
        console.log("🗳️ Todos han votado en sudden death, cerrando animación");
        setTimeout(() => setShowSuddenDeath(false), 1000); // Pequeña pausa para ver el resultado
      }
    }
  }, [showSuddenDeath, player, suddenDeathData]);

  function vote(suspectId) {
    if (!socket) {
      console.log("❌ Socket no disponible para votar");
      return;
    }
    
    if (voted) {
      console.log("🗳️ Ya has votado en sudden death");
      return;
    }

    console.log("🗳️ Votando en sudden death por:", suspectId);
    socket.emit("vote", { roomCode, votedPlayerId: suspectId });
    setVoted(true);
  }

  // Filtrar sospechosos disponibles para votar
  const availableSuspects = suddenDeathData?.suspects?.filter(
    suspect => suspect.playerId !== player?.playerId
  ) || [];

  if (!showSuddenDeath || !suddenDeathData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-red-900 to-orange-900 rounded-2xl p-8 max-w-2xl mx-4 border-4 border-red-500 shadow-2xl animate-pulse">
        
        <div className="text-center space-y-6">
          {/* Icono dramático */}
          <div className="text-8xl animate-bounce">
            ⚡
          </div>
          
          {/* Título */}
          <h1 className="text-4xl font-bold text-white animate-pulse">
            ¡MUERTE SÚBITA!
          </h1>
          
          {/* Mensaje */}
          <div className="bg-black bg-opacity-50 rounded-lg p-4 border-2 border-red-600">
            <p className="text-xl text-red-200 font-semibold">
              {suddenDeathData.message}
            </p>
          </div>
          
          {/* Sección de votación */}
          {availableSuspects.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-yellow-300">
                VOTA PARA ELIMINAR:
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableSuspects.map((suspect, index) => (
                  <button
                    key={suspect.playerId}
                    onClick={() => vote(suspect.playerId)}
                    disabled={voted}
                    className={`p-3 rounded-lg font-bold transition-all transform hover:scale-105 ${
                      voted 
                        ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                        : 'bg-red-600 hover:bg-red-700 text-white border-2 border-yellow-500'
                    }`}
                  >
                    <div className="text-lg">{suspect.name}</div>
                    {!voted && (
                      <div className="text-xs mt-1">Clic para votar</div>
                    )}
                  </button>
                ))}
              </div>

              {voted && (
                <div className="text-green-400 text-lg font-bold animate-pulse">
                  ✅ ¡Has votado! Esperando a los demás...
                </div>
              )}
            </div>
          )}
          
          {/* Advertencia del caos */}
          <div className="text-center space-y-2">
            <div className="text-3xl animate-pulse">
              🌪️
            </div>
            <p className="text-red-300 text-lg font-bold">
              Si vuelven a empatar... EL CAOS REINARÁ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
