/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CircuitComponent, SolverResult } from './types';

// Solucionador de sistemas de ecuaciones lineales por eliminación gaussiana con pivoteo parcial
function solveLinearSystem(A: number[][], B: number[]): number[] | null {
  const n = B.length;
  for (let i = 0; i < n; i++) {
    // Buscar pivote
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }

    // Intercambiar filas
    const tempRow = A[i];
    A[i] = A[maxRow];
    A[maxRow] = tempRow;

    const tempVal = B[i];
    B[i] = B[maxRow];
    B[maxRow] = tempVal;

    // Verificar si es singular
    if (Math.abs(A[i][i]) < 1e-12) {
      return null; // Sistema singular o mal condicionado
    }

    // Eliminación
    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        A[k][j] -= factor * A[i][j];
      }
      B[k] -= factor * B[i];
    }
  }

  // Sustitución hacia atrás
  const X = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * X[j];
    }
    X[i] = (B[i] - sum) / A[i][i];
  }
  return X;
}

export function solveCircuit(components: CircuitComponent[]): SolverResult {
  if (components.length === 0) {
    return {
      solved: true,
      nodeVoltages: {},
      gridNodeVoltages: {},
      componentCurrents: {},
      componentVoltages: {},
      componentPowers: {},
    };
  }

  // 1. Identificar nodos físicos y colapsar conductores de resistencia cero (cables, interruptores cerrados, fusibles intactos)
  const gridCoords = new Set<string>();
  components.forEach(c => {
    gridCoords.add(`${c.x1},${c.y1}`);
    gridCoords.add(`${c.x2},${c.y2}`);
  });

  const coordList = Array.from(gridCoords);
  const parent: { [key: string]: string } = {};
  coordList.forEach(coord => {
    parent[coord] = coord;
  });

  function find(coord: string): string {
    if (parent[coord] === coord) return coord;
    parent[coord] = find(parent[coord]);
    return parent[coord];
  }

  function union(coord1: string, coord2: string) {
    const root1 = find(coord1);
    const root2 = find(coord2);
    if (root1 !== root2) {
      parent[root1] = root2;
    }
  }

  // Cablear: Unir nodos con elementos de 0 ohms
  components.forEach(c => {
    const isZeroOhm =
      c.type === 'wire' ||
      (c.type === 'switch' && !c.isOpen) ||
      (c.type === 'fuse' && !c.isBlown);

    if (isZeroOhm) {
      union(`${c.x1},${c.y1}`, `${c.x2},${c.y2}`);
    }
  });

  // Agrupar coordenadas en conjuntos representativos (Supernodos eléctricos)
  const nodeGroups: { [root: string]: string[] } = {};
  coordList.forEach(coord => {
    const root = find(coord);
    if (!nodeGroups[root]) {
      nodeGroups[root] = [];
    }
    nodeGroups[root].push(coord);
  });

  const superNodes = Object.keys(nodeGroups);
  const K = superNodes.length; // Cantidad de nodos eléctricos únicos

  const superNodeIndexMap: { [root: string]: number } = {};
  superNodes.forEach((root, idx) => {
    superNodeIndexMap[root] = idx;
  });

  function getSuperNodeIndex(coord: string): number {
    return superNodeIndexMap[find(coord)];
  }

  // 2. Clasificar el resto de componentes (resistencias, fuentes, etc.) que están entre nodos eléctricos
  const resistors: { id: string; n1: number; n2: number; R: number }[] = [];
  const batteries: { id: string; nPos: number; nNeg: number; V: number }[] = [];
  const leds: { id: string; nAnode: number; nCathode: number; active: boolean }[] = [];

  // Mapeos rápidos para identificar medidores
  const componentsToSolve = components.filter(c => {
    const isZeroOhm =
      c.type === 'wire' ||
      (c.type === 'switch' && !c.isOpen) ||
      (c.type === 'fuse' && !c.isBlown);
    return !isZeroOhm;
  });

  // Guardamos estados iniciales para iteración de diodos (LEDs) y fusibles
  const ledStates: { [id: string]: boolean } = {}; // true = conduce, false = bloqueado
  components.forEach(c => {
    if (c.type === 'led') ledStates[c.id] = true; // Por defecto asumimos conducción
  });

  let activeFuseBlown = false;

  // Realizaremos un bucle iterativo para converger en el estado de los LEDs y Fusibles
  let solvedX: number[] | null = null;
  const M_bat = components.filter(c => c.type === 'battery').length;
  let attempt = 0;
  const maxAttempts = 5;

  let currentSolverSuccess = false;
  let detectedShort = false;

  while (attempt < maxAttempts) {
    resistors.length = 0;
    batteries.length = 0;
    leds.length = 0;

    // Rellenamos ramas para la iteración actual
    componentsToSolve.forEach(c => {
      const n1 = getSuperNodeIndex(`${c.x1},${c.y1}`);
      const n2 = getSuperNodeIndex(`${c.x2},${c.y2}`);

      if (c.type === 'battery') {
        // En baterias x1,y1 es el terminal positivo (+) y x2,y2 es el negativo (-)
        batteries.push({ id: c.id, nPos: n1, nNeg: n2, V: c.value });
      } else if (c.type === 'resistor') {
        resistors.push({ id: c.id, n1, n2, R: Math.max(0.1, c.value) });
      } else if (c.type === 'bulb') {
        resistors.push({ id: c.id, n1, n2, R: Math.max(1, c.value) });
      } else if (c.type === 'voltmeter') {
        // Resistencia interna altísima para un voltímetro (idealmente circuito abierto)
        resistors.push({ id: c.id, n1, n2, R: 1e7 });
      } else if (c.type === 'ammeter') {
        // Resistencia interna bajísima para un amperímetro (idealmente cortocircuito)
        resistors.push({ id: c.id, n1, n2, R: 1e-4 });
      } else if (c.type === 'switch' && c.isOpen) {
        // Interruptor abierto: resistencia casi infinita
        resistors.push({ id: c.id, n1, n2, R: 1e12 });
      } else if (c.type === 'fuse' && c.isBlown) {
        // Fusible fundido: resistencia casi infinita
        resistors.push({ id: c.id, n1, n2, R: 1e12 });
      } else if (c.type === 'led') {
        const conducts = ledStates[c.id];
        if (conducts) {
          // Si conduce, tiene una resistencia baja (ej. 10 ohms)
          resistors.push({ id: c.id, n1, n2, R: 10 });
        } else {
          // Bloqueado: resistencia inmensa
          resistors.push({ id: c.id, n1, n2, R: 1e12 });
        }
      }
    });

    const numEquations = K + batteries.length;
    const A: number[][] = Array.from({ length: numEquations }, () => new Array(numEquations).fill(0));
    const B: number[] = new Array(numEquations).fill(0);

    // Añadir shunt minúsculo a tierra (nodo 0) para evitar divisiones por cero en nodos flotantes
    for (let i = 0; i < K; i++) {
      A[i][i] = 1e-12;
    }

    // Fijar nodo 0 como Tierra (0V)
    // En lugar de una ecuación KCL compleja en el nodo 0, imponemos V_0 = 0
    if (K > 0) {
      A[0][0] = 1.0;
      // El resto de la fila 0 se queda en 0. Y B[0] = 0.
    }

    // Estampar conductancias de resistencias en la matriz nodal
    resistors.forEach(r => {
      const G = 1.0 / r.R;
      const { n1, n2 } = r;

      if (n1 !== 0) {
        A[n1][n1] += G;
        A[n1][n2] -= G;
      }
      if (n2 !== 0) {
        A[n2][n2] += G;
        A[n2][n1] -= G;
      }
    });

    // Estampar baterías (fuentes de tensión independientes)
    batteries.forEach((bat, batIdx) => {
      const varId = K + batIdx; // Índice de la variable de corriente de la batería
      const { nPos, nNeg, V } = bat;

      // Restricción de tensión: V_pos - V_neg = V
      if (nPos !== 0) {
        A[varId][nPos] = 1.0;
      }
      if (nNeg !== 0) {
        A[varId][nNeg] = -1.0;
      }
      B[varId] = V;

      // Inyección de corriente en KCL de los nodos positivo y negativo
      if (nPos !== 0) {
        A[nPos][varId] = 1.0; // Añade corriente saliendo de (+)
      }
      if (nNeg !== 0) {
        A[nNeg][varId] = -1.0; // Resta corriente entrando por (-)
      }
    });

    // Resolver
    solvedX = solveLinearSystem(A, B);

    if (!solvedX) {
      break; // No es soluble matemáticamente en esta configuración
    }

    currentSolverSuccess = true;

    // Verificar si los LEDs están correctamente modelados
    // Un LED conduce solo si el voltaje en el ánodo es mayor que en el cátodo
    let stateChanged = false;
    components.forEach(c => {
      if (c.type === 'led' && solvedX) {
        const nAnode = getSuperNodeIndex(`${c.x1},${c.y1}`);
        const nCathode = getSuperNodeIndex(`${c.x2},${c.y2}`);
        const vAnode = nAnode === 0 ? 0 : solvedX[nAnode];
        const vCathode = nCathode === 0 ? 0 : solvedX[nCathode];

        const voltageDiff = vAnode - vCathode;
        const shouldConduct = voltageDiff > 0.7; // Tensión de umbral del diodo LED

        if (ledStates[c.id] !== shouldConduct) {
          ledStates[c.id] = shouldConduct;
          stateChanged = true;
        }
      }
    });

    if (!stateChanged) {
      // Si el estado de los diodos es coherente con las tensiones, hemos convergido
      break;
    }

    attempt++;
  }

  // 3. Procesar resultados si se solucionó con éxito
  if (!currentSolverSuccess || !solvedX) {
    return {
      solved: false,
      error: 'Circuito inválido, abierto, o inconsistente con múltiples fuentes de tensión en conflicto directo.',
      nodeVoltages: {},
      gridNodeVoltages: {},
      componentCurrents: {},
      componentVoltages: {},
      componentPowers: {},
    };
  }

  const resultVoltages: { [id: string]: number } = {};
  superNodes.forEach((root, idx) => {
    resultVoltages[root] = idx === 0 ? 0 : solvedX![idx];
  });

  const gridNodeVoltages: { [coordKey: string]: number } = {};
  coordList.forEach(coord => {
    gridNodeVoltages[coord] = resultVoltages[find(coord)];
  });

  const componentCurrents: { [id: string]: number } = {};
  const componentVoltages: { [id: string]: number } = {};
  const componentPowers: { [id: string]: number } = {};

  // Calcular caídas de tensión, corrientes y potencias
  components.forEach(c => {
    const v1 = gridNodeVoltages[`${c.x1},${c.y1}`] || 0;
    const v2 = gridNodeVoltages[`${c.x2},${c.y2}`] || 0;
    const vDrop = v1 - v2;

    componentVoltages[c.id] = vDrop;

    let current = 0;
    if (c.type === 'battery') {
      const batIdx = batteries.findIndex(b => b.id === c.id);
      if (batIdx !== -1) {
        // La corriente calculada en el MNA es la corriente de la batería
        current = solvedX![K + batIdx];
        // En MNA, la corriente bat es positiva saliendo del terminal (+)
      }
    } else if (c.type === 'resistor' || c.type === 'bulb') {
      current = vDrop / Math.max(0.1, c.value);
    } else if (c.type === 'voltmeter') {
      current = vDrop / 1e7;
    } else if (c.type === 'ammeter') {
      current = vDrop / 1e-4;
    } else if (c.type === 'switch') {
      if (c.isOpen) {
        current = 0;
      } else {
        // Un interruptor cerrado es equivalente a un cable, KCL calcula la corriente indirectamente.
        // Para simplificar, le asignamos la corriente promedio del terminal o aproximada
        current = vDrop / 1e-4; // o calculada
      }
    } else if (c.type === 'fuse') {
      if (c.isBlown) {
        current = 0;
      } else {
        current = vDrop / 1e-4;
      }
    } else if (c.type === 'led') {
      const conducts = ledStates[c.id];
      current = conducts ? vDrop / 10 : 0;
    } else if (c.type === 'wire') {
      // Corriente a través del cable
      current = vDrop / 1e-4;
    }

    componentCurrents[c.id] = current;
    componentPowers[c.id] = Math.abs(current * vDrop);
  });

  // 4. Detetar Cortocircuito y Quemado de Fusibles
  // Un cortocircuito ocurre si la corriente que sale de alguna batería es excesivamente grande (ej. > 100A), o tiene resistencia total casi nula
  let shortCircuit = false;
  batteries.forEach((bat, idx) => {
    const batCurrent = Math.abs(solvedX![K + idx]);
    if (batCurrent > 95) { // Un umbral razonable para simular cortocircuito en baterías normales de laboratorio
      shortCircuit = true;
    }
  });

  // Si hay corrientes muy grandes, cualquier fusible conectado en ese lazo superará su límite y se fundirá
  let fuseBlownHappened = false;
  components.forEach(c => {
    if (c.type === 'fuse' && !c.isBlown) {
      const fCurrent = Math.abs(componentCurrents[c.id]);
      if (fCurrent > c.value) { // c.value tiene los Amperios máximos soportados del fusible
        c.isBlown = true;
        fuseBlownHappened = true;
      }
    }
  });

  // Si se fundió un fusible durante el cálculo de corrientes debido a sobrecorriente, resolvemos recursivamente el circuito
  if (fuseBlownHappened) {
    return solveCircuit(components);
  }

  return {
    solved: true,
    shortCircuitDetected: shortCircuit,
    nodeVoltages: resultVoltages,
    gridNodeVoltages,
    componentCurrents,
    componentVoltages,
    componentPowers,
  };
}
