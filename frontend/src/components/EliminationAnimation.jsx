import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

export default function EliminationAnimation() {
  const { eliminated, phase } = useGameStore();
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('fade-in');

  useEffect(() => {
    if (phase === 'summary' && eliminated) {
      setShowAnimation(true);
      setAnimationPhase('fade-in');
      
      // Secuencia de animación
      const timer1 = setTimeout(() => setAnimationPhase('dramatic'), 500);
      const timer2 = setTimeout(() => setAnimationPhase('reveal'), 2000);
      const timer3 = setTimeout(() => setAnimationPhase('fade-out'), 4000);
      const timer4 = setTimeout(() => setShowAnimation(false), 5000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [phase, eliminated]);

  if (!showAnimation || !eliminated) return null;

  const getRoleEmoji = (role) => {
    return role === 'impostor' ? '👹' : '👤';
  };

  const getRoleColor = (role) => {
    return role === 'impostor' ? 'text-red-500' : 'text-blue-500';
  };

  const getRoleText = (role) => {
    return role === 'impostor' ? 'IMPOSTOR' : 'CIVIL';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className={`transition-all duration-1000 transform ${animationPhase === 'fade-in' ? 'scale-0 opacity-0' : animationPhase === 'dramatic' ? 'scale-110 opacity-100' : animationPhase === 'reveal' ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md mx-4 border-2 border-gray-700 shadow-2xl">
          
          {/* Fase dramática */}
          {animationPhase === 'dramatic' && (
            <div className="text-center space-y-4">
              <div className="text-6xl animate-pulse">⚡</div>
              <h2 className="text-3xl font-bold text-white animate-pulse">
                Alguien ha sido eliminado...
              </h2>
              <div className="text-gray-400 text-lg">
                Descubriremos quién es...
              </div>
            </div>
          )}

          {/* Fase de revelación */}
          {animationPhase === 'reveal' && (
            <div className="text-center space-y-6">
              <div className="text-6xl animate-bounce">
                {getRoleEmoji(eliminated.role)}
              </div>
              
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-white">
                  {eliminated.name}
                </h2>
                <div className={`text-2xl font-bold ${getRoleColor(eliminated.role)}`}>
                  {getRoleText(eliminated.role)}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                <div className="text-gray-300 text-sm">
                  {eliminated.role === 'impostor' 
                    ? '🔥 El impostor ha sido descubierto y eliminado!'
                    : '😔 Un civil inocente ha sido eliminado...'
                  }
                </div>
              </div>

              {eliminated.role === 'impostor' && (
                <div className="text-green-400 text-lg font-bold animate-pulse">
                  ¡Los civiles están un paso más cerca de la victoria!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
