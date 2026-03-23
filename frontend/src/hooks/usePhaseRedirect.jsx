import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/useGameStore";

export function usePhaseRedirect() {
  const navigate = useNavigate();
  const phase = useGameStore((s) => s.phase);
  const lastPhaseRef = useRef();

  useEffect(() => {
    if (!phase) return;
    
    console.log("🔄 usePhaseRedirect - phase cambiado:", phase);
    
    // Evitar navegación redundante si el phase no cambió
    if (lastPhaseRef.current === phase) {
      console.log("🔄 Phase redundante, no navegando");
      return;
    }
    
    lastPhaseRef.current = phase;
    console.log("🔄 Navegando a:", phase);

    switch (phase) {
      case "home":
        navigate("/");
        break;
      case "lobby":
        navigate("/lobby");
        break;
      case "game":
        navigate("/game");
        break;
      case "summary":
        navigate("/summary");
        break;
      case "gameover":
        navigate("/gameover");
        break;
      default:
        navigate("/");
        break;
    }
  }, [phase]); // Removido navigate de las dependencias
}
