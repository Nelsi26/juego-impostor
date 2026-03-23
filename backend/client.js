import { io } from "socket.io-client";
import readline from "readline";
import axios from "axios";

const SERVER_URL = "http://localhost:3000";

// ================= SOCKET =================
const socket = io(SERVER_URL, {
  transports: ["websocket"],
});

// ================= CLI =================
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ================= STATE =================
let state = {
  roomCode: null,
  playerName: null,
  isHost: false,
  players: [],
  round: 0,
  role: null,
  word: null,
  isSuddenDeath: false,
};

// ================= HELP =================
function help() {
  console.log(`
🧠 COMANDOS DISPONIBLES
--------------------------------
connect <ROOM> <NAME>   → Unirse a una sala
start [N]               → Iniciar partida (host)
next [N]                → Siguiente ronda (host)
vote <NOMBRE>           → Votar por un jugador
msg <MENSAJE>           → Enviar chat
players                 → Ver jugadores
round                   → Ver estado de ronda
state                   → Ver estado local
help                    → Mostrar ayuda
exit                    → Salir
--------------------------------
`);
}

// ================= SOCKET EVENTS =================
socket.on("connect", () => {
  console.log("🔌 Conectado al servidor:", socket.id);
  help();
});

socket.on("update_players", (players) => {
  state.players = players;

  console.log("\n👥 JUGADORES:");
  players.forEach(p => {
    console.log(
      `- ID:${p.playerId} | ${p.name} | host:${p.isHost} | conectado:${p.connected}`
    );
  });

  const me = players.find(p => p.socketId === socket.id);
  if (me) state.isHost = me.isHost;
});

socket.on("your_word", ({ role, word }) => {
  state.role = role;
  state.word = word;

  console.log(
    `\n🎭 TU ROL: ${role} | PALABRA: ${word ?? "❌ (eres impostor)"}`
  );
});

socket.on("round_started", ({ round }) => {
  state.round = round;
  state.isSuddenDeath = false;

  console.log(`\n🎮 RONDA ${round} INICIADA`);
});

socket.on("round_summary", ({ eliminated, byChaos, players }) => {
  console.log("\n⚖️ RESULTADO DE VOTACIÓN");
  console.log("Eliminado:", eliminated.name);
  console.log("Rol:", eliminated.role);
  console.log("Modo:", byChaos ? "CAOS" : "VOTACIÓN");
  console.log("Jugadores restantes:", players.length);
});


socket.on("sudden_death_round", ({ message, suspects }) => {
  state.isSuddenDeath = true;

  console.log(`\n⚡ MUERTE SÚBITA`);
  console.log(message);
  suspects.forEach(s =>
    console.log(`- ${s.name} (ID:${s.playerId})`)
  );
});

socket.on("game_over", ({ winner, reason, players }) => {
  console.log(`\n🏁 GAME OVER`);
  console.log(`Ganador: ${winner}`);
  console.log(`Razón: ${reason}`);
  players.forEach(p =>
    console.log(`- ${p.name} (${p.role})`)
  );
});

socket.on("receive_message", ({ playerName, message }) => {
  console.log(`\n💬 ${playerName}: ${message}`);
});

socket.on("host_changed", (newHost) => {
  console.log(`\n👑 Nuevo host: ${newHost.name}`);
});

socket.on("error_message", (msg) => {
  console.error("\n❌ ERROR:", msg);
});

// ================= COMMANDS =================
rl.on("line", async (input) => {
  const [cmd, ...args] = input.trim().split(" ");

  switch (cmd) {
    case "connect": {
      const [roomCode, playerName] = args;
      if (!roomCode || !playerName) {
        return console.log("Uso: connect <ROOM> <NAME>");
      }

      try {
        await axios.get(`${SERVER_URL}/connect`, {
          params: { roomCode },
        });
      } catch {
        return console.log("❌ La sala no existe o ya comenzó");
      }

      state.roomCode = roomCode;
      state.playerName = playerName;

      socket.emit("join_room", { roomCode, playerName });
      console.log(`✅ Unido a la sala ${roomCode}`);
      break;
    }

    case "start": {
      if (!state.roomCode) return console.log("❌ No estás en una sala");
      if (!state.isHost) return console.log("❌ Solo el host puede iniciar");

      const numImpostors = Number(args[0]) || 1;

      socket.emit("start_game", {
        roomCode: state.roomCode,
        numImpostors,
      });

      console.log(`🎮 Partida iniciada (${numImpostors} impostor/es)`);
      break;
    }

    case "next": {
      if (!state.roomCode) return console.log("❌ No estás en una sala");
      if (!state.isHost) return console.log("❌ Solo el host puede avanzar");

      const numImpostors = Number(args[0]) || 1;

      socket.emit("next_round", {
        roomCode: state.roomCode,
        numImpostors,
      });

      console.log(`➡️ Siguiente ronda`);
      break;
    }

    case "vote": {
      if (!state.roomCode) return console.log("❌ No estás en una sala");

      const name = args.join(" ");
      if (!name) return console.log("Uso: vote <NOMBRE>");

      const player = state.players.find(p => p.name === name);
      if (!player) return console.log("❌ Jugador no encontrado");

      socket.emit("vote", {
        roomCode: state.roomCode,
        votedPlayerId: player.playerId,
      });

      console.log(`🗳️ Votaste a ${player.name}`);
      break;
    }

    case "msg": {
      if (!state.roomCode) return console.log("❌ No estás en una sala");

      const message = args.join(" ");
      if (!message) return console.log("Uso: msg <MENSAJE>");

      socket.emit("send_message", {
        roomCode: state.roomCode,
        message,
      });
      break;
    }

    case "players":
      if (!state.players.length) return console.log("👻 Sin jugadores");
      state.players.forEach(p =>
        console.log(`- ${p.name} | ID:${p.playerId} | host:${p.isHost}`)
      );
      break;

    case "round":
      console.log(`
🏁 ESTADO
- Ronda: ${state.round}
- Rol: ${state.role}
- Palabra: ${state.word ?? "❌ (impostor)"}
- Muerte súbita: ${state.isSuddenDeath}
`);
      break;

    case "state":
      console.log(state);
      break;

    case "help":
      help();
      break;

    case "exit":
      console.log("👋 Saliendo...");
      process.exit(0);

    default:
      console.log("❓ Comando desconocido (usa help)");
  }
});

