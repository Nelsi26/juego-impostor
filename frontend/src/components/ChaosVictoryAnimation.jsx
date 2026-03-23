import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

export default function ChaosVictoryAnimation() {
  const { winner, gameOverReason } = useGameStore();
  const [showChaosVictory, setShowChaosVictory] = useState(false);

  useEffect(() => {
    if (winner === 'caos') {
      setShowChaosVictory(true);
      
      // Efectos de sonido simulados con animaciones
      const chaosEffects = setInterval(() => {
        // Crear partículas de caos
        createChaosParticle();
      }, 200);

      // Detener efectos después de 8 segundos
      setTimeout(() => {
        clearInterval(chaosEffects);
        setShowChaosVictory(false);
      }, 8000);

      return () => clearInterval(chaosEffects);
    }
  }, [winner]);

  const createChaosParticle = () => {
    const particle = document.createElement('div');
    particle.className = 'fixed pointer-events-none z-50 text-4xl animate-spin';
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.top = Math.random() * window.innerHeight + 'px';
    particle.textContent = ['🌪️', '⚡', '🔥', '💀', '👹'][Math.floor(Math.random() * 5)];
    document.body.appendChild(particle);
    
    setTimeout(() => particle.remove(), 2000);
  };

  if (!showChaosVictory) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-black to-red-900 bg-opacity-95 flex items-center justify-center z-50">
      <div className="relative">
        {/* Efecto de vortex */}
        <div className="absolute inset-0 animate-spin-slow">
          <div className="w-96 h-96 rounded-full border-8 border-purple-500 opacity-30"></div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDirection: 'reverse' }}>
          <div className="w-80 h-80 rounded-full border-4 border-red-500 opacity-50"></div>
        </div>
        
        {/* Contenido principal */}
        <div className="relative bg-black bg-opacity-80 rounded-2xl p-8 max-w-md mx-4 border-4 border-purple-500 shadow-2xl">
          
          <div className="text-center space-y-6">
            {/* Icono del caos */}
            <div className="text-8xl animate-bounce">
              🌪️
            </div>
            
            {/* Título épico */}
            <h1 className="text-5xl font-bold text-purple-400 animate-pulse">
              ¡EL CAOS HA TRIUNFADO!
            </h1>
            
            {/* Razón de la victoria */}
            <div className="bg-purple-900 bg-opacity-50 rounded-lg p-4 border-2 border-purple-600">
              <p className="text-xl text-purple-200 font-semibold">
                {gameOverReason}
              </p>
            </div>
            
            {/* Mensaje dramático */}
            <div className="space-y-3">
              <div className="text-3xl animate-pulse">
                💀
              </div>
              <p className="text-red-400 text-lg font-bold">
                El orden ha sido destruido...
              </p>
              <p className="text-purple-300 text-lg">
                El caos consume todo a su paso...
              </p>
            </div>
            
            {/* Efectos adicionales */}
            <div className="flex justify-center space-x-4 animate-pulse">
              <span className="text-4xl">⚡</span>
              <span className="text-4xl">🔥</span>
              <span className="text-4xl">👹</span>
              <span className="text-4xl">💀</span>
              <span className="text-4xl">🌪️</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
