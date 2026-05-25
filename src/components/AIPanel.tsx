/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, CircuitComponent, SolverResult } from '../types';
import { MessageSquare, Send, Sparkles, GraduationCap } from 'lucide-react';

interface AIPanelProps {
  currentCircuit: CircuitComponent[];
  solverResult: SolverResult;
}

// Convertidor sencillo de Markdown a elementos de React estilizados (seguro y compatible con React 19 sin librerías externas)
const formatMarkdownText = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Reemplazar texto en negrita: **texto**
    const boldRegex = /\*\*(.*?)\*\*/g;
    let renderedLine: React.ReactNode = line;

    // Detectar si es una línea de código o formula
    if (line.startsWith('```') || line.endsWith('```')) {
      return null; // Omitimos las marcas de código delimitadas
    }

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // Reemplazar simples negritas inline
    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        segments.push(line.substring(lastIndex, match.index));
      }
      segments.push(
        <strong key={match.index} className="font-bold text-amber-400">
          {match[1]}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < line.length) {
      segments.push(line.substring(lastIndex));
    }

    if (segments.length > 0) {
      renderedLine = segments;
    }

    // Cabeceras: ### o ##
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-sm font-bold text-amber-500 mt-3 mb-1.5 tracking-tight uppercase">
          {line.substring(4)}
        </h4>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h3 key={idx} className="text-base font-bold text-zinc-100 mt-4 mb-2 border-l-2 border-amber-500 pl-2">
          {line.substring(3)}
        </h3>
      );
    }

    // Listas: * o -
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      return (
        <li key={idx} className="text-xs text-zinc-350 list-none pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-amber-500 mb-1 leading-relaxed">
          {renderedLine}
        </li>
      );
    }

    // Fórmulas o bloques destacados
    if (line.trim().startsWith('$$') || line.trim().startsWith('$')) {
      return (
        <div key={idx} className="my-2 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-900 font-mono text-xs text-amber-200 text-center select-all">
          {line.replace(/\$/g, '')}
        </div>
      );
    }

    // Párrafo estándar
    if (line.trim() === '') return <div key={idx} className="h-2" />;
    return (
      <p key={idx} className="text-xs text-zinc-350 leading-relaxed mb-1.5">
        {renderedLine}
      </p>
    );
  });
};

export const AIPanel: React.FC<AIPanelProps> = ({
  currentCircuit,
  solverResult,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '¡Hola! Soy tu **Tutor de Inteligencia Artificial**. Estoy aquí para ayudarte a comprender las leyes de la física detrás de tus circuitos.\n\nPuedes hacerme preguntas académicas de electricidad, o hacer clic en **"Analizar mi Circuito Actual"** para que resuelva contigo los voltajes y corientes exactos del esquema. ¿Por dónde empezamos?',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Desplazar chat hacia abajo progresivamente
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}_user`,
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Filtrar historia reciente para no sobrecargar de contexto
      const recentHistory = messages.slice(-8).map((msg) => ({
        role: msg.role,
        text: msg.text,
      }));

      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          history: recentHistory,
          currentCircuit,
          solverResult,
        }),
      });

      const data = await res.json();

      const modelMsg: ChatMessage = {
        id: `${Date.now()}_model`,
        role: 'model',
        text: data.text || 'Lamento no haber podido procesar la pregunta.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}_err`,
          role: 'model',
          text: '❌ Ha habido un problema para conectar con el servidor de tutoría de Gemini. Por favor, asegúrate de que el servidor esté activo.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    handleSendMessage(q);
  };

  const handleAnalyzeCircuit = () => {
    if (currentCircuit.length === 0) {
      handleSendMessage('Profesor, ¿podría sugerirme un circuito interesante para simular en el canvas? No tengo ninguno colocado todavía.');
    } else {
      handleSendMessage('Por favor, analiza técnicamente mi circuito colocado en pantalla. Explícame paso a paso cómo calcular los voltajes de los nodos y flujos de corriente.');
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl text-zinc-100 flex flex-col h-[580px]">
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-amber-500 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500">Asistente Tutor con IA</h2>
            <p className="text-[10px] text-zinc-400">Por Gemini 3.5. Analiza diagramas y fórmulas de laboratorio en vivo.</p>
          </div>
        </div>

        <button
          onClick={handleAnalyzeCircuit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/10 border border-amber-500/40 text-amber-400 rounded-lg text-xs hover:bg-amber-600/25 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Analizar mi Circuito con IA</span>
        </button>
      </div>

      {/* Historial de Mensajes Scrollable */}
      <div
        ref={scrollRef}
        className="grow overflow-y-auto my-4 pr-2 space-y-4 max-h-[350px] scrollbar-thin"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${
              msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            <span className="text-[9px] text-zinc-500 mb-1">
              {msg.role === 'user' ? 'Tú (Estudiante)' : 'Profesor Virtual (IA)'}
            </span>
            <div
              className={`rounded-2xl p-3.5 text-sm leading-relaxed border ${
                msg.role === 'user'
                  ? 'bg-amber-600/10 border-amber-500/30 text-zinc-200 rounded-tr-none'
                  : 'bg-zinc-950 border-zinc-850/80 text-zinc-300 rounded-tl-none'
              }`}
            >
              <div className="space-y-1">{formatMarkdownText(msg.text)}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start max-w-[85%] mr-auto">
            <span className="text-[9px] text-zinc-500 mb-1">Profesor Virtual (IA)</span>
            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl rounded-tl-none p-3.5 text-xs text-zinc-400 flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]"></span>
              </span>
              <span>Tutor calculando tensiones y repasando Ley de Ohm...</span>
            </div>
          </div>
        )}
      </div>

      {/* Sugerencias de Preguntas Académicas Rápidas */}
      <div className="border-t border-zinc-800/80 pt-3 flex flex-col gap-2">
        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold font-mono">Preguntas académicas frecuentes:</span>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            '¿Qué dice exactamente la Ley de Ohm?',
            '¿Cuál es la diferencia entre serie y paralelo?',
            '¿Por qué explota una batería en cortocircuito?',
            '¿Cómo calculo la potencia de una bombilla?',
          ].map((q) => (
            <button
              key={q}
              onClick={() => handleQuickQuestion(q)}
              disabled={isLoading}
              className="text-[10px] text-left text-zinc-400 bg-zinc-950 border border-zinc-900 rounded-lg p-2 hover:border-zinc-750 hover:text-zinc-200 transition truncate cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✏️ {q}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario de Entrada */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="flex items-center gap-2 mt-4"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Haz una pregunta académica o sobre tu circuito actual..."
          disabled={isLoading}
          className="grow bg-zinc-950 text-xs text-zinc-100 border border-zinc-850 rounded-lg py-3 px-4 focus:outline-none focus:border-amber-500 placeholder-zinc-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-3 bg-amber-600 hover:bg-amber-500 text-zinc-950 rounded-lg transition-colors active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
