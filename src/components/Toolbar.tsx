/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, RotateCcw, Zap, HelpCircle } from 'lucide-react';

interface ToolbarProps {
  isRunning: boolean;
  setIsRunning: (run: boolean) => void;
  flowMode: 'conventional' | 'electron';
  setFlowMode: (mode: 'conventional' | 'electron') => void;
  onReset: () => void;
  onLoadTemplate: (templateName: string) => void;
  shortCircuit: boolean;
  hasBlownFuse: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  isRunning,
  setIsRunning,
  flowMode,
  setFlowMode,
  onReset,
  onLoadTemplate,
  shortCircuit,
  hasBlownFuse,
}) => {
  return (
    <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Sección de Ejecución y Flujo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium tracking-tight border transition-all cursor-pointer ${
              isRunning
                ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/30'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700/80'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 text-emerald-400" />
                <span>Simulando</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-zinc-400" />
                <span>Pausado</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-300 border border-zinc-800 hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
            title="Borrar todo el circuito"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Limpiar</span>
          </button>
        </div>

        {/* Sentido de la corriente */}
        <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setFlowMode('conventional')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              flowMode === 'conventional'
                ? 'bg-amber-600 text-zinc-950 shadow-md font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Corriente Convencional (+ a -)
          </button>
          <button
            onClick={() => setFlowMode('electron')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              flowMode === 'electron'
                ? 'bg-amber-600 text-zinc-950 shadow-md font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Flujo de Electrones (- a +)
          </button>
        </div>

        {/* Plantillas predefinidas */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium">Ejemplos:</span>
          <select
            onChange={(e) => {
              if (e.target.value) {
                onLoadTemplate(e.target.value);
                e.target.value = ''; // Reset select
              }
            }}
            className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-lg py-1.5 px-3 focus:outline-none focus:border-amber-600"
          >
            <option value="">Selecciona una plantilla...</option>
            <option value="simple">Circuito Simple (Ohm)</option>
            <option value="serie">Circuito en Serie (2 Lámparas)</option>
            <option value="paralelo">Circuito en Paralelo (2 Lámparas)</option>
            <option value="wheatstone">Puente de Wheatstone</option>
            <option value="proteccion">Protección por Fusible</option>
            <option value="led">Diodo LED Polarizado</option>
          </select>
        </div>
      </div>

      {/* Estados del circuito / Avisos de seguridad */}
      {(shortCircuit || hasBlownFuse) && (
        <div className="flex flex-col gap-2 mt-1">
          {shortCircuit && (
            <div className="flex items-center gap-2 bg-red-950/40 text-red-400 border border-red-900/40 px-3 py-2.5 rounded-lg text-sm">
              <Zap className="w-4 h-4 animate-bounce text-red-500 shrink-0" />
              <div>
                <span className="font-semibold block">⚠️ ¡Peligro de Cortocircuito!</span>
                <span className="text-xs text-red-300/95">Los electrones bypassed viajan directamente de positivo a negativo sin carga. Se produce calor extremo y quema la batería. ¡Inserta una resistencia!</span>
              </div>
            </div>
          )}
          {hasBlownFuse && (
            <div className="flex items-center gap-2 bg-amber-950/20 text-amber-500 border border-amber-900/40 px-3 py-2 rounded-lg text-sm">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="font-semibold block">⚡ Fusible Fundido</span>
                <span className="text-xs text-amber-300/90">Un fusible ha cortado el paso porque se excedió el Amperaje máximo seguro (I &gt; I_max). Repara la avería y reestablece el fusible.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
