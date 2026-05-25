/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CircuitComponent, ComponentType, SolverResult } from '../types';
import { Trash2, VoltMeterSymbol, AmmeterSymbol } from 'lucide-react'; // We can draw customs easily

interface CircuitCanvasProps {
  components: CircuitComponent[];
  setComponents: React.Dispatch<React.SetStateAction<CircuitComponent[]>>;
  solverResult: SolverResult;
  selectedComponent: CircuitComponent | null;
  setSelectedComponent: (c: CircuitComponent | null) => void;
  selectedType: ComponentType | null;
  setSelectedType: (type: ComponentType | null) => void;
  flowMode: 'conventional' | 'electron';
  isRunning: boolean;
}

const COLS = 11;
const ROWS = 7;
const CELL_SIZE = 60;
const PADDING = 40;

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  components,
  setComponents,
  solverResult,
  selectedComponent,
  setSelectedComponent,
  selectedType,
  setSelectedType,
  flowMode,
  isRunning,
}) => {
  const [startNode, setStartNode] = useState<{ x: number; y: number } | null>(null);
  const [hoverNode, setHoverNode] = useState<{ x: number; y: number } | null>(null);
  const [electronOffset, setElectronOffset] = useState(0);

  // Animación suave de electrones fluyendo
  useEffect(() => {
    if (!isRunning) return;
    let animId: number;
    const updateOffset = () => {
      setElectronOffset((prev) => (prev + 1.2) % 100);
      animId = requestAnimationFrame(updateOffset);
    };
    animId = requestAnimationFrame(updateOffset);
    return () => cancelAnimationFrame(animId);
  }, [isRunning]);

  // Manejar el clic en un nodo de la rejilla
  const handleNodeClick = (x: number, y: number) => {
    if (!selectedType) return;

    if (!startNode) {
      // Registrar el primer punto de conexión
      setStartNode({ x, y });
    } else {
      // Segundo punto de conexión. Evitar colocar en el mismo punto
      if (startNode.x === x && startNode.y === y) {
        setStartNode(null);
        return;
      }

      // Validar conexión estrictamente horizontal o vertical para un diagrama limpio
      const isHorizontal = startNode.y === y;
      const isVertical = startNode.x === x;

      if (!isHorizontal && !isVertical) {
        // No es recto, cancelar el primer punto o actualizarlo al actual
        setStartNode({ x, y });
        return;
      }

      // Ordenar coordenadas de izquierda a derecha o de arriba a abajo
      let x1 = startNode.x;
      let y1 = startNode.y;
      let x2 = x;
      let y2 = y;

      // Unicidad de componente: no permitir el mismo componente exactamente duplicado
      const duplicate = components.find(
        (c) =>
          ((c.x1 === x1 && c.y1 === y1 && c.x2 === x2 && c.y2 === y2) ||
            (c.x1 === x2 && c.y1 === y2 && c.x2 === x1 && c.y2 === y1))
      );

      if (duplicate) {
        setStartNode(null);
        return;
      }

      // Valores predeterminados por componente
      let defaultValue = 10; // 10 ohms para resistencia y bombilla
      if (selectedType === 'battery') defaultValue = 9; // 9V por defecto
      if (selectedType === 'fuse') defaultValue = 2; // 2A por defecto
      if (selectedType === 'wire') defaultValue = 0; // 0 ohm

      let name = '';
      switch (selectedType) {
        case 'wire': name = 'Cable'; break;
        case 'battery': name = 'Batería'; break;
        case 'resistor': name = 'Resistencia'; break;
        case 'bulb': name = 'Bombilla'; break;
        case 'switch': name = 'Interruptor'; break;
        case 'led': name = 'LED'; break;
        case 'fuse': name = 'Fusible'; break;
        case 'voltmeter': name = 'Voltímetro'; break;
        case 'ammeter': name = 'Amperímetro'; break;
      }

      const newComp: CircuitComponent = {
        id: `${selectedType}_${Date.now()}`,
        type: selectedType,
        x1,
        y1,
        x2,
        y2,
        value: defaultValue,
        isOpen: selectedType === 'switch' ? true : undefined,
        isBlown: selectedType === 'fuse' ? false : undefined,
        name,
      };

      setComponents((prev) => [...prev, newComp]);
      setStartNode(null);
      setSelectedType(null); // Desactivar herramienta tras colocar para un flujo guiado
    }
  };

  const deleteComponent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setComponents((prev) => prev.filter((c) => c.id !== id));
    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
  };

  // Convertir coordenadas lógicas en píxeles del SVG
  const getPixels = (x: number, y: number) => {
    return {
      cx: PADDING + x * CELL_SIZE,
      cy: PADDING + y * CELL_SIZE,
    };
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Caja contenedora del Canvas */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-inner relative select-none overflow-x-auto">
        <svg
          className="w-full min-w-[700px] h-[480px] text-zinc-600 block"
          viewBox={`0 0 ${PADDING * 2 + (COLS - 1) * CELL_SIZE} ${PADDING * 2 + (ROWS - 1) * CELL_SIZE}`}
        >
          {/* Rejilla de fondo */}
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glow-led" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Líneas auxiliares de la cuadrícula táctil */}
          {Array.from({ length: ROWS }).map((_, rIdx) => (
            <line
              key={`grid-h-${rIdx}`}
              x1={PADDING}
              y1={PADDING + rIdx * CELL_SIZE}
              x2={PADDING + (COLS - 1) * CELL_SIZE}
              y2={PADDING + rIdx * CELL_SIZE}
              stroke="#27272a"
              strokeWidth="0.5"
              strokeDasharray="2 4"
            />
          ))}
          {Array.from({ length: COLS }).map((_, cIdx) => (
            <line
              key={`grid-v-${cIdx}`}
              x1={PADDING + cIdx * CELL_SIZE}
              y1={PADDING}
              x2={PADDING + cIdx * CELL_SIZE}
              y2={PADDING + (ROWS - 1) * CELL_SIZE}
              stroke="#27272a"
              strokeWidth="0.5"
              strokeDasharray="2 4"
            />
          ))}

          {/* Dibujo de los electrones/corriente activa en flujo */}
          {isRunning &&
            components.map((c) => {
              const current = solverResult.componentCurrents?.[c.id] || 0;
              if (Math.abs(current) < 1e-4) return null;

              const p1 = getPixels(c.x1, c.y1);
              const p2 = getPixels(c.x2, c.y2);

              // Sentido de la corriente física: del mas positivo (+) al mas negativo (-)
              // O sea, el signo de current nos dice si viaja de coord1 a coord2.
              // Para 'conventional' usamos corriente convencional + a -
              // Para 'electron' invertimos la velocidad
              const direction = flowMode === 'conventional' ? Math.sign(current) : -Math.sign(current);

              const speedFactor = Math.min(6, Math.max(1, Math.abs(current) * 4));
              const animOffset = (electronOffset * speedFactor * direction) % 30;

              return (
                <line
                  key={`electron-path-${c.id}`}
                  x1={p1.cx}
                  y1={p1.cy}
                  x2={p2.cx}
                  y2={p2.cy}
                  stroke="#fbbf24"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="5 20"
                  strokeDashoffset={animOffset}
                  className="opacity-75"
                />
              );
            })}

          {/* Dibujo de Componentes del circuito */}
          {components.map((c) => {
            const p1 = getPixels(c.x1, c.y1);
            const p2 = getPixels(c.x2, c.y2);

            const dx = p2.cx - p1.cx;
            const dy = p2.cy - p1.cy;
            const midX = p1.cx + dx / 2;
            const midY = p1.cy + dy / 2;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

            const isSelected = selectedComponent?.id === c.id;
            const current = solverResult.componentCurrents?.[c.id] || 0;
            const vDrop = solverResult.componentVoltages?.[c.id] || 0;

            return (
              <g
                key={c.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedComponent(c);
                  setSelectedType(null); // Desactivar modo de dibujo
                  setStartNode(null);
                }}
                className="group/comp cursor-pointer"
              >
                {/* Caja invisible para facilitar clic sobre el componente */}
                <line
                  x1={p1.cx}
                  y1={p1.cy}
                  x2={p2.cx}
                  y2={p2.cy}
                  stroke="transparent"
                  strokeWidth="16"
                  className="cursor-pointer"
                />

                {/* Línea soporte central (atraviesa el cuerpo completo del elemento) */}
                <line
                  x1={p1.cx}
                  y1={p1.cy}
                  x2={p2.cx}
                  y2={p2.cy}
                  stroke={isSelected ? '#f59e0b' : '#3f3f46'}
                  strokeWidth={isSelected ? '3.5' : '2.5'}
                  className="transition-colors group-hover/comp:stroke-zinc-400"
                />

                {/* Representación gráfica según componente */}
                <g transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
                  {/* Fondo neutral detrás del símbolo para rellenar vacíos */}
                  <rect x="-14" y="-12" width="28" height="24" fill="#09090b" rx="2" stroke="none" />

                  {c.type === 'battery' && (
                    <g className="text-zinc-100">
                      {/* Terminales positivo (+) y negativo (-) */}
                      {/* Pila larga/fina en ánodo (+) y corta/gruesa en cátodo (-) */}
                      <line x1="-8" y1="-10" x2="-8" y2="10" stroke="currentColor" strokeWidth="2.5" />
                      <line x1="-3" y1="-5" x2="-3" y2="5" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="2" y1="-10" x2="2" y2="10" stroke="#f59e0b" strokeWidth="3" />
                      <line x1="7" y1="-5" x2="7" y2="5" stroke="currentColor" strokeWidth="1.5" />
                      {/* Indicador de polos */}
                      <text x="-13" y="-12" fontSize="7" fill="#fbbf24" fontWeight="bold">+</text>
                      <text x="10" y="-12" fontSize="7" fill="#cbd5e1">-</text>
                    </g>
                  )}

                  {c.type === 'resistor' && (
                    <path
                      d="M -15 0 L -10 -4 L -5 4 L 0 -4 L 5 4 L 10 -4 L 15 0"
                      fill="none"
                      stroke={isSelected ? '#f59e0b' : '#d4d4d8'}
                      strokeWidth="2.5"
                    />
                  )}

                  {c.type === 'bulb' && (
                    <g>
                      {/* Efecto de resplandor de luz si brilla */}
                      {isRunning && Math.abs(current) > 0.05 && (
                        <circle
                          cx="0"
                          cy="0"
                          r="20"
                          fill="url(#glow)"
                          className="animate-pulse transition-all duration-300"
                        />
                      )}
                      <circle
                        cx="0"
                        cy="0"
                        r="8.5"
                        fill="none"
                        stroke={isRunning && Math.abs(current) > 0.05 ? '#f59e0b' : '#a1a1aa'}
                        strokeWidth="2.5"
                      />
                      <line x1="-5.5" y1="-5.5" x2="5.5" y2="5.5" stroke="#a1a1aa" strokeWidth="1.5" />
                      <line x1="-5.5" y1="5.5" x2="5.5" y2="-5.5" stroke="#a1a1aa" strokeWidth="1.5" />
                    </g>
                  )}

                  {c.type === 'switch' && (
                    <g>
                      <circle cx="-10" cy="0" r="2.5" fill="#a1a1aa" />
                      <circle cx="10" cy="0" r="2.5" fill="#a1a1aa" />
                      {c.isOpen ? (
                        // Interruptor abierto: leva levantada
                        <line x1="-10" y1="0" x2="8" y2="-10" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
                      ) : (
                        // Interruptor cerrado
                        <line x1="-10" y1="0" x2="10" y2="0" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                      )}
                    </g>
                  )}

                  {c.type === 'led' && (
                    <g>
                      {/* Efecto resplandor azul LED */}
                      {isRunning && Math.abs(current) > 0.005 && (
                        <circle
                          cx="0"
                          cy="0"
                          r="18"
                          fill="url(#glow-led)"
                          className="animate-pulse"
                        />
                      )}
                      <polygon
                        points="-7,-6 5,0 -7,6"
                        fill={isRunning && Math.abs(current) > 0.005 ? '#3b82f6' : 'none'}
                        stroke={isRunning && Math.abs(current) > 0.005 ? '#3b82f6' : '#a1a1aa'}
                        strokeWidth="2"
                      />
                      <line
                        x1="5"
                        y1="-6"
                        x2="5"
                        y2="6"
                        stroke={isRunning && Math.abs(current) > 0.005 ? '#3b82f6' : '#a1a1aa'}
                        strokeWidth="2.5"
                      />
                      {/* Flechas de emisión lumínica */}
                      <path d="M -2 -8 L 1 -11 M 1 -8 L 4 -11" stroke="#3b82f6" strokeWidth="1" />
                    </g>
                  )}

                  {c.type === 'fuse' && (
                    <g>
                      <rect x="-11" y="-5.5" width="22" height="11" fill="none" stroke="#71717a" strokeWidth="1.5" rx="1" />
                      {c.isBlown ? (
                        // Cortado por sobrecarga
                        <path d="M -11 0 L -3 0 M 3 0 L 11 0" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="1 2" />
                      ) : (
                        // Conductor sin fundir
                        <path d="M -11 0 C -5 -4, 5 4, 11 0" fill="none" stroke="#10b981" strokeWidth="1.5" />
                      )}
                    </g>
                  )}

                  {c.type === 'voltmeter' && (
                    <g>
                      <circle cx="0" cy="0" r="9" fill="#18181b" stroke="#06b6d4" strokeWidth="2" />
                      {/* Muestra lectura resumida en escala vertical siempre */}
                      <text x="-3.5" y="3.5" fontSize="10" fontWeight="bold" fill="#06b6d4" transform="rotate(270)">V</text>
                    </g>
                  )}

                  {c.type === 'ammeter' && (
                    <g>
                      <circle cx="0" cy="0" r="9" fill="#18181b" stroke="#ec4899" strokeWidth="2" />
                      <text x="-3.5" y="3" fontSize="10" fontWeight="bold" fill="#ec4899" transform="rotate(270)">A</text>
                    </g>
                  )}
                </g>

                {/* Etiquetas de valores en tiempo real sobre o bajo los componentes */}
                <g transform={`translate(${midX}, ${midY + (angle === 0 ? 18 : -18)})`}>
                  <rect x="-30" y="-7.5" width="60" height="15" fill="#09090b" fillOpacity="0.85" rx="3" stroke="#27272a" strokeWidth="0.5" />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="500"
                    fill="#e4e4e7"
                    className="font-mono tracking-tight"
                  >
                    {c.type === 'battery' && `${c.value.toFixed(1)}V`}
                    {c.type === 'resistor' && `${c.value}Ω`}
                    {c.type === 'bulb' && `${c.value}Ω`}
                    {c.type === 'fuse' && `Fus. ${c.value}A`}
                    {c.type === 'switch' && (c.isOpen ? 'Abierto' : 'Cerrado')}
                    {c.type === 'led' && 'LED'}
                    {c.type === 'wire' && 'Cable'}
                    {c.type === 'voltmeter' && (isRunning ? `${Math.abs(vDrop).toFixed(2)}V` : '-- V')}
                    {c.type === 'ammeter' && (isRunning ? `${Math.abs(current).toFixed(3)}A` : '-- A')}
                  </text>
                </g>

                {/* Botón flotante para eliminar componente cuando se selecciona */}
                {isSelected && (
                  <g transform={`translate(${midX + 22}, ${midY - 22})`}>
                    <circle
                      cx="0"
                      cy="0"
                      r="9.5"
                      fill="#f43f5e"
                      className="hover:fill-red-500 cursor-pointer active:scale-95 transition-all text-white"
                      onClick={(e) => deleteComponent(c.id, e)}
                    />
                    <path
                      d="M -4 -4 L 4 4 M -4 4 L 4 -4"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="pointer-events-none"
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Gráfico auxiliar interactivo del modo de dibujo del componente */}
          {startNode && (
            <g>
              <circle
                cx={PADDING + startNode.x * CELL_SIZE}
                cy={PADDING + startNode.y * CELL_SIZE}
                r="11"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                className="animate-ping"
              />
              <circle
                cx={PADDING + startNode.x * CELL_SIZE}
                cy={PADDING + startNode.y * CELL_SIZE}
                r="5"
                fill="#fbbf24"
              />
            </g>
          )}

          {/* Rejilla de nodos o botones de conexión (estilo protoboard / breadboard) */}
          {Array.from({ length: ROWS }).map((_, rIdx) =>
            Array.from({ length: COLS }).map((_, cIdx) => {
              const nodeX = PADDING + cIdx * CELL_SIZE;
              const nodeY = PADDING + rIdx * CELL_SIZE;
              const isStart = startNode && startNode.x === cIdx && startNode.y === rIdx;

              // Encontrar si este nodo forma parte del trazo de conexión (rectilineo)
              let isCandidate = false;
              if (startNode && !isStart) {
                const isH = startNode.y === rIdx;
                const isV = startNode.x === cIdx;
                if (isH || isV) isCandidate = true;
              }

              return (
                <circle
                  key={`node-dot-${cIdx}-${rIdx}`}
                  cx={nodeX}
                  cy={nodeY}
                  r={isStart ? '6' : isCandidate ? '4.5' : '3.5'}
                  fill={isStart ? '#fbbf24' : isCandidate ? '#451a03' : '#18181b'}
                  stroke={isStart ? '#fbbf24' : isCandidate ? '#fbbf24' : '#3f3f46'}
                  strokeWidth="1.5"
                  className="transition-all hover:scale-150 hover:fill-amber-500 hover:stroke-amber-400 cursor-pointer duration-100"
                  onClick={() => handleNodeClick(cIdx, rIdx)}
                  onMouseEnter={() => setHoverNode({ x: cIdx, y: rIdx })}
                  onMouseLeave={() => setHoverNode(null)}
                />
              );
            })
          )}
        </svg>

        {/* Leyenda rápida flotante en la esquina */}
        <div className="absolute top-4 right-4 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1.5 rounded-md text-[10px] text-zinc-400 font-mono flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-ping"></span>
            Luz Amarilla: Corriente
          </span>
          <span>•</span>
          <span>Red: Rejilla Táctil {COLS}x{ROWS}</span>
        </div>
      </div>
    </div>
  );
};
