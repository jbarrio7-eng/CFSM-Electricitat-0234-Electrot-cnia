/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ComponentType } from '../types';

interface ComponentPaletteProps {
  selectedType: ComponentType | null;
  setSelectedType: (type: ComponentType | null) => void;
}

interface ComponentItem {
  type: ComponentType;
  label: string;
  desc: string;
  symbol: React.ReactNode;
  defaultValue: string;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  selectedType,
  setSelectedType,
}) => {
  const items: ComponentItem[] = [
    {
      type: 'wire',
      label: 'Cable Conductor',
      desc: 'Une puntos de conexión con resistencia cero ohms.',
      defaultValue: '0 Ω',
      symbol: (
        <svg className="w-12 h-6" viewBox="0 0 50 20">
          <line x1="0" y1="10" x2="50" y2="10" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      ),
    },
    {
      type: 'battery',
      label: 'Pila / Batería',
      desc: 'Fuente de tensión de corriente continua (DC).',
      defaultValue: '1.5V - 120V',
      symbol: (
        <svg className="w-12 h-6" viewBox="0 0 50 20">
          <line x1="0" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" />
          <line x1="18" y1="4" x2="18" y2="16" stroke="currentColor" strokeWidth="3" />
          <line x1="24" y1="7" x2="24" y2="13" stroke="currentColor" strokeWidth="1.5" />
          <line x1="30" y1="4" x2="30" y2="16" stroke="currentColor" strokeWidth="3" />
          <line x1="36" y1="7" x2="36" y2="13" stroke="currentColor" strokeWidth="1.5" />
          <line x1="36" y1="10" x2="50" y2="10" stroke="currentColor" strokeWidth="2" />
          <text x="12" y="6" fontSize="8" fill="currentColor">+</text>
          <text x="38" y="6" fontSize="8" fill="currentColor">-</text>
        </svg>
      ),
    },
    {
      type: 'resistor',
      label: 'Resistencia',
      desc: 'Disipa calor y limita la corriente del circuito.',
      defaultValue: '10 Ω',
      symbol: (
        <svg className="w-12 h-6" viewBox="0 0 50 20">
          <line x1="0" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="2" />
          <path d="M 12 10 L 15 5 L 20 15 L 25 5 L 30 15 L 35 5 L 38 10" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="38" y1="10" x2="50" y2="10" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    {
      type: 'bulb',
      label: 'Bombilla Lámpara',
      desc: 'Resistencia que emite luz proporcional a la potencia.',
      defaultValue: '10 Ω',
      symbol: (
        <svg className="w-12 h-6" viewBox="0 0 50 20">
          <line x1="0" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" />
          <circle cx="25" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="20" y1="5" x2="30" y2="15" stroke="currentColor" strokeWidth="1.5" />
          <line x1="20" y1="15" x2="30" y2="5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="32" y1="10" x2="50" y2="10" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    {
      type: 'switch',
      label: 'Interruptor',
      desc: 'Controla el encendido abriendo y cerrando el lazo.',
      defaultValue: 'On / Off',
      symbol: (
        <svg className="w-12 h-6" viewBox="0 0 50 20">
          <line x1="0" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="2" />
          <circle cx="15" cy="10" r="2" fill="currentColor" />
          <line x1="15" y1="10" x2="32" y2="3" stroke="currentColor" strokeWidth="2" />
          <circle cx="34" cy="10" r="2" fill="currentColor" />
          <line x1="34" y1="10" x2="50" y2="10" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    {
      type: 'led',
      label: 'Diodo LED',
      desc: 'Emisor de luz polarizado que solo conduce en un sentido.',
      defaultValue: 'Ánodo a (+)',
      symbol: (
        <svg className="w-12 h-6" viewBox="0 0 50 20">
          <line x1="0" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" />
          <polygon points="18,5 30,10 18,15" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="30" y1="5" x2="30" y2="15" stroke="currentColor" strokeWidth="2" />
          <line x1="30" y1="10" x2="50" y2="10" stroke="currentColor" strokeWidth="2" />
          {/* Flechas de luz */}
          <line x1="22" y1="3" x2="26" y2="0" stroke="currentColor" strokeWidth="1" />
          <polygon points="26,0 23,0 26,3" fill="currentColor" />
        </svg>
      ),
    },
    {
      type: 'fuse',
      label: 'Fusible Térmico',
      desc: 'Protección de seguridad. Se funde si supera los Amperios fijados.',
      defaultValue: '2.0A - 10.0A',
      symbol: (
        <svg className="w-12 h-6" viewBox="0 0 50 20">
          <line x1="0" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="2" />
          <rect x="15" y="6" width="20" height="8" fill="none" stroke="currentColor" strokeWidth="1.5" rx="1" />
          <path d="M 15 10 C 20 5, 30 15, 35 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="35" y1="10" x2="50" y2="10" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    {
      type: 'voltmeter',
      label: 'Voltímetro',
      desc: 'Conexión paralela. Mide la diferencia de potencial (V).',
      defaultValue: 'Paralelo',
      symbol: (
        <svg className="w-12 h-6" viewBox="0 0 50 20">
          <line x1="0" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" />
          <circle cx="25" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="21" y="13" fontSize="10" fontWeight="bold" fill="currentColor">V</text>
          <line x1="32" y1="10" x2="50" y2="10" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
    {
      type: 'ammeter',
      label: 'Amperímetro',
      desc: 'Conexión en serie. Mide la intensidad de corriente (A).',
      defaultValue: 'En serie',
      symbol: (
        <svg className="w-12 h-6" viewBox="0 0 50 20">
          <line x1="0" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" />
          <circle cx="25" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="22" y="13" fontSize="10" fontWeight="bold" fill="currentColor">A</text>
          <line x1="32" y1="10" x2="50" y2="10" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl text-zinc-100 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-zinc-300">Herramienta de Montaje</h2>
        <p className="text-xs text-zinc-500 mt-1">Selecciona un elemento y haz clic en dos puntos de la rejilla para conectarlos.</p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
        {items.map((item) => {
          const isSelected = selectedType === item.type;
          return (
            <button
              key={item.type}
              onClick={() => setSelectedType(isSelected ? null : item.type)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all relative cursor-pointer group ${
                isSelected
                  ? 'bg-amber-600/10 border-amber-500/80 text-amber-400'
                  : 'bg-zinc-950 border-zinc-850 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/40'
              }`}
            >
              <div className="grow flex flex-col min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-semibold tracking-wide truncate">{item.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-900 text-zinc-500 group-hover:bg-zinc-800'
                  }`}>
                    {item.defaultValue}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-snug truncate mt-1">{item.desc}</p>
              </div>
              <div className={`shrink-0 flex items-center justify-center p-2 rounded-lg border leading-none ${
                isSelected ? 'bg-amber-500/20 border-amber-500/30' : 'bg-zinc-900 border-zinc-850'
              }`}>
                {item.symbol}
              </div>
            </button>
          );
        })}
      </div>

      {selectedType && (
        <div className="bg-amber-950/10 border border-amber-900/30 rounded-xl p-3 text-xs text-amber-400 animate-pulse">
          <p className="font-semibold">Modo de Dibujo Activo</p>
          <p className="text-amber-500/90 text-[10px] mt-0.5">Haz clic consecutivamente en DOS nodos circulares del canvas para colocar el componente.</p>
        </div>
      )}
    </div>
  );
};
