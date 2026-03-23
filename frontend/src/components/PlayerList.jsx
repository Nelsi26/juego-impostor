import { useGameStore } from "../store/useGameStore";
import { useTheme } from "../hooks/useTheme";

export default function PlayerList() {
  const players = useGameStore((state) => {
    console.log("🔍 PlayerList - estado actual de players:", state.players);
    return state.players;
  });
  const { css, emojis } = useTheme();

  console.log("🎨 PlayerList - tema actual:", { css, emojis });

  if (!players || players.length === 0) {
    console.log("❌ PlayerList - no hay jugadores o está vacío");
    return (
      <div className={`text-center ${css.text} opacity-75`}>
        <div className="text-2xl mb-2">{emojis.player}</div>
        <p>Esperando jugadores...</p>
      </div>
    );
  }

  console.log("✅ PlayerList - renderizando jugadores:", players.length, players);

  return (
    <div className="space-y-3">
      <h3 className={`text-lg font-semibold mb-3 ${css.text}`}>
        Jugadores ({players.length})
      </h3>
      <div className="space-y-2">
        {players.map((p) => (
          <div
            key={p.playerId}
            className={`flex items-center justify-between p-3 rounded-lg ${css.card} border ${css.border}`}
          >
            <div className="flex items-center space-x-3">
              <span className={`text-xl ${!p.alive ? 'opacity-50 grayscale' : ''}`}>
                {emojis.player}
              </span>
              <span className={`font-medium ${css.text}`}>
                {p.name}
              </span>
              {p.isHost && (
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                  👑
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                p.alive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {p.alive ? '🟢' : '💀'}
              </span>
              <span className={`text-xs ${css.text} opacity-60`}>
                {p.connected ? '' : '🔴'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


