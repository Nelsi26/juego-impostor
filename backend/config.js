require('dotenv').config();

module.exports = {
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    NAME: process.env.DB_NAME || 'juego_impostor',
  },
  GAME: {
    VOTE_TIMEOUT: parseInt(process.env.VOTE_TIMEOUT) || 30000,
    MAX_PLAYERS: parseInt(process.env.MAX_PLAYERS) || 10,
    RECONNECT_TIMEOUT: 15000,
    CODE_LENGTH: 6,
    MIN_PLAYERS: 3
  },
  SERVER: {
    PORT: process.env.PORT || 3001,
    NODE_ENV: process.env.NODE_ENV || 'development'
  },
  CORS: {
    ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    METHODS: ['GET', 'POST']
  }
};
