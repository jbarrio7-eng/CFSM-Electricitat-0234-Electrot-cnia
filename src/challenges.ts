/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Challenge, CircuitComponent, SolverResult } from './types';

export const CHALLENGES: Challenge[] = [
  {
    id: 'ohm_simple',
    title: 'Desafío 1: Ley de Ohm (Circuito Simple)',
    description: 'Aprende a montar un circuito básico que encienda una bombilla utilizando un interruptor.',
    instructions: 'Coloca una Batería (fuente de tensión), un Interruptor (recomienda cerrarlo) y una Bombilla (resistencia). Conéctalos todos formando un bucle cerrado usando Cables.',
    difficulty: 'fácil',
    hints: [
      'Asegúrate de que haya una sola batería y que la bombilla esté conectada por ambos extremos al circuito.',
      'El interruptor debe estar CERRADO (haz clic sobre él en el canvas) para permitir el flujo de corriente.',
      'Para cerrar el lazo puedes unir los extremos usando el componente Cable.'
    ],
    validate: (components: CircuitComponent[], solver: SolverResult): { success: boolean; message: string } => {
      if (components.length === 0) return { success: false, message: 'Dibuja un circuito para empezar.' };
      if (solver.shortCircuitDetected) return { success: false, message: '¡Cuidado! Hay un cortocircuito. Agrega un receptor (bombilla) para resistir la corriente.' };

      const batteries = components.filter(c => c.type === 'battery');
      const bulbs = components.filter(c => c.type === 'bulb');
      const switches = components.filter(c => c.type === 'switch');

      if (batteries.length === 0) return { success: false, message: 'Falta una fuente de energía (Batería).' };
      if (bulbs.length === 0) return { success: false, message: 'Falta un elemento receptor para consumir la energía (Bombilla).' };
      if (switches.length === 0) return { success: false, message: 'Se recomienda agregar un interruptor para controlar el paso.' };

      const closedSwitch = switches.some(s => !s.isOpen);
      if (!closedSwitch) return { success: false, message: 'El circuito está instalado, pero el interruptor está ABIERTO. Haz clic en él para cerrarlo.' };

      // Buscar si hay corriente circulando por la bombilla
      let bulbLighting = false;
      bulbs.forEach(b => {
        const I = Math.abs(solver.componentCurrents[b.id] || 0);
        if (I > 0.05) bulbLighting = true;
      });

      if (bulbLighting) {
        return { success: true, message: '¡Excelente! Has construido tu primer circuito funcional. El interruptor controla el paso de electrones y Ohm sonríe.' };
      }

      return { success: false, message: 'Ninguna bombilla está encendida. Verifica que los extremos de la batería y la bombilla tengan conexión continua mediante cables.' };
    }
  },
  {
    id: 'series_circuit',
    title: 'Desafío 2: El Camino Único (Circuito en Serie)',
    description: 'Instala dos bombillas en serie y observa cómo se reparte el voltaje de la fuente entre receptores.',
    instructions: 'Monta una Batería conectada a un Interruptor cerrado y luego a dos Bombillas puestas una a continuación de la otra (en serie). Cierra el circuito.',
    difficulty: 'fácil',
    hints: [
      'En serie, la corriente solo tiene un camino disponible. Si se desconecta una, se apagan ambas.',
      'La corriente medida (en Amperes) en ambas bombillas debe ser exactamente la misma.',
      'El brillo de las bombillas será menor que en una sola porque ahora se dividen la tensión disponible.'
    ],
    validate: (components: CircuitComponent[], solver: SolverResult): { success: boolean; message: string } => {
      const bulbs = components.filter(c => c.type === 'bulb');
      const batteries = components.filter(c => c.type === 'battery');

      if (batteries.length === 0) return { success: false, message: 'Falta agregar la Batería.' };
      if (bulbs.length < 2) return { success: false, message: 'Debes colocar al menos DOS bombillas en el circuito.' };

      // Comprobar corrientes
      let allOn = true;
      const currents: number[] = [];
      bulbs.forEach(b => {
        const I = Math.abs(solver.componentCurrents[b.id] || 0);
        if (I < 0.05) allOn = false;
        currents.push(I);
      });

      if (!allOn) {
        return { success: false, message: 'Asegúrate de cerrar el lazo y que por ambas bombillas circule corriente eléctrica.' };
      }

      // Comprobar que estén en serie: la corriente debe ser sumamente similar entre ambas bombillas (+- 5% de diferencia)
      const diff = Math.abs(currents[0] - currents[1]);
      const inSeries = diff < 1e-4; // si están en serie la corriente a través de ellas es idéntica en el mismo lazo activo

      if (inSeries) {
        return { success: true, message: '¡Fabuloso! Las bombillas están en serie. Ambas comparten la corriente eléctrica pero experimentan una caída de tensión fraccionada.' };
      }

      return { success: false, message: 'Las bombillas están encendidas pero no están en serie (quizás están en paralelo). Conéctalas una detrás de otra en el mismo camino.' };
    }
  },
  {
    id: 'parallel_circuit',
    title: 'Desafío 3: Bifurcación Inteligente (Circuito en Paralelo)',
    description: 'Instala dos bombillas en paralelo para que el brillo de cada una se mantenga al máximo de manera independiente.',
    instructions: 'Coloca una Batería de 12V. Introduce dos Bombillas dispuestas en carriles paralelos (bifurcadas), conectadas a pares de cables. Al cerrar el paso, ambas deben lucir intensamente.',
    difficulty: 'medio',
    hints: [
      'En paralelo, las cabezas de ambas bombillas se conectan juntas, y sus colas también.',
      'Cada bombilla recibe el voltaje íntegro de la fuente (ejemplo, 12V cada una), por lo que brillan mucho más que en serie.',
      'Si se funde o quita una bombilla, la otra seguirá funcionando porque existen caminos independientes.'
    ],
    validate: (components: CircuitComponent[], solver: SolverResult): { success: boolean; message: string } => {
      const bulbs = components.filter(c => c.type === 'bulb');
      const batteries = components.filter(c => c.type === 'battery');

      if (batteries.length === 0) return { success: false, message: 'Falta una batería en el diagrama.' };
      if (bulbs.length < 2) return { success: false, message: 'Coloca al menos DOS bombillas en paralelo.' };

      // Comprobar tensiones y corrientes
      let index12 = 0;
      let conductsBoth = true;
      const vDrops: number[] = [];
      bulbs.forEach(b => {
        const I = Math.abs(solver.componentCurrents[b.id] || 0);
        const V = Math.abs(solver.componentVoltages[b.id] || 0);
        vDrops.push(V);
        if (I < 0.05) conductsBoth = false;
      });

      if (!conductsBoth) {
        return { success: false, message: 'Asegúrate de que ambas bombillas estén encendidas.' };
      }

      // En paralelo, la caída de tensión en cada bombilla debe ser muy similar a la de la fuente de tensión
      const vSrc = batteries[0].value;
      const bothNearSourceV = vDrops.every(v => Math.abs(v - vSrc) < 0.5);

      if (bothNearSourceV) {
        return { success: true, message: '¡Enhorabuena! Has creado un circuito en paralelo. Este es el sistema usado en los hogares, donde todos los electrodomésticos disfrutan del mismo nivel de voltaje.' };
      }

      return { success: false, message: 'Tus bombillas están encendidas pero dividen el voltaje de la batería, lo cual sugiere un circuito en serie o mixto. Llévalas a bornes opuestos compartidos directamente.' };
    }
  },
  {
    id: 'fuse_defense',
    title: 'Desafío 4: El Fusible Guardián',
    description: 'Simula un sistema de seguridad eléctrica contra cortocircuitos peligrosos.',
    instructions: 'Monta un circuito con Batería, Fusible (recomienda valor límite de 5A), Bombilla y un Interruptor configurado en paralelo a la bombilla de tal forma que al cerrarlo genere un cortocircuito seguro por el fusible.',
    difficulty: 'medio',
    hints: [
      'Coloca la batería en cortocircuito selectivo a través del fusible usando un interruptor.',
      'Al cerrar el interruptor, la corriente se elevará masivamente, superando el límite del fusible.',
      'El fusible debe "fundirse", abriendo automáticamente el circuito para evitar daños severos a la batería.'
    ],
    validate: (components: CircuitComponent[], solver: SolverResult): { success: boolean; message: string } => {
      const fuses = components.filter(c => c.type === 'fuse');
      const switches = components.filter(c => c.type === 'switch');

      if (fuses.length === 0) return { success: false, message: 'Debes insertar un Fusible en la línea principal de corriente.' };
      if (switches.length === 0) return { success: false, message: 'Inserta un interruptor auxiliar para provocar la sobrecorriente.' };

      const blownFuse = fuses.find(f => f.isBlown);
      if (blownFuse) {
        return { success: true, message: '¡Fabuloso! Has fundido el fusible de manera segura simulando una avería real. El fusible se abrió al superar el límite de amperaje, salvaguardando la integridad del simulador.' };
      }

      const activeSwitch = switches.some(s => !s.isOpen);
      if (!activeSwitch) {
        return { success: false, message: 'Agrega un interruptor dispuesto para desviar la corriente directamente de terminal (+) a (-) de la fuente, y ciérralo.' };
      }

      return { success: false, message: 'El circuito sigue activo. Si el interruptor puentea la bombilla, asegúrate de que el fusible tenga un amperaje límite bajo (por ejemplo, menor de 5A).' };
    }
  },
  {
    id: 'led_polarity',
    title: 'Desafío 5: Polarización e Integridad del LED',
    description: 'Estudia los semiconductores encendiendo un diodo LED sin exceder su límite de corriente.',
    instructions: 'Dispón una batería de 9V. Conéctale una Resistencia limitadora (recomienda 300 Ohms) en serie y finalmente un Diodo LED. El LED tiene polaridad: su ánodo (+) debe conectarse al polo positivo.',
    difficulty: 'difícil',
    hints: [
      'El diodo LED es semiconductor y solo conduce si el polo positivo va al extremo Ánodo (x1,y1).',
      'Si conectas un LED directo a una batería de 9V sin resistencia serie, el LED se sobrecalentará y quemará por sobrecurrente virtual.'
    ],
    validate: (components: CircuitComponent[], solver: SolverResult): { success: boolean; message: string } => {
      const leds = components.filter(c => c.type === 'led');
      const resistors = components.filter(c => c.type === 'resistor');
      const batteries = components.filter(c => c.type === 'battery');

      if (batteries.length === 0) return { success: false, message: 'Introduce una Batería de alimentación.' };
      if (leds.length === 0) return { success: false, message: 'Debes añadir el diodo LED del catálogo.' };

      // Comprobar si hay una resistencia en serie
      if (resistors.length === 0) {
        return { success: false, message: '¡Alerta de quemado! Necesitas una resistencia limitadora de corriente para que el LED de laboratorio no reviente.' };
      }

      let ledConducting = false;
      let correctPolarity = true;

      leds.forEach(led => {
        const I = solver.componentCurrents[led.id] || 0;
        if (I > 0.005) {
          ledConducting = true;
        }
        // Determinar si la polaridad fue correcta: el x1,y1 del led debe ser conectado a la terminal de mayor potencial relativo de x2,y2
        const vDiff = solver.componentVoltages[led.id] || 0;
        if (vDiff < -0.1) {
          correctPolarity = false;
        }
      });

      if (!correctPolarity) {
        return { success: false, message: 'El LED está polarizado a la inversa. Conéctalo girándolo: el polo (+) debe ir al Ánodo superior (indicado con un triángulo en el símbolo).' };
      }

      if (ledConducting) {
        // Verificar corriente segura: un LED común funciona bien entre 10mA y 40mA (0.01A - 0.04A)
        let safeCurrent = true;
        leds.forEach(led => {
          const I = Math.abs(solver.componentCurrents[led.id] || 0);
          if (I > 0.1) {
            safeCurrent = false;
          }
        });

        if (!safeCurrent) {
          return { success: false, message: '¡Corriente excesiva en el LED! Aumenta los ohmios de tu resistencia (por ejemplo, a 300 o 500 ohmios) para mantenerlo a salvo.' };
        }

        return { success: true, message: '¡Magnífico! Has polarizado el LED en sentido directo y colocado la resistencia de protección para mantener la corriente en niveles seguros. ¡Diseño impecable!' };
      }

      return { success: false, message: 'El LED no está encendido. Revisa que el interruptor esté cerrado, las conexiones hechas y el diodo apuntado en la dirección del flujo de corriente.' };
    }
  }
];
