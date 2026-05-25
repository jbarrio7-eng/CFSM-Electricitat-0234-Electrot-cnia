/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Inicialización de la API de Gemini (solo en el servidor para proteger la clave secreta)
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY no configurado en variables de entorno. El chat de tutoría funcionará en modo de demostración.');
  } else {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
} catch (error) {
  console.error('Error al inicializar GoogleGenAI:', error);
}

// Ruta API: Tutor de Inteligencia Artificial para Electricidad
app.post('/api/tutor/chat', async (req, res) => {
  const { prompt, history, currentCircuit, solverResult } = req.body;

  if (!ai) {
    // Respuesta de respaldo si no hay API Key configurada
    return res.json({
      text: '¡Hola! Soy tu mentor virtual de electricidad. Actualmente el backend no tiene configurada una clave de API (GEMINI_API_KEY) en las opciones de AI Studio.\n\nSin embargo, analizando el circuito localmente puedo ver que ' +
        (currentCircuit?.length > 0
          ? `tienes ${currentCircuit.length} componentes colocados. `
          : 'no has colocado ningún componente todavía en el canvas. ') +
        '¡Configura la clave secreta en la barra superior o en Ajustes (Secrets) para que pueda ayudarte con explicaciones paso a paso de tu ejercicio!'
    });
  }

  try {
    const systemInstruction = `Eres un Profesor y Mentor experto de Electricidad Científica y Aplicada para institutos técnicos.
Tu tono es motivador, pedagógico, riguroso pero fácil de entender, y hablas en español.
El alumno está utilizando un simulador gráfico e interactivo de circuitos eléctricos en tiempo real y puede arrastrar resistencias, pilas, bombillas, interruptores, LEDs, voltímetros y amperímetros.

Te proporcionamos el contexto exacto del circuito que el alumno ha diseñado actualmente en su pantalla:
- Componentes en pantalla: ${JSON.stringify(currentCircuit || [])}
- Análisis matemático del simulador (tensiones, corrientes, potencias): ${JSON.stringify(solverResult || {})}

Usa esta información técnica para guiar inteligentemente al alumno. Si te pregunta sobre su circuito activo (por ejemplo, "¿por qué no brilla?", "¿cómo calculo la resistencia?", o "¿por qué se fundió el fusible?"), lee el JSON y asócialo con la Ley de Ohm ($I = V/R$), Ley de Corrientes de Kirchhoff (KCL) o divisor de tensión para explicarle los cálculos físicos exactos con números de su propio circuito de forma impecable y didáctica.

Importante:
1. Responde siempre en español.
2. Si comete errores o hay cortocircuitos, explícale con amabilidad científica por qué los electrones van por el camino libre de resistencia y cómo evitarlo.
3. Puedes usar formato Markdown para estructurar tus respuestas y fórmulas matemáticas claras.`;

    // Reconstruir la historia para enviar en el prompt de forma secuencial
    let contents = [];
    if (history && history.length > 0) {
      contents = history.map((h: any) => ({
        role: h.role,
        parts: [{ text: h.text }]
      }));
    }

    // Añadir el mensaje actual
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || 'No he podido generar una respuesta clara. ¿Podrías reformular tu pregunta?';
    res.json({ text: replyText });
  } catch (err: any) {
    console.error('Error al invocar API Gemini:', err);
    res.status(500).json({ error: 'Error del servidor al conectar con el tutor de IA.', details: err.message });
  }
});

// Middleware Vite para desarrollo o servir archivos estáticos compilados en producción
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Circuit Simulator Backend] Servidor ejecutándose en puerto http://localhost:${PORT}`);
  });
}

startServer();
