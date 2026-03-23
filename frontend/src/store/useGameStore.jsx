import { create } from "zustand";

const initialState = {
  roomCode: null,
  mode: null,
  theme: null,

  player: {
    playerId: null,
    name: null,
    role: null,
    word: null,
    isHost: false,
  },

  players: [],
  round: 0,
  phase: "home",

  eliminated: null,
  winner: null,
  gameOverReason: null,

  messages: [],
};

export const useGameStore = create((set) => ({
  ...initialState,

  setRoom: (room) => {
    set(room);
  },

  setPlayer: (player) => {
    set({ player });
  },

  setPhase: (phase) => {
    set({ phase });
  },

  setPlayers: (players) => {
    set({ players });
  },

  addMessage: (msg) => {
    set((state) => ({
      messages: [...state.messages, msg],
    }));
  },

  resetGame: () => {
    set(initialState);
  },
}));
