import { useGameStore } from "../store/useGameStore";
import PlayerList from "../components/PlayerList";
import ChaosVictoryAnimation from "../components/ChaosVictoryAnimation";

export default function GameOver() {
  const { winner, gameOverReason, players } = useGameStore();

  const getWinnerDisplay = () => {
    switch (winner) {
      case "civil":
        return { text: "Civiles", color: "text-blue-400", bg: "bg-blue-500/20" };
      case "impostor":
        return { text: "Impostores", color: "text-red-400", bg: "bg-red-500/20" };
      case "caos":
        return { text: "¡EL CAOS!", color: "text-purple-400", bg: "bg-purple-500/20" };
      default:
        return { text: winner, color: "text-gray-400", bg: "bg-gray-500/20" };
    }
  };

  const winnerDisplay = getWinnerDisplay();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      {/* Animación de victoria del caos */}
      <ChaosVictoryAnimation />
      
      <div className="w-full max-w-xl p-8 bg-white/10 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold mb-4">Game Over</h2>

        <div className={`p-6 rounded mb-4 ${winnerDisplay.bg} border-2 ${winner === 'caos' ? 'border-purple-500 animate-pulse' : 'border-transparent'}`}>
          <p className="text-2xl mb-2">
            Ganador: <span className={`font-bold ${winnerDisplay.color}`}>{winnerDisplay.text}</span>
          </p>
          <p className="text-lg mt-3">{gameOverReason}</p>
          
          {winner === 'caos' && (
            <div className="mt-4 text-center">
              <p className="text-purple-300 text-sm">🌪️ El caos ha consumido todo... 🌪️</p>
            </div>
          )}
        </div>

        <PlayerList players={players} />
        
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = "/"}
            className="px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition font-bold"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

