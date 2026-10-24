/**
 * game.js
 * -----------------------------------------------------------
 * Motor del juego de matemática.
 *
 * Este archivo NO sabe nada de Firebase ni de ninguna IA. Se comunica
 * con el resto por eventos del documento:
 *
 *   emite   "numerax:partida-finalizada"  -> jugar-cloud.js guarda el puntaje
 *   emite   "numerax:pedir-problema-ia"   -> jugar-ia.js pide un ejercicio a Gemini
 *   escucha "numerax:problema-ia-listo"   <- la respuesta de jugar-ia.js
 *   emite   "numerax:pedir-pista-ia"      -> jugar-ia.js pide una pista mejorada
 *   escucha "numerax:pista-ia-lista"      <- la respuesta de jugar-ia.js
 *
 * Así el juego funciona completo (con pistas por reglas) aunque la IA
 * o la nube no estén disponibles.
 * -----------------------------------------------------------
 */

import { CONTENT_LIBRARY } from "./content-library.js";
import { generarEjercicioFracciones } from "./generadores/fracciones.js";
import { generarEjercicioDecimales } from "./generadores/decimales.js";
import { generarEjercicioPorcentajes } from "./generadores/porcentajes.js";
import { evaluarRespuesta, mensajeEntradaInvalida } from "./respuestas.js";

const DURACION_PARTIDA = 60;
const ESPERA_MAXIMA_IA_MS = 12000; // si la IA no responde en este tiempo, seguimos con un ejercicio local

const adaptiveEngine = {
  nivelDificultad: 2,
  rachaAciertos: 0,
  rachaErrores: 0,

  registrarResultado(esCorrecto) {
    if (esCorrecto) {
      this.rachaAciertos++;
      this.rachaErrores = 0;
      if (this.rachaAciertos >= 3) {
        this.nivelDificultad = Math.min(5, this.nivelDificultad + 1);
        this.rachaAciertos = 0;
      }
    } else {
      this.rachaErrores++;
      this.rachaAciertos = 0;
      if (this.rachaErrores >= 2) {
        this.nivelDificultad = Math.max(1, this.nivelDificultad - 1);
        this.rachaErrores = 0;
      }
    }
  },

  factorRango() {
    return 1 + (this.nivelDificultad - 1) * 0.6;
  },
};

let estado = {
  nivelKey: "suma",
  puntaje: 0,
  correctas: 0,
  incorrectas: 0,
  racha: 0,
  problemaActual: null,
  idProblema: 0, // sube con cada problema mostrado; sirve para descartar pistas de IA que llegan tarde
  esperandoIA: false, // true mientras Gemini arma un ejercicio (el reloj se pausa)
  timeoutIA: null,
  tiempoRestante: DURACION_PARTIDA,
  intervalo: null,
  jugando: false,
};

document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector(".game-shell")) return;
  inicializarJuego();
});

function inicializarJuego() {
  const params = new URLSearchParams(window.location.search);
  const nivelKey = params.get("nivel");

  estado.nivelKey = CONTENT_LIBRARY[nivelKey] ? nivelKey : "suma";

  const nivel = CONTENT_LIBRARY[estado.nivelKey];
  document.querySelectorAll("[data-nivel-titulo]").forEach((el) => {
    el.textContent = nivel.titulo;
  });

  document
    .getElementById("form-respuesta")
    .addEventListener("submit", manejarRespuesta);

  document
    .getElementById("btn-jugar-de-nuevo")
    ?.addEventListener("click", () => window.location.reload());

  iniciarPartida();
}

function iniciarPartida() {
  estado.puntaje = 0;
  estado.correctas = 0;
  estado.incorrectas = 0;
  estado.racha = 0;
  estado.tiempoRestante = DURACION_PARTIDA;
  estado.jugando = true;

  actualizarPlacar();
  generarProblema();
  iniciarTemporizador();

  document.getElementById("pantalla-juego").classList.remove("hidden");
  document.getElementById("pantalla-resultado").classList.add("hidden");
}

function iniciarTemporizador() {
  clearInterval(estado.intervalo);
  actualizarTimer();
  estado.intervalo = setInterval(() => {
    if (estado.esperandoIA) return; // el reloj no corre mientras la IA piensa: no es culpa del jugador
    estado.tiempoRestante--;
    actualizarTimer();
    if (estado.tiempoRestante <= 0) {
      finalizarPartida();
    }
  }, 1000);
}

function actualizarTimer() {
  const el = document.getElementById("timer");
  if (el) el.textContent = `${estado.tiempoRestante}s`;
}

/* ================= GENERACIÓN DE PROBLEMAS ================= */

function generarProblema() {
  if (estado.nivelKey === "ia") {
    pedirProblemaIA();
    return;
  }

  const operacion =
    estado.nivelKey === "mixto"
      ? ["suma", "resta", "multiplicacion", "division"][
          Math.floor(Math.random() * 4)
        ]
      : estado.nivelKey;

  // Temas con generador propio (fracciones, decimales, porcentajes)
  const ejercicioTema = generarEjercicioPorTema(operacion);
  if (ejercicioTema) {
    presentarProblema(problemaDesdeEjercicio(ejercicioTema));
    return;
  }

  presentarProblema(
    operacion === "potencias" ? generarPotencia() : generarOperacionBasica(operacion)
  );
}

/** Suma, resta, multiplicación y división con números que escalan con la dificultad */
function generarOperacionBasica(operacion) {
  const config = CONTENT_LIBRARY[operacion];
  const factor = adaptiveEngine.factorRango();
  const min = config.min;
  const max = Math.round(config.max * factor);

  let a = aleatorioEntre(min, max);
  let b = aleatorioEntre(min, max);
  let resultado;

  switch (operacion) {
    case "suma":
      resultado = a + b;
      break;
    case "resta":
      if (b > a) [a, b] = [b, a];
      resultado = a - b;
      break;
    case "multiplicacion":
      resultado = a * b;
      break;
    case "division":
      b = aleatorioEntre(min, Math.max(min + 1, Math.round(6 * factor)));
      resultado = aleatorioEntre(min, Math.round(10 * factor));
      a = b * resultado;
      break;
  }

  return {
    a,
    b,
    operacion,
    simbolo: config.simbolo,
    enunciado: `${a} ${config.simbolo} ${b}`,
    tipoRespuesta: "numero",
    resultado,
  };
}

/** Cuadrados y, desde dificultad 4, también cubos (con base chica para que el resultado no explote) */
function generarPotencia() {
  const { min, max } = CONTENT_LIBRARY.potencias;
  const factor = adaptiveEngine.factorRango();
  const exponente = adaptiveEngine.nivelDificultad >= 4 && Math.random() < 0.5 ? 3 : 2;
  const tope = exponente === 3 ? 10 : Math.round(max * factor);
  const base = aleatorioEntre(min, tope);
  const superindice = exponente === 3 ? "³" : "²";

  return {
    operacion: "potencias",
    tema: "potencias",
    enunciado: `${base}${superindice} = ?`,
    tipoRespuesta: "numero",
    resultado: base ** exponente,
    pista: `Pista: ${base}${superindice} significa ${Array(exponente).fill(base).join(" × ")}.`,
  };
}

// Generadores de ejercicios específicos por tema
function generarEjercicioPorTema(tema) {
  switch (tema) {
    case "fracciones":
      return generarEjercicioFracciones();
    case "decimales":
      return generarEjercicioDecimales();
    case "porcentajes":
      return generarEjercicioPorcentajes();
    default:
      return null;
  }
}

/** Convierte lo que devuelven los generadores externos al formato de problema del juego */
function problemaDesdeEjercicio(ejercicio) {
  const esFraccion = ejercicio.tema === "fracciones";
  return {
    operacion: ejercicio.tema,
    tema: ejercicio.tema,
    enunciado: ejercicio.enunciado,
    tipoRespuesta: esFraccion ? "fraccion" : "numero",
    resultado: esFraccion ? ejercicio.respuesta : Number(ejercicio.respuesta),
    respuestaTexto: ejercicio.respuesta, // se muestra tal cual (ej. "0.50")
    pista: ejercicio.pista,
  };
}

/** Muestra un problema en pantalla y deja el input listo para responder */
function presentarProblema(problema) {
  estado.problemaActual = problema;
  estado.idProblema++;

  document.getElementById("expresion").textContent = problema.enunciado;

  const input = document.getElementById("input-respuesta");
  const esFraccion = problema.tipoRespuesta === "fraccion";
  input.disabled = false;
  input.value = "";
  input.inputMode = esFraccion ? "text" : "decimal"; // teclado numérico con coma en el celular
  input.placeholder = esFraccion ? "ej: 3/4" : "";
  input.focus();

  ocultarFeedback();
  ocultarTutor();
}

/* ================= NIVEL "DESAFÍO IA" ================= */

function pedirProblemaIA() {
  estado.problemaActual = null;
  estado.esperandoIA = true;

  document.getElementById("expresion").textContent = "Generando con IA...";
  const input = document.getElementById("input-respuesta");
  input.value = "";
  input.disabled = true;
  ocultarFeedback();
  ocultarTutor();

  // Red de seguridad: si nadie responde (por ejemplo, jugar-ia.js no está
  // cargado), seguimos con un ejercicio local en vez de dejar el juego colgado.
  clearTimeout(estado.timeoutIA);
  estado.timeoutIA = setTimeout(() => {
    if (!estado.esperandoIA) return;
    estado.esperandoIA = false;
    presentarProblema(generarOperacionBasica("suma"));
  }, ESPERA_MAXIMA_IA_MS);

  document.dispatchEvent(
    new CustomEvent("numerax:pedir-problema-ia", {
      detail: { dificultad: adaptiveEngine.nivelDificultad },
    })
  );
}

function recibirProblemaIA({ enunciado, respuesta, pista }) {
  // Si llegó tarde (ya seguimos con el plan local) o cambió el estado, se ignora
  if (estado.nivelKey !== "ia" || !estado.jugando || !estado.esperandoIA) return;

  clearTimeout(estado.timeoutIA);
  estado.esperandoIA = false;

  presentarProblema({
    operacion: "ia",
    tema: "ia",
    enunciado,
    tipoRespuesta: "numero",
    resultado: Number(respuesta),
    pista,
  });
}

document.addEventListener("numerax:problema-ia-listo", (evento) =>
  recibirProblemaIA(evento.detail)
);

/* ================= RESPUESTAS ================= */

function manejarRespuesta(evento) {
  evento.preventDefault();
  if (!estado.jugando || !estado.problemaActual) return;

  const problema = estado.problemaActual;
  const input = document.getElementById("input-respuesta");
  const { valida, correcta: esCorrecto } = evaluarRespuesta(input.value, problema);

  if (!valida) {
    mostrarFeedback(mensajeEntradaInvalida(problema), false);
    return;
  }

  adaptiveEngine.registrarResultado(esCorrecto);

  if (esCorrecto) {
    estado.correctas++;
    estado.racha++;
    const puntosPorDificultad = 10 * adaptiveEngine.nivelDificultad;
    estado.puntaje += puntosPorDificultad;
    mostrarFeedback(`¡Correcto! +${puntosPorDificultad} pts`, true);
  } else {
    estado.incorrectas++;
    estado.racha = 0;
    const respuestaVisible = problema.respuestaTexto ?? problema.resultado;
    mostrarFeedback(`Casi. La respuesta era ${respuestaVisible}.`, false);

    if (problema.operacion === "ia") {
      // La pista ya vino de Gemini junto con el ejercicio.
      mostrarTutor(problema.pista || "Revisá el enunciado con calma y probá de nuevo.", {
        generadaPorIA: true,
      });
    } else {
      // Pista por reglas al instante (0 ms de espera) y, en paralelo, se pide una
      // versión mejorada a la IA. Si llega a tiempo reemplaza a la primera; si
      // no llega o falla, el jugador ya tiene su pista y nunca se bloquea.
      mostrarTutor(generarPista(problema));
      document.dispatchEvent(
        new CustomEvent("numerax:pedir-pista-ia", {
          detail: {
            idProblema: estado.idProblema,
            tema: problema.tema || problema.operacion,
            enunciado: problema.enunciado,
            intentoUsuario: input.value.trim(),
            respuestaCorrecta: respuestaVisible,
          },
        })
      );
    }
  }

  actualizarPlacar();

  setTimeout(() => {
    if (estado.jugando) generarProblema();
  }, esCorrecto ? 500 : 1600);
}

function generarPista(problema) {
  if (problema.pista) return problema.pista; // generadores de tema y potencias traen la suya

  const { a, b, operacion } = problema;
  switch (operacion) {
    case "suma":
      return `Pista: pensá ${a} y sumale de a poco hasta llegar a ${b} más. Redondear a la decena más cercana ayuda.`;
    case "resta":
      return `Pista: contá hacia atrás desde ${a} en pasos de a uno, o completá desde ${b} hasta ${a}.`;
    case "multiplicacion":
      return `Pista: probá descomponer ${b} en partes fáciles, por ejemplo ${b - 1} + 1, y multiplicá cada parte por ${a}.`;
    case "division":
      return `Pista: pensala como una multiplicación al revés: ¿por cuánto hay que multiplicar ${b} para llegar a ${a}?`;
    default:
      return generarPistaFallback(operacion);
  }
}

// Pistas genéricas por tema, para cuando no hay una más específica
function generarPistaFallback(operacion) {
  const pistas = {
    suma: "Pista: sumá de derecha a izquierda y llevá si hace falta.",
    resta: "Pista: restá de derecha a izquierda. Si hace falta, pedí prestado.",
    multiplicacion: "Pista: multiplicá cada parte y luego sumá los resultados.",
    division: "Pista: pensá cuántas veces entra el divisor dentro del dividendo.",
    fracciones: "Pista: busca un denominador común antes de sumar o restar.",
    decimales: "Pista: alineá por la coma decimal y resolvé.",
    porcentajes: "Pista: pensá como una proporción sobre 100.",
  };
  return pistas[operacion] || "Pensá bien antes de responder.";
}

/**
 * jugar-ia.js responde a "numerax:pedir-pista-ia" con esta pista mejorada.
 * Solo se muestra si sigue siendo la MISMA pregunta (idProblema): si el
 * jugador ya pasó a otra, la pista llegó tarde y confundiría.
 */
document.addEventListener("numerax:pista-ia-lista", (evento) => {
  if (!estado.jugando || evento.detail.idProblema !== estado.idProblema) return;
  mostrarTutor(evento.detail.texto, { generadaPorIA: true });
});

/* ================= INTERFAZ ================= */

function actualizarPlacar() {
  document.getElementById("puntaje").textContent = estado.puntaje;
  document.getElementById("racha").textContent = `🔥 ${estado.racha}`;
  const nivelEl = document.getElementById("nivel-dificultad");
  if (nivelEl) nivelEl.textContent = adaptiveEngine.nivelDificultad;
}

function mostrarFeedback(mensaje, esCorrecto) {
  const el = document.getElementById("feedback");
  el.textContent = mensaje;
  el.classList.remove("ok", "bad");
  el.classList.add(esCorrecto ? "ok" : "bad");
}

function ocultarFeedback() {
  const el = document.getElementById("feedback");
  el.textContent = "";
  el.classList.remove("ok", "bad");
}

function mostrarTutor(texto, { generadaPorIA = false } = {}) {
  const box = document.getElementById("tutor-box");
  box.querySelector(".tutor-text").textContent = texto;
  box.querySelector(".tutor-label").textContent = generadaPorIA
    ? "Tutor · pista ✨ IA"
    : "Tutor · pista";
  box.classList.remove("hidden");
}

function ocultarTutor() {
  document.getElementById("tutor-box")?.classList.add("hidden");
}

/* ================= FIN DE PARTIDA ================= */

function finalizarPartida() {
  estado.jugando = false;
  estado.esperandoIA = false;
  clearInterval(estado.intervalo);
  clearTimeout(estado.timeoutIA);

  document.getElementById("pantalla-juego").classList.add("hidden");
  const resultado = document.getElementById("pantalla-resultado");
  resultado.classList.remove("hidden");

  document.getElementById("resultado-puntaje").textContent = estado.puntaje;
  document.getElementById("resultado-correctas").textContent = estado.correctas;
  document.getElementById("resultado-incorrectas").textContent = estado.incorrectas;

  guardarEnRanking();

  document.dispatchEvent(
    new CustomEvent("numerax:partida-finalizada", {
      detail: { puntaje: estado.puntaje, nivel: CONTENT_LIBRARY[estado.nivelKey].titulo },
    })
  );
}

function guardarEnRanking() {
  const nombre =
    localStorage.getItem("numerax_player_name") ||
    prompt("¿Cómo te llamás? (para el ranking)") ||
    "Jugador anónimo";
  localStorage.setItem("numerax_player_name", nombre);

  const clave = APP_CONFIG.STORAGE_KEYS.RANKING;
  const ranking = JSON.parse(localStorage.getItem(clave) || "[]");

  ranking.push({
    nombre,
    puntaje: estado.puntaje,
    nivel: CONTENT_LIBRARY[estado.nivelKey].titulo,
    fecha: new Date().toISOString(),
  });

  ranking.sort((a, b) => b.puntaje - a.puntaje);
  localStorage.setItem(clave, JSON.stringify(ranking.slice(0, 50)));
}

function aleatorioEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
