/**
 * firebase-auth.js
 * -----------------------------------------------------------
 * Autenticación de JUGADORES (cuentas reales, distinto del login
 * de admin en js/auth.js que es solo un candado de demo local).
 *
 * Usa Firebase Authentication con email + contraseña. Firebase
 * se encarga de guardar y verificar las contraseñas de forma
 * segura — nunca las vemos ni las guardamos nosotros.
 * -----------------------------------------------------------
 */
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

/**
 * Crea la cuenta en Firebase Auth y, además, un documento de
 * perfil en Firestore (colección "usuarios") donde guardamos
 * el mejor puntaje histórico del jugador — Firebase Auth por sí
 * solo no guarda datos de negocio como puntajes, solo identidad.
 */
export async function registrarUsuario(nombre, email, password) {
  try {
    const credencial = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credencial.user, { displayName: nombre.trim() });
    await setDoc(doc(db, "usuarios", credencial.user.uid), {
      nombre: nombre.trim(),
      email: email.trim(),
      mejorPuntaje: 0,
      creadoEn: serverTimestamp(),
    });
    return credencial.user;
  } catch (error) {
    console.error("Error en registrarUsuario:", error.code, error.message);
    throw error;
  }
}
export function iniciarSesion(email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function cerrarSesion() {
  return signOut(auth);
}

/**
 * Suscribe un callback que se ejecuta cada vez que cambia el
 * estado de sesión (login, logout, o al cargar la página con
 * una sesión ya activa). Devuelve la función para des-suscribirse.
 */
export function observarSesion(callback) {
  return onAuthStateChanged(auth, callback);
}

/** Traduce los códigos de error de Firebase a mensajes en español, entendibles */
export function traducirErrorAuth(error) {
  const mapa = {
    "auth/email-already-in-use": "Ese correo ya tiene una cuenta registrada.",
    "auth/invalid-email": "El correo no tiene un formato válido.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/user-not-found": "No hay ninguna cuenta con ese correo.",
    "auth/wrong-password": "La contraseña es incorrecta.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/too-many-requests": "Demasiados intentos. Esperá un momento y probá de nuevo.",
  };
  return mapa[error.code] || "Ocurrió un error inesperado. Probá de nuevo.";
}
