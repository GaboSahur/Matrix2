/**
 * auth.js
 * -----------------------------------------------------------
 * Login del panel de administrador.
 *
 * IMPORTANTE: esto es un candado de DEMO pensado para mostrar el
 * flujo de "panel de administrador con login" pedido en la
 * consigna. Las credenciales viven en config.js (texto plano) y
 * la sesión se guarda en sessionStorage: cualquiera que abra el
 * código fuente puede verlas. Para un login real hace falta un
 * backend que valide usuario/contraseña con hash (bcrypt, etc.)
 * y devuelva un token — eso es tarea de las semanas de backend.
 * -----------------------------------------------------------
 */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("form-login")) {
    inicializarLogin();
    return;
  }
  if (document.getElementById("panel-admin")) {
    protegerPanel();
    inicializarPanel();
  }
});

function inicializarLogin() {
  const form = document.getElementById("form-login");
  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const usuario = document.getElementById("usuario").value.trim();
    const clave = document.getElementById("clave").value;
    const error = document.getElementById("login-error");

    const esValido =
      usuario === APP_CONFIG.ADMIN_DEMO_USER &&
      clave === APP_CONFIG.ADMIN_DEMO_PASS;

    if (esValido) {
      sessionStorage.setItem(APP_CONFIG.STORAGE_KEYS.SESSION, "activa");
      window.location.href = "admin.html";
    } else {
      error.textContent = "Usuario o contraseña incorrectos.";
      error.classList.add("show");
    }
  });
}

function protegerPanel() {
  const sesionActiva = sessionStorage.getItem(
    APP_CONFIG.STORAGE_KEYS.SESSION
  );
  if (sesionActiva !== "activa") {
    window.location.href = "login.html";
  }
}

function inicializarPanel() {
  pintarRanking();
  pintarMensajes();

  document.getElementById("btn-logout")?.addEventListener("click", () => {
    sessionStorage.removeItem(APP_CONFIG.STORAGE_KEYS.SESSION);
    window.location.href = "login.html";
  });

  document
    .getElementById("btn-limpiar-ranking")
    ?.addEventListener("click", () => {
      if (!confirm("¿Borrar todo el ranking guardado en este navegador?")) {
        return;
      }
      localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.RANKING);
      pintarRanking();
    });
}

function pintarRanking() {
  const cuerpo = document.getElementById("ranking-body");
  const vacio = document.getElementById("ranking-vacio");
  if (!cuerpo) return;

  const ranking = JSON.parse(
    localStorage.getItem(APP_CONFIG.STORAGE_KEYS.RANKING) || "[]"
  );

  if (ranking.length === 0) {
    cuerpo.innerHTML = "";
    vacio.classList.remove("hidden");
    return;
  }

  vacio.classList.add("hidden");
  cuerpo.innerHTML = ranking
    .map(
      (jugador, indice) => `
      <tr>
        <td>${indice + 1}</td>
        <td>${escaparHtml(jugador.nombre)}</td>
        <td>${escaparHtml(jugador.nivel)}</td>
        <td>${jugador.puntaje} pts</td>
        <td>${formatearFecha(jugador.fecha)}</td>
      </tr>`
    )
    .join("");
}

function pintarMensajes() {
  const lista = document.getElementById("mensajes-body");
  const vacio = document.getElementById("mensajes-vacio");
  if (!lista) return;

  const mensajes = JSON.parse(
    localStorage.getItem(APP_CONFIG.STORAGE_KEYS.MESSAGES) || "[]"
  );

  if (mensajes.length === 0) {
    lista.innerHTML = "";
    vacio.classList.remove("hidden");
    return;
  }

  vacio.classList.add("hidden");
  lista.innerHTML = mensajes
    .map(
      (m) => `
      <tr>
        <td>${escaparHtml(m.nombre)}</td>
        <td>${escaparHtml(m.email)}</td>
        <td>${escaparHtml(m.mensaje)}</td>
        <td>${formatearFecha(m.fecha)}</td>
      </tr>`
    )
    .join("");
}

function formatearFecha(iso) {
  const fecha = new Date(iso);
  return fecha.toLocaleString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escaparHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}
