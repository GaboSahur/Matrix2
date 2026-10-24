/**
 * nav-session.js
 * -----------------------------------------------------------
 * Se incluye en todas las páginas públicas. Busca el contenedor
 * #nav-cuenta en el header y lo llena con "Ingresar / Registrarme"
 * o con "👤 Nombre · Salir", según haya o no sesión activa.
 *
 * Al ser un módulo separado (no mezclado con common.js), cada
 * página decide si lo necesita agregando o no su <script type="module">
 * — mantiene common.js liviano y sin dependencia de Firebase.
 * -----------------------------------------------------------
 */
import { observarSesion, cerrarSesion } from "./firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("nav-cuenta");
  if (!contenedor) return;

  observarSesion((usuario) => {
    contenedor.innerHTML = usuario
      ? plantillaSesionActiva(usuario)
      : plantillaSinSesion();

    if (usuario) {
      document.getElementById("btn-cerrar-sesion").addEventListener("click", async () => {
        await cerrarSesion();
        window.location.href = "index.html";
      });
    }
  });
});

function plantillaSesionActiva(usuario) {
  const nombre = escaparHtml(usuario.displayName || usuario.email);
  return `
    <span class="nav-user">👤 ${nombre}</span>
    <button class="btn btn-ghost" id="btn-cerrar-sesion" type="button">Salir</button>
  `;
}

function plantillaSinSesion() {
  return `
    <a href="ingresar.html" class="btn btn-ghost">Ingresar</a>
    <a href="registro.html" class="btn btn-primary">Registrarme</a>
  `;
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
