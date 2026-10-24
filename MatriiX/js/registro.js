/**
 * registro.js
 * -----------------------------------------------------------
 * Validación en tiempo real del formulario de registro +
 * medidor de fuerza de contraseña + alta de la cuenta en
 * Firebase Auth (vía firebase-auth.js).
 * -----------------------------------------------------------
 */
import { registrarUsuario, traducirErrorAuth } from "./firebase-auth.js";

const REGLAS = {
  nombre: (v) => v.trim().length >= 2,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  password: (v) => v.length >= 6,
  "password-confirmar": (v) => v === document.getElementById("password").value,
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-registro");
  if (!form) return;

  Object.keys(REGLAS).forEach((id) => {
    document.getElementById(id).addEventListener("input", () => validarCampo(id));
  });

  document.getElementById("password").addEventListener("input", actualizarMedidorFuerza);

  form.addEventListener("submit", manejarRegistro);
});

function validarCampo(id) {
  const input = document.getElementById(id);
  const wrapper = input.closest(".field");
  const esValido = REGLAS[id](input.value);
  wrapper.classList.toggle("invalid", !esValido && input.value.length > 0);
  return esValido;
}

/** Calcula una fuerza simple (0 a 3) según longitud, mayúsculas/números y símbolos */
function calcularFuerza(password) {
  let puntos = 0;
  if (password.length >= 6) puntos++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) puntos++;
  if (/[^A-Za-z0-9]/.test(password) && password.length >= 8) puntos++;
  return puntos;
}

function actualizarMedidorFuerza() {
  const password = document.getElementById("password").value;
  const medidor = document.getElementById("password-meter");
  const pista = document.getElementById("password-hint");
  const fuerza = calcularFuerza(password);

  medidor.dataset.fuerza = String(fuerza);

  const mensajes = {
    0: "Usá letras, números y algún símbolo para una contraseña más fuerte.",
    1: "Contraseña débil: probá sumar mayúsculas y números.",
    2: "Contraseña aceptable. Un símbolo extra la hace más fuerte.",
    3: "¡Contraseña fuerte!",
  };
  pista.textContent = mensajes[fuerza];
}

async function manejarRegistro(evento) {
  evento.preventDefault();
  const boton = document.getElementById("btn-registrar");
  const alerta = document.getElementById("alerta-error");
  alerta.classList.remove("show");

  const camposValidos = Object.keys(REGLAS).map(validarCampo);
  if (camposValidos.includes(false)) {
    alerta.textContent = "Revisá los campos marcados en rojo.";
    alerta.classList.add("show");
    return;
  }

  const nombre = document.getElementById("nombre").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  boton.disabled = true;
  boton.textContent = "Creando cuenta...";

  try {
    await registrarUsuario(nombre, email, password);
    window.location.href = "index.html";
  } catch (error) {
    alerta.textContent = traducirErrorAuth(error);
    alerta.classList.add("show");
    boton.disabled = false;
    boton.textContent = "Crear cuenta";
  }
}
