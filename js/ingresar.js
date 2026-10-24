/**
 * ingresar.js
 * -----------------------------------------------------------
 * Maneja el envío del formulario de login de jugadores.
 * -----------------------------------------------------------
 */
import { iniciarSesion, traducirErrorAuth } from "./firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-ingresar");
  if (!form) return;
  form.addEventListener("submit", manejarIngreso);
});

async function manejarIngreso(evento) {
  evento.preventDefault();
  const boton = document.getElementById("btn-ingresar");
  const alerta = document.getElementById("alerta-error");
  alerta.classList.remove("show");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alerta.textContent = "Completá correo y contraseña.";
    alerta.classList.add("show");
    return;
  }

  boton.disabled = true;
  boton.textContent = "Ingresando...";

  try {
    await iniciarSesion(email, password);
    window.location.href = "index.html";
  } catch (error) {
    alerta.textContent = traducirErrorAuth(error);
    alerta.classList.add("show");
    boton.disabled = false;
    boton.textContent = "Iniciar sesión";
  }
}
