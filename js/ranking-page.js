/**
 * ranking-page.js
 * -----------------------------------------------------------
 * Controla las 3 tabs del ranking (semanal, mensual, histórico)
 * y pinta la tabla con los datos que trae firebase-ranking.js.
 * Cachea cada período ya consultado para no repetir lecturas a
 * Firestore innecesariamente si el usuario va y vuelve entre tabs.
 * -----------------------------------------------------------
 */
import {
  obtenerRankingSemanal,
  obtenerRankingMensual,
  obtenerRankingHistorico,
} from "./firebase-ranking.js";

const CONSULTAS = {
  semanal: obtenerRankingSemanal,
  mensual: obtenerRankingMensual,
  historico: obtenerRankingHistorico,
};

const cache = {};

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      cargarRanking(tab.dataset.periodo);
    });
  });

  cargarRanking("semanal");
});

async function cargarRanking(periodo) {
  mostrarEstado("cargando");

  try {
    if (!cache[periodo]) {
      cache[periodo] = await CONSULTAS[periodo]();
    }
    pintarTabla(cache[periodo]);
  } catch (error) {
    console.error("Error al traer el ranking:", error);
    mostrarEstado("vacio", "No se pudo cargar el ranking. Probá de nuevo en un momento.");
  }
}

function pintarTabla(jugadores) {
  const cuerpo = document.getElementById("ranking-body");

  if (!jugadores || jugadores.length === 0) {
    mostrarEstado("vacio");
    return;
  }

  document.getElementById("tabla-ranking").classList.remove("hidden");
  document.getElementById("ranking-vacio").classList.add("hidden");
  document.getElementById("ranking-cargando").classList.add("hidden");

  cuerpo.innerHTML = jugadores
    .map((jugador, indice) => {
      const posicion = indice + 1;
      const claseMedalla = posicion <= 3 ? ` top-${posicion}` : "";
      return `
        <tr>
          <td><span class="rank-position${claseMedalla}">${posicion}</span></td>
          <td>${escaparHtml(jugador.nombre)}</td>
          <td>${escaparHtml(jugador.nivel)}</td>
          <td>${jugador.puntaje} pts</td>
        </tr>`;
    })
    .join("");
}

function mostrarEstado(estado, mensajeVacio) {
  const tabla = document.getElementById("tabla-ranking");
  const vacio = document.getElementById("ranking-vacio");
  const cargando = document.getElementById("ranking-cargando");

  tabla.classList.add("hidden");
  vacio.classList.add("hidden");
  cargando.classList.add("hidden");

  if (estado === "cargando") {
    cargando.classList.remove("hidden");
  } else if (estado === "vacio") {
    if (mensajeVacio) vacio.textContent = mensajeVacio;
    vacio.classList.remove("hidden");
  }
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
