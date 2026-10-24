/**
 * contacto.js
 * -----------------------------------------------------------
 * Formulario de contacto real: valida los campos en el navegador
 * y guarda los mensajes en localStorage bajo la clave definida en
 * config.js. El panel de admin (admin.js) los lee desde ahí.
 *
 * Nota para producción: localStorage vive solo en el navegador de
 * quien completa el formulario. Para que el mensaje realmente
 * "llegue" al dueño del negocio hace falta un backend (API +
 * base de datos) que reciba el POST del formulario. Ese backend
 * es justamente lo que se construye en las semanas de
 * "Backend + React" del roadmap.
 * -----------------------------------------------------------
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-contacto");
  if (!form) return;

  form.addEventListener("submit", manejarEnvio);
});

function manejarEnvio(evento) {
  evento.preventDefault();
  const form = evento.target;

  const campos = {
    nombre: form.querySelector("#nombre"),
    email: form.querySelector("#email"),
    mensaje: form.querySelector("#mensaje"),
  };

  let esValido = true;

  if (campos.nombre.value.trim().length < 2) {
    marcarInvalido(campos.nombre, true);
    esValido = false;
  } else {
    marcarInvalido(campos.nombre, false);
  }

  if (!validarEmail(campos.email.value)) {
    marcarInvalido(campos.email, true);
    esValido = false;
  } else {
    marcarInvalido(campos.email, false);
  }

  if (campos.mensaje.value.trim().length < 10) {
    marcarInvalido(campos.mensaje, true);
    esValido = false;
  } else {
    marcarInvalido(campos.mensaje, false);
  }

  ocultarAlertas();

  if (!esValido) {
    mostrarAlerta("error", "Revisá los campos marcados en rojo.");
    return;
  }

  guardarMensaje({
    nombre: campos.nombre.value.trim(),
    email: campos.email.value.trim(),
    mensaje: campos.mensaje.value.trim(),
    fecha: new Date().toISOString(),
  });

  mostrarAlerta(
    "success",
    "¡Gracias! Tu mensaje quedó guardado. Te vamos a responder pronto."
  );
  form.reset();
}

function validarEmail(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

function marcarInvalido(input, invalido) {
  const wrapper = input.closest(".field");
  wrapper.classList.toggle("invalid", invalido);
}

function mostrarAlerta(tipo, texto) {
  const el = document.getElementById(`alerta-${tipo}`);
  if (!el) return;
  el.textContent = texto;
  el.classList.add("show");
}

function ocultarAlertas() {
  document
    .querySelectorAll(".alert")
    .forEach((el) => el.classList.remove("show"));
}

function guardarMensaje(mensaje) {
  const clave = APP_CONFIG.STORAGE_KEYS.MESSAGES;
  const mensajes = JSON.parse(localStorage.getItem(clave) || "[]");
  mensajes.unshift(mensaje);
  localStorage.setItem(clave, JSON.stringify(mensajes.slice(0, 100)));
}
