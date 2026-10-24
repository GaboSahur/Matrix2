/**
 * firebase-ai.js
 * -----------------------------------------------------------
 * Única puerta de entrada a Gemini (vía Firebase AI Logic) para
 * las 3 funcionalidades de IA del proyecto:
 *
 *   1. generarPistaIA()     — pista en lenguaje natural cuando
 *                              el jugador se equivoca.
 *   2. generarEjercicioIA() — un ejercicio nuevo (enunciado +
 *                              respuesta) para el nivel "Desafío IA".
 *   3. enviarMensajeChat()  — chatbot de dudas de matemática,
 *                              con memoria de la conversación.
 *
 * Todas las funciones son async y pueden fallar (sin conexión,
 * cuota agotada, respuesta rara del modelo) — quien las llama
 * SIEMPRE debe envolver en try/catch y tener un plan B, nunca
 * asumir que la IA respondió bien. Ver jugar-ia.js para el
 * ejemplo de cómo se maneja eso en el juego.
 * -----------------------------------------------------------
 */
import { ai, modeloTexto } from "./firebase-ai-config.js";
import { getGenerativeModel } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-ai.js";

const INSTRUCCION_TUTOR = `Sos un tutor de matemática para estudiantes de
secundaria en Uruguay. Respondé siempre en español rioplatense, con calidez,
cercanía y mucha brevedad (2 a 3 oraciones como máximo). Nunca dés la
respuesta numérica final de un ejercicio: guiá con una pregunta o una pista
del método a seguir. No uses markdown ni emojis en exceso.`;

/* ================= 1. PISTA INTELIGENTE ================= */

/**
 * Genera una pista en lenguaje natural para un ejercicio que el
 * jugador respondió mal. No revela el resultado.
 */
export async function generarPistaIA({ enunciado, intentoUsuario, respuestaCorrecta }) {
  const prompt = `${INSTRUCCION_TUTOR}

Ejercicio: ${enunciado}
El estudiante respondió: ${intentoUsuario}
(La respuesta correcta es ${respuestaCorrecta}, pero NO se la reveles directamente)

Dale una pista breve para que llegue solo al resultado.`;

  const resultado = await modeloTexto.generateContent(prompt);
  return resultado.response.text().trim();
}

/* ================= 2. GENERADOR DE EJERCICIOS ================= */

const modeloEstructurado = getGenerativeModel(ai, {
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        enunciado: { type: "string" },
        respuesta: { type: "number" },
        pista: { type: "string" },
      },
      required: ["enunciado", "respuesta", "pista"],
    },
  },
});

/**
 * Pide a Gemini un ejercicio nuevo de matemática, con su respuesta
 * numérica y una pista, como JSON ya estructurado (responseSchema
 * de arriba obliga al modelo a devolver exactamente esa forma).
 * dificultad va de 1 (fácil) a 5 (difícil), igual escala que el
 * motor adaptativo de game.js, para que ambos modos se sientan
 * parecidos en progresión.
 */
export async function generarEjercicioIA(dificultad = 2) {
  const prompt = `Generá UN ejercicio de matemática para un estudiante de
secundaria uruguayo, de dificultad ${dificultad} en una escala de 1 a 5.
Puede ser una cuenta directa o un problema corto de una línea con contexto
cotidiano (plata, tiempo, cantidades). La respuesta "respuesta" tiene que
ser siempre un número entero. La "pista" no debe revelar el resultado.`;

  const resultado = await modeloEstructurado.generateContent(prompt);
  const datos = JSON.parse(resultado.response.text());

  if (typeof datos.enunciado !== "string" || typeof datos.respuesta !== "number") {
    throw new Error("La IA devolvió un ejercicio con formato inesperado.");
  }
  return datos;
}

/* ================= 3. CHATBOT DE DUDAS ================= */

let sesionChat = null;

function obtenerSesionChat() {
  if (!sesionChat) {
    sesionChat = modeloTexto.startChat({
      history: [],
      systemInstruction: {
        role: "system",
        parts: [{ text: INSTRUCCION_TUTOR + "\n\nAcá podés explicar conceptos con más detalle que en una pista del juego, pero segui siendo breve y claro." }],
      },
    });
  }
  return sesionChat;
}

/** Envía un mensaje del usuario al chat y devuelve la respuesta en texto */
export async function enviarMensajeChat(mensaje) {
  const chat = obtenerSesionChat();
  const resultado = await chat.sendMessage(mensaje);
  return resultado.response.text().trim();
}

/** Reinicia la conversación (ej. botón "Nueva consulta" en la UI) */
export function reiniciarChat() {
  sesionChat = null;
}
