import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Summary from "./pages/Summary";
import GameOver from "./pages/GameOver";
import { usePhaseRedirect } from "./hooks/usePhaseRedirect";

export default function App() {
  usePhaseRedirect();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/game" element={<Game />} />
      <Route path="/summary" element={<Summary />} />
      <Route path="/gameover" element={<GameOver />} />
    </Routes>
  );
}

