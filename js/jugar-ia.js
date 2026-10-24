/**
 * jugar-ia.js
 * -----------------------------------------------------------
 * Puente entre game.js y los proveedores de IA. game.js solo dispara
 * eventos; acá se decide a quién preguntarle y siempre se responde,
 * con plan B si algo falla.
 *
 *   "numerax:pedir-problema-ia" -> "numerax:problema-ia-listo" { enunciado, respuesta, pista }
 *   "numerax:pedir-pista-ia"    -> "numerax:pista-ia-lista"    { idProblema, texto }
 *
 * Proveedores para las PISTAS (se prueban en este orden):
 *   1. Backend de Claude (carpeta backend/), si hay uno configurado.
 *   2. Gemini vía Firebase AI Logic (funciona directo desde GitHub Pages).
 * Para los EJERCICIOS del nivel "Desafío IA" solo se usa Gemini.
 *
 * Gemini se carga con import() dinámico: el código de la IA solo se
 * descarga la primera vez que se necesita. Y si esa descarga falla, se
 * captura acá: no rompe el juego ni el resto del sitio.
 * -----------------------------------------------------------
 */

const TIMEOUT_PROBLEMA_MS = 8000;
const TIMEOUT_PISTA_MS = 6000;

/* ---------- Backend de Claude (opcional) ---------- */

/**
 * URL del backend de Claude. Se toma de APP_CONFIG.CLAUDE_BACKEND_URL
 * (js/config.js); si está vacía y estás en tu compu (localhost), se
 * prueba http://localhost:3001. En GitHub Pages, sin URL configurada,
 * este proveedor se saltea.
 */
function urlBackendClaude() {
  const configurada = typeof APP_CONFIG !== "undefined" ? APP_CONFIG.CLAUDE_BACKEND_URL : "";
  if (configurada) return configurada.replace(/\/$/, "");
  const esLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return esLocal ? "http://localhost:3001" : "";
}

async function pedirPistaClaude({ tema, enunciado, intentoUsuario }) {
  const base = urlBackendClaude();
  if (!base) throw new Error("No hay backend de Claude configurado");

  const respuesta = await fetch(`${base}/api/claude-hint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tema,
      problema: enunciado,
      respuestaIncorrecta: intentoUsuario || "sin respuesta",
    }),
  });
  if (!respuesta.ok) throw new Error(`El backend respondió ${respuesta.status}`);

  const datos = await respuesta.json();
  // Si el backend no tenía clave y contestó con su pista de respaldo,
  // preferimos probar con Gemini (una pista de reglas ya la tiene el jugador).
  if (datos.source !== "claude" || !datos.pista) {
    throw new Error("El backend no usó Claude");
  }
  return datos.pista;
}

/* ---------- Gemini (carga perezosa) ---------- */

let promesaGemini = null;
function cargarGemini() {
  if (!promesaGemini) {
    promesaGemini = import("./firebase-ai.js").catch((error) => {
      promesaGemini = null; // permite reintentar más tarde
      throw error;
    });
  }
  return promesaGemini;
}

/* ---------- Utilidades ---------- */

/** Rechaza la promesa si tarda más de `ms` milisegundos */
function conTimeout(promesa, ms) {
  return Promise.race([
    promesa,
    new Promise((_, rechazar) =>
      setTimeout(() => rechazar(new Error("Tiempo de espera agotado")), ms)
    ),
  ]);
}

/** Plan B: ejercicio local simple, escalado por la dificultad pedida */
function ejercicioDeRespaldo(dificultad) {
  const tope = 6 + dificultad * 6;
  const a = Math.floor(Math.random() * tope) + 2;
  const b = Math.floor(Math.random() * tope) + 2;
  return {
    enunciado: `${a} + ${b}`,
    respuesta: a + b,
    pista: `Sumá ${a} y ${b} de a poco: primero llevá uno de los dos a la decena más cercana.`,
  };
}

function emitir(nombre, detalle) {
  document.dispatchEvent(new CustomEvent(nombre, { detail: detalle }));
}

/* ---------- Eventos ---------- */

document.addEventListener("numerax:pedir-problema-ia", async (evento) => {
  const dificultad = evento.detail?.dificultad ?? 2;
  try {
    const { generarEjercicioIA } = await conTimeout(cargarGemini(), TIMEOUT_PROBLEMA_MS);
    const ejercicio = await conTimeout(generarEjercicioIA(dificultad), TIMEOUT_PROBLEMA_MS);
    emitir("numerax:problema-ia-listo", ejercicio);
  } catch (error) {
    console.warn("La IA no pudo generar el ejercicio, uso el plan B:", error);
    emitir("numerax:problema-ia-listo", ejercicioDeRespaldo(dificultad));
  }
});

document.addEventListener("numerax:pedir-pista-ia", async (evento) => {
  const datos = evento.detail;

  const proveedores = [
    () => pedirPistaClaude(datos),
    async () => {
      const { generarPistaIA } = await cargarGemini();
      return generarPistaIA(datos);
    },
  ];

  for (const pedir of proveedores) {
    try {
      const texto = await conTimeout(pedir(), TIMEOUT_PISTA_MS);
      if (texto) {
        emitir("numerax:pista-ia-lista", { idProblema: datos.idProblema, texto });
        return;
      }
    } catch (error) {
      console.warn("Proveedor de pistas no disponible:", error.message);
    }
  }
  // Ningún proveedor respondió: el jugador se queda con la pista por reglas.
});
