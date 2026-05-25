/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ComponentType =
  | 'wire'
  | 'battery'
  | 'resistor'
  | 'bulb'
  | 'switch'
  | 'led'
  | 'fuse'
  | 'voltmeter'
  | 'ammeter';

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: number; // Tension (V), Resistencia (Ohm), Corriente máxima (A)
  isOpen?: boolean; // Para interruptores
  isBlown?: boolean; // Para fusibles
  name: string;
}

export interface SolverResult {
  solved: boolean;
  error?: string;
  shortCircuitDetected?: boolean;
  nodeVoltages: { [nodeId: string]: number }; // Voltaje de cada nodo eléctrico condensado
  gridNodeVoltages: { [coordKey: string]: number }; // Voltaje mapeado a coordenadas de la red "x,y"
  componentCurrents: { [componentId: string]: number }; // Corriente a través de cada componente (A)
  componentVoltages: { [componentId: string]: number }; // Caída de tensión en cada componente (V)
  componentPowers: { [componentId: string]: number }; // Potencia disipada (W)
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  instructions: string;
  difficulty: 'fácil' | 'medio' | 'difícil';
  hints: string[];
  validate: (components: CircuitComponent[], solverResult: SolverResult) => { success: boolean; message: string };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
