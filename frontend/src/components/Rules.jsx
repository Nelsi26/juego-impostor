import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

export default function Rules() {
  const { css } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        className={`fixed bottom-4 right-4 px-4 py-2 ${css.primary} ${css.primaryHover} ${css.text} rounded-lg font-medium shadow-lg transition transform hover:scale-105`}
        onClick={() => setIsOpen(true)}
      >
        📖 Reglas
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto ${css.background} ${css.text} rounded-xl shadow-2xl p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Reglas del Juego</h2>
          <button
            className={`px-3 py-1 ${css.secondary} ${css.secondaryHover} ${css.text} rounded-lg font-medium`}
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-semibold mb-3">🎯 Objetivo</h3>
            <p className="opacity-90">
              Los civiles deben identificar y eliminar al impostor mediante votaciones. 
              El impostor debe eliminar a los civiles sin ser descubierto.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">👥 Roles</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-700">
                <strong className="text-blue-300">👤 Civiles:</strong>
                <p className="mt-1 opacity-90">
                  Reciben una palabra secreta. Deben descubrir quién no la conoce.
                </p>
              </div>
              <div className="p-3 bg-red-900/30 rounded-lg border border-red-700">
                <strong className="text-red-300">👹 Impostor:</strong>
                <p className="mt-1 opacity-90">
                  No recibe palabra. Debe actuar como si la conociera y eliminar a los civiles.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">🔄 Flujo del Juego</h3>
            <ol className="list-decimal list-inside space-y-2 opacity-90">
              <li>El host inicia la partida</li>
              <li>Se distribuyen las palabras a los civiles</li>
              <li>Los jugadores se presentan y describen su palabra</li>
              <li>Votación para eliminar a un sospechoso</li>
              <li>Se revela si el eliminado era impostor o civil</li>
              <li>La partida continúa hasta que un equipo gane</li>
            </ol>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">🏆 Condiciones de Victoria</h3>
            <div className="space-y-2">
              <p className="opacity-90"><strong className="text-blue-300">Victoria Civil:</strong> Se elimina al impostor</p>
              <p className="opacity-90"><strong className="text-red-300">Victoria Impostor:</strong> Los impostores igualan o superan en número a los civiles</p>
              <p className="opacity-90"><strong className="text-purple-300">Victoria del Caos:</strong> Queda 1 civil vs 1 impostor</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">⚡ Reglas Especiales</h3>
            <ul className="list-disc list-inside space-y-1 opacity-90">
              <li>Si hay empate en votación dos veces, activa "Muerte Súbita"</li>
              <li>En Muerte Súbita, el caos puede eliminar jugadores aleatoriamente</li>
              <li>El host puede iniciar rondas adicionales o terminar el juego</li>
              <li>El chat está disponible según el modo de juego seleccionado</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-3">💡 Consejos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-800/50 rounded">
                <strong className="text-blue-300">Para Civiles:</strong>
                <p className="mt-1 text-sm opacity-90">
                  Presten atención a quién duda al describir su palabra.
                </p>
              </div>
              <div className="p-3 bg-gray-800/50 rounded">
                <strong className="text-red-300">Para Impostor:</strong>
                <p className="mt-1 text-sm opacity-90">
                  Observen las descripciones para adivinar la palabra secreta.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
