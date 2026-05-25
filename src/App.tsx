/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { CircuitComponent, ComponentType, SolverResult } from './types';
import { solveCircuit } from './circuitSolver';
import { Toolbar } from './components/Toolbar';
import { ComponentPalette } from './components/ComponentPalette';
import { CircuitCanvas } from './components/CircuitCanvas';
import { ControlPanel } from './components/ControlPanel';
import { ChallengesSection } from './components/ChallengesSection';
import { AIPanel } from './components/AIPanel';
import { Lightbulb, Info, AlertTriangle, Cpu } from 'lucide-react';

export default function App() {
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<CircuitComponent | null>(null);
  const [selectedType, setSelectedType] = useState<ComponentType | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(true); // Simulación corriendo por defecto
  const [flowMode, setFlowMode] = useState<'conventional' | 'electron'>('conventional');

  // Inicializar con la primera plantilla ejemplo para que la pantalla no aparezca vacía y guíe al estudiante
  useEffect(() => {
    loadTemplate('simple');
  }, []);

  // Calcular la MNA (Nodal Analysis) del circuito en tiempo real reactivamente
  const solverResult = useMemo(() => {
    return solveCircuit(components);
  }, [components]);

  // Si un elemento seleccionado cambia de ID, actualizamos la referencia de inspección
  const activeSelectedComponent = useMemo(() => {
    if (!selectedComponent) return null;
    return components.find((c) => c.id === selectedComponent.id) || null;
  }, [components, selectedComponent]);

  // Manejar actualizaciones en los valores de componentes (ej: slider del inspector)
  const handleUpdateComponent = (updated: CircuitComponent) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const hasBlownFuse = useMemo(() => {
    return components.some((c) => c.type === 'fuse' && c.isBlown);
  }, [components]);

  const handleReset = () => {
    setComponents([]);
    setSelectedComponent(null);
    setSelectedType(null);
  };

  // Cargar plantillas de diagramas eléctricos
  const loadTemplate = (templateName: string) => {
    handleReset();
    let tempComponents: CircuitComponent[] = [];

    switch (templateName) {
      case 'simple':
        // Circuito básico (Ohm)
        tempComponents = [
          {
            id: 'battery_1',
            type: 'battery',
            x1: 2,
            y1: 4,
            x2: 2,
            y2: 2,
            value: 9,
            name: 'Pila de 9V',
          },
          {
            id: 'switch_1',
            type: 'switch',
            x1: 2,
            y1: 2,
            x2: 6,
            y2: 2,
            value: 0,
            isOpen: false,
            name: 'Interruptor General',
          },
          {
            id: 'bulb_1',
            type: 'bulb',
            x1: 6,
            y1: 2,
            x2: 6,
            y2: 4,
            value: 10,
            name: 'Lámpara Incandescente',
          },
          {
            id: 'wire_1',
            type: 'wire',
            x1: 6,
            y1: 4,
            x2: 2,
            y2: 4,
            value: 0,
            name: 'Cable de Retorno',
          },
        ];
        break;

      case 'serie':
        // Lámparas en serie
        tempComponents = [
          {
            id: 'battery_1',
            type: 'battery',
            x1: 2,
            y1: 5,
            x2: 2,
            y2: 1,
            value: 12,
            name: 'Batería 12V',
          },
          {
            id: 'switch_1',
            type: 'switch',
            x1: 2,
            y1: 1,
            x2: 5,
            y2: 1,
            value: 0,
            isOpen: false,
            name: 'Interruptor Principal',
          },
          {
            id: 'bulb_1',
            type: 'bulb',
            x1: 5,
            y1: 1,
            x2: 8,
            y2: 1,
            value: 10,
            name: 'Lámpara Serie 1',
          },
          {
            id: 'wire_1',
            type: 'wire',
            x1: 8,
            y1: 1,
            x2: 8,
            y2: 5,
            value: 0,
            name: 'Cable Lateral',
          },
          {
            id: 'bulb_2',
            type: 'bulb',
            x1: 8,
            y1: 5,
            x2: 5,
            y2: 5,
            value: 10,
            name: 'Lámpara Serie 2',
          },
          {
            id: 'wire_2',
            type: 'wire',
            x1: 5,
            y1: 5,
            x2: 2,
            y2: 5,
            value: 0,
            name: 'Cable Retorno',
          },
        ];
        break;

      case 'paralelo':
        // Lámparas en paralelo
        tempComponents = [
          {
            id: 'battery_1',
            type: 'battery',
            x1: 2,
            y1: 5,
            x2: 2,
            y2: 2,
            value: 12,
            name: 'Batería 12V',
          },
          {
            id: 'wire_top_1',
            type: 'wire',
            x1: 2,
            y1: 2,
            x2: 5,
            y2: 2,
            value: 0,
            name: 'Distribuidor 1',
          },
          {
            id: 'bulb_1',
            type: 'bulb',
            x1: 5,
            y1: 2,
            x2: 5,
            y2: 5,
            value: 10,
            name: 'Lámpara Paralelo 1',
          },
          {
            id: 'wire_top_2',
            type: 'wire',
            x1: 5,
            y1: 2,
            x2: 8,
            y2: 2,
            value: 0,
            name: 'Distribuidor 2',
          },
          {
            id: 'bulb_2',
            type: 'bulb',
            x1: 8,
            y1: 2,
            x2: 8,
            y2: 5,
            value: 10,
            name: 'Lámpara Paralelo 2',
          },
          {
            id: 'wire_bot_1',
            type: 'wire',
            x1: 8,
            y1: 5,
            x2: 5,
            y2: 5,
            value: 0,
            name: 'Cable Conexión 1',
          },
          {
            id: 'wire_bot_2',
            type: 'wire',
            x1: 5,
            y1: 5,
            x2: 2,
            y2: 5,
            value: 0,
            name: 'Cable Conexión 2',
          },
        ];
        break;

      case 'wheatstone':
        // Puente de Wheatstone desequilibrado
        tempComponents = [
          {
            id: 'battery_1',
            type: 'battery',
            x1: 1,
            y1: 5,
            x2: 1,
            y2: 1,
            value: 12,
            name: 'Fuente 12V',
          },
          {
            id: 'wire_top_1',
            type: 'wire',
            x1: 1,
            y1: 1,
            x2: 3,
            y2: 1,
            value: 0,
            name: 'Línea de alimentación superior',
          },
          {
            id: 'wire_top_2',
            type: 'wire',
            x1: 3,
            y1: 1,
            x2: 6,
            y2: 1,
            value: 0,
            name: 'Línea superior secundaria',
          },
          {
            id: 'resistor_r1',
            type: 'resistor',
            x1: 3,
            y1: 1,
            x2: 3,
            y2: 3,
            value: 100,
            name: 'Rama R1 (100Ω)',
          },
          {
            id: 'resistor_r2',
            type: 'resistor',
            x1: 6,
            y1: 1,
            x2: 6,
            y2: 3,
            value: 100,
            name: 'Rama R2 (100Ω)',
          },
          {
            id: 'ammeter_bridge',
            type: 'ammeter',
            x1: 3,
            y1: 3,
            x2: 6,
            y2: 3,
            value: 0,
            name: 'Amperímetro de Puente',
          },
          {
            id: 'resistor_r3',
            type: 'resistor',
            x1: 3,
            y1: 3,
            x2: 3,
            y2: 5,
            value: 100,
            name: 'Rama R3 (100Ω)',
          },
          {
            id: 'resistor_r4',
            type: 'resistor',
            x1: 6,
            y1: 3,
            x2: 6,
            y2: 5,
            value: 120, // Desequilibrado: circulará corriente por el puente!
            name: 'Rama R4 (120Ω)',
          },
          {
            id: 'wire_bot_1',
            type: 'wire',
            x1: 1,
            y1: 5,
            x2: 3,
            y2: 5,
            value: 0,
            name: 'Retorno 1',
          },
          {
            id: 'wire_bot_2',
            type: 'wire',
            x1: 3,
            y1: 5,
            x2: 6,
            y2: 5,
            value: 0,
            name: 'Retorno 2',
          },
        ];
        break;

      case 'proteccion':
        // Fusible contra cortocircuito
        tempComponents = [
          {
            id: 'battery_1',
            type: 'battery',
            x1: 2,
            y1: 5,
            x2: 2,
            y2: 2,
            value: 12,
            name: 'Pila 12V',
          },
          {
            id: 'fuse_1',
            type: 'fuse',
            x1: 2,
            y1: 2,
            x2: 6,
            y2: 2,
            value: 2, // Se funde por sobrecorriente si I > 2A
            isBlown: false,
            name: 'Fusible Rápido 2A',
          },
          {
            id: 'bulb_1',
            type: 'bulb',
            x1: 6,
            y1: 2,
            x2: 6,
            y2: 5,
            value: 10,
            name: 'Lámpara de Trabajo',
          },
          {
            id: 'wire_1',
            type: 'wire',
            x1: 6,
            y1: 5,
            x2: 2,
            y2: 5,
            value: 0,
            name: 'Cable Regreso',
          },
          {
            id: 'switch_bypass',
            type: 'switch',
            x1: 6,
            y1: 2,
            x2: 6,
            y2: 5, // un switch de cortocircuito paralelo para puentear la bombilla
            isOpen: true,
            name: 'Interruptor de Falla (Corto)',
          },
        ];
        break;

      case 'led':
        // Diodo LED con resistencia limitadora de protección
        tempComponents = [
          {
            id: 'battery_1',
            type: 'battery',
            x1: 2,
            y1: 4,
            x2: 2,
            y2: 2,
            value: 9,
            name: 'Batería 9V',
          },
          {
            id: 'resistor_1',
            type: 'resistor',
            x1: 2,
            y1: 2,
            x2: 6,
            y2: 2,
            value: 300, // 300 Ohms protege el LED
            name: 'Resistencia Limitadora',
          },
          {
            id: 'led_1',
            type: 'led',
            x1: 6,
            y1: 2,
            x2: 6,
            y2: 4,
            value: 10,
            name: 'LED de Laboratorio',
          },
          {
            id: 'wire_1',
            type: 'wire',
            x1: 6,
            y1: 4,
            x2: 2,
            y2: 4,
            value: 0,
            name: 'Cable Retorno',
          },
        ];
        break;
    }

    setComponents(tempComponents);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Cabecera del Panel Principal */}
      <header className="bg-zinc-900 border-b border-zinc-800 py-4 px-6 shadow-md shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-600/10 p-2.5 rounded-xl border border-amber-500/30">
              <Cpu className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>
            <div>
              <h1 id="app-title" className="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-1.5 leading-none">
                <span>LAB-ELÉCTRICA</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-500 border border-zinc-900 leading-none">Simulador Pro</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-1.5">Simulador interactivo de circuitos eléctricos y esquemas en tiempo real con tutor educativo de IA</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-850/80 text-[11px] text-zinc-400">
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>Haz clic en dos nodos para crear conexiones.</span>
          </div>
        </div>
      </header>

      {/* Grid General con Bento Layout */}
      <main className="grow max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: Paleta de Componentes (span 3) */}
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">
          <ComponentPalette
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />
          <ControlPanel
            selectedComponent={activeSelectedComponent}
            onUpdateComponent={handleUpdateComponent}
            solverResult={solverResult}
          />
        </div>

        {/* COLUMNA CENTRAL: Canvas de Simulación y Laboratorio (span 6) */}
        <div className="col-span-1 lg:col-span-6 flex flex-col gap-6">
          {/* Barra de Controles rápidos del simulador */}
          <Toolbar
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            flowMode={flowMode}
            setFlowMode={setFlowMode}
            onReset={handleReset}
            onLoadTemplate={loadTemplate}
            shortCircuit={solverResult.shortCircuitDetected || false}
            hasBlownFuse={hasBlownFuse}
          />

          {/* Área del Canvas Interactivo */}
          <CircuitCanvas
            components={components}
            setComponents={setComponents}
            solverResult={solverResult}
            selectedComponent={activeSelectedComponent}
            setSelectedComponent={setSelectedComponent}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            flowMode={flowMode}
            isRunning={isRunning}
          />

          {/* Seccion de Ejercicios y Retos de Verificación */}
          <ChallengesSection
            components={components}
            solverResult={solverResult}
            onSetComponents={setComponents}
            onLoadTemplate={loadTemplate}
          />
        </div>

        {/* COLUMNA DERECHA: Chat-Tutor Educativo con Inteligencia Artificial (span 3) */}
        <div className="col-span-1 lg:col-span-3">
          <AIPanel
            currentCircuit={components}
            solverResult={solverResult}
          />
        </div>
      </main>

      {/* Pie de página con créditos */}
      <footer className="bg-zinc-900 border-t border-zinc-850 py-4 px-6 mt-12 text-center text-[10px] text-zinc-500 font-mono tracking-wider">
        <p>© 2026 LAB-ELÉCTRICA • ENTRENADOR DIDÁCTICO • COMPILADO PARA FORMACIÓN PROFESIONAL</p>
      </footer>
    </div>
  );
}
