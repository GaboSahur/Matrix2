/**
 * jugar-cloud.js
 * -----------------------------------------------------------
 * Escucha el evento "numerax:partida-finalizada" que dispara
 * game.js y, si el jugador tiene sesión iniciada, guarda el
 * resultado en el ranking global (Firestore). Si no hay sesión,
 * muestra un cartel invitando a registrarse — el puntaje local
 * (localStorage) igual queda guardado, pero solo cuenta para
 * el ranking global si jugás logueado.
 *
 * Separar esto de game.js (en vez de importar Firebase ahí
 * directo) mantiene el motor del juego independiente de la nube:
 * game.js funciona perfecto aunque este archivo no se cargue.
 * -----------------------------------------------------------
 */
import { auth } from "./firebase-config.js";
import { guardarPartida } from "./firebase-ranking.js";

document.addEventListener("DOMContentLoaded", () => {
  const aviso = document.getElementById("aviso-ranking-cloud");
  if (!aviso) return;

  document.addEventListener("numerax:partida-finalizada", async (evento) => {
    if (!auth.currentUser) {
      aviso.textContent = "Iniciá sesión para que este puntaje cuente en el ranking global.";
      aviso.className = "cloud-msg warn";
      return;
    }

    aviso.textContent = "Guardando en el ranking global...";
    aviso.className = "cloud-msg warn";

    try {
      await guardarPartida(evento.detail);
      aviso.textContent = "✔ Tu puntaje ya está en el ranking global.";
      aviso.className = "cloud-msg ok";
    } catch (error) {
      console.error("Error al guardar en el ranking global:", error);
      aviso.textContent = "No se pudo sincronizar con el ranking global. Se guardó solo localmente.";
      aviso.className = "cloud-msg warn";
    }
  });
});
