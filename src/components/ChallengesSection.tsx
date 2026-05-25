/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Challenge, CircuitComponent, SolverResult } from '../types';
import { CHALLENGES } from '../challenges';
import { BookOpen, CheckCircle, Award, HelpCircle, ChevronRight, AlertCircle } from 'lucide-react';

interface ChallengesSectionProps {
  components: CircuitComponent[];
  solverResult: SolverResult;
  onSetComponents: React.Dispatch<React.SetStateAction<CircuitComponent[]>>;
  onLoadTemplate: (templateName: string) => void;
}

export const ChallengesSection: React.FC<ChallengesSectionProps> = ({
  components,
  solverResult,
  onSetComponents,
  onLoadTemplate,
}) => {
  const [activeChallengeId, setActiveChallengeId] = useState<string>(CHALLENGES[0].id);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [showHints, setShowHints] = useState<boolean>(false);

  const activeChallenge = CHALLENGES.find((ch) => ch.id === activeChallengeId) || CHALLENGES[0];

  // Ejecutar validación en tiempo real
  const validation = activeChallenge.validate(components, solverResult);

  // Manejar finalización o marcar reto
  const handleVerify = () => {
    if (validation.success && !completedChallenges.includes(activeChallengeId)) {
      setCompletedChallenges((prev) => [...prev, activeChallengeId]);
    }
  };

  // Guardar estado al validar éxito
  if (validation.success && !completedChallenges.includes(activeChallengeId)) {
    setCompletedChallenges((prev) => [...prev, activeChallengeId]);
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl text-zinc-100 flex flex-col gap-5">
      {/* Cabecera */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <BookOpen className="w-5 h-5 text-amber-500" />
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500">Guía de Laboratorio Práctico</h2>
          <p className="text-[11px] text-zinc-400">Completa los retos experimentales para dominar las leyes de la electricidad.</p>
        </div>
      </div>

      {/* Listado de Retos */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5 google-flow-tabs">
        {CHALLENGES.map((ch, idx) => {
          const isActive = ch.id === activeChallengeId;
          const isDone = completedChallenges.includes(ch.id);
          return (
            <button
              key={ch.id}
              onClick={() => {
                setActiveChallengeId(ch.id);
                setShowHints(false);
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition active:scale-95 cursor-pointer relative ${
                isActive
                  ? 'bg-amber-600/10 border-amber-500 text-amber-400'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {isDone && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-zinc-950 p-0.5 rounded-full z-10">
                  <CheckCircle className="w-3.5 h-3.5 text-zinc-950" fill="currentColor" />
                </span>
              )}
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Paso {idx + 1}</span>
              <span className="text-xs font-semibold tracking-tight leading-snug truncate w-full mt-0.5 px-1">{ch.title.split(':')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Reto Activo Detallado */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-3.5">
        <div className="flex justify-between items-start gap-2">
          <div>
            <span className={`text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-md ${
              activeChallenge.difficulty === 'fácil'
                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                : activeChallenge.difficulty === 'medio'
                ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                : 'bg-red-950/40 text-red-400 border border-red-900/30'
            }`}>
              Dificultad: {activeChallenge.difficulty}
            </span>
            <h3 className="text-sm font-bold text-zinc-200 mt-2">{activeChallenge.title}</h3>
          </div>
          <Award className={`w-6 h-6 shrink-0 ${completedChallenges.includes(activeChallenge.id) ? 'text-amber-500 animate-pulse' : 'text-zinc-700'}`} />
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed font-sans">{activeChallenge.description}</p>

        <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-850/80">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5 flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-amber-500" />
            Instrucciones de Montaje
          </p>
          <p className="text-xs text-zinc-300 leading-relaxed">{activeChallenge.instructions}</p>
        </div>

        {/* Bloque de validación en tiempo real */}
        <div className={`rounded-xl p-3.5 border transition-all ${
          validation.success
            ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-950/10'
            : 'bg-zinc-900 border-zinc-850 text-zinc-300'
        }`}>
          {validation.success ? (
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-300">🎉 ¡COMPLETADO CON ÉXITO!</p>
                <p className="text-xs text-emerald-400/90 leading-relaxed mt-1">{validation.message}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-zinc-400">Verificación del Circuito:</p>
                <p className="text-xs text-zinc-300/90 leading-relaxed mt-1">{validation.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sección de Pistas y Plantilla de ayuda */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            onClick={() => setShowHints(!showHints)}
            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-amber-500 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
            <span>{showHints ? 'Ocultar Pistas Científicas' : 'Ver Pistas de Ayuda'}</span>
          </button>

          <button
            onClick={() => {
              // Mapear id de reto a plantilla compatible
              let templateKey = 'simple';
              if (activeChallenge.id === 'series_circuit') templateKey = 'serie';
              if (activeChallenge.id === 'parallel_circuit') templateKey = 'paralelo';
              if (activeChallenge.id === 'fuse_defense') templateKey = 'proteccion';
              if (activeChallenge.id === 'led_polarity') templateKey = 'led';
              onLoadTemplate(templateKey);
            }}
            className="text-[11px] font-semibold text-amber-500 hover:text-amber-400 transition cursor-pointer border border-amber-600/30 bg-amber-600/5 px-2.5 py-1.5 rounded-lg"
          >
            Cargar Circuito Guía para este Reto
          </button>
        </div>

        {showHints && (
          <div className="bg-zinc-900 border border-zinc-850 rounded-lg p-3 text-xs text-zinc-400 space-y-1.5 max-h-[140px] overflow-y-auto">
            <p className="text-[10px] uppercase font-bold text-zinc-500">Consejos Técnicos:</p>
            {activeChallenge.hints.map((hint, hIdx) => (
              <p key={hIdx} className="leading-snug">💡 {hint}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
