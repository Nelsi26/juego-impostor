const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");
const { z } = require("zod");
const { getRandomWord } = require("./words");
require("dotenv").config();

// ==================== APP ====================
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));
app.use(express.json());

// ==================== ROOT ====================
app.get("/", (_, res) => {
  res.json({
    status: "ok",
    message: "Backend ¿Quién es el impostor? 🔥",
  });
});

// ==================== DB ====================
console.log("🔥 DB FINAL CONFIG 🔥", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "impostor",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "juego_impostor",
});

console.log("✅ MySQL pool creado");

// ==================== VALIDATIONS ====================
const joinRoomSchema = z.object({
  roomCode: z.string().length(6),
  playerName: z.string().min(1).max(20),
});

// ==================== UTILS ====================
function generateCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

function sanitizeMessage(msg = "") {
  return msg.replace(/[<>]/g, "");
}

// ==================== STATE ====================
const roomsData = {};
const lastMessageTime = new Map();

// ==================== LOGGER ====================
function logPlayers(roomCode) {
  const room = roomsData[roomCode];
  if (!room) return;

  console.log("\n👥 JUGADORES:");
  Object.values(room.players).forEach(p => {
    console.log(
      `- ID:${p.playerId} | ${p.name} | host:${p.isHost} | conectado:${p.connected} | alive:${p.alive}`
    );
  });
  console.log("────────────────────────");
}

// ==================== CREATE ROOM ====================
app.post("/create-room", async (req, res) => {
  const createRoomSchema = z.object({
    host_name: z.string().min(1).max(50),
    mode: z.enum(["virtual", "presencial"]),
    theme: z.enum(["female", "male", "unisex"]),
  });

  try {
    const { host_name, mode, theme } = createRoomSchema.parse(req.body);

    let code;
    let tries = 0;

    do {
      if (++tries > 10) throw new Error("No se pudo generar código único");
      code = generateCode();
      const [rows] = await db.query(
        "SELECT id FROM rooms WHERE code = ?",
        [code]
      );
      if (!rows.length) break;
    } while (true);

    await db.query(
      "INSERT INTO rooms (code, host_name, mode, theme, status) VALUES (?, ?, ?, ?, 'waiting')",
      [code, host_name, mode, theme]
    );

    res.json({ success: true, code });
  } catch (error) {
    console.error("CREATE ROOM ERROR:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Datos inválidos",
        details: error.errors,
      });
    }

    res.status(500).json({
      error: "Error creando la sala",
      details: error.message,
    });
  }
});

// ==================== CONNECT (HTTP) ====================
app.get("/connect", async (req, res) => {
  const roomCode = String(req.query.roomCode || "");

  if (!roomCode || roomCode.length !== 6) {
    return res.status(400).json({ error: "Código de sala inválido" });
  }

  try {
    const [[room]] = await db.query(
      "SELECT code, mode, theme, status FROM rooms WHERE code = ?",
      [roomCode]
    );

    if (!room) {
      return res.status(404).json({ error: "Sala no existe" });
    }

    if (room.status !== "waiting") {
      return res.status(403).json({
        error: "La partida ya comenzó"
      });
    }

    res.json({
      success: true,
      code: room.code,
      mode: room.mode,
      theme: room.theme,
      status: room.status
    });
  } catch (error) {
    console.error("DB ERROR:", error);
    res.status(500).json({ error: "Error en base de datos" });
  }
});

// ==================== SOCKET ====================
io.on("connection", (socket) => {
  console.log("⚡ Conectado:", socket.id);

  // -------- JOIN ROOM --------
  socket.on("join_room", async (data) => {
    try {
      console.log("🔥 join_room recibido:", data);
      
      // Si ya está en una sala, limpiar primero
      if (socket.data?.roomCode) {
        console.log("🧹 Limpiando sala anterior:", socket.data.roomCode);
        
        // Remover de la sala anterior
        const oldRoom = roomsData[socket.data.roomCode];
        if (oldRoom && oldRoom.players[socket.data.playerId]) {
          delete oldRoom.players[socket.data.playerId];
          io.to(socket.data.roomCode).emit("update_players", Object.values(oldRoom.players));
        }
        
        // Limpiar datos del socket
        socket.data = {};
      }

      const { roomCode, playerName } = joinRoomSchema.parse(data);
      console.log("📋 Datos validados:", { roomCode, playerName });

      const [[roomDB]] = await db.query(
        "SELECT * FROM rooms WHERE code = ?",
        [roomCode]
      );

      console.log("📊 Sala encontrada en DB:", roomDB);

      if (!roomDB) {
        console.log("❌ Sala no existe en DB:", roomCode);
        return socket.emit("error_message", "Sala no existe");
      }

      socket.join(roomCode);

      await db.query(
        `INSERT INTO players (room_id, name, role)
         VALUES (?, ?, 'civil')
         ON DUPLICATE KEY UPDATE name = name`,
        [roomDB.id, playerName]
      );

      const [[playerDB]] = await db.query(
        "SELECT * FROM players WHERE room_id = ? AND name = ?",
        [roomDB.id, playerName]
      );

      if (!roomDB.host_player_id) {
        await db.query(
          "UPDATE rooms SET host_player_id = ? WHERE id = ?",
          [playerDB.id, roomDB.id]
        );
        roomDB.host_player_id = playerDB.id;
      }

      const isHost = roomDB.host_player_id === playerDB.id;

      socket.data = {
        socketId: socket.id,
        playerId: playerDB.id,
        name: playerName,
        role: playerDB.role,
        hasVoted: false,
        isHost,
        roomCode,
      };

      if (!roomsData[roomCode]) {
        roomsData[roomCode] = {
          roomId: roomDB.id,
          players: {},
          votes: {},
          round: 0,
          word: null,
          mode: roomDB.mode,
          theme: roomDB.theme,
          isSuddenDeath: false,
          voteTimer: null,
        };
      }

      roomsData[roomCode].players[playerDB.id] = {
        ...socket.data,
        connected: true,
        alive: true, // <-- siempre true al unirse
      };

      // recalcular host
      Object.values(roomsData[roomCode].players).forEach(p => {
        p.isHost = p.playerId === roomDB.host_player_id;
      });

      logPlayers(roomCode);

      io.to(roomCode).emit(
        "update_players",
        Object.values(roomsData[roomCode].players)
      );
    } catch {
      socket.emit("error_message", "Datos inválidos");
    }
  });

  // ==================== GAME LOGIC ====================
  async function startRound(roomCode, numImpostors) {
    console.log("🔄 startRound iniciado:", { roomCode, numImpostors });
    
    const room = roomsData[roomCode];
    if (!room) {
      console.log("❌ Sala no encontrada en startRound");
      return;
    }

    console.log("🔄 Sala actual:", { round: room.round, playersCount: Object.keys(room.players).length });

    // ✅ En cada ronda, TODOS vuelven a estar vivos
    Object.values(room.players).forEach(p => {
      p.alive = true;
      p.hasVoted = false;
    });
    console.log("🔄 Todos los jugadores revividos");

    const players = Object.values(room.players);
    if (players.length < 3) {
      console.log("❌ No hay suficientes jugadores:", players.length);
      return;
    }
    if (numImpostors <= 0 || numImpostors >= players.length) {
      console.log("❌ Número de impostores inválido:", numImpostors);
      return;
    }

    room.round++;
    room.votes = {};
    room.isSuddenDeath = false;

    console.log("🔄 Actualizando ronda en BD a:", room.round);

    await db.query("UPDATE players SET role='civil' WHERE room_id=?", [
      room.roomId,
    ]);

    const { word } = getRandomWord();
    room.word = word;
    console.log("🔄 Nueva palabra:", word);

    const shuffled = [...players].sort(() => 0.5 - Math.random());
    const impostors = shuffled.slice(0, numImpostors);
    console.log("🔄 Nuevos impostores seleccionados:", impostors.map(p => p.name));

    for (const p of players) {
      p.role = impostors.includes(p) ? "impostor" : "civil";
      p.hasVoted = false;

      await db.query("UPDATE players SET role=? WHERE id=?", [
        p.role,
        p.playerId,
      ]);

      console.log("🔄 Enviando rol a", p.name, ":", p.role);
      io.to(p.socketId).emit("your_word", {
        role: p.role,
        word: p.role === "impostor" ? null : word,
      });
    }

    // 🔥 QUITADO: timer de 30s

    console.log("🔄 Enviando round_started y update_players a todos");
    io.to(roomCode).emit("round_started", { round: room.round });
    io.to(roomCode).emit("update_players", Object.values(room.players));
  }

  socket.on("start_game", async ({ roomCode, numImpostors }) => {
    if (!socket.data?.isHost) return;
    await startRound(roomCode, numImpostors);
  });

socket.on("sync_state", async ({ roomCode, playerName }) => {
  try {
    const room = roomsData[roomCode];
    if (!room) return socket.emit("error_message", "Sala no existe");

    const players = Object.values(room.players);
    const player = players.find(p => p.name === playerName);

    if (!player) return socket.emit("error_message", "Jugador no encontrado");

    socket.data = {
      ...player,
      socketId: socket.id,
      roomCode
    };

    room.players[player.playerId].socketId = socket.id;
    room.players[player.playerId].connected = true;

    socket.join(roomCode);

    socket.emit("sync_state_response", {
      phase: room.phase || "lobby",
      roomCode,
      mode: room.mode,
      theme: room.theme,
      round: room.round,
      players,
      player,
      word: room.word,
    });

    io.to(roomCode).emit("update_players", players);
  } catch (e) {
    socket.emit("error_message", "Error sincronizando");
  }
});



  socket.on("next_round", async ({ roomCode, numImpostors }) => {
    console.log("🔄 next_round recibido:", { roomCode, numImpostors, socketId: socket.id });
    
    const room = roomsData[roomCode];
    if (!room) {
      console.log("❌ Sala no encontrada para next_round");
      return;
    }

    const player = room.players[socket.data.playerId];
    console.log("🔄 Jugador solicitando next_round:", { player, isHost: player?.isHost });
    
    if (!player?.isHost) {
      console.log("❌ Solo el host puede iniciar siguiente ronda");
      return;
    }

    console.log("🔄 Iniciando nueva ronda...");
    await startRound(roomCode, numImpostors);
  });

  // ==================== END GAME ====================
  socket.on("end_game", async ({ roomCode }) => {
    console.log("🛑 end_game recibido:", { roomCode, socketId: socket.id });
    
    const room = roomsData[roomCode];
    if (!room) {
      console.log("❌ Sala no encontrada para end_game");
      return socket.emit("error_message", "Sala no existe");
    }
    
    if (!socket.data?.isHost) {
      console.log("❌ Solo el host puede terminar el juego");
      return socket.emit("error_message", "Solo el host puede terminar el juego");
    }
    
    // Enviar evento de game_over a todos
    io.to(roomCode).emit("game_over", {
      reason: "Terminado por el host",
      winner: null,
      gameOverReason: "El juego fue terminado por el host"
    });
    
    // Limpiar la sala
    delete roomsData[roomCode];
    console.log("🗑️ Sala eliminada:", roomCode);
  });

  // ==================== VOTING ====================
  socket.on("vote", async ({ roomCode, votedPlayerId }) => {
    console.log("🗳️ Vote recibido:", { roomCode, votedPlayerId, socketId: socket.id });
    
    const room = roomsData[roomCode];
    if (!room) {
      console.log("❌ Sala no encontrada en roomsData:", roomCode);
      return;
    }

    if (!room.players[votedPlayerId]) {
      console.log("❌ Jugador votado no encontrado:", votedPlayerId);
      return;
    }
    if (!room.players[votedPlayerId].alive) {
      console.log("❌ Jugador votado está muerto:", votedPlayerId);
      return;
    }

    const voter = room.players[socket.data.playerId];
    console.log("🗳️ Votante:", voter);
    
    if (!voter) {
      console.log("❌ Votante no encontrado en sala");
      return;
    }
    if (voter.hasVoted) {
      console.log("❌ Votante ya votó");
      return;
    }
    if (!voter.alive) {
      console.log("❌ Votante está muerto");
      return;
    }

    voter.hasVoted = true;
    room.votes[voter.playerId] = votedPlayerId;
    
    // Agregar información de quién votó a quién para el frontend
    voter.votedFor = votedPlayerId;
    
    console.log("✅ Voto registrado:", { voterId: voter.playerId, votedPlayerId });

    // Enviar actualización inmediata a todos los jugadores
    const playersToSend = Object.values(room.players);
    console.log("🗳️ Enviando update_players:", playersToSend);
    io.to(roomCode).emit("update_players", playersToSend);

    const alivePlayers = Object.values(room.players).filter(p => p.alive);

    // esperar a que todos los vivos voten
    if (Object.keys(room.votes).length !== alivePlayers.length) return;

    // contar votos
    const count = {};
    Object.values(room.votes).forEach(
      (id) => (count[id] = (count[id] || 0) + 1)
    );

    const maxVotes = Math.max(...Object.values(count));
    const candidates = Object.keys(count).filter(
      (id) => count[id] === maxVotes
    );

    // ==================== EMPATE ====================
    if (candidates.length > 1) {
      console.log("🤝 EMPATE detectado:", { candidates: candidates.map(id => room.players[id]?.name), maxVotes });
      
      if (!room.isSuddenDeath) {
        console.log("⚡ Primer empate - activando sudden death");
        room.isSuddenDeath = true;
        room.votes = {};
        Object.values(room.players).forEach((p) => (p.hasVoted = false));

        // Enviar actualización de jugadores con hasVoted = false
        io.to(roomCode).emit("update_players", Object.values(room.players));

        return io.to(roomCode).emit("sudden_death_round", {
          message:
            "¡EMPATE! Tienen una última oportunidad. Si fallan, el caos castigará a los jugadores.",
          suspects: candidates.map((id) => room.players[id]),
        });
      }

      console.log("💀 Segundo empate - activando victoria del caos");
      // segundo empate → caos (solo civiles)
      const civilsAlive = Object.values(room.players).filter(
        (p) => p.role === "civil" && p.alive
      );

      if (!civilsAlive.length) {
        console.log("🏆 Victoria impostor - no quedan civiles");
        io.to(roomCode).emit("game_over", {
          winner: "impostor",
          reason: "No quedan civiles",
          players: Object.values(room.players),
        });
        return;
      }

      const suspectCivils = candidates
        .map((id) => room.players[id])
        .filter((p) => p && p.role === "civil" && p.alive);

      const toEliminate =
        suspectCivils.length > 0
          ? suspectCivils[Math.floor(Math.random() * suspectCivils.length)]
          : civilsAlive[Math.floor(Math.random() * civilsAlive.length)];

      const eliminated = { ...toEliminate };

      console.log("💀 Caos eliminando a:", eliminated.name);

      // solo fuera de esta ronda
      room.players[toEliminate.playerId].alive = false;

      return finishVoting(roomCode, eliminated, true);
    }

    // ==================== ELIMINACIÓN NORMAL ====================
    const eliminatedId = candidates[0];
    const eliminated = { ...room.players[eliminatedId] };

    console.log("⚡ Eliminación normal:", { eliminated: eliminated.name, role: eliminated.role });

    room.players[eliminatedId].alive = false;

    finishVoting(roomCode, eliminated, false);
  });

  async function finishVoting(roomCode, eliminated, byChaos = false) {
    const room = roomsData[roomCode];
    if (!room) return;

    console.log(
      `☠️ ELIMINADO: ${eliminated.name} | role=${eliminated.role} | chaos=${byChaos}`
    );

    io.to(roomCode).emit("round_summary", {
      eliminated,
      byChaos,
      players: Object.values(room.players),
    });

    const playersAlive = Object.values(room.players).filter(p => p.alive);
    const impostors = playersAlive.filter(p => p.role === "impostor");
    const civils = playersAlive.filter(p => p.role === "civil");

    console.log("🔍 Estado del juego después de eliminación:", {
      playersAlive: playersAlive.length,
      impostors: impostors.length,
      civils: civils.length,
      byChaos,
      playersAliveNames: playersAlive.map(p => `${p.name}(${p.role})`)
    });

    if (!impostors.length) {
      console.log("🏆 Victoria civil - todos los impostores eliminados");
      io.to(roomCode).emit("round_summary", {
        eliminated: null,
        byChaos: false,
        players: Object.values(room.players),
      });
      return;
    }

    if (impostors.length >= civils.length) {
      console.log("🏆 Victoria impostor - superaron a los civiles");
      io.to(roomCode).emit("round_summary", {
        eliminated: null,
        byChaos: false,
        players: Object.values(room.players),
      });
      return;
    }

    // ==================== VICTORIA DEL CAOS ====================
    console.log("🔍 Verificando victoria del caos:", {
      playersAlive: playersAlive.length,
      impostors: impostors.length,
      civils: civils.length,
      byChaos
    });

    // Si solo queda 1 civil y 1 impostor -> victoria del caos
    if (playersAlive.length === 2 && impostors.length === 1 && civils.length === 1) {
      console.log("🌪️ ¡VICTORIA DEL CAOS! 1v1 final");
      io.to(roomCode).emit("round_summary", {
        eliminated: null,
        byChaos: false,
        players: Object.values(room.players),
      });
      return;
    }

    // Si es sudden death y todos mueren -> victoria del caos
    if (byChaos && playersAlive.length <= 1) {
      console.log("💀 ¡VICTORIA DEL CAOS! Sudden death consumió todo");
      io.to(roomCode).emit("round_summary", {
        eliminated: null,
        byChaos: true,
        players: Object.values(room.players),
      });
      return;
    }

    console.log("🔍 Continuando juego - sin victoria del caos");

    // reset votos
    playersAlive.forEach(p => {
      p.hasVoted = false;
    });

    console.log(`➡️ Fin de ronda | vivos=${playersAlive.length}`);
  }

  // ==================== CHAT ====================
  socket.on("send_message", ({ roomCode, message }) => {
    console.log("💬 send_message recibido:", { roomCode, message, socketId: socket.id });
    
    const room = roomsData[roomCode];
    console.log("💬 Sala encontrada:", room);
    
    if (!room) {
      console.log("❌ Sala no encontrada para chat");
      return;
    }
    
    if (room.mode === "presencial") {
      console.log("❌ Chat deshabilitado en modo presencial");
      return;
    }

    const now = Date.now();
    if (now - (lastMessageTime.get(socket.id) || 0) < 800) return;
    lastMessageTime.set(socket.id, now);

    const messageData = {
      playerName: socket.data.name,
      message: sanitizeMessage(message),
      timestamp: now,
    };
    
    console.log("💬 Enviando mensaje:", messageData);
    io.to(roomCode).emit("receive_message", messageData);
  });

  // ==================== DISCONNECT ====================
  socket.on("disconnect", async () => {
    const { roomCode, playerId, isHost } = socket.data || {};
    if (!roomCode || !roomsData[roomCode]) return;

    console.log("🔌 Desconectando:", { socketId: socket.id, roomCode, playerId });

    lastMessageTime.delete(socket.id);
    delete roomsData[roomCode].players[playerId];
    
    // Limpiar datos del socket para permitir reconexiones limpias
    socket.data = {};
    
    await db.query("DELETE FROM players WHERE id=?", [playerId]);

    const players = Object.values(roomsData[roomCode].players);

    if (isHost && players.length) {
      players[0].isHost = true;
      await db.query(
        "UPDATE rooms SET host_player_id=? WHERE id=?",
        [players[0].playerId, roomsData[roomCode].roomId]
      );
      io.to(roomCode).emit("host_changed", players[0]);
    }

    io.to(roomCode).emit("update_players", players);

    if (!players.length) delete roomsData[roomCode];
  });
});

// ==================== LISTEN ====================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`)
);




