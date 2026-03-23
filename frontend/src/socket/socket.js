import { useGameStore } from "../store/useGameStore";

export function setupSocketListeners(socket) {
  if (!socket) return;

  // Remover listeners existentes para evitar duplicados
  socket.off("update_players");
  socket.off("your_word");
  socket.off("round_started");
  socket.off("round_summary");
  socket.off("game_over");
  socket.off("receive_message");
  socket.off("host_changed");
  socket.off("sync_state_response");
  socket.off("error_message");

  socket.on("update_players", (players) => {
    console.log("🗳️ update_players recibido:", players);
    useGameStore.setState({ players });
  });

  socket.on("your_word", ({ role, word }) => {
    useGameStore.setState((state) => ({
      player: { ...state.player, role, word },
      phase: "game",
    }));
  });

  socket.on("round_started", ({ round }) => {
    useGameStore.setState({ round, phase: "game" });
  });

  socket.on("round_summary", ({ eliminated, players, byChaos }) => {
    console.log("📊 round_summary recibido:", { eliminated, players, byChaos });
    useGameStore.setState({
      eliminated,
      players,
      phase: "summary",
    });
  });

  socket.on("game_over", ({ winner, reason, players }) => {
    console.log("🏆 game_over recibido:", { winner, reason, players });
    useGameStore.setState({
      winner,
      gameOverReason: reason,
      players,
      phase: "gameover",
    });
  });

  socket.on("receive_message", (msg) => {
    console.log("💬 receive_message recibido:", msg);
    useGameStore.setState((state) => ({
      messages: [...state.messages, msg],
    }));
  });

  socket.on("host_changed", (newHost) => {
    useGameStore.setState((state) => ({
      players: state.players.map((p) =>
        p.playerId === newHost.playerId ? newHost : p
      ),
      player: {
        ...state.player,
        isHost: newHost.playerId === state.player.playerId,
      },
    }));
  });

  socket.on("sync_state_response", (data) => {
    const {
      phase,
      roomCode,
      mode,
      theme,
      round,
      players,
      player,
      word,
    } = data;

    useGameStore.setState({
      phase,
      roomCode,
      mode,
      theme,
      round,
      players,
      player: {
        ...player,
        word,
      },
    });
  });

  socket.on("error_message", (msg) => {
    alert(msg);
  });
}




