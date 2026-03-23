import { useGameStore } from "../store/useGameStore";
import PlayerList from "../components/PlayerList";
import VotePanel from "../components/VotePanel";
import Chat from "../components/Chat";
import EliminationAnimation from "../components/EliminationAnimation";
import SuddenDeathAnimation from "../components/SuddenDeathAnimation";
import ChaosVictoryAnimation from "../components/ChaosVictoryAnimation";
import { useTheme } from "../hooks/useTheme";
import { useSocket } from "../socket/useSocket";

export default function Game() {
  const { player, players, mode, round, roomCode } = useGameStore();
  const { css, emojis } = useTheme();
  const socket = useSocket();

  return (
    <div className={`min-h-screen flex flex-col items-center justify-start ${css.background} ${css.text}`}>
      {/* Animaciones superpuestas */}
      <EliminationAnimation />
      <SuddenDeathAnimation />
      <ChaosVictoryAnimation />
      
      <div className="w-full max-w-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Ronda {round}</h2>
          <div className="text-sm">
            Rol: <span className="font-bold">{player.role}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className={`p-4 ${css.card} border-2 ${css.border} rounded`}>
              <h3 className="font-bold mb-2">Tu palabra</h3>
              <div className="text-xl">
                {player.role === "impostor" ? (
                  <span className="italic">Eres el impostor 🤫</span>
                ) : (
                  player.word
                )}
              </div>
            </div>

            <div className="mt-6">
              <VotePanel />
            </div>
          </div>

          <div>
            <PlayerList players={players} />
          </div>
        </div>

        {mode === "virtual" && (
          <div className="mt-6">
            <Chat />
          </div>
        )}
        
        {/* Botón para terminar juego - solo visible para el host */}
        {player?.isHost && socket && (
          <div className="mt-4 text-center">
            <button
              className={`px-4 py-2 rounded ${css.secondary} ${css.secondaryHover} ${css.text} text-sm opacity-75 hover:opacity-100 transition`}
              onClick={() => {
                if (confirm('¿Estás seguro de que quieres terminar el juego?')) {
                  socket.emit('end_game', { roomCode });
                }
              }}
            >
              Terminar Juego
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



