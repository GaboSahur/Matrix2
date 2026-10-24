/**
 * chatbot.js
 * -----------------------------------------------------------
 * Interfaz del chat de dudas. La conversación (con memoria) vive
 * en firebase-ai.js; acá solo se maneja la pantalla: agregar
 * burbujas, mostrar "escribiendo...", y mostrar un error claro
 * si Gemini no responde.
 *
 * Seguridad: el texto del modelo se inserta con textContent (nunca
 * innerHTML), así que aunque la IA devolviera algo con etiquetas
 * HTML, se muestra como texto plano y no se ejecuta.
 * -----------------------------------------------------------
 */
import { enviarMensajeChat, reiniciarChat } from "./firebase-ai.js";

const MENSAJE_INICIAL =
  "¡Hola! Soy tu tutor de matemática. Preguntame lo que quieras: una cuenta que no sale, un concepto que no se entiende o cómo resolver un problema.";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const boton = document.getElementById("chat-enviar");
  const log = document.getElementById("chat-log");
  if (!form) return;

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const pregunta = input.value.trim();
    if (!pregunta) return;

    agregarMensaje(log, pregunta, "user");
    input.value = "";
    bloquearFormulario(input, boton, true);

    const indicador = agregarMensaje(log, "Pensando...", "bot typing");

    try {
      const respuesta = await enviarMensajeChat(pregunta);
      indicador.remove();
      agregarMensaje(log, respuesta, "bot");
    } catch (error) {
      console.error("Error del chatbot:", error);
      indicador.remove();
      agregarMensaje(
        log,
        "No pude responder ahora. Revisá tu conexión y probá de nuevo en un momento.",
        "bot error"
      );
    } finally {
      bloquearFormulario(input, boton, false);
      input.focus();
    }
  });

  document.getElementById("chat-reiniciar").addEventListener("click", () => {
    reiniciarChat();
    log.innerHTML = "";
    agregarMensaje(log, MENSAJE_INICIAL, "bot");
  });
});

function agregarMensaje(log, texto, clases) {
  const burbuja = document.createElement("div");
  burbuja.className = `chat-msg ${clases}`;
  const parrafo = document.createElement("p");
  parrafo.textContent = texto;
  burbuja.appendChild(parrafo);
  log.appendChild(burbuja);
  log.scrollTop = log.scrollHeight;
  return burbuja;
}

function bloquearFormulario(input, boton, bloqueado) {
  input.disabled = bloqueado;
  boton.disabled = bloqueado;
}
