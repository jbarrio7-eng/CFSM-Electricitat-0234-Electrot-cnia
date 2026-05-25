/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CircuitComponent, SolverResult } from '../types';
import { Settings, RefreshCw, Power } from 'lucide-react';

interface ControlPanelProps {
  selectedComponent: CircuitComponent | null;
  onUpdateComponent: (updated: CircuitComponent) => void;
  solverResult: SolverResult;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedComponent,
  onUpdateComponent,
  solverResult,
}) => {
  if (!selectedComponent) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl text-zinc-100 flex flex-col justify-center items-center h-full min-h-[160px] text-center">
        <Settings className="w-8 h-8 text-zinc-600 mb-2 animate-spin-slow" />
        <h3 className="text-xs font-semibold text-zinc-400">Inspector de Componente</h3>
        <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px]">Haz clic en cualquier elemento del circuito para editar sus propiedades físicas, voltaje o cambiar estados.</p>
      </div>
    );
  }

  const c = selectedComponent;
  const current = solverResult.componentCurrents?.[c.id] || 0;
  const vDrop = solverResult.componentVoltages?.[c.id] || 0;
  const power = solverResult.componentPowers?.[c.id] || 0;

  // Modificar propiedades
  const handleValueChange = (val: number) => {
    onUpdateComponent({
      ...c,
      value: val,
    });
  };

  const toggleSwitch = () => {
    if (c.type === 'switch') {
      onUpdateComponent({
        ...c,
        isOpen: !c.isOpen,
      });
    }
  };

  const resetFuse = () => {
    if (c.type === 'fuse') {
      onUpdateComponent({
        ...c,
        isBlown: false,
      });
    }
  };

  const flipPolarity = () => {
    onUpdateComponent({
      ...c,
      x1: c.x2,
      y1: c.y2,
      x2: c.x1,
      y2: c.y1,
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl text-zinc-100 flex flex-col gap-4">
      {/* Encabezado */}
      <div className="border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">Inspector de Componente</h3>
        </div>
        <p className="text-xs font-semibold text-zinc-200 mt-1">{c.name} (ID: {c.id.split('_')[0]})</p>
      </div>

      {/* Editor de Atributos */}
      <div className="space-y-4">
        {c.type === 'battery' && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-medium text-zinc-400">
              <span>Voltaje / Tensión de Fuente:</span>
              <span className="text-amber-400 font-mono font-bold">{c.value.toFixed(1)} V</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="120"
              step="1.5"
              value={c.value}
              onChange={(e) => handleValueChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-ew-resize h-1.5 bg-zinc-950 rounded-lg appearance-none"
            />
            <div className="grid grid-cols-4 gap-1 mt-1 text-center">
              {[3, 9, 24, 110].map((v) => (
                <button
                  key={v}
                  onClick={() => handleValueChange(v)}
                  className={`text-[10px] py-1 rounded border font-mono transition cursor-pointer ${
                    c.value === v
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  {v}V
                </button>
              ))}
            </div>
            <button
              onClick={flipPolarity}
              className="mt-2 flex items-center justify-center gap-1 text-[10px] bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-amber-500" />
              <span>Invertir Polos (+ / -)</span>
            </button>
          </div>
        )}

        {(c.type === 'resistor' || c.type === 'bulb') && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-medium text-zinc-400">
              <span>Valor de Resistencia:</span>
              <span className="text-amber-400 font-mono font-bold">{c.value} Ω</span>
            </div>
            <input
              type="range"
              min="1"
              max="500"
              step="1"
              value={c.value}
              onChange={(e) => handleValueChange(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-ew-resize h-1.5 bg-zinc-950 rounded-lg appearance-none"
            />
            <div className="grid grid-cols-4 gap-1 mt-1 text-center">
              {[5, 10, 50, 220].map((r) => (
                <button
                  key={r}
                  onClick={() => handleValueChange(r)}
                  className={`text-[10px] py-1 rounded border font-mono transition cursor-pointer ${
                    c.value === r
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  {r}Ω
                </button>
              ))}
            </div>
          </div>
        )}

        {c.type === 'switch' && (
          <div className="flex flex-col gap-2.5">
            <span className="text-xs text-zinc-400 font-medium">Estado del Interruptor:</span>
            <button
              onClick={toggleSwitch}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border font-semibold text-sm transition-all active:scale-95 cursor-pointer ${
                c.isOpen
                  ? 'bg-red-950/20 border-red-900/40 text-red-500 hover:bg-red-900/20'
                  : 'bg-emerald-950/20 border-emerald-950 text-emerald-400 hover:bg-emerald-900/30'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{c.isOpen ? 'Cerrar Interruptor (ON)' : 'Abrir Interruptor (OFF)'}</span>
            </button>
          </div>
        )}

        {c.type === 'fuse' && (
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between text-xs font-medium text-zinc-400">
              <span>Límite de Corriente (Amperaje):</span>
              <span className="text-amber-400 font-mono font-bold">{c.value.toFixed(1)} A</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="15"
              step="0.5"
              value={c.value}
              onChange={(e) => handleValueChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-ew-resize h-1.5 bg-zinc-950 rounded-lg appearance-none"
            />

            {c.isBlown ? (
              <div className="flex flex-col gap-2 bg-red-950/40 border border-red-900/40 rounded-lg p-3 mt-1">
                <span className="text-xs text-red-400 font-semibold block">💥 ¡FUSIBLE FUNDIDO!</span>
                <span className="text-[10px] text-red-300/80 leading-snug">La sobrecorriente superó el límite fijado. Repara el problema en el lazo y presiona restablecer.</span>
                <button
                  onClick={resetFuse}
                  className="mt-2 text-[10px] font-bold py-1 px-3 bg-red-600/30 text-white border border-red-500 rounded hover:bg-red-500/80 transition cursor-pointer"
                >
                  Restablecer Hilo Fusible
                </button>
              </div>
            ) : (
              <div className="bg-emerald-950/10 border border-emerald-900/20 rounded-lg p-2.5 text-[10px] text-emerald-400">
                ✔️ Fusible operativo. Conducirá de forma segura hasta {c.value}A.
              </div>
            )}
          </div>
        )}

        {c.type === 'led' && (
          <div className="flex flex-col gap-2">
            <button
              onClick={flipPolarity}
              className="flex items-center justify-center gap-1 text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
              <span>Girar LED (Cambiar Sentido)</span>
            </button>
            <p className="text-[10px] text-zinc-500 leading-snug text-center mt-1">El terminal izquierdo (x1, y1) es el Ánodo (+) y el derecho (x2, y2) es el Cátodo (-).</p>
          </div>
        )}

        {c.type === 'wire' && (
          <p className="text-[11px] text-zinc-500 leading-relaxed bg-zinc-950 p-2.5 border border-zinc-850 rounded-lg">Este es un conducto ideal de cobre de 0 ohmios de resistencia. No genera caídas de tensión (V_drop = 0) y transporta los electrones de forma fluida.</p>
        )}
      </div>

      {/* Mediciones de Física en tiempo real */}
      <div className="border-t border-zinc-800 pt-3 mt-1 space-y-2">
        <h4 className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Parámetros Eléctricos Teóricos</h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-zinc-950 p-2 rounded border border-zinc-850">
            <span className="text-[9px] text-zinc-500 block">Tensión (V)</span>
            <span className="text-xs font-mono font-bold text-cyan-400">{Math.abs(vDrop).toFixed(3)} V</span>
          </div>
          <div className="bg-zinc-950 p-2 rounded border border-zinc-850">
            <span className="text-[9px] text-zinc-500 block">Corriente (I)</span>
            <span className="text-xs font-mono font-bold text-pink-400">{Math.abs(current).toFixed(3)} A</span>
          </div>
          <div className="bg-zinc-950 p-2 rounded border border-zinc-850">
            <span className="text-[9px] text-zinc-500 block">Potencia (P)</span>
            <span className="text-xs font-mono font-bold text-yellow-500">{power.toFixed(3)} W</span>
          </div>
        </div>
      </div>
    </div>
  );
};
